# elysia-nest

NestJS-like API on [Elysia](https://elysiajs.com) as the HTTP adapter. Write with decorators (`@Module`, `@Controller`, `@Get`, `@Injectable`, `@Body`, `@Param`, etc.) and run on Elysia’s stack (Bun). No Express or NestJS runtime.

## Setup

- **Bun** and **Elysia** are the runtime (see [.cursor/rules](.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc)).
- TypeScript: `experimentalDecorators` and `emitDecoratorMetadata` must be enabled in `tsconfig.json`.

```bash
bun install
```

## Usage

```ts
import {
  Module,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Injectable,
  createApp,
} from "elysia-nest";

@Injectable()
class AppService {
  getHello() {
    return "Hello";
  }
}

@Controller("cats")
class CatsController {
  constructor(private readonly appService: AppService) {}

  @Get()
  findAll() {
    return this.appService.getHello();
  }

  @Post()
  create(@Body() body: { name: string }) {
    return body;
  }
}

@Module({
  controllers: [CatsController],
  providers: [AppService],
})
class AppModule {}

const app = createApp(AppModule);
app.listen(3000);
```

- **GET /cats** → `findAll()` (injected `AppService`).
- **POST /cats** → `create(body)` with request body.

With global guards, interceptors, and exception filters (and optional OpenAPI):

```ts
const app = createApp(AppModule, {
  openapiPath: "/api/docs",
  globalGuards: [AuthGuard],
  globalInterceptors: [LoggingInterceptor],
  globalExceptionFilters: [GlobalExceptionFilter],
  openapiSecurityScheme: "bearerAuth",
});
await app.init(); // runs onModuleInit() on providers
app.listen(3000);
```

## Decorators

| Decorator       | Scope    | Purpose                                      |
|----------------|----------|----------------------------------------------|
| `@Module(...)` | Class    | Declare imports, controllers, providers, exports |
| `@Controller(path?)` | Class | Route prefix for this controller             |
| `@Get(path?)`, `@Post(path?)`, `@Put(path?)`, `@Patch(path?)`, `@Delete(path?)` | Method | HTTP method + path |
| `@Public()` | Class / Method | Bypass global guards for this controller or route |
| `@UseGuards(...)`, `@UseInterceptors(...)`, `@UseFilters(...)` | Class / Method | Attach guards, interceptors, or exception filters |
| `@Injectable()` | Class  | Register as provider (DI)                    |
| `@Body()`, `@Param(key?)`, `@Query(key?)`, `@Headers(key?)` | Parameter | Bind handler args from context |
| `@WebSocket(path?)` | Class | WebSocket gateway; path is combined with `@Controller()` path |
| `@WsOpen()`, `@WsMessage()`, `@WsClose()`, `@WsDrain()` | Method | WebSocket lifecycle handlers (open, message, close, drain) |

### Server-Sent Events (SSE)

If a controller handler is a **generator** (`function*` or `async function*`), whatever you `yield` is sent as SSE (wrapped with Elysia’s `sse()`). Works with **any HTTP method** (GET, POST, etc.):

```ts
import { Controller, Get, Post, Public } from "elysia-nest";

@Controller("/api/events")
export class EventsController {
  @Public()
  @Get("stream")
  async *streamGet() {
    yield "hello";
    yield { event: "message", data: { time: new Date().toISOString() } };
  }

  @Public()
  @Post("stream")
  async *streamPost() {
    yield { event: "started", data: {} };
  }
}
```

- **GET /api/events/stream** or **POST /api/events/stream** → `text/event-stream`; consume with `EventSource` or `fetch` + `ReadableStream`.

### Guards, interceptors, and error handling

Pass **global** guards, interceptors, and exception filters in `createApp(Module, options)`:

- **options.globalGuards** – Run before every route unless the route (or controller) is `@Public()`.
- **options.globalInterceptors** – Wrap every route handler (e.g. logging, timing).
- **options.globalExceptionFilters** – Run in Elysia’s **app-level `onError`**: all errors (handlers, validation, not found, etc.) are passed to these filters. Return a `Response` to send a custom error response.

Route-level guards/interceptors/filters are attached with `@UseGuards()`, `@UseInterceptors()`, `@UseFilters()` on a class or method.

### WebSocket

Use [Elysia’s WebSocket](https://elysiajs.com/patterns/websocket) from a controller with `@WebSocket()` and lifecycle decorators:

```ts
import { Controller, WebSocket, WsMessage, WsOpen, createApp, Module } from "elysia-nest";

@Controller()
@WebSocket("/ws")
class WsGateway {
  @WsOpen()
  onOpen(ws: { send: (data: string | Buffer) => void }) {
    ws.send("connected");
  }

  @WsMessage()
  onMessage(ws: { send: (data: string | Buffer) => void }, message: unknown) {
    ws.send(JSON.stringify({ echo: message }));
  }
}

@Module({ controllers: [WsGateway] })
class AppModule {}

const app = createApp(AppModule);
app.listen(3000);
// Connect to ws://localhost:3000/ws
```

- **@WebSocket(path)** – Endpoint path (e.g. `"/ws"`). If the class also has `@Controller("/api")`, the socket is at `/api/ws`.
- **@WsOpen()** – `(ws) => void` – connection opened.
- **@WsMessage()** – `(ws, message) => void` – message received (JSON parsed by Elysia when applicable).
- **@WsClose()** – `(ws) => void` – connection closed.
- **@WsDrain()** – `(ws, code, reason) => void` – backpressure drain.

## API

- **createApp(RootModule, options?)** – Builds module graph, DI container, and Elysia app; returns `{ getElysia(), init(), destroy(), listen(port?, host?) }`.
  - **options.openapiPath** – If set (e.g. `"/api/docs"`), enables [OpenAPI](https://elysiajs.com/plugins/openapi.html) docs at that path; spec JSON at `{openapiPath}/json`.
  - **options.globalGuards** – Guard classes applied to every non-`@Public()` route.
  - **options.globalInterceptors** – Interceptor classes applied to every route.
  - **options.globalExceptionFilters** – Exception filter classes; run in Elysia’s **`onError`** (app-level), so they handle all errors including validation and not-found.
  - **options.openapiSecurityScheme** – Name (e.g. `"bearerAuth"`) so non-public routes show a lock in OpenAPI docs.
- **app.getElysia()** – Raw Elysia instance (e.g. for tests or `.use()`).
- **app.init()** – Async; runs `onModuleInit()` on all providers. Call before `listen()` if you use it.
- **app.destroy()** – Async; runs `onModuleDestroy()` on all providers (e.g. on SIGTERM).
- **app.listen(port?, host?)** – Starts the server (default port 3000, host `0.0.0.0`).

## Example and tests

```bash
bun run example
bun test
```

## Limitations

- No circular dependency resolution in the DI container.
- Body/query validation is per-route via `@Body(schema)` / `@Query(schema)` (Elysia `t` schemas).
