
const fs = require('fs');
const file = process.argv[2];
if (!file) { console.error('Usage: node parse-assets.mjs <result-file>'); process.exit(1); }
const raw = fs.readFileSync(file, 'utf8');
let content;
try {
  const arr = JSON.parse(raw);
  content = JSON.parse(arr[0].text);
} catch {
  content = JSON.parse(raw);
}
const assets = content.assets || [];
const urlMap = fs.existsSync('scripts/resolved-urls.json') ? JSON.parse(fs.readFileSync('scripts/resolved-urls.json','utf8')) : {};
const before = Object.keys(urlMap).length;
for (const a of assets) {
  if (a.id && a.public_url) urlMap[a.id] = a.public_url;
}
fs.writeFileSync('scripts/resolved-urls.json', JSON.stringify(urlMap));
console.log('Added:', Object.keys(urlMap).length - before, '| Total:', Object.keys(urlMap).length);
