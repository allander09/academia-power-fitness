import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";
import { destinoPorPerfil } from "./perfis.mjs";

const botao = document.getElementById("contaBotao");
const painel = document.getElementById("contaMenu");
let sequencia = 0;

function fechar(devolverFoco = false) {
  painel.hidden = true;
  botao.setAttribute("aria-expanded", "false");
  if (devolverFoco) botao.focus();
}
botao.addEventListener("click", () => {
  painel.hidden = !painel.hidden;
  botao.setAttribute("aria-expanded", String(!painel.hidden));
});
document.addEventListener("click", event => { if (!event.target.closest(".conta-cabecalho")) fechar(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !painel.hidden) fechar(true); });
document.getElementById("contaSair").addEventListener("click", async event => {
  const controle = event.currentTarget;
  controle.disabled = true;
  try { await signOut(auth); fechar(); }
  catch { document.getElementById("contaFeedback").textContent = "Não foi possível sair. Tente novamente."; }
  finally { controle.disabled = false; }
});

onAuthStateChanged(auth, async usuario => {
  const atual = ++sequencia;
  fechar();
  document.getElementById("contaEntrar").hidden = Boolean(usuario);
  botao.hidden = !usuario;
  if (!usuario) return;
  const ler = colecao => getDoc(doc(db, colecao, usuario.uid));
  const snapshots = await Promise.allSettled([ler("usuarios"), ler("admins"), usuario.emailVerified ? ler("professores_acesso") : Promise.resolve(null)]);
  if (atual !== sequencia) return;
  const dados = indice => snapshots[indice].status === "fulfilled" ? snapshots[indice].value?.data() : null;
  const nome = dados(0)?.nome || usuario.displayName || "Minha conta";
  const administradorAtivo = usuario.emailVerified && dados(1)?.ativo === true;
  const professorAtivo = usuario.emailVerified && dados(2)?.ativo === true;
  document.getElementById("contaNome").textContent = nome;
  document.getElementById("contaEmail").textContent = usuario.email || "";
  document.getElementById("contaPerfil").textContent = administradorAtivo ? "Administrador" : professorAtivo ? "Professor" : "Aluno";
  document.getElementById("contaIniciais").textContent = nome.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join("").toUpperCase();
  document.getElementById("contaArea").href = destinoPorPerfil({ administradorAtivo, professorAtivo });
  botao.setAttribute("aria-label", `Abrir conta de ${nome}`);
});
