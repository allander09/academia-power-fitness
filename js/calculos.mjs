export function calcularImcValor(peso, altura) {
  const pesoNumero = Number(peso);
  const alturaNumero = Number(altura);

  if (!Number.isFinite(pesoNumero) || !Number.isFinite(alturaNumero) || pesoNumero <= 0 || alturaNumero <= 0 || alturaNumero > 3) {
    throw new RangeError("Peso ou altura inválidos.");
  }

  const valor = pesoNumero / (alturaNumero ** 2);
  let situacao;
  if (valor < 18.5) situacao = "Abaixo do peso";
  else if (valor < 25) situacao = "Peso adequado";
  else if (valor < 30) situacao = "Sobrepeso";
  else if (valor < 35) situacao = "Obesidade grau I";
  else if (valor < 40) situacao = "Obesidade grau II";
  else situacao = "Obesidade grau III";
  return { valor, situacao };
}

export function calcularTotalMensalidade(valorPlano, meses, extras = 0) {
  const plano = Number(valorPlano);
  const quantidade = Number(meses);
  const adicionais = Number(extras);

  if (!Number.isFinite(plano) || plano < 0 || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 36 || !Number.isFinite(adicionais) || adicionais < 0) {
    throw new RangeError("Valores de mensalidade inválidos.");
  }
  return (plano + adicionais) * quantidade;
}

export function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
