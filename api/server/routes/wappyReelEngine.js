'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Orden de los 7 Arquetipos Cinéticos Oficiales de Antigravity (Skills: animaciones-17-efectos-reels + animaciones-dark-tech-hud + animaciones-wappy-brand)
 */
const ARCHETYPE_ROTATION = [
  'hook-vs-wall',
  'iphone-split-showcase',
  'signature-pad-live',
  'chart-grow-math',
  'pentagon-orbital',
  'tenshi-specialists-grid',
  'cta-viral-bubbles',
];

/**
 * Mapea los identificadores de efectos de la skill `animaciones-17-efectos-reels`
 * a los 7 Arquetipos Cinéticos de Antigravity.
 */
function resolveArchetypeFromEffect(effectId, idx = 0, isFirst = false, isLast = false) {
  const clean = String(effectId || '').toLowerCase().trim();
  if (ARCHETYPE_ROTATION.includes(clean)) return clean;

  if (/hook|wall|06|headline|19|cover|portada|vs|14|corte/.test(clean)) return 'hook-vs-wall';
  if (/phone|05|iphone|mockup|island|16|green/.test(clean)) return 'iphone-split-showcase';
  if (/check|13|firma|signature|09|doodle|17|paper|visor|normativo|expediente/.test(clean)) return 'signature-pad-live';
  if (/chart|08|grow|math|04|reticula|digital-zoom|kpi/.test(clean)) return 'chart-grow-math';
  if (/orbit|01|pentagon|gtc|11|giro|07|zoom-through|18|vertigo|dolly/.test(clean)) return 'pentagon-orbital';
  if (/ui-world|03|grid|tenshi|10|glass|cristal|02|frame/.test(clean)) return 'tenshi-specialists-grid';
  if (/couch|12|cta|bubble|15|zoom-out|avatar|felix|sfx/.test(clean)) {
    return isFirst ? 'hook-vs-wall' : isLast ? 'cta-viral-bubbles' : 'iphone-split-showcase';
  }

  if (isFirst) return 'hook-vs-wall';
  if (isLast) return 'cta-viral-bubbles';
  const midArchetypes = [
    'iphone-split-showcase',
    'signature-pad-live',
    'chart-grow-math',
    'pentagon-orbital',
    'tenshi-specialists-grid',
  ];
  return midArchetypes[Math.max(0, idx - 1) % midArchetypes.length];
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Analiza un Buffer WAV (PCM 16-bit) en el servidor para extraer:
 * 1. Envolvente de voz a 60 FPS (vozData: 0..1) para Lip-Sync exacto de Félix 3D Voxel y el ecualizador HUD.
 * 2. Pausas de silencio reales en la locución para alinear los cortes de escena (startSec / endSec) al milisegundo.
 * 3. Tiempos palabra por palabra ajustados exclusivamente a los fotogramas con voz activa.
 */
function alignTimelineMapWithWavBuffer(timelineMap, wavBuffer) {
  if (!wavBuffer || !Buffer.isBuffer(wavBuffer) || wavBuffer.length < 100) {
    return { ...timelineMap, vozData: [] };
  }

  try {
    const numChannels = wavBuffer.readUInt16LE(22) || 1;
    const sampleRate = wavBuffer.readUInt32LE(24) || 24000;
    const bitsPerSample = wavBuffer.readUInt16LE(34) || 16;
    const bytesPerSample = Math.max(2, Math.floor(bitsPerSample / 8));

    let offset = 12;
    let dataOffset = 44;
    let dataSize = wavBuffer.length - 44;
    while (offset < wavBuffer.length - 8) {
      const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
      const chunkSize = wavBuffer.readUInt32LE(offset + 4);
      if (chunkId === 'data') {
        dataOffset = offset + 8;
        dataSize = Math.min(chunkSize, wavBuffer.length - dataOffset);
        break;
      }
      offset += 8 + chunkSize;
    }

    const totalSamples = Math.floor(dataSize / (numChannels * bytesPerSample));
    const exactDuration = Number((totalSamples / sampleRate).toFixed(3));
    if (exactDuration < 1.5) {
      return { ...timelineMap, vozData: [] };
    }

    const fps = 60;
    const totalFrames = Math.ceil(exactDuration * fps);
    const samplesPerFrame = Math.max(1, Math.floor(sampleRate / fps));
    const rawRms = new Array(totalFrames);
    let maxRms = 0.01;

    for (let f = 0; f < totalFrames; f++) {
      const s0 = f * samplesPerFrame;
      const s1 = Math.min(totalSamples, s0 + samplesPerFrame);
      let sumSq = 0;
      let count = 0;
      for (let s = s0; s < s1; s++) {
        const byteIdx = dataOffset + s * numChannels * bytesPerSample;
        if (byteIdx + 1 < wavBuffer.length) {
          const val = wavBuffer.readInt16LE(byteIdx) / 32768;
          sumSq += val * val;
          count++;
        }
      }
      const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
      if (rms > maxRms) maxRms = rms;
      rawRms[f] = rms;
    }

    const vozData = rawRms.map((v) => Number(Math.min(1, v / (maxRms * 0.65)).toFixed(3)));

    // Detectar pausas de silencio reales (>= 0.24s con nivel < 0.045)
    const silences = [];
    let inSil = false;
    let silStart = 0;
    for (let f = 0; f < vozData.length; f++) {
      if (vozData[f] < 0.045) {
        if (!inSil) {
          inSil = true;
          silStart = f / fps;
        }
      } else if (inSil) {
        const silEnd = f / fps;
        const dur = silEnd - silStart;
        if (dur >= 0.22 && silStart > 0.6 && silEnd < exactDuration - 0.6) {
          silences.push({
            start: silStart,
            end: silEnd,
            mid: Number(((silStart + silEnd) / 2).toFixed(2)),
            dur: Number(dur.toFixed(2)),
          });
        }
        inSil = false;
      }
    }

    const beats = (timelineMap.beats || []).map((b) => ({ ...b }));
    if (beats.length > 1 && silences.length > 0) {
      const usedSilences = new Set();
      for (let i = 0; i < beats.length - 1; i++) {
        const expectedBoundary = (beats[i].endPct || (i + 1) / beats.length) * exactDuration;
        let bestSil = null;
        let bestScore = Infinity;
        for (let sIdx = 0; sIdx < silences.length; sIdx++) {
          if (usedSilences.has(sIdx)) continue;
          const sil = silences[sIdx];
          const dist = Math.abs(sil.mid - expectedBoundary);
          // Buscar la pausa real más cercana dentro de una ventana de ±2.4s
          if (dist < 2.4) {
            const score = dist - sil.dur * 0.6;
            if (score < bestScore) {
              bestScore = score;
              bestSil = { sil, sIdx };
            }
          }
        }
        if (bestSil) {
          usedSilences.add(bestSil.sIdx);
          beats[i].endSec = bestSil.sil.mid;
          beats[i + 1].startSec = bestSil.sil.mid;
        } else {
          const fallbackSec = Number(expectedBoundary.toFixed(2));
          beats[i].endSec = fallbackSec;
          beats[i + 1].startSec = fallbackSec;
        }
      }
      beats[0].startSec = 0;
      beats[beats.length - 1].endSec = Number(exactDuration.toFixed(2));
      for (let i = 0; i < beats.length; i++) {
        if (i > 0 && beats[i].startSec <= beats[i - 1].startSec + 0.8) {
          beats[i].startSec = Number((beats[i - 1].startSec + 1.2).toFixed(2));
          beats[i - 1].endSec = beats[i].startSec;
        }
        beats[i].durationSec = Number(Math.max(0.8, beats[i].endSec - beats[i].startSec).toFixed(2));
        beats[i].startPct = Number((beats[i].startSec / exactDuration).toFixed(4));
        beats[i].endPct = Number((beats[i].endSec / exactDuration).toFixed(4));
      }
    }

    // Ajustar los tiempos de cada palabra dentro de su beat usando los frames con voz activa
    const newWordTimings = [];
    const oldWords = timelineMap.wordTimings || [];
    for (let bIdx = 0; bIdx < beats.length; bIdx++) {
      const beat = beats[bIdx];
      const beatWords = oldWords.filter((w) => w.beatIndex === bIdx);
      if (beatWords.length === 0) continue;

      const fStart = Math.max(0, Math.floor(beat.startSec * fps));
      const fEnd = Math.min(vozData.length - 1, Math.ceil(beat.endSec * fps));
      const voicedFrames = [];
      for (let f = fStart; f <= fEnd; f++) {
        if (vozData[f] >= 0.04) voicedFrames.push(f);
      }

      if (voicedFrames.length >= beatWords.length * 2) {
        // Ponderar cada palabra por longitud + puntuación sobre los fotogramas hablados reales
        const weights = beatWords.map((w) => {
          const cleanLen = w.word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g, '').length;
          let wt = Math.max(2, cleanLen);
          if (/[,;:]$/.test(w.word)) wt += 2;
          return wt;
        });
        const sumW = weights.reduce((a, b) => a + b, 0) || 1;
        let accW = 0;
        for (let wIdx = 0; wIdx < beatWords.length; wIdx++) {
          const f0Idx = Math.min(
            voicedFrames.length - 1,
            Math.floor((accW / sumW) * voicedFrames.length),
          );
          accW += weights[wIdx];
          const f1Idx = Math.min(
            voicedFrames.length - 1,
            Math.max(f0Idx, Math.floor((accW / sumW) * voicedFrames.length) - 1),
          );
          const startSecW = voicedFrames[f0Idx] / fps;
          const endSecW =
            wIdx + 1 < beatWords.length
              ? voicedFrames[Math.min(voicedFrames.length - 1, f1Idx + 1)] / fps
              : beat.endSec;
          newWordTimings.push({
            word: beatWords[wIdx].word,
            startPct: Number((startSecW / exactDuration).toFixed(4)),
            endPct: Number((Math.max(startSecW + 0.04, endSecW) / exactDuration).toFixed(4)),
            beatIndex: bIdx,
          });
        }
      } else {
        // Distribución proporcional dentro de la ventana del beat
        const bDur = Math.max(0.5, beat.endSec - beat.startSec);
        const weights = beatWords.map((w) => Math.max(2, w.word.length));
        const sumW = weights.reduce((a, b) => a + b, 0) || 1;
        let accW = 0;
        for (let wIdx = 0; wIdx < beatWords.length; wIdx++) {
          const sSec = beat.startSec + (accW / sumW) * bDur;
          accW += weights[wIdx];
          const eSec = beat.startSec + (accW / sumW) * bDur;
          newWordTimings.push({
            word: beatWords[wIdx].word,
            startPct: Number((sSec / exactDuration).toFixed(4)),
            endPct: Number((eSec / exactDuration).toFixed(4)),
            beatIndex: bIdx,
          });
        }
      }
    }

    return {
      beats,
      wordTimings: newWordTimings.length > 0 ? newWordTimings : timelineMap.wordTimings,
      totalDurationSeconds: exactDuration,
      vozData,
    };
  } catch (_) {
    return { ...timelineMap, vozData: [] };
  }
}

/**
 * Renderiza iconos vectoriales SVG Duotone animados de nivel After Effects (WAPPY_LOTTIE)
 * reemplazando los emojis genéricos por iconografía técnica de alta gama.
 */
