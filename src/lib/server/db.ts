import mysql from "mysql2/promise";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";

type ExecuteValues = Parameters<Pool["execute"]>[1];
const globalForMysql = globalThis as typeof globalThis & {
  __mercatoMysqlPool?: Pool;
};

export function isDatabaseConfigured() {
  const values = [
    process.env.DB_HOST,
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
  ];

  return Boolean(
    values.every((value) => value && !String(value).toLowerCase().includes("placeholder")) &&
      process.env.DB_NAME !== "marketplace" &&
      process.env.DB_USER !== "marketplace"
  );
}

export function canUseLocalDevAuthFallback() {
  return (
    (process.env.LOCAL_DB_FALLBACK === "true" || process.env.NODE_ENV !== "production") &&
    !isDatabaseConfigured()
  );
}

export function getPool(): Pool {
  if (!isDatabaseConfigured()) {
    throw new Error("The cPanel MySQL database is not configured");
  }

  if (!globalForMysql.__mercatoMysqlPool) {
    globalForMysql.__mercatoMysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      queueLimit: 0,
      charset: "utf8mb4",
      decimalNumbers: true,
      dateStrings: true,
      enableKeepAlive: true,
    });
  }

  return globalForMysql.__mercatoMysqlPool;
}

export async function queryRows<T extends RowDataPacket[]>(
  sql: string,
  values: unknown[] = []
): Promise<T> {
  const [rows] = await getPool().execute<T>(sql, values as ExecuteValues);
  return rows;
}

export function getDatabaseSetupMessage(error?: unknown) {
  const rawMessage = error instanceof Error ? error.message : "";

  if (!isDatabaseConfigured()) {
    return "cPanel MySQL database is not configured. Set DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, AUTH_SECRET, then run npm run db:install and npm run setup:admin.";
  }

  if (
    rawMessage.includes("ECONNREFUSED") ||
    rawMessage.includes("ENOTFOUND") ||
    rawMessage.includes("Access denied") ||
    rawMessage.includes("Unknown database")
  ) {
    return "Cannot connect to the configured MySQL database. Check DB_HOST, DB_NAME, DB_USER, DB_PASSWORD and confirm MySQL is running.";
  }

  return rawMessage || "Database request failed";
}

export async function withTransaction<T>(
  operation: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getPool().getConnection();
  await connection.beginTransaction();

  try {
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
