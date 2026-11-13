# -*- coding: utf-8 -*-
import os
import re

print("Starting generation of Clase 4 HTML generator...")

# 1. Parse notes
notes_path = '/Users/venta/.gemini/antigravity/brain/7f1d4fc2-a936-4534-95b4-3aca675de0ae/scratch/clase4_notes_full.txt'
with open(notes_path, 'r', encoding='utf-8') as f:
    notes_raw = f.read()

# Parse pasos
pasos_match = re.search(r'Próximos pasos\n(.*?)(?=\n\nDetalles)', notes_raw, re.DOTALL)
pasos_items = []
if pasos_match:
    lines = [l.strip() for l in pasos_match.group(1).split('\n') if l.strip().startswith('*')]
    for l in lines:
        cleaned = l.lstrip('* ').strip()
        m = re.match(r'\[(.*?)\]\s*(.*?):\s*(.*)', cleaned)
        if m:
            owner, title, desc = m.groups()
            pasos_items.append((owner.strip(), title.strip(), desc.strip()))
        else:
            pasos_items.append(('Equipo', 'Compromiso', cleaned))

# Parse detalles
detalles_match = re.search(r'Detalles\n(.*?)(?=\n\nTranscripción|\Z)', notes_raw, re.DOTALL)
detalle_items = []
if detalles_match:
    blocks = detalles_match.group(1).split('________________')
    for b in blocks:
        b_clean = b.strip()
        if not b_clean:
            continue
        first_colon = b_clean.find(':')
        if first_colon != -1:
            title = b_clean[:first_colon].strip()
            body = b_clean[first_colon+1:].strip()
            ts = re.findall(r'\((\d{2}:\d{2}:\d{2})\)', body)
            ts_str = ' · '.join(ts) if ts else ''
            detalle_items.append((title, body, ts_str))

print(f"Parsed {len(pasos_items)} pasos and {len(detalle_items)} detalles.")

# Format pasos HTML
pasos_cards = []
for idx, (owner, title, desc) in enumerate(pasos_items, 1):
    if 'FELIX' in owner.upper():
        owner_style = 'background:rgba(199,243,3,0.18); color:#c7f303; border-color:rgba(199,243,3,0.5);'
    elif 'XIOMARA' in owner.upper():
        owner_style = 'background:rgba(45,212,191,0.18); color:#2dd4bf; border-color:rgba(45,212,191,0.5);'
    else:
        owner_style = 'background:rgba(139,92,246,0.18); color:#c4b5fd; border-color:rgba(139,92,246,0.5);'

    pasos_cards.append(f'''
          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="{owner_style}">👤 {owner}</span>
            <div><strong>{idx}. {title}:</strong> {desc}</div>
          </div>''')
pasos_cards_html = '\n'.join(pasos_cards)

# Format detalles HTML
detalles_cards = []
for idx, (title, body, ts_str) in enumerate(detalle_items, 1):
    h_body = body
    for spk in ['FELIX BEDOYA', 'Gloria Amparo Quintero Giraldo', 'Carolina Colorado Cano', 'XIOMARA ARDILA', 'Maria Elena Obando Colonia', 'Gloria Amparo Quintero', 'Xiomara Ardila', 'Maria Elena Obando']:
        h_body = h_body.replace(spk, f'<strong style="color:#5eead4;">{spk}</strong>')
    h_body = re.sub(r'\((\d{2}:\d{2}:\d{2})\)', r'<span class="n-time-pill">⏱️ \1</span>', h_body)
    ts_badge = f'<span class="n-ts-badge">{ts_str}</span>' if ts_str else ''

    detalles_cards.append(f'''
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>{idx}. {title}</span>
              {ts_badge}
            </h4>
            <p>{h_body}</p>
          </div>''')
detalles_cards_html = '\n'.join(detalles_cards)

# Now read template pieces from scripts/generate_clase3_html.py for identical CSS/JS
with open('scripts/generate_clase3_html.py', 'r', encoding='utf-8') as f:
    c3 = f.read()

# Extract CSS from c3
css_match = re.search(r'(<style>.*?</style>)', c3, re.DOTALL)
css_block = css_match.group(1) if css_match else ''

# Extract JS from c3
js_match = re.search(r'(<script>.*?</script>)', c3, re.DOTALL)
js_block = js_match.group(1) if js_match else ''

print(f"CSS length: {len(css_block)}, JS length: {len(js_block)}")

