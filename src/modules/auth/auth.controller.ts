import {
	ApiTag,
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	Cookie,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	Post,
	Public,
	UnauthorizedException,
	type CookieJar,
} from '@/core';
import {
	BackgroundTasksService,
	CommonService,
	EmailService,
	ResponseMapper,
} from '@/common';
import { UserService } from '../user/user.service';
import { AuthSchema } from './auth.schema';
import { AuthService, TokenType } from './auth.service';

@ApiTag('Auth')
@Controller('/api/auth')
export class AuthController {
	private readonly logger = new Logger(AuthController.name);
	constructor(
		private readonly commonService: CommonService,
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly emailService: EmailService,
		private readonly backgroundTasks: BackgroundTasksService,
	) {}

	@Public()
	@Post('sign-in')
	async signIn(
		@Body(AuthSchema.SigninSchema) body: AuthSchema.SigninSchema,
		@Cookie() cookie: CookieJar,
	) {
		const user = await this.userService.findOneByEmail(body.email);
		if (!user || user.deletedAt) throw new NotFoundException('User not found');
		if (!user.isConfirmed) throw new UnauthorizedException('User email is not confirmed');
		if (!(await Bun.password.verify(body.password, user.password)))
			throw new UnauthorizedException('Invalid credentials');

		const [accessToken, refreshToken] = await this.authService.login(user.id, cookie);

		return ResponseMapper({
			message: 'Sign in successful',
			data: {
				accessToken,
				refreshToken,
				user: this.commonService.exclude(user, ['password', 'isConfirmed', 'deletedAt']),
			},
		});
	}

	@Public()
	@Post('sign-up')
	async signUp(@Body(AuthSchema.SignUpSchema) body: AuthSchema.SignUpSchema) {
		const user = await this.userService.findOneByEmail(body.email);
		if (user) throw new ConflictException('User already exists');
		if (body.password !== body.confirmPassword)
			throw new BadRequestException('Passwords do not match');

		const hashedPassword = await Bun.password.hash(body.password);
		try {
			const user = await this.userService.create({
				email: body.email,
				password: hashedPassword,
				fullName: body.fullName,
			});
			const confirmationToken = await this.authService.signPayload(
				user.id,
				TokenType.Confirmation,
			);
			this.backgroundTasks.run(
				this.emailService.sendVerificationEmail({
					to: user.email,
					fullName: user.fullName,
					token: confirmationToken,
				}),
			);

			return ResponseMapper({ status: 201, message: 'Sign up successful' });
		} catch (error) {
			this.logger.error('Error creating user', error);
			throw new InternalServerErrorException('Failed to create user');
		}
	}

	@Public()
	@Post('refresh-access')
	async refreshAccess(
		@Body(AuthSchema.RefreshAccessTokenSchema) body: AuthSchema.RefreshAccessTokenSchema,
		@Cookie() cookie: CookieJar,
	) {
		const rt = body?.refreshToken ?? (cookie.refresh_token?.value as string | undefined);
		if (!rt) throw new BadRequestException('Refresh token is required');
		try {
			const { id: userId } = await this.authService.verifyToken(rt, TokenType.Refresh);
			const user = await this.userService.findOneById(userId);
			if (!user || user.deletedAt) throw new NotFoundException('User not found');

			const [accessToken, refreshToken] = await this.authService.login(userId, cookie);

			return ResponseMapper({
				message: 'Session refreshed',
				data: {
					accessToken,
					refreshToken,
					user: this.commonService.exclude(user, [
						'password',
						'isConfirmed',
						'deletedAt',
					]),
				},
			});
		} catch (error) {
			this.logger.error('Error refreshing access token', error);
			throw new InternalServerErrorException('Failed to refresh access token');
		}
	}

	@Post('sign-out')
	async signOut(@Cookie() cookie: CookieJar) {
		cookie.access_token?.remove();
		cookie.refresh_token?.remove();
		return ResponseMapper({ message: 'Sign out successful' });
	}

	@Public()
	@Post('confirm-email')
	async confirmEmail(
		@Body(AuthSchema.ConfirmEmailSchema) body: AuthSchema.ConfirmEmailSchema,
	) {
		let payload: { id: number };
		try {
			payload = await this.authService.verifyToken(body.token, TokenType.Confirmation);
		} catch (error) {
			this.logger.error('Error confirming email', error);
			throw new UnauthorizedException('Invalid token');
		}
		const user = await this.userService.findOneById(payload.id);
		if (!user) throw new NotFoundException('User not found');
		await this.userService.update(payload.id, { isConfirmed: true });
		return ResponseMapper({ message: 'Email confirmed' });
	}
}
