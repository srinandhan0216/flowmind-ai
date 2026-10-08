export type UserRole = 'admin' | 'manager' | 'employee' | 'approver' | 'system';
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RequestRisk = 'low' | 'medium' | 'high' | 'critical';
export type RequestStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'escalated' | 'cancelled';
export type AIDecision = 'auto_approved' | 'auto_rejected' | 'manual_review_required' | 'escalated';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  created_at: string;
}

export interface RequestItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  department: string;
  priority: RequestPriority;
  risk: RequestRisk;
  status: RequestStatus;
  ai_decision: AIDecision | null;
  ai_reason: string | null;
  created_by: string | null;
  users?: {
    id: string;
    name: string;
    email: string;
    department: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRule {
  field: string;
  operator: string;
  value: string | number | boolean;
  decision?: AIDecision;
}

export interface WorkflowAction {
  type: string;
  [key: string]: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger: Record<string, unknown>;
  rules: WorkflowRule[];
  actions: WorkflowAction[];
  created_by: string | null;
  created_at: string;
}

export interface Approval {
  id: string;
  request_id: string;
  approver: string | null;
  status: ApprovalStatus;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowLog {
  id: string;
  request_id: string;
  step: string;
  action: string;
  result: Record<string, unknown>;
  timestamp: string;
}
