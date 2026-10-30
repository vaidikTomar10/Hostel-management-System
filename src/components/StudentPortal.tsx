import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  ListFilter,
  Zap,
  Wrench,
  Hammer,
  Wifi,
  Building2,
  HelpCircle,
  PlusCircle,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { Complaint, ComplaintCategory, UrgencyLevel } from '../types';
import {
  COMPLAINT_CATEGORIES,
  HOSTEL_FLOORS,
} from '../data/categories';
import { getCategoryMeta } from './CategoryBadge';
import { ComplaintCard } from './ComplaintCard';

interface Props {
  complaints: Complaint[];
  onAddComplaint: (newComplaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>) => void;
}

export const StudentPortal: React.FC<Props> = ({
  complaints,
  onAddComplaint,
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'track'>('register');

  // Form State
  const [category, setCategory] = useState<ComplaintCategory>('electrical');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [studentName, setStudentName] = useState('Vaidik Tomar');
  const [studentId, setStudentId] = useState('STU-2024-0552');
  const [studentContact, setStudentContact] = useState('+91 98765 12345');
  const [block, setBlock] = useState(HOSTEL_FLOORS[0]);
  const [roomNumber, setRoomNumber] = useState('214-B');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Tracking Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const selectedCategoryMeta = COMPLAINT_CATEGORIES.find((c) => c.id === category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      setValidationError('Please select a problem category.');
      return;
    }
    if (!title.trim()) {
      setValidationError('Please enter a problem summary / title.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Please provide detailed description of the maintenance issue.');
      return;
    }
    if (!block.trim()) {
      setValidationError('Please select your hostel floor.');
      return;
    }
    if (!roomNumber.trim()) {
      setValidationError('Please enter your hostel room number.');
      return;
    }
    if (!studentName.trim()) {
      setValidationError('Please enter student full name.');
      return;
    }
    if (!studentId.trim()) {
      setValidationError('Please enter your roll number / student ID.');
      return;
    }
    if (!studentContact.trim()) {
      setValidationError('Please enter phone number for technician verification.');
      return;
    }
    if (!urgency) {
      setValidationError('Please choose a severity / urgency level.');
      return;
    }

    setValidationError(null);

    // Call callback
    onAddComplaint({
      title: title.trim(),
      description: description.trim(),
      category,
      urgency,
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      studentContact: studentContact.trim(),
      block,
      roomNumber: roomNumber.trim(),
    });

    const newGeneratedId = `CMP-2026-${Math.floor(100 + Math.random() * 900)}`;
    setSubmittedTicket(newGeneratedId);

    // Reset fields for next entry
    setTitle('');
    setDescription('');
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || c.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tulsidas Hostel Complaint Registration
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Official maintenance portal for Tulsidas Hostel residents. Log problems for Electrician, Plumber, Carpenter, Wi-Fi, and track resolution.
          </p>
        </div>

        {/* View switcher */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100/90 border border-slate-200 self-start sm:self-auto shadow-xs">
          <button
            id="tab-btn-register"
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle size={15} />
            <span>New Complaint Form</span>
          </button>
          <button
            id="tab-btn-track"
            type="button"
            onClick={() => setActiveTab('track')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'track'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={15} />
            <span>Track Complaints ({complaints.length})</span>
          </button>
        </div>
      </div>

      {/* Confirmation Banner if just submitted */}
      {submittedTicket && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-emerald-950">
                Complaint Registered Successfully!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your issue has been logged in the central hostel maintenance database. The hostel warden and assigned maintenance staff can now review and resolve it.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Synced with Supabase Backend (`complaints` table)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('track');
                    setSubmittedTicket(null);
                  }}
                  className="font-semibold text-emerald-900 underline hover:text-emerald-950"
                >
                  View in Complaint Tracker &rarr;
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedTicket(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW: Register Complaint */}
      {activeTab === 'register' && (
        <div className="mt-6 max-w-3xl mx-auto">
          {/* Main Registration Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <span className="text-xs font-semibold text-slate-800">New Maintenance Request</span>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  All fields are required to register
                </span>
              </div>

              {/* Category Picker */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  1. Select Problem Category <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Choose the specialized maintenance division required to attend to your problem.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COMPLAINT_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const meta = getCategoryMeta(cat.id);
                    const Icon = meta.icon;

                    return (
                      <button
                        key={cat.id}
                        id={`category-choice-${cat.id}`}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`relative flex flex-col items-start p-3.5 rounded-2xl border-2 text-left transition-all overflow-hidden ${
                          isSelected
                            ? `border-indigo-600 ${meta.lightBg} shadow-sm ring-2 ring-indigo-500/20`
                            : 'border-slate-200/90 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check size={12} className="stroke-[3]" />
                          </div>
                        )}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 shadow-xs transition-transform ${
                            isSelected
                              ? `${meta.iconBg} scale-105`
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-slate-950' : 'text-slate-800'}`}>
                          {cat.label}
                        </span>
                        <span
                          className={`text-[10px] mt-1 line-clamp-1 font-medium ${
                            isSelected ? 'text-slate-700' : 'text-slate-500'
                          }`}
                        >
                          {cat.description.split(',')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fast suggestions for selected category */}
              {selectedCategoryMeta && selectedCategoryMeta.commonIssues.length > 0 && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/50 via-slate-50 to-blue-50/50 border border-indigo-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Quick Fill Common {selectedCategoryMeta.label} Problems:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategoryMeta.commonIssues.map((issue) => (
                      <button
                        key={issue}
                        type="button"
                        onClick={() => {
                          setTitle(issue);
                          setDescription(`Reported ${issue} in hostel room. Requires inspection and prompt repair.`);
                        }}
                        className="text-xs bg-white hover:bg-indigo-50 text-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200/80 font-medium transition-colors shadow-xs"
                      >
                        + {issue}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Problem Title & Description */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Problem Summary / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="complaint-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Ceiling fan stopped working and switch is sparking"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Detailed Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="complaint-desc-input"
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe exactly what happened, when it started, and any specific hazards (such as sparks, leaks, or tripping circuit)..."
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-colors"
                  />
                </div>
              </div>

              {/* Student & Hostel Room Details */}
              <div id="student-room-coordinates-section" className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider text-slate-500">
                    Student & Room Coordinates
                  </h4>
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    All fields strictly required *
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label id="label-hostel-floor" className="block text-xs font-medium text-slate-700 mb-1">
                      Hostel Floor <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      id="select-hostel-floor"
                      required
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                    >
                      {HOSTEL_FLOORS.map((floor) => (
                        <option key={floor} value={floor}>
                          {floor}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label id="label-room-number" className="block text-xs font-medium text-slate-700 mb-1">
                      Room Number <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      id="input-room-number"
                      type="text"
                      required
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. 214-B"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label id="label-student-name" className="block text-xs font-medium text-slate-700 mb-1">
                      Student Full Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      id="input-student-name"
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label id="label-student-id" className="block text-xs font-medium text-slate-700 mb-1">
                      Roll Number / Student ID <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      id="input-student-id"
                      type="text"
                      required
                      placeholder="e.g. STU-2024-0552"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label id="label-student-contact" className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number (For Technician Verification) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      id="input-student-contact"
                      type="tel"
                      required
                      value={studentContact}
                      onChange={(e) => setStudentContact(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Priority / Urgency Selection */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Severity & Urgency Level <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { id: 'low', label: 'Standard / Low', hint: 'Non-urgent cosmetic', active: 'border-sky-500 bg-sky-50/80 text-sky-950 ring-2 ring-sky-500/20' },
                      { id: 'medium', label: 'Medium', hint: 'Daily inconvenience', active: 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20' },
                      { id: 'high', label: 'High Priority', hint: 'Needs same-day visit', active: 'border-orange-500 bg-orange-50/80 text-orange-950 ring-2 ring-orange-500/20' },
                      { id: 'emergency', label: 'Critical / Danger', hint: 'Sparks, flood, hazard', active: 'border-rose-500 bg-rose-50/80 text-rose-950 ring-2 ring-rose-500/20' },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setUrgency(lvl.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        urgency === lvl.id
                          ? `${lvl.active} font-bold shadow-xs`
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">{lvl.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        {lvl.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Validation Warning */}
              {validationError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-center gap-2 font-medium">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  id="submit-complaint-btn"
                  type="submit"
                  className="px-7 py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
                >
                  <Send size={16} />
                  <span>Register Complaint Online</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW: Track Complaints */}
      {activeTab === 'track' && (
        <div className="mt-6 space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="search-complaints-input"
                type="text"
                placeholder="Search by ticket ID, room, or issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                id="filter-category-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700"
              >
                <option value="all">All Categories</option>
                {COMPLAINT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Complaints list */}
          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search size={22} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                No matching complaints found
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try adjusting your search criteria or register a new complaint using the registration form.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="mt-4 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComplaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} isAdmin={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
