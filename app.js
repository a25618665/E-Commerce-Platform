const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// middleware
app.use(express.static("public"));
const { Client } = require("pg");
const client = new Client({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  port: Number(process.env.DB_PORT || 5432),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "ecommerce",
});
client.connect();
app.get("/", function (req, res) {
  // 測試資料
  // 假設每個商品只有一張圖片
  let img = [];
  let recomend_product = [];
  async function database_func() {
    if (Object.keys(req.query).length == 0) {
      // 這裡放推薦商品query
      let res1;
      try {
        res1 = await client.query(`select product_id from product`);
      } catch (err) {
        console.error(err);
      }
      for (i = 0; i < res1.rows.length; i++) {

        let res;
        try {
          res = await client.query(`select product_id, Image_path from product_image where product_id = $1`, [res1.rows[i].product_id]);
          img.push({ Product_id: res.rows[0].product_id, Image_path: "./img/".concat('', res.rows[0].image_path) });
        } catch (err) {
          console.error(err);
        }
        try {
          res = await client.query(`select P.Product_id, P.Name, P.Price, P.Description, M.username from Product as P, member as M where M.member_id = P.seller_id and Product_id = $1`, [res1.rows[i].product_id]);
          recomend_product.push({ Product_id: res.rows[0].product_id, Name: res.rows[0].name, Price: res.rows[0].price, Username: res.rows[0].username });
        } catch (err) {
          console.error(err);
        }
      }
      res.render("index.ejs", { img, recomend_product });
    } else if (Object.keys(req.query) == "search") {
      let { search } = req.query;
      // 這裡根據搜尋放搜尋結果
      let res1;
      try {
        res1 = await client.query(`select p.product_id, p.Name, p.Price, m.username, p_i.image_path from product as p, product_image as p_i, member as m where p.product_id = p_i.product_id and m.member_id = p.seller_id and p.name like $1`, ['%'.concat('', search).concat('', '%')]);
        recomend_product.push({ Product_id: res1.rows[0].product_id, Name: res1.rows[0].name, Price: res1.rows[0].price, Username: res1.rows[0].username });
        img.push({ Product_id: res1.rows[0].product_id, Image_path: "./img/".concat('', res1.rows[0].image_path) });
      } catch (err) {
        console.error(err);
      }
      res.render("search.ejs", { img, recomend_product });
    } else {
      let { Category } = req.query;
      // 這裡根據分類放分類query
      let res1;
      try {
        res1 = await client.query(`select product_id from product where category = $1`, ["{".concat('', Category.toString()).concat('', "}")]);
      } catch (err) {
        console.error(err);
      }
      for (i = 0; i < res1.rows.length; i++) {
        let res2;
        try {
          res2 = await client.query(`select p.product_id, p.Name, p.Price, m.username, p_i.image_path from product as p, product_image as p_i, member as m where p.product_id = p_i.product_id and m.member_id = p.seller_id and p.product_id = $1`, [res1.rows[i].product_id]);
          recomend_product.push({ Product_id: res2.rows[0].product_id, Name: res2.rows[0].name, Price: res2.rows[0].price, Username: res2.rows[0].username });
          img.push({ Product_id: res2.rows[0].product_id, Image_path: "./img/".concat('', res2.rows[0].image_path) });
        } catch (err) {
          console.error(err);
        }
      }
      res.render("category.ejs", { img, recomend_product, Category });
    }
  }
  database_func();
}
);
app.get("/product", function (req, res) {
  let { p_id } = req.query;
  let img = [];
  let product = [];
  async function database_func() {
    for (i = 0; i < 1; i++) {
      let res;
      try {
        res = await client.query(`select product_id, Image_path from product_image where product_id = $1`, [p_id]);
        img.push({ Image_path: "./img/".concat('', res.rows[0].image_path) });
      } catch (err) {
        console.error(err);
      }
      let res1;
      try {
        res1 = await client.query(`select P.Product_id, P.Name, P.Price, P.Description, M.username from Product as P, member as M where M.member_id = P.seller_id and Product_id = $1`, [p_id]);
        product.push({ Product_id: res1.rows[0].product_id, Name: res1.rows[0].name, Price: res1.rows[0].price, Description: "", Username: res1.rows[0].username });
      } catch (err) {
        console.error(err);
      }
    }
    res.render("product.ejs", { img, product });
  }
  database_func();
});

