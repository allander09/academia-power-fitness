import { createHash, randomUUID } from "node:crypto";
import { atividadeDisponivel, dataHoraFutura, dadosParaProfessor, decidirStatus, STATUS_ATIVOS } from "./domain.mjs";

export function criarServico({ db, auth, FieldValue, Timestamp, Erro, agora = () => new Date() }) {
  const falha = (codigo, mensagem) => { throw new Erro(codigo, mensagem); };
  const ref = (colecao, id) => db.collection(colecao).doc(id);
  const texto = (valor, minimo = 1, maximo = 150) => typeof valor === "string" && valor.trim().length >= minimo && valor.length <= maximo;
  const idValido = valor => texto(valor) && !valor.includes("/");
  const timestamp = () => FieldValue.serverTimestamp();
  const normalizarCPF = valor => String(valor || "").replace(/\\D/g, "");
  const cpfValido = valor => {
    const cpf = normalizarCPF(valor);
    if (cpf.length !== 11 || /^([0-9])\\1{10}$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
    let digito = (soma * 10) % 11; if (digito === 10) digito = 0;
    if (digito !== Number(cpf[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
    digito = (soma * 10) % 11; if (digito === 10) digito = 0;
    return digito === Number(cpf[10]);
  };
  const hashCPF = cpf => createHash("sha256").update(cpf).digest("hex");

  async function usuario(request) {
    if (!request.auth) falha("unauthenticated", "Entre na sua conta.");
    const conta = await auth.getUser(request.auth.uid).catch(() => null);
    if (!conta || conta.disabled) falha("permission-denied", "Esta conta não está disponível.");
    if (!conta.emailVerified || request.auth.token.email_verified !== true) falha("failed-precondition", "Verifique seu e-mail para continuar.");
    return { uid: conta.uid, email: conta.email };
  }

  async function permissoes(conta, transacao) {
    const ler = referencia => transacao ? transacao.get(referencia) : referencia.get();
    const [admin, professor, exclusao] = await Promise.all([
      ler(ref("admins", conta.uid)), ler(ref("professores_acesso", conta.uid)), ler(ref("exclusoes", conta.uid))
    ]);
    if (exclusao.exists) falha("permission-denied", "A exclusão desta conta está em andamento.");
    return { admin: admin.data()?.ativo === true, professor: professor.data()?.ativo === true };
  }

  function auditar(transacao, conta, acao, entidade, entidadeId, detalhes = "") {
    transacao.set(db.collection("auditoria").doc(), {
      adminUid: conta.uid, adminEmail: conta.email || "", acao, entidade, entidadeId, detalhes, criadoEm: timestamp()
    });
  }

  function capacidadeDaAtividade(atividade, funcionamento) {
    return atividade?.capacidade || funcionamento?.capacidadePadrao || 20;
  }

  async function listarDisponibilidadeAgendamento(request) {
    const data = typeof request.data?.data === "string" ? request.data.data : "";
    if (data && !/^\d{4}-\d{2}-\d{2}$/.test(data)) falha("invalid-argument", "Informe uma data válida.");
    const [horarios, funcionamento, professores, agendamentos] = await Promise.all([
      db.collection("horarios").where("ativo", "==", true).get(),
      ref("configuracoes", "funcionamento").get(),
      db.collection("professores_acesso").where("ativo", "==", true).get(),
      data ? db.collection("agendamentos").where("data", "==", data).get() : Promise.resolve({ docs: [] })
    ]);
    const professoresAtivos = new Map(professores.docs.map(item => [item.id, item.data()]));
    const confirmadosPorHorario = {};
    agendamentos.docs.forEach(item => {
      const dados = item.data();
      if (dados.status === "confirmado") confirmadosPorHorario[dados.horarioId] = (confirmadosPorHorario[dados.horarioId] || 0) + 1;
    });

    const funcionamentoDados = funcionamento.data() || {};
    return {
      data,
      horarios: horarios.docs
        .map(documento => {
          const dados = documento.data();
          const professorUid = dados.professorUid || "";
          const professor = professorUid ? professoresAtivos.get(professorUid) : null;
          if (professorUid && !professor) return null;
          const capacidade = capacidadeDaAtividade(dados, funcionamentoDados);
          const confirmados = confirmadosPorHorario[documento.id] || 0;
          const dentroDoFuncionamento = !data || atividadeDisponivel(dados, data, funcionamentoDados);
          const futuro = !data || dataHoraFutura(data, dados.hora, agora());
          const vagasDisponiveis = Math.max(0, capacidade - confirmados);
          return {
            id: documento.id,
            atividade: dados.atividade,
            hora: dados.hora,
            diasSemana: dados.diasSemana || [1, 2, 3, 4, 5, 6],
            capacidade,
            vagasDisponiveis,
            professorUid,
            professorNome: professor?.nome || dados.professorNome || "",
            professorEspecialidade: professor?.especialidade || "",
            disponivel: Boolean(dentroDoFuncionamento && futuro && vagasDisponiveis > 0),
            motivoIndisponivel: !dentroDoFuncionamento ? "fora_funcionamento" : !futuro ? "data_passada" : vagasDisponiveis <= 0 ? "sem_vagas" : ""
          };
        })
        .filter(Boolean)
        .sort((a, b) => `${a.atividade} ${a.professorNome} ${a.hora}`.localeCompare(`${b.atividade} ${b.professorNome} ${b.hora}`))
    };
  }

  async function solicitarAgendamento(request) {
    const conta = await usuario(request);
    const { data, horarioId, plano } = request.data || {};\n    const tipoAgendamento = request.data?.tipoAgendamento === "experimental" ? "experimental" : "normal";\n    const cpfExperimental = tipoAgendamento === "experimental" ? normalizarCPF(request.data?.cpf) : "";\n    if (tipoAgendamento === "experimental" && !cpfValido(cpfExperimental)) falha("invalid-argument", "Informe um CPF válido para a aula experimental.");
    const professorEscolhido = typeof request.data?.professorUid === "string" ? request.data.professorUid.trim() : "";
    if (!idValido(horarioId) || !texto(plano, 3, 100)) falha("invalid-argument", "Selecione uma atividade e um plano válidos.");
    return db.runTransaction(async transacao => {
      await permissoes(conta, transacao);
      const bloqueioExperimental = cpfExperimental ? ref("controles_experimentais", hashCPF(cpfExperimental)) : null;\n      const [perfil, horario, funcionamento, planos, turmaSnapshot, lockSnapshot] = await Promise.all([
        transacao.get(ref("usuarios", conta.uid)), transacao.get(ref("horarios", horarioId)), transacao.get(ref("configuracoes", "funcionamento")),
        plano.trim() === "Ainda não decidi" ? null : transacao.get(db.collection("planos").where("nome", "==", plano.trim())),
        transacao.get(db.collection("agendamentos").where("data", "==", data).where("horarioId", "==", horarioId))
      ]);
      if (planos && !planos.docs.some(item => item.data().ativo === true)) falha("failed-precondition", "Este plano não está disponível. Atualize a página e escolha um plano publicado ou Ainda não decidi.");
      const atividade = horario.data();
      if (!perfil.exists || !texto(perfil.data().nome, 3, 100)) falha("failed-precondition", "Complete seu perfil antes de agendar.");
      if (!atividadeDisponivel(atividade, data, funcionamento.data()) || !dataHoraFutura(data, atividade?.hora, agora())) falha("failed-precondition", "Escolha uma atividade disponível em uma data futura.");
      const professorUid = atividade.professorUid || "";
      if (professorUid) {
        if (professorEscolhido !== professorUid) falha("failed-precondition", "Escolha o professor vinculado a esta atividade.");
        const professor = await transacao.get(ref("professores_acesso", professorUid));
        if (professor.data()?.ativo !== true) falha("failed-precondition", "Este professor não está disponível para agendamento.");
      } else if (professorEscolhido) {
        falha("failed-precondition", "Este horário não possui professor vinculado.");
      }
      if (tipoAgendamento === "experimental" && lockSnapshot?.exists) falha("already-exists", "Este CPF já possui uma aula experimental registrada.");\n      const capacidade = capacidadeDaAtividade(atividade, funcionamento.data());
      if (turmaSnapshot.docs.filter(item => item.data().status === "confirmado").length >= capacidade) falha("resource-exhausted", "Este horário está sem vagas disponíveis.");
      const identificador = `${conta.uid}_${data}_${atividade.hora}`;
      const referencia = ref("agendamentos", identificador);
      const [existente, historico] = await Promise.all([
        transacao.get(referencia), transacao.get(db.collection("agendamentos").where("usuarioId", "==", conta.uid))
      ]);
      if (existente.exists && STATUS_ATIVOS.includes(existente.data().status)) falha("already-exists", "Você já tem uma solicitação ativa nesta data e horário.");
      if (historico.docs.some(item => item.data().data === data && item.data().hora === atividade.hora && STATUS_ATIVOS.includes(item.data().status))) falha("already-exists", "Você já tem uma solicitação ativa nesta data e horário.");
      const dados = {
        usuarioId: conta.uid, nome: perfil.data().nome, email: conta.email, data, hora: atividade.hora,
        horarioId, atividade: atividade.atividade, plano: plano.trim(), professorUid,
        professorNome: atividade.professorNome || "", tipoAgendamento, status: "pendente", presenca: "nao_registrada",
        aulaId: randomUUID(), criadoEm: timestamp(), atualizadoEm: timestamp()
      };
      transacao.set(referencia, dados);
      return { id: identificador, status: "pendente" };
    });
  }

  async function alterarAgendamento(request) {
    const conta = await usuario(request);
    const { id, status, presenca, aulaId } = request.data || {};
    let identificador = id;
    if (presenca) {
      if (!idValido(aulaId) || !["presente", "ausente"].includes(presenca)) falha("invalid-argument", "Presença inválida.");
      const resultado = await db.collection("agendamentos").where("aulaId", "==", aulaId).limit(1).get();
      identificador = resultado.docs[0]?.id;
    }
    if (!idValido(identificador)) falha("invalid-argument", "Agendamento inválido.");
    return db.runTransaction(async transacao => {
      const papeis = await permissoes(conta, transacao);
      const referencia = ref("agendamentos", identificador);
      const snapshot = await transacao.get(referencia);
      if (!snapshot.exists) falha("not-found", "Agendamento não encontrado.");
      const dados = snapshot.data();
      if (!idValido(dados.horarioId)) falha("failed-precondition", "Este agendamento antigo precisa ser vinculado a uma atividade pela equipe responsável.");
      if (presenca) {
        if ((!papeis.professor || dados.professorUid !== conta.uid) && !papeis.admin) falha("permission-denied", "Acesso negado a esta atividade.");
        if (dados.status !== "confirmado") falha("failed-precondition", "A presença exige um agendamento confirmado.");
        transacao.update(referencia, { presenca, atualizadoEm: timestamp(), atualizadoPor: conta.uid });
        auditar(transacao, conta, "registrar_presenca", "agendamentos", identificador, presenca);
        return { presenca };
      }
      if (!papeis.admin && !(dados.usuarioId === conta.uid && status === "cancelado")) falha("permission-denied", "Você não pode alterar este agendamento.");
      const bloqueio = ref("turmas", `${dados.data}_${dados.horarioId}`);
      const [horario, funcionamento, turmaSnapshot, , exclusao] = await Promise.all([
        transacao.get(ref("horarios", dados.horarioId)), transacao.get(ref("configuracoes", "funcionamento")),
        transacao.get(db.collection("agendamentos").where("data", "==", dados.data).where("horarioId", "==", dados.horarioId)),
        transacao.get(bloqueio), transacao.get(ref("exclusoes", dados.usuarioId))
      ]);
      if (status === "confirmado" && exclusao.exists) falha("failed-precondition", "A conta do aluno está sendo excluída.");
      const atividade = horario.data();
      if (status === "confirmado" && (!atividadeDisponivel(atividade, dados.data, funcionamento.data()) || !dataHoraFutura(dados.data, dados.hora, agora()) || atividade.hora !== dados.hora)) falha("failed-precondition", "Esta atividade não está disponível para confirmação.");
      const capacidade = atividade?.capacidade || funcionamento.data()?.capacidadePadrao || 20;
      let novoStatus;
      try { novoStatus = decidirStatus(dados, status, turmaSnapshot.docs.map(item => item.data()), capacidade); }
      catch (error) { falha("failed-precondition", error.message); }
      const aguardando = turmaSnapshot.docs.filter(item => item.id !== identificador && item.data().status === "lista_espera")
        .sort((a, b) => (a.data().criadoEm?.toMillis() || 0) - (b.data().criadoEm?.toMillis() || 0));
      const promover = dados.status === "confirmado" && novoStatus === "cancelado" ? aguardando[0] : null;
      transacao.update(referencia, { status: novoStatus, atualizadoEm: timestamp(), atualizadoPor: conta.uid });
      transacao.set(bloqueio, { atualizadoEm: timestamp() });
      auditar(transacao, conta, "alterar_status", "agendamentos", identificador, `${dados.status} → ${novoStatus}`);
      if (promover) {
        transacao.update(promover.ref, { status: "pendente", atualizadoEm: timestamp(), atualizadoPor: conta.uid });
        auditar(transacao, conta, "promover_fila", "agendamentos", promover.id);
      }
      return { status: novoStatus, promoveu: Boolean(promover), capacidade };
    });
  }

  async function listarAulasProfessor(request) {
    const conta = await usuario(request);
    const papeis = await permissoes(conta);
    if (!papeis.professor) falha("permission-denied", "Esta conta não possui acesso de professor.");
    const snapshot = await db.collection("agendamentos").where("professorUid", "==", conta.uid).get();
    const alunos = new Set();
    const aulas = [];
    for (const item of snapshot.docs) {
      const dados = item.data();
      if (!dados.aulaId) {
        dados.aulaId = await db.runTransaction(async transacao => {
          const atual = await transacao.get(item.ref);
          if (!atual.exists || atual.data().professorUid !== conta.uid) return "";
          if (atual.data().aulaId) return atual.data().aulaId;
          const valor = randomUUID(); transacao.update(item.ref, { aulaId: valor }); return valor;
        });
      }
      if (!dados.aulaId) continue;
      if (STATUS_ATIVOS.includes(dados.status)) alunos.add(dados.usuarioId);
      aulas.push(dadosParaProfessor(dados));
    }
    return { aulas, totalAlunos: alunos.size };
  }

  async function salvarHorario(request) {
    const conta = await usuario(request);
    const { id, dados } = request.data || {};
    if (id && !idValido(id)) falha("invalid-argument", "Atividade inválida.");
    const referencia = id ? ref("horarios", id) : db.collection("horarios").doc();
    return db.runTransaction(async transacao => {
      if (!(await permissoes(conta, transacao)).admin) falha("permission-denied", "Acesso administrativo necessário.");
      const existente = await transacao.get(referencia);
      const valor = { ...(existente.data() || {}), ...dados };
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(valor.hora || "") || !texto(valor.atividade, 2, 100) || !Number.isInteger(valor.capacidade) || valor.capacidade < 1 || valor.capacidade > 500 || !Array.isArray(valor.diasSemana) || !valor.diasSemana.length || valor.diasSemana.length > 7 || valor.diasSemana.some(dia => !Number.isInteger(dia) || dia < 0 || dia > 6) || typeof valor.ativo !== "boolean") falha("invalid-argument", "Confira horário, atividade, capacidade e dias.");
      const professorUid = valor.professorUid || "";
      if (professorUid && !idValido(professorUid)) falha("invalid-argument", "Professor inválido.");
      const [professor, turma] = await Promise.all([
        professorUid ? transacao.get(ref("professores_acesso", professorUid)) : null,
        transacao.get(db.collection("agendamentos").where("horarioId", "==", referencia.id))
      ]);
      if (professorUid && professor?.data()?.ativo !== true) falha("failed-precondition", "Escolha um professor com acesso ativo.");
      const futuros = turma.docs.filter(item => dataHoraFutura(item.data().data, item.data().hora, agora()) && STATUS_ATIVOS.includes(item.data().status));
      if (futuros.length > 350) falha("resource-exhausted", "Esta atividade exige uma migração assistida pela quantidade de agendamentos.");
      if (futuros.length && existente.data()?.hora !== valor.hora) falha("failed-precondition", "Cancele os agendamentos futuros antes de mudar a hora da atividade.");
      const ocupacao = {};
      futuros.filter(item => item.data().status === "confirmado").forEach(item => { ocupacao[item.data().data] = (ocupacao[item.data().data] || 0) + 1; });
      if (Object.values(ocupacao).some(total => total > valor.capacidade)) falha("failed-precondition", "A capacidade não pode ficar abaixo das vagas já confirmadas.");
      const professorNome = professor?.data()?.nome || "";
      transacao.set(referencia, {
        hora: valor.hora, atividade: valor.atividade.trim(), capacidade: valor.capacidade, diasSemana: [...new Set(valor.diasSemana)],
        professorUid, professorNome, ativo: valor.ativo, criadoEm: existente.data()?.criadoEm || timestamp(), atualizadoEm: timestamp()
      });
      futuros.forEach(item => transacao.update(item.ref, { professorUid, professorNome, atividade: valor.atividade.trim(), atualizadoEm: timestamp(), atualizadoPor: conta.uid }));
      auditar(transacao, conta, "salvar_atividade", "horarios", referencia.id);
      return { id: referencia.id };
    });
  }

  function serializar(valor) {
    if (valor?.toDate) return valor.toDate().toISOString();
    if (Array.isArray(valor)) return valor.map(serializar);
    if (valor && typeof valor === "object") return Object.fromEntries(Object.entries(valor).map(([chave, item]) => [chave, serializar(item)]));
    return valor;
  }

  async function exportarDados(request) {
    const conta = await usuario(request);
    await permissoes(conta);
    const [perfil, agendamentos, contatos, solicitacao, professor] = await Promise.all([
      ref("usuarios", conta.uid).get(), db.collection("agendamentos").where("usuarioId", "==", conta.uid).get(),
      db.collection("contatos").where("usuarioId", "==", conta.uid).get(), ref("solicitacoes_privacidade", conta.uid).get(), ref("professores_acesso", conta.uid).get()
    ]);
    const registros = snapshot => snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    return serializar({ exportadoEm: agora().toISOString(), conta, perfil: perfil.data() || null, agendamentos: registros(agendamentos), contatos: registros(contatos), solicitacaoPrivacidade: solicitacao.data() || null, acessoProfessor: professor.data() || null });
  }

  async function excluirConta(request) {
    const conta = await usuario(request);
    if (!(await permissoes(conta)).admin) falha("permission-denied", "Acesso administrativo necessário.");
    const uid = request.data?.usuarioId;
    if (!idValido(uid) || request.data?.confirmacao !== "EXCLUIR") falha("invalid-argument", "Confirme a exclusão da conta.");
    if (uid === conta.uid) falha("failed-precondition", "Não é possível excluir a própria conta administrativa.");
    const solicitacao = ref("solicitacoes_privacidade", uid);
    const bloqueio = ref("exclusoes", uid);
    const alvo = await auth.getUser(uid).catch(error => { if (error.code === "auth/user-not-found") return null; throw error; });
    const pedidoOriginal = await solicitacao.get();
    const email = alvo?.email || pedidoOriginal.data()?.email;
    await db.runTransaction(async transacao => {
      const [pedido, admin, professor] = await Promise.all([transacao.get(solicitacao), transacao.get(ref("admins", uid)), transacao.get(ref("professores_acesso", uid))]);
      if (!pedido.exists || !["pendente", "processando"].includes(pedido.data().status)) falha("failed-precondition", "É necessário um pedido de exclusão aberto.");
      if (admin.data()?.ativo === true || professor.data()?.ativo === true) falha("failed-precondition", "Revogue os acessos de administrador e professor antes da exclusão.");
      transacao.set(bloqueio, { iniciadoEm: timestamp() });
      transacao.update(solicitacao, { status: "processando", atualizadoEm: timestamp() });
    });
    if (alvo) { await auth.updateUser(uid, { disabled: true }); await auth.revokeRefreshTokens(uid); }
    const agendamentos = await db.collection("agendamentos").where("usuarioId", "==", uid).get();
    for (const item of agendamentos.docs) {
      if (STATUS_ATIVOS.includes(item.data().status)) await alterarAgendamento({ ...request, data: { id: item.id, status: "cancelado" } });
      await item.ref.delete();
    }
    const consultas = [db.collection("contatos").where("usuarioId", "==", uid).get(), db.collection("auditoria").get()];
    if (email) consultas.push(db.collection("contatos").where("email", "==", email).get());
    const snapshots = await Promise.all(consultas);
    const apagar = new Map();
    snapshots.forEach((snapshot, indice) => snapshot.docs.forEach(item => {
      const dados = item.data();
      if (indice !== 1 || dados.adminUid === uid || dados.entidadeId === uid || String(dados.entidadeId || "").startsWith(`${uid}_`) || (email && String(dados.detalhes || "").includes(email))) apagar.set(item.ref.path, item.ref);
    }));
    const writer = db.bulkWriter();
    const operacoes = [...apagar.values()].map(referencia => writer.delete(referencia));
    const [atividadesProfessor, reservasProfessor] = await Promise.all([
      db.collection("horarios").where("professorUid", "==", uid).get(),
      db.collection("agendamentos").where("professorUid", "==", uid).get()
    ]);
    for (const item of [...atividadesProfessor.docs, ...reservasProfessor.docs]) operacoes.push(writer.update(item.ref, { professorUid: "", professorNome: "", atualizadoEm: timestamp() }));
    for (const colecao of ["usuarios", "admins", "professores_acesso"]) operacoes.push(writer.delete(ref(colecao, uid)));
    await writer.close();
    await Promise.all(operacoes);
    if (alvo) await auth.deleteUser(uid);
    const protocolo = randomUUID();
    await db.runTransaction(async transacao => {
      transacao.delete(solicitacao);
      transacao.set(bloqueio, { iniciadoEm: timestamp(), expiraEm: Timestamp.fromDate(new Date(agora().getTime() + 24 * 60 * 60 * 1000)) });
      transacao.set(ref("comprovantes_privacidade", protocolo), { protocolo, concluidoEm: timestamp(), tipo: "exclusao", executadoPor: conta.uid });
    });
    return { protocolo, mensagem: "Conta e dados vinculados excluídos. Registre o protocolo e comunique a conclusão ao titular." };
  }

  return { listarDisponibilidadeAgendamento, solicitarAgendamento, alterarAgendamento, listarAulasProfessor, salvarHorario, exportarDados, excluirConta };
}
