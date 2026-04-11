const fs = require('fs');
const file = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST/PerfilSociodemografico.tsx';
let content = fs.readFileSync(file, 'utf8');

// The problematic block:
// 668:                 </div>
// 669:                     </div>
// 670:                 </div>,
// 671:                 document.body
// 672:             )}

content = content.replace(
    /                <\/div>\n                    <\/div>\n                <\/div>,\n                document\.body\n            \)\}/g,
    `                    </div>\n                </div>,\n                document.body\n            )}`
);

fs.writeFileSync(file, content);
