import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("renderCausesTree();", "if(typeof renderCausesTree === 'function') renderCausesTree();")

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Safeguarded renderCausesTree.")
