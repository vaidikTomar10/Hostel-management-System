import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Wrench,
  MessageSquare,
  Check,
  Undo2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { CategoryBadge, getCategoryMeta } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';

interface Props {
  complaint: Complaint;
  isAdmin?: boolean;
  onUpdateStatus?: (
    id: string,
    status: ComplaintStatus,
    remarks?: string,
    worker?: string
  ) => void;
  onDeleteComplaint?: (id: string) => void;
}

export const ComplaintCard: React.FC<Props> = ({
  complaint,
  isAdmin = false,
  onUpdateStatus,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionRemarks, setResolutionRemarks] = useState(
    complaint.adminRemarks || ''
  );
  const [assignedWorker, setAssignedWorker] = useState(
    complaint.assignedWorker || ''
  );

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const resolvedDate = complaint.resolvedAt
    ? new Date(complaint.resolvedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const handleQuickResolve = () => {
    if (onUpdateStatus) {
      onUpdateStatus(
        complaint.id,
        'resolved',
        resolutionRemarks || 'Issue inspected and verified resolved by hostel maintenance staff.',
        assignedWorker || 'Hostel Duty Staff'
      );
      setShowResolveModal(false);
    }
  };

  const handleSetInProgress = () => {
    if (onUpdateStatus) {
      onUpdateStatus(
        complaint.id,
        'in_progress',
        resolutionRemarks || 'Maintenance technician dispatched to room.',
        assignedWorker || 'Assigned Duty Technician'
      );
    }
  };

  const handleReopen = () => {
    if (onUpdateStatus) {
      onUpdateStatus(
        complaint.id,
        'pending',
        'Complaint reopened for inspection.'
      );
    }
  };

  const catMeta = getCategoryMeta(complaint.category);

  return (
    <div
      id={`complaint-card-${complaint.id}`}
      className={`relative rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-xs hover:shadow-md ${
        complaint.status === 'resolved'
          ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/20 to-white'
          : complaint.urgency === 'emergency'
          ? 'border-rose-300 ring-2 ring-rose-500/10'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Category Colorful Left Border Accent Strip */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          complaint.status === 'resolved'
            ? 'bg-emerald-500'
            : catMeta.dotColor
        }`}
      />

      {/* Top Header */}
      <div className="p-4 sm:p-5 pl-5 sm:pl-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
              {complaint.id}
            </span>
            <CategoryBadge category={complaint.category} />
            <UrgencyBadge urgency={complaint.urgency} />
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={complaint.status} />

            {/* Quick Admin Tick Checkbox / Action */}
            {isAdmin && onUpdateStatus && (
              <div className="flex items-center gap-1.5 ml-1">
                {complaint.status !== 'resolved' ? (
                  <button
                    id={`btn-tick-resolve-${complaint.id}`}
                    type="button"
                    onClick={() => setShowResolveModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all"
                    title="Tick to mark this complaint as resolved"
                  >
                    <Check size={14} className="stroke-[3]" />
                    <span>Tick Resolved</span>
                  </button>
                ) : (
                  <button
                    id={`btn-reopen-${complaint.id}`}
                    type="button"
                    onClick={handleReopen}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 shadow-xs"
                    title="Reopen complaint"
                  >
                    <Undo2 size={13} />
                    <span>Reopen</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="pt-3">
          <h3 className="text-base font-semibold text-slate-900 leading-snug">
            {complaint.title}
          </h3>
          <p
            className={`text-sm text-slate-600 mt-1.5 leading-relaxed ${
              !isExpanded ? 'line-clamp-2' : ''
            }`}
          >
            {complaint.description}
          </p>

          {complaint.description.length > 130 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 mt-1 inline-flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp size={13} />
                </>
              ) : (
                <>
                  <span>Show full details</span>
                  <ChevronDown size={13} />
                </>
              )}
            </button>
          )}
        </div>

        {/* Location & Student Metadata */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">
              Room {complaint.roomNumber}
            </span>
            <span className="text-slate-400">·</span>
            <span className="truncate text-slate-600">{complaint.block}</span>
          </div>

          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-400 shrink-0" />
            <span className="text-slate-800 font-medium truncate">
              {complaint.studentName}
            </span>
            <span className="text-slate-400">({complaint.studentId})</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400 shrink-0" />
            <span className="text-slate-500">Contact:</span>
            <span className="font-medium text-slate-700 truncate">
              {complaint.studentContact}
            </span>
          </div>
        </div>

        {/* Status / Resolution Banner */}
        {complaint.status === 'resolved' && (
          <div className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-300 text-xs shadow-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <CheckCircle2 size={15} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    Issue Resolved & Inspected
                  </span>
                  {resolvedDate && (
                    <span className="text-emerald-800 text-[11px] font-medium bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300/60">
                      {resolvedDate}
                    </span>
                  )}
                </div>
                {complaint.adminRemarks && (
                  <p className="text-emerald-900 mt-1 leading-relaxed bg-white/60 p-2 rounded-lg border border-emerald-200/60">
                    {complaint.adminRemarks}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-emerald-800 font-medium">
                  {complaint.assignedWorker && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-emerald-600">Assigned:</span> {complaint.assignedWorker}
                    </span>
                  )}
                  {complaint.resolvedBy && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-emerald-600">Verified by:</span> {complaint.resolvedBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {complaint.status === 'in_progress' && (
          <div className="mt-3 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sky-800">
              <Wrench size={14} className="text-sky-600 shrink-0" />
              <span>
                <strong>Work In Progress:</strong>{' '}
                {complaint.assignedWorker || 'Technician scheduled to attend'}
              </span>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowResolveModal(true)}
                className="text-xs font-semibold text-sky-900 hover:text-sky-950 underline"
              >
                Mark Complete
              </button>
            )}
          </div>
        )}

        {/* Admin Quick Action Bar for Pending */}
        {isAdmin && complaint.status === 'pending' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Reported {formattedDate}
            </span>
            <div className="flex items-center gap-2">
              <button
                id={`btn-dispatch-${complaint.id}`}
                type="button"
                onClick={handleSetInProgress}
                className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded font-medium border border-sky-200 transition-colors"
              >
                Dispatch Technician
              </button>
              <button
                id={`btn-resolve-direct-${complaint.id}`}
                type="button"
                onClick={() => setShowResolveModal(true)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors flex items-center gap-1"
              >
                <Check size={13} className="stroke-[3]" />
                <span>Mark Resolved</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer timestamp */}
        {!isAdmin && complaint.status !== 'resolved' && (
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Registered on {formattedDate}</span>
            <span className="font-medium text-slate-600">
              Contact: {complaint.studentContact}
            </span>
          </div>
        )}
      </div>

      {/* Resolution Confirmation Modal */}
      {showResolveModal && (
        <div
          id={`resolve-modal-${complaint.id}`}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">
                  Mark Complaint as Resolved
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirming resolution for ticket {complaint.id} (Room {complaint.roomNumber})
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assigned Electrician / Technician Name
                </label>
                <input
                  type="text"
                  value={assignedWorker}
                  onChange={(e) => setAssignedWorker(e.target.value)}
                  placeholder="e.g. Ramesh Kumar (Hostel Electrician)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Resolution Notes / Action Taken
                </label>
                <textarea
                  rows={3}
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  placeholder="e.g. Replaced burnt capacitor, tightened wire lugs, and tested fan with student."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id={`confirm-resolve-btn-${complaint.id}`}
                type="button"
                onClick={handleQuickResolve}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check size={14} className="stroke-[3]" />
                <span>Confirm & Mark Resolved</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