function renderWappySvgIcon(kind = 'escudo', color = '#c7f303', size = 40) {
  const k = String(kind || '').toLowerCase();
  let inner = '';
  if (/alerta|bad|riesgo|peligro|error|❌|⚠️/.test(k)) {
    const c = color === '#c7f303' ? '#ef4444' : color;
    inner = `
      <polygon points="50,12 90,84 10,84" fill="${c}" fill-opacity="0.22" stroke="${c}" stroke-width="5.5" stroke-linejoin="round"/>
      <line x1="50" y1="36" x2="50" y2="58" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round"/>
      <circle cx="50" cy="72" r="4.2" fill="#ffffff"/>`;
  } else if (/cerebro|ia|tenshi|ai|neuronal|✨|🤖|🧠/.test(k)) {
    inner = `
      <circle cx="50" cy="50" r="36" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-width="4" stroke-dasharray="8 5"/>
      <path d="M35 38 C25 38 22 50 30 56 C25 65 34 74 44 70 L46 70 L46 32 C38 30 35 34 35 38 Z" fill="${color}" fill-opacity="0.28" stroke="${color}" stroke-width="4.5"/>
      <path d="M65 38 C75 38 78 50 70 56 C75 65 66 74 56 70 L54 70 L54 32 C62 30 65 34 65 38 Z" fill="#22d3ee" fill-opacity="0.28" stroke="#22d3ee" stroke-width="4.5"/>
      <circle cx="50" cy="50" r="6" fill="#ffffff"/>`;
  } else if (/grafica|chart|kpi|metric|ind|📊|📈/.test(k)) {
    inner = `
      <rect x="16" y="54" width="14" height="30" rx="4" fill="#2dd4bf" fill-opacity="0.35" stroke="#2dd4bf" stroke-width="4"/>
      <rect x="43" y="36" width="14" height="48" rx="4" fill="#22d3ee" fill-opacity="0.4" stroke="#22d3ee" stroke-width="4"/>
      <rect x="70" y="18" width="14" height="66" rx="4" fill="${color}" fill-opacity="0.55" stroke="${color}" stroke-width="4"/>
      <path d="M16 44 L48 26 L78 12" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>`;
  } else if (/firma|sig|check|legal|norma|✍️|✅|📋/.test(k)) {
    inner = `
      <rect x="16" y="14" width="68" height="72" rx="12" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-width="4.5"/>
      <path d="M30 52 L44 66 L72 34" fill="none" stroke="#c7f303" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="30" y1="28" x2="58" y2="28" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;
  } else if (/radar|orbit|core|gtc|🎯|🌐/.test(k)) {
    inner = `
      <circle cx="50" cy="50" r="38" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="4.5"/>
      <circle cx="50" cy="50" r="22" fill="none" stroke="#22d3ee" stroke-width="3.5" stroke-dasharray="6 4"/>
      <circle cx="50" cy="50" r="8" fill="#c7f303"/>
      <line x1="50" y1="50" x2="78" y2="24" stroke="#c7f303" stroke-width="4.5" stroke-linecap="round"/>`;
  } else if (/bolt|rayo|fast|⚡|🔥|🚀/.test(k)) {
    inner = `
      <polygon points="56,10 22,54 48,54 42,90 78,44 52,44" fill="${color}" fill-opacity="0.32" stroke="${color}" stroke-width="5" stroke-linejoin="round"/>`;
  } else {
    // Escudo SST por defecto
    inner = `
      <path d="M50 10 L84 24 V48 C84 70 68 85 50 92 C32 85 16 70 16 48 V24 L50 10 Z" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M36 50 L46 60 L66 38" fill="none" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" style="overflow:visible;filter:drop-shadow(0 0 10px ${color}66);">${inner}</svg>`;
}

/**
 * Construye un plan de escenas rico e inteligente de forma determinista a partir del guion real del usuario,
 * sin textos hardcodeados ajenos al tema y con iconografía vectorial SVG Duotone.
 */
function buildSmartScenePlanFromScript(scriptText, beats = [], options = {}) {
  const companyName = options.companyName || 'WAPPY IA';
  const totalBeats = beats.length || 1;
  const userEffects = Array.isArray(options.selectedEffects)
    ? options.selectedEffects
    : Array.isArray(options.selectedSkillEffects)
      ? options.selectedSkillEffects
      : Array.isArray(options.effects)
        ? options.effects
        : [];
  const customSteps = Array.isArray(options.scriptSteps)
    ? options.scriptSteps
    : Array.isArray(options.scenesBreakdown)
      ? options.scenesBreakdown
      : [];

  const fullScriptLower = String(scriptText || '').toLowerCase();
  const isGtc45 = /gtc\s*45|ipevr|matriz\s+de\s+peligros|nivel\s+de\s+riesgo/i.test(fullScriptLower);
  const isRes0312 = /0312|est[aá]ndares\s+m[ií]nimos|1072|sg-?sst/i.test(fullScriptLower);
  const normTags = isGtc45
    ? ['✦ GTC 45 Oficial', '✦ Matriz IPEVR IA', '✦ Decreto 1072', '✦ WAPPY.CLUB']
    : isRes0312
      ? ['✦ Resolución 0312', '✦ Decreto 1072', '✦ SG-SST en Vivo', '✦ WAPPY.CLUB']
      : ['✦ Prevención SST', '✦ IA en Tiempo Real', '✦ Cumplimiento Legal', '✦ WAPPY.CLUB'];

  // Extraer todas las frases útiles del guion completo para que ninguna tarjeta quede vacía ni use rellenos ajenos
  const allScriptClauses = String(scriptText || '')
    .replace(/\[pausa\s+[\d.]+s\]/gi, '')
    .replace(/<[^>]+>/g, '')
    .split(/(?<=[.!?])\s+|[,;:]|\s+y\s+|\s+para\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  return beats.map((beat, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === totalBeats - 1 && totalBeats > 1;
    const stepMeta = customSteps[idx] && typeof customSteps[idx] === 'object' ? customSteps[idx] : null;
    const effectCandidate =
      stepMeta?.archetype ||
      stepMeta?.visualEffect ||
      stepMeta?.effect ||
      (userEffects.length > 0 ? userEffects[idx % userEffects.length] : '');

    let archetype;
    if (effectCandidate) {
      archetype = resolveArchetypeFromEffect(effectCandidate, idx, isFirst, isLast);
    } else if (isFirst) {
      archetype = 'hook-vs-wall';
    } else if (isLast) {
      archetype = 'cta-viral-bubbles';
    } else {
      const midArchetypes = [
        'iphone-split-showcase',
        'signature-pad-live',
        'chart-grow-math',
        'pentagon-orbital',
        'tenshi-specialists-grid',
      ];
      archetype = midArchetypes[(idx - 1) % midArchetypes.length];
    }

    const rawText = String(
      stepMeta?.narration || stepMeta?.voiceover || stepMeta?.text || beat.text || '',
    )
      .replace(/\[pausa\s+[\d.]+s\]/gi, '')
      .replace(/\[énfasis\]/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\|[^|]+\|/g, '')
      .trim();

    let stepPrefix = '';
    let bodyText = rawText;
    const ordinalMatch = rawText.match(
      /^(?:Y\s+)?(Primero|Segundo|Tercero|Cuarto|Quinto|Sexto|Paso\s*\d+|Regla\s*\d+)\s*[:.-]\s*(.+)$/i,
    );
    if (ordinalMatch) {
      stepPrefix = ordinalMatch[1].toUpperCase();
      bodyText = ordinalMatch[2].trim();
    }

    const bodyWords = bodyText.split(/\s+/).filter(Boolean);
    const cleanWordSlice = (arr) =>
      arr
        .join(' ')
        .replace(/^[,;:.!?-]+|[,;:.!?-]+$/g, '')
        .trim();
    const leadCount = Math.min(3, Math.max(1, Math.ceil(Math.min(bodyWords.length, 6) * 0.5)));
    const defaultTitleBefore = stepPrefix
      ? `${idx + 1}. ${cleanWordSlice(bodyWords.slice(0, 2))}`
      : cleanWordSlice(bodyWords.slice(0, leadCount));
    const defaultTitleHighlight = stepPrefix
      ? cleanWordSlice(bodyWords.slice(2, Math.min(6, bodyWords.length))) || stepPrefix
      : cleanWordSlice(bodyWords.slice(leadCount, Math.min(leadCount + 4, bodyWords.length))) || 'WAPPY IA';

    let customTitleBefore = stepMeta?.titleBefore || '';
    let customTitleHighlight = stepMeta?.titleHighlight || '';
    if (!customTitleBefore && !customTitleHighlight && stepMeta?.title) {
      const cleanStepTitle = String(stepMeta.title)
        .replace(/^Portada Magnética\s*\(2s\)\s*[:·-]?\s*/i, '')
        .trim();
      const tWords = cleanStepTitle.split(/\s+/).filter(Boolean);
      if (tWords.length >= 2) {
        const half = Math.ceil(tWords.length / 2);
        customTitleBefore = tWords.slice(0, half).join(' ');
        customTitleHighlight = tWords.slice(half).join(' ');
      }
    }

    const titleBefore =
      customTitleBefore ||
      (isFirst && options.headlineText ? String(options.headlineText).split(/\s+/).slice(0, 3).join(' ') : defaultTitleBefore);
    const titleHighlight =
      customTitleHighlight ||
      (isFirst && options.headlineText ? String(options.headlineText).split(/\s+/).slice(3, 6).join(' ') || defaultTitleHighlight : defaultTitleHighlight);

    const highlightStyles = ['lime', 'cyan', 'lime', 'cyan', 'lime', 'cyan', 'lime'];
    const highlightStyle = stepMeta?.highlightStyle || (isFirst ? 'lime' : highlightStyles[idx % highlightStyles.length]);

    // Extraer cláusulas reales del beat actual + contexto del guion
    const clauses = bodyText
      .split(/[,;:]|\s+y\s+|\s+con\s+|\s+para\s+|\s+mediante\s+|\s+que\s+/i)
      .map((c) => c.trim())
      .filter((c) => c.length > 4);

    const c0 = clauses[0] || bodyText.slice(0, 42) || 'Diagnóstico Inteligente SG-SST';
    const c1 = clauses[1] || allScriptClauses[(idx + 1) % Math.max(1, allScriptClauses.length)] || 'Control y trazabilidad en tiempo real';
    const c2 = clauses[2] || allScriptClauses[(idx + 2) % Math.max(1, allScriptClauses.length)] || 'Evidencia verificada en segundos';
    const c3 = clauses[3] || allScriptClauses[(idx + 3) % Math.max(1, allScriptClauses.length)] || 'Cumplimiento normativo automatizado';
    const c4 = clauses[4] || allScriptClauses[(idx + 4) % Math.max(1, allScriptClauses.length)] || 'Prevención activa con Tenshi IA';

    const shortTitle = (txt, fallback) => {
      const w = String(txt || '').split(/\s+/).filter(Boolean).slice(0, 4).join(' ');
      return (w || fallback).replace(/^[,;:.!?-]+|[,;:.!?-]+$/g, '').slice(0, 26);
    };

    const defaultSideCards = [
      {
        icon: 'cerebro_ia',
        title: shortTitle(c0, 'Análisis con IA'),
        desc: c0.slice(0, 58),
        color: 'cyan',
      },
      {
        icon: 'firma',
        title: shortTitle(c1, 'Control Verificado'),
        desc: c1.slice(0, 58),
        color: 'teal',
      },
      {
        icon: 'escudo',
        title: shortTitle(c2, `Ecosistema ${companyName}`),
        desc: c2.slice(0, 58),
        color: 'lime',
      },
    ];

    const defaultSigCards = [
      { role: shortTitle(c0, 'Validación Técnica'), icon: 'escudo', status: '✓ VERIFICADO' },
      { role: shortTitle(c1, 'Control Operativo SST'), icon: 'firma', status: '✓ APLICADO' },
      { role: shortTitle(c2, 'Firma Digital WAPPY'), icon: 'check', status: '✓ FIRMADO' },
    ];

    const defaultOrbitalNodes = [
      { icon: 'cerebro_ia', title: shortTitle(c0, 'Motor IA'), sub: c0.slice(0, 26) },
      { icon: 'escudo', title: shortTitle(c1, 'Control SST'), sub: c1.slice(0, 26) },
      { icon: 'grafica', title: shortTitle(c2, 'Métricas en Vivo'), sub: c2.slice(0, 26) },
      { icon: 'firma', title: shortTitle(c3, 'Firma Digital'), sub: c3.slice(0, 26) },
      { icon: 'radar', title: shortTitle(c4, 'Trazabilidad 360°'), sub: c4.slice(0, 26) },
    ];

    const defaultGridSpecs = [
      { icon: 'cerebro_ia', title: shortTitle(c0, 'Automatización IA'), sub: c0.slice(0, 32), color: 'teal' },
      { icon: 'grafica', title: shortTitle(c1, 'Analítica en Vivo'), sub: c1.slice(0, 32), color: 'cyan' },
      { icon: 'firma', title: shortTitle(c2, 'Respaldo Legal'), sub: c2.slice(0, 32), color: 'amber' },
      { icon: 'escudo', title: shortTitle(c3, 'Cero Papel'), sub: c3.slice(0, 32), color: 'lime' },
    ];

    const formulaLeft = isGtc45 ? 'PELIGRO × EXPOSICIÓN' : shortTitle(c0, 'DIAGNÓSTICO IA').toUpperCase().slice(0, 18);
    const formulaMid = isGtc45 ? 'NP = ND × NE' : shortTitle(c1, 'CONTROL EN VIVO').toUpperCase().slice(0, 18);
    const formulaRight = isGtc45 ? 'VALORACIÓN GTC 45' : '100% CUMPLIMIENTO';

    return {
      index: idx + 1,
      startSec: beat.startSec,
      endSec: beat.endSec,
      durationSec: beat.durationSec,
      archetype,
      visualEffect: stepMeta?.visualEffect || stepMeta?.effect || effectCandidate || archetype,
      cameraAndMotion: stepMeta?.cameraAndMotion || '',
      eyebrow:
        stepMeta?.eyebrow ||
        stepMeta?.tag ||
        (isFirst && options.badgeText
          ? String(options.badgeText).toUpperCase().slice(0, 32)
          : stepPrefix
            ? `PUNTO CLAVE #${idx + 1} • ${stepPrefix}`
            : isFirst
              ? `ECOSISTEMA IA • ${companyName}`
              : isLast
                ? `PREVENCIÓN EN VIVO • ${companyName}`
                : `MÓDULO ACTIVO • ESCENA 0${idx + 1}`),
      titleBefore: String(titleBefore || 'GESTIÓN').slice(0, 26),
      titleHighlight: String(titleHighlight || 'WAPPY IA').slice(0, 26),
      highlightStyle,
      subtitle: isFirst && options.subtitleText && !stepMeta?.narration ? String(options.subtitleText) : rawText,
      badCardTitle: stepMeta?.badCardTitle || (isGtc45 ? 'Hojas de Excel Manuales' : 'Gestión Manual y Lenta'),
      badCardDesc: stepMeta?.badCardDesc || 'Semanas de reprocesos, errores de cálculo y riesgo de incumplimiento normativo',
      badCardBadge: 'TRADICIONAL',
      goodCardTitle: stepMeta?.goodCardTitle || `${shortTitle(titleHighlight, companyName)} con IA`,
      goodCardDesc: stepMeta?.goodCardDesc || rawText.slice(0, 82),
      goodCardBadge: 'WAPPY IA',
      wallPills: [
        String(titleHighlight || 'WAPPY IA').toUpperCase(),
        `${companyName} • SOMOS SST`,
        shortTitle(c0, 'INTELIGENCIA ARTIFICIAL').toUpperCase(),
        shortTitle(c1, 'PREVENCIÓN EN SEGUNDOS').toUpperCase(),
      ],
      islandText: stepMeta?.islandText || stepPrefix || `WAPPY 0${idx + 1} LIVE`,
      phoneQrTitle: (titleHighlight || 'WAPPY IA').toUpperCase().slice(0, 18),
      phonePills: [
        { icon: 'cerebro_ia', text: c0.slice(0, 30) },
        { icon: 'escudo', text: c1.slice(0, 30) },
        { icon: 'grafica', text: c2.slice(0, 30) },
        { icon: 'check', text: 'Sincronizado en WAPPY Cloud' },
      ],
      sideCards:
        Array.isArray(stepMeta?.sideCards) && stepMeta.sideCards.length >= 3
          ? stepMeta.sideCards.slice(0, 3).map((c, cIdx) => ({
              icon: c.icon || defaultSideCards[cIdx].icon,
              title: c.title || defaultSideCards[cIdx].title,
              desc: c.desc || defaultSideCards[cIdx].desc,
              color: c.color || defaultSideCards[cIdx].color,
            }))
          : defaultSideCards,
      sigCards:
        Array.isArray(stepMeta?.sigCards) && stepMeta.sigCards.length >= 3
          ? stepMeta.sigCards.slice(0, 3).map((s, sIdx) => ({
              role: s.role || defaultSigCards[sIdx].role,
              icon: s.icon || defaultSigCards[sIdx].icon,
              status: s.status || defaultSigCards[sIdx].status,
            }))
          : defaultSigCards,
      formulaLeft,
      formulaMid,
      formulaRight,
      riskCards: [
        {
          title: shortTitle(c0, 'Efectividad Operativa'),
          pillPrefix: 'IMPACTO:',
          val: 100,
          unit: '%',
          sub: c0.slice(0, 52),
          widthPct: 100,
          color: 'green',
        },
        {
          title: shortTitle(c1, 'Precisión Normativa'),
          pillPrefix: 'CUMPLIMIENTO:',
          val: 99,
          unit: '%',
          sub: c1.slice(0, 52),
          widthPct: 96,
          color: 'cyan',
        },
        {
          title: shortTitle(c2, 'Ahorro de Tiempo'),
          pillPrefix: 'VELOCIDAD:',
          val: 10,
          unit: 'x',
          sub: c2.slice(0, 52),
          widthPct: 92,
          color: 'lime',
        },
      ],
      coreIcon: 'radar',
      coreLabel: (stepPrefix || shortTitle(titleHighlight, 'NÚCLEO WAPPY')).toUpperCase().slice(0, 18),
      coreBadge: 'IA ACTIVA 360°',
      orbitalNodes:
        Array.isArray(stepMeta?.orbitalNodes) && stepMeta.orbitalNodes.length >= 5
          ? stepMeta.orbitalNodes.slice(0, 5).map((n, nIdx) => ({
              icon: n.icon || defaultOrbitalNodes[nIdx].icon,
              title: n.title || defaultOrbitalNodes[nIdx].title,
              sub: n.sub || defaultOrbitalNodes[nIdx].sub,
            }))
          : defaultOrbitalNodes,
      tenshiTitle: `Tenshi IA • ${shortTitle(titleHighlight, 'Copiloto SG-SST')}`,
      tenshiSub: rawText.slice(0, 64),
      gridSpecs:
        Array.isArray(stepMeta?.gridSpecs) && stepMeta.gridSpecs.length >= 4
          ? stepMeta.gridSpecs.slice(0, 4).map((g, gIdx) => ({
              icon: g.icon || defaultGridSpecs[sIdxOr(gIdx)].icon,
              title: g.title || defaultGridSpecs[sIdxOr(gIdx)].title,
              sub: g.sub || defaultGridSpecs[sIdxOr(gIdx)].sub,
              color: g.color || defaultGridSpecs[sIdxOr(gIdx)].color,
            }))
          : defaultGridSpecs,
      cloudTags: normTags,
      ctaHeader: `${companyName} • ECOSISTEMA INTELIGENTE • SG-SST`,
      ctaInstruction: '👇 Escribe en los comentarios o entra ahora:',
      ctaKeyword: stepMeta?.ctaKeyword || 'SOMOS SST',
      ctaGift: `⚡ ${shortTitle(c0, 'ACCESO INMEDIATO EN WAPPY.CLUB').toUpperCase()}`,
      socialBubbles: [
        { icon: 'bolt', text: `💬 ${shortTitle(c0, 'Increíble velocidad con IA')} 🔥` },
        { icon: 'escudo', text: `💬 ${shortTitle(c1, 'Cumplimiento al 100%')} 🚀` },
        { icon: 'cerebro_ia', text: '💬 SOMOS SST evolución total ⚡' },
        { icon: 'check', text: '💬 Adiós a semanas de Excel 🙌' },
      ],
    };
  });
}

function sIdxOr(i) {
  return Math.max(0, Math.min(3, Number(i) || 0));
}

/**
 * Opcionalmente enriquece el plan de escenas con Gemini en formato JSON estructurado,
 * pero manteniendo SIEMPRE los 7 arquetipos cinéticos a 60 FPS de Antigravity.
 */
async function generateCreativeScenePlanWithAi(scriptText, beats, options, aiGeneratorFn) {
  const basePlan = buildSmartScenePlanFromScript(scriptText, beats, options);
  if (typeof aiGeneratorFn !== 'function' || beats.length === 0) {
    return basePlan;
  }

  // Si el Paso 1 (Super-Prompt IA) ya enriqueció las escenas con cameraAndMotion / badCardTitle y no es una corrección del Paso 3, usar directamente el plan IA sin doble latencia
  const hasPreEnrichedAiSteps =
    Array.isArray(options?.scriptSteps) &&
    options.scriptSteps.some((s) => s && (s.cameraAndMotion || s.badCardTitle));
  const isLiveEditRequest =
    String(options?.prompt || '').includes('Edición solicitada:') ||
    String(options?.prompt || '').includes('[CORRECCIÓN');
  if (hasPreEnrichedAiSteps && !isLiveEditRequest) {
    return basePlan;
  }

  try {
    const beatsPrompt = beats
      .map(
        (b, idx) =>
          `Beat ${idx + 1} [${b.startSec}s - ${b.endSec}s] (Arquetipo: ${basePlan[idx].archetype} | Efecto: ${basePlan[idx].visualEffect || basePlan[idx].archetype}): "${b.text}"`,
      )
      .join('\n');

    const superPromptContext = options?.prompt
      ? `\nDIRECTRICES DEL SUPER-PROMPT Y USUARIO:\n${String(options.prompt).slice(0, 1800)}\n`
      : '';

    const prompt = `Eres el Director Creativo de Motion Graphics de WAPPY IA y Google Antigravity.
Para cada uno de los siguientes ${beats.length} beats del guion de locución, genera los textos cortos, específicos y de alto impacto que alimentarán nuestro motor de animación 3D a 60 FPS.
- Dirección de Arte: ${options?.theme || 'dark-tech-hud'}
- Insignia de Portada: ${options?.badgeText || 'CÁPSULA INTERACTIVA WAPPY'}
- Titular de Portada: ${options?.headlineText || ''}
- Subtítulo de Portada: ${options?.subtitleText || ''}
- Efectos Seleccionados: ${Array.isArray(options?.selectedEffects) ? options.selectedEffects.join(', ') : ''}
${superPromptContext}
GUION POR BEATS:
${beatsPrompt}

Devuelve ÚNICAMENTE un JSON válido (sin bloques markdown \`\`\`json) con un arreglo "scenes" de longitud exacta ${beats.length}, donde cada objeto tenga:
{
  "eyebrow": "TEXTO CORTO EN MAYÚSCULAS (máx 28 caracteres)",
  "titleBefore": "2 o 3 palabras iniciales del titular gigante (máx 20 caracteres)",
  "titleHighlight": "Palabra o concepto clave a resaltar en verde lima/cian (máx 18 caracteres)",
  "highlightStyle": "lime" | "cyan" | "red",
  "badCardTitle": "Título corto del riesgo/error tradicional (máx 26 caracteres)",
  "badCardDesc": "Consecuencia o peligro en 1 línea (máx 58 caracteres)",
  "goodCardTitle": "Título corto de la solución segura WAPPY (máx 26 caracteres)",
  "goodCardDesc": "Beneficio o regla clave en 1 línea (máx 58 caracteres)",
  "islandText": "Texto corto Dynamic Island (máx 14 caracteres)",
  "sideCards": [
    { "icon": "EMOJI", "title": "Título tarjeta 1 (máx 24 chars)", "desc": "Descripción corta (máx 48 chars)" },
    { "icon": "EMOJI", "title": "Título tarjeta 2 (máx 24 chars)", "desc": "Descripción corta (máx 48 chars)" },
    { "icon": "EMOJI", "title": "Título tarjeta 3 (máx 24 chars)", "desc": "Descripción corta (máx 48 chars)" }
  ],
  "sigCards": [
    { "role": "Paso o rol 1 (máx 22 chars)", "icon": "🔒", "status": "✓ VERIFICADO" },
    { "role": "Paso o rol 2 (máx 22 chars)", "icon": "🏷️", "status": "✓ APLICADO" },
    { "role": "Paso o rol 3 (máx 22 chars)", "icon": "✍️", "status": "✓ FIRMADO" }
  ],
  "orbitalNodes": [
    { "icon": "EMOJI", "title": "Nodo 1 (máx 18 chars)", "sub": "Subtítulo (máx 22 chars)" },
    { "icon": "EMOJI", "title": "Nodo 2 (máx 18 chars)", "sub": "Subtítulo (máx 22 chars)" },
    { "icon": "EMOJI", "title": "Nodo 3 (máx 18 chars)", "sub": "Subtítulo (máx 22 chars)" },
    { "icon": "EMOJI", "title": "Nodo 4 (máx 18 chars)", "sub": "Subtítulo (máx 22 chars)" },
    { "icon": "EMOJI", "title": "Nodo 5 (máx 18 chars)", "sub": "Subtítulo (máx 22 chars)" }
  ],
  "gridSpecs": [
    { "icon": "EMOJI", "title": "Pilar 1 (máx 20 chars)", "sub": "Detalle corto (máx 26 chars)" },
    { "icon": "EMOJI", "title": "Pilar 2 (máx 20 chars)", "sub": "Detalle corto (máx 26 chars)" },
    { "icon": "EMOJI", "title": "Pilar 3 (máx 20 chars)", "sub": "Detalle corto (máx 26 chars)" },
    { "icon": "EMOJI", "title": "Pilar 4 (máx 20 chars)", "sub": "Detalle corto (máx 26 chars)" }
  ],
  "ctaKeyword": "SOMOS SST"
}`;

    const rawResp = await aiGeneratorFn(prompt);
    const cleaned = String(rawResp || '')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
        return basePlan.map((item, idx) => {
          const aiItem = parsed.scenes[idx] || {};
          return {
            ...item,
            eyebrow: aiItem.eyebrow || item.eyebrow,
            titleBefore: aiItem.titleBefore || item.titleBefore,
            titleHighlight: aiItem.titleHighlight || item.titleHighlight,
            highlightStyle: ['lime', 'cyan', 'red'].includes(aiItem.highlightStyle)
              ? aiItem.highlightStyle
              : item.highlightStyle,
            badCardTitle: aiItem.badCardTitle || item.badCardTitle,
            badCardDesc: aiItem.badCardDesc || item.badCardDesc,
            goodCardTitle: aiItem.goodCardTitle || item.goodCardTitle,
            goodCardDesc: aiItem.goodCardDesc || item.goodCardDesc,
            islandText: aiItem.islandText || item.islandText,
            sideCards:
              Array.isArray(aiItem.sideCards) && aiItem.sideCards.length >= 3
                ? aiItem.sideCards.slice(0, 3).map((c, cIdx) => ({
                    icon: c.icon || item.sideCards[cIdx].icon,
                    title: c.title || item.sideCards[cIdx].title,
                    desc: c.desc || item.sideCards[cIdx].desc,
                    color: item.sideCards[cIdx].color,
                  }))
                : item.sideCards,
            sigCards:
              Array.isArray(aiItem.sigCards) && aiItem.sigCards.length >= 3
                ? aiItem.sigCards.slice(0, 3).map((s, sIdx) => ({
                    role: s.role || item.sigCards[sIdx].role,
                    icon: s.icon || item.sigCards[sIdx].icon,
                    status: s.status || item.sigCards[sIdx].status,
                  }))
                : item.sigCards,
            orbitalNodes:
              Array.isArray(aiItem.orbitalNodes) && aiItem.orbitalNodes.length >= 5
                ? aiItem.orbitalNodes.slice(0, 5).map((n, nIdx) => ({
                    icon: n.icon || item.orbitalNodes[nIdx].icon,
                    title: n.title || item.orbitalNodes[nIdx].title,
                    sub: n.sub || item.orbitalNodes[nIdx].sub,
                  }))
                : item.orbitalNodes,
            gridSpecs:
              Array.isArray(aiItem.gridSpecs) && aiItem.gridSpecs.length >= 4
                ? aiItem.gridSpecs.slice(0, 4).map((g, gIdx) => ({
                    icon: g.icon || item.gridSpecs[gIdx].icon,
                    title: g.title || item.gridSpecs[gIdx].title,
                    sub: g.sub || item.gridSpecs[gIdx].sub,
                    color: item.gridSpecs[gIdx].color,
                  }))
                : item.gridSpecs,
            ctaKeyword: aiItem.ctaKeyword || item.ctaKeyword,
          };
        });
      }
    }
  } catch (_) {}
  return basePlan;
}

