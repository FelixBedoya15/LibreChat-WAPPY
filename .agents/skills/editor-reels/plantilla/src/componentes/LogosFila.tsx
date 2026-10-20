import React from 'react';
import {Img, interpolate, spring, staticFile} from 'remotion';
import {C, ZONA, acento, acento2, fontFamily} from '../tema';
import {CLAMP, useT} from './comun';

type Props = {i: number; f: number; items: {logo: string; nombre: string; en: number}[]; logos: Record<string, string>};

const LADO = 190;
const HUECO = 80;

// Varios logos en fila que saltan uno a uno al nombrarlos ("como Claude o ChatGPT"), con su nombre debajo.
export const LogosFila: React.FC<Props> = ({i, f, items, logos}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const salida = interpolate(t, [f - 0.18, f], [1, 0], CLAMP);
	const total = items.length * LADO + (items.length - 1) * HUECO;
	const x0 = 540 - total / 2;
	const top = ZONA.cy - 30 - LADO / 2;
	return (
		<div style={{position: 'absolute', inset: 0, opacity: salida}}>
			{items.map((it, k) => {
				if (t < it.en || !logos[it.logo]) return null;
				const lf = (t - it.en) * fps;
				const s = spring({frame: lf, fps, config: {damping: 11, stiffness: 170, mass: 0.8}});
				const anillo = interpolate(lf, [0, 18], [0, 1], CLAMP);
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: x0 + k * (LADO + HUECO),
							top,
							width: LADO,
							height: LADO,
							transform: `scale(${0.35 + 0.65 * s})`,
							opacity: Math.min(1, s * 2),
						}}
					>
						<div
							style={{
								position: 'absolute',
								inset: 0,
								borderRadius: 46,
								border: `3px solid ${C.blue}`,
								transform: `scale(${1 + anillo * 0.55})`,
								opacity: (1 - anillo) * 0.7,
							}}
						/>
						<div
							style={{
								position: 'absolute',
								inset: 0,
								borderRadius: 46,
								background: C.card,
								border: `2px solid ${acento(0.5)}`,
								boxShadow: `0 30px 80px -22px ${acento2(0.6)}, inset 0 1px 0 rgba(255,255,255,.06)`,
								display: 'grid',
								placeItems: 'center',
							}}
						>
							<Img src={staticFile(logos[it.logo])} style={{width: 112, height: 112, objectFit: 'contain', borderRadius: 26}} />
						</div>
						<div
							style={{
								position: 'absolute',
								top: LADO + 16,
								left: -120,
								right: -120,
								textAlign: 'center',
								fontFamily,
								fontSize: 28,
								fontWeight: 800,
								letterSpacing: '.14em',
								color: C.text,
								textTransform: 'uppercase',
								textShadow: '0 4px 16px rgba(0,0,0,.65)',
								opacity: interpolate(lf, [4, 10], [0, 1], CLAMP),
							}}
						>
							{it.nombre}
						</div>
					</div>
				);
			})}
		</div>
	);
};
