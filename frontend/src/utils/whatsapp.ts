// TODO: replace with the real business WhatsApp number (country code + number, no spaces/dashes/plus sign)
// e.g. '919876543210' for +91 98765 43210
export const WHATSAPP_BUSINESS_NUMBER = '910000000000'; // PLACEHOLDER — swap before launch

export interface WhatsAppOrderItem {
  name: string;
  price: number;
  quantity: number;
}

export function buildWhatsAppOrderUrl(items: WhatsAppOrderItem[]): string {
  const lines = [
    "Hi! I'd like to order:",
    '',
    ...items.map(
      (item) => `• ${item.name} x${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}`
    ),
    '',
    `Total: ₹${items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}`,
  ];
  const message = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${message}`;
}

export function buildWhatsAppSingleItemUrl(name: string, price: number, quantity: number = 1): string {
  return buildWhatsAppOrderUrl([{ name, price, quantity }]);
}
