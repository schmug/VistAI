/**
 * Enhanced error handling utilities for VistAI
 */

export interface AppError {
  type: 'network' | 'api' | 'auth' | 'validation' | 'unknown';
  message: string;
  details?: string;
  retryable: boolean;
  statusCode?: number;
}

export class VistAIError extends Error {
  public readonly type: AppError['type'];
  public readonly retryable: boolean;
  public readonly statusCode?: number;
  public readonly details?: string;

  constructor(error: AppError) {
    super(error.message);
    this.name = 'VistAIError';
    this.type = error.type;
    this.retryable = error.retryable;
    this.statusCode = error.statusCode;
    this.details = error.details;
  }
}

/**
 * Parse different types of errors into standardized AppError format
 */
export function parseError(error: unknown): AppError {
  // Network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Connection failed. Please check your internet connection.',
      details: error.message,
      retryable: true,
    };
  }

  // HTTP errors with status codes
  if (error instanceof Error && error.message.includes(':')) {
    const match = error.message.match(/^(\d+):\s*(.+)$/);
    if (match) {
      const statusCode = parseInt(match[1]);
      const message = match[2];

      if (statusCode === 401) {
        return {
          type: 'auth',
          message: 'Authentication failed. Please log in again.',
          details: message,
          retryable: false,
          statusCode,
        };
      }

      if (statusCode === 403) {
        return {
          type: 'auth',
          message: 'Access denied. Please check your API key or permissions.',
          details: message,
          retryable: false,
          statusCode,
        };
      }

      if (statusCode === 429) {
        return {
          type: 'api',
          message: 'Rate limit exceeded. Please wait a moment and try again.',
          details: message,
          retryable: true,
          statusCode,
        };
      }

      if (statusCode >= 500) {
        return {
          type: 'api',
          message: 'Server error. Please try again in a moment.',
          details: message,
          retryable: true,
          statusCode,
        };
      }

      if (statusCode >= 400) {
        return {
          type: 'validation',
          message: message || 'Invalid request. Please check your input.',
          details: message,
          retryable: false,
          statusCode,
        };
      }
    }
  }

  // OpenRouter API specific errors
  if (error instanceof Error) {
    if (error.message.includes('OPENROUTER_API_KEY')) {
      return {
        type: 'api',
        message: 'API key not configured. Please add your OpenRouter API key in Settings.',
        details: error.message,
        retryable: false,
      };
    }

    if (error.message.includes('quota') || error.message.includes('credit')) {
      return {
        type: 'api',
        message: 'API quota exceeded. Please check your OpenRouter account or try with a different API key.',
        details: error.message,
        retryable: false,
      };
    }

    if (error.message.includes('model') && error.message.includes('not found')) {
      return {
        type: 'api',
        message: 'AI model temporarily unavailable. Trying alternative models...',
        details: error.message,
        retryable: true,
      };
    }
  }

  // Generic error fallback
  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    details: error instanceof Error ? error.stack : String(error),
    retryable: true,
  };
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: AppError) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => error.retryable,
  } = options;

  let lastError: AppError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = parseError(error);

      // Don't retry on last attempt or if error is not retryable
      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw new VistAIError(lastError);
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new VistAIError(lastError!);
}

/**
 * User-friendly error messages for common scenarios
 */
export function getErrorMessage(error: AppError): string {
  switch (error.type) {
    case 'network':
      return 'Unable to connect. Please check your internet connection and try again.';
    
    case 'auth':
      return error.statusCode === 401 
        ? 'Please log in to continue.' 
        : 'Access denied. Please check your permissions.';
    
    case 'api':
      if (error.message.includes('API key')) {
        return 'Please add your OpenRouter API key in Settings to use VistAI.';
      }
      if (error.statusCode === 429) {
        return 'Too many requests. Please wait a moment before searching again.';
      }
      return 'Service temporarily unavailable. Please try again in a moment.';
    
    case 'validation':
      return 'Please check your input and try again.';
    
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Check if an error indicates the user needs to configure their API key
 */
export function needsApiKey(error: AppError): boolean {
  return error.type === 'api' && (
    error.message.includes('API key') ||
    error.message.includes('OPENROUTER_API_KEY') ||
    error.statusCode === 401
  );
}