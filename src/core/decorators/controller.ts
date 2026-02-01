import { CONTROLLER_PATH } from "../constants";

/**
 * Controller decorator. Stores the route path prefix (default '').
 */
export function Controller(path = ""): ClassDecorator {
	return function (target: object) {
		const normalized = path.startsWith("/") ? path.slice(1) : path;
		Reflect.defineMetadata(CONTROLLER_PATH, normalized, target);
	};
}
