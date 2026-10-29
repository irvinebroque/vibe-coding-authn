import { WorkerEntrypoint } from "cloudflare:workers";
import type { AppProps } from "../shared";
import { json } from "./respond";

export default class App extends WorkerEntrypoint<{}, AppProps> {
  fetch() {
    return json({
      message: "Only app members reach this code",
      user: this.ctx.props.identity?.userId,
    });
  }
}
