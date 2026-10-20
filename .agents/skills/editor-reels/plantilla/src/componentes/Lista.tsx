import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {C, COLOR_ESTADO, ZONA, fontFamily} from '../tema';
import {Color} from '../tipos';
import {CLAMP, useT} from './comun';

type Props = {i: number; f: number; items: {texto: string; en: number}[]; color?: Color; ancho?: number};

const ALTO = 96;
const HUECO = 22;

// Lista de ventajas: cada línea entra cuando la dices y su check se dibuja solo.
export const Lista: React.FC<Props> = ({i, f, items, color = 'green', ancho = 720}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const col = COLOR_ESTADO[color];
	const salida = interpolate(t, [f - 0.2, f], [1, 0], CLAMP);
	const total = items.length * ALTO + (items.length - 1) * HUECO;
	const top = ZONA.cy - total / 2;
	return (
		<AbsoluteFill style={{opacity: salida}}>
			{items.map((it, k) => {
				if (t < it.en) return null;
				const lf = (t - it.en) * fps;
				const s = spring({frame: lf, fps, config: {damping: 14, stiffness: 180}});
				const trazo = interpolate(lf, [4, 13], [0, 1], CLAMP);
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: 540 - ancho / 2,
							top: top + k * (ALTO + HUECO),
							width: ancho,
							height: ALTO,
							display: 'flex',
							alignItems: 'center',
							gap: 22,
							padding: '0 30px 0 16px',
							boxSizing: 'border-box',
							background: C.card,
							border: `1px solid ${C.line2}`,
							borderRadius: 26,
							boxShadow: '0 22px 60px -24px rgba(0,0,0,.85)',
							transform: `translateX(${(1 - s) * -60}px)`,
							opacity: Math.min(1, s * 1.5),
							fontFamily,
						}}
					>
						<div
							style={{
								width: 64,
								height: 64,
								flex: '0 0 auto',
								borderRadius: '50%',
								background: `${col}1f`,
								border: `2px solid ${col}99`,
								display: 'grid',
								placeItems: 'center',
							}}
						>
							<svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
								<path d="M20 6 9 17l-5-5" strokeDasharray={24} strokeDashoffset={24 * (1 - trazo)} />
							</svg>
						</div>
						<div style={{fontSize: 46, fontWeight: 900, color: C.text, letterSpacing: '.02em', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>
							{it.texto}
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
