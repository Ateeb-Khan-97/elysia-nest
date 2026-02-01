import type { Elysia } from 'elysia';
import { openapi } from '@elysiajs/openapi';
import {
	CONTROLLER_PATH,
	ROUTE_METADATA,
	type Constructor,
	type RouteMetadata,
} from './constants';
import { createContainer, type ResolvedApp } from './container';
import { registerRoutes } from './elysia-adapter';
import { Logger } from './logger';

function normalizePath(...segments: string[]): string {
	const joined = segments.filter(Boolean).join('/').replace(/\/+/g, '/');
	return joined.startsWith('/') ? joined : `/${joined}`;
}

function logRegisteredRoutes(container: ResolvedApp): void {
	const logger = new Logger('RoutesResolver');
	for (const { controllerClass } of container.getControllers()) {
		const controllerPath =
			(Reflect.getMetadata(CONTROLLER_PATH, controllerClass) as string | undefined) ?? '';
		const routes =
			(Reflect.getMetadata(ROUTE_METADATA, controllerClass) as
				| RouteMetadata[]
				| undefined) ?? [];
		const controllerName = controllerClass.name;
		logger.log(`${controllerName} {${controllerPath || '/'}}`);
		for (const route of routes) {
			const fullPath = normalizePath(controllerPath, route.path);
			const method = route.method.toUpperCase();
			logger.log(`(${method} ${fullPath})`);
		}
	}
}

export interface CreateAppOptions {
	/** If set, enables OpenAPI docs (true = default path /openapi, or use path string e.g. "/api/docs") */
	openapiPath?: boolean | string;
	/** Guard(s) applied to every route unless the route (or controller) is marked @Public() */
	globalGuards?: Constructor[];
	/** Interceptor(s) applied to every route (run first, then controller/method interceptors). */
	globalInterceptors?: Constructor[];
	/** Exception filter(s) applied to every route; run first, then controller/method filters. */
	globalExceptionFilters?: Constructor[];
	/** OpenAPI security scheme name (e.g. "bearerAuth"). Non-public routes show lock in docs; @Public() routes do not. */
	openapiSecurityScheme?: string;
}

export interface ElysiaNestApp {
	getElysia(): Elysia;
	/** Call after createApp; runs onModuleInit() on all providers that implement it. */
	init(): Promise<void>;
	/** Call on shutdown (e.g. SIGTERM); runs onModuleDestroy() on all providers that implement it. */
	destroy(): Promise<void>;
	listen(port?: number, host?: string): ReturnType<Elysia['listen']>;
}

/**
 * Build module graph, DI container, and Elysia app with all routes registered.
 * Returns an object with getElysia() and listen(port?, host?) for Nest-like usage.
 * Pass { openapiPath: "/api/docs" } to enable OpenAPI documentation at that path.
 *
 * OpenAPI spec is built from the full app (all controller routes) so Scalar can load it.
 */
function hasOnModuleInit(
	instance: unknown,
): instance is { onModuleInit: () => void | Promise<void> } {
	return typeof (instance as { onModuleInit?: unknown })?.onModuleInit === 'function';
}

function hasOnModuleDestroy(instance: unknown): instance is {
	onModuleDestroy: () => void | Promise<void>;
} {
	return (
		typeof (instance as { onModuleDestroy?: unknown })?.onModuleDestroy === 'function'
	);
}

export function createApp(
	RootModule: Constructor,
	options?: CreateAppOptions,
): ElysiaNestApp {
	const container = createContainer(RootModule);
	const adapterOptions = {
		globalGuards: options?.globalGuards,
		globalInterceptors: options?.globalInterceptors,
		globalExceptionFilters: options?.globalExceptionFilters,
		openapiSecurityScheme: options?.openapiSecurityScheme,
	};
	let elysia = registerRoutes(container, undefined, adapterOptions);
	let initDone = false;
	let destroyDone = false;

	if (options?.openapiPath) {
		const path = options.openapiPath === true ? '/openapi' : options.openapiPath;
		const documentation =
			options.openapiSecurityScheme != null
				? {
						components: {
							securitySchemes: {
								[options.openapiSecurityScheme]: {
									type: 'http' as const,
									scheme: 'bearer' as const,
									bearerFormat: 'JWT',
								},
							},
						},
					}
				: undefined;
		elysia = elysia.use(
			openapi({
				path,
				documentation,
				scalar: {
					theme: 'deepSpace',
					hideModels: true,
					hideDarkModeToggle: true,
					hideClientButton: false,
					showDeveloperTools: 'never',
					url: `${path}/json`,
				},
			}),
		);
	}

	return {
		getElysia() {
			return elysia;
		},
		async init() {
			if (initDone) return;
			initDone = true;
			logRegisteredRoutes(container);
			for (const token of container.getAllTokens()) {
				const instance = container.get(token);
				if (hasOnModuleInit(instance)) {
					await Promise.resolve(instance.onModuleInit());
				}
			}
		},
		async destroy() {
			if (destroyDone) return;
			destroyDone = true;
			const tokens = container.getAllTokens();
			for (let i = tokens.length - 1; i >= 0; i--) {
				const token = tokens[i];
				if (token === undefined) continue;
				const instance = container.get(token);
				if (hasOnModuleDestroy(instance)) {
					await Promise.resolve(instance.onModuleDestroy());
				}
			}
		},
		listen(port?: number, host?: string) {
			const p = port ?? 3000;
			const h = host ?? '0.0.0.0';
			return elysia.listen({ port: p, hostname: h });
		},
	};
}
