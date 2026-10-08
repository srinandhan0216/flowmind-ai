import { Request, Response, NextFunction } from 'express';
import { RequestService, isRequestPermittedForUser } from '../services/requestService.js';
import { 
  validateUUID, 
  validateCreateRequest, 
  validateUpdateRequest 
} from '../validators/requestValidator.js';

export class RequestController {
  /**
   * GET /api/requests
   * Retrieve all requests with role-based scoping and filtering
   */
  public static async getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, category, department, priority, risk, search, limit, offset } = req.query;

      const result = await RequestService.getAllRequests(
        {
          status: status ? String(status) : undefined,
          category: category ? String(category) : undefined,
          department: department ? String(department) : undefined,
          priority: priority ? String(priority) : undefined,
          risk: risk ? String(risk) : undefined,
          search: search ? String(search) : undefined,
          limit: limit ? parseInt(String(limit), 10) : 50,
          offset: offset ? parseInt(String(offset), 10) : 0
        },
        req.user
      );

      res.status(200).json({
        success: true,
        count: result.data.length,
        total: result.total,
        userRole: req.user?.role || 'ANONYMOUS',
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/requests/:id
   * Retrieve single request by ID with role-based permission check
   */
  public static async getRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid UUID format for request ID parameter.'
        });
        return;
      }

      const requestItem = await RequestService.getRequestById(id);

      if (!requestItem) {
        res.status(404).json({
          success: false,
          error: `Request with ID "${id}" was not found.`
        });
        return;
      }

      // Enforce role-based access control
      if (req.user && !isRequestPermittedForUser(requestItem, req.user)) {
        res.status(403).json({
          success: false,
          error: `Access denied: Role "${req.user.role}" does not have permission to view this request.`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: requestItem
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/requests
   * Create a new request in the database and bind creator identity
   */
  public static async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = validateCreateRequest(req.body);

      if (!validation.isValid || !validation.data) {
        res.status(400).json({
          success: false,
          message: 'Validation failed for request creation.',
          errors: validation.errors
        });
        return;
      }

      // Bind creator identity & department from authenticated JWT session if present
      const payload = {
        ...validation.data,
        created_by: req.user?.id || validation.data.created_by,
        department: validation.data.department || req.user?.department || 'Engineering'
      };

      const created = await RequestService.createRequest(payload);

      res.status(201).json({
        success: true,
        message: 'Request created successfully.',
        data: created
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/requests/:id
   * Update an existing request by ID with role permission checks
   */
  public static async updateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid UUID format for request ID parameter.'
        });
        return;
      }

      const existing = await RequestService.getRequestById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Request with ID "${id}" was not found.`
        });
        return;
      }

      // Role check for update
      if (req.user) {
        if (!isRequestPermittedForUser(existing, req.user)) {
          res.status(403).json({
            success: false,
            error: `Access denied: Role "${req.user.role}" cannot modify this request.`
          });
          return;
        }

        // Prevent EMPLOYEE from approving their own request
        if (req.user.role === 'EMPLOYEE' && req.body.status && ['approved', 'APPROVED'].includes(req.body.status)) {
          res.status(403).json({
            success: false,
            error: 'Access denied: Employees cannot approve requests. Manager or Finance approval required.'
          });
          return;
        }
      }

      const validation = validateUpdateRequest(req.body);

      if (!validation.isValid || !validation.data) {
        res.status(400).json({
          success: false,
          message: 'Validation failed for request update.',
          errors: validation.errors
        });
        return;
      }

      const updated = await RequestService.updateRequest(id, validation.data);

      res.status(200).json({
        success: true,
        message: 'Request updated successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}

