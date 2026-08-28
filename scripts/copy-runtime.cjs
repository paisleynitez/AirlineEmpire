const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const copies = [
  ['game/js', 'dist/game/js'],
  ['game/assets', 'dist/game/assets'],
  ['assets/airline-identities/approved-250', 'dist/assets/airline-identities/approved-250'],
  ['version.dat', 'dist/version.dat'],
];

for (const [from, to] of copies) {
  const source = path.join(root, from);
  const target = path.join(root, to);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true });
}

console.log('Copied classic runtime scripts and external asset catalogs into dist.');
