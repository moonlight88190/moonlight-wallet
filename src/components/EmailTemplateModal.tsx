import React, { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Copy,
  Check,
  Eye,
  Code,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const LOGO_URL =
  "https://b17cedb7-4b7b-485c-807a-ccc6dd6383b9.lovableproject.com/__l5e/assets-v1/17db28e8-0752-4d7d-b01c-7f7f7fa7fdaa/moonlight-logo.png";
export const SITE_URL = "https://moonlight.lovableproject.com";

export type EmailTemplateType = "money_received" | "withdrawal" | "kyc_hold";

export interface EmailContextData {
  type?: EmailTemplateType;
  recipientName?: string;
  senderName?: string;
  amount?: string | number;
  currency?: string;
  method?: string;
  status?: string;
  reference?: string;
  date?: string;
}

// ─────────────────────────────────────────────
// HTML EMAIL GENERATORS
// ─────────────────────────────────────────────

export function buildMoneyReceivedHtml(params: {
  recipientName: string;
  senderName: string;
  amount: string;
  currency: string;
  date: string;
  reference: string;
}) {
  const { recipientName, senderName, amount, currency, date, reference } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Money Received — Moonlight Wallet</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;box-shadow:0 10px 25px rgba(0,0,0,0.05);border-radius:16px;overflow:hidden;background:#ffffff;">

        <!-- Header -->
        <tr>
          <td style="background:#12121a;padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="Moonlight" width="140" style="display:block;margin:0 auto 6px;max-width:140px;" />
            <p style="margin:0;color:#94a3b8;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Moonlight Wallet</p>
          </td>
        </tr>

        <!-- Green Confirmation Banner -->
        <tr>
          <td style="background:#16a34a;padding:14px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✅ Money Received Successfully</p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 36px;">
            <p style="margin:0 0 8px;font-size:16px;color:#0f172a;font-weight:500;">Hello <strong>${recipientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">Great news — a payment has been deposited into your Moonlight Wallet. Here are the transaction details:</p>

            <!-- Amount Highlight Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:12px;color:#16a34a;text-transform:uppercase;font-weight:700;letter-spacing:1px;">Amount Credited</p>
                  <p style="margin:0;font-size:36px;font-weight:800;color:#15803d;letter-spacing:-1px;">${amount} <span style="font-size:20px;font-weight:700;">${currency}</span></p>
                </td>
              </tr>
            </table>

            <!-- Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#f8fafc;">
                <td style="padding:12px 16px;font-size:12px;color:#64748b;width:38%;">Sender</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:600;">${senderName}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">Date &amp; Time</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${date}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:12px 16px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">Reference ID</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-family:monospace;font-weight:600;border-top:1px solid #e2e8f0;">${reference}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">Status</td>
                <td style="padding:12px 16px;font-size:13px;color:#16a34a;font-weight:700;border-top:1px solid #e2e8f0;">COMPLETED</td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:13px;color:#64748b;line-height:1.7;">The funds are now available in your balance. You can send funds, view analytics, or initiate a withdrawal anytime directly inside your account.</p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#12121a;border-radius:50px;padding:14px 34px;text-align:center;">
                  <a href="${SITE_URL}/dashboard" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;display:inline-block;">View My Wallet →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">If you did not expect this payment, please contact our support team immediately.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:500;">© ${new Date().getFullYear()} Moonlight Financial Inc. All rights reserved.</p>
            <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated transaction confirmation. Please do not reply directly to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildWithdrawalHtml(params: {
  recipientName: string;
  amount: string;
  currency: string;
  method: string;
  date: string;
  reference: string;
  status: string;
}) {
  const { recipientName, amount, currency, method, date, reference, status } = params;
  const isSuccess = status === "SUCCESSFUL" || status === "COMPLETED";
  const isProcessing = status === "PROCESSING" || status === "UNDER REVIEW";
  const statusColor = isSuccess ? "#16a34a" : isProcessing ? "#d97706" : "#dc2626";
  const statusBg = isSuccess ? "#f0fdf4" : isProcessing ? "#fffbeb" : "#fef2f2";
  const statusBorder = isSuccess ? "#bbf7d0" : isProcessing ? "#fde68a" : "#fecaca";
  const statusIcon = isSuccess ? "✅" : isProcessing ? "⏳" : "⚠️";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Withdrawal Update — Moonlight Wallet</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;box-shadow:0 10px 25px rgba(0,0,0,0.05);border-radius:16px;overflow:hidden;background:#ffffff;">

        <!-- Header -->
        <tr>
          <td style="background:#12121a;padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="Moonlight" width="140" style="display:block;margin:0 auto 6px;max-width:140px;" />
            <p style="margin:0;color:#94a3b8;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Moonlight Wallet</p>
          </td>
        </tr>

        <!-- Status Banner -->
        <tr>
          <td style="background:${statusColor};padding:14px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${statusIcon} Withdrawal Payout — ${status}</p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 36px;">
            <p style="margin:0 0 8px;font-size:16px;color:#0f172a;font-weight:500;">Hello <strong>${recipientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">Your withdrawal request has been updated. Please find the latest transfer details below:</p>

            <!-- Amount Highlight Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${statusBg};border:1px solid ${statusBorder};border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:12px;color:${statusColor};text-transform:uppercase;font-weight:700;letter-spacing:1px;">Payout Amount</p>
                  <p style="margin:0;font-size:36px;font-weight:800;color:${statusColor};letter-spacing:-1px;">${amount} <span style="font-size:20px;font-weight:700;">${currency}</span></p>
                  <p style="margin:6px 0 0;font-size:12px;color:${statusColor};font-weight:700;text-transform:uppercase;">Status: ${status}</p>
                </td>
              </tr>
            </table>

            <!-- Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#f8fafc;">
                <td style="padding:12px 16px;font-size:12px;color:#64748b;width:38%;">Payout Rail / Method</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:600;">${method}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">Date &amp; Time</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${date}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:12px 16px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">Reference ID</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-family:monospace;font-weight:600;border-top:1px solid #e2e8f0;">${reference}</td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:13px;color:#64748b;line-height:1.7;">${
              isSuccess
                ? "Your funds have cleared and were dispatched to your designated account. Depending on your receiving bank or payment rail, settlement may take 1–3 business days."
                : isProcessing
                  ? "Your withdrawal is currently undergoing clearing by Moonlight's settlement operations. You will receive another notification as soon as clearing completes."
                  : "Your withdrawal could not be finalized. Any held funds have been credited back to your Moonlight Wallet balance. Please inspect your recipient details or reach out to support."
            }</p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#12121a;border-radius:50px;padding:14px 34px;text-align:center;">
                  <a href="${SITE_URL}/dashboard" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;display:inline-block;">Go to Dashboard →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Support inquiry? Contact us anytime at support@moonlightwallet.com</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:500;">© ${new Date().getFullYear()} Moonlight Financial Inc. All rights reserved.</p>
            <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated payout notification. Please do not reply directly to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildKycHoldHtml(params: {
  recipientName: string;
  amount: string;
  currency: string;
  senderName: string;
  reference: string;
  date: string;
}) {
  const { recipientName, amount, currency, senderName, reference, date } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Action Required: KYC Verification — Moonlight Wallet</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;box-shadow:0 10px 25px rgba(0,0,0,0.05);border-radius:16px;overflow:hidden;background:#ffffff;">

        <!-- Header -->
        <tr>
          <td style="background:#12121a;padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="Moonlight" width="140" style="display:block;margin:0 auto 6px;max-width:140px;" />
            <p style="margin:0;color:#94a3b8;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Moonlight Wallet</p>
          </td>
        </tr>

        <!-- Purple Alert Banner -->
        <tr>
          <td style="background:#7c3aed;padding:14px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">⚠️ Action Required — Transaction On Hold</p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 36px;">
            <p style="margin:0 0 8px;font-size:16px;color:#0f172a;font-weight:500;">Hello <strong>${recipientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">An incoming payment to your Moonlight Wallet has been placed on hold pending identity verification (KYC). Please review the details and complete verification below:</p>

            <!-- Amount Highlight Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border:1px solid #ddd6fe;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:12px;color:#7c3aed;text-transform:uppercase;font-weight:700;letter-spacing:1px;">Amount On Hold</p>
                  <p style="margin:0;font-size:36px;font-weight:800;color:#6d28d9;letter-spacing:-1px;">${amount} <span style="font-size:20px;font-weight:700;">${currency}</span></p>
                  <p style="margin:6px 0 0;font-size:12px;color:#7c3aed;font-weight:600;">Sent by: ${senderName}</p>
                </td>
              </tr>
            </table>

            <!-- Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#f8fafc;">
                <td style="padding:12px 16px;font-size:12px;color:#64748b;width:38%;">Sender</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:600;">${senderName}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">Date</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${date}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:12px 16px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">Reference ID</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-family:monospace;font-weight:600;border-top:1px solid #e2e8f0;">${reference}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">Status</td>
                <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#7c3aed;border-top:1px solid #e2e8f0;">🔒 ON HOLD — KYC Verification Required</td>
              </tr>
            </table>

            <!-- 5-Digit Key Verification Process Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#92400e;">📋 How to unlock and release your funds</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#78350f;line-height:1.7;"><strong>Step 1:</strong> Complete your KYC (identity verification) inside your Moonlight Wallet account.</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#78350f;line-height:1.7;"><strong>Step 2:</strong> Once your KYC is approved, Moonlight will generate and issue a <strong>5-digit verification key</strong> to the person who sent you the payment (<strong>${senderName}</strong>).</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#78350f;line-height:1.7;"><strong>Step 3:</strong> Contact <strong>${senderName}</strong> and ask them to provide their 5-digit key to you.</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#78350f;line-height:1.7;"><strong>Step 4:</strong> Submit the key to Moonlight support so we can verify that both parties are legitimate. Once verified, the funds are released to your wallet immediately.</p>
                  <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;font-style:italic;">💡 Note: If you have difficulty reaching ${senderName}, Moonlight will also send you a key directly to expedite verification.</p>
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#7c3aed;border-radius:50px;padding:14px 34px;text-align:center;">
                  <a href="${SITE_URL}/dashboard" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;display:inline-block;">Complete KYC Now →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Need assistance? Contact our compliance desk at support@moonlightwallet.com</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:500;">© ${new Date().getFullYear()} Moonlight Financial Inc. All rights reserved.</p>
            <p style="margin:0;font-size:11px;color:#94a3b8;">This is a compliance security notice. Please do not reply directly to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// PLAIN TEXT BUILDER
// ─────────────────────────────────────────────

export function buildPlainText(type: EmailTemplateType, params: {
  recipientName: string;
  senderName: string;
  amount: string;
  currency: string;
  reference: string;
  date: string;
  method?: string;
  status?: string;
}) {
  if (type === "money_received") {
    return `[MOONLIGHT WALLET — MONEY RECEIVED]

Hello ${params.recipientName},

A payment of ${params.amount} ${params.currency} has been received into your Moonlight Wallet.

Details:
• From: ${params.senderName}
• Date: ${params.date}
• Reference: ${params.reference}
• Status: COMPLETED

View your balance: ${SITE_URL}/dashboard
Support: support@moonlightwallet.com`;
  }

  if (type === "withdrawal") {
    return `[MOONLIGHT WALLET — WITHDRAWAL UPDATE]

Hello ${params.recipientName},

Your withdrawal request of ${params.amount} ${params.currency} is currently: ${params.status || "PROCESSING"}.

Details:
• Payout Method: ${params.method || "Payout Rail"}
• Date: ${params.date}
• Reference: ${params.reference}
• Status: ${params.status || "PROCESSING"}

View your status: ${SITE_URL}/dashboard
Support: support@moonlightwallet.com`;
  }

  return `[MOONLIGHT WALLET — ACTION REQUIRED: KYC HOLD]

Hello ${params.recipientName},

Your incoming payment of ${params.amount} ${params.currency} from ${params.senderName} is currently ON HOLD pending identity verification (KYC).

Reference: ${params.reference}
Date: ${params.date}

How to unlock your funds:
1. Complete KYC inside your Moonlight Wallet account.
2. Upon approval, Moonlight will issue a 5-digit verification key to ${params.senderName}.
3. Contact ${params.senderName} to get their 5-digit key and submit it to Moonlight to confirm both parties.
4. If you have trouble reaching ${params.senderName}, Moonlight will also send you a key directly.

Complete KYC: ${SITE_URL}/dashboard
Support: support@moonlightwallet.com`;
}

// ─────────────────────────────────────────────
// EMAIL TEMPLATE MODAL COMPONENT
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
  const [template, setTemplate] = useState<EmailTemplateType>("money_received");
  const [previewMode, setPreviewMode] = useState<"visual" | "html">("visual");
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Form fields
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");
  const [method, setMethod] = useState("IMPS / Bank Payout");
  const [status, setStatus] = useState("SUCCESSFUL");

  // Sync initialData when modal opens or initialData changes
  useEffect(() => {
    if (!open) return;
    const d = initialData || {};

    // Auto-detect template type
    if (d.type) {
      setTemplate(d.type);
    } else if (
      d.status?.toUpperCase() === "ON HOLD" ||
      d.status?.toUpperCase() === "UNDER REVIEW"
    ) {
      setTemplate("kyc_hold");
    } else {
      setTemplate("money_received");
    }

    setRecipient(d.recipientName || "Valued Customer");
    setSender(d.senderName || "Moonlight Financial");
    setAmount(d.amount != null ? String(d.amount) : "1,000.00");
    setCurrency(d.currency || "USD");
    setReference(d.reference || `MLW-${Math.floor(100000 + Math.random() * 900000)}`);
    setDate(d.date || new Date().toLocaleString());
    setMethod(d.method || "Bank Wire / UPI");
    setStatus(d.status || "SUCCESSFUL");
  }, [open, initialData]);

  // Compute generated HTML
  const generatedHtml = useMemo(() => {
    if (template === "money_received") {
      return buildMoneyReceivedHtml({
        recipientName: recipient,
        senderName: sender,
        amount,
        currency,
        date,
        reference,
      });
    }
    if (template === "withdrawal") {
      return buildWithdrawalHtml({
        recipientName: recipient,
        amount,
        currency,
        method,
        date,
        reference,
        status,
      });
    }
    return buildKycHoldHtml({
      recipientName: recipient,
      amount,
      currency,
      senderName: sender,
      reference,
      date,
    });
  }, [template, recipient, sender, amount, currency, method, date, reference, status]);

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml);
      setCopiedHtml(true);
      toast.success("✅ HTML email copied to clipboard! Paste directly into Gmail / Outlook / CRM.");
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const copyText = async () => {
    try {
      const text = buildPlainText(template, {
        recipientName: recipient,
        senderName: sender,
        amount,
        currency,
        reference,
        date,
        method,
        status,
      });
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      toast.success("✅ Plain text summary copied to clipboard!");
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border border-border bg-card shadow-2xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-border bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                Email Notification Template
              </h2>
              <span className="text-[10px] uppercase font-mono font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                Auto-Filled
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Official HTML email pre-populated with this transaction's details. Ready to copy in 1 tap.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copyText}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-secondary hover:bg-accent text-xs font-medium text-foreground transition-colors cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied Text</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Plain Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={copyHtml}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer transform active:scale-95"
            >
              {copiedHtml ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300 animate-in zoom-in" />
                  <span>Copied HTML!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>1-Tap Copy HTML</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-border/60 bg-background/50 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setTemplate("money_received")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                template === "money_received"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              <span>Money Received</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplate("withdrawal")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                template === "withdrawal"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Withdrawal Update</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplate("kyc_hold")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                template === "kyc_hold"
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>KYC Hold (5-Digit Key)</span>
            </button>
          </div>

          {/* Preview View Mode Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-secondary p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewMode("visual")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
                previewMode === "visual"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Eye className="h-3 w-3" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("html")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
                previewMode === "html"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Code className="h-3 w-3" />
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* KYC 5-digit Key explanation badge when KYC Hold is active */}
          {template === "kyc_hold" && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider text-[11px]">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>5-Digit Key Verification Guarantee Included</span>
              </div>
              <p className="text-purple-800 dark:text-purple-200 text-[11px] leading-relaxed">
                This email explains to the recipient that once they complete KYC, a <strong>5-digit verification key</strong> is sent to the sender (<strong>{sender}</strong>). They must contact the sender to retrieve and submit the key for instant clearance. If they cannot reach the sender, Moonlight also sends a key directly.
              </p>
            </div>
          )}

          {/* Quick Edit Inputs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Recipient Name
              </label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium focus:ring-1 focus:ring-primary"
              />
            </div>

            {template !== "withdrawal" && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Sender Name
                </label>
                <input
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Amount
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Currency
              </label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium uppercase focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Reference
              </label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium focus:ring-1 focus:ring-primary"
              />
            </div>

            {template === "withdrawal" && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Payout Method
                  </label>
                  <input
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs font-semibold focus:ring-1 focus:ring-primary"
                  >
                    <option value="SUCCESSFUL">SUCCESSFUL</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="ON HOLD">ON HOLD</option>
                    <option value="UNDER REVIEW">UNDER REVIEW</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Preview Section */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                Live Preview ({previewMode === "visual" ? "Visual Render" : "HTML Source"})
              </span>
              <button
                type="button"
                onClick={copyHtml}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                <span>{copiedHtml ? "Copied!" : "Copy HTML"}</span>
              </button>
            </div>

            {previewMode === "visual" ? (
              <div className="p-3 bg-muted/40 min-h-[360px] flex items-center justify-center">
                <iframe
                  title="Email Visual Preview"
                  srcDoc={generatedHtml}
                  className="w-full h-[460px] rounded-xl border border-border/80 shadow-sm bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="p-3 bg-muted/20">
                <pre className="p-4 text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-[460px] rounded-xl border border-border bg-background leading-relaxed select-all">
                  {generatedHtml}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 border-t border-border bg-secondary/15 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span>
              Formatted for 100% email client compatibility (Gmail, Outlook, Apple Mail).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-xl border border-border bg-secondary/70 hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={copyHtml}
              className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              {copiedHtml ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedHtml ? "Copied!" : "1-Tap Copy HTML"}</span>
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
        title="Open and copy HTML email template with pre-filled transaction details"
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
// STANDALONE EMAIL TEMPLATES SUITE COMPONENT
// ─────────────────────────────────────────────

export function EmailTemplatesSection() {
  const [tab, setTab] = useState<EmailTemplateType>("money_received");
  const [previewMode, setPreviewMode] = useState<"visual" | "html">("visual");

  const [mrRecipient, setMrRecipient] = useState("Jane Doe");
  const [mrSender, setMrSender] = useState("Acme Corp");
  const [mrAmount, setMrAmount] = useState("1,500.00");
  const [mrCurrency, setMrCurrency] = useState("USD");
  const [mrDate, setMrDate] = useState(new Date().toLocaleString());
  const [mrRef, setMrRef] = useState("TXN-9843-0211");

  const [wdRecipient, setWdRecipient] = useState("Jane Doe");
  const [wdAmount, setWdAmount] = useState("500.00");
  const [wdCurrency, setWdCurrency] = useState("USD");
  const [wdMethod, setWdMethod] = useState("UPI / Instant Payout");
  const [wdDate, setWdDate] = useState(new Date().toLocaleString());
  const [wdRef, setWdRef] = useState("MLW-8392-1049");
  const [wdStatus, setWdStatus] = useState("SUCCESSFUL");

  const [kycRecipient, setKycRecipient] = useState("Jane Doe");
  const [kycAmount, setKycAmount] = useState("2,500.00");
  const [kycCurrency, setKycCurrency] = useState("USD");
  const [kycSender, setKycSender] = useState("John Smith");
  const [kycRef, setKycRef] = useState("TXN-5541-9920");
  const [kycDate, setKycDate] = useState(new Date().toLocaleString());

  const generatedHtml = useMemo(() => {
    if (tab === "money_received") {
      return buildMoneyReceivedHtml({
        recipientName: mrRecipient,
        senderName: mrSender,
        amount: mrAmount,
        currency: mrCurrency,
        date: mrDate,
        reference: mrRef,
      });
    }
    if (tab === "withdrawal") {
      return buildWithdrawalHtml({
        recipientName: wdRecipient,
        amount: wdAmount,
        currency: wdCurrency,
        method: wdMethod,
        date: wdDate,
        reference: wdRef,
        status: wdStatus,
      });
    }
    return buildKycHoldHtml({
      recipientName: kycRecipient,
      amount: kycAmount,
      currency: kycCurrency,
      senderName: kycSender,
      reference: kycRef,
      date: kycDate,
    });
  }, [
    tab,
    mrRecipient,
    mrSender,
    mrAmount,
    mrCurrency,
    mrDate,
    mrRef,
    wdRecipient,
    wdAmount,
    wdCurrency,
    wdMethod,
    wdDate,
    wdRef,
    wdStatus,
    kycRecipient,
    kycAmount,
    kycCurrency,
    kycSender,
    kycRef,
    kycDate,
  ]);

  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    toast.success("✅ HTML email copied to clipboard! Paste directly into Gmail or Outlook.");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">Email Notification Center</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official company HTML templates with Moonlight branding and email client compatibility.
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? "Copied HTML!" : "1-Tap Copy HTML"}</span>
        </button>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground">💡 1-Tap Auto-Filled Email Templates on Every Row</p>
          <p className="text-muted-foreground leading-relaxed">
            You don't need to manually type customer details! An <span className="font-bold text-purple-600 dark:text-purple-400">"Email Template"</span> button is placed directly on every transaction in the <strong>Transactions</strong> and <strong>Withdrawals</strong> tabs. Clicking it opens the pre-filled email with that transaction's exact amount, currency, reference ID, and dates ready to copy in 1 tap.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setTab("money_received")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              tab === "money_received"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            💰 Money Received
          </button>
          <button
            type="button"
            onClick={() => setTab("withdrawal")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              tab === "withdrawal"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            🏦 Withdrawal
          </button>
          <button
            type="button"
            onClick={() => setTab("kyc_hold")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              tab === "kyc_hold"
                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            🔒 KYC Hold (5-Digit Key)
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-secondary p-0.5">
          <button
            type="button"
            onClick={() => setPreviewMode("visual")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors",
              previewMode === "visual" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
            )}
          >
            Visual Preview
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("html")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors",
              previewMode === "html" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
            )}
          >
            HTML Code
          </button>
        </div>
      </div>

      {tab === "kyc_hold" && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs space-y-1.5">
          <p className="font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider text-[11px]">
            📋 5-Digit Key Verification Flow Included
          </p>
          <p className="text-purple-800 dark:text-purple-200 text-[11px] leading-relaxed">
            The email explains that once KYC is verified, a 5-digit key is sent to the sender ({kycSender}). The recipient contacts them, obtains the key, and submits it to Moonlight for instant fund release. If unreachable, Moonlight also sends a key directly.
          </p>
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-secondary/30 p-4 rounded-2xl border border-border">
        {tab === "money_received" && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Recipient Name</label>
              <input value={mrRecipient} onChange={(e) => setMrRecipient(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Sender Name</label>
              <input value={mrSender} onChange={(e) => setMrSender(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Amount</label>
              <input value={mrAmount} onChange={(e) => setMrAmount(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Currency</label>
              <input value={mrCurrency} onChange={(e) => setMrCurrency(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs uppercase" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Date</label>
              <input value={mrDate} onChange={(e) => setMrDate(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Reference ID</label>
              <input value={mrRef} onChange={(e) => setMrRef(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono" />
            </div>
          </>
        )}

        {tab === "withdrawal" && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Recipient Name</label>
              <input value={wdRecipient} onChange={(e) => setWdRecipient(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Amount</label>
              <input value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Currency</label>
              <input value={wdCurrency} onChange={(e) => setWdCurrency(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs uppercase" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Payout Method</label>
              <input value={wdMethod} onChange={(e) => setWdMethod(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Status</label>
              <select value={wdStatus} onChange={(e) => setWdStatus(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-2 text-xs font-semibold">
                <option value="SUCCESSFUL">SUCCESSFUL</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="ON HOLD">ON HOLD</option>
                <option value="UNDER REVIEW">UNDER REVIEW</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Reference ID</label>
              <input value={wdRef} onChange={(e) => setWdRef(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono" />
            </div>
          </>
        )}

        {tab === "kyc_hold" && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Recipient Name</label>
              <input value={kycRecipient} onChange={(e) => setKycRecipient(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Sender Name</label>
              <input value={kycSender} onChange={(e) => setKycSender(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Amount</label>
              <input value={kycAmount} onChange={(e) => setKycAmount(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Currency</label>
              <input value={kycCurrency} onChange={(e) => setKycCurrency(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs uppercase" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Reference ID</label>
              <input value={kycRef} onChange={(e) => setKycRef(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Date</label>
              <input value={kycDate} onChange={(e) => setKycDate(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs" />
            </div>
          </>
        )}
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
              className="w-full max-w-[650px] h-[520px] rounded-xl border border-border shadow-sm bg-white"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <pre className="p-4 text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-[520px] leading-relaxed select-all">
            {generatedHtml}
          </pre>
        )}
      </div>
    </div>
  );
}
