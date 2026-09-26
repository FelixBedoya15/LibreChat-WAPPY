const express = require('express');
const { generateWithKeyRotation, resolveApiKeys } = require('./sgsstGemini');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');

// ─── HELPER: Google Gemini Fallback ───────────────────────────────────────
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];


/**
 * POST /api/sgsst/estadisticas/generate
 * Calculates ATEL indicators (Res. 0312/2019 Art. 30) for Monthly or Annual scope.
 * Aggregates data from multiple months if scope is ANNUAL.
 * Generates qualitative analysis based on event details (causes, hazards).
 */
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            scope, // 'MONTH' | 'ANNUAL'
            year,
            targetMonthIndex,
            monthName,
            annualData, // Record<number, MonthData>
            modelName,
            userName,
        } = req.body;

        const safeAnnualData = annualData || {};
        const monthsIndices = Object.keys(safeAnnualData).map(Number).sort((a, b) => a - b);

        // ─── 1. Aggregation Logic ──────────────────────────────────────
        let aggregated = {
            workersSum: 0,
            monthsWithWorkers: 0,
            numAT: 0,
            numATMortales: 0,
            diasIncapacidadAT: 0,
            diasCargados: 0,
            casosNuevosEL: 0,
            casosAntiguosEL: 0,
            diasIncapacidadEL: 0,
            numEventosMedicosComunes: 0,
            diasAusenciaMedicaComun: 0,
            numLicenciasLegales: 0,
            diasLicenciasLegales: 0,
            numPermisosYSanciones: 0,
            diasPermisosYSanciones: 0,
            numAusenciasInjustificadas: 0,
            diasAusenciasInjustificadas: 0,
            diasAusenciaMedicaTotal: 0,
            diasAusenciaTotal: 0,
            diasProgramados: 0,
            allEvents: [],
            // Finanzas Agregadas
            finanzas: {
                costoSalarioDirectoEmpresa: 0,
                costoSeguridadSocialEmpresa: 0,
                costoSeguridadSocialCubiertoARL: 0,
                costoPrestacionalCausado: 0,
                costoReemplazoTurnos: 0,
                costoIndirectoIceberg: 0,
                costoTotalBruto: 0,
                montoRecobroEPS: 0,
                montoRecobroARL: 0,
                perdidaNetaTotalEmpresa: 0,
            }
        };

        const targetRealIndex = Number(targetMonthIndex);

        monthsIndices.forEach(idx => {
            if (scope === 'MONTH' && idx !== targetRealIndex) return;
            if (scope === 'ANNUAL' && idx > targetRealIndex) return;

            const mData = safeAnnualData[idx];
            if (!mData) return;

            const w = Number(mData.numTrabajadores);
            if (w > 0) {
                aggregated.workersSum += w;
                aggregated.monthsWithWorkers++;
            }

            const events = mData.events || [];
            aggregated.allEvents = [...aggregated.allEvents, ...events.map(e => ({ ...e, monthIndex: idx }))];

            events.forEach(e => {
                const dias = Number(e.diasIncapacidad) || 0;
                const diasCarg = Number(e.diasCargados) || 0;
                const ibc = Number(e.colaborador?.ibcMensual) || 1600000;
                const sd = ibc / 30;
                const tipo = e.tipo || 'Ausentismo';

                // Clasificación por tipo
                if (tipo === 'AT') {
                    aggregated.numAT += 1;
                    aggregated.diasIncapacidadAT += dias;
                    aggregated.diasCargados += diasCarg;
                    if (diasCarg >= 4500 || (e.consecuencia && e.consecuencia.toLowerCase().includes('mortal'))) {
                        aggregated.numATMortales += 1;
                    }
                    aggregated.diasAusenciaMedicaTotal += dias;
                } else if (tipo === 'EL') {
                    aggregated.casosNuevosEL += 1;
                    aggregated.diasIncapacidadEL += dias;
                    aggregated.diasAusenciaMedicaTotal += dias;
                } else if (['EG_EPS', 'ACC_COMUN', 'Ausentismo', 'CITA_MED'].includes(tipo)) {
                    aggregated.numEventosMedicosComunes += 1;
                    aggregated.diasAusenciaMedicaComun += dias;
                    aggregated.diasAusenciaMedicaTotal += dias;
                } else if (['LIC_MAT', 'LIC_PAT', 'LUTO', 'CALAMIDAD', 'SUFRAGIO', 'LEY_2174'].includes(tipo)) {
                    aggregated.numLicenciasLegales += 1;
                    aggregated.diasLicenciasLegales += dias;
                } else if (['LIC_NO_REM', 'SANCION_DISC', 'SINDICAL', 'PERM_REM'].includes(tipo)) {
                    aggregated.numPermisosYSanciones += 1;
                    aggregated.diasPermisosYSanciones += dias;
                } else if (tipo === 'NO_JUSTIF') {
                    aggregated.numAusenciasInjustificadas += 1;
                    aggregated.diasAusenciasInjustificadas += dias;
                } else {
                    aggregated.diasAusenciaMedicaComun += dias;
                    aggregated.diasAusenciaMedicaTotal += dias;
                }

                aggregated.diasAusenciaTotal += dias;

                // Motor Financiero (Cálculo preciso si no viene precalculado)
                let fin = e.financiero;
                if (!fin || typeof fin.perdidaNetaEmpresa === 'undefined') {
                    let costSalario = 0;
                    let costSS = 0;
                    let costSS_ARL = 0;
                    let costPrest = dias * sd * 0.2182; // 21.82% prima, cesantias, intereses, vacaciones
                    let costReemplazo = Number(e.costoReemplazo) || 0;
                    let recobroEPS = 0;
                    let recobroARL = 0;

                    if (tipo === 'AT' || tipo === 'EL') {
                        // ARL: 100% subsidio cubierto desde día 1 siguiente. Empleador paga día 1 regular.
                        recobroARL = dias * sd;
                        // Ley 776/2002 Art. 3 Parágrafo 2: ARL asume 100% de aportes a Salud y Pensión
                        costSS_ARL = dias * sd * 0.205; // 12% pensión + 8.5% salud
                        costSS = 0; // Para la empresa es 0
                        costSalario = 0; // Subsidio 100% ARL
                    } else if (tipo === 'EG_EPS' || tipo === 'ACC_COMUN' || tipo === 'Ausentismo') {
                        // EPS: Días 1 y 2 Empleador al 100% (o 66.67%)
                        const diasEmpresa = Math.min(2, dias);
                        const diasEPS = Math.max(0, dias - 2);
                        costSalario = diasEmpresa * sd;
                        recobroEPS = diasEPS * sd * 0.6667;
                        // Si la empresa complementa al 100% el sueldo:
                        const brecha = diasEPS * sd * (1 - 0.6667);
                        costSalario += brecha;
                        // Seguridad social patronal: Empleador debe pagar pensión (12%)
                        costSS = dias * sd * 0.12;
                    } else if (['LUTO', 'CALAMIDAD', 'SUFRAGIO', 'PERM_REM', 'SINDICAL'].includes(tipo)) {
                        costSalario = dias * sd;
                        costSS = dias * sd * 0.205;
                    } else if (tipo === 'LIC_MAT' || tipo === 'LIC_PAT' || tipo === 'LEY_2174') {
                        recobroEPS = dias * sd; // 100% cubierto por EPS
                        costSalario = 0;
                        costSS = dias * sd * 0.205;
                    } else if (tipo === 'LIC_NO_REM' || tipo === 'SANCION_DISC') {
                        costSalario = 0; // Sin salario
                        costSS = dias * sd * 0.205; // Empleador debe seguir cotizando salud y pensión
                        costPrest = 0;
                    } else if (tipo === 'NO_JUSTIF') {
                        costSalario = 0; // Descuento de salario
                        costSS = dias * sd * 0.205;
                        costPrest = 0;
                    }

                    const bruto = costSalario + costSS + costPrest + costReemplazo;
                    const indirecto = (bruto - (recobroEPS + recobroARL)) * 1.5;
                    const perdidaNeta = Math.max(0, bruto + indirecto - (recobroEPS + recobroARL));

                    fin = {
                        costoDirectoSalario: Math.round(costSalario),
                        costoSeguridadSocial: Math.round(costSS),
                        costoSeguridadSocialCubiertoARL: Math.round(costSS_ARL),
                        costoPrestacional: Math.round(costPrest),
                        costoReemplazo: Math.round(costReemplazo),
                        costoIndirectoIceberg: Math.round(indirecto),
                        costoTotalBruto: Math.round(bruto),
                        montoRecobroEPS: Math.round(recobroEPS),
                        montoRecobroARL: Math.round(recobroARL),
                        perdidaNetaEmpresa: Math.round(perdidaNeta)
                    };
                }

                aggregated.finanzas.costoSalarioDirectoEmpresa += (fin.costoDirectoSalario || 0);
                aggregated.finanzas.costoSeguridadSocialEmpresa += (fin.costoSeguridadSocial || 0);
                aggregated.finanzas.costoSeguridadSocialCubiertoARL += (fin.costoSeguridadSocialCubiertoARL || 0);
                aggregated.finanzas.costoPrestacionalCausado += (fin.costoPrestacional || 0);
                aggregated.finanzas.costoReemplazoTurnos += (fin.costoReemplazo || 0);
                aggregated.finanzas.costoIndirectoIceberg += (fin.costoIndirectoIceberg || 0);
                aggregated.finanzas.costoTotalBruto += (fin.costoTotalBruto || 0);
                aggregated.finanzas.montoRecobroEPS += (fin.montoRecobroEPS || 0);
                aggregated.finanzas.montoRecobroARL += (fin.montoRecobroARL || 0);
                aggregated.finanzas.perdidaNetaTotalEmpresa += (fin.perdidaNetaEmpresa || 0);
            });

            aggregated.diasProgramados += (Number(mData.diasProgramados) || 0);
        });

        // Final Calculations
        const avgWorkers = aggregated.monthsWithWorkers > 0
            ? aggregated.workersSum / aggregated.monthsWithWorkers
            : 0;

        const safeWorkers = avgWorkers || 1;

        // ─── 2. Calculate Indicators (Standard Res 0312 + Ausentismo General) ──
        const k = 100;
        const kEL = 100000;

        const indicators = [
            {
                id: 'frecuencia',
                nombre: 'Frecuencia de Accidentalidad (IF)',
                definicion: 'Número de veces que ocurre un accidente de trabajo en el periodo',
                formula: '(N° AT / N° trabajadores) × 100',
                valor: ((aggregated.numAT / safeWorkers) * k).toFixed(2),
                interpretacion: `Por cada 100 trabajadores, se presentaron ${((aggregated.numAT / safeWorkers) * k).toFixed(2)} accidentes de trabajo en el periodo`,
                periodicidad: 'Mensual'
            },
            {
                id: 'severidad',
                nombre: 'Severidad de Accidentalidad (IS)',
                definicion: 'Número de días perdidos por accidentes de trabajo + días cargados',
                formula: '((Días Incap AT + Días Cargados) / N° trabajadores) × 100',
                valor: (((aggregated.diasIncapacidadAT + aggregated.diasCargados) / safeWorkers) * k).toFixed(2),
                interpretacion: `Por cada 100 trabajadores, se perdieron ${(((aggregated.diasIncapacidadAT + aggregated.diasCargados) / safeWorkers) * k).toFixed(2)} días por accidentes de trabajo`,
                periodicidad: 'Mensual'
            },
            {
                id: 'mortalidad',
                nombre: 'Proporción de Accidentes de Trabajo Mortales',
                definicion: 'Número de accidentes de trabajo mortales en el año',
                formula: '(N° AT Mortales / Total AT) × 100',
                valor: aggregated.numAT > 0 ? ((aggregated.numATMortales / aggregated.numAT) * 100).toFixed(2) : '0.00',
                interpretacion: aggregated.numATMortales > 0 
                    ? `El ${((aggregated.numATMortales / aggregated.numAT) * 100).toFixed(2)}% de los accidentes fueron fatales`
                    : 'Sin accidentes mortales reportados (Meta cumplida 0%)',
                periodicidad: 'Anual'
            },
            {
                id: 'prevalencia',
                nombre: 'Prevalencia de la Enfermedad Laboral',
                definicion: 'Casos de enfermedad laboral presentes en la población trabajadora',
                formula: '((Casos Nuevos + Antiguos EL) / Promedio trabajadores) × 100.000',
                valor: (((aggregated.casosNuevosEL + aggregated.casosAntiguosEL) / safeWorkers) * kEL).toFixed(2),
                interpretacion: `Por cada 100.000 trabajadores existen ${(((aggregated.casosNuevosEL + aggregated.casosAntiguosEL) / safeWorkers) * kEL).toFixed(2)} casos de enfermedad laboral`,
                periodicidad: 'Anual'
            },
            {
                id: 'incidencia',
                nombre: 'Incidencia de la Enfermedad Laboral',
                definicion: 'Casos nuevos de enfermedad laboral diagnosticados en el periodo',
                formula: '(Casos Nuevos EL / Promedio trabajadores) × 100.000',
                valor: ((aggregated.casosNuevosEL / safeWorkers) * kEL).toFixed(2),
                interpretacion: `Por cada 100.000 trabajadores se diagnosticaron ${((aggregated.casosNuevosEL / safeWorkers) * kEL).toFixed(2)} casos nuevos`,
                periodicidad: 'Anual'
            },
            {
                id: 'ausentismo_medico',
                nombre: 'Ausentismo por Causa Médica (Res. 0312 / NTC 3793)',
                definicion: 'Porcentaje de tiempo de trabajo programado perdido por incapacidades médicas (AT, EL y Enfermedad Común)',
                formula: '(Días Ausencia Médica / Días Programados) × 100',
                valor: aggregated.diasProgramados > 0 ? ((aggregated.diasAusenciaMedicaTotal / aggregated.diasProgramados) * 100).toFixed(2) : '0.00',
                interpretacion: `Se perdió el ${aggregated.diasProgramados > 0 ? ((aggregated.diasAusenciaMedicaTotal / aggregated.diasProgramados) * 100).toFixed(2) : '0'}% de las jornadas programadas por incapacidades médicas`,
                periodicidad: 'Mensual'
            },
            {
                id: 'ausentismo_global',
                nombre: 'Tasa Global de Ausentismo Organizacional (Todos los Motivos)',
                definicion: 'Porcentaje de tiempo total no laborado sobre jornadas programadas (incluye licencias, permisos y no justificadas)',
                formula: '(Días Ausencia Total / Días Programados) × 100',
                valor: aggregated.diasProgramados > 0 ? ((aggregated.diasAusenciaTotal / aggregated.diasProgramados) * 100).toFixed(2) : '0.00',
                interpretacion: `El ausentismo global representó un ${aggregated.diasProgramados > 0 ? ((aggregated.diasAusenciaTotal / aggregated.diasProgramados) * 100).toFixed(2) : '0'}% de afectación operativa total`,
                periodicidad: 'Mensual'
            }
        ];

        // ─── 3. Qualitative Data Preparation ───────────────────────────
        const eventsSummary = aggregated.allEvents.map(e => {
            const nom = e.colaborador?.nombre ? `Colaborador: ${e.colaborador.nombre} (${e.colaborador.cargo || 'Cargo N/A'}), IBC: $${Number(e.colaborador.ibcMensual || 0).toLocaleString('es-CO')}` : '';
            const cie = e.diagnosticoCIE10 ? `[CIE-10: ${e.diagnosticoCIE10}]` : '';
            const finStr = e.financiero?.perdidaNetaEmpresa ? `Pérdida Neta: $${Number(e.financiero.perdidaNetaEmpresa).toLocaleString('es-CO')}` : '';
            return `- [${e.tipo}] Fecha: ${e.fecha} | Días: ${e.diasIncapacidad} | Causa: "${e.causaInmediata || 'N/A'}" | Peligro: "${e.peligro || 'N/A'}" ${cie} | ${nom} | ${finStr}`;
        }).join('\n');

        // Fetch structured company info for the header
        let companyName = 'EMPRESA';
        let companyNit = 'NIT';
        let companyContext = '';
        let ci = null;
        try {
            ci = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean()
              || await CompanyInfo.findOne({ user: req.user.id }).lean();
            if (ci) {
                companyName = ci.companyName || 'EMPRESA';
                companyNit = ci.nit || 'NIT';
                companyContext = buildCompanyContextString(ci);
            }
        } catch (err) { }

        // Custom Header HTML (Standardized)
        const reportDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
        const reportPeriod = scope === 'ANNUAL' ? `Año ${year} (Acumulado)` : `${monthName} ${year}`;

        const headerHTML = buildStandardHeader({
            title: `GESTIÓN INTEGRAL DE AUSENTISMO, ATEL & COSTOS LABORALES — INFORME GERENCIAL (${scope === 'ANNUAL' ? 'ANUAL' : 'MENSUAL'})`,
            companyInfo: { companyName: companyName, nit: companyNit },
            date: reportDate,
            norm: `Res. 0312 de 2019 Art. 30 · NTC 3793 · CST · Factor Financiero IBC | Periodo: ${reportPeriod}`,
        });

        // ─── 4. Build Prompt ───────────────────────────────────────────
        const periodLabel = scope === 'ANNUAL' ? `Acumulado Año ${year} (hasta ${monthName})` : `Mes: ${monthName} ${year}`;
        
        let monthlyAnalysisHtml = '';
        if (scope === 'ANNUAL') {
            monthlyAnalysisHtml += `\n**ANÁLISIS MENSUAL DETALLADO MÚLTIPLE (REQUISITO CRÍTICO):**\n`;
            monthlyAnalysisHtml += `Como es un informe ANUAL acumulado, DEBES analizar TODOS y cada uno de los meses uno por uno y hacer un respectivo análisis antes de arrojar los indicadores totales. Estos son los datos mes a mes:\n`;
            monthsIndices.forEach(idx => {
                if (idx > targetRealIndex) return;
                const mData = safeAnnualData[idx];
                if (!mData) return;
                const w = Number(mData.numTrabajadores);
                const mEvents = mData.events || [];
                if (w > 0 || mEvents.length > 0) {
                    monthlyAnalysisHtml += `- **Mes de ${MONTHS[idx]}:** ${w} trabajadores. ${mEvents.length} eventos (AT: ${mEvents.filter(e=>e.tipo==='AT').length}, EL: ${mEvents.filter(e=>e.tipo==='EL').length}, Enfermedad General: ${mEvents.filter(e=>['EG_EPS', 'Ausentismo', 'ACC_COMUN'].includes(e.tipo)).length}, Licencias/Permisos: ${mEvents.filter(e=>!['AT', 'EL', 'EG_EPS', 'Ausentismo', 'ACC_COMUN'].includes(e.tipo)).length}).`;
                    if (mEvents.length > 0) {
                        monthlyAnalysisHtml += ` Detalle de eventos: ${mEvents.map(e => `[${e.tipo} | Causa: ${e.causaInmediata} | Días: ${e.diasIncapacidad}]`).join(', ')}`;
                    } else {
                        monthlyAnalysisHtml += ` Sin reportes de eventualidades médicas o de siniestralidad.`;
                    }
                    monthlyAnalysisHtml += `\n`;
                }
            });
            monthlyAnalysisHtml += `Crea una sección OBLIGATORIA llamada "Evolución Mensual" donde relates y analices el comportamiento mes tras mes exhaustivamente.\n`;
        }

        const promptText = `
Eres un Experto Consultor en Seguridad y Salud en el Trabajo (SGSST), Abogado Laboral y Economista Organizacional de Alto Nivel.
Actúas como Auditor Líder y Gerente Estratégico generando el informe oficial:
**GESTIÓN INTEGRAL DE AUSENTISMO, SINIESTRALIDAD ATEL & PÉRDIDAS FINANCIERAS POR IBC**.

**OBJETIVO:** Generar un documento HTML INMENSO, exhaustivo, profesional, con rigor jurídico-financiero y altamente estilizado para la Junta Directiva y la Alta Gerencia.

**CONTEXTO DEL INFORME:**
- **Periodo Analizado:** ${periodLabel}
- **Empresa:** ${companyName} (NIT: ${companyNit})
- **Autor/Responsable:** ${userName || 'Consultor Estratégico SST y Gestión del Talento'}

${companyContext}

**DATOS CONSOLIDADOS:**
- Muestra Promedio de Trabajadores: ${avgWorkers.toFixed(1)}
- Total Accidentes de Trabajo (AT): ${aggregated.numAT} (Mortales: ${aggregated.numATMortales})
- Total Casos Nuevos Enfermedad Laboral (EL): ${aggregated.casosNuevosEL}
- Total Eventos de Origen Común (EPS / Accidente Común): ${aggregated.numEventosMedicosComunes}
- Total Licencias de Ley (Maternidad, Paternidad, Luto, Calamidad): ${aggregated.numLicenciasLegales}
- Total Permisos, Sanciones y No Justificadas: ${aggregated.numPermisosYSanciones + aggregated.numAusenciasInjustificadas}
- Días Perdidos por AT: ${aggregated.diasIncapacidadAT} (Días cargados: ${aggregated.diasCargados})
- Días Ausencia por Enfermedad Común: ${aggregated.diasAusenciaMedicaComun}
- Días Totales Perdidos en la Organización: ${aggregated.diasAusenciaTotal}

**BALANCE FINANCIERO CONSOLIDADO (PÉRDIDAS POR IBC EN PESOS COLOMBIANOS - COP):**
- Salarios Directos Asumidos por Empresa (Días 1 y 2 + Brechas salariales): **$${aggregated.finanzas.costoSalarioDirectoEmpresa.toLocaleString('es-CO')} COP**
- Seguridad Social Patronal Pagada por Empresa (Pensión/Salud en EPS): **$${aggregated.finanzas.costoSeguridadSocialEmpresa.toLocaleString('es-CO')} COP**
- Ahorro de Seguridad Social asumido por ARL (*Ley 776/2002 Art. 3*): **$${aggregated.finanzas.costoSeguridadSocialCubiertoARL.toLocaleString('es-CO')} COP** (Beneficio por cobertura ARL)
- Pasivo Prestacional Causado durante Ausencias (Cesantías, Prima, Vacaciones): **$${aggregated.finanzas.costoPrestacionalCausado.toLocaleString('es-CO')} COP**
- Costos de Sustitución y Horas Extras: **$${aggregated.finanzas.costoReemplazoTurnos.toLocaleString('es-CO')} COP**
- Costos Ocultos e Indirectos Estimados (Iceberg Heinrich/Simonds): **$${aggregated.finanzas.costoIndirectoIceberg.toLocaleString('es-CO')} COP**
- Subsidios Radicados / a Recobrar ante EPS: **$${aggregated.finanzas.montoRecobroEPS.toLocaleString('es-CO')} COP**
- Subsidios a Recobrar ante ARL (100% IBC): **$${aggregated.finanzas.montoRecobroARL.toLocaleString('es-CO')} COP**
- **PÉRDIDA FINANCIERA NETA TOTAL ASUMIDA POR LA EMPRESA:** **$${aggregated.finanzas.perdidaNetaTotalEmpresa.toLocaleString('es-CO')} COP**

${monthlyAnalysisHtml}

**INDICADORES NORMATIVOS CALCULADOS (Res. 0312 Art. 30 & NTC 3793):**
${indicators.map(i => `- ${i.nombre}: **${i.valor}**
  * Definición: ${i.definicion}
  * Fórmula: ${i.formula}
  * Interpretación: ${i.interpretacion}`).join('\n')}

**COMPORTAMIENTO DETALLADO DE EVENTOS REGISTRADOS:**
${eventsSummary || 'Sin eventos registrados. Felicitar la gestión preventiva pero advertir sobre el subregistro de incapacidades o permisos informales.'}

**INSTRUCCIONES DE DISEÑO HTML Y ORGANIZACIÓN DEL CONTENIDO:**
Genera SOLAMENTE código HTML (dentro de un <div> contenedor) para ser insertado. NADA MÁS. NO Markdown, SOLO HTML PURO con CSS inline limpio.
Aplica \`font-family: inherit\`. Para cada contenedor con \`background-color\` clara, fuerza \`color: #000;\`. Si usas fondo oscuro, fuerza \`color: #fff;\`.
Diseña tarjetas KPI de balance financiero con bordes de color, tablas con estilo corporativo y simulación de barras porcentuales.

**CONTENIDO EXIGIDO:**
1. **RESUMEN EJECUTIVO Y DIAGNÓSTICO FINANCIERO:**
   - Análisis del costo del ausentismo frente al flujo de caja y rentabilidad de la empresa.
2. **TABLERO DE INDICADORES NORMATIVOS ATEL (RES. 0312 ART. 30):**
   - Tarjetas para Frecuencia, Severidad, Mortalidad, Prevalencia, Incidencia y Ausentismo Médico.
3. **BALANZA FINANCIERA Y GESTIÓN DE RECOBROS (EPS vs ARL):**
   - Explicar detalladamente la diferencia del manejo de incapacidades en Colombia: Por qué la ARL asume el 100% del subsidio y las cotizaciones a Salud y Pensión (Ley 776/2002 Art. 3), mientras que en la EPS la empresa asume días 1 y 2, aportes patronales y brechas salariales.
   - Estado de la cartera de recobros y alertas de prescripción legal (3 años).
4. **RADIOGRAFÍA DEL AUSENTISMO (NTC 3793 Y CÓDIGO SUSTANTIVO DEL TRABAJO):**
   - Discriminación por Cuadrantes: Salud (AT, EL, EPS), Licencias de Ley (Luto, Maternidad, Calamidad), Permisos/Sanciones y Faltas Injustificadas.
5. **MODELO DEL ICEBERG DE COSTOS OCULTOS (HEINRICH & SIMONDS):**
   - Comparación gráfica entre la punta del iceberg (costos directos salariales) y la masa sumergida (productividad perdida, trámites, sobrecarga en compañeros).
6. **PLAN DE CHOQUE, INTERVENCIÓN Y RETORNO DE INVERSIÓN (ROI):**
   - Matriz de acciones correctivas Técnicas, Administrativas y de Bienestar con cálculo estimado de ahorro en ausentismo.

**REGLA DE FIRMAS:** Omite absolutamente cualquier campo de firma o líneas "__". El sistema maneja las firmas institucionales automáticamente.
`;

        // ─── 5. Generation ─────────────────────────────────────────────
        const personalization = req.user?.personalization?.geminiModels;
        const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();
        const finalModelName = modelName || preferredModel;
                let result = await generateWithKeyRotation({ model: finalModelName }, req.user?.id || req.user, promptText);
        const text = result.response.text();

        let cleanedReport = cleanHtmlOutput(text);

        // Prepend the standard header automatically to avoid recitation block issues on Gemini
        cleanedReport = headerHTML + '\n' + cleanedReport;

        if (ci) {
            cleanedReport += buildSignatureSection(ci);
        }

        res.json({ report: cleanedReport });

    } catch (error) {
        logger.error('[SGSST Estadísticas] Error:', error);
        res.status(500).json({ error: `Error: ${error.message}` });
    }
});

