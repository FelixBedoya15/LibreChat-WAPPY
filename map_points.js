
import fs from 'fs';
import path from 'path';

// Read file contents (simulated for the script, would normally read from disk)
const checklistPath = path.join(process.cwd(), 'client/src/components/SGSST/checklistData.ts');
const auditoriaPath = path.join(process.cwd(), 'client/src/components/SGSST/auditoriaData.ts');

const checklistContent = fs.readFileSync(checklistPath, 'utf8');
const auditoriaContent = fs.readFileSync(auditoriaPath, 'utf8');

// Regex to extract items with points from checklistData
const checklistItemRegex = /code:\s*'([^']+)',[\s\S]*?points:\s*([0-9.]+)/g;
const pointsMap = new Map();

let match;
while ((match = checklistItemRegex.exec(checklistContent)) !== null) {
    const code = match[1];
    const points = match[2];
    pointsMap.set(code, points);
}

console.log(`Found ${pointsMap.size} items with points in checklistData.`);

// Add points to auditoriaData
let newAuditoriaContent = auditoriaContent.replace(
    /(code:\s*'([^']+)',[\s\S]*?subCategory:.*?,)([\s\S]*?criteria:)/g,
    (match, p1, code, p3) => {
        const points = pointsMap.get(code);
        if (points) {
            // Check if points already exist to avoid duplication if run multiple times
            if (match.includes('points:')) return match;
            return `${p1}\n        points: ${points},${p3}`;
        }
        return match;
    }
);

// If simple regex fails due to structure, let's try a more robust approach:
// We'll replace the line "subcategory: '...'," with "subcategory: '...', points: X,"
newAuditoriaContent = auditoriaContent.replace(
    /code:\s*'([^']+)',[\s\S]*?subcategory:\s*'([^']+)',/g,
    (match, code) => {
        const points = pointsMap.get(code);
        if (points && !match.includes('points:')) {
            return `${match}\n        points: ${points},`;
        }
        return match;
    }
);

fs.writeFileSync(auditoriaPath, newAuditoriaContent);
console.log('Updated auditoriaData.ts with points.');
