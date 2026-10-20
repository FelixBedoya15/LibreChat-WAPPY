import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {C, fondo} from '../tema';
import {BasePro} from './BasePro';
import {useT} from '../componentes/comun';
import {Acciones, Cambio, Campo, Columnas, Comenta, Lista, Logos, Pregunta, Presentacion, Sentencia, Titular} from './cara';
import {EscenaCuerpos, EscenaRevelado} from './escenas';
import * as propias from './propias';
import {Capitulo, LogoMarca, SubtitulosPro} from './Subtitulos';
import {SANS, SEGURO} from './sistema';
import {EDLPro, Pieza, PropsPro} from './tipos';

// Reel "pro": tres tipos de plano que se alternan (cara + pieza sobre el pecho, escena a pantalla completa y primer
// plano sin pieza) y piezas que se construyen con la voz. El catálogo está en references/guion-pro.md.
// Las piezas propias de un proyecto se apuntan en propias.tsx (reel.py preparar no lo toca).

/* eslint-disable @typescript-eslint/no-explicit-any */
// Piezas sobre el plano de cara
const CARA: Record<string, React.FC<any>> = {
	titular: Titular,
	presentacion: Presentacion,
	columnas: Columnas,
	cambio: Cambio,
	sentencia: Sentencia,
	campo: Campo,
	pregunta: Pregunta,
	comenta: Comenta,
	acciones: Acciones,
	lista: Lista,
	logos: Logos,
	...propias.CARA,
};
// Piezas a pantalla completa (tapan la cara)
const ESCENAS: Record<string, React.FC<any>> = {
	revelado: EscenaRevelado,
	escena: EscenaCuerpos,
	...propias.ESCENAS,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const pintar = (p: Pieza, k: number, data: EDLPro, mapa: Record<string, React.FC<any>>) => {
	const Comp = mapa[p.tipo];
	return Comp ? <Comp key={k} {...p} logos={data.logos} propios={p.tipo === 'escena' ? propias.CUERPOS : undefined} /> : null;
};

// Oscurecido suave: arriba para el capítulo y la interfaz de Instagram; abajo para las piezas y los subtítulos.
// Y una viñeta muy ligera que cierra los bordes y deja la cara como lo más luminoso del plano.
const Velo: React.FC<{vineta: number}> = ({vineta}) => (
	<>
		<AbsoluteFill
			style={{
				background: `linear-gradient(180deg, ${fondo(0.82)} 0%, ${fondo(0.4)} 9%, ${fondo(0)} 18%, ${fondo(0)} 44%, ${fondo(0.3)} 60%, ${fondo(0.62)} 100%)`,
			}}
		/>
		{vineta > 0 ? (
			<AbsoluteFill style={{background: `radial-gradient(ellipse 78% 46% at 50% 33%, ${fondo(0)} 55%, ${fondo(vineta)} 100%)`}} />
		) : null}
	</>
);

// Solo para revisar fotogramas (reel.py revisar … --zonas): lo que tapa la interfaz de Instagram, en rojo, y el
// recorte 3:4 con el que se ve la portada en el perfil, en línea discontinua.
const Zonas: React.FC = () => {
	const rojo = 'rgba(255,60,60,.26)';
	const letra: React.CSSProperties = {position: 'absolute', fontFamily: SANS, fontSize: 24, fontWeight: 700, color: '#fff', background: 'rgba(160,20,20,.85)', padding: '2px 10px'};
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: SEGURO.arriba, background: rojo}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: SEGURO.abajo, bottom: 0, background: rojo}} />
			<div style={{position: 'absolute', left: SEGURO.derecha, right: 0, top: SEGURO.botonesDesde, height: SEGURO.abajo - SEGURO.botonesDesde, background: rojo}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 240, height: 1440, border: '3px dashed rgba(255,255,255,.55)', boxSizing: 'border-box'}} />
			<span style={{...letra, left: 8, top: SEGURO.arriba - 34}}>interfaz de Instagram</span>
			<span style={{...letra, left: 8, top: SEGURO.abajo + 4}}>usuario, texto y audio</span>
			<span style={{...letra, right: 4, top: SEGURO.botonesDesde + 4, fontSize: 20}}>botones</span>
			<span style={{...letra, left: 8, top: 244, background: 'rgba(0,0,0,.6)'}}>portada en el perfil (3:4)</span>
		</AbsoluteFill>
	);
};

export const ReelPro: React.FC<PropsPro> = ({data, zonas}) => {
	const {fps} = useT();
	if (!data) return null;
	const cara = data.piezas.filter((p) => !(p.tipo in ESCENAS));
	const escenas = data.piezas.filter((p) => p.tipo in ESCENAS);
	const desconocidas = [...new Set(cara.filter((p) => !(p.tipo in CARA)).map((p) => p.tipo))];
	return (
		<AbsoluteFill style={{backgroundColor: C.bg}}>
			<AbsoluteFill style={{filter: data.imagen?.filtro}}>
				<BasePro src={data.video} zooms={data.zooms} anclaY={data.anclaY} marco={data.marco} abajo={data.imagen?.abajo} />
			</AbsoluteFill>
			<Velo vineta={data.imagen?.vineta ?? 0} />
			{cara.map((p, k) => pintar(p, k, data, CARA))}
			{escenas.map((p, k) => pintar(p, k + 1000, data, ESCENAS))}
			<Capitulo secciones={data.secciones} />
			<LogoMarca src={data.marca?.logo} desde={data.marca?.desde} />
			<SubtitulosPro paginas={data.paginas} />
			{data.sfx.map((s, k) => {
				const n = Math.max(1, Math.round((s.dur ?? 6) * fps));
				return (
					<Sequence key={k} from={Math.max(0, Math.round(s.en * fps))} durationInFrames={n}>
						<Audio src={staticFile(s.src)} volume={s.dur ? (f) => s.vol * Math.max(0, Math.min(1, (n - f) / 3)) : s.vol} />
					</Sequence>
				);
			})}
			{desconocidas.length ? (
				<div style={{position: 'absolute', left: 40, top: 500, padding: '14px 22px', background: '#b00020', color: '#fff', fontFamily: SANS, fontSize: 34, fontWeight: 800}}>
					Pieza desconocida: {desconocidas.join(', ')}
				</div>
			) : null}
			{zonas ? <Zonas /> : null}
		</AbsoluteFill>
	);
};
