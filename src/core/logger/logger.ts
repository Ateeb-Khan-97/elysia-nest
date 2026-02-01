import type { LogLevel, LoggerService } from './logger.interface';

const COLORS = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	green: '\x1b[32m',
	blue: '\x1b[36m',
	gray: '\x1b[90m',
	dim: '\x1b[2m',
} as const;

const DEFAULT_LEVELS: LogLevel[] = ['log', 'fatal', 'error', 'warn', 'debug', 'verbose'];

export interface LoggerOptions {
	/** Prefix shown before each log (e.g. "ElysiaNest"). */
	prefix?: string;
	/** If true, print time difference from previous log (e.g. "+5ms"). */
	timestamp?: boolean;
	/** Enabled log levels. Default: all. */
	logLevels?: LogLevel[];
	/** Disable colorized output. */
	colors?: boolean;
}

function formatMessage(value: unknown): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (value instanceof Error) return value.message;
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

/**
 * NestJS-style Logger: context-aware, level-based, optional timestamps and colors.
 * Use in services: `private readonly logger = new Logger(MyService.name);`
 */
export class Logger implements LoggerService {
	private context = '';
	private lastLogTime = 0;
	private readonly prefix: string;
	private readonly timestamp: boolean;
	private readonly logLevels: Set<LogLevel>;
	private readonly colors: boolean;

	static readonly defaultLevels = DEFAULT_LEVELS;

	constructor(context?: string, options: LoggerOptions = {}) {
		this.context = context ?? '';
		this.prefix = options.prefix ?? 'Elysia';
		this.timestamp = options.timestamp ?? false;
		this.logLevels = new Set(options.logLevels ?? DEFAULT_LEVELS);
		this.colors = options.colors ?? true;
	}

	setContext(context: string): void {
		this.context = context;
	}

	private shouldLog(level: LogLevel): boolean {
		return this.logLevels.has(level);
	}

	private color(level: LogLevel, text: string): string {
		if (!this.colors) return text;
		switch (level) {
			case 'fatal':
			case 'error':
				return `${COLORS.red}${text}${COLORS.reset}`;
			case 'warn':
				return `${COLORS.yellow}${text}${COLORS.reset}`;
			case 'log':
				return `${COLORS.green}${text}${COLORS.reset}`;
			case 'debug':
				return `${COLORS.blue}${text}${COLORS.reset}`;
			case 'verbose':
				return `${COLORS.gray}${text}${COLORS.reset}`;
			default:
				return text;
		}
	}

	private format(level: LogLevel, message: string, optionalParams: unknown[]): string {
		const pid = typeof process !== 'undefined' && process.pid != null ? process.pid : '';
		const date = new Date();
		const dateStr = date.toLocaleString();
		const prefixPart = this.color(level, `[${this.prefix}]`);
		const pidDate = `${pid}  - ${dateStr}`;
		const contextPart = this.color(level, `[${this.context}] `);
		const fullMessage = [message, ...optionalParams.map(formatMessage)].join(' ');
		let timeDiff = '';
		if (this.timestamp && this.lastLogTime > 0) {
			const diff = Date.now() - this.lastLogTime;
			timeDiff = this.colors ? `${COLORS.dim} +${diff}ms${COLORS.reset}` : ` +${diff}ms`;
		}
		this.lastLogTime = Date.now();
		return `${prefixPart} ${pidDate}   ${contextPart}${fullMessage}${timeDiff}`;
	}

	private print(level: LogLevel, message: unknown, ...optionalParams: unknown[]): void {
		if (!this.shouldLog(level)) return;
		const msg = formatMessage(message);
		const line = this.format(level, msg, optionalParams);
		switch (level) {
			case 'fatal':
			case 'error':
				console.error(line);
				break;
			case 'warn':
				console.warn(line);
				break;
			default:
				console.log(line);
		}
	}

	log(message: unknown, ...optionalParams: unknown[]): void {
		this.print('log', message, ...optionalParams);
	}

	fatal(message: unknown, ...optionalParams: unknown[]): void {
		this.print('fatal', message, ...optionalParams);
	}

	error(message: unknown, ...optionalParams: unknown[]): void {
		this.print('error', message, ...optionalParams);
	}

	warn(message: unknown, ...optionalParams: unknown[]): void {
		this.print('warn', message, ...optionalParams);
	}

	debug(message: unknown, ...optionalParams: unknown[]): void {
		this.print('debug', message, ...optionalParams);
	}

	verbose(message: unknown, ...optionalParams: unknown[]): void {
		this.print('verbose', message, ...optionalParams);
	}
}
