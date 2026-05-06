const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'api', 'server', 'routes', 'sgsst');

function processDirectory(dirPath) {
    fs.readdir(dirPath, { withFileTypes: true }, (err, dirents) => {
        if (err) {
            console.error(`Error reading directory ${dirPath}:`, err);
            return;
        }

        dirents.forEach(dirent => {
            const fullPath = path.join(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                processDirectory(fullPath);
            } else if (dirent.isFile() && fullPath.endsWith('.js')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                
                // We want to replace `{ $in: [companyId, null] }` with `companyId`
                // Because { companyId: { $in: [companyId, null] } } becomes { companyId: companyId }
                // Let's use a regex to catch spacing variations
                const regex = /\{\s*\$in\s*:\s*\[companyId\s*,\s*null\]\s*\}/g;
                
                if (regex.test(content)) {
                    content = content.replace(regex, 'companyId');
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log(`Replaced in: ${fullPath}`);
                }
            }
        });
    });
}

processDirectory(directoryPath);
