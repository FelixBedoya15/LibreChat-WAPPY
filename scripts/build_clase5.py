# -*- coding: utf-8 -*-
import os
import re

print("Starting generation of Clase 5 HTML generator...")

# Read template pieces from scripts/generate_clase3_html.py for identical CSS/JS
with open('scripts/generate_clase3_html.py', 'r', encoding='utf-8') as f:
    c3 = f.read()

# Extract CSS from c3
css_match = re.search(r'(<style>.*?</style>)', c3, re.DOTALL)
css_block = css_match.group(1) if css_match else ''

# Extract JS from c3
js_match = re.search(r'(<script>.*?</script>)', c3, re.DOTALL)
js_block = js_match.group(1) if js_match else ''

print(f"CSS length: {len(css_block)}, JS length: {len(js_block)}")

script_content = f'''# -*- coding: utf-8 -*-
"""
Generador Maestro de la Página de Clase 5:
Puesta en Marcha de Flujos DAG, Google NotebookLM & Google Flow Audiovisual
Sesión en Vivo: Martes 17 de Noviembre de 2026 · 7:00 – 9:00 PM (Hora Colombia)
"""
import os
import base64

def get_base64_img(rel_path):
    full_path = os.path.join('/Users/venta/Documents/GitHub/LibreChat-WAPPY', rel_path)
    if os.path.exists(full_path):
        with open(full_path, 'rb') as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')
            ext = rel_path.split('.')[-1].lower()
            mime = 'image/png' if ext == 'png' else 'image/jpeg' if ext in ['jpg', 'jpeg'] else 'image/svg+xml'
            return f"data:{{mime}};base64,{{encoded}}"
    return ""

cat_logo = get_base64_img('client/public/marketing/wappy-cat-logo.png')
logo_wappy = get_base64_img('client/public/assets/Logos WAPPY/logo.png')
tenshi_img = get_base64_img('client/public/assets/tenshi.png')
felix_avatar = get_base64_img('client/public/assets/felix_avatar_3d.png')
wappy_horiz_logo = get_base64_img('client/public/assets/wappy_horizontal_black_logo.png')
agy_logo = get_base64_img('client/public/assets/antigravity_logo.png')
thumb_bg = get_base64_img('client/public/assets/thumb_bg_clase5.jpg')

if not cat_logo:
    cat_logo = logo_wappy

html_content = f\'\'\'<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>WAPPY IA · Clase 5: Puesta en Marcha de Flujos DAG, Google NotebookLM &amp; Google Flow Audiovisual | SOMOS SST</title>
  <meta name="description" content="Clase 5 Oficial en Vivo: Antigravity + Wappy IA · Martes, 17 de noviembre · 7:00 – 9:00 PM (America/Bogota) vía Google Meet (meet.google.com/yxv-gyhv-ron). Puesta en marcha práctica de los flujos diseñados por alumnos, Google NotebookLM con cero alucinación, generación audiovisual con Google Flow y claves API independientes.">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png?v=wappy" />
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png?v=wappy" />
  <link rel="shortcut icon" href="/assets/favicon-32x32.png?v=wappy" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon-180x180.png?v=wappy" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  {css_block}
</head>
<body>

  <!-- ===========================================================
       BARRA DE NAVEGACIÓN SUPERIOR FIJA
       =========================================================== -->
  <header class="app-nav" role="banner">
    <div class="nav-container">
      <a href="/cursowappy01" class="brand-link" aria-label="WAPPY IA - Inicio del Curso">
        <img src="{{cat_logo}}" alt="WAPPY IA" class="cat-logo">
        <span class="brand-name">WAPPY <span>IA</span></span>
        <span class="brand-pill" style="background:rgba(239,68,68,0.2); border-color:#ef4444; color:#fca5a5;">🔴 EN VIVO</span>
      </a>

      <nav class="nav-actions" aria-label="Navegación principal">
        <a href="#video-clase" class="nav-link active">🔴 Sala en Vivo</a>
        <a href="#presentacion" class="nav-link">📊 Diapositivas (10)</a>
        <a href="#prompts" class="nav-link">💬 Prompts Clase 5</a>
        <a href="#guia-pasos" class="nav-link">📘 Preparación Previa</a>
        <button type="button" class="nav-link" onclick="openNotesModal()" style="background:rgba(199,243,3,0.15); border:1px solid rgba(199,243,3,0.4); color:#c7f303; cursor:pointer;">
          📋 Checklist &amp; Temario
        </button>
        <a href="https://meet.google.com/yxv-gyhv-ron" class="btn btn-primary" target="_blank" rel="noopener" style="background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-color:rgba(255,255,255,0.4);">
          <span>🔴 Entrar a Meet</span>
        </a>
      </nav>
    </div>
  </header>

  <!-- ===========================================================
       ORGANIZADOR DE CLASES DEL CURSO (6 Píldoras)
       =========================================================== -->
  <div class="course-organizer-strip" id="inicio">
    <nav class="course-organizer-inner" aria-label="Navegación oficial del curso">
      <a href="/cursowappy01" class="course-org-pill">🎓 Temario Curso</a>
      <a href="/clase1" class="course-org-pill done">✅ Clase 1 · Grabada</a>
      <a href="/clase2" class="course-org-pill done">✅ Clase 2 · Grabada</a>
      <a href="/clase3" class="course-org-pill done">✅ Clase 3 · Grabada</a>
      <a href="/clase4" class="course-org-pill done">✅ Clase 4 · Grabada</a>
      <a href="/clase5" class="course-org-pill active live">🔴 Clase 5 · Mar 17 Nov 7PM</a>
    </nav>
  </div>

  <main>
    <!-- ===========================================================
         HERO & SALA DE EMISIÓN EN VIVO CLASE 5
         =========================================================== -->
    <section class="hero-section" id="video-clase" aria-labelledby="hero-title">
      <div class="hero-inner">
        <div class="hero-kicker-row">
          <span class="live-pill" style="background:rgba(239,68,68,0.22); border-color:#ef4444; color:#fca5a5;">
            🔴 PRÓXIMA SESIÓN EN VIVO · MARTES 17 DE NOVIEMBRE · 7:00 – 9:00 PM
          </span>
          <span class="hero-telemetry">WAPPY.CLUB // SALA_EN_VIVO // CLASE_05_NOTEBOOKLM_FLOW</span>
        </div>

        <h1 class="hero-title" id="hero-title">
          Puesta en Marcha de <span class="accent-lime">Flujos DAG</span>, Google <span class="accent-teal">NotebookLM</span> &amp; Flow Audiovisual
        </h1>

        <p class="hero-desc">
          Quinta sesión práctica en vivo con el <strong>Ing. Félix Bedoya</strong>. Tomaremos los diagramas de flujos diseñados por los alumnos y los implementaremos en tiempo real en <strong>WAPPY</strong> y <strong>Antigravity</strong>, conectando además <strong>Google NotebookLM</strong> para podcasts y resúmenes ejecutivos con 0% de alucinación y <strong>Google Flow</strong> para la generación de micro-cápsulas audiovisuales de capacitación.
        </p>

        <!-- Reproductor Embebido 16:9 con Miniatura Oficial En Vivo -->
        <div class="video-viewport-wrap">
          <div class="video-aspect-box">
            <!-- Miniatura Oficial Personalizada HD 16:9 (Conexión Google Meet) -->
            <div class="video-thumb-cover" id="video-thumb-cover" onclick="window.open('https://meet.google.com/yxv-gyhv-ron', '_blank')" role="button" tabindex="0" aria-label="Entrar a la videoconferencia de la Clase 5 en Google Meet">
              <img src="{{thumb_bg}}" alt="" class="video-thumb-bg-img" aria-hidden="true">
              <div class="video-thumb-radial-overlay"></div>
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{{felix_avatar}}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Logos + CLASE 5 + Píldoras + Botón Meet -->
              <div class="thumb-center-col">
                <div style="display:inline-flex; align-items:center; gap:8px; padding:5px 14px; border-radius:999px; background:rgba(220,38,38,0.22); border:1px solid rgba(248,113,113,0.65); color:#fecaca; font-size:11.5px; font-weight:900; letter-spacing:0.06em; margin-bottom:8px;">
                  🔴 SESIÓN EN VIVO · MARTES 17 NOV · 7:00 – 9:00 PM
                </div>

                <div class="thumb-logos-pill">
                  <img src="{{wappy_horiz_logo}}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{{agy_logo}}" alt="Google Antigravity" class="agy-i">
                </div>

                <div class="thumb-clase-giant">CLASE 5</div>

                <div class="thumb-sub-title">
                  Flujos DAG Alumnos, <span>NotebookLM 0% Alucinación</span> &amp; <span>Google Flow</span>
                </div>

                <div class="thumb-topic-pills">
                  <span class="thumb-topic-pill">🔀 FLUJOS ALUMNOS EN VIVO</span>
                  <span class="thumb-topic-pill">🎙️ PODCASTS NOTEBOOKLM</span>
                  <span class="thumb-topic-pill">🎬 GOOGLE FLOW VÍDEO</span>
                  <span class="thumb-topic-pill highlight">⏱️ 7:00 – 9:00 PM</span>
                </div>

                <div class="thumb-play-cta" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow:0 14px 36px rgba(16,185,129,0.6);">
                  <span class="thumb-play-icon">▶</span>
                  <span>UNIRSE A LA SALA DE GOOGLE MEET</span>
                </div>
              </div>

              <!-- Columna Derecha: Avatar 3D de Tenshi con Aureola -->
              <div class="thumb-char-col">
                <svg class="thumb-halo-svg" viewBox="0 0 200 60">
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#fde047" stroke-width="10"/>
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#ffffff" stroke-width="3.5" opacity="0.9"/>
                </svg>
                <img src="{{tenshi_img}}" alt="Tenshi WAPPY IA">
                <span class="thumb-char-tag" style="border-color:#2dd4bf; color:#2dd4bf;">✨ Tenshi IA · WAPPY</span>
              </div>
            </div>

            <!-- Iframe de Espera Informativo -->
            <iframe
              id="drive-video-iframe"
              src="https://meet.google.com/yxv-gyhv-ron"
              allow="camera; microphone; fullscreen; display-capture"
              loading="lazy"
              title="Sala de Google Meet Clase 5">
            </iframe>
          </div>
        </div>

        <!-- Telemetría & Botones de Acción Rápida -->
        <div class="video-meta-bar">
          <div class="meta-item">
            <span class="meta-label">HORARIO OFICIAL</span>
            <span class="meta-val">🔴 Martes 17 Nov · 7:00 – 9:00 PM</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">SALA GOOGLE MEET</span>
            <span class="meta-val">🌐 meet.google.com/yxv-gyhv-ron</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">MATERIAL REQUERIDO</span>
            <span class="meta-val">📝 Diagrama de Flujo por Empresa</span>
          </div>
          <div class="meta-cta-group">
            <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener" class="btn btn-primary" style="background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
              <span>🔴 Entrar a la Sala Google Meet</span>
            </a>
            <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener" class="btn btn-secondary" style="border-color:rgba(59,130,246,0.5); color:#93c5fd;">
              <span>📅 Agendar en Google Calendar</span>
            </a>
            <button type="button" class="btn btn-secondary" onclick="openNotesModal()">
              <span>📋 Checklist &amp; Temario</span>
            </button>
            <a href="/clase4" class="btn btn-secondary" style="border-color:rgba(199,243,3,0.5); color:#c7f303;">
              <span>⬅️ Ver Grabación Clase 4</span>
            </a>
          </div>
        </div>

        <!-- Cuadrícula de Contenido y Objetivos de la Clase 5 -->
        <div class="chapters-card">
          <h3 class="chapters-title">📑 Temario &amp; Bloques de Trabajo Planeados para la Clase 5</h3>
          <div class="chapters-grid">
            <div class="chapter-pill">
              <span class="chapter-time">07:00 PM</span>
              <span class="chapter-name">Apertura y Revisión de Flujos Diseñados por las Empresas Alumnas</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">07:20 PM</span>
              <span class="chapter-name">Parametrización en Vivo en el Lienzo WAPPY (/tareas) y Pruebas DAG</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">07:45 PM</span>
              <span class="chapter-name">Google NotebookLM: Cero Alucinación Normativa y Fuentes Confiables</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">08:10 PM</span>
              <span class="chapter-name">Generación de Podcasts a 2 Voces y Resúmenes Ejecutivos en Audio</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">08:30 PM</span>
              <span class="chapter-name">Google Flow: Micro-Cápsulas de 3.5 Minutos y Reels de Capacitación</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">08:45 PM</span>
              <span class="chapter-name">Asignación de Claves API Independientes y Paralelismo en Servidor</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===========================================================
         ESCENARIO DE DIAPOSITIVAS INTERACTIVAS (10 SLIDES)
         =========================================================== -->
    <section class="deck-section" id="presentacion" aria-labelledby="deck-title">
      <div class="deck-container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">✨ Temario Maestro · Síntesis Estructurada Clase 5</span>
          <h2 class="sec-big-title">Diapositivas Dinámicas de la Clase 5 (10 Slides)</h2>
        </div>
        <div style="font-size: 13px; color: var(--ink-muted); font-weight: 600;">
          💡 Usa las flechas del teclado <code>←</code> <code>→</code>, desliza en el celular o activa <strong>Pantalla Completa</strong>
        </div>
      </div>

      <div class="deck-stage" id="deck-stage">
        <canvas id="deck-canvas"></canvas>

        <div class="hud-corner tl"></div>
        <div class="hud-corner tr"></div>
        <div class="hud-corner bl"></div>
        <div class="hud-corner br"></div>

        <div class="deck-topbar">
          <div class="deck-telemetry">
            <span class="telemetry-dot"></span>
            <span>WAPPY.CLUB // CLASE_05 // PUESTA_EN_MARCHA_FLUJOS_NOTEBOOKLM_GOOGLE_FLOW</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge" id="deck-counter">SLIDE 01 / 10</span>
            <button class="btn-fullscreen" onclick="toggleDeckFullscreen()">
              ⛶ Pantalla Completa
            </button>
          </div>
        </div>

        <div class="deck-progress-track">
          <div class="deck-progress-fill" id="slide-progress"></div>
        </div>

        <div class="slide-pills-strip" id="slide-pills-strip">
          <button class="slide-num-pill active" onclick="showSlide(1)">01 En Vivo Martes 17</button>
          <button class="slide-num-pill" onclick="showSlide(2)">02 Flujos Alumnos</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 NotebookLM Cero Alucinación</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 Podcasts 2 Voces</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 Google Flow 3.5m</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 Claves API Únicas</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 Conectores Workspace</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 Centro Control Kanban</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 Checklist Previo</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 Sala Google Meet</button>
        </div>

        <div class="slide-viewport" id="slide-viewport">

          <!-- SLIDE 1: Portada y Convocatoria en Vivo -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge coral s-kicker">🔴 SESIÓN EN VIVO · MARTES 17 NOV</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fca5a5;">7:00 – 9:00 PM (HORA COLOMBIA)</span>
            </div>
            <h2 class="s-title">De la Teoría a la Producción: <span class="accent-lime">Flujos Alumnos en Vivo</span></h2>
            <p class="slide-lead">
              Bienvenidos a la quinta sesión del programa oficial WAPPY IA + Antigravity. Hoy conectaremos las ideas y diagramas elaborados por cada empresa participante, construyendo automatizaciones vivas que integran <strong>Google NotebookLM</strong> para soporte normativo sin alucinaciones y <strong>Google Flow</strong> para la creación audiovisual.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">🔀 TALLER EN VIVO</div>
                <h4>Flujos de Alumnos</h4>
                <p>Parametrización paso a paso de los esquemas diseñados por Xiomara Ardila, Gloria Quintero, Carolina Colorado y Maria Elena Obando.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">🎙️ CERO ALUCINACIÓN</div>
                <h4>Google NotebookLM</h4>
                <p>Carga de matrices legales, decretos y políticas corporativas para generar respuestas fundamentadas y podcasts ejecutivos.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">🎬 GENERACIÓN MULTIMEDIA</div>
                <h4>Google Flow Audiovisual</h4>
                <p>Automatización de videos cortos y piezas gráficas para divulgar lecciones aprendidas y pausas activas en la empresa.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 2: Puesta en Producción de Flujos Alumnos -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">PUESTA EN MARCHA EN VIVO</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASOS POR EMPRESA</span>
            </div>
            <h2 class="s-title">Parametrización en el <span class="accent-teal">Lienzo WAPPY (/tareas)</span></h2>
            <p class="slide-lead">
              Tomaremos los bocetos presentados y los traduciremos a nodos concretos en WAPPY. Configuraremos disparadores, compuertas lógicas y salidas coordinadas para cada necesidad empresarial identificada.
            </p>
            <div class="s-grid-3">
              <div class="s-card">
                <div class="sc-badge">1. CONTRATOS (XIOMARA)</div>
                <h4>Renovación &amp; PDFs</h4>
                <p>Automatización de alertas de vencimiento de contratos y validación documental mediante subagentes paralelos.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">2. SALUD (GLORIA)</div>
                <h4>Exámenes Periódicos</h4>
                <p>Flujo lineal de recepción de conceptos médicos, clasificación de aptitud laboral y matriz sociodemográfica.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">3. FLOTA (CAROLINA)</div>
                <h4>Control de Vehículos</h4>
                <p>Seguimiento al Plan Estratégico de Seguridad Vial (PESV), SOAT, tecnomecánica y mantenimiento preventivo.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 3: Google NotebookLM: El Cerebro Normativo -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">INTELIGENCIA NORMATIVA SEGURA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">GROUNDING CONTEXTUAL</span>
            </div>
            <h2 class="s-title">Google NotebookLM: <span class="accent-lime">0% Alucinación Normativa</span></h2>
            <p class="slide-lead">
              En SG-SST una alucinación jurídica puede acarrear sanciones de cientos de salarios mínimos. <strong>Google NotebookLM</strong> opera exclusivamente sobre las fuentes suministradas (Decreto 1072, Resolución 0312, GTC 45), garantizando respuestas con citas textuales y verificables.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">📚 FUENTES ANCLADAS</div>
                <h4>Grounding Estricto</h4>
                <p>El modelo no inventa artículos ni números de decretos. Si una información no está presente en los documentos cargados, declara explícitamente su ausencia.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">🔗 CITAS AUDITABLES</div>
                <h4>Trazabilidad Total</h4>
                <p>Cada respuesta incluye números de página y fragmentos exactos de la norma, listos para adjuntar en descargos o auditorías del Ministerio de Trabajo.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">🏢 MULTI-EMPRESA</div>
                <h4>Carpetas Privadas</h4>
                <p>Aislamiento total de información entre empresas: las políticas y actas de una compañía nunca se mezclan con las de otra.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 4: Generación de Podcasts SST a 2 Voces -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">DIVULGACIÓN PEDAGÓGICA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">AUDIO DE ALTO IMPACTO</span>
            </div>
            <h2 class="s-title">Podcasts SST a 2 Voces &amp; <span class="accent-teal">Resúmenes Ejecutivos</span></h2>
            <p class="slide-lead">
              Nadie lee un manual de 80 páginas. Con NotebookLM convertimos extensas políticas de seguridad en <strong>conversaciones dinámicas de audio</strong> entre dos especialistas que explican los puntos críticos en lenguaje ameno para operarios y directivos.
            </p>
            <div class="s-grid-3">
              <div class="s-card">
                <div class="sc-badge">🎙️ FORMATO AUDIO</div>
                <h4>Cápsulas de 5 a 10 Min</h4>
                <p>Dos voces con entonación natural analizan un riesgo específico, debaten medidas de control y recomiendan buenas prácticas.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">📱 DIFUSIÓN DIRECTA</div>
                <h4>WhatsApp &amp; Intranet</h4>
                <p>Los audios se envían directamente a los grupos de trabajo para que los colaboradores los escuchen antes de iniciar su jornada laboral.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">📊 RESUMEN EJECUTIVO</div>
                <h4>Fichas para Gerencia</h4>
                <p>NotebookLM extrae simultáneamente un resumen de 1 página con indicadores clave para la Alta Dirección.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 5: Google Flow: Producción Audiovisual -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">MULTIMEDIA EN TIEMPO RÉCORD</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">GOOGLE FLOW &amp; ESTUDIO AUDIOVISUAL</span>
            </div>
            <h2 class="s-title">Google Flow: <span class="accent-lime">Micro-Cápsulas de 3.5 Minutos</span></h2>
            <p class="slide-lead">
              Conectamos WAPPY con herramientas audiovisuales de Google para producir videos de formación en seguridad vial, orden y aseo o ergonomía en cuestión de minutos, con avatares 3D y subtítulos sincronizados.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">🎬 GUIÓN AUTOMÁTICO</div>
                <h4>Estructura Pedagógica</h4>
                <p>El agente genera el guión en 3 actos: Gancho visual (15s), Desarrollo técnico normativo (2 min) y Llamado a la acción (45s).</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">🎨 ESTILO WAPPY</div>
                <h4>Identidad Gráfica</h4>
                <p>Animaciones con la paleta oficial (#c7f303 verde lima, #0d9488 turquesa), Tenshi 3D y tipografías legibles en dispositivos móviles.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">⏱️ RENDER DETERMINISTA</div>
                <h4>Exportación MP4</h4>
                <p>Generación de archivos de video listos para proyectar en pantallas corporativas o compartir en estados de redes sociales.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 6: Claves API Independientes y Paralelismo -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">INFRAESTRUCTURA &amp; ROBUSTEZ</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">COMPROMISO FÉLIX BEDOYA</span>
            </div>
            <h2 class="s-title">Claves API Independientes: <span class="accent-teal">Cero Bloqueos</span></h2>
            <p class="slide-lead">
              Cumpliendo el compromiso acordado en la Clase 4, WAPPY asigna claves API únicas a cada proceso automatizado. Esto garantiza que un flujo pesado (ej. auditoría masiva de PDFs) no bloquee los demás procesos de la empresa.
            </p>
            <div class="s-grid-3">
              <div class="s-card">
                <div class="sc-badge">🔑 AISLAMIENTO TOTAL</div>
                <h4>Claves por Proceso</h4>
                <p>Cada automatización cuenta con su propio token. Si una tarea alcanza temporalmente un límite, las demás continúan operando normalmente.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">⚡ EJECUCIÓN PARALELA</div>
                <h4>Flujos Concurrentes</h4>
                <p>Posibilidad de ejecutar inspecciones de EPP, matrices legales y seguimiento médico al mismo tiempo sin colisiones de memoria.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">📈 TELEMETRÍA DETALLADA</div>
                <h4>Consumo por Tarea</h4>
                <p>Monitoreo exacto de cuántos tokens y llamadas consume cada departamento de la organización para control presupuestal.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 7: Conectores Workspace: Drive, Gmail & Calendar -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">INTEGRACIÓN CON GOOGLE WORKSPACE</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">ECOSISTEMA NATIVO WAPPY</span>
            </div>
            <h2 class="s-title">Conectores Workspace: <span class="accent-lime">Drive, Gmail &amp; Calendar</span></h2>
            <p class="slide-lead">
              Tenshi actúa como el puente agéntico que sincroniza el trabajo de WAPPY con las herramientas cotidianas de tu equipo de trabajo, cerrando el ciclo administrativo de forma automática.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">📁 GOOGLE DRIVE</div>
                <h4>Gestor Documental</h4>
                <p>Carpetas inteligentes que clasifican conceptos médicos, certificados de inspección y actas de comités automáticamente.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">✉️ GMAIL CORPORATIVO</div>
                <h4>Alertas Formales</h4>
                <p>Envío de correos automáticos con copias ocultas, plantillas personalizadas y archivos adjuntos generados en el flujo.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">📅 GOOGLE CALENDAR</div>
                <h4>Agenda de Inspecciones</h4>
                <p>Programación automática de auditorías periódicas, vencimientos de licencias y reuniones de COPASST con recordatorios.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 8: Auditoría y Mitigación de Riesgos en Tiempo Real -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">CONTROL OPERATIVO RIGUROSO</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">ESTÁNDARES MÍNIMOS RESOLUCIÓN 0312</span>
            </div>
            <h2 class="s-title">Auditoría en Tiempo Real &amp; <span class="accent-teal">Centro de Control Kanban</span></h2>
            <p class="slide-lead">
              Las automatizaciones no operan a espaldas del responsable de SST. Todo hallazgo generado por un flujo DAG se registra en el <strong>Centro de Control Kanban</strong> para supervisión humana antes de su cierre definitivo.
            </p>
            <div class="s-grid-3">
              <div class="s-card">
                <div class="sc-badge">📋 ETAPAS KANBAN</div>
                <h4>Trazabilidad Visual</h4>
                <p>Estados claros: Pendiente por Revisión, En Ejecución, Requiere Soporte Técnico, y Cerrado con Evidencia Documental.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">🛡️ FIRMA DIGITAL</div>
                <h4>Responsabilidad Técnica</h4>
                <p>El profesional de SST valida las acciones correctoras con su firma digital y número de licencia antes de archivar el caso.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">📊 INDICADORES SG-SST</div>
                <h4>Métricas en Vivo</h4>
                <p>Cálculo automático de tasas de accidentalidad, porcentaje de cumplimiento de capacitaciones y cobertura de EPP.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 9: Checklist para la Sesión en Vivo -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">PREPARACIÓN OBLIGATORIA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">REQUISITOS PARA APROVECHAR AL 100%</span>
            </div>
            <h2 class="s-title">Checklist Previo para la <span class="accent-lime">Clase 5 en Vivo</span></h2>
            <p class="slide-lead">
              Para garantizar que puedas implementar tu flujo durante las 2 horas de taller en vivo, asegúrate de tener listos estos 4 elementos antes de iniciar:
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <div class="sc-badge">✅ REQUISITOS TÉCNICOS</div>
                <h4>Conectividad y Cuentas</h4>
                <ul style="margin:8px 0 0 16px; font-size:13px; line-height:1.7; color:#e2e8f0;">
                  <li>Sesión activa en <strong>WAPPY IA</strong> (<a href="https://app.wappy.club" target="_blank" style="color:#c7f303;">app.wappy.club</a>).</li>
                  <li>Google Antigravity abierto con proyecto de la empresa configurado.</li>
                  <li>Acceso a Google Meet: <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" style="color:#5eead4;">meet.google.com/yxv-gyhv-ron</a>.</li>
                </ul>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">📄 MATERIAL EMPRESARIAL</div>
                <h4>Documentos del Flujo</h4>
                <ul style="margin:8px 0 0 16px; font-size:13px; line-height:1.7; color:#e2e8f0;">
                  <li>Diagrama o borrador escrito con los 4 pasos de la automatización deseada.</li>
                  <li>Archivo de prueba en Excel o PDF representativo (sin datos ultrasensibles).</li>
                  <li>Token de API (si tu software lo permite) o credenciales de prueba.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- SLIDE 10: Espacio de Preguntas y Retroalimentación -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge coral s-kicker">🔴 EN VIVO AHORA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fecaca;">SALA DE CONFERENCIA ABIERTA</span>
            </div>
            <h2 class="s-title">¡Nos Vemos en la Sala! <span class="accent-lime">Google Meet Listo</span></h2>
            <p class="slide-lead">
              Haz clic en el botón principal para ingresar a la sala en vivo. El Ing. Félix Bedoya y el equipo de soporte técnico estarán listos para resolver dudas puntuales de tu flujo empresarial.
            </p>
            <div style="margin-top:24px; text-align:center;">
              <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener" class="btn btn-primary" style="font-size:16px; padding:16px 36px; background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <span>🔴 Ingresar a Google Meet (meet.google.com/yxv-gyhv-ron) →</span>
              </a>
            </div>
            <div style="margin-top:20px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
              <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener" class="btn btn-secondary">
                <span>📅 Agendar en Google Calendar</span>
              </a>
              <a href="/clase4" class="btn btn-secondary" style="border-color:rgba(199,243,3,0.4); color:#c7f303;">
                <span>⬅️ Repasar Grabación Clase 4</span>
              </a>
            </div>
          </div>

        </div>

        <div class="deck-footer">
          <div class="deck-nav-group">
            <button class="btn-slide-ctrl" id="btn-prev" onclick="prevSlide()" disabled>← Anterior</button>
            <button class="btn-slide-ctrl primary-next" id="btn-next" onclick="nextSlide()">Siguiente Diapositiva →</button>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="#video-clase" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              🔴 Sala en Vivo ↑
            </a>
            <a href="#prompts" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              💬 Ir a los 5 Prompts ↓
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

    <!-- ===========================================================
         SIMULADOR DE TOKENS EN TIEMPO REAL
         =========================================================== -->
    <section class="simulator-section" aria-labelledby="sim-title">
      <div class="sim-container">
        <span class="slide-badge lime">HERRAMIENTA DIDÁCTICA INTERACTIVA</span>
        <h2 class="sim-title" id="sim-title">Simulador de Tokens para NotebookLM &amp; Flujos DAG</h2>
        <p class="sim-desc">
          Calcula la longitud en tokens de los documentos normativos o prompts que planeas conectar a Google NotebookLM. Recuerda que NotebookLM admite fuentes extensas sin costo adicional de tokens por consulta.
        </p>

        <div class="sim-box">
          <textarea id="token-live-input" class="sim-textarea" rows="3" oninput="updateTokenSimulator()" placeholder="Escribe aquí tu prompt para NotebookLM o resumen de norma...">Actúa como Especialista en SG-SST en Google NotebookLM. Analiza el Decreto 1072 de 2015 y la Resolución 0312 de 2019. Extrae los estándares mínimos obligatorios para una empresa de 45 trabajadores con nivel de riesgo III.</textarea>

          <div class="sim-stats-row">
            <span class="sim-badge" id="token-stats-badge">Calculando tokens...</span>
            <span style="font-size:12px; color:#94a3b8; font-family:var(--font-mono);">MODELO: GOOGLE NOTEBOOKLM / GEMINI FLASH</span>
          </div>

          <div class="sim-output-wrap" id="token-pills-output">
            <!-- Chips de tokens generados dinámicamente -->
          </div>
        </div>
      </div>
    </section>

    <!-- ===========================================================
         PROMPTS COPIABLES DE LA CLASE 5
         =========================================================== -->
    <section class="prompts-section" id="prompts" aria-labelledby="prompts-title">
      <div class="prompts-container">
        <div class="prompts-header">
          <span class="slide-badge lime">PLANTILLAS CONVERSACIONALES DE ALTO IMPACTO</span>
          <h2 class="prompts-title" id="prompts-title">5 Prompts Maestros de la Clase 5 para NotebookLM &amp; Google Flow</h2>
          <p class="prompts-lead">
            Utiliza estas instrucciones para extraer citas normativas exactas, diseñar guiones de podcasts a 2 voces y parametrizar videos cortos de capacitación.
          </p>
        </div>

        <div class="prompt-cards-grid">
          <!-- Prompt 1 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag lime">NOTEBOOKLM / NORMAS</span>
              <h4>1. Generador de Fuentes Estructuradas para Google NotebookLM</h4>
            </div>
            <p class="p-desc">Organiza reglamentos, matrices y decretos en bloques temáticos para alimentar un cuaderno sin sobrecargar el contexto.</p>
            <div class="p-code-box" id="prompt-p1">Actúa como Curador Documental SG-SST para Google NotebookLM. Voy a entregarte la normativa y políticas de seguridad de mi empresa [Nombre de la Empresa].

Tu tarea es preparar las fuentes de información:
1. Divide el contenido en 3 cuadernos especializados: Marco Normativo Nacional (Decretos/Resoluciones), Procedimientos Operativos Específicos (Trabajo en Alturas, Químicos, LOTO), y Registros Históricos de la Empresa (Actas de COPASST, Informes de Accidentalidad).
2. Asegúrate de incluir encabezados claros con fecha de emisión, entidad emisora y ámbito de aplicación para facilitar las citas textuales de NotebookLM.
3. Formula 5 preguntas de prueba de alta complejidad técnica para verificar que el cuaderno responda con 0% de alucinación citando los números de página exactos.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p1', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>

          <!-- Prompt 2 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag teal">PODCAST A 2 VOCES</span>
              <h4>2. Diseñador de Guiones para Podcasts SST (Estilo NotebookLM)</h4>
            </div>
            <p class="p-desc">Genera una conversación dinámica y formativa entre dos especialistas para divulgar lecciones aprendidas de seguridad.</p>
            <div class="p-code-box" id="prompt-p2">Actúa como Director Pedagógico Audiovisual en WAPPY IA. Necesito un guión de audio a dos voces (Locutor A: Especialista Técnico riguroso; Locutor B: Supervisor de Campo cercano y práctico) con duración de 6 minutos.

Tema del podcast: [Describe el tema, ej: Peligro biomecánico y levantamiento de cargas en bodega].

Estructura de la conversación:
- Minuto 0 a 1: Gancho de impacto relatando una situación cotidiana en el trabajo y su impacto en la salud lumbar.
- Minuto 1 a 4: Diálogo ágil donde el técnico explica los límites de carga permitidos en Colombia (Resolución 2400) y el supervisor comparte trucos prácticos para usar ayudas mecánicas.
- Minuto 4 a 6: Reflexión final con 3 reglas de oro inolvidables y llamado a reportar condiciones inseguras en WAPPY.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p2', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>

          <!-- Prompt 3 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag cyan">GOOGLE FLOW / VÍDEO</span>
              <h4>3. Prompts Audiovisuales para Google Flow (Micro-Cápsulas 3.5 Min)</h4>
            </div>
            <p class="p-desc">Configura la narrativa visual, planos y efectos para crear un video animado con Tenshi y el avatar de Félix Bedoya.</p>
            <div class="p-code-box" id="prompt-p3">Actúa como Productor de Video en WAPPY IA utilizando Google Flow y el sistema de animación determinista a 60 FPS.

Necesito producir un micro-video de capacitación de 3.5 minutos en formato vertical 9:16 (1080x1920) sobre: [Indica el tema, ej: Protocolo de Bloqueo y Etiquetado LOTO].

Genera los prompts visuales para cada escena:
1. Escena 1 (0-20s): Plano con avatar de Félix Bedoya en zona superior y tarjeta de alerta roja con candado LOTO animado en el pecho.
2. Escena 2 (20s-2m): Cortina oscura a pantalla completa con esquema de 5 pasos numerados que se iluminan en verde lima (#c7f303) al nombrarse.
3. Escena 3 (2m-3.5m): Regreso de Tenshi 3D con aureola dorada, resumen de las 3 compuertas de seguridad y botón animado hacia wappy.club.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p3', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>

          <!-- Prompt 4 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag amber">CONECTORES WORKSPACE</span>
              <h4>4. Enrutador de Alertas Gmail con Clasificación Automática</h4>
            </div>
            <p class="p-desc">Clasifica correos de incidentes o reportes de actos inseguros y envía alertas prioritarias según su nivel de severidad.</p>
            <div class="p-code-box" id="prompt-p4">Actúa como Agente de Triaje de Incidentes SG-SST conectado a Gmail en Google Antigravity. Cuando ingrese un correo a la cuenta de seguridad y salud en el trabajo:

1. Analiza el asunto y cuerpo del mensaje buscando palabras clave de riesgo: atrapamiento, caída de altura, quemadura química, fuga de gas, o amago de incendio.
2. Si la severidad es ALTA: Redacta un correo urgente con asunto "[URGENTE SG-SST] Incidente Crítico Reportado", marca con etiqueta roja y programa una reunión en Google Calendar para los brigadistas en los próximos 15 minutos.
3. Si la severidad es BAJA: Registra el caso en la matriz de actos y condiciones inseguras y responde al colaborador agradeciendo su reporte con un mensaje cordial de retroalimentación.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p4', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>

          <!-- Prompt 5 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag purple">PARAMETRIZADOR DAG</span>
              <h4>5. Parametrizador de Flujos DAG con Claves API Independientes</h4>
            </div>
            <p class="p-desc">Estructura un flujo multi-proceso en WAPPY con llaves API dedicadas para evitar colisiones y cuellos de botella.</p>
            <div class="p-code-box" id="prompt-p5">Actúa como Arquitecto de Sistemas de WAPPY IA. Deseo configurar una automatización en /tareas con dos procesos concurrentes:
- Proceso A: Auditoría diaria de entrega de EPP (Lectura en H5 -> Condición Si/No -> Alerta).
- Proceso B: Verificación semanal de habilitación médica de proveedores de salud ocupacional.

Configura la arquitectura técnica:
1. Asigna identificadores y claves API independientes para cada flujo (wpy_proc_epp_... y wpy_proc_med_...).
2. Establece límites de concurrencia y políticas de reintento automático ante fallas de red.
3. Diseña el webhook de salida unificado para consolidar las métricas de ambos flujos en el panel de control de WAPPY.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p5', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ===========================================================
         GUÍA DE PREPARACIÓN PASO A PASO
         =========================================================== -->
    <section class="guide-section" id="guia-pasos" aria-labelledby="guide-title">
      <div class="guide-container">
        <span class="slide-badge lime">HOJA DE RUTA PARA LA CLASE 5</span>
        <h2 class="guide-title" id="guide-title">Guía de Preparación Previa para la Sesión en Vivo</h2>
        <p class="guide-desc">Sigue estos 4 pasos antes de las 7:00 PM para llegar con todo listo a la sala virtual y aprovechar al máximo el taller práctico.</p>

        <div class="guide-blocks-grid">
          <div class="g-block">
            <div class="g-num">1</div>
            <h4>Verifica tu Conexión a WAPPY</h4>
            <p>Ingresa a <a href="https://app.wappy.club" target="_blank" style="color:#c7f303;">app.wappy.club</a> y confirma que puedas acceder a la sección de Tareas (/tareas). Revisa el catálogo de flujos preestablecidos.</p>
          </div>
          <div class="g-block">
            <div class="g-num">2</div>
            <h4>Prepara tu Diagrama de Flujo</h4>
            <p>Ten a la mano el boceto en papel, diagrama de Lucidchart o descripción paso a paso de la automatización que tu empresa necesita resolver con urgencia.</p>
          </div>
          <div class="g-block">
            <div class="g-num">3</div>
            <h4>Reúne Archivos de Prueba</h4>
            <p>Guarda en una carpeta accesible 2 o 3 archivos representativos (un PDF de contrato, un Excel de nómina o un certificado médico) sin datos personales confidenciales.</p>
          </div>
          <div class="g-block">
            <div class="g-num">4</div>
            <h4>Entra Puntual a Google Meet</h4>
            <p>La sala virtual abre a las 6:50 PM. Conéctate a través de <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" style="color:#5eead4;">meet.google.com/yxv-gyhv-ron</a> para probar tu micrófono y cámara antes de arrancar.</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- ===========================================================
       POPUP / MODAL DE NOTAS Y CHECKLIST PREVIO (4 PESTAÑAS)
       =========================================================== -->
  <div class="notes-modal-backdrop" id="notes-modal" onclick="handleBackdropClick(event)">
    <div class="notes-modal-window" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
      <div class="notes-modal-header">
        <div class="notes-modal-title-wrap">
          <h3 id="notes-modal-title">📋 Checklist, Temario &amp; Requisitos · Clase V en Vivo</h3>
          <p>Fecha: Martes 17 de Noviembre de 2026 · 7:00 – 9:00 PM · Docente: Ing. Félix Bedoya · Google Meet</p>
        </div>
        <button type="button" class="btn-close-modal" onclick="closeNotesModal()">✕ Cerrar Ventana</button>
      </div>

      <div class="notes-tabs-bar">
        <div class="notes-tab-group">
          <button type="button" class="notes-tab-btn active" id="ntab-all" onclick="switchNotesTab('all')">🌟 Ver Todo</button>
          <button type="button" class="notes-tab-btn" id="ntab-resumen" onclick="switchNotesTab('resumen')">📌 Temario Oficial</button>
          <button type="button" class="notes-tab-btn" id="ntab-pasos" onclick="switchNotesTab('pasos')">✅ Tareas Previas Requeridas</button>
          <button type="button" class="notes-tab-btn" id="ntab-detalles" onclick="switchNotesTab('detalles')">🛠️ Herramientas &amp; Accesos</button>
        </div>
      </div>

      <div class="notes-modal-body">
        <!-- Tira de Enlaces Oficiales -->
        <div class="n-links-strip">
          <div style="font-size:12.5px; font-weight:800; color:#5eead4;">
            📎 Enlaces Oficiales de la Clase 5:
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener" class="n-doc-btn" style="border-color:#ef4444; color:#fca5a5; background:rgba(239,68,68,0.18);">
              🔴 Sala en Vivo Google Meet
            </a>
            <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener" class="n-doc-btn">
              📅 Agendar en Google Calendar
            </a>
            <a href="/clase4" class="n-doc-btn" style="border-color:#c7f303; color:#ecfccb;">
              ⬅️ Ver Grabación Clase 4
            </a>
          </div>
        </div>

        <!-- Pestaña 1: Temario Oficial -->
        <div class="notes-pane active" data-npane="resumen">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            📌 1. Temario Maestro de la Clase 5
          </div>
          <div class="s-grid-2">
            <div class="s-card glow-lime n-section-card">
              <h4>🔀 Puesta en Marcha de Flujos DAG de Alumnos</h4>
              <p>Revisión en vivo de los bocetos creados por las empresas participantes. Construcción paso a paso de los nodos en el Lienzo WAPPY (/tareas) con compuertas Pre-IA deterministas.</p>
            </div>
            <div class="s-card glow-teal n-section-card">
              <h4>🎙️ Google NotebookLM: Cero Alucinación</h4>
              <p>Conexión de matrices legales, decretos y políticas corporativas. Generación de podcasts a 2 voces y resúmenes ejecutivos verificables con número de página y cita normativa.</p>
            </div>
            <div class="s-card glow-cyan n-section-card">
              <h4>🎬 Google Flow Audiovisual &amp; Micro-Cápsulas</h4>
              <p>Producción de videos de capacitación en seguridad y salud de 3.5 minutos a 60 FPS con Tenshi 3D y el avatar del Ing. Félix Bedoya para divulgación masiva.</p>
            </div>
            <div class="s-card glow-purple n-section-card">
              <h4>🔑 Claves API Independientes &amp; Conectores</h4>
              <p>Asignación de credenciales únicas por proceso para evitar colisiones entre flujos concurrentes. Integración nativa con Google Drive, Gmail y Google Calendar.</p>
            </div>
          </div>
        </div>

        <!-- Pestaña 2: Tareas Previas Requeridas -->
        <div class="notes-pane active" data-npane="pasos">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ✅ 2. Compromisos Acordados en Clase 4 para Traer Listos
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(199,243,3,0.18); color:#c7f303; border-color:rgba(199,243,3,0.5);">👤 FELIX BEDOYA</span>
            <div><strong>1. Optimizar Procesos:</strong> Compartir con los alumnos guiones y métodos específicos para optimizar el rendimiento y consumo de procesos en Antigravity.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(45,212,191,0.18); color:#2dd4bf; border-color:rgba(45,212,191,0.5);">👤 XIOMARA ARDILA</span>
            <div><strong>2. Credenciales de Nómina:</strong> Solicitar los credenciales de API o token administrativo para conectar el software de nómina (Sigo/Aportes) a la automatización.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(139,92,246,0.18); color:#c4b5fd; border-color:rgba(139,92,246,0.5);">👤 EL GRUPO</span>
            <div><strong>3. Diagrama de Flujo:</strong> Esbozar un diagrama o dibujo del flujo de trabajo requerido por su empresa para parametrizarlo en el Lienzo WAPPY.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(199,243,3,0.18); color:#c7f303; border-color:rgba(199,243,3,0.5);">👤 FELIX BEDOYA</span>
            <div><strong>4. Enlace ReTHUS:</strong> Compartir el enlace web oficial para verificar la habilitación de médicos tratantes en Colombia.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(199,243,3,0.18); color:#c7f303; border-color:rgba(199,243,3,0.5);">👤 FELIX BEDOYA</span>
            <div><strong>5. Claves API en WAPPY:</strong> Asignar una clave única a cada proceso en WAPPY para permitir ejecución paralela sin bloqueos de cuotas.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(45,212,191,0.18); color:#2dd4bf; border-color:rgba(45,212,191,0.5);">👤 XIOMARA ARDILA</span>
            <div><strong>6. Automatizar PDFs:</strong> Utilizar Antigravity con subagentes paralelos para gestionar la renovación de contratos digitales.</div>
          </div>
        </div>

        <!-- Pestaña 3: Herramientas & Accesos Necesarios -->
        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            🛠️ 3. Herramientas &amp; Accesos Recomendados
          </div>

          <div class="n-detail-card n-section-card">
            <h4><span>1. WAPPY IA Cloud (/tareas)</span> <span class="n-ts-badge">app.wappy.club</span></h4>
            <p>Plataforma central donde operan los 55 flujos preestablecidos y el Lienzo DAG interactivo. Requiere cuenta activa para guardar y ejecutar flujos en servidor.</p>
          </div>

          <div class="n-detail-card n-section-card">
            <h4><span>2. Google Antigravity &amp; Gemini 3.8</span> <span class="n-ts-badge">Local / Cloud</span></h4>
            <p>Entorno de desarrollo agéntico para crear herramientas MCP, orquestar subagentes en paralelo y procesar lotes masivos de PDFs o bases de datos.</p>
          </div>

          <div class="n-detail-card n-section-card">
            <h4><span>3. Google NotebookLM</span> <span class="n-ts-badge">notebooklm.google.com</span></h4>
            <p>Herramienta gratuita de Google para análisis de documentos extensos con citas auditables y generación automática de podcasts a 2 voces.</p>
          </div>

          <div class="n-detail-card n-section-card">
            <h4><span>4. Conexión Google Meet</span> <span class="n-ts-badge">meet.google.com/yxv-gyhv-ron</span></h4>
            <p>Sala de videoconferencia de alta definición con soporte de audio, cámara y compartición de pantalla para recibir mentoría en directo.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ===========================================================
       PIE DE PÁGINA OFICIAL
       =========================================================== -->
  <footer class="app-footer" role="contentinfo">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="{{cat_logo}}" alt="WAPPY Logo" class="f-logo">
          <h3>WAPPY <span>IA</span> · SOMOS SST</h3>
          <p>Ecosistema agéntico de automatización, inteligencia normativa y seguridad en el trabajo para Colombia e Iberoamérica.</p>
        </div>
        <div class="footer-links">
          <h4>Navegación del Curso</h4>
          <a href="/cursowappy01">🎓 Temario General del Curso</a>
          <a href="/clase1">✅ Clase 1: Fundamentos &amp; Antigravity</a>
          <a href="/clase2">✅ Clase 2: Documentos Vivos &amp; MCP</a>
          <a href="/clase3">✅ Clase 3: Subagentes &amp; Control QR</a>
          <a href="/clase4">✅ Clase 4: Flujos DAG &amp; Lienzo WAPPY</a>
          <a href="/clase5">🔴 Clase 5: Próxima Sesión en Vivo</a>
        </div>
        <div class="footer-links">
          <h4>Plataforma &amp; Soporte</h4>
          <a href="https://wappy.club" target="_blank" rel="noopener">wappy.club</a>
          <a href="https://app.wappy.club" target="_blank" rel="noopener">Lienzo WAPPY (/tareas)</a>
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener">Sala Google Meet</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 WAPPY IA · SOMOS SST · Desarrollado por Ing. Félix Bedoya y Agencia WAPPY.</p>
        <p>Todos los derechos reservados. Material educativo y de entrenamiento profesional.</p>
      </div>
    </div>
  </footer>

  {js_block}
</body>
</html>
\'\'\'

# Write client/public/clase5.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase5.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {{pub_path}} ({{len(html_content)}} bytes)")

# Write Desktop/clase5.html
desktop_path = '/Users/venta/Desktop/clase5.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {{desktop_path}} ({{len(html_content)}} bytes)")
'''

with open('scripts/generate_clase5_html.py', 'w', encoding='utf-8') as f:
    f.write(script_content)

print(f"Successfully wrote scripts/generate_clase5_html.py ({len(script_content)} bytes)")
