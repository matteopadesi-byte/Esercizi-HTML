let conteggio = 0;

const titolo = document.querySelector(".click");
const btn = document.querySelector(".cliccami");
const reset = document.querySelector(".reset");

btn.addEventListener("click", function () {
  conteggio = conteggio + 1;
  titolo.textContent = `Click: ${conteggio}`;
});

reset.addEventListener("click", function () {
  conteggio = 0;
  titolo.textContent = `Click: ${conteggio}`;
});
