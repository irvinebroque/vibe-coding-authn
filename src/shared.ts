export type Identity = {
  userId: string;
  tenant: string;
  permissions: string[];
};
export type Scope = { identity: Identity | null; tenant: string };
export type ReportResult =
  | { status: 200; report: { owner: string; text: string } }
  | { status: 401 | 403 | 404; error: string };
export type AppProps = {
  identity?: Identity | null;
  handler?: string;
  reports?: { read(id: string): Promise<ReportResult> };
};

export const issuer = "https://issuer.example.test";
export const audience = "vibe-coding-authn";
