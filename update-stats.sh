#!/bin/bash
# update-stats.sh — Generates stats.json with live data from local sources
# Run periodically or before git push to keep Command Center stats current

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$SCRIPT_DIR/stats.json"

# 1. Count PDF reports in CompetitorIQ output
REPORTS=$(find /Users/james/CompetitorIQ/output -name "*.pdf" 2>/dev/null | wc -l | tr -d ' ')
if [ -z "$REPORTS" ] || [ "$REPORTS" = "0" ]; then
  REPORTS=0
fi

# 2. Count processed Telegram messages
MESSAGES=$(sqlite3 ~/.claude/telegram-bot-v3/jeremy.db "SELECT COUNT(*) FROM inbox WHERE processed=1" 2>/dev/null)
if [ -z "$MESSAGES" ]; then
  MESSAGES=0
fi

# 3. Count trades from kalshi bot databases
PAPER_TRADES=$(sqlite3 /Users/james/kalshi-bot/data/trades.db "SELECT COUNT(*) FROM paper_trades" 2>/dev/null)
POLY_TRADES=$(sqlite3 /Users/james/kalshi-bot/data/poly_directional.db "SELECT COUNT(*) FROM poly_trades" 2>/dev/null)
PAPER_TRADES=${PAPER_TRADES:-0}
POLY_TRADES=${POLY_TRADES:-0}
TRADES=$((PAPER_TRADES + POLY_TRADES))

# 4. Timestamp
UPDATED=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Write JSON
cat > "$OUTPUT" <<EOF
{
  "reports_generated": $REPORTS,
  "messages_processed": $MESSAGES,
  "trades_placed": $TRADES,
  "updated_at": "$UPDATED"
}
EOF

echo "Stats updated: reports=$REPORTS, messages=$MESSAGES, trades=$TRADES"
echo "Written to $OUTPUT"
