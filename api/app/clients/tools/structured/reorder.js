const fs = require('fs');

let content = fs.readFileSync('rit_template.js', 'utf8');

// The chapters are separated by <h2>
let parts = content.split('<h2');

// Parts array index:
// 0: Header
// 1: PREÁMBULO
// 2: CAP I
// ...
// 11: CAP X — PREVENCIÓN DEL ACOSO LABORAL (Ley 1010/2006)
// 12: CAP XI — PREVENCIÓN DEL ACOSO SEXUAL (Ley 2365/2024)
// 13: CAP XII — MECANISMOS DE RECLAMO Y PETICIONES
// 14: CAP XIII — PROTECCIÓN A GRUPOS CON ESTABILIDAD REFORZADA
// 15: CAP XIV — POLÍTICA DE SALUD MENTAL
// 16: CAP XV — PROTOCOLO DE ACOSO LABORAL — RUTA COMPLETA
// 17: CAP XVI — PROTOCOLO DE ACOSO SEXUAL — RUTA COMPLETA
// 18: CAP XVII — DISPOSICIONES FINALES

let capX = parts[11];
let capXI = parts[12];
let capXV = parts[16];
let capXVI = parts[17];

// Remove the <h2> tags from capXV and capXVI to append their contents
let contentXV = capXV.replace(/^>[^<]+<\/h2>/, '');
let contentXVI = capXVI.replace(/^>[^<]+<\/h2>/, '');

// Append to capX and capXI
parts[11] = capX.replace('>', '>CAPÍTULO X — PREVENCIÓN Y PROTOCOLO DE ACOSO LABORAL (Ley 1010/2006)') + contentXV;
parts[12] = capXI.replace('>', '>CAPÍTULO XI — PREVENCIÓN Y PROTOCOLO DE ACOSO SEXUAL (Ley 2365/2024)') + contentXVI;

// Remove old chapters 16 and 17
parts.splice(16, 2);

// Now, let's insert the "Fuero circunstancial" article into Chapter XIII (which is now at index 14)
let capXIII = parts[14];
let fueroCircunstancialArt = `
  <h3>Art. X° Fuero circunstancial</h3>
  <p>En el marco de la negociación colectiva y según lo consagrado en la ley, los trabajadores que hubieren presentado un pliego de peticiones al empleador no podrán ser despedidos sin justa causa comprobada, desde la fecha de presentación del pliego y durante los términos legales de las etapas de arreglo directo y huelga o tribunal de arbitramento. Toda desvinculación en contravía de este fuero circunstancial se presumirá ilegal y carecerá de todo efecto.</p>
`;
parts[14] = capXIII + fueroCircunstancialArt;

// Now rebuild the document
let newContent = parts[0] + parts.slice(1).map(p => '<h2' + p).join('');

// Re-number chapters (from CAPÍTULO I)
const romanNumerals = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];
let chapterCounter = 0;
newContent = newContent.replace(/<h2>CAPÍTULO [A-Z]+ — /g, (match) => {
  let replacement = `<h2>CAPÍTULO ${romanNumerals[chapterCounter]} — `;
  chapterCounter++;
  return replacement;
});

// Re-number articles
let articleCounter = 1;
newContent = newContent.replace(/<h3>Art\. \d+°/g, () => {
  let replacement = `<h3>Art. ${articleCounter}°`;
  articleCounter++;
  return replacement;
});
newContent = newContent.replace(/<h3>Art\. X°/g, () => {
  let replacement = `<h3>Art. ${articleCounter}°`;
  articleCounter++;
  return replacement;
});


fs.writeFileSync('rit_template.js', newContent);
console.log('Restructured successfully. Total chapters:', chapterCounter, 'Total articles:', articleCounter - 1);
