// Renderiza la animación a MP4 con la voz. Duración, audio y tamaño salen de CONFIG en index.html.
//   node render.mjs                         -> 1920x1080, 60 fps, con la voz
//   node render.mjs --fps=30 --scale=2      -> 3840x2160, 30 fps
//   node render.mjs --from=15 --to=20       -> solo un tramo (pruebas)
//   node render.mjs --noaudio               -> sin pista de audio
//   node render.mjs --audio=assets/audio/mezcla.wav   -> otra pista (la mezcla con efectos y música)
//   node render.mjs --capas=2160            -> modos capas/combinado: juego de fotogramas de la grabación a usar
//   node render.mjs --out=out/v2.mp4        -> otro nombre
// Cada fotograma se pinta con window.__render(t) y se captura en PNG; ffmpeg lo codifica.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { serve } from './server.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v = '1'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const FPS = +(arg.fps || 60), SCALE = +(arg.scale || 1);
const WORKERS = +(arg.workers || Math.max(2, Math.min(10, os.cpus().length - 2)));
let NOAUDIO = 'noaudio' in arg;

const srv = await serve();
const url = `http://127.0.0.1:${srv.address().port}/index.html?render${arg.capas ? '&capas=' + arg.capas : ''}`;
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--hide-scrollbars'] });

// configuración desde la propia página
const probe = await browser.newPage();
await probe.goto(url);
await probe.evaluate(() => window.__ready);
const CONFIG = await probe.evaluate(() => window.__CONFIG);
await probe.close();
const VW = CONFIG.ancho || 1920, VH = CONFIG.alto || 1080, DUR = CONFIG.dur;
const FROM = +(arg.from || 0), TO = Math.min(+(arg.to || DUR), DUR);
const N = Math.round((TO - FROM) * FPS);
const W = VW * SCALE, H = VH * SCALE;
const NOMBRE = path.basename(ROOT);
const OUT = path.resolve(ROOT, arg.out || `out/${NOMBRE}_${H}p${FPS}.mp4`);
if (!CONFIG.audio && !arg.audio) NOAUDIO = true;   // proyecto sin voz (anim.py nuevo --dur) y sin mezcla de efectos: vídeo sin pista de audio
const AUDIO = NOAUDIO ? '' : path.resolve(ROOT, arg.audio || CONFIG.audio);
if (!NOAUDIO && !fs.existsSync(AUDIO)) { console.error(`No encuentro el audio ${AUDIO} (usa --noaudio o revisa CONFIG.audio)`); process.exit(1); }
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const ff = spawn('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  ...(NOAUDIO ? [] : ['-ss', String(FROM), '-t', String(N / FPS), '-i', AUDIO, '-map', '0:v', '-map', '1:a']),
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
  '-c:v', 'libx264', '-preset', arg.preset || 'slow', '-crf', arg.crf || '15', '-profile:v', 'high',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  ...(NOAUDIO ? [] : ['-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2']), '-movflags', '+faststart', OUT,   // 48 kHz estéreo: lo estándar para editar vídeo
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));

// escritura ordenada: los procesos entregan fotogramas y se escriben en orden
const ready = new Map();
let nextWrite = 0, nextFrame = 0;
const t0 = Date.now();
async function deliver(i, buf) {
  ready.set(i, buf);
  while (ready.has(nextWrite)) {
    const b = ready.get(nextWrite); ready.delete(nextWrite); nextWrite++;
    if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
    if (nextWrite % 120 === 0 || nextWrite === N) {
      const s = (Date.now() - t0) / 1000;
      process.stdout.write(`\r  ${nextWrite}/${N} fotogramas  ·  ${(nextWrite / s).toFixed(1)} fps  ·  ${s.toFixed(0)} s   `);
    }
  }
}

async function worker() {
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: SCALE });
  page.on('pageerror', e => console.error('\n[pageerror]', e.message));
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  const cdp = await page.context().newCDPSession(page);
  for (;;) {
    const i = nextFrame++;
    if (i >= N) break;
    while (i - nextWrite > 40) await new Promise(r => setTimeout(r, 4));   // no adelantarse demasiado
    await page.evaluate(t => window.__render(t), FROM + i / FPS);
    // clip con scale: sin él, CDP devuelve la captura a 1x aunque la página tenga deviceScaleFactor 2 (--scale=2 salía a 1080p)
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, fromSurface: true, clip: { x: 0, y: 0, width: VW, height: VH, scale: SCALE } });
    await deliver(i, Buffer.from(data, 'base64'));
  }
  await page.close();
}

console.log(`Render ${W}x${H} @ ${FPS} fps · ${N} fotogramas · ${WORKERS} procesos -> ${OUT}`);
await Promise.all(Array.from({ length: WORKERS }, worker));
ff.stdin.end();
await ffDone;
await browser.close();
srv.close();
console.log(`\nListo en ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${OUT}`);
