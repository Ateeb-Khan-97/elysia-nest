import type { Constructor } from '../constants';
import { CONTROLLER_GUARDS_METADATA, METHOD_GUARDS_METADATA } from '../constants';

function setGuards(
	target: object,
	guards: Constructor[],
	propertyKey?: string | symbol,
): void {
	if (propertyKey !== undefined) {
		const existing: Constructor[] =
			Reflect.getMetadata(METHOD_GUARDS_METADATA, target, propertyKey) ?? [];
		Reflect.defineMetadata(
			METHOD_GUARDS_METADATA,
			[...existing, ...guards],
			target,
			propertyKey,
		);
	} else {
		Reflect.defineMetadata(CONTROLLER_GUARDS_METADATA, guards, target);
	}
}

/**
 * Register guard(s) for the controller (class) or a single route (method).
 * Guards must be registered as providers if they have dependencies.
 */
export function UseGuards(...guards: Constructor[]): ClassDecorator & MethodDecorator {
	return ((
		target: object,
		propertyKey?: string | symbol,
		_descriptor?: PropertyDescriptor,
	) => {
		setGuards(target, guards, propertyKey);
	}) as ClassDecorator & MethodDecorator;
}
