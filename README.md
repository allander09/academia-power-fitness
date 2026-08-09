# Power Fitness

Sistema web educacional para uma academia, desenvolvido com HTML, CSS, JavaScript e Firebase.

## Funcionalidades

### Público

- apresentação de serviços, planos, equipe e horários;
- calculadora de IMC;
- cálculo de mensalidade;
- formulário de contato persistido no Firestore;
- conteúdo de planos, professores e horários administrável.

### Aluno

- cadastro com confirmação de senha e consentimento;
- autenticação por e-mail e senha;
- verificação de e-mail;
- recuperação de senha;
- atualização de nome e telefone;
- agendamento de aula experimental;
- consulta e cancelamento dos próprios agendamentos.

### Administração

- indicadores de alunos, agendamentos e contatos;
- confirmação e cancelamento de agendamentos;
- acompanhamento de mensagens;
- listagem de alunos;
- cadastro de planos, professores e horários.

## Tecnologias

- HTML5, CSS3 e JavaScript com módulos;
- Firebase Authentication;
- Cloud Firestore;
- Firebase Hosting;
- Node.js Test Runner;
- GitHub Actions.

## Executar localmente

Use um servidor local porque o projeto utiliza módulos JavaScript. No VS Code, abra a raiz pelo Live Server.

Para testar os cálculos:

```bash
npm test
npm run check
```

## Configurar o Firebase

O projeto esperado é `powerfitness-2a4a4`.

1. Ative Authentication por e-mail e senha.
2. Crie o Cloud Firestore.
3. Revise e publique `firestore.rules`.
4. Em Authentication, configure os domínios autorizados.
5. Antes de produção, habilite Firebase App Check.
6. Para hospedar via Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

A configuração web em `js/firebase-config.js` identifica o aplicativo; a proteção dos dados depende das regras do Firestore e do App Check.

## Criar o primeiro administrador

O painel não permite que um usuário transforme a própria conta em administrador.

1. Cadastre a conta normalmente.
2. Copie o UID em **Firebase Console → Authentication → Users**.
3. No Firestore, crie a coleção `admins`.
4. Crie um documento cujo ID seja exatamente o UID.
5. Adicione, por exemplo, os campos `nome` e `criadoEm`.
6. Entre novamente e acesse `html/admin.html`.

Esse documento só deve ser criado manualmente por alguém com acesso administrativo ao Firebase.

## Estrutura principal

- `html/index.html`: página pública;
- `html/login.html`: autenticação;
- `html/formularios.html`: cadastro;
- `html/painel.html`: área do aluno;
- `html/admin.html`: administração;
- `js/firebase-services.js`: serviços compartilhados;
- `firestore.rules`: regras de acesso;
- `tests/`: testes automatizados;
- `.github/workflows/ci.yml`: validação contínua.

## Limitações

- não há cobrança ou matrícula financeira;
- mensagens e agendamentos dependem da publicação das regras;
- os dados comerciais exibidos ainda são fictícios;
- a política de privacidade é um modelo educacional e deve ser revisada antes de uso real;
- o formulário público de contato deve ser protegido com App Check antes de divulgação ampla.

## Segurança

Consulte [SECURITY.md](SECURITY.md). Não envie senhas, chaves privadas ou dados sensíveis ao repositório.

## Observação de saúde

O cálculo de IMC é apenas informativo e não substitui avaliação de um profissional de saúde.
