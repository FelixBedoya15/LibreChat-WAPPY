const fs = require('fs');

let content = fs.readFileSync('client/src/components/Plans/PlansPage.tsx', 'utf8');

const plansNew = `const PLANS = [
    {
        key: 'free',
        name: 'Gratis',
        price: '$0',
        tagline: 'Para empezar a explorar la IA',
        accentColor: 'text-text-secondary',
        iconColor: 'text-text-secondary',
        gradientBg: 'from-surface-secondary to-surface-secondary',
        borderColor: 'border-border-medium/50',
        iconBg: 'bg-surface-tertiary',
        features: [
            'Chat con IA',
            'Aula de estudio',
            'Máximo 10 conversaciones abiertas',
            'Podrá ingresar 1 clave API de Gemini',
        ],
        notIncluded: ['Blog', 'Gestor SGSST', 'Agentes personalizados'],
        popular: false,
    },
    {
        key: 'go',
        name: 'Go',
        price: '$29.500',
        tagline: 'Más acceso, más productividad',
        accentColor: 'text-blue-500',
        iconColor: 'text-blue-500',
        gradientBg: 'from-blue-500/5 to-blue-500/10',
        borderColor: 'border-blue-500/20',
        iconBg: 'bg-blue-500/10',
        features: [
            'Todo lo del plan Gratis',
            'Blog WAPPY',
            'Hasta 30 conversaciones abiertas',
            'Podrá ingresar 4 claves API de Gemini',
        ],
        notIncluded: ['Gestor SGSST', 'Agentes personalizados'],
        popular: false,
        buttonGradient: 'from-blue-500 to-blue-600',
    },
    {
        key: 'plus',
        name: 'Plus',
        price: '$34.700',
        tagline: 'Acceso completo para profesionales',
        accentColor: 'text-green-500',
        iconColor: 'text-green-500',
        gradientBg: 'from-green-500/5 to-emerald-500/10',
        borderColor: 'border-green-500/20',
        iconBg: 'bg-green-500/10',
        features: [
            'Todo lo del plan Go',
            'Conversaciones ilimitadas',
            'Podrá ingresar 10 claves API de Gemini',
            'Gestor SGSST completo',
        ],
        notIncluded: ['Agentes personalizados'],
        popular: true,
        buttonGradient: 'from-green-500 to-emerald-600',
    },
    {
        key: 'pro',
        name: 'Pro',
        price: '$39.800',
        tagline: 'El poder total de WAPPY IA',
        accentColor: 'text-amber-500',
        iconColor: 'text-amber-500',
        gradientBg: 'from-amber-500/5 to-orange-500/10',
        borderColor: 'border-amber-500/20',
        iconBg: 'bg-amber-500/10',
        features: [
            'Todo lo del plan Plus',
            'Crea tus propios Agentes de IA',
            'Personalización avanzada de agentes',
            'Acceso anticipado a nuevas funciones',
        ],
        notIncluded: [],
        popular: false,
        buttonGradient: 'from-amber-500 to-orange-600',
    },
    {
        key: 'intermediacion',
        name: 'Intermediación',
        price: 'Gratis*',
        tagline: 'Plan Intermediación de Riesgos Laborales',
        accentColor: 'text-indigo-500',
        iconColor: 'text-indigo-500',
        gradientBg: 'from-indigo-500/5 to-indigo-500/10',
        borderColor: 'border-indigo-500/20',
        iconBg: 'bg-indigo-500/10',
        features: [
            'Todo lo del plan Plus',
            'Dominio empresarial',
            'Sin límite de usuario',
            'Plataforma propia de la empresa',
            'Sus propios logos',
            'Sus propios agentes',
            '200 GB de almacenamiento',
        ],
        notIncluded: [],
        popular: false,
        isContact: true,
        contactText: 'Gratis *Revisar Términos y Condiciones',
        buttonGradient: 'from-indigo-500 to-indigo-600',
    },
    {
        key: 'empresas',
        name: 'Empresas',
        price: 'Personalizado',
        tagline: 'Solución completa corporativa',
        accentColor: 'text-purple-500',
        iconColor: 'text-purple-500',
        gradientBg: 'from-purple-500/5 to-purple-500/10',
        borderColor: 'border-purple-500/20',
        iconBg: 'bg-purple-500/10',
        features: [
            'Todo lo del plan Plus',
            'Dominio empresarial',
            'Sin límite de usuario',
            'Plataforma propia de la empresa',
            'Sus propios logos',
            'Sus propios agentes',
            '200 GB de almacenamiento',
        ],
        notIncluded: [],
        popular: false,
        isContact: true,
        buttonGradient: 'from-purple-500 to-purple-600',
    },
    {
        key: 'asesores',
        name: 'Asesores Independientes',
        price: 'Personalizado',
        tagline: 'Para Asesores Independientes SST',
        accentColor: 'text-teal-500',
        iconColor: 'text-teal-500',
        gradientBg: 'from-teal-500/5 to-teal-500/10',
        borderColor: 'border-teal-500/20',
        iconBg: 'bg-teal-500/10',
        features: [
            'Todo lo del plan Empresas',
        ],
        notIncluded: [],
        popular: false,
        isContact: true,
        buttonGradient: 'from-teal-500 to-teal-600',
    },
];`;

