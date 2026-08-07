function calcularIMC() {
  const peso = Number.parseFloat(document.getElementById("peso")?.value);
  const altura = Number.parseFloat(document.getElementById("altura")?.value);
  const resultado = document.getElementById("resultadoIMC") || document.getElementById("resultado");

  if (!resultado) return;

  if (!Number.isFinite(peso) || !Number.isFinite(altura) || peso <= 0 || altura <= 0 || altura > 3) {
    resultado.textContent = "Informe peso e altura válidos.";
    resultado.className = "mensagem erro";
    return;
  }

  const imc = peso / (altura ** 2);
  let situacao;

  if (imc < 18.5) situacao = "Abaixo do peso";
  else if (imc < 25) situacao = "Peso adequado";
  else if (imc < 30) situacao = "Sobrepeso";
  else if (imc < 35) situacao = "Obesidade grau I";
  else if (imc < 40) situacao = "Obesidade grau II";
  else situacao = "Obesidade grau III";

  resultado.textContent = `Seu IMC é ${imc.toFixed(2)} — ${situacao}.`;
  resultado.className = "mensagem sucesso";
}
