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
  console.error('Error constructor:', error?.constructor?.name);
  
  // Handle null or undefined
  if (error === null || error === undefined) {
    console.error('Error is null or undefined');
    return fallbackMessage;
  }
  
  // Handle Error instances
  if (error instanceof Error) {
    const message = error.message;
    console.log('Error instance message:', message);
    return message || fallbackMessage;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    const trimmed = error.trim();
    console.log('String error:', trimmed);
    return trimmed || fallbackMessage;
  }
  
  // Handle object errors (like Supabase errors)
  if (error && typeof error === 'object') {
    const errorObj = error as ErrorObject;
    console.log('Object error properties:', Object.keys(errorObj));
    
    // Try different error message properties in order of preference
    const candidates = [
      errorObj.message,
      errorObj.error_description,
      errorObj.details,
      errorObj.hint
    ];
    
    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string' && candidate.trim()) {
        console.log('Found error message:', candidate);
        return candidate.trim();
      }
    }
    
    // Try code-based message
    if (errorObj.code) {
      const codeMessage = `Database error (code: ${errorObj.code})`;
      console.log('Using code-based message:', codeMessage);
      return codeMessage;
    }
    
    // Try to stringify the error object if it has useful information
    try {
      const stringified = JSON.stringify(errorObj);
      console.error('Error object stringified:', stringified);
      if (stringified && stringified !== '{}' && stringified !== 'null') {
        // If the stringified object has useful info, use a generic message
        // but log the details for debugging
        return `An error occurred. Check the console for details.`;
      }
    } catch (stringifyError) {
      console.error('Failed to stringify error:', stringifyError);
    }
  }
  
  console.error('No error message found, using fallback:', fallbackMessage);
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