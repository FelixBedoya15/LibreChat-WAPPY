# -*- coding: utf-8 -*-
"""
Reconstruye scripts/generate_clase4_html.py y scripts/generate_clase5_html.py
usando 100% la estructura HTML, clases CSS y JS oficiales de WAPPY.CLUB (generate_clase3_html.py),
garantizando fidelidad visual absoluta y cero clases rotas.
"""
import os
import re

ROOT_DIR = '/Users/venta/Documents/GitHub/LibreChat-WAPPY'
C3_PATH = os.path.join(ROOT_DIR, 'scripts/generate_clase3_html.py')
NOTES4_PATH = '/Users/venta/.gemini/antigravity/brain/7f1d4fc2-a936-4534-95b4-3aca675de0ae/scratch/clase4_notes_full.txt'

with open(C3_PATH, 'r', encoding='utf-8') as f:
    c3_src = f.read()

# Extract CSS block exact (including <style>...</style>)
css_match = re.search(r'(<style>.*?</style>)', c3_src, re.DOTALL)
if not css_match:
    raise RuntimeError('No se pudo extraer <style> de generate_clase3_html.py')
CSS_BLOCK = css_match.group(1)

# Extract JS block exact (including <script>...</script>) and add defensive guard on viewport
js_match = re.search(r'(<script>.*?</script>)', c3_src, re.DOTALL)
if not js_match:
    raise RuntimeError('No se pudo extraer <script> de generate_clase3_html.py')
JS_BLOCK = js_match.group(1)

# Defensive guard for viewport touch gestures (already present if slide-viewport exists, but safer)
JS_BLOCK = JS_BLOCK.replace(
    "    const viewport = document.getElementById('slide-viewport');\n\n    viewport.addEventListener('touchstart'",
    "    const viewport = document.getElementById('slide-viewport') || document.getElementById('deck-stage');\n\n    if (viewport) viewport.addEventListener('touchstart'"
)
JS_BLOCK = JS_BLOCK.replace(
    "\n    viewport.addEventListener('touchend'",
    "\n    if (viewport) viewport.addEventListener('touchend'"
)

# Parse Clase 4 notes
with open(NOTES4_PATH, 'r', encoding='utf-8') as f:
    notes_raw = f.read()

pasos_items = []
pasos_match = re.search(r'Próximos pasos\n(.*?)(?=\n\nDetalles)', notes_raw, re.DOTALL)
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

detalles_items = []
detalles_match = re.search(r'Detalles\n(.*?)(?=\n\nTranscripción|\Z)', notes_raw, re.DOTALL)
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
            detalles_items.append((title, body, ts))

def esc_fstring(s):
    """Escapa llaves para insertar de forma segura dentro de un f-string de Python."""
    return s.replace('{', '{{').replace('}', '}}')

# Build Notas 4 HTML items using exact CSS classes from clase3
pasos_cards_html_list = []
for idx, (owner, title, desc) in enumerate(pasos_items, 1):
    pasos_cards_html_list.append(
        f'          <div class="n-task-item n-step-item">\n'
        f'            <span class="n-task-owner">{esc_fstring(owner)}</span>\n'
        f'            <div><strong>{idx}. {esc_fstring(title)}:</strong> {esc_fstring(desc)}</div>\n'
        f'          </div>'
    )
PASOS_C4_HTML = '\n'.join(pasos_cards_html_list)

TRANSCRIPCION_URL = "https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6"
detalles_cards_html_list = []
for idx, (title, body, ts_list) in enumerate(detalles_items, 1):
    # Clean timestamps from body text to avoid redundancy since they go in header .ts-link badges
    clean_body = re.sub(r'\s*\(\d{2}:\d{2}:\d{2}\)', '', body)
    for spk in ['FELIX BEDOYA', 'Gloria Amparo Quintero Giraldo', 'Carolina Colorado Cano', 'XIOMARA ARDILA', 'Maria Elena Obando Colonia', 'Gloria Amparo Quintero', 'Xiomara Ardila', 'Maria Elena Obando']:
        clean_body = clean_body.replace(spk, f'<strong>{spk}</strong>')
    ts_links = '\n                '.join(
        f'<a class="ts-link" href="{TRANSCRIPCION_URL}" target="_blank" rel="noopener noreferrer">{t}</a>'
        for t in ts_list
    )
    detalles_cards_html_list.append(
        f'          <div class="n-detail-card n-section-card n-timeline-item">\n'
        f'            <h4>\n'
        f'              <span>{idx}. {esc_fstring(title)}</span>\n'
        f'              <span>\n                {ts_links}\n              </span>\n'
        f'            </h4>\n'
        f'            <p>{esc_fstring(clean_body)}</p>\n'
        f'          </div>'
    )
DETALLES_C4_HTML = '\n'.join(detalles_cards_html_list)

