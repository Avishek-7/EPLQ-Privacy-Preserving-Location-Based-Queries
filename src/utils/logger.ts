export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    SUCCESS: 4
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

interface LogEntry {
    timestamp: string;
    level: string;
    component: string;
    message: string;
    data?: unknown;
}

class Logger {
    private level: LogLevel;
    private isDevelopment = import.meta.env.DEV;
    private logs: LogEntry[] = [];
    private maxLogs = 1000; // Keep last 1000 logs in memory

    constructor(level: LogLevel = LogLevel.INFO) {
        this.level = level;
        this.info('Logger', '🚀 Logger initialized', { 
            isDevelopment: this.isDevelopment, 
            level: this.getLevelName(level) 
        });
    }

    private shouldLog(level: LogLevel): boolean {
        return level >= this.level;
    }

    private getLevelName(level: LogLevel): string {
        const names = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'SUCCESS'];
        return names[level] || 'UNKNOWN';
    }

    private getLevelEmoji(level: LogLevel): string {
        switch (level) {
            case LogLevel.DEBUG: return '🔍';
            case LogLevel.INFO: return 'ℹ️';
            case LogLevel.WARN: return '⚠️';
            case LogLevel.ERROR: return '❌';
            case LogLevel.SUCCESS: return '✅';
            default: return '📝';
        }
    }

    private addToHistory(level: LogLevel, component: string, message: string, data?: unknown): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: this.getLevelName(level),
            component,
            message,
            data
        };

        this.logs.push(entry);
        
        // Keep only the most recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    private formatMessage(level: LogLevel, component: string, message: string, ...args: unknown[]): void {
        if (!this.shouldLog(level)) return;

        const timestamp = new Date().toISOString();
        const emoji = this.getLevelEmoji(level);
        const formattedMessage = `${emoji} [${timestamp}] [${component}] ${message}`;
        const data = args.length > 0 ? args : undefined;

        // Store in history
        this.addToHistory(level, component, message, data);

        // Console output with appropriate method
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage, ...args);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, ...args);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage, ...args);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage, ...args);
                break;
            case LogLevel.SUCCESS:
                console.log(formattedMessage, ...args);
                break;
            default:
                console.log(formattedMessage, ...args);
        }
    }

    // Enhanced logging methods with component parameter
    debug(component: string, message: string, ...args: unknown[]): void {
        this.formatMessage(LogLevel.DEBUG, component, message, ...args);
    }

    info(component: string, message: string, ...args: unknown[]): void {
        this.formatMessage(LogLevel.INFO, component, message, ...args);
    }

    warn(component: string, message: string, ...args: unknown[]): void {
        this.formatMessage(LogLevel.WARN, component, message, ...args);
    }

    error(component: string, message: string, error?: Error | unknown, ...args: unknown[]): void {
        if (error instanceof Error) {
            this.formatMessage(LogLevel.ERROR, component, message, { 
                error: error.message, 
                stack: error.stack 
            }, ...args);
        } else {
            this.formatMessage(LogLevel.ERROR, component, message, error, ...args);
        }
    }

    success(component: string, message: string, ...args: unknown[]): void {
        this.formatMessage(LogLevel.SUCCESS, component, message, ...args);
    }

    // Utility methods
    setLevel(level: LogLevel): void {
        this.level = level;
        this.info('Logger', `Log level changed to ${this.getLevelName(level)}`);
    }

    getLogs(levelFilter?: LogLevel): LogEntry[] {
        if (levelFilter !== undefined) {
            const levelName = this.getLevelName(levelFilter);
            return this.logs.filter(log => log.level === levelName);
        }
        return [...this.logs];
    }

    clearLogs(): void {
        this.logs = [];
        console.clear();
        this.info('Logger', 'Logs cleared');
    }

    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    // Specialized logging methods
    firebase(operation: string, success: boolean, details?: unknown): void {
        const component = 'Firebase';
        if (success) {
            this.success(component, `${operation} completed`, details);
        } else {
            this.error(component, `${operation} failed`, details);
        }
    }

    auth(operation: string, user?: { email?: string | null; uid?: string }, error?: unknown): void {
        const component = 'Auth';
        if (error) {
            this.error(component, `${operation} failed`, error, { user: user?.email });
        } else {
            this.success(component, `${operation} successful`, { 
                user: user?.email, 
                uid: user?.uid 
            });
        }
    }

    location(operation: string, result?: GeolocationPosition | GeolocationPositionError, permissions?: string[]): void {
        const component = 'Location';
        if (result && 'coords' in result) {
            this.success(component, `${operation} successful`, {
                lat: result.coords.latitude,
                lng: result.coords.longitude,
                accuracy: result.coords.accuracy,
                permissions
            });
        } else if (result && 'code' in result) {
            this.error(component, `${operation} failed`, {
                code: result.code,
                message: result.message,
                permissions
            });
        } else {
            this.error(component, `${operation} failed`, { result, permissions });
        }
    }

    // Group logging for related operations
    group(component: string, operation: string): void {
        console.group(`🔧 [${component}] ${operation}`);
        this.debug(component, `Starting operation: ${operation}`);
    }

    groupEnd(): void {
        console.groupEnd();
    }
}

// Create logger instance with appropriate level
const logger = new Logger(
    import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO
);

// Export convenience functions for common use cases
export const logFirebase = (operation: string, success: boolean, details?: unknown) => 
    logger.firebase(operation, success, details);

export const logAuth = (operation: string, user?: { email?: string | null; uid?: string }, error?: unknown) => 
    logger.auth(operation, user, error);

export const logLocation = (operation: string, result?: GeolocationPosition | GeolocationPositionError, permissions?: string[]) => 
    logger.location(operation, result, permissions);

export { logger };
export default logger;