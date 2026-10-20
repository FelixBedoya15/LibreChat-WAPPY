import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';
import {C, acento, acento2} from '../tema';
import {CLAMP, useT} from '../componentes/comun';
import {Candado, Ico} from './iconos';
import {Cabecera, Cerrojo, Chip, Ficha, IcoCuadro, Pastilla, Pie, Placa} from './base';
import {
	ANCHO_TITULAR,
	D,
	ESTADO,
	Estado,
	SANS,
	SOMBRA_TXT,
	TXT,
	ZONA,
	ajustar,
	anchoEm,
	clamp01,
	cuerpo,
	degradadoAcento,
	enciende,
	latido,
	mezcla,
	partir2,
	pulso,
	rampa,
	resorte,
	rotulo,
	sale,
	titular,
	tituloFicha,
	vida,
} from './sistema';

// Piezas del plano de cara: van sobre el pecho, por debajo de la barbilla, y se construyen con la voz.
// Una idea por pieza y letra grande: tienen que leerse en un móvil de un vistazo. Los datos van en tarjetas;
// las frases a cámara, en titulares sueltos; las llamadas a la acción, en piezas que se encienden al decirlas.
// Reglas que cumplen todas:
// - Lo que aún no se ha dicho espera apagado (gris) y se enciende en su palabra: la estructura se ve entera desde
//   el principio y da tiempo a leerla.
// - Ningún texto por debajo de 26 px. Lo que se alinea a la derecha respeta ZONA.padDer (botones de Instagram).
// - "salida" = segundos de fundido al irse (0 cuando la tapa la cortina de una escena: lo pone edl solo).

type Logos = Record<string, string>;
type PalabraK = {t: string; i: number; f: number};
const UTIL = ZONA.ancho - 2 * ZONA.pad; // ancho interior simétrico (gráficos centrados)
const UTIL_DER = ZONA.ancho - ZONA.pad - ZONA.padDer; // ancho interior dejando libre la zona de botones