# ==============================================================================
# BUILD scripts/generate_clase4_html.py
# ==============================================================================
clase4_py = f'''# -*- coding: utf-8 -*-
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
  <title>WAPPY IA · Clase 4: Flujos DAG, Lienzo WAPPY &amp; Subagentes Masivos | SOMOS SST</title>
  <meta name="description" content="Grabación Oficial y Memorias de la Clase 4: Antigravity + Wappy IA · Miércoles 11 de Noviembre (~02:42 HRS). Límites de cuotas y tokens, APIs vs Web Scraping (Sigo, Aportes en Línea, ARL Sura), arquitectura de flujos dirigidos acíclicos (DAG) en Lienzo WAPPY (/tareas), compuertas Pre-IA con 0 tokens y auditoría masiva de PDFs con subagentes.">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png?v=wappy" />
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png?v=wappy" />
  <link rel="shortcut icon" href="/assets/favicon-32x32.png?v=wappy" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon-180x180.png?v=wappy" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  {CSS_BLOCK}
</head>
<body>

  <!-- ========================================================================
       1. FLOATING NAVBAR OFICIAL WAPPY.CLUB
       ======================================================================== -->
  <div class="nav-wrap">
    <nav class="nav">
      <a href="#inicio" class="brand">
        <div class="brand-icon">
          <img src="{{cat_logo}}" alt="WAPPY IA">
        </div>
        <div class="brand-text">
          <div class="main">WAPPY<span>IA</span></div>
          <div class="sub">SOMOS SST · CLASE 4</div>
        </div>
      </a>

      <div class="nav-links">
        <a href="#presentacion" class="active-pill">🎬 Presentación</a>
        <a href="#grabacion">🎥 Grabación &amp; Notas</a>
        <a href="#prompts-chat">💬 Prompts Clase 4</a>
        <a href="#guia-paso-a-paso">📘 Guía Paso a Paso</a>
      </div>

      <div class="nav-actions" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <a href="/clase5" class="btn btn-glass" style="padding:8px 13px; font-size:12px;">
          Ir a Clase 5 🔴 ↗
        </a>
        <a id="navCtaEnterWappy" href="/login" class="nav-cta-wappy">
          <span>Ir a WAPPY</span>
        </a>
      </div>
    </nav>
  </div>

  <!-- ========================================================================
       1B. BARRA ORGANIZADORA DEL CURSO (CLASES 1 A 5 + TEMARIO)
       ======================================================================== -->
  <div class="course-organizer-strip" id="inicio">
    <nav class="course-organizer-inner" aria-label="Navegación oficial del curso">
      <a href="/cursowappy01" class="course-org-pill">🎓 Temario Curso</a>
      <a href="/clase1" class="course-org-pill done">✅ Clase 1 · Grabada</a>
      <a href="/clase2" class="course-org-pill done">✅ Clase 2 · Grabada</a>
      <a href="/clase3" class="course-org-pill done">✅ Clase 3 · Grabada</a>
      <a href="/clase4" class="course-org-pill active" aria-current="page">📍 Clase 4 · Estás aquí</a>
      <a href="/clase5" class="course-org-pill live">🔴 Clase 5 · Mar 17 Nov 7PM</a>
    </nav>
  </div>

  <!-- ========================================================================
       2. HERO OFICIAL ESTILO WAPPY.CLUB (SKY + NUBES + TENSHI)
       ======================================================================== -->
  <header class="hero">
    <div class="hero-cloud c1"></div>
    <div class="hero-cloud c2"></div>
    <div class="hero-cloud c3"></div>

    <div class="container hero-inner">
      <div>
        <div class="eyebrow">
          <span class="dot"></span>
          <span>✅ Clase 04 Grabada · Miércoles 11 de Noviembre · ~02:42 HRS</span>
        </div>

        <h1>
          Flujos DAG en <span class="highlight-lime">Lienzo WAPPY</span><br>Condiciones Pre-IA &amp; Subagentes Masivos
        </h1>

        <p class="hero-sub">
          Revive paso a paso cómo diseñar automatizaciones autónomas estilo n8n en el <strong>Lienzo WAPPY (/tareas)</strong> con los <strong>55 flujos curados</strong>, ahorrar hasta 100% de tokens con compuertas <strong>Pre-IA Si/No</strong>, entender las cuotas de <strong>Antigravity</strong>, conectar plataformas colombianas por <strong>API o Web Scraping</strong> (Sigo, Aportes en Línea, ARL Sura) y auditar cientos de PDFs con subagentes.
        </p>

        <div class="hero-ctas">
          <a href="#grabacion" class="btn btn-dark">
            🎥 Ver Grabación Clase 4
            <span class="arrow-pip">▶</span>
          </a>
          <button type="button" onclick="openNotesModal()" class="btn btn-lime">
            📋 Abrir Notas Oficiales (Popup)
          </button>
          <a href="#presentacion" class="btn btn-glass">
            🎬 Presentación (10 Slides)
            <span class="arrow-pip">↓</span>
          </a>
        </div>

        <div class="hero-pills-bar">
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔀 Arquitectura Visual</div>
            <div class="hero-pill-val">Lienzo DAG + 55 Flujos</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">⚡ Ahorro de Cuotas</div>
            <div class="hero-pill-val">Pre-IA Si/No (0 Tok en NO)</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔌 Integraciones Colombia</div>
            <div class="hero-pill-val">API (Sigo) vs Scraping (Sura)</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🤖 Escala Documental</div>
            <div class="hero-pill-val">Subagentes Lotes PDFs</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta Interactiva de Tenshi en el Hero -->
      <div class="hero-tenshi-card">
        <div class="hero-tenshi-glow"></div>
        <img src="{{tenshi_img}}" alt="Tenshi IA" class="tenshi-avatar-floating">
        <div class="tenshi-bubble">
          «¡Hola! Soy <strong>Tenshi</strong>. En esta <strong>Clase 4</strong> dejamos atrás el chat manual para construir <strong>flujos DAG en WAPPY</strong> con memoria anti-duplicados, compuertas Pre-IA de 0 tokens y trazabilidad de 100 exámenes médicos. ¡Revisa tus <strong>8 compromisos</strong> antes de la Clase 5!»
        </div>
        <div class="meet-live-strip">
          <div style="text-align:left;">
            <div style="font-size:10px; text-transform:uppercase; color:#99f6e4; font-weight:800;">Próxima Sesión: Clase 5 (Mar 17 Nov)</div>
            <div style="font-weight:900; color:#fff;">meet.google.com/yxv-gyhv-ron</div>
          </div>
          <a href="/clase5" class="btn btn-lime" style="padding:8px 14px; font-size:12px;">
            Ir a Clase 5 🔴 ↗
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- ========================================================================
       3. PRESENTACIÓN INTERACTIVA DE ALTO IMPACTO (10 DIAPOSITIVAS ANIMADAS)
       ======================================================================== -->
  <section class="presentation-section" id="presentacion">
    <div class="container">
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
            <span>WAPPY.CLUB // CLASE_04 // FLUJOS_DAG_LIENZO_WAPPY_Y_SUBAGENTES</span>
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
          <button class="slide-num-pill active" onclick="showSlide(1)">01 Portada</button>
          <button class="slide-num-pill" onclick="showSlide(2)">02 Tokens y Cuotas</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 APIs vs Scraping</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 Seguridad Datos IA</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 Flujo Real EPP</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 Condición Pre-IA</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 100 Exámenes Médicos</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 WAPPY vs Antigravity</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 Subagentes PDFs</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 Reto Clase 5</button>
        </div>

        <div class="slide-viewport" id="slide-viewport">

          <!-- SLIDE 1 -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge lime">🚀 Clase 4 Oficial · Miércoles 11 de Noviembre</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">DURACIÓN REAL: ~02:42 HRS</span>
            </div>
            <h2>De Chat Manual a <span class="accent-lime">Flujos DAG Autónomos</span> en <span class="accent-teal">Lienzo WAPPY</span></h2>
            <p class="slide-lead">
              Escribir textos básicos en la IA quedó en el pasado: el enfoque profesional consiste en diseñar <strong>disparadores y flujos de trabajo completos</strong> que ejecuten tareas recurrentes de Seguridad y Salud en el Trabajo de principio a fin sin supervisión constante.
            </p>
            <div class="s-grid-4">
              <div class="s-card glow-lime">
                <div style="font-size:24px; font-weight:900; color:var(--lime);">55 Flujos</div>
                <h4>Catálogo /tareas</h4>
                <p>Plantillas SG-SST curadas estilo n8n con causalidad estricta de izquierda a derecha.</p>
              </div>
              <div class="s-card glow-teal">
                <div style="font-size:24px; font-weight:900; color:var(--teal-bright);">0 Tokens</div>
                <h4>Compuertas Pre-IA</h4>
                <p>Filtros deterministas Si/No antes de encender el modelo IA para ahorrar hasta 95% de cuota.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#fcd34d;">API / Bot</div>
                <h4>Conexión Colombia</h4>
                <p>Sigo y Aportes en Línea vía API; ARL Sura y Asopagos vía scraping o lectura de Excel.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#a78bfa;">Paralelo</div>
                <h4>Subagentes PDFs</h4>
                <p>Renovación de contratos y análisis documental en lotes sin saturar el contexto.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 2 -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge teal">⏱️ Gestión de Tokens · 00:03 – 00:11</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">CASO GLORIA AMPARO QUINTERO</span>
            </div>
            <h2>Cuotas y Límites en <span class="accent-lime">Antigravity</span>: No son Cobros Extra</h2>
            <p class="slide-lead">
              Ante el agotamiento rápido de tokens en proyectos extensos (ej. app de lavandería), aclaramos cómo operan realmente las ventanas de reinicio en modelos como <strong>Gemini 3.8</strong> y cómo nunca detener tu producción:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🔄 Ventanas de 5 Horas o Diarias</h4>
                <p>Las alertas de límite indican que se alcanzó la cuota temporal de procesos incluida en el plan (no un cargo adicional en tarjeta) y se reinician automáticamente.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🔀 Alternar Modelos Activos</h4>
                <p>Si un modelo entra en pausa temporal, puedes rotar dentro del mismo proyecto entre variantes disponibles (Gemini, Claude, ChatGPT) sin perder el contexto.</p>
              </div>
              <div class="s-card">
                <h4>📧 Rotación de Cuentas / Perfiles</h4>
                <p>Para cargas masivas continuas, alternar perfiles o usar claves API dedicadas por proceso en WAPPY evita cualquier cuello de botella.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 3 -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔌 Ecosistema Empresarial · 00:11 – 00:41</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CAROLINA COLORADO &amp; XIOMARA ARDILA</span>
            </div>
            <h2>Integraciones en Colombia: <span class="accent-lime">APIs Oficiales</span> vs <span class="accent-teal">Web Scraping</span></h2>
            <p class="slide-lead">
              Evaluamos la viabilidad real de automatizar nómina, planillas PILA y certificados con los portales más usados por empresas colombianas:
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>✅ Con API Documentada: Siigo &amp; Aportes en Línea</h4>
                <p>
                  • Permiten generar <strong>claves API y tokens administrativos</strong> desde ajustes de administrador.<br>
                  • Ideales para liquidar novedades de planillas y responder automáticamente dudas de nómina a colaboradores.<br>
                  • Alternativa rápida: exportar Excel de nómina al proyecto y que el agente responda consultas por correo.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🌐 Sin API Pública: ARL Sura &amp; Asopagos</h4>
                <p>
                  • No exponen API abierta para desarrolladores externos.<br>
                  • Método aplicable: <strong>Web Scraping automatizado</strong> para consultar cédulas y descargar certificados, o lectura directa de archivos Excel.<br>
                  • <strong>Regla de oro:</strong> los conectores API y servidores MCP se instalan dentro de cada proyecto y no globalmente.
                </p>
              </div>
            </div>
          </div>

          <!-- SLIDE 4 -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge teal">🛡️ Privacidad &amp; Normativa · 00:25 – 00:36</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">CONFIANZA Y RESGUARDO</span>
            </div>
            <h2>Seguridad y Privacidad de Datos en <span class="accent-lime">Proyectos IA</span></h2>
            <p class="slide-lead">
              Gloria Amparo expresó inquietudes válidas sobre cargar información empresarial y personal. Revisamos cómo operan las garantías legales y cómo superar la fricción de adaptación:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-teal">
                <h4>📜 Cero Entrenamiento de Modelos</h4>
                <p>Bajo marcos regulatorios de EE. UU. y UE, las cuentas corporativas/API conservan respaldos temporales (hasta 30 días) sin utilizar tus datos para entrenar modelos públicos.</p>
              </div>
              <div class="s-card glow-lime">
                <h4>🗂️ Aislamiento de Información</h4>
                <p>La información SG-SST de matrices y políticas se mantiene encapsulada en carpetas privadas de proyecto, sin mezclarse entre empresas distintas.</p>
              </div>
              <div class="s-card">
                <h4>🧭 Superar la Curva Inicial</h4>
                <p>El principal obstáculo no es la seguridad técnica sino la familiarización con la navegación; practicar flujos simples diarios consolida el dominio.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 5 (CON CAPTURA REAL DEL LIENZO WAPPY ADJUNTADA POR EL USUARIO) -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔀 Caso Real en Pantalla · 00:43 – 01:15</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">LIENZO WAPPY (/TAREAS) · FLUJO EPP</span>
            </div>
            <h2>Anatomía del <span class="accent-lime">Lienzo WAPPY DAG</span>: Flujo Real de EPP</h2>
            <p class="slide-lead">
              Disección exacta del flujo trabajado en clase: desde los disparadores hasta las salidas coordinadas en Kanban, Gmail y WAPPY.
            </p>
            <div style="background:rgba(2,6,13,0.92); border:1.5px solid rgba(199,243,3,0.45); border-radius:18px; padding:12px; text-align:center;">
              <img src="{{lienzo_dag_img}}" alt="Lienzo WAPPY DAG - Flujo EPP y Perfiles de Cargo" style="width:100%; max-height:300px; object-fit:contain; border-radius:12px;">
              <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:6px; margin-top:10px; font-family:var(--font-mono); font-size:11px;">
                <span style="background:rgba(255,255,255,0.08); color:#e2e8f0; padding:3px 9px; border-radius:6px;">#1 Cron / #2 Tenshi</span>
                <span style="background:rgba(45,212,191,0.18); color:#5eead4; padding:3px 9px; border-radius:6px;">#3 Lectura H5 EPP</span>
                <span style="background:rgba(199,243,3,0.22); color:#c7f303; padding:3px 9px; border-radius:6px;">#4 Condición Pre-IA</span>
                <span style="background:rgba(139,92,246,0.22); color:#ddd6fe; padding:3px 9px; border-radius:6px;">#9 Consultor + #5 Gemini 3.5 Lite</span>
                <span style="background:rgba(255,255,255,0.08); color:#e2e8f0; padding:3px 9px; border-radius:6px;">#6 NIT / #7 Anti-dup 7d / #8 H2 Cargos</span>
                <span style="background:rgba(16,185,129,0.22); color:#6ee7b7; padding:3px 9px; border-radius:6px;">#10 Kanban · #11 Gmail · #12 WAPPY</span>
              </div>
            </div>
          </div>

          <!-- SLIDE 6 -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge teal">🛡️ Optimización &amp; Bloqueos · 01:07 – 01:30</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">PRE-IA + ANTI-DUPLICADOS</span>
            </div>
            <h2>Condiciones <span class="accent-lime">Pre-IA (0 Tokens)</span> y Memoria Bitácora</h2>
            <p class="slide-lead">
              Los flujos profesionales nunca despiertan a un modelo de IA si no hay novedades reales que procesar:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🛑 Rama NO = 0 Tokens</h4>
                <p>El nodo condicional (Paso #4) evalúa en código si hay EPP o exámenes vencidos. Si la respuesta es NO, solo registra alerta pasiva con <strong>0 consumo de IA</strong>.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🧠 Memoria Empresa + Cargos</h4>
                <p>Solo cuando la rama es SÍ se activa el Agente Consultor conectado al NIT de la empresa (Paso #6) y a Perfiles de Cargo H2 (Paso #8).</p>
              </div>
              <div class="s-card">
                <h4>⏳ Bitácora Anti-dup 7 Días</h4>
                <p>El nodo de Memoria Bitácora (Paso #7) recuerda a quién se notificó en los últimos 7 días para evitar bombardeo o correos duplicados.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 7 -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge lime">🩺 Salud Ocupacional · 01:02 – 01:06</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASO 100 EXÁMENES PERIÓDICOS</span>
            </div>
            <h2>Seguimiento Médico Automatizado a <span class="accent-lime">100 Trabajadores</span></h2>
            <p class="slide-lead">
              Ante el caso planteado por Gloria Amparo Quintero, diseñamos el flujo lineal completo para automatizar la trazabilidad médica desde el ingreso hasta el retiro:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-teal">
                <h4>1. Carpeta Centralizada</h4>
                <p>Todos los conceptos de aptitud médica periódica llegan a una única ruta vigilada automáticamente por el agente.</p>
              </div>
              <div class="s-card glow-lime">
                <h4>2. Clasificación &amp; Matriz</h4>
                <p>El flujo distingue resultados favorables o desfavorables/con restricciones y llena automáticamente la matriz de seguimiento ocupacional.</p>
              </div>
              <div class="s-card">
                <h4>3. Envío de Correos</h4>
                <p>Emite notificaciones a responsables y subflujos de seguimiento médico respetando la confidencialidad clínica.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 8 -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge teal">☁️ Arquitectura Dual · 01:40 – 02:10</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">NUBE VS LOCAL</span>
            </div>
            <h2>Comparativa Práctica: <span class="accent-lime">WAPPY Cloud</span> vs <span class="accent-teal">Antigravity Local</span></h2>
            <p class="slide-lead">
              Aclaramos la preocupación sobre consumo de recursos de cada entorno y cuándo conviene construir el flujo en WAPPY o en Antigravity:
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>☁️ Lienzo WAPPY (/tareas) — En la Nube 24/7</h4>
                <p>
                  • Corre en servidores de WAPPY sin requerir que tu computador esté encendido.<br>
                  • Conectado nativamente a tus 55 módulos SG-SST (H1–H10, Kanban, EPP, Vehículos PESV).<br>
                  • Consumo optimizado mediante filtros Pre-IA y claves API dedicadas por flujo.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>💻 Google Antigravity — Potencia Ilimitada Local</h4>
                <p>
                  • Ideal para crear nuevas aplicaciones web, hacer scraping de portales sin API o procesar archivos masivos en tu disco.<br>
                  • Permite lanzar subagentes paralelos e integrar proyectos desde cero mediante instrucciones claras en texto.
                </p>
              </div>
            </div>
          </div>

          <!-- SLIDE 9 -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge lime">📄 Escala Documental · 02:25 – 02:35</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASO XIOMARA ARDILA (CONTRATOS)</span>
            </div>
            <h2>Automatización Masiva de <span class="accent-lime">PDFs</span> con <span class="accent-teal">Subagentes</span></h2>
            <p class="slide-lead">
              Para gestionar renovaciones de contratos digitales o decenas de fichas sin agotar el contexto de una sola ventana:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>📦 División por Lotes</h4>
                <p>El agente orquestador reparte los archivos PDF en paquetes de 10 a 15 documentos por cada subagente trabajador.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>⚡ Ejecución Concurrente</h4>
                <p>Cada subagente lee exclusivamente su lote en contexto limpio, extrae fechas, cláusulas y novedades sin alucinaciones.</p>
              </div>
              <div class="s-card">
                <h4>📑 Consolidado Único</h4>
                <p>Al terminar, todo se unifica en una tabla Excel/HTML con alertas de renovación próxima y cartas listas para firmar.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 10 -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge amber">🔴 Compromisos &amp; Clase 5 · 02:35 – 02:42</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">MARTES 17 NOV · 7:00 PM</span>
            </div>
            <h2>8 Compromisos Pactados &amp; Rumbo a la <span class="accent-lime">Clase 5 en Vivo</span></h2>
            <p class="slide-lead">
              Por acuerdo del grupo (Gloria, Xiomara, Maria Elena y Félix), las sesiones continúan los <strong>martes a las 7:00 PM</strong>. Revisa los compromisos clave antes del martes:
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>📋 Tu Tarea Principal para el Martes 17</h4>
                <p>
                  • Dibujar o redactar paso a paso <strong>el flujo de automatización de tu empresa</strong> (Entrada ➔ Proceso ➔ Herramienta ➔ Salida).<br>
                  • Si aplica software de nómina (ej. Sigo), solicitar tokens/credenciales API.<br>
                  • Abrir los <strong>8 compromisos completos</strong> en el botón de Notas abajo.
                </p>
              </div>
              <div class="s-card glow-teal" style="display:flex; flex-direction:column; justify-content:center;">
                <h4>🚀 ¿Qué veremos en la Clase 5 en Vivo?</h4>
                <p style="margin-bottom:12px;">
                  Implementaremos en vivo los flujos diseñados por los alumnos, conectaremos <strong>Google NotebookLM</strong> (0% alucinación y podcasts 2 voces) y <strong>Google Flow</strong> audiovisual.
                </p>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" onclick="openNotesModal()" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
                    📋 Ver 8 Compromisos
                  </button>
                  <a href="/clase5" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
                    Ir a Clase 5 🔴 ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="deck-footer">
          <div class="deck-nav-group">
            <button class="btn-slide-ctrl" id="btn-prev" onclick="prevSlide()" disabled>← Anterior</button>
            <button class="btn-slide-ctrl primary-next" id="btn-next" onclick="nextSlide()">Siguiente Diapositiva →</button>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="#grabacion" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              🎥 Ver Grabación ↓
            </a>
            <a href="#prompts-chat" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              💬 Ir a los 5 Prompts ↓
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       3B. REPRODUCTOR DE LA GRABACIÓN OFICIAL + BOTÓN POPUP DE NOTAS Y MEMORIAS
       ======================================================================== -->
  <section class="recording-section" id="grabacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">🎥 Repetición Oficial Completa · Clase 4 (Miércoles 11 de Noviembre)</span>
          <h2 class="sec-big-title">Grabación de la Clase 4 &amp; Memorias Oficiales</h2>
        </div>
        <div style="font-size: 13px; color: var(--ink-muted); font-weight: 600;">
          💡 Reproduce aquí mismo la clase completa o abre debajo el <strong>Popup de Notas Oficiales (8 Compromisos y 29 Bloques)</strong>
        </div>
      </div>

      <!-- Escenario del Reproductor con el mismo estilo HUD que las Diapositivas -->
      <div class="deck-stage" id="video-stage">
        <div class="hud-corner tl"></div>
        <div class="hud-corner tr"></div>
        <div class="hud-corner bl"></div>
        <div class="hud-corner br"></div>

        <!-- Barra Superior de Telemetría del Reproductor -->
        <div class="deck-topbar">
          <div class="deck-telemetry">
            <span class="telemetry-dot"></span>
            <span>WAPPY.CLUB // GRABACIÓN_OFICIAL // CLASE_04_FLUJOS_DAG</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge">DURACIÓN: ~02:42 HRS · HD</span>
            <button type="button" class="btn-fullscreen" onclick="toggleVideoFullscreen()">
              ⛶ Pantalla Completa
            </button>
          </div>
        </div>

        <div class="deck-progress-track">
          <div class="deck-progress-fill" style="width: 100%;"></div>
        </div>

        <!-- Capítulos Rápidos de la Grabación -->
        <div class="recording-chapters-strip">
          <span class="rec-chapter-pill"><strong>00:03</strong> Tokens y Cuotas</span>
          <span class="rec-chapter-pill"><strong>00:11</strong> APIs vs Scraping</span>
          <span class="rec-chapter-pill"><strong>00:25</strong> Seguridad Datos IA</span>
          <span class="rec-chapter-pill"><strong>00:43</strong> Teoría Flujos DAG</span>
          <span class="rec-chapter-pill"><strong>01:02</strong> 100 Exámenes Médicos</span>
          <span class="rec-chapter-pill"><strong>01:06</strong> Lienzo WAPPY (55 Flujos)</span>
          <span class="rec-chapter-pill"><strong>01:35</strong> WAPPY vs Antigravity</span>
          <span class="rec-chapter-pill"><strong>02:25</strong> Subagentes PDFs &amp; Reto</span>
        </div>

        <!-- Reproductor Embebido 16:9 de Google Drive con Miniatura Oficial -->
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

              <!-- Columna Central: Logos WAPPY + Antigravity + CLASE 4 + Píldoras + Botón Play -->
              <div class="thumb-center-col">
                <div class="thumb-logos-pill">
                  <img src="{{wappy_horiz_logo}}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{{agy_logo}}" alt="Google Antigravity" class="agy-i">
                </div>

                <div class="thumb-clase-giant">CLASE 4</div>

                <div class="thumb-sub-title">
                  Flujos DAG <span>Lienzo WAPPY</span>, Condiciones <span>Pre-IA</span> &amp; Subagentes
                </div>

                <div class="thumb-topic-pills">
                  <span class="thumb-topic-pill">🔀 55 FLUJOS CURADOS</span>
                  <span class="thumb-topic-pill">⚡ PRE-IA (0 TOKENS)</span>
                  <span class="thumb-topic-pill">🔌 APIS VS SCRAPING</span>
                  <span class="thumb-topic-pill highlight">⏱️ 02:42 HRS · HD</span>
                </div>

                <div class="thumb-play-cta">
                  <span class="thumb-play-icon">▶</span>
                  <span>VER GRABACIÓN COMPLETA CLASE 4</span>
                </div>
              </div>

              <!-- Columna Derecha: Avatar 3D de Tenshi / WAPPY con Aureola -->
              <div class="thumb-char-col">
                <svg class="thumb-halo-svg" viewBox="0 0 200 60">
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#fde047" stroke-width="10"/>
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#ffffff" stroke-width="3.5" opacity="0.9"/>
                </svg>
                <img src="{{tenshi_img}}" alt="Tenshi WAPPY IA">
                <span class="thumb-char-tag" style="border-color:#2dd4bf; color:#2dd4bf;">✨ Tenshi IA · WAPPY</span>
              </div>
            </div>

            <iframe
              id="drive-video-iframe"
              src="https://drive.google.com/file/d/1ZxLFxUgbdYhcNs2oX_llBig-IIsyT8Pd/preview"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowfullscreen
              loading="lazy"
              title="Grabación Oficial Clase 4 - Flujos DAG, Lienzo WAPPY y Subagentes Masivos">
            </iframe>
          </div>
        </div>

        <!-- BARRA DEBAJO DEL VIDEO CON EL BOTÓN PARA ABRIR EL POPUP DE NOTAS -->
        <div class="notes-trigger-bar">
          <div class="notes-trigger-info">
            <h3>📝 Bitácora Oficial, Resumen, 8 Compromisos y Minuto a Minuto · Clase 4</h3>
            <p>Consulta todas las notas tomadas en la sesión del 11 de Noviembre, los 8 próximos pasos del grupo y el desglose completo con marcas de tiempo (00:03:16 – 02:40:40).</p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn-open-notes" onclick="openNotesModal()">
              📋 Abrir Notas Oficiales (Popup)
            </button>
          </div>
        </div>

        <!-- Footer del Reproductor -->
        <div class="deck-footer">
          <div class="deck-telemetry">
            <span>🔗 Enlaces directos a Notas, Transcripción y Video en Google Drive:</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <a href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?usp=sharing" target="_blank" rel="noopener noreferrer" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              📑 Documento de Notas
            </a>
            <a href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              📄 Ver Transcripción Completa
            </a>
            <a href="https://drive.google.com/file/d/1ZxLFxUgbdYhcNs2oX_llBig-IIsyT8Pd/view" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              ▶️ Abrir Video en Google Drive ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       MODAL / POPUP INTERACTIVO CON TODAS LAS NOTAS DE LA CLASE 4
       ======================================================================== -->
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
          <button type="button" class="notes-tab-btn" id="ntab-pasos" onclick="switchNotesTab('pasos')">✅ Próximos Pasos (8 Tareas)</button>
          <button type="button" class="notes-tab-btn" id="ntab-detalles" onclick="switchNotesTab('detalles')">⏱️ Minuto a Minuto (29 Bloques)</button>
        </div>
      </div>

      <div class="notes-modal-body">

        <div class="n-links-strip">
          <div style="font-size:12.5px; font-weight:800; color:#5eead4;">
            📎 Archivos Adjuntos y Registros Oficiales de la Reunión:
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="https://calendar.google.com/calendar/event?eid=MHVlaTRyb2RxcGJsaTk4Z3NlbDVwbjRpN28gZ3J1cG93YXBweUBt" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📅 Evento Calendar</a>
            <a href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?usp=sharing" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📑 Documento de Notas</a>
            <a href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📄 Transcripción Oficial</a>
            <a href="https://drive.google.com/file/d/1ZxLFxUgbdYhcNs2oX_llBig-IIsyT8Pd/view" target="_blank" rel="noopener noreferrer" class="n-doc-btn">🎥 Grabación en Drive</a>
          </div>
        </div>

        <!-- SECCIÓN 1: RESUMEN EJECUTIVO -->
        <div class="notes-pane active" data-npane="resumen">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            📌 1. Resumen Ejecutivo de la Sesión
          </div>
          <div class="s-grid-2">
            <div class="s-card glow-lime n-section-card">
              <h4>⚡ Límites, Cuotas de Tokens e Integraciones API</h4>
              <p>Se explicó la diferencia entre alertas de límite temporal (ciclos de 5 horas o diarios en Antigravity) y cobros extra, estrategias de rotación entre modelos (Gemini, Claude, ChatGPT) y la distinción técnica entre plataformas colombianas con API (<strong>Siigo, Aportes en Línea</strong>) y portales que requieren web scraping o Excel (<strong>ARL Sura, Asopagos</strong>).</p>
            </div>
            <div class="s-card glow-teal n-section-card">
              <h4>🔀 Flujos DAG en Lienzo WAPPY &amp; 55 Plantillas</h4>
              <p>Se presentó la arquitectura completa de automatizaciones en WAPPY (/tareas): disparadores (Cron, Tenshi, QR, Webhooks), lectura de bases, compuertas lógicas <strong>Pre-IA</strong> que ahorran el 100% de tokens cuando no hay novedades, memoria bitácora anti-duplicados y salida coordinada a Kanban y Gmail.</p>
            </div>
            <div class="s-card n-section-card">
              <h4>🩺 Seguimiento Médico &amp; Comparativa WAPPY vs Antigravity</h4>
              <p>Se estructuró el caso práctico de 100 exámenes médicos periódicos con actualización de matrices y envío segmentado, comparando el menor consumo y ejecución 24/7 en WAPPY Cloud frente a la potencia agéntica local de Antigravity.</p>
            </div>
            <div class="s-card n-section-card">
              <h4>📄 Subagentes Masivos en PDF &amp; Agenda Clase 5</h4>
              <p>Se definió cómo automatizar la renovación de contratos digitales en PDF mediante subagentes paralelos, y se pactó el horario oficial de los <strong>Martes a las 7:00 PM</strong> llegando con los bocetos de flujos empresariales listos.</p>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: PRÓXIMOS PASOS (8 TAREAS) -->
        <div class="notes-pane active" data-npane="pasos">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ✅ 2. Próximos Pasos y Compromisos de la Clase 4 (8 Tareas Oficiales)
          </div>
{PASOS_C4_HTML}
        </div>

        <!-- SECCIÓN 3: MINUTO A MINUTO (29 BLOQUES) -->
        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ⏱️ 3. Bitácora Minuto a Minuto de la Reunión (00:03:16 – 02:40:40)
          </div>
{DETALLES_C4_HTML}
        </div>

      </div>
    </div>
  </div>

  <!-- ========================================================================
       4. SECCIÓN ESTRELLA: LOS 5 PROMPTS ESTRATÉGICOS DE LA CLASE 4
       ======================================================================== -->
  <section class="prompts-section" id="prompts-chat">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">💬 Práctica Oficial Clase 4 · Copiar y Pegar</span>
          <h2 class="sec-big-title">5 Prompts Estratégicos Vistos en la Clase 4</h2>
        </div>
      </div>

      <div class="zero-code-banner">
        <div>
          <h3>🔀 De Solicitudes Sueltas a Flujos Completos (Entrada ➔ Condición Pre-IA ➔ Agente ➔ Salida)</h3>
          <p>
            Aplica la metodología vista en el Lienzo WAPPY y en Antigravity: antes de ejecutar cualquier proceso con IA, define qué datos lee, qué compuerta determinista filtra para no desperdiciar tokens y dónde entrega el informe o alerta final.
          </p>
        </div>
        <div class="zero-code-compare">
          <div style="color:#fca5a5; font-weight:800; margin-bottom:6px;">❌ Flujo Ingenuo (Costoso):</div>
          <div style="color:#cbd5e1; margin-bottom:10px; font-size:12px;">Enviar toda la base de datos al modelo IA en cada ejecución gastando cuota innecesariamente.</div>
          <div style="color:var(--lime); font-weight:800; margin-bottom:6px;">✅ Método Clase 4 (Profesional):</div>
          <div style="color:#ffffff; font-size:12px;"><strong>Condición Pre-IA</strong> (0 tokens en NO) + <strong>Memoria Anti-dup 7d</strong> + Subagentes por lotes.</div>
        </div>
      </div>

      <div class="prompt-cards-grid">

        <!-- PROMPT 1 -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 1 · Lienzo WAPPY DAG</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Causalidad + Pre-IA</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">1. Diseñador de Flujos DAG estilo n8n con Compuerta Pre-IA (0 Tokens)</h3>
            <p class="p-card-explain">
              Replica paso a paso la arquitectura del Lienzo WAPPY vista en clase (como el flujo real de Entrega de EPP y Perfiles de Cargo) con ahorro de tokens y prevención de duplicados.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en Tenshi / Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-1">Actúa como Arquitecto Senior de Flujos DAG en WAPPY IA (/tareas). Diseña un flujo automatizado estilo n8n con estricta causalidad de izquierda a derecha para resolver este proceso SG-SST en mi empresa: [EJ: Control de Entrega y Vencimiento de EPP / Extintores].

Estructura el flujo exactamente en estas 4 capas:
1. Disparadores (Entrada): Cron Programado semanal y comando bajo demanda vía Tenshi IA.
2. Fuente de Lectura y Condición Pre-IA (Si/No): Lee únicamente los registros del módulo correspondiente y evalúa determinísticamente si hay elementos vencidos o pendientes. Si la respuesta es NO, termina en alerta pasiva con 0 tokens consumidos.
3. Agente IA Principal (Solo en rama SÍ): Usa Gemini 3.5 Lite conectado a la Memoria de la Empresa (NIT), Memoria Bitácora Anti-duplicados de 7 días y Herramienta de consulta (ej. H2 Perfiles de Cargo).
4. Salidas Coordinadas: Actualiza etapa en Centro de Control (Kanban), envía Bitácora formal a Gmail y dispara notificación interna en WAPPY.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Diseño DAG listo para montar sin consumo ocioso de tokens.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-1', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 2 -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 2 · Caso Gloria (100 Exámenes)</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Salud Ocupacional</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">2. Trazabilidad Automatizada de 100 Exámenes Médicos Ocupacionales</h3>
            <p class="p-card-explain">
              Construye el flujo lineal de seguimiento desde ingreso hasta retiro, diferenciando resultados favorables/desfavorables sin exponer diagnósticos clínicos protegidos.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-2">Lee todos los certificados de aptitud médica ocupacional periódica que se encuentran en esta carpeta de mi proyecto.

Ejecuta este flujo de trazabilidad para los 100 trabajadores respetando la Resolución 2346 de 2007 (cero exposición de diagnósticos clínicos confidenciales):
1. Clasifica cada concepto en: Apto sin restricciones, Apto con recomendaciones/restricciones o Aplazado.
2. Extrae exclusivamente: Cédula, Nombre, Cargo, Fecha del examen, Concepto de aptitud y Recomendaciones ergonómicas o administrativas.
3. Actualiza la Matriz de Seguimiento Médico en Excel y genera una versión ejecutiva en HTML guardada en mi Escritorio resaltando en rojo los casos aplazados o desfavorables que requieren reubicación o seguimiento urgente.
4. Redacta el borrador de correo formal dirigido al jefe de área con las adecuaciones requeridas en el puesto de trabajo.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Matriz médica actualizada + alertas de seguimiento.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-2', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 3 -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 3 · Caso Xiomara (PDFs Paralelos)</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Subagentes Antigravity</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">3. Orquestador de Subagentes en Paralelo para Renovación Masiva de PDFs</h3>
            <p class="p-card-explain">
              Ideal cuando debes revisar decenas o cientos de contratos digitales, certificados o fichas técnicas sin saturar una sola ventana de conversación.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en Antigravity (Modo Turbo):</div>
              <div class="chat-prompt-text" id="prompt-3">Actúa como Orquestador Maestro en Antigravity. En esta carpeta tengo un lote masivo de contratos digitales y anexos en formato PDF que requieren revisión para su renovación.

Para optimizar al máximo la cuota de tokens y la precisión:
1. Lanza subagentes especialistas trabajando en paralelo, asignando lotes pequeños de máximo 12 archivos PDF a cada subagente.
2. Cada subagente debe extraer únicamente en formato estructurado: Nombre del colaborador, Cédula, Cargo, Fecha de inicio, Fecha de terminación, Cláusula de prórroga y Estado de documentos SST anexos.
3. Como orquestador, consolida las salidas parciales en una única tabla maestra y marca en color amarillo/rojo los contratos con vencimiento en los próximos 30 días.
4. Guarda el informe HTML consolidado y las cartas base de renovación listas en mi Escritorio.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Auditoría masiva por lotes sin alucinaciones ni cuelgues.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-3', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 4 -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 4 · Nómina &amp; Seguridad Social</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Sigo / Aportes / Excel</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">4. Conciliador Automático de Variaciones en Nómina y Planilla PILA</h3>
            <p class="p-card-explain">
              Resuelve rápidamente consultas de trabajadores sobre diferencias de aportes entre la nómina de la empresa y los pagos en Aportes en Línea o Sigo.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Proyecto:</div>
              <div class="chat-prompt-text" id="prompt-4">Analiza el archivo de Excel de nómina y el reporte de novedades de liquidación de planilla de seguridad social adjuntos en esta carpeta.

Necesito responder con claridad a los colaboradores que consultan por variaciones en sus deducciones o pagos:
1. Cruza por número de cédula los valores liquidados en nómina frente al IBC y días reportados en Aportes en Línea / PILA.
2. Identifica la causa exacta de cada diferencia: novedad de ingreso/retiro, incapacidad EPS o ARL, licencia no remunerada, vacaciones o variación de salario base / horas extras.
3. Genera un cuadro comparativo claro y redacta para cada caso con diferencia un borrador de respuesta cordial, técnica y comprensible para enviarle al trabajador por correo.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Conciliación inmediata + correos listos para colaboradores.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-4', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 5 -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 5 · Web Scraping &amp; Proyectos</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Portales sin API (Sura)</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">5. Extractor Estructurado de Certificados o Tablas de Portales Externos</h3>
            <p class="p-card-explain">
              Para plataformas que no cuentan con API pública (ej. ARL Sura o verificación de médicos habilitados), automatiza la verificación local y reporte.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Proyecto de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-5">Necesito automatizar la verificación de vigencia y descarga de certificados desde un portal web corporativo que no dispone de API abierta (solo acceso web con lista de cédulas o archivo Excel exportado).

Diseña una herramienta específica dentro de los complementos locales de ESTE proyecto únicamente:
1. Lee la lista de cédulas y fechas desde nuestro Excel maestro de trabajadores.
2. Prepara un script verificador seguro que valide los campos requeridos (estado de afiliación / habilitación profesional) y detecte si el portal solicita captcha para detenerse y pedirme intervención humana sin bloquear la cuenta.
3. Registra la fecha de verificación y alerta los casos inactivos o pendientes en un reporte limpio guardado en la carpeta del proyecto.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Herramienta local encapsulada por proyecto.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-5', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ========================================================================
       5. GUÍA PASO A PASO DETALLADA DE LA CLASE 4
       ======================================================================== -->
  <section class="guide-section" id="guia-paso-a-paso">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">📘 Resumen Pedagógico Completo · Clase 4</span>
          <h2 class="sec-big-title">Guía de Estudio Paso a Paso · Clase 4</h2>
        </div>
      </div>

      <div class="guide-blocks-grid">

        <!-- BLOQUE 1 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 1 · Cuotas, APIs y Datos</span>
            <span class="g-time">⏱️ Minutos 00:00 – 00:42</span>
          </div>
          <h3>Optimizar Tokens, Integrar Nómina y Proteger Datos</h3>
          <ul class="g-list">
            <li>
              <strong>1. Cómo interpretar alertas de límite:</strong>
              No significan cobros adicionales; indican pausas temporales (5 horas o diarias) que se sortean alternando modelos o rotando perfil/cuenta.
            </li>
            <li>
              <strong>2. API vs Web Scraping:</strong>
              Software como Sigo o Aportes en Línea admiten API/token; plataformas como ARL Sura o Asopagos se manejan mediante scraping controlado o exportación de Excel al proyecto.
            </li>
            <li>
              <strong>3. Alcance por proyecto:</strong>
              Toda integración API o conector MCP se configura dentro del proyecto específico de esa empresa para mantener orden y cero conflictos.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 2 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 2 · Lienzo WAPPY DAG</span>
            <span class="g-time">⏱️ Minutos 00:43 – 01:35</span>
          </div>
          <h3>Anatomía de los 55 Flujos y Compuertas Pre-IA</h3>
          <ul class="g-list">
            <li>
              <strong>1. Del chat al flujo causal:</strong>
              Un flujo parte de un disparador (Cron horario, Tenshi, QR, correo o webhook), consulta fuentes reales y entrega una solución cerrada.
            </li>
            <li>
              <strong>2. Compuerta Si/No Pre-IA:</strong>
              Filtrar antes de encender el agente (ej. ¿EPP vencidos?) logra <strong>0 tokens consumidos</strong> cuando todo está al día.
            </li>
            <li>
              <strong>3. Memoria Anti-duplicados:</strong>
              La bitácora de 7 días evita enviar alertas repetitivas, cerrando el ciclo con tablero Kanban, Gmail y notificación WAPPY.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 3 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 3 · Casos Reales &amp; Subagentes</span>
            <span class="g-time">⏱️ Minutos 01:35 – 02:35</span>
          </div>
          <h3>WAPPY Cloud vs Antigravity y Lotes de PDFs</h3>
          <ul class="g-list">
            <li>
              <strong>1. Seguimiento médico a 100 trabajadores:</strong>
              Carpeta única receptora + agente clasificador de aptitud + matriz automática y alertas confidenciales.
            </li>
            <li>
              <strong>2. Elegir el entorno correcto:</strong>
              Usa WAPPY (/tareas) para procesos continuos 24/7 en nube con claves independientes; usa Antigravity para desarrollos propios o scraping local.
            </li>
            <li>
              <strong>3. Subagentes para contratos PDF:</strong>
              Dividir los archivos en paquetes pequeños entre varios subagentes evita agotar la ventana de contexto.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 4 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 4 · Compromisos Clase 5</span>
            <span class="g-time">⏱️ Minutos 02:35 – 02:42</span>
          </div>
          <h3>Tu Tarea Obligatoria para el Martes 17 de Noviembre</h3>
          <ul class="g-list">
            <li>
              <strong>1. Dibuja o redacta tu flujo:</strong>
              Define entrada, fuente de lectura, condición Si/No y salida deseada de una automatización real de tu día a día.
            </li>
            <li>
              <strong>2. Prepara credenciales / archivos:</strong>
              Si usas nómina electrónica con API, solicita tu token; de lo contrario, trae un Excel o PDF representativo de prueba.
            </li>
            <li>
              <strong>3. Conecta en vivo el Martes 7:00 PM:</strong>
              Parametrizaremos tus bocetos en tiempo real junto con NotebookLM (0% alucinación) y Google Flow.
            </li>
          </ul>
        </div>

      </div>

      <!-- CTA Final hacia Clase 5 en Vivo y Sala de Google Meet -->
      <div class="final-cta-card">
        <div style="max-width: 640px;">
          <span style="color:var(--lime); font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
            🔴 Próxima Sesión en Vivo · Martes 17 de Noviembre · 7:00 PM
          </span>
          <h3 style="font-family:var(--font-display); font-size:clamp(20px, 2.6vw, 30px); font-weight:900; margin:6px 0 8px;">
            ¡Prepara tu Diagrama para la Clase 5: Flujos Alumnos, NotebookLM &amp; Flow!
          </h3>
          <p style="font-size:14px; color:#cbd5e1;">
            Revisa los 8 compromisos oficiales de esta Clase 4 en el popup de memorias, esboza el flujo que necesitas en tu empresa y entra a la página oficial de la Clase 5.
          </p>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="button" onclick="openNotesModal()" class="btn btn-glass">
            📋 Repasar Notas y 8 Compromisos
          </button>
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-glass">
            📹 Sala Google Meet ↗
          </a>
          <a href="/clase5" class="btn btn-lime">
            🔴 Ir a la Clase 5
            <span class="arrow-pip">↗</span>
          </a>
        </div>
      </div>

      <footer>
        <p><strong>WAPPY IA · SOMOS SST</strong> · Especialización Práctica en Agentes Autónomos para Seguridad y Salud en el Trabajo</p>
        <p style="margin-top:4px;">wappy.club/clase4 · Docente Líder: Ing. Félix Bedoya · Memorias Oficiales Clase 4 (Flujos DAG en Lienzo WAPPY, Condiciones Pre-IA &amp; Subagentes Masivos)</p>
      </footer>
    </div>
  </section>

  {JS_BLOCK}
</body>
</html>
\'\'\'

# Write to client/public/clase4.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase4.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {{pub_path}} ({{len(html_content)}} bytes)")

# Write to Desktop
desktop_path = '/Users/venta/Desktop/clase4.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {{desktop_path}} ({{len(html_content)}} bytes)")
'''

