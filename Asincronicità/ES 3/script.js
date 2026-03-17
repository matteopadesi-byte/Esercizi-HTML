function caricaUtente(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        nome: `Utente_${id}`,
        caricatoAlle: new Date().toLocaleTimeString(),
      });
    }, 1000);
  });
}

async function testSequenziale() {
  console.log("=== CARICAMENTO SEQUENZIALE ===");
  const inizio = Date.now();
  const utenti = [];

  for (const id of [1, 2, 3, 4, 5]) {
    const utente = await caricaUtente(id);
    console.log(`Caricato:`, utente);
    utenti.push(utente);
  }

  const fine = Date.now();
  console.log(`Tempo totale sequenziale: ${fine - inizio}ms`);
  return fine - inizio;
}

async function testParallelo() {
  console.log("\n=== CARICAMENTO PARALLELO ===");
  const inizio = Date.now();

  const utenti = await Promise.all(
    [1, 2, 3, 4, 5].map((id) => caricaUtente(id)),
  );

  utenti.forEach((utente) => console.log(`Caricato:`, utente));

  const fine = Date.now();
  console.log(`Tempo totale parallelo: ${fine - inizio}ms`);
  return fine - inizio;
}

async function confronto() {
  const tempoSeq = await testSequenziale();
  const tempoPar = await testParallelo();

  console.log("\n=== CONFRONTO ===");
  console.log(`Sequenziale: ${tempoSeq}ms`);
  console.log(`Parallelo: ${tempoPar}ms`);
  console.log(`Differenza: ${tempoSeq - tempoPar}ms`);
  console.log(`Il parallelo è ${(tempoSeq / tempoPar).toFixed(1)}x più veloce`);
}

confronto();
