#!/bin/bash

# SSL Setup Script for acrobaticzrental.duckdns.org
# This script helps you obtain SSL certificates using Let's Encrypt

DOMAIN="acrobaticzrental.duckdns.org"
EMAIL="felizartpt@gmail.com"  # Your email for Let's Encrypt

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SSL-SETUP]${NC} $1"
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

# Check if domain is properly configured
check_domain_dns() {
    log "Checking DNS configuration for $DOMAIN..."
    
    local ip=$(dig +short $DOMAIN)
    local public_ip=$(curl -s http://checkip.amazonaws.com/)
    
    if [ -z "$ip" ]; then
        error "Domain $DOMAIN does not resolve to any IP address"
        error "Please configure your Duck DNS domain first"
        return 1
    fi
    
    info "Domain resolves to: $ip"
    info "Your public IP: $public_ip"
    
    if [ "$ip" != "$public_ip" ]; then
        warning "Domain IP ($ip) does not match your public IP ($public_ip)"
        warning "Make sure your Duck DNS domain points to this server"
    else
        log "✅ DNS configuration looks correct"
    fi
}

# Create directories for SSL certificates
setup_directories() {
    log "Creating SSL certificate directories..."
    
    mkdir -p ./certbot/conf
    mkdir -p ./certbot/www
    
    log "✅ Directories created"
}

# Get SSL certificates using Certbot
obtain_certificates() {
    log "Obtaining SSL certificates for $DOMAIN..."
    
    # First, start nginx without SSL for the challenge
    info "Starting temporary nginx for ACME challenge..."
    
    # Create temporary nginx config for ACME challenge
    cat > ./nginx-temp.conf << EOF
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name $DOMAIN;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 200 'ACME Challenge Server Ready';
            add_header Content-Type text/plain;
        }
    }
}
EOF

    # Start temporary nginx
    docker run -d --name nginx-temp \
        -p 80:80 \
        -v "$(pwd)/nginx-temp.conf:/etc/nginx/nginx.conf:ro" \
        -v "$(pwd)/certbot/www:/var/www/certbot:ro" \
        nginx:alpine

    # Wait a moment for nginx to start
    sleep 5

    # Obtain certificate
    info "Running Certbot to obtain certificate..."
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"

    # Stop temporary nginx
    docker stop nginx-temp
    docker rm nginx-temp
    rm ./nginx-temp.conf

    # Check if certificate was obtained
    if [ -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
        log "✅ SSL certificate obtained successfully!"
        return 0
    else
        error "❌ Failed to obtain SSL certificate"
        return 1
    fi
}

# Verify SSL certificate
verify_certificate() {
    log "Verifying SSL certificate..."
    
    if [ -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
        local expiry=$(openssl x509 -enddate -noout -in "./certbot/conf/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
        log "✅ Certificate found and valid until: $expiry"
        return 0
    else
        error "❌ Certificate not found"
        return 1
    fi
}

# Start the full application with SSL
start_application() {
    log "Starting AV-RENTALS with SSL support..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        log "Creating .env file..."
        cp .env.example .env
        
        warning "Please edit .env file with your configuration:"
        warning "- Update JWT_SECRET and NEXTAUTH_SECRET"
        warning "- Set your email address"
        echo
        read -p "Press Enter to continue after editing .env file..."
    fi
    
    # Start the application
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        log "✅ Application started successfully!"
        echo
        log "🌐 Your AV-RENTALS application is now available at:"
        log "   https://$DOMAIN"
        echo
        log "📊 You can also access:"
        log "   - Admin Panel: https://$DOMAIN/admin"
        log "   - Backup Settings: https://$DOMAIN/admin/settings"
        echo
        log "🔒 SSL certificate will auto-renew every 12 hours"
    else
        error "❌ Failed to start application"
        return 1
    fi
}

# Test SSL connection
test_ssl() {
    log "Testing SSL connection..."
    
    sleep 10  # Wait for services to start
    
    local response=$(curl -Is https://$DOMAIN | head -1)
    
    if [[ $response == *"200"* ]]; then
        log "✅ SSL connection test successful!"
        log "Response: $response"
    else
        warning "⚠️  SSL test may have issues"
        warning "Response: $response"
        warning "Give it a few minutes for DNS propagation and try again"
    fi
}

# Main setup function
main() {
    echo "🚀 AV-RENTALS SSL Setup for $DOMAIN"
    echo "====================================="
    echo
    
    # Check requirements
    if ! command -v docker &> /dev/null; then
        error "Docker is required but not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is required but not installed"
        exit 1
    fi
    
    # Get email for Let's Encrypt
    read -p "Enter your email address for Let's Encrypt notifications: " user_email
    if [ -n "$user_email" ]; then
        EMAIL="$user_email"
    fi
    
    echo
    log "Starting SSL setup process..."
    
    # Step 1: Check DNS
    if ! check_domain_dns; then
        error "Please fix DNS configuration before continuing"
        exit 1
    fi
    
    # Step 2: Setup directories
    setup_directories
    
    # Step 3: Obtain certificates
    if ! obtain_certificates; then
        error "Certificate generation failed"
        exit 1
    fi
    
    # Step 4: Verify certificate
    if ! verify_certificate; then
        error "Certificate verification failed"
        exit 1
    fi
    
    # Step 5: Start application
    if ! start_application; then
        error "Application startup failed"
        exit 1
    fi
    
    # Step 6: Test SSL
    test_ssl
    
    echo
    log "🎉 SSL setup completed successfully!"
    echo
    info "Next steps:"
    echo "1. Visit https://$DOMAIN to access your application"
    echo "2. Configure your application settings"
    echo "3. Set up automatic backups in admin panel"
    echo "4. Monitor SSL certificate renewal (automatic)"
    echo
    log "For troubleshooting, check logs with:"
    echo "   docker-compose logs -f"
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "AV-RENTALS SSL Setup Script"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --test-only    Only test current SSL configuration"
    echo "  --renew        Renew existing certificates"
    echo
    echo "This script will:"
    echo "1. Check DNS configuration for $DOMAIN"
    echo "2. Obtain SSL certificates from Let's Encrypt"
    echo "3. Configure Nginx with SSL"
    echo "4. Start the AV-RENTALS application with HTTPS"
    echo
    exit 0
fi

# Test only mode
if [ "$1" = "--test-only" ]; then
    check_domain_dns
    verify_certificate
    test_ssl
    exit 0
fi

# Renew certificates
if [ "$1" = "--renew" ]; then
    log "Renewing SSL certificates..."
    docker-compose exec certbot certbot renew
    docker-compose exec nginx nginx -s reload
    exit 0
fi

# Run main setup
main "$@"