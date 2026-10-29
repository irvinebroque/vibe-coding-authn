import { test } from "node:test";
import assert from "node:assert/strict";
import { token } from "../scripts/token.mjs";

const base = process.env.BASE_URL ?? "http://localhost:8787";
const runtimes = (process.env.RUNTIMES ?? "dynamic").split(",");
const alice = await token("alice");
const bob = await token("bob");
const outsider = await token("alice", { tenant: "other" });
const noPermission = await token("alice", { permissions: [] });
const admin = await token("alice", { permissions: ["reports:admin"] });

for (const runtime of runtimes) {
  async function call(
    path,
    status,
    credential,
    { ran, method = "GET", ...headers } = {},
  ) {
    const response = await fetch(`${base}/${runtime}/${path}`, {
      method,
      headers: {
        ...(credential ? { authorization: `Bearer ${credential}` } : {}),
        ...headers,
      },
    });
    const text = await response.text();
    assert.equal(response.status, status, `${runtime}/${path}: ${text}`);
    if (ran !== undefined)
      assert.equal(response.headers.get("x-app-ran") === "true", ran);
    if (status !== 200) assert(!text.includes("private report"), text);
    return text ? JSON.parse(text) : null;
  }

  test(`${runtime}: authenticate before app execution`, async () => {
    await call("gate/anything", 401, null, { ran: false });
    await call("gate/anything", 403, outsider, { ran: false });
    const result = await call("gate/anything", 200, alice, {
      ran: true,
      "x-user-id": "bob",
    });
    assert.equal(result.user, "alice");
    for (const credential of [
      "invalid",
      `${alice.slice(0, -8)}XXXXXXXX`,
      await token("alice", {}, { issuer: "https://attacker.invalid" }),
      await token("alice", {}, { audience: "another-app" }),
      await token("alice", {}, { expires: "-1m" }),
    ])
      await call("gate/anything", 401, credential, { ran: false });
  });

  for (const pattern of ["manifest", "registered"]) {
    test(`${runtime}: ${pattern} denies undeclared routes and enforces permissions`, async () => {
      await call(`${pattern}/`, 200, null, { ran: true });
      await call(`${pattern}/profile`, 401, null, { ran: false });
      await call(`${pattern}/profile`, 403, outsider, { ran: false });
      await call(`${pattern}/profile`, 200, alice, { ran: true });
      await call(`${pattern}/admin`, 403, alice, { ran: false });
      await call(`${pattern}/admin`, 200, admin, { ran: true });
      for (const path of ["new-route", "profile/", "%70rofile"]) {
        await call(`${pattern}/${path}`, 404, alice, { ran: false });
      }
      await call(`${pattern}/`, 404, alice, { method: "POST", ran: false });
    });
  }

  test(`${runtime}: RPC checks the record even when the app skips authentication`, async () => {
    await call("rpc/", 200, null, { ran: true });
    await call("rpc/reports/alice", 401, null, {
      ran: true,
      "x-user-id": "alice",
    });
    await call("rpc/reports/alice", 403, outsider, { ran: true });
    await call("rpc/reports/alice", 403, noPermission, { ran: true });
    await call("rpc/reports/alice", 404, bob, { ran: true });
    await call("rpc/reports/eve", 404, alice, { ran: true });
    const result = await call("rpc/reports/alice", 200, alice, { ran: true });
    assert.equal(result.report.owner, "alice");
  });

  test(`${runtime}: separate public and private components receive different capabilities`, async () => {
    const result = await call("split/", 200, alice, { ran: true });
    assert.equal(result.hasReportsCapability, false);
    await call("split/reports/alice", 401, null, { ran: false });
    await call("split/reports/alice", 403, outsider, { ran: false });
    await call("split/reports/alice", 200, alice, { ran: true });
    await call("split/reports/bob", 404, alice, { ran: true });
  });

  test(`${runtime}: outbound gateway rejects forged identity and arbitrary destinations`, async () => {
    await call("egress/reports/alice", 401, null, { ran: true });
    await call("egress/reports/alice", 404, bob, { ran: true });
    await call("egress/reports/alice", 403, outsider, { ran: true });
    await call("egress/reports/alice", 200, alice, { ran: true });
    await call("egress/blocked", 403, alice, { ran: true });
  });

  test(`${runtime}: interleaved identities never reuse another request's authority`, async () => {
    await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const owner = i % 2 === 0 ? "alice" : "bob";
        return call(
          `rpc/reports/${owner}`,
          200,
          owner === "alice" ? alice : bob,
        ).then((result) => assert.equal(result.report.owner, owner));
      }),
    );
  });
}
