const voti = [7, 5, 8, 6, 9, 4, 7, 8, 6, 5];

let somma = 0;
let max = voti[0];
let min = voti[0];

for (let voto of voti) {
  somma += voto;

  if (voto > max) {
    max = voto;
  }

  if (voto < min) {
    min = voto;
  }
}

const media = somma / voti.length;
console.log(`Media: ${media}`);

console.log(`Voto massimo: ${max}`);

console.log(`Voto minimo: ${min}`);
