import test from "node:test";
import assert from "node:assert/strict";
import { calcularImcValor, calcularTotalMensalidade } from "../js/calculos.mjs";

test("calcula IMC e classificação", () => {
  const resultado = calcularImcValor(70, 1.75);
  assert.equal(resultado.valor.toFixed(2), "22.86");
  assert.equal(resultado.situacao, "Peso adequado");
});

test("rejeita altura inválida", () => {
  assert.throws(() => calcularImcValor(70, 0), RangeError);
});

test("calcula IMC com decimais no formato brasileiro", () => {
  const resultado = calcularImcValor("70,5", "1,75");
  assert.equal(resultado.valor.toFixed(2), "23.02");
  assert.equal(resultado.situacao, "Peso adequado");
});

test("calcula plano com extras por vários meses", () => {
  assert.equal(calcularTotalMensalidade(149.9, 3, 60), 629.7);
});

test("rejeita período fora do limite", () => {
  assert.throws(() => calcularTotalMensalidade(89.9, 0), RangeError);
  assert.throws(() => calcularTotalMensalidade(89.9, 37), RangeError);
});
