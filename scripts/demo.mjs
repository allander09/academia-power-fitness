import { CONTAS_DEMO, criarDadosDemo, SENHA_DEMO } from "./dados-demo.mjs";

try {
  const { data } = await criarDadosDemo();
  console.log("\nPower Fitness — teste local pronto\nhttp://127.0.0.1:5000/html/\n");
  console.table(CONTAS_DEMO.map(({ email, nome, verificado }) => ({ email, nome, verificado })));
  console.log(`Senha fictícia de todas as contas: ${SENHA_DEMO}`);
  console.log(`Aulas de exemplo em ${data}: uma confirmada e uma pendente, com capacidade 1.`);
  console.log("Os links de recuperação/verificação de e-mail aparecem neste terminal. Nenhum e-mail real é enviado.");
  console.log("Mantenha este terminal aberto. Ctrl+C encerra os emuladores; ao reiniciar, os dados de teste voltam ao estado inicial.");
  const manterAberto = setInterval(() => {}, 60000);
  for (const sinal of ["SIGINT", "SIGTERM"]) process.once(sinal, () => { clearInterval(manterAberto); process.exit(0); });
} catch (error) { console.error(error.message); process.exitCode = 1; }
