import nodemailer from "nodemailer";

export function appBaseUrl() {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

function createTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim();
  if (!host || !from) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth:
      process.env.SMTP_USER?.trim() || process.env.SMTP_PASS?.trim()
        ? {
            user: process.env.SMTP_USER?.trim() || "",
            pass: process.env.SMTP_PASS?.trim() || "",
          }
        : undefined,
  });
}

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Sends e-mail via SMTP. When SMTP is not configured, logs the message
 * (useful in local/dev) and returns `{ logged: true }`.
 */
export async function sendMail(input: SendMailInput): Promise<{
  ok: boolean;
  logged?: boolean;
  error?: string;
}> {
  const from = process.env.SMTP_FROM?.trim() || "noreply@localhost";
  const transport = createTransport();

  if (!transport) {
    console.info(
      `[mail:dev] to=${input.to} subject=${input.subject}\n${input.text}`,
    );
    return { ok: true, logged: true };
  }

  try {
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<pre style="font-family:sans-serif">${escapeHtml(input.text)}</pre>`,
    });
    return { ok: true };
  } catch (error) {
    console.error("[mail]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao enviar e-mail",
    };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
