import { CommonService } from './common/common.service';
import { PrismaService } from './config/db.config';
import { Module } from './core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { AuthGuard } from './guard/auth.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
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
