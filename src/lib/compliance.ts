/**
 * Customer-facing payment processing status and milestone tracking.
 * Provides transparent, calm, standard banking progression.
 */

export interface ComplianceStage {
  stage: number;
  hourMin: number;
  hourMax: number;
  title: string;
  description: string;
}

export const WITHDRAWAL_STATUS_STEPS = [
  { stageNum: 1, id: "received", label: "Request received" },
  { stageNum: 2, id: "processing", label: "Processing" },
  { stageNum: 3, id: "sent", label: "Dispatched" },
  { stageNum: 4, id: "delivered", label: "Estimated arrival" },
];

export const TIMELINE_SUMMARY_STEPS = WITHDRAWAL_STATUS_STEPS;

export interface WithdrawalComplianceResult {
  statusLabel: string;
  stageTitle: string;
  description: string;
  isProcessing: boolean;
  isHold: boolean;
  isSuccess: boolean;
  stageNumber: number;
  totalStages: number;
  elapsedText: string;
  nextReviewHours: number;
  estimatedArrival: string;
}

export function getWithdrawalComplianceInfo(
  createdAtStr: string,
  dbStatus: string,
): WithdrawalComplianceResult {
  const createdDate = new Date(createdAtStr);
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - createdDate.getTime());
  const totalMinutes = Math.floor(elapsedMs / (1000 * 60));
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;

  const upperStatus = (dbStatus || "PROCESSING").toUpperCase();

  // Finalized / Approved / Released
  if (upperStatus === "COMPLETED" || upperStatus === "SUCCESS" || upperStatus === "APPROVED") {
    return {
      statusLabel: "COMPLETED",
      stageTitle: "Withdrawal Completed",
      description: "Funds have been sent to your selected destination account or payment method.",
      isProcessing: false,
      isHold: false,
      isSuccess: true,
      stageNumber: 4,
      totalStages: 4,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
      estimatedArrival: "Delivered",
    };
  }

  // Failed / Rejected
  if (upperStatus === "FAILED" || upperStatus === "REJECTED") {
    return {
      statusLabel: "FAILED",
      stageTitle: "Withdrawal Unsuccessful",
      description:
        "The withdrawal could not be processed. Deducted funds have been returned to your wallet balance.",
      isProcessing: false,
      isHold: false,
      isSuccess: false,
      stageNumber: 0,
      totalStages: 4,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
      estimatedArrival: "Cancelled",
    };
  }

  // Cancelled
  if (upperStatus === "CANCELLED") {
    return {
      statusLabel: "CANCELLED",
      stageTitle: "Withdrawal Cancelled",
      description: "This withdrawal request was cancelled. Funds remain in your available balance.",
      isProcessing: false,
      isHold: false,
      isSuccess: false,
      stageNumber: 0,
      totalStages: 4,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
      estimatedArrival: "Cancelled",
    };
  }

  // Hold / In Review
  if (upperStatus === "ON HOLD" || upperStatus === "HOLD") {
    return {
      statusLabel: "IN REVIEW",
      stageTitle: "Security Review",
      description:
        "Your request is undergoing standard routine security verification before funds are released.",
      isProcessing: true,
      isHold: true,
      isSuccess: false,
      stageNumber: 2,
      totalStages: 4,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 12,
      estimatedArrival: "1–2 business days",
    };
  }

  // Standard In-Flight Processing
  return {
    statusLabel: "PROCESSING",
    stageTitle: "Processing Request",
    description:
      "Your withdrawal request has been received and is being prepared for payout dispatch.",
    isProcessing: true,
    isHold: false,
    isSuccess: false,
    stageNumber: 2,
    totalStages: 4,
    elapsedText: `${displayHours}h ${displayMinutes}m`,
    nextReviewHours: 6,
    estimatedArrival: "1–3 business days",
  };
}

export function groupByPeriod<T extends { created_at: string }>(items: T[]) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startWeek = startToday - 6 * 86400000;
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const groups: { label: string; items: T[] }[] = [
    { label: "Today", items: [] },
    { label: "This week", items: [] },
    { label: "This month", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const t of items) {
    const ts = new Date(t.created_at).getTime();
    const g = ts >= startToday ? 0 : ts >= startWeek ? 1 : ts >= startMonth ? 2 : 3;
    groups[g]!.items.push(t);
  }
  return groups.filter((g) => g.items.length);
}
