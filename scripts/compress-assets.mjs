// Compresses source assets in assets-src/ into web-ready files in public/.
//
//   assets-src/models/*.glb|gltf     → public/models/<name>.glb     (gltf-transform: Meshopt + KTX2/WebP textures)
//   assets-src/textures/*.png|jpg    → public/textures/<name>.ktx2  (toktx UASTC; AVIF + WebP when toktx is missing)
//   assets-src/videos/*.mp4|mov|...  → public/videos/<name>.mp4 + .webm (≤ 2 MB each, muted) + poster .avif/.webp
//   assets-src/images/*.png|jpg      → public/images/<name>.avif + .webp
//
// Requires ffmpeg/ffprobe. Optional: toktx (KTX-Software) for KTX2. gltf-transform is
// fetched with npx only when there are models to process.
// Usage: node scripts/compress-assets.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets-src');
const PUBLIC = join(ROOT, 'public');
const VIDEO_MAX_BYTES = 2 * 1024 * 1024;
const VIDEO_WIDTH = 1280;

const has = (bin, flag = '--version') => {
  try {
    execFileSync(bin, [flag], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
const run = (bin, args) => execFileSync(bin, args, { stdio: ['ignore', 'ignore', 'inherit'] });
const ff = (args) => run('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
const kb = (file) => `${Math.round(statSync(file).size / 1024)} KB`;
const sources = (dir, exts) =>
  existsSync(join(SRC, dir))
    ? readdirSync(join(SRC, dir))
        .filter((f) => exts.includes(extname(f).toLowerCase()))
        .map((f) => ({ path: join(SRC, dir, f), name: basename(f, extname(f)) }))
    : [];
const out = (dir) => {
  const path = join(PUBLIC, dir);
  mkdirSync(path, { recursive: true });
  return path;
};

const HAS_TOKTX = has('toktx');
if (!has('ffmpeg', '-version')) {
  console.error('ffmpeg is required.');
  process.exit(1);
}

// ── Models ──────────────────────────────────────────────────────────────
const models = sources('models', ['.glb', '.gltf']);
for (const { path, name } of models) {
  const target = join(out('models'), `${name}.glb`);
  run('npx', [
    '--yes', '@gltf-transform/cli@4', 'optimize', path, target,
    '--compress', 'meshopt',
    '--texture-compress', HAS_TOKTX ? 'ktx2' : 'webp',
    '--texture-size', '2048',
  ]);
  console.log(`models/${name}.glb  ${kb(target)}`);
}

// ── Textures ────────────────────────────────────────────────────────────
for (const { path, name } of sources('textures', ['.png', '.jpg', '.jpeg'])) {
  const dir = out('textures');
  if (HAS_TOKTX) {
    const target = join(dir, `${name}.ktx2`);
    run('toktx', ['--t2', '--encode', 'uastc', '--uastc_quality', '2', '--zcmp', '18', '--genmipmap', target, path]);
    console.log(`textures/${name}.ktx2  ${kb(target)}`);
  } else {
    ff(['-i', path, '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '30', '-b:v', '0', join(dir, `${name}.avif`)]);
    ff(['-i', path, '-c:v', 'libwebp', '-quality', '82', join(dir, `${name}.webp`)]);
    console.log(`textures/${name}.avif/.webp  (install KTX-Software's toktx for KTX2)`);
  }
}

// ── Videos (studio frame screen recordings) ────────────────────────────
for (const { path, name } of sources('videos', ['.mp4', '.mov', '.webm', '.mkv', '.m4v'])) {
  const dir = out('videos');
  const duration = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).toString().trim(),
  );
  const scale = ['-vf', `scale='min(${VIDEO_WIDTH},iw)':-2,fps=30`];
  // Bitrate budget that keeps each file under 2 MB; shrink and retry if it overshoots.
  const encode = (container, factor) => {
    const kbps = Math.floor(((VIDEO_MAX_BYTES * 8) / 1000 / Math.max(duration, 1)) * 0.92 * factor);
    const target = join(dir, `${name}.${container}`);
    const codec =
      container === 'mp4'
        ? ['-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-preset', 'slow']
        : ['-c:v', 'libvpx-vp9', '-row-mt', '1', '-deadline', 'good'];
    ff(['-i', path, ...scale, '-an', ...codec, '-b:v', `${kbps}k`, '-maxrate', `${kbps}k`, '-bufsize', `${kbps * 2}k`, target]);
    return target;
  };
  for (const container of ['mp4', 'webm']) {
    let factor = 1;
    let target = encode(container, factor);
    while (statSync(target).size > VIDEO_MAX_BYTES && factor > 0.4) {
      factor *= 0.8;
      target = encode(container, factor);
    }
    console.log(`videos/${name}.${container}  ${kb(target)}`);
  }
  const at = Math.min(1, duration / 2).toFixed(2);
  ff(['-ss', at, '-i', path, '-frames:v', '1', ...scale, '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '32', '-b:v', '0', join(dir, `${name}-poster.avif`)]);
  ff(['-ss', at, '-i', path, '-frames:v', '1', ...scale, '-c:v', 'libwebp', '-quality', '80', join(dir, `${name}-poster.webp`)]);
  console.log(`videos/${name}-poster.avif/.webp  (set *_VIDEO / *_POSTER in content/data.ts)`);
}

// ── Images ──────────────────────────────────────────────────────────────
for (const { path, name } of sources('images', ['.png', '.jpg', '.jpeg'])) {
  const dir = out('images');
  ff(['-i', path, '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '30', '-b:v', '0', join(dir, `${name}.avif`)]);
  ff(['-i', path, '-c:v', 'libwebp', '-quality', '80', join(dir, `${name}.webp`)]);
  console.log(`images/${name}.avif/.webp  ${kb(join(dir, `${name}.avif`))}`);
}

if (!existsSync(SRC)) console.log('No assets-src/ directory: nothing to compress.');
