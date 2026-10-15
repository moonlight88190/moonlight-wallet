/**
 * 7-Day Withdrawal Consolidation & Batching Utility
 *
 * Automatically merges multiple withdrawals submitted by the same customer/beneficiary
 * within a 7-day (168-hour) window into a single unified payout batch.
 *
 * This ensures:
 * 1. The total payment is aggregated into one single amount.
 * 2. A single primary withdrawal ID / reference is used.
 * 3. Customers receive ONE combined email instead of 5-6 separate emails.
 */

export interface WithdrawalRecord {
  id: string;
  user_id?: string;
  wallet_id?: string;
  transaction_id?: string | null;
  amount: number | string;
  currency: string;
  amount_usd?: number | string;
  fee?: number | string;
  fee_usd?: number | string;
  net_amount?: number | string;
  method: string;
  provider?: string | null;
  upi_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  reason?: string | null;
  status: string;
  reference: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ConsolidatedWithdrawalBatch {
  /** Primary identifier (ID of the latest withdrawal in the batch) */
  id: string;
  /** Primary reference (e.g. MLW-ABC123) */
  primaryReference: string;
  /** User or wallet identifier */
  userId: string;
  walletId?: string | undefined;
  beneficiaryName: string;
  email: string;
  upiId?: string | null | undefined;
  method: string;
  provider?: string | null | undefined;
  currency: string;
  /** Summed total gross amount of all withdrawals in the 7-day window */
  totalAmount: number;
  /** Summed total USD amount */
  totalAmountUsd: number;
  /** Summed total fees */
  totalFee: number;
  /** Number of combined withdrawals in this batch (e.g. 5) */
  count: number;
  /** All individual withdrawal records included in this 7-day batch (sorted newest to oldest) */
  withdrawals: WithdrawalRecord[];
  /** Consolidated status (e.g. ON HOLD if any is held, else latest) */
  status: string;
  earliestCreatedAt: string;
  latestCreatedAt: string;
  /** The primary (latest) withdrawal object */
  primaryWithdrawal: WithdrawalRecord;
  /** Custom reason / note */
  reason?: string | null | undefined;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Normalizes user grouping key using user_id, wallet_id, email, or upi_id.
 */
function getUserGroupingKey(w: WithdrawalRecord): string {
  if (w.user_id && w.user_id.trim()) return `user:${w.user_id.trim().toLowerCase()}`;
  if (w.wallet_id && w.wallet_id.trim()) return `wallet:${w.wallet_id.trim().toLowerCase()}`;
  if (w.email && w.email.trim()) return `email:${w.email.trim().toLowerCase()}`;
  if (w.upi_id && w.upi_id.trim()) return `upi:${w.upi_id.trim().toLowerCase()}`;
  return `name:${(w.full_name || "unknown").trim().toLowerCase()}`;
}

/**
 * Consolidates an array of withdrawals into 7-day rolling batches per customer.
 */
export function consolidate7DayWithdrawals(
  withdrawals: WithdrawalRecord[],
): ConsolidatedWithdrawalBatch[] {
  if (!withdrawals || withdrawals.length === 0) return [];

  // Group by customer key
  const groups = new Map<string, WithdrawalRecord[]>();
  for (const w of withdrawals) {
    const key = getUserGroupingKey(w);
    const existing = groups.get(key) || [];
    existing.push(w);
    groups.set(key, existing);
  }

  const batches: ConsolidatedWithdrawalBatch[] = [];

  for (const [, userList] of groups) {
    // Sort newest to oldest
    const sorted = [...userList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // Cluster into 7-day windows
    let currentCluster: WithdrawalRecord[] = [];
    let clusterNewestTime = 0;

    for (const w of sorted) {
      const wTime = new Date(w.created_at).getTime();

      if (currentCluster.length === 0) {
        currentCluster = [w];
        clusterNewestTime = wTime;
      } else {
        // If within 7 days of the cluster's newest withdrawal, merge it
        if (clusterNewestTime - wTime <= SEVEN_DAYS_MS) {
          currentCluster.push(w);
        } else {
          // Push previous cluster and start a new one
          batches.push(createBatchFromCluster(currentCluster));
          currentCluster = [w];
          clusterNewestTime = wTime;
        }
      }
    }

    if (currentCluster.length > 0) {
      batches.push(createBatchFromCluster(currentCluster));
    }
  }

  // Sort batches by latest created_at descending
  return batches.sort(
    (a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime(),
  );
}

function createBatchFromCluster(
  cluster: WithdrawalRecord[],
): ConsolidatedWithdrawalBatch {
  const primary = cluster[0]!; // newest
  const oldest = cluster[cluster.length - 1]!;

  let totalAmount = 0;
  let totalAmountUsd = 0;
  let totalFee = 0;
  let hasHold = false;
  let hasReview = false;
  let hasProcessing = false;
  let hasFailed = false;

  for (const w of cluster) {
    const amt = Number(w.amount) || 0;
    const amtUsd = Number(w.amount_usd) || 0;
    // Apply 10% fee on every transaction in the 7-day batch (not just one)
    const txFee = Math.round(amt * 0.10 * 100) / 100;
    const txFeeUsd = Math.round(amtUsd * 0.10 * 100) / 100;

    w.fee = txFee;
    w.fee_usd = txFeeUsd;
    w.net_amount = Math.round((amt - txFee) * 100) / 100;

    totalAmount += amt;
    totalAmountUsd += amtUsd;
    totalFee += txFee;

    const st = (w.status || "").toUpperCase();
    if (st === "ON HOLD") hasHold = true;
    else if (st === "UNDER REVIEW") hasReview = true;
    else if (st === "PROCESSING") hasProcessing = true;
    else if (st === "FAILED" || st === "CANCELLED") hasFailed = true;
  }

  // Determine consolidated status
  let batchStatus = primary.status;
  if (hasHold) batchStatus = "ON HOLD";
  else if (hasReview) batchStatus = "UNDER REVIEW";
  else if (hasProcessing) batchStatus = "PROCESSING";
  else if (hasFailed) batchStatus = "FAILED";

  return {
    id: primary.id,
    primaryReference: primary.reference,
    userId: primary.user_id || "",
    walletId: primary.wallet_id,
    beneficiaryName: primary.full_name,
    email: primary.email,
    upiId: primary.upi_id,
    method: primary.method,
    provider: primary.provider,
    currency: primary.currency || "INR",
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalAmountUsd: Math.round(totalAmountUsd * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    count: cluster.length,
    withdrawals: cluster,
    status: batchStatus,
    earliestCreatedAt: oldest.created_at,
    latestCreatedAt: primary.created_at,
    primaryWithdrawal: primary,
    reason: primary.reason || cluster.find((c) => !!c.reason)?.reason,
  };
}

/**
 * Finds or calculates the 7-day consolidated batch for a specific withdrawal.
 */
export function find7DayBatchForWithdrawal(
  target: WithdrawalRecord,
  allUserWithdrawals: WithdrawalRecord[],
): ConsolidatedWithdrawalBatch {
  const targetTime = new Date(target.created_at).getTime();

  // Filter withdrawals within 7 days of target
  const related = allUserWithdrawals.filter((w) => {
    const wTime = new Date(w.created_at).getTime();
    return Math.abs(targetTime - wTime) <= SEVEN_DAYS_MS;
  });

  if (related.length <= 1) {
    return createBatchFromCluster([target]);
  }

  // Sort newest first
  related.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return createBatchFromCluster(related);
}
