import pool from "../db/config.js";

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "DuplicateEmailError";
  }
}

export async function insertUser(email, dbPool = pool) {
  const normalized = email.trim().toLowerCase();
  const query = `INSERT INTO defrost_users (email) VALUES (?)`;

  try {
    const [result] = await dbPool.execute(query, [normalized]);
    return result.insertId;
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      throw new DuplicateEmailError();
    }
    throw err;
  }
}

export async function listUsers(limit = 10, dbPool = pool) {
  const safeLimit = Number(limit);
  const finalLimit = Number.isFinite(safeLimit) && safeLimit > 0 ? safeLimit : 10;
  const query = `
    SELECT id, email, created_at AS createdAt
    FROM defrost_users
    ORDER BY created_at DESC
    LIMIT ${finalLimit}
  `;
  const [rows] = await dbPool.execute(query);
  return rows;
}

export async function countUsers(dbPool = pool) {
  const query = `SELECT COUNT(*) AS total FROM defrost_users`;
  const [rows] = await dbPool.execute(query);
  return rows[0]?.total ?? 0;
}
