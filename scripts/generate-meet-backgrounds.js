const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve(__dirname, '../client/public/marketing/meet-backgrounds');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Base images
const imgBoardroomBase64 = fs.readFileSync(path.join(OUT_DIR, 'base_executive_boardroom.jpg')).toString('base64');
const imgPenthouseBase64 = fs.readFileSync(path.join(OUT_DIR, 'base_innovation_penthouse.jpg')).toString('base64');
const wTealBase64 = fs.readFileSync('/tmp/w_teal.png').toString('base64');
const wWhiteBase64 = fs.readFileSync('/tmp/w_white.png').toString('base64');
const wBlackBase64 = fs.readFileSync('/tmp/clean_w.png').toString('base64');

function renderHtmlToPng(htmlContent, outPngPath) {
  const tmpHtml = `/tmp/render_${Date.now()}_${Math.random().toString(36).substring(7)}.html`;
  fs.writeFileSync(tmpHtml, htmlContent, 'utf-8');
  
  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --force-device-scale-factor=1 --window-size=1920,1080 --screenshot="${outPngPath}" "file://${tmpHtml}"`;
  execSync(cmd, { stdio: 'ignore' });
  
  if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
  console.log(`Rendered: ${path.basename(outPngPath)}`);
}

// -------------------------------------------------------------
// OPTION 1: Executive Boardroom - Illuminated Teal W on Slate Wall (Slightly to the right for camera clearance)
// -------------------------------------------------------------
const html1 = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    position: relative;
    background: #0d131a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: url('data:image/jpeg;base64,${imgBoardroomBase64}');
    background-size: cover;
    background-position: center;
  }
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 60% 40%, rgba(0,0,0,0) 40%, rgba(5,10,18,0.35) 90%);
    pointer-events: none;
  }

  /* Wall mounted 3D logo placed at x: 1220px (over right shoulder) */
  .wall-sign {
    position: absolute;
    top: 155px;
    left: 1200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .wall-sign-halo {
    position: absolute;
    width: 320px;
    height: 220px;
    background: radial-gradient(circle, rgba(20, 184, 166, 0.28) 0%, rgba(13, 148, 136, 0.1) 45%, transparent 75%);
    filter: blur(28px);
    z-index: 1;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .wall-logo-container {
    position: relative;
    z-index: 2;
  }
  .wall-logo-img {
    width: 170px;
    height: auto;
    filter: 
      drop-shadow(0 18px 28px rgba(0, 0, 0, 0.8))
      drop-shadow(0 3px 6px rgba(0, 0, 0, 0.9))
      drop-shadow(0 0 25px rgba(20, 184, 166, 0.55));
    transform: perspective(600px) rotateY(-3deg) rotateX(1deg);
  }

  .wall-text {
    position: relative;
    z-index: 2;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 8px;
    color: #ffffff;
    text-transform: uppercase;
    text-shadow: 0 4px 18px rgba(0, 0, 0, 0.9), 0 0 22px rgba(20, 184, 166, 0.35);
    margin-left: 8px;
  }

  .wall-subtext {
    position: relative;
    z-index: 2;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3.5px;
    color: #5eead4;
    text-transform: uppercase;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
  }

  .corner-badge {
    position: absolute;
    top: 36px;
    right: 48px;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 22px;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 9999px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  }
  .corner-logo {
    width: 30px;
    height: auto;
    filter: drop-shadow(0 2px 8px rgba(20, 184, 166, 0.6));
  }
  .corner-title {
    font-size: 14px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 2px;
  }
  .corner-sep {
    width: 1px;
    height: 16px;
    background: rgba(255, 255, 255, 0.2);
  }
  .corner-tag {
    font-size: 11px;
    font-weight: 600;
    color: #2dd4bf;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
  <div class="bg-image"></div>
  <div class="vignette"></div>

  <div class="wall-sign">
    <div class="wall-sign-halo"></div>
    <div class="wall-logo-container">
      <img src="data:image/png;base64,${wTealBase64}" class="wall-logo-img" alt="W">
    </div>
    <div class="wall-text">WAPPY</div>
    <div class="wall-subtext">Inteligencia Artificial • SG-SST</div>
  </div>

  <div class="corner-badge">
    <img src="data:image/png;base64,${wTealBase64}" class="corner-logo" alt="W">
    <div class="corner-title">WAPPY</div>
    <div class="corner-sep"></div>
    <div class="corner-tag">Seguridad y Salud en el Trabajo</div>
  </div>
</body>
</html>`;

// -------------------------------------------------------------
// OPTION 2: Executive Boardroom - 3D Matte Titanium/Black W (Direct from user file)
// -------------------------------------------------------------
const html2 = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    position: relative;
    background: #0d131a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: url('data:image/jpeg;base64,${imgBoardroomBase64}');
    background-size: cover;
    background-position: center;
  }
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 60% 40%, rgba(0,0,0,0) 40%, rgba(5,10,18,0.3) 90%);
    pointer-events: none;
  }

  /* Matte Titanium 3D plaque */
  .titanium-plaque {
    position: absolute;
    top: 135px;
    left: 1180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 30px 45px;
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 30px;
    box-shadow: 
      0 25px 50px -10px rgba(0, 0, 0, 0.75),
      0 0 35px rgba(20, 184, 166, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  .titanium-logo {
    width: 145px;
    height: auto;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 15px rgba(45, 212, 191, 0.4));
  }
  .titanium-title {
    font-size: 22px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 6px;
    margin-left: 6px;
  }
  .titanium-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px;
    background: rgba(20, 184, 166, 0.18);
    border: 1px solid rgba(45, 212, 191, 0.35);
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    color: #5eead4;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .titanium-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #2dd4bf;
    box-shadow: 0 0 6px #2dd4bf;
  }
