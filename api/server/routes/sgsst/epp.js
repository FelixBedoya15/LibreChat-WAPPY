const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const mongoose = require('mongoose');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstWorker = require('../../../models/SgsstWorker');
const SgsstEppData = require('../../../models/SgsstEppData');
const SgsstEppInventory = require('../../../models/SgsstEppInventory');
const { logger } = require('~/config');
const { generateWithKeyRotation } = require('./sgsstGemini');
const { buildStandardHeader } = require('./reportHeader');

const router = express.Router();

// ─── Catálogo Estándar Sugerido de EPP (Resolución 2400 / 0312 / 4272) ────────
const DEFAULT_EPP_CATALOG = [
  {
    codigo: 'EPP-CAB-01',
    nombre: 'Casco de seguridad dieléctrico Tipo II con barbuquejo',
    categoria: 'Protección de Cabeza',
    tipo: 'Regular',
    marca: 'Arseg / 3M',
    referencia: 'H-700 / Dieléctrico',
    talla: 'Ajustable',
    unidad: 'Unidad',
    stockActual: 20,
    stockMinimo: 5,
    costoUnitario: 35000,
    ubicacionBodega: 'Estante A1',
    observaciones: 'Cumple norma ANSI Z89.1 Clase E.'
  },
  {
    codigo: 'EPP-OCU-01',
    nombre: 'Gafas de seguridad con filtro UV y antiempañante',
    categoria: 'Protección Ocular / Facial',
    tipo: 'Regular',
    marca: '3M / Steelpro',
    referencia: 'Virtua / Spy Flex',
    talla: 'Única',
    unidad: 'Unidad',
    stockActual: 35,
    stockMinimo: 10,
    costoUnitario: 12000,
    ubicacionBodega: 'Estante A2',
    observaciones: 'Certificación ANSI Z87.1 impacto.'
  },
  {
    codigo: 'EPP-AUD-01',
    nombre: 'Protectores auditivos de inserción en silicona tipo copa/tapón',
    categoria: 'Protección Auditiva',
    tipo: 'Regular',
    marca: '3M',
    referencia: '1100 / Ultrafit',
    talla: 'Única',
    unidad: 'Par',
    stockActual: 50,
    stockMinimo: 15,
    costoUnitario: 4500,
    ubicacionBodega: 'Caja B1',
    observaciones: 'NRR 25dB.'
  },
  {
    codigo: 'EPP-AUD-02',
    nombre: 'Protectores auditivos tipo copa adaptable a casco',
    categoria: 'Protección Auditiva',
    tipo: 'Regular',
    marca: 'Howard Leight / 3M',
    referencia: 'Peltor H9P3E',
    talla: 'Única',
    unidad: 'Unidad',
    stockActual: 15,
    stockMinimo: 4,
    costoUnitario: 55000,
    ubicacionBodega: 'Estante A3',
    observaciones: 'NRR 23dB para áreas de alto ruido.'
  },
  {
    codigo: 'EPP-RES-01',
    nombre: 'Mascarilla de protección respiratoria N95 contra material particulado',
    categoria: 'Protección Respiratoria',
    tipo: 'Regular',
    marca: '3M',
    referencia: '8210 N95',
    talla: 'Única',
    unidad: 'Unidad',
    stockActual: 40,
    stockMinimo: 15,
    costoUnitario: 6000,
    ubicacionBodega: 'Estante B2',
    observaciones: 'Filtro electrostático para polvos y neblinas.'
  },
  {
    codigo: 'EPP-RES-02',
    nombre: 'Respirador de media cara siliconado con cartuchos mixtos',
    categoria: 'Protección Respiratoria',
    tipo: 'Regular',
    marca: '3M',
    referencia: 'Serie 6200 / 7502',
    talla: 'M',
    unidad: 'Kit',
    stockActual: 8,
    stockMinimo: 3,
    costoUnitario: 95000,
    ubicacionBodega: 'Estante B3',
    observaciones: 'Con cartuchos 6003 contra vapores orgánicos y gases ácidos.'
  },
  {
    codigo: 'EPP-MAN-01',
    nombre: 'Guantes de vaqueta reforzada para trabajo pesado',
    categoria: 'Protección Manual',
    tipo: 'Regular',
    marca: 'Segpro',
    referencia: 'Ingeniero Vaqueta',
    talla: '9 (L)',
    unidad: 'Par',
    stockActual: 25,
    stockMinimo: 8,
    costoUnitario: 18000,
    ubicacionBodega: 'Estante C1',
    observaciones: 'Costuras en hilo Kevlar.'
  },
  {
    codigo: 'EPP-MAN-02',
    nombre: 'Guantes de nitrilo verde para protección química',
    categoria: 'Protección Manual',
    tipo: 'Regular',
    marca: 'Ansell',
    referencia: 'Sol-Vex 37-175',
    talla: '8.5 (M)',
    unidad: 'Par',
    stockActual: 30,
    stockMinimo: 8,
    costoUnitario: 14000,
    ubicacionBodega: 'Estante C2',
    observaciones: 'Resistente a hidrocarburos y solventes.'
  },
  {
    codigo: 'EPP-PIE-01',
    nombre: 'Botas de seguridad dieléctricas con puntera de policarbonato/acero',
    categoria: 'Protección de Pies',
    tipo: 'Regular',
    marca: 'Croydon / Brahma',
    referencia: 'Titan Dieléctrica',
    talla: '41',
    unidad: 'Par',
    stockActual: 12,
    stockMinimo: 4,
    costoUnitario: 145000,
    ubicacionBodega: 'Estante D1',
    observaciones: 'Resistencia dieléctrica hasta 18.000V según ASTM F2413.'
  },
  {
    codigo: 'EPP-ROP-01',
    nombre: 'Chaleco reflectivo de alta visibilidad con cintas 3M',
    categoria: 'Ropa de Trabajo',
    tipo: 'Regular',
    marca: 'Safework',
    referencia: 'Hi-Vis Tipo II',
    talla: 'L',
    unidad: 'Unidad',
    stockActual: 20,
    stockMinimo: 5,
    costoUnitario: 22000,
    ubicacionBodega: 'Estante E1',
    observaciones: 'Norma ANSI/ISEA 107-2020.'
  },
  {
    codigo: 'EPP-ALT-01',
    nombre: 'Arnés de cuerpo entero multipropósito (4 argollas en X)',
    categoria: 'Protección contra Caídas (Alturas)',
    tipo: 'Alturas',
    marca: 'Insafe / Steelpro',
    referencia: 'IN-8005-4A',
    talla: 'Universal',
    unidad: 'Unidad',
    stockActual: 6,
    stockMinimo: 2,
    costoUnitario: 260000,
    ubicacionBodega: 'Zona de Alturas H1',
    observaciones: 'Certificado bajo ANSI Z359.11 y Res. 4272 de 2021.'
  },
  {
    codigo: 'EPP-ALT-02',
    nombre: 'Eslinga doble en Y con absorbedor de energía y ganchos de 2 1/4"',
    categoria: 'Protección contra Caídas (Alturas)',
    tipo: 'Alturas',
    marca: 'Insafe',
    referencia: 'IN-8020-2E',
    talla: '1.80 m',
    unidad: 'Unidad',
    stockActual: 8,
    stockMinimo: 2,
    costoUnitario: 195000,
    ubicacionBodega: 'Zona de Alturas H2',
    observaciones: 'ANSI Z359.13 con ganchos de 5.000 lbf.'
  },
  {
    codigo: 'EPP-ALT-03',
    nombre: 'Eslinga de posicionamiento regulable en reata poliéster',
    categoria: 'Protección contra Caídas (Alturas)',
    tipo: 'Alturas',
    marca: 'Insafe',
    referencia: 'IN-8030-P',
    talla: '1.80 m',
    unidad: 'Unidad',
    stockActual: 6,
    stockMinimo: 2,
    costoUnitario: 110000,
    ubicacionBodega: 'Zona de Alturas H3',
    observaciones: 'Regulación con hebilla corrediza.'
  },
  {
    codigo: 'EPP-ALT-04',
    nombre: 'Conector de anclaje portátil tipo Tie-Off (Cinta reata)',
    categoria: 'Protección contra Caídas (Alturas)',
    tipo: 'Alturas',
    marca: 'Insafe',
    referencia: 'IN-8040-TO',
    talla: '1.0 m',
    unidad: 'Unidad',
    stockActual: 10,
    stockMinimo: 3,
    costoUnitario: 65000,
    ubicacionBodega: 'Zona de Alturas H4',
    observaciones: 'Resistencia mínima 5.000 lbf.'
  },
  {
    codigo: 'EPP-ALT-05',
    nombre: 'Mosquetón de seguridad automático en acero 50kN',
    categoria: 'Protección contra Caídas (Alturas)',
    tipo: 'Alturas',
    marca: 'Steelpro',
    referencia: 'Carabiner Carab-Auto',
    talla: 'Única',
    unidad: 'Unidad',
    stockActual: 15,
    stockMinimo: 5,
    costoUnitario: 42000,
    ubicacionBodega: 'Zona de Alturas H5',
    observaciones: 'Cierre automático de doble seguro ANSI Z359.12.'
  }
];

