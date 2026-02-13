
import os
import re
import json

# Configuration
SEARCH_DIRS = [
    'client/src/components',
    'client/src/routes',
    # Add other directories if needed
]
IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build']
EXTENSIONS = ['.jsx', '.tsx', '.js', '.ts']

# Regex patterns
# 1. Text content between JSX tags: >Some Text<
# This is tricky because of nested tags. We'll try a simple approach first.
# We'll look for > followed by non-< characters, then <
JSX_TEXT_PATTERN = re.compile(r'>([^<{]+)<')

# 2. Attributes that often contain user-facing text
ATTRIBUTE_PATTERN = re.compile(r'\b(placeholder|title|alt|aria-label|label)\s*=\s*(["\'])(.*?)\2')

# 3. Text inside specific function calls (optional, maybe alert()?)
# ALERT_PATTERN = re.compile(r'alert\((["\'])(.*?)\1\)')

def is_suspicious_string(s):
    s = s.strip()
    if not s:
        return False
    if len(s) < 2: # Ignore single characters
        return False
    if s.startswith('{') and s.endswith('}'): # Ignore expressions
        return False
    if s.startswith('http') or s.startswith('/'): # Ignore URLs/paths
        return False
    if re.match(r'^[0-9]+$', s): # Ignore numbers
        return False
    if re.match(r'^[a-zA-Z0-9_]+$', s): # Ignore likely variable names/keys (single word, no spaces)
        # But "Save" or "Cancel" are single words... 
        # Let's keep them if they start with uppercase
        if s[0].isupper() and s.lower() != 'id':
             return True
        return False
    
    # Check if it looks like code (assignment, function call)
    if '=' in s or '()' in s or '=>' in s:
        return False
        
    return True

def scan_file(filepath):
    results = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines):
            line_num = i + 1
            original_line = line.strip()
            
            # Skip comments
            if original_line.startswith('//') or original_line.startswith('/*') or original_line.startswith('*'):
                continue

            # Check for JSX Text
            # We iterate over matches in the line
            for match in JSX_TEXT_PATTERN.finditer(line):
                text = match.group(1).strip()
                if is_suspicious_string(text):
                    results.append({
                        'file': filepath,
                        'line': line_num,
                        'type': 'JSX Text',
                        'content': text,
                        'code': original_line
                    })

            # Check for Attributes
            for match in ATTRIBUTE_PATTERN.finditer(line):
                attr = match.group(1)
                text = match.group(3).strip()
                if is_suspicious_string(text):
                     results.append({
                        'file': filepath,
                        'line': line_num,
                        'type': f'Attribute ({attr})',
                        'content': text,
                        'code': original_line
                    })

    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        
    return results

def main():
    all_results = []
    print(f"Scanning directories: {SEARCH_DIRS}")
    
    for search_dir in SEARCH_DIRS:
        for root, dirs, files in os.walk(search_dir):
            # Filter ignore dirs
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for file in files:
                if any(file.endswith(ext) for ext in EXTENSIONS):
                    filepath = os.path.join(root, file)
                    file_results = scan_file(filepath)
                    all_results.extend(file_results)

    # Output results
    print(f"Found {len(all_results)} potential untranslated strings.")
    
    # Save to JSON for inspection
    with open('translation_audit.json', 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
        
    # Print first few matches as preview
    for res in all_results[:20]:
        print(f"[{res['type']}] {res['file']}:{res['line']} -> {res['content']}")

if __name__ == "__main__":
    main()
