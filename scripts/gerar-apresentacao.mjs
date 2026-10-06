import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scriptsPublicos = ["script.js", "modal.js", "imc.js", "mensalidade.js", "calculos.mjs"];

function substituir(html, padrao, texto, descricao) {
  if (!padrao.test(html)) throw new Error(`Estrutura inesperada: ${descricao}. Revise a apresentação antes de publicar.`);
  return html.replace(padrao, texto);
}

export async function gerarApresentacao(destino = join(raiz, "dist-apresentacao")) {
  let html = await readFile(join(raiz, "html/index.html"), "utf8");
  html = substituir(html, /<div class="conta-cabecalho">[\s\S]*?<\/div>\s*<\/div>/,
    '<a class="conta-entrar" href="#perfis">Conhecer perfis</a>', "menu de conta");
  for (const id of ["agendamento", "contato"]) {
    html = substituir(html, new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`), "", `formulário ${id}`);
  }
  html = substituir(html, /<a href="\.\.\/html\/formularios\.html" class="btn-cadastro">Cadastre-se<\/a>/, "", "cadastro");
  html = html.replaceAll('href="#agendamento"', 'href="#perfis"')
    .replaceAll('href="#contato"', 'href="#projeto"')
    .replaceAll(">Agendamento</a>", ">Perfis</a>")
    .replaceAll(">Contato</a>", ">Projeto</a>")
    .replaceAll(">Agendar aula</a>", ">Conhecer perfis</a>")
    .replaceAll(">Solicitar aula</a>", ">Conhecer perfis</a>");
  html = html.replace(/\s*<script[^>]*src="\.\.\/js\/([^\"]+)"[^>]*><\/script>/g,
    (tag, nome) => scriptsPublicos.includes(nome) ? tag : "");
  // A vitrine usa apenas recursos locais; não carrega SDKs, fontes ou rastreadores externos.
  html = html.replace(/^\s*<link[^>]*(?:https:\/\/|rel="manifest")[^>]*>\s*$/gm, "")
    .replace(/^\s*<meta property="og:(?:url|image(?:\:[^\"]+)?)"[^>]*>\s*$/gm, "")
    .replace(/<i class="fa-solid [^\"]+" aria-hidden="true"><\/i>/g, "")
    .replace('content="Power Fitness: planos, horários, equipe, cadastro e aula experimental."',
      'content="Apresentação acadêmica Power Fitness: visual do site, calculadoras e três perfis ilustrativos."')
    .replace("<title>Power Fitness</title>", "<title>Power Fitness | Apresentação</title>")
    .replace("Funcionamento configurado pela academia", "Horários ilustrativos da apresentação")
    .replace("</head>", '  <link rel="stylesheet" href="../css/apresentacao.css">\n</head>');

  const perfis = [
    ["aluno", "Aluno", "Perfil, agendamentos e solicitações de privacidade."],
    ["professor", "Professor", "Atividades atribuídas, alunos agendados e registro de presença."],
    ["admin", "Administrador", "Gestão de funcionamento, planos, equipe, acessos e privacidade."]
  ];
  const secao = `<section id="perfis" class="container">
    <h2>Uma área para cada perfil</h2>
    <p class="subtitulo">Capturas do sistema com dados fictícios. Clique em uma imagem para ampliar.</p>
    <div class="perfis-apresentacao">${perfis.map(([id, nome, descricao]) => `<article class="perfil-apresentacao">
      <a href="../assets/apresentacao/painel-${id}.jpg" target="_blank" rel="noopener" aria-label="Ampliar captura ilustrativa do painel de ${nome.toLowerCase()}">
        <img src="../assets/apresentacao/painel-${id}.jpg" alt="Captura ilustrativa do painel de ${nome.toLowerCase()}, com dados fictícios" width="1440" height="1000" loading="lazy">
      </a><h3>${nome}</h3><p>${descricao}</p><small>Captura ilustrativa — sem acesso interativo nesta página.</small>
    </article>`).join("\n")}</div>
  </section>
  <section id="projeto" class="secao-clara"><div class="container projeto-apresentacao">
    <h2>Sobre o projeto</h2>
    <p>Power Fitness é um projeto acadêmico de site e gestão de academia. Esta apresentação mostra o visual, planos, equipe, horários e calculadoras, com conteúdo ilustrativo.</p>
    <p>Os painéis completos de aluno, professor e administrador fazem parte do código e podem ser demonstrados nos emuladores locais do Firebase com dados fictícios. A operação com clientes reais depende da publicação e validação do sistema completo.</p>
    <p>Os cálculos são feitos neste navegador. Esta página não recebe cadastros, solicitações de aula ou mensagens.</p>
  </div></section>`;
  html = substituir(html, /<\/main>/, `${secao}\n  </main>`, "conteúdo principal");
  html = substituir(html, /<footer>[\s\S]*?<\/footer>/, `<footer><div class="footer-container container">
    <div><h2>POWER FITNESS</h2><p>Sua evolução começa aqui.</p></div>
    <div><h3>Apresentação acadêmica</h3><p>Conteúdo e valores ilustrativos.</p><p><a href="#perfis">Conheça os três perfis</a></p></div>
    <div><h3>Sobre o projeto</h3><p><a href="#projeto">Recursos da apresentação</a></p><p><a href="../html/privacidade.html">Privacidade desta apresentação</a></p></div>
    </div><p class="copyright">© 2026 Power Fitness — Projeto acadêmico.</p></footer>`, "rodapé");
  if (/firebase(?:-services|-config|js)|gstatic|login\.html|formularios\.html|type="(?:email|password|tel)"|id="(?:agendamentoForm|formContato)"/i.test(html)) {
    throw new Error("A apresentação contém dependência ou formulário de conta. Publicação interrompida.");
  }

  await rm(destino, { recursive: true, force: true });
  for (const pasta of ["html", "js", "css", "assets"]) await mkdir(join(destino, pasta), { recursive: true });
  const estilos = [...html.matchAll(/href="\.\.\/css\/([^\"]+)"/g)].map(item => item[1]);
  for (const nome of estilos) await cp(join(raiz, "css", nome), join(destino, "css", nome));
  for (const nome of scriptsPublicos) await cp(join(raiz, "js", nome), join(destino, "js", nome));
  for (const pasta of ["images", "apresentacao"]) await cp(join(raiz, "assets", pasta), join(destino, "assets", pasta), { recursive: true });
  await cp(join(raiz, "assets/favicon.svg"), join(destino, "assets/favicon.svg"));
  await writeFile(join(destino, "html/index.html"), html);
  await writeFile(join(destino, "index.html"), '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=html/"><title>Power Fitness</title></head><body><a href="html/">Abrir apresentação Power Fitness</a></body></html>');
  await writeFile(join(destino, "html/privacidade.html"), `<!doctype html><html lang="pt-BR"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacidade da apresentação | Power Fitness</title>
    <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../css/style.css"><link rel="stylesheet" href="../css/apresentacao.css">
    </head><body><main class="container projeto-apresentacao"><h1>Privacidade desta apresentação</h1>
    <p>Esta versão pública é uma vitrine acadêmica. Não disponibiliza cadastro, login, agendamento ou envio de mensagens e não carrega o Firebase Authentication, Firestore, App Check ou ferramentas de análise.</p>
    <p>Peso, altura e valores informados nas calculadoras são processados somente no navegador. Esses campos não são enviados a um banco de dados. Ao abrir um plano, seu nome ilustrativo é guardado na sessão do navegador para o modal; não contém dados pessoais.</p>
    <p>As capturas dos painéis usam identidades e dados fictícios. Elas são imagens, e seus controles não executam ações.</p>
    <p>O provedor de hospedagem pode tratar registros técnicos de acesso para entregar as páginas e proteger o serviço. Para informações do provedor, consulte a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Política de Privacidade do Google</a>.</p>
    <p>Esta página descreve somente a apresentação. Antes de operar com clientes reais, o responsável pela academia deverá revisar a política do sistema completo e seus procedimentos de proteção de dados.</p>
    <p><a href="index.html">Voltar à apresentação</a></p></main></body></html>`);
  return destino;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const destino = await gerarApresentacao();
  console.log(`Apresentação gerada em ${destino}. Somente arquivos estáticos; nenhum dado do Firebase foi alterado.`);
}
