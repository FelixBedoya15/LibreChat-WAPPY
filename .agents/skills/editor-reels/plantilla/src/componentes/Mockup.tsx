import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {C, ZONA, acento, fontFamily, tarjetaActiva} from '../tema';
import {Icono} from '../iconos';
import {CLAMP, useT} from './comun';

export type ContenidoMockup = {
	titular: string; // primera línea del titular de la app
	destacado: string; // segunda línea, en color de acento
	texto: string; // subtítulo gris
	boton: string;
	campos: string[]; // campos del formulario (2)
	total: number; // cifra a la que llega el contador
	moneda: string;
	menu: string;
	tarjetas: {icono: string; texto: string}[]; // 3 tarjetas de abajo (las que se encienden)
};

type Props = {
	i: number;
	f: number;
	appEn: number; // cuándo el boceto se convierte en aplicación (999 = solo boceto)
	titulo: string; // texto de la barra de direcciones
	totalEn?: number; // cuándo arranca el contador
	resaltes?: {en: number; k: number}[]; // qué tarjeta se ilumina y cuándo
	contenido?: Partial<ContenidoMockup>;
};

const DEFECTO: ContenidoMockup = {
	titular: 'Tu presupuesto',
	destacado: 'en 1 minuto',
	texto: 'Rellena el formulario y recibe tu precio',
	boton: 'Calcular →',
	campos: ['Nombre', 'Metros²'],
	total: 1250,
	moneda: '€',
	menu: 'Inicio · Servicios · Contacto',
	tarjetas: [
		{icono: 'form', texto: 'Formulario'},
		{icono: 'git', texto: 'Lógica'},
		{icono: 'euro', texto: 'Presupuesto'},
	],
};

const W = 800;
const H = 350;
const ESCALA = 0.93; // cabe entero en la zona de gráficos sin acercarse a la barbilla

