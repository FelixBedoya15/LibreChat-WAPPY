import {Marco, Zoom} from '../tipos';

// Guion "pro" de un reel. Todos los tiempos en segundos del vídeo base ya limpio.
export type PalabraPro = {t: string; i: number; f: number; d?: boolean};
export type PaginaPro = {i: number; f: number; lineas: PalabraPro[][]; tam?: number};
// Capítulo de arriba a la izquierda: en qué parte del vídeo estamos
export type Seccion = {i: number; f: number; num: string; titulo: string};
// Zoom de un tramo; "ancla" (0–1) es la altura en la que se ancla (barbilla o centro de la cara)
export type ZoomPro = Zoom & {ancla?: number};
// Cada pieza lleva su tipo, cuándo entra y sale, y sus datos (ver cada componente y references/guion-pro.md)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Pieza = {tipo: string; i: number; f: number} & Record<string, any>;
export type SfxPro = {src: string; en: number; vol: number; dur?: number}; // dur: se corta ahí con un fundido corto

export type EDLPro = {
	video: string;
	duracion: number;
	fps?: number;
	anclaY: number;
	marco: Marco;
	zooms: ZoomPro[];
	paginas: PaginaPro[];
	secciones: Seccion[];
	piezas: Pieza[];
	sfx: SfxPro[];
	logos: Record<string, string>;
	marca?: {logo: string; desde?: number}; // logo propio, siempre arriba a la derecha
	// Retoque de la imagen de la grabación: un filtro CSS suave (contraste, saturación) y la fuerza de la viñeta (0–0,5)
	// abajo: cómo acaba la imagen por debajo: fundido a oscuro o su reflejo desenfocado (como una mesa brillante)
	imagen?: {filtro?: string; vineta?: number; abajo?: 'oscuro' | 'reflejo'};
};

// zonas: dibuja encima las zonas que tapa la interfaz de Instagram (solo para revisar fotogramas)
export type PropsPro = {edl: string; data?: EDLPro; zonas?: boolean};
