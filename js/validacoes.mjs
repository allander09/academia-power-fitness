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

function decomporData(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const [ano, mes, dia] = data.split("-").map(Number);
  const valor = new Date(ano, mes - 1, dia);
  if (valor.getFullYear() !== ano || valor.getMonth() !== mes - 1 || valor.getDate() !== dia) return null;
  return { ano, mes, dia, valor };
}

export function formatarDataISO(data) {
  const partes = decomporData(data);
  if (!partes) return "Data inválida";
  return `${String(partes.dia).padStart(2, "0")}/${String(partes.mes).padStart(2, "0")}/${partes.ano}`;
}

export function idAgendamento(usuarioId, data, hora) {
  if (typeof usuarioId !== "string" || !usuarioId.trim()) throw new TypeError("Informe o usuário.");
  if (!decomporData(data) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    throw new TypeError("Informe data e horário válidos.");
  }
  return `${usuarioId}_${data}_${hora}`;
}

export function validarHorarioAgendamento(data, hora, agora = new Date()) {
  const partes = decomporData(data);
  if (!partes || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora) || !(agora instanceof Date) || Number.isNaN(agora.getTime())) {
    return { valido: false, mensagem: "Informe uma data e um horário válidos." };
  }

  const [horas, minutos] = hora.split(":").map(Number);
  const dataHora = new Date(partes.ano, partes.mes - 1, partes.dia, horas, minutos);
  if (dataHora <= agora) {
    return { valido: false, mensagem: "Escolha um horário futuro." };
  }

  const diaSemana = dataHora.getDay();
  if (diaSemana === 0) {
    return { valido: false, mensagem: "A academia não abre aos domingos." };
  }

  const minutosDoDia = horas * 60 + minutos;
  const abre = diaSemana === 6 ? 8 * 60 : 6 * 60;
  const fecha = diaSemana === 6 ? 14 * 60 : 22 * 60;
  if (minutosDoDia < abre || minutosDoDia >= fecha) {
    const faixa = diaSemana === 6 ? "08h às 14h" : "06h às 22h";
    return { valido: false, mensagem: `Escolha um horário dentro do atendimento: ${faixa}.` };
  }

  return { valido: true, mensagem: "" };
}

