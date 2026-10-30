import React from 'react';
import {
  Building,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { Complaint, AdminAccount } from '../types';

interface Props {
  activeRole: 'student' | 'admin';
  onRoleChange: (role: 'student' | 'admin') => void;
  complaints: Complaint[];
  adminUser?: AdminAccount | null;
  slotAvailable?: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeRole,
  onRoleChange,
  complaints,
  adminUser,
  slotAvailable,
  onLogout,
}) => {
  const pendingCount = complaints.filter((c) => c.status === 'pending').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Hostel Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/15 ring-2 ring-white">
              <Building size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">
                  Tulsidas <span className="text-indigo-600">Hostel</span>
                </span>
                <span className="text-[11px] font-semibold bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                  Maintenance Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                Official Complaint & Repair Resolution Desk
              </p>
            </div>
          </div>

          {/* Center Quick Stats Badge */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50/90 p-1.5 rounded-full border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100/90 text-amber-900 font-semibold rounded-full border border-amber-300/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{pendingCount} Pending</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100/90 text-emerald-900 font-semibold rounded-full border border-emerald-300/80 shadow-xs">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>{resolvedCount} Resolved</span>
            </div>
          </div>

          {/* Role Switcher & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200 flex items-center shadow-xs">
              <button
                id="role-switch-student"
                type="button"
                onClick={() => onRoleChange('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeRole === 'student'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap size={15} />
                <span>Student View</span>
              </button>

              <button
                id="role-switch-admin"
                type="button"
                onClick={() => onRoleChange('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck size={15} className={activeRole === 'admin' ? 'text-amber-400' : 'text-slate-500'} />
                {adminUser ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span>Admin ({adminUser.name.split(' ')[0]})</span>
                  </span>
                ) : slotAvailable ? (
                  <span className="flex items-center gap-1">
                    <span>Admin</span>
                    <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-extrabold text-[9px] rounded-full">
                      1 Slot
                    </span>
                  </span>
                ) : (
                  <span>Admin Login</span>
                )}
                {pendingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-extrabold text-[10px] rounded-full shadow-xs">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Dedicated Admin Logout button when logged in */}
            {adminUser && onLogout && (
              <button
                id="navbar-admin-logout-btn"
                type="button"
                onClick={onLogout}
                title={`Log out from Warden Admin (@${adminUser.username})`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200/90 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer active:scale-95"
              >
                <LogOut size={13} className="stroke-[2.5]" />
                <span className="hidden sm:inline">Log Out</span>
                <span className="sm:hidden">Exit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
