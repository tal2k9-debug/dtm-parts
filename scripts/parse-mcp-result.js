const fs = require('fs');
const path = require('path');

// The MCP result file path
const mcpDir = path.join(
  'C:', 'Users', 'tal2k', '.claude', 'projects',
  'C--Users-tal2k-OneDrive-------------------DTM---------------------------',
  'c8bf33de-6309-47d5-b01b-2ae6dfb91fa8',
  'tool-results'
);

const files = fs.readdirSync(mcpDir).filter(f => f.includes('all_monday_api'));
console.log('MCP result files:', files);

if (files.length === 0) {
  console.log('No MCP result files found');
  process.exit(1);
}

const filePath = path.join(mcpDir, files[files.length - 1]);
console.log('Reading:', filePath);

const raw = fs.readFileSync(filePath, 'utf8');
const parsed = JSON.parse(raw);

let assets = [];
if (Array.isArray(parsed)) {
  const inner = JSON.parse(parsed[0].text);
  assets = inner.data?.assets || inner.assets || [];
} else if (parsed.data?.assets) {
  assets = parsed.data.assets;
}

console.log('Assets found:', assets.length);

if (assets.length > 0) {
  console.log('Sample:', JSON.stringify(assets[0]).slice(0, 200));
  
  // Merge into resolved-urls.json
  const resolvedPath = path.join(__dirname, 'resolved-urls.json');
  const existing = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  const before = Object.keys(existing).length;
  
  for (const a of assets) {
    if (a.id && a.public_url) {
      existing[String(a.id)] = a.public_url;
    }
  }
  
  fs.writeFileSync(resolvedPath, JSON.stringify(existing));
  console.log('Before:', before, '| After:', Object.keys(existing).length, '| Added:', Object.keys(existing).length - before);
}
