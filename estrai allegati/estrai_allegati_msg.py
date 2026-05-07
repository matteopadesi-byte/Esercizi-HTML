from pathlib import Path
import re
import shutil
from collections import defaultdict

import extract_msg  # pip install extract-msg


# === CONFIGURAZIONE ===
INPUT_DIR = Path(r"C:\Users\matteo.padesi_alliev\Desktop\email_msg")
OUTPUT_DIR = Path(r"C:\Users\matteo.padesi_alliev\Desktop\allegati_estratti")
RECURSIVE = True

# === FILTRI ===
# Se True, simula tutto senza scrivere nulla su disco — usalo per il primo test
DRY_RUN = False

# Estensioni ammesse (minuscolo, con punto). Set vuoto = accetta qualsiasi estensione.
ALLOWED_EXTENSIONS = {".pdf", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt", ".zip"}

# Dimensione massima per singolo allegato in MB. None = nessun limite.
MAX_FILE_SIZE_MB = 50

# Dimensione massima totale estratta in MB. None = nessun limite.
MAX_TOTAL_SIZE_MB = 500

# Dimensione minima per singolo allegato in KB. Scarta firme e loghi. None = nessun limite.
MIN_FILE_SIZE_KB = 10

# Parole chiave da cercare nel nome del file allegato (case-insensitive).
# Basta che il nome contenga UNA delle parole per essere estratto. Lista vuota = nessun filtro.
KEYWORD_FILTER = []  # es. ["fattura", "contratto", "offerta"]

# Profondità massima di ricerca nelle email annidate (email allegate ad altre email).
# 0 = solo allegati diretti, senza entrare nelle email allegate.
# 3 = entra fino a 3 livelli di annidamento. None = nessun limite.
MAX_DEPTH = 3


def sanitize_name(name, max_len=120):
    name = (name or "").strip()
    name = re.sub(r'[\\/:*?"<>|]+', "_", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    if not name:
        name = "senza_nome"
    return name[:max_len].rstrip(" .")


def unique_path(path):
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    i = 1
    while True:
        candidate = parent / f"{stem}_{i}{suffix}"
        if not candidate.exists():
            return candidate
        i += 1


def list_msg_files(folder, recursive):
    pattern = "**/*.msg" if recursive else "*.msg"
    return sorted(folder.glob(pattern))


def get_attachment_filename(att):
    for attr in ("longFilename", "filename", "displayName", "name"):
        value = getattr(att, attr, None)
        if value:
            return sanitize_name(str(value))
    return "allegato.bin"


def get_attachment_size(att):
    """Restituisce la dimensione in byte, o None se non determinabile prima del salvataggio."""
    data = getattr(att, "data", None)
    if data is not None:
        return len(data)
    for attr in ("size", "fileSize"):
        val = getattr(att, attr, None)
        if isinstance(val, int) and val > 0:
            return val
    return None


def save_attachment(att, destination):
    destination.mkdir(parents=True, exist_ok=True)
    filename = get_attachment_filename(att)
    final_path = unique_path(destination / filename)

    data = getattr(att, "data", None)
    if data is not None:
        with open(final_path, "wb") as f:
            f.write(data)
        return final_path

    temp_dir = destination / "_tmp_extract_msg"
    temp_dir.mkdir(parents=True, exist_ok=True)

    before = set(p.name for p in temp_dir.iterdir())
    att.save(customPath=str(temp_dir))
    after = set(p.name for p in temp_dir.iterdir())

    new_files = [temp_dir / name for name in (after - before)]
    if not new_files:
        candidates = sorted(
            [p for p in temp_dir.iterdir() if p.is_file()],
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if not candidates:
            raise RuntimeError("Impossibile individuare il file allegato salvato")
        saved_tmp = candidates[0]
    else:
        saved_tmp = sorted(new_files, key=lambda p: p.stat().st_mtime, reverse=True)[0]

    final_path = unique_path(destination / sanitize_name(saved_tmp.name))
    shutil.move(str(saved_tmp), str(final_path))

    try:
        shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception:
        pass

    return final_path


def build_email_folder_name(msg, msg_path):
    subject = getattr(msg, "subject", None)
    date_str = ""
    try:
        msg_date = getattr(msg, "date", None)
        if msg_date:
            date_str = sanitize_name(str(msg_date))[:30]
    except Exception:
        pass

    parts = []
    if date_str:
        parts.append(date_str)
    if subject:
        parts.append(str(subject))
    if not parts:
        parts.append(msg_path.stem)

    return sanitize_name(" - ".join(parts), max_len=150)


def format_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def _open_embedded_msg(att, ext):
    """
    Tenta di aprire l'allegato come email annidata.
    Restituisce (msg, should_close): should_close indica se siamo noi ad aver aperto il msg
    e dobbiamo quindi chiuderlo. Se il msg e' gia' gestito dalla libreria, should_close=False.
    """
    # extract_msg espone i messaggi annidati direttamente tramite l'attributo .msg
    embedded = getattr(att, "msg", None)
    if embedded is not None:
        return embedded, False

    # Fallback: se il nome del file e' .msg, proviamo ad aprire i byte direttamente
    if ext == ".msg":
        data = getattr(att, "data", None)
        if data:
            try:
                return extract_msg.Message(data), True
            except Exception:
                pass

    return None, False


def process_attachments(attachments, email_folder, depth, top_level_msg_path, state):
    """
    Elabora gli allegati di un messaggio, ricorrendo nelle email annidate fino a MAX_DEPTH.

    depth: livello corrente di annidamento (0 = allegati diretti dell'email principale)
    state: dizionario mutabile con contatori e liste condivisi tra tutti i livelli
    """
    saved_count = 0
    indent = "  " * (depth + 1)

    for att_idx, att in enumerate(attachments):
        if state["budget_exceeded"]:
            break

        att_name = get_attachment_filename(att)
        ext = Path(att_name).suffix.lower()
        att_size = get_attachment_size(att)
        size_label = f" ({format_size(att_size)})" if att_size is not None else " (dim. sconosciuta)"

        # Tenta di aprire come email annidata se siamo entro il limite di profondita'
        can_recurse = MAX_DEPTH is None or depth < MAX_DEPTH
        if can_recurse:
            embedded_msg, should_close = _open_embedded_msg(att, ext)
            if embedded_msg is not None:
                try:
                    embedded_atts = getattr(embedded_msg, "attachments", []) or []
                    embedded_folder_name = build_email_folder_name(embedded_msg, Path(att_name))
                    embedded_folder = unique_path(
                        email_folder / sanitize_name(f"[livello {depth + 1}] {embedded_folder_name}", max_len=150)
                    )
                    if embedded_atts:
                        print(f"{indent}-> Email annidata (livello {depth + 1}): {att_name}")
                        nested_saved = process_attachments(
                            embedded_atts, embedded_folder, depth + 1, top_level_msg_path, state
                        )
                        saved_count += nested_saved
                    else:
                        print(f"{indent}-> Email annidata senza allegati: {att_name}")
                finally:
                    if should_close:
                        try:
                            embedded_msg.close()
                        except Exception:
                            pass
                continue

        # Allegato normale: applica i filtri
        skip_reason = None

        if ALLOWED_EXTENSIONS and ext not in ALLOWED_EXTENSIONS:
            skip_reason = f"estensione '{ext}' non ammessa"
        elif KEYWORD_FILTER and not any(kw.lower() in att_name.lower() for kw in KEYWORD_FILTER):
            skip_reason = "parola chiave non trovata nel nome"
        elif MIN_FILE_SIZE_KB is not None and att_size is not None and att_size < MIN_FILE_SIZE_KB * 1024:
            skip_reason = "troppo piccolo"
        elif MAX_FILE_SIZE_MB is not None and att_size is not None and att_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            skip_reason = "troppo grande"
        elif MAX_TOTAL_SIZE_MB is not None and att_size is not None and state["total_bytes_saved"] + att_size > MAX_TOTAL_SIZE_MB * 1024 * 1024:
            print(f"\n{indent}LIMITE TOTALE DI {MAX_TOTAL_SIZE_MB} MB RAGGIUNTO — estrazione interrotta.")
            state["budget_exceeded"] = True
            break

        if skip_reason:
            print(f"{indent}- Saltato ({skip_reason}{size_label}): {att_name}")
            state["skipped_items"].append({
                "msg_path": str(top_level_msg_path),
                "att_index": att_idx,
                "att_name": att_name,
                "att_size": att_size,
                "reason": skip_reason,
                "email_folder": str(email_folder),
                "is_nested": depth > 0,
            })
            continue

        if DRY_RUN:
            print(f"{indent}- [DRY RUN] Verrebbe salvato{size_label}: {att_name}")
            if att_size is not None:
                state["total_bytes_saved"] += att_size
            saved_count += 1
            state["total_attachments"] += 1
        else:
            try:
                saved_file = save_attachment(att, email_folder)
                actual_size = saved_file.stat().st_size
                state["total_bytes_saved"] += actual_size
                saved_count += 1
                state["total_attachments"] += 1
                print(f"{indent}- Salvato ({format_size(actual_size)}): {saved_file.name}")

                if MAX_TOTAL_SIZE_MB is not None and state["total_bytes_saved"] > MAX_TOTAL_SIZE_MB * 1024 * 1024:
                    print(f"\n{indent}LIMITE TOTALE DI {MAX_TOTAL_SIZE_MB} MB RAGGIUNTO — estrazione interrotta.")
                    state["budget_exceeded"] = True
                    break
            except Exception as e:
                state["errors"].append((str(top_level_msg_path), f"Errore allegato: {e}"))
                print(f"{indent}- Errore allegato: {e}")

    return saved_count


def extract_skipped_attachments(skipped_items):
    """Riapre ogni .msg e salva gli allegati di primo livello precedentemente saltati dai filtri."""
    print("\n=== ESTRAZIONE FILE SALTATI ===")

    by_msg = defaultdict(list)
    for item in skipped_items:
        by_msg[item["msg_path"]].append(item)

    extracted = 0
    errors = []

    for msg_path_str, items in by_msg.items():
        msg_path = Path(msg_path_str)
        print(f"\n{msg_path}")
        try:
            msg = extract_msg.Message(str(msg_path))
            try:
                attachments = getattr(msg, "attachments", []) or []
                for item in items:
                    att_idx = item["att_index"]
                    if att_idx >= len(attachments):
                        print(f"  - Errore: indice allegato {att_idx} non valido")
                        continue
                    att = attachments[att_idx]
                    email_folder = Path(item["email_folder"])
                    try:
                        saved_file = save_attachment(att, email_folder)
                        print(f"  - Salvato ({format_size(saved_file.stat().st_size)}): {saved_file.name}")
                        extracted += 1
                    except Exception as e:
                        errors.append((msg_path_str, f"Errore allegato: {e}"))
                        print(f"  - Errore: {e}")
            finally:
                msg.close()
        except Exception as e:
            errors.append((msg_path_str, f"Errore lettura MSG: {e}"))
            print(f"  - Errore lettura MSG: {e}")

    print(f"\nFile estratti: {extracted}")
    if errors:
        print(f"Errori: {len(errors)}")
        for path, err in errors:
            print(f"  - {path}\n    {err}")


def main():
    dry_label = " [DRY RUN — nessun file verra scritto]" if DRY_RUN else ""
    depth_label = str(MAX_DEPTH) if MAX_DEPTH is not None else "illimitata"
    print(f"=== ESTRAZIONE ALLEGATI DA FILE .MSG{dry_label} ===")
    print(f"Input    : {INPUT_DIR}")
    print(f"Output   : {OUTPUT_DIR}")
    print(f"Ricorsivo: {RECURSIVE}")
    print()
    print("=== FILTRI ATTIVI ===")
    if ALLOWED_EXTENSIONS:
        print(f"  Estensioni ammesse : {', '.join(sorted(ALLOWED_EXTENSIONS))}")
    else:
        print("  Estensioni ammesse : tutte")
    print(f"  Dimensione minima  : {MIN_FILE_SIZE_KB} KB" if MIN_FILE_SIZE_KB is not None else "  Dimensione minima  : nessuna")
    print(f"  Dimensione massima : {MAX_FILE_SIZE_MB} MB" if MAX_FILE_SIZE_MB is not None else "  Dimensione massima : nessuna")
    print(f"  Limite totale      : {MAX_TOTAL_SIZE_MB} MB" if MAX_TOTAL_SIZE_MB is not None else "  Limite totale      : nessuno")
    print(f"  Parole chiave      : {', '.join(KEYWORD_FILTER)}" if KEYWORD_FILTER else "  Parole chiave      : nessun filtro")
    print(f"  Profondita' max    : {depth_label} livelli di annidamento")
    print()

    if not INPUT_DIR.exists():
        print(f"ERRORE: cartella input non trovata: {INPUT_DIR}")
        return

    if not DRY_RUN:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    msg_files = list_msg_files(INPUT_DIR, RECURSIVE)
    if not msg_files:
        print("Nessun file .msg trovato.")
        return

    print(f"Trovati {len(msg_files)} file .msg\n")

    total_msg = 0
    total_without_attachments = 0
    errors = []

    # Stato condiviso tra tutti i livelli di ricorsione
    state = {
        "total_attachments": 0,
        "total_bytes_saved": 0,
        "skipped_items": [],
        "errors": errors,
        "budget_exceeded": False,
    }

    for idx, msg_path in enumerate(msg_files, start=1):
        if state["budget_exceeded"]:
            break

        total_msg += 1
        print(f"[{idx}/{len(msg_files)}] {msg_path}")

        try:
            msg = extract_msg.Message(str(msg_path))
            try:
                attachments = getattr(msg, "attachments", []) or []

                if not attachments:
                    total_without_attachments += 1
                    print("  - Nessun allegato")
                    continue

                email_folder_name = build_email_folder_name(msg, msg_path)
                email_folder = unique_path(OUTPUT_DIR / email_folder_name)

                saved_count = process_attachments(attachments, email_folder, 0, msg_path, state)

                if saved_count > 0:
                    print(f"  - Totale salvati da questo msg: {saved_count}")

            finally:
                msg.close()

        except Exception as e:
            errors.append((str(msg_path), f"Errore lettura MSG: {e}"))
            print(f"  - Errore lettura MSG: {e}")

    skipped_items = state["skipped_items"]

    # Riepilogo principale
    print("\n=== RIEPILOGO ===")
    if DRY_RUN:
        print("  (Modalita DRY RUN: nessun file e stato scritto)")
    print(f"File .msg elaborati         : {total_msg}")
    print(f"Messaggi senza allegati     : {total_without_attachments}")
    print(f"Allegati salvati            : {state['total_attachments']}")
    print(f"Allegati saltati (filtri)   : {len(skipped_items)}")
    print(f"Dimensione totale salvata   : {format_size(state['total_bytes_saved'])}")
    print(f"Errori                      : {len(errors)}")
    if state["budget_exceeded"]:
        print(f"  Estrazione interrotta: limite totale di {MAX_TOTAL_SIZE_MB} MB raggiunto")

    # Dettaglio file non estratti
    if skipped_items:
        top_level_skipped = [i for i in skipped_items if not i["is_nested"]]
        nested_skipped = [i for i in skipped_items if i["is_nested"]]

        items_with_size = [i for i in skipped_items if i["att_size"] is not None]
        total_skipped_bytes = sum(i["att_size"] for i in items_with_size)
        unknown_count = len(skipped_items) - len(items_with_size)
        size_note = f" + {unknown_count} di dim. sconosciuta" if unknown_count else ""

        print(f"\n=== FILE NON ESTRATTI ({len(skipped_items)} file — {format_size(total_skipped_bytes)}{size_note}) ===")

        by_reason = defaultdict(list)
        for item in skipped_items:
            by_reason[item["reason"]].append(item)

        for reason, items in sorted(by_reason.items()):
            reason_bytes = sum(i["att_size"] for i in items if i["att_size"] is not None)
            print(f"\n  Motivo: {reason} — {len(items)} file ({format_size(reason_bytes)})")
            for item in items:
                sz = format_size(item["att_size"]) if item["att_size"] is not None else "dim. sconosciuta"
                nested_label = " [annidato]" if item["is_nested"] else ""
                print(f"    • {item['att_name']} ({sz}){nested_label}")

        if nested_skipped:
            print(f"\n  Nota: {len(nested_skipped)} file saltati provengono da email annidate")
            print("  e non sono disponibili per il recupero automatico.")

        if not DRY_RUN and top_level_skipped:
            print()
            risposta = input(f"Vuoi estrarre i {len(top_level_skipped)} file di primo livello ignorando i filtri? [s/n]: ").strip().lower()
            if risposta in ("s", "si", "y", "yes"):
                extract_skipped_attachments(top_level_skipped)
            else:
                print("File saltati non estratti.")

    # Log errori
    if errors:
        print("\n=== DETTAGLIO ERRORI ===")
        for path, err in errors:
            print(f"- {path}")
            print(f"  {err}")

        if not DRY_RUN:
            log_path = OUTPUT_DIR / "errori.log"
            with open(log_path, "w", encoding="utf-8") as log_file:
                for path, err in errors:
                    log_file.write(f"{path}\n  {err}\n\n")
            print(f"\nLog errori salvato in: {log_path}")


if __name__ == "__main__":
    main()
