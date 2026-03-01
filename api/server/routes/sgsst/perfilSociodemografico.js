const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');

// ─── Mongoose Schema ─────────────────────────────────────────────────
const WorkerEntrySchema = new mongoose.Schema({
    id: String,
    nombre: String,
    identificacion: String,
    edad: Number,
    genero: String,
    estadoCivil: String,
    nivelEscolaridad: String,
    direccion: String,
    telefono: String,
    cargo: String,
    fechaExamenMedico: String,
    fechaCursoAlturasAutorizado: String,
    fechaCursoAlturasCoordinador: String,
    completedByAI: { type: Boolean, default: false },
}, { _id: false });

const PerfilSociodemograficoDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trabajadores: [WorkerEntrySchema],
    updatedAt: { type: Date, default: Date.now },
});

PerfilSociodemograficoDataSchema.index({ user: 1 }, { unique: true });

const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData || mongoose.model('PerfilSociodemograficoData', PerfilSociodemograficoDataSchema);

// ─── Helper: Get API Key ─────────────────────────────────────────────
async function getApiKey(userId) {
    let resolvedApiKey;
    try {
        const storedKey = await getUserKey({ userId, name: 'google' });
        try {
            const parsed = JSON.parse(storedKey);
            resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
        } catch {
            resolvedApiKey = storedKey;
        }
    } catch {
        logger.debug('[SGSST PerfilSociodemografico] No user Google key, trying env');
    }
    if (!resolvedApiKey) {
        resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
    }
    if (resolvedApiKey && typeof resolvedApiKey === 'string') {
        resolvedApiKey = resolvedApiKey.split(',')[0].trim();
    }
    return resolvedApiKey;
}

