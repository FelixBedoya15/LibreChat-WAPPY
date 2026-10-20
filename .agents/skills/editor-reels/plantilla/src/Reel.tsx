import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {C} from './tema';
import {EDL, Elemento, PropsReel} from './tipos';
import {useT} from './componentes/comun';
import {BaseVideo, Degradados} from './componentes/BaseVideo';
import {Subtitulos} from './componentes/Subtitulos';
import {EtiquetaCapitulo} from './componentes/EtiquetaCapitulo';
import {LogoPop} from './componentes/LogoPop';
import {Ecosistema} from './componentes/Ecosistema';
import {Destacado} from './componentes/Destacado';
import {Lista} from './componentes/Lista';
import {Chips} from './componentes/Chips';
import {Convergencia} from './componentes/Convergencia';
import {Mockup} from './componentes/Mockup';
import {Pipeline} from './componentes/Pipeline';
import {CTA} from './componentes/CTA';
import {Pantalla} from './componentes/Pantalla';
import {Portada} from './componentes/Portada';
import {LineaTiempo} from './componentes/LineaTiempo';
import {Sincronia} from './componentes/Sincronia';
import {Visor} from './componentes/Visor';
import {LogosFila} from './componentes/LogosFila';

const pintar = (el: Elemento, k: number, data: EDL) => {
	const logos = data.logos;
	switch (el.tipo) {
		case 'logo':
			return <LogoPop key={k} {...el} logos={logos} />;
		case 'ecosistema':
			return <Ecosistema key={k} {...el} todos={logos} />;
		case 'destacado':
			return <Destacado key={k} {...el} />;
		case 'lista':
			return <Lista key={k} {...el} />;
		case 'chips':
			return <Chips key={k} {...el} />;
		case 'convergencia':
			return <Convergencia key={k} {...el} />;
		case 'mockup':
			return <Mockup key={k} {...el} />;
		case 'pipeline':
			return <Pipeline key={k} {...el} logos={logos} />;
		case 'cta':
			return <CTA key={k} {...el} />;
		case 'pantalla':
			return <Pantalla key={k} {...el} fuente={data.pantalla} base={data.video} caraBase={data.caraBase} />;
		case 'portada':
			return <Portada key={k} {...el} logos={logos} />;
		case 'tiempo':
			return <LineaTiempo key={k} {...el} />;
		case 'sincronia':
			return <Sincronia key={k} {...el} />;
		case 'visor':
			return <Visor key={k} {...el} />;
		case 'logos':
			return <LogosFila key={k} {...el} logos={logos} />;
		default:
			return null;
	}
};

export const Reel: React.FC<PropsReel> = ({data}) => {
	const {fps} = useT();
	if (!data) return null;

	return (
		<AbsoluteFill style={{backgroundColor: C.bg}}>
			<BaseVideo src={data.video} zooms={data.zooms} anclaY={data.anclaY} marco={data.marco} />
			<Degradados />
			{data.elementos.map((el, k) => pintar(el, k, data))}
			<EtiquetaCapitulo caps={data.capitulos} logos={data.logos} />
			<Subtitulos paginas={data.paginas} />
			{data.musica ? (
				<Audio
					src={staticFile(data.musica.src)}
					loop
					volume={(f) => {
						const t = f / fps;
						return data.musica!.vol * Math.min(1, t / 0.6) * Math.min(1, Math.max(0, (data.duracion - t) / 1.2));
					}}
				/>
			) : null}
			{data.sfx.map((s, k) => (
				<Sequence key={k} from={Math.max(0, Math.round(s.en * fps))} durationInFrames={Math.round(3 * fps)}>
					<Audio src={staticFile(s.src)} volume={s.vol} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
