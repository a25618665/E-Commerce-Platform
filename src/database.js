const { Pool } = require("pg");

function createDatabasePool(config) {
  return new Pool(config);
}

module.exports = { createDatabasePool };
