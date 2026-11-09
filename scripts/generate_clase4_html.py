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
thumb_bg = get_base64_img('client/public/assets/thumb_bg_clase4.jpg')

if not cat_logo:
    cat_logo = logo_wappy

html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>WAPPY IA · Clase 4: NotebookLM Cero Alucinación, Google Flow Audiovisual &amp; Ecosistema Workspace | SOMOS SST</title>
  <meta name="description" content="Clase 4 Oficial en Vivo: Antigravity + Wappy IA · Martes, 10 de noviembre · 7:00 – 8:00 PM (America/Bogota) vía Google Meet (meet.google.com/yxv-gyhv-ron). Revisión de lluvias de ideas por empresa, conexión de Google NotebookLM 0% alucinación, Google Flow audiovisual y automatización Drive, Gmail y Calendar con Tenshi.">
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
          <div class="sub">SOMOS SST · CLASE 4</div>
        </div>
      </a>

      <div class="nav-links">
        <a href="#presentacion" class="active-pill">🎬 Presentación</a>
        <a href="#grabacion">🔴 Sala en Vivo &amp; Notas</a>
        <a href="#prompts-chat">💬 Prompts Clase 4</a>
        <a href="#guia-paso-a-paso">📘 Temario Paso a Paso</a>
      </div>

      <div class="nav-actions">
        <a id="navCtaEnterWappy" href="/login" class="nav-cta-wappy">
          <span>Ir a WAPPY</span>
        </a>
        <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding: 9px 16px; font-size: 13px;">
          📹 Entrar a Meet
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
      <a href="/clase2" class="course-org-pill done">✅ Clase 2 · Grabada</a>
      <a href="/clase3" class="course-org-pill done">✅ Clase 3 · Grabada</a>
      <a href="/clase4" class="course-org-pill live active" aria-current="page">🔴 Clase 4 · Estás aquí (Mar 10 Nov · 7PM)</a>
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
          <span>🔴 Próxima Clase en Vivo · Martes, 10 de Noviembre · 7:00 – 8:00 PM (Hora Colombia)</span>
        </div>

        <h1>
          NotebookLM, <span class="highlight-lime">Google Flow Audiovisual</span> &amp; Automatización Workspace con Tenshi
        </h1>

        <p class="hero-sub">
          Continuación oficial anunciada al cierre de la Clase 3: revisaremos en vivo las <strong>lluvias de ideas en proyectos aislados por empresa</strong> (<code>1 Proyecto = 1 Empresa</code>) y conectaremos <strong>Google NotebookLM</strong> (0% alucinación normativa), <strong>Google Flow</strong> audiovisual y <strong>Drive, Gmail y Calendar</strong> orquestados con <strong>Tenshi</strong>.
        </p>

        <div class="hero-ctas">
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime">
            📹 Unirse a Google Meet (7:00 PM) ↗
          </a>
          <a href="#presentacion" class="btn btn-dark">
            🎬 Explorar Temario Clase 4
            <span class="arrow-pip">↓</span>
          </a>
          <button type="button" onclick="openNotesModal()" class="btn btn-glass">
            📋 Checklist &amp; Conexión
          </button>
        </div>

        <div class="hero-pills-bar">
          <div class="hero-pill-item">
            <div class="hero-pill-label">🗓️ Fecha y Hora Oficial</div>
            <div class="hero-pill-val">📅 Martes 10 Nov · 7:00 – 8:00 PM</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🕐 Zona Horaria</div>
            <div class="hero-pill-val">🌎 America/Bogota</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔗 Sala Oficial en Vivo</div>
            <div class="hero-pill-val">📹 meet.google.com/yxv-gyhv-ron</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🚀 Evento Confirmado</div>
            <div class="hero-pill-val">Antigravity + Wappy IA</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta Interactiva de Tenshi en el Hero -->
      <div class="hero-tenshi-card">
        <div class="hero-tenshi-glow"></div>
        <img src="{tenshi_img}" alt="Tenshi IA" class="tenshi-avatar-floating">
        <div class="tenshi-bubble">
          «¡Nos vemos en vivo este <strong>Martes 10 de Noviembre a las 7:00 PM</strong>! Trae lista la carpeta individual de cada empresa y tu lluvia de ideas: conectaremos <strong>NotebookLM</strong>, <strong>Google Flow</strong> y <strong>Workspace</strong> directo con mis rutinas en WAPPY.»
        </div>
        <div class="meet-live-strip">
          <div style="text-align:left;">
            <div style="font-size:10px; text-transform:uppercase; color:#99f6e4; font-weight:800;">Antigravity + Wappy IA · Mar 10 Nov · 7:00 PM</div>
            <div style="font-weight:900; color:#fff;">meet.google.com/yxv-gyhv-ron</div>
          </div>
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:8px 14px; font-size:12px;">
            Unirme Ahora ↗
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- ========================================================================
       3. PRESENTACIÓN INTERACTIVA DEL TEMARIO OFICIAL · CLASE 4 (10 DIAPOSITIVAS)
       ======================================================================== -->
  <section class="presentation-section" id="presentacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">✨ Temario Oficial Interactivo · Martes 10 de Noviembre · 7:00 – 8:00 PM COT</span>
          <h2 class="sec-big-title">Diapositivas Oficiales de la Clase 4 (10 Slides)</h2>
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
            <span>WAPPY.CLUB // CLASE_04 // ANTIGRAVITY_WAPPY_IA // MAR_10_NOV_7PM</span>
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
          <button class="slide-num-pill" onclick="showSlide(2)">02 Lluvia de Ideas</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 NotebookLM 0%</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 Podcasts &amp; Mapas</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 Google Flow SST</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 Emergencias 3.5m</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 Workspace 360°</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 Tenshi &amp; /tareas</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 Casos del Grupo</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 Checklist 7PM</button>
        </div>

        <!-- VIEWPORT DE LAS 10 DIAPOSITIVAS -->
        <div class="slide-viewport" id="slide-viewport">

          <!-- ==================== SLIDE 1: PORTADA CLASE 4 ==================== -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">🔴 Antigravity + Wappy IA · Martes 10 Nov · 7:00 – 8:00 PM</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">MEET: YXV-GYHV-RON · AMERICA/BOGOTA</span>
            </div>
            <h2 class="s-title">De los <span class="accent-lime">Proyectos por Empresa</span> a la Producción Normativa y <span class="accent-teal">Audiovisual Automatizada</span></h2>
            <p class="slide-lead">
              En esta cuarta sesión oficial conectamos tus carpetas empresariales aisladas con <strong>Google NotebookLM</strong>, <strong>Google Flow</strong> y <strong>Google Workspace</strong> para que <strong>Tenshi</strong> produzca informes legales, controles visuales, micro-videos y seguimientos automáticos.
            </p>

            <div class="s-grid-4" style="margin-bottom: 16px;">
              <div class="s-card glow-lime">
                <div style="font-size:24px; font-weight:900; color:var(--lime);">1 = 1</div>
                <h4>Proyectos por Empresa</h4>
                <p>Revisión de lluvias de ideas reales del grupo bajo el estándar <code>1 Proyecto = 1 Empresa</code>.</p>
              </div>
              <div class="s-card glow-teal">
                <div style="font-size:24px; font-weight:900; color:var(--teal-bright);">0% Error</div>
                <h4>NotebookLM Legal</h4>
                <p>Citas exactas al párrafo del Decreto 1072, Res. 0312, GTC 45 y Res. 2764 + Podcasts.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#fcd34d;">3.5 Min</div>
                <h4>Flow &amp; Micro-Videos</h4>
                <p>Controles Antes/Después, rutas de evacuación y cápsulas con voz para COPASST y brigadas.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#c084fc;">20 Años</div>
                <h4>Workspace + Tenshi</h4>
                <p>Drive documental, envío ejecutivo por Gmail, agenda en Calendar y rutinas en <code>/tareas</code>.</p>
              </div>
            </div>

            <div class="flow-diagram-box">
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lime); margin-bottom:10px; letter-spacing:0.08em;">
                🗺️ Hoja de Ruta Oficial · Martes 10 de Noviembre (7:00 – 8:00 PM COT)
              </div>
              <div class="flow-nodes-row">
                <div class="flow-node">
                  <div class="f-icon">💡</div>
                  <div class="f-title">1. Lluvia de Ideas</div>
                  <div class="f-sub">1 Proyecto = 1 Empresa</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--teal-bright);">
                  <div class="f-icon">📚</div>
                  <div class="f-title">2. NotebookLM</div>
                  <div class="f-sub">0% Alucinación + Podcast</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node">
                  <div class="f-icon">🎬</div>
                  <div class="f-title">3. Google Flow</div>
                  <div class="f-sub">Antes/Después + Video 3.5m</div>
                </div>
                <div class="flow-arrow-anim">━━▶</div>
                <div class="flow-node" style="border-color:var(--lime);">
                  <div class="f-icon">⚡</div>
                  <div class="f-title">4. Workspace + Tenshi</div>
                  <div class="f-sub">Drive · Gmail · Calendar</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 2: BLOQUE INICIAL — LLUVIAS DE IDEAS ==================== -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge amber s-kicker">💡 Bloque Inicial · Continuidad Directa de la Clase 3</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">AUDITORÍA DE PROYECTOS EN VIVO</span>
            </div>
            <h2 class="s-title">Revisión en Vivo de <span class="accent-lime">Lluvias de Ideas</span>: <span class="accent-teal">1 Proyecto = 1 Empresa</span></h2>
            <p class="slide-lead">
              Arrancamos revisando la tarea clave acordada al cierre de la Clase 3: aislar la información de cada cliente en su propia carpeta de proyecto para garantizar orden forense y ahorro máximo de tokens.
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🗂️ Auditoría de Estructura Empresarial</h4>
                <ul class="g-list s-list">
                  <li><strong>Aislamiento total de contexto:</strong> Cada empresa asesorada cuenta con su carpeta independiente, su propio <code>AGENTS.md</code> y sus matrices sincronizadas en WAPPY.</li>
                  <li><strong>Cero mezcla de trabajadores o riesgos:</strong> Evitamos que los datos de una empresa constructora se crucen con los de una clínica o empresa de transporte.</li>
                  <li><strong>Puente Reactivo de 3 Pasos:</strong> Verificación rápida en sala de que todos tengan el conector WAPPY &leftrightarrow; Antigravity en verde.</li>
                </ul>
              </div>
              <div class="s-card glow-teal">
                <h4>🎯 Selección de Flujos Reales de los Participantes</h4>
                <ul class="g-list s-list">
                  <li><strong>Casos propuestos por la cohorte:</strong> Escogeremos en vivo las mejores ideas de automatización traídas por los alumnos para resolverlas paso a paso.</li>
                  <li><strong>De cuello de botella a flujo autónomo:</strong> Transformamos tareas repetitivas de fin de mes en comandos reutilizables para todos tus clientes.</li>
                  <li><strong>Escalabilidad para consultores SST:</strong> Diseñas la receta una sola vez y la replicas en tus 5, 10 o 20 empresas asesoradas.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 3: CONEXIÓN DE GOOGLE NOTEBOOKLM ==================== -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">📚 Blindaje Jurídico y Técnico SST</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--teal-bright);">0% ALUCINACIÓN NORMATIVA</span>
            </div>
            <h2 class="s-title">Conexión de <span class="accent-teal">Google NotebookLM</span> con Citación Exacta al Párrafo</h2>
            <p class="slide-lead">
              Conectamos tus cuadernos verificados de Google NotebookLM con Antigravity y WAPPY para que ningún informe, matriz o concepto jurídico invente artículos inexistentes.
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-teal">
                <h4>⚖️ Biblioteca Normativa Colombiana Verificada</h4>
                <ul class="g-list s-list">
                  <li><strong>Decreto 1072 de 2015:</strong> Libro 2, Parte 2, Título 4, Capítulo 6 (Sistema de Gestión SST) con trazabilidad literal.</li>
                  <li><strong>Resolución 0312 de 2019:</strong> Estándares Mínimos según número de trabajadores y nivel de riesgo ARL (I a V).</li>
                  <li><strong>GTC 45 &amp; Resolución 2764 de 2022:</strong> Valoración técnica de peligros y batería de riesgo psicosocial sin interpretaciones ambiguas.</li>
                </ul>
              </div>
              <div class="s-card glow-lime">
                <h4>🔍 Cruce con Actas y Reglamentos Internos</h4>
                <ul class="g-list s-list">
                  <li><strong>Documentos propios de cada cliente:</strong> Carga el Reglamento de Higiene, actas previas del COPASST, profesiogramas y procedimientos operativos.</li>
                  <li><strong>Citación exacta al párrafo y fuente:</strong> Cada recomendación técnica incluye el artículo, numeral y documento interno de respaldo.</li>
                  <li><strong>Consulta previa obligatoria:</strong> El agente valida en NotebookLM antes de alimentar hallazgos o planes de acción en WAPPY.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 4: PRODUCTOS EJECUTIVOS CON NOTEBOOKLM ==================== -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">🎙️ Pedagogía Moderna para Trabajadores y Gerencia</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">AUDIO + VISUALIZACIÓN NORMATIVA</span>
            </div>
            <h2 class="s-title">Productos Ejecutivos con <span class="accent-lime">NotebookLM</span>: Podcasts, Mapas e Infografías</h2>
            <p class="slide-lead">
              Nadie lee un protocolo en PDF de 60 páginas enviado por correo. Convertiremos documentos densos del SG-SST en piezas ágiles que los trabajadores sí escuchan y comprenden en campo.
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🎧 Podcasts Conversacionales a 2 Voces</h4>
                <ul class="g-list s-list">
                  <li><strong>Ideal para personal en ruta y conductores (PESV):</strong> Dos locutores conversan de forma amena y natural sobre los riesgos viales, pausas activas o protocolos de seguridad.</li>
                  <li><strong>Distribución inmediata por WhatsApp o LMS:</strong> Cápsulas de audio listas para escuchar antes de iniciar turno sin detener la operación.</li>
                  <li><strong>Integración con Wappy Podcast:</strong> Personalización de guiones con identidad de la empresa asesorada.</li>
                </ul>
              </div>
              <div class="s-card glow-teal">
                <h4>🧠 Mapas Mentales e Infografías Normativas</h4>
                <ul class="g-list s-list">
                  <li><strong>Mapas Mentales interactivos:</strong> Desglose visual de responsabilidades gerenciales, rutas de reporte ATEL y estructura del SG-SST.</li>
                  <li><strong>Infografías ejecutivas para carteleras e inducción:</strong> Síntesis visual de alto impacto con pasos claros y cero saturación de texto.</li>
                  <li><strong>Cuestionarios de verificación:</strong> Preguntas automáticas para validar la comprensión real de la capacitación.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 5: CONEXIÓN DE GOOGLE FLOW & STUDIO VISUAL SST ==================== -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge amber s-kicker">🎨 Dirección Visual Aplicada a Prevención</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">GOOGLE FLOW + IMAGEN &amp; VEO</span>
            </div>
            <h2 class="s-title">Conexión de <span class="accent-lime">Google Flow</span> &amp; Studio Visual para Ingeniería SST</h2>
            <p class="slide-lead">
              Una imagen del control propuesto convence a la Alta Dirección diez veces más rápido que una celda de Excel. Conectaremos Google Flow para visualizar soluciones reales de ingeniería.
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>📸 Controles de Ingeniería Fotorrealistas (Antes / Después)</h4>
                <ul class="g-list s-list">
                  <li><strong>Del hallazgo a la solución visual:</strong> Tomas la foto real de una máquina sin guarda, bodega desordenada o puesto disergonómico y generas el <em>Después</em> con el control instalado.</li>
                  <li><strong>Aprobación de presupuesto gerencial:</strong> Muestra al gerente exactamente cómo quedará la demarcación ANSI, la línea de vida o el sistema de extracción.</li>
                </ul>
              </div>
              <div class="s-card glow-teal">
                <h4>⚠️ Recreación Preventiva de Incidentes e Ilustraciones</h4>
                <ul class="g-list s-list">
                  <li><strong>Lecciones aprendidas sin exponer personas:</strong> Recrea visualmente la mecánica de un casi-accidente o ATEL para socializar la alerta de seguridad sin vulnerar la privacidad.</li>
                  <li><strong>Ilustraciones técnicas a medida:</strong> Uso correcto de EPP, bloqueo y etiquetado (LOTO), izaje de cargas y espacios confinados adaptados al sector de tu empresa.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 6: PLANES DE EMERGENCIA Y MICRO-VIDEOS DE 3.5 MINUTOS ==================== -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">🎬 Producción Audiovisual con Wappy Apps + Skills</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">FORMATO EJECUTIVO DE 3.5 MINUTOS</span>
            </div>
            <h2 class="s-title">Planes de Emergencia, Rutas de Evacuación y <span class="accent-teal">Micro-Videos de 3.5 Min</span></h2>
            <p class="slide-lead">
              Integramos los paquetes de Skills audiovisuales con síntesis y clonación de voz en Wappy Apps para producir material de entrenamiento memorable para brigadistas, visitantes y COPASST.
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-teal">
                <h4>🚨 Rutas de Evacuación y Planes de Emergencia</h4>
                <ul class="g-list s-list">
                  <li><strong>Guías visuales de actuación:</strong> Qué hacer antes, durante y después de un sismo, conato de incendio o emergencia médica con señalización clara.</li>
                  <li><strong>Inducción para visitantes y contratistas:</strong> Video corto proyectable en recepción o accesible mediante código QR en portería.</li>
                </ul>
              </div>
              <div class="s-card glow-lime">
                <h4>🎤 Skills Audiovisuales + Voz para COPASST y Brigadas</h4>
                <ul class="g-list s-list">
                  <li><strong>Duración óptima de 3.5 minutos:</strong> Estructura pedagógica de alta retención sincronizada con locución profesional en español colombiano.</li>
                  <li><strong>Capacitación continua de comités:</strong> Cápsulas sobre inspección planeada, investigación de incidentes (Res. 1401) y funciones del Vigía / COPASST.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 7: LA TRIADA GOOGLE WORKSPACE EN VIVO ==================== -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">☁️ Operación Corporativa Sin Fricción</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#2dd4bf;">DRIVE + GMAIL + CALENDAR</span>
            </div>
            <h2 class="s-title">La Triada <span class="accent-lime">Google Workspace</span> en Vivo: Archivo, Correo y Agenda</h2>
            <p class="slide-lead">
              Cerramos el ciclo administrativo conectando el almacenamiento legal, las comunicaciones formales con el cliente y la programación preventiva en un solo flujo continuo.
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🗄️ Google Drive · Retención Legal de 20 Años</h4>
                <ul class="g-list s-list">
                  <li><strong>Decreto 1072 Art. 2.2.4.6.13:</strong> Organización automática de carpetas por año, ciclo PHVA y estándar 0312 para conservar evidencias por 20 años.</li>
                  <li><strong>Lectura y respaldo bidireccional:</strong> Rescata soportes subidos por el cliente y deposita los nuevos informes auditados sin descargas manuales.</li>
                </ul>
              </div>
              <div class="s-card glow-teal">
                <h4>✉️ Gmail Ejecutivo + 📅 Google Calendar</h4>
                <ul class="g-list s-list">
                  <li><strong>Redacción y envío por Gmail:</strong> Envía el resumen mensual de gestión SST, alertas de vencimiento y actas firmables directo al representante legal.</li>
                  <li><strong>Agendamiento en Google Calendar:</strong> Programa reuniones mensuales del COPASST, Comité de Convivencia, simulacros y exámenes periódicos con recordatorios.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 8: ORQUESTACIÓN COMPLETA CON TENSHI & /TAREAS ==================== -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">🤖 Cerebro Central de Automatización WAPPY</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">TENSHI + 7 ESPECIALISTAS + /TAREAS</span>
            </div>
            <h2 class="s-title">Orquestación Completa con <span class="accent-lime">Tenshi</span> y el Centro de <span class="accent-teal"><code>/tareas</code></span></h2>
            <p class="slide-lead">
              Unimos Antigravity + NotebookLM + Google Flow con los <strong>7 especialistas de WAPPY IA</strong> para que Tenshi coordine rutinas programadas y consolide reportes gerenciales PHVA.
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-teal">
                <h4>🧠 Sinergia con los 7 Especialistas de WAPPY</h4>
                <ul class="g-list s-list">
                  <li><strong>Equipo multidisciplinario activo:</strong> Médico Laboral, Abogado SST, Higienista, Ergónomo, Psicólogo, Investigador ATEL y Especialista Químico.</li>
                  <li><strong>Alimentación cruzada en tiempo real:</strong> Lo que Antigravity procesa en tus carpetas y Drive actualiza indicadores, matrices y planes de trabajo en WAPPY.</li>
                </ul>
              </div>
              <div class="s-card glow-lime">
                <h4>⏱️ Centro de Control <code>/tareas</code> y Reportes PHVA</h4>
                <ul class="g-list s-list">
                  <li><strong>Rutinas programadas (Cron &amp; Workflows):</strong> Revisión semanal de pendientes, seguimiento de acciones correctivas (ACPM) y alertas tempranas.</li>
                  <li><strong>Informe Gerencial PHVA:</strong> Consolidación automática del Planear, Hacer, Verificar y Actuar lista para Revisión por la Alta Dirección.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 9: PROYECTOS APLICADOS DEL GRUPO ==================== -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge amber s-kicker">💼 Casos Reales de Consultoría y Empresa</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">ALTO VALOR COMERCIAL SST</span>
            </div>
            <h2 class="s-title">Proyectos Aplicados del Grupo: <span class="accent-lime">Validación Documental</span> y Entregables HTML</h2>
            <p class="slide-lead">
              Aplicamos todo el ecosistema a los casos prácticos solicitados por los profesionales de la cohorte para multiplicar la capacidad operativa y diferenciar tu portafolio SST.
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🔎 Seguimiento y Validación Documental Cruzada</h4>
                <ul class="g-list s-list">
                  <li><strong>Comités e inspecciones en Drive:</strong> Control automático de quórum, compromisos abiertos del COPASST/CCL y cierre de hallazgos locativos.</li>
                  <li><strong>Verificación de contratistas y requisitos:</strong> Cruce documental de <strong>RUES</strong>, <strong>PESV</strong>, certificados de <strong>Trabajo en Alturas</strong> y planillas de <strong>Aportes en Línea</strong>.</li>
                </ul>
              </div>
              <div class="s-card glow-teal">
                <h4>💎 Entregables HTML Interactivos de Alto Valor</h4>
                <ul class="g-list s-list">
                  <li><strong>Más allá del PDF estático:</strong> Tableros ejecutivos portables, presentaciones interactivas de rendición de cuentas y portales de inducción por empresa.</li>
                  <li><strong>Diferenciación inmediata en licitaciones:</strong> Entrega resultados visuales con marca impecable que justifican mejores honorarios profesionales.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 10: CHECKLIST DE PREPARACIÓN MARTES 10 NOV ==================== -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">✅ Lista de Chequeo Pre-Vuelo · Martes 10 Nov · 7:00 PM</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--lime);">ZONA HORARIA: AMERICA/BOGOTA</span>
            </div>
            <h2 class="s-title">Checklist de Preparación para nuestra <span class="accent-lime">Clase 4 en Vivo</span></h2>
            <p class="slide-lead">
              Revisa estos 4 puntos cinco minutos antes de las <strong>7:00 PM (Hora Colombia)</strong> para aprovechar cada minuto práctico junto al Ing. Félix Bedoya:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>📋 Tus 4 Requisitos Listos en tu Computador</h4>
                <ul class="g-list s-list">
                  <li><strong>1. Proyecto por empresa abierto en Antigravity:</strong> Tener lista al menos una carpeta aislada de empresa real o piloto (<code>1 Proyecto = 1 Empresa</code>).</li>
                  <li><strong>2. Puente WAPPY de 3 pasos activo:</strong> Sesión iniciada en <code>wappy.club</code> y conexión reactiva verificada en verde.</li>
                  <li><strong>3. Lluvia de ideas de automatización:</strong> Tus 2 o 3 dolores operativos principales anotados para convertirlos en flujo automatizado.</li>
                  <li><strong>4. Cuenta Google lista:</strong> Acceso a NotebookLM, Google Flow y Drive/Gmail/Calendar en tu navegador.</li>
                </ul>
              </div>
              <div class="s-card glow-teal" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                <div style="font-size:42px; margin-bottom:8px;">📹</div>
                <h4>Sala Oficial Google Meet Confirmada</h4>
                <p style="margin-bottom:6px;"><strong>Evento:</strong> Antigravity + Wappy IA (Clase 4)</p>
                <p style="margin-bottom:14px; color:#99f6e4; font-family:var(--font-mono); font-size:13px;">Martes, 10 de noviembre · 7:00 – 8:00 PM<br>meet.google.com/yxv-gyhv-ron</p>
                <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime">
                  📹 Unirse a Google Meet (7:00 PM) ↗
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
            <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              📹 Unirse a Sala Meet (7:00 PM) ↗
            </a>
            <a href="#prompts-chat" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              💬 Ver Prompts Clase 4
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       3B. SALA EN VIVO GOOGLE MEET & MINIATURA HD "PRÓXIMA EMISIÓN" · CLASE 4
       ======================================================================== -->
  <section class="recording-section" id="grabacion">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">🔴 Emisión Oficial en Vivo · Martes 10 de Noviembre · 7:00 – 8:00 PM (America/Bogota)</span>
          <h2 class="sec-big-title">Sala Google Meet &amp; Grabación Oficial Clase 4</h2>
        </div>
        <div style="font-size: 13px; color: var(--ink-muted); font-weight: 600;">
          💡 Haz clic en la portada para entrar a <strong>Google Meet</strong>; al finalizar la clase quedará publicada aquí la grabación HD y las notas oficiales
        </div>
      </div>

      <!-- Escenario de Sala en Vivo con estilo HUD -->
      <div class="deck-stage" id="video-stage">
        <div class="hud-corner tl"></div>
        <div class="hud-corner tr"></div>
        <div class="hud-corner bl"></div>
        <div class="hud-corner br"></div>

        <!-- Barra Superior de Telemetría -->
        <div class="deck-topbar">
          <div class="deck-telemetry">
            <span class="telemetry-dot"></span>
            <span>WAPPY.CLUB // EMISIÓN_EN_VIVO // CLASE_04 // MEET: YXV-GYHV-RON</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge">MARTES 10 NOV · 7:00 – 8:00 PM COT</span>
            <button type="button" class="btn-fullscreen" onclick="toggleVideoFullscreen()">
              ⛶ Pantalla Completa
            </button>
          </div>
        </div>

        <div class="deck-progress-track">
          <div class="deck-progress-fill" style="width: 100%;"></div>
        </div>

        <!-- Bloques Horarios de la Sesión en Vivo -->
        <div class="recording-chapters-strip">
          <span class="rec-chapter-pill"><strong>7:00 PM</strong> Revisión Lluvias de Ideas (1 Proyecto = 1 Empresa)</span>
          <span class="rec-chapter-pill"><strong>7:15 PM</strong> NotebookLM 0% Alucinación + Podcasts</span>
          <span class="rec-chapter-pill"><strong>7:30 PM</strong> Google Flow + Micro-Videos 3.5 Min</span>
          <span class="rec-chapter-pill"><strong>7:45 PM</strong> Drive · Gmail · Calendar + Tenshi</span>
        </div>

        <!-- Portada HD 16:9 de Próxima Emisión en Vivo (Abre Google Meet en nueva pestaña) -->
        <div class="video-viewport-wrap">
          <div class="video-aspect-box">
            <div class="video-thumb-cover" id="video-thumb-cover" onclick="window.open('https://meet.google.com/yxv-gyhv-ron', '_blank')" role="button" tabindex="0" aria-label="Entrar a la videoconferencia de la Clase 4 en Google Meet">
              <img src="{thumb_bg}" alt="" class="video-thumb-bg-img" aria-hidden="true">
              <div class="video-thumb-radial-overlay"></div>
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{felix_avatar}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Insignia En Vivo + Logos + CLASE 4 + 4 Píldoras + Botón Google Meet -->
              <div class="thumb-center-col">
                <div style="display:inline-flex; align-items:center; gap:8px; padding:5px 14px; border-radius:999px; background:rgba(220,38,38,0.22); border:1px solid rgba(248,113,113,0.65); color:#fecaca; font-size:11.5px; font-weight:900; letter-spacing:0.06em; margin-bottom:8px;">
                  🔴 EN VIVO · MARTES 10 NOV · 7:00 – 8:00 PM
                </div>

                <div class="thumb-logos-pill">
                  <img src="{wappy_horiz_logo}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{agy_logo}" alt="Google Antigravity" class="agy-i">
                </div>

                <div class="thumb-clase-giant">CLASE 4</div>

                <div class="thumb-sub-title">
                  NotebookLM, <span>Google Flow</span> &amp; <span>Automatización Tenshi</span>
                </div>

                <div class="thumb-topic-pills">
                  <span class="thumb-topic-pill">📚 NOTEBOOKLM 0% ALUCINACIÓN</span>
                  <span class="thumb-topic-pill">🎬 GOOGLE FLOW VIDEO</span>
                  <span class="thumb-topic-pill">☁️ DRIVE · GMAIL · CALENDAR</span>
                  <span class="thumb-topic-pill highlight">📹 MEET: YXV-GYHV-RON</span>
                </div>

                <div class="thumb-play-cta" onclick="event.stopPropagation(); window.open('https://meet.google.com/yxv-gyhv-ron', '_blank')">
                  <span class="thumb-play-icon">📹</span>
                  <span>ENTRAR A LA VIDEOCONFERENCIA EN GOOGLE MEET ↗</span>
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
          </div>
        </div>

        <!-- BARRA DEBAJO DE LA PORTADA CON AVISO DE GRABACIÓN POST-SESIÓN Y BOTÓN POPUP -->
        <div class="notes-trigger-bar">
          <div class="notes-trigger-info">
            <h3>🔴 Sala Oficial Activa · Grabación HD y Memorias al Finalizar la Sesión en Vivo</h3>
            <p>Evento oficial <strong>Antigravity + Wappy IA</strong> (Martes 10 de noviembre · 7:00 – 8:00 PM · <code>America/Bogota</code>). Tan pronto concluya la emisión en directo por Google Meet, quedará publicada aquí mismo la <strong>grabación completa en HD</strong> junto con las <strong>notas y memorias oficiales</strong>.</p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn-open-notes" onclick="openNotesModal()">
              📋 Datos de Sala y Checklist Previo (Popup)
            </button>
          </div>
        </div>

        <!-- Footer del Escenario -->
        <div class="deck-footer">
          <div class="deck-telemetry">
            <span>🔗 Enlace oficial confirmado para computador o celular: <strong>https://meet.google.com/yxv-gyhv-ron</strong></span>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <a href="/clase3" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              ⏮️ Repasar Clase 3 Grabada
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
       MODAL / POPUP INTERACTIVO DE SALA EN VIVO, CHECKLIST Y NOTAS CLASE 4
       ======================================================================== -->
  <div class="notes-modal-backdrop" id="notes-modal" onclick="handleBackdropClick(event)">
    <div class="notes-modal-window" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
      <div class="notes-modal-header">
        <div class="notes-modal-title-wrap">
          <h3 id="notes-modal-title">📋 Sala Oficial, Checklist Previo &amp; Memorias · Clase 4: Antigravity + Wappy IA</h3>
          <p>Martes, 10 de noviembre · 7:00 – 8:00 PM (Zona horaria: America/Bogota) · Docente: Ing. Félix Bedoya</p>
        </div>
        <button type="button" class="btn-close-modal" onclick="closeNotesModal()">✕ Cerrar Ventana</button>
      </div>

      <!-- Barra de Pestañas del Popup -->
      <div class="notes-tabs-bar">
        <div class="notes-tab-group">
          <button type="button" class="notes-tab-btn active" id="ntab-all" onclick="switchNotesTab('all')">🌟 Ver Todo Completo</button>
          <button type="button" class="notes-tab-btn" id="ntab-resumen" onclick="switchNotesTab('resumen')">📹 Datos de Conexión</button>
          <button type="button" class="notes-tab-btn" id="ntab-pasos" onclick="switchNotesTab('pasos')">✅ Checklist Clase 3 → 4</button>
          <button type="button" class="notes-tab-btn" id="ntab-detalles" onclick="switchNotesTab('detalles')">⏳ Memorias Post-Sesión</button>
        </div>
      </div>

      <!-- Cuerpo Scrolleable del Popup -->
      <div class="notes-modal-body">

        <!-- Enlaces Oficiales Confirmados -->
        <div class="n-links-strip">
          <div style="font-size:12.5px; font-weight:800; color:#5eead4;">
            📹 Acceso Directo Confirmado a la Videoconferencia:
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📹 Google Meet: meet.google.com/yxv-gyhv-ron ↗</a>
            <a href="/clase3" class="n-doc-btn">🎥 Ver Clase 3 Grabada</a>
            <a href="/cursowappy01" class="n-doc-btn">🎓 Temario General del Curso</a>
          </div>
        </div>

        <!-- SECCIÓN 1: DATOS OFICIALES DE CONEXIÓN -->
        <div class="notes-pane active" data-npane="resumen">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            📌 1. Datos Oficiales de Conexión · Clase 4 en Vivo
          </div>
          <div class="s-grid-2">
            <div class="s-card glow-lime">
              <h4>🚀 Evento: Antigravity + Wappy IA</h4>
              <p>Cuarta sesión práctica oficial de la cohorte SOMOS SST, dedicada a la revisión de lluvias de ideas por empresa, conexión de <strong>Google NotebookLM</strong> (0% alucinación), <strong>Google Flow</strong> audiovisual y automatización de <strong>Drive, Gmail y Calendar</strong> con <strong>Tenshi</strong>.</p>
            </div>
            <div class="s-card glow-teal">
              <h4>🗓️ Horario y Enlace Google Meet</h4>
              <p>
                • <strong>Fecha:</strong> Martes, 10 de noviembre<br>
                • <strong>Hora:</strong> 7:00 – 8:00 PM (<code>Zona horaria: America/Bogota</code>)<br>
                • <strong>Enlace directo:</strong> <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" style="color:var(--lime); font-weight:800; text-decoration:underline;">https://meet.google.com/yxv-gyhv-ron</a>
              </p>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: CHECKLIST PREVIO DEJADO POR FÉLIX AL CIERRE DE LA CLASE 3 -->
        <div class="notes-pane active" data-npane="pasos">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ✅ 2. Checklist Previo Dejado por el Ing. Félix Bedoya al Cierre de la Clase 3
          </div>

          <div class="n-task-item">
            <span class="n-task-owner">Paso 1 · Carpetas</span>
            <div><strong>Proyectos separados por empresa (<code>1 Proyecto = 1 Empresa</code>):</strong> Tener creada en tu computador y abierta en Google Antigravity una carpeta independiente por cada empresa que asesores, manteniendo aislado el contexto, trabajadores y matrices de cada cliente.</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">Paso 2 · Puente</span>
            <div><strong>Puente Reactivo de 3 pasos con WAPPY activo:</strong> Verificar antes de las 7:00 PM que tu sesión en <code>wappy.club</code> y el conector de 3 pasos hacia Antigravity estén activos en verde.</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">Paso 3 · Ideas</span>
            <div><strong>Lluvia de ideas de automatización lista:</strong> Traer definida la lluvia de ideas de procesos reales que quieres automatizar (seguimiento de comités/inspecciones en Drive, validación RUES/PESV/Alturas/Aportes en Línea, podcasts de inducción o micro-videos de 3.5 min).</div>
          </div>
          <div class="n-task-item">
            <span class="n-task-owner">Paso 4 · Sala Meet</span>
            <div><strong>Conexión puntual 6:55 PM:</strong> Ingresar desde tu computador a <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" style="color:#5eead4; font-weight:800;">https://meet.google.com/yxv-gyhv-ron</a> con tu cuenta de Google abierta para conectar NotebookLM, Google Flow y Workspace en vivo.</div>
          </div>
        </div>

        <!-- SECCIÓN 3: PRÓXIMAMENTE TRAS LA SESIÓN EN VIVO -->
        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ⏳ 3. Transcripción y Memorias Minuto a Minuto (Próximamente tras la Sesión en Vivo)
          </div>

          <div class="n-detail-card">
            <h4>
              <span>📝 Publicación automática al finalizar la Clase 4 (Martes 10 de Noviembre · 8:00 PM COT)</span>
              <span class="ts-link">EN ESPERA DE EMISIÓN</span>
            </h4>
            <p>Esta sección se actualizará inmediatamente concluya nuestra sesión en directo en <strong>meet.google.com/yxv-gyhv-ron</strong>. Aquí encontrarás el resumen ejecutivo de los flujos construidos en vivo, los compromisos de la semana, el enlace a la transcripción completa y la bitácora minuto a minuto con marcas de tiempo verificadas, exactamente igual que en las Clases 1, 2 y 3.</p>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ========================================================================
       4. SECCIÓN ESTRELLA: LOS 5 PROMPTS OFICIALES DE LA CLASE 4 (COPIAR Y PEGAR)
       ======================================================================== -->
  <section class="prompts-section" id="prompts-chat">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">💬 Laboratorio en Vivo Clase 4 · Copiar y Pegar en Español</span>
          <h2 class="sec-big-title">5 Prompts Oficiales para NotebookLM, Flow, Video 3.5m &amp; Tenshi</h2>
        </div>
      </div>

      <!-- Banner Explicativo Cero Código -->
      <div class="zero-code-banner">
        <div>
          <h3>✨ De Proyectos Aislados por Empresa a Producción Normativa y Audiovisual</h3>
          <p>
            Cada uno de estos <strong>5 Prompts Oficiales de la Clase 4</strong> está diseñado para ejecutarse dentro de la carpeta individual de tu empresa en Antigravity conectada a WAPPY IA. Cópialos con un clic durante la práctica en vivo del <strong>Martes 10 de Noviembre (7:00 PM)</strong>:
          </p>
        </div>
        <div class="zero-code-compare">
          <div style="color:#fca5a5; font-weight:800; margin-bottom:6px;">❌ Flujo Fragmentado Tradicional:</div>
          <div style="color:#cbd5e1; margin-bottom:10px; font-size:12px;">Buscar artículos a mano, redactar correos uno por uno y enviar PDFs que nadie lee.</div>
          <div style="color:var(--lime); font-weight:800; margin-bottom:6px;">✅ Flujo Unificado Clase 4:</div>
          <div style="color:#ffffff; font-size:12px;">NotebookLM + Google Flow + Drive/Gmail/Calendar orquestados por <strong>Tenshi</strong> con 0% alucinación.</div>
        </div>
      </div>

      <!-- Grid de los 5 Prompts Conversacionales de la Clase 4 -->
      <div class="prompt-cards-grid">

        <!-- PROMPT 1: NOTEBOOKLM 0% ALUCINACIÓN -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 1 · NotebookLM 0% Alucinación</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Decreto 1072 + Res. 0312 + Cita Exacta</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">1. Conectar Google NotebookLM y Auditar Cumplimiento con 0% Alucinación</h3>
            <p class="p-card-explain">
              Vincula el cuaderno normativo de tu empresa en NotebookLM para auditar el estado real del SG-SST exigiendo cita literal al artículo y párrafo antes de actualizar WAPPY.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de tu Proyecto Empresarial:</div>
              <div class="chat-prompt-text" id="prompt-1">Estamos trabajando dentro del proyecto exclusivo de esta empresa (regla 1 Proyecto = 1 Empresa). Conéctate a mi cuaderno de Google NotebookLM donde están cargados el Decreto 1072 de 2015, la Resolución 0312 de 2019, la GTC 45, la Resolución 2764 de 2022 y las actas internas de la empresa.

