import React from 'react';
import {interpolate, spring} from 'remotion';
import {COLOR_ESTADO, ZONA, fontFamily} from '../tema';
import {Color} from '../tipos';
import {Icono} from '../iconos';
import {CLAMP, useT} from './comun';

// Palabra de impacto en grande y recta ("GRATIS"): las letras suben una a una, el icono salta
// y un subrayado se dibuja desde el centro. Para 1-2 palabras que tienen que quedarse grabadas.
export const Destacado: React.FC<{i: number; f: number; texto: string; color: Color; icono?: string}> = ({
	i,
	f,
	texto,
	color,
	icono,
}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const lf = (t - i) * fps;
	const col = COLOR_ESTADO[color];
	const letras = texto.toUpperCase().split('');
	const tam = Math.min(150, Math.floor(880 / (letras.length * 0.74 + (icono ? 1.05 : 0))));
	const salida = interpolate(t, [f - 0.2, f], [1, 0], CLAMP);
	const ico = spring({frame: lf, fps, config: {damping: 11, stiffness: 200, mass: 0.6}});
	const raya = spring({frame: lf - letras.length * 1.1 - 1, fps, config: {damping: 16, stiffness: 150}});
	const anchoTexto = letras.length * tam * 0.72;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: ZONA.cy - tam * 0.72,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				opacity: salida,
				transform: `scale(${0.96 + 0.04 * salida})`,
			}}
		>
			<div style={{display: 'flex', alignItems: 'center', gap: tam * 0.16}}>
				{icono ? (
					<div
						style={{
							width: tam * 0.78,
							height: tam * 0.78,
							borderRadius: '50%',
							background: `${col}22`,
							border: `3px solid ${col}`,
							display: 'grid',
							placeItems: 'center',
							transform: `scale(${ico})`,
							boxShadow: `0 0 44px ${col}55`,
						}}
					>
						<Icono nombre={icono} size={tam * 0.46} color={col} grosor={3} />
					</div>
				) : null}
				<div
					style={{
						display: 'flex',
						fontFamily,
						fontSize: tam,
						fontWeight: 900,
						color: col,
						letterSpacing: '-.01em',
						lineHeight: 1,
						textShadow: `0 0 50px ${col}55, 0 8px 30px rgba(0,0,0,.65)`,
					}}
				>
					{letras.map((l, k) => {
						const s = spring({frame: lf - 1 - k * 1.1, fps, config: {damping: 13, stiffness: 190, mass: 0.6}});
						return (
							<span
								key={k}
								style={{display: 'inline-block', whiteSpace: 'pre', transform: `translateY(${(1 - s) * 50}px)`, opacity: Math.min(1, s * 1.4)}}
							>
								{l}
							</span>
						);
					})}
				</div>
			</div>
			<div
				style={{
					marginTop: tam * 0.14,
					marginLeft: icono ? tam * 0.94 : 0,
					height: 12,
					width: anchoTexto,
					borderRadius: 6,
					background: col,
					transform: `scaleX(${Math.max(0, raya)})`,
					boxShadow: `0 0 24px ${col}88`,
				}}
			/>
		</div>
	);
};
