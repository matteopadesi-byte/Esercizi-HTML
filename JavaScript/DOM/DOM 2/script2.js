const titolo = document.querySelector("#titolo");
const paragrafi = document.querySelectorAll(".descrizione");
const ul = document.querySelector("#lista");
const lista = document.querySelectorAll("li");

titolo.textContent = "DOM Manipulation è fantastico!";
paragrafi[0].classList.add("evidenziato");
titolo.style.backgroundColor = "lightblue";
ul.dataset.versione = "2.0";
lista[2].textContent = "Terzo (modificato)";
