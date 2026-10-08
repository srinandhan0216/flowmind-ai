import { Request, Response, NextFunction } from 'express';
import { RegisterInputSchema, LoginInputSchema } from '../validators/authValidator.js';
import { AuthService } from '../services/authService.js';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registers a new organization user with bcrypt password hashing
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = RegisterInputSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Registration validation failed.',
          errors: validation.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const result = await AuthService.register(validation.data);

      res.status(201).json({
        success: true,
        message: 'Account successfully registered.',
        user: result.user,
        token: result.token
      });
    } catch (error: any) {
      if (error.message && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user credentials and generates a signed JWT
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = LoginInputSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid credentials payload.',
          errors: validation.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const result = await AuthService.login(validation.data);

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        user: result.user,
        token: result.token
      });
    } catch (error: any) {
      if (error.message && (error.message.includes('Invalid email') || error.message.includes('No password'))) {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user's profile and active role
   */
  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized.'
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User profile not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/demo-accounts
   * Returns available pre-configured test accounts for quick role-switching
   */
  public static async getDemoAccounts(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      defaultPassword: 'Flowmind@123',
      accounts: [
        { email: 'elena@flowmind.ai', name: 'Elena Rostova', role: 'ADMIN', department: 'Executive' },
        { email: 'marcus@flowmind.ai', name: 'Marcus Vance', role: 'FINANCE', department: 'Finance' },
        { email: 'david@flowmind.ai', name: 'David Kim', role: 'MANAGER', department: 'Operations' },
        { email: 'aria@flowmind.ai', name: 'Aria Chen', role: 'EMPLOYEE', department: 'Engineering' }
      ]
    });
  }
}
