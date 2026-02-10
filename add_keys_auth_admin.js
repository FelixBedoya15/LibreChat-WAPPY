const fs = require('fs');
const path = require('path');

const esPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json';
const enPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/en/translation.json';

const newKeys = {
    // Auth - Inactive Account
    "com_auth_account_paused": { es: "Cuenta Pausada", en: "Account Paused" },
    "com_auth_account_inactive_desc": { es: "Su cuenta está actualmente inactiva. Esto puede deberse a un pago pendiente o a una acción administrativa.", en: "Your account is currently inactive. This may be due to a pending payment or an administrative action." },
    "com_auth_contact_support": { es: "Por favor, contacte a soporte o a su administrador para reactivar su cuenta.", en: "Please contact support or your administrator to reactivate your account." },
    "com_auth_logout": { es: "Cerrar Sesión", en: "Log Out" },

    // Admin - Create User
    "com_ui_user_created_success": { es: "Usuario creado exitosamente", en: "User created successfully" },
    "com_ui_user_create_error": { es: "Error al crear usuario", en: "Error creating user" },
    "com_ui_role_user": { es: "Usuario", en: "User" },
    "com_ui_role_user_plus": { es: "Usuario Plus", en: "User Plus" },
    "com_ui_role_user_pro": { es: "Usuario Pro", en: "User Pro" },
    "com_ui_role_admin": { es: "Administrador", en: "Admin" },
    "com_ui_status_active": { es: "Activo", en: "Active" },
    "com_ui_status_pending": { es: "Pendiente", en: "Pending" },
    "com_ui_status_inactive": { es: "Inactivo", en: "Inactive" }
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
