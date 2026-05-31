import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the data to be added back
data = {
    'aportante-razon': 'WAPPY SA',
    'aportante-nit': '901437310-8',
    'aportante-arl': 'Colmena Seguros',
    'trabajador-nombre': 'Juan Carlos Gómez Bedoya',
    'trabajador-cedula': '1.018.452.963',
    'trabajador-cargo': 'Auxiliar de Almacenamiento y Despacho',
    'trabajador-area': 'Logística y Distribución',
    'evento-fecha': '2026-05-29',
    'evento-hora': '09:30',
    'evento-lugar': 'Bodega Central - Pasillo 2 de Distribución',
    'at-version-trabajador': 'Estaba caminando por el pasillo llevando una caja pesada que me tapaba un poco la visual hacia abajo, cuando de repente pisé algo muy resbaloso y perdí el equilibrio. Sentí que me resbalé y caí de lado. Al intentar amortiguar el golpe apoyé la mano izquierda contra el concreto y sentí un fuerte tirón y dolor en la muñeca.',
    'at-evento-desc': 'El operario transitaba a las 09:30 AM por el pasillo 2 de la Bodega Central transportando una caja de pedidos, cuando resbaló de manera imprevista debido a una fuga de aceite hidráulico acumulada en el suelo proveniente del montacargas #03, la cual no había sido reportada ni señalizada preventivamente. Al caer al suelo, el operario apoyó fuertemente su mano izquierda, sufriendo un trauma menor en miembro superior izquierdo. Presenciado por el operario Carlos Ortiz.'
}

# Update the HTML inputs with value="..."
for key, value in data.items():
    if key in ['at-version-trabajador', 'at-evento-desc']:
        continue # these are textareas
    
    # Replace empty values in inputs
    pattern = rf'(id="{key}"[^>]*?)value=""'
    replacement = rf'\1value="{value}"'
    content = re.sub(pattern, replacement, content)
    
    # Also in JSON
    pattern_json = rf'"{key}": ""'
    replacement_json = rf'"{key}": "{value}"'
    content = re.sub(pattern_json, replacement_json, content)

# For textareas, we just add the value into the JSON, the JS loadState will populate it.
for key in ['at-version-trabajador', 'at-evento-desc']:
    pattern_json = rf'"{key}": ""'
    replacement_json = rf'"{key}": "{data[key]}"'
    content = re.sub(pattern_json, replacement_json, content)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Example data for steps 1 and 2 added.")
