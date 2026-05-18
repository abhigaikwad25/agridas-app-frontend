const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'locales');
const enPath = path.join(root, 'en.json');
const hiPath = path.join(root, 'hi.json');
const mrPath = path.join(root, 'mr.json');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 4) + '\n', 'utf8');
}

function merge(base, target) {
  let changed = false;
  for (const k of Object.keys(base)) {
    if (typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k])) {
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
        changed = true;
      }
      const subChanged = merge(base[k], target[k]);
      if (subChanged) changed = true;
    } else {
      if (!(k in target)) {
        // Add placeholder translation (use English as default)
        target[k] = base[k];
        changed = true;
      }
    }
  }
  return changed;
}

function main() {
  const en = readJSON(enPath);
  const hi = readJSON(hiPath);
  const mr = readJSON(mrPath);

  const hiChanged = merge(en, hi);
  const mrChanged = merge(en, mr);

  if (hiChanged) writeJSON(hiPath, hi);
  if (mrChanged) writeJSON(mrPath, mr);

  console.log('Sync complete. hi changed:', hiChanged, 'mr changed:', mrChanged);
}

main();
