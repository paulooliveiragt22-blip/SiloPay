import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { openSecret, sealSecret } from "./cipher";

test("a cifra abre o mesmo segredo e não guarda o texto puro", () => {
  const key = randomBytes(32);
  const sealed = sealSecret("chave-de-api", key);
  assert.equal(sealed.includes(Buffer.from("chave-de-api")), false);
  assert.equal(openSecret(sealed, key), "chave-de-api");
});
