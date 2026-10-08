-- FlowMind AI Schema Reference (Identical to supabase/migrations/20261008000000_create_flowmind_schema.sql)
-- See: supabase/migrations/20261008000000_create_flowmind_schema.sql

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

-- 3.1 USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'approver', 'system')),
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 REQUESTS TABLE
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

DROP TRIGGER IF EXISTS trigger_requests_updated_at ON public.requests;
CREATE TRIGGER trigger_requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.3 WORKFLOWS TABLE
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
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    approver UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_approvals_updated_at ON public.approvals;
CREATE TRIGGER trigger_approvals_updated_at
    BEFORE UPDATE ON public.approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.5 WORKFLOW_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    step VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_department ON public.requests(department);
CREATE INDEX IF NOT EXISTS idx_requests_created_by ON public.requests(created_by);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_request_id ON public.approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON public.approvals(approver);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_request_id ON public.workflow_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_workflows_rules_gin ON public.workflows USING gin (rules);
CREATE INDEX IF NOT EXISTS idx_workflows_actions_gin ON public.workflows USING gin (actions);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow insert/update to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all access to requests" ON public.requests FOR ALL USING (true);
CREATE POLICY "Allow all access to workflows" ON public.workflows FOR ALL USING (true);
CREATE POLICY "Allow all access to approvals" ON public.approvals FOR ALL USING (true);
CREATE POLICY "Allow all access to workflow_logs" ON public.workflow_logs FOR ALL USING (true);
