import re

fname = 'client/src/components/SGSST/DashboardPredictivo.tsx'
with open(fname, 'r') as f:
    lines = f.readlines()

new_lines = []
for l in lines:
    new_lines.append(l)
    if l.startswith("import { useAutoLoadReport } from './useAutoLoadReport';"):
        new_lines.append("import { UpgradeWall } from './UpgradeWall';\n")
        new_lines.append("import { SystemRoles } from 'librechat-data-provider';\n")

# Rejoin and string replace
content = "".join(new_lines)

# Inject auth checks inside DashboardPredictivo
auth_context_pattern = r"(const { token } = useAuthContext\(\);)"
auth_check = """const { token, user } = useAuthContext();
    const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO';"""
content = re.sub(auth_context_pattern, auth_check, content)

# Check inside fetchForecast
fetch_forecast_pattern = r"(const fetchForecast = useCallback\(async \(\) => \{\n\s*if \(\!token\) return;)"
fetch_forecast_replacement = """const fetchForecast = useCallback(async () => {
        if (!token) return;
        if (!isPro) {
            setForecast(null);
            return;
        }"""
content = re.sub(fetch_forecast_pattern, fetch_forecast_replacement, content)

# Check inside handleGenerate
handle_gen_pattern = r"(const handleGenerate = useCallback\(async \(\) => \{\n\s*if \(\!token\) return;)"
handle_gen_replacement = """const handleGenerate = useCallback(async () => {
        if (!token) return;
        if (!isPro) {
            showToast({ message: 'Mejora a un plan Pro para generar análisis de IA', status: 'warning' });
            return;
        }"""
content = re.sub(handle_gen_pattern, handle_gen_replacement, content)

# Add Upgrade Wall over Correlation panel
# Replace the Correlation Panel and Recommended Actions with the UpgradeWall if not PRO
correlation_panel_pattern = r"(<\!-- Correlation Panel -->[\s\S]*?</div>\n\s*</div>\n\s*</div>)"

# I will literally replace the entire div class="flex flex-col gap-4" that contains the correlation panel and recommended actions.
replacement_ui = """{/* Correlation Panel or Upgrade Wall */}
                <div className="flex flex-col gap-4">
                    {!isPro ? (
                        <div className="flex-1 flex flex-col justify-center h-full">
                            <UpgradeWall
                                title="Centro de Inteligencia Pro"
                                description="Esta sección requiere un plan PRO. Analiza en tiempo real de forma predictiva mediante IA el ecosistema de más de 8 módulos interconectados de SGSST."
                                isCompact={false}
                                plan="USER_PLUS"
                            />
                        </div>
                    ) : (
                        <>
                            {/* AI Insight Card */}
                            <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm flex-1">
                                <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                    <AnimatedIcon name="sparkles" size={16} className="text-teal-500" />
                                    ANÁLISIS DE CORRELACIÓN PREDICTIVA
                                </h3>
                                <p className="text-sm text-text-secondary leading-relaxed font-medium italic p-4 bg-surface-primary rounded-xl border border-border-light">
                                    "{forecast?.predictionSummary || "Haga clic en 'Actualizar' para generar el análisis predictivo cruzado de todos los módulos..."}"
                                </p>
                            </div>

                            {/* Recommended Actions */}
                            <div className="p-6 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
                                <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                    <AnimatedIcon name="database" size={16} className="text-green-500" />
                                    ACCIONES PREVENTIVAS PRIORITARIAS
                                </h3>
                                <div className="space-y-2">
                                    {forecast?.recommendedActions?.length ? forecast.recommendedActions.map((action, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-surface-primary rounded-xl border border-border-medium hover:border-green-400/50 hover:shadow-sm transition-all group">
                                            <div className="mt-0.5 h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 group-hover:scale-110 transition-transform"
                                                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                                                {i + 1}
                                            </div>
                                            <span className="text-xs text-text-primary font-medium leading-relaxed">{action}</span>
                                        </div>
                                    )) : [1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-surface-primary rounded-xl border border-border-light">
                                            <div className="h-6 w-6 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                                            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>"""

content = re.sub(r"\{\/\* Correlation Panel \*\/\}[\s\S]*?<\/div>(\s*<\/div>\s*<\/div>)", replacement_ui + r"\1", content, 1)

with open(fname, 'w') as f:
    f.write(content)
print("DashboardPredictivo fixed!")
