# ECL-58 Role and Data Policy Smoke Verification

Date: 2026-06-16
Issue: ECL-58
Verifier: Codex Engineer

## Environment

Production-like MySQL credentials were not present in this workspace. The verification below used the Mercato local database fallback with:

- `LOCAL_DB_FALLBACK=true`
- `AUTH_COOKIE_SECURE=false`
- real project API handlers loaded through an in-memory TypeScript transpiler
- real `readSession`, `createSessionToken`, `/api/orders`, `/api/data/query`, `/api/uploads`, and `/api/uploads/[...path]` handler logic

PowerShell could not launch `node`, `npm`, or `git` from PATH in this heartbeat, so the exact `npm run type-check` command could not be executed. The embedded Node runtime was able to import `typescript` and run compiler diagnostics against `tsconfig.json`.

## Smoke Data Created

- Order: `ORD-1781568687441-CA88CAB4`
- Order ID: `47170618-3937-49fd-8f32-307e14c6ce6b`
- Product ID: `2bcc1de6-1809-43f6-8676-30e79309ad84`
- Seller ID: `00000000-0000-4000-8000-000000000102`
- Private KYC upload URL: `/api/uploads/kyc/00000000-0000-4000-8000-000000000002/1781568848666-3a455aa3-f081-400f-b46a-768d7ce6a782-ecl-58-smoke.png`

No secrets or private document contents are recorded here.

## Handler Smoke Results

All executed checks passed.

| Check | Expected | Result |
| --- | --- | --- |
| Anonymous public products read | `200` | Pass |
| Anonymous private orders read | `401` | Pass |
| Customer own order read | `200` | Pass |
| Customer cross-order read | `403` | Pass |
| Seller own order item read | `200` | Pass |
| Seller cross-seller order item read | `403` | Pass |
| Admin seller/KYC profile read includes private columns | `200` | Pass |
| Seller owner profile/KYC read includes private columns | `200` | Pass |
| Anonymous seller profile read redacts private KYC fields | `200` | Pass |
| Anonymous private KYC URL read | `401` | Pass |
| Seller owner private KYC URL read | `200` | Pass |
| Admin private KYC URL read | `200` | Pass |
| Other customer private KYC URL read | `403` | Pass |

## Type Check

The embedded TypeScript compiler API loaded `tsconfig.json` and checked 217 project files. It reported no source-file diagnostics. It did report TypeScript diagnostic `TS5074` at configuration level:

`Option '--incremental' can only be specified using tsconfig, emitting to single file or when option '--tsBuildInfoFile' is specified.`

This was observed in the embedded compiler API path. The exact `npm run type-check` acceptance command remains unrun because the shell environment did not expose `npm` or `node`.

## Remaining Blockers

ECL-58 cannot be closed against its stated acceptance criteria until these are provided:

1. Production-like MySQL connection details with one admin, one manager, one warehouse user, two customers, and two approved sellers, plus representative cart/order/payment/return/support/seller finance data.
2. A shell/runtime environment where `node` and `npm` are on PATH so `npm run type-check` and a reusable smoke command can be run exactly.

Once those are available, rerun the same policy matrix against the configured MySQL database and attach the results to the launch tracker.
