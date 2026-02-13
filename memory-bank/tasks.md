# Memory Bank – Tasks

## Platform
- **OS:** Windows (win32)
- **Path separator:** `\` (commands adapted for Windows)

## Current Task
- **Status:** COMPLETE
- **Task ID:** 004
- **Description:** LoggingInterceptor should log validation/not-found errors and log each route with status code.
- **Complexity level:** 1

### Summary
- **LoggingInterceptor:** Logs status code on every request: from handler result (Response.status) or 200, and on error from HttpException.statusCode or 500. Format: `METHOD path STATUS +ms` / `METHOD path STATUS +ms (error)`.
- **Adapter onError:** When globalInterceptors are set (e.g. LoggingInterceptor), register onError and log method, path, and status for all errors (validation, 404, handler errors) so they appear in the same log stream; status from filter response or 500.

## Next step
- Run `/reflect` then `/archive`, or `/van [next task]`.

---
*This file is the source of truth for task tracking.*
