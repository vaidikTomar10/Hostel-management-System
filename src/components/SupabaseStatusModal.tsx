import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Key,
  Globe,
  UploadCloud,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Complaint } from '../types';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaints?: Complaint[];
  onSyncCompleted?: () => void;
}

export function SupabaseStatusModal({
  isOpen,
  onClose,
  complaints = [],
  onSyncCompleted,
}: SupabaseStatusModalProps) {
  const [status, setStatus] = useState<{
    connected: boolean;
    hostResolves: boolean;
    supabaseUrl: string;
    projectId: string;
    keyPreview?: string;
    isPlaceholderKey?: boolean;
    error?: string;
    hint?: string;
    schemaSql?: string;
    recordCountDetected?: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setStatus(data);
      if (data.supabaseUrl) {
        setUrlInput(data.supabaseUrl);
      }
    } catch (err: any) {
      setStatus({
        connected: false,
        hostResolves: false,
        supabaseUrl: 'https://edvlhmjdjzqnrpuqclye.supabase.co',
        projectId: 'edvlhmjdjzqnrpuqclye',
        error: err.message || 'Failed to reach server backend',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    if (status?.schemaSql) {
      navigator.clipboard.writeText(status.schemaSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      setSaveMessage({ text: 'Please enter both Supabase URL and API Key.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          key: keyInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.connected) {
        setSaveMessage({
          text: `Connected to Supabase! (${data.recordCount ?? 0} records detected)`,
          type: 'success',
        });
        await fetchStatus();
      } else if (data.error) {
        setSaveMessage({
          text: `Saved, but connection failed: ${data.error}`,
          type: 'error',
        });
        await fetchStatus();
      } else {
        setSaveMessage({ text: 'Configuration updated.', type: 'success' });
        await fetchStatus();
      }
    } catch (err: any) {
      setSaveMessage({
        text: err.message || 'Error saving configuration',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncComplaints = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaints }),
      });
      const data = await res.json();

      if (data.success) {
        setSyncMessage({
          text: data.message || `Successfully synced complaints to Supabase!`,
          type: 'success',
        });
        if (onSyncCompleted) onSyncCompleted();
        await fetchStatus();
      } else {
        setSyncMessage({
          text: data.error || 'Sync failed. Verify table permissions.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setSyncMessage({
        text: err.message || 'Network error syncing complaints',
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const currentProjectId = status?.projectId || 'edvlhmjdjzqnrpuqclye';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Supabase Cloud Database</h3>
              <p className="text-xs text-slate-500">Live configuration, connection test & sync</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 py-4">
          {/* Connection Status Card */}
          <div
            className={`p-4 rounded-xl border ${
              status?.connected
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-amber-50/80 border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Connection Status
              </span>
              {loading ? (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" /> Testing...
                </span>
              ) : status?.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Active & Synced
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  <AlertTriangle size={13} className="text-amber-700" />
                  {status?.isPlaceholderKey ? 'Invalid API Key' : 'Action Required'}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Project Domain:</span>
                <span className="font-mono font-semibold text-slate-900 truncate max-w-[260px]">
                  {status?.supabaseUrl || 'https://edvlhmjdjzqnrpuqclye.supabase.co'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">API Key Status:</span>
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    status?.isPlaceholderKey ? 'text-amber-800' : 'text-emerald-700'
                  }`}
                >
                  {status?.keyPreview || 'Not configured'}
                </span>
              </div>
              {status?.connected && (
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">Supabase Table:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    complaints ({status.recordCountDetected ?? 0} records in database)
                  </span>
                </div>
              )}
            </div>

            {status?.error && (
              <div className="mt-3 p-3 bg-white/90 rounded-lg border border-amber-300/80 text-xs text-amber-950 space-y-1 shadow-2xs">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle size={14} className="text-amber-700 shrink-0" />
                  <span>Why data is not showing:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
                  {status.error}
                </p>
                {status.hint && (
                  <p className="text-[11px] leading-relaxed text-slate-600 mt-1 pt-1 border-t border-amber-200">
                    <strong>Solution:</strong> {status.hint}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Credentials Update Form */}
          <form onSubmit={handleSaveConfig} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Key size={14} className="text-indigo-600" />
                Configure Supabase Credentials
              </h4>
              <a
                href={`https://supabase.com/dashboard/project/${currentProjectId}/settings/api`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Find API Key in Supabase</span>
                <ExternalLink size={11} />
              </a>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Globe size={13} className="text-slate-500" />
                Supabase Project URL
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://edvlhmjdjzqnrpuqclye.supabase.co"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Key size={13} className="text-slate-500" />
                Supabase API Key (anon / public key)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your anon public key (starts with eyJ...)"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Found in Supabase &rarr; <strong>Project Settings</strong> &rarr; <strong>API</strong> &rarr; <strong>Project API keys</strong> &rarr; <strong>anon public</strong>.
              </p>
            </div>

            {saveMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                <span>{isSaving ? 'Testing & Saving...' : 'Save & Connect'}</span>
              </button>

              <button
                type="button"
                onClick={fetchStatus}
                disabled={loading}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>Test Connection</span>
              </button>
            </div>
          </form>

          {/* Sync Existing Complaints Button */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UploadCloud size={14} className="text-emerald-600" />
                Push Complaints to Supabase
              </h5>
              <p className="text-[11px] text-slate-500">
                Upload registered complaints directly into your Supabase database table.
              </p>
              {syncMessage && (
                <p
                  className={`text-[11px] font-bold mt-1 ${
                    syncMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {syncMessage.text}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSyncComplaints}
              disabled={isSyncing || !status?.connected}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                status?.connected
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSyncing ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <UploadCloud size={13} />
              )}
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {/* SQL Setup Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Supabase SQL Setup (Run in Supabase SQL Editor)
              </label>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-200 text-[11px] font-mono rounded-xl max-h-36 overflow-y-auto leading-relaxed border border-slate-800 select-all">
              {status?.schemaSql || `-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_contact TEXT NOT NULL,
  block TEXT NOT NULL,
  room_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  assigned_worker TEXT,
  admin_remarks TEXT
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on complaints" ON complaints FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public select on complaints" ON complaints FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public update on complaints" ON complaints FOR UPDATE TO anon, authenticated USING (true);`}
            </pre>
            <p className="text-[11px] text-slate-500 mt-1">
              If your Supabase table is empty or missing, run this in Supabase &rarr; <strong>SQL Editor</strong>.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <a
            href={`https://supabase.com/dashboard/project/${currentProjectId}/editor`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Open Supabase Table Editor</span>
            <ExternalLink size={12} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

