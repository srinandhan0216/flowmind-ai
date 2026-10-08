import { getGeminiClient } from '../config/gemini.js';
import { getSupabaseClient } from '../config/supabase.js';
import { AIAnalysisResult, AIAnalysisResultSchema } from '../validators/aiValidator.js';
import { RequestPriority, RequestRisk, RequestStatus, AIDecision } from '../types/database.js';

export class AIDecisionService {
  /**
   * 1. Load applicable workflow rules from Supabase workflows table
   */
  public static async loadWorkflowRules(): Promise<string> {
    try {
      const supabase = getSupabaseClient();
      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('name, description, trigger, rules, actions')
        .limit(10);

      if (error || !workflows || workflows.length === 0) {
        // Fallback default enterprise organizational policies if table is empty
        return JSON.stringify([
          {
            policy: 'Standard Enterprise Procurement Ceiling',
            condition: 'Amounts under $2,500 (approx ₹200,000) for standard hardware/software with low risk may be AUTO_APPROVE.',
            escalation: 'Amounts exceeding threshold or items with high risk require MANAGER and FINANCE approvals.'
          },
          {
            policy: 'IT Equipment & Hardware Access',
            condition: 'Laptops, servers, and multi-user hardware require MANAGER and FINANCE sign-off for inventory allocation.',
            approvals: ['MANAGER', 'FINANCE']
          }
        ], null, 2);
      }

      return JSON.stringify(workflows, null, 2);
    } catch (err) {
      console.warn('[AIDecisionService] Could not load custom rules from Supabase, applying default enterprise rules:', err);
      return JSON.stringify([
        {
          policy: 'Standard Enterprise Procurement Ceiling',
          condition: 'Amounts exceeding automatic approval threshold require MANAGER and FINANCE approvals.'
        }
      ], null, 2);
    }
  }

