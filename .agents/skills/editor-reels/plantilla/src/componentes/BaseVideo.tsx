import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, staticFile} from 'remotion';
import {C, fondo} from '../tema';
import {Marco, Zoom} from '../tipos';
import {useT} from './comun';

// Vídeo base colocado según el encuadre (encuadre.py): la cara queda en su franja y el resto del
// lienzo se rellena. Arriba se prolonga el fondo estirando la primera fila del vídeo (en una pared
// o un fondo liso parece un plano más abierto); abajo se funde con el color de fondo.
// Zooms: salto de encuadre en cada corte y un empuje lento dentro de cada tramo, anclados en la cara.
export const BaseVideo: React.FC<{src: string; zooms: Zoom[]; anclaY: number; marco: Marco}> = ({
	src,
	zooms,
	anclaY,
	marco,
}) => {
	const {t} = useT();
	const z = zooms.find((zz) => t >= zz.i && t < zz.f) ?? zooms[zooms.length - 1];
	let escala = 1;
	if (z) {
		const p = Math.min(1, Math.max(0, (t - z.i) / Math.max(0.001, z.f - z.i)));
		escala = z.e0 + (z.e1 - z.e0) * Easing.inOut(Easing.sin)(p);
	}
	const {ancho, alto, arriba, izquierda, relleno = 'estirar'} = marco;
	const video = staticFile(src);
	const hueco = Math.max(0, arriba);
	const abajo = arriba + alto;
	return (
		<AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${escala})`, transformOrigin: `50% ${anclaY * 100}%`}}>
				{ancho < 1076 || relleno === 'desenfoque' ? (
					<OffthreadVideo
						src={video}
						muted
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: 'blur(40px) brightness(.4)',
							transform: 'scale(1.15)',
						}}
					/>
				) : null}
				{hueco > 0 && relleno === 'estirar' ? (
					<div style={{position: 'absolute', left: izquierda, top: 0, width: ancho, height: hueco + 4, overflow: 'hidden'}}>
						<OffthreadVideo
							src={video}
							muted
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								width: ancho,
								height: alto,
								transform: `scaleY(${(hueco + 4) / 3})`,
								transformOrigin: 'top',
								filter: 'blur(2px)',
							}}
						/>
					</div>
				) : null}
				<OffthreadVideo src={video} style={{position: 'absolute', left: izquierda, top: arriba, width: ancho, height: alto}} />
				{abajo < 1920 ? (
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: abajo - 180,
							height: 1920 - abajo + 400,
							background: `linear-gradient(180deg, ${fondo(0)} 0px, ${C.bg} 180px)`,
						}}
					/>
				) : null}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Oscurecido suave arriba (etiqueta e interfaz de Instagram) y abajo (gráficos y subtítulos)
export const Degradados: React.FC = () => (
	<AbsoluteFill
		style={{
			background:
				`linear-gradient(180deg, ${fondo(0.88)} 0%, ${fondo(0.45)} 9%, ${fondo(0)} 18%, ${fondo(0)} 46%, ${fondo(0.35)} 62%, ${fondo(0.6)} 100%)`,
		}}
	/>
);
