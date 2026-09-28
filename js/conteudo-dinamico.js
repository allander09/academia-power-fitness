import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { db } from "./firebase-services.js";
import { DIAS_SEMANA, formatarFuncionamento, normalizarFuncionamento } from "./operacao.mjs";

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
  const snapshot = await getDocs(query(collection(db, "planos"), where("ativo", "==", true)));
  if (snapshot.empty) return;
  const container = document.querySelector(".cards-planos");
  container.replaceChildren();

  snapshot.docs.forEach((documento) => {
    const dados = documento.data();
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
}

async function carregarProfessores() {
  const snapshot = await getDocs(query(collection(db, "professores"), where("ativo", "==", true)));
  if (snapshot.empty) return;
  const container = document.querySelector(".cards-professores");
  container.replaceChildren();
  snapshot.docs.forEach((documento) => {
    const dados = documento.data();
    const card = elemento("article", "", "professor");
    card.append(avatarProfessor(dados), elemento("h3", dados.nome), elemento("p", dados.especialidade));
    container.appendChild(card);
  });
}

async function carregarFuncionamento() {
  const snapshot = await getDoc(doc(db, "configuracoes", "funcionamento"));
  const funcionamento = normalizarFuncionamento(snapshot.exists() ? snapshot.data() : {});
  const tbody = document.querySelector("#horarios tbody");
  tbody.replaceChildren();
  DIAS_SEMANA.forEach(({ id, rotulo }) => {
    const tr = document.createElement("tr");
    tr.append(elemento("td", rotulo), elemento("td", formatarFuncionamento(funcionamento.dias[id])));
    tbody.appendChild(tr);
  });

  const diasAbertos = DIAS_SEMANA.filter(({ id }) => funcionamento.dias[id].modo !== "fechado");
  const destaque = document.getElementById("resumoFuncionamento");
  if (destaque) destaque.textContent = diasAbertos.length === 7 ? "Todos os dias" : "Horários flexíveis";
  const rodape = document.getElementById("funcionamentoRodape");
  if (rodape) {
    rodape.replaceChildren(...DIAS_SEMANA.map(({ id, rotulo }) => elemento("p", `${rotulo}: ${formatarFuncionamento(funcionamento.dias[id])}`)));
  }
}

Promise.allSettled([carregarPlanos(), carregarProfessores(), carregarFuncionamento()]);
