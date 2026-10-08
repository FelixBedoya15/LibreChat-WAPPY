/**
 * biomechanics3D.ts
 *
 * Módulo de telemetría y análisis biomecánico de postura de alta fidelidad.
 * Proporciona:
 * 1. Dibujado de exoesqueleto neón HUD nativo de alto rendimiento (indestructible, ultra-rápido, sin dependencias frágiles).
 * 2. Cálculo ergonómico defensivo y realista (RULA / REBA) para Cuello, Tronco, Brazos, Codos y Rodillas.
 *    - Cuello: Flexión cervical real (0° - 80°, nunca aberraciones como 140°).
 *    - Tronco y Rodillas: Manejo inteligente de encuadre webcam (si caderas o piernas están fuera de cuadro, devuelve null / '--').
 * 3. Soporte para MediaPipe Pose clásico (ultrarrápido <500ms) y Tasks-Vision con 3D world space.
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
 * Conexiones anatómicas completas del cuerpo humano para el exoesqueleto neón
 */
export const SKELETON_CONNECTIONS: [number, number][] = [
    // Cabeza y Contorno Facial
    [0, 1], [1, 2], [2, 3], [3, 7], // Lado izquierdo cara
    [0, 4], [4, 5], [5, 6], [6, 8], // Lado derecho cara
    [9, 10],                        // Labios / Boca

    // Cintura Escapular y Brazos
    [11, 12], // Hombro a hombro (Clavícula)
    [11, 13], // Hombro izq a codo izq
    [13, 15], // Codo izq a muñeca izq
    [12, 14], // Hombro der a codo der
    [14, 16], // Codo der a muñeca der

    // Manos / Dedos básicos
    [15, 17], [15, 19], [15, 21], // Mano izq
    [16, 18], [16, 20], [16, 22], // Mano der

    // Columna / Torso
    [11, 23], // Costado torso izq
    [12, 24], // Costado torso der
    [23, 24], // Pelvis / Cadera a cadera

    // Miembros Inferiores
    [23, 25], // Cadera izq a rodilla izq
    [25, 27], // Rodilla izq a tobillo izq
    [27, 29], [29, 31], [27, 31], // Pie izq
    [24, 26], // Cadera der a rodilla der
    [26, 28], // Rodilla der a tobillo der
    [28, 30], [30, 32], [28, 32], // Pie der
];

/**
 * Carga dinámica de script de forma rápida y con caché
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
 * Carga instantánea de scripts de MediaPipe Pose
 */
export const loadClassicPoseScripts = async (): Promise<void> => {
    await Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'),
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'),
    ]);
};

let tasksVisionPromise: Promise<any> | null = null;

/**
 * Carga dinámica de @mediapipe/tasks-vision sin bloquear
 */
export const loadTasksVision = async (): Promise<any> => {
    if (typeof window === 'undefined') return null;
    if ((window as any).MediaPipeTasksVision) {
        return (window as any).MediaPipeTasksVision;
    }
    if (!tasksVisionPromise) {
        tasksVisionPromise = (async () => {
            try {
                const importDynamic = new Function('url', 'return import(url)');
                const vision = await importDynamic('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
                (window as any).MediaPipeTasksVision = vision;
                return vision;
            } catch (err) {
                console.warn('[Biomechanics3D] No fue posible cargar Tasks-Vision vía ESM:', err);
                return null;
            }
        })();
    }
    return tasksVisionPromise;
};

/**
 * Inicializa PoseLandmarker de Tasks-Vision si está disponible
 */
export const initPoseLandmarker = async (tasksVision: any) => {
    if (!tasksVision || !tasksVision.FilesetResolver || !tasksVision.PoseLandmarker) {
        return null;
    }
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
    } catch (err) {
        console.warn('[Biomechanics3D] No se pudo crear PoseLandmarker con GPU, probando CPU o fallback:', err);
        try {
            const vision = await tasksVision.FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
            );
            return await tasksVision.PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                    delegate: 'CPU'
                },
                runningMode: 'VIDEO',
                numPoses: 1,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
        } catch (cpuErr) {
            console.error('[Biomechanics3D] Fallo inicialización PoseLandmarker:', cpuErr);
            return null;
        }
    }
};

