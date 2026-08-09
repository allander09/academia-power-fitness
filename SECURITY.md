# Segurança

## Relatar uma vulnerabilidade

Não publique credenciais, tokens, senhas ou dados pessoais em issues. Em um projeto real, configure um canal privado do responsável pela academia.

## Controles implementados

- autenticação por e-mail e senha;
- verificação de e-mail;
- regras de acesso por proprietário;
- papel administrativo por documento protegido em `admins/{uid}`;
- validação de campos no cliente e no Firestore;
- renderização administrativa sem inserir conteúdo do usuário como HTML.

## Antes de produção

1. publique e teste `firestore.rules`;
2. habilite Firebase App Check com reCAPTCHA Enterprise;
3. cadastre somente administradores confiáveis;
4. configure limites, alertas de uso e orçamento;
5. substitua os contatos fictícios;
6. revise a política de privacidade com orientação jurídica;
7. não armazene dados médicos ou documentos pessoais neste projeto.
