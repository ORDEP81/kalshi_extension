/**
 * Kalshi American Odds - Content Script
 * Injects American odds display and limit-order helper into Kalshi pages
 */

// Early page detection check to prevent extension from running on excluded pages
function shouldActivateExtensionEarly() {
  const pathname = window.location.pathname;
  
  // Don't activate on certain pages that don't have odds/trading
  const excludedPaths = [
    '/help',
    '/about',
    '/privacy',
    '/terms',
    '/support',
    '/blog',
    '/news',
    '/api',
    '/docs'
  ];
  
  // Check if current path starts with any excluded path
  for (const excludedPath of excludedPaths) {
    if (pathname.startsWith(excludedPath)) {
      console.log(`Kalshi American Odds: Extension disabled on excluded path: ${pathname}`);
      return false;
    }
  }
  
  // Only activate on kalshi.com domain (and localhost for development)
  const hostname = window.location.hostname;
  if (!hostname.includes('kalshi.com') && hostname !== 'localhost') {
    console.log(`Kalshi American Odds: Extension disabled on non-Kalshi domain: ${hostname}`);
    return false;
  }
  
  console.log(`Kalshi American Odds: Extension activated on: ${pathname}`);
  return true;
}

// Exit early if extension should not be active on this page
if (!shouldActivateExtensionEarly()) {
  console.log('Kalshi American Odds extension not loaded - page excluded');
  // Don't execute the rest of the script
} else {
  console.log('Kalshi American Odds extension loaded');

// ============================================================================
// CENTRALIZED LOGGING AND DEBUGGING SYSTEM
// ============================================================================

/**
 * Centralized logging system with configurable levels and structured output
 */
const KalshiLogger = {
  // Log levels (higher numbers = more verbose)
  levels: {
    ERROR: 0,    // Critical errors that break functionality
    WARN: 1,     // Warnings about potential issues
    INFO: 2,     // General information about operations
    DEBUG: 3,    // Detailed debugging information
    TRACE: 4     // Very detailed tracing information
  },
  
  // Current log level (can be changed based on environment)
  currentLevel: 2, // INFO level by default
  
  // Performance monitoring
  performanceMetrics: {
    totalOperations: 0,
    totalTime: 0,
    slowOperations: 0,
    errorCount: 0,
    warningCount: 0,
    operationHistory: []
  },
  
  // Error categorization
  errorCategories: {
    DOM_ACCESS: 'DOM_ACCESS',
    PARSING: 'PARSING',
    VALIDATION: 'VALIDATION',
    CALCULATION: 'CALCULATION',
    NETWORK: 'NETWORK',
    CONFIGURATION: 'CONFIGURATION',
    PERFORMANCE: 'PERFORMANCE',
    USER_INTERACTION: 'USER_INTERACTION'
  },
  
  // Severity levels for errors
  severityLevels: {
    CRITICAL: 'CRITICAL',    // Extension cannot function
    HIGH: 'HIGH',           // Major feature broken
    MEDIUM: 'MEDIUM',       // Minor feature issue
    LOW: 'LOW',            // Cosmetic or edge case
    INFO: 'INFO'           // Informational only
  },
  
  /**
   * Set the current logging level
   */
  setLevel(level) {
    if (typeof level === 'string') {
      level = this.levels[level.toUpperCase()];
    }
    if (typeof level === 'number' && level >= 0 && level <= 4) {
      this.currentLevel = level;
      this.info('Logger', `Log level set to ${level} (${Object.keys(this.levels)[level]})`);
    }
  },
  
  /**
   * Check if a log level should be output
   */
  shouldLog(level) {
    return level <= this.currentLevel;
  },
  
  /**
   * Create structured log entry with context
   */
  createLogEntry(level, category, message, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: Object.keys(this.levels)[level],
      category,
      message,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 100) + '...',
        extensionVersion: '1.0.0', // TODO: Get from manifest
        ...context
      },
      stackTrace: new Error().stack
    };
  },
  
  /**
   * Enhanced error logging with categorization and severity
   */
  error(category, message, context = {}, options = {}) {
    if (!this.shouldLog(this.levels.ERROR)) return;
    
    const {
      severity = this.severityLevels.MEDIUM,
      element = null,
      originalError = null,
      suggestedFix = null,
      userImpact = null
    } = options;
    
    const logEntry = this.createLogEntry(this.levels.ERROR, category, message, {
      severity,
      suggestedFix,
      userImpact,
      elementInfo: this.extractElementInfo(element),
      originalError: originalError ? {
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack
      } : null,
      ...context
    });
    
    console.error(`🚨 [${category}] ${message}`, logEntry);
    
    // Store error for diagnostics
    this.storeError(logEntry);
    this.performanceMetrics.errorCount++;
    
    // Report critical errors immediately
    if (severity === this.severityLevels.CRITICAL) {
      this.reportCriticalError(logEntry);
    }
  },
  
  /**
   * Warning logging with context
   */
  warn(category, message, context = {}, options = {}) {
    if (!this.shouldLog(this.levels.WARN)) return;
    
    const logEntry = this.createLogEntry(this.levels.WARN, category, message, {
      ...context,
      elementInfo: this.extractElementInfo(options.element),
      ...options
    });
    
    console.warn(`⚠️ [${category}] ${message}`, logEntry);
    this.performanceMetrics.warningCount++;
  },
  
  /**
   * Info logging for general operations
   */
  info(category, message, context = {}) {
    if (!this.shouldLog(this.levels.INFO)) return;
    
    const logEntry = this.createLogEntry(this.levels.INFO, category, message, context);
    console.log(`ℹ️ [${category}] ${message}`, logEntry);
  },
  
  /**
   * Debug logging for detailed information
   */
  debug(category, message, context = {}) {
    if (!this.shouldLog(this.levels.DEBUG)) return;
    
    const logEntry = this.createLogEntry(this.levels.DEBUG, category, message, context);
    console.log(`🔍 [${category}] ${message}`, logEntry);
  },
  
  /**
   * Trace logging for very detailed information
   */
  trace(category, message, context = {}) {
    if (!this.shouldLog(this.levels.TRACE)) return;
    
    const logEntry = this.createLogEntry(this.levels.TRACE, category, message, context);
    console.log(`🔬 [${category}] ${message}`, logEntry);
  },
  
  /**
   * Performance monitoring wrapper
   */
  measurePerformance(category, operation, fn, context = {}) {
    const startTime = performance.now();
    const operationId = `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.trace('PERFORMANCE', `Starting operation: ${operation}`, { 
      operationId, 
      category,
      ...context 
    });
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      this.recordPerformance(category, operation, duration, true, operationId, context);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordPerformance(category, operation, duration, false, operationId, context);
      this.error(category, `Operation failed: ${operation}`, context, {
        severity: this.severityLevels.HIGH,
        originalError: error,
        operationId
      });
      
      throw error;
    }
  },
  
  /**
   * Async performance monitoring wrapper
   */
  async measurePerformanceAsync(category, operation, fn, context = {}) {
    const startTime = performance.now();
    const operationId = `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.trace('PERFORMANCE', `Starting async operation: ${operation}`, { 
      operationId, 
      category,
      ...context 
    });
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordPerformance(category, operation, duration, true, operationId, context);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordPerformance(category, operation, duration, false, operationId, context);
      this.error(category, `Async operation failed: ${operation}`, context, {
        severity: this.severityLevels.HIGH,
        originalError: error,
        operationId
      });
      
      throw error;
    }
  },
  
  /**
   * Record performance metrics
   */
  recordPerformance(category, operation, duration, success, operationId, context = {}) {
    const metrics = this.performanceMetrics;
    metrics.totalOperations++;
    metrics.totalTime += duration;
    
    const performanceThresholds = {
      fast: 50,
      acceptable: 200,
      slow: 500,
      critical: 1000
    };
    
    let performanceLevel = 'fast';
    if (duration >= performanceThresholds.critical) {
      performanceLevel = 'critical';
      metrics.slowOperations++;
    } else if (duration >= performanceThresholds.slow) {
      performanceLevel = 'slow';
      metrics.slowOperations++;
    } else if (duration >= performanceThresholds.acceptable) {
      performanceLevel = 'acceptable';
    }
    
    const performanceEntry = {
      operationId,
      category,
      operation,
      duration: Math.round(duration * 100) / 100,
      success,
      performanceLevel,
      timestamp: Date.now(),
      context
    };
    
    // Store in operation history (keep last 50 operations)
    metrics.operationHistory.push(performanceEntry);
    if (metrics.operationHistory.length > 50) {
      metrics.operationHistory.shift();
    }
    
    // Log performance warnings
    if (performanceLevel === 'slow' || performanceLevel === 'critical') {
      this.warn('PERFORMANCE', `Slow operation detected: ${operation}`, {
        duration: performanceEntry.duration + 'ms',
        performanceLevel,
        operationId,
        suggestions: this.getPerformanceSuggestions(category, operation, duration)
      });
    }
    
    // Log successful fast operations at debug level
    if (success && performanceLevel === 'fast') {
      this.debug('PERFORMANCE', `Fast operation completed: ${operation}`, {
        duration: performanceEntry.duration + 'ms',
        operationId
      });
    }
  },
  
  /**
   * Get performance improvement suggestions
   */
  getPerformanceSuggestions(category, operation, duration) {
    const suggestions = [];
    
    if (category === 'PARSING') {
      suggestions.push('Consider optimizing DOM selectors');
      suggestions.push('Check if element is still connected to DOM');
      suggestions.push('Verify DOM is stable before parsing');
    }
    
    if (category === 'DOM_ACCESS') {
      suggestions.push('Cache DOM queries when possible');
      suggestions.push('Use more specific selectors');
      suggestions.push('Check if element exists before querying');
    }
    
    if (duration > 1000) {
      suggestions.push('Consider breaking operation into smaller chunks');
      suggestions.push('Add debouncing or throttling');
    }
    
    return suggestions;
  },
  
  /**
   * Extract safe element information for logging
   */
  extractElementInfo(element) {
    if (!element || typeof element !== 'object') return null;
    
    try {
      return {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        textContent: element.textContent?.substring(0, 100) + '...',
        childElementCount: element.childElementCount,
        isConnected: element.isConnected,
        hasParent: !!element.parentElement,
        boundingRect: element.getBoundingClientRect ? {
          width: Math.round(element.getBoundingClientRect().width),
          height: Math.round(element.getBoundingClientRect().height),
          visible: element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0
        } : null
      };
    } catch (error) {
      return { error: 'Failed to extract element info: ' + error.message };
    }
  },
  
  /**
   * Store error for diagnostics (keep last 20 errors)
   */
  storeError(logEntry) {
    if (!window.kalshiAOErrors) {
      window.kalshiAOErrors = [];
    }
    
    window.kalshiAOErrors.push(logEntry);
    if (window.kalshiAOErrors.length > 20) {
      window.kalshiAOErrors.shift();
    }
  },
  
  /**
   * Report critical errors for immediate attention
   */
  reportCriticalError(logEntry) {
    // Store critical error separately
    if (!window.kalshiAOCriticalErrors) {
      window.kalshiAOCriticalErrors = [];
    }
    
    window.kalshiAOCriticalErrors.push(logEntry);
    
    // Could potentially send to error reporting service here
    console.error('🚨 CRITICAL ERROR DETECTED - Extension functionality may be compromised', logEntry);
  },
  
  /**
   * Generate diagnostic report
   */
  generateDiagnosticReport() {
    const metrics = this.performanceMetrics;
    const averageTime = metrics.totalOperations > 0 ? metrics.totalTime / metrics.totalOperations : 0;
    
    return {
      timestamp: new Date().toISOString(),
      environment: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        extensionVersion: '1.0.0'
      },
      performance: {
        totalOperations: metrics.totalOperations,
        averageOperationTime: Math.round(averageTime * 100) / 100 + 'ms',
        slowOperations: metrics.slowOperations,
        slowOperationPercentage: metrics.totalOperations > 0 ? 
          Math.round((metrics.slowOperations / metrics.totalOperations) * 100) + '%' : '0%',
        recentOperations: metrics.operationHistory.slice(-10)
      },
      errors: {
        totalErrors: metrics.errorCount,
        totalWarnings: metrics.warningCount,
        recentErrors: window.kalshiAOErrors?.slice(-5) || [],
        criticalErrors: window.kalshiAOCriticalErrors?.length || 0
      },
      settings: settings,
      extensionState: {
        processedNodesCount: processedNodes ? 'WeakSet (cannot count)' : 0,
        observerActive: !!mutationObserver,
        ticketState: ticketState,
        helperPanelState: {
          isVisible: helperPanelState.isVisible,
          hasCurrentOdds: !!helperPanelState.currentOdds,
          hasCurrentSide: !!helperPanelState.currentSide
        }
      }
    };
  },
  
  /**
   * Export diagnostic data for support
   */
  exportDiagnostics() {
    const report = this.generateDiagnosticReport();
    const dataStr = JSON.stringify(report, null, 2);
    
    // Create downloadable file
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalshi-ao-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.info('DIAGNOSTICS', 'Diagnostic report exported', { 
      reportSize: dataStr.length,
      timestamp: report.timestamp 
    });
    
    return report;
  },
  
  /**
   * Clear diagnostic data
   */
  clearDiagnostics() {
    this.performanceMetrics = {
      totalOperations: 0,
      totalTime: 0,
      slowOperations: 0,
      errorCount: 0,
      warningCount: 0,
      operationHistory: []
    };
    
    window.kalshiAOErrors = [];
    window.kalshiAOCriticalErrors = [];
    
    this.info('DIAGNOSTICS', 'Diagnostic data cleared');
  }
};

// Set logging level based on environment
if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
  KalshiLogger.setLevel('DEBUG');
} else {
  KalshiLogger.setLevel('INFO');
}

// Expose logger globally for debugging
window.KalshiLogger = KalshiLogger;

// Extension state
let settings = {
  displayMode: 'rawAmerican', // percent | rawAmerican | afterFeeAmerican
  feeSource: 'ticketFirst', // always ticketFirst + optional fallbackEstimateEnabled
  fallbackEstimateEnabled: false,
  helperPanelEnabled: false // Default to false until settings are loaded
};

// Valid setting values for validation
const validSettingValues = {
  displayMode: ['percent', 'rawAmerican', 'afterFeeAmerican']
};

/**
 * Validate settings object with enhanced logging
 */
function validateSettings(settingsToValidate) {
  KalshiLogger.debug('CONFIGURATION', 'Validating settings', { settings: settingsToValidate });
  
  for (const [key, value] of Object.entries(settingsToValidate)) {
    if (key === 'fallbackEstimateEnabled' || key === 'helperPanelEnabled') {
      if (typeof value !== 'boolean') {
        KalshiLogger.warn('CONFIGURATION', `Invalid ${key} value: expected boolean`, {
          key,
          value,
          expectedType: 'boolean',
          actualType: typeof value
        });
        return false;
      }
    } else if (key === 'showSides' || key === 'rounding') {
      // Ignore legacy settings that are no longer used
      KalshiLogger.debug('CONFIGURATION', `Ignoring legacy setting: ${key}`);
      continue;
    } else if (validSettingValues[key] && !validSettingValues[key].includes(value)) {
      KalshiLogger.warn('CONFIGURATION', `Invalid ${key} value: not in allowed values`, {
        key,
        value,
        allowedValues: validSettingValues[key]
      });
      return false;
    }
  }
  
  KalshiLogger.debug('CONFIGURATION', 'Settings validation passed');
  return true;
}

// DOM processing state
let processedNodes = new WeakSet();
let mutationObserver = null;
let debounceTimer = null;
let observerStats = {
  mutationsProcessed: 0,
  lastProcessTime: 0,
  processingErrors: 0
};

// Order ticket state tracking
let ticketState = {
  isOpen: false,
  ticketElement: null,
  lastTicketHash: null,
  ticketObserver: null
};

// Helper panel state
let helperPanelState = {
  isVisible: false,
  panelElement: null,
  currentOdds: null,
  currentSide: null,
  suggestedPrice: null,
  afterFeeOdds: null,
  lastTicketData: null,
  recalculateTimer: null, // Timer for debouncing recalculations (Task 5.3.2)
  inputChangeTimer: null, // Timer for debouncing direct input changes (Task 5.3.2)
  // Task 5.3.3: Fee information availability tracking
  lastFeeSource: null,    // Track previous fee source for transition detection
  lastFeeAvailability: null, // Track fee availability state changes
  feeTransitionTimer: null   // Timer for handling fee transition updates
};

// Task 6.4.1: Fallback fee estimation detection state
let fallbackFeeDetectionState = {
  isUsingFallback: false,           // Current fallback usage status
  fallbackDetectionHistory: [],     // History of fallback detection events
  lastFallbackDetection: null,      // Timestamp of last fallback detection
  fallbackUsageCount: 0,            // Count of fallback usage instances
  fallbackReasons: [],              // Reasons why fallback was used
  ticketFeeFailureCount: 0,         // Count of ticket fee parsing failures
  estimationAccuracy: {             // Track estimation accuracy when possible
    totalEstimations: 0,
    accurateEstimations: 0,
    averageError: 0
  }
};

/**
 * Robust ticket element selectors and parsing functions
 * These functions implement pattern-based detection to avoid brittle classnames
 */

/**
 * Parse all relevant data from an order ticket element with comprehensive logging
 * @param {Element} ticketElement - The detected order ticket element
 * @returns {Object} Parsed ticket data with validation status
 */
async function parseTicketData(ticketElement) {
  return await KalshiLogger.measurePerformanceAsync(
    'PARSING',
    'parseTicketData',
    async () => {
      try {
        if (!ticketElement) {
          KalshiLogger.error(
            KalshiLogger.errorCategories.PARSING,
            'No ticket element provided to parseTicketData',
            {},
            {
              severity: KalshiLogger.severityLevels.HIGH,
              suggestedFix: 'Ensure ticket detection is working correctly',
              userImpact: 'Cannot parse any ticket data'
            }
          );
          return createEmptyTicketData('No ticket element provided');
        }
        
        // Validate ticket element is still in DOM and accessible
        if (!document.contains(ticketElement)) {
          KalshiLogger.error(
            KalshiLogger.errorCategories.DOM_ACCESS,
            'Ticket element no longer in DOM',
            { elementInfo: KalshiLogger.extractElementInfo(ticketElement) },
            {
              severity: KalshiLogger.severityLevels.HIGH,
              element: ticketElement,
              suggestedFix: 'Check if ticket modal was closed or DOM was updated',
              userImpact: 'Cannot access ticket data'
            }
          );
          return createEmptyTicketData('Ticket element no longer in DOM');
        }
        
        KalshiLogger.debug('PARSING', 'Starting ticket data parsing', {
          elementInfo: KalshiLogger.extractElementInfo(ticketElement)
        });
        
        const ticketData = {
          side: null,
          price: null,
          quantity: null,
          fee: null,
          isValid: false,
          errors: [],
          timestamp: Date.now(),
          parseTime: null,
          fallbacksUsed: []
        };
        
        // Parse each component with comprehensive error handling and performance monitoring
        try {
          ticketData.side = KalshiLogger.measurePerformance(
            'PARSING',
            'parseOrderSide',
            () => parseOrderSideWithFallback(ticketElement),
            { ticketElement: KalshiLogger.extractElementInfo(ticketElement) }
          );
        } catch (error) {
          KalshiLogger.error(
            KalshiLogger.errorCategories.PARSING,
            'Order side parsing failed',
            { ticketElement: KalshiLogger.extractElementInfo(ticketElement) },
            {
              severity: KalshiLogger.severityLevels.HIGH,
              element: ticketElement,
              originalError: error,
              suggestedFix: 'Check if YES/NO selection buttons are visible and accessible',
              userImpact: 'Cannot determine order side'
            }
          );
          ticketData.errors.push(`Order side parsing failed: ${error.message}`);
        }
        
        try {
          ticketData.price = KalshiLogger.measurePerformance(
            'PARSING',
            'parseLimitPrice',
            () => parseLimitPriceWithFallback(ticketElement),
            { ticketElement: KalshiLogger.extractElementInfo(ticketElement) }
          );
        } catch (error) {
          KalshiLogger.error(
            KalshiLogger.errorCategories.PARSING,
            'Limit price parsing failed',
            { ticketElement: KalshiLogger.extractElementInfo(ticketElement) },
            {
              severity: KalshiLogger.severityLevels.HIGH,
              element: ticketElement,
              originalError: error,
              suggestedFix: 'Check if price input field is visible and contains valid value',
              userImpact: 'Cannot calculate after-fee odds without price'
            }
          );
          ticketData.errors.push(`Limit price parsing failed: ${error.message}`);
        }
        
        try {
          ticketData.quantity = KalshiLogger.measurePerformance(
            'PARSING',
            'parseQuantity',
            () => parseQuantityWithFallback(ticketElement),
            { ticketElement: KalshiLogger.extractElementInfo(ticketElement) }
          );
        } catch (error) {
          KalshiLogger.error(
            KalshiLogger.errorCategories.PARSING,
            'Quantity parsing failed',
            { ticketElement: KalshiLogger.extractElementInfo(ticketElement) },
            {
              severity: KalshiLogger.severityLevels.MEDIUM,
              element: ticketElement,
              originalError: error,
              suggestedFix: 'Check if quantity input field is visible and contains valid integer',
              userImpact: 'May default to 1 contract'
            }
          );
          ticketData.errors.push(`Quantity parsing failed: ${error.message}`);
        }
        
        try {
          ticketData.fee = KalshiLogger.measurePerformance(
            'PARSING',
            'parseFeeInformation',
            () => parseFeeInformationWithFallback(ticketElement),
            { ticketElement: KalshiLogger.extractElementInfo(ticketElement) }
          );
        } catch (error) {
          KalshiLogger.error(
            KalshiLogger.errorCategories.PARSING,
            'Fee parsing failed',
            { ticketElement: KalshiLogger.extractElementInfo(ticketElement) },
            {
              severity: KalshiLogger.severityLevels.LOW,
              element: ticketElement,
              originalError: error,
              suggestedFix: 'Enable fallback fee estimation in settings',
              userImpact: 'May use estimated fees instead of actual fees'
            }
          );
          ticketData.errors.push(`Fee parsing failed: ${error.message}`);
        }
        
        // Validate parsed data
        validateTicketData(ticketData);
        
        // Attempt recovery if validation failed
        if (!ticketData.isValid && !ticketData.validationSummary?.canProceed) {
          KalshiLogger.info('PARSING', 'Ticket validation failed, attempting recovery', {
            errors: ticketData.errors,
            hasData: {
              side: !!ticketData.side,
              price: ticketData.price !== null,
              quantity: ticketData.quantity !== null,
              fee: !!ticketData.fee
            }
          });
          
          try {
            const recoveredData = await attemptTicketDataRecovery(ticketElement, ticketData);
            
            if (recoveredData.isValid || recoveredData.validationSummary?.canProceed) {
              KalshiLogger.info('PARSING', 'Ticket data recovery successful', {
                recoveryStrategiesUsed: recoveredData.recoveryStrategiesUsed || [],
                recoveredFields: {
                  side: !!recoveredData.side,
                  price: recoveredData.price !== null,
                  quantity: recoveredData.quantity !== null,
                  fee: !!recoveredData.fee
                }
              });
              return recoveredData;
            } else {
              KalshiLogger.warn('PARSING', 'Ticket data recovery failed, returning original data with errors', {
                recoveryStrategiesUsed: recoveredData.recoveryStrategiesUsed || [],
                errors: recoveredData.errors
              });
            }
          } catch (recoveryError) {
            KalshiLogger.error(
              KalshiLogger.errorCategories.PARSING,
              'Ticket data recovery threw error',
              {},
              {
                severity: KalshiLogger.severityLevels.MEDIUM,
                originalError: recoveryError,
                suggestedFix: 'Check if ticket element is stable and accessible',
                userImpact: 'Using original parsed data with potential errors'
              }
            );
          }
        }
        
        // Log successful parsing with performance metrics
        if (ticketData.isValid) {
          KalshiLogger.info('PARSING', 'Ticket parsing successful', {
            parsedData: {
              side: ticketData.side,
              price: ticketData.price,
              quantity: ticketData.quantity,
              hasFee: !!ticketData.fee
            },
            fallbacksUsed: ticketData.fallbacksUsed || []
          });
        } else {
          KalshiLogger.warn('PARSING', 'Ticket parsing completed with errors', {
            errors: ticketData.errors,
            fallbacksUsed: ticketData.fallbacksUsed || [],
            canProceed: ticketData.validationSummary?.canProceed
          });
        }
        
        return ticketData;
        
      } catch (error) {
        KalshiLogger.error(
          KalshiLogger.errorCategories.PARSING,
          'Critical parsing failure in parseTicketData',
          { ticketElement: KalshiLogger.extractElementInfo(ticketElement) },
          {
            severity: KalshiLogger.severityLevels.CRITICAL,
            element: ticketElement,
            originalError: error,
            suggestedFix: 'Check browser console for detailed error information',
            userImpact: 'Extension functionality may be severely impacted'
          }
        );
        
        return {
          ...createEmptyTicketData(`Critical parsing failure: ${error.message}`),
          fallbacksUsed: [],
          criticalError: true
        };
      }
    },
    {
      ticketElement: KalshiLogger.extractElementInfo(ticketElement)
    }
  );
}

/**
 * Create empty ticket data structure with error message
 */
function createEmptyTicketData(error) {
  return {
    side: null,
    price: null,
    quantity: null,
    fee: null,
    isValid: false,
    errors: [error],
    timestamp: Date.now(),
    parseTime: null,
    fallbacksUsed: []
  };
}

/**
 * Enhanced parsing error logging using centralized logging system
 * @deprecated Use KalshiLogger.error() directly for new code
 */
function logParsingError(functionName, message, element, error = null) {
  // Determine severity based on function name and error type
  let severity = KalshiLogger.severityLevels.MEDIUM;
  let suggestedFix = null;
  let userImpact = null;
  
  // Categorize errors and provide specific guidance
  if (functionName.includes('parseTicketData')) {
    severity = KalshiLogger.severityLevels.HIGH;
    userImpact = 'After-fee odds calculation may be unavailable';
    suggestedFix = 'Check if order ticket is fully loaded and visible';
  } else if (functionName.includes('parseOrderSide')) {
    severity = KalshiLogger.severityLevels.HIGH;
    userImpact = 'Cannot determine order side (YES/NO)';
    suggestedFix = 'Verify YES/NO buttons are visible and one is selected';
  } else if (functionName.includes('parseLimitPrice')) {
    severity = KalshiLogger.severityLevels.HIGH;
    userImpact = 'Cannot calculate after-fee odds without price';
    suggestedFix = 'Check if price input field contains valid value ($0.01-$1.00)';
  } else if (functionName.includes('parseQuantity')) {
    severity = KalshiLogger.severityLevels.MEDIUM;
    userImpact = 'May use default quantity of 1 contract';
    suggestedFix = 'Verify quantity input field contains valid integer value';
  } else if (functionName.includes('parseFee')) {
    severity = KalshiLogger.severityLevels.LOW;
    userImpact = 'May fall back to estimated fees';
    suggestedFix = 'Enable fallback fee estimation in settings if needed';
  }
  
  // Use centralized logging system
  KalshiLogger.error(
    KalshiLogger.errorCategories.PARSING,
    `${functionName}: ${message}`,
    {
      functionName,
      parsingContext: 'ticket-data-extraction'
    },
    {
      severity,
      element,
      originalError: error,
      suggestedFix,
      userImpact
    }
  );
}

// ============================================================================
// TASK 6.4.1: FALLBACK FEE ESTIMATION DETECTION SYSTEM
// ============================================================================

/**
 * Detect when fallback fee estimation is being used
 * This function analyzes fee data to determine if fallback estimation was used
 * and tracks the detection state for transparency and user feedback
 * 
 * @param {Object} feeData - Fee data object with feeSource property
 * @param {Object} context - Additional context about the fee calculation
 * @returns {Object} Detection result with fallback status and details
 */
function detectFallbackFeeUsage(feeData, context = {}) {
  return KalshiLogger.measurePerformance(
    'FALLBACK_DETECTION',
    'detectFallbackFeeUsage',
    () => {
      try {
        KalshiLogger.debug('FALLBACK_DETECTION', 'Analyzing fee data for fallback usage', {
          feeData: feeData ? {
            feeSource: feeData.feeSource,
            hasTotalFee: feeData.totalFee !== null,
            hasPerContractFee: feeData.perContractFee !== null,
            rawText: feeData.rawText?.substring(0, 100)
          } : null,
          context
        });
        
        const detectionResult = {
          isUsingFallback: false,
          fallbackType: null,
          confidence: 0,
          reasons: [],
          detectionMethod: null,
          timestamp: Date.now(),
          context: context
        };
        
        // Primary detection: Check feeSource property
        if (feeData && feeData.feeSource === 'estimated') {
          detectionResult.isUsingFallback = true;
          detectionResult.fallbackType = 'estimated';
          detectionResult.confidence = 0.95;
          detectionResult.reasons.push('Fee source explicitly marked as estimated');
          detectionResult.detectionMethod = 'feeSource_property';
          
          KalshiLogger.info('FALLBACK_DETECTION', 'Fallback fee usage detected via feeSource property', {
            feeSource: feeData.feeSource,
            confidence: detectionResult.confidence
          });
        }
        
        // Secondary detection: Analyze fee data characteristics
        if (feeData && !detectionResult.isUsingFallback) {
          const characteristics = analyzeFeeCharacteristics(feeData, context);
          
          if (characteristics.likelyEstimated) {
            detectionResult.isUsingFallback = true;
            detectionResult.fallbackType = 'inferred';
            detectionResult.confidence = characteristics.confidence;
            detectionResult.reasons = characteristics.reasons;
            detectionResult.detectionMethod = 'characteristic_analysis';
            
            KalshiLogger.info('FALLBACK_DETECTION', 'Fallback fee usage inferred from characteristics', {
              confidence: characteristics.confidence,
              reasons: characteristics.reasons
            });
          }
        }
        
        // Tertiary detection: Check for estimation patterns in raw text
        if (feeData && feeData.rawText && !detectionResult.isUsingFallback) {
          const textAnalysis = analyzeEstimationTextPatterns(feeData.rawText);
          
          if (textAnalysis.likelyEstimated) {
            detectionResult.isUsingFallback = true;
            detectionResult.fallbackType = 'text_pattern';
            detectionResult.confidence = textAnalysis.confidence;
            detectionResult.reasons = textAnalysis.reasons;
            detectionResult.detectionMethod = 'text_pattern_analysis';
            
            KalshiLogger.info('FALLBACK_DETECTION', 'Fallback fee usage detected via text patterns', {
              confidence: textAnalysis.confidence,
              patterns: textAnalysis.matchedPatterns
            });
          }
        }
        
        // Update detection state
        updateFallbackDetectionState(detectionResult);
        
        return detectionResult;
        
      } catch (error) {
        KalshiLogger.error(
          KalshiLogger.errorCategories.CALCULATION,
          'Error in fallback fee detection',
          { feeData, context },
          {
            severity: KalshiLogger.severityLevels.MEDIUM,
            originalError: error,
            suggestedFix: 'Check fee data structure and detection logic',
            userImpact: 'May not properly detect when estimated fees are used'
          }
        );
        
        return {
          isUsingFallback: false,
          fallbackType: null,
          confidence: 0,
          reasons: [`Detection error: ${error.message}`],
          detectionMethod: 'error',
          timestamp: Date.now(),
          context: context,
          error: true
        };
      }
    },
    { feeData: feeData ? 'present' : 'null', contextKeys: Object.keys(context) }
  );
}

/**
 * Analyze fee data characteristics to infer if estimation was used
 * This function looks for patterns that suggest fee estimation rather than actual ticket data
 * 
 * @param {Object} feeData - Fee data to analyze
 * @param {Object} context - Additional context
 * @returns {Object} Analysis result with likelihood and confidence
 */
function analyzeFeeCharacteristics(feeData, context = {}) {
  const analysis = {
    likelyEstimated: false,
    confidence: 0,
    reasons: [],
    characteristics: {}
  };
  
  try {
    // Characteristic 1: Round numbers suggest estimation
    if (feeData.perContractFee !== null) {
      const fee = feeData.perContractFee;
      const isRoundNumber = (fee * 100) % 1 === 0 && (fee * 100) % 5 === 0; // Multiple of 0.05
      const isVeryRoundNumber = fee === 0.01 || fee === 0.02 || fee === 0.05; // Common estimation values
      
      analysis.characteristics.isRoundNumber = isRoundNumber;
      analysis.characteristics.isVeryRoundNumber = isVeryRoundNumber;
      
      if (isVeryRoundNumber) {
        analysis.confidence += 0.3;
        analysis.reasons.push(`Very round per-contract fee (${fee}) suggests estimation`);
      } else if (isRoundNumber) {
        analysis.confidence += 0.1;
        analysis.reasons.push(`Round per-contract fee (${fee}) may indicate estimation`);
      }
    }
    
    // Characteristic 2: Default values suggest estimation
    if (context.usedDefaultPrice || context.usedDefaultQuantity) {
      analysis.confidence += 0.2;
      analysis.reasons.push('Used default price or quantity values for calculation');
      analysis.characteristics.usedDefaults = true;
    }
    
    // Characteristic 3: Calculation method suggests estimation
    if (context.calculationMethod === 'kalshi_formula') {
      analysis.confidence += 0.4;
      analysis.reasons.push('Fee calculated using Kalshi formula rather than parsed from ticket');
      analysis.characteristics.usedFormula = true;
    }
    
    // Characteristic 4: Missing ticket fee data
    if (context.ticketFeeParsingFailed) {
      analysis.confidence += 0.3;
      analysis.reasons.push('Ticket fee parsing failed, likely using fallback estimation');
      analysis.characteristics.ticketParsingFailed = true;
    }
    
    // Characteristic 5: Fee source not explicitly set to 'ticket'
    if (feeData.feeSource !== 'ticket') {
      analysis.confidence += 0.2;
      analysis.reasons.push('Fee source not explicitly marked as from ticket');
      analysis.characteristics.feeSourceNotTicket = true;
    }
    
    // Determine likelihood based on confidence threshold
    analysis.likelyEstimated = analysis.confidence >= 0.5;
    
    KalshiLogger.debug('FALLBACK_DETECTION', 'Fee characteristics analysis completed', {
      confidence: analysis.confidence,
      likelyEstimated: analysis.likelyEstimated,
      characteristics: analysis.characteristics,
      reasonCount: analysis.reasons.length
    });
    
    return analysis;
    
  } catch (error) {
    KalshiLogger.error(
      KalshiLogger.errorCategories.CALCULATION,
      'Error analyzing fee characteristics',
      { feeData, context },
      {
        severity: KalshiLogger.severityLevels.LOW,
        originalError: error
      }
    );
    
    return {
      likelyEstimated: false,
      confidence: 0,
      reasons: [`Analysis error: ${error.message}`],
      characteristics: {},
      error: true
    };
  }
}

/**
 * Analyze text patterns that suggest fee estimation
 * Looks for keywords and patterns in rawText that indicate estimation
 * 
 * @param {string} rawText - Raw text from fee parsing
 * @returns {Object} Analysis result with patterns and confidence
 */
function analyzeEstimationTextPatterns(rawText) {
  const analysis = {
    likelyEstimated: false,
    confidence: 0,
    reasons: [],
    matchedPatterns: []
  };
  
  if (!rawText || typeof rawText !== 'string') {
    return analysis;
  }
  
  try {
    const text = rawText.toLowerCase();
    
    // Pattern 1: Explicit estimation keywords
    const estimationKeywords = [
      'estimated', 'estimate', 'approximated', 'calculated', 
      'fallback', 'default', 'assumed', 'inferred'
    ];
    
    for (const keyword of estimationKeywords) {
      if (text.includes(keyword)) {
        analysis.confidence += 0.4;
        analysis.reasons.push(`Contains estimation keyword: "${keyword}"`);
        analysis.matchedPatterns.push(`keyword:${keyword}`);
      }
    }
    
    // Pattern 2: Formula-based text
    const formulaPatterns = [
      /based\s+on.*formula/i,
      /using.*rate/i,
      /calculated.*fee/i,
      /\d+%.*fee/i,
      /taker.*fee/i,
      /maker.*fee/i
    ];
    
    for (const pattern of formulaPatterns) {
      if (pattern.test(rawText)) {
        analysis.confidence += 0.3;
        analysis.reasons.push(`Matches formula pattern: ${pattern.source}`);
        analysis.matchedPatterns.push(`formula:${pattern.source}`);
      }
    }
    
    // Pattern 3: Recovery or fallback text
    const recoveryPatterns = [
      /recovery/i,
      /fallback/i,
      /simple.*estimate/i,
      /default.*value/i,
      /could.*not.*parse/i
    ];
    
    for (const pattern of recoveryPatterns) {
      if (pattern.test(rawText)) {
        analysis.confidence += 0.5;
        analysis.reasons.push(`Matches recovery pattern: ${pattern.source}`);
        analysis.matchedPatterns.push(`recovery:${pattern.source}`);
      }
    }
    
    // Determine likelihood
    analysis.likelyEstimated = analysis.confidence >= 0.4;
    
    KalshiLogger.debug('FALLBACK_DETECTION', 'Text pattern analysis completed', {
      confidence: analysis.confidence,
      likelyEstimated: analysis.likelyEstimated,
      matchedPatterns: analysis.matchedPatterns,
      textLength: rawText.length
    });
    
    return analysis;
    
  } catch (error) {
    KalshiLogger.error(
      KalshiLogger.errorCategories.PARSING,
      'Error analyzing estimation text patterns',
      { rawTextLength: rawText?.length },
      {
        severity: KalshiLogger.severityLevels.LOW,
        originalError: error
      }
    );
    
    return {
      likelyEstimated: false,
      confidence: 0,
      reasons: [`Pattern analysis error: ${error.message}`],
      matchedPatterns: [],
      error: true
    };
  }
}

/**
 * Update the global fallback detection state with new detection results
 * Maintains history and statistics for debugging and user transparency
 * 
 * @param {Object} detectionResult - Result from detectFallbackFeeUsage
 */
