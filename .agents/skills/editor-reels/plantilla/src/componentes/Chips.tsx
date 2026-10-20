import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {C, ZONA, fontFamily} from '../tema';
import {Chip} from '../tipos';
import {Icono} from '../iconos';
import {CLAMP, useT} from './comun';

const ChipUno: React.FC<{it: Chip; t: number; fps: number; style: React.CSSProperties}> = ({it, t, fps, style}) => {
	const s = spring({frame: (t - it.en) * fps, fps, config: {damping: 12, stiffness: 200, mass: 0.6}});
	return (
		<div
			style={{
				...style,
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				padding: '0 26px 0 20px',
				boxSizing: 'border-box',
				background: C.card,
				border: `1px solid ${C.line2}`,
				borderRadius: 22,
				boxShadow: '0 22px 60px -24px rgba(0,0,0,.85)',
				fontFamily,
				transform: `translateY(${(1 - s) * 40}px) scale(${0.85 + 0.15 * s}) rotate(${it.rot ?? 0}deg)`,
				opacity: Math.min(1, s * 1.5),
			}}
		>
			<div
				style={{
					width: 68,
					height: 68,
					borderRadius: 16,
					flex: '0 0 auto',
					display: 'grid',
					placeItems: 'center',
					background: C.icoBg,
					border: `1px solid ${C.icoBorde}`,
				}}
			>
				<Icono nombre={it.icono} size={36} color={C.blue} />
			</div>
			<div style={{fontSize: 30, fontWeight: 800, letterSpacing: '.1em', color: C.text, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>
				{it.texto}
			</div>
		</div>
	);
};

// Tarjetas con icono que aparecen una a una, al ritmo de la enumeración ("imágenes, vídeos, anuncios...")
export const Chips: React.FC<{i: number; f: number; items: Chip[]; columnas?: number; libre?: boolean}> = ({
	i,
	f,
	items,
	columnas = 2,
	libre,
}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const salida = interpolate(t, [f - 0.18, f], [1, 0], CLAMP);
	if (libre) {
		return (
			<AbsoluteFill style={{opacity: salida}}>
				{items.map((it, k) =>
					t >= it.en ? (
						<ChipUno key={k} it={it} t={t} fps={fps} style={{position: 'absolute', left: it.x, top: it.y, height: 96}} />
					) : null,
				)}
			</AbsoluteFill>
		);
	}
	const w = columnas === 2 ? 410 : 300;
	const h = 112;
	const gap = 20;
	const filas = Math.ceil(items.length / columnas);
	const totalH = filas * h + (filas - 1) * gap;
	const totalW = columnas * w + (columnas - 1) * gap;
	const top = ZONA.cy - totalH / 2;
	const left = 540 - totalW / 2;
	return (
		<AbsoluteFill style={{opacity: salida}}>
			{items.map((it, k) => {
				const r = Math.floor(k / columnas);
				const c = k % columnas;
				return t >= it.en ? (
					<ChipUno
						key={k}
						it={it}
						t={t}
						fps={fps}
						style={{position: 'absolute', left: left + c * (w + gap), top: top + r * (h + gap), width: w, height: h}}
					/>
				) : null;
			})}
		</AbsoluteFill>
	);
};
