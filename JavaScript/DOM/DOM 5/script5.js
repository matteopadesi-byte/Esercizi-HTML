const display = document.querySelector("#display");
const btnMeno = document.querySelector("#btn-meno");
const btnReset = document.querySelector("#btn-reset");
const btnPiu = document.querySelector("#btn-piu");
const cronologia = document.querySelector("#cronologia");

let contatore = 0;

function aggiornaDisplay() {
  display.textContent = contatore;

  if (contatore > 0) {
    display.style.color = "green";
  } else if (contatore < 0) {
    display.style.color = "red";
  } else {
    display.style.color = "black";
  }
}

function aggiungiCronologia(operazione) {
  const ora = new Date().toLocaleTimeString("it-IT");
  const li = document.createElement("li");
  li.textContent = "[" + ora + "] " + operazione + " → Valore: " + contatore;
  cronologia.appendChild(li);
}

btnPiu.addEventListener("click", function () {
  contatore = contatore + 1;
  aggiornaDisplay();
  aggiungiCronologia("+1");
});

btnMeno.addEventListener("click", function () {
  contatore = contatore - 1;
  aggiornaDisplay();
  aggiungiCronologia("-1");
});

btnReset.addEventListener("click", function () {
  contatore = 0;
  aggiornaDisplay();
  aggiungiCronologia("Reset");
});