/**
 * GET /api/sgsst/estadisticas/mood
 * Fetches anonymized mood telemetry for the user's active company.
 */
router.get('/mood', requireJwtAuth, async (req, res) => {
    try {
        const company = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean()
            || await CompanyInfo.findOne({ user: req.user.id }).lean();
        
        if (!company) {
            return res.json([]);
        }

        const MoodTelemetry = require('~/models/MoodTelemetry');
        const telemetryData = await MoodTelemetry.find({ companyId: company._id }).sort({ createdAt: -1 }).lean();

        const stressorNames = {
            sobrecarga: 'Sobrecarga de trabajo',
            liderazgo: 'Clima laboral / Relaciones interpersonales',
            entorno: 'Entorno físico / Herramientas inadecuadas',
            personal: 'Asuntos personales o familiares',
            funciones: 'Falta de claridad en funciones y rol',
            fatiga: 'Fatiga física o agotamiento mental',
        };

        const getTailoredRecs = (stressors = [], department = '') => {
            const areaText = department ? ` en el área de ${department}` : '';
            const recs = [];
            if (stressors.includes('sobrecarga')) recs.push(`Evaluar volumen de tareas y redistribuir cargas de trabajo operativas${areaText}`);
            if (stressors.includes('liderazgo')) recs.push(`Fomentar canales de comunicación abierta y espacios de retroalimentación empática con líderes`);
            if (stressors.includes('entorno')) recs.push(`Revisar condiciones ergonómicas del puesto y disponibilidad de herramientas de trabajo${areaText}`);
            if (stressors.includes('personal')) recs.push(`Facilitar acceso a programas de bienestar emocional y opciones de flexibilidad horaria`);
            if (stressors.includes('funciones')) recs.push(`Clarificar alcance de responsabilidades, roles y metas de desempeño${areaText}`);
            if (stressors.includes('fatiga')) recs.push(`Promover pausas activas sistemáticas y respeto a los tiempos de desconexión laboral efectiva`);
            if (recs.length === 0) recs.push(`Monitorear periódicamente factores de riesgo psicosocial y fomentar pausas activas${areaText}`);
            return recs.slice(0, 2).join('. ') + '.';
        };

        const sanitizedData = telemetryData.map((d) => {
            let raw = d.details || '';
            const isRawChat =
                raw.includes('Conversación con el Terapeuta') ||
                raw.includes('Conversación anónima completada') ||
                raw.includes('Trabajador:') ||
                raw.includes('Terapeuta:');

            if (isRawChat) {
                const labels = (d.stressors || []).map((s) => stressorNames[s] || s);
                const factorsText = labels.length > 0 ? labels.join(', ') : 'Sobrecarga y ritmo laboral';
                const recommendation = getTailoredRecs(d.stressors, d.department);

                const cleanDetails =
                    `📋 Caso de Seguimiento SG-SST (Confidencial):\n` +
                    `• Factores de Riesgo Laboral: ${factorsText}.\n` +
                    `• Recomendación de Intervención: ${recommendation}\n` +
                    `• Orientación Brindada: El colaborador completó una sesión privada de orientación emocional con el Terapeuta en Salud Mental.`;

                MoodTelemetry.updateOne({ _id: d._id }, { $set: { details: cleanDetails } }).catch(() => {});
                return { ...d, details: cleanDetails };
            }

            if (raw.includes('• Recomendación de Intervención SST:')) {
                const fixedDetails = raw.replace(/• Recomendación de Intervención SST:/g, '• Recomendación de Intervención:');
                MoodTelemetry.updateOne({ _id: d._id }, { $set: { details: fixedDetails } }).catch(() => {});
                return { ...d, details: fixedDetails };
            }

            return d;
        });

        return res.json(sanitizedData);
    } catch (error) {
        logger.error('[SGSST Estadísticas] Mood telemetry fetch error:', error);
        res.status(500).json({ error: 'Error interno al consultar la telemetría psicosocial.' });
    }
});

