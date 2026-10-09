import re

with open('client/src/components/SGSST/MatrizCompatibilidadDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix activeTab state
content = re.sub(
    r"useState<'dashboard' \| 'cruces' \| 'metodologia'>",
    r"useState<'dashboard' | 'cruces' | 'metodologia' | 'matriz_guia'>",
    content
)

# Insert the new tab button
tab_btn = """            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matriz_guia')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                activeTab === 'matriz_guia'
                  ? "bg-teal-600 text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              )}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matriz NTC 3966</span>
              <span className="sm:hidden">Matriz</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metodologia')}"""

content = content.replace(
    """            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metodologia')}""",
    tab_btn
)

with open('client/src/components/SGSST/MatrizCompatibilidadDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
