const fs = require('fs');
const path = require('path');

// Read existing resolved URLs
const resolvedPath = path.join(__dirname, 'resolved-urls.json');
const existing = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
const before = Object.keys(existing).length;

// Read fresh URLs from MCP results
const mcpDir = path.join(
  'C:', 'Users', 'tal2k', '.claude', 'projects',
  'C--Users-tal2k-OneDrive-------------------DTM---------------------------',
  'c8bf33de-6309-47d5-b01b-2ae6dfb91fa8',
  'tool-results'
);

const files = fs.readdirSync(mcpDir).filter(f => f.includes('all_monday_api'));
console.log('Found', files.length, 'MCP result files');

// Parse ALL result files and merge
let totalAdded = 0;
for (const file of files) {
  try {
    const raw = fs.readFileSync(path.join(mcpDir, file), 'utf8');
    const parsed = JSON.parse(raw);
    let assets = [];
    if (Array.isArray(parsed) && parsed[0]?.text) {
      const inner = JSON.parse(parsed[0].text);
      assets = inner.data?.assets || inner.assets || [];
    }
    for (const a of assets) {
      if (a.id && a.public_url) {
        existing[String(a.id)] = a.public_url;
      }
    }
  } catch (e) {
    // skip unparseable files
  }
}

fs.writeFileSync(resolvedPath, JSON.stringify(existing));
console.log('Before:', before, '| After:', Object.keys(existing).length, '| Added:', Object.keys(existing).length - before);
