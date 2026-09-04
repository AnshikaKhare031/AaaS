import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@aaascrochet.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await loginAsAdmin(email.trim(), password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMessage(res.error || 'Invalid administrator credentials');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#EADCCF]/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#C6A15B]/15 blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5A4335]/10 text-[#5A4335] text-[11px] font-bold uppercase tracking-widest rounded-full">
            <Shield className="w-3.5 h-3.5 text-[#C6A15B]" /> Management Console
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-serif font-bold text-[#3D2E24]">
            Admin Authentication
          </h2>
          <p className="mt-1 text-xs text-[#7B6656]">
            Secure session gateway for master artisans & store operators
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-[#E7DFD7] sm:px-10">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#C96A6A]/10 border border-[#C96A6A]/30 text-[#C96A6A] text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C96A6A]" />
              {errorMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-[#5A4335] uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7B6656]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B] focus:bg-white transition-all font-sans"
                  placeholder="admin@aaascrochet.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5A4335] uppercase tracking-wider mb-1.5">
                Secret Password / Hash
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7B6656]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B] focus:bg-white transition-all font-sans"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7B6656] hover:text-[#3D2E24] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="p-3 bg-[#EADCCF]/30 rounded-xl border border-[#E7DFD7] text-[11px] text-[#7B6656] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#5A4335]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" /> Admin Access
                </div>
                <p>Sign in using your configured administrator credentials.</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold uppercase tracking-wider text-white bg-[#5A4335] hover:bg-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#5A4335] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating Session...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#C6A15B]" /> Enter Admin Dashboard
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E7DFD7] text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#7B6656] hover:text-[#3D2E24] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