function updateFallbackDetectionState(detectionResult) {
  try {
    const state = fallbackFeeDetectionState;
    
    // Update current status
    const wasUsingFallback = state.isUsingFallback;
    state.isUsingFallback = detectionResult.isUsingFallback;
    
    // Track status changes
    if (detectionResult.isUsingFallback && !wasUsingFallback) {
      KalshiLogger.info('FALLBACK_DETECTION', 'Fallback fee usage started', {
        fallbackType: detectionResult.fallbackType,
        confidence: detectionResult.confidence,
        reasons: detectionResult.reasons
      });
    } else if (!detectionResult.isUsingFallback && wasUsingFallback) {
      KalshiLogger.info('FALLBACK_DETECTION', 'Fallback fee usage ended', {
        previousType: state.fallbackDetectionHistory[state.fallbackDetectionHistory.length - 1]?.fallbackType
      });
    }
    
    // Update counters and history
    if (detectionResult.isUsingFallback) {
      state.fallbackUsageCount++;
      state.lastFallbackDetection = detectionResult.timestamp;
      
      // Add reasons to the reasons array (keep unique)
      detectionResult.reasons.forEach(reason => {
        if (!state.fallbackReasons.includes(reason)) {
          state.fallbackReasons.push(reason);
        }
      });
    }
    
    // Add to history (keep last 20 detections)
    state.fallbackDetectionHistory.push({
      timestamp: detectionResult.timestamp,
      isUsingFallback: detectionResult.isUsingFallback,
      fallbackType: detectionResult.fallbackType,
      confidence: detectionResult.confidence,
      detectionMethod: detectionResult.detectionMethod,
      reasonCount: detectionResult.reasons.length
    });
    
    if (state.fallbackDetectionHistory.length > 20) {
      state.fallbackDetectionHistory.shift();
    }
    
    // Update failure count if ticket parsing failed
    if (detectionResult.context?.ticketFeeParsingFailed) {
      state.ticketFeeFailureCount++;
    }
    
    KalshiLogger.trace('FALLBACK_DETECTION', 'Detection state updated', {
      isUsingFallback: state.isUsingFallback,
      usageCount: state.fallbackUsageCount,
      historyLength: state.fallbackDetectionHistory.length,
      failureCount: state.ticketFeeFailureCount
    });
    
  } catch (error) {
    KalshiLogger.error(
      KalshiLogger.errorCategories.CONFIGURATION,
      'Error updating fallback detection state',
      { detectionResult },
      {
        severity: KalshiLogger.severityLevels.LOW,
        originalError: error,
        suggestedFix: 'Check detection state structure and update logic'
      }
    );
  }
}

/**
 * Get current fallback detection status with detailed information
 * Provides comprehensive information about fallback usage for display and debugging
 * 
 * @returns {Object} Current fallback status and statistics
 */
function getFallbackDetectionStatus() {
  try {
    const state = fallbackFeeDetectionState;
    const now = Date.now();
    
    return {
      // Current status
      isCurrentlyUsingFallback: state.isUsingFallback,
      lastDetectionTime: state.lastFallbackDetection,
      timeSinceLastDetection: state.lastFallbackDetection ? now - state.lastFallbackDetection : null,
      
      // Usage statistics
      totalFallbackUsages: state.fallbackUsageCount,
      ticketParsingFailures: state.ticketFeeFailureCount,
      
      // Recent history
      recentDetections: state.fallbackDetectionHistory.slice(-5),
      fallbackReasons: [...state.fallbackReasons], // Copy to prevent mutation
      
      // Detection patterns
      mostCommonDetectionMethod: getMostCommonDetectionMethod(state.fallbackDetectionHistory),
      averageConfidence: getAverageConfidence(state.fallbackDetectionHistory),
      
      // Estimation accuracy (if available)
      estimationAccuracy: { ...state.estimationAccuracy },
      
      // Summary
      summary: generateFallbackDetectionSummary(state)
    };
    
  } catch (error) {
    KalshiLogger.error(
      KalshiLogger.errorCategories.CONFIGURATION,
      'Error getting fallback detection status',
      {},
      {
        severity: KalshiLogger.severityLevels.LOW,
        originalError: error
      }
    );
    
    return {
      isCurrentlyUsingFallback: false,
      error: error.message,
      summary: 'Error retrieving fallback detection status'
    };
  }
}

/**
 * Helper function to get the most common detection method from history
 */
function getMostCommonDetectionMethod(history) {
  if (!history || history.length === 0) return null;
  
  const methodCounts = {};
  history.forEach(detection => {
    if (detection.detectionMethod) {
      methodCounts[detection.detectionMethod] = (methodCounts[detection.detectionMethod] || 0) + 1;
    }
  });
  
  return Object.keys(methodCounts).reduce((a, b) => 
    methodCounts[a] > methodCounts[b] ? a : b, null
  );
}

/**
 * Helper function to calculate average confidence from detection history
 */
function getAverageConfidence(history) {
  if (!history || history.length === 0) return 0;
  
  const confidenceValues = history
    .filter(detection => typeof detection.confidence === 'number')
    .map(detection => detection.confidence);
  
  if (confidenceValues.length === 0) return 0;
  
  const sum = confidenceValues.reduce((acc, conf) => acc + conf, 0);
  return Math.round((sum / confidenceValues.length) * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate a human-readable summary of fallback detection status
 */
function generateFallbackDetectionSummary(state) {
  if (state.fallbackUsageCount === 0) {
    return 'No fallback fee estimation detected - all fees read from tickets';
  }
  
  const recentUsage = state.isUsingFallback ? ' (currently active)' : '';
  const failureInfo = state.ticketFeeFailureCount > 0 ? 
    ` with ${state.ticketFeeFailureCount} ticket parsing failures` : '';
  
  return `Fallback estimation used ${state.fallbackUsageCount} times${recentUsage}${failureInfo}`;
}

/**
 * Reset fallback detection state (useful for testing or debugging)
 */
function resetFallbackDetectionState() {
  KalshiLogger.info('FALLBACK_DETECTION', 'Resetting fallback detection state');
  
  fallbackFeeDetectionState.isUsingFallback = false;
  fallbackFeeDetectionState.fallbackDetectionHistory = [];
  fallbackFeeDetectionState.lastFallbackDetection = null;
  fallbackFeeDetectionState.fallbackUsageCount = 0;
  fallbackFeeDetectionState.fallbackReasons = [];
  fallbackFeeDetectionState.ticketFeeFailureCount = 0;
  fallbackFeeDetectionState.estimationAccuracy = {
    totalEstimations: 0,
    accurateEstimations: 0,
    averageError: 0
  };
}

// ============================================================================
// END TASK 6.4.1: FALLBACK FEE ESTIMATION DETECTION SYSTEM
// ============================================================================

/**
 * Debugging utilities for development and troubleshooting
 */
const KalshiDebugger = {
  
  /**
   * Enable debug mode with enhanced logging
   */
  enableDebugMode() {
    KalshiLogger.setLevel('DEBUG');
    KalshiLogger.info('DEBUGGER', 'Debug mode enabled - verbose logging active');
    
    // Add visual indicators for debugging
    this.addDebugStyles();
    
    // Expose debugging functions globally
    window.KalshiDebugger = this;
    window.debugKalshi = this.createDebugInterface();
    
    KalshiLogger.info('DEBUGGER', 'Debug interface available at window.debugKalshi');
  },
  
  /**
   * Add visual debugging styles to highlight extension elements
   */
  addDebugStyles() {
    if (document.getElementById('kalshi-debug-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'kalshi-debug-styles';
    style.textContent = `
      [data-kalshi-ao] {
        outline: 2px dashed #ff6b6b !important;
        background-color: rgba(255, 107, 107, 0.1) !important;
      }
      [data-kalshi-ao]:hover {
        background-color: rgba(255, 107, 107, 0.2) !important;
      }
      .kalshi-debug-info {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
        max-height: 400px;
        overflow-y: auto;
      }
    `;
    document.head.appendChild(style);
    
    KalshiLogger.debug('DEBUGGER', 'Debug styles added to page');
  },
  
  /**
   * Create debug interface with useful functions
   */
  createDebugInterface() {
    return {
      // Logging controls
      setLogLevel: (level) => KalshiLogger.setLevel(level),
      exportDiagnostics: () => KalshiLogger.exportDiagnostics(),
      clearDiagnostics: () => KalshiLogger.clearDiagnostics(),
      
      // Element inspection
      inspectElement: (element) => this.inspectElement(element),
      findTicketElements: () => this.findTicketElements(),
      testParsing: (element) => this.testParsing(element),
      
      // Performance analysis
      getPerformanceReport: () => this.getPerformanceReport(),
      analyzeSlowOperations: () => this.analyzeSlowOperations(),
      
      // Error analysis
      getErrorSummary: () => this.getErrorSummary(),
      getRecentErrors: (count = 10) => this.getRecentErrors(count),
      
      // Extension state
      getExtensionState: () => this.getExtensionState(),
      validateSettings: () => this.validateCurrentSettings(),
      
      // Task 6.4.1: Fallback fee detection debugging
      getFallbackStatus: () => getFallbackDetectionStatus(),
      resetFallbackDetection: () => resetFallbackDetectionState(),
      testFallbackDetection: (feeData, context) => detectFallbackFeeUsage(feeData, context),
      
      // Testing utilities
      simulateTicketData: (data) => this.simulateTicketData(data),
      testOddsCalculation: (price, quantity, fee) => this.testOddsCalculation(price, quantity, fee),
      
      // Help
      help: () => this.showHelp()
    };
  },
  
  /**
   * Inspect a DOM element and show detailed information
   */
  inspectElement(element) {
    if (!element) {
      KalshiLogger.warn('DEBUGGER', 'No element provided for inspection');
      return null;
    }
    
    const inspection = {
      basic: KalshiLogger.extractElementInfo(element),
      computed: this.getComputedElementInfo(element),
      parsing: this.testElementParsing(element),
      accessibility: this.checkElementAccessibility(element)
    };
    
    console.group('🔍 Element Inspection');
    console.log('Basic Info:', inspection.basic);
    console.log('Computed Info:', inspection.computed);
    console.log('Parsing Test:', inspection.parsing);
    console.log('Accessibility:', inspection.accessibility);
    console.groupEnd();
    
    return inspection;
  },
  
  /**
   * Get computed element information
   */
  getComputedElementInfo(element) {
    try {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      return {
        visibility: {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          zIndex: style.zIndex
        },
        position: {
          position: style.position,
          top: style.top,
          left: style.left,
          width: rect.width,
          height: rect.height
        },
        interaction: {
          pointerEvents: style.pointerEvents,
          userSelect: style.userSelect,
          cursor: style.cursor
        },
        isVisible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      };
    } catch (error) {
      return { error: error.message };
    }
  },
  
  /**
   * Test element parsing capabilities
   */
  testElementParsing(element) {
    const results = {
      canParseOrderSide: false,
      canParseLimitPrice: false,
      canParseQuantity: false,
      canParseFee: false,
      errors: []
    };
    
    try {
      const side = parseOrderSide(element);
      results.canParseOrderSide = !!side;
      results.orderSide = side;
    } catch (error) {
      results.errors.push(`Order side parsing: ${error.message}`);
    }
    
    try {
      const price = parseLimitPrice(element);
      results.canParseLimitPrice = price !== null;
      results.limitPrice = price;
    } catch (error) {
      results.errors.push(`Limit price parsing: ${error.message}`);
    }
    
    try {
      const quantity = parseQuantity(element);
      results.canParseQuantity = quantity !== null;
      results.quantity = quantity;
    } catch (error) {
      results.errors.push(`Quantity parsing: ${error.message}`);
    }
    
    try {
      const fee = parseFeeInformation(element);
      results.canParseFee = !!fee;
      results.fee = fee;
    } catch (error) {
      results.errors.push(`Fee parsing: ${error.message}`);
    }
    
    return results;
  },
  
  /**
   * Check element accessibility
   */
  checkElementAccessibility(element) {
    const checks = {
      isConnected: element.isConnected,
      hasParent: !!element.parentElement,
      inDocument: document.contains(element),
      hasRequiredMethods: typeof element.querySelectorAll === 'function',
      canComputeStyle: false,
      isInteractable: false
    };
    
    try {
      const style = window.getComputedStyle(element);
      checks.canComputeStyle = !!style;
      
      const rect = element.getBoundingClientRect();
      checks.isInteractable = rect.width > 0 && rect.height > 0 && 
                             style.pointerEvents !== 'none' && 
                             style.display !== 'none';
    } catch (error) {
      checks.styleError = error.message;
    }
    
    return checks;
  },
  
  /**
   * Find all potential ticket elements on the page
   */
  findTicketElements() {
    const selectors = [
      '[class*="ticket"]',
      '[class*="order"]',
      '[class*="modal"]',
      '[role="dialog"]',
      '[class*="popup"]',
      '[class*="overlay"]'
    ];
    
    const elements = [];
    
    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      found.forEach(element => {
        if (!elements.includes(element)) {
          elements.push({
            element,
            selector,
            info: KalshiLogger.extractElementInfo(element),
            parsing: this.testElementParsing(element)
          });
        }
      });
    });
    
    console.group('🎫 Ticket Elements Found');
    elements.forEach((item, index) => {
      console.log(`${index + 1}. ${item.selector}:`, item);
    });
    console.groupEnd();
    
    return elements;
  },
  
  /**
   * Test parsing on a specific element
   */
  async testParsing(element) {
    if (!element) {
      KalshiLogger.warn('DEBUGGER', 'No element provided for parsing test');
      return null;
    }
    
    KalshiLogger.info('DEBUGGER', 'Testing parsing on element', {
      elementInfo: KalshiLogger.extractElementInfo(element)
    });
    
    try {
      const result = await parseTicketData(element);
      
      console.group('🧪 Parsing Test Results');
      console.log('Parsed Data:', result);
      console.log('Validation:', {
        isValid: result.isValid,
        errors: result.errors,
        canProceed: result.validationSummary?.canProceed
      });
      console.groupEnd();
      
      return result;
    } catch (error) {
      KalshiLogger.error('DEBUGGER', 'Parsing test failed', {}, {
        severity: KalshiLogger.severityLevels.MEDIUM,
        originalError: error,
        element: element
      });
      return { error: error.message };
    }
  },
  
  /**
   * Get performance report
   */
  getPerformanceReport() {
    const metrics = KalshiLogger.performanceMetrics;
    const averageTime = metrics.totalOperations > 0 ? metrics.totalTime / metrics.totalOperations : 0;
    
    const report = {
      summary: {
        totalOperations: metrics.totalOperations,
        averageTime: Math.round(averageTime * 100) / 100 + 'ms',
        slowOperations: metrics.slowOperations,
        slowPercentage: metrics.totalOperations > 0 ? 
          Math.round((metrics.slowOperations / metrics.totalOperations) * 100) + '%' : '0%',
        errorCount: metrics.errorCount,
        warningCount: metrics.warningCount
      },
      recentOperations: metrics.operationHistory.slice(-10),
      slowestOperations: metrics.operationHistory
        .filter(op => op.performanceLevel === 'slow' || op.performanceLevel === 'critical')
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
    };
    
    console.group('📊 Performance Report');
    console.log('Summary:', report.summary);
    console.log('Recent Operations:', report.recentOperations);
    console.log('Slowest Operations:', report.slowestOperations);
    console.groupEnd();
    
    return report;
  },
  
  /**
   * Analyze slow operations for optimization opportunities
   */
  analyzeSlowOperations() {
    const metrics = KalshiLogger.performanceMetrics;
    const slowOps = metrics.operationHistory.filter(op => 
      op.performanceLevel === 'slow' || op.performanceLevel === 'critical'
    );
    
    const analysis = {
      totalSlowOps: slowOps.length,
      categories: {},
      commonPatterns: [],
      suggestions: []
    };
    
    // Categorize slow operations
    slowOps.forEach(op => {
      if (!analysis.categories[op.category]) {
        analysis.categories[op.category] = [];
      }
      analysis.categories[op.category].push(op);
    });
    
    // Generate suggestions
    Object.keys(analysis.categories).forEach(category => {
      const ops = analysis.categories[category];
      if (ops.length > 2) {
        analysis.suggestions.push(`Consider optimizing ${category} operations (${ops.length} slow operations detected)`);
      }
    });
    
    console.group('🐌 Slow Operations Analysis');
    console.log('Analysis:', analysis);
    console.groupEnd();
    
    return analysis;
  },
  
  /**
   * Get error summary
   */
  getErrorSummary() {
    const errors = window.kalshiAOErrors || [];
    const criticalErrors = window.kalshiAOCriticalErrors || [];
    
    const summary = {
      totalErrors: errors.length,
      criticalErrors: criticalErrors.length,
      errorsByCategory: {},
      errorsBySeverity: {},
      recentErrors: errors.slice(-5)
    };
    
    errors.forEach(error => {
      const category = error.context?.category || 'UNKNOWN';
      const severity = error.context?.severity || 'UNKNOWN';
      
      summary.errorsByCategory[category] = (summary.errorsByCategory[category] || 0) + 1;
      summary.errorsBySeverity[severity] = (summary.errorsBySeverity[severity] || 0) + 1;
    });
    
    console.group('🚨 Error Summary');
    console.log('Summary:', summary);
    console.groupEnd();
    
    return summary;
  },
  
  /**
   * Get recent errors
   */
  getRecentErrors(count = 10) {
    const errors = window.kalshiAOErrors || [];
    return errors.slice(-count);
  },
  
  /**
   * Get current extension state
   */
  getExtensionState() {
    return {
      settings: settings,
      observerStats: observerStats,
      ticketState: {
        isOpen: ticketState.isOpen,
        hasElement: !!ticketState.ticketElement,
        lastHash: ticketState.lastTicketHash
      },
      helperPanelState: {
        isVisible: helperPanelState.isVisible,
        hasPanel: !!helperPanelState.panelElement,
        currentOdds: helperPanelState.currentOdds,
        currentSide: helperPanelState.currentSide
      },
      processedNodes: 'WeakSet (cannot inspect)',
      mutationObserver: !!mutationObserver
    };
  },
  
  /**
   * Validate current settings
   */
  validateCurrentSettings() {
    const isValid = validateSettings(settings);
    
    console.group('⚙️ Settings Validation');
    console.log('Settings:', settings);
    console.log('Valid:', isValid);
    console.groupEnd();
    
    return { settings, isValid };
  },
  
  /**
   * Simulate ticket data for testing
   */
  simulateTicketData(data = {}) {
    const defaultData = {
      side: 'YES',
      price: 0.65,
      quantity: 10,
      fee: { totalFee: 0.45, perContractFee: 0.045, feeSource: 'simulated' }
    };
    
    const simulatedData = { ...defaultData, ...data };
    
    console.group('🎭 Simulated Ticket Data');
    console.log('Data:', simulatedData);
    
    // Test validation
    const validation = validateAllNumericValues(simulatedData);
    console.log('Validation:', validation);
    
    // Test odds calculation if we have the function
    if (typeof calculateAfterFeeOdds === 'function') {
      try {
        const afterFeeOdds = calculateAfterFeeOdds(simulatedData);
        console.log('After-fee odds:', afterFeeOdds);
      } catch (error) {
        console.log('After-fee odds calculation failed:', error.message);
      }
    }
    
    console.groupEnd();
    
    return simulatedData;
  },
  
  /**
   * Test odds calculation
   */
  testOddsCalculation(price = 0.65, quantity = 10, fee = 0.45) {
    console.group('🧮 Odds Calculation Test');
    console.log('Inputs:', { price, quantity, fee });
    
    try {
      // Test probability to American odds conversion
      const americanOdds = probabilityToAmericanOdds(price);
      console.log('Raw American odds:', americanOdds);
      
      // Test after-fee calculation
      const feePerContract = fee / quantity;
      const risk = price + feePerContract;
      const profit = 1 - risk;
      
      let afterFeeOdds;
      if (profit >= risk) {
        afterFeeOdds = Math.round(100 * (profit / risk));
      } else {
        afterFeeOdds = -Math.round(100 * (risk / profit));
      }
      
      console.log('After-fee calculation:', {
        feePerContract,
        risk,
        profit,
        afterFeeOdds
      });
      
    } catch (error) {
      console.log('Calculation failed:', error.message);
    }
    
    console.groupEnd();
  },
  
  /**
   * Show help information
   */
  showHelp() {
    const help = `
🔧 Kalshi American Odds Debugger Help

Available functions:
• setLogLevel(level) - Set logging level (ERROR, WARN, INFO, DEBUG, TRACE)
• exportDiagnostics() - Export diagnostic report
• clearDiagnostics() - Clear diagnostic data
• inspectElement(element) - Inspect DOM element
• findTicketElements() - Find potential ticket elements
• testParsing(element) - Test parsing on element
• getPerformanceReport() - Get performance metrics
• analyzeSlowOperations() - Analyze slow operations
• getErrorSummary() - Get error summary
• getRecentErrors(count) - Get recent errors
• getExtensionState() - Get extension state
• validateSettings() - Validate current settings
• simulateTicketData(data) - Simulate ticket data
• testOddsCalculation(price, quantity, fee) - Test odds calculation

Task 6.4.1 - Fallback Fee Detection:
• getFallbackStatus() - Get current fallback detection status
• resetFallbackDetection() - Reset fallback detection state
• testFallbackDetection(feeData, context) - Test fallback detection on data

• help() - Show this help

Examples:
debugKalshi.setLogLevel('DEBUG')
debugKalshi.findTicketElements()
debugKalshi.inspectElement(document.querySelector('.ticket'))
debugKalshi.getFallbackStatus()
debugKalshi.testFallbackDetection({feeSource: 'estimated', totalFee: 0.05})
debugKalshi.exportDiagnostics()
    `;
    
    console.log(help);
    return help;
  }
};

/**
 * User-friendly error reporting system
 */
const KalshiErrorReporter = {
  
  /**
   * Show user-friendly error notification
   */
  showUserError(message, details = {}) {
    const {
      severity = 'medium',
      actionable = true,
      suggestedAction = null,
      dismissible = true,
      duration = 5000
    } = details;
    
    // Create error notification element
    const notification = this.createErrorNotification(message, {
      severity,
      actionable,
      suggestedAction,
      dismissible
    });
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-dismiss if specified
    if (dismissible && duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, duration);
    }
    
    KalshiLogger.info('ERROR_REPORTER', 'User error notification shown', {
      message,
      severity,
      actionable,
      duration
    });
    
    return notification;
  },
  
  /**
   * Create error notification element
   */
  createErrorNotification(message, options) {
    const { severity, actionable, suggestedAction, dismissible } = options;
    
    const notification = document.createElement('div');
    notification.className = `kalshi-error-notification kalshi-error-${severity}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 350px;
      padding: 15px;
      background: ${this.getSeverityColor(severity)};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation styles
    if (!document.getElementById('kalshi-error-styles')) {
      const style = document.createElement('style');
      style.id = 'kalshi-error-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .kalshi-error-notification:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create content
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <div style="font-size: 18px;">${this.getSeverityIcon(severity)}</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 5px;">
            Kalshi American Odds
          </div>
          <div style="margin-bottom: ${suggestedAction ? '10px' : '0'};">
            ${message}
          </div>
          ${suggestedAction ? `
            <div style="font-size: 12px; opacity: 0.9; font-style: italic;">
              💡 ${suggestedAction}
            </div>
          ` : ''}
        </div>
        ${dismissible ? `
          <button style="
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            opacity: 0.7;
          " onclick="this.parentElement.parentElement.parentElement.remove()">
            ✕
          </button>
        ` : ''}
      </div>
    `;
    
    notification.appendChild(content);
    return notification;
  },
  
  /**
   * Get color for severity level
   */
  getSeverityColor(severity) {
    const colors = {
      low: '#4CAF50',      // Green
      medium: '#FF9800',   // Orange
      high: '#F44336',     // Red
      critical: '#9C27B0'  // Purple
    };
    return colors[severity] || colors.medium;
  },
  
  /**
   * Get icon for severity level
   */
  getSeverityIcon(severity) {
    const icons = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '💥'
    };
    return icons[severity] || icons.medium;
  },
  
  /**
   * Report parsing errors to user
   */
  reportParsingError(functionName, userMessage, technicalDetails = {}) {
    let severity = 'medium';
    let suggestedAction = 'Try refreshing the page or reopening the order ticket.';
    
    // Customize based on function
    if (functionName.includes('parseTicketData')) {
      severity = 'high';
      suggestedAction = 'Make sure the order ticket is fully loaded and try again.';
    } else if (functionName.includes('parseFee')) {
      severity = 'low';
      suggestedAction = 'Fee estimation will be used instead. You can enable this in settings.';
    }
    
    this.showUserError(userMessage, {
      severity,
      suggestedAction,
      duration: 8000
    });
    
    // Log technical details
    KalshiLogger.error(
      KalshiLogger.errorCategories.USER_INTERACTION,
      `User error reported: ${userMessage}`,
      { functionName, technicalDetails },
      {
        severity: KalshiLogger.severityLevels.MEDIUM,
        userImpact: userMessage
      }
    );
  },
  
  /**
   * Report configuration errors to user
   */
  reportConfigurationError(message, suggestedFix = null) {
    this.showUserError(message, {
      severity: 'medium',
      suggestedAction: suggestedFix || 'Check extension settings and try again.',
      duration: 10000
    });
  },
  
  /**
   * Report performance issues to user
   */
  reportPerformanceIssue(message, details = {}) {
    this.showUserError(message, {
      severity: 'low',
      suggestedAction: 'Performance may be affected. Consider refreshing the page.',
      duration: 6000
    });
  }
};

// Initialize debugging in development environment
if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
  KalshiDebugger.enableDebugMode();
}

// Expose error reporter globally
window.KalshiErrorReporter = KalshiErrorReporter;

/**
 * Safely execute a function with enhanced error handling and logging
 */
function safeExecute(functionName, fn, fallbackValue = null, context = null) {
  return KalshiLogger.measurePerformance(
    'SAFE_EXECUTION',
    functionName,
    () => {
      try {
        const result = fn();
        KalshiLogger.trace('SAFE_EXECUTION', `Safe execution successful: ${functionName}`);
        return result;
      } catch (error) {
        KalshiLogger.error(
          KalshiLogger.errorCategories.PARSING,
          `Safe execution failed: ${functionName}`,
          { 
            functionName,
            contextInfo: context ? KalshiLogger.extractElementInfo(context) : null
          },
          {
            severity: KalshiLogger.severityLevels.MEDIUM,
            element: context,
            originalError: error,
            suggestedFix: 'Check function implementation and input parameters',
            userImpact: `Falling back to default value: ${fallbackValue}`
          }
        );
        return fallbackValue;
      }
    },
    {
      functionName,
      fallbackValue,
      hasContext: !!context
    }
  );
}

/**
 * Validate DOM element accessibility with comprehensive checks and logging
 */
function validateElementAccess(element, functionName) {
  KalshiLogger.trace('DOM_ACCESS', `Validating element access for ${functionName}`, {
    functionName,
    hasElement: !!element
  });
  
  if (!element) {
    const error = new Error('Element is null or undefined');
    KalshiLogger.error(
      KalshiLogger.errorCategories.DOM_ACCESS,
      `Element validation failed: null/undefined element`,
      { functionName },
      {
        severity: KalshiLogger.severityLevels.HIGH,
        originalError: error,
        suggestedFix: 'Check if element selector is correct and element exists',
        userImpact: 'Cannot access DOM element for parsing'
      }
    );
    throw error;
  }
  
  if (typeof element !== 'object' || !element.nodeType) {
    const error = new Error('Invalid element type - not a DOM node');
    KalshiLogger.error(
      KalshiLogger.errorCategories.DOM_ACCESS,
      `Element validation failed: invalid type`,
      { 
        functionName,
        elementType: typeof element,
        hasNodeType: !!element.nodeType
      },
      {
        severity: KalshiLogger.severityLevels.HIGH,
        originalError: error,
        suggestedFix: 'Ensure element is a valid DOM node',
        userImpact: 'Cannot access DOM element for parsing'
      }
    );
    throw error;
  }
  
  if (element.nodeType !== Node.ELEMENT_NODE) {
    const error = new Error(`Invalid node type: ${element.nodeType}, expected ${Node.ELEMENT_NODE}`);
    KalshiLogger.error(
      KalshiLogger.errorCategories.DOM_ACCESS,
      `Element validation failed: wrong node type`,
      { 
        functionName,
        actualNodeType: element.nodeType,
        expectedNodeType: Node.ELEMENT_NODE
      },
      {
        severity: KalshiLogger.severityLevels.HIGH,
        element: element,
        originalError: error,
        suggestedFix: 'Ensure element is an Element node, not Text or Comment node',
        userImpact: 'Cannot access DOM element for parsing'
      }
    );
    throw error;
  }
  
  if (!document.contains(element)) {
    const error = new Error('Element is not connected to the document');
    KalshiLogger.error(
      KalshiLogger.errorCategories.DOM_ACCESS,
      `Element validation failed: element not in document`,
      { 
        functionName,
        elementInfo: KalshiLogger.extractElementInfo(element)
      },
      {
        severity: KalshiLogger.severityLevels.HIGH,
        element: element,
        originalError: error,
        suggestedFix: 'Check if element was removed from DOM or if DOM was updated',
        userImpact: 'Cannot access DOM element for parsing'
      }
    );
    throw error;
  }
  
  // Check if element is accessible (not in a detached subtree)
  try {
    const style = window.getComputedStyle(element);
    if (!style) {
      const error = new Error('Cannot compute element styles - element may be detached');
      KalshiLogger.error(
        KalshiLogger.errorCategories.DOM_ACCESS,
        `Element validation failed: cannot compute styles`,
        { 
          functionName,
          elementInfo: KalshiLogger.extractElementInfo(element)
        },
        {
          severity: KalshiLogger.severityLevels.MEDIUM,
          element: element,
          originalError: error,
          suggestedFix: 'Check if element is visible and properly attached to DOM',
          userImpact: 'Element may not be accessible for parsing'
        }
      );
      throw error;
    }
  } catch (error) {
    KalshiLogger.error(
      KalshiLogger.errorCategories.DOM_ACCESS,
      `Element validation failed: style computation error`,
      { 
        functionName,
        elementInfo: KalshiLogger.extractElementInfo(element)
      },
      {
        severity: KalshiLogger.severityLevels.MEDIUM,
        element: element,
        originalError: error,
        suggestedFix: 'Check if element is properly attached and accessible',
        userImpact: 'Element may not be accessible for parsing'
      }
    );
    throw new Error(`Element style computation failed: ${error.message}`);
  }
  
  // Check if querySelectorAll is available (basic DOM API check)
  if (typeof element.querySelectorAll !== 'function') {
    const error = new Error('Element lacks required DOM API methods');
    KalshiLogger.error(
      KalshiLogger.errorCategories.DOM_ACCESS,
      `Element validation failed: missing DOM API methods`,
      { 
        functionName,
        elementInfo: KalshiLogger.extractElementInfo(element),
        hasQuerySelectorAll: typeof element.querySelectorAll
      },
      {
        severity: KalshiLogger.severityLevels.CRITICAL,
        element: element,
        originalError: error,
        suggestedFix: 'Check browser compatibility and DOM implementation',
        userImpact: 'Cannot use element for DOM queries'
      }
    );
    throw error;
  }
  
  KalshiLogger.trace('DOM_ACCESS', `Element validation passed for ${functionName}`);
  return true;
}

/**
 * Parse order side (YES/NO) from ticket UI elements
 * Uses pattern matching to avoid brittle selectors
 */
function parseOrderSide(ticketElement) {
  console.log('Parsing order side...');
  
  // Strategy 1: Look for selected buttons or elements with YES/NO text
  const sideSelectors = [
    // Button-based selectors
    'button[class*="selected"]',
    'button[aria-pressed="true"]',
    'button[class*="active"]',
    '.selected button',
    '.active button',
    
    // Generic selected elements
    '[class*="selected"]',
    '[class*="active"]',
    '[aria-selected="true"]',
    
    // Radio button or checkbox inputs
    'input[type="radio"]:checked',
    'input[type="checkbox"]:checked'
  ];
  
  for (const selector of sideSelectors) {
    const elements = ticketElement.querySelectorAll(selector);
    for (const element of elements) {
      const side = extractSideFromElement(element);
      if (side) {
        console.log(`Found side "${side}" via selector: ${selector}`);
        return side;
      }
    }
  }
  
  // Strategy 2: Look for form elements with YES/NO values
  const formElements = ticketElement.querySelectorAll('select, input[type="radio"], input[type="checkbox"]');
  for (const element of formElements) {
    if (element.tagName === 'SELECT') {
      const selectedOption = element.options[element.selectedIndex];
      if (selectedOption) {
        const side = extractSideFromText(selectedOption.textContent);
        if (side) {
          console.log(`Found side "${side}" from select option`);
          return side;
        }
      }
    } else if (element.checked) {
      const side = extractSideFromElement(element) || extractSideFromText(element.value);
      if (side) {
        console.log(`Found side "${side}" from checked input`);
        return side;
      }
    }
  }
  
  // Strategy 3: Look for prominent YES/NO text in the ticket
  const textElements = ticketElement.querySelectorAll('*');
  for (const element of textElements) {
    // Skip if element has children (to avoid parent elements)
    if (element.children.length > 0) continue;
    
    const text = element.textContent?.trim();
    if (text && (text.toUpperCase() === 'YES' || text.toUpperCase() === 'NO')) {
      // Check if this element appears to be selected/active
      const computedStyle = window.getComputedStyle(element);
      const parentStyle = element.parentElement ? window.getComputedStyle(element.parentElement) : null;
      
      // Look for visual indicators of selection
      const isSelected = 
        element.classList.contains('selected') ||
        element.classList.contains('active') ||
        element.parentElement?.classList.contains('selected') ||
        element.parentElement?.classList.contains('active') ||
        computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
        (parentStyle && parentStyle.backgroundColor !== 'rgba(0, 0, 0, 0)');
      
      if (isSelected) {
        const side = text.toUpperCase();
        console.log(`Found side "${side}" from styled text element`);
        return side;
      }
    }
  }
  
  console.warn('Could not determine order side from ticket element');
  return null;
}

/**
 * Extract side (YES/NO) from an element's text content and attributes
 */
function extractSideFromElement(element) {
  // Check text content
  const textSide = extractSideFromText(element.textContent);
  if (textSide) return textSide;
  
  // Check common attributes
  const attributes = ['value', 'data-value', 'data-side', 'aria-label', 'title'];
  for (const attr of attributes) {
    const value = element.getAttribute(attr);
    const attrSide = extractSideFromText(value);
    if (attrSide) return attrSide;
  }
  
  return null;
}

/**
 * Extract side (YES/NO) from text content
 */
function extractSideFromText(text) {
  if (!text) return null;
  
  const normalizedText = text.trim().toUpperCase();
  if (normalizedText === 'YES' || normalizedText === 'Y') return 'YES';
  if (normalizedText === 'NO' || normalizedText === 'N') return 'NO';
  
  // Check for text containing YES/NO
  if (normalizedText.includes('YES')) return 'YES';
  if (normalizedText.includes('NO')) return 'NO';
  
  return null;
}

/**
 * Parse limit price from price input field with validation
 * Uses pattern matching to find price inputs
 */
function parseLimitPrice(ticketElement) {
  console.log('Parsing limit price...');
  
  // Strategy 1: Look for number inputs that likely represent price
  const numberInputs = ticketElement.querySelectorAll('input[type="number"]');
  for (const input of numberInputs) {
    if (isPriceInput(input)) {
      const price = parseFloat(input.value);
      if (isValidPrice(price)) {
        console.log(`Found price ${price} from number input`);
        return price;
      }
    }
  }
  
  // Strategy 2: Look for text inputs with price patterns
  const textInputs = ticketElement.querySelectorAll('input[type="text"]');
  for (const input of textInputs) {
    if (isPriceInput(input)) {
      const price = parsePriceFromText(input.value);
      if (isValidPrice(price)) {
        console.log(`Found price ${price} from text input`);
        return price;
      }
    }
  }
  
  // Strategy 3: Look for price values in text content
  const pricePattern = /(?:^|\s)\$?(0\.\d{2}|1\.00)(?:\s|$)/g;
  const textElements = ticketElement.querySelectorAll('*');
  
  for (const element of textElements) {
    // Skip elements with children to avoid duplicates
    if (element.children.length > 0) continue;
    
    const text = element.textContent?.trim();
    if (text) {
      const matches = text.match(pricePattern);
      if (matches) {
        for (const match of matches) {
          // Extract just the price part (remove leading/trailing whitespace and $)
          const priceText = match.trim().replace(/^\$/, '');
          const price = parsePriceFromText(priceText);
          if (isValidPrice(price)) {
            // Additional validation: check if this seems to be a price input area
            const nearbyInput = element.closest('form, div')?.querySelector('input');
            if (nearbyInput) {
              console.log(`Found price ${price} from text content near input`);
              return price;
            }
          }
        }
      }
    }
  }
  
  console.warn('Could not determine limit price from ticket element');
  return null;
}

/**
 * Check if an input element is likely a price input
 */
function isPriceInput(input) {
  const indicators = [
    // Attribute-based indicators
    input.placeholder?.toLowerCase().includes('price'),
    input.name?.toLowerCase().includes('price'),
    input.id?.toLowerCase().includes('price'),
    
    // Label-based indicators
    input.getAttribute('aria-label')?.toLowerCase().includes('price'),
    
    // Value-based indicators (price range)
    input.min === '0.01' || input.min === '0',
    input.max === '0.99' || input.max === '1' || input.max === '1.00',
    input.step === '0.01',
    
    // Current value looks like a price
    isValidPrice(parseFloat(input.value))
  ];
  
  // Check nearby labels
  const nearbyLabel = input.closest('div, fieldset')?.querySelector('label');
  if (nearbyLabel && nearbyLabel.textContent?.toLowerCase().includes('price')) {
    indicators.push(true);
  }
  
  return indicators.some(Boolean);
}

/**
 * Parse price from text content with comprehensive validation and sanitization
 * @param {string} text - Text content to parse
 * @param {Object} options - Parsing options
 * @returns {number|null} Parsed and validated price or null if invalid
 */
