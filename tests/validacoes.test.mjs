import test from "node:test";
import assert from "node:assert/strict";
import { dataLocalISO, normalizarBusca, possuiAgendamentoAtivo } from "../js/validacoes.mjs";

test("formata a data usando o calendário local", () => {
  assert.equal(dataLocalISO(new Date(2026, 7, 9, 23, 30)), "2026-08-09");
});

test("identifica agendamento ativo duplicado", () => {
  const agendamentos = [
    { data: "2026-08-10", hora: "08:00", status: "pendente" },
    { data: "2026-08-10", hora: "18:00", status: "cancelado" },
  ];

  assert.equal(possuiAgendamentoAtivo(agendamentos, "2026-08-10", "08:00"), true);
  assert.equal(possuiAgendamentoAtivo(agendamentos, "2026-08-10", "18:00"), false);
});

test("normaliza busca ignorando acentos e caixa", () => {
  assert.equal(normalizarBusca("  João Silva "), "joao silva");
});
