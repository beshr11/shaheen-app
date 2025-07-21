/**
 * API utilities for handling external service calls
 * Provides robust error handling and retry logic
 */

import { GeminiResponse, APIError } from '../types';
import { RateLimiter, validateApiKey } from './security';

// Rate limiter for API calls (10 requests per minute)
const apiRateLimiter = new RateLimiter(10, 60000);

/**
 * Custom error class for API errors
 */
export class APICallError extends Error {
  public statusCode?: number;
  public originalError?: any;

  constructor(message: string, statusCode?: number, originalError?: any) {
    super(message);
    this.name = 'APICallError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Retry configuration interface
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Sleep utility for delays
 * @param ms - Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * @param attempt - Current attempt number (0-based)
 * @param config - Retry configuration
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelay);
};

/**
 * Check if error is retryable
 * @param error - Error to check
 */
const isRetryableError = (error: any): boolean => {
  // Retry on network errors, server errors (5xx), and rate limiting (429)
  if (error instanceof APICallError) {
    const statusCode = error.statusCode;
    return !statusCode || statusCode >= 500 || statusCode === 429;
  }

  // Retry on network errors
  return (
    error.name === 'NetworkError' ||
    error.message?.includes('network') ||
    error.message?.includes('timeout')
  );
};

/**
 * Make API call with retry logic
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @param retryConfig - Retry configuration
 */
export const makeApiCall = async <T>(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: any;

  // Check rate limiting
  const clientId = 'api_client'; // In real app, this could be user-specific
  if (!apiRateLimiter.isAllowed(clientId)) {
    throw new APICallError('Rate limit exceeded. Please wait before making more requests.', 429);
  }

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          // Use the default error message if JSON parsing fails
        }

        throw new APICallError(errorMessage, response.status);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      lastError = error;

      // Don't retry on non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Gemini API specific call
 * @param prompt - The prompt to send to Gemini
 * @param apiKey - Gemini API key
 */
export const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
  // Validate API key
  if (!validateApiKey(apiKey)) {
    throw new APICallError('Invalid API key format');
  }

  // Validate prompt
  if (!prompt || prompt.trim().length === 0) {
    throw new APICallError('Prompt cannot be empty');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt.trim(),
          },
        ],
      },
    ],
  };

  try {
    const response = await makeApiCall<GeminiResponse>(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Validate response structure
    if (!response.candidates || response.candidates.length === 0) {
      throw new APICallError('Invalid response from Gemini API');
    }

    const content = response.candidates[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new APICallError('No content returned from Gemini API');
    }

    return content;
  } catch (error) {
    if (error instanceof APICallError) {
      throw error;
    }

    throw new APICallError('Failed to generate document content', undefined, error);
  }
};

/**
 * Health check utility
 * @param url - URL to check
 * @param timeout - Timeout in milliseconds
 */
export const healthCheck = async (url: string, timeout: number = 5000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Get API status information
 */
export const getAPIStatus = () => {
  const clientId = 'api_client';
  return {
    remainingRequests: apiRateLimiter.getRemainingRequests(clientId),
    maxRequests: 10,
    windowMs: 60000,
  };
};

/**
 * Validate environment configuration
 */
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for required environment variables
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    errors.push('REACT_APP_GEMINI_API_KEY is not set');
  } else if (!validateApiKey(apiKey)) {
    errors.push('REACT_APP_GEMINI_API_KEY has invalid format');
  }

  // Check if running in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Application is running in development mode');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