// ---------------------------------------------------------------------------------------------------------------
// Titular del gancho: completo desde el fotograma 0 (sirve de portada). La palabra que suena se enciende y la
// caja de acento recibe un golpe (un pulso y un anillo, sin sacudidas ni destellos) en "golpe".
export const Titular: React.FC<{
	i: number;
	f: number;
	logo?: string;
	marca?: string;
	fecha?: string;
	lineas: {palabras: PalabraK[]; caja?: boolean}[];
	golpe?: number;
	marcaEn?: number; // cuándo se nombra la marca: la píldora da un pulso
	top?: number;
	tamMax?: number; // tamaño máximo de la letra del titular (más grande en la portada)
	placa?: number; // fuerza (0–1) de la sombra de detrás; más alta en la portada, que es una imagen fija
	salida?: number;
	logos: Logos;
}> = ({i, f, logo, marca, fecha, lineas, golpe, marcaEn, top = ZONA.top + 2, tamMax = 138, placa = 0.72, salida = 0.14, logos}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const {e, s, op} = vida(t, i, f, fps, salida);
	const texto = (l: {palabras: PalabraK[]}) => l.palabras.map((w) => w.t).join(' ').toUpperCase();
	const src = logo ? logos[logo] : undefined;
	const tg = golpe !== undefined ? t - golpe : -1;
	const pm = marcaEn !== undefined ? 1 + 0.07 * pulso(t - marcaEn) : 1;
	const luz = marcaEn !== undefined ? rampa(t, marcaEn, marcaEn + 0.45) : 1;
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
				gap: 18,
				fontFamily: SANS,
				opacity: op,
				transform: `translateY(${(1 - e) * 40}px) scale(${0.97 + 0.03 * s})`,
			}}
		>
			<Placa top={70} alto={tamMax > 150 ? 420 : 300} fuerza={placa} />
			{marca ? (
				<div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 14}}>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 14,
							height: 84,
							padding: src ? '0 32px 0 22px' : '0 32px',
							borderRadius: 42,
							background: C.text,
							backgroundImage: `linear-gradient(105deg, transparent 40%, ${acento(0.45)} 50%, transparent 60%)`,
							backgroundSize: '260% 100%',
							backgroundPosition: `${130 - 160 * luz}% 0`,
							backgroundRepeat: 'no-repeat',
							boxShadow: '0 20px 50px -12px rgba(0,0,0,.7)',
							transform: `scale(${pm})`,
						}}
					>
						{src ? <Img src={staticFile(src)} style={{width: 52, height: 52, objectFit: 'contain'}} /> : null}
						<span style={titular(48, {color: C.bg, letterSpacing: '.01em'})}>{marca}</span>
					</div>
					{fecha ? (
						<div
							style={{
								height: 84,
								padding: '0 28px',
								display: 'flex',
								alignItems: 'center',
								borderRadius: 42,
								background: 'rgba(9,13,20,.92)',
								border: `1.5px solid ${C.line2}`,
								boxShadow: '0 20px 50px -18px rgba(0,0,0,.8)',
								...rotulo(TXT.rotulo, {color: C.blue3, letterSpacing: '.14em'}),
							}}
						>
							{fecha}
						</div>
					) : null}
				</div>
			) : null}
			{lineas.map((l, k) => {
				const tam = Math.min(tamMax, Math.floor(ANCHO_TITULAR / (anchoEm(texto(l)) + (l.caja ? 0.7 : 0))));
				const golpeado = l.caja && golpe !== undefined ? 1 + 0.09 * pulso(tg) : 1;
				return (
					<div key={k} style={{position: 'relative'}}>
						{l.caja && tg >= 0 && tg < 0.7
							? [0, 0.12].map((ret) => {
									const p = clamp01((tg - ret) / 0.5);
									if (p <= 0 || p >= 1) return null;
									return (
										<div
											key={ret}
											style={{
												position: 'absolute',
												inset: 0,
												borderRadius: tam * 0.24,
												border: `4px solid ${C.blue3}`,
												transform: `scale(${1 + 0.16 * sale(p)}, ${1 + 0.42 * sale(p)})`,
												opacity: Math.sin(Math.PI * p) * 0.6, // entra y sale suave: nada de destellos
											}}
										/>
									);
								})
							: null}
						<div
							style={{
								display: 'flex',
								gap: tam * 0.25,
								justifyContent: 'center',
								alignItems: 'center',
								transform: `scale(${golpeado})`,
								...(l.caja
									? {
											padding: `${tam * 0.1}px ${tam * 0.32}px ${tam * 0.14}px`,
											borderRadius: tam * 0.24,
											background: degradadoAcento,
											boxShadow: `0 26px 70px -20px ${acento2(0.9)}, 0 0 ${tg >= 0 ? 70 * Math.max(0, 1 - tg / 0.6) : 0}px ${acento(0.9)}`,
										}
									: {}),
							}}
						>
							{l.palabras.map((w, j) => {
								const activa = t >= w.i - 0.03 && t < w.f - 0.03;
								const salto = activa ? interpolate(t - w.i, [0, 0.1, 0.27], [1, 1.06, 1], CLAMP) : 1;
								return (
									<span
										key={j}
										style={{
											...titular(tam, {lineHeight: 1.04, letterSpacing: '-.015em'}),
											display: 'inline-block',
											color: l.caja ? '#fff' : activa ? '#8db8ff' : C.text,
											transform: `scale(${salto})`,
											textShadow: l.caja ? '0 2px 10px rgba(0,0,0,.25)' : SOMBRA_TXT,
											WebkitTextStroke: l.caja ? undefined : `${Math.round(tam * 0.09)}px rgba(6,8,13,.45)`,
											paintOrder: 'stroke fill',
										}}
									>
										{w.t.toUpperCase()}
									</span>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Presentación: una tarjeta con el protagonista (logo, rótulo y nombre) y, debajo, una banda con lo que se le
// relaciona ("RIVALES", "FUNCIONA CON", "INCLUYE"…). Las pastillas de la banda esperan apagadas y cada una se
// enciende cuando se nombra.
export const Presentacion: React.FC<{
	i: number;
	f: number;
	propio: {logo: string; rotulo: string; nombre: string; acento?: string; en: number};
	nexo?: {texto: string; en: number};
	items?: {logo?: string; icono?: string; nombre: string; en: number}[];
	salida?: number;
	logos: Logos;
}> = ({i, f, propio, nexo, items = [], salida, logos}) => {
	const {t, fps} = useT();
	const pe = resorte(t, propio.en, fps, {damping: 14, stiffness: 200});
	const ALTO_A = 208;
	const nombre = propio.nombre + (propio.acento ? ' ' + propio.acento : '');
	const tamNombre = ajustar(nombre, UTIL - 158, 70);
	const banda = nexo ? vida(t, nexo.en - 0.08, f, fps, salida) : null;
	return (
		<>
			<Ficha i={i} f={f} alto={ALTO_A} salida={salida}>
				<IcoCuadro size={128} logo={logos[propio.logo]} style={{position: 'absolute', left: ZONA.pad, top: 40, transform: `scale(${0.8 + 0.2 * clamp01(pe)})`}} />
				<div style={{position: 'absolute', left: 198, top: 44, opacity: clamp01(pe * 1.5), transform: `translateX(${(1 - pe) * -20}px)`}}>
					<span style={{...rotulo(TXT.rotulo), display: 'block'}}>{propio.rotulo}</span>
					<span style={{...titular(tamNombre, {color: C.text}), display: 'block', marginTop: 16}}>
						{propio.nombre}
						{propio.acento ? <span style={{color: C.blue}}> {propio.acento}</span> : null}
					</span>
				</div>
			</Ficha>
			{nexo && banda && t >= nexo.en - 0.08 && t < f ? (
				<div
					style={{
						position: 'absolute',
						left: ZONA.x,
						top: ZONA.top + ALTO_A + 16,
						width: ZONA.ancho,
						height: 136,
						boxSizing: 'border-box',
						borderRadius: 26,
						background: D.tarjeta,
						border: `1.5px solid ${D.bordeVideo}`,
						boxShadow: D.sombraVideo,
						display: 'flex',
						alignItems: 'center',
						padding: `0 ${ZONA.padDer}px 0 ${ZONA.pad}px`,
						opacity: banda.op,
						transform: `translateY(${(1 - banda.e) * 30}px)`,
					}}
				>
					<span style={rotulo(TXT.rotulo)}>{nexo.texto}</span>
					<span style={{marginLeft: 'auto', display: 'flex', gap: 14}}>
						{items.map((r, k) => {
							const on = enciende(t, r.en, fps);
							return <Pastilla key={k} texto={r.nombre} alto={88} tam={31} logo={r.logo ? logos[r.logo] : undefined} icono={r.icono} on={clamp01(on)} style={{transform: `scale(${latido(on)})`}} />;
						})}
					</span>
				</div>
			) : null}
		</>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Columnas: de 2 a 4 valores que suben desde la misma base. La del protagonista marca una línea de nivel ("a la
// altura de…") y las demás suben hasta donde llegan. Los nombres esperan apagados en la base; cada columna sube
// cuando se nombra y su cifra aparece al llegar arriba (sin contador: un fotograma pausado no enseña números falsos).
type Columna = {logo?: string; nombre: string; valor: number; texto: string; en: number; propio?: boolean};
export const Columnas: React.FC<{
	i: number;
	f: number;
	pie?: string;
	lineaEn?: number;
	columnas: Columna[];
	salida?: number;
	logos: Logos;
}> = ({i, f, pie, lineaEn, columnas, salida, logos}) => {
	const {t, fps} = useT();
	const ALTO = pie ? 458 : 420;
	const NIVEL = 106;
	const ALTO_MAX = 216;
	const BASE = NIVEL + ALTO_MAX;
	const paso = UTIL / columnas.length;
	const ANCHO = Math.min(196, paso - 70);
	const max = Math.max(...columnas.map((c) => c.valor));
	const propia = columnas.find((c) => c.propio);
	const yNivel = BASE - (ALTO_MAX * (propia ? propia.valor : max)) / max; // la línea de nivel, a la altura del protagonista
	const nivel = lineaEn !== undefined ? sale(rampa(t, lineaEn, lineaEn + 0.5)) : 0;
	return (
		<Ficha i={i} f={f} alto={ALTO} salida={salida}>
			<div style={{position: 'absolute', left: ZONA.pad, width: UTIL, top: BASE, height: 2, background: C.line2}} />
			{columnas.map((c, k) => {
				const cx = ZONA.pad + paso * (k + 0.5);
				const hFinal = (ALTO_MAX * c.valor) / max;
				const sube = sale(rampa(t, c.en, c.en + 0.45));
				const on = resorte(t, c.en, fps, {damping: 16});
				const cifra = rampa(t, c.en + 0.22, c.en + 0.42);
				const h = hFinal * sube;
				return (
					<React.Fragment key={k}>
						<span
							style={{
								position: 'absolute',
								left: cx - paso / 2,
								width: paso,
								top: 30,
								textAlign: 'center',
								...titular(ajustar(c.texto, paso - 30, 54), {color: c.propio ? C.blue3 : C.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em'}),
								opacity: cifra,
								transform: `translateY(${(1 - cifra) * 12}px)`,
							}}
						>
							{c.texto}
						</span>
						<div
							style={{
								position: 'absolute',
								left: cx - ANCHO / 2,
								top: BASE - h,
								width: ANCHO,
								height: h,
								borderRadius: '20px 20px 0 0',
								background: c.propio ? `linear-gradient(180deg, ${C.blue3} 0%, ${C.blue} 30%, ${C.blue2} 100%)` : 'linear-gradient(180deg, #aab4c8 0%, #6b778c 34%, #3a4456 100%)',
								boxShadow: c.propio ? `0 0 50px -6px ${acento(0.8)}` : 'none',
								opacity: sube > 0 ? 1 : 0,
							}}
						/>
						{c.logo ? (
							<div
								style={{
									position: 'absolute',
									left: cx - 40,
									top: hFinal >= 112 ? BASE - hFinal + 20 : BASE - hFinal - 92, // en una columna baja, el logo va encima
									width: 80,
									height: 80,
									borderRadius: 20,
									background: 'rgba(6,8,13,.86)',
									border: '1.5px solid rgba(255,255,255,.14)',
									display: 'grid',
									placeItems: 'center',
									opacity: rampa(sube, 0.7, 1),
								}}
							>
								<Img src={staticFile(logos[c.logo])} style={{width: 48, height: 48, objectFit: 'contain'}} />
							</div>
						) : null}
						<span
							style={{
								position: 'absolute',
								left: cx - paso / 2,
								width: paso,
								top: BASE + 13,
								textAlign: 'center',
								...tituloFicha(TXT.min, {letterSpacing: '.05em', lineHeight: 1.14, whiteSpace: 'pre-line', color: c.propio ? C.text : '#c3cad6'}),
								opacity: mezcla(0.38, 1, clamp01(on * 1.5)),
							}}
						>
							{c.nombre}
						</span>
					</React.Fragment>
				);
			})}
			{/* la línea de nivel, por encima de las columnas */}
			<svg width={ZONA.ancho} height={ALTO} style={{position: 'absolute', left: 0, top: 0}}>
				<line
					x1={ZONA.pad}
					y1={yNivel}
					x2={ZONA.pad + UTIL * nivel}
					y2={yNivel}
					stroke={C.blue3}
					strokeWidth={3.5}
					strokeDasharray="4 11"
					strokeLinecap="round"
					opacity={nivel > 0 ? 0.9 : 0}
				/>
			</svg>
			{pie ? <Pie texto={pie} style={{position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center'}} /> : null}
		</Ficha>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Cambio "ahora → después": primero solo la columna de ahora; al decir "después", la tabla se abre, entra la
// segunda columna y cada cifra llega cuando se dice. Hasta 2 filas. La unidad va arriba a la derecha y, abajo,
// la fuente y (opcional) una nota que resume el cambio ("EL DOBLE").
const Cifra: React.FC<{texto: string; tam: number; color: string; simbolo?: string; colorSimbolo?: string}> = ({texto, tam, color, simbolo, colorSimbolo}) => (
	<span style={{display: 'inline-flex', alignItems: 'flex-start', fontFamily: SANS}}>
		{simbolo ? <span style={titular(tam * 0.54, {color: colorSimbolo ?? C.muted, marginTop: tam * 0.1, marginRight: tam * 0.04})}>{simbolo}</span> : null}
		<span style={titular(tam, {color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.03em'})}>{texto}</span>
	</span>
);
export const Cambio: React.FC<{
	i: number;
	f: number;
	titulo: string;
	icono?: string;
	estado?: Estado;
	unidad?: string;
	simbolo?: string; // delante de cada cifra: "$", "€"…
	ahora: string;
	despues: {texto: string; en: number};
	filas: {nombre: string; ahora: string; despues: string; en: number}[];
	nota?: {texto: string; en: number};
	pie?: string;
	salida?: number;
}> = ({i, f, titulo, icono = 'aviso', estado = 'amber', unidad, simbolo, ahora, despues, filas, nota, pie, salida}) => {
	const {t, fps} = useT();
	const m = resorte(t, despues.en - 0.12, fps, {damping: 18, stiffness: 150}); // la tabla se abre para la segunda columna
	const dz = resorte(t, despues.en, fps, {damping: 16});
	const nt = nota ? resorte(t, nota.en, fps, {damping: 12, stiffness: 230}) : 0;
	const col = ESTADO[estado];
	const X1 = mezcla(590, 440, m); // centro de la columna "ahora"
	const X2 = 716; // centro de la columna "después"
	const PASO = 116;
	const Y0 = 150;
	const abajo = pie || nota ? 64 : 22;
	const largo = Math.max(...filas.flatMap((fl) => [fl.ahora.length, fl.despues.length]));
	const tam = largo <= 2 ? 100 : largo === 3 ? 84 : 66;
	return (
		<Ficha i={i} f={f} alto={Y0 + filas.length * PASO + abajo} borde={col.borde} salida={salida}>
			<Cabecera icono={icono} estado={estado} titulo={titulo} tam={ajustar(titulo, unidad ? 380 : 700, 32)} derecha={unidad ? <Pie texto={unidad} /> : null} />
			<span style={{position: 'absolute', left: X1 - 140, width: 280, top: 108, textAlign: 'center', ...rotulo(TXT.rotulo, {color: C.muted})}}>{ahora}</span>
			<span style={{position: 'absolute', left: X2 - 140, width: 280, top: 108, textAlign: 'center', ...rotulo(TXT.rotulo, {color: col.punto}), opacity: clamp01(dz * 1.5)}}>
				{despues.texto}
			</span>
			{filas.map((fl, k) => {
				const y = Y0 + k * PASO;
				const on = resorte(t, fl.en, fps, {damping: 11, stiffness: 230, mass: 0.6});
				return (
					<div key={k} style={{position: 'absolute', left: 0, right: 0, top: y, height: PASO}}>
						<div style={{position: 'absolute', left: ZONA.pad, right: ZONA.pad, top: 0, height: 1.5, background: C.line}} />
						<span style={{position: 'absolute', left: ZONA.pad, top: PASO / 2 - 18, ...tituloFicha(30)}}>{fl.nombre}</span>
						<div style={{position: 'absolute', left: X1 - 150, width: 300, top: (PASO - tam) / 2 - 2, display: 'flex', justifyContent: 'center'}}>
							<Cifra texto={fl.ahora} tam={tam} color={C.text} simbolo={simbolo} />
						</div>
						<div style={{position: 'absolute', left: (440 + X2) / 2 - 26, top: PASO / 2 - 26, opacity: clamp01(dz * 1.5), transform: `translateX(${(1 - clamp01(dz)) * -16}px)`}}>
							<Ico nombre="flecha" size={52} color={col.punto} grosor={2.4} />
						</div>
						<div
							style={{
								position: 'absolute',
								left: X2 - 150,
								width: 300,
								top: (PASO - tam) / 2 - 2,
								display: 'flex',
								justifyContent: 'center',
								opacity: clamp01(on * 1.6),
								transform: `scale(${0.7 + 0.3 * clamp01(on)})`,
							}}
						>
							<Cifra texto={fl.despues} tam={tam} color={col.punto} simbolo={simbolo} colorSimbolo={col.borde} />
						</div>
					</div>
				);
			})}
			{pie ? <Pie texto={pie} style={{position: 'absolute', left: ZONA.pad, bottom: 20}} /> : null}
			{nota && nt > 0 ? (
				<Chip
					texto={nota.texto}
					estado={estado}
					tam={TXT.min}
					style={{position: 'absolute', right: ZONA.padDer, bottom: 12, transformOrigin: '100% 50%', transform: `scale(${0.6 + 0.4 * clamp01(nt)})`, opacity: clamp01(nt * 1.5)}}
				/>
			) : null}
		</Ficha>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Sentencia: una frase a cámara en letra grande, sin tarjeta. La caja de color aparece con su palabra y su icono
// (por defecto un candado, que se cierra en la sílaba justa); cada línea entra cuando se dice. Nunca enseña una
// palabra antes de que suene: un "DISPONIBLE" esperando al "AÚN NO" diría lo contrario durante un segundo.
// Sin "linea" queda solo la caja, más grande: el remate de una frase en una palabra ("GRATIS").
export const Sentencia: React.FC<{
	i: number;
	f: number;
	caja: {texto: string; en: number};
	cierraEn?: number; // cuándo se cierra el candado (o da el pulso el icono)
	icono?: string; // "candado" (por defecto), el nombre de un icono, o "" para ninguno
	linea?: {texto: string; en: number};
	pie?: {gris?: string; blanco: string; en: number};
	estado?: Estado;
	top?: number;
	salida?: number;
}> = ({i, f, caja, cierraEn, icono = 'candado', linea, pie, estado = 'red', top = ZONA.top + 2, salida = 0.16}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const sal = salida > 0 ? 1 - rampa(t, f - salida, f) : 1;
	const cj = resorte(t, caja.en, fps, {damping: 12, stiffness: 220, mass: 0.7});
	const cuando = cierraEn ?? caja.en + 0.2;
	const cierre = enciende(t, cuando, fps);
	const ln = linea ? resorte(t, linea.en, fps, {damping: 14, stiffness: 200}) : 0;
	const pi = pie ? resorte(t, pie.en, fps, {damping: 18}) : 0;
	const col = ESTADO[estado].punto;
	const oscuro: Record<Estado, string> = {red: '#d14f4f', amber: '#d9962f', green: '#1fa878', blue: C.blue2};
	const tamCaja = Math.min(linea ? 118 : 156, Math.floor((linea ? 620 : 700) / (anchoEm(caja.texto.toUpperCase()) + (icono ? 1.1 : 0.7))));
	const tamLinea = linea ? ajustar(linea.texto, ANCHO_TITULAR, 132) : 0;
	const tg = t - cuando;
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, fontFamily: SANS, opacity: sal}}>
			<div style={{position: 'absolute', inset: 0, opacity: clamp01(cj * 1.5)}}>
				<Placa top={linea ? 50 : 10} alto={linea ? 330 : 210} fuerza={0.88} />
			</div>
			<div
				style={{
					position: 'relative',
					display: 'flex',
					alignItems: 'center',
					gap: tamCaja * 0.2,
					padding: `${tamCaja * 0.1}px ${tamCaja * 0.34}px ${tamCaja * 0.14}px ${tamCaja * (icono ? 0.26 : 0.34)}px`,
					borderRadius: tamCaja * 0.24,
					background: `linear-gradient(180deg, ${col}, ${oscuro[estado]})`,
					boxShadow: `0 26px 70px -20px ${ESTADO[estado].borde}, 0 0 ${tg >= 0 ? 60 * Math.max(0, 1 - tg / 0.6) : 0}px ${ESTADO[estado].borde}`,
					opacity: clamp01(cj * 1.6),
					transform: `scale(${(0.82 + 0.18 * clamp01(cj)) * latido(cierre, 0.06)})`,
				}}
			>
				{icono === 'candado' ? (
					<Candado size={tamCaja * 0.8} color="#fff" p={clamp01(cierre)} grosor={2.4} />
				) : icono ? (
					<Ico nombre={icono} size={tamCaja * 0.8} color="#fff" grosor={2.4} />
				) : null}
				<span style={titular(tamCaja, {color: '#fff', lineHeight: 1.04, letterSpacing: '-.015em', textShadow: '0 2px 10px rgba(0,0,0,.22)'})}>{caja.texto}</span>
			</div>
			{linea ? (
				<span
					style={{
						position: 'relative',
						...titular(tamLinea, {color: C.text, lineHeight: 1.02, textShadow: SOMBRA_TXT, WebkitTextStroke: `${Math.round(tamLinea * 0.085)}px rgba(6,8,13,.45)`, paintOrder: 'stroke fill'}),
						opacity: clamp01(ln * 1.6),
						transform: `translateY(${(1 - ln) * 36}px)`,
					}}
				>
					{linea.texto}
				</span>
			) : null}
			{pie ? (
				<span style={{position: 'relative', ...tituloFicha(36, {letterSpacing: '.14em', color: C.text, textShadow: SOMBRA_TXT}), opacity: clamp01(pi * 1.5), transform: `translateY(${(1 - pi) * 14}px)`}}>
					{pie.gris ? <span style={{color: '#b7bfcc'}}>{pie.gris} </span> : null}
					{pie.blanco}
				</span>
			) : null}
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Campo que se resuelve: una tarjeta con un campo vacío que espera (una fecha, un precio, un nombre) y, debajo,
// las vías o condiciones, que esperan apagadas al mismo nivel y se encienden al nombrarlas (si la fuente no da un
// orden entre ellas, la pieza tampoco). El campo se resuelve cuando se dice ("SIN FECHA").
export const Campo: React.FC<{
	i: number;
	f: number;
	titulo: string;
	icono?: string;
	campo: {rotulo: string; huecos: string; valor: string; en: number; estado?: Estado; icono?: string};
	vias?: {rotulo: string; en: number; items: {icono?: string; logo?: string; texto: string; en: number}[]};
	salida?: number;
	logos: Logos;
}> = ({i, f, titulo, icono = 'calendario', campo, vias, salida, logos}) => {
	const {t, fps} = useT();
	const crece = vias ? resorte(t, vias.en, fps, {damping: 18, stiffness: 150}) : 0;
	const sf = enciende(t, campo.en, fps);
	const resuelto = sf > 0.5;
	const est = campo.estado ?? 'amber';
	const col = ESTADO[est];
	// Tamaño de letra de las pastillas para que quepan a la derecha del rótulo sin pasar de ZONA.padDer
	let tamPastilla = 34;
	if (vias) {
		const anchoRotulo = (anchoEm(vias.rotulo.toUpperCase()) * 0.92 + vias.rotulo.length * 0.2) * TXT.rotulo;
		const libre = UTIL_DER - anchoRotulo - 18 - vias.items.length * 126 - (vias.items.length - 1) * 14;
		const letras = vias.items.reduce((a, v) => a + anchoEm(v.texto.toUpperCase()) * 0.93, 0);
		tamPastilla = Math.max(TXT.min, Math.min(34, Math.floor(libre / Math.max(1, letras))));
	}
	return (
		<Ficha i={i} f={f} alto={mezcla(246, 392, crece)} borde={resuelto ? col.borde : undefined} salida={salida}>
			<Cabecera icono={icono} titulo={titulo} estado={resuelto ? est : 'blue'} />
			{/* el campo */}
			<div
				style={{
					position: 'absolute',
					left: ZONA.pad,
					right: ZONA.pad,
					top: 108,
					height: 112,
					boxSizing: 'border-box',
					borderRadius: 22,
					background: D.hueco,
					border: `1.5px solid ${resuelto ? col.borde : C.line2}`,
					boxShadow: resuelto ? `0 0 44px -12px ${col.borde}` : 'none',
					display: 'flex',
					alignItems: 'center',
					padding: '0 44px 0 30px',
					transform: `scale(${latido(sf, 0.035)})`,
				}}
			>
				<span style={rotulo(TXT.rotulo, {color: resuelto ? col.punto : C.blue})}>{campo.rotulo}</span>
				<span style={{marginLeft: 'auto', position: 'relative', height: 60, width: 540}}>
					<span style={{position: 'absolute', right: 0, top: 4, ...titular(44, {color: C.dim, letterSpacing: '.08em'}), opacity: 1 - clamp01(sf * 2)}}>{campo.huecos}</span>
					<span
						style={{
							position: 'absolute',
							right: 0,
							top: 4,
							display: 'flex',
							alignItems: 'center',
							gap: 14,
							opacity: clamp01(sf * 2),
							transform: `translateY(${(1 - clamp01(sf)) * 12}px)`,
						}}
					>
						<Ico nombre={campo.icono ?? icono} size={40} color={col.punto} grosor={2.3} />
						<span style={titular(ajustar(campo.valor, 430, 42), {color: col.punto, letterSpacing: '-.01em'})}>{campo.valor}</span>
					</span>
				</span>
			</div>
			{/* por dónde llegará */}
			{vias ? (
				<div style={{position: 'absolute', left: ZONA.pad, right: ZONA.padDer, top: 244, height: 116, display: 'flex', alignItems: 'center', gap: 18, opacity: clamp01(crece * 1.4)}}>
					<span style={rotulo(TXT.rotulo)}>{vias.rotulo}</span>
					<span style={{marginLeft: 'auto', display: 'flex', gap: 14}}>
						{vias.items.map((v, k) => {
							const on = enciende(t, v.en, fps);
							return (
								<Pastilla
									key={k}
									texto={v.texto}
									alto={96}
									tam={tamPastilla}
									icono={v.icono}
									logo={v.logo ? logos[v.logo] : undefined}
									azul
									on={clamp01(on)}
									style={{transform: `scale(${latido(on)})`}}
								/>
							);
						})}
					</span>
				</div>
			) : null}
		</Ficha>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// La pregunta al espectador: un rótulo (que puede cambiar a la pregunta resumida cuando se dice), opcionalmente un
// grupo de logos al que llega uno nuevo y se une, y dos respuestas que esperan apagadas y se encienden al final:
// invitan a contestar en comentarios.
export const Pregunta: React.FC<{
	i: number;
	f: number;
	rotulo: string;
	rotulo2?: {texto: string; en: number};
	grupo?: {fijos: {logo: string}[]; nuevo: {logo: string; aparece: number; seUne: number}};
	opciones: {texto: string; en: number; principal?: boolean}[];
	salida?: number;
	logos: Logos;
}> = ({i, f, rotulo: etiqueta, rotulo2, grupo, opciones, salida, logos}) => {
	const {t, fps} = useT();
	const TAM = 132;
	const HUECO = 28;
	const yOp = grupo ? 270 : 96;
	const anchoOp = (UTIL_DER - 18 * (opciones.length - 1)) / opciones.length;
	const cambio = rotulo2 ? resorte(t, rotulo2.en, fps, {damping: 16, stiffness: 200}) : 0;
	let logosGrupo: React.ReactNode = null;
	if (grupo) {
		const {fijos, nuevo} = grupo;
		const ap = resorte(t, nuevo.aparece, fps, {damping: 14, stiffness: 200});
		const un = resorte(t, nuevo.seUne, fps, {damping: 13, stiffness: 150, mass: 0.8});
		const n = fijos.length + 1;
		const total = n * TAM + (n - 1) * HUECO;
		const x0 = (ZONA.ancho - total) / 2;
		const xNuevo = x0 - 170 * (1 - un);
		const marco = sale(rampa(t, nuevo.seUne + 0.25, nuevo.seUne + 0.75));
		logosGrupo = (
			<>
				{/* el marco que los reúne se dibuja cuando se une */}
				<div
					style={{
						position: 'absolute',
						left: x0 - 16,
						top: 82,
						width: total + 32,
						height: TAM + 32,
						borderRadius: 42,
						border: `2px solid ${D.bordeSel}`,
						background: acento(0.07),
						boxShadow: `0 0 60px -12px ${acento(0.7)}`,
						opacity: marco,
						clipPath: `inset(0 ${(1 - marco) * 100}% 0 0 round 42px)`,
					}}
				/>
				<div style={{position: 'absolute', left: xNuevo, top: 98, opacity: clamp01(ap * 1.5), transform: `scale(${(0.6 + 0.4 * clamp01(ap)) * latido(un, 0.08)})`}}>
					<IcoCuadro size={TAM} logo={logos[nuevo.logo]} />
				</div>
				{fijos.map((r, k) => {
					const e = resorte(t, i + 0.12 + k * 0.1, fps, {damping: 14});
					return (
						<div key={k} style={{position: 'absolute', left: x0 + (k + 1) * (TAM + HUECO), top: 98, transform: `scale(${0.7 + 0.3 * e})`, opacity: clamp01(e * 1.5)}}>
							<IcoCuadro size={TAM} logo={logos[r.logo]} style={{background: D.pastilla, borderColor: 'rgba(243,245,249,.3)'}} />
						</div>
					);
				})}
			</>
		);
	}
	return (
		<Ficha i={i} f={f} alto={yOp + 118 + 34} salida={salida}>
			<span style={{position: 'absolute', left: ZONA.pad, top: 30, ...rotulo(TXT.rotulo, {letterSpacing: '.22em'}), opacity: 1 - clamp01(cambio * 2), transform: `translateY(${-10 * clamp01(cambio)}px)`}}>
				{etiqueta}
			</span>
			{rotulo2 ? (
				<span
					style={{
						position: 'absolute',
						left: ZONA.pad,
						top: 30,
						...rotulo(Math.min(TXT.rotulo, Math.floor(UTIL / (anchoEm(rotulo2.texto.toUpperCase()) * 1.24))), {letterSpacing: '.16em', color: C.text}),
						opacity: clamp01(cambio * 2 - 0.6),
						transform: `translateY(${10 * (1 - clamp01(cambio))}px)`,
					}}
				>
					{rotulo2.texto}
				</span>
			) : null}
			{logosGrupo}
			{opciones.map((o, k) => {
				const e = enciende(t, o.en, fps);
				const lit = e > 0.5;
				// una respuesta larga va en dos líneas antes que en letra pequeña
				const enUna = ajustar(o.texto, anchoOp - 56, 46);
				const lineasOp = enUna >= 34 ? [o.texto] : partir2(o.texto);
				const tamOp = lineasOp.length === 1 ? enUna : Math.min(42, ...lineasOp.map((l) => ajustar(l, anchoOp - 56, 42)));
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: ZONA.pad + k * (anchoOp + 18),
							top: yOp,
							width: anchoOp,
							height: 118,
							boxSizing: 'border-box',
							borderRadius: 24,
							border: `1.5px solid ${!lit ? C.line2 : o.principal ? D.pastillaAzulBorde : 'rgba(243,245,249,.45)'}`,
							background: !lit ? 'rgba(18,24,35,.6)' : o.principal ? `linear-gradient(${D.pastillaAzul}, ${D.pastillaAzul}), ${D.pastilla}` : D.pastilla,
							boxShadow: lit && o.principal ? `0 0 46px -10px ${acento(0.8)}` : 'none',
							display: 'grid',
							placeItems: 'center',
							transform: `scale(${latido(e)})`,
						}}
					>
						<span style={titular(tamOp, {letterSpacing: '-.01em', lineHeight: 1.08, whiteSpace: 'pre', textAlign: 'center', color: !lit ? D.tituloOff : o.principal ? D.pastillaAzulTexto : C.text})}>
							{lineasOp.join('\n')}
						</span>
					</div>
				);
			})}
		</Ficha>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// "Déjamelo en los comentarios": una caja de comentario, suelta, en la que se escribe el arranque de la respuesta
// (o la palabra que hay que comentar).
export const Comenta: React.FC<{i: number; f: number; texto: string; escribirEn: number; boton?: string; cps?: number; top?: number; salida?: number}> = ({
	i,
	f,
	texto,
	escribirEn,
	boton = 'Publicar',
	cps = 14,
	top = ZONA.top + 26,
	salida,
}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const {e, op} = vida(t, i, f, fps, salida);
	const n = t >= escribirEn ? Math.min(texto.length, Math.floor((t - escribirEn) * cps) + 1) : 0;
	const completo = n >= texto.length;
	const fin = escribirEn + texto.length / cps;
	const listo = rampa(t, fin, fin + 0.2);
	const tam = Math.min(54, Math.floor(470 / (texto.length * 0.52)));
	return (
		<div
			style={{
				position: 'absolute',
				left: ZONA.x,
				top,
				width: ZONA.ancho,
				height: 140,
				boxSizing: 'border-box',
				borderRadius: 70,
				background: D.tarjeta,
				border: `1.5px solid ${completo ? D.bordeSel : D.bordeVideo}`,
				boxShadow: completo ? `0 0 ${50 * listo}px -8px ${acento(0.7)}, ${D.sombraVideo}` : D.sombraVideo,
				display: 'flex',
				alignItems: 'center',
				gap: 22,
				padding: `0 ${ZONA.padDer - 4}px 0 18px`,
				fontFamily: SANS,
				opacity: op,
				transform: `translateY(${(1 - e) * 44}px)`,
			}}
		>
			<div style={{width: 104, height: 104, borderRadius: 52, background: D.icoFondo, border: `1.5px solid ${D.icoBorde}`, display: 'grid', placeItems: 'center', flex: '0 0 auto'}}>
				<Ico nombre="usuario" size={54} color={C.blue} grosor={2.1} />
			</div>
			<span style={{flex: 1, fontSize: tam, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', letterSpacing: '-.01em'}}>
				{texto.slice(0, n)}
				<span style={{display: 'inline-block', width: 5, height: tam + 2, marginLeft: 7, background: C.blue, transform: 'translateY(9px)'}} />
			</span>
			<span style={{fontSize: 40, fontWeight: 800, color: completo ? C.blue : C.dim}}>{boton}</span>
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Cierre: me gusta, compartir y seguir (o las acciones que se pidan), como tarjetas que se encienden. Cada una
// espera en gris y se enciende cuando la dices.
export const Acciones: React.FC<{
	i: number;
	f: number;
	items: {icono: string; texto: string; en: number; estado?: Estado; relleno?: boolean}[];
	salida?: number;
}> = ({i, f, items, salida = 0.18}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const HUECO = 20;
	const ancho = (ZONA.ancho - HUECO * (items.length - 1)) / items.length;
	const sal = salida > 0 ? 1 - rampa(t, f - salida, f) : 1;
	return (
		<>
			{items.map((it, k) => {
				const e = resorte(t, i + k * 0.09, fps);
				const on = enciende(t, it.en, fps);
				const lit = on > 0.5;
				const est = ESTADO[it.estado ?? 'blue'];
				const azul = (it.estado ?? 'blue') === 'blue';
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: ZONA.x + k * (ancho + HUECO),
							top: ZONA.top,
							width: ancho,
							height: 300,
							boxSizing: 'border-box',
							borderRadius: 28,
							background: lit ? (azul ? D.tarjetaSel : `linear-gradient(${est.fondo}, ${est.fondo}), ${D.tarjeta}`) : D.tarjeta,
							border: `1.5px solid ${lit ? (azul ? D.bordeSel : est.borde) : D.bordeVideo}`,
							boxShadow: lit ? `0 0 0 1px ${azul ? 'rgba(75,140,247,.22)' : est.fondo}, 0 26px 70px -26px ${est.punto}, ${D.sombraVideo}` : D.sombraVideo,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							opacity: Math.min(1, e * 1.5) * sal,
							transform: `translateY(${(1 - e) * 44}px) scale(${latido(on)})`,
						}}
					>
						<div
							style={{
								marginTop: 44,
								width: 132,
								height: 132,
								borderRadius: 32,
								background: lit ? (azul ? D.icoFondo : est.fondo) : D.icoFondoOff,
								border: `1.5px solid ${lit ? (azul ? D.icoBorde : est.borde) : C.line2}`,
								display: 'grid',
								placeItems: 'center',
							}}
						>
							<Ico nombre={it.icono} size={74} color={lit ? est.punto : C.dim} grosor={2} relleno={lit && it.relleno ? est.punto : 'none'} />
						</div>
						<span style={{...tituloFicha(ajustar(it.texto, ancho - 56, TXT.rotulo) , {letterSpacing: '.1em'}), marginTop: 32, color: lit ? C.text : D.tituloOff}}>{it.texto}</span>
					</div>
				);
			})}
		</>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Lista: de 2 a 4 filas (ventajas, pasos, requisitos, tareas) en una tarjeta. Las filas se ven desde el principio,
// apagadas, y cada una se enciende con su visto bueno cuando se dice. Con 4 filas quedan más bajas (71 px con título).
export const Lista: React.FC<{
	i: number;
	f: number;
	titulo?: string;
	icono?: string;
	logo?: string; // logo en la cabecera, en vez del icono
	items: {icono?: string; logo?: string; texto: string; sub?: string; en: number}[];
	numeros?: boolean; // "1", "2", "3" en vez de icono (pasos)
	salida?: number;
	logos: Logos;
}> = ({i, f, titulo, icono = 'check', logo, items, numeros, salida, logos}) => {
	const {t, fps} = useT();
	const cab = titulo ? 112 : 26;
	const conSub = items.some((it) => it.sub);
	const HUECO = 12;
	const ALTO_FILA = Math.min(conSub ? 108 : 94, Math.floor((458 - cab - 24 - (items.length - 1) * HUECO) / items.length));
	const ico = ALTO_FILA - (ALTO_FILA < 80 ? 14 : 26); // en filas bajas el icono ocupa casi toda la altura
	const margen = (ALTO_FILA - ico) / 2;
	const anchoTexto = UTIL_DER - ico - 22 - 76;
	return (
		<Ficha i={i} f={f} alto={cab + items.length * ALTO_FILA + (items.length - 1) * HUECO + 24} salida={salida}>
			{titulo ? <Cabecera icono={logo ? undefined : icono} logo={logo ? logos[logo] : undefined} titulo={titulo} tam={ajustar(titulo, 640, 32)} /> : null}
			{items.map((it, k) => {
				const on = enciende(t, it.en, fps);
				const lit = on > 0.5;
				const trazo = sale(rampa(t, it.en + 0.1, it.en + 0.4));
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: ZONA.pad - 14,
							right: ZONA.pad - 14,
							top: cab + k * (ALTO_FILA + HUECO),
							height: ALTO_FILA,
							boxSizing: 'border-box',
							borderRadius: 22,
							background: lit ? D.tarjetaSel : D.hueco,
							border: `1.5px solid ${lit ? D.bordeSel : C.line2}`,
							transform: `scale(${latido(on, 0.025)})`,
						}}
					>
						{numeros ? (
							<div style={{position: 'absolute', left: margen, top: margen, width: ico, height: ico, borderRadius: ico * 0.23, background: lit ? D.icoFondo : D.icoFondoOff, border: `1.5px solid ${lit ? D.icoBorde : C.line2}`, display: 'grid', placeItems: 'center'}}>
								<span style={titular(ico * 0.56, {color: lit ? C.blue : C.dim})}>{k + 1}</span>
							</div>
						) : (
							<IcoCuadro size={ico} icono={it.icono ?? (it.logo ? undefined : 'check')} logo={it.logo ? logos[it.logo] : undefined} on={clamp01(on)} style={{position: 'absolute', left: margen, top: margen}} />
						)}
						<span
							style={{
								position: 'absolute',
								left: margen + ico + 22,
								top: it.sub ? ALTO_FILA / 2 - 44 : ALTO_FILA / 2 - 25,
								fontFamily: SANS,
								fontSize: Math.min(40, Math.floor(anchoTexto / (it.texto.length * 0.54))),
								fontWeight: 800,
								letterSpacing: '-.012em',
								whiteSpace: 'nowrap',
								color: lit ? C.text : D.tituloOff,
							}}
						>
							{it.texto}
						</span>
						{it.sub ? <span style={{position: 'absolute', left: margen + ico + 22, top: ALTO_FILA / 2 + 8, ...cuerpo(TXT.min, {color: lit ? C.muted : C.dim})}}>{it.sub}</span> : null}
						<div style={{position: 'absolute', right: ZONA.padDer - (ZONA.pad - 14), top: ALTO_FILA / 2 - 26}}>
							<Cerrojo size={52} on={clamp01(on)} trazo={trazo} />
						</div>
					</div>
				);
			})}
		</Ficha>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Logos: de 2 a 4 herramientas en fila. Los huecos esperan vacíos y cada logo salta al nombrarlo, con su nombre
// debajo. Para "herramientas como X, Y y Z".
export const Logos: React.FC<{
	i: number;
	f: number;
	rotulo?: string;
	items: {logo: string; nombre?: string; en: number}[];
	salida?: number;
	logos: Logos;
}> = ({i, f, rotulo: etiqueta, items, salida, logos}) => {
	const {t, fps} = useT();
	const TAM = items.length >= 4 ? 132 : 150;
	const HUECO = items.length >= 4 ? 52 : 76;
	const conNombre = items.some((it) => it.nombre);
	const total = items.length * TAM + (items.length - 1) * HUECO;
	const x0 = (ZONA.ancho - total) / 2;
	const y0 = etiqueta ? 84 : 34;
	return (
		<Ficha i={i} f={f} alto={y0 + TAM + (conNombre ? 62 : 0) + 34} salida={salida}>
			{etiqueta ? <span style={{position: 'absolute', left: ZONA.pad, top: 30, ...rotulo(TXT.rotulo, {letterSpacing: '.22em'})}}>{etiqueta}</span> : null}
			{items.map((it, k) => {
				const on = resorte(t, it.en, fps, {damping: 11, stiffness: 220, mass: 0.7});
				const x = x0 + k * (TAM + HUECO);
				return (
					<React.Fragment key={k}>
						<div style={{position: 'absolute', left: x, top: y0, width: TAM, height: TAM, boxSizing: 'border-box', borderRadius: TAM * 0.23, border: `1.5px dashed ${C.line2}`, opacity: 1 - clamp01(on * 2)}} />
						<div style={{position: 'absolute', left: x, top: y0, opacity: clamp01(on * 1.8), transform: `scale(${0.55 + 0.45 * on})`}}>
							<IcoCuadro size={TAM} logo={logos[it.logo]} style={{background: D.pastilla, borderColor: 'rgba(243,245,249,.3)'}} />
						</div>
						{it.nombre ? (
							<span
								style={{
									position: 'absolute',
									left: x - HUECO / 2 + 4,
									width: TAM + HUECO - 8,
									top: y0 + TAM + 18,
									textAlign: 'center',
									...tituloFicha(ajustar(it.nombre, TAM + HUECO - 8, TXT.rotulo), {letterSpacing: '.04em'}),
									opacity: clamp01(on * 1.6),
								}}
							>
								{it.nombre}
							</span>
						) : null}
					</React.Fragment>
				);
			})}
		</Ficha>
	);
};
