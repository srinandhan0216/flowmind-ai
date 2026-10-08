-- ==============================================================================
-- FlowMind AI — Phase 9: Default Organizational Purchase Policy Seed
-- Supabase PostgreSQL Migration
-- ==============================================================================

INSERT INTO public.workflows (
    id,
    name,
    description,
    trigger,
    rules,
    actions
)
VALUES (
    'b0000000-0000-0000-0000-000000000010',
    'Default Organizational Purchase Policy',
    'Tiered purchase approval matrix: <= ₹10,000 AUTO_APPROVE; ₹10,001 - ₹50,000 MANAGER; ₹50,001 - ₹2,00,000 MANAGER + FINANCE; > ₹2,00,000 MANAGER + FINANCE + DIRECTOR.',
    '{"event": "request.created", "scope": "all_purchases_and_procurement", "currency": "INR"}'::jsonb,
    '[
        {
            "tier": "TIER_1_MICRO",
            "currency": "INR",
            "min_amount": 0,
            "max_amount": 10000,
            "decision": "AUTO_APPROVE",
            "requiredApprovals": [],
            "policy_summary": "Purchases <= ₹10,000 are automatically approved with zero human delay."
        },
        {
            "tier": "TIER_2_STANDARD",
            "currency": "INR",
            "min_amount": 10001,
            "max_amount": 50000,
            "decision": "APPROVAL_REQUIRED",
            "requiredApprovals": ["MANAGER"],
            "policy_summary": "Purchases > ₹10,000 and <= ₹50,000 require Manager approval."
        },
        {
            "tier": "TIER_3_ELEVATED",
            "currency": "INR",
            "min_amount": 50001,
            "max_amount": 200000,
            "decision": "APPROVAL_REQUIRED",
            "requiredApprovals": ["MANAGER", "FINANCE"],
            "policy_summary": "Purchases > ₹50,000 and <= ₹2,00,000 require Manager + Finance approval."
        },
        {
            "tier": "TIER_4_EXECUTIVE",
            "currency": "INR",
            "min_amount": 200001,
            "max_amount": null,
            "decision": "APPROVAL_REQUIRED",
            "requiredApprovals": ["MANAGER", "FINANCE", "DIRECTOR"],
            "policy_summary": "Purchases > ₹2,00,000 require Manager + Finance + Director approval."
        }
    ]'::jsonb,
    '[
        {
            "type": "assign_approval_chain",
            "strategy": "sequential"
        },
        {
            "type": "record_audit_trail",
            "target": "workflow_logs"
        }
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    trigger = EXCLUDED.trigger,
    rules = EXCLUDED.rules,
    actions = EXCLUDED.actions;
