import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, acento, acento2} from '../tema';

export const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Tiempo actual en segundos
export const useT = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return {t: frame / fps, frame, fps};
};

// Cuadrado de logo o icono con el estilo de tarjeta DominIA
export const Tile: React.FC<{
	x: number;
	y: number;
	size: number;
	escala?: number;
	src?: string;
	destacado?: boolean;
	opacidad?: number;
	children?: React.ReactNode;
}> = ({x, y, size, escala = 1, src, destacado, opacidad = 1, children}) => (
	<div
		style={{
			position: 'absolute',
			left: x - size / 2,
			top: y - size / 2,
			width: size,
			height: size,
			borderRadius: size * 0.24,
			background: C.card,
			border: destacado ? `2px solid ${acento(0.65)}` : `1px solid ${C.line2}`,
			boxShadow: destacado
				? `0 0 0 1px ${acento(0.18)}, 0 26px 70px -22px ${acento2(0.7)}`
				: '0 20px 50px -24px rgba(0,0,0,.85)',
			display: 'grid',
			placeItems: 'center',
			transform: `scale(${escala})`,
			opacity: opacidad,
		}}
	>
		{src ? (
			<Img src={staticFile(src)} style={{width: size * 0.58, height: size * 0.58, objectFit: 'contain', borderRadius: size * 0.13}} />
		) : (
			children
		)}
	</div>
);