/**
 * Renderiza la Portada Magnética Obligatoria (0.00s – 2.00s, Escena 0)
 * con la arquitectura exacta de WAPPY_IA_Reel_Matriz_IPEVR_GTC45_Oficial:
 * - Avatar 3D de alta resolución del Brandbook (avatar2_mauricio_camisa_cuadros_amarilla.png)
 * - iPhone 3D inclinado con interfaz real de WAPPY IA en vivo (cero emojis 📱)
 * - Titular con cajas inclinadas .hl-red-tilted y .hl-lime-tilted
 * - 3 insignias glass con iconografía SVG Duotone + footer wappy.club · SOMOS SST
 */
function renderMagneticCoverMarkup(scenePlan = [], options = {}) {
  const firstSc = scenePlan[0] || {};
  const secondSc = scenePlan[1] || firstSc;
  const thirdSc = scenePlan[2] || secondSc;
  const companyName = options.companyName || 'WAPPY IA';

  const rawHeadline = String(
    options.headlineText || `${firstSc.titleBefore || 'GESTIÓN'} ${firstSc.titleHighlight || 'SG-SST CON IA'}`,
  ).trim();
  const hWords = rawHeadline.split(/\s+/).filter(Boolean);
  const line1 = hWords.slice(0, Math.max(1, Math.min(2, Math.floor(hWords.length / 3) || 1))).join(' ') || 'DE SEMANAS';
  const redBox = hWords.slice(1, Math.max(2, Math.min(4, Math.ceil((hWords.length * 2) / 3)))).join(' ') || firstSc.titleBefore || 'DE PAPELEO';
  const limeBox = hWords.slice(Math.max(2, Math.min(4, Math.ceil((hWords.length * 2) / 3)))).join(' ') || firstSc.titleHighlight || 'A SEGUNDOS CON IA';

  const badge1 = firstSc.sideCards?.[0]?.title || firstSc.titleHighlight || 'Matriz & Diagnóstico IA';
  const badge2 = secondSc.sideCards?.[0]?.title || secondSc.titleHighlight || 'Firma Digital & Control';
  const badge3 = thirdSc.sideCards?.[0]?.title || thirdSc.titleHighlight || 'Informe Gerencial en Vivo';

  const fullTextForGratis = `${rawHeadline} ${options.subtitleText || ''} ${firstSc.subtitle || ''}`;
  const mentionsGratis = /\bgratis\b|\bgratuito\b/i.test(fullTextForGratis);
  const topPillLabel = mentionsGratis ? '🔥 100% GRATIS EN WAPPY.CLUB' : `⚡ ${options.badgeText || firstSc.eyebrow || 'ECOSISTEMA IA · SG-SST'}`;

  return `
    <div class="scene scene-cover" id="scene-0" data-archetype="magnetic-cover-2s" style="opacity:1;visibility:visible;">
      <div class="cover-layout">
        <div class="cover-top-brand" id="s0-brand">
          <img src="/assets/brandbook/isotipo_w_favicon.png" alt="W" class="cover-logo-w">
          <span class="cover-brand-text">${escapeHtml(topPillLabel)}</span>
        </div>

        <div class="cover-title-block" id="s0-title">
          <div class="cover-t-line1">${escapeHtml(line1.toUpperCase())}</div>
          <div class="cover-t-row">
            <span class="hl-red-tilted">${escapeHtml(redBox.toUpperCase())}</span>
            <span class="hl-lime-tilted">${escapeHtml(limeBox.toUpperCase())}</span>
          </div>
        </div>

        <div class="cover-hero-stage" id="s0-hero">
          <div class="cover-avatar-card">
            <div class="cover-avatar-aura"></div>
            <img src="/assets/brandbook/avatar2_mauricio_camisa_cuadros_amarilla.png" alt="Avatar 3D" class="cover-avatar-img">
            <div class="cover-avatar-tag">
              <span class="dot-live"></span> AVATAR 3D · IA ACTIVA
            </div>
          </div>

          <div class="cover-iphone-tilted">
            <div class="dynamic-island">
              <span class="island-dot"></span>
              <span class="island-text">WAPPY.CLUB</span>
              <span style="font-size:11px;color:var(--w-lime);font-weight:900;">IA</span>
            </div>
            <div class="iphone-ui-real">
              <div class="ui-app-header">
                <div style="display:flex;align-items:center;gap:6px;">
                  <img src="/assets/brandbook/isotipo_w_favicon.png" alt="W" style="width:20px;height:20px;border-radius:5px;">
                  <span style="font-weight:900;font-size:13px;color:#fff;">${escapeHtml(companyName)}</span>
                </div>
                <span class="ui-live-pill">99.4% OK</span>
              </div>
              <div class="ui-kpi-strip">
                <div class="ui-kpi-mini"><span class="k-val" style="color:var(--w-lime);">100%</span><span class="k-lbl">IA SST</span></div>
                <div class="ui-kpi-mini"><span class="k-val" style="color:var(--w-cyan-bright);">GTC 45</span><span class="k-lbl">NORMA</span></div>
                <div class="ui-kpi-mini"><span class="k-val" style="color:#4ade80;">ACTIVO</span><span class="k-lbl">ESTADO</span></div>
              </div>
              <div class="ui-matrix-rows">
                <div class="ui-m-row" style="border-left:3px solid #ef4444;">
                  <div class="ui-m-txt"><strong>${escapeHtml(badge1.slice(0, 20))}</strong><span>Diagnóstico automático IA</span></div>
                  <span class="ui-m-badge" style="background:rgba(239,68,68,0.25);color:#fca5a5;">CRÍTICO</span>
                </div>
                <div class="ui-m-row" style="border-left:3px solid #22d3ee;">
                  <div class="ui-m-txt"><strong>${escapeHtml(badge2.slice(0, 20))}</strong><span>Control y trazabilidad</span></div>
                  <span class="ui-m-badge" style="background:rgba(34,211,238,0.22);color:#22d3ee;">EN VIVO</span>
                </div>
                <div class="ui-m-row" style="border-left:3px solid #c7f303;">
                  <div class="ui-m-txt"><strong>${escapeHtml(badge3.slice(0, 20))}</strong><span>Exportación A4 + Firmas</span></div>
                  <span class="ui-m-badge" style="background:var(--w-lime);color:#0e1300;">LISTO</span>
                </div>
              </div>
              <div class="ui-tenshi-bar">
                <img src="/assets/brandbook/mascota_tenshi_3d.png" alt="Tenshi" style="width:26px;height:26px;border-radius:50%;object-fit:contain;">
                <span>Tenshi IA · Copiloto SG-SST</span>
              </div>
            </div>
          </div>
        </div>

        <div class="cover-badges-row" id="s0-badges">
          <div class="cover-glass-badge">
            <div class="cgb-ico">${renderWappySvgIcon('cerebro_ia', '#c7f303', 32)}</div>
            <span>${escapeHtml(badge1.slice(0, 24))}</span>
          </div>
          <div class="cover-glass-badge">
            <div class="cgb-ico">${renderWappySvgIcon('firma', '#22d3ee', 32)}</div>
            <span>${escapeHtml(badge2.slice(0, 24))}</span>
          </div>
          <div class="cover-glass-badge">
            <div class="cgb-ico">${renderWappySvgIcon('grafica', '#2dd4bf', 32)}</div>
            <span>${escapeHtml(badge3.slice(0, 24))}</span>
          </div>
        </div>

        <div class="cover-footer-bar" id="s0-footer">
          <span class="cf-domain">🌐 wappy.club</span>
          <span class="cf-sep">•</span>
          <span class="cf-cta">SOMOS SST</span>
        </div>
      </div>
    </div>`;
}

/**
 * Renderiza el HTML interno de cada escena según su Arquetipo Antigravity
 */
