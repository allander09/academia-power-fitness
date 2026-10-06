import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { db } from "./firebase-services.js";
import { DIAS_SEMANA, formatarFuncionamento, normalizarFuncionamento } from "./operacao.mjs";

const demonstracaoPublica = document.body.dataset.demonstracaoPublica === "true";
const preservarExemplo = container => demonstracaoPublica && Boolean(container.matches("[data-exemplo]") || container.querySelector("[data-exemplo]"));
function ocultarNota(id) {
  const nota = document.getElementById(id);
  if (nota) nota.hidden = true;
}

const fotosPadrao = {
  "carlos silva": "../assets/images/professor-carlos.webp",
  "ana souza": "../assets/images/professora-ana.webp",
  "lucas martins": "../assets/images/professor-lucas.webp"
};

function elemento(tag, texto, classe) {
  const item = document.createElement(tag);
  item.textContent = texto;
  if (classe) item.className = classe;
  return item;
}

function normalizarNome(valor = "") {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function iniciais(nome) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}

function urlFotoSegura(valor) {
  if (!valor) return "";
  try {
    const url = new URL(valor, window.location.href);
    if (url.protocol === "https:" || url.origin === window.location.origin) return url.href;
  } catch {
    return "";
  }
  return "";
}

function avatarProfessor(dados) {
  const padrao = fotosPadrao[normalizarNome(dados.nome)];
  const fotoUrl = urlFotoSegura(dados.fotoUrl || padrao);
  if (!fotoUrl) return elemento("div", iniciais(dados.nome), "avatar");

  const imagem = document.createElement("img");
  imagem.className = "foto-professor";
  imagem.src = fotoUrl;
  imagem.alt = `Retrato de ${dados.nome}, ${dados.especialidade}`;
  imagem.width = 640;
  imagem.height = 640;
  imagem.loading = "lazy";
  imagem.addEventListener("error", () => imagem.replaceWith(elemento("div", iniciais(dados.nome), "avatar")), { once: true });
  return imagem;
}

