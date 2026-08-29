const assert = require("node:assert/strict");
const test = require("node:test");
const { createShopRepository } = require("../src/repositories/shopRepository");

function createPool(rows = []) {
  const calls = [];
  return {
    calls,
    async query(text, values = []) {
      calls.push({ text, values });
      return { rows };
    },
  };
}

test("catalog retrieval uses one joined query instead of per-product queries", async () => {
  const pool = createPool([{ product_id: 1 }]);
  const repository = createShopRepository(pool);

  const rows = await repository.listProducts();

  assert.equal(pool.calls.length, 1);
  assert.match(pool.calls[0].text, /JOIN member/);
  assert.match(pool.calls[0].text, /LEFT JOIN product_image/);
  assert.deepEqual(rows, [{ product_id: 1 }]);
});

test("catalog search remains parameterized", async () => {
  const pool = createPool();
  const repository = createShopRepository(pool);

  await repository.listProducts({ search: "phone" });

  assert.match(pool.calls[0].text, /ILIKE \$1/);
  assert.deepEqual(pool.calls[0].values, ["%phone%"]);
});

test("catalog category filtering remains parameterized", async () => {
  const pool = createPool();
  const repository = createShopRepository(pool);

  await repository.listProducts({ category: "3" });

  assert.match(pool.calls[0].text, /p\.category = \$1/);
  assert.deepEqual(pool.calls[0].values, ["{3}"]);
});

test("registration maps six submitted values into the member insert", async () => {
  const pool = createPool([{ member_id: 42 }]);
  const repository = createShopRepository(pool);

  const created = await repository.createMember({
    name: "Ada",
    email: "ada@example.com",
    password: "password",
    phone: "555-0100",
    sex: "false",
    address: "Los Angeles",
  });

  assert.equal(pool.calls[0].values.length, 6);
  assert.match(pool.calls[0].text, /CURRENT_DATE/);
  assert.match(pool.calls[0].text, /'110'/);
  assert.deepEqual(created, { member_id: 42 });
});

test("coupon creation sends seven values through placeholders", async () => {
  const pool = createPool([{ coupon_id: 7 }]);
  const repository = createShopRepository(pool);

  await repository.createCoupon({
    minimumPrice: 100,
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    description: "January offer",
    couponType: "fixed",
    discount: 10,
    adminId: 1,
  });

  assert.equal(pool.calls[0].values.length, 7);
  assert.match(pool.calls[0].text, /\$7/);
});

test("legacy password upgrades remain parameterized", async () => {
  const pool = createPool();
  const repository = createShopRepository(pool);

  await repository.updateMemberPassword(7, "scrypt$hash");

  assert.match(pool.calls[0].text, /SET password = \$1/);
  assert.deepEqual(pool.calls[0].values, ["scrypt$hash", 7]);
});
