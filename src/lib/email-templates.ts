// src/lib/email-templates.ts
// Reusable, responsive HTML email generator for Moonlight Financial

export type EmailEventType =
  | "transfer_sent"
  | "payment_received"
  | "withdrawal_requested"
  | "withdrawal_processing"
  | "withdrawal_completed"
  | "withdrawal_failed"
  | "withdrawal_kyc_required";

export interface TransactionEmailData {
  eventType: EmailEventType;
  recipientEmail: string;
  recipientName?: string | undefined;
  amount: number;
  currency: string;
  fee?: number | undefined;
  totalDebited?: number | undefined;
  netCredited?: number | undefined;
  paymentMethod?: string | undefined;
  counterparty?: string | undefined;
  counterpartyCode?: string | undefined;
  referenceId: string;
  dateStr?: string | undefined;
  statusText?: string | undefined;
  note?: string | undefined;
  failureReason?: string | undefined;
  actionUrl: string;
  settlementInfo?: {
    currentStep: string;
    nextStep: string;
    estimatedArrival: string;
  } | undefined;
}

export function formatEmailMoney(
  amount: number,
  currency: string = "USD",
  opts: { sign?: boolean } = {},
): string {
  const digits = currency === "JPY" ? 0 : 2;
  const validCurrency = (currency || "USD").toUpperCase();
  try {
    const str = new Intl.NumberFormat(validCurrency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: validCurrency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Math.abs(amount));
    if (opts.sign) return (amount < 0 ? "−" : "+") + str;
    return amount < 0 ? "−" + str : str;
  } catch {
    const val = Math.abs(amount).toFixed(digits);
    return `${validCurrency} ${val}`;
  }
}

export function formatEmailDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "Just now";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

export function getEmailSubject(data: TransactionEmailData): string {
  switch (data.eventType) {
    case "transfer_sent":
      return "Moonlight — Transfer sent";
    case "payment_received":
      return "Moonlight — Payment received";
    case "withdrawal_requested":
      return "Moonlight — Withdrawal request received (5 Days Settlement)";
    case "withdrawal_processing":
      return "Moonlight — Withdrawal is being processed (5 Days Settlement)";
    case "withdrawal_kyc_required":
      return `Moonlight — Action Required: Complete KYC Verification (${data.referenceId})`;
    case "withdrawal_completed":
      return "Moonlight — Withdrawal completed";
    case "withdrawal_failed":
      return "Moonlight — Withdrawal update";
    default:
      return "Moonlight — Transaction notification";
  }
}

interface EventVisualConfig {
  title: string;
  subtitle: string;
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  primaryAmountLabel: string;
  primaryAmount: string;
  showSettlement: boolean;
  buttonText: string;
}

function getEventConfig(data: TransactionEmailData): EventVisualConfig {
  const cur = data.currency || "USD";
  switch (data.eventType) {
    case "transfer_sent":
      return {
        title: "Transfer Sent",
        subtitle: `Your transfer of ${formatEmailMoney(data.amount, cur)} has been successfully submitted and debited.`,
        badgeText: "COMPLETED",
        badgeBg: "#ecfdf5",
        badgeColor: "#065f46",
        badgeBorder: "#a7f3d0",
        primaryAmountLabel: "Amount Sent",
        primaryAmount: formatEmailMoney(data.amount, cur),
        showSettlement: false,
        buttonText: "View Transaction",
      };

    case "payment_received":
      return {
        title: "Payment Received",
        subtitle: `You have received a payment of ${formatEmailMoney(data.netCredited ?? data.amount, cur)} in your Moonlight wallet.`,
        badgeText: "CREDITED",
        badgeBg: "#ecfdf5",
        badgeColor: "#065f46",
        badgeBorder: "#a7f3d0",
        primaryAmountLabel: "Amount Credited",
        primaryAmount: formatEmailMoney(data.netCredited ?? data.amount, cur),
        showSettlement: false,
        buttonText: "View In Wallet",
      };

    case "withdrawal_requested":
      return {
        title: "Withdrawal Request Received",
        subtitle: `We have received your withdrawal request of ${formatEmailMoney(data.amount, cur)}. It is scheduled across the 5 business days interbank settlement cycle.`,
        badgeText: "PROCESSING (5 DAYS)",
        badgeBg: "#fffbeb",
        badgeColor: "#92400e",
        badgeBorder: "#fde68a",
        primaryAmountLabel: "Requested Amount",
        primaryAmount: formatEmailMoney(data.amount, cur),
        showSettlement: true,
        buttonText: "View Settlement Slip",
      };

    case "withdrawal_processing":
      return {
        title: "Withdrawal is Being Processed",
        subtitle: `Your withdrawal of ${formatEmailMoney(data.amount, cur)} is progressing through national settlement rails (5 business days window).`,
        badgeText: "PROCESSING",
        badgeBg: "#eff6ff",
        badgeColor: "#1e40af",
        badgeBorder: "#bfdbfe",
        primaryAmountLabel: "Settlement Amount",
        primaryAmount: formatEmailMoney(data.netCredited ?? data.amount, cur),
        showSettlement: true,
        buttonText: "Track Settlement",
      };

    case "withdrawal_kyc_required":
      return {
        title: "Action Required: KYC Verification",
        subtitle: `Your withdrawal of ${formatEmailMoney(data.amount, cur)} is on hold pending mandatory identity verification. Please send your documents to moonlightwealthmanagement@gmail.com. As soon as KYC is verified, the funds will reflect in your bank account.`,
        badgeText: "KYC REQUIRED",
        badgeBg: "#fffbeb",
        badgeColor: "#92400e",
        badgeBorder: "#fde68a",
        primaryAmountLabel: "Pending Payout",
        primaryAmount: formatEmailMoney(data.netCredited ?? data.amount, cur),
        showSettlement: true,
        buttonText: "View KYC Instructions",
      };

    case "withdrawal_completed":
      return {
        title: "Withdrawal Completed",
        subtitle: `Your payout of ${formatEmailMoney(data.netCredited ?? data.amount, cur)} has settled and been credited to your beneficiary account.`,
        badgeText: "SETTLED",
        badgeBg: "#ecfdf5",
        badgeColor: "#065f46",
        badgeBorder: "#a7f3d0",
        primaryAmountLabel: "Settled Payout",
        primaryAmount: formatEmailMoney(data.netCredited ?? data.amount, cur),
        showSettlement: false,
        buttonText: "View Settlement Record",
      };

    case "withdrawal_failed":
      return {
        title: "Withdrawal Update",
        subtitle: `Your withdrawal request could not be completed. The debited funds have been returned to your wallet balance.`,
        badgeText: "UNSUCCESSFUL",
        badgeBg: "#fff1f2",
        badgeColor: "#9f1239",
        badgeBorder: "#fecdd3",
        primaryAmountLabel: "Refunded Amount",
        primaryAmount: formatEmailMoney(data.amount, cur),
        showSettlement: false,
        buttonText: "Review Account Details",
      };
  }
}

