import { getIdToken, onAuthStateChanged, reload, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";
import { capacidadeDoHorario, contarConfirmados, DIAS_SEMANA, diasDoHorario, formatarFuncionamento, horarioDisponivelNoDia, normalizarFuncionamento, proximoDaLista } from "./operacao.mjs";
import { formatarDataISO, normalizarBusca } from "./validacoes.mjs";

const conteudo = document.getElementById("adminConteudo");
const carregando = document.getElementById("carregando");
const feedback = document.getElementById("feedbackAdmin");
let alunosCache = [];
let agendamentosCache = [];
let horariosCache = [];
let funcionamentoAtual = normalizarFuncionamento();

const rotulosStatus = {
  pendente: "Aguardando confirmação",
  confirmado: "Confirmado",
  lista_espera: "Lista de espera",
  cancelado: "Cancelado",
  recusado: "Não aprovado",
  novo: "Novo",
  respondido: "Respondido",
  atendida: "Atendida"
};

function rotuloStatus(status) {
  return rotulosStatus[status] || status || "Não informado";
}

function mostrarFeedback(mensagem, tipo = "sucesso") {
  feedback.textContent = mensagem;
  feedback.className = `mensagem ${tipo}`;
}

function celula(texto) {
  const td = document.createElement("td");
  td.textContent = texto ?? "—";
  return td;
}

function formatarTimestamp(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString("pt-BR") : "—";
}

async function registrarAuditoria(acao, entidade, entidadeId, detalhes = "") {
  try {
    await addDoc(collection(db, "auditoria"), {
      adminUid: auth.currentUser.uid,
      adminEmail: auth.currentUser.email || "",
      acao,
      entidade,
      entidadeId,
      detalhes,
      criadoEm: serverTimestamp()
    });
  } catch (error) {
    console.warn("A operação foi concluída, mas o histórico não pôde ser registrado.", error.code);
  }
}

async function executarAcao(botao, acao, mensagem = "Alteração salva.") {
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = "Aguarde...";
  try {
    const retorno = await acao();
    mostrarFeedback(retorno || mensagem);
  } catch (error) {
    mostrarFeedback(error.message || "Não foi possível concluir a operação.", "erro");
    console.error(error);
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}

function botaoAcao(texto, acao, mensagem) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = texto;
  botao.className = "botao-tabela";
  botao.addEventListener("click", () => executarAcao(botao, acao, mensagem));
  return botao;
}

function renderizarAlunos(termo = "") {
  const busca = normalizarBusca(termo);
  const tbody = document.getElementById("alunosAdmin");
  tbody.replaceChildren();

  alunosCache
    .filter(({ dados }) => normalizarBusca(`${dados.nome} ${dados.email} ${dados.telefone}`).includes(busca))
    .forEach(({ dados }) => {
      const tr = document.createElement("tr");
      tr.append(celula(dados.nome), celula(dados.email), celula(dados.telefone));
      tbody.appendChild(tr);
    });
}

function textoDiasHorario(dados) {
  return diasDoHorario(dados)
    .map((indice) => DIAS_SEMANA.find((dia) => dia.indice === indice)?.rotulo.slice(0, 3))
    .filter(Boolean)
    .join(", ");
}

function resumoConteudo(nomeColecao, dados) {
  if (nomeColecao === "planos") return `${dados.nome} — R$ ${Number(dados.valor).toFixed(2)}`;
  if (nomeColecao === "professores") return `${dados.nome} — ${dados.especialidade}`;
  return `${dados.hora} — ${dados.atividade} — ${textoDiasHorario(dados)} — ${capacidadeDoHorario(dados, funcionamentoAtual)} vagas`;
}

async function editarConteudo(nomeColecao, documento) {
  const dados = documento.data();
  const referencia = doc(db, nomeColecao, documento.id);

  if (nomeColecao === "planos") {
    const nome = prompt("Nome do plano", dados.nome);
    if (nome === null) return;
    const valorInformado = prompt("Valor mensal", dados.valor);
    if (valorInformado === null) return;
    const valor = Number(valorInformado.replace(",", "."));
    const beneficios = prompt("Benefícios separados por vírgulas", (dados.beneficios || []).join(", "));
    if (beneficios === null || !nome.trim() || !Number.isFinite(valor) || valor < 0) throw new Error("Dados inválidos.");
    await updateDoc(referencia, {
      nome: nome.trim(),
      valor,
      beneficios: beneficios.split(",").map((item) => item.trim()).filter(Boolean),
      atualizadoEm: serverTimestamp()
    });
  } else if (nomeColecao === "professores") {
    const nome = prompt("Nome do professor", dados.nome);
    if (nome === null) return;
    const especialidade = prompt("Especialidade", dados.especialidade);
    if (especialidade === null) return;
    const fotoUrl = prompt("URL da foto (deixe vazio para usar as iniciais)", dados.fotoUrl || "");
    if (fotoUrl === null || !nome.trim() || !especialidade.trim()) throw new Error("Dados inválidos.");
    await updateDoc(referencia, { nome: nome.trim(), especialidade: especialidade.trim(), fotoUrl: fotoUrl.trim(), atualizadoEm: serverTimestamp() });
  } else {
    const hora = prompt("Horário no formato HH:MM", dados.hora);
    if (hora === null) return;
    const atividade = prompt("Atividade", dados.atividade);
    if (atividade === null) return;
    const capacidadeInformada = prompt("Capacidade máxima", capacidadeDoHorario(dados, funcionamentoAtual));
    if (capacidadeInformada === null) return;
    const diasInformados = prompt("Dias da semana (0=domingo até 6=sábado), separados por vírgulas", diasDoHorario(dados).join(","));
    if (diasInformados === null) return;
    const capacidade = Number(capacidadeInformada);
    const diasSemana = [...new Set(diasInformados.split(",").map(Number))];
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora) || !atividade.trim() || !Number.isInteger(capacidade) || capacidade < 1 || capacidade > 500 || !diasSemana.length || diasSemana.some((dia) => !Number.isInteger(dia) || dia < 0 || dia > 6)) {
      throw new Error("Horário, capacidade ou dias inválidos.");
    }
    if (diasSemana.some((dia) => !horarioDisponivelNoDia({ hora, diasSemana: [dia] }, dia, funcionamentoAtual))) {
      throw new Error("A atividade precisa estar dentro do funcionamento dos dias escolhidos.");
    }
    await updateDoc(referencia, { hora, atividade: atividade.trim(), capacidade, diasSemana, atualizadoEm: serverTimestamp() });
  }

  await registrarAuditoria("editar", nomeColecao, documento.id, resumoConteudo(nomeColecao, { ...dados }));
  await carregarConteudo(nomeColecao);
}

