/**
 * biomechanics3D.ts
 *
 * Módulo de telemetría y análisis biomecánico de postura con Google MediaPipe Tasks-Vision (Google AI Edge)
 * y cálculo de ángulos articulares tridimensionales (3D World Landmarks en metros reales).
 *
 * Incluye fallback automático y resiliente a MediaPipe Pose clásico (2D).
 */

export interface BiomechanicAngles {
    neck: number | null;
    trunk: number | null;
    arm: number | null;
    elbow: number | null;
    knee: number | null;
    is3D: boolean;
}

let tasksVisionPromise: Promise<any> | null = null;

/**
 * Carga dinámica del paquete ESM @mediapipe/tasks-vision desde CDN.
 * Usa new Function para evitar transformaciones o advertencias de empaquetado en Vite.
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
                console.warn('[Biomechanics3D] No fue posible cargar Tasks-Vision vía ESM, se usará fallback clásico:', err);
                return null;
            }
        })();
    }
    return tasksVisionPromise;
};

/**
 * Carga de script genérico para fallback clásico
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
 * Carga de scripts clásicos de MediaPipe Pose como respaldo
 */
export const loadClassicPoseScripts = async (): Promise<void> => {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
};

/**
 * Inicializa la instancia de PoseLandmarker de Tasks-Vision (GPU con fallback a CPU)
 */
