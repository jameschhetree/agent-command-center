const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 7901;

const DB_PATH = '/Users/james/.claude/telegram-bot-v3/jeremy.db';
const PDF_DIR = '/Users/james/CompetitorIQ/output';
const TRADES_PATH = '/Users/james/kalshi-bot/data/poly_trades_log.json';
const UPTIME_START = '2026-04-10T00:00:00';

function getMessageCount() {
  try {
    const result = execSync(`sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM inbox;"`, {
      timeout: 5000,
      encoding: 'utf8'
    });
    return parseInt(result.trim(), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function getReportCount() {
  try {
    const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
    return files.length;
  } catch (e) {
    return 0;
  }
}

function getTradesData() {
  try {
    const raw = fs.readFileSync(TRADES_PATH, 'utf8');
    const trades = JSON.parse(raw);
    const count = trades.length;
    let balance = null;
    if (count > 0 && trades[count - 1].balance_after !== undefined) {
      balance = trades[count - 1].balance_after;
    }
    return { count, balance };
  } catch (e) {
    return { count: 0, balance: null };
  }
}

function getBotStatus() {
  const result = {};
  try {
    const ps = execSync('ps aux', { timeout: 5000, encoding: 'utf8' });
    result.poly_bot = ps.includes('poly_bot.py');
    result.arb_bot = ps.includes('arb_bot.py');
  } catch (e) {
    result.poly_bot = false;
    result.arb_bot = false;
  }
  return result;
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/stats' && req.method === 'GET') {
    const trades = getTradesData();
    const botStatus = getBotStatus();

    const payload = {
      messages_processed: getMessageCount(),
      reports_generated: getReportCount(),
      trades_placed: trades.count,
      uptime_start: UPTIME_START,
      paper_balance: trades.balance,
      bot_status: botStatus
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[api-server] Live data API running on port ${PORT}`);
});
