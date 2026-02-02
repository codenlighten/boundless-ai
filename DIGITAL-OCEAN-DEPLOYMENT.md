# Deploying TerminalChatbot to Digital Ocean

## Prerequisites

- Digital Ocean account with a droplet
- SSH access to droplet
- Node.js 20+ installed on droplet
- Git access to your repository

## Step 1: Create Digital Ocean Droplet

1. **Create new droplet:**
   - OS: Ubuntu 22.04 LTS
   - Size: Recommended minimum $6/month (1GB RAM)
   - Region: Choose closest to you
   - Enable IPv6

2. **SSH into droplet:**
   ```bash
   ssh root@your_droplet_ip
   ```

## Step 2: Install Dependencies

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Create app directory
mkdir -p /var/www/terminal-chatbot
cd /var/www/terminal-chatbot
```

## Step 3: Clone Application

```bash
# Clone from your repo (or copy files)
git clone https://github.com/yourusername/ai-verify.git .

# Or copy tarball
scp memorychatbot-v1.0.0-*.tar.gz root@your_droplet_ip:/var/www/terminal-chatbot/
tar -xzf memorychatbot-v1.0.0-*.tar.gz
```

## Step 4: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
OPENAI_API_KEY=your-openai-key
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_DEFAULT_TEMPERATURE=0.7

# Terminal Server
TERMINAL_PORT=3002
TERMINAL_API_KEY=your-very-secure-random-key-here
NODE_ENV=production
EOF

# Restrict permissions
chmod 600 .env
```

## Step 5: Install Application

```bash
npm install --production
```

## Step 6: Setup PM2

```bash
# Start with PM2
pm2 start terminal-server.js --name "terminal-chatbot"

# Save PM2 config
pm2 save

# Enable startup on reboot
pm2 startup
# Follow the output instructions to finalize
```

## Step 7: Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx config
cat > /etc/nginx/sites-available/terminal-chatbot << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/terminal-chatbot /etc/nginx/sites-enabled/

# Test Nginx
nginx -t

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

## Step 8: Setup SSL with Let's Encrypt

```bash
# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renew
certbot renew --dry-run
```

## Step 9: Setup Firewall

```bash
# Enable UFW
ufw enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Verify
ufw status
```

## Step 10: Monitor and Logs

```bash
# View PM2 logs
pm2 logs terminal-chatbot

# Monitor status
pm2 monit

# Real-time monitoring
pm2 dashboard
```

## Usage from Local Machine

### Test Connection
```bash
curl https://your-domain.com/health
```

### Execute Commands
```bash
curl -X POST https://your-domain.com/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "sessionId": "user123",
    "command": "ls -la /var/www"
  }'
```

### Use RemoteAgent
```javascript
import { RemoteAgent } from './lib/remoteAgent.js';

const agent = new RemoteAgent(
  'https://your-domain.com',
  'your-api-key'
);

const result = await agent.executeCommand('ls -la');
console.log(result.stdout);
```

## Maintenance

### Update Application
```bash
cd /var/www/terminal-chatbot
git pull origin main
npm install --production
pm2 restart terminal-chatbot
```

### View Logs
```bash
pm2 logs terminal-chatbot --lines 100
```

### Backup Session Data
```bash
tar -czf sessions-backup-$(date +%Y%m%d).tar.gz sessions/
```

### Monitor Disk Usage
```bash
df -h
du -sh /var/www/terminal-chatbot
```

## Troubleshooting

### PM2 not starting
```bash
pm2 kill
pm2 start terminal-server.js --name "terminal-chatbot"
```

### Nginx not connecting
```bash
# Check if app is running
pm2 status

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

### SSL certificate issues
```bash
certbot renew --force-renewal
```

### Port already in use
```bash
lsof -i :3002
kill -9 <PID>
```

## Production Checklist

- [ ] Strong API key configured
- [ ] SSL certificate installed
- [ ] Firewall properly configured
- [ ] PM2 configured for auto-start
- [ ] Nginx reverse proxy working
- [ ] Backups scheduled
- [ ] Monitoring setup (PM2+, DataDog, etc)
- [ ] Rate limiting configured
- [ ] Command whitelist reviewed
- [ ] API logging enabled

## Support Commands

```bash
# Restart application
pm2 restart terminal-chatbot

# Stop application
pm2 stop terminal-chatbot

# View all processes
pm2 list

# View real-time metrics
pm2 monit
```

## Security Hardening

1. **Disable root login:**
   ```bash
   sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
   systemctl restart sshd
   ```

2. **Setup fail2ban:**
   ```bash
   apt-get install -y fail2ban
   systemctl start fail2ban
   ```

3. **Use strong SSH keys** (disable password auth)

4. **Regular updates:**
   ```bash
   apt-get update && apt-get upgrade -y
   ```
