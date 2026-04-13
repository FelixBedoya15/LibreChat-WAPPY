import fs from 'fs';
import path from 'path';

const dir = 'client/src/components/SGSST';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const f of files) {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix TAG bug in CondicionesSalud
    if (f === 'CondicionesSalud.tsx') {
        content = content.replace(/tags:\s*\['sgsst-perfil-sociodemografico'\]/g, "tags: ['sgsst-condiciones-salud']");
        content = content.replace(/tags=\{?\['sgsst-perfil-sociodemografico'\]\}?/g, "tags={['sgsst-condiciones-salud']}");
    }

    // Identify handleSelectReport block and inject setEditorKey
    // Usually looks like: setEditorContent(content);
    // Let's use a regex that matches `setEditorContent(VAR);` followed by `setConversationId` or similar, 
    // OR we just do: `setEditorContent(loadedContent);` -> `setEditorContent(loadedContent); setEditorKey(Date.now().toString());`

    // We only want to replace setEditorContent(...) when it's NOT inside onUpdate.
    // onUpdate={(content) => setEditorContent(content)} -> we must NOT touch this.
    // So let's replace all `setEditorContent(VAR);` except `onUpdate={(content) => setEditorContent(content)}`.
    
    // Regex: find setEditorContent( something_not_empty ) followed by a semicolon or newline, that is NOT inside onUpdate.
    
    content = content.replace(/setEditorContent\(([^)]+)\)(;?)/g, (match, p1, p2) => {
        // Skip if it's the onUpdate handler explicitly
        if (p1 === 'content' && match.includes('setEditorContent(content)')) {
            // Check if context looks like onUpdate... wait, this is hard with just string replace without context.
            return match; 
        }
        // Let's just append setEditorKey
        // Wait, "content" might be the variable used in handleSelectReport. e.g. setEditorContent(content);
        // Let's check how onUpdate is written: `onUpdate={(content) => setEditorContent(content)}`
        return `${match} setEditorKey(Date.now().toString());`;
    });

    // Actually, onUpdate is specifically: `onUpdate={(content) => setEditorContent(content)}`
    // Wait, the above regex will add setEditorKey inside onUpdate if p1 === 'content' IS bypassed. We SHOULD skip it.
}
