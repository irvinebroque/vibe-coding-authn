import { json } from "./respond";

export default {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    // /blocked demonstrates that the app cannot reach arbitrary hosts.
    const target =
      path === "/blocked"
        ? "https://example.com"
        : `https://reports.internal${path}`;
    const response = await fetch(target, {
      headers: { "x-user-id": "alice", "x-tenant": "acme" },
    });
    return json(await response.json(), response.status);
  },
};