export function generateEmailHtml(data: TransactionEmailData): string {
  const config = getEventConfig(data);
  const cur = data.currency || "USD";
  const dateFormatted = formatEmailDateTime(data.dateStr);

  const settlementCurrent =
    data.settlementInfo?.currentStep ||
    (data.eventType === "withdrawal_processing"
      ? "Withdrawal is being processed"
      : data.eventType === "withdrawal_completed"
        ? "Final settlement & credited"
        : "Withdrawal request received");

  const settlementNext =
    data.settlementInfo?.nextStep ||
    (data.eventType === "withdrawal_processing"
      ? "Settlement verification"
      : data.eventType === "withdrawal_completed"
        ? "Settled to beneficiary"
        : "Interbank transmission");

  const settlementTimeframe = data.settlementInfo?.estimatedArrival || "5–7 business days";

  const rows: { label: string; value: string; isMono?: boolean; isHighlight?: boolean }[] = [];

  rows.push({ label: "Amount", value: formatEmailMoney(data.amount, cur) });

  if (typeof data.fee === "number" && data.fee > 0) {
    rows.push({ label: "Service / Transfer Fee (10%)", value: formatEmailMoney(data.fee, cur) });
  }

  if (typeof data.totalDebited === "number") {
    rows.push({
      label: "Total Debited",
      value: formatEmailMoney(data.totalDebited, cur),
      isHighlight: true,
    });
  }

  if (typeof data.netCredited === "number" && data.eventType.startsWith("withdrawal")) {
    rows.push({
      label: "Net Payout Amount",
      value: formatEmailMoney(data.netCredited, cur),
      isHighlight: true,
    });
  }

  if (data.paymentMethod) {
    rows.push({ label: "Payment Method", value: data.paymentMethod });
  }

  if (data.counterparty) {
    const counterpartyLabel =
      data.eventType === "transfer_sent"
        ? "Recipient"
        : data.eventType === "payment_received"
          ? "Sender"
          : "Beneficiary";
    rows.push({
      label: counterpartyLabel,
      value: data.counterpartyCode
        ? `${data.counterparty} (${data.counterpartyCode})`
        : data.counterparty,
    });
  }

  rows.push({ label: "Reference ID", value: data.referenceId, isMono: true });
  rows.push({ label: "Date & Time", value: dateFormatted });
  rows.push({ label: "Status", value: data.statusText || config.badgeText });

  if (data.note) {
    rows.push({ label: "Note / Memo", value: data.note });
  }

  if (data.failureReason && data.eventType === "withdrawal_failed") {
    rows.push({ label: "Reason for Return", value: data.failureReason, isHighlight: true });
  }

  const detailRowsHtml = rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding: 11px 0; border-bottom: ${i === rows.length - 1 ? "none" : "1px solid #f1f5f9"}; font-size: 13px; color: #64748b; font-weight: 500;">
          ${r.label}
        </td>
        <td align="right" style="padding: 11px 0; border-bottom: ${i === rows.length - 1 ? "none" : "1px solid #f1f5f9"}; font-size: 13px; color: ${r.isHighlight ? "#0f172a" : "#1e293b"}; font-weight: ${r.isHighlight ? "700" : "600"}; font-family: ${r.isMono ? "'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" : "inherit"};">
          ${r.value}
        </td>
      </tr>
    `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} — Moonlight Financial</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (Max 600px) -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
          
          <!-- Moonlight Brand Header -->
          <tr>
            <td style="background-color: #090e17; padding: 28px 32px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align: middle;">
                          <div style="width: 34px; height: 34px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #38bdf8 0%, #0369a1 50%, #082f49 100%); display: inline-block; vertical-align: middle; text-align: center; line-height: 34px; color: #ffffff; font-weight: 800; font-size: 15px; letter-spacing: -0.5px; border: 1.5px solid rgba(255, 255, 255, 0.25);">
                            M
                          </div>
                        </td>
                        <td style="vertical-align: middle; padding-left: 12px;">
                          <div style="font-size: 14px; font-weight: 800; color: #ffffff; letter-spacing: 0.18em; text-transform: uppercase; line-height: 1.2;">
                            MOONLIGHT
                          </div>
                          <div style="font-size: 9px; font-weight: 600; color: #94a3b8; letter-spacing: 0.22em; text-transform: uppercase; margin-top: 2px;">
                            FINANCIAL TECHNOLOGY
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: ${config.badgeBg}; color: ${config.badgeColor}; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid ${config.badgeBorder};">
                      ${config.badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Primary Hero Block -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #ffffff;">
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
                ${config.title}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #64748b; line-height: 1.5; max-width: 440px; margin-left: auto; margin-right: auto;">
                ${config.subtitle}
              </p>

              <!-- Large Amount Callout -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: inline-block; min-width: 260px; margin-bottom: 8px;">
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">
                  ${config.primaryAmountLabel}
                </div>
                <div style="font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  ${config.primaryAmount}
                </div>
              </div>
            </td>
          </tr>

          <!-- Transaction Details Section -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px;">
                <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
                  Transaction Details
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${detailRowsHtml}
                </table>
              </div>
            </td>
          </tr>

          <!-- Settlement Information (Where Applicable) -->
          ${
            config.showSettlement
              ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 14px; padding: 18px 20px;">
                <div style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">
                  Settlement Information
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 6px 0; font-size: 12px; color: #0284c7; font-weight: 600;">Current Step</td>
                    <td align="right" style="padding: 6px 0; font-size: 12px; color: #0c4a6e; font-weight: 700;">${settlementCurrent}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 12px; color: #0284c7; font-weight: 600;">Next Expected Step</td>
                    <td align="right" style="padding: 6px 0; font-size: 12px; color: #0c4a6e; font-weight: 700;">${settlementNext}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 12px; color: #0284c7; font-weight: 600;">Estimated Completion</td>
                    <td align="right" style="padding: 6px 0; font-size: 12px; color: #0369a1; font-weight: 800;">${settlementTimeframe}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Compliance and KYC Notice for Withdrawals -->
          ${
            data.eventType.startsWith("withdrawal")
              ? `
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; text-align: left;">
                <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                  Compliance &amp; KYC Verification Notice
                </div>
                <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
                  Outbound disbursements undergo interbank settlement across a standard 5 business days window. If statutory compliance requires customer verification, please send your KYC documents (Government Photo ID &amp; Bank Statement) to <a href="mailto:moonlightwealthmanagement@gmail.com" style="color: #2563eb; font-weight: 600; text-decoration: underline;">moonlightwealthmanagement@gmail.com</a> referencing your ID <strong>${data.referenceId}</strong>. As soon as KYC verification is completed and approved, the withdrawal amount will reflect directly in your bank account.
                </p>
              </div>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Call to Action Button -->
          <tr>
            <td style="padding: 8px 32px 32px 32px; text-align: center;">
              <a href="${data.actionUrl}" target="_blank" style="display: inline-block; background-color: #090e17; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15); transition: background-color 0.2s;">
                ${config.buttonText} &rarr;
              </a>
              <div style="margin-top: 14px; font-size: 11px; color: #94a3b8;">
                Need assistance? Reference ID: <span style="font-family: monospace; color: #64748b;">${data.referenceId}</span>
              </div>
            </td>
          </tr>

          <!-- Subtle Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="border-top: 1px solid #f1f5f9;"></div>
            </td>
          </tr>

          <!-- Moonlight Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; background-color: #ffffff; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #0f172a; letter-spacing: 0.05em; margin-bottom: 6px;">
                Moonlight Financial Technology
              </div>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                This transactional email was sent to <strong style="color: #64748b;">${data.recipientEmail}</strong> for your authenticated account activity.
              </p>
              <p style="margin: 0; font-size: 10px; color: #cbd5e1; line-height: 1.4;">
                Closed-loop simulation: This environment simulates digital financial settlement rails for demonstration purposes. Funds are not connected to real-world fiat settlement without authorization.
              </p>
              <div style="margin-top: 14px; font-size: 10px; color: #cbd5e1;">
                &copy; 2026 Moonlight Technologies Inc. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
