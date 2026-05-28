import os
import re

components_dir = "/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components"

for root, _, files in os.walk(components_dir):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            if '<CollapsibleReportBox' in content and '<LiveEditor' in content:
                # Find the onSave handler in LiveEditor
                save_match = re.search(r'<LiveEditor[^>]*onSave=\{([^}]+)\}', content, re.DOTALL)
                if save_match:
                    handler = save_match.group(1).strip()
                    
                    # Add onSave={handler} to CollapsibleReportBox
                    # Only if not already present
                    if 'onSave={' not in content.split('<CollapsibleReportBox')[1].split('>')[0]:
                        new_content = re.sub(
                            r'(<CollapsibleReportBox\s+)',
                            fr'\1onSave={{{handler}}} ',
                            content
                        )
                        
                        if new_content != content:
                            with open(filepath, 'w') as f:
                                f.write(new_content)
                            print(f"Updated {file} with onSave={{{handler}}}")
