# Tech context

## Stack
- **Runtime:** Bun (not Node; see `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc`)
- **HTTP:** Elysia
- **DB/ORM:** Prisma (PostgreSQL adapter)
- **Auth:** jose (JWT)
- **Validation:** Zod
- **API docs:** @elysiajs/openapi

## Structure
- `src/main.ts` – Application entry point.
- `src/app.module.ts` – Root module (imports feature modules, global providers).
- `src/config/` – Configuration (env, DB).
- `src/core/` – Framework kernel: bootstrap, container, decorators, Elysia adapter, logger, http-exceptions (do not put app logic here).
- `src/common/` – App-wide shared code:
  - `common/filters/` – Exception filters (e.g. GlobalExceptionFilter).
  - `common/guards/` – Auth/authorization guards.
  - `common/interceptors/` – Request/response interceptors (e.g. LoggingInterceptor).
  - `common/mappers/` – Response helpers (e.g. ResponseMapper).
  - `common/services/` – Shared injectable services (e.g. CommonService).
  - `common/index.ts` – Barrel exports for `@/common`.
- `src/modules/` – Feature modules (auth, user); each has controller, service, module, schema.
- `prisma/` – Schema and Prisma config.

## Conventions
- Use **Bun** for install, run, and test (no npm/pnpm/node for scripts).
- Decorator-based controllers and DI; Elysia handles HTTP.
