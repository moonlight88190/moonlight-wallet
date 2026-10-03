/**
 * AML / FATF compliant terminology and 14-stage 168-hour timeline logic for Moonlight Wallet payouts.
 * Reference: FATF 40 Recommendations & EU AML/CFT directives.
 */

export interface ComplianceStage {
  stage: number;
  hourMin: number;
  hourMax: number;
  title: string;
  description: string;
}

export const WITHDRAWAL_COMPLIANCE_STAGES: ComplianceStage[] = [
  {
    stage: 1,
    hourMin: 0,
    hourMax: 12,
    title: "Payment Details Review",
    description: "Verifying withdrawal request parameters and payout destination format.",
  },
  {
    stage: 2,
    hourMin: 12,
    hourMax: 24,
    title: "Customer Due Diligence",
    description: "Standard identity verification and customer due diligence check.",
  },
  {
    stage: 3,
    hourMin: 24,
    hourMax: 36,
    title: "Beneficiary Verification",
    description: "Validating recipient account details, routing data and account status.",
  },
  {
    stage: 4,
    hourMin: 36,
    hourMax: 48,
    title: "Transaction Monitoring",
    description: "Screening transaction patterns against risk and fraud guidelines.",
  },
  {
    stage: 5,
    hourMin: 48,
    hourMax: 60,
    title: "Source of Funds Review",
    description: "Internal balance audit and source of funds assessment.",
  },
  {
    stage: 6,
    hourMin: 60,
    hourMax: 72,
    title: "Risk Assessment",
    description: "Compliance risk review for outbound transaction allocation.",
  },
  {
    stage: 7,
    hourMin: 72,
    hourMax: 84,
    title: "Cross-Border Processing",
    description: "Currency conversion verification and corridor fee validation.",
  },
  {
    stage: 8,
    hourMin: 84,
    hourMax: 96,
    title: "Payout Processing",
    description: "Confirming outbound channel readiness and settlement preparation.",
  },
  {
    stage: 9,
    hourMin: 96,
    hourMax: 108,
    title: "Enhanced Due Diligence",
    description: "Secondary risk review and periodic transaction audit.",
  },
  {
    stage: 10,
    hourMin: 108,
    hourMax: 120,
    title: "Compliance Review",
    description: "Balance verification and settlement queue indexing.",
  },
  {
    stage: 11,
    hourMin: 120,
    hourMax: 132,
    title: "Payout Queue",
    description: "Queued for disbursement authorization.",
  },
  {
    stage: 12,
    hourMin: 132,
    hourMax: 144,
    title: "Manual Review",
    description: "Administrative review and compliance checklist verification.",
  },
  {
    stage: 13,
    hourMin: 144,
    hourMax: 156,
    title: "Final Review",
    description: "Pre-release audit and beneficiary confirmation.",
  },
  {
    stage: 14,
    hourMin: 156,
    hourMax: 168,
    title: "Hold Window",
    description: "Final review stage prior to administrative release.",
  },
];

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let count = 0;
  while (count < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  return result;
}

export function formatEstimatedArrival(createdAtStr: string): {
  rangeText: string;
  expectedDateText: string;
  daysText: string;
} {
  const createdDate = new Date(createdAtStr);
  const minDate = addBusinessDays(createdDate, 5);
  const maxDate = addBusinessDays(createdDate, 7);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const minMonth = monthNames[minDate.getMonth()];
  const maxMonth = monthNames[maxDate.getMonth()];
  const minDay = minDate.getDate();
  const maxDay = maxDate.getDate();
  const year = maxDate.getFullYear();

  const rangeText =
    minMonth === maxMonth
      ? `${minMonth} ${minDay} – ${maxDay}, ${year}`
      : `${minMonth} ${minDay} – ${maxMonth} ${maxDay}, ${year}`;

  return {
    rangeText,
    expectedDateText: `Expected by ${maxMonth} ${maxDay}, ${year}`,
    daysText: "5–7 business days",
  };
}

export const TIMELINE_SUMMARY_STEPS = [
  { stepNum: 1, label: "Request submitted & verified", timeWindow: "Day 1" },
  { stepNum: 2, label: "Interbank clearance & transmission", timeWindow: "Days 2–3" },
  { stepNum: 3, label: "Beneficiary bank processing", timeWindow: "Days 4–5" },
  { stepNum: 4, label: "Final settlement & credited", timeWindow: "Days 5–7" },
];

