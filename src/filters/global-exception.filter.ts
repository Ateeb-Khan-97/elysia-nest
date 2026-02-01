import { HttpException, Injectable, type ExceptionFilter } from '@/core';
import { NotFoundError, ValidationError, type Context } from 'elysia';

@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, _context: unknown): Response | undefined {
		const RESPONSE = {
			success: false,
			status: 500,
			message: 'Internal server error',
			data: null as unknown,
		};

		if (exception instanceof Error) {
			RESPONSE.message = exception.message;
		}

		if (exception instanceof HttpException) {
			RESPONSE.status = exception.statusCode;
			RESPONSE.message = exception.message;
		}

		if (exception instanceof ValidationError) {
			RESPONSE.status = 422;
			RESPONSE.message = 'Validation error';
			const errorResponse: { [key: string]: string } = {};
			JSON.parse(exception.message).errors.forEach(
				(error: { path: string; message: string }) => {
					errorResponse[error.path.replace('/', '')] = error.message;
				},
			);
			RESPONSE.data = errorResponse;
		}
		if (exception instanceof NotFoundError) {
			RESPONSE.status = 404;
			RESPONSE.message = 'Not found';
		}

		(_context as Context).set.status = RESPONSE.status;
		return new Response(JSON.stringify(RESPONSE), {
			status: RESPONSE.status,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