function renderSceneMarkup(sc, idx) {
  const num = idx + 1;
  const hlClass =
    sc.highlightStyle === 'red'
      ? 'hl-red'
      : sc.highlightStyle === 'cyan'
        ? 'hl-cyan'
        : 'hl-lime';

  const headerHtml = `
      <div class="header-box" id="s${num}-header">
        <div class="eyebrow-pill"><span class="dot"></span> ${escapeHtml(sc.eyebrow)}</div>
        <h1 class="title-hero">${escapeHtml(sc.titleBefore)} <span class="${hlClass}">${escapeHtml(sc.titleHighlight)}</span></h1>
        <p class="sub-hero">${escapeHtml(sc.subtitle)}</p>
      </div>`;

  if (sc.archetype === 'hook-vs-wall') {
    const pillsHtml = (sc.wallPills || [])
      .map(
        (p, pIdx) =>
          `<span class="${pIdx % 2 === 0 ? 'headline-pill-lime' : 'headline-pill-dark'}">${escapeHtml(p)}</span>`,
      )
      .join('');
    return `
    <div class="scene" id="scene-${num}" data-archetype="hook-vs-wall">
      ${headerHtml}
      <div class="middle-container">
        <div class="hook-box" style="position:relative;">
          <div class="hook-card hook-card-bad hud-glass-pro" id="s${num}-card-1">
            <div class="hook-ico-box" style="background: rgba(239, 68, 68, 0.22); border: 2.5px solid #ef4444;">
              ${renderWappySvgIcon('alerta', '#ef4444', 52)}
            </div>
            <div class="hook-text">
              <h3>${escapeHtml(sc.badCardTitle)}</h3>
              <p>${escapeHtml(sc.badCardDesc)}</p>
            </div>
            <div class="hook-badge" style="background: rgba(239, 68, 68, 0.25); color: #fca5a5; border: 2px solid #ef4444;">${escapeHtml(sc.badCardBadge)}</div>
          </div>

          <div class="vs-badge-circle">VS</div>

          <div class="hook-card hook-card-good hud-glass-pro" id="s${num}-card-2">
            <div class="corner-bracket cb-tl"></div><div class="corner-bracket cb-tr"></div>
            <div class="corner-bracket cb-bl"></div><div class="corner-bracket cb-br"></div>
            <div class="hook-ico-box" style="background: rgba(199, 243, 3, 0.22); border: 2.5px solid var(--w-lime);">
              ${renderWappySvgIcon('escudo', '#c7f303', 52)}
            </div>
            <div class="hook-text">
              <h3>${escapeHtml(sc.goodCardTitle)}</h3>
              <p>${escapeHtml(sc.goodCardDesc)}</p>
            </div>
            <div class="hook-badge" style="background: var(--w-lime); color: #0e1300;">${escapeHtml(sc.goodCardBadge)}</div>
          </div>

          <div class="tenshi-terminal-strip hud-glass-pro">
            <img src="/assets/brandbook/mascota_tenshi_3d.png" alt="Tenshi" class="tt-avatar">
            <div class="tt-body">
              <div class="tt-label">TENSHI IA · MOTOR DE PREVENCIÓN EN VIVO</div>
              <div class="tt-text">${escapeHtml((sc.sideCards?.[0]?.desc || sc.subtitle || '').slice(0, 72))}</div>
            </div>
            <span class="tt-status">✓ ACTIVO</span>
          </div>
        </div>

        <div class="headline-wall-wrap">
          <div class="headline-track" id="s${num}-track">
            ${pillsHtml}${pillsHtml}
          </div>
        </div>
      </div>
    </div>`;
  }

  if (sc.archetype === 'iphone-split-showcase') {
    const phonePillsHtml = (sc.phonePills || [])
      .map(
        (p, pIdx) => `
              <div class="iphone-alert-pill" id="s${num}-pp-${pIdx + 1}" style="${
                pIdx === 1
                  ? 'border-color: var(--w-cyan-bright); background: rgba(6,182,212,0.18);'
                  : pIdx === 2
                    ? 'border-color: var(--w-teal-bright); background: rgba(13,148,136,0.20);'
                    : ''
              }">
                <span class="pill-svg-wrap">${renderWappySvgIcon(p.icon, pIdx === 1 ? '#22d3ee' : '#c7f303', 24)}</span>
                <span>${escapeHtml(p.text)}</span>
              </div>`,
      )
      .join('');

    const sideCardsHtml = (sc.sideCards || [])
      .map((c, cIdx) => {
        const borderCol =
          cIdx === 0
            ? 'rgba(34, 211, 238, 0.65)'
            : cIdx === 1
              ? 'rgba(45, 212, 191, 0.65)'
              : 'rgba(199, 243, 3, 0.75)';
        const icoBg =
          cIdx === 0
            ? 'background: rgba(34, 211, 238, 0.2); border: 2px solid var(--w-cyan-bright);'
            : cIdx === 1
              ? 'background: rgba(13, 148, 136, 0.22); border: 2px solid var(--w-teal-bright);'
              : 'background: rgba(199, 243, 3, 0.2); border: 2px solid var(--w-lime);';
        const svgCol = cIdx === 0 ? '#22d3ee' : cIdx === 1 ? '#2dd4bf' : '#c7f303';
        return `
            <div class="side-card hud-glass-pro" id="s${num}-sc-${cIdx + 1}" style="border-color: ${borderCol};">
              <div class="side-card-ico" style="${icoBg}">${renderWappySvgIcon(c.icon || c.title, svgCol, 42)}</div>
              <div class="side-card-text">
                <h4>${escapeHtml(c.title)}</h4>
                <p>${escapeHtml(c.desc)}</p>
              </div>
            </div>`;
      })
      .join('');

    return `
    <div class="scene" id="scene-${num}" data-archetype="iphone-split-showcase">
      ${headerHtml}
      <div class="middle-container">
        <div class="split-showcase">
          <div class="iphone-frame" id="s${num}-phone">
            <div class="dynamic-island">
              <span class="island-dot"></span>
              <span class="island-text">${escapeHtml(sc.islandText)}</span>
              <span style="font-size: 11px; color: var(--w-lime); font-weight: 900;">SG-SST</span>
            </div>
            <div class="iphone-screen">
              <div class="iphone-qr-box">
                <div class="qr-scan-line" id="s${num}-laser"></div>
                <div class="ui-app-header" style="width:100%;margin-bottom:8px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <img src="/assets/brandbook/isotipo_w_favicon.png" alt="W" style="width:18px;height:18px;border-radius:4px;">
                    <span style="font-family:var(--mono);font-size:12px;font-weight:900;color:#fff;">WAPPY CLOUD</span>
                  </div>
                  <span class="ui-live-pill">LIVE</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;width:100%;background:rgba(199,243,3,0.10);border:1.5px solid rgba(199,243,3,0.45);border-radius:14px;padding:10px 12px;">
                  ${renderWappySvgIcon('cerebro_ia', '#c7f303', 38)}
                  <div style="text-align:left;">
                    <div style="font-family:var(--mono);font-size:15px;font-weight:900;color:var(--w-lime);">${escapeHtml(sc.phoneQrTitle)}</div>
                    <div style="font-size:12px;font-weight:700;color:#cbd5e1;">Motor IA · Verificación Activa</div>
                  </div>
                </div>
              </div>
              ${phonePillsHtml}
            </div>
          </div>

          <div class="side-cards-col">
            ${sideCardsHtml}
          </div>
        </div>
      </div>
    </div>`;
  }

  if (sc.archetype === 'signature-pad-live') {
    const sigPaths = [
      'M 24 44 C 52 12, 74 54, 102 24 C 122 10, 140 50, 168 30 C 195 14, 220 42, 296 22',
      'M 30 46 Q 70 10 110 38 T 190 26 T 275 36 L 310 18',
      'M 28 38 C 65 8, 95 56, 135 22 C 165 6, 200 48, 245 28 L 308 24',
    ];
    const sigHtml = (sc.sigCards || [])
      .map(
        (sg, sIdx) => `
            <div class="sig-card hud-glass-pro" id="s${num}-sig-${sIdx + 1}" style="${
              sIdx === 1
                ? 'border-color: rgba(34, 211, 238, 0.65);'
                : sIdx === 2
                  ? 'border-color: rgba(199, 243, 3, 0.72);'
                  : ''
            }">
              <div class="sig-header">
                <div class="sig-role">
                  <span class="pill-svg-wrap">${renderWappySvgIcon(sg.icon || 'firma', sIdx === 1 ? '#22d3ee' : '#c7f303', 28)}</span>
                  ${escapeHtml(sg.role)}
                </div>
                <div class="sig-status">${escapeHtml(sg.status)}</div>
              </div>
              <div class="sig-pad-canvas">
                <svg class="sig-svg" viewBox="0 0 340 64">
                  <path class="sig-path" id="s${num}-sigpath-${sIdx + 1}" stroke="${
                    sIdx === 1 ? '#22d3ee' : '#c7f303'
                  }" d="${sigPaths[sIdx % sigPaths.length]}"/>
                </svg>
              </div>
            </div>`,
      )
      .join('');

    const docRole1 = sc.sigCards?.[0]?.role || sc.sideCards?.[0]?.title || 'Diagnóstico Técnico';
    const docRole2 = sc.sigCards?.[1]?.role || sc.sideCards?.[1]?.title || 'Control Preventivo';
    const docRole3 = sc.sigCards?.[2]?.role || 'Firma Digital A4';

    return `
    <div class="scene" id="scene-${num}" data-archetype="signature-pad-live">
      ${headerHtml}
      <div class="middle-container">
        <div class="split-showcase">
          <div class="iphone-frame" id="s${num}-phone">
            <div class="dynamic-island">
              <span class="island-dot"></span>
              <span class="island-text">${escapeHtml(sc.islandText || 'FIRMA DIGITAL')}</span>
              <span style="font-size: 11px; color: var(--w-lime); font-weight: 900;">A4</span>
            </div>
            <div class="iphone-screen">
              <div class="iphone-qr-box" style="border-color: var(--w-lime);">
                <div class="qr-scan-line" id="s${num}-laser"></div>
                <div style="display:flex;align-items:center;gap:10px;width:100%;">
                  ${renderWappySvgIcon('firma', '#c7f303', 42)}
                  <div style="text-align:left;">
                    <div style="font-family: var(--mono); font-size: 15px; font-weight: 900; color: var(--w-lime);">${escapeHtml(sc.phoneQrTitle || 'EXPEDIENTE SST')}</div>
                    <div style="font-size:12px;color:#cbd5e1;font-weight:700;">Validez Legal & QR Verificado</div>
                  </div>
                </div>
                <div style="margin-top:10px;width:100%;background:rgba(254,240,138,0.16);border-left:3px solid #facc15;padding:7px 10px;border-radius:8px;font-size:12px;font-weight:700;color:#fef08a;text-align:left;">
                  «${escapeHtml((sc.subtitle || '').slice(0, 58))}»
                </div>
              </div>
              <div class="iphone-alert-pill" style="border-color: var(--w-lime); background: rgba(199,243,3,0.18);">
                <span class="pill-svg-wrap">${renderWappySvgIcon('escudo', '#c7f303', 22)}</span>
                <span>${escapeHtml(docRole1.slice(0, 26))}</span>
              </div>
              <div class="iphone-alert-pill" style="border-color: var(--w-cyan-bright); background: rgba(6,182,212,0.18);">
                <span class="pill-svg-wrap">${renderWappySvgIcon('cerebro_ia', '#22d3ee', 22)}</span>
                <span>${escapeHtml(docRole2.slice(0, 26))}</span>
              </div>
              <div class="iphone-alert-pill" style="border-color: var(--w-teal-bright); background: rgba(13,148,136,0.22);">
                <span class="pill-svg-wrap">${renderWappySvgIcon('check', '#2dd4bf', 22)}</span>
                <span>${escapeHtml(docRole3.slice(0, 26))}</span>
              </div>
            </div>
          </div>

          <div class="side-cards-col">
            ${sigHtml}
          </div>
        </div>
      </div>
    </div>`;
  }

  if (sc.archetype === 'chart-grow-math') {
    const riskHtml = (sc.riskCards || [])
      .map((rk, rIdx) => {
        const bCol = rIdx === 0 ? '#22c55e' : rIdx === 1 ? '#22d3ee' : '#c7f303';
        const grad =
          rIdx === 0
            ? 'linear-gradient(90deg, #22c55e, #c7f303)'
            : rIdx === 1
              ? 'linear-gradient(90deg, #06b6d4, #22d3ee)'
              : 'linear-gradient(90deg, #14b8a6, #c7f303)';
        return `
            <div class="risk-card hud-glass-pro" id="s${num}-rk-${rIdx + 1}" style="border: 2.5px solid ${bCol};">
              <div class="risk-top">
                <div class="risk-title" style="display:flex;align-items:center;gap:10px;">
                  ${renderWappySvgIcon(rIdx === 0 ? 'escudo' : rIdx === 1 ? 'grafica' : 'bolt', bCol, 28)}
                  <span>${escapeHtml(rk.title)}</span>
                </div>
                <div class="risk-nr-pill" style="background: rgba(199,243,3,0.2); color:#c7f303; border:1.5px solid ${bCol};" id="s${num}-rknum-${rIdx + 1}" data-target="${rk.val}" data-prefix="${escapeHtml(rk.pillPrefix)}" data-unit="${escapeHtml(rk.unit)}">${escapeHtml(rk.pillPrefix)} ${rk.val}${escapeHtml(rk.unit)}</div>
              </div>
              <div class="risk-sub">${escapeHtml(rk.sub)}</div>
              <div class="risk-bar-bg"><div class="risk-bar-fill" id="s${num}-rkbar-${rIdx + 1}" data-width="${rk.widthPct}" style="background: ${grad};"></div></div>
            </div>`;
      })
      .join('');

    const barsCols = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'IA']
      .map(
        (lbl, bIdx) => `
                <div class="chart-col">
                  <div class="col-bar" id="s${num}-cb-${bIdx + 1}"></div>
                  <span class="col-label">${lbl}</span>
                </div>`,
      )
      .join('');

    return `
    <div class="scene" id="scene-${num}" data-archetype="chart-grow-math">
      ${headerHtml}
      <div class="middle-container">
        <div class="formula-banner" id="s${num}-formula">
          <span>${escapeHtml(sc.formulaLeft)}</span>
          <span>➔</span>
          <span style="color:var(--w-cyan-bright)">${escapeHtml(sc.formulaMid)}</span>
          <span>➔</span>
          <span style="color:var(--w-lime)">${escapeHtml(sc.formulaRight)}</span>
        </div>

        <div class="split-showcase">
          <div class="iphone-frame" id="s${num}-phone" style="height: 680px;">
            <div class="dynamic-island">
              <span class="island-dot"></span>
              <span class="island-text">ANALÍTICA IA</span>
              <span style="font-size: 11px; color: var(--w-cyan-bright); font-weight: 900;">KPI</span>
            </div>
            <div class="iphone-screen">
              <div class="iphone-qr-box" style="border-color: var(--w-cyan-bright);">
                <div class="qr-scan-line" id="s${num}-laser"></div>
                <div style="display:flex;align-items:center;gap:10px;width:100%;">
                  ${renderWappySvgIcon('grafica', '#22d3ee', 40)}
                  <div style="text-align:left;">
                    <div style="font-family: var(--mono); font-size: 15px; font-weight: 900; color: var(--w-cyan-bright);">${escapeHtml(sc.phoneQrTitle || 'INDICADORES SST')}</div>
                    <div style="font-size:12px;color:#cbd5e1;font-weight:700;">Cálculo Determinista en Vivo</div>
                  </div>
                </div>
              </div>
              <div class="chart-bars-wrap" style="height: 160px; margin-top: 18px;">
                ${barsCols}
              </div>
              <div class="iphone-alert-pill" style="margin-top: auto; border-color: var(--w-lime); background: rgba(199,243,3,0.2);">
                <span class="pill-svg-wrap">${renderWappySvgIcon('check', '#c7f303', 22)}</span>
                <span>${escapeHtml(sc.formulaRight || '100% Cumplimiento')}</span>
              </div>
            </div>
          </div>

          <div class="side-cards-col">
            ${riskHtml}
          </div>
        </div>
      </div>
    </div>`;
  }

  if (sc.archetype === 'pentagon-orbital') {
    const nodesHtml = (sc.orbitalNodes || [])
      .slice(0, 5)
      .map((nd, nIdx) => {
        const icoBgs = [
          'background: rgba(45, 212, 191, 0.22); border: 2px solid var(--w-teal-bright);',
          'background: rgba(34, 211, 238, 0.22); border: 2px solid var(--w-cyan-bright);',
          'background: rgba(245, 158, 11, 0.22); border: 2px solid var(--w-amber);',
          'background: rgba(239, 68, 68, 0.22); border: 2px solid #ef4444;',
          'background: rgba(199, 243, 3, 0.22); border: 2px solid var(--w-lime);',
        ];
        const icoCols = ['#2dd4bf', '#22d3ee', '#f59e0b', '#ef4444', '#c7f303'];
        return `
          <div class="orbital-node pos-node-${nIdx + 1}" id="s${num}-node-${nIdx + 1}">
            <div class="node-ico" style="${icoBgs[nIdx]}">${renderWappySvgIcon(nd.icon || nd.title, icoCols[nIdx], 36)}</div>
            <div>
              <div class="node-title">${escapeHtml(nd.title)}</div>
              <div class="node-sub">${escapeHtml(nd.sub)}</div>
            </div>
          </div>`;
      })
      .join('');

    return `
    <div class="scene" id="scene-${num}" data-archetype="pentagon-orbital">
      ${headerHtml}
      <div class="middle-container">
        <div class="orbital-stage">
          <svg class="laser-connections" viewBox="0 0 1010 850">
            <polygon points="505,85 812,250 745,735 265,735 198,250"
              fill="none" stroke="rgba(34, 211, 238, 0.28)" stroke-width="2.5" stroke-dasharray="8 8"/>
            <line id="s${num}-laser-1" x1="505" y1="435" x2="505" y2="85"  stroke="#2dd4bf" stroke-width="4" stroke-dasharray="10 7"/>
            <line id="s${num}-laser-2" x1="505" y1="435" x2="812" y2="250" stroke="#22d3ee" stroke-width="4" stroke-dasharray="10 7"/>
            <line id="s${num}-laser-3" x1="505" y1="435" x2="745" y2="735" stroke="#f59e0b" stroke-width="4" stroke-dasharray="10 7"/>
            <line id="s${num}-laser-4" x1="505" y1="435" x2="265" y2="735" stroke="#ef4444" stroke-width="4" stroke-dasharray="10 7"/>
            <line id="s${num}-laser-5" x1="505" y1="435" x2="198" y2="250" stroke="#c7f303" stroke-width="4" stroke-dasharray="10 7"/>
          </svg>

          <div class="pulse-ring ring-1" id="s${num}-ring-1"></div>
          <div class="pulse-ring ring-2" id="s${num}-ring-2"></div>

          <div class="biocore-center" id="s${num}-core">
            <div class="biocore-fingerprint">${renderWappySvgIcon(sc.coreIcon || 'radar', '#22d3ee', 92)}</div>
            <div class="biocore-label">${escapeHtml(sc.coreLabel)}</div>
            <div class="biocore-match">${escapeHtml(sc.coreBadge)}</div>
          </div>

          ${nodesHtml}
        </div>
      </div>
    </div>`;
  }

  if (sc.archetype === 'tenshi-specialists-grid') {
    const specsHtml = (sc.gridSpecs || [])
      .slice(0, 4)
      .map((sp, sIdx) => {
        const borders = [
          'border-left: 6px solid var(--w-teal-bright);',
          'border-left: 6px solid var(--w-cyan-bright);',
          'border-left: 6px solid var(--w-amber);',
          'border-left: 6px solid var(--w-lime);',
        ];
        const bgs = [
          'background: rgba(13, 148, 136, 0.25);',
          'background: rgba(6, 182, 212, 0.25);',
          'background: rgba(245, 158, 11, 0.25);',
          'background: rgba(199, 243, 3, 0.25);',
        ];
        const cols = ['#2dd4bf', '#22d3ee', '#f59e0b', '#c7f303'];
        return `
            <div class="spec-item hud-glass-pro" id="s${num}-sp-${sIdx + 1}" style="${borders[sIdx]}">
              <div class="spec-ico" style="${bgs[sIdx]}">${renderWappySvgIcon(sp.icon || sp.title, cols[sIdx], 38)}</div>
              <div class="spec-text">
                <h4>${escapeHtml(sp.title)}</h4>
                <p>${escapeHtml(sp.sub)}</p>
              </div>
            </div>`;
      })
      .join('');

    const tagsHtml = (sc.cloudTags || [])
      .map((tg) => `<span class="spec-pill-tag">${escapeHtml(tg)}</span>`)
      .join('');

    return `
    <div class="scene" id="scene-${num}" data-archetype="tenshi-specialists-grid">
      ${headerHtml}
      <div class="middle-container">
        <div class="especialistas-box">
          <div class="tenshi-header-card hud-glass-pro" id="s${num}-topbar">
            <div class="corner-bracket cb-tl"></div><div class="corner-bracket cb-tr"></div>
            <div class="tenshi-orb-img">
              <img src="/assets/brandbook/mascota_tenshi_3d.png" alt="Tenshi IA">
            </div>
            <div class="tenshi-h-info">
              <h3>${escapeHtml(sc.tenshiTitle)}</h3>
              <p>${escapeHtml(sc.tenshiSub)}</p>
            </div>
          </div>

          <div class="spec-list-grid">
            ${specsHtml}
          </div>

          <div class="spec-cloud-tags">
            ${tagsHtml}
          </div>
        </div>
      </div>
    </div>`;
  }

  // Default / Final: cta-viral-bubbles
  const bubblesHtml = (sc.socialBubbles || [])
    .slice(0, 4)
    .map(
      (bb, bIdx) => `
        <div class="social-comment-bubble bubble-${bIdx + 1}" id="s${num}-bub-${bIdx + 1}">
          <span class="bubble-user">${renderWappySvgIcon(bb.icon || 'bolt', '#0e1300', 20)}</span> <span>${escapeHtml(bb.text)}</span>
        </div>`,
    )
    .join('');

  return `
    <div class="scene" id="scene-${num}" data-archetype="cta-viral-bubbles">
      ${headerHtml}
      <div class="middle-container">
        ${bubblesHtml}
        <div class="cta-box hud-glass-pro" id="s${num}-cta-card">
          <div class="corner-bracket cb-tl"></div><div class="corner-bracket cb-tr"></div>
          <div class="corner-bracket cb-bl"></div><div class="corner-bracket cb-br"></div>

          <div class="cta-header-line">${escapeHtml(sc.ctaHeader)}</div>

          <div class="cta-keyword-box">
            <div class="cta-instruction">${escapeHtml(sc.ctaInstruction)}</div>
            <div class="cta-keyword-pill" id="s${num}-cta-glow">
              ${escapeHtml(sc.ctaKeyword || 'SOMOS SST')}
            </div>
            <div class="cta-gift-pill">${escapeHtml(sc.ctaGift)}</div>
          </div>

          <div class="cta-btn-main" id="s${num}-cta-btn">
            <img src="/assets/brandbook/isotipo_w_favicon.png" alt="W" style="width:34px;height:34px;border-radius:8px;">
            <span>wappy.club</span> ↗
          </div>
        </div>
      </div>
    </div>`;
}

/**
 * Lee los motores oficiales de las skills (wappy-avatar-voxel3d.js, efectos-17-reels.js, wappy-brand.js)
 * para inyectarlos directamente en el HTML maestro sin depender de peticiones externas.
 */
let CACHED_VOXEL_AVATAR_JS = null;
let CACHED_SKILL_MOTORS_JS = null;
function getVoxelAvatarInlineJs() {
  if (CACHED_VOXEL_AVATAR_JS) return `${CACHED_VOXEL_AVATAR_JS}\n\n${CACHED_SKILL_MOTORS_JS || ''}`;
  const candidates = [
    path.join(process.cwd(), 'client', 'public', 'assets', 'wappy', 'wappy-avatar-voxel3d.js'),
    path.join(__dirname, '..', '..', '..', 'client', 'public', 'assets', 'wappy', 'wappy-avatar-voxel3d.js'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        CACHED_VOXEL_AVATAR_JS = fs.readFileSync(p, 'utf8');
        break;
      }
    } catch (_) {}
  }
  if (!CACHED_SKILL_MOTORS_JS) {
    const motorFiles = [
      path.join(process.cwd(), '.agents', 'skills', 'animaciones-17-efectos-reels', 'plantilla', 'motor', 'efectos-17-reels.js'),
      path.join(process.cwd(), '.agents', 'skills', 'animaciones-17-efectos-reels', 'plantilla', 'motor', 'wappy-brand.js'),
      path.join(__dirname, '..', '..', '..', '.agents', 'skills', 'animaciones-17-efectos-reels', 'plantilla', 'motor', 'efectos-17-reels.js'),
      path.join(__dirname, '..', '..', '..', '.agents', 'skills', 'animaciones-17-efectos-reels', 'plantilla', 'motor', 'wappy-brand.js'),
    ];
    const loaded = [];
    const seenNames = new Set();
    for (const mf of motorFiles) {
      const bName = path.basename(mf);
      if (seenNames.has(bName)) continue;
      try {
        if (fs.existsSync(mf)) {
          seenNames.add(bName);
          loaded.push(`/* === SKILL MOTOR: ${bName} === */\n` + fs.readFileSync(mf, 'utf8'));
        }
      } catch (_) {}
    }
    CACHED_SKILL_MOTORS_JS = loaded.join('\n\n');
  }
  return `${CACHED_VOXEL_AVATAR_JS || ''}\n\n${CACHED_SKILL_MOTORS_JS || ''}`;
}

