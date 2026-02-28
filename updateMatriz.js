const fs = require('fs');
const tsTranspile = require('typescript'); // if we need to parse

// Hacky but simple file string extraction
const checklistStr = fs.readFileSync('./client/src/components/SGSST/checklistData.ts', 'utf8');

const match = checklistStr.match(/export const ARTICLE_16_STANDARDS: ChecklistItem\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error("Could not find array");
    process.exit(1);
}

// Evaluate string as object (we can use Function constructor)
const arrayCode = match[1];
const items = new Function(`return ${arrayCode};`)();

const matrizItems = items.map(item => {
    return `    {
        id: 'ml_0312_${item.code.replace(/\./g, '_')}',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E${item.code}',
        descripcion: ${JSON.stringify(item.name + '. ' + item.description)},
        evidencia: ${JSON.stringify(item.evaluation)},
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    }`;
}).join(',\n');

let matrizStr = fs.readFileSync('./client/src/components/SGSST/matrizLegalData.ts', 'utf8');

const regex = /(\s*\/\/ RESOLUCIÓN 0312 DE 2019 - ESTÁNDARES MÍNIMOS\s*)[\s\S]*?(?=\s*\/\/ DECRETO 1072 DE 2015)/;
matrizStr = matrizStr.replace(regex, `$1\n${matrizItems},\n\n`);

fs.writeFileSync('./client/src/components/SGSST/matrizLegalData.ts', matrizStr, 'utf8');
console.log('Successfully injected exactly 60 items into matrizLegalData.ts');
