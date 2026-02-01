import type { Constructor } from "../constants";
import {
	CONTROLLER_INTERCEPTORS_METADATA,
	METHOD_INTERCEPTORS_METADATA,
} from "../constants";

function setInterceptors(
	target: object,
	interceptors: Constructor[],
	propertyKey?: string | symbol,
): void {
	if (propertyKey !== undefined) {
		const existing: Constructor[] =
			Reflect.getMetadata(METHOD_INTERCEPTORS_METADATA, target, propertyKey) ?? [];
		Reflect.defineMetadata(
			METHOD_INTERCEPTORS_METADATA,
			[...existing, ...interceptors],
			target,
			propertyKey,
		);
	} else {
		Reflect.defineMetadata(CONTROLLER_INTERCEPTORS_METADATA, interceptors, target);
	}
}

/**
 * Register interceptor(s) for the controller (class) or a single route (method).
 * Interceptors must be registered as providers if they have dependencies.
 */
export function UseInterceptors(
	...interceptors: Constructor[]
): ClassDecorator & MethodDecorator {
	return function (
		target: object,
		propertyKey?: string | symbol,
		_descriptor?: PropertyDescriptor,
	) {
		setInterceptors(target, interceptors, propertyKey);
	} as ClassDecorator & MethodDecorator;
}
