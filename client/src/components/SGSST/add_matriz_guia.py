import re

with open('client/src/components/SGSST/MatrizCompatibilidadDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Grid3X3 to lucide-react imports if not there
if 'Grid3X3' not in content:
    content = re.sub(
        r'import \{',
        r'import {\n  Grid3X3,',
        content,
        count=1
    )

# Add CLASES_ONU to MatrizCompatibilidadConstants imports if not there
if 'CLASES_ONU' not in content:
    content = re.sub(
        r'import \{([^}]+)\} from \'\./MatrizCompatibilidadConstants\';',
        r"import {\1, CLASES_ONU } from './MatrizCompatibilidadConstants';",
        content
    )

# The content to append for the Matriz Guia Tab
matriz_guia_jsx = """
        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: MATRIZ GUÍA DE ALMACENAMIENTO QUÍMICO MIXTO
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'matriz_guia' && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Grid3X3 className="w-4.5 h-4.5 text-teal-600" />
                  Matriz Guía de Almacenamiento Químico Mixto
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Basada en la metodología SURA / NTC 3966. Cruce de Clases ONU para determinar las reglas de segregación en bodegas y armarios.
                </p>
              </div>

              <div className="w-full overflow-x-auto scrollbar-thin">
                <div className="min-w-[800px] w-full text-[10px]">
                  {/* Header Row */}
                  <div className="flex font-black text-[9px] uppercase tracking-tighter text-slate-500 border-b-2 border-slate-300 dark:border-zinc-700">
                    <div className="w-32 sm:w-40 p-2 shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                      Clase ONU
                    </div>
                    {CLASES_ONU.filter(c => c !== 'No Peligroso').map((cls) => {
                      const classNum = cls.split(':')[0].replace('Clase ', '');
                      return (
                        <div key={cls} className="flex-1 p-2 text-center border-r border-slate-200 dark:border-zinc-800 break-words" title={cls}>
                          {classNum}
                        </div>
                      );
                    })}
                  </div>

                  {/* Body Rows */}
                  {CLASES_ONU.filter(c => c !== 'No Peligroso').map((clsY) => {
                    const classNumY = clsY.split(':')[0].replace('Clase ', '');
                    return (
                      <div key={clsY} className="flex border-b border-slate-200 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <div className="w-32 sm:w-40 p-2 shrink-0 border-r border-slate-200 dark:border-zinc-800 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-zinc-300 bg-slate-50/50 dark:bg-zinc-900/30 truncate" title={clsY}>
                          {clsY}
                        </div>
                        {CLASES_ONU.filter(c => c !== 'No Peligroso').map((clsX) => {
                          const compat = getChemicalCompatibility(clsY, clsX);
                          let bg = 'bg-slate-100';
                          let title = compat.reason;
                          let text = '';
                          
                          if (compat.status === 'compatible') {
                            bg = 'bg-emerald-500 hover:bg-emerald-400';
                          } else if (compat.status === 'caution') {
                            bg = 'bg-yellow-400 hover:bg-yellow-300';
                          } else if (compat.status === 'incompatible') {
                            bg = 'bg-red-500 hover:bg-red-400';
                          }

                          return (
                            <div key={clsX} className={`flex-1 p-1 border-r border-slate-200 dark:border-zinc-800 flex items-center justify-center cursor-pointer transition-colors ${bg} border-b-0`} title={`${clsY} vs ${clsX}\n\n${compat.reason}`}>
                              <span className="opacity-0">.</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800 gap-3">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 shrink-0" /> Pueden almacenarse juntos (Verificar FDS)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400 shrink-0" /> Precaución (Revisar incompatibilidades individuales)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 shrink-0" /> Incompatibles (Separación física requerida)</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
"""

content = content.replace('      </div>\n    </div>\n  );\n}', matriz_guia_jsx + '\n  );\n}')

with open('client/src/components/SGSST/MatrizCompatibilidadDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