Sin inventar ninguna norma (0% alucinación), realiza esta auditoría:
1. Cruza los documentos actuales de esta carpeta con los Estándares Mínimos de la Resolución 0312 y el Decreto 1072.
2. Por cada brecha o hallazgo detectado, cita literalmente el artículo, numeral y párrafo exacto extraído de NotebookLM.
3. Envía los hallazgos verificados al Diagnóstico 0312 y al Cronograma de Actividades de esta empresa en WAPPY IA.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Auditoría legal con cita exacta sincronizada en WAPPY.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-1', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 2: PODCAST A 2 VOCES + MAPA MENTAL -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 2 · Podcast 2 Voces &amp; Mapa Mental</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Inducción SST &amp; Personal en Ruta</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">2. Generar Guion, Podcast a 2 Voces y Mapa Mental para Inducción SST</h3>
            <p class="p-card-explain">
              Transforma procedimientos extensos o matrices de peligros en un podcast conversacional para trabajadores en ruta y un mapa mental visual para inducciones.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de tu Proyecto Empresarial:</div>
              <div class="chat-prompt-text" id="prompt-2">Usando únicamente las fuentes verificadas en NotebookLM y los peligros prioritarios registrados en WAPPY para esta empresa, genera un paquete pedagógico de inducción y reinducción SST:

