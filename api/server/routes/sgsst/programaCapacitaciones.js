const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { logger } = require('~/config');
const mongoose = require('mongoose');
const CompanyInfo = require('../../../models/CompanyInfo');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

const SesionCapacitacionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  tema: { type: String, required: true },
  fecha: { type: String, required: true },
  hora: { type: String, default: '' },
  duracion: { type: String, default: '' },
  responsable: { type: String, default: '' },
  descripcion: { type: String, default: '' },
  estado: { type: String, enum: ['Programada', 'Completada', 'Cancelada'], default: 'Programada' },
  trabajadoresRegistrados: { type: Array, default: [] }, // Array of objects { nombre, cedula, cargo, asistio }
  evidencias: { type: Array, default: [] }, // Array of base64 images
  createdAt: { type: Date, default: Date.now },
});

const ProgramaCapacitacionesDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
  sesiones: [SesionCapacitacionSchema],
  updatedAt: { type: Date, default: Date.now },
});

ProgramaCapacitacionesDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData || 
  mongoose.model('ProgramaCapacitacionesData', ProgramaCapacitacionesDataSchema);

router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    const data = await ProgramaCapacitacionesData.findOne({ user: req.user.id, companyId: companyId });
    if (data) {
      return res.json({ sesiones: data.sesiones || [] });
    }
    return res.json({ sesiones: [] });
  } catch (error) {
    logger.error('[SGSST Capacitaciones] Load error:', error);
    res.status(500).json({ error: 'Error al cargar cronograma de capacitaciones' });
  }
});

router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { sesiones } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    await ProgramaCapacitacionesData.findOneAndUpdate(
      { user: req.user.id, companyId: companyId },
      { $set: { sesiones: sesiones || [], companyId, updatedAt: Date.now() } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Capacitaciones] Save error:', error);
    res.status(500).json({ error: 'Error al guardar cronograma' });
  }
});

router.post('/generate-acta', requireJwtAuth, async (req, res) => {
  try {
    const { sesion } = req.body;
    if (!sesion) return res.status(400).json({ error: 'Sesion faltante' });

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
    } catch (e) {
      logger.warn('Failed to load company info for Acta');
    }

    const headerHTML = buildStandardHeader({
      title: 'ACTA DE CAPACITACIÓN Y ENTRENAMIENTO EN SST',
      companyInfo: loadedCompanyInfo,
      date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
      norm: 'Decreto 1072 de 2015 (Art. 2.2.4.6.11) / Resolución 0312 de 2019',
      responsibleName: req.user?.name
    });

    let htmlBody = `
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left; width: 30%;">TEMA TRATADO</th>
            <td style="padding: 10px; background: #f8fafc; color: #334155; font-weight: bold;">${sesion.tema || 'N/A'}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">FECHA Y HORA</th>
            <td style="padding: 10px; color: #334155;">${sesion.fecha || ''} ${sesion.hora ? '- ' + sesion.hora : ''}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">DURACIÓN</th>
            <td style="padding: 10px; background: #f8fafc; color: #334155;">${sesion.duracion || 'N/A'}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">CAPACITADOR / RESPONSABLE</th>
            <td style="padding: 10px; color: #334155; font-weight: bold;">${sesion.responsable || 'N/A'}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">OBJETIVO / DESCRIPCIÓN</th>
            <td style="padding: 10px; background: #f8fafc; color: #334155; line-height: 1.5;">${sesion.descripcion || 'Sin descripción'}</td>
          </tr>
        </table>
      </div>
      
      <h3 style="color: #0f766e; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #0f766e; padding-bottom: 5px;">REGISTRO DE ASISTENCIA Y APROBACIÓN</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <thead>
          <tr style="background: #0f766e; color: white;">
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">N°</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af; text-align: left;">NOMBRE COMPLETO</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">CÉDULA</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af; text-align: left;">CARGO</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">ASISTIÓ</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">FIRMA DIGITAL</th>
          </tr>
        </thead>
        <tbody>
    `;

    const trabajadores = sesion.trabajadoresRegistrados || [];
    if (trabajadores.length === 0) {
      htmlBody += `<tr><td colspan="6" style="padding: 15px; color: #64748b;">No hay trabajadores registrados en esta sesión.</td></tr>`;
    } else {
      trabajadores.forEach((t, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        htmlBody += `
          <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; color: #334155;">${i + 1}</td>
            <td style="padding: 10px; font-weight: bold; text-align: left; color: #1e293b;">${t.nombre || 'N/A'}</td>
            <td style="padding: 10px; color: #334155;">${t.cedula || 'N/A'}</td>
            <td style="padding: 10px; text-align: left; color: #334155;">${t.cargo || 'N/A'}</td>
            <td style="padding: 10px;">${t.asistio ? '✅ SÍ' : '❌ NO'}</td>
            <td style="padding: 10px; min-width: 150px; min-height: 50px; vertical-align: middle;">
              ${t.asistio ? `<div class="signature-placeholder" data-signature-id="dyn_asistente_${i}" style="border-bottom: 1px dashed #94a3b8; height: 35px; width: 80%; margin: 0 auto; display: flex; align-items: center; justify-content: center; cursor: pointer;"><span style="color: #cbd5e1; font-size: 10px;">Clic para insertar firma</span></div>` : '<span style="color: #cbd5e1;">Ausente</span>'}
            </td>
          </tr>
        `;
      });
    }

    htmlBody += `
        </tbody>
      </table>
    `;

    // Evidencias (fotos)
    let imagesHtml = '';
    const evidencias = sesion.evidencias || [];
    if (evidencias.length > 0) {
      imagesHtml = `
        <div style="margin-top: 30px; margin-bottom: 20px; page-break-inside: avoid;">
          <h3 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 5px; font-size: 15px;">ANEXO: EVIDENCIA FOTOGRÁFICA</h3>
          <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 15px;">`;
      
      evidencias.forEach((src, i) => {
        imagesHtml += `
          <div style="flex: 1; min-width: 250px; text-align: center; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <img src="${src}" style="width: 100%; height: auto; max-width: 300px; border-radius: 4px; object-fit: contain; margin-bottom: 5px;" alt="Evidencia ${i + 1}" />
            <br><span style="font-size: 11px; color: #64748b;">Evidencia ${i + 1} de capacitación</span>
          </div>
        `;
      });
      imagesHtml += `</div></div>`;
    }

    let fullReport = headerHTML + '<div style="margin-top: 20px;">' + htmlBody + '</div>' + imagesHtml;
    
    // Auto-inject Manager/SST signatures
    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST Capacitaciones] Generate error:', error);
    res.status(500).json({ error: 'Error al generar acta de capacitación' });
  }
});

module.exports = router;
