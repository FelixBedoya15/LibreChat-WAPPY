import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, acento, acento2} from '../tema';
import {useT} from '../componentes/comun';
import {Candado, Ico} from './iconos';
import {
	D,
	ESCENA,
	ESTADO,
	Estado,
	H,
	SANS,
	TXT,
	W,
	ZONA,
	anchoEm,
	clamp01,
	cuerpo,
	entraSale,
	rampa,
	resorte,
	sale,
	titular,
	tituloFicha,
	vida,
} from './sistema';

// Bloques con los que se montan las piezas "pro". Una pieza nueva se hace combinándolos (ver references/guion-pro.md).

// ---------------------------------------------------------------------------------------------------------------
// Fondo de las escenas a pantalla completa: el de las presentaciones DominIA. Casi negro, limpio, con un resplandor
// violeta suave arriba a la izquierda y uno del color de acento, muy tenue, arriba a la derecha.
export const Fondo: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: C.bg}}>
		<AbsoluteFill
			style={{
				background: `radial-gradient(1000px 900px at 0% 6%, rgba(109,40,217,.22), transparent 62%), radial-gradient(1000px 900px at 100% 8%, ${acento2(0.1)}, transparent 60%)`,
			}}
		/>
	</AbsoluteFill>
);

// ---------------------------------------------------------------------------------------------------------------
// Escena a pantalla completa. Entra como una cortina que sube con un filo de luz y se va recogiéndose hacia arriba.
// Empieza antes del corte para que el cambio de plano quede tapado: con 0,18 s, en el fotograma del corte la
// cortina ya ha pasado de la cabeza (con 0,1 s asomaba un fotograma la frente del plano siguiente).
const ANTES = 0.18;
const DUR_ENTRA = 0.34;
const DUR_SALE = 0.3;
export const Escena: React.FC<{i: number; f: number; children: React.ReactNode}> = ({i, f, children}) => {
	const {t} = useT();
	const t0 = i < 0.05 ? i - 10 : i - ANTES; // desde el segundo 0 se ve entera
	const t1 = f - 0.06;
	if (t < t0 || t >= t1 + DUR_SALE) return null;
	const p = sale(rampa(t, t0, t0 + DUR_ENTRA));
	const q = entraSale(rampa(t, t1, t1 + DUR_SALE));
	const arriba = (1 - p) * 100; // % oculto por arriba mientras entra
	const abajo = q * 100; // % oculto por abajo mientras sale
	const filoY = q > 0 ? (1 - q) * H : (1 - p) * H;
	const filoOp = q > 0 ? Math.sin(Math.PI * clamp01(q)) : p < 1 ? 1 : 0;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{clipPath: `inset(${arriba}% 0 ${abajo}% 0)`}}>
				<Fondo />
				<AbsoluteFill style={{transform: `translateY(${(1 - p) * 60 - q * 40}px)`}}>{children}</AbsoluteFill>
			</AbsoluteFill>
			{filoOp > 0.01 ? (
				<div
					style={{
						position: 'absolute',
						left: 0,
						width: W,
						top: filoY - 3,
						height: 6,
						background: `linear-gradient(90deg, transparent, ${C.blue3} 20%, #fff 50%, ${C.blue3} 80%, transparent)`,
						boxShadow: `0 0 40px 10px ${acento(0.55)}`,
						opacity: filoOp,
					}}
				/>
			) : null}
		</AbsoluteFill>
	);
};

