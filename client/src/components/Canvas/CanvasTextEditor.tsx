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
import {
  politicaDesconexionHTML,
  politicaAcosoLaboralHTML,
  protocoloAcosoLaboralHTML,
  politicaAcosoSexualHTML,
  protocoloAcosoSexualHTML,
  politicaGeneroHTML,
  contratoIndefinidoHTML,
  contratoDefinidoHTML,
  contratoServiciosHTML,
  contratoObraLaborHTML
} from './extended_templates';

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
        <!-- Cabecera Premium -->
        <div style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(15,118,110,0.15); position: relative;">
          <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px;">CÓDIGO: SST-POL-001 | V.04</div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">POLÍTICA INTEGRADA DE SEGURIDAD Y SALUD EN EL TRABAJO</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST)</p>
          <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Conforme al Decreto 1072 de 2015 de la República de Colombia</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%; color: #334155;">Empresa / Razón Social:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; font-weight: 600; color: #0f766e;">{{empresa_nombre}}</td>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%; color: #334155;">NIT:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">{{empresa_nit}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; color: #334155;">Representante Legal:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">{{representante_legal}}</td>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; color: #334155;">Fecha de Aprobación:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleDateString('es-ES')}</td>
          </tr>
        </table>

        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. DECLARACIÓN GENERAL DE COMPROMISO</h3>
        <p style="text-align: justify; font-size: 13.5px; color: #334155; margin-bottom: 16px;">
          En <strong>{{empresa_nombre}}</strong>, empresa dedicada a la actividad comercial de <em>{{actividad_economica}}</em>, asumimos con el más alto nivel de responsabilidad y compromiso la protección de la integridad física, mental y social de la totalidad de nuestros colaboradores. Esta política es de cobertura universal, cobijando a todos los trabajadores vinculados mediante contratos de trabajo (independientemente de su forma o duración), contratistas, subcontractaristas, proveedores, personal en misión y demás partes interesadas que presten servicios o permanezcan en los centros de trabajo de la organización.
        </p>

        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. OBJETIVOS ESTRATÉGICOS DEL SG-SST</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Para dar cumplimiento a nuestra visión preventiva, la alta dirección se compromete a liderar y financiar el logro de los siguientes objetivos fundamentales:</p>
        <ul style="padding-left: 20px; margin-bottom: 24px; list-style-type: square; font-size: 13px; color: #334155;">
          <li style="margin-bottom: 10px;">
            <strong>Identificar, evaluar y valorar de forma continua los peligros y riesgos</strong> existentes en todas las plazas de trabajo a través del uso y actualización de la metodología IPEVAR (Matriz de Peligros), aplicando jerarquías de control (Eliminación, Sustitución, Controles de Ingeniería, Administrativos y EPP).
          </li>
          <li style="margin-bottom: 10px;">
            <strong>Proteger la seguridad y salud de todos los trabajadores</strong> previniendo activamente incidentes, accidentes laborales y enfermedades profesionales a través de campañas continuas de autocuidado, pausas activas y fomento de estilos de vida saludables.
          </li>
          <li style="margin-bottom: 10px;">
            <strong>Garantizar el estricto cumplimiento de la normatividad legal vigente aplicable</strong> en materia de Riesgos Laborales en el territorio colombiano (Decreto 1072 de 2015, Resolución 0312 de 2019, Ley 1562 de 2012, Ley 2466 de 2025) y demás regulaciones nacionales o internacionales suscritas.
          </li>
          <li style="margin-bottom: 10px;">
            <strong>Promover el mejoramiento continuo del SG-SST</strong>, destinando los recursos financieros, humanos, tecnológicos y de infraestructura necesarios y suficientes para asegurar el óptimo funcionamiento del sistema y la ejecución del Plan de Trabajo Anual.
          </li>
        </ul>

        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. SUB-POLÍTICAS CORPORATIVAS DE CUMPLIMIENTO</h3>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 6px 0; color: #15803d; font-size: 14px; font-weight: 700;">A. Prevención de Alcohol, Drogas y Sustancias Psicoactivas</h4>
          <p style="margin: 0; font-size: 12.5px; color: #166534; text-align: justify; line-height: 1.5;">
            Queda terminantemente prohibido para todos los colaboradores laborar en estado de embriaguez o bajo el efecto de sustancias alucinógenas y psicoactivas. Asimismo, todas las sedes de la organización son declaradas <strong>"Espacios 100% Libres de Humo de Tabaco y Emisiones de Sistemas Electrónicos de Vapeo"</strong> en cumplimiento de la Ley 1335 de 2009. La empresa realiza pruebas preventivas y formales de control.
          </p>
        </div>

        <div style="background-color: #f0fbfb; border-left: 4px solid #0d9488; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 6px 0; color: #0f766e; font-size: 14px; font-weight: 700;">B. Prevención de Acoso Laboral y Convivencia Laboral Digna</h4>
          <p style="margin: 0; font-size: 12.5px; color: #115e59; text-align: justify; line-height: 1.5;">
            En congruencia con las Leyes 1010 de 2006 y 2365 de 2024, nos comprometemos a promover un ambiente de trabajo fundamentado en el respeto mutuo, la equidad de género, la dignidad humana y el blindaje total contra el acoso laboral o el hostigamiento sexual. El Comité de Convivencia Laboral operará de forma transparente, confidencial y expedita para resolver y prevenir cualquier indicio de violencia o discriminación.
          </p>
        </div>

        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. FIRMAS Y DIVULGACIÓN</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 20px;">
          Esta política será publicada en cartelera digital y física, se integrará en el proceso de inducción de todo personal y será revisada de forma obligatoria mínimo una (1) vez al año por la alta dirección en coordinación con el COPASST y el responsable del SG-SST.
        </p>

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
        <!-- Cabecera Premium -->
        <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(13,148,136,0.15); position: relative;">
          <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px;">CÓDIGO: SST-FOR-002 | V.05</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">ACTA DE CONSTITUCIÓN Y APERTURA DEL COMITÉ PARITARIO DE SST</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">COPASST - Período Legal de Operación Vigente</p>
          <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">En cumplimiento con la Resolución 2013 de 1986 y Decreto 1072 de 2015</p>
        </div>

        <!-- Tabla de Control Metodológico -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <thead>
            <tr style="background-color: #f1f5f9; color: #0f766e; border-bottom: 2px solid #e2e8f0;">
              <th colspan="4" style="padding: 10px 14px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 12px;">DATOS GENERALES DEL COMITÉ Y LA SESIÓN</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; width: 25%; border-right: 1px solid #e2e8f0;">Razón Social Empresa:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0; width: 25%; font-weight: 600;">\${'{{empresa_nombre}}'}</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; width: 25%; border-right: 1px solid #e2e8f0;">NIT / Cédula Jurídica:</td>
              <td style="padding: 10px; width: 25%;">\${'{{empresa_nit}}'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Ciudad de Reunión:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">Bogotá D.C.</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Lugar / Oficina:</td>
              <td style="padding: 10px;">Sala de Juntas Principal / Teams</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Fecha y Hora:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">\${new Date().toLocaleDateString('es-ES')} | 09:00 AM</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Número de Acta:</td>
              <td style="padding: 10px; font-weight: 700; color: #0d9488;">ACTA No. 001</td>
            </tr>
          </tbody>
        </table>

        <!-- Agenda del Día -->
        <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 14.5px; font-weight: 700; text-transform: uppercase;">AGENDA DEL DÍA (ORDEN DEL DÍA)</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #115e59; line-height: 1.5;">
            <li style="margin-bottom: 4px;">Verificación de Asistencia y Quórum legal.</li>
            <li style="margin-bottom: 4px;">Instalación oficial del Comité por parte del Representante Legal de \${'{{empresa_nombre}}'}.</li>
            <li style="margin-bottom: 4px;">Designación oficial de cargos de Presidente y Secretario del Comité.</li>
            <li style="margin-bottom: 4px;">Definición del Cronograma Anual de Reuniones Ordinarias Mensuales.</li>
            <li style="margin-bottom: 4px;">Establecimiento del Plan de Acción Inmediato y compromisos de inspección en SST.</li>
            <li style="margin-bottom: 4px;">Cierre de la Sesión y firma del Acta.</li>
          </ol>
        </div>

        <h3 style="color: #0d9488; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. MATRIZ DE DELEGADOS CONSTITUIDOS</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">En concordancia con los decretos y resoluciones aplicables según el tamaño de planta de la empresa, los siguientes delegados han sido elegidos (por designación directa del empleador y elección democrática por votación de los trabajadores):</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: left; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 50%;">REPRESENTANTES POR PARTE DEL EMPLEADOR</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 50%;">REPRESENTANTES POR PARTE DE LOS TRABAJADORES</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; vertical-align: top;">
                <div style="font-weight: 700; color: #0d9488; margin-bottom: 4px;">1. PRINCIPAL DESIGNADO (PRESIDENTE):</div>
                <div style="margin-bottom: 2px;"><strong>Nombre:</strong> Juan Carlos Pérez</div>
                <div style="margin-bottom: 8px;"><strong>Cédula:</strong> C.C. 80.123.456</div>
                
                <div style="font-weight: 700; color: #0d9488; margin-bottom: 4px;">2. SUPLENTE DESIGNADO:</div>
                <div style="margin-bottom: 2px;"><strong>Nombre:</strong> Andrea González</div>
                <div><strong>Cédula:</strong> C.C. 52.987.654</div>
              </td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; vertical-align: top;">
                <div style="font-weight: 700; color: #0d9488; margin-bottom: 4px;">1. PRINCIPAL ELEGIDO (SECRETARIO):</div>
                <div style="margin-bottom: 2px;"><strong>Nombre:</strong> Laura María Restrepo</div>
                <div style="margin-bottom: 8px;"><strong>Cédula:</strong> C.C. 1.018.654.321</div>
                
                <div style="font-weight: 700; color: #0d9488; margin-bottom: 4px;">2. SUPLENTE ELEGIDO:</div>
                <div style="margin-bottom: 2px;"><strong>Nombre:</strong> Javier Alexander Silva</div>
                <div><strong>Cédula:</strong> C.C. 79.456.789</div>
              </td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #0d9488; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. PLAN DE ACCIÓN INMEDIATO (COMPROMISOS)</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Para iniciar el cumplimiento legal y garantizar las mejores prácticas de SST en \${'{{empresa_nombre}}'}, los miembros del COPASST asumen el siguiente plan de trabajo prioritario para el primer mes de operaciones:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <thead>
            <tr style="background-color: #0d9488; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff;">Actividad Planeada</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 30%; color: #ffffff;">Responsable Designado</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 20%; color: #ffffff;">Fecha Límite</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 15%; text-align: center; color: #ffffff;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Planificación del Cronograma Anual de Inspecciones de Seguridad Locativas</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Juan C. Pérez (Presidente)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Siguiente Sesión</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="background-color: #fef3c7; color: #d97706; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;">En Curso</span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Revisión conjunta del reporte de accidentes e incidentes de trabajo del mes anterior</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Laura Restrepo (Secretaria)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Inmediato</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="background-color: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;">Pendiente</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Diseño y difusión de infografía sobre reportes rápidos de actos y condiciones inseguras</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Todos los Miembros</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">15 Días</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="background-color: #fef3c7; color: #d97706; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;">Planificado</span>
              </td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #0d9488; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. DEBERES GENERALES DEL COPASST</h3>
        <p style="font-size: 13px; color: #334155; text-align: justify; margin-bottom: 24px;">
          Este comité se compromete a sesionar ordinariamente de forma mensual y extraordinaria en casos de accidentes graves. Sus funciones principales comprenden la proposición de medidas higiénicas y de control preventivo, acompañamiento en investigaciones de accidentes, realización de inspecciones de seguridad, y ser puente activo de comunicación fluida y respetuosa entre la alta dirección y los colaboradores de la organización.
        </p>

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
        <!-- Cabecera Premium -->
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(2,132,199,0.15); position: relative;">
          <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px;">CÓDIGO: SST-REG-003 | V.03</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">REGISTRO DE INDUCCIÓN Y ENTRENAMIENTO EN SST</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Proceso de Onboarding, Seguridad y Salud en el Trabajo</p>
          <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">SG-SST Obligatorio - Conforme al Decreto 1072 de 2015</p>
        </div>

        <!-- Registro del Colaborador -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <thead>
            <tr style="background-color: #f1f5f9; color: #0284c7; border-bottom: 2px solid #e2e8f0;">
              <th colspan="4" style="padding: 10px 14px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 12px;">DATOS GENERALES DEL TRABAJADOR EN INDUCCIÓN</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; width: 25%; border-right: 1px solid #e2e8f0;">Nombre del Colaborador:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0; width: 25%; font-weight: 600; color: #0284c7;">[Escribir Nombre Completo]</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; width: 25%; border-right: 1px solid #e2e8f0;">Cédula de Ciudadanía:</td>
              <td style="padding: 10px; width: 25%;">[Ingresar N° C.C.]</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Cargo / Puesto:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">[Cargo Designado]</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Área / Departamento:</td>
              <td style="padding: 10px;">[Área Operativa]</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Facilitador / Líder SST:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">[Nombre del Facilitador]</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Fecha de Inducción:</td>
              <td style="padding: 10px;">\${new Date().toLocaleDateString('es-ES')}</td>
            </tr>
          </tbody>
        </table>

        <!-- Mensaje de bienvenida -->
        <p style="font-size: 13.5px; text-align: justify; margin-bottom: 20px;">
          <strong>¡Estimado Colaborador!</strong> En <strong>\${'{{empresa_nombre}}'}</strong> la seguridad de cada persona es lo primero. Esta guía de inducción es un instrumento institucional para darte a conocer los fundamentos de prevención del SG-SST, tus responsabilidades y los mecanismos para preservar tu bienestar integral en tu puesto de trabajo.
        </p>

        <h3 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. MODULOS EXHAUSTIVOS DE FORMACIÓN PREVENTIVA</h3>
        
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo I: Conceptos Fundamentales en SST (Ley 1562 de 2012)</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Definición y diferenciación técnica y legal de <strong>Accidente de Trabajo</strong> (suceso repentino que cause lesión por causa o con ocasión del trabajo), <strong>Incidente Laboral</strong> (casi-accidente, suceso con potencial de lesión), y <strong>Enfermedad Laboral</strong> (patología contraída como resultado de la exposición a factores de riesgo inherentes a la actividad).
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo II: Deberes Legales del Trabajador (Decreto 1072)</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Compromiso estricto con los 6 deberes fundamentales: procurar el autocuidado integral de la salud, suministrar información del estado de salud veraz, cumplir las normas e instrucciones de SST, reportar oportunamente peligros y riesgos, participar en capacitaciones y reportar todo incidente de forma inmediata (máximo 24 horas).
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo III: Identificación de Peligros Específicos del Cargo</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Revisión y contextualización de la Matriz de Peligros (IPEVAR) del puesto de trabajo asignado. Identificación de riesgos ergonómicos, locativos, biológicos, eléctricos, mecánicos o psicosociales y las medidas de control adoptadas por la compañía.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo IV: Plan de Emergencias y Rutas de Evacuación</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Instrucción en señalización fotoluminiscente, identificación del Punto de Encuentro (Parque Principal / Zona Verde Norte), conformación de brigadas de emergencia (Primeros auxilios, control de incendios y evacuación) y comportamiento ante emergencias.
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo V: Políticas Preventivas de Convivencia</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Comprensión de la política de espacios 100% libres de humo y prevención de adicciones, y directrices de protección de la dignidad laboral a cargo del Comité de Convivencia Laboral.
          </p>
        </div>

        <h3 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. LISTA DE COMPROBACIÓN DE ENTREGABLES Y EPP</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Se deja constancia del entrenamiento y la entrega formal de los siguientes recursos preventivos al colaborador:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <thead>
            <tr style="background-color: #0284c7; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff;">Aspecto / Entregable Ocupacional</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 15%; text-align: center; color: #ffffff;">Entregado</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 45%; color: #ffffff;">Detalle / Observación</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Manual de Funciones y Riesgos del Puesto</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Explicación y firma del anexo de riesgos.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Elementos de Protección Personal (EPP)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Kit básico (Monogafas, protectores auditivos, guantes).</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Folletos y Ruta de Evacuación Física</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Recorrido físico de las instalaciones y botiquines.</td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. DECLARACIÓN Y COMPROMISO DE AUTOCUIDADO</h3>
        <p style="font-size: 13px; text-align: justify; color: #334155; margin-bottom: 24px;">
          Certifico mediante mi firma que he recibido de manera clara, didáctica y exhaustiva la inducción en Seguridad y Salud en el Trabajo, reconozco los riesgos de mi puesto y me comprometo a cumplir cabalmente con todas las normas de seguridad del SG-SST dispuestas por <strong>\${'{{empresa_nombre}}'}</strong>, cuidando activamente de mi salud y de la integridad de mis compañeros.
        </p>

        <div style="margin-top:60px; page-break-inside:avoid;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #0284c7; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f0f9ff; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#0284c7;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">TRABAJADOR INDUCIDO</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Huella y Firma</p>
              </td>
              <td style="width:4%;"></td>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #0284c7; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f0f9ff; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#0284c7;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">FACILITADOR / RESPONSABLE SST</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Firma y Sello</p>
              </td>
            </tr>
          </table>
        </div>
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
        <!-- Cabecera Premium -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(79,70,229,0.15); position: relative;">
          <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px;">CÓDIGO: SST-FOR-004 | V.05</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">FORMATO DE INSPECCIÓN PLANEADA DE SEGURIDAD, ORDEN Y ASEO</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Inspección Periódica a Instalaciones Físicas y Puestos de Trabajo</p>
          <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">SG-SST de \${'{{empresa_nombre}}'} - Decreto 1072 de 2015</p>
        </div>

        <!-- Metadatos de la Inspección -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <thead>
            <tr style="background-color: #f1f5f9; color: #4f46e5; border-bottom: 2px solid #e2e8f0;">
              <th colspan="4" style="padding: 10px 14px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 12px;">INFORMACIÓN DEL REGISTRO E INSPECTOR</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; width: 25%; border-right: 1px solid #e2e8f0;">Nombre del Inspector:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0; width: 25%; font-weight: 600;">[Nombre del Evaluador / COPASST]</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; width: 25%; border-right: 1px solid #e2e8f0;">Fecha de Inspección:</td>
              <td style="padding: 10px; width: 25%;">\${new Date().toLocaleDateString('es-ES')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Área / Planta Evaluada:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0; font-weight: 600; color: #4f46e5;">[Área Oficinas y Producción]</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Frecuencia Planificada:</td>
              <td style="padding: 10px;">Mensual Obligatoria</td>
            </tr>
          </tbody>
        </table>

        <!-- Lista de Chequeo Categorizada -->
        <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. LISTA DE CHEQUEO APLICADA</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Se realiza la valoración sistemática en los centros de trabajo puntuando el cumplimiento de seguridad:</p>

        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; border: 1px solid #e2e8f0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <thead>
            <tr style="background-color: #4f46e5; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff;">Criterio / Elemento a Inspeccionar</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 12%; text-align: center; color: #ffffff;">Calificación</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 38%; color: #ffffff;">Descripción de Hallazgo / Condición Detectada</th>
            </tr>
          </thead>
          <tbody>
            <!-- A. Emergencias -->
            <tr style="background-color: #f5f3ff;">
              <td colspan="3" style="padding: 6px 10px; font-weight: bold; color: #4338ca; border: 1px solid #e2e8f0;">A. EQUIPOS DE EMERGENCIA Y SEÑALIZACIÓN</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">1. Extintores portátiles vigentes, cargados y totalmente despejados.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Inspección de presión correcta. Señalizados.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">2. Rutas de evacuación y salidas de emergencia sin bloqueos físicos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Pasillos despejados y demarcación visible.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">3. Botiquines dotados con insumos de primeros auxilios vigentes.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #dc2626;">NO</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Falta gasa estéril y suero en botiquín de Recepción.</td>
            </tr>
            
            <!-- B. Locativas -->
            <tr style="background-color: #f5f3ff;">
              <td colspan="3" style="padding: 6px 10px; font-weight: bold; color: #4338ca; border: 1px solid #e2e8f0;">B. CONDICIONES LOCATIVAS E INSTALACIONES</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">4. Pisos limpios, secos y completamente libres de obstáculos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Cumple con el programa corporativo 5S (Orden).</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">5. Cables eléctricos encauzados y protegidos en canaletas.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #dc2626;">NO</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Cables expuestos debajo del escritorio de Contabilidad.</td>
            </tr>
            
            <!-- C. Ergonomia -->
            <tr style="background-color: #f5f3ff;">
              <td colspan="3" style="padding: 6px 10px; font-weight: bold; color: #4338ca; border: 1px solid #e2e8f0;">C. ERGONOMÍA Y PUESTOS DE TRABAJO</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">6. Sillas ergonómicas regulables en altura y espaldar.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Sillas en buen estado. Se recomiendan descansapiés.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">7. Pantallas a la altura de los ojos y teclado con portamuñecas.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Dotación de soportes elevadores completada.</td>
            </tr>

            <!-- D. EPP -->
            <tr style="background-color: #f5f3ff;">
              <td colspan="3" style="padding: 6px 10px; font-weight: bold; color: #4338ca; border: 1px solid #e2e8f0;">D. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">8. Uso constante y obligatorio de EPP según el área.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Operadores de planta portan botas de seguridad y casco.</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">9. EPP almacenados higiénicamente y reemplazados por desgaste.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Casilleros individuales de almacenamiento limpios.</td>
            </tr>
          </tbody>
        </table>

        <!-- Registro y Plan de Acción de Hallazgos -->
        <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. SEGUIMIENTO DE HALLAZGOS Y ACCIONES CORRECTIVAS</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Para todo aspecto calificado con "NO" cumple, se formaliza su plan de mitigación a continuación:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11.5px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color: #4f46e5; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff; width: 35%;">Hallazgo Detectado</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff; width: 35%;">Acción Correctiva Sugerida</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff; width: 18%;">Responsable</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff; width: 12%; text-align: center;">Plazo</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Desabastecimiento de gasa estéril y suero en botiquín Piso 1.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Comprar y reponer insumos médicos vencidos del botiquín.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Líder SST</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626; font-weight: bold;">5 Días</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Cables sueltos sin canalizar en oficina Contabilidad (Piso 2).</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Canalizar e instalar canaletas plásticas protectoras de piso.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Mantenimiento</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626; font-weight: bold;">8 Días</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:60px; page-break-inside:avoid;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #4f46e5; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f5f3ff; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#4f46e5;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">INSPECTOR / EVALUADOR</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Líder SST o COPASST</p>
              </td>
              <td style="width:4%;"></td>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #4f46e5; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f5f3ff; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#4f46e5;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">VISTO BUENO DIRECCIÓN</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Representante Legal / Gerencia</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `.trim()
  },
  {
    id: 'analisis_riesgo_ats',
    title: 'Análisis de Riesgo (ATS)',
    description: 'Control de peligros and autorizaciones por tarea',
    icon: <ListTodo className="h-4 w-4 text-orange-500" />,
    html: `
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <!-- Cabecera Premium -->
        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(234,88,12,0.15); position: relative;">
          <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px;">CÓDIGO: SST-FOR-005 | V.06</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">ANÁLISIS DE TRABAJO SEGURO (ATS)</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Permiso de Trabajo Ocupacional y Gestión Preventiva de Peligros</p>
          <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Obligatorio para Tareas Especiales en \${'{{empresa_nombre}}'}</p>
        </div>

        <!-- Metadatos del ATS -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <thead>
            <tr style="background-color: #f1f5f9; color: #ea580c; border-bottom: 2px solid #e2e8f0;">
              <th colspan="4" style="padding: 10px 14px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 12px;">DESCRIPCIÓN DE LA TAREA Y RECURSOS</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; width: 25%; border-right: 1px solid #e2e8f0;">Actividad a Realizar:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0; width: 75%; font-weight: 600; color: #ea580c;" colspan="3">Trabajos de Mantenimiento Eléctrico en Alturas</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Ubicación / Área:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0; width: 30%;">Subestación Eléctrica Principal - Piso 2</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; width: 20%;">Fecha del Trabajo:</td>
              <td style="padding: 10px; width: 25%;">\${new Date().toLocaleDateString('es-ES')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">EPP Específico:</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">Casco dieléctrico, guantes dieléctricos, arnés, eslinga doble.</td>
              <td style="padding: 10px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Equipos / Herramientas:</td>
              <td style="padding: 10px;">Medidor de tensión certificado, herramientas aisladas de 1000V.</td>
            </tr>
          </tbody>
        </table>

        <!-- Checklist de Permisos de Alto Riesgo -->
        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 8px 0; color: #c2410c; font-size: 14px; font-weight: 700; text-transform: uppercase;">CHECKLIST DE VERIFICACIÓN DE TAREAS DE ALTO RIESGO (SÍ / NO)</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #7c2d12;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; width: 45%;">[SÍ] Trabajos en Alturas (H &gt; 2.0m)</td>
              <td style="padding: 4px 0; font-weight: bold; width: 5%;">|</td>
              <td style="padding: 4px 0; font-weight: bold; width: 45%;">[NO] Espacios Confinados</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">[SÍ] Trabajos en Caliente (Soldadura/Chispas)</td>
              <td style="padding: 4px 0; font-weight: bold;">|</td>
              <td style="padding: 4px 0; font-weight: bold;">[SÍ] Bloqueo y Etiquetado de Energía (LOTO)</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;" colspan="3">[NO] Izaje Crítico de Cargas Pesadas</td>
            </tr>
          </table>
        </div>

        <!-- Secuencia de Operación Detallada (6 Pasos) -->
        <h3 style="color: #ea580c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. ANÁLISIS DE PASOS DE LA TAREA Y CONTROLES</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Se desglosa la secuencia operativa analizando peligros y estableciendo barreras de contención específicas:</p>

        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #ea580c; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; color: #ffffff;">Paso Secuencial</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 38%; color: #ffffff;">Peligros Potenciales / Riesgos</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 37%; color: #ffffff;">Medida de Control / Barrera de Seguridad</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">1. Delimitación y Señalización</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Ingreso de personal no autorizado, caídas, golpes.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Uso de cinta de demarcación, conos reflexivos y letrero de "Trabajos en Alturas".</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">2. Inspección Preoperacional</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Falla estructural o dieléctrica de herramientas, lesiones corporales.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Diligenciamiento de preoperacional de arnés, escaleras e inspección visual de herramientas de 1000V.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">3. Bloqueo de Energía (LOTO)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Electrocución directa por arco eléctrico, descargas residuales.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Aplicar candado y tarjeta personal de bloqueo en el breaker principal. Confirmar ausencia de tensión.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">4. Ascenso y Posicionamiento</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Caída a diferente nivel, trauma por suspensión o impacto.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Uso de eslinga de doble terminal en Y conectada a puntos de anclaje certificados. Mantener tres puntos de apoyo.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">5. Ejecución del Mantenimiento</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Quemaduras, choque eléctrico, caídas de herramientas.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Uso de guantes dieléctricos sobre protector de cuero, amarrar herramientas para evitar su caída, monitoreo continuo.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">6. Orden y Cierre de Área</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Locativos, caídas de nivel, residuos peligrosos dispersos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Retirar bloqueos de energías, recolectar herramientas, limpiar residuos y notificar el cierre del área.</td>
            </tr>
          </tbody>
        </table>

        <!-- Log de Ejecutores -->
        <h3 style="color: #ea580c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. REGISTRO DE TRABAJADORES EJECUTORES DEL TRABAJO</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Los firmantes declaran que comprenden a cabalidad los peligros del trabajo y las medidas de control establecidas:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: left; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Nombre Completo del Operario</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">Cédula de Ciudadanía</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">Firma de Compromiso</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 15%; text-align: center;">Hora Ingreso</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">1. [Escribir Nombre]</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">C.C. _______________</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-style: italic; color: #94a3b8; text-align: center;">Firmar al ingresar</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">_______</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">2. [Escribir Nombre]</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">C.C. _______________</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-style: italic; color: #94a3b8; text-align: center;">Firmar al ingresar</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">_______</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:60px; page-break-inside:avoid;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #ea580c; min-height:80px; display:flex; align-items:center; justify-content:center; background:#fff7ed; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#ea580c;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">SUPERVISOR DE LA TAREA</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Firma de Aprobación</p>
              </td>
              <td style="width:4%;"></td>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #ea580c; min-height:80px; display:flex; align-items:center; justify-content:center; background:#fff7ed; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#ea580c;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">COORDINADOR DE ALTURAS / SST</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Firma Emisor de Permiso</p>
              </td>
            </tr>
          </table>
        </div>
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
        <!-- Cabecera Premium -->
        <div style="background: linear-gradient(135deg, #be123c 0%, #9f1239 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(190,18,60,0.15); position: relative;">
          <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px;">CÓDIGO: SST-PLN-006 | V.05</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">PLAN DE PREVENCIÓN, PREPARACIÓN Y RESPUESTA ANTE EMERGENCIAS</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Estructura de Brigadas y Protocolos Operativos Normalizados (PON)</p>
          <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">SG-SST de \${'{{empresa_nombre}}'} - Conforme al Decreto 1072 de 2015</p>
        </div>

        <!-- Información Crítica Operativa -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #fca5a5; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(190,18,60,0.02);">
          <thead>
            <tr style="background-color: #fef2f2; color: #be123c; border-bottom: 2px solid #fca5a5;">
              <th colspan="4" style="padding: 10px 14px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 12px; color: #be123c;">PUNTOS DE RESPUESTA CRÍTICA DE EMERGENCIA</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #fca5a5;">
              <td style="padding: 10px; font-weight: bold; background-color: #fff5f5; width: 25%; border-right: 1px solid #fca5a5; color: #be123c;">Punto de Encuentro:</td>
              <td style="padding: 10px; border-right: 1px solid #fca5a5; width: 25%; font-weight: bold; color: #9f1239;">Parque Principal / Zona Verde Norte</td>
              <td style="padding: 10px; font-weight: bold; background-color: #fff5f5; width: 25%; border-right: 1px solid #fca5a5; color: #be123c;">Líder de la Brigada:</td>
              <td style="padding: 10px; width: 25%; font-weight: 600;">Coordinador de Emergencias</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; background-color: #fff5f5; border-right: 1px solid #fca5a5; color: #be123c;">Teléfonos Directos:</td>
              <td style="padding: 10px; border-right: 1px solid #fca5a5; font-weight: 600; color: #9f1239;">Línea Única Nacional 123</td>
              <td style="padding: 10px; font-weight: bold; background-color: #fff5f5; border-right: 1px solid #fca5a5; color: #be123c;">ARL Convenio:</td>
              <td style="padding: 10px; font-weight: 600;">Línea de Urgencias Médicas ARL</td>
            </tr>
          </tbody>
        </table>

        <!-- Roles del Comité de Emergencias -->
        <h3 style="color: #be123c; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. ESTRUCTURA ORGANIZATIVA DEL COMITÉ</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">La brigada y el comité operativo de \${'{{empresa_nombre}}'} están coordinados bajo la siguiente cadena de mando:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11.5px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <thead>
            <tr style="background-color: #be123c; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 30%; color: #ffffff;">Rol del Comité</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 45%; color: #ffffff;">Responsabilidad Principal</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; color: #ffffff;">Miembro Designado</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #be123c;">Director de Emergencias</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Tomar decisiones estratégicas y ordenar la evacuación total de instalaciones.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Gerente General</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #be123c;">Brigada de Evacuación</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Guiar la salida ordenada del personal por rutas de evacuación y hacer el conteo físico.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Diana Morales / Oscar Torres</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #be123c;">Brigada de Primeros Auxilios</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Brindar soporte y primeros auxilios básicos en la zona de clasificación de lesionados.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Liceth Ruiz / Dr. Andrés Gómez</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #be123c;">Brigada Contra Incendios</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Afrontar conatos de incendio mediante uso de extintores y controlar servicios públicos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Carlos Ochoa / José Pérez</td>
            </tr>
          </tbody>
        </table>

        <!-- Protocolos Operativos Normalizados (PON) -->
        <h3 style="color: #be123c; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. PROTOCOLOS OPERATIVOS NORMALIZADOS (PON)</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Instrucciones preestablecidas de reacción y manejo para las contingencias más probables en la empresa:</p>

        <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 14px; border-radius: 0 8px 8px 0; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 4px 0; color: #9f1239; font-size: 13.5px; font-weight: 700;">A. Protocolo Operativo en caso de Conato de Incendio</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #881337; line-height: 1.5;">
            <li><strong>Valorar la magnitud del fuego:</strong> Si es menor (conato), proceda al ataque rápido; si es incontrolable, evacúe.</li>
            <li><strong>Alertar:</strong> Active el sistema manual de alarmas de emergencia y avise al líder de brigada.</li>
            <li><strong>Atacar el conato:</strong> Retire el pasador del extintor más cercano tipo ABC o CO2 y dirija la descarga a la base de la llama en forma de abanico.</li>
            <li><strong>Evacuar ordenadamente:</strong> Si el conato progresa, cierre puertas de escape sin llave y evacúe inmediatamente por la ruta.</li>
          </ol>
        </div>

        <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 14px; border-radius: 0 8px 8px 0; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 4px 0; color: #9f1239; font-size: 13.5px; font-weight: 700;">B. Protocolo Operativo en caso de Sismo / Movimiento Telúrico</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #881337; line-height: 1.5;">
            <li><strong>Conservar la calma:</strong> No grite, evite generar pánico o salir corriendo en pleno sismo.</li>
            <li><strong>Buscar Refugio:</strong> Ubíquese bajo un mueble resistente (mesa/escritorio) o en columnas de la estructura. Aléjese de archivadores, ventanas y vidrios.</li>
            <li><strong>No use ascensores:</strong> Bajo ninguna circunstancia utilice elevadores durante la contingencia sísmica.</li>
            <li><strong>Evacuación Post-Sismo:</strong> Una vez finalizado el movimiento sísmico, proceda de forma ordenada a evacuar hacia el Punto de Encuentro.</li>
          </ol>
        </div>

        <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 14px; border-radius: 0 8px 8px 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 4px 0; color: #9f1239; font-size: 13.5px; font-weight: 700;">C. Protocolo en caso de Accidente Ocupacional Grave o Trauma</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #881337; line-height: 1.5;">
            <li><strong>Proteger el área (Método PAS):</strong> Asegure el área de trabajo para evitar que usted o terceros sufran otra lesión.</li>
            <li><strong>Avisar de Inmediato:</strong> Notifique al líder de brigada de primeros auxilios y reporte a Urgencias de la ARL.</li>
            <li><strong>Socorrer:</strong> Brinde únicamente valoración primaria si cuenta con entrenamiento. No mueva al lesionado si se sospecha de fractura cervical.</li>
            <li><strong>Traslado:</strong> Coordine el traslado seguro en ambulancia certificada del lesionado al centro clínico de convenio de la ARL.</li>
          </ol>
        </div>

        <!-- Inventario de Recursos -->
        <h3 style="color: #be123c; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. INVENTARIO DE RECURSOS DE RESPUESTA</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Se cuenta con los siguientes equipos activos de protección en las instalaciones corporativas:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11.5px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color: #fdf2f8; color: #9f1239; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #9f1239;">Equipo de Emergencia</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 20%; text-align: center; color: #9f1239;">Cantidad Activa</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 45%; color: #9f1239;">Detalle / Ubicación Física</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Extintores Portátiles Multipropósito (ABC 10 lbs)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">6 Unidades</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Distribuidos por pasillos, subestación y bodegas.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Botiquines Reglamentarios Tipo A</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">2 Unidades</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Ubicados en Recepción y Planta de Producción.</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Camillas Rígidas de Rescate Plásticas</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">2 Unidades</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Instaladas en pared, con inmovilizador cervical y arnés de sujeción.</td>
            </tr>
          </tbody>
        </table>

        ${DEFAULT_SIGNATURE_BLOCK}
      </div>
    `.trim()
  },
  {
    id: 'politica_desconexion',
    title: 'Pol. Desconexión Laboral',
    description: 'Regulación del descanso y salud digital (Ley 2191 de 2022)',
    icon: <Scale className="h-4 w-4 text-indigo-500" />,
    html: politicaDesconexionHTML
  },
  {
    id: 'politica_acoso_laboral',
    title: 'Pol. Acoso Laboral',
    description: 'Prevención de acoso y convivencia armónica (Ley 1010)',
    icon: <ShieldAlert className="h-4 w-4 text-emerald-500" />,
    html: politicaAcosoLaboralHTML
  },
  {
    id: 'protocolo_acoso_laboral',
    title: 'Prot. Acoso Laboral',
    description: 'Ruta de quejas y mediación del Comité de Convivencia',
    icon: <ListTodo className="h-4 w-4 text-teal-500" />,
    html: protocoloAcosoLaboralHTML
  },
  {
    id: 'politica_acoso_sexual',
    title: 'Pol. Acoso Sexual',
    description: 'Prevención y tolerancia cero frente a agresión sexual (Ley 2365)',
    icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,
    html: politicaAcosoSexualHTML
  },
  {
    id: 'protocolo_acoso_sexual',
    title: 'Prot. Acoso Sexual',
    description: 'Ruta de atención urgente y medidas cautelares (Ley 2365)',
    icon: <AlertTriangle className="h-4 w-4 text-purple-500" />,
    html: protocoloAcosoSexualHTML
  },
  {
    id: 'politica_genero',
    title: 'Pol. Equidad de Género',
    description: 'Plan de igualdad de oportunidades y brecha salarial cero',
    icon: <Heart className="h-4 w-4 text-blue-500" />,
    html: politicaGeneroHTML
  },
  {
    id: 'contrato_indefinido',
    title: 'Contrato Término Indefinido',
    description: 'Contrato de trabajo estándar sin límite de tiempo vinculante',
    icon: <FileText className="h-4 w-4 text-slate-500" />,
    html: contratoIndefinidoHTML
  },
  {
    id: 'contrato_definido',
    title: 'Contrato Término Fijo',
    description: 'Contrato laboral con fecha de vencimiento y prórrogas',
    icon: <FileText className="h-4 w-4 text-blue-800" />,
    html: contratoDefinidoHTML
  },
  {
    id: 'contrato_servicios',
    title: 'Prestación de Servicios',
    description: 'Contrato civil/comercial independiente con autonomía técnica',
    icon: <FileText className="h-4 w-4 text-teal-600" />,
    html: contratoServiciosHTML
  },
  {
    id: 'contrato_obra_labor',
    title: 'Contrato de Obra o Labor',
    description: 'Contrato laboral condicionado al fin de un proyecto u obra',
    icon: <FileText className="h-4 w-4 text-orange-700" />,
    html: contratoObraLaborHTML
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
