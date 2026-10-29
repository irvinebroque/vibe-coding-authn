import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { validatePolicy } from "./policy.mjs";

const policy = JSON.parse(await readFile("app-policy.json", "utf8"));
validatePolicy(policy);
const names = [
  "gate",
  "manifest",
  "rpc",
  "registered",
  "public",
  "private",
  "egress",
];

await build({
  entryPoints: names.map((name) => `src/apps/${name}.ts`),
  outdir: "src/bundles",
  bundle: true,
  format: "esm",
  platform: "neutral",
  external: ["cloudflare:workers"],
  target: "es2024",
  minify: false,
});
const hash = createHash("sha256").update(JSON.stringify(policy));
for (const name of names) hash.update(await readFile(`src/bundles/${name}.js`));
await writeFile(
  "src/bundles/version.json",
  JSON.stringify(hash.digest("hex").slice(0, 16)),
);
