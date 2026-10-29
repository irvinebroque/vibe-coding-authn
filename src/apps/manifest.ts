import { WorkerEntrypoint } from "cloudflare:workers";
import type { AppProps } from "../shared";
import { json } from "./respond";

export default class App extends WorkerEntrypoint<{}, AppProps> {
  fetch(request: Request) {
    const path = new URL(request.url).pathname;
    if (path === "/") return json({ message: "Public home" });
    if (path === "/profile")
      return json({ user: this.ctx.props.identity?.userId });
    if (path === "/admin") return json({ message: "Admin page" });
    // Simulates a newly generated route omitted from the published manifest.
    return json({ message: "Undeclared app route must never be reachable" });
  }
}
