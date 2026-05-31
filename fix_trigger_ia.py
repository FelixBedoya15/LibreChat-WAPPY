import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("safeGetLocalStorage('wappy_gemini_key')", "localStorage.getItem('wappy_gemini_key')")

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed safeGetLocalStorage.")
