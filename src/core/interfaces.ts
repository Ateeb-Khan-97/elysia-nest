/**
 * Context passed to guards, interceptors, and filters.
 * Mirrors Elysia handler context (body, params, query, headers).
 */
export interface ExecutionContext {
	cookie: CookieJar;
	body: unknown;
	params: Record<string, string>;
	query: Record<string, string>;
	headers: Record<string, string | undefined>;
	[key: string]: unknown;
}

/**
 * Guard: determines if the request is allowed to reach the handler.
 * Return false or throw to deny; return true to allow.
 */
export interface CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

/**
 * Interceptor: wraps the handler. Call next() to invoke the handler (or next interceptor).
 * Can transform the response or run logic before/after.
 */
export interface NestInterceptor {
	intercept(context: ExecutionContext, next: () => Promise<unknown>): Promise<unknown>;
}

/**
 * Exception filter: handles errors thrown in the handler (or guards/interceptors).
 * Return a Response to send as the error response; return undefined/void to pass to the next filter.
 * Context has .error, .request, etc.
 */
export interface ExceptionFilter {
	catch(
		exception: unknown,
		context: unknown,
	): Response | Promise<Response> | undefined | Promise<undefined>;
}

/**
 * Lifecycle: called after the module's dependencies are initialized.
 * Implement onModuleInit in @Injectable() providers (e.g. connect DB).
 */
export interface OnModuleInit {
	onModuleInit(): void | Promise<void>;
}

/**
 * Lifecycle: called before the app shuts down (e.g. on SIGTERM).
 * Implement onModuleDestroy in @Injectable() providers (e.g. disconnect DB).
 */
export interface OnModuleDestroy {
	onModuleDestroy(): void | Promise<void>;
}

export type CookieJar = Record<
	string,
	{
		value: unknown;
		set?: (opts: Record<string, unknown>) => unknown;
		remove: () => unknown;
	}
>;
