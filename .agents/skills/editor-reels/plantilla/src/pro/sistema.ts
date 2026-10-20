import type React from 'react';
import {Easing, spring} from 'remotion';
import {C, acento, acento2, fontFamily} from '../tema';

// Sistema visual "pro": el estilo de las presentaciones DominIA llevado a vertical.
// Fondo oscuro limpio, titulares enormes en mayúsculas (blanco y una palabra en el color de acento), tarjetas
// oscuras con el icono en un cuadrado, etiquetas espaciadas, pastillas de estado con punto y piezas que se
// encienden al nombrarlas. Solo la tipografía de la marca: nada de letra monoespaciada ni trama de puntos.
export const SANS = fontFamily;

export const W = 1080;
export const H = 1920;
// Zonas (px del lienzo). Arriba ~220 y abajo ~360 son de la interfaz de Instagram, y a la derecha, por debajo de
// y≈1000, van sus botones: ahí nada que haya que leer pasa de x≈940.
// ZONA: la pieza que va sobre el pecho en el plano de cara. "padDer" es el margen interior derecho para lo que se
// alinea a la derecha (pastillas, botones): el borde de la tarjeta puede quedar bajo los botones; su contenido, no.
export const ZONA = {x: 80, ancho: 920, top: 916, fondo: 1376, pad: 40, padDer: 80};
export const SUBS = {top: 1400, tam: 56, fondo: 1540};
export const HUD = {x: 56, y: 236, alto: 92};
// Escenas a pantalla completa: titular en "top"; contenido hasta "abajo"; "padDer" como en ZONA.
export const ESCENA = {izq: 72, der: 1008, top: 344, abajo: 1340, padDer: 86};
export const SEGURO = {arriba: 220, abajo: 1560, derecha: 950, botonesDesde: 1000};
// Ancho máximo de un texto grande centrado sobre la grabación (titular, sentencia): centrado en 540 llega a x=940
export const ANCHO_TITULAR = 800;
// Tamaños mínimos de letra (px del lienzo): por debajo de 26 no se lee en un móvil
export const TXT = {min: 26, rotulo: 28};

// Lo que el estilo DominIA añade a la paleta de tema.ts
export const D = {
	tarjeta: 'linear-gradient(180deg,#10151e,#0c1118)',
	tarjetaSel: 'linear-gradient(180deg,#111c31,#0c1321)',
	bordeSel: 'rgba(75,140,247,.65)',
	sombraSel: '0 0 0 1px rgba(75,140,247,.22), 0 26px 70px -26px rgba(37,99,235,.6)',
	icoFondo: 'rgba(37,99,235,.12)',
	icoBorde: 'rgba(59,130,246,.30)',
	icoFondoOff: 'rgba(148,163,184,.07)',
	tituloOff: '#9aa3b3',
	hueco: '#0a0e15', // paneles dentro de una tarjeta
	pastilla: '#121823',
	pastillaAzul: 'rgba(37,99,235,.16)',
	pastillaAzulBorde: 'rgba(75,140,247,.45)',
	pastillaAzulTexto: '#d4e3ff',
	bordeVideo: 'rgba(125,155,210,.36)', // tarjeta sobre la grabación: borde más claro para separarla de la ropa oscura
	sombraVideo: '0 40px 90px -30px rgba(0,0,0,.95), 0 0 0 1px rgba(255,255,255,.03)',
};
export type Estado = 'blue' | 'green' | 'amber' | 'red';
export const ESTADO: Record<Estado, {texto: string; borde: string; fondo: string; punto: string}> = {
	blue: {texto: '#cfe0ff', borde: 'rgba(75,140,247,.5)', fondo: 'rgba(37,99,235,.14)', punto: C.blue},
	green: {texto: '#9ff3cf', borde: 'rgba(52,211,153,.45)', fondo: 'rgba(52,211,153,.10)', punto: C.green},
	amber: {texto: '#ffd79a', borde: 'rgba(245,182,74,.45)', fondo: 'rgba(245,182,74,.10)', punto: C.amber},
	red: {texto: '#ffb4b4', borde: 'rgba(242,109,109,.45)', fondo: 'rgba(242,109,109,.10)', punto: C.red},
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
// 0 antes de a, 1 después de b
export const rampa = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1e-6, b - a));
export const sale = Easing.out(Easing.cubic);
export const entraSale = Easing.inOut(Easing.cubic);
export const mezcla = (a: number, b: number, p: number) => a + (b - a) * p;

// Resorte que arranca en t0 (segundos). 0 antes de t0.
export const resorte = (
	t: number,
	t0: number,
	fps: number,
	cfg: {damping?: number; stiffness?: number; mass?: number} = {},
) => (t < t0 ? 0 : spring({frame: (t - t0) * fps, fps, config: {damping: 17, stiffness: 190, mass: 0.7, ...cfg}}));

