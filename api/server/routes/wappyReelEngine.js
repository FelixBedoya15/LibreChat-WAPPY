'use strict';

const fs = require('fs');
const path = require('path');

let OFFICIAL_LOGOS = {};
try {
  OFFICIAL_LOGOS = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'wappyReelLogos.json'), 'utf8'),
  );
} catch (_) {
  OFFICIAL_LOGOS = {};
}

const ARCHETYPE_ROTATION = [
  'hook-vs-wall',
  'bento-kpi',
  'flow-split-before-after',
  'visor-normativo-real',
  'suri-voice-live-hud',
  'wappy-n8n-workflow',
  'pentagon-orbital',
];

const EFFECT_TO_ARCHETYPE = {
  'hero-cover-2s-xl': 'hook-vs-wall',
  '08-headline-wall': 'hook-vs-wall',
  '07-zoom-through': 'bento-kpi',
  '02-frame-break': 'bento-kpi',
  '03-ui-world': 'bento-kpi',
  'flow-split-before-after': 'flow-split-before-after',
  '04-split-compare': 'flow-split-before-after',
  'visor-normativo-real': 'visor-normativo-real',
  '05-doc-highlighter': 'visor-normativo-real',
  'suri-voice-live-hud': 'suri-voice-live-hud',
  'iphone-16-dynamic-island': 'suri-voice-live-hud',
  'n8n-workflow-wappy': 'wappy-n8n-workflow',
  'cuadricula-50-ia': 'wappy-n8n-workflow',
  '01-orbit-3d': 'pentagon-orbital',
  '09-chart-grow': 'pentagon-orbital',
};

function resolveArchetypeFromEffect(effectId = '', fallbackIdx = 0) {
  const clean = String(effectId || '').trim().toLowerCase();
  if (EFFECT_TO_ARCHETYPE[clean]) return EFFECT_TO_ARCHETYPE[clean];
  return ARCHETYPE_ROTATION[fallbackIdx % ARCHETYPE_ROTATION.length];
}

function renderOfficialBrandLogoSvg(brand = 'wappy', size = 36) {
  const s = Number(size) || 36;
  const b = String(brand || 'wappy').toLowerCase();
  const src =
    b.includes('antigravity') && OFFICIAL_LOGOS.antigravity
      ? OFFICIAL_LOGOS.antigravity
      : b.includes('flow') && OFFICIAL_LOGOS.flow
        ? OFFICIAL_LOGOS.flow
        : b.includes('notebook') && OFFICIAL_LOGOS.notebooklm
          ? OFFICIAL_LOGOS.notebooklm
          : b.includes('suri') && OFFICIAL_LOGOS.suri
            ? OFFICIAL_LOGOS.suri
            : b.includes('tenshi') && OFFICIAL_LOGOS.tenshi
              ? OFFICIAL_LOGOS.tenshi
              : OFFICIAL_LOGOS.wappyCircle || '';
  if (src) {
    return `<img src="${src}" alt="${b}" style="width:${s}px;height:${s}px;object-fit:contain;border-radius:${Math.round(s * 0.24)}px;" />`;
  }
  return `<span style="display:inline-flex;width:${s}px;height:${s}px;border-radius:50%;background:#C7F303;color:#0E1300;align-items:center;justify-content:center;font-weight:900;font-size:${Math.round(s * 0.5)}px;">W</span>`;
}

/**
 * Extrae envolvente RMS a 60 FPS y alinea marcas de tiempo con un buffer WAV real (16-bit PCM)
 */
function alignTimelineMapWithWavBuffer(timelineMap = {}, wavBuffer) {
  if (!Buffer.isBuffer(wavBuffer) || wavBuffer.length < 128) return timelineMap;

  let dataOffset = 44;
  let sampleRate = 24000;
  try {
    if (wavBuffer.toString('ascii', 0, 4) === 'RIFF') {
      sampleRate = wavBuffer.readUInt32LE(24) || 24000;
      let pos = 12;
      while (pos + 8 <= wavBuffer.length) {
        const chunkId = wavBuffer.toString('ascii', pos, pos + 4);
        const chunkSize = wavBuffer.readUInt32LE(pos + 4);
        if (chunkId === 'data') {
          dataOffset = pos + 8;
          break;
        }
        pos += 8 + chunkSize;
      }
    }
  } catch (_) {}

  const pcmBytes = wavBuffer.length - dataOffset;
  const totalSamples = Math.max(1, Math.floor(pcmBytes / 2));
  const realDurationSec = Math.max(4, Number((totalSamples / sampleRate).toFixed(2)));
  const fps = 60;
  const totalFrames = Math.ceil(realDurationSec * fps);
  const samplesPerFrame = Math.max(1, Math.floor(sampleRate / fps));
  const vozData = [];

  for (let f = 0; f < totalFrames; f++) {
    const startSample = f * samplesPerFrame;
    const endSample = Math.min(totalSamples, startSample + samplesPerFrame);
    let sumSq = 0;
    let count = 0;
    for (let s = startSample; s < endSample; s++) {
      const bytePos = dataOffset + s * 2;
      if (bytePos + 2 <= wavBuffer.length) {
        const val = wavBuffer.readInt16LE(bytePos) / 32768;
        sumSq += val * val;
        count++;
      }
    }
    const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
    vozData.push(Number(Math.min(1, rms * 3.2).toFixed(3)));
  }

  const introSec = Math.max(0, Math.min(3.5, Number(timelineMap.introDurationSeconds) || 2.0));
  const spokenDur = Math.max(1.0, realDurationSec - introSec);
  const rawBeats = Array.isArray(timelineMap.beats) ? timelineMap.beats : [];

  // Detectar valles acústicos reales (pausas de respiración) cerca de las fronteras ponderadas por sílabas
  const weights = rawBeats.map((b) => {
    const clean = String(b.text || '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g, '');
    return Math.max(8, clean.length);
  });
  const totalW = weights.reduce((a, v) => a + v, 0) || 1;

  const boundaries = [introSec];
  let accW = 0;
  for (let i = 0; i < rawBeats.length - 1; i++) {
    accW += weights[i];
    const expectedSec = introSec + (accW / totalW) * spokenDur;
    const minSearchSec = Math.max(boundaries[i] + 1.1, expectedSec - 1.1);
    const maxSearchSec = Math.min(realDurationSec - 1.1, expectedSec + 1.1);
    const minFrame = Math.max(0, Math.floor(minSearchSec * fps));
    const maxFrame = Math.min(totalFrames - 1, Math.ceil(maxSearchSec * fps));

    let bestFrame = Math.round(expectedSec * fps);
    let bestScore = Infinity;
    for (let f = minFrame; f <= maxFrame; f++) {
      // Ventana de 8 frames (~133ms) para detectar pausa real de respiración
      let winEnergy = 0;
      let cnt = 0;
      for (let k = -4; k <= 4; k++) {
        const idx = f + k;
        if (idx >= 0 && idx < totalFrames) {
          winEnergy += vozData[idx];
          cnt++;
        }
      }
      const avgEnergy = cnt > 0 ? winEnergy / cnt : 0;
      const distPenalty = Math.abs(f / fps - expectedSec) * 0.12;
      const score = avgEnergy + distPenalty;
      if (score < bestScore) {
        bestScore = score;
        bestFrame = f;
      }
    }
    boundaries.push(Number((bestFrame / fps).toFixed(2)));
  }
  boundaries.push(realDurationSec);

  const beats = rawBeats.map((b, i) => {
    const startSec = Number((boundaries[i] ?? introSec).toFixed(2));
    const endSec = Number((boundaries[i + 1] ?? realDurationSec).toFixed(2));
    const durationSec = Number(Math.max(0.8, endSec - startSec).toFixed(2));
    return {
      ...b,
      startSec,
      endSec,
      durationSec,
      startPct: Number((startSec / realDurationSec).toFixed(4)),
      endPct: Number((endSec / realDurationSec).toFixed(4)),
    };
  });

  const wordTimings = [];
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const words = String(b.text || '').split(/\s+/).filter(Boolean);
    const wList = words.map((w) => {
      const cleanLen = w.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g, '').length;
      let weight = Math.max(2, cleanLen);
      if (/[,;:]$/.test(w)) weight += 3;
      if (/[.!?…]$/.test(w)) weight += 5;
      return { word: w, weight };
    });
    const sumW = wList.reduce((acc, it) => acc + it.weight, 0) || 1;
    // Dejar 150ms de cola de respiración al final del beat
    const activeSpan = Math.max(0.5, b.durationSec - 0.15);
    let wAcc = 0;
    for (const wIt of wList) {
      const wStart = Number((b.startSec + (wAcc / sumW) * activeSpan).toFixed(2));
      wAcc += wIt.weight;
      const wEnd = Number((b.startSec + (wAcc / sumW) * activeSpan).toFixed(2));
      wordTimings.push({
        word: wIt.word,
        startSec: wStart,
        endSec: wEnd,
        startPct: Number((wStart / realDurationSec).toFixed(4)),
        endPct: Number((wEnd / realDurationSec).toFixed(4)),
        beatIndex: i,
      });
    }
  }

  return {
    ...timelineMap,
    introDurationSeconds: introSec,
    totalDurationSeconds: realDurationSec,
    beats,
    wordTimings,
    vozData,
    wavAligned: true,
  };
}

