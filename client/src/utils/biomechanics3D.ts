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

import { safeGetItem, safeSetItem } from '~/utils/safeStorage';

export interface BiomechanicAngles {
    neck: number | null;
    trunk: number | null;
    arm: number | null;
    elbow: number | null;
    knee: number | null;
    wrist?: number | null;
    jawOpen?: number;
    is3D: boolean;
}

export type BiomechanicVisionMode = 'xray_3d' | 'neon_2d';
export type BiomechanicShaderStyle = 'xray_fresnel' | 'clinical_solid';

export interface BiomechanicLayersConfig {
    skull: boolean;
    spine: boolean;
    upperLimbs: boolean;
    lowerLimbs: boolean;
    clinicalLabels: boolean;
}

export interface BiomechanicVisionConfig {
    mode: BiomechanicVisionMode;
    shaderStyle: BiomechanicShaderStyle;
    opacity: number;
    layers: BiomechanicLayersConfig;
}

export const BIOMECH_STORAGE_KEY = 'wappy_biomech_xray_config_v1';
export const BIOMECH_CONFIG_EVENT = 'wappy-biomech-config-change';

export const DEFAULT_BIOMECH_VISION_CONFIG: BiomechanicVisionConfig = {
    mode: 'xray_3d',
    shaderStyle: 'xray_fresnel',
    opacity: 0.88,
    layers: {
        skull: true,
        spine: true,
        upperLimbs: true,
        lowerLimbs: true,
        clinicalLabels: true,
    },
};

export function normalizeBiomechanicConfig(raw: any): BiomechanicVisionConfig {
    if (!raw || typeof raw !== 'object') {
        return {
            ...DEFAULT_BIOMECH_VISION_CONFIG,
            layers: { ...DEFAULT_BIOMECH_VISION_CONFIG.layers },
        };
    }
    const mode: BiomechanicVisionMode = raw.mode === 'neon_2d' ? 'neon_2d' : 'xray_3d';
    const shaderStyle: BiomechanicShaderStyle =
        raw.shaderStyle === 'clinical_solid' ? 'clinical_solid' : 'xray_fresnel';
    const numOpacity = Number(raw.opacity);
    const opacity = Number.isFinite(numOpacity)
        ? Math.min(1, Math.max(0.3, numOpacity))
        : DEFAULT_BIOMECH_VISION_CONFIG.opacity;
    const rawLayers = raw.layers && typeof raw.layers === 'object' ? raw.layers : {};
    return {
        mode,
        shaderStyle,
        opacity,
        layers: {
            skull: rawLayers.skull !== undefined ? Boolean(rawLayers.skull) : true,
            spine: rawLayers.spine !== undefined ? Boolean(rawLayers.spine) : true,
            upperLimbs: rawLayers.upperLimbs !== undefined ? Boolean(rawLayers.upperLimbs) : true,
            lowerLimbs: rawLayers.lowerLimbs !== undefined ? Boolean(rawLayers.lowerLimbs) : true,
            clinicalLabels: rawLayers.clinicalLabels !== undefined ? Boolean(rawLayers.clinicalLabels) : true,
        },
    };
}

let inMemoryBiomechConfig: BiomechanicVisionConfig | null = null;

export function getBiomechanicVisionConfig(): BiomechanicVisionConfig {
    if (typeof window === 'undefined') {
        return {
            ...DEFAULT_BIOMECH_VISION_CONFIG,
            layers: { ...DEFAULT_BIOMECH_VISION_CONFIG.layers },
        };
    }
    try {
        const stored = safeGetItem(BIOMECH_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const normalized = normalizeBiomechanicConfig(parsed);
            inMemoryBiomechConfig = normalized;
            return normalized;
        }
    } catch {
        // fallback to memory or default
    }
    if (inMemoryBiomechConfig) {
        return {
            ...inMemoryBiomechConfig,
            layers: { ...inMemoryBiomechConfig.layers },
        };
    }
    return {
        ...DEFAULT_BIOMECH_VISION_CONFIG,
        layers: { ...DEFAULT_BIOMECH_VISION_CONFIG.layers },
    };
}

export function saveBiomechanicVisionConfig(next: BiomechanicVisionConfig): BiomechanicVisionConfig {
    const normalized = normalizeBiomechanicConfig(next);
    inMemoryBiomechConfig = normalized;
    if (typeof window !== 'undefined') {
        safeSetItem(BIOMECH_STORAGE_KEY, JSON.stringify(normalized));
        try {
            window.dispatchEvent(new CustomEvent(BIOMECH_CONFIG_EVENT, { detail: normalized }));
        } catch {
            // ignore event dispatch errors in restricted environments
        }
    }
    return normalized;
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

let visionWasmFilesetPromise: Promise<any> | null = null;
const getVisionWasmFileset = async (tasksVision: any): Promise<any> => {
    if (!tasksVision?.FilesetResolver) return null;
    if (!visionWasmFilesetPromise) {
        visionWasmFilesetPromise = tasksVision.FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        ).catch((err: unknown) => {
            visionWasmFilesetPromise = null;
            throw err;
        });
    }
    return visionWasmFilesetPromise;
};

