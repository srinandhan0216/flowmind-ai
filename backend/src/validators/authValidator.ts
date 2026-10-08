import { z } from 'zod';

export const RoleEnum = z.enum(['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN']);

export const RegisterInputSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.'),
  email: z
    .string()
    .email('Please provide a valid email address.')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .max(100, 'Password cannot exceed 100 characters.'),
  role: z
    .enum(['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'])
    .default('EMPLOYEE'),
  department: z
    .string()
    .min(2, 'Department must be at least 2 characters.')
    .max(100, 'Department cannot exceed 100 characters.')
    .default('Engineering')
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address.')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required.')
});

export type LoginInput = z.infer<typeof LoginInputSchema>;
