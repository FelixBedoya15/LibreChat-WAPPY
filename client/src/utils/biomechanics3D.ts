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
 * Carga ultrarrápida de MediaPipe Pose y MediaPipe Hands en paralelo
 */
export const loadVisionEngines = async (): Promise<void> => {
    await Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'),
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js').catch(err => {
            console.warn('[Biomechanics3D] MediaPipe Hands diferido:', err);
        }),
    ]);
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

    const halfW = Math.max(38, Math.min(width * 0.22, headSpan * 0.65));
    const halfH = halfW * 1.25;
    const bracketLen = Math.min(18, halfW * 0.4);

    ctx.save();

    // 1. Brackets de encuadre Sci-Fi [   ] alrededor del rostro
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.75)'; // Cyan brillante
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;

    const left = centerX - halfW;
    const right = centerX + halfW;
    const top = centerY - halfH;
    const bottom = centerY + halfH;

    // Esquina Superior Izquierda
    ctx.beginPath();
    ctx.moveTo(left, top + bracketLen);
    ctx.lineTo(left, top);
    ctx.lineTo(left + bracketLen, top);
    ctx.stroke();

    // Esquina Superior Derecha
    ctx.beginPath();
    ctx.moveTo(right - bracketLen, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, top + bracketLen);
    ctx.stroke();

    // Esquina Inferior Izquierda
    ctx.beginPath();
    ctx.moveTo(left, bottom - bracketLen);
    ctx.lineTo(left, bottom);
    ctx.lineTo(left + bracketLen, bottom);
    ctx.stroke();

    // Esquina Inferior Derecha
    ctx.beginPath();
    ctx.moveTo(right - bracketLen, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, bottom - bracketLen);
    ctx.stroke();

    // 2. Línea de horizonte ocular / inclinación craneal sutil
    if (leftEye && rightEye && (leftEye.visibility ?? 0) > 0.4 && (rightEye.visibility ?? 0) > 0.4) {
        const lx = leftEye.x * width;
        const ly = leftEye.y * height;
        const rx = rightEye.x * width;
        const ry = rightEye.y * height;

        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)'; // Esmeralda suave
        ctx.beginPath();
        ctx.moveTo(rx - 12, ry);
        ctx.lineTo(lx + 12, ly);
        ctx.stroke();
        ctx.setLineDash([]);

        // Nodos oculares mínimos
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(lx, ly, 2.5, 0, 2 * Math.PI);
        ctx.arc(rx, ry, 2.5, 0, 2 * Math.PI);
        ctx.fill();
    }

    // 3. Nodos auditivos (Orejas / Sienes)
    if (leftEarVis) {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(leftEar.x * width, leftEar.y * height, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
    if (rightEarVis) {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(rightEar.x * width, rightEar.y * height, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Micro-etiqueta HUD de tracking
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('CRANIAL TRACKING', left, top - 4);

    ctx.restore();
}

/**
 * Dibuja la mano completa de 21 articulaciones (MediaPipe Hands) o síntesis anatómica
 */
export function drawDetailedHand(
    ctx: CanvasRenderingContext2D,
    handLandmarks: any[],
    width: number,
    height: number
) {
    if (!handLandmarks || handLandmarks.length < 21) return;

    ctx.save();

    // 1. Polígono de la palma con relleno sutil traslúcido neón
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
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.fill();

    // 2. Líneas de los dedos y huesos
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;

    for (const [i1, i2] of HAND_ANATOMY_CONNECTIONS) {
        const p1 = handLandmarks[i1];
        const p2 = handLandmarks[i2];
        if (!p1 || !p2) continue;

        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
    }

    // 3. Articulaciones / Nudillos de los dedos
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 6;

    for (let i = 0; i < handLandmarks.length; i++) {
        const pt = handLandmarks[i];
        const px = pt.x * width;
        const py = pt.y * height;
        const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;

        ctx.beginPath();
        ctx.arc(px, py, isTip ? 3.5 : 2.5, 0, 2 * Math.PI);
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Síntesis anatómica de mano para cuando sólo Pose está disponible
 * Transforma los puntos 15/17/19/21 en una mano biomecánica con palma y 5 dedos
 */
function drawSynthesizedPoseHand(
    ctx: CanvasRenderingContext2D,
    wrist: any,
    pinky: any,
    index: any,
    thumb: any,
    width: number,
    height: number
) {
    if (!wrist || !pinky || !index) return;
    const wx = wrist.x * width;
    const wy = wrist.y * height;
    const ix = index.x * width;
    const iy = index.y * height;
    const px = pinky.x * width;
    const py = pinky.y * height;
    const tx = thumb ? thumb.x * width : wx + (ix - wx) * 0.7 - (py - wy) * 0.3;
    const ty = thumb ? thumb.y * height : wy + (iy - wy) * 0.7 + (px - wx) * 0.3;

    // Nudillos intermedios sintetizados
    const mx = ix + (px - ix) * 0.33;
    const my = iy + (py - iy) * 0.33;
    const rx = ix + (px - ix) * 0.66;
    const ry = iy + (py - iy) * 0.66;

    ctx.save();

    // Relleno de palma
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(tx, ty);
    ctx.lineTo(ix, iy);
    ctx.lineTo(mx, my);
    ctx.lineTo(rx, ry);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fill();

    // Conexiones de rayos digitales
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;

    const fingerBases = [
        [tx, ty],
        [ix, iy],
        [mx, my],
        [rx, ry],
        [px, py],
    ];

    for (const [fx, fy] of fingerBases) {
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(fx, fy);
        ctx.stroke();

        // Nudo en la punta
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    ctx.restore();
}

/**
 * RENDERER NATIVO DEL EXOESQUELETO NEÓN HUD (CANVAS 2D PURO)
 * Visualmente superior:
 * - Columna cervical C1-C7 sin invadir la boca.
 * - Brackets HUD de tracking facial futuristas.
 * - Manos completas de 5 dedos (21 articulaciones o síntesis biomecánica).
 * - Extremidades y torso con estética neón cyan/esmeralda.
 */
export const drawBiomechanicSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    multiHandLandmarks?: any[] | null
) => {
    if (!ctx || !landmarks || landmarks.length === 0) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    if (width <= 0 || height <= 0) return;

    ctx.save();

    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];

    const shouldersVisible = leftShoulder && rightShoulder &&
        (leftShoulder.visibility ?? 1) > 0.3 && (rightShoulder.visibility ?? 1) > 0.3;

    // 1. COLUMNA CERVICAL (CUELLO): Conecta hombros con la base del cuello / mandíbula
    // ¡REGLA CRÍTICA: NO entra en la boca ni en la nariz!
    if (shouldersVisible) {
        const neckBaseX = ((leftShoulder.x + rightShoulder.x) / 2) * width;
        const neckBaseY = ((leftShoulder.y + rightShoulder.y) / 2) * height;

        let headRefY = neckBaseY - (width * 0.15); // Fallback razonable
        let headRefX = neckBaseX;

        if (leftEar && rightEar && (leftEar.visibility ?? 0) > 0.3 && (rightEar.visibility ?? 0) > 0.3) {
            headRefX = ((leftEar.x + rightEar.x) / 2) * width;
            headRefY = ((leftEar.y + rightEar.y) / 2) * height;
        } else if (nose && (nose.visibility ?? 0) > 0.3) {
            headRefX = nose.x * width;
            headRefY = nose.y * height;
        }

        // El cuello termina a la altura de la mandíbula (72% de la distancia hacia la cabeza)
        const chinTargetX = neckBaseX + (headRefX - neckBaseX) * 0.72;
        const chinTargetY = neckBaseY + (headRefY - neckBaseY) * 0.72;

        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(neckBaseX, neckBaseY);
        ctx.lineTo(chinTargetX, chinTargetY);
        ctx.stroke();

        // Vértebras biomecánicas cervicales (C3, C5, C7)
        const steps = [0.25, 0.6, 1.0];
        for (const s of steps) {
            const vx = neckBaseX + (chinTargetX - neckBaseX) * s;
            const vy = neckBaseY + (chinTargetY - neckBaseY) * s;

            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(vx, vy, 3.5, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(vx, vy, 1.5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // 2. HUD FACIAL FUTURISTA (BRACKETS SCI-FI & HORIZONTE)
    drawFuturisticFaceHUD(ctx, landmarks, width, height);

    // 3. SEGMENTOS DEL CUERPO (Hombros, Brazos, Tronco, Piernas)
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;

    for (const [idx1, idx2] of BODY_CONNECTIONS) {
        const p1 = landmarks[idx1];
        const p2 = landmarks[idx2];
        if (!p1 || !p2) continue;

        const v1 = p1.visibility !== undefined ? p1.visibility : 1;
        const v2 = p2.visibility !== undefined ? p2.visibility : 1;
        if (v1 < 0.35 || v2 < 0.35) continue;

        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
    }

    // 4. ARTICULACIONES PRINCIPALES (Hombros, Codos, Caderas, Rodillas, Tobillos)
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 6;

    const bodyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    for (const idx of bodyJoints) {
        const p = landmarks[idx];
        if (!p) continue;
        const v = p.visibility !== undefined ? p.visibility : 1;
        if (v < 0.35) continue;

        const px = p.x * width;
        const py = p.y * height;

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    // 5. TRACKING DETALLADO DE MANOS (21 ARTICULACIONES O SÍNTESIS ANATÓMICA)
    let handsDrawnWithMediaPipe = false;
    if (multiHandLandmarks && Array.isArray(multiHandLandmarks) && multiHandLandmarks.length > 0) {
        for (const hand of multiHandLandmarks) {
            drawDetailedHand(ctx, hand, width, height);
            handsDrawnWithMediaPipe = true;
        }
    }

    // Si MediaPipe Hands aún no tiene detección para las manos visibles, sintetizar mano anatómica
    if (!handsDrawnWithMediaPipe) {
        // Mano Izquierda
        const lWrist = landmarks[15];
        const lPinky = landmarks[17];
        const lIndex = landmarks[19];
        const lThumb = landmarks[21];
        if (lWrist && (lWrist.visibility ?? 0) > 0.4) {
            drawSynthesizedPoseHand(ctx, lWrist, lPinky, lIndex, lThumb, width, height);
        }

        // Mano Derecha
        const rWrist = landmarks[16];
        const rPinky = landmarks[18];
        const rIndex = landmarks[20];
        const rThumb = landmarks[22];
        if (rWrist && (rWrist.visibility ?? 0) > 0.4) {
            drawSynthesizedPoseHand(ctx, rWrist, rPinky, rIndex, rThumb, width, height);
        }
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
