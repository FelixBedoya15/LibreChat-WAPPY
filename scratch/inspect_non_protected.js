const fs = require('fs');
const path = require('path');

const backupPath = path.resolve('/Users/venta/Documents/GitHub/LibreChat-WAPPY/Agentes/Agentes Wappy/wappy_agents_backup_2026-05-20.json');
const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

const PROTECTED_AGENTS = [
  'Asistente ATS',
  'Asistente de ACI',
  'Asistente Metodo ROSA',
  'Asistente Inv AT',
  'Asistente Inv EL',
  'Abogad@ RIT',
  'Expert@ IPEVAR GTC-45'
];

const nonProtected = data.filter(a => !PROTECTED_AGENTS.includes(a.name));

console.log(`Found ${nonProtected.length} non-protected agents in backup:`);
nonProtected.forEach(a => {
  console.log(`\nName: "${a.name}"`);
  console.log(`Tools:`, JSON.stringify(a.tools));
  console.log(`Instructions Length:`, a.instructions ? a.instructions.length : 0);
  console.log(`Snippet:`, a.instructions ? a.instructions.substring(0, 150).replace(/\n/g, ' ') + '...' : 'None');
});
