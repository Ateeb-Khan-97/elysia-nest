import { Elysia } from 'elysia';
import type { ParamMetadata } from './constants';
import type { Constructor } from './constants';
import {
	API_TAG_METADATA,
	CONTROLLER_GUARDS_METADATA,
	CONTROLLER_FILTERS_METADATA,
	CONTROLLER_INTERCEPTORS_METADATA,
	CONTROLLER_PATH,
	CONTROLLER_PUBLIC_METADATA,
	METHOD_FILTERS_METADATA,
	METHOD_GUARDS_METADATA,
	METHOD_INTERCEPTORS_METADATA,
	METHOD_PUBLIC_METADATA,
	PARAM_METADATA,
	ROUTE_METADATA,
	WEBSOCKET_HANDLERS_METADATA,
	WEBSOCKET_PATH,
} from './constants';
import type { WebSocketHandlerMetadata } from './constants';
import type {
	CanActivate,
	ExecutionContext,
	ExceptionFilter,
	NestInterceptor,
} from './interfaces';
import type { ResolvedApp } from './container';

function normalizePath(...segments: string[]): string {
	const joined = segments.filter(Boolean).join('/').replace(/\/+/g, '/');
	return joined.startsWith('/') ? joined : `/${joined}`;
}

function getBodySchema(
	paramMetadata: Record<number, ParamMetadata> | undefined,
): ParamMetadata['schema'] | undefined {
	if (!paramMetadata) return undefined;
	for (const meta of Object.values(paramMetadata)) {
		if (meta?.type === 'body' && meta.schema) return meta.schema;
	}
	return undefined;
}

function getQuerySchema(
	paramMetadata: Record<number, ParamMetadata> | undefined,
): ParamMetadata['schema'] | undefined {
	if (!paramMetadata) return undefined;
	for (const meta of Object.values(paramMetadata)) {
		if (meta?.type === 'query' && meta.schema) return meta.schema;
	}
	return undefined;
}

function resolveInstance<T>(app: ResolvedApp, Cls: Constructor): T {
	try {
		return app.get(Cls) as T;
	} catch {
		return new (Cls as new () => T)();
	}
}

function mergeControllerAndMethod<T>(
	controllerClass: Constructor,
	propertyKey: string,
	controllerKey: symbol,
	methodKey: symbol,
): T[] {
	const controllerList =
		(Reflect.getMetadata(controllerKey, controllerClass) as T[] | undefined) ?? [];
	const methodList =
		(Reflect.getMetadata(methodKey, controllerClass.prototype, propertyKey) as
			| T[]
			| undefined) ?? [];
	return [...controllerList, ...methodList];
}

function buildArgs(
	context: {
		body: unknown;
		params: Record<string, string>;
		query: Record<string, string>;
		headers: Record<string, string | undefined>;
		user?: number;
		cookie?: Record<string, unknown>;
	},
	paramMetadata: Record<number, ParamMetadata> | undefined,
	_propertyKey: string,
): unknown[] {
	if (!paramMetadata || Object.keys(paramMetadata).length === 0) {
		return [];
	}
	const maxIndex = Math.max(...Object.keys(paramMetadata).map(Number));
	const args: unknown[] = [];
	for (let i = 0; i <= maxIndex; i++) {
		const meta = paramMetadata[i];
		if (!meta) {
			args.push(undefined);
			continue;
		}
		switch (meta.type) {
			case 'body':
				args.push(context.body);
				break;
			case 'param':
				args.push(meta.key ? context.params[meta.key] : context.params);
				break;
			case 'query':
				args.push(meta.key ? context.query[meta.key] : context.query);
				break;
			case 'headers':
				args.push(meta.key ? context.headers[meta.key] : context.headers);
				break;
			case 'user':
				args.push(context.user);
				break;
			case 'cookie':
				args.push(meta.key && context.cookie ? context.cookie[meta.key] : context.cookie);
				break;
			default:
				args.push(undefined);
		}
	}
	return args;
}

export interface RegisterRoutesOptions {
	/** Guard(s) applied to every route unless route/controller is @Public() */
	globalGuards?: Constructor[];
	/** Interceptor(s) applied to every route (run first, then controller/method interceptors). */
	globalInterceptors?: Constructor[];
	/** Exception filter(s) applied to every route; run first, then controller/method filters. */
	globalExceptionFilters?: Constructor[];
	/** OpenAPI security scheme name; non-public routes get detail.security so docs show lock */
	openapiSecurityScheme?: string;
}

