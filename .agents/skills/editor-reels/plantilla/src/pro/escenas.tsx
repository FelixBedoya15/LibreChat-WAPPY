import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, acento} from '../tema';
import {useT} from '../componentes/comun';
import {Captura, Cerrojo, Escena, IcoCuadro, Pastilla, Pie, TituloEscena, Trozo, Ventana, altoTitulo} from './base';
import {
	D,
	ESCENA,
	ESTADO,
	HUD,
	SANS,
	TXT,
	W,
	clamp01,
	cuerpo,
	enciende,
	entraSale,
	latido,
	mezcla,
	rampa,
	resorte,
	sale,
	titular,
	tituloFicha,
} from './sistema';

// Escenas a pantalla completa, con el estilo de las presentaciones DominIA: la voz sigue y la imagen explica.
// Hay dos:
//   "revelado"  la página real de la fuente en una ventana de navegador + el nombre, palabra a palabra;
//   "escena"    un titular (la pregunta que se hace el espectador: "¿CUÁNTO CUESTA?") y, debajo, uno o varios
//               "cuerpos" que se relevan mientras el titular se queda: monedas, flujo, filas, ventana.
// El cuerpo enseña el mecanismo, no un resumen de lo que ya dice la voz.

type Logos = Record<string, string>;

// ---------------------------------------------------------------------------------------------------------------
// Revelado de una noticia: la página real de la fuente dentro de una ventana de navegador (la barra de direcciones
// dice de dónde sale) con un desplazamiento suave, y debajo el nombre, que entra palabra a palabra con la voz.
export const EscenaRevelado: React.FC<{
	i: number;
	f: number;
	etiqueta?: string;
	logoEtiqueta?: string;
	captura: Captura;
	logo?: string;
	linea1: {t: string; en: number}[];
	linea2?: {t: string; en: number};
	logos: Logos;
}> = ({i, f, etiqueta, logoEtiqueta, captura, logo, linea1, linea2, logos}) => {
	const {t, fps} = useT();
	const V = {x: 70, y: 352, w: 940, h: 572};
	const ce = resorte(t, i + 0.02, fps, {damping: 18, stiffness: 150});
	const sc = captura.scrollEn !== undefined ? entraSale(rampa(t, captura.scrollEn, captura.scrollEn + (captura.scrollDur ?? 1.5))) : 0;
	const empuje = 1 + 0.03 * rampa(t, i, f);
	// la ventana empieza más abajo, centrada, y sube para dejar sitio al nombre
	const nombreEn = linea1.length ? linea1[0].en : (linea2?.en ?? f);
	const baja = 150 * (1 - entraSale(rampa(t, nombreEn - 0.45, nombreEn + 0.05)));
	const et = resorte(t, i + 0.12, fps, {damping: 19, stiffness: 200});
	const le = resorte(t, nombreEn, fps, {damping: 11, stiffness: 190});
	const a2 = linea2 ? resorte(t, linea2.en, fps, {damping: 12, stiffness: 170, mass: 0.8}) : 0;
	const barrido = linea2 ? rampa(t, linea2.en + 0.05, linea2.en + 0.75) : 0;
	const ancho1 = linea1.reduce((a, w) => a + w.t.length * 0.72 + 0.25, 0) + (logo ? 1.2 : 0);
	// El nombre no pasa de x≈940: por debajo de y≈1000 están los botones de Instagram
	const tam1 = Math.min(142, Math.floor(860 / Math.max(1, ancho1)));
	const tam2 = linea2 ? Math.min(228, Math.floor(800 / (linea2.t.length * 0.74))) : 0;
	return (
		<Escena i={i} f={f}>
			{/* de quién es la noticia, en el sitio del capítulo */}
			{etiqueta ? (
				<div
					style={{
						position: 'absolute',
						left: HUD.x,
						top: HUD.y - 2,
						height: 84,
						boxSizing: 'border-box',
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						padding: '0 28px 0 20px',
						borderRadius: 22,
						background: 'rgba(9,13,20,.9)',
						border: `1.5px solid ${C.line2}`,
						opacity: clamp01(et * 1.5),
						transform: `translateX(${(1 - et) * -60}px)`,
					}}
				>
					{logoEtiqueta ? <Img src={staticFile(logos[logoEtiqueta])} style={{width: 44, height: 44, objectFit: 'contain'}} /> : null}
					<span style={tituloFicha(TXT.min, {letterSpacing: '.16em'})}>{etiqueta}</span>
				</div>
			) : null}
			<Ventana x={V.x} y={V.y + baja} w={V.w} h={V.h} captura={captura} entra={ce} scroll={sc} escala={empuje} />
			{/* el nombre */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 958, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: SANS}}>
				<div style={{display: 'flex', alignItems: 'center', gap: tam1 * 0.2, height: tam1 * 1.1}}>
					{logo ? (
						<Img
							src={staticFile(logos[logo])}
							style={{
								width: tam1 * 0.96,
								height: tam1 * 0.96,
								objectFit: 'contain',
								opacity: clamp01(le * 1.6),
								transform: `scale(${0.3 + 0.7 * le})`,
								filter: `drop-shadow(0 0 ${30 * le}px ${acento(0.7)})`,
							}}
						/>
					) : null}
					{linea1.map((w, k) => {
						const e = resorte(t, w.en, fps, {damping: 13, stiffness: 210});
						return (
							<span key={k} style={{...titular(tam1, {color: C.text}), display: 'inline-block', opacity: clamp01(e * 1.6), transform: `translateY(${(1 - e) * 54}px)`}}>
								{w.t}
							</span>
						);
					})}
				</div>
				{linea2 ? (
					<span
						style={{
							...titular(tam2, {letterSpacing: '-.03em', lineHeight: 0.98}),
							display: 'inline-block',
							backgroundImage: `linear-gradient(105deg, transparent 42%, rgba(255,255,255,.95) 50%, transparent 58%), linear-gradient(90deg, ${C.blue}, ${C.blue3})`,
							backgroundSize: '300% 100%, 100% 100%',
							backgroundPosition: `${mezcla(130, -30, barrido)}% 0, 0 0`,
							backgroundRepeat: 'no-repeat',
							WebkitBackgroundClip: 'text',
							backgroundClip: 'text',
							color: 'transparent',
							opacity: clamp01(a2 * 1.8),
							transform: `scale(${mezcla(1.22, 1, clamp01(a2))})`,
							filter: `drop-shadow(0 0 ${46 * clamp01(a2)}px ${acento(0.55)})`,
						}}
					>
						{linea2.t}
					</span>
				) : null}
			</div>
		</Escena>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Cuerpos de una "escena". Cada uno recibe la franja que puede ocupar (y0–y1) y "desde" (cuándo entra).
type Zona = {y0: number; y1: number; desde: number; logos: Logos};

// Monedas: una proporción que se ve contando ("5 veces más barato": cinco monedas frente a una). Cada pila tiene
// su logo y su nombre, que esperan apagados, y las monedas caen cuando se dice.
const RX = 124;
const RY = 34;
const GROSOR = 40;
const Pila: React.FC<{cx: number; base: number; n: number; en: number; paso: number; propio?: boolean}> = ({cx, base, n, en, paso, propio}) => {
	const {t, fps} = useT();
	const id = propio ? 'azul' : 'plata';
	return (
		<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
			<defs>
				<linearGradient id={`cara-${id}`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor={propio ? '#d6e5ff' : '#eef2f8'} />
					<stop offset="1" stopColor={propio ? '#6ea3ff' : '#aab4c8'} />
				</linearGradient>
				<linearGradient id={`canto-${id}`} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor={propio ? '#2f6fe8' : '#6b778c'} />
					<stop offset="0.5" stopColor={propio ? '#5e9afc' : '#97a2b6'} />
					<stop offset="1" stopColor={propio ? '#1f52b8' : '#4a5568'} />
				</linearGradient>
			</defs>
			{Array.from({length: n}).map((_, k) => {
				const t0 = en + k * paso;
				if (t < t0) return null;
				const cae = resorte(t, t0, fps, {damping: 15, stiffness: 230, mass: 0.6});
				const cy = base - RY - GROSOR - k * GROSOR - (1 - cae) * 190;
				return (
					<g key={k} opacity={clamp01(cae * 2.2)} style={propio ? {filter: `drop-shadow(0 0 26px ${acento(0.75)})`} : undefined}>
						<ellipse cx={cx} cy={cy + GROSOR} rx={RX} ry={RY} fill={`url(#canto-${id})`} stroke="rgba(6,8,13,.5)" strokeWidth={3} />
						<rect x={cx - RX} y={cy} width={RX * 2} height={GROSOR} fill={`url(#canto-${id})`} />
						<ellipse cx={cx} cy={cy} rx={RX} ry={RY} fill={`url(#cara-${id})`} />
						<ellipse cx={cx} cy={cy} rx={RX * 0.78} ry={RY * 0.78} fill="none" stroke={propio ? '#2f6fe8' : '#7c879b'} strokeWidth={3} opacity={0.75} />
						<text
							x={cx}
							y={cy}
							textAnchor="middle"
							dominantBaseline="central"
							transform={`translate(0 ${cy * (1 - 0.3)}) scale(1 0.3)`}
							style={{fontFamily: SANS, fontSize: 118, fontWeight: 900, fill: propio ? '#1f52b8' : '#5b677b'}}
						>
							$
						</text>
					</g>
				);
			})}
		</svg>
	);
};
const Monedas: React.FC<Zona & {pilas: {logo?: string; nombre: string; n: number; en: number; propio?: boolean}[]; paso?: number}> = ({y0, y1, logos, pilas, paso = 0.11}) => {
	const {t, fps} = useT();
	const maxN = Math.max(...pilas.map((p) => p.n));
	const altoPila = 2 * RY + maxN * GROSOR;
	const bloque = altoPila + 24 + 88 + 14 + 64;
	const base = y0 + Math.max(0, (y1 - y0 - bloque) / 2) + altoPila;
	const sep = pilas.length <= 2 ? 360 : 290;
	const x0 = W / 2 - (sep * (pilas.length - 1)) / 2;
	return (
		<>
			{pilas.map((p, k) => {
				const cx = x0 + k * sep;
				const on = resorte(t, p.en, fps, {damping: 16});
				const lit = on > 0.5;
				return (
					<React.Fragment key={k}>
						<Pila cx={cx} base={base} n={p.n} en={p.en} paso={paso} propio={p.propio} />
						<div style={{position: 'absolute', left: cx - 150, width: 300, top: base + 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
							<IcoCuadro size={88} logo={p.logo ? logos[p.logo] : undefined} on={clamp01(on)} style={p.propio || !lit ? undefined : {background: D.pastilla, borderColor: 'rgba(243,245,249,.28)'}} />
							<span style={tituloFicha(TXT.rotulo, {letterSpacing: '.05em', lineHeight: 1.14, whiteSpace: 'pre-line', textAlign: 'center', color: !lit ? D.tituloOff : p.propio ? C.text : '#c3cad6', opacity: lit ? 1 : 0.6})}>
								{p.nombre}
							</span>
						</div>
					</React.Fragment>
				);
			})}
		</>
	);
};

// Flujo: lo que entra → el protagonista → lo que sale, cada cosa con su cifra. Explica un mecanismo (qué es
// "entrada" y qué es "salida") en vez de repetir el dato.
const Valor: React.FC<{valor: string; tam: number; color: string; simbolo?: string}> = ({valor, tam, color, simbolo}) => (
	<span style={{display: 'inline-flex', alignItems: 'flex-start', fontFamily: SANS}}>
		{simbolo ? <span style={titular(tam * 0.5, {color: C.blue, marginTop: tam * 0.1, marginRight: tam * 0.03})}>{simbolo}</span> : null}
		<span style={titular(tam, {color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.04em'})}>{valor}</span>
	</span>
);
const Flecha: React.FC<{x: number; ya: number; yb: number; p: number}> = ({x, ya, yb, p}) => {
	const {t} = useT();
	if (p <= 0) return null;
	const y = mezcla(ya, yb - 10, p);
	return (
		<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
			<line x1={x} y1={ya} x2={x} y2={y} stroke={C.blue} strokeWidth={4} strokeDasharray="7 9" strokeDashoffset={-t * 27} strokeLinecap="round" />
			{p > 0.9 ? <path d={`M${x - 11} ${yb - 15} L${x} ${yb - 2} L${x + 11} ${yb - 15}`} fill="none" stroke={C.blue} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
		</svg>
	);
};
type Paso = {icono: string; titulo: string; desc?: string; valor?: string; en: number};
const Flujo: React.FC<Zona & {entrada: Paso; nodo: {logo?: string; icono?: string; nombre: string}; salida: Paso; simbolo?: string}> = ({
	y0,
	y1,
	desde,
	logos,
	entrada,
	nodo,
	salida,
	simbolo,
}) => {
	const {t, fps} = useT();
	const ALTO = 200;
	const NODO = 96;
	const HUECO = 48;
	const bloque = 2 * ALTO + NODO + 2 * HUECO;
	const top = y0 + Math.max(0, (y1 - y0 - bloque) / 2);
	const yN = top + ALTO + HUECO;
	const yB = yN + NODO + HUECO;
	const ANCHO = ESCENA.der - ESCENA.izq;
	const pasos: (Paso & {top: number})[] = [
		{...entrada, top},
		{...salida, top: yB},
	];
	return (
		<>
			{pasos.map((p, k) => {
				const on = enciende(t, p.en, fps);
				const lit = on > 0.5;
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: ESCENA.izq,
							top: p.top,
							width: ANCHO,
							height: ALTO,
							boxSizing: 'border-box',
							borderRadius: 30,
							background: lit ? D.tarjetaSel : D.tarjeta,
							border: `1.5px solid ${lit ? D.bordeSel : C.line2}`,
							boxShadow: lit ? D.sombraSel : 'none',
							transform: `scale(${latido(on, 0.035)})`,
						}}
					>
						<IcoCuadro size={108} icono={p.icono} style={{position: 'absolute', left: 34, top: 46}} />
						<span style={{position: 'absolute', left: 170, top: p.desc ? 50 : 76, ...tituloFicha(42)}}>{p.titulo}</span>
						{p.desc ? <span style={{position: 'absolute', left: 170, top: 112, ...cuerpo(30)}}>{p.desc}</span> : null}
						{p.valor ? (
							<div style={{position: 'absolute', right: ESCENA.padDer, top: 24, opacity: clamp01(on * 2), transform: `scale(${0.6 + 0.4 * clamp01(on)})`, transformOrigin: '100% 50%'}}>
								<Valor valor={p.valor} tam={p.valor.length <= 2 ? 150 : 118} color={C.text} simbolo={simbolo} />
							</div>
						) : null}
					</div>
				);
			})}
			<Flecha x={W / 2} ya={top + ALTO + 6} yb={yN - 4} p={rampa(t, desde + 0.45, desde + 0.8)} />
			<div style={{position: 'absolute', left: 0, right: 0, top: yN, display: 'flex', justifyContent: 'center'}}>
				<Pastilla texto={nodo.nombre} alto={NODO} tam={40} logo={nodo.logo ? logos[nodo.logo] : undefined} icono={nodo.icono} azul />
			</div>
			<Flecha x={W / 2} ya={yN + NODO + 6} yb={yB - 4} p={rampa(t, desde + 0.6, desde + 0.95)} />
		</>
	);
};

// Filas que se encienden: responden a la pregunta del titular ("¿Quién puede usarlo hoy?"). Esperan apagadas, con
// un aro vacío, y cada una se enciende con su visto bueno verde cuando se nombra. "bloqueado" marca en rojo lo que
// se queda fuera.
const Filas: React.FC<Zona & {filas: {logo?: string; icono?: string; titulo: string; sub?: string; en?: number; bloqueado?: boolean}[]}> = ({y0, y1, desde, logos, filas}) => {
	const {t, fps} = useT();
	const HUECO = 16;
	const ALTO = Math.min(168, Math.floor((y1 - y0 - (filas.length - 1) * HUECO) / filas.length));
	const ico = ALTO - 64;
	const ANCHO = ESCENA.der - ESCENA.izq;
	return (
		<>
			{filas.map((fl, k) => {
				const base = resorte(t, desde + 0.22 + k * 0.08, fps, {damping: 18});
				const on = fl.en !== undefined ? enciende(t, fl.en, fps) : 0;
				const lit = on > 0.5;
				const trazo = fl.en !== undefined ? sale(rampa(t, fl.en + 0.12, fl.en + 0.42)) : 0;
				const anchoTexto = ANCHO - (30 + ico + 28) - ESCENA.padDer - 76 - 24;
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: ESCENA.izq,
							top: y0 + k * (ALTO + HUECO),
							width: ANCHO,
							height: ALTO,
							boxSizing: 'border-box',
							borderRadius: 28,
							background: fl.bloqueado ? `linear-gradient(${ESTADO.red.fondo}, ${ESTADO.red.fondo}), ${D.tarjeta}` : lit ? D.tarjetaSel : D.tarjeta,
							border: `1.5px solid ${fl.bloqueado ? ESTADO.red.borde : lit ? D.bordeSel : C.line2}`,
							boxShadow: lit ? D.sombraSel : 'none',
							opacity: clamp01(base * 1.5),
							transform: `translateY(${(1 - base) * 26}px) scale(${latido(on, 0.03)})`,
						}}
					>
						<IcoCuadro
							size={ico}
							logo={fl.logo ? logos[fl.logo] : undefined}
							icono={fl.icono}
							on={fl.bloqueado ? 1 : clamp01(on)}
							estado={fl.bloqueado ? 'red' : 'blue'}
							style={{position: 'absolute', left: 30, top: 32}}
						/>
						<span
							style={{
								position: 'absolute',
								left: 30 + ico + 28,
								top: fl.sub ? ALTO / 2 - 52 : ALTO / 2 - 28,
								fontFamily: SANS,
								fontSize: Math.min(46, Math.floor(anchoTexto / (fl.titulo.length * 0.54))),
								fontWeight: 800,
								letterSpacing: '-.012em',
								whiteSpace: 'nowrap',
								color: fl.bloqueado || lit ? C.text : D.tituloOff,
							}}
						>
							{fl.titulo}
						</span>
						{fl.sub ? (
							<span style={{position: 'absolute', left: 30 + ico + 28, top: ALTO / 2 + 14, ...cuerpo(Math.min(29, Math.floor(anchoTexto / (fl.sub.length * 0.5))), {color: fl.bloqueado ? ESTADO.red.texto : lit ? C.muted : C.dim})}}>
								{fl.sub}
							</span>
						) : null}
						<div style={{position: 'absolute', right: ESCENA.padDer, top: ALTO / 2 - 38}}>
							<Cerrojo size={76} on={clamp01(on)} trazo={trazo} bloqueado={fl.bloqueado} />
						</div>
					</div>
				);
			})}
		</>
	);
};

// Ventana: una captura real (una web, una app) dentro de una ventana de navegador, con desplazamiento opcional.
const VentanaCuerpo: React.FC<Zona & {captura: Captura}> = ({y0, y1, desde, captura}) => {
	const {t, fps} = useT();
	const ce = resorte(t, desde + 0.1, fps, {damping: 18, stiffness: 150});
	const sc = captura.scrollEn !== undefined ? entraSale(rampa(t, captura.scrollEn, captura.scrollEn + (captura.scrollDur ?? 1.5))) : 0;
	return <Ventana x={ESCENA.izq} y={y0} w={ESCENA.der - ESCENA.izq} h={y1 - y0} captura={captura} entra={ce} scroll={sc} />;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CUERPOS: Record<string, React.FC<any>> = {monedas: Monedas, flujo: Flujo, filas: Filas, ventana: VentanaCuerpo};

// ---------------------------------------------------------------------------------------------------------------
// Escena con titular y cuerpos. El titular es la pregunta que se hace el espectador; "sub" es una línea de apoyo
// (la unidad, el matiz) cuya parte en blanco se enciende cuando se dice. Los cuerpos se relevan: cada uno entra en
// su "en" (el primero, con la escena) y el anterior se va. Cada cuerpo puede llevar su "pie" (la fuente del dato).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cuerpo = {tipo: string; en?: number; pie?: string} & Record<string, any>;
export const EscenaCuerpos: React.FC<{
	i: number;
	f: number;
	titulo: Trozo[][];
	sub?: {gris?: string; blanco?: string; blancoEn?: number};
	cuerpos: Cuerpo[];
	logos: Logos;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	propios?: Record<string, React.FC<any>>;
}> = ({i, f, titulo, sub, cuerpos, logos, propios = {}}) => {
	const {t, fps} = useT();
	const hT = altoTitulo(titulo, 100);
	const sb = resorte(t, i + 0.3, fps, {damping: 18});
	const marca = sub?.blancoEn !== undefined ? rampa(t, sub.blancoEn, sub.blancoEn + 0.25) : 1;
	const y0 = ESCENA.top + hT + (sub ? 20 + 44 : 0) + 42;
	return (
		<Escena i={i} f={f}>
			<TituloEscena lineas={titulo} en={i - 0.02} max={100} />
			{sub ? (
				<div style={{position: 'absolute', left: 0, right: 0, top: ESCENA.top + hT + 20, textAlign: 'center', ...cuerpo(31), opacity: clamp01(sb * 1.5), transform: `translateY(${(1 - sb) * 16}px)`}}>
					{sub.gris}
					{sub.gris && sub.blanco ? ' ' : ''}
					{sub.blanco ? <b style={{fontWeight: 800, color: marca > 0.5 ? C.text : '#b7bfcc', display: 'inline-block', transform: `scale(${latido(marca, 0.06)})`}}>{sub.blanco}</b> : null}
				</div>
			) : null}
			{cuerpos.map((c, k) => {
				const desde = k === 0 ? i : (c.en ?? i);
				const hasta = k + 1 < cuerpos.length ? (cuerpos[k + 1].en ?? f) : null;
				if (t < desde - 0.05 || (hasta !== null && t >= hasta + 0.2)) return null;
				const dentro = k === 0 ? 1 : sale(rampa(t, desde + 0.14, desde + 0.5));
				const fuera = hasta !== null ? sale(rampa(t, hasta, hasta + 0.2)) : 0;
				const Comp = propios[c.tipo] ?? CUERPOS[c.tipo];
				if (!Comp) return null;
				const y1 = ESCENA.abajo - (c.pie ? 62 : 0);
				return (
					<div key={k} style={{position: 'absolute', inset: 0, opacity: dentro * (1 - fuera), transform: `translateY(${50 * (1 - dentro) - 40 * fuera}px)`}}>
						<Comp {...c} y0={y0} y1={y1} desde={desde} logos={logos} />
						{/* la fuente entra después del titular y del cuerpo: sola en pantalla, parecería lo importante */}
						{c.pie ? <Pie texto={c.pie} style={{position: 'absolute', left: ESCENA.izq, width: 868, top: ESCENA.abajo - 40, textAlign: 'center', opacity: rampa(t, desde + 0.5, desde + 0.9)}} /> : null}
					</div>
				);
			})}
		</Escena>
	);
};
