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

cat_logo = get_base64_img('client/public/marketing/wappy-cat-logo.png')
logo_wappy = get_base64_img('client/public/assets/Logos WAPPY/logo.png')
tenshi_img = get_base64_img('client/public/assets/tenshi.png')
felix_avatar = get_base64_img('client/public/assets/felix_avatar_3d.png')
wappy_horiz_logo = get_base64_img('client/public/assets/wappy_horizontal_black_logo.png')
agy_logo = get_base64_img('client/public/assets/antigravity_logo.png')

if not cat_logo:
    cat_logo = logo_wappy

html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>WAPPY IA · Clase 2: Tenshi en el Bolsillo, Conexión MCP WAPPY & Skills en Vivo | SOMOS SST</title>
  <meta name="description" content="Clase 2 Oficial WAPPY IA + Google Antigravity: Tenshi en el Bolsillo (instrucciones por voz desde el celular en campo), órdenes delegadas a Antigravity, conexión práctica MCP con WAPPY, ahorro del 80% de tokens con Markdown, y creación de Skills y Triggers sin código.">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png?v=wappy" />
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png?v=wappy" />
  <link rel="shortcut icon" href="/assets/favicon-32x32.png?v=wappy" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon-180x180.png?v=wappy" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      /* Identidad Oficial wappy.club */
      --lime: #c7f303;
      --lime-dark: #a8cf00;
      --lime-glow: rgba(199, 243, 3, 0.4);
      --ink: #0e1300;
      --ink-soft: #2e3428;
      --ink-muted: #5a6252;
      --teal: #0d9488;
      --teal-bright: #2dd4bf;
      --teal-dark: #042f2e;
      --sky: linear-gradient(180deg, #5bb8f5 0%, #86ccf6 34%, #bfe3fa 64%, #eaf6fe 100%);
      --cream: #f6f5ef;
      --paper: #ffffff;
      --stone: #eceae1;
      --amber: #f59e0b;
      --coral: #ff5a36;
      --purple: #8b5cf6;
      --blue: #3b82f6;
      --rule: rgba(14, 19, 0, 0.09);
      --font-display: "Plus Jakarta Sans", "Inter", -apple-system, sans-serif;
      --font-sans: "Inter", -apple-system, sans-serif;
      --font-mono: "JetBrains Mono", monospace;
    }}

    *, *::before, *::after {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}

    html {{
      scroll-behavior: smooth;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden !important;
    }}

    body {{
      width: 100%;
      max-width: 100%;
      overflow-x: hidden !important;
      font-family: var(--font-sans);
      color: var(--ink);
      background: var(--cream);
      line-height: 1.55;
      padding-bottom: 60px;
    }}

    a {{
      color: inherit;
      text-decoration: none;
    }}

    img, svg, canvas {{
      max-width: 100%;
      display: block;
    }}

    .container {{
      width: 100%;
      max-width: min(1240px, 100vw);
      margin: 0 auto;
      padding: 0 clamp(14px, 3.5vw, 40px);
      overflow-x: hidden;
    }}

    header, section, .deck-stage, .hero-inner, .hero-tenshi-card {{
      max-width: 100%;
    }}

    @media (max-width: 640px) {{
      .eyebrow {{
        font-size: 10px;
        padding: 6px 12px;
        justify-content: center;
        text-align: center;
        line-height: 1.35;
      }}
      .hero h1 {{
        font-size: 27px;
        line-height: 1.12;
      }}
      .hero h1 .highlight-lime {{
        display: inline;
        padding: 0 6px;
        border-radius: 8px;
      }}
      .hero-ctas .btn {{
        width: 100%;
      }}
    }}

    /* ==========================================================================
       1. FLOATING NAVBAR OFICIAL WAPPY.CLUB
       ========================================================================== */
    .nav-wrap {{
      position: fixed;
      top: 14px;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      justify-content: center;
      padding: 0 12px;
      pointer-events: none;
    }}

    .nav {{
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(14, 19, 0, 0.08);
      border-radius: 9999px;
      padding: 7px 8px 7px 16px;
      box-shadow: 0 12px 36px -8px rgba(14, 19, 0, 0.14);
      width: 100%;
      max-width: 1060px;
    }}

    .brand {{
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 900;
      letter-spacing: -0.03em;
      font-size: 18px;
      flex-shrink: 0;
    }}

    .brand-icon {{
      width: 38px;
      height: 38px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      border: 2px solid var(--teal);
      background: #fff;
      box-shadow: 0 2px 8px rgba(13, 148, 136, 0.25);
    }}

    .brand-icon img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
    }}

    .brand-text {{
      display: flex;
      flex-direction: column;
      line-height: 1.05;
    }}

    .brand-text .main {{
      font-size: 16px;
      font-weight: 900;
      color: var(--ink);
    }}

    .brand-text .main span {{
      color: var(--teal);
      margin-left: 2px;
    }}

    .brand-text .sub {{
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.14em;
      color: var(--ink-muted);
      text-transform: uppercase;
    }}

    .nav-links {{
      display: flex;
      gap: 6px;
      align-items: center;
      font-size: 13px;
      font-weight: 700;
      color: var(--ink-soft);
    }}

    .nav-links a {{
      padding: 7px 13px;
      border-radius: 9999px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }}

    .nav-links a:hover {{
      background: rgba(14, 19, 0, 0.06);
      color: var(--ink);
    }}

    .nav-links a.active-pill {{
      background: rgba(13, 148, 136, 0.12);
      color: var(--teal);
    }}

    @media (max-width: 860px) {{
      .nav-links {{
        display: none;
      }}
    }}

    @media (max-width: 520px) {{
      .nav {{
        padding: 6px 8px 6px 12px;
        gap: 6px;
      }}
      .brand-icon {{
        width: 32px;
        height: 32px;
      }}
      .brand-text .main {{
        font-size: 14px;
      }}
      .brand-text .sub {{
        font-size: 8px;
      }}
      .nav .btn-dark {{
        padding: 7px 11px;
        font-size: 11px;
        gap: 5px;
      }}
      .nav .arrow-pip {{
        width: 20px;
        height: 20px;
        font-size: 11px;
      }}
    }}

    /* Evitar cualquier desbordamiento en celdas Grid/Flex */
    .hero-inner > *,
    .s-grid-2 > *,
    .s-grid-3 > *,
    .s-grid-4 > *,
    .prompt-cards-grid > *,
    .zero-code-banner > *,
    .guide-blocks-grid > *,
    .g-list > * {{
      min-width: 0;
      max-width: 100%;
    }}

    /* Botones oficiales wappy.club */
    .btn {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: var(--font-sans);
      font-weight: 800;
      font-size: 13.5px;
      letter-spacing: -0.01em;
      padding: 11px 18px;
      border-radius: 9999px;
      border: none;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      white-space: nowrap;
      text-decoration: none;
    }}

    .btn:active {{
      transform: scale(0.97);
    }}

    .btn-dark {{
      background: var(--ink);
      color: #ffffff;
      box-shadow: 0 10px 24px -6px rgba(14, 19, 0, 0.35);
    }}

    .btn-dark:hover {{
      background: #1f2612;
      transform: translateY(-1px);
    }}

    .btn-lime {{
      background: var(--lime);
      color: var(--ink);
      box-shadow: 0 10px 28px -6px rgba(168, 207, 0, 0.55);
    }}

    .btn-lime:hover {{
      background: #d2fc1b;
      transform: translateY(-1px);
    }}

    .btn-glass {{
      background: rgba(255, 255, 255, 0.85);
      color: var(--ink);
      border: 1px solid rgba(14, 19, 0, 0.12);
      backdrop-filter: blur(10px);
    }}

    .btn-glass:hover {{
      background: #ffffff;
      transform: translateY(-1px);
    }}

    .arrow-pip {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 9999px;
      background: var(--lime);
      color: var(--ink);
      font-size: 13px;
      font-weight: 900;
      flex-shrink: 0;
    }}

    .btn-lime .arrow-pip {{
      background: var(--ink);
      color: var(--lime);
    }}

    /* ==========================================================================
       2. HERO OFICIAL WAPPY.CLUB (CIELO AZUL + NUBES + TENSHI FLOTANTE)
       ========================================================================== */
    .hero {{
      position: relative;
      background: var(--sky);
      padding-top: clamp(98px, 10vw, 132px);
      padding-bottom: clamp(36px, 5vw, 60px);
      overflow: hidden;
      border-bottom: 1px solid rgba(14, 19, 0, 0.08);
    }}

    .hero-cloud {{
      position: absolute;
      pointer-events: none;
      background: radial-gradient(closest-side, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0) 72%);
      filter: blur(8px);
      z-index: 0;
      animation: driftCloud 16s ease-in-out infinite alternate;
    }}

    .hero-cloud.c1 {{ width: 520px; height: 220px; top: 8%; left: -100px; }}
    .hero-cloud.c2 {{ width: 600px; height: 250px; top: 14%; right: -140px; animation-delay: -5s; }}
    .hero-cloud.c3 {{ width: 460px; height: 190px; bottom: 8%; left: 22%; opacity: 0.75; animation-delay: -9s; }}

    @keyframes driftCloud {{
      0% {{ transform: translateX(0px) translateY(0px); }}
      100% {{ transform: translateX(35px) translateY(-12px); }}
    }}

    .hero-inner {{
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1.25fr 0.75fr;
      gap: clamp(20px, 3.5vw, 40px);
      align-items: center;
    }}

    @media (max-width: 920px) {{
      .hero-inner {{
        grid-template-columns: 1fr;
        text-align: center;
      }}
    }}

    .eyebrow {{
      display: inline-flex;
      align-items: center;
      gap: 9px;
      background: rgba(14, 19, 0, 0.9);
      color: var(--lime);
      padding: 7px 15px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      box-shadow: 0 8px 24px rgba(14, 19, 0, 0.16);
      margin-bottom: 16px;
      flex-wrap: wrap;
    }}

    .eyebrow .dot {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--lime);
      box-shadow: 0 0 0 4px rgba(199, 243, 3, 0.28);
      animation: pulseDot 1.8s infinite;
    }}

    @keyframes pulseDot {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.55; transform: scale(0.85); }}
    }}

    .hero h1 {{
      font-family: var(--font-display);
      font-weight: 900;
      font-size: clamp(28px, 4.6vw, 54px);
      line-height: 1.04;
      letter-spacing: -0.035em;
      color: var(--ink);
      margin-bottom: 14px;
    }}

    .hero h1 .highlight-lime {{
      background: var(--lime);
      padding: 0 10px;
      border-radius: 12px;
      display: inline-block;
      box-shadow: 0 4px 14px rgba(199, 243, 3, 0.35);
    }}

    .hero-sub {{
      font-size: clamp(14.5px, 1.45vw, 17.5px);
      color: var(--ink-soft);
      font-weight: 500;
      max-width: 640px;
      margin-bottom: 22px;
    }}

    @media (max-width: 920px) {{
      .hero-sub {{
        margin-left: auto;
        margin-right: auto;
      }}
    }}

    .hero-ctas {{
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 22px;
    }}

    @media (max-width: 920px) {{
      .hero-ctas {{
        justify-content: center;
      }}
    }}

    .hero-pills-bar {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(14, 19, 0, 0.08);
      border-radius: 20px;
      padding: 12px;
      box-shadow: 0 12px 30px -10px rgba(14, 19, 0, 0.1);
    }}

    @media (max-width: 640px) {{
      .hero-pills-bar {{
        grid-template-columns: repeat(2, 1fr);
      }}
    }}

    .hero-pill-item {{
      background: rgba(255, 255, 255, 0.9);
      border-radius: 14px;
      padding: 9px 12px;
      border: 1px solid rgba(14, 19, 0, 0.05);
      text-align: left;
    }}

    .hero-pill-label {{
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ink-muted);
    }}

    .hero-pill-val {{
      font-size: 13px;
      font-weight: 900;
      color: var(--ink);
      margin-top: 2px;
    }}

    /* Tenshi Showcase Card en el Hero */
    .hero-tenshi-card {{
      position: relative;
      background: rgba(14, 19, 0, 0.92);
      border: 2px solid rgba(199, 243, 3, 0.45);
      border-radius: 28px;
      padding: 22px 20px;
      color: #fff;
      box-shadow: 0 24px 60px -12px rgba(14, 19, 0, 0.4);
      overflow: hidden;
      text-align: center;
    }}

    .hero-tenshi-glow {{
      position: absolute;
      width: 240px;
      height: 240px;
      background: radial-gradient(circle, rgba(199, 243, 3, 0.32) 0%, rgba(13, 148, 136, 0.2) 50%, transparent 70%);
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      filter: blur(12px);
    }}

    .tenshi-avatar-floating {{
      width: 145px;
      height: 145px;
      object-fit: contain;
      margin: 0 auto 10px;
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 14px 24px rgba(199, 243, 3, 0.3));
      animation: floatTenshi 4s ease-in-out infinite;
    }}

    @keyframes floatTenshi {{
      0%, 100% {{ transform: translateY(0px) rotate(0deg); }}
      50% {{ transform: translateY(-10px) rotate(2deg); }}
    }}

    .tenshi-bubble {{
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(199, 243, 3, 0.35);
      border-radius: 16px;
      padding: 12px 14px;
      font-size: 12.5px;
      line-height: 1.45;
      color: #ecfdf5;
      margin-bottom: 14px;
    }}

    .tenshi-bubble strong {{
      color: var(--lime);
    }}

    .meet-live-strip {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: rgba(13, 148, 136, 0.24);
      border: 1px solid rgba(45, 212, 191, 0.4);
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 12px;
      flex-wrap: wrap;
    }}

    /* ==========================================================================
       3. MOTOR DE PRESENTACIÓN CINEMATOGRÁFICA INTERACTIVA (15 SLIDES)
       ========================================================================== */
    .presentation-section {{
      padding: clamp(28px, 4vw, 48px) 0 20px;
    }}

    .sec-head-bar {{
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }}

    .sec-kicker {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--ink);
      color: var(--lime);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 5px 12px;
      border-radius: 9999px;
      margin-bottom: 8px;
    }}

    .sec-big-title {{
      font-family: var(--font-display);
      font-size: clamp(22px, 3vw, 34px);
      font-weight: 900;
      letter-spacing: -0.03em;
      color: var(--ink);
      line-height: 1.1;
    }}

    /* Escenario Principal (Stage) */
    .deck-stage {{
      position: relative;
      background: radial-gradient(ellipse at 20% 15%, #0f2926 0%, #071318 55%, #03070b 100%);
      border-radius: 28px;
      border: 2px solid rgba(199, 243, 3, 0.35);
      box-shadow: 0 28px 70px -15px rgba(14, 19, 0, 0.45), 0 0 40px rgba(13, 148, 136, 0.15);
      overflow: hidden;
      color: #f8fafc;
      transition: all 0.3s ease;
    }}

    .deck-stage:fullscreen {{
      border-radius: 0;
      border: none;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}

    /* Canvas de Red Neuronal Animada en el Fondo */
    #deck-canvas {{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.55;
    }}

    /* HUD Corner Brackets estilo HyperFrames */
    .hud-corner {{
      position: absolute;
      width: 22px;
      height: 22px;
      border-color: rgba(199, 243, 3, 0.45);
      border-style: solid;
      z-index: 4;
      pointer-events: none;
    }}
    .hud-corner.tl {{ top: 58px; left: 16px; border-width: 2px 0 0 2px; }}
    .hud-corner.tr {{ top: 58px; right: 16px; border-width: 2px 2px 0 0; }}
    .hud-corner.bl {{ bottom: 68px; left: 16px; border-width: 0 0 2px 2px; }}
    .hud-corner.br {{ bottom: 68px; right: 16px; border-width: 0 2px 2px 0; }}

    @media (max-width: 640px) {{
      .hud-corner {{ display: none; }}
    }}

    /* Barra Superior de Telemetría del Deck */
    .deck-topbar {{
      position: relative;
      z-index: 5;
      background: rgba(2, 6, 23, 0.82);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }}

    .deck-telemetry {{
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: #94a3b8;
      flex-wrap: wrap;
    }}

    .telemetry-dot {{
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--lime);
      box-shadow: 0 0 10px var(--lime);
      animation: pulseDot 1.6s infinite;
    }}

    .deck-controls-top {{
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }}

    .deck-counter-badge {{
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      background: rgba(199, 243, 3, 0.15);
      color: var(--lime);
      border: 1px solid rgba(199, 243, 3, 0.4);
      padding: 5px 12px;
      border-radius: 9999px;
    }}

    .btn-fullscreen {{
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }}

    .btn-fullscreen:hover {{
      background: var(--lime);
      color: var(--ink);
      border-color: var(--lime);
    }}

    /* Barra de Progreso Luminosa */
    .deck-progress-track {{
      position: relative;
      z-index: 5;
      width: 100%;
      height: 5px;
      background: rgba(255, 255, 255, 0.08);
    }}

    .deck-progress-fill {{
      height: 100%;
      width: 6.66%;
      background: linear-gradient(90deg, var(--teal-bright), var(--lime));
      box-shadow: 0 0 16px var(--lime);
      transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    }}

    /* Selector Rápido de Diapositivas (1 a 15) */
    .slide-pills-strip {{
      position: relative;
      z-index: 5;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 10px 18px 4px;
      overflow-x: auto;
      scrollbar-width: none;
    }}
    .slide-pills-strip::-webkit-scrollbar {{ display: none; }}

    .slide-num-pill {{
      background: rgba(255, 255, 255, 0.07);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 4px 9px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }}

    .slide-num-pill:hover {{
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }}

    .slide-num-pill.active {{
      background: var(--lime);
      color: var(--ink);
      border-color: var(--lime);
      box-shadow: 0 0 12px rgba(199, 243, 3, 0.45);
    }}

    /* Viewport de las Diapositivas */
    .slide-viewport {{
      position: relative;
      z-index: 3;
      min-height: 520px;
      padding: clamp(18px, 3.2vw, 38px) clamp(16px, 3.8vw, 48px);
      display: flex;
      align-items: center;
    }}

    .deck-stage:fullscreen .slide-viewport {{
      flex: 1;
      overflow-y: auto;
    }}

    .slide {{
      display: none;
      width: 100%;
      animation: slideReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    }}

    .slide.active {{
      display: block;
    }}

    @keyframes slideReveal {{
      0% {{ opacity: 0; transform: translateY(14px) scale(0.985); filter: blur(4px); }}
      100% {{ opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }}
    }}

    /* Elementos Internos de cada Slide */
    .slide-header-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }}

    .slide-badge {{
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 13px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      background: rgba(45, 212, 191, 0.16);
      color: var(--teal-bright);
      border: 1px solid rgba(45, 212, 191, 0.4);
    }}

    .slide-badge.lime {{
      background: rgba(199, 243, 3, 0.16);
      color: var(--lime);
      border-color: rgba(199, 243, 3, 0.45);
    }}

    .slide-badge.amber {{
      background: rgba(245, 158, 11, 0.18);
      color: #fcd34d;
      border-color: rgba(245, 158, 11, 0.45);
    }}

    .slide h2 {{
      font-family: var(--font-display);
      font-size: clamp(22px, 3.2vw, 38px);
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.025em;
      color: #ffffff;
      margin-bottom: 10px;
    }}

    .slide h2 .accent-lime {{
      color: var(--lime);
    }}

    .slide h2 .accent-teal {{
      color: var(--teal-bright);
    }}

    .slide-lead {{
      font-size: clamp(13.5px, 1.4vw, 16.5px);
      color: #cbd5e1;
      max-width: 880px;
      margin-bottom: 20px;
    }}

    /* Grids de Diapositivas */
    .s-grid-2 {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }}

    .s-grid-3 {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }}

    .s-grid-4 {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }}

    @media (max-width: 900px) {{
      .s-grid-3, .s-grid-4 {{ grid-template-columns: repeat(2, 1fr); }}
    }}

    @media (max-width: 640px) {{
      .s-grid-2, .s-grid-3, .s-grid-4 {{ grid-template-columns: 1fr; }}
    }}

    /* Tarjetas Cinemáticas dentro de Slides */
    .s-card {{
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 16px;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(8px);
      transition: transform 0.25s ease, border-color 0.25s ease;
    }}

    .s-card:hover {{
      transform: translateY(-3px);
      border-color: rgba(199, 243, 3, 0.45);
    }}

    .s-card.glow-lime {{
      background: linear-gradient(145deg, rgba(199, 243, 3, 0.12), rgba(15, 23, 42, 0.85));
      border-color: rgba(199, 243, 3, 0.45);
    }}

    .s-card.glow-teal {{
      background: linear-gradient(145deg, rgba(13, 148, 136, 0.22), rgba(15, 23, 42, 0.85));
      border-color: rgba(45, 212, 191, 0.45);
    }}

    .s-card h4 {{
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .s-card p {{
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.48;
    }}

    /* Gráficas de Barras Animadas en Slides */
    .chart-bar-wrap {{
      margin-top: 10px;
    }}

    .chart-bar-label {{
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 4px;
    }}

    .chart-bar-bg {{
      width: 100%;
      height: 9px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      overflow: hidden;
    }}

    .chart-bar-fill {{
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--teal-bright), var(--lime));
      animation: growBar 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }}

    @keyframes growBar {{
      from {{ width: 0%; }}
    }}

    /* Simulador Interactivo de Tokens (Slide 4) */
    .token-sim-box {{
      background: rgba(2, 6, 23, 0.88);
      border: 1px solid rgba(199, 243, 3, 0.4);
      border-radius: 18px;
      padding: 16px;
      margin-top: 14px;
    }}

    .token-input-row {{
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }}

    .token-input {{
      flex: 1;
      min-width: 200px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-family: var(--font-sans);
    }}

    .token-pills-output {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      min-height: 46px;
      align-items: center;
    }}

    .tok-chip {{
      padding: 4px 9px;
      border-radius: 8px;
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      animation: popIn 0.25s ease;
    }}

    @keyframes popIn {{
      from {{ transform: scale(0.8); opacity: 0; }}
      to {{ transform: scale(1); opacity: 1; }}
    }}

    /* Diagrama Animado de Flujo / Tubería SVG */
    .flow-diagram-box {{
      background: rgba(2, 6, 23, 0.78);
      border: 1px solid rgba(45, 212, 191, 0.35);
      border-radius: 20px;
      padding: 18px;
      margin: 14px 0;
      position: relative;
      overflow: hidden;
    }}

    .flow-nodes-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }}

    .flow-node {{
      flex: 1;
      min-width: 145px;
      background: rgba(15, 23, 42, 0.92);
      border: 1.5px solid rgba(199, 243, 3, 0.45);
      border-radius: 16px;
      padding: 12px;
      text-align: center;
      position: relative;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
    }}

    .flow-node .f-icon {{
      font-size: 26px;
      margin-bottom: 4px;
    }}

    .flow-node .f-title {{
      font-size: 13px;
      font-weight: 800;
      color: #fff;
    }}

    .flow-node .f-sub {{
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }}

    .flow-arrow-anim {{
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--lime);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      animation: pulseArrow 1.4s infinite;
    }}

    @keyframes pulseArrow {{
      0%, 100% {{ transform: translateX(0); opacity: 0.75; }}
      50% {{ transform: translateX(5px); opacity: 1; }}
    }}

    @media (max-width: 680px) {{
      .flow-arrow-anim {{
        width: 100%;
        transform: rotate(90deg);
        margin: 4px 0;
      }}
    }}

    /* Mockup de Chat de Antigravity dentro de las Slides */
    .chat-sim-window {{
      background: #090d16;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    }}

    .chat-sim-header {{
      background: #111827;
      padding: 9px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-family: var(--font-mono);
      font-size: 11px;
      color: #94a3b8;
    }}

    .win-dots {{
      display: flex;
      gap: 6px;
    }}
    .win-dots span {{
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }}

    .chat-sim-body {{
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }}

    .c-bubble-user {{
      align-self: flex-end;
      background: linear-gradient(135deg, #0d9488, #0f766e);
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 16px 16px 4px 16px;
      font-size: 12.5px;
      max-width: 90%;
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.3);
    }}

    .c-bubble-ai {{
      align-self: flex-start;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(199, 243, 3, 0.35);
      color: #e2e8f0;
      padding: 10px 14px;
      border-radius: 16px 16px 16px 4px;
      font-size: 12.5px;
      max-width: 92%;
    }}

    .c-bubble-ai strong {{
      color: var(--lime);
    }}

    /* Footer de Controles de la Presentación */
    .deck-footer {{
      position: relative;
      z-index: 5;
      background: rgba(2, 6, 23, 0.86);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }}

    .deck-nav-group {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .btn-slide-ctrl {{
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 10px 18px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
    }}

    .btn-slide-ctrl:hover:not(:disabled) {{
      background: var(--lime);
      color: var(--ink);
      border-color: var(--lime);
    }}

    .btn-slide-ctrl:disabled {{
      opacity: 0.35;
      cursor: not-allowed;
    }}

    .btn-slide-ctrl.primary-next {{
      background: var(--lime);
      color: var(--ink);
      border-color: var(--lime);
      box-shadow: 0 0 20px rgba(199, 243, 3, 0.35);
    }}

    /* ==========================================================================
       3B. REPRODUCTOR CINEMATOGRÁFICO DE LA GRABACIÓN OFICIAL (MISMO ESTILO DECK)
       ========================================================================== */
    .recording-section {{
      padding: clamp(16px, 3vw, 32px) 0 20px;
    }}

    .video-viewport-wrap {{
      position: relative;
      z-index: 3;
      padding: clamp(14px, 2.5vw, 28px) clamp(14px, 3vw, 38px);
    }}

    .video-aspect-box {{
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #02060d;
      border-radius: 20px;
      overflow: hidden;
      border: 1.5px solid rgba(199, 243, 3, 0.38);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 32px rgba(13, 148, 136, 0.22);
    }}

    .video-aspect-box iframe {{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }}

    /* Miniatura Personalizada (Poster Overlay) sobre el Reproductor */
    .video-thumb-cover {{
      position: absolute;
      inset: 0;
      z-index: 10;
      background:
        radial-gradient(circle at 18% 55%, rgba(199, 243, 3, 0.22) 0%, transparent 45%),
        radial-gradient(circle at 82% 55%, rgba(45, 212, 191, 0.26) 0%, transparent 48%),
        linear-gradient(135deg, #06151a 0%, #0b262e 50%, #040d11 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: clamp(16px, 3.5vw, 44px);
      cursor: pointer;
      transition: opacity 0.4s ease, visibility 0.4s ease;
      overflow: hidden;
    }}

    .video-thumb-cover.hidden {{
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }}

    .video-thumb-grid-bg {{
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(199, 243, 3, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(45, 212, 191, 0.06) 1px, transparent 1px);
      background-size: 44px 44px;
      pointer-events: none;
    }}

    .thumb-char-col {{
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      width: 26%;
      height: 100%;
    }}

    .thumb-char-col img {{
      height: 82%;
      max-height: 88%;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 18px 32px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 24px rgba(199, 243, 3, 0.28));
      transition: transform 0.35s ease;
    }}

    .thumb-halo-svg {{
      width: clamp(64px, 8vw, 130px);
      height: auto;
      margin-bottom: -14px;
      filter: drop-shadow(0 0 14px rgba(250, 204, 21, 0.95));
      z-index: 3;
    }}

    .video-thumb-cover:hover .thumb-char-col img {{
      transform: scale(1.04) translateY(-4px);
    }}

    .thumb-char-tag {{
      margin-top: -10px;
      background: rgba(6, 20, 25, 0.92);
      border: 1.5px solid var(--lime);
      color: var(--lime);
      font-family: var(--font-mono);
      font-size: clamp(9px, 1.05vw, 13px);
      font-weight: 800;
      padding: 5px 14px;
      border-radius: 999px;
      white-space: nowrap;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
    }}

    .thumb-center-col {{
      position: relative;
      z-index: 3;
      width: 48%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: clamp(8px, 1.5vw, 16px);
    }}

    .thumb-logos-pill {{
      display: inline-flex;
      align-items: center;
      gap: 14px;
      background: rgba(255, 255, 255, 0.96);
      padding: 8px 22px;
      border-radius: 999px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(45, 212, 191, 0.35);
      border: 2px solid #2dd4bf;
    }}

    .thumb-logos-pill img.wappy-h {{
      height: clamp(22px, 3vw, 40px);
      width: auto;
      object-fit: contain;
    }}

    .thumb-logos-pill .plus-sep {{
      font-weight: 900;
      font-size: clamp(14px, 1.8vw, 22px);
      color: #0d9488;
    }}

    .thumb-logos-pill img.agy-i {{
      height: clamp(22px, 3vw, 38px);
      width: auto;
      object-fit: contain;
    }}

    .thumb-clase-giant {{
      font-family: var(--font-display);
      font-size: clamp(32px, 5.8vw, 76px);
      font-weight: 900;
      line-height: 0.98;
      letter-spacing: -0.04em;
      color: var(--ink);
      background: var(--lime);
      padding: 6px 26px;
      border-radius: 20px;
      box-shadow: 0 12px 40px rgba(199, 243, 3, 0.45);
      text-transform: uppercase;
    }}

    .thumb-sub-title {{
      font-family: var(--font-display);
      font-size: clamp(14px, 2.2vw, 28px);
      font-weight: 900;
      color: #ffffff;
      line-height: 1.15;
      text-shadow: 0 6px 20px rgba(0, 0, 0, 0.7);
    }}

    .thumb-sub-title span {{
      color: #2dd4bf;
    }}

    .thumb-play-cta {{
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #ffffff;
      font-family: var(--font-display);
      font-size: clamp(12px, 1.4vw, 17px);
      font-weight: 900;
      padding: clamp(9px, 1.2vw, 14px) clamp(18px, 2.4vw, 30px);
      border-radius: 999px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      box-shadow: 0 14px 36px rgba(239, 68, 68, 0.55);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }}

    .video-thumb-cover:hover .thumb-play-cta {{
      transform: scale(1.06);
      box-shadow: 0 18px 44px rgba(239, 68, 68, 0.75);
    }}

    .thumb-play-icon {{
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #ffffff;
      color: #dc2626;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      padding-left: 2px;
    }}

    @media (max-width: 680px) {{
      .thumb-char-col {{
        width: 24%;
      }}
      .thumb-center-col {{
        width: 52%;
        gap: 6px;
      }}
      .thumb-char-tag {{
        display: none;
      }}
    }}

    .recording-chapters-strip {{
      position: relative;
      z-index: 5;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px 0;
      overflow-x: auto;
      scrollbar-width: none;
    }}
    .recording-chapters-strip::-webkit-scrollbar {{ display: none; }}

    .rec-chapter-pill {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #cbd5e1;
      padding: 5px 12px;
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }}

    .rec-chapter-pill strong {{
      color: var(--lime);
    }}

    /* Botón Destacado debajo del Video para Abrir el Popup de Notas */
    .notes-trigger-bar {{
      position: relative;
      z-index: 5;
      margin: 0 clamp(14px, 3vw, 38px) 22px;
      background: linear-gradient(135deg, rgba(199, 243, 3, 0.14) 0%, rgba(13, 148, 136, 0.24) 100%);
      border: 2px solid var(--lime);
      border-radius: 22px;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.4), 0 0 28px rgba(199, 243, 3, 0.18);
    }}

    .notes-trigger-info h3 {{
      font-family: var(--font-display);
      font-size: clamp(16px, 2vw, 20px);
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }}

    .notes-trigger-info p {{
      font-size: 13px;
      color: #cbd5e1;
    }}

    .btn-open-notes {{
      background: var(--lime);
      color: var(--ink);
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 900;
      padding: 13px 24px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 0 28px rgba(199, 243, 3, 0.5);
      transition: transform 0.2s ease, background 0.2s ease;
    }}

    .btn-open-notes:hover {{
      background: #d8ff29;
      transform: translateY(-2px) scale(1.02);
    }}

    /* ==========================================================================
       MODAL / POPUP INTERACTIVO DE NOTAS Y MEMORIAS DE LA CLASE 1
       ========================================================================== */
    .notes-modal-backdrop {{
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(2, 8, 12, 0.82);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: clamp(10px, 2.5vw, 28px);
      animation: fadeBackdrop 0.25s ease;
    }}

    .notes-modal-backdrop.open {{
      display: flex;
    }}

    @keyframes fadeBackdrop {{
      from {{ opacity: 0; }}
      to {{ opacity: 1; }}
    }}

    .notes-modal-window {{
      width: 100%;
      max-width: 1080px;
      max-height: 90vh;
      background: radial-gradient(ellipse at 20% 10%, #102a2e 0%, #071318 60%, #040a0e 100%);
      border: 2px solid rgba(199, 243, 3, 0.45);
      border-radius: 28px;
      box-shadow: 0 32px 90px rgba(0, 0, 0, 0.8), 0 0 50px rgba(199, 243, 3, 0.18);
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: popModal 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }}

    @keyframes popModal {{
      from {{ opacity: 0; transform: translateY(20px) scale(0.96); }}
      to {{ opacity: 1; transform: translateY(0) scale(1); }}
    }}

    .notes-modal-header {{
      padding: 18px 24px;
      background: rgba(2, 6, 23, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }}

    .notes-modal-title-wrap h3 {{
      font-family: var(--font-display);
      font-size: clamp(17px, 2.2vw, 22px);
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .notes-modal-title-wrap p {{
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }}

    .btn-close-modal {{
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
    }}

    .btn-close-modal:hover {{
      background: #ef4444;
      border-color: #ef4444;
    }}

    /* Pestañas del Modal de Notas */
    .notes-tabs-bar {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 24px;
      background: rgba(15, 23, 42, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      flex-wrap: wrap;
    }}

    .notes-tab-group {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }}

    .notes-tab-btn {{
      background: rgba(255, 255, 255, 0.07);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.14);
      padding: 8px 15px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
    }}

    .notes-tab-btn:hover {{
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }}

    .notes-tab-btn.active {{
      background: var(--lime);
      color: var(--ink);
      border-color: var(--lime);
      box-shadow: 0 0 16px rgba(199, 243, 3, 0.4);
    }}

    .notes-modal-body {{
      padding: clamp(16px, 2.5vw, 26px);
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }}

    .notes-pane {{
      display: none;
      flex-direction: column;
      gap: 16px;
    }}

    .notes-pane.active {{
      display: flex;
    }}

    .n-links-strip {{
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      background: rgba(13, 148, 136, 0.16);
      border: 1px solid rgba(45, 212, 191, 0.35);
      padding: 12px 16px;
      border-radius: 16px;
      align-items: center;
      justify-content: space-between;
    }}

    .n-doc-btn {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 7px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      transition: all 0.2s;
    }}

    .n-doc-btn:hover {{
      background: var(--lime);
      color: var(--ink);
      border-color: var(--lime);
    }}

    .n-task-item {{
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-left: 4px solid var(--lime);
      border-radius: 14px;
      padding: 12px 16px;
      font-size: 13px;
      color: #e2e8f0;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }}

    .n-task-owner {{
      background: rgba(199, 243, 3, 0.16);
      color: var(--lime);
      border: 1px solid rgba(199, 243, 3, 0.4);
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 8px;
      white-space: nowrap;
      flex-shrink: 0;
    }}

    .n-detail-card {{
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.11);
      border-radius: 16px;
      padding: 15px 18px;
    }}

    .n-detail-card h4 {{
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 800;
      color: #2dd4bf;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }}

    .n-detail-card p {{
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.55;
    }}

    .ts-link {{
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(199, 243, 3, 0.16);
      color: var(--lime);
      border: 1px solid rgba(199, 243, 3, 0.4);
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      margin-left: 4px;
      transition: all 0.2s;
    }}

    .ts-link:hover {{
      background: var(--lime);
      color: var(--ink);
    }}

    /* ==========================================================================
       4. SECCIÓN DE PROMPTS CONVERSACIONALES PARA EL CHAT (CERO CÓDIGO)
       ========================================================================== */
    .prompts-section {{
      padding: clamp(36px, 5vw, 64px) 0 20px;
    }}

    .zero-code-banner {{
      background: linear-gradient(135deg, #0e1300 0%, #16261f 100%);
      color: #ffffff;
      border-radius: 26px;
      padding: clamp(20px, 3.5vw, 34px);
      margin-bottom: 26px;
      border: 2px solid var(--lime);
      box-shadow: 0 20px 50px -12px rgba(14, 19, 0, 0.25);
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 20px;
      align-items: center;
    }}

    @media (max-width: 820px) {{
      .zero-code-banner {{
        grid-template-columns: 1fr;
      }}
    }}

    .zero-code-banner h3 {{
      font-family: var(--font-display);
      font-size: clamp(20px, 2.5vw, 28px);
      font-weight: 900;
      color: var(--lime);
      margin-bottom: 8px;
    }}

    .zero-code-banner p {{
      font-size: 14.5px;
      color: #e2e8f0;
    }}

    .zero-code-compare {{
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 18px;
      padding: 14px;
      font-size: 12.5px;
    }}

    .prompt-cards-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }}

    @media (max-width: 860px) {{
      .prompt-cards-grid {{
        grid-template-columns: 1fr;
      }}
    }}

    .prompt-chat-card {{
      background: var(--paper);
      border: 1.5px solid rgba(14, 19, 0, 0.1);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 14px 34px -10px rgba(14, 19, 0, 0.08);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }}

    .prompt-chat-card:hover {{
      transform: translateY(-3px);
      box-shadow: 0 20px 42px -12px rgba(14, 19, 0, 0.15);
      border-color: var(--teal);
    }}

    .p-card-top {{
      padding: 18px 20px 12px;
      border-bottom: 1px solid var(--stone);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }}

    .p-step-tag {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--ink);
      color: var(--lime);
      font-size: 11px;
      font-weight: 800;
      padding: 4px 11px;
      border-radius: 9999px;
      text-transform: uppercase;
    }}

    .p-card-body {{
      padding: 18px 20px;
      flex: 1;
    }}

    .p-card-title {{
      font-family: var(--font-display);
      font-size: 17px;
      font-weight: 900;
      color: var(--ink);
      margin-bottom: 6px;
    }}

    .p-card-explain {{
      font-size: 13px;
      color: var(--ink-muted);
      margin-bottom: 14px;
    }}

    .chat-prompt-box {{
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 16px;
      padding: 14px;
      position: relative;
    }}

    .chat-prompt-label {{
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #15803d;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .chat-prompt-text {{
      font-family: var(--font-sans);
      font-size: 13.5px;
      font-weight: 600;
      color: #064e3b;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }}

    .p-card-footer {{
      padding: 12px 20px;
      background: var(--cream);
      border-top: 1px solid var(--stone);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }}

    .p-result-note {{
      font-size: 11.5px;
      font-weight: 700;
      color: var(--teal);
    }}

    .btn-copy-prompt {{
      background: var(--ink);
      color: var(--lime);
      border: none;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }}

    .btn-copy-prompt:hover {{
      background: var(--teal);
      color: #ffffff;
    }}

    /* ==========================================================================
       5. GUÍA PASO A PASO DEL CURSO (5 BLOQUES PEDAGÓGICOS)
       ========================================================================== */
    .guide-section {{
      padding: clamp(32px, 4.5vw, 56px) 0;
    }}

    .guide-blocks-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 18px;
    }}

    .g-block-card {{
      background: var(--paper);
      border: 1px solid rgba(14, 19, 0, 0.09);
      border-radius: 24px;
      padding: clamp(18px, 3vw, 28px);
      box-shadow: 0 10px 30px -10px rgba(14, 19, 0, 0.06);
    }}

    .g-block-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }}

    .g-badge {{
      background: var(--lime);
      color: var(--ink);
      font-size: 11.5px;
      font-weight: 900;
      padding: 5px 13px;
      border-radius: 9999px;
      text-transform: uppercase;
    }}

    .g-time {{
      font-size: 12px;
      font-weight: 800;
      color: var(--teal);
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      padding: 4px 12px;
      border-radius: 9999px;
    }}

    .g-block-card h3 {{
      font-family: var(--font-display);
      font-size: clamp(18px, 2.2vw, 23px);
      font-weight: 900;
      color: var(--ink);
      margin-bottom: 8px;
    }}

    .g-list {{
      list-style: none;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 14px;
    }}

    @media (max-width: 760px) {{
      .g-list {{
        grid-template-columns: 1fr;
      }}
    }}

    .g-list li {{
      background: var(--cream);
      border: 1px solid var(--stone);
      border-radius: 16px;
      padding: 13px 15px;
      font-size: 13.5px;
      color: var(--ink-soft);
    }}

    .g-list li strong {{
      color: var(--ink);
      display: block;
      margin-bottom: 3px;
      font-size: 14px;
    }}

    /* Footer CTA Banner */
    .final-cta-card {{
      background: var(--ink);
      color: #ffffff;
      border-radius: 28px;
      padding: clamp(24px, 4vw, 40px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
      margin-top: 28px;
      box-shadow: 0 24px 60px -15px rgba(14, 19, 0, 0.35);
    }}

    footer {{
      text-align: center;
      padding: 32px 16px 10px;
      font-size: 13px;
      color: var(--ink-muted);
    }}
  </style>
</head>
<body>

  <!-- ========================================================================
       1. FLOATING NAVBAR OFICIAL WAPPY.CLUB
       ======================================================================== -->
  <div class="nav-wrap">
    <nav class="nav">
      <a href="#inicio" class="brand">
        <div class="brand-icon">
          <img src="{cat_logo}" alt="WAPPY IA">
        </div>
        <div class="brand-text">
          <div class="main">WAPPY<span>IA</span></div>
          <div class="sub">SOMOS SST</div>
        </div>
      </a>

      <div class="nav-links">
        <a href="/clase1">⏮️ Ir a Clase 1</a>
        <a href="#presentacion" class="active-pill">🎬 Presentación</a>
        <a href="#grabacion">🎥 Grabación & Notas</a>
        <a href="#prompts-chat">💬 Prompts Clase 2</a>
        <a href="#guia-paso-a-paso">📘 Guía Paso a Paso</a>
      </div>

      <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn btn-dark" style="flex-shrink: 0;">
        Entrar a Meet
        <span class="arrow-pip">↗</span>
      </a>
    </nav>
  </div>

  <!-- ========================================================================
       2. HERO OFICIAL ESTILO WAPPY.CLUB (SKY + NUBES + TENSHI)
       ======================================================================== -->
  <header class="hero" id="inicio">
    <div class="hero-cloud c1"></div>
    <div class="hero-cloud c2"></div>
    <div class="hero-cloud c3"></div>

    <div class="container hero-inner">
      <div>
        <div class="eyebrow">
          <span class="dot"></span>
          <span>CLASE 02 EN VIVO · MARTES 27 DE OCTUBRE · 7:00 PM A 9:00 PM COL</span>
        </div>

        <h1>
          <span class="highlight-lime">Tenshi en el Bolsillo</span>, Conexión MCP WAPPY y Skills en Vivo.
        </h1>

        <p class="hero-sub">
          Convierte tu celular en un comando de voz manos libres en campo con <strong>Tenshi Voice</strong>, conecta en vivo tu proyecto de <strong>Google Antigravity</strong> con <strong>WAPPY vía MCP</strong>, ahorra el <strong>80% de tokens</strong> convirtiendo PDFs a Markdown (<code>.md</code>) y crea tus primeros <strong>Skills, Triggers e Informes de Simulacro</strong> sin programar.
        </p>

        <div class="hero-ctas">
          <a href="#presentacion" class="btn btn-lime">
            🎬 Presentación Clase 2 (15 Slides)
            <span class="arrow-pip">↓</span>
          </a>
          <a href="#prompts-chat" class="btn btn-dark">
            💬 6 Prompts Clase 2 (Sin Código)
            <span class="arrow-pip">⚡</span>
          </a>
          <button type="button" onclick="openNotesModal()" class="btn btn-glass">
            📝 Tareas Previas y Bitácora
          </button>
        </div>

        <div class="hero-pills-bar">
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔌 Bloque 1 (30 Min)</div>
            <div class="hero-pill-val">Conexión MCP WAPPY + .MD</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">📱 Bloque 2 (30 Min)</div>
            <div class="hero-pill-val">Tenshi Voice en el Celular</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">📲 Bloque 3 (30 Min)</div>
            <div class="hero-pill-val">Órdenes Delegadas al PC</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">⚙️ Bloque 4 (30 Min)</div>
            <div class="hero-pill-val">Skills, Simulacro & Triggers</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta Interactiva de Tenshi en el Hero -->
      <div class="hero-tenshi-card">
        <div class="hero-tenshi-glow"></div>
        <img src="{tenshi_img}" alt="Tenshi IA" class="tenshi-avatar-floating">
        <div class="tenshi-bubble">
          «¡Hola! Soy <strong>Tenshi</strong>. En esta <strong>Clase 2</strong> me llevarás en tu bolsillo al recorrer la obra o planta: me dictarás actos y condiciones inseguras por voz desde el celular y yo le dejaré <strong>órdenes delegadas</strong> a Antigravity en tu PC para actualizar WAPPY.»
        </div>
        <div class="meet-live-strip">
          <div style="text-align:left;">
            <div style="font-size:10px; text-transform:uppercase; color:#99f6e4; font-weight:800;">Sala Google Meet Oficial</div>
            <div style="font-weight:900; color:#fff;">meet.google.com/xvz-jmvv-iym</div>
          </div>
          <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:8px 14px; font-size:12px;">
            Unirme Ahora ↗
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- ========================================================================
       3. PRESENTACIÓN INTERACTIVA DE ALTO IMPACTO · CLASE 2 (15 DIAPOSITIVAS)
       ======================================================================== -->
  <section class="presentation-section" id="presentacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">✨ Presentación Oficial en Vivo · Semana 2 (Martes 27 de Octubre)</span>
          <h2 class="sec-big-title">Diapositivas Dinámicas de la Clase 2 (15 Slides)</h2>
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
            <span>WAPPY.CLUB // CLASE_02 // TENSHI_VOICE_&_MCP_ACTIVO</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge" id="deck-counter">SLIDE 01 / 15</span>
            <button class="btn-fullscreen" onclick="toggleDeckFullscreen()">
              ⛶ Pantalla Completa
            </button>
          </div>
        </div>

        <div class="deck-progress-track">
          <div class="deck-progress-fill" id="slide-progress"></div>
        </div>

        <!-- Selector rápido de las 15 diapositivas de la Clase 2 -->
        <div class="slide-pills-strip" id="slide-pills-strip">
          <button class="slide-num-pill active" onclick="showSlide(1)">01 Portada C2</button>
          <button class="slide-num-pill" onclick="showSlide(2)">02 Reto #1 & Regla</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 Ahorro 80% .MD</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 Conectar MCP</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 Las 55+ Tools</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 Multi-Empresa</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 Caso Simulacro</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 Crear SKILL.md</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 Tenshi Bolsillo</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 Voz en Campo</button>
          <button class="slide-num-pill" onclick="showSlide(11)">11 Órdenes Delegadas</button>
          <button class="slide-num-pill" onclick="showSlide(12)">12 7 Especialistas</button>
          <button class="slide-num-pill" onclick="showSlide(13)">13 Triggers & Cron</button>
          <button class="slide-num-pill" onclick="showSlide(14)">14 Atajos /Slash</button>
          <button class="slide-num-pill" onclick="showSlide(15)">15 Reto #2</button>
        </div>

        <!-- VIEWPORT DE LAS 15 DIAPOSITIVAS DE LA CLASE 2 -->
        <div class="slide-viewport" id="slide-viewport">

          <!-- ==================== SLIDE 1: PORTADA CLASE 2 ==================== -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge lime">🚀 Clase 02 Oficial · Semana 2 (Martes 27 de Octubre)</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">7:00 PM – 9:00 PM COL</span>
            </div>
            <h2><span class="accent-lime">Tenshi en el Bolsillo</span>, Puente MCP en Vivo y Automatización con <span class="accent-teal">Skills</span></h2>
            <p class="slide-lead">
              En la Clase 1 instalamos Antigravity, organizamos carpetas por proyecto y aprendimos la regla <em>"sin editar nada"</em>. Hoy damos el salto a la acción real: <strong>conectamos el MCP de WAPPY en vivo</strong>, creamos nuestros primeros <strong>Skills de informes</strong> y activamos a <strong>Tenshi Voice desde el celular en campo</strong>.
            </p>

            <div class="s-grid-4" style="margin-bottom: 16px;">
              <div class="s-card glow-lime">
                <div style="font-size:26px; font-weight:900; color:var(--lime);">-80%</div>
                <h4>Ahorro con Markdown</h4>
                <p>Convertimos PDFs pesados e informes a <code>.md</code> para multiplicar por 5 tus tokens.</p>
              </div>
              <div class="s-card glow-teal">
                <div style="font-size:26px; font-weight:900; color:var(--teal-bright);">55+ Tools</div>
                <h4>MCP WAPPY Activo</h4>
                <p>Enchufamos Antigravity con tu cuenta de WAPPY para alimentar GTC 45, PESV y 0312.</p>
              </div>
              <div class="s-card">
                <div style="font-size:26px; font-weight:900; color:#fcd34d;">📱 Voz</div>
                <h4>Tenshi en Campo</h4>
                <p>Dictas hallazgos caminando por la planta desde tu celular sin escribir una sola letra.</p>
              </div>
              <div class="s-card">
                <div style="font-size:26px; font-weight:900; color:#c084fc;">⚡ Auto</div>
                <h4>Órdenes Delegadas</h4>
                <p>Tenshi le deja la orden a Antigravity para que procese las evidencias en tu computador.</p>
              </div>
            </div>

            <div class="flow-diagram-box">
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lime); margin-bottom:10px; letter-spacing:0.08em;">
                🗺️ El Circuito Completo que Dejaremos Funcionando en la Clase 2
              </div>
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">📱</div>
                  <div class="f-title">1. Celular en Campo</div>
                  <div class="f-sub">Le hablas a Tenshi Voice en la obra</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">☁️</div>
                  <div class="f-title">2. Orden Delegada</div>
                  <div class="f-sub">WAPPY guarda el hallazgo y la orden</div>
                </div>
                <div class="flow-arrow-anim">━━🔌 MCP ━━▶</div>
                <div class="flow-node" style="border-color:var(--lime);">
                  <div class="f-icon">💻</div>
                  <div class="f-title">3. Antigravity en PC</div>
                  <div class="f-sub">Lee fotos/Drive y ejecuta el Skill</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">📊</div>
                  <div class="f-title">4. WAPPY al Día</div>
                  <div class="f-sub">Matriz GTC 45, Acta e Informe listos</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 2: REVISIÓN DE COMPROMISOS DE LA CLASE 1 ==================== -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge amber">✅ Repaso de los Compromisos (Clase 1 → Clase 2)</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">AUDITORÍA DE ARRANQUE</span>
            </div>
            <h2>Las 3 Reglas de Oro que Aprendimos en la <span class="accent-lime">Sesión Anterior</span></h2>
            <p class="slide-lead">
              Antes de conectar el MCP y Tenshi Voice, verifiquemos que todos tengamos aplicados estos 3 pilares fundamentales vistos en la Clase 1:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>📁 1. Un Proyecto por Actividad Específica</h4>
                <p>Nunca abras todo tu disco duro como un solo proyecto gigante. Crea carpetas puntuales (ej. <code>/Auditoria_Empresas</code> o <code>/Simulacro_2026</code>) para no desperdiciar tokens leyendo archivos innecesarios.</p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Ahorro de Contexto por Carpeta</span><span>85%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:85%"></div></div>
                </div>
              </div>
              <div class="s-card glow-teal">
                <h4>🛡️ 2. El Comando «Sin Editar Nada»</h4>
                <p>Cuando quieras que Antigravity solo <strong>investigue, lea o audite</strong> tus carpetas sin modificar tus archivos originales, agrégale siempre la frase mágica: <strong>"sin editar nada"</strong> y usa pensamiento <em>Low</em> en consultas simples.</p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Seguridad de tus Archivos Base</span><span>100%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%"></div></div>
                </div>
              </div>
              <div class="s-card">
                <h4>☁️ 3. Drive, OneDrive, Mega o Local</h4>
                <p>Recuerda que Antigravity puede leer cualquier nube (Google Drive, OneDrive corporativo o Dropbox) siempre que la carpeta esté <strong>sincronizada localmente</strong> en tu computador.</p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Compatibilidad con Nubes</span><span>100%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%"></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 3: ESTRATEGIA MARKDOWN (.MD) PARA AHORRAR 80% DE TOKENS ==================== -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge lime">🪙 Optimización Inteligente de Tokens</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">DE PDF PESADO A MARKDOWN (.MD)</span>
            </div>
            <h2>Cómo Ahorrar el <span class="accent-lime">80% de Tokens</span> Convirtiendo Documentos a <span class="accent-teal">Markdown (.md)</span></h2>
            <p class="slide-lead">
              Como vimos en la Clase 1, un PDF pesado o una imagen en <code>base64</code> puede gastar más de 2,000 tokens por página. Si le pides a Antigravity que convierta una sola vez tus normas y manuales a <strong>Markdown (<code>.md</code>)</strong>, las futuras consultas gastarán una fracción mínima:
            </p>

            <div class="s-grid-2" style="margin-bottom: 14px;">
              <div class="s-card" style="border-color:rgba(239,68,68,0.4);">
                <h4 style="color:#fca5a5;">❌ Leer siempre el PDF / Word original o Fotos Crudas</h4>
                <p>
                  • Cada vez que abres un chat nuevo y le pasas un PDF de 100 páginas, la IA vuelve a cobrar miles de tokens por el formato oculto.<br>
                  • Las imágenes sin comprimir se codifican en <code>base64</code> (~2,000 tokens cada una).
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Consumo de Tokens (Alto)</span><span>100% Gasto</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%; background:#ef4444;"></div></div>
                </div>
              </div>

              <div class="s-card glow-lime">
                <h4>✅ Convertir a Markdown (.md) + Estructuras de WAPPY</h4>
                <p>
                  • Le pides al chat de Antigravity que extraiga el texto limpio a un archivo <code>.md</code> o <code>.json</code>.<br>
                  • Al enviar los datos estructurados a <strong>WAPPY vía MCP</strong>, ahorras entre el <strong>70% y 80% de tokens</strong>.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Consumo de Tokens con .MD + WAPPY</span><span>Solo 20%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:20%;"></div></div>
                </div>
              </div>
            </div>

            <!-- SIMULADOR DE TOKENS APLICADO A CLASE 2 -->
            <div class="token-sim-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:800; color:var(--lime); text-transform:uppercase;">
                  🧪 Simulador de Prompt Eficiente (Prueba la regla "sin editar nada" + Markdown)
                </span>
                <span id="token-stats-badge" style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf; font-weight:700;">
                  Palabras: 12 | Tokens estimados: 18
                </span>
              </div>
              <div class="token-input-row">
                <input type="text" id="token-live-input" class="token-input" value="Sin editar nada resume las actas en Markdown y actualiza WAPPY por MCP" oninput="updateTokenSimulator()">
              </div>
              <div class="token-pills-output" id="token-pills-output"></div>
            </div>
          </div>

          <!-- ==================== SLIDE 4: CONEXIÓN EN VIVO ANTIGRAVITY <-> WAPPY VÍA MCP ==================== -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔌 Práctica #1 de Hoy · Conexión en Vivo</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">EL PUENTE USB-C DE LA IA</span>
            </div>
            <h2>Paso a Paso: Conectar <span class="accent-lime">Antigravity con WAPPY</span> vía Servidor <span class="accent-teal">MCP</span></h2>
            <p class="slide-lead">
              Hoy dejamos conectado tu computador con tu cuenta de WAPPY para que nunca más tengas que digitar matrices ni cronogramas fila por fila:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>1️⃣ Obtén tu Credencial en WAPPY</h4>
                <p>Entras a <code>wappy.club</code>, abres el perfil de tu empresa activa y copias tu <strong>URL del Servidor MCP y tu Token / API Key personal</strong>.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>2️⃣ Pégala en el Prompt #1 del Chat</h4>
                <p>No tienes que editar archivos JSON a mano si no quieres: le entregas el <strong>Prompt #1 de esta página</strong> al chat de Antigravity con tu clave y él configura el servidor MCP.</p>
              </div>
              <div class="s-card">
                <h4>3️⃣ Prueba el Resumen 360°</h4>
                <p>Le dices al chat: <em>"Consulta el resumen 360 de mi empresa en WAPPY"</em> y verás cómo te responde en vivo con los datos reales de tu SG-SST.</p>
              </div>
            </div>

            <div class="chat-sim-window" style="margin-top:14px;">
              <div class="chat-sim-header">
                <div class="win-dots"><span style="background:#ef4444;"></span><span style="background:#f59e0b;"></span><span style="background:#22c55e;"></span></div>
                <span>Verificación en Vivo · Servidor MCP WAPPY Conectado</span>
              </div>
              <div class="chat-sim-body">
                <div class="c-bubble-user">
                  "Antigravity, ya te conecté el MCP de WAPPY. Sin editar nada en mis archivos, dime qué empresa tengo activa en WAPPY y cuántos riesgos hay en mi Matriz GTC 45."
                </div>
                <div class="c-bubble-ai">
                  <strong>🔌 Ejecutando <code>wappy_resumen_general_360</code> y <code>wappy_consultar_matriz_gtc45</code>...</strong><br>
                  ¡Conexión exitosa! Tu empresa activa tiene 14 riesgos registrados en la Matriz GTC 45, 3 actividades pendientes en el Cronograma SST y 2 reportes de condiciones inseguras abiertos.
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 5: LAS 55+ HERRAMIENTAS DE WAPPY EN ANTIGRAVITY ==================== -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge lime">🧰 Arsenal Completo del SG-SST</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">55+ TOOLS NATIVAS EN TU CHAT</span>
            </div>
            <h2>¿Qué Módulos de <span class="accent-lime">WAPPY</span> Puede Alimentar <span class="accent-teal">Antigravity</span> por Ti?</h2>
            <p class="slide-lead">
              Al conectar el MCP, tu chat de Antigravity desbloquea más de 55 herramientas directas sobre la base de datos de tu empresa en WAPPY:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>⚠️ 1. Matriz GTC 45 y PESV</h4>
                <p>Consulta, alimenta y actualiza peligros, controles existentes, evaluación de riesgo y riesgos viales (Res. 40595) desde tus carpetas de inspección.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>👷 2. Trabajadores, Cargos y EPP</h4>
                <p>Lee un listado Excel de tu carpeta local y registra automáticamente trabajadores, perfiles de cargo y entregas de EPP en WAPPY.</p>
              </div>
              <div class="s-card">
                <h4>📋 3. Diagnóstico 0312 y Matriz Legal</h4>
                <p>Evalúa los 60 estándares mínimos de la Resolución 0312 con justificación técnica y alimenta los requisitos legales aplicables.</p>
              </div>
              <div class="s-card">
                <h4>📅 4. Cronograma SST y Capacitaciones</h4>
                <p>Crea actividades del Plan Anual de Trabajo, programa capacitaciones y actualiza el estado de cumplimiento de cada tarea.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🧪 5. Inventario Químico y Alturas</h4>
                <p>Lee hojas de seguridad (FDS/MSDS) en PDF de tu carpeta y registra los productos químicos, pictogramas SGA y compatibilidad en WAPPY.</p>
              </div>
              <div class="s-card glow-lime">
                <h4>📲 6. Órdenes Delegadas de Tenshi</h4>
                <p>Consulta las órdenes que dictaste por voz desde tu celular en campo y las marca como completadas cuando termina el informe.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 6: GESTIÓN MULTI-EMPRESA Y AUDITORÍAS DESDE CARPETAS ==================== -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge">🏢 Para Consultores y Auditores Independientes</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASOS DE MARÍA ELENA, CAROLINA Y JENNY</span>
            </div>
            <h2>Cómo Organizar <span class="accent-lime">Múltiples Empresas</span> y Cambiar de Cliente en WAPPY</h2>
            <p class="slide-lead">
              Si asesoras a 5, 10 o 20 empresas al mismo tiempo, así es como organizas tu carpeta de proyecto y le pides al chat que cambie de empresa activa en WAPPY:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-teal" style="font-family:var(--font-mono); font-size:12.5px; line-height:1.7;">
                <h4 style="font-family:var(--font-display); margin-bottom:10px;">🗂️ Estructura Multi-Empresa Recomendada</h4>
                <div style="background:rgba(2,6,23,0.75); padding:12px; border-radius:12px; color:#e2e8f0;">
                  📁 <strong style="color:var(--lime);">Consultoria_SST_2026/</strong><br>
                  ├── 📄 <strong style="color:#2dd4bf;">AGENTS.md</strong> <em>(Reglas generales de auditoría)</em><br>
                  ├── 📂 <strong>.agents/skills/</strong> <em>(Tus plantillas de informes)</em><br>
                  ├── 📂 <strong style="color:#fcd34d;">Empresa_A_Constructora/</strong><br>
                  │   ├── 📂 inspecciones_mes/<br>
                  │   └── 📂 simulacro_evidencias/<br>
                  └── 📂 <strong style="color:#c084fc;">Empresa_B_Logistica/</strong><br>
                      ├── 📂 pesv_vehiculos/<br>
                      └── 📂 actas_copasst/
                </div>
              </div>

              <div class="s-card glow-lime">
                <h4>🔄 Cambiar de Empresa desde el Chat (`wappy_activar_empresa`)</h4>
                <p style="margin-bottom:10px;">
                  El MCP de WAPPY incluye las herramientas <code>wappy_consultar_empresas</code> y <code>wappy_activar_empresa</code>.<br><br>
                  Solo le dices al chat:<br>
                  <em>"Activa en WAPPY mi cliente Constructora ABC, lee únicamente la subcarpeta /Empresa_A_Constructora y sube los hallazgos del mes."</em>
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Cero Cruce de Datos entre Clientes</span><span>100% Seguro</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%"></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 7: CASO REAL EN VIVO - INFORME DE SIMULACRO NACIONAL ==================== -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge amber">🚨 Caso Real de la Cohorte · Simulacro Nacional</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">DE 20 INFORMES MANUALES A 1 SOLO SKILL</span>
            </div>
            <h2>Automatización de <span class="accent-lime">Informes de Simulacro</span> e Inspecciones con Fotos</h2>
            <p class="slide-lead">
              En la Clase 1 vimos el dolor de cabeza de elaborar 20 informes de simulacro tras una jornada nacional. Mira cómo lo resolvemos combinando un <strong>Informe Ejemplo</strong> con un <strong>Skill en Antigravity</strong>:
            </p>

            <div class="flow-diagram-box">
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">📄</div>
                  <div class="f-title">1. Informe Muestra</div>
                  <div class="f-sub">Pones 1 informe base bien hecho en tu carpeta</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--lime);">
                  <div class="f-icon">🧠</div>
                  <div class="f-title">2. Chat crea el Skill</div>
                  <div class="f-sub">Aprende tu estructura, tablas y criterios</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">📸</div>
                  <div class="f-title">3. Fotos + Tiempos</div>
                  <div class="f-sub">Metes las fotos y datos de las 20 empresas</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">🚀</div>
                  <div class="f-title">4. 20 Informes Listos</div>
                  <div class="f-sub">Genera el documento y registra en WAPPY</div>
                </div>
              </div>
            </div>

            <div class="s-grid-2" style="margin-top:12px;">
              <div class="s-card glow-lime">
                <h4>⏱️ Antes (Trabajo Manual Tradicional)</h4>
                <p>2 a 3 horas por empresa pegando fotos en Word, cuadrando tablas, calculando tiempos de evacuación y redactando oportunidades de mejora.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>⚡ Hoy con WAPPY + Antigravity</h4>
                <p>3 minutos por empresa: colocas las fotos y los datos básicos en la subcarpeta del cliente y ejecutas el Skill para obtener el informe completo y la tarea cerrada en WAPPY.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 8: CREAR SKILLS (SKILL.MD) Y REGLAS (AGENTS.MD) EN VIVO ==================== -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge lime">⚙️ Práctica #2 de Hoy · Habilidades Permanentes</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">CERO CÓDIGO · 100% EN ESPAÑOL</span>
            </div>
            <h2>La Diferencia Práctica entre <span class="accent-lime">AGENTS.md</span> y un <span class="accent-teal">SKILL.md</span></h2>
            <p class="slide-lead">
              Ambos archivos los escribe el chat por ti, pero cumplen misiones distintas dentro de tu proyecto:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>📜 <code>AGENTS.md</code> = Tu Constitución permanente</h4>
                <p>
                  • Vive en la raíz de tu carpeta proyecto.<br>
                  • Se carga <strong>siempre</strong> en todos los chats de esa carpeta.<br>
                  • Define quién es el agente (<em>"Eres mi Auditor Senior SST en Colombia"</em>), qué leyes respeta (Decreto 1072, Res. 0312, GTC 45) y sus reglas de seguridad (como no borrar archivos sin permiso).
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🧰 <code>.agents/skills/</code> = Tus Manuales de Procedimiento</h4>
                <p>
                  • Puedes tener 5, 10 o 20 Skills distintos en un proyecto.<br>
                  • Solo se abren cuando necesitas esa tarea específica (<strong>ahorrando miles de tokens</strong>).<br>
                  • Ejemplos: <code>informe-simulacro</code>, <code>auditoria-0312</code>, <code>inspeccion-botiquines</code>, <code>cuenta-de-cobro-mensual</code>.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 9: TENSHI EN EL BOLSILLO (VOZ DESDE EL CELULAR) ==================== -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge lime">📱 Tema Estrella Clase 2 · Tenshi en el Bolsillo</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">GOOGLE MULTIMODAL LIVE API</span>
            </div>
            <h2><span class="accent-lime">Tenshi Voice</span>: Tu Comando de Voz Manos Libres desde el <span class="accent-teal">Celular</span></h2>
            <p class="slide-lead">
              Cuando estás caminando por una obra, una bodega o una mina con casco y guantes, es incómodo abrir un computador o teclear textos largos. Por eso <strong>WAPPY incluye a Tenshi Voice en tu celular</strong>:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🎙️ 1. Conversación Fluida en Tiempo Real</h4>
                <p>Entras a <code>wappy.club</code> desde el navegador de tu celular, tocas el botón de llamada de <strong>Tenshi</strong> y hablas con él como si llamaras por teléfono a tu ingeniero de soporte.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>👁️ 2. Conoce Toda tu Empresa en Vivo</h4>
                <p>Mientras caminas, puedes preguntarle a Tenshi: <em>"¿Cuántos trabajadores tenemos activos hoy?"</em> o <em>"¿Qué tareas del cronograma vencen esta semana?"</em> y te responde hablando al instante.</p>
              </div>
              <div class="s-card">
                <h4>⚡ 3. Registra y Delega con tu Voz</h4>
                <p>Con una sola frase hablada, Tenshi registra un acto o condición insegura en WAPPY o le deja una <strong>orden delegada</strong> a Antigravity para que prepare el informe en tu oficina.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 10: CAPTURA EN CAMPO DE ACTOS Y CONDICIONES INSEGURAS ==================== -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge amber">🦺 Recorrido de Inspección en Planta / Obra</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">DE TU VOZ DIRECTO A LA NUBE</span>
            </div>
            <h2>Cómo Dictarle <span class="accent-lime">Hallazgos en Campo</span> a Tenshi mientras Caminas</h2>
            <p class="slide-lead">
              Mira este ejemplo real de un recorrido de seguridad de 30 segundos usando únicamente tu voz desde el celular:
            </p>

            <div class="s-grid-2">
              <div class="chat-sim-window">
                <div class="chat-sim-header">
                  <div class="win-dots"><span style="background:#ef4444;"></span><span style="background:#f59e0b;"></span><span style="background:#22c55e;"></span></div>
                  <span>📱 Tenshi Voice en el Celular · Recorrido Planta Producción</span>
                </div>
                <div class="chat-sim-body">
                  <div class="c-bubble-user">
                    🎙️ "Hola Tenshi, estoy en el área de soldadura y veo a un operario puliendo sin careta facial y un extintor multipropósito con la carga vencida. Regístrame este reporte urgente y agrégale el peligro a la Matriz GTC 45."
                  </div>
                  <div class="c-bubble-ai">
                    <strong>🔊 Tenshi responde por voz:</strong><br>
                    "¡Recibido! Acabo de registrar el reporte de condición y acto subestándar en el área de soldadura con prioridad Alta, y agregué el peligro mecánico por proyección de partículas en tu Matriz GTC 45. ¿Deseas que le deje una orden delegada a Antigravity para redactar el acta de cierre?"
                  </div>
                </div>
              </div>

              <div class="s-card glow-lime">
                <h4>🎯 Lo que ocurre por dentro en 2 segundos:</h4>
                <p style="margin-bottom:10px;">
                  1. Tenshi ejecuta <code>wappy_registrar_reporte_acto_condicion</code>.<br>
                  2. Evalúa el riesgo y ejecuta <code>wappy_alimentar_matriz_gtc45</code>.<br>
                  3. Si requiere seguimiento en el Plan Anual, ejecuta <code>wappy_crear_actividad_cronograma</code>.<br>
                  4. ¡Cuando regresas a tu escritorio, el trabajo sucio ya está hecho!
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Tiempo Invertido en Campo</span><span>30 Segundos</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:96%"></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 11: ÓRDENES DELEGADAS (TENSHI CELULAR -> ANTIGRAVITY PC) ==================== -->
          <div class="slide" id="slide-11">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔗 La Magia Exclusiva de WAPPY + Antigravity</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">PUENTE CELULAR ↔ COMPUTADOR</span>
            </div>
            <h2>Cómo Funcionan las <span class="accent-lime">Órdenes Delegadas</span> de Tenshi hacia Antigravity</h2>
            <p class="slide-lead">
              ¿Cómo hace tu celular en la calle para ordenarle a tu computador de la oficina que procese carpetas pesadas? A través del buzón inteligente de <strong>Órdenes Delegadas de Tenshi</strong>:
            </p>

            <div class="flow-diagram-box">
              <div class="flow-nodes-row">
                <div class="flow-node" style="border-color:#fcd34d;">
                  <div class="f-icon">🗣️📱</div>
                  <div class="f-title">1. Dictas en la Calle</div>
                  <div class="f-sub">"Tenshi, delégale a Antigravity hacer el informe de la visita de hoy"</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">📥</div>
                  <div class="f-title">2. Buzón en WAPPY</div>
                  <div class="f-sub">Queda guardada la Orden Delegada con estado Pendiente</div>
                </div>
                <div class="flow-arrow-anim">━━🔌 MCP ━━▶</div>
                <div class="flow-node" style="border-color:var(--lime);">
                  <div class="f-icon">🤖💻</div>
                  <div class="f-title">3. Antigravity la Lee</div>
                  <div class="f-sub">Usa <code>wappy_consultar_ordenes_delegadas_tenshi</code></div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">✅</div>
                  <div class="f-title">4. Ejecuta y Cierra</div>
                  <div class="f-sub">Crea el informe en tu PC y marca <code>completar_orden</code></div>
                </div>
              </div>
            </div>

            <div class="s-grid-2" style="margin-top:12px;">
              <div class="s-card glow-teal">
                <h4>🔍 Consultar Órdenes (<code>wappy_consultar_ordenes_delegadas_tenshi</code>)</h4>
                <p>Cuando Antigravity despierta en tu PC (por un Trigger o cuando le das el comando), revisa todas las órdenes que le dejaste hablándole a Tenshi desde el celular.</p>
              </div>
              <div class="s-card glow-lime">
                <h4>🏁 Completar Orden (<code>wappy_completar_orden_delegada_tenshi</code>)</h4>
                <p>Una vez Antigravity genera el documento en tu carpeta y actualiza las matrices, cierra la orden en WAPPY dejando el resumen de lo que ejecutó.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 12: DESPACHO MULTITURNO CON LOS 7 ESPECIALISTAS ==================== -->
          <div class="slide" id="slide-12">
            <div class="slide-header-row">
              <span class="slide-badge">🧠 Tu Junta Directiva de 7 Especialistas SST</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">CONTINUIDAD DE CHAT Y PROFUNDIDAD TÉCNICA</span>
            </div>
            <h2>Despacho por Voz hacia los <span class="accent-lime">7 Agentes Especialistas</span> de WAPPY</h2>
            <p class="slide-lead">
              Cuando necesitas un concepto jurídico o médico profundo desde el celular o el PC, Tenshi estructura una consulta profesional con fundamentación normativa colombiana y te conecta con el especialista indicado:
            </p>

            <div class="s-grid-4">
              <div class="s-card glow-lime">
                <h4>⚖️ Abogado SST</h4>
                <p>Defensa jurídica, Decreto 1072, Resolución 0312, culpa patronal y descargos.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🩺 Médico Laboral</h4>
                <p>Profesiogramas, restricciones médicas, reubicación y vigilancia epidemiológica.</p>
              </div>
              <div class="s-card">
                <h4>🕵️ Investigador ATEL</h4>
                <p>Resolución 1401 de 2007, árbol de causas, 5 porqués y lecciones aprendidas.</p>
              </div>
              <div class="s-card">
                <h4>🧪 Higienista / Ergonómo</h4>
                <p>Mediciones ambientales, riesgo biomecánico, químico (SGA) y psicosocial.</p>
              </div>
            </div>

            <div class="s-card glow-teal" style="margin-top:14px;">
              <h4>💡 Tip Clave de Uso con Tenshi:</h4>
              <p>Si quieres una respuesta rápida en voz, dile a Tenshi: <strong>"Respóndeme tú mismo"</strong>. Si quieres que redacte un documento extenso en el chat con tablas y artículos legales, dile: <strong>"Pásame al Abogado SST / Investigador ATEL"</strong> y él despachará el prompt técnico completo sin abrir chats innecesarios.</p>
            </div>
          </div>

          <!-- ==================== SLIDE 13: TRIGGERS, SCROLLS Y CRON EN ACCIÓN ==================== -->
          <div class="slide" id="slide-13">
            <div class="slide-header-row">
              <span class="slide-badge amber">⏰ Automatización Programada (Triggers & Cron)</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">TU OFICINA EN PILOTO AUTOMÁTICO</span>
            </div>
            <h2>Uniendo <span class="accent-lime">Triggers + Google Drive + Órdenes de Tenshi</span></h2>
            <p class="slide-lead">
              En la Clase 1 explicamos qué es un Trigger y un Cron. Hoy lo dejamos operando con el ciclo completo entre tu celular, tu Google Drive y tu computador:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🌅 1. Trigger de Horario Fijo (ej. Lunes 8:00 AM)</h4>
                <p>Programas tu agente para que cada mañana revise primero si dejaste <strong>Órdenes Delegadas desde Tenshi Voice</strong> y las ejecute antes de que te tomes el primer café.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🔄 2. Trigger de Vigilancia de Carpeta / Drive</h4>
                <p>Cada vez que subas fotos del celular a tu carpeta sincronizada de Google Drive u OneDrive, Antigravity las detecta, las pasa por el Skill de inspección y alimenta WAPPY.</p>
              </div>
              <div class="s-card">
                <h4>🛑 3. Control Inteligente de Recursos</h4>
                <p>Configuramos los intervalos de revisión (ej. al abrir el proyecto o una vez al día) en lugar de cada 2 minutos sin necesidad, protegiendo tu cuota de tokens.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 14: WORKFLOWS Y COMANDOS RÁPIDOS (/SLASH) ==================== -->
          <div class="slide" id="slide-14">
            <div class="slide-header-row">
              <span class="slide-badge lime">⚡ Atajos de 1 Segundo en el Chat</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">WORKFLOWS CONVERSACIONALES</span>
            </div>
            <h2>Tus 3 Comandos Rápidos (<span class="accent-lime">/slash</span>) para el Día a Día</h2>
            <p class="slide-lead">
              En lugar de escribir un párrafo largo cada mañana, le pediremos al chat de Antigravity que nos deje creados estos 3 botones/comandos rápidos:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4 style="font-family:var(--font-mono); color:var(--lime);">/ordenes-tenshi</h4>
                <p>Conecta por MCP a WAPPY, descarga todas las órdenes que dictaste por voz desde tu celular en campo, redacta los informes pendientes y las marca como completadas.</p>
              </div>
              <div class="s-card glow-teal">
                <h4 style="font-family:var(--font-mono); color:#2dd4bf;">/informe-simulacro</h4>
                <p>Toma las fotos y datos de la carpeta del cliente, aplica la plantilla oficial del Simulacro Nacional, genera el informe listo en Markdown/PDF y registra la evidencia en WAPPY.</p>
              </div>
              <div class="s-card">
                <h4 style="font-family:var(--font-mono); color:#fcd34d;">/auditoria-sin-editar</h4>
                <p>Revisa toda la carpeta de una empresa <strong>sin editar nada</strong>, convierte lecturas pesadas a <code>.md</code> y actualiza el Diagnóstico 0312 y la Matriz GTC 45 en WAPPY.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 15: TALLER EN VIVO Y RETO #2 ==================== -->
          <div class="slide" id="slide-15">
            <div class="slide-header-row">
              <span class="slide-badge amber">🏆 Laboratorio Práctico en Vivo · Clase 2</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">META DE LA SEMANA 2</span>
            </div>
            <h2>¡Manos a la Obra! Nuestro <span class="accent-lime">Reto Práctico de la Clase 2</span></h2>
            <p class="slide-lead">
              Baja a la sección de <strong>Prompts de la Clase 2</strong>, cópialos con un clic y pégalos en tu chat de Antigravity mientras hacemos el ejercicio en vivo:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>✅ Lo que dejarás funcionando hoy mismo:</h4>
                <p>
                  1. Tu <strong>Servidor MCP de WAPPY conectado</strong> en Antigravity (Prompt #1).<br>
                  2. Tus documentos normativos convertidos a <strong>Markdown (<code>.md</code>)</strong> ahorrando 80% de tokens (Prompt #2).<br>
                  3. Tu <strong>Skill de Informe de Simulacro e Inspecciones</strong> creado (Prompt #3).<br>
                  4. Una <strong>Orden Delegada dictada por voz a Tenshi desde tu celular</strong> y ejecutada automáticamente en tu computador (Prompts #4, #5 y #6).
                </p>
              </div>
              <div class="s-card glow-teal" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                <div style="font-size:40px; margin-bottom:8px;">📲</div>
                <h4>¿Listo para probar los Prompts de la Clase 2?</h4>
                <p style="margin-bottom:14px;">Baja a la sección de Prompts y usa el botón <strong>"Copiar Prompt para el Chat"</strong> en cada paso.</p>
                <a href="#prompts-chat" class="btn btn-lime">
                  Ir a los 6 Prompts de la Clase 2 ↓
                </a>
              </div>
            </div>
          </div>

        </div>

        <!-- Barra Inferior de Navegación del Deck -->
        <div class="deck-footer">
          <div class="deck-nav-group">
            <button class="btn-slide-ctrl" id="btn-prev" onclick="prevSlide()" disabled>← Anterior</button>
            <button class="btn-slide-ctrl primary-next" id="btn-next" onclick="nextSlide()">Siguiente Diapositiva →</button>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <a href="#prompts-chat" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              💬 Copiar Prompts Clase 2
            </a>
            <a href="/clase1" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              ⏮️ Repasar Clase 1
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       3B. SALA EN VIVO, GRABACIÓN CLASE 2 + BOTÓN POPUP DE TAREAS Y MEMORIAS
       ======================================================================== -->
  <section class="recording-section" id="grabacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">🎥 Sala en Vivo &amp; Grabación Oficial · Clase 2 (Martes 27 de Octubre)</span>
          <h2 class="sec-big-title">Reproductor Oficial Clase 2 &amp; Bitácora del Grupo</h2>
        </div>
        <div style="font-size: 13px; color: var(--ink-muted); font-weight: 600;">
          💡 Conéctate a la sesión en vivo o abre debajo el <strong>Popup de Compromisos y Notas Previas</strong>
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
            <span>WAPPY.CLUB // GRABACIÓN_OFICIAL // CLASE_02_TENSHI_&_MCP</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge">MARTES 27 OCT · 7:00 PM COL</span>
            <button type="button" class="btn-fullscreen" onclick="toggleVideoFullscreen()">
              ⛶ Pantalla Completa
            </button>
          </div>
        </div>

        <div class="deck-progress-track">
          <div class="deck-progress-fill" style="width: 100%;"></div>
        </div>

        <!-- Capítulos Rápidos de la Clase 2 -->
        <div class="recording-chapters-strip">
          <span class="rec-chapter-pill"><strong>Bloque 1</strong> Repaso Reto #1 y Ahorro 80% con Markdown (.md)</span>
          <span class="rec-chapter-pill"><strong>Bloque 2</strong> Conexión MCP WAPPY en Vivo (55+ Tools)</span>
          <span class="rec-chapter-pill"><strong>Bloque 3</strong> Creación de Skills (Informe Simulacro y Auditorías)</span>
          <span class="rec-chapter-pill"><strong>Bloque 4</strong> Tenshi Voice en el Celular y Órdenes Delegadas</span>
          <span class="rec-chapter-pill"><strong>Bloque 5</strong> Triggers, Cron y Comandos /Slash</span>
        </div>

        <!-- Reproductor Embebido 16:9 con Miniatura Oficial de la CLASE 2 -->
        <div class="video-viewport-wrap">
          <div class="video-aspect-box">
            <!-- Miniatura Oficial Personalizada CLASE 2 (Félix Avatar + WAPPY + Tenshi + CLASE 2) -->
            <div class="video-thumb-cover" id="video-thumb-cover" onclick="playRecordingVideo()">
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{felix_avatar}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Logos WAPPY + Antigravity + CLASE 2 + Botón Play -->
              <div class="thumb-center-col">
                <div class="thumb-logos-pill">
                  <img src="{wappy_horiz_logo}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{agy_logo}" alt="Google Antigravity" class="agy-i">
                </div>

                <div class="thumb-clase-giant">CLASE 2</div>

                <div class="thumb-sub-title">
                  <span>Tenshi en el Bolsillo</span>, Conexión MCP WAPPY &amp; <span>Skills en Vivo</span>
                </div>

                <div class="thumb-play-cta">
                  <span class="thumb-play-icon">▶</span>
                  <span>ENTRAR AL REPRODUCTOR / SALA</span>
                </div>
              </div>

              <!-- Columna Derecha: Avatar 3D de Tenshi / WAPPY con Aureola -->
              <div class="thumb-char-col">
                <svg class="thumb-halo-svg" viewBox="0 0 200 60">
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#fde047" stroke-width="10"/>
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#ffffff" stroke-width="3.5" opacity="0.9"/>
                </svg>
                <img src="{tenshi_img}" alt="Tenshi WAPPY IA">
                <span class="thumb-char-tag" style="border-color:#2dd4bf; color:#2dd4bf;">✨ Tenshi IA · WAPPY</span>
              </div>
            </div>

            <iframe
              id="drive-video-iframe"
              src="https://drive.google.com/file/d/1Q0QK8gpwm5orbdPmOgkW-IHZdJhFcIk-/preview"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowfullscreen
              loading="lazy"
              title="Grabación y Sala Oficial Clase 2 - WAPPY IA y Google Antigravity">
            </iframe>
          </div>
        </div>

        <!-- BARRA DEBAJO DEL VIDEO CON EL BOTÓN PARA ABRIR EL POPUP DE NOTAS Y TAREAS -->
        <div class="notes-trigger-bar">
          <div class="notes-trigger-info">
            <h3>📝 Bitácora de Conexión, Compromisos de la Clase 1 y Agenda de la Clase 2</h3>
            <p>Consulta los 13 compromisos previos del grupo, el repaso de la Clase 1 y la hoja de ruta técnica de la Clase 2.</p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <button type="button" class="btn-open-notes-modal" onclick="openNotesModal()">
              📋 Abrir Notas y Compromisos (Popup)
              <span class="badge-count">13 TAREAS + AGENDA C2</span>
            </button>
            <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn btn-glass" style="padding:11px 16px; font-size:12.5px;">
              📹 Sala Google Meet ↗
            </a>
            <a href="/clase1#grabacion" class="btn btn-glass" style="padding:11px 16px; font-size:12.5px;">
              ⏮️ Ver Grabación Clase 1
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       3C. MODAL POPUP INTERACTIVO CON LAS NOTAS Y AGENDA DE LA CLASE 2
       ======================================================================== -->
  <div class="notes-modal-backdrop" id="notes-modal" onclick="handleBackdropClick(event)">
    <div class="notes-modal-window" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">

      <div class="notes-modal-header">
        <div class="notes-modal-title-group">
          <div class="kicker">📅 Martes 27 de Octubre de 2026 · Clase II - Tenshi Voice, MCP WAPPY &amp; Skills</div>
          <h3 id="notes-modal-title">Bitácora de Preparación, Compromisos del Grupo y Agenda Clase 2</h3>
        </div>
        <button type="button" class="btn-close-modal" onclick="closeNotesModal()">
          ✕ Cerrar Ventana
        </button>
      </div>

      <div class="notes-attachments-strip">
        <span style="font-size:11.5px; font-weight:800; color:#94a3b8; text-transform:uppercase;">📎 Accesos Rápidos:</span>
        <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="note-attach-pill">
          📹 Sala Google Meet (7:00 PM) ↗
        </a>
        <a href="/clase1" class="note-attach-pill">
          ⏮️ Ir a Página de la Clase 1 ↗
        </a>
        <a href="https://docs.google.com/document/d/1YuutMA4ovF9h_dTwdle-NNU1mwK02r8CdDyPLbQPpA4/edit?usp=drive_web&tab=t.b19woqymvai3" target="_blank" rel="noopener noreferrer" class="note-attach-pill">
          📄 Transcripción Clase 1 (Google Docs) ↗
        </a>
        <a href="https://drive.google.com/file/d/1Q0QK8gpwm5orbdPmOgkW-IHZdJhFcIk-/view?usp=drive_web" target="_blank" rel="noopener noreferrer" class="note-attach-pill">
          🎥 Grabación Clase 1 (Google Drive) ↗
        </a>
      </div>

      <div class="notes-tabs-bar">
        <button type="button" class="notes-tab-btn active" onclick="switchNotesTab('all')" id="ntab-all">🌟 Ver Todo</button>
        <button type="button" class="notes-tab-btn" onclick="switchNotesTab('resumen')" id="ntab-resumen">📌 Objetivos Clase 2</button>
        <button type="button" class="notes-tab-btn" onclick="switchNotesTab('pasos')" id="ntab-pasos">✅ Revisión de los 13 Compromisos Previos</button>
        <button type="button" class="notes-tab-btn" onclick="switchNotesTab('detalles')" id="ntab-detalles">⏱️ Cronograma Práctico Clase 2</button>
      </div>

      <div class="notes-modal-body">

        <!-- SECCIÓN 1: OBJETIVOS DE LA CLASE 2 -->
        <div class="notes-pane active" data-npane="resumen">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            📌 1. Resumen Ejecutivo de lo que Lograremos en la Clase 2
          </div>
          <div class="notes-summary-grid">
            <div class="s-card glow-lime">
              <h4>🔌 Conexión MCP WAPPY en Vivo</h4>
              <p>Cada participante dejará conectada su instancia local de Google Antigravity con su cuenta oficial de WAPPY mediante el protocolo MCP, habilitando las más de 55 herramientas del SG-SST.</p>
            </div>
            <div class="s-card glow-teal">
              <h4>📱 Tenshi Voice desde el Celular en Campo</h4>
              <p>Práctica en vivo entrando a <code>wappy.club</code> desde el celular para dictar actos y condiciones inseguras con la voz mientras se camina por planta u obra, sin digitar en teclado.</p>
            </div>
            <div class="s-card">
              <h4>📲 Órdenes Delegadas (Celular → PC)</h4>
              <p>Cómo pedirle por voz a Tenshi que delegue una tarea compleja y cómo Antigravity la consulta en el computador con <code>wappy_consultar_ordenes_delegadas_tenshi</code> y la completa automáticamente.</p>
            </div>
            <div class="s-card">
              <h4>⚙️ Skills Reales: Simulacro y Auditorías (.MD)</h4>
              <p>Creación sin código del archivo <code>SKILL.md</code> basado en el informe ejemplo del Simulacro Nacional y conversión de documentos pesados a Markdown (<code>.md</code>) para ahorrar hasta un 80% de tokens.</p>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: REVISIÓN DE LOS 13 COMPROMISOS QUE TRAEMOS DE LA CLASE 1 -->
        <div class="notes-pane active" data-npane="pasos">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ✅ 2. Checklist de los 13 Compromisos Acordados en la Clase 1 para Hoy
          </div>

          <div class="n-task-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>Activar cámaras al inicio:</strong> Encender las cámaras en los primeros minutos de la Clase 2 para fortalecer la comunidad y resolver dudas en vivo.</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>Tener Antigravity instalado:</strong> Haber descargado e instalado la aplicación desde <code>antigravity.google</code> con sesión iniciada.</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>Proyectos Específicos por Actividad:</strong> Tener creadas carpetas puntuales por actividad o auditoría en lugar de un proyecto general gigante para proteger los tokens.</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">María Elena Obando</span>
            <div><strong>Estructura de Subcarpetas Multi-Empresa:</strong> Validar en clase la carpeta principal de auditoría con subcarpetas organizadas por cliente.</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">Jenny Ríos</span>
            <div><strong>Informe Ejemplo de Muestra:</strong> Utilizar un informe base para transformarlo hoy en un <code>SKILL.md</code> que automatice los informes posteriores de las ~20 empresas.</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">Mauricio Posada</span>
            <div><strong>Aplicativo de Informe de Simulacro:</strong> Integrar la estructura compartida en la comunidad WAPPY dentro del flujo automatizado de hoy.</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>Práctica con «Sin Editar Nada»:</strong> Haber probado consultas exploratorias en sus carpetas locales aplicando el comando de seguridad <em>"sin editar nada"</em>.</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>Explorar las 60+ Herramientas de WAPPY:</strong> Tener claro qué módulo de WAPPY (GTC 45, PESV, 0312, Químicos, Cronograma) desean alimentar primero en su proyecto.</div>
          </div>
        </div>

        <!-- SECCIÓN 3: CRONOGRAMA MINUTO A MINUTO DE LA CLASE 2 -->
        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ⏱️ 3. Hoja de Ruta Minuto a Minuto de la Clase 2 (7:00 PM – 9:00 PM)
          </div>

          <div class="n-detail-card">
            <h4>
              <span>Bloque 1 (7:00 – 7:30 PM): Revisión de Proyectos, Markdown (.MD) y Conexión MCP con WAPPY</span>
              <span><span class="ts-link">30 MIN</span></span>
            </h4>
            <p>Revisión rápida de las carpetas creadas por los alumnos. Demostración de cómo convertir decretos y PDFs a formato Markdown (<code>.md</code>) sin alterar los originales para ahorrar el 80% de tokens, y conexión paso a paso del servidor MCP de WAPPY usando el <strong>Prompt #1</strong>.</p>
          </div>

          <div class="n-detail-card">
            <h4>
              <span>Bloque 2 (7:30 – 8:00 PM): Creación de Skills (SKILL.md) y Caso Real del Simulacro Nacional</span>
              <span><span class="ts-link">30 MIN</span></span>
            </h4>
            <p>Cómo tomar un informe de muestra (como el Informe del Simulacro Nacional o un acta de inspección) y pedirle al chat de Antigravity con el <strong>Prompt #3</strong> que cree una habilidad permanente en <code>.agents/skills/</code> para generar informes de múltiples empresas en minutos y subir los hallazgos a la Matriz GTC 45 de WAPPY.</p>
          </div>

          <div class="n-detail-card">
            <h4>
              <span>Bloque 3 (8:00 – 8:35 PM): Tenshi en el Bolsillo (Voz desde el Celular) y Órdenes Delegadas</span>
              <span><span class="ts-link">35 MIN</span></span>
            </h4>
            <p>Todos los participantes entran desde su celular a <code>wappy.club</code> y abren <strong>Tenshi Voice</strong>. Ejercicio en vivo dictando hallazgos de seguridad por voz y delegando órdenes para que Antigravity las consulte desde el computador mediante <code>wappy_consultar_ordenes_delegadas_tenshi</code> (<strong>Prompt #5</strong>).</p>
          </div>

          <div class="n-detail-card">
            <h4>
              <span>Bloque 4 (8:35 – 9:00 PM): Triggers, Cron, Atajos /Slash y Reto para la Clase 3</span>
              <span><span class="ts-link">25 MIN</span></span>
            </h4>
            <p>Configuración del comando rápido <code>/sincronizar-campo</code> y del Trigger matutino (<strong>Prompt #6</strong>) que une Google Drive + Órdenes de Tenshi + WAPPY. Ronda de debugging colaborativo en pantalla compartida.</p>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ========================================================================
       4. SECCIÓN ESTRELLA CLASE 2: LOS 6 PROMPTS CONVERSACIONALES (SIN CÓDIGO)
       ======================================================================== -->
  <section class="prompts-section" id="prompts-chat">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">💬 Laboratorio Práctico Clase 2 · Copiar y Pegar en Español</span>
          <h2 class="sec-big-title">6 Prompts Listos para la Clase 2 (MCP, Markdown, Skills y Tenshi Voice)</h2>
        </div>
      </div>

      <!-- Banner Explicativo Cero Código -->
      <div class="zero-code-banner">
        <div>
          <h3>✨ En la Clase 2 tampoco programamos: Tu Voz y el Chat hacen el Trabajo</h3>
          <p>
            Hoy unimos tu <strong>celular en campo (Tenshi Voice)</strong> con tu <strong>computador en la oficina (Antigravity)</strong> y tu <strong>nube SST (WAPPY)</strong>. Copia estos 6 prompts en orden y pégalos en tu chat de Antigravity para que él configure la conexión MCP, convierta tus archivos a Markdown, cree tu Skill de informes y procese las órdenes de voz de Tenshi:
          </p>
        </div>
        <div class="zero-code-compare">
          <div style="color:#fca5a5; font-weight:800; margin-bottom:6px;">❌ Sin el Ecosistema WAPPY:</div>
          <div style="color:#cbd5e1; margin-bottom:10px; font-size:12px;">Tomar notas en papel en la obra y llegar a digitar 3 horas en Word y Excel por cada empresa.</div>
          <div style="color:var(--lime); font-weight:800; margin-bottom:6px;">✅ En la Clase 2 con Tenshi + Antigravity:</div>
          <div style="color:#ffffff; font-size:12px;">Dictas el hallazgo por voz desde el celular y <strong>Antigravity + WAPPY generan el informe y actualizan la matriz solos</strong>.</div>
        </div>
      </div>

      <!-- Grid de los 6 Prompts Conversacionales de la Clase 2 -->
      <div class="prompt-cards-grid">

        <!-- PROMPT 1: CONECTAR MCP WAPPY Y VERIFICAR EMPRESA ACTIVA -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 1 · Conexión MCP WAPPY en Vivo</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Activa las 55+ Tools SST</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">1. Conectar el Servidor MCP de WAPPY y Consultar el Diagnóstico 360° sin Editar Nada</h3>
            <p class="p-card-explain">
              Pega este prompt con tus datos MCP de WAPPY para que Antigravity configure el puente y haga una primera consulta segura usando la regla <em>"sin editar nada"</em>.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-1">Hola Antigravity. Estamos en la Clase 2 de WAPPY IA y necesito dejar conectada mi cuenta oficial de WAPPY vía MCP (Model Context Protocol).

Por favor realiza estos pasos sin editar nada de mis documentos locales:
1. Configura la conexión al servidor MCP de WAPPY usando mis credenciales: [PEGA AQUÍ TU URL / API KEY MCP DE WAPPY].
2. Consulta mis empresas disponibles con la herramienta "wappy_consultar_empresas" y asegúrate de activar mi empresa principal con "wappy_activar_empresa".
3. Ejecuta "wappy_resumen_general_360" y "wappy_consultar_matriz_gtc45" y muéstrame en español sencillo un resumen del estado actual de mi empresa en WAPPY.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Conecta el MCP y verifica tu empresa activa en vivo.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-1', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 2: CONVERTIR PDFS/WORD A MARKDOWN (.MD) PARA AHORRAR 80% DE TOKENS -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 2 · Ahorro del 80% de Tokens</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Conversión limpia a Markdown (.md)</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">2. Convertir Manuales, Actas y Normas Pesadas a Markdown (.md) sin Alterar los Originales</h3>
            <p class="p-card-explain">
              Aplica el truco maestro visto en clase: convierte tus documentos pesados una sola vez a formato <code>.md</code> para que todas tus futuras consultas consuman hasta un 80% menos de tokens.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-2">Quiero optimizar al máximo mi consumo de tokens siguiendo la regla del curso de WAPPY.

Sin editar ni borrar ninguno de mis archivos originales en PDF, Word o Excel:
1. Crea dentro de mi proyecto una carpeta llamada "base_markdown_optimizada".
2. Lee los documentos normativos, manuales o informes base que tengo en mi carpeta y conviértelos a archivos limpios en formato Markdown (.md) bien estructurados con títulos, tablas y listas dentro de "base_markdown_optimizada".
3. Actualiza mi archivo AGENTS.md para que de ahora en adelante, cada vez que necesites consultar esa información, leas siempre las versiones ligeras en Markdown (.md) ahorrando el 80% de tokens.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Crea tu biblioteca ligera en .md y protege tus tokens.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-2', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 3: CREAR EL SKILL DE INFORME DE SIMULACRO Y AUDITORÍAS MULTI-EMPRESA -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 3 · Skill de Informes y Simulacro</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Basado en tu Informe Ejemplo</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">3. Crear el Skill para Automatizar Informes de Simulacro e Inspecciones de Múltiples Empresas</h3>
            <p class="p-card-explain">
              Ideal para el caso de Jenny, María Elena y Carolina: el agente toma tu informe de muestra y crea un <code>SKILL.md</code> reutilizable para sacar los informes de 1 o 20 empresas en minutos.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-3">Necesito que crees por mí un Skill (habilidad reutilizable) llamado "generador-informes-simulacro-e-inspecciones" dentro de la carpeta ".agents/skills/".

Toma como referencia el informe de muestra que puse en mi carpeta y configura el archivo SKILL.md para que cada vez que yo te pida generar el informe de una empresa:
1. Leas únicamente la subcarpeta correspondiente a esa empresa (fotos de evidencia, tiempos de evacuación, lista de participantes y hallazgos).
2. Redactes automáticamente el informe técnico completo en Markdown y HTML/PDF conservando exactamente el estilo profesional de mi plantilla, con análisis normativo (Decreto 1072 / Res. 0312).
3. Te conectes por MCP a WAPPY, actives esa empresa y registres los compromisos y oportunidades de mejora directamente en el Cronograma SST y en Actos/Condiciones Inseguras.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Crea tu fábrica automática de informes por empresa.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-3', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 4: ALIMENTAR MATRIZ GTC 45, TRABAJADORES Y CRONOGRAMA EN WAPPY -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 4 · Alimentar WAPPY desde Carpetas</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">GTC 45 + PESV + Cronograma</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">4. Subir Hallazgos Fotográficos y Archivos Locales a la Matriz GTC 45 de WAPPY</h3>
            <p class="p-card-explain">
              Haz que Antigravity analice las fotos de campo o tablas de tu carpeta local y alimente automáticamente los módulos de tu empresa en WAPPY sin digitar nada a mano.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-4">Por favor analiza los archivos y fotografías de hallazgos que acabo de guardar en mi carpeta de inspecciones (sin editar los archivos originales) y alimenta mi empresa en WAPPY vía MCP:

1. Para cada hallazgo detectado, clasifica el peligro y evalúa el riesgo según la metodología GTC 45 colombiana.
2. Usa la herramienta "wappy_alimentar_matriz_gtc45" para agregar cada peligro con sus controles recomendados (Fuente, Medio e Individuo).
3. Usa "wappy_registrar_reporte_acto_condicion" para dejar trazabilidad del hallazgo y "wappy_crear_actividad_cronograma" para agendar la acción correctiva en mi Plan Anual de Trabajo.
4. Entrégame una tabla resumen con los IDs o registros creados en WAPPY.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Alimenta GTC 45, Reportes y Cronograma en WAPPY.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-4', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 5: PROCESAR ÓRDENES DELEGADAS DE TENSHI VOICE (CELULAR -> PC) -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 5 · Tenshi en el Bolsillo (Celular → PC)</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Ejecuta Órdenes de Voz de Tenshi</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">5. Consultar y Ejecutar las Órdenes Delegadas que le Dictaste por Voz a Tenshi en el Celular</h3>
            <p class="p-card-explain">
              Después de hablar con Tenshi desde tu celular en campo y pedirle que delegue una tarea, pegas este prompt en tu PC para que Antigravity descargue la orden, haga el trabajo y la cierre.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-5">Acabo de regresar de mi recorrido de campo donde le dicté instrucciones por voz a Tenshi desde mi celular.

Por favor ejecuta este flujo completo vía MCP con WAPPY:
1. Llama a la herramienta "wappy_consultar_ordenes_delegadas_tenshi" (con estado "pendiente") para ver todas las órdenes de voz que te dejé desde mi celular.
2. Por cada orden encontrada, analiza lo solicitado, cruza la información con mis carpetas locales (fotos, actas o listas) y genera los informes o actualizaciones correspondientes en mi carpeta "informes_generados" y en los módulos de WAPPY.
3. Cuando termines cada tarea, llama a "wappy_completar_orden_delegada_tenshi" enviando el resumen detallado del resultado para que en mi celular aparezca como completada.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Une la voz de tu celular con el poder de tu PC.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-5', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 6: CREAR WORKFLOW /SINCRONIZAR-CAMPO Y TRIGGER AUTOMÁTICO -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 6 · Trigger &amp; Atajo /sincronizar-campo</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Drive + Tenshi Voice + WAPPY</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">6. Crear el Comando Rápido <code>/sincronizar-campo</code> y Trigger Matutino</h3>
            <p class="p-card-explain">
              Deja configurado un atajo de una sola palabra y un Trigger programado para que tu proyecto revise todos los días Google Drive y las órdenes de Tenshi sin que tengas que volver a redactar estas instrucciones.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-6">Quiero dejar automatizado todo lo que aprendimos en la Clase 2 mediante un Workflow llamado "/sincronizar-campo" y un Trigger matutino (8:00 AM de lunes a viernes):

Configúralo para que cada vez que yo escriba "/sincronizar-campo" o se active el Trigger de la mañana, ejecutes en orden:
1. Consulta en WAPPY vía MCP si tengo "órdenes delegadas de Tenshi" pendientes dictadas desde mi celular.
2. Revisa mi carpeta sincronizada de Google Drive / OneDrive buscando fotos de inspecciones o documentos nuevos del día.
3. Convierte cualquier documento pesado nuevo a Markdown (.md) sin editar el original para ahorrar tokens.
4. Ejecuta mis Skills para generar los informes técnicos, alimenta las matrices y el cronograma en WAPPY, y cierra las órdenes delegadas mostrándome el reporte ejecutivo final en pantalla.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Crea el comando /sincronizar-campo y tu rutina automática.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-6', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ========================================================================
       5. GUÍA PASO A PASO DETALLADA DE LA CLASE 2 (4 BLOQUES PEDAGÓGICOS)
       ======================================================================== -->
  <section class="guide-section" id="guia-paso-a-paso">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">📘 Resumen Pedagógico Completo · Semana 2</span>
          <h2 class="sec-big-title">Guía de Estudio Paso a Paso · Clase 2</h2>
        </div>
      </div>

      <div class="guide-blocks-grid">

        <!-- BLOQUE 1 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 1 · Optimización de Tokens y Seguridad</span>
            <span class="g-time">⏱️ Duración: 30 Minutos</span>
          </div>
          <h3>Regla «Sin Editar Nada», Subcarpetas por Cliente y Conversión a Markdown (.md)</h3>
          <p style="font-size:14px; color:var(--ink-soft);">
            Consolidamos las mejores prácticas descubiertas en la primera sesión para trabajar como expertos sin agotar nuestra cuota de IA:
          </p>
          <ul class="g-list">
            <li>
              <strong>1. Comando de Seguridad «Sin Editar Nada»:</strong>
              Siempre que quieras hacer una auditoría exploratoria, un resumen o una consulta sobre tus carpetas sin que el agente modifique tus archivos originales, inicia tu mensaje con <em>"Sin editar nada..."</em>.
            </li>
            <li>
              <strong>2. Conversión de PDFs a Markdown (.md) (80% Ahorro):</strong>
              Los archivos PDF extensos y las imágenes crudas en <code>base64</code> consumen miles de tokens. Al pedirle al chat (con el <em>Prompt #2</em>) que cree una copia ligera en formato <code>.md</code>, multiplicas por 5 el rendimiento de tu cuenta.
            </li>
            <li>
              <strong>3. Un Proyecto por Actividad o Subcarpetas por Empresa:</strong>
              Si eres consultor SST de varias empresas, organiza una subcarpeta por cliente y pídele a Antigravity que lea únicamente la subcarpeta de la empresa que estás auditando en ese momento.
            </li>
            <li>
              <strong>4. Sincronización con Google Drive, OneDrive o Dropbox:</strong>
              Antigravity lee al instante cualquier carpeta de nube que tengas sincronizada en el explorador de archivos de tu Windows o Mac.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 2 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 2 · Conexión MCP WAPPY en Vivo</span>
            <span class="g-time">⏱️ Duración: 30 Minutos</span>
          </div>
          <h3>Enchufar Antigravity con las 55+ Herramientas de WAPPY y Crear tu Primer Skill</h3>
          <ul class="g-list">
            <li>
              <strong>Conexión del Servidor MCP de WAPPY:</strong>
              Copiamos la credencial MCP de nuestra cuenta en <code>wappy.club</code> y usamos el <em>Prompt #1</em> para que el chat active el acceso directo a todos los módulos del SG-SST.
            </li>
            <li>
              <strong>Cambio de Empresa Activa desde el Chat:</strong>
              Con las herramientas <code>wappy_consultar_empresas</code> y <code>wappy_activar_empresa</code>, puedes indicarle a Antigravity para cuál de tus clientes deseas subir la información.
            </li>
            <li>
              <strong>Creación del Skill de Simulacro e Inspecciones:</strong>
              Colocamos un informe de muestra bien estructurado en nuestra carpeta y usamos el <em>Prompt #3</em> para que el chat construya su archivo <code>SKILL.md</code> reutilizable.
            </li>
            <li>
              <strong>Alimentación Automática de GTC 45 y Cronograma:</strong>
              A partir de las fotos de recorrido y evidencias locales, Antigravity alimenta la Matriz de Peligros GTC 45, registra los actos/condiciones inseguras y programa las tareas en el Cronograma de WAPPY.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 3 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 3 · Tenshi en el Bolsillo (Voz desde el Celular)</span>
            <span class="g-time">⏱️ Duración: 35 Minutos</span>
          </div>
          <h3>Instrucciones por Voz en Campo y Órdenes Delegadas del Celular al Computador</h3>
          <ul class="g-list">
            <li>
              <strong>Hablar con Tenshi Voice en Campo:</strong>
              Abres <code>wappy.club</code> en tu celular durante una inspección de planta u obra y conversas manos libres con Tenshi para consultar datos de la empresa o reportar hallazgos en tiempo real.
            </li>
            <li>
              <strong>Registro Instantáneo por Voz:</strong>
              Mientras caminas, le dictas a Tenshi un acto o condición subestándar y él lo guarda de inmediato en la nube de WAPPY sin que tengas que escribir en pantalla.
            </li>
            <li>
              <strong>Buzón de Órdenes Delegadas (`Tenshi → Antigravity`):</strong>
              Si estás en la calle y necesitas que tu computador prepare un informe pesado con los archivos de tu disco duro, le dices a Tenshi: <em>"Delégale esta orden a Antigravity"</em>.
            </li>
            <li>
              <strong>Ejecución y Cierre desde el PC (Prompt #5):</strong>
              Al llegar a tu escritorio, Antigravity consulta <code>wappy_consultar_ordenes_delegadas_tenshi</code>, elabora el informe con tus carpetas locales y marca la orden como completada con <code>wappy_completar_orden_delegada_tenshi</code>.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 4 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 4 · Despacho Multiturno, Triggers y Workflows</span>
            <span class="g-time">⏱️ Duración: 25 Minutos</span>
          </div>
          <h3>Los 7 Especialistas de WAPPY y el Comando Rápido <code>/sincronizar-campo</code></h3>
          <ul class="g-list">
            <li>
              <strong>Consulta Directa vs. Delegación a los 7 Especialistas:</strong>
              Aprende cuándo pedirle a Tenshi que te responda él mismo al instante y cuándo pedirle que estructure un prompt técnico normativo para el Abogado SST, Médico Laboral o Investigador ATEL.
            </li>
            <li>
              <strong>Continuidad de Conversación:</strong>
              Cómo seguir profundizando sobre un mismo caso ocupacional o investigación de accidente en el mismo hilo sin perder el contexto.
            </li>
            <li>
              <strong>Creación del Workflow <code>/sincronizar-campo</code>:</strong>
              Con el <em>Prompt #6</em> dejamos creado un atajo de una sola palabra que revisa órdenes de voz de Tenshi, lee novedades de Google Drive y actualiza WAPPY.
            </li>
            <li>
              <strong>Preparación para la Clase 3 (NotebookLM Profundo):</strong>
              Dejamos listo nuestro entorno para que en la Clase 3 conectemos los cuadernos normativos sin alucinación y generemos podcasts de capacitación a dos voces.
            </li>
          </ul>
        </div>

      </div>

      <!-- CTA Final de Acceso a Sala Meet y Navegación entre Clases -->
      <div class="final-cta-card">
        <div style="max-width: 640px;">
          <span style="color:var(--lime); font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
            🎓 Todo Listo para Nuestra Clase 2 · Martes 27 de Octubre
          </span>
          <h3 style="font-family:var(--font-display); font-size:clamp(20px, 2.6vw, 30px); font-weight:900; margin:6px 0 8px;">
            Ten Abierto Antigravity en tu PC y WAPPY en tu Celular a las 6:50 PM
          </h3>
          <p style="font-size:14px; color:#cbd5e1;">
            Hoy haremos la prueba en vivo hablando con Tenshi desde el celular y viendo cómo Antigravity recibe la orden en el computador y alimenta tu empresa en WAPPY.
          </p>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <a href="/clase1" class="btn btn-glass">
            ⏮️ Ver Página de la Clase 1
          </a>
          <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn btn-lime">
            📹 Entrar a Google Meet (7:00 PM)
            <span class="arrow-pip">↗</span>
          </a>
        </div>
      </div>

      <footer>
        <p><strong>WAPPY IA · SOMOS SST</strong> · Especialización Práctica en Agentes Autónomos para Seguridad y Salud en el Trabajo</p>
        <p style="margin-top:4px;">wappy.club/clase2 · Docente Líder: Ing. Félix Bedoya · Grupo Exclusivo de Participantes</p>
      </footer>
    </div>
  </section>

  <!-- ========================================================================
       SCRIPTS INTERACTIVOS (SLIDES, CANVAS NEURONAL, SIMULADOR DE TOKENS, COPIADO)
       ======================================================================== -->
  <script>
    // 1. Controlador de las 15 Diapositivas
    let currentSlide = 1;
    const totalSlides = 15;

    function showSlide(index) {{
      if (index < 1 || index > totalSlides) return;
      document.querySelectorAll('.slide').forEach(el => el.classList.remove('active'));
      const target = document.getElementById('slide-' + index);
      if (target) {{
        target.classList.add('active');
        currentSlide = index;
        const padNum = String(currentSlide).padStart(2, '0');
        document.getElementById('deck-counter').innerText = 'SLIDE ' + padNum + ' / ' + totalSlides;
        document.getElementById('slide-progress').style.width = ((currentSlide / totalSlides) * 100) + '%';

        document.getElementById('btn-prev').disabled = (currentSlide === 1);
        document.getElementById('btn-next').disabled = (currentSlide === totalSlides);

        // Actualizar pills superiores sin mover el scroll vertical de la página
        const strip = document.getElementById('slide-pills-strip');
        const pills = document.querySelectorAll('.slide-num-pill');
        pills.forEach((p, idx) => {{
          if (idx + 1 === currentSlide) {{
            p.classList.add('active');
            if (strip) {{
              const targetLeft = p.offsetLeft - (strip.clientWidth / 2) + (p.clientWidth / 2);
              strip.scrollTo({{ left: Math.max(0, targetLeft), behavior: 'smooth' }});
            }}
          }} else {{
            p.classList.remove('active');
          }}
        }});
      }}
    }}

    function nextSlide() {{
      if (currentSlide < totalSlides) showSlide(currentSlide + 1);
    }}

    function prevSlide() {{
      if (currentSlide > 1) showSlide(currentSlide - 1);
    }}

    // Navegación con Teclado (Flechas Izquierda/Derecha)
    document.addEventListener('keydown', (e) => {{
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {{
        e.preventDefault();
        nextSlide();
      }} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {{
        e.preventDefault();
        prevSlide();
      }}
    }});

    // Gestos Swipe en Celular
    let touchStartX = 0;
    let touchEndX = 0;
    const viewport = document.getElementById('slide-viewport');

    viewport.addEventListener('touchstart', (e) => {{
      touchStartX = e.changedTouches[0].screenX;
    }}, {{ passive: true }});

    viewport.addEventListener('touchend', (e) => {{
      touchEndX = e.changedTouches[0].screenX;
      const dist = touchEndX - touchStartX;
      if (Math.abs(dist) > 50) {{
        if (dist < 0) nextSlide();
        else prevSlide();
      }}
    }}, {{ passive: true }});

    // Modo Pantalla Completa para Proyectar en Google Meet
    function toggleDeckFullscreen() {{
      const stage = document.getElementById('deck-stage');
      if (!document.fullscreenElement) {{
        if (stage.requestFullscreen) stage.requestFullscreen();
      }} else {{
        if (document.exitFullscreen) document.exitFullscreen();
      }}
    }}

    // Pantalla completa del Reproductor de Video
    function toggleVideoFullscreen() {{
      const vStage = document.getElementById('video-stage');
      if (!document.fullscreenElement) {{
        if (vStage && vStage.requestFullscreen) vStage.requestFullscreen();
      }} else {{
        if (document.exitFullscreen) document.exitFullscreen();
      }}
    }}

    // Ocultar la Miniatura Personalizada y dar paso al Reproductor de Video
    function playRecordingVideo() {{
      const cover = document.getElementById('video-thumb-cover');
      if (cover) {{
        cover.classList.add('hidden');
      }}
    }}

    // Controlador del Popup / Modal de Notas de la Clase 1
    function openNotesModal() {{
      const modal = document.getElementById('notes-modal');
      if (modal) {{
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }}
    }}

    function closeNotesModal() {{
      const modal = document.getElementById('notes-modal');
      if (modal) {{
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }}
    }}

    function handleBackdropClick(e) {{
      if (e.target && e.target.id === 'notes-modal') {{
        closeNotesModal();
      }}
    }}

    function switchNotesTab(tabName) {{
      document.querySelectorAll('.notes-tab-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('ntab-' + tabName);
      if (activeBtn) activeBtn.classList.add('active');

      const panes = document.querySelectorAll('.notes-pane');
      panes.forEach(p => {{
        if (tabName === 'all' || p.getAttribute('data-npane') === tabName) {{
          p.classList.add('active');
        }} else {{
          p.classList.remove('active');
        }}
      }});
    }}

    document.addEventListener('keydown', (e) => {{
      if (e.key === 'Escape') {{
        closeNotesModal();
      }}
    }});

    // 2. Simulador Interactivo de Tokens en Vivo (Slide 4)
    const tokenColors = [
      {{ bg: 'rgba(199, 243, 3, 0.22)', border: '#c7f303', text: '#ecfccb' }},
      {{ bg: 'rgba(45, 212, 191, 0.22)', border: '#2dd4bf', text: '#ccfbf1' }},
      {{ bg: 'rgba(245, 158, 11, 0.22)', border: '#fbbf24', text: '#fef3c7' }},
      {{ bg: 'rgba(139, 92, 246, 0.25)', border: '#a78bfa', text: '#ede9fe' }},
      {{ bg: 'rgba(59, 130, 246, 0.25)', border: '#60a5fa', text: '#dbeafe' }}
    ];

    function splitIntoSimulatedTokens(text) {{
      const words = text.trim().split(/\\s+/).filter(Boolean);
      const tokens = [];
      words.forEach(w => {{
        if (w.length <= 5) {{
          tokens.push(w);
        }} else if (w.length <= 9) {{
          const mid = Math.ceil(w.length / 2);
          tokens.push(w.slice(0, mid));
          tokens.push(w.slice(mid));
        }} else {{
          tokens.push(w.slice(0, 4));
          tokens.push(w.slice(4, 8));
          tokens.push(w.slice(8));
        }}
      }});
      return {{ wordsCount: words.length, tokens }};
    }}

    function updateTokenSimulator() {{
      const input = document.getElementById('token-live-input');
      const output = document.getElementById('token-pills-output');
      const badge = document.getElementById('token-stats-badge');
      if (!input || !output) return;

      const {{ wordsCount, tokens }} = splitIntoSimulatedTokens(input.value || '');
      badge.innerText = `Palabras: ${{wordsCount}} | Tokens generados: ${{tokens.length}}`;
      output.innerHTML = '';

      tokens.forEach((tok, idx) => {{
        const c = tokenColors[idx % tokenColors.length];
        const span = document.createElement('span');
        span.className = 'tok-chip';
        span.style.background = c.bg;
        span.style.border = `1px solid ${{c.border}}`;
        span.style.color = c.text;
        span.innerText = tok;
        output.appendChild(span);
      }});
    }}

    // 3. Copiar Prompts Conversacionales al Portapapeles
    function copyPromptText(id, btn) {{
      const el = document.getElementById(id);
      if (!el) return;
      navigator.clipboard.writeText(el.innerText).then(() => {{
        const orig = btn.innerHTML;
        btn.innerHTML = '✅ ¡Prompt Copiado! Pégalo en Antigravity';
        btn.style.background = '#0d9488';
        btn.style.color = '#ffffff';
        setTimeout(() => {{
          btn.innerHTML = orig;
          btn.style.background = '';
          btn.style.color = '';
        }}, 2400);
      }});
    }}

    // 4. Animación de Red Neuronal en el Canvas del Escenario
    function initDeckCanvas() {{
      const canvas = document.getElementById('deck-canvas');
      const stage = document.getElementById('deck-stage');
      if (!canvas || !stage) return;
      const ctx = canvas.getContext('2d');
      let width = canvas.width = stage.clientWidth || 360;
      let height = canvas.height = stage.clientHeight || 520;

      const nodes = Array.from({{ length: 28 }}, () => ({{
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.65,
        vy: (Math.random() - 0.5) * 0.65,
        r: Math.random() * 2.2 + 1.2
      }}));

      window.addEventListener('resize', () => {{
        width = canvas.width = canvas.offsetWidth || 1000;
        height = canvas.height = canvas.offsetHeight || 600;
      }});

      function draw() {{
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < nodes.length; i++) {{
          const n = nodes[i];
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;

          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#c7f303' : '#2dd4bf';
          ctx.fill();

          for (let j = i + 1; j < nodes.length; j++) {{
            const m = nodes[j];
            const dx = n.x - m.x;
            const dy = n.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 135) {{
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(m.x, m.y);
              ctx.strokeStyle = `rgba(199, 243, 3, ${{(1 - dist / 135) * 0.18}})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }}
          }}
        }}
        requestAnimationFrame(draw);
      }}
      draw();
    }}

    document.addEventListener('DOMContentLoaded', () => {{
      showSlide(1);
      updateTokenSimulator();
      initDeckCanvas();
    }});
  </script>
</body>
</html>
'''

# Write to client/public/clase1.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase2.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {pub_path} ({len(html_content)} bytes)")

# Write to Desktop
desktop_path = '/Users/venta/Desktop/clase2.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {desktop_path} ({len(html_content)} bytes)")
