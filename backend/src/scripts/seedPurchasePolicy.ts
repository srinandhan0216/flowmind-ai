import dotenv from 'dotenv';
import { getSupabaseClient } from '../config/supabase.js';

dotenv.config();

export const defaultPurchasePolicyWorkflow = {
  id: 'b0000000-0000-0000-0000-000000000010',
  name: 'Default Organizational Purchase Policy',
  description: 'Tiered purchase approval matrix: <= ₹10,000 AUTO_APPROVE; ₹10,001 - ₹50,000 MANAGER; ₹50,001 - ₹2,00,000 MANAGER + FINANCE; > ₹2,00,000 MANAGER + FINANCE + DIRECTOR.',
  trigger: {
    event: 'request.created',
    scope: 'all_purchases_and_procurement',
    currency: 'INR'
  },
  rules: [
    {
      tier: 'TIER_1_MICRO',
      currency: 'INR',
      min_amount: 0,
      max_amount: 10000,
      decision: 'AUTO_APPROVE',
      requiredApprovals: [],
      policy_summary: 'Purchases <= ₹10,000 are automatically approved with zero human delay.'
    },
    {
      tier: 'TIER_2_STANDARD',
      currency: 'INR',
      min_amount: 10001,
      max_amount: 50000,
      decision: 'APPROVAL_REQUIRED',
      requiredApprovals: ['MANAGER'],
      policy_summary: 'Purchases > ₹10,000 and <= ₹50,000 require Manager approval.'
    },
    {
      tier: 'TIER_3_ELEVATED',
      currency: 'INR',
      min_amount: 50001,
      max_amount: 200000,
      decision: 'APPROVAL_REQUIRED',
      requiredApprovals: ['MANAGER', 'FINANCE'],
      policy_summary: 'Purchases > ₹50,000 and <= ₹2,00,000 require Manager + Finance approval.'
    },
    {
      tier: 'TIER_4_EXECUTIVE',
      currency: 'INR',
      min_amount: 200001,
      max_amount: null,
      decision: 'APPROVAL_REQUIRED',
      requiredApprovals: ['MANAGER', 'FINANCE', 'DIRECTOR'],
      policy_summary: 'Purchases > ₹2,00,000 require Manager + Finance + Director approval.'
    }
  ],
  actions: [
    {
      type: 'assign_approval_chain',
      strategy: 'sequential'
    },
    {
      type: 'record_audit_trail',
      target: 'workflow_logs'
    }
  ]
};

async function seedPolicy() {
  console.log('Seeding Default Organizational Purchase Policy into Supabase workflows table...');
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('workflows')
    .upsert(defaultPurchasePolicyWorkflow, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    console.error('Failed to seed workflow policy:', error.message);
    process.exit(1);
  }

  console.log('Successfully seeded Default Organizational Purchase Policy!');
  console.log('Workflow ID:', data.id);
  console.log('Workflow Name:', data.name);
  console.log('Rules Count:', Array.isArray(data.rules) ? data.rules.length : 'JSONB');
  process.exit(0);
}

seedPolicy().catch((err) => {
  console.error('Unhandled seed error:', err);
  process.exit(1);
});
