import os
import re

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'

for file in os.listdir(sgsst_dir):
    if not file.endswith('.tsx'): continue
    
    path = os.path.join(sgsst_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    changed = False

    # This regex catches onClick={...}} disabled=...
    # and disabled={...}} title=...
    # We will just replace }} disabled= with } disabled=
    if '}} disabled=' in code:
        code = code.replace('}} disabled=', '} disabled=')
        changed = True

    if '}} title=' in code:
        code = code.replace('}} title=', '} title=')
        changed = True

    if '}} hideText' in code:
        code = code.replace('}} hideText', '} hideText')
        changed = True

    # Check for selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating}} hideText
    # Wait, the disabled={{GEN_DISABLED}} hideText was already caught by }} hideText.
    # What about content={...} fileName={...}} hideText
    # Caught by }} hideText.
    
    # Let's use regex to find any onClick={something}} and replace with onClick={something}
    # where something is a single word.
    new_code = re.sub(r'onClick=\{([a-zA-Z0-9_]+)\}\}', r'onClick={\1}', code)
    if new_code != code:
        code = new_code
        changed = True

    new_code_2 = re.sub(r'disabled=\{([^}]+)\}\}', r'disabled={\1}', code)
    if new_code_2 != code:
        code = new_code_2
        changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"Fixed trailing braces in {file}")