// Titular de escena: mayúsculas enormes, blanco con la palabra clave en el color de acento. Una o dos líneas,
// centrado. En el guion se escribe "¿CUÁNTO *CUESTA*?" (asteriscos = acento, \n = salto de línea).
export type Trozo = {t: string; azul?: boolean};
const tamTitulo = (lineas: Trozo[][], max: number) => {
	const ancho = ESCENA.der - ESCENA.izq - 40;
	return Math.min(max, ...lineas.map((l) => Math.floor(ancho / anchoEm(l.map((x) => x.t).join('').toUpperCase()))));
};
export const altoTitulo = (lineas: Trozo[][], max = 100) => tamTitulo(lineas, max) * 1.02 * lineas.length;
export const TituloEscena: React.FC<{lineas: Trozo[][]; en: number; top?: number; max?: number}> = ({lineas, en, top = ESCENA.top, max = 100}) => {
	const {t, fps} = useT();
	const tam = tamTitulo(lineas, max);
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
			{lineas.map((l, k) => {
				const e = resorte(t, en + k * 0.12, fps, {damping: 16, stiffness: 170});
				return (
					<span key={k} style={{...titular(tam, {color: C.text, lineHeight: 1.02, whiteSpace: 'pre'}), opacity: clamp01(e * 1.5), transform: `translateY(${(1 - e) * 26}px)`}}>
						{l.map((x, j) => (
							<span key={j} style={x.azul ? {color: C.blue} : undefined}>
								{x.t}
							</span>
						))}
					</span>
				);
			})}
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Cuadrado de icono o de logo, como en las tarjetas DominIA. "on" 0 = apagado (gris), 1 = activo.
export const IcoCuadro: React.FC<{
	size: number;
	icono?: string;
	logo?: string;
	on?: number;
	estado?: Estado;
	style?: React.CSSProperties;
}> = ({size, icono, logo, on = 1, estado = 'blue', style}) => {
	const lit = on > 0.5;
	const e = ESTADO[estado];
	const azul = estado === 'blue';
	return (
		<div
			style={{
				width: size,
				height: size,
				flex: '0 0 auto',
				borderRadius: size * 0.23,
				background: lit ? (azul ? D.icoFondo : e.fondo) : D.icoFondoOff,
				border: `1.5px solid ${lit ? (azul ? D.icoBorde : e.borde) : C.line2}`,
				display: 'grid',
				placeItems: 'center',
				...style,
			}}
		>
			{logo ? (
				<Img
					src={staticFile(logo)}
					style={{width: size * 0.58, height: size * 0.58, objectFit: 'contain', opacity: lit ? 1 : 0.35, filter: lit ? 'none' : 'grayscale(1)'}}
				/>
			) : icono ? (
				<Ico nombre={icono} size={size * 0.5} color={lit ? e.punto : C.dim} grosor={2} />
			) : null}
		</div>
	);
};

// Pastilla de estado con punto ("● AHORA", "● SIN FECHA")
export const Chip: React.FC<{texto: string; estado?: Estado; tam?: number; icono?: string; style?: React.CSSProperties}> = ({
	texto,
	estado = 'blue',
	tam = TXT.min,
	icono,
	style,
}) => {
	const e = ESTADO[estado];
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: tam * 0.42,
				height: tam * 1.9,
				padding: `0 ${tam * 0.75}px`,
				borderRadius: 999,
				border: `1.5px solid ${e.borde}`,
				background: `linear-gradient(${e.fondo}, ${e.fondo}), #0c1118`,
				color: e.texto,
				fontFamily: SANS,
				fontSize: tam,
				fontWeight: 800,
				letterSpacing: '.08em',
				textTransform: 'uppercase',
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			{icono ? (
				<Ico nombre={icono} size={tam * 1.05} color={e.punto} grosor={2.4} />
			) : (
				<span style={{width: tam * 0.42, height: tam * 0.42, borderRadius: '50%', background: e.punto, boxShadow: `0 0 12px ${e.punto}`}} />
			)}
			{texto}
		</span>
	);
};