1. Redacta y genera un Podcast conversacional a 2 voces (Host 1: Líder SST, Host 2: Operador/Conductor en ruta) de 4 minutos en lenguaje cercano colombiano explicando los controles críticos, pausas activas y reporte inmediato de condiciones inseguras.
2. Construye un Mapa Mental estructurado y los puntos clave para una Infografía ejecutiva de una sola página con el paso a paso en caso de accidente de trabajo (ATEL).
3. Guarda los entregables en la carpeta local "capacitaciones_generadas" y deja programada la evidencia en WAPPY.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Podcast a 2 voces + Mapa Mental + Infografía SST.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-2', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 3: GOOGLE FLOW CONTROLES ANTES/DESPUÉS Y PLAN DE EMERGENCIAS -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 3 · Google Flow Visual SST</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Controles Antes/Después + Emergencias</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">3. Generar Controles Visuales Antes/Después e Ilustraciones del Plan de Emergencias</h3>
            <p class="p-card-explain">
              Usa Google Flow para crear propuestas fotorrealistas de controles de ingeniería e ilustraciones técnicas claras para rutas de evacuación y puntos de encuentro.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de tu Proyecto Empresarial:</div>
              <div class="chat-prompt-text" id="prompt-3">Conéctate a Google Flow y apóyame con la producción visual preventiva para presentar a la Gerencia de esta empresa:

1. Toma las fotografías de hallazgos de la carpeta "inspecciones" y genera propuestas fotorrealistas comparativas "Antes vs. Después" aplicando la jerarquía de controles (guardas de seguridad, demarcación vial/peatonal ANSI, orden y aseo 5S y señalización).
2. Genera 4 ilustraciones técnicas limpias y de alta legibilidad para nuestro Plan de Emergencias: Ruta de Evacuación libre de obstáculos, Punto de Encuentro señalizado, Uso correcto de extintor multipropósito y Atención primaria de la Brigada.
3. Inserta las imágenes en un informe ejecutivo listo para aprobación presupuestal de Alta Dirección.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Comparativas Antes/Después + visuales de Emergencias.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-3', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 4: MICRO-VIDEO DE CAPACITACIÓN DE 3.5 MINUTOS -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 4 · Micro-Video 3.5 Minutos</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Skills Audiovisuales + Voz COPASST/Brigada</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">4. Producir Micro-Video de Capacitación de 3.5 Min para COPASST y Brigada</h3>
            <p class="p-card-explain">
              Activa los paquetes de Skills audiovisuales junto con locución de voz en Wappy Studio para entregar una cápsula formativa de 3.5 minutos lista para proyectar o compartir.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de tu Proyecto Empresarial:</div>
              <div class="chat-prompt-text" id="prompt-4">Utilizando los Skills de producción audiovisual de WAPPY y síntesis/clonación de voz en español colombiano, diseña y produce un micro-video ejecutivo de exactamente 3.5 minutos (210 segundos) para capacitar al COPASST y a la Brigada de Emergencias de esta empresa:

