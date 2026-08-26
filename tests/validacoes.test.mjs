import test from "node:test";
import assert from "node:assert/strict";
import {
  dataLocalISO,
  formatarDataISO,
  idAgendamento,
  normalizarBusca,
  possuiAgendamentoAtivo,
  validarHorarioAgendamento
} from "../js/validacoes.mjs";

test("formata a data usando o calendário local", () => {
  assert.equal(dataLocalISO(new Date(2026, 7, 9, 23, 30)), "2026-08-09");
  assert.equal(formatarDataISO("2026-08-09"), "09/08/2026");
  assert.equal(formatarDataISO("2026-02-30"), "Data inválida");
});

test("identifica agendamento ativo duplicado", () => {
  const agendamentos = [
    { data: "2026-08-10", hora: "08:00", status: "pendente" },
    { data: "2026-08-10", hora: "18:00", status: "cancelado" },
  ];

  assert.equal(possuiAgendamentoAtivo(agendamentos, "2026-08-10", "08:00"), true);
  assert.equal(possuiAgendamentoAtivo(agendamentos, "2026-08-10", "18:00"), false);
});

test("gera um identificador estável para impedir duplicidade", () => {
  assert.equal(idAgendamento("usuario123", "2026-08-10", "08:00"), "usuario123_2026-08-10_08:00");
  assert.throws(() => idAgendamento("", "2026-08-10", "08:00"), /usuário/i);
});

test("aceita apenas horários futuros dentro do atendimento", () => {
  const agora = new Date(2026, 7, 10, 7, 0);
  assert.equal(validarHorarioAgendamento("2026-08-10", "08:00", agora).valido, true);
  assert.equal(validarHorarioAgendamento("2026-08-09", "08:00", agora).valido, false);
  assert.equal(validarHorarioAgendamento("2026-08-15", "14:00", agora).valido, false);
  assert.equal(validarHorarioAgendamento("2026-08-16", "10:00", agora).valido, false);
});

test("normaliza busca ignorando acentos e caixa", () => {
  assert.equal(normalizarBusca("  João Silva "), "joao silva");
});

