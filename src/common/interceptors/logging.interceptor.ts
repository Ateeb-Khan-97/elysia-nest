import { Injectable, Logger, type NestInterceptor, type ExecutionContext } from '@/core';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	async intercept(
		context: ExecutionContext,
		next: () => Promise<unknown>,
	): Promise<unknown> {
		const start = Date.now();
		const method = this.getMethod(context);
		const path = this.getPath(context);

		try {
			const result = await next();
			const ms = Date.now() - start;
			this.logger.debug(`${method} ${path} +${ms}ms`);
			return result;
		} catch (error) {
			const ms = Date.now() - start;
			this.logger.warn(`${method} ${path} +${ms}ms (error)`);
			throw error;
		}
	}

	private getMethod(context: ExecutionContext): string {
		const request = context.request as Request | undefined;
		if (request?.method) return request.method.toUpperCase();
		return 'UNKNOWN';
	}

	private getPath(context: ExecutionContext): string {
		if (typeof context.path === 'string') return context.path;
		const request = context.request as Request | undefined;
		if (request?.url) {
			try {
				return new URL(request.url).pathname;
			} catch {
				return request.url;
			}
		}
		return '/';
	}
}
