import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {ZONA, acento} from '../tema';
import {CLAMP, Tile, useT} from './comun';

type Props = {i: number; f: number; centro: string; logos: string[]; entradas: number[]; todos: Record<string, string>};

// Hasta 4 herramientas: esquinas. De 5 a 6: tres filas a cada lado.
const POS4 = [
	{x: 200, y: ZONA.cy - 105},
	{x: 880, y: ZONA.cy - 105},
	{x: 200, y: ZONA.cy + 105},
	{x: 880, y: ZONA.cy + 105},
];
const POS6 = [
	{x: 190, y: ZONA.cy - 118},
	{x: 890, y: ZONA.cy - 118},
	{x: 120, y: ZONA.cy},
	{x: 960, y: ZONA.cy},
	{x: 190, y: ZONA.cy + 118},
	{x: 890, y: ZONA.cy + 118},
];

// Un logo central conectado con varias herramientas: "no son herramientas sueltas, es un ecosistema".
export const Ecosistema: React.FC<Props> = ({i, f, centro, logos, entradas, todos}) => {
	const {t, fps, frame} = useT();
	if (t < i || t >= f) return null;
	const lf = (t - i) * fps;
	const h = spring({frame: lf, fps, config: {damping: 18, stiffness: 140}});
	const hubSize = interpolate(h, [0, 1], [250, 150]);
	const salida = interpolate(t, [f - 0.2, f], [1, 0], CLAMP);
	const hub = {x: ZONA.cx, y: ZONA.cy};
	const POS = logos.length > 4 ? POS6 : POS4;
	const lado = logos.length > 4 ? 108 : 124;
	return (
		<AbsoluteFill style={{opacity: salida}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{logos.map((_, k) => {
					const e = entradas[k];
					const p = interpolate(t, [e - 0.05, e + 0.22], [0, 1], CLAMP);
					if (p <= 0) return null;
					const x2 = hub.x + (POS[k].x - hub.x) * p;
					const y2 = hub.y + (POS[k].y - hub.y) * p;
					return (
						<line
							key={k}
							x1={hub.x}
							y1={hub.y}
							x2={x2}
							y2={y2}
							stroke={acento(0.8)}
							strokeWidth={3}
							strokeDasharray="10 10"
							strokeDashoffset={-frame * 1.2}
							strokeLinecap="round"
						/>
					);
				})}
			</svg>
			{logos.map((lg, k) => {
				const e = entradas[k];
				if (t < e || !todos[lg]) return null;
				const s = spring({frame: (t - e) * fps, fps, config: {damping: 10, stiffness: 180, mass: 0.7}});
				return k < POS.length ? <Tile key={k} x={POS[k].x} y={POS[k].y} size={lado} escala={s} src={todos[lg]} /> : null;
			})}
			<Tile x={hub.x} y={hub.y} size={hubSize} src={todos[centro]} destacado />
		</AbsoluteFill>
	);
};
