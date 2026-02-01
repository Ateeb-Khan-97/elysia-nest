import {
	CONTROLLER_PUBLIC_METADATA,
	METHOD_PUBLIC_METADATA,
} from "../constants";

/**
 * Mark a controller or route as public (bypass global guards).
 * Use on a method to make only that route public, or on the class to make all routes public.
 */
export function Public(): ClassDecorator & MethodDecorator {
	return function (
		target: object,
		propertyKey?: string | symbol,
		_descriptor?: PropertyDescriptor,
	) {
		if (propertyKey !== undefined) {
			Reflect.defineMetadata(METHOD_PUBLIC_METADATA, true, target, propertyKey);
		} else {
			Reflect.defineMetadata(CONTROLLER_PUBLIC_METADATA, true, target);
		}
	} as ClassDecorator & MethodDecorator;
}
