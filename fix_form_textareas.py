import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r'"at-version-trabajador": "Estaba caminando[^"]*"', '"at-version-trabajador": ""'),
    (r'"at-evento-desc": "El operario transitaba[^"]*"', '"at-evento-desc": ""')
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced textarea defaults in JSON.")