async function carregarPlanos() {
  const container = document.querySelector(".cards-planos");
  const exemplo = preservarExemplo(container);
  if (!exemplo) {
    container.replaceChildren(elemento("p", "Carregando planos da academia…"));
    ocultarNota("notaPlanos");
  }
  const simulador = document.getElementById("plano");
  const interesse = document.getElementById("planoAgendamento");
  const calcular = document.querySelector('#mensalidadeForm button[type="submit"]');
  if (!exemplo) {
    simulador.removeAttribute("data-exemplo");
    simulador.replaceChildren(new Option("Carregando planos…", ""));
    simulador.disabled = true;
    calcular.disabled = true;
    ocultarNota("notaSimulador");
  }
  interesse.replaceChildren(new Option("Ainda não decidi", "Ainda não decidi"));
  let snapshot;
  try { snapshot = await getDocs(query(collection(db, "planos"), where("ativo", "==", true))); }
  catch {
    if (exemplo) return;
    container.replaceChildren(elemento("p", "Não foi possível carregar os planos. Atualize a página antes de consultar os valores."));
    simulador.replaceChildren(new Option("Planos indisponíveis", ""));
    return;
  }
  if (snapshot.empty) {
    if (exemplo) return;
    container.replaceChildren(elemento("p", "Os planos serão publicados pela academia em breve."));
    simulador.replaceChildren();
    simulador.append(new Option("Nenhum plano publicado", ""));
    simulador.disabled = true;
    document.querySelector('#mensalidadeForm button[type="submit"]').disabled = true;
    return;
  }
  container.replaceChildren();
  simulador.replaceChildren();
  simulador.removeAttribute("data-exemplo");
  ocultarNota("notaPlanos");
  ocultarNota("notaSimulador");
  simulador.disabled = false;
  calcular.disabled = false;

  snapshot.docs.forEach((documento) => {
    const dados = documento.data();
    simulador.append(new Option(`${dados.nome} — ${Number(dados.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, String(dados.valor)));
    interesse.append(new Option(dados.nome, dados.nome));
    const card = elemento("article", "", "plano");
    card.append(elemento("h3", dados.nome), elemento("p", Number(dados.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "/mês", "preco"));
    const lista = document.createElement("ul");
    (dados.beneficios || []).forEach((beneficio) => lista.appendChild(elemento("li", beneficio)));
    const botao = elemento("button", "Escolher");
    botao.type = "button";
    botao.addEventListener("click", () => window.abrirModal(dados.nome, Number(dados.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "/mês"));
    card.append(lista, botao);
    container.appendChild(card);
  });
  const salvo = sessionStorage.getItem("powerFitnessPlano");
  if ([...interesse.options].some(opcao => opcao.value === salvo)) interesse.value = salvo;
}

async function carregarProfessores() {
  const container = document.querySelector(".cards-professores");
  const exemplo = preservarExemplo(container);
  if (!exemplo) {
    container.replaceChildren(elemento("p", "Carregando equipe da academia…"));
    ocultarNota("notaEquipe");
  }
  let snapshot;
  try { snapshot = await getDocs(query(collection(db, "professores"), where("ativo", "==", true))); }
  catch {
    if (exemplo) return;
    container.replaceChildren(elemento("p", "Não foi possível carregar a equipe. Atualize a página e tente novamente."));
    return;
  }
  if (snapshot.empty && exemplo) return;
  container.replaceChildren();
  ocultarNota("notaEquipe");
  if (snapshot.empty) container.append(elemento("p", "A equipe será publicada pela academia em breve."));
  snapshot.docs.forEach((documento) => {
    const dados = documento.data();
    const card = elemento("article", "", "professor");
    card.append(avatarProfessor(dados), elemento("h3", dados.nome), elemento("p", dados.especialidade));
    container.appendChild(card);
  });
}

async function carregarFuncionamento() {
  const tbody = document.querySelector("#horarios tbody");
  const destaque = document.getElementById("resumoFuncionamento");
  const rodape = document.getElementById("funcionamentoRodape");
  const exemplo = preservarExemplo(tbody);
  const aviso = texto => {
    tbody.removeAttribute("data-exemplo");
    const td = elemento("td", texto); td.colSpan = 2;
    const tr = document.createElement("tr"); tr.append(td); tbody.replaceChildren(tr);
    if (rodape) { rodape.removeAttribute("data-exemplo"); rodape.replaceChildren(elemento("p", texto)); }
    ocultarNota("notaFuncionamento");
  };
  if (!exemplo) aviso("Carregando horários da academia…");
  let snapshot;
  try { snapshot = await getDoc(doc(db, "configuracoes", "funcionamento")); }
  catch {
    if (exemplo) return;
    aviso("Não foi possível carregar o funcionamento. Atualize a página e tente novamente.");
    if (destaque) destaque.textContent = "Consulte o funcionamento";
    return;
  }
  if (!snapshot.exists()) {
    if (exemplo) return;
    aviso("O funcionamento será publicado pela academia em breve.");
    if (destaque) destaque.textContent = "Consulte o funcionamento";
    return;
  }
  const funcionamento = normalizarFuncionamento(snapshot.data());
  tbody.removeAttribute("data-exemplo");
  ocultarNota("notaFuncionamento");
  tbody.replaceChildren();
  DIAS_SEMANA.forEach(({ id, rotulo }) => {
    const tr = document.createElement("tr");
    tr.append(elemento("td", rotulo), elemento("td", formatarFuncionamento(funcionamento.dias[id])));
    tbody.appendChild(tr);
  });

  const diasAbertos = DIAS_SEMANA.filter(({ id }) => funcionamento.dias[id].modo !== "fechado");
  if (destaque) destaque.textContent = diasAbertos.length === 7 ? "Todos os dias" : "Horários flexíveis";
  if (rodape) {
    rodape.removeAttribute("data-exemplo");
    rodape.replaceChildren(...DIAS_SEMANA.map(({ id, rotulo }) => elemento("p", `${rotulo}: ${formatarFuncionamento(funcionamento.dias[id])}`)));
  }
}

Promise.allSettled([carregarPlanos(), carregarProfessores(), carregarFuncionamento()]);