// Pastilla rectangular con logo o icono y un nombre ("API", "PLAN ULTRA", "ANTHROPIC"). Con "on" < 0,5 espera
// apagada (gris, logo atenuado) y se enciende al nombrarla.
export const Pastilla: React.FC<{
	texto: string;
	alto: number;
	tam: number;
	logo?: string;
	icono?: string;
	on?: number;
	azul?: boolean;
	style?: React.CSSProperties;
}> = ({texto, alto, tam, logo, icono, on = 1, azul, style}) => {
	const lit = on > 0.5;
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: alto * 0.16,
				height: alto,
				boxSizing: 'border-box',
				padding: `0 ${alto * 0.28}px 0 ${alto * 0.13}px`,
				borderRadius: alto * 0.24,
				background: lit ? (azul ? `linear-gradient(${D.pastillaAzul}, ${D.pastillaAzul}), ${D.pastilla}` : D.pastilla) : 'rgba(18,24,35,.6)',
				border: `1.5px solid ${lit ? (azul ? D.pastillaAzulBorde : 'rgba(243,245,249,.38)') : C.line2}`,
				boxShadow: lit && azul ? `0 0 44px -10px ${acento(0.7)}` : 'none',
				...style,
			}}
		>
			<IcoCuadro size={alto * 0.74} logo={logo} icono={icono} on={on} />
			<span style={{fontFamily: SANS, fontSize: tam, fontWeight: 800, letterSpacing: '-.005em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: lit ? C.text : D.tituloOff}}>
				{texto}
			</span>
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Tarjeta DominIA sobre la grabación (plano de cara): oscura y sólida, con borde fino. Va sobre el pecho.
// "sel" (0–1) la enciende como una tarjeta seleccionada; "alto" puede animarse (la tarjeta crece).
// "salida": segundos de fundido al irse (0 = sin fundido: la tapa la cortina de la escena siguiente).
export const Ficha: React.FC<{
	i: number;
	f: number;
	alto: number;
	top?: number;
	sel?: number;
	borde?: string;
	salida?: number;
	children: React.ReactNode;
}> = ({i, f, alto, top = ZONA.top, sel = 0, borde, salida, children}) => {
	const {t, fps} = useT();
	if (t < i || t >= f) return null;
	const {e, s, op} = vida(t, i, f, fps, salida);
	const lit = sel > 0.5;
	return (
		<div
			style={{
				position: 'absolute',
				left: ZONA.x,
				top,
				width: ZONA.ancho,
				height: alto,
				boxSizing: 'border-box',
				borderRadius: 28,
				background: lit ? D.tarjetaSel : D.tarjeta,
				border: `1.5px solid ${borde ?? (lit ? D.bordeSel : D.bordeVideo)}`,
				boxShadow: lit ? `${D.sombraSel}, ${D.sombraVideo}` : D.sombraVideo,
				opacity: op,
				transform: `translateY(${(1 - e) * 44 + (1 - s) * 12}px)`,
				overflow: 'hidden',
			}}
		>
			{children}
		</div>
	);
};

// Cabecera de una tarjeta: icono en su cuadrado, título en mayúsculas espaciadas y, a la derecha, lo que haga falta
// (la unidad del dato o una pastilla de estado).
export const Cabecera: React.FC<{
	titulo: string;
	icono?: string;
	logo?: string;
	estado?: Estado;
	derecha?: React.ReactNode;
	tam?: number;
}> = ({titulo, icono, logo, estado = 'blue', derecha, tam = 32}) => (
	<div style={{position: 'absolute', left: ZONA.pad, right: 56, top: 24, height: 68, display: 'flex', alignItems: 'center', gap: 20}}>
		<IcoCuadro size={68} icono={icono} logo={logo} estado={estado} />
		<span style={tituloFicha(tam)}>{titulo}</span>
		<span style={{marginLeft: 'auto', display: 'flex', alignItems: 'center'}}>{derecha}</span>
	</div>
);

// Pie de una pieza: la fuente del dato o la unidad, en frase normal ("Datos: Google"). Nunca por debajo de 26 px.
export const Pie: React.FC<{texto: string; style?: React.CSSProperties}> = ({texto, style}) => (
	<span style={{...cuerpo(TXT.min, {color: '#9aa4b5'}), ...style}}>{texto}</span>
);

// Sombra suave detrás de un texto grande que va directamente sobre la grabación (titulares, sentencias)
export const Placa: React.FC<{top: number; alto: number; fuerza?: number}> = ({top, alto, fuerza = 0.72}) => (
	<div
		style={{
			position: 'absolute',
			left: -80,
			right: -80,
			top: top - 90,
			height: alto + 180,
			background: `radial-gradient(ellipse 58% 50% at 50% 50%, rgba(6,8,13,${fuerza}) 0%, rgba(6,8,13,${fuerza * 0.75}) 45%, rgba(6,8,13,0) 100%)`,
		}}
	/>
);

// Estado de una fila o tarjeta que se enciende al nombrarla: aro vacío mientras espera → visto bueno verde.
// (Sin candado mientras espera: bajo una pregunta como "¿quién puede usarlo?" un candado se lee como "no".)
// "bloqueado" la deja en rojo con un candado: lo que se queda fuera.
export const Cerrojo: React.FC<{size: number; on: number; trazo: number; bloqueado?: boolean}> = ({size, on, trazo, bloqueado}) => {
	const lit = on > 0.5;
	if (bloqueado) {
		return (
			<div style={{width: size, height: size, flex: '0 0 auto', borderRadius: '50%', border: `2px solid ${ESTADO.red.borde}`, background: ESTADO.red.fondo, display: 'grid', placeItems: 'center'}}>
				<Candado size={size * 0.52} color={C.red} p={1} grosor={2.2} />
			</div>
		);
	}
	return (
		<div
			style={{
				width: size,
				height: size,
				flex: '0 0 auto',
				borderRadius: '50%',
				border: `2.5px solid ${lit ? C.green : C.line2}`,
				background: lit ? 'rgba(52,211,153,.14)' : 'transparent',
				boxShadow: lit ? '0 0 34px -4px rgba(52,211,153,.6)' : 'none',
				display: 'grid',
				placeItems: 'center',
			}}
		>
			{lit ? (
				<svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
					<path d="M20 6 9 17l-5-5" strokeDasharray={24} strokeDashoffset={24 * (1 - trazo)} />
				</svg>
			) : null}
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------------------
// Ventana de navegador con una captura real dentro: la barra de direcciones dice de dónde sale (es la fuente).
// "entra" (0–1) la sube desde abajo, recta (nada inclinado); "scroll" (0–1) desplaza la página; "escala" es un empuje lento.
export type Captura = {src: string; ancho: number; alto: number; dominio: string; ruta?: string; scrollEn?: number; scrollDur?: number};
export const Ventana: React.FC<{x: number; y: number; w: number; h: number; captura: Captura; entra?: number; scroll?: number; escala?: number}> = ({
	x,
	y,
	w,
	h,
	captura,
	entra = 1,
	scroll = 0,
	escala = 1,
}) => {
	const BARRA = 68;
	const altoImg = (captura.alto * w) / captura.ancho;
	const visto = h - BARRA;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 30,
					overflow: 'hidden',
					border: `1.5px solid ${D.bordeSel}`,
					boxShadow: `0 60px 130px -40px ${acento2(0.75)}, 0 0 0 1px rgba(255,255,255,.04)`,
					background: '#eaf3fe',
					opacity: clamp01(entra * 1.5),
					transform: `translateY(${(1 - entra) * 110}px) scale(${escala * (0.94 + 0.06 * Math.min(1, entra))})`,
					transformOrigin: '50% 100%',
				}}
			>
				<div style={{position: 'absolute', left: 0, right: 0, top: BARRA, height: visto, overflow: 'hidden'}}>
					<Img src={staticFile(captura.src)} style={{position: 'absolute', left: 0, top: 0, width: w, height: altoImg, transform: `translateY(${-Math.max(0, altoImg - visto) * scroll}px)`}} />
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: BARRA, background: '#0f141d', borderBottom: `1.5px solid ${C.line2}`, display: 'flex', alignItems: 'center', gap: 18, padding: '0 22px'}}>
					<span style={{display: 'flex', gap: 9}}>
						{[0, 1, 2].map((k) => (
							<span key={k} style={{width: 15, height: 15, borderRadius: '50%', background: C.line2}} />
						))}
					</span>
					<span style={{flex: 1, height: 46, borderRadius: 23, background: '#1a2130', border: `1px solid ${C.line2}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', overflow: 'hidden'}}>
						<Candado size={23} color={C.green} p={1} grosor={2.4} />
						<span style={{fontFamily: SANS, fontSize: 27, fontWeight: 700, color: C.text, whiteSpace: 'nowrap'}}>
							{captura.dominio}
							{captura.ruta ? <span style={{color: C.muted, fontWeight: 600}}>{captura.ruta}</span> : null}
						</span>
					</span>
				</div>
			</div>
		</div>
	);
};
