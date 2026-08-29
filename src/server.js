const { createApp } = require("./app");
const { loadConfig } = require("./config");
const { createDatabasePool } = require("./database");
const { createShopRepository } = require("./repositories/shopRepository");
const { createShopService } = require("./services/shopService");

const config = loadConfig();
const pool = createDatabasePool(config.database);
const repository = createShopRepository(pool);
const shopService = createShopService(repository);
const app = createApp({ shopService });

const server = app.listen(config.port, () => {
  console.log(`E-commerce server listening on port ${config.port}.`);
});

async function shutdown(signal) {
  console.log(`${signal} received; stopping the server.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = { app, server, shutdown };
