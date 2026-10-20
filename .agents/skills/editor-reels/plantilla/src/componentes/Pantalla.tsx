import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, interpolate, spring, staticFile} from 'remotion';
import {C, PANTALLA, acento, acento2} from '../tema';
import {CaraBase, FuentePantalla, Vista} from '../tipos';
import {CLAMP, useT} from './comun';

type Props = {
	i: number;
	f: number;
	vistas: Vista[];
	cara?: boolean;
	empuje?: number;
	entra?: boolean;
	sale?: boolean;
	fuente?: FuentePantalla;
	base: string;
	caraBase?: CaraBase;
};

const suave = Easing.inOut(Easing.cubic);

// Zona de la pantalla que se ve en t: se queda en cada vista y viaja a la siguiente entre "en" y "en + dur".
// El empuje (un zoom muy lento durante toda la pieza) evita que la imagen parezca congelada.
const zonaEn = (t: number, i: number, f: number, vistas: Vista[], empuje: number, W: number, H: number) => {
	let {x, y, w, h} = vistas[0];
	for (const v of vistas.slice(1)) {
		const p = suave(Math.min(1, Math.max(0, (t - (v.en ?? i)) / (v.dur ?? 0.7))));
		if (p <= 0) break;
		x += (v.x - x) * p;
		y += (v.y - y) * p;
		w += (v.w - w) * p;
		h += (v.h - h) * p;
	}
	const z = 1 - empuje * Math.min(1, Math.max(0, (t - i) / Math.max(0.001, f - i)));
	const cx = x + w / 2;
	const cy = y + h / 2;
	w *= z;
	h *= z;
	return {x: Math.min(Math.max(0, cx - w / 2), W - w), y: Math.min(Math.max(0, cy - h / 2), H - h), w, h};
};

// Grabaciones dobles: un recorte de la pantalla en una tarjeta grande que sustituye a la cara mientras dura,
// y la cara en una burbuja arriba a la derecha para que la persona no desaparezca.
export const Pantalla: React.FC<Props> = ({
	i,
	f,
	vistas,
	cara = true,
	empuje = 0.04,
	entra = true,
	sale = true,
	fuente,
	base,
	caraBase,
}) => {
	const {t, fps} = useT();
	if (t < i || t >= f || !fuente || !vistas.length) return null;
	const lf = (t - i) * fps;
	const e = entra ? spring({frame: lf, fps, config: {damping: 16, stiffness: 150}}) : 1;
	const b = entra ? spring({frame: lf - 4, fps, config: {damping: 12, stiffness: 170, mass: 0.7}}) : 1;
	const fondoOp = entra ? interpolate(t, [i, i + 0.2], [0, 1], CLAMP) : 1;
	const s = sale ? interpolate(t, [f - 0.18, f], [1, 0], CLAMP) : 1;

	const z = zonaEn(t, i, f, vistas, empuje, fuente.ancho, fuente.alto);
	const r = z.w / z.h;
	const cw = Math.min(PANTALLA.ancho, PANTALLA.alto * r);
	const ch = cw / r;
	const k = cw / z.w;

	const D = PANTALLA.burbuja.d;
	let burbuja: React.ReactNode = null;
	if (cara && caraBase) {
		// La cabeza ocupa ~80 % de la burbuja; nunca se ve el borde del vídeo
		const kb = (D * 0.8) / caraBase.lado;
		const vw = caraBase.ancho * kb;
		const vh = caraBase.alto * kb;
		const vx = Math.min(0, Math.max(D - vw, D / 2 - caraBase.cx * kb));
		const vy = Math.min(0, Math.max(D - vh, D / 2 - (caraBase.cy + caraBase.lado * 0.08) * kb));
		burbuja = (
			<div
				style={{
					position: 'absolute',
					left: PANTALLA.burbuja.x - D / 2,
					top: PANTALLA.burbuja.y - D / 2,
					width: D,
					height: D,
					borderRadius: '50%',
					overflow: 'hidden',
					background: C.card,
					boxShadow: `0 0 0 4px ${C.blue}, 0 0 0 10px ${acento(0.14)}, 0 26px 70px -18px ${acento2(0.7)}`,
					transform: `scale(${0.6 + 0.4 * b})`,
					opacity: Math.min(1, b * 1.6) * s,
				}}
			>
				<OffthreadVideo src={staticFile(base)} muted style={{position: 'absolute', left: vx, top: vy, width: vw, height: vh, maxWidth: 'none'}} />
			</div>
		);
	}

	return (
		<AbsoluteFill>
			<AbsoluteFill
				style={{
					backgroundColor: C.bg,
					backgroundImage: `radial-gradient(85% 50% at 50% 46%, ${acento2(0.16)} 0%, ${acento2(0)} 70%)`,
					opacity: fondoOp * s,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 540 - cw / 2,
					top: PANTALLA.top + (PANTALLA.alto - ch) / 2,
					width: cw,
					height: ch,
					borderRadius: 26,
					overflow: 'hidden',
					background: C.bg,
					boxShadow: `0 0 0 2px ${C.line2}, 0 0 0 3px ${acento(0.1)}, 0 44px 110px -34px rgba(0,0,0,.95), 0 30px 90px -44px ${acento2(0.55)}`,
					transform: `translateY(${(1 - e) * 70}px) scale(${(0.92 + 0.08 * e) * (0.97 + 0.03 * s)})`,
					opacity: Math.min(1, e * 1.6) * s,
				}}
			>
				<OffthreadVideo
					src={staticFile(fuente.src)}
					muted
					style={{position: 'absolute', left: -z.x * k, top: -z.y * k, width: fuente.ancho * k, height: fuente.alto * k, maxWidth: 'none'}}
				/>
			</div>
			{burbuja}
		</AbsoluteFill>
	);
};
