import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const cf = resolve("node_modules/.bin/cf");
function run(args, cwd = process.cwd()) {
  execFileSync(cf, args, { cwd, stdio: "inherit" });
}
execFileSync(process.execPath, ["scripts/setup.mjs"], { stdio: "inherit" });
execFileSync(process.execPath, ["scripts/bundle.mjs"], { stdio: "inherit" });
const namespaces = JSON.parse(
  execFileSync(cf, ["workers-for-platforms", "dispatch-namespaces", "list"], {
    encoding: "utf8",
  }),
);
if (!namespaces.some((n) => n.namespace_name === "vibe-coding-authn")) {
  run([
    "workers-for-platforms",
    "dispatch-namespaces",
    "create",
    "--name",
    "vibe-coding-authn",
  ]);
}
run(["deploy", "--mode", "outbound"], "deploy/apps");
for (const app of [
  "gate",
  "manifest",
  "rpc",
  "registered",
  "public",
  "private",
  "egress",
]) {
  run(
    ["deploy", "--mode", app, "--dispatch-namespace", "vibe-coding-authn"],
    "deploy/apps",
  );
}
// Switch traffic last. This gateway references exactly the uploaded code + policy hash.
run(["deploy"]);
