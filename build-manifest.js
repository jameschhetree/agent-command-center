const fs = require('fs');
const path = require('path');

const PDF_DIR = '/Users/james/CompetitorIQ/output';
const OUT_PATH = path.join(__dirname, 'reports-manifest.json');

function categorize(name) {
  const lower = name.toLowerCase();
  if (lower.startsWith('sa-brief') || lower.includes('sa-brief')) return 'SA-Brief';
  if (lower.includes('competitoriq') || lower.includes('competitor-iq') || lower.includes('dmv-wholesale') || lower.includes('dmv_wholesale') || lower.includes('apna') || lower.includes('pizza') || lower.includes('alti') || lower.includes('mac-agency')) return 'CompetitorIQ';
  if (lower.includes('daily-report') || lower.includes('daily_report') || lower.includes('morning-brief')) return 'Daily-Report';
  if (lower.includes('livenation') || lower.includes('live-nation') || lower.includes('deep-dive')) return 'Deep-Dive';
  if (lower.includes('highlife') || lower.includes('high-life')) return 'HighLife';
  if (lower.includes('ppt') || lower.includes('slide')) return 'Presentation';
  if (lower.includes('demo')) return 'Demo';
  if (lower.includes('brief')) return 'Daily-Report';
  if (lower.includes('report')) return 'Deep-Dive';
  return 'Other';
}

try {
  const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  const manifest = files.map(f => {
    const fullPath = path.join(PDF_DIR, f);
    const stat = fs.statSync(fullPath);
    return {
      name: f,
      size_kb: Math.round(stat.size / 1024),
      mtime: stat.mtime.toISOString(),
      category: categorize(f)
    };
  });

  // Sort newest first
  manifest.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

  fs.writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2));
  console.log(`[build-manifest] Generated manifest with ${manifest.length} reports -> ${OUT_PATH}`);
} catch (e) {
  console.error('[build-manifest] Error:', e.message);
  process.exit(1);
}
