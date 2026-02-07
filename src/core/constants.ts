/**
 * Metadata keys used by elysia-nest decorators and container.
 * Kept separate so scanner/adapter do not depend on NestJS.
 */

export const MODULE_METADATA = Symbol('elysia-nest:module');
export const CONTROLLER_PATH = Symbol('elysia-nest:controller-path');
export const ROUTE_METADATA = Symbol('elysia-nest:route');
export const PARAM_METADATA = Symbol('elysia-nest:param');
export const INJECTABLE = Symbol('elysia-nest:injectable');
/** OpenAPI tag(s) for the controller (shown in docs). */
export const API_TAG_METADATA = Symbol('elysia-nest:api-tag');
/** Guard classes (controller-level). */
export const CONTROLLER_GUARDS_METADATA = Symbol('elysia-nest:controller-guards');
/** Guard classes (method-level). */
export const METHOD_GUARDS_METADATA = Symbol('elysia-nest:method-guards');
/** Interceptor classes (controller-level). */
export const CONTROLLER_INTERCEPTORS_METADATA = Symbol(
	'elysia-nest:controller-interceptors',
);
/** Interceptor classes (method-level). */
export const METHOD_INTERCEPTORS_METADATA = Symbol('elysia-nest:method-interceptors');
/** Exception filter classes (controller-level). */
export const CONTROLLER_FILTERS_METADATA = Symbol('elysia-nest:controller-filters');
/** Exception filter classes (method-level). */
export const METHOD_FILTERS_METADATA = Symbol('elysia-nest:method-filters');
/** Route/controller is public (bypass global guards). Class-level. */
export const CONTROLLER_PUBLIC_METADATA = Symbol('elysia-nest:controller-public');
/** Route is public (bypass global guards). Method-level. */
export const METHOD_PUBLIC_METADATA = Symbol('elysia-nest:method-public');

/** WebSocket endpoint path (class-level). Combined with controller path if present. */
export const WEBSOCKET_PATH = Symbol('elysia-nest:websocket-path');
/** WebSocket lifecycle handlers: open, message, close, drain. */
export const WEBSOCKET_HANDLERS_METADATA = Symbol('elysia-nest:websocket-handlers');

/** design:paramtypes is the standard key from reflect-metadata for ctor param types */
export const DESIGN_PARAMTYPES = 'design:paramtypes';

export type ParamType = 'body' | 'param' | 'query' | 'headers' | 'user' | 'cookie';

/** Elysia/TypeBox schema (e.g. t.Object({ ... })) for validation */
export type TSchema = Record<string, unknown>;

export interface ParamMetadata {
	type: ParamType;
	key?: string;
	/** Optional Elysia t schema for body/query/params validation */
	schema?: TSchema;
}

export interface RouteMetadata {
	method: 'get' | 'post' | 'put' | 'patch' | 'delete';
	path: string;
	propertyKey: string;
}

export type WebSocketHandlerType = 'open' | 'message' | 'close' | 'drain';

export interface WebSocketHandlerMetadata {
	hook: WebSocketHandlerType;
	propertyKey: string;
}

/** Constructor type that accepts any class (typed ctor params are compatible). */
// biome-ignore lint/suspicious/noExplicitAny: intentional for "any class constructor" (e.g. AuthGuard(authService))
export type Constructor = new (...args: any[]) => any;

export interface ModuleMetadata {
	imports?: Constructor[];
	controllers?: Constructor[];
	providers?: Constructor[];
	exports?: Constructor[];
	path?: string;
}