function isRoutePublic(controllerClass: Constructor, propertyKey: string): boolean {
	const controllerPublic =
		Reflect.getMetadata(CONTROLLER_PUBLIC_METADATA, controllerClass) === true;
	const methodPublic =
		Reflect.getMetadata(
			METHOD_PUBLIC_METADATA,
			controllerClass.prototype,
			propertyKey,
		) === true;
	return controllerPublic || methodPublic;
}

/**
 * Register all controller routes on an Elysia instance.
 * Uses method chaining so the returned app is the same chain.
 * If baseElysia is provided (e.g. with OpenAPI plugin), routes are chained onto it.
 */
export function registerRoutes(
	app: ResolvedApp,
	baseElysia?: Elysia,
	options?: RegisterRoutesOptions,
): Elysia {
	// Enable cookie so context.cookie is set on every request (see https://elysiajs.com/patterns/cookie)
	let elysia =
		baseElysia ??
		new Elysia({
			allowUnsafeValidationDetails: true,
			cookie: {},
		});
	const globalGuards = options?.globalGuards ?? [];
	const globalInterceptors = options?.globalInterceptors ?? [];
	const globalExceptionFilters = options?.globalExceptionFilters ?? [];
	const openapiSecurityScheme = options?.openapiSecurityScheme;

	for (const { controller, controllerClass } of app.getControllers()) {
		const controllerPath =
			(Reflect.getMetadata(CONTROLLER_PATH, controllerClass) as string | undefined) ?? '';
		const apiTags = Reflect.getMetadata(API_TAG_METADATA, controllerClass) as
			| string[]
			| undefined;
		const routes =
			(Reflect.getMetadata(ROUTE_METADATA, controllerClass) as Array<{
				method: 'get' | 'post' | 'put' | 'patch' | 'delete';
				path: string;
				propertyKey: string;
			}>) ?? [];

		for (const route of routes) {
			const fullPath = normalizePath(controllerPath, route.path);
			const paramMetadata = Reflect.getMetadata(
				PARAM_METADATA,
				controllerClass.prototype,
				route.propertyKey,
			) as Record<number, ParamMetadata> | undefined;

			const bodySchema = getBodySchema(paramMetadata);
			const querySchema = getQuerySchema(paramMetadata);
			const isPublic = isRoutePublic(controllerClass, route.propertyKey);
			let guardClasses = mergeControllerAndMethod<Constructor>(
				controllerClass,
				route.propertyKey,
				CONTROLLER_GUARDS_METADATA,
				METHOD_GUARDS_METADATA,
			);
			if (!isPublic && globalGuards.length > 0) {
				guardClasses = [...globalGuards, ...guardClasses];
			}
			const routeInterceptorClasses = mergeControllerAndMethod<Constructor>(
				controllerClass,
				route.propertyKey,
				CONTROLLER_INTERCEPTORS_METADATA,
				METHOD_INTERCEPTORS_METADATA,
			);
			const interceptorClasses = [...globalInterceptors, ...routeInterceptorClasses];
			const routeFilterClasses = mergeControllerAndMethod<Constructor>(
				controllerClass,
				route.propertyKey,
				CONTROLLER_FILTERS_METADATA,
				METHOD_FILTERS_METADATA,
			);
			const filterClasses = [...globalExceptionFilters, ...routeFilterClasses];

			const innerHandler = (context: {
				body: unknown;
				params: Record<string, string>;
				query: Record<string, string>;
				headers: Record<string, string | undefined>;
				cookie?: Record<string, unknown>;
			}) => {
				const args = buildArgs(context, paramMetadata, route.propertyKey);
				const method = (controller as Record<string, (...args: unknown[]) => unknown>)[
					route.propertyKey
				];
				if (typeof method !== 'function') {
					throw new Error(
						`elysia-nest: controller method ${route.propertyKey} is not a function`,
					);
				}
				return method.apply(controller, args);
			};

			let handler: (context: unknown) => unknown = innerHandler as (
				context: unknown,
			) => unknown;
			if (interceptorClasses.length > 0) {
				handler = (context: unknown) => {
					const ctx = context as ExecutionContext;
					let chain = (): Promise<unknown> => Promise.resolve(innerHandler(ctx));
					for (let i = interceptorClasses.length - 1; i >= 0; i--) {
						const InterceptorClass = interceptorClasses[i];
						if (!InterceptorClass) continue;
						const interceptor = resolveInstance<NestInterceptor>(app, InterceptorClass);
						const next = chain;
						chain = () => interceptor.intercept(ctx, next);
					}
					return chain();
				};
			}

			const hook: {
				body?: ParamMetadata['schema'];
				query?: ParamMetadata['schema'];
				detail?: { tags?: string[]; security?: Record<string, string[]>[] };
				beforeHandle?: (context: unknown) => Promise<Response | undefined>;
				error?: (context: { error: Error }) => Promise<Response | unknown>;
			} = {};
			if (bodySchema) hook.body = bodySchema;
			if (querySchema) hook.query = querySchema;
			hook.detail = { ...(apiTags?.length ? { tags: apiTags } : {}) };
			if (!isPublic && openapiSecurityScheme) {
				hook.detail.security = [{ [openapiSecurityScheme]: [] }];
			}
			if (guardClasses.length > 0) {
				hook.beforeHandle = async (context: unknown) => {
					const ctx = context as ExecutionContext;
					for (const GuardClass of guardClasses) {
						const guard = resolveInstance<CanActivate>(app, GuardClass);
						const ok = await guard.canActivate(ctx);
						if (!ok) {
							return new Response(JSON.stringify({ message: 'Forbidden' }), {
								status: 403,
								headers: { 'Content-Type': 'application/json' },
							});
						}
					}
				};
			}
			if (filterClasses.length > 0) {
				hook.error = async (errContext: { error: Error; [k: string]: unknown }) => {
					const exception = errContext.error;
					for (const FilterClass of filterClasses) {
						const filter = resolveInstance<ExceptionFilter>(app, FilterClass);
						const res = await filter.catch(exception, errContext);
						if (res != null) return res;
					}
					throw exception;
				};
			}
			const hasHook =
				hook.body ?? hook.query ?? hook.detail ?? hook.beforeHandle ?? hook.error;
			const handlerCast = handler;
			// Elysia t schema is compatible at runtime; cast to satisfy LocalHook generics

			const hookOpt = hasHook ? hook : undefined;
			switch (route.method) {
				case 'get':
					elysia = (
						elysia as { get: (p: string, h: unknown, o?: unknown) => Elysia }
					).get(fullPath, handlerCast, hookOpt);
					break;
				case 'post':
					elysia = (
						elysia as { post: (p: string, h: unknown, o?: unknown) => Elysia }
					).post(fullPath, handlerCast, hookOpt);
					break;
				case 'put':
					elysia = (
						elysia as { put: (p: string, h: unknown, o?: unknown) => Elysia }
					).put(fullPath, handlerCast, hookOpt);
					break;
				case 'patch':
					elysia = (
						elysia as { patch: (p: string, h: unknown, o?: unknown) => Elysia }
					).patch(fullPath, handlerCast, hookOpt);
					break;
				case 'delete':
					elysia = (
						elysia as { delete: (p: string, h: unknown, o?: unknown) => Elysia }
					).delete(fullPath, handlerCast, hookOpt);
					break;
			}
		}

		// WebSocket gateway: same controller can expose a .ws() endpoint
		const wsPath = Reflect.getMetadata(WEBSOCKET_PATH, controllerClass) as
			| string
			| undefined;
		if (wsPath != null && wsPath !== '') {
			const handlers = Reflect.getMetadata(
				WEBSOCKET_HANDLERS_METADATA,
				controllerClass,
			) as WebSocketHandlerMetadata[] | undefined;
			if (handlers?.length) {
				const fullWsPath = normalizePath(controllerPath, wsPath);
				const wsConfig: Record<
					string,
					(ws: unknown, ...args: unknown[]) => void | Promise<void>
				> = {};
				for (const { hook, propertyKey } of handlers) {
					const method = (
						controller as Record<
							string,
							(ws: unknown, ...args: unknown[]) => void | Promise<void>
						>
					)[propertyKey];
					if (typeof method !== 'function') continue;
					const bound = method.bind(controller);
					switch (hook) {
						case 'open':
							wsConfig.open = (ws: unknown) => bound(ws);
							break;
						case 'message':
							wsConfig.message = (ws: unknown, message: unknown) => bound(ws, message);
							break;
						case 'close':
							wsConfig.close = (ws: unknown) => bound(ws);
							break;
						case 'drain':
							wsConfig.drain = (ws: unknown, ...args: unknown[]) => bound(ws, args);
							break;
					}
				}
				elysia = (elysia as { ws: (path: string, config: unknown) => Elysia }).ws(
					fullWsPath,
					wsConfig,
				);
			}
		}
	}

	return elysia;
}