app.get("/admin/member", function (req, res) {
  async function database_func() {
    mem = [];
    let res1;
    try {
      res1 = await client.query(`select member_id, username, email, phone_number, register_date, sex from member`);
      for (i = 0; i < res1.rows.length; i++) {
        if (res1.rows[i].sex == true) {
          mem.push({ Member_id: res1.rows[i].member_id, Username: res1.rows[i].username, Email: res1.rows[i].email, Register_date: res1.rows[i].register_date, Sex: "男", Phone_number: res1.rows[i].phone_number });
        }
        else {
          mem.push({ Member_id: res1.rows[i].member_id, Username: res1.rows[i].username, Email: res1.rows[i].email, Register_date: res1.rows[i].register_date, Sex: "女", Phone_number: res1.rows[i].phone_number });
        }
      }
    } catch (err) {
      console.error(err);
    }
    res.render("member.ejs", { mem });
  }
  database_func();
});
app.get("/admin/coupon", function (req, res) {
  res.render("coupon.ejs");
});

app.get("/admin/statistics", function (req, res) {
  res.render("statistics.ejs");
});

app.get("/admin", function (req, res) {
  let img = [];
  let recomend_product = [];
  async function database_func() {
    let res1;
    try {
      res1 = await client.query(`select product_id from product`);
    } catch (err) {
      console.error(err);
    }
    for (i = 0; i < res1.rows.length; i++) {

      let res;
      try {
        res = await client.query(`select product_id, Image_path from product_image where product_id = $1`, [res1.rows[i].product_id]);
        img.push({ Product_id: res.rows[0].product_id, Image_path: "./img/".concat('', res.rows[0].image_path) });
      } catch (err) {
        console.error(err);
      }
      try {
        res = await client.query(`select P.Product_id, P.Name, P.Price, P.Description, M.username from Product as P, member as M where M.member_id = P.seller_id and Product_id = $1`, [res1.rows[i].product_id]);
        recomend_product.push({ Product_id: res.rows[0].product_id, Name: res.rows[0].name, Price: res.rows[0].price, Username: res.rows[0].username });
      } catch (err) {
        console.error(err);
      }
    }
    res.render("guest_index.ejs", { img, recomend_product });
  }
  database_func();
});
app.get("/product/get", function (req, res) {
  let p_id = req.query.add_cart;
  res.send("商品已加入購物車");
});

app.get("/login", function (req, res) {
  let error = false;
  res.render("login.ejs", { error });
});

app.get("/product", function (req, res) {
  let { p_id } = req.query;
  res.render("product.ejs", { p_id });
});
app.post("/process-login", function (req, res) {
  let { username, password } = req.body;
  if (username == "USER008" && password == "1234") {
    res.render("success.ejs");
  } else {
    res.render("fail.ejs");
  }
  /* async function database_func() {
    let pass = true;
    let res1;
    try {
      res1 = await client.query(`select * from MEMBER where username = $1`, [username]);
      if(res1.rows[0].password === password){
        res.render("success.ejs");
      }
      else{
        res.render("fail.ejs");
      }
    } catch (err) {
      console.log(err.message);
      res.render("fail.ejs");
    }
  }
  database_func(); */
});

app.get("/register", function (req, res) {
  res.render("register.ejs");
});
app.post("/register", function (req, res) {
  let { name, email, password, phone, address, sex } = req.body;
  client.query(`insert into MEMBER(Username, Email, Password, Phone_number, Register_date, Member_type, Sex, Address)VALUES
        ($1, $2, $3, $4, CURRENT_DATE, '110', $5, $6) RETURNING *`, [name, email, password, phone, sex, address], (err, res) => {
    if (!err) {
      console.log(res.rows[0]);
    }
    else {
      console.log(err.message);
    }
  })
  res.render("login.ejs");
});
app.post("/admin/coupon", function (req, res) {
  client.query(`insert into coupon(Minimum_price, Start_date, End_date, Description, Coupon_type, Discount, admin_id)VALUES
        ($1, $2, $3, $4, $5, $6, 1) RETURNING *`, [req.body["minimum_cost"], req.body["start_date"], req.body["end_date"], req.body["description"], req.body["coupon_type"], req.body["discount"]], (err, res) => {
    if (!err) {
      console.log(res.rows[0]);
    }
    else {
      console.log(err.message);
    }
  })
  res.render("coupon.ejs");
});
app.get("/member/shopping_cart", function (req, res) {
  res.render("shopping_cart.ejs");
});

app.get("/member/shopping_cart-checked", function (req, res) {
  res.render("shopping_cart-checked.ejs");
});

app.get("/member/order", function (req, res) {
  res.render("m_order.ejs");
});

app.get("/member/coupon", function (req, res) {
  res.render("coupon.ejs");
});

app.get("/seller/product_on", function (req, res) {
  res.render("product_on.ejs");
});

app.get("/seller/product_m", function (req, res) {
  res.render("product_m1.ejs");
});

app.get("/seller/product_mm", function (req, res) {
  res.render("product_m2.ejs");
});

app.get("/seller/order", function (req, res) {
  res.render("s_order.ejs");
});
app.listen(3000, () => {
  console.log("Server is running.");
});