// ─── GET /data — Load saved worker data ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const data = await PerfilSociodemograficoData.findOne({ user: req.user.id });
        if (data && data.trabajadores?.length) {
            return res.json({ trabajadores: data.trabajadores });
        }
        res.json({ trabajadores: [] });
    } catch (error) {
        logger.error('[SGSST PerfilSociodemografico] Load error:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

// ─── POST /save — Save worker data ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { trabajadores } = req.body;
        if (!trabajadores) {
            return res.status(400).json({ error: 'Datos requeridos' });
        }

        await PerfilSociodemograficoData.findOneAndUpdate(
            { user: req.user.id },
            { $set: { trabajadores, updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (error) {
        logger.error('[SGSST PerfilSociodemografico] Save error:', error);
        res.status(500).json({ error: 'Error al guardar datos' });
    }
});

// ─── POST /generate-full — Generate 5 workers with dummy data ────────
router.post('/generate-full', requireJwtAuth, async (req, res) => {
    try {
        const { modelName } = req.body;
        const apiKey = await getApiKey(req.user.id);
        if (!apiKey) return res.status(400).json({ error: 'No API Key' });

        let companyContext = '';
        const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
        if (ci) {
            companyContext = `Empresa: ${ci.companyName || 'Empresa'}\\nActividad: ${ci.economicActivity || 'General'}`;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        const systemPrompt = `Eres un experto en Recursos Humanos y SST en Colombia.
Tu tarea es generar la estructura inicial de un Perfil Sociodemográfico para la siguiente empresa:
${companyContext}

Genera un arreglo JSON de exactamente 5 a 10 trabajadores colombianos ficticios distribuidos en distintos cargos (operativos y administrativos).
Campos para cada trabajador (asegúrate de incluir datos coherentes y de usar direcciones tipo 'Calle 45 # 12-34, Bogotá', o 'Carrera 15 #20-10, Medellín'):
  "nombre": Nombre completo ficticio,
  "identificacion": Cédula ficticia de 8-10 dígitos,
  "edad": Número entre 18 y 60,
  "genero": "Masculino", "Femenino", o "Otro",
  "estadoCivil": "Soltero/a", "Casado/a", "Unión Libre", "Divorciado/a", "Viudo/a",
  "nivelEscolaridad": "Primaria", "Bachiller", "Técnico", "Tecnólogo", "Universitario", "Posgrado",
  "direccion": Dirección de domicilio tipo Colombia,
  "telefono": Teléfono ficticio (ej. 3001234567),
  "cargo": Cargo ficticio dentro de la empresa,
  "fechaExamenMedico": Fecha en formato "YYYY-MM-DD" de su último examen médico ocupacional,
  "fechaCursoAlturasAutorizado": Fecha en formato "YYYY-MM-DD" o nulo/vacío si no aplica para el cargo,
  "fechaCursoAlturasCoordinador": Fecha en formato "YYYY-MM-DD" o nulo/vacío si no aplica para el cargo

Esquema JSON Requerido (DEBES responder solo json, sin markdown):
{
  "trabajadores": [
    { ... }
  ]
}`;

        const result = await model.generateContent(systemPrompt);
        let text = result.response.text().trim();
        text = text.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();

        const parsed = JSON.parse(text);

        const finalWorkers = (parsed.trabajadores || []).map(w => ({
            ...w,
            id: w.id || require('crypto').randomUUID(),
            completedByAI: true
        }));

        res.json({ trabajadores: finalWorkers });
    } catch (error) {
        logger.error('[SGSST PerfilSociodemografico] Generate-full error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─── POST /analyze — Generate AI Exec Report for Sociodemographic ─────────────────────────────
router.post('/analyze', requireJwtAuth, async (req, res) => {
    try {
        const { trabajadores, currentDate, userName, modelName = 'gemini-3-flash-preview' } = req.body;

        if (!trabajadores || !Array.isArray(trabajadores) || trabajadores.length === 0) {
            return res.status(400).json({ error: 'No hay trabajadores para analizar.' });
        }

        const resolvedApiKey = await getApiKey(req.user.id);
        if (!resolvedApiKey) {
            return res.status(400).json({ error: 'No se ha configurado la clave API de Google.' });
        }

        let loadedCompanyInfo = null;
        try {
            loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
        } catch (ciErr) {
            logger.warn('[SGSST PerfilSociodemografico] Error loading company info:', ciErr.message);
        }

        const genAI = new GoogleGenerativeAI(resolvedApiKey);

        const empresa = loadedCompanyInfo?.companyName || 'EMPRESA';
        const nit = loadedCompanyInfo?.nit || 'NIT';
        const representante = loadedCompanyInfo?.legalRepresentative || userName || 'No registrado';
        const fechaEmision = currentDate || new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

        const headerHTML = `
<div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #004d99; font-size: 26px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; border-bottom: none; padding-bottom: 0;">
        INFORME EJECUTIVO DEL PERFIL SOCIODEMOGRÁFICO
    </h1>
    <h2 style="color: #475569; font-size: 18px; font-weight: 600; border-bottom: 3px solid #004d99; padding-bottom: 12px; margin-top: 0; display: inline-block;">
        Gestión de Sistema de Seguridad y Salud en el Trabajo
    </h2>
</div>

<div style="overflow-x: auto; width: 100%; margin-bottom: 24px; padding-bottom: 8px;">
<table style="width: 100%; min-width: 700px; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; font-family: inherit;">
  <thead>
    <tr>
      <th colspan="4" style="background-color: #004d99; color: white; text-align: left; padding: 12px 16px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        INFORMACIÓN RESUMIDA DE LA ENTIDAD
      </th>
    </tr>
  </thead>
  <tbody style="font-size: 14px; color: #1e293b;">
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Empresa:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${empresa}</td>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">NIT:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd;">${nit}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Representante:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${representante}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Registros:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${trabajadores.length} Trabajadores</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-right: 1px solid #eee;">Fecha de Emisión:</td>
      <td style="padding: 10px 14px; border-right: 1px solid #eee;">${fechaEmision}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-right: 1px solid #eee;"></td>
      <td style="padding: 10px 14px;"></td>
    </tr>
  </tbody>
</table>
</div>`;

        // Pre-process summary for prompt
        let numMen = 0;
        let numWomen = 0;
        let edadPromedio = 0;
        let totalEdades = 0;
        let escolaridades = {};

        let currentDateTrunc = new Date();

        // Calculate some basic warning/expirations
        let vencimientosMedico = [];
        let vencimientosAlturas = [];

        trabajadores.forEach(w => {
            if (w.genero === 'Masculino') numMen++;
            else if (w.genero === 'Femenino') numWomen++;

            if (w.edad) totalEdades += Number(w.edad);
            if (w.nivelEscolaridad) {
                if (!escolaridades[w.nivelEscolaridad]) escolaridades[w.nivelEscolaridad] = 0;
                escolaridades[w.nivelEscolaridad]++;
            }

            // Exámenes Médicos - Alert if > 1 year
            if (w.fechaExamenMedico) {
                try {
                    const diffTime = Math.abs(currentDateTrunc - new Date(w.fechaExamenMedico));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays >= 300) { // close to 1 year
                        vencimientosMedico.push(`${w.nombre} (${w.cargo}) - Último: ${w.fechaExamenMedico}`);
                    }
                } catch (e) { }
            } else {
                vencimientosMedico.push(`${w.nombre} (${w.cargo}) - Sin examen reportado`);
            }
        });

        if (trabajadores.length > 0) {
            edadPromedio = Math.round(totalEdades / trabajadores.length);
        }

        const promptText = `Eres un Experto en SST Especializado en perfiles sociodemográficos.
Se ha evaluado la base de datos de los trabajadores de la empresa.

** Resumen de Hallazgos Sociodemográficos:**
                        - Total trabajadores: ${trabajadores.length}
                        - Hombres: ${numMen}, Mujeres: ${numWomen}
                        - Edad Promedio: ${edadPromedio} años
                        - Escolaridad principal: ${JSON.stringify(escolaridades)}
                        - Trabajadores con alerta sobre examen médico periódico: ${vencimientosMedico.length}

                        ** Atención Especial Requerida(Examenes médicos prontos a vencer / Vencidos o no reportados):**
                        ${vencimientosMedico.slice(0, 10).map(v => '- ' + v).join('\n')}

                        ** Tu tarea:**
                        Escribe un INFORME EJECUTIVO profesional(en formato HTML) que analice este perfil sociodemográfico de la empresa y dé recomendaciones al área de Talento Humano y SST.
ESTRUCTURA EXACTA REQUERIDA(en div y HTML limpio sin markdown):
                            1. Un resumen analítico del capital humano, enfocándose en la distribución de género, edad y escolaridad. (Ej.Qué implica tener una población madura vs joven, o riesgos relativos al estado de la escolaridad).
2. Plan de Acción con respecto a los requerimientos de formación y exámenes paraclínicos(Exámenes Médicos).
3. Asegúrese de referenciar obligaciones en SST sobre Cursos de Alturas si se requiere.
4. Recomendaciones finales orientadas al bienestar social y físico.

Usa un tono corporativo.Retorna SOLAMENTE CÓDIGO HTML VÁLIDO SIN etiquetas markdown de bloque HTML.No incluyas un título principal(<code>h1</code>) porque ya está en el encabezado.

** ESTILOS OBLIGATORIOS(CSS INLINE) - PRECAUCIÓN MODO OSCURO:**
- ** Regla Crítica:** NO uses clases de Tailwind, usa exclusivamente CSS inline.
- Los contenedores principales(divs, cajas, tarjetas) deben tener style = "width: 100%; box-sizing: border-box;" para no quedar angostos.
- Cada vez que apliques un background - color a un elemento(tr, td, div), ** DEBES OBLIGATORIAMENTE ** especificar color: #000; o color: #fff;.
                        - Títulos(h2, h3): Color azul oscuro(#004d99) con color: #004d99; explícito.
- Tablas generadas por la IA DEBEN estar envueltas dentro de un < div style = "overflow-x: auto; width: 100%; margin-bottom: 20px;" >.La tabla debe tener los estilos: width: 100 %; min - width: 700px; border - collapse: separate; border - spacing: 0; border - radius: 12px; border: 1px solid #ddd;, th con background - color="#004d99" y color = "white".
- Celdas(td): padding = "10px", border - bottom="1px solid #ddd"(sin background - color predeterminado para que hereden el modo oscuro).`;

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptText);
        let aiHtml = result.response.text().trim();
        aiHtml = aiHtml.replace(/```html\n ? /g, '').replace(/```\n?/g, '').trim();

        const fullReport = `${headerHTML}
                        <div class="mt-8 space-y-6">
                            ${aiHtml}
                        </div>`;

        res.json({ report: fullReport });
    } catch (error) {
        logger.error('[SGSST PerfilSociodemografico] Analyze error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
