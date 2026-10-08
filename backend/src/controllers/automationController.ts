import { Request, Response } from 'express';

// Sample automation workflows metadata for organization intelligence
const mockAutomations = [
  {
    id: 'wf-1',
    name: 'Smart Document Triaging & Routing',
    description: 'Classifies incoming invoices and contracts, extracting key fields and notifying owners.',
    status: 'active',
    category: 'Finance & Legal',
    nodesCount: 5,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'wf-2',
    name: 'Customer Support Escalation Agent',
    description: 'Analyzes user sentiment and auto-routes priority tickets to tier-3 specialists.',
    status: 'active',
    category: 'Operations',
    nodesCount: 7,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'wf-3',
    name: 'Autonomous Code Review Assistant',
    description: 'Summarizes PR diffs, checks compliance benchmarks, and drafts release notes.',
    status: 'draft',
    category: 'Engineering',
    nodesCount: 4,
    updatedAt: new Date().toISOString()
  }
];

export const getAutomations = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: mockAutomations,
    total: mockAutomations.length
  });
};
