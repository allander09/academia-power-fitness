export const PROJETO_DEMO = "demo-power-fitness";

export function usarEmuladores(localizacao = globalThis.location) {
  return localizacao?.protocol === "http:"
    && ["localhost", "127.0.0.1"].includes(localizacao.hostname)
    && localizacao.port === "5000";
}

export const emuladoresLocais = usarEmuladores();