// Entrada y salida de una pieza: sube con resorte y se va con un fundido corto. Con salida = 0 no se funde:
// desaparece de golpe en "f" (para cuando la tapa la cortina de una escena).
export const vida = (t: number, i: number, f: number, fps: number, salida = 0.18) => {
	const e = i < 0.05 ? 1 : resorte(t, i, fps);
	const s = salida > 0 ? 1 - rampa(t, f - salida, f) : 1;
	return {e, s, op: Math.min(1, e * 1.5) * s};
};
// Pequeño latido al encenderse algo (0 → pico → 0 mientras el resorte va de 0 a 1)
export const latido = (r: number, fuerza = 0.07) => 1 + fuerza * Math.sin(Math.PI * clamp01(r));
// Algo que espera apagado y se enciende en "en": 0 apagado, 1 encendido. Resorte suave: tarda unos 0,2 s y casi no
// rebota (a 25 fotogramas por segundo, uno más seco se ve como un salto de dos fotogramas).
// Arranca 0,05 s antes de "en": las piezas cambian de color cuando el resorte pasa de la mitad, y sin ese adelanto
// el cambio se veía 0,1 s después de empezar la palabra (dos o tres fotogramas tarde).
export const ADELANTO = 0.05;
export const enciende = (t: number, en: number | undefined, fps: number) =>
	en === undefined ? 1 : resorte(t, en - ADELANTO, fps, {damping: 15, stiffness: 180, mass: 0.7});
// Pulso de un golpe (0 → 1 → 0): sube en dos fotogramas y vuelve sin rebotar. dt = segundos desde el golpe.
export const pulso = (dt: number, subida = 0.07, caida = 0.13) =>
	dt < 0 ? 0 : Math.min(1, dt / subida) * Math.exp(-Math.max(0, dt - subida) / caida);

export const SOMBRA_TXT = '0 8px 30px rgba(0,0,0,.65), 0 2px 6px rgba(0,0,0,.75)';
export const degradadoAcento = `linear-gradient(180deg, ${C.blue}, ${C.blue2})`;
// Texto con el degradado de acento de las portadas
export const textoAcento: React.CSSProperties = {
	backgroundImage: `linear-gradient(90deg, ${C.blue}, ${C.blue3})`,
	WebkitBackgroundClip: 'text',
	backgroundClip: 'text',
	color: 'transparent',
};
export const brillo = (a = 0.5) => `0 0 60px ${acento(a)}, 0 0 20px ${acento2(a * 0.8)}`;

// Titular: 900 en mayúsculas, apretado
export const titular = (px: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
	fontFamily: SANS,
	fontSize: px,
	fontWeight: 900,
	letterSpacing: '-.025em',
	lineHeight: 1,
	textTransform: 'uppercase',
	whiteSpace: 'nowrap',
	...extra,
});
// Etiqueta de acento espaciada ("LA CLAVE", "LA PREGUNTA")
export const rotulo = (px: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
	fontFamily: SANS,
	fontSize: px,
	fontWeight: 800,
	letterSpacing: '.2em',
	textTransform: 'uppercase',
	whiteSpace: 'nowrap',
	color: C.blue,
	...extra,
});
// Título de tarjeta: mayúsculas espaciadas
export const tituloFicha = (px: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
	fontFamily: SANS,
	fontSize: px,
	fontWeight: 800,
	letterSpacing: '.12em',
	textTransform: 'uppercase',
	whiteSpace: 'nowrap',
	color: C.text,
	...extra,
});
// Texto corrido gris (lo importante, en blanco con <b>)
export const cuerpo = (px: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
	fontFamily: SANS,
	fontSize: px,
	fontWeight: 600,
	color: C.muted,
	whiteSpace: 'nowrap',
	...extra,
});

// Ancho aproximado de un texto en 900 mayúscula, en em (para ajustar tamaños sin medir)
export const anchoEm = (s: string) =>
	[...s].reduce((a, c) => a + (/[IÍ1 .,:;!¡'|]/.test(c) ? 0.32 : /[MWÑ]/.test(c) ? 0.95 : /[0-9]/.test(c) ? 0.66 : 0.74), 0);
// Tamaño de letra para que un texto en mayúsculas quepa en "ancho" px, sin pasar de "max"
export const ajustar = (texto: string, ancho: number, max: number) => Math.min(max, Math.floor(ancho / anchoEm(texto.toUpperCase())));
// Parte un texto en dos líneas lo más iguales posible (para botones y respuestas largas)
export const partir2 = (texto: string): string[] => {
	const ps = texto.split(' ');
	if (ps.length < 2) return [texto];
	let mejor = 1;
	let dif = Infinity;
	for (let k = 1; k < ps.length; k++) {
		const d = Math.abs(anchoEm(ps.slice(0, k).join(' ').toUpperCase()) - anchoEm(ps.slice(k).join(' ').toUpperCase()));
		if (d < dif) {
			dif = d;
			mejor = k;
		}
	}
	return [ps.slice(0, mejor).join(' '), ps.slice(mejor).join(' ')];
};
