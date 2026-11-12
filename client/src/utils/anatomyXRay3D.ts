/**
 * anatomyXRay3D.ts
 *
 * Motor WebGL Three.js + Rigging Anatómico Real (BodyParts3D DBCLS) + Shaders Quirúrgicos WAPPY.
 *
 * Características principales:
 * 1. Carga perezosa singleton (0 bloat en el bundle inicial): Three.js r128 + paquete binario cuantizado
 *    `/assets/anatomy/bodyparts3d_wappy_v1.json` + `.bin` decodificado una única vez en memoria.
 * 2. Cámara Ortográfica en espacio exacto de píxeles del video (`0..width`, `0..-height`, det=+1 dextrógiro)
 *    eliminando doble distorsión de perspectiva en bordes, con `preserveDrawingBuffer: true` para capturas JPEG.
 * 3. Shader Quirúrgico Fresnel (`xray_fresnel`) con núcleo trabecular `#072A40` (24% alpha) y borde cortical `#00D4FF`
 *    (hasta 96% alpha) + interpolación suave por severidad ergonómica (Cyan -> Ámbar -> Rojo Coral pulsante) y
 *    modo alternativo `clinical_solid` marfil quirúrgico iluminado.
 * 4. Rigging biomecánico completo a 60 FPS de los 23 grupos óseos + 38 segmentos metacarpianos/falángicos (21 pts por mano),
 *    apertura mandibular ATM en vivo (`jawOpen`) y extrapolación anatómica de columna en Modo Busto de Escritorio.
 *
 * Atribución: BodyParts3D, © The Database Center for Life Science (DBCLS), CC BY-SA 2.1 JP.
 */

import {
    BiomechanicAngles,
    BiomechanicVisionConfig,
    DEFAULT_BIOMECH_VISION_CONFIG,
    calc3DAngle,
    calc3DVerticalAngle,
} from '~/utils/biomechanics3D';

const THREE_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const ANATOMY_JSON_URL = '/assets/anatomy/bodyparts3d_wappy_v1.json';
const ANATOMY_BIN_URL = '/assets/anatomy/bodyparts3d_wappy_v1.bin';

export type AnatomyLayerKey = 'skull' | 'spine' | 'upperLimbs' | 'hands' | 'lowerLimbs';
export type StressZoneKey =
    | 'neutral'
    | 'neck'
    | 'trunk'
    | 'arm_r'
    | 'arm_l'
    | 'elbow_r'
    | 'elbow_l'
    | 'wrist_r'
    | 'wrist_l'
    | 'knee_r'
    | 'knee_l';

interface ManifestMeshEntry {
    key: string;
    label: string;
    layer: AnatomyLayerKey;
    stressZone: string | null;
    vCount: number;
    triCount: number;
    min: [number, number, number];
    max: [number, number, number];
    centroid: [number, number, number];
    posOffset: number;
    posByteLength: number;
    normOffset: number;
    normByteLength: number;
    idxOffset: number;
    idxByteLength: number;
}

interface AnatomyManifest {
    version: string;
    meshes: ManifestMeshEntry[];
}

interface DecodedAnatomyPackage {
    THREE: any;
    manifest: AnatomyManifest;
    geometries: Map<string, any>;
    entries: Map<string, ManifestMeshEntry>;
}

// ─── Estado Singleton de Carga Perezosa ──────────────────────────────────────
let threePromise: Promise<any> | null = null;
let anatomyPackagePromise: Promise<DecodedAnatomyPackage> | null = null;
let decodedCache: DecodedAnatomyPackage | null = null;
let anatomyLoadingFlag = false;
const loadingListeners = new Set<(loading: boolean, ready: boolean) => void>();

function notifyLoadingListeners() {
    const ready = Boolean(decodedCache);
    loadingListeners.forEach((cb) => {
        try {
            cb(anatomyLoadingFlag, ready);
        } catch {
            // ignore listener error
        }
    });
}

export function isAnatomyXRayReady(): boolean {
    return Boolean(decodedCache);
}

export function isAnatomyXRayLoading(): boolean {
    return anatomyLoadingFlag;
}

export function subscribeAnatomyXRayStatus(
    listener: (loading: boolean, ready: boolean) => void
): () => void {
    loadingListeners.add(listener);
    listener(anatomyLoadingFlag, Boolean(decodedCache));
    return () => {
        loadingListeners.delete(listener);
    };
}

function loadThreeRuntime(): Promise<any> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Window not available'));
    }
    if ((window as any).THREE) {
        return Promise.resolve((window as any).THREE);
    }
    if (!threePromise) {
        threePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(
                `script[src="${THREE_CDN_URL}"]`
            ) as HTMLScriptElement | null;
            if (existing) {
                if ((window as any).THREE) {
                    resolve((window as any).THREE);
                    return;
                }
                existing.addEventListener('load', () => resolve((window as any).THREE), {
                    once: true,
                });
                existing.addEventListener(
                    'error',
                    (err) => {
                        threePromise = null;
                        reject(err);
                    },
                    { once: true }
                );
                return;
            }
            const script = document.createElement('script');
            script.src = THREE_CDN_URL;
            script.async = true;
            script.onload = () => {
                if ((window as any).THREE) {
                    resolve((window as any).THREE);
                } else {
                    threePromise = null;
                    reject(new Error('THREE global missing after script load'));
                }
            };
            script.onerror = (err) => {
                threePromise = null;
                reject(err);
            };
            document.head.appendChild(script);
        });
    }
    return threePromise;
}

/**
 * Carga y decodifica por única vez en la sesión del navegador el paquete BodyParts3D (.json + .bin)
 */
export function ensureAnatomyXRayAssets(): Promise<DecodedAnatomyPackage> {
    if (decodedCache) {
        return Promise.resolve(decodedCache);
    }
    if (!anatomyPackagePromise) {
        anatomyLoadingFlag = true;
        notifyLoadingListeners();

        anatomyPackagePromise = (async () => {
            try {
                const [THREE, manifestRes, binRes] = await Promise.all([
                    loadThreeRuntime(),
                    fetch(ANATOMY_JSON_URL),
                    fetch(ANATOMY_BIN_URL),
                ]);

                if (!manifestRes.ok) {
                    throw new Error(`HTTP ${manifestRes.status} loading ${ANATOMY_JSON_URL}`);
                }
                if (!binRes.ok) {
                    throw new Error(`HTTP ${binRes.status} loading ${ANATOMY_BIN_URL}`);
                }

                const [manifest, arrayBuffer] = await Promise.all([
                    manifestRes.json() as Promise<AnatomyManifest>,
                    binRes.arrayBuffer(),
                ]);

                const geometries = new Map<string, any>();
                const entries = new Map<string, ManifestMeshEntry>();

                for (const meshMeta of manifest.meshes || []) {
                    const {
                        key,
                        vCount,
                        triCount,
                        min,
                        max,
                        posOffset,
                        posByteLength,
                        normOffset,
                        normByteLength,
                        idxOffset,
                        idxByteLength,
                    } = meshMeta;

                    const qPos =
                        posOffset % 2 === 0
                            ? new Uint16Array(arrayBuffer, posOffset, vCount * 3)
                            : new Uint16Array(arrayBuffer.slice(posOffset, posOffset + posByteLength));

                    const qNorm = new Int8Array(
                        arrayBuffer,
                        normOffset,
                        Math.min(vCount * 3, normByteLength)
                    );

                    const rawIdx =
                        idxOffset % 2 === 0
                            ? new Uint16Array(arrayBuffer, idxOffset, triCount * 3)
                            : new Uint16Array(arrayBuffer.slice(idxOffset, idxOffset + idxByteLength));
                    // Copia dedicada de índices para WebGL ELEMENT_ARRAY_BUFFER estable
                    const indices = new Uint16Array(rawIdx);

                    const positions = new Float32Array(vCount * 3);
                    const normals = new Float32Array(vCount * 3);

                    const spanX = max[0] - min[0];
                    const spanY = max[1] - min[1];
                    const spanZ = max[2] - min[2];

                    for (let i = 0; i < vCount; i++) {
                        const i3 = i * 3;
                        positions[i3] = min[0] + (qPos[i3] / 65535) * spanX;
                        positions[i3 + 1] = min[1] + (qPos[i3 + 1] / 65535) * spanY;
                        positions[i3 + 2] = min[2] + (qPos[i3 + 2] / 65535) * spanZ;

                        const nx = qNorm[i3] / 127;
                        const ny = qNorm[i3 + 1] / 127;
                        const nz = qNorm[i3 + 2] / 127;
                        const len = Math.hypot(nx, ny, nz) || 1;
                        normals[i3] = nx / len;
                        normals[i3 + 1] = ny / len;
                        normals[i3 + 2] = nz / len;
                    }

                    const geometry = new THREE.BufferGeometry();
                    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
                    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
                    geometry.computeBoundingSphere();

                    geometries.set(key, geometry);
                    entries.set(key, meshMeta);
                }

                decodedCache = { THREE, manifest, geometries, entries };
                anatomyLoadingFlag = false;
                notifyLoadingListeners();
                return decodedCache;
            } catch (err) {
                anatomyLoadingFlag = false;
                anatomyPackagePromise = null;
                notifyLoadingListeners();
                throw err;
            }
        })();
    }
    return anatomyPackagePromise;
}

// ─── Shaders Quirúrgicos WAPPY (Fresnel Radiográfico + Pulso Clínico) ────────
const XRAY_VERTEX_SHADER = `
varying vec3 vNormalView;
varying vec3 vViewDir;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    // Rayos paralelos en cámara ortográfica mirando hacia -Z
    vViewDir = vec3(0.0, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const XRAY_FRAGMENT_SHADER = `
