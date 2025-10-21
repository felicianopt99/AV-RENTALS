#!/bin/bash

# DuckDNS SSL Setup Script for AV-RENTALS
# This script specifically handles DuckDNS domains with Let's Encrypt SSL

set -e

# Configuration
DOMAIN="acrobaticzrental.duckdns.org"
DUCKDNS_DOMAIN="acrobaticzrental"
EMAIL="${SSL_EMAIL:-admin@example.com}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[DUCKDNS-SSL]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env() {
    log "Checking environment variables..."
    
    if [ -z "$DUCKDNS_TOKEN" ]; then
        error "DUCKDNS_TOKEN environment variable is not set"
        error "Please set your DuckDNS token in .env file"
        exit 1
    fi
    
    if [ -z "$SSL_EMAIL" ]; then
        warning "SSL_EMAIL not set, using default: $EMAIL"
    else
        EMAIL="$SSL_EMAIL"
    fi
    
    log "✅ Environment variables checked"
}

# Update DuckDNS IP
update_duckdns() {
    log "Updating DuckDNS IP address..."
    
    local public_ip=$(curl -s http://checkip.amazonaws.com/ || curl -s https://ipinfo.io/ip)
    
    if [ -z "$public_ip" ]; then
        error "Failed to get public IP address"
        exit 1
    fi
    
    info "Current public IP: $public_ip"
    
    # Update DuckDNS
    local response=$(curl -s "https://www.duckdns.org/update?domains=$DUCKDNS_DOMAIN&token=$DUCKDNS_TOKEN&ip=$public_ip")
    
    if [ "$response" = "OK" ]; then
        log "✅ DuckDNS updated successfully"
    else
        error "Failed to update DuckDNS: $response"
        exit 1
    fi
    
    # Wait for DNS propagation
    info "Waiting for DNS propagation (30 seconds)..."
    sleep 30
}

# Verify DNS resolution
verify_dns() {
    log "Verifying DNS resolution..."
    
    local resolved_ip=$(dig +short $DOMAIN @8.8.8.8)
    local public_ip=$(curl -s http://checkip.amazonaws.com/)
    
    if [ -z "$resolved_ip" ]; then
        error "Domain $DOMAIN does not resolve"
        exit 1
    fi
    
    info "Domain resolves to: $resolved_ip"
    info "Your public IP: $public_ip"
    
    if [ "$resolved_ip" != "$public_ip" ]; then
        warning "DNS not fully propagated yet, but continuing..."
    else
        log "✅ DNS resolution correct"
    fi
}

# Setup SSL directories
setup_ssl_dirs() {
    log "Setting up SSL certificate directories..."
    
    mkdir -p ./certbot/conf
    mkdir -p ./certbot/www
    mkdir -p ./nginx/logs
    
    # Set proper permissions
    chmod 755 ./certbot/conf
    chmod 755 ./certbot/www
    
    log "✅ SSL directories created"
}

# Stop any running containers
cleanup_containers() {
    log "Cleaning up existing containers..."
    
    docker-compose down 2>/dev/null || true
    docker rm -f nginx-temp 2>/dev/null || true
    
    log "✅ Cleanup completed"
}

# Create temporary nginx for ACME challenge
create_temp_nginx() {
    log "Creating temporary nginx for ACME challenge..."
    
    cat > ./nginx-acme.conf << EOF
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name $DOMAIN;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
            try_files \$uri =404;
        }
        
        location / {
            return 200 'ACME Challenge Server Ready for $DOMAIN';
            add_header Content-Type text/plain;
        }
    }
}
EOF

    # Start temporary nginx
    docker run -d --name nginx-acme \
        -p 80:80 \
        -v "$(pwd)/nginx-acme.conf:/etc/nginx/nginx.conf:ro" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        nginx:alpine
        
    log "✅ Temporary nginx started"
}

# Obtain SSL certificates
obtain_ssl() {
    log "Obtaining SSL certificates for $DOMAIN..."
    
    # Run certbot
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d "$DOMAIN"
    
    if [ $? -eq 0 ]; then
        log "✅ SSL certificates obtained successfully"
    else
        error "Failed to obtain SSL certificates"
        exit 1
    fi
}

# Cleanup temporary nginx
cleanup_temp_nginx() {
    log "Cleaning up temporary nginx..."
    
    docker rm -f nginx-acme 2>/dev/null || true
    rm -f ./nginx-acme.conf
    
    log "✅ Temporary nginx cleaned up"
}

# Test SSL certificates
test_ssl() {
    log "Testing SSL certificates..."
    
    if [ -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ] && [ -f "./certbot/conf/live/$DOMAIN/privkey.pem" ]; then
        log "✅ SSL certificates found and ready"
        
        # Show certificate info
        info "Certificate details:"
        docker run --rm \
            -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
            certbot/certbot certificates | grep -A 5 "$DOMAIN" || true
    else
        error "SSL certificates not found"
        exit 1
    fi
}

# Main execution
main() {
    log "Starting DuckDNS SSL setup for $DOMAIN"
    
    check_env
    cleanup_containers
    update_duckdns
    verify_dns
    setup_ssl_dirs
    create_temp_nginx
    
    # Wait a bit for nginx to start
    sleep 5
    
    obtain_ssl
    cleanup_temp_nginx
    test_ssl
    
    log "🎉 SSL setup completed successfully!"
    info "Your SSL certificates are ready for $DOMAIN"
    info "You can now start your application with: docker-compose up -d"
}

# Run main function
main "$@"