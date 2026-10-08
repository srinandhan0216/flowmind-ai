import { z } from 'zod';

// Input request validation
export const AnalyzeRequestInputSchema = z.object({
  description: z
    .string()
    .min(1, 'Field "description" is required and cannot be empty.')
    .max(5000, 'Description must not exceed 5000 characters.'),
  requestId: z.string().uuid('Invalid UUID format for requestId.').optional()
});

export type AnalyzeRequestInput = z.infer<typeof AnalyzeRequestInputSchema>;

// Allowed Enums per specification
export const DecisionEnum = z.enum([
  'AUTO_APPROVE',
  'APPROVAL_REQUIRED',
  'REJECT',
  'NEED_MORE_INFO'
]);

export const PriorityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);

export const RiskEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH'
]);

// Extracted data schema with preprocess for nullable fields from LLM outputs
export const ExtractedDataSchema = z.object({
  amount: z.preprocess(
    (val) => (val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  quantity: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : Number(val)),
    z.number().int().nonnegative().optional()
  ),
  item: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : String(val)),
    z.string().optional()
  ),
  purpose: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : String(val)),
    z.string().optional()
  )
}).passthrough();

// Required Gemini AI Analysis Output Schema
export const AIAnalysisResultSchema = z.object({
  category: z.string().min(1, 'Category is required.'),
  extractedData: ExtractedDataSchema,
  priority: PriorityEnum,
  risk: RiskEnum,
  decision: DecisionEnum,
  requiredApprovals: z.array(z.string()).default([]),
  reason: z.string().min(1, 'Reason is required.')
});

export type AIAnalysisResult = z.infer<typeof AIAnalysisResultSchema>;

// ==========================================
// WORKFLOW GENERATION SCHEMAS
// ==========================================

export const GenerateWorkflowInputSchema = z.object({
  prompt: z
    .string()
    .min(3, 'Workflow prompt must be at least 3 characters long.')
    .max(2000, 'Prompt must not exceed 2000 characters.')
});

export type GenerateWorkflowInput = z.infer<typeof GenerateWorkflowInputSchema>;

export const WorkflowConditionSchema = z.object({
  field: z.string().min(1, 'Field name is required.'),
  operator: z.string().min(1, 'Operator is required.'),
  value: z.union([z.number(), z.string(), z.boolean(), z.array(z.string()), z.array(z.number())])
});

export const WorkflowActionSchema = z.object({
  type: z.string().min(1, 'Action type is required.'),
  role: z.string().optional(),
  target: z.string().optional(),
  channel: z.string().optional()
}).passthrough();

export const GeneratedWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required.'),
  trigger: z.string().min(1, 'Trigger is required.'),
  conditions: z.array(WorkflowConditionSchema).default([]),
  actions: z.array(WorkflowActionSchema).min(1, 'At least one action is required.')
});

export type GeneratedWorkflow = z.infer<typeof GeneratedWorkflowSchema>;