export interface WithdrawalComplianceResult {
  statusLabel: string;
  stageTitle: string;
  description: string;
  currentStep: string;
  currentStepDescription: string;
  nextStep: string;
  nextStepDescription: string;
  estimatedArrivalDate: string;
  estimatedDaysText: string;
  progressPercent: number;
  isProcessing: boolean;
  isHold: boolean;
  isSuccess: boolean;
  isFailed: boolean;
  stageNumber: number;
  totalStages: number;
  elapsedText: string;
  nextReviewHours: number;
}

export function getWithdrawalComplianceInfo(
  createdAtStr: string,
  dbStatus: string,
  options?: { isUPI?: boolean; method?: string; route?: string },
): WithdrawalComplianceResult {
  const createdDate = new Date(createdAtStr);
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - createdDate.getTime());
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const totalMinutes = Math.floor(elapsedMs / (1000 * 60));
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;
  const elapsedText = `${displayHours}h ${displayMinutes}m`;

  const arrival = formatEstimatedArrival(createdAtStr);
  const upperStatus = (dbStatus || "PROCESSING").toUpperCase();

  const isUPI =
    Boolean(options?.isUPI) ||
    options?.method?.toLowerCase().includes("upi") ||
    options?.route?.toLowerCase() === "upi";

  // UPI Instant Settlement handling
  if (isUPI && upperStatus !== "FAILED" && upperStatus !== "REJECTED" && upperStatus !== "CANCELLED") {
    const isSettled = upperStatus === "COMPLETED" || upperStatus === "SUCCESS" || upperStatus === "APPROVED";
    return {
      statusLabel: isSettled ? "SUCCESS" : "INSTANT CLEARING",
      stageTitle: "Instant Secure Settlement",
      description: "Dispatched via NPCI IMPS direct settlement rails with 256-bit bank encryption.",
      currentStep: isSettled ? "Settled & Credited" : "Real-Time Interbank IMPS Clearing",
      currentStepDescription: isSettled
        ? "Funds have been verified and deposited directly into your UPI linked bank account."
        : "Immediate clearance switch handshake with beneficiary bank. Zero multi-day hold.",
      nextStep: isSettled ? "Transfer Completed" : "Immediate Account Credit",
      nextStepDescription: isSettled ? "Instant settlement cycle completed." : "Recipient bank is acknowledging instant credit.",
      estimatedArrivalDate: "Instant (Immediate)",
      estimatedDaysText: "Instant • Secure Withdrawal",
      progressPercent: isSettled ? 100 : 92,
      isProcessing: !isSettled,
      isHold: false,
      isSuccess: isSettled,
      isFailed: false,
      stageNumber: 4,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  // Finalized by admin
  if (upperStatus === "COMPLETED" || upperStatus === "SUCCESS" || upperStatus === "APPROVED") {
    return {
      statusLabel: "SUCCESS",
      stageTitle: "Payout Settled",
      description: "Withdrawal confirmed and funds dispatched to recipient account.",
      currentStep: "Dispatched & Credited",
      currentStepDescription: "Funds have been successfully dispatched and credited to the beneficiary account.",
      nextStep: "Transfer Completed",
      nextStepDescription: "The withdrawal has arrived at the receiving destination.",
      estimatedArrivalDate: "Completed",
      estimatedDaysText: "Settled",
      progressPercent: 100,
      isProcessing: false,
      isHold: false,
      isSuccess: true,
      isFailed: false,
      stageNumber: 4,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  if (upperStatus === "FAILED" || upperStatus === "REJECTED") {
    return {
      statusLabel: "FAILED",
      stageTitle: "Withdrawal Cancelled",
      description: "Request stopped during review. Full funds returned to your Moonlight balance.",
      currentStep: "Transfer Cancelled",
      currentStepDescription: "Withdrawal halted. Amount has been restored to your available wallet balance.",
      nextStep: "None",
      nextStepDescription: "No further processing action required.",
      estimatedArrivalDate: "Cancelled",
      estimatedDaysText: "Refunded to Wallet",
      progressPercent: 0,
      isProcessing: false,
      isHold: false,
      isSuccess: false,
      isFailed: true,
      stageNumber: 0,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  if (upperStatus === "CANCELLED") {
    return {
      statusLabel: "CANCELLED",
      stageTitle: "Request Cancelled",
      description: "Withdrawal was cancelled. Funds returned to your available balance.",
      currentStep: "Request Cancelled",
      currentStepDescription: "Request was cancelled. Funds returned to your Moonlight Wallet balance.",
      nextStep: "None",
      nextStepDescription: "No further action required.",
      estimatedArrivalDate: "Cancelled",
      estimatedDaysText: "Refunded to Wallet",
      progressPercent: 0,
      isProcessing: false,
      isHold: false,
      isSuccess: false,
      isFailed: true,
      stageNumber: 0,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  // At >= 168 hours or explicit HOLD:
  if (elapsedHours >= 168 || upperStatus === "ON HOLD" || upperStatus === "HOLD") {
    return {
      statusLabel: "ON HOLD",
      stageTitle: "Compliance Hold",
      description:
        "168-hour review completed. Final administrative sign-off required before release.",
      currentStep: "Settlement Clearance Review",
      currentStepDescription:
        "Periodic clearing review in progress. Delivery remains expected within 5–7 business days.",
      nextStep: "Administrative Clearance Release",
      nextStepDescription: "Final sign-off prior to outward rail dispatch.",
      estimatedArrivalDate: arrival.rangeText,
      estimatedDaysText: arrival.daysText,
      progressPercent: 65,
      isProcessing: true,
      isHold: true,
      isSuccess: false,
      isFailed: false,
      stageNumber: 3,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  // Active Processing 0–168 hours across standard 5–7 business days milestones:
  if (elapsedHours < 24) {
    // Day 1: Verification & Authorization
    const nextWindow = Math.max(1, Math.ceil(24 - elapsedHours));
    return {
      statusLabel: "PROCESSING",
      stageTitle: "Payment Details Review",
      description: "Verifying withdrawal request parameters and payout destination format.",
      currentStep: "Payment Verification & Authorization",
      currentStepDescription:
        "Withdrawal request authorized and queued for domestic clearing transmission.",
      nextStep: "Interbank Rail Transmission",
      nextStepDescription: "Dispatch to the national payment clearance network.",
      estimatedArrivalDate: arrival.rangeText,
      estimatedDaysText: arrival.daysText,
      progressPercent: 25,
      isProcessing: true,
      isHold: false,
      isSuccess: false,
      isFailed: false,
      stageNumber: 1,
      totalStages: 4,
      elapsedText,
      nextReviewHours: nextWindow,
    };
  }

  if (elapsedHours < 72) {
    // Days 2–3: Interbank Rail Clearance
    const nextWindow = Math.max(1, Math.ceil(72 - elapsedHours));
    return {
      statusLabel: "PROCESSING",
      stageTitle: "Interbank Clearance",
      description: "Routing through domestic banking clearance network.",
      currentStep: "Interbank Clearance & Routing",
      currentStepDescription:
        "Transaction is in transit through the domestic payment clearing house to the beneficiary bank.",
      nextStep: "Beneficiary Bank Inward Verification",
      nextStepDescription: "Recipient bank verifying destination account credentials.",
      estimatedArrivalDate: arrival.rangeText,
      estimatedDaysText: arrival.daysText,
      progressPercent: 50,
      isProcessing: true,
      isHold: false,
      isSuccess: false,
      isFailed: false,
      stageNumber: 2,
      totalStages: 4,
      elapsedText,
      nextReviewHours: nextWindow,
    };
  }

  if (elapsedHours < 120) {
    // Days 4–5: Beneficiary Bank Processing
    const nextWindow = Math.max(1, Math.ceil(120 - elapsedHours));
    return {
      statusLabel: "PROCESSING",
      stageTitle: "Beneficiary Bank Processing",
      description: "Transferred to recipient banking institution for inward ledger allocation.",
      currentStep: "Beneficiary Bank Processing",
      currentStepDescription:
        "Funds received by destination institution. Awaiting inward ledger allocation.",
      nextStep: "Account Statement Posting",
      nextStepDescription: "Final account balance credit by beneficiary institution.",
      estimatedArrivalDate: arrival.rangeText,
      estimatedDaysText: arrival.daysText,
      progressPercent: 75,
      isProcessing: true,
      isHold: false,
      isSuccess: false,
      isFailed: false,
      stageNumber: 3,
      totalStages: 4,
      elapsedText,
      nextReviewHours: nextWindow,
    };
  }

  // Days 6–7: Final Settlement & Credit
  const nextWindow = Math.max(1, Math.ceil(168 - elapsedHours));
  return {
    statusLabel: "PROCESSING",
    stageTitle: "Final Settlement",
    description: "Final review stage prior to administrative release.",
    currentStep: "Final Settlement & Credit",
    currentStepDescription:
      "Final clearing window. Transaction being posted to recipient statement.",
    nextStep: "Funds Available in Account",
    nextStepDescription: "Transfer completed and available in beneficiary account.",
    estimatedArrivalDate: arrival.rangeText,
    estimatedDaysText: arrival.daysText,
    progressPercent: 90,
    isProcessing: true,
    isHold: false,
    isSuccess: false,
    isFailed: false,
    stageNumber: 4,
    totalStages: 4,
    elapsedText,
    nextReviewHours: nextWindow,
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
