import test from "node:test";
import assert from "node:assert/strict";
import { mensagemAuth, resultadoRecuperacao } from "../js/auth-utils.js";

test("a recuperação não identifica contas existentes e informa falha de conexão", () => {
  const sucesso = resultadoRecuperacao();
  assert.deepEqual(resultadoRecuperacao({ code: "auth/user-not-found" }), sucesso);
  assert.deepEqual(resultadoRecuperacao({ code: "auth/invalid-credential" }), sucesso);
  const falha = resultadoRecuperacao({ code: "auth/network-request-failed" });
  assert.equal(falha.tipo, "erro");
  assert.notEqual(falha.mensagem, sucesso.mensagem);
  assert.equal(mensagemAuth({ code: "auth/user-not-found" }), mensagemAuth({ code: "auth/wrong-password" }));
});
