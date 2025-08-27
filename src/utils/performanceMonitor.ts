/**
 * Performance monitoring system for tracking app performance at scale
 * Essential for managing 5,000+ users
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UserSessionMetrics {
  sessionId: string;
  userId?: string;
  startTime: number;
  pageViews: number;
  errors: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  features: string[];
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private sessionMetrics: UserSessionMetrics;
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.sessionMetrics = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      pageViews: 0,
      errors: 0,
      connectionQuality: 'good',
      features: []
    };

    this.initializeMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring(): void {
    // Monitor Core Web Vitals
    this.monitorWebVitals();
    
    // Monitor resource loading
    this.monitorResourceTiming();
    
    // Monitor errors
    this.monitorErrors();
    
    // Monitor network quality
    this.monitorNetworkQuality();
    
    // Monitor user interactions
    this.monitorUserInteractions();
  }

  private monitorWebVitals(): void {
    // First Contentful Paint
    this.measureFCP();
    
    // Largest Contentful Paint
    this.measureLCP();
    
    // Cumulative Layout Shift
    this.measureCLS();
    
    // First Input Delay
    this.measureFID();
  }

  private measureFCP(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('first_contentful_paint', entry.startTime);
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });
  }

  private measureLCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('largest_contentful_paint', lastEntry.startTime);
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private measureCLS(): void {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          this.recordMetric('cumulative_layout_shift', clsValue);
        }
      }
    });
    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private measureFID(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('first_input_delay', (entry as any).processingStart - entry.startTime);
      }
    });
    observer.observe({ entryTypes: ['first-input'] });
  }

  private monitorResourceTiming(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Monitor slow resources (>1s)
        if (resourceEntry.duration > 1000) {
          this.recordMetric('slow_resource', resourceEntry.duration, {
            name: resourceEntry.name,
            type: resourceEntry.initiatorType,
            size: resourceEntry.transferSize
          });
        }

        // Monitor failed resources
        if (resourceEntry.transferSize === 0 && resourceEntry.duration > 0) {
          this.recordMetric('failed_resource', 1, {
            name: resourceEntry.name,
            type: resourceEntry.initiatorType
          });
        }
      }
    });
    observer.observe({ entryTypes: ['resource'] });
  }

  private monitorErrors(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('unhandled_promise_rejection', {
        reason: event.reason?.toString()
      });
    });
  }

  private monitorNetworkQuality(): void {
    // Monitor connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric('network_type', 0, {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });

      connection.addEventListener('change', () => {
        this.recordMetric('network_change', Date.now(), {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }
  }

  private monitorUserInteractions(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.recordMetric('page_visibility', document.hidden ? 0 : 1);
    });

    // Track user engagement
    let lastActivity = Date.now();
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        const now = Date.now();
        if (now - lastActivity > 30000) { // 30 seconds of inactivity
          this.recordMetric('user_reengagement', now - lastActivity);
        }
        lastActivity = now;
      }, { passive: true });
    });
  }

  // Public methods for recording custom metrics
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Send critical metrics immediately
    if (this.isCriticalMetric(name, value)) {
      this.sendMetricsToServer([metric]);
    }
  }

  recordError(type: string, details: Record<string, any>): void {
    this.sessionMetrics.errors++;
    this.recordMetric('error', 1, { type, ...details });
  }

  recordFeatureUsage(feature: string): void {
    if (!this.sessionMetrics.features.includes(feature)) {
      this.sessionMetrics.features.push(feature);
    }
    this.recordMetric('feature_usage', 1, { feature });
  }

  recordPageView(path: string): void {
    this.sessionMetrics.pageViews++;
    this.recordMetric('page_view', 1, { path });
  }

  recordVideoCallMetrics(metrics: {
    duration: number;
    quality: string;
    connectionIssues: number;
  }): void {
    this.recordMetric('video_call_duration', metrics.duration);
    this.recordMetric('video_call_quality', 1, { quality: metrics.quality });
    this.recordMetric('video_call_issues', metrics.connectionIssues);
  }

  private isCriticalMetric(name: string, value: number): boolean {
    const criticalThresholds = {
      'largest_contentful_paint': 4000, // 4 seconds
      'first_contentful_paint': 3000,   // 3 seconds
      'cumulative_layout_shift': 0.25,  // Poor CLS
      'error': 1,                       // Any error
      'failed_resource': 1              // Any failed resource
    };

    return name in criticalThresholds && value >= criticalThresholds[name as keyof typeof criticalThresholds];
  }

  // Send metrics to analytics service
  private async sendMetricsToServer(metrics: PerformanceMetric[]): Promise<void> {
    try {
      // Replace with your analytics endpoint
      const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
      
      if (!analyticsEndpoint) {
        console.log('📊 Performance metrics:', metrics);
        return;
      }

      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionMetrics.sessionId,
          metrics,
          sessionInfo: this.sessionMetrics
        }),
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }

  // Flush all metrics (call before page unload)
  flush(): void {
    if (this.metrics.length > 0) {
      this.sendMetricsToServer(this.metrics);
      this.metrics = [];
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    coreWebVitals: Record<string, number>;
    sessionMetrics: UserSessionMetrics;
    recentMetrics: PerformanceMetric[];
  } {
    const coreWebVitals = {
      fcp: this.getLatestMetric('first_contentful_paint'),
      lcp: this.getLatestMetric('largest_contentful_paint'),
      cls: this.getLatestMetric('cumulative_layout_shift'),
      fid: this.getLatestMetric('first_input_delay')
    };

    return {
      coreWebVitals,
      sessionMetrics: this.sessionMetrics,
      recentMetrics: this.metrics.slice(-10)
    };
  }

  private getLatestMetric(name: string): number {
    const metric = this.metrics
      .filter(m => m.name === name)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    return metric?.value || 0;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  return {
    recordMetric: (name: string, value: number, metadata?: Record<string, any>) => 
      performanceMonitor.recordMetric(name, value, metadata),
    recordError: (type: string, details: Record<string, any>) => 
      performanceMonitor.recordError(type, details),
    recordFeatureUsage: (feature: string) => 
      performanceMonitor.recordFeatureUsage(feature),
    recordPageView: (path: string) => 
      performanceMonitor.recordPageView(path),
    getPerformanceSummary: () => 
      performanceMonitor.getPerformanceSummary()
  };
};

// Initialize monitoring on page load
if (typeof window !== 'undefined') {
  // Flush metrics before page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.flush();
  });

  // Send metrics periodically (every 30 seconds)
  setInterval(() => {
    performanceMonitor.flush();
  }, 30000);
}