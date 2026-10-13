#!/bin/bash
BACKUP_DIR="/srv/simag-bmkg/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump postgresql://postgres:password_kamu@127.0.0.1:5432/simag_bmkg > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
# Keep only last 7 days of backups
find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -delete
