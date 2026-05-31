import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Witnesses
witnesses_data = '[\n        {\n            "id": 1,\n            "name": "Carlos Ortiz",\n            "doc": "71.345.678",\n            "testimony": "Observé cuando resbaló con el aceite..."\n        }\n    ]'
content = re.sub(r'"witnesses":\s*\[\s*\]', f'"witnesses": {witnesses_data}', content)

# Averías
averias_data = '[\n        {\n            "id": 1,\n            "equipment": "Montacargas #03",\n            "desc": "Válvula rota con fuga activa",\n            "criticality": "Baja - Operación normal"\n        }\n    ]'
content = re.sub(r'"averias":\s*\[\s*\]', f'"averias": {averias_data}', content)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Example data for witnesses and averias added.")
