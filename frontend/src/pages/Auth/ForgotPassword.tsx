import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useToast } from '../../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const { success } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    success('Password reset instructions sent to your email.');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-[#E7DFD7] shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <Logo size="md" />
          <h2 className="font-serif text-3xl font-semibold text-[#3D2E24] pt-2">
            Reset Password
          </h2>
          <p className="text-xs text-[#7B6656]">
            Enter your registered email address and we’ll send you instructions to reset your password.
          </p>
        </div>

        {isSent ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-10 h-10 text-[#8FA57D] mx-auto" />
            <p className="text-xs text-[#5A4335]">
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 bg-[#5A4335] text-white text-xs font-semibold uppercase rounded-xl hover:bg-[#3D2E24]"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5A4335] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              Send Reset Link <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-[#7B6656] hover:text-[#3D2E24] inline-flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