  /**
   * 2. Send request description and rules to Gemini, validate with Zod, and persist in Supabase
   */
  public static async analyzeRequest(
    description: string,
    existingRequestId?: string
  ): Promise<{ analysis: AIAnalysisResult; requestId: string }> {
    const gemini = getGeminiClient();
    if (!gemini) {
      throw new Error('Google Gemini API client is not configured. Please set GEMINI_API_KEY in backend/.env');
    }

    // Load active rules from database
    const workflowRules = await this.loadWorkflowRules();

    // Use gemini-2.5-flash with strict JSON output configuration
    const model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const systemPrompt = `You are FlowMind AI's Enterprise Decision Engine.
Your role is to analyze organizational operational and financial intake requests, extract key entities, evaluate them against organizational workflow rules, and output a structured decision.

SECURITY AND INTEGRITY CONSTRAINTS:
1. You must ONLY output a single valid JSON object strictly matching the schema below.
2. NEVER output SQL statements, database commands, bash/shell code, markdown fences, or arbitrary executable code.
3. You do NOT have execution authority. You only produce structured decision analysis for the backend to interpret.

ORGANIZATIONAL WORKFLOW RULES TO EVALUATE:
${workflowRules}

DECISION CRITERIA:
- decision: Must be one of ["AUTO_APPROVE", "APPROVAL_REQUIRED", "REJECT", "NEED_MORE_INFO"]
- priority: Must be one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
- risk: Must be one of ["LOW", "MEDIUM", "HIGH"]
- category: Standard uppercase snake_case identifier (e.g., "IT_EQUIPMENT", "SOFTWARE_LICENSE", "PROCUREMENT", "TRAVEL", "HARDWARE")
- extractedData:
    - amount: numeric value (e.g., 75000, or 0 if unspecified, must be a number)
    - quantity: integer count (e.g., 3, must be an integer if present)
    - item: name of the asset, tool, or service (e.g., "laptops")
    - purpose: intended team or operational goal (e.g., "development team")
- requiredApprovals: array of uppercase strings (e.g. ["MANAGER", "FINANCE"], or empty array [] if AUTO_APPROVE)
- reason: clear, concise explanation of why this decision was reached based on the rules.

EXAMPLE OUTPUT FORMAT:
{
  "category": "IT_EQUIPMENT",
  "extractedData": {
    "amount": 75000,
    "quantity": 3,
    "item": "laptops",
    "purpose": "development team"
  },
  "priority": "HIGH",
  "risk": "MEDIUM",
  "decision": "APPROVAL_REQUIRED",
  "requiredApprovals": [
    "MANAGER",
    "FINANCE"
  ],
  "reason": "The requested amount exceeds the automatic approval threshold."
}`;

    const prompt = `${systemPrompt}

USER REQUEST TO EVALUATE:
"${description}"`;

    let rawText = '';
    try {
      const response = await model.generateContent(prompt);
      rawText = response.response.text();
    } catch (err: unknown) {
      console.error('[AIDecisionService] Gemini API invocation failed:', err);
      throw new Error(`Gemini API call failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 4. Parse JSON
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (err) {
      console.error('[AIDecisionService] Failed to parse Gemini response as JSON:', rawText);
      throw new Error('Gemini returned an invalid JSON string.');
    }

    // 5. Validate AI response using Zod schema
    const parseResult = AIAnalysisResultSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      console.error('[AIDecisionService] Zod validation failed for Gemini output:', parseResult.error.format());
      throw new Error(`AI decision output failed Zod schema validation: ${parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    const analysis: AIAnalysisResult = parseResult.data;

    // 6. Predefined Database Mapping & Storage in Supabase
    const supabase = getSupabaseClient();

    // Map AI decision to Database RequestStatus & AIDecision
    let dbStatus: RequestStatus = 'under_review';
    let dbAIDecision: AIDecision = 'manual_review_required';

    switch (analysis.decision) {
      case 'AUTO_APPROVE':
        dbStatus = 'approved';
        dbAIDecision = 'auto_approved';
        break;
      case 'APPROVAL_REQUIRED':
        dbStatus = 'under_review';
        dbAIDecision = 'manual_review_required';
        break;
      case 'REJECT':
        dbStatus = 'rejected';
        dbAIDecision = 'auto_rejected';
        break;
      case 'NEED_MORE_INFO':
        dbStatus = 'pending';
        dbAIDecision = 'manual_review_required';
        break;
    }

    // Map priority
    const priorityMap: Record<string, RequestPriority> = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'urgent'
    };
    const dbPriority: RequestPriority = priorityMap[analysis.priority] || 'medium';

    // Map risk
    const riskMap: Record<string, RequestRisk> = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high'
    };
    const dbRisk: RequestRisk = riskMap[analysis.risk] || 'medium';

    const dbAmount = Number(analysis.extractedData.amount || 0);
    let targetRequestId = existingRequestId;

    if (targetRequestId) {
      // Update existing request record
      const { error: updateError } = await supabase
        .from('requests')
        .update({
          category: analysis.category,
          amount: dbAmount,
          priority: dbPriority,
          risk: dbRisk,
          status: dbStatus,
          ai_decision: dbAIDecision,
          ai_reason: analysis.reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetRequestId);

      if (updateError) {
        console.warn(`[AIDecisionService] Warning: Failed to update existing request ${targetRequestId}:`, updateError.message);
      }
    } else {
      // Create new request record to persist analysis
      const itemTitle = analysis.extractedData.item
        ? `Request: ${analysis.extractedData.quantity ? analysis.extractedData.quantity + 'x ' : ''}${analysis.extractedData.item}`
        : 'AI Evaluated Request';

      const { data: newRecord, error: insertError } = await supabase
        .from('requests')
        .insert({
          title: itemTitle,
          description,
          category: analysis.category,
          amount: dbAmount,
          department: 'Engineering',
          priority: dbPriority,
          risk: dbRisk,
          status: dbStatus,
          ai_decision: dbAIDecision,
          ai_reason: analysis.reason
        })
        .select('id')
        .single();

      if (insertError) {
        console.warn('[AIDecisionService] Warning: Failed to insert new request record in Supabase:', insertError.message);
      } else if (newRecord) {
        targetRequestId = newRecord.id;
      }
    }

    // Log the automated step to workflow_logs if targetRequestId exists
    if (targetRequestId) {
      await supabase
        .from('workflow_logs')
        .insert({
          request_id: targetRequestId,
          step: 'ai_decision_engine',
          action: 'gemini_analyze_request',
          result: analysis as unknown as Record<string, unknown>
        })
        .select('id')
        .maybeSingle();
    }

    return {
      analysis,
      requestId: targetRequestId || ''
    };
  }

  /**
   * 3. Convert natural language requirement into a structured workflow configuration using Gemini
   */
  public static async generateWorkflow(userPrompt: string): Promise<import('../validators/aiValidator.js').GeneratedWorkflow> {
    const { GeneratedWorkflowSchema } = await import('../validators/aiValidator.js');
    const gemini = getGeminiClient();
    if (!gemini) {
      throw new Error('Google Gemini API client is not configured. Please set GEMINI_API_KEY in backend/.env');
    }

    const model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const systemPrompt = `You are FlowMind AI's Workflow Architect.
Your task is to convert natural-language business requirements into structured workflow automation rules.

SECURITY AND SYNTAX RULES:
1. Output ONLY a valid JSON object matching the schema below.
2. Do NOT output code, SQL, or markdown fences.
3. Extract conditions with field, operator, and numerical or string value.
4. Extract required approval actions or notification actions.

SCHEMA SPECIFICATION:
{
  "name": "High Value Purchase Approval",
  "trigger": "PURCHASE_REQUEST",
  "conditions": [
    {
      "field": "amount",
      "operator": ">",
      "value": 50000
    }
  ],
  "actions": [
    {
      "type": "REQUIRE_APPROVAL",
      "role": "MANAGER"
    },
    {
      "type": "REQUIRE_APPROVAL",
      "role": "FINANCE"
    }
  ]
}

- trigger: UPPERCASE_SNAKE_CASE (e.g. "PURCHASE_REQUEST", "IT_ACCESS_REQUEST", "EXPENSE_REPORT")
- conditions[].operator: Comparison operator (e.g. ">", "<", ">=", "<=", "==", "!=")
- actions[].type: e.g. "REQUIRE_APPROVAL", "NOTIFY_CHANNEL", "AUTO_APPROVE", "AUTO_REJECT"
- actions[].role: UPPERCASE role if REQUIRE_APPROVAL (e.g. "MANAGER", "FINANCE", "DIRECTOR", "LEGAL")`;

    const fullPrompt = `${systemPrompt}

NATURAL LANGUAGE REQUIREMENT:
"${userPrompt}"`;

    let rawText = '';
    try {
      const response = await model.generateContent(fullPrompt);
      rawText = response.response.text();
    } catch (err: unknown) {
      console.error('[AIDecisionService.generateWorkflow] Gemini invocation failed:', err);
      throw new Error(`Gemini API call failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (err) {
      console.error('[AIDecisionService.generateWorkflow] Failed to parse JSON:', rawText);
      throw new Error('Gemini returned an invalid JSON string.');
    }

    const validation = GeneratedWorkflowSchema.safeParse(parsedJson);
    if (!validation.success) {
      console.error('[AIDecisionService.generateWorkflow] Zod validation failed:', validation.error.format());
      throw new Error(
        `Generated workflow failed Zod schema validation: ${validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }

    return validation.data;
  }
}