/**
 * Compila el documento HTML5 maestro a 60 FPS con los 7 Arquetipos Cinéticos de Antigravity
 * y el Avatar 3D Minecraft Voxel en Three.js (WappyAvatarVoxel3D) sincronizado con la voz.
 */
function compileAntigravityMasterReelHtml(scenePlan, timelineMap, options = {}) {
  const totalDur = Math.max(4, Number(timelineMap.totalDurationSeconds) || 30);
  const hasBaseVideo = Boolean(options.hasBaseVideo);
  const aspectRatio = String(options.aspectRatio || '9:16').trim() === '16:9' ? '16:9' : '9:16';
  const isHorizontal = aspectRatio === '16:9';
  const stageW = isHorizontal ? 1920 : 1080;
  const stageH = isHorizontal ? 1080 : 1920;

  const rawTheme = String(options.theme || options.selectedArtDirection || 'dark-tech-hud').toLowerCase();
  let stageBgGradient = 'radial-gradient(circle at 50% 18%, #0c192e 0%, #050a14 58%, #020409 100%)';
  let bodyBgColor = '#020409';
  if (rawTheme.includes('lima') || rawTheme.includes('oliva') || rawTheme.includes('wappy-dark')) {
    stageBgGradient = 'radial-gradient(circle at 50% 18%, #1d2d04 0%, #0e1300 62%, #070a00 100%)';
    bodyBgColor = '#070a00';
  } else if (rawTheme.includes('cielo') || rawTheme.includes('sky') || rawTheme.includes('cloud')) {
    stageBgGradient = 'radial-gradient(circle at 50% 18%, #0d3b66 0%, #071e36 58%, #030d1a 100%)';
    bodyBgColor = '#030d1a';
  } else if (rawTheme.includes('crema') || rawTheme.includes('cream') || rawTheme.includes('editorial') || rawTheme.includes('dummies')) {
    stageBgGradient = 'radial-gradient(circle at 50% 18%, #132a2e 0%, #09171a 60%, #040b0d 100%)';
    bodyBgColor = '#040b0d';
  }

  const customLime = '#c7f303';
  const customCssBlock = options.customCss ? `\n/* Custom Studio AI Edits */\n${options.customCss}\n` : '';

  const coverMarkup = renderMagneticCoverMarkup(scenePlan, options);
  const scenesMarkup = `${coverMarkup}\n${scenePlan.map((sc, idx) => renderSceneMarkup(sc, idx)).join('\n')}`;
  const voxelAvatarJs = getVoxelAvatarInlineJs();

  const coverDur = Number(Math.min(2.0, Math.max(1.4, totalDur * 0.14)).toFixed(2));
  const adjustedScenesTiming = [];
  adjustedScenesTiming.push({
    num: 0,
    id: '#scene-0',
    archetype: 'magnetic-cover-2s',
    start: 0,
    end: coverDur,
    isLast: false,
  });

  const remDur = Math.max(2, totalDur - coverDur);
  const origSpan = Math.max(1, Number(scenePlan[scenePlan.length - 1]?.endSec || totalDur));
  scenePlan.forEach((sc, idx) => {
    const rawS = Number(sc.startSec) || 0;
    const rawE = Number(sc.endSec) || totalDur;
    const mappedStart = idx === 0 ? coverDur : Number((coverDur + (rawS / origSpan) * remDur).toFixed(2));
    const mappedEnd =
      idx === scenePlan.length - 1
        ? Number(totalDur.toFixed(2))
        : Number(Math.max(mappedStart + 1.0, coverDur + (rawE / origSpan) * remDur).toFixed(2));
    adjustedScenesTiming.push({
      num: idx + 1,
      id: `#scene-${idx + 1}`,
      archetype: sc.archetype,
      start: mappedStart,
      end: mappedEnd,
      isLast: idx === scenePlan.length - 1,
    });
  });

  const scenesTimingJson = JSON.stringify(adjustedScenesTiming);

  const vozDataJson = JSON.stringify(timelineMap.vozData || []);

  return `<!doctype html>
<html lang="es" data-wappy-template="true" data-wappy-master-reel="true" data-aspect-ratio="${aspectRatio}" data-art-direction="${escapeHtml(rawTheme)}">
<head>
<meta charset="utf-8">
<title>WAPPY IA · Reel Dinámico Antigravity 60 FPS</title>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<script src="/assets/gsap.min.js"></script>
<script src="/assets/wappy/three.min.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@600;700;800&display=swap" rel="stylesheet">
<script id="wappy-beat-sync-helper">
  window.__wappyTimelineBeats = ${JSON.stringify(timelineMap.beats || [])};
  window.__wappyWordTimings = ${JSON.stringify(timelineMap.wordTimings || [])};
  window.VOZ = ${vozDataJson};
</script>
<style>
:root {
  --w-lime: ${customLime};
  --w-lime-glow: rgba(199, 243, 3, 0.45);
  --w-teal: #0d9488;
  --w-teal-bright: #2dd4bf;
  --w-cyan: #06b6d4;
  --w-cyan-bright: #22d3ee;
  --w-amber: #f59e0b;
  --w-red: #ef4444;
  --w-green: #22c55e;
  --w-bg-dark: ${bodyBgColor};
  --sans: 'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100vw; height: 100vh;
  overflow: hidden;
  background: ${hasBaseVideo ? 'transparent' : bodyBgColor};
  font-family: var(--sans);
  color: #fff;
  -webkit-font-smoothing: antialiased;
}

#viewport {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}

#stage {
  position: relative;
  width: ${stageW}px; height: ${stageH}px;
  overflow: hidden;
  background: ${hasBaseVideo ? 'transparent' : stageBgGradient};
  flex: none;
  perspective: 1400px;
  transform-origin: center center;
}

.bg-cyber-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, rgba(6, 182, 212, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20, 184, 166, 0.06) 1px, transparent 1px);
  background-size: 54px 54px;
  pointer-events: none;
  z-index: 1;
}

.ambient-orb {
  position: absolute; border-radius: 50%; pointer-events: none; z-index: 2;
}
.orb-teal {
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(13, 148, 136, 0.25) 0%, rgba(13, 148, 136, 0.10) 35%, rgba(13, 148, 136, 0.03) 55%, transparent 70%);
  top: 10%; left: -140px;
}
.orb-cyan {
  width: 650px; height: 650px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(6, 182, 212, 0.08) 35%, rgba(6, 182, 212, 0.02) 55%, transparent 70%);
  top: 35%; right: -140px;
}
.orb-lime {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(199, 243, 3, 0.18) 0%, rgba(199, 243, 3, 0.06) 35%, rgba(199, 243, 3, 0.02) 55%, transparent 70%);
  bottom: 20%; left: 100px;
}

#bg-radar {
  position: absolute; top: 36px; right: 44px; width: 116px; height: 116px;
  pointer-events: none; z-index: 20; opacity: 0.55;
}

.scanline-beam {
  position: absolute; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.25) 15%, #22d3ee 50%, rgba(199, 243, 3, 0.25) 85%, transparent 100%);
  box-shadow: 0 0 18px #22d3ee;
  pointer-events: none; z-index: 10;
}

#top-progress-bar {
  position: absolute; top: 0; left: 0; height: 8px; width: 0%;
  background: linear-gradient(90deg, var(--w-teal-bright) 0%, var(--w-cyan-bright) 50%, var(--w-lime) 100%);
  box-shadow: 0 0 16px var(--w-cyan-bright);
  z-index: 50;
}

.eq-container {
  position: absolute; top: 44px; left: 44px;
  display: flex; align-items: flex-end; gap: 6px; height: 32px;
  z-index: 20;
}
.eq-bar {
  width: 6px; border-radius: 3px; background: var(--w-cyan-bright);
  box-shadow: 0 0 8px var(--w-cyan-bright);
}

#digital-zoom-hud {
  position: absolute; inset: 0; pointer-events: none; z-index: 40;
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
}
.reticle-box { position: relative; width: 880px; height: 640px; }
.reticle-corner {
  position: absolute; width: 38px; height: 38px;
  border-color: var(--w-lime); filter: drop-shadow(0 0 10px var(--w-lime));
}
.rc-tl { top: 0; left: 0; border-top: 4px solid; border-left: 4px solid; }
.rc-tr { top: 0; right: 0; border-top: 4px solid; border-right: 4px solid; }
.rc-bl { bottom: 0; left: 0; border-bottom: 4px solid; border-left: 4px solid; }
.rc-br { bottom: 0; right: 0; border-bottom: 4px solid; border-right: 4px solid; }
.reticle-crosshair {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 42px; height: 42px;
}
.reticle-crosshair::before, .reticle-crosshair::after {
  content: ''; position: absolute; background: var(--w-lime);
}
.reticle-crosshair::before { top: 20px; left: 0; width: 42px; height: 2px; }
.reticle-crosshair::after { top: 0; left: 20px; width: 2px; height: 42px; }

.scene {
  position: absolute; inset: 0;
  opacity: 0; visibility: hidden;
  z-index: 5;
  transform-origin: center center;
}

/* TERCIO SUPERIOR (y: 40 - 300) — TIPOGRAFÍA GIGANTE MÓVIL XL */
.header-box {
  position: absolute; top: 40px; left: 40px; right: 40px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  z-index: 20;
}
.eyebrow-pill {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 10px 28px; border-radius: 9999px;
  font-family: var(--mono); font-size: 21px; font-weight: 800; letter-spacing: 0.12em;
  text-transform: uppercase;
  background: rgba(7, 13, 28, 0.92);
  border: 2px solid rgba(34, 211, 238, 0.55);
  color: var(--w-cyan-bright);
  box-shadow: 0 0 25px rgba(6, 182, 212, 0.28);
  margin-bottom: 12px;
}
.eyebrow-pill .dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--w-lime);
  box-shadow: 0 0 12px var(--w-lime);
}
.title-hero {
  font-size: 64px; font-weight: 900; line-height: 1.06;
  letter-spacing: -0.03em; color: #ffffff;
  max-width: min(1360px, 100%);
  text-shadow: 0 4px 22px rgba(0,0,0,0.85);
}
.hl-lime {
  display: inline-block; position: relative;
  background: var(--w-lime); color: #0e1300;
  padding: 3px 18px; border-radius: 18px;
  box-shadow: 0 0 35px rgba(199, 243, 3, 0.65);
}
.hl-cyan {
  display: inline-block; position: relative;
  background: linear-gradient(90deg, #06b6d4, #22d3ee); color: #020409;
  padding: 3px 18px; border-radius: 18px;
  box-shadow: 0 0 35px rgba(34, 211, 238, 0.65);
}
.hl-red {
  display: inline-block; position: relative;
  background: linear-gradient(90deg, #ef4444, #f97316); color: #ffffff;
  padding: 3px 18px; border-radius: 18px;
  box-shadow: 0 0 35px rgba(239, 68, 68, 0.65);
}
.sub-hero {
  font-size: 28px; font-weight: 700; line-height: 1.24;
  color: #e2e8f0; margin-top: 10px;
  max-width: min(1260px, 100%);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
}

/* TERCIO MEDIO — ESCENARIO DINÁMICO 60 FPS */
.middle-container {
  position: absolute; top: 265px; left: 40px; right: 40px; height: 845px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 15;
}
.hud-glass-pro {
  background: linear-gradient(145deg, rgba(10, 19, 40, 0.96) 0%, rgba(5, 10, 22, 0.96) 100%);
  border: 2px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  border-radius: 28px;
}
.corner-bracket {
  position: absolute; width: 24px; height: 24px;
  border-color: var(--w-cyan-bright); pointer-events: none;
  filter: drop-shadow(0 0 8px var(--w-cyan-bright));
}
.cb-tl { top: -2px; left: -2px; border-top: 3.5px solid; border-left: 3.5px solid; border-top-left-radius: 10px; }
.cb-tr { top: -2px; right: -2px; border-top: 3.5px solid; border-right: 3.5px solid; border-top-right-radius: 10px; }
.cb-bl { bottom: -2px; left: -2px; border-bottom: 3.5px solid; border-left: 3.5px solid; border-bottom-left-radius: 10px; }
.cb-br { bottom: -2px; right: -2px; border-bottom: 3.5px solid; border-right: 3.5px solid; border-bottom-right-radius: 10px; }

/* ARQUETIPO 1: HOOK VS + HEADLINE WALL */
.hook-box {
  width: min(1340px, 100%); display: flex; flex-direction: column; gap: 24px; margin-top: -16px;
}
.hook-card {
  padding: 28px 32px; border-radius: 28px;
  display: flex; align-items: center; gap: 26px; position: relative;
}
.hook-card-bad {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.24) 0%, rgba(15, 10, 20, 0.96) 100%);
  border: 2.5px solid rgba(239, 68, 68, 0.75);
  box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 35px rgba(239, 68, 68, 0.28);
}
.hook-card-good {
  background: linear-gradient(135deg, rgba(199, 243, 3, 0.22) 0%, rgba(7, 18, 28, 0.96) 100%);
  border: 3px solid var(--w-lime);
  box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 42px rgba(199, 243, 3, 0.32);
}
.hook-ico-box {
  width: 94px; height: 94px; border-radius: 24px;
  display: flex; align-items: center; justify-content: center; font-size: 48px;
  flex-shrink: 0;
}
.hook-text h3 { font-size: 36px; font-weight: 900; color: #fff; line-height: 1.1; }
.hook-text p { font-size: 25px; font-weight: 600; color: #e2e8f0; margin-top: 6px; line-height: 1.25; }
.hook-badge {
  margin-left: auto; padding: 12px 24px; border-radius: 999px;
  font-family: var(--mono); font-size: 21px; font-weight: 900; flex-shrink: 0;
}
.headline-wall-wrap {
  position: absolute; bottom: 16px; left: -40px; right: -40px;
  display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;
  transform: rotate(-1.5deg); z-index: 5; opacity: 0.92;
}
.headline-track {
  display: flex; gap: 24px; white-space: nowrap; font-family: var(--sans);
  font-size: 25px; font-weight: 900; text-transform: uppercase;
}
.headline-pill-lime {
  background: var(--w-lime); color: #0e1300; padding: 6px 22px; border-radius: 999px;
  box-shadow: 0 0 20px var(--w-lime-glow);
}
.headline-pill-dark {
  background: rgba(14, 19, 0, 0.92); color: #fff; padding: 6px 22px; border-radius: 999px;
  border: 2px solid var(--w-lime);
}

/* ARQUETIPO 2: IPHONE 3D SPLIT SHOWCASE */
.split-showcase {
  width: min(1340px, 100%); display: flex; align-items: center; justify-content: center; gap: 26px;
}
.iphone-frame {
  width: 400px; height: 745px; border-radius: 52px;
  background: #050a14; border: 5px solid #334155;
  box-shadow: 0 35px 80px rgba(0,0,0,0.92), 0 0 40px rgba(6, 182, 212, 0.35);
  position: relative; overflow: hidden; padding: 16px 14px;
  display: flex; flex-direction: column; flex-shrink: 0;
}
.dynamic-island {
  position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
  width: 160px; height: 34px; border-radius: 999px; background: #000;
  display: flex; align-items: center; justify-content: space-between; padding: 0 12px;
  border: 1.5px solid rgba(255,255,255,0.22); z-index: 30;
}
.island-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--w-lime); box-shadow: 0 0 8px var(--w-lime); }
.island-text { font-family: var(--mono); font-size: 12px; font-weight: 800; color: #fff; }
.iphone-screen {
  flex: 1; border-radius: 38px; background: linear-gradient(180deg, #070d1c 0%, #03060c 100%);
  border: 1px solid rgba(255,255,255,0.14); padding: 50px 14px 14px 14px;
  display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden;
}
.iphone-qr-box {
  background: #020611; border: 2.5px solid var(--w-teal-bright); border-radius: 22px;
  padding: 18px; display: flex; flex-direction: column; align-items: center;
  position: relative; box-shadow: 0 0 28px rgba(20, 184, 166, 0.35); overflow: hidden;
}
.qr-ico { font-size: 64px; line-height: 1; }
.qr-scan-line {
  position: absolute; left: 0; right: 0; height: 3px; background: var(--w-lime);
  box-shadow: 0 0 14px var(--w-lime); top: 10%;
}
.iphone-alert-pill {
  padding: 13px 16px; border-radius: 16px; background: rgba(199, 243, 3, 0.16);
  border: 1.5px solid var(--w-lime); font-size: 19px; font-weight: 800; color: #fff;
  display: flex; align-items: center; gap: 10px;
}
.side-cards-col {
  flex: 1; display: flex; flex-direction: column; gap: 20px;
}
.side-card {
  padding: 24px 26px; border-radius: 26px;
  background: rgba(7, 13, 28, 0.95);
  border: 2px solid rgba(34, 211, 238, 0.45);
  display: flex; align-items: center; gap: 20px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.75);
}
.side-card-ico {
  width: 72px; height: 72px; border-radius: 20px;
  display: flex; align-items: center; justify-content: center; font-size: 38px;
  flex-shrink: 0;
}
.side-card-text h4 { font-size: 30px; font-weight: 900; color: #fff; line-height: 1.1; }
.side-card-text p { font-size: 22px; font-weight: 700; color: #cbd5e1; margin-top: 5px; line-height: 1.2; }

/* ARQUETIPO 3: PAD DE FIRMAS DIGITALES SVG EN VIVO */
.sig-card {
  padding: 20px 24px; border-radius: 24px;
  background: rgba(7, 13, 28, 0.95);
  border: 2px solid rgba(45, 212, 191, 0.55);
  display: flex; flex-direction: column; gap: 10px;
  box-shadow: 0 16px 36px rgba(0,0,0,0.75);
}
.sig-header { display: flex; align-items: center; justify-content: space-between; }
.sig-role { font-size: 26px; font-weight: 900; color: #fff; display: flex; align-items: center; gap: 10px; }
.sig-status {
  padding: 6px 16px; border-radius: 999px;
  background: rgba(34, 197, 94, 0.22); border: 1.5px solid #22c55e;
  font-family: var(--mono); font-size: 17px; font-weight: 900; color: #4ade80;
}
.sig-pad-canvas {
  height: 76px; border-radius: 16px;
  background: rgba(2, 6, 14, 0.92);
  border: 1.5px dashed rgba(34, 211, 238, 0.45);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.sig-svg { width: 340px; height: 64px; }
.sig-path {
  fill: none; stroke: var(--w-lime); stroke-width: 4.5;
  stroke-linecap: round; stroke-linejoin: round;
  filter: drop-shadow(0 0 8px rgba(199, 243, 3, 0.6));
  stroke-dasharray: 420; stroke-dashoffset: 420;
}

/* ARQUETIPO 4: MOTOR ANALÍTICO & CHART GROW */
.formula-banner {
  width: min(1340px, 100%); padding: 18px 28px; border-radius: 22px;
  background: linear-gradient(90deg, rgba(6, 182, 212, 0.25) 0%, rgba(199, 243, 3, 0.22) 100%);
  border: 2px solid var(--w-cyan-bright);
  display: flex; align-items: center; justify-content: space-between;
  font-family: var(--mono); font-size: 25px; font-weight: 900; color: #fff;
  margin-bottom: 18px; box-shadow: 0 12px 30px rgba(0,0,0,0.7);
}
.risk-card {
  padding: 20px 24px; border-radius: 24px;
  background: rgba(7, 13, 28, 0.96);
  display: flex; flex-direction: column; gap: 10px;
  box-shadow: 0 16px 36px rgba(0,0,0,0.78);
}
.risk-top { display: flex; align-items: center; justify-content: space-between; }
.risk-title { font-size: 28px; font-weight: 900; color: #fff; }
.risk-nr-pill {
  padding: 6px 18px; border-radius: 999px;
  font-family: var(--mono); font-size: 22px; font-weight: 900;
}
.risk-sub { font-size: 21px; font-weight: 700; color: #cbd5e1; }
.risk-bar-bg {
  width: 100%; height: 16px; border-radius: 999px;
  background: rgba(255,255,255,0.12); overflow: hidden;
}
.risk-bar-fill { height: 100%; width: 0%; border-radius: 999px; }
.chart-bars-wrap {
  display: flex; align-items: flex-end; justify-content: center; gap: 10px; height: 140px;
  padding: 0 6px;
}
.chart-col {
  flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px;
}
.col-bar {
  width: 100%; height: 0%; border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, var(--w-lime) 0%, var(--w-teal) 100%);
  box-shadow: 0 0 16px rgba(199, 243, 3, 0.38);
  min-height: 4px;
}
.col-label { font-family: var(--mono); font-size: 16px; color: #e2e8f0; font-weight: 800; }

/* ARQUETIPO 5: PENTÁGONO ORBITAL CON RAYOS LÁSER */
.orbital-stage { position: relative; width: 1010px; height: 845px; }
.biocore-center {
  position: absolute; top: 435px; left: 505px;
  transform: translate(-50%, -50%);
  width: 326px; height: 326px; border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, #0d2b45 0%, #070d1c 75%, #050a14 100%);
  border: 4.5px solid var(--w-cyan-bright);
  outline: 3.5px solid rgba(199, 243, 3, 0.72);
  outline-offset: 10px;
  box-shadow: 0 0 65px rgba(34, 211, 238, 0.7), inset 0 0 40px rgba(34, 211, 238, 0.45);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 12; padding: 16px;
}
.biocore-fingerprint {
  font-size: 112px; line-height: 1;
  filter: drop-shadow(0 0 24px var(--w-cyan-bright));
  margin-bottom: 6px;
}
.biocore-label {
  font-family: var(--mono); font-size: 21px; font-weight: 900; color: var(--w-lime);
  letter-spacing: 0.04em; margin-top: 2px; white-space: nowrap;
}
.biocore-match {
  padding: 6px 20px; border-radius: 9999px; background: rgba(199, 243, 3, 0.25);
  border: 2px solid var(--w-lime); font-size: 23px; font-weight: 900; color: var(--w-lime);
  margin-top: 6px; white-space: nowrap;
}
.pulse-ring {
  position: absolute; border-radius: 50%; border: 2.5px dashed rgba(34, 211, 238, 0.38);
  pointer-events: none; top: 435px; left: 505px; transform: translate(-50%, -50%);
}
.ring-1 { width: 480px; height: 480px; }
.ring-2 { width: 730px; height: 730px; border-color: rgba(13, 148, 136, 0.35); }
.orbital-node {
  position: absolute; width: 380px; padding: 18px 22px; border-radius: 24px;
  background: rgba(7, 13, 28, 0.96);
  border: 2.5px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 18px 40px rgba(0,0,0,0.85), 0 0 28px rgba(6, 182, 212, 0.28);
  display: flex; align-items: center; gap: 16px;
  z-index: 15; transform: translate(-50%, -50%);
}
.node-ico {
  width: 64px; height: 64px; border-radius: 18px;
  display: flex; align-items: center; justify-content: center; font-size: 34px; flex-shrink: 0;
}
.node-title { font-size: 27px; font-weight: 900; color: #fff; line-height: 1.1; white-space: nowrap; }
.node-sub { font-size: 21px; font-weight: 700; color: #cbd5e1; margin-top: 4px; white-space: nowrap; }
.pos-node-1 { top: 85px;  left: 505px; border-color: rgba(45, 212, 191, 0.9); }
.pos-node-2 { top: 250px; left: 812px; border-color: rgba(34, 211, 238, 0.9); }
.pos-node-3 { top: 735px; left: 745px; border-color: rgba(245, 158, 11, 0.9); }
.pos-node-4 { top: 735px; left: 265px; border-color: rgba(239, 68, 68, 0.9); }
.pos-node-5 { top: 250px; left: 198px; border-color: rgba(199, 243, 3, 0.95); }
.laser-connections { position: absolute; inset: 0; pointer-events: none; z-index: 5; }

/* ARQUETIPO 6: TENSHI & ESPECIALISTAS GRID */
.especialistas-box {
  width: min(1340px, 100%); display: flex; flex-direction: column; gap: 20px; perspective: 1200px;
}
.tenshi-header-card {
  padding: 24px 30px; border-radius: 28px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.30) 0%, rgba(7, 13, 28, 0.96) 100%);
  border: 2.5px solid var(--w-cyan-bright);
  box-shadow: 0 0 40px rgba(6, 182, 212, 0.38);
  display: flex; align-items: center; gap: 24px; position: relative;
}
.tenshi-orb-img {
  width: 104px; height: 104px; border-radius: 50%;
  background: #000; border: 3px solid var(--w-cyan-bright);
  box-shadow: 0 0 32px var(--w-cyan-bright);
  display: flex; align-items: center; justify-content: center;
  overflow: visible; flex-shrink: 0; position: relative;
}
.tenshi-orb-img img {
  width: 108%; height: 108%; object-fit: contain;
  transform: translateY(-6px) scale(1.12);
  filter: drop-shadow(0 10px 18px rgba(0,0,0,0.8));
}
.tenshi-h-info h3 { font-size: 36px; font-weight: 900; color: #fff; line-height: 1.1; }
.tenshi-h-info p { font-size: 24px; font-weight: 700; color: var(--w-cyan-bright); margin-top: 5px; }
.spec-list-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.spec-item {
  padding: 22px 24px; border-radius: 24px;
  background: rgba(7, 13, 28, 0.94); border: 2px solid rgba(255, 255, 255, 0.18);
  display: flex; align-items: center; gap: 18px;
  box-shadow: 0 14px 34px rgba(0,0,0,0.65);
}
.spec-ico {
  width: 66px; height: 66px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; font-size: 34px; flex-shrink: 0;
}
.spec-text h4 { font-size: 28px; font-weight: 900; color: #fff; line-height: 1.1; }
.spec-text p { font-size: 21px; font-weight: 700; color: #cbd5e1; margin-top: 4px; }
.spec-cloud-tags { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; margin-top: 6px; }
.spec-pill-tag {
  padding: 10px 22px; border-radius: 9999px;
  background: rgba(13, 148, 136, 0.18); border: 1.5px solid rgba(45, 212, 191, 0.45);
  font-family: var(--mono); font-size: 20px; font-weight: 800; color: var(--w-teal-bright);
}

/* ARQUETIPO 7: CTA VIRAL CON BURBUJAS SOCIALES */
.cta-box {
  width: min(1320px, 100%); padding: 34px 40px; border-radius: 36px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  background: rgba(7, 13, 28, 0.96);
  border: 3px solid var(--w-lime);
  box-shadow: 0 35px 90px rgba(0, 0, 0, 0.92), 0 0 65px rgba(199, 243, 3, 0.35);
  position: relative;
}
.cta-header-line {
  font-family: var(--mono); font-size: 22px; font-weight: 800; color: var(--w-cyan-bright);
  letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px;
}
.cta-keyword-box {
  margin-top: 14px; width: 100%; padding: 24px; border-radius: 28px;
  background: rgba(14, 19, 0, 0.94); border: 2.5px solid var(--w-lime);
  box-shadow: 0 0 45px rgba(199, 243, 3, 0.35);
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.cta-instruction { font-size: 28px; font-weight: 800; color: #ffffff; }
.cta-keyword-pill {
  padding: 14px 60px; border-radius: 999px;
  background: var(--w-lime); color: #0e1300;
  font-size: 64px; font-weight: 900; letter-spacing: 0.08em;
  box-shadow: 0 16px 45px rgba(199, 243, 3, 0.7), 0 0 35px #fff;
  border: 3.5px solid #ffffff;
}
.cta-gift-pill {
  padding: 10px 26px; border-radius: 999px;
  background: rgba(13, 148, 136, 0.38); border: 2px solid var(--w-teal-bright);
  font-family: var(--mono); font-size: 20px; font-weight: 900; color: var(--w-teal-bright);
}
.social-comment-bubble {
  position: absolute; padding: 14px 24px; border-radius: 22px;
  background: rgba(15, 23, 42, 0.96); border: 2px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85), 0 0 22px rgba(199, 243, 3, 0.32);
  font-family: var(--sans); font-size: 23px; font-weight: 800; color: #ffffff;
  display: flex; align-items: center; gap: 12px; z-index: 30; pointer-events: none;
}
.social-comment-bubble .bubble-user {
  width: 34px; height: 34px; border-radius: 50%; background: var(--w-lime);
  display: flex; align-items: center; justify-content: center; font-size: 18px; color: #000;
}
.bubble-1 { top: 18px; left: 0px; }
.bubble-2 { bottom: 52px; left: 0px; }
.bubble-3 { top: 18px; right: 0px; }
.bubble-4 { bottom: 52px; right: 0px; }
.cta-btn-main {
  margin-top: 16px; padding: 14px 54px; border-radius: 9999px;
  background: linear-gradient(90deg, var(--w-teal-bright), var(--w-lime));
  border: 2.5px solid #ffffff;
  box-shadow: 0 16px 45px rgba(199, 243, 3, 0.5);
  font-size: 34px; font-weight: 900; color: #0e1300;
  display: flex; align-items: center; gap: 14px;
}

/* PORTADA MAGNÉTICA OFICIAL 0.00s - 2.00s (ESTILO REEL MATRIZ GTC 45 & PLATAFORMA 40S) */
#particles-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 2; opacity: 0.72;
}
#hud-top-bar {
  position: absolute; top: 14px; left: 40px; right: 40px; height: 36px;
  display: flex; align-items: center; justify-content: space-between;
  z-index: 35; pointer-events: none;
}
.hud-top-left {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(7, 13, 28, 0.85); border: 1.5px solid rgba(34, 211, 238, 0.45);
  padding: 4px 14px; border-radius: 999px;
  font-family: var(--mono); font-size: 13px; font-weight: 800; color: #e2e8f0;
}
.hud-top-right {
  font-family: var(--mono); font-size: 13px; font-weight: 900;
  color: var(--w-lime); background: rgba(14, 19, 0, 0.88);
  border: 1.5px solid var(--w-lime); padding: 4px 14px; border-radius: 999px;
}
.cover-layout {
  position: absolute; inset: 54px 38px 34px 38px;
  display: flex; flex-direction: column; align-items: center; justify-content: space-between;
  z-index: 25;
}
.cover-top-brand {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 10px 26px; border-radius: 999px;
  background: rgba(7, 13, 28, 0.94); border: 2px solid var(--w-lime);
  box-shadow: 0 0 28px rgba(199, 243, 3, 0.35);
}
.cover-logo-w { width: 32px; height: 32px; border-radius: 8px; object-fit: contain; }
.cover-brand-text {
  font-family: var(--mono); font-size: 20px; font-weight: 900;
  color: var(--w-lime); letter-spacing: 0.08em; text-transform: uppercase;
}
.cover-title-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
}
.cover-t-line1 {
  font-size: 54px; font-weight: 900; color: #ffffff; letter-spacing: -0.03em;
  text-shadow: 0 6px 24px rgba(0,0,0,0.85); line-height: 1.02;
}
.cover-t-row {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 16px;
}
.hl-red-tilted {
  display: inline-block; padding: 6px 24px; border-radius: 18px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff;
  font-size: 54px; font-weight: 900; border: 2.5px solid #fca5a5;
  transform: rotate(-1.5deg); box-shadow: 0 12px 32px rgba(239, 68, 68, 0.55);
}
.hl-lime-tilted {
  display: inline-block; padding: 6px 24px; border-radius: 18px;
  background: var(--w-lime); color: #0e1300;
  font-size: 54px; font-weight: 900; border: 2.5px solid #ffffff;
  transform: rotate(1.2deg); box-shadow: 0 12px 36px rgba(199, 243, 3, 0.65);
}
.cover-hero-stage {
  width: min(1000px, 100%); display: flex; align-items: center; justify-content: center; gap: 28px;
  margin: 6px 0;
}
.cover-avatar-card {
  position: relative; width: 410px; height: 520px;
  border-radius: 34px; background: radial-gradient(circle at 50% 38%, rgba(34,211,238,0.26), rgba(7,13,28,0.95) 72%);
  border: 2.5px solid rgba(199, 243, 3, 0.78);
  box-shadow: 0 28px 65px rgba(0,0,0,0.88), 0 0 42px rgba(199, 243, 3, 0.28);
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  overflow: hidden; padding-bottom: 14px;
}
.cover-avatar-aura {
  position: absolute; width: 320px; height: 320px; border-radius: 50%;
  background: radial-gradient(circle, rgba(199,243,3,0.34) 0%, transparent 70%);
  top: 45px; left: 50%; transform: translateX(-50%); pointer-events: none;
}
.cover-avatar-img {
  width: 94%; height: 88%; object-fit: contain; object-position: bottom center;
  filter: drop-shadow(0 16px 28px rgba(0,0,0,0.85)); z-index: 2;
}
.cover-avatar-tag {
  z-index: 3; margin-top: -12px; padding: 7px 18px; border-radius: 999px;
  background: rgba(5, 10, 20, 0.94); border: 1.5px solid var(--w-cyan-bright);
  font-family: var(--mono); font-size: 14px; font-weight: 900; color: #fff;
  display: inline-flex; align-items: center; gap: 8px;
}
.dot-live {
  width: 9px; height: 9px; border-radius: 50%; background: var(--w-lime);
  box-shadow: 0 0 10px var(--w-lime);
}
.cover-iphone-tilted {
  width: 350px; height: 540px; border-radius: 44px;
  background: #050a14; border: 4.5px solid #38bdf8;
  box-shadow: 0 32px 75px rgba(0,0,0,0.92), 0 0 42px rgba(34, 211, 238, 0.38);
  position: relative; overflow: hidden; padding: 14px 12px;
  display: flex; flex-direction: column; transform: rotate(3.5deg);
}
.iphone-ui-real {
  flex: 1; border-radius: 32px; background: linear-gradient(180deg, #081226 0%, #030711 100%);
  border: 1px solid rgba(255,255,255,0.16); padding: 42px 12px 12px 12px;
  display: flex; flex-direction: column; gap: 10px; justify-content: space-between;
}
.ui-app-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; border-radius: 12px; background: rgba(255,255,255,0.06);
}
.ui-live-pill {
  padding: 3px 10px; border-radius: 999px; background: rgba(199, 243, 3, 0.22);
  border: 1px solid var(--w-lime); font-family: var(--mono); font-size: 11px; font-weight: 900; color: var(--w-lime);
}
.ui-kpi-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.ui-kpi-mini {
  background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(34,211,238,0.35);
  border-radius: 10px; padding: 6px 4px; text-align: center; display: flex; flex-direction: column;
}
.ui-kpi-mini .k-val { font-family: var(--mono); font-size: 14px; font-weight: 900; }
.ui-kpi-mini .k-lbl { font-size: 10px; font-weight: 700; color: #94a3b8; }
.ui-matrix-rows { display: flex; flex-direction: column; gap: 8px; }
.ui-m-row {
  background: rgba(10, 19, 38, 0.95); border-radius: 10px; padding: 8px 10px;
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
}
.ui-m-txt { display: flex; flex-direction: column; text-align: left; }
.ui-m-txt strong { font-size: 13px; font-weight: 800; color: #fff; line-height: 1.1; }
.ui-m-txt span { font-size: 11px; color: #94a3b8; }
.ui-m-badge {
  padding: 3px 8px; border-radius: 6px; font-family: var(--mono); font-size: 10px; font-weight: 900;
}
.ui-tenshi-bar {
  display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 12px;
  background: linear-gradient(90deg, rgba(13,148,136,0.32), rgba(6,182,212,0.22));
  border: 1px solid var(--w-cyan-bright); font-size: 12px; font-weight: 800; color: #e2e8f0;
}
.cover-badges-row {
  width: min(980px, 100%); display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}
.cover-glass-badge {
  padding: 16px 18px; border-radius: 22px;
  background: rgba(7, 13, 28, 0.94); border: 2px solid rgba(34, 211, 238, 0.55);
  box-shadow: 0 14px 32px rgba(0,0,0,0.75);
  display: flex; align-items: center; gap: 12px;
  font-size: 21px; font-weight: 800; color: #fff;
}
.cgb-ico { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.cover-footer-bar {
  display: inline-flex; align-items: center; gap: 16px;
  padding: 10px 34px; border-radius: 999px;
  background: rgba(14, 19, 0, 0.95); border: 2.5px solid var(--w-lime);
  box-shadow: 0 0 32px rgba(199, 243, 3, 0.4);
  font-family: var(--mono); font-size: 22px; font-weight: 900;
}
.cf-domain { color: #ffffff; }
.cf-sep { color: var(--w-cyan-bright); }
.cf-cta { color: var(--w-lime); }

.vs-badge-circle {
  align-self: center; margin: -18px 0; z-index: 25;
  width: 64px; height: 64px; border-radius: 50%;
  background: radial-gradient(circle, #c7f303 0%, #84cc16 100%);
  color: #0e1300; font-family: var(--mono); font-size: 24px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  border: 3px solid #ffffff; box-shadow: 0 0 28px rgba(199, 243, 3, 0.8);
}
.tenshi-terminal-strip {
  padding: 16px 22px; border-radius: 22px;
  background: rgba(7, 16, 32, 0.95); border: 2px solid rgba(45, 212, 191, 0.65);
  display: flex; align-items: center; gap: 16px;
}
.tt-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: contain; border: 2px solid var(--w-cyan-bright); background: #000; }
.tt-body { flex: 1; text-align: left; }
.tt-label { font-family: var(--mono); font-size: 14px; font-weight: 900; color: var(--w-cyan-bright); letter-spacing: 0.08em; }
.tt-text { font-size: 21px; font-weight: 700; color: #f1f5f9; margin-top: 2px; }
.tt-status {
  padding: 6px 14px; border-radius: 999px; background: rgba(199,243,3,0.2);
  border: 1.5px solid var(--w-lime); font-family: var(--mono); font-size: 15px; font-weight: 900; color: var(--w-lime);
}
.pill-svg-wrap { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* ESQUINA SEGURA INFERIOR DERECHA — AVATAR 3D PRESENTADOR (NUNCA TAPA EL CENTRO NI USA FILLRECT) */
#avatar-host-container {
  position: absolute;
  left: auto;
  right: 26px;
  bottom: 24px;
  top: auto;
  transform: none;
  width: 285px;
  height: 325px;
  pointer-events: none;
  z-index: 28;
  background: transparent;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.avatar-3d-dock {
  position: relative; width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
}
.avatar-voice-halo {
  position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%);
  width: 230px; height: 230px; border-radius: 50%;
  background: radial-gradient(circle, rgba(199,243,3,0.32) 0%, rgba(34,211,238,0.18) 52%, transparent 72%);
  border: 2.5px solid rgba(199, 243, 3, 0.65);
  box-shadow: 0 0 36px rgba(199, 243, 3, 0.45);
  pointer-events: none; z-index: 1;
}
.avatar-render-layer {
  position: relative; width: 265px; height: 295px; z-index: 2;
  display: flex; align-items: flex-end; justify-content: center;
}
.avatar-render-img {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; height: 100%; object-fit: contain; object-position: bottom center;
  filter: drop-shadow(0 14px 24px rgba(0,0,0,0.88));
  transition: opacity 0.22s ease;
}
.avatar-dock-pill {
  position: relative; z-index: 4; margin-top: -8px;
  padding: 5px 16px; border-radius: 999px;
  background: rgba(5, 10, 22, 0.95); border: 1.5px solid var(--w-lime);
  font-family: var(--mono); font-size: 13px; font-weight: 900; color: var(--w-lime);
  box-shadow: 0 6px 18px rgba(0,0,0,0.85);
  display: inline-flex; align-items: center; gap: 6px;
}

/* ADAPTACIÓN HORIZONTAL 16:9 (1920x1080) */
html[data-aspect-ratio="16:9"] .header-box {
  top: 42px; left: 60px; right: 380px; align-items: flex-start; text-align: left;
}
html[data-aspect-ratio="16:9"] .title-hero {
  font-size: 52px; max-width: 1380px;
}
html[data-aspect-ratio="16:9"] .sub-hero {
  font-size: 24px; max-width: 1320px; -webkit-line-clamp: 1;
}
html[data-aspect-ratio="16:9"] .middle-container {
  top: 220px; left: 60px; right: 380px; height: 800px;
}
html[data-aspect-ratio="16:9"] .cover-layout {
  inset: 52px 60px 28px 60px;
}
html[data-aspect-ratio="16:9"] .cover-hero-stage {
  gap: 44px; transform: scale(0.84); margin: -24px 0;
}
html[data-aspect-ratio="16:9"] #avatar-host-container {
  left: auto; right: 28px; bottom: 24px; top: auto; transform: none; width: 310px; height: 355px;
}
${customCssBlock}
</style>
</head>
<body>
<div id="viewport">
  <div id="stage" data-wappy-master-reel="true" data-aspect-ratio="${aspectRatio}">
    ${hasBaseVideo ? '' : '<div class="bg-cyber-grid"></div><canvas id="particles-canvas"></canvas><div class="ambient-orb orb-teal"></div><div class="ambient-orb orb-cyan"></div><div class="ambient-orb orb-lime"></div>'}
    <div id="top-progress-bar"></div>
    <div id="hud-top-bar">
      <div class="hud-top-left">
        <span class="dot-live"></span>
        <span>ECOSISTEMA IA · SG-SST</span>
      </div>
      <div class="hud-top-right">WAPPY.CLUB</div>
    </div>
    <div class="scanline-beam" id="scanline"></div>

    <div class="eq-container">
      <div class="eq-bar" id="eq1" style="height: 14px;"></div>
      <div class="eq-bar" id="eq2" style="height: 22px;"></div>
      <div class="eq-bar" id="eq3" style="height: 18px;"></div>
      <div class="eq-bar" id="eq4" style="height: 26px;"></div>
    </div>

    <svg id="bg-radar" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke="#22d3ee" stroke-width="1.5" stroke-dasharray="4 3"/>
      <circle cx="50" cy="50" r="32" stroke="#2dd4bf" stroke-width="1" stroke-dasharray="2 2"/>
      <circle cx="50" cy="50" r="16" stroke="#c7f303" stroke-width="1"/>
      <line x1="50" y1="4" x2="50" y2="96" stroke="#22d3ee" stroke-width="0.8" opacity="0.4"/>
      <line x1="4" y1="50" x2="96" y2="50" stroke="#22d3ee" stroke-width="0.8" opacity="0.4"/>
      <line id="radar-sweep" x1="50" y1="50" x2="50" y2="6" stroke="#c7f303" stroke-width="2.5" stroke-linecap="round" style="transform-origin: 50px 50px;"/>
    </svg>

    <div id="digital-zoom-hud">
      <div class="reticle-box">
        <div class="reticle-corner rc-tl"></div>
        <div class="reticle-corner rc-tr"></div>
        <div class="reticle-corner rc-bl"></div>
        <div class="reticle-corner rc-br"></div>
        <div class="reticle-crosshair"></div>
      </div>
    </div>

    ${scenesMarkup}

    <div id="avatar-host-container"></div>
  </div>
</div>

<script id="wappy-voxel-avatar-engine">
${voxelAvatarJs}
</script>

<script id="wappy-antigravity-master-60fps">
(function() {
  'use strict';

  function clamp(v, min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 1;
    return Math.max(min, Math.min(max, v));
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var E = {
    lin: function(t) { return t; },
    out3: function(t) { return 1 - Math.pow(1 - t, 3); },
    in3: function(t) { return t * t * t; },
    io3: function(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    spring: function(t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      var c1 = 1.28;
      var c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
  };

  var STAGE_W = ${stageW};
  var STAGE_H = ${stageH};

  // Constelación de partículas conectadas estilo WAPPY_IA_Plataforma_40s_SinSubtitulos
  var pCanvas = document.getElementById('particles-canvas');
  var pCtx = pCanvas ? pCanvas.getContext('2d') : null;
  var particles = [];
  if (pCanvas) {
    pCanvas.width = STAGE_W;
    pCanvas.height = STAGE_H;
    for (var pi = 0; pi < 56; pi++) {
      particles.push({
        x: ((pi * 197) % STAGE_W),
        y: ((pi * 311) % STAGE_H),
        vx: ((pi % 2 === 0 ? 1 : -1) * (14 + (pi % 15))),
        vy: ((pi % 3 === 0 ? -1 : 1) * (10 + (pi % 12))),
        r: 2 + (pi % 3),
        lime: pi % 3 === 0
      });
    }
  }
  function renderConstellationAt(t) {
    if (!pCtx || !pCanvas) return;
    pCtx.clearRect(0, 0, STAGE_W, STAGE_H);
    var pos = [];
    for (var i = 0; i < particles.length; i++) {
      var pt = particles[i];
      var px = (pt.x + pt.vx * t) % STAGE_W;
      var py = (pt.y + pt.vy * t) % STAGE_H;
      if (px < 0) px += STAGE_W;
      if (py < 0) py += STAGE_H;
      pos.push({ x: px, y: py, r: pt.r, lime: pt.lime });
      pCtx.beginPath();
      pCtx.arc(px, py, pt.r, 0, Math.PI * 2);
      pCtx.fillStyle = pt.lime ? 'rgba(199, 243, 3, 0.65)' : 'rgba(34, 211, 238, 0.55)';
      pCtx.fill();
    }
    pCtx.lineWidth = 1.2;
    for (var a = 0; a < pos.length; a++) {
      for (var b = a + 1; b < pos.length; b++) {
        var dx = pos[a].x - pos[b].x;
        var dy = pos[a].y - pos[b].y;
        var distSq = dx * dx + dy * dy;
        if (distSq < 26000) {
          var alpha = (1 - distSq / 26000) * 0.24;
          pCtx.strokeStyle = 'rgba(34, 211, 238, ' + alpha.toFixed(3) + ')';
          pCtx.beginPath();
          pCtx.moveTo(pos[a].x, pos[a].y);
          pCtx.lineTo(pos[b].x, pos[b].y);
          pCtx.stroke();
        }
      }
    }
  }

  // Escalar el escenario automáticamente al viewport de cualquier pantalla o iframe sin franjas negras
  function fitStageToViewport() {
    var vp = document.getElementById('viewport');
    var st = document.getElementById('stage');
    if (!vp || !st) return;
    var w = vp.clientWidth || window.innerWidth || STAGE_W;
    var h = vp.clientHeight || window.innerHeight || STAGE_H;
    var vpRatio = w / Math.max(1, h);
    var baseRatio = STAGE_W / STAGE_H;
    st.style.scale = '';
    if (STAGE_H > STAGE_W && vpRatio > baseRatio * 1.02) {
      var adaptH = vpRatio > 0.78 ? 1640 : 1760;
      var adaptW = Math.max(STAGE_W, Math.round(adaptH * vpRatio));
      st.style.width = adaptW + 'px';
      st.style.height = adaptH + 'px';
      var sAdapt = h / adaptH;
      st.style.transform = 'scale(' + sAdapt.toFixed(5) + ')';
    } else if (vpRatio > baseRatio * 1.01) {
      var dynW = Math.round(STAGE_H * vpRatio);
      st.style.width = dynW + 'px';
      st.style.height = STAGE_H + 'px';
      var sH = h / STAGE_H;
      st.style.transform = 'scale(' + sH.toFixed(5) + ')';
    } else if (vpRatio < baseRatio * 0.99) {
      var dynH = Math.round(STAGE_W / Math.max(0.1, vpRatio));
      st.style.width = STAGE_W + 'px';
      st.style.height = dynH + 'px';
      var sW = w / STAGE_W;
      st.style.transform = 'scale(' + sW.toFixed(5) + ')';
    } else {
      st.style.width = STAGE_W + 'px';
      st.style.height = STAGE_H + 'px';
      var scale = Math.min(w / STAGE_W, h / STAGE_H);
      st.style.transform = 'scale(' + scale.toFixed(5) + ')';
    }
  }
  window.addEventListener('resize', fitStageToViewport);
  fitStageToViewport();

  var TOTAL_DUR = ${totalDur};
  var scenes = ${scenesTimingJson};
  var vozData = window.VOZ || [];

  // Inicializar Avatar 3D de Alta Resolución del Brandbook en #avatar-host-container (CERO muñecos 2D fillRect)
  var avatarHost = document.getElementById('avatar-host-container');
  var avatarHaloEl = null;
  var avatarRenderLayer = null;
  var imgTalkEl = null;
  var imgPointEl = null;

  function initAvatar3D() {
    if (!avatarHost) return;
    avatarHost.innerHTML =
      '<div class="avatar-3d-dock">' +
        '<div class="avatar-voice-halo" id="avatar-voice-ring"></div>' +
        '<div class="avatar-render-layer" id="avatar-render-layer">' +
          '<img id="avatar-img-talk" class="avatar-render-img" src="/assets/brandbook/avatar2_mauricio_camisa_cuadros_amarilla.png" alt="Avatar 3D">' +
          '<img id="avatar-img-point" class="avatar-render-img" src="/assets/brandbook/avatar_mauricio_voxel_cuerpo_completo.png" alt="Avatar Voxel 3D" style="opacity:0;">' +
        '</div>' +
        '<div class="avatar-dock-pill"><span class="dot-live"></span> AVATAR 3D · IA</div>' +
      '</div>';
    avatarHaloEl = document.getElementById('avatar-voice-ring');
    avatarRenderLayer = document.getElementById('avatar-render-layer');
    imgTalkEl = document.getElementById('avatar-img-talk');
    imgPointEl = document.getElementById('avatar-img-point');
  }
  initAvatar3D();

  // Si hay un elemento <audio id="wappy-capsule-audio"> con WAV en Base64, extraer automáticamente la envolvente PCM16 a 60 FPS y las pausas de silencio reales
  function analyzeEmbeddedWavIfNeeded() {
    if (vozData && vozData.length > 30) return;
    var audioEl = document.getElementById('wappy-capsule-audio');
    if (!audioEl || !audioEl.src || audioEl.src.indexOf('data:audio/wav;base64,') !== 0) return;
    try {
      var b64 = audioEl.src.split(',')[1];
      var bin = atob(b64);
      var len = bin.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
      var view = new DataView(bytes.buffer);
      var numCh = view.getUint16(22, true) || 1;
      var sRate = view.getUint32(24, true) || 24000;
      var bits = view.getUint16(34, true) || 16;
      var bps = Math.max(2, Math.floor(bits / 8));
      var dataOff = 44;
      var dataLen = len - 44;
      var totalS = Math.floor(dataLen / (numCh * bps));
      var realDur = totalS / sRate;
      if (realDur > 1.5) TOTAL_DUR = realDur;

      var fps = 60;
      var totF = Math.ceil(realDur * fps);
      var spf = Math.max(1, Math.floor(sRate / fps));
      var rmsArr = new Array(totF);
      var maxR = 0.01;
      for (var f = 0; f < totF; f++) {
        var s0 = f * spf;
        var s1 = Math.min(totalS, s0 + spf);
        var sum = 0, cnt = 0;
        for (var s = s0; s < s1; s += 2) {
          var idx = dataOff + s * numCh * bps;
          if (idx + 1 < len) {
            var v = view.getInt16(idx, true) / 32768;
            sum += v * v;
            cnt++;
          }
        }
        var r = cnt > 0 ? Math.sqrt(sum / cnt) : 0;
        if (r > maxR) maxR = r;
        rmsArr[f] = r;
      }
      vozData = rmsArr.map(function(v) { return Math.min(1, v / (maxR * 0.65)); });
      window.VOZ = vozData;
    } catch (e) {}
  }
  window.addEventListener('DOMContentLoaded', analyzeEmbeddedWavIfNeeded);
  setTimeout(analyzeEmbeddedWavIfNeeded, 80);

  function getVoiceLevel(t) {
    if (vozData && vozData.length > 0) {
      var idx = Math.min(Math.max(0, Math.floor(t * 60)), vozData.length - 1);
      return vozData[idx] || 0;
    }
    if (window.__wappyVoicePlaying === false) return 0;
    return 0.28 + 0.45 * Math.abs(Math.sin(t * 14.5) * Math.cos(t * 6.2));
  }

  function isPointingMoment(t, activeSceneIdx) {
    if (activeSceneIdx <= 0 || activeSceneIdx >= scenes.length) return false;
    var sc = scenes[activeSceneIdx];
    var dt = t - sc.start;
    return dt >= 0.45 && dt <= Math.min(sc.end - sc.start - 0.3, 3.6);
  }

  function updateAvatarAt(t, activeSceneIdx) {
    if (!avatarHost) return;
    var coverEnd = scenes[0] && scenes[0].archetype === 'magnetic-cover-2s' ? scenes[0].end : 0;
    // Durante la Portada Magnética (0..coverEnd) el Avatar grande ya está en el escenario central (#scene-0)
    if (t < coverEnd - 0.18) {
      avatarHost.style.opacity = '0';
      return;
    }
    var nv = getVoiceLevel(t);
    var isTalking = nv > 0.045;
    var isPointing = isPointingMoment(t, activeSceneIdx);
    var pEnter = clamp((t - (coverEnd - 0.18)) / 0.45);
    var spEnter = E.spring(pEnter);

    var floatY = Math.sin(t * 3.4) * 5.5 - (isTalking ? nv * 6 : 0);
    var tiltDeg = Math.sin(t * 2.1) * 1.8 + (isPointing ? -2.2 : 0);
    var talkScale = 1 + (isTalking ? nv * 0.045 : 0);

    avatarHost.style.opacity = clamp(pEnter * 1.8).toFixed(3);
    avatarHost.style.transform =
      'translateY(' + ((1 - spEnter) * 45 + floatY).toFixed(1) + 'px) scale(' + (lerp(0.85, 1, spEnter) * talkScale).toFixed(4) + ')';

    if (avatarRenderLayer) {
      avatarRenderLayer.style.transform = 'rotate(' + tiltDeg.toFixed(2) + 'deg)';
    }
    if (avatarHaloEl) {
      var hScale = 0.94 + nv * 0.26 + Math.sin(t * 5) * 0.04;
      avatarHaloEl.style.transform = 'translateX(-50%) scale(' + hScale.toFixed(3) + ')';
      avatarHaloEl.style.borderColor = isTalking ? '#c7f303' : '#22d3ee';
    }
    if (imgTalkEl && imgPointEl) {
      imgTalkEl.style.opacity = isPointing ? '0' : '1';
      imgPointEl.style.opacity = isPointing ? '1' : '0';
    }
  }

  function renderFrame(t) {
    var safeT = clamp(t, 0, TOTAL_DUR);

    // 0. Constelación de partículas 60 FPS
    renderConstellationAt(safeT);

    // 1. Barra de progreso superior
    var pBar = document.getElementById('top-progress-bar');
    if (pBar) pBar.style.width = Math.min(100, (safeT / TOTAL_DUR) * 100).toFixed(2) + '%';

    // 2. Haz láser de escaneo vertical
    var scanline = document.getElementById('scanline');
    if (scanline) {
      var scanPos = (safeT % 3.8) / 3.8;
      scanline.style.top = (scanPos * 100).toFixed(1) + '%';
      scanline.style.opacity = (Math.sin(scanPos * Math.PI) * 0.65).toFixed(2);
    }

    // 3. Radar holográfico giratorio
    var sweep = document.getElementById('radar-sweep');
    if (sweep) {
      var deg = (safeT * 65) % 360;
      sweep.style.transform = 'rotate(' + deg.toFixed(1) + 'deg)';
    }

    // 4. Ecualizador reactivo a la voz
    var nv = getVoiceLevel(safeT);
    var eq1 = document.getElementById('eq1');
    var eq2 = document.getElementById('eq2');
    var eq3 = document.getElementById('eq3');
    var eq4 = document.getElementById('eq4');
    if (eq1) eq1.style.height = (8 + nv * 22).toFixed(1) + 'px';
    if (eq2) eq2.style.height = (12 + nv * 28).toFixed(1) + 'px';
    if (eq3) eq3.style.height = (10 + nv * 24).toFixed(1) + 'px';
    if (eq4) eq4.style.height = (14 + nv * 26).toFixed(1) + 'px';

    // 5. Retícula Digital Zoom HUD en el arranque y en cambios clave
    var zoomHud = document.getElementById('digital-zoom-hud');
    if (zoomHud) {
      if (safeT < 1.45) {
        var pz = clamp(safeT / 1.45);
        zoomHud.style.opacity = (1 - E.io3(pz)).toFixed(2);
        var sHud = 1.14 - E.out3(pz) * 0.14;
        zoomHud.style.transform = 'scale(' + sHud.toFixed(3) + ')';
      } else {
        zoomHud.style.opacity = '0';
      }
    }

    // 6. Coreografía 60 FPS por Escena
    var activeSceneIdx = 0;
    for (var i = 0; i < scenes.length; i++) {
      var sc = scenes[i];
      var el = document.querySelector(sc.id);
      if (!el) continue;

      var inWindow = (safeT >= sc.start && (safeT < sc.end || (sc.isLast && safeT <= TOTAL_DUR + 0.5)));
      if (inWindow) {
        activeSceneIdx = i;
        el.style.visibility = 'visible';
        var dt = Math.max(0, safeT - sc.start);
        var num = sc.num;

        var op = 1;
        var sceneScale = 1;
        if (i > 0 && dt < 0.34) {
          var inP = E.out3(dt / 0.34);
          op = inP;
          sceneScale = lerp(0.94, 1.0, inP);
        } else if (!sc.isLast && safeT > sc.end - 0.34) {
          var outP = E.in3((safeT - (sc.end - 0.34)) / 0.34);
          sceneScale = 1 + outP * (sc.archetype === 'magnetic-cover-2s' ? 0.55 : 0.28); // Transición Zoom-Through
          op = 1 - outP;
        }
        el.style.opacity = clamp(op).toFixed(3);
        el.style.transform = Math.abs(sceneScale - 1) > 0.002 ? 'scale(' + sceneScale.toFixed(3) + ')' : 'none';

        if (sc.archetype === 'magnetic-cover-2s') {
          var s0Hero = document.getElementById('s0-hero');
          var s0Badges = document.getElementById('s0-badges');
          if (s0Hero) {
            var floatCover = Math.sin(safeT * 3.2) * 5;
            s0Hero.style.transform = 'translateY(' + floatCover.toFixed(1) + 'px)';
          }
          if (s0Badges) {
            var pB = clamp(dt / 0.38);
            s0Badges.style.transform = 'scale(' + lerp(0.94, 1.0, E.out3(pB)).toFixed(3) + ')';
          }
          continue;
        }

        // Animación del Header de la escena
        var hBox = document.getElementById('s' + num + '-header');
        if (hBox) {
          var pH = clamp(dt / 0.45);
          hBox.style.opacity = clamp(pH * 1.8).toFixed(2);
          hBox.style.transform = 'translateY(' + ((1 - E.spring(pH)) * -42).toFixed(1) + 'px)';
        }

        if (sc.archetype === 'hook-vs-wall') {
          var c1 = document.getElementById('s' + num + '-card-1');
          var c2 = document.getElementById('s' + num + '-card-2');
          var trk = document.getElementById('s' + num + '-track');
          if (trk) trk.style.transform = 'translateX(-' + ((safeT * 68) % 620).toFixed(1) + 'px)';

          var p1 = clamp((dt - 0.08) / 0.55);
          if (c1) {
            c1.style.opacity = clamp(p1 * 2.2).toFixed(2);
            c1.style.transform = 'translateX(' + ((1 - E.spring(p1)) * -360).toFixed(1) + 'px)';
          }
          var p2 = clamp((dt - 0.38) / 0.58);
          if (c2) {
            c2.style.opacity = clamp(p2 * 2.2).toFixed(2);
            c2.style.transform = 'translateX(' + ((1 - E.spring(p2)) * 360).toFixed(1) + 'px)';
          }
        }

        else if (sc.archetype === 'iphone-split-showcase') {
          var ph = document.getElementById('s' + num + '-phone');
          var las = document.getElementById('s' + num + '-laser');
          var pPh = clamp(dt / 0.60);
          if (ph) {
            ph.style.opacity = clamp(pPh * 2.2).toFixed(2);
            ph.style.transform = 'scale(' + E.spring(pPh).toFixed(3) + ')';
          }
          if (las) {
            var lPos = (safeT * 0.95) % 1.0;
            las.style.top = (lPos * 100).toFixed(1) + '%';
          }
          for (var ppI = 1; ppI <= 4; ppI++) {
            var ppEl = document.getElementById('s' + num + '-pp-' + ppI);
            if (ppEl) {
              var pP = clamp((dt - (0.18 + ppI * 0.14)) / 0.45);
              ppEl.style.opacity = clamp(pP * 2).toFixed(2);
              ppEl.style.transform = 'translateY(' + ((1 - E.spring(pP)) * 35).toFixed(1) + 'px)';
            }
          }
          for (var scI2 = 1; scI2 <= 3; scI2++) {
            var scCard = document.getElementById('s' + num + '-sc-' + scI2);
            if (scCard) {
              var pSc = clamp((dt - (0.20 + (scI2 - 1) * 0.22)) / 0.55);
              scCard.style.opacity = clamp(pSc * 2.2).toFixed(2);
              scCard.style.transform = 'translateX(' + ((1 - E.spring(pSc)) * 250).toFixed(1) + 'px)';
            }
          }
        }

        else if (sc.archetype === 'signature-pad-live') {
          var phS = document.getElementById('s' + num + '-phone');
          var lasS = document.getElementById('s' + num + '-laser');
          var pPhS = clamp(dt / 0.58);
          if (phS) {
            phS.style.opacity = clamp(pPhS * 2.2).toFixed(2);
            phS.style.transform = 'scale(' + E.spring(pPhS).toFixed(3) + ')';
          }
          if (lasS) {
            lasS.style.top = (((safeT * 0.9) % 1.0) * 100).toFixed(1) + '%';
          }
          for (var sgI = 1; sgI <= 3; sgI++) {
            var sgCard = document.getElementById('s' + num + '-sig-' + sgI);
            var sgPath = document.getElementById('s' + num + '-sigpath-' + sgI);
            var dly = 0.18 + (sgI - 1) * 0.28;
            var pSg = clamp((dt - dly) / 0.52);
            if (sgCard) {
              sgCard.style.opacity = clamp(pSg * 2.2).toFixed(2);
              sgCard.style.transform = 'translateX(' + ((1 - E.spring(pSg)) * 230).toFixed(1) + 'px)';
            }
            if (sgPath) {
              var pDraw = E.io3(clamp((dt - (dly + 0.25)) / 0.95));
              sgPath.style.strokeDashoffset = (420 * (1 - pDraw)).toFixed(1);
            }
          }
        }

        else if (sc.archetype === 'chart-grow-math') {
          var formEl = document.getElementById('s' + num + '-formula');
          var phC = document.getElementById('s' + num + '-phone');
          var lasC = document.getElementById('s' + num + '-laser');
          if (formEl) {
            var pFm = clamp(dt / 0.50);
            formEl.style.opacity = clamp(pFm * 2).toFixed(2);
            formEl.style.transform = 'scale(' + E.spring(pFm).toFixed(3) + ')';
          }
          if (phC) {
            var pPhC = clamp((dt - 0.1) / 0.55);
            phC.style.opacity = clamp(pPhC * 2.2).toFixed(2);
            phC.style.transform = 'scale(' + E.spring(pPhC).toFixed(3) + ')';
          }
          if (lasC) {
            lasC.style.top = (((safeT * 0.95) % 1.0) * 100).toFixed(1) + '%';
          }
          var colHeights = [68, 88, 100, 74, 96, 62, 100];
          for (var bI = 1; bI <= 7; bI++) {
            var cbEl = document.getElementById('s' + num + '-cb-' + bI);
            if (cbEl) {
              var pCb = clamp((dt - 0.25 - bI * 0.06) / 0.70);
              cbEl.style.height = (colHeights[bI - 1] * E.out3(pCb)).toFixed(1) + '%';
            }
          }
          for (var rI = 1; rI <= 3; rI++) {
            var rkCard = document.getElementById('s' + num + '-rk-' + rI);
            var rkBar = document.getElementById('s' + num + '-rkbar-' + rI);
            var rkNum = document.getElementById('s' + num + '-rknum-' + rI);
            var rDelay = 0.20 + (rI - 1) * 0.22;
            var pRk = clamp((dt - rDelay) / 0.52);
            var pBarR = E.out3(clamp((dt - (rDelay + 0.18)) / 0.85));
            if (rkCard) {
              rkCard.style.opacity = clamp(pRk * 2.2).toFixed(2);
              rkCard.style.transform = 'translateX(' + ((1 - E.spring(pRk)) * 230).toFixed(1) + 'px)';
            }
            if (rkBar) {
              var targetW = parseFloat(rkBar.getAttribute('data-width') || '90');
              rkBar.style.width = (targetW * pBarR).toFixed(1) + '%';
            }
            if (rkNum) {
              var targetV = parseFloat(rkNum.getAttribute('data-target') || '100');
              var pref = rkNum.getAttribute('data-prefix') || '';
              var unit = rkNum.getAttribute('data-unit') || '%';
              rkNum.textContent = pref + ' ' + Math.round(targetV * pBarR) + unit;
            }
          }
        }

        else if (sc.archetype === 'pentagon-orbital') {
          var coreEl = document.getElementById('s' + num + '-core');
          var r1El = document.getElementById('s' + num + '-ring-1');
          var r2El = document.getElementById('s' + num + '-ring-2');
          var pCore = clamp((dt - 0.05) / 0.55);
          if (coreEl) {
            coreEl.style.transform = 'translate(-50%, -50%) scale(' + E.spring(pCore).toFixed(3) + ')';
          }
          if (r1El) r1El.style.transform = 'translate(-50%, -50%) rotate(' + (safeT * 10).toFixed(1) + 'deg)';
          if (r2El) r2El.style.transform = 'translate(-50%, -50%) rotate(-' + (safeT * 6).toFixed(1) + 'deg)';

          var nodeOffsets = [
            { dx: 0,    dy: -350, delay: 0.18 },
            { dx: 307,  dy: -185, delay: 0.28 },
            { dx: 240,  dy: 300,  delay: 0.38 },
            { dx: -240, dy: 300,  delay: 0.48 },
            { dx: -307, dy: -185, delay: 0.58 }
          ];
          for (var nI = 1; nI <= 5; nI++) {
            var nEl = document.getElementById('s' + num + '-node-' + nI);
            var lEl = document.getElementById('s' + num + '-laser-' + nI);
            var cfg = nodeOffsets[nI - 1];
            if (nEl) {
              var pN = clamp((dt - cfg.delay) / 0.56);
              var spN = E.spring(pN);
              var cx = cfg.dx * (spN - 1);
              var cy = cfg.dy * (spN - 1);
              nEl.style.opacity = clamp(pN * 2.2).toFixed(2);
              nEl.style.transform = 'translate(-50%, -50%) translate(' + cx.toFixed(1) + 'px, ' + cy.toFixed(1) + 'px) scale(' + spN.toFixed(3) + ')';
            }
            if (lEl) {
              lEl.style.strokeDashoffset = '-' + (safeT * 38).toFixed(1);
            }
          }
        }

        else if (sc.archetype === 'tenshi-specialists-grid') {
          var tBar = document.getElementById('s' + num + '-topbar');
          if (tBar) {
            var pTb = clamp(dt / 0.52);
            tBar.style.opacity = clamp(pTb * 2).toFixed(2);
            tBar.style.transform = 'translateY(' + ((1 - E.spring(pTb)) * -65).toFixed(1) + 'px)';
          }
          for (var spI = 1; spI <= 4; spI++) {
            var spEl = document.getElementById('s' + num + '-sp-' + spI);
            if (spEl) {
              var dir = spI % 2 === 1 ? -1 : 1;
              var pSp = clamp((dt - (0.18 + (spI - 1) * 0.14)) / 0.52);
              var tx = (1 - E.spring(pSp)) * 220 * dir;
              spEl.style.opacity = clamp(pSp * 2.2).toFixed(2);
              spEl.style.transform = 'translateX(' + tx.toFixed(1) + 'px)';
            }
          }
        }

        else if (sc.archetype === 'cta-viral-bubbles') {
          var ctaCard = document.getElementById('s' + num + '-cta-card');
          var ctaGlow = document.getElementById('s' + num + '-cta-glow');
          var ctaBtn = document.getElementById('s' + num + '-cta-btn');
          if (ctaCard) {
            var pCta = clamp(dt / 0.58);
            ctaCard.style.opacity = clamp(pCta * 2.2).toFixed(2);
            ctaCard.style.transform = 'scale(' + E.spring(pCta).toFixed(3) + ')';
          }
          if (ctaGlow) {
            var gScale = 1 + Math.sin(safeT * 2.6) * 0.03;
            ctaGlow.style.transform = 'scale(' + gScale.toFixed(3) + ')';
          }
          if (ctaBtn) {
            var bScale = 1 + Math.cos(safeT * 2.6) * 0.024;
            ctaBtn.style.transform = 'scale(' + bScale.toFixed(3) + ')';
          }
          var bubRots = [-4, 3, 5, -3];
          for (var bbI = 1; bbI <= 4; bbI++) {
            var bbEl = document.getElementById('s' + num + '-bub-' + bbI);
            if (bbEl) {
              var pBb = clamp((dt - (0.22 + (bbI - 1) * 0.18)) / 0.48);
              var sBb = E.spring(pBb);
              bbEl.style.opacity = clamp(pBb * 2.2).toFixed(2);
              bbEl.style.transform = 'rotate(' + bubRots[bbI - 1] + 'deg) scale(' + sBb.toFixed(3) + ')';
            }
          }
        }
      } else {
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      }
    }

    // 7. Actualizar Avatar 3D Minecraft Voxel en el tercio inferior
    updateAvatarAt(safeT, activeSceneIdx);
  }

  window.renderFrame = renderFrame;
  window.render = renderFrame;
  window.__render = renderFrame;
  window.__wappyFitViewport = fitStageToViewport;
  window.__wappyRenderTick = function(timeSec, totalDurOverride) {
    if (typeof totalDurOverride === 'number' && totalDurOverride > 1) {
      TOTAL_DUR = totalDurOverride;
    }
    if (window.mainTimeline && typeof window.mainTimeline.pause === 'function') {
      window.mainTimeline.pause();
    }
    renderFrame(timeSec);
  };

  // Integración con GSAP window.mainTimeline para compatibilidad total con Studio Player, Cápsula LMS y Render MP4
  function setupMasterTimeline() {
    if (typeof window.gsap === 'undefined') return;
    var tl = window.gsap.timeline({ repeat: 0 });
    tl.to({}, {
      duration: TOTAL_DUR,
      ease: 'none',
      onUpdate: function() {
        renderFrame(tl.time());
      }
    }, 0);
    window.mainTimeline = tl;
    renderFrame(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMasterTimeline);
  } else {
    setupMasterTimeline();
  }

  // Escuchar mensajes del reproductor de WAPPY Studio
  window.addEventListener('message', function(e) {
    if (!e.data) return;
    var d = e.data;
    if (d.type === 'STUDIO_PLAY') {
      window.__wappyVoicePlaying = true;
      if (window.mainTimeline) window.mainTimeline.play();
    } else if (d.type === 'STUDIO_PAUSE') {
      window.__wappyVoicePlaying = false;
      if (window.mainTimeline) window.mainTimeline.pause();
    } else if (d.type === 'STUDIO_RESTART') {
      window.__wappyVoicePlaying = true;
      if (window.mainTimeline) window.mainTimeline.restart();
    } else if (d.type === 'STUDIO_SEEK' && typeof d.progress === 'number') {
      var targetT = clamp(d.progress, 0, 1) * TOTAL_DUR;
      if (window.mainTimeline) window.mainTimeline.time(targetT, false).pause();
      renderFrame(targetT);
    } else if (d.type === 'STUDIO_SYNC_TIME' && typeof d.currentTime === 'number') {
      if (typeof d.duration === 'number' && d.duration > 1) TOTAL_DUR = d.duration;
      window.__wappyVoicePlaying = Boolean(d.playing);
      if (window.mainTimeline) window.mainTimeline.time(clamp(d.currentTime, 0, TOTAL_DUR), false);
      renderFrame(d.currentTime);
    }
  });
})();
</script>
</body>
</html>`;
}

module.exports = {
  ARCHETYPE_ROTATION,
  resolveArchetypeFromEffect,
  alignTimelineMapWithWavBuffer,
  buildSmartScenePlanFromScript,
  generateCreativeScenePlanWithAi,
  compileAntigravityMasterReelHtml,
};
