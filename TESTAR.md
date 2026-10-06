# Testar o Power Fitness no seu computador

Este modo abre o site completo com Authentication, Firestore e Functions locais. Não exige login no Firebase, plano Blaze nem uma conta real de administrador. Os dados são fictícios e temporários. Use Node.js 22 e Java 21; internet é necessária para instalar dependências e carregar os módulos/estilos externos do site.

## Abrir no VS Code

Se o projeto já estiver clonado, abra a pasta no VS Code e execute no terminal:

```bash
git fetch origin
git switch review/power-fitness-2.3
git pull --ff-only origin review/power-fitness-2.3
npm ci
npm ci --prefix functions
npm run demo
```

Na primeira cópia use **Ctrl+Shift+P → Git: Clone**, cole `https://github.com/allander09/academia-power-fitness.git` e abra a pasta clonada. Como o repositório é privado, entre na conta GitHub com acesso quando solicitado. `Repository not found` também pode significar que essa máquina não está autenticada na conta autorizada. Não use `git init` como correção desse erro.

`No commits yet` significa que a branch local está sem histórico; isso não confirma que o projeto foi clonado. Preserve essa pasta e abra uma cópia clonada em outro local. A revisão final está na branch `review/power-fitness-2.3`, apesar do nome antigo; ela contém a versão 2.5. A `main` ainda não recebeu a PR #10. Use a branch indicada acima para testar as melhorias.

Quando o terminal mostrar **teste local pronto**, abra **http://127.0.0.1:5000/html/**. Mantenha o terminal aberto. O endereço local só funciona no computador que iniciou os emuladores; não use esse endereço no QR da apresentação.

## Contas prontas

Senha de todas: **TesteLocal2026!**. Essa senha serve exclusivamente nos emuladores.

| E-mail fictício | Tela inicial |
|---|---|
| admin@example.com | Administração |
| professor@example.com | Área do professor |
| aluno@example.com | Área do aluno |
| aluno2@example.com | Área do aluno |
| novo@example.com | Área do aluno, sem e-mail verificado |

Saia de uma conta antes de entrar na próxima. Duas abas do mesmo navegador compartilham a sessão; para testar aluno e administrador ao mesmo tempo, use outro navegador ou uma janela anônima.

## Roteiro de teste

1. **Site:** calcule o IMC com peso `75,5` e altura `1,75`; o resultado deve ser `24,65`. No simulador, Essencial por dois meses deve dar `R$ 259,80`, sem extras. Confira menu no celular e quadro compacto no desktop.
2. **Aluno:** entre com `aluno@example.com`, altere nome/telefone, salve e recarregue. A reserva de Funcional estará pendente. Baixe os seus dados; o arquivo deve abrir como JSON.
3. **Administrador:** confirme essa reserva. Funcional tem capacidade 1 e o segundo aluno já tem uma reserva confirmada na mesma aula; a solicitação deve entrar na lista de espera.
4. **Professor:** confira as suas atividades e marque presença na aula confirmada. Confira que não aparecem e-mail ou telefone do aluno na lista de aulas.
5. **Fila:** entre com `aluno2@example.com` e cancele a reserva confirmada. A solicitação do primeiro aluno deve voltar para análise; o administrador poderá confirmá-la.
6. **Novo agendamento:** no site, entre como aluno e escolha uma data futura aberta e Musculação às 11h. Envie uma vez; repetir para a mesma data/hora deve ser recusado.
7. **Conteúdo:** no administrador, altere o valor de Essencial. Recarregue o site; card, simulador e seletor de interesse devem acompanhar o novo valor. Desative todos os planos para conferir a mensagem de indisponibilidade e o simulador desabilitado.
8. **Permissões:** abra `admin.html` e `professor.html` como aluno. O acesso deve ser negado/redirecionado. Conceda/revogue acesso de professor com o administrador e confira a mudança após sair e entrar.
9. **Privacidade:** como aluno, solicite exclusão. No administrador, use **Excluir conta e dados**, confirme com `EXCLUIR` e confira o protocolo. A conta fictícia excluída não deve voltar a entrar. Reiniciar os emuladores recria as contas iniciais.
10. **Cadastro e recuperação:** use uma conta fictícia nova. Links de verificação e recuperação aparecem no terminal dos emuladores, em vez de serem enviados por e-mail. Abra o link correspondente para completar o fluxo e entre novamente.
11. **Links antigos e falhas:** abra `imc.html`, `planos.html` e `agenda.html`; eles encaminham para a seção funcional do site. Desative a rede durante o agendamento: a operação deve informar a falha e permitir nova tentativa. A recuperação de uma conta inexistente usa a mesma mensagem genérica de uma conta existente.

O terminal informa a data das aulas iniciais: o próximo dia aberto. As reservas precisam estar no futuro para serem confirmadas. Para começar uma demonstração nova, encerre com **Ctrl+C** e execute `npm run demo` novamente.

## Se não abrir

- `java -version` deve indicar Java 21 e `node --version`, Node 22. Depois de instalar, feche e abra o VS Code para atualizar o PATH.
- Uma porta ocupada impede a inicialização. Encerre outra execução do projeto e tente novamente. As portas locais são 5000, 5001, 8080 e 9099; não altere apenas uma delas sem atualizar o código.
- Live Server e `file://` não são o modo completo de teste. Use a porta 5000 iniciada pelo comando acima.
- Os emuladores não validam IAM, faturamento, envio de e-mail real ou reCAPTCHA/App Check de produção. A aceitação final no domínio publicado continua em [REVISAO_2_5.md](REVISAO_2_5.md); publicação e configuração estão em [ENTREGA.md](ENTREGA.md).

Para registrar um problema, anote a conta usada, os passos, o resultado esperado, o que aconteceu e a mensagem exibida. Não compartilhe senha real ou dados de terceiros nas capturas.
