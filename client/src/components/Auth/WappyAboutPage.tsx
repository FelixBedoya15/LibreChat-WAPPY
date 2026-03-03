import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemeSelector } from '@librechat/client';

/* ─── Company Logo ─────────────────────────────────────────────────── */
const CompanyLogo = () => (
    <div className="flex justify-center">
        <img
            src="/assets/Wappy.png"
            alt="WAPPY LTDA"
            className="h-28 w-auto object-contain drop-shadow-md"
        />
    </div>
);

/* ─── Section SVGs ─────────────────────────────────────────────────── */
const HistorySVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <circle cx="24" cy="24" r="18" stroke="#22c55e" strokeWidth="2" opacity="0.5">
            <animate attributeName="stroke-dasharray" values="0 120;120 0" dur="1.5s" fill="freeze" />
        </circle>
        <line x1="24" y1="14" x2="24" y2="24" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="y2" values="24;24" dur="0s" fill="freeze" />
        </line>
        <line x1="24" y1="24" x2="32" y2="28" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="opacity" values="0;1" begin="0.8s" dur="0.3s" fill="freeze" />
        </line>
        <circle cx="24" cy="24" r="2" fill="#22c55e">
            <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* Timeline dots */}
        <circle cx="24" cy="6" r="1.5" fill="#22c55e" opacity="0.5" />
        <circle cx="42" cy="24" r="1.5" fill="#22c55e" opacity="0.5" />
        <circle cx="24" cy="42" r="1.5" fill="#22c55e" opacity="0.5" />
        <circle cx="6" cy="24" r="1.5" fill="#22c55e" opacity="0.5" />
    </svg>
);

const VisionSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <path d="M4 24C4 24 12 10 24 10C36 10 44 24 44 24C44 24 36 38 24 38C12 38 4 24 4 24Z" stroke="#0ea5e9" strokeWidth="2">
            <animate attributeName="stroke-dasharray" values="0 200;200 0" dur="1.5s" fill="freeze" />
        </path>
        <circle cx="24" cy="24" r="8" stroke="#0ea5e9" strokeWidth="2" opacity="0.6">
            <animate attributeName="r" values="6;9;6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="24" cy="24" r="3" fill="#0ea5e9" opacity="0.8">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* Sparkles */}
        <circle cx="36" cy="12" r="1" fill="#22c55e" opacity="0">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="40" cy="18" r="0.8" fill="#10b981" opacity="0">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="8" cy="16" r="0.8" fill="#22c55e" opacity="0">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.5s" repeatCount="indefinite" />
        </circle>
    </svg>
);

const MissionSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <path d="M24 4L6 14V24C6 35.1 13.8 45.2 24 48C34.2 45.2 42 35.1 42 24V14L24 4Z" stroke="#22c55e" strokeWidth="2" opacity="0.15" fill="#22c55e">
            <animate attributeName="opacity" values="0.08;0.2;0.08" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M24 4L6 14V24C6 35.1 13.8 45.2 24 48C34.2 45.2 42 35.1 42 24V14L24 4Z" stroke="#22c55e" strokeWidth="2" fill="none">
            <animate attributeName="stroke-dasharray" values="0 200;200 0" dur="1.5s" fill="freeze" />
        </path>
        <path d="M18 24L22 28L30 18" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="1s" dur="0.5s" fill="freeze" />
            <animate attributeName="stroke-dasharray" from="0 30" to="30 0" begin="1s" dur="0.6s" fill="freeze" />
        </path>
    </svg>
);

const RocketSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <path d="M24 4C24 4 14 14 14 28C14 34 18 40 24 44C30 40 34 34 34 28C34 14 24 4 24 4Z" stroke="#22c55e" strokeWidth="2" opacity="0.6">
            <animate attributeName="stroke-dasharray" values="0 150;150 0" dur="1.5s" fill="freeze" />
        </path>
        <circle cx="24" cy="22" r="4" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.7">
            <animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <path d="M14 28L8 34" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <path d="M34 28L40 34" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        {/* Exhaust flames */}
        <path d="M20 40L24 46L28 40" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" values="0;0.8;0" dur="1s" begin="1.5s" repeatCount="indefinite" />
        </path>
    </svg>
);

