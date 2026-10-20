import React from 'react';
import {interpolate, spring} from 'remotion';
import {C, SUBS_TOP, fontFamily} from '../tema';
import {Pagina} from '../tipos';
import {CLAMP, useT} from './comun';

// Subtítulos palabra a palabra: lo que aún no has dicho va atenuado, lo dicho en blanco,
// las palabras clave en azul DominIA y la palabra que suena da un pequeño salto.
export const Subtitulos: React.FC<{paginas: Pagina[]}> = ({paginas}) => {
	const {t, fps} = useT();
	const pag = paginas.find((p) => t >= p.i && t < p.f);
	if (!pag) return null;
	const lf = (t - pag.i) * fps;
	const e = spring({frame: lf, fps, config: {damping: 16, stiffness: 260, mass: 0.6}});
	return (
		<div
			style={{
				position: 'absolute',
				top: SUBS_TOP,
				left: 40,
				right: 40,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 2,
				fontFamily,
				transform: `translateY(${(1 - e) * 22}px) scale(${0.94 + 0.06 * e})`,
				opacity: Math.min(1, e * 1.6),
			}}
		>
			{pag.lineas.map((linea, li) => (
				<div key={li} style={{display: 'flex', gap: 20, justifyContent: 'center'}}>
					{linea.map((w, wi) => {
						const dicha = t >= w.i - 0.02;
						const activa = t >= w.i - 0.02 && t < w.f;
						const la = (t - w.i) * fps;
						const salto = activa ? interpolate(la, [0, 2.5, 7], [1, 1.09, 1.03], CLAMP) : 1;
						return (
							<span
								key={wi}
								style={{
									display: 'inline-block',
									fontSize: 80,
									fontWeight: 900,
									lineHeight: 1.08,
									letterSpacing: '-.01em',
									textTransform: 'uppercase',
									color: w.d ? C.blue : C.text,
									opacity: dicha ? 1 : 0.42,
									transform: `scale(${salto})`,
									textShadow: '0 6px 26px rgba(0,0,0,.6), 0 2px 5px rgba(0,0,0,.7)',
								}}
							>
								{w.t}
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};
