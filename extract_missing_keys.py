import json

# Cargar archivos
with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/en/translation.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json', 'r', encoding='utf-8') as f:
    es = json.load(f)

# Encontrar claves faltantes
missing_keys = [k for k in en.keys() if k not in es]

print(f"Total missing keys: {len(missing_keys)}")
print(f"\nFirst 50 missing keys:")
for i, key in enumerate(missing_keys[:50]):
    print(f"{i+1}. {key}")
