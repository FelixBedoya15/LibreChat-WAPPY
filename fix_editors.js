const fs = require('fs');
const glob = require('glob');

const files = glob.sync('client/src/components/SGSST/*.tsx');

for (const file of files) {
  if (['CollapsibleReportBox.tsx'].some(f => file.includes(f))) continue;
  
  let content = fs.readFileSync(file, 'utf8');

  // Buscar {xxxxReport && ( ... )} o similares que envuelven <CollapsibleReportBox
  // Dado que el componente puede estar tabulado de varias formas, la regex usará un hack específico:
  // Buscamos algo parecido a: {nombreVariable && (\n <CollapsibleReportBox ... </CollapsibleReportBox> \n )}
  
  // Expresión regular que busca `{ algunaVariable && (` seguido por espacios, y luego `(<CollapsibleReportBox` o `<div` y finalmente el `)}`
  // O más sencillo: 
  // 1. Quitar { xxx && (
  // 2. Quitar )} que está justo después de </CollapsibleReportBox>
  
  const regexStart = /\{[a-zA-Z]+(Report|Objectives|Policy|Document|Doc|Matrix|Reporte|Reportes|Obj) && \(\s*(?:<div className="mt-4">)?\s*<CollapsibleReportBox/g;
  
  if (content.match(regexStart)) {
    console.log(`Fixing start in ${file}`);
    content = content.replace(/\{([a-zA-Z0-9_]+) && \(\s*(?:<div className="mt-[0-9]+">)?\s*<CollapsibleReportBox/g, (match, v) => {
        return match.replace(`{${v} && (`, '').trimStart();
    });

    // Ahora encontrar el `)}` que cerraba esa caja. 
    // Como siempre suele estar 1 o 2 líneas debajo de `</CollapsibleReportBox>`, busquemos:
    // </CollapsibleReportBox> \n </div> \n )}
    content = content.replace(/<\/CollapsibleReportBox>(\s*(?:<\/div>)?\s*)\)}/g, '</CollapsibleReportBox>$1');
    content = content.replace(/<\/CollapsibleReportBox>(\s*)\)}/g, '</CollapsibleReportBox>$1');

    fs.writeFileSync(file, content);
  }
}
