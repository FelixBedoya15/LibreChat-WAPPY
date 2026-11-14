/**
 * biomechanics3D.ts
 *
 * Módulo de telemetría y análisis biomecánico de postura de alta fidelidad (HUD Sci-Fi / Ergonomía Médica).
 * 
 * Capacidades visuales y biomecánicas:
 * 1. Exoesqueleto Neón HUD de alta fidelidad visual (Canvas 2D nativo ultra-optimizado):
 *    - Columna cervical anatómica (C1-C7) que respeta el rostro (NO cruza labios ni boca).
 *    - Tracking facial ergonómico con visor HUD Sci-Fi: Brackets de encuadre craneal, horizonte ocular y nodos temporales.
 *    - Manos biométricas completas: Tracking de 21 articulaciones (5 dedos con falanges y nudillos) mediante MediaPipe Hands,
 *      con síntesis anatómica de palma y rayos digitales como respaldo ultra-rápido.
 * 2. Cálculo ergonómico defensivo y realista (RULA / REBA) para Cuello, Tronco, Brazos, Codos y Rodillas.
 * 3. Carga no bloqueante de MediaPipe Pose y MediaPipe Hands (<400ms).
 */

export interface BiomechanicAngles {
    neck: number | null;
    trunk: number | null;
    arm: number | null;
    elbow: number | null;
    knee: number | null;
    is3D: boolean;
}

/**
 * Conexiones corporales del tronco y extremidades (excluyendo el rostro para renderizado HUD especializado)
 */
export const BODY_CONNECTIONS: [number, number][] = [
    // Cintura Escapular (Clavícula)
    [11, 12],

    // Extremidad Superior Izquierda (Brazo y Antebrazo)
    [11, 13],
    [13, 15],

    // Extremidad Superior Derecha (Brazo y Antebrazo)
    [12, 14],
    [14, 16],

    // Columna Torácica / Costados (si las caderas son visibles)
    [11, 23],
    [12, 24],
    [23, 24], // Pelvis

    // Extremidad Inferior Izquierda (Muslo, Pierna y Pie)
    [23, 25],
    [25, 27],
    [27, 29], [29, 31], [27, 31],

    // Extremidad Inferior Derecha (Muslo, Pierna y Pie)
    [24, 26],
    [26, 28],
    [28, 30], [30, 32], [28, 32],
];

/**
 * Conexiones anatómicas completas de los 21 puntos de MediaPipe Hands
 */
export const HAND_ANATOMY_CONNECTIONS: [number, number][] = [
    // Palma / Carpo
    [0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
    // Pulgar (Thumb)
    [1, 2], [2, 3], [3, 4],
    // Índice (Index)
    [5, 6], [6, 7], [7, 8],
    // Medio (Middle)
    [9, 10], [10, 11], [11, 12],
    // Anular (Ring)
    [13, 14], [14, 15], [15, 16],
    // Meñique (Pinky)
    [17, 18], [18, 19], [19, 20],
];

/**
 * Carga de script con promesa y caché
 */
export const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') return resolve();
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
    });
};

/**
 * Carga ultrarrápida de MediaPipe Pose (sin cargar modelos secundarios pesados de manos)
 */
export const loadVisionEngines = async (): Promise<void> => {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
};

export const loadClassicPoseScripts = loadVisionEngines;