</style>
</head>
<body>
  <div class="bg-image"></div>
  <div class="vignette"></div>

  <div class="titanium-plaque">
    <img src="data:image/png;base64,${wTealBase64}" class="titanium-logo" alt="WAPPY W">
    <div class="titanium-title">WAPPY</div>
    <div class="titanium-badge">
      <div class="titanium-dot"></div>
      <span>Seguridad & Salud en el Trabajo</span>
    </div>
  </div>
</body>
</html>`;

// -------------------------------------------------------------
// OPTION 3: Executive Glass Watermark Card (Top-Right Subtle Corner)
// -------------------------------------------------------------
const html3 = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    position: relative;
    background: #0d131a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: url('data:image/jpeg;base64,${imgBoardroomBase64}');
    background-size: cover;
    background-position: center;
  }
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(10,15,25,0.3) 100%);
    pointer-events: none;
  }

  .glass-card {
    position: absolute;
    top: 44px;
    right: 56px;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 14px 26px;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 24px;
    box-shadow: 
      0 20px 40px -10px rgba(0, 0, 0, 0.6),
      0 0 30px rgba(20, 184, 166, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  .logo-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-glow {
    position: absolute;
    width: 50px;
    height: 50px;
    background: radial-gradient(circle, rgba(20, 184, 166, 0.5) 0%, transparent 70%);
    filter: blur(10px);
  }
  .logo-img {
    position: relative;
    width: 48px;
    height: auto;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
  }
  .badge-divider {
    width: 1.5px;
    height: 38px;
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.25), transparent);
  }
  .text-col {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .brand-name {
    font-size: 19px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 3px;
  }
  .brand-claim {
    font-size: 11px;
    font-weight: 600;
    color: #5eead4;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }
</style>
</head>
<body>
  <div class="bg-image"></div>
  <div class="vignette"></div>

  <div class="glass-card">
    <div class="logo-wrapper">
      <div class="logo-glow"></div>
      <img src="data:image/png;base64,${wTealBase64}" class="logo-img" alt="WAPPY W">
    </div>
    <div class="badge-divider"></div>
    <div class="text-col">
      <div class="brand-name">WAPPY</div>
      <div class="brand-claim">Ecosistema IA de Prevención & SST</div>
    </div>
  </div>
</body>
</html>`;

