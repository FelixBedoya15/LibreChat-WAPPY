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

if not cat_logo:
    cat_logo = logo_wappy

html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>WAPPY IA · Clase 1: Fundamentos de IA, WAPPY & Google Antigravity | SOMOS SST</title>
  <meta name="description" content="Presentación interactiva oficial y guía paso a paso para no programadores. Conceptos básicos de IA (LLMs, Tokens, MCP, API Keys), instalación de Antigravity, proyectos en carpetas, conexión a WAPPY, Google Drive, NotebookLM y creación de Triggers y Skills desde el chat.">
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
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 clamp(14px, 3.5vw, 40px);
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
      gap: clamp(8px, 2vw, 24px);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(14, 19, 0, 0.08);
      border-radius: 9999px;
      padding: 8px 10px 8px 16px;
      box-shadow: 0 12px 36px -8px rgba(14, 19, 0, 0.14);
      width: 100%;
      max-width: 1120px;
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
      padding-top: clamp(92px, 11vw, 128px);
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
        <a href="#presentacion" class="active-pill">🎬 Presentación Interactiva (15 Slides)</a>
        <a href="#prompts-chat">💬 Prompts para el Chat (Sin Código)</a>
        <a href="#guia-paso-a-paso">📘 Guía Paso a Paso</a>
        <a href="/assets/Clase_1_Antigravity_Syllabus_y_Reglas_WAPPY.pdf" download>📄 Descargar PDF</a>
      </div>

      <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn btn-dark">
        Entrar a Meet (7:00 PM)
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
          <span>CLASE 01 EN VIVO · HOY MARTES 20 DE OCTUBRE · 7:00 PM COL</span>
        </div>

        <h1>
          Domina <span class="highlight-lime">WAPPY + Antigravity</span> desde Cero y sin Programar.
        </h1>

        <p class="hero-sub">
          Aprende con lenguaje sencillo qué son los modelos de IA, LLMs, Tokens y MCP; cómo instalar Google Antigravity, crear tu proyecto en carpetas locales, conectarlo a <strong>WAPPY</strong>, <strong>NotebookLM</strong> y <strong>Google Drive</strong>, y pedirle al chat que cree tus <strong>Skills, Agentes y Triggers automáticos</strong>.
        </p>

        <div class="hero-ctas">
          <a href="#presentacion" class="btn btn-dark">
            Ver Presentación Interactiva
            <span class="arrow-pip">↓</span>
          </a>
          <a href="#prompts-chat" class="btn btn-lime">
            Copiar Prompts para el Chat
            <span class="arrow-pip">💬</span>
          </a>
          <a href="/assets/Clase_1_Antigravity_Syllabus_y_Reglas_WAPPY.pdf" download class="btn btn-glass">
            📄 Guía Oficial PDF
          </a>
        </div>

        <div class="hero-pills-bar">
          <div class="hero-pill-item">
            <div class="hero-pill-label">⏱️ Bloque 1 (15 Min)</div>
            <div class="hero-pill-val">Conceptos IA desde 0</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔌 Conexión MCP</div>
            <div class="hero-pill-val">WAPPY + Drive + NotebookLM</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">⚡ Automatización</div>
            <div class="hero-pill-val">Triggers, Cron & Skills</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">👨‍🏫 Docente Líder</div>
            <div class="hero-pill-val">Ing. Félix Bedoya</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta Interactiva de Tenshi en el Hero -->
      <div class="hero-tenshi-card">
        <div class="hero-tenshi-glow"></div>
        <img src="{tenshi_img}" alt="Tenshi IA" class="tenshi-avatar-floating">
        <div class="tenshi-bubble">
          «¡Hola! Soy <strong>Tenshi</strong>. En esta Clase 1 <strong>NO necesitas saber programación</strong>. Todo lo haremos hablándole en español al chat de Antigravity para que él construya tus carpetas, habilidades y automatizaciones hacia WAPPY.»
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
       3. PRESENTACIÓN INTERACTIVA DE ALTO IMPACTO (15 DIAPOSITIVAS ANIMADAS)
       ======================================================================== -->
  <section class="presentation-section" id="presentacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">✨ Presentación Oficial en Vivo · Keynote Interactiva</span>
          <h2 class="sec-big-title">Diapositivas Dinámicas de la Clase 1 (15 Slides)</h2>
        </div>
        <div style="font-size: 13px; color: var(--ink-muted); font-weight: 600;">
          💡 Usa las flechas del teclado <code>←</code> <code>→</code>, desliza en el celular o activa <strong>Pantalla Completa</strong>
        </div>
      </div>

      <div class="deck-stage" id="deck-stage">
        <!-- Fondo de Red Neuronal en Movimiento -->
        <canvas id="deck-canvas"></canvas>

        <!-- HUD Brackets -->
        <div class="hud-corner tl"></div>
        <div class="hud-corner tr"></div>
        <div class="hud-corner bl"></div>
        <div class="hud-corner br"></div>

        <!-- Barra Superior de Telemetría -->
        <div class="deck-topbar">
          <div class="deck-telemetry">
            <span class="telemetry-dot"></span>
            <span>WAPPY.CLUB // CLASE_01 // MODO_INTERACTIVO_ACTIVO</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge" id="deck-counter">SLIDE 01 / 15</span>
            <button class="btn-fullscreen" onclick="toggleDeckFullscreen()">
              ⛶ Pantalla Completa
            </button>
          </div>
        </div>

        <!-- Barra de progreso luminosa -->
        <div class="deck-progress-track">
          <div class="deck-progress-fill" id="slide-progress"></div>
        </div>

        <!-- Selector rápido de las 15 diapositivas -->
        <div class="slide-pills-strip" id="slide-pills-strip">
          <button class="slide-num-pill active" onclick="showSlide(1)">01 Portada</button>
          <button class="slide-num-pill" onclick="showSlide(2)">02 Reglas</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 IA & LLM</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 Tokens & MCP</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 WAPPY + AGY</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 Modelos IA</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 Instalación</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 Proyectos</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 MCP WAPPY</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 Alimentar SST</button>
          <button class="slide-num-pill" onclick="showSlide(11)">11 NotebookLM</button>
          <button class="slide-num-pill" onclick="showSlide(12)">12 Google Drive</button>
          <button class="slide-num-pill" onclick="showSlide(13)">13 Triggers Oficina</button>
          <button class="slide-num-pill" onclick="showSlide(14)">14 Skills por Chat</button>
          <button class="slide-num-pill" onclick="showSlide(15)">15 Reto #1</button>
        </div>

        <!-- VIEWPORT DE LAS 15 DIAPOSITIVAS -->
        <div class="slide-viewport" id="slide-viewport">

          <!-- ==================== SLIDE 1: PORTADA ==================== -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge lime">🚀 Clase Inaugural · Cohorte VIP (12 Alumnos)</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">DURACIÓN TOTAL: 120 MIN</span>
            </div>
            <h2>De Cero a Creador de <span class="accent-lime">Agentes Autónomos SST</span> con WAPPY y Antigravity</h2>
            <p class="slide-lead">
              Hoy aprenderás el vocabulario esencial de la Inteligencia Artificial sin tecnicismos confusos y conectarás tu computador con <strong>WAPPY Cloud</strong>, <strong>NotebookLM</strong> y <strong>Google Drive</strong> usando únicamente instrucciones en español en el chat.
            </p>

            <div class="s-grid-4" style="margin-bottom: 16px;">
              <div class="s-card glow-lime">
                <div style="font-size:26px; font-weight:900; color:var(--lime);">15 min</div>
                <h4>Fundamentos IA</h4>
                <p>Qué es IA, Modelos, LLMs, Tokens, API Keys y MCP explicado desde cero.</p>
              </div>
              <div class="s-card glow-teal">
                <div style="font-size:26px; font-weight:900; color:var(--teal-bright);">100%</div>
                <h4>Sin Programación</h4>
                <p>No escribiremos código: le pediremos al chat de Antigravity que haga todo el trabajo.</p>
              </div>
              <div class="s-card">
                <div style="font-size:26px; font-weight:900; color:#fcd34d;">55+ Tools</div>
                <h4>Puente MCP WAPPY</h4>
                <p>Alimentación directa de Matrices GTC 45, PESV, Trabajadores y Cronogramas.</p>
              </div>
              <div class="s-card">
                <div style="font-size:26px; font-weight:900; color:#c084fc;">24/7</div>
                <h4>Triggers & Skills</h4>
                <p>Llegas a la oficina, abres el chat y el agente lee Drive y actualiza WAPPY solo.</p>
              </div>
            </div>

            <div class="flow-diagram-box">
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lime); margin-bottom:10px; letter-spacing:0.08em;">
                🗺️ Ruta de Aprendizaje de Esta Noche (Paso a Paso)
              </div>
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">🧠</div>
                  <div class="f-title">1. Conceptos Base</div>
                  <div class="f-sub">IA, LLM, Tokens, MCP</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">💻</div>
                  <div class="f-title">2. Antigravity</div>
                  <div class="f-sub">Instalar + Carpeta Proyecto</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">🔌</div>
                  <div class="f-title">3. Triple Conexión</div>
                  <div class="f-sub">WAPPY + Drive + NotebookLM</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">⚡</div>
                  <div class="f-title">4. Automatización</div>
                  <div class="f-sub">Skills + Triggers + Cron</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 2: REGLAS DE LA CLASE ==================== -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge amber">📋 Acuerdos de Convivencia</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">PROTOCOLO DE SALA VIP</span>
            </div>
            <h2>Reglas de Oro para Aprovechar la <span class="accent-lime">Clase al 100%</span></h2>
            <p class="slide-lead">
              Somos un grupo exclusivo de 12 profesionales SST. Empezamos desde cero absoluto y nadie se queda atrás:
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>📹 1. Cámara Encendida (10 Min)</h4>
                <p>Encendemos la cámara al menos durante los <strong>primeros 10 minutos</strong> para conocernos, saludarnos y generar confianza de equipo.</p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Conexión Humana</span><span>100%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%"></div></div>
                </div>
              </div>
              <div class="s-card">
                <h4>🌐 2. Internet Estable (≥ 15 Mbps)</h4>
                <p>Ubícate cerca del módem o usa cable de red para ver con total nitidez la pantalla compartida y descargar Antigravity.</p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Fluidez de Video HD</span><span>98%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:98%"></div></div>
                </div>
              </div>
              <div class="s-card">
                <h4>💻 3. Computador + Celular a Mano</h4>
                <p>Conéctate desde tu <strong>computador</strong> para hacer la práctica y ten tu <strong>celular</strong> con WhatsApp listo para enviar capturas si tienes dudas.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🙋‍♀️ 4. Prohibido Quedarse con Dudas</h4>
                <p>Aquí <strong>ninguna pregunta es tonta</strong>. Si un término no se entiende, levantas la mano o abres el micrófono de inmediato.</p>
              </div>
              <div class="s-card">
                <h4>💬 5. Copiar y Pegar Prompts</h4>
                <p>No vas a programar. Usaremos los <strong>Prompts Conversacionales</strong> de esta página para que el chat de Antigravity haga todo por ti.</p>
              </div>
              <div class="s-card">
                <h4>🔐 6. Cuenta WAPPY y Correo Gmail</h4>
                <p>Ten abierta tu sesión en <code>wappy.club</code> y tu cuenta de Google para conectar Drive y NotebookLM en vivo.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 3: BLOQUE 1 (15 MIN) - IA, MODELOS Y LLM ==================== -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge lime">⏱️ Bloque 1 · Primeros 15 Minutos</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">EXPLICADO FÁCIL Y SIN TECNICISMOS</span>
            </div>
            <h2>¿Qué es la <span class="accent-lime">IA</span>, un <span class="accent-teal">Modelo de IA</span> y un <span class="accent-lime">LLM</span>?</h2>
            <p class="slide-lead">
              Antes de tocar cualquier botón, entendamos con ejemplos de la vida diaria las 3 primeras palabras clave:
            </p>

            <div class="s-grid-3" style="margin-bottom: 16px;">
              <div class="s-card glow-teal">
                <h4>🤖 1. ¿Qué es Inteligencia Artificial (IA)?</h4>
                <p>
                  <strong>Analogía sencilla:</strong> Un Excel tradicional es como una calculadora: solo suma lo que le digas. La <strong>IA</strong> es como un <em>practicante inteligente</em> que lee documentos, observa fotos de riesgos y toma decisiones lógicas.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Capacidad de Razonamiento</span><span>95%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:95%"></div></div>
                </div>
              </div>

              <div class="s-card glow-lime">
                <h4>🧠 2. ¿Qué es un Modelo de IA?</h4>
                <p>
                  Es el <strong>"Cerebro Entrenado"</strong>. Imagina un especialista que estudió millones de libros, normas y casos reales. Existen varios "cerebros" famosos: <strong>Gemini</strong> (de Google), <strong>Claude</strong> (de Anthropic) y <strong>GPT</strong> (de OpenAI).
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Lectura Normativa</span><span>Millones de págs</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%"></div></div>
                </div>
              </div>

              <div class="s-card">
                <h4>📚 3. ¿Qué es un LLM?</h4>
                <p>
                  Significa <em>Large Language Model</em> (<strong>Gran Modelo de Lenguaje</strong>). Es el tipo de cerebro experto en <strong>entender y hablar español perfecto</strong>: resume el Decreto 1072, redacta actas del COPASST y conversa contigo.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Comprensión del Español</span><span>99%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:99%"></div></div>
                </div>
              </div>
            </div>

            <div class="flow-diagram-box">
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">🗣️</div>
                  <div class="f-title">Tu Petición en Español</div>
                  <div class="f-sub">"Revisa esta matriz de riesgos"</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">🧠</div>
                  <div class="f-title">El Modelo LLM Razonando</div>
                  <div class="f-sub">Gemini / Claude analiza la norma</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">✅</div>
                  <div class="f-title">Respuesta + Acción SST</div>
                  <div class="f-sub">Informe técnico y registro en WAPPY</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 4: TOKENS, CLAVES API Y MCP (CON SIMULADOR EN VIVO) ==================== -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge lime">⏱️ Bloque 1 · Conceptos Básicos (Parte 2)</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">INCLUYE SIMULADOR INTERACTIVO</span>
            </div>
            <h2>¿Qué son <span class="accent-lime">Tokens</span>, <span class="accent-teal">Claves API</span> y <span class="accent-lime">MCP</span>?</h2>
            <p class="slide-lead">
              Los otros 3 conceptos esenciales que escucharás siempre en el mundo de los agentes:
            </p>

            <div class="s-grid-3">
              <div class="s-card">
                <h4>🪙 4. ¿Qué son los Tokens?</h4>
                <p>
                  La IA no lee letra por letra, sino por <strong>"pedacitos de palabras" o sílabas llamadas Tokens</strong>. Son la unidad de memoria y lectura de la IA (100 tokens ≈ 75 palabras).
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🔑 5. ¿Qué es una Clave API (API Key)?</h4>
                <p>
                  Es una <strong>llave digital secreta</strong> (como la tarjeta de acceso a tu oficina). Le da permiso seguro a Antigravity para entrar a tu cuenta de WAPPY sin exponer tu contraseña.
                </p>
              </div>
              <div class="s-card glow-lime">
                <h4>🔌 6. ¿Qué es el MCP?</h4>
                <p>
                  <em>Model Context Protocol</em>: Es el <strong>cable USB-C universal de la IA</strong>. Gracias al MCP, el cerebro de la IA se enchufa a WAPPY, a Google Drive y a NotebookLM para leer y guardar datos reales.
                </p>
              </div>
            </div>

            <!-- SIMULADOR EN VIVO DE TOKENS -->
            <div class="token-sim-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:800; color:var(--lime); text-transform:uppercase;">
                  🧪 Laboratorio en Vivo: Mira cómo la IA divide tus frases en Tokens
                </span>
                <span id="token-stats-badge" style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf; font-weight:700;">
                  Palabras: 9 | Tokens estimados: 14
                </span>
              </div>
              <div class="token-input-row">
                <input type="text" id="token-live-input" class="token-input" value="Evaluar riesgo biomecánico según Decreto 1072 en WAPPY" oninput="updateTokenSimulator()">
              </div>
              <div class="token-pills-output" id="token-pills-output"></div>
            </div>
          </div>

          <!-- ==================== SLIDE 5: POR QUÉ ANTIGRAVITY POTENCIA A WAPPY ==================== -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge lime">⚡ La Sinergia Maestra</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CEREBRO SST + BRAZOS EJECUTORES</span>
            </div>
            <h2>WAPPY es el <span class="accent-lime">Cerebro SST</span>; Antigravity son sus <span class="accent-teal">Brazos en tu PC</span></h2>
            <p class="slide-lead">
              <strong>¡Muy importante!</strong> Antigravity jamás reemplaza a WAPPY ni a sus agentes especialistas. Antigravity hace lo que una página web no puede hacer por sí sola: vigilar tu disco duro y ejecutar triggers automáticos.
            </p>

            <div class="s-grid-2" style="margin-bottom: 14px;">
              <div class="s-card glow-lime">
                <h4>🧠 WAPPY Cloud (Tu Plataforma Oficial SST)</h4>
                <p>
                  • Tiene tus <strong>7 Especialistas entrenados en leyes colombianas</strong> (Médico, Abogado, Higienista, Ergonómo, Psicólogo, Investigador ATEL, Químico).<br>
                  • Guarda la <strong>Matriz GTC 45, Matriz PESV, Diagnóstico 0312, Trabajadores y Cronogramas</strong>.<br>
                  • Incluye a <strong>Tenshi Voice</strong> para hablar en tiempo real.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🦾 Google Antigravity (Tu Robot en el Computador)</h4>
                <p>
                  • Vive instalado en tu PC y <strong>lee las carpetas locales</strong> donde guardas fotos, PDFs y Excels.<br>
                  • Se conecta a tu <strong>Google Drive y NotebookLM</strong>.<br>
                  • Tiene <strong>Triggers y Cron</strong>: despierta solo cuando prendes el PC y le envía toda la información masticada a WAPPY.
                </p>
              </div>
            </div>

            <div class="flow-diagram-box">
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">📁</div>
                  <div class="f-title">Carpetas PC + Drive</div>
                  <div class="f-sub">Fotos, Excels, Actas PDF</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">⚡</div>
                  <div class="f-title">Google Antigravity</div>
                  <div class="f-sub">Triggers + Skills + Lectura</div>
                </div>
                <div class="flow-arrow-anim">━━🔌 MCP ━━▶</div>
                <div class="flow-node" style="border-color:var(--lime);">
                  <div class="f-icon">🐱</div>
                  <div class="f-title">WAPPY Cloud SST</div>
                  <div class="f-sub">Matrices, Indicadores y Agentes</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 6: QUÉ ES ANTIGRAVITY Y A QUÉ IAs TIENE ACCESO ==================== -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge">🌐 Tecnología de Google DeepMind</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;"> ARQUITECTURA MULTIMODELO</span>
            </div>
            <h2>¿Qué es <span class="accent-lime">Google Antigravity</span>, de Quién es y Qué Cerebros Usa?</h2>
            <p class="slide-lead">
              Fue creado por <strong>Google DeepMind</strong>. A diferencia de un chat normal en internet, Antigravity es un centro de mando instalado en tu computador con acceso a los mejores modelos de IA del mundo:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-teal">
                <h4>♊ Familia Google Gemini (Pro & Flash)</h4>
                <p>Los modelos nativos de Google con una ventana de memoria gigantesca (leen miles de páginas de decretos e inspecciones en un segundo) y visión multimodal para analizar fotos de campo.</p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Capacidad de Memoria (Contexto Masivo)</span><span>100%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%"></div></div>
                </div>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Velocidad de Respuesta y Visión</span><span>98%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:98%"></div></div>
                </div>
              </div>

              <div class="s-card glow-lime">
                <h4>🟣 Familia Anthropic Claude (Sonnet & Opus)</h4>
                <p>Modelos invitados dentro de Antigravity, famosos por su redacción impecable, razonamiento paso a paso ("Thinking") y precisión quirúrgica para seguir instrucciones de auditoría.</p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Redacción de Informes Técnicos SST</span><span>99%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:99%"></div></div>
                </div>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Obediencia a Reglas y Skills</span><span>99%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:99%"></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 7: DESCARGAR E INSTALAR PASO A PASO ==================== -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge lime">📥 Paso a Paso "Como para Niños"</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">INSTALACIÓN EN 5 MINUTOS</span>
            </div>
            <h2>Cómo <span class="accent-lime">Descargar e Instalar</span> Antigravity en tu Computador</h2>
            <p class="slide-lead">
              Es tan fácil como instalar WhatsApp o Zoom en tu computador. Sigue estos 4 pasos visuales:
            </p>

            <div class="s-grid-4">
              <div class="s-card glow-lime">
                <div style="font-size:28px; margin-bottom:6px;">1️⃣</div>
                <h4>Entra a la Web Oficial</h4>
                <p>Abre tu navegador y entra a <strong>antigravity.google</strong>. Elige el botón de descarga para tu sistema (Windows o Mac).</p>
              </div>
              <div class="s-card">
                <div style="font-size:28px; margin-bottom:6px;">2️⃣</div>
                <h4>Instala con Doble Clic</h4>
                <p>Abre el archivo descargado y dale "Siguiente / Instalar". No tienes que tocar ninguna configuración extraña.</p>
              </div>
              <div class="s-card">
                <div style="font-size:28px; margin-bottom:6px;">3️⃣</div>
                <h4>Inicia con tu Gmail</h4>
                <p>Haz clic en <strong>"Sign in with Google"</strong> e ingresa con tu correo electrónico de Google habitual.</p>
              </div>
              <div class="s-card glow-teal">
                <div style="font-size:28px; margin-bottom:6px;">4️⃣</div>
                <h4>¡Listo para Hablar!</h4>
                <p>Verás a la izquierda tus carpetas y a la derecha el <strong>Chat del Agente</strong> donde le hablaremos en español.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 8: CREAR UN PROYECTO (CARPETA) Y UN CHAT ==================== -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge lime">📁 El Secreto de los Proyectos</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">PROYECTO = CARPETA DE TU PC</span>
            </div>
            <h2>¿Qué es un <span class="accent-lime">Proyecto</span> y Cómo se Crea un <span class="accent-teal">Chat</span>?</h2>
            <p class="slide-lead">
              ¡Quítate el miedo a la palabra "Proyecto"! En Antigravity, <strong>un proyecto es simplemente una carpeta común y corriente en tu computador</strong>. Cuando la abres en Antigravity, el chat adquiere "ojos" para ver todo lo que guardes ahí.
            </p>

            <div class="s-grid-2">
              <!-- Explorador Visual de Carpetas -->
              <div class="s-card glow-teal" style="font-family:var(--font-mono); font-size:12.5px; line-height:1.7;">
                <h4 style="font-family:var(--font-display); margin-bottom:10px;">🗂️ Así se ve tu Carpeta Proyecto (Creada por el Chat)</h4>
                <div style="background:rgba(2,6,23,0.75); padding:12px; border-radius:12px; color:#e2e8f0;">
                  📁 <strong style="color:var(--lime);">Mi_Empresa_SST/</strong> <em>(Tu Proyecto Principal)</em><br>
                  ├── 📄 <strong style="color:#2dd4bf;">AGENTS.md</strong> <em>(La memoria y reglas que escribe el chat)</em><br>
                  ├── 📂 <strong>inspecciones/</strong> <em>(Fotos de hallazgos en planta)</em><br>
                  ├── 📂 <strong>epp_y_trabajadores/</strong> <em>(Listados Excel y firmas)</em><br>
                  ├── 📂 <strong>normativa/</strong> <em>(PDFs y guías de la empresa)</em><br>
                  └── 📂 <strong>informes_generados/</strong> <em>(Actas listas para gerencia)</em>
                </div>
              </div>

              <!-- Simulación de Chat creando el proyecto -->
              <div class="chat-sim-window">
                <div class="chat-sim-header">
                  <div class="win-dots">
                    <span style="background:#ef4444;"></span>
                    <span style="background:#f59e0b;"></span>
                    <span style="background:#22c55e;"></span>
                  </div>
                  <span>Chat de Antigravity · Proyecto: Mi_Empresa_SST</span>
                </div>
                <div class="chat-sim-body">
                  <div class="c-bubble-user">
                    "Hola Antigravity, soy prevencionista SST y no sé programar. Por favor créame dentro de esta carpeta las subcarpetas /inspecciones, /epp, /normativa e /informes, y confígurate como mi auditor SST de Colombia."
                  </div>
                  <div class="c-bubble-ai">
                    <strong>✅ ¡Hecho! He creado tus 4 carpetas automáticamente.</strong><br>
                    Además, acabo de escribir por ti el archivo <code>AGENTS.md</code> con las reglas del Decreto 1072 y Resolución 0312. ¿Qué documento revisamos primero?
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 9: ENTRAR A WAPPY Y CONECTAR VÍA MCP ==================== -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔌 El Puente MCP con WAPPY</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CONEXIÓN GUIADA POR EL CHAT</span>
            </div>
            <h2>Cómo Entrar a <span class="accent-lime">WAPPY</span> y Conectarlo por <span class="accent-teal">MCP</span></h2>
            <p class="slide-lead">
              Ya sabes qué es un MCP (el cable USB-C de la IA). Ahora veremos cómo obtener el conector en WAPPY y pedirle al chat de Antigravity que lo enchufe por nosotros:
            </p>

            <div class="s-grid-3">
              <div class="s-card">
                <h4>1️⃣ Entras a tu WAPPY</h4>
                <p>Inicias sesión en <code>wappy.club</code>, abres el panel de tu empresa y copias tu <strong>URL y Clave de Conexión MCP</strong>.</p>
              </div>
              <div class="s-card glow-lime">
                <h4>2️⃣ Se lo Pegas al Chat</h4>
                <p>No tienes que buscar archivos ocultos: simplemente le dices al chat de Antigravity: <em>"Conéctame a mi servidor MCP de WAPPY con estos datos"</em>.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>3️⃣ ¡55+ Herramientas Listas!</h4>
                <p>El semáforo MCP se pone en <strong>Verde</strong>. Ahora tu chat de Antigravity puede leer y guardar datos en todos los módulos de WAPPY.</p>
              </div>
            </div>

            <div class="flow-diagram-box" style="margin-top:14px;">
              <div style="display:flex; justify-content:space-around; align-items:center; flex-wrap:wrap; gap:10px; font-family:var(--font-mono); font-size:12px;">
                <span style="background:rgba(199,243,3,0.15); color:var(--lime); padding:6px 12px; border-radius:8px;">✓ wappy_consultar_matriz_gtc45</span>
                <span style="background:rgba(45,212,191,0.15); color:#2dd4bf; padding:6px 12px; border-radius:8px;">✓ wappy_alimentar_matriz_gtc45</span>
                <span style="background:rgba(199,243,3,0.15); color:var(--lime); padding:6px 12px; border-radius:8px;">✓ wappy_registrar_trabajador</span>
                <span style="background:rgba(45,212,191,0.15); color:#2dd4bf; padding:6px 12px; border-radius:8px;">✓ wappy_crear_actividad_cronograma</span>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 10: ALIMENTAR A WAPPY DESDE CARPETAS ==================== -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge lime">📤 De tu Computador a WAPPY Cloud</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CERO DIGITACIÓN MANUAL</span>
            </div>
            <h2>Cómo <span class="accent-lime">Alimentar a WAPPY</span> desde las Carpetas de tu Proyecto</h2>
            <p class="slide-lead">
              ¿De dónde sale la información? De los archivos que pones en tu carpeta del computador (fotos de recorrido, Excels de personal, PDFs de inspecciones). Mira cómo el chat los sube a WAPPY:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>📸 Caso Real en Clase: Subir Hallazgos y Riesgos</h4>
                <p style="margin-bottom:10px;">
                  1. Guardas 5 fotos de una inspección de planta en tu carpeta <code>/inspecciones</code>.<br>
                  2. Le escribes el prompt al chat de Antigravity.<br>
                  3. Antigravity mira cada foto, identifica el peligro según la <strong>GTC 45</strong> y lo registra directo en tu cuenta de WAPPY.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Ahorro de Tiempo digitando Matrices</span><span>92% más rápido</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:92%"></div></div>
                </div>
              </div>

              <div class="chat-sim-window">
                <div class="chat-sim-header">
                  <div class="win-dots"><span style="background:#ef4444;"></span><span style="background:#f59e0b;"></span><span style="background:#22c55e;"></span></div>
                  <span>Prompt en Español → Alimentando WAPPY</span>
                </div>
                <div class="chat-sim-body">
                  <div class="c-bubble-user">
                    "Revisa las fotos nuevas que puse en mi carpeta /inspecciones, evalúa el riesgo con la GTC 45 y regístralas automáticamente en la matriz de mi empresa en WAPPY."
                  </div>
                  <div class="c-bubble-ai">
                    <strong>🔌 Ejecutando vía MCP en WAPPY...</strong><br>
                    • Foto 1: Cableado expuesto en bodega → Riesgo Eléctrico (Nivel Alto) cargado en GTC 45.<br>
                    • Foto 2: Operario sin gafas ANSI Z87 → Reporte de condición subestándar creado en WAPPY.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 11: CONECTAR A GOOGLE NOTEBOOKLM ==================== -->
          <div class="slide" id="slide-11">
            <div class="slide-header-row">
              <span class="slide-badge">📚 Memoria Legal Incorruptible</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">CERO ALUCINACIONES NORMATIVAS</span>
            </div>
            <h2>Conectar <span class="accent-teal">Google NotebookLM</span> vía MCP a tu Proyecto</h2>
            <p class="slide-lead">
              Además de ver las carpetas de tu computador, le daremos acceso a tus cuadernos de <strong>Google NotebookLM</strong> donde están cargadas las leyes oficiales de Colombia:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-teal">
                <h4>📖 1. Tu Biblioteca SST Oficial</h4>
                <p>Subes a NotebookLM el Decreto 1072 de 2015, la Resolución 0312 de 2019, la GTC 45 y el reglamento interno de tu empresa.</p>
              </div>
              <div class="s-card glow-lime">
                <h4>🎯 2. Citas Exactas por MCP</h4>
                <p>Cuando Antigravity va a alimentar a WAPPY, primero le pregunta a NotebookLM el artículo exacto para <strong>nunca inventar leyes</strong>.</p>
              </div>
              <div class="s-card">
                <h4>🎙️ 3. Podcasts y Quizzes SST</h4>
                <p>Desde el chat puedes pedirle que transforme un protocolo técnico en un <strong>podcast de audio de 5 minutos</strong> para enviar por WhatsApp a los trabajadores.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 12: CONECTAR A GOOGLE DRIVE ==================== -->
          <div class="slide" id="slide-12">
            <div class="slide-header-row">
              <span class="slide-badge lime">☁️ Nube Corporativa + Retención de 20 Años</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">DECRETO 1072 ART. 2.2.4.6.13</span>
            </div>
            <h2>Rescatar Información de <span class="accent-lime">Google Drive</span> para Alimentar a WAPPY</h2>
            <p class="slide-lead">
              Muchas empresas tienen años de actas, exámenes médicos e inspecciones guardadas en Google Drive. Enseñaremos al chat de Antigravity a entrar a tu Drive, rescatar esa información y actualizar WAPPY:
            </p>

            <div class="flow-diagram-box">
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">☁️</div>
                  <div class="f-title">Google Drive Empresa</div>
                  <div class="f-sub">Carpetas compartidas e históricos</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--lime);">
                  <div class="f-icon">🕵️‍♂️</div>
                  <div class="f-title">Antigravity Rescata Datos</div>
                  <div class="f-sub">Extrae pendientes, fechas y firmas</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">📊</div>
                  <div class="f-title">WAPPY Actualizado</div>
                  <div class="f-sub">Indicadores y Cronograma al día</div>
                </div>
              </div>
            </div>

            <div class="s-grid-2" style="margin-top:12px;">
              <div class="s-card">
                <h4>🔍 Rescate Inteligente de Documentos</h4>
                <p>No tienes que descargar e importar archivo por archivo: le pides al chat que lea la carpeta de Drive del mes y extraiga todos los compromisos pendientes.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🏛️ Respaldo Legal de 20 Años</h4>
                <p>Cada informe nuevo que genera Antigravity queda registrado en WAPPY y guardado automáticamente en la estructura oficial de Google Drive.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 13: TRIGGERS Y AUTOMATIZACIONES (ESCENARIO OFICINA) ==================== -->
          <div class="slide" id="slide-13">
            <div class="slide-header-row">
              <span class="slide-badge amber">⚡ El Escenario Estrella de la Clase</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">TRIGGERS + CRON AUTOMÁTICO</span>
            </div>
            <h2>Cómo Funcionan los <span class="accent-lime">Triggers</span> cuando Llegas a la Oficina</h2>
            <p class="slide-lead">
              Imagina este flujo real que dejaremos configurado hoy mismo en tu computador:
            </p>

            <div class="flow-diagram-box">
              <div class="flow-nodes-row">
                <div class="flow-node" style="border-color:#fcd34d;">
                  <div class="f-icon">☕</div>
                  <div class="f-title">1. Llegas a la Oficina</div>
                  <div class="f-sub">Prendes tu PC y abres / haces scroll en tu chat</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">📂</div>
                  <div class="f-title">2. Trigger lee Drive</div>
                  <div class="f-sub">Detecta nuevos reportes subidos en la mañana</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">📝</div>
                  <div class="f-title">3. Crea Informes</div>
                  <div class="f-sub">Redacta el análisis técnico y las actividades</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--lime);">
                  <div class="f-icon">✅</div>
                  <div class="f-title">4. Registro en WAPPY</div>
                  <div class="f-sub">Guarda las tareas y te muestra el resumen</div>
                </div>
              </div>
            </div>

            <div class="s-grid-3" style="margin-top:12px;">
              <div class="s-card glow-lime">
                <h4>🖱️ Trigger al Abrir / Scroll en el Chat</h4>
                <p>Configuramos una instrucción automática para que apenas abras tu sesión de la mañana o invoques tu rutina, el agente revise novedades sin que tengas que explicarle nada.</p>
              </div>
              <div class="s-card">
                <h4>⏰ Trigger por Horario (Cron)</h4>
                <p>Le dices al chat: <em>"Todos los días a las 7:30 AM revisa mi carpeta de Drive y actualiza WAPPY"</em>.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>📸 Trigger por Archivo Nuevo</h4>
                <p>Cada vez que caiga un archivo nuevo en tu carpeta vigilada, el agente lo procesa y deja la trazabilidad lista.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 14: CREAR AGENTES, SKILLS Y WORKFLOWS PIDIÉNDOSELO AL CHAT ==================== -->
          <div class="slide" id="slide-14">
            <div class="slide-header-row">
              <span class="slide-badge lime">💬 Cero Código · 100% Conversacional</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">TÚ PIDES EN ESPAÑOL → EL CHAT LO CREA</span>
            </div>
            <h2>Cómo Crear <span class="accent-lime">Agentes, Skills y Workflows</span> Hablándole al Chat</h2>
            <p class="slide-lead">
              Mis alumnos no son programadores: son líderes SST. Por eso <strong>nunca escribirás código a mano</strong>; le enviarás un prompt al chat de Antigravity para que él mismo cree sus archivos internos:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>1. Transformar el Agente</h4>
                <p style="margin-bottom:8px;"><strong>Tú le escribes al chat:</strong><br><em>"Transfórmate en mi Auditor SST de Colombia y guarda tus reglas en AGENTS.md"</em>.</p>
                <p style="color:var(--lime); font-size:12px;">✨ <strong>El chat crea solo:</strong> El archivo de personalidad y reglas legales.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>2. Crear un Skill (Habilidad)</h4>
                <p style="margin-bottom:8px;"><strong>Tú le escribes al chat:</strong><br><em>"Crea un Skill para que cada vez que te pase una foto, la evalúes con GTC 45 y la subas a WAPPY"</em>.</p>
                <p style="color:var(--teal-bright); font-size:12px;">✨ <strong>El chat crea solo:</strong> La carpeta <code>.agents/skills/</code> con el manual paso a paso.</p>
              </div>
              <div class="s-card">
                <h4>3. Crear un Workflow / Cron</h4>
                <p style="margin-bottom:8px;"><strong>Tú le escribes al chat:</strong><br><em>"Crea el atajo /rutina-mañana para leer Drive, hacer el informe y dejar el registro en WAPPY"</em>.</p>
                <p style="color:#fcd34d; font-size:12px;">✨ <strong>El chat crea solo:</strong> El flujo automatizado listo para dispararse.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 15: TALLER EN VIVO Y RETO #1 ==================== -->
          <div class="slide" id="slide-15">
            <div class="slide-header-row">
              <span class="slide-badge amber">🏆 Laboratorio Práctico en Vivo</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">META DE LA CLASE 1</span>
            </div>
            <h2>¡Manos a la Obra! Nuestro <span class="accent-lime">Reto Práctico de Hoy</span></h2>
            <p class="slide-lead">
              Justo debajo de esta presentación tienes los <strong>6 Prompts Conversacionales</strong> listos para copiar con un clic y pegar en tu chat de Antigravity:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>✅ Lo que dejarás funcionando hoy:</h4>
                <p>
                  1. Antigravity instalado y abierto en tu carpeta <code>Mi_Empresa_SST</code>.<br>
                  2. Tu Agente transformado en Especialista SST usando el <strong>Prompt #1</strong>.<br>
                  3. Tu primer <strong>Skill</strong> creado por el chat con el <strong>Prompt #2</strong>.<br>
                  4. Conexión MCP activa con <strong>WAPPY, NotebookLM y Drive</strong> (Prompts #3, #4 y #5).<br>
                  5. Tu primer <strong>Trigger de Oficina</strong> listo con el <strong>Prompt #6</strong>.
                </p>
              </div>
              <div class="s-card glow-teal" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                <div style="font-size:40px; margin-bottom:8px;">🚀</div>
                <h4>¿Listo para probar los Prompts?</h4>
                <p style="margin-bottom:14px;">Baja a la siguiente sección y usa el botón <strong>"Copiar Prompt para el Chat"</strong> en cada tarjeta.</p>
                <a href="#prompts-chat" class="btn btn-lime">
                  Ir a los 6 Prompts sin Código ↓
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
            <a href="#prompts-chat" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              💬 Ver Prompts para el Chat
            </a>
            <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              📹 Sala Google Meet (7:00 PM)
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       4. SECCIÓN ESTRELLA: LOS 6 PROMPTS CONVERSACIONALES PARA EL CHAT (SIN CÓDIGO)
       ======================================================================== -->
  <section class="prompts-section" id="prompts-chat">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">💬 Especial para No Programadores · Copiar y Pegar</span>
          <h2 class="sec-big-title">Prompts Listos para Enviar al Chat de Antigravity</h2>
        </div>
      </div>

      <!-- Banner Explicativo Cero Código -->
      <div class="zero-code-banner">
        <div>
          <h3>✨ Olvídate de programar: En esta clase le hablamos al Chat en Español</h3>
          <p>
            Como profesionales de SST no tenemos por qué aprender lenguajes de programación ni editar códigos complejos. En Antigravity, <strong>el propio chat tiene permiso para crear tus carpetas, escribir sus reglas, programar tareas (cron/triggers) y conectarse por MCP</strong>. Solo debes copiar los siguientes prompts y pegarlos en tu chat paso a paso:
          </p>
        </div>
        <div class="zero-code-compare">
          <div style="color:#fca5a5; font-weight:800; margin-bottom:6px;">❌ Antes (Para Programadores):</div>
          <div style="color:#cbd5e1; margin-bottom:10px; font-size:12px;">Escribir archivos <code>.yaml</code>, comandos de consola y código manual.</div>
          <div style="color:var(--lime); font-weight:800; margin-bottom:6px;">✅ Hoy en WAPPY (Para Todos):</div>
          <div style="color:#ffffff; font-size:12px;">Le pegas el Prompt en español al chat de Antigravity y <strong>él construye todo por ti en segundos</strong>.</div>
        </div>
      </div>

      <!-- Grid de los 6 Prompts Conversacionales -->
      <div class="prompt-cards-grid">

        <!-- PROMPT 1: CREAR PROYECTO Y TRANSFORMAR EL AGENTE -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 1 · Transformar el Agente</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Crea Carpetas + AGENTS.md</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">1. Crear las Carpetas del Proyecto y Transformar tu Agente en Experto SST</h3>
            <p class="p-card-explain">
              Pega este mensaje apenas abras tu carpeta en Antigravity. El agente creará solo toda la estructura de carpetas y redactará su propia memoria legal (<code>AGENTS.md</code>).
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-1">Hola Antigravity. Soy profesional de Seguridad y Salud en el Trabajo (SST) en Colombia y no soy programador, así que necesito que tú hagas todas las configuraciones técnicas por mí.

Por favor realiza estas dos tareas ahora mismo en mi proyecto:
1. Crea dentro de esta carpeta las siguientes subcarpetas para organizar mi gestión: "inspecciones", "epp_trabajadores", "normativa_sst", "rescate_drive" e "informes_generados".
2. Crea y configura automáticamente tu archivo de instrucciones permanentes (AGENTS.md) para transformarte en mi Asistente Experto en SG-SST de Colombia. Define en tus reglas que siempre debes basarte en el Decreto 1072 de 2015, la Resolución 0312 de 2019 y la GTC 45, que nunca debes inventar normas y que toda la información que procesemos servirá para alimentar a mi plataforma principal WAPPY. Confírmame en español sencillo cuando termines.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Crea 5 carpetas y configura el agente SST solo.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-1', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 2: CREAR UN SKILL PARA TAREA RUTINARIA -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 2 · Crear un Skill (Habilidad)</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Crea SKILL.md Automático</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">2. Enseñarle al Agente un "Skill" (Receta para una Tarea Rutinaria)</h3>
            <p class="p-card-explain">
              Con este prompt le pides al chat que cree una habilidad permanente para auditar fotos de inspecciones o listas de asistencia sin que tengas que repetirle las instrucciones cada día.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-2">Necesito que crees por mí un "Skill" (habilidad personalizada) dentro de este proyecto llamado "auditor-inspecciones-y-epp". No me pidas que yo escriba código; crea tú mismo la carpeta y el archivo SKILL.md con estas instrucciones paso a paso:

Cada vez que yo ponga fotos o documentos en la carpeta "inspecciones" o "epp_trabajadores", tú debes:
1. Analizar visualmente cada archivo o imagen.
2. Identificar el factor de riesgo según la matriz GTC 45 (Físico, Químico, Biomecánico, Condiciones de Seguridad, etc.) y evaluar el nivel de riesgo.
3. Proponer la medida correctiva concreta con responsable y plazo sugerido según la normativa colombiana.
4. Dejar los datos estructurados y listos para enviarlos directamente a mi cuenta de WAPPY vía MCP.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: El agente construye su propio archivo SKILL.md.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-2', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 3: CONECTAR POR MCP A WAPPY Y ALIMENTAR DATOS -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 3 · Conectar MCP con WAPPY</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Puente directo a WAPPY Cloud</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">3. Conectar Antigravity con WAPPY vía MCP y Alimentar tus Matrices</h3>
            <p class="p-card-explain">
              Después de copiar tus credenciales MCP dentro de tu cuenta de WAPPY, pegas este prompt en el chat para que él configure la conexión y suba la información de tus carpetas a WAPPY.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-3">Quiero que te conectes vía MCP (Model Context Protocol) con mi cuenta oficial de WAPPY para que puedas alimentar mis módulos de SST automáticamente.

1. Configura en tus ajustes de servidores MCP la conexión a WAPPY usando mi enlace/llave de conexión: [PEGA AQUÍ TU DATO MCP DE WAPPY].
2. Verifica que tengas acceso a las herramientas de WAPPY (Matriz GTC 45, PESV, Trabajadores, Cronograma SST y Actos/Condiciones).
3. Ahora lee los archivos que tengo en mi carpeta local "inspecciones" y "epp_trabajadores", procesa los hallazgos y aliméntalos directamente dentro de mi empresa en WAPPY. Muéstrame un resumen de cada registro que subiste.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Conecta MCP y alimenta tu empresa en WAPPY.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-3', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 4: CONECTAR POR MCP A GOOGLE NOTEBOOKLM -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 4 · Conectar MCP NotebookLM</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Memoria Normativa Cero Alucinación</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">4. Darle Acceso a Google NotebookLM para Consultar Leyes Exactas</h3>
            <p class="p-card-explain">
              Este prompt le pide al chat que se conecte con tu cuaderno de Google NotebookLM donde tienes cargados el Decreto 1072, la Resolución 0312 y los protocolos de tu empresa.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-4">Necesito que configures la conexión MCP con mi Google NotebookLM para que tengas acceso directo a mis cuadernos de legislación colombiana SST (Decreto 1072 de 2015, Resolución 0312 de 2019 y guías técnicas de mi empresa).

Por favor deja configurada la conexión y establece como regla obligatoria en mi proyecto que antes de redactar cualquier informe o alimentar un riesgo en WAPPY, consultes primero mi cuaderno de NotebookLM para citar el artículo exacto y real de la norma sin inventar nada. Además, ayúdame a generar desde allí un guion o resumen tipo podcast para capacitar a mis trabajadores.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Vincula tus leyes en NotebookLM con citas exactas.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-4', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 5: CONECTAR A GOOGLE DRIVE Y RESCATAR INFORMACIÓN -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 5 · Conectar Google Drive</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Rescate de Archivos a WAPPY</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">5. Conectar con Google Drive para Rescatar Documentos y Llevarlos a WAPPY</h3>
            <p class="p-card-explain">
              Haz que Antigravity lea las carpetas de tu Google Drive empresarial, rescate actas, inspecciones o matrices antiguas y suba toda esa información actualizada a WAPPY.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-5">Quiero darle acceso a este proyecto a mi Google Drive corporativo donde guardamos las carpetas del SG-SST (cumpliendo los 20 años de conservación documental del Decreto 1072).

Por favor conéctate a mi carpeta de Google Drive llamada "SG-SST Empresa", rescata los informes, actas del COPASST, listados de trabajadores o inspecciones que se hayan subido recientemente, extrae todos los datos clave y úsalos para alimentar y actualizar automáticamente mi Matriz de Peligros y mi Cronograma de Actividades dentro de WAPPY. Guarda una copia del respaldo en mi carpeta local "informes_generados".</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Rescata archivos de Drive y actualiza WAPPY.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-5', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 6: CREAR TRIGGERS, CRON Y WORKFLOW DE LLEGAR A LA OFICINA -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Paso 6 · Triggers & Rutina de Oficina</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Cron + Workflow Automático</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">6. Crear el Trigger y Automatización al Llegar a la Oficina (Cron + Workflow)</h3>
            <p class="p-card-explain">
              El broche de oro de la Clase 1: pedirle al chat que configure el disparador automático para que al llegar a la oficina, prender el PC y abrir/hacer scroll en el chat, haga todo el ciclo solo.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-6">Quiero que configures una automatización completa (Trigger, tarea programada Cron y un Workflow llamado "/rutina-oficina") para mi trabajo diario en SST.

Configúralo para que cada mañana cuando yo llegue a la oficina, prenda mi computador y abra este chat (o automáticamente a las 7:30 AM de lunes a viernes), tú ejecutes sin que yo tenga que explicarte de nuevo estos 4 pasos:
1. Revisa mi Google Drive y mi carpeta local "inspecciones" buscando archivos o reportes nuevos.
2. Analiza esa información cruzándola con la normativa en NotebookLM y redacta el informe técnico del día en la carpeta "informes_generados".
3. Conéctate por MCP a WAPPY y registra las nuevas actividades en el Cronograma SST y los hallazgos en la Matriz GTC 45.
4. Déjame en pantalla el registro exacto de todo lo que hiciste para yo solo revisarlo y aprobarlo.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Crea tu Trigger matutino y el comando /rutina-oficina.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-6', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ========================================================================
       5. GUÍA PASO A PASO DETALLADA DE LA CLASE 1 (5 BLOQUES PEDAGÓGICOS)
       ======================================================================== -->
  <section class="guide-section" id="guia-paso-a-paso">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">📘 Resumen Pedagógico Completo</span>
          <h2 class="sec-big-title">Guía de Estudio Paso a Paso · Clase 1</h2>
        </div>
      </div>

      <div class="guide-blocks-grid">

        <!-- BLOQUE 1 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 1 · Fundamentos desde Cero</span>
            <span class="g-time">⏱️ Duración: Primeros 15 Minutos</span>
          </div>
          <h3>Diccionario Básico de Inteligencia Artificial ("Explicado sin Tecnicismos")</h3>
          <p style="font-size:14px; color:var(--ink-soft);">
            Para dominar tanto a WAPPY como a Antigravity sin confundirnos, empezamos la clase entendiendo estas 6 palabras fundamentales:
          </p>
          <ul class="g-list">
            <li>
              <strong>1. ¿Qué es Inteligencia Artificial (IA)?</strong>
              Es la tecnología que permite que un computador no solo guarde datos rígidos como una hoja de cálculo, sino que entienda textos, analice fotografías de seguridad industrial y proponga soluciones lógicas.
            </li>
            <li>
              <strong>2. ¿Qué son los Modelos de IA?</strong>
              Son los "cerebros digitales" entrenados por grandes compañías tecnológicas. Por ejemplo: los modelos <em>Gemini</em> (creados por Google), <em>Claude</em> (creados por Anthropic) y <em>GPT</em> (creados por OpenAI).
            </li>
            <li>
              <strong>3. ¿Qué es un LLM (Gran Modelo de Lenguaje)?</strong>
              Es el modelo de IA especializado en leer, comprender y redactar lenguaje humano. Gracias a un LLM puedes hablarle al computador en español normal sin saber programación.
            </li>
            <li>
              <strong>4. ¿Qué son los Tokens?</strong>
              Son las pequeñas sílabas o fragmentos en los que la IA divide las palabras para leerlas. Cuando decimos que un modelo lee "1 millón de tokens", significa que puede leer libros y decretos enteros de una sola vez.
            </li>
            <li>
              <strong>5. ¿Qué son las Claves API (API Keys)?</strong>
              Son llaves de seguridad digitales personales que permiten conectar una herramienta con otra de forma privada y autorizada.
            </li>
            <li>
              <strong>6. ¿Qué es el MCP (Model Context Protocol)?</strong>
              Es el conector universal (como un puerto USB-C) que permite conectar a Antigravity con WAPPY, con Google Drive y con NotebookLM para que la IA lea archivos y guarde registros por ti.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 2 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 2 · Conociendo la Herramienta</span>
            <span class="g-time">⏱️ Duración: 25 Minutos</span>
          </div>
          <h3>¿Qué es Google Antigravity, Cómo Funciona, Descarga, Instalación y Primer Proyecto?</h3>
          <ul class="g-list">
            <li>
              <strong>¿Qué es y de quién es Antigravity?</strong>
              Es la plataforma oficial de agentes autónomos creada por <strong>Google DeepMind</strong>. Te da acceso en un solo lugar a los modelos más potentes de Google (Gemini) y de Anthropic (Claude).
            </li>
            <li>
              <strong>¿Por qué potencia a WAPPY en vez de reemplazarlo?</strong>
              WAPPY es tu plataforma central SST con tus 7 especialistas y tus matrices oficiales en la nube. Antigravity es el ayudante instalado en tu PC que vigila tus carpetas, lee tu Drive y alimenta a WAPPY automáticamente.
            </li>
            <li>
              <strong>Cómo se descarga y se instala:</strong>
              Se descarga gratis desde <code>antigravity.google</code> para Windows o Mac, se instala con doble clic y se activa iniciando sesión con tu correo de Google.
            </li>
            <li>
              <strong>¿Qué es un Proyecto y cómo se abre un Chat?</strong>
              Un proyecto en Antigravity es simplemente <strong>una carpeta en tu computador</strong>. Al abrir esa carpeta y crear un chat, el agente puede leer y organizar todos los documentos que pongas dentro.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 3 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 3 · Conexión WAPPY + Nube de Google</span>
            <span class="g-time">⏱️ Duración: 35 Minutos</span>
          </div>
          <h3>Conectar a WAPPY vía MCP, Google NotebookLM y Google Drive</h3>
          <ul class="g-list">
            <li>
              <strong>Entrar a WAPPY y conectar el MCP:</strong>
              Obtenemos nuestros datos de conexión en WAPPY y le pedimos al chat de Antigravity (con el <em>Prompt #3</em>) que active las más de 55 herramientas del SG-SST.
            </li>
            <li>
              <strong>Alimentar a WAPPY desde nuestras carpetas:</strong>
              Colocamos fotos de inspecciones o listados Excel en la carpeta de nuestro computador y el chat de Antigravity se encarga de subirlos a la Matriz GTC 45, PESV o Cronograma de WAPPY.
            </li>
            <li>
              <strong>Conectar Google NotebookLM:</strong>
              Le damos acceso a nuestros cuadernos con el Decreto 1072 y la Resolución 0312 en NotebookLM para tener respaldo normativo exacto sin alucinaciones.
            </li>
            <li>
              <strong>Conectar Google Drive y rescatar información:</strong>
              Le damos acceso a las carpetas de Google Drive para rescatar informes, actas e históricos (20 años de archivo legal) y alimentar con ellos a WAPPY.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 4 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 4 · Automatización Total sin Programar</span>
            <span class="g-time">⏱️ Duración: 45 Minutos</span>
          </div>
          <h3>Crear Triggers, Tareas Programadas (Cron), Agentes, Skills y Workflows desde el Chat</h3>
          <ul class="g-list">
            <li>
              <strong>El Trigger de Llegar a la Oficina:</strong>
              Configuramos el proyecto para que cuando llegues a la oficina, prendas tu computador y abras o hagas scroll en tu chat, el agente revise Google Drive, elabore los informes pendientes y deje las actividades registradas en WAPPY.
            </li>
            <li>
              <strong>Cómo crear Agentes (`AGENTS.md`) desde el Chat:</strong>
              No escribes código: le dices al chat quién quieres que sea y qué leyes colombianas debe cumplir, y él mismo escribe su archivo de configuración.
            </li>
            <li>
              <strong>Cómo crear Skills (`SKILL.md`) desde el Chat:</strong>
              Le explicas con tus palabras cómo haces una tarea rutinaria (por ejemplo, revisar EPPs o evaluar un riesgo) y el chat guarda esa habilidad para repetirla siempre igual.
            </li>
            <li>
              <strong>Cómo crear Workflows (`/comandos`) y Cron:</strong>
              Le pides al chat que cree un comando corto como <code>/rutina-oficina</code> o un horario fijo para que todo el proceso se ejecute en piloto automático.
            </li>
          </ul>
        </div>

      </div>

      <!-- CTA Final de Descarga y Acceso a Sala Meet -->
      <div class="final-cta-card">
        <div style="max-width: 640px;">
          <span style="color:var(--lime); font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
            🎓 Todo Listo para Nuestra Clase 1 de Hoy
          </span>
          <h3 style="font-family:var(--font-display); font-size:clamp(20px, 2.6vw, 30px); font-weight:900; margin:6px 0 8px;">
            Descarga tu Guía en PDF y Conéctate Puntual a las 6:50 PM
          </h3>
          <p style="font-size:14px; color:#cbd5e1;">
            Recuerda tener tu computador encendido, tu celular a la mano con WhatsApp y tu cámara lista para los primeros 10 minutos de bienvenida.
          </p>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <a href="/assets/Clase_1_Antigravity_Syllabus_y_Reglas_WAPPY.pdf" download class="btn btn-glass">
            📄 Descargar Guía PDF Oficial
          </a>
          <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn btn-lime">
            📹 Entrar a Google Meet (7:00 PM)
            <span class="arrow-pip">↗</span>
          </a>
        </div>
      </div>

      <footer>
        <p><strong>WAPPY IA · SOMOS SST</strong> · Especialización Práctica en Agentes Autónomos para Seguridad y Salud en el Trabajo</p>
        <p style="margin-top:4px;">wappy.club/clase1 · Docente Líder: Ing. Félix Bedoya · Grupo Exclusivo de 12 Participantes</p>
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

        // Actualizar pills superiores
        const pills = document.querySelectorAll('.slide-num-pill');
        pills.forEach((p, idx) => {{
          if (idx + 1 === currentSlide) {{
            p.classList.add('active');
            p.scrollIntoView({{ behavior: 'smooth', block: 'nearest', inline: 'center' }});
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
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let width = canvas.width = canvas.offsetWidth || 1000;
      let height = canvas.height = canvas.offsetHeight || 600;

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
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase1.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {pub_path} ({len(html_content)} bytes)")

# Write to Desktop
desktop_path = '/Users/venta/Desktop/clase1.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {desktop_path} ({len(html_content)} bytes)")
