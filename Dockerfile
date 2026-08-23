# Multi-stage Dockerfile for Krishiv Corporation E-Commerce
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and sub-project package files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm run postinstall

# Copy source files
COPY backend ./backend
COPY frontend ./frontend

# Build frontend production bundle
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package.json ./
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["node", "backend/server.js"]
