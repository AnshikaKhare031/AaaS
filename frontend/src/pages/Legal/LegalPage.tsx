import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export const LegalPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Privacy Policy';
  let subtitle = 'How we protect and cherish your personal data.';

  if (path.includes('terms')) {
    title = 'Terms & Conditions';
    subtitle = 'Our boutique terms for purchasing handcrafted goods.';
  } else if (path.includes('shipping')) {
    title = 'Shipping & Returns';
    subtitle = 'Our delivery policies and handcrafted exchange guidelines.';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div className="text-center space-y-2 border-b border-[#E7DFD7] pb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
          AaaS Atelier Policy
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">{title}</h1>
        <p className="text-xs text-[#7B6656]">{subtitle}</p>
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#E7DFD7] shadow-sm text-xs sm:text-sm text-[#5A4335] leading-relaxed space-y-6">
        {path.includes('shipping') ? (
          <>
            <section className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">1. Handcrafted Processing Times</h3>
              <p>
                Each AaaS creation is handcrafted. Ready-to-ship products are dispatched within 2–4 business days. Custom bespoke orders require 7–14 days of artisan production before courier handover.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">2. Shipping Charges & Free Shipping</h3>
              <p>
                Orders totaling ₹1,499 and above receive Free Standard Shipping across India. For orders below this threshold, a flat fixed shipping fee of ₹99 is applied at checkout.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">3. Returns & Exchange Policy</h3>
              <p>
                Due to the delicate, handcrafted nature of our crochet pieces, returns are accepted within 7 days of delivery only if the piece arrives damaged in transit. If your piece arrives damaged, please email hello@aaascrochet.com with photos for an immediate replacement.
              </p>
            </section>
          </>
        ) : path.includes('terms') ? (
          <>
            <section className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">1. Handmade Authenticity</h3>
              <p>
                Because all AaaS items are crocheted by human hands, slight variations in stitch tension, yarn dye lots, and dimensions (up to ±5%) are natural hallmarks of authentic artisan craft.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">2. Pricing & Orders</h3>
              <p>
                All prices are listed in Indian Rupees (INR / ₹) inclusive of applicable taxes. Catalog purchases are fulfilled securely via Amazon India. Bespoke custom commissions are arranged directly with our master artisan.
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">1. Information We Collect</h3>
              <p>
                We only collect your name, email, phone number, and delivery address to fulfill your orders and keep you updated on your handcrafted shipments.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">2. Safe Data Storage</h3>
              <p>
                Your account credentials and authentication are handled securely by Supabase with Row Level Security (RLS) policies. We never sell or share your data with third-party advertisers.
              </p>
            </section>
          </>
        )}
      </div>

      <div className="text-center pt-4">
        <Link to="/" className="text-xs font-bold uppercase tracking-wider text-[#C6A15B] hover:underline">
          ← Return to Storefront
        </Link>
      </div>
    </div>
  );
};
