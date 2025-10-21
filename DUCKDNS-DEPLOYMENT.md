# AV-RENTALS Docker Deployment with DuckDNS

This guide helps you deploy your AV-RENTALS application using Docker with DuckDNS for domain management and SSL certificates.

## Prerequisites

1. **Docker & Docker Compose** installed on your server
2. **DuckDNS account** and token from https://www.duckdns.org/
3. **Domain configured** to point to your server's IP
4. **Ports 80 and 443** open on your server/router

## Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd AV-RENTALS
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

**Required settings in .env:**
- `DUCKDNS_TOKEN`: f0027691-1f98-4a3e-9f26-94020479451e
- `SSL_EMAIL`: felizartpt@gmail.com
- `SSL_EMAIL`: Your email for SSL certificates
- `JWT_SECRET`: Random secure string
- `NEXTAUTH_SECRET`: Random secure string

### 3. Deploy with One Command
```bash
./deploy-duckdns.sh
```

This script will:
- ✅ Check prerequisites
- ✅ Update your DuckDNS IP
- ✅ Build the Docker image
- ✅ Setup SSL certificates (optional)
- ✅ Start all services
- ✅ Perform health checks

## Manual Steps (Alternative)

If you prefer manual deployment:

### 1. Update DuckDNS IP
```bash
curl "https://www.duckdns.org/update?domains=acrobaticzrental&token=YOUR_TOKEN&ip="
```

### 2. Setup SSL Certificates
```bash
./setup-duckdns-ssl.sh
```

### 3. Start Services
```bash
docker-compose up -d
```

## Services Overview

Your deployment includes:

- **av-rentals**: Main Next.js application (port 3000)
- **nginx**: Reverse proxy with SSL (ports 80, 443)
- **certbot**: SSL certificate management
- **redis**: Session storage (optional, port 6379)

## Access Your Application

- **HTTP**: http://localhost:3000 (local access)
- **HTTPS**: https://acrobaticzrental.duckdns.org (public access)

## Useful Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f av-rentals
docker-compose logs -f nginx

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update application
git pull
docker-compose build
docker-compose up -d

# Backup database
docker exec av-rentals npm run backup

# Check SSL certificates
docker run --rm -v "$(pwd)/certbot/conf:/etc/letsencrypt" certbot/certbot certificates
```

## Troubleshooting

### SSL Certificate Issues
```bash
# Check if domain resolves correctly
nslookup acrobaticzrental.duckdns.org

# Manually renew certificates
docker run --rm -v "$(pwd)/certbot/conf:/etc/letsencrypt" -v "$(pwd)/certbot/www:/var/www/certbot" certbot/certbot renew

# Check nginx configuration
docker-compose exec nginx nginx -t
```

### Application Issues
```bash
# Check application health
curl http://localhost:3000

# Check database
docker-compose exec av-rentals npx prisma studio

# Reset database (⚠️ DESTRUCTIVE)
docker-compose exec av-rentals npm run db:reset
```

### DuckDNS Issues
```bash
# Check current IP
curl -s http://checkip.amazonaws.com/

# Check domain resolution
dig +short acrobaticzrental.duckdns.org

# Update DuckDNS manually
curl "https://www.duckdns.org/update?domains=acrobaticzrental&token=YOUR_TOKEN&ip="
```

## Security Notes

1. **Change default secrets** in .env file
2. **Keep DuckDNS token secure** - don't commit to version control
3. **Regular updates** - run `git pull && docker-compose build && docker-compose up -d`
4. **Backup regularly** - use `npm run backup` command
5. **Monitor logs** - check for suspicious activity

## File Structure

```
├── deploy-duckdns.sh          # Main deployment script
├── setup-duckdns-ssl.sh       # SSL setup script
├── docker-compose.yml         # Docker services configuration
├── Dockerfile                 # Application container
├── nginx.conf                 # Nginx configuration
├── .env.example               # Environment template
└── certbot/                   # SSL certificates directory
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure DuckDNS domain is correctly configured
4. Check firewall settings (ports 80, 443)
5. Verify Docker and Docker Compose versions