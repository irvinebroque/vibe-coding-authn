import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validatePolicy } from "../scripts/policy.mjs";

const policy = JSON.parse(await readFile("app-policy.json", "utf8"));
test("publication rejects ambiguous routes and privilege escalation", () => {
  validatePolicy(policy);
  for (const change of [
    (p) => (p.tenant = "other"),
    (p) => p.routes.push(p.routes[0]),
    (p) => (p.routes[0].path = "/*"),
    (p) => (p.routes[1].access = "public"),
    (p) => (p.routes[2].access = "member"),
  ]) {
    const changed = structuredClone(policy);
    change(changed);
    assert.throws(() => validatePolicy(changed));
  }
});
