// Hoja con todos los logos de assets/logos sobre el fondo de la animación (#0a0c10), para comprobar
// antes de construir que son los correctos, que se ven y que no están pixelados.
//   node tools/logos.mjs   ->  trabajo/revision/logos.png
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { serve } from '../server.mjs';

const reg = fs.existsSync('assets/logos/logos.json') ? JSON.parse(fs.readFileSync('assets/logos/logos.json', 'utf8')) : {};
const items = Object.entries(reg).map(([slug, e]) => ({ slug, file: String(e.file || '').split('/').pop(), src: e.source || '', q: e.quality || '' }))
  .filter(x => x.file && fs.existsSync(`assets/logos/${x.file}`));
if (!items.length) { console.log('No hay logos en assets/logos (usa: anim.py logos "Nombre" ...)'); process.exit(0); }
const cells = items.map(x => `<div class="c"><div class="t"><img src="/assets/logos/${x.file}"></div><div class="big"><img src="/assets/logos/${x.file}"></div>
  <b>${x.slug}</b><i>${x.file} · ${x.src}${x.q ? ' · ' + x.q : ''}</i></div>`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#0a0c10;font-family:system-ui;color:#eef1f7}
.g{display:flex;flex-wrap:wrap;gap:28px;padding:32px;width:1856px}
.c{width:280px;display:flex;flex-direction:column;align-items:center;gap:10px}
.t{width:88px;height:88px;border-radius:24px;background:#0b0c10;border:1.5px solid #2a2f3a;display:flex;align-items:center;justify-content:center}
.t img{width:54px;height:54px;object-fit:contain}.big img{width:160px;height:160px;object-fit:contain}
b{font-size:20px}i{font-size:13px;color:#8d97ab;font-style:normal;text-align:center}
</style><div class="g">${cells}</div>`;
fs.mkdirSync('trabajo/revision', { recursive: true });
fs.writeFileSync('trabajo/revision/_logos.html', html);
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 400 } });
await page.goto(`http://127.0.0.1:${srv.address().port}/trabajo/revision/_logos.html`);
await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
await page.screenshot({ path: 'trabajo/revision/logos.png', fullPage: true });
await browser.close(); srv.close();
console.log(`Hoja de logos (${items.length}): trabajo/revision/logos.png`);