async function carregarConteudo(nomeColecao) {
  const snapshot = await getDocs(collection(db, nomeColecao));
  if (nomeColecao === "horarios") horariosCache = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const alvo = document.getElementById(`lista${nomeColecao[0].toUpperCase() + nomeColecao.slice(1)}Admin`);
  alvo.replaceChildren();

  snapshot.docs.forEach((documento) => {
    const dados = documento.data();
    const ativo = dados.ativo !== false;
    const item = document.createElement("article");
    item.className = "item-resumo item-admin-conteudo";
    const texto = document.createElement("span");
    texto.textContent = `${resumoConteudo(nomeColecao, dados)} — ${ativo ? "Ativo" : "Inativo"}`;
    const acoes = document.createElement("div");
    acoes.className = "acoes-admin";
    acoes.append(
      botaoAcao("Editar", () => editarConteudo(nomeColecao, documento), "Conteúdo atualizado."),
      botaoAcao(ativo ? "Desativar" : "Reativar", async () => {
        await updateDoc(doc(db, nomeColecao, documento.id), { ativo: !ativo, atualizadoEm: serverTimestamp() });
        await registrarAuditoria(ativo ? "desativar" : "reativar", nomeColecao, documento.id, resumoConteudo(nomeColecao, dados));
        await carregarConteudo(nomeColecao);
      }, ativo ? "Conteúdo desativado." : "Conteúdo reativado.")
    );
    item.append(texto, acoes);
    alvo.appendChild(item);
  });
}

