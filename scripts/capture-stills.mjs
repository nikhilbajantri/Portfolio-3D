// Captures scene-only stills of the 3D journey for the Quick view and no-WebGL fallback.
// Runs headless Chrome (SwiftShader WebGL) against the *dev* server, because the
// ?quality=high override is development-only, then encodes AVIF + WebP with ffmpeg.
//
// Usage: pnpm dev   (in another terminal)
//        node scripts/capture-stills.mjs [http://localhost:3000]
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] ?? 'http://localhost:3000';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'fallback');
const WIDTH = 1600;
const HEIGHT = 1000;
const OUTPUT_WIDTH = 1200;

/**
 * Journey beats to capture (progress values match lib/spline + the scene windows).
 * After BOOT every scene is framed right of the copy column, so those stills keep
 * only the right-hand scene area.
 */
const STILLS = [
  { name: 'boot', progress: 0, crop: false },
  { name: 'studio', progress: 0.33, crop: true },
  { name: 'data', progress: 0.73, crop: true },
  { name: 'kernel', progress: 0.82, crop: true },
];
const SCENE_CROP = 'crop=iw*0.62:ih:iw*0.37:0';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const work = mkdtempSync(join(tmpdir(), 'nb-stills-'));
const chrome = spawn(
  'google-chrome-stable',
  [
    '--headless=new', '--remote-debugging-port=9335', `--user-data-dir=${join(work, 'profile')}`,
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    `--window-size=${WIDTH},${HEIGHT}`, '--hide-scrollbars', '--no-first-run', 'about:blank',
  ],
  { stdio: 'ignore' },
);

try {
  let targets;
  for (let i = 0; i < 50 && !targets; i++) {
    try {
      targets = await (await fetch('http://127.0.0.1:9335/json')).json();
    } catch {
      await sleep(200);
    }
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const evaluate = (expression) => send('Runtime.evaluate', { expression, awaitPromise: true });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${base}/?quality=high` });
  await sleep(9000); // boot sequence + particle assembly

  // Scene only: hide every DOM layer above the canvas.
  await evaluate(`(() => {
    const s = document.createElement('style');
    s.textContent = 'main, header, nav, output, [role=progressbar], [role=status], nextjs-portal { visibility: hidden !important; }';
    document.head.appendChild(s);
  })()`);

  mkdirSync(OUT, { recursive: true });
  for (const { name, progress, crop } of STILLS) {
    await evaluate(`window.scrollTo(0, ${progress} * (document.documentElement.scrollHeight - innerHeight))`);
    await sleep(3500);
    const { result } = await send('Page.captureScreenshot', { format: 'png' });
    const png = join(work, `${name}.png`);
    writeFileSync(png, Buffer.from(result.data, 'base64'));
    const width = crop ? Math.round(OUTPUT_WIDTH * 0.62) : OUTPUT_WIDTH;
    const scale = ['-vf', `${crop ? `${SCENE_CROP},` : ''}scale=${width}:-2`];
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, ...scale, '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '34', '-b:v', '0', join(OUT, `${name}.avif`)]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, ...scale, '-c:v', 'libwebp', '-quality', '78', join(OUT, `${name}.webp`)]);
    console.log(`fallback/${name}.avif, fallback/${name}.webp`);
  }
  ws.close();
} finally {
  chrome.kill();
  rmSync(work, { recursive: true, force: true });
}
