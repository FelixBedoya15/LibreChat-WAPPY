import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, staticFile} from 'remotion';
import {C, fondo} from '../tema';
import {Marco} from '../tipos';
import {useT} from '../componentes/comun';
import {ZoomPro} from './tipos';

// Vídeo base del reel "pro". Como el clásico: la cara en su franja, el fondo prolongado hacia arriba, un salto de
// encuadre en cada corte y un empuje lento dentro de cada tramo. Dos diferencias:
// - Cada tramo dice dónde se ancla su zoom. Con una pieza sobre el pecho se ancla en la barbilla: la cara crece
//   hacia arriba y nunca baja hacia la pieza. En un primer plano sin pieza, se ancla en el centro de la cara.
// - "abajo: reflejo" continúa la imagen con su reflejo desenfocado en vez de fundir a oscuro.
export const BasePro: React.FC<{src: string; zooms: ZoomPro[]; anclaY: number; marco: Marco; abajo?: 'oscuro' | 'reflejo'}> = ({
	src,
	zooms,
	anclaY,
	marco,
	abajo = 'oscuro',
}) => {
	const {t} = useT();
	const z = zooms.find((zz) => t >= zz.i && t < zz.f) ?? zooms[zooms.length - 1];
	let escala = 1;
	if (z) {
		const p = Math.min(1, Math.max(0, (t - z.i) / Math.max(0.001, z.f - z.i)));
		escala = z.e0 + (z.e1 - z.e0) * Easing.inOut(Easing.sin)(p);
	}
	const ancla = z?.ancla ?? anclaY;
	const {ancho, alto, arriba, izquierda} = marco;
	const video = staticFile(src);
	const hueco = Math.max(0, arriba);
	const fin = arriba + alto;
	const resto = 1920 - fin;
	return (
		<AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${escala})`, transformOrigin: `50% ${ancla * 100}%`}}>
				{hueco > 0 ? (
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
				{resto > 0 && abajo === 'reflejo' ? (
					<div style={{position: 'absolute', left: izquierda, top: fin - 2, width: ancho, height: resto + 300, overflow: 'hidden'}}>
						<OffthreadVideo
							src={video}
							muted
							style={{
								position: 'absolute',
								left: 0,
								top: 2 - alto,
								width: ancho,
								height: alto,
								transform: 'scaleY(-1)',
								transformOrigin: '50% 100%',
								filter: 'blur(26px) brightness(.5) saturate(.8)',
							}}
						/>
					</div>
				) : null}
				<OffthreadVideo src={video} style={{position: 'absolute', left: izquierda, top: arriba, width: ancho, height: alto}} />
				{resto > 0 ? (
					abajo === 'reflejo' ? (
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: fin - 90,
								height: resto + 490,
								background: `linear-gradient(180deg, ${fondo(0)} 0px, ${fondo(0.34)} 90px, ${fondo(0.6)} 260px, ${fondo(0.92)} ${resto + 90}px, ${C.bg} ${resto + 180}px)`,
							}}
						/>
					) : (
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: fin - 180,
								height: resto + 580,
								background: `linear-gradient(180deg, ${fondo(0)} 0px, ${C.bg} 180px)`,
							}}
						/>
					)
				) : null}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
