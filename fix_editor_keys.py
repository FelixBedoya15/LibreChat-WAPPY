import os
import re

directory = "/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST"

for filename in os.listdir(directory):
    if not filename.endswith(".tsx"):
        continue
    filepath = os.path.join(directory, filename)
    
    with open(filepath, 'r') as f:
        content = f.read()

    # Skip if editorKey already exists
    if "const [editorKey, setEditorKey]" in content:
        continue

    # Skip if LiveEditor doesn't exist
    if "LiveEditor" not in content:
        continue

    print(f"Fixing {filename}")

    # 1. Add editorKey state near conversationId or isGenerating
    state_added = False
    
    # Try finding conversationId state first
    if "const [conversationId, setConversationId]" in content:
        content = re.sub(
            r"(const \[conversationId, setConversationId\].*\n)",
            r"\1    const [editorKey, setEditorKey] = useState(() => Date.now().toString());\n",
            content,
            count=1
        )
        state_added = True
    elif "const [isGenerating, setIsGenerating]" in content:
        content = re.sub(
            r"(const \[isGenerating, setIsGenerating\].*\n)",
            r"\1    const [editorKey, setEditorKey] = useState(() => Date.now().toString());\n",
            content,
            count=1
        )
        state_added = True

    if not state_added:
        print(f"  Warning: Could not find place to add state in {filename}")
        continue

    # 2. Update the key prop on LiveEditor. It could be on its own line or same line
    # Match key={...} inside <LiveEditor
    content = re.sub(
        r"(<LiveEditor[^>]*?)key=\{conversationId \|\| '[^']+'\}",
        r"\1key={editorKey}",
        content
    )
    
    # 3. Add setEditorKey(Date.now().toString()) inside the generate success block.
    # Usually we can find setIsFormExpanded(false); inside the try block of generation.
    # A safe place is where we update the generated doc.
    # Let's find "showToast({ message: '... generado exitosamente', status: 'success' });"
    # or "setIsFormExpanded(false);" inside generation.
    
    # Better approach for #3: 
    # Look for setting the generated content: `setGenerated...(` where the method is handleGenerate or handleAnalyze
    # It's safer to just inject `setEditorKey(Date.now().toString());` right before `setIsFormExpanded(false);`
    
    content = re.sub(
        r"(setIsFormExpanded\(false\);)",
        r"setEditorKey(Date.now().toString());\n            \1",
        content
    )

    with open(filepath, 'w') as f:
        f.write(content)

print("Done")
