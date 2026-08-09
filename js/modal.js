const modal = document.getElementById("modal");

function abrirModal(plano, valor) {
  if (!modal) return;
  document.getElementById("tituloPlano").textContent = plano;
  document.getElementById("descricaoPlano").textContent = `Valor da mensalidade: ${valor}`;
  sessionStorage.setItem("powerFitnessPlano", plano);
  modal.classList.add("aberto");
  modal.setAttribute("aria-hidden", "false");
  modal.querySelector(".fechar")?.focus();
}

function fecharModal() {
  if (!modal) return;
  modal.classList.remove("aberto");
  modal.setAttribute("aria-hidden", "true");
}

modal?.addEventListener("click", (event) => {
  if (event.target === modal) fecharModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") fecharModal();
});
