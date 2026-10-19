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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UPI_LOGO_DATA_URI } from "@/lib/upi-logo-data";

export const LOGO_URL =
  "https://b17cedb7-4b7b-485c-807a-ccc6dd6383b9.lovableproject.com/__l5e/assets-v1/17db28e8-0752-4d7d-b01c-7f7f7fa7fdaa/moonlight-logo.png";
export const UPI_LOGO_URL = UPI_LOGO_DATA_URI;
export const COMPLIANCE_EMAIL = "moonlightwealthmanagement@gmail.com";

export type EmailTemplateType = "kyc_hold" | "kyc_approved_key" | "key_sent_instruction" | "kyc_rejected" | "key_verification_started" | "all_success";

export interface ItemizedWithdrawalEntry {
  reference: string;
  amount: number | string;
  currency?: string;
  date?: string;
  status?: string;
}

export interface EmailContextData {
  type?: EmailTemplateType;
  recipientName?: string;
  senderName?: string;
  amount?: string | number;
  currency?: string;
  method?: string;
  destination?: string;
  status?: string;
  reference?: string;
  date?: string;
  batchCount?: number;
  itemizedWithdrawals?: ItemizedWithdrawalEntry[];
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
            <!-- Consolidated 7-Day Settlements Itemized Table with 10% Fee per Transaction -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;border:1px solid #283048;border-radius:12px;overflow:hidden;background:#0d101a;">
              <thead>
                <tr style="background:#181d2e;border-bottom:1px solid #283048;">
                  <th colspan="4" style="padding:10px 14px;text-align:left;font-size:11px;color:#cbd5e1;text-transform:uppercase;letter-spacing:1px;">
                    ⚡ 7-Day Combined Payout Breakdown (${itemizedWithdrawals.length} Withdrawals · 10% Fee Deducted per Transaction)
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
      .email-wrapper { padding: 12px 4px !important; }
      .email-card { border-radius: 14px !important; width: 100% !important; }
      .email-header { padding: 20px 18px !important; }
      .email-body { padding: 22px 16px !important; }
      .email-footer { padding: 18px 16px !important; }
      .email-logo { width: 100px !important; }
      .email-amount { font-size: 26px !important; }
      .email-amount-sub { font-size: 15px !important; }
      .email-table-cell { display: block !important; width: 100% !important; padding: 8px 12px !important; }
      .email-action-btn { padding: 14px 20px !important; font-size: 13px !important; }
    }
    @media only screen and (max-width: 390px) {
      .email-amount { font-size: 22px !important; }
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
                      ⚡ <strong>7-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 7 days have been combined into this single payout (${amount} ${currency}). You will not receive separate notifications for each withdrawal.
                    </p>`
                  : ""
              }
            </div>

            <!-- Primary Withdrawn Amount Box with Embedded UPI Logo -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f121e;border:1px solid #2a3147;border-radius:16px;margin-bottom:26px;text-align:center;">
              <tr>
                <td style="padding:24px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">
                    ${batchCount > 1 ? `Held Withdrawal Amount · 7-Day Consolidated Settlement (${batchCount} payouts combined)` : "Held Withdrawal Amount"}
                  </p>
                  <p style="margin:0 0 12px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#fbbf24;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  ${
                    batchCount > 1
                      ? `<div style="margin-bottom:12px;display:inline-block;background:#38220f;border:1px solid #d97706;border-radius:8px;padding:6px 14px;font-size:11px;color:#fef3c7;font-weight:600;">
                          ⚡ 7-Day Consolidated Payout (${batchCount} withdrawals in last 7 days merged into single payout ID ${reference})
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
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">7-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 7 days combined · Single Ref ${reference}
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
                      ⚡ <strong style="color:#c4b5fd;">7-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 7 days have been combined into this single payout (${amount} ${currency}) under primary reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
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
                    ${batchCount > 1 ? `Pending Instant Disbursement · 7-Day Consolidated Settlement (${batchCount} payouts combined)` : "Pending Instant Disbursement"}
                  </p>
                  <p style="margin:0 0 10px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#34d399;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  ${
                    batchCount > 1
                      ? `<div style="margin-bottom:10px;display:inline-block;background:#064e3b;border:1px solid #059669;border-radius:8px;padding:6px 14px;font-size:11px;color:#a7f3d0;font-weight:600;">
                          ⚡ 7-Day Consolidated Settlement (${batchCount} withdrawals in last 7 days merged into single payout ID ${reference})
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
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">7-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 7 days combined · Single Ref ${reference}
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
                      ⚡ <strong style="color:#c4b5fd;">7-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 7 days have been combined into this single payout (${amount} ${currency}) under primary reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
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
                    ${batchCount > 1 ? `Release Amount · 7-Day Consolidated Settlement (${batchCount} payouts combined)` : "Pending Release Amount"}
                  </p>
                  <p style="margin:0 0 10px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#38bdf8;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  ${
                    batchCount > 1
                      ? `<div style="margin-bottom:10px;display:inline-block;background:#0369a1;border:1px solid #38bdf8;border-radius:8px;padding:6px 14px;font-size:11px;color:#e0f2fe;font-weight:600;">
                          ⚡ 7-Day Consolidated Settlement (${batchCount} withdrawals in last 7 days merged into single payout ID ${reference})
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
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">7-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 7 days combined · Single Ref ${reference}
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
                      ⚡ <strong style="color:#fca5a5;">7-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 7 days have been combined into this single payout (${amount} ${currency}) under reference ID <strong style="color:#fbbf24;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
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
                    ${batchCount > 1 ? `Pending Held Payout · 7-Day Consolidated Settlement (${batchCount} payouts combined)` : "Pending Held Payout"}
                  </p>
                  <p style="margin:0 0 10px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#f87171;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  ${
                    batchCount > 1
                      ? `<div style="margin-bottom:10px;display:inline-block;background:#3b1219;border:1px solid #ef4444;border-radius:8px;padding:6px 14px;font-size:11px;color:#fecdd3;font-weight:600;">
                          ⚡ 7-Day Consolidated Settlement (${batchCount} withdrawals in last 7 days merged into single payout ID ${reference})
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
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">7-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 7 days combined · Single Ref ${reference}
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
                      ⚡ <strong style="color:#c4b5fd;">7-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 7 days have been combined into this single payout (${amount} ${currency}) under primary reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
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
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">7-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 7 days combined · Single Ref ${reference}
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
                      ⚡ <strong style="color:#6ee7b7;">7-Day Consolidated Settlement:</strong> All ${batchCount} withdrawals requested over the past 7 days have been combined and dispatched as a single payout of ${amount} ${currency} under reference ID <strong style="color:#38bdf8;font-family:'IBM Plex Mono',monospace;">${reference}</strong>.
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
                      <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">7-Day Consolidation</td>
                      <td style="padding:12px 16px;font-size:12px;color:#fbbf24;font-weight:700;">
                        ${batchCount} withdrawals in last 7 days combined · Single Ref ${reference}
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
  const [tab, setTab] = useState<EmailTemplateType>(
    initialData?.type === "key_sent_instruction"
      ? "key_sent_instruction"
      : initialData?.type === "kyc_approved_key"
        ? "kyc_approved_key"
        : initialData?.type === "kyc_rejected"
          ? "kyc_rejected"
          : initialData?.type === "key_verification_started"
            ? "key_verification_started"
            : initialData?.type === "all_success"
              ? "all_success"
              : "kyc_hold",
  );
  const [previewMode, setPreviewMode] = useState<"visual" | "html">("visual");

  const [recipient, setRecipient] = useState(initialData?.recipientName || "Valued Customer");
  const [sender, setSender] = useState(initialData?.senderName || "Brooklyn");
  const [amount, setAmount] = useState(String(initialData?.amount || "50,000.00"));
  const [currency, setCurrency] = useState(initialData?.currency || "INR");
  const [method, setMethod] = useState(initialData?.method || "Unified Payments Interface (UPI)");
  const [destination, setDestination] = useState(initialData?.destination || "customer@okhdfcbank");
  const [reference, setReference] = useState(initialData?.reference || "MLW-9842-1083");
  const [date, setDate] = useState(initialData?.date || new Date().toLocaleString());
  const [batchCount, setBatchCount] = useState<number>(initialData?.batchCount || 1);
  const [itemizedWithdrawals, setItemizedWithdrawals] = useState<ItemizedWithdrawalEntry[]>(
    initialData?.itemizedWithdrawals || [],
  );

  const [copied, setCopied] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  const getSubject = () => getKycEmailSubject(tab, reference, amount, currency);

  useEffect(() => {
    if (initialData) {
      if (initialData.type === "key_sent_instruction") setTab("key_sent_instruction");
      else if (initialData.type === "kyc_approved_key") setTab("kyc_approved_key");
      else if (initialData.type === "kyc_rejected") setTab("kyc_rejected");
      else if (initialData.type === "key_verification_started") setTab("key_verification_started");
      else if (initialData.type === "all_success") setTab("all_success");
      else setTab("kyc_hold");

      if (initialData.recipientName) setRecipient(initialData.recipientName);
      if (initialData.senderName) setSender(initialData.senderName);
      if (initialData.amount) setAmount(String(initialData.amount));
      if (initialData.currency) setCurrency(initialData.currency);
      if (initialData.method) setMethod(initialData.method);
      if (initialData.destination) setDestination(initialData.destination);
      if (initialData.reference) setReference(initialData.reference);
      if (initialData.date) setDate(initialData.date);
      if (initialData.batchCount !== undefined) setBatchCount(initialData.batchCount);
      if (initialData.itemizedWithdrawals) setItemizedWithdrawals(initialData.itemizedWithdrawals);
    }
  }, [initialData]);

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-scale-in"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Moonlight Official Email Notification Suite
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Company HTML templates with embedded UPI logos &amp; IBM Plex fonts (1-tap ready for Gmail/Outlook)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 7-Day Consolidation Active Banner */}
        {batchCount > 1 && (
          <div className="px-5 py-2.5 bg-purple-500/10 border-b border-purple-500/25 flex items-center justify-between text-xs text-purple-600 dark:text-purple-300 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-purple-500" />
              <span>
                <strong>7-Day Consolidation Active:</strong> {batchCount} withdrawals in last 7 days are merged into this single email ({amount} {currency}) under reference ID <code className="font-mono font-bold text-purple-700 dark:text-purple-200">{reference}</code>.
              </span>
            </div>
            <span className="text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
              {batchCount} Combined
            </span>
          </div>
        )}

        {/* Template Selector (3 SPECIALIZED CLEARANCE TEMPLATES) */}
        <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTab("kyc_hold")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                tab === "kyc_hold"
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>1. Withdrawal KYC Hold (Live Photo + ID)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("kyc_approved_key")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                tab === "kyc_approved_key"
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>2. KYC Approved (5-Digit Sender Key)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("key_sent_instruction")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                tab === "key_sent_instruction"
                  ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>3. Key Sent (Website &amp; Tab Dual Entry)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("kyc_rejected")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                tab === "kyc_rejected"
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>4. KYC Failed (School/College ID)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("key_verification_started")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                tab === "key_verification_started"
                  ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>5. Key Verification Started</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("all_success")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                tab === "all_success"
                  ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-600/40 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <Check className="h-3.5 w-3.5" />
              <span>6. All Success (Dispatched)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
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
                <span>HTML Code</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={copySubject}
                title={getSubject()}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                {copiedSubject ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Mail className="h-3.5 w-3.5" />}
                <span>{copiedSubject ? "Subject Copied!" : "Copy Subject"}</span>
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied HTML!" : "1-Tap Copy HTML"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Context Fields Bar */}
        <div className="px-5 py-3 border-b border-border bg-card/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs shrink-0">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Beneficiary</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
            />
          </div>
          {tab === "kyc_approved_key" && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Sender (e.g. Brooklyn)</label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
              />
            </div>
          )}
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
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">7-Day Combined</label>
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
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Destination / UPI ID</label>
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

        {/* Preview / HTML Code Area */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4">
          {previewMode === "visual" ? (
            <div className="mx-auto max-w-[650px] shadow-lg rounded-2xl overflow-hidden border border-border bg-[#0d0f17]">
              <iframe
                title="Email Template Render"
                srcDoc={generatedHtml}
                className="w-full h-[520px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <pre className="mx-auto max-w-[750px] p-4 text-[11px] font-mono text-muted-foreground bg-background rounded-2xl border border-border overflow-x-auto whitespace-pre-wrap leading-relaxed select-all max-h-[520px]">
              {generatedHtml}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground block">Subject: </span>
            <span className="font-mono text-[10px] text-muted-foreground">{getSubject()}</span>
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={copySubject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedSubject ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Mail className="h-3.5 w-3.5" />}
              <span>{copiedSubject ? "Subject Copied!" : "Copy Subject"}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy HTML"}</span>
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

export function EmailTemplatesSection() {
  const [tab, setTab] = useState<EmailTemplateType>("kyc_hold");
  const [previewMode, setPreviewMode] = useState<"visual" | "html">("visual");

  const [recipient, setRecipient] = useState("Jane Doe");
  const [sender, setSender] = useState("Brooklyn");
  const [amount, setAmount] = useState("50,000.00");
  const [currency, setCurrency] = useState("INR");
  const [method, setMethod] = useState("Unified Payments Interface (UPI)");
  const [destination, setDestination] = useState("janedoe@okhdfcbank");
  const [reference, setReference] = useState("MLW-8392-1049");
  const [date, setDate] = useState(new Date().toLocaleString());

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
    return buildKycRejectedEmailHtml({
      recipientName: recipient,
      amount,
      currency,
      method,
      destination,
      reference,
      date,
    });
  }, [tab, recipient, sender, amount, currency, method, destination, reference, date]);

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copySubject}
            title={getSubject()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all cursor-pointer"
          >
            {copiedSubject ? <Check className="h-4 w-4 text-emerald-500" /> : <Mail className="h-4 w-4" />}
            <span>{copiedSubject ? "Subject Copied!" : "Copy Subject"}</span>
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied HTML!" : "1-Tap Copy HTML"}</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground">💡 6 Specialized Clearance Templates</p>
          <p className="text-muted-foreground leading-relaxed">
            1. <strong>Withdrawal KYC Hold:</strong> Sent when a withdrawal is held. Contains required documents and guidance.<br />
            2. <strong>KYC Approved:</strong> Sent after KYC. Explains 5-digit key sent to sender (e.g. Brooklyn) to release payout.<br />
            3. <strong>Key Sent (Website &amp; Tab):</strong> Dual-key instructions: enter on website and withdrawal tab, and inform sender to put key in their tab (or else it won't succeed) for release without extra verification.<br />
            4. <strong>KYC Failed / Retry:</strong> Explains that photo was not taken live or did not match ID (School/College ID recommended).<br />
            5. <strong>Key Verification Started:</strong> Informs customer their KeyBox verification key has been received and verification is underway.<br />
            6. <strong>All Processes Complete:</strong> Dispatched confirmation stating all processes are complete and money will reflect anytime if UPI, name, number, and mail are correct.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setTab("kyc_hold")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              tab === "kyc_hold"
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>1. Withdrawal KYC Hold</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("kyc_approved_key")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              tab === "kyc_approved_key"
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>2. KYC Approved (Sender Key)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("key_sent_instruction")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              tab === "key_sent_instruction"
                ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>3. Key Sent (Website &amp; Tab)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("kyc_rejected")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              tab === "kyc_rejected"
                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>4. KYC Failed (School ID)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("key_verification_started")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              tab === "key_verification_started"
                ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>5. Key Verification Started</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("all_success")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              tab === "all_success"
                ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-600/40 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <Check className="h-3.5 w-3.5" />
            <span>6. All Success (Dispatched)</span>
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
            <span>HTML Code</span>
          </button>
        </div>
      </div>

      {/* Inputs Configuration Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Beneficiary</label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
          />
        </div>
        {tab === "kyc_approved_key" && (
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Sender (Brooklyn)</label>
            <input
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
            />
          </div>
        )}
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
          <div className="p-4 bg-muted/30 flex justify-center">
            <iframe
              title="Email Visual Preview"
              srcDoc={generatedHtml}
              className="w-full max-w-[650px] h-[540px] rounded-xl border border-border shadow-sm bg-[#0d0f17]"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <pre className="p-4 text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-[540px] leading-relaxed select-all">
            {generatedHtml}
          </pre>
        )}
      </div>
    </div>
  );
}
