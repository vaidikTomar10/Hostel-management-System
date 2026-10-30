import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Building,
  RotateCcw,
  Zap,
  LogOut,
  UserCheck,
  Database,
} from 'lucide-react';
import { Complaint, ComplaintCategory, ComplaintStatus, AdminAccount } from '../types';
import { COMPLAINT_CATEGORIES, HOSTEL_BLOCKS } from '../data/categories';
import { CategoryBadge, getCategoryMeta } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import { ComplaintCard } from './ComplaintCard';
import { AdminAuthView } from './AdminAuthView';

interface Props {
  complaints: Complaint[];
  adminUser: AdminAccount | null;
  slotAvailable: boolean;
  onLogin: (account: AdminAccount) => void;
  onLogout: () => void;
  onRegisterAdmin: (account: AdminAccount) => void;
  onBackToStudent: () => void;
  onUpdateStatus: (
    id: string,
    status: ComplaintStatus,
    remarks?: string,
    worker?: string
  ) => void;
  onBatchResolve?: (ids: string[]) => void;
  onOpenSupabaseModal?: () => void;
}

export const AdminPortal: React.FC<Props> = ({
  complaints,
  adminUser,
  slotAvailable,
  onLogin,
  onLogout,
  onRegisterAdmin,
  onBackToStudent,
  onUpdateStatus,
  onBatchResolve,
  onOpenSupabaseModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    isPlaceholderKey?: boolean;
    error?: string;
    recordCountDetected?: number;
  } | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetch('/api/supabase/status')
      .then((res) => res.json())
      .then((data) => setSupabaseStatus(data))
      .catch(() => setSupabaseStatus(null));
  }, []);

  // If no admin user is authenticated, render the single-slot registration or login gateway
  if (!adminUser) {
    return (
      <AdminAuthView
        slotAvailable={slotAvailable}
        onLogin={onLogin}
        onRegisterAdmin={onRegisterAdmin}
        onBackToStudent={onBackToStudent}
      />
    );
  }

  // Analytics Metrics
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'pending').length;
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || c.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' || c.status === selectedStatus;

    const matchesBlock =
      selectedBlock === 'all' || c.block === selectedBlock;

    return matchesSearch && matchesCategory && matchesStatus && matchesBlock;
  });

  const toggleSelectAll = () => {
    const pendingAndProgressIds = filteredComplaints
      .filter((c) => c.status !== 'resolved')
      .map((c) => c.id);

    if (selectedIds.length === pendingAndProgressIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingAndProgressIds);
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchResolveClick = () => {
    if (selectedIds.length === 0) return;
    if (onBatchResolve) {
      onBatchResolve(selectedIds);
      setSelectedIds([]);
    } else {
      selectedIds.forEach((id) => {
        onUpdateStatus(id, 'resolved', 'Batch verified and resolved by Warden.');
      });
      setSelectedIds([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Title Bar & Authenticated User Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Tulsidas Hostel Warden Dashboard
            </h1>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
              Tulsidas Admin
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Central maintenance desk for Tulsidas Hostel. Review all registered complaints, dispatch workers, and log resolutions.
          </p>
        </div>

        {/* Right side: Batch resolve + Admin profile & Log Out */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Batch Resolve Action if items selected */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-emerald-950">
                {selectedIds.length} selected
              </span>
              <button
                id="batch-resolve-btn"
                type="button"
                onClick={handleBatchResolveClick}
                className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5"
              >
                <Check size={14} className="stroke-[3]" />
                <span>Tick Resolved</span>
              </button>
            </div>
          )}

          {/* Supabase Status / Sync Button */}
          {onOpenSupabaseModal && (
            <button
              id="admin-supabase-config-btn"
              type="button"
              onClick={onOpenSupabaseModal}
              className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                supabaseStatus?.connected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="Configure Supabase cloud database & sync complaints"
            >
              <Database size={14} className={supabaseStatus?.connected ? 'text-emerald-600' : 'text-amber-600'} />
              <span>
                {supabaseStatus?.connected
                  ? `Supabase: Connected (${supabaseStatus.recordCountDetected ?? 0})`
                  : 'Supabase: Action Needed'}
              </span>
            </button>
          )}

          {/* Authenticated Admin Badge */}
          <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-amber-400 flex items-center justify-center font-black text-xs shadow-inner">
              {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">{adminUser.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md border border-emerald-200">
                  Master Slot
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                {adminUser.roleTitle || 'Hostel Warden'} &bull; @{adminUser.username}
              </p>
            </div>

            <button
              id="admin-logout-btn"
              type="button"
              onClick={() => setShowLogoutModal(true)}
              title="Log out from administrator desk"
              className="ml-2 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-200 cursor-pointer shadow-xs active:scale-95"
            >
              <LogOut size={13} className="stroke-[2.5]" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 shadow-inner">
              <LogOut size={22} className="stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Log Out from Warden Desk?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              You will be signed out of the Administrator account (@{adminUser.username}). You can log back in at any time with your credentials.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Stay Logged In
              </button>
              <button
                id="confirm-logout-btn"
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer active:scale-95"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Status Alert Banner */}
      {supabaseStatus && !supabaseStatus.connected && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="font-bold text-amber-950">
                Supabase Cloud Sync: {supabaseStatus.error || 'Connection needs configuration'}
              </p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Complaints are currently stored in local server memory. Connect your Supabase API Anon Key to mirror all complaints in your Supabase table.
              </p>
            </div>
          </div>
          {onOpenSupabaseModal && (
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 cursor-pointer shadow-xs transition-colors"
            >
              Configure & Sync Supabase
            </button>
          )}
        </div>
      )}

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-white p-4 rounded-2xl border border-indigo-200/90 shadow-xs border-t-4 border-t-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-950">Total Registered</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <Building size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{total}</div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Across all hostel wings</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50/80 via-white to-white p-4 rounded-2xl border border-amber-300 shadow-xs border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Action
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-950 mt-2">{pending}</div>
          <p className="text-[11px] text-amber-800 mt-1 font-medium">Requires worker dispatch</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-white p-4 rounded-2xl border border-emerald-300 shadow-xs border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950">Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-950">{resolved}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              {resolutionRate}% rate
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 mt-1 font-medium">Ticked off & closed</p>
        </div>
      </div>

      {/* Category Distribution Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Categorized Breakdown
            </h3>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Filter by specialized trade)
            </span>
          </div>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
            >
              Reset Category Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {COMPLAINT_CATEGORIES.map((cat) => {
            const count = complaints.filter((c) => c.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            const meta = getCategoryMeta(cat.id);
            const Icon = meta.icon;

            return (
              <button
                key={cat.id}
                id={`admin-cat-filter-${cat.id}`}
                type="button"
                onClick={() =>
                  setSelectedCategory(isSelected ? 'all' : cat.id)
                }
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-center transition-all ${
                  isSelected
                    ? `border-indigo-600 ${meta.lightBg} ring-2 ring-indigo-500/20 shadow-xs`
                    : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 ${
                    isSelected ? meta.iconBg : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon size={15} />
                </div>
                <span className="text-[11px] font-bold truncate max-w-full text-slate-900">
                  {cat.label}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold mt-1 ${
                    count > 0
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="admin-search-input"
              type="text"
              placeholder="Search by student, room (e.g. 312), roll no, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          <select
            id="admin-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">All Statuses ({total})</option>
            <option value="pending">Pending ({pending})</option>
            <option value="in_progress">In Progress ({inProgress})</option>
            <option value="resolved">Resolved ({resolved})</option>
          </select>

          <select
            id="admin-block-select"
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="hidden sm:block px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">All Floors</option>
            {HOSTEL_BLOCKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* View Layout Controls & Batch select all */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 transition-colors"
            title="Select all uncompleted items"
          >
            {selectedIds.length > 0 ? (
              <CheckSquare size={14} className="text-slate-800" />
            ) : (
              <Square size={14} className="text-slate-400" />
            )}
            <span>Select Unresolved</span>
          </button>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detailed Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roster Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Clean Desk — Zero Complaints Registered
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            All demo complaints have been removed. When students register complaints from the Student Portal or Supabase backend tables, they will automatically appear here in real time.
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Maintenance desk is active & waiting for live tickets</span>
          </div>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search size={22} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            No complaints match the selected filters
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Try resetting your search query or status filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSelectedBlock('all');
            }}
            className="mt-4 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="space-y-3.5">
          {filteredComplaints.map((c) => (
            <div key={c.id} className="relative group">
              {c.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={() => toggleSelectOne(c.id)}
                  className="absolute left-3 -top-2.5 z-10 p-1 rounded bg-white border border-slate-300 shadow-xs hover:border-slate-500 transition-colors"
                  title="Select for batch resolution"
                >
                  {selectedIds.includes(c.id) ? (
                    <CheckSquare size={13} className="text-emerald-600" />
                  ) : (
                    <Square size={13} className="text-slate-400" />
                  )}
                </button>
              )}
              <ComplaintCard
                complaint={c}
                isAdmin={true}
                onUpdateStatus={onUpdateStatus}
              />
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      {selectedIds.length > 0 ? (
                        <CheckSquare size={14} className="text-emerald-600" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Ticket / Student</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Issue Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.map((c) => {
                  const isResolved = c.status === 'resolved';

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isResolved ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        {!isResolved && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleSelectOne(c.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-800">
                          {c.id}
                        </div>
                        <div className="text-slate-600 font-medium">
                          {c.studentName}
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          {c.studentId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <CategoryBadge category={c.category} size="sm" />
                        <div className="mt-1">
                          <UrgencyBadge urgency={c.urgency} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          Room {c.roomNumber}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[140px]">
                          {c.block}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {c.title}
                        </div>
                        <div className="text-slate-500 text-[11px] line-clamp-1">
                          {c.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isResolved ? (
                          <button
                            id={`table-resolve-btn-${c.id}`}
                            type="button"
                            onClick={() =>
                              onUpdateStatus(
                                c.id,
                                'resolved',
                                'Directly marked resolved by administrator.',
                                'Duty Staff'
                              )
                            }
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs transition-colors shadow-xs"
                          >
                            <Check size={13} className="stroke-[3]" />
                            <span>Tick Resolved</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                            <CheckCircle2 size={15} />
                            <span>Resolved</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
