export const DIAS_SEMANA = [
  { id: "domingo", rotulo: "Domingo", indice: 0 },
  { id: "segunda", rotulo: "Segunda-feira", indice: 1 },
  { id: "terca", rotulo: "Terça-feira", indice: 2 },
  { id: "quarta", rotulo: "Quarta-feira", indice: 3 },
  { id: "quinta", rotulo: "Quinta-feira", indice: 4 },
  { id: "sexta", rotulo: "Sexta-feira", indice: 5 },
  { id: "sabado", rotulo: "Sábado", indice: 6 }
];

export const FUNCIONAMENTO_PADRAO = {
  capacidadePadrao: 20,
  dias: {
    domingo: { modo: "fechado", abertura: "", fechamento: "" },
    segunda: { modo: "personalizado", abertura: "06:00", fechamento: "22:00" },
    terca: { modo: "personalizado", abertura: "06:00", fechamento: "22:00" },
    quarta: { modo: "personalizado", abertura: "06:00", fechamento: "22:00" },
    quinta: { modo: "personalizado", abertura: "06:00", fechamento: "22:00" },
    sexta: { modo: "personalizado", abertura: "06:00", fechamento: "22:00" },
    sabado: { modo: "personalizado", abertura: "08:00", fechamento: "14:00" }
  }
};

const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const MODOS = new Set(["fechado", "24h", "personalizado"]);

function minutos(hora) {
  if (!HORARIO.test(hora || "")) return null;
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function normalizarDia(valor, padrao) {
  const modo = MODOS.has(valor?.modo) ? valor.modo : padrao.modo;
  if (modo !== "personalizado") return { modo, abertura: "", fechamento: "" };

  const abertura = HORARIO.test(valor?.abertura || "") ? valor.abertura : padrao.abertura;
  const fechamento = HORARIO.test(valor?.fechamento || "") ? valor.fechamento : padrao.fechamento;
  if (minutos(abertura) >= minutos(fechamento)) return { ...padrao };
  return { modo, abertura, fechamento };
}

export function normalizarFuncionamento(valor = {}) {
  const diasRecebidos = valor?.dias && typeof valor.dias === "object" ? valor.dias : {};
  const dias = {};
  DIAS_SEMANA.forEach(({ id }) => {
    dias[id] = normalizarDia(diasRecebidos[id], FUNCIONAMENTO_PADRAO.dias[id]);
  });

  const capacidadeInformada = Number(valor?.capacidadePadrao);
  const capacidadePadrao = Number.isInteger(capacidadeInformada) && capacidadeInformada >= 1 && capacidadeInformada <= 500
    ? capacidadeInformada
    : FUNCIONAMENTO_PADRAO.capacidadePadrao;

  return { dias, capacidadePadrao };
}

export function indiceDiaDaData(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return null;
  const [ano, mes, dia] = data.split("-").map(Number);
  const valor = new Date(ano, mes - 1, dia);
  if (valor.getFullYear() !== ano || valor.getMonth() !== mes - 1 || valor.getDate() !== dia) return null;
  return valor.getDay();
}

export function verificarFuncionamento(data, hora, configuracao = FUNCIONAMENTO_PADRAO) {
  const indice = indiceDiaDaData(data);
  const minutosDoHorario = minutos(hora);
  if (indice === null || minutosDoHorario === null) {
    return { aberto: false, mensagem: "Informe uma data e um horário válidos." };
  }

  const funcionamento = normalizarFuncionamento(configuracao);
  const dia = DIAS_SEMANA.find((item) => item.indice === indice);
  const regra = funcionamento.dias[dia.id];

  if (regra.modo === "fechado") {
    return { aberto: false, mensagem: `A academia não abre ${dia.rotulo.toLowerCase()}.` };
  }
  if (regra.modo === "24h") return { aberto: true, mensagem: "" };

  if (minutosDoHorario < minutos(regra.abertura) || minutosDoHorario >= minutos(regra.fechamento)) {
    return { aberto: false, mensagem: `Escolha um horário entre ${regra.abertura} e ${regra.fechamento}.` };
  }
  return { aberto: true, mensagem: "" };
}

export function formatarFuncionamento(regra) {
  if (regra?.modo === "24h") return "Aberto 24 horas";
  if (regra?.modo === "personalizado") return `${regra.abertura} às ${regra.fechamento}`;
  return "Fechado";
}

export function diasDoHorario(horario = {}) {
  if (Array.isArray(horario.diasSemana) && horario.diasSemana.length) {
    return [...new Set(horario.diasSemana.map(Number).filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6))];
  }
  return [1, 2, 3, 4, 5, 6];
}

export function horarioDisponivelNoDia(horario, indiceDia, configuracao = FUNCIONAMENTO_PADRAO) {
  if (!diasDoHorario(horario).includes(indiceDia)) return false;
  const dataReferencia = new Date(2026, 5, 7 + indiceDia);
  const data = `${dataReferencia.getFullYear()}-${String(dataReferencia.getMonth() + 1).padStart(2, "0")}-${String(dataReferencia.getDate()).padStart(2, "0")}`;
  return verificarFuncionamento(data, horario.hora, configuracao).aberto;
}

export function capacidadeDoHorario(horario = {}, configuracao = FUNCIONAMENTO_PADRAO) {
  const capacidade = Number(horario.capacidade);
  if (Number.isInteger(capacidade) && capacidade >= 1 && capacidade <= 500) return capacidade;
  return normalizarFuncionamento(configuracao).capacidadePadrao;
}

export function contarConfirmados(agendamentos, data, hora, ignorarId = "") {
  return agendamentos.filter((item) => (
    item.id !== ignorarId
    && item.data === data
    && item.hora === hora
    && item.status === "confirmado"
  )).length;
}

export function proximoDaLista(agendamentos, capacidade) {
  const limite = Number(capacidade);
  if (!Number.isInteger(limite) || limite < 1) return null;
  const ocupandoFluxo = agendamentos.filter((item) => ["confirmado", "pendente"].includes(item.status)).length;
  if (ocupandoFluxo >= limite) return null;
  return [...agendamentos]
    .filter((item) => item.status === "lista_espera")
    .sort((a, b) => (a.criadoEm?.seconds || 0) - (b.criadoEm?.seconds || 0))[0] || null;
}
