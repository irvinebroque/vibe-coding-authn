import { importJWK, jwtVerify, type JWK } from "jose";
import { issuer, audience, type Identity } from "./shared";

export async function authenticate(
  request: Request,
  publicKey: JWK,
): Promise<Identity | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  if (!authorization.startsWith("Bearer "))
    throw new Error("Invalid authorization");

  const key = await importJWK(publicKey, "ES256");
  const { payload } = await jwtVerify(authorization.slice(7), key, {
    algorithms: ["ES256"],
    issuer,
    audience,
    requiredClaims: ["sub", "exp", "tenant", "permissions"],
  });
  if (
    typeof payload.sub !== "string" ||
    typeof payload.tenant !== "string" ||
    !Array.isArray(payload.permissions) ||
    !payload.permissions.every((p) => typeof p === "string")
  ) {
    throw new Error("Invalid identity");
  }
  return {
    userId: payload.sub,
    tenant: payload.tenant,
    permissions: payload.permissions,
  };
}
