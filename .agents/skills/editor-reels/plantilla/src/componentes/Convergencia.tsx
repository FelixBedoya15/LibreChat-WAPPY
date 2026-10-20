import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring} from 'remotion';
import {C, ZONA, fontFamily} from '../tema';
import {Icono} from '../iconos';
import {CLAMP, Tile, useT} from './comun';

// Huecos repartidos alrededor del centro (el centro queda libre para el resultado final)
const HUECOS = [
	{x: 165, y: ZONA.top + 70},
	{x: 400, y: ZONA.top + 58},
	{x: 690, y: ZONA.top + 64},
	{x: 915, y: ZONA.top + 82},
	{x: 150, y: ZONA.bottom - 90},
	{x: 385, y: ZONA.bottom - 50},
	{x: 715, y: ZONA.bottom - 58},
	{x: 930, y: ZONA.bottom - 94},
];

type Props = {i: number; f: number; iconos: string[]; unir: number; final: {icono: string; texto: string; en: number}};

// "Información desordenada" -> "un solo cerebro": iconos sueltos que tiemblan y acaban fundiéndose en uno.
export const Convergencia: React.FC<Props> = ({i, f, iconos, unir, final}) => {
	const {t, fps, frame} = useT();
	if (t < i || t >= f) return null;
	const salida = interpolate(t, [f - 0.2, f], [1, 0], CLAMP);
	const centro = {x: ZONA.cx, y: ZONA.cy - 25};
	const u = interpolate(t, [unir, unir + 0.45], [0, 1], {easing: Easing.inOut(Easing.cubic), ...CLAMP});
	const fs = t >= final.en ? spring({frame: (t - final.en) * fps, fps, config: {damping: 10, stiffness: 170, mass: 0.8}}) : 0;
	const anillo = t >= final.en ? interpolate((t - final.en) * fps, [0, 20], [0, 1], CLAMP) : 0;
	return (
		<AbsoluteFill style={{opacity: salida}}>
			{iconos.map((ic, k) => {
				const h = HUECOS[k % HUECOS.length];
				const aparece = i + k * 0.12;
				if (t < aparece || u >= 1) return null;
				const s = spring({frame: (t - aparece) * fps, fps, config: {damping: 11, stiffness: 190, mass: 0.6}});
				const x0 = h.x + (random(`x${k}`) - 0.5) * 30;
				const y0 = h.y + (random(`y${k}`) - 0.5) * 30;
				const bamboleo = Math.sin(frame / 6 + k * 1.7) * 7 * (1 - u);
				const x = x0 + (centro.x - x0) * u;
				const y = y0 + (centro.y - y0) * u;
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: x - 46,
							top: y - 46,
							width: 92,
							height: 92,
							borderRadius: 22,
							display: 'grid',
							placeItems: 'center',
							background: C.card,
							border: `1px solid ${C.line2}`,
							boxShadow: '0 16px 40px -18px rgba(0,0,0,.85)',
							transform: `scale(${s * (1 - 0.65 * u)}) rotate(${(random(`r${k}`) - 0.5) * 34 + bamboleo}deg)`,
							opacity: 1 - u * u,
						}}
					>
						<Icono nombre={ic} size={44} color={C.muted} />
					</div>
				);
			})}
			{t >= final.en ? (
				<>
					<div
						style={{
							position: 'absolute',
							left: centro.x - 90,
							top: centro.y - 90,
							width: 180,
							height: 180,
							borderRadius: 44,
							border: `3px solid ${C.blue}`,
							transform: `scale(${1 + anillo * 0.7})`,
							opacity: (1 - anillo) * 0.7,
						}}
					/>
					<Tile x={centro.x} y={centro.y} size={180} escala={fs} destacado>
						<Icono nombre={final.icono} size={100} color={C.blue} grosor={1.8} />
					</Tile>
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: centro.y + 110,
							textAlign: 'center',
							fontFamily,
							fontSize: 30,
							fontWeight: 800,
							letterSpacing: '.16em',
							color: C.text,
							opacity: interpolate((t - final.en) * fps, [4, 10], [0, 1], CLAMP),
							textShadow: '0 4px 16px rgba(0,0,0,.65)',
						}}
					>
						{final.texto}
					</div>
				</>
			) : null}
		</AbsoluteFill>
	);
};