function horarioDoAgendamento(dados) {
  return horariosCache.find((item) => item.id === dados.horarioId)
    || horariosCache.find((item) => item.hora === dados.hora)
    || { capacidade: funcionamentoAtual.capacidadePadrao, atividade: dados.atividade || "Aula experimental" };
}

async function atualizarStatusAgendamento(documento, status) {
  const dados = documento.data();
  const referencia = doc(db, "agendamentos", documento.id);
  await updateDoc(referencia, { status, atualizadoEm: serverTimestamp(), atualizadoPor: auth.currentUser.uid });
  await registrarAuditoria("alterar_status", "agendamentos", documento.id, `${rotuloStatus(dados.status)} → ${rotuloStatus(status)}`);
}

async function confirmarAgendamento(documento) {
  const dados = documento.data();
  const horario = horarioDoAgendamento(dados);
  const capacidade = capacidadeDoHorario(horario, funcionamentoAtual);
  const snapshot = await getDocs(query(collection(db, "agendamentos"), where("data", "==", dados.data)));
  const noMesmoDia = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const ocupadas = contarConfirmados(noMesmoDia, dados.data, dados.hora, documento.id);

  if (ocupadas >= capacidade) {
    await atualizarStatusAgendamento(documento, "lista_espera");
    await carregarAdmin();
    return `Turma lotada (${capacidade}/${capacidade}). Solicitação movida para a lista de espera.`;
  }

  await atualizarStatusAgendamento(documento, "confirmado");
  await carregarAdmin();
  return `Agendamento confirmado. Ocupação: ${ocupadas + 1}/${capacidade}.`;
}

async function promoverListaEspera(data, hora) {
  const snapshot = await getDocs(query(collection(db, "agendamentos"), where("data", "==", data)));
  const aguardando = snapshot.docs
    .filter((item) => item.data().hora === hora && item.data().status === "lista_espera")
    .sort((a, b) => (a.data().criadoEm?.seconds || 0) - (b.data().criadoEm?.seconds || 0));
  if (!aguardando.length) return "";
  await atualizarStatusAgendamento(aguardando[0], "pendente");
  return " A primeira pessoa da lista de espera voltou para análise.";
}

