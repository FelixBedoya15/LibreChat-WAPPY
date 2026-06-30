require('dotenv').config();
const { init } = require('@heyputer/puter.js/src/init.cjs');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.PUTER_API_KEY;
if (!apiKey) {
  console.error('❌ Error: PUTER_API_KEY no está definido en tu archivo .env');
  console.log('Por favor, agrega la línea: PUTER_API_KEY=tu_token_de_puter en el archivo .env en la raíz de tu proyecto.');
  process.exit(1);
}

console.log('Inicializando Puter con el token de .env...');
const puter = init(apiKey);

console.log('Generando imagen de prueba...');
puter.ai.txt2img('Un lindo gato astronauta en el espacio, estilo cyberpunk, hiperdetallado', { model: 'gemini-2.5-flash-image-preview' })
  .then((result) => {
    console.log('✅ Imagen generada exitosamente!');
    const dataUrl = result.src;
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
      console.error('❌ Error: El formato de la imagen devuelto no es válido.');
      return;
    }
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const outputPath = path.join(__dirname, 'test_puter_output.png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`💾 Imagen de prueba guardada exitosamente en: ${outputPath}`);
  })
  .catch((err) => {
    console.error('❌ Error al generar imagen:', err);
  });
