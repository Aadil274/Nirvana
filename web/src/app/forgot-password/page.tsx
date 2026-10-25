'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Mail, AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setDemoToken(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await forgotPassword(email.trim());
    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage(res.message);
      if (res.demoToken) {
        setDemoToken(res.demoToken);
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7EF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand & Back Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#1F7A8C] hover:text-[#17606F] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>

        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#1F7A8C] flex items-center justify-center text-white shadow-sm">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-2xl font-black text-[#006070] tracking-tight">
            Nirvana
          </span>
        </div>

        <h1 className="font-heading text-2xl font-bold text-[#1c1b1a]">
          Reset Your Password
        </h1>
        <p className="mt-1 text-xs text-[#6F6A60] max-w-sm mx-auto">
          Enter your registered email address to receive password recovery instructions.
        </p>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFFFF] py-8 px-6 shadow-level2 border border-[#EADBCA] rounded-3xl sm:px-10">
          
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-[#FBE1DF] border border-[#D9453D]/30 flex items-start gap-2.5 text-xs text-[#D9453D] animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage ? (
            <div className="space-y-4 text-center py-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-[#E6F5ED] text-[#4CAF7A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[#1c1b1a]">
                Instructions Dispatched
              </h3>
              <p className="text-xs text-[#6F6A60] leading-relaxed">
                {statusMessage}
              </p>

              {demoToken && (
                <div className="mt-4 p-4 rounded-2xl bg-[#F3EBDD]/60 border border-[#EADBCA] text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F7A8C] block mb-1">
                    Development Password Reset Link:
                  </span>
                  <Link
                    href={`/reset-password?token=${demoToken}`}
                    className="text-xs font-bold text-[#1F7A8C] hover:underline break-all block"
                  >
                    Click here to reset your password now →
                  </Link>
                </div>
              )}

              <div className="pt-4">
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#F3EBDD] hover:bg-[#EADBCA] text-[#1c1b1a] text-xs font-bold transition-all"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-[#1c1b1a] mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="resident@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs sm:text-sm text-[#1c1b1a] placeholder:text-[#6F6A60]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-transparent transition-all"
                  />
                  <Mail className="w-4 h-4 text-[#6F6A60] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-full bg-[#1F7A8C] hover:bg-[#17606F] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[#EADBCA] text-center">
            <p className="text-xs text-[#6F6A60]">
              Remember your password?{' '}
              <Link href="/signin" className="font-bold text-[#1F7A8C] hover:text-[#17606F]">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