// ─── Helper: Descontar / Reponer Stock según Entregas Registradas ────────────
async function adjustInventoryForDeliveries(userId, companyId, oldEntregas = [], newEntregas = []) {
  try {
    const inventory = await SgsstEppInventory.findOne({ user: userId, companyId });
    if (!inventory || !Array.isArray(inventory.items) || inventory.items.length === 0) {
      return null;
    }

    const oldQtyMap = new Map();
    (oldEntregas || []).forEach(ent => {
      const key = (ent.nombre || '').toLowerCase().trim();
      if (key) {
        oldQtyMap.set(key, (oldQtyMap.get(key) || 0) + (Number(ent.cantidad) || 1));
      }
    });

    const newQtyMap = new Map();
    (newEntregas || []).forEach(ent => {
      const key = (ent.nombre || '').toLowerCase().trim();
      if (key) {
        newQtyMap.set(key, (newQtyMap.get(key) || 0) + (Number(ent.cantidad) || 1));
      }
    });

    const allKeys = new Set([...oldQtyMap.keys(), ...newQtyMap.keys()]);
    let modified = false;

    allKeys.forEach(key => {
      const oldQty = oldQtyMap.get(key) || 0;
      const newQty = newQtyMap.get(key) || 0;
      const diff = newQty - oldQty; // >0: entregados (descontar); <0: devueltos/eliminados (reponer)

      if (diff !== 0) {
        // Buscar coincidencia: exacta o parcial
        let invItem = inventory.items.find(i => (i.nombre || '').toLowerCase().trim() === key);
        if (!invItem) {
          invItem = inventory.items.find(i => {
            const iName = (i.nombre || '').toLowerCase().trim();
            return iName.includes(key) || key.includes(iName);
          });
        }

        if (invItem) {
          invItem.stockActual = Math.max(0, (Number(invItem.stockActual) || 0) - diff);
          invItem.updatedAt = new Date();
          modified = true;
          logger.info(`[SGSST EPP Inventory] Descuento de stock para "${invItem.nombre}": diff=${diff}, nuevoStock=${invItem.stockActual}`);
        }
      }
    });

    if (modified) {
      inventory.updatedAt = new Date();
      await inventory.save();
    }

    return inventory.items;
  } catch (err) {
    logger.error('[SGSST EPP Inventory] Error en adjustInventoryForDeliveries:', err.message);
    return null;
  }
}

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

