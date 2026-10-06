import { calcularTotalMensalidade, formatarMoeda } from "./calculos.mjs";

const plano = document.getElementById("plano");
const botao = document.querySelector('#mensalidadeForm button[type="submit"]');
if (document.body.dataset.demonstracaoPublica === "true" && plano?.hasAttribute("data-exemplo")) {
  plano.disabled = false;
  if (botao) botao.disabled = false;
}

function calcularMensalidade() {
  const resultado = document.getElementById("resultadoMensalidade");
  try {
    const meses = Number.parseInt(document.getElementById("meses")?.value, 10);
    const total = calcularTotalMensalidade(document.getElementById("plano")?.value, meses);
    const exemplo = plano?.hasAttribute("data-exemplo") ? "Simulação ilustrativa. " : "";
    resultado.textContent = `${exemplo}Total para ${meses} mês(es): ${formatarMoeda(total)}.`;
    resultado.className = "mensagem sucesso";
  } catch {
    resultado.textContent = "Informe uma quantidade de 1 a 36 meses.";
    resultado.className = "mensagem erro";
  }
}

document.getElementById("mensalidadeForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  calcularMensalidade();
});
