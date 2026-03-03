const rosso = document.querySelector("#rosso");
const giallo = document.querySelector("#giallo");
const verde = document.querySelector("#verde");
const bottone = document.querySelector("#btn-prossimo");

let stato = 0;

bottone.addEventListener("click", function () {
  stato = (stato + 1) % 3;
  rosso.style.backgroundColor = "#ddd";
  giallo.style.backgroundColor = "#ddd";
  verde.style.backgroundColor = "#ddd";

  if (stato === 0) {
    rosso.style.backgroundColor = "#e74c3c";
  } else if (stato === 1) {
    giallo.style.backgroundColor = "#f1c40f";
  } else {
    verde.style.backgroundColor = "#2ecc71";
  }
});
