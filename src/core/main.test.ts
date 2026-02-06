import { test, expect } from 'bun:test';
import {
	Module,
	Controller,
	Get,
	Post,
	Body,
	Param,
	Injectable,
	createApp,
} from './index';

@Injectable()
class TestService {
	greet() {
		return 'Hello from service';
	}
}

@Controller('api')
class TestController {
	constructor(private readonly service: TestService) {}

	@Get()
	getRoot() {
		return this.service.greet();
	}

	@Get(':id')
	getId(@Param('id') id: string) {
		return { id };
	}

	@Post('echo')
	postEcho(@Body() body: unknown) {
		return body;
	}
}

@Module({
	controllers: [TestController],
	providers: [TestService],
})
class TestModule {}

test('createApp registers routes and GET /api returns service result', async () => {
	const app = createApp(TestModule);
	const elysia = app.getElysia();

	const res = await elysia.handle(new Request('http://localhost/api'));
	expect(res.status).toBe(200);
	const text = await res.text();
	expect(text).toBe('Hello from service');
});

test('GET /api/:id returns param', async () => {
	const app = createApp(TestModule);
	const elysia = app.getElysia();

	const res = await elysia.handle(new Request('http://localhost/api/123'));
	expect(res.status).toBe(200);
	const json = await res.json();
	expect(json).toEqual({ id: '123' });
});

test('POST /api/echo returns body', async () => {
	const app = createApp(TestModule);
	const elysia = app.getElysia();

	const body = { foo: 'bar' };
	const res = await elysia.handle(
		new Request('http://localhost/api/echo', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		}),
	);
	expect(res.status).toBe(200);
	const json = await res.json();
	expect(json).toEqual(body);
});

test('createApp with openapiPath serves OpenAPI docs at that path', async () => {
	const app = createApp(TestModule, { openapiPath: '/api/docs' });
	const elysia = app.getElysia();

	const res = await elysia.handle(new Request('http://localhost/api/docs'));
	expect(res.status).toBe(200);
	const text = await res.text();
	expect(text).toContain('scalar'); // OpenAPI plugin serves Scalar UI by default
});

test('OpenAPI spec at openapiPath/json includes controller routes', async () => {
	const app = createApp(TestModule, { openapiPath: '/api/docs' });
	const elysia = app.getElysia();

	const res = await elysia.handle(new Request('http://localhost/api/docs/json'));
	expect(res.status).toBe(200);
	const spec = (await res.json()) as { openapi: string; paths: Record<string, unknown> };
	expect(spec.openapi).toBe('3.0.3');
	expect(spec.paths).toBeDefined();
	expect(Object.keys(spec.paths).some((p) => p.startsWith('/api'))).toBe(true);
});
