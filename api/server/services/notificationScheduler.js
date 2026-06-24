/**
 * notificationScheduler.js
 * ────────────────────────
 * Background scheduler that runs daily at 8:00 AM (or later if server was offline)
 * to send expiration alerts for:
 *   1. User subscriptions (30, 15, 5, 1 days before expiry)
 *   2. Somos SST worker documents and scheduled training sessions (Daily Digest for admins)
 */

const mongoose = require('mongoose');
const path = require('path');
const sendEmail = require('../utils/sendEmail');
const { logger } = require('@librechat/data-schemas');

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every 1 hour
let schedulerTimer = null;

// Force registration of required models
const getSgsstModels = () => {
  if (!mongoose.models.PerfilSociodemograficoData) {
    require('../routes/sgsst/perfilSociodemografico');
  }
  if (!mongoose.models.ProgramaCapacitacionesData) {
    require('../routes/sgsst/programaCapacitaciones');
  }
  return {
    PerfilSociodemograficoData: mongoose.models.PerfilSociodemograficoData,
    ProgramaCapacitacionesData: mongoose.models.ProgramaCapacitacionesData
  };
};

/**
 * Robust date helper to parse "YYYY-MM-DD" local date strings without timezone shifts.
 */
const parseDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-based month
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get current Bogota date as string "YYYY-MM-DD"
 */
