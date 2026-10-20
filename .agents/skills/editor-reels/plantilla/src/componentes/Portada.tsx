import React from 'react';
import {Img, interpolate, spring, staticFile} from 'remotion';
import {C, ZONA, acento, acento2, fontFamily} from '../tema';
import {CLAMP, useT} from './comun';

type Props = {
	i: number;
	f: number;
	titulo: string;
	antetitulo?: string;
	logo?: string;
	destacar?: string[];
	top?: number;
	estilo?: 'marcador' | 'caja' | 'texto';
	logos: Record<string, string>;
};

// Ancho aproximado de un texto en Inter 900 mayúscula, en em (para que el título quepa sin medirlo)
const anchoEm = (s: string) =>
	[...s].reduce((a, c) => a + (/[IÍ1 .,:;!¡'|]/.test(c) ? 0.32 : /[MWÑ]/.test(c) ? 0.95 : /[0-9]/.test(c) ? 0.66 : 0.74), 0);
const norm = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');

const SOMBRA = '0 10px 34px rgba(0,0,0,.72), 0 3px 8px rgba(0,0,0,.8)';

// Título de portada para los primeros segundos: una píldora clara con el logo y el protagonista, y debajo el
// titular en grande. Estilos: "marcador" (las palabras clave sobre un recuadro del color de acento), "caja" (todo
// el titular dentro del recuadro) o "texto" (palabras clave en el color de acento y subrayadas). Si empieza en el
// segundo 0 se ve entero desde el primer fotograma, para que sirva de portada del reel. Mientras dura no hay subtítulos.
export const Portada: React.FC<Props> = ({i, f, titulo, antetitulo, logo, destacar = [], top = ZONA.top, estilo = 'marcador', logos}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const lf = (t - i) * fps;
	const e = i < 0.05 ? 1 : spring({frame: lf, fps, config: {damping: 15, stiffness: 170}});
	const salida = interpolate(t, [f - 0.15, f], [1, 0], CLAMP);
	const raya = spring({frame: Math.max(0, (t - i - 0.25) * fps), fps, config: {damping: 16, stiffness: 140}});
	const lineas = titulo.toUpperCase().split('\n');
	// Lo que ocupa de más el recuadro (en em): los márgenes de la caja o de cada palabra marcada
	const extra = (l: string) =>
		estilo === 'caja' ? 0.6 : estilo === 'marcador' ? l.split(' ').filter((w) => destacar.some((d) => norm(d) === norm(w))).length * 0.4 : 0;
	const tam = Math.min(128, Math.floor(900 / Math.max(...lineas.map((l) => anchoEm(l) + extra(l)))));
	const fondoAcento = `linear-gradient(180deg, ${C.blue}, ${C.blue2})`;
	const marcadas = new Set(destacar.map(norm));
	const src = logo ? logos[logo] : undefined;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 16,
				fontFamily,
				opacity: Math.min(1, e * 1.4) * salida,
				transform: `translateY(${(1 - e) * 40}px) scale(${(0.94 + 0.06 * e) * (0.97 + 0.03 * salida)})`,
			}}
		>
			{antetitulo ? (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						height: 88,
						padding: src ? '0 34px 0 22px' : '0 34px',
						borderRadius: 44,
						background: C.text,
						boxShadow: '0 20px 50px -12px rgba(0,0,0,.65)',
					}}
				>
					{src ? <Img src={staticFile(src)} style={{width: 56, height: 56, objectFit: 'contain'}} /> : null}
					<span style={{fontSize: 50, fontWeight: 900, color: C.bg, letterSpacing: '.01em', textTransform: 'uppercase'}}>
						{antetitulo}
					</span>
				</div>
			) : null}
			<div
				style={
					estilo === 'caja'
						? {
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								padding: `${tam * 0.1}px ${tam * 0.3}px ${tam * 0.14}px`,
								borderRadius: tam * 0.24,
								background: fondoAcento,
								boxShadow: `0 26px 60px -22px ${acento2(0.85)}`,
							}
						: {display: 'flex', flexDirection: 'column', alignItems: 'center'}
				}
			>
				{lineas.map((linea, k) => (
					<div key={k} style={{display: 'flex', gap: tam * 0.26, justifyContent: 'center', alignItems: 'center'}}>
						{linea.split(' ').map((w, j) => {
							const clave = marcadas.has(norm(w));
							const marcador = clave && estilo === 'marcador';
							return (
								<span
									key={j}
									style={{
										position: 'relative',
										fontSize: tam,
										fontWeight: 900,
										lineHeight: 1.04,
										letterSpacing: '-.01em',
										color: clave && estilo === 'texto' ? C.blue : C.text,
										textShadow: estilo === 'caja' || marcador ? '0 2px 10px rgba(0,0,0,.25)' : SOMBRA,
										...(marcador
											? {
													padding: `${tam * 0.02}px ${tam * 0.2}px ${tam * 0.04}px`,
													borderRadius: tam * 0.18,
													background: fondoAcento,
													boxShadow: `0 20px 50px -18px ${acento2(0.9)}`,
												}
											: {}),
									}}
								>
									{w}
									{clave && estilo === 'texto' ? (
										<span
											style={{
												position: 'absolute',
												left: 0,
												right: 0,
												bottom: -tam * 0.06,
												height: Math.max(8, tam * 0.1),
												borderRadius: 6,
												background: C.blue,
												transform: `scaleX(${Math.max(0, raya)})`,
												boxShadow: `0 0 24px ${acento(0.55)}`,
											}}
										/>
									) : null}
								</span>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
};
