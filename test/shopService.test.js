const assert = require("node:assert/strict");
const test = require("node:test");
const { NotFoundError, ValidationError } = require("../src/errors");
const { createShopService, presentCatalog } = require("../src/services/shopService");

function createRepository(overrides = {}) {
  return {
    listProducts: async () => [],
    findProductById: async () => null,
    listMembers: async () => [],
    findMemberByUsername: async () => null,
    createMember: async (member) => member,
    updateMemberPassword: async () => {},
    createCoupon: async (coupon) => coupon,
    ...overrides,
  };
}

test("presentCatalog maps product, image, price, and seller fields", () => {
  const result = presentCatalog([
    {
      product_id: 10,
      name: "Keyboard",
      price: 99,
      description: "Mechanical",
      username: "seller-a",
      image_path: "keyboard.jpg",
    },
  ]);

  assert.deepEqual(result.img, [
    { Product_id: 10, Image_path: "./img/keyboard.jpg" },
  ]);
  assert.equal(result.recomend_product[0].Username, "seller-a");
});

test("catalog filters are trimmed before reaching the repository", async () => {
  let received;
  const service = createShopService(
    createRepository({
      listProducts: async (filters) => {
        received = filters;
        return [];
      },
    })
  );

  await service.getCatalog({ search: " phone ", category: " 2 " });
  assert.deepEqual(received, { search: "phone", category: "2" });
});

test("getProduct rejects invalid identifiers", async () => {
  const service = createShopService(createRepository());
  await assert.rejects(() => service.getProduct("0"), ValidationError);
});

test("getProduct reports missing products", async () => {
  const service = createShopService(createRepository());
  await assert.rejects(() => service.getProduct("7"), NotFoundError);
});

test("getProduct uses the distributable placeholder when no image exists", async () => {
  const service = createShopService(
    createRepository({
      findProductById: async () => ({
        product_id: 7,
        name: "Desk",
        price: 120,
        description: "Standing desk",
        username: "seller-b",
        image_path: null,
      }),
    })
  );

  const result = await service.getProduct("7");
  assert.equal(result.img[0].Image_path, "./img/product-placeholder.svg");
});

test("member presentation converts boolean sex values for the existing view", async () => {
  const service = createShopService(
    createRepository({
      listMembers: async () => [
        { member_id: 1, username: "a", email: "a@x.test", sex: true },
        { member_id: 2, username: "b", email: "b@x.test", sex: false },
      ],
    })
  );

  const members = await service.getMembers();
  assert.deepEqual(members.map((member) => member.Sex), ["男", "女"]);
});

test("authentication returns the matching member", async () => {
  const member = {
    member_id: 7,
    username: "ada",
    password: "correct",
    member_type: "seller",
  };
  let upgradedPassword;
  const service = createShopService(
    createRepository({
      findMemberByUsername: async () => member,
      updateMemberPassword: async (_memberId, password) => {
        upgradedPassword = password;
      },
    })
  );

  assert.deepEqual(await service.authenticate({ username: "ada", password: "correct" }), {
    memberId: 7,
    username: "ada",
    role: "seller",
  });
  assert.match(upgradedPassword, /^scrypt\$/);
  assert.equal(await service.authenticate({ username: "ada", password: "wrong" }), null);
});

test("registration reports all missing fields", async () => {
  const service = createShopService(createRepository());
  await assert.rejects(
    () => service.register({ name: "Ada" }),
    (error) => error instanceof ValidationError && error.details.missing.length === 5
  );
});

test("registration validates email and normalizes six fields", async () => {
  let created;
  const service = createShopService(
    createRepository({
      createMember: async (member) => {
        created = member;
        return member;
      },
    })
  );

  await assert.rejects(
    () =>
      service.register({
        name: "Ada",
        email: "invalid",
        password: "password",
        phone: "555",
        address: "LA",
        sex: "false",
      }),
    ValidationError
  );

  await service.register({
    name: " Ada ",
    email: " ada@example.com ",
    password: " password ",
    phone: " 555 ",
    address: " LA ",
    sex: " false ",
  });
  assert.equal(Object.keys(created).length, 6);
  assert.equal(created.name, "Ada");
  assert.match(created.password, /^scrypt\$/);
});

test("coupon validation rejects invalid amounts and date ranges", async () => {
  const service = createShopService(createRepository());
  const base = {
    minimum_cost: "100",
    start_date: "2026-02-01",
    end_date: "2026-02-28",
    description: "Offer",
    coupon_type: "fixed",
    discount: "10",
  };

  await assert.rejects(() => service.createCoupon({ ...base, minimum_cost: "-1" }), ValidationError);
  await assert.rejects(() => service.createCoupon({ ...base, discount: "0" }), ValidationError);
  await assert.rejects(
    () => service.createCoupon({ ...base, start_date: "2026-03-01" }),
    ValidationError
  );
});

test("valid coupons map all persisted fields", async () => {
  const service = createShopService(createRepository());
  const result = await service.createCoupon({
    minimum_cost: "100",
    start_date: "2026-02-01",
    end_date: "2026-02-28",
    description: "Offer",
    coupon_type: "fixed",
    discount: "10",
  });

  assert.equal(result.minimumPrice, 100);
  assert.equal(result.discount, 10);
  assert.equal(result.adminId, 1);
});
