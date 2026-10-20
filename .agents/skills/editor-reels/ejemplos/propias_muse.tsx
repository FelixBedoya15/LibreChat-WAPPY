// EJEMPLO REAL: las piezas propias del reel de Muse (el agente de IA de Meta, 4/10/2026), con su guion en
// guion_pro_muse.json. Para usar alguna, copia su código (y lo que necesite de arriba) a editor/src/pro/propias.tsx
// de tu proyecto y apúntala en CARA, ESCENAS o CUERPOS. El mapa necesita mapa_puntos.json al lado de propias.tsx.
// Son un modelo de cómo se diseña una pieza para un tema, no un catálogo: no las repitas tal cual en otro reel.

import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, acento, acento2} from '../tema';
import {useT} from '../componentes/comun';
import {Cabecera, Chip, Ficha, IcoCuadro} from './base';
import {Candado, Ico} from './iconos';
import MAPA from './mapa_puntos.json';
import {D, ESCENA, ESTADO, SANS, TXT, W, ZONA, ajustar, clamp01, cuerpo, enciende, latido, mezcla, pulso, rampa, resorte, rotulo, sale, titular, tituloFicha, vida} from './sistema';

// Piezas propias de este proyecto. `reel.py preparar` crea este archivo una vez y no lo vuelve a tocar.
//
// Cuando una idea del guion no cabe en ninguna pieza del catálogo, se diseña aquí una pieza nueva con los bloques
// del sistema (./base: Ficha, Cabecera, IcoCuadro, Chip, Pastilla, Cerrojo, Pie, Placa, Escena, TituloEscena,
// Ventana; ./sistema: zonas, colores, resorte, enciende, rampa, titular, rotulo…) y se apunta abajo con el nombre
// que se usará como "tipo" en guion_pro.json. Guía y ejemplo en references/guion-pro.md de la skill.
// Si la pieza sirve para más reels, pásala a la plantilla de la skill (plantilla/src/pro/).
//
// Toda pieza recibe sus datos del guion más "logos" (clave → ruta del logo). Reglas: lo que aún no se ha dicho
// espera apagado y se enciende en su palabra; letra de 26 px o más; nada que haya que leer más allá de x≈940 por
// debajo de y≈1000; nada sobre la cara.
//
// Hechas para el reel de Muse (el agente de Meta), 4/10/2026:
//   contraste   (cara)    dos tarjetas: lo que NO es y lo que SÍ es; cada una se rellena cuando se dice
//   pasos       (cara)    tres pasos en fila y una barra de progreso que sigue avanzando sola
//   conexiones  (cuerpo)  el protagonista arriba y sus apps debajo: cada una se conecta con un cable al nombrarla
//   galeria     (cuerpo)  cuatro cosas que crea, cada una con su dibujo, que se hace al nombrarla
//   ranking     (cuerpo)  del lanzamiento al n.º 1: una línea de tiempo y una lista en la que sube al primer puesto
//   mapa        (cuerpo)  mapa de puntos en el que solo se enciende un país

type Logos = Record<string, string>;
type Zona = {y0: number; y1: number; desde: number; logos: Logos};
// Los cuerpos de escena se centran en el lienzo y no pasan de x = 978: a la derecha, por debajo de y≈1000, están
// los botones de Instagram
const IZQ = 102;
const ANCHO = W - 2 * IZQ; // 876

