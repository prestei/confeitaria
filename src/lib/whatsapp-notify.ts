import { digitsOnly } from "@/lib/utils";

export function whatsappNotifyConfigured() {
  return Boolean(
    (process.env.WHATSAPP_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()) ||
      (process.env.WHATSAPP_EVOLUTION_URL?.trim() &&
        process.env.WHATSAPP_EVOLUTION_INSTANCE?.trim()) ||
      process.env.WHATSAPP_WEBHOOK_URL?.trim(),
  );
}

function toE164(phone: string) {
  const digits = digitsOnly(phone);
  if (!digits) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

/**
 * Sends a WhatsApp text to the store owner via Meta Cloud API, Evolution API,
 * or a generic webhook — whichever is configured.
 */
export async function sendWhatsAppText(
  phone: string,
  text: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const to = toE164(phone);
  if (!to) {
    return { ok: false, error: "Telefone inválido" };
  }

  const metaToken = process.env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (metaToken && phoneNumberId) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${metaToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: text },
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[whatsapp:meta]", res.status, body);
        return { ok: false, error: `Meta API ${res.status}` };
      }
      return { ok: true };
    } catch (error) {
      console.error("[whatsapp:meta]", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Falha WhatsApp",
      };
    }
  }

  const evolutionUrl = process.env.WHATSAPP_EVOLUTION_URL?.replace(/\/$/, "");
  const instance = process.env.WHATSAPP_EVOLUTION_INSTANCE?.trim();
  const evolutionKey = process.env.WHATSAPP_EVOLUTION_KEY?.trim();
  if (evolutionUrl && instance) {
    try {
      const res = await fetch(
        `${evolutionUrl}/message/sendText/${encodeURIComponent(instance)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(evolutionKey ? { apikey: evolutionKey } : {}),
          },
          body: JSON.stringify({
            number: to,
            text,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[whatsapp:evolution]", res.status, body);
        return { ok: false, error: `Evolution API ${res.status}` };
      }
      return { ok: true };
    } catch (error) {
      console.error("[whatsapp:evolution]", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Falha WhatsApp",
      };
    }
  }

  const webhook = process.env.WHATSAPP_WEBHOOK_URL?.trim();
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.WHATSAPP_WEBHOOK_TOKEN?.trim()
            ? {
                Authorization: `Bearer ${process.env.WHATSAPP_WEBHOOK_TOKEN.trim()}`,
              }
            : {}),
        },
        body: JSON.stringify({ to, phone: to, text, message: text }),
      });
      if (!res.ok) {
        console.error("[whatsapp:webhook]", res.status);
        return { ok: false, error: `Webhook ${res.status}` };
      }
      return { ok: true };
    } catch (error) {
      console.error("[whatsapp:webhook]", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Falha WhatsApp",
      };
    }
  }

  console.info(`[whatsapp:dev] to=${to}\n${text}`);
  return { ok: true, skipped: true };
}
