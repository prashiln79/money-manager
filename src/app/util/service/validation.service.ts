import { Injectable } from '@angular/core';
import { IValidationService } from './interfaces';
import { APP_CONFIG, ERROR_MESSAGES } from '../models/config';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Password validation result interface
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  score: number; // 0-100
  suggestions: string[];
}

/**
 * Validation service providing comprehensive validation logic
 */
@Injectable({
  providedIn: 'root'
})
export class ValidationService implements IValidationService {
  
  /**
   * Validate email address
   */
  validateEmail(email: string): boolean {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate password with comprehensive checks
   */
  validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < APP_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${APP_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters long`);
    } else {
      score += 20;
    }

    // Check maximum length
    if (password.length > APP_CONFIG.VALIDATION.MAX_PASSWORD_LENGTH) {
      errors.push(`Password must be no more than ${APP_CONFIG.VALIDATION.MAX_PASSWORD_LENGTH} characters long`);
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
      suggestions.push('Add uppercase letters to increase security');
    } else {
      score += 20;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
      suggestions.push('Add lowercase letters to increase security');
    } else {
      score += 20;
    }

    // Check for numbers
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
      suggestions.push('Add numbers to increase security');
    } else {
      score += 20;
    }

    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
      suggestions.push('Add special characters to increase security');
    } else {
      score += 20;
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' | 'very_strong';
    if (score < 40) strength = 'weak';
    else if (score < 60) strength = 'medium';
    else if (score < 80) strength = 'strong';
    else strength = 'very_strong';

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score,
      suggestions
    };
  }

  /**
   * Validate amount (currency)
   */
  validateAmount(amount: number): boolean {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return false;
    }
    
    return amount >= APP_CONFIG.VALIDATION.MIN_AMOUNT && 
           amount <= APP_CONFIG.VALIDATION.MAX_AMOUNT;
  }

  /**
   * Validate date
   */
  validateDate(date: Date): boolean {
    if (!date || !(date instanceof Date)) {
      return false;
    }
    
    return !isNaN(date.getTime());
  }

  /**
   * Validate required field
   */
  validateRequired(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    
    return true;
  }

  /**
   * Validate string length
   */
  validateLength(value: string, min: number, max: number): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    
    const length = value.trim().length;
    return length >= min && length <= max;
  }

  /**
   * Validate name (first name, last name, etc.)
   */
  validateName(name: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.validateRequired(name)) {
      errors.push(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD);
      return { isValid: false, errors, warnings };
    }

    if (!this.validateLength(name, APP_CONFIG.VALIDATION.MIN_NAME_LENGTH, APP_CONFIG.VALIDATION.MAX_NAME_LENGTH)) {
      errors.push(`Name must be between ${APP_CONFIG.VALIDATION.MIN_NAME_LENGTH} and ${APP_CONFIG.VALIDATION.MAX_NAME_LENGTH} characters`);
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) {
      errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
    }

    // Check for consecutive spaces
    if (/\s{2,}/.test(name)) {
      warnings.push('Name contains multiple consecutive spaces');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.validateRequired(phone)) {
      errors.push(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD);
      return { isValid: false, errors, warnings };
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      errors.push('Phone number must have at least 10 digits');
    }

    if (digitsOnly.length > 15) {
      errors.push('Phone number cannot exceed 15 digits');
    }

    // Check for valid phone number patterns
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(digitsOnly)) {
      errors.push('Invalid phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate account number
   */
  validateAccountNumber(accountNumber: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.validateRequired(accountNumber)) {
      errors.push(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD);
      return { isValid: false, errors, warnings };
    }

    // Remove spaces and dashes
    const cleanNumber = accountNumber.replace(/[\s\-]/g, '');
    
    if (cleanNumber.length < 8) {
      errors.push('Account number must be at least 8 digits');
    }

    if (cleanNumber.length > 20) {
      errors.push('Account number cannot exceed 20 digits');
    }

    // Check for valid characters (digits only)
    if (!/^\d+$/.test(cleanNumber)) {
      errors.push('Account number can only contain digits');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate currency code
   */
  validateCurrencyCode(currencyCode: string): boolean {
    if (!currencyCode || typeof currencyCode !== 'string') {
      return false;
    }
    
    const validCodes = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'];
    return validCodes.includes(currencyCode.toUpperCase());
  }

  /**
   * Validate date range
   */
  validateDateRange(startDate: Date, endDate: Date): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.validateDate(startDate)) {
      errors.push('Invalid start date');
    }

    if (!this.validateDate(endDate)) {
      errors.push('Invalid end date');
    }

    if (this.validateDate(startDate) && this.validateDate(endDate)) {
      if (startDate > endDate) {
        errors.push('Start date cannot be after end date');
      }

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        warnings.push('Date range exceeds one year');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate percentage
   */
  validatePercentage(percentage: number): boolean {
    if (typeof percentage !== 'number' || isNaN(percentage)) {
      return false;
    }
    
    return percentage >= 0 && percentage <= 100;
  }

  /**
   * Validate URL
   */
  validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate credit card number (basic Luhn algorithm)
   */
  validateCreditCardNumber(cardNumber: string): boolean {
    if (!cardNumber || typeof cardNumber !== 'string') {
      return false;
    }
    
    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/[\s\-]/g, '');
    
    // Check if it's all digits and has reasonable length
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      return false;
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Validate transaction data
   */
  validateTransactionData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    const requiredFields = ['payee', 'amount', 'type', 'date', 'accountId', 'categoryId'];
    for (const field of requiredFields) {
      if (!this.validateRequired(data[field])) {
        errors.push(`${field} is required`);
      }
    }

    // Validate amount
    if (data.amount && !this.validateAmount(data.amount)) {
      errors.push(ERROR_MESSAGES.VALIDATION.INVALID_AMOUNT);
    }

    // Validate date
    if (data.date && !this.validateDate(data.date)) {
      errors.push(ERROR_MESSAGES.VALIDATION.INVALID_DATE);
    }

    // Validate payee length
    if (data.payee && !this.validateLength(data.payee, 1, 100)) {
      errors.push('Payee name must be between 1 and 100 characters');
    }

    // Validate notes length
    if (data.notes && !this.validateLength(data.notes, 0, 500)) {
      warnings.push('Notes should not exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize input string
   */
  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Format validation error message
   */
  formatValidationError(field: string, error: string): string {
    return `${field}: ${error}`;
  }

  /**
   * Get validation summary
   */
  getValidationSummary(results: ValidationResult[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let isValid = true;

    for (const result of results) {
      if (!result.isValid) {
        isValid = false;
      }
      allErrors.push(...result.errors);
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings
    };
  }
} 