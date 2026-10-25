'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertTriangle, ArrowLeft, CheckCircle2, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { HYDERABAD_WARDS } from '../../lib/mock-data';

export default function SignUpPage() {
  const router = useRouter();
  const { register, error, clearError, isLoading, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [wardId, setWardId] = useState('ward-72');
  const [role, setRole] = useState('citizen');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // If already authenticated and not in success state, redirect
  if (isAuthenticated && !registrationSuccess) {
    if (typeof window !== 'undefined') {
      router.push('/');
    }
  }

  // Calculate password strength score (0 to 4)
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(password);
  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#D9453D', '#D9453D', '#EE7B30', '#F2B134', '#4CAF7A'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setClientError(null);

    if (fullName.trim().length < 2) {
      setClientError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setClientError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setClientError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[0-9]/.test(password) && !/[^A-Za-z0-9]/.test(password)) {
      setClientError('Password must contain at least one number or special character.');
      return;
    }
    if (password !== confirmPassword) {
      setClientError('Passwords do not match. Please verify your password entry.');
      return;
    }
    if (!agreedToTerms) {
      setClientError('You must agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    const res = await register(
      fullName.trim(),
      email.trim(),
      password,
      confirmPassword,
      role,
      wardId,
      agreedToTerms
    );

    if (res.success) {
      setRegistrationSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7EF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand & Navigation */}
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
          Join the Civic Resilience Network
        </h1>
        <p className="mt-1 text-xs text-[#6F6A60] max-w-sm mx-auto">
          Create an account to receive verified street early warnings and coordinate humanitarian disaster relief.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFFFF] py-8 px-6 shadow-level2 border border-[#EADBCA] rounded-3xl sm:px-10">
          
          {/* Success State Notification */}
          {registrationSuccess ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#E6F5ED] text-[#4CAF7A] flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-xl font-bold text-[#1c1b1a]">
                Welcome to Nirvana!
              </h3>
              <p className="text-xs text-[#6F6A60] leading-relaxed">
                Your civic account has been created. Redirecting to your localized ward monitor...
              </p>
              <div className="w-8 h-8 border-2 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {(clientError || error) && (
                <div className="mb-5 p-3 rounded-2xl bg-[#FBE1DF] border border-[#D9453D]/30 flex items-start gap-2.5 text-xs text-[#D9453D] animate-fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{clientError || error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-[#1c1b1a] mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (clientError) setClientError(null);
                    }}
                    placeholder="e.g. S. Naveen Rao"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs sm:text-sm text-[#1c1b1a] placeholder:text-[#6F6A60]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-transparent transition-all"
                  />
                </div>

                {/* Email Address */}
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

                {/* Monitored Ward Neighborhood */}
                <div>
                  <label htmlFor="wardId" className="block text-xs font-bold text-[#1c1b1a] mb-1">
                    Primary Monitored Ward
                  </label>
                  <select
                    id="wardId"
                    value={wardId}
                    onChange={(e) => setWardId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs text-[#1c1b1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] transition-all cursor-pointer"
                  >
                    {HYDERABAD_WARDS.features.map(w => (
                      <option key={w.properties.ward_id} value={w.properties.ward_id}>
                        {w.properties.name} ({w.properties.circle})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-[#1c1b1a] mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (clientError) setClientError(null);
                      }}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs sm:text-sm text-[#1c1b1a] placeholder:text-[#6F6A60]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-transparent pr-10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6A60] hover:text-[#1c1b1a] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#6F6A60]">Password Strength:</span>
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

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#1c1b1a] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (clientError) setClientError(null);
                      }}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EADBCA] bg-[#FBF7EF]/50 text-xs sm:text-sm text-[#1c1b1a] placeholder:text-[#6F6A60]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-transparent pr-10 transition-all"
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

                {/* Terms and Privacy Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-[#EADBCA] text-[#1F7A8C] focus:ring-[#1F7A8C] cursor-pointer"
                    />
                    <span className="text-xs text-[#6F6A60] leading-normal">
                      I agree to the <span className="text-[#1c1b1a] font-semibold">Civic Terms of Service</span> and <span className="text-[#1c1b1a] font-semibold">Privacy Policy</span>. My contact info will only be used for emergency early warnings.
                    </span>
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
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Sign In Footer Link */}
              <div className="mt-6 pt-6 border-t border-[#EADBCA] text-center">
                <p className="text-xs text-[#6F6A60]">
                  Already have an account?{' '}
                  <Link
                    href="/signin"
                    className="font-bold text-[#1F7A8C] hover:text-[#17606F] transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Security Footnote */}
        <p className="text-center text-[11px] text-[#6F6A60] mt-6 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF7A]" />
          <span>No plaintext password storage • Compliant with NDMA Civic Privacy Standards</span>
        </p>
      </div>
    </div>
  );
}
