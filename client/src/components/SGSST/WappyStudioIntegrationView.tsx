import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Clapperboard,
  Film,
  Sparkles,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  RefreshCw,
  Monitor,
  Cloud,
  Key,
  Plus,
  Bot,
  Layers,
  Volume2,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import ExpandingButton from './ExpandingButton';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  apiKey?: string | null;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  isActive: boolean;
}

export interface StudioSubagentDef {
  id: string;
  name: string;
  roleTitle: string;
  badge: string;
  icon: string;
  accentColor: 'emerald' | 'teal' | 'purple' | 'cyan';
  description: string;
  highlights: string[];
  markdownDefinition: string;
}

export interface StudioSkillDef {
  id: string;
  icon: string;
  name: string;
  title: string;
  tag: string;
  desc: string;
  skillMarkdown: string;
}

export interface StudioXlEffectDef {
  id: string;
  icon: string;
  title: string;
  category: string;
  spec: string;
  desc: string;
}

export const FALLBACK_STUDIO_SUBAGENTS: StudioSubagentDef[] = [
  {
    id: 'wappy-studio-effects-director',
    name: 'wappy-studio-effects-director',
    roleTitle: '1. Director de Efectos y Coreografía Dinámica XL',
    badge: 'COREOGRAFÍA & FX XL',
    icon: '🎨',
    accentColor: 'purple',
    description:
      'Define los efectos más potentes por escena (Lienzo Nodos n8n WAPPY, VisorNormaReal, Split-Screen Flow, Suri 3D Live HUD, Cuadrícula +50 IA, FXOrbit 3D, iPhone 16 Pro Dynamic Island), crea la Portada Hero de 2s y aplica Modo Móvil XL (1080×1920).',
    highlights: [
      'Portada Hero 0.0s–2.0s con titulares gigantes Modo Móvil XL (88px–108px)',
      'Asignación inteligente 1 frase = 1 pieza visual sincronizada a la sílaba',
      'Lienzo Nodos n8n WAPPY, VisorNormaReal, Split-Screen Antes/Después y Suri 3D Live',
    ],
    markdownDefinition: `---
name: wappy-studio-effects-director
description: Director de Efectos Visuales, Coreografía Dinámica y Modo Móvil XL (1080×1920) de WAPPY Studio.
---
# Rol: Director de Efectos y Coreografía Dinámica XL (\`wappy-studio-effects-director\`)

Eres el Director de Arte y Efectos Especiales de **WAPPY Studio**. Tu misión es diseñar la escaleta visual a 60 FPS en **Modo Móvil XL (\`1080×1920\`)** aplicando el Sistema de las 7 Piezas:
1. **Portada Hero Magnética (0.0s–2.0s):** Titular gigante (\`88px–108px\`), insignia superior y tarjeta de alto contraste (\`#C7F303\` / \`#0E1300\` / \`#0D9488\`).
2. **Coreografía de Efectos XL por Escena:** Selecciona el efecto ideal según lo que dice la voz: \`n8n-workflow-wappy\` (Lienzo Nodos n8n WAPPY), \`visor-normativo-real\` (Subrayado flúor SST + sello), \`flow-split-before-after\` (Antes vs Después IA), \`suri-voice-live-hud\` (Consola Suri 3D 24kHz), \`cuadricula-50-ia\` (Matriz +50 herramientas + anillo de ahorro), \`iphone-16-dynamic-island\` o \`01-orbit\`.
3. **Cero Ruido Visual:** Una frase, una idea, una pieza protagonista con física \`spring(damping: 17, stiffness: 190)\` y 0px de desbordamiento.`,
  },
  {
    id: 'wappy-studio-audio-podcast',
    name: 'wappy-studio-audio-podcast',
    roleTitle: '2. Ingeniero de Audio, Voces Wappy Podcast & SFX',
    badge: 'AUDIO 24KHZ & SFX',
    icon: '🎙️',
    accentColor: 'teal',
    description:
      'Procesa tu voz o genera voces conversacionales con Wappy Podcast (24 kHz), normaliza a -14 LUFS, mezcla SFX (barrido.wav, golpe-corto.wav, tick-suave.wav, brillo.wav) + música con sidechain ducking y extrae vozData a 60 FPS.',
    highlights: [
      'Síntesis neuronal Wappy Podcast 24 kHz PCM WAV (1 voz o diálogo dual Alex & Sam)',
      'Masterización -14 LUFS + mezcla discreta de SFX (barrido, golpe-corto, tick-suave, brillo)',
      'Extracción de envolvente vozData a 60 FPS y marcas de tiempo palabra por palabra',
    ],
    markdownDefinition: `---
name: wappy-studio-audio-podcast
description: Ingeniero de Audio, Síntesis Wappy Podcast 24kHz, Masterización -14 LUFS y Sound Design Sincronizado.
---
# Rol: Ingeniero de Audio, Voces Wappy Podcast & SFX (\`wappy-studio-audio-podcast\`)

Eres el Ingeniero de Sonido y Productor Vocal de **WAPPY Studio & Wappy Podcast**. Tu responsabilidad en cada vídeo o episodio es:
1. **Voz Principal o Dual (24 kHz WAV):** Procesar la grabación del usuario (quitando silencios y respiraciones bruscas) o sintetizar voces expresivas con **Wappy Podcast 24kHz** (\`<breath>\`, \`<laugh>\`, \`|mhm|\`).
2. **Alineación Palabra a Palabra y \`vozData\` (60 FPS):** Extraer marcas de tiempo exactas al milisegundo y la envolvente de amplitud a 60 FPS para el lip-sync del Avatar 3D y ondas reactivas.
3. **Sound Design & Sidechain (-14 LUFS):** Normalizar la locución a \`-14 LUFS\`, aplicar sidechain ducking a la música y disparar SFX sutiles (\`barrido.wav\`, \`golpe-corto.wav\`, \`tick-suave.wav\` a \`-16 dB\`, \`brillo.wav\`) en el fotograma exacto.`,
  },
  {
    id: 'wappy-studio-scene-animator',
    name: 'wappy-studio-scene-animator',
    roleTitle: '3. Editor y Animador Full-Screen 60-FPS',
    badge: 'GSAP / REMOTION 60-FPS',
    icon: '⚡',
    accentColor: 'emerald',
    description:
      'Construye las escenas interactivas a 60 FPS con física spring, cámara 3D sobre nodos n8n, subtítulos karaokes XL (54px–60px) y logos SVG oficiales.',
    highlights: [
      'Alternancia de 3 Planos: Avatar 3D + Pieza, Cortina Full-Screen y Cierre Hero',
      'Cámara 3D sobre Lienzo de Nodos n8n, partículas en cables SVG y contadores vivos',
      'Subtítulos karaoke XL (54px–60px) sincronizados a la sílaba sin duplicar titulares',
    ],
    markdownDefinition: `---
name: wappy-studio-scene-animator
description: Animador Principal 60-FPS (HTML5 + GSAP + Remotion), Cámara 3D y Subtítulos Karaoke XL.
---
# Rol: Editor y Animador Full-Screen 60-FPS (\`wappy-studio-scene-animator\`)

Eres el Animador Principal de **WAPPY Studio**. Programas composiciones deterministas a **60 FPS (\`1080×1920\` o \`1920×1080\`)** sincronizadas con \`window.mainTimeline\` y el reloj de voz:
1. **Alternancia de los 3 Planos:** Alterna entre Plano 1 (Avatar 3D + pieza en pecho), Plano 2 (Cortina oscura full-screen con filo de luz de \`6px\` para explicar diagramas \`n8n\`, \`filas\`, \`flujo\`) y Plano 3 (Cierre con llamado a la acción \`wappy.club\`).
2. **Encendido en la Sílaba Exacta:** Los elementos que aún no se han nombrado esperan apagados (\`#9aa3b3\`) y se encienden con resorte \`spring\` en la sílaba exacta en que los nombra la voz.
3. **Subtítulos Karaoke Modo Móvil XL (\`54px–60px\`):** Resaltado activo en verde lima \`#C7F303\` con texto \`#0E1300\`, ocultándose automáticamente en escenas de titular gigante.`,
  },
  {
    id: 'wappy-studio-mp4-renderer',
    name: 'wappy-studio-mp4-renderer',
    roleTitle: '4. Renderizador Multi-Worker MP4 1080×1920',
    badge: 'RENDER MP4 H.264 + AAC',
    icon: '🎬',
    accentColor: 'cyan',
    description:
      'Renderiza el vídeo en alta definición 1080×1920 (H.264 + AAC) con workers paralelos y valida 3 capturas de control.',
    highlights: [
      'Auditoría previa de 3 capturas clave (Portada 1.0s, Escena Central y Cierre CTA)',
      'Renderizado paralelo determinista a 60 FPS en H.264 (yuv420p) + Audio AAC 192 kbps',
      'Entrega directa al Monitor en Vivo de Wappy Studio y descarga MP4 / Cápsula HTML',
    ],
    markdownDefinition: `---
name: wappy-studio-mp4-renderer
description: Ingeniero de Renderizado Determinista Multi-Worker MP4 1080×1920 (60 FPS H.264 + AAC) y QA Visual.
---
# Rol: Renderizador Multi-Worker MP4 1080×1920 (\`wappy-studio-mp4-renderer\`)

Eres el Ingeniero de Render y QA Audiovisual de **WAPPY Studio**. Tu misión es compilar y verificar el entregable final:
1. **Validación de 3 Capturas de Control:** Extraer y verificar fotogramas en \`t=1.0s\` (Portada Hero), \`t=50%\` (Escena Central XL) y \`t=90%\` (Cierre CTA) comprobando 0 solapamientos y legibilidad móvil perfecta.
2. **Renderizado Multi-Worker 60 FPS:** Unir las capas visuales \`1080×1920\` con la pista maestra de audio WAV 24kHz en un MP4 H.264 (\`libx264 -pix_fmt yuv420p -crf 18\`) + AAC (\`192k\`).
3. **Despacho Reactivo a WAPPY Studio:** Enviar el entregable terminado al Monitor en Vivo de \`/wappystudio\` vía \`wappy_completar_orden_delegada_tenshi\`.`,
  },
];

