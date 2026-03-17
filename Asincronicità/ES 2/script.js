function caricaDatabase(tabella) {
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

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (db[tabella]) {
        resolve(db[tabella]);
      } else {
        reject(new Error(`Tabella "${tabella}" non trovata`));
      }
    }, 800);
  });
}

// Test con async/await
async function testC() {
  try {
    // Caso di successo
    const utenti = await caricaDatabase("utenti");
    console.log("Utenti:", utenti);

    const prodotti = await caricaDatabase("prodotti");
    console.log("Prodotti:", prodotti);

    // Caso di errore
    const ordini = await caricaDatabase("ordini");
  } catch (err) {
    console.error("Errore:", err.message);
    // Output: Errore: Tabella "ordini" non trovata
  }
}

testC();
