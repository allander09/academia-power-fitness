import test from "node:test";
import assert from "node:assert/strict";
import { atividadeDisponivel, dataHoraFutura, dadosParaProfessor, decidirStatus } from "../functions/domain.mjs";

test("o servidor valida datas reais e o fuso brasileiro até o fim do dia", () => {
  const agora = new Date("2026-10-04T10:00:00Z");
  assert.equal(dataHoraFutura("2026-10-04", "23:30", agora), true);
  assert.equal(dataHoraFutura("2026-02-30", "15:00", agora), false);
  assert.equal(dataHoraFutura("2026-10-04", "06:00", agora), false);
  assert.equal(dataHoraFutura("2026-10-04", "24:00", agora), false);
});

test("turma cheia entra na fila e confirmação repetida é idempotente", () => {
  assert.equal(decidirStatus({ status: "pendente" }, "confirmado", [{ status: "confirmado" }], 1), "lista_espera");
  assert.equal(decidirStatus({ status: "confirmado" }, "confirmado", [{ status: "confirmado" }], 1), "confirmado");
  assert.throws(() => decidirStatus({ status: "cancelado" }, "confirmado", [], 1));
});

test("a resposta do professor não expõe UID, e-mail ou plano do aluno", () => {
  const dados = dadosParaProfessor({ aulaId: "aleatorio", nome: "Aluno", usuarioId: "privado", email: "privado@example.com", plano: "privado", atualizadoPor: "privado" });
  assert.equal(Object.hasOwn(dados, "email"), false);
  assert.equal(Object.hasOwn(dados, "usuarioId"), false);
  assert.equal(Object.hasOwn(dados, "plano"), false);
  assert.equal(Object.hasOwn(dados, "atualizadoPor"), false);
});

test("a disponibilidade exige atividade ativa, dia e funcionamento compatíveis", () => {
  const atividade = { ativo: true, hora: "10:00", diasSemana: [1] };
  assert.equal(atividadeDisponivel(atividade, "2026-10-05"), true);
  assert.equal(atividadeDisponivel({ ...atividade, ativo: false }, "2026-10-05"), false);
  assert.equal(atividadeDisponivel(atividade, "2026-10-06"), false);
  assert.equal(atividadeDisponivel(atividade, "2026-10-05", { dias: { segunda: { modo: "fechado" } } }), false);
});
