import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    const { error: err } = await signUpWithEmail(email, password, fullName);
    setIsSubmitting(false);
    if (!err) {
      navigate('/account');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-[#E7DFD7] shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <Logo size="md" />
          <h2 className="font-serif text-3xl font-semibold text-[#3D2E24] pt-2">
            Join the AaaS World
          </h2>
          <p className="text-xs text-[#7B6656]">
            Create an account to save favorites and track your handmade orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A4335] mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Patel"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A4335] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A4335] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A4335] mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="space-y-3 pt-2 border-t border-[#E7DFD7]">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full py-2.5 px-4 bg-white border border-[#E7DFD7] hover:bg-[#F8F5F0] text-xs font-semibold text-[#3D2E24] rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-center text-xs text-[#7B6656]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#5A4335] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
