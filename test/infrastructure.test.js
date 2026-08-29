const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const readProjectFile = (filePath) =>
  readFileSync(path.join(projectRoot, filePath), "utf8");

test("the initial migration defines every table used by the repository", () => {
  const migration = readProjectFile("database/migrations/001_initial_schema.sql");

  for (const table of ["member", "product", "product_image", "coupon"]) {
    assert.match(migration, new RegExp(`CREATE TABLE ${table} \\(`));
  }
  assert.match(migration, /password TEXT NOT NULL/);
  assert.match(migration, /category TEXT\[\] NOT NULL/);
});

test("database constraints protect relationships, amounts, and coupon dates", () => {
  const migration = readProjectFile("database/migrations/001_initial_schema.sql");

  assert.match(migration, /REFERENCES member\(member_id\) ON DELETE RESTRICT/);
  assert.match(migration, /REFERENCES product\(product_id\) ON DELETE CASCADE/);
  assert.match(migration, /CHECK \(price >= 0\)/);
  assert.match(migration, /CHECK \(remain_amount >= 0\)/);
  assert.match(migration, /CHECK \(end_date >= start_date\)/);
});

test("demo accounts use application-compatible scrypt hashes", () => {
  const seed = readProjectFile("database/seed/001_demo_data.sql");
  const hashes = seed.match(/scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}/g) || [];

  assert.equal(hashes.length, 3);
  assert.match(seed, /'admin'/);
  assert.match(seed, /'seller'/);
  assert.match(seed, /'member'/);
});

test("the deterministic catalog seed contains six distributable products", () => {
  const seed = readProjectFile("database/seed/001_demo_data.sql");
  const productValues = seed.match(
    /INSERT INTO product[\s\S]+?VALUES\n([\s\S]+?);\n\nINSERT INTO product_image/
  );

  assert.ok(productValues);
  assert.equal((productValues[1].match(/^  \(/gm) || []).length, 6);
  assert.match(seed, /'product-placeholder\.svg'/);
});

test("Compose waits for PostgreSQL before starting the application", () => {
  const compose = readProjectFile("compose.yaml");

  assert.match(compose, /pg_isready/);
  assert.match(compose, /condition: service_healthy/);
  assert.match(compose, /001_initial_schema\.sql/);
  assert.match(compose, /001_demo_data\.sql/);
});

test("the application image installs a locked production dependency set and runs unprivileged", () => {
  const dockerfile = readProjectFile("Dockerfile");

  assert.match(dockerfile, /npm ci --omit=dev/);
  assert.match(dockerfile, /USER node/);
  assert.match(dockerfile, /HEALTHCHECK/);
});
