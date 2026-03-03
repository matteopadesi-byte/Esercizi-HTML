const input = document.querySelector("#inputTesto");
const bottone = document.querySelector("#btnAggiungi");
const lista = document.querySelector("#lista");

bottone.addEventListener("click", function () {
    const testo = input.value.trim();
    if (testo === "") return;

    const nuovoLi = document.createElement("li");
    nuovoLi.textContent = testo;
    lista.appendChild(nuovoLi);

    input.value = "";
    input.focus();
});