/**
 * DELETE /api/sgsst/estadisticas/mood/:id
 * Deletes an individual mood telemetry record belonging to the user's active company.
 */
router.delete('/mood/:id', requireJwtAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const company = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean()
            || await CompanyInfo.findOne({ user: req.user.id }).lean();

        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada.' });
        }

        const MoodTelemetry = require('~/models/MoodTelemetry');
        const deleted = await MoodTelemetry.findOneAndDelete({ _id: id, companyId: company._id });

        if (!deleted) {
            return res.status(404).json({ error: 'Registro no encontrado o no pertenece a su empresa.' });
        }

        return res.json({ success: true, message: 'Registro eliminado exitosamente.' });
    } catch (error) {
        logger.error('[SGSST Estadísticas] Delete mood telemetry error:', error);
        res.status(500).json({ error: 'Error interno al eliminar el registro.' });
    }
});

/**
 * DELETE /api/sgsst/estadisticas/mood
 * Clears all mood telemetry records for the user's active company.
 */
router.delete('/mood', requireJwtAuth, async (req, res) => {
    try {
        const company = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean()
            || await CompanyInfo.findOne({ user: req.user.id }).lean();

        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada.' });
        }

        const MoodTelemetry = require('~/models/MoodTelemetry');
        const result = await MoodTelemetry.deleteMany({ companyId: company._id });

        return res.json({ 
            success: true, 
            message: `Se eliminaron ${result.deletedCount} registros exitosamente.`,
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        logger.error('[SGSST Estadísticas] Clear mood telemetry error:', error);
        res.status(500).json({ error: 'Error interno al vaciar los registros.' });
    }
});

// Helpers
function cleanHtmlOutput(text) {
    return text.replace(/```html\n?/g, '').replace(/```\n?/g, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
        .replace(/<head>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
        .trim();
}

module.exports = router;
