/**
 * Utility functions for handling and extracting error messages
 */

export interface ErrorObject {
  message?: string;
  error_description?: string;
  details?: string;
  hint?: string;
  code?: string;
  [key: string]: any;
}

/**
 * Extracts a meaningful error message from various error types
 * @param error - The error object, string, or Error instance
 * @param fallbackMessage - Default message if no error message can be extracted
 * @returns A human-readable error message
 */
export function extractErrorMessage(error: unknown, fallbackMessage = 'Unknown error occurred'): string {
  console.error('Extracting error message from:', error);
  console.error('Error type:', typeof error);
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    const errorObj = error as ErrorObject;
    
    // Try different error message properties in order of preference
    if (errorObj.message) {
      return errorObj.message;
    }
    
    if (errorObj.error_description) {
      return errorObj.error_description;
    }
    
    if (errorObj.details) {
      return errorObj.details;
    }
    
    if (errorObj.hint) {
      return errorObj.hint;
    }
    
    if (errorObj.code) {
      return `Database error (code: ${errorObj.code})`;
    }
    
    // Try to stringify the error object if it has useful information
    try {
      const stringified = JSON.stringify(errorObj);
      if (stringified && stringified !== '{}') {
        console.error('Error object stringified:', stringified);
      }
    } catch {
      // Ignore JSON.stringify errors
    }
  }
  
  return fallbackMessage;
}

/**
 * Converts technical error messages to user-friendly ones
 * @param errorMessage - The technical error message
 * @param context - Context about what operation failed
 * @returns A user-friendly error message
 */
export function makeErrorUserFriendly(errorMessage: string, context: 'create' | 'update' | 'subscribe' | 'cancel'): string {
  const lowerMessage = errorMessage.toLowerCase();
  
  // Row Level Security violations
  if (lowerMessage.includes('violates row-level security') || lowerMessage.includes('rls')) {
    switch (context) {
      case 'create':
      case 'update':
        return 'Access denied - only community creators can manage subscription plans';
      case 'subscribe':
        return 'Access denied - you cannot subscribe to this plan';
      case 'cancel':
        return 'Access denied - you cannot cancel this subscription';
      default:
        return 'Access denied - insufficient permissions';
    }
  }
  
  // Duplicate key violations
  if (lowerMessage.includes('duplicate key value') || lowerMessage.includes('unique constraint')) {
    switch (context) {
      case 'create':
      case 'update':
        return 'A subscription plan with this name already exists';
      case 'subscribe':
        return 'You already have a subscription to this community';
      default:
        return 'This item already exists';
    }
  }
  
  // Foreign key violations
  if (lowerMessage.includes('foreign key constraint') || lowerMessage.includes('violates foreign key')) {
    switch (context) {
      case 'create':
        return 'Invalid community - please refresh and try again';
      case 'update':
        return 'Invalid plan - please refresh and try again';
      case 'subscribe':
        return 'Invalid plan or community - please refresh and try again';
      case 'cancel':
        return 'Invalid subscription - please refresh and try again';
      default:
        return 'Invalid reference - please refresh and try again';
    }
  }
  
  // Check constraint violations
  if (lowerMessage.includes('check constraint') || lowerMessage.includes('violates check')) {
    return 'Invalid data provided - please check all required fields';
  }
  
  // Network/connection errors
  if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('timeout')) {
    return 'Connection error - please check your internet connection and try again';
  }
  
  // Authentication errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication')) {
    return 'Authentication error - please log in and try again';
  }
  
  // Rate limiting
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return 'Too many requests - please wait a moment and try again';
  }
  
  // Return the original message if no specific pattern matches
  return errorMessage;
}

/**
 * Complete error handling function that combines extraction and user-friendly conversion
 * @param error - The error object, string, or Error instance
 * @param context - Context about what operation failed
 * @param fallbackMessage - Default message if no error message can be extracted
 * @returns A user-friendly error message
 */
export function handleError(
  error: unknown, 
  context: 'create' | 'update' | 'subscribe' | 'cancel',
  fallbackMessage = 'Unknown error occurred'
): string {
  const rawMessage = extractErrorMessage(error, fallbackMessage);
  return makeErrorUserFriendly(rawMessage, context);
}