// ─── Helper: Traer Firma Registrada del Trabajador ──────────────────────────
async function getWorkerRegisteredSignature(userId, companyId, workerId) {
  try {
    const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData;
    if (!PerfilSocioModel) return null;
    const doc = await PerfilSocioModel.findOne({ user: userId, companyId }).lean();
    if (!doc || !doc.trabajadores) return null;
    const worker = doc.trabajadores.find(w => w.id === workerId);
    return worker ? worker.firmaDigital : null;
  } catch (err) {
    logger.error('[SGSST EPP Helper] Error fetching worker signature:', err.message);
    return null;
  }
}

// ─── GET /data — Obtener entregas de EPP ────────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }
    const data = await SgsstEppData.find({ user: req.user.id, companyId });
    res.json(data);
  } catch (error) {
    logger.error('[SGSST EPP] Load error:', error);
    res.status(500).json({ error: 'Error al cargar entregas de EPP' });
  }
});

// ─── GET /inventory — Obtener inventario y stock de EPP ──────────────────────
router.get('/inventory', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }
    let inventory = await SgsstEppInventory.findOne({ user: req.user.id, companyId }).lean();
    if (!inventory) {
      inventory = { items: [] };
    }
    res.json({ items: inventory.items || [] });
  } catch (error) {
    logger.error('[SGSST EPP Inventory] Load error:', error);
    res.status(500).json({ error: 'Error al cargar inventario de EPP' });
  }
});

