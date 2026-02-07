import type { Constructor } from '../constants';
import { CONTROLLER_FILTERS_METADATA, METHOD_FILTERS_METADATA } from '../constants';

function setFilters(
	target: object,
	filters: Constructor[],
	propertyKey?: string | symbol,
): void {
	if (propertyKey !== undefined) {
		const existing: Constructor[] =
			Reflect.getMetadata(METHOD_FILTERS_METADATA, target, propertyKey) ?? [];
		Reflect.defineMetadata(
			METHOD_FILTERS_METADATA,
			[...existing, ...filters],
			target,
			propertyKey,
		);
	} else {
		Reflect.defineMetadata(CONTROLLER_FILTERS_METADATA, filters, target);
	}
}

/**
 * Register exception filter(s) for the controller (class) or a single route (method).
 * Filters must be registered as providers if they have dependencies.
 */
export function UseFilters(...filters: Constructor[]): ClassDecorator & MethodDecorator {
	return ((
		target: object,
		propertyKey?: string | symbol,
		_descriptor?: PropertyDescriptor,
	) => {
		setFilters(target, filters, propertyKey);
	}) as ClassDecorator & MethodDecorator;
}
