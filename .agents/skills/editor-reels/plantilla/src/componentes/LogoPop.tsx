import React from 'react';
import {Img, interpolate, spring, staticFile} from 'remotion';
import {C, HUECO_LOGO, SLOT_LOGO, ZONA, acento, acento2, fontFamily} from '../tema';
import {CLAMP, useT} from './comun';

type Props = {i: number; f: number; logo: string; nombre: string; acoplar?: number; logos: Record<string, string>};

const LADO = 250;

// El logo de la herramienta salta en el centro cuando la nombras y, si se indica,
// vuela a acoplarse en la etiqueta del capítulo (arriba a la izquierda).
export const LogoPop: React.FC<Props> = ({i, f, logo, nombre, acoplar, logos}) => {
	const {t, fps} = useT();
	if (t < i || t >= f || !logos[logo]) return null;
	const lf = (t - i) * fps;
	const entra = spring({frame: lf, fps, config: {damping: 11, stiffness: 170, mass: 0.8}});
	const rot = interpolate(entra, [0, 1], [-10, 0]);
	let x = ZONA.cx;
	let y = ZONA.cy - 18;
	let escala = 0.35 + 0.65 * entra;
	let op = Math.min(1, entra * 2);
	let nombreOp = interpolate(lf, [5, 11], [0, 1], CLAMP);

	if (acoplar !== undefined && t >= acoplar) {
		const a = spring({frame: (t - acoplar) * fps, fps, config: {damping: 20, stiffness: 120, mass: 0.9}});
		x = interpolate(a, [0, 1], [ZONA.cx, SLOT_LOGO.x]);
		y = interpolate(a, [0, 1], [ZONA.cy - 18, SLOT_LOGO.y]);
		escala = interpolate(a, [0, 1], [1, HUECO_LOGO / LADO]);
		op = interpolate(a, [0.72, 0.98], [1, 0], CLAMP);
		nombreOp = interpolate(a, [0, 0.25], [1, 0], CLAMP);
	} else if (acoplar === undefined) {
		const s = interpolate(t, [f - 0.18, f], [1, 0], CLAMP);
		op *= s;
		escala *= 0.85 + 0.15 * s;
	}
	const anillo = interpolate(lf, [0, 18], [0, 1], CLAMP);

	return (
		<div
			style={{
				position: 'absolute',
				left: x - LADO / 2,
				top: y - LADO / 2,
				width: LADO,
				height: LADO,
				transform: `scale(${escala}) rotate(${rot}deg)`,
				opacity: op,
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 56,
					border: `3px solid ${C.blue}`,
					transform: `scale(${1 + anillo * 0.6})`,
					opacity: (1 - anillo) * 0.7,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 56,
					background: C.card,
					border: `2px solid ${acento(0.5)}`,
					boxShadow: `0 30px 90px -20px ${acento2(0.6)}, inset 0 1px 0 rgba(255,255,255,.06)`,
					display: 'grid',
					placeItems: 'center',
				}}
			>
				<Img src={staticFile(logos[logo])} style={{width: 148, height: 148, objectFit: 'contain', borderRadius: 34}} />
			</div>
			<div
				style={{
					position: 'absolute',
					top: LADO + 18,
					left: -260,
					right: -260,
					textAlign: 'center',
					fontFamily,
					fontSize: 30,
					fontWeight: 800,
					letterSpacing: '.16em',
					color: C.text,
					textTransform: 'uppercase',
					opacity: nombreOp,
					textShadow: '0 4px 16px rgba(0,0,0,.65)',
				}}
			>
				{nombre}
			</div>
		</div>
	);
};
