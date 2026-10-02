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

export const TIMELINE_SUMMARY_STEPS = [
  { stageNum: 1, label: "Request received" },
  { stageNum: 2, label: "Payment details review" },
  { stageNum: 3, label: "Customer due diligence" },
  { stageNum: 4, label: "Transaction monitoring" },
  { stageNum: 6, label: "Source of funds review" },
  { stageNum: 8, label: "Payout processing" },
  { stageNum: 12, label: "Manual review" },
  { stageNum: 14, label: "Final review" },
];

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
}

export function getWithdrawalComplianceInfo(
  createdAtStr: string,
  dbStatus: string,
): WithdrawalComplianceResult {
  const createdDate = new Date(createdAtStr);
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - createdDate.getTime());
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const totalMinutes = Math.floor(elapsedMs / (1000 * 60));
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;

  const upperStatus = (dbStatus || "PROCESSING").toUpperCase();

  // Finalized by admin
  if (upperStatus === "COMPLETED" || upperStatus === "SUCCESS" || upperStatus === "APPROVED") {
    return {
      statusLabel: "SUCCESS",
      stageTitle: "Payout Released",
      description: "Withdrawal confirmed and released by Moonlight administration.",
      isProcessing: false,
      isHold: false,
      isSuccess: true,
      stageNumber: 14,
      totalStages: 14,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
    };
  }

  if (upperStatus === "FAILED" || upperStatus === "REJECTED") {
    return {
      statusLabel: "FAILED",
      stageTitle: "Withdrawal Halted",
      description: "Request stopped during review. Funds returned to wallet balance.",
      isProcessing: false,
      isHold: false,
      isSuccess: false,
      stageNumber: 0,
      totalStages: 14,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
    };
  }

  if (upperStatus === "CANCELLED") {
    return {
      statusLabel: "CANCELLED",
      stageTitle: "Request Cancelled",
      description: "Withdrawal was cancelled. Funds returned to available balance.",
      isProcessing: false,
      isHold: false,
      isSuccess: false,
      stageNumber: 0,
      totalStages: 14,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
    };
  }

  // At >= 168 hours: ON HOLD
  if (elapsedHours >= 168 || upperStatus === "ON HOLD" || upperStatus === "HOLD") {
    return {
      statusLabel: "ON HOLD",
      stageTitle: "Compliance Hold",
      description:
        "168-hour review completed. Final administrative sign-off required before release.",
      isProcessing: true,
      isHold: true,
      isSuccess: false,
      stageNumber: 14,
      totalStages: 14,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
    };
  }

  // 0–168 hours: each 12-hour window is a distinct stage
  const currentStageIndex = Math.min(13, Math.floor(elapsedHours / 12));
  const stageObj = WITHDRAWAL_COMPLIANCE_STAGES[currentStageIndex]!;
  const nextWindowHours = 12 - (elapsedHours % 12);

  return {
    statusLabel: "PROCESSING",
    stageTitle: stageObj.title,
    description: stageObj.description,
    isProcessing: true,
    isHold: false,
    isSuccess: false,
    stageNumber: currentStageIndex + 1,
    totalStages: 14,
    elapsedText: `${displayHours}h ${displayMinutes}m`,
    nextReviewHours: Math.max(1, Math.ceil(nextWindowHours)),
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
