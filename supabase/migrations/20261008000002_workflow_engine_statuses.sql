-- ==============================================================================
-- FlowMind AI — Workflow Execution Engine Status Updates
-- Supabase PostgreSQL Migration
-- ==============================================================================

-- Expand check constraint on requests.status to support PENDING_APPROVAL and NEEDS_INFORMATION
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;

ALTER TABLE public.requests ADD CONSTRAINT requests_status_check 
CHECK (status IN (
    'pending', 
    'under_review', 
    'approved', 
    'rejected', 
    'escalated', 
    'cancelled',
    'PENDING_APPROVAL', 
    'APPROVED', 
    'REJECTED', 
    'NEEDS_INFORMATION'
));