content = content.replace(/const PLANS = \[[\s\S]*?\n\];/, plansNew);

const iconsNew = `const ShieldSVG = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
        </path>
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dashoffset" values="10;0" dur="1.5s" fill="freeze" />
            <animate attributeName="opacity" values="0;1" dur="1.5s" fill="freeze" />
        </path>
    </svg>
);

const BuildingSVG = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 7h6M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
             <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
        </path>
    </svg>
);

const BriefcaseSVG = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5">
             <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
        </rect>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
             <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
        </path>
    </svg>
);

const PricingSVG = ({ className = "h-5 w-5" }: { className?: string }) => (`;

content = content.replace(/const PricingSVG = \(\{ className = "h-5 w-5" \}: \{ className\?: string \}\) => \(/, iconsNew);


const planMapNew = \`const PLAN_ICON_MAP: Record<string, React.ElementType> = {
    free: FreeSVG,
    go: GoSVG,
    plus: PlusSVG,
    pro: ProSVG,
    intermediacion: ShieldSVG,
    empresas: BuildingSVG,
    asesores: BriefcaseSVG,
};\`;

content = content.replace(/const PLAN_ICON_MAP: Record<string, React\.ElementType> = \{[\\s\\S]*?\\n\};/, planMapNew);

content = content.replace(/<div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">/, '<div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">')


const priceCalcOld = \`                                const totalToBill = isFree ? 0 : ((promotion && promotion.discountPercentage > 0) ? discountedPrice : rawPrice);
                                const pricePerMonth = isFree ? 0 : (totalToBill / monthsDivisor);\`;
const priceCalcNew = \`                                const totalToBill = (isFree || (plan as any).isContact) ? 0 : ((promotion && promotion.discountPercentage > 0) ? discountedPrice : rawPrice);
                                const pricePerMonth = (isFree || (plan as any).isContact) ? 0 : (totalToBill / monthsDivisor);\`;

content = content.replace(priceCalcOld, priceCalcNew);


const priceDivOld = \`                                        {/* Price */}
                                        <div className="mb-5 flex flex-col items-start gap-1">
                                            {promotion && promotion.discountPercentage > 0 && (
                                                <span className="text-sm font-semibold text-text-tertiary line-through decoration-red-500 decoration-2">
                                                    {displayPrice}
                                                </span>
                                            )}

                                            <div className="flex items-end gap-1">
                                                <span className={\\\`text-4xl font-black tracking-tight \${plan.accentColor}\\\`}>
                                                    {isFree ? '$0' : '$' + Math.round(pricePerMonth).toLocaleString('es-CO')}
                                                </span>
                                                <span className="mb-1 text-xs font-semibold text-text-secondary">
                                                    /mes
                                                </span>
                                            </div>

                                            {isNotMonthly && !isFree && (
                                                <div className={\\\`mt-0.5 text-base font-bold text-text-primary\\\`}>
                                                    \${Math.round(totalToBill).toLocaleString('es-CO')}{' '}
                                                    <span className="text-xs font-semibold text-text-secondary">
                                                        /{billingInterval === 'quarterly' ? 'trim.' : billingInterval === 'semiannual' ? 'sem.' : 'año'}
                                                    </span>
                                                </div>
                                            )}

                                            {promotion && (
                                                <div className="mt-2 text-center w-full rounded-md bg-indigo-500/10 py-1.5 px-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {promotion.text || 'Oferta por tiempo limitado'}
                                                </div>
                                            )}
                                        </div>\`;

const priceDivNew = \`                                        {/* Price */}
                                        <div className="mb-5 flex flex-col items-start gap-1">
                                            {promotion && promotion.discountPercentage > 0 && (
                                                <span className="text-sm font-semibold text-text-tertiary line-through decoration-red-500 decoration-2">
                                                    {displayPrice}
                                                </span>
                                            )}

                                            <div className="flex items-end gap-1">
                                                <span className={\\\`text-4xl font-black tracking-tight \${plan.accentColor}\\\`}>
                                                    {(plan as any).isContact ? plan.price : isFree ? '$0' : '$' + Math.round(pricePerMonth).toLocaleString('es-CO')}
                                                </span>
                                                {(!(plan as any).isContact || plan.price === '$0') && (
                                                    <span className="mb-1 text-xs font-semibold text-text-secondary">
                                                        /mes
                                                    </span>
                                                )}
                                            </div>

                                            {isNotMonthly && !isFree && !(plan as any).isContact && (
                                                <div className={\\\`mt-0.5 text-base font-bold text-text-primary\\\`}>
                                                    \${Math.round(totalToBill).toLocaleString('es-CO')}{' '}
                                                    <span className="text-xs font-semibold text-text-secondary">
                                                        /{billingInterval === 'quarterly' ? 'trim.' : billingInterval === 'semiannual' ? 'sem.' : 'año'}
                                                    </span>
                                                </div>
                                            )}

                                            {promotion && !(plan as any).isContact && (
                                                <div className="mt-2 text-center w-full rounded-md bg-indigo-500/10 py-1.5 px-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {promotion.text || 'Oferta por tiempo limitado'}
                                                </div>
                                            )}
                                        </div>\`;
                                        
content = content.replace(priceDivOld, priceDivNew);

const ctaOld = \`                                        {/* CTA */}
                                        <div className="mt-auto pt-2">
                                            <button
                                                onClick={() => !isActive && !isFree && handleSubscribe(plan.key, plan, displayPrice, discountedPrice, rawPrice, promotion)}
                                                disabled={isActive || isFree || isLoadingThis || loading}

                                                className={\\\`mb-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all \${isActive
                                                    ? \\\`cursor-default border \${plan.borderColor} \${plan.accentColor} bg-transparent\\\`
                                                    : isFree
                                                        ? 'cursor-default border border-border-medium/40 bg-transparent text-text-tertiary'
                                                        : \\\`bg-gradient-to-r \${plan.key === 'go'
                                                            ? 'from-blue-500 to-blue-600'
                                                            : plan.key === 'plus'
                                                                ? 'from-green-500 to-emerald-600'
                                                                : 'from-amber-500 to-orange-600'
                                                        } text-white hover:opacity-90 hover:shadow-md\\\`
                                                    }\\\`}
                                            >
                                                {isLoadingThis ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo...
                                                    </>
                                                ) : isActive ? (
                                                    <>
                                                        <Check className="h-4 w-4" /> Plan actual
                                                    </>
                                                ) : isFree ? (
                                                    'Plan gratuito'
                                                ) : (
                                                    \\\`Comenzar con \${plan.name}\\\`
                                                )}
                                            </button>
                                        </div>\`;

const ctaNew = \`                                        {/* CTA */}
                                        <div className="mt-auto pt-2">
                                            <button
                                                onClick={() => {
                                                    if ((plan as any).isContact) {
                                                        navigate(\\\`/contactanos?plan=\${plan.key}\\\`);
                                                    } else if (!isActive && !isFree) {
                                                        handleSubscribe(plan.key, plan, displayPrice, discountedPrice, rawPrice, promotion);
                                                    }
                                                }}
                                                disabled={(!(plan as any).isContact && isActive) || (!(plan as any).isContact && isFree) || isLoadingThis || loading}

                                                className={\\\`mb-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all \${isActive && !(plan as any).isContact
                                                    ? \\\`cursor-default border \${plan.borderColor} \${plan.accentColor} bg-transparent\\\`
                                                    : isFree
                                                        ? 'cursor-default border border-border-medium/40 bg-transparent text-text-tertiary'
                                                        : \\\`bg-gradient-to-r \${(plan as any).buttonGradient || 'from-indigo-500 to-indigo-600'} text-white hover:opacity-90 hover:shadow-md\\\`
                                                    }\\\`}
                                            >
                                                {isLoadingThis ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo...
                                                    </>
                                                ) : isActive && !(plan as any).isContact ? (
                                                    <>
                                                        <Check className="h-4 w-4" /> Plan actual
                                                    </>
                                                ) : isFree ? (
                                                    'Plan gratuito'
                                                ) : (plan as any).isContact ? (
                                                    (plan as any).contactText || 'Solicitar cotización'
                                                ) : (
                                                    \\\`Comenzar con \${plan.name}\\\`
                                                )}
                                            </button>
                                        </div>\`;

content = content.replace(ctaOld, ctaNew);

fs.writeFileSync('client/src/components/Plans/PlansPage.tsx', content);
console.log('PlansPage.tsx updated successfully');
