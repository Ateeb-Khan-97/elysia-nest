/**
 * Base HTTP exception. Throw in controllers/guards/interceptors;
 * GlobalExceptionFilter maps statusCode and message to the response.
 */
export class HttpException extends Error {
	readonly statusCode: number;
	readonly response?: unknown;

	constructor(
		message: string,
		statusCode: number,
		response?: unknown,
	) {
		super(message);
		this.name = 'HttpException';
		this.statusCode = statusCode;
		this.response = response;
		Object.setPrototypeOf(this, HttpException.prototype);
	}
}

/** 400 Bad Request */
export class BadRequestException extends HttpException {
	constructor(message = 'Bad Request', response?: unknown) {
		super(message, 400, response);
		this.name = 'BadRequestException';
		Object.setPrototypeOf(this, BadRequestException.prototype);
	}
}

/** 401 Unauthorized */
export class UnauthorizedException extends HttpException {
	constructor(message = 'Unauthorized', response?: unknown) {
		super(message, 401, response);
		this.name = 'UnauthorizedException';
		Object.setPrototypeOf(this, UnauthorizedException.prototype);
	}
}

/** 403 Forbidden */
export class ForbiddenException extends HttpException {
	constructor(message = 'Forbidden', response?: unknown) {
		super(message, 403, response);
		this.name = 'ForbiddenException';
		Object.setPrototypeOf(this, ForbiddenException.prototype);
	}
}

/** 404 Not Found */
export class NotFoundException extends HttpException {
	constructor(message = 'Not Found', response?: unknown) {
		super(message, 404, response);
		this.name = 'NotFoundException';
		Object.setPrototypeOf(this, NotFoundException.prototype);
	}
}

/** 409 Conflict */
export class ConflictException extends HttpException {
	constructor(message = 'Conflict', response?: unknown) {
		super(message, 409, response);
		this.name = 'ConflictException';
		Object.setPrototypeOf(this, ConflictException.prototype);
	}
}

/** 422 Unprocessable Entity */
export class UnprocessableEntityException extends HttpException {
	constructor(message = 'Unprocessable Entity', response?: unknown) {
		super(message, 422, response);
		this.name = 'UnprocessableEntityException';
		Object.setPrototypeOf(this, UnprocessableEntityException.prototype);
	}
}

/** 500 Internal Server Error */
export class InternalServerErrorException extends HttpException {
	constructor(message = 'Internal Server Error', response?: unknown) {
		super(message, 500, response);
		this.name = 'InternalServerErrorException';
		Object.setPrototypeOf(this, InternalServerErrorException.prototype);
	}
}