1. Estructura la escaleta en escenas limpias (una sola idea clave por escena, cero saturación visual): apertura con objetivo normativo, 3 responsabilidades prácticas en inspecciones y atención de emergencias, y cierre con llamado a la acción.
2. Sincroniza la locución de voz con los apoyos visuales generados en Google Flow y verifica las referencias legales en NotebookLM.
3. Registra la capacitación en el módulo de Capacitaciones de WAPPY IA para dejar trazabilidad de cumplimiento.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Micro-video de 3.5 min sincronizado con voz y trazabilidad.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-4', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 5: AUTOMATIZACIÓN INTEGRAL DRIVE + GMAIL + CALENDAR + /TAREAS CON TENSHI -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 5 · Workspace + /tareas con Tenshi</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Drive 20 Años + Gmail + Calendar + PHVA</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">5. Automatización Integral Drive + Gmail + Calendar + <code>/tareas</code> con Tenshi</h3>
            <p class="p-card-explain">
              Orquesta la triada Google Workspace junto con Tenshi y el centro de <code>/tareas</code> de WAPPY para archivar evidencias por 20 años, enviar reportes por correo y agendar comités.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de tu Proyecto Empresarial:</div>
              <div class="chat-prompt-text" id="prompt-5">Configura una automatización integral conectando este proyecto empresarial con Google Drive, Gmail, Google Calendar y Tenshi en el centro de /tareas de WAPPY IA:

