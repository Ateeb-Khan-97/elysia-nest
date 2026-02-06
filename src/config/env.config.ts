import z from 'zod';

export const envSchema = z.object({
	PORT: z.coerce.number().default(5000),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	DATABASE_URL: z.url(),
	JWT_SECRET: z.string().min(32),
	JWT_ACCESS_EXPIRES_IN: z.coerce.number().positive().default(900),
	JWT_REFRESH_EXPIRES_IN: z.coerce.number().positive().default(604800),
	JWT_CONFIRMATION_EXPIRES_IN: z.coerce.number().positive().default(86400),
	GOOGLE_APP_PASSWORD: z.string(),
	GOOGLE_APP_EMAIL: z.email(),
	APP_URL: z.url(),
});

export const env = (() => {
	const parsed = envSchema.safeParse(Bun.env);
	if (!parsed.success) {
		throw new Error(`Invalid environment variables: ${parsed.error.message}`);
	}
	return Object.freeze(parsed.data);
})();

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
