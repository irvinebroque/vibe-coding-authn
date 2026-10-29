import { WorkerEntrypoint } from "cloudflare:workers";
import type { AppProps } from "../shared";
import { json } from "./respond";

export default class App extends WorkerEntrypoint<{}, AppProps> {
  async fetch(request: Request) {
    const id = new URL(request.url).pathname.split("/").at(-1)!;
    const result = await this.ctx.props.reports!.read(id);
    return json(result, result.status);
  }
}
