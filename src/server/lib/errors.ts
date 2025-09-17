import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    cause?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.cause = cause;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_EXPIRED: 'RESOURCE_EXPIRED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PROKERALA_ERROR: 'PROKERALA_ERROR',
  OPENAI_ERROR: 'OPENAI_ERROR',
  GEOCODING_ERROR: 'GEOCODING_ERROR',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Error factory functions
export const createError = {
  validation: (message: string, field?: string) => 
    new AppError(message, ErrorCodes.VALIDATION_ERROR, 400, true),
  
  unauthorized: (message: string = 'Unauthorized access') => 
    new AppError(message, ErrorCodes.UNAUTHORIZED, 401, true),
  
  forbidden: (message: string = 'Access forbidden') => 
    new AppError(message, ErrorCodes.FORBIDDEN, 403, true),
  
  notFound: (message: string = 'Resource not found') => 
    new AppError(message, ErrorCodes.NOT_FOUND, 404, true),
  
  conflict: (message: string = 'Resource conflict') => 
    new AppError(message, ErrorCodes.RESOURCE_CONFLICT, 409, true),
  
  rateLimit: (message: string = 'Rate limit exceeded', retryAfter?: number) => 
    new AppError(message, ErrorCodes.RATE_LIMIT_EXCEEDED, 429, true),
  
  externalService: (service: string, message: string, cause?: Error) => 
    new AppError(`${service} error: ${message}`, ErrorCodes.EXTERNAL_SERVICE_ERROR, 502, true, cause),
  
  prokerala: (message: string, cause?: Error) => 
    new AppError(`Prokerala API error: ${message}`, ErrorCodes.PROKERALA_ERROR, 502, true, cause),
  
  openai: (message: string, cause?: Error) => 
    new AppError(`OpenAI API error: ${message}`, ErrorCodes.OPENAI_ERROR, 502, true, cause),
  
  geocoding: (message: string, cause?: Error) => 
    new AppError(`Geocoding service error: ${message}`, ErrorCodes.GEOCODING_ERROR, 502, true, cause),
  
  database: (message: string, cause?: Error) => 
    new AppError(`Database error: ${message}`, ErrorCodes.DATABASE_ERROR, 500, true, cause),
  
  internal: (message: string = 'Internal server error', cause?: Error) => 
    new AppError(message, ErrorCodes.INTERNAL_ERROR, 500, false, cause),
  
  timeout: (message: string = 'Request timeout') => 
    new AppError(message, ErrorCodes.TIMEOUT_ERROR, 504, true),
};

// Error mapping functions
export function mapProkeralaError(error: any): AppError {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return createError.prokerala('Invalid request parameters', error);
      case 401:
        return createError.prokerala('Invalid API credentials', error);
      case 403:
        return createError.prokerala('API access forbidden', error);
      case 404:
        return createError.prokerala('API endpoint not found', error);
      case 429:
        return createError.prokerala('API rate limit exceeded', error);
      case 500:
        return createError.prokerala('Prokerala server error', error);
      case 502:
        return createError.prokerala('Prokerala service unavailable', error);
      case 503:
        return createError.prokerala('Prokerala service temporarily unavailable', error);
      default:
        return createError.prokerala(`HTTP ${status}: ${data?.message || 'Unknown error'}`, error);
    }
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return createError.prokerala('Unable to connect to Prokerala API', error);
  }
  
  if (error.code === 'ETIMEDOUT') {
    return createError.timeout('Prokerala API request timeout');
  }
  
  return createError.prokerala(error.message || 'Unknown Prokerala error', error);
}

export function mapOpenAIError(error: any): AppError {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return createError.openai('Invalid request parameters', error);
      case 401:
        return createError.openai('Invalid API key', error);
      case 403:
        return createError.openai('API access forbidden', error);
      case 404:
        return createError.openai('API endpoint not found', error);
      case 429:
        return createError.openai('API rate limit exceeded', error);
      case 500:
        return createError.openai('OpenAI server error', error);
      case 502:
        return createError.openai('OpenAI service unavailable', error);
      case 503:
        return createError.openai('OpenAI service temporarily unavailable', error);
      default:
        return createError.openai(`HTTP ${status}: ${data?.error?.message || 'Unknown error'}`, error);
    }
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return createError.openai('Unable to connect to OpenAI API', error);
  }
  
  if (error.code === 'ETIMEDOUT') {
    return createError.timeout('OpenAI API request timeout');
  }
  
  return createError.openai(error.message || 'Unknown OpenAI error', error);
}

export function mapGeocodingError(error: any): AppError {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return createError.geocoding('Invalid location parameters', error);
      case 401:
        return createError.geocoding('Invalid API key', error);
      case 403:
        return createError.geocoding('API access forbidden', error);
      case 404:
        return createError.geocoding('Location not found', error);
      case 429:
        return createError.geocoding('API rate limit exceeded', error);
      case 500:
        return createError.geocoding('Geocoding service error', error);
      default:
        return createError.geocoding(`HTTP ${status}: ${data?.error?.message || 'Unknown error'}`, error);
    }
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return createError.geocoding('Unable to connect to geocoding service', error);
  }
  
  if (error.code === 'ETIMEDOUT') {
    return createError.timeout('Geocoding service request timeout');
  }
  
  return createError.geocoding(error.message || 'Unknown geocoding error', error);
}

export function mapZodError(error: ZodError): AppError {
  const issues = error.issues.map(issue => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  }).join(', ');
  
  return createError.validation(`Validation failed: ${issues}`);
}

// Error response helper
export function createErrorResponse(error: AppError, includeStack?: boolean): NextResponse {
  const response: any = {
    success: false,
    error: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
  };
  
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.cause = error.cause?.message;
  }
  
  return new NextResponse(
    JSON.stringify(response),
    {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Error handler wrapper
export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error instanceof ZodError) {
        throw mapZodError(error);
      }
      
      // Map unknown errors
      if (error instanceof Error) {
        throw createError.internal('Unexpected error occurred', error);
      }
      
      throw createError.internal('Unknown error occurred');
    }
  };
}

// Retry helper with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Error logging helper
export function logError(error: AppError, context?: any): void {
  const logData = {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    isOperational: error.isOperational,
    stack: error.stack,
    cause: error.cause?.message,
    context,
    timestamp: new Date().toISOString(),
  };
  
  if (error.statusCode >= 500) {
    console.error('Server Error:', logData);
  } else {
    console.warn('Client Error:', logData);
  }
}

export default AppError;




