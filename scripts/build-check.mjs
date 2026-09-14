import { readdir, readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
let failed = false;

const ok = (msg) => console.log(`  \u2713 ${msg}`);
const fail = (msg) => {
  failed = true;
  console.error(`  \u2717 ${msg}`);
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
};

console.log('Build check: validating backend import graph\u2026');
try {
  await import('../app.js');
  ok('backend modules: all imports and top-level code resolved');
} catch (err) {
  fail(`Import graph: ${err.stack || err.message}`);
}

console.log('Build check: compiling EJS templates\u2026');
const viewsDir = join(root, 'views');
let total = 0;
for (const file of await walk(viewsDir)) {
  if (extname(file) !== '.ejs') continue;
  total++;
  try {
    const source = await readFile(file, 'utf8');
    ejs.compile(source, { filename: file });
  } catch (err) {
    fail(`EJS template ${file.replace(viewsDir + '/', '')}: ${err.message}`);
  }
}
if (total) ok(`EJS templates: ${total} files compiled`);

if (failed) {
  console.error('\nBuild check FAILED. Fix the errors above before pushing.');
  process.exit(1);
}
console.log('\nBuild check passed. Safe to push.');