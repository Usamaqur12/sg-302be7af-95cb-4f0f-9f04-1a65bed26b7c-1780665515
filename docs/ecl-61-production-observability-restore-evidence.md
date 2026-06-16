# ECL-61 Mercato Production Observability, Health Checks, Audit, and Restore Evidence

Issue: ECL-61
Date: 2026-06-16

## Implemented Surfaces

- Structured server events now emit JSON logs with timestamp, service, event, actor, target, request, error, and details fields.
- `/api/ops/health` reports app liveness, database mode, database latency, app version, and degraded/not-configured state without exposing secrets.
- `OPS_HEALTH_TOKEN` protects `/api/ops/health` in production. Use `Authorization: Bearer <token>` for uptime and DB readiness probes.
- Checkout/order creation logs auth failures, validation failures, unsupported payment methods, missing payment evidence, missing Stripe idempotency, idempotent replay, successful order creation, and checkout failures.
- Uploads log auth failures, unsupported scopes, successful saves, oversized files, and failed upload validation/storage.
- Private KYC/payment-proof retrieval logs missing auth, access denial, served evidence, and missing files.
- Generic data API failures log table, operation, status, request context, and error summary.
- Admin/manager audit metadata now includes redacted previous state and requested next state for sensitive marketplace tables.

## Audit Coverage

State snapshots are captured for:

- `orders`
- `payments`
- `seller_earnings`
- `withdrawal_requests`
- `return_requests`
- `seller_profiles`
- `products`

Redacted audit fields:

- `password_hash`
- `kyc_document_url`
- `cnic_front_url`
- `cnic_back_url`
- `owner_cnic`
- `tax_id`
- `payment_proof_url`
- `storage_path`

## Health Check Operations

Local/dev check:

```bash
curl -i http://localhost:3000/api/ops/health
```

Production check:

```bash
curl -i -H "Authorization: Bearer $OPS_HEALTH_TOKEN" https://<host>/api/ops/health
```

Expected outcomes:

- `200` and `status: "ok"` when the app and MySQL are reachable.
- `503` and `status: "degraded"` when the app is alive but MySQL cannot be reached.
- `503` and `status: "not_configured"` when production database env vars are missing.
- `401` when `OPS_HEALTH_TOKEN` is configured and the caller is unauthenticated.

Recommended monitors:

- Uptime probe: `GET /api/ops/health`, alert on non-200 for two consecutive checks.
- DB readiness probe: alert when response status is `degraded` or `not_configured`.
- Log alert: `event=checkout_order_failed`.
- Log alert: `event=auth_login_failed` with high count per IP/email.
- Log alert: `event=upload_failed` or `event=private_upload_access_denied`.
- Log alert: `event=data_query_failed` with `status>=500`.

## Restore Rehearsal Evidence Record

Create one record per rehearsal and attach command output/screenshots to the launch evidence folder or issue.

| Field | Value |
| --- | --- |
| Rehearsal ID | RESTORE-YYYYMMDD-NN |
| Environment | staging / temporary database |
| Operator | name and role |
| Started at | ISO timestamp |
| Completed at | ISO timestamp |
| Backup source | backup file, provider snapshot, or cPanel backup name |
| Backup created at | ISO timestamp |
| Database restored | DB name / host alias |
| Upload archive restored | yes/no, archive name |
| Duration | minutes |
| Smoke checks | health endpoint, login, product browse, checkout test, admin order view, private upload retrieval |
| Health result | status code and JSON summary |
| Audit spot check | audit log ID and verified previous/next state |
| Result | pass/fail |
| Follow-up issue | issue ID or none |

## Minimum Restore Smoke

1. Restore MySQL backup into staging or a temporary DB.
2. Restore `.private/uploads` and `public/uploads` from the matching upload archive when available.
3. Point staging env vars at the restored DB.
4. Run `/api/ops/health` with `OPS_HEALTH_TOKEN`.
5. Sign in as admin and verify seller/product/order queues load.
6. Sign in as customer and place a COD test order.
7. Upload a payment proof or retrieve an existing private payment proof as an authorized admin/manager.
8. Update one order/payment/withdrawal/return status and verify `admin_audit_logs.metadata` contains redacted `previous_state` and `next_state`.

## ECL-61 Verification Notes

- Static implementation verification completed locally with targeted source inspection.
- Full production restore rehearsal still requires a real MySQL backup, upload archive, staging/temporary DB, and operator credentials.
- `git` is not available on this workspace PATH, so file changes were verified from the filesystem rather than Git diff output.