// Marca que se dibuja al acabar de decir algo: visto bueno (verde) o aspa (rojo)
const Marca: React.FC<{size: number; trazo: number; no?: boolean}> = ({size, trazo, no}) => {
	const col = no ? C.red : C.green;
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: '50%',
				border: `2.5px solid ${col}`,
				background: no ? 'rgba(242,109,109,.14)' : 'rgba(52,211,153,.14)',
				boxShadow: `0 0 30px -6px ${col}`,
				display: 'grid',
				placeItems: 'center',
				opacity: clamp01(trazo * 3),
				transform: `scale(${0.6 + 0.4 * clamp01(trazo * 2)})`,
			}}
		>
			<svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
				{no ? (
					<>
						<path d="M18 6 6 18" strokeDasharray={17} strokeDashoffset={17 * (1 - clamp01(trazo * 2))} />
						<path d="m6 6 12 12" strokeDasharray={17} strokeDashoffset={17 * (1 - clamp01(trazo * 2 - 1))} />
					</>
				) : (
					<path d="M20 6 9 17l-5-5" strokeDasharray={24} strokeDashoffset={24 * (1 - trazo)} />
				)}
			</svg>
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Contraste: "no es esto, es esto otro". Dos filas a todo lo ancho. La primera entra cuando se dice "no es", se
// rellena con lo que NO es (en rojo) y recibe su aspa; la segunda entra con lo que SÍ es (encendida, con su visto
// bueno) y entonces la primera se atenúa. Nada espera vacío: cada fila aparece cuando se empieza a decir.
type Lado = {chip: string; en: number; icono?: string; logo?: string; titulo: {texto: string; en: number}; sub: {texto: string; en: number}};
const Contraste: React.FC<{i: number; f: number; no: Lado; si: Lado; salida?: number; logos: Logos}> = ({i, f, no, si, salida = 0.18, logos}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const sal = salida > 0 ? 1 - rampa(t, f - salida, f) : 1;
	const HUECO = 16;
	const ALTO = 164;
	const llegaSi = enciende(t, si.titulo.en, fps);
	return (
		<>
			{[no, si].map((l, k) => {
				if (t < l.en - 0.06) return null;
				const esNo = k === 0;
				const entra = resorte(t, l.en - 0.06, fps);
				const tit = enciende(t, l.titulo.en, fps);
				const sub = enciende(t, l.sub.en, fps);
				const lleno = tit > 0.5;
				const est = ESTADO[esNo ? 'red' : 'green'];
				const trazo = sale(rampa(t, l.sub.en + 0.08, l.sub.en + 0.42));
				const atenua = esNo ? mezcla(1, 0.5, clamp01(llegaSi)) : 1; // al llegar la buena, la descartada se apaga
				const anchoTexto = ZONA.ancho - 156 - ZONA.padDer - 76;
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: ZONA.x,
							top: ZONA.top + k * (ALTO + HUECO),
							width: ZONA.ancho,
							height: ALTO,
							boxSizing: 'border-box',
							borderRadius: 28,
							background: esNo ? `linear-gradient(${est.fondo}, ${est.fondo}), ${D.tarjeta}` : lleno ? D.tarjetaSel : D.tarjeta,
							border: `1.5px solid ${esNo ? est.borde : lleno ? D.bordeSel : D.bordeVideo}`,
							boxShadow: lleno && !esNo ? `${D.sombraSel}, ${D.sombraVideo}` : D.sombraVideo,
							opacity: Math.min(1, entra * 1.5) * sal,
							transform: `translateY(${(1 - entra) * 40}px) scale(${latido(tit, 0.03)})`,
							overflow: 'hidden',
						}}
					>
						{/* el icono: un hueco hasta que se nombra */}
						<div style={{position: 'absolute', left: 26, top: 28, width: 108, height: 108, boxSizing: 'border-box', borderRadius: 26, border: `1.5px dashed ${esNo ? est.borde : D.bordeSel}`, opacity: 1 - clamp01(tit * 2)}} />
						<div style={{position: 'absolute', left: 26, top: 28, opacity: clamp01(tit * 1.6), transform: `scale(${0.6 + 0.4 * clamp01(tit)})`}}>
							{l.logo ? (
								<Img src={staticFile(logos[l.logo])} style={{width: 108, height: 108, objectFit: 'contain', filter: `drop-shadow(0 0 22px ${acento(0.55)})`}} />
							) : (
								<IcoCuadro size={108} icono={l.icono} estado={esNo ? 'red' : 'blue'} />
							)}
						</div>
						<span style={{position: 'absolute', left: 156, top: 22, ...rotulo(TXT.min, {letterSpacing: '.2em', color: esNo ? est.punto : C.green})}}>{l.chip}</span>
						<span style={{position: 'absolute', left: 156, top: 56, ...titular(ajustar(l.titulo.texto, anchoTexto, 52), {color: C.text}), opacity: clamp01(tit * 1.6), transform: `translateX(${(1 - clamp01(tit)) * -14}px)`}}>
							{l.titulo.texto}
						</span>
						<span
							style={{
								position: 'absolute',
								left: 156,
								top: 116,
								...cuerpo(Math.max(TXT.min, Math.min(31, Math.floor(anchoTexto / (l.sub.texto.length * 0.5)))), {color: esNo ? est.texto : '#cfe0ff', fontWeight: 700}),
								opacity: clamp01(sub * 1.6),
								transform: `translateY(${(1 - clamp01(sub)) * 10}px)`,
							}}
						>
							{l.sub.texto}
						</span>
						<div style={{position: 'absolute', right: ZONA.padDer, top: ALTO / 2 - 34}}>
							<Marca size={68} trazo={trazo} no={esNo} />
						</div>
						{/* la descartada se apaga con un velo: la tarjeta sigue opaca y no deja ver lo de detrás */}
						{atenua < 1 ? <div style={{position: 'absolute', inset: 0, background: `rgba(8,11,17,${(1 - atenua) * 1.1})`}} /> : null}
					</div>
				);
			})}
		</>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Pasos: tres pasos en fila que se encienden al decirlos y, debajo, una barra de progreso que arranca en "barra.en"
