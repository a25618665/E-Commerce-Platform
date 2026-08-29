const assert = require("node:assert/strict");
const test = require("node:test");
const { loadConfig, parsePort } = require("../src/config");

test("parsePort accepts positive integer ports", () => {
  assert.equal(parsePort("8080", 3000), 8080);
});

test("parsePort falls back for invalid ports", () => {
  assert.equal(parsePort("invalid", 3000), 3000);
  assert.equal(parsePort("-1", 3000), 3000);
});

test("loadConfig reads server and database settings from the environment", () => {
  const config = loadConfig({
    PORT: "4000",
    NODE_ENV: "test",
    DB_HOST: "database",
    DB_PORT: "5433",
    DB_NAME: "shop_test",
    DB_USER: "shop",
    DB_PASSWORD: "local-only",
    SESSION_SECRET: "test-session-secret",
  });

  assert.deepEqual(config, {
    port: 4000,
    nodeEnv: "test",
    session: {
      secret: "test-session-secret",
      secure: false,
    },
    database: {
      host: "database",
      port: 5433,
      database: "shop_test",
      user: "shop",
      password: "local-only",
    },
  });
});

test("loadConfig requires an explicit production session secret", () => {
  assert.throws(() => loadConfig({ NODE_ENV: "production" }), /SESSION_SECRET/);
});
