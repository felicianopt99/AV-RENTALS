#!/bin/bash

# Auto-start setup script for AV-RENTALS
# This script creates a systemd service to auto-start the application on boot

SERVICE_NAME="av-rentals"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
APP_DIR="/home/home/Acrobaticz/AV-RENTALS"
USER="home"

echo "🚀 Setting up AV-RENTALS auto-start service..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root or with sudo"
    echo "Usage: sudo ./setup-autostart.sh"
    exit 1
fi

# Create the systemd service file
cat > $SERVICE_FILE << EOF
[Unit]
Description=AV-RENTALS Docker Application
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
Environment=HOME=/home/$USER

# Update DuckDNS IP before starting
ExecStartPre=/bin/bash -c 'cd $APP_DIR && curl -s "https://www.duckdns.org/update?domains=acrobaticzrental&token=f0027691-1f98-4a3e-9f26-94020479451e&ip=" || true'

# Start the application
ExecStart=/usr/bin/docker-compose up -d

# Stop the application  
ExecStop=/usr/bin/docker-compose down

# Restart policy
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
chmod 644 $SERVICE_FILE

# Reload systemd and enable the service
systemctl daemon-reload
systemctl enable $SERVICE_NAME

echo "✅ Service created: $SERVICE_FILE"
echo "✅ Service enabled for auto-start"
echo ""
echo "🎯 Service Commands:"
echo "  Start:   sudo systemctl start $SERVICE_NAME"
echo "  Stop:    sudo systemctl stop $SERVICE_NAME"
echo "  Status:  sudo systemctl status $SERVICE_NAME"
echo "  Logs:    sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "🔄 The application will now start automatically on boot!"
echo "📍 Working directory: $APP_DIR"
echo "👤 Running as user: $USER"