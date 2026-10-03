/**
 * Centralized Transaction Route & Rail Resolver.
 *
 * CRITICAL RULE: Currency != Payment Rail.
 * An internal Moonlight-to-Moonlight transfer is ALWAYS an internal Moonlight transfer,
 * regardless of sender/recipient country or currency (INR, EUR, USD, GBP, etc.).
 * External rails (UPI, Indian Bank IMPS, SEPA, etc.) are only resolved for external payouts
 * or when explicitly designated by the transaction route context.
 */

export type TransactionRouteId =
  | "moonlight"
  | "upi"
  | "in-bank"
  | "sepa"
  | "faster-payments"
  | "gcash"
  | "pix"
  | "gift-card"
  | "admin";

export interface ResolvedRoute {
  id: TransactionRouteId;
  type: "internal" | "external" | "gift" | "system";
  name: string;
  badge: string;
  brandAssetId: string;
  providerId?: string;
  providerName?: string;
  destinationMask?: string | undefined;
  terminology: {
    transactionType: string;
    flowTitle: string;
    statusProcessing: string;
    statusCompleted: string;
    routeDescription: string;
  };
}

export interface RouteResolutionParams {
  route?: string | null;
  kind?: string | null;
  method?: string | null;
  provider?: string | null;
  upiId?: string | null;
  recipientCode?: string | null;
  recipientName?: string | null;
}

