import { env, WorkerEntrypoint } from "cloudflare:workers";
import { authenticate } from "./auth";
import { patterns, release, type App, type Pattern } from "./release";
import { httpGateway, readReport } from "./reports";
import { invokeDynamic, invokePlatforms } from "./runtime";
import type { AppProps, Scope } from "./shared";

export class Reports extends WorkerEntrypoint<Env, Scope> {
  read(id: string) {
    return readReport(this.ctx.props, id);
  }
}

export class HttpGateway extends WorkerEntrypoint<Env, Scope> {
  fetch(request: Request) {
    return httpGateway(request, this.ctx.props);
  }
}

export default {
  async fetch(request, _env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const [, runtime, patternName, ...parts] = url.pathname.split("/");
    if (
      !["dynamic", "platforms"].includes(runtime) ||
      !patterns.includes(patternName as Pattern)
    ) {
      return Response.json(
        { error: "Use /{dynamic|platforms}/{pattern}/{path}" },
        { status: 404 },
      );
    }
    const pattern = patternName as Pattern;
    const path = `/${parts.join("/")}`;
    let identity;
    try {
      identity = await authenticate(request, env.PUBLIC_KEY);
    } catch {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }
    const scope: Scope = { identity, tenant: release.tenant };
    const props: AppProps = {};
    let app: App = pattern === "split" ? "public" : pattern;
    let access = "public";

    if (pattern === "gate") access = "member";
    if (pattern === "manifest" || pattern === "registered") {
      const route = release.routes.find(
        (r) => r.method === request.method && r.path === path,
      );
      if (!route)
        return Response.json({ error: "Route not published" }, { status: 404 });
      access = route.access;
      if (pattern === "registered") props.handler = route.handler;
    }
    if (pattern === "split") {
      if (path === "/") app = "public";
      else if (/^\/reports\/[a-z]+$/.test(path)) {
        app = "private";
        access = "member";
      } else return new Response(null, { status: 404 });
    }
    if (request.method !== "GET") return new Response(null, { status: 405 });
    if (access !== "public") {
      if (!identity)
        return Response.json({ error: "Sign in" }, { status: 401 });
      if (
        identity.tenant !== release.tenant ||
        (access !== "member" && !identity.permissions.includes(access))
      ) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      props.identity = identity;
    }
    if (pattern === "rpc" || app === "private") {
      props.reports = ctx.exports.Reports({ props: scope });
    }
    // Session credentials and caller-provided identity headers stay outside app code.
    const appRequest = new Request(`https://app.internal${path}${url.search}`, {
      method: "GET",
    });
    const outbound =
      pattern === "egress" ? ctx.exports.HttpGateway({ props: scope }) : null;
    const response =
      runtime === "dynamic"
        ? await invokeDynamic(app, appRequest, props, outbound)
        : await invokePlatforms(
            app,
            appRequest,
            props,
            pattern === "egress" ? scope : null,
          );
    const result = new Response(response.body, response);
    result.headers.set("cache-control", "no-store");
    return result;
  },
} satisfies ExportedHandler<Env>;
