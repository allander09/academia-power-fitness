export const PROJETO_DEMO = "demo-power-fitness";
const HOSTS_LOCAIS = ["localhost", "127.0.0.1"];

export function usarEmuladores(localizacao = globalThis.location) {
  if (localizacao?.protocol !== "http:" || !HOSTS_LOCAIS.includes(localizacao.hostname)) return false;
  if (localizacao.port === "5000") return true;
  try {
    const parametros = new URLSearchParams(localizacao.search || "");
    return parametros.get("emuladores") === "1" || globalThis.localStorage?.getItem("powerFitnessUsarEmuladores") === "true";
  } catch {
    return false;
  }
}

export const emuladoresLocais = usarEmuladores();
export const hostLocal = globalThis.location?.protocol === "http:" && HOSTS_LOCAIS.includes(globalThis.location.hostname);

export function tokenDebugAppCheck() {
  if (!hostLocal || emuladoresLocais) return "";
  try {
    return globalThis.localStorage?.getItem("powerFitnessAppCheckDebugToken")
      || globalThis.sessionStorage?.getItem("powerFitnessAppCheckDebugToken")
      || true;
  } catch {
    return true;
  }
}