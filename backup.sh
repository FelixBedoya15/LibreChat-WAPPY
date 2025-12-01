#!/bin/bash

# Create backup directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "Starting backup to $BACKUP_DIR..."

# Backup configuration files
echo "Backing up configuration files..."
if [ -f .env ]; then
    cp .env "$BACKUP_DIR/.env"
fi
if [ -f librechat.yaml ]; then
    cp librechat.yaml "$BACKUP_DIR/librechat.yaml"
fi
if [ -f docker-compose.yml ]; then
    cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml"
fi

# Backup MongoDB
echo "Backing up MongoDB..."
# Check if docker is available and container is running
if command -v docker &> /dev/null && docker ps | grep -q chat-mongodb; then
    docker exec chat-mongodb mongodump --archive --gzip --db LibreChat > "$BACKUP_DIR/librechat_db.archive"
    echo "MongoDB backup completed."
else
    echo "WARNING: Docker not available or MongoDB container 'chat-mongodb' not found. Database backup skipped."
    echo "Please ensure you are running this script where you have access to the Docker daemon."
fi

# Compress the backup
echo "Compressing backup..."
tar -czf "backups/backup_$TIMESTAMP.tar.gz" -C "backups" "backup_$TIMESTAMP"
rm -rf "$BACKUP_DIR"

echo "Backup completed successfully: backups/backup_$TIMESTAMP.tar.gz"