const TeamSVG = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <circle cx="24" cy="14" r="6" stroke="#22c55e" strokeWidth="2" opacity="0.7" />
        <path d="M12 38C12 30.3 17.4 26 24 26C30.6 26 36 30.3 36 38" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
        </path>
        <circle cx="10" cy="18" r="4" stroke="#10b981" strokeWidth="1.5" opacity="0.4" />
        <path d="M2 34C2 28.5 5.6 26 10 26" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <circle cx="38" cy="18" r="4" stroke="#10b981" strokeWidth="1.5" opacity="0.4" />
        <path d="M46 34C46 28.5 42.4 26 38 26" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
);

/* ─── Section Card ─────────────────────────────────────────────────── */
const Section = ({
    icon,
    title,
    accent = 'green',
    children,
}: {
    icon: React.ReactNode;
    title: string;
    accent?: 'green' | 'cyan' | 'amber';
    children: React.ReactNode;
}) => {
    const accentMap = {
        green: 'bg-green-500/10 group-hover:bg-green-500/20 hover:border-green-500/30 hover:shadow-green-500/5',
        cyan: 'bg-cyan-500/10 group-hover:bg-cyan-500/20 hover:border-cyan-500/30 hover:shadow-cyan-500/5',
        amber: 'bg-amber-500/10 group-hover:bg-amber-500/20 hover:border-amber-500/30 hover:shadow-amber-500/5',
    };
    return (
        <div className={`group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${accentMap[accent]}`}>
            <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentMap[accent].split(' ')[0]}`}>
                    {icon}
                </div>
                <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-text-secondary">{children}</div>
        </div>
    );
};

/* ─── Values Card (small) ──────────────────────────────────────────── */
const ValueCard = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
    <div className="group flex items-start gap-3 rounded-xl border border-border-medium/30 bg-surface-primary/40 p-4 transition-all duration-300 hover:border-green-500/20 hover:bg-surface-primary/70">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
            {icon}
        </div>
        <div>
            <h4 className="text-sm font-bold text-text-primary">{title}</h4>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">{text}</p>
        </div>
    </div>
);

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function WappyAboutPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface-secondary relative">
            <div className="fixed bottom-0 left-0 p-4 md:m-4 z-50">
                <ThemeSelector />
            </div>

            {/* Header Bar */}
            <div className="sticky top-0 z-10 border-b border-border-medium/50 bg-surface-secondary/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 rounded-xl bg-surface-primary px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-hover hover:text-text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                    <div className="flex-1" />
                    <span className="ml-3 text-xs text-text-tertiary">NIT 901437310-3</span>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-6 py-12">
                {/* Hero */}
                <div className="mb-12 text-center">
                    <CompanyLogo />
                    <h1 className="mt-6 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                        WAPPY LTDA
                    </h1>
                    <p className="mt-2 text-lg text-text-secondary">
                        Innovación Tecnológica · Medellín, Colombia
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">
                        NIT 901437310-3
                    </p>
                </div>

                {/* History - Full Width */}
                <Section icon={<HistorySVG />} title="Nuestra Historia">
                    <p>
                        <strong>WAPPY LTDA</strong> nació en la ciudad de <strong>Medellín, Colombia</strong>,
                        con la visión de transformar la manera en que las empresas gestionan sus procesos
                        a través de la tecnología y la inteligencia artificial.
                    </p>
                    <p>
                        Desde nuestros inicios, nos especializamos en el desarrollo de soluciones tecnológicas
                        innovadoras que simplifican y automatizan procesos empresariales complejos. Nuestra
                        plataforma de IA fue creada para democratizar el acceso a herramientas inteligentes,
                        permitiendo que empresas de todos los tamaños aprovechen el poder de la inteligencia
                        artificial para mejorar su productividad y competitividad.
                    </p>
                    <p>
                        Hoy, nuestra plataforma <strong>WAPPY IA</strong> integra modelos avanzados de
                        inteligencia artificial con capacidades especializadas en seguridad y salud en el trabajo
                        (SG-SST), análisis de documentos, generación de informes profesionales y mucho más,
                        consolidándose como una herramienta integral para la gestión empresarial moderna.
                    </p>
                </Section>

                {/* Vision & Mission Grid */}
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <Section icon={<VisionSVG />} title="Visión" accent="cyan">
                        <p>
                            Ser la plataforma líder en <strong>inteligencia artificial aplicada a la gestión
                                empresarial</strong> en Latinoamérica, reconocida por nuestra capacidad de innovación,
                            la calidad de nuestras soluciones y el impacto positivo en la productividad de
                            nuestros clientes.
                        </p>
                        <p>
                            Para 2030, aspiramos a empoderar a más de <strong>10,000 empresas</strong> con
                            herramientas de IA que transformen sus procesos operativos, de seguridad y de
                            cumplimiento normativo.
                        </p>
                    </Section>

                    <Section icon={<MissionSVG />} title="Misión">
                        <p>
                            Desarrollar y proveer <strong>soluciones tecnológicas de inteligencia artificial</strong>{' '}
                            accesibles, seguras y de alto impacto, que permitan a las empresas colombianas y
                            latinoamericanas optimizar sus procesos, cumplir con la normatividad vigente y
                            tomar decisiones informadas.
                        </p>
                        <p>
                            Nos comprometemos con la <strong>innovación continua</strong>, la satisfacción del
                            cliente y la responsabilidad social en todo lo que hacemos.
                        </p>
                    </Section>
                </div>

                {/* Values */}
                <div className="mt-8">
                    <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-text-primary">
                        <RocketSVG />
                        Nuestros Valores
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <ValueCard
                            icon={
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#22c55e" strokeWidth="2">
                                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" strokeLinecap="round" strokeLinejoin="round">
                                        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                                    </path>
                                </svg>
                            }
                            title="Innovación"
                            text="Buscamos constantemente nuevas formas de aplicar la IA para resolver problemas reales de las empresas."
                        />
                        <ValueCard
                            icon={
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#22c55e" strokeWidth="2">
                                    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" />
                                    <path d="M8 12L11 15L16 9" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            }
                            title="Calidad"
                            text="Cada solución que entregamos cumple con los más altos estándares de calidad y confiabilidad."
                        />
                        <ValueCard
                            icon={
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#22c55e" strokeWidth="2">
                                    <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21V19C23 17.5 22.1 16.2 20.8 15.7" />
                                    <path d="M16.8 3.7C18.1 4.2 19 5.5 19 7C19 8.5 18.1 9.8 16.8 10.3" />
                                </svg>
                            }
                            title="Compromiso Social"
                            text="Contribuimos al desarrollo empresarial colombiano con herramientas que generan empleo y crecimiento."
                        />
                        <ValueCard
                            icon={
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#22c55e" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" />
                                    <path d="M7 11V7C7 4.2 9.2 2 12 2C14.8 2 17 4.2 17 7V11" />
                                    <circle cx="12" cy="16" r="1" fill="#22c55e" />
                                </svg>
                            }
                            title="Seguridad"
                            text="Protegemos la información de nuestros clientes con los más altos estándares de ciberseguridad."
                        />
                    </div>
                </div>

                {/* Team */}
                <div className="mt-8">
                    <Section icon={<TeamSVG />} title="Nuestro Equipo" accent="cyan">
                        <p>
                            Contamos con un equipo multidisciplinario de profesionales apasionados por la
                            tecnología: ingenieros de software, especialistas en inteligencia artificial,
                            expertos en seguridad y salud en el trabajo, y profesionales en diseño de
                            experiencia de usuario.
                        </p>
                        <p>
                            Desde Medellín para el mundo, nuestro equipo trabaja cada día para crear
                            soluciones que realmente transforman la manera en que las empresas operan.
                        </p>
                    </Section>
                </div>

                {/* Contact Footer */}
                <div className="mt-12 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-cyan-500/5 p-8 text-center">
                    <h3 className="text-lg font-bold text-text-primary">Contáctenos</h3>
                    <p className="mt-2 text-sm text-text-secondary">Estamos aquí para ayudarle a transformar su empresa con IA.</p>
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
                    <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-text-tertiary">
                        <a href="/privacy" className="hover:text-green-500 underline">Política de Privacidad</a>
                        <span>·</span>
                        <a href="/terms" className="hover:text-green-500 underline">Términos de Servicio</a>
                    </div>
                    <p className="mt-4 text-xs text-text-tertiary">
                        WAPPY LTDA · NIT 901437310-3 · Todos los derechos reservados © {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
