export type ComplaintCategory =
  | 'electrical'
  | 'plumbing'
  | 'carpentry'
  | 'internet'
  | 'civil'
  | 'other';

export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  urgency: UrgencyLevel;
  studentName: string;
  studentId: string;
  studentContact: string;
  block: string;
  roomNumber: string;
  createdAt: string;
  status: ComplaintStatus;
  resolvedAt?: string;
  resolvedBy?: string;
  adminRemarks?: string;
  assignedWorker?: string;
}

export interface CategoryMeta {
  id: ComplaintCategory;
  label: string;
  iconName: string;
  description: string;
  commonIssues: string[];
}

export interface AdminAccount {
  name: string;
  username: string;
  email?: string;
  roleTitle?: string;
  createdAt: string;
}
