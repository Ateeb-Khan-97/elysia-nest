import {
	AuthGuard,
	CommonService,
	GlobalExceptionFilter,
	LoggingInterceptor,
} from './common';
import { PrismaService } from './config/db.config';
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
	],
})
export class AppModule {}
