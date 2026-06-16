import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      appInfo: {
        name: "Mercato",
      },
    });
  }

  return stripeClient;
}

export function toStripeAmount(amount: number) {
  return Math.round(Number(amount || 0) * 100);
}

export function getStripeCurrency() {
  return (process.env.STRIPE_CURRENCY || "pkr").toLowerCase();
}
