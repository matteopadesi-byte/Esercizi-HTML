const frase = process.argv.slice(2).join(" ");
const parole = frase.split(" ");

// Parola più lunga: ad ogni passo tengo quella con più caratteri
const parolaLunga = parole.reduce((campione, corrente) => {
  return corrente.length > campione.length ? corrente : campione;
});

// Parola più corta: stesso principio, ma tengo quella con meno caratteri
const parolaCourta = parole.reduce((campione, corrente) => {
  return corrente.length < campione.length ? corrente : campione;
});

// Totale caratteri delle parole (senza spazi) → serve per la media
const totaleCaratteri = parole.reduce((somma, parola) => {
  return somma + parola.length;
}, 0); //← 0 è il valore iniziale della somma

const media = totaleCaratteri / parole.length;

console.log(`Frase: "${frase}"`);
console.log(`Caratteri: ${frase.length}`); // lunghezza intera frase (spazi inclusi)
console.log(`Parole: ${parole.length}`);
console.log(
  `Parola più lunga: "${parolaLunga}" (${parolaLunga.length} caratteri)`,
);
console.log(
  `Parola più corta: "${parolaCourta}" (${parolaCourta.length} caratteri)`,
);
console.log(
  `Media caratteri per parola: (${totaleCaratteri} / ${parole.length}) ${media.toFixed(2)}`,
);
