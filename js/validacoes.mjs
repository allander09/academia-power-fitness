export function dataLocalISO(data = new Date()) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new TypeError("Informe uma data válida.");
  }

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function possuiAgendamentoAtivo(agendamentos, data, hora) {
  return agendamentos.some((agendamento) => (
    agendamento.data === data
    && agendamento.hora === hora
    && !["cancelado", "recusado"].includes(agendamento.status)
  ));
}

export function normalizarBusca(valor = "") {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
