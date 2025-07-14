// Production-ready error logging utility
// Replace console.log/error with structured logging

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class ErrorLogger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    
    let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context) {
      formattedMessage += ` | Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      formattedMessage += ` | Error: ${error.message}`;
      if (this.isDevelopment && error.stack) {
        formattedMessage += `\nStack: ${error.stack}`;
      }
    }
    
    return formattedMessage;
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context?: Record<string, any>, 
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    };
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('info', message, context);
    
    if (this.isDevelopment) {
      console.log(this.formatMessage(entry));
    }
    
    // In production, you could send to external logging service
    // this.sendToExternalService(entry);
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('warn', message, context);
    
    if (this.isDevelopment) {
      console.warn(this.formatMessage(entry));
    }
    
    // In production, you could send to external logging service
    // this.sendToExternalService(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry('error', message, context, error);
    
    if (this.isDevelopment) {
      console.error(this.formatMessage(entry));
    }
    
    // In production, you could send to external logging service
    // this.sendToExternalService(entry);
  }

  debug(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('debug', message, context);
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage(entry));
    }
  }

  // Placeholder for external logging service integration
  private sendToExternalService(entry: LogEntry) {
    // Implementation would depend on your logging service
    // Examples: Sentry, LogRocket, DataDog, etc.
  }
}

// Export singleton instance
export const logger = new ErrorLogger();

// Convenience functions for common patterns
export const logError = (message: string, error?: Error, context?: Record<string, any>) => {
  logger.error(message, error, context);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info(message, context);
};

export const logWarn = (message: string, context?: Record<string, any>) => {
  logger.warn(message, context);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug(message, context);
};