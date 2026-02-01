import {
	Injectable,
	Logger,
	UnauthorizedException,
	type CanActivate,
	type ExecutionContext,
} from '@/core';
import { AuthService, TokenType } from '@/modules/auth/auth.service';

/** Read access token: Authorization Bearer first, then access_token cookie */
function getAccessToken(context: ExecutionContext): string | undefined {
	const authHeader = context.headers?.authorization;
	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.slice(7).trim();
		if (token) return token;
	}
	const cookie = context.cookie as { access_token?: { value?: unknown } } | undefined;
	const value = cookie?.access_token?.value;
	return typeof value === 'string' ? value : undefined;
}

/** Read refresh token from refresh_token cookie only */
function getRefreshToken(context: ExecutionContext): string | undefined {
	const cookie = context.cookie as { refresh_token?: { value?: unknown } } | undefined;
	const value = cookie?.refresh_token?.value;
	return typeof value === 'string' ? value : undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
	private readonly logger = new Logger(AuthGuard.name);

	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const accessToken = getAccessToken(context);
		const refreshToken = getRefreshToken(context);

		if (!accessToken && !refreshToken) {
			throw new UnauthorizedException('Unauthorized');
		}

		// 1. Try access token first (header or cookie)
		if (accessToken) {
			const [accessError, userId] = await this.verifyAccess(accessToken);
			if (!accessError && userId != null) {
				context.user = userId;
				return true;
			}
			// Access invalid: try refresh if present
			if (refreshToken) {
				const userId = await this.tryRefreshAndLogin(context, refreshToken);
				if (userId != null) {
					context.user = userId;
					return true;
				}
			}
			this.logger.debug('Access token invalid and no valid refresh token');
			throw new UnauthorizedException('Invalid or expired token');
		}

		// 2. Only refresh token available: verify and re-issue tokens (login again)
		const token = refreshToken;
		if (!token) throw new UnauthorizedException('Unauthorized');
		const userId = await this.tryRefreshAndLogin(context, token);
		if (userId != null) {
			context.user = userId;
			return true;
		}

		throw new UnauthorizedException('Unauthorized');
	}

	private async verifyAccess(token: string): Promise<[Error | null, number | null]> {
		try {
			const { id } = await this.authService.verifyToken(token, TokenType.Access);
			return [null, id];
		} catch (err) {
			return [err instanceof Error ? err : new Error(String(err)), null];
		}
	}

	/**
	 * Verify refresh token; if valid and context has cookie jar, set new access/refresh cookies.
	 * Returns user id if valid, null otherwise.
	 */
	private async tryRefreshAndLogin(
		context: ExecutionContext,
		refreshToken: string,
	): Promise<number | null> {
		try {
			const { id } = await this.authService.verifyToken(refreshToken, TokenType.Refresh);
			const cookie = context.cookie;
			if (cookie) {
				await this.authService.login(id, cookie);
			}
			return id;
		} catch (err) {
			this.logger.debug('Refresh token invalid or expired', err);
			return null;
		}
	}
}