function parsePriceFromText(text, options = {}) {
  const {
    logErrors = false,
    allowFallback = true
  } = options;
  
  if (!text) {
    if (logErrors) console.warn('parsePriceFromText: No text provided');
    return null;
  }
  
  // Remove currency symbols and whitespace, but preserve decimal points and digits
  const cleanText = text.replace(/[$\s,]/g, '').trim();
  
  if (cleanText === '') {
    if (logErrors) console.warn('parsePriceFromText: Empty text after cleaning');
    return null;
  }
  
  // Try to parse as float
  let rawPrice = parseFloat(cleanText);
  
  // Handle parsing failures
  if (isNaN(rawPrice)) {
    if (logErrors) console.warn('parsePriceFromText: Failed to parse as number:', cleanText);
    
    // Fallback: try to extract just the numeric part
    if (allowFallback) {
      const numericMatch = cleanText.match(/(\d+\.?\d*)/);
      if (numericMatch) {
        rawPrice = parseFloat(numericMatch[1]);
        if (logErrors) console.log('parsePriceFromText: Fallback extraction successful:', rawPrice);
      }
    }
    
    if (isNaN(rawPrice)) {
      return null;
    }
  }
  
  // Sanitize and validate the parsed price
  const sanitizedPrice = sanitizeNumericValue(rawPrice, {
    allowNegative: false,
    allowZero: false,
    maxDecimalPlaces: 4
  });
  
  if (sanitizedPrice === null) {
    if (logErrors) console.warn('parsePriceFromText: Sanitization failed for:', rawPrice);
    return null;
  }
  
  // Validate using enhanced price validation
  if (!isValidPrice(sanitizedPrice, { logErrors })) {
    if (logErrors) console.warn('parsePriceFromText: Validation failed for:', sanitizedPrice);
    return null;
  }
  
  return sanitizedPrice;
}

/**
 * Comprehensive numeric validation utilities for Kalshi extension
 * Handles edge cases like NaN, Infinity, negative values, and floating-point precision
 */

/**
 * Sanitize and normalize a numeric input value
 * @param {any} value - The value to sanitize
 * @param {Object} options - Sanitization options
 * @returns {number|null} Sanitized number or null if invalid
 */
function sanitizeNumericValue(value, options = {}) {
  const {
    allowNegative = false,
    allowZero = true,
    maxDecimalPlaces = 4,
    fallbackValue = null
  } = options;
  
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    return fallbackValue;
  }
  
  // Handle string inputs - clean and parse
  if (typeof value === 'string') {
    // Remove currency symbols, whitespace, and other non-numeric characters
    const cleanValue = value.replace(/[$,\s%]/g, '').trim();
    
    // Handle empty string after cleaning
    if (cleanValue === '') {
      return fallbackValue;
    }
    
    // Parse the cleaned value
    value = parseFloat(cleanValue);
  }
  
  // Handle non-numeric types
  if (typeof value !== 'number') {
    console.warn('sanitizeNumericValue: Non-numeric type after parsing:', typeof value, value);
    return fallbackValue;
  }
  
  // Handle NaN
  if (isNaN(value)) {
    console.warn('sanitizeNumericValue: NaN value detected');
    return fallbackValue;
  }
  
  // Handle Infinity and -Infinity
  if (!isFinite(value)) {
    console.warn('sanitizeNumericValue: Infinite value detected:', value);
    return fallbackValue;
  }
  
  // Handle negative values
  if (!allowNegative && value < 0) {
    console.warn('sanitizeNumericValue: Negative value not allowed:', value);
    return fallbackValue;
  }
  
  // Handle zero values
  if (!allowZero && value === 0) {
    console.warn('sanitizeNumericValue: Zero value not allowed');
    return fallbackValue;
  }
  
  // Handle floating-point precision issues
  if (maxDecimalPlaces !== null) {
    const multiplier = Math.pow(10, maxDecimalPlaces);
    value = Math.round(value * multiplier) / multiplier;
  }
  
  return value;
}

/**
 * Validate if a price value is reasonable for Kalshi with comprehensive edge case handling
 * @param {any} price - The price value to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if valid, false otherwise
 */
function isValidPrice(price, options = {}) {
  const {
    minPrice = 0.01,
    maxPrice = 1.00,
    allowExactZero = false,
    allowExactOne = true,
    logErrors = false
  } = options;
  
  // Sanitize the input first
  const sanitizedPrice = sanitizeNumericValue(price, {
    allowNegative: false,
    allowZero: allowExactZero,
    maxDecimalPlaces: 4
  });
  
  if (sanitizedPrice === null) {
    if (logErrors) console.warn('isValidPrice: Failed sanitization for:', price);
    return false;
  }
  
  // Check basic type and NaN/Infinity (redundant but explicit)
  if (typeof sanitizedPrice !== 'number' || !isFinite(sanitizedPrice)) {
    if (logErrors) console.warn('isValidPrice: Invalid number type or infinite:', sanitizedPrice);
    return false;
  }
  
  // Check range bounds
  if (sanitizedPrice < minPrice) {
    if (logErrors) console.warn(`isValidPrice: Price ${sanitizedPrice} below minimum ${minPrice}`);
    return false;
  }
  
  if (sanitizedPrice > maxPrice) {
    if (logErrors) console.warn(`isValidPrice: Price ${sanitizedPrice} above maximum ${maxPrice}`);
    return false;
  }
  
  // Special case: exact zero handling
  if (sanitizedPrice === 0 && !allowExactZero) {
    if (logErrors) console.warn('isValidPrice: Exact zero not allowed');
    return false;
  }
  
  // Special case: exact one handling
  if (sanitizedPrice === 1.00 && !allowExactOne) {
    if (logErrors) console.warn('isValidPrice: Exact 1.00 not allowed');
    return false;
  }
  
  // Check for reasonable decimal precision (Kalshi uses cents)
  const decimalPlaces = (sanitizedPrice.toString().split('.')[1] || '').length;
  if (decimalPlaces > 4) {
    if (logErrors) console.warn(`isValidPrice: Too many decimal places (${decimalPlaces}):`, sanitizedPrice);
    return false;
  }
  
  return true;
}

/**
 * Parse quantity/contracts from quantity input field with validation
 */
function parseQuantity(ticketElement) {
  console.log('Parsing quantity...');
  
  // Handle null/undefined input
  if (!ticketElement || typeof ticketElement.querySelectorAll !== 'function') {
    console.warn('Invalid ticket element provided to parseQuantity');
    return null;
  }
  
  // Strategy 1: Look for number inputs that likely represent quantity
  const numberInputs = ticketElement.querySelectorAll('input[type="number"]');
  for (const input of numberInputs) {
    if (isQuantityInput(input)) {
      // Check if the original value is a valid integer (not decimal)
      const originalValue = input.value;
      if (originalValue && !originalValue.includes('.')) {
        const quantity = parseInt(originalValue);
        if (isValidQuantity(quantity)) {
          console.log(`Found quantity ${quantity} from number input`);
          return quantity;
        }
      }
    }
  }
  
  // Strategy 2: Look for text inputs with quantity patterns
  const textInputs = ticketElement.querySelectorAll('input[type="text"]');
  for (const input of textInputs) {
    if (isQuantityInput(input)) {
      const originalValue = input.value;
      if (originalValue && !originalValue.includes('.')) {
        const quantity = parseInt(originalValue);
        if (isValidQuantity(quantity)) {
          console.log(`Found quantity ${quantity} from text input`);
          return quantity;
        }
      }
    }
  }
  
  // Strategy 3: Look for quantity values in text content
  const quantityPattern = /(\d+)\s*(contracts?|shares?)|quantity:\s*(\d+)/gi;
  const textElements = ticketElement.querySelectorAll('*');
  
  for (const element of textElements) {
    if (element.children.length > 0) continue;
    
    const text = element.textContent?.trim();
    if (text) {
      const matches = [...text.matchAll(quantityPattern)];
      if (matches.length > 0) {
        for (const match of matches) {
          // Extract quantity from either capture group 1 or 3
          const quantityStr = match[1] || match[3];
          const quantity = parseInt(quantityStr);
          if (isValidQuantity(quantity)) {
            console.log(`Found quantity ${quantity} from text content`);
            return quantity;
          }
        }
      }
    }
  }
  
  console.warn('Could not determine quantity from ticket element');
  return null;
}

/**
 * Check if an input element is likely a quantity input
 */
function isQuantityInput(input) {
  // Strong indicators (explicit quantity-related attributes)
  const strongIndicators = [
    input.placeholder?.toLowerCase().includes('quantity'),
    input.placeholder?.toLowerCase().includes('contracts'),
    input.placeholder?.toLowerCase().includes('shares'),
    input.name?.toLowerCase().includes('quantity'),
    input.name?.toLowerCase().includes('contracts'),
    input.id?.toLowerCase().includes('quantity'),
    input.id?.toLowerCase().includes('contracts'),
    input.getAttribute('aria-label')?.toLowerCase().includes('quantity'),
    input.getAttribute('aria-label')?.toLowerCase().includes('contracts')
  ];
  
  // If we have strong indicators, use those
  if (strongIndicators.some(Boolean)) {
    return true;
  }
  
  // Check nearby labels for strong indicators
  const nearbyLabel = input.closest('div, fieldset')?.querySelector('label');
  if (nearbyLabel) {
    const labelText = nearbyLabel.textContent?.toLowerCase();
    if (labelText?.includes('quantity') || labelText?.includes('contracts') || labelText?.includes('shares')) {
      return true;
    }
  }
  
  // Weak indicators (only use if no strong indicators found)
  const weakIndicators = [
    // Value-based indicators (integer values, reasonable range)
    input.step === '1' || input.step === '' || !input.step,
    input.min === '1' || input.min === '0',
    
    // Current value looks like a quantity (but only if it's clearly an integer)
    input.value && !input.value.includes('.') && isValidQuantity(parseInt(input.value))
  ];
  
  // Only return true for weak indicators if we have multiple weak indicators
  const weakCount = weakIndicators.filter(Boolean).length;
  return weakCount >= 2;
}

/**
 * Validate if a quantity value is reasonable with comprehensive edge case handling
 * @param {any} quantity - The quantity value to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if valid, false otherwise
 */
function isValidQuantity(quantity, options = {}) {
  const {
    minQuantity = 1,
    maxQuantity = 10000,
    requireInteger = true,
    logErrors = false
  } = options;
  
  // Sanitize the input first
  const sanitizedQuantity = sanitizeNumericValue(quantity, {
    allowNegative: false,
    allowZero: false,
    maxDecimalPlaces: requireInteger ? 0 : 4
  });
  
  if (sanitizedQuantity === null) {
    if (logErrors) console.warn('isValidQuantity: Failed sanitization for:', quantity);
    return false;
  }
  
  // Check basic type and NaN/Infinity (redundant but explicit)
  if (typeof sanitizedQuantity !== 'number' || !isFinite(sanitizedQuantity)) {
    if (logErrors) console.warn('isValidQuantity: Invalid number type or infinite:', sanitizedQuantity);
    return false;
  }
  
  // Check if integer is required
  if (requireInteger && !Number.isInteger(sanitizedQuantity)) {
    if (logErrors) console.warn('isValidQuantity: Integer required but got:', sanitizedQuantity);
    return false;
  }
  
  // Check range bounds
  if (sanitizedQuantity < minQuantity) {
    if (logErrors) console.warn(`isValidQuantity: Quantity ${sanitizedQuantity} below minimum ${minQuantity}`);
    return false;
  }
  
  if (sanitizedQuantity > maxQuantity) {
    if (logErrors) console.warn(`isValidQuantity: Quantity ${sanitizedQuantity} above maximum ${maxQuantity}`);
    return false;
  }
  
  // Additional safety check for extremely large numbers that might cause issues
  if (sanitizedQuantity > Number.MAX_SAFE_INTEGER) {
    if (logErrors) console.warn('isValidQuantity: Quantity exceeds MAX_SAFE_INTEGER:', sanitizedQuantity);
    return false;
  }
  
  return true;
}

/**
 * Parse fee information from ticket display elements
 * Looks for both total fees and per-contract fees
 */
function parseFeeInformation(ticketElement) {
  console.log('Parsing fee information...');
  
  // Handle null/undefined input
  if (!ticketElement || typeof ticketElement.querySelectorAll !== 'function') {
    console.warn('Invalid ticket element provided to parseFeeInformation');
    return null;
  }
  
  const feeInfo = {
    totalFee: null,
    perContractFee: null,
    feeSource: 'ticket', // 'ticket' or 'estimated'
    rawText: null
  };
  
  // Strategy 1: Look for elements containing fee-related text
  const feePatterns = [
    /fee\s*per\s*contract[:\s]*\$?\s*(\d+\.?\d*)/gi,
    /per\s*contract\s*fee[:\s]*\$?\s*(\d+\.?\d*)/gi,
    /fee[:\s]*\$?\s*(\d+\.?\d*)\s*\/\s*contract/gi,
    /fee[:\s]*\$?\s*(\d+\.?\d*)\s*each/gi,
    /total\s*fee[:\s]*\$?\s*(\d+\.?\d*)/gi,
    /trading\s*fee[:\s]*\$?\s*(\d+\.?\d*)/gi,
    /commission[:\s]*\$?\s*(\d+\.?\d*)/gi,
    /fee[:\s]*\$?\s*(\d+\.?\d*)/gi
  ];
  
  const textElements = ticketElement.querySelectorAll('*');
  
  for (const element of textElements) {
    // Skip elements with many children to avoid parent containers
    if (element.children.length > 2) continue;
    
    const text = element.textContent?.trim();
    if (!text) continue;
    
    // Normalize whitespace for better pattern matching
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    
    // Test each fee pattern
    for (const pattern of feePatterns) {
      pattern.lastIndex = 0; // Reset regex
      const match = pattern.exec(normalizedText);
      if (match) {
        const feeValue = parseFloat(match[1]);
        if (isValidFee(feeValue)) {
          console.log(`Found fee ${feeValue} from text: "${text}"`);
          
          // Determine if this is total or per-contract fee based on pattern
          const patternStr = pattern.source.toLowerCase();
          const isPerContract = patternStr.includes('per') || 
                               patternStr.includes('each') ||
                               patternStr.includes('/');
          
          if (isPerContract) {
            feeInfo.perContractFee = feeValue;
          } else {
            feeInfo.totalFee = feeValue;
          }
          
          feeInfo.rawText = text;
          break;
        }
      }
    }
    
    if (feeInfo.totalFee || feeInfo.perContractFee) break;
  }
  
  // Strategy 2: Look for fee information in structured data (tables, lists)
  if (!feeInfo.totalFee && !feeInfo.perContractFee) {
    const structuredElements = ticketElement.querySelectorAll('tr, li, dt, dd');
    
    for (const element of structuredElements) {
      const text = element.textContent?.toLowerCase().trim();
      if (text?.includes('fee') && text.includes('$')) {
        const feeMatch = text.match(/\$(\d+\.?\d*)/);
        if (feeMatch) {
          const feeValue = parseFloat(feeMatch[1]);
          if (isValidFee(feeValue)) {
            console.log(`Found fee ${feeValue} from structured element`);
            feeInfo.totalFee = feeValue;
            feeInfo.rawText = element.textContent?.trim();
            break;
          }
        }
      }
    }
  }
  
  if (!feeInfo.totalFee && !feeInfo.perContractFee) {
    console.warn('Could not determine fee information from ticket element');
    return null;
  }
  
  return feeInfo;
}

/**
 * Validate if a fee value is reasonable with comprehensive edge case handling
 * @param {any} fee - The fee value to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if valid, false otherwise
 */
function isValidFee(fee, options = {}) {
  const {
    minFee = 0,
    maxFee = 1000,
    allowZero = true,
    maxDecimalPlaces = 4,
    logErrors = false
  } = options;
  
  // Sanitize the input first
  const sanitizedFee = sanitizeNumericValue(fee, {
    allowNegative: false,
    allowZero: allowZero,
    maxDecimalPlaces: maxDecimalPlaces
  });
  
  if (sanitizedFee === null) {
    if (logErrors) console.warn('isValidFee: Failed sanitization for:', fee);
    return false;
  }
  
  // Check basic type and NaN/Infinity (redundant but explicit)
  if (typeof sanitizedFee !== 'number' || !isFinite(sanitizedFee)) {
    if (logErrors) console.warn('isValidFee: Invalid number type or infinite:', sanitizedFee);
    return false;
  }
  
  // Check range bounds
  if (sanitizedFee < minFee) {
    if (logErrors) console.warn(`isValidFee: Fee ${sanitizedFee} below minimum ${minFee}`);
    return false;
  }
  
  if (sanitizedFee > maxFee) {
    if (logErrors) console.warn(`isValidFee: Fee ${sanitizedFee} above maximum ${maxFee}`);
    return false;
  }
  
  // Special validation for zero fees
  if (sanitizedFee === 0 && !allowZero) {
    if (logErrors) console.warn('isValidFee: Zero fee not allowed');
    return false;
  }
  
  // Check for reasonable decimal precision (fees should be in cents)
  const decimalPlaces = (sanitizedFee.toString().split('.')[1] || '').length;
  if (decimalPlaces > maxDecimalPlaces) {
    if (logErrors) console.warn(`isValidFee: Too many decimal places (${decimalPlaces}):`, sanitizedFee);
    return false;
  }
  
  return true;
}

/**
 * Validate American odds value with comprehensive edge case handling
 * @param {any} odds - The odds value to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if valid, false otherwise
 */
function isValidAmericanOdds(odds, options = {}) {
  const {
    minOdds = -10000,
    maxOdds = 10000,
    allowZero = false,
    allowExactHundred = true,
    logErrors = false
  } = options;
  
  // Sanitize the input first
  const sanitizedOdds = sanitizeNumericValue(odds, {
    allowNegative: true,
    allowZero: allowZero,
    maxDecimalPlaces: 0 // American odds are typically integers
  });
  
  if (sanitizedOdds === null) {
    if (logErrors) console.warn('isValidAmericanOdds: Failed sanitization for:', odds);
    return false;
  }
  
  // Check basic type and NaN/Infinity
  if (typeof sanitizedOdds !== 'number' || !isFinite(sanitizedOdds)) {
    if (logErrors) console.warn('isValidAmericanOdds: Invalid number type or infinite:', sanitizedOdds);
    return false;
  }
  
  // American odds cannot be between -100 and +100 (exclusive), except for exactly +100
  if (sanitizedOdds > -100 && sanitizedOdds < 100) {
    if (sanitizedOdds === 0 && allowZero) {
      return true;
    }
    if (logErrors) console.warn('isValidAmericanOdds: Odds in invalid range (-100 to +100):', sanitizedOdds);
    return false;
  }
  
  // Check range bounds
  if (sanitizedOdds < minOdds) {
    if (logErrors) console.warn(`isValidAmericanOdds: Odds ${sanitizedOdds} below minimum ${minOdds}`);
    return false;
  }
  
  if (sanitizedOdds > maxOdds) {
    if (logErrors) console.warn(`isValidAmericanOdds: Odds ${sanitizedOdds} above maximum ${maxOdds}`);
    return false;
  }
  
  // Check if it should be an integer (American odds are typically whole numbers)
  if (!Number.isInteger(sanitizedOdds)) {
    if (logErrors) console.warn('isValidAmericanOdds: American odds should be integers:', sanitizedOdds);
    return false;
  }
  
  return true;
}

/**
 * Validate probability value with comprehensive edge case handling
 * @param {any} probability - The probability value to validate (0-1 range)
 * @param {Object} options - Validation options
 * @returns {boolean} True if valid, false otherwise
 */
function isValidProbability(probability, options = {}) {
  const {
    minProbability = 0,
    maxProbability = 1,
    allowExactZero = true,
    allowExactOne = true,
    maxDecimalPlaces = 6,
    logErrors = false
  } = options;
  
  // Sanitize the input first
  const sanitizedProb = sanitizeNumericValue(probability, {
    allowNegative: false,
    allowZero: allowExactZero,
    maxDecimalPlaces: maxDecimalPlaces
  });
  
  if (sanitizedProb === null) {
    if (logErrors) console.warn('isValidProbability: Failed sanitization for:', probability);
    return false;
  }
  
  // Check basic type and NaN/Infinity
  if (typeof sanitizedProb !== 'number' || !isFinite(sanitizedProb)) {
    if (logErrors) console.warn('isValidProbability: Invalid number type or infinite:', sanitizedProb);
    return false;
  }
  
  // Check range bounds
  if (sanitizedProb < minProbability) {
    if (logErrors) console.warn(`isValidProbability: Probability ${sanitizedProb} below minimum ${minProbability}`);
    return false;
  }
  
  if (sanitizedProb > maxProbability) {
    if (logErrors) console.warn(`isValidProbability: Probability ${sanitizedProb} above maximum ${maxProbability}`);
    return false;
  }
  
  // Special cases for exact bounds
  if (sanitizedProb === 0 && !allowExactZero) {
    if (logErrors) console.warn('isValidProbability: Exact zero not allowed');
    return false;
  }
  
  if (sanitizedProb === 1 && !allowExactOne) {
    if (logErrors) console.warn('isValidProbability: Exact one not allowed');
    return false;
  }
  
  return true;
}

/**
 * Comprehensive validation function for all parsed numeric values
 * @param {Object} values - Object containing numeric values to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation results with detailed error information
 */
function validateAllNumericValues(values, options = {}) {
  const {
    logErrors = false,
    strictMode = false // If true, fails on any validation error
  } = options;
  
  const results = {
    isValid: true,
    errors: [],
    warnings: [],
    sanitizedValues: {},
    validationDetails: {}
  };
  
  // Validate price if present
  if (values.price !== undefined && values.price !== null) {
    const sanitizedPrice = sanitizeNumericValue(values.price, {
      allowNegative: false,
      allowZero: false,
      maxDecimalPlaces: 4
    });
    
    const priceValid = sanitizedPrice !== null && isValidPrice(sanitizedPrice, { logErrors });
    
    results.sanitizedValues.price = sanitizedPrice;
    results.validationDetails.price = {
      original: values.price,
      sanitized: sanitizedPrice,
      isValid: priceValid,
      errors: priceValid ? [] : [`Invalid price: ${values.price}`]
    };
    
    if (!priceValid) {
      results.errors.push(`Price validation failed: ${values.price}`);
      if (strictMode) results.isValid = false;
    }
  }
  
  // Validate quantity if present
  if (values.quantity !== undefined && values.quantity !== null) {
    const sanitizedQuantity = sanitizeNumericValue(values.quantity, {
      allowNegative: false,
      allowZero: false,
      maxDecimalPlaces: 0
    });
    
    const quantityValid = sanitizedQuantity !== null && isValidQuantity(sanitizedQuantity, { logErrors });
    
    results.sanitizedValues.quantity = sanitizedQuantity;
    results.validationDetails.quantity = {
      original: values.quantity,
      sanitized: sanitizedQuantity,
      isValid: quantityValid,
      errors: quantityValid ? [] : [`Invalid quantity: ${values.quantity}`]
    };
    
    if (!quantityValid) {
      results.errors.push(`Quantity validation failed: ${values.quantity}`);
      if (strictMode) results.isValid = false;
    }
  }
  
  // Validate fee if present
  if (values.fee !== undefined && values.fee !== null) {
    const sanitizedFee = sanitizeNumericValue(values.fee, {
      allowNegative: false,
      allowZero: true,
      maxDecimalPlaces: 4
    });
    
    const feeValid = sanitizedFee !== null && isValidFee(sanitizedFee, { logErrors });
    
    results.sanitizedValues.fee = sanitizedFee;
    results.validationDetails.fee = {
      original: values.fee,
      sanitized: sanitizedFee,
      isValid: feeValid,
      errors: feeValid ? [] : [`Invalid fee: ${values.fee}`]
    };
    
    if (!feeValid) {
      results.errors.push(`Fee validation failed: ${values.fee}`);
      if (strictMode) results.isValid = false;
    }
  }
  
  // Validate odds if present
  if (values.odds !== undefined && values.odds !== null) {
    const sanitizedOdds = sanitizeNumericValue(values.odds, {
      allowNegative: true,
      allowZero: false,
      maxDecimalPlaces: 0
    });
    
    const oddsValid = sanitizedOdds !== null && isValidAmericanOdds(sanitizedOdds, { logErrors });
    
    results.sanitizedValues.odds = sanitizedOdds;
    results.validationDetails.odds = {
      original: values.odds,
      sanitized: sanitizedOdds,
      isValid: oddsValid,
      errors: oddsValid ? [] : [`Invalid odds: ${values.odds}`]
    };
    
    if (!oddsValid) {
      results.errors.push(`Odds validation failed: ${values.odds}`);
      if (strictMode) results.isValid = false;
    }
  }
  
  // Validate probability if present
  if (values.probability !== undefined && values.probability !== null) {
    const sanitizedProb = sanitizeNumericValue(values.probability, {
      allowNegative: false,
      allowZero: true,
      maxDecimalPlaces: 6
    });
    
    const probValid = sanitizedProb !== null && isValidProbability(sanitizedProb, { logErrors });
    
    results.sanitizedValues.probability = sanitizedProb;
    results.validationDetails.probability = {
      original: values.probability,
      sanitized: sanitizedProb,
      isValid: probValid,
      errors: probValid ? [] : [`Invalid probability: ${values.probability}`]
    };
    
    if (!probValid) {
      results.errors.push(`Probability validation failed: ${values.probability}`);
      if (strictMode) results.isValid = false;
    }
  }
  
  // Set overall validity
  if (!strictMode) {
    // In non-strict mode, valid if we have at least one valid critical value
    const hasCriticalValues = results.sanitizedValues.price !== undefined || 
                             results.sanitizedValues.quantity !== undefined;
    const criticalValuesValid = (results.validationDetails.price?.isValid !== false) &&
                               (results.validationDetails.quantity?.isValid !== false);
    
    results.isValid = hasCriticalValues && criticalValuesValid;
  }
  
  // Log results if requested
  if (logErrors && results.errors.length > 0) {
    console.warn('validateAllNumericValues: Validation errors:', results.errors);
  }
  
  return results;
}

/**
 * Parse order side with comprehensive error handling and fallback strategies
 */
function parseOrderSideWithFallback(ticketElement) {
  try {
    // Validate element access first
    validateElementAccess(ticketElement, 'parseOrderSideWithFallback');
    
    // Primary strategy: Use the main parsing function
    const result = parseOrderSide(ticketElement);
    if (result) {
      console.log('✅ Order side parsed successfully:', result);
      return result;
    }
    
    // Fallback strategy 1: Look for any button or element with YES/NO text
    console.log('🔄 Attempting fallback strategy 1: Broad YES/NO text search');
    const fallback1Result = parseOrderSideFallback1(ticketElement);
    if (fallback1Result) {
      console.log('✅ Order side found via fallback 1:', fallback1Result);
      return fallback1Result;
    }
    
    // Fallback strategy 2: Look for form values or data attributes
    console.log('🔄 Attempting fallback strategy 2: Form values and attributes');
    const fallback2Result = parseOrderSideFallback2(ticketElement);
    if (fallback2Result) {
      console.log('✅ Order side found via fallback 2:', fallback2Result);
      return fallback2Result;
    }
    
    // Fallback strategy 3: Look for URL parameters or page context
    console.log('🔄 Attempting fallback strategy 3: URL and page context');
    const fallback3Result = parseOrderSideFallback3(ticketElement);
    if (fallback3Result) {
      console.log('✅ Order side found via fallback 3:', fallback3Result);
      return fallback3Result;
    }
    
    console.warn('❌ All order side parsing strategies failed');
    return null;
    
  } catch (error) {
    logParsingError('parseOrderSideWithFallback', `Critical error: ${error.message}`, ticketElement, error);
    return null;
  }
}

/**
 * Fallback strategy 1: Broad YES/NO text search
 */
function parseOrderSideFallback1(ticketElement) {
  return safeExecute('parseOrderSideFallback1', () => {
    // Look for any element containing YES or NO text
    const allElements = ticketElement.querySelectorAll('*');
    const candidates = [];
    
    for (const element of allElements) {
      const text = element.textContent?.trim().toUpperCase();
      if (text === 'YES' || text === 'NO') {
        candidates.push({ element, text, score: 0 });
      }
    }
    
    // Score candidates based on visual indicators
    for (const candidate of candidates) {
      const element = candidate.element;
      const computedStyle = window.getComputedStyle(element);
      const parent = element.parentElement;
      const parentStyle = parent ? window.getComputedStyle(parent) : null;
      
      // Score based on selection indicators
      if (element.classList.contains('selected') || element.classList.contains('active')) {
        candidate.score += 10;
      }
      if (parent && (parent.classList.contains('selected') || parent.classList.contains('active'))) {
        candidate.score += 8;
      }
      if (element.getAttribute('aria-pressed') === 'true' || element.getAttribute('aria-selected') === 'true') {
        candidate.score += 10;
      }
      if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        candidate.score += 5;
      }
      if (parentStyle && parentStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        candidate.score += 3;
      }
      
      // Score based on element type
      if (element.tagName === 'BUTTON') {
        candidate.score += 5;
      }
      if (element.tagName === 'INPUT') {
        candidate.score += 3;
      }
    }
    
    // Return the highest scoring candidate
    candidates.sort((a, b) => b.score - a.score);
    return candidates.length > 0 && candidates[0].score > 0 ? candidates[0].text : null;
  }, null, ticketElement);
}

/**
 * Fallback strategy 2: Form values and attributes
 */
function parseOrderSideFallback2(ticketElement) {
  return safeExecute('parseOrderSideFallback2', () => {
    // Check form inputs for YES/NO values
    const inputs = ticketElement.querySelectorAll('input, select');
    for (const input of inputs) {
      // Check input value
      const value = input.value?.trim().toUpperCase();
      if (value === 'YES' || value === 'NO') {
        return value;
      }
      
      // Check data attributes
      const dataAttributes = ['data-side', 'data-value', 'data-option'];
      for (const attr of dataAttributes) {
        const attrValue = input.getAttribute(attr)?.trim().toUpperCase();
        if (attrValue === 'YES' || attrValue === 'NO') {
          return attrValue;
        }
      }
      
      // Check if this is a radio button or checkbox that's checked
      if ((input.type === 'radio' || input.type === 'checkbox') && input.checked) {
        // Look at nearby labels
        const label = input.closest('label') || 
                     ticketElement.querySelector(`label[for="${input.id}"]`);
        if (label) {
          const labelText = label.textContent?.trim().toUpperCase();
          if (labelText === 'YES' || labelText === 'NO') {
            return labelText;
          }
        }
      }
    }
    
    return null;
  }, null, ticketElement);
}

/**
 * Fallback strategy 3: URL and page context
 */
function parseOrderSideFallback3(ticketElement) {
  return safeExecute('parseOrderSideFallback3', () => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sideParam = urlParams.get('side')?.toUpperCase();
    if (sideParam === 'YES' || sideParam === 'NO') {
      console.log('Found side in URL parameters:', sideParam);
      return sideParam;
    }
    
    // Check page title or meta information
    const pageTitle = document.title?.toUpperCase();
    if (pageTitle && (pageTitle.includes('YES') || pageTitle.includes('NO'))) {
      // This is a weak indicator, only use if we have additional context
      const hasOrderContext = ticketElement.textContent?.toLowerCase().includes('order');
      if (hasOrderContext) {
        if (pageTitle.includes('YES')) return 'YES';
        if (pageTitle.includes('NO')) return 'NO';
      }
    }
    
    return null;
  }, null, ticketElement);
}

/**
 * Parse limit price with comprehensive error handling and fallback strategies
 */
function parseLimitPriceWithFallback(ticketElement) {
  try {
    validateElementAccess(ticketElement, 'parseLimitPriceWithFallback');
    
    // Primary strategy: Use the main parsing function
    const result = parseLimitPrice(ticketElement);
    if (result !== null && isValidPrice(result)) {
      console.log('✅ Limit price parsed successfully:', result);
      return result;
    }
    
    // Fallback strategy 1: Look for any numeric input with price-like values
    console.log('🔄 Attempting fallback strategy 1: Numeric inputs with price values');
    const fallback1Result = parseLimitPriceFallback1(ticketElement);
    if (fallback1Result !== null) {
      console.log('✅ Limit price found via fallback 1:', fallback1Result);
      return fallback1Result;
    }
    
    // Fallback strategy 2: Parse from any text containing price patterns
    console.log('🔄 Attempting fallback strategy 2: Text content price patterns');
    const fallback2Result = parseLimitPriceFallback2(ticketElement);
    if (fallback2Result !== null) {
      console.log('✅ Limit price found via fallback 2:', fallback2Result);
      return fallback2Result;
    }
    
    // Fallback strategy 3: Look for default or placeholder values
    console.log('🔄 Attempting fallback strategy 3: Default and placeholder values');
    const fallback3Result = parseLimitPriceFallback3(ticketElement);
    if (fallback3Result !== null) {
      console.log('✅ Limit price found via fallback 3:', fallback3Result);
      return fallback3Result;
    }
    
    console.warn('❌ All limit price parsing strategies failed');
    return null;
    
  } catch (error) {
    logParsingError('parseLimitPriceWithFallback', `Critical error: ${error.message}`, ticketElement, error);
    return null;
  }
}

/**
 * Fallback strategy 1: Numeric inputs with price values
 */
function parseLimitPriceFallback1(ticketElement) {
  return safeExecute('parseLimitPriceFallback1', () => {
    const allInputs = ticketElement.querySelectorAll('input');
    const priceInputs = [];
    
    for (const input of allInputs) {
      const value = parseFloat(input.value);
      if (!isNaN(value) && value >= 0.01 && value <= 1.00) {
        priceInputs.push({ input, value, score: 0 });
      }
    }
    
    // Score inputs based on likelihood of being price inputs
    for (const candidate of priceInputs) {
      const input = candidate.input;
      
      // Score based on input attributes
      if (input.type === 'number') candidate.score += 5;
      if (input.step === '0.01') candidate.score += 5;
      if (input.min === '0.01' || input.min === '0') candidate.score += 3;
      if (input.max === '0.99' || input.max === '1' || input.max === '1.00') candidate.score += 3;
      
      // Score based on nearby text
      const nearbyText = input.closest('div, fieldset')?.textContent?.toLowerCase() || '';
      if (nearbyText.includes('price')) candidate.score += 10;
      if (nearbyText.includes('limit')) candidate.score += 8;
      if (nearbyText.includes('cost')) candidate.score += 5;
      
      // Score based on position (price inputs often come before quantity)
      const allNumberInputs = Array.from(ticketElement.querySelectorAll('input[type="number"]'));
      const position = allNumberInputs.indexOf(input);
      if (position === 0) candidate.score += 3; // First numeric input often price
    }
    
    // Return the highest scoring candidate
    priceInputs.sort((a, b) => b.score - a.score);
    return priceInputs.length > 0 && priceInputs[0].score > 0 ? priceInputs[0].value : null;
  }, null, ticketElement);
}

/**
 * Fallback strategy 2: Text content price patterns
 */
function parseLimitPriceFallback2(ticketElement) {
  return safeExecute('parseLimitPriceFallback2', () => {
    // Look for price patterns in all text content
    const pricePatterns = [
      /price[:\s]*\$?(0\.\d{2}|1\.00)/gi,
      /limit[:\s]*\$?(0\.\d{2}|1\.00)/gi,
      /cost[:\s]*\$?(0\.\d{2}|1\.00)/gi,
      /\$?(0\.\d{2}|1\.00)\s*(?:per|each|limit|price)/gi,
      /\$?(0\.\d{2}|1\.00)/g
    ];
    
    const textElements = ticketElement.querySelectorAll('*');
    const candidates = [];
    
    for (const element of textElements) {
      if (element.children.length > 0) continue; // Skip parent elements
      
      const text = element.textContent?.trim();
      if (!text) continue;
      
      for (let i = 0; i < pricePatterns.length; i++) {
        const pattern = pricePatterns[i];
        pattern.lastIndex = 0; // Reset regex
        const match = pattern.exec(text);
        
        if (match) {
          const priceStr = match[1] || match[0].replace(/[^0-9.]/g, '');
          const price = parseFloat(priceStr);
          
          if (isValidPrice(price)) {
            candidates.push({
              price,
              score: (pricePatterns.length - i) * 2, // Earlier patterns get higher scores
              element,
              text
            });
          }
        }
      }
    }
    
    // Return the highest scoring candidate
    candidates.sort((a, b) => b.score - a.score);
    return candidates.length > 0 ? candidates[0].price : null;
  }, null, ticketElement);
}

/**
 * Fallback strategy 3: Default and placeholder values
 */
function parseLimitPriceFallback3(ticketElement) {
  return safeExecute('parseLimitPriceFallback3', () => {
    const inputs = ticketElement.querySelectorAll('input');
    
    for (const input of inputs) {
      // Check placeholder values
      const placeholder = input.placeholder;
      if (placeholder) {
        const placeholderPrice = parsePriceFromText(placeholder);
        if (isValidPrice(placeholderPrice)) {
          console.log('Found price in placeholder:', placeholderPrice);
          return placeholderPrice;
        }
      }
      
      // Check default values
      const defaultValue = input.defaultValue;
      if (defaultValue) {
        const defaultPrice = parsePriceFromText(defaultValue);
        if (isValidPrice(defaultPrice)) {
          console.log('Found price in default value:', defaultPrice);
          return defaultPrice;
        }
      }
      
      // Check data attributes
      const dataAttributes = ['data-price', 'data-value', 'data-default'];
      for (const attr of dataAttributes) {
        const attrValue = input.getAttribute(attr);
        if (attrValue) {
          const attrPrice = parsePriceFromText(attrValue);
          if (isValidPrice(attrPrice)) {
            console.log(`Found price in ${attr}:`, attrPrice);
            return attrPrice;
          }
        }
      }
    }
    
    return null;
  }, null, ticketElement);
}

/**
 * Parse quantity with comprehensive error handling and fallback strategies
 */
