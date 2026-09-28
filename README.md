# Power Fitness

Aplicação web para uma academia, desenvolvida com HTML, CSS, JavaScript e Firebase.

## Funcionalidades

### Público

- apresentação de serviços, planos, equipe e horários;
- calculadora de IMC e mensalidade;
- formulário de contato persistido no Firestore;
- conteúdo de planos, professores e horários administrável.

### Aluno

- cadastro com confirmação de senha e consentimento;
- autenticação por e-mail e senha;
- verificação de e-mail e recuperação de senha;
- atualização de nome e telefone;
- solicitação de aula experimental com data e horário;
- bloqueio de solicitação ativa duplicada com identificador estável no Firestore;
- validação de data futura e do funcionamento configurado pela academia;
- consulta e cancelamento dos próprios agendamentos.
- exportação dos próprios dados e solicitação de exclusão.

### Administração

- acesso apenas com e-mail verificado e UID autorizado;
- indicadores de alunos, agendamentos, contatos e solicitações LGPD;
- busca de alunos;
- confirmação, cancelamento, capacidade por atividade e lista de espera;
- acompanhamento de mensagens;
- funcionamento semanal configurável, incluindo dias fechados, 24 horas e horários personalizados;
- cadastro, edição, ativação e desativação de planos, professores e atividades;
- histórico das ações administrativas.

## Tecnologias

- HTML5, CSS3 e JavaScript com módulos;
- Firebase Authentication, Cloud Firestore, App Check e Hosting;
- reCAPTCHA Enterprise;
- Node.js Test Runner;
- GitHub Actions.

## Executar localmente

O endereço publicado é **https://powerfitness-2a4a4.web.app/**. A raiz redireciona para a página principal.

Use um servidor local porque o projeto utiliza módulos JavaScript. No VS Code, abra a raiz pelo Live Server.

```bash
npm test
npm run check
```

## Configurar o Firebase

O projeto esperado é `powerfitness-2a4a4`.

1. Ative Authentication por e-mail e senha.
2. Crie o Cloud Firestore.
3. Registre o app web no App Check com reCAPTCHA Enterprise.
4. Cadastre o token de depuração usado em desenvolvimento local.
5. Configure os domínios autorizados.
6. Publique Hosting e regras:

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

7. Teste o domínio publicado, inclusive o acesso pela raiz `/`.
8. Verifique as métricas do App Check e só então aplique a proteção ao Firestore e Authentication.

A configuração web e a chave pública do App Check podem permanecer no cliente. Senhas, chaves privadas e tokens de depuração nunca devem ser publicados.

## Criar o primeiro administrador

O painel não permite que um usuário transforme a própria conta em administrador.

1. Cadastre e verifique a conta normalmente.
2. Copie o UID em **Firebase Console → Authentication → Usuários**.
3. No Firestore, crie a coleção `admins`.
4. Crie um documento cujo ID seja exatamente o UID.
5. Adicione o campo `ativo` do tipo booleano com valor `true`.
6. Entre novamente e acesse `html/admin.html`.

Não existe senha administrativa separada. O administrador usa o e-mail e a senha da conta correspondente ao UID autorizado.

## Estrutura principal

- `html/index.html`: página pública;
- `html/login.html`: autenticação;
- `html/formularios.html`: cadastro;
- `html/painel.html`: área do aluno;
- `html/admin.html`: administração;
- `js/firebase-services.js`: Firebase e App Check;
- `js/operacao.mjs`: funcionamento, capacidade e regras de disponibilidade;
- `js/validacoes.mjs`: regras reutilizáveis e testáveis;
- `firestore.rules`: regras de acesso;
- `tests/`: testes automatizados;
- `.github/workflows/ci.yml`: validação contínua;
- `DOCUMENTACAO.md`: documentação funcional e operacional.

## Limitações comerciais

- não há pagamento, matrícula financeira, controle de presença ou prescrição de treino;
- o sistema atende uma única academia por projeto Firebase;
- os dados e contatos exibidos devem ser personalizados antes da venda;
- a política de privacidade deve identificar o controlador real e ser revisada para o cliente;
- a solicitação do aluno não reserva uma vaga; a capacidade é aplicada na confirmação administrativa;
- o atendimento da solicitação de exclusão continua sendo responsabilidade da academia;
- configure backup, alertas e suporte antes de armazenar dados reais.

## Melhorias da versão 2.3.0 — em revisão

- funcionamento semanal configurável por dia, inclusive 24 horas;
- atividades associadas a dias da semana e capacidade máxima;
- ocupação exibida ao administrador e lista de espera quando a turma lota;
- promoção da primeira pessoa da fila após liberação de vaga;
- download dos dados pessoais e fluxo de solicitação de exclusão;
- histórico das últimas ações administrativas;
- regras do Firestore ampliadas para os novos fluxos;
- 18 testes automatizados de lógica e estrutura.

## Base herdada da versão 2.2.0

- agendamento idempotente para evitar duplicidades por cliques rápidos ou abas diferentes;
- retorno automático ao formulário após o login iniciado pelo agendamento;
- preenchimento do nome e do e-mail autenticado no formulário;
- datas e status legíveis na área do aluno e no painel administrativo;
- regras que validam proprietário, e-mail da conta, timestamps e conteúdo público ativo;
- navegação por teclado melhorada no menu e no modal;
- remoção de telefone, e-mail e estatísticas fictícias da página pública;
- redirecionamento do domínio raiz para o site.

## Segurança

Consulte [SECURITY.md](SECURITY.md). Não envie senhas, chaves privadas, tokens de depuração ou dados pessoais ao repositório.

## Documentação

Consulte [DOCUMENTACAO.md](DOCUMENTACAO.md) para instalação, perfis, banco de dados, testes e entrega.

## Pendências para uso comercial

A política de privacidade ainda precisa receber a identificação legal e o canal do controlador real. Planos, preços, equipe, horários, imagens e regras comerciais devem ser confirmados pela academia contratante.

## Observação de saúde

O cálculo de IMC é apenas informativo e não substitui avaliação de um profissional de saúde.
