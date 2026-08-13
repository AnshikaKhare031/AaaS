import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Sparkles, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
            Our Soul & Story
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#3D2E24] leading-tight">
            Made Slowly. <br />
            <span className="font-script text-[#C6A15B] font-normal italic">Made Beautifully.</span>
          </h1>
          <p className="text-sm sm:text-base text-[#7B6656] leading-relaxed max-w-xl mx-auto pt-2">
            A celebration of intentional hands, gentle organic fibers, and the timeless art of
            crochet crafted with patience and love.
          </p>
        </div>
      </section>

      {/* Main Narrative Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
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
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden border border-[#E7DFD7] shadow-xl aspect-[4/3] bg-white">
              <img
                src="/images/artisan_hands.jpg"
                alt="Artisan Hands Crocheting"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section className="bg-[#EADCCF]/30 border-y border-[#E7DFD7] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
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
                <div key={i} className="p-6 bg-white rounded-2xl border border-[#E7DFD7] text-center space-y-3">
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

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
          Ready to experience the warmth of AaaS?
        </h3>
        <div className="flex justify-center gap-4">
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
