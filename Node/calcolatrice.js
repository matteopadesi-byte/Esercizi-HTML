const args = process.argv.slice(2);

const num1 = parseFloat(args[0]);
const operazione = args[1];
const num2 = parseFloat(args[2]);

let risultato;

switch (operazione) {
  case "+":
    risultato = num1 + num2;
    break;
  case "-":
    risultato = num1 - num2;
    break;
  case "x":
    risultato = num1 * num2;
    break;
  case "/":
    if (num2 === 0) {
      console.log("Errore: divisione per zero!");
      process.exit(1);
    }
    risultato = num1 / num2;
    break;
  default:
    console.log("Errore: operazione non valida!");
    process.exit(1);
}

console.log("Risultato:", risultato);
