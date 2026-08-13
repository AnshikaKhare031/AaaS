import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl border border-[#E7DFD7] shadow-lg space-y-6">
        <Logo size="md" />

        <div className="space-y-2 pt-2">
          <span className="font-script text-5xl text-[#C6A15B] block">404</span>
          <h2 className="font-serif text-3xl font-bold text-[#3D2E24]">
            Lost in the Yarn Stitches
          </h2>
          <p className="text-xs text-[#7B6656] leading-relaxed">
            The page you are looking for has unraveled or doesn't exist. Let’s guide you back to our handmade collections.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/shop"
            className="w-full py-3.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md inline-flex items-center justify-center gap-2"
          >
            Explore All Pieces <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
