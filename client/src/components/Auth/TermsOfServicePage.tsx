import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeSelector } from '@librechat/client';

/* ─── Animated SVG Icons ───────────────────────────────────────────── */
const DocumentSVG = () => (
    <svg viewBox="0 0 80 80" className="h-16 w-16 mx-auto" fill="none">
        <defs>
            <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
        </defs>
        <rect x="16" y="6" width="48" height="64" rx="6" stroke="url(#docGrad)" strokeWidth="2.5" opacity="0.15" fill="url(#docGrad)">
            <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="16" y="6" width="48" height="64" rx="6" stroke="url(#docGrad)" strokeWidth="2.5" fill="none">
            <animate attributeName="stroke-dasharray" from="0 250" to="250 0" dur="1.5s" fill="freeze" />
        </rect>
        <line x1="28" y1="24" x2="52" y2="24" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" from="0" to="0.7" begin="0.8s" dur="0.3s" fill="freeze" />
        </line>
        <line x1="28" y1="34" x2="48" y2="34" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" from="0" to="0.5" begin="1s" dur="0.3s" fill="freeze" />
        </line>
        <line x1="28" y1="44" x2="52" y2="44" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" from="0" to="0.7" begin="1.2s" dur="0.3s" fill="freeze" />
        </line>
        <line x1="28" y1="54" x2="44" y2="54" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" from="0" to="0.4" begin="1.4s" dur="0.3s" fill="freeze" />
        </line>
    </svg>
);

const ScaleSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
        <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="6" x2="40" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 6L4 22" stroke="currentColor" strokeWidth="1.5">
            <animate attributeName="d" values="M8 6L4 22;M8 6L6 20;M8 6L4 22" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M8 6L12 22" stroke="currentColor" strokeWidth="1.5">
            <animate attributeName="d" values="M8 6L12 22;M8 6L10 20;M8 6L12 22" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M4 22C4 22 6 26 8 26C10 26 12 22 12 22" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M40 6L36 22" stroke="currentColor" strokeWidth="1.5">
            <animate attributeName="d" values="M40 6L36 22;M40 6L38 24;M40 6L36 22" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </path>
        <path d="M40 6L44 22" stroke="currentColor" strokeWidth="1.5">
            <animate attributeName="d" values="M40 6L44 22;M40 6L42 24;M40 6L44 22" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </path>
        <path d="M36 22C36 22 38 26 40 26C42 26 44 22 44 22" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="20" y="40" width="8" height="4" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
);

const HandshakeSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
        <path d="M6 28L14 20L22 24L30 18L38 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" values="0 80;80 0" dur="1.5s" fill="freeze" />
        </path>
        <circle cx="14" cy="20" r="2" fill="currentColor" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="0.5s" dur="0.3s" fill="freeze" />
        </circle>
        <circle cx="22" cy="24" r="2" fill="currentColor" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="0.8s" dur="0.3s" fill="freeze" />
        </circle>
        <circle cx="30" cy="18" r="2" fill="currentColor" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="1.1s" dur="0.3s" fill="freeze" />
        </circle>
        <path d="M4 32H12V40H4V32Z" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <path d="M36 26H44V34H36V26Z" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
);

const GlobeSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <ellipse cx="24" cy="24" rx="10" ry="18" stroke="currentColor" strokeWidth="1.5" opacity="0.6">
            <animate attributeName="rx" values="8;12;8" dur="4s" repeatCount="indefinite" />
        </ellipse>
        <line x1="6" y1="18" x2="42" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <line x1="6" y1="30" x2="42" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path d="M24 6V42" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
);

const WarningSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-amber-500" fill="none">
        <path d="M24 6L4 42H44L24 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" opacity="0.8">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </path>
        <line x1="24" y1="20" x2="24" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="36" r="1.5" fill="currentColor" />
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
    index?: number;
}) => (
    <div className="group rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 p-6 sm:p-7 backdrop-blur-md shadow-xl shadow-slate-900/5 dark:shadow-black/40 transition-all duration-300 hover:border-teal-500/40 hover:shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-colors group-hover:bg-teal-500/20">
                {icon}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-1">{title}</h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{children}</div>
    </div>
);

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function TermsOfServicePage() {
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
                            to="/privacy"
                            className="text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-1.5 rounded-full hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors"
                        >
                            Pol. de Privacidad
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
                            Marco Normativo y Condiciones de Uso
                        </span>
                    </div>
                    <div className="my-3">
                        <DocumentSVG />
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        Términos de Servicio
                    </h1>
                    <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                        <strong>WAPPY LTDA</strong> — NIT 901437310-3 · Medellín, Colombia · Vigente desde 2026
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                        Al acceder o utilizar <strong>wappy.club</strong>, usted acepta y se sujeta a estos términos.
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <Section icon={<ScaleSVG />} title="1. Propiedad Intelectual">
                        <p>
                            Al adquirir un paquete de WAPPY IA, se le concede el derecho a utilizar el servicio
                            según lo estipulado en su plan. <strong>WAPPY LTDA</strong> conserva todos los derechos
                            de propiedad intelectual sobre la plataforma, su diseño, funcionalidades y marca.
                        </p>
                        <p>
                            Queda prohibida la reproducción, distribución o modificación del software sin
                            autorización expresa por escrito de WAPPY LTDA.
                        </p>
                    </Section>

                    <Section icon={<HandshakeSVG />} title="2. Datos del Usuario">
                        <p>
                            Recopilamos datos personales como su nombre, dirección de correo electrónico e
                            información de acceso, tal como se describe en nuestra{' '}
                            <Link to="/privacy" className="font-bold text-teal-600 dark:text-teal-400 hover:underline">
                                Política de Privacidad
                            </Link>.
                        </p>
                        <p>
                            Esta información se recopila para proporcionar y mejorar nuestros servicios,
                            procesar transacciones y comunicarnos con usted.
                        </p>
                    </Section>

                    <Section
                        icon={
                            <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
                                <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                                <path d="M16 24H32M16 30H28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                                    <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
                                </path>
                                <circle cx="38" cy="14" r="6" fill="#ef4444" opacity="0.8">
                                    <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                                </circle>
                                <text x="38" y="17" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">!</text>
                            </svg>
                        }
                        title="3. Uso de la Plataforma"
                    >
                        <p>
                            Usted acepta utilizar la plataforma solo para fines legales y de manera que no infrinja
                            los derechos de terceros. Se prohíbe expresamente:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 marker:text-teal-500">
                            <li>El comportamiento acosador o que cause molestia a otros usuarios</li>
                            <li>La transmisión de contenido obsceno, ofensivo o ilegal</li>
                            <li>La interrupción del flujo normal de la plataforma</li>
                            <li>Intentos de acceso no autorizado a cuentas ajenas</li>
                            <li>Uso del servicio para actividades fraudulentas</li>
                        </ul>
                    </Section>

                    <Section icon={<WarningSVG />} title="4. Inteligencia Artificial — Limitaciones">
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                            <p className="font-semibold text-amber-700 dark:text-amber-300">⚠️ Aviso importante sobre IA</p>
                            <p className="mt-2 text-slate-700 dark:text-zinc-200">
                                La plataforma ofrece todas las funcionalidades de Inteligencia Artificial disponibles.
                                <strong> El uso de la IA es responsabilidad exclusiva del usuario.</strong>
                            </p>
                            <p className="mt-2 text-slate-700 dark:text-zinc-200">
                                <strong>WAPPY LTDA no es propietaria ni responsable de la base de datos</strong> generada
                                por el uso de la IA por parte del usuario. Los resultados generados por la IA pueden
                                contener errores, imprecisiones o información desactualizada.
                            </p>
                            <p className="mt-2 text-slate-700 dark:text-zinc-200">
                                El usuario es responsable de verificar la exactitud y pertinencia de cualquier contenido
                                generado por la IA antes de tomar decisiones basadas en dicho contenido.
                            </p>
                        </div>
                    </Section>

                    <Section icon={<GlobeSVG />} title="5. Ley Aplicable">
                        <p>
                            Estos Términos se regirán e interpretarán de acuerdo con las leyes de la
                            <strong> República de Colombia</strong>, sin dar efecto a ningún principio de
                            conflicto de leyes.
                        </p>
                        <p>
                            Cualquier disputa que surja en relación con estos Términos será resuelta por los
                            tribunales competentes de la ciudad de <strong>Medellín, Colombia</strong>.
                        </p>
                    </Section>

                    <Section
                        icon={
                            <svg viewBox="0 0 48 48" className="h-10 w-10 text-teal-600 dark:text-teal-400" fill="none">
                                <path d="M24 4V44M4 24H44" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                                <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" opacity="0.5">
                                    <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
                                </circle>
                                <path d="M18 24L22 28L30 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0">
                                    <animate attributeName="opacity" from="0" to="1" begin="1.5s" dur="0.5s" fill="freeze" />
                                </path>
                            </svg>
                        }
                        title="6. Modificaciones a los Términos"
                    >
                        <p>
                            Nos reservamos el derecho de modificar estos Términos en cualquier momento.
                            Notificaremos a los usuarios sobre cualquier cambio relevante. El uso continuado
                            de la plataforma después de los cambios constituye la aceptación de los nuevos términos.
                        </p>
                    </Section>
                </div>

                {/* Contact Footer */}
                <div className="mt-12 rounded-3xl border border-teal-500/30 bg-white/85 dark:bg-zinc-900/85 p-8 text-center shadow-xl backdrop-blur-md">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">¿Preguntas sobre estos términos?</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">Contáctanos ante cualquier inquietud legal o contractual.</p>
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
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                        Al utilizar la plataforma, usted reconoce que ha leído estos Términos de Servicio y acepta estar sujeto a ellos.
                    </p>
                </div>
            </div>
        </div>
    );
}