const getBogotaDateString = (dateObj = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(dateObj);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  } catch (err) {
    // Fallback if Intl fails
    const offset = -5; // Bogota timezone offset UTC-5
    const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    const bogotaDate = new Date(utc + (3600000 * offset));
    const y = bogotaDate.getFullYear();
    const m = String(bogotaDate.getMonth() + 1).padStart(2, '0');
    const d = String(bogotaDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};

/**
 * Runs the plan and SST expiration audits.
 */
const runNotificationChecks = async () => {
  try {
    const User = mongoose.model('User');
    const UserPlan = require('../../db/models/UserPlan');
    const CompanyInfo = require('../../models/CompanyInfo');
    const { PerfilSociodemograficoData, ProgramaCapacitacionesData } = getSgsstModels();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. EVALUAR VENCIMIENTO DE PLANES
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[NotificationScheduler] Checking UserPlan expirations...');
    const activePlans = await UserPlan.find({
      plan: { $nin: ['free', 'admin'] },
      planExpiresAt: { $ne: null }
    }).lean();

    for (const userPlan of activePlans) {
      try {
        const expiry = new Date(userPlan.planExpiresAt);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if ([30, 15, 5, 1].includes(diffDays)) {
          const user = await User.findById(userPlan.userId).select('email name username').lean();
          if (user && user.email) {
            console.log(`[NotificationScheduler] Sending plan warning to ${user.email} (${diffDays} days left)`);
            await sendEmail({
              email: user.email,
              from: process.env.EMAIL_NOTIFICATIONS_FROM || 'notificaciones@wappy.club',
              subject: `🔔 Tu plan de WAPPY IA vence en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`,
              payload: {
                name: user.name || user.username || 'Usuario',
                planName: userPlan.plan,
                daysRemaining: diffDays,
                expiryDate: getBogotaDateString(expiry),
                billingUrl: 'https://wappy-ia.com/dashboard/billing',
                year: new Date().getFullYear(),
              },
              template: 'planExpiration.handlebars',
            });
          }
        }
      } catch (planErr) {
        console.error(`[NotificationScheduler] Error processing UserPlan ${userPlan._id}:`, planErr.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. EVALUAR VENCIMIENTOS DE SOMOS SST (DAILY DIGEST)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[NotificationScheduler] Checking Somos SST expirations...');
    const profiles = await PerfilSociodemograficoData.find({}).lean();

    for (const profile of profiles) {
      try {
        const userId = profile.user;
        const companyId = profile.companyId;
        if (!userId) continue;

        const medicalAlerts = [];
        const heightsAlerts = [];
        const docAlerts = [];
        const trainingAlerts = [];

        // Evaluar cada trabajador
        const trabajadores = profile.trabajadores || [];
        for (const w of trabajadores) {
          const workerName = w.nombre || 'Trabajador sin nombre';
          const cargo = w.cargo || 'Sin cargo';

          // A. Examen Médico Ocupacional (Expira cada 365 días)
          if (w.fechaExamenMedico) {
            const lastExam = parseDateString(w.fechaExamenMedico);
            if (lastExam) {
              const diffDays = Math.round((today.getTime() - lastExam.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 365) {
                medicalAlerts.push({
                  workerName,
                  cargo,
                  alertType: 'Examen médico periódico vencido',
                  date: w.fechaExamenMedico,
                  statusClass: 'badge-danger',
                  statusText: 'Vencido'
                });
              } else if (diffDays >= 335) {
                medicalAlerts.push({
                  workerName,
                  cargo,
                  alertType: 'Examen médico vence en menos de 30 días',
                  date: w.fechaExamenMedico,
                  statusClass: 'badge-warning',
                  statusText: 'Próximo'
                });
              }
            }
          }

          // B. Curso de Alturas (Expira cada 365 días)
          if (w.fechaCursoAlturasAutorizado) {
            const lastAuth = parseDateString(w.fechaCursoAlturasAutorizado);
            if (lastAuth) {
              const diffDays = Math.round((today.getTime() - lastAuth.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 365) {
                heightsAlerts.push({
                  workerName,
                  cargo,
                  courseType: 'Curso Alturas Autorizado',
                  date: w.fechaCursoAlturasAutorizado,
                  statusClass: 'badge-danger',
                  statusText: 'Vencido'
                });
              } else if (diffDays >= 335) {
                heightsAlerts.push({
                  workerName,
                  cargo,
                  courseType: 'Curso Alturas Autorizado',
                  date: w.fechaCursoAlturasAutorizado,
                  statusClass: 'badge-warning',
                  statusText: 'Próximo'
                });
              }
            }
          }
          if (w.fechaCursoAlturasCoordinador) {
            const lastCoord = parseDateString(w.fechaCursoAlturasCoordinador);
            if (lastCoord) {
              const diffDays = Math.round((today.getTime() - lastCoord.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 365) {
                heightsAlerts.push({
                  workerName,
                  cargo,
                  courseType: 'Curso Alturas Coordinador',
                  date: w.fechaCursoAlturasCoordinador,
                  statusClass: 'badge-danger',
                  statusText: 'Vencido'
                });
              } else if (diffDays >= 335) {
                heightsAlerts.push({
                  workerName,
                  cargo,
                  courseType: 'Curso Alturas Coordinador',
                  date: w.fechaCursoAlturasCoordinador,
                  statusClass: 'badge-warning',
                  statusText: 'Próximo'
                });
              }
            }
          }

          // C. Seguimientos Médicos
          if (w.fechaSeguimiento) {
            const followUpDate = parseDateString(w.fechaSeguimiento);
            if (followUpDate) {
              const diffDays = Math.round((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0 && diffDays >= -30) {
                medicalAlerts.push({
                  workerName,
                  cargo,
                  alertType: 'Seguimiento médico vencido',
                  date: w.fechaSeguimiento,
                  statusClass: 'badge-danger',
                  statusText: 'Vencido'
                });
              } else if (diffDays >= 0 && diffDays <= 7) {
                medicalAlerts.push({
                  workerName,
                  cargo,
                  alertType: 'Seguimiento médico programado pronto',
                  date: w.fechaSeguimiento,
                  statusClass: 'badge-warning',
                  statusText: 'Próximo'
                });
              }
            }
          }

          // D. Documentos de Vehículos (SOAT, Tecnomecánica)
          if (w.soatVencimiento) {
            const soatDate = parseDateString(w.soatVencimiento);
            if (soatDate) {
              const diffDays = Math.round((soatDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0 && diffDays >= -30) {
                docAlerts.push({
                  workerName,
                  docType: 'SOAT',
                  date: w.soatVencimiento,
                  statusClass: 'badge-danger',
                  statusText: 'Vencido'
                });
              } else if (diffDays >= 0 && diffDays <= 30) {
                docAlerts.push({
                  workerName,
                  docType: 'SOAT',
                  date: w.soatVencimiento,
                  statusClass: 'badge-warning',
                  statusText: 'Próximo'
                });
              }
            }
          }
          if (w.tecnicomecanicaVencimiento) {
            const tecDate = parseDateString(w.tecnicomecanicaVencimiento);
            if (tecDate) {
              const diffDays = Math.round((tecDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0 && diffDays >= -30) {
                docAlerts.push({
                  workerName,
                  docType: 'Revisión Técnico-Mecánica',
                  date: w.tecnicomecanicaVencimiento,
                  statusClass: 'badge-danger',
                  statusText: 'Vencido'
                });
              } else if (diffDays >= 0 && diffDays <= 30) {
                docAlerts.push({
                  workerName,
                  docType: 'Revisión Técnico-Mecánica',
                  date: w.tecnicomecanicaVencimiento,
                  statusClass: 'badge-warning',
                  statusText: 'Próximo'
                });
              }
            }
          }

          // E. Licencias (Conducción, SST)
          if (w.licenciaConduccionVencimiento) {
            const condDate = parseDateString(w.licenciaConduccionVencimiento);
            if (condDate) {
              const diffDays = Math.round((condDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0 && diffDays >= -30) {
                docAlerts.push({
                  workerName,
                  docType: 'Licencia de Conducción',
                  date: w.licenciaConduccionVencimiento,
                  statusClass: 'badge-danger',
                  statusText: 'Vencido'
                });
              } else if (diffDays >= 0 && diffDays <= 30) {
                docAlerts.push({
                  workerName,
                  docType: 'Licencia de Conducción',
                  date: w.licenciaConduccionVencimiento,
                  statusClass: 'badge-warning',
                  statusText: 'Próximo'
                });
              }
            }
          }
          if (w.licenciaVencimiento) {
            const licDate = parseDateString(w.licenciaVencimiento);
            if (licDate) {
              const diffDays = Math.round((licDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0 && diffDays >= -30) {
                docAlerts.push({
                  workerName,
                  docType: 'Licencia de Prestación de Servicios SST',
                  date: w.licenciaVencimiento,
                  statusClass: 'badge-danger',
                  statusText: 'Vencido'
                });
              } else if (diffDays >= 0 && diffDays <= 30) {
                docAlerts.push({
                  workerName,
                  docType: 'Licencia de Prestación de Servicios SST',
                  date: w.licenciaVencimiento,
                  statusClass: 'badge-warning',
                  statusText: 'Próximo'
                });
              }
            }
          }

          // E.2. EPP & Alturas Inspections
          const SgsstEppData = require('../../models/SgsstEppData');
          const eppData = await SgsstEppData.findOne({ user: userId, companyId, workerId: w.id }).lean();
          if (eppData && eppData.entregas) {
            for (const ent of eppData.entregas) {
              // Check EPP replacement expiry
              if (ent.fechaVencimiento) {
                const vto = parseDateString(ent.fechaVencimiento);
                if (vto) {
                  const diffDays = Math.round((vto.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const threshold = ent.tipo === 'Alturas' ? 30 : 15;
                  if (diffDays < 0 && diffDays >= -30) {
                    docAlerts.push({
                      workerName,
                      docType: `EPP: ${ent.nombre} (${ent.tipo === 'Alturas' ? 'Alturas' : 'Regular'})`,
                      date: ent.fechaVencimiento,
                      statusClass: 'badge-danger',
                      statusText: 'Vencido'
                    });
                  } else if (diffDays >= 0 && diffDays <= threshold) {
                    docAlerts.push({
                      workerName,
                      docType: `EPP: ${ent.nombre} (${ent.tipo === 'Alturas' ? 'Alturas' : 'Regular'})`,
                      date: ent.fechaVencimiento,
                      statusClass: 'badge-warning',
                      statusText: 'Próximo'
                    });
                  }
                }
              }

              // Check Heights annual inspection expiry
              if (ent.tipo === 'Alturas' && ent.fechaProximaInspeccion) {
                const prox = parseDateString(ent.fechaProximaInspeccion);
                if (prox) {
                  const diffDays = Math.round((prox.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  if (diffDays < 0 && diffDays >= -30) {
                    docAlerts.push({
                      workerName,
                      docType: `Inspección de Alturas: ${ent.nombre} (Serial: ${ent.serial || 'S/N'})`,
                      date: ent.fechaProximaInspeccion,
                      statusClass: 'badge-danger',
                      statusText: 'Vencido'
                    });
                  } else if (diffDays >= 0 && diffDays <= 30) {
                    docAlerts.push({
                      workerName,
                      docType: `Inspección de Alturas: ${ent.nombre} (Serial: ${ent.serial || 'S/N'})`,
                      date: ent.fechaProximaInspeccion,
                      statusClass: 'badge-warning',
                      statusText: 'Próximo'
                    });
                  }
                }
              }
            }
          }
        }

        // F. Capacitaciones Programadas
        const trainingData = await PerfilSociodemograficoData.db.model('ProgramaCapacitacionesData').findOne({ user: userId, companyId }).lean();
        if (trainingData && trainingData.sesiones) {
          for (const ses of trainingData.sesiones) {
            if (ses.estado === 'Programada' && ses.fecha) {
              const sesDate = parseDateString(ses.fecha);
              if (sesDate) {
                const diffDays = Math.round((sesDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays < 0 && diffDays >= -15) {
                  trainingAlerts.push({
                    topic: ses.tema,
                    responsible: ses.responsable || 'No asignado',
                    date: ses.fecha,
                    alertType: 'Capacitación programada sin ejecutar (fecha pasada)',
                    statusClass: 'badge-danger',
                    statusText: 'Vencida'
                  });
                } else if ([1, 3].includes(diffDays)) {
                  trainingAlerts.push({
                    topic: ses.tema,
                    responsible: ses.responsable || 'No asignado',
                    date: ses.fecha,
                    alertType: `Sesión programada en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`,
                    statusClass: 'badge-warning',
                    statusText: 'Próxima'
                  });
                }
              }
            }
          }
        }

        const hasMedicalAlerts = medicalAlerts.length > 0;
        const hasHeightsAlerts = heightsAlerts.length > 0;
        const hasDocAlerts = docAlerts.length > 0;
        const hasTrainingAlerts = trainingAlerts.length > 0;

        if (hasMedicalAlerts || hasHeightsAlerts || hasDocAlerts || hasTrainingAlerts) {
          const user = await User.findById(userId).select('email name username').lean();
          if (user && user.email) {
            let companyName = 'Mi Empresa';
            if (companyId) {
              const company = await CompanyInfo.findById(companyId).select('companyName').lean();
              if (company && company.companyName) {
                companyName = company.companyName;
              }
            }

            console.log(`[NotificationScheduler] Sending Somos SST Digest to ${user.email} for company: ${companyName}`);
            
            await sendEmail({
              email: user.email,
              from: process.env.EMAIL_NOTIFICATIONS_FROM || 'notificaciones@wappy.club',
              subject: `⚠️ Resumen de Vencimientos Somos SST - ${companyName}`,
              payload: {
                name: user.name || user.username || 'Administrador',
                companyName,
                hasMedicalAlerts,
                medicalAlerts,
                hasHeightsAlerts,
                heightsAlerts,
                hasDocAlerts,
                docAlerts,
                hasTrainingAlerts,
                trainingAlerts,
                year: new Date().getFullYear(),
              },
              template: 'sstExpirationsDigest.handlebars'
            });

            // Registrar notificación in-app en el portal
            const Notification = mongoose.model('Notification');
            if (Notification) {
              const alertSummary = [];
              if (hasMedicalAlerts) alertSummary.push(`${medicalAlerts.length} exámenes/seguimientos`);
              if (hasHeightsAlerts) alertSummary.push(`${heightsAlerts.length} cursos de alturas`);
              if (hasDocAlerts) alertSummary.push(`${docAlerts.length} documentos de vehículos/licencias`);
              if (hasTrainingAlerts) alertSummary.push(`${trainingAlerts.length} capacitaciones`);

              await Notification.create({
                user: userId,
                type: 'system_update',
                title: `Vencimientos críticos de SST detectados`,
                body: `Se han detectado vencimientos pendientes en tu empresa ${companyName}: ${alertSummary.join(', ')}. Revisa tu correo o el módulo Somos SST para gestionarlos.`,
                read: false
              });
            }
          }
        }
      } catch (profileErr) {
        console.error(`[NotificationScheduler] Error processing profile for user ${profile.user}:`, profileErr.message);
      }
    }
  } catch (err) {
    console.error('[NotificationScheduler] runNotificationChecks execution failed:', err.message);
  }
};

/**
 * Checks and triggers the daily notification run if not executed yet today.
 */
const checkAndRunDailyNotifications = async () => {
  try {
    const SgsstConfig = require('../../models/SgsstConfig');
    let config = await SgsstConfig.findOne({});
    if (!config) {
      config = await SgsstConfig.create({ disabledApps: [] });
    }

    const todayStr = getBogotaDateString();
    
    let lastRunDateStr = null;
    if (config.lastNotificationRun) {
      lastRunDateStr = getBogotaDateString(new Date(config.lastNotificationRun));
    }

    if (lastRunDateStr === todayStr) {
      // Already run today, skip
      return;
    }

    // Check if the current time in Bogota is 8:00 AM or later
    const bogotaHour = parseInt(
      new Date().toLocaleTimeString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        hour12: false
      }),
      10
    );

    if (bogotaHour >= 8) {
      console.log(`[NotificationScheduler] Initializing daily audit for ${todayStr}. Current Bogota Hour: ${bogotaHour}`);
      await runNotificationChecks();

      // Update global config with last run time
      await SgsstConfig.updateOne(
        { _id: config._id },
        { $set: { lastNotificationRun: new Date() } }
      );
      console.log(`[NotificationScheduler] Daily audit run finalized for ${todayStr}.`);
    }
  } catch (err) {
    console.error('[NotificationScheduler] checkAndRunDailyNotifications loop error:', err.message);
  }
};

/**
 * Starts the notification scheduler loop.
 */
const startNotificationScheduler = () => {
  if (schedulerTimer) return; // Already running

  console.log(`[NotificationScheduler] Started. Checked daily at 8 AM (every ${CHECK_INTERVAL_MS / 3600000} hours).`);

  // Run a quick check 20 seconds after start
  setTimeout(checkAndRunDailyNotifications, 20_000);

  // Poll every hour
  schedulerTimer = setInterval(checkAndRunDailyNotifications, CHECK_INTERVAL_MS);
};

const stopNotificationScheduler = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[NotificationScheduler] Stopped.');
  }
};

module.exports = {
  startNotificationScheduler,
  stopNotificationScheduler,
  // Export helpers for testing/forcing checks
  runNotificationChecks,
  checkAndRunDailyNotifications
};
