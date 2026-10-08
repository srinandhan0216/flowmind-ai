import { getSupabaseClient } from '../config/supabase.js';
import { AIDecisionService } from './aiDecisionService.js';
import { AIAnalysisResult } from '../validators/aiValidator.js';
import { Request as RequestEntity, WorkflowLog } from '../types/database.js';

export interface WorkflowExecutionResult {
  success: boolean;
  requestId: string;
  previousStatus: string;
  finalStatus: string;
  aiDecision: string;
  extractedData: {
    category: string;
    amount: number;
    priority: string;
    risk: string;
    quantity?: number;
    item?: string;
    purpose?: string;
  };
  requiredApprovals: string[];
  approvalsCreated: Array<{
    id: string;
    role: string;
    status: string;
  }>;
  reason: string;
  logsCount: number;
}

export class WorkflowExecutionService {
  /**
   * Helper to write a structured event to public.workflow_logs
   */
  public static async recordLog(
    requestId: string,
    step: string,
    action: string,
    result: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.from('workflow_logs').insert({
        request_id: requestId,
        step,
        action,
        result
      });
    } catch (err) {
      console.warn(`[WorkflowExecutionService] Failed to record workflow log for request ${requestId}:`, err);
    }
  }

  /**
   * Helper to update request status with constraint resilience
   */
  private static async updateRequestStatus(
    requestId: string,
    targetStatus: string,
    aiDecision: string,
    aiReason: string,
    extractedCategory: string,
    amount: number,
    priority: string,
    risk: string
  ): Promise<string> {
    const supabase = getSupabaseClient();

    // Mapping priority & risk to database enum values
    const pMap: Record<string, string> = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'urgent' };
    const rMap: Record<string, string> = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' };
    const dbPriority = pMap[priority] || 'medium';
    const dbRisk = rMap[risk] || 'low';

    // Map ai_decision to schema values
    let dbAIDecision = 'manual_review_required';
    if (aiDecision === 'AUTO_APPROVE') dbAIDecision = 'auto_approved';
    else if (aiDecision === 'REJECT') dbAIDecision = 'auto_rejected';

    const baseUpdate = {
      category: extractedCategory,
      amount,
      priority: dbPriority,
      risk: dbRisk,
      ai_decision: dbAIDecision,
      ai_reason: aiReason,
      updated_at: new Date().toISOString()
    };

    // Try targetStatus directly first (e.g. PENDING_APPROVAL, APPROVED, REJECTED, NEEDS_INFORMATION)
    const { error: directError } = await supabase
      .from('requests')
      .update({ ...baseUpdate, status: targetStatus })
      .eq('id', requestId);

    if (!directError) {
      return targetStatus;
    }

    // If check constraint rejects new uppercase/extended status, fallback to compatible status
    console.warn(`[WorkflowExecutionService] Status "${targetStatus}" rejected by constraint, applying fallback:`, directError.message);
    let fallbackStatus = 'under_review';
    if (targetStatus === 'APPROVED') fallbackStatus = 'approved';
    else if (targetStatus === 'REJECTED') fallbackStatus = 'rejected';
    else if (targetStatus === 'PENDING_APPROVAL') fallbackStatus = 'under_review';
    else if (targetStatus === 'NEEDS_INFORMATION') fallbackStatus = 'pending';

    await supabase
      .from('requests')
      .update({ ...baseUpdate, status: fallbackStatus })
      .eq('id', requestId);

    return targetStatus;
  }

  /**
   * Main Workflow Execution Engine
   */
  public static async executeWorkflow(
    requestId: string,
    overrideDescription?: string
  ): Promise<WorkflowExecutionResult> {
    const supabase = getSupabaseClient();

    // 1. Save or Load request from Supabase
    let requestItem: RequestEntity | null = null;
    let descriptionToAnalyze = overrideDescription || '';

    // Check if request exists in database
    const { data: existingData, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to query request: ${fetchError.message}`);
    }

    if (existingData) {
      requestItem = existingData as unknown as RequestEntity;
      if (!descriptionToAnalyze) {
        descriptionToAnalyze = requestItem.description || requestItem.title;
      }
    } else {
      // If requestId does not exist yet and description is provided, create it (Step 1: Save request to Supabase)
      if (!overrideDescription) {
        throw new Error(`Request with ID "${requestId}" not found in database.`);
      }

      const { data: newRow, error: insertError } = await supabase
        .from('requests')
        .insert({
          id: requestId,
          title: 'Intake Request for AI Workflow Execution',
          description: overrideDescription,
          category: 'GENERAL',
          amount: 0,
          department: 'Engineering',
          status: 'pending'
        })
        .select('*')
        .single();

      if (insertError) {
        throw new Error(`Failed to save initial request to Supabase: ${insertError.message}`);
      }
      requestItem = newRow as unknown as RequestEntity;
      descriptionToAnalyze = overrideDescription;
    }

    // Step 1 Log: Ingestion
    await this.recordLog(requestId, 'intake_ingestion', 'request_saved', {
      requestId,
      descriptionLength: descriptionToAnalyze.length,
      initialStatus: requestItem.status
    });

    // 2. Analyze using Gemini and extract category, amount, priority, risk
    // 3. Load applicable purchase policy from Supabase workflows table
    const { analysis } = await AIDecisionService.analyzeRequest(descriptionToAnalyze, requestId);

    // Step 2 Log: Gemini Reasoning & Policy Match
    await this.recordLog(requestId, 'policy_evaluation', 'gemini_decision_computed', {
      decision: analysis.decision,
      category: analysis.category,
      amount: analysis.extractedData.amount,
      priority: analysis.priority,
      risk: analysis.risk,
      requiredApprovals: analysis.requiredApprovals,
      reason: analysis.reason
    });

    const previousStatus = requestItem.status;
    let finalStatus = 'PENDING_APPROVAL';
    const approvalsCreated: Array<{ id: string; role: string; status: string }> = [];

    // 4. Branch by AI Decision:
    if (analysis.decision === 'AUTO_APPROVE') {
      // 6. AUTO_APPROVE: update request status to APPROVED, create workflow log
      finalStatus = await this.updateRequestStatus(
        requestId,
        'APPROVED',
        analysis.decision,
        analysis.reason,
        analysis.category,
        analysis.extractedData.amount,
        analysis.priority,
        analysis.risk
      );

      await this.recordLog(requestId, 'workflow_execution', 'auto_approved', {
        status: finalStatus,
        decision: analysis.decision,
        amount: analysis.extractedData.amount,
        comment: 'Auto-approved by FlowMind AI under micro-purchase policy ceiling.'
      });
    } 
    else if (analysis.decision === 'APPROVAL_REQUIRED') {
      // 7. APPROVAL_REQUIRED: create approval records, update request status to PENDING_APPROVAL, create workflow logs
      const requiredRoles = analysis.requiredApprovals.length > 0
        ? analysis.requiredApprovals
        : ['MANAGER'];

      // Create an approval record for each required approver role
      for (const role of requiredRoles) {
        // Query if a user matching this role exists
        const roleLower = role.toLowerCase();
        const { data: matchingUsers } = await supabase
          .from('users')
          .select('id')
          .or(`role.eq.${roleLower},department.eq.${role}`)
          .limit(1);

        const assignedApproverId = matchingUsers && matchingUsers.length > 0 ? matchingUsers[0].id : null;

        const { data: newApproval, error: appError } = await supabase
          .from('approvals')
          .insert({
            request_id: requestId,
            approver: assignedApproverId,
            status: 'pending',
            comment: `Required Approval Gate: ${role}`
          })
          .select('id')
          .single();

        if (newApproval) {
          approvalsCreated.push({
            id: newApproval.id,
            role,
            status: 'pending'
          });
        } else if (appError) {
          console.warn(`[WorkflowExecutionService] Error creating approval record for ${role}:`, appError.message);
        }
      }

      finalStatus = await this.updateRequestStatus(
        requestId,
        'PENDING_APPROVAL',
        analysis.decision,
        analysis.reason,
        analysis.category,
        analysis.extractedData.amount,
        analysis.priority,
        analysis.risk
      );

      await this.recordLog(requestId, 'workflow_execution', 'routed_for_approvals', {
        status: finalStatus,
        requiredRoles,
        approvalsCreatedCount: approvalsCreated.length,
        approvals: approvalsCreated
      });
    } 
    else if (analysis.decision === 'REJECT') {
      // 8. REJECT: update request status to REJECTED, create workflow log
      finalStatus = await this.updateRequestStatus(
        requestId,
        'REJECTED',
        analysis.decision,
        analysis.reason,
        analysis.category,
        analysis.extractedData.amount,
        analysis.priority,
        analysis.risk
      );

      await this.recordLog(requestId, 'workflow_execution', 'auto_rejected', {
        status: finalStatus,
        decision: analysis.decision,
        reason: analysis.reason
      });
    } 
    else if (analysis.decision === 'NEED_MORE_INFO') {
      // 9. NEED_MORE_INFO: update request status to NEEDS_INFORMATION, create workflow log
      finalStatus = await this.updateRequestStatus(
        requestId,
        'NEEDS_INFORMATION',
        analysis.decision,
        analysis.reason,
        analysis.category,
        analysis.extractedData.amount,
        analysis.priority,
        analysis.risk
      );

      await this.recordLog(requestId, 'workflow_execution', 'needs_information_flagged', {
        status: finalStatus,
        decision: analysis.decision,
        reason: analysis.reason
      });
    }

    // Step 5 Log: Final completion log
    await this.recordLog(requestId, 'workflow_completed', 'execution_cycle_finished', {
      finalStatus,
      decision: analysis.decision,
      timestamp: new Date().toISOString()
    });

    // Query total log count for this request
    const { count } = await supabase
      .from('workflow_logs')
      .select('id', { count: 'exact', head: true })
      .eq('request_id', requestId);

    return {
      success: true,
      requestId,
      previousStatus,
      finalStatus,
      aiDecision: analysis.decision,
      extractedData: {
        category: analysis.category,
        amount: analysis.extractedData.amount,
        priority: analysis.priority,
        risk: analysis.risk,
        quantity: analysis.extractedData.quantity,
        item: analysis.extractedData.item,
        purpose: analysis.extractedData.purpose
      },
      requiredApprovals: analysis.requiredApprovals,
      approvalsCreated,
      reason: analysis.reason,
      logsCount: count || 0
    };
  }

  /**
   * Retrieve all workflow logs for a given request
   */
  public static async getWorkflowLogs(requestId: string): Promise<WorkflowLog[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('workflow_logs')
      .select('*')
      .eq('request_id', requestId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error(`[WorkflowExecutionService] Error fetching logs for ${requestId}:`, error);
      throw new Error(`Failed to retrieve workflow logs: ${error.message}`);
    }

    return (data || []) as unknown as WorkflowLog[];
  }
}
