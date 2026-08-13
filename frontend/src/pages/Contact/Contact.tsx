import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, ChevronDown, CheckCircle2 } from 'lucide-react';
import { InstagramIcon } from '../../components/common/InstagramIcon';
import { useToast } from '../../context/ToastContext';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Order Inquiry',
    message: '',
  });
  const [isSent, setIsSent] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { success, error } = useToast();

  const faqs = [
    {
      q: 'How long does a custom crochet piece take to create?',
      a: 'Because every stitch is handcrafted by our master artisan, custom bouquets and handbags typically take 7 to 14 business days to produce before dispatch. Rush orders can sometimes be accommodated upon request.',
    },
    {
      q: 'How do I care for and clean my crochet flower bouquet?',
      a: 'Crochet flowers are everlasting! Keep them away from high moisture. To remove dust, simply blow with a hairdryer on cool setting or use a very soft bristle brush. You can bend the wire stems to fit different vase sizes.',
    },
    {
      q: 'What are your delivery timelines and shipping charges?',
      a: 'We ship across India. Standard orders are dispatched within 2–3 days and delivered in 4–7 business days. Orders above ₹1,499 qualify for Free Shipping; otherwise, a flat ₹99 fixed shipping charge applies.',
    },
    {
      q: 'Can I request a personalized handwritten message card for gifting?',
      a: 'Yes, absolutely! During checkout, simply add your custom note in the "Order Notes" box and we will handwrite your message on luxury gold-foil craft cardstock free of charge.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      error('Please fill in all required fields.');
      return;
    }
    setIsSent(true);
    success('Message sent! Our artisan team will reply within 24 hours ♡');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
          Get in Touch
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#3D2E24]">
          We’d Love to Hear From You
        </h1>
        <p className="text-sm sm:text-base text-[#7B6656]">
          Have questions about our collections, custom commissions, or orders? Reach out anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Info & Channels */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-[#E7DFD7] shadow-sm space-y-6">
            <h3 className="font-serif text-2xl font-semibold text-[#3D2E24]">Atelier Contacts</h3>

            <div className="space-y-4 text-xs text-[#5A4335]">
              <a
                href="mailto:hello@aaascrochet.com"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F5F0] hover:bg-[#EADCCF]/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#C6A15B] shadow-2xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#3D2E24]">Email Us</p>
                  <p className="text-[#7B6656]">hello@aaascrochet.com</p>
                </div>
              </a>

              <a
                href="tel:+919876543210"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F5F0] hover:bg-[#EADCCF]/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#C6A15B] shadow-2xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#3D2E24]">Call Customer Care</p>
                  <p className="text-[#7B6656]">+91 98765 43210 (Mon-Sat, 10am - 6pm)</p>
                </div>
              </a>

              <a
                href="https://instagram.com/aaas_crochet"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F5F0] hover:bg-[#EADCCF]/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#C6A15B] shadow-2xs">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#3D2E24]">Instagram DM</p>
                  <p className="text-[#7B6656]">@aaas_crochet</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-[#E7DFD7] shadow-sm">
          {isSent ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[#8FA57D] mx-auto" />
              <h3 className="font-serif text-2xl font-bold text-[#3D2E24]">Message Received ♡</h3>
              <p className="text-xs text-[#7B6656] max-w-sm mx-auto">
                Thank you for contacting AaaS. Our team will review your inquiry and get back to you shortly.
              </p>
              <button
                onClick={() => {
                  setIsSent(false);
                  setFormData({ name: '', email: '', phone: '', subject: 'Order Inquiry', message: '' });
                }}
                className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24]"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-[#3D2E24] mb-2">
                Send Us a Note
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  >
                    <option value="Order Inquiry">Order Inquiry</option>
                    <option value="Custom Order Inquiry">Custom Order Inquiry</option>
                    <option value="Shipping & Delivery">Shipping & Delivery</option>
                    <option value="Wholesale / Gifting">Wholesale / Corporate Gifting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4335] mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                Send Message <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="max-w-4xl mx-auto space-y-6 pt-10 border-t border-[#E7DFD7]">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
            Got Questions?
          </span>
          <h2 className="font-serif text-3xl font-semibold text-[#3D2E24]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-[#E7DFD7] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif text-lg font-semibold text-[#3D2E24]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#7B6656] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#C6A15B]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#7B6656] leading-relaxed border-t border-[#E7DFD7]/60 pt-3 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