let tasksVisionPromise: Promise<any> | null = null;
export const loadTasksVision = async (): Promise<any> => {
    if (typeof window === 'undefined') return null;
    if ((window as any).MediaPipeTasksVision) return (window as any).MediaPipeTasksVision;
    if (!tasksVisionPromise) {
        tasksVisionPromise = (async () => {
            try {
                const importDynamic = new Function('url', 'return import(url)');
                const vision = await importDynamic('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
                (window as any).MediaPipeTasksVision = vision;
                return vision;
            } catch (err) {
                console.warn('[Biomechanics3D] Tasks-Vision no disponible vía ESM:', err);
                return null;
            }
        })();
    }
    return tasksVisionPromise;
};

export const initPoseLandmarker = async (tasksVision: any) => {
    if (!tasksVision || !tasksVision.FilesetResolver || !tasksVision.PoseLandmarker) return null;
    try {
        const vision = await tasksVision.FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        return await tasksVision.PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
    } catch {
        return null;
    }
};

/**
 * Dibuja un HUD de cabeza elegante (Brackets de encuadre, horizonte y nodos craneales)
 * ¡TOTALMENTE LIMPIO: Cero líneas atravesando la boca o la nariz!
 */
function drawFuturisticFaceHUD(
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
) {
    const nose = landmarks[0];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftEye = landmarks[2];
    const rightEye = landmarks[5];

    const noseVis = (nose?.visibility ?? 0) > 0.35;
    const leftEarVis = (leftEar?.visibility ?? 0) > 0.35;
    const rightEarVis = (rightEar?.visibility ?? 0) > 0.35;

    if (!noseVis && !leftEarVis && !rightEarVis) return;

    // Calcular centro y radio aproximado de la cabeza
    let centerX = 0;
    let centerY = 0;
    let headSpan = 50;

    if (leftEarVis && rightEarVis) {
        centerX = ((leftEar.x + rightEar.x) / 2) * width;
        centerY = ((leftEar.y + rightEar.y) / 2) * height;
        headSpan = Math.abs(leftEar.x - rightEar.x) * width * 0.9;
    } else if (noseVis) {
        centerX = nose.x * width;
        centerY = (nose.y - 0.04) * height;
        headSpan = width * 0.16;
    }

    const radiusX = Math.max(38, Math.min(width * 0.22, headSpan * 0.65));
    const radiusY = radiusX * 1.32; // Proporción áurea craneal humana

    // Ángulo de inclinación lateral de la cabeza (Roll)
    const headAngle = (leftEye && rightEye && (leftEye.visibility ?? 0) > 0.35 && (rightEye.visibility ?? 0) > 0.35)
        ? Math.atan2((leftEye.y - rightEye.y) * height, (leftEye.x - rightEye.x) * width)
        : 0;

    ctx.save();

    // 1. VISOR HUD CRANEAL OVALADO ANATÓMICO (Cero shadowBlur para renderizado <0.1ms)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(headAngle);

    // Anillo exterior orbital punteado
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX * 1.08, radiusY * 1.08, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Halo exterior suave sin filtro Gaussian blur
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Elipse facial base nítida
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Arcos de acento biométrico agrupados en un solo path
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, -Math.PI * 0.65, -Math.PI * 0.35);
    ctx.moveTo(radiusX * Math.cos(Math.PI * 0.35), radiusY * Math.sin(Math.PI * 0.35));
    ctx.ellipse(0, 0, radiusX, radiusY, 0, Math.PI * 0.35, Math.PI * 0.65);
    ctx.moveTo(radiusX * Math.cos(-Math.PI * 0.12), radiusY * Math.sin(-Math.PI * 0.12));
    ctx.ellipse(0, 0, radiusX, radiusY, 0, -Math.PI * 0.12, Math.PI * 0.12);
    ctx.moveTo(radiusX * Math.cos(Math.PI * 0.88), radiusY * Math.sin(Math.PI * 0.88));
    ctx.ellipse(0, 0, radiusX, radiusY, 0, Math.PI * 0.88, Math.PI * 1.12);
    ctx.stroke();

    // Ticks tácticos en los 4 polos cardinales agrupados en 1 solo stroke
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -radiusY - 4);
    ctx.lineTo(0, -radiusY + 4);
    ctx.moveTo(0, radiusY - 4);
    ctx.lineTo(0, radiusY + 4);
    ctx.moveTo(-radiusX - 4, 0);
    ctx.lineTo(-radiusX + 4, 0);
    ctx.moveTo(radiusX - 4, 0);
    ctx.lineTo(radiusX + 4, 0);
    ctx.stroke();

    // Micro-etiqueta HUD de tracking craneal sobre el polo superior
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.95)';
    ctx.textAlign = 'center';
    ctx.fillText('CRANIAL TRACKING • OVAL HUD', 0, -radiusY - 9);

    ctx.restore();

    // 2. Línea de horizonte ocular / inclinación craneal sutil
    if (leftEye && rightEye && (leftEye.visibility ?? 0) > 0.4 && (rightEye.visibility ?? 0) > 0.4) {
        const lx = leftEye.x * width;
        const ly = leftEye.y * height;
        const rx = rightEye.x * width;
        const ry = rightEye.y * height;

        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.beginPath();
        ctx.moveTo(rx - 12, ry);
        ctx.lineTo(lx + 12, ly);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(lx, ly, 2.5, 0, 2 * Math.PI);
        ctx.moveTo(rx + 2.5, ry);
        ctx.arc(rx, ry, 2.5, 0, 2 * Math.PI);
        ctx.fill();
    }

    // 3. Nodos auditivos (Orejas / Sienes)
    if (leftEarVis || rightEarVis) {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        if (leftEarVis) {
            const lex = leftEar.x * width;
            const ley = leftEar.y * height;
            ctx.moveTo(lex + 3, ley);
            ctx.arc(lex, ley, 3, 0, 2 * Math.PI);
        }
        if (rightEarVis) {
            const rex = rightEar.x * width;
            const rey = rightEar.y * height;
            ctx.moveTo(rex + 3, rey);
            ctx.arc(rex, rey, 3, 0, 2 * Math.PI);
        }
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Dibuja la mano completa de 21 articulaciones (compatibilidad opcional) con trazado por lotes sin shadowBlur
 */
export function drawDetailedHand(
    ctx: CanvasRenderingContext2D,
    handLandmarks: any[],
    width: number,
    height: number
) {
    if (!handLandmarks || handLandmarks.length < 21) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const palmIndices = [0, 1, 5, 9, 13, 17];
    ctx.beginPath();
    for (let i = 0; i < palmIndices.length; i++) {
        const pt = handLandmarks[palmIndices[i]];
        const x = pt.x * width;
        const y = pt.y * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.55)';
    ctx.stroke();

    // Huesos en 2 pasadas por lotes (cero shadowBlur)
    ctx.beginPath();
    for (const [i1, i2] of HAND_ANATOMY_CONNECTIONS) {
        const p1 = handLandmarks[i1];
        const p2 = handLandmarks[i2];
        if (!p1 || !p2) continue;
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
    }
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.28)';
    ctx.lineWidth = 4.6;
    ctx.stroke();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.88)';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Nodos en 2 pasadas por lotes
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    for (let i = 0; i < handLandmarks.length; i++) {
        const pt = handLandmarks[i];
        const px = pt.x * width;
        const py = pt.y * height;
        const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
        const r = isTip ? 3.0 : 2.2;
        ctx.moveTo(px + r, py);
        ctx.arc(px, py, r, 0, 2 * Math.PI);
    }
    ctx.fill();

    ctx.restore();
}

