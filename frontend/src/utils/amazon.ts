// Builds an Amazon "add multiple items to cart" URL.
// Amazon supports: https://www.amazon.in/gp/aws/cart/add.html?ASIN.1=XXXX&Quantity.1=2&ASIN.2=YYYY&Quantity.2=1
// An optional Associates tag can be appended later via AssociateTag param — leave a TODO/param for it, unset by default.

export interface AmazonCartLineItem {
  asin: string;
  quantity: number;
}

const AMAZON_DOMAIN = 'https://www.amazon.in'; // confirm correct domain/marketplace before shipping
const ASSOCIATE_TAG: string | undefined = undefined; // TODO: Set your Amazon Associates tag here when available

export function buildAmazonCartUrl(items: AmazonCartLineItem[]): string | null {
  const valid = items.filter((i) => i.asin && i.asin.trim().length > 0);
  if (valid.length === 0) return null;

  const params = new URLSearchParams();
  valid.forEach((item, idx) => {
    const n = idx + 1;
    params.set(`ASIN.${n}`, item.asin);
    params.set(`Quantity.${n}`, String(item.quantity));
  });
  if (ASSOCIATE_TAG) params.set('AssociateTag', ASSOCIATE_TAG);

  return `${AMAZON_DOMAIN}/gp/aws/cart/add.html?${params.toString()}`;
}

export function buildAmazonSingleItemUrl(asin?: string | null, quantity: number = 1): string | null {
  if (!asin || asin.trim().length === 0) return null;
  return buildAmazonCartUrl([{ asin, quantity }]);
}
