class TestPool {
  constructor() {
    this.rows = [];
    this.nextId = 1;
  }

  reset() {
    this.rows = [];
    this.nextId = 1;
  }

  async execute(sql, params = []) {
    const normalized = sql.trim().toUpperCase();

    if (normalized.startsWith("INSERT INTO DEFROST_USERS")) {
      const email = params?.[0];
      if (typeof email !== "string") {
        throw new Error("TestPool expected email string for INSERT");
      }

      if (this.rows.some((row) => row.email === email)) {
        const err = new Error("duplicate entry");
        err.code = "ER_DUP_ENTRY";
        throw err;
      }

      const newRow = {
        id: this.nextId++,
        email,
        createdAt: new Date(),
      };
      this.rows.push(newRow);
      return [{ insertId: newRow.id }, []];
    }

    if (normalized.startsWith("DELETE FROM DEFROST_USERS")) {
      const deleted = this.rows.length;
      this.rows = [];
      return [{ affectedRows: deleted }, []];
    }

    if (normalized.startsWith("SELECT") && normalized.includes("COUNT(*)")) {
      return [[{ total: this.rows.length }], []];
    }

    if (normalized.startsWith("SELECT") && normalized.includes("FROM DEFROST_USERS")) {
      const limitMatch = /LIMIT\s+(\d+)/i.exec(sql);
      const limit = limitMatch ? Number(limitMatch[1]) : this.rows.length;
      const sorted = [...this.rows].sort(
        (a, b) => b.createdAt - a.createdAt
      );
      const sliced = sorted.slice(0, limit).map((row) => ({
        id: row.id,
        email: row.email,
        createdAt: row.createdAt,
      }));
      return [sliced, []];
    }

    throw new Error(`TestPool cannot handle SQL: ${sql}`);
  }

  async query(sql) {
    const normalized = sql.trim().toUpperCase();
    if (normalized.startsWith("SELECT 1")) {
      return [[{ "1": 1 }], []];
    }

    return this.execute(sql);
  }

  async end() {
    this.reset();
  }
}

const testPool = new TestPool();

export function getTestPool() {
  return testPool;
}