uniform vec3 uCoreColor;
uniform vec3 uRimColor;
uniform float uOpacity;
uniform float uSeverity;
uniform float uTime;

varying vec3 vNormalView;
varying vec3 vViewDir;

void main() {
    vec3 n = normalize(vNormalView);
    float ndotv = clamp(abs(dot(n, normalize(vViewDir))), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 2.15);
    float cortical = smoothstep(0.16, 0.96, fresnel);

    float critFactor = smoothstep(0.65, 1.0, uSeverity);
    float pulse = mix(1.0, 0.85 + 0.15 * sin(uTime * 13.8), critFactor);

    vec3 color = mix(uCoreColor, uRimColor * (1.06 * pulse), cortical);
    color += uRimColor * pow(fresnel, 4.4) * 0.26 * pulse;

    // Núcleo oscuro #072A40 al 24% de alpha base para alto contraste sobre camisas blancas,
    // y borde cortical hasta 96% de alpha.
    float baseAlpha = mix(0.24, 0.96, cortical);
    float finalAlpha = clamp(baseAlpha * mix(1.0, 1.08, critFactor) * uOpacity, 0.0, 0.98);

    gl_FragColor = vec4(color, finalAlpha);
}
`;

// Paletas clínicas RGB normalizadas [0..1]
const RGB_CORE_NORMAL: [number, number, number] = [0x07 / 255, 0x2a / 255, 0x40 / 255]; // #072A40
const RGB_RIM_NORMAL: [number, number, number] = [0x00 / 255, 0xd4 / 255, 0xff / 255]; // #00D4FF

const RGB_CORE_WARN: [number, number, number] = [0x3b / 255, 0x21 / 255, 0x06 / 255]; // #3B2106
const RGB_RIM_WARN: [number, number, number] = [0xf5 / 255, 0x9e / 255, 0x0b / 255]; // #F59E0B

const RGB_CORE_CRIT: [number, number, number] = [0x45 / 255, 0x0a / 255, 0x0a / 255]; // #450A0A
const RGB_RIM_CRIT: [number, number, number] = [0xef / 255, 0x44 / 255, 0x44 / 255]; // #EF4444

// Paletas para Sólido Clínico (#E8EEF5 -> #FDE68A -> #FCA5A5)
const SOLID_BASE_NORMAL: [number, number, number] = [0xe8 / 255, 0xee / 255, 0xf5 / 255];
const SOLID_BASE_WARN: [number, number, number] = [0xfd / 255, 0xe6 / 255, 0x8a / 255];
const SOLID_BASE_CRIT: [number, number, number] = [0xfc / 255, 0xa5 / 255, 0xa5 / 255];

const SOLID_EMISSIVE_NORMAL: [number, number, number] = [0.02, 0.08, 0.12];
const SOLID_EMISSIVE_WARN: [number, number, number] = [0.32, 0.18, 0.02];
const SOLID_EMISSIVE_CRIT: [number, number, number] = [0.45, 0.05, 0.05];

function sampleTriStop(
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    severity: number
): [number, number, number] {
    const s = Math.min(1, Math.max(0, severity));
    if (s <= 0.5) {
        const t = s * 2;
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
    const t = (s - 0.5) * 2;
    return [b[0] + (c[0] - b[0]) * t, b[1] + (c[1] - b[1]) * t, b[2] + (c[2] - b[2]) * t];
}

// ─── Utilidades Vectoriales 3D Ligeras (0 GC en loop de 60 FPS) ──────────────
interface Vec3 {
    x: number;
    y: number;
    z: number;
}

const vSet = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const vSub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const vAdd = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const vScale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const vLerp = (a: Vec3, b: Vec3, t: number): Vec3 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
});
const vDot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const vCross = (a: Vec3, b: Vec3): Vec3 => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
});
const vLen = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
const vNorm = (a: Vec3, fallback: Vec3 = { x: 0, y: 1, z: 0 }): Vec3 => {
    const l = Math.hypot(a.x, a.y, a.z);
    if (l < 1e-5) return { ...fallback };
    return { x: a.x / l, y: a.y / l, z: a.z / l };
};
const quadBezier3 = (p0: Vec3, p1: Vec3, p2: Vec3, t: number): Vec3 => {
    const u = 1 - t;
    const b0 = u * u;
    const b1 = 2 * u * t;
    const b2 = t * t;
    return {
        x: b0 * p0.x + b1 * p1.x + b2 * p2.x,
        y: b0 * p0.y + b1 * p1.y + b2 * p2.y,
        z: b0 * p0.z + b1 * p1.z + b2 * p2.z,
    };
};

// Topología de 19 segmentos óseos de la mano (5 metacarpianos + 14 falanges)
const HAND_19_SEGMENTS: Array<{
    iStart: number;
    iEnd: number;
    startFromWristLerp?: number;
    thickness: number;
}> = [
    // Pulgar (1er metacarpiano + falange proximal + falange distal = 3)
    { iStart: 1, iEnd: 2, thickness: 1.06 },
    { iStart: 2, iEnd: 3, thickness: 0.92 },
    { iStart: 3, iEnd: 4, thickness: 0.8 },
    // Índice (2do metacarpiano + 3 falanges = 4)
    { iStart: 0, iEnd: 5, startFromWristLerp: 0.24, thickness: 0.96 },
    { iStart: 5, iEnd: 6, thickness: 0.88 },
    { iStart: 6, iEnd: 7, thickness: 0.78 },
    { iStart: 7, iEnd: 8, thickness: 0.68 },
    // Medio (3er metacarpiano + 3 falanges = 4)
    { iStart: 0, iEnd: 9, startFromWristLerp: 0.24, thickness: 1.0 },
    { iStart: 9, iEnd: 10, thickness: 0.9 },
    { iStart: 10, iEnd: 11, thickness: 0.8 },
    { iStart: 11, iEnd: 12, thickness: 0.7 },
    // Anular (4to metacarpiano + 3 falanges = 4)
    { iStart: 0, iEnd: 13, startFromWristLerp: 0.24, thickness: 0.92 },
    { iStart: 13, iEnd: 14, thickness: 0.84 },
    { iStart: 14, iEnd: 15, thickness: 0.75 },
    { iStart: 15, iEnd: 16, thickness: 0.66 },
    // Meñique (5to metacarpiano + 3 falanges = 4)
    { iStart: 0, iEnd: 17, startFromWristLerp: 0.24, thickness: 0.86 },
    { iStart: 17, iEnd: 18, thickness: 0.76 },
    { iStart: 18, iEnd: 19, thickness: 0.68 },
    { iStart: 19, iEnd: 20, thickness: 0.6 },
];

/**
 * Sintetiza los 21 puntos anatómicos de una mano a partir de los puntos 15,17,19,21 o 16,18,20,22
 * de MediaPipe Pose cuando el sujeto está en un plano lejano y HandLandmarker no detecta dedos.
 */
function synthesizeHand21PointsFromPose(
    wristLm: any,
    pinkyLm: any,
    indexLm: any,
    thumbLm: any,
    elbowLm: any
): Array<{ x: number; y: number; z: number }> | null {
    if (!wristLm || (wristLm.visibility ?? 0) < 0.35) return null;

    const wx = wristLm.x;
    const wy = wristLm.y;
    const wz = wristLm.z ?? 0;

    let forearmDx = 0;
    let forearmDy = 0.08;
    if (elbowLm && (elbowLm.visibility ?? 0) > 0.3) {
        forearmDx = wx - elbowLm.x;
        forearmDy = wy - elbowLm.y;
    }
    const fLen = Math.hypot(forearmDx, forearmDy) || 0.08;
    const dirX = forearmDx / fLen;
    const dirY = forearmDy / fLen;
    const palmScale = Math.max(0.025, Math.min(0.09, fLen * 0.34));

    const hasIndex = indexLm && (indexLm.visibility ?? 0) > 0.3;
    const hasPinky = pinkyLm && (pinkyLm.visibility ?? 0) > 0.3;
    const hasThumb = thumbLm && (thumbLm.visibility ?? 0) > 0.3;

    const ix = hasIndex ? indexLm.x : wx + dirX * palmScale - dirY * palmScale * 0.32;
    const iy = hasIndex ? indexLm.y : wy + dirY * palmScale + dirX * palmScale * 0.32;
    const iz = hasIndex ? indexLm.z ?? wz : wz;

    const px = hasPinky ? pinkyLm.x : wx + dirX * palmScale * 0.92 + dirY * palmScale * 0.32;
    const py = hasPinky ? pinkyLm.y : wy + dirY * palmScale * 0.92 - dirX * palmScale * 0.32;
    const pz = hasPinky ? pinkyLm.z ?? wz : wz;

    const tx = hasThumb ? thumbLm.x : wx + (ix - wx) * 0.68 + (ix - px) * 0.42;
    const ty = hasThumb ? thumbLm.y : wy + (iy - wy) * 0.68 + (iy - py) * 0.42;
    const tz = hasThumb ? thumbLm.z ?? wz : wz;

    const pts: Array<{ x: number; y: number; z: number }> = new Array(21);
    pts[0] = { x: wx, y: wy, z: wz };

    // Pulgar 1..4 (Pose index 21/22 apunta cerca de nudillo/interfalángica del pulgar)
    const tVecX = tx - wx;
    const tVecY = ty - wy;
    const tVecZ = tz - wz;
    pts[1] = { x: wx + tVecX * 0.35, y: wy + tVecY * 0.35, z: wz + tVecZ * 0.35 };
    pts[2] = { x: wx + tVecX * 0.72, y: wy + tVecY * 0.72, z: wz + tVecZ * 0.72 };
    pts[3] = { x: wx + tVecX * 1.05, y: wy + tVecY * 1.05, z: wz + tVecZ * 1.05 };
    pts[4] = { x: wx + tVecX * 1.32, y: wy + tVecY * 1.32, z: wz + tVecZ * 1.32 };

    // 4 dedos (Índice=5..8, Medio=9..12, Anular=13..16, Meñique=17..20)
    // En MediaPipe Pose, 19/20 (index) y 17/18 (pinky) caen aproximadamente en los nudillos MCP/PIP
    const fingerSpecs = [
        { base: 5, s: 0.0, lenMul: 0.96 },
        { base: 9, s: 0.33, lenMul: 1.05 },
        { base: 13, s: 0.67, lenMul: 0.97 },
        { base: 17, s: 1.0, lenMul: 0.82 },
    ];

    for (const f of fingerSpecs) {
        const kx = ix + (px - ix) * f.s;
        const ky = iy + (py - iy) * f.s;
        const kz = iz + (pz - iz) * f.s;
        const rayX = kx - wx;
        const rayY = ky - wy;
        const rayZ = kz - wz;

        pts[f.base] = { x: wx + rayX * 0.78, y: wy + rayY * 0.78, z: wz + rayZ * 0.78 };
        pts[f.base + 1] = {
            x: wx + rayX * (1.12 * f.lenMul),
            y: wy + rayY * (1.12 * f.lenMul),
            z: wz + rayZ * 1.05,
        };
        pts[f.base + 2] = {
            x: wx + rayX * (1.36 * f.lenMul),
            y: wy + rayY * (1.36 * f.lenMul),
            z: wz + rayZ * 1.12,
        };
        pts[f.base + 3] = {
            x: wx + rayX * (1.56 * f.lenMul),
            y: wy + rayY * (1.56 * f.lenMul),
            z: wz + rayZ * 1.18,
        };
    }

    return pts;
}

// ─── Definición de Puntos de Reposo Anatómicos en Espacio BodyParts3D (mm) ───
interface BoneRestSpec {
    a: Vec3;
    b: Vec3;
    pole: Vec3; // Vector de referencia ortogonal en reposo (+Z anterior o +Y superior)
}

const BONE_REST_SPECS: Record<string, BoneRestSpec> = {
    cranium: { a: vSet(0, 1495, 86), b: vSet(0, 1615, 86), pole: vSet(0, 0, 1) },
    lumbar_lower: { a: vSet(0, 835, 62), b: vSet(0, 985, 74), pole: vSet(0, 0, 1) },
    lumbar_upper: { a: vSet(0, 985, 74), b: vSet(0, 1078, 62), pole: vSet(0, 0, 1) },
    thoracic_lower: { a: vSet(0, 1078, 62), b: vSet(0, 1245, 38), pole: vSet(0, 0, 1) },
    thoracic_upper: { a: vSet(0, 1245, 38), b: vSet(0, 1385, 62), pole: vSet(0, 0, 1) },
    ribcage: { a: vSet(0, 1078, 62), b: vSet(0, 1385, 62), pole: vSet(0, 0, 1) },
    cervical_lower: { a: vSet(0, 1385, 62), b: vSet(0, 1430, 76), pole: vSet(0, 0, 1) },
    cervical_upper: { a: vSet(0, 1430, 76), b: vSet(0, 1495, 86), pole: vSet(0, 0, 1) },
    clavicle_r: { a: vSet(-14, 1342, 138), b: vSet(-148, 1352, 65), pole: vSet(0, 1, 0) },
    clavicle_l: { a: vSet(14, 1342, 138), b: vSet(148, 1352, 65), pole: vSet(0, 1, 0) },
    humerus_r: { a: vSet(-166, 1332, 72), b: vSet(-220, 1052, 72), pole: vSet(0, 0, 1) },
    humerus_l: { a: vSet(166, 1332, 72), b: vSet(220, 1052, 72), pole: vSet(0, 0, 1) },
    forearm_r: { a: vSet(-218, 1052, 72), b: vSet(-258, 820, 118), pole: vSet(0, 0, 1) },
    forearm_l: { a: vSet(218, 1052, 72), b: vSet(258, 820, 118), pole: vSet(0, 0, 1) },
    carpal_r: { a: vSet(-255, 821, 116), b: vSet(-255, 792, 122), pole: vSet(0, 0, 1) },
    carpal_l: { a: vSet(254, 821, 116), b: vSet(254, 792, 122), pole: vSet(0, 0, 1) },
    phalanx_unit: { a: vSet(-268, 735, 135), b: vSet(-270, 695, 156), pole: vSet(0, 0, 1) },
    pelvis: { a: vSet(-88, 835, 82), b: vSet(88, 835, 82), pole: vSet(0, 1, 0) },
    femur_r: { a: vSet(-88, 835, 82), b: vSet(-88, 420, 78), pole: vSet(0, 0, 1) },
    femur_l: { a: vSet(88, 835, 82), b: vSet(88, 420, 78), pole: vSet(0, 0, 1) },
    shank_r: { a: vSet(-88, 420, 78), b: vSet(-88, 55, 66), pole: vSet(0, 0, 1) },
    shank_l: { a: vSet(88, 420, 78), b: vSet(88, 55, 66), pole: vSet(0, 0, 1) },
};

const TMJ_CONDYLE_PIVOT_REST: Vec3 = { x: 0, y: 1508, z: 106 };

const ALL_STRESS_ZONES: StressZoneKey[] = [
    'neutral',
    'neck',
    'trunk',
    'arm_r',
    'arm_l',
    'elbow_r',
    'elbow_l',
    'wrist_r',
    'wrist_l',
    'knee_r',
    'knee_l',
];

const BONE_STRESS_ZONE_MAP: Record<string, StressZoneKey> = {
    cranium: 'neutral',
    mandible: 'neutral',
    cervical_upper: 'neutral',
    cervical_lower: 'neck',
    thoracic_upper: 'neutral',
    thoracic_lower: 'neutral',
    ribcage: 'neutral',
    lumbar_upper: 'neutral',
    lumbar_lower: 'trunk',
    clavicle_r: 'neutral',
    clavicle_l: 'neutral',
    humerus_r: 'arm_r',
    humerus_l: 'arm_l',
    forearm_r: 'elbow_r',
    forearm_l: 'elbow_l',
    carpal_r: 'wrist_r',
    carpal_l: 'wrist_l',
    pelvis: 'neutral',
    femur_r: 'neutral',
    femur_l: 'neutral',
    shank_r: 'knee_r',
    shank_l: 'knee_l',
};

export interface AnatomyXRayFrameInput {
    landmarks: any[] | null;
    worldLandmarks?: any[] | null;
    multiHandLandmarks?: any[][] | null;
    angles?: Partial<BiomechanicAngles> | null;
    jawOpen?: number;
    config?: BiomechanicVisionConfig;
    width?: number;
    height?: number;
}

interface ZoneMaterialPair {
    xray: any;
    solid: any;
    currentSeverity: number;
    targetSeverity: number;
}

/**
 * Instancia WebGL dedicada por `<canvas>` que comparte en memoria las BufferGeometries globales.
 */
class AnatomyCanvasRig {
    public readonly canvas: HTMLCanvasElement;
    private pkg: DecodedAnatomyPackage;
    private renderer: any;
    private scene: any;
    private camera: any;
    private zoneMaterials: Record<StressZoneKey, ZoneMaterialPair>;
    private boneMeshes: Map<string, any> = new Map();
    private phalanxPoolR: any[] = [];
    private phalanxPoolL: any[] = [];

    private width = 640;
    private height = 480;
    private disposed = false;
    private rafId: number | null = null;
    private startTimeMs = performance.now();
    private lastInputWallMs = 0;

    // Estado interpolado a 60 FPS
    private smoothedPose: Array<{ x: number; y: number; z: number; visibility: number }> | null =
        null;
    private latestHands: any[][] | null = null;
    private smoothedJawOpen = 0;
    private targetJawOpen = 0;
    private currentConfig: BiomechanicVisionConfig = {
        ...DEFAULT_BIOMECH_VISION_CONFIG,
        layers: { ...DEFAULT_BIOMECH_VISION_CONFIG.layers },
    };

    // Matrices temporales reutilizables
    private tmpMatA: any;
    private tmpMatB: any;
    private tmpMatC: any;
    private tmpMatCranium: any;

    constructor(canvas: HTMLCanvasElement, pkg: DecodedAnatomyPackage) {
        this.canvas = canvas;
        this.pkg = pkg;
        const { THREE } = pkg;

        this.width = Math.max(1, canvas.width || canvas.clientWidth || 640);
        this.height = Math.max(1, canvas.height || canvas.clientHeight || 480);

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));
        this.renderer.setSize(this.width, this.height, false);

        this.scene = new THREE.Scene();

        // Cámara Ortográfica exacta en espacio de píxeles del video:
        // X: [0 .. width] (derecha), Y: [0 .. -height] (arriba=0, abajo=-height), Z: hacia cámara (+1200)
        this.camera = new THREE.OrthographicCamera(
            0,
            this.width,
            0,
            -this.height,
            -3000,
            3000
        );
        this.camera.position.set(0, 0, 1200);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();

        // Iluminación quirúrgica para modo alternativo `clinical_solid`
        const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 0.95);
        hemiLight.position.set(0, 600, 800);
        this.scene.add(hemiLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
        keyLight.position.set(350, 500, 1400);
        this.scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
        rimLight.position.set(-450, 200, 500);
        this.scene.add(rimLight);

        // Crear materiales por zona de estrés ergonómico
        const mats = {} as Record<StressZoneKey, ZoneMaterialPair>;
        for (const zone of ALL_STRESS_ZONES) {
            const xray = new THREE.ShaderMaterial({
                vertexShader: XRAY_VERTEX_SHADER,
                fragmentShader: XRAY_FRAGMENT_SHADER,
                uniforms: {
                    uCoreColor: { value: new THREE.Color(...RGB_CORE_NORMAL) },
                    uRimColor: { value: new THREE.Color(...RGB_RIM_NORMAL) },
                    uOpacity: { value: this.currentConfig.opacity },
                    uSeverity: { value: 0.0 },
                    uTime: { value: 0.0 },
                },
                transparent: true,
                depthWrite: false,
                depthTest: true,
                side: THREE.DoubleSide,
                blending: THREE.NormalBlending,
            });

            const solid = new THREE.MeshPhongMaterial({
                color: new THREE.Color(...SOLID_BASE_NORMAL),
                emissive: new THREE.Color(...SOLID_EMISSIVE_NORMAL),
                specular: new THREE.Color(0x94a3b8),
                shininess: 36,
                transparent: true,
                opacity: this.currentConfig.opacity,
                depthWrite: true,
                depthTest: true,
                side: THREE.DoubleSide,
            });

            mats[zone] = {
                xray,
                solid,
                currentSeverity: 0,
                targetSeverity: 0,
            };
        }
        this.zoneMaterials = mats;

        // Instanciar los 22 grupos óseos principales + pool de 38 falanges/metacarpos
        for (const [key, geom] of pkg.geometries.entries()) {
            if (key === 'phalanx_unit') continue;
            const zone = BONE_STRESS_ZONE_MAP[key] || 'neutral';
            const mesh = new THREE.Mesh(geom, this.zoneMaterials[zone].xray);
            mesh.matrixAutoUpdate = false;
            mesh.frustumCulled = false;
            mesh.visible = false;
            this.scene.add(mesh);
            this.boneMeshes.set(key, mesh);
        }

        const phalanxGeom = pkg.geometries.get('phalanx_unit');
        if (phalanxGeom) {
            for (let i = 0; i < 19; i++) {
                const mR = new THREE.Mesh(phalanxGeom, this.zoneMaterials.wrist_r.xray);
                mR.matrixAutoUpdate = false;
                mR.frustumCulled = false;
                mR.visible = false;
                this.scene.add(mR);
                this.phalanxPoolR.push(mR);

                const mL = new THREE.Mesh(phalanxGeom, this.zoneMaterials.wrist_l.xray);
                mL.matrixAutoUpdate = false;
                mL.frustumCulled = false;
                mL.visible = false;
                this.scene.add(mL);
                this.phalanxPoolL.push(mL);
            }
        }

        this.tmpMatA = new THREE.Matrix4();
        this.tmpMatB = new THREE.Matrix4();
        this.tmpMatC = new THREE.Matrix4();
        this.tmpMatCranium = new THREE.Matrix4();
    }

    private ensureViewportSize(w: number, h: number) {
        const nextW = Math.max(1, Math.round(w));
        const nextH = Math.max(1, Math.round(h));
        if (nextW === this.width && nextH === this.height) return;
        this.width = nextW;
        this.height = nextH;
        this.renderer.setSize(nextW, nextH, false);
        this.camera.left = 0;
        this.camera.right = nextW;
        this.camera.top = 0;
        this.camera.bottom = -nextH;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Calcula la matriz afín 4x4 exacta que mapea el hueso en reposo (A_rest -> B_rest, pole_rest)
     * hacia el segmento anatómico 3D actual en pantalla (A_world -> B_world, pole_world) con escalas
     * transversales independientes para preservar el grosor óseo real sin deformaciones.
     */
    private applyBoneTransform(
        mesh: any,
        restSpec: BoneRestSpec,
        worldA: Vec3,
        worldB: Vec3,
        worldPole: Vec3,
        scaleX: number,
        scaleZ: number,
        fallbackPole: Vec3 = { x: 1, y: 0, z: 0 }
    ) {
        const restVec = vSub(restSpec.b, restSpec.a);
        const restLen = vLen(restVec);
        const worldVec = vSub(worldB, worldA);
        const worldLen = vLen(worldVec);

        if (restLen < 1e-4 || worldLen < 1e-3) {
            mesh.visible = false;
            return;
        }

        const yRest = vScale(restVec, 1 / restLen);
        let xRestRaw = vCross(yRest, restSpec.pole);
        if (vLen(xRestRaw) < 1e-3) {
            xRestRaw = vCross(yRest, { x: 1, y: 0, z: 0 });
        }
        const xRest = vNorm(xRestRaw, { x: 1, y: 0, z: 0 });
        const zRest = vNorm(vCross(xRest, yRest), { x: 0, y: 0, z: 1 });

        const yWorld = vScale(worldVec, 1 / worldLen);
        let xWorldRaw = vCross(yWorld, worldPole);
        if (vLen(xWorldRaw) < 0.08) {
            xWorldRaw = vCross(yWorld, fallbackPole);
            if (vLen(xWorldRaw) < 0.08) {
                xWorldRaw = vCross(yWorld, { x: 0, y: 1, z: 0 });
            }
        }
        const xWorld = vNorm(xWorldRaw, { x: 1, y: 0, z: 0 });
        const zWorld = vNorm(vCross(xWorld, yWorld), { x: 0, y: 0, z: 1 });

        const sy = worldLen / restLen;
        const sx = Math.max(0.02, scaleX);
        const sz = Math.max(0.02, scaleZ);

        // R_rest^T * T(-A_rest): lleva vértice de espacio BodyParts3D mm a marco local ortonormal del hueso
        const rtx = -(xRest.x * restSpec.a.x + xRest.y * restSpec.a.y + xRest.z * restSpec.a.z);
        const rty = -(yRest.x * restSpec.a.x + yRest.y * restSpec.a.y + yRest.z * restSpec.a.z);
        const rtz = -(zRest.x * restSpec.a.x + zRest.y * restSpec.a.y + zRest.z * restSpec.a.z);

        this.tmpMatA.set(
            xRest.x, xRest.y, xRest.z, rtx,
            yRest.x, yRest.y, yRest.z, rty,
            zRest.x, zRest.y, zRest.z, rtz,
            0, 0, 0, 1
        );

        // T(A_world) * R_world * S(sx, sy, sz)
        this.tmpMatB.set(
            xWorld.x * sx, yWorld.x * sy, zWorld.x * sz, worldA.x,
            xWorld.y * sx, yWorld.y * sy, zWorld.y * sz, worldA.y,
            xWorld.z * sx, yWorld.z * sy, zWorld.z * sz, worldA.z,
            0, 0, 0, 1
        );

        mesh.matrix.multiplyMatrices(this.tmpMatB, this.tmpMatA);
        mesh.matrixWorldNeedsUpdate = true;
    }

    private computeSeverities(
        landmarks: any[],
        worldLandmarks: any[] | null | undefined,
        angles: Partial<BiomechanicAngles> | null | undefined,
        hands: any[][] | null
    ) {
        const neck = angles?.neck ?? null;
        const trunk = angles?.trunk ?? null;
        const globalArm = angles?.arm ?? null;
        const globalElbow = angles?.elbow ?? null;
        const globalWrist = angles?.wrist ?? null;
        const globalKnee = angles?.knee ?? null;

        const mapRange = (val: number | null, low: number, mid: number, high: number): number => {
            if (val === null || !Number.isFinite(val)) return 0;
            if (val <= low) return 0;
            if (val <= mid) return ((val - low) / Math.max(1, mid - low)) * 0.5;
            if (val >= high) return 1;
            return 0.5 + ((val - mid) / Math.max(1, high - mid)) * 0.5;
        };

        const mapElbow = (val: number | null): number => {
            if (val === null || !Number.isFinite(val)) return 0;
            if (val >= 60 && val <= 100) return 0;
            if (val < 60) {
                if (val <= 30) return 1;
                return ((60 - val) / 30) * 0.65;
            }
            if (val >= 130) return 1;
            return ((val - 100) / 30) * 0.65;
        };

        this.zoneMaterials.neutral.targetSeverity = 0;
        this.zoneMaterials.neck.targetSeverity = mapRange(neck, 10, 18, 26);
        this.zoneMaterials.trunk.targetSeverity = mapRange(trunk, 8, 16, 25);

        // Evaluar asimétricamente brazo/codo/muñeca/rodilla derecho vs izquierdo cuando hay visibilidad
        const src = worldLandmarks && worldLandmarks.length >= 29 ? worldLandmarks : landmarks;
        const vis = (idx: number) => (landmarks[idx]?.visibility ?? 0) > 0.38;

        let armR = globalArm;
        let armL = globalArm;
        if (vis(12) && vis(14)) {
            armR = vis(24)
                ? calc3DAngle(src[24], src[12], src[14])
                : calc3DVerticalAngle(src[14], src[12]);
        }
        if (vis(11) && vis(13)) {
            armL = vis(23)
                ? calc3DAngle(src[23], src[11], src[13])
                : calc3DVerticalAngle(src[13], src[11]);
        }
        this.zoneMaterials.arm_r.targetSeverity = mapRange(armR, 20, 34, 46);
        this.zoneMaterials.arm_l.targetSeverity = mapRange(armL, 20, 34, 46);

        const elbowR = vis(12) && vis(14) && vis(16) ? calc3DAngle(src[12], src[14], src[16]) : globalElbow;
        const elbowL = vis(11) && vis(13) && vis(15) ? calc3DAngle(src[11], src[13], src[15]) : globalElbow;
        this.zoneMaterials.elbow_r.targetSeverity = mapElbow(elbowR);
        this.zoneMaterials.elbow_l.targetSeverity = mapElbow(elbowL);

        const evalSideWrist = (elbowIdx: number, wristIdx: number, handPts: any[] | null): number | null => {
            if (!vis(elbowIdx) || !vis(wristIdx)) return globalWrist;
            if (handPts && handPts[0] && handPts[9]) {
                const raw = calc3DAngle(landmarks[elbowIdx], handPts[0], handPts[9]);
                if (raw !== null) return Math.abs(180 - raw);
            }
            return globalWrist;
        };

        const { rightHand, leftHand } = this.matchHandsToWrists(landmarks, hands);
        const wristR = evalSideWrist(14, 16, rightHand);
        const wristL = evalSideWrist(13, 15, leftHand);
        this.zoneMaterials.wrist_r.targetSeverity = mapRange(wristR, 14, 18, 25);
        this.zoneMaterials.wrist_l.targetSeverity = mapRange(wristL, 14, 18, 25);

        let kneeR = globalKnee;
        let kneeL = globalKnee;
        if (vis(24) && vis(26) && vis(28)) {
            const rk = calc3DAngle(src[24], src[26], src[28]);
            if (rk !== null) kneeR = Math.max(0, 180 - rk);
        }
        if (vis(23) && vis(25) && vis(27)) {
            const lk = calc3DAngle(src[23], src[25], src[27]);
            if (lk !== null) kneeL = Math.max(0, 180 - lk);
        }
        this.zoneMaterials.knee_r.targetSeverity = mapRange(kneeR, 25, 42, 60);
        this.zoneMaterials.knee_l.targetSeverity = mapRange(kneeL, 25, 42, 60);
    }

    private matchHandsToWrists(
        landmarks: any[],
        hands: any[][] | null
    ): { rightHand: any[] | null; leftHand: any[] | null } {
        let rightHand: any[] | null = null;
        let leftHand: any[] | null = null;

        if (Array.isArray(hands) && hands.length > 0) {
            const rw = landmarks[16];
            const lw = landmarks[15];
            const rwVis = rw && (rw.visibility ?? 0) > 0.3;
            const lwVis = lw && (lw.visibility ?? 0) > 0.3;

            for (const h of hands) {
                if (!Array.isArray(h) || h.length < 21 || !h[0]) continue;
                const dR = rwVis ? Math.hypot(h[0].x - rw.x, h[0].y - rw.y) : 999;
                const dL = lwVis ? Math.hypot(h[0].x - lw.x, h[0].y - lw.y) : 999;
                if (dR <= dL && dR < 0.22 && !rightHand) {
                    rightHand = h;
                } else if (dL < dR && dL < 0.22 && !leftHand) {
                    leftHand = h;
                } else if (!rightHand && dR < 0.28) {
                    rightHand = h;
                } else if (!leftHand && dL < 0.28) {
                    leftHand = h;
                }
            }
        }
        return { rightHand, leftHand };
    }

    public updateTargetState(input: AnatomyXRayFrameInput) {
        if (this.disposed) return;

        if (input.width && input.height) {
            this.ensureViewportSize(input.width, input.height);
        } else if (this.canvas.width > 0 && this.canvas.height > 0) {
            this.ensureViewportSize(this.canvas.width, this.canvas.height);
        }

        if (input.config) {
            this.currentConfig = input.config;
        }

        if (!input.landmarks || input.landmarks.length < 25 || this.currentConfig.mode !== 'xray_3d') {
            if (this.currentConfig.mode !== 'xray_3d' || !input.landmarks) {
                this.hideAllMeshes();
                this.renderer.clear();
            }
            return;
        }

        this.lastInputWallMs = performance.now();
        this.latestHands = input.multiHandLandmarks || null;
        this.targetJawOpen = Math.min(1, Math.max(0, input.jawOpen ?? input.angles?.jawOpen ?? 0));

        if (!this.smoothedPose || this.smoothedPose.length !== input.landmarks.length) {
            this.smoothedPose = input.landmarks.map((lm: any) => ({
                x: lm?.x ?? 0,
                y: lm?.y ?? 0,
                z: lm?.z ?? 0,
                visibility: lm?.visibility ?? 0,
            }));
        } else {
            const alpha = 0.52;
            for (let i = 0; i < input.landmarks.length; i++) {
                const src = input.landmarks[i];
                const dst = this.smoothedPose[i];
                if (!src) continue;
                dst.x += ((src.x ?? dst.x) - dst.x) * alpha;
                dst.y += ((src.y ?? dst.y) - dst.y) * alpha;
                dst.z += ((src.z ?? dst.z) - dst.z) * 0.35;
                dst.visibility = src.visibility ?? dst.visibility;
            }
        }

        this.computeSeverities(
            input.landmarks,
            input.worldLandmarks,
            input.angles,
            this.latestHands
        );

        this.stepSimulationAndRender();
        this.ensureLoopRunning();
    }

    private hideAllMeshes() {
        this.boneMeshes.forEach((m) => {
            m.visible = false;
        });
        for (let i = 0; i < this.phalanxPoolR.length; i++) {
            this.phalanxPoolR[i].visible = false;
            this.phalanxPoolL[i].visible = false;
        }
    }

    private ensureLoopRunning() {
        if (this.rafId !== null || this.disposed) return;
        const tick = () => {
            if (this.disposed) {
                this.rafId = null;
                return;
            }
            const now = performance.now();
            if (
                this.currentConfig.mode !== 'xray_3d' ||
                !this.smoothedPose ||
                now - this.lastInputWallMs > 1200
            ) {
                this.rafId = null;
                return;
            }
            this.stepSimulationAndRender();
            this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
    }

    public flushRenderNow() {
        if (this.disposed) return;
        if (this.currentConfig.mode !== 'xray_3d' || !this.smoothedPose) return;
        this.stepSimulationAndRender();
    }

    private stepSimulationAndRender() {
        if (this.disposed || !this.smoothedPose) return;

        const elapsedSec = (performance.now() - this.startTimeMs) * 0.001;
        const isSolid = this.currentConfig.shaderStyle === 'clinical_solid';
        const opacity = Math.min(1, Math.max(0.3, this.currentConfig.opacity));
        const layers = this.currentConfig.layers;

        // 1. Actualizar materiales (lerp temporal 0.15 por frame + pulso clínico)
        for (const zone of ALL_STRESS_ZONES) {
            const zm = this.zoneMaterials[zone];
            zm.currentSeverity += (zm.targetSeverity - zm.currentSeverity) * 0.15;
            const sev = zm.currentSeverity;

            const coreRgb = sampleTriStop(RGB_CORE_NORMAL, RGB_CORE_WARN, RGB_CORE_CRIT, sev);
            const rimRgb = sampleTriStop(RGB_RIM_NORMAL, RGB_RIM_WARN, RGB_RIM_CRIT, sev);

            zm.xray.uniforms.uCoreColor.value.setRGB(coreRgb[0], coreRgb[1], coreRgb[2]);
            zm.xray.uniforms.uRimColor.value.setRGB(rimRgb[0], rimRgb[1], rimRgb[2]);
            zm.xray.uniforms.uOpacity.value = opacity;
            zm.xray.uniforms.uSeverity.value = sev;
            zm.xray.uniforms.uTime.value = elapsedSec;

            const solidRgb = sampleTriStop(SOLID_BASE_NORMAL, SOLID_BASE_WARN, SOLID_BASE_CRIT, sev);
            const emisRgb = sampleTriStop(
                SOLID_EMISSIVE_NORMAL,
                SOLID_EMISSIVE_WARN,
                SOLID_EMISSIVE_CRIT,
                sev
            );
            const critPulse = sev > 0.65 ? 0.85 + 0.15 * Math.sin(elapsedSec * 13.8) : 1;
            zm.solid.color.setRGB(solidRgb[0], solidRgb[1], solidRgb[2]);
            zm.solid.emissive.setRGB(
                emisRgb[0] * critPulse,
                emisRgb[1] * critPulse,
                emisRgb[2] * critPulse
            );
            zm.solid.opacity = opacity;
            zm.solid.transparent = opacity < 0.99;
        }

        // Conmutar material activo según shaderStyle
        this.boneMeshes.forEach((mesh, key) => {
            const zone = BONE_STRESS_ZONE_MAP[key] || 'neutral';
            const targetMat = isSolid
                ? this.zoneMaterials[zone].solid
                : this.zoneMaterials[zone].xray;
            if (mesh.material !== targetMat) mesh.material = targetMat;
        });
        const handMatR = isSolid ? this.zoneMaterials.wrist_r.solid : this.zoneMaterials.wrist_r.xray;
        const handMatL = isSolid ? this.zoneMaterials.wrist_l.solid : this.zoneMaterials.wrist_l.xray;
        for (let i = 0; i < 19; i++) {
            if (this.phalanxPoolR[i].material !== handMatR) this.phalanxPoolR[i].material = handMatR;
            if (this.phalanxPoolL[i].material !== handMatL) this.phalanxPoolL[i].material = handMatL;
        }

        // Suavizar apertura mandibular ATM
        this.smoothedJawOpen += (this.targetJawOpen - this.smoothedJawOpen) * 0.4;

        // 2. Proyección de landmarks MediaPipe a espacio ortográfico dextrógiro (X: 0..W, Y: 0..-H, Z: hacia cámara)
        const lm = this.smoothedPose;
        const W = this.width;
        const H = this.height;
        const zDepthScale = W * 0.52;

        const toWorld = (idx: number): Vec3 => ({
            x: lm[idx].x * W,
            y: -lm[idx].y * H,
            z: -(lm[idx].z ?? 0) * zDepthScale,
        });
        const isVis = (idx: number, minV = 0.35): boolean =>
            Boolean(lm[idx]) && (lm[idx].visibility ?? 0) >= minV;

        const hasShoulders = isVis(11, 0.3) && isVis(12, 0.3);
        if (!hasShoulders) {
            this.hideAllMeshes();
            this.renderer.render(this.scene, this.camera);
            return;
        }

        const pShoulderL = toWorld(11); // Izquierda anatómica (+X al mirar a cámara)
        const pShoulderR = toWorld(12); // Derecha anatómica (-X al mirar a cámara)
        const shoulderMid = vLerp(pShoulderR, pShoulderL, 0.5);

        const shoulderSpan2D = Math.hypot(pShoulderL.x - pShoulderR.x, pShoulderL.y - pShoulderR.y);
        const shoulderSpan3D = vLen(vSub(pShoulderL, pShoulderR));

        // Estimación de tamaño cefálico para estabilizar escala en vistas laterales puras
        let headRefSpanPx = H * 0.13;
        if (isVis(0, 0.3)) {
            const pNoseTmp = toWorld(0);
            headRefSpanPx = Math.max(headRefSpanPx, Math.abs(pNoseTmp.y - shoulderMid.y) * 0.85);
        }

        const hipsTrulyVisible =
            isVis(23, 0.35) &&
            isVis(24, 0.35) &&
            lm[23].y <= 1.02 &&
            lm[24].y <= 1.02 &&
            lm[23].y >= -0.05 &&
            lm[24].y >= -0.05;

        let pHipL: Vec3;
        let pHipR: Vec3;
        let hipMid: Vec3;

        const effectiveShoulderWidthPx = Math.max(
            shoulderSpan2D,
            shoulderSpan3D * 0.85,
            headRefSpanPx * 1.48,
            H * 0.19
        );

        if (hipsTrulyVisible) {
            pHipL = toWorld(23);
            pHipR = toWorld(24);
            hipMid = vLerp(pHipR, pHipL, 0.5);
        } else {
            // Modo Busto de Escritorio: extrapolar pelvis virtual suavemente hacia abajo a shoulderWidthPx * 1.48
            const virtualTorsoLen = effectiveShoulderWidthPx * 1.48;
            let leanDx = 0;
            let leanDz = 0;
            if (lm[23] && lm[24] && ((lm[23].visibility ?? 0) > 0.12 || (lm[24].visibility ?? 0) > 0.12)) {
                const rawHipMidX = ((lm[23].x + lm[24].x) * 0.5) * W;
                leanDx = Math.max(-virtualTorsoLen * 0.28, Math.min(virtualTorsoLen * 0.28, (rawHipMidX - shoulderMid.x) * 0.45));
            }
            hipMid = {
                x: shoulderMid.x + leanDx,
                y: shoulderMid.y - virtualTorsoLen,
                z: shoulderMid.z + leanDz - effectiveShoulderWidthPx * 0.06,
            };
            const halfPelvisVec = vScale(vNorm(vSub(pShoulderL, pShoulderR), { x: 1, y: 0, z: 0 }), effectiveShoulderWidthPx * 0.28);
            pHipL = vAdd(hipMid, halfPelvisVec);
            pHipR = vSub(hipMid, halfPelvisVec);
        }

        const torsoVec = vSub(shoulderMid, hipMid);
        const torsoLenPx = Math.max(40, vLen(torsoVec));
        const torsoUp = vNorm(torsoVec, { x: 0, y: 1, z: 0 });

        // Vector anatómico Derecha -> Izquierda (12 -> 11) estabilizado en perfil lateral
        let rightToLeft = vSub(pShoulderL, pShoulderR);
        if (Math.abs(pShoulderL.x - pShoulderR.x) < effectiveShoulderWidthPx * 0.38 && isVis(0, 0.35)) {
            // En vista de perfil, usar la dirección de la nariz para desambiguar orientación anterior (+Z / ±X)
            const pNose = toWorld(0);
            const faceSignX = pNose.x >= shoulderMid.x ? 1 : -1;
            // Si mira hacia +X (derecha de pantalla), su hombro derecho (12) está más cerca (+Z) y el izquierdo (11) al fondo (-Z)
            rightToLeft = {
                x: pShoulderL.x - pShoulderR.x,
                y: pShoulderL.y - pShoulderR.y,
                z: -faceSignX * effectiveShoulderWidthPx * 0.85,
            };
        }

        const torsoLeft = vNorm(
            vSub(rightToLeft, vScale(torsoUp, vDot(rightToLeft, torsoUp))),
            { x: 1, y: 0, z: 0 }
        );
        // En sistema dextrógiro: Left (+X) × Up (+Y) = Anterior/Forward (+Z)
        const torsoForward = vNorm(vCross(torsoLeft, torsoUp), { x: 0, y: 0, z: 1 });

        // Escala anatómica corporal (px por mm de BodyParts3D)
        const sFromShoulders = shoulderSpan3D / 332;
        const sFromTorso = torsoLenPx / 515;
        const bodyScale = Math.max(sFromShoulders, sFromTorso * 0.96, 0.08);
        const ribWidthScale = Math.max(
            bodyScale * 0.82,
            Math.min(bodyScale * 1.18, Math.max(shoulderSpan3D, effectiveShoulderWidthPx * 0.92) / 318)
        );

        // ─── A. CRÁNEO Y MANDÍBULA ATM (skull) ───────────────────────────────
        const craniumMesh = this.boneMeshes.get('cranium');
        const mandibleMesh = this.boneMeshes.get('mandible');

        let cranialBaseWorld: Vec3 = vAdd(
            shoulderMid,
            vAdd(vScale(torsoUp, 118 * bodyScale), vScale(torsoForward, 14 * bodyScale))
        );

        const hasNose = isVis(0, 0.32);
        const hasEarL = isVis(7, 0.32);
        const hasEarR = isVis(8, 0.32);
        const hasEyeL = isVis(2, 0.32);
        const hasEyeR = isVis(5, 0.32);

        if (hasNose || hasEarL || hasEarR) {
            const pNose = hasNose
                ? toWorld(0)
                : vAdd(cranialBaseWorld, vAdd(vScale(torsoUp, 30 * bodyScale), vScale(torsoForward, 95 * bodyScale)));

            let earMid: Vec3;
            if (hasEarL && hasEarR) {
                earMid = vLerp(toWorld(8), toWorld(7), 0.5);
            } else if (hasEarL) {
                earMid = vSub(toWorld(7), vScale(torsoLeft, 68 * bodyScale));
            } else if (hasEarR) {
                earMid = vAdd(toWorld(8), vScale(torsoLeft, 68 * bodyScale));
            } else {
                earMid = vSub(pNose, vScale(torsoForward, 96 * bodyScale));
            }

            let headScale = bodyScale * 1.02;
            if (hasEarL && hasEarR) {
                const earSpan = vLen(vSub(toWorld(7), toWorld(8)));
                headScale = Math.max(bodyScale * 0.88, Math.min(bodyScale * 1.24, earSpan / 144));
            }

            // Roll ocular / biauricular
            let headLeftDir = torsoLeft;
            if (hasEyeL && hasEyeR) {
                const eyeVec = vSub(toWorld(2), toWorld(5));
                if (vLen(eyeVec) > 6) {
                    headLeftDir = vNorm({
                        x: eyeVec.x,
                        y: eyeVec.y,
                        z: torsoLeft.z * vLen(eyeVec),
                    }, torsoLeft);
                }
            } else if (hasEarL && hasEarR) {
                const earVec = vSub(toWorld(7), toWorld(8));
                if (vLen(earVec) > 8) {
                    headLeftDir = vNorm(earVec, torsoLeft);
                }
            }

            // Yaw y Pitch reales desde vector earMid -> pNose
            const earToNose2DX = pNose.x - earMid.x;
            const earToNose2DY = pNose.y - earMid.y;
            const maxHeadRadiusPx = Math.max(24, 102 * headScale);
            const sinYaw = Math.max(-0.96, Math.min(0.96, earToNose2DX / maxHeadRadiusPx));
            const cosYaw = Math.sqrt(Math.max(0.06, 1 - sinYaw * sinYaw)) * (torsoForward.z >= -0.15 ? 1 : -1);

            const pitchRatio = Math.max(
                -0.68,
                Math.min(0.68, (earToNose2DY - 10 * headScale) / maxHeadRadiusPx)
            );

            const rawForward = vNorm({
                x: sinYaw,
                y: pitchRatio * 0.85,
                z: cosYaw,
            }, torsoForward);

            let headUpDir = vNorm(vCross(rawForward, headLeftDir), torsoUp);
            if (vDot(headUpDir, torsoUp) < 0) {
                headUpDir = vScale(headUpDir, -1);
            }
            const headLeftOrtho = vNorm(vCross(headUpDir, rawForward), headLeftDir);
            const headForwardOrtho = vNorm(vCross(headLeftOrtho, headUpDir), rawForward);

            // Anclar base craneal [0, 1495, 86] combinando centro biauricular y puente nasal [0, 1520, 194]
            const baseFromEars = vSub(earMid, vScale(headUpDir, 13 * headScale));
            const baseFromNose = vSub(
                pNose,
                vAdd(
                    vScale(headUpDir, 25 * headScale),
                    vScale(headForwardOrtho, 108 * headScale)
                )
            );
            cranialBaseWorld =
                hasEarL && hasEarR
                    ? vLerp(baseFromEars, baseFromNose, 0.45)
                    : hasNose
                      ? baseFromNose
                      : baseFromEars;

            if (layers.skull && craniumMesh) {
                const cranialTopWorld = vAdd(cranialBaseWorld, vScale(headUpDir, 120 * headScale));
                this.applyBoneTransform(
                    craniumMesh,
                    BONE_REST_SPECS.cranium,
                    cranialBaseWorld,
                    cranialTopWorld,
                    headForwardOrtho,
                    headScale,
                    headScale,
                    headLeftOrtho
                );
                craniumMesh.visible = true;
                this.tmpMatCranium.copy(craniumMesh.matrix);

                if (mandibleMesh) {
                    // Rotación de mandíbula alrededor de cóndilos ATM [0, 1508, 106] en espacio anatómico del cráneo
                    const jawRad = this.smoothedJawOpen * 0.46;
                    const c = Math.cos(jawRad);
                    const s = Math.sin(jawRad);
                    const py = TMJ_CONDYLE_PIVOT_REST.y;
                    const pz = TMJ_CONDYLE_PIVOT_REST.z;

                    // T(pivot) * Rx(jawRad) * T(-pivot): en sistema dextrógiro Rx(+theta) rota +Z (mentón) hacia -Y (abajo)
                    this.tmpMatC.set(
                        1, 0, 0, 0,
                        0, c, -s, py - c * py + s * pz,
                        0, s, c, pz - s * py - c * pz,
                        0, 0, 0, 1
                    );
                    mandibleMesh.matrix.multiplyMatrices(this.tmpMatCranium, this.tmpMatC);
                    mandibleMesh.matrixWorldNeedsUpdate = true;
                    mandibleMesh.visible = true;
                }
            } else {
                if (craniumMesh) craniumMesh.visible = false;
                if (mandibleMesh) mandibleMesh.visible = false;
            }
        } else {
            if (craniumMesh) craniumMesh.visible = false;
            if (mandibleMesh) mandibleMesh.visible = false;
        }

        // ─── B. COLUMNA ARTICULADA C1-S1 Y CAJA TORÁCICA (spine) ────────────
        // T1 / Base cervical ligeramente superior al punto medio acromial y ligeramente posterior al esternón
        const neckBaseWorld = vAdd(
            shoulderMid,
            vAdd(vScale(torsoUp, 18 * bodyScale), vScale(torsoForward, -14 * bodyScale))
        );
        const sacrumBaseWorld = vAdd(hipMid, vScale(torsoForward, -16 * bodyScale));

        // Curva suave fisiológica toracolumbar (lordosis lumbar + cifosis dorsal sutil)
        const spineMidControl = vAdd(
            vLerp(sacrumBaseWorld, neckBaseWorld, 0.5),
            vScale(torsoForward, 14 * bodyScale)
        );
        const sampleThoracoLumbar = (t: number): Vec3 =>
            quadBezier3(sacrumBaseWorld, spineMidControl, neckBaseWorld, t);

        // Curva cervical C7 -> C1 (lordosis cervical suave)
        const neckMidControl = vAdd(
            vLerp(neckBaseWorld, cranialBaseWorld, 0.5),
            vScale(torsoForward, 10 * bodyScale)
        );
        const sampleCervical = (t: number): Vec3 =>
            quadBezier3(neckBaseWorld, neckMidControl, cranialBaseWorld, t);

        const spineSegments: Array<{ key: string; a: Vec3; b: Vec3; sx: number; sz: number }> = [
            {
                key: 'lumbar_lower',
                a: sampleThoracoLumbar(0.0),
                b: sampleThoracoLumbar(0.28),
                sx: bodyScale,
                sz: bodyScale,
            },
            {
                key: 'lumbar_upper',
                a: sampleThoracoLumbar(0.28),
                b: sampleThoracoLumbar(0.44),
                sx: bodyScale,
                sz: bodyScale,
            },
            {
                key: 'thoracic_lower',
                a: sampleThoracoLumbar(0.44),
                b: sampleThoracoLumbar(0.68),
                sx: bodyScale,
                sz: bodyScale,
            },
            {
                key: 'thoracic_upper',
                a: sampleThoracoLumbar(0.68),
                b: sampleThoracoLumbar(0.96),
                sx: bodyScale,
                sz: bodyScale,
            },
            {
                key: 'ribcage',
                a: sampleThoracoLumbar(0.44),
                b: sampleThoracoLumbar(0.96),
                sx: ribWidthScale,
                sz: bodyScale,
            },
            {
                key: 'cervical_lower',
                a: sampleCervical(0.0),
                b: sampleCervical(0.42),
                sx: bodyScale,
                sz: bodyScale,
            },
            {
                key: 'cervical_upper',
                a: sampleCervical(0.42),
                b: sampleCervical(1.0),
                sx: bodyScale,
                sz: bodyScale,
            },
        ];

        for (const seg of spineSegments) {
            const mesh = this.boneMeshes.get(seg.key);
            if (!mesh) continue;
            if (!layers.spine) {
                mesh.visible = false;
                continue;
            }
            this.applyBoneTransform(
                mesh,
                BONE_REST_SPECS[seg.key],
                seg.a,
                seg.b,
                torsoForward,
                seg.sx,
                seg.sz,
                torsoLeft
            );
            mesh.visible = true;
        }

        // ─── C. CLAVÍCULAS, BRAZOS Y MANOS DE 21 PUNTOS (upperLimbs) ────────
        const setUpperVisible = (key: string, visFlag: boolean) => {
            const m = this.boneMeshes.get(key);
            if (m && !visFlag) m.visible = false;
            return m;
        };

        if (!layers.upperLimbs) {
            for (const k of [
                'clavicle_r',
                'clavicle_l',
                'humerus_r',
                'humerus_l',
                'forearm_r',
                'forearm_l',
                'carpal_r',
                'carpal_l',
            ]) {
                setUpperVisible(k, false);
            }
            for (let i = 0; i < 19; i++) {
                this.phalanxPoolR[i].visible = false;
                this.phalanxPoolL[i].visible = false;
            }
        } else {
            // Manubrio esternal en el borde anterosuperior de la caja torácica
            const manubriumCenter = vAdd(
                sampleThoracoLumbar(0.86),
                vScale(torsoForward, 66 * bodyScale)
            );
            const sternoR = vSub(manubriumCenter, vScale(torsoLeft, 14 * bodyScale));
            const sternoL = vAdd(manubriumCenter, vScale(torsoLeft, 14 * bodyScale));

            const clavR = this.boneMeshes.get('clavicle_r');
            if (clavR) {
                this.applyBoneTransform(
                    clavR,
                    BONE_REST_SPECS.clavicle_r,
                    sternoR,
                    pShoulderR,
                    torsoUp,
                    bodyScale,
                    bodyScale,
                    torsoForward
                );
                clavR.visible = true;
            }
            const clavL = this.boneMeshes.get('clavicle_l');
            if (clavL) {
                this.applyBoneTransform(
                    clavL,
                    BONE_REST_SPECS.clavicle_l,
                    sternoL,
                    pShoulderL,
                    torsoUp,
                    bodyScale,
                    bodyScale,
                    torsoForward
                );
                clavL.visible = true;
            }

            // Húmero y Antebrazo Derecho (12 -> 14 -> 16)
            const humR = this.boneMeshes.get('humerus_r');
            const foreR = this.boneMeshes.get('forearm_r');
            if (humR && isVis(14, 0.32)) {
                const pElbowR = toWorld(14);
                this.applyBoneTransform(
                    humR,
                    BONE_REST_SPECS.humerus_r,
                    pShoulderR,
                    pElbowR,
                    torsoForward,
                    bodyScale,
                    bodyScale,
                    torsoLeft
                );
                humR.visible = true;

                if (foreR && isVis(16, 0.32)) {
                    const pWristR = toWorld(16);
                    this.applyBoneTransform(
                        foreR,
                        BONE_REST_SPECS.forearm_r,
                        pElbowR,
                        pWristR,
                        torsoForward,
                        bodyScale,
                        bodyScale,
                        torsoLeft
                    );
                    foreR.visible = true;
                } else if (foreR) {
                    foreR.visible = false;
                }
            } else {
                if (humR) humR.visible = false;
                if (foreR) foreR.visible = false;
            }

            // Húmero y Antebrazo Izquierdo (11 -> 13 -> 15)
            const humL = this.boneMeshes.get('humerus_l');
            const foreL = this.boneMeshes.get('forearm_l');
            if (humL && isVis(13, 0.32)) {
                const pElbowL = toWorld(13);
                this.applyBoneTransform(
                    humL,
                    BONE_REST_SPECS.humerus_l,
                    pShoulderL,
                    pElbowL,
                    torsoForward,
                    bodyScale,
                    bodyScale,
                    torsoLeft
                );
                humL.visible = true;

                if (foreL && isVis(15, 0.32)) {
                    const pWristL = toWorld(15);
                    this.applyBoneTransform(
                        foreL,
                        BONE_REST_SPECS.forearm_l,
                        pElbowL,
                        pWristL,
                        torsoForward,
                        bodyScale,
                        bodyScale,
                        torsoLeft
                    );
                    foreL.visible = true;
                } else if (foreL) {
                    foreL.visible = false;
                }
            } else {
                if (humL) humL.visible = false;
                if (foreL) foreL.visible = false;
            }

            // Manos de 21 Puntos + Carpo / Túnel Carpiano
            const { rightHand, leftHand } = this.matchHandsToWrists(lm, this.latestHands);

            const rigCompleteHand = (
                isRight: boolean,
                detectedHand: any[] | null,
                wristIdx: number,
                pinkyIdx: number,
                indexIdx: number,
                thumbIdx: number,
                elbowIdx: number
            ) => {
                const carpalMesh = this.boneMeshes.get(isRight ? 'carpal_r' : 'carpal_l');
                const pool = isRight ? this.phalanxPoolR : this.phalanxPoolL;

                const hand21 =
                    detectedHand ||
                    (isVis(wristIdx, 0.35)
                        ? synthesizeHand21PointsFromPose(
                              lm[wristIdx],
                              lm[pinkyIdx],
                              lm[indexIdx],
                              lm[thumbIdx],
                              lm[elbowIdx]
                          )
                        : null);

                if (!hand21 || hand21.length < 21) {
                    if (carpalMesh) carpalMesh.visible = false;
                    for (let i = 0; i < 19; i++) pool[i].visible = false;
                    return;
                }

                // Anclar profundidad Z de la mano al carpo de Pose para coherencia con radio/cúbito
                const basePoseZ = isVis(wristIdx, 0.25) ? toWorld(wristIdx).z : shoulderMid.z;
                const h0Z = hand21[0]?.z ?? 0;
                const hPtWorld = (idx: number): Vec3 => ({
                    x: hand21[idx].x * W,
                    y: -hand21[idx].y * H,
                    z: basePoseZ - ((hand21[idx].z ?? h0Z) - h0Z) * zDepthScale * 0.65,
                });

                const pW = hPtWorld(0);
                const pIndexMcp = hPtWorld(5);
                const pMiddleMcp = hPtWorld(9);
                const pPinkyMcp = hPtWorld(17);

                // Normal palmar para orientar huesos del carpo y falanges
                const vIdx = vSub(pIndexMcp, pW);
                const vPnk = vSub(pPinkyMcp, pW);
                let palmNormal = vCross(vIdx, vPnk);
                if (!isRight) palmNormal = vScale(palmNormal, -1);
                if (vLen(palmNormal) < 1e-3) {
                    palmNormal = torsoForward;
                } else {
                    palmNormal = vNorm(palmNormal, torsoForward);
                }

                // Carpo ocupa el 26% proximal entre muñeca (0) y base del 3er metacarpiano (9)
                const carpalDistal = vLerp(pW, pMiddleMcp, 0.28);
                const palmWidthPx = Math.max(12 * bodyScale, vLen(vSub(pIndexMcp, pPinkyMcp)));
                const carpalTransverseScale = Math.max(
                    bodyScale * 0.75,
                    Math.min(bodyScale * 1.35, palmWidthPx / 48)
                );

                if (carpalMesh) {
                    this.applyBoneTransform(
                        carpalMesh,
                        isRight ? BONE_REST_SPECS.carpal_r : BONE_REST_SPECS.carpal_l,
                        pW,
                        carpalDistal,
                        palmNormal,
                        carpalTransverseScale,
                        carpalTransverseScale,
                        torsoLeft
                    );
                    carpalMesh.visible = true;
                }

                // 19 segmentos metacarpianos y falángicos con la geometría real `phalanx_unit`
                for (let sIdx = 0; sIdx < 19; sIdx++) {
                    const seg = HAND_19_SEGMENTS[sIdx];
                    const pMesh = pool[sIdx];
                    const rawStart = hPtWorld(seg.iStart);
                    const pEnd = hPtWorld(seg.iEnd);
                    const pStart = seg.startFromWristLerp
                        ? vLerp(rawStart, pEnd, seg.startFromWristLerp)
                        : rawStart;

                    const segLenPx = vLen(vSub(pEnd, pStart));
                    const naturalWidthScale = Math.max(
                        bodyScale * 0.55,
                        Math.min(bodyScale * 1.35, (segLenPx / 45.22) * seg.thickness)
                    );

                    this.applyBoneTransform(
                        pMesh,
                        BONE_REST_SPECS.phalanx_unit,
                        pStart,
                        pEnd,
                        palmNormal,
                        naturalWidthScale,
                        naturalWidthScale,
                        torsoLeft
                    );
                    pMesh.visible = segLenPx > 1.5;
                }
            };

            rigCompleteHand(true, rightHand, 16, 18, 20, 22, 14);
            rigCompleteHand(false, leftHand, 15, 17, 19, 21, 13);
        }

        // ─── D. PELVIS Y TREN INFERIOR (lowerLimbs) ─────────────────────────
        const pelvisMesh = this.boneMeshes.get('pelvis');
        const femurR = this.boneMeshes.get('femur_r');
        const femurL = this.boneMeshes.get('femur_l');
        const shankR = this.boneMeshes.get('shank_r');
        const shankL = this.boneMeshes.get('shank_l');

        if (!layers.lowerLimbs || !hipsTrulyVisible) {
            if (pelvisMesh) pelvisMesh.visible = false;
            if (femurR) femurR.visible = false;
            if (femurL) femurL.visible = false;
            if (shankR) shankR.visible = false;
            if (shankL) shankL.visible = false;
        } else {
            if (pelvisMesh) {
                this.applyBoneTransform(
                    pelvisMesh,
                    BONE_REST_SPECS.pelvis,
                    pHipR,
                    pHipL,
                    torsoUp,
                    bodyScale,
                    bodyScale,
                    torsoForward
                );
                pelvisMesh.visible = true;
            }

            if (femurR && isVis(26, 0.35)) {
                const pKneeR = toWorld(26);
                this.applyBoneTransform(
                    femurR,
                    BONE_REST_SPECS.femur_r,
                    pHipR,
                    pKneeR,
                    torsoForward,
                    bodyScale,
                    bodyScale,
                    torsoLeft
                );
                femurR.visible = true;

                if (shankR && isVis(28, 0.35)) {
                    const pAnkleR = toWorld(28);
                    this.applyBoneTransform(
                        shankR,
                        BONE_REST_SPECS.shank_r,
                        pKneeR,
                        pAnkleR,
                        torsoForward,
                        bodyScale,
                        bodyScale,
                        torsoLeft
                    );
                    shankR.visible = true;
                } else if (shankR) {
                    shankR.visible = false;
                }
            } else {
                if (femurR) femurR.visible = false;
                if (shankR) shankR.visible = false;
            }

            if (femurL && isVis(25, 0.35)) {
                const pKneeL = toWorld(25);
                this.applyBoneTransform(
                    femurL,
                    BONE_REST_SPECS.femur_l,
                    pHipL,
                    pKneeL,
                    torsoForward,
                    bodyScale,
                    bodyScale,
                    torsoLeft
                );
                femurL.visible = true;

                if (shankL && isVis(27, 0.35)) {
                    const pAnkleL = toWorld(27);
                    this.applyBoneTransform(
                        shankL,
                        BONE_REST_SPECS.shank_l,
                        pKneeL,
                        pAnkleL,
                        torsoForward,
                        bodyScale,
                        bodyScale,
                        torsoLeft
                    );
                    shankL.visible = true;
                } else if (shankL) {
                    shankL.visible = false;
                }
            } else {
                if (femurL) femurL.visible = false;
                if (shankL) shankL.visible = false;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    public clear() {
        if (this.disposed) return;
        this.smoothedPose = null;
        this.hideAllMeshes();
        this.renderer.clear();
    }

    public dispose() {
        if (this.disposed) return;
        this.disposed = true;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        for (const zone of ALL_STRESS_ZONES) {
            try {
                this.zoneMaterials[zone].xray.dispose();
                this.zoneMaterials[zone].solid.dispose();
            } catch {
                // ignore
            }
        }
        try {
            this.renderer.dispose();
        } catch {
            // ignore
        }
    }
}

// Registro débil por canvas para soportar múltiples visores y conmutación móvil/desktop sin fugas WebGL
const canvasRigs = new WeakMap<HTMLCanvasElement, AnatomyCanvasRig>();

export async function renderAnatomyXRayFrame(
    canvas: HTMLCanvasElement | null,
    input: AnatomyXRayFrameInput
): Promise<void> {
    if (!canvas) return;
    if (input.config && input.config.mode !== 'xray_3d') {
        const existing = canvasRigs.get(canvas);
        if (existing) existing.clear();
        return;
    }

    try {
        const pkg = await ensureAnatomyXRayAssets();
        let rig = canvasRigs.get(canvas);
        if (!rig) {
            rig = new AnatomyCanvasRig(canvas, pkg);
            canvasRigs.set(canvas, rig);
        }
        rig.updateTargetState(input);
    } catch (err) {
        console.warn('[AnatomyXRay3D] No se pudo renderizar frame 3D:', err);
    }
}

export function flushAnatomyXRayCanvas(canvas: HTMLCanvasElement | null | undefined): void {
    if (!canvas) return;
    const rig = canvasRigs.get(canvas);
    if (rig) {
        rig.flushRenderNow();
    }
}

export function clearAnatomyXRayCanvas(canvas: HTMLCanvasElement | null | undefined): void {
    if (!canvas) return;
    const rig = canvasRigs.get(canvas);
    if (rig) {
        rig.clear();
    }
}

export function disposeAnatomyXRayCanvas(canvas: HTMLCanvasElement | null | undefined): void {
    if (!canvas) return;
    const rig = canvasRigs.get(canvas);
    if (rig) {
        rig.dispose();
        canvasRigs.delete(canvas);
    }
}
