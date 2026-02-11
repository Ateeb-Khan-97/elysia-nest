import { AppModule } from './app.module';
import { AuthGuard, GlobalExceptionFilter, LoggingInterceptor } from './common';
import { env, isProduction } from './config/env.config';
import { createApp, Logger } from './core';

async function bootstrap(): Promise<void> {
	const logger = new Logger('Bootstrap');
	const app = createApp(AppModule, {
		openapiPath: isProduction ? false : '/api/docs',
		globalGuards: [AuthGuard],
		globalInterceptors: [LoggingInterceptor],
		globalExceptionFilters: [GlobalExceptionFilter],
		openapiSecurityScheme: 'bearerAuth',
	});
	await app.init();
	const server = app.listen(env.PORT);
	logger.log(`Application running on http://localhost:${env.PORT}`);
	if (!isProduction) {
		logger.log(`OpenAPI docs: http://localhost:${env.PORT}/api/docs`);
	}

	const shutdown = async (): Promise<void> => {
		logger.log('Shutting down...');
		await app.destroy();
		server.stop();
		process.exit(0);
	};
	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}

bootstrap();
