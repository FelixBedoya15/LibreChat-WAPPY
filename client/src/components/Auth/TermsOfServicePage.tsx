import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/* ─── Animated SVG Icons ───────────────────────────────────────────── */
const DocumentSVG = () => (
    <svg viewBox="0 0 80 80" className="h-16 w-16 mx-auto" fill="none">
        <defs>
            <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
        </defs>
        <rect x="16" y="6" width="48" height="64" rx="6" stroke="url(#docGrad)" strokeWidth="2.5" opacity="0.15" fill="url(#docGrad)">
            <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="16" y="6" width="48" height="64" rx="6" stroke="url(#docGrad)" strokeWidth="2.5" fill="none">
            <animate attributeName="stroke-dasharray" from="0 250" to="250 0" dur="1.5s" fill="freeze" />
        </rect>
        <line x1="28" y1="24" x2="52" y2="24" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" from="0" to="0.7" begin="0.8s" dur="0.3s" fill="freeze" />
        </line>
        <line x1="28" y1="34" x2="48" y2="34" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" from="0" to="0.5" begin="1s" dur="0.3s" fill="freeze" />
        </line>
        <line x1="28" y1="44" x2="52" y2="44" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" from="0" to="0.7" begin="1.2s" dur="0.3s" fill="freeze" />
        </line>
        <line x1="28" y1="54" x2="44" y2="54" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" from="0" to="0.4" begin="1.4s" dur="0.3s" fill="freeze" />
        </line>
    </svg>
);

const ScaleSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <line x1="24" y1="6" x2="24" y2="42" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="6" x2="40" y2="6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 6L4 22" stroke="#22c55e" strokeWidth="1.5">
            <animate attributeName="d" values="M8 6L4 22;M8 6L6 20;M8 6L4 22" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M8 6L12 22" stroke="#22c55e" strokeWidth="1.5">
            <animate attributeName="d" values="M8 6L12 22;M8 6L10 20;M8 6L12 22" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M4 22C4 22 6 26 8 26C10 26 12 22 12 22" stroke="#22c55e" strokeWidth="1.5" fill="none" />
        <path d="M40 6L36 22" stroke="#22c55e" strokeWidth="1.5">
            <animate attributeName="d" values="M40 6L36 22;M40 6L38 24;M40 6L36 22" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </path>
        <path d="M40 6L44 22" stroke="#22c55e" strokeWidth="1.5">
            <animate attributeName="d" values="M40 6L44 22;M40 6L42 24;M40 6L44 22" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </path>
        <path d="M36 22C36 22 38 26 40 26C42 26 44 22 44 22" stroke="#22c55e" strokeWidth="1.5" fill="none" />
        <rect x="20" y="40" width="8" height="4" rx="1" fill="#22c55e" opacity="0.5" />
    </svg>
);

const HandshakeSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <path d="M6 28L14 20L22 24L30 18L38 22" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" values="0 80;80 0" dur="1.5s" fill="freeze" />
        </path>
        <circle cx="14" cy="20" r="2" fill="#16a34a" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="0.5s" dur="0.3s" fill="freeze" />
        </circle>
        <circle cx="22" cy="24" r="2" fill="#16a34a" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="0.8s" dur="0.3s" fill="freeze" />
        </circle>
        <circle cx="30" cy="18" r="2" fill="#16a34a" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="1.1s" dur="0.3s" fill="freeze" />
        </circle>
        <path d="M4 32H12V40H4V32Z" stroke="#22c55e" strokeWidth="1.5" opacity="0.5" />
        <path d="M36 26H44V34H36V26Z" stroke="#22c55e" strokeWidth="1.5" opacity="0.5" />
    </svg>
);

const GlobeSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <circle cx="24" cy="24" r="18" stroke="#22c55e" strokeWidth="2" opacity="0.5" />
        <ellipse cx="24" cy="24" rx="10" ry="18" stroke="#22c55e" strokeWidth="1.5" opacity="0.6">
            <animate attributeName="rx" values="8;12;8" dur="4s" repeatCount="indefinite" />
        </ellipse>
        <line x1="6" y1="18" x2="42" y2="18" stroke="#22c55e" strokeWidth="1" opacity="0.3" />
        <line x1="6" y1="30" x2="42" y2="30" stroke="#22c55e" strokeWidth="1" opacity="0.3" />
        <path d="M24 6V42" stroke="#22c55e" strokeWidth="1" opacity="0.3" />
    </svg>
);

const WarningSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <path d="M24 6L4 42H44L24 6Z" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" opacity="0.7">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
        </path>
        <line x1="24" y1="20" x2="24" y2="30" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="36" r="1.5" fill="#f59e0b" />
    </svg>
);

