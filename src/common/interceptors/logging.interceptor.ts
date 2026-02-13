import {
	HttpException,
	Injectable,
	Logger,
	type NestInterceptor,
	type ExecutionContext,
} from '@/core';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger('Request');

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
			const status = this.getStatusFromResult(result);
			this.logger.debug(`${method} ${path} ${status} +${ms}ms`);
			return result;
		} catch (error) {
			const ms = Date.now() - start;
			const status = error instanceof HttpException ? error.statusCode : 500;
			this.logger.warn(`${method} ${path} ${status} +${ms}ms (error)`);
			throw error;
		}
	}

	private getStatusFromResult(result: unknown): number {
		if (result instanceof Response) return result.status;
		return 200;
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
