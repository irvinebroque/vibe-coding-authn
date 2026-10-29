import { env } from "cloudflare:workers";
import { version, type App } from "./release";
import type { AppProps, Scope } from "./shared";
import gate from "./bundles/gate.js?raw";
import manifest from "./bundles/manifest.js?raw";
import rpc from "./bundles/rpc.js?raw";
import registered from "./bundles/registered.js?raw";
import publicApp from "./bundles/public.js?raw";
import privateApp from "./bundles/private.js?raw";
import egress from "./bundles/egress.js?raw";

const modules = {
  gate,
  manifest,
  rpc,
  registered,
  public: publicApp,
  private: privateApp,
  egress,
};

export function invokeDynamic(
  app: App,
  request: Request,
  props: AppProps,
  outbound: Fetcher | null,
) {
  // Fresh isolate: no identity, capability, or previously read data survives into another request.
  const worker = env.LOADER.load({
    compatibilityDate: "2026-10-29",
    mainModule: "app.js",
    modules: { "app.js": modules[app] },
    globalOutbound: outbound,
  });
  return worker.getEntrypoint(undefined, { props }).fetch(request);
}

export function invokePlatforms(
  app: App,
  request: Request,
  props: AppProps,
  scope: Scope | null,
) {
  return env.DISPATCHER.get(
    `vibe-authn-${app}-${version}`,
    { props },
    {
      // Only the egress example gets authority at the outbound gateway.
      outbound: { SCOPE: scope },
    },
  ).fetch(request);
}
