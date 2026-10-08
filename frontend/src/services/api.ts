import axios from 'axios';
import type { RequestItem } from '../types/database';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Attach Authorization Bearer token to all outgoing requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('flowmind_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export interface HealthResponse {
  status: string;
  service?: string;
  uptimeSeconds?: number;
  timestamp?: string;
  environment?: string;
  port?: number;
  integrations?: {
    supabaseConfigured?: boolean;
    geminiConfigured?: boolean;
  };
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  category: string;
  nodesCount: number;
  updatedAt: string;
}

export const fetchHealthCheck = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};

export const fetchAutomations = async (): Promise<AutomationWorkflow[]> => {
  const response = await apiClient.get<{ success: boolean; data: AutomationWorkflow[] }>('/api/automations');
  return response.data.data;
};

// Requests API
export const fetchRequests = async (params?: Record<string, string | number>): Promise<{ data: RequestItem[]; total: number }> => {
  const response = await apiClient.get<{ success: boolean; data: RequestItem[]; total: number }>('/api/requests', { params });
  return {
    data: response.data.data,
    total: response.data.total
  };
};

export const fetchRequestById = async (id: string): Promise<RequestItem> => {
  const response = await apiClient.get<{ success: boolean; data: RequestItem }>(`/api/requests/${id}`);
  return response.data.data;
};

export const createRequest = async (payload: Partial<RequestItem>): Promise<RequestItem> => {
  const response = await apiClient.post<{ success: boolean; data: RequestItem }>('/api/requests', payload);
  return response.data.data;
};

export const updateRequest = async (id: string, payload: Partial<RequestItem>): Promise<RequestItem> => {
  const response = await apiClient.patch<{ success: boolean; data: RequestItem }>(`/api/requests/${id}`, payload);
  return response.data.data;
};

export interface AIAnalysisResultPayload {
  category: string;
  extractedData: {
    amount: number;
    quantity?: number;
    item?: string;
    purpose?: string;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  decision: 'AUTO_APPROVE' | 'APPROVAL_REQUIRED' | 'REJECT' | 'NEED_MORE_INFO';
  requiredApprovals: string[];
  reason: string;
  requestId?: string;
}

export const analyzeAIRequest = async (description: string, requestId?: string): Promise<AIAnalysisResultPayload> => {
  const response = await apiClient.post<AIAnalysisResultPayload>('/api/ai/analyze-request', {
    description,
    requestId
  });
  return response.data;
};

// Workflow Execution Engine APIs
export interface WorkflowExecutionResponse {
  success: boolean;
  requestId: string;
  previousStatus: string;
  finalStatus: string;
  aiDecision: string;
  extractedData: {
    category: string;
    amount: number;
    priority: string;
    risk: string;
    quantity?: number;
    item?: string;
    purpose?: string;
  };
  requiredApprovals: string[];
  approvalsCreated: Array<{
    id: string;
    role: string;
    status: string;
  }>;
  reason: string;
  logsCount: number;
}

export interface WorkflowLogItem {
  id: string;
  request_id: string;
  step: string;
  action: string;
  result: Record<string, unknown>;
  timestamp: string;
}

export const executeWorkflow = async (
  requestId: string,
  description?: string
): Promise<WorkflowExecutionResponse> => {
  const response = await apiClient.post<{ success: boolean; data: WorkflowExecutionResponse }>(
    `/api/workflows/execute/${requestId}`,
    { description }
  );
  return response.data.data;
};

export const fetchWorkflowLogs = async (requestId: string): Promise<WorkflowLogItem[]> => {
  const response = await apiClient.get<{ success: boolean; data: WorkflowLogItem[] }>(
    `/api/workflows/logs/${requestId}`
  );
  return response.data.data;
};

// Natural Language AI Workflow Generation
export interface GeneratedWorkflowData {
  name: string;
  trigger: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string | number | boolean;
  }>;
  actions: Array<{
    type: string;
    role?: string;
    [key: string]: unknown;
  }>;
}

export const generateAIWorkflow = async (prompt: string): Promise<GeneratedWorkflowData> => {
  const response = await apiClient.post<GeneratedWorkflowData>('/api/ai/generate-workflow', { prompt });
  return response.data;
};

export const saveWorkflow = async (workflow: Partial<GeneratedWorkflowData>): Promise<{ id: string; name: string }> => {
  const response = await apiClient.post<{ success: boolean; data: { id: string; name: string } }>('/api/workflows', workflow);
  return response.data.data;
};

export const fetchWorkflowsList = async (): Promise<any[]> => {
  const response = await apiClient.get<{ success: boolean; data: any[] }>('/api/workflows');
  return response.data.data;
};

// ==========================================
// Authentication APIs
// ==========================================
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface DemoAccount {
  email: string;
  name: string;
  role: UserRole;
  department: string;
}

export const loginApi = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
  return response.data;
};

export const registerApi = async (payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
}): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/register', payload);
  return response.data;
};

export const fetchMeApi = async (): Promise<AuthUser> => {
  const response = await apiClient.get<{ success: boolean; user: AuthUser }>('/api/auth/me');
  return response.data.user;
};

export const fetchDemoAccountsApi = async (): Promise<{ defaultPassword: string; accounts: DemoAccount[] }> => {
  const response = await apiClient.get<{ success: boolean; defaultPassword: string; accounts: DemoAccount[] }>('/api/auth/demo-accounts');
  return response.data;
};


