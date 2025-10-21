# AV-RENTALS Production Deployment Guide

<div align="center">
  <img src="https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/SSL-Enabled-green?style=for-the-badge&logo=letsencrypt" alt="SSL">
  <img src="https://img.shields.io/badge/Nginx-Configured-brightgreen?style=for-the-badge&logo=nginx" alt="Nginx">
  <img src="https://img.shields.io/badge/Auto_Backup-3_Day_Rotation-orange?style=for-the-badge" alt="Backup">
</div>

<br />

This comprehensive guide will help you deploy your AV-RENTALS platform to production with enterprise-grade features including SSL certificates, automated backups, monitoring, and your Duck DNS domain `acrobaticzrental.duckdns.org`.

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Quick Deployment](#-quick-deployment)
- [Detailed Setup](#-detailed-setup)
- [SSL Configuration](#-ssl-configuration)
- [Database Management](#-database-management)
- [Monitoring & Maintenance](#-monitoring--maintenance)
- [Troubleshooting](#-troubleshooting)
- [Security Best Practices](#-security-best-practices)

## 📋 Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 20GB available space minimum
- **Network**: Public IP address with ports 80 and 443 accessible
- **Domain**: `acrobaticzrental.duckdns.org` configured to point to your server

### Required Software

- **Docker**: Version 20.10+ 
- **Docker Compose**: Version 2.0+
- **Git**: For repository cloning
- **Curl**: For health checks and SSL certificate management

### Network Configuration

- **Port 80**: HTTP traffic (redirects to HTTPS)
- **Port 443**: HTTPS traffic  
- **Port 22**: SSH access (change default port for security)
- **Firewall**: UFW or iptables configured properly

## 🚀 Quick Deployment

### One-Command Deployment

For experienced users, use our automated deployment script:

```bash
# Clone repository and run deployment
git clone https://github.com/felicianopt99/AV-RENTALS.git
cd AV-RENTALS
./deploy-duckdns.sh acrobaticzrental.duckdns.org your-email@domain.com
```

This script will:
- ✅ Install Docker and Docker Compose
- ✅ Configure environment variables
- ✅ Set up SSL certificates via Let's Encrypt  
- ✅ Deploy with nginx reverse proxy
- ✅ Configure automated backups
- ✅ Set up log rotation and monitoring

## 🛠️ Detailed Setup

### Step 1: Server Preparation

#### Install Docker and Docker Compose

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version

# Logout and login to apply group changes
```

#### Configure Firewall

```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow essential ports
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status verbose
```

### Step 2: Domain Configuration

#### Configure Duck DNS

1. **Visit Duck DNS**: Go to [https://www.duckdns.org/](https://www.duckdns.org/)
2. **Login**: Use your preferred authentication method
3. **Configure Domain**: Set `acrobaticzrental` to point to your server's public IP
4. **Verify Configuration**:
   ```bash
   # Test DNS resolution
   dig acrobaticzrental.duckdns.org
   nslookup acrobaticzrental.duckdns.org
   
   # Should return your server's IP address
   ```

### Step 3: Application Setup

#### Clone Repository

```bash
# Navigate to your desired directory
cd /opt

# Clone the repository
sudo git clone https://github.com/felicianopt99/AV-RENTALS.git
sudo chown -R $USER:$USER AV-RENTALS
cd AV-RENTALS
```

#### Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Production Environment Variables:**

```env
# Database Configuration
DATABASE_URL="file:./prisma/prod.db"

# Application Security
JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Application URLs
NEXT_PUBLIC_APP_URL="https://acrobaticzrental.duckdns.org"
NEXTAUTH_URL="https://acrobaticzrental.duckdns.org"

# Production Settings
NODE_ENV="production"

# SSL Configuration (for certbot)
SSL_EMAIL="your-email@domain.com"
DOMAIN="acrobaticzrental.duckdns.org"

# Backup Configuration
BACKUP_RETENTION_DAYS=7
BACKUP_SCHEDULE="0 2 * * *"

# Optional: AI Features
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key-if-needed"

# Database Backup Settings
BACKUP_DIR="/opt/AV-RENTALS/backups"
BACKUP_MAX_FILES=21
```

### Step 4: SSL Certificate Setup

#### Automatic SSL with Let's Encrypt

```bash
# Run the automated SSL setup script
chmod +x setup-duckdns-ssl.sh
./setup-duckdns-ssl.sh acrobaticzrental.duckdns.org your-email@domain.com
```

#### Manual SSL Configuration

```bash
# Create certbot directories
sudo mkdir -p certbot/conf certbot/www

# Generate SSL certificate
sudo docker run --rm \
  -v "${PWD}/certbot/conf:/etc/letsencrypt" \
  -v "${PWD}/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@domain.com \
  --agree-tos \
  --no-eff-email \
  -d acrobaticzrental.duckdns.org

# Set up automatic renewal
echo "0 0,12 * * * root sleep 1800 && docker run --rm -v '${PWD}/certbot/conf:/etc/letsencrypt' -v '${PWD}/certbot/www:/var/www/certbot' certbot/certbot renew --webroot --webroot-path=/var/www/certbot" | sudo tee -a /etc/crontab
```

### Step 5: Deploy Application

#### Build and Start Services

```bash
# Build the application with production optimizations
./scripts/build-with-cache.sh

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
docker-compose logs av-rentals
```

#### Initialize Database

```bash
# Run database migrations and seeding
docker-compose exec av-rentals npm run db:push
docker-compose exec av-rentals npm run db:seed

# Verify database initialization
docker-compose exec av-rentals npm run db:studio
```

Required changes:
```env
# Security (Generate strong secrets)
JWT_SECRET=your-super-secure-jwt-secret-here
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-here

# Database
DATABASE_URL="file:./dev.db"

# Email (for notifications)
EMAIL_FROM=noreply@acrobaticzrental.duckdns.org
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password

# Domain (already configured)
NEXTAUTH_URL=https://acrobaticzrental.duckdns.org
```

### Step 3: One-Command SSL Deployment

Run the automated SSL setup script:

```bash
chmod +x setup-ssl.sh
./setup-ssl.sh
```

The script will:
1. ✅ Check your DNS configuration
2. 🔧 Create necessary directories
3. 🔒 Obtain SSL certificates from Let's Encrypt
4. 🚀 Start your application with HTTPS
5. 🧪 Test the SSL connection

**That's it!** Your application will be available at `https://acrobaticzrental.duckdns.org`

## 🔧 Manual Deployment (Alternative)

If you prefer manual control:

### Step 1: Prepare SSL Certificates

```bash
# Create directories
mkdir -p ./certbot/conf ./certbot/www

# Get certificates manually
docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d acrobaticzrental.duckdns.org
```

### Step 2: Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps
```

## 📊 Post-Deployment Setup

### 1. Access Your Application
- **Main Site**: `https://acrobaticzrental.duckdns.org`
- **Admin Panel**: `https://acrobaticzrental.duckdns.org/admin`

### 2. Initial Admin Setup
1. Register the first user (becomes admin automatically)
2. Navigate to Admin → Settings
3. Configure your company information
4. Test the backup system

### 3. Configure Backup System
Your 3-day rotation backup system is already configured:
- **Automatic**: Runs daily at 2 AM
- **Manual**: Available in Admin → Settings
- **Storage**: Only keeps 3 days (97% storage savings vs 30-day retention)

## 🔄 Backup System Overview

### Automatic 3-Day Rotation
```
Day 1: Creates backup-day1.sql
Day 2: Creates backup-day2.sql (day1 kept)
Day 3: Creates backup-day3.sql (day1,day2 kept)
Day 4: Overwrites backup-day1.sql (day2,day3 kept)
```

### Manual Backup Operations
```bash
# Manual backup
./backup-database.sh

# Restore from specific day
./restore-database.sh day2

# Check backup status
./health-check.sh
```

### Admin Panel Integration
- Real-time backup status
- One-click backup/restore
- Backup history and health monitoring
- Storage usage statistics

## 🛠️ Maintenance Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

### SSL Certificate Renewal
```bash
# Manual renewal (automatic renewal runs every 12 hours)
docker-compose exec certbot certbot renew
docker-compose restart nginx
```

### Database Operations
```bash
# Access database
docker-compose exec app npx prisma studio

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Reset database (CAUTION!)
docker-compose exec app npm run db:reset
```

## 🔧 Troubleshooting

### Common Issues

**1. SSL Certificate Issues**
```bash
# Check certificate status
./setup-ssl.sh --test-only

# Renew certificates
./setup-ssl.sh --renew
```

**2. Domain Not Resolving**
```bash
# Check DNS
dig acrobaticzrental.duckdns.org
nslookup acrobaticzrental.duckdns.org

# Update Duck DNS IP
curl "https://www.duckdns.org/update?domains=acrobaticzrental&token=YOUR_TOKEN&ip="
```

**3. Application Not Starting**
```bash
# Check service status
docker-compose ps

# View error logs
docker-compose logs app

# Restart services
docker-compose restart
```

**4. Backup System Issues**
```bash
# Check backup health
./health-check.sh

# Test backup manually
./backup-database.sh

# Check backup permissions
ls -la /home/home/backups/
```

### Log Locations
- **Application**: `docker-compose logs app`
- **Nginx**: `docker-compose logs nginx`
- **Backup**: `/home/home/backups/backup-logs/`
- **SSL**: `./certbot/logs/`

## 🔒 Security Checklist

- ✅ SSL certificates configured and auto-renewing
- ✅ Strong JWT and NextAuth secrets
- ✅ Database backups encrypted and rotated
- ✅ Nginx security headers configured
- ✅ Rate limiting enabled
- ✅ File upload restrictions in place
- ⚠️ Configure firewall (only ports 22, 80, 443)
- ⚠️ Set up monitoring and alerting
- ⚠️ Regular security updates

## 📈 Performance Optimization

### Recommended Server Specs
- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 100GB storage
- **Database**: SSD storage for better performance

### Monitoring
```bash
# Resource usage
docker stats

# Disk usage
df -h
du -sh /home/home/Acrobaticz/AV-RENTALS/

# Backup storage usage
du -sh /home/home/backups/
```

## 🆘 Support

If you encounter issues:

1. **Check logs**: `docker-compose logs -f`
2. **Verify DNS**: `dig acrobaticzrental.duckdns.org`
3. **Test SSL**: `curl -I https://acrobaticzrental.duckdns.org`
4. **Check backups**: `./health-check.sh`

## 🎉 Success!

Your AV-RENTALS platform is now running in production with:
- ✅ HTTPS via Let's Encrypt SSL
- ✅ 3-day rotating backup system
- ✅ Admin panel for management
- ✅ Auto-renewing certificates
- ✅ Production-ready configuration

Visit `https://acrobaticzrental.duckdns.org` to start using your platform!