// y sigue avanzando sola hasta que la pieza se va (para "lo dejas trabajando y sigue solo"). El logo va en la
// cabeza de la barra. Sin porcentajes: no hay cifras que inventar.
const Pasos: React.FC<{
	i: number;
	f: number;
	titulo: string;
	icono?: string;
	logo?: string;
	pasos: {icono: string; texto: string; en: number; gira?: boolean}[];
	barra?: {en: number; logo?: string};
	chip?: {texto: string; en: number}; // pastilla verde en la cabecera, cuando se dice ("SOLO")
	salida?: number;
	logos: Logos;
}> = ({i, f, titulo, icono = 'rayo', logo, pasos, barra, chip, salida, logos}) => {
	const {t, fps} = useT();
	const ec = chip ? resorte(t, chip.en, fps, {damping: 12, stiffness: 220, mass: 0.7}) : 0;
	const HUECO = 30;
	const util = ZONA.ancho - ZONA.pad - ZONA.padDer;
	const ancho = (util - HUECO * (pasos.length - 1)) / pasos.length;
	const Y = 108;
	const ALTO_P = 198;
	const yBarra = Y + ALTO_P + 34;
	const avance = barra ? (t < barra.en ? 0 : 0.95 * (1 - Math.exp(-(t - barra.en) / 1.9))) : 0;
	return (
		<Ficha i={i} f={f} alto={barra ? yBarra + 22 + 34 : Y + ALTO_P + 28} salida={salida}>
			<Cabecera
				icono={logo ? undefined : icono}
				logo={logo ? logos[logo] : undefined}
				titulo={titulo}
				tam={ajustar(titulo, chip ? 420 : 640, 32)}
				derecha={
					chip ? (
						<span style={{display: 'inline-flex', marginRight: ZONA.padDer - 56, opacity: clamp01(ec * 1.6), transform: `scale(${0.6 + 0.4 * clamp01(ec)})`, transformOrigin: '100% 50%'}}>
							<Chip texto={chip.texto} estado="green" tam={TXT.rotulo} />
						</span>
					) : null
				}
			/>
			{pasos.map((p, k) => {
				const on = enciende(t, p.en, fps);
				const lit = on > 0.5;
				const x = ZONA.pad + k * (ancho + HUECO);
				return (
					<React.Fragment key={k}>
						<div
							style={{
								position: 'absolute',
								left: x,
								top: Y,
								width: ancho,
								height: ALTO_P,
								boxSizing: 'border-box',
								borderRadius: 22,
								background: lit ? D.tarjetaSel : D.hueco,
								border: `1.5px solid ${lit ? D.bordeSel : C.line2}`,
								boxShadow: lit ? `0 0 40px -14px ${acento(0.8)}` : 'none',
								transform: `scale(${latido(on, 0.04)})`,
							}}
						>
							<div style={{position: 'absolute', left: ancho / 2 - 44, top: 20}}>
								<IcoCuadro size={88} on={clamp01(on)} />
								<div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', transform: p.gira && lit ? `rotate(${(t - p.en) * 140}deg)` : undefined}}>
									<Ico nombre={p.icono} size={46} color={lit ? C.blue : '#7f8aa0'} grosor={2.1} />
								</div>
							</div>
							<span
								style={{
									position: 'absolute',
									left: 0,
									right: 0,
									top: 122,
									textAlign: 'center',
									...tituloFicha(TXT.rotulo, {letterSpacing: '.02em', lineHeight: 1.16, whiteSpace: 'pre-line', color: lit ? C.text : D.tituloOff}),
								}}
							>
								{p.texto}
							</span>
						</div>
						{k > 0 ? (
							<div style={{position: 'absolute', left: x - HUECO + (HUECO - 26) / 2, top: Y + ALTO_P / 2 - 13}}>
								<Ico nombre="flecha" size={26} color={lit ? C.blue : C.dim} grosor={2.6} />
							</div>
						) : null}
					</React.Fragment>
				);
			})}
			{barra ? (
				<>
					<div style={{position: 'absolute', left: ZONA.pad, top: yBarra, width: util, height: 22, boxSizing: 'border-box', borderRadius: 11, background: D.hueco, border: `1.5px solid ${C.line2}`, overflow: 'hidden'}}>
						<div
							style={{
								width: `${avance * 100}%`,
								height: '100%',
								borderRadius: 11,
								backgroundImage: `repeating-linear-gradient(115deg, rgba(255,255,255,.2) 0 14px, rgba(255,255,255,0) 14px 28px), linear-gradient(90deg, ${C.blue2}, ${C.blue})`,
								backgroundPosition: `${(t * 46) % 31}px 0, 0 0`,
								boxShadow: `0 0 26px ${acento(0.8)}`,
							}}
						/>
					</div>
					{barra.logo && avance > 0.005 ? (
						<Img
							src={staticFile(logos[barra.logo])}
							style={{position: 'absolute', left: ZONA.pad + util * avance - 25, top: yBarra - 14, width: 50, height: 50, objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.7))'}}
						/>
					) : null}
				</>
			) : null}
		</Ficha>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Conexiones: el protagonista arriba, en el centro, y debajo las apps a las que se conecta. Los huecos esperan
// vacíos; al nombrar cada app, su cable se enciende desde el protagonista, salta su logo y aparece su nombre.
// "mas" es una banda con lo que hay además ("Y MUCHAS MÁS"): logos pequeños que saltan y un hueco "+".
const Conexiones: React.FC<
	Zona & {
		centro: {logo: string};
		apps: {logo: string; nombre: string; en: number}[];
		mas?: {texto: string; en: number; items: {logo?: string; en: number}[]};
	}
> = ({y0, logos, desde, centro, apps, mas}) => {
	const {t, fps} = useT();
	const cx = W / 2;
	const NODO = 160;
	const yNodo = y0 + 6;
	const yBus = yNodo + NODO + 58;
	const yT = yBus + 48;
	const HUECO = 20;
	const n = apps.length;
	const anchoT = (ANCHO - HUECO * (n - 1)) / n;
	const ALTO_T = 250;
	const xs = apps.map((_, k) => IZQ + k * (anchoT + HUECO) + anchoT / 2);
	const yMas = yT + ALTO_T + 30;
	const entra = resorte(t, desde + 0.16, fps, {damping: 15, stiffness: 180});
	const tamNombre = Math.max(TXT.min, Math.min(...apps.map((a) => ajustar(a.nombre, anchoT - 30, TXT.rotulo))));
	const golpe = Math.max(0, ...apps.map((a) => pulso(t - a.en)), ...(mas ? [pulso(t - mas.en)] : []));
	const y1Cable = yNodo + NODO + 8;
	return (
		<>
			{/* cables: punteados y grises mientras esperan; al nombrar la app, se encienden desde el centro */}
			<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
				{apps.map((a, k) => {
					const x = xs[k];
					const d = `M ${cx} ${y1Cable} L ${cx} ${yBus} L ${x} ${yBus} L ${x} ${yT - 8}`;
					const p = sale(rampa(t, a.en - 0.02, a.en + 0.3));
					const largo = yBus - y1Cable + Math.abs(x - cx) + (yT - 8 - yBus);
					return (
						<React.Fragment key={k}>
							<path d={d} fill="none" stroke={C.line2} strokeWidth={3} strokeDasharray="2 11" strokeLinecap="round" strokeLinejoin="round" opacity={clamp01(entra * 1.5)} />
							{p > 0 ? (
								<path
									d={d}
									fill="none"
									stroke={C.blue}
									strokeWidth={4.5}
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeDasharray={`${largo * p} ${largo}`}
									style={{filter: `drop-shadow(0 0 8px ${acento(0.9)})`}}
								/>
							) : null}
						</React.Fragment>
					);
				})}
			</svg>
			{/* el protagonista */}
			<div style={{position: 'absolute', left: cx - NODO / 2, top: yNodo, width: NODO, height: NODO, opacity: clamp01(entra * 1.5), transform: `scale(${(0.7 + 0.3 * entra) * (1 + 0.06 * golpe)})`}}>
				<div style={{position: 'absolute', inset: -14, borderRadius: NODO * 0.3, border: `2px solid ${D.bordeSel}`, background: acento(0.08), boxShadow: `0 0 ${50 + 40 * golpe}px -10px ${acento(0.85)}`}} />
				<Img src={staticFile(logos[centro.logo])} style={{position: 'absolute', inset: 0, width: NODO, height: NODO, objectFit: 'contain'}} />
			</div>
			{/* las apps */}
			{apps.map((a, k) => {
				const base = resorte(t, desde + 0.26 + k * 0.07, fps, {damping: 18});
				const on = resorte(t, a.en - 0.04, fps, {damping: 11, stiffness: 220, mass: 0.7});
				const lit = on > 0.5;
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: xs[k] - anchoT / 2,
							top: yT,
							width: anchoT,
							height: ALTO_T,
							boxSizing: 'border-box',
							borderRadius: 26,
							background: lit ? D.tarjetaSel : 'transparent',
							border: `1.5px ${lit ? 'solid' : 'dashed'} ${lit ? D.bordeSel : C.line2}`,
							boxShadow: lit ? D.sombraSel : 'none',
							opacity: clamp01(base * 1.5),
							transform: `translateY(${(1 - base) * 22}px)`,
						}}
					>
						{!lit ? (
							<div style={{position: 'absolute', left: 0, right: 0, top: 84, display: 'grid', placeItems: 'center'}}>
								<Ico nombre="mas" size={44} color={C.line2} grosor={2.2} />
							</div>
						) : null}
						<Img src={staticFile(logos[a.logo])} style={{position: 'absolute', left: anchoT / 2 - 64, top: 32, width: 128, height: 128, objectFit: 'contain', opacity: clamp01(on * 1.8), transform: `scale(${0.5 + 0.5 * on})`}} />
						<span
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 188,
								textAlign: 'center',
								...tituloFicha(tamNombre, {letterSpacing: '.03em'}),
								opacity: clamp01(on * 1.6),
							}}
						>
							{a.nombre}
						</span>
					</div>
				);
			})}
			{/* y además */}
			{mas ? (
				(() => {
					const me = resorte(t, mas.en - 0.08, fps, {damping: 18, stiffness: 170});
					if (t < mas.en - 0.08) return null;
					return (
						<div
							style={{
								position: 'absolute',
								left: IZQ,
								top: yMas,
								width: ANCHO,
								height: 118,
								boxSizing: 'border-box',
								borderRadius: 26,
								background: D.tarjeta,
								border: `1.5px solid ${C.line2}`,
								display: 'flex',
								alignItems: 'center',
								padding: '0 44px 0 34px',
								opacity: clamp01(me * 1.5),
								transform: `translateY(${(1 - me) * 26}px)`,
							}}
						>
							<span style={rotulo(TXT.rotulo, {letterSpacing: '.16em', color: C.text})}>{mas.texto}</span>
							<span style={{marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center'}}>
								{mas.items.map((it, k) => {
									const on = resorte(t, it.en, fps, {damping: 11, stiffness: 220, mass: 0.7});
									return it.logo ? (
										<div key={k} style={{width: 72, height: 72, borderRadius: 18, background: D.pastilla, border: '1.5px solid rgba(243,245,249,.26)', display: 'grid', placeItems: 'center', opacity: clamp01(on * 1.8), transform: `scale(${0.5 + 0.5 * on})`}}>
											<Img src={staticFile(logos[it.logo])} style={{width: 44, height: 44, objectFit: 'contain'}} />
										</div>
									) : (
										<div key={k} style={{width: 72, height: 72, boxSizing: 'border-box', borderRadius: 18, border: `2px dashed ${D.bordeSel}`, background: acento(0.1), display: 'grid', placeItems: 'center', opacity: clamp01(on * 1.8), transform: `scale(${0.5 + 0.5 * on})`}}>
											<Ico nombre="mas" size={38} color={C.blue} grosor={2.6} />
										</div>
									);
								})}
							</span>
						</div>
					);
				})()
			) : null}
		</>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Galería: cuatro cosas que crea, en 2×2. Cada casilla espera con su nombre en gris y el contorno de su dibujo;
// al nombrarla se enciende y el dibujo "se hace": la app se monta por piezas, el documento se escribe, la imagen
// se revela de arriba abajo y el vídeo empieza a reproducirse.
const GRIS = '#39445a';
const Dibujo: React.FC<{tipo: string; dt: number; on: boolean}> = ({tipo, dt, on}) => {
	const ap = (a: number, b = a + 0.22) => (on ? sale(rampa(dt, a, b)) : 0);
	const borde = on ? C.blue3 : GRIS;
	const comun = {fill: 'none', stroke: borde, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
	if (tipo === 'app') {
		const piezas = [
			{x: 100, y: 22, w: 80, h: 13, r: 5, c: '#cfe0ff', a: 0.04},
			{x: 100, y: 45, w: 80, h: 52, r: 9, c: C.blue, a: 0.14},
			{x: 100, y: 106, w: 36, h: 34, r: 8, c: '#7fa8f5', a: 0.24},
			{x: 144, y: 106, w: 36, h: 34, r: 8, c: '#7fa8f5', a: 0.32},
			{x: 100, y: 150, w: 80, h: 24, r: 12, c: C.blue3, a: 0.42},
		];
		return (
			<svg width={280} height={200} viewBox="0 0 280 200">
				<rect x={84} y={4} width={112} height={192} rx={20} {...comun} fill={on ? '#0b1322' : 'none'} />
				{piezas.map((p, k) => {
					const e = ap(p.a);
					return <rect key={k} x={p.x} y={p.y + (1 - e) * 10} width={p.w} height={p.h} rx={p.r} fill={p.c} opacity={e} />;
				})}
			</svg>
		);
	}
	if (tipo === 'documento') {
		const lineas = [
			{y: 58, w: 96, a: 0.16},
			{y: 80, w: 96, a: 0.26},
			{y: 102, w: 74, a: 0.36},
			{y: 132, w: 96, a: 0.46},
			{y: 154, w: 56, a: 0.56},
		];
		return (
			<svg width={280} height={200} viewBox="0 0 280 200">
				<path d="M82 18a14 14 0 0 1 14-14h66l36 36v142a14 14 0 0 1-14 14H96a14 14 0 0 1-14-14Z" {...comun} fill={on ? '#0b1322' : 'none'} />
				<path d="M162 4v22a14 14 0 0 0 14 14h22" {...comun} />
				<rect x={100} y={26} width={48 * ap(0.04, 0.24)} height={14} rx={5} fill={C.blue} />
				{lineas.map((l, k) => (
					<rect key={k} x={100} y={l.y} width={l.w * ap(l.a, l.a + 0.26)} height={9} rx={4.5} fill="#b9cdf5" />
				))}
			</svg>
		);
	}
	if (tipo === 'imagen') {
		const rev = ap(0.04, 0.62);
		return (
			<svg width={280} height={200} viewBox="0 0 280 200">
				<defs>
					<linearGradient id="gal-cielo" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#16356f" />
						<stop offset="1" stopColor="#5e9afc" />
					</linearGradient>
					<clipPath id="gal-marco">
						<rect x={34} y={12} width={212} height={176 * rev} rx={16} />
					</clipPath>
				</defs>
				<g clipPath="url(#gal-marco)">
					<rect x={34} y={12} width={212} height={176} fill="url(#gal-cielo)" />
					<circle cx={196} cy={62} r={22} fill="#eaf2ff" />
					<path d="M34 188 L104 96 L150 150 L184 116 L246 188 Z" fill="#0f2350" />
					<path d="M34 188 L84 136 L132 188 Z" fill="#1c3c85" />
				</g>
				<rect x={34} y={12} width={212} height={176} rx={16} {...comun} />
				{on && rev > 0 && rev < 1 ? <rect x={34} y={12 + 176 * rev - 2} width={212} height={4} fill="#fff" opacity={0.85} /> : null}
			</svg>
		);
	}
	// vídeo
	const play = ap(0.04, 0.3);
	const prog = on ? clamp01(0.08 + dt / 3.2) : 0;
	return (
		<svg width={280} height={200} viewBox="0 0 280 200">
			<rect x={34} y={14} width={212} height={140} rx={16} {...comun} fill={on ? '#0b1322' : 'none'} />
			<circle cx={140} cy={84} r={36 * (0.6 + 0.4 * play)} fill={on ? C.blue : 'none'} stroke={on ? 'none' : GRIS} strokeWidth={4} opacity={on ? play : 1} />
			<path d="M130 66 L160 84 L130 102 Z" fill={on ? '#fff' : GRIS} opacity={on ? play : 1} />
			<rect x={34} y={174} width={212} height={10} rx={5} fill={on ? '#1a2538' : 'none'} stroke={on ? 'none' : GRIS} strokeWidth={3} />
			<rect x={34} y={174} width={212 * prog} height={10} rx={5} fill={C.blue3} />
			{on ? <circle cx={34 + 212 * prog} cy={179} r={9} fill="#fff" /> : null}
		</svg>
	);
};
const Galeria: React.FC<Zona & {items: {dibujo: string; nombre: string; en: number}[]}> = ({y0, y1, desde, items}) => {
	const {t, fps} = useT();
	const HUECO = 24;
	const ancho = (ANCHO - HUECO) / 2;
	const alto = Math.min(372, (y1 - y0 - HUECO) / 2);
	const top = y0 + Math.max(0, (y1 - y0 - (2 * alto + HUECO)) / 2);
	const tamNombre = Math.min(...items.map((it) => ajustar(it.nombre, ancho - 90, 46)));
	return (
		<>
			{items.map((it, k) => {
				const base = resorte(t, desde + 0.2 + k * 0.07, fps, {damping: 18});
				const on = enciende(t, it.en, fps);
				const lit = on > 0.5;
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: IZQ + (k % 2) * (ancho + HUECO),
							top: top + Math.floor(k / 2) * (alto + HUECO),
							width: ancho,
							height: alto,
							boxSizing: 'border-box',
							borderRadius: 30,
							background: lit ? D.tarjetaSel : D.tarjeta,
							border: `1.5px solid ${lit ? D.bordeSel : C.line2}`,
							boxShadow: lit ? D.sombraSel : 'none',
							opacity: clamp01(base * 1.5),
							transform: `translateY(${(1 - base) * 26}px) scale(${latido(on, 0.035)})`,
						}}
					>
						<div style={{position: 'absolute', left: ancho / 2 - 140, top: alto / 2 - 148}}>
							<Dibujo tipo={it.dibujo} dt={t - it.en} on={lit} />
						</div>
						<span style={{position: 'absolute', left: 0, right: 0, top: alto / 2 + 76, textAlign: 'center', ...titular(tamNombre, {color: lit ? C.text : D.tituloOff})}}>{it.nombre}</span>
					</div>
				);
			})}
		</>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Ranking: del lanzamiento al número 1. Arriba, una línea de tiempo entre dos fechas con los días que han pasado;
// debajo, una lista de tienda de apps (dibujada desde el principio, apagada) que se enciende en "lista.en" y en la
// que el protagonista entra desde abajo y se coloca el primero.
// Los otros puestos son huecos grises: no se nombra a nadie más porque la fuente no los da.
const Ranking: React.FC<
	Zona & {
		inicio: {fecha: string; nota?: string};
		fin: {fecha: string; en: number};
		dias: {texto: string; en: number};
		linea: {en: number; hasta: number};
		lista: {titulo: string; tiendas?: string[]; en: number; fila: {logo: string; nombre: string; sub?: string; en: number}};
		lugar?: {texto: string; en: number};
	}
> = ({y0, y1, desde, logos, inicio, fin, dias, linea, lista, lugar}) => {
	const {t, fps} = useT();
	const X1 = IZQ + 22;
	const X2 = IZQ + ANCHO - 22;
	const yL = y0 + 30 + Math.max(0, (y1 - y0 - 610) / 2);
	const e0 = resorte(t, desde + 0.28, fps, {damping: 16});
	const pl = sale(rampa(t, linea.en, linea.hasta));
	const ed = resorte(t, dias.en, fps, {damping: 12, stiffness: 220, mass: 0.7});
	const ef = resorte(t, fin.en, fps, {damping: 13, stiffness: 210});
	// la lista
	const yC = yL + 166;
	const FILA = 100;
	const ALTO_C = 92 + 3 * FILA + 12;
	const ec = resorte(t, desde + 0.42, fps, {damping: 18, stiffness: 160}); // la lista se ve desde el principio, apagada
	const luz = enciende(t, lista.en, fps); // y se enciende cuando se empieza a hablar de ella
	const sube = resorte(t, lista.fila.en, fps, {damping: 15, stiffness: 150, mass: 0.8});
	const primero = clamp01(sube);
	const arriba = sube > 0.93;
	const el = lugar ? resorte(t, lugar.en, fps, {damping: 13, stiffness: 210}) : 0;
	return (
		<>
			{/* línea de tiempo */}
			<div style={{position: 'absolute', left: X1, top: yL - 2, width: X2 - X1, height: 4, borderRadius: 2, background: C.line2, opacity: clamp01(e0 * 1.5)}} />
			<div style={{position: 'absolute', left: X1, top: yL - 3, width: (X2 - X1) * pl, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${C.blue2}, ${C.blue})`, boxShadow: `0 0 18px ${acento(0.9)}`}} />
			<div style={{position: 'absolute', left: X1 - 16, top: yL - 16, width: 32, height: 32, borderRadius: '50%', background: C.blue, boxShadow: `0 0 22px ${acento(0.9)}`, opacity: clamp01(e0 * 1.5), transform: `scale(${e0})`}} />
			<div style={{position: 'absolute', left: IZQ, top: yL + 30, opacity: clamp01(e0 * 1.5)}}>
				<span style={{...titular(58, {color: C.text}), display: 'block'}}>{inicio.fecha}</span>
				{inicio.nota ? <span style={{...cuerpo(TXT.rotulo), display: 'block', marginTop: 8}}>{inicio.nota}</span> : null}
			</div>
			<div style={{position: 'absolute', left: X2 - 16, top: yL - 16, width: 32, height: 32, boxSizing: 'border-box', borderRadius: '50%', background: ef > 0.5 ? C.blue : C.bg, border: `3px solid ${ef > 0.5 ? C.blue : C.line2}`, boxShadow: ef > 0.5 ? `0 0 22px ${acento(0.9)}` : 'none', opacity: clamp01(e0 * 1.5), transform: `scale(${latido(ef, 0.3)})`}} />
			<div style={{position: 'absolute', right: W - (IZQ + ANCHO), top: yL + 30, textAlign: 'right', opacity: clamp01(ef * 1.6), transform: `translateY(${(1 - ef) * 14}px)`}}>
				<span style={{...titular(58, {color: C.text}), display: 'block'}}>{fin.fecha}</span>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: yL - 36, display: 'flex', justifyContent: 'center', opacity: clamp01(ed * 1.6), transform: `scale(${0.6 + 0.4 * clamp01(ed)})`}}>
				<Chip texto={dias.texto} tam={38} icono="reloj" />
			</div>
			{/* lista de la tienda */}
			{t >= desde + 0.42 ? (
				<div
					style={{
						position: 'absolute',
						left: IZQ,
						top: yC,
						width: ANCHO,
						height: ALTO_C,
						boxSizing: 'border-box',
						borderRadius: 30,
						background: D.tarjeta,
						border: `1.5px solid ${arriba ? D.bordeSel : C.line2}`,
						boxShadow: arriba ? D.sombraSel : 'none',
						overflow: 'hidden',
						opacity: clamp01(ec * 1.5) * mezcla(0.5, 1, clamp01(luz)),
						transform: `translateY(${(1 - ec) * 36}px) scale(${latido(luz, 0.02)})`,
					}}
				>
					<span style={{position: 'absolute', left: 34, top: 30, ...tituloFicha(30)}}>{lista.titulo}</span>
					{lugar ? (
						<span style={{position: 'absolute', left: 34 + lista.titulo.length * 25.5 + 22, top: 17, opacity: clamp01(el * 1.6), transform: `scale(${0.6 + 0.4 * clamp01(el)})`, transformOrigin: '0 50%'}}>
							<Chip texto={lugar.texto} tam={TXT.rotulo} icono="pin" />
						</span>
					) : null}
					<span style={{position: 'absolute', right: 40, top: 20, display: 'flex', gap: 14}}>
						{(lista.tiendas ?? []).map((l) => (
							<Img key={l} src={staticFile(logos[l])} style={{width: 52, height: 52, objectFit: 'contain', opacity: clamp01(luz * 1.6), transform: `scale(${0.5 + 0.5 * clamp01(luz)})`}} />
						))}
					</span>
					<div style={{position: 'absolute', left: 34, right: 34, top: 86, height: 1.5, background: C.line}} />
					{/* puestos */}
					{[0, 1, 2].map((k) => (
						<span key={k} style={{position: 'absolute', left: 34, width: 60, top: 92 + k * FILA + 24, textAlign: 'center', ...titular(52, {color: k === 0 && arriba ? C.blue3 : C.dim, textShadow: k === 0 && arriba ? `0 0 26px ${acento(0.9)}` : 'none'})}}>
							{k + 1}
						</span>
					))}
					{/* los demás: huecos grises que bajan un puesto cuando llega el protagonista */}
					{[0, 1, 2].map((k) => (
						<div key={k} style={{position: 'absolute', left: 118, right: 40, top: 92 + (k + primero) * FILA + 13, height: 74, display: 'flex', alignItems: 'center', gap: 22, opacity: 0.9}}>
							<div style={{width: 74, height: 74, borderRadius: 18, background: '#1a2231'}} />
							<div>
								<div style={{width: [230, 190, 250][k], height: 18, borderRadius: 9, background: '#1e2737'}} />
								<div style={{width: [130, 150, 110][k], height: 13, borderRadius: 7, background: '#182030', marginTop: 12}} />
							</div>
						</div>
					))}
					{/* el protagonista entra desde abajo y sube al primer puesto */}
					<div
						style={{
							position: 'absolute',
							left: 106,
							right: 28,
							top: 92 + (1 - sube) * 3 * FILA + 5,
							height: 90,
							boxSizing: 'border-box',
							borderRadius: 22,
							background: D.tarjetaSel,
							border: `1.5px solid ${D.bordeSel}`,
							boxShadow: `0 0 50px -12px ${acento(0.85)}`,
							display: 'flex',
							alignItems: 'center',
							gap: 20,
							padding: '0 26px 0 12px',
							opacity: clamp01(sube * 3),
						}}
					>
						<Img src={staticFile(logos[lista.fila.logo])} style={{width: 68, height: 68, objectFit: 'contain'}} />
						<div>
							<span style={{display: 'block', fontFamily: SANS, fontSize: 42, fontWeight: 800, color: C.text, lineHeight: 1}}>{lista.fila.nombre}</span>
							{lista.fila.sub ? <span style={{...cuerpo(TXT.min), display: 'block', marginTop: 6}}>{lista.fila.sub}</span> : null}
						</div>
						<span style={{marginLeft: 'auto', opacity: arriba ? 1 : 0}}>
							<Ico nombre="sube" size={46} color={C.green} grosor={2.6} />
						</span>
					</div>
				</div>
			) : null}
		</>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Mapa: un mapa de puntos (de América a Europa) en el que solo se enciende Estados Unidos. Primero el mundo en gris;
// en "caja.en" se enciende el país con una onda, cae el alfiler y aparece la caja roja con el candado.
const PUNTOS = MAPA.puntos as number[][];
const Mapa: React.FC<
	Zona & {
		ahora?: {texto: string; en: number};
		caja: {texto: string; en: number};
		cierraEn?: number;
		alfiler?: {logo: string; en: number};
		golpe?: number; // un pulso del país y del alfiler ("allí")
	}
> = ({y0, desde, logos, ahora, caja, cierraEn, alfiler, golpe}) => {
	const {t, fps} = useT();
	const pg = golpe !== undefined ? Math.sin(Math.PI * clamp01((t - golpe) / 0.4)) : 0; // sube y baja suave
	const s = ANCHO / (MAPA.x1 - MAPA.x0);
	const yM = y0 + 76;
	const X = (x: number) => IZQ + (x - MAPA.x0) * s;
	const Y = (y: number) => yM + (y - MAPA.y0) * s;
	const altoM = (MAPA.y1 - MAPA.y0) * s;
	const entra = sale(rampa(t, desde + 0.12, desde + 0.7));
	const [ux, uy] = MAPA.usa;
	const dt = t - caja.en;
	const cj = resorte(t, caja.en, fps, {damping: 12, stiffness: 220, mass: 0.7});
	const cuando = cierraEn ?? caja.en + 0.2;
	const cierre = enciende(t, cuando, fps);
	const ea = ahora ? resorte(t, ahora.en, fps, {damping: 13, stiffness: 210}) : 0;
	const ep = alfiler ? resorte(t, alfiler.en, fps, {damping: 11, stiffness: 170, mass: 0.8}) : 0;
	const tam = Math.min(74, Math.floor(600 / (9.1 + 1.1)));
	const rojo = ESTADO.red;
	return (
		<>
			<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: entra}}>
				{PUNTOS.map(([x, y, usa], k) => {
					if (!usa) return <circle key={k} cx={X(x)} cy={Y(y)} r={3.7} fill="#44546f" opacity={mezcla(1, 0.6, clamp01(dt * 2.5))} />;
					const dist = Math.hypot(x - ux, y - uy);
					const on = clamp01((dt - dist * 0.0016) / 0.22);
					return <circle key={k} cx={X(x)} cy={Y(y)} r={3.7 + 1.3 * on + 0.5 * pg} fill={on > 0.5 ? C.blue : '#44546f'} style={on > 0.5 ? {filter: `drop-shadow(0 0 6px ${acento(0.95)})`} : undefined} />;
				})}
			</svg>
			{ahora ? (
				<div style={{position: 'absolute', left: IZQ, top: y0 + 6, opacity: clamp01(ea * 1.6), transform: `scale(${0.6 + 0.4 * clamp01(ea)})`, transformOrigin: '0 50%'}}>
					<Chip texto={ahora.texto} estado="amber" tam={30} icono="reloj" />
				</div>
			) : null}
			{alfiler && t >= alfiler.en ? (
				<div style={{position: 'absolute', left: X(ux) - 46, top: Y(uy) - 118 - (1 - ep) * 150, width: 92, height: 118, opacity: clamp01(ep * 2.5), transform: `scale(${1 + 0.07 * pg})`, transformOrigin: '50% 100%'}}>
					<svg width={92} height={118} viewBox="0 0 92 118" style={{position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(0 14px 20px rgba(0,0,0,.6))'}}>
						<path d="M46 116 C46 116 6 70 6 44 A40 40 0 0 1 86 44 C86 70 46 116 46 116 Z" fill="#fff" stroke={C.blue} strokeWidth={4} />
					</svg>
					<Img src={staticFile(logos[alfiler.logo])} style={{position: 'absolute', left: 17, top: 15, width: 58, height: 58, objectFit: 'contain'}} />
				</div>
			) : null}
			<div style={{position: 'absolute', left: 0, right: 0, top: yM + altoM + 30, display: 'flex', justifyContent: 'center'}}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: tam * 0.2,
						padding: `${tam * 0.12}px ${tam * 0.36}px ${tam * 0.16}px ${tam * 0.28}px`,
						borderRadius: tam * 0.26,
						background: `linear-gradient(180deg, ${rojo.punto}, #d14f4f)`,
						boxShadow: `0 26px 70px -20px ${rojo.borde}, 0 0 ${t >= cuando ? 60 * Math.max(0, 1 - (t - cuando) / 0.6) : 0}px ${rojo.borde}`,
						opacity: clamp01(cj * 1.6),
						transform: `scale(${(0.82 + 0.18 * clamp01(cj)) * latido(cierre, 0.06)})`,
					}}
				>
					<Candado size={tam * 0.8} color="#fff" p={clamp01(cierre)} grosor={2.4} />
					<span style={titular(tam, {color: '#fff', lineHeight: 1.04, letterSpacing: '-.015em', textShadow: '0 2px 10px rgba(0,0,0,.22)'})}>{caja.texto}</span>
				</div>
			</div>
		</>
	);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// Sobre el pecho, en el plano de cara (ZONA: x 80–1000, y 916–1376)
export const CARA: Record<string, React.FC<any>> = {contraste: Contraste, pasos: Pasos};
// A pantalla completa (envuelve tu contenido en <Escena i={i} f={f}>)
export const ESCENAS: Record<string, React.FC<any>> = {};
// Cuerpos para la pieza "escena" (reciben y0, y1, desde y logos además de sus datos)
export const CUERPOS: Record<string, React.FC<any>> = {conexiones: Conexiones, galeria: Galeria, ranking: Ranking, mapa: Mapa};
