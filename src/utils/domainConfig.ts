/**
 * Domain Configuration Utility
 * Handles dynamic domain configuration for different deployment environments
 */

export interface DomainConfig {
  appUrl: string;
  frontendUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  domain: string;
}

/**
 * Get the current domain configuration
 */
export const getDomainConfig = (): DomainConfig => {
  // Get environment variables with fallbacks
  const appUrl = import.meta.env.VITE_APP_URL || import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || import.meta.env.VITE_APP_URL || window.location.origin;
  
  // Determine environment
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;
  
  // Extract domain from URL
  const domain = new URL(appUrl).hostname;
  
  return {
    appUrl,
    frontendUrl,
    isProduction,
    isDevelopment,
    domain,
  };
};

/**
 * Get the base API URL for the current environment
 */
export const getApiBaseUrl = (): string => {
  const config = getDomainConfig();
  
  // In development, use the dev server
  if (config.isDevelopment) {
    return 'http://localhost:8080';
  }
  
  // In production, use the configured domain
  return config.appUrl;
};

/**
 * Get the WebSocket/SignalingServer URL
 */
export const getSignalingServerUrl = (): string => {
  // Use environment variable if set
  if (import.meta.env.VITE_SIGNALING_SERVER_URL) {
    return import.meta.env.VITE_SIGNALING_SERVER_URL;
  }
  
  const config = getDomainConfig();
  
  // In development, use localhost
  if (config.isDevelopment) {
    return 'ws://localhost:3001';
  }
  
  // In production, construct WebSocket URL from domain
  // This assumes your signaling server is deployed with a predictable URL pattern
  const protocol = config.appUrl.startsWith('https') ? 'wss' : 'ws';
  return `${protocol}://signaling.${config.domain}`;
};

/**
 * Get Stripe webhook URL for the current domain
 */
export const getStripeWebhookUrl = (): string => {
  const config = getDomainConfig();
  return `${config.appUrl}/api/webhooks/stripe`;
};

/**
 * Get OAuth redirect URLs for the current domain
 */
export const getOAuthRedirectUrls = () => {
  const config = getDomainConfig();
  
  return {
    siteUrl: config.appUrl,
    redirectUrls: [
      `${config.appUrl}/auth/callback`,
      `${config.appUrl}/auth/confirm`,
      `${config.appUrl}/login`,
      // Include www variant if not already included
      ...(config.domain.startsWith('www.') 
        ? [`https://${config.domain.substring(4)}/auth/callback`]
        : [`https://www.${config.domain}/auth/callback`]
      ),
    ],
  };
};

/**
 * Validate domain configuration
 */
export const validateDomainConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = getDomainConfig();
  
  // Check if URLs are valid
  try {
    new URL(config.appUrl);
  } catch {
    errors.push('VITE_APP_URL is not a valid URL');
  }
  
  try {
    new URL(config.frontendUrl);
  } catch {
    errors.push('VITE_FRONTEND_URL is not a valid URL');
  }
  
  // Check if HTTPS is used in production
  if (config.isProduction && !config.appUrl.startsWith('https://')) {
    errors.push('Production apps should use HTTPS');
  }
  
  // Check if required environment variables are set
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Log domain configuration (useful for debugging)
 */
export const logDomainConfig = (): void => {
  const config = getDomainConfig();
  const validation = validateDomainConfig();
  
  console.group('🌐 Domain Configuration');
  console.log('App URL:', config.appUrl);
  console.log('Frontend URL:', config.frontendUrl);
  console.log('Domain:', config.domain);
  console.log('Environment:', config.isProduction ? 'Production' : 'Development');
  console.log('Signaling Server:', getSignalingServerUrl());
  console.log('Valid Configuration:', validation.isValid);
  
  if (!validation.isValid) {
    console.warn('Configuration Errors:', validation.errors);
  }
  
  console.groupEnd();
};

// Export as default for easy importing
export default {
  getDomainConfig,
  getApiBaseUrl,
  getSignalingServerUrl,
  getStripeWebhookUrl,
  getOAuthRedirectUrls,
  validateDomainConfig,
  logDomainConfig,
};