import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeSelector } from '@librechat/client';

/* ─── Animated SVG Icons ───────────────────────────────────────────── */
const ShieldSVG = () => (
    <svg viewBox="0 0 80 80" className="h-16 w-16 mx-auto" fill="none">
        <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
        </defs>
        <path
            d="M40 8L12 22V38C12 55.7 24.1 72.1 40 76C55.9 72.1 68 55.7 68 38V22L40 8Z"
            fill="url(#shieldGrad)"
            opacity="0.15"
            className="animate-pulse"
        />
        <path
            d="M40 8L12 22V38C12 55.7 24.1 72.1 40 76C55.9 72.1 68 55.7 68 38V22L40 8Z"
            stroke="url(#shieldGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <animate attributeName="stroke-dasharray" from="0 300" to="300 0" dur="1.5s" fill="freeze" />
        </path>
        <path
            d="M28 40L36 48L52 32"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0"
        >
            <animate attributeName="opacity" from="0" to="1" begin="1s" dur="0.5s" fill="freeze" />
            <animate attributeName="stroke-dasharray" from="0 40" to="40 0" begin="1s" dur="0.6s" fill="freeze" />
        </path>
    </svg>
);

const LockSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
        <rect x="8" y="20" width="32" height="22" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.7">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
        </rect>
        <path d="M16 20V14C16 9.6 19.6 6 24 6C28.4 6 32 9.6 32 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="31" r="3" fill="currentColor">
            <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" />
        </circle>
    </svg>
);

const DataSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
        <ellipse cx="24" cy="12" rx="16" ry="6" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12V36C8 39.3 15.2 42 24 42C32.8 42 40 39.3 40 36V12" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        <ellipse cx="24" cy="24" rx="16" ry="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="24" cy="36" rx="16" ry="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        </ellipse>
    </svg>
);

const EyeSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
        <path d="M4 24C4 24 12 10 24 10C36 10 44 24 44 24C44 24 36 38 24 38C12 38 4 24 4 24Z" stroke="currentColor" strokeWidth="2">
            <animate attributeName="stroke-dasharray" values="0 200;200 0" dur="1.5s" fill="freeze" />
        </path>
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2">
            <animate attributeName="r" values="5;7;5" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="24" cy="24" r="2.5" fill="currentColor" />
    </svg>
);

