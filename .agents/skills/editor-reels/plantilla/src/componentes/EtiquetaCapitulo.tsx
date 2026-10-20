import React from 'react';
import {Img, interpolate, spring, staticFile} from 'remotion';
import {C, ETIQUETA, HUECO_LOGO, fontFamily} from '../tema';
import {Capitulo} from '../tipos';
import {Icono} from '../iconos';
import {CLAMP, useT} from './comun';

// Etiqueta arriba a la izquierda: [logo] 01 CONOCIMIENTO. Te dice en qué parte del vídeo estás.
export const EtiquetaCapitulo: React.FC<{caps: Capitulo[]; logos: Record<string, string>}> = ({caps, logos}) => {
	const {t, fps} = useT();
	const cap = caps.find((c) => t >= c.i && t < c.f);
	if (!cap) return null;
	const e = spring({frame: (t - cap.i) * fps, fps, config: {damping: 18, stiffness: 180}});
	const salida = interpolate(t, [cap.f - 0.18, cap.f], [1, 0], CLAMP);
	const desde = cap.logoDesde ?? cap.i;
	const logoOp = interpolate(t, [desde, desde + 0.12], [0, 1], CLAMP);
	const src = cap.logo ? logos[cap.logo] : undefined;
	return (
		<div
			style={{
				position: 'absolute',
				left: ETIQUETA.x,
				top: ETIQUETA.y,
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				padding: '14px 32px 14px 14px',
				background: 'rgba(12,17,24,.9)',
				border: `1px solid ${C.line2}`,
				borderRadius: 20,
				boxShadow: '0 18px 50px -20px rgba(0,0,0,.75)',
				fontFamily,
				transform: `translateX(${(1 - e) * -90}px)`,
				opacity: Math.min(1, e * 1.4) * salida,
			}}
		>
			<div
				style={{
					width: HUECO_LOGO,
					height: HUECO_LOGO,
					borderRadius: 16,
					background: C.icoBg,
					border: `1px solid ${C.icoBorde}`,
					display: 'grid',
					placeItems: 'center',
				}}
			>
				{src ? (
					<Img src={staticFile(src)} style={{width: 40, height: 40, objectFit: 'contain', borderRadius: 9, opacity: logoOp}} />
				) : (
					<Icono nombre={cap.icono ?? 'sparkle'} size={32} color={C.blue} />
				)}
			</div>
			{cap.num ? (
				<div style={{fontSize: 46, fontWeight: 900, color: C.blue, letterSpacing: '-.02em'}}>{cap.num}</div>
			) : null}
			<div style={{fontSize: 26, fontWeight: 800, letterSpacing: '.18em', color: C.text, textTransform: 'uppercase'}}>
				{cap.titulo}
			</div>
		</div>
	);
};
