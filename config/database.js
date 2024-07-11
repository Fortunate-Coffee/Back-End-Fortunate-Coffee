// const pg = require('pg');
const {
  PGHOST = "localhost",
  PGPORT = "5432",
  PGUSER = "postgres",
  PGPASSWORD = "fendys",
  PGDATABASE = "fortunate-coffee",

  RPGHOST = "roundhouse.proxy.rlwy.net",
  RPGPORT = "15044",
  RPGUSER = "postgres",
  RPGPASSWORD = "APUlsHgYyNaZUUIWHhtyfdTxdBmRoOeB",
  RPGDATABASE = "railway",
} = process.env;

module.exports = {
  development: {
    username: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    host: PGHOST,
    port: PGPORT,
    dialect: "postgres"
  },
  test: {
    username: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    host: PGHOST,
    port: PGPORT,
    dialect: "postgres"
  },
  production: {
    username: RPGUSER,
    password: RPGPASSWORD,
    database: RPGDATABASE,
    host: RPGHOST,
    port: RPGPORT,
    dialect: "postgres"
  }
}