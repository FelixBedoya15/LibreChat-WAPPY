const fs = require('fs');
const path = require('path');

const esPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json';
const enPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/en/translation.json';

const newKeys = {
    // Company Info
    "com_ui_company_info_title": { es: "Información de la Empresa", en: "Company Information" },
    "com_ui_company_info_desc": { es: "Estos datos se usarán en todos los informes generados por IA", en: "This data will be used in all AI-generated reports" },
    "com_ui_company_data_general": { es: "Datos Generales", en: "General Data" },
    "com_ui_company_name": { es: "Razón Social", en: "Company Name" },
    "com_ui_company_name_placeholder": { es: "Nombre de la empresa", en: "Company Name" },
    "com_ui_company_legal_rep": { es: "Representante Legal", en: "Legal Representative" },
    "com_ui_company_legal_rep_placeholder": { es: "Nombre completo", en: "Full Name" },
    "com_ui_company_workers": { es: "Número de Trabajadores", en: "Number of Workers" },
    "com_ui_company_sector": { es: "Sector", en: "Sector" },
    "com_ui_select_sector": { es: "Seleccionar sector", en: "Select Sector" },
    "com_ui_company_sst_info": { es: "Información SST", en: "SGSST Information" },
    "com_ui_select_arl": { es: "Seleccionar ARL", en: "Select ARL" },
    "com_ui_risk_level": { es: "Nivel de Riesgo", en: "Risk Level" },
    "com_ui_select_level": { es: "Seleccionar nivel", en: "Select Level" },
    "com_ui_economic_activity": { es: "Actividad Económica", en: "Economic Activity" },
    "com_ui_economic_activity_placeholder": { es: "Descripción de la actividad", en: "Activity Description" },
    "com_ui_sst_responsible": { es: "Responsable del SG-SST", en: "SGSST Responsible" },
    "com_ui_sst_responsible_placeholder": { es: "Nombre del responsable", en: "Responsible Name" },
    "com_ui_contact_location": { es: "Contacto y Ubicación", en: "Contact & Location" },
    "com_ui_address": { es: "Dirección", en: "Address" },
    "com_ui_address_placeholder": { es: "Dirección de la empresa", en: "Company Address" },
    "com_ui_city": { es: "Ciudad", en: "City" },
    "com_ui_phone": { es: "Teléfono", en: "Phone" },
    "com_ui_email": { es: "Correo Electrónico", en: "Email" },
    "com_ui_activities": { es: "Actividades", en: "Activities" },
    "com_ui_activities_desc": { es: "Descripción de Actividades Generales", en: "General Activities Description" },
    "com_ui_activities_placeholder": { es: "Describa las actividades principales que se desarrollan en la empresa...", en: "Describe the main activities developed in the company..." },
    "com_ui_cancel": { es: "Cancelar", en: "Cancel" },
    "com_ui_save": { es: "Guardar", en: "Save" },
    "com_ui_saving": { es: "Guardando...", en: "Saving..." },

    // Checklist
    "com_ui_complete_one_item": { es: "Complete al menos un ítem antes de analizar", en: "Complete at least one item before analyzing" },
    "com_ui_analysis_success": { es: "Análisis generado exitosamente", en: "Analysis generated successfully" },
    "com_ui_analysis_error": { es: "Error al generar el análisis", en: "Error generating analysis" },
    "com_ui_generate_analysis_first": { es: "Primero genere el análisis", en: "Generate analysis first" },
    "com_ui_export_word_success": { es: "Informe exportado a Word", en: "Report exported to Word" },
    "com_ui_no_report_save": { es: "No hay informe para guardar", en: "No report to save" },
    "com_ui_error_unauthorized": { es: "Error: No autorizado", en: "Error: Unauthorized" },
    "com_ui_diagnostic_updated": { es: "Diagnóstico actualizado exitosamente", en: "Diagnostic updated successfully" },
    "com_ui_update_error": { es: "Error al actualizar", en: "Error updating" },
    "com_ui_diagnostic_saved": { es: "Diagnóstico guardado exitosamente", en: "Diagnostic saved successfully" },
    "com_ui_save_error": { es: "Error al guardar", en: "Error saving" },
    "com_ui_save_network_error": { es: "Error de red al guardar el diagnóstico", en: "Network error saving diagnostic" },
    "com_ui_diagnostic_loaded": { es: "Diagnóstico cargado", en: "Diagnostic loaded" },
    "com_ui_load_error": { es: "Error al cargar el diagnóstico", en: "Error loading diagnostic" },
    "com_ui_eval_filters": { es: "Filtros de Evaluación", en: "Evaluation Filters" },
    "com_ui_worker_count": { es: "Número de Trabajadores", en: "Number of Workers" },
    "com_ui_applies_article": { es: "Aplica", en: "Applies" },
    "com_ui_article": { es: "Artículo", en: "Article" },
    "com_ui_resolution_0312": { es: "de la Resolución 0312/2019", en: "of Resolution 0312/2019" },
    "com_ui_standards": { es: "estándares", en: "standards" },
    "com_ui_progress": { es: "Progreso", en: "Progress" },
    "com_ui_score": { es: "Puntuación", en: "Score" },
    "com_ui_level": { es: "Nivel", en: "Level" },
    "com_ui_history": { es: "Historial", en: "History" },
    "com_ui_gen_analysis": { es: "Generar Análisis IA", en: "Generate AI Analysis" },
    "com_ui_export_word": { es: "Exportar Word", en: "Export Word" },
    "com_ui_evaluated": { es: "evaluados", en: "evaluated" },
    "com_ui_points": { es: "Puntaje", en: "Points" },
    "com_ui_how_eval": { es: "¿Cómo se evalúa?", en: "How is it evaluated?" },
    "com_ui_add_obs": { es: "Agregar observación...", en: "Add observation..." },
    "com_ui_manager_report": { es: "Informe Gerencial", en: "Management Report" }
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