# Assemble generate_clase4_html.py
script_content = f'''# -*- coding: utf-8 -*-
"""
Generador Maestro de la Página de Clase 4:
Automatizaciones DAG, Flujos en Lienzo WAPPY & Subagentes Masivos SG-SST
Grabación Oficial: Miércoles 11 de Noviembre de 2026 · ~02:42 HRS · HD
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
thumb_bg = get_base64_img('client/public/assets/thumb_bg_clase4.jpg')
lienzo_dag_img = get_base64_img('client/public/assets/lienzo_wappy_clase4_dag.jpg')

if not cat_logo:
    cat_logo = logo_wappy

html_content = f\'\'\'<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>WAPPY IA · Clase 4: Automatizaciones DAG, Flujos en Lienzo WAPPY &amp; Subagentes Masivos | SOMOS SST</title>
  <meta name="description" content="Grabación y Materiales Oficiales de la Clase 4: Automatizaciones con flujos dirigidos acíclicos (DAG) estilo n8n en WAPPY (/tareas), compuertas Si/No Pre-IA para ahorro total de tokens, límites de cuotas en Antigravity, integraciones API vs Web Scraping (Sigo, Aportes, Sura) y auditoría masiva de PDFs con subagentes paralelos.">
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
        <span class="brand-pill">CLASE 4</span>
      </a>

      <nav class="nav-actions" aria-label="Navegación principal">
        <a href="#video-clase" class="nav-link active">🎥 Grabación Oficial</a>
        <a href="#presentacion" class="nav-link">📊 Diapositivas (10)</a>
        <a href="#prompts" class="nav-link">💬 Prompts Copiables</a>
        <a href="#guia-pasos" class="nav-link">📘 Guía de Estudio</a>
        <button type="button" class="nav-link" onclick="openNotesModal()" style="background:rgba(199,243,3,0.15); border:1px solid rgba(199,243,3,0.4); color:#c7f303; cursor:pointer;">
          📝 Notas &amp; Acuerdos
        </button>
        <a href="https://wappy.club/login" id="navCtaEnterWappy" class="btn btn-primary" target="_blank" rel="noopener">
          <span>Ir a WAPPY</span>
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
      <a href="/clase4" class="course-org-pill active">✅ Clase 4 · Grabada</a>
      <a href="/clase5" class="course-org-pill live">🔴 Clase 5 · Mar 17 Nov 7PM</a>
    </nav>
  </div>

  <main>
    <!-- ===========================================================
         HERO & REPRODUCTOR DE GRABACIÓN DE CLASE 4
         =========================================================== -->
    <section class="hero-section" id="video-clase" aria-labelledby="hero-title">
      <div class="hero-inner">
        <div class="hero-kicker-row">
          <span class="live-pill" style="background:rgba(45,212,191,0.22); border-color:#2dd4bf; color:#5eead4;">
            ✅ CLASE 04 GRABADA · MIÉRCOLES 11 DE NOVIEMBRE · ~02:42 HRS
          </span>
          <span class="hero-telemetry">WAPPY.CLUB // GRABACIÓN_OFICIAL // CLASE_04_FLUJOS_DAG</span>
        </div>

        <h1 class="hero-title" id="hero-title">
          Automatizaciones DAG en <span class="accent-lime">Lienzo WAPPY</span>, Condiciones <span class="accent-teal">Pre-IA</span> &amp; Subagentes Masivos
        </h1>

        <p class="hero-desc">
          Sesión magistral con el <strong>Ing. Félix Bedoya</strong> sobre arquitectura de flujos dirigidos acíclicos estilo n8n en el <strong>Lienzo WAPPY (/tareas)</strong>, compuertas lógicas condicionales que ahorran el 100% de tokens en casos negativos, gestión de cuotas de tokens en <strong>Google Antigravity</strong>, integraciones API vs Web Scraping (Sigo, Aportes, Sura) y auditoría paralela de cientos de contratos en PDF con subagentes.
        </p>

        <!-- Reproductor Embebido 16:9 con Miniatura Oficial Personalizada -->
        <div class="video-viewport-wrap">
          <div class="video-aspect-box">
            <!-- Miniatura Oficial Personalizada HD 16:9 -->
            <div class="video-thumb-cover" id="video-thumb-cover" onclick="playRecordingVideo()" role="button" tabindex="0" aria-label="Reproducir grabación oficial de la Clase 4">
              <img src="{{thumb_bg}}" alt="" class="video-thumb-bg-img" aria-hidden="true">
              <div class="video-thumb-radial-overlay"></div>
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{{felix_avatar}}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Logos + CLASE 4 + Píldoras + Botón Play -->
              <div class="thumb-center-col">
                <div class="thumb-logos-pill">
                  <img src="{{wappy_horiz_logo}}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{{agy_logo}}" alt="Google Antigravity" class="agy-i">
                </div>

                <div class="thumb-clase-giant">CLASE 4</div>

                <div class="thumb-sub-title">
                  Lienzo DAG (/tareas), <span>Condiciones Pre-IA</span> &amp; <span>Subagentes Masivos</span>
                </div>

                <div class="thumb-topic-pills">
                  <span class="thumb-topic-pill">🔀 55 FLUJOS PREESTABLECIDOS</span>
                  <span class="thumb-topic-pill">⚡ CONDICIÓN PRE-IA (0 TOK)</span>
                  <span class="thumb-topic-pill">🤖 GEMINI 3.5 LITE EN NUBE</span>
                  <span class="thumb-topic-pill highlight">⏱️ 02:42 HRS · HD</span>
                </div>

                <div class="thumb-play-cta">
                  <span class="thumb-play-icon">▶</span>
                  <span>VER GRABACIÓN COMPLETA CLASE 4</span>
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

            <!-- Iframe Oficial de la Grabación en Google Drive -->
            <iframe
              id="drive-video-iframe"
              src="https://drive.google.com/file/d/1ZxLFxUgbdYhcNs2oX_llBig-IIsyT8Pd/preview"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowfullscreen
              loading="lazy"
              title="Grabación Oficial Clase 4 - Automatizaciones DAG, Flujos en Lienzo WAPPY & Subagentes Masivos SG-SST">
            </iframe>
          </div>
        </div>

        <!-- Telemetría & Botones de Acción Rápida -->
        <div class="video-meta-bar">
          <div class="meta-item">
            <span class="meta-label">DURACIÓN OFICIAL</span>
            <span class="meta-val">⏱️ 02:42:04 (HD 1080p)</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">DOCENTE</span>
            <span class="meta-val">👨‍🏫 Ing. Félix Bedoya</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">MATERIALES OFICIALES</span>
            <span class="meta-val">📝 29 Bloques · 8 Compromisos</span>
          </div>
          <div class="meta-cta-group">
            <button type="button" class="btn btn-secondary" onclick="openNotesModal()">
              <span>📝 Ver Notas de la Clase 4</span>
            </button>
            <a href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?usp=sharing" target="_blank" rel="noopener" class="btn btn-secondary" style="border-color:rgba(59,130,246,0.5); color:#93c5fd;">
              <span>📂 Abrir Google Docs Oficial</span>
            </a>
            <a href="https://drive.google.com/file/d/1ZxLFxUgbdYhcNs2oX_llBig-IIsyT8Pd/view" target="_blank" rel="noopener" class="btn btn-secondary" style="border-color:rgba(239,68,68,0.5); color:#fca5a5;">
              <span>🎥 Abrir Video en Drive</span>
            </a>
          </div>
        </div>

        <!-- Cuadrícula de 11 Capítulos del Video -->
        <div class="chapters-card">
          <h3 class="chapters-title">📑 Índice de Capítulos &amp; Marcas de Tiempo de la Clase 4</h3>
          <div class="chapters-grid">
            <div class="chapter-pill">
              <span class="chapter-time">00:00:00</span>
              <span class="chapter-name">Apertura, Bienvenida y Objetivos de la Sesión</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">00:03:16</span>
              <span class="chapter-name">Límites de Cuotas y Tokens en Antigravity (Gemini 3.8 / Claude)</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">00:11:46</span>
              <span class="chapter-name">Integraciones API vs Web Scraping (Sigo, Aportes, Asopagos)</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">00:25:19</span>
              <span class="chapter-name">Seguridad, Privacidad y Respaldo de Datos en Plataformas IA</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">00:43:49</span>
              <span class="chapter-name">Teoría y Fundamentos de Flujos de Trabajo DAG Automatizados</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">01:02:35</span>
              <span class="chapter-name">Caso Práctico: Seguimiento a 100 Exámenes Médicos Periódicos</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">01:06:12</span>
              <span class="chapter-name">Demostración en Vivo: Lienzo WAPPY (/tareas) &amp; 55 Flujos Curados</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">01:15:30</span>
              <span class="chapter-name">Condiciones Pre-IA (0 Tokens en NO) y Memoria Bitácora Anti-dup</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">01:35:20</span>
              <span class="chapter-name">Comparativa Técnica: WAPPY Cloud 24/7 vs Antigravity Local</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">02:08:45</span>
              <span class="chapter-name">Procesamiento Masivo de PDFs y Contratos con Subagentes</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">02:35:10</span>
              <span class="chapter-name">Acuerdos, Tareas por Empresa y Horario Oficial de Clase 5</span>
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
          <span class="sec-kicker">✨ Presentación Oficial · Síntesis Estructurada Clase 4</span>
          <h2 class="sec-big-title">Diapositivas Dinámicas de la Clase 4 (10 Slides)</h2>
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
            <span>WAPPY.CLUB // CLASE_04 // AUTOMATIZACIONES_DAG_LIENZO_WAPPY_SUBAGENTES</span>
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
          <button class="slide-num-pill active" onclick="showSlide(1)">01 Era Flujos DAG</button>
          <button class="slide-num-pill" onclick="showSlide(2)">02 Causalidad Estricta</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 Cuotas y Tokens</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 API vs Scraping</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 Caso Real EPP</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 Pre-IA (0 Tokens)</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 Subagentes PDFs</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 Exámenes Médicos</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 8 Compromisos</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 Clase 5 en Vivo</button>
        </div>

        <div class="slide-viewport" id="slide-viewport">

          <!-- SLIDE 1: La Era de los Flujos DAG vs Texto Libre -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">ARQUITECTURA DE PROCESOS · CLASE 4</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">SESIÓN 04 · MIÉRCOLES 11 NOV</span>
            </div>
            <h2 class="s-title">De la IA Conversacional a los <span class="accent-lime">Flujos DAG Automatizados</span></h2>
            <p class="slide-lead">
              Escribir texto libre en un chat es apenas el <strong>10% del potencial de la Inteligencia Artificial</strong>. En esta sesión dimos el salto hacia los <strong>flujos dirigidos acíclicos (DAG)</strong> estilo n8n en el <strong>Lienzo WAPPY (/tareas)</strong>, donde el computador ejecuta procesos completos de forma autónoma, liberando horas de trabajo administrativo en SG-SST.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">🔄 PARADIGMA ANTERIOR</div>
                <h4>Chat Libre Manual</h4>
                <p>El usuario debe estar sentado frente a la pantalla, redactando prompts, esperando respuestas, copiando y pegando datos manualmente en matrices de Excel.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">⚡ NUEVO PARADIGMA</div>
                <h4>Flujos DAG Autónomos</h4>
                <p>Los procesos se programan una sola vez: un disparador (cron, webhook o evento) activa nodos de lectura, compuertas lógicas y agentes IA sin intervención humana.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">🎛️ SUITE WAPPY</div>
                <h4>55 Flujos Curados</h4>
                <p>WAPPY incluye 55 plantillas empresariales listas para usar: inspecciones, matriz legal, entrega de EPP, aptitud médica, comités y contratistas.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 2: Anatomía de un Flujo: Causalidad Estricta -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">DISEÑO Y LÓGICA DE PROCESOS</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">ESTRUCTURA DE IZQUIERDA A DERECHA</span>
            </div>
            <h2 class="s-title">Anatomía de un Flujo: <span class="accent-teal">Causalidad Estricta</span></h2>
            <p class="slide-lead">
              Todo flujo automatizado exitoso se diseña con una lógica causal inquebrantable de cuatro fases. No hay saltos ni magia: cada nodo recibe datos de su predecesor y entrega resultados limpios al siguiente.
            </p>
            <div class="s-grid-4">
              <div class="s-card">
                <div class="sc-badge">1. DISPARADOR</div>
                <h4>Disparador (Trigger)</h4>
                <p>Inicia la ejecución: Cron por horario (ej. todos los lunes 7am), Tenshi (voz o chat), Webhook, correo entrante o lectura de QR.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">2. FUENTE LECTURA</div>
                <h4>Fuente de Lectura</h4>
                <p>Obtiene los datos del aplicativo: Entrega de EPP, Matriz de Riesgos, Base de Trabajadores, API de nómina o archivo en Drive.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">3. LÓGICA PRE-IA</div>
                <h4>Condición Si/No</h4>
                <p>Compuerta determinista: ¿Hay elementos vencidos? Si es NO, corta el flujo con <strong>0 tokens consumidos</strong>.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">4. ACCIÓN SALIDA</div>
                <h4>Nodos de Salida</h4>
                <p>Cierra el ciclo: Centro de Control Kanban, Bitácora a Gmail, Alerta en WAPPY o reporte en Word/PDF.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 3: Gestión de Cuotas de Tokens en Antigravity -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">OPTIMIZACIÓN TÉCNICA · ANTIGRAVITY</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASO GLORIA AMPARO QUINTERO</span>
            </div>
            <h2 class="s-title">Gestión de Cuotas de Tokens &amp; <span class="accent-lime">Límites de Uso</span></h2>
            <p class="slide-lead">
              Durante la sesión, aclaramos la inquietud sobre los avisos de límites de uso en Google Antigravity. Las alertas <strong>no indican cobros adicionales</strong>, sino el agotamiento temporal de la cuota de procesamiento del modelo seleccionado.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">⏱️ VENTANAS DE REINICIO</div>
                <h4>Ciclos de 5 Horas</h4>
                <p>Modelos como Gemini 3.8 y Gemini 4 Argon cuentan con límites de peticiones que se renuevan cada 5 horas o de forma diaria. Al alcanzar el tope, el sistema entra en espera programada.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">🔀 ROTACIÓN DE MODELOS</div>
                <h4>Resiliencia Multi-Modelo</h4>
                <p>Si la cuota de Gemini se satura durante una jornada pesada, se puede alternar temporalmente a Claude 3.5 Sonnet o GPT-4o sin perder el contexto del proyecto.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">💼 CAMBIO DE PERFIL</div>
                <h4>Rotación de Cuentas</h4>
                <p>Para proyectos intensivos, cambiar de perfil de Google o correo electrónico permite continuar la ejecución sin interrupciones ni tiempos muertos.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 4: Integraciones en Colombia: API vs Web Scraping -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">CONECTORES EMPRESARIALES COLOMBIA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASOS SURA, SIGO, ASOPAGOS Y APORTES</span>
            </div>
            <h2 class="s-title">Integraciones en Colombia: <span class="accent-teal">API vs Web Scraping</span></h2>
            <p class="slide-lead">
              Analizamos la viabilidad de conectar los sistemas de seguridad social y nómina más utilizados en Colombia. No todas las plataformas ofrecen facilidades de conexión directa, por lo que se requieren estrategias diferenciadas.
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <div class="sc-badge" style="background:#0d9488; color:#fff;">✅ CON API DOCUMENTADA</div>
                <h4>Sigo &amp; Aportes en Línea</h4>
                <p>Plataformas modernas como <strong>Sigo</strong> y <strong>Aportes en Línea</strong> cuentan con APIs documentadas. Permiten obtener tokens de autenticación y claves administrativas en el panel de control para automatizar consultas de nómina y novedades de planillas de forma nativa.</p>
                <div style="margin-top:12px; padding:10px 14px; background:rgba(13,148,136,0.18); border-radius:10px; font-size:12px; color:#99f6e4;">
                  💡 <strong>Ventaja:</strong> Conexión limpia, sin riesgo de bloqueos por captcha y con respuestas JSON instantáneas.
                </div>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge" style="background:#f59e0b; color:#0e1300;">⚠️ SIN API PÚBLICA</div>
                <h4>ARL Sura &amp; Asopagos</h4>
                <p>Portales como <strong>ARL Sura</strong> y <strong>Asopagos</strong> no disponen de APIs abiertas para desarrolladores externos. Para interactuar con ellos se requiere <em>web scraping</em> automatizado (simulación de navegador) o la exportación estructurada de archivos Excel a una carpeta del proyecto.</p>
                <div style="margin-top:12px; padding:10px 14px; background:rgba(245,158,11,0.18); border-radius:10px; font-size:12px; color:#fde68a;">
                  ⚡ <strong>Solución WAPPY:</strong> Carga masiva del archivo Excel descargado y lectura automática por el agente IA.
                </div>
              </div>
            </div>
          </div>

          <!-- SLIDE 5: Disección del Caso Real: Flujo EPP & Perfiles de Cargo -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">CASO PRÁCTICO EN VIVO · LIENZO WAPPY</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">DIAGRAMA OFICIAL DE LA CLASE</span>
            </div>
            <h2 class="s-title">Disección del <span class="accent-lime">Lienzo WAPPY DAG</span>: Caso EPP</h2>
            <p class="slide-lead">
              Este es el flujo real presentado en pantalla durante la clase (y capturado por los participantes). Ilustra la perfecta sincronización entre disparadores, compuertas deterministas, agentes con memoria y salidas coordinadas.
            </p>
            <div style="background:rgba(2,6,13,0.92); border:1.5px solid rgba(199,243,3,0.4); border-radius:18px; padding:16px; margin:16px 0; text-align:center;">
              <img src="{{lienzo_dag_img}}" alt="Lienzo WAPPY DAG - Flujo EPP y Perfiles de Cargo" style="max-width:100%; height:auto; border-radius:12px; box-shadow:0 12px 36px rgba(0,0,0,0.7);">
              <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-top:12px; font-size:11.5px; font-family:var(--font-mono); color:#cbd5e1;">
                <span style="background:rgba(255,255,255,0.08); padding:4px 10px; border-radius:6px;">Paso 1: Cron</span>
                <span style="background:rgba(255,255,255,0.08); padding:4px 10px; border-radius:6px;">Paso 2: Tenshi</span>
                <span style="background:rgba(255,255,255,0.08); padding:4px 10px; border-radius:6px;">Paso 3: H5 EPP</span>
                <span style="background:rgba(199,243,3,0.2); color:#c7f303; padding:4px 10px; border-radius:6px;">Paso 4: Condición Si/No (Pre-IA)</span>
                <span style="background:rgba(45,212,191,0.2); color:#2dd4bf; padding:4px 10px; border-radius:6px;">Paso 9: Consultor SG-SST (Gemini 3.5 Lite)</span>
                <span style="background:rgba(255,255,255,0.08); padding:4px 10px; border-radius:6px;">Paso 10: Kanban</span>
                <span style="background:rgba(255,255,255,0.08); padding:4px 10px; border-radius:6px;">Paso 11: Gmail</span>
                <span style="background:rgba(255,255,255,0.08); padding:4px 10px; border-radius:6px;">Paso 12: Notificar WAPPY</span>
              </div>
            </div>
          </div>

          <!-- SLIDE 6: La Regla de Oro Pre-IA: 0 Tokens en Casos Negativos -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">EFICIENCIA &amp; AHORRO DE COSTOS</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">FILTRADO DETERMINISTA INTELIGENTE</span>
            </div>
            <h2 class="s-title">La Regla de Oro Pre-IA: <span class="accent-teal">0 Tokens en Casos Negativos</span></h2>
            <p class="slide-lead">
              El error más común de los desarrolladores novatos es enviar toda la base de datos a un modelo de IA en cada ejecución. En WAPPY aplicamos <strong>filtrado determinista previo</strong> que ahorra hasta un 95% en consumo de tokens.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">🛑 RAMA NO: 0 TOKENS</div>
                <h4>Todo en Orden</h4>
                <p>Si la condición determina que ningún EPP está vencido o pendiente, el flujo toma la salida NO y envía una alerta pasiva a WAPPY. <strong>Cero consumo de tokens de IA.</strong></p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">⚡ RAMA SÍ: AGENTE ACTIVO</div>
                <h4>Discrepancia Real</h4>
                <p>Solo cuando se detectan elementos fuera de norma se activa el <strong>Agente Consultor SG-SST</strong>, analizando únicamente los casos que requieren acción correctora.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">🛡️ MEMORIA ANTI-DUP</div>
                <h4>Ventana de 7 Días</h4>
                <p>El nodo de memoria bitácora evita enviar la misma alerta dos veces al colaborador en un lapso de 7 días, garantizando una comunicación sobria y profesional.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 7: Subagentes en Paralelo para Lotes de PDFs -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">ESCALABILIDAD EN ANTIGRAVITY</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASO XIOMARA ARDILA (CONTRATOS)</span>
            </div>
            <h2 class="s-title">Auditoría Masiva de PDFs con <span class="accent-lime">Subagentes en Paralelo</span></h2>
            <p class="slide-lead">
              Ante la inquietud de Xiomara Ardila sobre la renovación de contratos y revisión de cientos de PDFs, demostramos cómo orquestar subagentes en Google Antigravity para procesar lotes gigantescos sin saturar la memoria.
            </p>
            <div class="s-grid-3">
              <div class="s-card">
                <div class="sc-badge">📦 REPARTO POR LOTES</div>
                <h4>División del Trabajo</h4>
                <p>Una carpeta con 150 contratos digitales en PDF se divide automáticamente en paquetes de 15 documentos asignados a diferentes subagentes en paralelo.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">🔍 EXTRACCIÓN ESTRUCTURADA</div>
                <h4>Datos Clave</h4>
                <p>Cada subagente extrae: nombre del colaborador, fecha de vencimiento, cláusulas de prórroga, cargo y cumplimiento de requisitos legales SG-SST.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">📊 CONSOLIDADO FINAL</div>
                <h4>Matriz Unificada</h4>
                <p>El agente orquestador recibe las respuestas parciales y genera un informe ejecutivo en Excel o Markdown con alertas de vencimiento próximas a 30 días.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 8: Seguimiento Médico Ocupacional a 100 Trabajadores -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">SALUD OCUPACIONAL AUTOMATIZADA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASO GLORIA AMPARO QUINTERO</span>
            </div>
            <h2 class="s-title">Seguimiento Médico Ocupacional a <span class="accent-teal">100 Trabajadores</span></h2>
            <p class="slide-lead">
              Gloria Amparo Quintero planteó la gestión de 100 trabajadores evaluados periódicamente. Explicamos cómo este flujo lineal es de los más sencillos y de mayor impacto para implementar en cualquier empresa.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">1. CARPETA INBOX</div>
                <h4>Recepción de Conceptos</h4>
                <p>El prestador de salud ocupacional envía los certificados de aptitud médica a una carpeta de Google Drive o correo institucional.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">2. CLASIFICACIÓN IA</div>
                <h4>Apto / Con Restricciones</h4>
                <p>El agente extrae el concepto de aptitud, recomendaciones ergonómicas o reubicaciones temporales y actualiza la matriz sociodemográfica.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">3. ALERTAS A JEFATURAS</div>
                <h4>Notificación Segmentada</h4>
                <p>Envío automático de cartas de recomendaciones a los jefes directos, protegiendo el secreto profesional del diagnóstico médico (Resolución 2346).</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 9: Compromisos Oficiales del Grupo -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">PLAN DE ACCIÓN OFICIAL</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">8 COMPROMISOS ACORDADOS EN CLASE 4</span>
            </div>
            <h2 class="s-title">Compromisos &amp; Tareas Oficiales para la <span class="accent-lime">Clase 5</span></h2>
            <p class="slide-lead">
              Al finalizar la sesión, Félix Bedoya y los alumnos establecieron los compromisos necesarios para llegar a la Clase 5 con proyectos reales listos para parametrizar.
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <div class="sc-badge">👨‍🏫 FELIX BEDOYA</div>
                <h4>Compromisos del Docente</h4>
                <ul style="margin:8px 0 0 16px; font-size:13px; line-height:1.7; color:#e2e8f0;">
                  <li>Investigar y compartir guiones de optimización de rendimiento en Antigravity.</li>
                  <li>Compartir la página web oficial para verificar habilitación médica (ReTHUS).</li>
                  <li>Habilitar claves API únicas por proceso en WAPPY para ejecución simultánea.</li>
                </ul>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">👥 ALUMNOS &amp; EMPRESAS</div>
                <h4>Compromisos de los Participantes</h4>
                <ul style="margin:8px 0 0 16px; font-size:13px; line-height:1.7; color:#e2e8f0;">
                  <li><strong>Xiomara Ardila:</strong> Solicitar token administrativo de API de nómina y probar PDFs con subagentes.</li>
                  <li><strong>El Grupo:</strong> Esbozar el diagrama de flujo de la automatización que necesitan en su día a día.</li>
                  <li><strong>El Grupo:</strong> Documentar el paso a paso detallado para maquetarlo en vivo en la Clase 5.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- SLIDE 10: Próxima Sesión: Clase 5 en Vivo -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge coral s-kicker">🔴 PRÓXIMA SESIÓN EN VIVO · CLASE 5</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fecaca;">MARTES 17 DE NOVIEMBRE · 7:00 PM</span>
            </div>
            <h2 class="s-title">Próxima Parada: <span class="accent-lime">Puesta en Marcha de Flujos</span> &amp; Ecosistema Google</h2>
            <p class="slide-lead">
              En la <strong>Clase 5 en Vivo</strong> tomaremos los flujos dibujados por los alumnos y los implementaremos en tiempo real en WAPPY y Antigravity, conectando además <strong>Google NotebookLM</strong> (podcasts y resúmenes sin alucinación) y <strong>Google Flow</strong> (producción audiovisual de micro-cápsulas).
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">📅 FECHA &amp; HORA</div>
                <h4>Martes 17 de Noviembre</h4>
                <p>7:00 PM a 9:00 PM (Hora Colombia). Enlace oficial en Google Meet listo para ingresar con un clic.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">🎙️ NOTEBOOKLM</div>
                <h4>Podcasts a 2 Voces</h4>
                <p>Generación de resúmenes ejecutivos y audios explicativos de normas con 0% de alucinación basados en fuentes oficiales.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">🎬 GOOGLE FLOW</div>
                <h4>Videos de Capacitación</h4>
                <p>Creación de micro-cápsulas de 3.5 minutos y reels audiovisuales para pausas activas y formación de brigadistas.</p>
              </div>
            </div>
            <div style="margin-top:20px; text-align:center;">
              <a href="/clase5" class="btn btn-primary" style="font-size:15px; padding:14px 28px;">
                <span>🔴 Ver Sala y Temario de la Clase 5 →</span>
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
              🎥 Ver Grabación ↑
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
        <h2 class="sim-title" id="sim-title">Simulador de Tokens &amp; Costos en Tiempo Real</h2>
        <p class="sim-desc">
          Escribe cualquier texto, instrucción de flujo o condición lógica. Observa cómo el modelo de IA divide las palabras en tokens y cómo la regla de oro Pre-IA te permite ahorrar costos al filtrar antes de llamar a la IA.
        </p>

        <div class="sim-box">
          <textarea id="token-live-input" class="sim-textarea" rows="3" oninput="updateTokenSimulator()" placeholder="Escribe aquí tu prompt o regla condicional de flujo SG-SST...">Paso 4 Condición: ¿Existen trabajadores con elementos de protección personal (EPP) vencidos o pendientes de entrega en la sede principal? Si es NO, notificar en WAPPY y consumir 0 tokens.</textarea>

          <div class="sim-stats-row">
            <span class="sim-badge" id="token-stats-badge">Calculando tokens...</span>
            <span style="font-size:12px; color:#94a3b8; font-family:var(--font-mono);">MODELO: GEMINI 3.5 LITE / ANTIGRAVITY</span>
          </div>

          <div class="sim-output-wrap" id="token-pills-output">
            <!-- Chips de tokens generados dinámicamente -->
          </div>
        </div>
      </div>
    </section>

    <!-- ===========================================================
         PROMPTS COPIABLES DE LA CLASE 4
         =========================================================== -->
    <section class="prompts-section" id="prompts" aria-labelledby="prompts-title">
      <div class="prompts-container">
        <div class="prompts-header">
          <span class="slide-badge lime">PLANTILLAS CONVERSACIONALES DE ALTO IMPACTO</span>
          <h2 class="prompts-title" id="prompts-title">5 Prompts Maestros de la Clase 4 para Antigravity &amp; WAPPY</h2>
          <p class="prompts-lead">
            Copia estos prompts diseñados específicamente para estructurar flujos DAG, auditar exámenes médicos masivos, orquestar subagentes para lotes de contratos en PDF y conciliar aportes de nómina.
          </p>
        </div>

        <div class="prompt-cards-grid">
          <!-- Prompt 1 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag lime">FLUJOS DAG / TAREAS</span>
              <h4>1. Diseñador y Validador de Flujos DAG para el Lienzo WAPPY</h4>
            </div>
            <p class="p-desc">Estructura un flujo causal completo con disparador, lectura, compuerta Pre-IA determinista y salidas coordinadas.</p>
            <div class="p-code-box" id="prompt-p1">Actúa como Arquitecto de Automatizaciones SG-SST en WAPPY IA. Necesito diseñar un flujo de trabajo DAG estilo n8n para el módulo /tareas con estricta causalidad de izquierda a derecha.

Objetivo del flujo: [Describe la necesidad, ej: Control de vencimiento de extintores y botiquines].

Diseña la arquitectura en 4 etapas:
1. Disparador (Trigger): Define si es Cron programado (horario), comando de Tenshi (voz/chat), webhook o correo.
2. Fuente de Lectura: Especifica qué base de datos o módulo de WAPPY debe consultar (H3, H5, H10, etc.).
3. Condición Si/No (Pre-IA): Formula la compuerta determinista que evalúe si existen elementos fuera de norma. Si la respuesta es NO, finaliza con alerta pasiva consumiendo 0 tokens de IA.
4. Agente IA y Salidas: Si la respuesta es SÍ, activa al agente consultor con Gemini 3.5 Lite, memoria de empresa (NIT) y memoria bitácora anti-duplicados de 7 días. Genera salidas para Centro de Control Kanban, Bitácora Gmail y Alerta WAPPY.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p1', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>

          <!-- Prompt 2 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag teal">SALUD OCUPACIONAL</span>
              <h4>2. Auditor de Conceptos Médicos Ocupacionales (100 Trabajadores)</h4>
            </div>
            <p class="p-desc">Inspirado en el caso de Gloria Amparo Quintero: clasifica aptitud médica periódica y genera cartas de recomendaciones.</p>
            <div class="p-code-box" id="prompt-p2">Actúa como Especialista en Medicina Ocupacional y Gestión Documental SG-SST en Antigravity. Voy a proporcionarte una base de datos o extracto de certificados médicos de 100 trabajadores evaluados periódicamente.

Para cada registro:
1. Clasifica el concepto de aptitud: Apto sin restricciones, Apto con restricciones temporales/definitivas, o Aplazado.
2. Extrae las recomendaciones ergonómicas, visuales o de bioseguridad sin divulgar diagnósticos confidenciales (cumpliendo con la Resolución 2346 de 2007).
3. Estructura una matriz en Markdown con las columnas: Cédula, Cargo, Sede, Concepto de Aptitud, Fecha de Examen, Próximo Vencimiento y Recomendación Principal.
4. Redacta el borrador de correo formal para el jefe inmediato indicando las adecuaciones requeridas en el puesto de trabajo.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p2', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>

          <!-- Prompt 3 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag cyan">SUBAGENTES EN PARALELO</span>
              <h4>3. Orquestador de Subagentes para Lotes Masivos de Contratos PDF</h4>
            </div>
            <p class="p-desc">Inspirado en el caso de Xiomara Ardila: divide 100+ archivos PDF entre subagentes para auditoría veloz sin saturar tokens.</p>
            <div class="p-code-box" id="prompt-p3">Actúa como Orquestador Maestro de Google Antigravity. Tengo una carpeta con más de 100 contratos laborales y anexos en formato PDF que requieren auditoría de renovación urgente.

Ejecuta el protocolo multi-agente en paralelo:
1. Divide la lista total de archivos en lotes de 15 documentos por cada subagente especialista.
2. Para cada lote, un subagente debe extraer: Nombre completo, Número de identificación, Cargo, Fecha de inicio, Fecha de vencimiento, Cláusula de preaviso y Estado de afiliación a ARL/Seguridad Social.
3. Cada subagente debe retornar exclusivamente un archivo JSON o tabla Markdown limpia.
4. Como orquestador, consolida todos los lotes en una única matriz maestra y genera una sección de "Alertas Críticas" con los contratos que vencen en los próximos 30 días calendario.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p3', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>

          <!-- Prompt 4 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag amber">NÓMINA &amp; SEGURIDAD SOCIAL</span>
              <h4>4. Conciliador de Novedades de Seguridad Social (Sigo / Aportes)</h4>
            </div>
            <p class="p-desc">Concilia variaciones en pagos de aportes y redacta explicaciones claras y automáticas para los colaboradores.</p>
            <div class="p-code-box" id="prompt-p4">Actúa como Coordinador de Nómina y Seguridad Social en WAPPY IA. Tengo un reporte de novedades de liquidación de aportes (exportado de Sigo / Aportes en Línea) con discrepancias entre los valores reportados y los deducciones de los colaboradores.

Analiza los datos y realiza lo siguiente:
1. Identifica el motivo de cada variación: incapacidad temporal (EPS vs ARL), licencias no remuneradas, ingreso reciente, horas extras o variación de IBC.
2. Genera una tabla comparativa con: Nombre del Colaborador, Cédula, Valor Planilla, Valor Nómina, Diferencia y Causa Raíz.
3. Redacta una respuesta pedagógica, clara y respetuosa para resolver la inquietud del colaborador, citando la normativa colombiana aplicable (Decreto 1072 y Ley 100).</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p4', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>

          <!-- Prompt 5 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag purple">VERIFICACIÓN NORMATIVA</span>
              <h4>5. Verificador de Prestadores Médicos y Licencias SG-SST (ReTHUS)</h4>
            </div>
            <p class="p-desc">Audita las credenciales, especialidades y habilitaciones de los médicos ocupacionales antes de validar conceptos de aptitud.</p>
            <div class="p-code-box" id="prompt-p5">Actúa como Auditor de Cumplimiento Legal SG-SST en WAPPY IA. Necesito verificar la validez jurídica de un certificado médico ocupacional expedido por un proveedor externo.

Instrucciones de auditoría:
1. Extrae los datos del profesional emisor: Nombre, Cédula, Número de Licencia en Salud Ocupacional / SST y Resolución habilitante.
2. Comprueba que la licencia corresponda a Médico Especialista en Seguridad y Salud en el Trabajo (Resolución 754 de 2021).
3. Redacta el checklist de verificación para la carpeta del proveedor en el Sistema de Gestión, indicando si el prestador se encuentra habilitado para expedir conceptos de aptitud laboral.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p5', this)">📋 Copiar Prompt al Portapapeles</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ===========================================================
         GUÍA DE ESTUDIO PASO A PASO
         =========================================================== -->
    <section class="guide-section" id="guia-pasos" aria-labelledby="guide-title">
      <div class="guide-container">
        <span class="slide-badge lime">HOJA DE RUTA DE APRENDIZAJE</span>
        <h2 class="guide-title" id="guide-title">Guía de Implementación Paso a Paso</h2>
        <p class="guide-desc">Sigue estos 4 pasos prácticos para transformar los conceptos de la Clase 4 en automatizaciones reales en tu empresa antes de la próxima sesión en vivo.</p>

        <div class="guide-blocks-grid">
          <div class="g-block">
            <div class="g-num">1</div>
            <h4>Dibuja tu Flujo en Papel o Diagrama</h4>
            <p>Antes de abrir WAPPY o Antigravity, define los 4 elementos: ¿Cuál es el disparador? ¿Qué datos necesita leer? ¿Cuál es la condición Si/No que filtra en 0 tokens? ¿A dónde deben llegar los resultados?</p>
          </div>
          <div class="g-block">
            <div class="g-num">2</div>
            <h4>Prepara tus Credenciales o Archivos</h4>
            <p>Si tu software tiene API (como Sigo), solicita el token administrativo. Si no tiene API (como ARL Sura), descarga el archivo Excel representativo y guárdalo en la carpeta del proyecto.</p>
          </div>
          <div class="g-block">
            <div class="g-num">3</div>
            <h4>Configura la Condición Pre-IA</h4>
            <p>Asegúrate de que la rama NO no consuma tokens de IA. Configura alertas directas en WAPPY para casos en orden y reserva el modelo Gemini 3.5 Lite únicamente para las no conformidades.</p>
          </div>
          <div class="g-block">
            <div class="g-num">4</div>
            <h4>Conéctate a la Clase 5 en Vivo</h4>
            <p>Trae tu maquetación a la sesión en vivo del <strong>Martes 17 de Noviembre a las 7:00 PM</strong> para implementarla en tiempo real con el docente y conectar Google NotebookLM y Google Flow.</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- ===========================================================
       POPUP / MODAL DE NOTAS Y MEMORIAS OFICIALES (4 PESTAÑAS)
       =========================================================== -->
  <div class="notes-modal-backdrop" id="notes-modal" onclick="handleBackdropClick(event)">
    <div class="notes-modal-window" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
      <div class="notes-modal-header">
        <div class="notes-modal-title-wrap">
          <h3 id="notes-modal-title">📝 Notas Oficiales y Memorias · Clase IV: Flujos DAG, Lienzo WAPPY &amp; Subagentes</h3>
          <p>Fecha: Miércoles 11 de Noviembre de 2026 · Docente: Ing. Félix Bedoya · Duración: ~02:42 HRS · Registros Oficiales</p>
        </div>
        <button type="button" class="btn-close-modal" onclick="closeNotesModal()">✕ Cerrar Ventana</button>
      </div>

      <div class="notes-tabs-bar">
        <div class="notes-tab-group">
          <button type="button" class="notes-tab-btn active" id="ntab-all" onclick="switchNotesTab('all')">🌟 Ver Todo</button>
          <button type="button" class="notes-tab-btn" id="ntab-resumen" onclick="switchNotesTab('resumen')">📌 Resumen Ejecutivo</button>
          <button type="button" class="notes-tab-btn" id="ntab-pasos" onclick="switchNotesTab('pasos')">✅ Próximos Pasos (8 Compromisos)</button>
          <button type="button" class="notes-tab-btn" id="ntab-detalles" onclick="switchNotesTab('detalles')">⏱️ Minuto a Minuto (29 Bloques)</button>
        </div>
      </div>

      <div class="notes-modal-body">
        <!-- Tira de Enlaces Oficiales -->
        <div class="n-links-strip">
          <div style="font-size:12.5px; font-weight:800; color:#5eead4;">
            📎 Archivos Adjuntos y Registros Oficiales:
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="https://calendar.google.com/calendar/event?eid=MHVlaTRyb2RxcGJsaTk4Z3NlbDVwbjRpN28gZ3J1cG93YXBweUBt" target="_blank" rel="noopener" class="n-doc-btn">
              📅 Evento en Google Calendar
            </a>
            <a href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?usp=sharing" target="_blank" rel="noopener" class="n-doc-btn" style="border-color:#38bdf8; color:#bae6fd;">
              📄 Documento de Notas Oficiales
            </a>
            <a href="https://drive.google.com/file/d/1ZxLFxUgbdYhcNs2oX_llBig-IIsyT8Pd/view" target="_blank" rel="noopener" class="n-doc-btn" style="border-color:#f87171; color:#fecaca;">
              🎥 Video Grabación en Drive (02:42:04)
            </a>
          </div>
        </div>

        <!-- Pestaña 1: Resumen Ejecutivo -->
        <div class="notes-pane active" data-npane="resumen">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            📌 1. Resumen Ejecutivo de la Sesión
          </div>
          <div class="s-grid-2">
            <div class="s-card glow-lime n-section-card">
              <h4>🔀 Automatización de Procesos con Antigravity y Wappi</h4>
              <p>Transición estratégica desde el chat libre hacia la arquitectura de flujos dirigidos acíclicos (DAG) en el Lienzo WAPPY (/tareas). Demostración del catálogo de 55 flujos preestablecidos para resolver necesidades operativas en SG-SST.</p>
            </div>
            <div class="s-card glow-teal n-section-card">
              <h4>⚡ Límites de Uso y Cuotas de Tokens Explicadas</h4>
              <p>Aclaración sobre el funcionamiento de las ventanas de reinicio de cuotas (5 horas vs diarias) en Gemini 3.8 y Gemini 4 Argon. Las alertas indican límite de procesos temporales y no cobros adicionales. Técnicas de rotación de modelos y cuentas.</p>
            </div>
            <div class="s-card glow-cyan n-section-card">
              <h4>🔌 Integraciones en Colombia: API vs Web Scraping</h4>
              <p>Revisión técnica de software colombiano: Sigo y Aportes en Línea permiten conexión directa vía API con tokens administrativos, mientras que ARL Sura y Asopagos requieren scraping o carga estructurada de archivos Excel.</p>
            </div>
            <div class="s-card glow-purple n-section-card">
              <h4>🛡️ Condiciones Pre-IA &amp; Subagentes en Paralelo</h4>
              <p>Diseño de compuertas lógicas deterministas que filtran en la fuente, garantizando 0 consumo de tokens en casos sin anomalías. Orquestación de subagentes en Antigravity para procesar cientos de contratos en PDF simultáneamente.</p>
            </div>
          </div>
        </div>

        <!-- Pestaña 2: Próximos Pasos (8 Compromisos) -->
        <div class="notes-pane active" data-npane="pasos">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ✅ 2. Próximos Pasos y Compromisos de la Clase 4 (8 Tareas Oficiales)
          </div>
{pasos_cards_html}
        </div>

        <!-- Pestaña 3: Minuto a Minuto (29 Bloques) -->
        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ⏱️ 3. Bitácora Minuto a Minuto de la Reunión (00:03:16 – 02:40:40)
          </div>
{detalles_cards_html}
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

# Write client/public/clase4.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase4.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {{pub_path}} ({{len(html_content)}} bytes)")

# Write Desktop/clase4.html
desktop_path = '/Users/venta/Desktop/clase4.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {{desktop_path}} ({{len(html_content)}} bytes)")
'''

with open('scripts/generate_clase4_html.py', 'w', encoding='utf-8') as f:
    f.write(script_content)

print(f"Successfully wrote scripts/generate_clase4_html.py ({len(script_content)} bytes)")