export const initPoseLandmarker = async (tasksVision: any) => {
    if (!tasksVision || !tasksVision.FilesetResolver || !tasksVision.PoseLandmarker) return null;
    try {
        const vision = await getVisionWasmFileset(tasksVision);
        if (!vision) return null;
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

export interface AuxiliaryVisionTrackers {
    detectStep: (
        video: HTMLVideoElement,
        timestampMs?: number
    ) => { multiHandLandmarks: any[][] | null; jawOpen: number };
    close: () => void;
}

/**
 * Inicializador ligero opcional para HandLandmarker (21 pts manos + túnel carpiano)
 * y FaceLandmarker (apertura mandibular ATM en tiempo real con blendshape jawOpen).
 * Se ejecuta en cadencia alternada (~15-20 FPS) sin bloquear PoseLandmarker y degrada
 * silenciosamente si algún modelo tarda o falla en red.
 */
export const initAuxiliaryVisionTrackers = async (
    _video?: HTMLVideoElement | null
): Promise<AuxiliaryVisionTrackers | null> => {
    try {
        const tasksVision =
            (typeof window !== 'undefined' && (window as any).MediaPipeTasksVision) ||
            (await loadTasksVision());
        if (!tasksVision || !tasksVision.FilesetResolver) return null;

        const vision = await getVisionWasmFileset(tasksVision);
        if (!vision) return null;

        let handLandmarker: any = null;
        let faceLandmarker: any = null;

        const createHandPromise = (async () => {
            if (!tasksVision.HandLandmarker) return;
            try {
                handLandmarker = await tasksVision.HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath:
                            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                        delegate: 'GPU',
                    },
                    runningMode: 'VIDEO',
                    numHands: 2,
                    minHandDetectionConfidence: 0.45,
                    minHandPresenceConfidence: 0.45,
                    minTrackingConfidence: 0.45,
                });
            } catch {
                try {
                    handLandmarker = await tasksVision.HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath:
                                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                        },
                        runningMode: 'VIDEO',
                        numHands: 2,
                    });
                } catch {
                    handLandmarker = null;
                }
            }
        })();

        const createFacePromise = (async () => {
            if (!tasksVision.FaceLandmarker) return;
            try {
                faceLandmarker = await tasksVision.FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath:
                            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        delegate: 'GPU',
                    },
                    runningMode: 'VIDEO',
                    numFaces: 1,
                    outputFaceBlendshapes: true,
                    minFaceDetectionConfidence: 0.45,
                    minFacePresenceConfidence: 0.45,
                    minTrackingConfidence: 0.45,
                });
            } catch {
                try {
                    faceLandmarker = await tasksVision.FaceLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath:
                                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        },
                        runningMode: 'VIDEO',
                        numFaces: 1,
                        outputFaceBlendshapes: true,
                    });
                } catch {
                    faceLandmarker = null;
                }
            }
        })();

        await Promise.allSettled([createHandPromise, createFacePromise]);
        if (!handLandmarker && !faceLandmarker) return null;

        let stepCounter = 0;
        let lastHandTs = 0;
        let lastFaceTs = 0;
        let lastAuxRunWall = 0;
        let cachedHands: any[][] | null = null;
        let cachedHandsAt = 0;
        let cachedJawOpen = 0;
        let closed = false;

        return {
            detectStep: (video: HTMLVideoElement, timestampMs?: number) => {
                if (closed || !video || video.readyState < 2 || !video.videoWidth) {
                    return { multiHandLandmarks: cachedHands, jawOpen: cachedJawOpen };
                }
                const nowPerf = typeof timestampMs === 'number' ? timestampMs : performance.now();
                // Cadencia ligera (~18 FPS máx) alternando manos y rostro para 0 bloqueo
                if (nowPerf - lastAuxRunWall < 52) {
                    return { multiHandLandmarks: cachedHands, jawOpen: cachedJawOpen };
                }
                lastAuxRunWall = nowPerf;
                const runHands = (stepCounter++ % 2 === 0 && Boolean(handLandmarker)) || !faceLandmarker;

                if (runHands && handLandmarker) {
                    try {
                        const ts = Math.max(lastHandTs + 1, Math.floor(nowPerf));
                        lastHandTs = ts;
                        const hRes = handLandmarker.detectForVideo(video, ts);
                        const detected = hRes?.landmarks || hRes?.multiHandLandmarks;
                        if (Array.isArray(detected) && detected.length > 0) {
                            cachedHands = detected;
                            cachedHandsAt = nowPerf;
                        } else if (nowPerf - cachedHandsAt > 450) {
                            cachedHands = null;
                        }
                    } catch {
                        // Degradar silenciosamente
                    }
                } else if (faceLandmarker) {
                    try {
                        const ts = Math.max(lastFaceTs + 1, Math.floor(nowPerf));
                        lastFaceTs = ts;
                        const fRes = faceLandmarker.detectForVideo(video, ts);
                        const categories = fRes?.faceBlendshapes?.[0]?.categories;
                        let nextJaw = 0;
                        if (Array.isArray(categories)) {
                            const jawCat = categories.find(
                                (c: any) => c?.categoryName === 'jawOpen'
                            );
                            if (jawCat && typeof jawCat.score === 'number') {
                                nextJaw = Math.min(1, Math.max(0, jawCat.score));
                            }
                        } else if (Array.isArray(fRes?.faceLandmarks?.[0])) {
                            const fl = fRes.faceLandmarks[0];
                            if (fl[13] && fl[14] && fl[10] && fl[152]) {
                                const faceH = Math.hypot(fl[152].x - fl[10].x, fl[152].y - fl[10].y) || 0.2;
                                const lipGap = Math.hypot(fl[14].x - fl[13].x, fl[14].y - fl[13].y);
                                nextJaw = Math.min(1, Math.max(0, (lipGap / faceH - 0.02) * 4.2));
                            }
                        }
                        cachedJawOpen = cachedJawOpen * 0.35 + nextJaw * 0.65;
                    } catch {
                        // Degradar silenciosamente
                    }
                }

                return { multiHandLandmarks: cachedHands, jawOpen: cachedJawOpen };
            },
            close: () => {
                closed = true;
                if (handLandmarker) {
                    try {
                        handLandmarker.close();
                    } catch {
                        // ignore
                    }
                    handLandmarker = null;
                }
                if (faceLandmarker) {
                    try {
                        faceLandmarker.close();
                    } catch {
                        // ignore
                    }
                    faceLandmarker = null;
                }
            },
        };
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

    // 1. VISOR HUD CRANEAL OVALADO ANATÓMICO (Simulando el contorno facial)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(headAngle);

    // Anillo exterior orbital punteado
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)'; // Esmeralda sutil
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX * 1.08, radiusY * 1.08, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Elipse facial base con resplandor neón
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.75)'; // Cyan brillante
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Arcos de acento biométrico (Frente, Mentón, Pómulos)
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = '#06b6d4';
    // Bóveda craneal superior (Frente)
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, -Math.PI * 0.65, -Math.PI * 0.35);
    ctx.stroke();
    // Mentón / Mandíbula inferior
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, Math.PI * 0.35, Math.PI * 0.65);
    ctx.stroke();
    // Sienes / Pómulos laterales
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, -Math.PI * 0.12, Math.PI * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, Math.PI * 0.88, Math.PI * 1.12);
    ctx.stroke();

    // Ticks tácticos en los 4 polos cardinales del óvalo
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
    // Polo norte
    ctx.beginPath();
    ctx.moveTo(0, -radiusY - 4);
    ctx.lineTo(0, -radiusY + 4);
    ctx.stroke();
    // Polo sur (mentón)
    ctx.beginPath();
    ctx.moveTo(0, radiusY - 4);
    ctx.lineTo(0, radiusY + 4);
    ctx.stroke();
    // Polo oeste
    ctx.beginPath();
    ctx.moveTo(-radiusX - 4, 0);
    ctx.lineTo(-radiusX + 4, 0);
    ctx.stroke();
    // Polo este
    ctx.beginPath();
    ctx.moveTo(radiusX - 4, 0);
    ctx.lineTo(radiusX + 4, 0);
    ctx.stroke();

    // Micro-etiqueta HUD de tracking craneal sobre el polo superior
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.95)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'center';
    ctx.fillText('CRANIAL TRACKING • OVAL HUD', 0, -radiusY - 9);

    ctx.restore();

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
    worldLandmarks?: any[] | null,
    multiHandLandmarks?: any[] | null,
    jawOpenValue?: number
): BiomechanicAngles => {
    if (!landmarks || landmarks.length < 25) {
        return {
            neck: null,
            trunk: null,
            arm: null,
            elbow: null,
            knee: null,
            wrist: null,
            jawOpen: jawOpenValue ?? 0,
            is3D: false,
        };
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

    // 6. MUÑECA / TÚNEL CARPIANO (Extensión / desviación radiocarpiana RULA)
    let wristDegVal: number | null = null;
    const evalSingleWrist = (
        poseElbow2D: any,
        poseWrist2D: any,
        poseIndex2D: any,
        posePinky2D: any
    ): number | null => {
        if (!poseElbow2D || !poseWrist2D) return null;
        if ((poseElbow2D.visibility ?? 0) < 0.35 || (poseWrist2D.visibility ?? 0) < 0.35) {
            return null;
        }
        // Intentar cruzar con la mano detallada de 21 puntos más cercana
        if (Array.isArray(multiHandLandmarks) && multiHandLandmarks.length > 0) {
            let bestHand: any[] | null = null;
            let bestDist = 0.16;
            for (const h of multiHandLandmarks) {
                if (!Array.isArray(h) || h.length < 18 || !h[0]) continue;
                const d = Math.hypot(h[0].x - poseWrist2D.x, h[0].y - poseWrist2D.y);
                if (d < bestDist) {
                    bestDist = d;
                    bestHand = h;
                }
            }
            if (bestHand && bestHand[9]) {
                const rawAng = calc3DAngle(poseElbow2D, bestHand[0], bestHand[9]);
                if (rawAng !== null) {
                    return Math.min(75, Math.max(0, Math.abs(180 - rawAng)));
                }
            }
        }
        // Respaldo anatómico con índices metacarpianos de MediaPipe Pose (17/19 o 18/20)
        if (
            poseIndex2D &&
            posePinky2D &&
            (poseIndex2D.visibility ?? 0) > 0.45 &&
            (posePinky2D.visibility ?? 0) > 0.45
        ) {
            const handMid = {
                x: (poseIndex2D.x + posePinky2D.x) / 2,
                y: (poseIndex2D.y + posePinky2D.y) / 2,
                z: ((poseIndex2D.z ?? 0) + (posePinky2D.z ?? 0)) / 2,
            };
            const rawAng = calc3DAngle(poseElbow2D, poseWrist2D, handMid);
            if (rawAng !== null) {
                return Math.min(65, Math.max(0, Math.abs(180 - rawAng)));
            }
        }
        return null;
    };

    const wristL = evalSingleWrist(leftElbow, leftWrist, landmarks[19], landmarks[17]);
    const wristR = evalSingleWrist(rightElbow, rightWrist, landmarks[20], landmarks[18]);
    if (wristL !== null && wristR !== null) {
        wristDegVal = Math.max(wristL, wristR);
    } else {
        wristDegVal = wristL ?? wristR;
    }

    return {
        neck: neckDeg,
        trunk: trunkDeg,
        arm: armDeg,
        elbow: elbowDegVal,
        knee: kneeFlexVal,
        wrist: wristDegVal,
        jawOpen: jawOpenValue ?? 0,
        is3D,
    };
};

export interface ClinicalXRayLabelOptions {
    layers?: Partial<BiomechanicLayersConfig>;
    multiHandLandmarks?: any[][] | null;
    jawOpen?: number;
}

/**
 * Dibuja callouts clínicos limpios en español sobre el Canvas 2D cuando
 * layers.clinicalLabels === true en modo Rayos X 3D.
 */
export const drawClinicalXRayLabels = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    angles: Partial<BiomechanicAngles>,
    options?: ClinicalXRayLabelOptions
) => {
    if (!ctx || !Array.isArray(landmarks) || landmarks.length < 25) return;
    const layers = options?.layers || DEFAULT_BIOMECH_VISION_CONFIG.layers;
    if (layers.clinicalLabels === false) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    if (width <= 0 || height <= 0) return;

    const scale = Math.max(0.78, Math.min(1.22, width / 640));
    const fontSize = Math.round(10.5 * scale);
    const padX = Math.round(7 * scale);
    const pillH = Math.round(20 * scale);
    const minYMargin = Math.round(48 * scale);
    const maxYMargin = height - Math.round(52 * scale);

    type CalloutTone = 'normal' | 'warn' | 'critical';
    interface CalloutItem {
        anchorX: number;
        anchorY: number;
        side: 'left' | 'right';
        text: string;
        tone: CalloutTone;
    }

    const items: CalloutItem[] = [];

    const nose = landmarks[0];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    const shouldersVis =
        leftShoulder &&
        rightShoulder &&
        (leftShoulder.visibility ?? 0) > 0.35 &&
        (rightShoulder.visibility ?? 0) > 0.35;

    // 1. Cráneo / ATM
    if (layers.skull !== false) {
        let headX: number | null = null;
        let headY: number | null = null;
        if (leftEar && rightEar && (leftEar.visibility ?? 0) > 0.35 && (rightEar.visibility ?? 0) > 0.35) {
            headX = ((leftEar.x + rightEar.x) / 2) * width;
            headY = ((leftEar.y + rightEar.y) / 2) * height;
        } else if (nose && (nose.visibility ?? 0) > 0.35) {
            headX = nose.x * width;
            headY = nose.y * height;
        }
        if (headX !== null && headY !== null) {
            const jaw = options?.jawOpen ?? angles.jawOpen ?? 0;
            items.push({
                anchorX: headX,
                anchorY: headY - 12 * scale,
                side: headX > width * 0.52 ? 'left' : 'right',
                text: jaw > 0.22 ? 'Cráneo / ATM Activa' : 'Cráneo / ATM',
                tone: 'normal',
            });
        }
    }

    // 2. Columna Cervical C5-C7 y Lumbar L4-S1
    if (layers.spine !== false && shouldersVis) {
        const neckBaseX = ((leftShoulder.x + rightShoulder.x) / 2) * width;
        const neckBaseY = ((leftShoulder.y + rightShoulder.y) / 2) * height;
        const neckVal = angles.neck ?? null;
        if (neckVal !== null) {
            const tone: CalloutTone =
                neckVal > 25 ? 'critical' : neckVal > 10 ? 'warn' : 'normal';
            const text =
                tone === 'critical'
                    ? `⚠️ C5-C7 Sobrecarga (${neckVal}°)`
                    : tone === 'warn'
                      ? `⚠️ C5-C7 Flexión (${neckVal}°)`
                      : `C1-C7 Alineada (${neckVal}°)`;
            items.push({
                anchorX: neckBaseX,
                anchorY: neckBaseY - 10 * scale,
                side: 'right',
                text,
                tone,
            });
        }

        const hipsVis =
            leftHip &&
            rightHip &&
            ((leftHip.visibility ?? 0) > 0.35 || (rightHip.visibility ?? 0) > 0.35);
        const shoulderSpanPx = Math.max(
            Math.hypot(
                (leftShoulder.x - rightShoulder.x) * width,
                (leftShoulder.y - rightShoulder.y) * height
            ),
            height * 0.18
        );
        const lumbarX = hipsVis
            ? ((leftHip.x + rightHip.x) / 2) * width
            : neckBaseX;
        const lumbarY = hipsVis
            ? (neckBaseY * 0.25 + ((leftHip.y + rightHip.y) / 2) * height * 0.75)
            : Math.min(height - 64 * scale, neckBaseY + shoulderSpanPx * 1.12);

        const trunkVal = angles.trunk ?? null;
        if (trunkVal !== null) {
            const tone: CalloutTone =
                trunkVal > 22 ? 'critical' : trunkVal > 8 ? 'warn' : 'normal';
            const text =
                tone === 'critical'
                    ? `⚠️ L4-S1 Compresión (${trunkVal}°)`
                    : tone === 'warn'
                      ? `⚠️ L4-S1 Carga (${trunkVal}°)`
                      : `L1-S1 Neutra (${trunkVal}°)`;
            items.push({
                anchorX: lumbarX,
                anchorY: lumbarY,
                side: 'left',
                text,
                tone,
            });
        }
    }

    // 3. Brazos y Túnel Carpiano
    if (layers.upperLimbs !== false) {
        const wristVal = angles.wrist ?? null;
        const activeWrist =
            rightWrist && (rightWrist.visibility ?? 0) >= (leftWrist?.visibility ?? 0) && (rightWrist.visibility ?? 0) > 0.35
                ? rightWrist
                : leftWrist && (leftWrist.visibility ?? 0) > 0.35
                  ? leftWrist
                  : null;

        if (activeWrist && wristVal !== null) {
            const wx = activeWrist.x * width;
            const wy = activeWrist.y * height;
            const tone: CalloutTone =
                wristVal > 25 ? 'critical' : wristVal > 15 ? 'warn' : 'normal';
            const text =
                tone === 'critical'
                    ? `⚠️ Túnel Carpiano (${wristVal}°)`
                    : tone === 'warn'
                      ? `⚠️ Túnel Carpiano (${wristVal}°)`
                      : `Carpo (${wristVal}°)`;
            items.push({
                anchorX: wx,
                anchorY: wy,
                side: wx < width * 0.5 ? 'left' : 'right',
                text,
                tone,
            });
        } else if (shouldersVis && angles.arm !== null && angles.arm !== undefined && angles.arm > 45) {
            const sx = leftShoulder.x * width;
            const sy = leftShoulder.y * height;
            items.push({
                anchorX: sx,
                anchorY: sy + 8 * scale,
                side: sx < width * 0.5 ? 'left' : 'right',
                text: `⚠️ Hombro Abducción (${angles.arm}°)`,
                tone: 'critical',
            });
        }
    }

    // 4. Tren Inferior (REBA/OWAS)
    if (layers.lowerLimbs !== false && angles.knee !== null && angles.knee !== undefined && angles.knee > 25) {
        const actKnee =
            leftKnee && (leftKnee.visibility ?? 0) >= (rightKnee?.visibility ?? 0) && (leftKnee.visibility ?? 0) > 0.35
                ? leftKnee
                : rightKnee && (rightKnee.visibility ?? 0) > 0.35
                  ? rightKnee
                  : null;
        if (actKnee) {
            const kx = actKnee.x * width;
            const ky = actKnee.y * height;
            const tone: CalloutTone = angles.knee > 60 ? 'critical' : 'warn';
            items.push({
                anchorX: kx,
                anchorY: ky,
                side: kx < width * 0.5 ? 'left' : 'right',
                text: `⚠️ Rodilla (${angles.knee}°)`,
                tone,
            });
        }
    }

    if (items.length === 0) return;

    ctx.save();
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textBaseline = 'middle';

    const usedYBySide: { left: number[]; right: number[] } = { left: [], right: [] };

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };

    for (const item of items) {
        const palette =
            item.tone === 'critical'
                ? {
                      stroke: '#EF4444',
                      bg: 'rgba(40, 8, 12, 0.86)',
                      text: '#FCA5A5',
                      dot: '#EF4444',
                  }
                : item.tone === 'warn'
                  ? {
                        stroke: '#F59E0B',
                        bg: 'rgba(38, 22, 6, 0.86)',
                        text: '#FDE68A',
                        dot: '#F59E0B',
                    }
                  : {
                        stroke: 'rgba(0, 212, 255, 0.65)',
                        bg: 'rgba(7, 20, 36, 0.80)',
                        text: '#A5F3FC',
                        dot: '#00D4FF',
                    };

        const textW = ctx.measureText(item.text).width;
        const boxW = textW + padX * 2;
        const dir = item.side === 'right' ? 1 : -1;
        const elbowDx = 20 * scale * dir;
        let boxYCenter = Math.max(minYMargin, Math.min(maxYMargin, item.anchorY - 8 * scale));

        // Evitar solapamiento vertical con otras etiquetas del mismo lado
        const sideList = usedYBySide[item.side];
        for (let attempt = 0; attempt < 5; attempt++) {
            const collision = sideList.find((y) => Math.abs(y - boxYCenter) < pillH + 5);
            if (collision === undefined) break;
            boxYCenter = Math.min(maxYMargin, collision + pillH + 6);
        }
        sideList.push(boxYCenter);

        let boxX =
            item.side === 'right'
                ? item.anchorX + elbowDx + 8 * scale
                : item.anchorX + elbowDx - 8 * scale - boxW;
        boxX = Math.max(8, Math.min(width - boxW - 8, boxX));
        const boxY = boxYCenter - pillH / 2;

        const lineEndX = item.side === 'right' ? boxX : boxX + boxW;

        // Línea guía quirúrgica + punto de anclaje
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = 1.25 * scale;
        ctx.beginPath();
        ctx.moveTo(item.anchorX, item.anchorY);
        ctx.lineTo(item.anchorX + elbowDx * 0.65, boxYCenter);
        ctx.lineTo(lineEndX, boxYCenter);
        ctx.stroke();

        ctx.fillStyle = palette.dot;
        ctx.beginPath();
        ctx.arc(item.anchorX, item.anchorY, 2.6 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Píldora clínica
        drawRoundedRect(boxX, boxY, boxW, pillH, 6 * scale);
        ctx.fillStyle = palette.bg;
        ctx.fill();
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = palette.text;
        ctx.textAlign = 'left';
        ctx.fillText(item.text, boxX + padX, boxYCenter + 0.5);
    }

    ctx.restore();
};

