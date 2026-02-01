import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/config/env.config';
import { Injectable, type CookieJar } from '@/core';

export enum TokenType {
	Access = 'access',
	Refresh = 'refresh',
	Confirmation = 'confirmation',
}

const TOKEN_EXPIRY: Record<TokenType, keyof typeof env> = {
	[TokenType.Access]: 'JWT_ACCESS_EXPIRES_IN',
	[TokenType.Refresh]: 'JWT_REFRESH_EXPIRES_IN',
	[TokenType.Confirmation]: 'JWT_CONFIRMATION_EXPIRES_IN',
};

function getSecret(): Uint8Array {
	return new TextEncoder().encode(env.JWT_SECRET);
}

function getExpiresInSeconds(tokenType: TokenType): number {
	return env[TOKEN_EXPIRY[tokenType]] as number;
}

@Injectable()
export class AuthService {
	async login(id: number, cookie: CookieJar) {
		const accessToken = await this.signPayload(id, TokenType.Access);
		const refreshToken = await this.signPayload(id, TokenType.Refresh);

		const accessCookie = cookie.access_token as {
			value: unknown;
			set?: (opts: Record<string, unknown>) => unknown;
		};
		const refreshCookie = cookie.refresh_token as {
			value: unknown;
			set?: (opts: Record<string, unknown>) => unknown;
		};
		accessCookie.value = accessToken;
		refreshCookie.value = refreshToken;
		accessCookie.set?.({
			httpOnly: true,
			maxAge: getExpiresInSeconds(TokenType.Access),
			sameSite: 'strict',
		});
		refreshCookie.set?.({
			httpOnly: true,
			maxAge: getExpiresInSeconds(TokenType.Refresh),
			sameSite: 'strict',
		});
		return [accessToken, refreshToken] as const;
	}

	async signPayload(id: number, tokenType: TokenType): Promise<string> {
		const secret = getSecret();
		const expiresIn = getExpiresInSeconds(tokenType);
		return new SignJWT({ sub: String(id), type: tokenType })
			.setProtectedHeader({ alg: 'HS256' })
			.setIssuedAt()
			.setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
			.sign(secret);
	}

	async verifyToken(token: string, tokenType: TokenType): Promise<{ id: number }> {
		const secret = getSecret();
		const { payload } = await jwtVerify(token, secret);
		if (payload.type !== tokenType) {
			throw new Error(`Invalid token type: expected ${tokenType}`);
		}
		const sub = payload.sub;
		if (typeof sub !== 'string') {
			throw new Error('Invalid token: missing sub');
		}
		const id = Number(sub);
		if (Number.isNaN(id)) {
			throw new Error('Invalid token: sub is not a number');
		}
		return { id };
	}
}
