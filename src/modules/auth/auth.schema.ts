import { t } from 'elysia';

export namespace AuthSchema {
	export const SigninSchema = t.Object({
		email: t.String({ format: 'email' }),
		password: t.String({ minLength: 8, maxLength: 32 }),
	});
	export type SigninSchema = typeof SigninSchema.static;

	export const SignUpSchema = t.Object({
		email: t.String({ format: 'email' }),
		password: t.String({ minLength: 8, maxLength: 32 }),
		confirmPassword: t.String({ minLength: 8, maxLength: 32 }),
		fullName: t.String({ minLength: 3, maxLength: 32 }),
	});
	export type SignUpSchema = typeof SignUpSchema.static;

	export const RefreshAccessTokenSchema = t.Object({
		refreshToken: t.Optional(t.String({ minLength: 50 })),
	});
	export type RefreshAccessTokenSchema = typeof RefreshAccessTokenSchema.static;

	export const ConfirmEmailSchema = t.Object({
		token: t.String({ minLength: 50 }),
	});
	export type ConfirmEmailSchema = typeof ConfirmEmailSchema.static;
}
