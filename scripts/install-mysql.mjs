import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import mysql from "mysql2/promise";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing database environment variables: ${missing.join(", ")}`);
}

const sql = await readFile(resolve("database/mysql/schema.sql"), "utf8");
const connectionConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
  charset: "utf8mb4",
};

const dbIdentifier = `\`${process.env.DB_NAME.replace(/`/g, "``")}\``;

let connection;
let bootstrapConnection;

try {
  connection = await mysql.createConnection({
    ...connectionConfig,
    database: process.env.DB_NAME,
  });
  await connection.query(sql);
  console.log("cPanel MySQL schema installed successfully.");
} catch (error) {
  if (error.code !== "ER_BAD_DB_ERROR") {
    throw error;
  }

  console.warn(
    `Database ${process.env.DB_NAME} does not exist yet. Attempting to create it.`
  );
  bootstrapConnection = await mysql.createConnection(connectionConfig);
  await bootstrapConnection.query(
    `CREATE DATABASE IF NOT EXISTS ${dbIdentifier} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrapConnection.end();
  bootstrapConnection = undefined;

  connection = await mysql.createConnection({
    ...connectionConfig,
    database: process.env.DB_NAME,
  });
  await connection.query(sql);
  console.log("cPanel MySQL schema installed successfully.");
} finally {
  if (connection) {
    await connection.end();
  }
  if (bootstrapConnection) {
    await bootstrapConnection.end();
  }
}
