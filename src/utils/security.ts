/**
 * Security and validation utilities
 * Provides input sanitization and validation functions
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - The user input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Repeatedly remove multi-character patterns to prevent incomplete sanitization
  let sanitized = input;
  let previous;
  do {
    previous = sanitized;
    sanitized = sanitized
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '');    // Remove event handlers
  } while (sanitized !== previous);

  // Remove angle brackets to prevent basic XSS and trim whitespace
  return sanitized
    .replace(/[<>]/g, '')
    .trim();
};

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns Boolean indicating if email is valid
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Saudi phone number format
 * @param phone - Phone number string to validate
 * @returns Boolean indicating if phone number is valid
 */
export const validateSaudiPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+966|966|0)?[5][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param date - Date string to validate
 * @returns Boolean indicating if date is valid
 */
export const validateDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

/**
 * Validate positive number
 * @param value - Value to validate
 * @returns Boolean indicating if value is a positive number
 */
export const validatePositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

/**
 * Validate required field
 * @param value - Value to validate
 * @returns Boolean indicating if field has a value
 */
export const validateRequired = (value: string): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validate contract number format
 * @param contractNumber - Contract number to validate
 * @returns Boolean indicating if contract number is valid
 */
export const validateContractNumber = (contractNumber: string): boolean => {
  // Contract number should be alphanumeric and 3-20 characters
  const contractRegex = /^[A-Za-z0-9-]{3,20}$/;
  return contractRegex.test(contractNumber);
};

/**
 * Escape HTML characters to prevent injection
 * @param text - Text to escape
 * @returns Escaped text
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Validate API key format (basic check)
 * @param apiKey - API key to validate
 * @returns Boolean indicating if API key format is valid
 */
export const validateApiKey = (apiKey: string): boolean => {
  // Basic validation: should be at least 20 characters and alphanumeric
  return typeof apiKey === 'string' && apiKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
};

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   * @param key - Unique identifier for the client
   * @returns Boolean indicating if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  /**
   * Get remaining requests for a key
   * @param key - Unique identifier for the client
   * @returns Number of remaining requests
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);

    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

/**
 * Secure local storage wrapper
 */
export class SecureStorage {
  private prefix: string;

  constructor(prefix: string = 'shaheen_') {
    this.prefix = prefix;
  }

  /**
   * Securely store data in localStorage
   * @param key - Storage key
   * @param data - Data to store
   */
  setItem(key: string, data: any): void {
    try {
      const prefixedKey = this.prefix + key;
      const serializedData = JSON.stringify(data);
      localStorage.setItem(prefixedKey, serializedData);
    } catch (error) {
      console.warn('Failed to store data:', error);
    }
  }

  /**
   * Securely retrieve data from localStorage
   * @param key - Storage key
   * @returns Retrieved data or null
   */
  getItem<T>(key: string): T | null {
    try {
      const prefixedKey = this.prefix + key;
      const serializedData = localStorage.getItem(prefixedKey);

      if (serializedData === null) {
        return null;
      }

      return JSON.parse(serializedData) as T;
    } catch (error) {
      console.warn('Failed to retrieve data:', error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   * @param key - Storage key
   */
  removeItem(key: string): void {
    try {
      const prefixedKey = this.prefix + key;
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.warn('Failed to remove data:', error);
    }
  }

  /**
   * Clear all items with the prefix
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }
}
