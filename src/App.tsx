/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus, AdminAccount } from './types';
import { INITIAL_COMPLAINTS } from './data/mockComplaints';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { SupabaseStatusModal } from './components/SupabaseStatusModal';
import { CheckCircle2, Info } from 'lucide-react';

const STORAGE_KEY = 'tulsidas_complaints_live_clean_v1';
const ADMIN_SESSION_KEY = 'tulsidas_admin_session_v1';
const ADMIN_BACKUP_KEY = 'tulsidas_admin_credentials_backup';

// Clear legacy demo entries from previous sessions to guarantee a completely clean state
try {
  localStorage.removeItem('hostel_complaints_db_v1');
  localStorage.removeItem('hostel_complaints_db_v2');
} catch (e) {}

export default function App() {
  const [activeRole, setActiveRole] = useState<'student' | 'admin'>('student');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  
  // Single Admin Slot state & active admin session
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [slotAvailable, setSlotAvailable] = useState<boolean>(false);

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load complaints from storage:', err);
    }
    return INITIAL_COMPLAINTS;
  });

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    } catch (err) {
      console.error('Failed to save complaints to storage:', err);
    }
  }, [complaints]);

  // Check Admin slot status & account availability from server
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const res = await fetch('/api/admin/status');
        if (res.ok) {
          const data = await res.json();
          if (data.hasAdmin) {
            setSlotAvailable(false);
          } else {
            // Check if client has backup of claimed slot to auto-restore
            const backupStr = localStorage.getItem(ADMIN_BACKUP_KEY);
            if (backupStr) {
              try {
                const backup = JSON.parse(backupStr);
                const syncRes = await fetch('/api/admin/sync-claim', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(backup),
                });
                if (syncRes.ok) {
                  const syncData = await syncRes.json();
                  if (syncData.success) {
                    setSlotAvailable(false);
                    return;
                  }
                }
              } catch {}
            }
            // No backup and no server record: open single slot for claim
            setSlotAvailable(true);
            setAdminUser(null);
            localStorage.removeItem(ADMIN_SESSION_KEY);
          }
        }
      } catch (err) {
        console.warn('Admin status check failed:', err);
      }
    }
    checkAdminStatus();
  }, []);

  // Load complaints from backend on startup
  useEffect(() => {
    async function loadBackendComplaints() {
      try {
        const res = await fetch('/api/complaints');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.complaints)) {
            setComplaints(data.complaints);
          }
        }
      } catch (err) {
        console.warn('Initial complaints fetch skipped:', err);
      }
    }
    loadBackendComplaints();
  }, []);

  // Show auto-dismissing toast
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleAddComplaint = async (
    newComplaintData: Omit<Complaint, 'id' | 'createdAt' | 'status'>
  ) => {
    const nextNumber = Math.floor(100 + Math.random() * 900);
    const newComplaint: Complaint = {
      ...newComplaintData,
      id: `CMP-2026-${nextNumber}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    // Optimistically update state
    setComplaints((prev) => [newComplaint, ...prev]);

    // Send complaint to Supabase backend table
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComplaint),
      });

      const result = await res.json();
      if (result.supabaseSaved) {
        showToast(`Complaint ${newComplaint.id} registered & saved to Supabase table!`, 'success');
      } else if (result.supabaseError) {
        showToast(
          `Registered ${newComplaint.id} in server store (Supabase needs Anon Key: ${result.supabaseError})`,
          'info'
        );
      } else {
        showToast(`Registered complaint ${newComplaint.id} successfully!`, 'success');
      }
    } catch (err) {
      console.warn('Backend request failed, saved in browser store:', err);
      showToast(`Registered complaint ${newComplaint.id} successfully!`, 'success');
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: ComplaintStatus,
    remarks?: string,
    worker?: string
  ) => {
    const isResolving = status === 'resolved';
    const updates = {
      status,
      resolvedAt: isResolving ? new Date().toISOString() : undefined,
      resolvedBy: isResolving ? 'Hostel Warden Office' : undefined,
      adminRemarks: remarks,
      assignedWorker: worker,
    };

    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status,
            resolvedAt: isResolving ? new Date().toISOString() : undefined,
            resolvedBy: isResolving ? 'Hostel Warden Office' : undefined,
            adminRemarks: remarks || item.adminRemarks,
            assignedWorker: worker || item.assignedWorker,
          };
        }
        return item;
      })
    );

    // Sync status change to Supabase table
    try {
      await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('Failed to sync complaint update with Supabase:', err);
    }

    if (status === 'resolved') {
      showToast(`Complaint ${id} ticked and marked as RESOLVED!`, 'success');
    } else if (status === 'in_progress') {
      showToast(`Complaint ${id} assigned to technician and IN PROGRESS.`, 'info');
    } else {
      showToast(`Complaint ${id} reopened to PENDING.`, 'info');
    }
  };

  const handleBatchResolve = async (ids: string[]) => {
    setComplaints((prev) =>
      prev.map((item) => {
        if (ids.includes(item.id)) {
          return {
            ...item,
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            resolvedBy: 'Hostel Administration',
            adminRemarks: 'Batch resolved by Hostel Warden Office.',
            assignedWorker: item.assignedWorker || 'Maintenance Team',
          };
        }
        return item;
      })
    );

    // Sync batch updates
    for (const id of ids) {
      try {
        await fetch(`/api/complaints/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            resolvedBy: 'Hostel Administration',
            adminRemarks: 'Batch resolved by Hostel Warden Office.',
          }),
        });
      } catch (e) {
        // silent fallback
      }
    }

    showToast(`${ids.length} complaints ticked and marked as RESOLVED!`, 'success');
  };

  const handleAdminLogin = (account: AdminAccount) => {
    setAdminUser(account);
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(account));
    } catch (e) {}
    showToast(`Welcome, ${account.name}! Authenticated as Administrator.`, 'success');
  };

  const handleAdminLogout = async () => {
    setAdminUser(null);
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {}
    showToast('Logged out from administrator desk.', 'info');
  };

  const handleAdminRegister = (account: AdminAccount) => {
    setAdminUser(account);
    setSlotAvailable(false);
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(account));
    } catch (e) {}
    showToast('Admin account created! Master slot is now permanently locked.', 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/25 to-amber-50/15 text-slate-800 flex flex-col font-sans">
      {/* Navigation & Role Selector */}
      <Navbar
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        complaints={complaints}
        adminUser={adminUser}
        slotAvailable={slotAvailable}
        onLogout={handleAdminLogout}
      />

      {/* Dynamic Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-500/80 shadow-emerald-900/15'
                : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-indigo-500/80 shadow-indigo-900/15'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Info size={16} className="text-white" />
              </div>
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main View Body */}
      <main className="flex-1">
        {activeRole === 'student' ? (
          <StudentPortal
            complaints={complaints}
            onAddComplaint={handleAddComplaint}
          />
        ) : (
          <AdminPortal
            complaints={complaints}
            adminUser={adminUser}
            slotAvailable={slotAvailable}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            onRegisterAdmin={handleAdminRegister}
            onBackToStudent={() => setActiveRole('student')}
            onUpdateStatus={handleUpdateStatus}
            onBatchResolve={handleBatchResolve}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          />
        )}
      </main>

      {/* Campus Hostel Footer */}
      <footer className="bg-white/80 backdrop-blur-xs border-t border-slate-200/80 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Electrical Division" />
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" title="Plumbing Division" />
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" title="Carpentry Division" />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" title="Wi-Fi Division" />
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Civil Division" />
            </div>
            <span className="font-bold text-slate-800">
              Tulsidas Hostel Maintenance System
            </span>
            <span className="text-slate-400 hidden md:inline">|</span>
            <span className="text-slate-500 hidden md:inline">
              Electrician, Plumber, Carpenter, Wi-Fi & Civil Maintenance
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Helpdesk 24x7 Active
            </span>
          </div>
        </div>
      </footer>

      {/* Supabase Integration Info & Configuration Modal */}
      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        complaints={complaints}
        onSyncCompleted={async () => {
          showToast('Complaints synced to Supabase!', 'success');
          try {
            const res = await fetch('/api/complaints');
            const data = await res.json();
            if (data && Array.isArray(data.complaints)) {
              setComplaints(data.complaints);
            }
          } catch {}
        }}
      />
    </div>
  );
}
