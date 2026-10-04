import React from "react";
import PolicyLayout from "@/components/Policy/PolicyLayout";
import { SHIPPING_FREE_THRESHOLD, SHIPPING_FLAT_CHARGE } from "@/lib/shipping";
import { getCanonicalUrl, siteConfig } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/schema";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy | Crafty Mind Studio",
  description: "Learn about our processing timelines, estimated domestic shipping times, and tracking details at Crafty Mind Studio.",
  alternates: {
    canonical: getCanonicalUrl("/shipping-policy"),
  },
  openGraph: {
    title: "Shipping Policy | Crafty Mind Studio",
    description: "Read details about order processing, packing precautions, and estimated delivery dates across India.",
  },
};

export default function ShippingPolicyPage() {
  const lastUpdatedDate = "July 18, 2026";
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", item: siteConfig.url },
    { name: "Shipping Policy", item: `${siteConfig.url}/shipping-policy` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <PolicyLayout title="Shipping Policy" lastUpdated={lastUpdatedDate}>
      <div className="space-y-6 font-sans text-sm md:text-base leading-relaxed text-[#5C745F]">
        
        <p>
          Thank you for choosing AaaS! Because our crochet creations are handmade and customized, they require dedicated artisanal preparation and protective packaging to arrive safely at your doorstep. Below is our shipping workflow and terms.
        </p>

        {/* Section 1 */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-[#25382E] text-lg md:text-xl border-b border-[#E5DACB] pb-2">
            1. Domestic Shipping within India
          </h3>
          <p>
            We currently deliver exclusively to locations across India. We partner with reliable logistics networks to ensure that your orders are handled carefully and delivered securely.
          </p>
          <p>
            Free shipping on all orders of <strong>₹{SHIPPING_FREE_THRESHOLD} or more</strong>. A flat <strong>₹{SHIPPING_FLAT_CHARGE} shipping charge</strong> applies to orders below <strong>₹{SHIPPING_FREE_THRESHOLD}</strong>.
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-[#25382E] text-lg md:text-xl border-b border-[#E5DACB] pb-2">
            2. Crafting & Processing Time
          </h3>
          <p>
            Unlike mass-produced items, our crochet pieces and custom heirlooms are created by hand with patience and care.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Standard Orders:</strong> Processed and packed within **2 to 4 business days** from payment confirmation.</li>
            <li><strong>Customized/Personalized Orders:</strong> May require **4 to 6 business days** for custom crochet stitch completion and finishing before packaging.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-[#25382E] text-lg md:text-xl border-b border-[#E5DACB] pb-2">
            3. Delivery Timelines
          </h3>
          <p>
            Our standard order fulfillment timeline, including crafting, packaging, and shipping, is approximately <strong>10–12 business days</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Estimated order delivery: 10–12 business days</strong></li>
          </ul>
          <p>
            This estimate includes order processing, quality checks, packaging, and transit time.
          </p>
          <p className="mt-2 text-[#5C745F]/80 italic text-xs">
            *Please note: Delivery timelines are estimates. Delays due to public holidays, adverse weather, or regional courier issues are beyond our direct control.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-[#25382E] text-lg md:text-xl border-b border-[#E5DACB] pb-2">
            4. Order Tracking
          </h3>
          <p>
            As soon as your package is dispatched, we send you a confirmation message with the shipment details and courier tracking information. You can track your shipment status in real time using our public <a href="/track-order" className="text-[#25382E] hover:text-[#EC8D99] underline font-semibold">Track Order</a> page by entering your Order Number and Email Address.
          </p>
        </div>

        {/* Section 5 */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-[#25382E] text-lg md:text-xl border-b border-[#E5DACB] pb-2">
            5. Delivery Address Accuracy
          </h3>
          <p>
            Customers are responsible for providing complete and correct shipping details (including house number, street, landmark, and a valid 6-digit PIN code) during checkout. AaaS cannot be held liable for delivery failures, delays, or packages returned to us due to incorrect address formats or missing contact numbers.
          </p>
        </div>

        {/* Section 6 */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-[#25382E] text-lg md:text-xl border-b border-[#E5DACB] pb-2">
            6. Shipping Queries
          </h3>
          <p>
            For any concerns regarding dispatch schedules or address corrections, please reach out:
          </p>
          <div className="bg-[#F8F2E7] p-4 rounded-xl border border-[#E5DACB] mt-2 space-y-1 font-sans text-sm">
            <p><strong>Email:</strong> craftymindstudios@gmail.com</p>
            <p><strong>Instagram:</strong> @craftymindstudio</p>
          </div>
        </div>

      </div>
    </PolicyLayout>
    </>
  );
}
