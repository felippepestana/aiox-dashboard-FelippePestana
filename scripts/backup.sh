#!/bin/bash
# ============================================================
# AIOX Legal - Database & Uploads Backup Script
# Usage: ./scripts/backup.sh [backup_dir]
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
BACKUP_DIR="${1:-/opt/aiox-legal/backups}"
APP_DIR="/opt/aiox-legal"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="aiox-backup-$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
RETENTION_DAYS=7

echo ""
echo "============================================"
echo "  AIOX Legal - Backup"
echo "  Timestamp: $TIMESTAMP"
echo "============================================"
echo ""

# ============================================================
# Step 1: Create backup directory
# ============================================================

mkdir -p "$BACKUP_PATH"
log_ok "Backup directory: $BACKUP_PATH"

# ============================================================
# Step 2: Backup SQLite databases
# ============================================================

log_info "Backing up databases..."

# Get the Docker volume mount paths for data
DATA_VOLUME=$(docker volume inspect aiox-legal_app-data 2>/dev/null | grep -o '"Mountpoint": "[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$DATA_VOLUME" ] && [ -d "$DATA_VOLUME" ]; then
    # Backup from Docker volume
    for db_file in "$DATA_VOLUME"/*.db; do
        if [ -f "$db_file" ]; then
            DB_NAME=$(basename "$db_file")
            log_info "  Backing up $DB_NAME..."
            # Use sqlite3 .backup for safe copy if available, otherwise cp
            if command -v sqlite3 &> /dev/null; then
                sqlite3 "$db_file" ".backup '$BACKUP_PATH/$DB_NAME'"
            else
                cp "$db_file" "$BACKUP_PATH/$DB_NAME"
            fi
            log_ok "  $DB_NAME backed up."
        fi
    done
else
    # Try to backup via docker exec
    log_info "  Copying databases from containers..."

    # Copy from web container
    docker cp aiox-web:/data/ "$BACKUP_PATH/data/" 2>/dev/null && \
        log_ok "  Web data backed up." || \
        log_warn "  Could not backup web data (container may not be running)."

    # Copy from monitor container
    docker cp aiox-monitor:/data/ "$BACKUP_PATH/monitor-data/" 2>/dev/null && \
        log_ok "  Monitor data backed up." || \
        log_warn "  Could not backup monitor data (container may not be running)."
fi

# ============================================================
# Step 3: Backup uploads directory
# ============================================================

log_info "Backing up uploads..."

UPLOADS_VOLUME=$(docker volume inspect aiox-legal_app-uploads 2>/dev/null | grep -o '"Mountpoint": "[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$UPLOADS_VOLUME" ] && [ -d "$UPLOADS_VOLUME" ]; then
    if [ "$(ls -A "$UPLOADS_VOLUME" 2>/dev/null)" ]; then
        cp -r "$UPLOADS_VOLUME" "$BACKUP_PATH/uploads"
        log_ok "Uploads backed up."
    else
        log_warn "Uploads directory is empty, skipping."
    fi
else
    docker cp aiox-web:/app/uploads/ "$BACKUP_PATH/uploads/" 2>/dev/null && \
        log_ok "Uploads backed up from container." || \
        log_warn "Could not backup uploads."
fi

# ============================================================
# Step 4: Backup environment file (without secrets shown)
# ============================================================

if [ -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env" "$BACKUP_PATH/.env"
    log_ok "Environment file backed up."
fi

# ============================================================
# Step 5: Compress backup
# ============================================================

log_info "Compressing backup..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"
BACKUP_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
log_ok "Backup compressed: ${BACKUP_NAME}.tar.gz ($BACKUP_SIZE)"

# ============================================================
# Step 6: Clean up old backups (keep last 7 days)
# ============================================================

log_info "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=0
while IFS= read -r old_backup; do
    rm -f "$old_backup"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    log_info "  Removed: $(basename "$old_backup")"
done < <(find "$BACKUP_DIR" -name "aiox-backup-*.tar.gz" -type f -mtime +"$RETENTION_DAYS" 2>/dev/null)

if [ "$DELETED_COUNT" -gt 0 ]; then
    log_ok "Removed $DELETED_COUNT old backup(s)."
else
    log_ok "No old backups to remove."
fi

# ============================================================
# Summary
# ============================================================

TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "aiox-backup-*.tar.gz" -type f | wc -l)

echo ""
echo "============================================"
echo "  Backup Complete"
echo "============================================"
echo ""
echo "  File:    $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "  Size:    $BACKUP_SIZE"
echo "  Total:   $TOTAL_BACKUPS backup(s) stored"
echo "  Retain:  Last $RETENTION_DAYS days"
echo ""
echo "  Restore: tar -xzf ${BACKUP_NAME}.tar.gz"
echo ""
echo "============================================"
