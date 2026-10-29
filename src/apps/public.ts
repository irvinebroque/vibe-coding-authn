import { WorkerEntrypoint } from "cloudflare:workers";
import type { AppProps } from "../shared";
import { json } from "./respond";

export default class App extends WorkerEntrypoint<{}, AppProps> {
  fetch() {
    return json({
      message: "Public component",
      hasReportsCapability: !!this.ctx.props.reports,
    });
  }
}
