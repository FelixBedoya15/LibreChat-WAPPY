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

// 2. Parchear getResponseStream para limpiar comentarios SSE (: keepalive) y parsear trailing chunks sin lanzar error fatal al cerrar
const targetClose = 'if (done) {\n                        if (currentText.trim()) {\n                            controller.error(new GoogleGenerativeAIError("Failed to parse stream"));\n                            return;\n                        }\n                        controller.close();\n                        return;\n                    }';

const safeClose = `if (done) {
                        currentText = currentText.replace(/^(?::[^\\n]*\\r?\\n|\\r?\\n)+/, "");
                        if (currentText.trim()) {
                            const lines = currentText.split(/\\r?\\n/);
                            for (const line of lines) {
                                const clean = line.replace(/^data:\\s*/, '').trim();
                                if (clean && clean !== '[DONE]' && !clean.startsWith(':')) {
                                    try {
                                        const parsed = JSON.parse(clean);
                                        controller.enqueue(parsed);
                                    } catch (e) {
                                        // Ignore incomplete tail or non-JSON comments on close
                                    }
                                }
                            }
                        }
                        controller.close();
                        return;
                    }`;

if (content.includes(targetClose)) {
  content = content.replace(targetClose, safeClose);
}

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

// 3. Parchear generateContentStream y generateContent para manejar RangeError (Invalid string length)
if (!content.includes('Texto truncado por límite de tamaño')) {
  const sanitizeFunction = `    let body;
    try {
        body = JSON.stringify(params);
    } catch (err) {
        if (err.name === 'RangeError' || (err.message && err.message.includes('Invalid string length'))) {
            const sanitizeObj = (obj) => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(sanitizeObj).filter((item) => item !== null && item !== undefined);
                const clean = {};
                for (const key of Object.keys(obj)) {
                    const val = obj[key];
                    if (key === 'inlineData' || key === 'inline_data') {
                        if (val && typeof val === 'object' && val.data && typeof val.data === 'string' && val.data.length > 35000000) {
                            continue;
                        }
                    }
                    if (key === 'data' && typeof val === 'string' && val.length > 35000000) {
                        continue;
                    }
                    if (typeof val === 'string' && val.length > 1000000) {
                        clean[key] = val.substring(0, 500000) + '\\n\\n[...Texto truncado por límite de tamaño...]';
                    } else if (typeof val === 'object' && val !== null) {
                        clean[key] = sanitizeObj(val);
                    } else {
                        clean[key] = val;
                    }
                }
                return clean;
            };
            body = JSON.stringify(sanitizeObj(params));
        } else {
            throw err;
        }
    }`;

  content = content.replace(
    /const response = await makeModelRequest\(model, Task\.STREAM_GENERATE_CONTENT, apiKey,\s*\/\* stream \*\/ true, JSON\.stringify\(params\), requestOptions\);/g,
    `${sanitizeFunction}\n    const response = await makeModelRequest(model, Task.STREAM_GENERATE_CONTENT, apiKey, /* stream */ true, body, requestOptions);`
  );

  content = content.replace(
    /const response = await makeModelRequest\(model, Task\.GENERATE_CONTENT, apiKey,\s*\/\* stream \*\/ false, JSON\.stringify\(params\), requestOptions\);/g,
    `${sanitizeFunction}\n    const response = await makeModelRequest(model, Task.GENERATE_CONTENT, apiKey, /* stream */ false, body, requestOptions);`
  );
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ @google/generative-ai parcheado exitosamente con Stream Parser, RangeError Sanitizer & Unhandled Rejection Fix.');

