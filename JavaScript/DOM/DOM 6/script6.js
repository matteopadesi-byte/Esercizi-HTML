const accordion = document.querySelector(".accordion");

accordion.addEventListener("click", function (event) {
  if (!event.target.classList.contains("accordion-header")) return;

  const bodyAperti = document.querySelectorAll(".accordion-body.aperto");
  bodyAperti.forEach(function (body) {
    body.classList.remove("aperto");
  });

  const bodyDaAprire = event.target.nextElementSibling;
  bodyDaAprire.classList.add("aperto");
});
