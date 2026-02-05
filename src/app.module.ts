import {
	AuthGuard,
	BackgroundTasksService,
	CommonService,
	EmailService,
	GlobalExceptionFilter,
	LoggingInterceptor,
} from './common';
import { PrismaService } from './common/services/prisma.service';
import { Module } from './core';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';

@Module({
	imports: [AuthModule, UserModule],
	providers: [
		AuthGuard,
		GlobalExceptionFilter,
		LoggingInterceptor,
		PrismaService,
		CommonService,
		EmailService,
		BackgroundTasksService,
	],
})
export class AppModule {}
