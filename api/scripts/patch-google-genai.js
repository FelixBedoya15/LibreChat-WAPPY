const fs = require('fs');
const path = require('path');

console.log('=== Inicia parche para @google/generative-ai (Stream Parser & Unhandled Rejection Fix) ===');

const baseDirs = [
  path.resolve(__dirname, '../../node_modules/@google/generative-ai'),
  path.resolve(__dirname, '../node_modules/@google/generative-ai'),
  '/app/node_modules/@google/generative-ai',
];

let targetFile = null;
for (const dir of baseDirs) {
  const candidate = path.join(dir, 'dist/index.js');
  if (fs.existsSync(candidate)) {
    targetFile = candidate;
    break;
  }
}

if (!targetFile) {
  console.log('ℹ️ No se encontró @google/generative-ai para parchear directamente (puede aplicarse con patch-package).');
  process.exit(0);
}

console.log('Archivo @google/generative-ai encontrado:', targetFile);

let content = fs.readFileSync(targetFile, 'utf8');

// 1. Parchear processStream para atrapar UnhandledRejection en respPromise
if (!content.includes('respPromise.catch')) {
  content = content.replace(
    /const \[stream1, stream2\] = responseStream\.tee\(\);\s*return \{\s*stream: generateResponseSequence\(stream1\),\s*response: getResponsePromise\(stream2\),/g,
    `const [stream1, stream2] = responseStream.tee();
    const respPromise = getResponsePromise(stream2);
    respPromise.catch(() => {});
    return {
        stream: generateResponseSequence(stream1),
        response: respPromise,`
  );
}

// 2. Parchear getResponseStream para limpiar comentarios SSE (: keepalive) y parsear trailing chunks
if (!content.includes('currentText.replace(/^(?::[^\\n]*\\r?\\n|\\r?\\n)+/')) {
  content = content.replace(
    /if \(done\) \{\s*if \(currentText\.trim\(\)\) \{\s*controller\.error\(new GoogleGenerativeAIError\("Failed to parse stream"\)\);\s*return;\s*\}\s*controller\.close\(\);\s*return;\s*\}/g,
    `if (done) {
                        currentText = currentText.replace(/^(?::[^\\n]*\\r?\\n|\\r?\\n)+/, "");
                        if (currentText.trim()) {
                            const trimmed = currentText.trim();
                            if (trimmed.startsWith("data: ")) {
                                try {
                                    const parsedResponse = JSON.parse(trimmed.substring(6).trim());
                                    controller.enqueue(parsedResponse);
                                    currentText = "";
                                }
                                catch (e) {
                                    // keep currentText for error
                                }
                            }
                            else if (trimmed === "data: [DONE]" || trimmed.startsWith(":")) {
                                currentText = "";
                            }
                        }
                        if (currentText.trim()) {
                            controller.error(new GoogleGenerativeAIError("Failed to parse stream"));
                            return;
                        }
                        controller.close();
                        return;
                    }`
  );

  content = content.replace(
    /currentText \+= value;\s*let match = currentText\.match\(responseLineRE\);/g,
    `currentText += value;
                    currentText = currentText.replace(/^(?::[^\\n]*\\r?\\n|\\r?\\n)+/, "");
                    let match = currentText.match(responseLineRE);`
  );

  content = content.replace(
    /currentText = currentText\.substring\(match\[0\]\.length\);\s*match = currentText\.match\(responseLineRE\);/g,
    `currentText = currentText.substring(match[0].length);
                        currentText = currentText.replace(/^(?::[^\\n]*\\r?\\n|\\r?\\n)+/, "");
                        match = currentText.match(responseLineRE);`
  );
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ @google/generative-ai parcheado exitosamente con Stream Parser & Unhandled Rejection Fix.');
