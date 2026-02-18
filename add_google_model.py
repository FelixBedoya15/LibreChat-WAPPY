
import os

file_path = 'librechat.yaml'
model_config = [
    '  google:\n',
    '    title: "Google"\n',
    '    apiKey: "${GOOGLE_KEY}"\n',
    '    models:\n',
    '      default:\n',
    '        - "gemini-2.5-pro"\n',
    '        - "gemini-2.5-flash"\n',
    '        - "gemini-3-flash-preview"\n',
    '        - "gemini-2.5-flash-lite"\n',
    '        - "gemini-2.5-flash-lite-preview-09-2025"\n',
    '        - "gemini-2.0-flash"\n',
    '        - "gemini-3-flash-preview"\n',
    '      fetch: true\n'
]

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
inserted = False
for line in lines:
    new_lines.append(line)
    if 'endpoints:' in line and not inserted:
        # Check if google is already defined immediately (simple check)
        # Assuming we insert right after endpoints:
        new_lines.extend(model_config)
        inserted = True

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Updated librechat.yaml")