export const FALLBACK_STUDIO_SKILLS: StudioSkillDef[] = [
  {
    id: 'protocolo-produccion-videos',
    icon: '📋',
    name: 'protocolo-produccion-videos',
    title: 'Protocolo de las 7 Piezas & Brandbook',
    tag: 'Pre-producción',
    desc: 'Estilo Pro Limpio (una pieza por frase), alternancia de 3 planos, Portada Hero 2s, Avatar 3D con Lip-Sync y Ficha Oficial WAPPY IA.',
    skillMarkdown: `# Skill: protocolo-produccion-videos
Aplica siempre el Sistema de las 7 Piezas de WAPPY IA: (1) Dirección de Arte Pro Limpia (#06080d + #C7F303), (2) Alternancia de 3 Planos con Avatar 3D y cortina full-screen, (3) Rigor normativo SST, (4) Una pieza por frase encendida en la sílaba exacta, (5) Movimiento spring a 60 FPS, (6) SFX discreto a -16 dB y (7) 3 capturas previas antes del MP4.`,
  },
  {
    id: 'animaciones-17-efectos-reels',
    icon: '⚡',
    name: 'animaciones-17-efectos-reels',
    title: '19 Transiciones & Efectos Virales XL',
    tag: 'Reels 60 FPS',
    desc: 'Catálogo de efectos Modo Móvil XL: Lienzo Nodos n8n WAPPY, Orbit 3D, Frame Break, UI World, Zoom-Through, Chart Grow, Glass Type e iPhone 16 Dynamic Island.',
    skillMarkdown: `# Skill: animaciones-17-efectos-reels
Catálogo selectivo de efectos y transiciones a 60 FPS en Modo Móvil XL (1080×1920): Lienzo Nodos n8n WAPPY, FXOrbit 3D, Frame Break, UI World, Zoom-Through, Chart Grow, Headline Wall e iPhone 16 Pro Dynamic Island.`,
  },
  {
    id: 'animaciones-wappy-brand',
    icon: '✨',
    name: 'animaciones-wappy-brand',
    title: 'Identidad Visual Oficial WAPPY IA',
    tag: 'Branding',
    desc: 'Paleta corporativa verde lima eléctrico (#C7F303), negro oliva (#0E1300), turquesa SST (#0D9488), Tenshi 3D flotante y Suri 3D Live.',
    skillMarkdown: `# Skill: animaciones-wappy-brand
Identidad visual oficial de wappy.club: Verde Lima Eléctrico #C7F303 con texto oscuro #0E1300, Turquesa SST #0D9488, avatares Tenshi/Suri 3D con lip-sync y tarjetas limpias de alto contraste.`,
  },
  {
    id: 'animaciones-dark-tech-hud',
    icon: '🌌',
    name: 'animaciones-dark-tech-hud',
    title: 'Dark Tech HUD & Cyberpunk 9:16',
    tag: 'Dark Tech HUD',
    desc: 'Motion graphics con estética HUD cósmica oscura (#0C192E a #00D4FF), retículas técnicas, medidores circulares de audio y telemetría.',
    skillMarkdown: `# Skill: animaciones-dark-tech-hud
Estética Dark Tech HUD (#0C192E + #00D4FF + #C7F303) para escenas tecnológicas, consolas de voz IA en vivo y telemetría 3D a 60 FPS.`,
  },
  {
    id: 'animaciones-explicativas-sst',
    icon: '🛡️',
    name: 'animaciones-explicativas-sst',
    title: 'Vídeos Explicativos Normativos SST',
    tag: 'SST 60 FPS',
    desc: 'Estilo documental SST para Dummies: VisorNormaReal con subrayado fluorescente amarillo y sello, ChatRumores y AbanicoDocumentos.',
    skillMarkdown: `# Skill: animaciones-explicativas-sst
Componentes documentales SST a 60 FPS: VisorNormaReal (Decreto 1072, Res. 0312, GTC-45 con resaltador flúor en la sílaba exacta), ChatRumores y AbanicoDocumentos.`,
  },
  {
    id: 'hyperframes-motion-design',
    icon: '🎥',
    name: 'hyperframes-motion-design',
    title: 'HyperFrames & GSAP Cinematográfico',
    tag: 'Cinematográfico',
    desc: 'Estándar de animación GSAP seek-safe con curvas elásticas, tipografía cinética XL, sincronización con window.mainTimeline y render determinista.',
    skillMarkdown: `# Skill: hyperframes-motion-design
Motor GSAP determinista seek-safe conectado a window.mainTimeline y __wappyRenderTick(t, duration) para reproducción interactiva y exportación MP4 sin pérdida de fotogramas.`,
  },
  {
    id: 'wappy-ui-design-system',
    icon: '🎨',
    name: 'wappy-ui-design-system',
    title: 'WAPPY 14-Group Design System',
    tag: 'Design System',
    desc: 'Biblia visual de WAPPY IA: los 14 grupos semánticos de color, geometría hover con inclinación, tarjetas glassmorphism y 0px horizontal overflow.',
    skillMarkdown: `# Skill: wappy-ui-design-system
Sistema oficial de 14 Grupos Semánticos de Color (ExpandableButton.tsx), tarjetas Glassmorphism, luces ambientales esmeralda/lima y 0px de desbordamiento horizontal.`,
  },
];

