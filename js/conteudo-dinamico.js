import { collection, getDocs, orderBy, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { db } from "./firebase-services.js";

function elemento(tag, texto, classe) {
  const item = document.createElement(tag);
  item.textContent = texto;
  if (classe) item.className = classe;
  return item;
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
    botao.addEventListener("click", () => abrirModal(dados.nome, Number(dados.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "/mês"));
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
    const iniciais = dados.nome.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
    card.append(elemento("div", iniciais, "avatar"), elemento("h3", dados.nome), elemento("p", dados.especialidade));
    container.appendChild(card);
  });
}

async function carregarHorarios() {
  const snapshot = await getDocs(query(collection(db, "horarios"), where("ativo", "==", true), orderBy("hora")));
  if (snapshot.empty) return;
  const tbody = document.querySelector("#horarios tbody");
  tbody.replaceChildren();
  snapshot.docs.forEach((documento) => {
    const dados = documento.data();
    const tr = document.createElement("tr");
    tr.append(elemento("td", dados.hora), elemento("td", dados.atividade));
    tbody.appendChild(tr);
  });
}

Promise.allSettled([carregarPlanos(), carregarProfessores(), carregarHorarios()]);
