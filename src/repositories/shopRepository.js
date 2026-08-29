const PRODUCT_SELECT = `
  SELECT DISTINCT ON (p.product_id)
    p.product_id,
    p.name,
    p.price,
    p.description,
    m.username,
    pi.image_path
  FROM product AS p
  JOIN member AS m ON m.member_id = p.seller_id
  LEFT JOIN product_image AS pi ON pi.product_id = p.product_id`;

function createShopRepository(pool) {
  return {
    async listProducts({ search, category } = {}) {
      const values = [];
      const predicates = [];

      if (search) {
        values.push(`%${search}%`);
        predicates.push(`p.name ILIKE $${values.length}`);
      }

      if (category) {
        values.push(`{${category}}`);
        predicates.push(`p.category = $${values.length}`);
      }

      const where = predicates.length ? ` WHERE ${predicates.join(" AND ")}` : "";
      const query = `${PRODUCT_SELECT}${where} ORDER BY p.product_id, pi.image_path`;
      const result = await pool.query(query, values);
      return result.rows;
    },

    async findProductById(productId) {
      const result = await pool.query(
        `${PRODUCT_SELECT} WHERE p.product_id = $1 ORDER BY p.product_id, pi.image_path`,
        [productId]
      );
      return result.rows[0] || null;
    },

    async listMembers() {
      const result = await pool.query(`
        SELECT member_id, username, email, phone_number, register_date, sex
        FROM member
        ORDER BY member_id`);
      return result.rows;
    },

    async findMemberByUsername(username) {
      const result = await pool.query(
        `SELECT member_id, username, password, member_type
         FROM member
         WHERE username = $1
         LIMIT 1`,
        [username]
      );
      return result.rows[0] || null;
    },

    async createMember(member) {
      const result = await pool.query(
        `INSERT INTO member
          (username, email, password, phone_number, register_date, member_type, sex, address)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, '110', $5, $6)
         RETURNING member_id, username, email, register_date, member_type`,
        [
          member.name,
          member.email,
          member.password,
          member.phone,
          member.sex,
          member.address,
        ]
      );
      return result.rows[0];
    },

    async createCoupon(coupon) {
      const result = await pool.query(
        `INSERT INTO coupon
          (minimum_price, start_date, end_date, description, coupon_type, discount, admin_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          coupon.minimumPrice,
          coupon.startDate,
          coupon.endDate,
          coupon.description,
          coupon.couponType,
          coupon.discount,
          coupon.adminId,
        ]
      );
      return result.rows[0];
    },
  };
}

module.exports = { createShopRepository };