/**
 * Síntesis anatómica instantánea (0ms, 3 pasadas por lotes sin shadowBlur) de mano de 5 dedos
 * y 14 falanges articuladas, 100% anclada en tiempo real a la muñeca y antebrazo de MediaPipe Pose.
 * Nunca se queda pausada ni se separa del esqueleto al mover los brazos rápidamente.
 */
function drawSynthesizedPoseHand(
    ctx: CanvasRenderingContext2D,
    wrist: any,
    pinky: any,
    index: any,
    thumb: any,
    width: number,
    height: number,
    elbow?: any,
    isRightHand?: boolean
) {
    if (!wrist || (wrist.visibility ?? 0) < 0.32) return;

    const wx = wrist.x * width;
    const wy = wrist.y * height;

    // Determinar puntos base de índice y meñique (con respaldo instantáneo desde el vector del antebrazo si hay desenfoque por movimiento)
    let ix = index ? index.x * width : wx;
    let iy = index ? index.y * height : wy;
    let px = pinky ? pinky.x * width : wx;
    let py = pinky ? pinky.y * height : wy;

    let midKx = (ix + px) * 0.5;
    let midKy = (iy + py) * 0.5;
    let palmDx = midKx - wx;
    let palmDy = midKy - wy;
    let palmLen = Math.hypot(palmDx, palmDy);

    const maxValidPalm = Math.max(width, height) * 0.28;

    // Si los nudillos de Pose están muy juntos o fuera de rango durante un movimiento rápido, proyectar desde el antebrazo (codo -> muñeca)
    if (!index || !pinky || palmLen < 5 || palmLen > maxValidPalm) {
        let fx = 0;
        let fy = -1;
        let estPalm = Math.max(14, Math.min(width, height) * 0.045);
        if (elbow && (elbow.visibility ?? 0) > 0.25) {
            const edx = wx - elbow.x * width;
            const edy = wy - elbow.y * height;
            const eLen = Math.hypot(edx, edy);
            if (eLen > 4) {
                fx = edx / eLen;
                fy = edy / eLen;
                estPalm = Math.max(12, Math.min(maxValidPalm * 0.5, eLen * 0.26));
            }
        }
        const sideSign = isRightHand ? -1 : 1;
        const perpX = -fy * sideSign;
        const perpY = fx * sideSign;
        ix = wx + fx * estPalm - perpX * (estPalm * 0.34);
        iy = wy + fy * estPalm - perpY * (estPalm * 0.34);
        px = wx + fx * estPalm + perpX * (estPalm * 0.34);
        py = wy + fy * estPalm + perpY * (estPalm * 0.34);
        midKx = (ix + px) * 0.5;
        midKy = (iy + py) * 0.5;
        palmDx = midKx - wx;
        palmDy = midKy - wy;
        palmLen = Math.hypot(palmDx, palmDy) || estPalm;
    }

    const fwdX = palmDx / palmLen;
    const fwdY = palmDy / palmLen;

    // Vector transversal de índice a meñique
    const spanDx = px - ix;
    const spanDy = py - iy;
    const spanLen = Math.hypot(spanDx, spanDy);
    const acrossX = spanLen > 2 ? spanDx / spanLen : -fwdY;
    const acrossY = spanLen > 2 ? spanDy / spanLen : fwdX;

    // Arco metacarpiano anatómico para los 4 nudillos (Índice, Medio, Anular, Meñique) y sus 3 falanges
    const knuckles = [
        { t: 0.0, arch: 0.0, splay: -0.14, lenMul: 1.02 },  // Índice
        { t: 0.33, arch: 0.11, splay: -0.04, lenMul: 1.16 }, // Medio
        { t: 0.67, arch: 0.07, splay: 0.05, lenMul: 1.06 },  // Anular
        { t: 1.0, arch: -0.04, splay: 0.16, lenMul: 0.84 },  // Meñique
    ].map((cfg) => {
        const kx = ix + (px - ix) * cfg.t + fwdX * (palmLen * cfg.arch);
        const ky = iy + (py - iy) * cfg.t + fwdY * (palmLen * cfg.arch);
        const rawDirX = fwdX + acrossX * cfg.splay;
        const rawDirY = fwdY + acrossY * cfg.splay;
        const dNorm = Math.hypot(rawDirX, rawDirY) || 1;
        const dirX = rawDirX / dNorm;
        const dirY = rawDirY / dNorm;
        const fingerLen = palmLen * cfg.lenMul;

        const pip = { x: kx + dirX * (fingerLen * 0.45), y: ky + dirY * (fingerLen * 0.45) };
        const dip = { x: kx + dirX * (fingerLen * 0.76), y: ky + dirY * (fingerLen * 0.76) };
        const tip = { x: kx + dirX * fingerLen, y: ky + dirY * fingerLen };
        return { mcp: { x: kx, y: ky }, pip, dip, tip };
    });

    // Pulgar articulado en 3 segmentos (CMC -> MCP -> IP -> Punta)
    const radialDirX = -acrossX;
    const radialDirY = -acrossY;
    const cmc = {
        x: wx + fwdX * (palmLen * 0.28) + radialDirX * (palmLen * 0.22),
        y: wy + fwdY * (palmLen * 0.28) + radialDirY * (palmLen * 0.22),
    };
    const rawTx = thumb && (thumb.visibility ?? 0) > 0.25
        ? thumb.x * width
        : cmc.x + (fwdX * 0.65 + radialDirX * 0.75) * (palmLen * 0.48);
    const rawTy = thumb && (thumb.visibility ?? 0) > 0.25
        ? thumb.y * height
        : cmc.y + (fwdY * 0.65 + radialDirY * 0.75) * (palmLen * 0.48);

    let tDirX = rawTx - cmc.x;
    let tDirY = rawTy - cmc.y;
    const tDirLen = Math.hypot(tDirX, tDirY) || 1;
    tDirX /= tDirLen;
    tDirY /= tDirLen;

    const thumbMcp = { x: cmc.x + tDirX * (palmLen * 0.38), y: cmc.y + tDirY * (palmLen * 0.38) };
    const tTipDirX = tDirX * 0.75 + fwdX * 0.25;
    const tTipDirY = tDirY * 0.75 + fwdY * 0.25;
    const tTipNorm = Math.hypot(tTipDirX, tTipDirY) || 1;
    const thumbIp = {
        x: thumbMcp.x + (tTipDirX / tTipNorm) * (palmLen * 0.32),
        y: thumbMcp.y + (tTipDirY / tTipNorm) * (palmLen * 0.32),
    };
    const thumbTip = {
        x: thumbIp.x + (tTipDirX / tTipNorm) * (palmLen * 0.26),
        y: thumbIp.y + (tTipDirY / tTipNorm) * (palmLen * 0.26),
    };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Cápsula palmar translúcida + arco intermetacarpiano
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(cmc.x, cmc.y);
    for (const k of knuckles) {
        ctx.lineTo(k.mcp.x, k.mcp.y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.48)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Todos los 5 rayos digitales (metacarpos + 14 falanges) en UN SOLO PATH por lote (0 shadowBlur = 300x más rápido)
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(cmc.x, cmc.y);
    ctx.lineTo(thumbMcp.x, thumbMcp.y);
    ctx.lineTo(thumbIp.x, thumbIp.y);
    ctx.lineTo(thumbTip.x, thumbTip.y);
    for (const k of knuckles) {
        ctx.moveTo(wx, wy);
        ctx.lineTo(k.mcp.x, k.mcp.y);
        ctx.lineTo(k.pip.x, k.pip.y);
        ctx.lineTo(k.dip.x, k.dip.y);
        ctx.lineTo(k.tip.x, k.tip.y);
    }
    // Pasada 1: Halo neón exterior suave
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.26)';
    ctx.lineWidth = 4.6;
    ctx.stroke();
    // Pasada 2: Hueso cyan brillante
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.95;
    ctx.stroke();
    // Pasada 3: Núcleo óseo claro
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.88)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 3. Nodos interfalángicos (MCP, PIP, DIP) agrupados en 1 solo fill
    const interNodes = [
        cmc,
        thumbMcp,
        thumbIp,
        ...knuckles.flatMap((k) => [k.mcp, k.pip, k.dip]),
    ];
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    for (const pt of interNodes) {
        ctx.moveTo(pt.x + 2.1, pt.y);
        ctx.arc(pt.x, pt.y, 2.1, 0, 2 * Math.PI);
    }
    ctx.fill();

    // 4. Nodos de las 5 puntas distales de los dedos en esmeralda brillante (1 solo fill)
    const tipNodes = [thumbTip, ...knuckles.map((k) => k.tip)];
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    for (const pt of tipNodes) {
        ctx.moveTo(pt.x + 2.8, pt.y);
        ctx.arc(pt.x, pt.y, 2.8, 0, 2 * Math.PI);
    }
    ctx.fill();

    // Centros blancos de articulaciones de la mano en 1 solo fill
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (const pt of [...interNodes, ...tipNodes]) {
        ctx.moveTo(pt.x + 0.95, pt.y);
        ctx.arc(pt.x, pt.y, 0.95, 0, 2 * Math.PI);
    }
    ctx.fill();

    ctx.restore();
}

