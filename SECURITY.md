# Segurança do Power Fitness 2.5

## Controles

- Permissões de aluno, professor e administrador verificadas no servidor e/ou Firestore Rules.
- Verificação de e-mail para operações críticas e conferência de conta ativa no Authentication.
- Funções chamáveis exigem App Check em produção e tokens autenticados. A dispensa de App Check exige simultaneamente o emulador de Functions, o projeto fictício `demo-power-fitness` e os dois emuladores em loopback nas portas previstas. Autenticação, papéis e regras continuam ativos no teste local.
- Nenhuma escrita direta de agendamento, presença, turma ou atividade pelo navegador.
- A escolha de professor no agendamento é validada nas Cloud Functions contra `horarios` e `professores_acesso`; o valor enviado pelo navegador não é confiável.
- Confirmação transacional de capacidade e agendamentos duplicados bloqueados.
- Professor recebe campos mínimos e identificador aleatório, sem UID/e-mail do aluno.
- Cadastro não permite elevação de privilégio; `admins` só pode ser alterado no Console/SDK administrativo.
- Exclusão bloqueia sessões e não permite recriar perfil com token antigo.
- Renderização de dados com textContent e validação de URLs de foto.
- Política versionada, ciência persistida e rotas privadas sem indexação.
- HTTPS e cabeçalhos contra interpretação de conteúdo e enquadramento; cache de scripts revalidado.
- Demonstração limitada à porta 5000 em loopback, com configuração de projeto fictício e sem credenciais de produção.
- Código do servidor, testes, documentos e dependências excluídos do Hosting.

## Implantação e operação

Use contas individuais, verificação de e-mail, senha forte e segundo fator na conta Google/Firebase do responsável. Não compartilhe senha nem mantenha conta do desenvolvedor como única proprietária. Revogue acessos ao encerrar o vínculo de um colaborador.

Registre os domínios de produção no Authentication e App Check/reCAPTCHA, confira métricas e habilite a proteção do Firestore. As funções já exigem App Check; token de depuração deve existir apenas em desenvolvimento. A configuração web contém identificadores públicos do Firebase, não uma chave privada administrativa. Restrições de API, permissões IAM e orçamento devem ser revisados na conta real.

Functions utiliza Blaze, com limites de instâncias configurados; isso não garante custo zero nem substitui acompanhamento de orçamento. O teste local não verifica IAM, App Check real, região do banco, e-mails transacionais, DNS, quota ou restauração de produção.

Faça backup antes de migração, restaure uma cópia em ambiente separado e registre o resultado. Dados excluídos no banco ativo não devem ser reintroduzidos por restauração de backup. No descarte, trate também exportações, cópias locais e logs conforme a política do responsável.

A exclusão é uma operação administrativa intencional, confirmada na interface. Se o pedido possuir obrigação de conservação, a equipe deve resolver isso antes da execução integral. Não há um módulo de arquivos legais ou prontuários neste sistema. Para perfil público de profissional e fotos, a equipe remove/anônimiza o conteúdo publicado separadamente.

## Incidentes e relatos

Configure o canal de privacidade/segurança da academia. Relatos devem trazer horário, tela e passos de reprodução sem incluir senhas, tokens, dados pessoais ou chave de serviço em GitHub público. A equipe identifica o incidente, preserva evidências necessárias com acesso restrito, contém a exposição, avalia comunicação aplicável, corrige e registra a conclusão. Esta rotina operacional precisa de um responsável definido no cliente.

Os testes cobrem cenários especificados, não uma certificação de segurança ou conformidade LGPD. A documentação legal e os procedimentos da academia devem ser revisados para a implantação real.
