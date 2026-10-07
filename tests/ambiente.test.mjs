import test from "node:test";
import assert from "node:assert/strict";
import { usarEmuladores } from "../js/ambiente-local.mjs";
import { ambienteDemo } from "../functions/ambiente.mjs";

test("teste local exige HTTP, loopback e porta reservada ou opt-in explícito", () => {
  const local = { protocol: "http:", hostname: "127.0.0.1", port: "5000" };
  assert.equal(usarEmuladores(local), true);
  assert.equal(usarEmuladores({ ...local, hostname: "localhost" }), true);
  assert.equal(usarEmuladores({ ...local, port: "5500", search: "?emuladores=1" }), true);
  for (const alteracao of [{ protocol: "https:" }, { hostname: "powerfitness-2a4a4.web.app" }, { hostname: "192.168.1.10" }, { port: "5500" }]) assert.equal(usarEmuladores({ ...local, search: "", ...alteracao }), false);
  assert.equal(usarEmuladores(null), false);
});

test("App Check só é dispensado no projeto fictício com os dois emuladores locais", () => {
  const demo = { FUNCTIONS_EMULATOR: "true", GCLOUD_PROJECT: "demo-power-fitness", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" };
  assert.equal(ambienteDemo(demo), true);
  for (const campo of Object.keys(demo)) assert.equal(ambienteDemo({ ...demo, [campo]: "" }), false);
  assert.equal(ambienteDemo({ ...demo, GCLOUD_PROJECT: "powerfitness-2a4a4" }), false);
  assert.equal(ambienteDemo({}), false);
});