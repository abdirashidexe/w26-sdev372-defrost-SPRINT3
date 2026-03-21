import dotenv from "dotenv";
import mysql from "mysql2/promise";
import mysqlSync from "mysql2";
import { getTestPool } from "./testPool.mjs";

dotenv.config({ path: new URL("../../.env", import.meta.url) });

export const isTestEnvironment =
  process.env.NODE_ENV === "test" ||
  Boolean(process.env.VITEST_WORKER_ID || process.env.VITEST);

const pool = isTestEnvironment
  ? getTestPool()
  : await createPoolWithBootstrappedUser();

export default pool;

async function createPoolWithBootstrappedUser() {
  const {
    DB_HOST = "localhost",
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
  } = process.env;

  if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error("DB_USER, DB_PASSWORD, and DB_NAME must be set before connecting to the database.");
  }

  await ensureUser(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

  return mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

async function ensureUser(host, user, password, database) {
  const rootUser = process.env.DB_ROOT_USER;
  const rootPassword = process.env.DB_ROOT_PASSWORD;

  if (!rootUser || !rootPassword) {
    return;
  }

  const userIdentifier = `${mysqlSync.escapeId(user)}@'%'`;
  const escapedPassword = mysqlSync.escape(password);
  const escapedDatabase = mysqlSync.escapeId(database);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user: rootUser,
      password: rootPassword,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${escapedDatabase}`);
    await connection.query(
      `CREATE USER IF NOT EXISTS ${userIdentifier} IDENTIFIED BY ${escapedPassword}`
    );
    await connection.query(
      `GRANT ALL PRIVILEGES ON ${escapedDatabase}.* TO ${userIdentifier}`
    );
    await connection.query("FLUSH PRIVILEGES");
  } catch (err) {
    console.warn("Unable to ensure database user grants:", err.message ?? err);
  } finally {
    await connection?.end();
  }
}
