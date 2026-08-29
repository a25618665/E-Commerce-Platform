const ROUTE_CONTRACT = Object.freeze([
  ["GET", "/"],
  ["GET", "/product"],
  ["GET", "/admin/member"],
  ["GET", "/admin/coupon"],
  ["GET", "/admin/statistics"],
  ["GET", "/admin"],
  ["GET", "/product/get"],
  ["GET", "/login"],
  ["POST", "/process-login"],
  ["GET", "/register"],
  ["POST", "/register"],
  ["POST", "/admin/coupon"],
  ["GET", "/member/shopping_cart"],
  ["GET", "/member/shopping_cart-checked"],
  ["GET", "/member/order"],
  ["GET", "/member/coupon"],
  ["GET", "/seller/product_on"],
  ["GET", "/seller/product_m"],
  ["GET", "/seller/product_mm"],
  ["GET", "/seller/order"],
]);

module.exports = { ROUTE_CONTRACT };
