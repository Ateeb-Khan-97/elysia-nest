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

## Decorators

| Decorator       | Scope    | Purpose                                      |
|----------------|----------|----------------------------------------------|
| `@Module(...)` | Class    | Declare imports, controllers, providers, exports |
| `@Controller(path?)` | Class | Route prefix for this controller             |
| `@Get(path?)`, `@Post(path?)`, `@Put(path?)`, `@Patch(path?)`, `@Delete(path?)` | Method | HTTP method + path |
| `@Injectable()` | Class  | Register as provider (DI)                    |
| `@Body()`, `@Param(key?)`, `@Query(key?)`, `@Headers(key?)` | Parameter | Bind handler args from context |
| `@WebSocket(path?)` | Class | WebSocket gateway; path is combined with `@Controller()` path |
| `@WsOpen()`, `@WsMessage()`, `@WsClose()`, `@WsDrain()` | Method | WebSocket lifecycle handlers (open, message, close, drain) |

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

- **createApp(RootModule, options?)** – Builds module graph, DI container, and Elysia app; returns `{ getElysia(), listen(port?, host?) }`.
  - **options.openapiPath** – If set (e.g. `"/api/docs"`), enables [OpenAPI](https://elysiajs.com/plugins/openapi.html) docs at that path; spec JSON at `{openapiPath}/json`.
- **app.getElysia()** – Raw Elysia instance (e.g. for tests or `.use()`).
- **app.listen(port?, host?)** – Starts the server (default port 3000, host `0.0.0.0`).

## Example and tests

```bash
bun run example
bun test
```

## Limitations (v1)

- No guards, interceptors, or pipes (can be added via Elysia’s `onBeforeHandle` / `onAfterHandle`).
- No circular dependency resolution.
- No built-in validation (optional Elysia `t` schema per route can be added later).
