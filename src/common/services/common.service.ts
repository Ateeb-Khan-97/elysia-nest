import { Injectable } from '@/core';

@Injectable()
export class CommonService {
	get uuid(): string {
		return Bun.randomUUIDv7();
	}

	exclude<T extends Record<string, unknown>, K extends keyof T>(
		obj: T,
		keys: K[],
	): Omit<T, K> {
		return Object.fromEntries(
			Object.entries(obj).filter(([key]) => !keys.includes(key as K)),
		) as Omit<T, K>;
	}
}
