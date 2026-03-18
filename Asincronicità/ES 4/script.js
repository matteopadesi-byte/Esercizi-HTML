// ─────────────────────────────────────────────────────────────────────────────
// FUNZIONE PRINCIPALE: fetchSicuro(url, maxTentativi, timeoutMs)
//
// È una versione "blindata" di fetch() con 3 protezioni:
//   1. Timeout: se il server non risponde entro 5s, considera fallito
//   2. Controllo risposta: se il server risponde con un errore (es. 404), lancia errore
//   3. Retry: se qualcosa va storto, riprova fino a 3 volte
// ─────────────────────────────────────────────────────────────────────────────

// I parametri dopo "url" hanno valori di default:
//   maxTentativi = 3  → se non passi niente, usa 3
//   timeoutMs = 5000  → se non passi niente, usa 5000ms (5 secondi)
async function fetchSicuro(url, maxTentativi = 3, timeoutMs = 5000) {

  // Ciclo for classico: parte da i=0, va fino a i < maxTentativi (cioè 0, 1, 2).
  // Ogni iterazione è un tentativo.
  for (let i = 0; i < maxTentativi; i++) {

    // Stampa a che tentativo siamo. i+1 perché i parte da 0 ma vogliamo stampare 1, 2, 3.
    console.log(`Tentativo ${i + 1}/${maxTentativi}...`);

    try {
      // ── PROTEZIONE 1: TIMEOUT ───────────────────────────────────────────
      //
      // Promise.race() riceve un array di Promise e restituisce
      // il risultato della PRIMA che si completa (le altre vengono ignorate).
      // È come una gara: vince chi arriva primo.
      //
      // Qui mettiamo in gara due Promise:
      //   - fetch(url): la richiesta vera al server
      //   - una Promise che si "rifiuta" dopo 5 secondi (il timeout)
      //
      // Se fetch risponde prima di 5s → vince fetch → andiamo avanti
      // Se fetch ci mette più di 5s  → vince il timeout → catch cattura l'errore
      const risposta = await Promise.race([

        // Promise 1: la richiesta HTTP vera e propria
        fetch(url),

        // Promise 2: il timer del timeout.
        // Nota: il primo parametro di resolve si chiama "_" per convenzione,
        // quando non viene usato. Qui ci interessa solo reject.
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout: la richiesta ha impiegato troppo")),
            timeoutMs, // scatta dopo 5000ms
          ),
        ),

      ]);

      // ── PROTEZIONE 2: CONTROLLA SE LA RISPOSTA È OK ────────────────────
      //
      // fetch() non lancia un errore da solo per risposte tipo 404 o 500.
      // Considera "successo" qualsiasi risposta arrivata dal server.
      // Dobbiamo controllare manualmente "risposta.ok".
      //
      // risposta.ok è true se lo status HTTP è tra 200 e 299.
      // Es: 200 OK → true | 404 Not Found → false | 500 Server Error → false
      if (!risposta.ok) {
        // "throw" lancia manualmente un errore, che viene subito catturato dal catch.
        // risposta.status → es. 404
        // risposta.statusText → es. "Not Found"
        throw new Error(`HTTP ${risposta.status}: ${risposta.statusText}`);
      }

      // ── PARSING DEL JSON ────────────────────────────────────────────────
      //
      // La risposta HTTP arriva come testo grezzo.
      // risposta.json() lo trasforma in un oggetto JavaScript utilizzabile.
      // Anche questa è asincrona, quindi serve await.
      const dati = await risposta.json();

      console.log(`Successo al tentativo ${i + 1}!`);

      // "return" esce subito dalla funzione restituendo i dati.
      // Il ciclo for si interrompe qui, non continua con i tentativi successivi.
      return dati;

    } catch (errore) {
      // Arriviamo qui se:
      //   - il timeout ha vinto la race (Promise.race)
      //   - risposta.ok era false (throw manuale)
      //   - la rete era assente (fetch ha lanciato un errore di rete)

      console.warn(`Tentativo ${i + 1} fallito: ${errore.message}`);

      // ── PROTEZIONE 3: RETRY ─────────────────────────────────────────────
      //
      // Controlliamo se questo era l'ULTIMO tentativo.
      // maxTentativi - 1 è l'indice dell'ultimo ciclo (es. con 3 tentativi: 0,1,2 → ultimo è 2).
      if (i === maxTentativi - 1) {
        // Ultimo tentativo fallito → non ha senso riprovare.
        // "throw" rilancia l'errore verso chi ha chiamato fetchSicuro(),
        // che dovrà gestirlo con il proprio try/catch.
        throw new Error(
          `Fallito dopo ${maxTentativi} tentativi. Ultimo errore: ${errore.message}`,
        );
      }

      // Se NON è l'ultimo tentativo, aspettiamo 1 secondo prima di riprovare.
      console.log("Riprovo tra 1 secondo...");

      // Trick per "aspettare" con await senza usare una funzione apposita:
      // creiamo una Promise che si risolve dopo 1000ms.
      // await la mette in pausa esattamente 1 secondo, poi il ciclo for riparte.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Dopo questo await, il ciclo for esegue i++ e riparte con il tentativo successivo.
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNZIONE DI TEST
// ─────────────────────────────────────────────────────────────────────────────
async function test() {

  // ── TEST 1: URL valido ────────────────────────────────────────────────────
  // jsonplaceholder è un server di test pubblico. /users/1 esiste → risponde 200 OK.
  // fetchSicuro avrà successo al primo tentativo.
  try {
    console.log("--- Test URL valido ---");
    const utente = await fetchSicuro(
      "https://jsonplaceholder.typicode.com/users/1",
    );
    // utente è ora un oggetto JS con tutti i dati dell'utente
    console.log("Utente:", utente.name, utente.email);
  } catch (err) {
    // Questo catch non verrà mai raggiunto in questo test (l'URL è valido)
    console.error("Errore:", err.message);
  }

  // ── TEST 2: URL non valido ────────────────────────────────────────────────
  // /utenti/999 non esiste sul server → risponde 404 Not Found.
  // fetchSicuro lo considererà un errore (risposta.ok = false) e riproverà 3 volte.
  // Dopo il 3° fallimento, lancia l'errore finale che viene catturato qui.
  try {
    console.log("\n--- Test URL non valido ---");
    const fallito = await fetchSicuro(
      "https://jsonplaceholder.typicode.com/utenti/999",
    );
    // Questa riga non viene mai raggiunta perché fetchSicuro lancerà un errore
    console.log("Questo non verrà stampato");
  } catch (err) {
    // Arriviamo qui dopo i 3 tentativi falliti
    console.error("Errore finale:", err.message);
  }
}

// Avvia i test
test();
