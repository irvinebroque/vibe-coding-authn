import policy from "../app-policy.json";
export { default as version } from "./bundles/version.json";

// Validated at publication, bundled with the gateway, never read from app code.
export const release = policy;

export const patterns = [
  "gate",
  "manifest",
  "rpc",
  "registered",
  "split",
  "egress",
] as const;
export type Pattern = (typeof patterns)[number];
export type App = Exclude<Pattern, "split"> | "public" | "private";
