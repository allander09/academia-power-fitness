# Segurança

## Relatar uma vulnerabilidade

Não publique credenciais, tokens, senhas ou dados pessoais em issues. Em uso comercial, configure um canal privado do responsável pela academia.

## Controles implementados

- autenticação por e-mail e senha;
- verificação de e-mail para agendamentos e administração;
- recuperação de senha sem confirmar se o endereço está cadastrado;
- regras de acesso por proprietário;
- papel administrativo por documento protegido em `admins/{uid}`;
- papel de professor por documento protegido em `professores_acesso/{uid}`;
- leitura do professor limitada aos horários e agendamentos associados ao próprio UID;
- App Check com reCAPTCHA Enterprise e renovação automática de token;
- provedor de depuração restrito a `localhost` e `127.0.0.1`;
- validação de campos, e-mail da conta e timestamps no cliente e no Firestore;
- identificador determinístico de agendamento para reduzir duplicidades;
- leitura pública limitada a conteúdo ativo;
- renderização administrativa sem inserir conteúdo do usuário como HTML;
- cabeçalhos de segurança no Firebase Hosting;
- integração contínua com verificação de sintaxe e testes automatizados.

## Antes de produção

1. cadastre e proteja o token de depuração usado no computador de desenvolvimento;
2. publique o site e as regras com `firebase deploy`;
3. teste cadastro, verificação, login, recuperação e os painéis de aluno, professor e administrador no domínio publicado;
4. confira as métricas do App Check e só então aplique a proteção ao Firestore e Authentication;
5. use senha exclusiva e forte na conta administradora;
6. cadastre somente administradores confiáveis;
7. configure limites, alertas de uso e orçamento;
8. confirme planos, preços, equipe, horários e imagens com a academia real;
9. revise a política de privacidade com orientação jurídica;
10. não armazene dados médicos ou documentos pessoais neste projeto.

## Dados e recuperação

Defina uma rotina de cópia de segurança antes do uso comercial. A exportação gerenciada do Firestore exige faturamento habilitado; avalie custos e mantenha um procedimento documentado de restauração.
