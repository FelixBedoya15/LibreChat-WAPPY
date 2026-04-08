import os
import re

dir_path = '.'
for filename in os.listdir(dir_path):
    if not filename.endswith('.tsx'):
        continue
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to find handleDummyData blocks and replace setters inside them.
    # But it might be tricky. Let's do a simple regex for the easy ones (like setSomething('string') or setSomething(dummy.prop))
    # We'll just look for inside handleDummyData
    
    parts = content.split('const handleDummyData = () => {')
    if len(parts) < 2:
        continue
        
    new_content = parts[0]
    for i in range(1, len(parts)):
        chunk = parts[i]
        # split by end of function
        subparts = chunk.split('};', 1)
        if len(subparts) < 2:
            new_content += 'const handleDummyData = () => {' + chunk
            continue
            
        inner_func = subparts[0]
        # replace setSomething(val) with setSomething(prev => prev || (val))
        # regex to match setXyz(value)
        # ignore showToast, setEditorContent, setGeneratedX
        
        def replacer(match):
            setter = match.group(1)
            val = match.group(2)
            if setter in ['showToast', 'setEditorContent', 'setGenerated', 'setRefreshTrigger', 'setConversationId', 'setReportMessageId', 'setIsFormExpanded', 'setPerfiles', 'setFormData']:
                return f"{setter}({val})"
            if 'prev =>' in val:
                return match.group(0) # already functional
            return f"{setter}(prev => prev || ({val}))"
            
        new_inner = re.sub(r'([a-zA-Z0-9_]+)\((.*?)\)', replacer, inner_func)
        
        # fix setFormData if it exists
        def form_replacer(match):
            val = match.group(1)
            return f"setFormData(prev => ({{ ...({val}), ...Object.fromEntries(Object.entries(prev).filter(([_, v]) => HTMLInputElement || v)) }}))" # Too complex
            
        new_content += 'const handleDummyData = () => {' + new_inner + '};' + subparts[1]
        
    with open(filepath, 'w') as f:
        f.write(new_content)

print("Done")
