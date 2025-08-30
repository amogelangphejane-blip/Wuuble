import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class MessagingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Messaging Error Boundary caught an error:', error, errorInfo);
    
    // Check if this is a non-critical error that shouldn't break the UI
    const isNonCriticalError = this.isNonCriticalError(error);
    
    if (isNonCriticalError) {
      console.warn('Non-critical messaging error caught, not showing error boundary:', error.message);
      // Reset the error boundary to allow continued operation
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
      return;
    }
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack,
    });

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  private isNonCriticalError(error: Error): boolean {
    const nonCriticalPatterns = [
      'Failed to mark messages as read',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'AbortError',
      'The user aborted a request',
      'Connection was aborted',
      'signal is aborted without reason'
    ];
    
    return nonCriticalPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-lg border p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Messaging Error
            </h1>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Something went wrong with the messaging feature. This could be due to a 
              network issue, authentication problem, or temporary service disruption.
            </p>

            <div className="space-y-3 mb-6">
              <Button 
                onClick={this.handleRetry}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-muted/50 rounded-lg p-4 mt-4">
                <summary className="cursor-pointer font-medium text-sm mb-2">
                  Error Details (Development)
                </summary>
                <div className="text-xs font-mono space-y-2">
                  <div>
                    <strong>Error:</strong>
                    <pre className="whitespace-pre-wrap text-destructive">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {this.state.errorInfo}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t">
              <MessageCircle className="w-3 h-3" />
              <span>Messaging System v1.0</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle messaging errors
export const useMessagingErrorHandler = () => {
  const handleError = (error: Error, context: string) => {
    console.error(`Messaging Error in ${context}:`, error);
    
    // In a real app, you might want to:
    // - Show a toast notification
    // - Log to monitoring service
    // - Trigger error recovery
    
    return {
      message: getErrorMessage(error),
      canRetry: isRetryableError(error),
      shouldReload: isCriticalError(error),
    };
  };

  return { handleError };
};

// Helper functions for error classification
export const getErrorMessage = (error: Error): string => {
  if (error.message.includes('Failed to fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  
  if (error.message.includes('User not authenticated')) {
    return 'Please sign in to access messaging features.';
  }
  
  if (error.message.includes('Row Level Security')) {
    return 'Permission denied. You may not have access to this conversation.';
  }
  
  if (error.message.includes('violates foreign key constraint')) {
    return 'Invalid conversation or user reference.';
  }
  
  if (error.message.includes('duplicate key value')) {
    return 'This conversation already exists.';
  }
  
  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const isRetryableError = (error: Error): boolean => {
  const retryableErrors = [
    'Failed to fetch',
    'timeout',
    'Network request failed',
    'Connection refused',
  ];
  
  return retryableErrors.some(msg => error.message.includes(msg));
};

export const isCriticalError = (error: Error): boolean => {
  const criticalErrors = [
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',
  ];
  
  return criticalErrors.some(msg => error.message.includes(msg));
};