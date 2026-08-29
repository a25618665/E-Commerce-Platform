BEGIN;

-- Public demo accounts only. The shared password is documented in the README
-- and must never be reused outside a local demonstration environment.
INSERT INTO member
  (member_id, username, email, password, phone_number, register_date, member_type, sex, address)
VALUES
  (1, 'demo_admin', 'admin@example.test', 'scrypt$00112233445566778899aabbccddeeff$f95410e51c00c3f55052c04c388b897d7149b5d480b2cff906e1fc9105d253eb0a052a0b0fd426be8cce2f84e1a6fcc45c82c5bd9432b1e5712d85b9eea83a86', '555-0101', CURRENT_DATE, 'admin', TRUE, 'Local demo'),
  (2, 'demo_seller', 'seller@example.test', 'scrypt$112233445566778899aabbccddeeff00$ec0a677668516bd1c688a69c08b991f14ede50c033d8f3bcae721610a2631a90f4199009bcacc1a2d97a8444eb4b4f772f4b8d2c16a42a2fc00b6101254cea21', '555-0102', CURRENT_DATE, 'seller', FALSE, 'Local demo'),
  (3, 'demo_member', 'member@example.test', 'scrypt$2233445566778899aabbccddeeff0011$73d43e8c0105c0562293036783fd7bd88b3ae5e2ae615f15bde279bb902aa1eef1387149ad41685e8d8fd7da11d87de6302557c88d93189b56f49d13e00506d8', '555-0103', CURRENT_DATE, 'member', TRUE, 'Local demo');

INSERT INTO product
  (product_id, name, price, description, category, status, remain_amount, seller_id)
VALUES
  (1, 'Mechanical Keyboard', 89.00, 'Compact keyboard for the portfolio storefront.', ARRAY['1'], 'active', 12, 2),
  (2, 'Wireless Mouse', 39.00, 'Ergonomic wireless mouse.', ARRAY['1'], 'active', 20, 2),
  (3, 'USB-C Hub', 49.00, 'Multi-port adapter for laptops.', ARRAY['1'], 'active', 15, 2),
  (4, 'Desk Lamp', 35.00, 'Adjustable LED task light.', ARRAY['2'], 'active', 9, 2),
  (5, 'Notebook Set', 18.00, 'Three reusable project notebooks.', ARRAY['3'], 'active', 30, 2),
  (6, 'Laptop Stand', 55.00, 'Aluminum stand for a portable workspace.', ARRAY['3'], 'active', 11, 2);

INSERT INTO product_image (product_id, image_path)
SELECT product_id, 'product-placeholder.svg'
FROM product
WHERE product_id BETWEEN 1 AND 6;

INSERT INTO coupon
  (coupon_id, minimum_price, start_date, end_date, description, coupon_type, discount, admin_id)
VALUES
  (1, 50.00, CURRENT_DATE, CURRENT_DATE + 30, 'Local demo discount', 'fixed', 5.00, 1);

SELECT setval(pg_get_serial_sequence('member', 'member_id'), (SELECT MAX(member_id) FROM member), TRUE);
SELECT setval(pg_get_serial_sequence('product', 'product_id'), (SELECT MAX(product_id) FROM product), TRUE);
SELECT setval(pg_get_serial_sequence('product_image', 'image_id'), (SELECT MAX(image_id) FROM product_image), TRUE);
SELECT setval(pg_get_serial_sequence('coupon', 'coupon_id'), (SELECT MAX(coupon_id) FROM coupon), TRUE);

COMMIT;
