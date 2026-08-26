const modal = document.getElementById("modal");
let focoAnterior = null;

function elementosFocaveis() {
  return [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
}

function abrirModal(plano, valor) {
  if (!modal) return;
  focoAnterior = document.activeElement;
  document.getElementById("tituloPlano").textContent = plano;
  document.getElementById("descricaoPlano").textContent = `Valor da mensalidade: ${valor}`;
  sessionStorage.setItem("powerFitnessPlano", plano);
  modal.classList.add("aberto");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-aberto");
  modal.querySelector(".fechar")?.focus();
}

function fecharModal() {
  if (!modal?.classList.contains("aberto")) return;
  modal.classList.remove("aberto");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-aberto");
  focoAnterior?.focus?.();
  focoAnterior = null;
}

document.querySelectorAll("[data-plano][data-valor]").forEach((botao) => {
  botao.addEventListener("click", () => abrirModal(botao.dataset.plano, botao.dataset.valor));
});

document.getElementById("fecharModal")?.addEventListener("click", fecharModal);
document.getElementById("irAgendamento")?.addEventListener("click", fecharModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) fecharModal();
});

document.addEventListener("keydown", (event) => {
  if (!modal?.classList.contains("aberto")) return;

  if (event.key === "Escape") {
    fecharModal();
    return;
  }

  if (event.key !== "Tab") return;
  const focaveis = elementosFocaveis();
  if (!focaveis.length) return;
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];

  if (event.shiftKey && document.activeElement === primeiro) {
    event.preventDefault();
    ultimo.focus();
  } else if (!event.shiftKey && document.activeElement === ultimo) {
    event.preventDefault();
    primeiro.focus();
  }
});

window.abrirModal = abrirModal;
window.fecharModal = fecharModal;

