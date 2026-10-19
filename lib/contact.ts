/**
 * Shared contact configuration module for AAAS.
 * Centralizes WhatsApp, Instagram, and Contact Email configuration
 * sourced from environment variables with safe fallbacks and normalization.
 */

function parseWhatsApp(raw?: string) {
  const trimmed = (raw || "").trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return {
      number: "917668251162",
      display: "+91 76682 51162",
      isConfigured: false,
    };
  }

  // Format display string if user provided raw digits
  let display = trimmed;
  if (!trimmed.startsWith("+")) {
    if (digits.length === 12 && digits.startsWith("91")) {
      display = `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    } else if (digits.length === 10) {
      display = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    } else {
      display = `+${digits}`;
    }
  }

  return {
    number: digits,
    display,
    isConfigured: true,
  };
}

function parseInstagram(raw?: string) {
  const trimmed = (raw || "").trim();
  const clean = trimmed.replace(/^[@/]+/, "").replace(/\/+$/, "").trim();

  if (!clean) {
    return {
      username: "aaas.crochets",
      handle: "@aaas.crochets",
      url: "https://instagram.com/aaas.crochets",
      isConfigured: false,
    };
  }

  return {
    username: clean,
    handle: `@${clean}`,
    url: `https://instagram.com/${clean}`,
    isConfigured: true,
  };
}

function parseEmail(raw?: string) {
  const trimmed = (raw || "").trim();

  if (!trimmed) {
    return {
      email: "craftymindstudios@gmail.com",
      isConfigured: false,
    };
  }

  return {
    email: trimmed,
    isConfigured: true,
  };
}

const parsedWhatsApp = parseWhatsApp(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
const parsedInstagram = parseInstagram(
  process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE
);
const parsedEmail = parseEmail(
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL
);

export const contactConfig = {
  // WhatsApp
  whatsAppNumber: parsedWhatsApp.number,
  whatsAppDisplay: parsedWhatsApp.display,
  isWhatsAppConfigured: parsedWhatsApp.isConfigured,

  // Instagram
  instagramUsername: parsedInstagram.username,
  instagramHandle: parsedInstagram.handle,
  instagramUrl: parsedInstagram.url,
  isInstagramConfigured: parsedInstagram.isConfigured,

  // Email
  contactEmail: parsedEmail.email,
  supportEmail: parsedEmail.email,
  isEmailConfigured: parsedEmail.isConfigured,
};

/**
 * Generates a WhatsApp click-to-chat URL with an optional prefilled message.
 * Normalizes destination number to digits only.
 * @param text Optional prefilled message.
 */
export function getWhatsAppLink(text?: string): string {
  const base = `https://wa.me/${contactConfig.whatsAppNumber}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a WhatsApp URL specifically for questions about a dynamic product title.
 * @param productTitle The name/title of the product.
 */
export function getProductWhatsAppLink(productTitle: string): string {
  const message = `Hi AaaS! I'm interested in the "${productTitle}". Could you tell me more about it?`;
  return getWhatsAppLink(message);
}

/**
 * Returns the configured Instagram profile URL.
 */
export function getInstagramUrl(): string {
  return contactConfig.instagramUrl;
}

/**
 * Returns a mailto: link using the configured contact email with optional subject and body.
 */
export function getMailtoLink(subject?: string, body?: string): string {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  return `mailto:${contactConfig.contactEmail}${queryString}`;
}
