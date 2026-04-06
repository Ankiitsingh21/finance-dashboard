import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { AuthUser, Role } from '@/types';
import { AppError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Signs a JWT token with the user payload
 */
export function signToken(payload: AuthUser): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifies a JWT token and returns the decoded payload
 */
export function verifyToken(token: string): AuthUser {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & AuthUser;
    
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new AppError(401, 'Invalid token payload');
    }

    // Validate that role is a valid Role enum value
    if (!Object.values(Role).includes(decoded.role as Role)) {
      throw new AppError(401, 'Invalid role in token');
    }

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as Role,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'Invalid token');
    }
    throw new AppError(401, 'Token verification failed');
  }
}

/**
 * Extracts Bearer token from Authorization header
 */
export function extractToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new AppError(401, 'Authorization header is required');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Invalid authorization format. Use: Bearer <token>');
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    throw new AppError(401, 'Token is required');
  }

  return token;
}
