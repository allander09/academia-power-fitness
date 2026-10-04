import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

for (const pasta of ["js", "functions", "scripts"]) {
  for (const nome of readdirSync(pasta).filter(nome => /\.(js|mjs)$/.test(nome))) {
    const resultado = spawnSync(process.execPath, ["--check", join(pasta, nome)], { stdio: "inherit" });
    if (resultado.status !== 0) process.exit(resultado.status || 1);
  }
}
console.log("Sintaxe validada para o site, servidor e scripts.");
