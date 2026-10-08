import { Request, Response, NextFunction } from 'express';
import { AnalyzeRequestInputSchema } from '../validators/aiValidator.js';
import { AIDecisionService } from '../services/aiDecisionService.js';

export class AIController {
  /**
   * POST /api/ai/analyze-request
   * Analyzes natural language organizational requests using Gemini AI & Supabase workflow rules
   */
  public static async analyzeRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = AnalyzeRequestInputSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request input payload.',
          errors: validation.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const { description, requestId } = validation.data;

      const { analysis, requestId: savedRequestId } = await AIDecisionService.analyzeRequest(
        description,
        requestId
      );

      // Return the exact structured output requested by the specification
      res.status(200).json({
        category: analysis.category,
        extractedData: analysis.extractedData,
        priority: analysis.priority,
        risk: analysis.risk,
        decision: analysis.decision,
        requiredApprovals: analysis.requiredApprovals,
        reason: analysis.reason,
        // Optional metadata link to stored Supabase request record
        ...(savedRequestId ? { requestId: savedRequestId } : {})
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/generate-workflow
   * Generates structured workflow automation from natural language requirement
   */
  public static async generateWorkflow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { GenerateWorkflowInputSchema } = await import('../validators/aiValidator.js');
      const validation = GenerateWorkflowInputSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid workflow generation prompt.',
          errors: validation.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const workflow = await AIDecisionService.generateWorkflow(validation.data.prompt);

      // Return the exact structured JSON specification
      res.status(200).json(workflow);
    } catch (error) {
      next(error);
    }
  }
}

