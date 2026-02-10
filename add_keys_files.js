const fs = require('fs');
const path = require('path');

const esPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json';
const enPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/en/translation.json';

const newKeys = {
    // Files - Upload Modal
    "com_ui_upload_file": { es: "Subir un Archivo", en: "Upload a File" },
    "com_ui_upload_file_instructions": { es: "Por favor suba un archivo cuadrado, de tamaño menor a 100KB", en: "Please upload square file, size less than 100KB" },
    "com_ui_choose_file": { es: "Elegir Archivo", en: "Choose File" },
    "com_ui_no_file_chosen": { es: "Ningún archivo elegido", en: "No File Chosen" },
    "com_ui_file_name_desc": { es: "El nombre del archivo subido", en: "The name of the uploaded file" },
    "com_ui_file_purpose_desc": { es: "El propósito del archivo subido", en: "The purpose of the uploaded file" },
    "com_ui_learn_file_purpose": { es: "Aprenda sobre el propósito del archivo", en: "Learn about file purpose" },
    "com_ui_upload": { es: "Subir", en: "Upload" },

    // Files - Vector Store
    "com_ui_add_store": { es: "Agregar Tienda", en: "Add Store" },
    "com_ui_vector_stores": { es: "Tiendas Vectoriales", en: "Vector Stores" }
};

function updateFile(filePath, lang) {
    try {
        let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let added = 0;
        for (const [key, values] of Object.entries(newKeys)) {
            if (!content[key]) {
                content[key] = values[lang];
                added++;
            }
        }
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
        console.log(`Added ${added} keys to ${lang} file.`);
    } catch (e) {
        console.error(`Error updating ${lang}:`, e);
    }
}

updateFile(esPath, 'es');
updateFile(enPath, 'en');
