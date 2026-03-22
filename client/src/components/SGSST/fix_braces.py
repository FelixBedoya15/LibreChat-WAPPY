import os
import re

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'

for file in os.listdir(sgsst_dir):
    if not file.endswith('.tsx'): continue
    path = os.path.join(sgsst_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    changed = False

    if 'onClick={{' in code:
        code = code.replace('onClick={{', 'onClick={')
        changed = True

    if 'disabled={{' in code:
        code = code.replace('disabled={{', 'disabled={')
        changed = True

    if '}} title="Generar' in code:
        code = code.replace('}} title="Generar', '} title="Generar')
        changed = True

    if '}} title="Guardar' in code:
        code = code.replace('}} title="Guardar', '} title="Guardar')
        changed = True

    if '}} hideText' in code:
        code = code.replace('}} hideText', '} hideText')
        changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"Fixed braces in {file}")