function cleanPhrase(str = '', maxWords = 6, fallback = 'Automatización SG-SST') {
  const words = String(str || '')
    .replace(/[¿?¡!«»"']/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return fallback;
  return words.slice(0, maxWords).join(' ');
}

function extractSmartSceneFields(sentence = '', idx = 0, total = 5, options = {}) {
  const s = String(sentence || '').trim();
  const low = s.toLowerCase();

  let toolKey = 'wappyCircle';
  let eyebrow = `ESCENA 0${idx + 1} / 0${total} · ECOSISTEMA IA SST`;
  let titleBefore = `#${idx + 1} · WAPPY IA`;
  let titleHighlight = 'SG-SST AUTOMATIZADO';
  let subtitle = s.length <= 78 ? s : cleanPhrase(s, 11, 'Control y trazabilidad en tiempo real');

  if (low.includes('antigravity') || low.includes('excel') || low.includes('matriz') || low.includes('matrices')) {
    toolKey = 'antigravity';
    eyebrow = `PASO 0${idx + 1} · ENTORNO AGÉNTICO SG-SST`;
    titleBefore = 'DE EXCEL MANUAL A';
    titleHighlight = 'MATRICES CON IA';
  } else if (low.includes('flow') || low.includes('antes') || low.includes('video') || low.includes('riesgo')) {
    toolKey = 'flow';
    eyebrow = `PASO 0${idx + 1} · SIMULACIÓN DE CONTROLES 4K`;
    titleBefore = 'ANTES VS DESPUÉS';
    titleHighlight = 'CONTROLES SG-SST';
  } else if (low.includes('notebook') || low.includes('1072') || low.includes('0312') || low.includes('gtc') || low.includes('norma') || low.includes('alucinac')) {
    toolKey = 'notebooklm';
    eyebrow = `PASO 0${idx + 1} · CERO ALUCINACIONES LEGALES`;
    titleBefore = 'DECRETO 1072 & 0312';
    titleHighlight = '100% VERIFICADO';
  } else if (low.includes('suri') || low.includes('voz') || low.includes('podcast') || low.includes('asistente') || low.includes('habla')) {
    toolKey = 'suri';
    eyebrow = `PASO 0${idx + 1} · COPILOTO DE VOZ 24 KHZ`;
    titleBefore = 'SURI 3D & TENSHI';
    titleHighlight = 'ASISTENTE EN VIVO';
  } else if (low.includes('n8n') || low.includes('flujo') || low.includes('lunes') || low.includes('7 am') || low.includes('autom')) {
    toolKey = 'tenshi';
    eyebrow = `PASO 0${idx + 1} · WORKFLOW AUTOMÁTICO N8N`;
    titleBefore = 'FLUJOS N8N + TENSHI';
    titleHighlight = '+50 HERRAMIENTAS IA';
  } else if (idx === total - 1 || low.includes('wappy.club') || low.includes('curso') || low.includes('entra')) {
    toolKey = 'wappyCircle';
    eyebrow = '★ ENTRENAMIENTO & PLATAFORMA OFICIAL';
    titleBefore = 'AUTOMATIZA TU SST EN';
    titleHighlight = 'WAPPY.CLUB';
  }

  const clauses = s
    .split(/[,;:.?!]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 4);

  const step1 = cleanPhrase(clauses[0] || s, 4, 'Diagnóstico IA');
  const step2 = cleanPhrase(clauses[1] || 'Trazabilidad Decreto 1072', 4, 'Control Normativo');
  const step3 = cleanPhrase(clauses[2] || 'Evidencia Auditable 100%', 4, 'Cero Papel');

  return {
    toolKey,
    eyebrow,
    titleBefore,
    titleHighlight,
    subtitle,
    step1,
    step2,
    step3,
    narration: s,
    companyName: options.companyName || 'WAPPY IA',
  };
}

/**
 * Construye el plan de escenas sincronizado con los beats del guion (con Portada Hero de 2.0s)
 */
function buildSmartScenePlanFromScript(scriptText = '', beats = [], options = {}) {
  const selectedEffects = Array.isArray(options.selectedEffects) ? options.selectedEffects : [];
  const safeBeats = Array.isArray(beats) && beats.length > 0 ? beats : [{ startSec: 2, endSec: 20, text: scriptText }];

  const usedArchetypes = [];
  const scenes = safeBeats.map((b, idx) => {
    const isLast = idx === safeBeats.length - 1;
    let arch = isLast
      ? 'pentagon-orbital'
      : idx === 0
        ? 'hook-vs-wall'
        : selectedEffects[idx]
          ? resolveArchetypeFromEffect(selectedEffects[idx], idx)
          : ARCHETYPE_ROTATION[idx % ARCHETYPE_ROTATION.length];

    const sentLow = String(b.text || '').toLowerCase();
    if (!isLast && idx > 0) {
      if (sentLow.includes('n8n') || sentLow.includes('flujo') || sentLow.includes('lunes')) {
        arch = 'wappy-n8n-workflow';
      } else if (sentLow.includes('1072') || sentLow.includes('0312') || sentLow.includes('notebook') || sentLow.includes('alucinac')) {
        arch = 'visor-normativo-real';
      } else if (sentLow.includes('suri') || sentLow.includes('voz') || sentLow.includes('habla')) {
        arch = 'suri-voice-live-hud';
      } else if (sentLow.includes('antes') || sentLow.includes('flow')) {
        arch = 'flow-split-before-after';
      }
    }

    if (usedArchetypes.length > 0 && usedArchetypes[usedArchetypes.length - 1] === arch) {
      arch = ARCHETYPE_ROTATION[(ARCHETYPE_ROTATION.indexOf(arch) + 1) % ARCHETYPE_ROTATION.length];
    }
    usedArchetypes.push(arch);

    const fields = extractSmartSceneFields(b.text || scriptText, idx, safeBeats.length, options);
    return {
      index: idx + 1,
      archetype: arch,
      startSec: Number(b.startSec || 0),
      endSec: Number(b.endSec || 5),
      durationSec: Number(Math.max(1.5, (b.endSec || 5) - (b.startSec || 0)).toFixed(2)),
      ...fields,
    };
  });

  return scenes;
}

async function generateCreativeScenePlanWithAi(scriptText = '', beats = [], options = {}, aiGeneratorFn = null) {
  const basePlan = buildSmartScenePlanFromScript(scriptText, beats, options);
  if (typeof aiGeneratorFn !== 'function' || basePlan.length === 0) {
    return basePlan;
  }

  try {
    const prompt = `Eres el Subagente Director de Efectos XL de Wappy Studio (Modo Móvil XL 1080x1920).
Para cada una de estas ${basePlan.length} escenas del guion SG-SST, devuelve un JSON array con objetos de textos cortos, potentes y 100% coherentes con la oración hablada (máximo 4 palabras por campo):
Escenas:
${basePlan.map((s, i) => `${i + 1}. [${s.archetype}] Oración hablada: "${s.narration}"`).join('\n')}

Formato JSON exacto:
[
  {
    "eyebrow": "PASO 01 · AUTOMATIZACIÓN IA",
    "titleBefore": "DE EXCEL MANUAL A",
    "titleHighlight": "WAPPY IA SST",
    "subtitle": "Frase explicativa clara de máximo 10 palabras",
    "step1": "Matriz GTC 45 IA",
    "step2": "Diagnóstico 0312",
    "step3": "Plan Decreto 1072"
  }
]`;
    const raw = await aiGeneratorFn(prompt);
    const jsonMatch = String(raw || '').match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return basePlan.map((sc, i) => {
          const aiSc = parsed[i] || {};
          return {
            ...sc,
            eyebrow: String(aiSc.eyebrow || sc.eyebrow).slice(0, 44).toUpperCase(),
            titleBefore: String(aiSc.titleBefore || sc.titleBefore).slice(0, 26).toUpperCase(),
            titleHighlight: String(aiSc.titleHighlight || sc.titleHighlight).slice(0, 26).toUpperCase(),
            subtitle: String(aiSc.subtitle || sc.subtitle).slice(0, 88),
            step1: String(aiSc.step1 || sc.step1).slice(0, 28),
            step2: String(aiSc.step2 || sc.step2).slice(0, 28),
            step3: String(aiSc.step3 || sc.step3).slice(0, 28),
          };
        });
      }
    }
  } catch (_) {}

  return basePlan;
}

/**
 * Compila el HTML autónomo a 60 FPS en el Diseño Oficial Full-Screen Modo Móvil XL (1080×1920)
 * idéntico al motor de preview_sin_personaje_7036.html (Cero temblor + Transiciones Spring/Zoom-Through + Audio Sincronizado)
 */
