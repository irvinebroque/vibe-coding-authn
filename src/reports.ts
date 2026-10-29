import type { Scope, ReportResult } from "./shared";

// Synthetic data belongs to the platform, never to the app bundle.
const reports = {
  alice: { tenant: "acme", owner: "alice", text: "Alice's private report" },
  bob: { tenant: "acme", owner: "bob", text: "Bob's private report" },
  eve: { tenant: "other", owner: "eve", text: "Another tenant's report" },
};

export function readReport(scope: Scope, id: string): ReportResult {
  const { identity, tenant } = scope;
  if (!identity) return { status: 401, error: "Sign in" };
  if (
    identity.tenant !== tenant ||
    !identity.permissions.includes("reports:read")
  ) {
    return { status: 403, error: "Forbidden" };
  }
  const report = Object.hasOwn(reports, id)
    ? reports[id as keyof typeof reports]
    : undefined;
  if (!report || report.tenant !== tenant || report.owner !== identity.userId) {
    return { status: 404, error: "Report not found" };
  }
  return { status: 200, report: { owner: report.owner, text: report.text } };
}

export function httpGateway(request: Request, scope: Scope): Response {
  const url = new URL(request.url);
  // This virtual API is handled here. No arbitrary request reaches the Internet.
  if (
    url.origin !== "https://reports.internal" ||
    request.method !== "GET" ||
    !/^\/reports\/[a-z]+$/.test(url.pathname) ||
    url.search
  ) {
    return Response.json({ error: "Outbound request denied" }, { status: 403 });
  }
  // Ignore app-supplied identity headers. Scope was set by the platform.
  const result = readReport(scope, url.pathname.split("/")[2]);
  return Response.json(result, { status: result.status });
}
