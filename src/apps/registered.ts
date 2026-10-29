import { WorkerEntrypoint } from "cloudflare:workers";
import type { AppProps } from "../shared";
import { json } from "./respond";

export default class App extends WorkerEntrypoint<{}, AppProps> {
  fetch() {
    // The trusted router selects the handler from the same entry as its policy.
    switch (this.ctx.props.handler) {
      case "home":
        return json({ message: "Public registered handler" });
      case "profile":
        return json({ user: this.ctx.props.identity?.userId });
      case "admin":
        return json({ message: "Admin registered handler" });
      default:
        return json({ error: "Unknown handler" }, 404);
    }
  }
}
