import { t } from 'elysia';

export namespace UserSchema {
	export const UpdateUserSchema = t.Object({
		fullName: t.String({ minLength: 3, maxLength: 32 }),
	});
	export type UpdateUserSchema = typeof UpdateUserSchema.static;
}
