import re

# Read investigacion_accidentes.html
with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'r', encoding='utf-8') as f:
    inv_html = f.read()

# Extract triggerIAGeneration function
match = re.search(r'(async function triggerIAGeneration\(\) \{.*?\n        \})\n\n        function capturePhoto', inv_html, re.DOTALL)
if match:
    trigger_func = match.group(1)
    
    # Change the hardcoded id to "permiso_alturas"
    trigger_func = trigger_func.replace('const id = "investigacion_accidentes";', 'const id = "permiso_alturas";')
    
    # Read permiso_alturas.html
    with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'r', encoding='utf-8') as f:
        perm_html = f.read()
    
    # Insert before sendChatMessage
    if 'async function sendChatMessage' in perm_html:
        new_perm_html = perm_html.replace('async function sendChatMessage() {', trigger_func + '\n\n        async function sendChatMessage() {')
        
        with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'w', encoding='utf-8') as f:
            f.write(new_perm_html)
        print("Successfully injected triggerIAGeneration into permiso_alturas.html.")
    else:
        print("sendChatMessage not found in permiso_alturas.html.")
else:
    print("Could not find triggerIAGeneration in investigacion_accidentes.html.")