// -------------------------------------------------------------
// OPTION 4: Innovation Penthouse - Spanning Studio
// -------------------------------------------------------------
const html4 = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    position: relative;
    background: #0d131a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: url('data:image/jpeg;base64,${imgPenthouseBase64}');
    background-size: cover;
    background-position: center;
  }
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 50%, rgba(10,15,25,0.25) 100%);
    pointer-events: none;
  }

  .glass-wall-sign {
    position: absolute;
    top: 150px;
    left: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 24px 36px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 28px;
    box-shadow: 
      0 20px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 2px rgba(255, 255, 255, 0.4),
      0 0 40px rgba(20, 184, 166, 0.2);
    transform: perspective(800px) rotateY(6deg);
  }
  .glass-logo {
    width: 100px;
    height: auto;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35)) drop-shadow(0 0 15px rgba(45, 212, 191, 0.5));
  }
  .glass-title {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 5px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  }
  .glass-sub {
    font-size: 10px;
    font-weight: 700;
    color: #2dd4bf;
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }

  .top-pill {
    position: absolute;
    top: 40px;
    right: 50px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 22px;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 9999px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  .top-pill-img {
    width: 28px;
    height: auto;
    filter: drop-shadow(0 2px 6px rgba(20, 184, 166, 0.5));
  }
  .top-pill-text {
    font-size: 13px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 2px;
  }
  .top-pill-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #2dd4bf;
    box-shadow: 0 0 8px #2dd4bf;
  }
  .top-pill-sub {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="bg-image"></div>
  <div class="vignette"></div>

  <div class="glass-wall-sign">
    <img src="data:image/png;base64,${wTealBase64}" class="glass-logo" alt="WAPPY W">
    <div class="glass-title">WAPPY</div>
    <div class="glass-sub">Innovation Hub • SST</div>
  </div>

  <div class="top-pill">
    <img src="data:image/png;base64,${wTealBase64}" class="top-pill-img" alt="W">
    <div class="top-pill-text">WAPPY</div>
    <div class="top-pill-dot"></div>
    <div class="top-pill-sub">Seguridad y Salud en el Trabajo</div>
  </div>
</body>
</html>`;

// -------------------------------------------------------------
// OPTION 5: Cyber Tech Slate & Neon Teal Studio
// -------------------------------------------------------------
const html5 = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    position: relative;
    background: #080d14;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .left-slat-wall {
    position: absolute;
    top: 0; left: 0;
    width: 380px;
    height: 100%;
    background: 
      repeating-linear-gradient(
        90deg,
        #111827,
        #111827 22px,
        #090d16 22px,
        #090d16 34px
      );
    box-shadow: 15px 0 50px rgba(0, 0, 0, 0.85);
    z-index: 2;
  }
  .slat-rim-light {
    position: absolute;
    top: 0;
    left: 380px;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, #14b8a6, #2dd4bf 50%, #0d9488);
    box-shadow: 0 0 35px 8px rgba(45, 212, 191, 0.45);
    z-index: 3;
  }

  .light-bloom-1 {
    position: absolute;
    top: -150px;
    right: 150px;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(20, 184, 166, 0.16) 0%, rgba(13, 148, 136, 0.05) 45%, transparent 70%);
    filter: blur(80px);
    z-index: 1;
  }
  .light-bloom-2 {
    position: absolute;
    bottom: -150px;
    left: 450px;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 65%);
    filter: blur(90px);
    z-index: 1;
  }

  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(circle at 65% 50%, black 20%, transparent 80%);
    -webkit-mask-image: radial-gradient(circle at 65% 50%, black 20%, transparent 80%);
    z-index: 1;
  }

  .backdrop-watermark {
    position: absolute;
    top: 50%;
    left: 58%;
    transform: translate(-50%, -50%);
    width: 680px;
    height: auto;
    opacity: 0.045;
    filter: drop-shadow(0 0 60px rgba(45, 212, 191, 0.5));
    pointer-events: none;
    z-index: 1;
  }

  .neon-badge-card {
    position: absolute;
    top: 130px;
    right: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 38px 52px;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 41, 59, 0.4) 100%);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(45, 212, 191, 0.25);
    border-radius: 36px;
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.7),
      0 0 45px rgba(20, 184, 166, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    z-index: 4;
  }
  .neon-logo {
    width: 140px;
    height: auto;
    filter: 
      drop-shadow(0 0 25px rgba(45, 212, 191, 0.7))
      drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
  }
  .neon-title {
    font-size: 26px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 6px;
    text-shadow: 0 0 20px rgba(45, 212, 191, 0.4);
  }
  .neon-badge-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: rgba(20, 184, 166, 0.15);
    border: 1px solid rgba(45, 212, 191, 0.4);
    border-radius: 9999px;
  }
  .neon-pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 10px #34d399;
  }
  .neon-pill-text {
    font-size: 11px;
    font-weight: 700;
    color: #5eead4;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .bottom-status {
    position: absolute;
    bottom: 30px;
    right: 50px;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    letter-spacing: 1.5px;
    z-index: 4;
  }
</style>
</head>
<body>
  <div class="left-slat-wall"></div>
  <div class="slat-rim-light"></div>
  <div class="light-bloom-1"></div>
  <div class="light-bloom-2"></div>
  <div class="grid-bg"></div>

  <img src="data:image/png;base64,${wWhiteBase64}" class="backdrop-watermark" alt="W Watermark">

  <div class="neon-badge-card">
    <img src="data:image/png;base64,${wTealBase64}" class="neon-logo" alt="WAPPY W">
    <div class="neon-title">WAPPY</div>
    <div class="neon-badge-pill">
      <div class="neon-pill-dot"></div>
      <div class="neon-pill-text">Inteligencia Artificial • SG-SST</div>
    </div>
  </div>

  <div class="bottom-status">WAPPY IA • PREVENCIÓN & GESTIÓN OCUPACIONAL</div>
</body>
</html>`;

renderHtmlToPng(html1, path.join(OUT_DIR, '01_wappy_oficina_ejecutiva_luz_neocian.png'));
renderHtmlToPng(html2, path.join(OUT_DIR, '02_wappy_oficina_placa_titanio.png'));
renderHtmlToPng(html3, path.join(OUT_DIR, '03_wappy_boardroom_insignia_cristal.png'));
renderHtmlToPng(html4, path.join(OUT_DIR, '04_wappy_penthouse_innovacion.png'));
renderHtmlToPng(html5, path.join(OUT_DIR, '05_wappy_cyber_slate_tecnologico.png'));

console.log('All 5 backgrounds updated and rendered!');
