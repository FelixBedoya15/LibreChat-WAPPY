import React from 'react';
import {interpolate, spring} from 'remotion';
import {C, acento, acento2} from '../tema';
import {Icono} from '../iconos';
import {CLAMP, useT} from './comun';
import {Pista, TARJETA, Tarjeta, mmss} from './LineaTiempo';

type Props = {
	i: number;
	f: number;
	total: number; // duración del reel (s)
	marcas: {t: number; icono: string}[]; // dónde empieza cada pieza del reel
	barrido: [number, number]; // cuándo recorre el cabezal la línea de tiempo
	bloques?: [number, number][]; // trozos del reel (sus cortes), para dibujarlos en la pista
	titulo?: string;
};

const TILE = 58;

// El propio reel como línea de tiempo: un cabezal la recorre y cada pieza se enciende en su sitio, con su icono
// encima de la pista. Enseña que cada animación va donde se dice lo que la motiva. Las marcas salen del guion.
export const Sincronia: React.FC<Props> = ({i, f, total, marcas, barrido, bloques, titulo = 'LÍNEA DE TIEMPO'}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const e = spring({frame: (t - i) * fps, fps, config: {damping: 16, stiffness: 150}});
	const salida = interpolate(t, [f - 0.2, f], [1, 0], CLAMP);
	const p = interpolate(t, barrido, [0, 1], CLAMP);
	const px = TARJETA.pista / total;
	const cabezal = p * TARJETA.pista;
	const margen = (TARJETA.width - TARJETA.pista) / 2;
	const tramos = bloques ?? [[0, total]];
	return (
		<Tarjeta e={e} salida={salida}>
			<div style={{position: 'absolute', left: 50, top: 34, fontSize: 24, fontWeight: 800, letterSpacing: '.22em', color: C.muted}}>
				{titulo}
			</div>
			<div style={{position: 'absolute', right: 50, top: 14, fontSize: 58, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: C.text}}>
				{mmss(p * total)}
			</div>
			{marcas.map((m, k) => {
				const x = margen + m.t * px;
				const paso = (t - barrido[0]) * fps - (m.t / total) * (barrido[1] - barrido[0]) * fps;
				const on = paso >= 0;
				const s = on ? spring({frame: paso, fps, config: {damping: 10, stiffness: 220, mass: 0.6}}) : 0;
				return (
					<React.Fragment key={k}>
						<div
							style={{
								position: 'absolute',
								left: x - 1,
								top: 86 + TILE,
								width: 2,
								height: 16,
								background: on ? C.blue : C.line2,
							}}
						/>
						<div
							style={{
								position: 'absolute',
								left: x - TILE / 2,
								top: 86,
								width: TILE,
								height: TILE,
								borderRadius: 16,
								display: 'grid',
								placeItems: 'center',
								background: on ? C.icoBg : '#0c1017',
								border: on ? `2px solid ${acento(0.7)}` : `1px solid ${C.line2}`,
								boxShadow: on ? `0 0 26px ${acento2(0.55)}` : 'none',
								transform: `scale(${on ? interpolate(s, [0, 1], [1.25, 1]) : 0.86})`,
								opacity: on ? 1 : 0.45,
							}}
						>
							<Icono nombre={m.icono} size={30} color={on ? C.blue : C.dim} />
						</div>
					</React.Fragment>
				);
			})}
			<Pista top={162}>
				{tramos.map(([a, b], k) => {
					const x0 = a * px;
					const w = (b - a) * px;
					const lleno = Math.max(0, Math.min(w, cabezal - x0));
					return (
						<React.Fragment key={k}>
							<div style={{position: 'absolute', left: x0 + 1, top: 11, width: Math.max(2, w - 2), height: 48, borderRadius: 6, background: '#1a2230'}} />
							{lleno > 0 ? (
								<div
									style={{
										position: 'absolute',
										left: x0 + 1,
										top: 11,
										width: Math.max(2, lleno - 2),
										height: 48,
										borderRadius: 6,
										background: `linear-gradient(180deg, ${C.blue}, ${C.blue2})`,
										boxShadow: `0 0 16px ${acento2(0.55)}`,
									}}
								/>
							) : null}
						</React.Fragment>
					);
				})}
				<div style={{position: 'absolute', left: cabezal - 1.5, top: 0, width: 3, height: '100%', background: C.text, boxShadow: '0 0 12px rgba(255,255,255,.6)'}} />
			</Pista>
		</Tarjeta>
	);
};
