import re
import os

files_to_fix = [
    ('client/src/components/SGSST/InvestigacionATEL.tsx', 'generatedObjectives'), # check state var names
    ('client/src/components/SGSST/PermisoAlturas.tsx', 'generatedObjectives'),
    ('client/src/components/SGSST/ReporteActosCondiciones.tsx', 'generatedReport'),
    ('client/src/components/SGSST/AnalisisTrabajoSeguro.tsx', 'generatedReport')
]

for filename, state_var in files_to_fix:
    with open(filename, 'r') as f:
        content = f.read()
    
    # 1. remove useAutoLoadReport from WorkerAutocomplete (anywhere before the main component)
    pattern_to_remove = r"[ \t]*useAutoLoadReport\(\{\s*token,\s*tags: \[[^\]]+\],\s*generatedReport: [^,]+,\s*handleSelectReport\s*\}\);\n*"
    new_content = re.sub(pattern_to_remove, '', content, count=1)
    
    # Check if removing was successful or already removed
    if len(new_content) == len(content):
        # maybe it failed to match exact? Try a more relaxed pattern
        pattern_relax = r"[ \t]*useAutoLoadReport\(\{[\s\S]*?\}\);\n*"
        new_content = re.sub(pattern_relax, '', content, count=1)
    
    # 2. inject it before the last top-level return (which is the main return)
    # the main returns are typically line 300-500
    # we need to find "    return (" that isn't indented more than 4 spaces
    # regex: look for "    return (" on a line by itself.
    def repl(m):
        tag = ""
        if "Investigacion" in filename: tag = "sgsst-investigacion-atel"
        elif "Permiso" in filename: tag = "sgsst-permiso-alturas"
        elif "Reporte" in filename: tag = "sgsst-reporte-actos"
        elif "Trabajo" in filename: tag = "sgsst-ats"
        
        hook = f"""
    useAutoLoadReport({{
        token,
        tags: ['{tag}'],
        generatedReport: {state_var},
        handleSelectReport
    }});

    return ("""
        return hook

    # We will search for all "    return (" matches and only replace the LAST one matching exactly 4 spaces? No, the main return is usually the second one (first is in WorkerAutocomplete, second is the main component).
    # Since we removed the first return's content, let's just use string replace on the main return
    
    parts = new_content.split('\n    return (\n')
    if len(parts) >= 3:
        # the main component return is parts[2]
        new_parts = []
        new_parts.append(parts[0])
        new_parts.append('\n    return (\n' + parts[1]) # WorkerAutocomplete return
        new_parts.append(repl(None) + '\n' + parts[2]) # Main return
        # any other returns
        for i in range(3, len(parts)):
            new_parts.append('\n    return (\n' + parts[i])
        new_content = "".join(new_parts)
    else:
        print(f"Skipped {filename} (not enough returns)")
        
    with open(filename, 'w') as f:
        f.write(new_content)
    
    print(f"Fixed {filename}")