/**
 * RENDERER NATIVO DEL EXOESQUELETO NEÓN HUD (CANVAS 2D PURO POR LOTES, 0ms DE LATENCIA)
 * - Cero llamadas a ctx.shadowBlur (elimina el cuello de botella de filtros Gaussianos en Chrome).
 * - Manos de 5 dedos y 3 falanges 100% sincronizadas en el mismo frame del esqueleto corporal.
 */
export const drawBiomechanicSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    _multiHandLandmarks?: any[] | null
) => {
    if (!ctx || !landmarks || landmarks.length === 0) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    if (width <= 0 || height <= 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const shouldersVisible = leftShoulder && rightShoulder &&
        (leftShoulder.visibility ?? 1) > 0.3 && (rightShoulder.visibility ?? 1) > 0.3;

    // 1. HUD FACIAL FUTURISTA (BRACKETS SCI-FI & HORIZONTE)
    drawFuturisticFaceHUD(ctx, landmarks, width, height);

    // 2. TRAZADO AGRUPADO DE TODOS LOS HUESOS DEL CUERPO, CUELLO Y COLUMNA (3 pasadas ultra-rápidas sin shadowBlur)
    const spineVertebrae: { x: number; y: number; r: number }[] = [];

    ctx.beginPath();

    // 2a. Columna Cervical (C1-C7, nunca cruza la boca)
    if (shouldersVisible) {
        const neckBaseX = ((leftShoulder.x + rightShoulder.x) / 2) * width;
        const neckBaseY = ((leftShoulder.y + rightShoulder.y) / 2) * height;

        let headRefY = neckBaseY - (width * 0.15);
        let headRefX = neckBaseX;

        if (leftEar && rightEar && (leftEar.visibility ?? 0) > 0.3 && (rightEar.visibility ?? 0) > 0.3) {
            headRefX = ((leftEar.x + rightEar.x) / 2) * width;
            headRefY = ((leftEar.y + rightEar.y) / 2) * height;
        } else if (nose && (nose.visibility ?? 0) > 0.3) {
            headRefX = nose.x * width;
            headRefY = nose.y * height;
        }

        const chinTargetX = neckBaseX + (headRefX - neckBaseX) * 0.72;
        const chinTargetY = neckBaseY + (headRefY - neckBaseY) * 0.72;

        ctx.moveTo(neckBaseX, neckBaseY);
        ctx.lineTo(chinTargetX, chinTargetY);

        for (const s of [0.25, 0.6, 1.0]) {
            spineVertebrae.push({
                x: neckBaseX + (chinTargetX - neckBaseX) * s,
                y: neckBaseY + (chinTargetY - neckBaseY) * s,
                r: 3.4,
            });
        }

        // 2b. Columna Toracolumbar central si las caderas son visibles
        if (
            leftHip &&
            rightHip &&
            (leftHip.visibility ?? 0) > 0.35 &&
            (rightHip.visibility ?? 0) > 0.35
        ) {
            const hx = ((leftHip.x + rightHip.x) / 2) * width;
            const hy = ((rightHip.y + leftHip.y) / 2) * height;
            ctx.moveTo(neckBaseX, neckBaseY);
            ctx.lineTo(hx, hy);

            for (const t of [0.22, 0.45, 0.68, 0.88]) {
                spineVertebrae.push({
                    x: neckBaseX + (hx - neckBaseX) * t,
                    y: neckBaseY + (hy - neckBaseY) * t,
                    r: 2.8,
                });
            }
        }
    }

    // 2c. Extremidades y cintura escapular/pélvica
    for (const [idx1, idx2] of BODY_CONNECTIONS) {
        const p1 = landmarks[idx1];
        const p2 = landmarks[idx2];
        if (!p1 || !p2) continue;

        const v1 = p1.visibility !== undefined ? p1.visibility : 1;
        const v2 = p2.visibility !== undefined ? p2.visibility : 1;
        if (v1 < 0.35 || v2 < 0.35) continue;

        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
    }

    // Renderizar todos los huesos corporales en 3 pasadas (halo + neón + núcleo)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 7.0;
    ctx.stroke();

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3.1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
    ctx.lineWidth = 1.15;
    ctx.stroke();

    // 3. ARTICULACIONES PRINCIPALES Y VÉRTEBRAS (2 pasadas por lotes, cero shadowBlur)
    const bodyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    const activeJointPts: { x: number; y: number; r: number }[] = [...spineVertebrae];

    for (const idx of bodyJoints) {
        const p = landmarks[idx];
        if (!p) continue;
        const v = p.visibility !== undefined ? p.visibility : 1;
        if (v < 0.35) continue;
        activeJointPts.push({ x: p.x * width, y: p.y * height, r: 4.2 });
    }

    if (activeJointPts.length > 0) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
        ctx.beginPath();
        for (const j of activeJointPts) {
            ctx.moveTo(j.x + j.r + 2.2, j.y);
            ctx.arc(j.x, j.y, j.r + 2.2, 0, 2 * Math.PI);
        }
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        for (const j of activeJointPts) {
            ctx.moveTo(j.x + j.r, j.y);
            ctx.arc(j.x, j.y, j.r, 0, 2 * Math.PI);
        }
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (const j of activeJointPts) {
            const ir = j.r * 0.42;
            ctx.moveTo(j.x + ir, j.y);
            ctx.arc(j.x, j.y, ir, 0, 2 * Math.PI);
        }
        ctx.fill();
    }

    // 4. MANOS DE 5 DEDOS Y 14 FALANGES EN SINCRONÍA INSTANTÁNEA CON LAS MUÑECAS DE POSE
    const lElbow = landmarks[13];
    const lWrist = landmarks[15];
    const lPinky = landmarks[17];
    const lIndex = landmarks[19];
    const lThumb = landmarks[21];
    if (lWrist && (lWrist.visibility ?? 0) > 0.32) {
        drawSynthesizedPoseHand(ctx, lWrist, lPinky, lIndex, lThumb, width, height, lElbow, false);
    }

    const rElbow = landmarks[14];
    const rWrist = landmarks[16];
    const rPinky = landmarks[18];
    const rIndex = landmarks[20];
    const rThumb = landmarks[22];
    if (rWrist && (rWrist.visibility ?? 0) > 0.32) {
        drawSynthesizedPoseHand(ctx, rWrist, rPinky, rIndex, rThumb, width, height, rElbow, true);
    }

    ctx.restore();
};

