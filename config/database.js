const pg = require('pg');
const {
  PGHOST = "localhost",
  PGPORT = "5432",
  PGUSER = "postgres",
  PGPASSWORD = "fendys",
  PGDATABASE = "fortunate-coffee",

  POSTGRES_URL="postgres://default:PRIBuKJ5siq2@ep-empty-snowflake-a1i3e53a-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
  POSTGRES_PRISMA_URL="postgres://default:PRIBuKJ5siq2@ep-empty-snowflake-a1i3e53a-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require&pgbouncer=true&connect_timeout=15",
  POSTGRES_URL_NO_SSL="postgres://default:PRIBuKJ5siq2@ep-empty-snowflake-a1i3e53a-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb",
  POSTGRES_URL_NON_POOLING="postgres://default:PRIBuKJ5siq2@ep-empty-snowflake-a1i3e53a.ap-southeast-1.aws.neon.tech:5432/verceldb?,sslmode=require",
  POSTGRES_USER="default",
  POSTGRES_HOST="ep-empty-snowflake-a1i3e53a-pooler.ap-southeast-1.aws.neon.tech",
  POSTGRES_PASSWORD="PRIBuKJ5siq2",
  POSTGRES_DATABASE="verceldb",
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
    username: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DATABASE,
    host: POSTGRES_HOST,
    port: PGPORT,
    dialect: "postgres",
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
}