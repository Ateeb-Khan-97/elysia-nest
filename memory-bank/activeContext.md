# Active Context

## Current focus
- **Phase:** BUILD complete
- **Task:** SSE by generator detection (task 002) – no decorator; any method can stream SSE
- **Next:** `/reflect` then `/archive`, or `/van [next task]`

## What was done
- **Core:** `isGeneratorFunction()` helper in elysia-adapter; for routes whose handler is a generator, adapter uses an async generator wrapper that yields `sse(value)` and registers it with the same HTTP method (get/post/put/patch/delete). Removed `@Sse` decorator and `decorators/sse.ts`; removed `isSse` from RouteMetadata.
- **App:** EventsController uses `@Get('stream')` and `@Post('stream')` with generator methods; README documents “generator = SSE” for any method.

## Platform
- Windows (win32)

---
*Updated by VAN/BUILD.*
