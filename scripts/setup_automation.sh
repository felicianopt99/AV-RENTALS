#!/bin/bash
# Setup Automated Overnight Translation
# This script configures cron jobs for automatic overnight translation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🤖 Setting up Automated Overnight Translation"
echo "=============================================="

# Create logs directory
mkdir -p "$PROJECT_DIR/logs/translation"

# Create the cron script
cat > "$SCRIPT_DIR/cron_overnight_translate.sh" << 'EOF'
#!/bin/bash
# Automated Overnight Translation Cron Job
# This script runs the overnight translator and handles logging

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Setup environment
export PATH="/usr/local/bin:/usr/bin:/bin"
cd "$SCRIPT_DIR"

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
fi

# Create log file with timestamp
LOG_FILE="$PROJECT_DIR/logs/translation/overnight_$(date +%Y%m%d_%H%M%S).log"

# Ensure logs directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Run the overnight translator
echo "$(date): Starting overnight translation..." >> "$LOG_FILE"

# Run with logging
./run_overnight.sh --languages pt es fr --batch-size 20 >> "$LOG_FILE" 2>&1

# Check exit status
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "$(date): Overnight translation completed successfully" >> "$LOG_FILE"
else
    echo "$(date): Overnight translation failed with exit code $EXIT_CODE" >> "$LOG_FILE"
fi

# Clean up old logs (keep last 30 days)
find "$PROJECT_DIR/logs/translation" -name "overnight_*.log" -mtime +30 -delete

# Send completion notification (optional - uncomment and configure)
# echo "Overnight translation completed. Exit code: $EXIT_CODE" | mail -s "Translation Report" your-email@example.com
EOF

chmod +x "$SCRIPT_DIR/cron_overnight_translate.sh"

echo "✅ Created cron script: $SCRIPT_DIR/cron_overnight_translate.sh"

# Create different scheduling options
echo ""
echo "📅 Cron Job Options:"
echo "==================="

echo ""
echo "1️⃣ NIGHTLY at 2:00 AM (Recommended)"
echo "   Runs every night at 2 AM when system usage is low"
NIGHTLY_CRON="0 2 * * * $SCRIPT_DIR/cron_overnight_translate.sh"
echo "   Cron entry: $NIGHTLY_CRON"

echo ""
echo "2️⃣ WEEKEND INTENSIVE (Saturday 1 AM)"
echo "   Runs once per week with larger batches"
WEEKEND_CRON="0 1 * * 6 $SCRIPT_DIR/cron_overnight_translate.sh"
echo "   Cron entry: $WEEKEND_CRON"

echo ""
echo "3️⃣ WORKDAYS ONLY (Monday-Friday 3 AM)"
echo "   Runs Monday through Friday only"
WORKDAYS_CRON="0 3 * * 1-5 $SCRIPT_DIR/cron_overnight_translate.sh"
echo "   Cron entry: $WORKDAYS_CRON"

echo ""
echo "🔧 To set up automatic scheduling, choose one of these options:"
echo ""

# Create helper scripts for easy setup
cat > "$SCRIPT_DIR/setup_nightly_cron.sh" << EOF
#!/bin/bash
# Setup nightly translation cron job
echo "Setting up nightly translation at 2 AM..."
(crontab -l 2>/dev/null; echo "$NIGHTLY_CRON") | crontab -
echo "✅ Nightly cron job installed!"
echo "📋 Current cron jobs:"
crontab -l
EOF

cat > "$SCRIPT_DIR/setup_weekend_cron.sh" << EOF
#!/bin/bash
# Setup weekend translation cron job  
echo "Setting up weekend translation on Saturday at 1 AM..."
(crontab -l 2>/dev/null; echo "$WEEKEND_CRON") | crontab -
echo "✅ Weekend cron job installed!"
echo "📋 Current cron jobs:"
crontab -l
EOF

