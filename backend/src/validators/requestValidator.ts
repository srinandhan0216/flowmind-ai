import { RequestPriority, RequestRisk, RequestStatus, AIDecision } from '../types/database.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const ALLOWED_PRIORITIES: RequestPriority[] = ['low', 'medium', 'high', 'urgent'];
const ALLOWED_RISKS: RequestRisk[] = ['low', 'medium', 'high', 'critical'];
const ALLOWED_STATUSES: RequestStatus[] = ['pending', 'under_review', 'approved', 'rejected', 'escalated', 'cancelled'];
const ALLOWED_AI_DECISIONS: AIDecision[] = ['auto_approved', 'auto_rejected', 'manual_review_required', 'escalated'];

export interface CreateRequestDTO {
  title: string;
  description?: string;
  category: string;
  amount?: number;
  department: string;
  priority?: RequestPriority;
  risk?: RequestRisk;
  status?: RequestStatus;
  ai_decision?: AIDecision | null;
  ai_reason?: string | null;
  created_by?: string | null;
}

export interface UpdateRequestDTO {
  title?: string;
  description?: string;
  category?: string;
  amount?: number;
  department?: string;
  priority?: RequestPriority;
  risk?: RequestRisk;
  status?: RequestStatus;
  ai_decision?: AIDecision | null;
  ai_reason?: string | null;
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

export const validateUUID = (id: string): boolean => {
  return UUID_REGEX.test(id);
};

export const validateCreateRequest = (input: unknown): ValidationResult<CreateRequestDTO> => {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const body = input as Record<string, unknown>;

  // Title
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    errors.push('Field "title" is required and must be a non-empty string.');
  } else if (body.title.length > 255) {
    errors.push('Field "title" must not exceed 255 characters.');
  }

  // Category
  if (!body.category || typeof body.category !== 'string' || body.category.trim().length === 0) {
    errors.push('Field "category" is required and must be a non-empty string.');
  } else if (body.category.length > 100) {
    errors.push('Field "category" must not exceed 100 characters.');
  }

  // Department
  if (!body.department || typeof body.department !== 'string' || body.department.trim().length === 0) {
    errors.push('Field "department" is required and must be a non-empty string.');
  } else if (body.department.length > 100) {
    errors.push('Field "department" must not exceed 100 characters.');
  }

  // Amount
  let parsedAmount = 0;
  if (body.amount !== undefined && body.amount !== null) {
    if (typeof body.amount !== 'number' || isNaN(body.amount) || body.amount < 0) {
      errors.push('Field "amount" must be a non-negative number.');
    } else {
      parsedAmount = Number(body.amount.toFixed(2));
    }
  }

  // Priority
  let priority: RequestPriority = 'medium';
  if (body.priority !== undefined) {
    if (!ALLOWED_PRIORITIES.includes(body.priority as RequestPriority)) {
      errors.push(`Field "priority" must be one of: ${ALLOWED_PRIORITIES.join(', ')}.`);
    } else {
      priority = body.priority as RequestPriority;
    }
  }

  // Risk
  let risk: RequestRisk = 'low';
  if (body.risk !== undefined) {
    if (!ALLOWED_RISKS.includes(body.risk as RequestRisk)) {
      errors.push(`Field "risk" must be one of: ${ALLOWED_RISKS.join(', ')}.`);
    } else {
      risk = body.risk as RequestRisk;
    }
  }

  // Status
  let status: RequestStatus = 'pending';
  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status as RequestStatus)) {
      errors.push(`Field "status" must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    } else {
      status = body.status as RequestStatus;
    }
  }

  // AI Decision
  let ai_decision: AIDecision | null = null;
  if (body.ai_decision !== undefined && body.ai_decision !== null) {
    if (!ALLOWED_AI_DECISIONS.includes(body.ai_decision as AIDecision)) {
      errors.push(`Field "ai_decision" must be one of: ${ALLOWED_AI_DECISIONS.join(', ')}.`);
    } else {
      ai_decision = body.ai_decision as AIDecision;
    }
  }

  // created_by UUID validation if provided
  let created_by: string | null = null;
  if (body.created_by !== undefined && body.created_by !== null) {
    if (typeof body.created_by !== 'string' || !validateUUID(body.created_by)) {
      errors.push('Field "created_by" must be a valid UUID string.');
    } else {
      created_by = body.created_by;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      title: (body.title as string).trim(),
      description: body.description ? String(body.description).trim() : '',
      category: (body.category as string).trim(),
      amount: parsedAmount,
      department: (body.department as string).trim(),
      priority,
      risk,
      status,
      ai_decision,
      ai_reason: body.ai_reason ? String(body.ai_reason).trim() : null,
      created_by
    }
  };
};

export const validateUpdateRequest = (input: unknown): ValidationResult<UpdateRequestDTO> => {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Update payload must be a valid JSON object.'] };
  }

  const body = input as Record<string, unknown>;
  const keys = Object.keys(body);

  if (keys.length === 0) {
    return { isValid: false, errors: ['At least one field must be provided for update.'] };
  }

  const sanitized: UpdateRequestDTO = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      errors.push('Field "title" must be a non-empty string.');
    } else if (body.title.length > 255) {
      errors.push('Field "title" must not exceed 255 characters.');
    } else {
      sanitized.title = body.title.trim();
    }
  }

  if (body.description !== undefined) {
    sanitized.description = body.description ? String(body.description).trim() : '';
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || body.category.trim().length === 0) {
      errors.push('Field "category" must be a non-empty string.');
    } else {
      sanitized.category = body.category.trim();
    }
  }

  if (body.amount !== undefined) {
    if (typeof body.amount !== 'number' || isNaN(body.amount) || body.amount < 0) {
      errors.push('Field "amount" must be a non-negative number.');
    } else {
      sanitized.amount = Number(body.amount.toFixed(2));
    }
  }

  if (body.department !== undefined) {
    if (typeof body.department !== 'string' || body.department.trim().length === 0) {
      errors.push('Field "department" must be a non-empty string.');
    } else {
      sanitized.department = body.department.trim();
    }
  }

  if (body.priority !== undefined) {
    if (!ALLOWED_PRIORITIES.includes(body.priority as RequestPriority)) {
      errors.push(`Field "priority" must be one of: ${ALLOWED_PRIORITIES.join(', ')}.`);
    } else {
      sanitized.priority = body.priority as RequestPriority;
    }
  }

  if (body.risk !== undefined) {
    if (!ALLOWED_RISKS.includes(body.risk as RequestRisk)) {
      errors.push(`Field "risk" must be one of: ${ALLOWED_RISKS.join(', ')}.`);
    } else {
      sanitized.risk = body.risk as RequestRisk;
    }
  }

  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status as RequestStatus)) {
      errors.push(`Field "status" must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    } else {
      sanitized.status = body.status as RequestStatus;
    }
  }

  if (body.ai_decision !== undefined) {
    if (body.ai_decision !== null && !ALLOWED_AI_DECISIONS.includes(body.ai_decision as AIDecision)) {
      errors.push(`Field "ai_decision" must be one of: ${ALLOWED_AI_DECISIONS.join(', ')} or null.`);
    } else {
      sanitized.ai_decision = body.ai_decision as AIDecision | null;
    }
  }

  if (body.ai_reason !== undefined) {
    sanitized.ai_reason = body.ai_reason ? String(body.ai_reason).trim() : null;
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [], data: sanitized };
};
