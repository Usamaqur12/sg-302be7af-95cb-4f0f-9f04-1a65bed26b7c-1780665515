import type { NextApiRequest, NextApiResponse } from "next";
import {
  exportApprovedPayoutsCsv,
  listAdminPayouts,
  updateAdminPayout,
} from "@/lib/server/finance";
import { logServerEvent } from "@/lib/server/observability";
import { readSession } from "@/lib/server/session";

function jsonError(res: NextApiResponse, status: number, message: string) {
  return res.status(status).json({ data: null, error: { message } });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await readSession(req);
  if (!session || !["admin", "manager"].includes(session.role)) {
    return jsonError(res, 403, "Access denied: finance role required");
  }

  try {
    if (req.method === "GET") {
      if (req.query.export === "csv") {
        const csv = await exportApprovedPayoutsCsv();
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="payout-export-${Date.now()}.csv"`);
        return res.status(200).send(csv);
      }

      return res.status(200).json({ data: await listAdminPayouts(), error: null });
    }

    if (req.method === "POST") {
      const withdrawalId = typeof req.body?.withdrawalId === "string" ? req.body.withdrawalId : "";
      const action = req.body?.action === "reject" ? "reject" : req.body?.action === "approve" ? "approve" : null;
      const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";

      if (!withdrawalId || !action) {
        return jsonError(res, 400, "Withdrawal id and action are required");
      }

      const result = await updateAdminPayout(withdrawalId, action, session, note || undefined);
      return res.status(200).json({ data: result, error: null });
    }

    res.setHeader("Allow", "GET, POST");
    return jsonError(res, 405, "Method not allowed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout request failed";
    const status = message.includes("Access denied") ? 403 : message.includes("not found") ? 404 : 400;
    logServerEvent({
      event: "admin_payout_failed",
      level: status >= 500 ? "error" : "warn",
      req,
      error,
      details: { status },
    });
    return jsonError(res, status, message);
  }
}
