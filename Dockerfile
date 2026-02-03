# Multi-stage build for Boundless AI Server
# Stage 1: Base image with dependencies
FROM node:20-alpine as base

# Install system dependencies for terminal execution and git operations
RUN apk add --no-cache \
    git \
    curl \
    openssh-client \
    bash \
    dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Runtime image
FROM node:20-alpine

# Install runtime dependencies only
RUN apk add --no-cache \
    git \
    curl \
    openssh-client \
    bash \
    dumb-init

WORKDIR /app

# Copy node_modules from base stage
COPY --from=base /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create necessary directories for sessions and audit logs
RUN mkdir -p sessions auditlogs && \
    chmod 755 sessions auditlogs

# Set environment defaults (can be overridden via CapRover)
ENV NODE_ENV=production
ENV CHAT_PORT=3001
ENV DISABLE_COMMAND_WHITELIST=true

# Expose the API port
EXPOSE 3001

# Health check - verify server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly for graceful shutdown
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start the unified server
CMD ["node", "server.js"]
