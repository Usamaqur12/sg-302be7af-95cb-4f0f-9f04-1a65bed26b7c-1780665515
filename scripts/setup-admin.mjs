import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();
const password = passwordArg;
const fullName = nameArg?.trim() || "Marketplace Administrator";
const emailValidator = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing database environment variables: ${missing.join(", ")}`);
}

if (!email || !emailValidator.test(email) || !password || password.length < 8) {
  throw new Error(
    'Usage: npm run setup:admin -- admin@example.com "StrongPassword" "Admin Name"'
  );
}

const connectionConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  charset: "utf8mb4",
};

let connection;
try {
  connection = await mysql.createConnection(connectionConfig);

  const passwordHash = await bcrypt.hash(password, 12);
  const [rows] = await connection.execute(
    "SELECT id FROM profiles WHERE email = ? LIMIT 1",
    [email]
  );
  const existing = Array.isArray(rows) ? rows[0] : null;
  const userId = existing?.id || randomUUID();

  if (existing) {
    await connection.execute(
      `UPDATE profiles
       SET password_hash = ?, full_name = ?, role = 'admin', is_active = 1
       WHERE id = ?`,
      [passwordHash, fullName, userId]
    );
  } else {
    await connection.execute(
      `INSERT INTO profiles
       (id, email, password_hash, full_name, role, is_active, email_verified_at)
       VALUES (?, ?, ?, ?, 'admin', 1, NOW())`,
      [userId, email, passwordHash, fullName]
    );
  }

  console.log(`Admin account ready: ${email}`);
} finally {
  if (connection) {
    await connection.end();
  }
}
