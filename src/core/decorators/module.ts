import type { ModuleMetadata } from "../constants";
import { MODULE_METADATA } from "../constants";

/**
 * Module decorator. Store imports, controllers, providers, exports (and optional path) on the class.
 */
export function Module(options: ModuleMetadata): ClassDecorator {
	return function (target: object) {
		Reflect.defineMetadata(MODULE_METADATA, options, target);
	};
}