function parseQuantityWithFallback(ticketElement) {
  try {
    validateElementAccess(ticketElement, 'parseQuantityWithFallback');
    
    // Primary strategy: Use the main parsing function
    const result = parseQuantity(ticketElement);
    if (result !== null && isValidQuantity(result)) {
      console.log('✅ Quantity parsed successfully:', result);
      return result;
    }
    
    // Fallback strategy 1: Look for any numeric input with quantity-like values
    console.log('🔄 Attempting fallback strategy 1: Numeric inputs with quantity values');
    const fallback1Result = parseQuantityFallback1(ticketElement);
    if (fallback1Result !== null) {
      console.log('✅ Quantity found via fallback 1:', fallback1Result);
      return fallback1Result;
    }
    
    // Fallback strategy 2: Parse from any text containing quantity patterns
    console.log('🔄 Attempting fallback strategy 2: Text content quantity patterns');
    const fallback2Result = parseQuantityFallback2(ticketElement);
    if (fallback2Result !== null) {
      console.log('✅ Quantity found via fallback 2:', fallback2Result);
      return fallback2Result;
    }
    
    // Fallback strategy 3: Use default quantity (1 contract)
    console.log('🔄 Attempting fallback strategy 3: Default quantity');
    const fallback3Result = parseQuantityFallback3(ticketElement);
    if (fallback3Result !== null) {
      console.log('✅ Quantity found via fallback 3:', fallback3Result);
      return fallback3Result;
    }
    
    console.warn('❌ All quantity parsing strategies failed');
    return null;
    
  } catch (error) {
    logParsingError('parseQuantityWithFallback', `Critical error: ${error.message}`, ticketElement, error);
    return null;
  }
}

/**
 * Fallback strategy 1: Numeric inputs with quantity values
 */
function parseQuantityFallback1(ticketElement) {
  return safeExecute('parseQuantityFallback1', () => {
    const allInputs = ticketElement.querySelectorAll('input');
    const quantityInputs = [];
    
    for (const input of allInputs) {
      const value = parseInt(input.value);
      if (!isNaN(value) && value >= 1 && value <= 10000 && Number.isInteger(parseFloat(input.value))) {
        quantityInputs.push({ input, value, score: 0 });
      }
    }
    
    // Score inputs based on likelihood of being quantity inputs
    for (const candidate of quantityInputs) {
      const input = candidate.input;
      
      // Score based on input attributes
      if (input.type === 'number') candidate.score += 5;
      if (input.step === '1' || !input.step) candidate.score += 3;
      if (input.min === '1' || input.min === '0') candidate.score += 3;
      
      // Score based on nearby text
      const nearbyText = input.closest('div, fieldset')?.textContent?.toLowerCase() || '';
      if (nearbyText.includes('quantity')) candidate.score += 10;
      if (nearbyText.includes('contracts')) candidate.score += 10;
      if (nearbyText.includes('shares')) candidate.score += 8;
      if (nearbyText.includes('amount')) candidate.score += 5;
      
      // Negative score for price-like attributes
      if (input.step === '0.01') candidate.score -= 5;
      if (input.max === '1' || input.max === '0.99') candidate.score -= 5;
      
      // Score based on position (quantity inputs often come after price)
      const allNumberInputs = Array.from(ticketElement.querySelectorAll('input[type="number"]'));
      const position = allNumberInputs.indexOf(input);
      if (position === 1) candidate.score += 2; // Second numeric input often quantity
    }
    
    // Return the highest scoring candidate
    quantityInputs.sort((a, b) => b.score - a.score);
    return quantityInputs.length > 0 && quantityInputs[0].score > 0 ? quantityInputs[0].value : null;
  }, null, ticketElement);
}

/**
 * Fallback strategy 2: Text content quantity patterns
 */
function parseQuantityFallback2(ticketElement) {
  return safeExecute('parseQuantityFallback2', () => {
    // Look for quantity patterns in all text content
    const quantityPatterns = [
      /quantity[:\s]*(\d+)/gi,
      /contracts?[:\s]*(\d+)/gi,
      /shares?[:\s]*(\d+)/gi,
      /buy\s+(\d+)\s*(?:contracts?|shares?)/gi,
      /sell\s+(\d+)\s*(?:contracts?|shares?)/gi,
      /(\d+)\s*(?:contracts?|shares?)/gi
    ];
    
    const textElements = ticketElement.querySelectorAll('*');
    const candidates = [];
    
    for (const element of textElements) {
      if (element.children.length > 0) continue; // Skip parent elements
      
      const text = element.textContent?.trim();
      if (!text) continue;
      
      for (let i = 0; i < quantityPatterns.length; i++) {
        const pattern = quantityPatterns[i];
        pattern.lastIndex = 0; // Reset regex
        const match = pattern.exec(text);
        
        if (match) {
          const quantity = parseInt(match[1]);
          
          if (isValidQuantity(quantity)) {
            candidates.push({
              quantity,
              score: (quantityPatterns.length - i) * 2, // Earlier patterns get higher scores
              element,
              text
            });
          }
        }
      }
    }
    
    // Return the highest scoring candidate
    candidates.sort((a, b) => b.score - a.score);
    return candidates.length > 0 ? candidates[0].quantity : null;
  }, null, ticketElement);
}

/**
 * Fallback strategy 3: Default quantity
 */
function parseQuantityFallback3(ticketElement) {
  return safeExecute('parseQuantityFallback3', () => {
    // Check for default values in inputs
    const inputs = ticketElement.querySelectorAll('input');
    
    for (const input of inputs) {
      // Check placeholder values
      const placeholder = input.placeholder;
      if (placeholder) {
        const match = placeholder.match(/(\d+)/);
        if (match) {
          const quantity = parseInt(match[1]);
          if (isValidQuantity(quantity)) {
            console.log('Found quantity in placeholder:', quantity);
            return quantity;
          }
        }
      }
      
      // Check default values
      const defaultValue = input.defaultValue;
      if (defaultValue) {
        const quantity = parseInt(defaultValue);
        if (isValidQuantity(quantity)) {
          console.log('Found quantity in default value:', quantity);
          return quantity;
        }
      }
    }
    
    // Last resort: return 1 as default quantity if we have other valid ticket data
    console.log('Using default quantity of 1 contract');
    return 1;
  }, null, ticketElement);
}

/**
 * Parse fee information with comprehensive error handling and fallback strategies
 */
function parseFeeInformationWithFallback(ticketElement) {
  try {
    validateElementAccess(ticketElement, 'parseFeeInformationWithFallback');
    
    // Primary strategy: Use the main parsing function
    const result = parseFeeInformation(ticketElement);
    if (result && (result.totalFee !== null || result.perContractFee !== null)) {
      console.log('✅ Fee information parsed successfully:', result);
      return result;
    }
    
    // Fallback strategy 1: Look for any fee-related text patterns
    console.log('🔄 Attempting fallback strategy 1: Broad fee text patterns');
    const fallback1Result = parseFeeFallback1(ticketElement);
    if (fallback1Result) {
      console.log('✅ Fee information found via fallback 1:', fallback1Result);
      return fallback1Result;
    }
    
    // Fallback strategy 2: Look for numeric values near fee-related text
    console.log('🔄 Attempting fallback strategy 2: Numeric values near fee text');
    const fallback2Result = parseFeeFallback2(ticketElement);
    if (fallback2Result) {
      console.log('✅ Fee information found via fallback 2:', fallback2Result);
      return fallback2Result;
    }
    
    // Fallback strategy 3: Use estimated fee if enabled in settings
    console.log('🔄 Attempting fallback strategy 3: Estimated fee calculation');
    const fallback3Result = parseFeeFallback3(ticketElement);
    if (fallback3Result) {
      console.log('✅ Fee information found via fallback 3:', fallback3Result);
      return fallback3Result;
    }
    
    console.warn('❌ All fee parsing strategies failed');
    return null;
    
  } catch (error) {
    logParsingError('parseFeeInformationWithFallback', `Critical error: ${error.message}`, ticketElement, error);
    return null;
  }
}

/**
 * Fallback strategy 1: Broad fee text patterns
 */
function parseFeeFallback1(ticketElement) {
  return safeExecute('parseFeeFallback1', () => {
    const broadFeePatterns = [
      /(?:fee|cost|charge|commission)[:\s]*\$?(\d+\.?\d*)/gi,
      /\$(\d+\.?\d*)\s*(?:fee|cost|charge|commission)/gi,
      /total[:\s]*\$?(\d+\.?\d*)/gi,
      /\$(\d+\.?\d*)\s*total/gi
    ];
    
    const textElements = ticketElement.querySelectorAll('*');
    const candidates = [];
    
    for (const element of textElements) {
      if (element.children.length > 2) continue; // Skip complex parent elements
      
      const text = element.textContent?.trim();
      if (!text) continue;
      
      for (let i = 0; i < broadFeePatterns.length; i++) {
        const pattern = broadFeePatterns[i];
        pattern.lastIndex = 0; // Reset regex
        const match = pattern.exec(text);
        
        if (match) {
          const feeValue = parseFloat(match[1]);
          
          if (isValidFee(feeValue)) {
            candidates.push({
              fee: feeValue,
              score: (broadFeePatterns.length - i) * 2,
              element,
              text,
              isPerContract: text.toLowerCase().includes('per') || text.toLowerCase().includes('each')
            });
          }
        }
      }
    }
    
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      
      return {
        totalFee: best.isPerContract ? null : best.fee,
        perContractFee: best.isPerContract ? best.fee : null,
        feeSource: 'ticket',
        rawText: best.text
      };
    }
    
    return null;
  }, null, ticketElement);
}

/**
 * Fallback strategy 2: Numeric values near fee text
 */
function parseFeeFallback2(ticketElement) {
  return safeExecute('parseFeeFallback2', () => {
    // Look for elements containing fee-related keywords
    const feeKeywords = ['fee', 'cost', 'charge', 'commission', 'total'];
    const textElements = ticketElement.querySelectorAll('*');
    
    for (const element of textElements) {
      const text = element.textContent?.toLowerCase().trim();
      if (!text) continue;
      
      // Check if element contains fee keywords
      const hasFeeKeyword = feeKeywords.some(keyword => text.includes(keyword));
      if (!hasFeeKeyword) continue;
      
      // Look for numeric values in nearby elements
      const parent = element.parentElement;
      if (!parent) continue;
      
      const siblings = Array.from(parent.children);
      const nearbyElements = [element, ...siblings];
      
      for (const nearby of nearbyElements) {
        const nearbyText = nearby.textContent?.trim();
        if (!nearbyText) continue;
        
        // Look for dollar amounts
        const dollarMatch = nearbyText.match(/\$(\d+\.?\d*)/);
        if (dollarMatch) {
          const feeValue = parseFloat(dollarMatch[1]);
          if (isValidFee(feeValue)) {
            return {
              totalFee: feeValue,
              perContractFee: null,
              feeSource: 'ticket',
              rawText: `${text} ${nearbyText}`
            };
          }
        }
        
        // Look for standalone numbers
        const numberMatch = nearbyText.match(/^(\d+\.?\d*)$/);
        if (numberMatch) {
          const feeValue = parseFloat(numberMatch[1]);
          if (isValidFee(feeValue) && feeValue < 100) { // Reasonable fee range
            return {
              totalFee: feeValue,
              perContractFee: null,
              feeSource: 'ticket',
              rawText: `${text} ${nearbyText}`
            };
          }
        }
      }
    }
    
    return null;
  }, null, ticketElement);
}

/**
 * Calculate Kalshi fee estimate using published fee schedule
 * Based on Kalshi's official fee formulas:
 * - Taker fees: round_up(0.07 × C × P × (1 - P)) where C = contracts, P = price
 * - Maker fees: round_up(0.0175 × C × P × (1 - P)) where C = contracts, P = price
 * - Some markets may be fee-free for makers
 * 
 * @param {number} price - Contract price (0.01 to 1.00)
 * @param {number} quantity - Number of contracts
 * @param {Object} options - Optional configuration
 * @param {string} options.feeType - 'taker' or 'maker' (defaults to 'taker')
 * @param {boolean} options.assumeMakerFeeFree - Whether to assume maker fees are 0 (defaults to false)
 * @returns {Object|null} Fee estimate object or null if invalid inputs
 */
function calculateKalshiFeeEstimate(price, quantity, options = {}) {
  // Validate inputs
  if (typeof price !== 'number' || typeof quantity !== 'number' || 
      isNaN(price) || isNaN(quantity)) {
    console.warn('calculateKalshiFeeEstimate: Invalid input types', { price, quantity });
    return null;
  }
  
  if (price <= 0 || price > 1.00) {
    console.warn('calculateKalshiFeeEstimate: Price out of valid range (0.01-1.00)', { price });
    return null;
  }
  
  if (quantity <= 0 || !Number.isInteger(quantity)) {
    console.warn('calculateKalshiFeeEstimate: Invalid quantity', { quantity });
    return null;
  }
  
  const { feeType = 'taker', assumeMakerFeeFree = false } = options;
  
  // If assuming maker fees are free (common for many markets)
  if (feeType === 'maker' && assumeMakerFeeFree) {
    return {
      totalFee: 0,
      perContractFee: 0,
      feeType: 'maker (fee-free)',
      formula: 'Fee-free market for makers',
      priceUsed: price,
      quantityUsed: quantity
    };
  }
  
  // Calculate base fee using Kalshi's formula: fee_rate × contracts × price × (1 - price)
  const feeRates = {
    taker: 0.07,    // 7% of P × (1-P)
    maker: 0.0175   // 1.75% of P × (1-P)
  };
  
  const feeRate = feeRates[feeType] || feeRates.taker;
  
  // Calculate the fee per contract using Kalshi's formula
  const baseFeePerContract = feeRate * price * (1 - price);
  
  // Kalshi rounds up to the nearest cent for the total order, then divides by contracts
  const totalBaseFee = baseFeePerContract * quantity;
  const roundedTotalFee = Math.ceil(totalBaseFee * 100) / 100; // Round up to nearest cent
  const actualPerContractFee = roundedTotalFee / quantity;
  
  // Validate the calculated fee is reasonable
  if (actualPerContractFee < 0 || actualPerContractFee > 0.05) { // Max reasonable fee is 5 cents per contract
    console.warn('calculateKalshiFeeEstimate: Calculated fee seems unreasonable', { 
      actualPerContractFee, 
      price, 
      quantity, 
      feeType 
    });
  }
  
  return {
    totalFee: roundedTotalFee,
    perContractFee: actualPerContractFee,
    feeType: feeType,
    formula: `${feeRate} × ${price} × ${(1-price).toFixed(3)} × ${quantity} = $${totalBaseFee.toFixed(4)} → $${roundedTotalFee.toFixed(2)} (rounded up)`,
    priceUsed: price,
    quantityUsed: quantity,
    baseFeePerContract: baseFeePerContract,
    maxFeeAtFiftyPercent: feeRate * 0.5 * 0.5 // Maximum fee occurs at 50% probability
  };
}

/**
 * Fallback strategy 3: Estimated fee calculation using Kalshi's published fee schedule
 */
function parseFeeFallback3(ticketElement) {
  return safeExecute('parseFeeFallback3', () => {
    // Only use estimated fees if enabled in settings
    if (!settings.fallbackEstimateEnabled) {
      console.log('Fee estimation disabled in settings');
      return null;
    }
    
    // Try to get price and quantity for fee estimation
    const price = parseLimitPrice(ticketElement) || 0.5; // Default to 50 cents
    const quantity = parseQuantity(ticketElement) || 1; // Default to 1 contract
    
    // Calculate fee using Kalshi's published fee schedule
    // Default to taker fees since we can't determine maker vs taker from ticket alone
    // For many markets, maker fees are 0, but we'll use taker fees for conservative estimate
    const feeEstimate = calculateKalshiFeeEstimate(price, quantity, { 
      feeType: 'taker',
      assumeMakerFeeFree: false 
    });
    
    if (!feeEstimate) {
      console.warn('Failed to calculate fee estimate using Kalshi formula');
      // Fallback to simple estimation
      const estimatedPerContractFee = 0.01; // $0.01 per contract (simplified)
      const estimatedTotalFee = estimatedPerContractFee * quantity;
    
      console.log(`Estimated fee: $${estimatedTotalFee} total ($${estimatedPerContractFee} per contract)`);
    
    return {
      totalFee: estimatedTotalFee,
      perContractFee: estimatedPerContractFee,
      feeSource: 'estimated',
      rawText: `Estimated based on ${quantity} contracts at $${estimatedPerContractFee} per contract`
    };
    }

    return feeEstimate;
  }, null, ticketElement);
}

/**
 * Attempt to recover from parsing errors by retrying with different strategies
 */
async function attemptTicketDataRecovery(ticketElement, failedTicketData) {
  console.log('🔄 Attempting ticket data recovery...');
  
  const recoveryAttempts = {
    side: null,
    price: null,
    quantity: null,
    fee: null,
    recoveryStrategiesUsed: []
  };
  
  try {
    // Recovery strategy 1: Wait and retry (DOM might still be updating)
    if (!failedTicketData.side || !failedTicketData.price || !failedTicketData.quantity) {
      console.log('🔄 Recovery strategy 1: Delayed retry after DOM stabilization');
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const retryData = await parseTicketData(ticketElement);
            if (retryData.isValid || retryData.validationSummary?.canProceed) {
              console.log('✅ Recovery successful via delayed retry');
              retryData.recoveryStrategiesUsed = ['delayed-retry'];
              resolve(retryData);
            } else {
              // Continue with other recovery strategies
              resolve(attemptAdvancedRecovery(ticketElement, failedTicketData));
            }
          } catch (error) {
            logParsingError('attemptTicketDataRecovery', `Delayed retry failed: ${error.message}`, ticketElement, error);
            resolve(attemptAdvancedRecovery(ticketElement, failedTicketData));
          }
        }, 500); // Wait 500ms for DOM to stabilize
      });
    }
    
    return attemptAdvancedRecovery(ticketElement, failedTicketData);
    
  } catch (error) {
    logParsingError('attemptTicketDataRecovery', `Recovery attempt failed: ${error.message}`, ticketElement, error);
    return failedTicketData;
  }
}

/**
 * Advanced recovery strategies for ticket data
 */
function attemptAdvancedRecovery(ticketElement, failedTicketData) {
  console.log('🔄 Attempting advanced recovery strategies...');
  
  const recoveredData = { ...failedTicketData };
  const strategiesUsed = [];
  
  try {
    // Recovery strategy 2: Look for ticket data in parent/ancestor elements
    if (!recoveredData.side || !recoveredData.price || !recoveredData.quantity) {
      console.log('🔄 Recovery strategy 2: Searching parent elements');
      
      let currentElement = ticketElement.parentElement;
      let depth = 0;
      const maxDepth = 3;
      
      while (currentElement && depth < maxDepth) {
        const parentData = parseTicketData(currentElement);
        
        if (!recoveredData.side && parentData.side) {
          recoveredData.side = parentData.side;
          strategiesUsed.push('parent-side-search');
        }
        if (!recoveredData.price && parentData.price) {
          recoveredData.price = parentData.price;
          strategiesUsed.push('parent-price-search');
        }
        if (!recoveredData.quantity && parentData.quantity) {
          recoveredData.quantity = parentData.quantity;
          strategiesUsed.push('parent-quantity-search');
        }
        if (!recoveredData.fee && parentData.fee) {
          recoveredData.fee = parentData.fee;
          strategiesUsed.push('parent-fee-search');
        }
        
        currentElement = currentElement.parentElement;
        depth++;
      }
    }
    
    // Recovery strategy 3: Use document-wide search for ticket elements
    if (!recoveredData.side || !recoveredData.price || !recoveredData.quantity) {
      console.log('🔄 Recovery strategy 3: Document-wide ticket element search');
      
      const allTicketCandidates = document.querySelectorAll('[class*="ticket"], [class*="order"], [class*="modal"], [role="dialog"]');
      
      for (const candidate of allTicketCandidates) {
        if (candidate === ticketElement) continue; // Skip the original element
        
        const candidateData = parseTicketData(candidate);
        
        if (!recoveredData.side && candidateData.side) {
          recoveredData.side = candidateData.side;
          strategiesUsed.push('document-wide-side-search');
        }
        if (!recoveredData.price && candidateData.price) {
          recoveredData.price = candidateData.price;
          strategiesUsed.push('document-wide-price-search');
        }
        if (!recoveredData.quantity && candidateData.quantity) {
          recoveredData.quantity = candidateData.quantity;
          strategiesUsed.push('document-wide-quantity-search');
        }
        if (!recoveredData.fee && candidateData.fee) {
          recoveredData.fee = candidateData.fee;
          strategiesUsed.push('document-wide-fee-search');
        }
        
        // Stop if we found all critical data
        if (recoveredData.side && recoveredData.price && recoveredData.quantity) {
          break;
        }
      }
    }
    
    // Recovery strategy 4: Use reasonable defaults for missing non-critical data
    if (!recoveredData.quantity && recoveredData.side && recoveredData.price) {
      console.log('🔄 Recovery strategy 4: Using default quantity');
      recoveredData.quantity = 1; // Default to 1 contract
      strategiesUsed.push('default-quantity');
    }
    
    // Recovery strategy 5: Estimate missing fee information
    if (!recoveredData.fee && settings.fallbackEstimateEnabled && recoveredData.price && recoveredData.quantity) {
      console.log('🔄 Recovery strategy 5: Estimating fee information');
      
      // Use the enhanced fee calculation for recovery
      const feeEstimate = calculateKalshiFeeEstimate(recoveredData.price, recoveredData.quantity, { 
        feeType: 'taker',
        assumeMakerFeeFree: false 
      });
      
      if (feeEstimate) {
        recoveredData.fee = {
          totalFee: feeEstimate.totalFee,
          perContractFee: feeEstimate.perContractFee,
          feeSource: 'estimated',
          rawText: `Recovery estimate: ${recoveredData.quantity} contracts × $${feeEstimate.perContractFee.toFixed(4)} = $${feeEstimate.totalFee.toFixed(4)} (${feeEstimate.feeType} fee)`
        };
      } else {
        // Fallback to simple estimation if calculation fails
        recoveredData.fee = {
          totalFee: 0.01 * recoveredData.quantity,
          perContractFee: 0.01,
          feeSource: 'estimated',
          rawText: 'Simple estimate during recovery (fallback)'
        };
      }
      strategiesUsed.push('estimated-fee');
    }
    
    // Update recovery information
    recoveredData.recoveryStrategiesUsed = strategiesUsed;
    recoveredData.wasRecovered = strategiesUsed.length > 0;
    
    // Re-validate the recovered data
    validateTicketData(recoveredData);
    
    if (recoveredData.isValid || recoveredData.validationSummary?.canProceed) {
      console.log('✅ Advanced recovery successful', {
        strategiesUsed,
        recoveredFields: {
          side: !!recoveredData.side,
          price: recoveredData.price !== null,
          quantity: recoveredData.quantity !== null,
          fee: !!recoveredData.fee
        }
      });
    } else {
      console.warn('⚠️ Advanced recovery partially successful but data still invalid', {
        strategiesUsed,
        errors: recoveredData.errors
      });
    }
    
    return recoveredData;
    
  } catch (error) {
    logParsingError('attemptAdvancedRecovery', `Advanced recovery failed: ${error.message}`, ticketElement, error);
    return failedTicketData;
  }
}

/**
 * Enhanced error logging with recovery suggestions
 */
function logParsingErrorWithRecovery(functionName, message, element, error = null, suggestedRecovery = null) {
  // Use the existing logParsingError function
  logParsingError(functionName, message, element, error);
  
  // Add recovery suggestions
  if (suggestedRecovery) {
    console.log(`💡 Recovery suggestion for ${functionName}:`, suggestedRecovery);
  }
  
  // Add common recovery suggestions based on function name
  const commonRecoveryStrategies = {
    'parseOrderSide': [
      'Check if YES/NO buttons are visible and clickable',
      'Look for radio buttons or select elements with side selection',
      'Verify the ticket modal is fully loaded'
    ],
    'parseLimitPrice': [
      'Ensure price input field is visible and accessible',
      'Check if price is within valid range ($0.01 - $1.00)',
      'Look for price display in ticket summary area'
    ],
    'parseQuantity': [
      'Verify quantity input field is visible and contains integer values',
      'Check for quantity display in order summary',
      'Ensure quantity is within valid range (1 - 10,000)'
    ],
    'parseFeeInformation': [
      'Look for fee information in ticket summary or breakdown',
      'Check if fee calculation is complete',
      'Consider enabling fallback fee estimation in settings'
    ]
  };
  
  const strategies = commonRecoveryStrategies[functionName];
  if (strategies) {
    console.log(`💡 Common recovery strategies for ${functionName}:`, strategies);
  }
}

/**
 * Monitor parsing performance using centralized logging system
 * @deprecated This function is now handled by KalshiLogger.measurePerformance()
 */
function monitorParsingPerformance(ticketData) {
  // This function is now deprecated as performance monitoring is handled
  // by KalshiLogger.measurePerformance() and KalshiLogger.recordPerformance()
  
  if (!ticketData.parseTime) return;
  
  KalshiLogger.debug('PERFORMANCE', 'Legacy performance monitoring called', {
    parseTime: ticketData.parseTime,
    fallbacksUsed: ticketData.fallbacksUsed?.length || 0,
    errors: ticketData.errors?.length || 0,
    note: 'Consider using KalshiLogger.measurePerformance() for new code'
  });
  
  // For backward compatibility, still record basic stats
  const performanceThresholds = {
    fast: 50,
    acceptable: 200,
    slow: 500,
    critical: 1000
  };
  
  let performanceLevel = 'fast';
  if (ticketData.parseTime >= performanceThresholds.critical) {
    performanceLevel = 'critical';
  } else if (ticketData.parseTime >= performanceThresholds.slow) {
    performanceLevel = 'slow';
  } else if (ticketData.parseTime >= performanceThresholds.acceptable) {
    performanceLevel = 'acceptable';
  }
  
  // Use centralized logging for performance warnings
  if (performanceLevel === 'slow' || performanceLevel === 'critical') {
    KalshiLogger.warn('PERFORMANCE', `Slow ticket parsing detected via legacy monitor`, {
      parseTime: ticketData.parseTime.toFixed(2) + 'ms',
      performanceLevel,
      fallbacksUsed: ticketData.fallbacksUsed?.length || 0,
      errors: ticketData.errors?.length || 0,
      suggestions: KalshiLogger.getPerformanceSuggestions('PARSING', 'parseTicketData', ticketData.parseTime)
    });
  }
}

/**
 * Validate parsed ticket data and populate errors array
 */
function validateTicketData(ticketData) {
  ticketData.errors = [];
  let criticalErrors = 0;
  let warningCount = 0;
  
  // Validate side with detailed error reporting
  if (!ticketData.side) {
    ticketData.errors.push('Order side (YES/NO) not found - ticket may be in invalid state');
    criticalErrors++;
  } else if (ticketData.side !== 'YES' && ticketData.side !== 'NO') {
    ticketData.errors.push(`Invalid order side: "${ticketData.side}" - expected YES or NO`);
    criticalErrors++;
  } else {
    console.log('✅ Order side validation passed:', ticketData.side);
  }
  
  // Validate price with detailed error reporting and recovery suggestions
  if (ticketData.price === null) {
    ticketData.errors.push('Limit price not found - check if price input is visible and accessible');
    criticalErrors++;
  } else if (!isValidPrice(ticketData.price)) {
    if (ticketData.price < 0.01) {
      ticketData.errors.push(`Price too low: $${ticketData.price} - minimum is $0.01`);
    } else if (ticketData.price > 1.00) {
      ticketData.errors.push(`Price too high: $${ticketData.price} - maximum is $1.00`);
    } else {
      ticketData.errors.push(`Invalid price format: ${ticketData.price} - must be between $0.01 and $1.00`);
    }
    criticalErrors++;
  } else {
    console.log('✅ Price validation passed:', ticketData.price);
  }
  
  // Validate quantity with detailed error reporting and recovery suggestions
  if (ticketData.quantity === null) {
    ticketData.errors.push('Quantity not found - check if quantity input is visible and accessible');
    criticalErrors++;
  } else if (!isValidQuantity(ticketData.quantity)) {
    if (!Number.isInteger(ticketData.quantity)) {
      ticketData.errors.push(`Quantity must be a whole number: ${ticketData.quantity}`);
    } else if (ticketData.quantity < 1) {
      ticketData.errors.push(`Quantity too low: ${ticketData.quantity} - minimum is 1 contract`);
    } else if (ticketData.quantity > 10000) {
      ticketData.errors.push(`Quantity too high: ${ticketData.quantity} - maximum is 10,000 contracts`);
    } else {
      ticketData.errors.push(`Invalid quantity: ${ticketData.quantity} - must be between 1 and 10,000`);
    }
    criticalErrors++;
  } else {
    console.log('✅ Quantity validation passed:', ticketData.quantity);
  }
  
  // Validate fee information (optional but validate if present)
  if (ticketData.fee) {
    let feeErrors = [];
    
    if (ticketData.fee.totalFee !== null) {
      if (!isValidFee(ticketData.fee.totalFee)) {
        if (ticketData.fee.totalFee < 0) {
          feeErrors.push(`Negative total fee: $${ticketData.fee.totalFee}`);
        } else if (ticketData.fee.totalFee > 1000) {
          feeErrors.push(`Total fee too high: $${ticketData.fee.totalFee} - seems unreasonable`);
        } else {
          feeErrors.push(`Invalid total fee: ${ticketData.fee.totalFee}`);
        }
      }
    }
    
    if (ticketData.fee.perContractFee !== null) {
      if (!isValidFee(ticketData.fee.perContractFee)) {
        if (ticketData.fee.perContractFee < 0) {
          feeErrors.push(`Negative per-contract fee: $${ticketData.fee.perContractFee}`);
        } else if (ticketData.fee.perContractFee > 100) {
          feeErrors.push(`Per-contract fee too high: $${ticketData.fee.perContractFee} - seems unreasonable`);
        } else {
          feeErrors.push(`Invalid per-contract fee: ${ticketData.fee.perContractFee}`);
        }
      }
    }
    
    // Check for consistency between total and per-contract fees
    if (ticketData.fee.totalFee !== null && 
        ticketData.fee.perContractFee !== null && 
        ticketData.quantity !== null) {
      const expectedTotal = ticketData.fee.perContractFee * ticketData.quantity;
      const difference = Math.abs(ticketData.fee.totalFee - expectedTotal);
      
      if (difference > 0.01) { // Allow for small rounding differences
        feeErrors.push(`Fee inconsistency: total fee $${ticketData.fee.totalFee} doesn't match per-contract fee $${ticketData.fee.perContractFee} × ${ticketData.quantity} contracts = $${expectedTotal}`);
        warningCount++;
      }
    }
    
    if (feeErrors.length > 0) {
      ticketData.errors.push(...feeErrors.map(error => `Fee validation failed: ${error}`));
      warningCount += feeErrors.length;
    } else if (ticketData.fee.totalFee !== null || ticketData.fee.perContractFee !== null) {
      console.log('✅ Fee validation passed:', {
        total: ticketData.fee.totalFee,
        perContract: ticketData.fee.perContractFee,
        source: ticketData.fee.feeSource
      });
    }
  } else {
    // Fee information is optional, but log that it's missing
    console.log('ℹ️ No fee information found - this is optional but may affect after-fee calculations');
    ticketData.errors.push('Fee information not found - after-fee calculations may not be available');
    warningCount++;
  }
  
  // Cross-field validation
  if (ticketData.price !== null && ticketData.quantity !== null) {
    const totalCost = ticketData.price * ticketData.quantity;
    if (totalCost > 100000) { // Sanity check for very large orders
      ticketData.errors.push(`Order total very high: $${totalCost.toFixed(2)} - please verify price and quantity`);
      warningCount++;
    }
  }
  
  // Set validity based on critical fields and error severity
  const hasCriticalData = ticketData.side && 
                         ticketData.price !== null && 
                         ticketData.quantity !== null;
  
  ticketData.isValid = hasCriticalData && criticalErrors === 0;
  
  // Add summary information
  ticketData.validationSummary = {
    criticalErrors,
    warningCount,
    totalErrors: ticketData.errors.length,
    hasCriticalData,
    canProceed: ticketData.isValid || (hasCriticalData && criticalErrors === 0)
  };
  
  // Log validation results
  if (ticketData.isValid) {
    console.log('✅ Ticket data validation passed completely', {
      side: ticketData.side,
      price: ticketData.price,
      quantity: ticketData.quantity,
      hasFee: !!ticketData.fee,
      warnings: warningCount
    });
  } else if (ticketData.validationSummary.canProceed) {
    console.warn('⚠️ Ticket data validation passed with warnings', {
      criticalErrors,
      warningCount,
      errors: ticketData.errors
    });
  } else {
    console.error('❌ Ticket data validation failed', {
      criticalErrors,
      warningCount,
      errors: ticketData.errors,
      data: {
        side: ticketData.side,
        price: ticketData.price,
        quantity: ticketData.quantity,
        hasFee: !!ticketData.fee
      }
    });
  }
  
  return ticketData;
}

/**
 * Check if the current page should have the extension active
 */
function shouldActivateExtension() {
  const url = window.location.href;
  const pathname = window.location.pathname;
  
  // Don't activate on certain pages that don't have odds/trading
  const excludedPaths = [
    '/documents',
    '/help',
    '/about',
    '/privacy',
    '/terms',
    '/support',
    '/blog',
    '/news',
    '/api',
    '/docs'
  ];
  
  // Check if current path starts with any excluded path
  for (const excludedPath of excludedPaths) {
    if (pathname.startsWith(excludedPath)) {
      KalshiLogger.info('INITIALIZATION', `Extension disabled on excluded path: ${pathname}`);
      return false;
    }
  }
  
  // Only activate on kalshi.com domain (and localhost for development)
  const hostname = window.location.hostname;
  if (!hostname.includes('kalshi.com') && hostname !== 'localhost') {
    KalshiLogger.info('INITIALIZATION', `Extension disabled on non-Kalshi domain: ${hostname}`);
    return false;
  }
  
  KalshiLogger.info('INITIALIZATION', `Extension activated on: ${pathname}`);
  return true;
}

/**
 * Initialize the extension
 */
async function init() {
  // Check if extension should be active on this page
  if (!shouldActivateExtension()) {
    KalshiLogger.info('INITIALIZATION', 'Extension not activated on this page');
    return;
  }
  
  KalshiLogger.info('INITIALIZATION', 'Kalshi American Odds extension initializing');
  
  // Wait for page to be fully loaded before processing
  await waitForPageLoad();
  
  await loadSettings();
  setupMutationObserver();
  setupHelperPanelPositioning();
  
  // Setup cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
  
  // Also setup cleanup for when the extension might be disabled
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, pause observer to save resources
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
    } else {
      // Page is visible again, restart observer
      setupMutationObserver();
    }
  });
}

/**
 * Wait for page to be fully loaded and stable
 */
async function waitForPageLoad() {
  return new Promise((resolve) => {
    // If page is already loaded, wait a bit more for dynamic content
    if (document.readyState === 'complete') {
      setTimeout(resolve, 1000);
      return;
    }
    
    // Wait for load event
    window.addEventListener('load', () => {
      // Give additional time for dynamic content to load
      setTimeout(resolve, 1500);
    }, { once: true });
  });
}

/**
 * Cleanup function to disconnect observer and clear timers
 */
function cleanup() {
  console.log('Cleaning up Kalshi American Odds extension');
  
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  
  if (ticketState.ticketObserver) {
    ticketState.ticketObserver.disconnect();
    ticketState.ticketObserver = null;
  }
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  
  // Reset ticket state
  ticketState.isOpen = false;
  ticketState.ticketElement = null;
  ticketState.lastTicketHash = null;
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const defaultSettings = {
      displayMode: 'rawAmerican',
      fallbackEstimateEnabled: false
    };
    
    const result = await chrome.storage.sync.get(defaultSettings);
    settings = { ...settings, ...result };
    console.log('Settings loaded:', settings);
    
    // Process page after settings are loaded
    processPage();
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Use default settings if loading fails
    settings = { ...settings };
  }
}

/**
 * Set up MutationObserver to watch for DOM changes
 */
function setupMutationObserver() {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((mutations) => {
    try {
      observerStats.mutationsProcessed += mutations.length;
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        // Check for added nodes that might contain probability/price data
        if (mutation.type === 'childList') {
          // Check added nodes
          if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if the added element or its descendants might contain probability data
                if (containsProbabilityContent(node)) {
                  shouldProcess = true;
                  break;
                }
              }
            }
          }
          
          // Also check if removed nodes had our odds displays (cleanup needed)
          if (mutation.removedNodes.length > 0) {
            for (const node of mutation.removedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && 
                  (node.hasAttribute?.('data-kalshi-ao') || 
                   node.querySelector?.('[data-kalshi-ao]'))) {
                shouldProcess = true;
                break;
              }
            }
          }
        }
        
        // Check for text content changes that might affect probability displays
        if (mutation.type === 'characterData') {
          const text = mutation.target.textContent?.trim();
          if (text && (isProbabilityText(text) || isPriceText(text))) {
            shouldProcess = true;
          }
        }
        
        // Check for attribute changes that might affect our processing
        if (mutation.type === 'attributes') {
          const element = mutation.target;
          // If class or style changes might affect layout or visibility
          if (mutation.attributeName === 'class' || 
              mutation.attributeName === 'style' ||
              mutation.attributeName === 'hidden') {
            // Check if this element or its descendants contain probability content
            if (element.nodeType === Node.ELEMENT_NODE && containsProbabilityContent(element)) {
              shouldProcess = true;
            }
          }
        }
      });

      if (shouldProcess) {
        debouncedProcessPage();
      }
    } catch (error) {
      observerStats.processingErrors++;
      console.error('Error in MutationObserver callback:', error);
      
      // If we're getting too many errors, restart the observer
      if (observerStats.processingErrors > 10) {
        console.warn('Too many MutationObserver errors, restarting observer');
        setTimeout(() => {
          setupMutationObserver();
          observerStats.processingErrors = 0;
        }, 1000);
      }
    }
  });

  // Observe with more comprehensive options to catch dynamic content changes
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden'] // Only watch relevant attributes
  });
  
  console.log('MutationObserver setup complete - watching for DOM changes');
}

/**
 * Debounced page processing to avoid excessive DOM updates
 */
function debouncedProcessPage() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(async () => {
    try {
      await processPage(); // Now async
    } catch (error) {
      console.error('Error in debounced page processing:', error);
      observerStats.processingErrors++;
    }
  }, 150); // Slightly increased debounce time for better performance
}

