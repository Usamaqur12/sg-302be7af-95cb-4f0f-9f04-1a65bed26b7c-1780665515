# ECL-63 Transactional Email Reliability

Date: 2026-06-16

Implemented transactional email reliability, logging, and retry recovery for Mercato's Resend-backed email service.

## Changes

- Added `email_delivery_logs` to the MySQL base schema and a same-day upgrade script for existing cPanel databases.
- Added local JSON database support for `email_delivery_logs` so development fallback behavior matches production structure.
- Wrapped all transactional sends in durable logging with statuses: `queued`, `sending`, `sent`, `failed`, and `skipped`.
- Added configurable retry attempts through `EMAIL_MAX_ATTEMPTS` and `EMAIL_RETRY_BASE_DELAY_MS`.
- Recorded provider message IDs, last error text, attempt counts, send timestamps, and next retry timestamps.
- Logged skipped delivery when `RESEND_API_KEY` is missing instead of silently returning.
- Added `POST /api/admin/email-delivery/[id]/retry` for admin and manager manual recovery of failed or skipped delivery logs.
- Added `email_delivery_logs` to the authenticated data API table allowlist so admin users can review delivery records.

## Operational Path

1. Admin or manager reviews `email_delivery_logs` through the data API.
2. Failed or skipped records retain the rendered transactional message needed for recovery.
3. After fixing the sender configuration or transient provider issue, admin or manager calls:

```text
POST /api/admin/email-delivery/{deliveryLogId}/retry
```

4. The retry endpoint resets the attempt counter and resends through the same logged record.

## Verification

- Ran a focused TypeScript compiler API check over the project with `noEmit` and `incremental` disabled for the in-memory check.
- Result: `0` diagnostics.

## Environment Notes

- The shell environment did not expose `git`, `npm`, or `node` through PowerShell during this heartbeat.
- The Node REPL had TypeScript available and was used for source inspection and compiler verification.
- No Paperclip issue API base URL or token was exposed through the available tool metadata, so the durable issue evidence is this repository note plus the code changes.
