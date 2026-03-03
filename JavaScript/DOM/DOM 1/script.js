const titolo = document.querySelector("#titolo");
const paragrafi = document.querySelectorAll(".descrizione");
const lista = document.querySelectorAll("li");
const ul = document.querySelector("#lista");

console.log(titolo.textContent);
console.log(paragrafi.length);
console.log(lista[1].textContent);
console.log(ul.parentElement.tagName);
