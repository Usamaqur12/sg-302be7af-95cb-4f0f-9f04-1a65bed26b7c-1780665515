import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";

import { canUseLocalDevAuthFallback, queryRows } from "@/lib/server/db";
import { readLocalDatabase, writeLocalDatabase, type LocalRecord } from "@/lib/server/local-db";

export type EmailDeliveryStatus = "queued" | "sending" | "sent" | "failed" | "skipped";

export interface EmailDeliveryLog {
  id: string;
  email_type: string;
  recipient: string;
  subject: string;
  from_address: string;
  html_body: string;
  status: EmailDeliveryStatus;
  attempt_count: number;
  max_attempts: number;
  provider_message_id: string | null;
  last_error: string | null;
  metadata: Record<string, unknown> | null;
  next_retry_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailDeliveryLogInput {
  emailType: string;
  recipient: string;
  subject: string;
  fromAddress: string;
  htmlBody: string;
  maxAttempts: number;
  metadata?: Record<string, unknown>;
}

type EmailDeliveryRow = RowDataPacket & EmailDeliveryLog;

function now() {
  return new Date().toISOString();
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Email delivery failed";
}

function parseMetadata(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value !== "string") return null;

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeLocalLog(row: LocalRecord): EmailDeliveryLog {
  return {
    id: String(row.id),
    email_type: String(row.email_type),
    recipient: String(row.recipient),
    subject: String(row.subject),
    from_address: String(row.from_address),
    html_body: String(row.html_body),
    status: String(row.status) as EmailDeliveryStatus,
    attempt_count: Number(row.attempt_count || 0),
    max_attempts: Number(row.max_attempts || 3),
    provider_message_id: row.provider_message_id ? String(row.provider_message_id) : null,
    last_error: row.last_error ? String(row.last_error) : null,
    metadata: parseMetadata(row.metadata),
    next_retry_at: row.next_retry_at ? String(row.next_retry_at) : null,
    sent_at: row.sent_at ? String(row.sent_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function createEmailDeliveryLog(input: CreateEmailDeliveryLogInput) {
  const timestamp = now();
  const log: EmailDeliveryLog = {
    id: randomUUID(),
    email_type: input.emailType,
    recipient: input.recipient,
    subject: input.subject,
    from_address: input.fromAddress,
    html_body: input.htmlBody,
    status: "queued",
    attempt_count: 0,
    max_attempts: input.maxAttempts,
    provider_message_id: null,
    last_error: null,
    metadata: input.metadata ?? null,
    next_retry_at: null,
    sent_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (canUseLocalDevAuthFallback()) {
    const db = await readLocalDatabase();
    db.email_delivery_logs = db.email_delivery_logs || [];
    db.email_delivery_logs.push(log as unknown as LocalRecord);
    await writeLocalDatabase(db);
    return log;
  }

  await queryRows<RowDataPacket[]>(
    `INSERT INTO email_delivery_logs
     (id, email_type, recipient, subject, from_address, html_body, status, attempt_count,
      max_attempts, provider_message_id, last_error, metadata, next_retry_at, sent_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.email_type,
      log.recipient,
      log.subject,
      log.from_address,
      log.html_body,
      log.status,
      log.attempt_count,
      log.max_attempts,
      log.provider_message_id,
      log.last_error,
      JSON.stringify(log.metadata ?? {}),
      log.next_retry_at,
      log.sent_at,
      log.created_at,
      log.updated_at,
    ]
  );

  return log;
}

export async function updateEmailDeliveryLog(
  id: string,
  patch: Partial<Pick<
    EmailDeliveryLog,
    "status" | "attempt_count" | "provider_message_id" | "last_error" | "next_retry_at" | "sent_at"
  >>
) {
  const updatedAt = now();

  if (canUseLocalDevAuthFallback()) {
    const db = await readLocalDatabase();
    const logs = db.email_delivery_logs || [];
    const index = logs.findIndex((row) => String(row.id) === id);
    if (index >= 0) {
      logs[index] = { ...logs[index], ...patch, updated_at: updatedAt };
      db.email_delivery_logs = logs;
      await writeLocalDatabase(db);
    }
    return;
  }

  const assignments = Object.keys(patch).map((key) => `${key} = ?`);
  if (!assignments.length) return;

  await queryRows<RowDataPacket[]>(
    `UPDATE email_delivery_logs SET ${assignments.join(", ")}, updated_at = ? WHERE id = ?`,
    [...Object.values(patch), updatedAt, id]
  );
}

export async function getEmailDeliveryLog(id: string) {
  if (canUseLocalDevAuthFallback()) {
    const db = await readLocalDatabase();
    const row = (db.email_delivery_logs || []).find((item) => String(item.id) === id);
    return row ? normalizeLocalLog(row) : null;
  }

  const rows = await queryRows<EmailDeliveryRow[]>(
    `SELECT id, email_type, recipient, subject, from_address, html_body, status, attempt_count,
            max_attempts, provider_message_id, last_error, metadata, next_retry_at, sent_at, created_at, updated_at
       FROM email_delivery_logs
      WHERE id = ?
      LIMIT 1`,
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    ...row,
    metadata: parseMetadata(row.metadata),
  };
}

export function emailErrorMessage(error: unknown) {
  return normalizeError(error).slice(0, 1000);
}
