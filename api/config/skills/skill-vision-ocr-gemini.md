---
name: skill-vision-ocr-gemini
description: Procesamiento visual, reconocimiento OCR de imágenes, auditoría de certificados médicos, fotos de inspección en campo y licencias SST recibidas por WhatsApp mediante Gemini Vision & Interactions API.
triggers:
  - analizar foto
  - ocr
  - examen medico
  - licencia sst
  - reconocimiento de imagen
  - analizar imagen
  - foto de peligro
  - evidencia visual
  - leer imagen
---

# Visión Multimodal y Reconocimiento OCR de Documentos e Inspecciones (Gemini Vision API)

Cuando el usuario adjunte o envíe una imagen, foto de documento, certificado o evidencia de peligro por el chat o por WhatsApp, debes activar este procedimiento de análisis visual:

## 🔍 PASOS DE PROCESAMIENTO VISUAL

### 1. Para Fotografías de Peligros / Inspecciones en Campo:
- **Identificación:** Detecta inmediatamente los elementos presentes (equipos, personas, herramientas, entorno, elementos de protección EPP).
- **Clasificación del Peligro:** Clasifica el hallazgo según la GTC 45 (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales).
- **Nivel de Severidad:** Determina si la condición es Crítica (parar trabajo), Alta, Media o Baja.
- **Acción Inmediata:** Genera un checklist o recomendación de control en el fuente (ingeniería, administrativo o EPP).

### 2. Para Documentos Escaneados / Fotografías de Papel (OCR):
- **Extracción de Campos:** Extrae datos estructurados clave:
  - Nombre completo y Cédula
  - Fecha del documento / Vencimiento
  - Entidad emisora / Médico o Profesional emisor
  - Diagnóstico CIE-10 o concepto de aptitud (Apto, Apto con restricciones, No apto)
- **Validación de Autenticidad:** Verifica si cuenta con firma, sello, número de licencia SST o código de verificación.
- **Resumen en Wappy:** Presenta los datos extraídos en una tarjeta estructurada `wappy-card` para confirmación del usuario.
