import React from 'react';
import {interpolate, spring} from 'remotion';
import {C, ZONA, acento, acento2, fontFamily} from '../tema';
import {Icono} from '../iconos';
import {CLAMP, useT} from './comun';

type Props = {i: number; f: number; etiqueta: string; palabra: string; escribirEn: number; sub: string};

const SEG_POR_LETRA = 0.1; // como los clics de construir_edl.py, a cualquier fps

// Llamada a la acción: la palabra clave se escribe sola en una caja de comentario.
export const CTA: React.FC<Props> = ({i, f, etiqueta, palabra, escribirEn, sub}) => {
	const {t, fps, frame} = useT();
	if (t < i || t >= f) return null;
	const e = spring({frame: (t - i) * fps, fps, config: {damping: 14, stiffness: 160}});
	const salida = interpolate(t, [f - 0.15, f], [1, 0], CLAMP);
	const n = t >= escribirEn ? Math.min(palabra.length, Math.floor((t - escribirEn) / SEG_POR_LETRA + 1e-6) + 1) : 0;
	const completo = n >= palabra.length;
	const finEscritura = escribirEn + palabra.length * SEG_POR_LETRA;
	const brillo = completo ? spring({frame: (t - finEscritura) * fps, fps, config: {damping: 10, stiffness: 200}}) : 0;
	const cursor = Math.floor(frame / 8) % 2 === 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: 540 - 380,
				top: ZONA.cy - 150,
				width: 760,
				height: 290,
				transform: `translateY(${(1 - e) * 60}px) scale(${0.9 + 0.1 * e})`,
				opacity: Math.min(1, e * 1.5) * salida,
				borderRadius: 28,
				background: C.card,
				border: `1px solid ${acento(0.45)}`,
				boxShadow: `0 40px 100px -30px ${acento2(0.55)}`,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 18,
				fontFamily,
			}}
		>
			<div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, fontWeight: 800, letterSpacing: '.24em', color: C.blue}}>
				<Icono nombre="msg" size={30} color={C.blue} />
				{etiqueta}
			</div>
			<div
				style={{
					minWidth: 520,
					height: 118,
					padding: '0 30px',
					boxSizing: 'border-box',
					borderRadius: 22,
					background: '#0a0e14',
					border: `2px solid ${completo ? C.blue : C.line2}`,
					boxShadow: completo ? `0 0 ${46 * brillo}px ${acento(0.6)}` : 'none',
					transform: `scale(${completo ? interpolate(brillo, [0, 1], [1.06, 1]) : 1})`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: 92,
					fontWeight: 900,
					color: C.text,
					letterSpacing: '.04em',
				}}
			>
				{palabra.slice(0, n)}
				<span style={{display: 'inline-block', width: 6, height: 78, marginLeft: 10, background: C.blue, opacity: cursor ? 1 : 0}} />
			</div>
			<div style={{fontSize: 26, fontWeight: 600, color: C.muted}}>{sub}</div>
		</div>
	);
};
