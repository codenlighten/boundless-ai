# MemoryChatbot Deployment Guide

## CapRover Deployment

### Prerequisites
- CapRover instance running
- CapRover CLI installed: `npm install -g caprover`

### Environment Variables to Set in CapRover

Configure these in your CapRover app settings:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_DEFAULT_TEMPERATURE=0.7
PORT=80
NODE_ENV=production
```

### Deploy Steps

1. **Login to CapRover:**
   ```bash
   caprover login
   ```

2. **Initialize app (first time only):**
   ```bash
   caprover deploy
   ```
   - Select your CapRover instance
   - Choose or create an app name (e.g., `memorychatbot`)

3. **Deploy updates:**
   ```bash
   caprover deploy
   ```

### CapRover Configuration

The app includes:
- `captain-definition` - Tells CapRover to use Dockerfile
- `Dockerfile` - Defines the container build
- Health check at `/health` endpoint
- Automatic container restart on failure

### Port Configuration

- Container exposes port 3000 internally
- CapRover maps it to port 80 externally
- Access via: `https://memorychatbot.your-domain.com`

### Persistent Storage

For persistent sessions across container restarts, configure a volume in CapRover:

1. Go to your app settings in CapRover
2. Add Persistent Directory: `/app/sessions`
3. This preserves conversation data between deployments

## Docker Deployment (Manual)

### Build Image
```bash
docker build -t memorychatbot .
```

### Run Container
```bash
docker run -d \
  --name memorychatbot \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your-key \
  -e OPENAI_DEFAULT_MODEL=gpt-4o-mini \
  -e OPENAI_DEFAULT_TEMPERATURE=0.7 \
  -v $(pwd)/sessions:/app/sessions \
  memorychatbot
```

### Check Logs
```bash
docker logs -f memorychatbot
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  memorychatbot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_DEFAULT_MODEL=gpt-4o-mini
      - OPENAI_DEFAULT_TEMPERATURE=0.7
      - NODE_ENV=production
    volumes:
      - ./sessions:/app/sessions
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

## Monitoring

### Health Endpoint
```bash
curl https://your-app.caprover.domain/health
```

### CapRover Logs
View in CapRover dashboard or:
```bash
caprover logs --app memorychatbot
```

## Scaling

In CapRover dashboard:
1. Go to your app settings
2. Increase "Instance Count"
3. Note: Session files are local to each instance
4. For multi-instance, use external session storage (Redis, MongoDB)

## Troubleshooting

### Container won't start
- Check logs: `caprover logs --app memorychatbot`
- Verify environment variables are set
- Ensure OpenAI API key is valid

### Out of memory
- Increase memory limit in CapRover app settings
- Default: 512MB, recommended: 1GB+

### Sessions not persisting
- Configure persistent directory in CapRover
- Path: `/app/sessions`
