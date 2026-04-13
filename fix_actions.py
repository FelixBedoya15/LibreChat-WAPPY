import os
import re

dir_path = 'client/src/components/SGSST'
for filename in os.listdir(dir_path):
    if not filename.endswith('.tsx'):
        continue
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    if "CollapsibleReportBox" not in content:
        continue
        
    print(f"\n--- {filename} ---")
    
    # Let's extract the `actions={` block
    # This might be tricky because it can span multiple lines.
    # We can try to look for `actions={` and then find the closing `}`
    # but since it contains JSX, counting brackets is safer.
    
    start_idx = content.find("actions={")
    if start_idx == -1:
        print("No actions prop found")
        continue

    open_braces = 0
    end_idx = -1
    for i in range(start_idx + 8, len(content)):
        if content[i] == '{':
            open_braces += 1
        elif content[i] == '}':
            open_braces -= 1
            if open_braces == 0:
                end_idx = i + 1
                break
                
    if end_idx != -1:
        print(content[start_idx:end_idx])

