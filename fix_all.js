const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST/*.tsx');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add editorKey state if missing, right after the main component declaration
    if (!content.includes('const [editorKey, setEditorKey]')) {
        content = content.replace(/const \[isGenerating/g, `const [editorKey, setEditorKey] = useState(() => Date.now().toString());\n    const [isGenerating`);
    }

    // Replace LiveEditor key to use editorKey if it exists and uses conversationId or something static
    content = content.replace(/<LiveEditor[^>]*key=\{[^\}]*\}[^>]*>/g, (match) => {
        if (!match.includes('editorKey')) {
            return match.replace(/key=\{[^\}]*\}/, 'key={editorKey}');
        }
        return match;
    });

    // We want to force re-render when a new generation happens.
    // So we search for `setIsFormExpanded(false);` which is used everywhere after generating or loading
    // and append `setEditorKey(Date.now().toString());` before it, only if it doesn't already have it
    content = content.replace(/setIsFormExpanded\(false\);/g, (match, offset, str) => {
        const prevText = str.substring(offset - 60, offset);
        if (!prevText.includes('setEditorKey')) {
            return `setEditorKey(Date.now().toString());\n            setIsFormExpanded(false);`;
        }
        return match;
    });

    // write back
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});
