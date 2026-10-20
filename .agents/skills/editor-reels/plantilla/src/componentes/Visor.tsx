import React from 'react';
import {interpolate, spring} from 'remotion';
import {C, acento, fontFamily} from '../tema';
import {Icono} from '../iconos';
import {CLAMP, useT} from './comun';

type Caja = {x: number; y: number; w: number; h: number};
type Props = {i: number; f: number; texto?: string; icono?: string; caja?: Caja};

const BRAZO = 74;

// Esquinas de visor alrededor de la cara que se cierran de golpe, como una cámara que enfoca, con una etiqueta
// arriba ("ZOOM"). Para señalar un salto de zoom o la propia cara. La caja por defecto rodea la franja de la cara.
export const Visor: React.FC<Props> = ({i, f, texto = 'ZOOM', icono = 'zoom', caja = {x: 270, y: 290, w: 540, h: 670}}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const e = spring({frame: (t - i) * fps, fps, config: {damping: 14, stiffness: 190}});
	const salida = interpolate(t, [f - 0.18, f], [1, 0], CLAMP);
	const esc = interpolate(e, [0, 1], [1.28, 1]);
	const cx = caja.x + caja.w / 2;
	const cy = caja.y + caja.h / 2;
	const w = caja.w * esc;
	const h = caja.h * esc;
	const x0 = cx - w / 2;
	const y0 = cy - h / 2;
	const esquinas = [
		{x: x0, y: y0, bx: 1, by: 1},
		{x: x0 + w, y: y0, bx: -1, by: 1},
		{x: x0, y: y0 + h, bx: 1, by: -1},
		{x: x0 + w, y: y0 + h, bx: -1, by: -1},
	];
	return (
		<div style={{position: 'absolute', inset: 0, opacity: Math.min(1, e * 2) * salida}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 0 10px ${acento(0.7)})`}}>
				{esquinas.map((c, k) => (
					<path
						key={k}
						d={`M ${c.x} ${c.y + c.by * BRAZO} L ${c.x} ${c.y} L ${c.x + c.bx * BRAZO} ${c.y}`}
						fill="none"
						stroke={C.blue}
						strokeWidth={7}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				))}
			</svg>
			<div
				style={{
					position: 'absolute',
					left: x0,
					top: y0 - 62,
					display: 'flex',
					alignItems: 'center',
					gap: 10,
					height: 46,
					padding: '0 18px 0 12px',
					borderRadius: 23,
					background: C.blue,
					boxShadow: `0 12px 34px -10px ${acento(0.8)}`,
					fontFamily,
					fontSize: 24,
					fontWeight: 900,
					letterSpacing: '.16em',
					color: '#fff',
				}}
			>
				<Icono nombre={icono} size={26} color="#fff" grosor={2.4} />
				{texto}
			</div>
		</div>
	);
};
