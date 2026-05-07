# estrai_allegati_msg.py

Script Python per estrarre automaticamente gli allegati da file `.msg` (email esportate da Microsoft Outlook) e salvarli in cartelle organizzate per data e oggetto dell'email. Supporta email annidate (email allegate ad altre email) con controllo della profondità di ricerca.

---

## Requisiti

- Python 3.8 o superiore
- Libreria `extract-msg`

Installa la libreria con:

```
pip install extract-msg
```

---

## Configurazione

Apri il file `estrai_allegati_msg.py` e modifica le variabili in cima al file:

```python
INPUT_DIR = Path(r"C:\percorso\cartella\con\i\msg")
OUTPUT_DIR = Path(r"C:\percorso\cartella\dove\salvare\allegati")
RECURSIVE = True
```

| Variabile | Descrizione |
|---|---|
| `INPUT_DIR` | Cartella che contiene i file `.msg` da elaborare |
| `OUTPUT_DIR` | Cartella dove verranno salvati gli allegati estratti |
| `RECURSIVE` | Se `True`, cerca i `.msg` anche nelle sottocartelle di `INPUT_DIR` |

---

## Filtri

Nella sezione `=== FILTRI ===` puoi configurare cosa estrarre e cosa ignorare:

```python
DRY_RUN = True
ALLOWED_EXTENSIONS = {".pdf", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt", ".zip"}
MAX_FILE_SIZE_MB = 50
MAX_TOTAL_SIZE_MB = 500
MIN_FILE_SIZE_KB = 10
KEYWORD_FILTER = []
MAX_DEPTH = 3
```

| Variabile | Descrizione |
|---|---|
| `DRY_RUN` | Se `True`, simula tutto senza scrivere nulla su disco |
| `ALLOWED_EXTENSIONS` | Estensioni ammesse. Set vuoto (`set()`) = accetta tutto |
| `MAX_FILE_SIZE_MB` | Salta i singoli allegati che superano questa dimensione. `None` = nessun limite |
| `MAX_TOTAL_SIZE_MB` | Interrompe l'estrazione quando la dimensione totale supera questa soglia. `None` = nessun limite |
| `MIN_FILE_SIZE_KB` | Salta gli allegati più piccoli di questa dimensione (utile per escludere firme e loghi). `None` = nessun limite |
| `KEYWORD_FILTER` | Lista di parole chiave: estrae solo gli allegati il cui nome contiene almeno una delle parole (case-insensitive). Lista vuota = nessun filtro |
| `MAX_DEPTH` | Profondità massima di ricerca nelle email annidate. `0` = solo allegati diretti, `3` = entra fino a 3 livelli. `None` = nessun limite |

---

## Come si usa

### Primo utilizzo consigliato: modalità DRY RUN

Prima di estrarre tutto, conviene fare una simulazione:

1. Imposta `INPUT_DIR` e `OUTPUT_DIR` con i tuoi percorsi reali
2. Lascia `DRY_RUN = True`
3. Lancia lo script:

```
python estrai_allegati_msg.py
```

Lo script stampa cosa verrebbe salvato e cosa verrebbe saltato, senza toccare nulla su disco. Controlla l'output, aggiusta i filtri se serve, poi cambia `DRY_RUN = False` e rilancia.

### Output durante l'esecuzione

```
=== ESTRAZIONE ALLEGATI DA FILE .MSG ===
Input    : C:\email
Output   : C:\allegati_estratti
Ricorsivo: True

=== FILTRI ATTIVI ===
  Estensioni ammesse : .doc, .docx, .pdf, .ppt, .pptx, .xls, .xlsx, .zip
  Dimensione minima  : 10 KB
  Dimensione massima : 50 MB
  Limite totale      : 500 MB
  Parole chiave      : nessun filtro
  Profondita' max    : 3 livelli di annidamento

Trovati 3 file .msg

[1/3] C:\email\riunione.msg
    - Salvato (1.2 MB): verbale.pdf
    -> Email annidata (livello 1): risposta_originale.msg
        - Salvato (245 KB): offerta.xlsx
        -> Email annidata (livello 2): forwarded.msg
            - Saltato (troppo grande (80.0 MB)): video_demo.mp4
    - Totale salvati da questo msg: 2
[2/3] C:\email\notifica.msg
    - Nessun allegato
[3/3] C:\email\contratto.msg
    - Salvato (3.4 MB): contratto_firmato.pdf
    - Totale salvati da questo msg: 1
```

---

## Email annidate

Alcune email contengono a loro volta altre email come allegati (ad esempio email inoltrate o risposte). Lo script le riconosce automaticamente e vi entra per estrarne gli allegati, rispettando il limite `MAX_DEPTH`.

