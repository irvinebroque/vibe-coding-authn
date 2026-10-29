import assert from "node:assert/strict";

export function validatePolicy(policy) {
  // This deployment belongs to acme. A customer cannot select another tenant.
  assert.equal(
    policy.tenant,
    "acme",
    "Tenant must match the platform-owned app record",
  );
  assert(
    Array.isArray(policy.routes) && policy.routes.length > 0,
    "Declare routes",
  );
  const seen = new Set();
  for (const route of policy.routes) {
    assert.equal(route.method, "GET", "This example accepts GET routes only");
    assert(
      /^\/(?:[a-z]+)?$/.test(route.path),
      "Use exact paths, without wildcards or encodings",
    );
    assert(
      ["public", "member", "reports:admin"].includes(route.access),
      "Unknown access policy",
    );
    assert(
      ["home", "profile", "admin"].includes(route.handler),
      "Unknown handler",
    );
    // Platform policy: only the home handler may be published anonymously.
    if (route.access === "public")
      assert(
        route.path === "/" && route.handler === "home",
        "Public exposure denied",
      );
    if (route.handler === "admin" || route.path === "/admin")
      assert.equal(
        route.access,
        "reports:admin",
        "Admin policy cannot be weakened",
      );
    const key = `${route.method} ${route.path}`;
    assert(!seen.has(key), "Duplicate route");
    seen.add(key);
  }
}
