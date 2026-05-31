import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('value="Carlos Mario Restrepo"', 'value=""'),
    ('value="71.234.567"', 'value=""'),
    ('value="Diana Patricia Gómez"', 'value=""'),
    ('value="1.036.789.012"', 'value=""'),
    ('value="Félix Bedoya"', 'value=""'),
    ('value="98.765.432"', 'value=""'),
    ('value="Lic. #987654321 de la Sec. Salud"', 'value=""'),
    
    ('"signer-jefe-name": "Carlos Mario Restrepo"', '"signer-jefe-name": ""'),
    ('"signer-jefe-cc": "71.234.567"', '"signer-jefe-cc": ""'),
    ('"signer-copasst-name": "Diana Patricia Gómez"', '"signer-copasst-name": ""'),
    ('"signer-copasst-cc": "1.036.789.012"', '"signer-copasst-cc": ""'),
    ('"signer-sgsst-name": "Félix Bedoya"', '"signer-sgsst-name": ""'),
    ('"signer-sgsst-cc": "98.765.432"', '"signer-sgsst-cc": ""'),
    ('"signer-sgsst-license": "Lic. #987654321 de la Sec. Salud"', '"signer-sgsst-license": ""')
]

for old, new in replacements:
    content = content.replace(old, new)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/investigacion_accidentes.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced signature defaults.")