/* ─── Section Card ─────────────────────────────────────────────────── */
const Section = ({
    icon,
    title,
    children,
    index,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    index: number;
}) => (
    <div
        className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        style={{ animationDelay: `${index * 0.1}s` }}
    >
        <div className="mb-4 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                {icon}
            </div>
            <h2 className="text-lg font-bold text-text-primary pt-2">{title}</h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-text-secondary">{children}</div>
    </div>
);

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function TermsOfServicePage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface-secondary">
            {/* Header Bar */}
            <div className="sticky top-0 z-10 border-b border-border-medium/50 bg-surface-secondary/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 rounded-xl bg-surface-primary px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-hover hover:text-text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                    <div className="flex-1" />
                    <span className="text-xs text-text-tertiary">Vigente desde: 27 de Enero de 2026</span>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-6 py-12">
                {/* Hero */}
                <div className="mb-12 text-center">
                    <DocumentSVG />
                    <h1 className="mt-6 bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                        Términos de Servicio
                    </h1>
                    <p className="mt-3 text-text-secondary">
                        <strong>WAPPY LTDA</strong> — NIT 901437310-3 · Medellín, Colombia
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">
                        Al acceder o utilizar <strong>ia.wappy-ia.com</strong>, usted acepta estos términos.
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <Section icon={<ScaleSVG />} title="1. Propiedad Intelectual" index={0}>
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

                    <Section icon={<HandshakeSVG />} title="2. Datos del Usuario" index={1}>
                        <p>
                            Recopilamos datos personales como su nombre, dirección de correo electrónico e
                            información de acceso, tal como se describe en nuestra{' '}
                            <a href="/privacy" className="font-medium text-green-500 hover:text-green-400 underline">
                                Política de Privacidad
                            </a>.
                        </p>
                        <p>
                            Esta información se recopila para proporcionar y mejorar nuestros servicios,
                            procesar transacciones y comunicarnos con usted.
                        </p>
                    </Section>

                    <Section
                        icon={
                            <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
                                <rect x="6" y="10" width="36" height="28" rx="4" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
                                <path d="M16 24H32M16 30H28" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                                    <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
                                </path>
                                <circle cx="38" cy="14" r="6" fill="#ef4444" opacity="0.8">
                                    <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                                </circle>
                                <text x="38" y="17" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">!</text>
                            </svg>
                        }
                        title="3. Uso de la Plataforma"
                        index={2}
                    >
                        <p>
                            Usted acepta utilizar la plataforma solo para fines legales y de manera que no infrinja
                            los derechos de terceros. Se prohíbe expresamente:
                        </p>
                        <ul className="ml-4 list-disc space-y-1 marker:text-green-500">
                            <li>El comportamiento acosador o que cause molestia a otros usuarios</li>
                            <li>La transmisión de contenido obsceno, ofensivo o ilegal</li>
                            <li>La interrupción del flujo normal de la plataforma</li>
                            <li>Intentos de acceso no autorizado a cuentas ajenas</li>
                            <li>Uso del servicio para actividades fraudulentas</li>
                        </ul>
                    </Section>

                    <Section icon={<WarningSVG />} title="4. Inteligencia Artificial — Limitaciones" index={3}>
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                            <p className="font-semibold text-amber-600 dark:text-amber-400">⚠️ Aviso importante sobre IA</p>
                            <p className="mt-2">
                                La plataforma ofrece todas las funcionalidades de Inteligencia Artificial disponibles.
                                <strong> El uso de la IA es responsabilidad exclusiva del usuario.</strong>
                            </p>
                            <p className="mt-2">
                                <strong>WAPPY LTDA no es propietaria ni responsable de la base de datos</strong> generada
                                por el uso de la IA por parte del usuario. Los resultados generados por la IA pueden
                                contener errores, imprecisiones o información desactualizada.
                            </p>
                            <p className="mt-2">
                                El usuario es responsable de verificar la exactitud y pertinencia de cualquier contenido
                                generado por la IA antes de tomar decisiones basadas en dicho contenido.
                            </p>
                        </div>
                    </Section>

                    <Section icon={<GlobeSVG />} title="5. Ley Aplicable" index={4}>
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
                            <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
                                <path d="M24 4V44M4 24H44" stroke="#22c55e" strokeWidth="2" opacity="0.3" />
                                <circle cx="24" cy="24" r="16" stroke="#22c55e" strokeWidth="2" opacity="0.5">
                                    <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
                                </circle>
                                <path d="M18 24L22 28L30 20" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0">
                                    <animate attributeName="opacity" from="0" to="1" begin="1.5s" dur="0.5s" fill="freeze" />
                                </path>
                            </svg>
                        }
                        title="6. Modificaciones a los Términos"
                        index={5}
                    >
                        <p>
                            Nos reservamos el derecho de modificar estos Términos en cualquier momento.
                            Notificaremos a los usuarios sobre cualquier cambio relevante. El uso continuado
                            de la plataforma después de los cambios constituye la aceptación de los nuevos términos.
                        </p>
                    </Section>
                </div>

                {/* Contact Footer */}
                <div className="mt-12 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-cyan-500/5 p-8 text-center">
                    <h3 className="text-lg font-bold text-text-primary">¿Preguntas sobre estos términos?</h3>
                    <p className="mt-2 text-sm text-text-secondary">Contáctenos para cualquier consulta.</p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-text-secondary">
                        <a href="mailto:info@grupowappy.com" className="flex items-center gap-2 rounded-lg bg-surface-primary px-4 py-2 transition-all hover:bg-surface-hover hover:text-green-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            info@grupowappy.com
                        </a>
                        <a href="tel:+573021268625" className="flex items-center gap-2 rounded-lg bg-surface-primary px-4 py-2 transition-all hover:bg-surface-hover hover:text-green-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            302 126 8625
                        </a>
                        <span className="flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Medellín, Colombia
                        </span>
                    </div>
                    <p className="mt-6 text-xs text-text-tertiary">
                        WAPPY LTDA · NIT 901437310-3 · Todos los derechos reservados © {new Date().getFullYear()}
                    </p>
                    <p className="mt-2 text-xs text-text-tertiary">
                        Al utilizar la plataforma, usted reconoce que ha leído estos Términos de Servicio y acepta estar sujeto a ellos.
                    </p>
                </div>
            </div>
        </div>
    );
}
