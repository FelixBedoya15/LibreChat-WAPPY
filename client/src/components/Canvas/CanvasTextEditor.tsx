import React, { useRef, useEffect, useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  PenTool, 
  CheckSquare, 
  ListTodo, 
  AlertTriangle, 
  Plus, 
  Trash2,
  Layers,
  ChevronDown,
  Scale,
  Heart,
  ShieldAlert,
  Link2
} from 'lucide-react';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import { ritTemplateTradicional } from './rit_template_tradicional';
import { ritTemplateHumanista } from './rit_template_humanista';
import CanvasWorkspaceBridge from './CanvasWorkspaceBridge';

interface CanvasTextEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
  reportSourceData?: any;
  isMaximized?: boolean;
}

// Helper to inject a signature block template inside standard templates
const DEFAULT_SIGNATURE_BLOCK = `
<div style="margin-top:60px; page-break-inside:avoid;">
  <table style="width:100%; border-collapse:collapse;">
    <tr>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #333; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">RESPONSABLE SST</p>
        <p style="font-size:11px; margin:0; color:#64748b;">Firma y Sello</p>
      </td>
      <td style="width:4%;"></td>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #333; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">REPRESENTANTE LEGAL</p>
        <p style="font-size:11px; margin:0; color:#64748b;">Firma y Sello</p>
      </td>
    </tr>
  </table>
</div>`;

