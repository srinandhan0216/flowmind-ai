import { getSupabaseClient } from '../config/supabase.js';
import { Request as RequestEntity } from '../types/database.js';
import { CreateRequestDTO, UpdateRequestDTO } from '../validators/requestValidator.js';
import { JWTPayload } from '../types/auth.js';

export interface RequestFilterParams {
  status?: string;
  category?: string;
  department?: string;
  priority?: string;
  risk?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Validates if an authenticated user has permission to access a specific request
 */
export function isRequestPermittedForUser(request: RequestEntity, user: JWTPayload): boolean {
  if (user.role === 'ADMIN') return true;
  if (request.created_by && request.created_by === user.id) return true;

  if (user.role === 'MANAGER') {
    if (request.department && request.department.toLowerCase() === user.department.toLowerCase()) return true;
    if (['pending', 'under_review', 'PENDING_APPROVAL'].includes(request.status)) return true;
    return false;
  }

  if (user.role === 'FINANCE') {
    if (request.department && request.department.toLowerCase() === 'finance') return true;
    if (Number(request.amount) > 0) return true;
    const cat = (request.category || '').toLowerCase();
    if (['purchase', 'it_equipment', 'expense_report', 'procurement'].some((c) => cat.includes(c))) return true;
    return false;
  }

  // EMPLOYEE role: can only access their own submitted requests
  return false;
}

export class RequestService {
  /**
   * Retrieve list of requests with role-based scoping and filtering
   */
  public static async getAllRequests(
    filters: RequestFilterParams = {},
    user?: JWTPayload
  ): Promise<{ data: RequestEntity[]; total: number }> {
    const supabase = getSupabaseClient();
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    let query = supabase
      .from('requests')
      .select('*, users:created_by (id, name, email, department)', { count: 'exact' });

    // 1. Enforce Role-Based Scoping
    if (user) {
      if (user.role === 'EMPLOYEE') {
        // Employees can ONLY see their own requests
        query = query.eq('created_by', user.id);
      } else if (user.role === 'MANAGER') {
        // Managers see their department OR requests under review OR their own
        query = query.or(
          `department.ilike.%${user.department}%,created_by.eq.${user.id},status.in.(pending,under_review,PENDING_APPROVAL)`
        );
      } else if (user.role === 'FINANCE') {
        // Finance sees finance department OR monetary purchases OR their own
        query = query.or(
          `department.ilike.%Finance%,created_by.eq.${user.id},amount.gt.0,category.ilike.%purchase%,category.ilike.%IT_EQUIPMENT%`
        );
      }
      // ADMIN role: Unrestricted across all departments and requests
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.category) {
      query = query.ilike('category', `%${filters.category}%`);
    }
    if (filters.department) {
      query = query.ilike('department', `%${filters.department}%`);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.risk) {
      query = query.eq('risk', filters.risk);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[RequestService.getAllRequests] Supabase error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    return {
      data: (data || []) as unknown as RequestEntity[],
      total: count || 0
    };
  }


  /**
   * Retrieve a single request by its primary UUID key
   */
  public static async getRequestById(id: string): Promise<RequestEntity | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('requests')
      .select('*, users:created_by (id, name, email, department)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`[RequestService.getRequestById] Error fetching request ${id}:`, error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    return (data as unknown as RequestEntity) || null;
  }

  /**
   * Create a new request entry in the database
   */
  public static async createRequest(payload: CreateRequestDTO): Promise<RequestEntity> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('requests')
      .insert({
        title: payload.title,
        description: payload.description || '',
        category: payload.category,
        amount: payload.amount !== undefined ? payload.amount : 0.00,
        department: payload.department,
        priority: payload.priority || 'medium',
        risk: payload.risk || 'low',
        status: payload.status || 'pending',
        ai_decision: payload.ai_decision || null,
        ai_reason: payload.ai_reason || null,
        created_by: payload.created_by || null
      })
      .select('*, users:created_by (id, name, email, department)')
      .single();

    if (error) {
      console.error('[RequestService.createRequest] Error creating request:', error);
      throw new Error(`Failed to create request: ${error.message}`);
    }

    return data as unknown as RequestEntity;
  }

  /**
   * Update an existing request by UUID
   */
  public static async updateRequest(id: string, payload: UpdateRequestDTO): Promise<RequestEntity | null> {
    const supabase = getSupabaseClient();

    // Verify record exists first
    const existing = await this.getRequestById(id);
    if (!existing) {
      return null;
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, users:created_by (id, name, email, department)')
      .single();

    if (error) {
      console.error(`[RequestService.updateRequest] Error updating request ${id}:`, error);
      throw new Error(`Failed to update request: ${error.message}`);
    }

    return data as unknown as RequestEntity;
  }
}
