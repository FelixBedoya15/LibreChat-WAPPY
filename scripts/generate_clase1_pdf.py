import os
import base64
import subprocess

def get_base64_img(rel_path):
    full_path = os.path.join('/Users/venta/Documents/GitHub/LibreChat-WAPPY', rel_path)
    if os.path.exists(full_path):
        with open(full_path, 'rb') as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')
            ext = rel_path.split('.')[-1].lower()
            mime = 'image/png' if ext == 'png' else 'image/jpeg' if ext in ['jpg', 'jpeg'] else 'image/svg+xml'
            return f"data:{mime};base64,{encoded}"
    return ""

logo_wappy = get_base64_img('client/public/assets/Logos WAPPY/logo.png')
tenshi_img = get_base64_img('client/public/assets/tenshi_original.png')

html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>WAPPY - Guía Pedagógica y Temario Clase 1</title>
<style>
  @page {{
    size: letter;
    margin: 10mm 12mm 10mm 12mm;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    font-size: 8.5pt;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  .page-container {{
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}

  .page-break {{
    page-break-before: always;
    break-before: page;
  }}

  /* Header Section */
  .header-card {{
    background: linear-gradient(135deg, #042f2e 0%, #0f766e 60%, #115e59 100%);
    border-radius: 12px;
    padding: 16px 20px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    box-shadow: 0 4px 10px rgba(15, 118, 110, 0.15);
  }}

  .header-card.compact {{
    padding: 10px 16px;
    margin-bottom: 10px;
    border-radius: 10px;
  }}

  .header-left {{
    max-width: 74%;
  }}

  .header-badge {{
    display: inline-block;
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ccfbf1;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 2px 8px;
    border-radius: 20px;
    margin-bottom: 6px;
  }}

  .header-title {{
    font-size: 15pt;
    font-weight: 800;
    line-height: 1.15;
    color: #ffffff;
    margin-bottom: 3px;
  }}

  .header-subtitle {{
    font-size: 8.2pt;
    color: #a7f3d0;
    font-weight: 500;
    line-height: 1.3;
  }}

  .header-meta {{
    margin-top: 8px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 7.5pt;
    color: #e6fffa;
  }}

  .header-meta-item {{
    background: rgba(0, 0, 0, 0.22);
    padding: 2.5px 7px;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }}

  .header-right {{
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }}

  .logo-header {{
    height: 32px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
    margin-bottom: 4px;
  }}

  .tenshi-avatar {{
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid #5eead4;
    box-shadow: 0 3px 8px rgba(0,0,0,0.3);
    background-color: #042f2e;
    object-fit: cover;
  }}

  /* Section Title */
  .section-title {{
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 10pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #0d9488;
    padding-bottom: 4px;
    margin-top: 10px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }}

  .section-title-icon {{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: #0d9488;
    color: #ffffff;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: bold;
  }}

  /* Rules Grid */
  .rules-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }}

  .rule-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3.5px solid #0d9488;
    border-radius: 7px;
    padding: 8px 10px;
  }}

  .rule-card.urgent {{
    border-left-color: #f59e0b;
    background: #fffbeb;
    border-color: #fde68a;
  }}

  .rule-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 3px;
  }}

  .rule-title {{
    font-size: 8.5pt;
    font-weight: 750;
    color: #0f172a;
  }}

  .rule-badge {{
    font-size: 6pt;
    font-weight: 800;
    padding: 1.5px 5px;
    border-radius: 4px;
    text-transform: uppercase;
  }}

  .badge-teal {{
    background: #ccfbf1;
    color: #0f766e;
    border: 1px solid #99f6e4;
  }}

  .badge-amber {{
    background: #fef3c7;
    color: #b45309;
    border: 1px solid #fde68a;
  }}

  .rule-desc {{
    font-size: 7.4pt;
    color: #334155;
    line-height: 1.3;
  }}

  /* Checklist Table */
  .checklist-table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
    font-size: 7.5pt;
  }}

  .checklist-table th {{
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
    text-align: left;
    padding: 5px 8px;
    border-bottom: 1.5px solid #cbd5e1;
    text-transform: uppercase;
    font-size: 6.8pt;
    letter-spacing: 0.4px;
  }}

  .checklist-table td {{
    padding: 5px 8px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
  }}

  .check-box {{
    display: inline-block;
    width: 11px;
    height: 11px;
    border: 1.5px solid #0d9488;
    border-radius: 3px;
    margin-right: 5px;
    vertical-align: middle;
  }}

  /* Timeline */
  .timeline {{
    display: flex;
    flex-direction: column;
    gap: 7px;
  }}

  .timeline-item {{
    display: flex;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }}

  .timeline-time {{
    width: 88px;
    background: #f8fafc;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-right: 1px solid #e2e8f0;
    flex-shrink: 0;
  }}

  .time-range {{
    font-size: 7.5pt;
    font-weight: 800;
    color: #0f766e;
    text-align: center;
  }}

  .time-dur {{
    font-size: 6.5pt;
    font-weight: 600;
    color: #64748b;
    margin-top: 1px;
  }}

  .timeline-content {{
    padding: 7px 11px;
    flex-grow: 1;
  }}

  .timeline-title {{
    font-size: 8.6pt;
    font-weight: 750;
    color: #0f172a;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}

  .timeline-badge {{
    font-size: 6.5pt;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 4px;
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }}

  .timeline-desc {{
    font-size: 7.3pt;
    color: #475569;
    margin-top: 2px;
    line-height: 1.25;
  }}

  .topics-list {{
    margin-top: 4px;
    list-style: none;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }}

  .topics-list li {{
    font-size: 7.2pt;
    color: #334155;
    position: relative;
    padding-left: 12px;
    line-height: 1.25;
  }}

  .topics-list li::before {{
    content: "•";
    position: absolute;
    left: 3px;
    color: #0d9488;
    font-weight: bold;
    font-size: 9pt;
    top: -2px;
  }}

  /* Connection Bridge Highlight Card */
  .bridge-card {{
    background: linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%);
    border: 1.5px solid #5eead4;
    border-radius: 8px;
    padding: 10px 12px;
    margin-top: 10px;
    margin-bottom: 8px;
  }}

  .bridge-title {{
    font-size: 8.8pt;
    font-weight: 800;
    color: #042f2e;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 6px;
  }}

  .bridge-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }}

  .bridge-item {{
    background: #ffffff;
    border: 1px solid #ccfbf1;
    border-radius: 6px;
    padding: 6px 8px;
    box-shadow: 0 1px 2px rgba(15,118,110,0.04);
  }}

  .bridge-item-title {{
    font-size: 7.4pt;
    font-weight: 750;
    color: #0f766e;
    margin-bottom: 1.5px;
  }}

  .bridge-item-desc {{
    font-size: 6.8pt;
    color: #475569;
    line-height: 1.2;
  }}

  /* Footer Callout */
  .footer-callout {{
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 7px;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 7.2pt;
    color: #475569;
  }}

  .footer-contact {{
    font-weight: 750;
    color: #0f766e;
  }}
