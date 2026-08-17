import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Sparkles,
  ShieldCheck,
  Clock,
  Mail,
  Phone,
  MapPin,
  Send,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { InstagramIcon } from '../../components/common/InstagramIcon';
import { useToast } from '../../context/ToastContext';

export const AboutPage: React.FC = () => {
  const location = useLocation();
  const { success, error } = useToast();

  // Scroll to hash anchor on load or hash change
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [isSent, setIsSent] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      error('Please fill in all required fields.');
      return;
    }
    setIsSent(true);
    success('Message sent! Our artisan team will reply within 24 hours ♡');
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
            Our Soul & Atelier
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#3D2E24] leading-tight">
            Made Slowly. <br />
            <span className="font-script text-[#C6A15B] font-normal italic">Made Beautifully.</span>
          </h1>
          <p className="text-sm sm:text-base text-[#7B6656] leading-relaxed max-w-xl mx-auto pt-2">
            A celebration of intentional hands, gentle organic fibers, and timeless crochet
            craftsmanship. Discover our story, craft philosophy, or connect directly with our studio.
          </p>

          {/* Quick jump links */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <a
              href="#story"
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#F8F5F0] border border-[#E7DFD7] text-[#5A4335] hover:bg-[#EADCCF] transition-colors"
            >
              Our Story
            </a>
            <a
              href="#values"
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#F8F5F0] border border-[#E7DFD7] text-[#5A4335] hover:bg-[#EADCCF] transition-colors"
            >
              Craft Values
            </a>
            <a
              href="#contact"
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#F8F5F0] border border-[#E7DFD7] text-[#5A4335] hover:bg-[#EADCCF] transition-colors"
            >
              Get in Touch
            </a>
            <a
              href="#faqs"
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#F8F5F0] border border-[#E7DFD7] text-[#5A4335] hover:bg-[#EADCCF] transition-colors"
            >
              FAQs
            </a>
          </div>
        </div>
      </section>

      {/* 2. Main Narrative Split (Story) */}
      <section id="story" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
              The Artisan Philosophy
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
              In a world of mass production, we choose the slow road.
            </h2>
            <p className="text-sm text-[#5A4335] leading-relaxed">
              At AaaS, every stitch begins with a single strand of yarn and a wooden hook. We
              don’t rely on automated factories or rushed assembly lines. Instead, our artisans
              crochet each petal, bag handle, and delicate coaster stitch-by-stitch, infusing
              every piece with human warmth, mindfulness, and care.
            </p>
            <p className="text-sm text-[#5A4335] leading-relaxed">
              Our bouquets never wilt. Our handbags carry memories across seasons. Our small
              accessories bring daily tactile comfort to your pockets and workspaces. This is
              slow luxury in its truest form.
            </p>

            <div className="p-4 bg-[#F8F5F0] rounded-2xl border-l-4 border-[#C6A15B] space-y-1">
              <p className="font-serif italic text-sm text-[#3D2E24]">
                "Crochet cannot be replicated by any machine in existence. Every single stitch on this site exists because human hands created it."
              </p>
              <p className="text-[11px] font-semibold text-[#7B6656] uppercase tracking-wider">
                — AaaS Artisan Atelier
              </p>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden border border-[#E7DFD7] shadow-xl aspect-[4/3] bg-white group">
              <img
                src="/images/artisan_hands.jpg"
                alt="Artisan Hands Crocheting"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4 Core Pillars of Craft */}
      <section id="values" className="bg-[#EADCCF]/30 border-y border-[#E7DFD7] py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
              Ethos & Principles
            </span>
            <h3 className="font-serif text-3xl font-semibold text-[#3D2E24]">Our Craft Values</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                title: 'Handmade Soul',
                desc: 'Every piece is unique, carrying the subtle, beautiful signature of human hands.',
              },
              {
                icon: Sparkles,
                title: 'Clean Natural Fibers',
                desc: 'We select hypoallergenic milk cotton and soft natural yarns that feel wonderful to touch.',
              },
              {
                icon: Clock,
                title: 'Zero Waste Production',
                desc: 'Yarns are cut precisely to measure, minimizing fabric scraps and promoting sustainable living.',
              },
              {
                icon: ShieldCheck,
                title: 'Heirloom Durability',
                desc: 'Reinforced stitches designed to be loved, washed gently, and passed down through generations.',
              },
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div key={i} className="p-6 bg-white rounded-2xl border border-[#E7DFD7] text-center space-y-3 shadow-2xs hover:border-[#C6A15B] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#EADCCF]/50 flex items-center justify-center mx-auto text-[#C6A15B]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg font-semibold text-[#3D2E24]">{pillar.title}</h4>
                  <p className="text-xs text-[#7B6656] leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Contact & Inquiries Section */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
            Connect With Us
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-[#3D2E24]">
            We’d Love to Hear From You
          </h2>
          <p className="text-sm sm:text-base text-[#7B6656]">
            Have questions about our collections, custom bespoke commissions, or collaborations? Reach out anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-[#E7DFD7] shadow-sm space-y-6">
              <h3 className="font-serif text-2xl font-semibold text-[#3D2E24]">Atelier Contacts</h3>

              <div className="space-y-4 text-xs text-[#5A4335]">
                <a
                  href="mailto:hello@aaascrochet.com"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F5F0] hover:bg-[#EADCCF]/50 transition-colors"
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
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F5F0] hover:bg-[#EADCCF]/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#C6A15B] shadow-2xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D2E24]">Customer Support</p>
                    <p className="text-[#7B6656]">+91 98765 43210 (Mon–Sat, 10am – 6pm IST)</p>
                  </div>
                </a>

                <a
                  href="https://instagram.com/aaas_crochet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F5F0] hover:bg-[#EADCCF]/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#C6A15B] shadow-2xs">
                    <InstagramIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D2E24]">Instagram DM</p>
                    <p className="text-[#7B6656]">@aaas_crochet</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F5F0]">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#C6A15B] shadow-2xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D2E24]">Artisan Studio</p>
                    <p className="text-[#7B6656]">Handcrafted with love in India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Commission Prompt */}
            <div className="bg-[#5A4335] text-white p-6 rounded-3xl space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-[#C6A15B]">
                <Sparkles className="w-5 h-5" />
                <h4 className="font-serif text-lg font-bold text-white">Seeking a Bespoke Creation?</h4>
              </div>
              <p className="text-xs text-[#EADCCF] leading-relaxed">
                Want custom colors, bridal sets, or special memorial bouquets? Submit a bespoke custom request.
              </p>
              <Link
                to="/custom-orders"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C6A15B] hover:text-white transition-colors pt-1"
              >
                Open Custom Order Form <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
                    setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                  }}
                  className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24]"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
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
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Product Question">Product Question</option>
                      <option value="Custom Bespoke Commission">Custom Bespoke Commission</option>
                      <option value="Wholesale / Corporate Gifting">Wholesale / Corporate Gifting</option>
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
                    placeholder="How can our artisan studio help you?"
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
      </section>

      {/* 5. Frequently Asked Questions Accordion */}
      <section id="faqs" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-10 border-t border-[#E7DFD7] scroll-mt-24">
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
      </section>

      {/* 6. Catalog Call-To-Action */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6 pt-6">
        <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
          Ready to experience the warmth of AaaS?
        </h3>
        <p className="text-xs text-[#7B6656] max-w-md mx-auto">
          Explore our current drop of handmade bouquets and everyday accessories, or commission a piece tailored to you.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/shop"
            className="px-8 py-3 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#3D2E24] transition-colors shadow-md"
          >
            Explore Catalog
          </Link>
          <Link
            to="/custom-orders"
            className="px-8 py-3 bg-white text-[#5A4335] border border-[#E7DFD7] text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#F8F5F0] transition-colors"
          >
            Custom Inquiry
          </Link>
        </div>
      </section>
    </div>
  );
};
