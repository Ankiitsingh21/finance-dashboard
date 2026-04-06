import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@/generated/prisma/client';

export class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponseBody {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
}

export function errorResponse(error: unknown): NextResponse<ErrorResponseBody> {
  console.error('Error:', error);

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(err.message);
    });

    return NextResponse.json(
      { success: false, error: 'Validation failed', errors: fieldErrors },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return NextResponse.json(
          { success: false, error: `A record with this ${field} already exists` },
          { status: 409 }
        );
      }
      case 'P2025':
        return NextResponse.json(
          { success: false, error: 'Record not found' },
          { status: 404 }
        );
      case 'P2003':
        return NextResponse.json(
          { success: false, error: 'Related record not found' },
          { status: 400 }
        );
      default:
        return NextResponse.json(
          { success: false, error: 'Database error' },
          { status: 500 }
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { success: false, error: 'Invalid data provided' },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}
