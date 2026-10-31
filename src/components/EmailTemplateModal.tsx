import { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Copy,
  Check,
  Eye,
  Code,
  ShieldAlert,
  KeyRound,
  XCircle,
  X,
  ExternalLink,
  Sparkles,
  Info,
  ChevronDown,
  SlidersHorizontal,
  Globe,
  Building2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { consolidate30DayWithdrawals, consolidate7DayWithdrawals } from "@/lib/withdrawal-consolidation";
import { UPI_LOGO_URL as UPI_CDN_URL } from "@/lib/upi-logo-data";

export const LOGO_URL =
  "https://b17cedb7-4b7b-485c-807a-ccc6dd6383b9.lovableproject.com/__l5e/assets-v1/17db28e8-0752-4d7d-b01c-7f7f7fa7fdaa/moonlight-logo.png";
export const UPI_LOGO_URL = UPI_CDN_URL;
export const COMPLIANCE_EMAIL = "moonlightwealthmanagement@gmail.com";

export type EmailTemplateType =
  | "kyc_hold"
  | "kyc_approved_key"
  | "key_sent_instruction"
  | "kyc_rejected"
  | "key_verification_started"
  | "all_success"
  | "transaction_sent_to_bank"
  | "first_transfer_clearance";

export interface ItemizedWithdrawalEntry {
  reference: string;
  amount: number | string;
  currency?: string;
  date?: string;
  status?: string;
}

export interface EmailContextData {
  type?: EmailTemplateType | undefined;
  recipientName?: string | undefined;
  name?: string | undefined;
  full_name?: string | undefined;
  beneficiaryName?: string | undefined;
  beneficiary_name?: string | undefined;
  recipient_name?: string | undefined;
  senderName?: string | undefined;
  sender_name?: string | undefined;
  amount?: string | number | undefined;
  totalAmount?: string | number | undefined;
  total_amount?: string | number | undefined;
  amount_usd?: string | number | undefined;
  currency?: string | undefined;
  method?: string | undefined;
  destination?: string | undefined;
  upiId?: string | null | undefined;
  upi_id?: string | null | undefined;
  account_number?: string | null | undefined;
  recipient_wallet_code?: string | null | undefined;
  status?: string | undefined;
  reference?: string | undefined;
  primaryReference?: string | undefined;
  primary_reference?: string | undefined;
  id?: string | undefined;
  tx_id?: string | undefined;
  date?: string | undefined;
  created_at?: string | undefined;
  batchCount?: number | undefined;
  count?: number | undefined;
  recipientEmail?: string | undefined;
  email?: string | undefined;
  recipientPhone?: string | undefined;
  phone?: string | undefined;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[] | undefined;
  withdrawals?: any[] | undefined;
}

export function resolveEmailContextData(raw?: EmailContextData | Record<string, any> | null) {
  if (!raw) {
    return {
      type: "transaction_sent_to_bank" as EmailTemplateType,
      recipientName: "Valued Customer",
      senderName: "Brooklyn",
      amount: "50,000.00",
      currency: "INR",
      method: "Unified Payments Interface (UPI)",
      destination: "customer@okhdfcbank",
      reference: "MLW-9842-1083",
      date: new Date().toLocaleString(),
      status: "SUCCESSFUL",
      recipientEmail: "customer@gmail.com",
      recipientPhone: "+91 98765 43210",
      batchCount: 1,
      itemizedWithdrawals: [] as ItemizedWithdrawalEntry[],
    };
  }

  const statusUpper = String(raw.status || "").toUpperCase();
  let resolvedType: EmailTemplateType = "transaction_sent_to_bank";

  if (raw.type) {
    resolvedType = raw.type;
  } else if (
    statusUpper === "SUCCESSFUL" ||
    statusUpper === "SETTLED" ||
    statusUpper === "COMPLETED" ||
    statusUpper === "APPROVED" ||
    statusUpper === "DONE"
  ) {
    resolvedType = "transaction_sent_to_bank";
  } else if (
    statusUpper === "ON HOLD" ||
    statusUpper === "HOLD" ||
    statusUpper === "KYC HOLD" ||
    statusUpper === "KYC REQUIRED"
  ) {
    resolvedType = "kyc_hold";
  } else if (
    statusUpper === "UNDER REVIEW" ||
    statusUpper === "KEY NEEDED" ||
    statusUpper === "KEY HOLD" ||
    statusUpper === "KEY REQUIRED"
  ) {
    resolvedType = "kyc_approved_key";
  } else if (statusUpper === "REJECTED" || statusUpper === "FAILED") {
    resolvedType = "kyc_rejected";
  } else if (statusUpper === "PROCESSING") {
    resolvedType = "transaction_sent_to_bank";
  }

  const name =
    raw.recipientName ||
    raw.beneficiaryName ||
    raw.beneficiary_name ||
    raw.full_name ||
    raw.name ||
    raw.recipient_name ||
    (raw.email && !raw.email.includes("@") ? raw.email : undefined) ||
    "Valued Customer";

  const rawAmt =
    raw.amount !== undefined && raw.amount !== null
      ? raw.amount
      : raw.totalAmount !== undefined && raw.totalAmount !== null
        ? raw.totalAmount
        : raw.total_amount;

  let amt = "50,000.00";
  if (rawAmt !== undefined && rawAmt !== null && rawAmt !== "") {
    if (typeof rawAmt === "number") {
      amt = rawAmt.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else {
      amt = String(rawAmt);
    }
  }

  const curr = String(raw.currency || "INR").toUpperCase();

  const ref =
    raw.reference ||
    raw.primaryReference ||
    raw.primary_reference ||
    (raw.id && String(raw.id).length > 20 ? `MLW-${String(raw.id).slice(0, 8).toUpperCase()}` : raw.id) ||
    "MLW-9842-1083";

  const dest =
    raw.destination ||
    raw.upiId ||
    raw.upi_id ||
    raw.account_number ||
    raw.recipient_wallet_code ||
    (raw.email && raw.email.includes("@okhdfcbank") ? raw.email : undefined) ||
    raw.email ||
    "customer@okhdfcbank";

  const meth =
    raw.method ||
    (dest.includes("@") || curr === "INR"
      ? "Unified Payments Interface (UPI)"
      : "Direct Bank Transfer");

  const mail = raw.recipientEmail || raw.email || "customer@gmail.com";
  const phone =
    raw.recipientPhone ||
    raw.phone ||
    raw.withdrawals?.[0]?.phone ||
    "+91 98765 43210";
  const sender = raw.senderName || raw.sender_name || "Brooklyn";
  const count =
    raw.batchCount !== undefined
      ? raw.batchCount
      : raw.count !== undefined
        ? raw.count
        : Array.isArray(raw.withdrawals)
          ? raw.withdrawals.length
          : 1;

  let itemized: ItemizedWithdrawalEntry[] = [];
  if (Array.isArray(raw.itemizedWithdrawals) && raw.itemizedWithdrawals.length > 0) {
    itemized = raw.itemizedWithdrawals;
  } else if (Array.isArray(raw.withdrawals) && raw.withdrawals.length > 0) {
    itemized = raw.withdrawals.map((w: any) => ({
      reference: w.reference || w.id,
      amount: w.amount,
      currency: w.currency || curr,
      date: new Date(w.created_at || Date.now()).toLocaleString(),
      status: w.status,
    }));
  }

  const dt =
    raw.date ||
    (raw.created_at
      ? new Date(raw.created_at).toLocaleString()
      : new Date().toLocaleString());

  return {
    type: resolvedType,
    recipientName: name,
    senderName: sender,
    amount: amt,
    currency: curr,
    method: meth,
    destination: dest,
    reference: ref,
    date: dt,
    status: statusUpper || "SETTLED",
    recipientEmail: mail,
    recipientPhone: phone,
    batchCount: count,
    itemizedWithdrawals: itemized,
  };
}

function buildItemizedTableHtml(
  itemizedWithdrawals?: ItemizedWithdrawalEntry[],
  totalAmount?: string,
  currency?: string,
): string {
  if (!itemizedWithdrawals || itemizedWithdrawals.length <= 1) return "";

  const totalNum = parseFloat(String(totalAmount || "0").replace(/,/g, "")) || 0;
  const totalFeeNum = Math.round(totalNum * 0.10 * 100) / 100;
  const totalNetNum = Math.round((totalNum - totalFeeNum) * 100) / 100;
  const curr = currency || "INR";

  return `
            <!-- Consolidated 30-Day Settlements Itemized Table with 10% Fee per Transaction -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;border:1px solid #283048;border-radius:12px;overflow:hidden;background:#0d101a;">
              <thead>
                <tr style="background:#181d2e;border-bottom:1px solid #283048;">
                  <th colspan="4" style="padding:10px 14px;text-align:left;font-size:11px;color:#cbd5e1;text-transform:uppercase;letter-spacing:1px;">
                    ⚡ 30-Day Combined Payout Breakdown (${itemizedWithdrawals.length} Withdrawals · 10% Fee Deducted per Transaction)
                  </th>
                </tr>
                <tr style="border-bottom:1px solid #20273c;font-size:10px;color:#94a3b8;text-transform:uppercase;background:#101422;">
                  <th style="padding:8px 12px;text-align:left;">Reference ID</th>
                  <th style="padding:8px 12px;text-align:right;">Requested</th>
                  <th style="padding:8px 12px;text-align:right;">10% Fee</th>
                  <th style="padding:8px 12px;text-align:right;">Net Payout</th>
                </tr>
              </thead>
              <tbody>
                ${itemizedWithdrawals
                  .map((item, idx) => {
                    const amt = parseFloat(String(item.amount || "0").replace(/,/g, "")) || 0;
                    const fee = Math.round(amt * 0.10 * 100) / 100;
                    const net = Math.round((amt - fee) * 100) / 100;
                    return `
                  <tr style="border-bottom:1px solid #1a2033;background:${idx % 2 === 0 ? "#0f1322" : "#131728"};font-size:11px;">
                    <td style="padding:8px 12px;font-family:'IBM Plex Mono',monospace;color:#fbbf24;font-weight:600;">${item.reference}</td>
                    <td style="padding:8px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#f8fafc;">${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.currency || curr}</td>
                    <td style="padding:8px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#f87171;">-${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="padding:8px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#34d399;font-weight:700;">${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                `;
                  })
                  .join("")}
                <tr style="background:#141826;border-top:1px solid #283048;font-size:11px;">
                  <td colspan="2" style="padding:8px 12px;color:#94a3b8;">Total Requested (${itemizedWithdrawals.length} Payouts Combined):</td>
                  <td colspan="2" style="padding:8px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#f8fafc;font-weight:700;">${totalNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}</td>
                </tr>
                <tr style="background:#141826;font-size:11px;">
                  <td colspan="2" style="padding:8px 12px;color:#f87171;">Combined 10% Fee (10% on every transaction):</td>
                  <td colspan="2" style="padding:8px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#f87171;font-weight:700;">-${totalFeeNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}</td>
                </tr>
                <tr style="background:#1c2339;font-size:12px;font-weight:700;">
                  <td colspan="2" style="padding:10px 12px;color:#34d399;">Total Net Settlement Dispatched:</td>
                  <td colspan="2" style="padding:10px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#34d399;">${totalNetNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}</td>
                </tr>
              </tbody>
            </table>`;
}

// ─────────────────────────────────────────────
// EMAIL SUBJECT LINES
// ─────────────────────────────────────────────

export function getKycEmailSubject(
  type: EmailTemplateType,
  reference: string,
  amount?: string,
  currency?: string,
): string {
  switch (type) {
    case "kyc_hold":
      return `Action Required: Identity Verification Needed — Payout Ref: ${reference}`;
    case "kyc_approved_key":
      return `KYC Approved — Final Security Step to Release Your Payout (${amount || ""} ${currency || ""}) — Ref: ${reference}`;
    case "key_sent_instruction":
      return `Key Sent · Enter Keys on Website & Withdrawal Tab — Ref: ${reference} (${amount || ""} ${currency || ""})`;
    case "kyc_rejected":
      return `Re-submit Verification Documents — Payout Ref: ${reference}`;
    case "key_verification_started":
      return `Key Verification In Progress — Payout Ref: ${reference} (${amount || ""} ${currency || ""})`;
    case "all_success":
      return `Payout Approved & Dispatched — ${amount || ""} ${currency || ""} — Ref: ${reference}`;
    case "transaction_sent_to_bank":
      return `Moonlight Process Complete: Funds Transmitted to Your Bank for Review — Ref: ${reference} (${amount || ""} ${currency || ""})`;
    case "first_transfer_clearance":
      return `First International Transfer & Withdrawal: Final Clearance Notice (5–7 Days) — Ref: ${reference}`;
    default:
      return `Moonlight Financial — Action Required — Ref: ${reference}`;
  }
}

// ─────────────────────────────────────────────
// SHARED MOBILE-FIRST RESPONSIVE CSS BLOCK
// ─────────────────────────────────────────────

const MOBILE_EMAIL_STYLES = `
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-wrapper { padding: 12px 6px !important; }
      .email-card { border-radius: 14px !important; width: 100% !important; max-width: 100% !important; }
      .email-header { padding: 18px 16px !important; }
      .email-body { padding: 20px 14px !important; }
      .email-footer { padding: 18px 14px !important; }
      .email-logo { width: 100px !important; }
      .email-amount { font-size: 26px !important; }
      .email-amount-sub { font-size: 15px !important; }
      .email-table-cell { display: block !important; width: 100% !important; padding: 8px 12px !important; }
      .email-action-btn { padding: 12px 18px !important; font-size: 13px !important; }
      .email-mobile-stack { display: block !important; width: 100% !important; margin-bottom: 8px !important; }
    }
    @media only screen and (max-width: 390px) {
      .email-wrapper { padding: 8px 2px !important; }
      .email-header { padding: 14px 12px !important; }
      .email-body { padding: 16px 10px !important; }
      .email-amount { font-size: 22px !important; }
      .email-amount-sub { font-size: 14px !important; }
      .email-footer { padding: 14px 10px !important; }
    }
  </style>
`;

// ─────────────────────────────────────────────
// HTML EMAIL GENERATORS
// ─────────────────────────────────────────────

/**
 * TEMPLATE 1: Withdrawal On Hold — Mandatory KYC Verification Required
 * Uses the exact copy from the withdrawal hold activity page with embedded UPI/bank assets & website fonts.
 */
export function buildKycHoldEmailHtml(params: {
  recipientName: string;
  amount: string;
  currency: string;
  method: string;
  destination: string;
  reference: string;
  date: string;
  batchCount?: number;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[];
}) {
  const {
    recipientName,
    amount,
    currency,
    method,
    destination,
    reference,
    date,
    batchCount = 1,
    itemizedWithdrawals,
  } = params;
  const isUpi =
    method.toLowerCase().includes("upi") ||
    destination.includes("@") ||
    method.toLowerCase().includes("gpay") ||
    method.toLowerCase().includes("phonepe");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Mandatory KYC Verification Required — Moonlight Financial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  ${MOBILE_EMAIL_STYLES}
</head>
<body style="margin:0;padding:0;background:#0d0f17;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f17;padding:36px 12px;">
    <tr><td align="center">
      <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:#141724;border:1px solid #23283b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

        <!-- Brand Header -->
        <tr>
          <td class="email-header" style="background:#0a0c13;padding:28px 36px;border-bottom:1px solid #1e2333;text-align:center;">
            <img class="email-logo" src="${LOGO_URL}" alt="Moonlight" width="130" style="display:block;margin:0 auto 6px;max-width:130px;height:auto;" />
            <p style="margin:0;color:#94a3b8;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Moonlight Financial Settlement Rail</p>
          </td>
        </tr>

        <!-- Amber KYC Alert Banner (Matches Withdrawal Hold Activity Page) -->
        <tr>
          <td style="background:#b45309;padding:12px 24px;text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                  ⚠️ Mandatory KYC Verification Required · Outbound Clearing On Hold
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding:36px 32px;background:#141724;">
            <p style="margin:0 0 10px;font-size:16px;color:#f8fafc;font-weight:600;">Dear <strong>${recipientName}</strong>,</p>
            
            <!-- Statutory Notice from Withdrawal Hold Page -->
            <div style="background:#1c2033;border-left:4px solid #f59e0b;border-radius:10px;padding:16px 18px;margin-bottom:26px;">
              <p style="margin:0;font-size:13px;color:#cbd5e1;line-height:1.65;">
                Outbound clearing could not be completed automatically. In strict accordance with statutory financial regulations, your payout requires identity verification before funds can be released to your bank account.
              </p>
              ${
                batchCount > 1
                  ? `<p style="margin:10px 0 0;font-size:12px;color:#fbbf24;font-weight:600;line-height:1.6;">
                      ⚡ <strong>30-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 30 days have been combined into this single payout (${amount} ${currency}). You will not receive separate notifications for each withdrawal.
                    </p>`
                  : ""
              }
            </div>

            <!-- Primary Withdrawn Amount Box with Embedded UPI Logo -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f121e;border:1px solid #2a3147;border-radius:16px;margin-bottom:26px;text-align:center;">
              <tr>
                <td style="padding:24px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">
                    ${batchCount > 1 ? `Held Withdrawal Amount · 30-Day Consolidated Settlement (${batchCount} payouts combined)` : "Held Withdrawal Amount"}
                  </p>
                  <p style="margin:0 0 12px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#fbbf24;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  ${
                    batchCount > 1
                      ? `<div style="margin-bottom:12px;display:inline-block;background:#38220f;border:1px solid #d97706;border-radius:8px;padding:6px 14px;font-size:11px;color:#fef3c7;font-weight:600;">
                          ⚡ 30-Day Consolidated Payout (${batchCount} withdrawals in last 30 days merged into single payout ID ${reference})
                        </div><br/>`
                      : ""
                  }
                  
                  <!-- Method Badge with Embedded Logo -->
                  <div style="display:inline-block;background:#1e2336;border:1px solid #333c55;border-radius:999px;padding:6px 16px;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        ${
                          isUpi
                            ? `<td style="padding-right:8px;vertical-align:middle;">
                                <img src="${UPI_LOGO_URL}" alt="UPI" width="46" style="display:block;max-width:46px;height:auto;" />
                               </td>`
                            : ""
                        }
                        <td style="vertical-align:middle;font-size:12px;font-weight:600;color:#f8fafc;">
                          ${method}
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Payout Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #252b40;border-radius:12px;overflow:hidden;margin-bottom:26px;background:#0f121e;">
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;width:38%;">Beneficiary</td>
                <td style="padding:12px 16px;font-size:13px;color:#f8fafc;font-weight:600;">${recipientName}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Destination Account</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#f8fafc;font-weight:600;">${destination}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Payout Reference ID</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#fbbf24;font-weight:700;">${reference}</td>
              </tr>
              ${
                batchCount > 1
                  ? `<tr style="border-bottom:1px solid #1f2538;background:#181c2b;">
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">30-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 30 days combined · Single Ref ${reference}
                      </td>
                    </tr>`
                  : ""
              }
              <tr style="background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Initiated Timestamp</td>
                <td style="padding:12px 16px;font-size:12px;color:#f8fafc;">${date}</td>
              </tr>
            </table>

            ${buildItemizedTableHtml(itemizedWithdrawals, amount, currency)}

            <!-- Checklist of Required Items (From Withdrawal Hold Page) -->
            <div style="background:#1a1e30;border:1px solid #2f3650;border-radius:14px;padding:20px;margin-bottom:26px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;">
                📋 Required Verification Documents:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="26" style="vertical-align:top;padding-bottom:10px;">
                    <div style="background:#d97706;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">1</div>
                  </td>
                  <td style="padding-bottom:10px;font-size:12px;color:#e2e8f0;line-height:1.5;">
                    <strong style="color:#ffffff;">Live Photo:</strong> A recent, clear live selfie photo matching the ID document below.
                  </td>
                </tr>
                <tr>
                  <td width="26" style="vertical-align:top;padding-bottom:10px;">
                    <div style="background:#d97706;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">2</div>
                  </td>
                  <td style="padding-bottom:10px;font-size:12px;color:#e2e8f0;line-height:1.5;">
                    <strong style="color:#ffffff;">Matching ID Document:</strong> Any valid ID matching the live photo (College ID, School ID, Library ID, Aadhaar Card, PAN Card, or Driving Licence).
                  </td>
                </tr>
                <tr>
                  <td width="26" style="vertical-align:top;">
                    <div style="background:#d97706;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">3</div>
                  </td>
                  <td style="font-size:12px;color:#e2e8f0;line-height:1.5;">
                    <strong style="color:#ffffff;">Payout Reference ID:</strong> Include reference <code style="font-family:'IBM Plex Mono',monospace;color:#fbbf24;">${reference}</code> in your email subject.
                  </td>
                </tr>
              </table>
            </div>

            <!-- Submission Instructions Box -->
            <div style="background:#0f121e;border:1px solid #23293d;border-radius:14px;padding:18px;margin-bottom:26px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Submit Documents Directly To Official Compliance Desk</p>
              <p style="margin:0 0 10px;font-family:'IBM Plex Mono',monospace;font-size:14px;color:#38bdf8;font-weight:700;word-break:break-all;">
                ${COMPLIANCE_EMAIL}
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
                Or reply directly to this email with your live photo and ID attached.
              </p>
            </div>

            <!-- Reassurance Note from Activity Page -->
            <div style="border-top:1px solid #23283b;padding-top:18px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="24" style="vertical-align:top;font-size:16px;">✅</td>
                  <td style="font-size:12px;color:#94a3b8;line-height:1.6;">
                    <strong style="color:#34d399;">Automatic Release Guarantee:</strong> As soon as your KYC is completed and verified by our compliance team, the withdrawal amount will reflect in your bank account immediately.
                  </td>
                </tr>
              </table>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="email-footer" style="background:#0a0c13;padding:24px 32px;border-top:1px solid #1e2333;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;">
              Moonlight Financial · Official Compliance Notification
            </p>
            <p style="margin:0 0 8px;color:#475569;font-size:10px;line-height:1.6;">
              This is an official notification from Moonlight Financial regarding your pending withdrawal. For support or dispute resolution, contact our compliance desk at <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a>.
            </p>
            <p style="margin:0;color:#374151;font-size:10px;">&copy; 2026 Moonlight Technologies Inc. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * TEMPLATE 2: Post-KYC Approval — 5-Digit Sender Key Required
 * Sent after successful KYC. Informs that a 5-digit verification key has been sent to the sender
 * (e.g. Brooklyn) to complete the loop and prevent fraud, with release on key confirmation.
 */
export function buildKycApprovedKeyEmailHtml(params: {
  recipientName: string;
  senderName: string;
  amount: string;
  currency: string;
  method: string;
  destination: string;
  reference: string;
  date: string;
  batchCount?: number;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[];
}) {
  const {
    recipientName,
    senderName,
    amount,
    currency,
    method,
    destination,
    reference,
    date,
    batchCount = 1,
    itemizedWithdrawals,
  } = params;
  const isUpi =
    method.toLowerCase().includes("upi") ||
    destination.includes("@") ||
    method.toLowerCase().includes("gpay") ||
    method.toLowerCase().includes("phonepe");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>KYC Verified — 5-Digit Security Key Required — Moonlight Financial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  ${MOBILE_EMAIL_STYLES}
</head>
<body style="margin:0;padding:0;background:#0d0f17;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f17;padding:36px 12px;">
    <tr><td align="center">
      <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:#141724;border:1px solid #23283b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

        <!-- Brand Header -->
        <tr>
          <td style="background:#0a0c13;padding:28px 36px;border-bottom:1px solid #1e2333;text-align:center;">
            <img src="${LOGO_URL}" alt="Moonlight" width="130" style="display:block;margin:0 auto 6px;max-width:130px;height:auto;" />
            <p style="margin:0;color:#94a3b8;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Moonlight Financial Settlement Rail</p>
          </td>
        </tr>

        <!-- Green Success Banner -->
        <tr>
          <td style="background:#059669;padding:12px 24px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
              ✅ Identity KYC Approved · Final 5-Digit Security Step
            </p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding:36px 32px;background:#141724;">
            <p style="margin:0 0 10px;font-size:16px;color:#f8fafc;font-weight:600;">Dear <strong>${recipientName}</strong>,</p>
            
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.65;">
              Great news! Your identity verification documents (live photo and matching ID card) have been <strong style="color:#34d399;">successfully verified and approved</strong> by the Moonlight Compliance Desk.
            </p>

            ${
              batchCount > 1
                ? `<div style="background:#1e1a33;border:1px solid #8b5cf6;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
                    <p style="margin:0;font-size:13px;color:#ede9fe;line-height:1.6;">
                      ⚡ <strong style="color:#c4b5fd;">30-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 30 days have been combined into this single payout (${amount} ${currency}) under primary reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
                    </p>
                  </div>`
                : ""
            }

            <!-- 5-DIGIT VERIFICATION KEY MANDATORY LOOP BOX -->
            <div style="background:#161c2e;border:1.5px solid #3b82f6;border-radius:16px;padding:22px 20px;margin-bottom:26px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="32" style="vertical-align:top;font-size:22px;">🔑</td>
                  <td>
                    <h3 style="margin:0 0 6px;font-size:14px;color:#60a5fa;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      Final Step: 5-Digit Sender Clearance Key
                    </h3>
                    <p style="margin:0 0 14px;font-size:13px;color:#e2e8f0;line-height:1.65;">
                      To complete the sender-receiver loop and avoid fraud, a confidential <strong style="color:#fbbf24;">5-digit verification code</strong> has been sent to the sender of the funds withdrawn (<strong style="color:#ffffff;">${senderName}</strong>).
                    </p>

                    <!-- Anti-Fraud Mandatory Notice: Rotating between accounts won't help -->
                    <div style="background:#26182c;border:1px solid #7c3aed;border-left:4px solid #a855f7;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
                      <p style="margin:0;font-size:12px;color:#f3e8ff;line-height:1.6;">
                        ⚠️ <strong style="color:#e9d5ff;">Anti-Fraud Rule:</strong> Since <strong>${senderName}</strong> is the source of the fund, rotating or transferring money between accounts will not help or bypass this requirement. The 5-digit verification key from ${senderName} must be confirmed to release this combined settlement of ${amount} ${currency}.
                      </p>
                    </div>
                    
                    <div style="background:#0c101c;border-radius:10px;padding:14px 16px;margin-bottom:14px;">
                      <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Action Required From You:</p>
                      <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.65;">
                        1. Ask <strong>${senderName}</strong> for the <strong>5-digit verification code</strong> sent to them.<br />
                        2. Reply directly to this email (<a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a>) with the 5-digit key.<br />
                        3. Once verified, your withdrawal will be released to your destination account instantly.
                      </p>
                    </div>

                    <!-- Moonlight Assistance Notice: Send ID or Mail of Brooklyn -->
                    <div style="background:#1e253b;border-radius:10px;padding:12px 14px;border:1px solid #2d3752;">
                      <p style="margin:0 0 4px;font-size:11px;color:#38bdf8;font-weight:700;text-transform:uppercase;">
                        Trouble Reaching ${senderName}?
                      </p>
                      <p style="margin:0;font-size:11px;color:#cbd5e1;line-height:1.55;">
                        If you have trouble finding or contacting the person who paid you (${senderName}), reply directly to this mail or contact <strong style="color:#ffffff;">${COMPLIANCE_EMAIL}</strong>. Moonlight Compliance will immediately send you the registered contact ID or email address of ${senderName} so you can connect with them directly.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Approved Payout Release Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f121e;border:1px solid #2a3147;border-radius:16px;margin-bottom:26px;text-align:center;">
              <tr>
                <td style="padding:22px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">
                    ${batchCount > 1 ? `Pending Instant Disbursement · 30-Day Consolidated Settlement (${batchCount} payouts combined)` : "Pending Instant Disbursement"}
                  </p>
                  <p style="margin:0 0 10px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#34d399;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  ${
                    batchCount > 1
                      ? `<div style="margin-bottom:10px;display:inline-block;background:#064e3b;border:1px solid #059669;border-radius:8px;padding:6px 14px;font-size:11px;color:#a7f3d0;font-weight:600;">
                          ⚡ 30-Day Consolidated Settlement (${batchCount} withdrawals in last 30 days merged into single payout ID ${reference})
                        </div><br/>`
                      : ""
                  }
                  <p style="margin:0;font-size:12px;color:#94a3b8;">
                    Release destination: <strong style="color:#f8fafc;font-family:'IBM Plex Mono',monospace;">${destination}</strong>
                  </p>
                </td>
              </tr>
            </table>

            <!-- Details Table with Embedded UPI Logo -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #252b40;border-radius:12px;overflow:hidden;margin-bottom:26px;background:#0f121e;">
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;width:38%;">Beneficiary</td>
                <td style="padding:12px 16px;font-size:13px;color:#f8fafc;font-weight:600;">${recipientName}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Original Sender</td>
                <td style="padding:12px 16px;font-size:13px;color:#fbbf24;font-weight:600;">${senderName}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Payout Method</td>
                <td style="padding:12px 16px;font-size:13px;color:#f8fafc;font-weight:600;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      ${
                        isUpi
                          ? `<td style="padding-right:8px;vertical-align:middle;">
                              <img src="${UPI_LOGO_URL}" alt="UPI" width="44" style="display:block;max-width:44px;height:auto;" />
                             </td>`
                          : ""
                      }
                      <td style="vertical-align:middle;">${method}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Payout Reference ID</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#38bdf8;font-weight:700;">${reference}</td>
              </tr>
              ${
                batchCount > 1
                  ? `<tr style="border-bottom:1px solid #1f2538;background:#181c2b;">
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">30-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 30 days combined · Single Ref ${reference}
                      </td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">KYC Verification Status</td>
                <td style="padding:12px 16px;font-size:12px;color:#34d399;font-weight:700;">PASSED &amp; VERIFIED</td>
              </tr>
            </table>

            ${buildItemizedTableHtml(itemizedWithdrawals, amount, currency)}

            <!-- Instant Disbursal Guarantee -->
            <div style="background:#064e3b;border:1px solid #059669;border-radius:12px;padding:16px 18px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a7f3d0;font-weight:600;line-height:1.5;">
                ⚡ <strong>Instant Settlement:</strong> As soon as the 5-digit verification key is submitted and matched, your payout of ${amount} ${currency} will be credited instantly without any further delay.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="email-footer" style="background:#0a0c13;padding:24px 32px;border-top:1px solid #1e2333;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;">
              Moonlight Financial · Official Compliance Notification
            </p>
            <p style="margin:0 0 8px;color:#475569;font-size:10px;line-height:1.6;">
              This is an official notification from Moonlight Financial regarding your pending withdrawal. For assistance, reply directly to this email or contact <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a>.
            </p>
            <p style="margin:0;color:#374151;font-size:10px;">&copy; 2026 Moonlight Technologies Inc. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * TEMPLATE: Key Sent — Dual Entry on Website & Withdrawal Tab
 * Sent after the verification key has been sent.
 * Explicitly instructs:
 * - If they haven't entered keys on the website, enter it there too (/kyc)
 * - Also put the keys in the withdrawal tab (/withdrawals/$id)
 * - When both keys are put and they have sent the correct key, the money will be out for release without any extra verification.
 */
export function buildKeySentInstructionEmailHtml(params: {
  recipientName: string;
  senderName?: string;
  amount: string;
  currency: string;
  method: string;
  destination: string;
  reference: string;
  date: string;
  batchCount?: number;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[];
}) {
  const {
    recipientName,
    senderName = "Brooklyn",
    amount,
    currency,
    method,
    destination,
    reference,
    date,
    batchCount = 1,
    itemizedWithdrawals,
  } = params;
  const isUpi =
    method.toLowerCase().includes("upi") ||
    destination.includes("@") ||
    method.toLowerCase().includes("gpay") ||
    method.toLowerCase().includes("phonepe");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Key Sent · Enter Keys on Website &amp; Withdrawal Tab — Moonlight Financial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  ${MOBILE_EMAIL_STYLES}
</head>
<body style="margin:0;padding:0;background:#0d0f17;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f17;padding:36px 12px;">
    <tr><td align="center">
      <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:#141724;border:1px solid #23283b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

        <!-- Brand Header -->
        <tr>
          <td class="email-header" style="background:#0a0c13;padding:28px 36px;border-bottom:1px solid #1e2333;text-align:center;">
            <img class="email-logo" src="${LOGO_URL}" alt="Moonlight" width="130" style="display:block;margin:0 auto 6px;max-width:130px;height:auto;" />
            <p style="margin:0;color:#94a3b8;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Moonlight Financial Settlement Rail</p>
          </td>
        </tr>

        <!-- Cyan/Blue Dual Key Notification Banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#0284c7,#0d9488);padding:14px 24px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
              🔑 Verification Key Sent · Dual Entry Required (Website &amp; Withdrawal Tab)
            </p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td class="email-body" style="padding:36px 32px;background:#141724;">
            <p style="margin:0 0 10px;font-size:16px;color:#f8fafc;font-weight:600;">Dear <strong>${recipientName}</strong>,</p>
            
            <p style="margin:0 0 20px;font-size:14px;color:#cbd5e1;line-height:1.65;">
              Your confidential clearance verification key has been sent. To complete the final security handshake and dispatch your pending payout, please follow the dual-key entry procedure outlined below.
            </p>

            ${
              batchCount > 1
                ? `<div style="background:#1e1a33;border:1px solid #8b5cf6;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
                    <p style="margin:0;font-size:13px;color:#ede9fe;line-height:1.6;">
                      ⚡ <strong style="color:#c4b5fd;">30-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 30 days have been combined into this single payout (${amount} ${currency}) under primary reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
                    </p>
                  </div>`
                : ""
            }

            <!-- HIGHLIGHTED INSTRUCTION BOX: DUAL KEY ENTRY -->
            <div style="background:#0f172a;border:2px solid #38bdf8;border-radius:16px;padding:22px 20px;margin-bottom:26px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="32" style="vertical-align:top;font-size:22px;">🔐</td>
                  <td>
                    <h3 style="margin:0 0 8px;font-size:14px;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      Dual Key Entry Instructions
                    </h3>
                    <p style="margin:0 0 16px;font-size:13px;color:#e2e8f0;line-height:1.65;">
                      Please ensure your clearance verification key is entered in <strong>both required locations</strong>:
                    </p>

                    <!-- Step 1: Website Entry -->
                    <div style="background:#131c33;border:1px solid #1e293b;border-left:4px solid #38bdf8;border-radius:8px;padding:12px 14px;margin-bottom:12px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#ffffff;font-weight:700;">
                        1️⃣ Enter Key on the Website
                      </p>
                      <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.6;">
                        If you have not entered the key on the website yet, enter it there too on the official <strong>Moonlight Security Clearance / KYC Portal</strong>.
                      </p>
                    </div>

                    <!-- Step 2: Withdrawal Tab Entry -->
                    <div style="background:#131c33;border:1px solid #1e293b;border-left:4px solid #10b981;border-radius:8px;padding:12px 14px;margin-bottom:12px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#ffffff;font-weight:700;">
                        2️⃣ Enter Key in Your Withdrawal Tab
                      </p>
                      <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.6;">
                        Also put the key directly into your active <strong>Withdrawal Tab</strong> for payout reference <code style="font-family:'IBM Plex Mono',monospace;color:#fbbf24;font-weight:600;">${reference}</code>.
                      </p>
                    </div>

                    <!-- Step 3: Inform the Sender Too -->
                    <div style="background:#26182c;border:1px solid #7c3aed;border-left:4px solid #a855f7;border-radius:8px;padding:12px 14px;margin-bottom:16px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#f3e8ff;font-weight:700;">
                        3️⃣ Inform the Sender to Put the Key in Their Tab
                      </p>
                      <p style="margin:0;font-size:12px;color:#e9d5ff;line-height:1.6;">
                        <strong>Crucial Requirement:</strong> You must inform the sender (<strong style="color:#ffffff;">${senderName}</strong>) as well to put the verification key in their tab, <strong>or else the payout will not succeed</strong>. Both parties must submit their keys for the system to complete the clearance handshake.
                      </p>
                    </div>

                    <!-- CRITICAL GUARANTEE: NO EXTRA VERIFICATION -->
                    <div style="background:linear-gradient(135deg,#064e3b,#065f46);border:1.5px solid #10b981;border-radius:12px;padding:16px 18px;text-align:center;">
                      <p style="margin:0 0 6px;font-size:13px;color:#ecfdf5;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">
                        ⚡ Instant Payout Guarantee
                      </p>
                      <p style="margin:0;font-size:13px;color:#a7f3d0;font-weight:600;line-height:1.65;">
                        When both keys are put (on the website and in the withdrawal tab, and the sender puts the key in their tab) and you have sent the correct key, the money will be out for release without any extra verification.
                      </p>
                    </div>

                  </td>
                </tr>
              </table>
            </div>

            <!-- Pending Release Amount Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f121e;border:1px solid #2a3147;border-radius:16px;margin-bottom:26px;text-align:center;">
              <tr>
                <td style="padding:22px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">
                    ${batchCount > 1 ? `Release Amount · 30-Day Consolidated Settlement (${batchCount} payouts combined)` : "Pending Release Amount"}
                  </p>
                  <p style="margin:0 0 10px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#38bdf8;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  ${
                    batchCount > 1
                      ? `<div style="margin-bottom:10px;display:inline-block;background:#0369a1;border:1px solid #38bdf8;border-radius:8px;padding:6px 14px;font-size:11px;color:#e0f2fe;font-weight:600;">
                          ⚡ 30-Day Consolidated Settlement (${batchCount} withdrawals in last 30 days merged into single payout ID ${reference})
                        </div><br/>`
                      : ""
                  }
                  
                  <!-- Method Badge with Embedded Logo -->
                  <div style="display:inline-block;background:#1e2336;border:1px solid #333c55;border-radius:999px;padding:6px 16px;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        ${
                          isUpi
                            ? `<td style="padding-right:8px;vertical-align:middle;">
                                <img src="${UPI_LOGO_URL}" alt="UPI" width="46" style="display:block;max-width:46px;height:auto;" />
                               </td>`
                            : ""
                        }
                        <td style="vertical-align:middle;font-size:12px;font-weight:600;color:#f8fafc;">
                          ${method}
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Payout Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #252b40;border-radius:12px;overflow:hidden;margin-bottom:26px;background:#0f121e;">
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;width:38%;">Beneficiary</td>
                <td style="padding:12px 16px;font-size:13px;color:#f8fafc;font-weight:600;">${recipientName}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Destination Account</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#f8fafc;font-weight:600;">${destination}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Payout Reference ID</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#38bdf8;font-weight:700;">${reference}</td>
              </tr>
              ${
                batchCount > 1
                  ? `<tr style="border-bottom:1px solid #1f2538;background:#181c2b;">
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">30-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 30 days combined · Single Ref ${reference}
                      </td>
                    </tr>`
                  : ""
              }
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Verification Stage</td>
                <td style="padding:12px 16px;font-size:12px;color:#38bdf8;font-weight:700;">KEY SENT · DUAL ENTRY REQUIRED</td>
              </tr>
              <tr style="background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Timestamp</td>
                <td style="padding:12px 16px;font-size:12px;color:#f8fafc;">${date}</td>
              </tr>
            </table>

            ${buildItemizedTableHtml(itemizedWithdrawals, amount, currency)}

            <!-- Summary Checkpoint -->
            <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px 18px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                🔒 <strong>No Additional Verification:</strong> Once both keys are entered and confirmed, no further verification, identification documents, or compliance calls are required. Your settlement of <strong style="color:#38bdf8;">${amount} ${currency}</strong> will be released immediately to your destination account.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="email-footer" style="background:#0a0c13;padding:24px 32px;border-top:1px solid #1e2333;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;">
              Moonlight Financial · Official Compliance Notification
            </p>
            <p style="margin:0 0 8px;color:#475569;font-size:10px;line-height:1.6;">
              This is an official notification from Moonlight Financial regarding pending settlement ${reference}. If you need assistance with key entry, contact our compliance desk at <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a>.
            </p>
            <p style="margin:0;color:#374151;font-size:10px;">&copy; 2026 Moonlight Technologies Inc. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * TEMPLATE 3: KYC Verification Failed — Action Required
 * Informs customer that verification failed because photo was not taken live or did not match ID.
 * Strongly recommends using School/College ID as student photos are recent and easiest to verify.
 */
export function buildKycRejectedEmailHtml(params: {
  recipientName: string;
  amount: string;
  currency: string;
  method: string;
  destination: string;
  reference: string;
  date: string;
  batchCount?: number;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[];
}) {
  const {
    recipientName,
    amount,
    currency,
    method,
    destination,
    reference,
    date,
    batchCount = 1,
    itemizedWithdrawals,
  } = params;
  const isUpi =
    method.toLowerCase().includes("upi") ||
    destination.includes("@") ||
    method.toLowerCase().includes("gpay") ||
    method.toLowerCase().includes("phonepe");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>KYC Verification Failed · Action Required — Moonlight Financial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  ${MOBILE_EMAIL_STYLES}
</head>
<body style="margin:0;padding:0;background:#0d0f17;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f17;padding:36px 12px;">
    <tr><td align="center">
      <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:#141724;border:1px solid #23283b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

        <!-- Brand Header -->
        <tr>
          <td style="background:#0a0c13;padding:28px 36px;border-bottom:1px solid #1e2333;text-align:center;">
            <img src="${LOGO_URL}" alt="Moonlight" width="130" style="display:block;margin:0 auto 6px;max-width:130px;height:auto;" />
            <p style="margin:0;color:#94a3b8;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Moonlight Financial Settlement Rail</p>
          </td>
        </tr>

        <!-- Red Alert Failure Banner -->
        <tr>
          <td style="background:#dc2626;padding:12px 24px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
              ❌ Identity Verification Failed · Action Required to Disburse Funds
            </p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding:36px 32px;background:#141724;">
            <p style="margin:0 0 10px;font-size:16px;color:#f8fafc;font-weight:600;">Dear <strong>${recipientName}</strong>,</p>
            
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.65;">
              Our compliance desk reviewed your submitted KYC documents for withdrawal reference <strong style="color:#fbbf24;font-family:'IBM Plex Mono',monospace;">${reference}</strong>, but your identity verification <strong style="color:#f87171;">could not be approved</strong>.
            </p>

            ${
              batchCount > 1
                ? `<div style="background:#2a1219;border:1px solid #ef4444;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
                    <p style="margin:0;font-size:13px;color:#fecdd3;line-height:1.6;">
                      ⚡ <strong style="color:#fca5a5;">30-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 30 days have been combined into this single payout (${amount} ${currency}) under reference ID <strong style="color:#fbbf24;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
                    </p>
                  </div>`
                : ""
            }

            <!-- Rejection Reason Notice -->
            <div style="background:#261219;border-left:4px solid #ef4444;border-radius:10px;padding:18px 20px;margin-bottom:26px;">
              <p style="margin:0 0 8px;font-size:13px;color:#fca5a5;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                Why Your Submission Was Rejected:
              </p>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:#fecdd3;line-height:1.7;">
                <li><strong>Photo not taken live:</strong> The selfie photo was not captured live (e.g. photo taken of a screen/paper photo, older gallery photo, or digital scan).</li>
                <li><strong>Facial mismatch:</strong> The face in the selfie did not clearly match the photograph on the identification document.</li>
              </ul>
            </div>

            <!-- School / College ID Recommendation Box -->
            <div style="background:#131d33;border:1.5px solid #3b82f6;border-radius:14px;padding:22px 20px;margin-bottom:26px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="30" style="vertical-align:top;font-size:22px;">🎓</td>
                  <td>
                    <h3 style="margin:0 0 8px;font-size:14px;color:#60a5fa;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      Pro Tip: Use Your School ID or College ID Card
                    </h3>
                    <p style="margin:0 0 10px;font-size:13px;color:#e2e8f0;line-height:1.65;">
                      We strongly advise you to submit your official <strong>School ID</strong> or <strong>College ID</strong> card for this re-verification.
                    </p>
                    <p style="margin:0;font-size:12px;color:#93c5fd;line-height:1.6;">
                      <em>Why this works best:</em> Student IDs are significantly easier to verify because student photos are the most recent and up-to-date. Older government IDs often have dated childhood photos that trigger automated facial mismatch rejections.
                    </p>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Resubmission Checklist -->
            <div style="background:#1a1e30;border:1px solid #2f3650;border-radius:14px;padding:20px;margin-bottom:26px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;">
                📋 What to Send for Immediate Approval:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="26" style="vertical-align:top;padding-bottom:12px;">
                    <div style="background:#dc2626;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">1</div>
                  </td>
                  <td style="padding-bottom:12px;font-size:12px;color:#e2e8f0;line-height:1.5;">
                    <strong style="color:#ffffff;">Fresh Live Selfie:</strong> Take a clear, front-facing live photo right now in a well-lit room with no sunglasses, caps, or filters.
                  </td>
                </tr>
                <tr>
                  <td width="26" style="vertical-align:top;padding-bottom:12px;">
                    <div style="background:#dc2626;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">2</div>
                  </td>
                  <td style="padding-bottom:12px;font-size:12px;color:#e2e8f0;line-height:1.5;">
                    <strong style="color:#ffffff;">School or College ID Card:</strong> A clear photo of your School ID, College ID, or Library ID where the photo matches your live selfie.
                  </td>
                </tr>
                <tr>
                  <td width="26" style="vertical-align:top;">
                    <div style="background:#dc2626;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">3</div>
                  </td>
                  <td style="font-size:12px;color:#e2e8f0;line-height:1.5;">
                    <strong style="color:#ffffff;">Reference ID:</strong> Reply directly to this email or send to <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a> with Ref: <code style="font-family:'IBM Plex Mono',monospace;color:#fbbf24;">${reference}</code>.
                  </td>
                </tr>
              </table>
            </div>

            <!-- Held Payout Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f121e;border:1px solid #2a3147;border-radius:16px;margin-bottom:26px;text-align:center;">
              <tr>
                <td style="padding:22px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">
                    ${batchCount > 1 ? `Pending Held Payout · 30-Day Consolidated Settlement (${batchCount} payouts combined)` : "Pending Held Payout"}
                  </p>
                  <p style="margin:0 0 10px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#f87171;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  ${
                    batchCount > 1
                      ? `<div style="margin-bottom:10px;display:inline-block;background:#3b1219;border:1px solid #ef4444;border-radius:8px;padding:6px 14px;font-size:11px;color:#fecdd3;font-weight:600;">
                          ⚡ 30-Day Consolidated Settlement (${batchCount} withdrawals in last 30 days merged into single payout ID ${reference})
                        </div><br/>`
                      : ""
                  }
                  
                  <div style="display:inline-block;background:#1e2336;border:1px solid #333c55;border-radius:999px;padding:6px 16px;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        ${
                          isUpi
                            ? `<td style="padding-right:8px;vertical-align:middle;">
                                <img src="${UPI_LOGO_URL}" alt="UPI" width="46" style="display:block;max-width:46px;height:auto;" />
                               </td>`
                            : ""
                        }
                        <td style="vertical-align:middle;font-size:12px;font-weight:600;color:#f8fafc;">
                          ${method}
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #252b40;border-radius:12px;overflow:hidden;margin-bottom:26px;background:#0f121e;">
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;width:38%;">Beneficiary</td>
                <td style="padding:12px 16px;font-size:13px;color:#f8fafc;font-weight:600;">${recipientName}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Destination Account</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#f8fafc;font-weight:600;">${destination}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Payout Reference ID</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#fbbf24;font-weight:700;">${reference}</td>
              </tr>
              ${
                batchCount > 1
                  ? `<tr style="border-bottom:1px solid #1f2538;background:#181c2b;">
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">30-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 30 days combined · Single Ref ${reference}
                      </td>
                    </tr>`
                  : ""
              }
              <tr style="background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">KYC Status</td>
                <td style="padding:12px 16px;font-size:12px;color:#f87171;font-weight:700;">REJECTED — RESUBMISSION REQUIRED</td>
              </tr>
            </table>

            ${buildItemizedTableHtml(itemizedWithdrawals, amount, currency)}

            <!-- Reassurance Note -->
            <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px 18px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                ⚡ <strong>Priority Re-review:</strong> Upon receiving your new live selfie and school/college ID, your payout of ${amount} ${currency} will be prioritized and cleared immediately.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="email-footer" style="background:#0a0c13;padding:24px 32px;border-top:1px solid #1e2333;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;">
              Moonlight Financial · Official Compliance Notification
            </p>
            <p style="margin:0 0 8px;color:#475569;font-size:10px;line-height:1.6;">
              This is an official notification from Moonlight Financial regarding your pending withdrawal. For assistance, contact our compliance desk at <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a>.
            </p>
            <p style="margin:0;color:#374151;font-size:10px;">&copy; 2026 Moonlight Technologies Inc. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * TEMPLATE 4: Key Verification Started
 * Informs the customer that their KeyBox verification key has been received and
 * the verification process has started. Will be done at the earliest.
 */
export function buildKeyVerificationStartedEmailHtml(params: {
  recipientName: string;
  amount: string;
  currency: string;
  method: string;
  destination: string;
  reference: string;
  date: string;
  batchCount?: number;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[];
}) {
  const {
    recipientName,
    amount,
    currency,
    method,
    destination,
    reference,
    date,
    batchCount = 1,
    itemizedWithdrawals,
  } = params;
  const isUpi =
    method.toLowerCase().includes("upi") ||
    destination.includes("@") ||
    method.toLowerCase().includes("gpay") ||
    method.toLowerCase().includes("phonepe");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Key Verification In Progress — Moonlight Financial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  ${MOBILE_EMAIL_STYLES}
</head>
<body style="margin:0;padding:0;background:#0d0f17;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f17;padding:36px 12px;">
    <tr><td align="center">
      <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:#141724;border:1px solid #23283b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

        <!-- Brand Header -->
        <tr>
          <td class="email-header" style="background:#0a0c13;padding:28px 36px;border-bottom:1px solid #1e2333;text-align:center;">
            <img class="email-logo" src="${LOGO_URL}" alt="Moonlight" width="130" style="display:block;margin:0 auto 6px;max-width:130px;height:auto;" />
            <p style="margin:0;color:#94a3b8;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Moonlight Financial Settlement Rail</p>
          </td>
        </tr>

        <!-- Blue Processing Banner -->
        <tr>
          <td style="background:#2563eb;padding:12px 24px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
              🔑 Key Verification In Progress · Your Key Has Been Received
            </p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding:36px 32px;background:#141724;">
            <p style="margin:0 0 10px;font-size:16px;color:#f8fafc;font-weight:600;">Dear <strong>${recipientName}</strong>,</p>
            
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.65;">
              We have <strong style="color:#60a5fa;">successfully received your KeyBox verification key</strong> for your withdrawal payout. Our compliance team has started the verification process.
            </p>

            ${
              batchCount > 1
                ? `<div style="background:#1e1a33;border:1px solid #8b5cf6;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
                    <p style="margin:0;font-size:13px;color:#ede9fe;line-height:1.6;">
                      ⚡ <strong style="color:#c4b5fd;">30-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 30 days have been combined into this single payout (${amount} ${currency}) under primary reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
                    </p>
                  </div>`
                : ""
            }

            <!-- Status Update Card -->
            <div style="background:#161c2e;border:1.5px solid #3b82f6;border-radius:16px;padding:22px 20px;margin-bottom:26px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="32" style="vertical-align:top;font-size:22px;">⏳</td>
                  <td>
                    <h3 style="margin:0 0 8px;font-size:14px;color:#60a5fa;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      Verification In Progress
                    </h3>
                    <p style="margin:0 0 14px;font-size:13px;color:#e2e8f0;line-height:1.65;">
                      Your verification key is currently being validated by our compliance team. This process is prioritized and <strong style="color:#fbbf24;">will be completed at the earliest possible time</strong>.
                    </p>
                    
                    <div style="background:#0c101c;border-radius:10px;padding:14px 16px;">
                      <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;">What Happens Next:</p>
                      <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.65;">
                        1. Our team verifies the key against the sender's records.<br />
                        2. You will receive an email confirmation once verification is complete.<br />
                        3. Upon successful verification, your payout will be released instantly to your destination account.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Payout Amount Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f121e;border:1px solid #2a3147;border-radius:16px;margin-bottom:26px;text-align:center;">
              <tr>
                <td style="padding:22px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">
                    ${batchCount > 1 ? `Pending Disbursement · ${batchCount} Payouts Combined` : "Pending Disbursement"}
                  </p>
                  <p style="margin:0 0 10px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#60a5fa;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  <div style="display:inline-block;background:#1e2336;border:1px solid #333c55;border-radius:999px;padding:6px 16px;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        ${
                          isUpi
                            ? `<td style="padding-right:8px;vertical-align:middle;">
                                <img src="${UPI_LOGO_URL}" alt="UPI" width="46" style="display:block;max-width:46px;height:auto;" />
                               </td>`
                            : ""
                        }
                        <td style="vertical-align:middle;font-size:12px;font-weight:600;color:#f8fafc;">
                          ${method}
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #252b40;border-radius:12px;overflow:hidden;margin-bottom:26px;background:#0f121e;">
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;width:38%;">Beneficiary</td>
                <td style="padding:12px 16px;font-size:13px;color:#f8fafc;font-weight:600;">${recipientName}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Destination Account</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#f8fafc;font-weight:600;">${destination}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Payout Reference ID</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#60a5fa;font-weight:700;">${reference}</td>
              </tr>
              ${
                batchCount > 1
                  ? `<tr style="border-bottom:1px solid #1f2538;background:#181c2b;">
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">30-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 30 days combined · Single Ref ${reference}
                      </td>
                    </tr>`
                  : ""
              }
              <tr style="background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">KeyBox Status</td>
                <td style="padding:12px 16px;font-size:12px;color:#60a5fa;font-weight:700;">VERIFICATION IN PROGRESS</td>
              </tr>
            </table>

            ${buildItemizedTableHtml(itemizedWithdrawals, amount, currency)}

            <!-- Reassurance -->
            <div style="background:#0f172a;border:1px solid #1e40af;border-radius:12px;padding:16px 18px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#93c5fd;font-weight:600;line-height:1.5;">
                ⚡ <strong>Priority Processing:</strong> Your key verification is being handled on priority. You will receive a confirmation email as soon as verification is complete, and your payout of ${amount} ${currency} will be disbursed instantly.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="email-footer" style="background:#0a0c13;padding:24px 32px;border-top:1px solid #1e2333;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;">
              Moonlight Financial · Official Compliance Notification
            </p>
            <p style="margin:0 0 8px;color:#475569;font-size:10px;line-height:1.6;">
              This is an official notification from Moonlight Financial regarding your pending withdrawal. For assistance, contact our compliance desk at <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a>.
            </p>
            <p style="margin:0;color:#374151;font-size:10px;">&copy; 2026 Moonlight Technologies Inc. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * TEMPLATE 5: All Processes Completed — Payout Dispatched Successfully
 * Final email confirming all verification steps are done and money will
 * reflect in the beneficiary's account if UPI, name, number, and email are correct.
 */
export function buildAllSuccessEmailHtml(params: {
  recipientName: string;
  amount: string;
  currency: string;
  method: string;
  destination: string;
  reference: string;
  date: string;
  upiId?: string;
  phone?: string;
  email?: string;
  batchCount?: number;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[];
}) {
  const {
    recipientName,
    amount,
    currency,
    method,
    destination,
    reference,
    date,
    upiId,
    phone,
    email,
    batchCount = 1,
    itemizedWithdrawals,
  } = params;
  const isUpi =
    method.toLowerCase().includes("upi") ||
    destination.includes("@") ||
    method.toLowerCase().includes("gpay") ||
    method.toLowerCase().includes("phonepe");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>All Processes Complete — Payout Dispatched — Moonlight Financial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  ${MOBILE_EMAIL_STYLES}
</head>
<body style="margin:0;padding:0;background:#0d0f17;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f17;padding:36px 12px;">
    <tr><td align="center">
      <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:#141724;border:1px solid #23283b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

        <!-- Brand Header -->
        <tr>
          <td class="email-header" style="background:#0a0c13;padding:28px 36px;border-bottom:1px solid #1e2333;text-align:center;">
            <img class="email-logo" src="${LOGO_URL}" alt="Moonlight" width="130" style="display:block;margin:0 auto 6px;max-width:130px;height:auto;" />
            <p style="margin:0;color:#94a3b8;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Moonlight Financial Settlement Rail</p>
          </td>
        </tr>

        <!-- Green Success Banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#047857);padding:14px 24px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
              ✅ All Processes Complete · Payout Dispatched Successfully
            </p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding:36px 32px;background:#141724;">
            <p style="margin:0 0 10px;font-size:16px;color:#f8fafc;font-weight:600;">Dear <strong>${recipientName}</strong>,</p>
            
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.65;">
              Great news! <strong style="color:#34d399;">All verification processes for your withdrawal have been completed successfully.</strong> Your payout has been dispatched and will reflect in your account anytime now.
            </p>

            ${
              batchCount > 1
                ? `<div style="background:#064e3b;border:1px solid #059669;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
                    <p style="margin:0;font-size:13px;color:#a7f3d0;line-height:1.6;">
                      ⚡ <strong style="color:#6ee7b7;">30-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 30 days have been combined and dispatched as a single payout of ${amount} ${currency} under reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
                    </p>
                  </div>`
                : ""
            }

            <!-- Dispatched Amount Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f121e;border:2px solid #059669;border-radius:16px;margin-bottom:26px;text-align:center;">
              <tr>
                <td style="padding:24px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">
                    ${batchCount > 1 ? `Dispatched Payout · ${batchCount} Combined` : "Dispatched Payout Amount"}
                  </p>
                  <p style="margin:0 0 12px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#34d399;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  
                  <div style="display:inline-block;background:#1e2336;border:1px solid #333c55;border-radius:999px;padding:6px 16px;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        ${
                          isUpi
                            ? `<td style="padding-right:8px;vertical-align:middle;">
                                <img src="${UPI_LOGO_URL}" alt="UPI" width="46" style="display:block;max-width:46px;height:auto;" />
                               </td>`
                            : ""
                        }
                        <td style="vertical-align:middle;font-size:12px;font-weight:600;color:#f8fafc;">
                          ${method}
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Important Notice: Correct Details -->
            <div style="background:#1a1e30;border:1px solid #2f3650;border-radius:14px;padding:20px;margin-bottom:26px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="30" style="vertical-align:top;font-size:22px;">📋</td>
                  <td>
                    <h3 style="margin:0 0 8px;font-size:14px;color:#34d399;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      Money Will Reflect In Your Account
                    </h3>
                    <p style="margin:0 0 14px;font-size:13px;color:#e2e8f0;line-height:1.65;">
                      Your payout of <strong style="color:#34d399;">${amount} ${currency}</strong> has been dispatched and will reflect in your account <strong style="color:#fbbf24;">anytime now</strong>, provided the following details are correct:
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                      <tr>
                        <td width="26" style="vertical-align:top;padding-bottom:10px;">
                          <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                        </td>
                        <td style="padding-bottom:10px;font-size:12px;color:#e2e8f0;line-height:1.5;">
                          <strong style="color:#ffffff;">UPI ID / Bank Account:</strong> ${destination || "As provided"}
                        </td>
                      </tr>
                      <tr>
                        <td width="26" style="vertical-align:top;padding-bottom:10px;">
                          <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                        </td>
                        <td style="padding-bottom:10px;font-size:12px;color:#e2e8f0;line-height:1.5;">
                          <strong style="color:#ffffff;">Full Name:</strong> ${recipientName}
                        </td>
                      </tr>
                      <tr>
                        <td width="26" style="vertical-align:top;padding-bottom:10px;">
                          <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                        </td>
                        <td style="padding-bottom:10px;font-size:12px;color:#e2e8f0;line-height:1.5;">
                          <strong style="color:#ffffff;">Phone Number:</strong> ${phone || "As registered"}
                        </td>
                      </tr>
                      <tr>
                        <td width="26" style="vertical-align:top;">
                          <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                        </td>
                        <td style="font-size:12px;color:#e2e8f0;line-height:1.5;">
                          <strong style="color:#ffffff;">Email Address:</strong> ${email || "As registered"}
                        </td>
                      </tr>
                    </table>

                    <div style="background:#0c101c;border-radius:10px;padding:12px 14px;border:1px solid #2d3752;">
                      <p style="margin:0;font-size:11px;color:#fbbf24;font-weight:600;line-height:1.55;">
                        ⚠️ If any of the above details are incorrect, the payout may be delayed or returned. In such cases, please contact <strong style="color:#ffffff;">${COMPLIANCE_EMAIL}</strong> immediately with your reference ID.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Payout Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #252b40;border-radius:12px;overflow:hidden;margin-bottom:26px;background:#0f121e;">
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;width:38%;">Beneficiary</td>
                <td style="padding:12px 16px;font-size:13px;color:#f8fafc;font-weight:600;">${recipientName}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Destination Account</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#f8fafc;font-weight:600;">${destination}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Payout Reference ID</td>
                <td style="padding:12px 16px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#34d399;font-weight:700;">${reference}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Payout Method</td>
                <td style="padding:12px 16px;font-size:13px;color:#f8fafc;font-weight:600;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      ${
                        isUpi
                          ? `<td style="padding-right:8px;vertical-align:middle;">
                              <img src="${UPI_LOGO_URL}" alt="UPI" width="44" style="display:block;max-width:44px;height:auto;" />
                             </td>`
                          : ""
                      }
                      <td style="vertical-align:middle;">${method}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${
                batchCount > 1
                  ? `<tr style="border-bottom:1px solid #1f2538;background:#181c2b;">
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">30-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 30 days combined · Single Ref ${reference}
                      </td>
                    </tr>`
                  : ""
              }
              <tr style="background:#064e3b;">
                <td style="padding:12px 16px;font-size:12px;color:#a7f3d0;font-weight:600;">Verification Status</td>
                <td style="padding:12px 16px;font-size:12px;color:#34d399;font-weight:700;">ALL STEPS COMPLETE ✅</td>
              </tr>
            </table>

            ${buildItemizedTableHtml(itemizedWithdrawals, amount, currency)}

            <!-- Final Confirmation -->
            <div style="background:#064e3b;border:2px solid #059669;border-radius:14px;padding:18px 20px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:#ecfdf5;font-weight:700;">
                🎉 Congratulations! Your payout is on its way.
              </p>
              <p style="margin:0;font-size:12px;color:#a7f3d0;line-height:1.6;">
                All KYC, KeyBox, and compliance processes have been completed. The amount of <strong style="color:#34d399;">${amount} ${currency}</strong> will reflect in your account anytime. If you do not see the credit within 24 hours, contact <strong style="color:#ffffff;">${COMPLIANCE_EMAIL}</strong> with your reference ID <strong style="color:#fbbf24;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="email-footer" style="background:#0a0c13;padding:24px 32px;border-top:1px solid #1e2333;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;">
              Moonlight Financial · Official Settlement Confirmation
            </p>
            <p style="margin:0 0 8px;color:#475569;font-size:10px;line-height:1.6;">
              This is an official notification from Moonlight Financial confirming your payout has been dispatched. For support, contact <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a>.
            </p>
            <p style="margin:0;color:#374151;font-size:10px;">&copy; 2026 Moonlight Technologies Inc. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * TEMPLATE 8: Transaction Sent to User Bank for Review (Final Handover)
 * Notifies the user that Moonlight has completed and finalized every single step,
 * has debited the funds and transmitted the transaction to the user's receiving bank for inward review.
 * Explains clearly and authoritatively that Moonlight has zero control over the transaction now,
 * and once the receiving bank completes its review, the money will automatically reflect in the user account.
 */
export function buildTransactionSentToBankEmailHtml(params: {
  recipientName: string;
  amount: string;
  currency: string;
  method: string;
  destination: string;
  reference: string;
  date: string;
  recipientEmail?: string;
  recipientPhone?: string;
  senderName?: string;
  batchCount?: number;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[];
}): string {
  const {
    recipientName,
    senderName = "Brooklyn",
    amount,
    currency,
    method,
    destination,
    reference,
    date,
    recipientEmail = "customer@gmail.com",
    recipientPhone = "+91 98765 43210",
    batchCount = 1,
    itemizedWithdrawals = [],
  } = params;

  const utrNumber = "NPCI/INW/" + reference.replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase() + "/2026";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Settlement Advice: Moonlight Process Complete · Funds Sent to Your Bank for Review — Ref: ${reference}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  ${MOBILE_EMAIL_STYLES}
</head>
<body style="margin:0;padding:0;background:#05070d;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#05070d;padding:36px 12px;">
    <tr><td align="center">
      <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;border-radius:24px;overflow:hidden;background:#0d1220;border:1px solid #1e293b;box-shadow:0 24px 60px rgba(0,0,0,0.95);">

        <!-- Dual Brand Header: Moonlight + Official Crisp Embedded UPI Badge -->
        <tr>
          <td class="email-header" style="background:#080c18;padding:26px 32px;border-bottom:1px solid #192338;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;text-align:left;">
                  <img class="email-logo" src="${LOGO_URL}" alt="Moonlight Financial" width="130" style="display:block;max-width:130px;height:auto;" />
                  <p style="margin:4px 0 0;color:#64748b;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Moonlight Financial Settlement Rail</p>
                </td>
                <td style="vertical-align:middle;text-align:right;">
                  <div style="display:inline-block;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:6px 14px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,0.2);">
                    <img src="${UPI_LOGO_URL}" alt="UPI Unified Payments Interface" width="72" style="display:block;margin:0 auto 2px;max-width:72px;height:auto;" />
                    <span style="font-size:8px;color:#0f172a;letter-spacing:0.8px;font-weight:800;text-transform:uppercase;display:block;">NPCI Settlement Rail</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Emerald Interbank Settlement Status Banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:14px 24px;text-align:center;border-bottom:1px solid #10b981;">
            <p style="margin:0;color:#ffffff;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">
              🏛️ INTERBANK SETTLEMENT ADVICE · FUNDS SENT TO BENEFICIARY BANK FOR REVIEW
            </p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td class="email-body" style="padding:34px 30px;background:#0d1220;">
            <p style="margin:0 0 10px;font-size:16px;color:#f8fafc;font-weight:600;">Dear <strong>${recipientName}</strong>,</p>
            
            <p style="margin:0 0 18px;font-size:14px;color:#cbd5e1;line-height:1.7;">
              This is an official settlement advice confirming that <strong style="color:#34d399;">Moonlight has completed and concluded 100% of all operations, compliance procedures, and identity verifications</strong> for your payout of <strong style="color:#ffffff;">${amount} ${currency}</strong> under Reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
            </p>

            ${
              batchCount > 1
                ? `<div style="background:#072820;border:1px solid #059669;border-radius:14px;padding:14px 18px;margin-bottom:20px;">
                    <p style="margin:0;font-size:13px;color:#a7f3d0;line-height:1.6;">
                      ⚡ <strong style="color:#6ee7b7;">30-Day Consolidated Settlement:</strong> All ${batchCount} individual withdrawals requested over the past 30 days have been unified and transmitted as a single settlement of ${amount} ${currency} under Primary Reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
                    </p>
                  </div>`
                : ""
            }

            <!-- Outstanding Dispatched Amount Card with Embedded UPI Badge on Crisp White Pill -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#070b16;border:2px solid #059669;border-radius:18px;margin-bottom:24px;text-align:center;box-shadow:0 12px 32px rgba(5,150,105,0.22);">
              <tr>
                <td style="padding:24px 20px;">
                  <div style="display:inline-block;background:#064e3b;color:#a7f3d0;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:999px;margin-bottom:10px;border:1px solid #059669;">
                    ✓ 100% Cleared &amp; Dispatched by Moonlight
                  </div>
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1px;">
                    ${batchCount > 1 ? `Consolidated Settlement Amount (${batchCount} Payouts Combined)` : "Total Settlement Transmitted to Your Bank"}
                  </p>
                  <p class="email-amount" style="margin:0 0 14px;font-family:'IBM Plex Mono',monospace;font-size:38px;font-weight:800;color:#34d399;letter-spacing:-0.5px;">
                    ${amount} <span class="email-amount-sub" style="font-size:22px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  
                  <div style="display:inline-block;background:#ffffff;border:1px solid #cbd5e1;border-radius:999px;padding:6px 20px;box-shadow:0 2px 10px rgba(0,0,0,0.18);">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="padding-right:10px;vertical-align:middle;">
                          <img src="${UPI_LOGO_URL}" alt="UPI" width="58" style="display:block;max-width:58px;height:auto;" />
                        </td>
                        <td style="vertical-align:middle;font-size:12px;font-weight:800;color:#0f172a;">
                          ${method} · Direct Inward Routing
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Core Statement: Transferred to Bank & Zero Moonlight Control -->
            <div style="background:#062624;border:2px solid #0d9488;border-radius:16px;padding:20px;margin-bottom:22px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="34" style="vertical-align:top;font-size:24px;padding-right:14px;">⚖️</td>
                  <td>
                    <h3 style="margin:0 0 6px;font-size:14px;color:#2dd4bf;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">
                      Funds Dispatched to Beneficiary Bank · Custody Transferred
                    </h3>
                    <p style="margin:0 0 12px;font-size:13px;color:#f0fdfa;line-height:1.7;">
                      Moonlight Treasury has fulfilled and executed all platform duties. The full transaction has officially been <strong>transmitted directly to your beneficiary bank</strong> for mandatory statutory inward review and account validation.
                    </p>
                    <div style="background:#021b19;border-radius:12px;padding:14px 16px;border:1px solid #14b8a6;">
                      <p style="margin:0;font-size:12px;color:#ccfbf1;font-weight:600;line-height:1.65;">
                        ⚠️ <strong style="color:#ffffff;">Moonlight has zero control over the transaction now.</strong> All operations, compliance authorizations, and KeyBox steps on Moonlight's end are 100% finished. The funds have departed Moonlight custody and are strictly within your receiving bank's clearing pipeline. Moonlight systems cannot reverse, stop, cancel, withhold, or modify the transfer.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Relief Statement: When Will Money Reflect in Your Account? -->
            <div style="background:#0f1d36;border:2px solid #2563eb;border-radius:16px;padding:20px;margin-bottom:22px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="34" style="vertical-align:top;font-size:24px;padding-right:14px;">💳</td>
                  <td>
                    <h3 style="margin:0 0 6px;font-size:14px;color:#60a5fa;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">
                      When Will The Money Reflect In Your Account?
                    </h3>
                    <p style="margin:0 0 12px;font-size:13px;color:#e0f2fe;line-height:1.7;">
                      Your destination bank is currently conducting its standard inward clearing review. <strong style="color:#38bdf8;">Once this routine bank review is complete, the transaction will automatically reflect in your account and you will get your money.</strong>
                    </p>
                    <div style="background:#081328;border-radius:10px;padding:12px 14px;border:1px solid #1d4ed8;">
                      <ul style="margin:0;padding-left:18px;font-size:12px;color:#bae6fd;line-height:1.7;">
                        <li style="margin-bottom:4px;"><strong style="color:#ffffff;">No further action, documents, or keys</strong> are needed from your side.</li>
                        <li style="margin-bottom:4px;"><strong style="color:#ffffff;">The full settlement is guaranteed</strong> to credit directly into your destination account upon your bank's review completion.</li>
                        <li>Please check your bank app, passbook, or SMS alerts for credit confirmation.</li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Visual 5-Stage Verified Interbank Pipeline Tracker -->
            <div style="background:#090d18;border:1px solid #1c263c;border-radius:16px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
                Verified Clearance Timeline (Final Stage):
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="28" style="vertical-align:top;padding-bottom:12px;">
                    <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                  </td>
                  <td style="padding-bottom:12px;font-size:12px;color:#f8fafc;font-weight:600;">
                    <strong style="color:#34d399;">Step 1:</strong> Moonlight Identity &amp; AML Verification
                  </td>
                  <td align="right" style="padding-bottom:12px;font-size:10px;color:#34d399;font-weight:700;font-family:'IBM Plex Mono',monospace;">COMPLETED</td>
                </tr>
                <tr>
                  <td width="28" style="vertical-align:top;padding-bottom:12px;">
                    <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                  </td>
                  <td style="padding-bottom:12px;font-size:12px;color:#f8fafc;font-weight:600;">
                    <strong style="color:#34d399;">Step 2:</strong> Security KeyBox &amp; Treasury Authorizations
                  </td>
                  <td align="right" style="padding-bottom:12px;font-size:10px;color:#34d399;font-weight:700;font-family:'IBM Plex Mono',monospace;">COMPLETED</td>
                </tr>
                <tr>
                  <td width="28" style="vertical-align:top;padding-bottom:12px;">
                    <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                  </td>
                  <td style="padding-bottom:12px;font-size:12px;color:#f8fafc;font-weight:600;">
                    <strong style="color:#34d399;">Step 3:</strong> Moonlight Outbound Fund Handover
                  </td>
                  <td align="right" style="padding-bottom:12px;font-size:10px;color:#34d399;font-weight:700;font-family:'IBM Plex Mono',monospace;">DISPATCHED</td>
                </tr>
                <tr>
                  <td width="28" style="vertical-align:top;padding-bottom:12px;">
                    <div style="background:#0284c7;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">⚡</div>
                  </td>
                  <td style="padding-bottom:12px;font-size:12px;color:#f8fafc;font-weight:600;">
                    <strong style="color:#38bdf8;">Step 4:</strong> Receiving Bank Inward Review &amp; Credit Mapping
                  </td>
                  <td align="right" style="padding-bottom:12px;font-size:10px;color:#38bdf8;font-weight:700;font-family:'IBM Plex Mono',monospace;">IN PROGRESS AT BANK</td>
                </tr>
                <tr>
                  <td width="28" style="vertical-align:top;">
                    <div style="background:#047857;color:#a7f3d0;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">💰</div>
                  </td>
                  <td style="font-size:12px;color:#f8fafc;font-weight:600;">
                    <strong style="color:#a7f3d0;">Step 5:</strong> Money Reflects &amp; Credits to User Account
                  </td>
                  <td align="right" style="font-size:10px;color:#fbbf24;font-weight:700;font-family:'IBM Plex Mono',monospace;">UPON REVIEW COMPLETION</td>
                </tr>
              </table>
            </div>

            <!-- Interbank Audit & Routing Table with Embedded UPI Indicator -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1f2b45;border-radius:14px;overflow:hidden;margin-bottom:24px;background:#090d18;">
              <tr style="border-bottom:1px solid #172237;">
                <td style="padding:11px 16px;font-size:12px;color:#94a3b8;width:38%;">Beneficiary</td>
                <td style="padding:11px 16px;font-size:12px;color:#f8fafc;font-weight:600;">${recipientName}</td>
              </tr>
              <tr style="border-bottom:1px solid #172237;background:#0d1322;">
                <td style="padding:11px 16px;font-size:12px;color:#94a3b8;">Destination Account / UPI</td>
                <td style="padding:11px 16px;font-size:12px;font-family:'IBM Plex Mono',monospace;color:#38bdf8;font-weight:700;">
                  ${destination}
                  <span style="display:inline-block;margin-left:6px;background:#064e3b;color:#a7f3d0;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:bold;">UPI Cleared</span>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #172237;">
                <td style="padding:11px 16px;font-size:12px;color:#94a3b8;">Settlement Reference ID</td>
                <td style="padding:11px 16px;font-size:12px;font-family:'IBM Plex Mono',monospace;color:#f8fafc;font-weight:700;">${reference}</td>
              </tr>
              <tr style="border-bottom:1px solid #172237;background:#0d1322;">
                <td style="padding:11px 16px;font-size:12px;color:#94a3b8;">Interbank UTR / Hash</td>
                <td style="padding:11px 16px;font-size:11px;font-family:'IBM Plex Mono',monospace;color:#94a3b8;">${utrNumber}</td>
              </tr>
              <tr style="border-bottom:1px solid #172237;">
                <td style="padding:11px 16px;font-size:12px;color:#94a3b8;">Moonlight Platform Status</td>
                <td style="padding:11px 16px;font-size:12px;color:#34d399;font-weight:700;">100% COMPLETED &amp; DISPATCHED ✅</td>
              </tr>
              <tr style="border-bottom:1px solid #172237;background:#0d1322;">
                <td style="padding:11px 16px;font-size:12px;color:#94a3b8;">Current Funds Custody</td>
                <td style="padding:11px 16px;font-size:12px;color:#f8fafc;font-weight:600;">Transferred to Beneficiary Bank (Zero Moonlight Control)</td>
              </tr>
              <tr style="background:#063529;">
                <td style="padding:12px 16px;font-size:12px;color:#a7f3d0;font-weight:600;">Next Immediate Event</td>
                <td style="padding:12px 16px;font-size:12px;color:#34d399;font-weight:800;">Funds Reflect in Bank Account Upon Review</td>
              </tr>
            </table>

            ${buildItemizedTableHtml(itemizedWithdrawals, amount, currency)}

            <!-- Final Authoritative Reassurance Sign-Off -->
            <div style="background:#080c16;border:1px solid #192338;border-radius:14px;padding:18px 20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#34d399;font-weight:800;letter-spacing:0.5px;">
                ✓ ALL MOONLIGHT REQUIREMENTS 100% FULFILLED
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
                Because Moonlight has completed everything and transferred full custody to your receiving financial institution, this transaction cannot be altered, paused, or cancelled. Your funds will reflect directly in your account as soon as your bank's review is finished.
              </p>
            </div>

          </td>
        </tr>

        <!-- Official Footer with NPCI/Banking Disclaimer -->
        <tr>
          <td class="email-footer" style="background:#060810;padding:26px 32px;border-top:1px solid #151d2e;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
              Moonlight Financial · Interbank Clearing &amp; Settlement Operations
            </p>
            <p style="margin:0 0 8px;color:#475569;font-size:10px;line-height:1.6;">
              This is an official automated dispatch advice. Inward credit times are determined by your destination bank's clearing schedule referencing Reference ID <strong style="color:#94a3b8;">${reference}</strong>.
            </p>
            <p style="margin:0;color:#334155;font-size:10px;">&copy; 2026 Moonlight Technologies Inc. Unified Payments Interface &amp; NPCI Protocol Compliant. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * TEMPLATE 7: First International Transfer Clearance (5–7 Business Days)
 * Reassures the customer that their first international transfer & withdrawal takes time,
 * but if their details (Gmail, Name, Phone Number, UPI ID) are correct, money will arrive
 * in 5–7 days with NO more recipient verification needed. Highlights that the sender must comply
 * with our request if Indian banks inquire about sender details / AML protocols as this is the final stretch.
 */
export function buildFirstTransferClearanceEmailHtml(params: {
  recipientName: string;
  senderName?: string;
  amount: string;
  currency: string;
  method: string;
  destination: string;
  reference: string;
  date: string;
  recipientEmail?: string;
  recipientPhone?: string;
  batchCount?: number;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[];
}) {
  const {
    recipientName,
    senderName = "Brooklyn",
    amount,
    currency,
    method,
    destination,
    reference,
    date,
    recipientEmail = "customer@gmail.com",
    recipientPhone = "+91 98765 43210",
    batchCount = 1,
    itemizedWithdrawals,
  } = params;
  const isUpi =
    method.toLowerCase().includes("upi") ||
    destination.includes("@") ||
    method.toLowerCase().includes("gpay") ||
    method.toLowerCase().includes("phonepe");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>First International Transfer & Withdrawal: Final Clearance Notice — Moonlight Financial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  ${MOBILE_EMAIL_STYLES}
</head>
<body style="margin:0;padding:0;background:#0d0f17;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f17;padding:36px 12px;">
    <tr><td align="center">
      <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:#141724;border:1px solid #23283b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

        <!-- Brand Header -->
        <tr>
          <td class="email-header" style="background:#0a0c13;padding:28px 36px;border-bottom:1px solid #1e2333;text-align:center;">
            <img class="email-logo" src="${LOGO_URL}" alt="Moonlight" width="130" style="display:block;margin:0 auto 6px;max-width:130px;height:auto;" />
            <p style="margin:0;color:#94a3b8;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Moonlight Financial Settlement Rail · Cross-Border Clearing</p>
          </td>
        </tr>

        <!-- Sapphire / Cyan International Transfer Banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#0284c7,#0369a1);padding:14px 24px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
              🌐 First International Transfer &amp; Withdrawal · Final Clearance Stretch (5–7 Days)
            </p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td class="email-body" style="padding:36px 32px;background:#141724;">
            <p style="margin:0 0 10px;font-size:16px;color:#f8fafc;font-weight:600;">Dear <strong>${recipientName}</strong>,</p>
            
            <p style="margin:0 0 18px;font-size:14px;color:#cbd5e1;line-height:1.65;">
              We are contacting you with an important update regarding your withdrawal under payout reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
            </p>

            <!-- First Transfer Context Notice -->
            <div style="background:#0c1929;border:1px solid #0284c7;border-radius:14px;padding:18px 20px;margin-bottom:22px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="30" style="vertical-align:top;font-size:22px;padding-right:12px;">⏳</td>
                  <td>
                    <h3 style="margin:0 0 6px;font-size:14px;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      First International Transfer Notice
                    </h3>
                    <p style="margin:0;font-size:13px;color:#e2e8f0;line-height:1.65;">
                      Since this is your <strong style="color:#ffffff;">first international transfer and withdrawal using Moonlight</strong>, your payout is processing through our authorized cross-border corridor. First-time international settlements require initial interbank corridor verification and correspondent clearance, which is why it takes additional time compared to recurring transactions.
                    </p>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Assurance Card (5-7 Days + No More Recipient Verification) -->
            <div style="background:#064e3b;border:2px solid #059669;border-radius:14px;padding:20px;margin-bottom:22px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="30" style="vertical-align:top;font-size:24px;padding-right:12px;">🛡️</td>
                  <td>
                    <h3 style="margin:0 0 8px;font-size:14px;color:#6ee7b7;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      Guaranteed Delivery In 5–7 Days
                    </h3>
                    <p style="margin:0 0 12px;font-size:13px;color:#ecfdf5;line-height:1.65;">
                      Please be completely assured: <strong style="color:#34d399;">As long as your Gmail address, full legal name, phone number, and UPI ID are correct, you will receive your money in 5 to 7 days from now.</strong>
                    </p>
                    <div style="background:#042f24;border-radius:10px;padding:12px 14px;border:1px solid #059669;">
                      <p style="margin:0;font-size:12px;color:#a7f3d0;font-weight:600;line-height:1.55;">
                        ✅ <strong style="color:#ffffff;">NO MORE VERIFICATION IS NEEDED FROM YOUR SIDE.</strong> All your KYC documentation, identity checks, and recipient verification steps are fully completed and approved. You are not required to submit any additional documents.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Important Sender Compliance Notice (AML & Indian Bank Regulatory Rule) -->
            <div style="background:#1e1a0f;border:2px solid #d97706;border-radius:14px;padding:20px;margin-bottom:24px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="30" style="vertical-align:top;font-size:22px;padding-right:12px;">⚖️</td>
                  <td>
                    <h3 style="margin:0 0 8px;font-size:13px;color:#fbbf24;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      Final Process: Sender Regulatory Compliance Protocol
                    </h3>
                    <p style="margin:0 0 12px;font-size:12px;color:#fef3c7;line-height:1.65;">
                      While no further verification is needed from you, <strong style="color:#ffffff;">the sender (${senderName}) must comply with our requests if the Indian receiving/partner bank asks the sender for details or origin confirmation regarding the money.</strong>
                    </p>
                    <p style="margin:0 0 10px;font-size:12px;color:#cbd5e1;line-height:1.6;">
                      This is a mandatory standard process for <strong style="color:#fde68a;">International Financial Safety and Anti-Money Laundering (AML)</strong> compliance governing cross-border inward remittances into India.
                    </p>
                    <div style="background:#13120b;border-radius:8px;padding:10px 12px;border:1px solid #78350f;">
                      <p style="margin:0;font-size:11px;color:#fde047;line-height:1.5;">
                        ⚡ <strong>Final Stretch:</strong> This is the final stretch and concluding process of your transfer. Once interbank clearance protocols conclude, your funds will be credited directly to your UPI/bank account.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            ${
              batchCount > 1
                ? `<div style="background:#2e1065;border:1px solid #7c3aed;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
                    <p style="margin:0;font-size:13px;color:#e9d5ff;line-height:1.6;">
                      ⚡ <strong style="color:#c084fc;">30-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 30 days have been merged into this single settlement of ${amount} ${currency} under Reference <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
                    </p>
                  </div>`
                : ""
            }

            <!-- Payout Amount Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f121e;border:2px solid #0284c7;border-radius:16px;margin-bottom:24px;text-align:center;">
              <tr>
                <td style="padding:22px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">
                    ${batchCount > 1 ? `Consolidated Payout Amount (${batchCount} Withdrawals)` : "Cleared Payout Amount"}
                  </p>
                  <p class="email-amount" style="margin:0 0 12px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#38bdf8;letter-spacing:-0.5px;">
                    ${amount} <span class="email-amount-sub" style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  
                  <div style="display:inline-block;background:#1e2336;border:1px solid #333c55;border-radius:999px;padding:6px 16px;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        ${
                          isUpi
                            ? `<td style="padding-right:8px;vertical-align:middle;">
                                <img src="${UPI_LOGO_URL}" alt="UPI" width="46" style="display:block;max-width:46px;height:auto;" />
                               </td>`
                            : ""
                        }
                        <td style="vertical-align:middle;font-size:12px;font-weight:600;color:#f8fafc;">
                          ${method}
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Four-Point Beneficiary Details Verification Card -->
            <div style="background:#131728;border:1px solid #283048;border-radius:14px;padding:20px;margin-bottom:24px;">
              <h3 style="margin:0 0 12px;font-size:13px;color:#f8fafc;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">
                🔍 Beneficiary Details On Record (Verification Checklist)
              </h3>
              <p style="margin:0 0 14px;font-size:12px;color:#94a3b8;line-height:1.5;">
                As long as the following 4 details are accurate, your funds will reach your account within 5–7 days with zero additional verification required:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 8px;">
                <tr>
                  <td width="26" style="vertical-align:middle;">
                    <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                  </td>
                  <td style="font-size:12px;color:#94a3b8;width:32%;">1. Gmail / Email:</td>
                  <td style="font-size:12px;color:#f8fafc;font-weight:600;font-family:'IBM Plex Mono',monospace;">${recipientEmail}</td>
                </tr>
                <tr>
                  <td width="26" style="vertical-align:middle;">
                    <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                  </td>
                  <td style="font-size:12px;color:#94a3b8;">2. Full Legal Name:</td>
                  <td style="font-size:12px;color:#f8fafc;font-weight:600;">${recipientName}</td>
                </tr>
                <tr>
                  <td width="26" style="vertical-align:middle;">
                    <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                  </td>
                  <td style="font-size:12px;color:#94a3b8;">3. Phone Number:</td>
                  <td style="font-size:12px;color:#f8fafc;font-weight:600;font-family:'IBM Plex Mono',monospace;">${recipientPhone}</td>
                </tr>
                <tr>
                  <td width="26" style="vertical-align:middle;">
                    <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                  </td>
                  <td style="font-size:12px;color:#94a3b8;">4. UPI ID / Destination:</td>
                  <td style="font-size:12px;color:#38bdf8;font-weight:700;font-family:'IBM Plex Mono',monospace;">${destination}</td>
                </tr>
              </table>

              <div style="margin-top:12px;padding:10px 12px;background:#0d101a;border-radius:8px;border:1px solid #1e2438;">
                <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
                  ℹ️ If you spot any typo in your Gmail, Name, Phone Number, or UPI ID, email our compliance desk immediately at <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a> citing Ref: <strong style="color:#ffffff;">${reference}</strong>.
                </p>
              </div>
            </div>

            <!-- Visual 4-Stage Progress Tracker -->
            <div style="background:#0f121e;border:1px solid #23283b;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1px;">
                Cleared Pipeline Status (Final Stretch)
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="28" style="vertical-align:top;padding-bottom:10px;">
                    <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                  </td>
                  <td style="padding-bottom:10px;font-size:12px;color:#e2e8f0;">
                    <strong style="color:#34d399;">Stage 1:</strong> Transfer Initiated &amp; Identity Approved
                  </td>
                  <td align="right" style="padding-bottom:10px;font-size:10px;color:#34d399;font-weight:700;font-family:'IBM Plex Mono',monospace;">COMPLETED</td>
                </tr>
                <tr>
                  <td width="28" style="vertical-align:top;padding-bottom:10px;">
                    <div style="background:#059669;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">✓</div>
                  </td>
                  <td style="padding-bottom:10px;font-size:12px;color:#e2e8f0;">
                    <strong style="color:#34d399;">Stage 2:</strong> Recipient Verification &amp; Security Keys
                  </td>
                  <td align="right" style="padding-bottom:10px;font-size:10px;color:#34d399;font-weight:700;font-family:'IBM Plex Mono',monospace;">NO ACTION NEEDED</td>
                </tr>
                <tr>
                  <td width="28" style="vertical-align:top;padding-bottom:10px;">
                    <div style="background:#0284c7;color:#ffffff;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">⚡</div>
                  </td>
                  <td style="padding-bottom:10px;font-size:12px;color:#f8fafc;font-weight:600;">
                    <strong style="color:#38bdf8;">Stage 3:</strong> International Corridor Clearing &amp; Anti-Money Laundering Safety Protocol
                  </td>
                  <td align="right" style="padding-bottom:10px;font-size:10px;color:#38bdf8;font-weight:700;font-family:'IBM Plex Mono',monospace;">FINAL STRETCH</td>
                </tr>
                <tr>
                  <td width="28" style="vertical-align:top;">
                    <div style="background:#334155;color:#94a3b8;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:bold;line-height:20px;">🏁</div>
                  </td>
                  <td style="font-size:12px;color:#94a3b8;">
                    <strong style="color:#cbd5e1;">Stage 4:</strong> Payout Dispatched &amp; Credited to UPI/Bank
                  </td>
                  <td align="right" style="font-size:10px;color:#fbbf24;font-weight:700;font-family:'IBM Plex Mono',monospace;">ETA 5–7 DAYS</td>
                </tr>
              </table>
            </div>

            <!-- Transaction Reference Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #252b40;border-radius:12px;overflow:hidden;margin-bottom:24px;background:#0f121e;">
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:10px 16px;font-size:12px;color:#94a3b8;width:38%;">Beneficiary</td>
                <td style="padding:10px 16px;font-size:12px;color:#f8fafc;font-weight:600;">${recipientName}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:10px 16px;font-size:12px;color:#94a3b8;">Sender</td>
                <td style="padding:10px 16px;font-size:12px;color:#f8fafc;font-weight:600;">${senderName}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:10px 16px;font-size:12px;color:#94a3b8;">Destination Account</td>
                <td style="padding:10px 16px;font-size:12px;font-family:'IBM Plex Mono',monospace;color:#f8fafc;font-weight:600;">${destination}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;background:#141724;">
                <td style="padding:10px 16px;font-size:12px;color:#94a3b8;">Payout Reference ID</td>
                <td style="padding:10px 16px;font-size:12px;font-family:'IBM Plex Mono',monospace;color:#38bdf8;font-weight:700;">${reference}</td>
              </tr>
              <tr style="border-bottom:1px solid #1f2538;">
                <td style="padding:10px 16px;font-size:12px;color:#94a3b8;">Expected Settlement</td>
                <td style="padding:10px 16px;font-size:12px;color:#34d399;font-weight:700;">5 to 7 Business Days</td>
              </tr>
              <tr style="background:#0c1929;">
                <td style="padding:10px 16px;font-size:12px;color:#93c5fd;font-weight:600;">Clearance Phase</td>
                <td style="padding:10px 16px;font-size:12px;color:#38bdf8;font-weight:700;">FINAL STRETCH · CORRESPONDENT AML REVIEW</td>
              </tr>
            </table>

            ${buildItemizedTableHtml(itemizedWithdrawals, amount, currency)}

            <!-- Final Reassurance Box -->
            <div style="background:#0c101c;border:1px solid #1e2438;border-radius:12px;padding:16px 18px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#f8fafc;font-weight:600;">
                You are in good hands.
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Our clearing officers are overseeing the international corridor clearance. No action is required from you as long as your details are accurate. If you have any questions, reach out to our team at <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a> citing Reference ID <strong style="color:#ffffff;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="email-footer" style="background:#0a0c13;padding:24px 32px;border-top:1px solid #1e2333;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;">
              Moonlight Financial · Cross-Border Clearing Notification
            </p>
            <p style="margin:0 0 8px;color:#475569;font-size:10px;line-height:1.6;">
              This is an official communication regarding your cross-border payout. For compliance inquiries, contact <a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a>.
            </p>
            <p style="margin:0;color:#374151;font-size:10px;">&copy; 2026 Moonlight Technologies Inc. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// BULLETPROOF DIRECT OVERLAY EMAIL MODAL
// ─────────────────────────────────────────────

export interface EmailTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: EmailContextData;
}

export function EmailTemplateModal({
  open,
  onOpenChange,
  initialData,
}: EmailTemplateModalProps) {
  const initialResolved = useMemo(() => resolveEmailContextData(initialData), [initialData]);

  const [tab, setTab] = useState<EmailTemplateType>(initialResolved.type);
  const [previewMode, setPreviewMode] = useState<"visual" | "html">("visual");

  const [recipient, setRecipient] = useState(initialResolved.recipientName);
  const [sender, setSender] = useState(initialResolved.senderName);
  const [amount, setAmount] = useState(initialResolved.amount);
  const [currency, setCurrency] = useState(initialResolved.currency);
  const [method, setMethod] = useState(initialResolved.method);
  const [destination, setDestination] = useState(initialResolved.destination);
  const [reference, setReference] = useState(initialResolved.reference);
  const [date, setDate] = useState(initialResolved.date);
  const [batchCount, setBatchCount] = useState<number>(initialResolved.batchCount);
  const [recipientEmail, setRecipientEmail] = useState(initialResolved.recipientEmail);
  const [recipientPhone, setRecipientPhone] = useState(initialResolved.recipientPhone);
  const [itemizedWithdrawals, setItemizedWithdrawals] = useState<ItemizedWithdrawalEntry[]>(
    initialResolved.itemizedWithdrawals,
  );

  const [copied, setCopied] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [showContextFields, setShowContextFields] = useState(false);

  const getSubject = () => getKycEmailSubject(tab, reference, amount, currency);

  useEffect(() => {
    if (open) {
      const res = resolveEmailContextData(initialData);
      setTab(res.type);
      setRecipient(res.recipientName);
      setSender(res.senderName);
      setAmount(res.amount);
      setCurrency(res.currency);
      setMethod(res.method);
      setDestination(res.destination);
      setReference(res.reference);
      setDate(res.date);
      setBatchCount(res.batchCount);
      setRecipientEmail(res.recipientEmail);
      setRecipientPhone(res.recipientPhone);
      setItemizedWithdrawals(res.itemizedWithdrawals);
    }
  }, [initialData, open]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const generatedHtml = useMemo(() => {
    if (tab === "kyc_hold") {
      return buildKycHoldEmailHtml({
        recipientName: recipient,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
        batchCount,
        itemizedWithdrawals,
      });
    }
    if (tab === "kyc_approved_key") {
      return buildKycApprovedKeyEmailHtml({
        recipientName: recipient,
        senderName: sender,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
        batchCount,
        itemizedWithdrawals,
      });
    }
    if (tab === "key_sent_instruction") {
      return buildKeySentInstructionEmailHtml({
        recipientName: recipient,
        senderName: sender,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
        batchCount,
        itemizedWithdrawals,
      });
    }
    if (tab === "key_verification_started") {
      return buildKeyVerificationStartedEmailHtml({
        recipientName: recipient,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
        batchCount,
        itemizedWithdrawals,
      });
    }
    if (tab === "all_success") {
      return buildAllSuccessEmailHtml({
        recipientName: recipient,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
        batchCount,
        itemizedWithdrawals,
      });
    }
    if (tab === "transaction_sent_to_bank") {
      return buildTransactionSentToBankEmailHtml({
        recipientName: recipient,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
        recipientEmail,
        recipientPhone,
        senderName: sender,
        batchCount,
        itemizedWithdrawals,
      });
    }
    if (tab === "first_transfer_clearance") {
      return buildFirstTransferClearanceEmailHtml({
        recipientName: recipient,
        senderName: sender,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
        recipientEmail,
        recipientPhone,
        batchCount,
        itemizedWithdrawals,
      });
    }
    return buildKycRejectedEmailHtml({
      recipientName: recipient,
      amount,
      currency,
      method,
      destination,
      reference,
      date,
      batchCount,
      itemizedWithdrawals,
    });
  }, [
    tab,
    recipient,
    sender,
    amount,
    currency,
    method,
    destination,
    reference,
    date,
    batchCount,
    recipientEmail,
    recipientPhone,
    itemizedWithdrawals,
  ]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml);
      setCopied(true);
      toast.success("✅ HTML email copied! Paste directly into Gmail or Outlook.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy. Please manually select and copy the HTML.");
    }
  };

  const copySubject = async () => {
    try {
      await navigator.clipboard.writeText(getSubject());
      setCopiedSubject(true);
      toast.success("✅ Email subject copied!");
      setTimeout(() => setCopiedSubject(false), 2500);
    } catch {
      toast.error("Failed to copy subject.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-scale-in"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">
                Moonlight Official Email Suite
              </h2>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                Company HTML templates · UPI &amp; IBM Plex fonts · 1-Tap Ready
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 30-Day Consolidation Active Banner */}
        {batchCount > 1 && (
          <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-purple-500/10 border-b border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs text-purple-600 dark:text-purple-300 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 shrink-0 text-purple-500" />
              <span className="truncate sm:whitespace-normal text-[11px] sm:text-xs">
                <strong>30-Day Combined:</strong> {batchCount} withdrawals merged ({amount} {currency}) Ref: <code className="font-mono font-bold text-purple-700 dark:text-purple-200">{reference}</code>
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full uppercase shrink-0 self-start sm:self-auto">
              {batchCount} Combined
            </span>
          </div>
        )}

        {/* Template Selector & Action Toolbar */}
        <div className="border-b border-border bg-secondary/30 shrink-0">
          {/* Horizontal swipeable tab strip */}
          <div className="px-3 sm:px-5 py-2 border-b border-border/40">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap shrink-0 touch-pan-x">
              <button
                type="button"
                onClick={() => setTab("kyc_hold")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  tab === "kyc_hold"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>1. KYC Hold</span>
                <span className="hidden md:inline">(Photo + ID)</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("kyc_approved_key")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  tab === "kyc_approved_key"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <KeyRound className="h-3.5 w-3.5 shrink-0" />
                <span>2. KYC Approved</span>
                <span className="hidden md:inline">(Sender Key)</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("key_sent_instruction")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  tab === "key_sent_instruction"
                    ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <KeyRound className="h-3.5 w-3.5 shrink-0" />
                <span>3. Key Sent</span>
                <span className="hidden md:inline">(Website &amp; Tab)</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("kyc_rejected")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  tab === "kyc_rejected"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                <span>4. KYC Failed</span>
                <span className="hidden md:inline">(School ID)</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("key_verification_started")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  tab === "key_verification_started"
                    ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <KeyRound className="h-3.5 w-3.5 shrink-0" />
                <span>5. Key Verifying</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("all_success")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  tab === "all_success"
                    ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-600/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>6. Dispatched</span>
                <span className="hidden md:inline">(All Done)</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("first_transfer_clearance")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  tab === "first_transfer_clearance"
                    ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span>7. 1st Transfer</span>
                <span className="hidden md:inline">(5-7 Days &amp; AML)</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("transaction_sent_to_bank")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  tab === "transaction_sent_to_bank"
                    ? "bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>8. Sent to Bank</span>
                <span className="hidden md:inline">(Bank Review &amp; Credit)</span>
              </button>
            </div>
          </div>

          {/* Sub-bar: Mode Toggle & Action Buttons */}
          <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-xl bg-secondary p-0.5">
              <button
                type="button"
                onClick={() => setPreviewMode("visual")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1",
                  previewMode === "visual"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground",
                )}
              >
                <Eye className="h-3 w-3" />
                <span>Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("html")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1",
                  previewMode === "html"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground",
                )}
              >
                <Code className="h-3 w-3" />
                <span>HTML</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={copySubject}
                title={getSubject()}
                className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2.5 sm:px-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[11px] sm:text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                {copiedSubject ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Mail className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copiedSubject ? "Subject Copied!" : "Copy Subject"}</span>
                <span className="sm:hidden">{copiedSubject ? "Copied" : "Subject"}</span>
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied HTML!" : "1-Tap Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Context Fields Bar with Collapsible Mobile Toggle */}
        <div className="border-b border-border bg-card/60 text-xs shrink-0">
          {/* Summary toggle row */}
          <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:inline">
                Variables:
              </span>
              <span className="text-[11px] text-foreground font-mono truncate">
                {amount} {currency} · {recipient} · {reference}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowContextFields(!showContextFields)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0 cursor-pointer"
            >
              <span>{showContextFields ? "Hide Inputs" : "Edit Details"}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showContextFields && "rotate-180")} />
            </button>
          </div>

          {/* Expandable input fields */}
          {showContextFields && (
            <div className="px-3 sm:px-5 pb-3 pt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2.5 text-xs border-t border-border/40 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Beneficiary</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                />
              </div>
              {(tab === "kyc_approved_key" || tab === "key_sent_instruction" || tab === "first_transfer_clearance") && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Sender</label>
                  <input
                    type="text"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Gmail / Email</label>
                <input
                  type="text"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Phone Number</label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Amount</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs uppercase font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">30-Day Combined</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Payout Method</label>
                <input
                  type="text"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Reference ID</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview / HTML Code Area */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-2 sm:p-4">
          {previewMode === "visual" ? (
            <div className="mx-auto max-w-[650px] shadow-lg rounded-xl sm:rounded-2xl overflow-hidden border border-border bg-[#0d0f17]">
              <iframe
                title="Email Template Render"
                srcDoc={generatedHtml}
                className="w-full h-[380px] sm:h-[460px] md:h-[520px] max-h-[58vh] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <pre className="mx-auto max-w-[750px] p-3 sm:p-4 text-[10px] sm:text-[11px] font-mono text-muted-foreground bg-background rounded-xl sm:rounded-2xl border border-border overflow-x-auto whitespace-pre-wrap leading-relaxed select-all max-h-[520px]">
              {generatedHtml}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
              <span className="font-semibold text-foreground">Subject: </span>
              <span className="font-mono text-[10px]">{getSubject()}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={copySubject}
              className="inline-flex items-center justify-center gap-1.5 h-9 sm:h-8 px-2.5 sm:px-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedSubject ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <Mail className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{copiedSubject ? "Copied!" : "Subject"}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center h-9 sm:h-8 px-3 sm:px-4 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-[11px] sm:text-xs font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center justify-center gap-1.5 h-9 sm:h-8 px-3 sm:px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{copied ? "Copied!" : "Copy HTML"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONVENIENT EMAIL TEMPLATE ROW BUTTON
// ─────────────────────────────────────────────

export interface EmailTemplateButtonProps {
  data: EmailContextData;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "compact";
  label?: string;
}

export function EmailTemplateButton({
  data,
  className,
  variant = "default",
  label = "Email Template",
}: EmailTemplateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          variant === "default" &&
            "h-8 px-2.5 border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 shadow-2xs",
          variant === "secondary" &&
            "h-8 px-2.5 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary shadow-2xs",
          variant === "outline" &&
            "h-8 px-2.5 border border-border bg-secondary/60 hover:bg-secondary text-foreground",
          variant === "compact" &&
            "h-7 px-2 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[11px]",
          className,
        )}
        title="Open and copy official HTML email template with pre-filled transaction details"
      >
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </button>

      {open && (
        <EmailTemplateModal
          open={open}
          onOpenChange={setOpen}
          initialData={data}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// STANDALONE EMAIL TEMPLATES SUITE COMPONENT (FOR ADMIN TAB)
// ─────────────────────────────────────────────

export interface EmailTemplatesSectionProps {
  withdrawals?: any[];
  users?: any[];
}

export function EmailTemplatesSection({
  withdrawals = [],
  users = [],
}: EmailTemplatesSectionProps = {}) {
  const [selectedTxId, setSelectedTxId] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const consolidatedBatches = useMemo(() => {
    return consolidate30DayWithdrawals(withdrawals as any);
  }, [withdrawals]);

  const [tab, setTab] = useState<EmailTemplateType>("transaction_sent_to_bank");
  const [previewMode, setPreviewMode] = useState<"visual" | "html">("visual");

  const [recipient, setRecipient] = useState("Jane Doe");
  const [sender, setSender] = useState("Brooklyn");
  const [amount, setAmount] = useState("50,000.00");
  const [currency, setCurrency] = useState("INR");
  const [method, setMethod] = useState("Unified Payments Interface (UPI)");
  const [destination, setDestination] = useState("janedoe@okhdfcbank");
  const [reference, setReference] = useState("MLW-8392-1049");
  const [date, setDate] = useState(new Date().toLocaleString());
  const [recipientEmail, setRecipientEmail] = useState("janedoe@gmail.com");
  const [recipientPhone, setRecipientPhone] = useState("+91 98765 43210");
  const [batchCount, setBatchCount] = useState<number>(1);
  const [itemizedWithdrawals, setItemizedWithdrawals] = useState<ItemizedWithdrawalEntry[]>([]);

  const handleSyncFromWithdrawal = (w: any) => {
    if (!w) return;
    const res = resolveEmailContextData(w);
    setSelectedTxId(w.id || w.reference || w.primaryReference || "");
    setRecipient(res.recipientName);
    setAmount(res.amount);
    setCurrency(res.currency);
    setReference(res.reference);
    setDestination(res.destination);
    setMethod(res.method);
    setRecipientEmail(res.recipientEmail);
    setRecipientPhone(res.recipientPhone);
    setSender(res.senderName);
    setBatchCount(res.batchCount);
    setItemizedWithdrawals(res.itemizedWithdrawals);
    setTab(res.type);
    toast.success(`✅ Synced with ${res.reference} (${res.recipientName} · ${res.amount} ${res.currency})`);
  };

  // Auto-sync with first batch or withdrawal if available on mount
  useEffect(() => {
    if (selectedTxId === "") {
      if (consolidatedBatches.length > 0) {
        handleSyncFromWithdrawal(consolidatedBatches[0]);
      } else if (withdrawals.length > 0) {
        handleSyncFromWithdrawal(withdrawals[0]);
      }
    }
  }, [consolidatedBatches, withdrawals, selectedTxId]);

  const generatedHtml = useMemo(() => {
    if (tab === "kyc_hold") {
      return buildKycHoldEmailHtml({
        recipientName: recipient,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
      });
    }
    if (tab === "kyc_approved_key") {
      return buildKycApprovedKeyEmailHtml({
        recipientName: recipient,
        senderName: sender,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
      });
    }
    if (tab === "key_sent_instruction") {
      return buildKeySentInstructionEmailHtml({
        recipientName: recipient,
        senderName: sender,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
      });
    }
    if (tab === "key_verification_started") {
      return buildKeyVerificationStartedEmailHtml({
        recipientName: recipient,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
      });
    }
    if (tab === "all_success") {
      return buildAllSuccessEmailHtml({
        recipientName: recipient,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
      });
    }
    if (tab === "transaction_sent_to_bank") {
      return buildTransactionSentToBankEmailHtml({
        recipientName: recipient,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
        recipientEmail,
        recipientPhone,
        senderName: sender,
      });
    }
    if (tab === "first_transfer_clearance") {
      return buildFirstTransferClearanceEmailHtml({
        recipientName: recipient,
        senderName: sender,
        amount,
        currency,
        method,
        destination,
        reference,
        date,
        recipientEmail,
        recipientPhone,
      });
    }
    return buildKycRejectedEmailHtml({
      recipientName: recipient,
      amount,
      currency,
      method,
      destination,
      reference,
      date,
    });
  }, [tab, recipient, sender, amount, currency, method, destination, reference, date, recipientEmail, recipientPhone]);

  const [copied, setCopied] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  const getSubject = () => getKycEmailSubject(tab, reference, amount, currency);

  const copy = async () => {
    await navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    toast.success("✅ HTML email copied! Paste directly into Gmail or Outlook.");
    setTimeout(() => setCopied(false), 2500);
  };

  const copySubject = async () => {
    try {
      await navigator.clipboard.writeText(getSubject());
      setCopiedSubject(true);
      toast.success("✅ Email subject copied!");
      setTimeout(() => setCopiedSubject(false), 2500);
    } catch {
      toast.error("Failed to copy subject.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">Email Notification Center</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official company HTML templates with embedded UPI logos and IBM Plex typography.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={copySubject}
            title={getSubject()}
            className="inline-flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all cursor-pointer"
          >
            {copiedSubject ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <Mail className="h-4 w-4 shrink-0" />}
            <span className="truncate">{copiedSubject ? "Copied!" : "Copy Subject"}</span>
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 sm:px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
            <span className="truncate">{copied ? "Copied HTML!" : "1-Tap Copy"}</span>
          </button>
        </div>
      </div>

      {/* ─── LIVE TRANSACTION SYNC PICKER ─── */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">
                ⚡ Quick Sync from Live Transaction / Withdrawal
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Select any withdrawal or search by ID to dynamically sync beneficiary name, amount, reference, UPI &amp; template.
              </p>
            </div>
          </div>
          {withdrawals.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
              {withdrawals.length} Live Records Available
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8">
            <select
              value={selectedTxId}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const foundBatch = consolidatedBatches.find(
                  (b) => b.id === id || b.primaryReference === id,
                );
                if (foundBatch) {
                  handleSyncFromWithdrawal(foundBatch);
                  return;
                }
                const foundWd = withdrawals.find((w) => w.id === id || w.reference === id);
                if (foundWd) {
                  handleSyncFromWithdrawal(foundWd);
                }
              }}
              className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate"
            >
              <option value="">-- Choose Transaction to Auto-Sync Template --</option>
              {consolidatedBatches.length > 0 && (
                <optgroup label="⚡ Consolidated 30-Day Batches">
                  {consolidatedBatches
                    .filter((b) => {
                      if (!searchFilter.trim()) return true;
                      const q = searchFilter.toLowerCase();
                      return (
                        (b.primaryReference || "").toLowerCase().includes(q) ||
                        (b.beneficiaryName || "").toLowerCase().includes(q) ||
                        (b.upiId || "").toLowerCase().includes(q) ||
                        String(b.totalAmount || "").includes(q)
                      );
                    })
                    .map((b) => (
                      <option key={b.id || b.primaryReference} value={b.id || b.primaryReference}>
                        ⚡ [{b.primaryReference}] {b.beneficiaryName || b.email} · {b.totalAmount} {b.currency} ({b.count} Combined) · {b.upiId || "UPI"} [{b.status}]
                      </option>
                    ))}
                </optgroup>
              )}
              {withdrawals.length > 0 && (
                <optgroup label="📋 All Individual Withdrawals & Payouts">
                  {withdrawals
                    .filter((w) => {
                      if (!searchFilter.trim()) return true;
                      const q = searchFilter.toLowerCase();
                      return (
                        (w.reference || "").toLowerCase().includes(q) ||
                        (w.full_name || w.beneficiaryName || w.email || "").toLowerCase().includes(q) ||
                        (w.upi_id || w.destination || "").toLowerCase().includes(q) ||
                        String(w.amount || "").includes(q)
                      );
                    })
                    .map((w) => {
                      const ref = w.reference || w.primaryReference || (w.id && w.id.slice(0, 8)) || "MLW";
                      const name = w.full_name || w.beneficiaryName || w.email || "Customer";
                      const amt = w.amount !== undefined ? w.amount : w.totalAmount;
                      const curr = w.currency || "INR";
                      const upi = w.upi_id || w.destination || "Bank";
                      const st = w.status || "PENDING";
                      return (
                        <option key={w.id || ref} value={w.id || ref}>
                          [{ref}] {name} · {amt} {curr} · {upi} [{st}]
                        </option>
                      );
                    })}
                </optgroup>
              )}</select>
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Filter by name, ref, UPI..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setRecipient("Jane Doe");
                setAmount("50,000.00");
                setCurrency("INR");
                setReference("MLW-8392-1049");
                setDestination("janedoe@okhdfcbank");
                setMethod("Unified Payments Interface (UPI)");
                setRecipientEmail("janedoe@gmail.com");
                setRecipientPhone("+91 98765 43210");
                setSelectedTxId("");
                toast.info("Reset to default demo data");
              }}
              className="h-10 px-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-[11px] font-semibold text-muted-foreground hover:text-foreground shrink-0 cursor-pointer transition-colors"
              title="Reset fields to sample demo preset"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Selected Record Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Current Synced State:</span>
          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border/60 text-foreground font-mono">
            {reference}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border/60 text-foreground font-semibold">
            {recipient}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
            {amount} {currency}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border/60 text-primary font-mono">
            {destination}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground">💡 8 Specialized Clearance Templates</p>
          <p className="text-muted-foreground leading-relaxed">
            1. <strong>Withdrawal KYC Hold:</strong> Sent when a withdrawal is held. Contains required documents and guidance.<br />
            2. <strong>KYC Approved:</strong> Sent after KYC. Explains 5-digit key sent to sender (e.g. Brooklyn) to release payout.<br />
            3. <strong>Key Sent (Website &amp; Tab):</strong> Dual-key instructions: enter on website and withdrawal tab, and inform sender to put key in their tab (or else it won't succeed) for release without extra verification.<br />
            4. <strong>KYC Failed / Retry:</strong> Explains that photo was not taken live or did not match ID (School/College ID recommended).<br />
            5. <strong>Key Verification Started:</strong> Informs customer their KeyBox verification key has been received and verification is underway.<br />
            6. <strong>All Processes Complete:</strong> Dispatched confirmation stating all processes are complete and money will reflect anytime if UPI, name, number, and mail are correct.<br />
            7. <strong>1st Transfer Clearance (5–7 Days):</strong> First international transfer &amp; withdrawal update. Reassures customer that if Gmail, Name, Number &amp; UPI are correct they will get funds in 5–7 days with no more recipient verification, noting sender must comply with Indian bank AML/safety inquiries in this final stretch.<br />
            8. <strong>Sent to Bank (Bank Review &amp; Credit):</strong> Final handover notification stating Moonlight has completed and finalized every step, has zero control over the transaction now, and funds will automatically reflect and credit once the receiving bank finishes its review.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap shrink-0 touch-pan-x w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTab("kyc_hold")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
              tab === "kyc_hold"
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>1. KYC Hold</span>
            <span className="hidden md:inline">(Photo + ID)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("kyc_approved_key")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
              tab === "kyc_approved_key"
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <KeyRound className="h-3.5 w-3.5 shrink-0" />
            <span>2. KYC Approved</span>
            <span className="hidden md:inline">(Sender Key)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("key_sent_instruction")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
              tab === "key_sent_instruction"
                ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <KeyRound className="h-3.5 w-3.5 shrink-0" />
            <span>3. Key Sent</span>
            <span className="hidden md:inline">(Website &amp; Tab)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("kyc_rejected")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
              tab === "kyc_rejected"
                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            <span>4. KYC Failed</span>
            <span className="hidden md:inline">(School ID)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("key_verification_started")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
              tab === "key_verification_started"
                ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <KeyRound className="h-3.5 w-3.5 shrink-0" />
            <span>5. Key Verifying</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("all_success")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
              tab === "all_success"
                ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-600/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>6. Dispatched</span>
            <span className="hidden md:inline">(All Done)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("first_transfer_clearance")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
              tab === "first_transfer_clearance"
                ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span>7. 1st Transfer</span>
            <span className="hidden md:inline">(5-7 Days &amp; AML)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("transaction_sent_to_bank")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
              tab === "transaction_sent_to_bank"
                ? "bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>8. Sent to Bank</span>
            <span className="hidden md:inline">(Bank Review &amp; Credit)</span>
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-secondary p-0.5">
          <button
            type="button"
            onClick={() => setPreviewMode("visual")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1",
              previewMode === "visual" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
            )}
          >
            <Eye className="h-3 w-3" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("html")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1",
              previewMode === "html" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
            )}
          >
            <Code className="h-3 w-3" />
            <span>HTML</span>
          </button>
        </div>
      </div>

      {/* Inputs Configuration Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2.5 sm:gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Beneficiary</label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
          />
        </div>
        {(tab === "kyc_approved_key" || tab === "key_sent_instruction" || tab === "first_transfer_clearance") && (
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Sender</label>
            <input
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
            />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Gmail / Email</label>
          <input
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Phone Number</label>
          <input
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Amount</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Currency</label>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs uppercase"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Payout Method</label>
          <input
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Destination / UPI ID</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Reference ID</label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono"
          />
        </div>
      </div>

      {/* Subject line preview */}
      <div className="rounded-2xl border border-border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email Subject</p>
          <p className="text-xs text-foreground font-medium truncate">{getSubject()}</p>
        </div>
        <button
          type="button"
          onClick={copySubject}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold transition-all cursor-pointer shrink-0"
        >
          {copiedSubject ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Mail className="h-3.5 w-3.5" />}
          <span>{copiedSubject ? "Copied!" : "Copy Subject"}</span>
        </button>
      </div>

      {/* Preview Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-secondary/30 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {previewMode === "visual" ? "Visual Render" : "HTML Source Code"}
          </span>
          <button
            type="button"
            onClick={copy}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Copy className="h-3 w-3" />
            <span>{copied ? "Copied!" : "Copy HTML"}</span>
          </button>
        </div>

        {previewMode === "visual" ? (
          <div className="p-2 sm:p-4 bg-muted/30 flex justify-center">
            <iframe
              title="Email Visual Preview"
              srcDoc={generatedHtml}
              className="w-full max-w-[650px] h-[380px] sm:h-[480px] md:h-[540px] rounded-xl border border-border shadow-sm bg-[#0d0f17]"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <pre className="p-3 sm:p-4 text-[10px] sm:text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-[540px] leading-relaxed select-all">
            {generatedHtml}
          </pre>
        )}
      </div>
    </div>
  );
}
