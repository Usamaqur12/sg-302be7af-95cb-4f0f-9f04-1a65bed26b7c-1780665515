const assert = require("node:assert/strict");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const rootDir = path.resolve(__dirname, "..");

const originalResolveFilename = Module._resolveFilename;
const originalLoad = Module._load;

function encodeFixtureToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

Module._load = function loadWithTestShims(request, parent, isMain) {
  if (request === "jose") {
    class SignJWT {
      constructor(payload) {
        this.payload = payload;
      }
      setProtectedHeader() {
        return this;
      }
      setIssuedAt() {
        return this;
      }
      setExpirationTime() {
        return this;
      }
      async sign() {
        return encodeFixtureToken(this.payload);
      }
    }

    return {
      SignJWT,
      jwtVerify: async (token) => ({
        payload: JSON.parse(Buffer.from(String(token), "base64url").toString("utf8")),
      }),
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(rootDir, "src", request.slice(2)), parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = function compileTypeScript(module, filename) {
    const source = require("node:fs").readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        skipLibCheck: true,
      },
      fileName: filename,
    }).outputText;
    module._compile(output, filename);
  };
}

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function findOne(rows, predicate, label) {
  const row = rows.find(predicate);
  assert.ok(row, `${label} should exist`);
  return row;
}

async function callHandler(handler, { method = "POST", token, query = {}, body = {}, headers = {} }) {
  const req = {
    method,
    query,
    body,
    headers: {
      cookie: token ? `mercato_session=${token}` : "",
      ...headers,
    },
  };
  const res = responseMock();
  await handler(req, res);
  return res;
}

