import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {C, ZONA, fontFamily} from '../tema';
import {Icono} from '../iconos';
import {CLAMP, Tile, useT} from './comun';

type Nodo = {logo?: string; icono?: string; texto: string; en: number; sub?: string; subEn?: number};
type Props = {i: number; f: number; nodos: Nodo[]; logos: Record<string, string>};

// Recorrido de herramientas unidas por flechas; cada una se enciende cuando la mencionas. Un nodo lleva el logo
// de una herramienta o, si no la hay (tu vídeo, el resultado), un icono; "sub" es una segunda línea que aparece en "subEn".
export const Pipeline: React.FC<Props> = ({i, f, nodos, logos}) => {
	const {t, fps, frame} = useT();
	if (t < i || t >= f) return null;
	const n = nodos.length;
	const tile = 124;
	const hueco = 92;
	const totalW = n * tile + (n - 1) * hueco;
	const x0 = 540 - totalW / 2 + tile / 2;
	const cy = ZONA.cy - 40;
	const salida = interpolate(t, [f - 0.2, f], [1, 0], CLAMP);
	return (
		<AbsoluteFill style={{opacity: salida}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<defs>
					<marker id="punta" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
						<path d="M0 0 L10 5 L0 10 z" fill={C.blue} />
					</marker>
				</defs>
				{nodos.slice(1).map((nd, k) => {
					const xa = x0 + k * (tile + hueco) + tile / 2 + 10;
					const xb = x0 + (k + 1) * (tile + hueco) - tile / 2 - 12;
					const p = interpolate(t, [nd.en - 0.3, nd.en], [0, 1], CLAMP);
					if (p <= 0) return null;
					return (
						<line
							key={k}
							x1={xa}
							y1={cy}
							x2={xa + (xb - xa) * p}
							y2={cy}
							stroke={C.blue}
							strokeWidth={3}
							strokeDasharray="8 8"
							strokeDashoffset={-frame * 1.2}
							markerEnd={p > 0.9 ? 'url(#punta)' : undefined}
						/>
					);
				})}
			</svg>
			{nodos.map((nd, k) => {
				const x = x0 + k * (tile + hueco);
				const s = spring({frame: (t - i - k * 0.08) * fps, fps, config: {damping: 14, stiffness: 180}});
				const on = t >= nd.en;
				const pop = on ? spring({frame: (t - nd.en) * fps, fps, config: {damping: 9, stiffness: 220, mass: 0.6}}) : 0;
				const esc = s * (on ? interpolate(pop, [0, 1], [1.2, 1]) : 0.92);
				return (
					<React.Fragment key={k}>
						<Tile x={x} y={cy} size={tile} escala={esc} src={nd.logo ? logos[nd.logo] : undefined} destacado={on} opacidad={on ? 1 : 0.38}>
							{nd.icono ? <Icono nombre={nd.icono} size={tile * 0.46} color={on ? C.blue : C.dim} /> : null}
						</Tile>
						<div
							style={{
								position: 'absolute',
								left: x - 110,
								width: 220,
								top: cy + tile / 2 + 18,
								textAlign: 'center',
								fontFamily,
								fontSize: 19,
								fontWeight: 800,
								letterSpacing: '.12em',
								color: on ? C.text : C.dim,
								opacity: s,
							}}
						>
							{nd.texto}
						</div>
						{nd.sub ? (
							<div
								style={{
									position: 'absolute',
									left: x - 110,
									width: 220,
									top: cy + tile / 2 + 46,
									textAlign: 'center',
									fontFamily,
									fontSize: 18,
									fontWeight: 800,
									letterSpacing: '.12em',
									color: C.blue,
									opacity: nd.subEn !== undefined ? interpolate(t, [nd.subEn, nd.subEn + 0.2], [0, 1], CLAMP) : s,
								}}
							>
								{nd.sub}
							</div>
						) : null}
					</React.Fragment>
				);
			})}
		</AbsoluteFill>
	);
};
