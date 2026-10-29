import { readFile } from "node:fs/promises";
import { importJWK, SignJWT } from "jose";

export async function token(userId = "alice", overrides = {}, options = {}) {
  const key = await importJWK(
    JSON.parse(await readFile(".local/private-jwk.json", "utf8")),
    "ES256",
  );
  return new SignJWT({
    tenant: "acme",
    permissions: ["reports:read"],
    ...overrides,
  })
    .setProtectedHeader({ alg: "ES256" })
    .setSubject(userId)
    .setIssuer(options.issuer ?? "https://issuer.example.test")
    .setAudience(options.audience ?? "vibe-coding-authn")
    .setIssuedAt()
    .setExpirationTime(options.expires ?? "10m")
    .sign(key);
}
if (import.meta.url === `file://${process.argv[1]}`)
  console.log(await token(process.argv[2]));
