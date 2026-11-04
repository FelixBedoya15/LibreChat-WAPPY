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
  <title>WAPPY IA · Clase 3: El Cerebro Normativo (Google NotebookLM, Podcasts SST a 2 Voces y Cero Alucinación) | SOMOS SST</title>
  <meta name="description" content="Clase 3 Oficial WAPPY IA + Google Antigravity + NotebookLM: El Cerebro Normativo SST con Cero Alucinación, citas exactas de ley, Podcasts conversacionales a 2 voces, WappyPodcast, guiones de video, quizzes y conexión MCP.">
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
          <div class="sub">SOMOS SST · CLASE 3</div>
        </div>
      </a>

      <div class="nav-links">
        <a href="#inicio" class="active-pill">🚀 Clase 3</a>
        <a href="#presentacion">🎬 Presentación</a>
        <a href="#grabacion">🎥 Grabación & Notas</a>
        <a href="#prompts-chat">💬 Prompts Clase 3</a>
        <a href="#guia-paso-a-paso">📘 Guía Paso a Paso</a>
      </div>

      <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener noreferrer" class="btn btn-dark" style="flex-shrink: 0;">
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
          <span>CLASE 03 EN VIVO · SEMANA 3 (MARTES) · 7:00 PM – 9:00 PM COL</span>
        </div>

        <h1>
          <span class="highlight-lime">El Cerebro Normativo</span>: NotebookLM, Podcasts SST y Cero Alucinación.
        </h1>

        <p class="hero-sub">
          Domina <strong>Google NotebookLM</strong> como tu biblioteca jurídica y técnica blindada con <strong>0% de alucinación</strong> (citas exactas con artículo, parágrafo y página), conéctalo con <strong>Google Antigravity y WAPPY</strong> ahorrando hasta el <strong>85% de tokens</strong>, y transforma procedimientos densos en <strong>Podcasts a Dos Voces, WappyPodcast, Videos y Quizzes</strong>.
        </p>

        <div class="hero-ctas">
          <a href="#presentacion" class="btn btn-lime">
            🎬 Presentación Clase 3 (15 Slides)
            <span class="arrow-pip">↓</span>
          </a>
          <a href="#prompts-chat" class="btn btn-dark">
            💬 6 Prompts Clase 3 (Sin Código)
            <span class="arrow-pip">⚡</span>
          </a>
          <button type="button" onclick="openNotesModal()" class="btn btn-glass">
            ⏳ Video y Notas (Muy Pronto)
          </button>
        </div>

        <div class="hero-pills-bar">
          <div class="hero-pill-item">
            <div class="hero-pill-label">📚 Bloque 1 (30 Min)</div>
            <div class="hero-pill-val">Cuadernos SST Cero Alucinación</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔌 Bloque 2 (30 Min)</div>
            <div class="hero-pill-val">Puente NotebookLM ↔ Antigravity</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🎙️ Bloque 3 (35 Min)</div>
            <div class="hero-pill-val">Podcasts a 2 Voces y WappyPodcast</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🎬 Bloque 4 (25 Min)</div>
            <div class="hero-pill-val">Guiones de Video, Infografías y Quizzes</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta Interactiva de Tenshi en el Hero -->
      <div class="hero-tenshi-card">
        <div class="hero-tenshi-glow"></div>
        <img src="{tenshi_img}" alt="Tenshi IA" class="tenshi-avatar-floating">
        <div class="tenshi-bubble">
          «¡Hola! Soy <strong>Tenshi</strong>. En esta <strong>Clase 3</strong> blindaremos tus auditorías: conectaremos tu <strong>Cerebro Normativo en Google NotebookLM</strong> para que jamás haya un artículo inventado y crearemos <strong>Podcasts a dos voces</strong> para tus trabajadores en campo.»
        </div>
        <div class="meet-live-strip">
          <div style="text-align:left;">
            <div style="font-size:10px; text-transform:uppercase; color:#99f6e4; font-weight:800;">Sala Google Meet Oficial</div>
            <div style="font-weight:900; color:#fff;">calendar.app.google/HKPNhtmxygTfn7NBA</div>
          </div>
          <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:8px 14px; font-size:12px;">
            Unirme Ahora ↗
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- ========================================================================
       3. PRESENTACIÓN INTERACTIVA DE ALTO IMPACTO · CLASE 3 (15 DIAPOSITIVAS)
       ======================================================================== -->
  <section class="presentation-section" id="presentacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">✨ Presentación Oficial en Vivo · Semana 3 (7:00 PM – 9:00 PM COL)</span>
          <h2 class="sec-big-title">Diapositivas Dinámicas de la Clase 3 (15 Slides)</h2>
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
            <span>WAPPY.CLUB // CLASE_03 // NOTEBOOKLM_CERO_ALUCINACION_&_PODCASTS_SST</span>
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

        <!-- Selector rápido de las 15 diapositivas de la Clase 3 -->
        <div class="slide-pills-strip" id="slide-pills-strip">
          <button class="slide-num-pill active" onclick="showSlide(1)">01 Portada C3</button>
          <button class="slide-num-pill" onclick="showSlide(2)">02 El Problema</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 Qué es NotebookLM</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 Biblioteca Legal SST</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 Citas Exactas</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 Puente Antigravity</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 Ahorro de Tokens</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 Podcasts a 2 Voces</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 Dirección del Podcast</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 WappyPodcast</button>
          <button class="slide-num-pill" onclick="showSlide(11)">11 Guías y Quizzes</button>
          <button class="slide-num-pill" onclick="showSlide(12)">12 Guiones de Video</button>
          <button class="slide-num-pill" onclick="showSlide(13)">13 De NotebookLM a WAPPY</button>
          <button class="slide-num-pill" onclick="showSlide(14)">14 Skill & Workflow C3</button>
          <button class="slide-num-pill" onclick="showSlide(15)">15 Taller & Reto #3</button>
        </div>

        <!-- VIEWPORT DE LAS 15 DIAPOSITIVAS DE LA CLASE 3 -->
        <div class="slide-viewport" id="slide-viewport">

          <!-- ==================== SLIDE 1: PORTADA CLASE 3 ==================== -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge lime">🚀 Clase 03 Oficial · Semana 3 (7:00 PM – 9:00 PM COL)</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">EL CEREBRO NORMATIVO SST</span>
            </div>
            <h2><span class="accent-lime">El Cerebro Normativo</span>: NotebookLM, Podcasts a Dos Voces y <span class="accent-teal">Cero Alucinación</span></h2>
            <p class="slide-lead">
              En las Clases 1 y 2 conectamos nuestro computador con Antigravity, el MCP de WAPPY y Tenshi Voice en el celular. Hoy damos el tercer gran salto: conectamos tu <strong>Biblioteca Jurídica y Técnica en Google NotebookLM</strong> para responder auditorías con <strong>0% de alucinación</strong> y transformar normas densas en <strong>Podcasts conversacionales a 2 voces, Videos y Quizzes</strong>.
            </p>

            <div class="s-grid-4" style="margin-bottom: 16px;">
              <div class="s-card glow-lime">
                <div style="font-size:26px; font-weight:900; color:var(--lime);">0%</div>
                <h4>Cero Alucinación</h4>
                <p>NotebookLM responde exclusivamente con base en los decretos, resoluciones y manuales que tú le subes.</p>
              </div>
              <div class="s-card glow-teal">
                <div style="font-size:26px; font-weight:900; color:var(--teal-bright);">50 Fuentes</div>
                <h4>Por Cada Cuaderno</h4>
                <p>Hasta 25 millones de palabras de leyes, guías técnicas y procedimientos sin gastar tus tokens locales.</p>
              </div>
              <div class="s-card">
                <div style="font-size:26px; font-weight:900; color:#fcd34d;">🎙️ 2 Voces</div>
                <h4>Podcasts SST</h4>
                <p>Convierte un protocolo de 40 páginas en un programa radial ameno para charlas de 5 minutos en campo.</p>
              </div>
              <div class="s-card">
                <div style="font-size:26px; font-weight:900; color:#c084fc;">-85%</div>
                <h4>Ahorro de Tokens</h4>
                <p>Antigravity consulta el artículo exacto en NotebookLM en vez de leer decretos de 400 páginas cada vez.</p>
              </div>
            </div>

            <div class="flow-diagram-box">
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lime); margin-bottom:10px; letter-spacing:0.08em;">
                🗺️ El Circuito del Cerebro Normativo que Construiremos en la Clase 3
              </div>
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">📚</div>
                  <div class="f-title">1. Google NotebookLM</div>
                  <div class="f-sub">Decreto 1072, Res. 0312, GTC 45 y manuales</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">⚖️</div>
                  <div class="f-title">2. Cita Exacta Verificada</div>
                  <div class="f-sub">Artículo, parágrafo y página sin alucinar</div>
                </div>
                <div class="flow-arrow-anim">━━🔌 MCP ━━▶</div>
                <div class="flow-node" style="border-color:var(--lime);">
                  <div class="f-icon">🎙️</div>
                  <div class="f-title">3. Podcast &amp; Quiz IA</div>
                  <div class="f-sub">Audio a 2 voces + WappyPodcast + Evaluación</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">📊</div>
                  <div class="f-title">4. WAPPY Blindado</div>
                  <div class="f-sub">Matriz Legal, 0312 y Capacitaciones al día</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 2: EL PROBLEMA DE LA ALUCINACIÓN EN SST ==================== -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge amber">⚠️ El Riesgo Jurídico de los Chats Genéricos</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">POR QUÉ NACIÓ EL CEREBRO NORMATIVO</span>
            </div>
            <h2>Por Qué los Chats Genéricos <span class="accent-lime">«Alucinan» Leyes</span> y Cómo NotebookLM lo Elimina</h2>
            <p class="slide-lead">
              En Seguridad y Salud en el Trabajo un artículo inventado en un acta de descargos, en una investigación ATEL o ante el Ministerio del Trabajo puede costar una sanción millonaria:
            </p>
            <div class="s-grid-2">
              <div class="s-card" style="border-color:rgba(239,68,68,0.45);">
                <h4 style="color:#fca5a5;">❌ Chat de IA Genérico Abierto a Internet</h4>
                <p>
                  • Mezcla legislación de España, México, Chile y Colombia sin avisarte.<br>
                  • Si no recuerda el número exacto de un parágrafo del Decreto 1072, <strong>inventa uno que suena convincente ("alucinación")</strong>.<br>
                  • No te muestra en qué renglón ni en qué página del documento oficial está sustentada su respuesta.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Riesgo de Artículos Inventados o Derogados</span><span>Alto Riesgo</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:85%; background:#ef4444;"></div></div>
                </div>
              </div>

              <div class="s-card glow-lime">
                <h4>✅ Google NotebookLM (IA Anclada a tus Fuentes)</h4>
                <p>
                  • Funciona bajo un principio estricto de <strong>"Recinto Cerrado" (Source-Grounded AI)</strong>: solo puede responder con lo que dicen los archivos que tú subiste a ese cuaderno.<br>
                  • Si algo no está en tus decretos o manuales, te dice explícitamente: <em>"No aparece en las fuentes proporcionadas"</em>.<br>
                  • Incluye <strong>botones numerados [1] [2]</strong> que al tocarlos te abren el párrafo exacto del PDF original.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Fidelidad Normativa y Trazabilidad</span><span>100% Verificable</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%"></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 3: QUÉ ES GOOGLE NOTEBOOKLM ==================== -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge lime">🧠 El Segundo Cerebro del Prevencionista</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">GOOGLE NOTEBOOKLM</span>
            </div>
            <h2>¿Qué es <span class="accent-lime">Google NotebookLM</span> y Por Qué Es Gratis para Tu Gestión SST?</h2>
            <p class="slide-lead">
              NotebookLM (<code>notebooklm.google.com</code>) es el asistente de investigación de Google impulsado por Gemini, diseñado específicamente para dominar bibliotecas enteras de documentos técnicos y legales:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>📚 1. Hasta 50 Fuentes por Cuaderno</h4>
                <p>Cada cuaderno soporta hasta 50 documentos (PDFs, Google Docs, sitios web oficiales, videos de YouTube con subtítulos y archivos Markdown), sumando millones de palabras de contexto simultáneo.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🛡️ 2. Privacidad de tus Documentos</h4>
                <p>Google garantiza que los documentos confidenciales de tus empresas (reglamentos internos, matrices o auditorías) subidos a NotebookLM no se usan para entrenar modelos públicos.</p>
              </div>
              <div class="s-card">
                <h4>🪙 3. Cero Gasto de Tokens de tu IDE</h4>
                <p>Todo el procesamiento pesado de lectura de decretos de 500 páginas y la generación de audios ocurre en los servidores de NotebookLM, cuidando al 100% la cuota de tu proyecto en Antigravity.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 4: CÓMO ARMAR TU BIBLIOTECA LEGAL SST EN COLOMBIA ==================== -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge lime">🇨🇴 Estructura Recomendada por SOMOS SST</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">ARQUITECTURA DE CUADERNOS</span>
            </div>
            <h2>Cómo Organizar tus <span class="accent-lime">Cuadernos Maestros SST</span> en NotebookLM</h2>
            <p class="slide-lead">
              En lugar de mezclar todo sin orden, te recomendamos crear estos <strong>3 Cuadernos Estratégicos</strong> para cubrir el 100% de tu operación:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>⚖️ Cuaderno 1: Normatividad General SST</h4>
                <p>
                  • Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Cap. 6).<br>
                  • Resolución 0312 de 2019 (Estándares Mínimos).<br>
                  • Guía Técnica Colombiana GTC 45.<br>
                  • Resolución 2400 de 1979 y Ley 1562 de 2012.<br>
                  • Resolución 1401 de 2007 (Investigación ATEL).
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🚧 Cuaderno 2: Tareas de Alto Riesgo y PESV</h4>
                <p>
                  • Resolución 4272 de 2021 (Trabajo Seguro en Alturas).<br>
                  • Resolución 0491 de 2020 (Espacios Confinados).<br>
                  • Resolución 40595 de 2022 (Metodología PESV).<br>
                  • Decreto 1496 de 2018 y Resolución 773 (Riesgo Químico SGA).<br>
                  • Resolución 2764 de 2022 (Batería Psicosocial).
                </p>
              </div>
              <div class="s-card">
                <h4>🏢 Cuaderno 3: Documentos Internos del Cliente</h4>
                <p>
                  • Reglamento de Higiene y Seguridad Industrial.<br>
                  • Política SST, Objetivos y Manual de Contratistas.<br>
                  • Procedimientos Operativos Normalizados (PON) y Plan de Emergencias.<br>
                  • Últimas Actas del COPASST y Comité de Convivencia.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 5: CITAS EXACTAS CON ARTÍCULO, PARÁGRAFO Y PÁGINA ==================== -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge amber">🔍 Blindaje ante Auditorías ARL / MinTrabajo</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;"> TRAZABILIDAD JURÍDICA TOTAL</span>
            </div>
            <h2>Cómo Exigir <span class="accent-lime">Citas Textuales Exactas</span> (Artículo, Parágrafo y Página)</h2>
            <p class="slide-lead">
              Observa cómo responde NotebookLM cuando le aplicas nuestra fórmula de consulta jurídica para sustentar un requerimiento o cierre de no conformidad:
            </p>

            <div class="chat-sim-window">
              <div class="chat-sim-header">
                <div class="win-dots"><span style="background:#ef4444;"></span><span style="background:#f59e0b;"></span><span style="background:#22c55e;"></span></div>
                <span>📚 Google NotebookLM · Cuaderno Maestro Normatividad SST Colombia</span>
              </div>
              <div class="chat-sim-body">
                <div class="c-bubble-user">
                  "Según las fuentes cargadas en este cuaderno, ¿cuál es el plazo legal exacto para investigar un accidente de trabajo grave o mortal en Colombia, quiénes deben integrar el equipo investigador y qué artículo exacto lo exige? Cita textualmente."
                </div>
                <div class="c-bubble-ai">
                  <strong>⚖️ Respuesta verificada con Cero Alucinación:</strong><br>
                  1. <strong>Plazo legal (15 días calendario):</strong> Según el <strong>Artículo 4 de la Resolución 1401 de 2007</strong> (y compilado en el <strong>Artículo 2.2.4.6.32 del Decreto 1072 de 2015</strong>), el aportante debe investigar todos los incidentes y accidentes de trabajo dentro de los <strong>quince (15) días siguientes</strong> a su ocurrencia <code>[Cita 1 · Pág. 3]</code>.<br>
                  2. <strong>Equipo Investigador obligatorio:</strong> Según el <strong>Artículo 7 de la Resolución 1401 de 2007</strong>, debe estar integrado como mínimo por el jefe inmediato o supervisor, un representante del COPASST y el encargado del desarrollo del SG-SST. Cuando el accidente sea grave o mortal, deberá participar un <strong>profesional con licencia vigente en Salud Ocupacional / SST</strong> <code>[Cita 2 · Pág. 5]</code>.
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 6: PUENTE NOTEBOOKLM <-> ANTIGRAVITY <-> WAPPY ==================== -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔌 Conexión del Ecosistema Completo</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">PUENTE MCP + NOTEBOOKLM</span>
            </div>
            <h2>Cómo Conectar <span class="accent-lime">NotebookLM</span> con <span class="accent-teal">Antigravity y WAPPY</span></h2>
            <p class="slide-lead">
              Tu ecosistema WAPPY cuenta con la herramienta nativa <code>wappy_ejecutar_notebooklm</code> y el conector directo para que Antigravity consulte tus cuadernos antes de redactar cualquier documento:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>1️⃣ Consulta Automática de Ley (`wappy_ejecutar_notebooklm`)</h4>
                <p>Desde WAPPY o Antigravity puedes invocar a tu cuaderno de NotebookLM para validar los artículos aplicables a una actividad o peligro antes de tomar una decisión.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>2️⃣ Sincronización de Notas a tu Carpeta `.md`</h4>
                <p>Las mejores respuestas, tablas comparativas y guías generadas en NotebookLM se exportan con 1 clic como notas limpias a tu carpeta <code>/base_normativa_notebooklm</code> en Antigravity.</p>
              </div>
              <div class="s-card">
                <h4>3️⃣ Inyección Directa a los Módulos de WAPPY</h4>
                <p>Antigravity toma esa respuesta legal verificada y llama por MCP a <code>wappy_registrar_requisito_legal</code> o <code>wappy_evaluar_estandar_0312</code> dejando tu empresa al día.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 7: AHORRO DEL 85% DE TOKENS (NOTEBOOKLM + MARKDOWN) ==================== -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge lime">🪙 Máxima Eficiencia de Tokens</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">NOTEBOOKLM + MARKDOWN (.MD) = -85% TOKENS</span>
            </div>
            <h2>Por Qué <span class="accent-lime">NotebookLM + Markdown</span> Ahorran hasta el <span class="accent-teal">85% de Tokens</span></h2>
            <p class="slide-lead">
              Si metes el PDF del Decreto 1072 (más de 350 páginas) directo en tu carpeta de Antigravity y le haces preguntas cada mañana, agotarás tu cuota en minutos. Mira la diferencia cuando delegas la biblioteca pesada a NotebookLM:
            </p>

            <div class="s-grid-2" style="margin-bottom: 14px;">
              <div class="s-card" style="border-color:rgba(239,68,68,0.4);">
                <h4 style="color:#fca5a5;">❌ Leer Decretos de 400 Páginas en el IDE Local</h4>
                <p>
                  • Leer 5 decretos completos en PDF dentro del chat de Antigravity consume más de 150,000 tokens por sesión.<br>
                  • Hace más lenta la respuesta y gasta tu límite diario innecesariamente.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Gasto de Tokens Leyendo PDFs Completos</span><span>100% Gasto</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%; background:#ef4444;"></div></div>
                </div>
              </div>

              <div class="s-card glow-lime">
                <h4>✅ Consultar el Extracto en NotebookLM + Guardar en .MD</h4>
                <p>
                  • NotebookLM lee las 400 páginas gratis en su propio entorno y te entrega solo el extracto exacto de 20 líneas con sus citas.<br>
                  • Antigravity procesa únicamente ese resumen en <code>.md</code> ahorrando hasta el <strong>85% de tus tokens</strong>.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Consumo de Tokens con NotebookLM + .MD</span><span>Solo 15%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:15%;"></div></div>
                </div>
              </div>
            </div>

            <!-- SIMULADOR INTERACTIVO DE TOKENS APLICADO A CLASE 3 -->
            <div class="token-sim-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:800; color:var(--lime); text-transform:uppercase;">
                  🧪 Simulador de Prompt Normativo Eficiente (Prueba tu consulta para NotebookLM + WAPPY)
                </span>
                <span id="token-stats-badge" style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf; font-weight:700;">
                  Palabras: 14 | Tokens estimados: 21
                </span>
              </div>
              <div class="token-input-row">
                <input type="text" id="token-live-input" class="token-input" value="Sin editar nada consulta en NotebookLM el artículo exacto y registra en Matriz Legal WAPPY" oninput="updateTokenSimulator()">
              </div>
              <div class="token-pills-output" id="token-pills-output"></div>
            </div>
          </div>

          <!-- ==================== SLIDE 8: PODCASTS CONVERSACIONALES A DOS VOCES ==================== -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge lime">🎙️ La Joya Pedagógica de la Clase 3</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">RESUMEN DE AUDIO A DOS VOCES</span>
            </div>
            <h2>De un Procedimiento Aburrido de 40 Páginas a un <span class="accent-lime">Podcast a Dos Voces</span></h2>
            <p class="slide-lead">
              Seamos sinceros: ningún operario en planta ni conductor de camión se lee un PDF de 40 páginas del Plan Estratégico de Seguridad Vial. Pero <strong>todos escuchan un audio ameno de 5 minutos mientras toman café o antes de iniciar turno</strong>:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🗣️ 1. Dos Locutores IA Conversando</h4>
                <p>El estudio de audio de NotebookLM genera una conversación hiperrealista entre dos anfitriones en español que debaten, ponen ejemplos prácticos y hacen bromas ligeras sobre tu documento.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🎯 2. Basado 100% en el Documento de tu Empresa</h4>
                <p>No hablan de generalidades: mencionan el nombre de tu empresa, los cargos reales de tu planta, tus reglas de oro de alturas y los hallazgos de tu última inspección.</p>
              </div>
              <div class="s-card">
                <h4>📲 3. Descargable en Audio Listo para Compartir</h4>
                <p>En pocos minutos descargas el archivo de audio para enviarlo al grupo de WhatsApp de los trabajadores, proyectarlo en la charla preoperacional o subirlo al LMS de WAPPY.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 9: DIRECCIÓN PERSONALIZADA DEL PODCAST EN ESPAÑOL ==================== -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge amber">🎛️ El Botón «Personalizar» del Estudio de Audio</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">4 FORMATOS DE ALTO IMPACTO</span>
            </div>
            <h2>Cómo Dirigir el <span class="accent-lime">Enfoque del Podcast</span> según tu Público en Planta u Obra</h2>
            <p class="slide-lead">
              El secreto profesional en NotebookLM es no darle solo al botón "Generar", sino usar el cuadro <strong>«Personalizar»</strong> para darle instrucciones exactas a los dos locutores:
            </p>

            <div class="s-grid-4">
              <div class="s-card glow-lime">
                <h4>👷 1. Charla de 5 Min Pre-Turno</h4>
                <p>Enfocado en operarios de planta o construcción: lenguaje cercano, directo y recordando los 3 controles críticos antes de subir al andamio o encender la máquina.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🧘 2. Pausa Activa y Ergonomía</h4>
                <p>Tono motivador y dinámico guiando al equipo administrativo u operativo sobre higiene postural, fatiga visual y cuidado osteomuscular.</p>
              </div>
              <div class="s-card">
                <h4>🪪 3. Inducción de Contratistas</h4>
                <p>Resumen ejecutivo de 6 minutos con las reglas de ingreso a la planta, permisos de trabajo, teléfonos de emergencia y prohibiciones críticas.</p>
              </div>
              <div class="s-card">
                <h4>🚨 4. Lección Aprendida ATEL</h4>
                <p>Narración reflexiva de un casi-accidente o evento ocurrido (sin nombres propios), explicando qué falló y cómo evitar que se repita.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 10: WAPPYPODCAST (/WAPPYPODCAST) Y DISTRIBUCIÓN POR WHATSAPP ==================== -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge lime">🎧 Integración Oficial con el Estudio WappyPodcast</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">WAPPY.CLUB/WAPPYPODCAST</span>
            </div>
            <h2>Conecta tus Guiones con <span class="accent-lime">WappyPodcast</span> y Llévalos al WhatsApp del Trabajador</h2>
            <p class="slide-lead">
              Además del estudio de NotebookLM, en <strong>WAPPY cuentas con nuestro aplicativo dedicado <code>/wappypodcast</code></strong> para producir cápsulas radiales SST con voces neurales y distribuirlas en campo:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🎙️ Estudio WappyPodcast (<code>wappy.club/wappypodcast</code>)</h4>
                <p style="margin-bottom:10px;">
                  • Extraes la base normativa verificada desde NotebookLM.<br>
                  • Entras a <code>/wappypodcast</code> sincronizado con los datos reales de tu empresa en Somos SST.<br>
                  • Generas el diálogo a dos voces con control total de cada intervención, cortinilla sonora y descarga inmediata.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Retención del Trabajador Escuchando vs Leyendo PDF</span><span>92% Retención</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:92%"></div></div>
                </div>
              </div>

              <div class="s-card glow-teal">
                <h4>📲 De la Nube al Casco del Trabajador (WhatsApp + QR)</h4>
                <p>
                  • Envías la cápsula de audio de 3 a 5 minutos por difusión de WhatsApp cada lunes en la mañana.<br>
                  • O imprimes un <strong>Código QR en el comedor o vestier</strong> para que el trabajador escanee con su celular, escuche el podcast y responda 3 preguntas de validación en WAPPY.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 11: GUÍAS DE ESTUDIO, FAQ, GLOSARIOS Y QUIZZES ==================== -->
          <div class="slide" id="slide-11">
            <div class="slide-header-row">
              <span class="slide-badge">📝 Evaluación de la Eficacia de las Capacitaciones</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">ESTÁNDAR 1.2.1 RESOLUCIÓN 0312</span>
            </div>
            <h2>Genera en 1 Clic <span class="accent-lime">Guías de Estudio, FAQs y Exámenes (Quizzes)</span></h2>
            <p class="slide-lead">
              No basta con dictar la charla o enviar el podcast: la norma exige <strong>evaluar la comprensión y dejar evidencia</strong>. Mira todo lo que NotebookLM produce instantáneamente desde tus fuentes:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>📋 1. Examen de Selección Múltiple (Quiz)</h4>
                <p>Le pides 10 preguntas de selección múltiple (con 4 opciones, respuesta correcta justificada en el artículo de la norma y nivel de dificultad) listas para calificar a los asistentes.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>❓ 2. Preguntas Frecuentes (FAQ) y Glosario</h4>
                <p>Extrae automáticamente las 15 dudas más comunes de los trabajadores sobre el procedimiento (ej. incapacidades, reporte de accidentes, uso de EPP) con respuestas claras.</p>
              </div>
              <div class="s-card">
                <h4>⏱️ 3. Línea de Tiempo y Briefing Ejecutivo</h4>
                <p>Ideal para gerencia o investigaciones ATEL: organiza cronológicamente los hechos o las fechas de vencimiento normativo de un decreto o resolución.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 12: GUIONES DE VIDEO EXPLICATIVO E INFOGRAFÍAS SST ==================== -->
          <div class="slide" id="slide-12">
            <div class="slide-header-row">
              <span class="slide-badge amber">🎬 Pre-Producción Audiovisual con Sustento Legal</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">PUENTE HACIA LA CLASE 4 (WAPPY STUDIO)</span>
            </div>
            <h2>De tu Cuaderno Normativo a <span class="accent-lime">Guiones de Video e Infografías</span> de Prevención</h2>
            <p class="slide-lead">
              ¿Quieres transformar una norma o una lección aprendida en un Reel vertical de 60 segundos o un póster de seguridad para publicar en planta? NotebookLM + Antigravity te arman la estructura escena por escena:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🎬 Guion Segundo a Segundo para Micro-Video SST</h4>
                <p>
                  • <strong>0s – 3s (Gancho Visual):</strong> Pregunta de impacto basada en el riesgo real.<br>
                  • <strong>3s – 45s (Desarrollo Técnico):</strong> Los 3 pasos seguros extraídos sin alucinación de tu procedimiento en NotebookLM.<br>
                  • <strong>45s – 60s (Cierre y Acción):</strong> Recordatorio del estándar legal y llamado a reportar condiciones inseguras en WAPPY.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>📊 Estructura de Infografía / Boletín de Seguridad</h4>
                <p>
                  • Extrae cifras exactas, prohibiciones, equipo de protección obligatorio y el paso a paso de emergencia.<br>
                  • Te entrega el contenido jerarquizado para generar carteleras preventivas o presentarlo en la reunión mensual del COPASST.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 13: DE NOTEBOOKLM DIRECTO A LOS MÓDULOS DE WAPPY ==================== -->
          <div class="slide" id="slide-13">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔄 Ciclo Cerrado en tu Plataforma SG-SST</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">MATRIZ LEGAL + 0312 + CAPACITACIONES</span>
            </div>
            <h2>Cómo Alimentar <span class="accent-lime">WAPPY</span> con las Respuestas Verificadas de <span class="accent-teal">NotebookLM</span></h2>
            <p class="slide-lead">
              Lo que investigas en NotebookLM no se queda en un chat suelto: a través de Antigravity y el servidor MCP lo inyectamos directamente en los módulos auditables de tu empresa en WAPPY:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>⚖️ 1. Matriz Legal (`wappy_registrar_requisito_legal`)</h4>
                <p>Cada norma, artículo aplicable, evidencia de cumplimiento y responsable identificado en tu cuaderno se registra automáticamente en la Matriz Legal de WAPPY.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>📊 2. Autoevaluación (`wappy_evaluar_estandar_0312`)</h4>
                <p>Sustenta el cumplimiento de los estándares mínimos de la Resolución 0312 citando los documentos y hallazgos verificados por tu cuaderno.</p>
              </div>
              <div class="s-card">
                <h4>🎓 3. Plan de Capacitación (`wappy_programar_capacitacion`)</h4>
                <p>Cuando creas un Podcast y su Quiz en NotebookLM, Antigravity programa la capacitación en WAPPY dejando listos el objetivo, el contenido y el examen.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 14: SKILL Y WORKFLOW DE LA CLASE 3 ==================== -->
          <div class="slide" id="slide-14">
            <div class="slide-header-row">
              <span class="slide-badge lime">⚙️ Automatización Reutilizable Sin Código</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">SKILL.MD + COMANDOS /SLASH CLASE 3</span>
            </div>
            <h2>Tu Nuevo Skill <span class="accent-lime">auditor-normativo-notebooklm</span> y Atajos <span class="accent-teal">/slash</span></h2>
            <p class="slide-lead">
              Hoy dejamos instalados en tu carpeta de Antigravity el Skill jurídico-pedagógico de la Clase 3 y sus comandos rápidos de 1 clic:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4 style="font-family:var(--font-mono); color:var(--lime);">/consultar-ley</h4>
                <p>Verifica cualquier duda o hallazgo contra tu cuaderno de NotebookLM exigiendo artículo, parágrafo y cita textual con 0% de alucinación y lo sube a la Matriz Legal de WAPPY.</p>
              </div>
              <div class="s-card glow-teal">
                <h4 style="font-family:var(--font-mono); color:#2dd4bf;">/crear-podcast-sst</h4>
                <p>Toma un procedimiento o norma de tu empresa, genera el prompt director para el Podcast a 2 voces, crea el Quiz de 5 preguntas y agenda la capacitación en WAPPY.</p>
              </div>
              <div class="s-card">
                <h4 style="font-family:var(--font-mono); color:#fcd34d;">/cerebro-sst</h4>
                <p>Ejecuta la auditoría cruzada completa: lee los documentos internos del cliente, los contrasta con la ley vigente en NotebookLM y genera el informe de brechas normativas.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 15: TALLER EN VIVO Y RETO #3 ==================== -->
          <div class="slide" id="slide-15">
            <div class="slide-header-row">
              <span class="slide-badge amber">🏆 Laboratorio Práctico en Vivo · Clase 3</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">META DE LA SEMANA 3</span>
            </div>
            <h2>¡Manos a la Obra! Nuestro <span class="accent-lime">Reto Práctico de la Clase 3</span></h2>
            <p class="slide-lead">
              Baja a la sección de <strong>Prompts de la Clase 3</strong>, cópialos con un clic y pégalos en tu chat de Antigravity y en NotebookLM mientras realizamos la práctica en vivo:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>✅ Lo que dejarás funcionando hoy mismo:</h4>
                <p>
                  1. Tu <strong>Cuaderno Maestro Normativo SST</strong> creado en Google NotebookLM con Decreto 1072, Res. 0312 y GTC 45.<br>
                  2. El puente de <strong>Cero Alucinación Normativa</strong> configurado en tu <code>AGENTS.md</code> (Prompt #1).<br>
                  3. Tu <strong>Matriz Legal en WAPPY alimentada</strong> con artículos y citas exactas verificadas (Prompt #2).<br>
                  4. Tu primer <strong>Podcast SST a Dos Voces en español + Quiz de Evaluación</strong> creado y programado en WAPPY (Prompts #3, #4, #5 y #6).
                </p>
              </div>
              <div class="s-card glow-teal" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                <div style="font-size:40px; margin-bottom:8px;">🎙️📚</div>
                <h4>¿Listo para probar los 6 Prompts de la Clase 3?</h4>
                <p style="margin-bottom:14px;">Baja a la sección de Prompts y usa el botón <strong>"Copiar Prompt para el Chat"</strong> en cada paso.</p>
                <a href="#prompts-chat" class="btn btn-lime">
                  Ir a los 6 Prompts de la Clase 3 ↓
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
              💬 Copiar Prompts Clase 3
            </a>
            <a href="/clase2" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              ⏮️ Repasar Clase 2
            </a>
            <a href="/clase1" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              ⏮️ Clase 1
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       3B. REPRODUCTOR CLASE 3 (MUY PRONTO) + SALA MEET OFICIAL + POPUP NOTAS
       ======================================================================== -->
  <section class="recording-section" id="grabacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">⏳ Próxima Emisión en Vivo · Semana 3 (7:00 PM – 9:00 PM COL)</span>
          <h2 class="sec-big-title">Grabación de la Clase 3 &amp; Notas Oficiales (Muy Pronto)</h2>
        </div>
        <div style="font-size: 13px; color: var(--ink-muted); font-weight: 600;">
          📹 Sala Google Meet Oficial: <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener noreferrer" style="color:var(--teal); font-weight:800; text-decoration:underline;">calendar.app.google/HKPNhtmxygTfn7NBA</a>
        </div>
      </div>

      <div class="deck-stage" id="video-stage">
        <div class="hud-corner tl"></div>
        <div class="hud-corner tr"></div>
        <div class="hud-corner bl"></div>
        <div class="hud-corner br"></div>

        <div class="deck-topbar">
          <div class="deck-telemetry">
            <span class="telemetry-dot" style="background:#f59e0b; box-shadow:0 0 12px #f59e0b;"></span>
            <span>WAPPY.CLUB // CLASE_03 // ESTADO: MUY_PRONTO_EN_VIVO (7:00 PM – 9:00 PM COL)</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge" style="border-color:rgba(245,158,11,0.5); color:#fcd34d; background:rgba(245,158,11,0.15);">⏳ GRABACIÓN DISPONIBLE TRAS LA CLASE</span>
            <button type="button" class="btn-fullscreen" onclick="toggleVideoFullscreen()">
              ⛶ Pantalla Completa
            </button>
          </div>
        </div>

        <div class="deck-progress-track">
          <div class="deck-progress-fill" style="width: 100%; background: linear-gradient(90deg, #f59e0b, #c7f303, #2dd4bf);"></div>
        </div>

        <!-- Barra Informativa de la Sesión -->
        <div class="recording-chapters-strip">
          <span class="rec-chapter-pill"><strong>🗓️ Sesión:</strong> Clase 03 Oficial · Semana 3</span>
          <span class="rec-chapter-pill"><strong>⏰ Hora:</strong> 7:00 PM – 9:00 PM (Hora Colombia)</span>
          <span class="rec-chapter-pill"><strong>📹 Google Meet:</strong> calendar.app.google/HKPNhtmxygTfn7NBA</span>
          <span class="rec-chapter-pill"><strong>🎬 Grabación:</strong> Se publicará aquí al terminar la sesión</span>
          <span class="rec-chapter-pill"><strong>📝 Notas IA:</strong> Disponibles al finalizar la Clase 3</span>
        </div>

        <!-- Contenedor 16:9 con Miniatura Oficial "CLASE 3 · MUY PRONTO" -->
        <div class="video-viewport-wrap">
          <div class="video-aspect-box">
            <!-- Miniatura Oficial Personalizada CLASE 3 · MUY PRONTO -->
            <div class="video-thumb-cover" id="video-thumb-cover" style="cursor:default;">
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{felix_avatar}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Logos WAPPY + Antigravity + CLASE 3 + MUY PRONTO -->
              <div class="thumb-center-col">
                <div class="thumb-logos-pill">
                  <img src="{wappy_horiz_logo}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{agy_logo}" alt="Google Antigravity" class="agy-i">
                </div>

                <!-- Insignia Destacada MUY PRONTO -->
                <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(245,158,11,0.2); border:2px solid #fbbf24; color:#fde047; font-family:var(--font-mono); font-size:clamp(11px, 1.3vw, 15px); font-weight:800; padding:6px 18px; border-radius:999px; text-transform:uppercase; letter-spacing:0.06em; box-shadow:0 0 24px rgba(245,158,11,0.35);">
                  ⏳ MUY PRONTO · GRABACIÓN EN PROCESO
                </div>

                <div class="thumb-clase-giant">CLASE 3</div>

                <div class="thumb-sub-title">
                  <span>El Cerebro Normativo</span>: NotebookLM, Podcasts SST &amp; <span>Cero Alucinación</span>
                </div>

                <div style="font-size:clamp(11.5px, 1.25vw, 15px); color:#cbd5e1; font-weight:700; max-width:520px; line-height:1.4;">
                  🗓️ Emisión en vivo de <strong style="color:var(--lime);">7:00 PM a 9:00 PM (Hora Colombia)</strong>.<br>
                  Al terminar la clase, el video grabado quedará disponible en este reproductor.
                </div>

                <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener noreferrer" class="thumb-play-cta" style="background:linear-gradient(135deg, #c7f303 0%, #a3e635 100%); color:#0e1300; border-color:#ffffff; box-shadow:0 14px 36px rgba(199,243,3,0.45); text-decoration:none;">
                  <span class="thumb-play-icon" style="background:#0e1300; color:#c7f303;">📹</span>
                  <span>ENTRAR A SALA MEET (calendar.app.google/HKPNhtmxygTfn7NBA)</span>
                </a>
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
          </div>
        </div>

        <!-- BARRA DEBAJO DEL VIDEO CON EL BOTÓN PARA EL POPUP DE NOTAS (MUY PRONTO) -->
        <div class="notes-trigger-bar">
          <div class="notes-trigger-info">
            <h3>⏳ Notas de la Clase 3 y Minuto a Minuto (Muy Pronto)</h3>
            <p>Las notas tomadas por IA y la transcripción de la Clase 3 se subirán apenas finalice la sesión en vivo (7:00 PM – 9:00 PM COL).</p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <button type="button" class="btn-open-notes-modal" onclick="openNotesModal()">
              📝 Ver Estado de Notas y Sala Meet (Popup)
              <span class="badge-count">MUY PRONTO</span>
            </button>
            <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:11px 16px; font-size:12.5px;">
              📹 Unirme a Google Meet ↗
            </a>
            <a href="/clase2" class="btn btn-glass" style="padding:11px 16px; font-size:12.5px;">
              ⏮️ Ver Clase 2
            </a>
            <a href="/clase1#grabacion" class="btn btn-glass" style="padding:11px 16px; font-size:12.5px;">
              ⏮️ Grabación Clase 1
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       3C. MODAL POPUP INTERACTIVO DE NOTAS CLASE 3 (ESTADO: MUY PRONTO + LINK MEET)
       ======================================================================== -->
  <div class="notes-modal-backdrop" id="notes-modal" onclick="handleBackdropClick(event)">
    <div class="notes-modal-window" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">

      <div class="notes-modal-header">
        <div class="notes-modal-title-group">
          <div class="kicker">⏳ Próxima Sesión en Vivo · Semana 3 · 7:00 PM – 9:00 PM COL</div>
          <h3 id="notes-modal-title">Notas y Memorias de la Clase 3 — Muy Pronto</h3>
        </div>
        <button type="button" class="btn-close-modal" onclick="closeNotesModal()">
          ✕ Cerrar Ventana
        </button>
      </div>

      <div class="notes-attachments-strip">
        <span style="font-size:11.5px; font-weight:800; color:#94a3b8; text-transform:uppercase;">📎 Enlaces Oficiales:</span>
        <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener noreferrer" class="note-attach-pill" style="border-color:var(--lime); color:var(--lime);">
          📹 Sala Google Meet Clase 3: calendar.app.google/HKPNhtmxygTfn7NBA ↗
        </a>
        <a href="/clase2" class="note-attach-pill">
          ⏮️ Ir a la Clase 2 ↗
        </a>
        <a href="/clase1#grabacion" class="note-attach-pill">
          ⏮️ Ver Grabación y Notas de la Clase 1 ↗
        </a>
      </div>

      <div class="notes-modal-body" style="text-align:center; padding:clamp(28px, 5vw, 56px) clamp(18px, 4vw, 40px);">
        <div style="max-width:680px; margin:0 auto; background:rgba(15,23,42,0.85); border:2px dashed rgba(199,243,3,0.45); border-radius:26px; padding:clamp(24px, 4vw, 40px); box-shadow:0 20px 50px rgba(0,0,0,0.45);">
          <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(245,158,11,0.18); border:1.5px solid #fbbf24; color:#fde047; font-family:var(--font-mono); font-size:12px; font-weight:800; padding:6px 16px; border-radius:999px; margin-bottom:16px;">
            ⏳ MUY PRONTO · PENDIENTE DE EMISIÓN EN VIVO
          </div>

          <h3 style="font-family:var(--font-display); font-size:clamp(22px, 3vw, 32px); font-weight:900; color:#ffffff; margin-bottom:12px;">
            Las Notas y la Grabación de la Clase 3 se publicarán al finalizar la sesión
          </h3>

          <p style="font-size:15px; color:#cbd5e1; line-height:1.65; margin-bottom:24px;">
            Recuerda que nuestra <strong>Clase 3 (El Cerebro Normativo: NotebookLM, Podcasts SST &amp; Cero Alucinación)</strong> se realizará en vivo de <strong style="color:var(--lime);">7:00 PM a 9:00 PM (Hora Colombia)</strong>.<br><br>
            Tan pronto terminemos la clase, aquí mismo encontrarás el <strong>video completo de la grabación</strong>, la <strong>transcripción oficial</strong>, el <strong>resumen ejecutivo</strong> y los <strong>compromisos del Reto #3</strong>.
          </p>

          <!-- Tarjeta Destacada con el Link Oficial de Google Meet -->
          <div style="background:rgba(13,148,136,0.18); border:1.5px solid #2dd4bf; border-radius:18px; padding:18px 22px; margin-bottom:24px; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; text-align:left;">
            <div>
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#5eead4; letter-spacing:0.06em;">
                📹 Enlace Oficial de Google Meet · Clase 3 (7:00 PM – 9:00 PM COL)
              </div>
              <div style="font-family:var(--font-mono); font-size:16px; font-weight:900; color:#ffffff; margin-top:4px;">
                https://calendar.app.google/HKPNhtmxygTfn7NBA
              </div>
            </div>
            <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener noreferrer" class="btn btn-lime">
              Entrar a Google Meet ↗
            </a>
          </div>

          <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
            <a href="/clase2" class="btn btn-glass">
              ⏮️ Repasar Clase 2
            </a>
            <a href="/clase1#grabacion" class="btn btn-glass">
              ⏮️ Repasar Grabación Clase 1
            </a>
            <button type="button" class="btn btn-dark" onclick="closeNotesModal()">
              Entendido, Volver a la Clase 3
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================
       4. SECCIÓN ESTRELLA CLASE 3: LOS 6 PROMPTS CONVERSACIONALES (SIN CÓDIGO)
       ======================================================================== -->
  <section class="prompts-section" id="prompts-chat">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">💬 Laboratorio Práctico Clase 3 · Copiar y Pegar en Español</span>
          <h2 class="sec-big-title">6 Prompts Listos para la Clase 3 (NotebookLM, Podcasts SST, Quizzes y Matriz Legal)</h2>
        </div>
      </div>

      <!-- Banner Explicativo Cero Código -->
      <div class="zero-code-banner">
        <div>
          <h3>✨ Cero Alucinación y Capacitaciones que Sí Escuchan tus Trabajadores</h3>
          <p>
            Con estos 6 prompts conectarás tu <strong>Cuaderno Maestro de Google NotebookLM</strong> con <strong>Antigravity</strong> y <strong>WAPPY</strong>. Nunca más sufrirás por un artículo inventado y podrás convertir cualquier norma o procedimiento técnico en un <strong>Podcast conversacional a dos voces</strong>, un <strong>Quiz calificable</strong> y un <strong>Guion de Video</strong> en minutos:
          </p>
        </div>
        <div class="zero-code-compare">
          <div style="color:#fca5a5; font-weight:800; margin-bottom:6px;">❌ Con Chats Genéricos y PDFs Densos:</div>
          <div style="color:#cbd5e1; margin-bottom:10px; font-size:12px;">Riesgo de artículos inventados, gasto masivo de tokens y trabajadores aburridos que no leen procedimientos de 40 páginas.</div>
          <div style="color:var(--lime); font-weight:800; margin-bottom:6px;">✅ En la Clase 3 con NotebookLM + WAPPY:</div>
          <div style="color:#ffffff; font-size:12px;">Citas exactas verificables al 100%, <strong>85% de ahorro de tokens</strong> y <strong>Podcasts a 2 voces + Quizzes listos para campo</strong>.</div>
        </div>
      </div>

      <!-- Grid de los 6 Prompts Conversacionales de la Clase 3 -->
      <div class="prompt-cards-grid">

        <!-- PROMPT 1: CONECTAR Y CONFIGURAR EL PUENTE DE CONSULTA CON GOOGLE NOTEBOOKLM EN AGENTS.MD -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 1 · Regla de Cero Alucinación en AGENTS.md</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Puente NotebookLM ↔ Antigravity</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">1. Configurar el Puente con Google NotebookLM en <code>AGENTS.md</code> (Cero Alucinación Normativa)</h3>
            <p class="p-card-explain">
              Pega este prompt en tu chat de Antigravity para que actualice tu archivo <code>AGENTS.md</code> y cree la estructura donde guardarás las notas y citas verificadas de NotebookLM ahorrando hasta el 85% de tokens.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-1">Hola Antigravity. Estamos en la Clase 3 de WAPPY IA y vamos a blindar mi proyecto con "Cero Alucinación Normativa" usando Google NotebookLM.

Sin editar ni borrar mis documentos originales, realiza estos pasos:
1. Crea dentro de mi proyecto la carpeta "base_normativa_notebooklm" donde guardaré los extractos legales, guías y notas exportadas desde mis cuadernos de Google NotebookLM.
2. Actualiza mi archivo AGENTS.md agregando la "Regla de Oro de Cero Alucinación Jurídica": prohíbe inventar o suponer números de artículos, decretos o resoluciones. Siempre que redactes un informe, acta o matriz, debes consultar primero mis archivos verificados en "base_normativa_notebooklm" o usar la herramienta MCP "wappy_ejecutar_notebooklm" citando Norma, Artículo, Parágrafo y Fuente exacta.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Blinda tu AGENTS.md contra alucinaciones normativas.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-1', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 2: AUDITAR UN CASO SST CONSULTANDO ARTÍCULOS EXACTOS Y ALIMENTANDO LA MATRIZ LEGAL EN WAPPY -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 2 · Auditoría Legal + Matriz Legal WAPPY</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Citas Exactas + wappy_registrar_requisito_legal</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">2. Auditar un Caso o Hallazgo SST con Citas Exactas y Alimentar la Matriz Legal en WAPPY</h3>
            <p class="p-card-explain">
              Úsalo tanto en NotebookLM como en Antigravity para extraer los artículos exactos aplicables a tu empresa y dejarlos registrados de inmediato en la Matriz Legal de WAPPY.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en NotebookLM o en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-2">Actúa como mi Auditor Jurídico Senior en SG-SST en Colombia con Cero Alucinación.

1. Consulta exclusivamente mis fuentes normativas (Decreto 1072 de 2015, Resolución 0312 de 2019, Resolución 4272 de 2021 y Resolución 40595 PESV) e identifica los requisitos legales obligatorios aplicables a los hallazgos y peligros actuales de mi empresa.
2. Por cada requisito entrega: Norma, Año, Artículo exacto, Parágrafo, cita textual entre comillas, obligación concreta del empleador y evidencia de cumplimiento exigida.
3. Conéctate vía MCP con mi cuenta de WAPPY y usa las herramientas "wappy_consultar_matriz_legal" y "wappy_registrar_requisito_legal" para dejar registrados estos artículos verificados en la Matriz Legal de mi empresa activa.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Extrae citas textuales y alimenta la Matriz Legal en WAPPY.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-2', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 3: INSTRUCCIÓN MAESTRA PARA GENERAR UN PODCAST A DOS VOCES EN ESPAÑOL COLOMBIANO -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 3 · Dirección del Podcast a 2 Voces</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">NotebookLM Audio / WappyPodcast</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">3. Instrucción Maestra para Generar un Podcast a Dos Voces (Charla de 5 Min o Pausa Activa)</h3>
            <p class="p-card-explain">
              Copia este texto y pégalo en el botón <strong>«Personalizar» del Resumen de Audio de NotebookLM</strong> (o en tu chat para preparar el guion en <code>/wappypodcast</code>) y obtén un podcast en español colombiano cercano y memorable.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Instrucción para el cuadro «Personalizar Audio» en NotebookLM / WappyPodcast:</div>
              <div class="chat-prompt-text" id="prompt-3">Genera este podcast conversacional a dos voces en español colombiano claro, cálido, energético y cercano, dirigido a los trabajadores operativos y supervisores de nuestra empresa durante la charla de seguridad de 5 minutos antes de iniciar turno.

Reglas de dirección para los dos locutores:
1. No hablen como robots leyendo un decreto: conversen con ejemplos cotidianos de planta u obra, explicando el "por qué" cuidar la vida y regresar sanos a casa.
2. Destaquen las 3 reglas de oro críticas del procedimiento cargado en las fuentes, mencionando qué hacer ante una condición insegura y qué está prohibido improvisar.
3. Cierren el episodio con un reto práctico de autocuidado para el turno de hoy e inviten al equipo a reportar cualquier peligro a través de WAPPY.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Produce un Podcast SST a 2 voces que cautiva al trabajador.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-3', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 4: GENERAR EXAMEN DE EVALUACIÓN (QUIZ), GUÍA DE ESTUDIO Y PROGRAMAR CAPACITACIÓN EN WAPPY -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 4 · Quiz + Guía + Capacitación WAPPY</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Estándar 1.2.1 Res. 0312</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">4. Generar Examen (Quiz), Guía de Estudio y Programar la Capacitación en WAPPY</h3>
            <p class="p-card-explain">
              Acompaña tu podcast de seguridad con su evaluación escrita y deja programada la sesión en el módulo de Capacitaciones de tu empresa en WAPPY.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-4">A partir del procedimiento técnico y normativo que estamos trabajando hoy (sin inventar información fuera de las fuentes verificadas):

1. Genera una Guía de Estudio de 1 página en formato Markdown (.md) con los conceptos clave, un Glosario de 5 términos y 5 Preguntas Frecuentes (FAQ) de los trabajadores.
2. Diseña un Examen de Evaluación de Eficacia (Quiz) de 5 preguntas de selección múltiple (A, B, C, D) indicando la respuesta correcta y el artículo exacto de la norma que la sustenta.
3. Conéctate vía MCP con WAPPY y usa la herramienta "wappy_programar_capacitacion" (y "wappy_crear_actividad_cronograma") para dejar agendada esta capacitación con su descripción y evaluación lista.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Crea el Quiz calificable y agenda la capacitación en WAPPY.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-4', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 5: CREAR UN GUION DE VIDEO EXPLICATIVO SST Y LECCIÓN APRENDIDA ATEL -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 5 · Guion de Video &amp; Lección Aprendida</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Pre-producción para WappyStudio</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">5. Crear un Guion de Video Explicativo SST y Lección Aprendida de Accidente (ATEL)</h3>
            <p class="p-card-explain">
              Convierte un reporte de incidente o una norma técnica de NotebookLM en un guion audiovisual estructurado segundo a segundo y una tarjeta de Lección Aprendida.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-5">Con base en las fuentes verificadas de mi cuaderno normativo y los hallazgos de seguridad de mi empresa:

1. Redacta una "Lección Aprendida de Seguridad (ATEL)" en formato ejecutivo de 1 página: ¿Qué ocurrió o qué riesgo crítico detectamos?, ¿Cuáles fueron las causas básicas e inmediatas (Res. 1401 de 2007)?, ¿Qué artículo legal aplica? y ¿Cuáles son las 4 medidas preventivas obligatorias?
2. Crea un Guion de Micro-Video Educativo de 45 segundos dividido en una tabla con 3 columnas: Tiempo (0-5s Gancho, 5-35s Reglas de Oro, 35-45s Cierre), Escena Visual / Infografía en Pantalla y Locución en Español, dejándolo guardado en mi carpeta para producirlo en WappyStudio.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Genera tu boletín de Lección Aprendida y el Guion de Video.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-5', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 6: CREAR EL SKILL CEREBRO-NORMATIVO-Y-PODCAST Y EL COMANDO /CEREBRO-SST -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 6 · Skill &amp; Atajo /cerebro-sst</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Automatización Permanente Clase 3</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">6. Crear el Skill <code>cerebro-normativo-y-podcast</code> y el Comando Rápido <code>/cerebro-sst</code></h3>
            <p class="p-card-explain">
              Deja instalado para siempre en tu proyecto de Antigravity el flujo completo de la Clase 3 para que se active escribiendo únicamente <code>/cerebro-sst</code>.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-6">Quiero dejar automatizado todo el aprendizaje de la Clase 3 creando un Skill llamado "cerebro-normativo-y-podcast" dentro de ".agents/skills/" y el comando rápido (Workflow) "/cerebro-sst".

Configúralo para que cada vez que yo escriba "/cerebro-sst" sobre un tema, procedimiento o hallazgo de una empresa, ejecutes en orden:
1. Consultes mis notas verificadas de NotebookLM (o la herramienta "wappy_ejecutar_notebooklm") exigiendo citas exactas de la legislación colombiana con 0% de alucinación.
2. Registres o actualices el requisito legal aplicable en la Matriz Legal de WAPPY ("wappy_registrar_requisito_legal").
3. Me generes en una carpeta del tema: el Prompt personalizado para el Podcast a Dos Voces, el Guion para WappyPodcast, el Quiz de 5 preguntas de evaluación y dejes programada la capacitación en WAPPY ("wappy_programar_capacitacion").</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Instala el Skill de la Clase 3 y el comando /cerebro-sst.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-6', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ========================================================================
       5. GUÍA PASO A PASO DETALLADA DE LA CLASE 3 (4 BLOQUES PEDAGÓGICOS)
       ======================================================================== -->
  <section class="guide-section" id="guia-paso-a-paso">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">📘 Resumen Pedagógico Completo · Semana 3</span>
          <h2 class="sec-big-title">Guía de Estudio Paso a Paso · Clase 3</h2>
        </div>
      </div>

      <div class="guide-blocks-grid">

        <!-- BLOQUE 1 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 1 · Cuadernos SST Cero Alucinación</span>
            <span class="g-time">⏱️ Duración: 30 Minutos</span>
          </div>
          <h3>Arquitectura de Cuadernos en Google NotebookLM y Blindaje Jurídico</h3>
          <p style="font-size:14px; color:var(--ink-soft);">
            Construimos el Cerebro Normativo de tu consultoría o departamento SST para que ninguna respuesta carezca de sustento legal verificable:
          </p>
          <ul class="g-list">
            <li>
              <strong>1. Principio de Recinto Cerrado (0% Alucinación):</strong>
              A diferencia de un chat genérico de internet, NotebookLM solo responde con base en los PDFs, normas y documentos que tú subes a tu cuaderno, indicando con botones numerados el párrafo y la página exacta.
            </li>
            <li>
              <strong>2. Los 3 Cuadernos Maestros Recomendados:</strong>
              Organiza un cuaderno para <em>Normatividad General (Decreto 1072, Res. 0312, GTC 45)</em>, un segundo cuaderno para <em>Alto Riesgo y PESV (Res. 4272, Res. 0491, Res. 40595)</em> y un tercer cuaderno para los <em>Documentos Internos del Cliente</em>.
            </li>
            <li>
              <strong>3. Fórmula para Exigir Citas Textuales:</strong>
              Pídele siempre: <em>"Cita textualmente entre comillas indicando Norma, Artículo, Parágrafo y página exacta para responder una auditoría del Ministerio del Trabajo o la ARL"</em>.
            </li>
            <li>
              <strong>4. Capacidad Masiva sin Gastar tus Tokens:</strong>
              Cada cuaderno admite hasta 50 fuentes (25 millones de palabras) procesadas directamente en la nube de Google sin consumir los créditos de tu IDE.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 2 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 2 · Puente NotebookLM ↔ Antigravity</span>
            <span class="g-time">⏱️ Duración: 30 Minutos</span>
          </div>
          <h3>Conexión con Antigravity y WAPPY Ahorrando hasta el 85% de Tokens</h3>
          <ul class="g-list">
            <li>
              <strong>Regla de Cero Alucinación en <code>AGENTS.md</code> (Prompt #1):</strong>
              Configuramos la constitución de tu proyecto para que Antigravity jamás invente números de artículos y consulte siempre tus notas verificadas de NotebookLM.
            </li>
            <li>
              <strong>Ahorro del 85% de Tokens con Extractos <code>.md</code>:</strong>
              En vez de poner a Antigravity a leer decretos completos de 400 páginas en cada chat, NotebookLM extrae solo los artículos aplicables y los guardas en <code>/base_normativa_notebooklm</code> en formato Markdown ligero.
            </li>
            <li>
              <strong>Conector Nativo <code>wappy_ejecutar_notebooklm</code>:</strong>
              Usa el puente integrado en el ecosistema WAPPY para consultar tus cuadernos normativos directamente desde tus flujos de trabajo.
            </li>
            <li>
              <strong>Alimentación Directa de la Matriz Legal (Prompt #2):</strong>
              Con la herramienta MCP <code>wappy_registrar_requisito_legal</code>, los artículos auditados pasan directo a la Matriz Legal de tu empresa activa en WAPPY.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 3 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 3 · Podcasts a 2 Voces y WappyPodcast</span>
            <span class="g-time">⏱️ Duración: 35 Minutos</span>
          </div>
          <h3>Transformar Procedimientos Densos en Cápsulas Radiales para los Trabajadores</h3>
          <ul class="g-list">
            <li>
              <strong>El Estudio de Audio a Dos Voces en Español:</strong>
              Convierte un protocolo de 40 páginas que nadie lee en una conversación amena de 5 minutos entre dos locutores IA que explican los riesgos con ejemplos de la vida real.
            </li>
            <li>
              <strong>Dirección Personalizada del Episodio (Prompt #3):</strong>
              Usa siempre el botón <em>"Personalizar"</em> para enfocar el podcast como charla pre-turno de 5 minutos, pausa activa, inducción de contratistas o lección aprendida.
            </li>
            <li>
              <strong>Producción Avanzada en <code>wappy.club/wappypodcast</code>:</strong>
              Integra tus guiones con el estudio oficial <strong>WappyPodcast</strong> para personalizar cada línea de diálogo, voces y cortinillas sincronizadas con tu empresa en Somos SST.
            </li>
            <li>
              <strong>Distribución en Campo por WhatsApp y Código QR:</strong>
              Descarga el audio y envíalo al grupo de WhatsApp de la cuadrilla o publica el QR en cartelera para que lo escuchen desde el celular antes de iniciar labores.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 4 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 4 · Guiones de Video, Infografías y Quizzes</span>
            <span class="g-time">⏱️ Duración: 25 Minutos</span>
          </div>
          <h3>Evaluación de Capacitaciones, Lecciones Aprendidas ATEL y Comando <code>/cerebro-sst</code></h3>
          <ul class="g-list">
            <li>
              <strong>Exámenes de Evaluación (Quizzes) y FAQs (Prompt #4):</strong>
              Genera en 1 clic cuestionarios de selección múltiple con respuestas justificadas en la ley para cumplir la evaluación de eficacia del Estándar 1.2.1 de la Resolución 0312.
            </li>
            <li>
              <strong>Guiones de Micro-Video y Lecciones Aprendidas (Prompt #5):</strong>
              Estructura boletines ejecutivos de incidentes (Res. 1401 de 2007) y guiones segundo a segundo listos para renderizar videos en la Clase 4 con <em>WappyStudio</em>.
            </li>
            <li>
              <strong>Programación Automática en WAPPY:</strong>
              Usa <code>wappy_programar_capacitacion</code> y <code>wappy_crear_actividad_cronograma</code> para que el podcast, la guía y el examen queden agendados en tu Plan Anual.
            </li>
            <li>
              <strong>Creación del Skill y Atajo <code>/cerebro-sst</code> (Prompt #6):</strong>
              Deja automatizado el ciclo completo para que con un solo comando tengas sustento legal, Matriz Legal actualizada, Podcast y Quiz de cualquier tema SST.
            </li>
          </ul>
        </div>

      </div>

      <!-- CTA Final de Acceso a Sala Meet y Navegación entre Clases -->
      <div class="final-cta-card">
        <div style="max-width: 640px;">
          <span style="color:var(--lime); font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
            🎓 Todo Listo para Nuestra Clase 3 · 7:00 PM – 9:00 PM COL
          </span>
          <h3 style="font-family:var(--font-display); font-size:clamp(20px, 2.6vw, 30px); font-weight:900; margin:6px 0 8px;">
            Ten Abierto Google NotebookLM, Antigravity y WAPPY a las 6:50 PM
          </h3>
          <p style="font-size:14px; color:#cbd5e1;">
            En esta sesión crearemos en vivo nuestro Cuaderno Maestro Normativo SST con 0% de alucinación, produciremos nuestro primer Podcast a dos voces y alimentaremos la Matriz Legal en WAPPY.
          </p>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <a href="/clase2" class="btn btn-glass">
            ⏮️ Ver Clase 2
          </a>
          <a href="/clase1" class="btn btn-glass">
            ⏮️ Ver Clase 1
          </a>
          <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener noreferrer" class="btn btn-lime">
            📹 Entrar a Google Meet (7:00 PM)
            <span class="arrow-pip">↗</span>
          </a>
        </div>
      </div>

      <footer>
        <p><strong>WAPPY IA · SOMOS SST</strong> · Especialización Práctica en Agentes Autónomos para Seguridad y Salud en el Trabajo</p>
        <p style="margin-top:4px;">wappy.club/clase3 · Docente Líder: Ing. Félix Bedoya · Grupo Exclusivo de Participantes</p>
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

# Write to client/public/clase3.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase3.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {pub_path} ({len(html_content)} bytes)")

# Write to Desktop
desktop_path = '/Users/venta/Desktop/clase3.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {desktop_path} ({len(html_content)} bytes)")
