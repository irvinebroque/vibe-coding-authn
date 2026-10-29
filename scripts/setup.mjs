import { mkdir, access, writeFile } from "node:fs/promises";
import { generateKeyPair, exportJWK } from "jose";

await mkdir(".local", { recursive: true });
try {
  await access(".local/private-jwk.json");
} catch {
  const { privateKey, publicKey } = await generateKeyPair("ES256", {
    extractable: true,
  });
  await writeFile(
    ".local/private-jwk.json",
    JSON.stringify(await exportJWK(privateKey)),
    { mode: 0o600 },
  );
  await writeFile(
    ".local/public-jwk.json",
    JSON.stringify(await exportJWK(publicKey)),
  );
}
console.log(
  "Demo signing key ready in ignored .local/. Only its public key is deployed.",
);
