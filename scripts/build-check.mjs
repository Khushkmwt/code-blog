import { readdir, readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';

const execFileAsync = promisify(execFile);

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

const main = async () => {
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

  console.log('Build check: validating sanitize-html loads as CommonJS (what Render does)\u2026');
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      ['--no-experimental-require-module', '-e',
        "const sanitize = require('sanitize-html');" +
        "process.stdout.write(sanitize('<h1>hi <script>bad()</script></h1>', { allowedTags: ['h1'], allowedAttributes: {} }));"],
      { cwd: root, encoding: 'utf8' }
    );
    const clean = stdout.trim();
    if (clean !== '<h1>hi </h1>') {
      fail(`sanitize-html CJS load: unexpected output ${JSON.stringify(clean)}`);
    } else {
      ok('sanitize-html loads and runs under strict CommonJS');
    }
  } catch (err) {
    fail(`sanitize-html CJS load: ${(err.stderr || err.message).split('\n').slice(0, 3).join(' ')}`);
  }

  if (failed) {
    console.error('\nBuild check FAILED. Fix the errors above before pushing.');
    process.exit(1);
  }
  console.log('\nBuild check passed. Safe to push.');
};

main();
