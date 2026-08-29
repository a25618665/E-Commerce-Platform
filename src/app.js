const path = require("path");
const cookieParser = require("cookie-parser");
const express = require("express");
const { NotFoundError, ValidationError } = require("./errors");
const { attachSessionUser, requireRoles } = require("./security/authorization");

function asyncHandler(handler) {
  return function handledRoute(request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function createApp({ shopService, session }) {
  if (!shopService) {
    throw new TypeError("shopService is required");
  }
  if (!session || !session.secret) {
    throw new TypeError("session configuration is required");
  }

  const app = express();
  const projectRoot = path.resolve(__dirname, "..");
  app.set("view engine", "ejs");
  app.set("views", path.join(projectRoot, "views"));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));
  app.use(cookieParser(session.secret));
  app.use(attachSessionUser);
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
    requireRoles("admin"),
    asyncHandler(async (_request, response) => {
      response.render("member.ejs", { mem: await shopService.getMembers() });
    })
  );
  app.get("/admin/coupon", requireRoles("admin"), (_request, response) =>
    response.render("coupon.ejs")
  );
  app.get("/admin/statistics", requireRoles("admin"), (_request, response) =>
    response.render("statistics.ejs")
  );
  app.get(
    "/admin",
    requireRoles("admin"),
    asyncHandler(async (_request, response) => {
      response.render("guest_index.ejs", await shopService.getCatalog());
    })
  );

  app.get("/product/get", requireRoles("member", "admin"), (_request, response) =>
    response.send("商品已加入購物車")
  );
  app.get("/login", (_request, response) => response.render("login.ejs", { error: false }));
  app.post(
    "/process-login",
    asyncHandler(async (request, response) => {
      const member = await shopService.authenticate(request.body);
      if (!member) {
        return response.status(401).render("fail.ejs");
      }
      response.cookie("session", member, {
        signed: true,
        httpOnly: true,
        sameSite: "lax",
        secure: session.secure,
        maxAge: 8 * 60 * 60 * 1000,
      });
      return response.render("success.ejs");
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
    requireRoles("admin"),
    asyncHandler(async (request, response) => {
      await shopService.createCoupon(request.body);
      response.status(201).render("coupon.ejs");
    })
  );

  app.get("/member/shopping_cart", requireRoles("member", "admin"), (_request, response) =>
    response.render("shopping_cart.ejs")
  );
  app.get(
    "/member/shopping_cart-checked",
    requireRoles("member", "admin"),
    (_request, response) => response.render("shopping_cart-checked.ejs")
  );
  app.get("/member/order", requireRoles("member", "admin"), (_request, response) =>
    response.render("m_order.ejs")
  );
  app.get("/member/coupon", requireRoles("member", "admin"), (_request, response) =>
    response.render("coupon.ejs")
  );
  app.get("/seller/product_on", requireRoles("seller", "admin"), (_request, response) =>
    response.render("product_on.ejs")
  );
  app.get("/seller/product_m", requireRoles("seller", "admin"), (_request, response) =>
    response.render("product_m1.ejs")
  );
  app.get("/seller/product_mm", requireRoles("seller", "admin"), (_request, response) =>
    response.render("product_m2.ejs")
  );
  app.get("/seller/order", requireRoles("seller", "admin"), (_request, response) =>
    response.render("s_order.ejs")
  );

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
