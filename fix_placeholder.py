import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('placeholder="Ej: Observé cuando resbaló con el aceite..."', 'placeholder="Ej: Escriba aquí la versión completa del testigo..."')

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated placeholder.")
