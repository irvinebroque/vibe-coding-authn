import { defineConfig } from "cf/config";
import version from "../../src/bundles/version.json" with { type: "json" };
import * as outbound from "../../src/outbound.ts" with { type: "cf-worker" };
import * as gate from "../../src/apps/gate.ts" with { type: "cf-worker" };
import * as manifest from "../../src/apps/manifest.ts" with { type: "cf-worker" };
import * as rpc from "../../src/apps/rpc.ts" with { type: "cf-worker" };
import * as registered from "../../src/apps/registered.ts" with { type: "cf-worker" };
import * as publicApp from "../../src/apps/public.ts" with { type: "cf-worker" };
import * as privateApp from "../../src/apps/private.ts" with { type: "cf-worker" };
import * as egress from "../../src/apps/egress.ts" with { type: "cf-worker" };

const apps = {
  gate,
  manifest,
  rpc,
  registered,
  public: publicApp,
  private: privateApp,
  egress,
  outbound,
};

export default defineConfig(({ mode }) => {
  if (!mode || !Object.hasOwn(apps, mode))
    throw new Error("Select an app with --mode");
  return {
    worker: {
      name:
        mode === "outbound"
          ? "vibe-authn-outbound"
          : `vibe-authn-${mode}-${version}`,
      compatibilityDate: "2026-10-29",
      entrypoint: apps[mode as keyof typeof apps],
      workersDev: false,
    },
  };
});