/**
 * Check if an element or its descendants might contain probability content
 */
function containsProbabilityContent(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }
  
  // Skip script and style elements
  const tagName = element.tagName?.toLowerCase();
  if (tagName === 'script' || tagName === 'style') {
    return false;
  }
  
  // Check the element's text content for probability patterns
  const textContent = element.textContent?.trim();
  if (textContent) {
    // Quick check for percentage or price patterns
    if (isProbabilityText(textContent) || isPriceText(textContent)) {
      return true;
    }
    
    // Check if any text nodes within contain probability patterns
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const parentTag = node.parentElement?.tagName?.toLowerCase();
          if (parentTag === 'script' || parentTag === 'style') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
      const text = textNode.textContent?.trim();
      if (text && (isProbabilityText(text) || isPriceText(text))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if text matches probability percentage pattern
 */
function isProbabilityText(text) {
  if (!text) return false;
  const percentPattern = /^(100|[1-9]?\d)%$/; // 0-100%
  return percentPattern.test(text.trim());
}

/**
 * Check if text matches price pattern
 */
function isPriceText(text) {
  if (!text) return false;
  const pricePattern = /^\$0\.\d{2}$|^\$1\.00$/;
  return pricePattern.test(text.trim());
}

/**
 * Main page processing function
 */
async function processPage() {
  try {
    // Double-check that we should be processing this page
    if (!shouldActivateExtension()) {
      KalshiLogger.debug('PROCESSING', 'Skipping page processing - extension not active on this page');
      return;
    }
    
    const startTime = performance.now();
    console.log('Processing page with settings:', settings);
    
    // Clean up any orphaned odds displays first
    cleanupOrphanedOdds();
    
    processOddsNodes();
    await processOrderTicket(); // Now async with enhanced error handling
    
    const endTime = performance.now();
    observerStats.lastProcessTime = endTime - startTime;
    
    // Log performance stats occasionally
    if (observerStats.mutationsProcessed % 50 === 0 && observerStats.mutationsProcessed > 0) {
      console.log('MutationObserver stats:', {
        mutationsProcessed: observerStats.mutationsProcessed,
        lastProcessTime: Math.round(observerStats.lastProcessTime * 100) / 100 + 'ms',
        processingErrors: observerStats.processingErrors
      });
    }
  } catch (error) {
    console.error('Error processing page:', error);
    observerStats.processingErrors++;
    
    // Log the error for debugging
    logParsingError('processPage', `Page processing error: ${error.message}`, null, error);
    
    // Don't show user error for general page processing issues
    // The specific functions will handle their own user-facing errors
  }
}

/**
 * Clean up orphaned odds displays (odds without corresponding probability nodes)
 */
function cleanupOrphanedOdds() {
  const existingOdds = document.querySelectorAll('[data-kalshi-ao-odds]');
  existingOdds.forEach(oddsElement => {
    // Check if the corresponding probability node still exists and is visible
    const parentContainer = oddsElement.closest('[data-kalshi-ao]');
    if (!parentContainer || !document.contains(parentContainer)) {
      // Remove orphaned odds display
      oddsElement.remove();
      return;
    }
    
    // Check if the probability text is still valid
    const probabilityText = getProbabilityTextFromContainer(parentContainer);
    if (!probabilityText) {
      // Remove odds if probability text is no longer found
      oddsElement.remove();
      parentContainer.removeAttribute('data-kalshi-ao');
    }
  });
}

/**
 * Get probability text from a container element
 */
function getProbabilityTextFromContainer(container) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const parentTag = node.parentElement?.tagName?.toLowerCase();
        if (parentTag === 'script' || parentTag === 'style') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  let textNode;
  while (textNode = walker.nextNode()) {
    const text = textNode.textContent?.trim();
    if (text && (isProbabilityText(text) || isPriceText(text))) {
      return text;
    }
  }
  
  return null;
}

/**
 * Get the effective display mode
 */
function getEffectiveDisplayMode() {
  return settings.displayMode;
}

/**
 * Initialize helper panel when ticket opens
 * Enhanced with comprehensive error handling
 */
async function initializeHelperPanel(ticketElement, ticketData) {
  try {
    console.log('Initializing helper panel...');
    
    // Check if helper panel should be shown based on settings
    if (!shouldShowHelperPanel()) {
      console.log('Helper panel disabled in settings');
      return;
    }
    
    // Create or update helper panel
    if (!helperPanelState.panelElement) {
      await createHelperPanel(ticketElement);
    }
    
    // Update panel with initial ticket data
    if (ticketData && (ticketData.isValid || ticketData.validationSummary?.canProceed)) {
      updateHelperPanelWithTicketData(ticketData, true);
    }
    
    // Show the panel
    helperPanelState.isVisible = true;
    if (helperPanelState.panelElement) {
      helperPanelState.panelElement.style.display = 'block';
    }
    
    console.log('✅ Helper panel initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize helper panel:', error.message);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Update helper panel when ticket content changes
 * Enhanced with comprehensive error handling
 */
async function updateHelperPanel(ticketElement, ticketData) {
  try {
    console.log('Updating helper panel...');
    
    // Check if helper panel exists and should be updated
    if (!helperPanelState.panelElement || !helperPanelState.isVisible) {
      console.log('Helper panel not available for update');
      return;
    }
    
    // Update panel with new ticket data
    if (ticketData && (ticketData.isValid || ticketData.validationSummary?.canProceed)) {
      updateHelperPanelWithTicketData(ticketData, false);
    } else {
      // Clear panel if data is invalid
      clearHelperPanelData();
    }
    
    console.log('✅ Helper panel updated successfully');
    
  } catch (error) {
    console.error('❌ Failed to update helper panel:', error.message);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Check if the current ticket is a limit order (not a market order)
 * @param {Element} ticketElement - The ticket element to check
 * @returns {boolean} True if it's a limit order, false otherwise
 */
function isLimitOrder(ticketElement) {
  if (!ticketElement) {
    console.log('No ticket element provided to isLimitOrder check');
    return false;
  }
  
  try {
    // Strategy 1: Look for price input fields (limit orders have price inputs, market orders don't)
    const priceInputs = ticketElement.querySelectorAll('input[type="number"], input[type="text"]');
    for (const input of priceInputs) {
      // Check if this looks like a price input
      const placeholder = input.placeholder?.toLowerCase() || '';
      const label = input.getAttribute('aria-label')?.toLowerCase() || '';
      const name = input.name?.toLowerCase() || '';
      const id = input.id?.toLowerCase() || '';
      
      if (placeholder.includes('price') || label.includes('price') || 
          name.includes('price') || id.includes('price') ||
          placeholder.includes('limit') || label.includes('limit') ||
          name.includes('limit') || id.includes('limit')) {
        console.log('✅ Limit order detected: found price input field');
        return true;
      }
      
      // Check if input has price-like constraints (0.01 to 1.00 range typical for Kalshi)
      if (input.min === '0.01' || input.max === '0.99' || input.max === '1' || input.max === '1.00') {
        console.log('✅ Limit order detected: found price-constrained input');
        return true;
      }
    }
    
    // Strategy 2: Look for text content that indicates limit order
    const textContent = ticketElement.textContent?.toLowerCase() || '';
    
    // Look for "limit" keyword in prominent places
    const limitKeywords = ['limit order', 'limit price', 'set price', 'price limit'];
    for (const keyword of limitKeywords) {
      if (textContent.includes(keyword)) {
        console.log(`✅ Limit order detected: found keyword "${keyword}"`);
        return true;
      }
    }
    
    // Strategy 3: Look for labels or headings that suggest limit order
    const labels = ticketElement.querySelectorAll('label, h1, h2, h3, h4, h5, h6, .title, .header');
    for (const label of labels) {
      const labelText = label.textContent?.toLowerCase() || '';
      if (labelText.includes('limit') || labelText.includes('price')) {
        console.log('✅ Limit order detected: found limit/price in label');
        return true;
      }
    }
    
    // Strategy 4: Check for market order indicators (if found, it's NOT a limit order)
    const marketKeywords = ['market order', 'market price', 'current price', 'instant'];
    for (const keyword of marketKeywords) {
      if (textContent.includes(keyword)) {
        console.log(`❌ Market order detected: found keyword "${keyword}"`);
        return false;
      }
    }
    
    // Strategy 5: Look for buttons or tabs that might indicate order type
    const buttons = ticketElement.querySelectorAll('button, .tab, .toggle');
    for (const button of buttons) {
      const buttonText = button.textContent?.toLowerCase() || '';
      const isSelected = button.classList.contains('selected') || 
                        button.classList.contains('active') ||
                        button.getAttribute('aria-pressed') === 'true' ||
                        button.getAttribute('aria-selected') === 'true';
      
      if (isSelected) {
        if (buttonText.includes('limit')) {
          console.log('✅ Limit order detected: limit button/tab is selected');
          return true;
        }
        if (buttonText.includes('market')) {
          console.log('❌ Market order detected: market button/tab is selected');
          return false;
        }
      }
    }
    
    // Default: If we can't determine the order type but there are price inputs, assume limit order
    // This is because the helper panel is specifically for limit orders (converting odds to prices)
    if (priceInputs.length > 0) {
      console.log('🤔 Order type unclear, but found inputs - assuming limit order for helper panel');
      return true;
    }
    
    console.log('❌ No clear indicators of limit order found');
    return false;
    
  } catch (error) {
    console.error('Error detecting limit order:', error);
    // On error, default to false (don't show helper panel)
    return false;
  }
}

/**
 * Check if helper panel should be shown based on settings and context
 */
function shouldShowHelperPanel() {
  console.log('🔍 shouldShowHelperPanel check:');
  console.log('  - settings.helperPanelEnabled:', settings.helperPanelEnabled);
  console.log('  - ticketState.ticketElement exists:', !!ticketState.ticketElement);
  
  // Check if helper panel is enabled in settings
  if (!settings.helperPanelEnabled) {
    console.log('  ❌ Helper panel not shown: disabled in settings');
    return false;
  }
  
  // Only show helper panel for limit orders
  if (!ticketState.ticketElement) {
    console.log('  ❌ Helper panel not shown: no ticket element');
    return false;
  }
  
  const isLimit = isLimitOrder(ticketState.ticketElement);
  console.log('  - isLimitOrder result:', isLimit);
  
  if (!isLimit) {
    console.log('  ❌ Helper panel not shown: not a limit order');
    return false;
  }
  
  console.log('  ✅ Helper panel should be shown: limit order detected and enabled in settings');
  return true;
}

/**
 * Clear helper panel data when ticket data is invalid
 */
function clearHelperPanelData() {
  if (!helperPanelState.panelElement) return;
  
  try {
    // Clear input values
    const oddsInput = helperPanelState.panelElement.querySelector('#kalshi-ao-odds-input');
    if (oddsInput) oddsInput.value = '';
    
    // Clear calculated values
    const suggestedPriceElement = helperPanelState.panelElement.querySelector('#kalshi-ao-suggested-price');
    if (suggestedPriceElement) suggestedPriceElement.innerHTML = '--';
    
    const afterFeeOddsElement = helperPanelState.panelElement.querySelector('#kalshi-ao-after-fee-odds');
    if (afterFeeOddsElement) afterFeeOddsElement.innerHTML = '--';
    
    // Reset state
    helperPanelState.currentOdds = null;
    helperPanelState.suggestedPrice = null;
    helperPanelState.afterFeeOdds = null;
    
    console.log('Helper panel data cleared');
    
  } catch (error) {
    console.warn('Error clearing helper panel data:', error.message);
  }
}
function clearExistingOdds() {
  // Remove all existing odds elements
  const existingOdds = document.querySelectorAll('[data-kalshi-ao-odds]');
  existingOdds.forEach(element => element.remove());
  
  // Clear processed markers so nodes can be reprocessed
  const processedElements = document.querySelectorAll('[data-kalshi-ao]');
  processedElements.forEach(element => element.removeAttribute('data-kalshi-ao'));
}

/**
 * Process probability/price nodes and inject odds
 */
function processOddsNodes() {
  // Safety check - don't process if extension shouldn't be active
  if (!shouldActivateExtension()) {
    KalshiLogger.debug('PROCESSING', 'Skipping odds processing - extension not active on this page');
    return;
  }
  
  const effectiveMode = getEffectiveDisplayMode();
  console.log('Processing odds nodes with displayMode:', settings.displayMode, 'effective:', effectiveMode);
  
  // Clear existing odds displays first
  clearExistingOdds();
  
  // Only show odds for rawAmerican mode (or when cycling to rawAmerican)
  // Note: afterFeeAmerican will be handled in the ticket processing
  if (effectiveMode !== 'rawAmerican') {
    console.log('Skipping raw odds display - effective mode is', effectiveMode);
    return;
  }
  
  // Find all text nodes that might contain probability/price information
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip already processed nodes
        if (node.parentElement && node.parentElement.hasAttribute('data-kalshi-ao')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip script and style elements
        const parentTag = node.parentElement?.tagName?.toLowerCase();
        if (parentTag === 'script' || parentTag === 'style') {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  // Process each text node for probability patterns
  textNodes.forEach(textNode => {
    processProbabilityTextNode(textNode);
  });
}

/**
 * Process a single text node for probability/price patterns
 */
function processProbabilityTextNode(textNode) {
  const text = textNode.textContent.trim();
  if (!text) return;
  
  // Pattern for percentage (e.g., "45%", "12%", "100%")
  const percentPattern = /^(100|[1-9]?\d)%$/;
  
  // Pattern for price (e.g., "$0.45", "$0.12", "$1.00")
  const pricePattern = /^\$0\.\d{2}$|^\$1\.00$/;
  
  let probability = null;
  let matchType = null;
  
  // Check for percentage match
  if (percentPattern.test(text)) {
    const percentValue = parseInt(text.replace('%', ''));
    if (percentValue >= 0 && percentValue <= 100) {
      probability = percentValue / 100;
      matchType = 'percent';
    }
  }
  // Check for price match
  else if (pricePattern.test(text)) {
    const priceValue = parseFloat(text.replace('$', ''));
    if (priceValue >= 0 && priceValue <= 1) {
      probability = priceValue;
      matchType = 'price';
    }
  }
  
  // If we found a valid probability, inject odds
  if (probability !== null && matchType) {
    injectOddsForNode(textNode, probability, matchType);
  }
}

/**
 * Inject American odds near a probability node
 */
function injectOddsForNode(textNode, probability, matchType) {
  const parentElement = textNode.parentElement;
  if (!parentElement) return;
  
  // Skip if already processed
  if (parentElement.hasAttribute('data-kalshi-ao')) {
    return;
  }
  
  // Find the nearest stable container (traverse up to find a good injection point)
  const container = findStableContainer(parentElement);
  if (!container) return;
  
  // Mark as processed
  parentElement.setAttribute('data-kalshi-ao', '1');
  
  // Calculate American odds
  const americanOdds = probabilityToAmericanOdds(probability);
  
  // Skip if odds calculation failed
  if (americanOdds === null) {
    console.warn('Failed to calculate American odds for probability:', probability);
    return;
  }
  
  // Create odds display element
  const oddsElement = createOddsElement(americanOdds, matchType, probability);
  
  // Inject the odds element
  try {
    injectOddsElement(container, parentElement, oddsElement);
  } catch (error) {
    console.error('Failed to inject odds element:', error);
  }
}

/**
 * Find a stable container for odds injection
 */
function findStableContainer(element) {
  let current = element;
  let maxDepth = 5; // Limit traversal depth
  
  while (current && maxDepth > 0) {
    // Look for elements that seem like stable row containers
    const tagName = current.tagName?.toLowerCase();
    const className = current.className || '';
    
    // Common container patterns (avoid overly specific selectors)
    if (tagName === 'tr' || 
        tagName === 'li' || 
        className.includes('row') || 
        className.includes('item') ||
        className.includes('card') ||
        current.getAttribute('role') === 'row') {
      return current;
    }
    
    current = current.parentElement;
    maxDepth--;
  }
  
  // Fallback to the original parent if no stable container found
  return element;
}

/**
 * Convert probability to American odds
 */
function probabilityToAmericanOdds(p) {
  if (p <= 0 || p >= 1) {
    return null; // Invalid probability
  }
  
  let odds;
  if (Math.abs(p - 0.5) < 0.001) { // Handle floating point precision
    odds = 100; // Even odds
  } else if (p < 0.5) {
    odds = 100 * (1 - p) / p; // Positive odds
  } else {
    odds = -100 * p / (1 - p); // Negative odds
  }
  
  // Apply integer rounding (no rounding options)
  return Math.round(odds);
}

/**
 * Comprehensive validation functions for calculated values - Task 4.3.4
 */

/**
 * Validate calculated risk value
 * @param {number} price - Original price
 * @param {number} feePerContract - Fee per contract
 * @param {number} calculatedRisk - The calculated risk value
 * @returns {Object} Validation result with isValid and error properties
 */
function validateCalculatedRisk(price, feePerContract, calculatedRisk) {
  // Risk should equal price + feePerContract
  const expectedRisk = price + feePerContract;
  const tolerance = 0.0001; // Allow for floating point precision
  
  if (Math.abs(calculatedRisk - expectedRisk) > tolerance) {
    return {
      isValid: false,
      error: `Risk calculation mismatch: expected ${expectedRisk}, got ${calculatedRisk}`
    };
  }
  
  // Risk must be positive and less than 1.00
  if (calculatedRisk <= 0 || calculatedRisk >= 1.00) {
    return {
      isValid: false,
      error: `Risk out of valid range: ${calculatedRisk} (must be 0 < risk < 1.00)`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate calculated profit value
 * @param {number} calculatedRisk - The calculated risk value
 * @param {number} calculatedProfit - The calculated profit value
 * @returns {Object} Validation result with isValid and error properties
 */
function validateCalculatedProfit(calculatedRisk, calculatedProfit) {
  // Profit should equal 1 - risk
  const expectedProfit = 1 - calculatedRisk;
  const tolerance = 0.0001;
  
  if (Math.abs(calculatedProfit - expectedProfit) > tolerance) {
    return {
      isValid: false,
      error: `Profit calculation mismatch: expected ${expectedProfit}, got ${calculatedProfit}`
    };
  }
  
  // Profit must be positive
  if (calculatedProfit <= 0) {
    return {
      isValid: false,
      error: `Profit must be positive: ${calculatedProfit}`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate after-fee odds calculation
 * @param {number} calculatedRisk - The calculated risk value
 * @param {number} calculatedProfit - The calculated profit value
 * @param {number} afterFeeOdds - The calculated after-fee odds
 * @returns {Object} Validation result with isValid and error properties
 */
function validateAfterFeeOdds(calculatedRisk, calculatedProfit, afterFeeOdds) {
  // Validate odds calculation based on profit vs risk
  let expectedOdds;
  
  if (calculatedProfit >= calculatedRisk) {
    // Positive odds: +100 * (profit/risk)
    expectedOdds = 100 * (calculatedProfit / calculatedRisk);
  } else {
    // Negative odds: -100 * (risk/profit)
    expectedOdds = -100 * (calculatedRisk / calculatedProfit);
  }
  
  // Allow for rounding differences
  const tolerance = 1.5; // Allow for integer rounding
  
  if (Math.abs(afterFeeOdds - expectedOdds) > tolerance) {
    return {
      isValid: false,
      error: `After-fee odds calculation mismatch: expected ~${expectedOdds.toFixed(1)}, got ${afterFeeOdds}`
    };
  }
  
  // Validate odds are within reasonable bounds
  if (Math.abs(afterFeeOdds) > 10000) {
    return {
      isValid: false,
      error: `After-fee odds out of reasonable range: ${afterFeeOdds}`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate mathematical consistency of odds calculation
 * @param {number} price - Original price
 * @param {number} feePerContract - Fee per contract
 * @param {number} afterFeeOdds - Calculated after-fee odds
 * @returns {Object} Validation result with isValid and error properties
 */
function validateMathematicalConsistency(price, feePerContract, afterFeeOdds) {
  // Test that we can reverse-engineer the probability from the odds
  // and it should be close to the effective probability after fees
  
  let impliedProbability;
  
  if (afterFeeOdds > 0) {
    impliedProbability = 100 / (afterFeeOdds + 100);
  } else {
    impliedProbability = (-afterFeeOdds) / ((-afterFeeOdds) + 100);
  }
  
  // The effective probability should be close to 1 / (price + feePerContract)
  const effectiveProbability = 1 / (price + feePerContract);
  const tolerance = 0.02; // 2% tolerance for rounding effects
  
  if (Math.abs(impliedProbability - effectiveProbability) > tolerance) {
    return {
      isValid: false,
      error: `Mathematical inconsistency: implied probability ${impliedProbability.toFixed(4)} vs effective probability ${effectiveProbability.toFixed(4)}`
    };
  }
  
  return { isValid: true };
}

/**
 * Calculate after-fee effective odds based on risk and profit with comprehensive validation
 * Implements the formula: risk = price + fee_per_contract, profit = 1 - risk
 * @param {number} price - The limit price (0.01 to 1.00)
 * @param {number} feePerContract - The fee per contract
 * @param {Object} options - Optional configuration
 * @param {boolean} options.enableValidation - Enable comprehensive validation (default: true)
 * @returns {number|null} American odds or null if invalid inputs
 */
function calculateAfterFeeOdds(price, feePerContract, options = {}) {
  const enableValidation = options.enableValidation !== false; // Default to true
  
  // Basic input validation
  if (typeof price !== 'number' || typeof feePerContract !== 'number' || 
      isNaN(price) || isNaN(feePerContract)) {
    console.warn('calculateAfterFeeOdds: Invalid input types', { price, feePerContract });
    return null;
  }
  
  if (price <= 0 || price > 1.00) {
    console.warn('calculateAfterFeeOdds: Price out of valid range (0.01-1.00)', { price });
    return null;
  }
  
  if (feePerContract < 0) {
    console.warn('calculateAfterFeeOdds: Negative fee per contract', { feePerContract });
    return null;
  }
  
  // Calculate intermediate values
  const calculatedRisk = price + feePerContract;
  const calculatedProfit = 1 - calculatedRisk;
  
  // Comprehensive validation of intermediate calculations (Task 4.3.4)
  if (enableValidation) {
    const riskValidation = validateCalculatedRisk(price, feePerContract, calculatedRisk);
    if (!riskValidation.isValid) {
      console.warn('calculateAfterFeeOdds: Risk validation failed', riskValidation.error);
      return null;
    }
    
    const profitValidation = validateCalculatedProfit(calculatedRisk, calculatedProfit);
    if (!profitValidation.isValid) {
      console.warn('calculateAfterFeeOdds: Profit validation failed', profitValidation.error);
      return null;
    }
  } else {
    // Basic validation even when comprehensive validation is disabled
    if (calculatedRisk >= 1.00) {
      console.warn('calculateAfterFeeOdds: Risk >= 1.00, trade would be unprofitable', { 
        price, 
        feePerContract, 
        risk: calculatedRisk 
      });
      return null;
    }
    
    if (calculatedProfit <= 0) {
      console.warn('calculateAfterFeeOdds: Non-positive profit', { profit: calculatedProfit, risk: calculatedRisk });
      return null;
    }
  }
  
  // Convert to American odds based on profit/risk ratio
  let rawOdds;
  if (calculatedProfit >= calculatedRisk) {
    // Positive odds: +100 * (profit/risk)
    rawOdds = 100 * (calculatedProfit / calculatedRisk);
  } else {
    // Negative odds: -100 * (risk/profit)
    rawOdds = -100 * (calculatedRisk / calculatedProfit);
  }
  
  // Apply integer rounding (no rounding options)
  let finalOdds = Math.round(rawOdds);
  
  // Comprehensive validation of final result (Task 4.3.4)
  if (enableValidation) {
    const oddsValidation = validateAfterFeeOdds(calculatedRisk, calculatedProfit, finalOdds);
    if (!oddsValidation.isValid) {
      console.warn('calculateAfterFeeOdds: Odds validation failed', oddsValidation.error);
      return null;
    }
    
    const consistencyValidation = validateMathematicalConsistency(price, feePerContract, finalOdds);
    if (!consistencyValidation.isValid) {
      console.warn('calculateAfterFeeOdds: Mathematical consistency check failed', consistencyValidation.error);
      // Don't return null for consistency warnings, just log them
    }
    
    // Additional warnings for edge cases
    if (calculatedRisk > 0.95) {
      console.warn('calculateAfterFeeOdds: High risk trade - very small profit margin', { risk: calculatedRisk });
    }
    
    if (Math.abs(finalOdds) > 1000) {
      console.warn('calculateAfterFeeOdds: Extreme odds value - may indicate unusual market conditions', { odds: finalOdds });
    }
  }
  
  return finalOdds;
}

/**
 * Calculate after-fee odds from ticket data
 * Handles both total fee and per-contract fee scenarios
 * @param {Object} ticketData - Parsed ticket data containing price, quantity, fee info
 * @param {Object} options - Optional configuration
 * @returns {Object|null} After-fee odds calculation result or null if invalid
 */
function calculateAfterFeeOddsFromTicket(ticketData, options = {}) {
  // Validate ticket data
  if (!ticketData || typeof ticketData !== 'object') {
    console.warn('calculateAfterFeeOddsFromTicket: Invalid ticket data', ticketData);
    return null;
  }
  
  const { price, quantity, fee } = ticketData;
  
  // Validate required fields
  if (typeof price !== 'number' || !isValidPrice(price)) {
    console.warn('calculateAfterFeeOddsFromTicket: Invalid price', { price });
    return null;
  }
  
  if (typeof quantity !== 'number' || !isValidQuantity(quantity)) {
    console.warn('calculateAfterFeeOddsFromTicket: Invalid quantity', { quantity });
    return null;
  }
  
  if (!fee || typeof fee !== 'object') {
    console.warn('calculateAfterFeeOddsFromTicket: No fee information available', { fee });
    return null;
  }
  
  // Task 6.4.1: Detect fallback fee usage before calculation
  const fallbackDetection = detectFallbackFeeUsage(fee, {
    price: price,
    quantity: quantity,
    calculationContext: 'after_fee_odds',
    ticketFeeParsingFailed: !fee || (!fee.totalFee && !fee.perContractFee),
    usedDefaultPrice: options.usedDefaultPrice || false,
    usedDefaultQuantity: options.usedDefaultQuantity || false,
    calculationMethod: options.calculationMethod || 'standard'
  });
  
  // Determine fee per contract
  let feePerContract = null;
  
  if (fee.perContractFee !== null && typeof fee.perContractFee === 'number') {
    // Use per-contract fee directly
    feePerContract = fee.perContractFee;
    console.log('Using per-contract fee:', feePerContract);
  } else if (fee.totalFee !== null && typeof fee.totalFee === 'number') {
    // Calculate per-contract fee from total fee
    feePerContract = fee.totalFee / quantity;
    console.log('Calculated per-contract fee from total:', { 
      totalFee: fee.totalFee, 
      quantity, 
      feePerContract 
    });
  } else {
    console.warn('calculateAfterFeeOddsFromTicket: No usable fee information', { fee });
    return null;
  }
  
  // Validate fee per contract
  if (!isValidFee(feePerContract)) {
    console.warn('calculateAfterFeeOddsFromTicket: Invalid fee per contract', { feePerContract });
    return null;
  }
  
  // Calculate after-fee odds
  const afterFeeOdds = calculateAfterFeeOdds(price, feePerContract, options);
  
  if (afterFeeOdds === null) {
    console.warn('calculateAfterFeeOddsFromTicket: Failed to calculate after-fee odds');
    return null;
  }
  
  // Calculate additional metrics for transparency
  const risk = price + feePerContract;
  const profit = 1 - risk;
  const rawOdds = probabilityToAmericanOdds(price);
  
  return {
    afterFeeOdds,
    rawOdds,
    price,
    feePerContract,
    totalFee: fee.totalFee,
    quantity,
    risk,
    profit,
    feeSource: fee.feeSource,
    // Task 6.4.1: Include fallback detection results
    fallbackDetection: fallbackDetection,
    isUsingFallbackFee: fallbackDetection.isUsingFallback,
    fallbackConfidence: fallbackDetection.confidence,
    fallbackReasons: fallbackDetection.reasons,
    calculations: {
      risk: `${price} + ${feePerContract} = ${risk}`,
      profit: `1 - ${risk} = ${profit}`,
      oddsFormula: profit >= risk 
        ? `+100 * (${profit}/${risk}) = ${afterFeeOdds}`
        : `-100 * (${risk}/${profit}) = ${afterFeeOdds}`
    }
  };
}

/**
 * Create odds display element
 */
function createOddsElement(americanOdds, matchType, probability) {
  const oddsElement = document.createElement('span');
  oddsElement.className = 'kalshi-ao-odds';
  
  // Format odds display - always show integer odds (no rounding options)
  let oddsText;
  const roundedOdds = Math.round(americanOdds);
  oddsText = roundedOdds > 0 ? `+${roundedOdds}` : `${roundedOdds}`;
  
  // Always show only YES odds
  oddsElement.textContent = ` (${oddsText})`;
  
  // Apply comprehensive click-safe styling with enhanced specificity
  oddsElement.style.cssText = `
    pointer-events: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    color: #666;
    font-size: 0.9em;
    font-weight: normal;
    margin-left: 4px;
    cursor: default !important;
    outline: none !important;
    border: none !important;
    background: transparent !important;
    text-decoration: none !important;
    display: inline !important;
    position: static !important;
    z-index: auto !important;
  `;
  
  // Add data attributes for identification
  oddsElement.setAttribute('data-kalshi-ao-odds', '1');
  oddsElement.setAttribute('data-match-type', matchType);
  oddsElement.setAttribute('data-display-mode', settings.displayMode);
  
  // Ensure element cannot receive focus
  oddsElement.setAttribute('tabindex', '-1');
  oddsElement.setAttribute('aria-hidden', 'true');
  
  // Add additional safeguards against interaction
  preventInteraction(oddsElement);
  
  return oddsElement;
}

/**
 * Add comprehensive interaction prevention to an element
 */
function preventInteraction(element) {
  // Prevent all mouse events
  const mouseEvents = [
    'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
    'mousemove', 'mouseenter', 'mouseleave', 'contextmenu'
  ];
  
  mouseEvents.forEach(eventType => {
    element.addEventListener(eventType, (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, { passive: false, capture: true });
  });
  
  // Prevent keyboard events
  const keyboardEvents = ['keydown', 'keyup', 'keypress'];
  keyboardEvents.forEach(eventType => {
    element.addEventListener(eventType, (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, { passive: false, capture: true });
  });
  
  // Prevent touch events on mobile
  const touchEvents = ['touchstart', 'touchend', 'touchmove', 'touchcancel'];
  touchEvents.forEach(eventType => {
    element.addEventListener(eventType, (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, { passive: false, capture: true });
  });
  
  // Prevent focus events
  const focusEvents = ['focus', 'blur', 'focusin', 'focusout'];
  focusEvents.forEach(eventType => {
    element.addEventListener(eventType, (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      element.blur(); // Ensure element loses focus
    }, { passive: false, capture: true });
  });
  
  // Prevent drag events
  const dragEvents = ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'];
  dragEvents.forEach(eventType => {
    element.addEventListener(eventType, (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, { passive: false, capture: true });
  });
}

/**
 * Inject odds element into the DOM
 */
function injectOddsElement(container, originalElement, oddsElement) {
  // Try to inject inline next to the original text
  if (originalElement.nextSibling) {
    originalElement.parentElement.insertBefore(oddsElement, originalElement.nextSibling);
  } else {
    originalElement.parentElement.appendChild(oddsElement);
  }
}

/**
 * Process order ticket for after-fee odds calculation
 * Enhanced with comprehensive error handling and graceful degradation
 */
async function processOrderTicket() {
  console.log('Processing order ticket...');
  
  try {
    // Clear any previous detection errors when starting fresh
    if (!ticketState.isOpen) {
      clearTicketDetectionError();
    }
    
    // Detect if ticket is currently open (now async with retry logic)
    const currentTicket = await detectOrderTicket();
    
    if (currentTicket && !ticketState.isOpen) {
      // Ticket just opened
      console.log('✅ Ticket opened, initializing...');
      await onTicketOpened(currentTicket);
    } else if (!currentTicket && ticketState.isOpen) {
      // Ticket just closed
      console.log('ℹ️ Ticket closed');
      onTicketClosed();
    } else if (currentTicket && ticketState.isOpen) {
      // Ticket is still open, check if content changed
      const ticketHash = generateTicketHash(currentTicket);
      if (ticketHash !== ticketState.lastTicketHash) {
        console.log('🔄 Ticket content changed, updating...');
        await onTicketContentChanged(currentTicket);
      }
    } else if (!currentTicket && !ticketState.isOpen) {
      // No ticket detected and none was previously open
      // This is normal - just log occasionally for debugging
      if (Math.random() < 0.1) { // Log 10% of the time to avoid spam
        console.log('ℹ️ No order ticket detected (normal when no orders are being placed)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error processing order ticket:', error);
    logParsingError('processOrderTicket', `Processing error: ${error.message}`, null, error);
    
    // Show user-friendly error message
    showTicketDetectionError('An error occurred while processing the order ticket. Some features may not work correctly.');
    
    // Attempt to recover by resetting ticket state
    if (ticketState.isOpen) {
      console.log('🔄 Attempting to recover by resetting ticket state...');
      onTicketClosed();
    }
  }
}

// Retry configuration for ticket element detection
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 250,      // Start with 250ms
  maxDelay: 2000,      // Cap at 2 seconds
  backoffMultiplier: 2, // Double delay each retry
  timeoutMs: 5000      // Overall timeout for detection attempts
};

// Track retry attempts and performance
let detectionStats = {
  totalAttempts: 0,
  successfulDetections: 0,
  failedDetections: 0,
  retryAttempts: 0,
  averageDetectionTime: 0,
  lastDetectionTime: 0
};

/**
 * Detect if an order ticket is currently open and return the ticket element
 * Enhanced with retry logic and comprehensive error handling
 */
async function detectOrderTicket() {
  const startTime = performance.now();
  detectionStats.totalAttempts++;
  
  try {
    // First attempt - immediate detection
    const immediateResult = await attemptTicketDetection();
    if (immediateResult) {
      recordSuccessfulDetection(startTime);
      return immediateResult;
    }
    
    // If immediate detection fails, try with retry logic
    console.log('🔄 Initial ticket detection failed, attempting with retry logic...');
    const retryResult = await detectOrderTicketWithRetry();
    
    if (retryResult) {
      recordSuccessfulDetection(startTime);
      return retryResult;
    }
    
    // All detection attempts failed
    recordFailedDetection(startTime);
    console.warn('❌ All ticket detection attempts failed');
    
    // Provide user feedback about detection failure
    showTicketDetectionError();
    
    return null;
    
  } catch (error) {
    recordFailedDetection(startTime);
    logParsingError('detectOrderTicket', `Critical detection error: ${error.message}`, null, error);
    showTicketDetectionError('Critical error occurred during ticket detection');
    return null;
  }
}

/**
 * Attempt ticket detection with retry logic and exponential backoff
 */
async function detectOrderTicketWithRetry() {
  let retryCount = 0;
  let delay = RETRY_CONFIG.baseDelay;
  
  while (retryCount < RETRY_CONFIG.maxRetries) {
    try {
      console.log(`🔄 Retry attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (delay: ${delay}ms)`);
      
      // Wait before retry (except first attempt)
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Attempt detection with timeout
      const result = await Promise.race([
        attemptTicketDetection(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Detection timeout')), RETRY_CONFIG.timeoutMs)
        )
      ]);
      
      if (result) {
        console.log(`✅ Ticket detection successful on retry ${retryCount + 1}`);
        detectionStats.retryAttempts += retryCount;
        return result;
      }
      
      retryCount++;
      delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelay);
      
    } catch (error) {
      console.warn(`⚠️ Retry ${retryCount + 1} failed:`, error.message);
      retryCount++;
      delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelay);
    }
  }
  
  detectionStats.retryAttempts += RETRY_CONFIG.maxRetries;
  return null;
}

/**
 * Core ticket detection logic (synchronous)
 */
async function attemptTicketDetection() {
  // Strategy 1: Look for modal/dialog elements that might contain order forms
  const modalSelectors = [
    '[role="dialog"]',
    '[role="modal"]',
    '.modal',
    '.dialog',
    '.popup',
    '.overlay',
    // Additional selectors for robustness - enhanced selectors for better detection
    // These additional selectors provide enhanced detection capabilities
    '[data-testid*="modal"]',
    '[data-testid*="dialog"]',
    '[class*="Modal"]',
    '[class*="Dialog"]',
    '[id*="modal"]',
    '[id*="dialog"]'
  ];
  
  for (const selector of modalSelectors) {
    try {
      const modals = document.querySelectorAll(selector);
      for (const modal of modals) {
        if (await isOrderTicketModal(modal)) {
          console.log('✅ Order ticket detected via modal selector:', selector);
          return modal;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error checking modal selector ${selector}:`, error.message);
      continue; // Try next selector
    }
  }
  
  // Strategy 2: Look for elements containing order-related text and form inputs
  const orderKeywords = [
    'place order',
    'buy order',
    'sell order',
    'order ticket',
    'limit order',
    'market order',
    'quantity',
    'contracts',
    'total cost',
    'fee',
    'yes',
    'no',
    // Additional keywords for better detection
    'place bet',
    'buy shares',
    'sell shares',
    'order form',
    'trading',
    'position'
  ];
  
  // Find elements that contain multiple order-related keywords and form inputs
  const candidateSelectors = [
    'div', 'section', 'form', 'aside', 'main', 'article',
    // Additional selectors for modern web apps - enhanced selectors for robustness
    '[data-testid*="order"]',
    '[data-testid*="ticket"]',
    '[data-testid*="trade"]',
    '[class*="order"]',
    '[class*="ticket"]',
    '[class*="trade"]',
    '[id*="order"]',
    '[id*="ticket"]',
    '[id*="trade"]'
  ];
  
  for (const selector of candidateSelectors) {
    try {
      const candidateElements = document.querySelectorAll(selector);
      for (const element of candidateElements) {
        if (await isOrderTicketElement(element, orderKeywords)) {
          console.log('✅ Order ticket detected via keyword analysis with selector:', selector);
          return element;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error checking candidate selector ${selector}:`, error.message);
      continue; // Try next selector
    }
  }
  
  // Strategy 3: Look for specific form patterns (price input + quantity input + submit button)
  const formSelectors = [
    'form', 
    'div[class*="form"]', 
    'div[class*="order"]',
    // Additional form-like selectors - enhanced selectors for robustness
    '[role="form"]',
    '[data-testid*="form"]',
    'div[class*="Form"]',
    'section[class*="form"]',
    'fieldset'
  ];
  
  for (const selector of formSelectors) {
    try {
      const formElements = document.querySelectorAll(selector);
      for (const form of formElements) {
        if (await hasOrderFormPattern(form)) {
          console.log('✅ Order ticket detected via form pattern analysis with selector:', selector);
          return form;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error checking form selector ${selector}:`, error.message);
      continue; // Try next selector
    }
  }
  
  // Strategy 4: Fallback - look for any element with order-related inputs
  console.log('🔄 Attempting fallback strategy: broad input pattern search');
  try {
    const fallbackResult = await detectTicketFallback();
    if (fallbackResult) {
      console.log('✅ Order ticket detected via fallback strategy');
      return fallbackResult;
    }
  } catch (error) {
    console.warn('⚠️ Fallback detection strategy failed:', error.message);
  }
  
  return null;
}

/**
 * Fallback ticket detection strategy - broad search for order-related inputs
 */
async function detectTicketFallback() {
  try {
    // Look for any combination of inputs that might indicate an order form
    const allInputs = document.querySelectorAll('input[type="number"], input[type="text"], select');
    const allButtons = document.querySelectorAll('button');
    
    // Group inputs by their container elements
    const containerMap = new Map();
    
    for (const input of allInputs) {
      // Find the nearest container (form, div, section, etc.)
      let container = input.closest('form, div[class*="form"], div[class*="order"], section, fieldset, main');
      if (!container) {
        container = input.parentElement;
      }
      
      if (container && !containerMap.has(container)) {
        containerMap.set(container, {
          element: container,
          inputs: [],
          buttons: [],
          score: 0
        });
      }
      
      if (container) {
        containerMap.get(container).inputs.push(input);
      }
    }
    
    // Add buttons to their containers
    for (const button of allButtons) {
      let container = button.closest('form, div[class*="form"], div[class*="order"], section, fieldset, main');
      if (!container) {
        container = button.parentElement;
      }
      
      if (container && containerMap.has(container)) {
        containerMap.get(container).buttons.push(button);
      }
    }
    
    // Score containers based on likelihood of being order forms
    const candidates = [];
    
    for (const [container, data] of containerMap) {
      if (data.inputs.length < 2) continue; // Need at least 2 inputs
      
      let score = 0;
      const text = container.textContent?.toLowerCase() || '';
      
      // Score based on input types and patterns
      const numberInputs = data.inputs.filter(input => input.type === 'number');
      const textInputs = data.inputs.filter(input => input.type === 'text');
      
      score += numberInputs.length * 3; // Number inputs are strong indicators
      score += textInputs.length * 1;
      score += data.buttons.length * 2;
      
      // Score based on text content
      const orderTerms = [
        'price', 'quantity', 'contracts', 'shares', 'total', 'fee', 'cost',
        'yes', 'no', 'buy', 'sell', 'place', 'order', 'trade', 'limit', 'market'
      ];
      
      for (const term of orderTerms) {
        if (text.includes(term)) {
          score += 2;
        }
      }
      
      // Score based on input attributes and labels
      for (const input of data.inputs) {
        const inputText = (input.placeholder + ' ' + input.name + ' ' + input.id).toLowerCase();
        for (const term of orderTerms) {
          if (inputText.includes(term)) {
            score += 3;
          }
        }
      }
      
      // Score based on button text
      for (const button of data.buttons) {
        const buttonText = button.textContent?.toLowerCase() || '';
        if (buttonText.includes('place') || buttonText.includes('buy') || 
            buttonText.includes('sell') || buttonText.includes('submit') ||
            buttonText.includes('order') || buttonText.includes('trade')) {
          score += 5;
        }
      }
      
      // Check if container is visible
      const style = window.getComputedStyle(container);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        score = 0; // Invisible containers get no score
      }
      
      if (score >= 10) { // Minimum threshold for consideration
        candidates.push({ container, score, data });
      }
    }
    
    // Sort by score and return the best candidate
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length > 0) {
      console.log(`Found ${candidates.length} fallback candidates, best score: ${candidates[0].score}`);
      return candidates[0].container;
    }
    
    return null;
    
  } catch (error) {
    console.warn('Error in fallback ticket detection:', error.message);
    return null;
  }
}

/**
 * Record successful detection for performance tracking
 */
function recordSuccessfulDetection(startTime) {
  const detectionTime = performance.now() - startTime;
  detectionStats.successfulDetections++;
  detectionStats.lastDetectionTime = detectionTime;
  
  // Update rolling average
  const totalTime = detectionStats.averageDetectionTime * (detectionStats.successfulDetections - 1) + detectionTime;
  detectionStats.averageDetectionTime = totalTime / detectionStats.successfulDetections;
  
  console.log(`✅ Ticket detection successful in ${detectionTime.toFixed(2)}ms`);
}

/**
 * Record failed detection for performance tracking
 */
function recordFailedDetection(startTime) {
  const detectionTime = performance.now() - startTime;
  detectionStats.failedDetections++;
  detectionStats.lastDetectionTime = detectionTime;
  
  console.warn(`❌ Ticket detection failed after ${detectionTime.toFixed(2)}ms`);
  
  // Log detection statistics periodically
  if ((detectionStats.successfulDetections + detectionStats.failedDetections) % 10 === 0) {
    logDetectionStats();
  }
}

/**
 * Log detection performance statistics
 */
function logDetectionStats() {
  const total = detectionStats.successfulDetections + detectionStats.failedDetections;
  const successRate = total > 0 ? (detectionStats.successfulDetections / total * 100).toFixed(1) : 0;
  
  console.log('📊 Ticket Detection Statistics:', {
    totalAttempts: detectionStats.totalAttempts,
    successfulDetections: detectionStats.successfulDetections,
    failedDetections: detectionStats.failedDetections,
    successRate: successRate + '%',
    averageDetectionTime: detectionStats.averageDetectionTime.toFixed(2) + 'ms',
    retryAttempts: detectionStats.retryAttempts
  });
}

/**
 * Show user-friendly error message when ticket detection fails
 */
function showTicketDetectionError(customMessage = null) {
  const message = customMessage || 'Unable to detect order ticket. The page may still be loading or Kalshi may have updated their interface.';
  
  // Create or update error notification
  let errorElement = document.getElementById('kalshi-ao-detection-error');
  
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'kalshi-ao-detection-error';
    errorElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    
    document.body.appendChild(errorElement);
  }
  
  errorElement.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <div style="flex-shrink: 0; margin-top: 1px;">⚠️</div>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Kalshi American Odds</div>
        <div style="font-size: 13px; line-height: 1.4;">${message}</div>
        <div style="font-size: 12px; margin-top: 6px; opacity: 0.9;">
          Try refreshing the page or opening a new order ticket.
        </div>
      </div>
    </div>
  `;
  
  // Show the notification
  setTimeout(() => {
    errorElement.style.opacity = '1';
    errorElement.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto-hide after 8 seconds
  setTimeout(() => {
    if (errorElement && errorElement.parentElement) {
      errorElement.style.opacity = '0';
      errorElement.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (errorElement && errorElement.parentElement) {
          errorElement.remove();
        }
      }, 300);
    }
  }, 8000);
}

/**
 * Clear any existing error notifications
 */
function clearTicketDetectionError() {
  const errorElement = document.getElementById('kalshi-ao-detection-error');
  if (errorElement) {
    errorElement.style.opacity = '0';
    errorElement.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (errorElement && errorElement.parentElement) {
        errorElement.remove();
      }
    }, 300);
  }
}
/**
 * Check if a modal element contains an order ticket
 * Enhanced with better error handling and validation
 */
async function isOrderTicketModal(modal) {
  try {
    // Validate modal element
    if (!modal || modal.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    
    // Check if modal is visible and accessible
    if (!document.contains(modal)) {
      return false;
    }
    
    const style = window.getComputedStyle(modal);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    
    // Check for order-related content with enhanced keywords
    const text = modal.textContent?.toLowerCase() || '';
    const orderIndicators = [
      'place order', 'buy', 'sell', 'quantity', 'contracts', 'limit', 'market', 'total', 'fee',
      // Additional indicators for better detection
      'place bet', 'shares', 'position', 'trade', 'order form', 'price', 'cost',
      'yes', 'no', 'submit order', 'confirm order'
    ];
    
    let indicatorCount = 0;
    const foundIndicators = [];
    
    for (const indicator of orderIndicators) {
      if (text.includes(indicator)) {
        indicatorCount++;
        foundIndicators.push(indicator);
      }
    }
    
    // Must have at least 3 order indicators and form inputs
    if (indicatorCount >= 3) {
      const inputs = modal.querySelectorAll('input, select, button');
      const hasFormElements = inputs.length >= 2; // At least price/quantity inputs
      
      if (hasFormElements) {
        console.log(`Modal validation passed: ${indicatorCount} indicators found:`, foundIndicators);
        return true;
      } else {
        console.log(`Modal has indicators but lacks form elements: ${inputs.length} inputs found`);
      }
    } else {
      console.log(`Modal lacks sufficient indicators: ${indicatorCount}/3 found:`, foundIndicators);
    }
    
    return false;
    
  } catch (error) {
    console.warn('Error validating modal as order ticket:', error.message);
    return false;
  }
}

/**
 * Check if an element contains order ticket content
 * Enhanced with better error handling and validation
 */
async function isOrderTicketElement(element, keywords) {
  try {
    // Validate element
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    
    // Check if element is accessible
    if (!document.contains(element)) {
      return false;
    }
    
    // Check if element is visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    
    const text = element.textContent?.toLowerCase() || '';
    let keywordCount = 0;
    const foundKeywords = [];
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        keywordCount++;
        foundKeywords.push(keyword);
      }
    }
    
    // Must have multiple keywords and form inputs
    if (keywordCount >= 4) {
      const inputs = element.querySelectorAll('input[type="number"], input[type="text"], select, button');
      const hasSubmitButton = element.querySelector(
        'button[type="submit"], button[class*="submit"], button[class*="place"], ' +
        'button[class*="buy"], button[class*="sell"], button[class*="order"], button[class*="trade"]'
      );
      
      const hasValidForm = inputs.length >= 2 && hasSubmitButton;
      
      if (hasValidForm) {
        console.log(`Element validation passed: ${keywordCount} keywords found:`, foundKeywords);
        return true;
      } else {
        console.log(`Element has keywords but lacks form structure: ${inputs.length} inputs, submit button: ${!!hasSubmitButton}`);
      }
    } else {
      console.log(`Element lacks sufficient keywords: ${keywordCount}/4 found:`, foundKeywords);
    }
    
    return false;
    
  } catch (error) {
    console.warn('Error validating element as order ticket:', error.message);
    return false;
  }
}

/**
 * Check if a form element has order form patterns
 * Enhanced with better error handling and validation
 */
async function hasOrderFormPattern(form) {
  try {
    // Validate form element
    if (!form || form.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    
    // Check if form is accessible
    if (!document.contains(form)) {
      return false;
    }
    
    // Check if form is visible
    const style = window.getComputedStyle(form);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    
    // Look for price/quantity inputs with enhanced detection
    const numberInputs = form.querySelectorAll('input[type="number"]');
    const textInputs = form.querySelectorAll('input[type="text"]');
    const selects = form.querySelectorAll('select');
    
    // Look for submit/action buttons with enhanced selectors
    const actionButtons = form.querySelectorAll(
      'button[type="submit"], button[class*="submit"], button[class*="place"], ' +
      'button[class*="buy"], button[class*="sell"], button[class*="order"], ' +
      'button[class*="trade"], button[class*="confirm"], input[type="submit"]'
    );
    
    // Must have inputs for price/quantity and action buttons
    const totalInputs = numberInputs.length + textInputs.length + selects.length;
    const hasInputs = totalInputs >= 2;
    const hasActions = actionButtons.length >= 1;
    
    if (hasInputs && hasActions) {
      // Additional check: look for order-related text in labels or nearby text
      const text = form.textContent?.toLowerCase() || '';
      const orderTerms = [
        'price', 'quantity', 'contracts', 'total', 'fee', 'yes', 'no', 'buy', 'sell',
        // Additional terms for better detection
        'shares', 'limit', 'market', 'cost', 'place', 'order', 'trade', 'position'
      ];
      
      let termCount = 0;
      const foundTerms = [];
      
      for (const term of orderTerms) {
        if (text.includes(term)) {
          termCount++;
          foundTerms.push(term);
        }
      }
      
      const hasValidTerms = termCount >= 3;
      
      if (hasValidTerms) {
        console.log(`Form pattern validation passed: ${totalInputs} inputs, ${actionButtons.length} buttons, ${termCount} terms:`, foundTerms);
        return true;
      } else {
        console.log(`Form has structure but lacks order terms: ${termCount}/3 found:`, foundTerms);
      }
    } else {
      console.log(`Form lacks basic structure: ${totalInputs} inputs, ${actionButtons.length} buttons`);
    }
    
    return false;
    
  } catch (error) {
    console.warn('Error validating form pattern:', error.message);
    return false;
  }
}

/**
 * Generate a hash of ticket content to detect changes
 */
function generateTicketHash(ticketElement) {
  if (!ticketElement) return null;
  
  // Create a hash based on key content that would change when ticket data changes
  const inputs = ticketElement.querySelectorAll('input, select');
  const buttons = ticketElement.querySelectorAll('button');
  const text = ticketElement.textContent?.trim() || '';
  
  let hashContent = text;
  
  // Add input values to hash
  inputs.forEach(input => {
    hashContent += `|${input.type}:${input.value}`;
  });
  
  // Add button states to hash
  buttons.forEach(button => {
    hashContent += `|btn:${button.textContent?.trim()}:${button.disabled}`;
  });
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashContent.length; i++) {
    const char = hashContent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString();
}

/**
 * Handle ticket opened event
 * Enhanced with comprehensive error handling and graceful degradation
 */
async function onTicketOpened(ticketElement) {
  console.log('Order ticket opened');
  
  try {
    // Validate ticket element before proceeding
    if (!ticketElement || !document.contains(ticketElement)) {
      throw new Error('Invalid or detached ticket element provided');
    }
    
    // Clear any existing error notifications
    clearTicketDetectionError();
    
    // Update ticket state
    ticketState.isOpen = true;
    ticketState.ticketElement = ticketElement;
    ticketState.lastTicketHash = generateTicketHash(ticketElement);
    
    // Set up dedicated observer for ticket changes with error handling
    try {
      setupTicketObserver(ticketElement);
    } catch (observerError) {
      console.warn('⚠️ Failed to setup ticket observer:', observerError.message);
      // Continue without observer - we'll still get updates from main mutation observer
    }
    
    // Parse initial ticket data with comprehensive error handling
    let ticketData = null;
    try {
      ticketData = await parseTicketData(ticketElement);
      console.log('✅ Parsed ticket data:', ticketData);
    } catch (parseError) {
      console.error('❌ Failed to parse ticket data:', parseError.message);
      logParsingError('onTicketOpened', `Ticket parsing failed: ${parseError.message}`, ticketElement, parseError);
      
      // Show user-friendly error message
      showTicketDetectionError('Unable to read order ticket information. Some features may not work correctly.');
      
      // Create minimal ticket data for graceful degradation
      ticketData = {
        side: null,
        price: null,
        quantity: null,
        fee: null,
        isValid: false,
        errors: [`Parsing failed: ${parseError.message}`],
        timestamp: Date.now(),
        parseTime: null,
        fallbacksUsed: [],
        gracefulDegradation: true
      };
    }
    
    // Calculate and display after-fee odds if data is valid or can proceed
    if (ticketData && (ticketData.isValid || ticketData.validationSummary?.canProceed)) {
      try {
        await updateAfterFeeOddsDisplay(ticketElement, ticketData);
        console.log('✅ After-fee odds display updated successfully');
      } catch (displayError) {
        console.error('❌ Failed to update after-fee odds display:', displayError.message);
        logParsingError('onTicketOpened', `Display update failed: ${displayError.message}`, ticketElement, displayError);
        
        // Don't show error to user for display issues - the ticket still works
        console.log('ℹ️ Continuing without after-fee odds display');
      }
    } else if (ticketData && !ticketData.gracefulDegradation) {
      console.warn('⚠️ Ticket data validation failed, skipping after-fee odds display');
      console.log('Validation errors:', ticketData.errors);
      
      // Show user-friendly message about missing data
      showTicketDetectionError('Some order information could not be read. After-fee calculations may not be available.');
    }
    
    // Initialize helper panel with error handling
    try {
      await initializeHelperPanel(ticketElement, ticketData);
      console.log('✅ Helper panel initialized successfully');
    } catch (helperError) {
      console.error('❌ Failed to initialize helper panel:', helperError.message);
      logParsingError('onTicketOpened', `Helper panel initialization failed: ${helperError.message}`, ticketElement, helperError);
      
      // Continue without helper panel - core functionality still works
      console.log('ℹ️ Continuing without helper panel');
    }
    
    // Dispatch custom event for other parts of the extension
    try {
      const event = new CustomEvent('kalshi-ao-ticket-opened', {
        detail: { 
          ticketElement, 
          ticketData,
          success: true,
          errors: ticketData?.errors || []
        }
      });
      document.dispatchEvent(event);
    } catch (eventError) {
      console.warn('⚠️ Failed to dispatch ticket opened event:', eventError.message);
      // This is not critical - continue without the event
    }
    
    console.log('✅ Ticket opened event handling completed');
    
  } catch (error) {
    console.error('❌ Critical error in onTicketOpened:', error.message);
    logParsingError('onTicketOpened', `Critical error: ${error.message}`, ticketElement, error);
    
    // Reset ticket state on critical error
    ticketState.isOpen = false;
    ticketState.ticketElement = null;
    ticketState.lastTicketHash = null;
    
    // Show user-friendly error message
    showTicketDetectionError('A critical error occurred while processing the order ticket. Please try refreshing the page.');
    
    // Dispatch error event
    try {
      const errorEvent = new CustomEvent('kalshi-ao-ticket-error', {
        detail: { 
          error: error.message,
          ticketElement,
          phase: 'opened'
        }
      });
      document.dispatchEvent(errorEvent);
    } catch (eventError) {
      console.warn('⚠️ Failed to dispatch error event:', eventError.message);
    }
  }
}

/**
 * Handle ticket closed event
 */
function onTicketClosed() {
  console.log('Order ticket closed');
  
  const previousTicketElement = ticketState.ticketElement;
  
  // Clear after-fee odds display
  if (previousTicketElement) {
    clearAfterFeeOddsDisplay(previousTicketElement);
  }
  
  ticketState.isOpen = false;
  ticketState.ticketElement = null;
  ticketState.lastTicketHash = null;
  
  // Clean up ticket observer
  if (ticketState.ticketObserver) {
    ticketState.ticketObserver.disconnect();
    ticketState.ticketObserver = null;
  }
  
  // Dispatch custom event
  const event = new CustomEvent('kalshi-ao-ticket-closed', {
    detail: { previousTicketElement }
  });
  document.dispatchEvent(event);
}

/**
 * Handle ticket content changed event
 * Enhanced with comprehensive error handling and graceful degradation
 */
async function onTicketContentChanged(ticketElement) {
  console.log('Order ticket content changed');
  
  try {
    // Validate ticket element is still accessible
    if (!ticketElement || !document.contains(ticketElement)) {
      console.warn('⚠️ Ticket element is no longer accessible, closing ticket');
      onTicketClosed();
      return;
    }
    
    // Update ticket hash
    ticketState.lastTicketHash = generateTicketHash(ticketElement);
    
    // Re-parse ticket data with error handling
    let ticketData = null;
    try {
      ticketData = await parseTicketData(ticketElement);
      console.log('✅ Updated ticket data:', ticketData);
    } catch (parseError) {
      console.error('❌ Failed to re-parse ticket data:', parseError.message);
      logParsingError('onTicketContentChanged', `Re-parsing failed: ${parseError.message}`, ticketElement, parseError);
      
      // Try to continue with previous data or graceful degradation
      console.log('🔄 Attempting to continue with graceful degradation...');
      
      // Create minimal ticket data for graceful degradation
      ticketData = {
        side: null,
        price: null,
        quantity: null,
        fee: null,
        isValid: false,
        errors: [`Re-parsing failed: ${parseError.message}`],
        timestamp: Date.now(),
        parseTime: null,
        fallbacksUsed: [],
        gracefulDegradation: true
      };
    }
    
    // Update after-fee odds display if data is valid or can proceed
    if (ticketData && (ticketData.isValid || ticketData.validationSummary?.canProceed)) {
      try {
        await updateAfterFeeOddsDisplay(ticketElement, ticketData);
        console.log('✅ After-fee odds display updated successfully');
      } catch (displayError) {
        console.error('❌ Failed to update after-fee odds display:', displayError.message);
        logParsingError('onTicketContentChanged', `Display update failed: ${displayError.message}`, ticketElement, displayError);
        
        // Clear display on error to avoid showing stale data
        try {
          clearAfterFeeOddsDisplay(ticketElement);
        } catch (clearError) {
          console.warn('⚠️ Failed to clear after-fee odds display:', clearError.message);
        }
      }
    } else {
      // Clear after-fee odds display if data is invalid
      console.log('ℹ️ Clearing after-fee odds display due to invalid data');
      try {
        clearAfterFeeOddsDisplay(ticketElement);
      } catch (clearError) {
        console.warn('⚠️ Failed to clear after-fee odds display:', clearError.message);
      }
    }
    
    // Update helper panel with error handling
    try {
      await updateHelperPanel(ticketElement, ticketData);
      console.log('✅ Helper panel updated successfully');
    } catch (helperError) {
      console.error('❌ Failed to update helper panel:', helperError.message);
      logParsingError('onTicketContentChanged', `Helper panel update failed: ${helperError.message}`, ticketElement, helperError);
      
      // Continue without helper panel update - not critical
      console.log('ℹ️ Continuing without helper panel update');
    }
    
    // Dispatch custom event with error handling
    try {
      const event = new CustomEvent('kalshi-ao-ticket-changed', {
        detail: { 
          ticketElement, 
          ticketData,
          success: true,
          errors: ticketData?.errors || []
        }
      });
      document.dispatchEvent(event);
    } catch (eventError) {
      console.warn('⚠️ Failed to dispatch ticket changed event:', eventError.message);
      // This is not critical - continue without the event
    }
    
    console.log('✅ Ticket content changed event handling completed');
    
  } catch (error) {
    console.error('❌ Critical error in onTicketContentChanged:', error.message);
    logParsingError('onTicketContentChanged', `Critical error: ${error.message}`, ticketElement, error);
    
    // On critical error, try to recover by clearing displays
    try {
      clearAfterFeeOddsDisplay(ticketElement);
    } catch (clearError) {
      console.warn('⚠️ Failed to clear displays during error recovery:', clearError.message);
    }
    
    // Show user-friendly error message
    showTicketDetectionError('An error occurred while updating order information. Some features may not work correctly.');
    
    // Dispatch error event
    try {
      const errorEvent = new CustomEvent('kalshi-ao-ticket-error', {
        detail: { 
          error: error.message,
          ticketElement,
          phase: 'content-changed'
        }
      });
      document.dispatchEvent(errorEvent);
    } catch (eventError) {
      console.warn('⚠️ Failed to dispatch error event:', eventError.message);
    }
  }
}

/**
 * Update after-fee odds display in the ticket
 * @param {Element} ticketElement - The ticket element
 * @param {Object} ticketData - Parsed ticket data
 */
async function updateAfterFeeOddsDisplay(ticketElement, ticketData) {
  try {
    console.log('Updating after-fee odds display...');
    
    // Only show after-fee odds if display mode is afterFeeAmerican
    const effectiveMode = getEffectiveDisplayMode();
    if (effectiveMode !== 'afterFeeAmerican') {
      console.log('Skipping after-fee odds display - effective mode is', effectiveMode);
      clearAfterFeeOddsDisplay(ticketElement);
      return;
    }
    
    // Calculate after-fee odds
    const afterFeeResult = calculateAfterFeeOddsFromTicket(ticketData);
    
    if (!afterFeeResult) {
      console.warn('Could not calculate after-fee odds, clearing display');
      clearAfterFeeOddsDisplay(ticketElement);
      return;
    }
    
    console.log('After-fee odds calculation result:', afterFeeResult);
    
    // Find or create after-fee odds display element
    let oddsDisplay = ticketElement.querySelector('[data-kalshi-ao-after-fee]');
    
    if (!oddsDisplay) {
      oddsDisplay = createAfterFeeOddsElement(afterFeeResult);
      
      // Find a good location to inject the display with enhanced positioning (Task 4.4.3)
      const injectionPoint = findAfterFeeOddsInjectionPoint(ticketElement);
      if (injectionPoint && validateInjectionPoint(injectionPoint, ticketElement)) {
        injectionPoint.appendChild(oddsDisplay);
        console.log('After-fee odds display injected at validated injection point');
      } else {
        console.warn('Could not find suitable injection point for after-fee odds display');
        // Try fallback injection
        const fallbackPoint = ticketElement;
        if (fallbackPoint && validateInjectionPoint(fallbackPoint, ticketElement)) {
          fallbackPoint.appendChild(oddsDisplay);
          console.log('After-fee odds display injected at fallback location');
        } else {
          console.error('Failed to inject after-fee odds display - no valid injection point');
          return;
        }
      }
    } else {
      // Update existing display
      updateAfterFeeOddsElement(oddsDisplay, afterFeeResult);
      console.log('After-fee odds display updated');
    }
    
  } catch (error) {
    console.error('Error updating after-fee odds display:', error);
    clearAfterFeeOddsDisplay(ticketElement);
  }
}

/**
 * Task 5.3.3: Update after-fee odds display using current ticket state
 * This version can be called without parameters during fee transitions
 */
async function updateAfterFeeOddsDisplayFromCurrentState() {
  if (!ticketState.isOpen || !ticketState.ticketElement) {
    console.log('No active ticket for after-fee odds update');
    return;
  }
  
  try {
    // Parse current ticket data
    const ticketData = await parseTicketData(ticketState.ticketElement);
    
    // Update the display with current data
    await updateAfterFeeOddsDisplay(ticketState.ticketElement, ticketData);
    
  } catch (error) {
    console.error('Error updating after-fee odds display during transition:', error);
  }
}

/**
 * Clear after-fee odds display from ticket
 * @param {Element} ticketElement - The ticket element
 */
function clearAfterFeeOddsDisplay(ticketElement) {
  if (!ticketElement) return;
  
  const existingDisplay = ticketElement.querySelector('[data-kalshi-ao-after-fee]');
  if (existingDisplay) {
    existingDisplay.remove();
    console.log('After-fee odds display cleared');
  }
}

/**
 * Create after-fee odds display element
 * @param {Object} afterFeeResult - After-fee odds calculation result
 * @returns {Element} The created display element
 */
function createAfterFeeOddsElement(afterFeeResult) {
  const container = document.createElement('div');
  container.className = 'kalshi-ao-after-fee-display';
  container.setAttribute('data-kalshi-ao-after-fee', '1');
  
  // Apply comprehensive click-safe styling
  container.style.cssText = `
    pointer-events: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    margin: 8px 0;
    padding: 8px 12px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #495057;
    cursor: default !important;
    outline: none !important;
    text-decoration: none !important;
    display: block !important;
    position: static !important;
    z-index: auto !important;
  `;
  
  // Create content
  updateAfterFeeOddsElement(container, afterFeeResult);
  
  // Ensure element cannot receive focus or interaction
  container.setAttribute('tabindex', '-1');
  container.setAttribute('aria-hidden', 'true');
  preventInteraction(container);
  
  return container;
}

/**
 * Create detailed fee source tooltip content with enhanced explanations (Task 4.4.2 + 6.4.1 + 6.4.3)
 * @param {string} feeSource - Source of fee information ('ticket' or 'estimated')
 * @param {number} feePerContract - Fee per contract amount
 * @param {Object} afterFeeResult - Complete calculation result
 * @returns {string} Formatted tooltip text
 */
function createFeeSourceTooltip(feeSource, feePerContract, afterFeeResult) {
  // Task 6.4.1: Enhanced tooltip with fallback detection information
  const fallbackInfo = afterFeeResult.fallbackDetection || afterFeeResult.isUsingFallbackFee;
  
  if (feeSource === 'ticket') {
    let tooltip = `💰 Fee Source: Read from Kalshi Ticket (ACTUAL)

✅ WHAT THIS MEANS FOR YOU:
• You're seeing the EXACT fee Kalshi will charge for this order
• This is the most accurate fee information possible - no guessing!
• Your after-fee odds calculations are precise and reliable
• The fee updates instantly when you change your order details

🔍 HOW WE GET THIS INFORMATION:
• Our extension reads fee data directly from your order ticket
• We monitor Kalshi's interface to capture real-time fee calculations
• Multiple detection methods ensure we don't miss fee updates
• All data comes straight from Kalshi's own systems

📊 CALCULATION ACCURACY:
• After-fee odds use your exact fee amount: $${feePerContract.toFixed(4)} per contract
• No approximations or estimates - uses Kalshi's precise calculations
• Accounts for all fee components (taker/maker, volume discounts, etc.)
• Updates within milliseconds when order parameters change

💡 WHY THIS IS BETTER:
• More accurate than any estimation formula
• Reflects current market conditions and your account status
• Includes any special pricing or discounts you may have
• Eliminates guesswork from fee calculations`;
    
    // Add fallback detection confidence if available
    if (fallbackInfo && typeof fallbackInfo === 'object' && fallbackInfo.confidence !== undefined) {
      tooltip += `\n\n🔍 DATA RELIABILITY: ${Math.round(fallbackInfo.confidence * 100)}% confidence`;
      tooltip += `\n• High confidence = very reliable fee extraction`;
      tooltip += `\n• Lower confidence may indicate UI loading delays`;
    }
    
    return tooltip;
  } else if (feeSource === 'estimated') {
    let tooltip = `⚠️ Fee Source: Estimated from Published Schedule (FALLBACK)

🔄 WHY YOU'RE SEEING ESTIMATED FEES:
• We can't access the exact fee from your order ticket right now
• This happens when the ticket is still loading or temporarily hidden
• Don't worry - we use Kalshi's official fee rates to estimate
• The estimate gives you a good approximation while we wait for real data

📋 HOW WE CALCULATE THE ESTIMATE:
• We use Kalshi's official published fee schedule (kept up-to-date)
• Current fee structure (as of 2024):
  - Most orders pay 7% taker fee (when you take liquidity)
  - Some orders pay 1.75% maker fee (when you provide liquidity)
• Simple formula: max($0.01, min(price × quantity × 7%, $1.00))
• We assume the higher taker fee to be conservative (better to overestimate)

🧮 YOUR ESTIMATED FEE BREAKDOWN:
• Your order: $${(afterFeeResult.price || 0).toFixed(2)} × ${afterFeeResult.quantity || 1} contracts
• Notional value: $${((afterFeeResult.price || 0) * (afterFeeResult.quantity || 1)).toFixed(2)}
• Estimated fee rate: 7% (taker assumption)
• Calculated fee: $${feePerContract.toFixed(4)} per contract
• Fee cap: $1.00 maximum, $0.01 minimum per contract

⚠️ WHAT YOU SHOULD KNOW ABOUT ESTIMATES:
• Estimates might be off by ±10-20% compared to actual fees
• We can't account for volume discounts or special account pricing
• We use the standard taker fee rate (7%) to be conservative
• Your actual account status and market conditions aren't reflected

🔄 WHEN FALLBACK IS TRIGGERED:
• Order ticket fee display is not visible or accessible
• Fee parsing fails due to UI changes or loading delays
• Extension cannot reliably extract fee from ticket elements
• User has enabled fallback estimation in extension settings
• Network delays prevent real-time fee data retrieval`;
    
    // Task 6.4.1: Add detailed fallback detection information
    if (fallbackInfo && typeof fallbackInfo === 'object') {
      tooltip += `\n\n🔍 FALLBACK DETECTION DETAILS:`;
      tooltip += `\n• Detection method: ${fallbackInfo.detectionMethod || 'automatic'}`;
      tooltip += `\n• Confidence level: ${Math.round((fallbackInfo.confidence || 0) * 100)}%`;
      
      if (fallbackInfo.reasons && fallbackInfo.reasons.length > 0) {
        tooltip += `\n• Specific trigger reasons:`;
        fallbackInfo.reasons.slice(0, 3).forEach(reason => {
          tooltip += `\n  - ${reason}`;
        });
        if (fallbackInfo.reasons.length > 3) {
          tooltip += `\n  - ... and ${fallbackInfo.reasons.length - 3} more reasons`;
        }
      }
      
      // Add estimation accuracy information if available
      if (fallbackInfo.estimationAccuracy) {
        tooltip += `\n\n📊 ESTIMATION ACCURACY TRACKING:`;
        tooltip += `\n• Historical accuracy: ${Math.round((fallbackInfo.estimationAccuracy.accurateEstimations / fallbackInfo.estimationAccuracy.totalEstimations) * 100)}%`;
        tooltip += `\n• Average error: ${fallbackInfo.estimationAccuracy.averageError.toFixed(3)}`;
        tooltip += `\n• Total estimations: ${fallbackInfo.estimationAccuracy.totalEstimations}`;
      }
    } else if (afterFeeResult.isUsingFallbackFee) {
      tooltip += `\n\n🔍 Fallback fee estimation is currently active`;
    }
    
    tooltip += `\n\n💡 HOW TO GET EXACT FEES:
• Make sure your order ticket is fully loaded and visible
• Try refreshing the page and reopening the order ticket
• Fill in all order details (price, quantity, side) completely
• Give it a moment - sometimes the ticket needs time to load fee info`;
    
    return tooltip;
  } else {
    let tooltip = `❌ Fee Source: Unknown (ERROR STATE)

🚨 WHAT THIS MEANS:
• Extension could not determine how fees were calculated
• Fee calculations may be inaccurate or completely wrong
• This indicates a technical issue that needs attention

⚠️ POTENTIAL CAUSES:
• Order ticket is in an unexpected state
• UI elements have changed and are not recognized
• Network connectivity issues preventing fee data retrieval
• Extension bug or compatibility issue with current Kalshi version

🔧 IMMEDIATE TROUBLESHOOTING STEPS:
1. Refresh the page and reopen the order ticket
2. Ensure the order ticket is fully loaded (all fields visible)
3. Check that you have a stable internet connection
4. Try enabling fallback fee estimation in extension settings
5. Clear browser cache and reload the page

🛠️ ADVANCED TROUBLESHOOTING:
• Check browser console for error messages
• Verify extension is up to date
• Try disabling other browser extensions temporarily
• Report this issue with details about your browser and Kalshi page

⚠️ RISK WARNING:
• Do not rely on fee calculations in this state
• Manually verify fees in Kalshi's order ticket before placing orders
• Consider the displayed after-fee odds as potentially inaccurate`;
    
    // Add fallback detection info even for unknown sources
    if (fallbackInfo && typeof fallbackInfo === 'object' && fallbackInfo.confidence > 0) {
      tooltip += `\n\n🔍 DIAGNOSTIC INFORMATION:`;
      tooltip += `\n• Possible fallback usage detected: ${Math.round(fallbackInfo.confidence * 100)}% confidence`;
      tooltip += `\n• This suggests partial fee detection may be working`;
      tooltip += `\n• Try refreshing to see if issue resolves`;
    }
    
    return tooltip;
  }
}

/**
 * Enhance fee source tooltip with interactive behavior (Task 4.4.2)
 * @param {Element} element - Fee source indicator element
 * @param {string} feeSource - Source of fee information
 * @param {number} feePerContract - Fee per contract amount
 * @param {Object} afterFeeResult - Complete calculation result
 */
function enhanceFeeSourceTooltip(element, feeSource, feePerContract, afterFeeResult) {
  // Ensure the element is non-interactive but shows cursor help
  element.style.cssText += `
    pointer-events: none !important;
    cursor: help !important;
    position: relative;
  `;
  
  // Add data attributes for potential future enhancements
  element.setAttribute('data-fee-amount', feePerContract.toFixed(4));
  element.setAttribute('data-fee-source', feeSource);
  element.setAttribute('data-tooltip-enhanced', 'true');
  
  // Add accessibility attributes
  element.setAttribute('aria-label', createFeeSourceTooltip(feeSource, feePerContract, afterFeeResult));
  element.setAttribute('role', 'tooltip');
}

/**
 * Update after-fee odds element content with enhanced fee source tooltip and fallback detection
 * @param {Element} element - The display element to update
 * @param {Object} afterFeeResult - After-fee odds calculation result
 */
function updateAfterFeeOddsElement(element, afterFeeResult) {
  const { 
    afterFeeOdds, 
    rawOdds, 
    feePerContract, 
    feeSource, 
    risk, 
    profit,
    // Task 6.4.1: Include fallback detection information
    isUsingFallbackFee,
    fallbackConfidence,
    fallbackReasons
  } = afterFeeResult;
  
  // Format odds display - always integer
  const formatOdds = (odds) => {
    const roundedOdds = Math.round(odds);
    return roundedOdds > 0 ? `+${roundedOdds}` : `${roundedOdds}`;
  };
  
  const afterFeeOddsText = formatOdds(afterFeeOdds);
  const rawOddsText = rawOdds ? formatOdds(rawOdds) : 'N/A';
  
  // Create fee source tooltip content (Task 4.4.2 + 6.4.1)
  const feeSourceTooltip = createFeeSourceTooltip(feeSource, feePerContract, afterFeeResult);
  
  // Task 6.4.1: Enhanced fee source indicator with fallback detection
  let feeSourceText = '';
  let feeSourceClass = 'ticket';
  let feeSourceColor = '#28a745';
  let feeSourceIcon = '✓';
  
  if (feeSource === 'estimated' || isUsingFallbackFee) {
    feeSourceText = ' (estimated)';
    feeSourceClass = 'estimated';
    feeSourceColor = '#ffc107';
    feeSourceIcon = '⚠️';
    
    // Add confidence indicator if available
    if (fallbackConfidence !== undefined && fallbackConfidence > 0) {
      const confidencePercent = Math.round(fallbackConfidence * 100);
      feeSourceText += ` ${confidencePercent}%`;
    }
  } else if (feeSource === 'ticket') {
    feeSourceText = '';
    // Check if fallback detection suggests this might actually be estimated
    if (isUsingFallbackFee && fallbackConfidence > 0.5) {
      feeSourceText = ' (possibly estimated)';
      feeSourceClass = 'uncertain';
      feeSourceColor = '#fd7e14';
      feeSourceIcon = '❓';
    }
  }
  
  // Task 6.4.2: Create estimated label for main display
  let estimatedLabel = '';
  if (feeSource === 'estimated' || isUsingFallbackFee) {
    estimatedLabel = `<span class="estimated-label" 
                           style="background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 3px; 
                                  font-size: 10px; font-weight: 600; margin-left: 8px; border: 1px solid #ffeaa7;">
                        ESTIMATED
                      </span>`;
  }

  element.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px; color: #212529;">
      After-Fee Odds: <span style="color: ${afterFeeOdds > 0 ? '#28a745' : '#dc3545'};">${afterFeeOddsText}</span>${estimatedLabel}
    </div>
    <div style="font-size: 12px; color: #6c757d; margin-bottom: 2px;">
      Raw Odds: ${rawOddsText} → After-Fee: ${afterFeeOddsText}
    </div>
    <div style="font-size: 12px; color: #6c757d;">
      Fee: ${feePerContract.toFixed(4)}/contract
      <span class="fee-source-indicator ${feeSourceClass}" 
            style="color: ${feeSourceColor}; margin-left: 4px; cursor: help; font-weight: 500;"
            title="${feeSourceTooltip}"
            data-fee-source="${feeSource}"
            data-fallback-detected="${isUsingFallbackFee || false}"
            data-fallback-confidence="${fallbackConfidence || 0}">
        ${feeSourceIcon}${feeSourceText}
      </span>
    </div>
  `;
  
  // Add enhanced tooltip with calculation details and fee source information (Task 6.4.3)
  let calculationTooltip = `🧮 AFTER-FEE ODDS CALCULATION BREAKDOWN

📊 CALCULATION COMPONENTS:
• Order Price: $${(afterFeeResult.price || 0).toFixed(3)} per contract
• Fee per Contract: $${feePerContract.toFixed(4)} (${feeSource === 'ticket' ? 'actual from ticket' : 'estimated'})
• Total Risk: $${risk.toFixed(3)} (price + fee per contract)
• Potential Profit: $${profit.toFixed(3)} (1 - total risk)

🎯 ODDS CALCULATION METHOD:
${afterFeeResult.calculations.oddsFormula}

💡 WHAT THIS MEANS:
• If you win: You receive $1.00 per contract
• Your total cost: $${risk.toFixed(3)} per contract (including fees)
• Your net profit: $${profit.toFixed(3)} per contract if you win
• Break-even probability: ${(risk * 100).toFixed(1)}%

📈 AMERICAN ODDS EXPLANATION:
${afterFeeOdds > 0 ? 
  `• Positive odds (+${afterFeeOdds}): You profit $${afterFeeOdds} for every $100 wagered
• To win $100, you need to risk $${(10000 / afterFeeOdds).toFixed(2)}
• Implied probability: ${((100 / (afterFeeOdds + 100)) * 100).toFixed(1)}%` :
  `• Negative odds (${afterFeeOdds}): You need to risk $${Math.abs(afterFeeOdds)} to win $100
• To win $${(10000 / Math.abs(afterFeeOdds)).toFixed(2)}, you need to risk $100
• Implied probability: ${((Math.abs(afterFeeOdds) / (Math.abs(afterFeeOdds) + 100)) * 100).toFixed(1)}%`}

${feeSource === 'ticket' ? 
  `✅ ACCURACY: Using exact fees from Kalshi ticket - most accurate calculation possible` :
  `⚠️ ACCURACY: Using estimated fees - actual odds may differ by ±10-20%`}

${feeSourceTooltip}`;
  
  // Task 6.4.1: Add fallback detection details to tooltip
  if (isUsingFallbackFee && fallbackReasons && fallbackReasons.length > 0) {
    calculationTooltip += `\n\n🔍 FALLBACK DETECTION REASONS:`;
    fallbackReasons.slice(0, 3).forEach(reason => {
      calculationTooltip += `\n• ${reason}`;
    });
    if (fallbackReasons.length > 3) {
      calculationTooltip += `\n• ... and ${fallbackReasons.length - 3} more reasons`;
    }
  }
  
  element.setAttribute('title', calculationTooltip);
  
  // Add hover enhancement for fee source indicator
  const feeSourceIndicator = element.querySelector('.fee-source-indicator');
  if (feeSourceIndicator) {
    enhanceFeeSourceTooltip(feeSourceIndicator, feeSource, feePerContract, afterFeeResult);
  }
}

/**
 * Find suitable injection point for after-fee odds display with enhanced positioning (Task 4.4.3)
 * @param {Element} ticketElement - The ticket element
 * @returns {Element|null} Injection point or null if not found
 */
function findAfterFeeOddsInjectionPoint(ticketElement) {
  console.log('Finding injection point for after-fee odds display...');
  
  // Strategy 1: Look for existing fee display areas (highest priority)
  const feeInjectionPoint = findFeeAreaInjectionPoint(ticketElement);
  if (feeInjectionPoint) {
    console.log('Found fee area injection point');
    return feeInjectionPoint;
  }
  
  // Strategy 2: Look for order summary or totals section
  const summaryInjectionPoint = findSummaryAreaInjectionPoint(ticketElement);
  if (summaryInjectionPoint) {
    console.log('Found summary area injection point');
    return summaryInjectionPoint;
  }
  
  // Strategy 3: Look for form sections with inputs (inject after inputs, before buttons)
  const formInjectionPoint = findFormSectionInjectionPoint(ticketElement);
  if (formInjectionPoint) {
    console.log('Found form section injection point');
    return formInjectionPoint;
  }
  
  // Strategy 4: Look for button containers (inject before action buttons)
  const buttonInjectionPoint = findButtonAreaInjectionPoint(ticketElement);
  if (buttonInjectionPoint) {
    console.log('Found button area injection point');
    return buttonInjectionPoint;
  }
  
  // Strategy 5: Create a dedicated container if no suitable location found
  const dedicatedContainer = createDedicatedInjectionContainer(ticketElement);
  if (dedicatedContainer) {
    console.log('Created dedicated injection container');
    return dedicatedContainer;
  }
  
  console.warn('Could not find or create suitable injection point');
  return null;
}

/**
 * Find injection point near existing fee displays (Task 4.4.3)
 * @param {Element} ticketElement - The ticket element
 * @returns {Element|null} Injection point or null if not found
 */
function findFeeAreaInjectionPoint(ticketElement) {
  const feeSelectors = [
    '[class*="fee"]',
    '[class*="cost"]',
    '[class*="total"]',
    '[class*="summary"]',
    '[class*="charge"]',
    '[class*="price"]'
  ];
  
  for (const selector of feeSelectors) {
    const feeElements = ticketElement.querySelectorAll(selector);
    for (const feeElement of feeElements) {
      // Check if this element contains fee-related text
      const text = feeElement.textContent?.toLowerCase() || '';
      if (text.includes('fee') || text.includes('cost') || text.includes('total') || 
          text.includes('charge') || text.includes('$')) {
        
        // Try to find the best parent container
        const container = findBestParentContainer(feeElement, ticketElement);
        if (container) {
          return container;
        }
      }
    }
  }
  
  return null;
}

/**
 * Find injection point in order summary or totals section (Task 4.4.3)
 * @param {Element} ticketElement - The ticket element
 * @returns {Element|null} Injection point or null if not found
 */
function findSummaryAreaInjectionPoint(ticketElement) {
  const summarySelectors = [
    '[class*="summary"]',
    '[class*="total"]',
    '[class*="breakdown"]',
    '[class*="details"]',
    '[class*="info"]'
  ];
  
  for (const selector of summarySelectors) {
    const summaryElements = ticketElement.querySelectorAll(selector);
    for (const summaryElement of summaryElements) {
      // Check if this looks like a summary section
      const hasMultipleLines = summaryElement.children.length >= 2;
      const hasRelevantText = summaryElement.textContent?.toLowerCase().includes('total') ||
                             summaryElement.textContent?.toLowerCase().includes('summary') ||
                             summaryElement.textContent?.toLowerCase().includes('$');
      
      if (hasMultipleLines && hasRelevantText) {
        return summaryElement;
      }
    }
  }
  
  return null;
}

/**
 * Find injection point in form sections (Task 4.4.3)
 * @param {Element} ticketElement - The ticket element
 * @returns {Element|null} Injection point or null if not found
 */
function findFormSectionInjectionPoint(ticketElement) {
  const formSelectors = [
    'form',
    '[class*="form"]',
    '[class*="input"]',
    '[class*="field"]',
    '[class*="group"]'
  ];
  
  for (const selector of formSelectors) {
    const formElements = ticketElement.querySelectorAll(selector);
    for (const formElement of formElements) {
      // Check if this contains relevant inputs
      const inputs = formElement.querySelectorAll('input, select, textarea');
      const relevantInputs = Array.from(inputs).filter(input => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        const label = input.getAttribute('aria-label')?.toLowerCase() || '';
        const name = input.name?.toLowerCase() || '';
        
        return placeholder.includes('price') || placeholder.includes('quantity') ||
               label.includes('price') || label.includes('quantity') ||
               name.includes('price') || name.includes('quantity');
      });
      
      if (relevantInputs.length >= 1) {
        // Find a good container within or around this form element
        const container = findBestParentContainer(formElement, ticketElement);
        return container || formElement;
      }
    }
  }
  
  return null;
}

/**
 * Find injection point near action buttons (Task 4.4.3)
 * @param {Element} ticketElement - The ticket element
 * @returns {Element|null} Injection point or null if not found
 */
function findButtonAreaInjectionPoint(ticketElement) {
  const buttonContainers = ticketElement.querySelectorAll('div, section, footer');
  
  for (const container of buttonContainers) {
    const buttons = container.querySelectorAll('button');
    if (buttons.length > 0) {
      // Check if buttons are action buttons
      const hasActionButton = Array.from(buttons).some(button => {
        const text = button.textContent?.toLowerCase() || '';
        return text.includes('place') || text.includes('buy') || text.includes('sell') || 
               text.includes('submit') || text.includes('order') || text.includes('confirm');
      });
      
      if (hasActionButton) {
        // Create a wrapper to inject before the button container
        const wrapper = document.createElement('div');
        wrapper.className = 'kalshi-ao-injection-wrapper';
        wrapper.style.cssText = `
          margin-bottom: 12px;
          position: relative;
        `;
        
        container.parentElement?.insertBefore(wrapper, container);
        return wrapper;
      }
    }
  }
  
  return null;
}

/**
 * Create a dedicated injection container (Task 4.4.3)
 * @param {Element} ticketElement - The ticket element
 * @returns {Element|null} Created container or null if failed
 */
function createDedicatedInjectionContainer(ticketElement) {
  try {
    // Find the best location within the ticket element
    const children = Array.from(ticketElement.children);
    
    // Look for a good insertion point (before buttons, after inputs)
    let insertionPoint = null;
    
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const hasButtons = child.querySelectorAll('button').length > 0;
      
      if (hasButtons) {
        insertionPoint = child;
        break;
      }
    }
    
    // Create dedicated container
    const container = document.createElement('div');
    container.className = 'kalshi-ao-dedicated-container';
    container.style.cssText = `
      margin: 12px 0;
      padding: 0;
      position: relative;
      clear: both;
    `;
    
    if (insertionPoint) {
      ticketElement.insertBefore(container, insertionPoint);
    } else {
      ticketElement.appendChild(container);
    }
    
    return container;
  } catch (error) {
    console.error('Failed to create dedicated injection container:', error);
    return null;
  }
}

/**
 * Find the best parent container for injection (Task 4.4.3)
 * @param {Element} element - The reference element
 * @param {Element} ticketElement - The ticket element (boundary)
 * @returns {Element|null} Best parent container or null
 */
function findBestParentContainer(element, ticketElement) {
  let current = element;
  let bestContainer = null;
  
  // Traverse up the DOM tree to find a suitable container
  while (current && current !== ticketElement && current.parentElement) {
    current = current.parentElement;
    
    // Check if this element is a good container
    const isContainer = current.tagName === 'DIV' || 
                       current.tagName === 'SECTION' || 
                       current.tagName === 'ARTICLE';
    
    const hasGoodStructure = current.children.length >= 1 && current.children.length <= 10;
    const hasReasonableSize = current.offsetHeight > 20 && current.offsetHeight < 500;
    
    if (isContainer && hasGoodStructure && hasReasonableSize) {
      bestContainer = current;
    }
  }
  
  return bestContainer;
}

/**
 * Validate injection point suitability (Task 4.4.3)
 * @param {Element} injectionPoint - The proposed injection point
 * @param {Element} ticketElement - The ticket element
 * @returns {boolean} Whether the injection point is suitable
 */
function validateInjectionPoint(injectionPoint, ticketElement) {
  if (!injectionPoint || !document.contains(injectionPoint)) {
    return false;
  }
  
  // Check if injection point is within ticket element
  if (!ticketElement.contains(injectionPoint) && injectionPoint !== ticketElement) {
    return false;
  }
  
  // Check if injection point has reasonable dimensions
  const rect = injectionPoint.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 20) {
    return false;
  }
  
  // Check if injection point is visible
  const style = window.getComputedStyle(injectionPoint);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  return true;
}

/**
 * Generate a hash of ticket content for change detection (Task 4.4.4)
 * @param {Element} ticketElement - The ticket element
 * @returns {string} Hash of ticket content
 */
function generateTicketHash(ticketElement) {
  if (!ticketElement) return '';
  
  try {
    // Collect relevant content for hashing
    const inputs = ticketElement.querySelectorAll('input, select, textarea');
    const inputValues = Array.from(inputs).map(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        return `${input.name || input.id}:${input.checked}`;
      }
      return `${input.name || input.id}:${input.value}`;
    }).join('|');
    
    // Include text content of key elements
    const textElements = ticketElement.querySelectorAll('[class*="fee"], [class*="total"], [class*="price"]');
    const textContent = Array.from(textElements).map(el => el.textContent?.trim()).join('|');
    
    // Create simple hash
    const content = `${inputValues}|${textContent}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  } catch (error) {
    console.error('Error generating ticket hash:', error);
    return Date.now().toString(); // Fallback to timestamp
  }
}

/**
 * Set up ticket observer for dynamic updates (Task 4.4.4, enhanced for Task 5.3.2)
 * @param {Element} ticketElement - The ticket element to observe
 */
function setupTicketObserver(ticketElement) {
  if (ticketState.ticketObserver) {
    ticketState.ticketObserver.disconnect();
  }
  
  ticketState.ticketObserver = new MutationObserver((mutations) => {
    let shouldCheck = false;
    let hasInputChange = false;
    
    mutations.forEach((mutation) => {
      // Check for changes that might affect ticket data
      if (mutation.type === 'childList' || 
          mutation.type === 'characterData' ||
          (mutation.type === 'attributes' && 
           ['value', 'disabled', 'selected', 'checked'].includes(mutation.attributeName))) {
        shouldCheck = true;
        
        // Specifically track input-related changes for helper panel updates
        if (mutation.type === 'attributes' && 
            ['value', 'checked', 'selected'].includes(mutation.attributeName)) {
          hasInputChange = true;
        }
      }
    });
    
    if (shouldCheck) {
      // Debounce ticket content change detection
      setTimeout(async () => {
        if (ticketState.isOpen && ticketState.ticketElement) {
          const newHash = generateTicketHash(ticketState.ticketElement);
          if (newHash !== ticketState.lastTicketHash) {
            await onTicketContentChanged(ticketState.ticketElement, hasInputChange);
          }
        }
      }, 100);
    }
  });
  
  // Observe the ticket element for changes
  ticketState.ticketObserver.observe(ticketElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['value', 'disabled', 'selected', 'checked', 'class', 'style']
  });
  
  // Also set up direct input event listeners for more immediate response (Task 5.3.2)
  setupDirectInputListeners(ticketElement);
  
  console.log('Ticket observer set up for element:', ticketElement);
}

/**
 * Set up direct input event listeners for immediate response to user input (Task 5.3.2)
 * @param {Element} ticketElement - The ticket element to monitor
 */
function setupDirectInputListeners(ticketElement) {
  // Find all input elements within the ticket
  const inputs = ticketElement.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    // Remove any existing listeners to avoid duplicates
    input.removeEventListener('input', handleTicketInputChange);
    input.removeEventListener('change', handleTicketInputChange);
    
    // Add new listeners
    input.addEventListener('input', handleTicketInputChange, { passive: true });
    input.addEventListener('change', handleTicketInputChange, { passive: true });
  });
  
  // Also monitor button clicks for side selection
  const buttons = ticketElement.querySelectorAll('button');
  buttons.forEach(button => {
    button.removeEventListener('click', handleTicketButtonClick);
    button.addEventListener('click', handleTicketButtonClick, { passive: true });
  });
  
  console.log(`Set up direct input listeners for ${inputs.length} inputs and ${buttons.length} buttons`);
}

/**
 * Handle direct input changes for immediate helper panel updates (Task 5.3.2)
 */
function handleTicketInputChange(event) {
  // Only process if helper panel is visible
  if (!helperPanelState.isVisible) return;
  
  const input = event.target;
  console.log(`📝 Ticket input changed: ${input.type} ${input.name || input.id} = "${input.value}"`);
  
  // Clear any existing timer
  if (helperPanelState.inputChangeTimer) {
    clearTimeout(helperPanelState.inputChangeTimer);
  }
  
  // Debounce the update to avoid excessive recalculations during rapid typing
  helperPanelState.inputChangeTimer = setTimeout(async () => {
    try {
      if (ticketState.isOpen && ticketState.ticketElement) {
        // Parse updated ticket data and update helper panel
        const ticketData = await parseTicketData(ticketState.ticketElement);
        updateHelperPanelWithTicketData(ticketData);
      }
    } catch (error) {
      console.error('Error handling ticket input change:', error);
    }
  }, 200); // Slightly longer debounce for direct input to allow for typing
}

/**
 * Handle button clicks that might affect ticket state (Task 5.3.2)
 */
function handleTicketButtonClick(event) {
  // Only process if helper panel is visible
  if (!helperPanelState.isVisible) return;
  
  const button = event.target;
  const buttonText = button.textContent?.trim();
  
  // Check if this might be a side selection button
  if (buttonText === 'YES' || buttonText === 'NO' || 
      button.getAttribute('aria-pressed') === 'true' ||
      button.classList.contains('selected')) {
    
    console.log(`🔘 Ticket button clicked: "${buttonText}"`);
    
    // Immediate update for button clicks (no debounce needed)
    setTimeout(async () => {
      try {
        if (ticketState.isOpen && ticketState.ticketElement) {
          const ticketData = await parseTicketData(ticketState.ticketElement);
          updateHelperPanelWithTicketData(ticketData);
        }
      } catch (error) {
        console.error('Error handling ticket button click:', error);
      }
    }, 50); // Short delay to allow button state to update
  }
}

/**
 * Listen for settings changes from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    console.log('Received settings update:', message.settings);
    console.log('Current settings before update:', settings);
    
    // Validate settings before applying
    if (validateSettings(message.settings)) {
      settings = { ...settings, ...message.settings };
      console.log('Settings updated successfully:', settings);
      console.log('helperPanelEnabled is now:', settings.helperPanelEnabled);
      
      // Reprocess page with new settings
      processPage();
      
      sendResponse({ success: true });
    } else {
      console.error('Invalid settings received, ignoring update');
      sendResponse({ success: false, error: 'Invalid settings' });
    }
  }
  
  return true; // Keep message channel open for async response
});

/**
 * Listen for storage changes (e.g., from sync across devices)
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    console.log('Storage changes detected:', changes);
    
    // Build updated settings object
    const updatedSettings = { ...settings };
    let hasValidChanges = false;
    
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (settings.hasOwnProperty(key)) {
        updatedSettings[key] = newValue;
        hasValidChanges = true;
      }
    }
    
    // Validate and apply changes
    if (hasValidChanges && validateSettings(updatedSettings)) {
      settings = updatedSettings;
      console.log('Settings updated from storage sync:', settings);
      
      // Reprocess page with updated settings
      processPage();
    } else if (hasValidChanges) {
      console.error('Invalid settings from storage sync, ignoring changes');
    }
  }
});

/**
 * ============================================================================
 * TICKET EVENT HANDLERS
 * ============================================================================
 */

/**
 * Handle ticket opened event
 */
function onTicketOpened(ticketElement) {
  console.log('Order ticket opened');
  
  ticketState.isOpen = true;
  ticketState.ticketElement = ticketElement;
  ticketState.lastTicketHash = generateTicketHash(ticketElement);
  
  // Only show helper panel if it's a limit order
  if (shouldShowHelperPanel()) {
    showHelperPanel();
  } else {
    console.log('Helper panel not shown - not a limit order');
  }
  
  // Parse initial ticket data
  parseAndProcessTicketData(ticketElement);
}

/**
 * Handle ticket closed event (enhanced for Task 5.3.2)
 */
function onTicketClosed() {
  console.log('Order ticket closed');
  
  // Clean up direct input listeners before clearing ticket element
  if (ticketState.ticketElement) {
    cleanupDirectInputListeners(ticketState.ticketElement);
  }
  
  ticketState.isOpen = false;
  ticketState.ticketElement = null;
  ticketState.lastTicketHash = null;
  
  // Clean up ticket observer
  if (ticketState.ticketObserver) {
    ticketState.ticketObserver.disconnect();
    ticketState.ticketObserver = null;
  }
  
  // Hide helper panel (this will also clean up timers)
  hideHelperPanel();
  
  // Clear after-fee odds display
  clearAfterFeeOddsDisplay();
}

/**
 * Clean up direct input listeners (Task 5.3.2)
 * @param {Element} ticketElement - The ticket element to clean up
 */
function cleanupDirectInputListeners(ticketElement) {
  if (!ticketElement) return;
  
  try {
    // Remove input listeners
    const inputs = ticketElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.removeEventListener('input', handleTicketInputChange);
      input.removeEventListener('change', handleTicketInputChange);
    });
    
    // Remove button listeners
    const buttons = ticketElement.querySelectorAll('button');
    buttons.forEach(button => {
      button.removeEventListener('click', handleTicketButtonClick);
    });
    
    console.log(`Cleaned up direct input listeners for ${inputs.length} inputs and ${buttons.length} buttons`);
  } catch (error) {
    console.error('Error cleaning up direct input listeners:', error);
  }
}

/**
 * Handle ticket content changed event (enhanced for Task 5.3.2)
 */
function onTicketContentChanged(ticketElement, hasInputChange = false) {
  console.log('Order ticket content changed', hasInputChange ? '(input change detected)' : '');
  
  ticketState.lastTicketHash = generateTicketHash(ticketElement);
  
  // Reposition helper panel if visible
  if (helperPanelState.isVisible) {
    positionHelperPanel();
  }
  
  // Parse updated ticket data
  parseAndProcessTicketData(ticketElement, hasInputChange);
}

/**
 * Parse ticket data and update displays (enhanced for Task 5.3.2)
 */
async function parseAndProcessTicketData(ticketElement, hasInputChange = false) {
  try {
    const ticketData = await parseTicketData(ticketElement);
    
    // Update after-fee odds display
    updateAfterFeeOddsDisplay(ticketData);
    
    // Update helper panel with new ticket data
    // Pass priority flag for input changes to reduce debounce delay
    updateHelperPanelWithTicketData(ticketData, hasInputChange);
    
  } catch (error) {
    console.error('Error parsing and processing ticket data:', error);
    
    // Handle edge case where parsing fails - clear helper panel calculations
    if (helperPanelState.isVisible && helperPanelState.panelElement) {
      const errorEl = helperPanelState.panelElement.querySelector('.error-message');
      if (errorEl) {
        errorEl.textContent = 'Unable to read ticket data. Please check your inputs.';
        errorEl.style.display = 'block';
      }
      
      // Clear after-fee odds display when parsing fails
      const afterFeeEl = helperPanelState.panelElement.querySelector('.after-fee-odds');
      if (afterFeeEl) {
        afterFeeEl.innerHTML = '--';
        afterFeeEl.className = 'result-value';
      }
    }
  }
}

/**
 * Generate hash of ticket content for change detection
 */
function generateTicketHash(ticketElement) {
  if (!ticketElement) return null;
  
  // Create hash based on key content that would indicate changes
  const inputs = ticketElement.querySelectorAll('input, select, textarea');
  const buttons = ticketElement.querySelectorAll('button[class*="selected"], button[aria-pressed="true"]');
  
  let hashContent = '';
  
  // Include input values
  inputs.forEach(input => {
    if (input.type !== 'hidden') {
      hashContent += `${input.name || input.id}:${input.value}|`;
    }
  });
  
  // Include selected button states
  buttons.forEach(button => {
    hashContent += `btn:${button.textContent?.trim()}|`;
  });
  
  // Include visible text content (truncated to avoid huge hashes)
  const textContent = ticketElement.textContent?.trim().substring(0, 500) || '';
  hashContent += textContent;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashContent.length; i++) {
    const char = hashContent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString();
}

/**
 * ============================================================================
 * LIMIT-ORDER HELPER PANEL FUNCTIONALITY (Task 5.1.1)
 * ============================================================================
 */

/**
 * Create the helper panel HTML structure with non-interference safeguards
 */
function createHelperPanel() {
  const panel = document.createElement('div');
  panel.className = 'kalshi-ao-helper-panel';
  panel.style.display = 'none'; // Initially hidden
  
  // Add non-interference attributes
  panel.setAttribute('data-kalshi-ao-panel', 'true');
  panel.setAttribute('role', 'complementary');
  panel.setAttribute('aria-label', 'Limit Order Helper Panel');
  
  // Prevent event bubbling to avoid interference
  panel.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  panel.addEventListener('mousedown', function(e) {
    e.stopPropagation();
  });
  
  panel.addEventListener('keydown', function(e) {
    // Allow escape to close panel
    if (e.key === 'Escape') {
      hideHelperPanel();
      e.stopPropagation();
      return;
    }
    
    // Prevent other key events from bubbling
    e.stopPropagation();
  });
  
  panel.innerHTML = `
    <div class="panel-header">
      <div class="panel-title">Limit Order Helper</div>
      <div class="panel-subtitle">Convert American odds to limit price</div>
      <button type="button" class="panel-close" aria-label="Close helper panel" title="Close (Esc)">×</button>
    </div>
    
    <div class="input-section">
      <div class="odds-input-group">
        <label class="input-label" for="kalshi-ao-odds-input">American Odds</label>
        <input 
          type="text" 
          id="kalshi-ao-odds-input"
          class="odds-input" 
          placeholder="e.g. +150, -200"
          autocomplete="off"
          tabindex="0"
        />
        <div class="error" id="kalshi-ao-odds-error" style="display: none;"></div>
      </div>
      
      <div class="side-selection">
        <label class="input-label">Side</label>
        <div class="side-buttons">
          <button type="button" class="side-button yes" data-side="YES" tabindex="0">YES</button>
          <button type="button" class="side-button no" data-side="NO" tabindex="0">NO</button>
        </div>
      </div>
    </div>
    
    <div class="results-section">
      <div class="result-item">
        <div class="result-label">Suggested Price</div>
        <div class="result-value price" id="kalshi-ao-suggested-price">--</div>
        <div class="helper-text">Kalshi limit price</div>
      </div>
      
      <div class="result-item">
        <div class="result-label">After-Fee Odds</div>
        <div class="result-value odds" id="kalshi-ao-after-fee-odds">--</div>
        <div class="helper-text">Effective odds after fees</div>
      </div>
    </div>
    
    <div class="helper-text" style="margin-top: 8px; text-align: center;">
      <span class="tooltip-trigger" title="Calculations based on current ticket fee information when available">
        ℹ️ Fee info from ticket
      </span>
    </div>
  `;
  
  // Add event listeners
  setupHelperPanelEventListeners(panel);
  
  return panel;
}

/**
 * Setup event listeners for helper panel interactions with non-interference safeguards
 */
function setupHelperPanelEventListeners(panel) {
  const oddsInput = panel.querySelector('#kalshi-ao-odds-input');
  const sideButtons = panel.querySelectorAll('.side-button');
  const closeButton = panel.querySelector('.panel-close');
  const errorDiv = panel.querySelector('#kalshi-ao-odds-error');
  
  // Close button functionality
  if (closeButton) {
    closeButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      hideHelperPanel();
    });
  }
  
  // Odds input validation and calculation
  oddsInput.addEventListener('input', function(e) {
    e.stopPropagation();
    clearTimeout(this.validationTimer);
    this.validationTimer = setTimeout(() => {
      validateAndCalculate(panel);
    }, 300); // Debounce input
  });
  
  oddsInput.addEventListener('blur', function(e) {
    e.stopPropagation();
    validateAndCalculate(panel);
  });
  
  oddsInput.addEventListener('focus', function(e) {
    e.stopPropagation();
    // Clear any previous errors when user starts typing
    errorDiv.style.display = 'none';
    this.classList.remove('error');
  });
  
  // Prevent input events from bubbling to ticket
  oddsInput.addEventListener('keydown', function(e) {
    e.stopPropagation();
    
    // Handle Enter key to trigger calculation
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAndCalculate(panel);
    }
  });
  
  // Side button selection
  sideButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove selected class from all buttons
      sideButtons.forEach(btn => btn.classList.remove('selected'));
      
      // Add selected class to clicked button
      this.classList.add('selected');
      
      // Update state and recalculate
      helperPanelState.currentSide = this.dataset.side;
      validateAndCalculate(panel);
    });
    
    button.addEventListener('keydown', function(e) {
      e.stopPropagation();
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
  
  // Prevent all form submission events from bubbling
  panel.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Prevent drag events that might interfere with ticket
  panel.addEventListener('dragstart', function(e) {
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Prevent context menu that might interfere
  panel.addEventListener('contextmenu', function(e) {
    e.stopPropagation();
  });
}

/**
 * Validate odds input and calculate results with enhanced validation
 */
function validateAndCalculate(panel) {
  const oddsInput = panel.querySelector('#kalshi-ao-odds-input');
  const errorDiv = panel.querySelector('#kalshi-ao-odds-error');
  const suggestedPriceEl = panel.querySelector('#kalshi-ao-suggested-price');
  const afterFeeOddsEl = panel.querySelector('#kalshi-ao-after-fee-odds');
  
  // Clear previous errors
  clearValidationErrors(panel);
  
  const oddsText = oddsInput.value.trim();
  
  // If empty, clear results but don't show error
  if (!oddsText) {
    helperPanelState.currentOdds = null;
    clearResults(panel);
    return;
  }
  
  // Validate American odds with detailed feedback
  const validation = validateAmericanOddsInput(oddsText);
  
  if (!validation.isValid) {
    showValidationError(panel, validation.error, validation.suggestion);
    clearResults(panel);
    return;
  }
  
  // Validate side selection
  if (!helperPanelState.currentSide) {
    showValidationError(panel, 'Please select YES or NO side', 'Choose which side you want to bet on');
    return;
  }
  
  // Store current odds
  helperPanelState.currentOdds = validation.odds;
  
  // Calculate suggested price
  const suggestedPrice = calculateSuggestedPrice(validation.odds, helperPanelState.currentSide);
  helperPanelState.suggestedPrice = suggestedPrice;
  
  // Display suggested price with additional info and estimated label if applicable
  let suggestedPriceDisplay = suggestedPrice.toFixed(2);
  let priceEstimatedLabel = '';
  
  // Task 6.4.2: Add estimated label to suggested price if using estimated fees for calculation context
  if (helperPanelState.lastTicketData && 
      (helperPanelState.lastTicketData.fee?.feeSource === 'estimated' || 
       helperPanelState.lastTicketData.isUsingFallbackFee)) {
    priceEstimatedLabel = ` <span class="estimated-label" 
                                 style="background: #fff3cd; color: #856404; padding: 1px 4px; border-radius: 2px; 
                                        font-size: 9px; font-weight: 600; margin-left: 4px; border: 1px solid #ffeaa7;">
                              EST
                            </span>`;
  }
  
  suggestedPriceEl.innerHTML = `$${suggestedPriceDisplay}${priceEstimatedLabel}`;
  
  // Show implied probability as helper text
  const impliedProb = getImpliedProbabilityPercent(validation.odds);
  const priceHelperText = suggestedPriceEl.parentElement.querySelector('.helper-text');
  if (priceHelperText && impliedProb !== null) {
    let helperText = `Kalshi limit price (${impliedProb}% implied)`;
    // Task 6.4.2: Add context about estimated fees in helper text
    if (priceEstimatedLabel) {
      helperText += ' - using estimated fees';
    }
    priceHelperText.textContent = helperText;
  }
  
  // Calculate after-fee odds - try with ticket data first, then estimated fees
  const afterFeeResult = calculateAfterFeeOddsForHelper(
    suggestedPrice, 
    helperPanelState.currentSide,
    helperPanelState.lastTicketData
  );
  
  if (afterFeeResult && afterFeeResult.afterFeeOdds !== null) {
    helperPanelState.afterFeeOdds = afterFeeResult.afterFeeOdds;
    
    // Task 6.4.2: Add estimated label to after-fee odds display
    let afterFeeOddsDisplay = formatAmericanOddsDisplay(afterFeeResult.afterFeeOdds);
    let estimatedLabel = '';
    
    if (afterFeeResult.feeSource === 'estimated' || afterFeeResult.isUsingFallbackFee) {
      estimatedLabel = ` <span class="estimated-label" 
                              style="background: #fff3cd; color: #856404; padding: 1px 4px; border-radius: 2px; 
                                     font-size: 9px; font-weight: 600; margin-left: 4px; border: 1px solid #ffeaa7;">
                           EST
                         </span>`;
    }
    
    afterFeeOddsEl.innerHTML = afterFeeOddsDisplay + estimatedLabel;
    afterFeeOddsEl.className = `result-value odds ${afterFeeResult.afterFeeOdds < 0 ? 'negative' : ''}`;
    
    // Update helper text to show fee source with estimated indicator
    const oddsHelperText = afterFeeOddsEl.parentElement.querySelector('.helper-text');
    if (oddsHelperText) {
      let helperText = 'Effective odds after fees';
      if (afterFeeResult.feeSource === 'estimated' || afterFeeResult.isUsingFallbackFee) {
        helperText += ' (estimated fees)';
      } else if (afterFeeResult.feeSource === 'ticket') {
        helperText += ' (from ticket)';
      }
      oddsHelperText.textContent = helperText;
    }
  } else {
    // No fee information available
    afterFeeOddsEl.textContent = 'No fee info';
    afterFeeOddsEl.className = 'result-value odds';
    
    // Update helper text to explain why no after-fee odds
    const oddsHelperText = afterFeeOddsEl.parentElement.querySelector('.helper-text');
    if (oddsHelperText) {
      let helperText = 'Requires fee information';
      if (afterFeeResult && afterFeeResult.error) {
        helperText = afterFeeResult.error;
      } else if (!settings.fallbackEstimateEnabled) {
        helperText += ' (enable fee estimation in settings)';
      }
      oddsHelperText.textContent = helperText;
    }
  }
  
  // Show suggestion if available
  if (validation.suggestion) {
    showValidationHint(panel, validation.suggestion);
  }
}

/**
 * Clear validation errors and styling
 */
function clearValidationErrors(panel) {
  const errorDiv = panel.querySelector('#kalshi-ao-odds-error');
  const oddsInput = panel.querySelector('#kalshi-ao-odds-input');
  const hintDiv = panel.querySelector('#kalshi-ao-odds-hint');
  
  errorDiv.style.display = 'none';
  oddsInput.classList.remove('error');
  
  if (hintDiv) {
    hintDiv.style.display = 'none';
  }
}

/**
 * Clear calculation results
 */
function clearResults(panel) {
  const suggestedPriceEl = panel.querySelector('#kalshi-ao-suggested-price');
  const afterFeeOddsEl = panel.querySelector('#kalshi-ao-after-fee-odds');
  
  // Task 6.4.2: Clear HTML content instead of just text to remove estimated labels
  suggestedPriceEl.innerHTML = '--';
  afterFeeOddsEl.innerHTML = '--';
  
  // Reset helper text
  const priceHelperText = suggestedPriceEl.parentElement.querySelector('.helper-text');
  if (priceHelperText) {
    priceHelperText.textContent = 'Kalshi limit price';
  }
  
  const oddsHelperText = afterFeeOddsEl.parentElement.querySelector('.helper-text');
  if (oddsHelperText) {
    oddsHelperText.textContent = 'Effective odds after fees';
  }
}

/**
 * Show validation error with helpful message
 */
function showValidationError(panel, error, suggestion) {
  const errorDiv = panel.querySelector('#kalshi-ao-odds-error');
  const oddsInput = panel.querySelector('#kalshi-ao-odds-input');
  
  errorDiv.innerHTML = `
    <div style="color: #dc3545; font-weight: 500;">${error}</div>
    ${suggestion ? `<div style="color: #6c757d; font-size: 11px; margin-top: 2px;">${suggestion}</div>` : ''}
  `;
  errorDiv.style.display = 'block';
  oddsInput.classList.add('error');
}

/**
 * Show validation hint for successful input
 */
function showValidationHint(panel, hint) {
  let hintDiv = panel.querySelector('#kalshi-ao-odds-hint');
  
  if (!hintDiv) {
    hintDiv = document.createElement('div');
    hintDiv.id = 'kalshi-ao-odds-hint';
    hintDiv.className = 'validation-hint';
    
    const errorDiv = panel.querySelector('#kalshi-ao-odds-error');
    errorDiv.parentNode.insertBefore(hintDiv, errorDiv.nextSibling);
  }
  
  hintDiv.innerHTML = `<div style="color: #28a745; font-size: 11px;">${hint}</div>`;
  hintDiv.style.display = 'block';
}

/**
 * Show error message in helper panel
 */
function showError(panel, message) {
  const errorDiv = panel.querySelector('#kalshi-ao-odds-error');
  const oddsInput = panel.querySelector('#kalshi-ao-odds-input');
  
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  oddsInput.classList.add('error');
  
  // Clear results
  panel.querySelector('#kalshi-ao-suggested-price').innerHTML = '--';
  panel.querySelector('#kalshi-ao-after-fee-odds').innerHTML = '--';
}

/**
 * Parse American odds from text input with enhanced validation
 */
function parseAmericanOdds(text) {
  if (!text || typeof text !== 'string') return null;
  
  // Remove whitespace and normalize
  const cleaned = text.replace(/\s+/g, '').trim();
  
  if (!cleaned) return null;
  
  // Match American odds patterns with more flexibility
  // Supports: +150, -200, 100, +100, -100, etc.
  const match = cleaned.match(/^([+-]?)(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  
  const sign = match[1];
  const numberStr = match[2];
  const number = parseFloat(numberStr);
  
  // Validate number is valid
  if (isNaN(number) || !isFinite(number)) return null;
  
  // American odds must be at least 100 (or -100)
  if (number < 100) return null;
  
  // Reasonable upper limit to prevent extreme values
  if (number > 100000) return null;
  
  // Handle sign - default to positive if no sign provided and >= 100
  if (sign === '-') {
    return -number;
  } else {
    return number; // Both +150 and 150 become +150
  }
}

/**
 * Validate American odds input with detailed error messages
 */
function validateAmericanOddsInput(text) {
  const result = {
    isValid: false,
    odds: null,
    error: null,
    suggestion: null
  };
  
  if (!text || typeof text !== 'string') {
    result.error = 'Please enter American odds';
    result.suggestion = 'Try: +150, -200, or 100';
    return result;
  }
  
  const cleaned = text.replace(/\s+/g, '').trim();
  
  if (!cleaned) {
    result.error = 'Please enter American odds';
    result.suggestion = 'Try: +150, -200, or 100';
    return result;
  }
  
  // Check for common mistakes
  if (cleaned.includes('%')) {
    result.error = 'Use American odds, not percentages';
    result.suggestion = 'Try: +150 instead of 60%';
    return result;
  }
  
  if (cleaned.includes('.') && cleaned.match(/\.\d{3,}/)) {
    result.error = 'Too many decimal places';
    result.suggestion = 'Use whole numbers: +150, -200';
    return result;
  }
  
  if (cleaned.startsWith('0')) {
    result.error = 'American odds cannot start with 0';
    result.suggestion = 'Minimum odds: +100 or -100';
    return result;
  }
  
  // Try to parse
  const odds = parseAmericanOdds(cleaned);
  
  if (odds === null) {
    // Provide specific error based on input
    if (/^[+-]?\d*\.?\d*$/.test(cleaned)) {
      const num = parseFloat(cleaned.replace(/[+-]/, ''));
      if (num < 100) {
        result.error = 'American odds must be ≥100';
        result.suggestion = 'Try: +100, +150, -110, -200';
      } else if (num > 100000) {
        result.error = 'Odds too large';
        result.suggestion = 'Maximum: +100000 or -100000';
      } else {
        result.error = 'Invalid odds format';
        result.suggestion = 'Use: +150, -200, or 100';
      }
    } else {
      result.error = 'Invalid characters in odds';
      result.suggestion = 'Use only numbers and +/- signs';
    }
    return result;
  }
  
  // Additional validation for edge cases
  if (Math.abs(odds) === 100) {
    result.isValid = true;
    result.odds = odds;
    result.suggestion = 'Even odds (50% probability)';
    return result;
  }
  
  if (Math.abs(odds) < 110 && Math.abs(odds) > 100) {
    result.isValid = true;
    result.odds = odds;
    result.suggestion = 'Close to even odds';
    return result;
  }
  
  result.isValid = true;
  result.odds = odds;
  return result;
}

/**
 * Format American odds for display with proper sign
 */
function formatAmericanOddsDisplay(odds) {
  if (typeof odds !== 'number' || isNaN(odds)) return '--';
  
  if (odds > 0) {
    return `+${Math.round(odds)}`;
  } else {
    return `${Math.round(odds)}`;
  }
}

/**
 * Get probability percentage from American odds for display
 */
function getImpliedProbabilityPercent(americanOdds) {
  if (typeof americanOdds !== 'number' || isNaN(americanOdds)) return null;
  
  let probability;
  
  if (americanOdds > 0) {
    probability = 100 / (americanOdds + 100);
  } else {
    probability = Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
  
  return Math.round(probability * 100 * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert American odds to probability
 * Implements the conversion formula from the design document:
 * - if odds > 0: p = 100 / (odds + 100)
 * - if odds < 0: p = |odds| / (|odds| + 100)
 * 
 * @param {number} americanOdds - American odds (positive or negative, cannot be 0)
 * @returns {number|null} - Probability between 0 and 1, or null if invalid input
 */
function americanOddsToProbability(americanOdds) {
  // Validate input
  if (typeof americanOdds !== 'number' || isNaN(americanOdds) || americanOdds === 0 || !isFinite(americanOdds)) {
    return null;
  }
  
  let probability;
  
  if (americanOdds > 0) {
    // Positive odds: probability = 100 / (odds + 100)
    probability = 100 / (americanOdds + 100);
  } else {
    // Negative odds: probability = |odds| / (|odds| + 100)
    probability = Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
  
  return probability;
}

/**
 * Calculate suggested Kalshi limit price from American odds
 */
function calculateSuggestedPrice(americanOdds, side) {
  // Convert American odds to implied probability using the standalone function
  let impliedProbability = americanOddsToProbability(americanOdds);
  
  // Return null if conversion failed
  if (impliedProbability === null) {
    return null;
  }
  
  // Validate side parameter
  if (side !== 'YES' && side !== 'NO') {
    return null;
  }
  
  // For NO side, we want the complement probability
  if (side === 'NO') {
    impliedProbability = 1 - impliedProbability;
  }
  
  // Kalshi prices are between $0.01 and $1.00
  const price = Math.max(0.01, Math.min(1.00, impliedProbability));
  
  return price;
}

/**
 * Calculate after-fee odds for helper panel suggestion
 * Enhanced to work with both ticket data and estimated fees
 */
function calculateAfterFeeOddsForHelper(price, side, ticketData) {
  try {
    let feePerContract = null;
    let feeSource = 'unknown';
    let quantity = 1; // Default quantity
    
    // Try to get fee information from ticket data
    if (ticketData && ticketData.fee) {
      quantity = ticketData.quantity || 1;
      
      if (ticketData.fee.perContractFee !== null && ticketData.fee.perContractFee !== undefined) {
        feePerContract = ticketData.fee.perContractFee;
        feeSource = ticketData.fee.feeSource || 'ticket';
      } else if (ticketData.fee.totalFee !== null && ticketData.fee.totalFee !== undefined && quantity > 0) {
        feePerContract = ticketData.fee.totalFee / quantity;
        feeSource = ticketData.fee.feeSource || 'ticket';
      }
    }
    
    // If no fee from ticket, try to estimate using Kalshi's fee schedule
    if (feePerContract === null && settings.fallbackEstimateEnabled) {
      const feeEstimate = calculateKalshiFeeEstimate(price, quantity, { 
        feeType: 'taker', // Conservative estimate using taker fees
        assumeMakerFeeFree: false 
      });
      
      if (feeEstimate) {
        feePerContract = feeEstimate.perContractFee;
        feeSource = 'estimated';
      }
    }
    
    // If still no fee information, return null
    if (feePerContract === null) {
      return {
        afterFeeOdds: null,
        feeSource: 'unavailable',
        error: 'No fee information available'
      };
    }
    
    // Calculate after-fee odds using the main function
    const afterFeeOdds = calculateAfterFeeOdds(price, feePerContract);
    
    return {
      afterFeeOdds: afterFeeOdds,
      feeSource: feeSource,
      feePerContract: feePerContract,
      quantity: quantity,
      error: null
    };
    
  } catch (error) {
    console.warn('Error calculating after-fee odds for helper:', error);
    return {
      afterFeeOdds: null,
      feeSource: 'error',
      error: error.message
    };
  }
}

/**
 * Format American odds for display
 */
function formatAmericanOdds(odds) {
  if (odds > 0) {
    return `+${Math.round(odds)}`;
  } else {
    return `${Math.round(odds)}`;
  }
}

/**
 * Show helper panel near the order ticket
 */
function showHelperPanel() {
  console.log('🎯 showHelperPanel called');
  
  // Double-check settings before showing
  if (!settings.helperPanelEnabled) {
    console.log('  ❌ Helper panel blocked: disabled in settings');
    return;
  }
  
  if (helperPanelState.isVisible) {
    console.log('  ⚠️ Helper panel already visible, skipping');
    return;
  }
  
  console.log('  ✅ Showing helper panel - settings.helperPanelEnabled:', settings.helperPanelEnabled);
  
  // Inject panel into DOM
  injectHelperPanel();
  
  // Position and show panel
  positionHelperPanel();
  helperPanelState.panelElement.style.display = 'block';
  helperPanelState.isVisible = true;
  
  // Setup focus management
  managePanelFocus();
  
  console.log('Helper panel shown');
}

/**
 * Hide helper panel (enhanced for Task 5.3.2 and 5.3.3)
 */
function hideHelperPanel() {
  if (!helperPanelState.isVisible) return;
  
  // Clear any pending timers to prevent memory leaks
  if (helperPanelState.recalculateTimer) {
    clearTimeout(helperPanelState.recalculateTimer);
    helperPanelState.recalculateTimer = null;
  }
  
  if (helperPanelState.inputChangeTimer) {
    clearTimeout(helperPanelState.inputChangeTimer);
    helperPanelState.inputChangeTimer = null;
  }
  
  // Task 5.3.3: Clear fee transition timer
  if (helperPanelState.feeTransitionTimer) {
    clearTimeout(helperPanelState.feeTransitionTimer);
    helperPanelState.feeTransitionTimer = null;
  }
  
  if (helperPanelState.panelElement) {
    helperPanelState.panelElement.style.display = 'none';
  }
  
  // Clean up interference monitoring
  cleanupInterferenceMonitoring();
  
  // Task 5.3.3: Reset fee tracking state
  helperPanelState.lastFeeSource = null;
  helperPanelState.lastFeeAvailability = null;
  
  helperPanelState.isVisible = false;
  console.log('Helper panel hidden');
}

/**
 * Position helper panel near the order ticket with multiple strategies
 */
function positionHelperPanel() {
  if (!helperPanelState.panelElement || !ticketState.ticketElement) return;
  
  const panel = helperPanelState.panelElement;
  const ticket = ticketState.ticketElement;
  
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Get ticket position
  const ticketRect = ticket.getBoundingClientRect();
  const panelWidth = 320; // Approximate panel width
  const panelHeight = 280; // Approximate panel height
  const margin = 20; // Minimum margin from viewport edges
  
  let position = null;
  
  // Strategy 1: Position to the right of the ticket
  if (ticketRect.right + panelWidth + margin <= viewportWidth) {
    position = {
      left: ticketRect.right + margin,
      top: Math.max(margin, ticketRect.top),
      strategy: 'right'
    };
  }
  
  // Strategy 2: Position to the left of the ticket
  if (!position && ticketRect.left - panelWidth - margin >= 0) {
    position = {
      left: ticketRect.left - panelWidth - margin,
      top: Math.max(margin, ticketRect.top),
      strategy: 'left'
    };
  }
  
  // Strategy 3: Position below the ticket
  if (!position && ticketRect.bottom + panelHeight + margin <= viewportHeight) {
    position = {
      left: Math.max(margin, Math.min(ticketRect.left, viewportWidth - panelWidth - margin)),
      top: ticketRect.bottom + margin,
      strategy: 'below'
    };
  }
  
  // Strategy 4: Position above the ticket
  if (!position && ticketRect.top - panelHeight - margin >= 0) {
    position = {
      left: Math.max(margin, Math.min(ticketRect.left, viewportWidth - panelWidth - margin)),
      top: ticketRect.top - panelHeight - margin,
      strategy: 'above'
    };
  }
  
  // Strategy 5: Overlay positioning (last resort)
  if (!position) {
    position = {
      left: Math.max(margin, (viewportWidth - panelWidth) / 2),
      top: Math.max(margin, (viewportHeight - panelHeight) / 2),
      strategy: 'overlay'
    };
  }
  
  // Ensure position stays within viewport bounds
  position.left = Math.max(margin, Math.min(position.left, viewportWidth - panelWidth - margin));
  position.top = Math.max(margin, Math.min(position.top, viewportHeight - panelHeight - margin));
  
  // Check for interference with critical ticket elements
  const adjustedPosition = avoidTicketInterference(position, ticket, panelWidth, panelHeight);
  
  // Convert to absolute positioning (accounting for scroll)
  adjustedPosition.left += scrollLeft;
  adjustedPosition.top += scrollTop;
  
  // Apply positioning with safe z-index
  panel.style.position = 'absolute';
  panel.style.left = `${adjustedPosition.left}px`;
  panel.style.top = `${adjustedPosition.top}px`;
  panel.style.zIndex = getSafeZIndex(ticket);
  panel.style.width = `${panelWidth}px`;
  
  console.log(`Helper panel positioned using strategy: ${adjustedPosition.strategy}`);
}

/**
 * Avoid interference with critical ticket elements
 */
function avoidTicketInterference(position, ticket, panelWidth, panelHeight) {
  // Find critical interactive elements in the ticket
  const criticalElements = ticket.querySelectorAll(
    'button, input, select, textarea, a, [role="button"], [tabindex="0"]'
  );
  
  const panelRect = {
    left: position.left,
    top: position.top,
    right: position.left + panelWidth,
    bottom: position.top + panelHeight
  };
  
  // Check if panel would overlap any critical elements
  for (const element of criticalElements) {
    const elementRect = element.getBoundingClientRect();
    
    if (rectsOverlap(panelRect, elementRect)) {
      console.log('Panel would interfere with critical element, adjusting position');
      
      // Try to shift panel to avoid overlap
      const shiftedPosition = shiftToAvoidOverlap(position, elementRect, panelWidth, panelHeight);
      if (shiftedPosition) {
        return { ...shiftedPosition, strategy: position.strategy + '-adjusted' };
      }
    }
  }
  
  return position;
}

/**
 * Check if two rectangles overlap
 */
function rectsOverlap(rect1, rect2) {
  return !(rect1.right < rect2.left || 
           rect2.right < rect1.left || 
           rect1.bottom < rect2.top || 
           rect2.bottom < rect1.top);
}

/**
 * Shift position to avoid overlap with an element
 */
function shiftToAvoidOverlap(position, elementRect, panelWidth, panelHeight) {
  const shifts = [
    // Try shifting right
    { left: elementRect.right + 10, top: position.top },
    // Try shifting left
    { left: elementRect.left - panelWidth - 10, top: position.top },
    // Try shifting down
    { left: position.left, top: elementRect.bottom + 10 },
    // Try shifting up
    { left: position.left, top: elementRect.top - panelHeight - 10 }
  ];
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 20;
  
  for (const shift of shifts) {
    // Check if shifted position is within viewport
    if (shift.left >= margin && 
        shift.left + panelWidth <= viewportWidth - margin &&
        shift.top >= margin && 
        shift.top + panelHeight <= viewportHeight - margin) {
      return shift;
    }
  }
  
  return null; // No valid shift found
}

/**
 * Get a safe z-index that doesn't interfere with ticket elements
 */
function getSafeZIndex(ticket) {
  // Start with a reasonable base z-index
  let maxZIndex = 9999;
  
  // Check z-index of ticket and its children
  const ticketStyle = window.getComputedStyle(ticket);
  const ticketZIndex = parseInt(ticketStyle.zIndex) || 0;
  
  // Find the highest z-index in the ticket area
  const ticketElements = ticket.querySelectorAll('*');
  for (const element of ticketElements) {
    const style = window.getComputedStyle(element);
    const zIndex = parseInt(style.zIndex) || 0;
    if (zIndex > maxZIndex) {
      maxZIndex = zIndex;
    }
  }
  
  // Use a z-index that's higher than ticket elements but not excessive
  const safeZIndex = Math.max(maxZIndex + 1, ticketZIndex + 1, 10000);
  
  // Cap at reasonable maximum to avoid conflicts with other extensions
  return Math.min(safeZIndex, 999999);
}

/**
 * Find optimal injection point for helper panel in the DOM
 */
function findHelperPanelInjectionPoint() {
  // Strategy 1: Look for existing order-related containers
  const orderContainers = [
    '[class*="order"]',
    '[class*="ticket"]',
    '[class*="trade"]',
    '[class*="modal"]',
    '[role="dialog"]'
  ];
  
  for (const selector of orderContainers) {
    const containers = document.querySelectorAll(selector);
    for (const container of containers) {
      if (isValidInjectionPoint(container)) {
        console.log('Found injection point via order container:', selector);
        return container;
      }
    }
  }
  
  // Strategy 2: Look for form elements
  const forms = document.querySelectorAll('form');
  for (const form of forms) {
    if (containsOrderElements(form) && isValidInjectionPoint(form)) {
      console.log('Found injection point via form element');
      return form;
    }
  }
  
  // Strategy 3: Use ticket element's parent
  if (ticketState.ticketElement) {
    let parent = ticketState.ticketElement.parentElement;
    while (parent && parent !== document.body) {
      if (isValidInjectionPoint(parent)) {
        console.log('Found injection point via ticket parent');
        return parent;
      }
      parent = parent.parentElement;
    }
  }
  
  // Strategy 4: Use document body as fallback
  console.log('Using document body as injection point fallback');
  return document.body;
}

/**
 * Check if an element is a valid injection point
 */
function isValidInjectionPoint(element) {
  if (!element || !document.contains(element)) return false;
  
  // Check if element is visible
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  
  // Check if element has reasonable dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 100) return false;
  
  // Avoid injecting into input elements or buttons
  const tagName = element.tagName.toLowerCase();
  if (['input', 'button', 'select', 'textarea'].includes(tagName)) return false;
  
  return true;
}

/**
 * Check if an element contains order-related form elements
 */
function containsOrderElements(element) {
  const inputs = element.querySelectorAll('input, select, button');
  const text = element.textContent?.toLowerCase() || '';
  
  // Look for order-related keywords
  const orderKeywords = ['order', 'buy', 'sell', 'price', 'quantity', 'yes', 'no'];
  const hasOrderKeywords = orderKeywords.some(keyword => text.includes(keyword));
  
  // Look for price/quantity inputs
  const hasPriceInput = Array.from(inputs).some(input => {
    const placeholder = input.placeholder?.toLowerCase() || '';
    const name = input.name?.toLowerCase() || '';
    return placeholder.includes('price') || name.includes('price') ||
           placeholder.includes('quantity') || name.includes('quantity');
  });
  
  return hasOrderKeywords && hasPriceInput && inputs.length >= 2;
}

/**
 * Inject helper panel into the DOM at the optimal location
 */
function injectHelperPanel() {
  if (helperPanelState.panelElement && document.contains(helperPanelState.panelElement)) {
    return; // Already injected
  }
  
  // Create panel if it doesn't exist
  if (!helperPanelState.panelElement) {
    helperPanelState.panelElement = createHelperPanel();
  }
  
  // Find optimal injection point
  const injectionPoint = findHelperPanelInjectionPoint();
  
  // Inject panel
  try {
    injectionPoint.appendChild(helperPanelState.panelElement);
    console.log('Helper panel injected into DOM');
  } catch (error) {
    console.warn('Failed to inject helper panel:', error);
    // Fallback to body
    document.body.appendChild(helperPanelState.panelElement);
  }
}

/**
 * Remove helper panel from DOM
 */
function removeHelperPanel() {
  if (helperPanelState.panelElement && document.contains(helperPanelState.panelElement)) {
    helperPanelState.panelElement.remove();
    console.log('Helper panel removed from DOM');
  }
}

/**
 * Handle window resize and scroll events for panel repositioning
 */
function setupHelperPanelPositioning() {
  let repositionTimer = null;
  
  const repositionPanel = () => {
    if (helperPanelState.isVisible && helperPanelState.panelElement) {
      positionHelperPanel();
    }
  };
  
  const debouncedReposition = () => {
    clearTimeout(repositionTimer);
    repositionTimer = setTimeout(repositionPanel, 100);
  };
  
  // Listen for viewport changes
  window.addEventListener('resize', debouncedReposition);
  window.addEventListener('scroll', debouncedReposition);
  
  // Listen for orientation changes on mobile
  window.addEventListener('orientationchange', () => {
    setTimeout(repositionPanel, 200); // Delay to allow orientation change to complete
  });
  
  // Monitor for ticket DOM changes that might affect positioning
  setupInterferenceMonitoring();
}

/**
 * Monitor for potential interference with ticket functionality
 */
function setupInterferenceMonitoring() {
  let monitoringTimer = null;
  
  const checkForInterference = () => {
    if (!helperPanelState.isVisible || !helperPanelState.panelElement || !ticketState.ticketElement) {
      return;
    }
    
    // Check if panel is still positioned correctly
    const panel = helperPanelState.panelElement;
    const ticket = ticketState.ticketElement;
    
    // Verify panel hasn't moved to overlap critical elements
    const criticalElements = ticket.querySelectorAll(
      'button:not([data-kalshi-ao-panel] button), input:not([data-kalshi-ao-panel] input), select, textarea, a'
    );
    
    const panelRect = panel.getBoundingClientRect();
    let hasInterference = false;
    
    for (const element of criticalElements) {
      const elementRect = element.getBoundingClientRect();
      if (rectsOverlap(panelRect, elementRect)) {
        console.warn('Helper panel interference detected with:', element);
        hasInterference = true;
        break;
      }
    }
    
    if (hasInterference) {
      console.log('Repositioning panel to avoid interference');
      positionHelperPanel();
    }
  };
  
  const debouncedCheck = () => {
    clearTimeout(monitoringTimer);
    monitoringTimer = setTimeout(checkForInterference, 500);
  };
  
  // Monitor DOM changes in the ticket area
  if (window.MutationObserver) {
    const interferenceObserver = new MutationObserver(debouncedCheck);
    
    // Store observer for cleanup
    helperPanelState.interferenceObserver = interferenceObserver;
    
    // Start observing when panel is shown
    const originalShowPanel = showHelperPanel;
    showHelperPanel = function() {
      originalShowPanel.call(this);
      
      if (ticketState.ticketElement) {
        interferenceObserver.observe(ticketState.ticketElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
    };
    
    // Stop observing when panel is hidden
    const originalHidePanel = hideHelperPanel;
    hideHelperPanel = function() {
      interferenceObserver.disconnect();
      originalHidePanel.call(this);
    };
  }
}

/**
 * Ensure panel doesn't capture focus from ticket elements
 */
function managePanelFocus() {
  if (!helperPanelState.panelElement) return;
  
  const panel = helperPanelState.panelElement;
  
  // Create a focus trap within the panel when it's active
  const focusableElements = panel.querySelectorAll(
    'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return;
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  panel.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      // If shift+tab on first element, don't trap - let it go to ticket
      if (e.shiftKey && document.activeElement === firstFocusable) {
        // Allow focus to move to ticket
        return;
      }
      
      // If tab on last element, don't trap - let it go to ticket
      if (!e.shiftKey && document.activeElement === lastFocusable) {
        // Allow focus to move to ticket
        return;
      }
    }
  });
}

/**
 * Clean up interference monitoring
 */
function cleanupInterferenceMonitoring() {
  if (helperPanelState.interferenceObserver) {
    helperPanelState.interferenceObserver.disconnect();
    helperPanelState.interferenceObserver = null;
  }
}

/**
 * Update helper panel with current ticket data (Task 5.3.2)
 * Enhanced with real-time recalculation and debouncing
 * Enhanced with fee availability transition detection (Task 5.3.3)
 */
function updateHelperPanelWithTicketData(ticketData, isHighPriority = false) {
  helperPanelState.lastTicketData = ticketData;
  
  // Task 5.3.3: Detect fee information availability changes
  const feeChange = detectFeeAvailabilityChange(ticketData);
  
  // If panel is visible and has current calculations, recalculate after-fee odds
  if (helperPanelState.isVisible && helperPanelState.panelElement && 
      helperPanelState.currentOdds && helperPanelState.currentSide) {
    
    // Clear any existing debounce timer
    if (helperPanelState.recalculateTimer) {
      clearTimeout(helperPanelState.recalculateTimer);
    }
    
    // Task 5.3.3: Handle fee transitions with appropriate priority
    let effectiveIsHighPriority = isHighPriority;
    if (feeChange) {
      // Fee transitions get high priority for smooth user experience
      if (feeChange.feeTransitionedToActual || feeChange.feeBecameAvailable) {
        effectiveIsHighPriority = true;
      }
      
      // Handle the fee transition
      handleFeeTransition(feeChange, ticketData);
    }
    
    // Use shorter debounce for high priority updates (direct input changes or fee transitions)
    const debounceDelay = effectiveIsHighPriority ? 75 : 150;
    
    // Debounce recalculation to avoid excessive updates during rapid input changes
    helperPanelState.recalculateTimer = setTimeout(() => {
      try {
        console.log('🔄 Recalculating helper panel values due to ticket input changes');
        
        // Clear any error messages before recalculating
        if (helperPanelState.panelElement) {
          const errorEl = helperPanelState.panelElement.querySelector('.error-message');
          if (errorEl) {
            errorEl.style.display = 'none';
          }
        }
        
        validateAndCalculate(helperPanelState.panelElement);
        
        // Dispatch custom event for testing/debugging
        document.dispatchEvent(new CustomEvent('kalshi-ao-helper-panel-updated', {
          detail: {
            ticketData: ticketData,
            currentOdds: helperPanelState.currentOdds,
            currentSide: helperPanelState.currentSide,
            suggestedPrice: helperPanelState.suggestedPrice,
            afterFeeOdds: helperPanelState.afterFeeOdds,
            isHighPriority: effectiveIsHighPriority,
            feeChange: feeChange // Task 5.3.3: Include fee change information
          }
        }));
        
      } catch (error) {
        console.error('Error recalculating helper panel values:', error);
        
        // Show user-friendly error in panel if calculation fails
        if (helperPanelState.panelElement) {
          const errorEl = helperPanelState.panelElement.querySelector('.error-message');
          if (errorEl) {
            errorEl.textContent = 'Unable to update calculations. Please try refreshing.';
            errorEl.style.display = 'block';
          }
        }
      }
    }, debounceDelay);
  }
  
  // Update tooltip text based on fee source
  updateHelperPanelTooltips(ticketData);
}

/**
 * Update helper panel tooltips with current fee source information (Task 6.4.3)
 * Enhanced to provide detailed explanations of fee sources and estimation methods
 */
function updateHelperPanelTooltips(ticketData) {
  if (!helperPanelState.panelElement) return;
  
  const tooltip = helperPanelState.panelElement.querySelector('.tooltip-trigger');
  if (tooltip) {
    let tooltipText = `🎯 AMERICAN ODDS TO KALSHI PRICE CONVERTER

🔄 WHAT THIS HELPER DOES FOR YOU:
• Converts your target American odds into the right Kalshi limit price
• Shows you what your after-fee odds will actually be
• Helps you place orders that hit your desired profit targets
• Updates automatically based on current fee information from your ticket

`;
    
    if (ticketData && ticketData.fee) {
      const feeSource = ticketData.fee.feeSource;
      
      if (feeSource === 'ticket') {
        tooltipText += `💰 USING REAL FEE DATA FROM YOUR ORDER TICKET

✅ WHY THIS IS GREAT FOR YOU:
• We're reading the exact fees from your current Kalshi order ticket
• These are the precise fees Kalshi will charge for your specific order
• Includes your account discounts, current market conditions, and all pricing
• Updates instantly when you change anything in your order ticket

📊 CALCULATION ACCURACY:
• Helper calculations use your exact fee amounts - no guessing!
• Reflects all fee components (taker/maker rates, volume discounts, etc.)
• Updates in real-time as you modify your order parameters
• Most accurate after-fee odds predictions possible`;
      } else if (feeSource === 'estimated') {
        tooltipText += `💰 USING ESTIMATED FEES (FALLBACK MODE)

⚠️ WHAT THIS MEANS:
• We can't access your exact ticket fees right now, so we're estimating
• Estimates are based on Kalshi's official published fee schedule
• Your actual fees might be different by ±10-20% from our estimates
• Still gives you a good approximation for planning your orders

📋 HOW WE ESTIMATE:
• Using Kalshi's current fee structure (kept up-to-date):
  - Standard rate: 7% taker fee (most common scenario)
  - Lower rate: 1.75% maker fee (for orders providing liquidity)
• We assume the higher taker fee to be conservative
• Formula: max($0.01, min(price × quantity × 7%, $1.00))

💡 TO GET EXACT CALCULATIONS:
• Make sure your order ticket is fully loaded and visible
• Try refreshing the page and reopening the order ticket
• Fill in all order parameters (price, quantity, side) completely`;
      }
      
      // Add fee amount details
      const feeAmount = ticketData.fee.perContractFee || ticketData.fee.totalFee;
      if (feeAmount !== null) {
        tooltipText += `\n\n💵 Current fee: $${feeAmount.toFixed(4)} per contract`;
      }
      
    } else if (ticketData && ticketData.errors && ticketData.errors.length > 0) {
      tooltipText += `⚠️ Data Parsing Issues Detected
Some ticket data could not be parsed reliably:

🔧 Potential Issues:
• Order ticket may not be fully loaded
• UI elements may have changed since last update
• Network delays affecting data availability

💡 Suggestions:
• Try refreshing the page and reopening the ticket
• Check that all order fields are filled out
• Enable fallback fee estimation in extension settings
• Calculations may be approximate until issues resolve`;
      
      // Add specific error details
      if (ticketData.errors.length > 0) {
        tooltipText += `\n\n📋 Specific errors encountered:`;
        ticketData.errors.slice(0, 3).forEach(error => {
          tooltipText += `\n• ${error}`;
        });
        if (ticketData.errors.length > 3) {
          tooltipText += `\n• ... and ${ticketData.errors.length - 3} more`;
        }
      }
      
    } else {
      tooltipText += `📊 Using Default Values
No ticket data is currently available for calculations:

🔄 What this means:
• Helper panel shows example calculations
• Fee estimates use default published rates
• Actual results may differ when ticket data loads

💡 To get accurate calculations:
• Open an order ticket on this market
• Ensure all order fields are filled out
• Extension will automatically use real ticket data
• Enable fallback estimation for better approximations`;
    }
    
    // Add general usage instructions
    tooltipText += `\n\n📖 HOW TO USE THIS HELPER:
1. Enter your target American odds (like +150 or -200)
2. Choose YES or NO for which side you want to bet
3. See the suggested Kalshi limit price to achieve those odds
4. Check the projected after-fee odds for your order
5. Copy the suggested price into your actual Kalshi order`;
    
    tooltip.title = tooltipText;
  }
  
  // Update fee source indicators in the panel with enhanced tooltips
  const feeSourceEl = helperPanelState.panelElement.querySelector('.fee-source-indicator');
  if (feeSourceEl && ticketData && ticketData.fee) {
    const isEstimated = ticketData.fee.feeSource === 'estimated';
    feeSourceEl.textContent = isEstimated ? '(estimated)' : '(from ticket)';
    feeSourceEl.className = `fee-source-indicator ${isEstimated ? 'estimated' : 'ticket'}`;
    
    // Add detailed tooltip to fee source indicator
    const feeSourceTooltip = isEstimated ? 
      `💰 Fee Source: Estimated (Fallback Mode)
⚠️ We're using estimated fees because we can't access your ticket data right now
📋 Based on Kalshi's official published fee schedule
💡 Refresh the page to try getting exact fees from your ticket` :
      `💰 Fee Source: Your Order Ticket (Exact)
✓ Reading fees directly from your current Kalshi order
✓ This is the most accurate fee information possible
✓ Updates automatically when you change your order details`;
    
    feeSourceEl.title = feeSourceTooltip;
  }
}

/**
 * Task 5.3.3: Detect fee information availability changes
 * Monitors transitions between estimated and actual fee data
 */
function detectFeeAvailabilityChange(currentTicketData) {
  if (!currentTicketData) return null;
  
  const currentFeeSource = currentTicketData.fee?.feeSource || null;
  const currentFeeAvailable = !!(currentTicketData.fee && 
    (currentTicketData.fee.totalFee !== null || currentTicketData.fee.perContractFee !== null));
  
  const previousFeeSource = helperPanelState.lastFeeSource;
  const previousFeeAvailable = helperPanelState.lastFeeAvailability;
  
  // Detect transitions
  const feeSourceChanged = previousFeeSource !== currentFeeSource;
  const feeAvailabilityChanged = previousFeeAvailable !== currentFeeAvailable;
  const feeTransitionedToActual = previousFeeSource === 'estimated' && currentFeeSource === 'ticket';
  const feeTransitionedToEstimated = previousFeeSource === 'ticket' && currentFeeSource === 'estimated';
  const feeBecameAvailable = !previousFeeAvailable && currentFeeAvailable;
  const feeBecameUnavailable = previousFeeAvailable && !currentFeeAvailable;
  
  // Update tracking state
  helperPanelState.lastFeeSource = currentFeeSource;
  helperPanelState.lastFeeAvailability = currentFeeAvailable;
  
  // Return change detection result
  if (feeSourceChanged || feeAvailabilityChanged) {
    console.log('🔄 Fee information change detected:', {
      feeSourceChanged,
      feeAvailabilityChanged,
      feeTransitionedToActual,
      feeTransitionedToEstimated,
      feeBecameAvailable,
      feeBecameUnavailable,
      previousFeeSource,
      currentFeeSource,
      previousFeeAvailable,
      currentFeeAvailable
    });
    
    return {
      feeSourceChanged,
      feeAvailabilityChanged,
      feeTransitionedToActual,
      feeTransitionedToEstimated,
      feeBecameAvailable,
      feeBecameUnavailable,
      previousFeeSource,
      currentFeeSource,
      previousFeeAvailable,
      currentFeeAvailable
    };
  }
  
  return null;
}

/**
 * Task 5.3.3: Handle fee information transitions
 * Provides smooth transitions between estimated and actual fee data
 */
function handleFeeTransition(feeChange, ticketData) {
  if (!feeChange || !helperPanelState.isVisible) return;
  
  console.log('🎯 Handling fee transition:', feeChange);
  
  // Clear any existing fee transition timer
  if (helperPanelState.feeTransitionTimer) {
    clearTimeout(helperPanelState.feeTransitionTimer);
  }
  
  // Determine transition type and appropriate response
  let transitionDelay = 100; // Default delay for smooth transitions
  let shouldShowTransitionIndicator = false;
  let transitionMessage = '';
  
  if (feeChange.feeTransitionedToActual) {
    // Estimated → Actual: High priority update with visual feedback
    transitionDelay = 50;
    shouldShowTransitionIndicator = true;
    transitionMessage = 'Fee information updated from ticket';
    console.log('✅ Fee transitioned from estimated to actual - updating calculations');
    
  } else if (feeChange.feeTransitionedToEstimated) {
    // Actual → Estimated: Medium priority with warning
    transitionDelay = 75;
    shouldShowTransitionIndicator = true;
    transitionMessage = 'Using estimated fee information';
    console.log('⚠️ Fee transitioned from actual to estimated - updating calculations');
    
  } else if (feeChange.feeBecameAvailable) {
    // No fee → Fee available: High priority update
    transitionDelay = 50;
    shouldShowTransitionIndicator = true;
    transitionMessage = 'Fee information now available';
    console.log('🎉 Fee information became available - updating calculations');
    
  } else if (feeChange.feeBecameUnavailable) {
    // Fee available → No fee: Medium priority with fallback
    transitionDelay = 100;
    shouldShowTransitionIndicator = true;
    transitionMessage = 'Fee information no longer available';
    console.log('⚠️ Fee information became unavailable - using fallback calculations');
    
  } else if (feeChange.feeSourceChanged) {
    // Other fee source changes
    transitionDelay = 75;
    shouldShowTransitionIndicator = false;
    console.log('🔄 Fee source changed - updating calculations');
  }
  
  // Show transition indicator if needed
  if (shouldShowTransitionIndicator && helperPanelState.panelElement) {
    showFeeTransitionIndicator(transitionMessage);
  }
  
  // Schedule the transition update
  helperPanelState.feeTransitionTimer = setTimeout(() => {
    try {
      // Update helper panel calculations
      if (helperPanelState.panelElement && helperPanelState.currentOdds && helperPanelState.currentSide) {
        console.log('🔄 Recalculating due to fee transition');
        validateAndCalculate(helperPanelState.panelElement);
      }
      
      // Update after-fee odds display
      updateAfterFeeOddsDisplayFromCurrentState();
      
      // Update tooltips with new fee source information
      updateHelperPanelTooltips(ticketData);
      
      // Dispatch custom event for testing/debugging
      document.dispatchEvent(new CustomEvent('kalshi-ao-fee-transition', {
        detail: {
          feeChange,
          ticketData,
          timestamp: Date.now()
        }
      }));
      
    } catch (error) {
      console.error('Error handling fee transition:', error);
    }
  }, transitionDelay);
}

/**
 * Task 5.3.3: Show visual indicator for fee transitions
 */
function showFeeTransitionIndicator(message) {
  if (!helperPanelState.panelElement) return;
  
  // Find or create transition indicator element
  let indicator = helperPanelState.panelElement.querySelector('.fee-transition-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'fee-transition-indicator';
    indicator.style.cssText = `
      position: absolute;
      top: -5px;
      right: -5px;
      background: #007bff;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: bold;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 1000;
      white-space: nowrap;
    `;
    helperPanelState.panelElement.style.position = 'relative';
    helperPanelState.panelElement.appendChild(indicator);
  }
  
  // Show the indicator with the message
  indicator.textContent = message;
  indicator.style.opacity = '1';
  
  // Hide the indicator after 2 seconds
  setTimeout(() => {
    if (indicator) {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator && indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }
  }, 2000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

} // End of shouldActivateExtensionEarly() check