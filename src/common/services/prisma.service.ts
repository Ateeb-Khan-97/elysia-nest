import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from 'generated/prisma/client';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@/core';
import { env, isProduction } from '@/config/env.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(PrismaService.name);

	constructor() {
		const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
		super({
			adapter,
			log: isProduction
				? undefined
				: [
						{ emit: 'event', level: 'warn' },
						{ emit: 'event', level: 'error' },
						{ emit: 'event', level: 'query' },
						{ emit: 'event', level: 'info' },
					],
		});
		this.$on('warn' as never, (event: Prisma.LogEvent) => {
			this.logger.warn(event.message);
		});
		this.$on('error' as never, (event: Prisma.LogEvent) => {
			this.logger.error(event.message);
		});
		this.$on('query' as never, (event: Prisma.QueryEvent) => {
			let log = `${event.query} ${event.params} (+${event.duration.toFixed(0)}ms)`;
			if (event.params === '[]') log = `${event.query} (+${event.duration.toFixed(0)}ms)`;
			this.logger.debug(log);
		});
		this.$on('info' as never, (event: Prisma.LogEvent) => {
			this.logger.debug(event.message);
		});
	}

	async onModuleInit(): Promise<void> {
		try {
			await this.$executeRawUnsafe('SELECT 1');
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
