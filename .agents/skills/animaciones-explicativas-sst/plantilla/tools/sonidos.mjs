// Lee de index.html los efectos de sonido (sfx(t, 'nombre', {vol, pan})), el estilo y la voz, y los deja en
// trabajo/sonidos.json para la mezcla (scripts/sonido.py). Lo lanzan 'anim.py render', 'anim.py montar' y 'anim.py sonido'.
//   node tools/sonidos.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { serve } from '../server.mjs';

const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage();
const errores = [];
page.on('pageerror', e => errores.push(e.message));
await page.goto(`http://127.0.0.1:${srv.address().port}/index.html?render`);
await page.evaluate(() => window.__ready);
const d = await page.evaluate(() => ({
  dur: window.__CONFIG.dur, voz: window.__CONFIG.audio || '', estilo: window.__ESTILO || {},
  cues: (window.__SFX || []).map(c => ({ t: c.t, id: c.id, vol: c.vol ?? 1, pan: c.pan ?? 0 })),
}));
await browser.close(); srv.close();
if (errores.length) console.log('ERRORES EN LA PÁGINA:\n  ' + [...new Set(errores)].join('\n  '));
fs.mkdirSync('trabajo', { recursive: true });
fs.writeFileSync('trabajo/sonidos.json', JSON.stringify(d, null, 1));
console.log(`${d.cues.length} efectos · sonido: ${d.estilo.sonido || 'voz'}${d.estilo.sonido === 'musica' ? ' (' + (d.estilo.musica || 'intro-scifi') + ')' : ''} -> trabajo/sonidos.json`);
