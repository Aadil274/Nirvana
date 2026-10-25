'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertTriangle, ArrowLeft, CheckCircle2, Key } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const { resetPassword } = useAuth();

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Strength score calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(newPassword);
  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#D9453D', '#D9453D', '#EE7B30', '#F2B134', '#4CAF7A'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Missing or invalid reset token. Please check your reset link.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (!/[0-9]/.test(newPassword) && !/[^A-Za-z0-9]/.test(newPassword)) {
      setError('Password must contain at least one number or special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(token.trim(), newPassword, confirmPassword);
    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/signin');
      }, 2500);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="bg-[#FFFFFF] py-8 px-6 shadow-level2 border border-[#EADBCA] rounded-3xl sm:px-10">
      {error && (
        <div className="mb-5 p-3 rounded-2xl bg-[#FBE1DF] border border-[#D9453D]/30 flex items-start gap-2.5 text-xs text-[#D9453D] animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="text-center py-6 space-y-4 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-[#E6F5ED] text-[#4CAF7A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-heading text-xl font-bold text-[#1c1b1a]">
            Password Reset Complete
          </h3>
          <p className="text-xs text-[#6F6A60] leading-relaxed">
            Your password has been updated securely. Redirecting to sign in...
          </p>
          <div className="pt-2">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1F7A8C] text-white text-xs font-bold hover:bg-[#17606F] transition-all"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Token input if not provided via URL */}
          {!initialToken && (
            <div>
              <label htmlFor="token" className="block text-xs font-bold text-[#1c1b1a] mb-1">
                Password Reset Token
              </label>
              <input
                id="token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from email"
                className="w-full px-4 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs text-[#1c1b1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] transition-all"
              />
            </div>
          )}

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-xs font-bold text-[#1c1b1a] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs sm:text-sm text-[#1c1b1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6A60] hover:text-[#1c1b1a] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6F6A60]">Strength:</span>
                  <span className="font-bold" style={{ color: strengthColors[strengthScore] }}>
                    {strengthLabels[strengthScore]}
                  </span>
                </div>
                <div className="w-full bg-[#EADBCA] h-1.5 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className="h-full flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: strengthScore >= step ? strengthColors[strengthScore] : 'transparent'
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#1c1b1a] mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs sm:text-sm text-[#1c1b1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6A60] hover:text-[#1c1b1a] cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-full bg-[#1F7A8C] hover:bg-[#17606F] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FBF7EF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-2xl font-black text-[#006070] tracking-tight">
            Nirvana
          </span>
        </div>

        <h1 className="font-heading text-2xl font-bold text-[#1c1b1a]">
          Choose New Password
        </h1>
        <p className="mt-1 text-xs text-[#6F6A60] max-w-sm mx-auto">
          Create a secure password with at least 8 characters, numbers, and symbols.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="text-center py-12 text-xs text-[#6F6A60]">Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