</style>
</head>
<body>

  <!-- ==================== PÁGINA 1: REGLAS, ACUERDOS Y PREPARACIÓN ==================== -->
  <div class="page-container">
    <div>
      <div class="header-card">
        <div class="header-left">
          <span class="header-badge">Especialización Práctica SST con IA Agéntica</span>
          <h1 class="header-title">Programa & Guía Oficial · Clase 1</h1>
          <div class="header-subtitle">
            <strong>Curso Ecosistema Autónomo SST:</strong> De la Operatividad a la Prevención Real<br>
            <em>Fundamentos de Google Antigravity y su Conexión con WAPPY & Ecosistema Google</em>
          </div>
          <div class="header-meta">
            <span class="header-meta-item">🗓️ <strong>Fecha:</strong> Martes 20 de Octubre</span>
            <span class="header-meta-item">⏰ <strong>Horario:</strong> 7:00 PM – 9:00 PM (Col)</span>
            <span class="header-meta-item">👥 <strong>Aforo:</strong> Máximo 12 Especialistas</span>
            <span class="header-meta-item">👨‍🏫 <strong>Docente:</strong> Félix Bedoya</span>
            <span class="header-meta-item" style="background: rgba(255,255,255,0.25); border-color: #5eead4; color: #ffffff;">📹 <strong>Google Meet:</strong> meet.google.com/xvz-jmvv-iym</span>
          </div>
        </div>
        <div class="header-right">
          {"<img src='" + logo_wappy + "' class='logo-header' alt='WAPPY Logo'>" if logo_wappy else ""}
          {"<img src='" + tenshi_img + "' class='tenshi-avatar' alt='Tenshi Avatar'>" if tenshi_img else ""}
          <div style="font-size: 6pt; color: #a7f3d0; margin-top: 3px; font-weight: 700; letter-spacing: 0.5px;">TENSHI SST AI</div>
        </div>
      </div>

      <!-- BANNER OFICIAL DE CONEXIÓN GOOGLE MEET -->
      <div style="background: linear-gradient(135deg, #042f2e 0%, #0d9488 100%); border: 1.5px solid #5eead4; border-radius: 9px; padding: 7px 12px; margin-bottom: 9px; color: #ffffff; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 6px rgba(13,148,136,0.18);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 13pt;">📹</span>
          <div>
            <div style="font-size: 8.4pt; font-weight: 800; color: #ffffff;">Enlace Oficial de Conexión en Vivo · Google Meet</div>
            <div style="font-size: 7pt; color: #a7f3d0;">Acceso directo para los 12 participantes (Inicia Martes 20 Octubre · 7:00 PM)</div>
          </div>
        </div>
        <a href="https://meet.google.com/xvz-jmvv-iym" style="background: #ffffff; color: #042f2e; font-size: 7.8pt; font-weight: 800; padding: 4.5px 11px; border-radius: 6px; text-decoration: none; border: 1px solid #ccfbf1; box-shadow: 0 1px 3px rgba(0,0,0,0.15); display: inline-flex; align-items: center; gap: 4px;">
          <span>👉</span> meet.google.com/xvz-jmvv-iym
        </a>
      </div>

      <!-- SECCIÓN 1: REGLAS Y ACUERDOS -->
      <div class="section-title">
        <span class="section-title-icon">1</span>
        Reglas de Oro & Acuerdos de Participación y Convivencia
      </div>

      <p style="font-size: 7.4pt; color: #475569; margin-bottom: 7px;">
        Para garantizar que los 12 participantes alcancen el máximo aprovechamiento pedagógico y dejen su entorno agéntico 100% operativo, se establecen los siguientes acuerdos de clase:
      </p>

      <div class="rules-grid">
        <div class="rule-card urgent">
          <div class="rule-header">
            <span class="rule-title">📷 1. Cámara Encendida (Min. 10 Min)</span>
            <span class="rule-badge badge-amber">Obligatorio</span>
          </div>
          <div class="rule-desc">
            La cámara debe estar <strong>encendida obligatoriamente durante los primeros 10 a 15 minutos</strong> para el saludo inicial, llamado a lista, alineación de expectativas y conexión humana del grupo selecto de 12 profesionales. Luego se puede apagar si requieres optimizar el ancho de banda.
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">💻 2. Entorno Dual: Computador + Celular</span>
            <span class="rule-badge badge-teal">Hardware</span>
          </div>
          <div class="rule-desc">
            <strong>Computador Principal:</strong> Windows 10/11, macOS o Linux con min. 8GB RAM para instalar y operar Antigravity IDE/CLI. <strong>Smartphone:</strong> disponible y cargado para probar la interacción por voz en campo con Tenshi Voice y recibir alertas en tiempo real.
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">🌐 3. Conexión de Alta Velocidad</span>
            <span class="rule-badge badge-teal">Conectividad</span>
          </div>
          <div class="rule-desc">
            Conexión estable a Internet (mínimo 30-50 Mbps, preferiblemente cableada o Wi-Fi 5GHz). Los modelos de IA y la transmisión en vivo exigen estabilidad continua para evitar caídas de sockets y latencia en la generación de código y respuestas.
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">🎙️ 4. Protocolo de Micrófono & Preguntas</span>
            <span class="rule-badge badge-teal">Interacción</span>
          </div>
          <div class="rule-desc">
            Micrófono en <em>Mute</em> por defecto para mantener la limpieza del audio y la grabación final. Para intervenir, utiliza la función <strong>"Levantar la mano"</strong> o formula la pregunta en el chat. Al final de cada bloque habrá rondas activas de preguntas (Q&A).
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">🤝 5. Debugging Colaborativo en Vivo</span>
            <span class="rule-badge badge-teal">Metodología</span>
          </div>
          <div class="rule-desc">
            No es una clase pasiva de diapositivas; todos configuramos y programamos al mismo tiempo que el docente. Si a un compañero le surge un error o conflicto de entorno, se comparte pantalla para solucionarlo en vivo: <em>el error de uno es la lección de los doce</em>.
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">🔒 6. Confidencialidad y Ética Normativa</span>
            <span class="rule-badge badge-teal">Ética SST</span>
          </div>
          <div class="rule-desc">
            Durante las prácticas y talleres aplicados, se utilizarán datos ficticios o debidamente anonimizados (ocultando nombres de trabajadores, empresas y NITs conforme a la Ley 1581 de 2012 de Protección de Datos Personales de Colombia).
          </div>
        </div>
      </div>

      <!-- SECCIÓN 2: CHECKLIST PREVIO -->
      <div class="section-title">
        <span class="section-title-icon">2</span>
        Checklist de Preparación Previa (Tener Listo ANTES del Martes 7:00 PM)
      </div>

      <table class="checklist-table">
        <thead>
          <tr>
            <th style="width: 24%;">Componente</th>
            <th style="width: 58%;">Requisito / Acción Previa del Alumno</th>
            <th style="width: 18%; text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Cuenta Google Activa</strong></td>
            <td>Cuenta personal o corporativa activa para vincular Google Drive, Meet, Workspace y NotebookLM.</td>
            <td style="text-align: center;"><span class="check-box"></span> Verificada</td>
          </tr>
          <tr>
            <td><strong>Registro en WAPPY</strong></td>
            <td>Acceso confirmado a la plataforma WAPPY con perfil de alumno en la Academia / Tienda.</td>
            <td style="text-align: center;"><span class="check-box"></span> Activo</td>
          </tr>
          <tr>
            <td><strong>Navegador Actualizado</strong></td>
            <td>Google Chrome o Brave actualizado a la última versión (soporte para WebRTC, WebSocket y audio).</td>
            <td style="text-align: center;"><span class="check-box"></span> Instalado</td>
          </tr>
          <tr>
            <td><strong>Dispositivo Móvil</strong></td>
            <td>Smartphone con WhatsApp y navegador funcional para pruebas de campo con Tenshi Voice.</td>
            <td style="text-align: center;"><span class="check-box"></span> Listo</td>
          </tr>
          <tr>
            <td><strong>Espacio & Audio</strong></td>
            <td>Lugar tranquilo libre de ruidos, auriculares con micrófono para participar con claridad.</td>
            <td style="text-align: center;"><span class="check-box"></span> Preparado</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-callout">
      <div>
        <strong>Puntualidad:</strong> La sala virtual se abre a las <strong>6:50 PM</strong>. La clase inicia a las 7:00 PM en punto.
      </div>
      <div class="footer-contact">
        Página 1 de 2 · WAPPY Academia
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 2: TEMARIO Y ARQUITECTURA DE CONEXIÓN ==================== -->
  <div class="page-break"></div>

  <div class="page-container">
    <div>
      <div class="header-card compact">
        <div class="header-left">
          <span class="header-badge" style="margin-bottom: 2px;">Plan de Estudios Oficial</span>
          <div style="font-size: 12pt; font-weight: 800; color: #ffffff;">Temario Oficial de la Clase 1 & Puente de Conexión</div>
          <div style="font-size: 7.4pt; color: #a7f3d0;">2 Horas de Especialización Intensiva: Fundamentos de Google Antigravity + WAPPY + Google Tools</div>
        </div>
        <div style="text-align: right; font-size: 7.2pt; color: #ccfbf1;">
          Martes 20 Octubre · 7:00 – 9:00 PM<br>
          📹 <strong>Google Meet:</strong> meet.google.com/xvz-jmvv-iym
        </div>
      </div>

      <!-- SECCIÓN 3: TEMARIO OFICIAL MINUTO A MINUTO -->
      <div class="section-title">
        <span class="section-title-icon">3</span>
        Cronograma y Contenidos Minuto a Minuto (7:00 PM – 9:00 PM)
      </div>

      <div class="timeline">
        <!-- Bloque 1 -->
        <div class="timeline-item">
          <div class="timeline-time">
            <span class="time-range">7:00 – 7:15 PM</span>
            <span class="time-dur">15 Minutos (Máx)</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-title">
              <span>Módulo 1: Introducción a la IA & Despegue (Cámaras 100%)</span>
              <span class="timeline-badge">Intro Express</span>
            </div>
            <div class="timeline-desc">
              Encendido de cámaras, saludo inicial de los 12 alumnos y comprensión rápida del salto cuántico de la IA.
            </div>
            <ul class="topics-list">
              <li><strong>De ChatGPT a la IA Agéntica:</strong> Por qué los chatbots tradicionales y prompts de texto plano fallan ante la complejidad del SG-SST (Decreto 1072/15 y Res. 0312/19).</li>
              <li><strong>Los 3 niveles de madurez:</strong> Asistente de texto vs Copiloto reactivo vs Agente Autónomo con herramientas.</li>
              <li><strong>El Núcleo Inquebrantable:</strong> WAPPY como cerebro, repositorio central y centro de cumplimiento normativo que jamás se reemplaza.</li>
            </ul>
          </div>
        </div>

        <!-- Bloque 2 -->
        <div class="timeline-item">
          <div class="timeline-time">
            <span class="time-range">7:15 – 7:55 PM</span>
            <span class="time-dur">40 Minutos</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-title">
              <span>Módulo 2: Antigravity como Multiplicador de WAPPY & Motor de Triggers</span>
              <span class="timeline-badge">Arquitectura & Triggers</span>
            </div>
            <div class="timeline-desc">
              Cómo Antigravity ejecuta automatizaciones locales y disparadores (triggers) que la web no puede hacer sola.
            </div>
            <ul class="topics-list">
              <li><strong>¿Antigravity puede tener Triggers?:</strong> Automatización por cron (horarios), carpetas vigiladas (file watcher en disco local) y disparadores reactivos por umbrales.</li>
              <li><strong>Superficies de Antigravity:</strong> Antigravity IDE, Antigravity 2.0 y terminal CLI (<code>agy</code>).</li>
              <li><strong>Los 4 Pilares de Control:</strong> <em>Rules</em> (reglas inviolables <code>AGENTS.md</code>), <em>Skills</em> (habilidades bajo demanda <code>SKILL.md</code>), <em>Workflows</em> y <em>MCP</em>.</li>
            </ul>
          </div>
        </div>

        <!-- Bloque 3 -->
        <div class="timeline-item">
          <div class="timeline-time">
            <span class="time-range">7:55 – 8:35 PM</span>
            <span class="time-dur">40 Minutos</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-title">
              <span>Módulo 3: El Puente Técnico: Antigravity + WAPPY + Google Tools</span>
              <span class="timeline-badge" style="background:#ecfdf5; color:#047857; border-color:#a7f3d0;">Integración Real</span>
            </div>
            <div class="timeline-desc">
              Conexión bidireccional entre el agente de escritorio y los servicios en la nube.
            </div>
            <ul class="topics-list">
              <li><strong>Antigravity + WAPPY vía MCP:</strong> Lectura y alimentación autónoma de matrices GTC 45, PESV, productos químicos y ausentismo.</li>
              <li><strong>Antigravity + Google NotebookLM:</strong> Citas textuales de normativa colombiana sin alucinaciones y generación de podcasts en audio.</li>
              <li><strong>Antigravity + Google Workspace:</strong> Archivo digital de 20 años en Google Drive, generación automática de actas PDF y cronogramas en Calendar.</li>
            </ul>
          </div>
        </div>

        <!-- Bloque 4 -->
        <div class="timeline-item">
          <div class="timeline-time">
            <span class="time-range">8:35 – 9:00 PM</span>
            <span class="time-dur">25 Minutos</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-title">
              <span>Módulo 4: Taller en Vivo, Debugging y Reto Semanal</span>
              <span class="timeline-badge" style="background:#fef2f2; color:#b91c1c; border-color:#fecaca;">Taller Práctico</span>
            </div>
            <div class="timeline-desc">
              Configuración en vivo del primer agente de escritorio y resolución de dudas técnicas.
            </div>
            <ul class="topics-list">
              <li><strong>Práctica Guiada:</strong> Redacción de la primera <code>Rule</code> de seguridad y creación de un <code>Skill</code> para auditar hallazgos en campo.</li>
              <li><strong>Resolución de Conflictos:</strong> Pantalla compartida para resolver configuraciones de terminal y variables de entorno.</li>
              <li><strong>Asignación del Reto #1:</strong> Primer agente local sincronizado con WAPPY antes de la Clase 2.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 4: MAPA VISUAL DEL PUENTE -->
      <div class="section-title">
        <span class="section-title-icon">4</span>
        Arquitectura del Puente: Ecosistema Integrado
      </div>

      <div class="bridge-card">
        <div class="bridge-title">
          <span>🔗 Cuatro Conexiones Estratégicas que se Dominarán en la Sesión</span>
        </div>
        <div class="bridge-grid">
          <div class="bridge-item">
            <div class="bridge-item-title">1. WAPPY Platform</div>
            <div class="bridge-item-desc">
              Base de datos viva del SG-SST: matrices GTC 45, PESV, trabajadores, ausentismo, químicos y comités conectados vía MCP.
            </div>
          </div>
          <div class="bridge-item">
            <div class="bridge-item-title">2. Google NotebookLM</div>
            <div class="bridge-item-desc">
              Memoria normativa colombiana (Decreto 1072, Res. 0312, 1401). Citas exactas y generación de podcasts sin alucinaciones.
            </div>
          </div>
          <div class="bridge-item">
            <div class="bridge-item-title">3. Google Workspace</div>
            <div class="bridge-item-desc">
              Drive estructurado para el archivo de 20 años, Docs/PDF automáticos para actas e inspecciones, y Calendar para cronograma.
            </div>
          </div>
          <div class="bridge-item">
            <div class="bridge-item-title">4. Tenshi Voice Live</div>
            <div class="bridge-item-desc">
              Voz bidireccional de baja latencia con Gemini Multimodal Live API para inspecciones y dictado manos libres en campo.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER PAGE 2 -->
    <div class="footer-callout">
      <div>
        <strong>Grabaciones y Recursos:</strong> Disponibles en la Academia WAPPY en menos de 12 horas tras finalizar la clase.
      </div>
      <div class="footer-contact">
        Página 2 de 2 · WAPPY Academia
      </div>
    </div>
  </div>

</body>
</html>
"""

# Write HTML to temporary file
html_path = '/tmp/clase1_antigravity_wappy.html'
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

output_pdf = '/Users/venta/Desktop/Clase_1_Antigravity_Syllabus_y_Reglas_WAPPY.pdf'

# Run headless Chrome to print PDF without headers/footers
cmd = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={output_pdf}",
    html_path
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Chrome returncode:", res.returncode)
if os.path.exists(output_pdf):
    print("PDF generated successfully:", output_pdf, f"({os.path.getsize(output_pdf)} bytes)")
else:
    print("Error generating PDF:", res.stderr)