// Corporate SST Templates in Spanish
const TEMPLATES = [
  {
    id: 'politica_sst',
    title: 'Política de SST',
    description: 'Compromisos oficiales y alta dirección (Decreto 1072)',
    icon: <FileText className="h-4 w-4 text-teal-500" />,
    html: `
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <div style="background-color: #0f766e; color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">POLÍTICA DE SEGURIDAD Y SALUD EN EL TRABAJO</h1>
          <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9; text-transform: uppercase; font-weight: 600;">Sistema de Gestión de SST (Decreto 1072)</p>
        </div>
        <p>En nuestra empresa, nos comprometemos con la protección y promoción de la salud de los trabajadores, procurando su integridad física mediante la gestión de los riesgos laborales en todos los centros de trabajo de la organización.</p>
        
        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 18px; font-weight: 700; margin-top: 24px;">1. Compromisos de la Alta Dirección</h3>
        <ul style="padding-left: 20px; margin-bottom: 20px; list-style-type: square;">
          <li style="margin-bottom: 8px;"><strong>Identificar y evaluar</strong> de manera continua todos los peligros y riesgos presentes en las áreas de trabajo.</li>
          <li style="margin-bottom: 8px;"><strong>Proteger la seguridad y salud</strong> de todos los colaboradores mediante la mejora continua del SG-SST.</li>
          <li style="margin-bottom: 8px;"><strong>Cumplir la normatividad legal</strong> nacional vigente aplicable en materia de riesgos laborales.</li>
          <li style="margin-bottom: 8px;"><strong>Asignar recursos humanos, financieros y técnicos</strong> requeridos para el diseño y ejecución del plan anual.</li>
        </ul>
        
        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 18px; font-weight: 700; margin-top: 24px;">2. Firmas y Vigencia</h3>
        <p>Esta política tiene alcance sobre todos los trabajadores (independientemente de su forma de vinculación) y contratistas de la organización, y entra en vigencia a partir de su firma.</p>
        ${DEFAULT_SIGNATURE_BLOCK}
      </div>
    `.trim()
  },
  {
    id: 'copasst',
    title: 'Acta del COPASST',
    description: 'Constitución oficial de delegados y actas de comités',
    icon: <PenTool className="h-4 w-4 text-emerald-500" />,
    html: `
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <div style="background-color: #0d9488; color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">ACTA DE CONSTITUCIÓN DEL COMITÉ PARITARIO DE SST</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">COPASST - Período Vigente</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">Empresa / Razón Social:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">WAPPY SAS</td>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">Fecha de Reunión:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">${new Date().toLocaleDateString('es-ES')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Ciudad / Lugar:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">Bogotá D.C. / Sala de Juntas</td>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Número de Acta:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">Acta No. 001</td>
          </tr>
        </table>
        
        <h3 style="color: #0d9488; font-size: 16px; font-weight: 700; margin-top: 20px;">1. Representantes del Empleador y Trabajadores</h3>
        <p>Reunidos los miembros de la empresa, se procede a formalizar la elección de los delegados para conformar el COPASST:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Representantes del Empleador</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Representantes de los Trabajadores</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">1. Principal: Juan Carlos Pérez<br/>2. Suplente: Andrea González</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">1. Principal: Laura María Restrepo<br/>2. Suplente: Javier Alexander Silva</td>
            </tr>
          </tbody>
        </table>
        
        <h3 style="color: #0d9488; font-size: 16px; font-weight: 700; margin-top: 20px;">2. Funciones y Compromisos del Comité</h3>
        <ul style="padding-left: 20px; list-style-type: circle;">
          <li style="margin-bottom: 6px;">Proponer medidas y el desarrollo de actividades encaminadas a mantener la salud física y mental en los lugares de trabajo.</li>
          <li style="margin-bottom: 6px;">Participar activamente en la investigación de incidentes, accidentes de trabajo y enfermedades laborales.</li>
          <li style="margin-bottom: 6px;">Realizar inspecciones periódicas a los puestos, instalaciones y EPPs de los colaboradores.</li>
        </ul>
        ${DEFAULT_SIGNATURE_BLOCK}
      </div>
    `.trim()
  },
  {
    id: 'guia_induccion',
    title: 'Guía de Inducción',
    description: 'Onboarding y normas de prevención para nuevos ingresos',
    icon: <BookOpen className="h-4 w-4 text-sky-500" />,
    html: `
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <div style="background-color: #0284c7; color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">GUÍA DE INDUCCIÓN GENERAL EN SST</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Proceso de Onboarding y Seguridad del Colaborador</p>
        </div>
        <p><strong>Estimado Colaborador:</strong> ¡Bienvenido a nuestra organización! Esta guía tiene como finalidad informarte sobre los peligros básicos a los que puedes estar expuesto, las normas preventivas y tus responsabilidades para preservar la seguridad de todos.</p>
        
        <h3 style="color: #0284c7; font-size: 17px; font-weight: 700; margin-top: 20px;">1. Deberes Fundamentales del Trabajador (Decreto 1072)</h3>
        <ol style="padding-left: 20px; margin-bottom: 20px;">
          <li style="margin-bottom: 6px;"><strong>Procurar el cuidado integral</strong> de su salud.</li>
          <li style="margin-bottom: 6px;"><strong>Suministrar información clara y veraz</strong> sobre su estado de salud general.</li>
          <li style="margin-bottom: 6px;"><strong>Cumplir con las normas, reglamentos</strong> e instrucciones del SG-SST.</li>
          <li style="margin-bottom: 6px;"><strong>Informar oportunamente</strong> al empleador acerca de los peligros y condiciones de riesgo que detecte.</li>
        </ol>
        
        <h3 style="color: #0284c7; font-size: 17px; font-weight: 700; margin-top: 20px;">2. Reporte de Accidentes e Incidentes</h3>
        <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #0369a1;"><strong>¡IMPORTANTE!</strong> Todo incidente o accidente laboral debe ser reportado de manera <strong>inmediata</strong> (plazo máximo de 24 horas) a tu jefe directo y al responsable del SG-SST de la organización.</p>
        </div>
        ${DEFAULT_SIGNATURE_BLOCK}
      </div>
    `.trim()
  },
  {
    id: 'inspeccion_planeada',
    title: 'Inspección de Seguridad',
    description: 'Lista de chequeo para orden, aseo e instalaciones',
    icon: <CheckSquare className="h-4 w-4 text-indigo-500" />,
    html: `
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <div style="background-color: #4f46e5; color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">FORMATO DE INSPECCIÓN DE SEGURIDAD GENERAL</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Orden, Aseo e Instalaciones Físicas</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #e2e8f0;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0; width: 20%;">Inspector:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; width: 30%;">Responsable SST / COPASST</td>
            <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0; width: 20%;">Área Evaluada:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; width: 30%;">Oficinas y Planta General</td>
          </tr>
        </table>
        
        <h3 style="color: #4f46e5; font-size: 16px; font-weight: 700; margin-top: 20px; margin-bottom: 10px;">Lista de Chequeo Evaluativa</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 50%;">Aspecto a Evaluar</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 15%; text-align: center;">Cumple (SÍ/NO)</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 35%;">Observaciones / Hallazgos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">1. Extintores vigentes, cargados y despejados de obstáculos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Inspección al día. Rotulación correcta.</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">2. Salidas de emergencia y rutas de evacuación libres de bloqueos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Demarcación fotoluminiscente en buen estado.</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">3. Botiquines dotados con elementos vigentes según normativa.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #dc2626;">NO</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Falta gasa estéril y suero fisiológico en botiquín Piso 2.</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">4. Pisos limpios, secos, sin riesgo de caídas o resbalones.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Orden y aseo general satisfactorio.</td>
            </tr>
          </tbody>
        </table>
        ${DEFAULT_SIGNATURE_BLOCK}
      </div>
    `.trim()
  },
  {
    id: 'analisis_riesgo_ats',
    title: 'Análisis de Riesgo (ATS)',
    description: 'Control de peligros y autorizaciones por tarea',
    icon: <ListTodo className="h-4 w-4 text-orange-500" />,
    html: `
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <div style="background-color: #ea580c; color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">ANÁLISIS DE TRABAJO SEGURO (ATS)</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Identificación y Control de Peligros por Tarea</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #e2e8f0;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">Actividad a Realizar:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; width: 75%;">Trabajos de Mantenimiento Eléctrico en Alturas</td>
          </tr>
        </table>
        
        <h3 style="color: #ea580c; font-size: 16px; font-weight: 700; margin-top: 20px; margin-bottom: 10px;">1. Pasos de la Tarea y Controles</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 30%;">Pasos Detallados</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 35%;">Peligros Identificados</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 35%;">Medidas de Control Requeridas</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">1. Alistamiento de herramientas y EPPs.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Pérdida de control, caídas de herramientas al suelo.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Uso de portaherramientas, inspección preoperacional de arnés y eslingas.</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">2. Ascenso por escalera o andamio.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Caídas a diferente nivel, colapso de estructura.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Uso de eslinga en Y con absorbedor, línea de vida y puntos de anclaje certificados.</td>
            </tr>
          </tbody>
        </table>
        ${DEFAULT_SIGNATURE_BLOCK}
      </div>
    `.trim()
  },
  {
    id: 'rit_tradicional',
    title: 'RIT - Modelo Tradicional',
    description: 'Reglamento Interno de Trabajo con enfoque legal estricto y de autoridad',
    icon: <Scale className="h-4 w-4 text-slate-500" />,
    html: ritTemplateTradicional
  },
  {
    id: 'rit_humanista',
    title: 'RIT - Modelo Humanista',
    description: 'Reglamento de convivencia enfocado en bio-individualidad, salud mental y bienestar',
    icon: <Heart className="h-4 w-4 text-rose-500" />,
    html: ritTemplateHumanista
  },
  {
    id: 'plan_emergencias',
    title: 'Plan de Emergencias',
    description: 'Plan de prevención, preparación y respuesta ante emergencias (Decreto 1072)',
    icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
    html: `
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <div style="background-color: #be123c; color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">PLAN DE PREPARACIÓN ANTE EMERGENCIAS</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; font-weight: 600;">Protocolo y Estructura Organizativa de Emergencia</p>
          <p style="margin: 2px 0 0; font-size: 11px; opacity: 0.7;">SG-SST Decreto 1072 de 2015</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #fca5a5; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: #fef2f2;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #fca5a5; width: 25%;">Punto de Encuentro:</td>
            <td style="padding: 10px; border: 1px solid #fca5a5; width: 25%; font-weight: bold; color: #be123c;">Parque Principal / Zona Verde Norte</td>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #fca5a5; width: 25%;">Líder de Brigada:</td>
            <td style="padding: 10px; border: 1px solid #fca5a5; width: 25%;">Coordinador de Emergencias</td>
          </tr>
        </table>

        <h3 style="color: #be123c; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. Estructura de la Brigada de Emergencia</h3>
        <p>La Brigada de Emergencia de la empresa está conformada por personal voluntario capacitado y organizado en tres grupos clave:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <thead>
            <tr style="background-color: #fdf2f8; color: #be123c; font-weight: bold; text-align: left;">
              <th style="padding: 8px; border: 1px solid #fbcfe8; width: 30%;">Grupo de Brigada</th>
              <th style="padding: 8px; border: 1px solid #fbcfe8; width: 40%;">Responsabilidades Clave</th>
              <th style="padding: 8px; border: 1px solid #fbcfe8; width: 30%;">Miembros Designados</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #fbcfe8; font-weight: bold; color: #be123c;">Evacuación y Rescate</td>
              <td style="padding: 8px; border: 1px solid #fbcfe8;">Guiar la salida de los colaboradores hacia el punto de encuentro, verificar el conteo de personas.</td>
              <td style="padding: 8px; border: 1px solid #fbcfe8;">Diana Patricia Morales / Oscar Torres</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #fbcfe8; font-weight: bold; color: #be123c;">Primeros Auxilios</td>
              <td style="padding: 8px; border: 1px solid #fbcfe8;">Prestar valoración y primeros auxilios básicos a lesionados en el área de clasificación (Triage).</td>
              <td style="padding: 8px; border: 1px solid #fbcfe8;">Liceth Andrea Ruiz / Dr. Andrés Gómez</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #fbcfe8; font-weight: bold; color: #be123c;">Prevención e Incendios</td>
              <td style="padding: 8px; border: 1px solid #fbcfe8;">Controlar conatos de incendio mediante el uso de extintores portátiles y control de servicios públicos.</td>
              <td style="padding: 8px; border: 1px solid #fbcfe8;">Carlos Mario Ochoa / José Pérez</td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #be123c; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. Directorio de Apoyo Externo</h3>
        <ul style="padding-left: 20px; margin-bottom: 20px; list-style-type: square; font-size: 13px;">
          <li><strong>Línea Única de Emergencias:</strong> 123 (Nacional)</li>
          <li><strong>Bomberos Oficiales:</strong> 119</li>
          <li><strong>Cruz Roja Colombiana:</strong> 132</li>
          <li><strong>Defensa Civil:</strong> 144</li>
          <li><strong>Administradora de Riesgos Laborales (ARL):</strong> Línea de Atención de Urgencias 24h</li>
        </ul>

        <h3 style="color: #be123c; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. Protocolo de Evacuación (Pasos a Seguir)</h3>
        <ol style="padding-left: 20px; margin-bottom: 20px; font-size: 13px;">
          <li style="margin-bottom: 8px;"><strong>Conservar la calma:</strong> No corra, no grite y evite generar pánico en sus compañeros.</li>
          <li style="margin-bottom: 8px;"><strong>Interrumpir labores:</strong> Apagar equipos, cerrar llaves de paso o desconectar fuentes de energía si es seguro.</li>
          <li style="margin-bottom: 8px;"><strong>Evacuar ordenadamente:</strong> Siga la ruta demarcada fotoluminiscente. No se devuelva por objetos personales.</li>
          <li style="margin-bottom: 8px;"><strong>Ubicarse en el Punto de Encuentro:</strong> Permanezca agrupado con su área y reporte su presencia al coordinador de evacuación.</li>
        </ol>

        <div style="background-color: #fef2f2; border-left: 4px solid #be123c; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #9f1239;"><strong>🚨 ¡AVISO DE SIMULACRO!</strong> La organización realiza de forma obligatoria mínimo un (1) simulacro general de evacuación al año para evaluar los tiempos de respuesta y capacitar al personal.</p>
        </div>

        ${DEFAULT_SIGNATURE_BLOCK}
      </div>
    `.trim()
  }
];

