import 'reflect-metadata';
import type { Constructor, ModuleMetadata } from './constants';
import { DESIGN_PARAMTYPES, MODULE_METADATA } from './constants';

/**
 * Collect all modules reachable from the root (via imports).
 */
function collectModules(rootModule: Constructor): Constructor[] {
	const visited = new Set<Constructor>();
	const stack: Constructor[] = [rootModule];
	while (stack.length > 0) {
		const mod = stack.pop();
		if (mod === undefined) break;
		if (visited.has(mod)) continue;
		visited.add(mod);
		const meta: ModuleMetadata | undefined = Reflect.getMetadata(MODULE_METADATA, mod);
		if (meta?.imports) {
			for (const imp of meta.imports) {
				if (!visited.has(imp)) stack.push(imp);
			}
		}
	}
	return [...visited];
}

/**
 * Flatten all provider classes from the module set.
 * Each module's providers are included (exports not enforced for v1; all providers global).
 */
function collectProviders(modules: Constructor[]): Set<Constructor> {
	const providers = new Set<Constructor>();
	for (const mod of modules) {
		const meta: ModuleMetadata | undefined = Reflect.getMetadata(MODULE_METADATA, mod);
		if (meta?.providers) {
			for (const p of meta.providers) {
				providers.add(p as Constructor);
			}
		}
	}
	return providers;
}

/**
 * Collect controller classes per module (module class -> controller classes).
 */
function collectControllers(modules: Constructor[]): Map<Constructor, Constructor[]> {
	const map = new Map<Constructor, Constructor[]>();
	for (const mod of modules) {
		const meta: ModuleMetadata | undefined = Reflect.getMetadata(MODULE_METADATA, mod);
		if (meta?.controllers) {
			map.set(mod, meta.controllers as Constructor[]);
		}
	}
	return map;
}

/**
 * Resolve constructor dependencies using design:paramtypes and return instances.
 * Singletons per token. No circular dependency support in v1.
 */
function resolveDeps(
	token: Constructor,
	instances: Map<Constructor, unknown>,
	allowedTokens: Set<Constructor>,
): unknown[] {
	const paramtypes: Constructor[] | undefined = Reflect.getMetadata(
		DESIGN_PARAMTYPES,
		token,
	);
	if (!paramtypes || paramtypes.length === 0) return [];
	return paramtypes.map((dep) => getOrCreate(dep, instances, allowedTokens));
}

function getOrCreate(
	token: Constructor,
	instances: Map<Constructor, unknown>,
	allowedTokens: Set<Constructor>,
): unknown {
	let instance = instances.get(token);
	if (instance !== undefined) return instance;
	if (!allowedTokens.has(token)) {
		throw new Error(
			`elysia-nest: cannot resolve ${token.name}; not registered as provider or controller.`,
		);
	}
	const deps = resolveDeps(token, instances, allowedTokens);
	instance = new token(...deps);
	instances.set(token, instance);
	return instance;
}

export interface ControllerEntry {
	moduleRef: Constructor;
	controller: unknown;
	controllerClass: Constructor;
}

export interface ResolvedApp {
	get<T>(token: Constructor): T;
	getControllers(): ControllerEntry[];
	/** All provider and controller tokens (for lifecycle hooks). */
	getAllTokens(): Constructor[];
}

/**
 * Build module graph and DI container. Resolve all providers and controllers.
 * Controllers are singletons per app (same as Nest default).
 */
export function createContainer(rootModule: Constructor): ResolvedApp {
	const modules = collectModules(rootModule);
	const allProviders = collectProviders(modules);
	const controllerMap = collectControllers(modules);
	const allControllers = new Set<Constructor>();
	for (const list of controllerMap.values()) {
		for (const c of list) allControllers.add(c);
	}
	const allowedTokens = new Set<Constructor>([...allProviders, ...allControllers]);
	const allTokensList = [...allProviders, ...allControllers];
	const instances = new Map<Constructor, unknown>();

	// Pre-create all controller instances (so routes get the same instance)
	const controllerInstances: ControllerEntry[] = [];
	for (const [moduleRef, controllers] of controllerMap) {
		for (const ControllerClass of controllers) {
			const instance = getOrCreate(
				ControllerClass as Constructor,
				instances,
				allowedTokens,
			);
			controllerInstances.push({
				moduleRef,
				controller: instance,
				controllerClass: ControllerClass as Constructor,
			});
		}
	}

	return {
		get<T>(token: Constructor): T {
			return getOrCreate(token, instances, allowedTokens) as T;
		},
		getControllers() {
			return controllerInstances;
		},
		getAllTokens() {
			return allTokensList;
		},
	};
}
