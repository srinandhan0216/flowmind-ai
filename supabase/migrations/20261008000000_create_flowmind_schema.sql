-- ==============================================================================
-- FlowMind AI — Enterprise Smart Automation Platform Database Schema
-- Supabase PostgreSQL Migration
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTIONS: Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLES DEFINITION
-- ==============================================================================

-- 3.1 USERS TABLE
-- Tracks organizational members, roles, and departmental ownership
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'approver', 'system')),
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 REQUESTS TABLE
-- Core operational items (invoices, purchase orders, access grants, claims, etc.)
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) DEFAULT 0.00,
    department VARCHAR(100) NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    risk VARCHAR(30) NOT NULL DEFAULT 'low' CHECK (risk IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'escalated', 'cancelled')),
    ai_decision VARCHAR(50) DEFAULT NULL CHECK (ai_decision IS NULL OR ai_decision IN ('auto_approved', 'auto_rejected', 'manual_review_required', 'escalated')),
    ai_reason TEXT DEFAULT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for requests.updated_at
DROP TRIGGER IF EXISTS trigger_requests_updated_at ON public.requests;
CREATE TRIGGER trigger_requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.3 WORKFLOWS TABLE
-- Visual automation workflows with dynamic JSONB rules and action pipelines
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger JSONB NOT NULL DEFAULT '{"type": "manual"}'::jsonb,
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 APPROVALS TABLE
-- Human-in-the-loop audit trail and approval lifecycle for requests
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    approver UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for approvals.updated_at
DROP TRIGGER IF EXISTS trigger_approvals_updated_at ON public.approvals;
CREATE TRIGGER trigger_approvals_updated_at
    BEFORE UPDATE ON public.approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.5 WORKFLOW_LOGS TABLE
-- Granular step-by-step telemetry of AI decisions, rules evaluations, and action executions
CREATE TABLE IF NOT EXISTS public.workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    step VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PERFORMANCE & LOOKUP INDEXES
-- ==============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Requests indexes
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_department ON public.requests(department);
CREATE INDEX IF NOT EXISTS idx_requests_created_by ON public.requests(created_by);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_priority_risk ON public.requests(priority, risk);

-- Approvals indexes
CREATE INDEX IF NOT EXISTS idx_approvals_request_id ON public.approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON public.approvals(approver);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);

-- Workflow logs indexes
CREATE INDEX IF NOT EXISTS idx_workflow_logs_request_id ON public.workflow_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_timestamp ON public.workflow_logs(timestamp DESC);

-- Workflows indexes
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON public.workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_rules_gin ON public.workflows USING gin (rules);
CREATE INDEX IF NOT EXISTS idx_workflows_actions_gin ON public.workflows USING gin (actions);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for API & Supabase Client integration
CREATE POLICY "Allow read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow insert/update to users" ON public.users FOR ALL USING (true);

CREATE POLICY "Allow all access to requests" ON public.requests FOR ALL USING (true);
CREATE POLICY "Allow all access to workflows" ON public.workflows FOR ALL USING (true);
CREATE POLICY "Allow all access to approvals" ON public.approvals FOR ALL USING (true);
CREATE POLICY "Allow all access to workflow_logs" ON public.workflow_logs FOR ALL USING (true);

-- ==============================================================================
-- 6. INITIAL SEED DATA FOR DEMO & TESTING
-- ==============================================================================

-- Seed Users
INSERT INTO public.users (id, name, email, role, department)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Elena Rostova', 'elena@flowmind.ai', 'admin', 'Executive'),
    ('a0000000-0000-0000-0000-000000000002', 'Marcus Vance', 'marcus@flowmind.ai', 'manager', 'Finance'),
    ('a0000000-0000-0000-0000-000000000003', 'Aria Chen', 'aria@flowmind.ai', 'employee', 'Engineering'),
    ('a0000000-0000-0000-0000-000000000004', 'David Kim', 'david@flowmind.ai', 'approver', 'Operations')