// Ventana de navegador: primero un boceto (diseño) que se dibuja solo; luego se convierte en una app real.
export const Mockup: React.FC<Props> = ({i, f, appEn, titulo, totalEn, resaltes = [], contenido}) => {
	const {t, fps} = useT();
	const c = {...DEFECTO, ...contenido};
	if (t < i || t >= f) return null;
	const lf = (t - i) * fps;
	const e = spring({frame: lf, fps, config: {damping: 16, stiffness: 150}});
	const salida = interpolate(t, [f - 0.2, f], [1, 0], CLAMP);
	const app = interpolate(t, [appEn, appEn + 0.4], [0, 1], CLAMP);
	const bloque = (k: number) => interpolate(lf, [6 + k * 3.5, 14 + k * 3.5], [0, 1], {easing: Easing.out(Easing.cubic), ...CLAMP});
	const total = totalEn !== undefined ? interpolate(t, [totalEn, totalEn + 0.9], [0, c.total], {easing: Easing.out(Easing.cubic), ...CLAMP}) : 0;
	const encendida = (k: number) => {
		const r = resaltes.find((x) => x.k === k);
		return r && t >= r.en ? spring({frame: (t - r.en) * fps, fps, config: {damping: 10, stiffness: 220, mass: 0.6}}) : 0;
	};

	const wire = (x: number, y: number, w: number, h: number, k: number, radio = 8) => (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: radio,
				background: '#161c26',
				border: '1px dashed #2f3a4d',
				transform: `scaleX(${bloque(k)})`,
				transformOrigin: 'left center',
			}}
		/>
	);

	return (
		<div
			style={{
				position: 'absolute',
				left: 540 - W / 2,
				top: ZONA.cy - H / 2,
				width: W,
				height: H,
				transform: `translateY(${(1 - e) * 50}px) scale(${ESCALA * (0.92 + 0.08 * e)})`,
				opacity: Math.min(1, e * 1.5) * salida,
				borderRadius: 22,
				overflow: 'hidden',
				background: '#0b1017',
				border: `1px solid ${C.line2}`,
				boxShadow: `0 40px 100px -30px rgba(0,0,0,.9), 0 0 0 1px ${acento(0.1)}`,
				fontFamily,
			}}
		>
			<div style={{height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#0f141c', borderBottom: `1px solid ${C.line}`}}>
				{[C.red, C.amber, C.green].map((c) => (
					<div key={c} style={{width: 12, height: 12, borderRadius: 6, background: c, opacity: 0.8}} />
				))}
				<div
					style={{
						marginLeft: 16,
						flex: 1,
						height: 24,
						borderRadius: 12,
						background: '#151b25',
						color: C.dim,
						fontSize: 16,
						fontWeight: 600,
						display: 'flex',
						alignItems: 'center',
						paddingLeft: 14,
					}}
				>
					{titulo}
				</div>
			</div>
			<div style={{position: 'relative', height: H - 44}}>
				{/* Boceto */}
				<div style={{position: 'absolute', inset: 0, opacity: 1 - app}}>
					{wire(24, 16, 26, 26, 0, 13)}
					{wire(560, 24, 56, 10, 1)}
					{wire(630, 24, 56, 10, 1)}
					{wire(700, 24, 56, 10, 1)}
					{wire(40, 66, 420, 32, 2)}
					{wire(40, 108, 300, 32, 3)}
					{wire(40, 158, 360, 14, 4)}
					{wire(40, 188, 164, 42, 5, 21)}
					{wire(496, 60, 264, 158, 6, 14)}
					{wire(40, 246, 220, 52, 7, 12)}
					{wire(290, 246, 220, 52, 8, 12)}
					{wire(540, 246, 220, 52, 9, 12)}
				</div>
				{/* Aplicación */}
				<div style={{position: 'absolute', inset: 0, opacity: app}}>
					<div style={{position: 'absolute', left: 24, top: 16, width: 26, height: 26, borderRadius: 13, background: `linear-gradient(135deg, ${C.blue}, ${C.blue2})`}} />
					<div style={{position: 'absolute', left: 540, top: 19, fontSize: 16, fontWeight: 700, color: C.muted, letterSpacing: '.04em'}}>
						{c.menu}
					</div>
					<div style={{position: 'absolute', left: 40, top: 60, width: 440, fontSize: 38, fontWeight: 900, color: C.text, lineHeight: 1.1, letterSpacing: '-.01em'}}>
						{c.titular}
						<br />
						<span style={{color: C.blue}}>{c.destacado}</span>
					</div>
					<div style={{position: 'absolute', left: 40, top: 154, fontSize: 18, fontWeight: 600, color: C.muted}}>
						{c.texto}
					</div>
					<div
						style={{
							position: 'absolute',
							left: 40,
							top: 188,
							width: 164,
							height: 42,
							borderRadius: 21,
							background: C.blue,
							color: '#fff',
							fontSize: 17,
							fontWeight: 800,
							display: 'grid',
							placeItems: 'center',
							letterSpacing: '.04em',
						}}
					>
						{c.boton}
					</div>
					<div
						style={{
							position: 'absolute',
							left: 496,
							top: 60,
							width: 264,
							height: 158,
							borderRadius: 14,
							background: '#10161f',
							border: `1px solid ${C.line2}`,
							padding: '14px 16px',
							boxSizing: 'border-box',
						}}
					>
						{c.campos.slice(0, 2).map((campo) => (
							<div
								key={campo}
								style={{
									height: 30,
									borderRadius: 8,
									background: '#0a0e14',
									border: `1px solid ${C.line2}`,
									marginBottom: 10,
									fontSize: 15,
									fontWeight: 600,
									color: C.dim,
									display: 'flex',
									alignItems: 'center',
									paddingLeft: 10,
								}}
							>
								{campo}
							</div>
						))}
						<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6}}>
							<span style={{fontSize: 15, fontWeight: 800, color: C.muted, letterSpacing: '.08em'}}>TOTAL</span>
							<span style={{fontSize: 34, fontWeight: 900, color: totalEn !== undefined && t >= totalEn ? C.green : C.text}}>
								{Math.round(total).toLocaleString('es-ES')}&nbsp;{c.moneda}
							</span>
						</div>
					</div>
					{c.tarjetas.slice(0, 3).map((tj, k) => {
						const on = encendida(k);
						return (
							<div
								key={tj.texto}
								style={{
									position: 'absolute',
									left: 40 + k * 250,
									top: 246,
									width: 220,
									height: 52,
									borderRadius: 12,
									background: on > 0 ? tarjetaActiva : '#10161f',
									border: on > 0 ? `2px solid ${acento(0.8)}` : `1px solid ${C.line2}`,
									boxShadow: on > 0 ? `0 0 ${30 * on}px -4px ${acento(0.8)}` : 'none',
									display: 'flex',
									alignItems: 'center',
									gap: 10,
									paddingLeft: 14,
									boxSizing: 'border-box',
									transform: `scale(${on > 0 ? interpolate(on, [0, 1], [1.12, 1]) : 1})`,
									fontSize: 19,
									fontWeight: 800,
									color: on > 0 ? C.text : C.muted,
									letterSpacing: '.04em',
								}}
							>
								<Icono nombre={tj.icono} size={24} color={on > 0 ? C.blue : C.dim} />
								{tj.texto}
							</div>
						);
					})}
				</div>
				{app > 0 && app < 1 ? (
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: `${app * 100}%`,
							height: 4,
							background: `linear-gradient(90deg, transparent, ${C.blue}, transparent)`,
							boxShadow: `0 0 24px ${C.blue}`,
						}}
					/>
				) : null}
			</div>
		</div>
	);
};
