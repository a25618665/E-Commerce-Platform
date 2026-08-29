const assert = require("node:assert/strict");
const test = require("node:test");
const { hashPassword, safeStringEqual, verifyPassword } = require("../src/security/password");

test("password hashes are salted and do not expose plaintext", async () => {
  const first = await hashPassword("correct horse battery staple");
  const second = await hashPassword("correct horse battery staple");

  assert.match(first, /^scrypt\$/);
  assert.notEqual(first, second);
  assert(!first.includes("correct horse battery staple"));
});

test("verifyPassword accepts the right scrypt password and rejects the wrong one", async () => {
  const stored = await hashPassword("correct");
  assert.deepEqual(await verifyPassword("correct", stored), {
    valid: true,
    needsUpgrade: false,
  });
  assert.deepEqual(await verifyPassword("wrong", stored), {
    valid: false,
    needsUpgrade: false,
  });
});

test("legacy plaintext passwords are accepted once and marked for upgrade", async () => {
  assert.deepEqual(await verifyPassword("legacy", "legacy"), {
    valid: true,
    needsUpgrade: true,
  });
  assert.deepEqual(await verifyPassword("wrong", "legacy"), {
    valid: false,
    needsUpgrade: false,
  });
});

test("malformed password hashes fail closed", async () => {
  assert.deepEqual(await verifyPassword("password", "scrypt$invalid"), {
    valid: false,
    needsUpgrade: false,
  });
});

test("safeStringEqual handles equal and different lengths", () => {
  assert.equal(safeStringEqual("same", "same"), true);
  assert.equal(safeStringEqual("short", "longer"), false);
});
