import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@/core';
import { env } from '@/config/env.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(PrismaService.name);

	constructor() {
		const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
		super({ adapter });
	}

	async onModuleInit(): Promise<void> {
		try {
			await this.$connect();
			this.logger.log('Prisma connected');
		} catch (error) {
			this.logger.error('Prisma connection failed', error);
			process.exit(1);
		}
	}

	async onModuleDestroy(): Promise<void> {
		try {
			await this.$disconnect();
			this.logger.log('Prisma disconnected');
		} catch (error) {
			this.logger.error('Prisma disconnection failed', error);
			process.exit(1);
		}
	}
}
