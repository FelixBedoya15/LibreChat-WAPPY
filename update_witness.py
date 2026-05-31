import re
import json

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Witnesses update
witnesses_data = '[\n        {\n            "id": 1,\n            "name": "Carlos Ortiz",\n            "doc": "71.345.678",\n            "testimony": "Observé cuando Juan Gómez iba caminando por el pasillo central llevando la caja de repuestos. De repente pisó un charco de aceite que provenía del montacargas #03, el cual estaba perdiendo líquido sin que nos diéramos cuenta. Juan resbaló y cayó de medio lado, apoyando todo el peso en su mano izquierda. De inmediato fuimos a socorrerlo porque se quejaba de un dolor agudo en la muñeca."\n        }\n    ]'

content = re.sub(r'"witnesses":\s*\[\s*\{\s*"id":\s*1,\s*"name":\s*"Carlos Ortiz"[^\]]+\]', f'"witnesses": {witnesses_data}', content)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated testimony.")
