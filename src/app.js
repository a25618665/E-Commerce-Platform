const path = require("path");
const express = require("express");
const { NotFoundError, ValidationError } = require("./errors");

function asyncHandler(handler) {
  return function handledRoute(request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function createApp({ shopService }) {
  if (!shopService) {
    throw new TypeError("shopService is required");
  }

  const app = express();
  const projectRoot = path.resolve(__dirname, "..");
  app.set("view engine", "ejs");
  app.set("views", path.join(projectRoot, "views"));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));
  app.use(express.static(path.join(projectRoot, "public")));

  app.get(
    "/",
    asyncHandler(async (request, response) => {
      const search = typeof request.query.search === "string" ? request.query.search : "";
      const category =
        typeof request.query.Category === "string" ? request.query.Category : "";
      const catalog = await shopService.getCatalog({ search, category });

      if (search) {
        return response.render("search.ejs", catalog);
      }
      if (category) {
        return response.render("category.ejs", { ...catalog, Category: category });
      }
      return response.render("index.ejs", catalog);
    })
  );

  app.get(
    "/product",
    asyncHandler(async (request, response) => {
      const product = await shopService.getProduct(request.query.p_id);
      response.render("product.ejs", product);
    })
  );

  app.get(
    "/admin/member",
    asyncHandler(async (_request, response) => {
      response.render("member.ejs", { mem: await shopService.getMembers() });
    })
  );
  app.get("/admin/coupon", (_request, response) => response.render("coupon.ejs"));
  app.get("/admin/statistics", (_request, response) => response.render("statistics.ejs"));
  app.get(
    "/admin",
    asyncHandler(async (_request, response) => {
      response.render("guest_index.ejs", await shopService.getCatalog());
    })
  );

  app.get("/product/get", (_request, response) => response.send("商品已加入購物車"));
  app.get("/login", (_request, response) => response.render("login.ejs", { error: false }));
  app.post(
    "/process-login",
    asyncHandler(async (request, response) => {
      const member = await shopService.authenticate(request.body);
      response.status(member ? 200 : 401).render(member ? "success.ejs" : "fail.ejs");
    })
  );

  app.get("/register", (_request, response) => response.render("register.ejs"));
  app.post(
    "/register",
    asyncHandler(async (request, response) => {
      await shopService.register(request.body);
      response.status(201).render("login.ejs", { error: false });
    })
  );
  app.post(
    "/admin/coupon",
    asyncHandler(async (request, response) => {
      await shopService.createCoupon(request.body);
      response.status(201).render("coupon.ejs");
    })
  );

  app.get("/member/shopping_cart", (_request, response) =>
    response.render("shopping_cart.ejs")
  );
  app.get("/member/shopping_cart-checked", (_request, response) =>
    response.render("shopping_cart-checked.ejs")
  );
  app.get("/member/order", (_request, response) => response.render("m_order.ejs"));
  app.get("/member/coupon", (_request, response) => response.render("coupon.ejs"));
  app.get("/seller/product_on", (_request, response) => response.render("product_on.ejs"));
  app.get("/seller/product_m", (_request, response) => response.render("product_m1.ejs"));
  app.get("/seller/product_mm", (_request, response) => response.render("product_m2.ejs"));
  app.get("/seller/order", (_request, response) => response.render("s_order.ejs"));

  app.use((_request, _response, next) => next(new NotFoundError("Route not found.")));
  app.use((error, request, response, _next) => {
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
      console.error({
        message: error.message,
        method: request.method,
        path: request.path,
      });
    }

    if (request.accepts("html")) {
      return response.status(statusCode).render("fail.ejs", {
        error: error instanceof ValidationError ? error.message : "Request failed.",
      });
    }
    return response.status(statusCode).json({ error: error.message });
  });

  return app;
}

module.exports = { asyncHandler, createApp };
