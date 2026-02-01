import type { RouteMetadata } from "../constants";
import { ROUTE_METADATA } from "../constants";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

function createMethodDecorator(method: HttpMethod) {
	return (path = ""): MethodDecorator =>
		function (target: object, propertyKey: string | symbol) {
			const routes: RouteMetadata[] =
				Reflect.getMetadata(ROUTE_METADATA, target.constructor) ?? [];
			const normalized = path.startsWith("/") ? path.slice(1) : path;
			routes.push({
				method,
				path: normalized,
				propertyKey: String(propertyKey),
			});
			Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor);
		};
}

export const Get = createMethodDecorator("get");
export const Post = createMethodDecorator("post");
export const Put = createMethodDecorator("put");
export const Patch = createMethodDecorator("patch");
export const Delete = createMethodDecorator("delete");
