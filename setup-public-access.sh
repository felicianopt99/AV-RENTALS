#!/bin/bash

# DuckDNS and Public Deployment Setup Script
echo "🌐 Setting up public deployment for acrobaticzrental.duckdns.org"

# Get current public IP
PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "📍 Current public IP: $PUBLIC_IP"

# Update DuckDNS (you'll need to add your token)
DUCKDNS_TOKEN="your-duckdns-token-here"  # Replace with your actual token
DUCKDNS_DOMAIN="acrobaticzrental"

echo "🔄 Updating DuckDNS IP..."
curl -s "https://www.duckdns.org/update?domains=$DUCKDNS_DOMAIN&token=$DUCKDNS_TOKEN&ip=$PUBLIC_IP"

echo "🔧 Setting up firewall rules..."
# Allow HTTP and HTTPS through firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # Keep SSH access
sudo ufw --force enable

echo "🔒 Installing Let's Encrypt SSL..."
# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
sudo certbot --nginx -d acrobaticzrental.duckdns.org --non-interactive --agree-tos --email your-email@example.com --redirect

echo "✅ Setup complete!"
echo "🌐 Your app should now be accessible at:"
echo "   https://acrobaticzrental.duckdns.org"
echo ""
echo "⚠️  Make sure to:"
echo "   1. Replace 'your-duckdns-token-here' with your actual DuckDNS token"
echo "   2. Replace 'your-email@example.com' with your actual email"
echo "   3. Ensure your router forwards port 80 and 443 to this machine ($PUBLIC_IP)"