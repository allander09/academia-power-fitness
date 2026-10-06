import { calcularTotalMensalidade, formatarMoeda } from "./calculos.mjs";

function calcularMensalidade() {
  const resultado = document.getElementById("resultadoMensalidade");
  try {
    const meses = Number.parseInt(document.getElementById("meses")?.value, 10);
    const total = calcularTotalMensalidade(document.getElementById("plano")?.value, meses);
    resultado.textContent = `Total para ${meses} mês(es): ${formatarMoeda(total)}.`;
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