export const STUDIO_XL_EFFECTS_GALLERY: StudioXlEffectDef[] = [
  {
    id: 'n8n-workflow-wappy',
    icon: '🔗',
    title: 'Lienzo Nodos n8n WAPPY',
    category: 'Automatización 3D',
    spec: 'Cámara 3D + Cables SVG',
    desc: 'Flujo vivo Cron ➔ Tenshi IA ➔ Gmail/WhatsApp con partículas luminosas viajando por cables curvos y paneo de cámara 3D.',
  },
  {
    id: 'visor-normativo-real',
    icon: '📜',
    title: 'Visor Norma Real SST',
    category: 'Documental SST',
    spec: 'Subrayado Flúor + Sello',
    desc: 'Documento oficial (Decreto 1072 / Res. 0312 / GTC-45) con resaltador fluorescente sincronizado con la voz y sello de cumplimiento.',
  },
  {
    id: 'flow-split-before-after',
    icon: '⚡',
    title: 'Split-Screen Antes/Después',
    category: 'Comparativa IA',
    spec: 'Caos Manual vs WAPPY IA',
    desc: 'Pantalla dividida de alto contraste: Excel manual caótico en rojo vs automatización limpia WAPPY IA en verde lima #C7F303.',
  },
  {
    id: 'suri-voice-live-hud',
    icon: '🎙️',
    title: 'Consola Suri 3D Live',
    category: 'Voz & Telemetría',
    spec: 'Onda Reactiva 24kHz',
    desc: 'HUD en vivo con Avatar 3D lip-sync, espectro de 42 barras a 24 kHz y tarjetas de orden ejecutada en tiempo real.',
  },
  {
    id: 'cuadricula-50-ia',
    icon: '🧩',
    title: 'Cuadrícula +50 IA',
    category: 'Ecosistema',
    spec: 'Matriz + Anillo Ahorro',
    desc: 'Mosaico cinético de +50 herramientas conectadas con anillo circular que calcula el ahorro mensual en dólares y horas.',
  },
  {
    id: '01-orbit',
    icon: '🪐',
    title: 'Orbit 3D',
    category: '3D & Avatares',
    spec: 'Perspectiva 1200px',
    desc: 'Anillo orbital 3D de insignias e iconos oficiales girando con profundidad real alrededor del concepto protagonista.',
  },
  {
    id: '02-frame-break',
    icon: '💥',
    title: 'Frame Break',
    category: 'Transición Viral',
    spec: 'Ruptura de Marco 3D',
    desc: 'El personaje o elemento clave rompe el borde de la tarjeta con parallax y sombra proyectada de alto impacto.',
  },
  {
    id: '03-ui-world',
    icon: '🖥️',
    title: 'UI World',
    category: 'Interfaz Viva',
    spec: 'Capas Flotantes XL',
    desc: 'Ventanas reales de WAPPY IA que emergen en perspectiva isométrica con cursor animado haciendo clic en la sílaba exacta.',
  },
  {
    id: '07-zoom-through',
    icon: '🚀',
    title: 'Zoom-Through',
    category: 'Transición Sin Corte',
    spec: 'Viaje de Cámara Z',
    desc: 'La cámara atraviesa el centro del elemento activo para revelar la siguiente escena con fluidez cinematográfica a 60 FPS.',
  },
  {
    id: '06-headline-wall',
    icon: '📰',
    title: 'Headline Wall',
    category: 'Tipografía Cinética',
    spec: 'Modo Móvil XL 96px',
    desc: 'Muro tipográfico cinético donde la frase clave se ilumina en verde lima #C7F303 mientras el resto mantiene foco editorial.',
  },
  {
    id: '08-chart-grow',
    icon: '📊',
    title: 'Chart Grow',
    category: 'KPIs & Datos',
    spec: 'Spring Physics 60-FPS',
    desc: 'Barras e indicadores de accidentalidad y cumplimiento que crecen con rebote elástico y contador numérico progresivo.',
  },
  {
    id: 'hero-cover-2s-xl',
    icon: '🔥',
    title: 'Portada Hero 2s',
    category: 'Miniatura Magnética',
    spec: '0.0s–2.0s (88px–108px)',
    desc: 'Portada obligatoria de los primeros 2 segundos optimizada para el feed de Instagram/TikTok con titular gigante XL.',
  },
];

interface WappyStudioIntegrationViewProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const WappyStudioIntegrationView: React.FC<WappyStudioIntegrationViewProps> = ({
  onClose,
}) => {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();

  const [activeTab, setActiveTab] = useState<'guide' | 'subagents' | 'skills'>('guide');
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);
  const [daemonStatus, setDaemonStatus] = useState<any>(null);
  const [pingAlive, setPingAlive] = useState<boolean>(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [bundleSkills, setBundleSkills] = useState<StudioSkillDef[]>(FALLBACK_STUDIO_SKILLS);
  const [bundleSubagents, setBundleSubagents] = useState<StudioSubagentDef[]>(
    FALLBACK_STUDIO_SUBAGENTS,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://wappy.club';

  const markCopied = (id: string, toastMsg: string) => {
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2500);
    showToast({ message: toastMsg, status: 'success' });
  };

  const refreshStatusAndBundle = useCallback(async () => {
    if (!token) return;
    try {
      const [pingRes, mcpRes, studioRes, keysRes, bundleRes] = await Promise.all([
        fetch('/api/mcp-bridge/antigravity/ping', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => null),
        fetch('/api/mcp-bridge/antigravity/status', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => null),
        fetch('/api/studio/antigravity/status', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => null),
        fetch('/api/user-api-keys', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => null),
        fetch('/api/studio/antigravity/skills-bundle.json', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => null),
      ]);

      if (pingRes && pingRes.ok) {
        const pingData = await pingRes.json().catch(() => null);
        setPingAlive(Boolean(pingData?.ok !== false));
      }

      const mcpData = mcpRes && mcpRes.ok ? await mcpRes.json().catch(() => null) : null;
      const studioData =
        studioRes && studioRes.ok ? await studioRes.json().catch(() => null) : null;

      if (mcpData || studioData) {
        setDaemonStatus((prev: any) => ({
          ...(prev || {}),
          ...(studioData || {}),
          ...(mcpData || {}),
          localConnected: Boolean(
            mcpData?.localConnected ??
              studioData?.localConnected ??
              studioData?.bridge?.localConnected ??
              false,
          ),
          cloudConnected: Boolean(
            mcpData?.cloudConnected ??
              studioData?.cloudConnected ??
              studioData?.bridge?.cloudConnected ??
              false,
          ),
          localCount: Number(
            mcpData?.localCount ?? studioData?.localCount ?? studioData?.bridge?.localCount ?? 0,
          ),
          cloudCount: Number(
            mcpData?.cloudCount ?? studioData?.cloudCount ?? studioData?.bridge?.cloudCount ?? 0,
          ),
          activeMode:
            mcpData?.activeMode ||
            studioData?.activeMode ||
            studioData?.bridge?.activeMode ||
            prev?.activeMode ||
            'local',
          effectiveEnv:
            mcpData?.effectiveEnv ||
            studioData?.effectiveEnv ||
            studioData?.bridge?.effectiveEnv ||
            prev?.effectiveEnv ||
            'local',
        }));
      }

      if (keysRes && keysRes.ok) {
        const keysData = await keysRes.json().catch(() => []);
        if (Array.isArray(keysData)) {
          setKeys(keysData);
        }
      }

      if (bundleRes && bundleRes.ok) {
        const bundleData = await bundleRes.json().catch(() => null);
        if (bundleData && Array.isArray(bundleData.skills) && bundleData.skills.length > 0) {
          const mergedSkills: StudioSkillDef[] = FALLBACK_STUDIO_SKILLS.map((fb) => {
            const remote = bundleData.skills.find(
              (s: any) => s?.id === fb.id || s?.name === fb.name,
            );
            return remote
              ? {
                  ...fb,
                  title: remote.title || fb.title,
                  desc: remote.description || remote.desc || fb.desc,
                  skillMarkdown: remote.content || remote.skillMarkdown || fb.skillMarkdown,
                }
              : fb;
          });
          setBundleSkills(mergedSkills);
        }
        if (
          bundleData &&
          Array.isArray(bundleData.subagents) &&
          bundleData.subagents.length > 0
        ) {
          const mergedAgents: StudioSubagentDef[] = FALLBACK_STUDIO_SUBAGENTS.map((fb) => {
            const remote = bundleData.subagents.find(
              (a: any) => a?.id === fb.id || a?.name === fb.name,
            );
            return remote
              ? {
                  ...fb,
                  markdownDefinition:
                    remote.content || remote.markdown || fb.markdownDefinition,
                }
              : fb;
          });
          setBundleSubagents(mergedAgents);
        }
      }
    } catch (_) {
      /* fallback local */
    }
  }, [token]);

  useEffect(() => {
    refreshStatusAndBundle();
    const timer = setInterval(refreshStatusAndBundle, 8000);
    return () => clearInterval(timer);
  }, [refreshStatusAndBundle]);

  const handleCreateKey = async (): Promise<string | null> => {
    if (!token) return null;
    setCreatingKey(true);
    try {
      const res = await fetch('/api/user-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ name: 'Wappy Studio & Subagentes Key' }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeyGenerated(data.apiKey);
        showToast({
          message: '¡Nueva Clave API generada para Wappy Studio!',
          status: 'success',
        });
        refreshStatusAndBundle();
        return data.apiKey;
      }
    } catch (_) {
      showToast({ message: 'No se pudo generar la clave API.', status: 'error' });
    } finally {
      setCreatingKey(false);
    }
    return null;
  };

  const fullKeyFromList = keys.find((k) => k.apiKey && !k.apiKey.includes('...'))?.apiKey || null;
  const effectiveKey =
    newKeyGenerated ||
    fullKeyFromList ||
    (keys.length > 0 ? `${keys[0].keyPrefix}` : 'wpy_live_TU_CLAVE_AQUI');

  const ensureFullKey = async (): Promise<string> => {
    if (newKeyGenerated) return newKeyGenerated;
    if (fullKeyFromList) return fullKeyFromList;
    const created = await handleCreateKey();
    return created || effectiveKey;
  };

  const localConnected = Boolean(
    daemonStatus?.localConnected ||
      daemonStatus?.bridge?.localConnected ||
      Number(daemonStatus?.localCount ?? daemonStatus?.bridge?.localCount ?? 0) > 0,
  );
  const cloudConnected = Boolean(
    daemonStatus?.cloudConnected ||
      daemonStatus?.bridge?.cloudConnected ||
      Number(daemonStatus?.cloudCount ?? daemonStatus?.bridge?.cloudCount ?? 0) > 0,
  );
  const localCount = Number(
    daemonStatus?.localCount ?? daemonStatus?.bridge?.localCount ?? (localConnected ? 1 : 0),
  );
  const cloudCount = Number(
    daemonStatus?.cloudCount ?? daemonStatus?.bridge?.cloudCount ?? (cloudConnected ? 1 : 0),
  );
  const activeMode: 'local' | 'cloud' | 'auto' =
    daemonStatus?.activeMode === 'cloud' || daemonStatus?.bridge?.activeMode === 'cloud'
      ? 'cloud'
      : daemonStatus?.activeMode === 'auto' || daemonStatus?.bridge?.activeMode === 'auto'
        ? 'auto'
        : 'local';

  const effectiveEnv: 'local' | 'cloud' =
    daemonStatus?.effectiveEnv === 'cloud' || daemonStatus?.bridge?.effectiveEnv === 'cloud'
      ? 'cloud'
      : activeMode === 'cloud'
        ? 'cloud'
        : activeMode === 'auto' && !localConnected && cloudConnected
          ? 'cloud'
          : 'local';

  const isLiveConnected = Boolean(
    localConnected ||
      cloudConnected ||
      daemonStatus?.bridge?.userDaemonConnected ||
      daemonStatus?.bridge?.daemonListening ||
      daemonStatus?.bridge?.connected ||
      daemonStatus?.userDaemonConnected ||
      daemonStatus?.daemonListening ||
      daemonStatus?.connected,
  );

  const handleSelectMode = async (nextMode: 'local' | 'cloud' | 'auto') => {
    if (!token || isSwitchingMode) return;
    setIsSwitchingMode(true);
    const optimisticEffective: 'local' | 'cloud' =
      nextMode === 'cloud'
        ? 'cloud'
        : nextMode === 'local'
          ? 'local'
          : localConnected
            ? 'local'
            : cloudConnected
              ? 'cloud'
              : 'local';
    setDaemonStatus((prev: any) => ({
      ...(prev || {}),
      activeMode: nextMode,
      effectiveEnv: optimisticEffective,
    }));
    try {
      const res = await fetch('/api/mcp-bridge/antigravity/mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ mode: nextMode }),
      });
      const data = res.ok ? await res.json().catch(() => null) : null;
      if (data && data.ok !== false) {
        setDaemonStatus((prev: any) => ({
          ...(prev || {}),
          ...data,
          activeMode: data.activeMode || data.mode || nextMode,
          effectiveEnv: data.effectiveEnv || optimisticEffective,
        }));
      }
      const modeMessages: Record<'local' | 'cloud' | 'auto', string> = {
        local:
          '🖥️ Modo Local (Mi PC) activado: Wappy Studio enviará las órdenes de video a tu Antigravity local.',
        cloud:
          '☁️ Modo Cloud (Servidor) activado: Wappy Studio enviará las órdenes a antigravity.google.com 24/7.',
        auto: '⚡ Modo Automático activado: Usa tu PC cuando está encendido y conmuta a Cloud automáticamente.',
      };
      showToast({ message: modeMessages[nextMode], status: 'success' });
    } catch (_) {
      showToast({ message: 'No se pudo cambiar el modo de conexión.', status: 'error' });
    } finally {
      setIsSwitchingMode(false);
    }
  };

  // Paso 1: Crear los 4 Subagentes y las 7 Skills en tu Antigravity (1 Clic)
  const buildStep1SubagentsAndSkillsPrompt = (key: string) => {
    const cleanKey = key && !key.includes('...') ? key : effectiveKey;
    const envFlag = activeMode === 'cloud' ? '&env=cloud' : '';
    return `Hola Antigravity, instala en mi instancia el Escuadrón Oficial de 4 Subagentes Especialistas de Wappy Studio (wappy-studio-effects-director, wappy-studio-audio-podcast, wappy-studio-scene-animator y wappy-studio-mp4-renderer) en ~/.gemini/config/agents/ y ~/.gemini/antigravity/agents/, junto con las 7 Skills Oficiales de Video y Diseño (protocolo-produccion-videos, animaciones-17-efectos-reels, animaciones-wappy-brand, animaciones-dark-tech-hud, animaciones-explicativas-sst, hyperframes-motion-design y wappy-ui-design-system) en ~/.gemini/config/skills/, ejecutando directamente este comando oficial con run_command:

curl -fsSL "${originUrl}/api/studio/antigravity/skills-installer.js?key=${encodeURIComponent(cleanKey)}${envFlag}" | node

(Si estás en Windows o prefieres Node directo, ejecuta: node -e "fetch('${originUrl}/api/studio/antigravity/skills-installer.js?key=${encodeURIComponent(cleanKey)}${envFlag}').then(r=>r.text()).then(c=>{const fs=require('fs'),p=require('path').join(require('os').homedir(),'.gemini','antigravity','wappy-skills-installer.js');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,c);require('child_process').spawnSync(process.execPath,[p,'--install','--url=${originUrl}','--key=${cleanKey}'],{stdio:'inherit'})})")

Confírmame apenas queden creados los 4 Subagentes y las 7 Skills de Video Modo Móvil XL.`;
  };

  // Paso 2: Conectar el Puente Wappy Studio <-> Antigravity
  const buildStep2BridgeCommand = (key: string) => {
    const hasFull = Boolean(key && !key.includes('...'));
    const keyArg = hasFull ? `,'--key=${key}'` : '';
    const cloudArg = activeMode === 'cloud' ? `,'--cloud'` : '';
    return `node -e "fetch('${originUrl}/api/mcp-bridge/antigravity/daemon.js').then(r=>r.text()).then(c=>{const fs=require('fs'),p=require('path').join(require('os').homedir(),'.gemini','antigravity','wappy-push-daemon.js');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,c);require('child_process').spawnSync(process.execPath,[p,'--install','--url=${originUrl}'${keyArg}${cloudArg}],{stdio:'inherit'})})"`;
  };

  // Paso 3: Probar el Escuadrón de 4 Subagentes en Paralelo
  const step3SquadTestPrompt = `Hola Antigravity, activa el Escuadrón de 4 Subagentes de Wappy Studio en paralelo para crear un Reel 9:16 Modo Móvil XL (1080×1920 a 60 FPS) de 24 segundos sobre cómo WAPPY IA automatiza el SG-SST:
1. @wappy-studio-effects-director: Diseña la Portada Hero de 2.0s (88px-108px) y asigna los efectos XL (Lienzo Nodos n8n WAPPY, VisorNormaReal SST y Split-Screen Antes vs Después).
2. @wappy-studio-audio-podcast: Prepara el guion sincronizado con pausas, voz 24kHz (-14 LUFS), SFX (barrido, golpe-corto, tick-suave, brillo) y envolvente vozData a 60 FPS.
3. @wappy-studio-scene-animator: Programa las escenas interactivas a 60 FPS con física spring, cámara 3D sobre los nodos n8n y subtítulos karaoke XL (54px-60px).
4. @wappy-studio-mp4-renderer: Valida las 3 capturas de control y envía el video listo al Monitor en Vivo de /wappystudio.`;

  const handleDownloadInstallerForOs = async (osType: 'mac' | 'win') => {
    const finalKey = await ensureFullKey();
    const installSkillsCmd = `node -e "fetch('${originUrl}/api/studio/antigravity/skills-installer.js?key=${encodeURIComponent(finalKey)}').then(r=>r.text()).then(c=>{const fs=require('fs'),p=require('path').join(require('os').homedir(),'.gemini','antigravity','wappy-skills-installer.js');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,c);require('child_process').spawnSync(process.execPath,[p,'--install','--url=${originUrl}','--key=${finalKey}'],{stdio:'inherit'})})"`;
    const bridgeCmd = buildStep2BridgeCommand(finalKey);
    const fileName =
      osType === 'win'
        ? 'Instalar-Wappy-Studio-4Subagentes-7Skills.bat'
        : 'Instalar-Wappy-Studio-4Subagentes-7Skills.command';
    const content =
      osType === 'win'
        ? `@echo off\r\ntitle Instalador Oficial Wappy Studio - 4 Subagentes + 7 Skills + Puente\r\necho Instalando los 4 Subagentes Especialistas y las 7 Skills de Video XL...\r\n${installSkillsCmd}\r\necho Conectando Puente Reactivo Wappy Studio...\r\n${bridgeCmd}\r\necho.\r\necho Escuadron de 4 Subagentes, 7 Skills y Puente instalados con exito.\r\npause\r\n`
        : `#!/bin/bash\necho "🎬 Instalando los 4 Subagentes Especialistas y las 7 Skills de Video XL..."\n${installSkillsCmd}\necho "🔌 Conectando Puente Reactivo Wappy Studio..."\n${bridgeCmd}\necho ""\necho "✅ Escuadrón de 4 Subagentes, 7 Skills y Puente instalados con éxito."\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({
      message: `Instalador ${fileName} descargado con tu clave activa.`,
      status: 'success',
    });
  };

  const handleDownloadBundleJson = () => {
    const a = document.createElement('a');
    a.href = `/api/studio/antigravity/skills-bundle.json?download=1&key=${encodeURIComponent(effectiveKey)}`;
    a.download = 'wappy-studio-4-subagents-7-skills-bundle.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast({
      message: 'Descargando Paquete JSON (4 Subagentes + 7 Skills de Video)...',
      status: 'success',
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-800 dark:text-zinc-100">
      {/* Cabecera Principal con identidad Wappy Studio */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-lime-500/10 border border-emerald-500/30 dark:border-emerald-500/30">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Clapperboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-lg font-bold">
                Wappy Studio — Escuadrón de 4 Subagentes + 7 Skills de Video (60-FPS)
              </h2>
              {isLiveConnected ? (
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Puente Conectado en Vivo
                </span>
              ) : pingAlive ? (
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-teal-700 dark:text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5" /> Servidor Studio Listo
                </span>
              ) : null}
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-lime-500/20 text-lime-800 dark:text-lime-300 border border-lime-500/40">
                Modo Móvil XL 1080×1920
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Crea e instala con 1 clic en tu Google Antigravity los <strong>4 Subagentes Especialistas</strong> (Efectos XL, Audio &amp; Wappy Podcast 24kHz, Animador 60-FPS y Renderizador MP4) junto con las <strong>7 Skills Oficiales de Video y Diseño</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ExpandingButton
            onClick={() => {
              window.open('/wappystudio', '_blank', 'noopener,noreferrer');
            }}
            icon={ExternalLink}
            label="Abrir Wappy Studio"
            variant="teal"
            title="Abrir el estudio de producción /wappystudio"
          />
          <ExpandingButton
            onClick={handleCreateKey}
            disabled={creatingKey}
            isLoading={creatingKey}
            icon={Plus}
            label={creatingKey ? 'Generando...' : 'Generar Clave API'}
            variant="emerald"
            title="Generar nueva Clave API para Wappy Studio & Antigravity"
          />
        </div>
      </div>

      {/* Alerta de Clave Recién Generada */}
      {newKeyGenerated && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20 text-slate-800 dark:text-zinc-100 flex flex-col gap-2.5 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              ¡Tu clave personal de enlace está lista! Ya fue inyectada automáticamente en todos los pasos de abajo:
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-amber-500/40 rounded-xl p-2.5 font-mono text-xs text-amber-600 dark:text-amber-300 select-all break-all">
            <span className="flex-1">{newKeyGenerated}</span>
            <ExpandingButton
              onClick={() => {
                navigator.clipboard.writeText(newKeyGenerated);
                markCopied('new-key', 'Clave API copiada al portapapeles');
              }}
              icon={copiedId === 'new-key' ? Check : Copy}
              label={copiedId === 'new-key' ? 'Copiada' : 'Copiar Clave'}
              variant="amber"
              size="sm"
              title="Copiar Clave API al portapapeles"
            />
          </div>
        </div>
      )}

      {/* PANEL SUPERIOR: ESTADO EN TIEMPO REAL + SELECTOR DE MODO 1-CLIC + DESCARGAS DIRECTAS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                Selector Superior de Modo (1-Clic) &amp; Instaladores Directos
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[11px] font-bold border',
                  effectiveEnv === 'cloud'
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
                )}
              >
                Destino activo:{' '}
                {effectiveEnv === 'cloud'
                  ? '☁️ Modo Cloud (Servidor antigravity.google.com)'
                  : '🖥️ Modo Local (Mi PC)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Elige dónde correrá tu Escuadrón de 4 Subagentes de Video o descarga el instalador directo para tu sistema:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={() => handleDownloadInstallerForOs('mac')}
              icon={Download}
              label="Instalador 1-Clic Mac (.command)"
              variant="teal"
              size="sm"
              title="Descargar instalador de 1 clic para macOS (.command)"
            />
            <ExpandingButton
              onClick={() => handleDownloadInstallerForOs('win')}
              icon={Download}
              label="Instalador Windows (.bat)"
              variant="blue"
              size="sm"
              title="Descargar instalador de 1 clic para Windows (.bat)"
            />
            <ExpandingButton
              onClick={handleDownloadBundleJson}
              icon={Download}
              label="Paquete JSON"
              variant="green"
              size="sm"
              title="Descargar paquete JSON con los 4 Subagentes y las 7 Skills"
            />
            <ExpandingButton
              onClick={refreshStatusAndBundle}
              icon={RefreshCw}
              label="Actualizar Estado"
              variant="cyan"
              size="sm"
              title="Consultar en vivo el estado del puente Antigravity"
            />
          </div>
        </div>

        {/* Estado Dual Local / Cloud */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            className={cn(
              'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all',
              localConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                : 'bg-slate-500/5 dark:bg-zinc-950/60 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300',
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                  localConnected
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                    : 'bg-slate-500/10 border-slate-300/50 dark:border-zinc-700 text-slate-500 dark:text-zinc-400',
                )}
              >
                <Monitor className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">🖥️ Modo Local (Mi PC):</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  {localConnected
                    ? `Daemon conectado (${localCount} instancia${localCount === 1 ? '' : 's'} lista${localCount === 1 ? '' : 's'})`
                    : 'Listo para instalar o iniciar en tu Mac / Windows'}
                </div>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border shrink-0',
                localConnected
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-500/10 border-slate-300/60 dark:border-zinc-700 text-slate-600 dark:text-zinc-400',
              )}
            >
              {localConnected ? '🟢 Conectado' : '⚪ Listo'}
            </span>
          </div>

          <div
            className={cn(
              'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all',
              cloudConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                : 'bg-sky-500/5 dark:bg-zinc-950/60 border-sky-500/20 dark:border-zinc-800 text-slate-700 dark:text-zinc-300',
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                  cloudConnected
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-300',
                )}
              >
                <Cloud className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  ☁️ Modo Cloud (Servidor antigravity.google.com):
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  {cloudConnected
                    ? `Corriendo 24/7 en la nube (${cloudCount} instancia${cloudCount === 1 ? '' : 's'})`
                    : 'Sin instalar nada en tu PC • 1 clic en el navegador'}
                </div>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border shrink-0',
                cloudConnected
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-500/10 border-slate-300/60 dark:border-zinc-700 text-slate-600 dark:text-zinc-400',
              )}
            >
              {cloudConnected ? '🟢 Conectado' : '⚪ Sin enlazar'}
            </span>
          </div>
        </div>

        {/* Botones de Selección 1-Clic: Modo Local (Mi PC) | Modo Cloud (Servidor) | Automático */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={isSwitchingMode}
            onClick={() => handleSelectMode('local')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all duration-300 flex flex-col gap-1 active:scale-95 cursor-pointer',
              activeMode === 'local'
                ? 'bg-teal-500/15 border-teal-500/50 text-teal-800 dark:text-teal-200 ring-1 ring-teal-500/30 shadow-2xs'
                : 'bg-slate-500/5 dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-teal-500/10 hover:border-teal-500/30',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold">🖥️ Modo Local (Mi PC)</span>
              {activeMode === 'local' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-700 dark:text-teal-300">
                  Activo
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
              Ejecuta los 4 subagentes y renderiza en el Antigravity de tu Mac o Windows.
            </span>
          </button>

          <button
            type="button"
            disabled={isSwitchingMode}
            onClick={() => handleSelectMode('cloud')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all duration-300 flex flex-col gap-1 active:scale-95 cursor-pointer',
              activeMode === 'cloud'
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/30 shadow-2xs'
                : 'bg-slate-500/5 dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-sky-500/10 hover:border-sky-500/30',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold">☁️ Modo Cloud (Servidor)</span>
              {activeMode === 'cloud' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-700 dark:text-sky-300">
                  Activo
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
              Corre en <code className="font-mono">antigravity.google.com</code> 24/7 sin instalar nada en tu PC.
            </span>
          </button>

          <button
            type="button"
            disabled={isSwitchingMode}
            onClick={() => handleSelectMode('auto')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all duration-300 flex flex-col gap-1 active:scale-95 cursor-pointer',
              activeMode === 'auto'
                ? 'bg-purple-500/15 border-purple-500/50 text-purple-800 dark:text-purple-200 ring-1 ring-purple-500/30 shadow-2xs'
                : 'bg-slate-500/5 dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-purple-500/10 hover:border-purple-500/30',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold">⚡ Automático</span>
              {activeMode === 'auto' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-700 dark:text-purple-300">
                  Activo
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
              Prioriza Local si tu PC está conectado y conmuta a Cloud automáticamente.
            </span>
          </button>
        </div>
      </div>

      {/* Selector de las 3 Pestañas (WAPPY Island Toolbar) */}
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer',
            activeTab === 'guide'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent',
          )}
        >
          <Terminal className="w-3.5 h-3.5" />
          🚀 Guía Paso a Paso (Crear Subagentes &amp; Skills)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subagents')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer',
            activeTab === 'subagents'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent',
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          🤖 4 Subagentes Especialistas ({bundleSubagents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer',
            activeTab === 'skills'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent',
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          🎬 7 Skills &amp; Catálogo de Efectos XL ({bundleSkills.length})
        </button>
      </div>

      {/* ==================================================================== */}
      {/* PESTAÑA 1: 🚀 GUÍA PASO A PASO (CREAR SUBAGENTES & SKILLS)           */}
      {/* ==================================================================== */}
      {activeTab === 'guide' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
          {/* Resumen visual de los 3 pasos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-500/25 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-extrabold text-purple-600 dark:text-purple-400">
                <span className="w-6 h-6 rounded-xl bg-purple-500/15 flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Instala los 4 Subagentes + 7 Skills</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Copia el <strong>Paso 1</strong> y pégalo en tu Antigravity para crear automáticamente los 4 subagentes y las 7 skills en tu carpeta <code className="font-mono">~/.gemini/</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-teal-500/25 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-extrabold text-teal-600 dark:text-teal-400">
                <span className="w-6 h-6 rounded-xl bg-teal-500/15 flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>Conecta el Puente Wappy Studio</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Enlaza tu API Key (<code className="font-mono">wpy_live_...</code>) con el daemon reactivo para que <code className="font-mono">/wappystudio</code> reciba los videos en vivo.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-500/25 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                <span className="w-6 h-6 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xs font-black">
                  3
                </span>
                <span>Prueba el Escuadrón en Paralelo</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Pega el prompt del <strong>Paso 3</strong> o lánzalo desde <code className="font-mono">/wappystudio</code> para ver a los 4 subagentes dividirse el trabajo.
              </p>
            </div>
          </div>

          {/* PASO 1 — Crear los 4 Subagentes y las 7 Skills en tu Antigravity (1 Clic) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-500/35 flex flex-col gap-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 font-black text-sm shrink-0">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                      Paso 1: Crear los 4 Subagentes y las 7 Skills en tu Antigravity (1 Clic)
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300">
                      4 Subagentes + 7 Skills • Modo Móvil XL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Pega este bloque en el chat de tu Antigravity (o ejecuta el comando <code className="font-mono">curl -fsSL &quot;{originUrl}/api/studio/antigravity/skills-installer.js&quot; | node</code>). Instalará en <code className="font-mono">~/.gemini/config/agents/</code>, <code className="font-mono">~/.gemini/antigravity/agents/</code> y <code className="font-mono">~/.gemini/config/skills/</code>:
                  </p>
                </div>
              </div>

              <ExpandingButton
                onClick={async () => {
                  const finalKey = await ensureFullKey();
                  const text = buildStep1SubagentsAndSkillsPrompt(finalKey);
                  navigator.clipboard.writeText(text);
                  markCopied(
                    'step-1',
                    '¡Paso 1 copiado! Pégalo en tu Antigravity para crear los 4 Subagentes y las 7 Skills.',
                  );
                }}
                icon={copiedId === 'step-1' ? Check : Copy}
                label={copiedId === 'step-1' ? '¡Paso 1 Copiado!' : 'Copiar Paso 1'}
                variant="purple"
                title="Copiar el Paso 1 para instalar los 4 Subagentes y las 7 Skills en Antigravity"
              />
            </div>

            {/* Píldoras de los 4 Subagentes + 7 Skills que instala el Paso 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {bundleSubagents.map((ag, idx) => (
                <div
                  key={ag.id}
                  className="p-2.5 rounded-xl bg-purple-500/5 dark:bg-zinc-950 border border-purple-500/20 flex items-start gap-2"
                >
                  <span className="text-base shrink-0">{ag.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-extrabold text-purple-700 dark:text-purple-300 truncate">
                      {idx + 1}) {ag.name}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-zinc-400 line-clamp-1">
                      {ag.roleTitle.replace(/^\d+\.\s*/, '')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-purple-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all max-h-52 overflow-y-auto break-all">
              {buildStep1SubagentsAndSkillsPrompt(effectiveKey)}
            </div>
          </div>

          {/* PASO 2 — Conectar el Puente Wappy Studio <-> Antigravity */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-teal-500/35 flex flex-col gap-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 font-black text-sm shrink-0">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                      Paso 2: Conectar el Puente Wappy Studio &lt;-&gt; Antigravity
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300">
                      Push SSE 0ms • Clave {keys.length > 0 ? 'Activa' : 'Automática'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Conecta tu API Key (<code className="font-mono">{effectiveKey}</code>) al daemon de Antigravity para que cuando pulses <strong>&ldquo;2. Enviar al Generador de Video&rdquo;</strong> en <code className="font-mono">/wappystudio</code>, el video compilado regrese automáticamente al Monitor en Vivo:
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <ExpandingButton
                  onClick={handleCreateKey}
                  disabled={creatingKey}
                  isLoading={creatingKey}
                  icon={Key}
                  label="Generar Nueva Clave"
                  variant="amber"
                  size="sm"
                  title="Generar una nueva clave wpy_live_... para este puente"
                />
                <ExpandingButton
                  onClick={async () => {
                    const finalKey = await ensureFullKey();
                    const cmd = buildStep2BridgeCommand(finalKey);
                    navigator.clipboard.writeText(cmd);
                    markCopied(
                      'step-2',
                      '¡Paso 2 copiado! Pégalo en la Terminal de Antigravity para conectar el puente.',
                    );
                  }}
                  icon={copiedId === 'step-2' ? Check : Copy}
                  label={copiedId === 'step-2' ? '¡Paso 2 Copiado!' : 'Copiar Paso 2'}
                  variant="teal"
                  title="Copiar comando de 1 línea del Paso 2 con tu API Key activa"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/40 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-teal-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all max-h-44 overflow-y-auto break-all">
              {buildStep2BridgeCommand(effectiveKey)}
            </div>
          </div>

          {/* PASO 3 — Probar el Escuadrón de 4 Subagentes en Paralelo */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-500/35 flex flex-col gap-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-black text-sm shrink-0">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                      Paso 3: Probar el Escuadrón de 4 Subagentes en Paralelo
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                      Verificación E2E • 60 FPS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Pega este prompt de prueba en una nueva conversación de Antigravity (o lánzalo directamente desde <code className="font-mono">/wappystudio</code>) para verificar cómo los 4 subagentes se dividen el trabajo (Efectos XL + Audio/Podcast + Animación 60-FPS + Render MP4):
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <ExpandingButton
                  onClick={() => {
                    window.open('/wappystudio', '_blank', 'noopener,noreferrer');
                  }}
                  icon={Clapperboard}
                  label="Ir a /wappystudio"
                  variant="cyan"
                  title="Abrir /wappystudio en una nueva pestaña"
                />
                <ExpandingButton
                  onClick={() => {
                    navigator.clipboard.writeText(step3SquadTestPrompt);
                    markCopied(
                      'step-3',
                      '¡Paso 3 copiado! Pégalo en tu Antigravity para probar los 4 Subagentes en paralelo.',
                    );
                  }}
                  icon={copiedId === 'step-3' ? Check : Copy}
                  label={copiedId === 'step-3' ? '¡Paso 3 Copiado!' : 'Copiar Paso 3'}
                  variant="emerald"
                  title="Copiar prompt de prueba del Escuadrón de 4 Subagentes"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-emerald-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all">
              {step3SquadTestPrompt}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PESTAÑA 2: 🤖 4 SUBAGENTES ESPECIALISTAS                             */}
      {/* ==================================================================== */}
      {activeTab === 'subagents' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-teal-500/10 to-emerald-500/10 border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Bot className="w-4 h-4 text-teal-500" />
                Escuadrón Oficial de 4 Subagentes en Paralelo (División Especializada de Trabajo)
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                Cada video en Wappy Studio se divide automáticamente entre estos 4 especialistas. Puedes instalar los 4 con el Paso 1 o copiar la definición <code className="font-mono">.md</code> individual de cualquiera de ellos:
              </p>
            </div>
            <ExpandingButton
              onClick={async () => {
                const finalKey = await ensureFullKey();
                navigator.clipboard.writeText(buildStep1SubagentsAndSkillsPrompt(finalKey));
                markCopied(
                  'install-all-agents',
                  'Comando para instalar los 4 Subagentes copiado al portapapeles',
                );
              }}
              icon={copiedId === 'install-all-agents' ? Check : Sparkles}
              label={
                copiedId === 'install-all-agents'
                  ? '¡Instalador Copiado!'
                  : 'Instalar los 4 Subagentes (1 Clic)'
              }
              variant="purple"
              title="Copiar comando de 1 clic para instalar los 4 Subagentes en Antigravity"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundleSubagents.map((agent) => {
              const isCopied = copiedId === `agent-${agent.id}`;
              return (
                <div
                  key={agent.id}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-teal-500/40 transition-all flex flex-col justify-between gap-3.5 shadow-2xs"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-xl shrink-0">
                          {agent.icon}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-zinc-100 truncate">
                            {agent.roleTitle}
                          </h4>
                          <code className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 block truncate">
                            ~/.gemini/config/agents/{agent.name}.md
                          </code>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 shrink-0">
                        {agent.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                      {agent.description}
                    </p>

                    <div className="space-y-1 pt-1">
                      {agent.highlights.map((hl, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-zinc-400"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/70 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                      Subagente Oficial Wappy Studio
                    </span>
                    <ExpandingButton
                      onClick={() => {
                        navigator.clipboard.writeText(agent.markdownDefinition);
                        markCopied(
                          `agent-${agent.id}`,
                          `Definición .md de ${agent.name} copiada al portapapeles`,
                        );
                      }}
                      icon={isCopied ? Check : Copy}
                      label={isCopied ? '¡Prompt .md Copiado!' : 'Copiar System Prompt (.md)'}
                      variant={agent.accentColor}
                      size="sm"
                      title={`Copiar System Prompt / Definición .md de ${agent.name}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PESTAÑA 3: 🎬 7 SKILLS & CATÁLOGO DE EFECTOS XL                      */}
      {/* ==================================================================== */}
      {activeTab === 'skills' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
          {/* Bloque 1: Las 7 Skills Oficiales de Video & Diseño */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-lime-500/10 via-emerald-500/5 to-teal-500/10 border border-lime-500/30 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100">
                    Pack Oficial de las 7 Skills de Video &amp; Diseño (60 FPS)
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-lime-500/20 border border-lime-500/40 text-lime-800 dark:text-lime-300">
                    7 SKILLS OFICIALES
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5">
                  Copia cualquier <code className="font-mono">SKILL.md</code> individualmente o instala las 7 Skills + 4 Subagentes con un solo clic:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <ExpandingButton
                  onClick={handleDownloadBundleJson}
                  icon={Download}
                  label="Descargar Pack (.JSON)"
                  variant="green"
                  size="sm"
                  title="Descargar el paquete JSON con las 7 Skills y 4 Subagentes"
                />
                <ExpandingButton
                  onClick={async () => {
                    const finalKey = await ensureFullKey();
                    navigator.clipboard.writeText(buildStep1SubagentsAndSkillsPrompt(finalKey));
                    markCopied(
                      'install-7-skills',
                      'Prompt de instalación de las 7 Skills + 4 Subagentes copiado al portapapeles',
                    );
                  }}
                  icon={copiedId === 'install-7-skills' ? Check : Sparkles}
                  label={
                    copiedId === 'install-7-skills'
                      ? '¡Prompt Copiado!'
                      : 'Instalar las 7 Skills (1 Clic)'
                  }
                  variant="purple"
                  size="sm"
                  title="Copiar comando para instalar las 7 Skills automáticamente"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bundleSkills.map((skill) => {
                const isSkillCopied = copiedId === `skill-${skill.id}`;
                return (
                  <div
                    key={skill.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between gap-2.5 shadow-2xs hover:border-lime-500/40 transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl shrink-0 p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800">
                        {skill.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                            {skill.title}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-700 dark:text-lime-300">
                            {skill.tag}
                          </span>
                        </div>
                        <code className="text-[10px] font-mono text-teal-600 dark:text-teal-400 block mt-0.5">
                          ~/.gemini/config/skills/{skill.name}/SKILL.md
                        </code>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          {skill.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                      <ExpandingButton
                        onClick={() => {
                          navigator.clipboard.writeText(skill.skillMarkdown);
                          markCopied(
                            `skill-${skill.id}`,
                            `SKILL.md de ${skill.name} copiado al portapapeles`,
                          );
                        }}
                        icon={isSkillCopied ? Check : Copy}
                        label={isSkillCopied ? '¡SKILL.md Copiado!' : 'Copiar SKILL.md'}
                        variant="teal"
                        size="sm"
                        title={`Copiar contenido de ${skill.name}/SKILL.md`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloque 2: Galería de Efectos de Alto Impacto Modo Móvil XL (1080×1920) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-500" />
                Galería de Efectos de Alto Impacto — Modo Móvil XL (1080×1920 • 60 FPS)
              </span>
              <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                12 Efectos Insignia Disponibles en /wappystudio
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STUDIO_XL_EFFECTS_GALLERY.map((fx) => (
                <div
                  key={fx.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-2 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0">{fx.icon}</span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 truncate">
                          {fx.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 shrink-0">
                        {fx.spec}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 leading-snug">
                      {fx.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[10px]">
                    <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">
                      {fx.id}
                    </span>
                    <span className="text-slate-400 dark:text-zinc-500">{fx.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface WappyStudioIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WappyStudioIntegrationModal: React.FC<WappyStudioIntegrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Wappy Studio &amp; Subagentes de Video (Modo Móvil XL • 60-FPS)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Instala los 4 Subagentes Especialistas y las 7 Skills Oficiales de Video en tu Google Antigravity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <WappyStudioIntegrationView onClose={onClose} isModal={true} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-zinc-800/80 px-6 py-3 bg-slate-50/50 dark:bg-zinc-900/50">
          <ExpandingButton
            onClick={() => {
              window.open('/wappystudio', '_blank', 'noopener,noreferrer');
            }}
            icon={Film}
            label="Abrir /wappystudio"
            variant="teal"
            title="Ir a Wappy Studio"
          />
          <ExpandingButton
            onClick={onClose}
            icon={X}
            label="Cerrar"
            variant="secondary"
            title="Cerrar ventana"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default WappyStudioIntegrationView;
