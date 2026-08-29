function parsePort(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const sessionSecret = env.SESSION_SECRET || "development-only-session-secret";
  if (nodeEnv === "production" && !env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return {
    port: parsePort(env.PORT, 3000),
    nodeEnv,
    session: {
      secret: sessionSecret,
      secure: nodeEnv === "production",
    },
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
