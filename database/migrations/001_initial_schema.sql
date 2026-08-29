BEGIN;

CREATE TABLE schema_migration (
  version VARCHAR(32) PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member (
  member_id BIGSERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(254) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  register_date DATE NOT NULL DEFAULT CURRENT_DATE,
  member_type VARCHAR(16) NOT NULL DEFAULT '110',
  sex BOOLEAN NOT NULL,
  address TEXT NOT NULL,
  CONSTRAINT member_type_supported
    CHECK (member_type IN ('admin', 'seller', 'member', '110'))
);

CREATE TABLE product (
  product_id BIGSERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL DEFAULT '',
  category TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  remain_amount INTEGER NOT NULL DEFAULT 0 CHECK (remain_amount >= 0),
  seller_id BIGINT NOT NULL REFERENCES member(member_id) ON DELETE RESTRICT
);

CREATE TABLE product_image (
  image_id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  CONSTRAINT product_image_unique_path UNIQUE (product_id, image_path)
);

CREATE TABLE coupon (
  coupon_id BIGSERIAL PRIMARY KEY,
  minimum_price NUMERIC(12, 2) NOT NULL CHECK (minimum_price >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  coupon_type VARCHAR(32) NOT NULL,
  discount NUMERIC(12, 2) NOT NULL CHECK (discount > 0),
  admin_id BIGINT NOT NULL REFERENCES member(member_id) ON DELETE RESTRICT,
  CONSTRAINT coupon_date_range CHECK (end_date >= start_date)
);

CREATE INDEX product_seller_idx ON product(seller_id);
CREATE INDEX product_category_idx ON product USING GIN(category);
CREATE INDEX product_image_product_idx ON product_image(product_id);
CREATE INDEX coupon_admin_idx ON coupon(admin_id);

INSERT INTO schema_migration (version, description)
VALUES ('001', 'Initial member, catalog, image, and coupon schema');

COMMIT;