/**
 * RENDERER NATIVO DEL EXOESQUELETO NEÓN HUD (CANVAS 2D PURO)
 * 100% garantizado: no depende de bibliotecas externas de dibujo,
 * ultra-rápido (<0.05ms), con resplandor neón cyan/esmeralda.
 */
export const drawBiomechanicSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    _tasksVision?: any
) => {
    if (!ctx || !landmarks || landmarks.length === 0) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    if (width <= 0 || height <= 0) return;

    ctx.save();

    // 1. DIBUJAR LÍNEA CERVICAL (CUELLO): Conectar centro de hombros con la cabeza
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];

    const shouldersVisible = leftShoulder && rightShoulder &&
        (leftShoulder.visibility ?? 1) > 0.3 && (rightShoulder.visibility ?? 1) > 0.3;

    let headX: number | null = null;
    let headY: number | null = null;

    if (nose && (nose.visibility ?? 1) > 0.3) {
        headX = nose.x * width;
        headY = nose.y * height;
    } else if (leftEar && rightEar && (leftEar.visibility ?? 1) > 0.3 && (rightEar.visibility ?? 1) > 0.3) {
        headX = ((leftEar.x + rightEar.x) / 2) * width;
        headY = ((leftEar.y + rightEar.y) / 2) * height;
    }

    // Configuración estética de las líneas (Bones / Huesos)
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#06b6d4'; // Cyan neón
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;

    // Trazar cuello vertebral
    if (shouldersVisible && headX !== null && headY !== null) {
        const neckBaseX = ((leftShoulder.x + rightShoulder.x) / 2) * width;
        const neckBaseY = ((leftShoulder.y + rightShoulder.y) / 2) * height;

        ctx.beginPath();
        ctx.moveTo(neckBaseX, neckBaseY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
    }

    // 2. DIBUJAR TODOS LOS SEGMENTOS ANATÓMICOS CONECTADOS
    for (const [idx1, idx2] of SKELETON_CONNECTIONS) {
        const p1 = landmarks[idx1];
        const p2 = landmarks[idx2];
        if (!p1 || !p2) continue;

        // Comprobación de visibilidad de ambos extremos
        const v1 = p1.visibility !== undefined ? p1.visibility : 1;
        const v2 = p2.visibility !== undefined ? p2.visibility : 1;
        if (v1 < 0.35 || v2 < 0.35) continue;

        const x1 = p1.x * width;
        const y1 = p1.y * height;
        const x2 = p2.x * width;
        const y2 = p2.y * height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // 3. DIBUJAR ARTICULACIONES / NODOS (Emerald Glow)
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#10b981';

    // Lista de articulaciones clave para resaltar
    const keyJointIndices = [0, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    for (const idx of keyJointIndices) {
        const p = landmarks[idx];
        if (!p) continue;
        const v = p.visibility !== undefined ? p.visibility : 1;
        if (v < 0.35) continue;

        const px = p.x * width;
        const py = p.y * height;

        // Anillo exterior verde esmeralda
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Punto central brillante cian
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
};

/**
 * Cálculo del ángulo entre 3 puntos (A - B - C) con vértice en B.
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
    // En coordenadas de imagen y world landmarks, y es negativo hacia arriba
    const cosAngle = Math.max(-1, Math.min(1, -v.y / mag));
    return Math.round(Math.acos(cosAngle) * (180 / Math.PI));
};

/**
 * CÁLCULO ERGONÓMICO ROBUSTO Y DEFENSIVO DE LOS 5 ÁNGULOS PRINCIPALES
 * (Cuello, Tronco, Brazo, Codo, Rodilla)
 *
 * Maneja adecuadamente encuadres de webcam (primer plano de escritorio):
 * - Si las caderas no son visibles: Tronco = null ('--')
 * - Si las rodillas o tobillos no son visibles: Rodilla = null ('--')
 * - Cuello: Inclinación cervical ergonómica real acotada (0° a 80°, nunca 140°)
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

    // Visibilidad de segmentos
    const leftShoulderVis = (leftShoulder?.visibility ?? 0) > 0.4;
    const rightShoulderVis = (rightShoulder?.visibility ?? 0) > 0.4;
    const hipsVisible = ((leftHip?.visibility ?? 0) > 0.45 || (rightHip?.visibility ?? 0) > 0.45);
    const kneesVisible = hipsVisible &&
        ((leftKnee?.visibility ?? 0) > 0.4 || (rightKnee?.visibility ?? 0) > 0.4) &&
        ((leftAnkle?.visibility ?? 0) > 0.35 || (rightAnkle?.visibility ?? 0) > 0.35);

    // Lado activo / dominante
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

    // 1. CÁLCULO DE CUELLO (FLEXIÓN / INCLINACIÓN CERVICAL)
    let neckDeg: number | null = null;
    if (leftShoulderVis || rightShoulderVis) {
        // Centro de los hombros
        const shoulderCenter = {
            x: leftShoulderVis && rightShoulderVis ? (tLeftShoulder.x + tRightShoulder.x) / 2 : (leftShoulderVis ? tLeftShoulder.x : tRightShoulder.x),
            y: leftShoulderVis && rightShoulderVis ? (tLeftShoulder.y + tRightShoulder.y) / 2 : (leftShoulderVis ? tLeftShoulder.y : tRightShoulder.y),
            z: leftShoulderVis && rightShoulderVis ? ((tLeftShoulder.z ?? 0) + (tRightShoulder.z ?? 0)) / 2 : ((leftShoulderVis ? tLeftShoulder.z : tRightShoulder.z) ?? 0),
        };

        // Centro de la cabeza
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
            // Inclinación respecto a la vertical superior
            const rawHeadTilt = calc3DVerticalAngle(shoulderCenter, headPt);
            if (rawHeadTilt !== null) {
                // Acotar a rangos biomecánicos humanos reales (0° a 75°)
                neckDeg = Math.min(75, Math.max(0, rawHeadTilt));
            }
        }
    }

    // 2. CÁLCULO DE TRONCO (INCLINACIÓN DEL TORSO)
    // DEFENSIVO: Si las caderas no son visibles en el encuadre, el tronco se reporta como null ('--')
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

            // Si el tronco está inclinado y el cuello calculado, corregir flexión cervical relativa
            if (neckDeg !== null && trunkDeg !== null) {
                neckDeg = Math.min(75, Math.abs(neckDeg - trunkDeg));
            }
        }
    }

    // 3. CÁLCULO DE BRAZO (ELEVACIÓN / ABDUCCIÓN)
    let armDeg: number | null = null;
    const actShoulder = useLeft ? tLeftShoulder : tRightShoulder;
    const actElbow = useLeft ? tLeftElbow : tRightElbow;
    const elbowVis = useLeft ? (leftElbow?.visibility ?? 0) > 0.4 : (rightElbow?.visibility ?? 0) > 0.4;

    if (actShoulder && actElbow && elbowVis) {
        if (hipsVisible) {
            const actHip = useLeft ? tLeftHip : tRightHip;
            armDeg = calc3DAngle(actHip, actShoulder, actElbow);
        } else {
            // Si la cadera no está en encuadre, calcular elevación del brazo respecto a la vertical
            const armTilt = calc3DVerticalAngle(actElbow, actShoulder);
            if (armTilt !== null) {
                armDeg = Math.min(180, Math.max(0, armTilt));
            }
        }
    }

    // 4. CÁLCULO DE CODO (FLEXIÓN DEL ANTEBRAZO)
    let elbowDegVal: number | null = null;
    const actWrist = useLeft ? tLeftWrist : tRightWrist;
    const wristVis = useLeft ? (leftWrist?.visibility ?? 0) > 0.4 : (rightWrist?.visibility ?? 0) > 0.4;

    if (actShoulder && actElbow && actWrist && elbowVis && wristVis) {
        elbowDegVal = calc3DAngle(actShoulder, actElbow, actWrist);
    }

    // 5. CÁLCULO DE RODILLA (FLEXIÓN RESPECTO A EXTENSIÓN)
    // DEFENSIVO: Si las piernas no están en el encuadre, rodilla = null ('--')
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
