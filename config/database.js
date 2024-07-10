const {
  PGHOST = "localhost",
  PGPORT = "5432",
  PGUSER = "postgres",
  PGPASSWORD = "fendys",
  PGDATABASE = "fortunate-coffee",

  POSTGRES_URL="postgres://default:2xRW5XwjBuSo@ep-blue-firefly-a1qiuusg-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
  POSTGRES_PRISMA_URL="postgres://default:2xRW5XwjBuSo@ep-blue-firefly-a1qiuusg-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require&pgbouncer=true&connect_timeout=15",
  POSTGRES_URL_NO_SSL="postgres://default:2xRW5XwjBuSo@ep-blue-firefly-a1qiuusg-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb",
  POSTGRES_URL_NON_POOLING="postgres://default:2xRW5XwjBuSo@ep-blue-firefly-a1qiuusg.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
  POSTGRES_USER="default",
  POSTGRES_HOST="ep-blue-firefly-a1qiuusg-pooler.ap-southeast-1.aws.neon.tech",
  POSTGRES_PASSWORD="2xRW5XwjBuSo",
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