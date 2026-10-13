import React, { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Copy,
  Check,
  Eye,
  Code,
  ShieldAlert,
  KeyRound,
  X,
  ExternalLink,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const LOGO_URL =
  "https://b17cedb7-4b7b-485c-807a-ccc6dd6383b9.lovableproject.com/__l5e/assets-v1/17db28e8-0752-4d7d-b01c-7f7f7fa7fdaa/moonlight-logo.png";
export const UPI_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/320px-UPI-Logo-vector.svg.png";
export const BHIM_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/BHIM_logo.svg/320px-BHIM_logo.svg.png";
export const COMPLIANCE_EMAIL = "moonlightwealthmanagement@gmail.com";

export type EmailTemplateType = "kyc_hold" | "kyc_approved_key";

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
}

// ─────────────────────────────────────────────
// HTML EMAIL GENERATORS (ONLY 2 TEMPLATES)
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
}) {
  const { recipientName, amount, currency, method, destination, reference, date } = params;
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
  <title>Mandatory KYC Verification Required — Moonlight Financial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0d0f17;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f17;padding:36px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:#141724;border:1px solid #23283b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

        <!-- Brand Header -->
        <tr>
          <td style="background:#0a0c13;padding:28px 36px;border-bottom:1px solid #1e2333;text-align:center;">
            <img src="${LOGO_URL}" alt="Moonlight" width="130" style="display:block;margin:0 auto 6px;max-width:130px;height:auto;" />
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
            </div>

            <!-- Primary Withdrawn Amount Box with Embedded UPI Logo -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f121e;border:1px solid #2a3147;border-radius:16px;margin-bottom:26px;text-align:center;">
              <tr>
                <td style="padding:24px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">Held Withdrawal Amount</p>
                  <p style="margin:0 0 12px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#fbbf24;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
                  
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
              <tr style="background:#141724;">
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">Initiated Timestamp</td>
                <td style="padding:12px 16px;font-size:12px;color:#f8fafc;">${date}</td>
              </tr>
            </table>

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

        <!-- Institutional Footer -->
        <tr>
          <td style="background:#0a0c13;padding:24px 32px;border-top:1px solid #1e2333;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;">
              Moonlight Financial Clearing Operations · Internal Institutional Ledger
            </p>
            <p style="margin:0;color:#475569;font-size:10px;">
              Closed-loop digital clearing simulation. For support or dispute resolution, contact compliance desk at ${COMPLIANCE_EMAIL}.
            </p>
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
}) {
  const { recipientName, senderName, amount, currency, method, destination, reference, date } = params;
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
  <title>KYC Verified — 5-Digit Security Key Required — Moonlight Financial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0d0f17;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f17;padding:36px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;background:#141724;border:1px solid #23283b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

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
                      To complete the sender-receiver loop and prevent financial fraud, a confidential <strong style="color:#fbbf24;">5-digit verification key</strong> has been dispatched to the original sender of the funds withdrawn (<strong style="color:#ffffff;">${senderName}</strong>).
                    </p>
                    
                    <div style="background:#0c101c;border-radius:10px;padding:14px 16px;margin-bottom:14px;">
                      <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Action Required From You:</p>
                      <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.6;">
                        1. Contact <strong>${senderName}</strong> (the sender who transferred you the money).<br />
                        2. Ask them for the <strong>5-digit verification key</strong> received by them.<br />
                        3. Reply directly to this email (<a href="mailto:${COMPLIANCE_EMAIL}" style="color:#38bdf8;text-decoration:none;">${COMPLIANCE_EMAIL}</a>) with the 5-digit key.
                      </p>
                    </div>

                    <!-- Moonlight Assistance Notice -->
                    <div style="background:#1e253b;border-radius:8px;padding:10px 12px;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
                        💡 <em>If you have trouble finding or reaching the person who paid you (${senderName}), Moonlight Compliance will also assist in dispatching the key directly.</em>
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
                  <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">Pending Instant Disbursement</p>
                  <p style="margin:0 0 10px;font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:800;color:#34d399;letter-spacing:-0.5px;">
                    ${amount} <span style="font-size:20px;font-weight:700;color:#f8fafc;">${currency}</span>
                  </p>
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
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#94a3b8;">KYC Verification Status</td>
                <td style="padding:12px 16px;font-size:12px;color:#34d399;font-weight:700;">PASSED &amp; VERIFIED</td>
              </tr>
            </table>

            <!-- Instant Disbursal Guarantee -->
            <div style="background:#064e3b;border:1px solid #059669;border-radius:12px;padding:16px 18px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a7f3d0;font-weight:600;line-height:1.5;">
                ⚡ <strong>Instant Settlement:</strong> As soon as the 5-digit verification key is submitted and matched, your payout of ${amount} ${currency} will be credited instantly without any further delay.
              </p>
            </div>

          </td>
        </tr>

        <!-- Institutional Footer -->
        <tr>
          <td style="background:#0a0c13;padding:24px 32px;border-top:1px solid #1e2333;text-align:center;">
            <p style="margin:0 0 6px;color:#64748b;font-size:11px;">
              Moonlight Financial Clearing Operations · Internal Institutional Ledger
            </p>
            <p style="margin:0;color:#475569;font-size:10px;">
              Closed-loop digital clearing simulation. For assistance, reply directly to this mail or contact ${COMPLIANCE_EMAIL}.
            </p>
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
    initialData?.type === "kyc_approved_key" ? "kyc_approved_key" : "kyc_hold",
  );
  const [previewMode, setPreviewMode] = useState<"visual" | "html">("visual");

  const [recipient, setRecipient] = useState(initialData?.recipientName || "Valued Customer");
  const [sender, setSender] = useState(initialData?.senderName || "Brooklyn");
  const [amount, setAmount] = useState(String(initialData?.amount || "50,000.00"));
  const [currency, setCurrency] = useState(initialData?.currency || "INR");
  const [method, setMethod] = useState(initialData?.method || "BHIM UPI (UPI)");
  const [destination, setDestination] = useState(initialData?.destination || "customer@okhdfcbank");
  const [reference, setReference] = useState(initialData?.reference || "MLW-9842-1083");
  const [date, setDate] = useState(initialData?.date || new Date().toLocaleString());

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.type === "kyc_approved_key") setTab("kyc_approved_key");
      else setTab("kyc_hold");

      if (initialData.recipientName) setRecipient(initialData.recipientName);
      if (initialData.senderName) setSender(initialData.senderName);
      if (initialData.amount) setAmount(String(initialData.amount));
      if (initialData.currency) setCurrency(initialData.currency);
      if (initialData.method) setMethod(initialData.method);
      if (initialData.destination) setDestination(initialData.destination);
      if (initialData.reference) setReference(initialData.reference);
      if (initialData.date) setDate(initialData.date);
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
      });
    }
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
  }, [tab, recipient, sender, amount, currency, method, destination, reference, date]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml);
      setCopied(true);
      toast.success("✅ Professional HTML email copied! Paste directly into Gmail, Outlook, or webmail.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy. Please manually select and copy the HTML.");
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

        {/* Template Selector (ONLY 2 TEMPLATES) */}
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

        {/* Dynamic Context Fields Bar */}
        <div className="px-5 py-3 border-b border-border bg-card/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs shrink-0">
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
        <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between shrink-0">
          <p className="text-[11px] text-muted-foreground">
            {tab === "kyc_hold"
              ? "Template 1: Withdrawal On Hold with exact text & document checklist matching activity page."
              : "Template 2: Post-KYC Approval with 5-digit key requirement sent to original sender (Brooklyn)."}
          </p>
          <div className="flex items-center gap-2">
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
  const [method, setMethod] = useState("BHIM UPI (UPI)");
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
  }, [tab, recipient, sender, amount, currency, method, destination, reference, date]);

  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    toast.success("✅ Official HTML email copied! Paste directly into Gmail or Outlook.");
    setTimeout(() => setCopied(false), 2500);
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
          <p className="font-semibold text-foreground">💡 2 Specialized Clearance Templates</p>
          <p className="text-muted-foreground leading-relaxed">
            1. <strong>Withdrawal KYC Hold:</strong> Sent when a withdrawal is held. Contains the exact required documents (Live photo + matching ID) and guidance matching the activity page.<br />
            2. <strong>KYC Approved:</strong> Sent after KYC verification. Explains the 5-digit key sent to the sender (e.g. Brooklyn) to complete the loop and prevent fraud.
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