/* ─── Section Card ─────────────────────────────────────────────────── */
const Section = ({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) => (
    <div className="group rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 p-6 sm:p-7 backdrop-blur-md shadow-xl shadow-slate-900/5 dark:shadow-black/40 transition-all duration-300 hover:border-teal-500/40 hover:shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-colors group-hover:bg-teal-500/20">
                {icon}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{children}</div>
    </div>
);

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-[#E6F3FA] via-[#D8ECF7] to-[#C8E4F3] dark:from-[#0B111E] dark:via-[#0F172A] dark:to-[#080C14] transition-colors duration-300">
            {/* Soft Landing-style decorative clouds */}
            <div
                className="pointer-events-none absolute -top-12 -left-16 w-80 h-36 rounded-full bg-white/70 dark:bg-white/5 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute top-48 -right-12 w-96 h-40 rounded-full bg-white/60 dark:bg-white/5 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute bottom-24 left-1/4 w-[420px] h-44 rounded-full bg-white/50 dark:bg-white/5 blur-3xl opacity-70"
                aria-hidden="true"
            />

            <div className="fixed bottom-0 left-0 p-4 md:m-4 z-50">
                <ThemeSelector />
            </div>

            {/* Header Bar */}
            <header className="sticky top-0 z-20 border-b border-slate-200/60 dark:border-zinc-800/60 bg-white/75 dark:bg-[#0B111E]/75 backdrop-blur-xl">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200 hover:text-black dark:hover:text-white px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-slate-200/80 dark:border-zinc-700/80 shadow-sm transition-all active:scale-95"
                    >
                        <span className="text-base leading-none">←</span>
                        <span>Volver a WAPPY</span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            to="/terms"
                            className="text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-1.5 rounded-full hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors"
                        >
                            Términos de Servicio
                        </Link>
                        <Link
                            to="/planes"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0E1300] bg-[#C7F303] hover:bg-[#b5dc02] px-3.5 py-1.5 rounded-full shadow-sm shadow-[#c7f303]/30 transition-all active:scale-95"
                        >
                            <span>Planes</span>
                            <span className="text-xs">→</span>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 relative z-10">
                {/* Hero */}
                <div className="mb-10 text-center">
                    <div className="flex justify-center mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-lime-400/20 text-lime-900 dark:text-lime-300 border border-lime-400/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span>
                            Transparencia y Protección de Datos
                        </span>
                    </div>
                    <div className="my-3">
                        <ShieldSVG />
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        Política de Privacidad
                    </h1>
                    <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                        <strong>WAPPY LTDA</strong> — NIT 901437310-3 · Medellín, Colombia · Cumplimiento Ley 1581 de 2012
                    </p>
                </div>

                {/* Content Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Section icon={<DataSVG />} title="Datos que Recopilamos">
                        <p>Al utilizar nuestra plataforma, recopilamos la siguiente información:</p>
                        <ul className="ml-4 list-disc space-y-1 marker:text-teal-500">
                            <li>Nombre, correo electrónico y datos de registro</li>
                            <li>Información de uso de la plataforma (logs de acceso)</li>
                            <li>Datos técnicos del dispositivo y navegador</li>
                            <li>Contenido generado por el usuario dentro de la plataforma</li>
                        </ul>
                    </Section>

                    <Section icon={<EyeSVG />} title="Uso de la Información">
                        <p>Sus datos personales se utilizan exclusivamente para:</p>
                        <ul className="ml-4 list-disc space-y-1 marker:text-teal-500">
                            <li>Proveer y mantener el servicio de la plataforma</li>
                            <li>Autenticación y seguridad de su cuenta</li>
                            <li>Comunicación sobre actualizaciones del servicio</li>
                            <li>Cumplimiento de obligaciones legales colombianas</li>
                        </ul>
                        <p className="mt-2 text-xs italic text-slate-500 dark:text-zinc-400">
                            No vendemos ni compartimos su información con terceros para fines publicitarios.
                        </p>
                    </Section>

                    <Section icon={<LockSVG />} title="Seguridad de los Datos">
                        <p>
                            Implementamos medidas técnicas y organizativas para proteger su información,
                            incluyendo cifrado en tránsito y en reposo, controles de acceso y auditorías de seguridad.
                        </p>
                        <p>
                            Sin embargo, ningún sistema es 100% seguro. Le recomendamos usar contraseñas fuertes
                            y no compartir sus credenciales.
                        </p>
                    </Section>

                    <Section
                        icon={
                            <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
                                <path d="M24 4L6 14V24C6 35.1 13.8 45.2 24 48C34.2 45.2 42 35.1 42 24V14L24 4Z" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                                <text x="24" y="30" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="bold">IA</text>
                            </svg>
                        }
                        title="Inteligencia Artificial — Responsabilidad"
                    >
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                            <p className="font-semibold text-amber-700 dark:text-amber-300">⚠️ Aviso importante</p>
                            <p className="mt-2 text-slate-700 dark:text-zinc-200">
                                La plataforma permite todas las funcionalidades de IA que el usuario configure.
                                <strong> El uso de la IA es responsabilidad exclusiva del usuario.</strong>
                            </p>
                            <p className="mt-2 text-slate-700 dark:text-zinc-200">
                                <strong>WAPPY LTDA no es propietaria ni responsable de los datos almacenados</strong> en la base
                                de datos generada por el uso de la IA. El contenido generado por la IA puede contener
                                errores y el usuario debe verificar su exactitud.
                            </p>
                        </div>
                    </Section>

                    <Section
                        icon={
                            <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
                                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" opacity="0.5">
                                    <animate attributeName="r" values="16;20;16" dur="3s" repeatCount="indefinite" />
                                </circle>
                                <path d="M16 24H32M24 16V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                                </path>
                            </svg>
                        }
                        title="Derechos del Usuario"
                    >
                        <p>De acuerdo con la Ley 1581 de 2012 (Protección de Datos Personales en Colombia), usted tiene derecho a:</p>
                        <ul className="ml-4 list-disc space-y-1 marker:text-teal-500">
                            <li>Conocer, actualizar y rectificar sus datos personales</li>
                            <li>Solicitar prueba de la autorización otorgada</li>
                            <li>Presentar quejas ante la Superintendencia de Industria y Comercio</li>
                            <li>Revocar la autorización y/o solicitar la supresión de sus datos</li>
                            <li>Acceder gratuitamente a sus datos personales</li>
                        </ul>
                    </Section>

                    <Section
                        icon={
                            <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
                                <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.5" />
                                <path d="M14 24L22 32L34 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <animate attributeName="stroke-dasharray" values="0 40;40 0" dur="1s" fill="freeze" />
                                </path>
                            </svg>
                        }
                        title="Cookies y Tecnologías Similares"
                    >
                        <p>
                            Utilizamos cookies esenciales para el funcionamiento de la plataforma (autenticación, preferencias).
                            No utilizamos cookies de seguimiento publicitario de terceros.
                        </p>
                        <p>Al continuar usando la plataforma, usted acepta el uso de estas cookies necesarias.</p>
                    </Section>
                </div>

                {/* Contact Footer */}
                <div className="mt-12 rounded-3xl border border-teal-500/30 bg-white/85 dark:bg-zinc-900/85 p-8 text-center shadow-xl backdrop-blur-md">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">¿Preguntas sobre privacidad y tus datos?</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">Contáctanos para cualquier consulta o solicitud de hábeas data.</p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
                        <a href="mailto:info@wappy.club" className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700/70 px-4 py-2 text-slate-700 dark:text-zinc-200 font-semibold transition-all hover:bg-white dark:hover:bg-zinc-700 hover:text-teal-600 shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            info@wappy.club
                        </a>
                        <a href="tel:+573102913651" className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700/70 px-4 py-2 text-slate-700 dark:text-zinc-200 font-semibold transition-all hover:bg-white dark:hover:bg-zinc-700 hover:text-teal-600 shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            310 291 3651
                        </a>
                        <span className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700/70 px-4 py-2 text-slate-700 dark:text-zinc-200 font-semibold shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Medellín, Colombia
                        </span>
                    </div>
                    <p className="mt-6 text-xs text-slate-500 dark:text-zinc-500">
                        WAPPY LTDA · NIT 901437310-3 · Todos los derechos reservados © {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