export interface BiomechanicSnapshotPlateOptions {
    video: HTMLVideoElement;
    webglCanvas?: HTMLCanvasElement | null;
    overlay2DCanvas?: HTMLCanvasElement | null;
    zoom?: number;
    maxDim?: number;
    jpegQuality?: number;
    is3DXRayMode?: boolean;
    phaseTitle?: string;
    perspectiveLabel?: string;
    methodLabel?: string;
    angles?: Partial<BiomechanicAngles>;
    onBeforeWebGLCopy?: () => void;
}

/**
 * Composición clínica de 6 capas para evidencia fotográfica biomecánica:
 * 1. Frame real de video (respetando zoom digital)
 * 2. Velo radiográfico #0C192E al 22% cuando está activo Rayos X 3D
 * 3. Canvas WebGL 3D de BodyParts3D sincronizado
 * 4. Canvas 2D (etiquetas clínicas en 3D o esqueleto neón en 2D)
 * 5. Brackets tácticos HUD en las 4 esquinas
 * 6. Placa clínica inferior con píldoras coloreadas por severidad + atribución BodyParts3D © DBCLS
 */
export const composeBiomechanicSnapshotPlate = (
    opts: BiomechanicSnapshotPlateOptions
): string | null => {
    const {
        video,
        webglCanvas,
        overlay2DCanvas,
        zoom = 1,
        maxDim = 720,
        jpegQuality = 0.82,
        is3DXRayMode = false,
        phaseTitle = 'EVALUACIÓN POSTURAL',
        perspectiveLabel,
        methodLabel,
        angles = {},
        onBeforeWebGLCopy,
    } = opts;

    const w = video?.videoWidth || 0;
    const h = video?.videoHeight || 0;
    if (!w || !h) return null;

    let targetW = w;
    let targetH = h;
    if (w > maxDim || h > maxDim) {
        if (w > h) {
            targetW = maxDim;
            targetH = Math.round((h * maxDim) / w);
        } else {
            targetH = maxDim;
            targetW = Math.round((w * maxDim) / h);
        }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const safeZoom = Math.max(1, zoom);
    const sw = w / safeZoom;
    const sh = h / safeZoom;
    const sx = (w - sw) / 2;
    const sy = (h - sh) / 2;

    // Capa 1: Video base
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);

    // Capa 2: Velo radiográfico #0C192E al 22% en modo 3D
    if (is3DXRayMode) {
        ctx.fillStyle = 'rgba(12, 25, 46, 0.22)';
        ctx.fillRect(0, 0, targetW, targetH);
    }

    const drawScaledOverlay = (srcCanvas?: HTMLCanvasElement | null) => {
        if (!srcCanvas || srcCanvas.width <= 0 || srcCanvas.height <= 0) return;
        const cw = srcCanvas.width;
        const ch = srcCanvas.height;
        const csw = cw / safeZoom;
        const csh = ch / safeZoom;
        const csx = (cw - csw) / 2;
        const csy = (ch - csh) / 2;
        try {
            ctx.drawImage(srcCanvas, csx, csy, csw, csh, 0, 0, targetW, targetH);
        } catch {
            // ignore tainted/disposed canvas error
        }
    };

    // Capa 3: Canvas WebGL 3D sincronizado
    if (is3DXRayMode && webglCanvas) {
        try {
            onBeforeWebGLCopy?.();
        } catch {
            // ignore
        }
        drawScaledOverlay(webglCanvas);
    }

    // Capa 4: Canvas 2D (etiquetas clínicas en 3D o esqueleto neón en 2D)
    drawScaledOverlay(overlay2DCanvas);

    const uiScale = Math.max(0.76, Math.min(1.18, targetW / 640));
    const plateH = Math.round(58 * uiScale);

    // Capa 5: Brackets HUD quirúrgicos
    const m = Math.round(12 * uiScale);
    const bLen = Math.round(18 * uiScale);
    const bottomBracketY = targetH - plateH - m;
    ctx.save();
    ctx.strokeStyle = is3DXRayMode ? 'rgba(0, 212, 255, 0.72)' : 'rgba(16, 185, 129, 0.72)';
    ctx.lineWidth = Math.max(1.5, 1.8 * uiScale);
    ctx.beginPath();
    // Top-left
    ctx.moveTo(m, m + bLen);
    ctx.lineTo(m, m);
    ctx.lineTo(m + bLen, m);
    // Top-right
    ctx.moveTo(targetW - m - bLen, m);
    ctx.lineTo(targetW - m, m);
    ctx.lineTo(targetW - m, m + bLen);
    // Bottom-left
    ctx.moveTo(m, bottomBracketY - bLen);
    ctx.lineTo(m, bottomBracketY);
    ctx.lineTo(m + bLen, bottomBracketY);
    // Bottom-right
    ctx.moveTo(targetW - m - bLen, bottomBracketY);
    ctx.lineTo(targetW - m, bottomBracketY);
    ctx.lineTo(targetW - m, bottomBracketY - bLen);
    ctx.stroke();
    ctx.restore();

    // Capa 6: Placa clínica inferior con píldoras coloreadas + atribución DBCLS
    const plateTop = targetH - plateH;
    ctx.fillStyle = 'rgba(9, 18, 34, 0.90)';
    ctx.fillRect(0, plateTop, targetW, plateH);

    ctx.fillStyle = is3DXRayMode ? '#00D4FF' : '#10B981';
    ctx.fillRect(0, plateTop, targetW, 2);

    const resolvedMethod =
        methodLabel || (angles.knee !== null && angles.knee !== undefined && angles.knee > 25 ? 'REBA' : 'RULA');
    const modeTag = is3DXRayMode ? 'RAYOS X 3D' : 'NEÓN 2D';
    const headerLeft = `${modeTag} • ${phaseTitle.toUpperCase()}${perspectiveLabel ? ` (${perspectiveLabel})` : ''} • ${resolvedMethod}`;

    const headerFont = Math.round(10.5 * uiScale);
    ctx.font = `700 ${headerFont}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = is3DXRayMode ? '#67E8F9' : '#6EE7B7';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(headerLeft, Math.round(12 * uiScale), plateTop + Math.round(16 * uiScale));

    if (is3DXRayMode) {
        const wmFont = Math.max(8, Math.round(8.5 * uiScale));
        ctx.font = `600 ${wmFont}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.textAlign = 'right';
        ctx.fillText(
            'BodyParts3D © DBCLS · CC BY-SA 2.1 JP',
            targetW - Math.round(10 * uiScale),
            plateTop + Math.round(16 * uiScale)
        );
    }

    // Fila de píldoras coloreadas por severidad clínica
    interface PillMetric {
        label: string;
        val: string;
        severity: 'ok' | 'warn' | 'crit';
    }
    const pills: PillMetric[] = [];
    if (angles.neck !== null && angles.neck !== undefined) {
        pills.push({
            label: 'Cuello',
            val: `${angles.neck}°`,
            severity: angles.neck > 25 ? 'crit' : angles.neck > 10 ? 'warn' : 'ok',
        });
    }
    if (angles.trunk !== null && angles.trunk !== undefined) {
        pills.push({
            label: 'Tronco',
            val: `${angles.trunk}°`,
            severity: angles.trunk > 22 ? 'crit' : angles.trunk > 8 ? 'warn' : 'ok',
        });
    }
    if (angles.arm !== null && angles.arm !== undefined) {
        pills.push({
            label: 'Brazo',
            val: `${angles.arm}°`,
            severity: angles.arm > 45 ? 'crit' : angles.arm > 20 ? 'warn' : 'ok',
        });
    }
    if (angles.elbow !== null && angles.elbow !== undefined) {
        const e = angles.elbow;
        pills.push({
            label: 'Codo',
            val: `${e}°`,
            severity: e < 30 || e > 130 ? 'crit' : e < 60 || e > 100 ? 'warn' : 'ok',
        });
    }
    if (angles.wrist !== null && angles.wrist !== undefined) {
        pills.push({
            label: 'Muñeca',
            val: `${angles.wrist}°`,
            severity: angles.wrist > 25 ? 'crit' : angles.wrist > 15 ? 'warn' : 'ok',
        });
    }
    if (angles.knee !== null && angles.knee !== undefined) {
        pills.push({
            label: 'Rodilla',
            val: `${angles.knee}°`,
            severity: angles.knee > 60 ? 'crit' : angles.knee > 25 ? 'warn' : 'ok',
        });
    }

    const pillFont = Math.max(8.5, Math.round(9.5 * uiScale));
    ctx.font = `700 ${pillFont}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = 'left';

    let cursorX = Math.round(12 * uiScale);
    const pillCenterY = plateTop + Math.round(40 * uiScale);
    const pillHeight = Math.round(18 * uiScale);
    const pillPadX = Math.round(6 * uiScale);

    if (pills.length === 0) {
        ctx.fillStyle = '#CBD5E1';
        ctx.fillText('Telemetría Biomecánica Activa', cursorX, pillCenterY);
    } else {
        for (const p of pills) {
            const content = `${p.label}: ${p.val}`;
            const wText = ctx.measureText(content).width;
            const pw = wText + pillPadX * 2;
            if (cursorX + pw > targetW - 10) break;

            const colors =
                p.severity === 'crit'
                    ? { bg: 'rgba(239, 68, 68, 0.22)', border: 'rgba(239, 68, 68, 0.65)', fg: '#FCA5A5' }
                    : p.severity === 'warn'
                      ? { bg: 'rgba(245, 158, 11, 0.20)', border: 'rgba(245, 158, 11, 0.60)', fg: '#FDE68A' }
                      : { bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(0, 212, 255, 0.45)', fg: '#A5F3FC' };

            const py = pillCenterY - pillHeight / 2;
            const r = Math.round(5 * uiScale);
            ctx.beginPath();
            ctx.moveTo(cursorX + r, py);
            ctx.lineTo(cursorX + pw - r, py);
            ctx.quadraticCurveTo(cursorX + pw, py, cursorX + pw, py + r);
            ctx.lineTo(cursorX + pw, py + pillHeight - r);
            ctx.quadraticCurveTo(cursorX + pw, py + pillHeight, cursorX + pw - r, py + pillHeight);
            ctx.lineTo(cursorX + r, py + pillHeight);
            ctx.quadraticCurveTo(cursorX, py + pillHeight, cursorX, py + pillHeight - r);
            ctx.lineTo(cursorX, py + r);
            ctx.quadraticCurveTo(cursorX, py, cursorX + r, py);
            ctx.closePath();

            ctx.fillStyle = colors.bg;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = colors.fg;
            ctx.fillText(content, cursorX + pillPadX, pillCenterY + 0.5);

            cursorX += pw + Math.round(5 * uiScale);
        }
    }

    return canvas.toDataURL('image/jpeg', jpegQuality);
};
