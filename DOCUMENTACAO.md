# Documentação simples — Power Fitness

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

Cria uma conta, verifica o e-mail, atualiza nome e telefone, solicita aula experimental e acompanha ou cancela os próprios agendamentos.

### Administrador

Usa a mesma tela de login. O acesso é liberado quando existe `admins/{UID}` no Firestore. Pode consultar alunos, contatos e agendamentos, alterar status e administrar planos, professores e horários.

## 4. Coleções do Firestore

| Coleção | Finalidade |
|---|---|
| `usuarios` | Perfil do aluno |
| `admins` | Permissão administrativa pelo UID |
| `agendamentos` | Solicitações de aula experimental |
| `contatos` | Mensagens enviadas pelo site |
| `planos` | Planos exibidos publicamente |
| `professores` | Equipe exibida publicamente |
| `horarios` | Horários e atividades |

## 5. Segurança

- Cada aluno lê e altera apenas o próprio perfil e os próprios agendamentos.
- Somente administradores consultam todos os alunos, contatos e agendamentos.
- Agendamentos e administração exigem e-mail verificado.
- Ninguém consegue criar administradores pelo site.
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
- bloqueio de solicitação duplicada;
- acesso administrativo e negação para aluno comum;
- edição e desativação de conteúdo;
- envio e tratamento de contatos;
- visualização em celular e computador.

## 8. Publicação

Com o Firebase CLI instalado e a conta autorizada:

```bash
firebase login
firebase deploy
```

O comando publica o Hosting e as regras do Firestore configuradas no projeto `powerfitness-2a4a4`.

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
- identificação do controlador e canal de privacidade;
- regras comerciais de cancelamento e capacidade das aulas.

## 11. Limites do MVP

O projeto não inclui pagamento online, controle financeiro, catraca, frequência, prescrição de treino ou suporte a várias academias no mesmo banco. Esses módulos devem ser contratados e desenvolvidos separadamente.
