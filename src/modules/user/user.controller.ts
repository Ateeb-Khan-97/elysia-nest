import {
	ApiTag,
	Body,
	Controller,
	CurrentUser,
	Get,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	Put,
} from '@/core';
import { CommonService, ResponseMapper } from '@/common';
import { UserService } from './user.service';
import { UserSchema } from './user.schema';

@ApiTag('User')
@Controller('/api/user')
export class UserController {
	private readonly logger = new Logger(UserController.name);
	constructor(
		private readonly commonService: CommonService,
		private readonly userService: UserService,
	) {}

	@Get('me')
	async getUser(@CurrentUser() userId: number) {
		const user = await this.userService.findOneById(userId);
		if (!user) throw new NotFoundException('User not found');
		return ResponseMapper({
			status: 200,
			message: 'Profile fetched successfully',
			data: this.commonService.exclude(user, ['password', 'isConfirmed', 'deletedAt']),
		});
	}

	@Put('me')
	async updateUser(
		@CurrentUser() userId: number,
		@Body(UserSchema.UpdateUserSchema) body: UserSchema.UpdateUserSchema,
	) {
		try {
			const user = await this.userService.update(userId, body);
			return ResponseMapper({
				status: 200,
				message: 'Profile updated successfully',
				data: this.commonService.exclude(user, ['password', 'isConfirmed', 'deletedAt']),
			});
		} catch (error) {
			this.logger.error('Error updating user', error);
			throw new InternalServerErrorException('Failed to update user');
		}
	}
}
