import { WorkerEntrypoint } from "cloudflare:workers";
import type { AppProps } from "../shared";
import { json } from "./respond";

export default class App extends WorkerEntrypoint<{}, AppProps> {
  async fetch(request: Request) {
    const path = new URL(request.url).pathname;
    if (path === "/") return json({ message: "Public app shell" });
    const id = path.split("/").at(-1)!;
    // No checkAuth() call. The platform authorizes the read itself.
    const result = await this.ctx.props.reports!.read(id);
    return json(result, result.status);
  }
}