function compileAntigravityMasterReelHtml(scenePlan = [], timelineMap = {}, options = {}) {
  const introDuration = Number(timelineMap.introDurationSeconds ?? 2.0);
  const totalDur = Math.max(
    8,
    Number(timelineMap.totalDurationSeconds || 24),
  );
  const scenes = Array.isArray(scenePlan) && scenePlan.length > 0
    ? scenePlan
    : buildSmartScenePlanFromScript(options.scriptText || 'Automatiza tu SG-SST con WAPPY IA', timelineMap.beats, options);

  // Construir páginas de subtítulos karaoke Modo Móvil XL (56px ExtraBold, 4-5 palabras por página)
  const rawWords = Array.isArray(timelineMap.wordTimings) ? timelineMap.wordTimings : [];
  const subPages = [];
  const wordsPerPage = 5;
  for (let i = 0; i < rawWords.length; i += wordsPerPage) {
    const chunk = rawWords.slice(i, i + wordsPerPage);
    if (chunk.length > 0) {
      subPages.push({
        t0: Number(chunk[0].startSec || 0),
        t1: Number(chunk[chunk.length - 1].endSec || chunk[0].startSec + 1.2),
        words: chunk.map((w) => ({
          w: String(w.word || w.text || '').trim(),
          t0: Number(w.startSec || 0),
          t1: Number(w.endSec || 0),
        })),
      });
    }
  }

  const vozData = Array.isArray(timelineMap.vozData) ? timelineMap.vozData : [];
  const audioDataUri = options.audioDataUri || timelineMap.audioDataUri || '';
  const coverTitleTop = String(options.headlineText || scenes[0]?.titleBefore || 'AUTOMATIZA TU SST').toUpperCase();
  const coverTitleBot = String(scenes[0]?.titleHighlight || 'CON +50 IA WAPPY').toUpperCase();
  const coverBadge = String(options.badgeText || '⚡ ECOSISTEMA WAPPY IA · SG-SST').toUpperCase();

  return `<!DOCTYPE html>
<html lang="es" data-wappy-template="true" data-wappy-master-reel="true" data-aspect-ratio="9:16">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>WAPPY IA · Reel Full-Screen Modo Móvil XL (1080×1920 · 60 FPS)</title>
<style>
  :root {
    --lime: #C7F303;
    --teal: #2DD4BF;
    --teal-dark: #0D9488;
    --ink: #0E1300;
    --bg: #06080D;
    --card-bg: #0D131F;
    --text: #F8FAFC;
    --muted: #94A3B8;
    --ok: #22C55E;
    --warn: #F59E0B;
    --err: #EF4444;
    --font: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Plus Jakarta Sans', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: 100%;
    height: 100%;
    background: #04060A;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
    user-select: none;
  }

  #viewport {
    position: relative;
    width: 1080px;
    height: 1920px;
    transform-origin: center center;
    overflow: hidden;
    background: radial-gradient(circle at 50% 18%, rgba(199, 243, 3, 0.13) 0%, rgba(13, 148, 136, 0.09) 36%, #06080D 74%);
    box-shadow: 0 28px 90px rgba(0, 0, 0, 0.85);
    cursor: pointer;
  }

  #bgGrid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1.5px, transparent 1.5px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1.5px, transparent 1.5px);
    background-size: 64px 64px;
    pointer-events: none;
    z-index: 1;
  }

  #ambientOrb1 {
    position: absolute;
    width: 760px;
    height: 760px;
    left: 160px;
    top: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(199, 243, 3, 0.15) 0%, transparent 70%);
    filter: blur(40px);
    pointer-events: none;
    z-index: 1;
  }

  #ambientOrb2 {
    position: absolute;
    width: 820px;
    height: 820px;
    left: 130px;
    top: 900px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(45, 212, 191, 0.13) 0%, transparent 70%);
    filter: blur(50px);
    pointer-events: none;
    z-index: 1;
  }

  /* ===== PERMANENT MEGA-DOCK SUPERIOR (y: 72..236, width: 1016px) ===== */
  #topDockHost {
    position: absolute;
    left: 32px;
    top: 72px;
    width: 1016px;
    height: 166px;
    z-index: 8;
    pointer-events: none;
  }

  .mega-dock {
    width: 100%;
    height: 164px;
    background: rgba(10, 15, 24, 0.94);
    border: 2.5px solid rgba(255, 255, 255, 0.16);
    border-radius: 30px;
    padding: 12px 16px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65);
  }

  .mega-dock-item {
    position: relative;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.04);
    border: 2px solid rgba(255, 255, 255, 0.12);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 4px;
  }

  .mega-dock-logo {
    width: 66px;
    height: 66px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 2px solid rgba(255,255,255,0.22);
    background: #0B0F17;
    flex-shrink: 0;
  }

  .mega-dock-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .mega-dock-num {
    position: absolute;
    top: 6px;
    left: 8px;
    padding: 2px 9px;
    border-radius: 8px;
    font-size: 22px;
    font-weight: 900;
    line-height: 1.1;
  }

  .mega-dock-lbl {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.02em;
    white-space: nowrap;
    line-height: 1;
  }

  /* ===== MAIN FULL-SCREEN STAGE (y: 256..1480, 1016x1224) ===== */
  #stageHost {
    position: absolute;
    left: 32px;
    top: 256px;
    width: 1016px;
    height: 1224px;
    z-index: 5;
    pointer-events: none;
  }

  /* ===== KARAOKE SUBTITLES MODO MÓVIL XL (y: 1512..1722, 56px EXTRABOLD 900) ===== */
  #subHost {
    position: absolute;
    left: 28px;
    top: 1512px;
    width: 1024px;
    height: 210px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9;
    pointer-events: none;
  }

  .sub-pill-xl {
    background: linear-gradient(180deg, rgba(10, 15, 25, 0.96) 0%, rgba(6, 9, 15, 0.98) 100%);
    border: 3px solid rgba(199, 243, 3, 0.45);
    border-radius: 28px;
    padding: 18px 36px 20px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.75), 0 0 32px rgba(199, 243, 3, 0.14);
    max-width: 1020px;
    text-align: center;
  }

  .sub-line-xl {
    font-size: 56px;
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: -0.015em;
    color: #FFFFFF;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 22px;
  }

  .sub-w-xl {
    display: inline-block;
    padding: 0 4px;
  }

  /* ===== FOOTER BRAND WATERMARK (y: 1765..1855) ===== */
  #footerBrand {
    position: absolute;
    left: 32px;
    right: 32px;
    bottom: 48px;
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 26px;
    border-radius: 999px;
    background: rgba(10, 15, 24, 0.88);
    border: 2px solid rgba(255, 255, 255, 0.14);
    z-index: 6;
  }

  .scene-card {
    position: relative;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(14, 21, 33, 0.96) 0%, rgba(8, 12, 20, 0.98) 100%);
    border: 3.5px solid rgba(255, 255, 255, 0.18);
    border-radius: 38px;
    padding: 28px 30px;
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.68);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .hero-tool-head {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 22px;
    flex-shrink: 0;
  }

  .hero-logo-180 {
    width: 180px;
    height: 180px;
    border-radius: 36px;
    background: #0B0F17;
    border: 4px solid var(--lime);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.60), 0 0 32px rgba(199, 243, 3, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .hero-logo-180 img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .hero-title-col {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-self: flex-start;
    align-items: center;
    gap: 10px;
    padding: 7px 20px;
    border-radius: 999px;
    background: rgba(199, 243, 3, 0.18);
    border: 2px solid var(--lime);
    color: var(--lime);
    font-size: 28px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .hero-h1-72 {
    font-size: 52px;
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1.05;
    color: #FFFFFF;
    text-transform: uppercase;
  }

  .hero-sub-34 {
    font-size: 32px;
    font-weight: 800;
    color: #CBD5E1;
    line-height: 1.18;
  }

  #playPrompt {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(6, 8, 13, 0.30);
    transition: opacity 0.2s ease;
  }
  #playPrompt.hidden { opacity: 0; pointer-events: none; }
  .play-cta-pill {
    display: flex;
    align-items: center;
    gap: 20px;
    background: rgba(10, 14, 21, 0.96);
    border: 3px solid var(--lime);
    border-radius: 999px;
    padding: 22px 40px 22px 24px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.80);
    color: #FFFFFF;
    font-size: 34px;
    font-weight: 900;
  }
  .play-circle {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: var(--lime);
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 900;
  }

  #scrubWrap {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 32px;
    z-index: 22;
    display: flex;
    align-items: flex-end;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: auto;
  }
  #viewport:hover #scrubWrap { opacity: 1; }
  body.capture-mode #playPrompt, body.capture-mode #scrubWrap { display: none !important; }
  #scrubTrack { width: 100%; height: 12px; background: rgba(255, 255, 255, 0.18); }
  #scrubFill { height: 100%; width: 0%; background: var(--lime); }
</style>
</head>
<body>
  <div id="viewport">
    <div id="bgGrid"></div>
    <div id="ambientOrb1"></div>
    <div id="ambientOrb2"></div>

    <audio id="bgAudio" preload="auto"${audioDataUri ? ` src="${audioDataUri}"` : ''}></audio>

    <div id="topDockHost"></div>
    <div id="stageHost"></div>
    <div id="subHost"></div>

    <div id="footerBrand">
      <div style="display:flex;align-items:center;gap:14px;">
        <span style="width:16px;height:16px;border-radius:50%;background:#C7F303;box-shadow:0 0 14px #C7F303;"></span>
        <span style="font-size:26px;font-weight:900;color:#FFFFFF;letter-spacing:0.02em;">WAPPY IA · SOMOS SST</span>
      </div>
      <div style="font-size:26px;font-weight:900;color:#C7F303;letter-spacing:0.03em;">
        🌐 wappy.club · MODO MÓVIL XL
      </div>
    </div>

    <div id="playPrompt">
      <div class="play-cta-pill">
        <div class="play-circle">▶</div>
        <div>Toca para reproducir Reel Full-Screen (${totalDur.toFixed(1)}s)</div>
      </div>
    </div>

    <div id="scrubWrap" title="Haz clic para saltar a cualquier segundo">
      <div id="scrubTrack"><div id="scrubFill"></div></div>
    </div>
  </div>

<script>
const LOGOS = ${JSON.stringify(OFFICIAL_LOGOS)};
const INTRO_DURATION = ${introDuration.toFixed(2)};
let TOTAL_DURATION = ${totalDur.toFixed(2)};
const SCENES = ${JSON.stringify(scenes)};
const SUB_PAGES = ${JSON.stringify(subPages)};
const VOZ_DATA = ${JSON.stringify(vozData)};
const COVER_META = {
  badge: ${JSON.stringify(coverBadge)},
  titleTop: ${JSON.stringify(coverTitleTop)},
  titleBot: ${JSON.stringify(coverTitleBot)},
};

const TOOLS_META = [
  { idx: 1, num: "#1", short: "Antigravity", logo: LOGOS.antigravity, bg: "#FFFFFF", pad: "8px", imgSt: "" },
  { idx: 2, num: "#2", short: "Google Flow", logo: LOGOS.flow,        bg: "#000000", pad: "0px", imgSt: "" },
  { idx: 3, num: "#3", short: "NotebookLM",  logo: LOGOS.notebooklm,  bg: "#070A10", pad: "8px", imgSt: "" },
  { idx: 4, num: "#4", short: "Suri IA 3D",  logo: LOGOS.suri,        bg: "#E6FFFA", pad: "0px", imgSt: "object-fit:cover;object-position:center 6%;transform:scale(1.14);" },
  { idx: 5, num: "#5", short: "WAPPY n8n",   logo: LOGOS.wappyCircle, bg: "#FFFFFF", pad: "6px", imgSt: "" }
];

const topDockHost = document.getElementById("topDockHost");
const stageHost = document.getElementById("stageHost");
const subHost = document.getElementById("subHost");
const footerBrand = document.getElementById("footerBrand");

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(a, b, x) {
  const t = clamp((x - a) / Math.max(0.0001, b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
function spring(dt, damping = 17, stiffness = 190) {
  if (dt <= 0) return 0;
  if (dt >= 0.85) return 1;
  const w0 = Math.sqrt(stiffness);
  const zeta = damping / (2 * w0);
  const wd = w0 * Math.sqrt(Math.max(0.001, 1 - zeta * zeta));
  return 1 - Math.exp(-zeta * w0 * dt) * (Math.cos(wd * dt) + (zeta * w0 / wd) * Math.sin(wd * dt));
}

function getVoiceLevel(t) {
  if (VOZ_DATA.length > 0) {
    const idx = clamp(Math.floor(t * 60), 0, VOZ_DATA.length - 1);
    return VOZ_DATA[idx] || 0.25;
  }
  return 0.3 + 0.45 * Math.abs(Math.sin(t * 11.5)) * Math.abs(Math.cos(t * 4.3));
}

function getTransitionStyle(t, sc) {
  const dt = Math.max(0, t - sc.startSec);
  const rem = Math.max(0, sc.endSec - t);
  const sIn = spring(dt);
  const opIn = clamp(dt / 0.24, 0, 1);
  const pOut = rem < 0.28 ? smoothstep(0.28, 0.0, rem) : 0;
  const op = clamp(opIn * (1 - pOut), 0, 1);
  const scale = lerp(0.92 + 0.08 * sIn, 1.12, pOut);
  const ty = lerp((1 - sIn) * 42, -28 * pOut, pOut);
  return \`opacity:\${op.toFixed(3)};transform:translate3d(0,\${ty.toFixed(1)}px,0) scale(\${scale.toFixed(3)});\`;
}

// ============================================================================
// PORTADA HERO 0.00s - 2.00s (MODO MÓVIL XL 1080x1920 + ZOOM-THROUGH)
// ============================================================================
function renderCoverHero(t) {
  topDockHost.innerHTML = "";
  subHost.innerHTML = "";
  footerBrand.style.opacity = "0";
  stageHost.style.top = "56px";
  stageHost.style.height = "1808px";

  const sBadge = spring(t - 0.04);
  const sH1 = spring(t - 0.10);
  const sYellow = spring(t - 0.18);
  const sVisual = spring(t - 0.24);
  const zoomOutP = t > INTRO_DURATION - 0.34 ? smoothstep(INTRO_DURATION - 0.34, INTRO_DURATION, t) : 0;
  const coverScale = lerp(1.0, 1.32, zoomOutP);
  const coverOp = clamp(1 - zoomOutP * 0.95, 0, 1);

  const dockCards = TOOLS_META.map((tm, i) => {
    const sc = spring(t - (0.14 + i * 0.05));
    const is5 = tm.idx === 5;
    return \`
      <div style="padding:14px 10px;border-radius:26px;background:\${is5?'rgba(199,243,3,0.18)':'rgba(15,23,42,0.92)'};border:3px solid \${is5?'#C7F303':'rgba(255,255,255,0.22)'};display:flex;flex-direction:column;align-items:center;gap:10px;transform:scale(\${(0.85+0.15*sc).toFixed(3)});box-shadow:\${is5?'0 0 32px rgba(199,243,3,0.45)':'0 14px 32px rgba(0,0,0,0.6)'};">
        <div style="width:110px;height:110px;border-radius:26px;background:\${tm.bg};padding:\${tm.pad};border:3px solid \${is5?'#C7F303':'rgba(255,255,255,0.28)'};overflow:hidden;display:flex;align-items:center;justify-content:center;">
          <img src="\${tm.logo}" style="width:100%;height:100%;object-fit:contain;\${tm.imgSt}" />
        </div>
        <div style="font-size:25px;font-weight:900;color:\${is5?'#C7F303':'#FFFFFF'};white-space:nowrap;">\${tm.short}</div>
      </div>\`;
  }).join("");

  stageHost.innerHTML = \`
    <div style="width:100%;height:100%;border-radius:44px;background:radial-gradient(circle at 50% 24%, rgba(199,243,3,0.22) 0%, rgba(13,148,136,0.16) 42%, #070B12 85%);border:4px solid #C7F303;padding:42px 34px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 32px 90px rgba(0,0,0,0.85), 0 0 60px rgba(199,243,3,0.24);transform:scale(\${coverScale.toFixed(3)});opacity:\${coverOp.toFixed(3)};overflow:hidden;">
      <div style="text-align:center;">
        <div style="display:inline-flex;align-items:center;gap:12px;padding:12px 32px;border-radius:999px;background:rgba(10,15,25,0.92);border:3px solid #C7F303;color:#C7F303;font-size:32px;font-weight:900;letter-spacing:0.05em;transform:scale(\${sBadge.toFixed(3)});">
          \${COVER_META.badge}
        </div>
        <div style="margin-top:24px;font-size:84px;font-weight:900;line-height:0.98;letter-spacing:-0.035em;color:#FFFFFF;text-transform:uppercase;text-shadow:0 14px 36px rgba(0,0,0,0.85);transform:scale(\${(0.9+0.1*sH1).toFixed(3)});">
          \${COVER_META.titleTop}
        </div>
        <div style="display:inline-block;margin-top:18px;padding:16px 40px;border-radius:26px;background:#C7F303;color:#0E1300;font-size:78px;font-weight:900;line-height:0.98;letter-spacing:-0.035em;text-transform:uppercase;box-shadow:0 20px 55px rgba(199,243,3,0.50);transform:rotate(-1deg) scale(\${(0.88+0.12*sYellow).toFixed(3)});">
          \${COVER_META.titleBot}
        </div>
      </div>

      <!-- Centro Visual 3D Suri + Tenshi + Nodos -->
      <div style="position:relative;height:690px;border-radius:36px;background:linear-gradient(180deg, rgba(15,23,42,0.94) 0%, rgba(7,11,18,0.98) 100%);border:3.5px solid rgba(45,212,191,0.55);padding:28px;display:flex;flex-direction:column;justify-content:space-between;transform:scale(\${(0.92+0.08*sVisual).toFixed(3)});box-shadow:inset 0 0 50px rgba(199,243,3,0.12);">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="padding:8px 24px;border-radius:999px;background:rgba(45,212,191,0.20);border:2px solid #2DD4BF;color:#2DD4BF;font-size:28px;font-weight:900;">● PLATAFORMA SG-SST EN VIVO</span>
          <span style="padding:8px 24px;border-radius:999px;background:#C7F303;color:#0E1300;font-size:28px;font-weight:900;">DECRETO 1072 · RES. 0312 · GTC 45</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-around;gap:24px;my:auto;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
            <div style="width:250px;height:250px;border-radius:50%;background:radial-gradient(circle, #E6FFFA 0%, #2DD4BF 100%);border:6px solid #C7F303;box-shadow:0 0 50px rgba(199,243,3,0.5);overflow:hidden;">
              <img src="\${LOGOS.suri}" style="width:100%;height:100%;object-fit:cover;object-position:center 6%;transform:scale(1.14);" />
            </div>
            <span style="font-size:32px;font-weight:900;color:#FFFFFF;">Suri 3D · Voz 24kHz</span>
          </div>

          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
            <div style="width:250px;height:250px;border-radius:44px;background:#D1FAE5;border:6px solid #2DD4BF;box-shadow:0 0 50px rgba(45,212,191,0.45);display:flex;align-items:center;justify-content:center;overflow:hidden;">
              <img src="\${LOGOS.tenshi}" style="width:230px;height:230px;object-fit:contain;" />
            </div>
            <span style="font-size:32px;font-weight:900;color:#C7F303;">Agente Tenshi · n8n</span>
          </div>
        </div>

        <div style="padding:18px 28px;border-radius:24px;background:rgba(199,243,3,0.14);border:2.5px solid #C7F303;text-align:center;font-size:34px;font-weight:900;color:#FFFFFF;">
          🚀 +50 Herramientas IA · Cero Alucinaciones · Automatización Total
        </div>
      </div>

      <!-- Dock 5 Logos Oficiales XL -->
      <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:14px;">
        \${dockCards}
      </div>
    </div>\`;
}

// ============================================================================
// MEGA-DOCK SUPERIOR PERMANENTE (y: 72..236)
// ============================================================================
function renderTopMegaDock(activeIdx) {
  const itemsHtml = TOOLS_META.map((tm, i) => {
    const isActive = (activeIdx % 5) === i;
    const isPassed = i < (activeIdx % 5);
    const borderCol = isActive ? "#C7F303" : isPassed ? "rgba(45,212,191,0.55)" : "rgba(255,255,255,0.14)";
    const bgCol = isActive ? "linear-gradient(180deg, rgba(199,243,3,0.26) 0%, rgba(13,148,136,0.24) 100%)" : isPassed ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.03)";
    const numBg = isActive ? "#C7F303" : isPassed ? "#2DD4BF" : "rgba(255,255,255,0.14)";
    const numCol = (isActive || isPassed) ? "#0E1300" : "#CBD5E1";
    const lblCol = isActive ? "#C7F303" : isPassed ? "#F8FAFC" : "#94A3B8";
    const scaleVal = isActive ? 1.06 : 1.0;

    return \`
      <div class="mega-dock-item" style="border-color:\${borderCol};background:\${bgCol};transform:scale(\${scaleVal});">
        <div class="mega-dock-num" style="background:\${numBg};color:\${numCol};">\${tm.num}</div>
        <div class="mega-dock-logo" style="background:\${tm.bg};padding:\${tm.pad};border-color:\${isActive?'#C7F303':'rgba(255,255,255,0.2)'};">
          <img src="\${tm.logo}" style="\${tm.imgSt}" />
        </div>
        <div class="mega-dock-lbl" style="color:\${lblCol};">\${tm.short}</div>
      </div>\`;
  }).join("");

  topDockHost.innerHTML = \`<div class="mega-dock">\${itemsHtml}</div>\`;
}

// ============================================================================
// ESCENA ARQUETIPO 1: HOOK-VS-WALL (FX08HeadlineWall + Ruleta 3D 5 IA)
// ============================================================================
function renderSceneHookRoulette(t, sc) {
  const dt = Math.max(0, t - sc.startSec);
  const trStyle = getTransitionStyle(t, sc);
  const hlProg = clamp(spring(dt - 0.35), 0, 1);
  const crazyActive = dt >= sc.durationSec * 0.45;
  const wallShift1 = (t * 95) % 600;
  const wallShift2 = (t * -110) % 600;

  const cx = 478, cy = 255, rx = 365, ry = 95;
  const baseAngle = t * 1.25;

  const sats = TOOLS_META.map((tm, i) => {
    const theta = baseAngle + (i * Math.PI * 2) / 5;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const depth = (sinT + 1) / 2;
    return { tm, sinT, cosT, depth };
  }).sort((a, b) => a.depth - b.depth);

  const rouletteHtml = sats.map((item) => {
    const { tm, cosT, sinT, depth } = item;
    const is5 = tm.idx === 5;
    const x = cx + cosT * rx;
    const y = cy + sinT * ry;
    const scVal = lerp(0.74, 1.18, depth) * (is5 && crazyActive ? 1.12 : 1.0);
    const op = lerp(0.55, 1.0, depth);
    const borderCol = is5 ? "#C7F303" : (depth > 0.65 ? "#2DD4BF" : "rgba(255,255,255,0.28)");

    return \`
      <div style="position:absolute;left:\${x.toFixed(1)}px;top:\${y.toFixed(1)}px;transform:translate(-50%,-50%) scale(\${scVal.toFixed(3)});opacity:\${op.toFixed(3)};z-index:\${Math.round(depth*20)};display:flex;flex-direction:column;align-items:center;gap:10px;">
        <div style="width:164px;height:164px;border-radius:38px;background:\${tm.bg};padding:\${tm.pad};border:4.5px solid \${borderCol};box-shadow:0 22px 48px rgba(0,0,0,0.75)\${is5?', 0 0 42px rgba(199,243,3,0.65)':''};overflow:hidden;display:flex;align-items:center;justify-content:center;">
          <img src="\${tm.logo}" style="width:100%;height:100%;object-fit:contain;\${tm.imgSt}" />
        </div>
        <div style="padding:6px 20px;border-radius:999px;background:\${is5?'#C7F303':'rgba(10,15,25,0.95)'};color:\${is5?'#0E1300':'#FFFFFF'};border:2px solid \${borderCol};font-size:28px;font-weight:900;white-space:nowrap;">
          \${tm.num} · \${tm.short}
        </div>
      </div>\`;
  }).join("");

  stageHost.innerHTML = \`
    <div class="scene-card" style="border-color:rgba(199,243,3,0.55);justify-content:space-between;\${trStyle}">
      <div style="position:absolute;left:-120px;right:-120px;top:24px;opacity:0.13;pointer-events:none;transform:rotate(-2.5deg);">
        <div style="font-size:54px;font-weight:900;color:#C7F303;white-space:nowrap;transform:translateX(\${wallShift1.toFixed(1)}px);">
          AUTOMATIZACIÓN SG-SST CON IA · WAPPY IA · DECRETO 1072 · GTC 45 · RES 0312
        </div>
        <div style="font-size:54px;font-weight:900;color:#2DD4BF;white-space:nowrap;transform:translateX(\${wallShift2.toFixed(1)}px);margin-top:8px;">
          ANTIGRAVITY · GOOGLE FLOW · NOTEBOOKLM · SURI 3D · TENSHI N8N WORKFLOWS
        </div>
      </div>

      <div style="position:relative;z-index:4;text-align:center;padding-top:6px;">
        <div style="display:inline-flex;align-items:center;gap:12px;padding:8px 26px;border-radius:999px;background:rgba(45,212,191,0.18);border:2px solid #2DD4BF;color:#2DD4BF;font-size:29px;font-weight:900;margin-bottom:14px;">
          <span>🚀 \${sc.eyebrow}</span>
        </div>
        <div style="font-size:66px;font-weight:900;line-height:1.04;letter-spacing:-0.035em;color:#FFFFFF;text-transform:uppercase;">
          \${sc.titleBefore}
        </div>
        <div style="position:relative;display:inline-block;margin-top:12px;padding:10px 30px 12px;border-radius:22px;overflow:hidden;border:2.5px solid #C7F303;">
          <div style="position:absolute;inset:0;background:#C7F303;transform-origin:left center;transform:scaleX(\${hlProg.toFixed(3)});"></div>
          <span style="position:relative;z-index:1;font-size:62px;font-weight:900;color:\${hlProg>0.45?'#0E1300':'#FFFFFF'};letter-spacing:-0.03em;text-transform:uppercase;">
            \${sc.titleHighlight}
          </span>
        </div>
      </div>

      <div style="position:relative;width:100%;height:510px;z-index:5;">
        <svg viewBox="0 0 956 510" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;">
          <ellipse cx="\${cx}" cy="\${cy}" rx="\${rx}" ry="\${ry}" fill="none" stroke="rgba(199,243,3,0.32)" stroke-width="3.5" stroke-dasharray="14 10" />
        </svg>
        \${rouletteHtml}
      </div>

      <div style="position:relative;z-index:6;padding:24px 30px;border-radius:28px;background:\${crazyActive?'linear-gradient(90deg, rgba(199,243,3,0.26), rgba(45,212,191,0.22))':'rgba(15,23,42,0.92)'};border:3.5px solid \${crazyActive?'#C7F303':'rgba(255,255,255,0.22)'};display:flex;align-items:center;justify-content:space-between;transform:scale(\${(crazyActive ? 1.0 + 0.025*Math.sin(t*8) : 0.98).toFixed(3)});">
        <div style="display:flex;align-items:center;gap:18px;">
          <div style="width:76px;height:76px;border-radius:20px;background:#C7F303;color:#0E1300;font-size:38px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ⚡IA
          </div>
          <div>
            <div style="font-size:38px;font-weight:900;color:\${crazyActive?'#C7F303':'#FFFFFF'};line-height:1.1;">
              \${sc.step1} · \${sc.step2}
            </div>
            <div style="font-size:30px;font-weight:800;color:#E2E8F0;margin-top:4px;">
              \${sc.subtitle}
            </div>
          </div>
        </div>
      </div>
    </div>\`;
}

// ============================================================================
// ESCENA ARQUETIPO 2: BENTO-KPI / AGENTIC WORKSPACE (fxZoomThrough + 3 Pasos)
// ============================================================================
function renderSceneBentoAgentic(t, sc) {
  const dt = Math.max(0, t - sc.startSec);
  const trStyle = getTransitionStyle(t, sc);
  const p1 = spring(dt - sc.durationSec * 0.12);
  const p2 = spring(dt - sc.durationSec * 0.36);
  const p3 = spring(dt - sc.durationSec * 0.60);
  const progPct = Math.round(clamp(dt / Math.max(1.2, sc.durationSec * 0.78), 0, 1) * 100);
  const logoSrc = LOGOS[sc.toolKey] || LOGOS.antigravity;

  stageHost.innerHTML = \`
    <div class="scene-card" style="border-color:#2DD4BF;\${trStyle}">
      <div class="hero-tool-head">
        <div class="hero-logo-180" style="background:#FFFFFF;padding:14px;border-color:#2DD4BF;">
          <img src="\${logoSrc}" />
        </div>
        <div class="hero-title-col">
          <div class="hero-eyebrow" style="border-color:#2DD4BF;color:#2DD4BF;background:rgba(45,212,191,0.16);">
            \${sc.eyebrow}
          </div>
          <div class="hero-h1-72">\${sc.titleBefore} <span style="color:#C7F303;">\${sc.titleHighlight}</span></div>
          <div class="hero-sub-34">\${sc.subtitle}</div>
        </div>
      </div>

      <div style="flex:1;border-radius:30px;background:#080D16;border:3px solid rgba(45,212,191,0.45);padding:22px 24px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:inset 0 0 40px rgba(45,212,191,0.08);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:2px solid rgba(255,255,255,0.10);">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="width:18px;height:18px;border-radius:50%;background:#EF4444;"></span>
            <span style="width:18px;height:18px;border-radius:50%;background:#F59E0B;"></span>
            <span style="width:18px;height:18px;border-radius:50%;background:#22C55E;"></span>
            <span style="margin-left:12px;font-size:30px;font-weight:900;color:#E2E8F0;">sgsst-automatizado-wappy.agy</span>
          </div>
          <div style="padding:6px 20px;border-radius:999px;background:#C7F303;color:#0E1300;font-size:28px;font-weight:900;">
            AVANCE IA: \${progPct}%
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:16px 0;">
          <div style="padding:22px;border-radius:24px;background:rgba(15,23,42,0.95);border:2.5px solid rgba(45,212,191,0.40);">
            <div style="font-size:28px;font-weight:900;color:#2DD4BF;margin-bottom:12px;">⚡ AGENTE IA EJECUTANDO</div>
            <div style="font-size:31px;font-weight:800;color:#FFFFFF;line-height:1.42;">
              ✓ \${sc.step1}<br/>
              ✓ \${sc.step2}<br/>
              ✓ \${sc.step3}
            </div>
            <div style="margin-top:16px;height:16px;border-radius:999px;background:rgba(255,255,255,0.10);overflow:hidden;">
              <div style="height:100%;width:\${progPct}%;background:linear-gradient(90deg,#2DD4BF,#C7F303);"></div>
            </div>
          </div>

          <div style="padding:22px;border-radius:24px;background:rgba(15,23,42,0.95);border:2.5px solid rgba(199,243,3,0.45);display:flex;flex-direction:column;justify-content:space-between;">
            <div style="font-size:28px;font-weight:900;color:#C7F303;">📊 IMPACTO OPERATIVO SST</div>
            <div style="display:flex;justify-content:space-between;font-size:30px;font-weight:900;color:#FFFFFF;">
              <span>🏢 Matriz GTC 45</span><span style="color:#4ADE80;">100% ✓</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:30px;font-weight:900;color:#FFFFFF;">
              <span>📋 Estándares 0312</span><span style="color:#4ADE80;">98% ✓</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:30px;font-weight:900;color:#FFFFFF;">
              <span>⚡ Ahorro Papeleo</span><span style="color:#C7F303;">-85% ✓</span>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;">
          <div style="padding:22px 16px;border-radius:24px;background:\${p1>0.05?'rgba(45,212,191,0.18)':'rgba(255,255,255,0.04)'};border:3px solid \${p1>0.05?'#2DD4BF':'rgba(255,255,255,0.14)'};text-align:center;transform:scale(\${(0.92+0.08*p1).toFixed(3)});">
            <div style="font-size:50px;margin-bottom:8px;">📁</div>
            <div style="font-size:31px;font-weight:900;color:#FFFFFF;">1. \${sc.step1}</div>
            <div style="font-size:25px;font-weight:800;color:#2DD4BF;margin-top:4px;">Automático</div>
          </div>
          <div style="padding:22px 16px;border-radius:24px;background:\${p2>0.05?'rgba(45,212,191,0.18)':'rgba(255,255,255,0.04)'};border:3px solid \${p2>0.05?'#2DD4BF':'rgba(255,255,255,0.14)'};text-align:center;transform:scale(\${(0.92+0.08*p2).toFixed(3)});">
            <div style="font-size:50px;margin-bottom:8px;">🛡️</div>
            <div style="font-size:31px;font-weight:900;color:#FFFFFF;">2. \${sc.step2}</div>
            <div style="font-size:25px;font-weight:800;color:#2DD4BF;margin-top:4px;">Verificado</div>
          </div>
          <div style="padding:22px 16px;border-radius:24px;background:\${p3>0.05?'rgba(199,243,3,0.22)':'rgba(255,255,255,0.04)'};border:3px solid \${p3>0.05?'#C7F303':'rgba(255,255,255,0.14)'};text-align:center;transform:scale(\${(0.92+0.08*p3).toFixed(3)});">
            <div style="font-size:50px;margin-bottom:8px;">⚡</div>
            <div style="font-size:31px;font-weight:900;color:#C7F303;">3. \${sc.step3}</div>
            <div style="font-size:25px;font-weight:800;color:#FFFFFF;margin-top:4px;">En Segundos</div>
          </div>
        </div>
      </div>
    </div>\`;
}

// ============================================================================
// ESCENA ARQUETIPO 3: FLOW-SPLIT-BEFORE-AFTER (Escáner Láser + Antes/Después)
// ============================================================================
function renderSceneFlowSplit(t, sc) {
  const dt = Math.max(0, t - sc.startSec);
  const trStyle = getTransitionStyle(t, sc);
  const befOn = spring(dt - 0.12);
  const aftOn = spring(dt - sc.durationSec * 0.38);
  const scanY = ((dt * 0.58) % 1) * 100;

  let waveBars = "";
  for (let i = 0; i < 24; i++) {
    const h = 18 + Math.abs(Math.sin(t * 7 + i * 0.55)) * 42;
    waveBars += \`<div style="width:12px;height:\${h.toFixed(1)}px;border-radius:6px;background:\${i%2===0?'#C7F303':'#2DD4BF'};"></div>\`;
  }

  stageHost.innerHTML = \`
    <div class="scene-card" style="border-color:#C7F303;\${trStyle}">
      <div class="hero-tool-head">
        <div class="hero-logo-180" style="background:#000000;padding:0px;border-color:#C7F303;">
          <img src="\${LOGOS.flow}" />
        </div>
        <div class="hero-title-col">
          <div class="hero-eyebrow">\${sc.eyebrow}</div>
          <div class="hero-h1-72">\${sc.titleBefore} <span style="color:#C7F303;">\${sc.titleHighlight}</span></div>
          <div class="hero-sub-34">\${sc.subtitle}</div>
        </div>
      </div>

      <div style="position:relative;flex:1;display:flex;flex-direction:column;gap:18px;overflow:hidden;border-radius:30px;">
        <div style="position:absolute;left:0;right:0;top:\${scanY.toFixed(1)}%;height:6px;background:#C7F303;box-shadow:0 0 28px #C7F303, 0 0 56px #2DD4BF;z-index:10;"></div>

        <div style="flex:1;border-radius:28px;background:linear-gradient(135deg, rgba(239,68,68,0.24) 0%, rgba(15,23,42,0.96) 100%);border:3.5px solid #EF4444;padding:22px 28px;display:flex;align-items:center;justify-content:space-between;transform:scale(\${(0.94 + 0.06*befOn).toFixed(3)});">
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:inline-flex;align-self:flex-start;padding:6px 20px;border-radius:999px;background:#EF4444;color:#FFFFFF;font-size:28px;font-weight:900;">
              ❌ ANTES: GESTIÓN MANUAL LENTA
            </div>
            <div style="font-size:42px;font-weight:900;color:#FFFFFF;line-height:1.1;">
              Reprocesos en Excel, formatos sueltos y riesgo de hallazgos
            </div>
            <div style="font-size:29px;font-weight:800;color:#FCA5A5;">
              ⚠️ Horas perdidas · Sin alertas preventivas en tiempo real
            </div>
          </div>
          <div style="width:164px;height:164px;border-radius:28px;background:rgba(239,68,68,0.22);border:3px solid #EF4444;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
            <div style="font-size:66px;">🚨</div>
            <div style="font-size:26px;font-weight:900;color:#FCA5A5;">RIESGO</div>
          </div>
        </div>

        <div style="flex:1;border-radius:28px;background:linear-gradient(135deg, rgba(34,197,94,0.24) 0%, rgba(15,23,42,0.96) 100%);border:3.5px solid \${aftOn>0.1?'#C7F303':'#22C55E'};padding:22px 28px;display:flex;align-items:center;justify-content:space-between;transform:scale(\${(0.94 + 0.06*aftOn).toFixed(3)});box-shadow:\${aftOn>0.1?'0 0 36px rgba(199,243,3,0.25)':'none'};">
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:inline-flex;align-self:flex-start;padding:6px 20px;border-radius:999px;background:#C7F303;color:#0E1300;font-size:28px;font-weight:900;">
              ✅ AHORA CON WAPPY IA: \${sc.titleHighlight}
            </div>
            <div style="font-size:42px;font-weight:900;color:#FFFFFF;line-height:1.1;">
              \${sc.subtitle}
            </div>
            <div style="display:flex;align-items:center;gap:16px;margin-top:4px;">
              <span style="font-size:28px;font-weight:900;color:#4ADE80;">⚡ IA ACTIVA:</span>
              <div style="display:flex;align-items:center;gap:6px;height:52px;">\${waveBars}</div>
            </div>
          </div>
          <div style="width:164px;height:164px;border-radius:28px;background:rgba(34,197,94,0.22);border:3px solid #C7F303;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
            <div style="font-size:66px;">🛡️</div>
            <div style="font-size:26px;font-weight:900;color:#C7F303;">CONTROL OK</div>
          </div>
        </div>
      </div>
    </div>\`;
}

// ============================================================================
// ESCENA ARQUETIPO 4: VISOR-NORMATIVO-REAL (Resaltador Flúor + Mapa Mental SVG)
// ============================================================================
function renderSceneVisorNorma(t, sc) {
  const dt = Math.max(0, t - sc.startSec);
  const trStyle = getTransitionStyle(t, sc);
  const dur = Math.max(2.0, sc.durationSec);
  const hl1 = clamp((dt - dur * 0.08) / (dur * 0.25), 0, 1);
  const hl2 = clamp((dt - dur * 0.28) / (dur * 0.25), 0, 1);
  const hl3 = clamp((dt - dur * 0.48) / (dur * 0.25), 0, 1);

  const n1 = spring(dt - dur * 0.35);
  const n2 = spring(dt - dur * 0.52);
  const n3 = spring(dt - dur * 0.68);

  stageHost.innerHTML = \`
    <div class="scene-card" style="border-color:#2DD4BF;justify-content:space-between;\${trStyle}">
      <div class="hero-tool-head">
        <div class="hero-logo-180" style="background:#070A10;padding:18px;border-color:#C7F303;">
          <img src="\${LOGOS.notebooklm}" />
        </div>
        <div class="hero-title-col">
          <div class="hero-eyebrow">\${sc.eyebrow}</div>
          <div class="hero-h1-72">\${sc.titleBefore} <span style="color:#C7F303;">\${sc.titleHighlight}</span></div>
          <div class="hero-sub-34">\${sc.subtitle}</div>
        </div>
      </div>

      <div style="position:relative;border-radius:28px;background:#FBFBF9;border:4px solid #CBD5E1;padding:22px 28px;color:#0F172A;box-shadow:0 18px 40px rgba(0,0,0,0.55);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:2.5px solid #E2E8F0;padding-bottom:10px;">
          <span style="font-size:29px;font-weight:900;color:#0F172A;">📜 BIBLIOTECA LEGAL OFICIAL · NOTEBOOKLM & WAPPY IA</span>
          <span style="padding:6px 18px;border-radius:999px;background:#0E1300;color:#C7F303;font-size:25px;font-weight:900;">✓ 0% ALUCINACIONES</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="position:relative;padding:10px 16px;border-radius:14px;background:#F1F5F9;overflow:hidden;">
            <div style="position:absolute;inset:0;background:rgba(199,243,3,0.68);transform-origin:left center;transform:scaleX(\${hl1.toFixed(3)});"></div>
            <div style="position:relative;z-index:1;font-size:32px;font-weight:900;color:#0F172A;">
              ✓ Decreto 1072 de 2015 · Cap. 6 SG-SST: \${sc.step1}
            </div>
          </div>
          <div style="position:relative;padding:10px 16px;border-radius:14px;background:#F1F5F9;overflow:hidden;">
            <div style="position:absolute;inset:0;background:rgba(45,212,191,0.52);transform-origin:left center;transform:scaleX(\${hl2.toFixed(3)});"></div>
            <div style="position:relative;z-index:1;font-size:32px;font-weight:900;color:#0F172A;">
              ✓ Resolución 0312 de 2019 · Estándares Mínimos: \${sc.step2}
            </div>
          </div>
          <div style="position:relative;padding:10px 16px;border-radius:14px;background:#F1F5F9;overflow:hidden;">
            <div style="position:absolute;inset:0;background:rgba(199,243,3,0.68);transform-origin:left center;transform:scaleX(\${hl3.toFixed(3)});"></div>
            <div style="position:relative;z-index:1;font-size:32px;font-weight:900;color:#0F172A;">
              ✓ Guía Técnica GTC 45 · Matriz IPEVR: \${sc.step3}
            </div>
          </div>
        </div>
      </div>

      <svg viewBox="0 0 956 68" style="width:100%;height:68px;overflow:visible;">
        <path d="M 478 0 C 478 34, 160 34, 160 66" fill="none" stroke="#C7F303" stroke-width="5" />
        <path d="M 478 0 L 478 66" fill="none" stroke="#2DD4BF" stroke-width="5" />
        <path d="M 478 0 C 478 34, 796 34, 796 66" fill="none" stroke="#C7F303" stroke-width="5" />
      </svg>

      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:18px;">
        <div style="padding:22px 16px;border-radius:26px;background:\${n1>0.05?'rgba(199,243,3,0.20)':'rgba(15,23,42,0.92)'};border:3.5px solid \${n1>0.05?'#C7F303':'rgba(255,255,255,0.16)'};text-align:center;transform:scale(\${(0.90+0.10*n1).toFixed(3)});">
          <div style="font-size:54px;margin-bottom:8px;">🎙️</div>
          <div style="font-size:34px;font-weight:900;color:#FFFFFF;">Wappy Podcast</div>
          <div style="font-size:26px;font-weight:800;color:#C7F303;margin-top:6px;">Audio Estudio 24kHz</div>
        </div>

        <div style="padding:22px 16px;border-radius:26px;background:\${n2>0.05?'rgba(45,212,191,0.20)':'rgba(15,23,42,0.92)'};border:3.5px solid \${n2>0.05?'#2DD4BF':'rgba(255,255,255,0.16)'};text-align:center;transform:scale(\${(0.90+0.10*n2).toFixed(3)});">
          <div style="font-size:54px;margin-bottom:8px;">🧠</div>
          <div style="font-size:34px;font-weight:900;color:#FFFFFF;">Mapa Mental</div>
          <div style="font-size:26px;font-weight:800;color:#2DD4BF;margin-top:6px;">Fuentes Verificadas</div>
        </div>

        <div style="padding:22px 16px;border-radius:26px;background:\${n3>0.05?'rgba(199,243,3,0.20)':'rgba(15,23,42,0.92)'};border:3.5px solid \${n3>0.05?'#C7F303':'rgba(255,255,255,0.16)'};text-align:center;transform:scale(\${(0.90+0.10*n3).toFixed(3)});">
          <div style="font-size:54px;margin-bottom:8px;">✅</div>
          <div style="font-size:34px;font-weight:900;color:#FFFFFF;">Auditoría ARL</div>
          <div style="font-size:26px;font-weight:800;color:#C7F303;margin-top:6px;">Respaldo Legal 100%</div>
        </div>
      </div>
    </div>\`;
}

// ============================================================================
// ESCENA ARQUETIPO 5: SURI-VOICE-LIVE-HUD (iPhone 16 Pro + Suri 260px + Onda)
// ============================================================================
function renderSceneSuriHud(t, sc) {
  const dt = Math.max(0, t - sc.startSec);
  const trStyle = getTransitionStyle(t, sc);
  const dur = Math.max(2.0, sc.durationSec);
  const voiceLvl = getVoiceLevel(t);
  const suriBounce = 1 + voiceLvl * 0.08;

  const a1 = spring(dt - dur * 0.16);
  const a2 = spring(dt - dur * 0.40);
  const a3 = spring(dt - dur * 0.64);

  let waveHtml = "";
  for (let i = 0; i < 18; i++) {
    const barH = 16 + (0.25 + voiceLvl) * 58 * Math.abs(Math.sin(t * 9 + i * 0.6));
    waveHtml += \`<div style="width:11px;height:\${barH.toFixed(1)}px;border-radius:999px;background:#C7F303;"></div>\`;
  }

  stageHost.innerHTML = \`
    <div class="scene-card" style="border-color:#2DD4BF;\${trStyle}">
      <div class="hero-tool-head">
        <div class="hero-logo-180" style="background:#E6FFFA;padding:0px;border-color:#2DD4BF;">
          <img src="\${LOGOS.suri}" style="object-fit:cover;object-position:center 6%;transform:scale(1.14);" />
        </div>
        <div class="hero-title-col">
          <div class="hero-eyebrow" style="border-color:#2DD4BF;color:#2DD4BF;background:rgba(45,212,191,0.16);">
            \${sc.eyebrow}
          </div>
          <div class="hero-h1-72">\${sc.titleBefore} <span style="color:#C7F303;">\${sc.titleHighlight}</span></div>
          <div class="hero-sub-34">\${sc.subtitle}</div>
        </div>
      </div>

      <div style="flex:1;border-radius:44px;background:linear-gradient(180deg, #0B1320 0%, #070B12 100%);border:5px solid #334155;padding:20px 28px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:inset 0 0 40px rgba(45,212,191,0.12), 0 24px 60px rgba(0,0,0,0.75);">
        <div style="align-self:center;padding:10px 34px;border-radius:999px;background:#000000;border:2px solid rgba(199,243,3,0.55);display:flex;align-items:center;gap:16px;">
          <span style="width:16px;height:16px;border-radius:50%;background:#C7F303;box-shadow:0 0 14px #C7F303;"></span>
          <span style="font-size:28px;font-weight:900;color:#FFFFFF;letter-spacing:0.03em;">SURI 3D & TENSHI · ASISTENTE SG-SST EN VIVO</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:center;gap:34px;margin:8px 0;">
          <div style="position:relative;width:250px;height:250px;border-radius:50%;background:radial-gradient(circle, #E6FFFA 0%, #2DD4BF 100%);border:5px solid #C7F303;box-shadow:0 0 50px rgba(199,243,3,0.45);overflow:hidden;transform:scale(\${suriBounce.toFixed(3)});flex-shrink:0;">
            <img src="\${LOGOS.suri}" style="width:100%;height:100%;object-fit:cover;object-position:center 6%;transform:scale(1.14);" />
          </div>

          <div style="display:flex;flex-direction:column;gap:14px;flex:1;">
            <div style="font-size:34px;font-weight:900;color:#C7F303;">🎙️ «Hola, actualicé tu SG-SST hoy:»</div>
            <div style="display:flex;align-items:center;gap:8px;height:76px;padding:10px 20px;border-radius:22px;background:rgba(255,255,255,0.05);border:2px solid rgba(199,243,3,0.35);">
              \${waveHtml}
            </div>
            <div style="font-size:28px;font-weight:800;color:#CBD5E1;">\${sc.subtitle}</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="padding:18px 24px;border-radius:24px;background:\${a1>0.05?'rgba(245,158,11,0.20)':'rgba(255,255,255,0.04)'};border:3px solid \${a1>0.05?'#F59E0B':'rgba(255,255,255,0.12)'};display:flex;align-items:center;justify-content:space-between;transform:scale(\${(0.95+0.05*a1).toFixed(3)});">
            <div style="display:flex;align-items:center;gap:16px;">
              <span style="font-size:42px;">📊</span>
              <span style="font-size:34px;font-weight:900;color:#FFFFFF;">\${sc.step1}</span>
            </div>
            <span style="padding:8px 20px;border-radius:999px;background:#F59E0B;color:#0E1300;font-size:26px;font-weight:900;">EN VIVO</span>
          </div>

          <div style="padding:18px 24px;border-radius:24px;background:\${a2>0.05?'rgba(34,197,94,0.20)':'rgba(255,255,255,0.04)'};border:3px solid \${a2>0.05?'#22C55E':'rgba(255,255,255,0.12)'};display:flex;align-items:center;justify-content:space-between;transform:scale(\${(0.95+0.05*a2).toFixed(3)});">
            <div style="display:flex;align-items:center;gap:16px;">
              <span style="font-size:42px;">🩺</span>
              <span style="font-size:34px;font-weight:900;color:#FFFFFF;">\${sc.step2}</span>
            </div>
            <span style="padding:8px 20px;border-radius:999px;background:#22C55E;color:#0E1300;font-size:26px;font-weight:900;">✓ LISTO</span>
          </div>

          <div style="padding:18px 24px;border-radius:24px;background:\${a3>0.05?'rgba(199,243,3,0.20)':'rgba(255,255,255,0.04)'};border:3px solid \${a3>0.05?'#C7F303':'rgba(255,255,255,0.12)'};display:flex;align-items:center;justify-content:space-between;transform:scale(\${(0.95+0.05*a3).toFixed(3)});">
            <div style="display:flex;align-items:center;gap:16px;">
              <span style="font-size:42px;">🚨</span>
              <span style="font-size:34px;font-weight:900;color:#FFFFFF;">\${sc.step3}</span>
            </div>
            <span style="padding:8px 20px;border-radius:999px;background:#C7F303;color:#0E1300;font-size:26px;font-weight:900;">AL DÍA 100%</span>
          </div>
        </div>
      </div>
    </div>\`;
}

// ============================================================================
// ESCENA ARQUETIPO 6: WAPPY-N8N-WORKFLOW (Lienzo Blanco n8n + Cámara 3D)
// ============================================================================
function renderSceneWappyN8n(t, sc) {
  const dt = Math.max(0, t - sc.startSec);
  const dur = Math.max(2.5, sc.durationSec);
  const trStyle = getTransitionStyle(t, sc);
  const prog = clamp(dt / dur, 0, 1);
  const numTools = Math.min(50, Math.max(1, Math.round(lerp(1, 50, clamp(prog * 1.6, 0, 1)))));

  let camScale = 1.0, camX = 0, camY = 0, focusLabel = "LIENZO n8n · +50 IA SST";
  if (prog >= 0.18 && prog < 0.44) {
    const p = smoothstep(0.18, 0.28, prog);
    camScale = lerp(1.0, 1.15, p);
    camX = lerp(0, 145, p);
    camY = lerp(0, 14, p);
    focusLabel = "PASO 1 · CRON SST (LUNES 7:00 AM)";
  } else if (prog >= 0.44 && prog < 0.70) {
    const p = smoothstep(0.44, 0.54, prog);
    camScale = lerp(1.15, 1.14, p);
    camX = lerp(145, 0, p);
    camY = lerp(14, -12, p);
    focusLabel = "PASO 2 · AGENTE TENSHI + GEMINI";
  } else if (prog >= 0.70 && prog < 0.88) {
    const p = smoothstep(0.70, 0.78, prog);
    camScale = lerp(1.14, 1.15, p);
    camX = lerp(0, -145, p);
    camY = lerp(-12, 14, p);
    focusLabel = "PASO 3 · DESPACHO AUTOMÁTICO";
  } else if (prog >= 0.88) {
    const p = smoothstep(0.88, 0.96, prog);
    camScale = lerp(1.15, 1.0, p);
    camX = lerp(-145, 0, p);
    camY = lerp(14, 0, p);
    focusLabel = "★ FLUJO COMPLETO AUTOMATIZADO";
  }

  const u1 = (t * 1.45) % 1;
  const u2 = (t * 1.45 + 0.45) % 1;
  const p1X = lerp(250, 345, u1);
  const p2X = lerp(615, 706, u2);

  stageHost.innerHTML = \`
    <div class="scene-card" style="border-color:#C7F303;box-shadow:0 28px 70px rgba(0,0,0,0.75), 0 0 50px rgba(199,243,3,0.22);\${trStyle}">
      <div class="hero-tool-head">
        <div class="hero-logo-180" style="background:#FFFFFF;padding:10px;border-radius:50%;border-color:#C7F303;">
          <img src="\${LOGOS.wappyCircle}" />
        </div>
        <div class="hero-title-col">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div class="hero-eyebrow" style="background:#C7F303;color:#0E1300;white-space:nowrap;">
              \${sc.eyebrow}
            </div>
            <div style="padding:7px 22px;border-radius:999px;background:#0E1300;border:3px solid #C7F303;color:#C7F303;font-size:30px;font-weight:900;white-space:nowrap;">
              +\${numTools} IA SST
            </div>
          </div>
          <div class="hero-h1-72">\${sc.titleBefore} <span style="color:#C7F303;">\${sc.titleHighlight}</span></div>
          <div class="hero-sub-34">\${sc.subtitle}</div>
        </div>
      </div>

      <div style="position:relative;flex:1;border-radius:32px;background:#F8FAFC;border:4px solid #C7F303;overflow:hidden;box-shadow:inset 0 0 36px rgba(15,23,42,0.12);">
        <div style="position:absolute;inset:0;background-image:radial-gradient(#94A3B8 2.2px, transparent 2.2px);background-size:28px 28px;opacity:0.55;"></div>

        <div style="position:absolute;top:16px;left:20px;right:20px;display:flex;align-items:center;justify-content:space-between;z-index:10;">
          <div style="padding:10px 24px;border-radius:999px;background:#0F172A;border:2.5px solid #C7F303;color:#C7F303;font-size:27px;font-weight:900;white-space:nowrap;">
            🎥 \${focusLabel}
          </div>
          <div style="padding:10px 22px;border-radius:999px;background:#059669;color:#FFFFFF;font-size:27px;font-weight:900;white-space:nowrap;">
            ● FLUJO ACTIVO
          </div>
        </div>

        <div style="position:absolute;inset:0;transform-origin:center center;transform:translate3d(\${camX.toFixed(1)}px, \${camY.toFixed(1)}px, 0) scale(\${camScale.toFixed(3)});">
          <svg viewBox="0 0 956 880" style="position:absolute;inset:0;width:100%;height:100%;z-index:2;overflow:visible;">
            <path d="M 248 295 C 295 295, 300 295, 344 295" fill="none" stroke="#0EA5E9" stroke-width="8" />
            <path d="M 612 295 C 660 295, 665 295, 708 295" fill="none" stroke="#10B981" stroke-width="8" />
            <path d="M 430 435 L 300 545" fill="none" stroke="#7C3AED" stroke-width="5" stroke-dasharray="10 8" />
            <path d="M 530 435 L 660 545" fill="none" stroke="#059669" stroke-width="5" stroke-dasharray="10 8" />
            <circle cx="\${p1X.toFixed(1)}" cy="295" r="14" fill="#C7F303" stroke="#0E1300" stroke-width="3" />
            <circle cx="\${p2X.toFixed(1)}" cy="295" r="14" fill="#C7F303" stroke="#0E1300" stroke-width="3" />
          </svg>

          <div style="position:absolute;left:28px;top:165px;width:220px;height:255px;border-radius:32px;background:#FFFFFF;border:4px solid #0EA5E9;box-shadow:0 20px 44px rgba(15,23,42,0.16);padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:4;">
            <div style="padding:4px 16px;border-radius:999px;background:#E0F2FE;color:#0369A1;font-size:24px;font-weight:900;">1 · TRIGGER</div>
            <div style="font-size:60px;">⚡</div>
            <div style="font-size:34px;font-weight:900;color:#0F172A;text-align:center;line-height:1.05;">Cron SST</div>
            <div style="font-size:25px;font-weight:800;color:#0284C7;text-align:center;line-height:1.15;white-space:nowrap;">Lunes 7:00 AM</div>
          </div>

          <div style="position:absolute;left:344px;top:150px;width:268px;height:285px;border-radius:36px;background:#FFFFFF;border:5px solid #14B8A6;box-shadow:0 0 0 8px rgba(20,184,166,0.20), 0 24px 50px rgba(15,23,42,0.20);padding:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:5;">
            <div style="padding:4px 16px;border-radius:999px;background:#F3E8FF;color:#6B21A8;font-size:24px;font-weight:900;white-space:nowrap;">ORQUESTADOR IA</div>
            <div style="width:140px;height:140px;border-radius:28px;background:#D1FAE5;border:3px solid #10B981;overflow:hidden;display:flex;align-items:center;justify-content:center;">
              <img src="\${LOGOS.tenshi}" style="width:132px;height:132px;object-fit:contain;" />
            </div>
            <div style="font-size:33px;font-weight:900;color:#0F172A;line-height:1;white-space:nowrap;">Agente Tenshi</div>
          </div>

          <div style="position:absolute;left:708px;top:165px;width:220px;height:255px;border-radius:32px;background:#FFFFFF;border:4px solid #10B981;box-shadow:0 20px 44px rgba(15,23,42,0.16);padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:4;">
            <div style="padding:4px 16px;border-radius:999px;background:#DCFCE7;color:#15803D;font-size:24px;font-weight:900;">3 · ACCIÓN</div>
            <div style="font-size:60px;">✉️</div>
            <div style="font-size:32px;font-weight:900;color:#0F172A;text-align:center;line-height:1.05;">Gmail / WA</div>
            <div style="font-size:25px;font-weight:800;color:#15803D;text-align:center;line-height:1.15;white-space:nowrap;">Informe & Alerta</div>
          </div>

          <div style="position:absolute;left:95px;top:545px;width:365px;padding:16px 20px;border-radius:26px;background:#FFFFFF;border:4px solid #7C3AED;box-shadow:0 16px 36px rgba(15,23,42,0.15);display:flex;align-items:center;gap:14px;z-index:4;">
            <span style="font-size:42px;">✦</span>
            <div>
              <div style="font-size:29px;font-weight:900;color:#0F172A;white-space:nowrap;">Google Gemini 3.8</div>
              <div style="font-size:24px;font-weight:800;color:#6D28D9;white-space:nowrap;">Cerebro Pericial SST</div>
            </div>
          </div>

          <div style="position:absolute;left:485px;top:545px;width:395px;padding:16px 20px;border-radius:26px;background:#FFFFFF;border:4px solid #059669;box-shadow:0 16px 36px rgba(15,23,42,0.15);display:flex;align-items:center;gap:14px;z-index:4;">
            <span style="font-size:42px;">🛡️</span>
            <div>
              <div style="font-size:29px;font-weight:900;color:#0F172A;white-space:nowrap;">ARL · SENA · GTC 45</div>
              <div style="font-size:24px;font-weight:800;color:#059669;white-space:nowrap;">Memoria +50 Herramientas</div>
            </div>
          </div>
        </div>
      </div>
    </div>\`;
}

// ============================================================================
// ESCENA ARQUETIPO 7: PENTAGON-ORBITAL / FXOrbit 3D + CTA WAPPY.CLUB
// ============================================================================
function renderSceneFinalOrbit(t, sc) {
  const dt = Math.max(0, t - sc.startSec);
  const trStyle = getTransitionStyle(t, sc);

  const ORBIT_SATS = [
    { name: "Antigravity", logo: LOGOS.antigravity, bg: "#FFFFFF", pad: "10px", st: "" },
    { name: "Google Flow", logo: LOGOS.flow,        bg: "#000000", pad: "0px",  st: "" },
    { name: "NotebookLM",  logo: LOGOS.notebooklm,  bg: "#070A10", pad: "10px", st: "" },
    { name: "Suri 3D",     logo: LOGOS.suri,        bg: "#E6FFFA", pad: "0px",  st: "object-fit:cover;object-position:center 6%;transform:scale(1.14);" },
    { name: "Tenshi 3D",   logo: LOGOS.tenshi,      bg: "#D1FAE5", pad: "4px",  st: "" }
  ];

  const cx = 478, cy = 285, rx = 380, ry = 122;
  const baseAngle = t * 1.25;

  const sorted = ORBIT_SATS.map((sat, i) => {
    const theta = baseAngle + (i * Math.PI * 2) / ORBIT_SATS.length;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const depth = (sinT + 1) / 2;
    return { sat, sinT, cosT, depth };
  }).sort((a, b) => a.depth - b.depth);

  let satsBack = "", satsFront = "";
  for (const item of sorted) {
    const { sat, cosT, sinT, depth } = item;
    const x = cx + cosT * rx;
    const y = cy + sinT * ry;
    const scVal = lerp(0.74, 1.15, depth);
    const op = lerp(0.60, 1.0, depth);
    const el = \`
      <div style="position:absolute;left:\${x.toFixed(1)}px;top:\${y.toFixed(1)}px;transform:translate(-50%,-50%) scale(\${scVal.toFixed(3)});opacity:\${op.toFixed(3)};display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="width:132px;height:132px;border-radius:32px;background:\${sat.bg};padding:\${sat.pad};border:3.5px solid #C7F303;box-shadow:0 18px 40px rgba(0,0,0,0.75);overflow:hidden;display:flex;align-items:center;justify-content:center;">
          <img src="\${sat.logo}" style="width:100%;height:100%;object-fit:contain;\${sat.st}" />
        </div>
        <div style="padding:4px 16px;border-radius:999px;background:#0E1300;border:2px solid #C7F303;color:#FFFFFF;font-size:25px;font-weight:900;white-space:nowrap;">
          \${sat.name}
        </div>
      </div>\`;
    if (sinT < 0) satsBack += el;
    else satsFront += el;
  }

  const word = "WAPPY";
  const typeP = clamp((dt - 0.35) / 0.85, 0, 1);
  const nChars = Math.max(1, Math.min(word.length, Math.ceil(typeP * word.length)));
  const typed = word.slice(0, nChars);
  const clicked = dt >= 1.35;
  const pulseBtn = 1 + 0.028 * Math.sin(t * 8);

  stageHost.innerHTML = \`
    <div class="scene-card" style="border-color:#C7F303;justify-content:space-between;background:radial-gradient(circle at 50% 42%, rgba(199,243,3,0.18) 0%, rgba(10,15,25,0.98) 70%);\${trStyle}">
      <div style="text-align:center;">
        <div style="display:inline-block;padding:7px 24px;border-radius:999px;background:#C7F303;color:#0E1300;font-size:28px;font-weight:900;letter-spacing:0.04em;margin-bottom:10px;">
          \${sc.eyebrow}
        </div>
        <div style="font-size:74px;font-weight:900;line-height:1.0;letter-spacing:-0.035em;color:#FFFFFF;text-transform:uppercase;">
          \${sc.titleBefore} <span style="color:#C7F303;">\${sc.titleHighlight}</span>
        </div>
      </div>

      <div style="position:relative;width:100%;height:560px;">
        <svg viewBox="0 0 956 560" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;">
          <ellipse cx="\${cx}" cy="\${cy}" rx="\${rx}" ry="\${ry}" fill="none" stroke="rgba(199,243,3,0.45)" stroke-width="4" stroke-dasharray="14 10" />
        </svg>
        <div style="position:absolute;inset:0;z-index:2;">\${satsBack}</div>

        <div style="position:absolute;left:\${cx}px;top:\${cy}px;transform:translate(-50%,-50%) scale(\${pulseBtn.toFixed(3)});z-index:5;display:flex;flex-direction:column;align-items:center;gap:10px;">
          <div style="width:240px;height:240px;border-radius:50%;background:#FFFFFF;border:7px solid #C7F303;padding:10px;box-shadow:0 0 65px rgba(199,243,3,0.75), 0 24px 50px rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;overflow:hidden;">
            <img src="\${LOGOS.wappyCircle}" style="width:100%;height:100%;object-fit:contain;" />
          </div>
          <div style="padding:8px 28px;border-radius:999px;background:#C7F303;color:#0E1300;font-size:32px;font-weight:900;box-shadow:0 10px 24px rgba(0,0,0,0.7);">
            WAPPY IA · NÚCLEO
          </div>
        </div>

        <div style="position:absolute;inset:0;z-index:8;">\${satsFront}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;z-index:10;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-radius:26px;background:#0B111D;border:3px solid rgba(45,212,191,0.65);">
          <span style="font-size:35px;font-weight:900;color:#CBD5E1;">💬 Comenta o entra hoy:</span>
          <div style="display:flex;align-items:center;gap:16px;">
            <span style="font-size:58px;font-weight:900;color:#C7F303;letter-spacing:0.05em;">"\${typed}"</span>
            <span style="padding:12px 26px;border-radius:18px;background:\${clicked?'#22C55E':'#C7F303'};color:#0E1300;font-size:30px;font-weight:900;">
              \${clicked ? 'ACTIVO ✓' : 'ENTRAR'}
            </span>
          </div>
        </div>

        <div style="height:146px;border-radius:34px;background:#C7F303;box-shadow:0 20px 55px rgba(199,243,3,0.48);display:flex;align-items:center;justify-content:center;gap:18px;padding:0 28px;transform:scale(\${pulseBtn.toFixed(3)});">
          <span style="font-size:50px;font-weight:900;color:#0E1300;letter-spacing:-0.025em;text-align:center;line-height:1.05;">
            🚀 ENTRA HOY A WAPPY.CLUB · SOMOS SST
          </span>
        </div>
      </div>
    </div>\`;
}

// ============================================================================
// SUBTÍTULOS KARAOKE MODO MÓVIL XL (y: 1512..1722, 56px EXTRABOLD 900)
// ============================================================================
function renderSubtitles(t) {
  if (t < INTRO_DURATION) {
    subHost.innerHTML = "";
    return;
  }
  const page = SUB_PAGES.find((p) => t >= p.t0 - 0.08 && t <= p.t1 + 0.14);
  if (!page) {
    subHost.innerHTML = "";
    return;
  }

  const wordsHtml = page.words.map((item) => {
    const active = t >= item.t0 - 0.04 && t <= item.t1 + 0.08;
    const passed = t > item.t1 + 0.08;
    const st = active
      ? "color:#C7F303; transform:translateY(-5px) scale(1.09); text-shadow:0 6px 20px rgba(199,243,3,0.45);"
      : passed
        ? "color:#FFFFFF;"
        : "color:rgba(203,213,225,0.55);";
    return \`<span class="sub-w-xl" style="\${st}">\${item.w}</span>\`;
  }).join("");

  subHost.innerHTML = \`<div class="sub-pill-xl"><div class="sub-line-xl">\${wordsHtml}</div></div>\`;
}

// ============================================================================
// MASTER RENDER DISPATCHER DETERMINISTA (0% TEMBLOR)
// ============================================================================
function renderAt(rawT) {
  const t = clamp(Number(rawT) || 0, 0, TOTAL_DURATION);
  const scrubFill = document.getElementById("scrubFill");
  if (scrubFill) {
    scrubFill.style.width = \`\${clamp((t / TOTAL_DURATION) * 100, 0, 100).toFixed(2)}%\`;
  }

  if (t < INTRO_DURATION) {
    renderCoverHero(t);
    return;
  }

  stageHost.style.top = "256px";
  stageHost.style.height = "1224px";
  footerBrand.style.opacity = "1";

  let activeIdx = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (t >= SCENES[i].startSec && (t < SCENES[i].endSec || i === SCENES.length - 1)) {
      activeIdx = i;
      break;
    }
  }

  const sc = SCENES[activeIdx] || SCENES[0];
  renderTopMegaDock(activeIdx);
  renderSubtitles(t);

  if (sc.archetype === "hook-vs-wall") {
    renderSceneHookRoulette(t, sc);
  } else if (sc.archetype === "bento-kpi" || sc.archetype === "checklist-steps" || sc.archetype === "iphone-split-showcase") {
    renderSceneBentoAgentic(t, sc);
  } else if (sc.archetype === "flow-split-before-after" || sc.archetype === "before-after") {
    renderSceneFlowSplit(t, sc);
  } else if (sc.archetype === "visor-normativo-real" || sc.archetype === "signature-pad-live") {
    renderSceneVisorNorma(t, sc);
  } else if (sc.archetype === "suri-voice-live-hud" || sc.archetype === "tenshi-specialists-grid") {
    renderSceneSuriHud(t, sc);
  } else if (sc.archetype === "wappy-n8n-workflow" || sc.archetype === "cuadricula-50-herramientas") {
    renderSceneWappyN8n(t, sc);
  } else {
    renderSceneFinalOrbit(t, sc);
  }
}

const viewport = document.getElementById("viewport");
const bgAudio = document.getElementById("bgAudio");
const playPrompt = document.getElementById("playPrompt");

function fitViewport() {
  const s = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
  viewport.style.transform = \`scale(\${s.toFixed(5)})\`;
}
window.addEventListener("resize", fitViewport);
fitViewport();

if (new URLSearchParams(window.location.search).get("capture") === "1") {
  document.body.classList.add("capture-mode");
}

let manualCaptureMode = false;
let simPlaying = false;
let simStartWall = 0;
let simOffsetSec = 0;
let lastRenderedT = -1;

function tick() {
  if (!manualCaptureMode) {
    let t = 0;
    if (bgAudio && bgAudio.getAttribute("src")) {
      t = bgAudio.currentTime || 0;
      if (!bgAudio.paused || Math.abs(t - lastRenderedT) > 0.004) {
        renderAt(t);
        lastRenderedT = t;
      }
    } else if (simPlaying) {
      t = simOffsetSec + (performance.now() - simStartWall) / 1000;
      if (t >= TOTAL_DURATION) {
        t = 0;
        simPlaying = false;
        playPrompt.classList.remove("hidden");
      }
      renderAt(t);
      lastRenderedT = t;
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

viewport.addEventListener("click", (e) => {
  if (e.target.closest("#scrubWrap")) return;
  if (bgAudio && bgAudio.getAttribute("src")) {
    if (bgAudio.paused) {
      bgAudio.play().then(() => playPrompt.classList.add("hidden")).catch(() => {});
    } else {
      bgAudio.pause();
      playPrompt.classList.remove("hidden");
    }
  } else {
    simPlaying = !simPlaying;
    if (simPlaying) {
      simStartWall = performance.now();
      playPrompt.classList.add("hidden");
    } else {
      simOffsetSec = lastRenderedT > 0 ? lastRenderedT : 0;
      playPrompt.classList.remove("hidden");
    }
  }
});

document.getElementById("scrubWrap").addEventListener("click", (e) => {
  e.stopPropagation();
  const rect = e.currentTarget.getBoundingClientRect();
  const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
  const targetT = ratio * TOTAL_DURATION;
  if (bgAudio && bgAudio.getAttribute("src")) {
    bgAudio.currentTime = targetT;
  } else {
    simOffsetSec = targetT;
    simStartWall = performance.now();
  }
  renderAt(targetT);
});

function deterministicSeek(t, totalDurOverride) {
  manualCaptureMode = true;
  simPlaying = false;
  document.body.classList.add("capture-mode");
  if (typeof totalDurOverride === "number" && totalDurOverride > 1) {
    TOTAL_DURATION = totalDurOverride;
  }
  if (bgAudio && !bgAudio.paused) {
    try { bgAudio.pause(); } catch (_) {}
  }
  renderAt(t);
  return true;
}

window.seekPreview = deterministicSeek;
window.seekTo = deterministicSeek;
window.__wappySeekTo = deterministicSeek;
window.renderFrame = deterministicSeek;
window.render = deterministicSeek;
window.__render = deterministicSeek;
window.__wappyRenderTick = deterministicSeek;
window.__wappyFitViewport = fitViewport;

window.addEventListener("message", (e) => {
  if (!e.data) return;
  const d = e.data;
  if (d.type === "STUDIO_PLAY") {
    manualCaptureMode = false;
    if (bgAudio && bgAudio.getAttribute("src")) bgAudio.play().catch(() => {});
    else { simPlaying = true; simStartWall = performance.now(); }
    playPrompt.classList.add("hidden");
  } else if (d.type === "STUDIO_PAUSE") {
    if (bgAudio) bgAudio.pause();
    simPlaying = false;
  } else if (d.type === "STUDIO_RESTART") {
    manualCaptureMode = false;
    if (bgAudio && bgAudio.getAttribute("src")) { bgAudio.currentTime = 0; bgAudio.play().catch(() => {}); }
    else { simOffsetSec = 0; simStartWall = performance.now(); simPlaying = true; }
  } else if (d.type === "STUDIO_SEEK" && typeof d.progress === "number") {
    deterministicSeek(clamp(d.progress, 0, 1) * TOTAL_DURATION);
  } else if (d.type === "STUDIO_SYNC_TIME" && typeof d.currentTime === "number") {
    deterministicSeek(d.currentTime, d.duration);
  }
});

renderAt(0.45);
</script>
</body>
</html>`;
}

module.exports = {
  ARCHETYPE_ROTATION,
  resolveArchetypeFromEffect,
  renderOfficialBrandLogoSvg,
  alignTimelineMapWithWavBuffer,
  buildSmartScenePlanFromScript,
  generateCreativeScenePlanWithAi,
  compileAntigravityMasterReelHtml,
};
