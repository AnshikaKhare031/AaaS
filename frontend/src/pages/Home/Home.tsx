import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Heart,
  ShieldCheck,
  Gift,
  Clock,
  Star,
} from 'lucide-react';
import { InstagramIcon } from '../../components/common/InstagramIcon';
import { ProductCard } from '../../components/products/ProductCard';
import { Product } from '../../types';
import { getProducts } from '../../services/api';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Scroll to hash anchor on load or hash change
  useEffect(() => {
    if (location.hash) {
      const timer = setTimeout(() => {
        const el = document.querySelector(location.hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await getProducts({ limit: 8 });
        setProducts(prodRes.products || []);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const bestsellers = products.filter((p) => p.is_bestseller).slice(0, 4);
  const featuredProducts = products.slice(0, 4);

  const testimonials = [
    {
      name: 'Aishwarya R.',
      location: 'Bengaluru',
      rating: 5,
      product: 'Crochet Tulip Bouquet',
      text: 'The tulip bouquet arrived in the most exquisite packaging. The stitches are unimaginably clean and the colors are even more enchanting in person. It has brought so much warmth to my coffee table.',
    },
    {
      name: 'Devika Menon',
      location: 'Mumbai',
      rating: 5,
      product: 'Crochet Mini Handbag',
      text: 'I ordered the chunky knit handbag for a summer brunch and received endless compliments! The bamboo handles add such a luxurious touch. You can truly feel the slow artisan care in every stitch.',
    },
    {
      name: 'Simran Jolly',
      location: 'Delhi',
      rating: 5,
      product: 'Bespoke Custom Order',
      text: 'I submitted a custom request for my bridal floral bouquet in soft sage and peach. The AaaS team kept me updated at every stage. It is an heirloom piece I will treasure forever.',
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-16 overflow-hidden">
      {/* SECTION 2 — HERO */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-6 flex flex-col items-start gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EADCCF]/70 border border-[#E7DFD7] text-xs font-semibold tracking-wider uppercase text-[#5A4335]">
              <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" /> Pure Handcrafted Artistry
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl xl:text-7xl font-semibold text-[#3D2E24] leading-[1.08] tracking-tight">
              Handmade with <span className="font-script text-[#C6A15B] font-normal italic">Love</span>
            </h1>

            <p className="font-sans text-base sm:text-lg text-[#7B6656] max-w-lg leading-relaxed">
              Timeless crochet pieces, thoughtfully crafted by hand. Bringing tactile elegance,
              gentle textures, and slow luxury into your cherished spaces.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
              <Link
                to="/shop"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                Shop Collection <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/custom-orders"
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-[#F8F5F0] text-[#5A4335] border border-[#E7DFD7] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                Explore Custom Orders
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-[#E7DFD7] text-xs text-[#7B6656]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8FA57D]" />
                <span>100% Cotton & Wool</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C6A15B]" />
                <span>Slow Artisan Production</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Image Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-6 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#E7DFD7] bg-[#EADCCF]/30 aspect-[4/3] sm:aspect-[16/11]">
              <img
                src="/images/hero_lifestyle.jpg"
                alt="AaaS Luxury Crochet Lifestyle"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/50 flex items-center justify-between text-[#3D2E24]">
                <div>
                  <p className="font-serif text-sm font-semibold">Everlasting Floral & Bags Drop</p>
                  <p className="text-[11px] text-[#7B6656]">New Spring / Summer Collection</p>
                </div>
                <Link
                  to="/shop"
                  className="px-4 py-2 bg-[#5A4335] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#3D2E24] transition-colors"
                >
                  View Drop
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — BESTSELLERS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] mb-2 block">
            Most Cherished
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24] mb-3">
            Bestselling Handmade Pieces
          </h2>
          <p className="text-sm text-[#7B6656]">
            Our community’s favorite crochet bouquets, bags, and daily keepsakes.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {(bestsellers.length > 0 ? bestsellers : featuredProducts).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* SECTION 4 — OUR STORY & CRAFT VALUES */}
      <section id="our-story" className="bg-[#EADCCF]/30 border-y border-[#E7DFD7] py-20 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Narrative & Artisan Visual Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
                The Artisan Philosophy
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#3D2E24] leading-tight">
                In a world of mass production, <br />
                <span className="font-script text-[#C6A15B] font-normal italic">we choose the slow road.</span>
              </h2>
              <p className="text-sm sm:text-base text-[#7B6656] leading-relaxed">
                At AaaS, every stitch begins with a single strand of yarn and a wooden hook. We
                don’t rely on automated factories or rushed assembly lines. Instead, our artisans
                crochet each petal, bag handle, and keepsake stitch-by-stitch, infusing
                every piece with human warmth, mindfulness, and care.
              </p>
              <p className="text-sm sm:text-base text-[#7B6656] leading-relaxed">
                Our bouquets never wilt. Our handbags carry memories across seasons. This is
                slow luxury in its truest form.
              </p>

              <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border-l-4 border-[#C6A15B] shadow-2xs space-y-1">
                <p className="font-serif italic text-sm text-[#3D2E24]">
                  "Crochet cannot be replicated by any machine in existence. Every single stitch on this site exists because human hands created it."
                </p>
                <p className="text-[11px] font-semibold text-[#7B6656] uppercase tracking-wider">
                  — AaaS Artisan Atelier
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden border border-[#E7DFD7] shadow-xl aspect-[4/3] bg-white group">
                <img
                  src="/images/artisan_hands.jpg"
                  alt="Artisan Hands Crocheting"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-5 -right-5 hidden sm:block p-5 rounded-2xl bg-white border border-[#E7DFD7] shadow-lg max-w-xs">
                <p className="font-script text-2xl text-[#C6A15B] leading-none mb-1">
                  with patience & love
                </p>
                <p className="text-[11px] text-[#7B6656]">Every single petal and stitch is made by hand.</p>
              </div>
            </div>
          </div>

          {/* Craft Values / Pillars */}
          <div className="pt-4 border-t border-[#E7DFD7]/80">
            <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
                Ethos & Principles
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#3D2E24]">Our Craft Values</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Heart,
                  title: 'Handmade Soul',
                  desc: 'Every piece carries the unique, subtle signature of human hands.',
                },
                {
                  icon: Sparkles,
                  title: 'Clean Natural Fibers',
                  desc: 'Hypoallergenic milk cotton and soft organic yarns gentle to the touch.',
                },
                {
                  icon: Clock,
                  title: 'Zero Waste Craft',
                  desc: 'Precision yarn measures minimize scrap and honor mindful sustainability.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Heirloom Durability',
                  desc: 'Reinforced stitches designed to be loved, washed, and treasured for years.',
                },
              ].map((pillar, i) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={i}
                    className="p-6 bg-white/90 backdrop-blur-xs rounded-2xl border border-[#E7DFD7] text-center space-y-3 shadow-2xs hover:border-[#C6A15B] transition-colors"
                  >
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
        </div>
      </section>

      {/* SECTION 6 — CUSTOM ORDERS TEASER */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-[#5A4335] text-white p-8 sm:p-14 border border-[#3D2E24]">
          <div className="relative z-10 max-w-xl space-y-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
              Bespoke Creations
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold leading-tight">
              Have Something Special in Mind?
            </h2>
            <p className="text-sm sm:text-base text-[#DDD6CF] leading-relaxed">
              From personalized wedding bouquets to custom color-matched handbag palettes and nursery
              keepsakes—we craft custom crochet pieces tailored entirely to your imagination.
            </p>
            <Link
              to="/custom-orders"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#C6A15B] hover:bg-[#b08d47] text-[#3D2E24] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-98"
            >
              Create a Custom Order <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {/* Subtle background overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img
              src="/images/custom_banner.jpg"
              alt="Custom Orders Background"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* SECTION 7 — WHY AaaS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] mb-2 block">
            Our Promise
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
            Why Choose AaaS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: '100% Handmade',
              description: 'Never mass produced. Every item is hand-crocheted stitch by stitch.',
            },
            {
              icon: Heart,
              title: 'Thoughtfully Crafted',
              description: 'Designed with timeless aesthetics that complement modern living.',
            },
            {
              icon: Sparkles,
              title: 'Premium Materials',
              description: 'Soft milk cotton yarns, natural wood accents, and durable hardware.',
            },
            {
              icon: Gift,
              title: 'Made for Gifting',
              description: 'Delivered in luxury gift packaging with optional personalized note cards.',
            },
          ].map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="p-6 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs text-center flex flex-col items-center gap-3 hover:border-[#C6A15B]/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#EADCCF]/50 flex items-center justify-center text-[#5A4335]">
                  <Icon className="w-6 h-6 text-[#C6A15B]" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#3D2E24]">{benefit.title}</h3>
                <p className="text-xs text-[#7B6656] leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 8 — TESTIMONIALS */}
      <section className="bg-[#EADCCF]/30 border-y border-[#E7DFD7] py-20">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] mb-2 block">
              Customer Love
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
              Words from Our Patrons
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-7 rounded-2xl border border-[#E7DFD7] shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex text-[#C6A15B] gap-1">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#5A4335] leading-relaxed font-sans italic">
                    "{item.text}"
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E7DFD7] flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-base font-semibold text-[#3D2E24]">{item.name}</h4>
                    <p className="text-[11px] text-[#7B6656]">{item.location}</p>
                  </div>
                  <span className="text-[10px] uppercase font-semibold px-2 py-1 bg-[#EADCCF]/60 text-[#5A4335] rounded-md">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — INSTAGRAM GALLERY */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#5A4335] mb-2">
            <InstagramIcon className="w-4 h-4 text-[#C6A15B]" /> @aaas_crochet
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
            Follow Our Craft on Instagram
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { img: '/images/tulip_bouquet.jpg', label: 'Tulip Studio' },
            { img: '/images/mini_handbag.jpg', label: 'Artisan Bag' },
            { img: '/images/flower_coaster.jpg', label: 'Blossom Coasters' },
            { img: '/images/daisy_bouquet.jpg', label: 'Daisy Blooms' },
          ].map((post, i) => (
            <a
              key={i}
              href="https://instagram.com/aaas_crochet"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-2xl overflow-hidden border border-[#E7DFD7] block"
            >
              <img
                src={post.img}
                alt={post.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <InstagramIcon className="w-6 h-6" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* SECTION 10 — FINAL CTA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#EADCCF] rounded-3xl p-10 sm:p-16 text-center border border-[#DDD6CF] shadow-xs">
          <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#3D2E24] mb-4">
            Something Handmade, Just for You.
          </h2>
          <p className="text-sm sm:text-base text-[#7B6656] max-w-xl mx-auto mb-8 leading-relaxed">
            Whether choosing a ready-to-ship bouquet or commissioning a bespoke heirloom creation,
            we are honored to be part of your story.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/shop"
              className="px-8 py-3.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md"
            >
              Shop Now
            </Link>
            <Link
              to="/custom-orders"
              className="px-8 py-3.5 bg-white hover:bg-[#F8F5F0] text-[#5A4335] border border-[#DDD6CF] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xs"
            >
              Custom Order
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
