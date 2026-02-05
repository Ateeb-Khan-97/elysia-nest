import { PrismaService } from '@/common/services/prisma.service';
import { Injectable } from '@/core';
import type { Prisma, User } from 'generated/prisma/client';

@Injectable()
export class UserService {
	constructor(private readonly prismaService: PrismaService) {}

	async findOneById(id: number): Promise<User | null> {
		return this.prismaService.user.findUnique({
			where: { id },
		});
	}

	async findOneByEmail(email: string): Promise<User | null> {
		return this.prismaService.user.findUnique({
			where: { email },
		});
	}

	async findOne(where: Prisma.UserWhereInput): Promise<User | null> {
		return this.prismaService.user.findFirst({
			where,
		});
	}

	async findAll(): Promise<User[]> {
		return this.prismaService.user.findMany();
	}

	async create(data: Prisma.UserCreateInput): Promise<User> {
		return this.prismaService.user.create({
			data,
		});
	}

	async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
		return this.prismaService.user.update({
			where: { id },
			data,
		});
	}

	async delete(id: number): Promise<User> {
		return this.prismaService.user.delete({
			where: { id },
		});
	}
}
