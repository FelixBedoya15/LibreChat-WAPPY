// Comprueba el vídeo final.
//   node tools/comprobar.mjs [out/archivo.mp4]              pistas, duración, arranque de audio y vídeo + hoja de 9 fotogramas
//   node tools/comprobar.mjs [out/archivo.mp4] --palabras   además, un fotograma del MP4 en cada tiempo de T (index.html):
//                                                           sirve para ver que cada cosa aparece con su palabra
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const PALABRAS = args.includes('--palabras');
const dir = 'out';
const F = args.find(a => !a.startsWith('--')) || (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.mp4')).map(f => path.join(dir, f))
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] : null);
if (!F || !fs.existsSync(F)) { console.error('No hay vídeo que comprobar (render primero o pasa la ruta).'); process.exit(1); }

const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries',
  'stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,start_time,duration:format=duration,size',
  '-of', 'json', F]).toString());
const v = info.streams.find(s => s.codec_type === 'video'), a = info.streams.find(s => s.codec_type === 'audio');
const dur = +info.format.duration, mb = (+info.format.size / 1048576).toFixed(1);
console.log(`Archivo: ${F}  (${mb} MB, ${dur.toFixed(2)} s)`);
console.log(`Vídeo:   ${v.codec_name} ${v.width}x${v.height} @ ${v.r_frame_rate} · empieza en ${(+v.start_time).toFixed(3)} s`);
console.log(a ? `Audio:   ${a.codec_name} ${a.sample_rate} Hz ${a.channels} canales · empieza en ${(+a.start_time).toFixed(3)} s · dura ${(+a.duration).toFixed(2)} s`
  : 'Audio:   (sin pista de audio)');
const avisos = [];
if (a && Math.abs(+a.start_time - +v.start_time) > 0.03) avisos.push('el audio y el vídeo no empiezan a la vez');
if (a && Math.abs(+a.duration - dur) > 0.25) avisos.push('la pista de audio no dura lo mismo que el vídeo');
if (+mb > 30) avisos.push(`pesa ${mb} MB: SendUserFile no lo entrega en el móvil/web (límite 30 MB), solo en la app de escritorio`);
avisos.forEach(x => console.log('AVISO: ' + x));

fs.mkdirSync('trabajo/comprobar', { recursive: true });
const font = process.platform === 'win32' ? "fontfile='C\\:/Windows/Fonts/arial.ttf':" : '';
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "’").replace(/:/g, '\\:').replace(/\./g, '\\.');

// hoja de fotogramas del MP4, cols x filas, con una etiqueta en cada uno
function hoja(ts, etiquetas, salida, cols, tw) {
  const th = Math.round(tw * v.height / v.width), rows = Math.ceil(ts.length / cols);
  const inputs = [];
  ts.forEach((t, i) => {
    const f = `trabajo/comprobar/f${i}.png`;
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(Math.max(0, Math.min(t, dur - .02))), '-i', F, '-frames:v', '1', '-vf', `scale=${tw}:${th}`, f]);
    inputs.push('-i', f);
  });
  const build = conTexto => {
    const filt = ts.map((_, i) => `[${i}:v]` + (conTexto ? `drawtext=${font}text='${esc(etiquetas[i])}':x=10:y=8:fontsize=${Math.round(tw / 30)}:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=5` : 'null') + `[v${i}]`);
    const extra = [];
    for (let i = ts.length; i < rows * cols; i++) { extra.push('-f', 'lavfi', '-i', `color=c=black:s=${tw}x${th}:d=1`); filt.push(`[${i}:v]null[v${i}]`); }
    const layout = Array.from({ length: rows * cols }, (_, i) => `${(i % cols) * tw}_${Math.floor(i / cols) * th}`).join('|');
    filt.push(`${Array.from({ length: rows * cols }, (_, i) => `[v${i}]`).join('')}xstack=inputs=${rows * cols}:layout=${layout}[o]`);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, ...extra, '-filter_complex', filt.join(';'), '-map', '[o]', '-frames:v', '1', salida], { stdio: ['ignore', 'ignore', 'pipe'] });
  };
  try { build(true); } catch { build(false); }
}

const ts = Array.from({ length: 9 }, (_, i) => +(dur * (i + .5) / 9).toFixed(2));
hoja(ts, ts.map(t => `${t.toFixed(2)} s`), 'trabajo/comprobar/hoja_mp4.png', 3, 640);
console.log(`Hoja del MP4: trabajo/comprobar/hoja_mp4.png`);

if (PALABRAS) {
  // tiempos de T leídos de la propia página (así coinciden con lo que se animó)
  const { chromium } = await import('playwright-core');
  const { serve } = await import('../server.mjs');
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html?render`);
  await page.evaluate(() => window.__ready);
  const T = await page.evaluate(() => window.__T || {});
  await browser.close(); srv.close();
  const lista = Object.entries(T).filter(([, t]) => typeof t === 'number' && t >= 0 && t < dur).sort((x, y) => x[1] - y[1]);
  if (!lista.length) { console.log('No encuentro window.__T en index.html (añade: window.__T = T;).'); process.exit(0); }
  // 0,12 s después del inicio de cada palabra: el elemento ya tiene que estar entrando
  for (let p = 0; p * 12 < lista.length; p++) {
    const trozo = lista.slice(p * 12, p * 12 + 12);
    const out = `trabajo/comprobar/palabras_${p + 1}.png`;
    hoja(trozo.map(([, t]) => t + .12), trozo.map(([k, t]) => `${k} ${t.toFixed(2)} s`), out, 4, 480);
    console.log(`Hoja por palabras: ${out}  (${trozo.map(([k]) => k).join(', ')})`);
  }
}
