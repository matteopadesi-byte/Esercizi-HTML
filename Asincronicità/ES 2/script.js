// ─────────────────────────────────────────────────────────────────────────────
// FUNZIONE BASE: caricaDatabase(tabella)
// Simula una chiamata a un database (ci vuole 0.8 secondi).
// Rispetto all'ES 3, qui c'è una novità importante: può anche FALLIRE.
// ─────────────────────────────────────────────────────────────────────────────
function caricaDatabase(tabella) {

  // Questo è il nostro "database finto": un oggetto con due tabelle.
  // "utenti" e "prodotti" sono le chiavi, i loro array sono i valori.
  const db = {
    utenti: [
      { id: 1, nome: "Mario" },
      { id: 2, nome: "Luigi" },
    ],
    prodotti: [
      { id: 1, nome: "Laptop" },
      { id: 2, nome: "Mouse" },
    ],
  };

  // Anche qui creiamo una Promise (la "scatola vuota" che verrà riempita dopo).
  // Ma stavolta ha DUE parametri: resolve e reject.
  //   - resolve(valore) → tutto ok, riempi la scatola con il risultato
  //   - reject(errore)  → qualcosa è andato storto, segnala l'errore
  return new Promise((resolve, reject) => {

    // Aspetta 800ms (0.8 secondi) per simulare il ritardo del database.
    setTimeout(() => {

      // db[tabella] cerca la chiave "tabella" dentro l'oggetto db.
      // Es: db["utenti"] → restituisce l'array degli utenti.
      //     db["ordini"] → restituisce undefined (non esiste).
      if (db[tabella]) {
        // La tabella esiste → successo! Riempiamo la scatola con i dati.
        resolve(db[tabella]);
      } else {
        // La tabella NON esiste → errore! "reject" segnala il problema.
        // "new Error(...)" crea un oggetto errore con un messaggio leggibile.
        reject(new Error(`Tabella "${tabella}" non trovata`));
      }

    }, 800);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNZIONE PRINCIPALE: testC()
// Usa async/await per chiamare caricaDatabase e gestire sia il successo
// che l'errore con try/catch.
// ─────────────────────────────────────────────────────────────────────────────
async function testC() {

  // try/catch è il modo per gestire gli errori con async/await.
  // Tutto quello che sta dentro "try" viene eseguito normalmente.
  // Se qualcosa va storto (cioè una Promise viene "rejected"),
  // JavaScript salta direttamente al blocco "catch".
  try {

    // ── CASO 1: successo ──────────────────────────────────────────────────
    // Chiede la tabella "utenti". Esiste nel db, quindi resolve viene chiamata.
    // await aspetta 0.8s e poi mette il risultato in "utenti".
    const utenti = await caricaDatabase("utenti");
    console.log("Utenti:", utenti);
    // Output: Utenti: [ { id: 1, nome: 'Mario' }, { id: 2, nome: 'Luigi' } ]

    // Chiede la tabella "prodotti". Funziona allo stesso modo.
    const prodotti = await caricaDatabase("prodotti");
    console.log("Prodotti:", prodotti);
    // Output: Prodotti: [ { id: 1, nome: 'Laptop' }, { id: 2, nome: 'Mouse' } ]

    // ── CASO 2: errore ────────────────────────────────────────────────────
    // Chiede la tabella "ordini". NON esiste nel db, quindi reject viene chiamata.
    // await vede che la Promise è fallita e lancia un errore.
    // JavaScript salta immediatamente al blocco catch qui sotto.
    const ordini = await caricaDatabase("ordini");
    // Questa riga e tutto ciò che viene dopo NON vengono mai eseguiti,
    // perché la riga sopra ha lanciato un errore.

  } catch (err) {
    // "err" è l'oggetto Error che abbiamo passato a reject().
    // err.message è il testo che abbiamo scritto: 'Tabella "ordini" non trovata'
    console.error("Errore:", err.message);
    // Output: Errore: Tabella "ordini" non trovata
  }
}

// Avvia tutto. Senza questa riga, il codice non fa niente.
testC();
