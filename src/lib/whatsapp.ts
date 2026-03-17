// WhatsApp notification via Twilio
export async function notifyAdmin(message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.ADMIN_WHATSAPP_TO;

  if (!accountSid || !authToken || !from || !to) {
    console.warn("WhatsApp not configured — skipping notification");
    console.log("Would have sent:", message);
    return null;
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);

    const result = await client.messages.create({
      body: message,
      from,
      to,
    });

    console.log("WhatsApp sent:", result.sid);
    return result;
  } catch (error) {
    console.error("WhatsApp notification failed:", error);
    throw error;
  }
}

// Pre-formatted messages
export function formatNewRequestMessage(data: {
  name: string;
  phone: string;
  carMake: string;
  carModel: string;
  carYear: string;
  position: string;
  licensePlate?: string;
  catalogNumber?: string;
  notes?: string;
  requestId: string;
}) {
  const positionLabel = data.position === "FRONT" ? "קדמי" : "אחורי";
  const plateLine = data.licensePlate ? `\nמספר רכב: ${data.licensePlate}` : "";
  const catalogLine = data.catalogNumber ? `\nמק"ט: ${data.catalogNumber}` : "";
  return `🔔 בקשה חדשה ב-DTM!
לקוח: ${data.name} (${data.phone})
רכב: ${data.carMake} ${data.carModel} ${data.carYear} — ${positionLabel}${plateLine}${catalogLine}
הערה: "${data.notes || "-"}"
https://dtmparts.co.il/admin/requests/${data.requestId}`;
}

export function formatNewMessageNotification(data: {
  customerName: string;
  preview: string;
  requestId: string;
}) {
  return `💬 הודעה חדשה מ-${data.customerName}
"${data.preview}"
https://dtmparts.co.il/admin/requests/${data.requestId}`;
}

export async function sendWhatsApp(to: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.warn("WhatsApp not configured — skipping send to", to);
    return null;
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from,
      to: `whatsapp:${to}`,
    });
    return result;
  } catch (error) {
    console.error("WhatsApp send failed:", error);
    return null;
  }
}

export function formatStockAlertMessage(data: {
  customerName: string;
  carMake: string;
  carModel: string;
  carYear?: string;
  bumperName: string;
}) {
  return `🟢 התראת מלאי — DTM PARTS
שלום ${data.customerName}!
הטמבון שחיפשת חזר למלאי:
${data.bumperName}
רכב: ${data.carMake} ${data.carModel}${data.carYear ? ` ${data.carYear}` : ""}
כנס/י לאתר לפרטים נוספים או שלח/י לנו הודעה!`;
}

export function formatNewCustomerMessage(data: {
  name: string;
  phone: string;
  businessName?: string;
}) {
  return `👤 לקוח חדש נרשם!
שם: ${data.name}
טלפון: ${data.phone}
${data.businessName ? `עסק: ${data.businessName}` : ""}`;
}
