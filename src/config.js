function parsePort(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function loadConfig(env = process.env) {
  return {
    port: parsePort(env.PORT, 3000),
    nodeEnv: env.NODE_ENV || "development",
    database: {
      host: env.DB_HOST || "localhost",
      port: parsePort(env.DB_PORT, 5432),
      database: env.DB_NAME || "ecommerce",
      user: env.DB_USER || "postgres",
      password: env.DB_PASSWORD,
    },
  };
}

module.exports = { loadConfig, parsePort };
