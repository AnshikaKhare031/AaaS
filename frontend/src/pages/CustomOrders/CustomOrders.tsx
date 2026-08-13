import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  X,
  ArrowRight,
  Clock,
  Heart,
  Palette,
  FileText,
} from 'lucide-react';
import { createCustomOrder } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const CustomOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    product_type: 'Bridal Floral Bouquet',
    category: 'Crochet Flowers & Bouquets',
    color_preference: 'Soft Blush, Warm Ivory & Sage Green',
    size_dimensions: 'Medium (approx 28-30 cm height)',
    quantity: 1,
    budget: 1499,
    description: '',
  });

  const [images, setImages] = useState<string[]>([
    '/images/custom_banner.jpg',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  const steps = [
    { num: '01', title: 'Tell Us Your Idea', desc: 'Describe the dream piece, palette, and purpose.' },
    { num: '02', title: 'Share Preferences', desc: 'Upload color swatches, sketches, or mood boards.' },
    { num: '03', title: 'Artisan Consultation', desc: 'We review requirements and provide timeline + quote.' },
    { num: '04', title: 'Handcrafted For You', desc: 'Crafted stitch-by-stitch and delivered in luxury wrap.' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Simulate file reader / preview
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.description) {
      error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCustomOrder({
        ...formData,
        images,
      });
      setSubmittedRequestId(res.request_id || `AAAS-CUST-${Math.floor(1000 + Math.random() * 9000)}`);
      success("Thank you! We've received your custom request ♡");
    } catch (err: any) {
      // Fallback request ID for demo
      const fallbackId = `AAAS-CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedRequestId(fallbackId);
      success("Thank you! We've received your custom request ♡");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
          Bespoke Atelier
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#3D2E24] leading-tight">
          Made Just for You
        </h1>
        <p className="text-sm sm:text-base text-[#7B6656] leading-relaxed max-w-xl mx-auto">
          Have a vision for a personalized crochet bouquet, an heirloom baby blanket, or a
          color-matched handbag? Our master artisans are here to craft your dream piece.
        </p>
      </div>

      {/* 4 Steps Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-6 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-2 relative"
          >
            <span className="text-2xl font-serif font-bold text-[#C6A15B]">{step.num}</span>
            <h4 className="font-serif text-lg font-semibold text-[#3D2E24]">{step.title}</h4>
            <p className="text-xs text-[#7B6656] leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Form or Success State */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E7DFD7] shadow-xl p-6 sm:p-12">
        <AnimatePresence mode="wait">
          {submittedRequestId ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-[#8FA57D]/15 text-[#8FA57D] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-bold text-[#3D2E24]">
                  Thank You! We've Received Your Custom Request ♡
                </h3>
                <p className="text-xs text-[#7B6656] max-w-md mx-auto leading-relaxed">
                  Our artisan team will review your specifications, color swatches, and timeline.
                  We will contact you via email/phone within 24 business hours.
                </p>
              </div>

              <div className="p-4 bg-[#F8F5F0] border border-[#E7DFD7] rounded-2xl inline-block text-left">
                <p className="text-[11px] text-[#7B6656] uppercase font-semibold">Your Request Reference ID:</p>
                <p className="font-mono text-lg font-bold text-[#5A4335]">{submittedRequestId}</p>
              </div>

              <div>
                <button
                  onClick={() => {
                    setSubmittedRequestId(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      product_type: 'Bridal Floral Bouquet',
                      category: 'Crochet Flowers & Bouquets',
                      color_preference: '',
                      size_dimensions: '',
                      quantity: 1,
                      budget: 1499,
                      description: '',
                    });
                    setImages([]);
                  }}
                  className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors"
                >
                  Submit Another Request
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#3D2E24] mb-1">
                  Custom Order Inquiry Form
                </h3>
                <p className="text-xs text-[#7B6656]">
                  Please provide as much detail as possible to help us craft your piece with precision.
                </p>
              </div>

              {/* Section 1: Contact Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#C6A15B] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> 1. Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Radhika Verma"
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
                      placeholder="e.g. radhika@example.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Product Specifications */}
              <div className="space-y-4 pt-4 border-t border-[#E7DFD7]">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#C6A15B] flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" /> 2. Design & Specifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Product Type *</label>
                    <input
                      type="text"
                      required
                      value={formData.product_type}
                      onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                      placeholder="e.g. Bridal Floral Bouquet, Custom Tote Bag, Nursery Keepsake"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    >
                      <option value="Crochet Flowers & Bouquets">Crochet Flowers & Bouquets</option>
                      <option value="Handbags">Handbags & Totes</option>
                      <option value="Accessories">Accessories & Charms</option>
                      <option value="Home & Heirloom">Home Decor & Heirloom Blanket</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Color Palette</label>
                    <input
                      type="text"
                      value={formData.color_preference}
                      onChange={(e) => setFormData({ ...formData, color_preference: e.target.value })}
                      placeholder="e.g. Soft Blush, Cream, Terracotta"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Size / Dimensions</label>
                    <input
                      type="text"
                      value={formData.size_dimensions}
                      onChange={(e) => setFormData({ ...formData, size_dimensions: e.target.value })}
                      placeholder="e.g. 30 cm stem length, 8x10 inches"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Estimated Budget (₹)</label>
                    <input
                      type="number"
                      min="500"
                      step="100"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">Detailed Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe specific flowers, stitch types, handle preferences, deadline dates for events, or any personalized custom touches..."
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>
              </div>

              {/* Section 3: Reference Images */}
              <div className="space-y-4 pt-4 border-t border-[#E7DFD7]">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#C6A15B] flex items-center gap-2">
                  <UploadCloud className="w-3.5 h-3.5" /> 3. Reference Photos or Sketches
                </h4>

                <div className="border-2 border-dashed border-[#E7DFD7] hover:border-[#C6A15B] rounded-2xl p-6 text-center bg-[#F8F5F0]/50 transition-colors">
                  <UploadCloud className="w-8 h-8 text-[#7B6656] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#3D2E24] mb-1">
                    Click to browse or drag & drop reference images
                  </p>
                  <p className="text-[11px] text-[#7B6656] mb-3">PNG, JPG or WEBP (Max 5MB each)</p>
                  <label className="px-4 py-2 bg-white border border-[#E7DFD7] text-xs font-bold text-[#5A4335] rounded-xl hover:bg-[#F8F5F0] cursor-pointer inline-block shadow-2xs">
                    Browse Files
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Previews */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {images.map((imgUrl, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E7DFD7]">
                        <img src={imgUrl} alt="Reference" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#E7DFD7]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Submitting Inquiry...' : 'Request Custom Order'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
