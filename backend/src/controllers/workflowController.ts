import { Request, Response, NextFunction } from 'express';
import { WorkflowExecutionService } from '../services/workflowExecutionService.js';
import { validateUUID } from '../validators/requestValidator.js';
import { getSupabaseClient } from '../config/supabase.js';

export class WorkflowController {
  /**
   * GET /api/workflows
   * List all workflows from Supabase workflows table
   */
  public static async getWorkflows(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      res.status(200).json({
        success: true,
        count: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/workflows
   * Save a newly generated or custom workflow to Supabase
   */
  public static async createWorkflow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, trigger, conditions, rules, actions, description } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Field "name" is required and must be a string.'
        });
        return;
      }

      const supabase = getSupabaseClient();
      const workflowRules = conditions || rules || [];
      const workflowTrigger = typeof trigger === 'string' ? { event: trigger } : (trigger || { type: 'manual' });
      const workflowActions = actions || [];

      const { data, error } = await supabase
        .from('workflows')
        .insert({
          name: name.trim(),
          description: description ? String(description).trim() : `Automated workflow: ${name}`,
          trigger: workflowTrigger,
          rules: workflowRules,
          actions: workflowActions
        })
        .select('*')
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: `Failed to save workflow to Supabase: ${error.message}`
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Workflow successfully saved to Supabase.',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/workflows/execute/:requestId
   * Execute autonomous workflow pipeline for a given request
   */
  public static async executeWorkflow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params;

      if (!validateUUID(requestId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid UUID format for requestId parameter.'
        });
        return;
      }

      const overrideDescription = req.body?.description ? String(req.body.description).trim() : undefined;

      const result = await WorkflowExecutionService.executeWorkflow(
        requestId,
        overrideDescription
      );

      res.status(200).json({
        success: true,
        message: 'Workflow executed successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/workflows/logs/:requestId
   * Retrieve all audit telemetry and step-by-step logs for a given request
   */
  public static async getWorkflowLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params;

      if (!validateUUID(requestId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid UUID format for requestId parameter.'
        });
        return;
      }

      const logs = await WorkflowExecutionService.getWorkflowLogs(requestId);

      res.status(200).json({
        success: true,
        requestId,
        count: logs.length,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }
}
