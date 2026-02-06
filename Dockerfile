# Elysia production image: compile to binary then run on distroless.
# See https://elysiajs.com/patterns/deploy

FROM oven/bun AS build

WORKDIR /app

# Cache dependency installation
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Prisma client (required for bundle)
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN bunx prisma generate

# Source and build
COPY src ./src
COPY tsconfig.json ./

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	src/main.ts

# Minimal runtime image
FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

EXPOSE 5000

CMD ["./server"]