export const initPoseLandmarker = async (tasksVision: any) => {
    if (!tasksVision || !tasksVision.FilesetResolver || !tasksVision.PoseLandmarker) {
        return null;
    }
    try {
        const vision = await tasksVision.FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        let landmarker = null;
        try {
            landmarker = await tasksVision.PoseLandmarker.createFromOptions(vision, {
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
            console.log('[Biomechanics3D] PoseLandmarker inicializado con aceleración GPU');
        } catch (gpuErr) {
            console.warn('[Biomechanics3D] Fallback a CPU para PoseLandmarker:', gpuErr);
            landmarker = await tasksVision.PoseLandmarker.createFromOptions(vision, {
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
            console.log('[Biomechanics3D] PoseLandmarker inicializado en CPU');
        }
        return landmarker;
    } catch (err) {
        console.error('[Biomechanics3D] Error creando PoseLandmarker:', err);
        return null;
    }
};

/**
 * Dibuja el esqueleto neón HUD en canvas
 */
export const drawBiomechanicSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    tasksVision?: any
) => {
    if (!landmarks || landmarks.length === 0) return;

    ctx.save();
    // Resplandor cian neón para los segmentos corporales
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;

    const tv = tasksVision || (typeof window !== 'undefined' ? (window as any).MediaPipeTasksVision : null);
    if (tv && tv.DrawingUtils && tv.PoseLandmarker) {
        const du = new tv.DrawingUtils(ctx);
        const bodyConnections = tv.PoseLandmarker.POSE_CONNECTIONS.filter((conn: any) => {
            const start = conn.start !== undefined ? conn.start : conn[0];
            const end = conn.end !== undefined ? conn.end : conn[1];
            return start >= 11 && end >= 11;
        });
        du.drawConnectors(landmarks, bodyConnections, {
            color: '#06b6d4',
            lineWidth: 3
        });

        // Resplandor esmeralda neón para las articulaciones
        ctx.shadowColor = '#10b981';
        du.drawLandmarks(landmarks.slice(11), {
            color: '#10b981',
            fillColor: '#06b6d4',
            lineWidth: 2,
            radius: 4
        });
    } else if (typeof window !== 'undefined' && (window as any).drawConnectors && (window as any).POSE_CONNECTIONS) {
        // Fallback drawing utils clásico
        const bodyConnections = (window as any).POSE_CONNECTIONS.filter(([p1, p2]: [number, number]) => p1 >= 11 && p2 >= 11);
        (window as any).drawConnectors(ctx, landmarks, bodyConnections, {
            color: '#06b6d4',
            lineWidth: 3
        });

        ctx.shadowColor = '#10b981';
        if ((window as any).drawLandmarks) {
            (window as any).drawLandmarks(ctx, landmarks.slice(11), {
                color: '#10b981',
                fillColor: '#06b6d4',
                lineWidth: 2,
                radius: 4
            });
        }
    }
    ctx.restore();
};

/**
 * Cálculo del ángulo 3D formado por tres puntos (A - B - C) con vértice en B.
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
 * Inclinación de un vector 3D ascendente respecto al eje vertical superior (0, -1, 0).
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
 * Calcula los 5 ángulos ergonómicos principales (Cuello, Tronco, Brazo, Codo, Rodilla).
 * Si hay worldLandmarks disponibles, realiza el cálculo en 3D libre de distorsión de perspectiva.
 * Si no, usa las proyecciones 2D como fallback resiliente.
 */
export const calculateBiomechanicAngles = (
    landmarks: any[],
    worldLandmarks?: any[] | null
): BiomechanicAngles => {
    if (!landmarks || landmarks.length < 29) {
        return { neck: null, trunk: null, arm: null, elbow: null, knee: null, is3D: false };
    }

    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const nose = landmarks[0];

    const leftVisible = (leftEar?.visibility ?? 0) > 0.4 && (leftShoulder?.visibility ?? 0) > 0.4 && (leftHip?.visibility ?? 0) > 0.4;
    const rightVisible = (rightEar?.visibility ?? 0) > 0.4 && (rightShoulder?.visibility ?? 0) > 0.4 && (rightHip?.visibility ?? 0) > 0.4;

    const useLeft = leftVisible && (!rightVisible || (leftShoulder.visibility ?? 0) > (rightShoulder.visibility ?? 0));

    // Determinar si podemos calcular en 3D
    const canUse3D = !!worldLandmarks && worldLandmarks.length >= 29;

    if (canUse3D && worldLandmarks) {
        const wNose = worldLandmarks[0];
        const wLeftEar = worldLandmarks[7];
        const wRightEar = worldLandmarks[8];
        const wLeftShoulder = worldLandmarks[11];
        const wRightShoulder = worldLandmarks[12];
        const wLeftHip = worldLandmarks[23];
        const wRightHip = worldLandmarks[24];
        const wLeftElbow = worldLandmarks[13];
        const wRightElbow = worldLandmarks[14];
        const wLeftWrist = worldLandmarks[15];
        const wRightWrist = worldLandmarks[16];
        const wLeftKnee = worldLandmarks[25];
        const wRightKnee = worldLandmarks[26];
        const wLeftAnkle = worldLandmarks[27];
        const wRightAnkle = worldLandmarks[28];

        // Centro 3D de hombros y caderas
        const shoulderCenter3D = {
            x: (wLeftShoulder.x + wRightShoulder.x) / 2,
            y: (wLeftShoulder.y + wRightShoulder.y) / 2,
            z: ((wLeftShoulder.z ?? 0) + (wRightShoulder.z ?? 0)) / 2
        };
        const hipCenter3D = {
            x: (wLeftHip.x + wRightHip.x) / 2,
            y: (wLeftHip.y + wRightHip.y) / 2,
            z: ((wLeftHip.z ?? 0) + (wRightHip.z ?? 0)) / 2
        };

        // Centro de la cabeza en 3D
        let head3D: any = null;
        if (nose && (nose.visibility ?? 0) > 0.4) {
            head3D = wNose;
        } else if (leftEar && rightEar && (leftEar.visibility ?? 0) > 0.4 && (rightEar.visibility ?? 0) > 0.4) {
            head3D = {
                x: (wLeftEar.x + wRightEar.x) / 2,
                y: (wLeftEar.y + wRightEar.y) / 2,
                z: ((wLeftEar.z ?? 0) + (wRightEar.z ?? 0)) / 2
            };
        } else if (useLeft && leftEar && (leftEar.visibility ?? 0) > 0.4) {
            head3D = wLeftEar;
        } else if (!useLeft && rightEar && (rightEar.visibility ?? 0) > 0.4) {
            head3D = wRightEar;
        }

        // 1. Tronco 3D (Inclinación respecto al eje vertical superior)
        const trunkDeg = calc3DVerticalAngle(hipCenter3D, shoulderCenter3D);

        // 2. Cuello 3D (Desviación respecto a la alineación del tronco)
        let neckDeg: number | null = null;
        if (head3D) {
            // El ángulo entre el vector cabeza->hombro y el vector hombro->cadera forma 180° si está completamente recto
            const rawNeckAngle = calc3DAngle(head3D, shoulderCenter3D, hipCenter3D);
            if (rawNeckAngle !== null) {
                neckDeg = Math.max(0, 180 - rawNeckAngle);
            }
        }

        // Articulaciones activas según el lado dominante visible
        const actShoulder = useLeft ? wLeftShoulder : wRightShoulder;
        const actHip = useLeft ? wLeftHip : wRightHip;
        const actElbow = useLeft ? wLeftElbow : wRightElbow;
        const actWrist = useLeft ? wLeftWrist : wRightWrist;
        const actKnee = useLeft ? wLeftKnee : wRightKnee;
        const actAnkle = useLeft ? wLeftAnkle : wRightAnkle;

        // 3. Brazo 3D (Abducción/Elevación respecto al tronco)
        const armDeg = calc3DAngle(actHip, actShoulder, actElbow);

        // 4. Codo 3D (Flexión articular en el codo)
        const elbowDeg = calc3DAngle(actShoulder, actElbow, actWrist);

        // 5. Rodilla 3D (Flexión respecto a extensión completa de 180°)
        let kneeDeg: number | null = null;
        const rawKneeAngle = calc3DAngle(actHip, actKnee, actAnkle);
        if (rawKneeAngle !== null) {
            kneeDeg = Math.max(0, 180 - rawKneeAngle);
        }

        return {
            neck: neckDeg,
            trunk: trunkDeg,
            arm: armDeg,
            elbow: elbowDeg,
            knee: kneeDeg,
            is3D: true
        };
    }

    // ==========================================
    // FALLBACK 2D (Coordenadas de imagen normalizadas)
    // ==========================================
    let activeEar = useLeft ? leftEar : rightEar;
    let activeShoulder = useLeft ? leftShoulder : rightShoulder;
    let activeHip = useLeft ? leftHip : rightHip;
    let activeElbow = useLeft ? leftElbow : rightElbow;
    let activeWrist = useLeft ? leftWrist : rightWrist;
    let activeKnee = useLeft ? leftKnee : rightKnee;
    let activeAnkle = useLeft ? leftAnkle : rightAnkle;

    if (!activeEar) activeEar = leftEar || rightEar;
    if (!activeShoulder) activeShoulder = leftShoulder || rightShoulder;
    if (!activeHip) activeHip = leftHip || rightHip;
    if (!activeElbow) activeElbow = leftElbow || rightElbow;
    if (!activeWrist) activeWrist = leftWrist || rightWrist;
    if (!activeKnee) activeKnee = leftKnee || rightKnee;
    if (!activeAnkle) activeAnkle = leftAnkle || rightAnkle;

    let neckDeg: number | null = null;
    let trunkDeg: number | null = null;
    let armDeg: number | null = null;
    let elbowDegVal: number | null = null;
    let kneeFlexVal: number | null = null;

    const noseVisible = nose && (nose.visibility ?? 0) > 0.5;
    const leftEarVisible = leftEar && (leftEar.visibility ?? 0) > 0.5;
    const rightEarVisible = rightEar && (rightEar.visibility ?? 0) > 0.5;
    const leftShoulderVisible = leftShoulder && (leftShoulder.visibility ?? 0) > 0.5;
    const rightShoulderVisible = rightShoulder && (rightShoulder.visibility ?? 0) > 0.5;

    const isFrontalView = leftShoulderVisible && rightShoulderVisible &&
                          Math.abs(leftShoulder.x - rightShoulder.x) > 0.12;

    if (isFrontalView) {
        let headCenterX: number | null = null;
        let headCenterY: number | null = null;

        if (noseVisible) {
            headCenterX = nose.x;
            headCenterY = nose.y;
        } else if (leftEarVisible && rightEarVisible) {
            headCenterX = (leftEar.x + rightEar.x) / 2;
            headCenterY = (leftEar.y + rightEar.y) / 2;
        }

        const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
        const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;

        if (headCenterX !== null && headCenterY !== null) {
            const neckDx = shoulderCenterX - headCenterX;
            const neckDy = shoulderCenterY - headCenterY;
            if (neckDy > 0) {
                const neckRad = Math.atan2(Math.abs(neckDx), neckDy);
                neckDeg = Math.round(neckRad * (180 / Math.PI));
            }
        }
    } else {
        if (activeEar && activeShoulder) {
            const neckDx = activeShoulder.x - activeEar.x;
            const neckDy = activeShoulder.y - activeEar.y;
            if (Math.abs(neckDy) > 0) {
                const neckRad = Math.atan2(Math.abs(neckDx), Math.abs(neckDy));
                neckDeg = Math.round(neckRad * (180 / Math.PI));
            }
        }
    }

    if (activeShoulder && activeHip && (activeShoulder.visibility ?? 0) > 0.5 && (activeHip.visibility ?? 0) > 0.5) {
        const trunkDx = activeShoulder.x - activeHip.x;
        const trunkDy = activeHip.y - activeShoulder.y;
        const trunkRad = Math.atan2(Math.abs(trunkDx), Math.abs(trunkDy));
        trunkDeg = Math.round(trunkRad * (180 / Math.PI));
    }

    if (activeHip && activeShoulder && activeElbow && (activeHip.visibility ?? 0) > 0.5 && (activeShoulder.visibility ?? 0) > 0.5 && (activeElbow.visibility ?? 0) > 0.5) {
        const v1 = { x: activeHip.x - activeShoulder.x, y: activeHip.y - activeShoulder.y };
        const v2 = { x: activeElbow.x - activeShoulder.x, y: activeElbow.y - activeShoulder.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        if (mag1 * mag2 > 0) {
            const cosAngle = dot / (mag1 * mag2);
            armDeg = Math.round(Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI));
        }
    }

    if (activeShoulder && activeElbow && activeWrist && (activeShoulder.visibility ?? 0) > 0.5 && (activeElbow.visibility ?? 0) > 0.5 && (activeWrist.visibility ?? 0) > 0.5) {
        const v1 = { x: activeShoulder.x - activeElbow.x, y: activeShoulder.y - activeElbow.y };
        const v2 = { x: activeWrist.x - activeElbow.x, y: activeWrist.y - activeElbow.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        if (mag1 * mag2 > 0) {
            const cosAngle = dot / (mag1 * mag2);
            elbowDegVal = Math.round(Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI));
        }
    }

    if (activeHip && activeKnee && activeAnkle && (activeHip.visibility ?? 0) > 0.5 && (activeKnee.visibility ?? 0) > 0.5 && (activeAnkle.visibility ?? 0) > 0.5) {
        const v1 = { x: activeHip.x - activeKnee.x, y: activeHip.y - activeKnee.y };
        const v2 = { x: activeAnkle.x - activeKnee.x, y: activeAnkle.y - activeKnee.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        if (mag1 * mag2 > 0) {
            const cosAngle = dot / (mag1 * mag2);
            const kneeRawDeg = Math.round(Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI));
            kneeFlexVal = Math.max(0, 180 - kneeRawDeg);
        }
    }

    return {
        neck: neckDeg,
        trunk: trunkDeg,
        arm: armDeg,
        elbow: elbowDegVal,
        knee: kneeFlexVal,
        is3D: false
    };
};
