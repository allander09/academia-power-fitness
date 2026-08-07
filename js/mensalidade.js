function moeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularMensalidade() {
  const plano = Number.parseFloat(document.getElementById("plano")?.value);
  const meses = Number.parseInt(document.getElementById("meses")?.value, 10);
  const resultado = document.getElementById("resultadoMensalidade");

  if (!resultado || !Number.isFinite(plano) || !Number.isInteger(meses) || meses < 1 || meses > 36) {
    if (resultado) {
      resultado.textContent = "Informe uma quantidade de 1 a 36 meses.";
      resultado.className = "mensagem erro";
    }
    return;
  }

  resultado.textContent = `Total para ${meses} mês(es): ${moeda(plano * meses)}.`;
  resultado.className = "mensagem sucesso";
}

function selecionarPlano(nome, valor) {
  const planoNome = document.getElementById("planoNome");
  const planoValor = document.getElementById("planoValor");
  if (planoNome) planoNome.value = nome;
  if (planoValor) planoValor.value = String(valor);
  abrirModal(nome, `${moeda(valor)} por mês`);
}

function calcular() {
  const valorPlano = Number.parseFloat(document.getElementById("planoValor")?.value);
  const personal = Number.parseFloat(document.getElementById("personal")?.value || 0);
  const nutri = Number.parseFloat(document.getElementById("nutri")?.value || 0);
  const meses = Number.parseInt(document.getElementById("quantidadeMeses")?.value, 10);
  const resultado = document.getElementById("resultado");

  if (!resultado || !Number.isFinite(valorPlano) || !Number.isInteger(meses) || meses < 1 || meses > 36) {
    resultado.textContent = "Escolha um plano e informe de 1 a 36 meses.";
    resultado.className = "mensagem erro";
    return;
  }

  resultado.textContent = `Total: ${moeda((valorPlano + personal + nutri) * meses)}.`;
  resultado.className = "mensagem sucesso";
}
