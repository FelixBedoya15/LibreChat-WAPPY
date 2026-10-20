import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {Reel} from './Reel';
import {ReelPro} from './pro/ReelPro';
import {EDLPro, PropsPro} from './pro/tipos';
import {EDL, PropsReel} from './tipos';
import {ALTO, ANCHO} from './tema';

const FPS = 30;

// Cada reel es un guion (EDL) en public/reels/<nombre>/. Se elige con --props='{"edl":"reels/<nombre>/edl.json"}'
// Los fps salen del EDL (los del vídeo base: 30, o 25/24 si la imagen de la grabación va así).
// Dos composiciones:
//   Reel     el modo clásico (edl.json): etiqueta de capítulo, una pieza bajo la barbilla y subtítulos grandes.
//   ReelPro  el modo pro (edl_pro.json): cara + pieza, escenas a pantalla completa y primer plano.
const calcular: CalculateMetadataFunction<PropsReel> = async ({props}) => {
	const data = (await fetch(staticFile(props.edl)).then((r) => r.json())) as EDL;
	const fps = data.fps ?? FPS;
	return {fps, durationInFrames: Math.max(1, Math.ceil(data.duracion * fps - 1e-6)), props: {...props, data}};
};

const calcularPro: CalculateMetadataFunction<PropsPro> = async ({props}) => {
	const data = (await fetch(staticFile(props.edl)).then((r) => r.json())) as EDLPro;
	const fps = data.fps ?? FPS;
	return {fps, durationInFrames: Math.max(1, Math.ceil(data.duracion * fps - 1e-6)), props: {...props, data}};
};

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="Reel"
			component={Reel}
			width={ANCHO}
			height={ALTO}
			fps={FPS}
			durationInFrames={FPS * 10}
			defaultProps={{edl: 'reels/prueba/edl.json'} as PropsReel}
			calculateMetadata={calcular}
		/>
		<Composition
			id="ReelPro"
			component={ReelPro}
			width={ANCHO}
			height={ALTO}
			fps={FPS}
			durationInFrames={FPS * 10}
			defaultProps={{edl: 'reels/prueba/edl_pro.json'} as PropsPro}
			calculateMetadata={calcularPro}
		/>
	</>
);