cat > "$SCRIPT_DIR/setup_workdays_cron.sh" << EOF
#!/bin/bash
# Setup workdays translation cron job
echo "Setting up workdays translation Monday-Friday at 3 AM..."
(crontab -l 2>/dev/null; echo "$WORKDAYS_CRON") | crontab -
echo "✅ Workdays cron job installed!"
echo "📋 Current cron jobs:"
crontab -l
EOF

chmod +x "$SCRIPT_DIR/setup_nightly_cron.sh"
chmod +x "$SCRIPT_DIR/setup_weekend_cron.sh"
chmod +x "$SCRIPT_DIR/setup_workdays_cron.sh"

echo "💡 Quick Setup Commands:"
echo "   ./setup_nightly_cron.sh    # Enable nightly translation"
echo "   ./setup_weekend_cron.sh    # Enable weekend translation"
echo "   ./setup_workdays_cron.sh   # Enable workdays translation"

echo ""
echo "📊 Monitor Progress:"
echo "   tail -f $PROJECT_DIR/logs/translation/overnight_*.log"

echo ""
echo "🗑️ Remove Cron Jobs:"
echo "   crontab -l | grep -v 'overnight_translate' | crontab -"

# Create monitoring script
cat > "$SCRIPT_DIR/monitor_translation.sh" << 'EOF'
#!/bin/bash
# Monitor Translation Progress
# Shows recent translation activity and statistics

PROJECT_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
LOGS_DIR="$PROJECT_DIR/logs/translation"

echo "📊 Translation Monitoring Dashboard"
echo "=================================="

# Check if logs directory exists
if [ ! -d "$LOGS_DIR" ]; then
    echo "❌ No translation logs found"
    exit 1
fi

# Find recent log files
RECENT_LOGS=$(find "$LOGS_DIR" -name "overnight_*.log" -mtime -7 | sort -r)

if [ -z "$RECENT_LOGS" ]; then
    echo "📝 No recent translation logs (last 7 days)"
    exit 0
fi

echo "📅 Recent Translation Runs (Last 7 days):"
echo ""

for log in $RECENT_LOGS; do
    filename=$(basename "$log")
    date_part=$(echo "$filename" | sed 's/overnight_\([0-9_]*\)\.log/\1/')
    
    # Format date
    year=${date_part:0:4}
    month=${date_part:4:2}
    day=${date_part:6:2}
    hour=${date_part:9:2}
    minute=${date_part:11:2}
    
    formatted_date="$year-$month-$day $hour:$minute"
    
    echo "🕐 $formatted_date"
    
    # Show statistics from log
    if grep -q "OVERNIGHT TRANSLATION REPORT" "$log"; then
        echo "   Status: ✅ Completed"
        new_translations=$(grep "Newly Translated:" "$log" | awk '{print $3}' || echo "0")
        cached=$(grep "Already Cached:" "$log" | awk '{print $3}' || echo "0")
        failed=$(grep "Failed:" "$log" | awk '{print $2}' || echo "0")
        
        echo "   New: $new_translations | Cached: $cached | Failed: $failed"
    else
        echo "   Status: ⚠️ In Progress or Failed"
    fi
    
    echo ""
done

# Show latest log tail
LATEST_LOG=$(echo "$RECENT_LOGS" | head -n 1)
if [ -n "$LATEST_LOG" ]; then
    echo "📋 Latest Log Tail (last 10 lines):"
    echo "======================================"
    tail -n 10 "$LATEST_LOG"
fi
EOF

chmod +x "$SCRIPT_DIR/monitor_translation.sh"

echo ""
echo "🎉 Automation setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Choose and run one of the setup_*_cron.sh scripts"
echo "2. Monitor with: ./monitor_translation.sh"
echo "3. Check logs in: $PROJECT_DIR/logs/translation/"
echo ""
echo "⚙️ Configuration Files Created:"
echo "- cron_overnight_translate.sh     # Main cron script"
echo "- setup_nightly_cron.sh          # Setup nightly job"
echo "- setup_weekend_cron.sh          # Setup weekend job"
echo "- setup_workdays_cron.sh         # Setup workdays job"
echo "- monitor_translation.sh         # Monitor progress"