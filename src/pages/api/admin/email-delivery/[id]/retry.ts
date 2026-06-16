import type { NextApiRequest, NextApiResponse } from "next";

import { retryEmailDelivery } from "@/lib/email";
import { getErrorMessage } from "@/lib/errors";
import { readSession } from "@/lib/server/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await readSession(req);
  if (session?.role !== "admin" && session?.role !== "manager") {
    return res.status(403).json({ error: "Admin or manager access required" });
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ error: "Email delivery log id is required" });

  try {
    const log = await retryEmailDelivery(id);
    return res.status(200).json({ success: true, log });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error, "Could not retry email delivery") });
  }
}
