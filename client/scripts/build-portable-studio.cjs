#!/usr/bin/env node
/**
 * Compila WAPPY Studio portable (el MISMO componente WappyStudioDashboard del aplicativo)
 * y lo incrusta en la landing pública /wappystudio (archivo único, funciona también descargado).
 *
 *   cd client && node scripts/build-portable-studio.cjs
 *
 * Fuente de la landing: ../wappy_studio_offline.html (entre los marcadores
 * <!-- WAPPY_STUDIO_APP_START --> y <!-- WAPPY_STUDIO_APP_END -->).
 * Salidas: ../wappy_studio_offline.html, public/wappystudio.html, public/assets/wappystudio.html
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const clientDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(clientDir, '..');
const sourceHtml = path.join(repoDir, 'wappy_studio_offline.html');
const outputs = [
  sourceHtml,
  path.join(clientDir, 'public/wappystudio.html'),
  path.join(clientDir, 'public/assets/wappystudio.html'),
];

console.log('▶ Compilando WAPPY Studio portable...');
execSync('npx vite build -c vite.portable-studio.config.ts', { cwd: clientDir, stdio: 'inherit' });

const distDir = path.join(clientDir, 'portable-dist/studio');
const js = fs.readFileSync(path.join(distDir, 'wappy-studio-portable.js'), 'utf8');
const css = fs.readFileSync(path.join(distDir, 'wappy-studio-portable.css'), 'utf8');

/**
 * Evita que el parser HTML cierre o entre en modo "escaped" dentro del <script> en línea.
 * \x3c es '<' tanto en cadenas/plantillas como en expresiones regulares.
 */
const safeJs = js
  .replace(/<\/script/gi, '\\x3c/script')
  .replace(/<script/gi, '\\x3cscript')
  .replace(/<!--/g, '\\x3c!--');
const safeCss = css.replace(/<\/style/gi, '<\\/style');

const START = '<!-- WAPPY_STUDIO_APP_START -->';
const END = '<!-- WAPPY_STUDIO_APP_END -->';
let html = fs.readFileSync(sourceHtml, 'utf8');
const a = html.indexOf(START);
const b = html.indexOf(END);
if (a === -1 || b === -1 || b < a) {
  throw new Error('No se encontraron los marcadores WAPPY_STUDIO_APP en wappy_studio_offline.html');
}

const block = [
  START,
  '    <div id="wappy-studio-root" data-initial-tab="tts"></div>',
  `    <style id="wappy-studio-portable-css">${safeCss}</style>`,
  `    <script id="wappy-studio-portable-js">${safeJs}</script>`,
  `    ${END}`,
].join('\n');

html = html.slice(0, a) + block + html.slice(b + END.length);

for (const out of outputs) {
  fs.writeFileSync(out, html);
  console.log(`✓ ${path.relative(repoDir, out)} (${(html.length / 1024).toFixed(0)} KB)`);
}
