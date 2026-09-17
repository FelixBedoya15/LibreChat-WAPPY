const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('[Error] MONGO_URI is not set in environment.');
  process.exit(1);
}

async function run() {
  try {
    console.log('[Seed Audit Demo] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Seed Audit Demo] Connected successfully.');

    const { userSchema } = require('@librechat/data-schemas');
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const AuditoriaData = require('../api/models/AuditoriaData');
    const KanbanTask = require('../api/models/KanbanTask');
    const CompanyInfo = require('../api/models/CompanyInfo');

    // Find target user
    const targetEmail = (process.argv[2] || 'cristhian@mauricioposadac.com').toLowerCase().trim();
    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      user = await User.findOne({ role: 'ADMIN' });
    }
    if (!user) {
      user = await User.findOne({});
    }

    if (!user) {
      console.error('[Error] No user found in database.');
      process.exit(1);
    }

    console.log(`[Seed Audit Demo] Target user: ${user.email} (${user._id})`);

    // Find or create CompanyInfo
    let company = await CompanyInfo.findOne({ user: user._id, isActive: true });
    if (!company) {
      company = await CompanyInfo.findOne({ user: user._id });
    }

    const companyId = company ? company._id : null;
    const companyName = company ? company.companyName : 'Empresa Demo SST';

    console.log(`[Seed Audit Demo] Company: ${companyName} (${companyId})`);

    // 1. Audit Evaluation Status Items
    const sampleStatusData = [
      {
        itemId: 'audit-1.1.1',
        code: '1.1.1',
        name: 'Responsable del SG-SST',
        status: 'cumple',
        observation: 'Designación formal del responsable con licencia SST vigente y curso de 50 horas.',
        cycle: 'planear'
      },
      {
        itemId: 'audit-1.1.2',
        code: '1.1.2',
        name: 'Asignación de recursos para el SG-SST',
        status: 'parcial',
        observation: 'Se cuenta con presupuesto asignado para EPP pero falta definir rubro específico para capacitación externa y mediciones higiénicas.',
        cycle: 'planear'
      },
      {
        itemId: 'audit-2.1.1',
        code: '2.1.1',
        name: 'Evaluación inicial del SG-SST',
        status: 'cumple',
        observation: 'Evaluación inicial según Res. 0312 realizada e identificadas las prioridades de intervención.',
        cycle: 'planear'
      },
      {
        itemId: 'audit-3.1.1',
        code: '3.1.1',
        name: 'Identificación de peligros y valoración de riesgos (GTC 45)',
        status: 'no_cumple',
        observation: 'No se cuenta con la actualización anual de la matriz IPEVAR para las nuevas líneas operativas de bodega y alturas.',
        cycle: 'hacer'
      },
      {
        itemId: 'audit-3.2.1',
        code: '3.2.1',
        name: 'Programa de Capacitación y Entrenamiento',
        status: 'parcial',
        observation: 'Se ejecutan charlas pero el cumplimiento del cronograma anual está por debajo del 60%. Faltan registros de asistencia.',
        cycle: 'hacer'
      },
      {
        itemId: 'audit-4.1.1',
        code: '4.1.1',
        name: 'Investigación de Incidentes, Accidentes y Enfermedades Laborales',
        status: 'cumple',
        observation: 'Se cuenta con metodología de investigación (árbol de causas / Ishikawa) y reporte oportuno a ARL.',
        cycle: 'verificar'
      },
      {
        itemId: 'audit-5.1.1',
        code: '5.1.1',
        name: 'Plan de Mejoramiento y Acciones ACPM',
        status: 'no_cumple',
        observation: 'No se realiza seguimiento mensual al cierre de las no conformidades detectadas en la auditoría anterior.',
        cycle: 'actuar'
      }
    ];

    const totalEvaluated = sampleStatusData.length;
    const cumpleCount = sampleStatusData.filter(s => s.status === 'cumple').length;
    const compliancePercentage = Math.round((cumpleCount / totalEvaluated) * 100);

    // Save AuditoriaData
    await AuditoriaData.findOneAndUpdate(
      { user: user._id, companyId },
      {
        $set: {
          user: user._id,
          companyId,
          statusData: sampleStatusData,
          reviewerInfo: {
            nombre: 'Auditor Líder HSEQ',
            cargo: 'Auditor Interno Certificado ISO 45001',
            licencia: 'SST-2024-88910',
            fecha: new Date().toISOString().split('T')[0]
          },
          compliancePercentage,
          weightedScore: compliancePercentage * 0.85,
          score: compliancePercentage,
          summary: {
            total: totalEvaluated,
            cumple: cumpleCount,
            noCumple: sampleStatusData.filter(s => s.status === 'no_cumple').length,
            parcial: sampleStatusData.filter(s => s.status === 'parcial').length,
          },
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    console.log(`[Seed Audit Demo] AuditoriaData saved. Compliance: ${compliancePercentage}%`);

    // 2. Create ACPM Kanban Tasks for findings
    const findingsToSync = [
      {
        referenceId: 'audit-find-audit-3.1.1',
        title: '[No Conformidad Auditoría] Actualización Matriz IPEVAR GTC 45',
        description: 'Actualizar la identificación de peligros y valoración de riesgos en las líneas de bodega y trabajos en alturas. Criterio: Dec 1072/2015 Art. 2.2.4.6.15.',
        dueDate: new Date(Date.now() + 15 * 86400000),
        status: 'todo',
        type: 'audit_finding',
        priority: 'alta',
        actionType: 'correctiva',
        assignedTo: 'Coordinador SST',
        sourceModule: 'auditoria',
        referenceName: 'Auditoría SG-SST (Ítem 3.1.1)'
      },
      {
        referenceId: 'audit-find-audit-5.1.1',
        title: '[No Conformidad Auditoría] Sistema de Seguimiento Mensual ACPM',
        description: 'Implementar el procedimiento documentado y tablero de control para el seguimiento y cierre efectivo de no conformidades con COPASST.',
        dueDate: new Date(Date.now() + 20 * 86400000),
        status: 'todo',
        type: 'audit_finding',
        priority: 'alta',
        actionType: 'correctiva',
        assignedTo: 'Gerente General / Encargado SST',
        sourceModule: 'auditoria',
        referenceName: 'Auditoría SG-SST (Ítem 5.1.1)'
      },
      {
        referenceId: 'audit-find-audit-1.1.2',
        title: '[Oportunidad Mejora] Definición de Presupuesto Específico Mediciones Higiénicas',
        description: 'Ajustar el presupuesto anual asignando rubro financiero para mediciones ambientales de ruido e iluminación.',
        dueDate: new Date(Date.now() + 30 * 86400000),
        status: 'todo',
        type: 'audit_finding',
        priority: 'media',
        actionType: 'mejora',
        assignedTo: 'Dirección Financiera / SST',
        sourceModule: 'auditoria',
        referenceName: 'Auditoría SG-SST (Ítem 1.1.2)'
      },
      {
        referenceId: 'audit-find-audit-3.2.1',
        title: '[Oportunidad Mejora] Recuperación del Cronograma de Capacitación SST',
        description: 'Reprogramar sesiones pendientes de capacitación con personal operativo y digitalizar listas de asistencia con código QR.',
        dueDate: new Date(Date.now() + 25 * 86400000),
        status: 'todo',
        type: 'audit_finding',
        priority: 'media',
        actionType: 'preventiva',
        assignedTo: 'Jefe de Gestión Humana / SST',
        sourceModule: 'auditoria',
        referenceName: 'Auditoría SG-SST (Ítem 3.2.1)'
      }
    ];

    let createdCount = 0;
    for (const item of findingsToSync) {
      await KanbanTask.findOneAndUpdate(
        { user: user._id, companyId, referenceId: item.referenceId },
        {
          $set: {
            user: user._id,
            companyId,
            ...item
          }
        },
        { upsert: true, new: true }
      );
      createdCount++;
    }

    console.log(`[Seed Audit Demo] ${createdCount} ACPM Kanban tasks successfully seeded and synced.`);
    console.log('✅ Demo audit and action plan are ready in Centro de Control!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Audit Demo] Error:', error);
    process.exit(1);
  }
}

run();