// Corporate Quick Blocks to inject in active caret position
const INLAYS = [
  {
    id: 'inlay_signatures',
    title: 'Bloque de Firmas SST',
    description: 'Inyectar firmas de Líder SST y Representante de Trabajadores',
    icon: <PenTool className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />,
    html: `
      <div style="margin-top:50px; page-break-inside:avoid; font-family: sans-serif;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="width:48%; text-align:center; padding:8px;">
              <div class="signature-placeholder" style="border-bottom:2px solid #0f766e; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                <span style="font-size:11px; opacity:0.6; color:#0f766e;">Clic para firmar</span>
              </div>
              <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">LÍDER / COORD. SST</p>
              <p style="font-size:11px; margin:0; color:#64748b;">Firma y Cédula</p>
            </td>
            <td style="width:4%;"></td>
            <td style="width:48%; text-align:center; padding:8px;">
              <div class="signature-placeholder" style="border-bottom:2px solid #0f766e; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                <span style="font-size:11px; opacity:0.6; color:#0f766e;">Clic para firmar</span>
              </div>
              <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">REPRESENTANTE DE TRABAJADORES</p>
              <p style="font-size:11px; margin:0; color:#64748b;">Firma y Cédula</p>
            </td>
          </tr>
        </table>
      </div>
    `.trim()
  },
  {
    id: 'inlay_alert_card',
    title: 'Banderola de Alerta',
    description: 'Inyectar un recuadro llamativo de advertencia de peligro',
    icon: <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />,
    html: `
      <div style="background-color: #fffbeb; border-left: 5px solid #f59e0b; padding: 16px; border-radius: 0 12px 12px 0; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: sans-serif;">
        <h4 style="margin: 0 0 4px 0; color: #b45309; font-size: 15px; font-weight: 700;">🚨 ALERTA DE RIESGO DETECTADO</h4>
        <p style="margin: 0; color: #78350f; font-size: 13px;">Se ha identificado una condición subestándar en las instalaciones físicas. Tome medidas de contención de inmediato y proceda con el aislamiento y señalización del área.</p>
      </div>
    `.trim()
  },
  {
    id: 'inlay_action_table',
    title: 'Tabla Plan de Acción',
    description: 'Inyectar tabla estilizada para el seguimiento de actividades',
    icon: <ListTodo className="h-4.5 w-4.5 text-indigo-500" />,
    html: `
      <div style="overflow-x: auto; margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); font-family: sans-serif;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #0f766e; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 12px; border-bottom: 2px solid #0f766e; color: #ffffff;">Acción Preventiva / Correctiva</th>
              <th style="padding: 12px; border-bottom: 2px solid #0f766e; width: 25%; color: #ffffff;">Responsable</th>
              <th style="padding: 12px; border-bottom: 2px solid #0f766e; width: 20%; color: #ffffff;">Fecha Límite</th>
              <th style="padding: 12px; border-bottom: 2px solid #0f766e; width: 15%; text-align: center; color: #ffffff;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: 600;">Comprar y reponer insumos vencidos de botiquines</td>
              <td style="padding: 12px; color: #475569;">Coordinador de Compras</td>
              <td style="padding: 12px; color: #475569;">2026-05-30</td>
              <td style="padding: 12px; text-align: center;"><span style="background-color: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;">Pendiente</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 12px; font-weight: 600;">Realizar simulacro de evacuación anual</td>
              <td style="padding: 12px; color: #475569;">Brigada de Emergencia</td>
              <td style="padding: 12px; color: #475569;">2026-06-15</td>
              <td style="padding: 12px; text-align: center;"><span style="background-color: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;">Planificado</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `.trim()
  }
];

