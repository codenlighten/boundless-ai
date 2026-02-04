FROM node:20-alpine

RUN apk add --no-cache git curl openssh-client bash dumb-init

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN mkdir -p sessions auditlogs

ENV NODE_ENV=production
ENV CHAT_PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "server.js"]
