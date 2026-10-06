import test from "node:test";
import assert from "node:assert/strict";
import {
  capacidadeDoHorario,
  contarConfirmados,
  diasDoHorario,
  formatarFuncionamento,
  horarioDisponivelNoDia,
  normalizarFuncionamento,
  proximoDaLista,
  verificarFuncionamento
} from "../js/operacao.mjs";

test("normaliza a configuração semanal e preserva o padrão seguro", () => {
  const configuracao = normalizarFuncionamento({
    capacidadePadrao: 35,
    dias: {
      segunda: { modo: "24h" },
      sabado: { modo: "personalizado", abertura: "09:00", fechamento: "18:00" }
    }
  });

  assert.equal(configuracao.capacidadePadrao, 35);
  assert.equal(configuracao.dias.segunda.modo, "24h");
  assert.equal(formatarFuncionamento(configuracao.dias.sabado), "09:00 às 18:00");
  assert.equal(configuracao.dias.domingo.modo, "fechado");
});

test("aceita academia 24 horas e respeita dias fechados", () => {
  const configuracao = normalizarFuncionamento({ dias: { segunda: { modo: "24h" } } });
  assert.equal(verificarFuncionamento("2026-08-10", "02:30", configuracao).aberto, true);
  assert.equal(verificarFuncionamento("2026-08-09", "10:00", configuracao).aberto, false);
});

test("filtra atividades pelos dias e pelo funcionamento", () => {
  const horario = { hora: "16:00", diasSemana: [6], capacidade: 12 };
  const configuracao = normalizarFuncionamento({
    dias: { sabado: { modo: "personalizado", abertura: "08:00", fechamento: "18:00" } }
  });

  assert.deepEqual(diasDoHorario(horario), [6]);
  assert.equal(horarioDisponivelNoDia(horario, 6, configuracao), true);
  assert.equal(horarioDisponivelNoDia(horario, 1, configuracao), false);
  assert.equal(capacidadeDoHorario(horario, configuracao), 12);
});

test("conta apenas vagas confirmadas", () => {
  const itens = [
    { id: "1", data: "2026-08-10", hora: "08:00", status: "confirmado" },
    { id: "2", data: "2026-08-10", hora: "08:00", status: "pendente" },
    { id: "3", data: "2026-08-10", hora: "08:00", status: "confirmado" }
  ];

  assert.equal(contarConfirmados(itens, "2026-08-10", "08:00"), 2);
  assert.equal(contarConfirmados(itens, "2026-08-10", "08:00", "3"), 1);
});

test("promove somente a primeira pessoa da fila quando existe espaço de análise", () => {
  const itens = [
    { id: "confirmado", status: "confirmado", criadoEm: { seconds: 1 } },
    { id: "segundo", status: "lista_espera", criadoEm: { seconds: 3 } },
    { id: "primeiro", status: "lista_espera", criadoEm: { seconds: 2 } }
  ];
  assert.equal(proximoDaLista(itens, 2).id, "primeiro");
  assert.equal(proximoDaLista([...itens, { id: "analise", status: "pendente" }], 2), null);
});
