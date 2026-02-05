# Project structure

Organized Nest-style layout for the elysia-nest app.

```
elysia-nest/
├── .cursor/                 # Cursor rules and Memory Bank commands
├── memory-bank/             # Memory Bank (tasks, context, progress)
├── prisma/
│   ├── schema.prisma
│   └── ...
├── src/
│   ├── main.ts              # Entry point
│   ├── app.module.ts        # Root module
│   │
│   ├── config/              # Configuration
│   │   ├── db.config.ts
│   │   └── env.config.ts
│   │
│   ├── core/                # Framework kernel (elysia-nest)
│   │   ├── bootstrap.ts
│   │   ├── container.ts
│   │   ├── decorators/
│   │   ├── elysia-adapter.ts
│   │   ├── http-exceptions.ts
│   │   ├── logger/
│   │   └── index.ts
│   │
│   ├── common/              # App-wide shared code
│   │   ├── filters/          # Exception filters
│   │   ├── guards/           # Auth/authorization guards
│   │   ├── interceptors/     # Logging, etc.
│   │   ├── mappers/          # Response mappers
│   │   ├── services/         # Shared services
│   │   └── index.ts         # Barrel exports
│   │
│   └── modules/             # Feature modules
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   ├── auth.module.ts
│       │   ├── auth.schema.ts
│       │   └── auth.service.ts
│       └── user/
│           ├── user.controller.ts
│           ├── user.module.ts
│           ├── user.schema.ts
│           └── user.service.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

## Conventions

- **`core/`** – Framework code only. No app-specific logic.
- **`common/`** – Shared across the app: filters, guards, interceptors, mappers, services. Import via `@/common` or `@/common/guards/auth.guard`, etc.
- **`modules/`** – One folder per feature (auth, user). Each typically has `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts`.
- **Path alias** – `@/*` → `src/*` (see `tsconfig.json`).
