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
 * Construye un plan de escenas rico e inteligente de forma determinista a partir del guion,
 * garantizando que cada beat tenga títulos gigantes de alto impacto, tarjetas VS, iPhone 3D,
 * Pentágono Orbital con láseres, Pad de Firmas SVG, Chart Grow y Burbujas Virales.
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

    // Extraer prefijos ordinales (ej. "Primero:", "Segundo:", "Tercero:")
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
    const defaultTitleBefore = stepPrefix
      ? `${idx}. ${bodyWords.slice(0, 2).join(' ')}`
      : bodyWords.slice(0, Math.min(3, Math.max(1, Math.floor(bodyWords.length * 0.25)))).join(' ');
    const defaultTitleHighlight = stepPrefix
      ? bodyWords.slice(2, Math.min(5, bodyWords.length)).join(' ') || stepPrefix
      : bodyWords.slice(-Math.min(3, bodyWords.length)).join(' ').replace(/[.,;:!?]+$/, '');

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

    // Extraer frases cortas del beat para alimentar las tarjetas dinámicas
    const clauses = bodyText
      .split(/[,;:]|\s+y\s+|\s+con\s+|\s+para\s+|\s+de\s+forma\s+/i)
      .map((c) => c.trim())
      .filter((c) => c.length > 3);

    const c0 = clauses[0] || bodyText.slice(0, 42);
    const c1 = clauses[1] || 'Verificación técnica en tiempo real';

    const defaultSideCards = [
      {
        icon: '⚡',
        title: c0.slice(0, 26),
        desc: bodyText.slice(0, 56),
        color: 'cyan',
      },
      {
        icon: '🔒',
        title: c1.slice(0, 26),
        desc: 'Control operativo obligatorio antes de intervenir',
        color: 'teal',
      },
      {
        icon: '🛡️',
        title: 'Verificación WAPPY IA',
        desc: 'Evidencia digital e inspección segura en campo',
        color: 'lime',
      },
    ];

    const defaultSigCards = [
      { role: c0.slice(0, 24) || 'Bloqueo Principal', icon: '🔒', status: '✓ BLOQUEADO' },
      { role: c1.slice(0, 24) || 'Etiqueta Personal LOTO', icon: '🏷️', status: '✓ ETIQUETADO' },
      { role: 'Responsable Técnico SST', icon: '✍️', status: '✓ FIRMADO' },
    ];

    const defaultOrbitalNodes = [
      { icon: '🔌', title: 'Corte Efectivo', sub: 'Fuentes aisladas' },
      { icon: '🔒', title: 'Bloqueo LOTO', sub: 'Candado personal' },
      { icon: '📟', title: 'Detector 0V', sub: 'Ausencia verificada' },
      { icon: '🌱', title: 'Puesta a Tierra', sub: 'Y en cortocircuito' },
      { icon: '🚧', title: 'Zona Señalizada', sub: 'Perímetro seguro' },
    ];

    const defaultGridSpecs = [
      { icon: '🚧', title: 'Delimitación Física', sub: 'Conos y barreras dieléctricas', color: 'teal' },
      { icon: '⚠️', title: 'Señalización Visible', sub: 'Avisos normativos de peligro', color: 'cyan' },
      { icon: '👷', title: 'Personal Autorizado', sub: 'Ingreso exclusivo con EPP', color: 'amber' },
      { icon: '📋', title: 'Permiso Verificado', sub: 'Lista de chequeo en vivo', color: 'red' },
    ];

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
            ? `REGLA DE ORO #${idx} • ${stepPrefix}`
            : isFirst
              ? `PORTADA MAGNÉTICA • ${companyName}`
              : isLast
                ? `CULTURA PREVENTIVA • ${companyName}`
                : `ESTÁNDAR TÉCNICO • PASO 0${idx + 1}`),
      titleBefore: String(titleBefore || 'ESTÁNDAR').slice(0, 26),
      titleHighlight: String(titleHighlight || 'WAPPY IA').slice(0, 26),
      highlightStyle,
      subtitle: isFirst && options.subtitleText && !stepMeta?.narration ? String(options.subtitleText) : rawText,
      badCardTitle: stepMeta?.badCardTitle || 'Práctica sin Protocolo',
      badCardDesc: stepMeta?.badCardDesc || 'Alto riesgo de accidente grave por exceso de confianza o improvisación',
      badCardBadge: 'RIESGO CRÍTICO',
      goodCardTitle: stepMeta?.goodCardTitle || `Estándar Seguro ${companyName}`,
      goodCardDesc: stepMeta?.goodCardDesc || rawText.slice(0, 78),
      goodCardBadge: '100% SEGURO',
      wallPills: [
        String(titleHighlight || 'WAPPY IA').toUpperCase(),
        `${companyName} • SOMOS SST`,
        'PREVENCIÓN EN TIEMPO REAL',
        'CERO ACCIDENTES LABORALES',
      ],
      islandText: stepMeta?.islandText || stepPrefix || `PASO 0${idx + 1} LIVE`,
      phoneQrTitle: (titleHighlight || 'VERIFICADO').toUpperCase().slice(0, 18),
      phonePills: [
        { icon: '⚡', text: c0.slice(0, 28) },
        { icon: '🛡️', text: c1.slice(0, 28) },
        { icon: '🎯', text: 'Control Verificado: 100%' },
        { icon: '✅', text: 'Trazabilidad en Vivo' },
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
      formulaLeft: 'INSPECCIÓN',
      formulaMid: 'VERIFICACIÓN 0V',
      formulaRight: '100% SEGURO',
      riskCards: [
        {
          title: `🟢 ${c0.slice(0, 22)}`,
          pillPrefix: 'CONTROL:',
          val: 100,
          unit: '%',
          sub: bodyText.slice(0, 48),
          widthPct: 100,
          color: 'green',
        },
        {
          title: '🔵 Detector Calibrado',
          pillPrefix: 'PRECISIÓN:',
          val: 100,
          unit: '%',
          sub: 'Ausencia total de tensión certificada en fases',
          widthPct: 92,
          color: 'cyan',
        },
        {
          title: '🟡 Riesgo Residual',
          pillPrefix: 'TENSIÓN:',
          val: 0,
          unit: ' V',
          sub: 'Energía cero verificada antes de intervenir',
          widthPct: 18,
          color: 'lime',
        },
      ],
      coreIcon: '⚡',
      coreLabel: (stepPrefix || 'PROTECCIÓN 360°').slice(0, 18),
      coreBadge: '100% BLINDAJE',
      orbitalNodes:
        Array.isArray(stepMeta?.orbitalNodes) && stepMeta.orbitalNodes.length >= 5
          ? stepMeta.orbitalNodes.slice(0, 5).map((n, nIdx) => ({
              icon: n.icon || defaultOrbitalNodes[nIdx].icon,
              title: n.title || defaultOrbitalNodes[nIdx].title,
              sub: n.sub || defaultOrbitalNodes[nIdx].sub,
            }))
          : defaultOrbitalNodes,
      tenshiTitle: `Tenshi IA • Supervisión ${stepPrefix || 'Activa'}`,
      tenshiSub: rawText.slice(0, 58),
      gridSpecs:
        Array.isArray(stepMeta?.gridSpecs) && stepMeta.gridSpecs.length >= 4
          ? stepMeta.gridSpecs.slice(0, 4).map((g, gIdx) => ({
              icon: g.icon || defaultGridSpecs[sIdxOr(gIdx)].icon,
              title: g.title || defaultGridSpecs[sIdxOr(gIdx)].title,
              sub: g.sub || defaultGridSpecs[sIdxOr(gIdx)].sub,
              color: g.color || defaultGridSpecs[sIdxOr(gIdx)].color,
            }))
          : defaultGridSpecs,
      cloudTags: ['✦ Resolución 0312', '✦ Decreto 1072', '✦ Estándar RETIE', '✦ WAPPY IA'],
      ctaHeader: 'PREVENCIÓN INTELIGENTE • CERO ACCIDENTES • 100% VIDA',
      ctaInstruction: '👇 Tu familia te espera en casa:',
      ctaKeyword: stepMeta?.ctaKeyword || 'SOMOS SST',
      ctaGift: `🛡️ ${rawText.slice(0, 48).toUpperCase()}`,
      socialBubbles: [
        { icon: '⚡', text: '💬 5 Reglas de Oro siempre activas 🔥' },
        { icon: '🛡️', text: '💬 Primero mi vida y mi familia ❤️' },
        { icon: '👷', text: '💬 SOMOS SST prevención en vivo 🚀' },
        { icon: '✅', text: '💬 Regresar sano y salvo a casa 🙏' },
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
    <div class="scene" id="scene-${num}" data-archetype="hook-vs-wall" style="${idx === 0 ? 'opacity:1;visibility:visible;' : ''}">
      ${headerHtml}
      <div class="middle-container">
        <div class="hook-box">
          <div class="hook-card hook-card-bad hud-glass-pro" id="s${num}-card-1">
            <div class="hook-ico-box" style="background: rgba(239, 68, 68, 0.22); border: 2.5px solid #ef4444;">❌</div>
            <div class="hook-text">
              <h3>${escapeHtml(sc.badCardTitle)}</h3>
              <p>${escapeHtml(sc.badCardDesc)}</p>
            </div>
            <div class="hook-badge" style="background: rgba(239, 68, 68, 0.25); color: #fca5a5; border: 2px solid #ef4444;">${escapeHtml(sc.badCardBadge)}</div>
          </div>

          <div class="hook-card hook-card-good hud-glass-pro" id="s${num}-card-2">
            <div class="corner-bracket cb-tl"></div><div class="corner-bracket cb-tr"></div>
            <div class="corner-bracket cb-bl"></div><div class="corner-bracket cb-br"></div>
            <div class="hook-ico-box" style="background: rgba(199, 243, 3, 0.22); border: 2.5px solid var(--w-lime);">⚡</div>
            <div class="hook-text">
              <h3>${escapeHtml(sc.goodCardTitle)}</h3>
              <p>${escapeHtml(sc.goodCardDesc)}</p>
            </div>
            <div class="hook-badge" style="background: var(--w-lime); color: #0e1300;">${escapeHtml(sc.goodCardBadge)}</div>
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
                <span>${escapeHtml(p.icon)}</span> <span>${escapeHtml(p.text)}</span>
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
        return `
            <div class="side-card hud-glass-pro" id="s${num}-sc-${cIdx + 1}" style="border-color: ${borderCol};">
              <div class="side-card-ico" style="${icoBg}">${escapeHtml(c.icon)}</div>
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
              <span style="font-size: 12px;">⚡</span>
            </div>
            <div class="iphone-screen">
              <div class="iphone-qr-box">
                <div class="qr-scan-line" id="s${num}-laser"></div>
                <div class="qr-ico">📱</div>
                <div style="font-family: var(--mono); font-size: 16px; font-weight: 900; color: var(--w-lime); margin-top: 8px; text-align:center;">${escapeHtml(sc.phoneQrTitle)}</div>
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
                <div class="sig-role"><span>${escapeHtml(sg.icon)}</span> ${escapeHtml(sg.role)}</div>
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

    return `
    <div class="scene" id="scene-${num}" data-archetype="signature-pad-live">
      ${headerHtml}
      <div class="middle-container">
        <div class="split-showcase">
          <div class="iphone-frame" id="s${num}-phone">
            <div class="dynamic-island">
              <span class="island-dot"></span>
              <span class="island-text">BLOQUEO LOTO</span>
              <span style="font-size: 12px;">🔒</span>
            </div>
            <div class="iphone-screen">
              <div class="iphone-qr-box" style="border-color: var(--w-lime);">
                <div class="qr-scan-line" id="s${num}-laser"></div>
                <div class="qr-ico">🔐</div>
                <div style="font-family: var(--mono); font-size: 16px; font-weight: 900; color: var(--w-lime); margin-top: 8px;">CANDADO PERSONAL</div>
              </div>
              <div class="iphone-alert-pill" style="border-color: var(--w-lime); background: rgba(199,243,3,0.18);">
                <span>🔒</span> <span>Enclavamiento Mecánico</span>
              </div>
              <div class="iphone-alert-pill" style="border-color: var(--w-cyan-bright); background: rgba(6,182,212,0.18);">
                <span>🏷️</span> <span>Tarjeta Peligro No Operar</span>
              </div>
              <div class="iphone-alert-pill" style="border-color: var(--w-teal-bright); background: rgba(13,148,136,0.22);">
                <span>✍️</span> <span>Firma Digital Validada</span>
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
                <div class="risk-title">${escapeHtml(rk.title)}</div>
                <div class="risk-nr-pill" style="background: rgba(199,243,3,0.2); color:#c7f303; border:1.5px solid ${bCol};" id="s${num}-rknum-${rIdx + 1}" data-target="${rk.val}" data-prefix="${escapeHtml(rk.pillPrefix)}" data-unit="${escapeHtml(rk.unit)}">${escapeHtml(rk.pillPrefix)} ${rk.val}${escapeHtml(rk.unit)}</div>
              </div>
              <div class="risk-sub">${escapeHtml(rk.sub)}</div>
              <div class="risk-bar-bg"><div class="risk-bar-fill" id="s${num}-rkbar-${rIdx + 1}" data-width="${rk.widthPct}" style="background: ${grad};"></div></div>
            </div>`;
      })
      .join('');

    const barsCols = ['L1', 'L2', 'L3', 'N', 'PE', 'DC', 'OK']
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
              <span class="island-text">TELEMETRÍA EN VIVO</span>
              <span style="font-size: 12px;">📟</span>
            </div>
            <div class="iphone-screen">
              <div class="iphone-qr-box" style="border-color: var(--w-cyan-bright);">
                <div class="qr-scan-line" id="s${num}-laser"></div>
                <div class="qr-ico">📟</div>
                <div style="font-family: var(--mono); font-size: 16px; font-weight: 900; color: var(--w-cyan-bright); margin-top: 6px;">DETECTOR CALIBRADO</div>
              </div>
              <div class="chart-bars-wrap" style="height: 160px; margin-top: 18px;">
                ${barsCols}
              </div>
              <div class="iphone-alert-pill" style="margin-top: auto; border-color: var(--w-lime); background: rgba(199,243,3,0.2);">
                <span>✅</span> <span>0.0 V Verificados en Red</span>
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
        return `
          <div class="orbital-node pos-node-${nIdx + 1}" id="s${num}-node-${nIdx + 1}">
            <div class="node-ico" style="${icoBgs[nIdx]}">${escapeHtml(nd.icon)}</div>
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
            <div class="biocore-fingerprint">${escapeHtml(sc.coreIcon || '⚡')}</div>
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
        return `
            <div class="spec-item hud-glass-pro" id="s${num}-sp-${sIdx + 1}" style="${borders[sIdx]}">
              <div class="spec-ico" style="${bgs[sIdx]}">${escapeHtml(sp.icon)}</div>
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
              <img src="/assets/wappy/tenshi.png" alt="Tenshi IA">
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
          <span class="bubble-user">${escapeHtml(bb.icon)}</span> <span>${escapeHtml(bb.text)}</span>
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
            <span>wappy.club</span> ↗
          </div>
        </div>
      </div>
    </div>`;
}

/**
 * Lee el código fuente de WappyAvatarVoxel3D (motor/wappy-avatar-voxel3d.js) para incrustarlo directamente
 * y que el Avatar 3D Minecraft Voxel de Mauricio/Félix funcione al 100% sin depender de rutas externas.
 */
let CACHED_VOXEL_AVATAR_JS = null;
function getVoxelAvatarInlineJs() {
  if (CACHED_VOXEL_AVATAR_JS) return CACHED_VOXEL_AVATAR_JS;
  const candidates = [
    path.join(process.cwd(), 'client', 'public', 'assets', 'wappy', 'wappy-avatar-voxel3d.js'),
    path.join(__dirname, '..', '..', '..', 'client', 'public', 'assets', 'wappy', 'wappy-avatar-voxel3d.js'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        CACHED_VOXEL_AVATAR_JS = fs.readFileSync(p, 'utf8');
        return CACHED_VOXEL_AVATAR_JS;
      }
    } catch (_) {}
  }
  return '';
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

  const customLime =
    typeof options.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(options.accentColor.trim())
      ? options.accentColor.trim()
      : '#c7f303';
  const customCssBlock = options.customCss ? `\n/* Custom Studio AI Edits */\n${options.customCss}\n` : '';

  const scenesMarkup = scenePlan.map((sc, idx) => renderSceneMarkup(sc, idx)).join('\n');
  const voxelAvatarJs = getVoxelAvatarInlineJs();

  const scenesTimingJson = JSON.stringify(
    scenePlan.map((sc, idx) => ({
      num: idx + 1,
      id: `#scene-${idx + 1}`,
      archetype: sc.archetype,
      start: Number(sc.startSec),
      end: Number(sc.endSec),
      isLast: idx === scenePlan.length - 1,
    })),
  );

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

/* TERCIO SUPERIOR (y: 52 - 325) — TIPOGRAFÍA GIGANTE MÓVIL XL */
.header-box {
  position: absolute; top: 52px; left: 38px; right: 38px;
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
  max-width: 1000px;
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
  max-width: 960px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
}

/* TERCIO MEDIO (y: 335 - 1185) — ESCENARIO DINÁMICO 60 FPS */
.middle-container {
  position: absolute; top: 335px; left: 35px; right: 35px; height: 845px;
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
  width: 1000px; display: flex; flex-direction: column; gap: 24px; margin-top: -32px;
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
  position: absolute; bottom: 16px; left: -80px; right: -80px;
  display: flex; flex-direction: column; gap: 8px; pointer-events: none;
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
  width: 1005px; display: flex; align-items: center; gap: 26px;
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
  width: 1005px; padding: 18px 28px; border-radius: 22px;
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
  width: 1000px; display: flex; flex-direction: column; gap: 20px; perspective: 1200px;
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
  width: 990px; padding: 34px 40px; border-radius: 36px;
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

/* TERCIO INFERIOR (y: 1185 - 1920) — AVATAR MINECRAFT VOXEL 3D EN THREE.JS */
#avatar-host-container {
  position: absolute;
  left: 180px;
  top: 1175px;
  width: 720px;
  height: 760px;
  pointer-events: none;
  z-index: 30;
  background: transparent;
}

/* ADAPTACIÓN HORIZONTAL 16:9 (1920x1080) */
html[data-aspect-ratio="16:9"] .header-box {
  top: 28px; left: 60px; right: 480px; align-items: flex-start; text-align: left;
}
html[data-aspect-ratio="16:9"] .title-hero {
  font-size: 52px; max-width: 1320px;
}
html[data-aspect-ratio="16:9"] .sub-hero {
  font-size: 24px; max-width: 1280px; -webkit-line-clamp: 1;
}
html[data-aspect-ratio="16:9"] .middle-container {
  top: 215px; left: 60px; right: 500px; height: 810px;
}
html[data-aspect-ratio="16:9"] #avatar-host-container {
  left: auto; right: -30px; top: 340px; width: 640px; height: 740px;
}
${customCssBlock}
</style>
</head>
<body>
<div id="viewport">
  <div id="stage" data-wappy-master-reel="true" data-aspect-ratio="${aspectRatio}">
    ${hasBaseVideo ? '' : '<div class="bg-cyber-grid"></div><div class="ambient-orb orb-teal"></div><div class="ambient-orb orb-cyan"></div><div class="ambient-orb orb-lime"></div>'}
    <div id="top-progress-bar"></div>
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

  // Escalar el escenario automáticamente al viewport de cualquier pantalla o iframe
  function fitStageToViewport() {
    var vp = document.getElementById('viewport');
    var st = document.getElementById('stage');
    if (!vp || !st) return;
    var w = vp.clientWidth || window.innerWidth || STAGE_W;
    var h = vp.clientHeight || window.innerHeight || STAGE_H;
    var scale = Math.min(w / STAGE_W, h / STAGE_H);
    st.style.transform = 'scale(' + scale.toFixed(5) + ')';
  }
  window.addEventListener('resize', fitStageToViewport);
  fitStageToViewport();

  var TOTAL_DUR = ${totalDur};
  var scenes = ${scenesTimingJson};
  var vozData = window.VOZ || [];

  // Inicializar Avatar 3D Minecraft Voxel (Three.js) en #avatar-host-container
  var avatarHost = document.getElementById('avatar-host-container');
  var voxelAvatar = null;
  var fallbackCanvas = null;
  var fallbackCtx = null;

  function initAvatar3D() {
    if (!avatarHost) return;
    try {
      if (typeof window.WappyAvatarVoxel3D === 'function' && typeof window.THREE !== 'undefined') {
        avatarHost.innerHTML = '';
        voxelAvatar = new window.WappyAvatarVoxel3D({
          ancho: 720,
          alto: 760,
          parent: avatarHost
        });
        return;
      }
    } catch (err) {
      voxelAvatar = null;
    }
    // Fallback Canvas 2D Voxel si WebGL está deshabilitado en un contenedor sin GPU
    avatarHost.innerHTML = '<canvas id="avatar-fallback-2d" width="720" height="760" style="width:720px;height:760px;display:block;"></canvas>';
    fallbackCanvas = document.getElementById('avatar-fallback-2d');
    if (fallbackCanvas) fallbackCtx = fallbackCanvas.getContext('2d');
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

      // Detectar silencios reales (>= 0.22s) y ajustar bordes de escenas automáticamente
      var sils = [];
      var inS = false, sStart = 0;
      for (var f2 = 0; f2 < vozData.length; f2++) {
        if (vozData[f2] < 0.045) {
          if (!inS) { inS = true; sStart = f2 / fps; }
        } else if (inS) {
          var sEnd = f2 / fps;
          if (sEnd - sStart >= 0.22 && sStart > 0.6 && sEnd < realDur - 0.6) {
            sils.push({ start: sStart, end: sEnd, mid: (sStart + sEnd) / 2, dur: sEnd - sStart });
          }
          inS = false;
        }
      }
      if (scenes.length > 1 && sils.length > 0) {
        var used = {};
        for (var scI = 0; scI < scenes.length - 1; scI++) {
          var exp = scenes[scI].end;
          var best = null, bestSc = 999;
          for (var k = 0; k < sils.length; k++) {
            if (used[k]) continue;
            var d = Math.abs(sils[k].mid - exp);
            if (d < 2.5 && (d - sils[k].dur * 0.6) < bestSc) {
              bestSc = d - sils[k].dur * 0.6;
              best = { sil: sils[k], k: k };
            }
          }
          if (best) {
            used[best.k] = true;
            scenes[scI].end = Number(best.sil.mid.toFixed(2));
            scenes[scI + 1].start = scenes[scI].end;
          }
        }
        scenes[scenes.length - 1].end = Number(realDur.toFixed(2));
      }
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
    if (activeSceneIdx < 0 || activeSceneIdx >= scenes.length) return false;
    var sc = scenes[activeSceneIdx];
    var dt = t - sc.start;
    // En cada escena el Avatar señala hacia las tarjetas/iPhone durante los primeros 3.6 segundos de explicación
    return dt >= 0.35 && dt <= Math.min(sc.end - sc.start - 0.3, 4.2);
  }

  function updateAvatarAt(t, activeSceneIdx) {
    if (!avatarHost) return;
    var nv = getVoiceLevel(t);
    var isTalking = nv > 0.045;
    var isPointing = isPointingMoment(t, activeSceneIdx);
    var theta = t * Math.PI * 1.55;

    var pIn = clamp(t / 0.55);
    var sIn = lerp(0.88, 1.04, E.out3(pIn));
    var yIn = (1 - E.out3(pIn)) * 28;
    avatarHost.style.transform = 'translateY(' + yIn.toFixed(1) + 'px) scale(' + sIn.toFixed(4) + ')';
    avatarHost.style.opacity = clamp(pIn * 1.5).toFixed(3);

    if (voxelAvatar && voxelAvatar.renderer) {
      var boca = isTalking
        ? clamp(0.28 + nv * 0.85 + 0.22 * Math.abs(Math.sin(t * 19)))
        : 0.12;

      voxelAvatar.root.position.y = Math.sin(theta * 2) * 0.030;
      voxelAvatar.root.rotation.y = isPointing
        ? (-0.16 + Math.sin(theta) * 0.08)
        : (-0.08 + Math.sin(theta) * 0.11);

      voxelAvatar.headGroup.rotation.x = (isPointing ? -0.06 : 0) + Math.sin(theta * 2) * 0.038 + (boca - 0.15) * 0.05;
      voxelAvatar.headGroup.rotation.y = (isPointing ? 0.10 : 0) + Math.sin(theta + 0.5) * 0.10;
      voxelAvatar.headGroup.rotation.z = Math.cos(theta) * 0.028;

      var blinkMod = t % 3.4;
      var blinkScale = (blinkMod > 3.22 && blinkMod < 3.36) ? 0.08 : 1.0;
      voxelAvatar.eyeL.scale.y = blinkScale;
      voxelAvatar.eyeR.scale.y = blinkScale;

      var browLift = (boca - 0.15) * 0.05;
      voxelAvatar.browL.position.y = 0.39 + browLift;
      voxelAvatar.browR.position.y = 0.39 + browLift;

      voxelAvatar.mouthGroup.scale.y = lerp(0.35, 1.38, clamp(boca));
      voxelAvatar.mouthGroup.scale.x = lerp(1.04, 0.90, clamp(boca * 0.6));

      voxelAvatar.brazoIzq.pivote.rotation.x = -0.22 + Math.sin(theta * 2) * 0.12 + (boca - 0.15) * 0.04;
      voxelAvatar.brazoIzq.pivote.rotation.z = -0.10 + Math.cos(theta) * 0.04;
      voxelAvatar.brazoIzq.antebrazo.rotation.x = -0.25;
      voxelAvatar.brazoIzq.dedoIndice.scale.y = 0.55;

      if (isPointing) {
        voxelAvatar.brazoDer.pivote.rotation.x = -2.38 + Math.sin(theta * 2) * 0.08;
        voxelAvatar.brazoDer.pivote.rotation.z = 0.28 + Math.cos(theta * 2) * 0.04;
        voxelAvatar.brazoDer.antebrazo.rotation.x = -0.35 + Math.sin(theta * 2) * 0.06;
        voxelAvatar.brazoDer.dedoIndice.scale.y = 1.45;
      } else {
        voxelAvatar.brazoDer.pivote.rotation.x = -0.24 - Math.sin(theta * 2) * 0.13 - (boca - 0.15) * 0.04;
        voxelAvatar.brazoDer.pivote.rotation.z = 0.10 + Math.sin(theta) * 0.04;
        voxelAvatar.brazoDer.antebrazo.rotation.x = -0.28;
        voxelAvatar.brazoDer.dedoIndice.scale.y = 0.55;
      }

      voxelAvatar.renderer.render(voxelAvatar.scene, voxelAvatar.camera);
    } else if (fallbackCtx) {
      // Fallback 2D Voxel en caso de servidor sin WebGL
      fallbackCtx.clearRect(0, 0, 720, 760);
      var by = Math.sin(t * 4) * 5;
      fallbackCtx.save();
      fallbackCtx.translate(360, 420 + by);
      // Camisa a cuadros amarilla/oscura
      fallbackCtx.fillStyle = '#f5c71a';
      fallbackCtx.fillRect(-130, 0, 260, 240);
      fallbackCtx.fillStyle = '#182032';
      fallbackCtx.fillRect(-130, 45, 260, 28);
      fallbackCtx.fillRect(-130, 115, 260, 28);
      fallbackCtx.fillRect(-38, 0, 76, 240);
      fallbackCtx.fillStyle = '#ffffff';
      fallbackCtx.fillRect(-34, 0, 68, 220);
      // Cabeza Voxel
      fallbackCtx.fillStyle = '#eab38f';
      fallbackCtx.fillRect(-110, -210, 220, 195);
      // Cabello Pompadour
      fallbackCtx.fillStyle = '#3b2213';
      fallbackCtx.fillRect(-118, -255, 236, 56);
      fallbackCtx.fillRect(-85, -280, 170, 30);
      // Gafas
      fallbackCtx.fillStyle = '#12141a';
      fallbackCtx.strokeStyle = '#12141a';
      fallbackCtx.lineWidth = 10;
      fallbackCtx.strokeRect(-88, -150, 74, 48);
      fallbackCtx.strokeRect(14, -150, 74, 48);
      fallbackCtx.fillRect(-14, -134, 28, 10);
      // Barba y boca lip-sync
      fallbackCtx.fillStyle = '#2d180c';
      fallbackCtx.fillRect(-112, -62, 224, 48);
      fallbackCtx.fillRect(-62, -84, 124, 20);
      var mH = isTalking ? 10 + nv * 22 : 6;
      fallbackCtx.fillStyle = '#3a0f14';
      fallbackCtx.fillRect(-32, -66, 64, mH);
      fallbackCtx.fillStyle = '#ffffff';
      fallbackCtx.fillRect(-26, -66, 52, 5);
      fallbackCtx.restore();
    }
  }

  function renderFrame(t) {
    var safeT = clamp(t, 0, TOTAL_DUR);

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
          sceneScale = 1 + outP * 0.28; // Transición Zoom-Through
          op = 1 - outP;
        }
        el.style.opacity = clamp(op).toFixed(3);
        el.style.transform = Math.abs(sceneScale - 1) > 0.002 ? 'scale(' + sceneScale.toFixed(3) + ')' : 'none';

        // Animación del Header de la escena
        var hBox = document.getElementById('s' + num + '-header');
        if (hBox) {
          var pH = i === 0 ? 1 : clamp(dt / 0.45);
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
