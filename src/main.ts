import { AppModule } from './app.module';
import { AuthGuard, GlobalExceptionFilter, LoggingInterceptor } from './common';
import { env } from './config/env.config';
import { createApp, Logger } from './core';

async function bootstrap(): Promise<void> {
	const logger = new Logger('Bootstrap');
	const app = createApp(AppModule, {
		openapiPath: '/api/docs',
		globalGuards: [AuthGuard],
		globalInterceptors: [LoggingInterceptor],
		globalExceptionFilters: [GlobalExceptionFilter],
		openapiSecurityScheme: 'bearerAuth',
	});
	await app.init();
	const server = app.listen(env.PORT);
	logger.log(`Application running on http://0.0.0.0:${env.PORT}`);
	logger.log(`OpenAPI docs: http://0.0.0.0:${env.PORT}/api/docs`);

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