```python
MAX_DEPTH = 0   # solo allegati diretti, ignora le email allegate
MAX_DEPTH = 1   # entra nelle email allegate al primo livello
MAX_DEPTH = 3   # entra fino a 3 livelli di annidamento
MAX_DEPTH = None  # nessun limite di profondità
```

Nell'output, ogni livello di annidamento è indicato con una freccia e un'indentazione:

```
[1/1] C:\email\riunione.msg
    - Salvato (245 KB): offerta.xlsx
    -> Email annidata (livello 1): risposta.msg
        - Salvato (1.2 MB): contratto.pdf
        -> Email annidata (livello 2): forwarded.msg
            - Salvato (88 KB): allegato_interno.docx
```

---

## File non estratti e recupero interattivo

Al termine, lo script mostra un riepilogo di tutti gli allegati saltati dai filtri, raggruppati per motivo:

```
=== FILE NON ESTRATTI (8 file — 234.5 MB) ===

  Motivo: troppo grande — 3 file (198.2 MB)
    • video_riunione.mp4 (120.0 MB)
    • backup.zip (45.1 MB)
    • demo.mov (33.1 MB) [annidato]

  Motivo: estensione '.exe' non ammessa — 5 file (36.3 MB)
    • installer.exe (20.0 MB)
    ...

  Nota: 1 file saltati provengono da email annidate
  e non sono disponibili per il recupero automatico.

Vuoi estrarre i 7 file di primo livello ignorando i filtri? [s/n]:
```

Se rispondi `s`, lo script riapre i file `.msg` interessati ed estrae solo quegli allegati specifici, senza rielaborare tutto da capo.

> Note:
> - Il prompt appare solo con `DRY_RUN = False`
> - Gli allegati saltati provenienti da email annidate (marcati con `[annidato]`) sono mostrati nel riepilogo ma non vengono proposti per il recupero automatico

---

## Riepilogo finale

```
=== RIEPILOGO ===
File .msg elaborati         : 42
Messaggi senza allegati     : 10
Allegati salvati            : 87
Allegati saltati (filtri)   : 8
Dimensione totale salvata   : 312.4 MB
Errori                      : 0
```

---

## Struttura dell'output

Per ogni email che contiene almeno un allegato estratto, viene creata una sottocartella in `OUTPUT_DIR`. Le email annidate generano sottocartelle annidate con il prefisso `[livello N]`:

```
allegati_estratti/
├── 2024-03-15 10_30_00 - Riunione/
│   ├── verbale.pdf
│   └── [livello 1] 2024-03-10 09_00_00 - Risposta originale/
│       ├── contratto.pdf
│       └── [livello 2] 2024-02-28 - Forwarded/
│           └── allegato_interno.docx
├── 2024-03-16 09_00_00 - Offerta commerciale/
│   └── offerta.xlsx
```

- Le email **senza allegati** vengono conteggiate ma non generano cartelle
- Le email i cui allegati sono **tutti saltati dai filtri** non generano cartelle (a meno che non si scelga di estrarli alla fine)
- Se due email producono lo stesso nome cartella, viene aggiunto un suffisso `_1`, `_2`, ... per evitare sovrascritture
- Lo stesso meccanismo vale per i file allegati con lo stesso nome nella stessa cartella

---

## Log degli errori

Se durante l'elaborazione si verificano errori (file `.msg` corrotti, allegati non leggibili, ecc.), al termine dello script viene creato automaticamente un file:

```
OUTPUT_DIR/errori.log
```

Ogni riga indica il file `.msg` che ha causato il problema e la descrizione dell'errore. Se non ci sono errori, il file non viene creato.

> Nota: il file di log non viene creato in modalità `DRY_RUN`.

---

## Note tecniche

- I caratteri non validi nei nomi di file e cartelle (`\ / : * ? " < > |`) vengono sostituiti automaticamente con `_`
- I nomi vengono troncati a 150 caratteri per le cartelle e 120 per i file
- La cartella di destinazione per ogni email viene calcolata una sola volta, evitando la creazione di cartelle duplicate per la stessa email
- Gli handle ai file `.msg` vengono sempre chiusi correttamente, anche in caso di errore
- La cartella temporanea usata internamente durante l'estrazione (`_tmp_extract_msg`) viene rimossa automaticamente al termine di ogni allegato
- I contatori (byte totali, budget, errori) sono condivisi tra tutti i livelli di annidamento: il limite `MAX_TOTAL_SIZE_MB` si applica globalmente, non per singolo livello
