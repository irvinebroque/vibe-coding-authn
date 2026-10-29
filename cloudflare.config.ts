import { bindings, defineConfig, exports } from "cf/config";
import * as gateway from "./src/gateway.ts" with { type: "cf-worker" };
import publicKey from "./.local/public-jwk.json" with { type: "json" };

const compatibilityDate = "2026-10-29";

export default defineConfig({
  worker: {
    name: "vibe-coding-authn",
    compatibilityDate,
    entrypoint: gateway,
    compatibilityFlags: ["nodejs_compat"],
    observability: { enabled: true },
    exports: { Reports: exports.worker(), HttpGateway: exports.worker() },
    env: {
      PUBLIC_KEY: bindings.json(publicKey),
      LOADER: bindings.workerLoader(),
      DISPATCHER: bindings.dispatchNamespace({
        namespace: "vibe-coding-authn",
        outbound: { worker: "vibe-authn-outbound", parameters: ["SCOPE"] },
      }),
    },
  },
});
