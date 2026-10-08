import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { JWTPayload, UserRole } from '../types/auth.js';

// Extend Express Request interface to include authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication Middleware: Validates Bearer JWT in Authorization header
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token in Authorization header.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = AuthService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: `Invalid or expired token: ${err.message || 'Authentication failed'}`
    });
  }
};

/**
 * Optional Authentication: Attaches req.user if Bearer token present, but does not block if omitted
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = AuthService.verifyToken(token);
    } catch {
      // Ignore token decode errors for optional auth
    }
  }
  next();
};

/**
 * Role-Based Access Control (RBAC) Guard
 * Ensures authenticated user possesses one of the authorized roles
 */
export const authorizeRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required prior to role verification.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Role "${req.user.role}" does not have permission to access this resource. Required: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};
