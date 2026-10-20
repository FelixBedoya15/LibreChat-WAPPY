import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';
import {C} from '../tema';
import {CLAMP, useT} from '../componentes/comun';
import {PaginaPro, Seccion} from './tipos';
import {HUD, SANS, SUBS, TXT, rampa, resorte, tituloFicha} from './sistema';

const ACENTO_ACTIVA = '#6aa3ff'; // el acento un punto más claro: se lee mejor sobre el vídeo

// Subtítulos: frases cortas siempre en el mismo sitio; la palabra que suena va en el color de acento y da un salto
// pequeño. Más pequeños que los gráficos: mandan las piezas, el subtítulo acompaña.
// Una página "grande" (primer plano sin pieza) sube lo justo para acabar por encima de la interfaz de Instagram.
export const SubtitulosPro: React.FC<{paginas: PaginaPro[]}> = ({paginas}) => {
	const {t, fps} = useT();
	const pag = paginas.find((p) => t >= p.i && t < p.f);
	if (!pag) return null;
	const tam = pag.tam ?? SUBS.tam;
	const alto = pag.lineas.length * tam * 1.1 + 2;
	const top = Math.min(SUBS.top, SUBS.fondo - alto);
	const e = resorte(t, pag.i, fps, {damping: 22, stiffness: 340, mass: 0.5});
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 40,
				right: 40,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 2,
				fontFamily: SANS,
				transform: `translateY(${(1 - e) * 14}px)`,
				opacity: Math.min(1, e * 2),
			}}
		>
			{pag.lineas.map((linea, li) => (
				<div key={li} style={{display: 'flex', gap: tam * 0.3, justifyContent: 'center'}}>
					{linea.map((w, wi) => {
						const activa = t >= w.i - 0.03 && t < w.f - 0.03;
						// salto pequeño y que vuelve a su sitio; en una palabra larga, menor, para que no se coma el hueco con la de al lado
						const fuerza = 0.05 * Math.min(1, 7 / Math.max(1, w.t.length));
						const salto = activa ? interpolate(t - w.i, [0, 0.085, 0.235], [1, 1 + fuerza, 1], CLAMP) : 1;
						return (
							<span
								key={wi}
								style={{
									display: 'inline-block',
									fontSize: tam,
									fontWeight: 900,
									lineHeight: 1.1,
									letterSpacing: '-.005em',
									textTransform: 'uppercase',
									color: activa || w.d ? ACENTO_ACTIVA : C.text,
									transform: `scale(${salto})`,
									WebkitTextStroke: `${Math.round(tam * 0.11)}px rgba(6,8,13,.5)`,
									paintOrder: 'stroke fill',
									textShadow: '0 5px 22px rgba(0,0,0,.7), 0 2px 4px rgba(0,0,0,.6)',
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

const CHIP: React.CSSProperties = {
	position: 'absolute',
	top: HUD.y - 2,
	height: 84,
	boxSizing: 'border-box',
	display: 'flex',
	alignItems: 'center',
	borderRadius: 22,
	background: 'rgba(9,13,20,.9)',
	border: `1.5px solid ${C.line2}`,
	boxShadow: '0 20px 50px -22px rgba(0,0,0,.85)',
};

// Capítulo arriba a la izquierda: "01 PROGRAMACIÓN". Dice en qué parte del vídeo estamos.
// Si un capítulo empieza donde acaba otro, la pastilla se queda y solo cambia lo de dentro (sin quedarse vacía).
export const Capitulo: React.FC<{secciones: Seccion[]}> = ({secciones}) => {
	const {t, fps} = useT();
	const sec = secciones.find((s) => t >= s.i && t < s.f);
	if (!sec) return null;
	const e = resorte(t, sec.i, fps, {damping: 19, stiffness: 200});
	const sal = 1 - rampa(t, sec.f - 0.18, sec.f);
	const sigue = secciones.some((s) => s !== sec && Math.abs(s.f - sec.i) < 0.05);
	const siguiente = secciones.some((s) => s !== sec && Math.abs(s.i - sec.f) < 0.05);
	const cont = sigue ? 1 : e;
	const dentro: React.CSSProperties = {transform: `translateY(${(1 - e) * 16}px)`, opacity: Math.min(1, (sigue ? 0.35 : 0) + e * 1.6)};
	return (
		<div style={{...CHIP, left: HUD.x, gap: 16, padding: '0 26px 0 20px', transform: `translateX(${(1 - cont) * -80}px)`, opacity: Math.min(1, cont * 1.5) * (siguiente ? 1 : sal)}}>
			<span style={{fontFamily: SANS, fontSize: 46, fontWeight: 900, letterSpacing: '-.03em', color: C.blue, ...dentro}}>{sec.num}</span>
			<span style={{width: 1.5, height: 40, background: C.line2}} />
			<span style={{...tituloFicha(TXT.min, {letterSpacing: '.14em'}), ...dentro}}>{sec.titulo}</span>
		</div>
	);
};

// El logo de la marca, siempre arriba a la derecha (como en las presentaciones DominIA)
export const LogoMarca: React.FC<{src?: string; desde?: number}> = ({src, desde = 0}) => {
	const {t, fps} = useT();
	if (!src || t < desde) return null;
	const e = desde < 0.05 ? 1 : resorte(t, desde, fps, {damping: 19, stiffness: 200});
	return (
		<div style={{...CHIP, right: HUD.x, padding: '0 18px', transform: `translateX(${(1 - e) * 80}px)`, opacity: Math.min(1, e * 1.5)}}>
			<Img src={staticFile(src)} style={{display: 'block', height: 56, objectFit: 'contain'}} />
		</div>
	);
};
