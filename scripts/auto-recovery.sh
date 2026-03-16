#!/bin/bash

# AUTO RECOVERY
# Автоматическое восстановление системы при сбоях

LOG_FILE="./logs/auto-recovery.log"
MAX_RESTARTS=3
RESTART_WINDOW=3600  # 1 hour

echo "[$(date)] Auto-recovery check started" >> $LOG_FILE

# ============================================
# CHECK PM2 PROCESSES
# ============================================

echo "Checking PM2 processes..."

PM2_STATUS=$(pm2 jlist 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "[$(date)] ERROR: PM2 not responding" >> $LOG_FILE
    
    # Try to restart PM2
    pm2 resurrect
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] PM2 resurrected successfully" >> $LOG_FILE
    else
        echo "[$(date)] CRITICAL: Could not restart PM2" >> $LOG_FILE
        
        # Send alert
        if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
            curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
                -d chat_id=$TELEGRAM_CHAT_ID \
                -d text="🚨 CRITICAL: PM2 not responding on $(hostname)"
        fi
        
        exit 1
    fi
fi

# Count online processes
ONLINE_COUNT=$(echo $PM2_STATUS | jq '[.[] | select(.pm2_env.status == "online")] | length')
TOTAL_COUNT=$(echo $PM2_STATUS | jq 'length')

echo "[$(date)] Agents status: $ONLINE_COUNT/$TOTAL_COUNT online" >> $LOG_FILE

# If too many agents offline, restart
if [ "$ONLINE_COUNT" -lt "$((TOTAL_COUNT / 2))" ]; then
    echo "[$(date)] WARNING: More than half agents offline, restarting..." >> $LOG_FILE
    
    pm2 restart all
    
    sleep 10
    
    # Check again
    NEW_STATUS=$(pm2 jlist 2>/dev/null)
    NEW_ONLINE=$(echo $NEW_STATUS | jq '[.[] | select(.pm2_env.status == "online")] | length')
    
    echo "[$(date)] After restart: $NEW_ONLINE/$TOTAL_COUNT online" >> $LOG_FILE
    
    # Alert if still not recovered
    if [ "$NEW_ONLINE" -lt "$TOTAL_COUNT" ]; then
        if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
            curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
                -d chat_id=$TELEGRAM_CHAT_ID \
                -d text="⚠️ Auto-recovery: Restarted agents, but $((TOTAL_COUNT - NEW_ONLINE)) still offline"
        fi
    fi
fi

# ============================================
# CHECK DISK SPACE
# ============================================

echo "Checking disk space..."

DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt 85 ]; then
    echo "[$(date)] WARNING: Disk usage at ${DISK_USAGE}%" >> $LOG_FILE
    
    # Clean old logs
    echo "Cleaning old logs..."
    find logs/ -name "*.log" -mtime +7 -delete
    find analytics/ -name "*.backup-*" -mtime +30 -delete
    
    # Clean PM2 logs
    pm2 flush
    
    NEW_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    echo "[$(date)] Disk cleaned: ${DISK_USAGE}% -> ${NEW_USAGE}%" >> $LOG_FILE
    
    if [ "$NEW_USAGE" -gt 90 ]; then
        if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
            curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
                -d chat_id=$TELEGRAM_CHAT_ID \
                -d text="⚠️ DISK SPACE CRITICAL: ${NEW_USAGE}% on $(hostname)"
        fi
    fi
fi

# ============================================
# CHECK MEMORY
# ============================================

echo "Checking memory..."

if command -v free &> /dev/null; then
    MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
    
    if [ "$MEM_USAGE" -gt 90 ]; then
        echo "[$(date)] WARNING: Memory usage at ${MEM_USAGE}%" >> $LOG_FILE
        
        # Restart high-memory processes
        pm2 restart all --update-env
        
        echo "[$(date)] Restarted agents due to high memory" >> $LOG_FILE
    fi
fi

# ============================================
# CHECK NETWORK
# ============================================

echo "Checking network connectivity..."

if ! ping -c 1 8.8.8.8 &> /dev/null; then
    echo "[$(date)] WARNING: Network connectivity issue" >> $LOG_FILE
    
    # Wait and retry
    sleep 30
    
    if ! ping -c 1 8.8.8.8 &> /dev/null; then
        echo "[$(date)] CRITICAL: Network still down" >> $LOG_FILE
        
        if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
            curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
                -d chat_id=$TELEGRAM_CHAT_ID \
                -d text="🚨 NETWORK DOWN on $(hostname)" &
        fi
    fi
fi

# ============================================
# CHECK AGENT HEALTH
# ============================================

echo "Checking agent health..."

# Check if any agent is stuck (no activity in last hour)
for LOG_FILE in logs/*-out.log; do
    if [ -f "$LOG_FILE" ]; then
        AGENT_NAME=$(basename $LOG_FILE -out.log)
        
        # Check last log entry timestamp
        LAST_LOG=$(tail -n 1 $LOG_FILE 2>/dev/null)
        
        if [ ! -z "$LAST_LOG" ]; then
            # If log hasn't been updated in 2 hours, restart that agent
            if ! find $LOG_FILE -mmin -120 | grep -q .; then
                echo "[$(date)] WARNING: $AGENT_NAME appears stuck (no logs for 2h)" >> ./logs/auto-recovery.log
                pm2 restart $AGENT_NAME
                echo "[$(date)] Restarted $AGENT_NAME" >> ./logs/auto-recovery.log
            fi
        fi
    fi
done

# ============================================
# CLEANUP OLD RECOVERY LOGS
# ============================================

# Keep only last 100 lines of recovery log
if [ -f "./logs/auto-recovery.log" ]; then
    tail -n 100 ./logs/auto-recovery.log > ./logs/auto-recovery.log.tmp
    mv ./logs/auto-recovery.log.tmp ./logs/auto-recovery.log
fi

echo "[$(date)] Auto-recovery check completed" >> ./logs/auto-recovery.log
echo "Recovery check complete."