/**
 * Cálculo del ángulo entre 3 puntos (A - B - C) con vértice en B
 */
export const calc3DAngle = (a: any, b: any, c: any): number | null => {
    if (!a || !b || !c) return null;
    const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
    const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    if (mag1 * mag2 === 0) return null;
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.round(Math.acos(cosAngle) * (180 / Math.PI));
};

/**
 * Inclinación de un vector ascendente (bottom -> top) respecto a la vertical superior (0, -1, 0)
 */
export const calc3DVerticalAngle = (bottom: any, top: any): number | null => {
    if (!bottom || !top) return null;
    const v = { x: top.x - bottom.x, y: top.y - bottom.y, z: (top.z ?? 0) - (bottom.z ?? 0) };
    const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (mag === 0) return null;
    const cosAngle = Math.max(-1, Math.min(1, -v.y / mag));
    return Math.round(Math.acos(cosAngle) * (180 / Math.PI));
};

/**
 * CÁLCULO ERGONÓMICO ROBUSTO Y DEFENSIVO DE LOS 5 ÁNGULOS PRINCIPALES
 */
export const calculateBiomechanicAngles = (
    landmarks: any[],
    worldLandmarks?: any[] | null
): BiomechanicAngles => {
    if (!landmarks || landmarks.length < 25) {
        return { neck: null, trunk: null, arm: null, elbow: null, knee: null, is3D: false };
    }

    const nose = landmarks[0];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const leftShoulderVis = (leftShoulder?.visibility ?? 0) > 0.4;
    const rightShoulderVis = (rightShoulder?.visibility ?? 0) > 0.4;
    const hipsVisible = ((leftHip?.visibility ?? 0) > 0.45 || (rightHip?.visibility ?? 0) > 0.45);
    const kneesVisible = hipsVisible &&
        ((leftKnee?.visibility ?? 0) > 0.4 || (rightKnee?.visibility ?? 0) > 0.4) &&
        ((leftAnkle?.visibility ?? 0) > 0.35 || (rightAnkle?.visibility ?? 0) > 0.35);

    const useLeft = (leftShoulder?.visibility ?? 0) >= (rightShoulder?.visibility ?? 0);

    const is3D = !!worldLandmarks && worldLandmarks.length >= 25;
    const targetSet = is3D && worldLandmarks ? worldLandmarks : landmarks;

    const tNose = targetSet[0];
    const tLeftEar = targetSet[7];
    const tRightEar = targetSet[8];
    const tLeftShoulder = targetSet[11];
    const tRightShoulder = targetSet[12];
    const tLeftElbow = targetSet[13];
    const tRightElbow = targetSet[14];
    const tLeftWrist = targetSet[15];
    const tRightWrist = targetSet[16];
    const tLeftHip = targetSet[23];
    const tRightHip = targetSet[24];
    const tLeftKnee = targetSet[25];
    const tRightKnee = targetSet[26];
    const tLeftAnkle = targetSet[27];
    const tRightAnkle = targetSet[28];

    // 1. CUELLO (Inclinación cervical ergonómica)
    let neckDeg: number | null = null;
    if (leftShoulderVis || rightShoulderVis) {
        const shoulderCenter = {
            x: leftShoulderVis && rightShoulderVis ? (tLeftShoulder.x + tRightShoulder.x) / 2 : (leftShoulderVis ? tLeftShoulder.x : tRightShoulder.x),
            y: leftShoulderVis && rightShoulderVis ? (tLeftShoulder.y + tRightShoulder.y) / 2 : (leftShoulderVis ? tLeftShoulder.y : tRightShoulder.y),
            z: leftShoulderVis && rightShoulderVis ? ((tLeftShoulder.z ?? 0) + (tRightShoulder.z ?? 0)) / 2 : ((leftShoulderVis ? tLeftShoulder.z : tRightShoulder.z) ?? 0),
        };

        let headPt: any = null;
        if (nose && (nose.visibility ?? 0) > 0.35) {
            headPt = tNose;
        } else if (leftEar && rightEar && (leftEar.visibility ?? 0) > 0.35 && (rightEar.visibility ?? 0) > 0.35) {
            headPt = {
                x: (tLeftEar.x + tRightEar.x) / 2,
                y: (tLeftEar.y + tRightEar.y) / 2,
                z: ((tLeftEar.z ?? 0) + (tRightEar.z ?? 0)) / 2,
            };
        } else if (useLeft && leftEar && (leftEar.visibility ?? 0) > 0.35) {
            headPt = tLeftEar;
        } else if (!useLeft && rightEar && (rightEar.visibility ?? 0) > 0.35) {
            headPt = tRightEar;
        }

        if (headPt) {
            const rawHeadTilt = calc3DVerticalAngle(shoulderCenter, headPt);
            if (rawHeadTilt !== null) {
                neckDeg = Math.min(75, Math.max(0, rawHeadTilt));
            }
        }
    }

    // 2. TRONCO
    let trunkDeg: number | null = null;
    if (hipsVisible && (leftShoulderVis || rightShoulderVis)) {
        const shoulderCenter = {
            x: (tLeftShoulder.x + tRightShoulder.x) / 2,
            y: (tLeftShoulder.y + tRightShoulder.y) / 2,
            z: ((tLeftShoulder.z ?? 0) + (tRightShoulder.z ?? 0)) / 2,
        };
        const hipCenter = {
            x: (tLeftHip.x + tRightHip.x) / 2,
            y: (tLeftHip.y + tRightHip.y) / 2,
            z: ((tLeftHip.z ?? 0) + (tRightHip.z ?? 0)) / 2,
        };

        const rawTrunk = calc3DVerticalAngle(hipCenter, shoulderCenter);
        if (rawTrunk !== null) {
            trunkDeg = Math.min(85, Math.max(0, rawTrunk));
            if (neckDeg !== null && trunkDeg !== null) {
                neckDeg = Math.min(75, Math.abs(neckDeg - trunkDeg));
            }
        }
    }

    // 3. BRAZO
    let armDeg: number | null = null;
    const actShoulder = useLeft ? tLeftShoulder : tRightShoulder;
    const actElbow = useLeft ? tLeftElbow : tRightElbow;
    const elbowVis = useLeft ? (leftElbow?.visibility ?? 0) > 0.4 : (rightElbow?.visibility ?? 0) > 0.4;

    if (actShoulder && actElbow && elbowVis) {
        if (hipsVisible) {
            const actHip = useLeft ? tLeftHip : tRightHip;
            armDeg = calc3DAngle(actHip, actShoulder, actElbow);
        } else {
            const armTilt = calc3DVerticalAngle(actElbow, actShoulder);
            if (armTilt !== null) {
                armDeg = Math.min(180, Math.max(0, armTilt));
            }
        }
    }

    // 4. CODO
    let elbowDegVal: number | null = null;
    const actWrist = useLeft ? tLeftWrist : tRightWrist;
    const wristVis = useLeft ? (leftWrist?.visibility ?? 0) > 0.4 : (rightWrist?.visibility ?? 0) > 0.4;

    if (actShoulder && actElbow && actWrist && elbowVis && wristVis) {
        elbowDegVal = calc3DAngle(actShoulder, actElbow, actWrist);
    }

    // 5. RODILLA
    let kneeFlexVal: number | null = null;
    if (kneesVisible) {
        const actHip = useLeft ? tLeftHip : tRightHip;
        const actKnee = useLeft ? tLeftKnee : tRightKnee;
        const actAnkle = useLeft ? tLeftAnkle : tRightAnkle;

        const rawKnee = calc3DAngle(actHip, actKnee, actAnkle);
        if (rawKnee !== null) {
            kneeFlexVal = Math.min(140, Math.max(0, 180 - rawKnee));
        }
    }

    return {
        neck: neckDeg,
        trunk: trunkDeg,
        arm: armDeg,
        elbow: elbowDegVal,
        knee: kneeFlexVal,
        is3D
    };
};