const CanvasTextEditor: React.FC<CanvasTextEditorProps> = ({ initialContent, onUpdate, reportSourceData, isMaximized }) => {
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'inlays'>('templates');
  const [isBridgeOpen, setIsBridgeOpen] = useState<boolean>(false);

  const handleImportTable = (html: string) => {
    if (liveEditorRef.current) {
      // Trigger HTML injection in the WYSIWYG editor
      liveEditorRef.current.insertHTML?.(html);
    }
  };

  // Sync content updates imperatively if content changes from outside (e.g. backend polling)
  useEffect(() => {
    if (initialContent && liveEditorRef.current) {
      liveEditorRef.current.setHTML(initialContent);
    }
  }, [initialContent]);

  const handleApplyTemplate = (htmlContent: string) => {
    if (!window.confirm('¿Deseas reemplazar el contenido actual por este formato de plantilla? Se perderán las modificaciones no guardadas.')) return;
    if (liveEditorRef.current) {
      liveEditorRef.current.setHTML(htmlContent);
      onUpdate(htmlContent);
    }
  };

  const handleInsertInlay = (htmlInlay: string) => {
    if (liveEditorRef.current) {
      liveEditorRef.current.insertHTML(htmlInlay);
    }
  };

  const showSidebar = isMaximized && sidebarOpen;

  return (
    <div className="flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm">
      {/* SST Template Center Sidebar */}
      {isMaximized && (
        <div 
          className={`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col transition-all duration-300 relative ${
            sidebarOpen ? 'w-[280px] sm:w-[320px]' : 'w-0 overflow-hidden border-r-0'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border-medium flex items-center justify-between shrink-0 bg-surface-primary">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-600 animate-pulse" />
              <span className="text-sm font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">Plantillas SST</span>
            </div>
            <span className="text-[10px] bg-teal-500/10 text-teal-600 px-2 py-0.5 rounded-full font-bold">PRO</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-1.5 bg-surface-primary/60 border-b border-border-medium/60 shrink-0">
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'templates' 
                  ? 'bg-surface-primary text-text-primary shadow-sm font-extrabold border border-border-medium/30' 
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              Documentos
            </button>
            <button
              onClick={() => setActiveTab('inlays')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'inlays' 
                  ? 'bg-surface-primary text-text-primary shadow-sm font-extrabold border border-border-medium/30' 
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              Bloques Rápidos
            </button>
          </div>

          {/* Scrolling Content List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {activeTab === 'templates' ? (
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1">Estructuras Completas</div>
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl.html)}
                    className="w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5"
                  >
                    <div className="h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform">
                      {tpl.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors">{tpl.title}</h4>
                      <p className="text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2">{tpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1">Inyectores de Posición</div>
                {INLAYS.map((inl) => (
                  <button
                    key={inl.id}
                    onClick={() => handleInsertInlay(inl.html)}
                    className="w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 group flex items-start gap-2.5"
                  >
                    <div className="h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform">
                      {inl.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-text-primary group-hover:text-emerald-600 transition-colors">{inl.title}</h4>
                      <p className="text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2">{inl.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle Button for Sidebar - ONLY visible when maximized */}
      {isMaximized && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 z-[400] h-14 w-5 bg-surface-primary border border-border-medium hover:bg-surface-hover shadow-md rounded-r-lg flex items-center justify-center transition-all duration-300 ${
            sidebarOpen 
              ? 'left-[279px] sm:left-[319px]' 
              : 'left-0 border-l-0'
          }`}
          title={sidebarOpen ? 'Contraer Panel Lateral' : 'Expandir Panel Lateral'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3.5 w-3.5 text-text-secondary" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
          )}
        </button>
      )}

      {/* Live WYSIWYG Word Editor Wrapper */}
      <div className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Connection Top Bar / Header */}
        <div className="px-4 py-2.5 border-b border-border-medium bg-surface-secondary/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">Documento de Texto</span>
          </div>
          <button
            onClick={() => setIsBridgeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/15 rounded-xl transition-all duration-300 cursor-pointer shadow-sm"
            title="Conectar con otros Lienzos (Excel)"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Conectar Lienzo (Excel)</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <LiveEditor
            ref={liveEditorRef}
            initialContent={initialContent}
            onUpdate={onUpdate}
            reportType="general"
            paperMode={true}
            hideFullscreen={true} // Fullscreen handled by the outer Canvas container
            reportSourceData={reportSourceData}
            hideToolbarWhenCollapsed={!isMaximized}
          />
        </div>
      </div>

      {isBridgeOpen && (
        <CanvasWorkspaceBridge
          onClose={() => setIsBridgeOpen(false)}
          onImportTable={handleImportTable}
          activeFileType="text"
        />
      )}
    </div>
  );
};

export default CanvasTextEditor;
