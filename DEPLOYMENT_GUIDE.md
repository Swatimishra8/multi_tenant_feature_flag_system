# Deployment Guide - Multi-Tenant Feature Flag Management System

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Super Admin   │    │  Org Admin      │    │   End User      │
│   Frontend      │    │  Frontend       │    │   Frontend      │
│   (Port 3000)   │    │  (Port 3002)    │    │  (Port 3003)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │    Backend API Server   │
                    │    (Node.js/Express)    │
                    │      Port 3001          │
                    └─────────────┬───────────┘
                                  │
                    ┌─────────────┴───────────┐
                    │     SQLite Database     │
                    │   (backend/database.db) │
                    └─────────────────────────┘
```

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Modern web browser
- Terminal/Command prompt

## Local Development Setup

### 1. Clone and Setup
```bash
# Navigate to project directory
cd multi_tenant_feature_flag_system

# Install backend dependencies
cd backend
npm install

# Install Super Admin frontend dependencies  
cd ../frontend/super-admin
npm install

# Install Org Admin frontend dependencies
cd ../org-admin  
npm install

# Install End User frontend dependencies
cd ../user
npm install
```

### 2. Configuration

**Backend Configuration (.env):**
```bash
cd backend
# Edit .env file if needed
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_in_production
DB_PATH=./database.sqlite
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=admin123
```

### 3. Start Services

**Option A: Manual Start (Recommended for Development)**
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Super Admin Frontend
cd frontend/super-admin  
npm run dev

# Terminal 3: Start Org Admin Frontend
cd frontend/org-admin
npm run dev

# Terminal 4: Start End User Frontend
cd frontend/user
npm run dev
```

**Option B: Using Screen/Tmux (Linux/Mac)**
```bash
# Start all services in background
screen -dmS backend bash -c 'cd backend && npm run dev'
screen -dmS super-admin bash -c 'cd frontend/super-admin && npm run dev'  
screen -dmS org-admin bash -c 'cd frontend/org-admin && npm run dev'
screen -dmS user bash -c 'cd frontend/user && npm run dev'

# List running screens
screen -ls

# Attach to a screen
screen -r backend
```

## Production Deployment

### Backend Deployment

**Option 1: PM2 (Recommended)**
```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start server.js --name "feature-flag-backend"

# Configure auto-restart
pm2 startup
pm2 save
```

**Option 2: Docker**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["npm", "start"]
```

```bash
# Build and run
cd backend
docker build -t feature-flag-backend .
docker run -d -p 3001:3001 --name backend feature-flag-backend
```

### Frontend Deployment

**Build Production Assets:**
```bash
# Build Super Admin
cd frontend/super-admin
npm run build

# Build Org Admin  
cd ../org-admin
npm run build

# Build End User
cd ../user
npm run build
```

**Serve with Nginx:**
```nginx
# /etc/nginx/sites-available/feature-flags
server {
    listen 80;
    server_name your-domain.com;

    # Super Admin
    location /admin {
        alias /path/to/frontend/super-admin/dist;
        try_files $uri $uri/ /index.html;
    }

    # Org Admin
    location /org {
        alias /path/to/frontend/org-admin/dist;  
        try_files $uri $uri/ /index.html;
    }

    # End User
    location / {
        alias /path/to/frontend/user/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Serve with Apache:**
```apache
# /etc/apache2/sites-available/feature-flags.conf
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html
    
    # Super Admin
    Alias /admin /path/to/frontend/super-admin/dist
    <Directory "/path/to/frontend/super-admin/dist">
        FallbackResource /admin/index.html
    </Directory>
    
    # Org Admin  
    Alias /org /path/to/frontend/org-admin/dist
    <Directory "/path/to/frontend/org-admin/dist">
        FallbackResource /org/index.html
    </Directory>
    
    # End User
    <Directory "/path/to/frontend/user/dist">
        FallbackResource /index.html
    </Directory>
    
    # API Proxy
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api
</VirtualHost>
```

## Database Management

### SQLite (Development)
```bash
# Backup database
cp backend/database.sqlite backend/database.backup.sqlite

# View database
cd backend  
sqlite3 database.sqlite
.tables
.quit
```

### PostgreSQL (Production)
```sql
-- Create database
CREATE DATABASE feature_flags;
CREATE USER flag_admin WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE feature_flags TO flag_admin;
```

**Update Backend for PostgreSQL:**
```javascript
// backend/config/database.js (PostgreSQL version)
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});
```

## Environment Variables

### Development (.env)
```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=dev_secret_key
DB_PATH=./database.sqlite
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=admin123
```

### Production (.env.production)
```bash
PORT=3001
NODE_ENV=production
JWT_SECRET=your_very_long_random_secret_key_here
DB_HOST=localhost
DB_NAME=feature_flags
DB_USER=flag_admin
DB_PASSWORD=secure_password
DB_PORT=5432
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=secure_admin_password
```

## Security Considerations

### Production Security
1. **Change Default Credentials:**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32
   ```

2. **JWT Secret:**
   ```bash  
   # Generate secure JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **HTTPS Configuration:**
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       # ... rest of config
   }
   ```

4. **CORS Configuration:**
   ```javascript
   // backend/server.js
   app.use(cors({
     origin: [
       'https://your-domain.com',
       'https://admin.your-domain.com',
       'https://org.your-domain.com'
     ],
     credentials: true
   }));
   ```

### Firewall Rules
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP  
ufw allow 443   # HTTPS
ufw deny 3001   # Block direct backend access
```

## Monitoring & Logging

### PM2 Monitoring
```bash
# View logs
pm2 logs feature-flag-backend

# Monitor resources
pm2 monit

# Restart on file changes (development)
pm2 start server.js --watch --name "feature-flag-backend"
```

### Log Rotation
```javascript
// backend/server.js - Add logging middleware
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Setup log rotation
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'), 
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));
```

## Backup Strategy

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/feature-flags"
DB_PATH="/path/to/backend/database.sqlite"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH "$BACKUP_DIR/database_$DATE.sqlite"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "database_*.sqlite" -mtime +7 -delete

echo "Backup completed: database_$DATE.sqlite"
```

```bash
# Add to crontab for daily backups at 2 AM
crontab -e
0 2 * * * /path/to/backup.sh
```

## Scaling Considerations

### Load Balancing (Nginx)
```nginx
upstream backend {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

location /api {
    proxy_pass http://backend;
}
```

### Redis Caching
```javascript
// backend/middleware/cache.js
const redis = require('redis');
const client = redis.createClient();

const cacheFeatureFlag = async (req, res, next) => {
  const key = `flag:${req.body.organizationName}:${req.body.featureKey}`;
  const cached = await client.get(key);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Continue to database lookup
  next();
};
```

## Health Checks

### Basic Health Check
```bash
# Test backend health
curl http://localhost:3001/health

# Test with monitoring
curl -f http://localhost:3001/health || systemctl restart feature-flag-backend
```

### Comprehensive Health Check
```javascript
// backend/routes/health.js
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check database
  try {
    await db.get('SELECT 1');
    health.services.database = 'OK';
  } catch (error) {
    health.services.database = 'ERROR';
    health.status = 'ERROR';
  }

  res.json(health);
});
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in vite.config.js
2. **CORS errors**: Update backend CORS configuration  
3. **Database locks**: Restart backend service
4. **Build failures**: Clear node_modules and reinstall

### Debug Mode
```bash
# Start backend with debug logging
DEBUG=* npm run dev

# Start with specific debug namespace
DEBUG=app:* npm run dev
```

This deployment guide provides comprehensive instructions for taking the feature flag system from development to production, including security, monitoring, and scaling considerations.