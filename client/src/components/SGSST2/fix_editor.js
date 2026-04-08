const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST/*.tsx');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Only match setEditorContent that happens with a semicolon or is clearly inside a procedural block,
    // avoiding the ones inside JSX brackets `onUpdate={setEditorContent}` or `(html) => setEditorContent(html)`
    
    // Pattern 1: `setEditorContent(html);`
    // Pattern 2: `setEditorContent(data.policy);`
    // Pattern 3: `setEditorContent(lastMsg.text);`
    // Pattern 4: `setEditorContent(content);`
    
    content = content.replace(/(setEditorContent\([a-zA-Z0-9_\.]+\);)(?!\s*setEditorKey)/g, (match, capture) => {
        changed = true;
        return capture + '\n            setEditorKey(Date.now().toString());';
    });

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Fixed setEditorKey in', file);
    }
});
