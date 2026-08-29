const { NotFoundError, ValidationError } = require("../errors");

const REQUIRED_REGISTRATION_FIELDS = [
  "name",
  "email",
  "password",
  "phone",
  "address",
  "sex",
];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function presentCatalog(products) {
  return {
    img: products.map((product) => ({
      Product_id: product.product_id,
      Image_path: product.image_path
        ? `./img/${product.image_path}`
        : "./img/product-placeholder.svg",
    })),
    recomend_product: products.map((product) => ({
      Product_id: product.product_id,
      Name: product.name,
      Price: product.price,
      Description: product.description || "",
      Username: product.username,
    })),
  };
}

function createShopService(repository) {
  return {
    async getCatalog(filters = {}) {
      const search = normalizeText(filters.search);
      const category = normalizeText(filters.category);
      const products = await repository.listProducts({ search, category });
      return presentCatalog(products);
    },

    async getProduct(productId) {
      const normalizedId = Number.parseInt(productId, 10);
      if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
        throw new ValidationError("A positive product id is required.");
      }

      const product = await repository.findProductById(normalizedId);
      if (!product) {
        throw new NotFoundError("Product not found.");
      }

      return {
        img: [
          {
            Image_path: product.image_path
              ? `./img/${product.image_path}`
              : "./img/product-placeholder.svg",
          },
        ],
        product: [
          {
            Product_id: product.product_id,
            Name: product.name,
            Price: product.price,
            Description: product.description || "",
            Username: product.username,
          },
        ],
      };
    },

    async getMembers() {
      const members = await repository.listMembers();
      return members.map((member) => ({
        Member_id: member.member_id,
        Username: member.username,
        Email: member.email,
        Phone_number: member.phone_number,
        Register_date: member.register_date,
        Sex: member.sex ? "男" : "女",
      }));
    },

    async authenticate(credentials = {}) {
      const username = normalizeText(credentials.username);
      const password = normalizeText(credentials.password);
      if (!username || !password) {
        return null;
      }

      const member = await repository.findMemberByUsername(username);
      return member && member.password === password ? member : null;
    },

    async register(input = {}) {
      const member = Object.fromEntries(
        REQUIRED_REGISTRATION_FIELDS.map((field) => [field, normalizeText(input[field])])
      );
      const missing = REQUIRED_REGISTRATION_FIELDS.filter((field) => !member[field]);
      if (missing.length) {
        throw new ValidationError("Registration fields are required.", { missing });
      }
      if (!member.email.includes("@")) {
        throw new ValidationError("A valid email address is required.");
      }
      return repository.createMember(member);
    },

    async createCoupon(input = {}) {
      const coupon = {
        minimumPrice: Number(input.minimum_cost),
        startDate: normalizeText(input.start_date),
        endDate: normalizeText(input.end_date),
        description: normalizeText(input.description),
        couponType: normalizeText(input.coupon_type),
        discount: Number(input.discount),
        adminId: 1,
      };

      if (!Number.isFinite(coupon.minimumPrice) || coupon.minimumPrice < 0) {
        throw new ValidationError("Minimum price must be zero or greater.");
      }
      if (!Number.isFinite(coupon.discount) || coupon.discount <= 0) {
        throw new ValidationError("Discount must be greater than zero.");
      }
      if (!coupon.startDate || !coupon.endDate || coupon.startDate > coupon.endDate) {
        throw new ValidationError("Coupon dates are invalid.");
      }
      return repository.createCoupon(coupon);
    },
  };
}

module.exports = {
  REQUIRED_REGISTRATION_FIELDS,
  createShopService,
  normalizeText,
  presentCatalog,
};
