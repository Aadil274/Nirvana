'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertTriangle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export default function SignInPage() {
  const router = useRouter();
  const { login, error, clearError, isLoading, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  // If already authenticated, redirect
  if (isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setClientError(null);

    if (!email.trim()) {
      setClientError('Please enter your email address.');
      return;
    }
    if (!password) {
      setClientError('Please enter your password.');
      return;
    }

    const res = await login(email.trim(), password, rememberMe);
    if (res.success) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7EF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand & Top Navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#1F7A8C] hover:text-[#17606F] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Nirvana Live Monitor</span>
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
          Sign in to your account
        </h1>
        <p className="mt-1 text-xs text-[#6F6A60] max-w-sm mx-auto">
          Access localized flood predictions, cooling center networks, and verified citizen response.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFFFF] py-8 px-6 shadow-level2 border border-[#EADBCA] rounded-3xl sm:px-10">
          
          {/* Error Banner */}
          {(clientError || error) && (
            <div className="mb-5 p-3 rounded-2xl bg-[#FBE1DF] border border-[#D9453D]/30 flex items-start gap-2.5 text-xs text-[#D9453D] animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{clientError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#1c1b1a] mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (clientError) setClientError(null);
                }}
                placeholder="resident@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs sm:text-sm text-[#1c1b1a] placeholder:text-[#6F6A60]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-transparent transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-[#1c1b1a]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#1F7A8C] hover:text-[#17606F] font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (clientError) setClientError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs sm:text-sm text-[#1c1b1a] placeholder:text-[#6F6A60]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-transparent pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6A60] hover:text-[#1c1b1a] cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#EADBCA] text-[#1F7A8C] focus:ring-[#1F7A8C] cursor-pointer"
                />
                <span className="text-xs text-[#6F6A60]">Stay signed in for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-full bg-[#1F7A8C] hover:bg-[#17606F] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sign Up Footer Link */}
          <div className="mt-6 pt-6 border-t border-[#EADBCA] text-center">
            <p className="text-xs text-[#6F6A60]">
              Don&apos;t have an account yet?{' '}
              <Link
                href="/signup"
                className="font-bold text-[#1F7A8C] hover:text-[#17606F] transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security Footnote */}
        <p className="text-center text-[11px] text-[#6F6A60] mt-6 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF7A]" />
          <span>Secured with bcrypt password hashing and TLS/SSL encryption</span>
        </p>
      </div>
    </div>
  );
}
