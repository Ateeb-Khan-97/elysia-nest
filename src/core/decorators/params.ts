import type { ParamMetadata, TSchema } from '../constants';
import { PARAM_METADATA } from '../constants';

function createParamDecorator(type: ParamMetadata['type']) {
	return (key?: string): ParameterDecorator =>
		(target: object, propertyKey: string | symbol, parameterIndex: number) => {
			const existing: Record<number, ParamMetadata> =
				Reflect.getMetadata(PARAM_METADATA, target, propertyKey) ?? {};
			existing[parameterIndex] = { type, key };
			Reflect.defineMetadata(PARAM_METADATA, existing, target, propertyKey);
		};
}

/**
 * Body parameter. Optionally pass an Elysia t schema for validation:
 * @Body(LoginSchema) body: typeof LoginSchema.static
 */
export function Body(schema?: TSchema | Record<string, unknown>): ParameterDecorator;
export function Body(
	target: object,
	propertyKey: string | symbol,
	parameterIndex: number,
): void;
export function Body(
	schemaOrTarget?: TSchema | object,
	propertyKey?: string | symbol,
	parameterIndex?: number,
): ParameterDecorator | undefined {
	if (propertyKey !== undefined && parameterIndex !== undefined) {
		// @Body() without schema
		const target = schemaOrTarget as object;
		const existing: Record<number, ParamMetadata> =
			Reflect.getMetadata(PARAM_METADATA, target, propertyKey) ?? {};
		existing[parameterIndex] = { type: 'body' };
		Reflect.defineMetadata(PARAM_METADATA, existing, target, propertyKey);
		return;
	}
	// @Body(schema)
	const schema = schemaOrTarget as TSchema;
	return (target: object, key: string | symbol, index: number) => {
		const existing: Record<number, ParamMetadata> =
			Reflect.getMetadata(PARAM_METADATA, target, key) ?? {};
		existing[index] = { type: 'body', schema };
		Reflect.defineMetadata(PARAM_METADATA, existing, target, key);
	};
}

export const Param = createParamDecorator('param');

/**
 * Query parameter. Use @Query() for whole query, @Query('key') for one key, or @Query(schema) for validation:
 * @Query(LoginSchema) query: typeof LoginSchema.static
 */
export function Query(keyOrSchema?: string | TSchema): ParameterDecorator;
export function Query(
	target: object,
	propertyKey: string | symbol,
	parameterIndex: number,
): void;
export function Query(
	keyOrSchemaOrTarget?: string | TSchema | object,
	propertyKey?: string | symbol,
	parameterIndex?: number,
): ParameterDecorator | undefined {
	if (propertyKey !== undefined && parameterIndex !== undefined) {
		// @Query() without key/schema
		const target = keyOrSchemaOrTarget as object;
		const existing: Record<number, ParamMetadata> =
			Reflect.getMetadata(PARAM_METADATA, target, propertyKey) ?? {};
		existing[parameterIndex] = { type: 'query' };
		Reflect.defineMetadata(PARAM_METADATA, existing, target, propertyKey);
		return;
	}
	// @Query('key') or @Query(schema)
	const keyOrSchema = keyOrSchemaOrTarget;
	return (target: object, key: string | symbol, index: number) => {
		const existing: Record<number, ParamMetadata> =
			Reflect.getMetadata(PARAM_METADATA, target, key) ?? {};
		const isKey = typeof keyOrSchema === 'string';
		existing[index] = isKey
			? { type: 'query', key: keyOrSchema }
			: { type: 'query', schema: (keyOrSchema as TSchema) ?? undefined };
		Reflect.defineMetadata(PARAM_METADATA, existing, target, key);
	};
}

export const Headers = createParamDecorator('headers');

/**
 * Current user ID from the request (set by AuthGuard after JWT verification).
 * Use on protected routes: @CurrentUser() userId: number
 */
export const CurrentUser = createParamDecorator('user');

/**
 * Cookie from the request (Elysia reactive cookie).
 * @Cookie() cookie - whole cookie jar (Record<string, Cookie>)
 * @Cookie('name') name - single cookie by name (Cookie with .value, .set(), .remove())
 * See https://elysiajs.com/patterns/cookie
 */
export function Cookie(name?: string): ParameterDecorator {
	return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
		const existing: Record<number, ParamMetadata> =
			Reflect.getMetadata(PARAM_METADATA, target, propertyKey) ?? {};
		existing[parameterIndex] = { type: 'cookie', key: name };
		Reflect.defineMetadata(PARAM_METADATA, existing, target, propertyKey);
	};
}
