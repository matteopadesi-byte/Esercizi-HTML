// ─────────────────────────────────────────────────────────────────────────────
// FUNZIONE BASE: caricaUtente(id)
// Simula il caricamento di un utente da un server (ci vuole 1 secondo).
// Restituisce una Promise, cioè una "promessa" che prima o poi darà un risultato.
// ─────────────────────────────────────────────────────────────────────────────
function caricaUtente(id) {
  // "new Promise" crea una promessa.
  // Riceve una funzione con il parametro "resolve": quando chiami resolve(valore),
  // la promessa si "completa" e consegna quel valore a chi la sta aspettando.
  return new Promise((resolve) => {
    // setTimeout aspetta 1000ms (1 secondo) e poi esegue la funzione freccia.
    // Simula il ritardo di una chiamata a un server reale.
    setTimeout(() => {
      // Dopo 1 secondo, la promessa si risolve restituendo un oggetto utente.
      resolve({
        id, // id dell'utente (es. 1, 2, 3...)
        nome: `Utente_${id}`, // nome costruito con template literal
        caricatoAlle: new Date().toLocaleTimeString(), // ora esatta in cui è stato "caricato"
      });
    }, 1000);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROCCIO 1: SEQUENZIALE
// Gli utenti vengono caricati UNO ALLA VOLTA, in fila.
// Il secondo inizia solo quando il primo è finito, ecc.
// Tempo totale atteso: ~5 secondi (5 utenti × 1 secondo ciascuno).
// ─────────────────────────────────────────────────────────────────────────────
async function testSequenziale() {
  // "async" davanti a "function" significa che dentro possiamo usare "await".
  console.log("=== CARICAMENTO SEQUENZIALE ===");

  // Date.now() restituisce i millisecondi passati dal 1° gennaio 1970.
  // Salvando il valore all'inizio e alla fine, possiamo calcolare il tempo trascorso.
  const inizio = Date.now();

  const utenti = []; // array vuoto dove accumuliamo gli utenti man mano che arrivano

  // for...of itera sui valori dell'array [1, 2, 3, 4, 5].
  for (const id of [1, 2, 3, 4, 5]) {
    // "await" mette in PAUSA questa funzione finché la promessa non si risolve.
    // Quindi: aspetta 1 secondo per l'utente 1, poi 1 secondo per il 2, ecc.
    const utente = await caricaUtente(id);

    console.log(`Caricato:`, utente); // stampa l'utente appena arrivato
    utenti.push(utente); // lo aggiunge all'array
  }

  const fine = Date.now();
  // fine - inizio = millisecondi totali impiegati (dovrebbe essere ~5000ms)
  console.log(`Tempo totale sequenziale: ${fine - inizio}ms`);

  return fine - inizio; // restituisce il tempo così la funzione confronto() può usarlo
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROCCIO 2: PARALLELO
// Tutti e 5 gli utenti vengono richiesti CONTEMPORANEAMENTE.
// Si aspetta che TUTTI finiscano, ma siccome partono insieme,
// il tempo totale è ~1 secondo invece di ~5.
// ─────────────────────────────────────────────────────────────────────────────
async function testParallelo() {
  console.log("\n=== CARICAMENTO PARALLELO ===");
  const inizio = Date.now();

  // Promise.all() riceve un ARRAY di promesse e aspetta che TUTTE si completino.
  // Restituisce un array con tutti i risultati, nello stesso ordine dell'input.
  //
  // [1,2,3,4,5].map(id => caricaUtente(id)) crea subito 5 promesse tutte insieme
  // (non aspetta che la prima finisca prima di creare la seconda!).
  // Tutte e 5 le promesse "girano" in parallelo.
  const utenti = await Promise.all(
    [1, 2, 3, 4, 5].map((id) => caricaUtente(id)),
  );

  // Ora "utenti" è un array con tutti e 5 gli utenti già pronti.
  // forEach li stampa uno per uno.
  utenti.forEach((utente) => console.log(`Caricato:`, utente));

  const fine = Date.now();
  // Dovrebbe essere ~1000ms perché tutti partivano insieme
  console.log(`Tempo totale parallelo: ${fine - inizio}ms`);

  return fine - inizio;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNZIONE PRINCIPALE: confronto()
// Chiama prima il sequenziale, poi il parallelo, e stampa il confronto finale.
// ─────────────────────────────────────────────────────────────────────────────
async function confronto() {
  // "await" aspetta che testSequenziale finisca completamente (~5s) prima di andare avanti.
  const tempoSeq = await testSequenziale();

  // Solo dopo che il sequenziale è finito, parte il parallelo (~1s).
  const tempoPar = await testParallelo();

  console.log("\n=== CONFRONTO ===");
  console.log(`Sequenziale: ${tempoSeq}ms`);
  console.log(`Parallelo: ${tempoPar}ms`);
  console.log(`Differenza: ${tempoSeq - tempoPar}ms`); // es. 5000 - 1000 = 4000ms

  // toFixed(1) arrotonda il numero a 1 decimale.
  // tempoSeq / tempoPar ci dice "quante volte più veloce è il parallelo".
  // Es. 5000 / 1000 = 5.0x più veloce.
  console.log(`Il parallelo è ${(tempoSeq / tempoPar).toFixed(1)}x più veloce`);
}

// ─────────────────────────────────────────────────────────────────────────────
// AVVIO DEL PROGRAMMA
// confronto() è async, quindi basta chiamarla: parte e gestisce tutto da sola.
// ─────────────────────────────────────────────────────────────────────────────
confronto();
