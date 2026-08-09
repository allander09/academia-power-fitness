import { calcularTotalMensalidade, formatarMoeda } from "./calculos.mjs";

window.calcularMensalidade = function calcularMensalidade() {
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
};

window.selecionarPlano = function selecionarPlano(nome, valor) {
  const planoNome = document.getElementById("planoNome");
  const planoValor = document.getElementById("planoValor");
  if (planoNome) planoNome.value = nome;
  if (planoValor) planoValor.value = String(valor);
  window.abrirModal(nome, `${formatarMoeda(valor)} por mês`);
};

window.calcular = function calcular() {
  const resultado = document.getElementById("resultado");
  try {
    const extras = Number(document.getElementById("personal")?.value || 0) + Number(document.getElementById("nutri")?.value || 0);
    const total = calcularTotalMensalidade(
      document.getElementById("planoValor")?.value,
      Number.parseInt(document.getElementById("quantidadeMeses")?.value, 10),
      extras
    );
    resultado.textContent = `Total: ${formatarMoeda(total)}.`;
    resultado.className = "mensagem sucesso";
  } catch {
    resultado.textContent = "Escolha um plano e informe de 1 a 36 meses.";
    resultado.className = "mensagem erro";
  }
};
