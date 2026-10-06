import { calcularImcValor } from "./calculos.mjs";

function calcularIMC() {
  const resultado = document.getElementById("resultadoIMC");
  if (!resultado) return;

  try {
    const { valor, situacao } = calcularImcValor(
      document.getElementById("peso")?.value,
      document.getElementById("altura")?.value
    );
    resultado.textContent = `Seu IMC é ${valor.toFixed(2)} — ${situacao}.`;
    resultado.className = "mensagem sucesso";
  } catch {
    resultado.textContent = "Informe peso e altura válidos.";
    resultado.className = "mensagem erro";
  }
}

document.getElementById("imcForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  calcularIMC();
});
