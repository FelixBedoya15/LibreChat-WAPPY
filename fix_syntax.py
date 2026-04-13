import os
import re

dir_path = 'client/src/components/SGSST'

for filename in os.listdir(dir_path):
    if not filename.endswith('.tsx'):
        continue
        
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # The issue:
    # icon={<IconName className="something" /
    # actions={...}
    # >}
    
    # We want to replace `/ \n actions={` with `/>} \n actions={`
    # And replace `>}\n >` with just `>` or fix the `>} \n \n >`

    # Actually, let's fix it safely using regex.
    # Pattern 1: `/\n                    actions={`
    # Should become: `/>}\n                    actions={`
    if 'actions={' in content:
        # Fix the unclosed icon tag ` / \n actions=` -> ` />}\n actions=`
        content = re.sub(r'/\s+actions=\{', '/>}\n                    actions={', content)
        # Fix the extra `>}...>` -> `>`
        content = re.sub(r'>\}\s*>', '>', content)
        
        with open(filepath, 'w') as f:
            f.write(content)
            print(f"Fixed syntax in {filename}")

