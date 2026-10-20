// Guion de edición (EDL) de un reel. Todos los tiempos en segundos del vídeo base ya limpio.

export type Palabra = {t: string; i: number; f: number; d?: boolean}; // d = palabra clave (azul)
export type Pagina = {i: number; f: number; lineas: Palabra[][]};
export type Zoom = {i: number; f: number; e0: number; e1: number}; // escala al inicio y al final del tramo
// Dónde va el vídeo en el lienzo 1080x1920 (lo calcula encuadre.py a partir de la cara)
export type Marco = {ancho: number; alto: number; arriba: number; izquierda: number; relleno?: 'estirar' | 'oscuro' | 'desenfoque'};
export type Capitulo = {i: number; f: number; num?: string; titulo: string; logo?: string; logoDesde?: number; icono?: string};
// Zona de la grabación de pantalla (px de pantalla.mp4). La primera vale desde el inicio de la pieza; las demás
// son movimientos de cámara que empiezan en "en" y duran "dur" segundos.
export type Vista = {x: number; y: number; w: number; h: number; en?: number; dur?: number};
export type FuentePantalla = {src: string; ancho: number; alto: number};
export type CaraBase = {cx: number; cy: number; lado: number; ancho: number; alto: number}; // cara dentro del vídeo base
export type Color = 'blue' | 'green' | 'amber' | 'red';

export type Chip = {texto: string; icono: string; en: number; x?: number; y?: number; rot?: number};

export type Elemento =
	| {tipo: 'logo'; i: number; f: number; logo: string; nombre: string; acoplar?: number}
	| {tipo: 'ecosistema'; i: number; f: number; centro: string; logos: string[]; entradas: number[]}
	| {tipo: 'destacado'; i: number; f: number; texto: string; color: Color; icono?: string}
	| {tipo: 'lista'; i: number; f: number; items: {texto: string; en: number}[]; color?: Color; ancho?: number}
	| {tipo: 'chips'; i: number; f: number; items: Chip[]; columnas?: number; libre?: boolean}
	| {
			tipo: 'convergencia';
			i: number;
			f: number;
			iconos: string[];
			unir: number;
			final: {icono: string; texto: string; en: number};
	  }
	| {
			tipo: 'mockup';
			i: number;
			f: number;
			appEn: number;
			titulo: string;
			totalEn?: number;
			resaltes?: {en: number; k: number}[];
			contenido?: Record<string, unknown>;
	  }
	| {
			tipo: 'pipeline';
			i: number;
			f: number;
			nodos: {logo?: string; icono?: string; texto: string; en: number; sub?: string; subEn?: number}[];
	  }
	| {tipo: 'cta'; i: number; f: number; etiqueta: string; palabra: string; escribirEn: number; sub: string}
	| {
			tipo: 'tiempo'; // el vídeo en bruto como línea de tiempo: se marcan las pausas y los trozos se juntan
			i: number;
			f: number;
			total: number;
			final: number;
			bloques: [number, number][];
			pausasEn?: number;
			juntarEn: number;
			antes?: string;
			despues?: string;
	  }
	| {
			tipo: 'sincronia'; // el reel como línea de tiempo: un cabezal la recorre y cada pieza se enciende en su sitio
			i: number;
			f: number;
			total: number;
			marcas: {t: number; icono: string}[];
			barrido: [number, number];
			bloques?: [number, number][];
			titulo?: string;
	  }
	| {tipo: 'visor'; i: number; f: number; texto?: string; icono?: string; caja?: {x: number; y: number; w: number; h: number}}
	| {tipo: 'logos'; i: number; f: number; items: {logo: string; nombre: string; en: number}[]}
	| {
			tipo: 'portada';
			i: number;
			f: number;
			titulo: string; // "\n" para partir en líneas
			antetitulo?: string; // línea corta en una píldora clara, con el logo delante
			logo?: string;
			destacar?: string[]; // palabras del título en el color de acento (subrayadas)
			top?: number; // y del bloque en el lienzo
	  }
	| {tipo: 'pantalla'; i: number; f: number; vistas: Vista[]; cara?: boolean; empuje?: number; entra?: boolean; sale?: boolean};

export type Sfx = {src: string; en: number; vol: number};

export type EDL = {
	video: string;
	duracion: number;
	fps?: number; // los del vídeo base (30 si no viene)
	anclaY: number; // altura del centro de la cara (0-1) para anclar los zooms
	marco: Marco;
	zooms: Zoom[];
	paginas: Pagina[];
	capitulos: Capitulo[];
	elementos: Elemento[];
	sfx: Sfx[];
	logos: Record<string, string>; // slug -> ruta dentro de public/
	musica?: {src: string; vol: number}; // música de fondo opcional (se funde al empezar y al acabar)
	pantalla?: FuentePantalla; // solo en grabaciones dobles (pantalla + cámara)
	caraBase?: CaraBase;
};

export type PropsReel = {edl: string; data?: EDL};
