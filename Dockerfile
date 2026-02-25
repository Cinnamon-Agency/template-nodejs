# --- Build stage ---
FROM node:22 AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# --- Production stage ---
FROM node:22-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled output from builder
COPY --from=builder /usr/src/app/build ./build

# Copy Prisma schema for runtime client
COPY --from=builder /usr/src/app/prisma ./prisma

# Generate Prisma client in production image
RUN npx prisma generate

# Set the NODE_OPTIONS environment variable
ENV NODE_OPTIONS="--max-old-space-size=3072"

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
