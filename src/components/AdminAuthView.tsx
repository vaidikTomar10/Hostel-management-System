import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { AdminAccount } from '../types';

interface AdminAuthViewProps {
  slotAvailable: boolean;
  onLogin: (account: AdminAccount) => void;
  onRegisterAdmin: (account: AdminAccount) => void;
  onBackToStudent: () => void;
}

export const AdminAuthView: React.FC<AdminAuthViewProps> = ({
  slotAvailable,
  onLogin,
  onRegisterAdmin,
  onBackToStudent,
}) => {
  // Setup form state
  const [setupName, setSetupName] = useState('');
  const [setupUsername, setSetupUsername] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupRole, setSetupRole] = useState('Hostel Warden & Maintenance Head');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  // Common state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Info about the registered admin (when slot is claimed)
  const [registeredInfo, setRegisteredInfo] = useState<{
    name: string;
    username: string;
    email?: string;
    roleTitle?: string;
  } | null>(null);

  // Load registered admin details on mount
  useEffect(() => {
    fetch('/api/admin/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.admin) {
          setRegisteredInfo(data.admin);
          setLoginUsername((prev) => prev || data.admin.username);
        }
      })
      .catch(() => {});
  }, [slotAvailable]);

  // Handle Admin Slot Claim / Registration (ONE CHANCE ONLY)
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!setupName.trim() || !setupUsername.trim() || !setupPassword) {
      setErrorMessage('Please fill in your name, username, and password.');
      return;
    }

    if (setupPassword.trim().length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (setupPassword.trim() !== setupConfirmPassword.trim()) {
      setErrorMessage('Passwords do not match. Please verify your password carefully.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: setupName.trim(),
          username: setupUsername.trim().replace(/^@+/, ''),
          email: setupEmail.trim(),
          roleTitle: setupRole.trim(),
          password: setupPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to claim admin account. The single slot has already been claimed permanently.');
        setLoading(false);
        return;
      }

      // Save credential backup locally for resilient auto-healing
      try {
        localStorage.setItem(
          'tulsidas_admin_credentials_backup',
          JSON.stringify({
            name: setupName.trim(),
            username: setupUsername.trim().replace(/^@+/, ''),
            email: setupEmail.trim(),
            roleTitle: setupRole.trim(),
            password: setupPassword.trim(),
            createdAt: new Date().toISOString(),
          })
        );
      } catch {}

      onRegisterAdmin(data.admin);
    } catch (err: any) {
      const fallbackAdmin: AdminAccount = {
        name: setupName.trim(),
        username: setupUsername.trim().replace(/^@+/, ''),
        email: setupEmail.trim(),
        roleTitle: setupRole.trim(),
        createdAt: new Date().toISOString(),
      };
      onRegisterAdmin(fallbackAdmin);
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginUsername.trim() || !loginPassword) {
      setErrorMessage('Please enter your username/email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid username or password.');
        setLoading(false);
        return;
      }

      // Save backup on successful login
      try {
        localStorage.setItem(
          'tulsidas_admin_credentials_backup',
          JSON.stringify({
            ...data.admin,
            password: loginPassword,
          })
        );
      } catch {}

      onLogin(data.admin);
    } catch (err: any) {
      setErrorMessage('Could not connect to server to verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Switch to Student View button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToStudent}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
        >
          <GraduationCap size={15} />
          <span>&larr; Switch to Student View</span>
        </button>

        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Lock size={12} className="text-amber-500" />
          <span>Strict Single-Admin Governance</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white relative">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldCheck size={26} />
            </div>

            {slotAvailable ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm animate-pulse">
                <Sparkles size={13} />
                1 Master Chance Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                <Lock size={13} className="text-amber-400" />
                Slot 1/1 Permanently Locked
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black mt-4 tracking-tight">
            {slotAvailable ? 'Claim Master Admin Account' : 'Tulsidas Hostel Admin Login'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {slotAvailable
              ? 'Claim your single administrator profile. You get only one chance to claim this portal; once claimed, registration is permanently locked forever.'
              : 'Sign in with your registered credentials to manage complaints and maintenance workflows.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-6 mb-0 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs">
            <AlertCircle size={17} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Slot Available: Single Admin Registration Form (ONE CHANCE) */}
        {slotAvailable ? (
          <form onSubmit={handleSetupSubmit} className="p-6 sm:p-8 space-y-4">
            <div className="p-4 bg-amber-50/95 border border-amber-300/80 rounded-2xl text-xs text-amber-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>Strict One-Time Claim Policy</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                You have <strong>only one chance</strong> to claim this administrator portal. Once registered, the master slot is permanently and irreversibly locked forever across both cloud Supabase and local storage. No resets or re-claims are permitted.
              </p>
              <p className="text-[11px] text-amber-900 font-semibold pt-0.5">
                Note: Password reset has been permanently removed. Choose a secure password that you will remember.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="setup-admin-name"
                  type="text"
                  required
                  placeholder="e.g. Vaidik Tomar"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="setup-admin-username"
                    type="text"
                    required
                    placeholder="e.g. admin or warden_tulsidas"
                    value={setupUsername}
                    onChange={(e) => setSetupUsername(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="setup-admin-email"
                    type="email"
                    placeholder="e.g. tomar01.vaidik@gmail.com"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Designation / Title
              </label>
              <input
                id="setup-admin-role"
                type="text"
                value={setupRole}
                onChange={(e) => setSetupRole(e.target.value)}
                placeholder="e.g. Hostel Warden & Maintenance Head"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="setup-admin-password"
                    type={showSetupPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 4 characters"
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSetupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  id="setup-admin-confirm-password"
                  type={showSetupPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="claim-admin-slot-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Claiming & Permanently Locking Slot...</span>
                ) : (
                  <>
                    <ShieldCheck size={16} className="text-amber-400" />
                    <span>Claim One-Time Admin Slot & Lock Forever</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Slot Claimed: Admin Login Form (No password reset, permanent lock) */
          <div className="p-6 sm:p-8 space-y-5">
            {/* Verified Claim Badge */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Lock size={12} className="text-emerald-600" />
                  <span>Permanent Master Slot: Claimed & Locked</span>
                </div>
                {registeredInfo ? (
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {registeredInfo.name}{' '}
                    <span className="text-indigo-600 font-medium">(@{registeredInfo.username})</span>
                    {registeredInfo.email && (
                      <span className="text-slate-500 font-normal"> &bull; {registeredInfo.email}</span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    Single slot claimed. Enter your registered credentials below.
                  </div>
                )}
              </div>

              {registeredInfo && (
                <button
                  type="button"
                  onClick={() => setLoginUsername(registeredInfo.username)}
                  className="self-start sm:self-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Use @{registeredInfo.username}
                </button>
              )}
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username, Email, or Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="admin-login-username"
                    type="text"
                    required
                    placeholder="e.g. admin or email address"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>

                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="admin-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your admin password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="admin-login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="text-amber-400" />
                      <span>Sign In to Admin Dashboard</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <p className="text-[11px] text-slate-500 font-medium">
                Tulsidas Hostel Single-Admin Master Slot &bull; Permanently Claimed & Locked
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
