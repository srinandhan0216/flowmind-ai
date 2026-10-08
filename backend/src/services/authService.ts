import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabaseClient } from '../config/supabase.js';
import { AuthUser, JWTPayload, normalizeRole, UserRole } from '../types/auth.js';
import { RegisterInput, LoginInput } from '../validators/authValidator.js';

const JWT_SECRET = process.env.JWT_SECRET || 'flowmind_ai_super_secret_jwt_key_2026_enterprise_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// In-memory credential and role store for graceful compatibility if Supabase table
// has not yet applied the password_hash column or role constraint migration
const fallbackCredentialStore = new Map<string, string>();
const fallbackRoleStore = new Map<string, UserRole>();

// Seed default accounts password ('Flowmind@123') for seamless out-of-the-box demoing
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Flowmind@123', 10);
fallbackCredentialStore.set('elena@flowmind.ai', DEFAULT_PASSWORD_HASH);
fallbackCredentialStore.set('marcus@flowmind.ai', DEFAULT_PASSWORD_HASH);
fallbackCredentialStore.set('david@flowmind.ai', DEFAULT_PASSWORD_HASH);
fallbackCredentialStore.set('aria@flowmind.ai', DEFAULT_PASSWORD_HASH);

fallbackRoleStore.set('elena@flowmind.ai', 'ADMIN');
fallbackRoleStore.set('marcus@flowmind.ai', 'FINANCE');
fallbackRoleStore.set('david@flowmind.ai', 'MANAGER');
fallbackRoleStore.set('aria@flowmind.ai', 'EMPLOYEE');

export class AuthService {
  /**
   * Hashes a plaintext password using bcrypt
   */
  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifies plaintext password against a bcrypt hash
   */
  public static async comparePassword(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  /**
   * Generates a signed JWT authentication token
   */
  public static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
    });
  }

  /**
   * Verifies and decodes a JWT token
   */
  public static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }

  /**
   * Register a new user with bcrypt password hashing & role
   */
  public static async register(input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
    const supabase = getSupabaseClient();
    const normalizedEmail = input.email.toLowerCase().trim();

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      throw new Error(`An account with email "${normalizedEmail}" already exists.`);
    }

    // 2. Hash password with bcrypt
    const passwordHash = await this.hashPassword(input.password);
    const normalizedUserRole = normalizeRole(input.role, input.department);

    // Map to legacy DB allowed values if database has not applied new migration constraint yet
    const legacyDbRole = normalizedUserRole === 'ADMIN' ? 'admin' : (normalizedUserRole === 'FINANCE' ? 'manager' : (normalizedUserRole === 'MANAGER' ? 'manager' : 'employee'));

    // 3. Attempt insert into Supabase with password_hash column
    let createdUser: any = null;

    try {
      // First attempt: full schema with password_hash and target role
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: input.name.trim(),
          email: normalizedEmail,
          password_hash: passwordHash,
          role: normalizedUserRole,
          department: input.department.trim()
        })
        .select('id, name, email, role, department, created_at')
        .single();

      if (!error && data) {
        createdUser = data;
      } else {
        // Fallback: If password_hash column is missing OR role constraint fails
        console.warn(`[AuthService] Standard insert fallback: ${error?.message}`);
        
        // Try with legacy database role value and without password_hash if necessary
        const payloadWithoutHash: Record<string, any> = {
          name: input.name.trim(),
          email: normalizedEmail,
          role: legacyDbRole,
          department: input.department.trim()
        };

        const fallbackInsert = await supabase
          .from('users')
          .insert(payloadWithoutHash)
          .select('id, name, email, role, department, created_at')
          .single();

        if (fallbackInsert.error) {
          throw new Error(`Failed to create user record: ${fallbackInsert.error.message}`);
        }
        createdUser = fallbackInsert.data;
        fallbackCredentialStore.set(normalizedEmail, passwordHash);
        fallbackRoleStore.set(normalizedEmail, normalizedUserRole);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) throw err;
      throw new Error(`User registration failed: ${err.message || String(err)}`);
    }

    if (!createdUser) {
      throw new Error('Registration failed: unable to persist user in database.');
    }

    // Cache hash & role in memory
    fallbackCredentialStore.set(normalizedEmail, passwordHash);
    fallbackRoleStore.set(normalizedEmail, normalizedUserRole);

    const user: AuthUser = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: normalizedUserRole,
      department: createdUser.department,
      created_at: createdUser.created_at
    };

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    });

    return { user, token };
  }


  /**
   * Authenticate an existing user by email & password
   */
  public static async login(input: LoginInput): Promise<{ user: AuthUser; token: string }> {
    const supabase = getSupabaseClient();
    const normalizedEmail = input.email.toLowerCase().trim();

    // 1. Fetch user from Supabase (with password_hash if column exists)
    let dbUser: any = null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (error) {
        throw new Error(`Database lookup error: ${error.message}`);
      }
      dbUser = data;
    } catch (err: any) {
      throw new Error(`Login failed: ${err.message || String(err)}`);
    }

    if (!dbUser) {
      throw new Error('Invalid email or password.');
    }

    // 2. Retrieve bcrypt password hash
    const storedHash = dbUser.password_hash || fallbackCredentialStore.get(normalizedEmail);

    if (!storedHash) {
      throw new Error('No password configured for this account. Please reset password or contact admin.');
    }

    // 3. Verify bcrypt hash
    const isValid = await this.comparePassword(input.password, storedHash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const normalizedUserRole = fallbackRoleStore.get(normalizedEmail) || normalizeRole(dbUser.role, dbUser.department);

    const user: AuthUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: normalizedUserRole,
      department: dbUser.department,
      created_at: dbUser.created_at
    };

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    });

    return { user, token };
  }

  /**
   * Fetch current authenticated user profile
   */
  public static async getUserById(id: string): Promise<AuthUser | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, department, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    const email = data.email.toLowerCase();
    const resolvedRole = fallbackRoleStore.get(email) || normalizeRole(data.role, data.department);

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: resolvedRole,
      department: data.department,
      created_at: data.created_at
    };
  }
}

