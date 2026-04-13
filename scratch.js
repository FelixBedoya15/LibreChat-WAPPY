const fs = require('fs');
const content = fs.readFileSync('client/src/components/SGSST/CondicionesSalud.tsx', 'utf8');

const tSaludIndex = content.indexOf('{/* TAB 2: SALUD Y HÁBITOS (BIOMONITOREO) */}');
const tSaludEnd = content.indexOf('{/* TAB 3: ROLES Y FIRMA */}');

let saludContent = content.substring(tSaludIndex, tSaludEnd);
saludContent = saludContent.replace("{(workerTabs[w.id] || 'general') === 'salud' && (", "");
saludContent = saludContent.substring(0, saludContent.lastIndexOf(')}')); // remove the closing )}

const tabsHeaderStart = content.indexOf('{/* Tabs Header */}');
const tabContentStart = content.indexOf('{/* Tab Content */}');
const workerContentEnd = content.indexOf('{/* ═══ End of Worker Loop ═══ */}') !== -1 ? content.indexOf('{/* ═══ End of Worker Loop ═══ */}') : content.indexOf('</div>\n                                </div>\n                            </div>\n                            );\n                        })}\n                    </>');

let newContent = content.substring(0, tabsHeaderStart) + 
  '\n                                        <div className="p-4 bg-surface-primary/10">\n' +
  saludContent + 
  '\n                                        </div>\n' +
  content.substring(workerContentEnd);

fs.writeFileSync('client/src/components/SGSST/CondicionesSalud.tsx', newContent);
console.log("Replaced successfully!");
