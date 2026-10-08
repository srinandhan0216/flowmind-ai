import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[Error] ${statusCode} - ${err.message}`);
  if (err.stack && isDev) {
    console.error(err.stack);
  }

  // Prevent leaking internal connection strings, database credentials, or API keys in production
  let safeMessage = err.message || 'Internal Server Error';
  if (!isDev && statusCode === 500) {
    const lower = safeMessage.toLowerCase();
    if (
      lower.includes('key') ||
      lower.includes('secret') ||
      lower.includes('password') ||
      lower.includes('postgres://') ||
      lower.includes('token') ||
      lower.includes('supabase')
    ) {
      safeMessage = 'An internal server error occurred. Please contact the administrator.';
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: safeMessage,
      ...(isDev ? { stack: err.stack } : {})
    }
  });
};