export function resolveTransactionRoute(params: RouteResolutionParams): ResolvedRoute {
  const kind = (params.kind || "").toLowerCase().trim();
  const route = (params.route || "").toLowerCase().trim();
  const method = (params.method || "").toLowerCase().trim();
  const provider = (params.provider || "").toLowerCase().trim();
  const upiId = (params.upiId || "").toLowerCase().trim();

  // 1. ADMIN ACTIONS / BALANCE ADJUSTMENTS
  if (kind === "admin_credit" || method.includes("admin") || route === "admin") {
    return {
      id: "admin",
      type: "system",
      name: "Account Adjustment",
      badge: "Credit",
      brandAssetId: "moonlight",
      terminology: {
        transactionType: "Account Adjustment",
        flowTitle: "Balance Adjustment",
        statusProcessing: "Updating balance",
        statusCompleted: "Balance updated",
        routeDescription: "Moonlight Administrative Credit",
      },
    };
  }

  // 2. GIFT CARDS & VOUCHERS
  if (
    kind === "gift_card" ||
    kind === "redemption" ||
    route === "gift-card" ||
    method.includes("voucher") ||
    method.includes("gift")
  ) {
    return {
      id: "gift-card",
      type: "gift",
      name: "Digital Voucher",
      badge: "Voucher",
      brandAssetId: "gift-card",
      providerName: params.provider || "Digital Voucher",
      terminology: {
        transactionType: "Voucher Redemption",
        flowTitle: "Digital Voucher",
        statusProcessing: "Issuing voucher",
        statusCompleted: "Voucher issued",
        routeDescription: "Digital Voucher Redemption",
      },
    };
  }

  // 3. INTERNAL MOONLIGHT TRANSFERS
  // If kind is 'transfer' OR route is 'moonlight' OR method explicitly designates internal transfer
  // This is ALWAYS Moonlight. Currency (INR, EUR, USD, etc.) NEVER alters this.
  const isInternal =
    route === "moonlight" ||
    kind === "transfer" ||
    method === "moonlight transfer" ||
    method === "internal transfer" ||
    (!route &&
      kind !== "withdrawal" &&
      !upiId &&
      !method.includes("bank") &&
      !method.includes("upi") &&
      !method.includes("sepa"));

  if (isInternal && kind !== "withdrawal") {
    return {
      id: "moonlight",
      type: "internal",
      name: "Moonlight Transfer",
      badge: "Instant",
      brandAssetId: "moonlight",
      terminology: {
        transactionType: "Internal Transfer",
        flowTitle: "Moonlight Wallet Transfer",
        statusProcessing: "Updating wallet ledger",
        statusCompleted: "Transfer complete",
        routeDescription: "Moonlight Peer-to-Peer Transfer",
      },
    };
  }

  // 4. EXTERNAL WITHDRAWAL / PAYOUT RAILS
  // A. UPI External Payout
  if (route === "upi" || method.includes("upi") || upiId.length > 0) {
    let resolvedUpiProvider = "upi";
    let providerLabel = "UPI Payout";

    if (
      upiId.includes("@upi") ||
      upiId.includes("@bhim") ||
      upiId.includes("@npci") ||
      provider.includes("bhim") ||
      method.includes("bhim")
    ) {
      resolvedUpiProvider = "bhim";
      providerLabel = "BHIM UPI";
    } else if (
      provider.includes("google") ||
      upiId.includes("@ok") ||
      upiId.includes("@gpay") ||
      method.includes("google")
    ) {
      resolvedUpiProvider = "google-pay";
      providerLabel = "Google Pay";
    } else if (
      provider.includes("phonepe") ||
      upiId.includes("@ybl") ||
      upiId.includes("@ibl") ||
      upiId.includes("@axl") ||
      method.includes("phonepe")
    ) {
      resolvedUpiProvider = "phonepe";
      providerLabel = "PhonePe";
    } else if (
      provider.includes("paytm") ||
      upiId.includes("@paytm") ||
      method.includes("paytm")
    ) {
      resolvedUpiProvider = "paytm";
      providerLabel = "Paytm";
    } else if (
      provider.includes("amazon") ||
      upiId.includes("@apl") ||
      upiId.includes("@amazon") ||
      method.includes("amazon")
    ) {
      resolvedUpiProvider = "amazon-pay";
      providerLabel = "Amazon Pay";
    }

    return {
      id: "upi",
      type: "external",
      name: "UPI",
      badge: "Instant",
      brandAssetId: resolvedUpiProvider,
      providerId: resolvedUpiProvider,
      providerName: providerLabel,
      destinationMask: params.upiId || undefined,
      terminology: {
        transactionType: "UPI Payout",
        flowTitle: `UPI Payout via ${providerLabel}`,
        statusProcessing: "Reviewing payout details",
        statusCompleted: "Withdrawal request recorded",
        routeDescription: "Unified Payments Interface (UPI)",
      },
    };
  }

  // B. Indian Bank IMPS/NEFT
  if (
    route === "in-bank" ||
    method.includes("indian bank") ||
    method.includes("imps") ||
    method.includes("neft")
  ) {
    let bankAsset = "in-bank";
    let bankName = "Indian Bank Transfer";

    if (provider.includes("hdfc") || method.includes("hdfc")) {
      bankAsset = "hdfc-bank";
      bankName = "HDFC Bank";
    } else if (
      provider.includes("sbi") ||
      method.includes("sbi") ||
      provider.includes("state bank")
    ) {
      bankAsset = "sbi";
      bankName = "State Bank of India";
    } else if (provider.includes("icici") || method.includes("icici")) {
      bankAsset = "icici-bank";
      bankName = "ICICI Bank";
    } else if (provider.includes("axis") || method.includes("axis")) {
      bankAsset = "axis-bank";
      bankName = "Axis Bank";
    } else if (provider.includes("yes") || method.includes("yes bank")) {
      bankAsset = "yes-bank";
      bankName = "YES BANK";
    }

    return {
      id: "in-bank",
      type: "external",
      name: "Indian Bank",
      badge: "IMPS",
      brandAssetId: bankAsset,
      providerId: bankAsset,
      providerName: bankName,
      terminology: {
        transactionType: "Bank Withdrawal",
        flowTitle: `${bankName} Payout`,
        statusProcessing: "Reviewing beneficiary parameters",
        statusCompleted: "Withdrawal request recorded",
        routeDescription: "IMPS / Direct Indian Banking Rail",
      },
    };
  }

  // C. SEPA Instant
  if (route === "sepa" || method.includes("sepa")) {
    return {
      id: "sepa",
      type: "external",
      name: "SEPA Instant",
      badge: "EUR",
      brandAssetId: "sepa",
      providerName: "SEPA Network",
      terminology: {
        transactionType: "SEPA Transfer",
        flowTitle: "SEPA Payout",
        statusProcessing: "Processing SEPA transfer",
        statusCompleted: "Withdrawal request recorded",
        routeDescription: "Single Euro Payments Area (SEPA)",
      },
    };
  }

  // D. UK Faster Payments
  if (route === "faster-payments" || method.includes("faster") || method.includes("fps")) {
    return {
      id: "faster-payments",
      type: "external",
      name: "Faster Payments",
      badge: "GBP",
      brandAssetId: "faster-payments",
      providerName: "UK Faster Payments",
      terminology: {
        transactionType: "UK Bank Transfer",
        flowTitle: "Faster Payments Payout",
        statusProcessing: "Processing Faster Payments",
        statusCompleted: "Withdrawal request recorded",
        routeDescription: "UK Faster Payments Scheme",
      },
    };
  }

  // E. GCash
  if (route === "gcash" || method.includes("gcash")) {
    return {
      id: "gcash",
      type: "external",
      name: "GCash",
      badge: "PHP",
      brandAssetId: "gcash",
      providerName: "GCash Wallet",
      terminology: {
        transactionType: "GCash Payout",
        flowTitle: "GCash Mobile Wallet",
        statusProcessing: "Processing GCash payout",
        statusCompleted: "Withdrawal request recorded",
        routeDescription: "GCash Mobile Wallet",
      },
    };
  }

  // F. Pix
  if (route === "pix" || method.includes("pix")) {
    return {
      id: "pix",
      type: "external",
      name: "Pix Instant",
      badge: "BRL",
      brandAssetId: "pix",
      providerName: "Pix Central Bank Rail",
      terminology: {
        transactionType: "Pix Transfer",
        flowTitle: "Pix Instant Payout",
        statusProcessing: "Processing Pix payment",
        statusCompleted: "Withdrawal request recorded",
        routeDescription: "Banco Central do Brasil Pix",
      },
    };
  }

  // Default fallback: Moonlight Internal
  return {
    id: "moonlight",
    type: "internal",
    name: "Moonlight Transfer",
    badge: "Internal",
    brandAssetId: "moonlight",
    terminology: {
      transactionType: "Internal Transfer",
      flowTitle: "Moonlight Wallet Transfer",
      statusProcessing: "Processing transaction",
      statusCompleted: "Completed",
      routeDescription: "Moonlight Internal Ledger",
    },
  };
}