// ─── POST /inventory/item — Crear o Editar EPP en Inventario ─────────────────
router.post('/inventory/item', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const {
      id,
      codigo,
      nombre,
      categoria,
      tipo,
      marca,
      referencia,
      talla,
      unidad,
      stockActual,
      stockMinimo,
      costoUnitario,
      ubicacionBodega,
      observaciones
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del EPP es obligatorio' });
    }

    let inventory = await SgsstEppInventory.findOne({ user: req.user.id, companyId });
    if (!inventory) {
      inventory = new SgsstEppInventory({
        user: req.user.id,
        companyId,
        items: []
      });
    }

    const itemId = id || `INV-EPP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date();

    const itemData = {
      id: itemId,
      codigo: (codigo || '').trim(),
      nombre: nombre.trim(),
      categoria: categoria || 'Otro',
      tipo: tipo === 'Alturas' ? 'Alturas' : 'Regular',
      marca: (marca || '').trim(),
      referencia: (referencia || '').trim(),
      talla: (talla || 'Única').trim(),
      unidad: (unidad || 'Unidad').trim(),
      stockActual: Math.max(0, parseInt(stockActual, 10) || 0),
      stockMinimo: Math.max(0, parseInt(stockMinimo, 10) || 0),
      costoUnitario: Math.max(0, parseFloat(costoUnitario) || 0),
      ubicacionBodega: (ubicacionBodega || 'Almacén Principal').trim(),
      observaciones: (observaciones || '').trim(),
      updatedAt: now
    };

    const existingIndex = inventory.items.findIndex(i => i.id === itemId);
    if (existingIndex >= 0) {
      itemData.createdAt = inventory.items[existingIndex].createdAt || now;
      inventory.items[existingIndex] = itemData;
    } else {
      itemData.createdAt = now;
      inventory.items.push(itemData);
    }

    inventory.updatedAt = now;
    await inventory.save();

    res.json({ success: true, item: itemData, items: inventory.items });
  } catch (error) {
    logger.error('[SGSST EPP Inventory] Save item error:', error);
    res.status(500).json({ error: 'Error al guardar EPP en inventario' });
  }
});

// ─── POST /inventory/delete-item — Eliminar EPP del Inventario ──────────────
router.post('/inventory/delete-item', requireJwtAuth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const inventory = await SgsstEppInventory.findOne({ user: req.user.id, companyId });
    if (!inventory) {
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }

    inventory.items = inventory.items.filter(i => i.id !== itemId);
    inventory.updatedAt = new Date();
    await inventory.save();

    res.json({ success: true, items: inventory.items });
  } catch (error) {
    logger.error('[SGSST EPP Inventory] Delete item error:', error);
    res.status(500).json({ error: 'Error al eliminar EPP del inventario' });
  }
});

// ─── POST /inventory/adjust-stock — Ajustar / Entrada rápida de Stock ────────
router.post('/inventory/adjust-stock', requireJwtAuth, async (req, res) => {
  try {
    const { itemId, delta, newStock, reason } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const inventory = await SgsstEppInventory.findOne({ user: req.user.id, companyId });
    if (!inventory) {
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }

    const item = inventory.items.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Elemento de EPP no encontrado en bodega' });
    }

    if (typeof newStock === 'number') {
      item.stockActual = Math.max(0, newStock);
    } else if (typeof delta === 'number') {
      item.stockActual = Math.max(0, (Number(item.stockActual) || 0) + delta);
    }

    item.updatedAt = new Date();
    inventory.updatedAt = new Date();
    await inventory.save();

    logger.info(`[SGSST EPP Inventory] Ajuste manual para "${item.nombre}": nuevoStock=${item.stockActual} (motivo: ${reason || 'N/A'})`);

    res.json({ success: true, item, items: inventory.items });
  } catch (error) {
    logger.error('[SGSST EPP Inventory] Adjust stock error:', error);
    res.status(500).json({ error: 'Error al ajustar stock de EPP' });
  }
});

// ─── POST /inventory/seed-defaults — Cargar Catálogo Sugerido ────────────────
router.post('/inventory/seed-defaults', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    let inventory = await SgsstEppInventory.findOne({ user: req.user.id, companyId });
    if (!inventory) {
      inventory = new SgsstEppInventory({
        user: req.user.id,
        companyId,
        items: []
      });
    }

    const existingNames = new Set((inventory.items || []).map(i => (i.nombre || '').toLowerCase().trim()));
    const now = new Date();
    let addedCount = 0;

    DEFAULT_EPP_CATALOG.forEach((defItem, idx) => {
      const key = defItem.nombre.toLowerCase().trim();
      if (!existingNames.has(key)) {
        inventory.items.push({
          ...defItem,
          id: `INV-EPP-SEED-${Date.now()}-${idx}`,
          createdAt: now,
          updatedAt: now
        });
        existingNames.add(key);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      inventory.updatedAt = now;
      await inventory.save();
    }

    res.json({ success: true, addedCount, items: inventory.items });
  } catch (error) {
    logger.error('[SGSST EPP Inventory] Seed error:', error);
    res.status(500).json({ error: 'Error al cargar catálogo de EPP sugerido' });
  }
});

// ─── POST /save — Registrar/Actualizar entrega de EPP ────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { workerId, documento, nombreTrabajador, cargo, entregas } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    // Consultar estado previo para calcular el delta y descontar/reponer del inventario
    const oldDoc = await SgsstEppData.findOne({ user: req.user.id, companyId, workerId }).lean();
    const oldEntregas = oldDoc?.entregas || [];

    // Traer la firma del trabajador si ya está registrada en perfil sociodemográfico
    const registeredSignature = await getWorkerRegisteredSignature(req.user.id, companyId, workerId);

    // Mapear cada entrega para inyectar la firma si el usuario no mandó una nueva firma en la entrega actual
    const updatedEntregas = (entregas || []).map(ent => {
      if (!ent.firmaTrabajador && registeredSignature) {
        return { ...ent, firmaTrabajador: registeredSignature };
      }
      return ent;
    });

    const updatedDoc = await SgsstEppData.findOneAndUpdate(
      { user: req.user.id, companyId, workerId },
      {
        $set: {
          documento,
          nombreTrabajador,
          cargo,
          entregas: updatedEntregas,
          updatedAt: Date.now()
        }
      },
      { upsert: true, new: true }
    );

    // Descontar automáticamente las existencias del inventario / stock
    const updatedInventory = await adjustInventoryForDeliveries(req.user.id, companyId, oldEntregas, updatedEntregas);

    // Lanzar sincronización con IPEVAR en segundo plano
    await syncEppWithIpevar(req.user.id, companyId, workerId, updatedDoc);

    res.json({ success: true, data: updatedDoc, updatedInventory: updatedInventory || undefined });
  } catch (error) {
    logger.error('[SGSST EPP] Save error:', error);
    res.status(500).json({ error: 'Error al guardar entrega de EPP' });
  }
});

// ─── POST /sync-manual — Disparar sincronización manual ──────────────────────
router.post('/sync-manual', requireJwtAuth, async (req, res) => {
  try {
    const { workerId } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    const doc = await SgsstEppData.findOne({ user: req.user.id, companyId, workerId });
    if (!doc) {
      return res.status(404).json({ error: 'No se encontraron entregas de EPP para este trabajador' });
    }

    await syncEppWithIpevar(req.user.id, companyId, workerId, doc);
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST EPP] Manual sync error:', error);
    res.status(500).json({ error: 'Error en sincronización manual' });
  }
});

// ─── Función de Sincronización con la Matriz Bio-IPEVAR (SgsstWorker) ─────────
async function syncEppWithIpevar(userId, companyId, workerId, eppDoc) {
  try {
    const worker = await SgsstWorker.findOne({ user: userId, companyId, perfilId: workerId });
    if (!worker) {
      logger.debug(`[SGSST EPP Sync] SgsstWorker no encontrado para id ${workerId}`);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Evaluar si tiene EPPs vencidos o inspecciones de alturas pendientes
    let hasExpiredRegular = false;
    let hasExpiredAlturas = false;
    let totalAlertsCount = 0;

    (eppDoc.entregas || []).forEach(ent => {
      // Comparar fechas
      if (ent.fechaVencimiento) {
        const vto = parseDateString(ent.fechaVencimiento);
        if (vto && vto < today) {
          if (ent.tipo === 'Alturas') hasExpiredAlturas = true;
          else hasExpiredRegular = true;
          totalAlertsCount++;
        }
      }
      if (ent.tipo === 'Alturas' && ent.fechaProximaInspeccion) {
        const prox = parseDateString(ent.fechaProximaInspeccion);
        if (prox && prox < today) {
          hasExpiredAlturas = true;
          totalAlertsCount++;
        }
      }
    });

    // 1. Gestionar las fitAlerts en el perfil de salud SgsstWorker
    const newAlertsSet = new Set(worker.fitAlerts || []);
    const alertLabelRegular = 'EPP Convencional Vencido';
    const alertLabelAlturas = 'Equipo de Alturas Vencido o Sin Certificar';

    if (hasExpiredRegular) {
      newAlertsSet.add(alertLabelRegular);
    } else {
      newAlertsSet.delete(alertLabelRegular);
    }

    if (hasExpiredAlturas) {
      newAlertsSet.add(alertLabelAlturas);
    } else {
      newAlertsSet.delete(alertLabelAlturas);
    }

    // 2. Modular el fitScore en función de los EPPs vencidos (Castigo de -10 pts por alerta)
    // Partimos de un score base recalculado del Perfil Sociodemográfico o mantenemos el actual.
    // Para simplificar, restamos 10 puntos por cada tipo de alerta activa, asegurando rango [0, 100].
    let fitPenalty = 0;
    if (hasExpiredRegular) fitPenalty += 10;
    if (hasExpiredAlturas) fitPenalty += 15; // Mayor peso por alturas

    // Buscamos sincronizar con la matriz bio-individual (riesgosBioIndividual)
    const updatedRiesgos = (worker.riesgosBioIndividual || []).map(risk => {
      const eppRequired = risk.controles_individuo && /EPP|arnés|eslinga|casco|gafas/i.test(risk.controles_individuo);
      if (eppRequired) {
        // Si hay alertas activas de EPP, marcamos el control como inefectivo
        if (hasExpiredRegular || hasExpiredAlturas) {
          return {
            ...risk,
            plan_accion_bio: '❌ ALERTA: EPP Requerido se encuentra VENCIDO o pendiente de entrega.',
            nivel_susceptibilidad: Math.min(5, (risk.nivel_susceptibilidad || 1) + 1) // Incrementa susceptibilidad
          };
        } else {
          return {
            ...risk,
            plan_accion_bio: '✅ EPP Verificado y al día.',
            nivel_susceptibilidad: Math.max(1, (risk.nivel_susceptibilidad || 2) - 1) // Reduce susceptibilidad
          };
        }
      }
      return risk;
    });

    // Guardar cambios en el SgsstWorker
    await SgsstWorker.updateOne(
      { _id: worker._id },
      {
        $set: {
          fitAlerts: Array.from(newAlertsSet),
          riesgosBioIndividual: updatedRiesgos,
          updatedAt: Date.now()
        }
      }
    );

    logger.info(`[SGSST EPP Sync] Sincronización exitosa para trabajador ${worker.nombre}. Alertas: ${totalAlertsCount}`);

  } catch (err) {
    logger.error('[SGSST EPP Sync] Error syncing EPP with IPEVAR:', err.message);
  }
}

// Auxiliar de parsing
function parseDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── POST /generate ───────────────────────────────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
  try {
    const { workerId, nombreTrabajador, cargo, entregas, modelName } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();
    const finalModelName = modelName || preferredModel;

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean()
        || await CompanyInfo.findOne({ user: req.user.id }).lean();
    } catch (e) {
      logger.warn('Failed to load company info for EPP');
    }

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const headerHTML = buildStandardHeader({
      title: 'INFORME DE ENTREGA Y SEGUIMIENTO DE EPP',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Art. 85 Ley 9 de 1979 / Resolución 2400 de 1979 / Dec. 1072 de 2015',
      responsibleName: req.user?.name,
    });

    const entregasStr = (entregas || []).map(e => 
      `- EPP: ${e.nombre} | Fecha: ${e.fechaEntrega} | Vence: ${e.fechaVencimiento || 'N/A'} | Estado: ${e.estado} | Firma: ${e.firmaTrabajador ? 'FIRMADO' : 'PENDIENTE'}`
    ).join('\n') || '[Sin entregas registradas]';

    const promptText = `
${headerHTML}
Eres un Experto Técnico Senior en Seguridad y Salud en el Trabajo (SST) colombiano.
Tu objetivo es redactar un **INFORME DE CUMPLIMIENTO, ENTREGA Y SEGUIMIENTO DE EPP** estructurado y profesional para el siguiente trabajador:

**DATOS DEL TRABAJADOR:**
- Nombre: ${nombreTrabajador}
- Cargo: ${cargo || 'No asignado'}
- Empresa: ${loadedCompanyInfo?.companyName || 'No registrada'}

**HISTORIAL DE ENTREGAS:**
${entregasStr}

**INSTRUCCIONES DE REDACCIÓN:**
1. Genera un informe exhaustivo en formato HTML que continúe después del encabezado anterior.
2. Usa tablas HTML estructuradas y estilos CSS inline discretos y modernos (sin repetir etiquetas HTML o HEAD, solo estructura de cuerpo o contenedores div y table).
3. Incluye las siguientes secciones:
   - **Resumen Ejecutivo**: Análisis general del cumplimiento.
   - **Evaluación de Estado e Integridad**: Estado de los EPPs entregados y si hay vencidos.
   - **Plan de Acción y Recomendaciones**: Instrucciones para el trabajador y la empresa para garantizar la protección continua.
4. NUNCA inventes entregas, fechas, firmas o datos que no estén listados en el historial.
`;

    const result = await generateWithKeyRotation(finalModelName, req.user.id, promptText);
    res.json({ report: result.response.text() });
  } catch (error) {
    logger.error('[SGSST EPP Generate] Error:', error);
    res.status(500).json({ error: error.message || 'Error al generar informe de EPP' });
  }
});

module.exports = router;
