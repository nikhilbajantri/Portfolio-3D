// Synthesises the site's three original sounds and encodes them for the web.
//   drone  – 12 s seamless ambient loop (every partial completes whole cycles)
//   tick   – 45 ms soft UI tick
//   whoosh – 0.9 s filtered-noise transition
// Output: public/audio/<name>.webm (Opus) and .mp3 (Safari fallback).
// Usage: node scripts/generate-audio.mjs   (requires ffmpeg with libopus + libmp3lame)
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 48_000;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** Deterministic noise so regenerated files are identical. */
function noise(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s / 2147483647) * 2 - 1;
  };
}

function drone() {
  const seconds = 12;
  const n = RATE * seconds;
  const out = new Float32Array(n);
  // Frequencies × 12 s are all integers, so the loop point is seamless.
  const partials = [
    { f: 55, a: 0.32 },
    { f: 82.5, a: 0.16 },
    { f: 110, a: 0.12 },
    { f: 110.25, a: 0.1 },
    { f: 220.25, a: 0.03 },
  ];
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const swell = 0.75 + 0.25 * Math.sin(2 * Math.PI * (1 / 6) * t);
    const shimmer = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t);
    let v = 0;
    for (const { f, a } of partials) v += Math.sin(2 * Math.PI * f * t) * a * (f > 200 ? shimmer : 1);
    out[i] = v * swell * 0.7;
  }
  return out;
}

function tick() {
  const n = Math.round(RATE * 0.045);
  const out = new Float32Array(n);
  const rand = noise(7);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const env = Math.exp(-t * 140);
    out[i] = (Math.sin(2 * Math.PI * 2300 * t) * 0.5 + rand() * 0.12) * env * 0.6;
  }
  return out;
}

function whoosh() {
  const seconds = 0.9;
  const n = Math.round(RATE * seconds);
  const out = new Float32Array(n);
  const rand = noise(11);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    // Cutoff sweeps up then down; one-pole low-pass on white noise.
    const cutoff = 300 + 3200 * Math.sin(Math.PI * x);
    const alpha = 1 - Math.exp((-2 * Math.PI * cutoff) / RATE);
    lp += alpha * (rand() - lp);
    const env = Math.pow(Math.sin(Math.PI * x), 1.6);
    out[i] = lp * env * 1.1;
  }
  return out;
}

mkdirSync(OUT, { recursive: true });
const work = mkdtempSync(join(tmpdir(), 'nb-audio-'));
try {
  for (const [name, samples] of Object.entries({ drone: drone(), tick: tick(), whoosh: whoosh() })) {
    const src = join(work, `${name}.wav`);
    writeFileSync(src, wav(samples));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:a', 'libopus', '-b:a', '64k', join(OUT, `${name}.webm`)]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:a', 'libmp3lame', '-b:a', '96k', join(OUT, `${name}.mp3`)]);
    console.log(`audio/${name}.webm, audio/${name}.mp3`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
