import { INJECTABLE } from "../constants";

/**
 * Injectable decorator. Marks a class as a provider for the DI container.
 * The class itself is used as the token (no custom token in v1).
 */
export function Injectable(): ClassDecorator {
	return function (target: object) {
		Reflect.defineMetadata(INJECTABLE, true, target);
	};
}
