import {loadFont} from '@remotion/google-fonts/Inter';
import marca from './marca.json';

// La marca (colores) sale de marca.json, que se copia desde la raíz del proyecto al preparar.
// Por defecto es DominIA: fondo casi negro, Inter y un único acento. Pensado para marcas de fondo oscuro.
const k = marca.colores;

const rgb = (hex: string) => {
	const n = parseInt(hex.replace('#', ''), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex: string, a: number) => {
	const [r, g, b] = rgb(hex);
	return `rgba(${r},${g},${b},${a})`;
};

// Los nombres (blue...) se mantienen por compatibilidad: "blue" es siempre el color de acento de la marca.
export const C = {
	bg: k.fondo,
	line: k.borde,
	line2: k.borde2,
	text: k.texto,
	muted: k.suave,
	dim: k.tenue,
	blue: k.acento,
	blue2: k.acento2,
	blue3: k.acento3,
	green: k.ok,
	amber: k.aviso,
	red: k.error,
	card: `linear-gradient(180deg,${k.tarjeta[0]},${k.tarjeta[1]})`,
	icoBg: rgba(k.acento2, 0.12),
	icoBorde: rgba(k.acento, 0.3),
};

export const acento = (a: number) => rgba(k.acento, a);
export const acento2 = (a: number) => rgba(k.acento2, a);
export const fondo = (a: number) => rgba(k.fondo, a);
// Tarjeta "encendida" (seleccionada): la tarjeta normal con un velo del color de acento
export const tarjetaActiva = `linear-gradient(180deg, ${rgba(k.acento, 0.16)}, ${rgba(k.acento, 0.06)}), ${C.card}`;

export const COLOR_ESTADO = {
	blue: C.blue,
	green: C.green,
	amber: C.amber,
	red: C.red,
} as const;

// Para usar otra tipografía de Google Fonts, cambia el import de arriba (p. ej. '@remotion/google-fonts/Montserrat').
export const {fontFamily} = loadFont('normal', {
	weights: ['600', '700', '800', '900'],
	subsets: ['latin', 'latin-ext'],
});

// Maqueta vertical 1080x1920 con las zonas seguras de Instagram:
// arriba ~220 px (cabecera de Reels), abajo ~360 px (usuario, texto, audio) y botones a la derecha.
export const ANCHO = 1080;
export const ALTO = 1920;
// La cara ocupa de y≈365 (cabeza) a y≈891 (barbilla): encuadre.py coloca el vídeo para que así sea.
export const ZONA = {top: 925, bottom: 1265, cx: 540, cy: 1095}; // gráficos, por debajo de la barbilla
export const SUBS_TOP = 1292; // subtítulos por debajo de los gráficos
export const ETIQUETA = {x: 56, y: 236}; // etiqueta de capítulo, arriba a la izquierda
export const HUECO_LOGO = 64; // hueco del logo dentro de la etiqueta
export const SLOT_LOGO = {x: ETIQUETA.x + 14 + HUECO_LOGO / 2, y: ETIQUETA.y + 14 + HUECO_LOGO / 2}; // su centro
// Pieza "pantalla" (grabaciones dobles): la tarjeta con el recorte de la pantalla ocupa la franja de la cara y
// de los gráficos, y la cara pasa a una burbuja arriba a la derecha, a la altura de la etiqueta.
export const PANTALLA = {top: 474, alto: 790, ancho: 960, burbuja: {x: 918, y: 348, d: 224}};