with open(os.path.join(ROOT_DIR, 'scripts/generate_clase4_html.py'), 'w', encoding='utf-8') as f:
    f.write(clase4_py)
print("Wrote clean scripts/generate_clase4_html.py")

# ==============================================================================
# BUILD scripts/generate_clase5_html.py
# ==============================================================================
clase5_py = f'''# -*- coding: utf-8 -*-
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
  <meta name="description" content="Clase 5 Oficial en Vivo: Antigravity + Wappy IA · Martes 17 de noviembre · 7:00 – 9:00 PM (America/Bogota) vía Google Meet (meet.google.com/yxv-gyhv-ron). Parametrización práctica en vivo de los flujos diseñados por los alumnos, Google NotebookLM 0% alucinación con podcasts a 2 voces, Google Flow audiovisual y claves API independientes.">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png?v=wappy" />
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png?v=wappy" />
  <link rel="shortcut icon" href="/assets/favicon-32x32.png?v=wappy" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon-180x180.png?v=wappy" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  {CSS_BLOCK}
</head>
<body>

  <!-- ========================================================================
       1. FLOATING NAVBAR OFICIAL WAPPY.CLUB
       ======================================================================== -->
  <div class="nav-wrap">
    <nav class="nav">
      <a href="#inicio" class="brand">
        <div class="brand-icon">
          <img src="{{cat_logo}}" alt="WAPPY IA">
        </div>
        <div class="brand-text">
          <div class="main">WAPPY<span>IA</span></div>
          <div class="sub">SOMOS SST · CLASE 5</div>
        </div>
      </a>

      <div class="nav-links">
        <a href="#presentacion" class="active-pill">🎬 Presentación</a>
        <a href="#grabacion">🔴 En Vivo &amp; Checklist</a>
        <a href="#prompts-chat">💬 Prompts Clase 5</a>
        <a href="#guia-paso-a-paso">📘 Guía Paso a Paso</a>
      </div>

      <div class="nav-actions" style="display:flex; align-items:center; gap:8px; flex-wrap:nowrap;">
        <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-glass" style="padding:8px 13px; font-size:12px; white-space:nowrap;">
          📹 Entrar a Meet
        </a>
        <a id="navCtaEnterWappy" href="/login" class="nav-cta-wappy" style="white-space:nowrap;">
          <span>Ir a WAPPY</span>
        </a>
      </div>
    </nav>
  </div>

  <!-- ========================================================================
       1B. BARRA ORGANIZADORA DEL CURSO (CLASES 1 A 5 + TEMARIO)
       ======================================================================== -->
  <div class="course-organizer-strip" id="inicio">
    <nav class="course-organizer-inner" aria-label="Navegación oficial del curso">
      <a href="/cursowappy01" class="course-org-pill">🎓 Temario Curso</a>
      <a href="/clase1" class="course-org-pill done">✅ Clase 1 · Grabada</a>
      <a href="/clase2" class="course-org-pill done">✅ Clase 2 · Grabada</a>
      <a href="/clase3" class="course-org-pill done">✅ Clase 3 · Grabada</a>
      <a href="/clase4" class="course-org-pill done">✅ Clase 4 · Grabada</a>
      <a href="/clase5" class="course-org-pill live active" aria-current="page">🔴 Clase 5 · Estás aquí (Mar 17 Nov · 7PM)</a>
    </nav>
  </div>

  <!-- ========================================================================
       2. HERO OFICIAL ESTILO WAPPY.CLUB (SKY + NUBES + TENSHI)
       ======================================================================== -->
  <header class="hero">
    <div class="hero-cloud c1"></div>
    <div class="hero-cloud c2"></div>
    <div class="hero-cloud c3"></div>

    <div class="container hero-inner">
      <div>
        <div class="eyebrow">
          <span class="dot" style="background:#ef4444; box-shadow:0 0 10px #ef4444;"></span>
          <span>🔴 En Vivo · Martes 17 de Noviembre · 7:00 – 9:00 PM (America/Bogota)</span>
        </div>

        <h1>
          Puesta en Marcha de <span class="highlight-lime">Flujos Alumnos</span><br>NotebookLM &amp; Google Flow Audiovisual
        </h1>

        <p class="hero-sub">
          Quinta sesión práctica oficial de <strong>Antigravity + Wappy IA</strong>. Construiremos en tiempo real los flujos DAG maquetados por cada empresa participante, conectaremos <strong>Google NotebookLM</strong> (0% alucinación normativa y podcasts a 2 voces), produciremos micro-cápsulas de capacitación con <strong>Google Flow (3.5 min)</strong> y habilitaremos <strong>claves API independientes</strong> por proceso.
        </p>

        <div class="hero-ctas">
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-dark">
            📹 Entrar a Google Meet (7:00 PM)
            <span class="arrow-pip">↗</span>
          </a>
          <button type="button" onclick="openNotesModal()" class="btn btn-lime">
            📋 Ver Checklist &amp; Requisitos (Popup)
          </button>
          <a href="#presentacion" class="btn btn-glass">
            🎬 Temario Interactivo (10 Slides)
            <span class="arrow-pip">↓</span>
          </a>
        </div>

        <div class="hero-pills-bar">
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔀 Taller en Vivo</div>
            <div class="hero-pill-val">Flujos por Empresa</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🎙️ Cero Alucinación</div>
            <div class="hero-pill-val">NotebookLM + Podcasts</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🎬 Videos 3.5 Min</div>
            <div class="hero-pill-val">Google Flow + Tenshi</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔑 Paralelismo</div>
            <div class="hero-pill-val">Claves API por Flujo</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta Interactiva de Tenshi en el Hero -->
      <div class="hero-tenshi-card">
        <div class="hero-tenshi-glow"></div>
        <img src="{{tenshi_img}}" alt="Tenshi IA" class="tenshi-avatar-floating">
        <div class="tenshi-bubble">
          «¡Hola! Soy <strong>Tenshi</strong>. Este <strong>Martes 17 de Noviembre</strong> pasamos del papel a producción: trae tu diagrama de flujo empresarial, un archivo de prueba y conéctate a las <strong>7:00 PM</strong> para construirlo juntos en WAPPY y NotebookLM!»
        </div>
        <div class="meet-live-strip">
          <div style="text-align:left;">
            <div style="font-size:10px; text-transform:uppercase; color:#fca5a5; font-weight:800;">🔴 Sala Oficial Google Meet (Mar 17 Nov)</div>
            <div style="font-weight:900; color:#fff;">meet.google.com/yxv-gyhv-ron</div>
          </div>
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:8px 14px; font-size:12px;">
            Unirse ahora ↗
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- ========================================================================
       3. PRESENTACIÓN INTERACTIVA DEL TEMARIO OFICIAL · CLASE 5 (10 SLIDES)
       ======================================================================== -->
  <section class="presentation-section" id="presentacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">✨ Temario Oficial · Próxima Emisión en Vivo (Clase 5)</span>
          <h2 class="sec-big-title">Diapositivas Interactivas de la Clase 5 (10 Slides)</h2>
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
            <span>WAPPY.CLUB // CLASE_05 // FLUJOS_ALUMNOS_NOTEBOOKLM_Y_GOOGLE_FLOW</span>
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
          <button class="slide-num-pill active" onclick="showSlide(1)">01 Portada En Vivo</button>
          <button class="slide-num-pill" onclick="showSlide(2)">02 Flujos Alumnos</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 NotebookLM 0% Alucinación</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 Podcasts 2 Voces</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 Google Flow 3.5m</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 Claves API Únicas</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 Workspace &amp; Tenshi</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 Auditoría Kanban</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 Checklist Previo</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 Sala Meet 7:00 PM</button>
        </div>

        <div class="slide-viewport" id="slide-viewport">

          <!-- SLIDE 1 -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge amber">🔴 Próxima Clase en Vivo · Martes 17 Nov · 7:00 PM</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fca5a5;">MEET: YXV-GYHV-RON</span>
            </div>
            <h2>De los Bocetos a Producción: <span class="accent-lime">Flujos Vivos</span> &amp; <span class="accent-teal">Ecosistema Google</span></h2>
            <p class="slide-lead">
              Tomaremos los diagramas y necesidades operativas preparadas tras la Clase 4 para implementarlos en directo, sumando <strong>Google NotebookLM</strong> (0% alucinación normativa) y <strong>Google Flow</strong> audiovisual.
            </p>
            <div class="s-grid-4">
              <div class="s-card glow-lime">
                <div style="font-size:24px; font-weight:900; color:var(--lime);">En Vivo</div>
                <h4>Flujos de Alumnos</h4>
                <p>Montaje real en Lienzo WAPPY (/tareas) y Antigravity de los procesos de cada participante.</p>
              </div>
              <div class="s-card glow-teal">
                <div style="font-size:24px; font-weight:900; color:var(--teal-bright);">0% Error</div>
                <h4>NotebookLM SST</h4>
                <p>Consultas jurídicas estrictas con citas textuales a Dec. 1072, Res. 0312 y GTC 45.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#fcd34d;">3.5 Min</div>
                <h4>Videos Google Flow</h4>
                <p>Micro-cápsulas de inducción, pausas activas y lecciones aprendidas de accidentalidad.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#a78bfa;">Paralelo</div>
                <h4>Claves API Únicas</h4>
                <p>Aislamiento de credenciales por proceso para correr flujos simultáneos sin bloqueos.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 2 -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔀 Bloque 1 · 7:00 – 7:35 PM</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASOS REALES DE PARTICIPANTES</span>
            </div>
            <h2>Implementación en Vivo: <span class="accent-lime">Flujos por Empresa</span></h2>
            <p class="slide-lead">
              Revisaremos y parametrizaremos los flujos priorizados por las empresas del grupo durante la semana:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>📄 Contratos Digitales (Xiomara)</h4>
                <p>Orquestación de subagentes paralelos en Antigravity para auditar vencimientos de contratos en PDF y conectar tokens de nómina.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🩺 100 Exámenes Médicos (Gloria)</h4>
                <p>Lectura automatizada de conceptos de aptitud periódica, matriz sociodemográfica y verificación de habilitación ReTHUS.</p>
              </div>
              <div class="s-card">
                <h4>🚛 Flota PESV &amp; EPP (Carolina)</h4>
                <p>Disparadores semanales con compuerta Pre-IA (0 tokens en NO) para vigilar vencimientos de SOAT, tecnomecánica y entregas EPP.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 3 -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge teal">🧠 Bloque 2 · 7:35 – 8:00 PM</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">GROUNDING ESTRICTO</span>
            </div>
            <h2>Google NotebookLM: <span class="accent-lime">Cerebro Normativo</span> con Cero Alucinación</h2>
            <p class="slide-lead">
              Conecta reglamentos internos, actas de COPASST y normatividad colombiana para obtener análisis jurídicos respaldados página por página:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-teal">
                <h4>📚 Fuentes Verificables</h4>
                <p>NotebookLM nunca inventa artículos legales: cada respuesta muestra citas clicables hacia el fragmento exacto del PDF o Google Doc.</p>
              </div>
              <div class="s-card glow-lime">
                <h4>🔗 Conexión vía MCP WAPPY</h4>
                <p>Integraremos los cuadernos de NotebookLM directamente con Tenshi para responder auditorías del Ministerio en segundos.</p>
              </div>
              <div class="s-card">
                <h4>🏢 Aislamiento por Cliente</h4>
                <p>Un cuaderno normativo maestro compartible y cuadernos privados exclusivos para cada empresa asesora.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 4 -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge lime">🎙️ Divulgación SST · 8:00 – 8:20 PM</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">AUDIO &amp; MAPAS MENTALES</span>
            </div>
            <h2>Podcasts a <span class="accent-lime">2 Voces</span> y Mapas Mentales Ejecutivos</h2>
            <p class="slide-lead">
              Transforma matrices legales extensas o procedimientos de 50 páginas en material digerible que tus trabajadores y gerentes sí consumen:
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🎧 Podcasts Técnicos en Español</h4>
                <p>Genera audios dinámicos donde dos locutores debaten peligros reales (alturas, riesgo químico, LOTO) listos para compartir por grupos de WhatsApp corporativos.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🗺️ Guías &amp; Mapas Mentales Gerenciales</h4>
                <p>Extrae automáticamente diagramas visuales y resúmenes ejecutivos de una hoja para presentar resultados del SG-SST ante la Alta Dirección.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 5 -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge teal">🎬 Bloque 3 · 8:20 – 8:40 PM</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">GOOGLE FLOW &amp; WAPPY STUDIO</span>
            </div>
            <h2>Google Flow: <span class="accent-lime">Micro-Cápsulas de Video</span> de 3.5 Minutos</h2>
            <p class="slide-lead">
              Rompe la monotonía de las charlas tradicionales produciendo piezas visuales y animaciones de alto impacto en minutos:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🎨 Afiches &amp; Señalética</h4>
                <p>Creación de gráficos preventivos, recordatorios de uso de EPP y campañas de cultura de autocuidado alineadas con tu marca.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>📽️ Clips con Avatares &amp; Voz</h4>
                <p>Micro-videos educativos de 3 a 3.5 minutos para inducciones, reinducciones y divulgación de lecciones aprendidas.</p>
              </div>
              <div class="s-card">
                <h4>⚡ Flujo Guion ➔ Render</h4>
                <p>Automatiza desde la redacción pedagógica del guion hasta la generación de escenas listas para proyectar.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 6 -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔑 Infraestructura WAPPY · 8:40 – 8:50 PM</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">COMPROMISO FÉLIX BEDOYA</span>
            </div>
            <h2>Claves API Independientes: <span class="accent-lime">Flujos Concurrentes</span> sin Bloqueos</h2>
            <p class="slide-lead">
              Revisaremos la configuración de credenciales independientes por proceso en WAPPY para garantizar estabilidad total:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🔑 Una Llave por Proceso</h4>
                <p>Cada automatización crítica (EPP, médicos, PESV) opera con su propia clave aislada sin interferir con los demás flujos.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>📊 Telemetría de Consumo</h4>
                <p>Visibilidad clara de cuántas ejecuciones y tokens consume cada proceso junto con su compuerta Pre-IA.</p>
              </div>
              <div class="s-card">
                <h4>🏥 Verificación ReTHUS</h4>
                <p>Entrega del recurso web prometido para validar en segundos si un médico tratante se encuentra activo y habilitado.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 7 -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge teal">🔌 Conectores Workspace · 8:50 – 9:00 PM</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">DRIVE · GMAIL · CALENDAR</span>
            </div>
            <h2>Ecosistema Workspace con <span class="accent-lime">Tenshi</span> al Mando</h2>
            <p class="slide-lead">
              Cierra el ciclo de automatización conectando las salidas de tus flujos DAG con las herramientas de oficina cotidianas:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-teal">
                <h4>📁 Google Drive Vivo</h4>
                <p>Lectura y archivado automático en carpetas clasificadas por mes, trabajador o comité paritario.</p>
              </div>
              <div class="s-card glow-lime">
                <h4>✉️ Bitácora Gmail</h4>
                <p>Notificaciones automáticas con trazabilidad y prevención anti-duplicados de 7 días.</p>
              </div>
              <div class="s-card">
                <h4>📅 Google Calendar</h4>
                <p>Programación de inspecciones planeadas, auditorías y vencimientos con recordatorios oportunos.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 8 -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge lime">📋 Control Operativo · RES. 0312</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CENTRO DE CONTROL KANBAN</span>
            </div>
            <h2>Supervisión Humana en el <span class="accent-lime">Centro de Control Kanban</span></h2>
            <p class="slide-lead">
              Cada hallazgo detectado por los flujos autónomos queda organizado visualmente para que el responsable de SST tome decisiones rápidas:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>📌 Etapas de Seguimiento</h4>
                <p>Visualización de hallazgos abiertos, acciones en curso y evidencias cargadas antes del cierre.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🛡️ Firma y Licencias</h4>
                <p>El responsable valida las acciones correctoras con respaldo normativo antes de archivar.</p>
              </div>
              <div class="s-card">
                <h4>📈 Indicadores PHVA</h4>
                <p>Actualización continua de tableros de gestión sin digitación manual repetitiva.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 9 -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge teal">✅ Lista de Chequeo</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">ANTES DE LAS 7:00 PM</span>
            </div>
            <h2>Checklist Obligatorio para Aprovechar la <span class="accent-lime">Clase 5 en Vivo</span></h2>
            <p class="slide-lead">
              Asegúrate de tener listos estos 4 requisitos antes de ingresar a Google Meet:
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>1. Tu Diagrama &amp; Archivos de Prueba</h4>
                <p>
                  • Borrador escrito o dibujado del flujo que quieres automatizar (Entrada ➔ Condición ➔ Salida).<br>
                  • 2 archivos de muestra (Excel o PDF no críticos) para probar en directo.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>2. Accesos Técnicos Abiertos</h4>
                <p>
                  • Sesión iniciada en <strong>app.wappy.club</strong> (/tareas) y Google Antigravity abierto.<br>
                  • Enlace de verificación médica ReTHUS o credenciales API de nómina (si ya las tramitaste).
                </p>
              </div>
            </div>
          </div>

          <!-- SLIDE 10 -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge amber">🔴 Transmisión en Directo · Meet</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fca5a5;">MARTES 17 NOV · 7:00 – 9:00 PM COT</span>
            </div>
            <h2>¡Nos Vemos en Sala! <span class="accent-lime">meet.google.com/yxv-gyhv-ron</span></h2>
            <p class="slide-lead">
              Conéctate puntual a las 6:55 PM para verificar tu audio y compartir pantalla si quieres que parametrizemos tu flujo empresarial en vivo.
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>⏮️ ¿Aún no viste la Clase 4?</h4>
                <p style="margin-bottom:12px;">
                  Repasa la grabación de ~02:42 hrs de Flujos DAG en Lienzo WAPPY, condiciones Pre-IA y los 8 compromisos oficiales.
                </p>
                <a href="/clase4" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
                  Ir a Grabación Clase 4 ⏮️
                </a>
              </div>
              <div class="s-card glow-teal" style="display:flex; flex-direction:column; justify-content:center;">
                <h4>🔴 Ingresar Directo a la Videoconferencia</h4>
                <p style="margin-bottom:12px;">
                  Martes 17 de Noviembre · 7:00 – 9:00 PM (Hora Colombia).
                </p>
                <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:10px 18px; font-size:13px;">
                  📹 Abrir Google Meet Ahora ↗
                </a>
              </div>
            </div>
          </div>

        </div>

        <div class="deck-footer">
          <div class="deck-nav-group">
            <button class="btn-slide-ctrl" id="btn-prev" onclick="prevSlide()" disabled>← Anterior</button>
            <button class="btn-slide-ctrl primary-next" id="btn-next" onclick="nextSlide()">Siguiente Diapositiva →</button>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="#grabacion" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              🔴 Ir a Sala Meet ↓
            </a>
            <a href="#prompts-chat" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              💬 Ir a los 5 Prompts ↓
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       3B. SALA EN VIVO GOOGLE MEET & MINIATURA HD "PRÓXIMA EMISIÓN" · CLASE 5
       ======================================================================== -->
  <section class="recording-section" id="grabacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">🔴 Emisión Oficial en Vivo · Martes 17 de Noviembre · 7:00 – 9:00 PM (America/Bogota)</span>
          <h2 class="sec-big-title">Sala Google Meet &amp; Grabación Oficial Clase 5</h2>
        </div>
        <div style="font-size: 13px; color: var(--ink-muted); font-weight: 600;">
          💡 Haz clic en la portada para entrar a <strong>Google Meet</strong>; al finalizar la clase quedará publicada aquí la grabación HD y las notas oficiales
        </div>
      </div>

      <div class="deck-stage" id="video-stage">
        <div class="hud-corner tl"></div>
        <div class="hud-corner tr"></div>
        <div class="hud-corner bl"></div>
        <div class="hud-corner br"></div>

        <div class="deck-topbar">
          <div class="deck-telemetry">
            <span class="telemetry-dot"></span>
            <span>WAPPY.CLUB // EMISIÓN_EN_VIVO // CLASE_05 // MEET: YXV-GYHV-RON</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge">MARTES 17 NOV · 7:00 – 9:00 PM COT</span>
            <button type="button" class="btn-fullscreen" onclick="toggleVideoFullscreen()">
              ⛶ Pantalla Completa
            </button>
          </div>
        </div>

        <div class="deck-progress-track">
          <div class="deck-progress-fill" style="width: 100%;"></div>
        </div>

        <div class="recording-chapters-strip">
          <span class="rec-chapter-pill"><strong>7:00 PM</strong> Flujos DAG de Alumnos en Vivo</span>
          <span class="rec-chapter-pill"><strong>7:35 PM</strong> NotebookLM 0% Alucinación</span>
          <span class="rec-chapter-pill"><strong>8:00 PM</strong> Podcasts SST a 2 Voces</span>
          <span class="rec-chapter-pill"><strong>8:20 PM</strong> Google Flow · Videos 3.5m &amp; APIs</span>
        </div>

        <!-- Portada HD 16:9 de Próxima Emisión en Vivo (Abre Google Meet) -->
        <div class="video-viewport-wrap">
          <div class="video-aspect-box">
            <div class="video-thumb-cover" id="video-thumb-cover" onclick="window.open('https://meet.google.com/yxv-gyhv-ron', '_blank')" role="button" tabindex="0" aria-label="Entrar a la videoconferencia de la Clase 5 en Google Meet">
              <img src="{{thumb_bg}}" alt="" class="video-thumb-bg-img" aria-hidden="true">
              <div class="video-thumb-radial-overlay"></div>
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{{felix_avatar}}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Insignia En Vivo + Logos + CLASE 5 + Píldoras + Botón Meet -->
              <div class="thumb-center-col">
                <div style="display:inline-flex; align-items:center; gap:8px; padding:5px 14px; border-radius:999px; background:rgba(220,38,38,0.22); border:1px solid rgba(248,113,113,0.65); color:#fecaca; font-size:11.5px; font-weight:900; letter-spacing:0.06em; margin-bottom:8px;">
                  🔴 EN VIVO · MARTES 17 NOV · 7:00 – 9:00 PM
                </div>

                <div class="thumb-logos-pill">
                  <img src="{{wappy_horiz_logo}}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{{agy_logo}}" alt="Google Antigravity" class="agy-i">
                </div>

                <div class="thumb-clase-giant">CLASE 5</div>

                <div class="thumb-sub-title">
                  Flujos Alumnos en Vivo, <span>NotebookLM</span> &amp; <span>Google Flow</span>
                </div>

                <div class="thumb-topic-pills">
                  <span class="thumb-topic-pill">🔀 FLUJOS DAG ALUMNOS</span>
                  <span class="thumb-topic-pill">🎙️ PODCASTS NOTEBOOKLM</span>
                  <span class="thumb-topic-pill">🎬 VIDEOS 3.5 MIN FLOW</span>
                  <span class="thumb-topic-pill highlight">🔑 CLAVES API ÚNICAS</span>
                </div>

                <div class="thumb-play-cta">
                  <span class="thumb-play-icon">▶</span>
                  <span>ENTRAR A LA VIDEOCONFERENCIA EN GOOGLE MEET ↗</span>
                </div>
              </div>

              <!-- Columna Derecha: Avatar 3D de Tenshi / WAPPY con Aureola -->
              <div class="thumb-char-col">
                <svg class="thumb-halo-svg" viewBox="0 0 200 60">
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#fde047" stroke-width="10"/>
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#ffffff" stroke-width="3.5" opacity="0.9"/>
                </svg>
                <img src="{{tenshi_img}}" alt="Tenshi WAPPY IA">
                <span class="thumb-char-tag" style="border-color:#2dd4bf; color:#2dd4bf;">✨ Tenshi IA · WAPPY</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BARRA DEBAJO DE LA PORTADA CON AVISO Y BOTÓN POPUP -->
        <div class="notes-trigger-bar">
          <div class="notes-trigger-info">
            <h3>🔴 Sala Oficial Activa · Grabación HD y Memorias al Finalizar la Sesión en Vivo</h3>
            <p>Evento oficial <strong>Antigravity + Wappy IA</strong> (Martes 17 de noviembre · 7:00 – 9:00 PM · <code>America/Bogota</code>). Tan pronto concluya la emisión en directo por Google Meet, quedará publicada aquí mismo la <strong>grabación completa en HD</strong> junto con las <strong>notas y memorias oficiales</strong>.</p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn-open-notes" onclick="openNotesModal()">
              📋 Datos de Sala y Checklist Previo (Popup)
            </button>
          </div>
        </div>

        <div class="deck-footer">
          <div class="deck-telemetry">
            <span>🔗 Enlace oficial confirmado para computador o celular: <strong>https://meet.google.com/yxv-gyhv-ron</strong></span>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <a href="/clase4" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              ⏮️ Repasar Clase 4 Grabada
            </a>
            <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              📹 Abrir Google Meet (yxv-gyhv-ron) ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       MODAL / POPUP INTERACTIVO DE SALA EN VIVO, CHECKLIST Y REQUISITOS CLASE 5
       ======================================================================== -->
  <div class="notes-modal-backdrop" id="notes-modal" onclick="handleBackdropClick(event)">
    <div class="notes-modal-window" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
      <div class="notes-modal-header">
        <div class="notes-modal-title-wrap">
          <h3 id="notes-modal-title">📋 Checklist Previo y Datos de Sala · Clase V en Vivo</h3>
          <p>Fecha: Martes 17 de Noviembre de 2026 · 7:00 – 9:00 PM (America/Bogota) · Google Meet: yxv-gyhv-ron</p>
        </div>
        <button type="button" class="btn-close-modal" onclick="closeNotesModal()">✕ Cerrar Ventana</button>
      </div>

      <div class="notes-tabs-bar">
        <div class="notes-tab-group">
          <button type="button" class="notes-tab-btn active" id="ntab-all" onclick="switchNotesTab('all')">🌟 Ver Todo</button>
          <button type="button" class="notes-tab-btn" id="ntab-resumen" onclick="switchNotesTab('resumen')">📌 Temario Clase 5</button>
          <button type="button" class="notes-tab-btn" id="ntab-pasos" onclick="switchNotesTab('pasos')">✅ Tareas Previas (Clase 4)</button>
          <button type="button" class="notes-tab-btn" id="ntab-detalles" onclick="switchNotesTab('detalles')">🛠️ Herramientas &amp; Accesos</button>
        </div>
      </div>

      <div class="notes-modal-body">

        <div class="n-links-strip">
          <div style="font-size:12.5px; font-weight:800; color:#5eead4;">
            📎 Enlaces de Conexión Directa Clase 5:
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📹 Sala Google Meet</a>
            <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📅 Calendario Recurrente</a>
            <a href="/clase4" class="n-doc-btn">⏮️ Repasar Clase 4</a>
          </div>
        </div>

        <div class="notes-pane active" data-npane="resumen">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            📌 1. Temario Oficial de la Clase 5
          </div>
          <div class="s-grid-2">
            <div class="s-card glow-lime n-section-card">
              <h4>🔀 Puesta en Marcha de Flujos de Alumnos</h4>
              <p>Parametrización en directo en el Lienzo WAPPY (/tareas) y Google Antigravity de los diagramas y necesidades operativas diseñadas por cada empresa participante.</p>
            </div>
            <div class="s-card glow-teal n-section-card">
              <h4>🎙️ Google NotebookLM &amp; Google Flow</h4>
              <p>Cuadernos normativos con 0% de alucinación, generación de podcasts SST a dos voces y producción audiovisual de micro-cápsulas de 3.5 minutos.</p>
            </div>
          </div>
        </div>

        <div class="notes-pane active" data-npane="pasos">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ✅ 2. Compromisos de Clase 4 que debes traer listos
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>1. Diagrama del Flujo:</strong> Traer dibujado o redactado el paso a paso de la automatización necesaria en tu empresa (Entrada ➔ Condición ➔ Salida).</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Xiomara Ardila</span>
            <div><strong>2. Credenciales / PDFs:</strong> Solicitar credenciales API de nómina y preparar carpeta de contratos digitales para ejecutar con subagentes.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya</span>
            <div><strong>3. Scripts, ReTHUS y Claves API:</strong> Compartir guiones de optimización en Antigravity, enlace verificador de médicos habilitados y asignación de claves únicas por proceso en WAPPY.</div>
          </div>
        </div>

        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            🛠️ 3. Accesos Recomendados en Computador
          </div>
          <div class="n-detail-card n-section-card">
            <h4><span>1. Plataforma WAPPY IA (/tareas) y Google Antigravity</span> <span class="ts-link">app.wappy.club</span></h4>
            <p>Mantén iniciada tu sesión para probar en directo las compuertas Pre-IA y tu proyecto empresarial exclusivo.</p>
          </div>
          <div class="n-detail-card n-section-card">
            <h4><span>2. Google NotebookLM &amp; Sala Meet</span> <span class="ts-link">meet.google.com/yxv-gyhv-ron</span></h4>
            <p>Ten a mano un PDF normativo o reglamento interno para convertirlo en cuaderno consultable y podcast en vivo.</p>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ========================================================================
       4. SECCIÓN ESTRELLA: LOS 5 PROMPTS OFICIALES DE LA CLASE 5
       ======================================================================== -->
  <section class="prompts-section" id="prompts-chat">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">💬 Práctica Oficial Clase 5 · Copiar y Pegar</span>
          <h2 class="sec-big-title">5 Prompts Oficiales de la Clase 5 (NotebookLM &amp; Flow)</h2>
        </div>
      </div>

      <div class="zero-code-banner">
        <div>
          <h3>🎙️ Conecta Normativa Verificable + Producción Audiovisual sin Alucinaciones</h3>
          <p>
            Utiliza estos 5 prompts durante la sesión del Martes 17 para alimentar NotebookLM con fuentes auditables, generar guiones de podcast a dos voces y producir micro-cápsulas de seguridad en Google Flow.
          </p>
        </div>
        <div class="zero-code-compare">
          <div style="color:#fca5a5; font-weight:800; margin-bottom:6px;">❌ Charlas Largas Sin Retención:</div>
          <div style="color:#cbd5e1; margin-bottom:10px; font-size:12px;">PDFs de 80 páginas que nadie lee ni comprende en planta.</div>
          <div style="color:var(--lime); font-weight:800; margin-bottom:6px;">✅ Método Clase 5 (Impacto):</div>
          <div style="color:#ffffff; font-size:12px;"><strong>NotebookLM 0% Error</strong> + <strong>Podcast 2 Voces</strong> + <strong>Micro-Video 3.5 min</strong>.</div>
        </div>
      </div>

      <div class="prompt-cards-grid">

        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 1 · NotebookLM Normativo</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Cero Alucinación</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">1. Curador de Fuentes y Matriz de Citas para Google NotebookLM</h3>
            <p class="p-card-explain">Organiza tus decretos, resoluciones y reglamentos internos antes de cargarlos para obtener citas jurídicas verificables al 100%.</p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en Antigravity / NotebookLM:</div>
              <div class="chat-prompt-text" id="prompt-1">Actúa como Especialista en Cumplimiento Normativo SG-SST. Analiza exclusivamente los documentos y normas cargadas en este cuaderno de mi empresa [Nombre].

Responde cumpliendo estas reglas estrictas:
1. Cero alucinación: Si un dato o artículo no figura en las fuentes suministradas, indícalo explícitamente sin suponer.
2. Cita exacta: Incluye junto a cada respuesta el nombre del documento fuente, artículo o numeral y número de página exacto.
3. Redacta una matriz ejecutiva con: Requisito Legal, Evidencia Existente en Empresa, Brecha Detectada y Plan de Cierre Prioritario.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Respuesta jurídica auditable con trazabilidad exacta.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-1', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 2 · Podcast a 2 Voces</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Divulgación Operativa</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">2. Diseñador de Podcast Pedagógico a Dos Voces para Operarios</h3>
            <p class="p-card-explain">Convierte un procedimiento largo en una conversación amena de audio ideal para compartir por WhatsApp en turnos de trabajo.</p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat:</div>
              <div class="chat-prompt-text" id="prompt-2">Basándote en nuestro procedimiento interno adjunto sobre [TEMA: Trabajo Seguro en Alturas / Bloqueo LOTO / Riesgo Químico], diseña una guía para Podcast a 2 voces en español colombiano cercano y claro:

- Locutor A (Ingeniero SST): Aporta precisión normativa y explica el riesgo real.
- Locutor B (Supervisor de Planta): Hace preguntas prácticas del día a día en campo.

Estructura en 5 minutos:
1. Gancho inicial (30s): Historia corta de un error común y cómo prevenirlo.
2. Reglas de oro (3.5m): Los 3 controles críticos explicados sin tecnicismos difíciles.
3. Cierre accionable (1m): Invitación a reportar condiciones inseguras en WAPPY antes de iniciar la tarea.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Guion o instrucción lista para Audio Overview en NotebookLM.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-2', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 3 · Google Flow Vídeo</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Micro-Cápsula 3.5 Min</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">3. Director Audiovisual para Micro-Videos de Capacitación (Google Flow)</h3>
            <p class="p-card-explain">Genera la secuencia visual y guion sincronizado para producir videos verticales o presentaciones educativas en WAPPY Studio / Flow.</p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en Antigravity / Flow:</div>
              <div class="chat-prompt-text" id="prompt-3">Actúa como Productor Audiovisual en WAPPY IA conectado a Google Flow. Quiero producir un micro-video de capacitación de 3 minutos y medio sobre: [TEMA DE SEGURIDAD].

Genera el guion técnico dividido en escenas cortas:
1. Portada Hero (2 segundos): Gancho visual directo con título gigante y fondo oscuro de alto contraste.
2. Desarrollo en bloques de 15 segundos: Cada bloque muestra UNA sola idea visual clave acompañada de su narración exacta en off.
3. Prompts visuales para Google Flow: Describe iluminación, encuadre limpio y acciones preventivas seguras en planta sin texto superpuesto innecesario.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Guion técnico + prompts de escena listos para render.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-3', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 4 · Flujos Alumnos + APIs</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Claves Independientes</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">4. Constructor de Flujo Empresarial con Clave API Dedicada</h3>
            <p class="p-card-explain">Traduce el boceto en papel que trajiste a la Clase 5 en una automatización real de /tareas con ejecución paralela segura.</p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar al iniciar tu flujo:</div>
              <div class="chat-prompt-text" id="prompt-4">Tengo el siguiente diagrama/boceto de automatización para mi empresa [DESCRIBIR TU FLUJO: disparador, archivo o módulo a consultar, condición y correo o reporte final].

Ayúdame a implementarlo paso a paso sin desperdiciar tokens:
1. Define la condición Pre-IA exacta que filtre los casos en orden con 0 tokens.
2. Configura una Memoria Bitácora Anti-duplicados para no repetir alertas en 7 días.
3. Estructura las salidas hacia Drive, Gmail y Centro de Control Kanban dejando el proceso listo para asignarle una clave API independiente en WAPPY.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Tu flujo empresarial listo para operar 24/7.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-4', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 5 · Triaje Workspace</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Gmail + Calendar</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">5. Clasificador Automático de Reportes y Agenda de Inspecciones</h3>
            <p class="p-card-explain">Enruta reportes de actos y condiciones inseguras recibidos por correo y agenda seguimientos urgentes en Calendar.</p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para conectar Workspace con Tenshi:</div>
              <div class="chat-prompt-text" id="prompt-5">Conéctate a mi flujo de notificaciones SG-SST. Cuando reciba un reporte de acto o condición insegura:

1. Clasifica automáticamente la severidad (Crítica, Alta, Media o Baja) según potencial de lesión o fatalidad.
2. Si es Crítica o Alta: envía alerta inmediata al responsable de área por Gmail y agenda automáticamente en Google Calendar una inspección prioritaria de 30 minutos para el mismo día.
3. Si es Media o Baja: registra el hallazgo en la matriz de seguimiento semanal y responde agradeciendo el reporte al trabajador.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Triaje inteligente conectado a tu agenda y correo.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-5', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ========================================================================
       5. TEMARIO PASO A PASO DE LA CLASE 5 (4 BLOQUES INTENSIVOS · 7:00 – 9:00 PM)
       ======================================================================== -->
  <section class="guide-section" id="guia-paso-a-paso">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">📘 Hoja de Ruta en Vivo · Clase 5</span>
          <h2 class="sec-big-title">Temario Paso a Paso de la Clase 5 (Martes 17 Nov)</h2>
        </div>
      </div>

      <div class="guide-blocks-grid">

        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 1 · Flujos de Alumnos</span>
            <span class="g-time">⏰ 7:00 PM – 7:35 PM</span>
          </div>
          <h3>Puesta en Marcha de Flujos Empresariales</h3>
          <ul class="g-list">
            <li><strong>1. Revisión de bocetos del grupo:</strong> análisis rápido de los flujos traídos por los participantes.</li>
            <li><strong>2. Montaje en Lienzo WAPPY y Antigravity:</strong> conexión de disparadores, condiciones Pre-IA y salidas Kanban/Gmail.</li>
          </ul>
        </div>

        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 2 · NotebookLM</span>
            <span class="g-time">⏰ 7:35 PM – 8:20 PM</span>
          </div>
          <h3>0% Alucinación, Citas Exactas y Podcasts</h3>
          <ul class="g-list">
            <li><strong>1. Carga normativa estructurada:</strong> Decretos, Resoluciones y manuales internos con citas verificables.</li>
            <li><strong>2. Podcasts a dos voces &amp; mapas:</strong> audio explicativo listo para operarios y síntesis gerenciales.</li>
          </ul>
        </div>

        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 3 · Google Flow</span>
            <span class="g-time">⏰ 8:20 PM – 8:40 PM</span>
          </div>
          <h3>Producción Audiovisual de Capacitaciones</h3>
          <ul class="g-list">
            <li><strong>1. Micro-cápsulas de 3.5 minutos:</strong> guiones de alto impacto y generación visual con Google Flow.</li>
            <li><strong>2. Campañas SST sin apatía:</strong> afiches, señalética y videos cortos para inducción y pausas activas.</li>
          </ul>
        </div>

        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 4 · APIs &amp; Cierre</span>
            <span class="g-time">⏰ 8:40 PM – 9:00 PM</span>
          </div>
          <h3>Claves API Independientes &amp; Verificación Médica</h3>
          <ul class="g-list">
            <li><strong>1. Aislamiento por proceso:</strong> llaves independientes en WAPPY para correr varios flujos a la vez.</li>
            <li><strong>2. Recurso ReTHUS &amp; Q&amp;A:</strong> entrega de enlace para validar médicos habilitados y soporte técnico.</li>
          </ul>
        </div>

      </div>

      <div class="final-cta-card">
        <div style="max-width: 640px;">
          <span style="color:var(--lime); font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
            🔴 Sala en Vivo · Martes 17 de Noviembre · 7:00 PM (Hora Colombia)
          </span>
          <h3 style="font-family:var(--font-display); font-size:clamp(20px, 2.6vw, 30px); font-weight:900; margin:6px 0 8px;">
            ¡Entra puntual a la Clase 5 con tu Flujo Listo!
          </h3>
          <p style="font-size:14px; color:#cbd5e1;">
            Guarda el enlace de Google Meet y repasa el checklist previo en el popup antes de conectarte con el Ing. Félix Bedoya.
          </p>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="button" onclick="openNotesModal()" class="btn btn-glass">
            📋 Ver Checklist Previo
          </button>
          <a href="/clase4" class="btn btn-glass">
            ⏮️ Repasar Clase 4
          </a>
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime">
            📹 Entrar a Google Meet ↗
          </a>
        </div>
      </div>

      <footer>
        <p><strong>WAPPY IA · SOMOS SST</strong> · Especialización Práctica en Agentes Autónomos para Seguridad y Salud en el Trabajo</p>
        <p style="margin-top:4px;">wappy.club/clase5 · Docente Líder: Ing. Félix Bedoya · Sesión Oficial Clase 5 (Flujos Alumnos en Vivo, NotebookLM &amp; Google Flow)</p>
      </footer>
    </div>
  </section>

  {JS_BLOCK}
</body>
</html>
\'\'\'

# Write to client/public/clase5.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase5.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {{pub_path}} ({{len(html_content)}} bytes)")

# Write to Desktop
desktop_path = '/Users/venta/Desktop/clase5.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {{desktop_path}} ({{len(html_content)}} bytes)")
'''

with open(os.path.join(ROOT_DIR, 'scripts/generate_clase5_html.py'), 'w', encoding='utf-8') as f:
    f.write(clase5_py)
print("Wrote clean scripts/generate_clase5_html.py")
