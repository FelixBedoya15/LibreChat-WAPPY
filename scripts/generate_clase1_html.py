import os
import base64

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
tenshi_img = get_base64_img('client/public/assets/tenshi.png')

html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>Clase 1: Google Antigravity & Ecosistema Autónomo SST | WAPPY IA</title>
  <meta name="description" content="Presentación interactiva y guía paso a paso para la Clase 1 del Curso Ecosistema Autónomo SST. Martes 20 de Octubre · 7:00 PM Col.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Fira+Code:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --lime: #c7f303;
      --lime-hover: #b5de02;
      --lime-glow: rgba(199, 243, 3, 0.35);
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-400: #94a3b8;
      --slate-200: #e2e8f0;
      --slate-100: #f1f5f9;
      --bg: #f8fafc;
      --surface: #ffffff;
      --teal: #0d9488;
      --teal-dark: #042f2e;
      --teal-light: #f0fdfa;
      --teal-border: #99f6e4;
      --amber: #f59e0b;
      --amber-light: #fffbeb;
      --red: #ef4444;
      --font-display: "Plus Jakarta Sans", "Inter", -apple-system, sans-serif;
      --font-ui: "Inter", -apple-system, sans-serif;
      --font-code: "Fira Code", monospace;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}

    html {{
      scroll-behavior: smooth;
      scroll-padding-top: 90px;
    }}

    body {{
      font-family: var(--font-ui);
      background-color: var(--bg);
      color: var(--slate-900);
      line-height: 1.55;
      overflow-x: hidden;
      padding-bottom: 90px;
    }}

    a {{
      text-decoration: none;
      color: inherit;
    }}

    .wrap {{
      max-width: 1040px;
      margin: 0 auto;
      padding: 0 16px;
    }}

    /* ==========================================================================
       TOP LIVE BAR
       ========================================================================== */
    .top-live-bar {{
      background: linear-gradient(90deg, #042f2e 0%, #0f766e 50%, #042f2e 100%);
      color: #ffffff;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      text-align: center;
      border-bottom: 1px solid rgba(94, 234, 212, 0.25);
    }}

    .live-pulse {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(239, 68, 68, 0.25);
      border: 1px solid #ef4444;
      color: #fecaca;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}

    .live-dot {{
      width: 7px;
      height: 7px;
      background-color: #ef4444;
      border-radius: 50%;
      box-shadow: 0 0 8px #ef4444;
      animation: pulse 1.5s infinite;
    }}

    @keyframes pulse {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.4; transform: scale(1.3); }}
    }}

    /* ==========================================================================
       FLOATING CAPSULE NAVBAR
       ========================================================================== */
    .nav-wrap {{
      position: sticky;
      top: 12px;
      z-index: 100;
      padding: 0 16px;
      margin-bottom: 16px;
    }}

    .nav-inner {{
      max-width: 1040px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
      border-radius: 999px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px 0 18px;
    }}

    .nav-logo {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .nav-logo img {{
      height: 32px;
      object-fit: contain;
    }}

    .nav-tag {{
      display: none;
      font-size: 11px;
      font-weight: 800;
      background: #f0fdfa;
      color: #0f766e;
      border: 1px solid #99f6e4;
      padding: 3px 8px;
      border-radius: 999px;
    }}

    @media (min-width: 640px) {{
      .nav-tag {{ display: inline-block; }}
    }}

    .nav-actions {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .btn-meet-nav {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 999px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
      transition: all 0.2s ease;
    }}

    .btn-meet-nav:hover {{
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.4);
    }}

    /* ==========================================================================
       HERO PRESENTATION SECTION
       ========================================================================== */
    .hero {{
      background: linear-gradient(145deg, #042f2e 0%, #0f766e 60%, #115e59 100%);
      border-radius: 24px;
      padding: 32px 24px;
      color: #ffffff;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(15, 118, 110, 0.18);
    }}

    .hero-bg-glow {{
      position: absolute;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(199, 243, 3, 0.22) 0%, transparent 70%);
      top: -80px;
      right: -80px;
      border-radius: 50%;
      pointer-events: none;
    }}

    .hero-badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.28);
      color: #ccfbf1;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
    }}

    .hero h1 {{
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 900;
      line-height: 1.2;
      color: #ffffff;
      margin-bottom: 10px;
    }}

    @media (min-width: 640px) {{
      .hero h1 {{ font-size: 34px; }}
    }}

    .hero-sub {{
      font-size: 14px;
      color: #a7f3d0;
      line-height: 1.5;
      max-width: 680px;
      margin-bottom: 20px;
    }}

    .hero-meta-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 24px;
    }}

    @media (min-width: 640px) {{
      .hero-meta-grid {{ grid-template-columns: repeat(4, 1fr); }}
    }}

    .hero-meta-item {{
      background: rgba(0, 0, 0, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 14px;
      padding: 10px 14px;
    }}

    .hero-meta-label {{
      font-size: 10px;
      font-weight: 700;
      color: #99f6e4;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }}

    .hero-meta-val {{
      font-size: 13px;
      font-weight: 800;
      color: #ffffff;
    }}

    .hero-cta-box {{
      background: rgba(255, 255, 255, 0.12);
      border: 1.5px solid #5eead4;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
      backdrop-filter: blur(8px);
    }}

    @media (min-width: 640px) {{
      .hero-cta-box {{
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }}
    }}

    .hero-cta-info h3 {{
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 2px;
    }}

    .hero-cta-info p {{
      font-size: 12px;
      color: #ccfbf1;
    }}

    .hero-cta-btn {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      color: #042f2e;
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 900;
      padding: 12px 24px;
      border-radius: 999px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
      white-space: nowrap;
    }}

    .hero-cta-btn:hover {{
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      background: #f0fdfa;
    }}

    /* ==========================================================================
       SECTION HEADERS
       ========================================================================== */
    .sec-header {{
      margin-bottom: 16px;
      margin-top: 32px;
    }}

    .sec-tag {{
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      background: #ccfbf1;
      color: #0f766e;
      border: 1px solid #99f6e4;
      padding: 2px 8px;
      border-radius: 999px;
      margin-bottom: 6px;
    }}

    .sec-title {{
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 900;
      color: var(--slate-900);
      line-height: 1.25;
    }}

    .sec-sub {{
      font-size: 13px;
      color: var(--slate-600);
      margin-top: 4px;
    }}

    /* ==========================================================================
       RULES GRID (6 CARDS)
       ========================================================================== */
    .rules-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }}

    @media (min-width: 640px) {{
      .rules-grid {{ grid-template-columns: 1fr 1fr; }}
    }}

    .rule-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-left: 4px solid var(--teal);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      transition: transform 0.2s ease;
    }}

    .rule-card:hover {{
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.05);
    }}

    .rule-card.urgent {{
      border-left-color: var(--amber);
      background: #fffbeb;
      border-color: #fde68a;
    }}

    .rule-top {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }}

    .rule-title {{
      font-size: 14px;
      font-weight: 800;
      color: var(--slate-900);
    }}

    .rule-badge {{
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      text-transform: uppercase;
    }}

    .badge-amber {{
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }}

    .badge-teal {{
      background: #ccfbf1;
      color: #0f766e;
      border: 1px solid #99f6e4;
    }}

    .rule-desc {{
      font-size: 12px;
      color: var(--slate-700);
      line-height: 1.45;
    }}

    /* ==========================================================================
       PASO A PASO TIMELINE (4 MODULES)
       ========================================================================== */
    .step-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      position: relative;
    }}

    .step-header {{
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--slate-100);
      padding-bottom: 12px;
    }}

    @media (min-width: 640px) {{
      .step-header {{
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }}
    }}

    .step-tag-wrap {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .step-pill {{
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 999px;
      background: #f1f5f9;
      color: var(--slate-700);
    }}

    .step-time {{
      font-size: 12px;
      font-weight: 800;
      color: var(--teal);
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      padding: 3px 10px;
      border-radius: 999px;
    }}

    .step-title {{
      font-family: var(--font-display);
      font-size: 17px;
      font-weight: 800;
      color: var(--slate-900);
      margin-bottom: 4px;
    }}

    .step-desc {{
      font-size: 13px;
      color: var(--slate-600);
      line-height: 1.45;
      margin-bottom: 12px;
    }}

    .step-list {{
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}

    .step-list li {{
      font-size: 12.5px;
      color: var(--slate-700);
      padding-left: 18px;
      position: relative;
      line-height: 1.4;
    }}

    .step-list li::before {{
      content: "✓";
      position: absolute;
      left: 0;
      color: var(--teal);
      font-weight: 900;
      font-size: 12px;
    }}

    /* ==========================================================================
       COPYABLE CODE & PROMPTS BOX
       ========================================================================== */
    .code-box {{
      background: #0f172a;
      color: #f8fafc;
      border-radius: 14px;
      overflow: hidden;
      margin: 12px 0;
      border: 1px solid #334155;
    }}

    .code-box-header {{
      background: #1e293b;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
    }}

    .code-box-title {{
      font-family: var(--font-code);
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }}

    .btn-copy {{
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .btn-copy:hover {{
      background: #0d9488;
      border-color: #5eead4;
    }}

    .btn-copy.copied {{
      background: #10b981;
      border-color: #34d399;
    }}

    .code-content {{
      padding: 12px 14px;
      font-family: var(--font-code);
      font-size: 11.5px;
      line-height: 1.45;
      overflow-x: auto;
      white-space: pre-wrap;
      color: #e2e8f0;
    }}

    /* ==========================================================================
       BRIDGE ARCHITECTURE GRID (4 PILLARS)
       ========================================================================== */
    .bridge-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 12px;
    }}

    @media (min-width: 640px) {{
      .bridge-grid {{ grid-template-columns: repeat(2, 1fr); }}
    }}

    .bridge-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 16px;
      padding: 16px;
    }}

    .bridge-card h4 {{
      font-size: 14px;
      font-weight: 800;
      color: var(--teal);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }}

    .bridge-card p {{
      font-size: 12px;
      color: var(--slate-600);
      line-height: 1.4;
    }}

    /* ==========================================================================
       CHECKLIST SECTION
       ========================================================================== */
    .check-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 18px;
      padding: 18px;
    }}

    .check-item {{
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--slate-100);
      cursor: pointer;
      user-select: none;
    }}

    .check-item:last-child {{
      border-bottom: none;
    }}

    .check-input {{
      width: 18px;
      height: 18px;
      accent-color: var(--teal);
      margin-top: 2px;
      cursor: pointer;
    }}

    .check-text h4 {{
      font-size: 13px;
      font-weight: 700;
      color: var(--slate-900);
    }}

    .check-text p {{
      font-size: 11.5px;
      color: var(--slate-600);
    }}

    /* ==========================================================================
       RESOURCES / DOWNLOADS BOX
       ========================================================================== */
    .resources-box {{
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 20px;
      padding: 24px;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 24px;
    }}

    @media (min-width: 640px) {{
      .resources-box {{
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }}
    }}

    .res-left h3 {{
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 4px;
    }}

    .res-left p {{
      font-size: 12px;
      color: var(--slate-400);
    }}

    .res-actions {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}

    .btn-pdf {{
      background: #0d9488;
      color: #ffffff;
      font-weight: 800;
      font-size: 12px;
      padding: 10px 18px;
      border-radius: 999px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }}

    .btn-pdf:hover {{
      background: #0f766e;
    }}

    .btn-wa {{
      background: #25D366;
      color: #ffffff;
      font-weight: 800;
      font-size: 12px;
      padding: 10px 18px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }}

    /* ==========================================================================
       MOBILE STICKY BOTTOM BAR (WHATSAPP FRIENDLY)
       ========================================================================== */
    .mobile-bar {{
      position: fixed;
      bottom: 12px;
      left: 12px;
      right: 12px;
      z-index: 999;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(94, 234, 212, 0.3);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      border-radius: 16px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}

    .mobile-bar-info {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .mobile-bar-btn {{
      background: linear-gradient(135deg, #0d9488 0%, #10b981 100%);
      color: #ffffff;
      font-size: 13px;
      font-weight: 900;
      padding: 9px 18px;
      border-radius: 999px;
      box-shadow: 0 4px 10px rgba(13, 148, 136, 0.4);
      white-space: nowrap;
    }}

    /* ==========================================================================
       FOOTER
       ========================================================================== */
    footer {{
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: var(--slate-600);
      padding: 20px 0;
      border-top: 1px solid var(--slate-200);
    }}
  </style>
</head>
<body>

  <!-- TOP LIVE BAR -->
  <div class="top-live-bar">
    <span class="live-pulse"><span class="live-dot"></span> EN VIVO HOY</span>
    <span>Martes 20 de Octubre · 7:00 PM a 9:00 PM (Hora Colombia)</span>
  </div>

  <!-- FLOATING NAVBAR -->
  <div class="nav-wrap">
    <div class="nav-inner">
      <div class="nav-logo">
        {"<img src='" + logo_wappy + "' alt='WAPPY'>" if logo_wappy else "<strong>WAPPY</strong>"}
        <span class="nav-tag">Clase 01 · Antigravity</span>
      </div>
      <div class="nav-actions">
        <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn-meet-nav">
          <span>📹</span>
          <span>Google Meet</span>
        </a>
      </div>
    </div>
  </div>

  <div class="wrap">
    <!-- HERO PRESENTATION -->
    <section class="hero">
      <div class="hero-bg-glow"></div>
      <span class="hero-badge">Especialización Práctica SST con IA Agéntica</span>
      <h1>Clase 1: El Poder Autónomo de Google Antigravity & su Conexión con WAPPY</h1>
      <p class="hero-sub">
        De la operatividad documental a la prevención real en Colombia. Guía de acompañamiento en vivo, paso a paso metodológico, reglas de participación y comandos listos para desplegar tu primer agente SST hoy.
      </p>

      <div class="hero-meta-grid">
        <div class="hero-meta-item">
          <div class="hero-meta-label">🗓️ Fecha</div>
          <div class="hero-meta-val">Hoy Martes 20 Oct</div>
        </div>
        <div class="hero-meta-item">
          <div class="hero-meta-label">⏰ Horario</div>
          <div class="hero-meta-val">7:00 – 9:00 PM Col</div>
        </div>
        <div class="hero-meta-item">
          <div class="hero-meta-label">👥 Aforo</div>
          <div class="hero-meta-val">12 Especialistas</div>
        </div>
        <div class="hero-meta-item">
          <div class="hero-meta-label">👨‍🏫 Docente Líder</div>
          <div class="hero-meta-val">Félix Bedoya</div>
        </div>
      </div>

      <!-- CTA ENLACE GOOGLE MEET -->
      <div class="hero-cta-box">
        <div class="hero-cta-info">
          <h3>📹 Sala Virtual Oficial de la Clase</h3>
          <p>La sala se abre a las 6:50 PM para pruebas de audio y cámara. Código: <strong>xvz-jmvv-iym</strong></p>
        </div>
        <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="hero-cta-btn">
          <span>👉</span> Entrar a Google Meet
        </a>
      </div>
    </section>

    <!-- SECCIÓN 1: REGLAS DE ORO -->
    <section>
      <div class="sec-header">
        <span class="sec-tag">Convivencia & Calidad</span>
        <h2 class="sec-title">Reglas de Oro y Acuerdos de Participación</h2>
        <p class="sec-sub">Para asegurar el máximo aprendizaje práctico en el grupo selecto de 12 profesionales:</p>
      </div>

      <div class="rules-grid">
        <div class="rule-card urgent">
          <div class="rule-top">
            <span class="rule-title">📷 1. Cámara Encendida (Min. 10 Min)</span>
            <span class="rule-badge badge-amber">Obligatorio</span>
          </div>
          <p class="rule-desc">
            Cámara encendida durante los <strong>primeros 10 a 15 minutos</strong> para el saludo inicial, llamado a lista y conexión humana del equipo. Luego puedes apagarla si requieres optimizar tu conexión.
          </p>
        </div>

        <div class="rule-card">
          <div class="rule-top">
            <span class="rule-title">💻 2. Entorno Dual: PC + Celular</span>
            <span class="rule-badge badge-teal">Hardware</span>
          </div>
          <p class="rule-desc">
            <strong>Computador:</strong> Windows 10/11, Mac o Linux (8GB+ RAM) para operar Antigravity IDE/CLI. <strong>Celular:</strong> disponible para probar Tenshi Voice y recibir alertas en tiempo real.
          </p>
        </div>

        <div class="rule-card">
          <div class="rule-top">
            <span class="rule-title">🌐 3. Conexión Estable de Red</span>
            <span class="rule-badge badge-teal">Conectividad</span>
          </div>
          <p class="rule-desc">
            Internet de 30 a 50 Mbps mínimo (Wi-Fi 5GHz o cable). Los sockets de voz y los modelos de lenguaje requieren estabilidad para evitar latencia o cortes.
          </p>
        </div>

        <div class="rule-card">
          <div class="rule-top">
            <span class="rule-title">🎙️ 4. Micrófono & Preguntas</span>
            <span class="rule-badge badge-teal">Interacción</span>
          </div>
          <p class="rule-desc">
            Micrófono silenciado por defecto para mantener la limpieza del audio. Usa <strong>"Levantar la mano"</strong> o el chat para formular preguntas; habrá rondas activas al final de cada bloque.
          </p>
        </div>

        <div class="rule-card">
          <div class="rule-top">
            <span class="rule-title">🤝 5. Debugging Colaborativo</span>
            <span class="rule-badge badge-teal">Metodología</span>
          </div>
          <p class="rule-desc">
            Clase 100% práctica: todos programamos en vivo. Si a alguien le sale un error, compartimos pantalla para resolverlo juntos: <em>el error de uno es la lección de los doce</em>.
          </p>
        </div>

        <div class="rule-card">
          <div class="rule-top">
            <span class="rule-title">🔒 6. Confidencialidad SST</span>
            <span class="rule-badge badge-teal">Ética Legal</span>
          </div>
          <p class="rule-desc">
            En los talleres aplicados se usarán datos ficticios o anonimizados (ocultando nombres de trabajadores y NITs según la Ley 1581 de 2012 de Colombia).
          </p>
        </div>
      </div>
    </section>

    <!-- SECCIÓN 2: CHECKLIST PREVIO INTERACTIVO -->
    <section>
      <div class="sec-header">
        <span class="sec-tag">Antes de las 7:00 PM</span>
        <h2 class="sec-title">Checklist Técnico Previo (Marca lo que ya tienes listo)</h2>
      </div>

      <div class="check-card">
        <label class="check-item">
          <input type="checkbox" class="check-input" id="chk1" onchange="saveCheck('chk1')">
          <div class="check-text">
            <h4>Cuenta de Google Activa y Verificada</h4>
            <p>Acceso verificado a Google Drive, Google Meet y Google Workspace.</p>
          </div>
        </label>
        <label class="check-item">
          <input type="checkbox" class="check-input" id="chk2" onchange="saveCheck('chk2')">
          <div class="check-text">
            <h4>Acceso Confirmado a la Plataforma WAPPY</h4>
            <p>Usuario habilitado en WAPPY con acceso a la Tienda y Academia.</p>
          </div>
        </label>
        <label class="check-item">
          <input type="checkbox" class="check-input" id="chk3" onchange="saveCheck('chk3')">
          <div class="check-text">
            <h4>Google Chrome o Brave Actualizado</h4>
            <p>Navegador moderno con soporte activo para WebRTC y WebSockets de voz.</p>
          </div>
        </label>
        <label class="check-item">
          <input type="checkbox" class="check-input" id="chk4" onchange="saveCheck('chk4')">
          <div class="check-text">
            <h4>Smartphone a la Mano con WhatsApp</h4>
            <p>Dispositivo móvil cargado para interactuar con Tenshi Voice y el grupo de soporte.</p>
          </div>
        </label>
        <label class="check-item">
          <input type="checkbox" class="check-input" id="chk5" onchange="saveCheck('chk5')">
          <div class="check-text">
            <h4>Espacio Silencioso con Auriculares y Micrófono</h4>
            <p>Entorno libre de ruidos para escuchar con claridad y participar en las dinámicas.</p>
          </div>
        </label>
      </div>
    </section>

    <!-- SECCIÓN 3: TEMARIO PASO A PASO -->
    <section>
      <div class="sec-header">
        <span class="sec-tag">Cronograma 7:00 PM – 9:00 PM</span>
        <h2 class="sec-title">Paso a Paso de la Clase de Hoy</h2>
        <p class="sec-sub">Los 4 bloques que transformarán tu manera de gestionar el SG-SST:</p>
      </div>

      <!-- PASO 1 -->
      <div class="step-card">
        <div class="step-header">
          <div class="step-tag-wrap">
            <span class="step-pill">Módulo 01</span>
            <span class="step-time">7:00 PM – 7:25 PM (25 Min)</span>
          </div>
          <span style="font-size:11px; font-weight:800; color:#0f766e;">Fundamentos Agénticos</span>
        </div>
        <h3 class="step-title">Bienvenida, Acuerdos y el Salto a la IA Agéntica en SST</h3>
        <p class="step-desc">
          Encuadre metodológico y comprensión profunda del cambio de paradigma: por qué los modelos conversacionales tradicionales fallan ante el rigor del SG-SST en Colombia.
        </p>
        <ul class="step-list">
          <li><strong>Apertura de cámaras y bienvenida oficial:</strong> Presentación ágil de los 12 prevencionistas y calibración de objetivos de automatización.</li>
          <li><strong>El colapso del paradigma "Chatbot":</strong> Por qué ChatGPT genérico y los prompts planos alucinan con el Decreto 1072/15 y la Resolución 0312/19.</li>
          <li><strong>Los 3 niveles de madurez en SST:</strong> Nivel 1 (Chatbot pasivo) ➔ Nivel 2 (Copiloto interactivo) ➔ Nivel 3 (Sistema Agéntico Autónomo).</li>
        </ul>
      </div>

      <!-- PASO 2 -->
      <div class="step-card">
        <div class="step-header">
          <div class="step-tag-wrap">
            <span class="step-pill">Módulo 02</span>
            <span class="step-time">7:25 PM – 8:05 PM (40 Min)</span>
          </div>
          <span style="font-size:11px; font-weight:800; color:#0f766e;">Arquitectura Google</span>
        </div>
        <h3 class="step-title">Anatomía de Google Antigravity: Los 4 Pilares Maestros</h3>
        <p class="step-desc">
          Exploración a fondo de la plataforma agéntica de Google: cómo orquesta herramientas, terminales, archivos locales y modelos avanzados.
        </p>
        <ul class="step-list">
          <li><strong>Las 3 superficies de Antigravity:</strong> Antigravity IDE (VS Code con lentes de IA), Antigravity 2.0 (Desktop app) y CLI (<code>agy</code>).</li>
          <li><strong>Pilar 1: Workflows (Guías de Trayectoria):</strong> Procedimientos estructurados en Markdown ejecutables con comandos <code>/slash</code>.</li>
          <li><strong>Pilar 2: Rules (Reglas Persistentes de Contexto):</strong> Inyección de directrices legales inviolables (ej: <code>AGENTS.md</code> y criterios normativos).</li>
          <li><strong>Pilar 3: Skills (Habilidades Modulares):</strong> Empaquetado de conocimientos en <code>SKILL.md</code> con divulgación progresiva sin saturar tokens.</li>
          <li><strong>Pilar 4: Model Context Protocol (MCP):</strong> El puerto USB-C universal que conecta el agente con bases de datos, APIs y herramientas locales.</li>
        </ul>
      </div>

      <!-- PASO 3 -->
      <div class="step-card">
        <div class="step-header">
          <div class="step-tag-wrap">
            <span class="step-pill">Módulo 03</span>
            <span class="step-time">8:05 PM – 8:40 PM (35 Min)</span>
          </div>
          <span style="font-size:11px; font-weight:800; color:#0f766e;">Integración Multimodal</span>
        </div>
        <h3 class="step-title">El Puente Estratégico: Antigravity + WAPPY + Herramientas Google</h3>
        <p class="step-desc">
          Aprende cómo conectar todas las piezas para que trabajen como un único equipo interdisciplinario autónomo para tu empresa.
        </p>
        
        <div class="bridge-grid">
          <div class="bridge-card">
            <h4>1. WAPPY Platform (MCP)</h4>
            <p>Acceso y actualización en vivo de la Matriz GTC 45, PESV (Res. 20223040040595), trabajadores, químicos SGA y comités.</p>
          </div>
          <div class="bridge-card">
            <h4>2. Google NotebookLM</h4>
            <p>Cerebro legal con citas textuales exactas de decretos de 400 páginas y generación automática de podcasts de capacitación.</p>
          </div>
          <div class="bridge-card">
            <h4>3. Google Workspace</h4>
            <p>Archivo digital de 20 años en Google Drive, generación de actas en Docs/PDF y cronogramas en Calendar/Sheets.</p>
          </div>
          <div class="bridge-card">
            <h4>4. Tenshi Voice en Campo</h4>
            <p>Asistente manos libres vía WebSocket Multimodal Live API para inspecciones y dictado de condiciones inseguras.</p>
          </div>
        </div>
      </div>

      <!-- PASO 4 -->
      <div class="step-card">
        <div class="step-header">
          <div class="step-tag-wrap">
            <span class="step-pill">Módulo 04</span>
            <span class="step-time">8:40 PM – 9:00 PM (20 Min)</span>
          </div>
          <span style="font-size:11px; font-weight:800; color:#ef4444;">Laboratorio & Q&A</span>
        </div>
        <h3 class="step-title">Laboratorio Práctico en Vivo #1 & Reto Semanal</h3>
        <p class="step-desc">
          Construcción de tu primer artefacto agéntico, resolución de dudas en vivo y asignación del reto de la semana.
        </p>
        <ul class="step-list">
          <li><strong>Taller guiado:</strong> Creación de tu primer archivo <code>AGENTS.md</code> y tu primer <code>SKILL.md</code> en tu computador.</li>
          <li><strong>Ronda de preguntas y debugging colaborativo:</strong> Ajuste de variables de entorno y verificación del entorno de cada alumno.</li>
          <li><strong>Reto de la Semana (Laboratorio 1):</strong> Dejar configurado tu primer agente local conectado a WAPPY antes de la Clase 2.</li>
        </ul>
      </div>
    </section>

    <!-- SECCIÓN 4: CAJA DE HERRAMIENTAS Y PROMPTS LISTOS -->
    <section>
      <div class="sec-header">
        <span class="sec-tag">Caja de Herramientas</span>
        <h2 class="sec-title">Prompts y Plantillas Listas para Copiar en Clase</h2>
        <p class="sec-sub">Usa estos bloques de código durante la sesión práctica (haz clic en Copiar):</p>
      </div>

      <!-- Code Box 1: AGENTS.md -->
      <div class="code-box">
        <div class="code-box-header">
          <span class="code-box-title">📄 AGENTS.md · Regla de Oro Legal SG-SST</span>
          <button class="btn-copy" onclick="copyCode('code1', this)">Copiar</button>
        </div>
        <pre class="code-content" id="code1"># REGLAS DEL AGENTE SST - PROYECTO COLOMBIA

> [!CRITICAL]
> Eres un prevencionista experto en Seguridad y Salud en el Trabajo bajo la legislación colombiana (Decreto 1072 de 2015 y Resolución 0312 de 2019).
>
> 1. Toda recomendación técnica DEBE citar el artículo, decreto o resolución oficial vigente.
> 2. En planes de mejora, define siempre: Actividad, Responsable, Recursos y Fecha límite.
> 3. Nunca inventes normativas ni asumas datos no confirmados por la empresa.</pre>
      </div>

      <!-- Code Box 2: SKILL.md -->
      <div class="code-box">
        <div class="code-box-header">
          <span class="code-box-title">⚙️ SKILL.md · Habilidad de Inspección de Seguridad</span>
          <button class="btn-copy" onclick="copyCode('code2', this)">Copiar</button>
        </div>
        <pre class="code-content" id="code2">---
name: auditoria-condiciones-inseguras
description: Habilidad especializada para clasificar actos y condiciones inseguras según la GTC 45 y la Resolución 1401 de 2007.
---

# Procedimiento de Inspección Agéntica
1. Lee la descripción del hallazgo o fotografía de campo.
2. Identifica el factor de riesgo (Físico, Químico, Biológico, Biomecánico, Psicosocial, Seguridad).
3. Evalúa el nivel de deficiencia y exposición preliminar.
4. Genera la acción preventiva inmediata en formato de reporte WAPPY.</pre>
      </div>
    </section>

    <!-- SECCIÓN 5: RECURSOS Y DESCARGAS -->
    <section class="resources-box">
      <div class="res-left">
        <h3>Descarga la Guía Oficial y Únete al Grupo VIP</h3>
        <p>Ten a la mano el PDF de 2 páginas con el temario minuteado y conéctate al canal privado de WhatsApp.</p>
      </div>
      <div class="res-actions">
        <a href="/assets/Clase_1_Antigravity_Syllabus_y_Reglas_WAPPY.pdf" download class="btn-pdf">
          <span>📄</span> Descargar Guía PDF
        </a>
        <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn-meet-nav">
          <span>📹</span> Google Meet (7:00 PM)
        </a>
      </div>
    </section>

    <!-- FOOTER -->
    <footer>
      <p><strong>WAPPY IA</strong> · Especialización Práctica en IA Agéntica para SG-SST</p>
      <p style="margin-top: 4px;">Docente: Félix Bedoya · Grupo Exclusivo de 12 Participantes · Clase 01</p>
    </footer>
  </div>

  <!-- FLOATING BOTTOM BAR (MOBILE ONLY) -->
  <div class="mobile-bar">
    <div class="mobile-bar-info">
      <span class="live-dot"></span>
      <div>
        <div style="font-size:11px; font-weight:800; color:#ffffff;">CLASE EN VIVO HOY</div>
        <div style="font-size:10px; color:#99f6e4;">7:00 PM (Abre 6:50 PM)</div>
      </div>
    </div>
    <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="mobile-bar-btn">
      Entrar a Meet 👉
    </a>
  </div>

  <script>
    function copyCode(id, btn) {{
      const el = document.getElementById(id);
      if (!el) return;
      navigator.clipboard.writeText(el.innerText).then(() => {{
        const originalText = btn.innerText;
        btn.innerText = '¡Copiado! ✓';
        btn.classList.add('copied');
        setTimeout(() => {{
          btn.innerText = originalText;
          btn.classList.remove('copied');
        }}, 2000);
      }}).catch(err => {{
        alert('Copia el texto manualmente.');
      }});
    }}

    function saveCheck(id) {{
      const el = document.getElementById(id);
      if (el) {{
        localStorage.setItem('wappy_clase1_' + id, el.checked ? '1' : '0');
      }}
    }}

    // Restore checklist on load
    document.addEventListener('DOMContentLoaded', () => {{
      ['chk1', 'chk2', 'chk3', 'chk4', 'chk5'].forEach(id => {{
        const val = localStorage.getItem('wappy_clase1_' + id);
        const el = document.getElementById(id);
        if (el && val === '1') {{
          el.checked = true;
        }}
      }});
    }});
  </script>
</body>
</html>
'''

# Write to client/public/clase1.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase1.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {pub_path} ({len(html_content)} bytes)")

# Also write directly to Desktop as requested!
desktop_path = '/Users/venta/Desktop/clase1.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {desktop_path} ({len(html_content)} bytes)")
