const assert = require("node:assert/strict");
const test = require("node:test");
const { ROUTE_CONTRACT } = require("../src/routeContract");

test("route contract preserves 20 unique HTTP method/path combinations", () => {
  const routes = ROUTE_CONTRACT.map(([method, path]) => `${method} ${path}`);
  assert.equal(routes.length, 20);
  assert.equal(new Set(routes).size, 20);
});

test("route contract covers storefront, admin, member, and seller workflows", () => {
  const paths = ROUTE_CONTRACT.map(([, path]) => path);
  assert(paths.includes("/"));
  assert(paths.includes("/product"));
  assert(paths.some((path) => path.startsWith("/admin")));
  assert(paths.some((path) => path.startsWith("/member")));
  assert(paths.some((path) => path.startsWith("/seller")));
});