1. Google Drive (Retención 20 años - Dec. 1072 Art. 2.2.4.6.13): Revisa los nuevos soportes de comités, inspecciones y validaciones documentales (RUES, PESV, Alturas y Aportes en Línea) y archívalos automáticamente por año y ciclo PHVA.
2. WAPPY IA + 7 Especialistas: Actualiza el estado de las tareas del cronograma, cierra las ACPM con soporte verificado y genera el resumen ejecutivo gerencial.
3. Gmail y Google Calendar: Prepara y envía el informe mensual de avance SST al correo de Gerencia y agenda en Google Calendar la próxima reunión del COPASST y las inspecciones pendientes con recordatorio.
4. Deja esta rutina programada en /tareas para que Tenshi la ejecute periódicamente y me reporte novedades.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Flujo completo Drive + Gmail + Calendar + /tareas activo.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-5', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ========================================================================
       5. TEMARIO PASO A PASO DE LA CLASE 4 (4 BLOQUES INTENSIVOS · 7:00 – 8:00 PM)
       ======================================================================== -->
  <section class="guide-section" id="guia-paso-a-paso">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">📘 Escaleta Pedagógica Oficial · 60 Minutos Intensivos (7:00 – 8:00 PM COT)</span>
          <h2 class="sec-big-title">Temario Paso a Paso · Clase 4: Antigravity + Wappy IA</h2>
        </div>
      </div>

      <div class="guide-blocks-grid">

        <!-- BLOQUE 1 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 1 · Proyectos por Empresa &amp; Lluvia de Ideas</span>
            <span class="g-time">⏱️ 7:00 – 7:15 PM (15 Minutos)</span>
          </div>
          <h3>Auditoría en Vivo de Carpetas Empresariales y Selección de Casos del Grupo</h3>
          <ul class="g-list">
            <li>
              <strong>Verificación de la regla <code>1 Proyecto = 1 Empresa</code>:</strong>
              Revisamos cómo cada participante estructuró carpetas independientes por cliente para proteger la confidencialidad y reducir hasta un 80% el consumo de tokens.
            </li>
            <li>
              <strong>Chequeo del Puente Reactivo de 3 Pasos:</strong>
              Confirmamos en vivo la sincronización inmediata entre Google Antigravity y los módulos operativos de Somos SST en WAPPY IA.
            </li>
            <li>
              <strong>Priorización de la Lluvia de Ideas:</strong>
              Seleccionamos los casos más retadores propuestos por los asistentes (validación RUES/PESV/Alturas/Aportes, seguimiento de comités e informes mensuales) para automatizarlos en sala.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 2 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 2 · Google NotebookLM Cero Alucinación</span>
            <span class="g-time">⏱️ 7:15 – 7:30 PM (15 Minutos)</span>
          </div>
          <h3>Blindaje Legal Exacto y Productos Ejecutivos (Podcasts, Mapas e Infografías)</h3>
          <ul class="g-list">
            <li>
              <strong>Conexión directa a cuadernos normativos SST:</strong>
              Vinculamos Decreto 1072 de 2015, Resolución 0312 de 2019, GTC 45, Resolución 2764 y actas internas exigiendo siempre cita exacta al párrafo.
            </li>
            <li>
              <strong>Podcasts conversacionales a 2 voces:</strong>
              Generamos episodios dinámicos pensados para conductores, personal en ruta y trabajadores operativos que no pueden detenerse a leer manuales extensos.
            </li>
            <li>
              <strong>Mapas Mentales e Infografías normativas:</strong>
              Síntesis ejecutiva lista para socializar en inducciones, reinducciones y reuniones gerenciales.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 3 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 3 · Google Flow &amp; Micro-Videos de 3.5 Min</span>
            <span class="g-time">⏱️ 7:30 – 7:45 PM (15 Minutos)</span>
          </div>
          <h3>Controles Fotorrealistas Antes/Después, Planes de Emergencia y Skills con Voz</h3>
          <ul class="g-list">
            <li>
              <strong>Ingeniería visual Antes / Después con Google Flow:</strong>
              Convertimos fotos reales de hallazgos en propuestas fotorrealistas con guardas, demarcación y controles instalados para acelerar aprobaciones de gerencia.
            </li>
            <li>
              <strong>Recreación preventiva y Rutas de Evacuación:</strong>
              Ilustramos lecciones aprendidas de incidentes y esquemas claros de Planes de Emergencia sin exponer la identidad de los trabajadores.
            </li>
            <li>
              <strong>Micro-Videos de 3.5 minutos con clonación/síntesis de voz:</strong>
              Combinamos los Skills audiovisuales y Wappy Apps para producir cápsulas de entrenamiento para el COPASST y las brigadas.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 4 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 4 · Google Workspace &amp; Orquestación con Tenshi</span>
            <span class="g-time">⏱️ 7:45 – 8:00 PM (15 Minutos)</span>
          </div>
          <h3>Drive (20 Años), Gmail, Calendar y Rutinas Autónomas en <code>/tareas</code></h3>
          <ul class="g-list">
            <li>
              <strong>Archivo legal automático en Google Drive:</strong>
              Estructuración documental alineada con los 20 años de conservación exigidos por el artículo 2.2.4.6.13 del Decreto 1072.
            </li>
            <li>
              <strong>Despacho por Gmail y agendamiento en Google Calendar:</strong>
              Redacción de informes ejecutivos para clientes y programación automática de comités, inspecciones y vencimientos críticos.
            </li>
            <li>
              <strong>Orquestación total con Tenshi y los 7 especialistas en <code>/tareas</code>:</strong>
              Dejamos conectadas las rutinas periódicas para consolidar reportes gerenciales PHVA y entregables HTML de alto valor comercial.
            </li>
          </ul>
        </div>

      </div>

      <!-- CTA Final de Acceso Oficial a Sala Google Meet -->
      <div class="final-cta-card">
        <div style="max-width: 650px;">
          <span style="color:var(--lime); font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
            🔴 Evento Oficial Confirmado · Antigravity + Wappy IA
          </span>
          <h3 style="font-family:var(--font-display); font-size:clamp(20px, 2.6vw, 30px); font-weight:900; margin:6px 0 8px;">
            Martes, 10 de Noviembre · 7:00 – 8:00 PM (Hora Colombia)
          </h3>
          <p style="font-size:14px; color:#cbd5e1;">
            Ten abierto el proyecto individual de tu empresa en Antigravity, tu puente de 3 pasos activo con WAPPY y conéctate puntual a nuestra sala oficial de Google Meet (Zona horaria: <code>America/Bogota</code>).
          </p>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="button" onclick="openNotesModal()" class="btn btn-glass">
            📋 Ver Checklist Previo
          </button>
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-lime">
            📹 Unirse a Google Meet (meet.google.com/yxv-gyhv-ron)
            <span class="arrow-pip">↗</span>
          </a>
        </div>
      </div>

      <footer>
        <p><strong>WAPPY IA · SOMOS SST</strong> · Especialización Práctica en Agentes Autónomos para Seguridad y Salud en el Trabajo</p>
        <p style="margin-top:4px;">wappy.club/clase4 · Evento: Antigravity + Wappy IA · Martes 10 de Noviembre · 7:00 – 8:00 PM (America/Bogota) · Docente Líder: Ing. Félix Bedoya</p>
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

# Write to client/public/clase4.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase4.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {pub_path} ({len(html_content)} bytes)")

# Write to Desktop
desktop_path = '/Users/venta/Desktop/clase4.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {desktop_path} ({len(html_content)} bytes)")
