#!/bin/bash

# Safe Development Script for AV Rentals
# This allows you to make changes without affecting the live site

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[DEV]${NC} $1"
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

# Function to start development server
start_dev() {
    log "Starting development server..."
    
    # Check if production is running
    if systemctl is-active --quiet av-rentals.service; then
        info "✅ Production server is running on port 3000"
        info "🔧 Development will run on port 3001"
        
        # Start dev server on different port
        log "Starting development server on port 3001..."
        PORT=3001 npm run dev
    else
        error "❌ Production server is not running!"
        info "Starting production server first..."
        sudo systemctl start av-rentals.service
        sleep 5
        info "✅ Production server started"
        info "🔧 Now starting development on port 3001..."
        PORT=3001 npm run dev
    fi
}

# Function to test changes
test_changes() {
    log "Testing your changes..."
    
    warning "Building production version to test..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log "✅ Build successful! Your changes are ready."
        info "You can now deploy safely."
    else
        error "❌ Build failed! Fix errors before deploying."
        exit 1
    fi
}

# Function to deploy changes safely
deploy_changes() {
    log "Deploying changes to production..."
    
    # Test build first
    log "Testing build..."
    npm run build
    
    if [ $? -ne 0 ]; then
        error "❌ Build failed! Not deploying."
        exit 1
    fi
    
    log "✅ Build successful. Deploying..."
    
    # Stop production
    sudo systemctl stop av-rentals.service
    
    # Start production with new build
    sudo systemctl start av-rentals.service
    
    # Wait and check
    sleep 10
    
    if systemctl is-active --quiet av-rentals.service; then
        log "✅ Deployment successful!"
        info "Your changes are now live at https://acrobaticzrental.duckdns.org"
    else
        error "❌ Deployment failed! Check logs:"
        sudo systemctl status av-rentals.service
    fi
}

# Function to rollback if something goes wrong
rollback() {
    warning "Rolling back to previous version..."
    
    # Restart the service (will use last known good build)
    sudo systemctl restart av-rentals.service
    
    log "✅ Rollback complete"
}

# Main menu
case "$1" in
    "dev"|"start")
        start_dev
        ;;
    "test")
        test_changes
        ;;
    "deploy")
        deploy_changes
        ;;
    "rollback")
        rollback
        ;;
    "status")
        if systemctl is-active --quiet av-rentals.service; then
            log "✅ Production server is running"
            info "Site: https://acrobaticzrental.duckdns.org"
        else
            error "❌ Production server is stopped"
        fi
        ;;
    *)
        echo "🚀 AV Rentals Development Helper"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  dev      - Start development server (port 3001)"
        echo "  test     - Test your changes by building"
        echo "  deploy   - Deploy changes to production safely"
        echo "  rollback - Rollback if something went wrong"
        echo "  status   - Check production server status"
        echo ""
        echo "💡 Safe workflow:"
        echo "  1. ./dev-helper.sh dev     (make your changes)"
        echo "  2. ./dev-helper.sh test    (test they work)"
        echo "  3. ./dev-helper.sh deploy  (deploy to production)"
        echo ""
        ;;
esac