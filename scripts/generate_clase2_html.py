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
thumb_bg = get_base64_img('client/public/assets/thumb_bg_clase2.jpg')

if not cat_logo:
    cat_logo = logo_wappy

html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>WAPPY IA · Clase 2: Optimización de Tokens, Conexión MCP Única, WAPPY Móvil &amp; Tenshi Voice | SOMOS SST</title>
  <meta name="description" content="Clase 2 oficial grabada y memorias completas: Optimización de consumo de tokens en modo Turbo y Low, lectura universal de carpetas con Python, informes técnicos de ingeniería ($2.5M-$3M COP), WAPPY en celular, Google Workspace, conexión MCP única, Empresa Activa y Tenshi Voice con Memoria Procedural.">
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
      .nav-cta-wappy {{
        padding: 6px 11px;
        font-size: 11.5px;
        gap: 6px;
      }}
      .nav-cta-wappy .nav-cta-avatar {{
        width: 20px;
        height: 20px;
      }}
    }}

    /* Botón Dinámico Regla 8 WAPPY Auth (#navCtaEnterWappy) */
    .nav-actions {{
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }}

    .nav-cta-wappy {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--lime);
      color: var(--ink);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 13px;
      padding: 8px 16px;
      border-radius: 9999px;
      box-shadow: 0 6px 18px -4px rgba(168, 207, 0, 0.55);
      transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
      white-space: nowrap;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid rgba(14, 19, 0, 0.12);
    }}

    .nav-cta-wappy.logged-in {{
      padding: 5px 15px 5px 7px;
    }}

    .nav-cta-wappy:hover {{
      background: #b8e202;
      transform: translateY(-1px);
      box-shadow: 0 10px 24px -5px rgba(168, 207, 0, 0.65);
    }}

    .nav-cta-wappy:active {{
      transform: scale(0.96);
    }}

    .nav-cta-avatar {{
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid rgba(14, 19, 0, 0.22);
      flex-shrink: 0;
      background: #0d9488;
    }}

    /* ==========================================================================
       1B. BARRA ORGANIZADORA DEL CURSO (NAVEGACIÓN ENTRE CLASES 1 A 4)
       ========================================================================== */
    .course-organizer-strip {{
      position: relative;
      z-index: 20;
      background: linear-gradient(180deg, #091318 0%, #0d2126 100%);
      border-bottom: 1.5px solid rgba(199, 243, 3, 0.35);
      padding: 78px 12px 12px;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }}

    .course-organizer-inner {{
      max-width: 1060px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }}

    .course-org-pill {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 12px;
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: -0.01em;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #e2e8f0;
      transition: all 0.25s ease;
      white-space: nowrap;
      max-width: 100%;
    }}

    .course-org-pill:hover {{
      transform: translateY(-2px) scale(1.03);
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(199, 243, 3, 0.55);
      color: #ffffff;
    }}

    .course-org-pill.active {{
      background: var(--lime);
      color: var(--ink);
      border-color: var(--lime);
      box-shadow: 0 6px 20px rgba(199, 243, 3, 0.4);
      font-weight: 900;
    }}

    .course-org-pill.done {{
      background: rgba(13, 148, 136, 0.2);
      border-color: rgba(45, 212, 191, 0.45);
      color: #99f6e4;
    }}

    .course-org-pill.done:hover {{
      background: rgba(13, 148, 136, 0.34);
      color: #ecfdf5;
    }}

    .course-org-pill.live {{
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(248, 113, 113, 0.55);
      color: #fecaca;
    }}

    .course-org-pill.live:hover {{
      background: rgba(239, 68, 68, 0.3);
      color: #ffffff;
    }}

    @media (max-width: 640px) {{
      .course-organizer-strip {{
        padding: 70px 10px 10px;
      }}
      .course-organizer-inner {{
        gap: 6px;
      }}
      .course-org-pill {{
        font-size: 11px;
        padding: 6px 10px;
        border-radius: 10px;
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
      padding-top: clamp(28px, 4vw, 48px);
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

    /* Miniatura Personalizada HD 16:9 (Poster Overlay) sobre el Reproductor */
    .video-thumb-cover {{
      position: absolute;
      inset: 0;
      z-index: 10;
      background: #040d11;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: clamp(12px, 2.8vw, 38px);
      cursor: pointer;
      transition: opacity 0.4s ease, visibility 0.4s ease;
      overflow: hidden;
    }}

    .video-thumb-cover.hidden {{
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }}

    .video-thumb-bg-img {{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      z-index: 0;
      pointer-events: none;
      transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }}

    .video-thumb-cover:hover .video-thumb-bg-img {{
      transform: scale(1.04);
    }}

    .video-thumb-radial-overlay {{
      position: absolute;
      inset: 0;
      z-index: 1;
      background:
        radial-gradient(ellipse at 50% 50%, rgba(3, 10, 15, 0.80) 0%, rgba(4, 15, 20, 0.58) 52%, rgba(2, 7, 11, 0.84) 100%),
        radial-gradient(circle at 16% 58%, rgba(199, 243, 3, 0.16) 0%, transparent 44%),
        radial-gradient(circle at 84% 58%, rgba(45, 212, 191, 0.20) 0%, transparent 46%);
      pointer-events: none;
    }}

    .video-thumb-grid-bg {{
      position: absolute;
      inset: 0;
      z-index: 1;
      background-image:
        linear-gradient(rgba(199, 243, 3, 0.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(45, 212, 191, 0.045) 1px, transparent 1px);
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
      width: 24%;
      height: 100%;
    }}

    .thumb-char-col img {{
      height: 82%;
      max-height: 88%;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 18px 32px rgba(0, 0, 0, 0.78)) drop-shadow(0 0 24px rgba(199, 243, 3, 0.28));
      transition: transform 0.35s ease;
    }}

    .thumb-halo-svg {{
      width: clamp(58px, 7.5vw, 124px);
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
      background: rgba(6, 20, 25, 0.94);
      border: 1.5px solid var(--lime);
      color: var(--lime);
      font-family: var(--font-mono);
      font-size: clamp(9px, 1.02vw, 12.5px);
      font-weight: 800;
      padding: 5px 13px;
      border-radius: 999px;
      white-space: nowrap;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.65);
    }}

    .thumb-center-col {{
      position: relative;
      z-index: 3;
      width: 52%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: clamp(5px, 1.15vw, 13px);
    }}

    .thumb-logos-pill {{
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.96);
      padding: clamp(5px, 0.7vw, 8px) clamp(14px, 1.8vw, 22px);
      border-radius: 999px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55), 0 0 24px rgba(45, 212, 191, 0.35);
      border: 2px solid #2dd4bf;
    }}

    .thumb-logos-pill img.wappy-h {{
      height: clamp(18px, 2.6vw, 36px);
      width: auto;
      object-fit: contain;
    }}

    .thumb-logos-pill .plus-sep {{
      font-weight: 900;
      font-size: clamp(12px, 1.6vw, 20px);
      color: #0d9488;
    }}

    .thumb-logos-pill img.agy-i {{
      height: clamp(18px, 2.6vw, 34px);
      width: auto;
      object-fit: contain;
    }}

    .thumb-clase-giant {{
      font-family: var(--font-display);
      font-size: clamp(24px, 4.9vw, 68px);
      font-weight: 900;
      line-height: 0.98;
      letter-spacing: -0.04em;
      color: var(--ink);
      background: var(--lime);
      padding: clamp(4px, 0.6vw, 7px) clamp(16px, 2.2vw, 26px);
      border-radius: 18px;
      box-shadow: 0 12px 40px rgba(199, 243, 3, 0.5);
      text-transform: uppercase;
    }}

    .thumb-sub-title {{
      font-family: var(--font-display);
      font-size: clamp(11.5px, 1.9vw, 25px);
      font-weight: 900;
      color: #ffffff;
      line-height: 1.15;
      text-shadow: 0 6px 22px rgba(0, 0, 0, 0.85);
    }}

    .thumb-sub-title span {{
      color: #2dd4bf;
    }}

    .thumb-topic-pills {{
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: clamp(4px, 0.65vw, 8px);
      max-width: 100%;
    }}

    .thumb-topic-pill {{
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(5, 18, 24, 0.88);
      border: 1px solid rgba(199, 243, 3, 0.48);
      color: #ecfccb;
      font-family: var(--font-mono);
      font-size: clamp(8.5px, 0.9vw, 11.5px);
      font-weight: 800;
      letter-spacing: 0.03em;
      padding: clamp(3px, 0.45vw, 5px) clamp(8px, 0.95vw, 12px);
      border-radius: 999px;
      backdrop-filter: blur(6px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
      white-space: nowrap;
    }}

    .thumb-topic-pill.highlight {{
      background: rgba(13, 148, 136, 0.35);
      border-color: #2dd4bf;
      color: #99f6e4;
    }}

    .thumb-play-cta {{
      display: inline-flex;
      align-items: center;
      gap: clamp(7px, 1vw, 12px);
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #ffffff;
      font-family: var(--font-display);
      font-size: clamp(10.5px, 1.3vw, 16px);
      font-weight: 900;
      padding: clamp(7px, 1vw, 13px) clamp(14px, 2.2vw, 28px);
      border-radius: 999px;
      border: 2px solid rgba(255, 255, 255, 0.38);
      box-shadow: 0 14px 36px rgba(239, 68, 68, 0.6);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      white-space: nowrap;
    }}

    .video-thumb-cover:hover .thumb-play-cta {{
      transform: scale(1.06);
      box-shadow: 0 18px 44px rgba(239, 68, 68, 0.8);
    }}

    .thumb-play-icon {{
      width: clamp(22px, 2.4vw, 30px);
      height: clamp(22px, 2.4vw, 30px);
      border-radius: 50%;
      background: #ffffff;
      color: #dc2626;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(10px, 1.1vw, 14px);
      padding-left: 2px;
      flex-shrink: 0;
    }}

    @media (max-width: 680px) {{
      .video-thumb-cover {{
        padding: 8px 10px;
      }}
      .thumb-char-col {{
        width: 21%;
      }}
      .thumb-center-col {{
        width: 58%;
        gap: 4px;
      }}
      .thumb-char-tag {{
        display: none;
      }}
      .thumb-logos-pill {{
        padding: 3px 10px;
        gap: 6px;
      }}
      .thumb-logos-pill img.wappy-h,
      .thumb-logos-pill img.agy-i {{
        height: 15px;
      }}
      .thumb-clase-giant {{
        font-size: 19px;
        padding: 2px 12px;
        border-radius: 10px;
      }}
      .thumb-sub-title {{
        font-size: 10px;
        line-height: 1.12;
      }}
      .thumb-topic-pills {{
        gap: 3px;
      }}
      .thumb-topic-pill {{
        font-size: 7px;
        padding: 2px 6px;
      }}
      .thumb-play-cta {{
        font-size: 9.5px;
        padding: 5px 11px;
        gap: 5px;
      }}
      .thumb-play-icon {{
        width: 18px;
        height: 18px;
        font-size: 9px;
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
          <div class="sub">SOMOS SST · CLASE 2</div>
        </div>
      </a>

      <div class="nav-links">
        <a href="#presentacion" class="active-pill">🎬 Presentación</a>
        <a href="#grabacion">🎥 Grabación</a>
        <a href="#prompts-chat">💬 Prompts Clase 2</a>
        <a href="#guia-paso-a-paso">📘 Guía Paso a Paso</a>
        <a href="/clase3">Ir a Clase 3 ↗</a>
      </div>

      <div class="nav-actions">
        <a id="navCtaEnterWappy" href="/login" class="nav-cta-wappy">
          <span>Ir a WAPPY</span>
        </a>
      </div>
    </nav>
  </div>

  <!-- ========================================================================
       1B. BARRA ORGANIZADORA DEL CURSO (CLASES 1 A 4 + TEMARIO)
       ======================================================================== -->
  <div class="course-organizer-strip" id="inicio">
    <nav class="course-organizer-inner" aria-label="Navegación oficial del curso">
      <a href="/cursowappy01" class="course-org-pill">🎓 Temario Curso</a>
      <a href="/clase1" class="course-org-pill done">✅ Clase 1 · Grabada</a>
      <a href="/clase2" class="course-org-pill active" aria-current="page">📍 Clase 2 · Estás aquí</a>
      <a href="/clase3" class="course-org-pill done">✅ Clase 3 · Grabada</a>
      <a href="/clase4" class="course-org-pill done">✅ Clase 4 · Grabada</a>
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
          <span>✅ Clase 02 Grabada · Martes 27/28 de Octubre · ~02:04 HRS</span>
        </div>

        <h1>
          Optimización de Tokens, <span class="highlight-lime">Conexión MCP</span> &amp; Tenshi Voice en Móvil
        </h1>

        <p class="hero-sub">
          Domina cómo evitar bloqueos de cuota configurando tus modelos en modo <strong>Turbo / Low</strong>, leer carpetas completas con Excels antiguos y PDFs escaneados mediante <strong>Python</strong>, estructurar informes técnicos de ingeniería de <strong>$2.5M–$3M COP</strong>, instalar <strong>WAPPY en tu celular</strong> con <strong>Google Workspace</strong>, activar tu <strong>Servidor MCP una única vez</strong> respetando la <strong>Empresa Activa</strong> y operar a <strong>Tenshi por voz</strong> con Memoria Procedural.
        </p>

        <div class="hero-ctas">
          <a href="#grabacion" class="btn btn-dark">
            🎥 Ver Grabación Clase 2
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
            <div class="hero-pill-label">⚡ Optimización IA</div>
            <div class="hero-pill-val">Modo Turbo · Low vs High</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🐍 Lectura Universal</div>
            <div class="hero-pill-val">Carpetas, PDFs y Excels</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔌 Servidor MCP Único</div>
            <div class="hero-pill-val">WAPPY + Empresa Activa</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🎙️ Móvil &amp; Memoria</div>
            <div class="hero-pill-val">Tenshi Voice + CIE-10</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta Interactiva de Tenshi en el Hero -->
      <div class="hero-tenshi-card">
        <div class="hero-tenshi-glow"></div>
        <img src="{tenshi_img}" alt="Tenshi IA" class="tenshi-avatar-floating">
        <div class="tenshi-bubble">
          «¡Hola! Soy <strong>Tenshi</strong>. En esta <strong>Clase 2</strong> conectamos Antigravity con WAPPY <strong>una sola vez</strong>, instalamos WAPPY en tu celular y activamos mis comandos de voz y <strong>Memoria Procedural (CIE-10 y NotebookLM)</strong> para que delegues tareas reales sin estar frente al PC.»
        </div>
        <div class="meet-live-strip">
          <div style="text-align:left;">
            <div style="font-size:10px; text-transform:uppercase; color:#99f6e4; font-weight:800;">Siguiente Sesión del Curso</div>
            <div style="font-weight:900; color:#fff;">Clase 3 Grabada Disponible</div>
          </div>
          <a href="/clase3" class="btn btn-lime" style="padding:8px 14px; font-size:12px;">
            Ir a Clase 3 ↗
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- ========================================================================
       3. PRESENTACIÓN INTERACTIVA DE ALTO IMPACTO (10 DIAPOSITIVAS ANIMADAS · CLASE 2)
       ======================================================================== -->
  <section class="presentation-section" id="presentacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">✨ Presentación Oficial · Síntesis Estructurada Clase 2</span>
          <h2 class="sec-big-title">Diapositivas Dinámicas de la Clase 2 (10 Slides)</h2>
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
            <span>WAPPY.CLUB // CLASE_02 // MCP_UNICO_Y_TENSHI_VOICE</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge" id="deck-counter">SLIDE 01 / 10</span>
            <button class="btn-fullscreen" onclick="toggleDeckFullscreen()">
              ⛶ Pantalla Completa
            </button>
          </div>
        </div>

        <!-- Barra de progreso luminosa -->
        <div class="deck-progress-track">
          <div class="deck-progress-fill" id="slide-progress"></div>
        </div>

        <!-- Selector rápido de las 10 diapositivas -->
        <div class="slide-pills-strip" id="slide-pills-strip">
          <button class="slide-num-pill active" onclick="showSlide(1)">01 Portada</button>
          <button class="slide-num-pill" onclick="showSlide(2)">02 Diagnóstico Tokens</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 Turbo: Low vs High</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 Lectura Python</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 Ingeniería $3M</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 WAPPY Móvil + Google</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 MCP Único 3.8 Low</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 Empresa Activa</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 Tenshi Voice + HTML</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 Memoria CIE-10</button>
        </div>

        <!-- VIEWPORT DE LAS 10 DIAPOSITIVAS -->
        <div class="slide-viewport" id="slide-viewport">

          <!-- ==================== SLIDE 1: PORTADA CLASE 2 ==================== -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge lime">🚀 Clase 2 Oficial · Martes 27/28 de Octubre</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">DURACIÓN REAL: ~02:04 HRS</span>
            </div>
            <h2>De las Dudas Iniciales al <span class="accent-lime">Dominio Operativo</span> de Antigravity + WAPPY</h2>
            <p class="slide-lead">
              Pasamos de la instalación inicial a resolver bloqueos reales de tokens, leer cualquier formato de archivo con Python, conectar el <strong>Servidor MCP una sola vez</strong>, instalar <strong>WAPPY en el celular</strong> y comandar a <strong>Tenshi por voz</strong>.
            </p>

            <div class="s-grid-4" style="margin-bottom: 16px;">
              <div class="s-card glow-lime">
                <div style="font-size:24px; font-weight:900; color:var(--lime);">Turbo · Low</div>
                <h4>Cero Bloqueos de Cuota</h4>
                <p>Cuándo usar modo <code>low</code> para tareas cotidianas y cuándo reservar <code>high</code> para auditorías.</p>
              </div>
              <div class="s-card glow-teal">
                <div style="font-size:24px; font-weight:900; color:var(--teal-bright);">Python + Flow</div>
                <h4>Archivos e Ingeniería</h4>
                <p>Lectura universal de Excels/PDFs antiguos e informes Antes/Después valorados en $2.5M–$3M COP.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#fcd34d;">1 Sola Vez</div>
                <h4>Conexión MCP + Google</h4>
                <p>Enlace con Gmail, Drive, Calendar y API Key en modelo <code>3.8 (low)</code> respetando Empresa Activa.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#c084fc;">Voz + CIE-10</div>
                <h4>Tenshi &amp; Memoria</h4>
                <p>Delegación móvil por voz, reportes en HTML y validaciones estrictas CIE-10 y NotebookLM.</p>
              </div>
            </div>

            <div class="flow-diagram-box">
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lime); margin-bottom:10px; letter-spacing:0.08em;">
                🗺️ Evolución Práctica Visto en la Sesión (00:02 → 02:03)
              </div>
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">🛡️</div>
                  <div class="f-title">1. Optimizar Cuota</div>
                  <div class="f-sub">Turbo + Low + Python</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">📱</div>
                  <div class="f-title">2. WAPPY Móvil</div>
                  <div class="f-sub">PWA + Google Workspace</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">🔌</div>
                  <div class="f-title">3. MCP Único</div>
                  <div class="f-sub">API Key 3.8 + Empresa Activa</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">🎙️</div>
                  <div class="f-title">4. Tenshi Voice</div>
                  <div class="f-sub">Móvil + Memoria CIE-10</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 2: DIAGNÓSTICO DE TOKENS Y BLOQUEOS ==================== -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge amber">⚠️ Casos Reales de Clase · 00:04 – 00:14 y 01:01</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">PROCESOS VS TOKENS INDIVIDUALES</span>
            </div>
            <h2>Diagnóstico de <span class="accent-lime">Tokens y Bloqueos</span>: Por Qué se Agota la Cuota</h2>
            <p class="slide-lead">
              Analizamos en vivo lo ocurrido a Gloria Amparo Quintero, Carolina Colorado y Alexander García al subir carpetas completas de sistemas de gestión o comparar múltiples Excels pesados de golpe:
            </p>

            <div class="s-grid-2" style="margin-bottom: 12px;">
              <div class="s-card">
                <h4>❌ Error Frecuente: Auditoría Masiva de Golpe</h4>
                <p>
                  • Subir el SG-SST entero de una empresa pidiendo una <em>"auditoría forense completa"</em> obliga al agente a abrir decenas de subcarpetas y agota la cuota en minutos.<br>
                  • Genera advertencias de documentos omitidos o simulados por exceso de contexto.<br>
                  • Las plataformas agénticas consumen cuota por <strong>procesos de razonamiento encadenados</strong>, no solo por palabras sueltas.
                </p>
              </div>
              <div class="s-card glow-lime">
                <h4>✅ Solución Operativa: Trabajo Quirúrgico por Procesos</h4>
                <p>
                  • Dividir el trabajo por <strong>carpetas puntuales o entregables específicos</strong> (ej. solo exámenes médicos de ingreso o matriz de un área).<br>
                  • Mantener la regla <strong>«sin editar nada»</strong> cuando solo se requiere diagnóstico o lectura.<br>
                  • Estructurar primero en Antigravity y almacenar en las matrices nativas de <strong>WAPPY</strong>.
                </p>
              </div>
            </div>

            <div class="token-sim-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:800; color:var(--lime); text-transform:uppercase;">
                  🧪 Simulador Rápido: Compara una orden acotada vs una orden abierta
                </span>
                <span id="token-stats-badge" style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf; font-weight:700;">
                  Palabras: 11 | Tokens estimados: 16
                </span>
              </div>
              <div class="token-input-row">
                <input type="text" id="token-live-input" class="token-input" value="Analiza con Python solo la carpeta examenes_ingreso en modo low sin editar nada" oninput="updateTokenSimulator()">
              </div>
              <div class="token-pills-output" id="token-pills-output"></div>
            </div>
          </div>

          <!-- ==================== SLIDE 3: MODO TURBO + NIVEL LOW VS HIGH ==================== -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge lime">⚡ Optimización de Costos · 00:15 – 00:26 y 01:02</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">CONFIGURACIÓN DEL PENSAMIENTO</span>
            </div>
            <h2>Modo <span class="accent-lime">Turbo</span> + Nivel de Pensamiento <span class="accent-teal">Low vs High</span></h2>
            <p class="slide-lead">
              El sobrepensamiento (<em>overthinking</em>) en tareas sencillas dispara el gasto de cuota. La clave acordada en clase es elegir el nivel según la complejidad real:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🟢 Modo Turbo + Nivel <code>Low</code></h4>
                <p>
                  <strong>Tu modo predeterminado del día a día:</strong> ideal para editar tablas de Excel, conectar claves API/MCP, resumir PDFs, cruzar listados de trabajadores y organizar carpetas con respuesta ultrarrápida.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Ahorro de Cuota Operativa</span><span>85%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:85%"></div></div>
                </div>
              </div>

              <div class="s-card glow-teal">
                <h4>🟣 Nivel <code>High</code> (Razonamiento Profundo)</h4>
                <p>
                  <strong>Solo para misiones pesadas puntuales:</strong> auditorías forenses normativas complejas, investigación de accidentes graves ATEL o diseño de controles de ingeniería especializados.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Profundidad Analítica</span><span>100%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:100%"></div></div>
                </div>
              </div>

              <div class="s-card">
                <h4>💳 Opciones de Capacidad y Planes</h4>
                <p>
                  • Cuentas empresariales anuales gestionadas con proveedor aliado (~<strong>$37.000 a $42.000 COP/año</strong>).<br>
                  • Promo oficial Google (~<strong>$20.000 COP/mes</strong> por los primeros 3 meses frente a planes estándar de $100.000 COP/mes).
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 4: LECTURA UNIVERSAL DE ARCHIVOS CON PYTHON ==================== -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge lime">🐍 Superpoder Técnico sin Programar · 00:08 – 00:23</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CUALQUIER FORMATO + WEB VIGENTE</span>
            </div>
            <h2>Lectura Universal con <span class="accent-lime">Python</span>, Formatos de Salida y <span class="accent-teal">Web Vigente</span></h2>
            <p class="slide-lead">
              Si subes suelto un Excel antiguo (<code>.xls</code>), un archivo muy pesado o un PDF escaneado con imágenes de exámenes médicos, el lector básico puede fallar. Así se resuelve al 100%:
            </p>

            <div class="s-grid-3" style="margin-bottom: 14px;">
              <div class="s-card glow-lime">
                <h4>📂 1. Arrastrar la Carpeta + Python</h4>
                <p>Al arrastrar o referenciar la carpeta completa desde cualquier ruta del PC, Antigravity usa internamente <strong>Python</strong> para abrir y extraer datos de cualquier formato sin discriminación.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>📄 2. Pedir el Formato de Salida</h4>
                <p>Indica siempre cómo quieres recibir el entregable (<strong>HTML, Excel, Word, PDF o PowerPoint</strong>); de lo contrario, el agente puede devolverte bloques de código técnico por defecto.</p>
              </div>
              <div class="s-card">
                <h4>🌐 3. Ordenar Búsqueda Web Legal</h4>
                <p>Instruye explícitamente al agente que <strong>busque en la web</strong> para verificar resoluciones, circulares y decretos SST expedidos después de la fecha de corte del modelo.</p>
              </div>
            </div>

            <div class="flow-diagram-box">
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">🗂️</div>
                  <div class="f-title">Carpeta en tu PC</div>
                  <div class="f-sub">Excels viejos + PDFs médicos</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--lime);">
                  <div class="f-icon">🐍</div>
                  <div class="f-title">Motor Python Interno</div>
                  <div class="f-sub">Lee todo sin que tú programes</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">📊</div>
                  <div class="f-title">Entregable + Norma</div>
                  <div class="f-sub">HTML / Excel con ley vigente</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 5: INFORMES TÉCNICOS DE INGENIERÍA ($2.5M - $3M COP) ==================== -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge amber">💰 Monetización Profesional SST · 00:32 – 00:35 y 01:44</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">CASO REAL MEDELLÍN · TRACTOMULAS</span>
            </div>
            <h2>Informes Técnicos de <span class="accent-lime">Ingeniería de Alto Valor</span> ($2.5M – $3M COP)</h2>
            <p class="slide-lead">
              Caso real implementado en una empresa de transporte en Medellín para mantenimientos sobre tractomulas a más de <strong>1.5 metros de altura</strong>:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🏗️ Fotos Antes / Después con Controles de Ingeniería</h4>
                <p>
                  1. Se entregan las fotografías reales de las tractomulas a Antigravity.<br>
                  2. La IA investiga controles de ingeniería normativos (líneas de vida, plataformas portátiles, barandas certificadas).<br>
                  3. Con <strong>Google Flow</strong> genera las imágenes hiperrealistas del <strong>estado posterior ("Después")</strong> con el control ya instalado.<br>
                  4. Respalda propuestas técnicas comerciales valoradas entre <strong>$2.500.000 y $3.000.000 COP</strong>.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🎬 Micro-Videos de Capacitación (30 a 50 Segundos)</h4>
                <p>
                  • Elaboración automatizada de cápsulas audiovisuales cortas (30–50s) enfocadas en prevención.<br>
                  • Ejemplos mostrados en clase: videos sobre la matriz <strong>IPEVR (GTC 45)</strong> y <strong>Comités de Convivencia Laboral</strong>.<br>
                  • Listos para comercializar como paquetes de inducción y reinducción empresarial.
                </p>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-label"><span>Impacto Visual frente a Gerencia</span><span>99%</span></div>
                  <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:99%"></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 6: WAPPY EN CELULAR (PWA) + GOOGLE WORKSPACE ==================== -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge lime">📱 Movilidad Total · 00:35 – 00:49</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">APP MÓVIL + CUENTAS GOOGLE</span>
            </div>
            <h2><span class="accent-lime">WAPPY en tu Celular</span> + Integración con <span class="accent-teal">Google Workspace</span></h2>
            <p class="slide-lead">
              Siguiendo la consulta práctica de Xiomara Ardila y Carolina Colorado, dejamos WAPPY instalado en el teléfono y conectado con todas tus herramientas de Google:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>📲 1. Instalar WAPPY en Pantalla de Inicio</h4>
                <p>
                  • Abre <code>wappy.club</code> desde el navegador de tu celular (<strong>Chrome en Android</strong> o <strong>Safari en iPhone</strong>).<br>
                  • Entra al menú de <strong>Configuración General</strong> de tu usuario.<br>
                  • Selecciona <strong>Descargar Aplicación / Añadir a la pantalla de inicio</strong> para abrir WAPPY como app nativa en planta o en calle.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🔗 2. Enlazar Google Workspace en Editar Cuenta</h4>
                <p>
                  • Dentro de WAPPY → <strong>Editar Cuenta / Integraciones</strong>, autoriza con un clic:<br>
                  &nbsp;&nbsp;✓ <strong>Gmail</strong> (envío y lectura de reportes)<br>
                  &nbsp;&nbsp;✓ <strong>Google Drive</strong> &amp; <strong>Google Calendar</strong><br>
                  &nbsp;&nbsp;✓ <strong>Google Docs</strong> &amp; <strong>Google Sheets</strong><br>
                  • Permite parametrizar correos individuales según las empresas administradas.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 7: CONEXIÓN MCP DE ÚNICA VEZ + GEMINI 3.8 LOW ==================== -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔌 Sincronización Definitiva · 00:27, 00:54 y 01:04 – 01:15</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">UNA SOLA VEZ EN TODO TU PC</span>
            </div>
            <h2>Conexión <span class="accent-lime">MCP de Única Vez</span> + Clave API en <span class="accent-teal">Modelo 3.8 (Low)</span></h2>
            <p class="slide-lead">
              Ninguna IA aislada resuelve todo: el protocolo MCP e interfaces API permiten conectar plataformas empresariales (como Siigo Cloud, Bancolombia, Aleluya, Arus o Enlace Operativo) directamente con tu flujo de trabajo.
            </p>

            <div class="s-grid-3">
              <div class="s-card">
                <h4>1️⃣ Generar API Key en WAPPY</h4>
                <p>Entra al apartado de <strong>Integraciones de WAPPY</strong>, genera tu clave API personal y copia el comando de vinculación MCP.</p>
              </div>
              <div class="s-card glow-lime">
                <h4>2️⃣ Pegar usando Modelo <code>3.8 (Low)</code></h4>
                <p>Pégalo en el chat de Antigravity seleccionando el modelo <strong>3.8 en nivel bajo (<code>low</code>)</strong> para conectar en segundos sin gastar procesos de más.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>3️⃣ ¡No se Repite por Proyecto!</h4>
                <p>Aclaración clave a Gloria y Carolina: <strong>la conexión del servidor MCP se hace una única vez</strong> y queda activa globalmente para todo tu Antigravity.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 8: ALIMENTACIÓN MASIVA Y REGLA DE EMPRESA ACTIVA ==================== -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge amber">🏢 Consenso Operativo Crítico · 01:09 – 01:27</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">CERO CRUCE ENTRE CLIENTES</span>
            </div>
            <h2>Carga Masiva de Trabajadores y la Regla de Oro de <span class="accent-lime">Empresa Activa</span></h2>
            <p class="slide-lead">
              ¿Cómo subir bases de datos completas de trabajadores desde carpetas locales hacia WAPPY sin mezclar la información cuando asesoras a varias empresas?
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-teal">
                <h4>👥 Alimentación Sociodemográfica Automatizada</h4>
                <p>
                  • Arrastras o referencias en Antigravity la carpeta local con listados de personal, fichas o exámenes.<br>
                  • Antigravity actualiza registros existentes o <strong>crea nuevos trabajadores automáticamente</strong> en WAPPY.<br>
                  • Completa perfiles sociodemográficos y condiciones de salud con trazabilidad total y cero digitación manual.
                </p>
              </div>

              <div class="s-card glow-lime">
                <h4>🎯 Regla de Oro: Seleccionar la Empresa Activa</h4>
                <p>
                  • Aunque tu llave MCP tiene permiso sobre toda tu cuenta de usuario, <strong>la IA procesa de forma predeterminada la empresa que tengas ACTIVA en WAPPY</strong>.<br>
                  • <strong>Protocolo obligatorio antes de cargar datos:</strong> entra a WAPPY, verifica y activa manualmente la empresa exacta con la que vas a trabajar para evitar cruces de datos.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 9: TENSHI VOICE EN MÓVIL + HTML VS WORD + OCULTAR CÓDIGO ==================== -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge lime">🎙️ El Fin de Escribir Manualmente · 01:28 – 01:54</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">VOZ MÓVIL + CALIDAD VISUAL HTML</span>
            </div>
            <h2><span class="accent-lime">Tenshi Voice</span> desde el Celular, Informes <span class="accent-teal">HTML</span> e Interfaz Limpia</h2>
            <p class="slide-lead">
              El tercer paso de la conexión activa a <strong>Tenshi por voz</strong> para delegar tareas complejas hacia Antigravity desde tu teléfono móvil sin depender de un escritorio:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🎙️ 1. Comandos de Voz en Calle</h4>
                <p>Hablas con Tenshi desde el celular durante una visita o recorrido; Tenshi consulta tu Calendar, revisa pendientes o envía la orden directa a Antigravity.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🎨 2. Exportar en HTML vs Word</h4>
                <p>Pide tus informes ejecutivos en <strong>HTML</strong>: ofrece diseño visual premium muy superior al Word plano y se integra perfecto con <strong>Canva</strong> y <strong>NotebookLM</strong>.</p>
              </div>
              <div class="s-card">
                <h4>👁️ 3. Ocultar Panel de Código</h4>
                <p>¿Ves cuadros extensos de código interno en Antigravity? Simplemente <strong>oculta ese panel lateral</strong> y quédate únicamente con la vista limpia de tu conversación.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 10: MEMORIA PROCEDURAL (CIE-10) Y TAREA CARPETA CURSO WAPPY ==================== -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge amber">🧠 Nivel Avanzado + Tarea Clase 3 · 01:55 – 02:03</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">AUTOMATIZACIONES + RETO PRÁCTICO</span>
            </div>
            <h2>Centro de Automatizaciones, <span class="accent-lime">Memoria Procedural</span> y Reto <span class="accent-teal">«Curso Wappy»</span></h2>
            <p class="slide-lead">
              Cerramos la Clase 2 descubriendo cómo Tenshi recuerda reglas médicas/legales estrictas y preparando nuestra lluvia de ideas personalizada por profesión:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>⚙️ Automatización + Memoria Procedural (CIE-10)</h4>
                <p>
                  • <strong>Centro de Automatizaciones:</strong> programa revisión periódica de actas del <strong>COPASST</strong>, envío de informes por correo y creación automática de pendientes en el Centro de Control (ej. exámenes médicos anuales al registrar un trabajador).<br>
                  • <strong>Memoria Procedural:</strong> fija reglas inquebrantables como validar códigos <strong>CIE-10</strong> en medicina laboral o consultar guías de riesgo psicosocial en <strong>NotebookLM</strong> antes de responder.
                </p>
              </div>
              <div class="s-card glow-teal" style="display:flex; flex-direction:column; justify-content:center;">
                <h4>🚀 Tarea Oficial para la Siguiente Sesión</h4>
                <p style="margin-bottom:12px;">
                  1. Crea en tu PC una carpeta llamada <code>Curso Wappy</code> y abre un chat nuevo.<br>
                  2. Haz una <strong>lluvia de ideas con Tenshi</strong> aplicada a tu rol (auditoría, minería, asesoría independiente) integrando <strong>Antigravity + Google Flow + WAPPY + Tenshi</strong>.
                </p>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <a href="#prompts-chat" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
                    Copiar los 5 Prompts de Clase 2 ↓
                  </a>
                </div>
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
            <a href="#grabacion" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              🎥 Ver Grabación Clase 2
            </a>
            <a href="#prompts-chat" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              💬 Ver Prompts Clase 2
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       3B. REPRODUCTOR DE LA GRABACIÓN OFICIAL CLASE 2 + POPUP DE NOTAS Y MEMORIAS
       ======================================================================== -->
  <section class="recording-section" id="grabacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">🎥 Repetición Oficial Completa · Clase 2 (27/28 de Octubre)</span>
          <h2 class="sec-big-title">Grabación de la Clase 2 &amp; Memorias Oficiales</h2>
        </div>
        <div style="font-size: 13px; color: var(--ink-muted); font-weight: 600;">
          💡 Reproduce aquí mismo la clase completa o abre debajo el <strong>Popup de Notas Oficiales</strong>
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
            <span>WAPPY.CLUB // GRABACIÓN_OFICIAL // CLASE_02_MCP_TENSHI</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge">DURACIÓN: ~02:04 HRS · HD</span>
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
          <span class="rec-chapter-pill"><strong>00:04</strong> Auditoría y Tokens</span>
          <span class="rec-chapter-pill"><strong>00:11</strong> Lectura con Python</span>
          <span class="rec-chapter-pill"><strong>00:15</strong> Modo Turbo y Low</span>
          <span class="rec-chapter-pill"><strong>00:32</strong> Informes Ingeniería $3M</span>
          <span class="rec-chapter-pill"><strong>00:39</strong> WAPPY en Móvil</span>
          <span class="rec-chapter-pill"><strong>00:43</strong> Google Workspace</span>
          <span class="rec-chapter-pill"><strong>01:05</strong> Servidor MCP Único</span>
          <span class="rec-chapter-pill"><strong>01:25</strong> Empresa Activa</span>
          <span class="rec-chapter-pill"><strong>01:28</strong> Tenshi Voice Móvil</span>
          <span class="rec-chapter-pill"><strong>01:55</strong> Memoria Procedural CIE-10</span>
        </div>

        <!-- Reproductor Embebido 16:9 de Google Drive con Miniatura Oficial -->
        <div class="video-viewport-wrap">
          <div class="video-aspect-box">
            <!-- Miniatura Oficial Personalizada HD 16:9 (Fondo Cinemático + Félix + WAPPY + Tenshi + CLASE 2) -->
            <div class="video-thumb-cover" id="video-thumb-cover" onclick="playRecordingVideo()">
              <img src="{thumb_bg}" alt="" class="video-thumb-bg-img" aria-hidden="true">
              <div class="video-thumb-radial-overlay"></div>
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{felix_avatar}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Logos WAPPY + Antigravity + CLASE 2 + Píldoras + Botón Play -->
              <div class="thumb-center-col">
                <div class="thumb-logos-pill">
                  <img src="{wappy_horiz_logo}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{agy_logo}" alt="Google Antigravity" class="agy-i">
                </div>

                <div class="thumb-clase-giant">CLASE 2</div>

                <div class="thumb-sub-title">
                  Optimización de Tokens, <span>MCP Único</span> &amp; <span>Tenshi Voice</span>
                </div>

                <div class="thumb-topic-pills">
                  <span class="thumb-topic-pill">⚡ MODO TURBO · LOW</span>
                  <span class="thumb-topic-pill">🐍 LECTURA PYTHON</span>
                  <span class="thumb-topic-pill">🎙️ TENSHI VOICE MÓVIL</span>
                  <span class="thumb-topic-pill highlight">⏱️ 02:04 HRS · HD</span>
                </div>

                <div class="thumb-play-cta">
                  <span class="thumb-play-icon">▶</span>
                  <span>VER GRABACIÓN COMPLETA CLASE 2</span>
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
              src="https://drive.google.com/file/d/1PhDT7YMtg6wUn-sh9oc0mhJZKON73uNj/preview"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowfullscreen
              loading="lazy"
              title="Grabación Oficial Clase 2 - Optimización de Tokens, MCP Único y Tenshi Voice">
            </iframe>
          </div>
        </div>

        <!-- BARRA DEBAJO DEL VIDEO CON EL BOTÓN PARA ABRIR EL POPUP DE NOTAS -->
        <div class="notes-trigger-bar">
          <div class="notes-trigger-info">
            <h3>📝 Bitácora, Resumen Ejecutivo, 10 Compromisos y Minuto a Minuto de la Clase 2</h3>
            <p>Consulta las notas oficiales completas de la sesión (27/28 de Octubre), las 10 tareas acordadas por el grupo y los 19 bloques cronológicos (00:02 – 02:03).</p>
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
            <span>🔗 Accesos directos a los registros oficiales de la Clase 2 en Google Docs y Google Drive:</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <a href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?tab=t.o2f1ilte0q65" target="_blank" rel="noopener noreferrer" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              📑 Documento de Notas
            </a>
            <a href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank" rel="noopener noreferrer" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              📄 Ver Transcripción Completa
            </a>
            <a href="https://drive.google.com/file/d/1PhDT7YMtg6wUn-sh9oc0mhJZKON73uNj/view" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              ▶️ Abrir Video en Google Drive ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       MODAL / POPUP INTERACTIVO CON TODAS LAS NOTAS OFICIALES DE LA CLASE 2 (OCT 27/28, 2026)
       ======================================================================== -->
  <div class="notes-modal-backdrop" id="notes-modal" onclick="handleBackdropClick(event)">
    <div class="notes-modal-window" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
      <div class="notes-modal-header">
        <div class="notes-modal-title-wrap">
          <h3 id="notes-modal-title">📝 Notas Oficiales y Memorias · Clase II: WAPPY IA + Antigravity (MCP &amp; Tenshi)</h3>
          <p>Fecha: Martes 27/28 de Octubre de 2026 · Docente: Ing. Félix Bedoya · Duración: ~02:04 HRS · Registros Oficiales</p>
        </div>
        <button type="button" class="btn-close-modal" onclick="closeNotesModal()">✕ Cerrar Ventana</button>
      </div>

      <!-- Barra de Pestañas del Popup -->
      <div class="notes-tabs-bar">
        <div class="notes-tab-group">
          <button type="button" class="notes-tab-btn active" id="ntab-all" onclick="switchNotesTab('all')">🌟 Ver Todo</button>
          <button type="button" class="notes-tab-btn" id="ntab-resumen" onclick="switchNotesTab('resumen')">📌 Resumen Ejecutivo</button>
          <button type="button" class="notes-tab-btn" id="ntab-pasos" onclick="switchNotesTab('pasos')">✅ Próximos Pasos (10 Tareas)</button>
          <button type="button" class="notes-tab-btn" id="ntab-detalles" onclick="switchNotesTab('detalles')">⏱️ Minuto a Minuto (00:02 – 02:03)</button>
        </div>
      </div>

      <!-- Cuerpo Scrolleable del Popup -->
      <div class="notes-modal-body">

        <!-- Enlaces Oficiales Adjuntos -->
        <div class="n-links-strip">
          <div style="font-size:12.5px; font-weight:800; color:#5eead4;">
            📎 Archivos Adjuntos y Registros Oficiales de la Reunión:
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="https://calendar.google.com/calendar/event?eid=NWExOHRia2tnc3RvMGV2ZHNlZzViYzJobnEgZ3J1cG93YXBweUBt" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📅 Evento Calendar</a>
            <a href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?tab=t.o2f1ilte0q65" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📑 Documento de Notas</a>
            <a href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📄 Transcripción Oficial</a>
            <a href="https://drive.google.com/file/d/1PhDT7YMtg6wUn-sh9oc0mhJZKON73uNj/view?usp=drive_web" target="_blank" rel="noopener noreferrer" class="n-doc-btn">🎥 Grabación en Drive</a>
          </div>
        </div>

        <!-- SECCIÓN 1: RESUMEN EJECUTIVO -->
        <div class="notes-pane active" data-npane="resumen">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            📌 1. Resumen Ejecutivo de la Sesión
          </div>
          <div class="s-grid-2">
            <div class="s-card glow-lime n-section-card">
              <h4>⚡ Optimización y Uso de Tokens</h4>
              <p>Configurar los modelos en modo <strong>Turbo</strong> y en nivel bajo (<code>low</code>) para tareas cotidianas y edición de archivos con el fin de reducir el sobrepensamiento, evitar bloqueos de cuota y reservar <code>high</code> exclusivamente para auditorías profundas, apoyándose en lectura universal de carpetas con Python.</p>
            </div>
            <div class="s-card glow-teal n-section-card">
              <h4>🔌 Integración con WAPPY, MCP Único y Empresa Activa</h4>
              <p>Instalación de <code>wappy.club</code> en dispositivos móviles, enlace con cuentas de Google (Gmail, Drive, Calendar, Docs y Sheets), vinculación del servidor MCP <strong>una única vez</strong> con clave API en modelo <code>3.8 (low)</code> y selección manual obligatoria de la <strong>Empresa Activa</strong> para alimentar trabajadores sin cruces.</p>
            </div>
            <div class="s-card n-section-card">
              <h4>🏗️ Ingeniería de Alto Valor ($2.5M–$3M), HTML y Flow</h4>
              <p>Caso real de controles de ingeniería en tractomulas (&gt;1.5m) generando imágenes Antes/Después con Google Flow, micro-videos preventivos de 30–50s (IPEVR GTC 45 y convivencia) y preferencia por informes en <strong>HTML</strong> frente a Word por su impacto visual e integración con Canva y NotebookLM.</p>
            </div>
            <div class="s-card n-section-card">
              <h4>🎙️ Tenshi Voice, Memoria Procedural y Planificación</h4>
              <p>Operación por comandos de voz desde el celular con Tenshi, automatización de actas COPASST y exámenes periódicos, reglas de <strong>Memoria Procedural</strong> (validación CIE-10 y guías psicosociales en NotebookLM) y acuerdo de crear la carpeta <code>Curso Wappy</code> para lluvia de ideas por profesión.</p>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: PRÓXIMOS PASOS Y TAREAS (10 COMPROMISOS OFICIALES) -->
        <div class="notes-pane active" data-npane="pasos">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ✅ 2. Próximos Pasos y Compromisos de la Clase 2 (10 Tareas Oficiales)
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya</span>
            <div><strong>1. Compartir contacto plan anual:</strong> Proporcionar los datos de contacto para la adquisición del plan anual de Antigravity a los estudiantes interesados en ampliar su capacidad de procesamiento tras finalizar la sesión.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya</span>
            <div><strong>2. Revisar consumo de tokens:</strong> Investigar las causas del alto consumo de tokens reportado por Carolina Colorado durante la edición de sus archivos de Excel y analizar el procedimiento seguido en la configuración del modelo.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>3. Conectar Gmail a WAPPY:</strong> Conectar el correo electrónico de Gmail (y Google Workspace) a la empresa activa en WAPPY para garantizar la sincronización directa de los sistemas de gestión.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>4. Integrar Antigravity con WAPPY (MCP):</strong> Realizar la integración entre WAPPY y Antigravity siguiendo los pasos de configuración del servidor MCP (única vez), incluyendo la generación de la clave API y la prueba de conexión.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>5. Activar voz de Tenshi:</strong> Ejecutar el tercer paso de la configuración para activar la voz de Tenshi mediante el comando específico enviado al chat de Antigravity.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya &amp; Carolina Colorado</span>
            <div><strong>6. Verificar conexión de correos multi-empresa:</strong> Verificar la conexión y parametrización de los correos electrónicos individuales para cada empresa administrada en WAPPY durante sesión de soporte técnico.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya</span>
            <div><strong>7. Asistir con parametrización individual:</strong> Proporcionar soporte técnico y asistencia personalizada para parametrizar las conexiones en WAPPY a cada miembro del equipo.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Gloria Amparo Quintero Giraldo</span>
            <div><strong>8. Revisar estados de conexiones:</strong> Revisar los estados de las conexiones de Antigravity y solucionar posibles errores de configuración en los informes generados.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya</span>
            <div><strong>9. Activar correos Antigravity:</strong> Habilitar cuentas de correo electrónico para que los estudiantes accedan y trabajen en Antigravity con continuidad antes de la próxima sesión.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>10. Crear proyecto «Curso Wappy» y lluvia de ideas:</strong> Crear una carpeta denominada <code>Curso Wappy</code> y un nuevo chat solicitando sugerencias de automatización por profesión con Tenshi para presentar en la siguiente reunión.</div>
          </div>
        </div>

        <!-- SECCIÓN 3: DETALLES MINUTO A MINUTO CON MARCAS DE TIEMPO OFICIALES -->
        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ⏱️ 3. Bitácora Detallada Minuto a Minuto (00:02:48 – 02:03:19)
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>1. Dificultades iniciales y consumo de tokens en Antigravity</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:02:48</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:04:29</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:07:23</a>
              </span>
            </h4>
            <p>Félix Bedoya inicia la sesión resolviendo dudas prácticas sobre Antigravity. Gloria Amparo Quintero Giraldo expone que al subir la carpeta completa de un sistema de gestión empresarial y pedir una auditoría forense sin editar, el sistema se bloqueó por agotamiento de tokens y emitió advertencias de documentos omitidos o simulados. Félix explica que el bloqueo ocurrió por procesar de golpe una cantidad masiva de archivos y subcarpetas en una sola tarea pesada.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>2. Carga de archivos externos y lectura universal con Python</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:05:43</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:08:40</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:10:42</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:11:57</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:14:05</a>
              </span>
            </h4>
            <p>Gloria Amparo consulta cómo resumir múltiples PDFs y exámenes médicos de ingreso. Félix aclara que pueden incorporarse documentos desde cualquier ubicación del PC, advirtiendo que formatos antiguos de Excel, archivos muy pesados o PDFs con imágenes incrustadas fallan en lectura directa; en cambio, al arrastrar la carpeta completa, herramientas internas como <strong>Python</strong> leen cualquier formato sin discriminación. Carolina Colorado comparte también el consumo total de tokens al comparar un Excel original y su versión modificada.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>3. Configuración de modelos (Modo Turbo / Low), formatos de salida y búsqueda web</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:15:13</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:17:13</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:20:22</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:23:46</a>
              </span>
            </h4>
            <p>Félix recomienda activar el modo <strong>Turbo</strong> y el nivel bajo (<code>low</code>) para tareas básicas con el fin de evitar el sobrepensamiento. Menciona cuentas empresariales anuales de ~$37.000 COP/año o promociones de Google de $20.000 COP/mes por tres meses. Además, enfatiza indicar siempre el formato de salida requerido (Word, PDF, Excel, PowerPoint o HTML) para que no entregue código por defecto, e instruir búsqueda en la web para consultar normatividad vigente posterior a la fecha de corte del modelo.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>4. Experiencias prácticas de los participantes con Antigravity</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:24:48</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:26:13</a>
              </span>
            </h4>
            <p>Xiomara Ardila comenta sus compromisos laborales en un nuevo convenio con gobernación y fundación (exámenes de ingreso y afiliaciones). Juvenal Nicolás Arrieta Rodríguez y Alexander García relatan sus primeras pruebas; Alexander probó un PDF pero agotó tokens por configuración inicial alta. Félix reitera las alternativas de membresía anual para auditorías intensivas.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>5. Conectividad externa mediante APIs y protocolo MCP</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:27:20</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:31:08</a>
              </span>
            </h4>
            <p>Ninguna IA aislada resuelve todas las necesidades empresariales: mediante APIs y MCP se integran sistemas externos, como el caso real de Félix conectando Siigo Cloud para procesar facturación por voz desde el celular. Asimismo, explica que el análisis de condiciones de salud planteado por Gloria se estructura con máxima eficiencia alimentando WAPPY desde Antigravity.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>6. Imágenes Antes/Después y videos para informes técnicos de ingeniería ($2.5M–$3M COP)</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:32:08</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:33:32</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:34:27</a>
              </span>
            </h4>
            <p>Félix presenta un caso real para una empresa de transporte en Medellín usando fotografías de tractomulas para que Antigravity investigara controles de ingeniería en mantenimientos sobre 1.5 metros de altura y generara imágenes del estado posterior con los controles aplicados, respaldando informes técnicos valorados entre <strong>$2.500.000 y $3.000.000 COP</strong>, además de videos cortos de capacitación de 30 a 50 segundos.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>7. Acceso e instalación de WAPPY en dispositivos móviles</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:35:52</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:37:10</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:39:29</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:42:20</a>
              </span>
            </h4>
            <p>Guía de ingreso a <code>wappy.club</code>. Ante la consulta de Xiomara Ardila sobre cómo usar WAPPY en el celular, Félix enseña a abrir el sitio en Chrome o Safari móvil, ir a configuración general del usuario y elegir descargar aplicación o <strong>añadir a la pantalla de inicio</strong>. Juvenal Nicolás Arrieta resuelve en vivo su acceso desde el computador.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>8. Integración de cuentas de Google Workspace dentro de WAPPY</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:43:43</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:47:10</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:48:14</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:49:19</a>
              </span>
            </h4>
            <p>Procedimiento en vivo desde Editar Cuenta para enlazar Gmail, Google Drive, Google Calendar, Docs y Sheets. Carolina Colorado consulta sobre la gestión de varias empresas bajo un mismo correo y se acuerda revisar la parametrización individual por empresa.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>9. Demostración de Tenshi y generación de clave API en modelo 3.8 (Low)</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:50:04</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:54:24</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">00:56:39</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:01:06</a>
              </span>
            </h4>
            <p>Demostración de Tenshi consultando eventos en Google Calendar y pendientes del Centro de Control. Explicación paso a paso para generar la clave API en las integraciones de WAPPY y pegarla en Antigravity usando el modelo <strong>3.8 en nivel bajo (<code>low</code>)</strong>, aclarando que el consumo en agentes se mide por procesos ejecutados.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>10. Acuerdo sobre niveles de pensamiento Low vs High en Antigravity</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:02:05</a>
              </span>
            </h4>
            <p>Se establece como regla práctica usar modo bajo (<code>low</code>) en tareas cotidianas y edición rápida de archivos, reservando nivel alto (<code>high</code>) para auditorías complejas, adelantando el uso de reglas específicas mediante agentes y <em>skills</em>.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>11. Conexión del servidor MCP de única vez para todo Antigravity</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:04:01</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:05:04</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:07:17</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:15:55</a>
              </span>
            </h4>
            <p>Ejemplos de conectores corporativos (Bancolombia, Siigo, Aleluya, Arus, Enlace Operativo) y práctica guiada en vivo. Ante la duda de Gloria y Carolina, Félix confirma que <strong>la sincronización del servidor MCP se realiza una única vez para todo Antigravity</strong>, verificando la conexión exitosa con WAPPY.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>12. Alimentación masiva de trabajadores desde carpetas locales hacia WAPPY</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:09:13</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:10:56</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:12:23</a>
              </span>
            </h4>
            <p>Demostración de cómo arrastrar o referenciar una carpeta local con bases de datos de personal permite que Antigravity actualice registros existentes o cree nuevos trabajadores automáticamente en WAPPY para completar el perfil sociodemográfico con trazabilidad completa.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>13. Gestión de agotamiento de cuota y alternativas de cuentas anuales</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:19:32</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:20:40</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:21:53</a>
              </span>
            </h4>
            <p>Ante el agotamiento imprevisto de tokens de Carolina Colorado durante la práctica, Félix ofrece habilitar correos alternativos y explica los planes anuales económicos ($37.000–$42.000 COP) frente a planes mensuales individuales de $100.000 COP.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>14. Alcance del MCP y selección obligatoria de la Empresa Activa en WAPPY</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:24:57</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:25:59</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:27:14</a>
              </span>
            </h4>
            <p>Gloria Amparo pregunta si Antigravity toma datos de todas las empresas registradas o solo de una. Félix aclara que aunque el servidor MCP tiene permisos sobre todo el usuario, procesa de forma predeterminada la <strong>empresa activa en WAPPY</strong>, recomendándose activar manualmente la empresa exacta antes de alimentar datos.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>15. Automatización y comandos de voz desde el celular con Tenshi</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:28:13</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:32:21</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:35:20</a>
              </span>
            </h4>
            <p>Félix Bedoya y Mauricio Posada presentan a Tenshi como asistente operado por voz desde el celular para interactuar con Antigravity sin escribir manualmente, realizando una demostración en vivo de delegación por voz sin depender de un computador de escritorio.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>16. Informes visuales en HTML vs Word y generación multimedia con Google Flow</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:37:18</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:42:17</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:44:03</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:46:45</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:49:03</a>
              </span>
            </h4>
            <p>Ante la consulta de Carolina sobre formatos de entrega, Félix destaca exportar en <strong>HTML</strong> por su calidad visual frente a Word y su integración con Canva y NotebookLM. Junto a Mauricio Posada muestran el uso de Google Flow para imágenes y videos SST (matriz IPEVR GTC 45 y comités de convivencia) como productos comerciales de capacitación.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>17. Cómo ocultar el panel lateral de código interno en Antigravity</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:51:55</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:52:59</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:54:51</a>
              </span>
            </h4>
            <p>Gloria Amparo consulta por los bloques extensos de código técnico que aparecen en Antigravity; Félix aclara que son instrucciones internas generadas por la plataforma y aconseja ocultar ese panel lateral para operar cómodamente sin distracciones.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>18. Centro de Automatizaciones y Memoria Procedural (CIE-10 y NotebookLM)</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:55:58</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:57:58</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">01:59:58</a>
              </span>
            </h4>
            <p>Explicación del Centro de Automatización de Tenshi para programar revisión de actas del COPASST, envío de informes por correo y creación automática de pendientes de exámenes médicos periódicos anuales. Presentación de la <strong>Memoria Procedural</strong> para fijar validaciones obligatorias como verificar códigos <strong>CIE-10</strong> en medicina laboral o consultar guías de riesgo psicosocial en NotebookLM antes de responder.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>19. Tarea carpeta «Curso Wappy», lluvia de ideas profesional y cierre</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">02:01:10</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">02:02:15</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1jmB08B__3Tpv8IeU1pBSci6-RHOsaQh1wVH1VfZus48/edit?usp=drive_web&tab=t.t31n84ozfvdg" target="_blank">02:03:19</a>
              </span>
            </h4>
            <p>Félix propone crear la carpeta de proyecto <code>Curso Wappy</code> con un nuevo chat para realizar una lluvia de ideas según la profesión de cada participante (auditoría, minería, asesoría independiente) integrando Antigravity, Google Flow, WAPPY y Tenshi, cerrando la sesión con el compromiso de habilitar cuentas y soporte mediante capturas de pantalla.</p>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ========================================================================
       4. SECCIÓN ESTRELLA: LOS 5 PROMPTS REALES DE CLASE 2 (COPIAR Y PEGAR)
       ======================================================================== -->
  <section class="prompts-section" id="prompts-chat">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">💬 Práctica Oficial Clase 2 · Copiar y Pegar</span>
          <h2 class="sec-big-title">5 Prompts Estratégicos Vistos en la Clase 2</h2>
        </div>
      </div>

      <!-- Banner Explicativo Cero Bloqueos -->
      <div class="zero-code-banner">
        <div>
          <h3>⚡ Trabaja en Modo Turbo / Low, Oculta el Panel de Código y Cuida tu Cuota</h3>
          <p>
            Antes de pegar estos prompts en Antigravity, recuerda las 3 reglas de oro acordadas en la Clase 2: selecciona <strong>Modo Turbo + Nivel <code>Low</code></strong> para tareas operativas, verifica cuál es tu <strong>Empresa Activa</strong> dentro de WAPPY y oculta el panel lateral de código para trabajar enfocado en tus entregables visuales:
          </p>
        </div>
        <div class="zero-code-compare">
          <div style="color:#fca5a5; font-weight:800; margin-bottom:6px;">❌ Antes (Agotaba Tokens):</div>
          <div style="color:#cbd5e1; margin-bottom:10px; font-size:12px;">Subir todo el SG-SST en modo High sin formato de salida definido.</div>
          <div style="color:var(--lime); font-weight:800; margin-bottom:6px;">✅ Método Clase 2 (Óptimo):</div>
          <div style="color:#ffffff; font-size:12px;">Carpeta puntual + lectura con <strong>Python en modo Low</strong> + salida en <strong>HTML/Excel</strong>.</div>
        </div>
      </div>

      <!-- Grid de los 5 Prompts Conversacionales de Clase 2 -->
      <div class="prompt-cards-grid">

        <!-- PROMPT 1: LECTURA CON PYTHON EN MODO LOW + SALIDA HTML/EXCEL + WEB -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 1 · Python + Modo Low</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Cero Bloqueo de Cuota</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">1. Leer Carpeta con Excels Antiguos y PDFs Escaneados usando Python + Búsqueda Web</h3>
            <p class="p-card-explain">
              Úsalo en modo <code>Low</code> arrastrando una carpeta puntual (ej. exámenes médicos de ingreso o matrices en <code>.xls</code>) para que Python extraiga todo sin agotar tokens y te entregue un HTML visual o Excel limpio.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity (Modo Low):</div>
              <div class="chat-prompt-text" id="prompt-1">Trabaja de forma optimizada y SIN EDITAR NADA de mis archivos originales. Usa tus herramientas internas de Python para leer todos los archivos dentro de la carpeta que te acabo de referenciar (incluyendo formatos antiguos de Excel, tablas pesadas y PDFs de exámenes médicos o soportes escaneados).

Realiza exactamente estos 3 pasos:
1. Extrae y consolida los datos reales sin omitir ni simular ningún registro.
2. Busca en la web la normatividad colombiana de SST vigente a la fecha de hoy aplicable a estos hallazgos o evaluaciones médicas para asegurar que no cites normas derogadas.
3. Entrégame el resultado final en un informe visual ejecutivo en formato HTML listo para presentar a gerencia (y genera también una tabla resumen en Excel), sin mostrarme bloques de código en la respuesta.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Lee cualquier formato con Python y exporta en HTML + Excel.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-1', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 2: INFORME TÉCNICO DE CONTROLES DE INGENIERÍA ANTES/DESPUÉS ($2.5M-$3M) -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 2 · Ingeniería $2.5M–$3M</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Antes/Después + Micro-Video</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">2. Informe Técnico de Controles de Ingeniería con Fotos Antes/Después y Guion de 40s</h3>
            <p class="p-card-explain">
              Inspirado en el caso real de tractomulas en Medellín (&gt;1.5m de altura): analiza fotos de riesgo crítico, diseña controles de ingeniería reales, prepara el estado "Después" para Google Flow y redacta una cápsula de 40 segundos.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity / WAPPY:</div>
              <div class="chat-prompt-text" id="prompt-2">Analiza las fotografías operativas que puse en esta carpeta (trabajos en alturas superiores a 1.5 metros / operación crítica en planta o vehículos pesados) e investiga en la web soluciones reales de controles de ingeniería certificados según la Resolución 4272 de 2021, Decreto 1072 de 2015 y jerarquía de controles GTC 45.

Estructúrame un entregable técnico de alto valor comercial en formato HTML ejecutivo que incluya:
1. Diagnóstico fotográfico del estado actual ("Antes") y valoración del riesgo.
2. Propuesta detallada de Controles de Ingeniería específicos (plataformas, líneas de vida, guardas o sistemas colectivos) con especificaciones técnicas.
3. Los prompts visuales exactos para generar en Google Flow las imágenes hiperrealistas del estado posterior ("Después") sobre mis mismas fotografías.
4. Guion técnico escena por escena para un micro-video de capacitación de 40 segundos dirigido a los trabajadores.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Informe de ingeniería comercial + prompts Antes/Después Flow.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-2', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 3: CONEXIÓN MCP ÚNICA EN GEMINI 3.8 LOW + EMPRESA ACTIVA + TRABAJADORES -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 3 · MCP Único + Empresa Activa</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Modelo 3.8 (Low)</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">3. Vincular Servidor MCP (Única Vez) y Cargar Trabajadores a la Empresa Activa</h3>
            <p class="p-card-explain">
              Pégalo usando el modelo <code>3.8</code> en nivel <code>Low</code>. Conecta tu clave API una sola vez para todo Antigravity, verifica primero cuál es la <strong>Empresa Activa</strong> en WAPPY y sube perfiles sociodemográficos sin cruces.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity (Modelo 3.8 Low):</div>
              <div class="chat-prompt-text" id="prompt-3">Configura de forma global y por única vez en mi Antigravity la conexión al servidor MCP de WAPPY usando mi clave API personal: [PEGA AQUÍ TU API KEY DE WAPPY].

Una vez conectado, sigue estrictamente este protocolo de seguridad antes de cargar información:
1. Consulta en WAPPY y confírmame en pantalla el nombre y NIT de la EMPRESA ACTIVA actualmente seleccionada para garantizar que no crucemos datos con otros clientes.
2. Lee con Python la base de datos y soportes de mi carpeta local de trabajadores, y alimenta o actualiza automáticamente sus registros y perfil sociodemográfico dentro de esa Empresa Activa en WAPPY.
3. Crea en el Centro de Control / Cronograma de WAPPY el recordatorio anual de seguimiento de exámenes médicos periódicos para los trabajadores registrados.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: MCP global listo + carga sociodemográfica segura.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-3', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 4: REGLA DE MEMORIA PROCEDURAL CIE-10 + PSICOSOCIAL EN NOTEBOOKLM -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 4 · Memoria Procedural</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">CIE-10 + NotebookLM + COPASST</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">4. Configurar Memoria Procedural Estricta (CIE-10, Riesgo Psicosocial y Automatizaciones)</h3>
            <p class="p-card-explain">
              Establece las validaciones obligatorias que explicó Félix Bedoya al cierre de la clase para que Tenshi y tu agente nunca emitan diagnósticos ni recomendaciones sin validar CIE-10 y NotebookLM.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en Tenshi (WAPPY) o en Antigravity:</div>
              <div class="chat-prompt-text" id="prompt-4">Guarda en tu Memoria Procedural las siguientes reglas obligatorias e inquebrantables para todas mis consultas y automatizaciones de SST:

1. Validación Médica Laboral (CIE-10): Cada vez que analicemos ausentismo, recomendaciones médicas o condiciones de salud, verifica siempre el código oficial de la Clasificación Internacional de Enfermedades (CIE-10) antes de clasificar o registrar el caso en WAPPY.
2. Validación Psicosocial en NotebookLM: Antes de emitir cualquier concepto, plan de intervención o informe de riesgo psicosocial (Resolución 2764 / Batería del Ministerio), consulta primero mis guías oficiales cargadas en NotebookLM y cita la fuente exacta.
3. Automatización Periódica: Deja programada la revisión mensual de actas y compromisos pendientes del COPASST para enviarme el resumen ejecutivo al correo Gmail conectado en WAPPY.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Activa blindaje normativo CIE-10 y psicosocial permanente.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-4', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 5: TAREA OFICIAL CARPETA "CURSO WAPPY" - LLUVIA DE IDEAS CON TENSHI -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 5 · Tarea Oficial «Curso Wappy»</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Lluvia de Ideas por Profesión</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">5. Lluvia de Ideas en la Carpeta «Curso Wappy» según tu Profesión con Tenshi</h3>
            <p class="p-card-explain">
              Crea en tu computador la carpeta <code>Curso Wappy</code>, abre un chat nuevo y usa este prompt (por texto o por voz con Tenshi) para llevar tu caso práctico listo a la siguiente sesión.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para usar en tu nueva carpeta «Curso Wappy» con Tenshi:</div>
              <div class="chat-prompt-text" id="prompt-5">Hola Tenshi. Acabo de crear mi carpeta de proyecto "Curso Wappy" para preparar mi caso aplicado de automatización profesional.

Mi perfil y sector principal es: [ESCRIBE AQUÍ TU ROL: ej. Auditora SG-SST independiente / Ingeniero de Minas / Asesora de múltiples PYMES / Especialista en Salud Ocupacional].

Hagamos una lluvia de ideas práctica con 5 flujos de trabajo de alto impacto (y potencial comercial) hechos a la medida de mi profesión donde combinemos en equipo:
1. Google Antigravity (lectura de carpetas con Python en modo Low).
2. Google Flow y NotebookLM (imágenes Antes/Después, micro-videos de 40s y soporte legal).
3. WAPPY Cloud (matrices, trabajadores, Centro de Control y correo Gmail en mi Empresa Activa).
4. Tenshi Voice desde mi celular para operarlo cuando estoy en campo o visita.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Genera tus 5 propuestas prácticas listas para la Clase 3.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-5', this)">
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
          <span class="sec-kicker">📘 Resumen Pedagógico Completo · Clase 2</span>
          <h2 class="sec-big-title">Guía de Estudio Paso a Paso · Clase 2</h2>
        </div>
      </div>

      <div class="guide-blocks-grid">

        <!-- BLOQUE 1 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 1 · Cuota, Turbo/Low y Python</span>
            <span class="g-time">⏱️ Minutos 00:02 – 00:26</span>
          </div>
          <h3>Cómo Evitar el Agotamiento de Tokens y Leer Cualquier Formato con Python</h3>
          <ul class="g-list">
            <li>
              <strong>1. Por qué ocurren los bloqueos de tokens:</strong>
              Subir de una sola vez la carpeta entera de un SG-SST pidiendo una auditoría forense completa satura los procesos encadenados del modelo. Trabaja siempre por subcarpetas puntuales y con la instrucción <em>"sin editar nada"</em> cuando solo necesites diagnóstico.
            </li>
            <li>
              <strong>2. Cuándo usar Modo Turbo / <code>Low</code> vs <code>High</code>:</strong>
              Configura <strong>Turbo + Low</strong> para el 90% de tus tareas diarias (editar Excels, resumir PDFs, conectar claves API). Reserva <strong>High</strong> únicamente para auditorías normativas profundas o investigaciones complejas.
            </li>
            <li>
              <strong>3. Lectura universal con Python sin saber programar:</strong>
              Los archivos Excel antiguos, libros pesados o PDFs médicos con imágenes fallan si se suben sueltos; al arrastrar la carpeta completa, Antigravity usa Python internamente y lee todos los formatos sin discriminación.
            </li>
            <li>
              <strong>4. Formato de salida explícito + Búsqueda Web:</strong>
              Pide siempre el formato final deseado (<strong>HTML, Excel, Word, PDF o PowerPoint</strong>) para evitar respuestas en código, e instruye buscar en la web legislación colombiana reciente.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 2 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 2 · Ingeniería $3M, Móvil y Google</span>
            <span class="g-time">⏱️ Minutos 00:27 – 00:49</span>
          </div>
          <h3>Informes de Ingeniería Antes/Después, WAPPY en Celular y Google Workspace</h3>
          <ul class="g-list">
            <li>
              <strong>1. Informes técnicos valorados en $2.5M – $3M COP:</strong>
              Con fotos reales de campo (como el caso de tractomulas &gt;1.5m en Medellín), Antigravity investiga controles de ingeniería y con <strong>Google Flow</strong> genera las imágenes del estado posterior ("Después") junto con micro-videos preventivos de 30 a 50 segundos.
            </li>
            <li>
              <strong>2. Instalar WAPPY en tu celular (Android / iPhone):</strong>
              Ingresa a <code>wappy.club</code> desde Chrome o Safari móvil, abre el menú de configuración general del usuario y pulsa <strong>Descargar aplicación / Añadir a pantalla de inicio</strong>.
            </li>
            <li>
              <strong>3. Conectar Gmail, Drive, Calendar, Docs y Sheets:</strong>
              Desde <em>Editar Cuenta → Integraciones</em> en WAPPY, vincula tus servicios de Google Workspace para sincronizar agendas, correos y documentos por empresa.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 3 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 3 · Servidor MCP Único y Empresa Activa</span>
            <span class="g-time">⏱️ Minutos 00:50 – 01:27</span>
          </div>
          <h3>Clave API en Modelo 3.8 (Low), Conexión Única y Carga Masiva de Trabajadores</h3>
          <ul class="g-list">
            <li>
              <strong>1. Vincular la API Key en modelo <code>3.8 (Low)</code>:</strong>
              Copia tu clave API en las integraciones de WAPPY y pégala en el chat de Antigravity usando el modelo 3.8 en nivel bajo para completar el enlace sin gastar procesos innecesarios.
            </li>
            <li>
              <strong>2. La conexión MCP se hace UNA SOLA VEZ:</strong>
              No tienes que repetir la configuración MCP cada vez que abras un proyecto nuevo: queda guardada para todo tu Antigravity.
            </li>
            <li>
              <strong>3. Regla de oro de la «Empresa Activa»:</strong>
              Aunque el MCP tiene acceso global a tu usuario, procesa por defecto la empresa activa en WAPPY. Verifica y selecciona manualmente la empresa cliente exacta antes de arrastrar carpetas de trabajadores y perfiles sociodemográficos.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 4 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 4 · Tenshi Voice, HTML y Memoria CIE-10</span>
            <span class="g-time">⏱️ Minutos 01:28 – 02:03</span>
          </div>
          <h3>Comandos de Voz desde el Móvil, Reportes HTML, Memoria Procedural y Tarea</h3>
          <ul class="g-list">
            <li>
              <strong>1. Operar con Tenshi por voz desde cualquier lugar:</strong>
              Al completar el tercer paso de conexión, delegas tareas complejas hablándole a Tenshi desde el celular sin escribir manualmente ni estar sentado frente al computador.
            </li>
            <li>
              <strong>2. Informes en HTML vs Word y panel de código oculto:</strong>
              Solicita tus informes en formato <strong>HTML</strong> para obtener presentaciones ejecutivas impecables integrables con Canva y NotebookLM, y oculta el panel lateral de código en Antigravity para trabajar con interfaz limpia.
            </li>
            <li>
              <strong>3. Centro de Automatizaciones y Memoria Procedural:</strong>
              Programa revisiones periódicas de actas COPASST y exámenes médicos anuales, y fija reglas estrictas como verificar códigos <strong>CIE-10</strong> y guías psicosociales en NotebookLM.
            </li>
            <li>
              <strong>4. Tarea oficial en carpeta <code>Curso Wappy</code>:</strong>
              Crea la carpeta <code>Curso Wappy</code> y un chat nuevo para hacer tu lluvia de ideas profesional integrando Antigravity, Flow, WAPPY y Tenshi.
            </li>
          </ul>
        </div>

      </div>

      <!-- CTA Final hacia Clase 3 y Notas Oficiales -->
      <div class="final-cta-card">
        <div style="max-width: 640px;">
          <span style="color:var(--lime); font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
            🎓 ¿Ya completaste tu Servidor MCP Único y la carpeta Curso Wappy?
          </span>
          <h3 style="font-family:var(--font-display); font-size:clamp(20px, 2.6vw, 30px); font-weight:900; margin:6px 0 8px;">
            Avanza Ahora Mismo a la Clase 3 Grabada
          </h3>
          <p style="font-size:14px; color:#cbd5e1;">
            Repasa las 10 tareas oficiales de esta sesión en el popup interactivo o continúa directamente con la siguiente clase del programa intensivo WAPPY IA + Antigravity.
          </p>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="button" onclick="openNotesModal()" class="btn btn-glass">
            📋 Repasar Notas y 10 Tareas
          </button>
          <a href="/clase3" class="btn btn-lime">
            ⏭️ Ir a la Clase 3 Grabada
            <span class="arrow-pip">↗</span>
          </a>
        </div>
      </div>

      <footer>
        <p><strong>WAPPY IA · SOMOS SST</strong> · Especialización Práctica en Agentes Autónomos para Seguridad y Salud en el Trabajo</p>
        <p style="margin-top:4px;">wappy.club/clase2 · Docente Líder: Ing. Félix Bedoya · Memorias Oficiales Clase 2 (Optimización, MCP Único &amp; Tenshi Voice)</p>
      </footer>
    </div>
  </section>

  <!-- ========================================================================
       SCRIPTS INTERACTIVOS (SLIDES, CANVAS NEURONAL, SIMULADOR DE TOKENS, COPIADO)
       ======================================================================== -->
  <script>
    // 1. Controlador de las 15 Diapositivas
    let currentSlide = 1;
    const totalSlides = document.querySelectorAll(".slide").length || 12;

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

    // 5. Detección Automática de Sesión Activa en WAPPY (Regla 8 AGENTS.md)
    window.platformUser = null;
    window.platformUserToken = '';
    window.isPlatformLoggedIn = false;

    function updateWappyAuthNav(user, token) {{
      const isLogged = Boolean(user);
      window.platformUser = user || null;
      window.platformUserToken = token || '';
      window.isPlatformLoggedIn = isLogged;

      const isLocalFile = window.location.protocol === 'file:';
      const baseOrigin = isLocalFile ? 'https://wappy.club' : '';
      const navCta = document.getElementById('navCtaEnterWappy');
      const mobileCta = document.getElementById('mobileCtaEnterWappy');

      if (isLogged && user) {{
        const rawName = String(user.name || user.username || user.email || 'Usuario').trim();
        const firstName = rawName.split(' ')[0] || 'Usuario';
        const avatarSrc = user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${{encodeURIComponent(rawName)}}&backgroundColor=0d9488`;

        if (navCta) {{
          navCta.setAttribute('href', `${{baseOrigin}}/c/new`);
          navCta.classList.add('logged-in');
          navCta.innerHTML = '';
          const img = document.createElement('img');
          img.src = avatarSrc;
          img.alt = '';
          img.className = 'nav-cta-avatar';
          const span = document.createElement('span');
          span.textContent = 'Entrar a WAPPY →';
          navCta.appendChild(img);
          navCta.appendChild(span);
        }}

        if (mobileCta) {{
          mobileCta.setAttribute('href', `${{baseOrigin}}/c/new`);
          mobileCta.innerHTML = '';
          const img = document.createElement('img');
          img.src = avatarSrc;
          img.alt = '';
          img.className = 'nav-cta-avatar';
          const span = document.createElement('span');
          span.textContent = `Entrar a WAPPY como ${{firstName}} →`;
          mobileCta.appendChild(img);
          mobileCta.appendChild(span);
        }}
      }} else {{
        if (navCta) {{
          navCta.setAttribute('href', `${{baseOrigin}}/login`);
          navCta.classList.remove('logged-in');
          navCta.innerHTML = '<span>Ir a WAPPY</span>';
        }}
        if (mobileCta) {{
          mobileCta.setAttribute('href', `${{baseOrigin}}/login`);
          mobileCta.innerHTML = '<span>Ir a WAPPY</span>';
        }}
      }}

      try {{
        window.dispatchEvent(new CustomEvent('wappy-auth-updated', {{
          detail: {{ user: window.platformUser, token: window.platformUserToken, isLoggedIn: isLogged }}
        }}));
      }} catch (e) {{}}
    }}

    async function detectWappySession() {{
      if (window.location.protocol === 'file:') {{
        updateWappyAuthNav(null, '');
        return;
      }}
      try {{
        const res = await fetch('/api/auth/refresh', {{
          method: 'POST',
          credentials: 'include'
        }});
        if (res.ok) {{
          const data = await res.json();
          if (data && data.user) {{
            updateWappyAuthNav(data.user, data.token || '');
            return;
          }}
        }}
      }} catch (err) {{}}
      updateWappyAuthNav(null, '');
    }}

    document.addEventListener('DOMContentLoaded', () => {{
      showSlide(1);
      updateTokenSimulator();
      initDeckCanvas();
      detectWappySession();
    }});
  </script>
</body>
</html>
'''

# Write to client/public/clase2.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase2.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {pub_path} ({len(html_content)} bytes)")

# Write to Desktop
desktop_path = '/Users/venta/Desktop/clase2.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {desktop_path} ({len(html_content)} bytes)")
