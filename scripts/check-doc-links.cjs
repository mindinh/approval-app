// Check repository-local Markdown links recursively; no network requests.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const files = walk(path.join(root, 'docs')).filter(file => file.endsWith('.md'));
let checked = 0;
const errors = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    checked++;
    if (/^file:/i.test(href)) {
      errors.push(`${path.relative(root, file)}: non-portable link ${href}`);
      continue;
    }
    const target = path.resolve(path.dirname(file), decodeURIComponent(href.split('#')[0]));
    if (!fs.existsSync(target)) errors.push(`${path.relative(root, file)}: missing ${href}`);
  }
}
console.log(`${files.length} Markdown files; ${checked} local file links checked.`);
for (const error of errors) console.error(error);
console.log(`${errors.length} link errors. Heading fragments and external URLs are not checked.`);
process.exitCode = errors.length ? 1 : 0;
