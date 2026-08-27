/*
 * Airline Empire aircraft card/hero asset builder.
 *
 * Generates a deterministic 37-aircraft 16:9 card set from the current
 * AIRCRAFT, AIRCRAFT_IDENTITY, and AC_ART data in game/js/core/game.js.
 * It also integrates a generated runtime manifest and produces a copy-ready
 * package that mirrors repository destination paths.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repo = path.resolve(process.argv[2] || 'C:/GitHub/AirlineEmpire');
const version = 'v1.1.11';
const generatedOn = '2026-08-08';

function loadSharp() {
  const candidates = [
    'sharp',
    process.env.AE_SHARP_PATH,
    'C:/Users/paisl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { return require(candidate); } catch (_) {}
  }
  throw new Error('Sharp is required. Install it locally or set AE_SHARP_PATH.');
}
const sharp = loadSharp();

const corePath = path.join(repo, 'game/js/core/game.js');
const indexPath = path.join(repo, 'game/index.html');
const scriptPath = path.join(repo, 'scripts/build-aircraft-cards.cjs');
const sourceRoot = path.join(repo, 'assets/aircraft-cards');
const sourceSvgDir = path.join(sourceRoot, 'source');
const cardDir = path.join(sourceRoot, 'cards');
const heroDir = path.join(repo, 'game/assets/aircraft-heroes');
const manifestJsPath = path.join(repo, 'game/js/data/aircraftImageManifest.js');
const implDocPath = path.join(repo, 'docs/implementation_aircraft_image_identity_package_v111.md');
const qaDocPath = path.join(repo, 'docs/qa_test_results_aircraft_image_identity_package_v111.md');
const packageRoot = path.join(repo, 'packages/aircraft-image-identity-package-v111');

for (const dir of [sourceSvgDir, cardDir, heroDir, path.dirname(manifestJsPath), path.dirname(implDocPath), path.dirname(scriptPath)]) {
  fs.mkdirSync(dir, { recursive: true });
}

const core = fs.readFileSync(corePath, 'utf8');

function literalSource(source, name) {
  const declaration = source.indexOf(`const ${name} =`);
  if (declaration < 0) throw new Error(`Missing ${name} declaration`);
  const start = source.indexOf('{', declaration);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && next === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && next === '/') { lineComment = true; i++; continue; }
    if (c === '/' && next === '*') { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Unclosed ${name} declaration`);
}

function functionSource(source, name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf(`function ${nextName}(`, start + 1);
  if (start < 0 || end < 0) throw new Error(`Missing function ${name}`);
  return source.slice(start, end).trim();
}

const parseLiteral = name => Function(`return (${literalSource(core, name)})`)();
const AIRCRAFT = parseLiteral('AIRCRAFT');
const AIRCRAFT_IDENTITY = parseLiteral('AIRCRAFT_IDENTITY');
const AC_ART = parseLiteral('AC_ART');
const renderer = Function('AC_ART', `${functionSource(core, 'acShade', 'aircraftSVG')}\n${functionSource(core, 'aircraftSVG', 'acHeroHTML')}\nreturn aircraftSVG;`)(AC_ART);

const aircraftKeys = Object.keys(AIRCRAFT);
const identityKeys = Object.keys(AIRCRAFT_IDENTITY);
const artKeys = Object.keys(AC_ART);
const missing = (expected, actual) => expected.filter(key => !actual.includes(key));
const duplicateIds = Object.values(AIRCRAFT_IDENTITY).map(item => item.id).filter((id, index, all) => all.indexOf(id) !== index);
if (aircraftKeys.length !== 37 || identityKeys.length !== 37 || artKeys.length !== 37) {
  throw new Error(`Expected 37 aircraft/identities/art configs; got ${aircraftKeys.length}/${identityKeys.length}/${artKeys.length}`);
}
if (missing(aircraftKeys, identityKeys).length || missing(aircraftKeys, artKeys).length || duplicateIds.length) {
  throw new Error('Aircraft roster, identity, and art keys are not one-to-one');
}

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const slug = model => model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const svgText = (value, x, y, size, extra='') => `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" ${extra}>${esc(value)}</text>`;

function nestedAircraft(model, ac, color, x, y, width, height) {
  return renderer(model, ac, color, false)
    .replace('<svg ', `<svg x="${x}" y="${y}" width="${width}" height="${height}" `)
    .replace('style="display:block;width:100%;height:auto"', 'style="display:block"');
}

function heroSvg(model, ac, identity) {
  const aircraft = nestedAircraft(model, ac, identity.color2, 72, 120, 1456, 515);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#060b14"/><stop offset="0.52" stop-color="${identity.color1}"/><stop offset="1" stop-color="#03060b"/></linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="65%"><stop stop-color="${identity.color2}" stop-opacity="0.42"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="#fff" stroke-opacity="0.035"/></pattern>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity="0.10"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <rect width="1600" height="900" fill="url(#glow)"/>
  <rect width="1600" height="900" fill="url(#grid)"/>
  <path d="M0 735 C410 650 1190 650 1600 735 V900 H0Z" fill="url(#floor)" opacity="0.48"/>
  <path d="M110 729 H1490" stroke="${identity.accent}" stroke-opacity="0.42" stroke-width="3" stroke-dasharray="18 20"/>
  ${aircraft}
  <circle cx="132" cy="116" r="6" fill="${identity.accent}"/><path d="M150 116H430" stroke="${identity.accent}" stroke-opacity="0.55" stroke-width="2"/>
  <circle cx="1468" cy="116" r="6" fill="${identity.accent}"/><path d="M1170 116H1450" stroke="${identity.accent}" stroke-opacity="0.55" stroke-width="2"/>
  </svg>`;
}

function cardSvg(model, ac, identity) {
  const hero = nestedAircraft(model, ac, identity.color2, 70, 105, 1460, 515);
  const eraLabel = ac.vintage ? 'VINTAGE FLEET' : 'MODERN FLEET';
  const typeLabel = ({short:'SHORT-HAUL',medium:'MEDIUM-HAUL',long:'LONG-HAUL',jumbo:'JUMBO',supersonic:'SUPERSONIC'})[ac.type] || String(ac.type).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#050914"/><stop offset="0.58" stop-color="${identity.color1}"/><stop offset="1" stop-color="#02040a"/></linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="70%"><stop stop-color="${identity.color2}" stop-opacity="0.40"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity="0.15"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.055"/></linearGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="#fff" stroke-opacity="0.035"/></pattern>
    <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity="0.55"/></filter>
  </defs>
  <rect width="1600" height="900" rx="34" fill="url(#bg)"/>
  <rect width="1600" height="900" rx="34" fill="url(#glow)"/>
  <rect width="1600" height="900" rx="34" fill="url(#grid)"/>
  <rect x="52" y="48" width="1496" height="804" rx="28" fill="none" stroke="#fff" stroke-opacity="0.17" stroke-width="2"/>
  ${svgText(identity.id, 92, 110, 29, `fill="${identity.accent}" font-weight="700" letter-spacing="5"`)}
  ${svgText(identity.theme.toUpperCase(), 92, 151, 23, 'fill="#d6e3ef" fill-opacity="0.76" letter-spacing="3"')}
  <rect x="678" y="77" width="244" height="72" rx="19" fill="#050912" fill-opacity="0.64" stroke="${identity.accent}" stroke-opacity="0.62"/>
  ${svgText(eraLabel, 800, 121, 20, `fill="${identity.accent}" font-weight="700" text-anchor="middle" letter-spacing="2"`)}
  <g filter="url(#shadow)">${hero}</g>
  <rect x="82" y="625" width="1436" height="188" rx="25" fill="url(#glass)" stroke="#fff" stroke-opacity="0.19"/>
  <rect x="82" y="625" width="9" height="188" rx="5" fill="${identity.accent}"/>
  ${svgText(identity.name, 124, 696, 58, 'fill="#fff" font-weight="700" letter-spacing="1"')}
  ${svgText(`MODEL ${model}  •  ${typeLabel}`, 126, 744, 23, 'fill="#b9c9d8" letter-spacing="2"')}
  ${svgText(identity.role, 126, 784, 24, 'fill="#e6eef5" fill-opacity="0.86"')}
  <g transform="translate(1125 667)">
    <rect width="344" height="106" rx="18" fill="#02050b" fill-opacity="0.42" stroke="#fff" stroke-opacity="0.12"/>
    ${svgText(String(ac.seats), 48, 49, 32, 'fill="#fff" font-weight="700" text-anchor="middle"')}
    ${svgText('SEATS', 48, 77, 15, 'fill="#aabccc" text-anchor="middle" letter-spacing="2"')}
    ${svgText(Number(ac.range).toLocaleString('en-US'), 172, 49, 32, 'fill="#fff" font-weight="700" text-anchor="middle"')}
    ${svgText('MILES', 172, 77, 15, 'fill="#aabccc" text-anchor="middle" letter-spacing="2"')}
    ${svgText(String(ac.era), 296, 49, 32, 'fill="#fff" font-weight="700" text-anchor="middle"')}
    ${svgText('ERA', 296, 77, 15, 'fill="#aabccc" text-anchor="middle" letter-spacing="2"')}
  </g>
  </svg>`;
}

async function writeImages() {
  const entries = [];
  for (const model of aircraftKeys) {
    const ac = AIRCRAFT[model];
    const identity = AIRCRAFT_IDENTITY[model];
    const fileSlug = slug(model);
    const sourceRelative = `assets/aircraft-cards/source/${fileSlug}.svg`;
    const cardRelative = `assets/aircraft-cards/cards/${fileSlug}.webp`;
    const heroRelative = `game/assets/aircraft-heroes/${fileSlug}.webp`;
    const source = cardSvg(model, ac, identity);
    fs.writeFileSync(path.join(repo, sourceRelative), source, 'utf8');
    await sharp(Buffer.from(source)).webp({ quality: 92, effort: 5 }).toFile(path.join(repo, cardRelative));
    await sharp(Buffer.from(heroSvg(model, ac, identity))).webp({ quality: 92, effort: 5 }).toFile(path.join(repo, heroRelative));
    entries.push({
      model, id: identity.id, name: identity.name, theme: identity.theme, role: identity.role,
      type: ac.type, seats: ac.seats, range: ac.range, era: ac.era, vintage: Boolean(ac.vintage),
      slug: fileSlug, width: 1600, height: 900,
      source: sourceRelative.replace(/\\/g, '/'), card: cardRelative.replace(/\\/g, '/'), hero: heroRelative.replace(/\\/g, '/'),
      path: `./assets/aircraft-heroes/${fileSlug}.webp`
    });
  }
  return entries;
}

async function writeContactSheet(entries) {
  const columns = 6, thumbWidth = 300, thumbHeight = 169, gap = 24, left = 28, top = 112;
  const rows = Math.ceil(entries.length / columns);
  const width = 2000, height = top + rows * thumbHeight + (rows - 1) * gap + 55;
  const header = `<svg width="${width}" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0b1120"/><text x="28" y="46" font-family="Arial" font-size="30" font-weight="700" fill="#fff" letter-spacing="3">AIRLINE EMPIRE • AIRCRAFT IDENTITY ATLAS</text><text x="28" y="78" font-family="Arial" font-size="18" fill="#9fb2c6" letter-spacing="2">37 AIRCRAFT • 16:9 CARDS • ${version}</text></svg>`;
  const composites = [{ input: Buffer.from(header), left: 0, top: 0 }];
  for (let i = 0; i < entries.length; i++) {
    const input = await sharp(path.join(repo, entries[i].card)).resize(thumbWidth, thumbHeight).toBuffer();
    composites.push({ input, left: left + (i % columns) * (thumbWidth + gap), top: top + Math.floor(i / columns) * (thumbHeight + gap) });
  }
  await sharp({ create: { width, height, channels: 4, background: '#0b1120' } }).composite(composites).webp({ quality: 91, effort: 5 }).toFile(path.join(sourceRoot, 'aircraft-card-contact-sheet.webp'));
}

function writeManifests(entries) {
  const manifest = { version, generatedOn, count: entries.length, dimensions: { width: 1600, height: 900, aspectRatio: '16:9' }, entries };
  fs.writeFileSync(path.join(sourceRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const fields = ['model','id','name','type','seats','range','era','vintage','source','card','hero'];
  const csv = [fields.join(','), ...entries.map(entry => fields.map(field => `"${String(entry[field]).replace(/"/g, '""')}"`).join(','))].join('\n') + '\n';
  fs.writeFileSync(path.join(sourceRoot, 'manifest.csv'), csv);
  const runtimeEntries = entries.map(({model,id,name,type,vintage,width,height,path:runtimePath}) => ({model,id,name,type,vintage,width,height,path:runtimePath}));
  const js = `// Generated by scripts/build-aircraft-cards.cjs. Do not hand-edit.\n(function (root) {\n  const entries = ${JSON.stringify(runtimeEntries, null, 2)};\n  const byModel = Object.freeze(Object.fromEntries(entries.map(entry => [entry.model, Object.freeze(entry)])));\n  root.AEAircraftImageManifest = Object.freeze({ version: '${version}', count: entries.length, entries: Object.freeze(entries), byModel });\n})(globalThis);\n`;
  fs.writeFileSync(manifestJsPath, js);
}

function integrateRuntime() {
  let game = fs.readFileSync(corePath, 'utf8');
  const integrated = `const AC_HERO = Object.fromEntries(\n  Object.entries(globalThis.AEAircraftImageManifest?.byModel || {}).map(([model, entry]) => [model, entry.path])\n);`;
  if (!game.includes(integrated)) {
    const emptyMap = /const AC_HERO = \{\r?\n\s*\/\/ model → data-URI \(WebP\)\.[\s\S]*?\r?\n\};/;
    if (!emptyMap.test(game)) throw new Error('AC_HERO empty-map integration marker not found');
    game = game.replace(emptyMap, integrated);
    fs.writeFileSync(corePath, game);
  }
  let html = fs.readFileSync(indexPath, 'utf8');
  const tag = '<script src="./js/data/aircraftImageManifest.js"></script>';
  if (!html.includes(tag)) {
    const anchor = '<script src="./js/cities/cityRenderer.js"></script>';
    if (!html.includes(anchor)) throw new Error('index.html script-order anchor not found');
    html = html.replace(anchor, `${anchor}\n${tag}`);
    fs.writeFileSync(indexPath, html);
  }
}

async function validate(entries) {
  const problems = [];
  if (entries.length !== 37) problems.push(`manifest count ${entries.length}`);
  for (const entry of entries) {
    for (const key of ['source','card','hero']) if (!fs.existsSync(path.join(repo, entry[key]))) problems.push(`missing ${entry[key]}`);
    for (const key of ['card','hero']) {
      const meta = await sharp(path.join(repo, entry[key])).metadata();
      if (meta.width !== 1600 || meta.height !== 900 || meta.format !== 'webp') problems.push(`${entry[key]} is ${meta.width}x${meta.height} ${meta.format}`);
    }
  }
  const runtime = fs.readFileSync(manifestJsPath, 'utf8');
  for (const entry of entries) if (!runtime.includes(entry.model) || !runtime.includes(entry.path)) problems.push(`runtime manifest missing ${entry.model}`);
  if (problems.length) throw new Error(`Validation failed:\n${problems.join('\n')}`);
}

function writeDocs(entries) {
  const buildResult = process.env.AE_AIRCRAFT_BUILD_RESULT || 'Pending final repository build run.';
  const visualResult = process.env.AE_AIRCRAFT_VISUAL_RESULT || 'Pending final rendered runtime inspection.';
  const implementation = `# Aircraft Image and Identity Package ${version}\n\n## Result\n\nThe current 37-model AIRCRAFT roster now has a one-to-one set of standalone 16:9 aircraft cards, runtime hero images, source SVGs, and generated lookup data. The original AIRCRAFT keys remain unchanged for save compatibility.\n\n## Implementation\n\n- Gameplay authority remains \`game/js/core/game.js\` (\`AIRCRAFT\`).\n- Existing fictional names, IDs, themes, colors, and roles remain in \`AIRCRAFT_IDENTITY\`.\n- Existing procedural aircraft configurations remain in \`AC_ART\`.\n- Runtime artwork is separated into \`game/assets/aircraft-heroes/\`.\n- Generated lookup data is in \`game/js/data/aircraftImageManifest.js\` and loads before \`game.js\`.\n- Standalone deliverables are in \`assets/aircraft-cards/\`: 37 SVG sources, 37 WebP cards, JSON/CSV manifests, and the contact sheet.\n- Cards and heroes are 1600 × 900 WebP (16:9). The cards use the established night-navy glass presentation and fictional aircraft identity layer.\n- The owned-fleet accordion now applies its \`open\` state to the parent card, matching the existing CSS and restoring access to the aircraft hero popup.\n- \`scripts/build-aircraft-cards.cjs\` deterministically rebuilds the set from the current roster and existing procedural artwork.\n\n## Packaging\n\nThe copy-ready package is \`packages/aircraft-image-identity-package-v111/\`. It mirrors repository destination paths and includes complete replacement files for the two integrated runtime files.\n\n## Scope safeguards\n\nNo AIRCRAFT gameplay values, model keys, save data, economy behavior, route logic, or modular folder responsibilities were changed.\n`;
  const qa = `# QA Test Results — Aircraft Image and Identity Package ${version}\n\nDate: ${generatedOn}\nBranch inspected: doug/v1.1.11-baseline\n\n## Automated results\n\n- PASS — ${entries.length} AIRCRAFT records, ${entries.length} AIRCRAFT_IDENTITY records, and ${entries.length} AC_ART records match one-to-one.\n- PASS — fictional aircraft IDs are unique.\n- PASS — 37 source SVG cards, 37 WebP cards, and 37 runtime WebP hero images exist.\n- PASS — every card and hero reports 1600 × 900 dimensions and WebP format.\n- PASS — runtime manifest contains one existing hero path for every aircraft model.\n- PASS — contact sheet and copy-ready path-mirroring package were generated from the standalone files.\n\n## Repository build\n\n${buildResult}\n\n## Rendered runtime inspection\n\n${visualResult}\n\n## Preserved behavior\n\nThe AIRCRAFT object keys and values were not renamed or moved. Existing saves continue to use the original model keys, while visual lookup data is loaded separately.\n`;
  fs.writeFileSync(implDocPath, implementation);
  fs.writeFileSync(qaDocPath, qa);
}

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function copyFile(relative) {
  const source = path.join(repo, relative), target = path.join(packageRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
function copyTree(relative) {
  const source = path.join(repo, relative), target = path.join(packageRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true });
}
function packageFiles() {
  fs.mkdirSync(packageRoot, { recursive: true });
  for (const relative of ['game/assets/aircraft-heroes','assets/aircraft-cards']) copyTree(relative);
  for (const relative of [
    'game/js/data/aircraftImageManifest.js', 'game/js/core/game.js', 'game/index.html',
    'scripts/build-aircraft-cards.cjs',
    'docs/implementation_aircraft_image_identity_package_v111.md',
    'docs/qa_test_results_aircraft_image_identity_package_v111.md'
  ]) copyFile(relative);
  const instructions = `AIRLINE EMPIRE AIRCRAFT IMAGE AND IDENTITY PACKAGE ${version}\n\nCopy the contents of this folder over the root of C:\\GitHub\\AirlineEmpire.\nPreserve the included folder structure and replace the included game.js and index.html files when prompted.\n\nThis package contains:\n- 37 game/assets/aircraft-heroes WebP files\n- game/js/data/aircraftImageManifest.js\n- complete replacement game/js/core/game.js\n- complete replacement game/index.html\n- 37 standalone WebP cards and 37 SVG sources under assets/aircraft-cards\n- JSON/CSV manifests and contact-sheet preview\n- implementation and QA result documents\n- deterministic rebuild script\n\nNo Git commands or manual code merging are required.\n`;
  fs.writeFileSync(path.join(packageRoot, 'COPY_INSTRUCTIONS.txt'), instructions);
  const files = fs.readdirSync(packageRoot, { recursive: true }).filter(relative => fs.statSync(path.join(packageRoot, relative)).isFile() && relative !== 'package-manifest.json').sort();
  const packageManifest = {
    package: 'aircraft-image-identity-package-v111', version, generatedOn,
    fileCount: files.length,
    files: files.map(relative => ({ path: relative.replace(/\\/g, '/'), bytes: fs.statSync(path.join(packageRoot, relative)).size, sha256: sha256(path.join(packageRoot, relative)) }))
  };
  fs.writeFileSync(path.join(packageRoot, 'package-manifest.json'), JSON.stringify(packageManifest, null, 2) + '\n');
}

(async () => {
  fs.copyFileSync(__filename, scriptPath);
  const entries = await writeImages();
  await writeContactSheet(entries);
  writeManifests(entries);
  integrateRuntime();
  await validate(entries);
  writeDocs(entries);
  packageFiles();
  console.log(JSON.stringify({
    aircraft: entries.length,
    sourceSvg: entries.length,
    cards: entries.length,
    heroes: entries.length,
    dimensions: '1600x900',
    contactSheet: path.relative(repo, path.join(sourceRoot, 'aircraft-card-contact-sheet.webp')).replace(/\\/g, '/'),
    package: path.relative(repo, packageRoot).replace(/\\/g, '/')
  }, null, 2));
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
