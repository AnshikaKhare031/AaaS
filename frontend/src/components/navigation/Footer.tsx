import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Heart, ArrowRight, Check, MapPin } from 'lucide-react';
import { InstagramIcon } from '../common/InstagramIcon';
import { Logo } from '../common/Logo';
import { useToast } from '../../context/ToastContext';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { success, error } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      error('Please enter a valid email address.');
      return;
    }
    setIsSubscribed(true);
    success('Thank you for subscribing to AaaS Handmade Crochet ♡');
    setEmail('');
  };

  return (
    <footer className="bg-[#EADCCF]/50 border-t border-[#E7DFD7] text-[#5A4335] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-14 border-b border-[#E7DFD7]">
          {/* Column 1: Brand & Philosophy */}
          <div className="flex flex-col gap-4">
            <Logo size="lg" />
            <p className="text-sm text-[#7B6656] leading-relaxed max-w-sm font-sans mt-2">
              Thoughtfully crafted crochet pieces created slowly by hand. Designed to bring
              lasting warmth, tactile beauty, and heirloom elegance into your daily life.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-[#3D2E24] mb-4 tracking-wide">
              Navigation
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <Link to="/shop" className="text-[#7B6656] hover:text-[#3D2E24] transition-colors">
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link to="/#our-story" className="text-[#7B6656] hover:text-[#3D2E24] transition-colors">
                  Our Story & Craft
                </Link>
              </li>
              <li>
                <Link to="/custom-orders" className="text-[#7B6656] hover:text-[#3D2E24] transition-colors">
                  Custom Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-[#3D2E24] mb-4 tracking-wide">
              Customer Care
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <Link to="/shipping-returns" className="text-[#7B6656] hover:text-[#3D2E24] transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/shipping-returns" className="text-[#7B6656] hover:text-[#3D2E24] transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-[#7B6656] hover:text-[#3D2E24] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-conditions" className="text-[#7B6656] hover:text-[#3D2E24] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Atelier Contacts */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-[#3D2E24] mb-4 tracking-wide">
              Atelier Contacts
            </h4>
            <div className="flex flex-col gap-3.5 text-xs">
              <a
                href="mailto:hello@aaascrochet.com"
                className="group flex items-start gap-2.5 text-[#7B6656] hover:text-[#3D2E24] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-[#3D2E24]">Email Us</span>
                  <span className="text-[#7B6656] group-hover:text-[#3D2E24] transition-colors">hello@aaascrochet.com</span>
                </div>
              </a>

              <a
                href="tel:+919876543210"
                className="group flex items-start gap-2.5 text-[#7B6656] hover:text-[#3D2E24] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-[#3D2E24]">Customer Support</span>
                  <span className="text-[#7B6656] group-hover:text-[#3D2E24] transition-colors">+91 98765 43210</span>
                  <span className="block text-[11px] text-[#7B6656]/80">Mon–Sat, 10am–6pm IST</span>
                </div>
              </a>

              <a
                href="https://instagram.com/aaas_crochet"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2.5 text-[#7B6656] hover:text-[#3D2E24] transition-colors"
              >
                <InstagramIcon className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-[#3D2E24]">Instagram DM</span>
                  <span className="text-[#7B6656] group-hover:text-[#3D2E24] transition-colors">@aaas_crochet</span>
                </div>
              </a>

              <div className="flex items-start gap-2.5 text-[#7B6656]">
                <MapPin className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-[#3D2E24]">Artisan Studio</span>
                  <span className="text-[#7B6656]">Handcrafted with love in India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 5: Newsletter */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-[#3D2E24] mb-2 tracking-wide">
              Join the AaaS World
            </h4>
            <p className="text-xs text-[#7B6656] leading-relaxed mb-4">
              Be the first to discover new handmade collections, limited seasonal drops, and behind-the-scenes craft stories.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E7DFD7] rounded-xl text-[#3D2E24] placeholder-[#7B6656]/60 focus:outline-none focus:border-[#C6A15B] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-semibold tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                {isSubscribed ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Subscribed
                  </>
                ) : (
                  <>
                    Subscribe <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Craft tag */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7B6656]">
          <p>© {new Date().getFullYear()} AaaS. All rights reserved. Handcrafted in India.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-[#C6A15B] fill-current" /> for timeless living
          </p>
        </div>
      </div>
    </footer>
  );
};
