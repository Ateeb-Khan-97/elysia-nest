# Memory Bank – Tasks

## Platform
- **OS:** Windows (win32)
- **Path separator:** `\` (commands adapted for Windows)

## Current Task
- **Status:** COMPLETE
- **Task ID:** 002
- **Description:** SSE by handler shape only: if a controller handler is a generator, whatever it yields is sent as SSE (any HTTP method). No @Sse decorator.
- **Complexity level:** 2

### Summary
- Removed `@Sse` decorator and `RouteMetadata.isSse`. Adapter now detects generator handlers via `isGeneratorFunction(method)` and wraps them in an async generator that yields `sse(value)` for each value. Same route method (GET, POST, etc.) is preserved, so e.g. POST endpoints can stream SSE.
- EventsController: `@Get('stream')` and `@Post('stream')` both use generator methods; README updated to describe generator-based SSE for any method.

## Next step
- Run `/reflect` then `/archive`, or `/van [next task]`.

---
*This file is the source of truth for task tracking.*