async function reconciliarListasEspera(documentos) {
  const grupos = new Map();
  documentos.forEach((documento) => {
    const dados = documento.data();
    const chave = `${dados.data}_${dados.hora}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(documento);
  });

  let promoveu = false;
  for (const itens of grupos.values()) {
    const referencia = itens[0].data();
    const capacidade = capacidadeDoHorario(horarioDoAgendamento(referencia), funcionamentoAtual);
    const proximo = proximoDaLista(itens.map((item) => ({ id: item.id, ...item.data() })), capacidade);
    if (proximo) {
      await atualizarStatusAgendamento(itens.find((item) => item.id === proximo.id), "pendente");
      promoveu = true;
    }
  }
  return promoveu;
}

function renderizarAgendamentos(documentos) {
  agendamentosCache = documentos.map((item) => ({ id: item.id, ...item.data() }));
  const tbody = document.getElementById("agendamentosAdmin");
  tbody.replaceChildren();

  documentos.forEach((documento) => {
    const dados = documento.data();
    const horario = horarioDoAgendamento(dados);
    const capacidade = capacidadeDoHorario(horario, funcionamentoAtual);
    const confirmados = contarConfirmados(agendamentosCache, dados.data, dados.hora);
    const tr = document.createElement("tr");
    tr.append(
      celula(dados.nome),
      celula(formatarDataISO(dados.data)),
      celula(dados.hora),
      celula(dados.atividade || horario.atividade),
      celula(dados.plano),
      celula(`${confirmados}/${capacidade}`),
      celula(rotuloStatus(dados.status))
    );
    const acoes = document.createElement("td");
    if (["pendente", "lista_espera"].includes(dados.status)) {
      acoes.append(botaoAcao("Confirmar", () => confirmarAgendamento(documento), "Agendamento confirmado."));
    }
    if (["pendente", "confirmado", "lista_espera"].includes(dados.status)) {
      acoes.append(botaoAcao("Cancelar", async () => {
        const liberarVaga = dados.status === "confirmado";
        await atualizarStatusAgendamento(documento, "cancelado");
        const promocao = liberarVaga ? await promoverListaEspera(dados.data, dados.hora) : "";
        await carregarAdmin();
        return `Agendamento cancelado.${promocao}`;
      }, "Agendamento cancelado."));
    }
    if (["pendente", "lista_espera"].includes(dados.status)) {
      acoes.append(botaoAcao("Não aprovar", async () => {
        await atualizarStatusAgendamento(documento, "recusado");
        await carregarAdmin();
      }, "Solicitação não aprovada."));
    }
    if (!acoes.childElementCount) acoes.textContent = "Sem ações";
    tr.append(acoes);
    tbody.appendChild(tr);
  });
}

function renderizarContatos(documentos) {
  const tbody = document.getElementById("contatosAdmin");
  tbody.replaceChildren();
  documentos.forEach((documento) => {
    const dados = documento.data();
    const tr = document.createElement("tr");
    tr.append(celula(dados.nome), celula(dados.email), celula(dados.mensagem), celula(rotuloStatus(dados.status)));
    const acoes = document.createElement("td");
    if (dados.status !== "respondido") {
      acoes.append(botaoAcao("Marcar respondido", async () => {
        await updateDoc(doc(db, "contatos", documento.id), { status: "respondido", atualizadoEm: serverTimestamp() });
        await registrarAuditoria("responder", "contatos", documento.id, dados.email);
        await carregarAdmin();
      }, "Contato marcado como respondido."));
    } else acoes.textContent = "Concluído";
    tr.append(acoes);
    tbody.appendChild(tr);
  });
}

function renderizarPrivacidade(documentos) {
  const tbody = document.getElementById("privacidadeAdmin");
  tbody.replaceChildren();
  if (!documentos.length) {
    const tr = document.createElement("tr");
    const td = celula("Nenhuma solicitação pendente.");
    td.colSpan = 5;
    tr.append(td);
    tbody.append(tr);
    return;
  }
  documentos.forEach((documento) => {
    const dados = documento.data();
    const tr = document.createElement("tr");
    tr.append(celula(dados.email), celula(dados.tipo === "exclusao" ? "Exclusão de dados" : dados.tipo), celula(formatarTimestamp(dados.criadoEm)), celula(rotuloStatus(dados.status)));
    const acoes = document.createElement("td");
    if (dados.status === "pendente") {
      acoes.append(botaoAcao("Marcar atendida", async () => {
        await updateDoc(doc(db, "solicitacoes_privacidade", documento.id), { status: "atendida", atualizadoEm: serverTimestamp(), atualizadoPor: auth.currentUser.uid });
        await registrarAuditoria("atender", "solicitacoes_privacidade", documento.id, dados.email);
        await carregarAdmin();
      }, "Solicitação marcada como atendida."));
    } else acoes.textContent = "Concluída";
    tr.append(acoes);
    tbody.appendChild(tr);
  });
}

function atualizarCamposDia(linha) {
  const personalizado = linha.querySelector("select").value === "personalizado";
  linha.querySelectorAll('input[type="time"]').forEach((campo) => {
    campo.disabled = !personalizado;
    campo.required = personalizado;
  });
}

function montarFormularioFuncionamento() {
  const container = document.getElementById("funcionamentoDias");
  container.replaceChildren();
  DIAS_SEMANA.forEach(({ id, rotulo }) => {
    const regra = funcionamentoAtual.dias[id];
    const linha = document.createElement("fieldset");
    linha.className = "linha-funcionamento";
    const legenda = document.createElement("legend");
    legenda.textContent = rotulo;
    const select = document.createElement("select");
    select.id = `modo-${id}`;
    select.setAttribute("aria-label", `Funcionamento de ${rotulo}`);
    [["fechado", "Fechado"], ["24h", "Aberto 24 horas"], ["personalizado", "Horário personalizado"]].forEach(([valor, texto]) => select.appendChild(new Option(texto, valor)));
    select.value = regra.modo;
    const abertura = document.createElement("input");
    abertura.type = "time";
    abertura.id = `abertura-${id}`;
    abertura.value = regra.abertura || "06:00";
    abertura.setAttribute("aria-label", `Abertura de ${rotulo}`);
    const fechamento = document.createElement("input");
    fechamento.type = "time";
    fechamento.id = `fechamento-${id}`;
    fechamento.value = regra.fechamento || "22:00";
    fechamento.setAttribute("aria-label", `Fechamento de ${rotulo}`);
    linha.append(legenda, select, abertura, fechamento);
    select.addEventListener("change", () => atualizarCamposDia(linha));
    container.appendChild(linha);
    atualizarCamposDia(linha);
  });
  document.getElementById("capacidadePadraoAdmin").value = funcionamentoAtual.capacidadePadrao;
}

async function carregarFuncionamento() {
  const snapshot = await getDoc(doc(db, "configuracoes", "funcionamento"));
  funcionamentoAtual = normalizarFuncionamento(snapshot.exists() ? snapshot.data() : {});
  montarFormularioFuncionamento();
}

async function carregarAuditoria() {
  const tbody = document.getElementById("auditoriaAdmin");
  tbody.replaceChildren();
  const snapshot = await getDocs(query(collection(db, "auditoria"), orderBy("criadoEm", "desc"), limit(30)));
  snapshot.docs.forEach((documento) => {
    const dados = documento.data();
    const tr = document.createElement("tr");
    tr.append(celula(formatarTimestamp(dados.criadoEm)), celula(dados.adminEmail), celula(dados.acao), celula(`${dados.entidade}: ${dados.entidadeId}`), celula(dados.detalhes));
    tbody.appendChild(tr);
  });
  if (snapshot.empty) {
    const tr = document.createElement("tr");
    const td = celula("O histórico começará a partir desta versão.");
    td.colSpan = 5;
    tr.append(td);
    tbody.append(tr);
  }
}

async function carregarAdmin() {
  await carregarFuncionamento();
  const [alunos, agendamentosIniciais, contatos, privacidade] = await Promise.all([
    getDocs(collection(db, "usuarios")),
    getDocs(query(collection(db, "agendamentos"), orderBy("criadoEm", "desc"))),
    getDocs(query(collection(db, "contatos"), orderBy("criadoEm", "desc"))),
    getDocs(query(collection(db, "solicitacoes_privacidade"), orderBy("criadoEm", "desc"))),
    ...["planos", "professores", "horarios"].map(carregarConteudo)
  ]);

  let agendamentos = agendamentosIniciais;
  if (await reconciliarListasEspera(agendamentos.docs)) {
    agendamentos = await getDocs(query(collection(db, "agendamentos"), orderBy("criadoEm", "desc")));
  }

  alunosCache = alunos.docs.map((documento) => ({ id: documento.id, dados: documento.data() }));
  renderizarAlunos(document.getElementById("buscaAlunos").value);
  renderizarAgendamentos(agendamentos.docs);
  renderizarContatos(contatos.docs);
  renderizarPrivacidade(privacidade.docs);
  document.getElementById("totalAlunos").textContent = alunos.size;
  document.getElementById("totalAgendamentos").textContent = agendamentos.size;
  document.getElementById("totalContatos").textContent = contatos.size;
  document.getElementById("totalPrivacidade").textContent = privacidade.docs.filter((item) => item.data().status === "pendente").length;
  await carregarAuditoria();
}

async function salvarConteudo(colecaoNome, dados, form) {
  const botao = form.querySelector('button[type="submit"]');
  await executarAcao(botao, async () => {
    const referencia = await addDoc(collection(db, colecaoNome), { ...dados, ativo: true, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() });
    await registrarAuditoria("criar", colecaoNome, referencia.id, resumoConteudo(colecaoNome, dados));
    form.reset();
    if (colecaoNome === "horarios") {
      form.querySelectorAll('input[type="checkbox"]').forEach((campo) => { campo.checked = campo.value !== "0"; });
      document.getElementById("horarioCapacidadeAdmin").value = funcionamentoAtual.capacidadePadrao;
    }
    await carregarConteudo(colecaoNome);
  }, "Conteúdo salvo.");
}

document.getElementById("funcionamentoForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const botao = form.querySelector('button[type="submit"]');
  await executarAcao(botao, async () => {
    const dias = {};
    for (const { id, rotulo } of DIAS_SEMANA) {
      const modo = document.getElementById(`modo-${id}`).value;
      const abertura = document.getElementById(`abertura-${id}`).value;
      const fechamento = document.getElementById(`fechamento-${id}`).value;
      if (modo === "personalizado" && (!abertura || !fechamento || abertura >= fechamento)) throw new Error(`Confira a abertura e o fechamento de ${rotulo}.`);
      dias[id] = { modo, abertura: modo === "personalizado" ? abertura : "", fechamento: modo === "personalizado" ? fechamento : "" };
    }
    const capacidadePadrao = Number(document.getElementById("capacidadePadraoAdmin").value);
    if (!Number.isInteger(capacidadePadrao) || capacidadePadrao < 1 || capacidadePadrao > 500) throw new Error("A capacidade padrão deve ficar entre 1 e 500.");
    await setDoc(doc(db, "configuracoes", "funcionamento"), { dias, capacidadePadrao, atualizadoEm: serverTimestamp(), atualizadoPor: auth.currentUser.uid });
    funcionamentoAtual = normalizarFuncionamento({ dias, capacidadePadrao });
    await registrarAuditoria("configurar", "configuracoes", "funcionamento", DIAS_SEMANA.map(({ id, rotulo }) => `${rotulo}: ${formatarFuncionamento(funcionamentoAtual.dias[id])}`).join("; "));
    await carregarConteudo("horarios");
    const foraDoFuncionamento = horariosCache.filter((horario) => horario.ativo !== false && diasDoHorario(horario).some((dia) => !horarioDisponivelNoDia(horario, dia, funcionamentoAtual))).length;
    if (foraDoFuncionamento) return `Funcionamento salvo. Revise ${foraDoFuncionamento} atividade(s) que ficaram fora dos novos horários.`;
    return "Funcionamento semanal atualizado.";
  }, "Funcionamento semanal atualizado.");
});

document.getElementById("planoForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarConteudo("planos", {
    nome: document.getElementById("planoNomeAdmin").value.trim(),
    valor: Number(document.getElementById("planoValorAdmin").value),
    beneficios: document.getElementById("planoBeneficiosAdmin").value.split(",").map((valor) => valor.trim()).filter(Boolean)
  }, event.currentTarget);
});

document.getElementById("professorForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarConteudo("professores", {
    nome: document.getElementById("professorNomeAdmin").value.trim(),
    especialidade: document.getElementById("professorEspecialidadeAdmin").value.trim(),
    fotoUrl: document.getElementById("professorFotoAdmin").value.trim()
  }, event.currentTarget);
});

document.getElementById("horarioForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const diasSemana = [...event.currentTarget.querySelectorAll('input[name="horarioDias"]:checked')].map((campo) => Number(campo.value));
  if (!diasSemana.length) {
    mostrarFeedback("Selecione pelo menos um dia para a atividade.", "erro");
    return;
  }
  const hora = document.getElementById("horarioHoraAdmin").value;
  if (diasSemana.some((dia) => !horarioDisponivelNoDia({ hora, diasSemana: [dia] }, dia, funcionamentoAtual))) {
    mostrarFeedback("A atividade precisa estar dentro do funcionamento dos dias escolhidos.", "erro");
    return;
  }
  await salvarConteudo("horarios", {
    hora,
    atividade: document.getElementById("horarioAtividadeAdmin").value.trim(),
    capacidade: Number(document.getElementById("horarioCapacidadeAdmin").value),
    diasSemana
  }, event.currentTarget);
});

document.getElementById("buscaAlunos").addEventListener("input", (event) => renderizarAlunos(event.target.value));

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    window.location.href = "login.html";
    return;
  }
  try {
    await reload(usuario);
    if (!usuario.emailVerified) {
      carregando.textContent = "Verifique o e-mail desta conta antes de acessar a administração.";
      return;
    }
    await getIdToken(usuario, true);
    const admin = await getDoc(doc(db, "admins", usuario.uid));
    if (!admin.exists() || admin.data().ativo !== true) {
      carregando.textContent = "Acesso negado: esta conta não é administradora.";
      return;
    }
    await carregarAdmin();
    carregando.hidden = true;
    conteudo.hidden = false;
  } catch (error) {
    carregando.textContent = "Não foi possível carregar o painel.";
    console.error(error);
  }
});

document.getElementById("sair").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
