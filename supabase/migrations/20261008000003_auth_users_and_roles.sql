-- ==============================================================================
-- FlowMind AI — Authentication, Password Hashing & Role Matrix Migration
-- ==============================================================================

-- 1. Add password_hash column to public.users if not already present
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Update role constraint to support EMPLOYEE, MANAGER, FINANCE, ADMIN
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN (
    'EMPLOYEE', 
    'MANAGER', 
    'FINANCE', 
    'ADMIN',
    -- Backwards-compatible lowercase values
    'admin', 
    'manager', 
    'employee', 
    'approver', 
    'system',
    'finance'
));

-- 3. Create index on email for high-speed authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (LOWER(email));
