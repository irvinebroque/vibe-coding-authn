import { httpGateway } from "./reports";
import type { Scope } from "./shared";

export default {
  fetch(request: Request, env: { SCOPE: Scope | null }) {
    if (!env.SCOPE)
      return Response.json(
        { error: "Outbound request denied" },
        { status: 403 },
      );
    return httpGateway(request, env.SCOPE);
  },
};
