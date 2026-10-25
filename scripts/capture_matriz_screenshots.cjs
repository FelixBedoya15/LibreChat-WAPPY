const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Iniciando Puppeteer para captura de pantallas HD...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const outDirs = [
    '/Users/venta/.gemini/antigravity/brain/50e670fe-62fa-4fcc-8bb4-011fec0add4e/capturas',
    path.resolve('client/dist/marketing/capturas-matriz'),
    path.resolve('client/public/marketing/capturas-matriz')
  ];

  outDirs.forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  async function savePageScreenshot(page, name, elementSelector = null, clip = null) {
    let buf;
    if (elementSelector) {
      const el = await page.$(elementSelector);
      if (el) {
        buf = await el.screenshot();
      } else {
        console.warn('Selector no encontrado:', elementSelector);
        buf = await page.screenshot({ clip });
      }
    } else if (clip) {
      buf = await page.screenshot({ clip });
    } else {
      buf = await page.screenshot();
    }

    for (const dir of outDirs) {
      fs.writeFileSync(path.join(dir, name), buf);
    }
    console.log('✅ Capturado:', name);
  }

  // --- SECCIÓN 1: VISTA DESKTOP (1920x1080) ---
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  const fileUrl = 'file://' + path.resolve('client/dist/matrizipvr.html');
  console.log('Cargando Desktop:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Cargar datos dummy y asegurar render completo de dashboard y reporte
  await page.evaluate(() => {
    if (typeof loadDummyData === 'function') loadDummyData();
    if (typeof renderDashboard === 'function') {
      window.isDashboardOpen = true;
      renderDashboard();
    }
    if (typeof renderExecutiveReport === 'function') renderExecutiveReport();
    if (typeof renderTutorialVideo === 'function') renderTutorialVideo();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Header & Hero Desktop (incluye el video tutorial con thumbnail de Félix y Tenshi)
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await savePageScreenshot(page, '01_hero_navbar_desktop.png', null, { x: 0, y: 0, width: 1920, height: 1000 });

  // 2. Video Tutorial Section específico
  await page.evaluate(() => {
    const el = document.getElementById('tutorialSectionWrapper');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 500));
  await savePageScreenshot(page, '02_video_tutorial_seccion.png', '#tutorialSectionWrapper');

  // 3. Central Toolbar 14 Groups
  await page.evaluate(() => {
    const tb = document.querySelector('section.max-w-7xl > div.bg-white\\/95');
    if (tb) tb.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  await savePageScreenshot(page, '03_toolbar_14_grupos.png', 'section.max-w-7xl > div.bg-white\\/95');

  // 4. Dashboard KPIs & Charts
  await page.evaluate(() => {
    const el = document.getElementById('dashboardMainContainer');
    if (el) el.scrollIntoView({ block: 'start' });
  });
  await new Promise(r => setTimeout(r, 600));
  await savePageScreenshot(page, '04_dashboard_analitica_kpis.png', '#dashboardMainContainer');

  // 5. Matriz Live Table (Excel style)
  await page.evaluate(() => {
    const el = document.getElementById('matriz-section');
    if (el) el.scrollIntoView({ block: 'start' });
  });
  await new Promise(r => setTimeout(r, 600));
  await savePageScreenshot(page, '05_matriz_ipevr_tabla_live.png', '#matriz-section');

  // 6. Modal Datos de la Empresa (con firmas digitales)
  await page.evaluate(() => {
    if (typeof openCompanyModal === 'function') openCompanyModal();
  });
  await new Promise(r => setTimeout(r, 600));
  await savePageScreenshot(page, '06_modal_datos_empresa.png', '#companyModal > div');
  await page.evaluate(() => {
    if (typeof closeCompanyModal === 'function') closeCompanyModal();
  });
  await new Promise(r => setTimeout(r, 300));

  // 7. Modal Claves IA Google Gemini
  await page.evaluate(() => {
    if (typeof openApiKeyModal === 'function') openApiKeyModal();
  });
  await new Promise(r => setTimeout(r, 500));
  await savePageScreenshot(page, '07_modal_claves_gemini.png', '#apiKeyModal > div');
  await page.evaluate(() => {
    if (typeof closeApiKeyModal === 'function') closeApiKeyModal();
  });
  await new Promise(r => setTimeout(r, 300));

  // 8. Informe Gerencial A4
  await page.evaluate(() => {
    const el = document.getElementById('informe-section');
    if (el) el.scrollIntoView({ block: 'start' });
  });
  await new Promise(r => setTimeout(r, 600));
  await savePageScreenshot(page, '08_informe_gerencial_a4.png', '#reportPaperContainer');

  await page.close();

  // --- SECCIÓN 2: VISTA MÓVIL (iPhone 14 - 390x844) ---
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  console.log('Cargando Móvil:', fileUrl);
  await mobilePage.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  await mobilePage.evaluate(() => {
    if (typeof loadDummyData === 'function') loadDummyData();
    if (typeof renderTutorialVideo === 'function') renderTutorialVideo();
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 500));

  // 9. Vista Móvil Header y Hero con Video Thumbnail y Logo WAPPY perfecto
  await savePageScreenshot(mobilePage, '09_mobile_header_view.png');

  // 10. Drawer de Navegación Móvil abierto
  await mobilePage.evaluate(() => {
    if (typeof toggleMobileMenuDrawer === 'function') toggleMobileMenuDrawer(true);
  });
  await new Promise(r => setTimeout(r, 500));
  await savePageScreenshot(mobilePage, '10_mobile_drawer_navigation.png');

  await mobilePage.close();
  await browser.close();
  console.log('🎉 TODAS LAS CAPTURAS DE PANTALLA FUERON TOMADAS EXITOSAMENTE!');
})();
