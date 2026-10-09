import re

# 1. Update manifest.json
manifest_path = 'api/app/clients/tools/manifest.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = f.read()

pubchem_plugin = """  },
  {
    "name": "PubChem GHS API",
    "pluginKey": "pubchem_api",
    "description": "Busca información, clasificación SGA (GHS) y pictogramas de seguridad química en la base de datos oficial de PubChem (NIH).",
    "icon": "https://cdn-icons-png.flaticon.com/512/3063/3063255.png",
    "authConfig": []"""

if '"pluginKey": "pubchem_api"' not in manifest:
    manifest = manifest.replace('  },', pubchem_plugin, 1)
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write(manifest)

# 2. Update handleTools.js
handle_path = 'api/app/clients/tools/util/handleTools.js'
with open(handle_path, 'r', encoding='utf-8') as f:
    handle = f.read()

if "pubchem_api: async" not in handle:
    # Add import
    handle = handle.replace(
        "const MatrizCompatibilidad = require('../structured/MatrizCompatibilidad');",
        "const MatrizCompatibilidad = require('../structured/MatrizCompatibilidad');\nconst PubChem = require('../structured/PubChem');"
    )
    
    # Add tool mapping
    tool_map = """    pubchem_api: async () => {
      return new PubChem();
    },
    matriz_compatibilidad:"""
    handle = handle.replace("    matriz_compatibilidad:", tool_map)
    
    with open(handle_path, 'w', encoding='utf-8') as f:
        f.write(handle)

