// Fotogramas sueltos para revisar y, con --sheet, una hoja de contactos (3 columnas, a 640x360, con el tiempo impreso).
//   node tools/stills.mjs <carpeta> t1 t2 t3 ...
//   node tools/stills.mjs <carpeta> --sheet=hoja1 t1 t2 ...
// Los PNG sueltos salen a tamaño real: úsalos para revisar la legibilidad de cerca.
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from '../server.mjs';

const args = process.argv.slice(2);
const outDir = args.shift();
const sheet = (args.find(a => a.startsWith('--sheet=')) || '').slice(8);
const times = args.filter(a => !a.startsWith('--'));
if (!outDir || !times.length) { console.log('uso: node tools/stills.mjs <carpeta> [--sheet=nombre] t1 t2 ...'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const srv = await serve();
const url = `http://127.0.0.1:${srv.address().port}/index.html?render`;
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
let page = await browser.newPage();
await page.goto(url);
await page.evaluate(() => window.__ready);
const CONFIG = await page.evaluate(() => window.__CONFIG);
await page.setViewportSize({ width: CONFIG.ancho || 1920, height: CONFIG.alto || 1080 });
const errores = [];
page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
page.on('pageerror', e => errores.push(e.message));
const files = [];
for (const t of times) {
  await page.evaluate(t => window.__render(t), +t);
  const f = path.join(outDir, `t_${(+t).toFixed(2).padStart(5, '0')}.png`);
  await page.screenshot({ path: f });
  files.push(f);
}
await browser.close();
srv.close();
if (errores.length) console.log('ERRORES EN LA PÁGINA:\n  ' + [...new Set(errores)].join('\n  '));

if (sheet) {
  const cols = 3, rows = Math.ceil(files.length / cols), tw = 640, th = Math.round(640 * (CONFIG.alto || 1080) / (CONFIG.ancho || 1920));
  const font = process.platform === 'win32' ? "fontfile='C\\:/Windows/Fonts/arial.ttf':" : '';
  const build = withText => {
    const inputs = [], filters = [];
    files.forEach((f, i) => {
      inputs.push('-i', f);
      const tt = (+times[i]).toFixed(2).replace('.', '\\.');
      filters.push(`[${i}:v]scale=${tw}:${th}` + (withText ? `,drawtext=${font}text='${tt} s':x=12:y=10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6` : '') + `[v${i}]`);
    });
    for (let i = files.length; i < rows * cols; i++) { inputs.push('-f', 'lavfi', '-i', `color=c=black:s=${tw}x${th}:d=1`); filters.push(`[${i}:v]null[v${i}]`); }
    const layout = Array.from({ length: rows * cols }, (_, i) => `${(i % cols) * tw}_${Math.floor(i / cols) * th}`).join('|');
    filters.push(`${Array.from({ length: rows * cols }, (_, i) => `[v${i}]`).join('')}xstack=inputs=${rows * cols}:layout=${layout}[out]`);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '[out]', '-frames:v', '1', path.join(outDir, `${sheet}.png`)], { stdio: ['ignore', 'ignore', 'pipe'] });
  };
  try { build(true); } catch { build(false); }   // sin fuente para drawtext: hoja sin tiempos impresos
  console.log(`hoja: ${path.join(outDir, sheet + '.png')}`);
}
console.log('ok', times.length);
