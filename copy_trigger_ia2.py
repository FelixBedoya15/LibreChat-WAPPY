import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if 'async function triggerIAGeneration()' in line:
        start_idx = i
    if 'function capturePhoto()' in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    trigger_func = "".join(lines[start_idx:end_idx]).strip()
    
    # Change the hardcoded id to "permiso_alturas"
    trigger_func = trigger_func.replace('const id = "investigacion_accidentes";', 'const id = "permiso_alturas";')
    
    with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'r', encoding='utf-8') as f:
        perm_html = f.read()
    
    if 'async function sendChatMessage' in perm_html:
        new_perm_html = perm_html.replace('async function sendChatMessage() {', trigger_func + '\n\n        async function sendChatMessage() {')
        
        with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'w', encoding='utf-8') as f:
            f.write(new_perm_html)
        print("Successfully injected triggerIAGeneration into permiso_alturas.html.")
    else:
        print("sendChatMessage not found in permiso_alturas.html.")
else:
    print("Could not find triggerIAGeneration bounds.")
