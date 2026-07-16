#!/bin/bash
# ZIS ERP Database Backup Script
# Automatically dumps the Neon Postgres Database and keeps backups for 7 days.
# Usage: ./backup.sh
# Note: Ensure pg_dump is installed on your production server.

# Configuration
BACKUP_DIR="/var/backups/zis_erp"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="db_backup_$TIMESTAMP.sql.gz"
DB_URL="YOUR_NEON_DATABASE_URL_HERE"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $TIMESTAMP..."

# Execute pg_dump and compress
pg_dump "$DB_URL" | gzip > "$BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
    echo "Backup successfully saved to $BACKUP_DIR/$FILENAME"
else
    echo "Error: Database backup failed!"
    exit 1
fi

# Clean up backups older than 7 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;
echo "Cleaned up old backups."
