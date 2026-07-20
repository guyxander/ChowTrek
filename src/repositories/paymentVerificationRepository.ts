import { Order } from "../types/domain";

type VerificationSummary = {
  attempted: number;
  verified: number;
  message?: string;
};

const verificationEndpoint = "https://chowtrek-landing.vercel.app/api/monnify-verify";

export async function verifyPendingCardPayments(orders: Order[]): Promise<VerificationSummary> {
  const references = Array.from(
    new Set(
      orders
        .filter(
          (order) =>
            order.paymentMode === "Pay with card" &&
            order.paymentStatus === "Pending" &&
            order.paymentReference
        )
        .map((order) => order.paymentReference as string)
    )
  );

  if (references.length === 0) {
    return { attempted: 0, verified: 0 };
  }

  const results = await Promise.allSettled(references.map(verifyPaymentReference));
  const verified = results.filter((result) => result.status === "fulfilled" && result.value).length;
  const rejected = results.filter((result) => result.status === "rejected").length;

  if (verified > 0) {
    return {
      attempted: references.length,
      verified,
      message:
        verified === 1
          ? "Verified 1 pending card payment. Orders refreshed."
          : `Verified ${verified} pending card payments. Orders refreshed.`
    };
  }

  if (rejected > 0) {
    return {
      attempted: references.length,
      verified: 0,
      message: "Pending card payments could not be verified yet. Pull to refresh again shortly."
    };
  }

  return {
    attempted: references.length,
    verified: 0,
    message: "Pending card payments are still awaiting Monnify confirmation."
  };
}

async function verifyPaymentReference(reference: string): Promise<boolean> {
  const url = new URL(verificationEndpoint);
  url.searchParams.set("paymentReference", reference);
  url.searchParams.set("source", "app-refresh");

  const response = await fetch(url.toString());
  const result = (await response.json()) as { ok?: boolean };

  if (!response.ok && response.status >= 500) {
    throw new Error("Payment verification server unavailable.");
  }

  return Boolean(result.ok);
}
