const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function findBrowser(){
  const candidates = [
    process.env.AE_BROWSER_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/microsoft-edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate));
}

function contentType(filename){
  const types = {
    '.css': 'text/css', '.gif': 'image/gif', '.html': 'text/html',
    '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'text/javascript',
    '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
  return types[path.extname(filename).toLowerCase()] || 'application/octet-stream';
}

function createServer(){
  return http.createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    } catch {
      response.writeHead(400).end();
      return;
    }
    if (pathname === '/favicon.ico') {
      response.writeHead(204).end();
      return;
    }
    if (pathname === '/') pathname = '/game/';
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filename = path.resolve(root, `.${pathname}`);
    if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    fs.readFile(filename, (error, body) => {
      if (error) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
        return;
      }
      if (pathname === '/game/index.html' && new URL(request.url, 'http://localhost').searchParams.has('cycle')) {
        body = Buffer.from(body.toString().replace('</body>', '<script src="/tests/fixtures/month-end-cycle.js"></script></body>'));
      }
      response.writeHead(200, { 'Content-Type': contentType(filename) });
      response.end(body);
    });
  });
}

function listen(server){
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server){
  return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

function dumpDom(browser, url, savedProfile){
  const profile = savedProfile || fs.mkdtempSync(path.join(root, 'output-browser-'));
  return new Promise((resolve, reject) => {
    const child = spawn(browser, [
      '--headless=new',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-gpu',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-sandbox',
      '--mute-audio',
      '--window-size=1024,768',
      '--virtual-time-budget=12000',
      '--dump-dom',
      `--user-data-dir=${profile}`,
      url,
    ], { windowsHide: true });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => child.kill(), 30000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', error => {
      clearTimeout(timeout);
      if (!savedProfile) fs.rmSync(profile, { recursive: true, force: true });
      reject(error);
    });
    child.once('close', code => {
      clearTimeout(timeout);
      if (!savedProfile) fs.rmSync(profile, { recursive: true, force: true });
      if (code !== 0) {
        reject(new Error(`Browser exited with code ${code}: ${stderr.slice(-1200)}`));
        return;
      }
      resolve(stdout);
    });
  });
}

const browser = findBrowser();

test('browser runtime honors explicit dev control opt-out and opt-in', {
  skip: browser ? false : 'No supported Chromium browser found',
  timeout: 75000,
}, async () => {
  const server = createServer();
  const port = await listen(server);
  try {
    const base = `http://127.0.0.1:${port}/game/`;
    const defaultDom = await dumpDom(browser, `${base}?dev=0`);
    assert.match(defaultDom, /<div id="intro"/);
    assert.doesNotMatch(defaultDom, /<html[^>]*class="[^"]*ae-dev-mode/);
    assert.doesNotMatch(defaultDom, /id="dev-skip-btn"/);

    const devDom = await dumpDom(browser, `${base}?dev=1`);
    assert.match(devDom, /<html[^>]*class="[^"]*ae-dev-mode/);
    assert.match(devDom, /id="dev-skip-btn"/);
    assert.match(devDom, /id="dt-launch"[^>]*>.*Tune/s);
  } finally {
    await close(server);
  }
});


for (const dev of [0, 1]) {
  test(`month-end gameplay survives a fresh browser save/reload cycle (dev=${dev})`, {
    skip: browser ? false : 'No supported Chromium browser found',
    timeout: 75000,
  }, async () => {
    const server = createServer();
    const port = await listen(server);
    const profile = fs.mkdtempSync(path.join(root, 'output-browser-cycle-'));
    try {
      for (const stage of ['save', 'reload']) {
        const dom = await dumpDom(browser, `http://127.0.0.1:${port}/game/?dev=${dev}&cycle=${stage}`, profile);
        const result = dom.match(/<pre id="cycle-result">([^<]*)<\/pre>/);
        assert.ok(result, `No cycle result for ${stage}: ${dom.slice(-1500)}`);
        assert.equal(result[1], `PASS ${stage}`, result[1]);
      }
    } finally {
      await close(server);
      fs.rmSync(profile, { recursive: true, force: true });
    }
  });
}
