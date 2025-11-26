#!/bin/bash

# Backup and Restore Script for AV Rentals
# Keeps your app safe by creating backups before changes

BACKUP_DIR="/mnt/backup_drive/av-rentals/backups"
APP_DIR="/home/home/Acrobaticz-AV-RENTALS"

# Create backup
create_backup() {
    echo "🔄 Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Create timestamped backup
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_NAME="backup_$TIMESTAMP"
    
    # Backup the current build and source
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    
    # Backup the built application
    if [ -d "$APP_DIR/.next" ]; then
        cp -r "$APP_DIR/.next" "$BACKUP_DIR/$BACKUP_NAME/"
        echo "✅ Backed up .next build"
    fi
    
    # Backup database
    if [ -f "$APP_DIR/prisma/dev.db" ]; then
        cp "$APP_DIR/prisma/dev.db" "$BACKUP_DIR/$BACKUP_NAME/"
        echo "✅ Backed up database"
    fi
    
    # Backup environment
    if [ -f "$APP_DIR/.env.local" ]; then
        cp "$APP_DIR/.env.local" "$BACKUP_DIR/$BACKUP_NAME/"
        echo "✅ Backed up environment"
    fi
    
    echo "✅ Backup created: $BACKUP_NAME"
    echo "📁 Location: $BACKUP_DIR/$BACKUP_NAME"
}

# List backups
list_backups() {
    echo "📦 Available backups:"
    ls -la "$BACKUP_DIR" | grep "backup_" || echo "No backups found"
}

# Restore from backup
restore_backup() {
    if [ -z "$1" ]; then
        echo "❌ Please specify backup name"
        echo "Usage: ./backup-helper.sh restore backup_20241020_120000"
        list_backups
        exit 1
    fi
    
    BACKUP_PATH="$BACKUP_DIR/$1"
    
    if [ ! -d "$BACKUP_PATH" ]; then
        echo "❌ Backup not found: $1"
        list_backups
        exit 1
    fi
    
    echo "⚠️  WARNING: This will restore from backup and overwrite current files!"
    echo "📦 Restoring from: $1"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Stopping production server..."
        sudo systemctl stop av-rentals.service
        
        # Restore files
        if [ -d "$BACKUP_PATH/.next" ]; then
            rm -rf "$APP_DIR/.next"
            cp -r "$BACKUP_PATH/.next" "$APP_DIR/"
            echo "✅ Restored .next build"
        fi
        
        if [ -f "$BACKUP_PATH/dev.db" ]; then
            cp "$BACKUP_PATH/dev.db" "$APP_DIR/prisma/"
            echo "✅ Restored database"
        fi
        
        if [ -f "$BACKUP_PATH/.env.local" ]; then
            cp "$BACKUP_PATH/.env.local" "$APP_DIR/"
            echo "✅ Restored environment"
        fi
        
        echo "🔄 Starting production server..."
        sudo systemctl start av-rentals.service
        
        echo "✅ Restore complete!"
    else
        echo "❌ Restore cancelled"
    fi
}

case "$1" in
    "create"|"backup")
        create_backup
        ;;
    "list")
        list_backups
        ;;
    "restore")
        restore_backup "$2"
        ;;
    *)
        echo "🛡️  AV Rentals Backup Helper"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  create   - Create a backup of current state"
        echo "  list     - List available backups"
        echo "  restore  - Restore from backup"
        echo ""
        echo "Examples:"
        echo "  ./backup-helper.sh create"
        echo "  ./backup-helper.sh list"
        echo "  ./backup-helper.sh restore backup_20241020_120000"
        ;;
esac