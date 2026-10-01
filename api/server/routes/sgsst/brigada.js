const express = require('express');
const router = express.Router();
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstBrigadista = require('../../../models/SgsstBrigadista');
const PerfilSociodemograficoData = require('../../../models/PerfilSociodemograficoData');
const { logger } = require('~/config');

async function getActiveCompany(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
  if (!active) active = await CompanyInfo.findOne({ user: userId }).lean();
  return active;
}

// ─── GET /api/sgsst/brigada/brigadistas ───────────────────────────────────────
// Lista todos los brigadistas de la empresa activa
router.get('/brigadistas', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    let brigadistas = await SgsstBrigadista.find({ companyId: company._id })
      .sort({ nombre: 1 })
      .lean();

    // Fallback: Si aún no hay brigadistas en la colección dedicada, consultar PerfilSociodemografico
    if (!brigadistas || brigadistas.length === 0) {
      const perfilDoc = await PerfilSociodemograficoData.findOne({ companyId: company._id }).lean();
      if (perfilDoc && Array.isArray(perfilDoc.trabajadores)) {
        const brigadeWorkers = perfilDoc.trabajadores.filter(
          (w) => String(w.esBrigadista || '').trim().toLowerCase() === 'sí'
        );

        if (brigadeWorkers.length > 0) {
          brigadistas = brigadeWorkers.map((w) => ({
            _id: w.id || w._id,
            companyId: company._id,
            cedula: w.identificacion,
            nombre: w.nombre,
            cargo: w.cargo || '',
            sede: w.sede || 'Sede Principal',
            area: w.area || 'Operativa / Planta',
            grupoEspecialidad: 'Primeros Auxilios',
            rolSCI: 'Brigadista Operativo',
            estadoMembresia: 'Activo',
            rh: w.rh || 'O+',
            contactoEmergenciaNombre: w.emergenciaContacto || '',
            contactoEmergenciaTelefono: w.emergenciaTelefono || w.telefono || '',
            carnetEmitido: true,
          }));
        }
      }
    }

    res.json({
      success: true,
      companyId: company._id,
      companyName: company.companyName,
      brigadistas,
    });
  } catch (error) {
    logger.error('[SGSST Brigada] GET /brigadistas error:', error);
    res.status(500).json({ error: 'Error al obtener brigadistas' });
  }
});

// ─── POST /api/sgsst/brigada/sync ─────────────────────────────────────────────
// Sincroniza la nómina de brigadistas desde el Workspace administrativo
router.post('/sync', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const { brigadistas } = req.body;
    if (!Array.isArray(brigadistas)) {
      return res.status(400).json({ error: 'La nómina de brigadistas debe ser un arreglo' });
    }

    const savedList = [];
    const brigadeCedulas = new Set();

    for (const b of brigadistas) {
      const cleanCedula = String(b.cedula || '').trim();
      const cleanNombre = String(b.nombre || '').trim();
      if (!cleanCedula || !cleanNombre) continue;

      brigadeCedulas.add(cleanCedula.toLowerCase());

      const updateData = {
        companyId: company._id,
        user: company.user,
        cedula: cleanCedula,
        nombre: cleanNombre,
        cargo: String(b.cargo || '').trim(),
        sede: String(b.sede || 'Sede Principal').trim(),
        area: String(b.area || '').trim(),
        grupoEspecialidad: b.especialidad || b.grupoEspecialidad || 'Primeros Auxilios',
        rolSCI: b.rolSCI || 'Brigadista Operativo',
        estadoMembresia: b.estadoMembresia || 'Activo',
        rh: String(b.rh || 'O+').trim(),
        alergiasMedicas: String(b.alergiasMedicas || 'Ninguna conocida').trim(),
        contactoEmergenciaNombre: String(b.contactoEmergenciaNombre || '').trim(),
        contactoEmergenciaTelefono: String(b.contactoEmergenciaTelefono || '').trim(),
        carnetEmitido: true,
        updatedAt: new Date(),
      };

      const doc = await SgsstBrigadista.findOneAndUpdate(
        { companyId: company._id, cedula: cleanCedula },
        { $set: updateData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      savedList.push(doc);
    }

    // Sincronizar campo esBrigadista en PerfilSociodemograficoData
    try {
      const perfilDoc = await PerfilSociodemograficoData.findOne({ companyId: company._id });
      if (perfilDoc && Array.isArray(perfilDoc.trabajadores)) {
        let mod = false;
        perfilDoc.trabajadores.forEach((w) => {
          const wCed = String(w.identificacion || '').trim().toLowerCase();
          const shouldBeBrigade = brigadeCedulas.has(wCed) ? 'Sí' : 'No';
          if (w.esBrigadista !== shouldBeBrigade) {
            w.esBrigadista = shouldBeBrigade;
            mod = true;
          }
        });
        if (mod) {
          perfilDoc.markModified('trabajadores');
          await perfilDoc.save();
        }
      }
    } catch (perfilErr) {
      logger.warn('[SGSST Brigada] Sync to perfilSociodemografico error:', perfilErr.message);
    }

    res.json({
      success: true,
      message: `${savedList.length} brigadistas sincronizados correctamente`,
      brigadistas: savedList,
    });
  } catch (error) {
    logger.error('[SGSST Brigada] POST /sync error:', error);
    res.status(500).json({ error: 'Error al sincronizar brigadistas' });
  }
});

// ─── DELETE /api/sgsst/brigada/:id ───────────────────────────────────────────
// Elimina o desvincula un brigadista
router.delete('/:id', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const deleted = await SgsstBrigadista.findOneAndDelete({
      _id: req.params.id,
      companyId: company._id,
    });

    if (deleted) {
      // Actualizar perfil sociodemográfico
      try {
        const perfilDoc = await PerfilSociodemograficoData.findOne({ companyId: company._id });
        if (perfilDoc && Array.isArray(perfilDoc.trabajadores)) {
          const t = perfilDoc.trabajadores.find(
            (w) => String(w.identificacion || '').trim() === deleted.cedula
          );
          if (t) {
            t.esBrigadista = 'No';
            perfilDoc.markModified('trabajadores');
            await perfilDoc.save();
          }
        }
      } catch (e) {
        logger.warn('[SGSST Brigada] DELETE sync error:', e.message);
      }
    }

    res.json({ success: true, message: 'Brigadista eliminado de la nómina' });
  } catch (error) {
    logger.error('[SGSST Brigada] DELETE /:id error:', error);
    res.status(500).json({ error: 'Error al eliminar brigadista' });
  }
});

module.exports = router;
