export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

class Logger {
    private level: LogLevel;

    constructor(level: LogLevel = LogLevel.INFO) {
        this.level = level;
    }

    private shouldLog(level: LogLevel): boolean {
        return level >= this.level;
    }

    private formatMessage(level: string, message: string, ...args: unknown[]): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level}] ${message}`;

        if (args.length > 0) {
            console.log(formattedMessage, ...args);
        } else {
            console.log(formattedMessage);
        }
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            this.formatMessage('DEBUG', message, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.INFO)) {
            this.formatMessage('INFO', message, ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.WARN)) {
            this.formatMessage('WARN', message, ...args);
        }
    }

    error(message: string, error?: Error, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            if (error) {
                this.formatMessage('ERROR', message, error, ...args);
                console.error(error.stack);
            } else {
                this.formatMessage('ERROR', message, ...args);
            }
        }
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }
}

const logger = new Logger(
    process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

export { logger };
export default logger;