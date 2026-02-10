const fs = require('fs');
const path = require('path');

const enPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/en/translation.json';
const esPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json';

try {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

    const missingKeys = [];
    const sameValues = [];
    const suspiciousValues = []; // Values that are in English in the ES file (heuristic)

    // Heuristic to detect English text
    const isEnglish = (text) => {
        const commonEnglishWords = [' the ', ' is ', ' are ', ' and ', ' of ', ' to ', ' in ', ' for ', ' with ', ' on ', ' at ', ' by ', ' from ', ' up ', ' about ', ' into ', ' over ', ' after '];
        return commonEnglishWords.some(word => text.toLowerCase().includes(word));
    };

    for (const key in en) {
        if (!es.hasOwnProperty(key)) {
            missingKeys.push(key);
        } else {
            if (en[key] === es[key] && typeof en[key] === 'string' && en[key].length > 3) {
                // Filter out some common false positives like "Email", "ID", simple numbers or symbols
                if (!['Email', 'ID', 'URL', 'API', 'MCP'].includes(en[key])) {
                    sameValues.push({ key, value: en[key] });
                }
            } else if (isEnglish(es[key])) {
                suspiciousValues.push({ key, value: es[key] });
            }
        }
    }

    console.log('--- Missing Keys in ES ---');
    console.log(JSON.stringify(missingKeys, null, 2));

    console.log('\n--- Same Values (Potential Untranslated) ---');
    // Limit output
    console.log(JSON.stringify(sameValues.slice(0, 50), null, 2));
    if (sameValues.length > 50) console.log(`... and ${sameValues.length - 50} more.`);

    console.log('\n--- Suspicious English-like Values in ES ---');
    console.log(JSON.stringify(suspiciousValues.slice(0, 50), null, 2));
    if (suspiciousValues.length > 50) console.log(`... and ${suspiciousValues.length - 50} more.`);

} catch (e) {
    console.error('Error reading or parsing files:', e);
}
