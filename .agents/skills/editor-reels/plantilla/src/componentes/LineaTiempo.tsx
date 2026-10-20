import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {C, ZONA, acento, acento2, fontFamily} from '../tema';
import {CLAMP, useT} from './comun';

type Props = {
	i: number;
	f: number;
	total: number; // duración del vídeo en bruto (s)
	final: number; // duración del reel (s)
	bloques: [number, number][]; // trozos que se conservan, en segundos del vídeo en bruto
	pausasEn?: number;
	juntarEn: number;
	antes?: string;
	despues?: string;
};

export const mmss = (s: number) => {
	const r = Math.max(0, Math.round(s));
	return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
};

// Centrada y sin pasar de x≈980: los botones de Instagram tapan la derecha (el contenido acaba en x 930)
export const TARJETA = {left: 100, width: 880, top: ZONA.top + 10, height: 262, pista: 780};
const ALTO_PISTA = 70;

// Tarjeta de línea de tiempo con el aspecto de la zona de gráficos (entra desde abajo y se funde al salir)
export const Tarjeta: React.FC<{e: number; salida: number; children: React.ReactNode}> = ({e, salida, children}) => (
	<div
		style={{
			position: 'absolute',
			left: TARJETA.left,
			top: TARJETA.top,
			width: TARJETA.width,
			height: TARJETA.height,
			borderRadius: 28,
			background: C.card,
			border: `1px solid ${C.line2}`,
			boxShadow: '0 30px 80px -30px rgba(0,0,0,.9)',
			fontFamily,
			transform: `translateY(${(1 - e) * 50}px) scale(${0.96 + 0.04 * e})`,
			opacity: Math.min(1, e * 1.5) * salida,
		}}
	>
		{children}
	</div>
);

// Pista de la línea de tiempo (fondo oscuro con borde), a la altura común de las dos piezas de tiempo
export const Pista: React.FC<{top: number; children: React.ReactNode}> = ({top, children}) => (
	<div
		style={{
			position: 'absolute',
			left: (TARJETA.width - TARJETA.pista) / 2,
			top,
			width: TARJETA.pista,
			height: ALTO_PISTA,
			borderRadius: 14,
			background: '#0a0e14',
			border: `1px solid ${C.line}`,
			overflow: 'hidden',
		}}
	>
		{children}
	</div>
);

// El vídeo en bruto como línea de tiempo: los trozos con voz en el color de acento y las pausas vacías.
// En "pausasEn" las pausas se marcan en ámbar con su duración total; en "juntarEn" desaparecen, los trozos se
// juntan y el contador baja de la duración en bruto a la del reel. Son los tiempos reales (los rellena el EDL).
export const LineaTiempo: React.FC<Props> = ({
	i,
	f,
	total,
	final,
	bloques,
	pausasEn,
	juntarEn,
	antes = 'EN BRUTO',
	despues = 'SIN PAUSAS',
}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const e = spring({frame: (t - i) * fps, fps, config: {damping: 16, stiffness: 150}});
	const salida = interpolate(t, [f - 0.2, f], [1, 0], CLAMP);
	const j = interpolate(t, [juntarEn, juntarEn + 0.9], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
	const marca = pausasEn === undefined ? 0 : interpolate(t, [pausasEn, pausasEn + 0.3], [0, 1], CLAMP);
	const px = TARJETA.pista / total;
	let acum = 0;
	const trozos = bloques.map(([a, b]) => {
		const x = a * px + (acum - a) * px * j;
		acum += b - a;
		return {x, w: (b - a) * px};
	});
	const huecos: {x: number; w: number}[] = [];
	let fin = 0;
	for (const tr of trozos) {
		if (tr.x - fin > 0.5) huecos.push({x: fin, w: tr.x - fin});
		fin = tr.x + tr.w;
	}
	const cola = (TARJETA.pista - fin) * (1 - j);
	if (cola > 0.5) huecos.push({x: fin, w: cola});
	const pausas = total - acum;
	const ambar = C.amber;
	return (
		<Tarjeta e={e} salida={salida}>
			<div style={{position: 'absolute', left: 50, top: 34, fontSize: 24, fontWeight: 800, letterSpacing: '.22em', color: C.muted}}>
				<span style={{position: 'absolute', whiteSpace: 'nowrap', opacity: interpolate(j, [0, 0.4], [1, 0], CLAMP)}}>{antes}</span>
				<span style={{position: 'absolute', whiteSpace: 'nowrap', opacity: interpolate(j, [0.6, 1], [0, 1], CLAMP), color: C.blue}}>
					{despues}
				</span>
			</div>
			<div
				style={{
					position: 'absolute',
					right: 50,
					top: 14,
					fontSize: 58,
					fontWeight: 900,
					fontVariantNumeric: 'tabular-nums',
					color: j >= 1 ? C.blue : C.text,
					textShadow: j >= 1 ? `0 0 30px ${acento(0.45)}` : 'none',
				}}
			>
				{mmss(total + (final - total) * j)}
			</div>
			<Pista top={96}>
				{huecos.map((h, k) => (
					<div
						key={`h${k}`}
						style={{
							position: 'absolute',
							left: h.x,
							top: 0,
							width: h.w,
							height: '100%',
							opacity: marca * (1 - j),
							background: `repeating-linear-gradient(90deg, ${ambar}88 0 3px, ${ambar}22 3px 7px)`,
						}}
					/>
				))}
				{trozos.map((tr, k) => (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: tr.x,
							top: 11,
							width: Math.max(3, tr.w - 1),
							height: ALTO_PISTA - 24,
							borderRadius: 6,
							background: `linear-gradient(180deg, ${C.blue}, ${C.blue2})`,
							boxShadow: `0 0 16px ${acento2(0.55)}`,
						}}
					/>
				))}
			</Pista>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 190,
					display: 'flex',
					justifyContent: 'center',
					opacity: marca * (1 - j),
					transform: `translateY(${(1 - marca) * 12}px)`,
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						height: 46,
						padding: '0 22px',
						borderRadius: 23,
						background: `${ambar}1f`,
						border: `1px solid ${ambar}88`,
						fontSize: 24,
						fontWeight: 800,
						letterSpacing: '.14em',
						color: ambar,
					}}
				>
					<span style={{width: 18, height: 18, borderRadius: 4, background: `repeating-linear-gradient(90deg, ${ambar} 0 3px, transparent 3px 6px)`}} />
					{mmss(pausas)} DE PAUSAS
				</div>
			</div>
		</Tarjeta>
	);
};
