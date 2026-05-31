import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r'value="WAPPY SA"', 'value=""'),
    (r'value="901437310-8"', 'value=""'),
    (r'value="Colmena Seguros"', 'value=""'),
    (r'value="Juan Carlos Gómez Bedoya"', 'value=""'),
    (r'value="1\.018\.452\.963"', 'value=""'),
    (r'value="Auxiliar de Almacenamiento y Despacho"', 'value=""'),
    (r'value="Logística y Distribución"', 'value=""'),
    (r'value="2026-05-29"', 'value=""'),
    (r'value="09:30"', 'value=""'),
    (r'value="Bodega Central - Pasillo 2 de Distribución"', 'value=""'),

    (r'"aportante-razon": "WAPPY SA"', '"aportante-razon": ""'),
    (r'"aportante-nit": "901437310-8"', '"aportante-nit": ""'),
    (r'"aportante-arl": "Colmena Seguros"', '"aportante-arl": ""'),
    (r'"trabajador-nombre": "Juan Carlos Gómez Bedoya"', '"trabajador-nombre": ""'),
    (r'"trabajador-cedula": "1.018.452.963"', '"trabajador-cedula": ""'),
    (r'"trabajador-cargo": "Auxiliar de Almacenamiento y Despacho"', '"trabajador-cargo": ""'),
    (r'"trabajador-area": "Logística y Distribución"', '"trabajador-area": ""'),
    (r'"evento-fecha": "2026-05-29"', '"evento-fecha": ""'),
    (r'"evento-hora": "09:30"', '"evento-hora": ""'),
    (r'"evento-lugar": "Bodega Central - Pasillo 2 de Distribución"', '"evento-lugar": ""')
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced ident defaults.")
