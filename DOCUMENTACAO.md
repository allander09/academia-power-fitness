# Documentação — Power Fitness

## 1. Objetivo

O Power Fitness é um site institucional com cadastro de alunos, solicitação de aula experimental e painel administrativo para uma única academia.

## 2. Tecnologias

- HTML5 e CSS3;
- JavaScript com módulos;
- Firebase Authentication;
- Cloud Firestore;
- Firebase App Check com reCAPTCHA Enterprise;
- Firebase Hosting;
- GitHub Actions e testes com Node.js.

## 3. Perfis de acesso

### Visitante

Visualiza serviços, planos, professores e horários. Também pode calcular o IMC, simular mensalidade e enviar uma mensagem.

### Aluno

Cria uma conta, verifica o e-mail, atualiza nome e telefone, solicita aula experimental e acompanha ou cancela os próprios agendamentos. Também pode baixar uma cópia dos dados e solicitar exclusão. Quando o login é iniciado pelo formulário de agendamento, o sistema retorna ao mesmo ponto após autenticar.

### Administrador

Usa a mesma tela de login. O acesso é liberado quando existe `admins/{UID}` no Firestore. Pode consultar alunos, contatos e agendamentos, configurar o funcionamento semanal, controlar capacidade e lista de espera, tratar solicitações de privacidade e administrar planos, professores e atividades.

## 4. Coleções do Firestore

| Coleção | Finalidade |
|---|---|
| `usuarios` | Perfil do aluno |
| `admins` | Permissão administrativa pelo UID |
| `agendamentos` | Solicitações de aula experimental; o ID usa `UID_data_hora` para impedir duplicidade |
| `contatos` | Mensagens enviadas pelo site |
| `planos` | Planos exibidos publicamente |
| `professores` | Equipe exibida publicamente |
| `horarios` | Horários e atividades |
| `configuracoes/funcionamento` | Funcionamento de cada dia e capacidade padrão |
| `auditoria` | Histórico imutável das ações administrativas |
| `solicitacoes_privacidade` | Pedidos de exclusão enviados pelos alunos |

## 5. Segurança

- Cada aluno lê e altera apenas o próprio perfil e os próprios agendamentos.
- Somente administradores consultam todos os alunos, contatos e agendamentos.
- Agendamentos e administração exigem e-mail verificado.
- O e-mail salvo no agendamento deve ser o mesmo da conta autenticada.
- Timestamps de criação e atualização são validados pelas regras do Firestore.
- Visitantes leem somente planos, professores e horários marcados como ativos.
- Visitantes leem a configuração pública de funcionamento.
- Ninguém consegue criar administradores pelo site.
- Somente administradores leem e criam registros de auditoria; esses registros não podem ser alterados pelo site.
- O App Check reduz solicitações feitas fora do site legítimo.
- Senhas permanecem no Firebase Authentication e nunca são salvas no Firestore.

## 6. Executar no VS Code

1. Clone o repositório.
2. Abra a pasta `academia-power-fitness` no VS Code.
3. Use o Live Server para abrir `html/index.html`.
4. Para atualizar uma cópia existente, execute `git pull origin main`.

## 7. Testes

No terminal:

```bash
npm test
npm run check
```

Antes de entregar, testar:

- cadastro e verificação de e-mail;
- login e recuperação de senha;
- atualização do perfil;
- criação e cancelamento de agendamento;
- bloqueio de solicitação duplicada, inclusive em cliques rápidos;
- rejeição de data passada, dia fechado e horário fora do funcionamento configurado;
- capacidade, lista de espera e promoção após cancelamento;
- acesso administrativo e negação para aluno comum;
- edição e desativação de conteúdo;
- exportação de dados e solicitação de exclusão;
- registro das ações administrativas;
- envio e tratamento de contatos;
- visualização em celular e computador.

## 8. Publicação

Com o Firebase CLI instalado e a conta autorizada:

```bash
firebase login
firebase deploy
```

O comando publica o Hosting e as regras do Firestore configuradas no projeto `powerfitness-2a4a4`.

Endereço principal: **https://powerfitness-2a4a4.web.app/**. O Firebase Hosting redireciona a raiz para `/html/`.

## 9. Configuração do primeiro administrador

1. Cadastre a conta pelo site.
2. Verifique o e-mail.
3. Copie o UID em **Firebase Console → Authentication → Usuários**.
4. Crie `admins/{UID}` no Firestore com `ativo: true`.
5. Saia e entre novamente.

Não existe senha administrativa separada. A conta usa o e-mail e a senha cadastrados no Firebase Authentication.

## 10. Personalização antes da venda

Para cada academia, substituir:

- nome, logotipo, cores e domínio;
- telefone, e-mail e endereço;
- planos, preços, professores e horários;
- fotos da estrutura e retratos da equipe;
- identificação do controlador e canal de privacidade;
- regras comerciais de cancelamento e capacidade das aulas.

## 11. Imagens do site

As imagens em `assets/images/` são demonstrações geradas para apresentar o layout de forma realista. Antes da entrega a um cliente:

1. obtenha autorização escrita das pessoas fotografadas;
2. substitua os retratos fictícios pelas fotos da equipe real;
3. substitua as imagens de ambiente por fotos da academia real;
4. mantenha os arquivos em WebP, com dimensões semelhantes e sem inserir textos dentro da imagem;
5. atualize o texto alternativo (`alt`) para descrever a foto nova.

No painel administrativo, o cadastro de professor aceita uma URL de foto opcional. Use HTTPS ou um caminho local do próprio projeto. Se a imagem não carregar, o site exibe as iniciais do professor.

## 12. Fluxo do agendamento

1. O visitante escolhe plano, data e horário.
2. Se não estiver autenticado, o retorno ao formulário fica salvo na sessão.
3. O e-mail verificado da conta é usado no registro.
4. Datas passadas, dias fechados e horários fora do funcionamento configurado são rejeitados.
5. O documento recebe o ID `UID_data_hora`, impedindo uma segunda solicitação ativa igual.
6. Solicitações canceladas ou recusadas podem ser reenviadas pelo mesmo aluno.
7. O administrador confirma ou cancela a solicitação.
8. Se a capacidade estiver completa, a solicitação vai para a lista de espera.
9. Quando uma vaga confirmada é cancelada, a primeira pessoa da fila volta para análise.

## 13. Alterações da versão 2.3.0 — candidata para revisão

- funcionamento semanal configurável: fechado, 24 horas ou personalizado;
- atividades por dia da semana e capacidade máxima;
- ocupação, lista de espera e promoção da fila;
- download dos dados do aluno e solicitação de exclusão;
- painel de solicitações LGPD;
- histórico de ações administrativas;
- novos testes de lógica, IDs, referências locais e contratos entre HTML e JavaScript.

## 14. Base herdada da versão 2.2.0

- reforço das regras do Firestore;
- agendamento idempotente e validação de horário;
- retorno ao formulário depois do login;
- datas e status em português;
- feedback de erro ao cancelar ou atualizar perfil;
- modal com retenção de foco e restauração do elemento anterior;
- link para pular ao conteúdo;
- remoção de estatísticas e contatos fictícios;
- acesso pela URL principal do Hosting.

## 15. Limites do MVP

O projeto não inclui pagamento online, controle financeiro, catraca, frequência, prescrição de treino, envio automático de e-mail/WhatsApp ou suporte a várias academias no mesmo banco. A solicitação não reserva a vaga antes da confirmação do administrador, e a exclusão efetiva dos dados e da conta continua sendo uma operação administrativa. Esses módulos e automações devem ser contratados e desenvolvidos separadamente.
