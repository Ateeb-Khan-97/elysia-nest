import type { WebSocketHandlerMetadata } from '../constants';
import {
	WEBSOCKET_HANDLERS_METADATA,
	WEBSOCKET_PATH,
	type WebSocketHandlerType,
} from '../constants';

/**
 * Marks a controller class as a WebSocket gateway and sets the endpoint path.
 * Path is combined with @Controller() path if present (e.g. Controller('/api') + WebSocket('/ws') → /api/ws).
 */
export function WebSocket(path = ''): ClassDecorator {
	return (target: object) => {
		const normalized = path.startsWith('/') ? path.slice(1) : path;
		Reflect.defineMetadata(WEBSOCKET_PATH, normalized, target);
	};
}

function createWsHandlerDecorator(hook: WebSocketHandlerType): MethodDecorator {
	return (target: object, propertyKey: string | symbol) => {
		const handlers: WebSocketHandlerMetadata[] =
			Reflect.getMetadata(WEBSOCKET_HANDLERS_METADATA, target.constructor) ?? [];
		handlers.push({ hook, propertyKey: String(propertyKey) });
		Reflect.defineMetadata(WEBSOCKET_HANDLERS_METADATA, handlers, target.constructor);
	};
}

/** Method called when a WebSocket connection opens. Signature: (ws) => void | Promise<void> */
export const WsOpen = (): MethodDecorator => createWsHandlerDecorator('open');

/** Method called when a message is received. Signature: (ws, message) => void | Promise<void> */
export const WsMessage = (): MethodDecorator => createWsHandlerDecorator('message');

/** Method called when the connection closes. Signature: (ws) => void | Promise<void> */
export const WsClose = (): MethodDecorator => createWsHandlerDecorator('close');

/** Method called when the server is ready to accept more data (drain). Signature: (ws, code, reason) => void | Promise<void> */
export const WsDrain = (): MethodDecorator => createWsHandlerDecorator('drain');
