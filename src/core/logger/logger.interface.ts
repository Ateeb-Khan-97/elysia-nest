/**
 * NestJS-style logger service interface.
 * Implement this for custom loggers or use the built-in Logger class.
 */
export interface LoggerService {
	/**
	 * Write a 'log' level log.
	 */
	log(message: unknown, ...optionalParams: unknown[]): void;

	/**
	 * Write a 'fatal' level log.
	 */
	fatal(message: unknown, ...optionalParams: unknown[]): void;

	/**
	 * Write an 'error' level log.
	 */
	error(message: unknown, ...optionalParams: unknown[]): void;

	/**
	 * Write a 'warn' level log.
	 */
	warn(message: unknown, ...optionalParams: unknown[]): void;

	/**
	 * Write a 'debug' level log.
	 */
	debug?(message: unknown, ...optionalParams: unknown[]): void;

	/**
	 * Write a 'verbose' level log.
	 */
	verbose?(message: unknown, ...optionalParams: unknown[]): void;
}

export type LogLevel = 'log' | 'fatal' | 'error' | 'warn' | 'debug' | 'verbose';
