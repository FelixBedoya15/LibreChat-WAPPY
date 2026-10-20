import React from 'react';

// Iconos lineales del sistema DominIA (24x24, trazo 2, extremos redondeados).
// La mayoría vienen del sprite de las presentaciones; los que faltaban siguen el mismo estilo (Lucide, ISC).
const P: Record<string, React.ReactNode> = {
	file: (
		<>
			<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
			<path d="M14 2v4a2 2 0 0 0 2 2h4" />
			<path d="M10 9H8" />
			<path d="M16 13H8" />
			<path d="M16 17H8" />
		</>
	),
	msg: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
	mail: (
		<>
			<rect width="20" height="16" x="2" y="4" rx="2" />
			<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
		</>
	),
	db: (
		<>
			<ellipse cx="12" cy="5" rx="9" ry="3" />
			<path d="M3 5v14a9 3 0 0 0 18 0V5" />
			<path d="M3 12a9 3 0 0 0 18 0" />
		</>
	),
	check: <path d="M20 6 9 17l-5-5" />,
	x: (
		<>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</>
	),
	users: (
		<>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</>
	),
	chart: (
		<>
			<path d="M3 3v18h18" />
			<path d="M18 17V9" />
			<path d="M13 17V5" />
			<path d="M8 17v-3" />
		</>
	),
	folder: (
		<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
	),
	euro: (
		<>
			<path d="M4 10h12" />
			<path d="M4 14h9" />
			<path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
		</>
	),
	image: (
		<>
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<circle cx="9" cy="9" r="2" />
			<path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
		</>
	),
	git: (
		<>
			<path d="M6 3v12" />
			<circle cx="18" cy="6" r="3" />
			<circle cx="6" cy="18" r="3" />
			<path d="M18 9a9 9 0 0 1-9 9" />
		</>
	),
	calendar: (
		<>
			<path d="M8 2v4" />
			<path d="M16 2v4" />
			<rect width="18" height="18" x="3" y="4" rx="2" />
			<path d="M3 10h18" />
		</>
	),
	sparkle: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />,
	server: (
		<>
			<rect width="20" height="8" x="2" y="2" rx="2" />
			<rect width="20" height="8" x="2" y="14" rx="2" />
			<path d="M6 6h.01" />
			<path d="M6 18h.01" />
		</>
	),
	monitor: (
		<>
			<rect width="20" height="14" x="2" y="3" rx="2" />
			<path d="M8 21h8" />
			<path d="M12 17v4" />
		</>
	),
	smartphone: (
		<>
			<rect width="14" height="20" x="5" y="2" rx="2" />
			<path d="M12 18h.01" />
		</>
	),
	video: (
		<>
			<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
			<rect x="2" y="6" width="14" height="12" rx="2" />
		</>
	),
	megaphone: (
		<>
			<path d="m3 11 18-5v12L3 14v-3z" />
			<path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
		</>
	),
	share: (
		<>
			<circle cx="18" cy="5" r="3" />
			<circle cx="6" cy="12" r="3" />
			<circle cx="18" cy="19" r="3" />
			<path d="m8.59 13.51 6.83 3.98" />
			<path d="m15.41 6.51-6.82 3.98" />
		</>
	),
	brain: (
		<>
			<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
			<path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
			<path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
			<path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
			<path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
			<path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
			<path d="M19.938 10.5a4 4 0 0 1 .585.396" />
			<path d="M6 18a4 4 0 0 1-1.967-.516" />
			<path d="M19.967 17.484A4 4 0 0 1 18 18" />
		</>
	),
	form: (
		<>
			<rect width="8" height="4" x="8" y="2" rx="1" />
			<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
			<path d="M12 11h4" />
			<path d="M12 16h4" />
			<path d="M8 11h.01" />
			<path d="M8 16h.01" />
		</>
	),
	scissors: (
		<>
			<circle cx="6" cy="6" r="3" />
			<path d="M8.12 8.12 12 12" />
			<path d="M20 4 8.12 15.88" />
			<circle cx="6" cy="18" r="3" />
			<path d="M14.8 14.8 20 20" />
		</>
	),
	zoom: (
		<>
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.35-4.35" />
			<path d="M11 8v6" />
			<path d="M8 11h6" />
		</>
	),
	type: (
		<>
			<path d="M4 7V4h16v3" />
			<path d="M9 20h6" />
			<path d="M12 4v16" />
		</>
	),
	volume: (
		<>
			<path d="M11 5 6 9H2v6h4l5 4V5Z" />
			<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
			<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
		</>
	),
};

// Los trazos, para que las piezas "pro" (pro/iconos.tsx) puedan usar también estos iconos
export const TRAZOS = P;

export const Icono: React.FC<{nombre: string; size?: number; color?: string; grosor?: number}> = ({
	nombre,
	size = 36,
	color = 'currentColor',
	grosor = 2,
}) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke={color}
		strokeWidth={grosor}
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		{P[nombre] ?? P.sparkle}
	</svg>
);
