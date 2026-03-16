import pool from "../db/config.js";

export class DuplicatePhoneError extends Error {
  constructor() {
    super("Phone number already registered");
    this.name = "DuplicatePhoneError";
  }
}

export async function insertUser(phone, dbPool = pool) {
  const query = `INSERT INTO defrost_users (phone_number) VALUES (?)`;

  try {
    const [result] = await dbPool.execute(query, [phone]);
    return result.insertId;
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      throw new DuplicatePhoneError();
    }
    throw err;
  }
}

export async function listUsers(limit = 10, dbPool = pool) {
  const safeLimit = Number(limit);
  const finalLimit = Number.isFinite(safeLimit) && safeLimit > 0 ? safeLimit : 10;
  const query = `
    SELECT id, phone_number AS phoneNumber, created_at AS createdAt
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
