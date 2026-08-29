const assert = require("node:assert/strict");
const test = require("node:test");
const {
  attachSessionUser,
  normalizeRole,
  requireRoles,
} = require("../src/security/authorization");

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
}

test("normalizeRole maps supported aliases and defaults safely", () => {
  assert.equal(normalizeRole("administrator"), "admin");
  assert.equal(normalizeRole("SELLER"), "seller");
  assert.equal(normalizeRole("buyer"), "member");
  assert.equal(normalizeRole("110"), "member");
  assert.equal(normalizeRole("unknown"), "member");
});

test("attachSessionUser accepts valid signed session objects", () => {
  const request = { signedCookies: { session: { memberId: 9, role: "member" } } };
  let called = false;
  attachSessionUser(request, {}, () => {
    called = true;
  });
  assert.equal(called, true);
  assert.deepEqual(request.user, { memberId: 9, role: "member" });
});

test("attachSessionUser rejects missing or malformed sessions", () => {
  const request = { signedCookies: { session: { memberId: "9", role: "member" } } };
  attachSessionUser(request, {}, () => {});
  assert.equal(request.user, null);
});

test("requireRoles returns 401 without authentication", () => {
  const response = createResponse();
  requireRoles("admin")({ user: null }, response, () => assert.fail("must not continue"));
  assert.equal(response.statusCode, 401);
});

test("requireRoles returns 403 for the wrong role", () => {
  const response = createResponse();
  requireRoles("admin")(
    { user: { role: "member" } },
    response,
    () => assert.fail("must not continue")
  );
  assert.equal(response.statusCode, 403);
});

test("requireRoles continues for an allowed role", () => {
  let called = false;
  requireRoles("seller", "admin")(
    { user: { role: "seller" } },
    createResponse(),
    () => {
      called = true;
    }
  );
  assert.equal(called, true);
});