async function main() {
  const tempDir = mkdtempSync(path.join(tmpdir(), "mercato-finance-"));
  process.env.LOCAL_DB_FALLBACK = "true";
  process.env.LOCAL_DB_FILE = path.join(tempDir, "marketplace.json");
  process.env.NODE_ENV = "test";
  process.env.AUTH_COOKIE_SECURE = "false";
  delete process.env.DB_HOST;
  delete process.env.DB_NAME;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;

  try {
    const {
      createLocalOrder,
      readLocalDatabase,
      resetLocalDatabase,
      writeLocalDatabase,
    } = require("../src/lib/server/local-db.ts");
    const { updateAdminPayout, exportApprovedPayoutsCsv } = require("../src/lib/server/finance.ts");
    const { createSessionToken } = require("../src/lib/server/session.ts");
    const refundHandler = require("../src/pages/api/payments/[id]/refund.ts").default;
    const codHandler = require("../src/pages/api/admin/finance/cod/[id].ts").default;

    const admin = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "admin@marketplace.com",
      role: "admin",
    };
    const customerId = "00000000-0000-4000-8000-000000000003";
    const sellerId = "00000000-0000-4000-8000-000000000102";
    const productId = "qa-finance-product";
    const adminToken = await createSessionToken(admin);

    let db = await resetLocalDatabase();
    const seller = findOne(db.seller_profiles, (row) => row.id === sellerId, "seed seller");
    seller.commission_rate = 12.5;
    seller.bank_account_name = "Mercato Demo Store";
    seller.bank_account_number = "PK000123456789";
    seller.bank_name = "QA Bank";
    const payoutHoldSetting = findOne(db.system_settings, (row) => row.key === "seller_payout_hold_days", "payout hold setting");
    payoutHoldSetting.value = "0";
    db.products.push({
      id: productId,
      seller_id: sellerId,
      category_id: db.categories[0]?.id || null,
      title: "QA Finance Product",
      slug: "qa-finance-product",
      description: "Deterministic finance workflow fixture.",
      price: 1000,
      stock_quantity: 10,
      status: "approved",
      is_featured: 0,
      is_deal: 0,
      sales_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await writeLocalDatabase(db);

    const payoutOrder = await createLocalOrder(customerId, {
      items: [{ product_id: productId, quantity: 2 }],
      shipping_full_name: "Finance QA",
      shipping_email: "finance.qa@example.test",
      shipping_phone: "+920000000000",
      shipping_street: "1 Test Street",
      shipping_city: "Karachi",
      shipping_state: "Sindh",
      shipping_zip_code: "74000",
      shipping_country: "PK",
      payment_method: "cash_on_delivery",
      idempotency_key: "qa-finance-payout-order",
    });

    db = await readLocalDatabase();
    const payoutOrderRow = findOne(db.orders, (row) => row.id === payoutOrder.id, "payout order");
    const payoutPayment = findOne(db.payments, (row) => row.order_id === payoutOrder.id, "payout payment");
    const payoutItem = findOne(db.order_items, (row) => row.order_id === payoutOrder.id, "payout order item");
    assert.equal(money(payoutItem.subtotal), 2000, "order item subtotal should be deterministic");
    assert.equal(money(payoutItem.commission_amount), 250, "12.5% commission should be captured on the order item");
    assert.equal(money(payoutItem.seller_earnings), 1750, "seller earning should be net of commission");

    const deliveredAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    payoutOrderRow.status = "delivered";
    payoutOrderRow.delivered_at = deliveredAt;
    payoutPayment.status = "completed";
    payoutPayment.paid_at = deliveredAt;
    db.withdrawal_requests.push({
      id: "qa-withdrawal-approve",
      seller_id: sellerId,
      amount: 1000,
      status: "pending",
      requested_at: deliveredAt,
      created_at: deliveredAt,
      updated_at: deliveredAt,
    });
    db.withdrawal_requests.push({
      id: "qa-withdrawal-reject",
      seller_id: sellerId,
      amount: 200,
      status: "pending",
      requested_at: deliveredAt,
      created_at: deliveredAt,
      updated_at: deliveredAt,
    });
    await writeLocalDatabase(db);

    const approved = await updateAdminPayout("qa-withdrawal-approve", "approve", admin, "QA payout approval");
    assert.equal(approved.withdrawal.status, "approved", "payout approval should update withdrawal status");
    assert.ok(approved.batch?.id, "payout approval should create a batch");

    const rejected = await updateAdminPayout("qa-withdrawal-reject", "reject", admin, "QA rejection");
    assert.equal(rejected.withdrawal.status, "rejected", "payout rejection should update withdrawal status");
    assert.equal(rejected.batch, null, "payout rejection should not create a batch");

    db = await readLocalDatabase();
    assert.equal(db.payout_batches.length, 1, "one payout batch should be created");
    assert.equal(db.payout_batch_items.length, 1, "one payout batch item should be created");
    assert.ok(
      db.finance_ledger_entries.some(
        (entry) =>
          entry.entry_type === "payout_approved" &&
          entry.direction === "debit" &&
          entry.seller_id === sellerId &&
          money(entry.amount) === 1000
      ),
      "payout approval should post a seller payable debit"
    );
    const sellerAfterPayout = findOne(db.seller_profiles, (row) => row.id === sellerId, "seller after payout");
    assert.equal(money(sellerAfterPayout.available_balance), 750, "available balance should be reduced by approved payout");

    const refundResponse = await callHandler(refundHandler, {
      token: adminToken,
      query: { id: payoutPayment.id },
      body: {
        amount: 500,
        reason: "qa_partial_refund",
        idempotency_key: "qa-refund-idempotency",
      },
    });
    assert.equal(refundResponse.statusCode, 200, "partial refund API should succeed");
    assert.equal(money(refundResponse.body.refund.amount), 500, "refund API should return the requested amount");

    const idempotentRefundResponse = await callHandler(refundHandler, {
      token: adminToken,
      query: { id: payoutPayment.id },
      body: {
        amount: 500,
        reason: "qa_partial_refund",
        idempotency_key: "qa-refund-idempotency",
      },
    });
    assert.equal(idempotentRefundResponse.statusCode, 200, "replayed refund should be idempotent");

    db = await readLocalDatabase();
    const refundedPayment = findOne(db.payments, (row) => row.id === payoutPayment.id, "refunded payment");
    assert.equal(money(refundedPayment.refunded_amount), 500, "payment refunded amount should be persisted");
    assert.equal(
      db.payment_refunds.filter((row) => row.payment_id === payoutPayment.id && row.idempotency_key === "qa-refund-idempotency").length,
      1,
      "refund idempotency key should prevent duplicate refund records"
    );
    assert.ok(
      db.finance_ledger_entries.some((entry) => entry.entry_type === "refund_customer_reversal" && money(entry.amount) === 500),
      "refund should post customer reversal ledger entry"
    );
    assert.ok(
      db.finance_ledger_entries.some((entry) => entry.entry_type === "seller_earning_reversal" && money(entry.amount) === 437.5),
      "refund should reverse the proportional seller earning"
    );
    assert.ok(
      db.finance_ledger_entries.some((entry) => entry.entry_type === "commission_reversal" && money(entry.amount) === 62.5),
      "refund should reverse the proportional marketplace commission"
    );

    const codOrder = await createLocalOrder(customerId, {
      items: [{ product_id: productId, quantity: 1 }],
      shipping_full_name: "COD QA",
      shipping_email: "cod.qa@example.test",
      shipping_phone: "+920000000001",
      shipping_street: "2 Test Street",
      shipping_city: "Karachi",
      shipping_state: "Sindh",
      shipping_zip_code: "74000",
      shipping_country: "PK",
      payment_method: "cash_on_delivery",
      idempotency_key: "qa-finance-cod-order",
    });

    db = await readLocalDatabase();
    const codRow = findOne(db.cod_reconciliations, (row) => row.order_id === codOrder.id, "COD reconciliation");
    const codPayment = findOne(db.payments, (row) => row.order_id === codOrder.id, "COD payment");
    const codResponse = await callHandler(codHandler, {
      token: adminToken,
      query: { id: codRow.id },
      body: {
        collected_amount: 1000,
        remitted_amount: 970,
        courier_fee: 30,
        courier_name: "QA Courier",
        courier_reference: "COD-QA-1",
        notes: "QA reconciliation",
      },
    });
    assert.equal(codResponse.statusCode, 200, "COD reconciliation API should succeed");
    assert.equal(codResponse.body.reconciliation.status, "reconciled", "COD remittance minus fee should reconcile");

    db = await readLocalDatabase();
    const reconciledCod = findOne(db.cod_reconciliations, (row) => row.id === codRow.id, "reconciled COD row");
    const completedCodPayment = findOne(db.payments, (row) => row.id === codPayment.id, "completed COD payment");
    const confirmedCodOrder = findOne(db.orders, (row) => row.id === codOrder.id, "confirmed COD order");
    assert.equal(money(reconciledCod.discrepancy_amount), 0, "COD discrepancy should be zero");
    assert.equal(completedCodPayment.status, "completed", "COD collection should complete payment");
    assert.equal(confirmedCodOrder.status, "confirmed", "COD collection should confirm pending order");

    const payoutCsv = await exportApprovedPayoutsCsv();
    assert.match(payoutCsv, /qa-withdrawal-approve/, "payout CSV should include approved withdrawal reference");

    console.log("finance workflow tests passed");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