ON CONFLICT (id) DO NOTHING;

-- Seed Workflows
INSERT INTO public.workflows (id, name, description, trigger, rules, actions, created_by)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'Enterprise Procurement & Invoice Triage',
        'Evaluates vendor invoices using Gemini AI. Auto-approves under $2,500 if low risk, escalates anomalous vendor data.',
        '{"event": "request.created", "condition": "category == '\''Procurement'\''"}'::jsonb,
        '[
            {"field": "amount", "operator": "<=", "value": 2500, "decision": "auto_approved"},
            {"field": "risk", "operator": "==", "value": "critical", "decision": "escalated"}
        ]'::jsonb,
        '[
            {"type": "gemini_analyze", "prompt": "Extract line items and detect price anomalies"},
            {"type": "notify_slack", "channel": "#finance-approvals"}
        ]'::jsonb,
        'a0000000-0000-0000-0000-000000000002'
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'Cloud Infrastructure & Hardware Access Request',
        'Routes production database credential requests to security managers with compliance check.',
        '{"event": "request.created", "condition": "category == '\''IT Access'\''"}'::jsonb,
        '[
            {"field": "priority", "operator": "==", "value": "urgent", "decision": "manual_review_required"}
        ]'::jsonb,
        '[
            {"type": "gemini_policy_check", "policy": "SOC2_compliance"},
            {"type": "request_manager_approval", "role": "approver"}
        ]'::jsonb,
        'a0000000-0000-0000-0000-000000000001'
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Requests
INSERT INTO public.requests (
    id, title, description, category, amount, department, priority, risk, status, ai_decision, ai_reason, created_by
)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'Datadog Cloud Monitoring Annual License Renewal',
        'Annual telemetry and observability license subscription for production clusters.',
        'Procurement',
        1850.00,
        'Engineering',
        'medium',
        'low',
        'approved',
        'auto_approved',
        'Amount ($1,850.00) is within auto-approval ceiling ($2,500.00) with proven recurring vendor history and zero anomaly indicators.',
        'a0000000-0000-0000-0000-000000000003'
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'GPU Cluster Reserved Instances for LLM Fine-Tuning',
        'Provisioning 8x NVIDIA H100 instances for departmental agentic model evaluation.',
        'IT Infrastructure',
        14200.00,
        'Engineering',
        'urgent',
        'high',
        'under_review',
        'manual_review_required',
        'Total budget exceeds standard threshold ($10,000). Multi-department sign-off required from Finance and Executive teams.',
        'a0000000-0000-0000-0000-000000000003'
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Approvals
INSERT INTO public.approvals (id, request_id, approver, status, comment)
VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000002',
        'approved',
        'Automated AI policy approved; verified against FY26 Q4 engineering software budget.'
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000004',
        'pending',
        'Awaiting CFO review of reserved instance pricing schedule.'
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Workflow Logs
INSERT INTO public.workflow_logs (id, request_id, step, action, result)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'trigger_event',
        'request_received',
        '{"status": "success", "event": "request.created", "requestId": "c0000000-0000-0000-0000-000000000001"}'::jsonb
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'ai_analysis',
        'gemini_risk_evaluation',
        '{"model": "gemini-1.5-pro", "riskScore": 0.08, "recommendation": "auto_approve", "confidence": 0.99}'::jsonb
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'rule_execution',
        'threshold_check',
        '{"matchedRule": "amount <= 2500", "outcome": "auto_approved"}'::jsonb
    ),
    (
        'e0000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000002',
        'trigger_event',
        'request_received',
        '{"status": "success", "event": "request.created", "requestId": "c0000000-0000-0000-0000-000000000002"}'::jsonb
    ),
    (
        'e0000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000002',
        'ai_analysis',
        'gemini_risk_evaluation',
        '{"model": "gemini-1.5-pro", "riskScore": 0.82, "recommendation": "manual_review_required", "confidence": 0.95}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;
