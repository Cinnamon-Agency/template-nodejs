FROM node:20-alpine AS base

# https://nodejs.org/dist/latest-v20.x/docs/api/cli.html#--env-fileconfig
# If the same variable is defined in the environment and in the file, the value from the environment takes precedence.
ARG COMMIT_HASH
# If no COMMIT_HASH has been passed during run and/or build COMMIT_HASH will be "local"
ENV COMMIT_HASH=${COMMIT_HASH:-local}

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --prod; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm install --frozen-lockfile --prod; \
  elif [ -f package-lock.json ]; then npm ci --omit=dev; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY tsconfig.json .
COPY --from=deps /app/node_modules ./node_modules
COPY src src
COPY .env .env

RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

COPY --from=builder /app/build/. build/.
COPY --from=builder /app/node_modules ./node_modules
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY .env .env

USER node

EXPOSE 3000

ENV NODE_ENV production
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT [ "node", "-r", "dotenv/config", "build/server.js"]
