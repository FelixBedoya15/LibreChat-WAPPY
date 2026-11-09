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
thumb_bg = get_base64_img('client/public/assets/thumb_bg_clase3.jpg')

if not cat_logo:
    cat_logo = logo_wappy

html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>WAPPY IA · Clase 3: Subagentes en Paralelo, Control Remoto Móvil, Fichas LOTO &amp; Puente WAPPY | SOMOS SST</title>
  <meta name="description" content="Clase 3 oficial grabada y guía paso a paso: elaboración de 40 Fichas LOTO con IA y HTML dinámico, subagentes trabajando en paralelo con auditoría visual, Control Remoto Móvil por código QR en Antigravity, regla 1 Proyecto = 1 Empresa, APIs públicas (RUES, Tránsito PESV, Aportes en Línea) y Puente WAPPY en 3 pasos.">
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
          <div class="sub">SOMOS SST · CLASE 3</div>
        </div>
      </a>

      <div class="nav-links">
        <a href="#presentacion" class="active-pill">🎬 Presentación</a>
        <a href="#grabacion">🎥 Grabación</a>
        <a href="#prompts-chat">💬 Prompts Clase 3</a>
        <a href="#guia-paso-a-paso">📘 Guía Paso a Paso</a>
      </div>

      <div class="nav-actions" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <a href="/clase4" class="btn btn-glass" style="padding:8px 13px; font-size:12px;">
          Ir a Clase 4 🔴 ↗
        </a>
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
      <a href="/clase2" class="course-org-pill done">✅ Clase 2 · Grabada</a>
      <a href="/clase3" class="course-org-pill active" aria-current="page">📍 Clase 3 · Estás aquí</a>
      <a href="/clase4" class="course-org-pill live">🔴 Clase 4 · Mar 10 Nov 7PM</a>
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
          <span>✅ Clase 03 Grabada · Jueves 5 de Noviembre · ~02:37 HRS</span>
        </div>

        <h1>
          Subagentes en Paralelo, <span class="highlight-lime">Control Remoto Móvil</span>, Fichas LOTO &amp; Puente WAPPY
        </h1>

        <p class="hero-sub">
          Revive paso a paso cómo generar <strong>40 Fichas LOTO con IA</strong> y transformarlas en presentaciones HTML ejecutivas, activar el nuevo <strong>Control Remoto por Código QR</strong> desde tu celular, cargar el <strong>Manual HTML del Equipo Agente</strong> en Modo Turbo, separar <strong>1 Proyecto por Empresa</strong>, consultar <strong>RUES, Tránsito (PESV) y Aportes en Línea</strong>, y enlazar el <strong>Puente WAPPY en 3 pasos</strong>.
        </p>

        <div class="hero-ctas">
          <a href="#grabacion" class="btn btn-dark">
            🎥 Ver Grabación Clase 3
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
            <div class="hero-pill-label">🔒 Caso Real en Planta</div>
            <div class="hero-pill-val">40 Fichas LOTO + HTML</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">📱 Novedad Antigravity</div>
            <div class="hero-pill-val">Control Remoto QR Móvil</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🏢 Regla Multi-Empresa</div>
            <div class="hero-pill-val">1 Proyecto = 1 Empresa</div>
          </div>
          <div class="hero-pill-item">
            <div class="hero-pill-label">🔌 Ecosistema Activo</div>
            <div class="hero-pill-val">Puente 3 Pasos + Scraping</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta Interactiva de Tenshi en el Hero -->
      <div class="hero-tenshi-card">
        <div class="hero-tenshi-glow"></div>
        <img src="{tenshi_img}" alt="Tenshi IA" class="tenshi-avatar-floating">
        <div class="tenshi-bubble">
          «¡Hola! Soy <strong>Tenshi</strong>. En esta <strong>Clase 3</strong> dimos el salto a <strong>subagentes trabajando en paralelo</strong>, conectamos tu celular por <strong>código QR</strong> y enlazamos el puente local con <strong>WAPPY</strong>. ¡Revisa tus 13 compromisos antes de la Clase 4!»
        </div>
        <div class="meet-live-strip">
          <div style="text-align:left;">
            <div style="font-size:10px; text-transform:uppercase; color:#99f6e4; font-weight:800;">Próxima Sesión: Clase 4 en Vivo</div>
            <div style="font-weight:900; color:#fff;">meet.google.com/yxv-gyhv-ron</div>
          </div>
          <a href="/clase4" class="btn btn-lime" style="padding:8px 14px; font-size:12px;">
            Ir a Clase 4 🔴 ↗
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
          <span class="sec-kicker">✨ Presentación Oficial · Síntesis Estructurada Clase 3</span>
          <h2 class="sec-big-title">Diapositivas Dinámicas de la Clase 3 (10 Slides)</h2>
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
            <span>WAPPY.CLUB // CLASE_03 // SUBAGENTES_CONTROL_REMOTO_Y_PUENTE_WAPPY</span>
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
          <button class="slide-num-pill" onclick="showSlide(2)">02 40 Fichas LOTO</button>
          <button class="slide-num-pill" onclick="showSlide(3)">03 Vibe-Coding HTML</button>
          <button class="slide-num-pill" onclick="showSlide(4)">04 Subagentes + Cron 7AM</button>
          <button class="slide-num-pill" onclick="showSlide(5)">05 Control Remoto QR</button>
          <button class="slide-num-pill" onclick="showSlide(6)">06 Manual HTML + Marca</button>
          <button class="slide-num-pill" onclick="showSlide(7)">07 1 Proyecto = 1 Empresa</button>
          <button class="slide-num-pill" onclick="showSlide(8)">08 RUES + PESV + Aportes</button>
          <button class="slide-num-pill" onclick="showSlide(9)">09 Puente 3 Pasos WAPPY</button>
          <button class="slide-num-pill" onclick="showSlide(10)">10 Clonación Voz + Clase 4</button>
        </div>

        <div class="slide-viewport" id="slide-viewport">

          <!-- ==================== SLIDE 1: PORTADA CLASE 3 ==================== -->
          <div class="slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge lime">🚀 Clase 3 Oficial · Jueves 5 de Noviembre</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">DURACIÓN REAL: ~02:37 HRS</span>
            </div>
            <h2>Subagentes en Paralelo, <span class="accent-lime">Control Remoto Móvil</span>, Fichas LOTO &amp; <span class="accent-teal">Puente WAPPY</span></h2>
            <p class="slide-lead">
              Pasamos de un único chat operativo a orquestar un <strong>equipo de subagentes trabajando simultáneamente</strong>, controlar Antigravity desde el celular por <strong>código QR</strong>, automatizar consultas externas (RUES, Tránsito, Aportes en Línea) y conectar el <strong>Puente WAPPY en 3 pasos</strong>.
            </p>

            <div class="s-grid-4" style="margin-bottom: 16px;">
              <div class="s-card glow-lime">
                <div style="font-size:24px; font-weight:900; color:var(--lime);">40 Fichas</div>
                <h4>Caso LOTO en Planta</h4>
                <p>Bloqueo y etiquetado con puntos críticos en amarillo y paso de Excel a HTML ejecutivo.</p>
              </div>
              <div class="s-card glow-teal">
                <div style="font-size:24px; font-weight:900; color:var(--teal-bright);">QR Móvil</div>
                <h4>Remote Control Cloud</h4>
                <p>Conexión remota desde el navegador o celular activando <em>Remote Control</em> en Settings.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#fcd34d;">1 = 1</div>
                <h4>Proyecto por Empresa</h4>
                <p>Aislamiento total por cliente con detección automática de NIT, marca, logos y colores.</p>
              </div>
              <div class="s-card">
                <div style="font-size:24px; font-weight:900; color:#a78bfa;">3 Pasos</div>
                <h4>Puente + Web Scraping</h4>
                <p>Enlace local WAPPY + consultas automatizadas en RUES, SIMIT, Alturas y Aportes en Línea.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 2: CASO REAL 40 FICHAS LOTO ==================== -->
          <div class="slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔒 Caso Real en Planta · 00:01 – 00:11</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CAROLINA COLORADO CANO · PLAN PRO $20K</span>
            </div>
            <h2>40 Fichas LOTO Mejoradas con IA y Paso de <span class="accent-lime">Excel a HTML Dinámico</span></h2>
            <p class="slide-lead">
              Carolina Colorado demostró en pantalla el contraste real entre las fichas originales del cliente y las <strong>40 fichas de Bloqueo y Etiquetado (LOTO)</strong> enriquecidas con instrucciones precisas:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>⚡ Energías y Puntos de Bloqueo</h4>
                <p>Identificación detallada por máquina de energías peligrosas (eléctrica, neumática, hidráulica, mecánica), dispositivos de corte y secuencia segura de desenergización.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🟨 Alertas Amarillas para Campo</h4>
                <p>La IA resalta automáticamente en <strong>color amarillo</strong> los válvulas, brekers o datos técnicos pendientes de verificación física en planta antes de validar la ficha.</p>
              </div>
              <div class="s-card">
                <h4>📊 De Excel Inestable a HTML + Plan $20K</h4>
                <p>Ante cierres inesperados de Excel pesados y límites de tokens, se acordó sustentar las fichas en <strong>presentación HTML dinámica</strong> y aprovechar el <strong>Plan Pro promocional ($20.000 COP/mes)</strong>.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 3: VIBE-CODING VISUAL EN HTML ==================== -->
          <div class="slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge teal">🎨 Diseño Ejecutivo sin Programar · 00:15 &amp; 02:17</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">CERO EDICIÓN MANUAL DE CÓDIGO</span>
            </div>
            <h2>Vibe-Coding Visual en HTML y <span class="accent-lime">Copias Directas en el Escritorio</span></h2>
            <p class="slide-lead">
              Ante dudas de formato HTML reportadas en clase, la regla práctica es <strong>jamás corregir código a mano</strong>: guiamos al agente por lo que vemos en pantalla y pedimos entregas listas para abrir con doble clic.
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>📸 Refinar con Capturas de Pantalla</h4>
                <p>
                  • Abre el archivo HTML generado en tu navegador.<br>
                  • Si un cuadro, color o tabla no te convence, toma una <strong>captura de pantalla</strong>, pégala en el chat y dile en lenguaje natural qué ajustar.<br>
                  • Cierra las pestañas de código interno para trabajar sin ruido visual.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🖥️ Copias Automáticas en el Escritorio</h4>
                <p>
                  • Para no perder tiempo buscando entre subcarpetas del proyecto, incluye siempre al final: <em>«Guarda también una copia lista para abrir en mi Escritorio»</em>.<br>
                  • Ideal para sustentaciones gerenciales, comités y entregas inmediatas al cliente.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 4: REGLAS, SKILLS Y SUBAGENTES EN PARALELO ==================== -->
          <div class="slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge lime">🤖 Orquestación Multi-Agente · 00:11 – 00:25</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">AGENTS.MD + SKILL.MD + CRON 7:00 AM</span>
            </div>
            <h2>Reglas (<code>AGENTS.md</code>), Skills (<code>SKILL.md</code>) y <span class="accent-lime">Subagentes en Paralelo</span></h2>
            <p class="slide-lead">
              Superamos las consultas básicas estructurando un equipo especialista que piensa rápido, ejecuta en paralelo y audita visualmente cada entregable antes de mostrártelo:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>📜 Reglas + Roles Expertos</h4>
                <p>Las reglas de proyecto evitan razonamientos eternos y las <strong>Skills</strong> dotan a cada subagente de maestría técnica (riesgo eléctrico, matrices, CSS/SVG dinámico o indicadores ATEL).</p>
              </div>
              <div class="s-card glow-teal">
                <h4>👁️ Ejecución Paralela + Auditor Visual</h4>
                <p>Varios subagentes trabajan al mismo tiempo en una sola orden mientras un <strong>subagente de auditoría visual</strong> revisa que el HTML cumpla estándares estéticos y normativos.</p>
              </div>
              <div class="s-card">
                <h4>⏰ Automatizaciones Cron (7:00 AM)</h4>
                <p>Caso real con <em>triggers</em> temporales: el PC se activa a las <strong>7:00 AM</strong>, revisa carpetas del SG-SST y genera bitácoras operativas sin intervención humana.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 5: CONTROL REMOTO MÓVIL DE ANTIGRAVITY ==================== -->
          <div class="slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge teal">📱 Novedad Cloud / Móvil · 00:26 – 00:59</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">SETTINGS → REMOTE CONTROL → QR</span>
            </div>
            <h2>Control Remoto Móvil de Antigravity por <span class="accent-lime">Enlace o Código QR</span></h2>
            <p class="slide-lead">
              Ahora puedes comandar la instancia local de tu computador desde cualquier lugar usando el navegador de tu teléfono móvil:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>⚙️ 1. Habilitar en Settings</h4>
                <p>Entra a <strong>Settings → Applications / Remote Control</strong> en Antigravity (desde tu PC) y activa el interruptor de acceso remoto para generar tu sesión segura.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🛡️ 2. Permisos de Red Windows/Mac</h4>
                <p>Cuando el sistema operativo muestre el aviso del Firewall, concede permisos tanto en <strong>redes privadas como públicas</strong> para evitar que la pantalla quede cargando.</p>
              </div>
              <div class="s-card">
                <h4>📲 3. Escanear QR o Enviar por WhatsApp</h4>
                <p>Escanea el <strong>código QR</strong> con la cámara del celular o envíate el enlace directo por WhatsApp para destrabar al instante la sesión móvil y conectar Drive/Canva/Notion desde el PC.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 6: MANUAL HTML DEL EQUIPO AGENTE + IDENTIDAD CORPORATIVA ==================== -->
          <div class="slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge lime">🧬 Despliegue Instantáneo · 01:00 – 01:15</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">MODO TURBO + AUTO-BRANDING</span>
            </div>
            <h2>Manual HTML del Equipo Agente + <span class="accent-lime">Identidad Corporativa Automática</span></h2>
            <p class="slide-lead">
              En lugar de redactar decenas de reglas desde cero, arrastramos el <strong>Manual HTML compartido en WhatsApp</strong> dentro de un chat nuevo en <strong>Modo Turbo</strong>:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>⚡ Carga Limpia en Modo Turbo</h4>
                <p>
                  1. Activa <strong>Modo Turbo</strong> (flechita junto al micrófono) para que no pida confirmaciones constantes.<br>
                  2. Usa el botón <code>+</code> (Archivos) o arrastra el <strong>Manual HTML del Equipo Agente</strong> al chat nuevo y presiona <code>Enter</code> sin texto adicional.<br>
                  3. Reutiliza configuraciones entre espacios con el <em>Conversation ID</em> o anclando tu chat instructivo.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🏢 Detección Automática de Marca Empresarial</h4>
                <p>
                  Al leer la carpeta del SG-SST de la empresa, Antigravity identifica y guarda automáticamente:<br>
                  • <strong>NIT, Razón Social, Representante Legal y Sector Económico.</strong><br>
                  • <strong>Paleta de colores oficial, tipografía y logotipos</strong> para aplicarlos en cada informe, matriz o ficha HTML.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 7: REGLA DE ORO MULTI-EMPRESA ==================== -->
          <div class="slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge amber">⚠️ Regla Inquebrantable de Arquitectura · 01:16 &amp; 02:02</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">CERO MEZCLA DE CLIENTES</span>
            </div>
            <h2>Regla de Oro Multi-Empresa: <span class="accent-lime">1 Proyecto (Carpeta) = 1 Empresa</span></h2>
            <p class="slide-lead">
              Si asesoras a 3, 5 o más compañías (como el caso de Gloria Amparo con 5 empresas), <strong>jamás mezcles varios clientes en una misma carpeta de proyecto</strong>:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🗂️ Aislamiento Total por Compañía</h4>
                <p>
                  • Mezclar empresas en un solo espacio produce <strong>respuestas híbridas erróneas</strong>, cruza matrices de peligros y confunde convenios o IPS.<br>
                  • Crea <strong>1 carpeta independiente = 1 proyecto en Antigravity</strong> por cada NIT y desconecta en <em>Project Settings</em> los subagentes que esa empresa no necesite.
                </p>
              </div>
              <div class="s-card glow-teal">
                <h4>🏛️ Centros de Trabajo Inactivos = Gestión del Cambio</h4>
                <p>
                  • Ante la consulta de Xiomara Ardila: <strong>NUNCA elimines centros de trabajo antiguos o cerrados en WAPPY</strong>.<br>
                  • Deben conservarse intactos como trazabilidad histórica obligatoria del SG-SST y soporte auditable de <strong>Gestión del Cambio</strong>.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 8: APIS PÚBLICAS, CHROME DEVTOOLS Y WEB SCRAPING SST ==================== -->
          <div class="slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge teal">🌐 Investigación Autónoma en Web · 01:33 – 01:43 &amp; 02:33</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#5eead4;">APIS + CHROME TOOLS + SCRAPING</span>
            </div>
            <h2>APIs Públicas, Chrome Tools y <span class="accent-lime">Web Scraping Aplicado a SST</span></h2>
            <p class="slide-lead">
              Activando las herramientas de navegador (<em>Chrome DevTools</em>) y conectando APIs públicas, los subagentes consultan portales oficiales colombianos por ti:
            </p>

            <div class="s-grid-4">
              <div class="s-card glow-lime">
                <h4>🏛️ RUES Empresarial</h4>
                <p>Extracción automática de cámara de comercio, actividad económica CIIU y estado registral de contratistas.</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🚚 Tránsito / PESV</h4>
                <p>Consulta masiva de comparendos y multas de tránsito por <strong>cédula o placa vehicular</strong> para auditoría PESV.</p>
              </div>
              <div class="s-card">
                <h4>🧗 Alturas MinTrabajo</h4>
                <p>Verificación cruzada de autenticidad de <strong>certificados de trabajo en alturas</strong> frente al registro del Ministerio.</p>
              </div>
              <div class="s-card">
                <h4>📑 Aportes en Línea</h4>
                <p>Proyecto práctico con API/scraping para validar planillas de seguridad social, ingresos, retiros y novedades ( más integración contable tipo Siigo).</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 9: PUENTE ECOSISTEMA WAPPY <-> ANTIGRAVITY EN 3 PASOS ==================== -->
          <div class="slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge lime">🔌 Integración Oficial Ecosistema · 01:48 – 02:11</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">3 PASOS + SKILLS AUDIOVISUALES</span>
            </div>
            <h2>Puente <span class="accent-lime">WAPPY ↔ Antigravity</span> en 3 Pasos + Paquete Audiovisual</h2>
            <p class="slide-lead">
              Unimos las carpetas locales de tus proyectos con la metodología predictiva de reducción de accidentalidad de WAPPY IA:
            </p>

            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <h4>🔑 Paso 1 y 2: Clave Local + Enlace</h4>
                <p>En <strong>Perfil → Integraciones / Conector MCP</strong> de WAPPY genera tu API Key en modo <em>Trabajo Local</em>, pega el comando del Paso 1 en un chat nuevo de Antigravity y ejecuta el Paso 2 de verificación (autorizando Node.js si lo solicita).</p>
              </div>
              <div class="s-card glow-teal">
                <h4>🎬 Paquete de Skills de Diseño y Video</h4>
                <p>En un chat separado, pega el paquete de habilidades audiovisuales de WAPPY para que tus agentes produzcan presentaciones, gráficas y micro-videos preventivos.</p>
              </div>
              <div class="s-card">
                <h4>📋 Perfiles de Cargo y Actos Predictivos</h4>
                <p>Con el puente activo, Antigravity lee tus carpetas locales y actualiza automáticamente <strong>Perfiles de Cargo</strong> y módulos en WAPPY enfocados en intervención predictiva de accidentalidad.</p>
              </div>
            </div>
          </div>

          <!-- ==================== SLIDE 10: CLONACIÓN DE VOZ + PREPARACIÓN CLASE 4 ==================== -->
          <div class="slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge amber">🎙️ Futuro Inmediato + Reto Clase 4 · 02:11 – 02:36</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fcd34d;">NOTEBOOKLM + GOOGLE FLOW + VOZ PROPIA</span>
            </div>
            <h2>Clonación de Voz en <span class="accent-lime">Wappy Apps</span> y Preparación <span class="accent-teal">Clase 4</span></h2>
            <p class="slide-lead">
              Cerramos la sesión proyectando capacitaciones con tu propia voz clonada, tableros gerenciales PHVA y alistando el terreno para conectar NotebookLM y Google Flow:
            </p>

            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <h4>🎙️ Clonación de Voz + Vigilancia PHVA</h4>
                <p>
                  • <strong>Tu propia voz en capacitaciones:</strong> <em>Wappy Apps</em> ya incorpora clonación de voz para crear inducciones y cápsulas interactivas de 3 a 4 minutos con avatares.<br>
                  • <strong>Vigilancia continua:</strong> repositorios en Drive + Antigravity monitoreando actas de <strong>COPASST y Comité de Convivencia</strong> para reportes gerenciales en tiempo real, practicando 30 minutos diarios.
                </p>
              </div>
              <div class="s-card glow-teal" style="display:flex; flex-direction:column; justify-content:center;">
                <h4>🚀 Lista de Chequeo para la Clase 4 (Mar 10 Nov)</h4>
                <p style="margin-bottom:12px;">
                  1. Tener tus empresas separadas (<strong>1 Proyecto = 1 Empresa</strong>) y el Puente WAPPY verificado.<br>
                  2. Traer tu <strong>lluvia de ideas de automatizaciones</strong> lista para conectar <strong>NotebookLM</strong> (podcasts, infografías, mapas mentales) y <strong>Google Flow</strong> (planes de emergencia e imágenes SST).
                </p>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <a href="#prompts-chat" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
                    Copiar los 5 Prompts de Clase 3 ↓
                  </a>
                  <a href="/clase4" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
                    Ir a Clase 4 🔴 ↗
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
          <span class="sec-kicker">🎥 Repetición Oficial Completa · Clase 3 (Jueves 5 de Noviembre)</span>
          <h2 class="sec-big-title">Grabación de la Clase 3 &amp; Memorias Oficiales</h2>
        </div>
        <div style="font-size: 13px; color: var(--ink-muted); font-weight: 600;">
          💡 Reproduce aquí mismo la clase completa o abre debajo el <strong>Popup de Notas Oficiales y 13 Compromisos</strong>
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
            <span>WAPPY.CLUB // GRABACIÓN_OFICIAL // CLASE_03_SUBAGENTES</span>
          </div>
          <div class="deck-controls-top">
            <span class="deck-counter-badge">DURACIÓN: ~02:37 HRS · HD</span>
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
          <span class="rec-chapter-pill"><strong>00:01</strong> 40 Fichas LOTO</span>
          <span class="rec-chapter-pill"><strong>00:14</strong> Subagentes y Vibe-Coding</span>
          <span class="rec-chapter-pill"><strong>00:26</strong> Control Remoto QR</span>
          <span class="rec-chapter-pill"><strong>01:02</strong> Manual HTML y Marca</span>
          <span class="rec-chapter-pill"><strong>01:16</strong> 1 Proyecto = 1 Empresa</span>
          <span class="rec-chapter-pill"><strong>01:33</strong> APIs, RUES y Tránsito</span>
          <span class="rec-chapter-pill"><strong>01:48</strong> Puente 3 Pasos WAPPY</span>
          <span class="rec-chapter-pill"><strong>02:23</strong> Clonación Voz y Aportes en Línea</span>
        </div>

        <!-- Reproductor Embebido 16:9 de Google Drive con Miniatura Oficial -->
        <div class="video-viewport-wrap">
          <div class="video-aspect-box">
            <!-- Miniatura Oficial Personalizada HD 16:9 (Fondo Cinemático + Félix + WAPPY + Tenshi + CLASE 3) -->
            <div class="video-thumb-cover" id="video-thumb-cover" onclick="playRecordingVideo()">
              <img src="{thumb_bg}" alt="" class="video-thumb-bg-img" aria-hidden="true">
              <div class="video-thumb-radial-overlay"></div>
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{felix_avatar}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Logos WAPPY + Antigravity + CLASE 3 + Píldoras + Botón Play -->
              <div class="thumb-center-col">
                <div class="thumb-logos-pill">
                  <img src="{wappy_horiz_logo}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{agy_logo}" alt="Google Antigravity" class="agy-i">
                </div>

                <div class="thumb-clase-giant">CLASE 3</div>

                <div class="thumb-sub-title">
                  Subagentes en Paralelo, <span>Control Remoto QR</span> &amp; <span>Fichas LOTO</span>
                </div>

                <div class="thumb-topic-pills">
                  <span class="thumb-topic-pill">🔒 40 FICHAS LOTO</span>
                  <span class="thumb-topic-pill">🤖 SUBAGENTES PARALELOS</span>
                  <span class="thumb-topic-pill">📱 CONTROL REMOTO QR</span>
                  <span class="thumb-topic-pill highlight">⏱️ 02:37 HRS · HD</span>
                </div>

                <div class="thumb-play-cta">
                  <span class="thumb-play-icon">▶</span>
                  <span>VER GRABACIÓN COMPLETA CLASE 3</span>
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
              src="https://drive.google.com/file/d/1WSTET2BrNUH3kEYOw2iyfkmosWE-Mu1Q/preview"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowfullscreen
              loading="lazy"
              title="Grabación Oficial Clase 3 - Subagentes en Paralelo, Control Remoto Móvil y Puente WAPPY">
            </iframe>
          </div>
        </div>

        <!-- BARRA DEBAJO DEL VIDEO CON EL BOTÓN PARA ABRIR EL POPUP DE NOTAS -->
        <div class="notes-trigger-bar">
          <div class="notes-trigger-info">
            <h3>📝 Bitácora Oficial, Resumen, 13 Tareas y Minuto a Minuto · Clase 3</h3>
            <p>Consulta todas las notas tomadas en la sesión del 5 de Noviembre, los 13 próximos pasos del grupo y el desglose completo con marcas de tiempo (00:00:05 – 02:35:59).</p>
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
            <a href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?tab=t.3g8n5l81jiwj" target="_blank" rel="noopener noreferrer" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              📑 Documento de Notas
            </a>
            <a href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank" rel="noopener noreferrer" class="btn btn-glass" style="padding:9px 15px; font-size:12.5px;">
              📄 Ver Transcripción Completa
            </a>
            <a href="https://drive.google.com/file/d/1WSTET2BrNUH3kEYOw2iyfkmosWE-Mu1Q/view" target="_blank" rel="noopener noreferrer" class="btn btn-lime" style="padding:9px 16px; font-size:12.5px;">
              ▶️ Abrir Video en Google Drive ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       MODAL / POPUP INTERACTIVO CON TODAS LAS NOTAS DE LA CLASE 1 (OCT 20, 2026)
       ======================================================================== -->
  <div class="notes-modal-backdrop" id="notes-modal" onclick="handleBackdropClick(event)">
    <div class="notes-modal-window" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
      <div class="notes-modal-header">
        <div class="notes-modal-title-wrap">
          <h3 id="notes-modal-title">📝 Notas Oficiales y Memorias · Clase III: Subagentes, Control Remoto &amp; Puente WAPPY</h3>
          <p>Fecha: Jueves 5 de Noviembre de 2026 · Docente: Ing. Félix Bedoya · Duración: ~02:37 HRS · Registros Oficiales</p>
        </div>
        <button type="button" class="btn-close-modal" onclick="closeNotesModal()">✕ Cerrar Ventana</button>
      </div>

      <div class="notes-tabs-bar">
        <div class="notes-tab-group">
          <button type="button" class="notes-tab-btn active" id="ntab-all" onclick="switchNotesTab('all')">🌟 Ver Todo</button>
          <button type="button" class="notes-tab-btn" id="ntab-resumen" onclick="switchNotesTab('resumen')">📌 Resumen Ejecutivo</button>
          <button type="button" class="notes-tab-btn" id="ntab-pasos" onclick="switchNotesTab('pasos')">✅ Próximos Pasos (13 Tareas)</button>
          <button type="button" class="notes-tab-btn" id="ntab-detalles" onclick="switchNotesTab('detalles')">⏱️ Minuto a Minuto (00:00 – 02:36)</button>
        </div>
      </div>

      <div class="notes-modal-body">

        <div class="n-links-strip">
          <div style="font-size:12.5px; font-weight:800; color:#5eead4;">
            📎 Archivos Adjuntos y Registros Oficiales de la Reunión:
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="https://calendar.google.com/calendar/event?eid=MTIwbjU2ZjdidWQydHY0ZnQxcjI4ODlhNmQgd2FwcHlpbnRlcmFjdGl2b0Bt" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📅 Evento Calendar</a>
            <a href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?tab=t.3g8n5l81jiwj" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📑 Documento de Notas</a>
            <a href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank" rel="noopener noreferrer" class="n-doc-btn">📄 Transcripción Oficial</a>
            <a href="https://drive.google.com/file/d/1WSTET2BrNUH3kEYOw2iyfkmosWE-Mu1Q/view" target="_blank" rel="noopener noreferrer" class="n-doc-btn">🎥 Grabación en Drive</a>
          </div>
        </div>

        <!-- SECCIÓN 1: RESUMEN EJECUTIVO -->
        <div class="notes-pane active" data-npane="resumen">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            📌 1. Resumen Ejecutivo de la Sesión
          </div>
          <div class="s-grid-2">
            <div class="s-card glow-lime n-section-card">
              <h4>🔒 Fichas LOTO con IA, Tokens y Vibe-Coding HTML</h4>
              <p>Demostración real de <strong>40 fichas LOTO</strong> mejoradas con inteligencia artificial (puntos de bloqueo, tipos de energía y alertas en amarillo para verificar en campo), transición de archivos Excel inestables hacia <strong>presentaciones HTML dinámicas</strong> con copias en el escritorio y recomendación del plan Pro ($20.000 COP/mes).</p>
            </div>
            <div class="s-card glow-teal n-section-card">
              <h4>🤖 Subagentes en Paralelo, Control Remoto QR y Marca</h4>
              <p>Configuración de reglas, habilidades (<em>skills</em>) y subagentes simultáneos (incluyendo auditoría visual y tareas programadas a las 7:00 AM), activación del nuevo <strong>Control Remoto móvil por código QR</strong> en Settings y carga del <strong>Manual HTML del Equipo Agente</strong> en Modo Turbo con detección automática de NIT, marca y logos.</p>
            </div>
            <div class="s-card n-section-card">
              <h4>🏢 Separación 1 Proyecto = 1 Empresa y Web Scraping SST</h4>
              <p>Regla crítica de crear carpetas independientes por compañía para evitar respuestas híbridas, conservar centros inactivos por <strong>Gestión del Cambio</strong> y potenciar subagentes con Chrome Tools, APIs públicas y <em>web scraping</em> para consultar <strong>RUES, multas de tránsito (PESV), certificados de alturas y Aportes en Línea</strong>.</p>
            </div>
            <div class="s-card n-section-card">
              <h4>🔌 Puente WAPPY en 3 Pasos, Clonación de Voz y Clase 4</h4>
              <p>Vinculación local entre WAPPY y Antigravity mediante claves API en 3 pasos, instalación del paquete de skills de diseño/video, actualización automática de perfiles de cargo, avance de <strong>clonación de voz en Wappy Apps</strong> y preparación de NotebookLM + Google Flow para la Clase 4.</p>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: PRÓXIMOS PASOS (13 TAREAS OFICIALES) -->
        <div class="notes-pane active" data-npane="pasos">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ✅ 2. Próximos Pasos y Compromisos de la Clase 3 (13 Tareas Oficiales)
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya</span>
            <div><strong>1. Revisar Excel:</strong> Investigar y corregir el error recurrente que causa el cierre inesperado de los archivos de Excel generados al abrirlos.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Carolina Colorado Cano</span>
            <div><strong>2. Generar HTML LOTO:</strong> Solicitar en Antigravity la creación de una presentación dinámica en formato HTML para sustentar los informes de las 40 fichas LOTO con los equipos de trabajo.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>3. Activar Control Remoto:</strong> Habilitar la opción de <em>Remote Control</em> en la sección de Settings de Antigravity para permitir el acceso remoto desde navegador o celular por código QR.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya</span>
            <div><strong>4. Conectar Antigravity (Soporte):</strong> Ayudar a María Elena Obando Colonia a establecer la conexión completa de la aplicación en su dispositivo durante la sesión corta programada.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>5. Preparar ideas de automatización:</strong> Definir y alistar ideas específicas de procesos operativos de SST para automatizar en la próxima clase con NotebookLM y Google Flow.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Gloria Amparo Quintero</span>
            <div><strong>6. Separar proyectos por empresa:</strong> Crear un proyecto y carpeta independiente en Antigravity para cada una de las 5 empresas a su cargo para evitar confusión o mezcla de procesos.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>7. Configurar integración WAPPY y Antigravity:</strong> Completar el enlace del ecosistema WAPPY con Antigravity en sus proyectos siguiendo los 3 pasos indicados en la plataforma y el paquete de skills audiovisuales.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>8. Organizar chat instructivo:</strong> Renombrar y anclar un chat nuevo como instructivo maestro de creación de subagentes y reglas para mantener organizadas las directrices.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>9. Buscar nuevas herramientas y APIs:</strong> Investigar APIs públicas o bases de datos gratuitas aplicables a SST para incorporarlas como nuevas habilidades (<em>skills</em>) en los subagentes.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya</span>
            <div><strong>10. Realizar retroalimentación individual:</strong> Brindar una sesión corta de refuerzo a María Elena Obando Colonia apoyándose en el video grabado de la clase.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>11. Lluvia de ideas empresariales:</strong> Preparar el listado priorizado de automatizaciones deseadas para implementar en cada empresa administrada.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El Grupo</span>
            <div><strong>12. Organizar proyectos discriminados:</strong> Dejar dispuestos y separados los proyectos de los sistemas de gestión para los ejercicios prácticos de la Clase 4.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">Félix Bedoya &amp; Xiomara Ardila</span>
            <div><strong>13. Configurar Aportes en Línea:</strong> Acompañar a Xiomara Ardila en la conexión e integración del sistema de planillas de Aportes en Línea con Antigravity como proyecto práctico del curso.</div>
          </div>
        </div>

        <!-- SECCIÓN 3: MINUTO A MINUTO DETALLADO (00:00:05 – 02:35:59) -->
        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ⏱️ 3. Bitácora Minuto a Minuto de la Reunión (00:00:05 – 02:35:59)
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>1. Apertura, 40 Fichas LOTO con IA, incidente Excel y paso a HTML</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:00:05</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:01:24</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:06:58</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:10:28</a>
              </span>
            </h4>
            <p>Félix Bedoya abre el espacio de dudas y Carolina Colorado Cano demuestra cómo generó <strong>40 fichas LOTO</strong> detalladas (puntos de bloqueo, tipos de energía y alertas en amarillo para verificar en planta). Reporta cierres inesperados al abrir Excels generados; se recomienda el plan Pro de $20.000 COP/mes y transformar la sustentación LOTO en una presentación HTML dinámica.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>2. Reglas, subagentes en paralelo, Vibe-Coding visual y Cron 7:00 AM</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:11:24</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:15:15</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:22:48</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:25:14</a>
              </span>
            </h4>
            <p>Félix explica cómo configurar reglas de proyecto, habilidades especializadas (HTML/CSS/SVG, riesgo eléctrico) y múltiples subagentes trabajando en paralelo junto con un subagente de auditoría visual. Recomienda a Gloria Amparo aplicar <em>vibe-coding</em> con capturas de pantalla sin tocar código manual, y expone un caso real donde el PC despierta a las 7:00 AM para auditar carpetas y crear bitácoras automáticamente.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>3. Activación de Control Remoto Móvil (Cloud/QR), permisos de red y personalización</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:26:14</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:35:08</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:47:08</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">00:52:52</a>
              </span>
            </h4>
            <p>Presentación de la función <em>Remote Control</em> en Settings para operar Antigravity desde navegador o celular. Se resuelven permisos de Firewall en redes públicas y privadas, se muestra la conexión desde PC con Google Drive, Chrome DevTools, OneDrive, Canva, Notion y WordPress, y Mauricio Posada junto con Carolina Colorado validan el escaneo del código QR o envío del link por WhatsApp para conectar desde el teléfono.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>4. Carga del Manual HTML del Equipo Agente, Modo Turbo e Identidad Corporativa</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:00:02</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:04:07</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:07:25</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:11:13</a>
              </span>
            </h4>
            <p>Los participantes descargan del grupo de WhatsApp el manual HTML del equipo agente y lo envían en un chat nuevo por proyecto activando antes el <strong>Modo Turbo</strong> (flechita junto al micrófono). Félix demuestra cómo el sistema extrae de inmediato la identidad corporativa de la empresa: NIT, representante legal, sector económico, paleta de colores, tipografía y logotipos.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>5. Separación estricta 1 Proyecto = 1 Empresa, historiales y Conversation ID</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:16:51</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:21:04</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:29:38</a>
              </span>
            </h4>
            <p>Ante la gestión multi-empresa de Gloria Amparo, Félix advierte crear siempre carpetas y proyectos separados por compañía para evitar respuestas híbridas en matrices o IPS. Explica cómo sumar subagentes en lenguaje coloquial (facturación, accidentalidad), reutilizar configuraciones con el <em>Conversation ID</em> y nutrir subagentes con páginas web externas.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>6. APIs públicas, Chrome Tools, Web Scraping (RUES, Tránsito, Aportes) y Project Settings</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:33:05</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:35:57</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:39:38</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:44:49</a>
              </span>
            </h4>
            <p>Demostración de conexión con APIs gratuitas, Chrome Tools para consultar multas de tránsito por cédula o placa vehicular, y <em>web scraping</em> en RUES, Aportes en Línea y facturación tipo Siigo. Revisión de <em>Project Settings</em> para auditar reglas, skills, conectores MCP y apagar subagentes innecesarios según el giro de cada cliente.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>7. Puente WAPPY ↔ Antigravity en 3 pasos, Gestión del Cambio y Skills de Video</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:48:25</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">01:54:18</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">02:02:48</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">02:08:59</a>
              </span>
            </h4>
            <p>Práctica guiada para generar la clave API local en WAPPY, pegar el comando de enlace y verificar el puente. Se aclara a Xiomara Ardila conservar los centros de trabajo inactivos como soporte de Gestión del Cambio, se instala el paquete de skills de diseño/video (autorizando Node.js) y se demuestra la actualización automática de perfiles de cargo en WAPPY, posponiendo NotebookLM y Flow para la Clase 4.</p>
          </div>

          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>8. Copias en escritorio, clonación de voz en Wappy Apps, vigilancia PHVA y Aportes en Línea</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">02:17:59</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">02:24:32</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">02:29:51</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1NCyvt4qkjUqtlnKrV_d9wz7KLDGIlC8ppqD8Dxwldho/edit?usp=drive_web&tab=t.dpi0n9r9epvf" target="_blank">02:34:38</a>
              </span>
            </h4>
            <p>Félix recomienda pedir siempre copias HTML directas en el Escritorio, anuncia la clonación de voz en Wappy Apps para crear capacitaciones de 3–4 minutos, propone repositorios en la nube para vigilar COPASST/CCL y verificar certificados de alturas MinTrabajo, y define como proyecto de curso de Xiomara Ardila la integración de planillas e ingresos/retiros de Aportes en Línea con Antigravity.</p>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ========================================================================
       4. SECCIÓN ESTRELLA: LOS 6 PROMPTS CONVERSACIONALES PARA EL CHAT (SIN CÓDIGO)
       ======================================================================== -->
  <section class="prompts-section" id="prompts-chat">
    <div class="container">
      <div class="sec-head-bar">
        <div>
          <span class="sec-kicker">💬 Práctica Oficial Clase 3 · Copiar y Pegar</span>
          <h2 class="sec-big-title">5 Prompts Estratégicos Vistos en la Clase 3</h2>
        </div>
      </div>

      <div class="zero-code-banner">
        <div>
          <h3>⚡ Activa Modo Turbo, Separa 1 Proyecto por Empresa y Pide Copia en el Escritorio</h3>
          <p>
            Antes de pegar estos prompts en Antigravity, aplica las 3 reglas clave de la Clase 3: activa <strong>Modo Turbo</strong> (flechita junto al micrófono), asegúrate de estar dentro de la <strong>carpeta exclusiva de esa empresa</strong> y refina cualquier detalle visual con <strong>capturas de pantalla</strong> sin editar código manualmente:
          </p>
        </div>
        <div class="zero-code-compare">
          <div style="color:#fca5a5; font-weight:800; margin-bottom:6px;">❌ Antes (Confusión y Fricción):</div>
          <div style="color:#cbd5e1; margin-bottom:10px; font-size:12px;">Varios clientes en una sola carpeta, Excels que se cierran y tocar código HTML a mano.</div>
          <div style="color:var(--lime); font-weight:800; margin-bottom:6px;">✅ Método Clase 3 (Profesional):</div>
          <div style="color:#ffffff; font-size:12px;"><strong>1 Carpeta = 1 Empresa</strong> + Subagentes en paralelo + <strong>HTML directo en tu Escritorio</strong>.</div>
        </div>
      </div>

      <div class="prompt-cards-grid">

        <!-- PROMPT 1: 40 FICHAS LOTO EN HTML DINÁMICO + COPIA EN ESCRITORIO -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 1 · Fichas LOTO + HTML</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Alertas Amarillas + Escritorio</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">1. Transformar Fichas LOTO de Excel a Presentación HTML Dinámica con Alertas de Campo</h3>
            <p class="p-card-explain">
              Basado en el caso real de Carolina Colorado: convierte tus fichas de Bloqueo y Etiquetado (LOTO) en una aplicación HTML interactiva lista para sustentar en planta sin cierres de Excel.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en el Chat de Antigravity (Modo Turbo):</div>
              <div class="chat-prompt-text" id="prompt-1">Lee todas las fichas de Bloqueo y Etiquetado (LOTO) e inventarios de maquinaria que tengo en esta carpeta del proyecto.

Transfórmalas en una Presentación Ejecutiva Interactiva en formato HTML (con buscador por máquina/área y diseño limpio para proyectar ante gerencia y mantenimiento) que cumpla exactamente esto:
1. Detalla para cada equipo los tipos de energía peligrosa, puntos exactos de bloqueo, dispositivos LOTO requeridos y paso a paso de desenergización y verificación de energía cero.
2. Resalta claramente en COLOR AMARILLO todos los datos, válvulas, brekers o fotografías que requieran validación presencial en planta.
3. Aplica un subagente de auditoría visual para verificar que no haya errores de formato y guarda una copia directa del archivo HTML terminado en mi Escritorio lista para abrir con doble clic.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Visor HTML interactivo LOTO + copia lista en tu Escritorio.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-1', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 2: IDENTIDAD CORPORATIVA AUTOMÁTICA + SUBAGENTES POR EMPRESA -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 2 · 1 Proyecto = 1 Empresa</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Marca + Subagentes Paralelos</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">2. Extraer Identidad Corporativa Automática y Configurar Subagentes Especialistas</h3>
            <p class="p-card-explain">
              Úsalo después de arrastrar el Manual HTML del Equipo Agente en la carpeta exclusiva de una empresa cliente para fijar su NIT, logos, colores y roles expertos.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en la Carpeta Exclusiva de la Empresa:</div>
              <div class="chat-prompt-text" id="prompt-2">Analiza los documentos de esta carpeta (que corresponde exclusivamente a UNA sola empresa) y configura la arquitectura base de este proyecto:

1. Identifica y registra en las reglas del proyecto la Identidad Corporativa oficial: Razón Social, NIT, Representante Legal, Sector Económico, nivel de riesgo, paleta de colores institucional, tipografía y logotipos.
2. Configura mis subagentes especializados para que trabajen en paralelo cuando yo lo solicite: un especialista técnico SG-SST (Decreto 1072 y Res. 0312), un analista de accidentalidad e indicadores ATEL, y un subagente de diseño y auditoría visual en HTML.
3. Desactiva cualquier subagente innecesario que no aplique a la actividad económica de esta empresa y confírmame el resumen ejecutivo en pantalla sin mostrar código.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Marca corporativa detectada + equipo multi-agente aislado por NIT.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-2', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 3: CHROME TOOLS + WEB SCRAPING SST (RUES, PESV Y ALTURAS) -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 3 · Chrome Tools + Scraping</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">RUES + Tránsito PESV + Alturas</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">3. Auditoría Automatizada en Portales Públicos (RUES, Multas PESV y Certificados de Alturas)</h3>
            <p class="p-card-explain">
              Activa tus herramientas de navegador (Chrome Tools) para que los subagentes consulten en paralelo antecedentes viales, registro mercantil de contratistas y certificados MinTrabajo.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar en Antigravity con Chrome Tools Activo:</div>
              <div class="chat-prompt-text" id="prompt-3">Usa tus herramientas de navegación web (Chrome Tools) y subagentes en paralelo para realizar una verificación pública automatizada sobre el listado de contratistas, conductores y placas que está en mi carpeta:

1. Consulta en RUES el estado de matrícula mercantil y códigos CIIU de las empresas contratistas.
2. Para el control del PESV, verifica por número de cédula y placa vehicular el estado de comparendos o multas de tránsito en fuentes públicas oficiales.
3. Verifica la vigencia y registro de los certificados de trabajo seguro en alturas frente a la consulta pública del Ministerio del Trabajo.
4. Consolida todos los hallazgos y alertas críticas en un tablero HTML ejecutivo guardado también en mi Escritorio.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Cruce masivo RUES + PESV + Alturas en tablero ejecutivo.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-3', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 4: PUENTE WAPPY <-> ANTIGRAVITY: PERFILES DE CARGO + GESTIÓN DEL CAMBIO -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 4 · Puente WAPPY Activo</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">Perfiles de Cargo + Centros Inactivos</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">4. Actualizar Perfiles de Cargo en WAPPY y Proteger el Historial de Gestión del Cambio</h3>
            <p class="p-card-explain">
              Una vez completados los 3 pasos de conexión entre WAPPY y Antigravity, usa este prompt para sincronizar los perfiles de cargo de tus carpetas sin borrar sedes históricas.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para pegar tras verificar el Puente WAPPY:</div>
              <div class="chat-prompt-text" id="prompt-4">Con el puente entre Antigravity y WAPPY activo, verifica primero que la Empresa Activa en WAPPY coincida exactamente con el NIT de este proyecto y ejecuta estas acciones:

1. Lee los manuales de funciones, profesiogramas y matrices de esta carpeta local y actualiza o alimenta automáticamente los Perfiles de Cargo dentro de WAPPY asociando sus peligros, EPP y exámenes médicos ocupacionales.
2. REGLA DE GESTIÓN DEL CAMBIO: Conserva intacta toda la información de centros de trabajo anteriores o inactivos como trazabilidad histórica del SG-SST (jamás elimines sedes cerradas).
3. Propón 3 acciones de intervención predictiva en WAPPY enfocadas en reducir la accidentalidad crítica de estos cargos.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Perfiles de cargo sincronizados + trazabilidad histórica intacta.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-4', this)">
              📋 Copiar Prompt para el Chat
            </button>
          </div>
        </div>

        <!-- PROMPT 5: VIGILANCIA PHVA (COPASST, CCL, APORTES EN LÍNEA) + PREPARACIÓN CLASE 4 -->
        <div class="prompt-chat-card">
          <div class="p-card-top">
            <span class="p-step-tag">Prompt 5 · Vigilancia PHVA + Clase 4</span>
            <span style="font-size:11.5px; font-weight:700; color:var(--ink-muted);">COPASST + Aportes + NotebookLM/Flow</span>
          </div>
          <div class="p-card-body">
            <h3 class="p-card-title">5. Diseñar Vigilancia Automática PHVA (Comités / Aportes en Línea) y Ruta para Clase 4</h3>
            <p class="p-card-explain">
              Inspirado en las propuestas de cierre de Gloria Amparo y Xiomara Ardila: estructura tu vigilancia gerencial en tiempo real y deja lista tu lluvia de ideas para conectar NotebookLM y Google Flow.
            </p>
            <div class="chat-prompt-box">
              <div class="chat-prompt-label">💬 Mensaje para anclar en tu Chat Instructivo rumbo a la Clase 4:</div>
              <div class="chat-prompt-text" id="prompt-5">Actúa como mi Arquitecto de Automatización SST y estructúrame el plan operativo de esta empresa para dejarlo listo antes de la Clase 4:

1. Vigilancia Continua PHVA (7:00 AM): Define la rutina automática para revisar carpetas locales / Drive de actas del COPASST, Comité de Convivencia Laboral y novedades de planillas de seguridad social (ingresos, retiros y ausentismos tipo Aportes en Línea), generando un reporte gerencial enfocado en reducción de accidentalidad.
2. Preparación Clase 4 (NotebookLM + Google Flow + Voz): Déjame listos 3 casos concretos de esta empresa donde en la próxima clase generaremos podcasts/mapas mentales en NotebookLM, imágenes o planes de emergencia en Google Flow y cápsulas de capacitación de 3 minutos con voz clonada en Wappy Apps.</div>
            </div>
          </div>
          <div class="p-card-footer">
            <span class="p-result-note">⚡ Resultado: Arquitectura PHVA + tus 3 casos listos para la Clase 4 en vivo.</span>
            <button class="btn-copy-prompt" onclick="copyPromptText('prompt-5', this)">
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
          <span class="sec-kicker">📘 Resumen Pedagógico Completo · Clase 3</span>
          <h2 class="sec-big-title">Guía de Estudio Paso a Paso · Clase 3</h2>
        </div>
      </div>

      <div class="guide-blocks-grid">

        <!-- BLOQUE 1 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 1 · Fichas LOTO, Vibe-Coding y Subagentes</span>
            <span class="g-time">⏱️ Minutos 00:00 – 00:25</span>
          </div>
          <h3>De 40 Fichas LOTO en Excel a Presentaciones HTML Auditadas por Subagentes</h3>
          <ul class="g-list">
            <li>
              <strong>1. Caso real de 40 fichas LOTO enriquecidas con IA:</strong>
              Al dar instrucciones precisas, la IA documenta energías peligrosas, puntos de bloqueo y marca en <em>amarillo</em> los elementos que deben verificarse físicamente en planta.
            </li>
            <li>
              <strong>2. Por qué pasar de Excel a HTML dinámico + Plan Pro ($20K):</strong>
              Los libros pesados de Excel pueden cerrarse inesperadamente; sustentarlo en HTML interactivo eleva el impacto ejecutivo, apoyándose en la oferta del plan Pro de $20.000 COP/mes.
            </li>
            <li>
              <strong>3. Vibe-Coding con capturas de pantalla (cero código manual):</strong>
              Cierra las pestañas de código interno, abre el HTML en tu navegador, envía capturas de pantalla de lo que quieras cambiar y pide siempre una copia directa en el Escritorio.
            </li>
            <li>
              <strong>4. Subagentes simultáneos + Auditor Visual + Cron 7:00 AM:</strong>
              Combina reglas de proyecto, <em>skills</em> expertas (riesgo eléctrico, SVG/HTML) y subagentes corriendo en paralelo junto con rutinas matutinas automáticas.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 2 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 2 · Control Remoto QR, Manual HTML y Marca</span>
            <span class="g-time">⏱️ Minutos 00:26 – 01:15</span>
          </div>
          <h3>Cómo Conectar tu Celular por QR y Desplegar el Equipo Agente en Modo Turbo</h3>
          <ul class="g-list">
            <li>
              <strong>1. Activar Remote Control en Settings:</strong>
              Entra a la configuración de Antigravity en tu PC, habilita <em>Remote Control</em> en aplicaciones y acepta los permisos de Firewall en redes públicas y privadas.
            </li>
            <li>
              <strong>2. Escaneo de código QR o enlace por WhatsApp:</strong>
              Si el navegador móvil demora en cargar, escanea el código QR directamente con tu celular o envíate el enlace por WhatsApp (recuerda conectar Google Drive desde el PC).
            </li>
            <li>
              <strong>3. Arrastrar el Manual HTML en Modo Turbo:</strong>
              Activa el <strong>Modo Turbo</strong> (flechita junto al micrófono), abre un chat nuevo, adjunta con <code>+</code> el archivo HTML del manual del equipo agente y pulsa <code>Enter</code> sin instrucciones previas.
            </li>
            <li>
              <strong>4. Identidad corporativa detectada automáticamente:</strong>
              El sistema reconoce NIT, representante legal, sector económico, paleta de colores, tipografías y logotipos para personalizar cada entregable.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 3 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 3 · Multi-Empresa, APIs y Web Scraping SST</span>
            <span class="g-time">⏱️ Minutos 01:16 – 01:47</span>
          </div>
          <h3>Regla 1 Proyecto = 1 Empresa y Consultas en RUES, Tránsito y Aportes en Línea</h3>
          <ul class="g-list">
            <li>
              <strong>1. Jamás mezcles varias empresas en un solo proyecto:</strong>
              Crea 1 carpeta y 1 proyecto independiente por cada compañía administrada para impedir respuestas híbridas en matrices de riesgo, convenios o IPS.
            </li>
            <li>
              <strong>2. Reutilizar reglas con Conversation ID y Project Settings:</strong>
              Ancla un chat instructivo maestro, aprovecha el <em>Conversation ID</em> para llevar configuraciones a otros proyectos y apaga en <em>Project Settings</em> los subagentes innecesarios.
            </li>
            <li>
              <strong>3. Chrome Tools para multas de tránsito (PESV) y Alturas:</strong>
              Con las herramientas de navegador activas, los agentes consultan comparendos por cédula o placa vehicular y validan certificados de alturas ante MinTrabajo.
            </li>
            <li>
              <strong>4. Web Scraping en RUES, Aportes en Línea y Siigo:</strong>
              Automatiza la extracción registral en RUES, la validación de planillas e ingresos/retiros en seguridad social y flujos administrativos de alto valor comercial.
            </li>
          </ul>
        </div>

        <!-- BLOQUE 4 -->
        <div class="g-block-card">
          <div class="g-block-header">
            <span class="g-badge">Bloque 4 · Puente WAPPY 3 Pasos, Voz y Clase 4</span>
            <span class="g-time">⏱️ Minutos 01:48 – 02:36</span>
          </div>
          <h3>Enlace WAPPY ↔ Antigravity, Gestión del Cambio, Clonación de Voz y Próxima Sesión</h3>
          <ul class="g-list">
            <li>
              <strong>1. Conectar el Puente WAPPY en 3 pasos locales:</strong>
              Genera tu API Key conservando la opción de trabajo local en el perfil de WAPPY, envía el comando del Paso 1 en un chat nuevo y ejecuta la verificación del Paso 2 (autorizando Node.js).
            </li>
            <li>
              <strong>2. Conservar centros inactivos + Paquete de Skills de Video:</strong>
              Nunca borres sedes antiguas en WAPPY (son soporte obligatorio de <strong>Gestión del Cambio</strong>) e instala en un chat aparte el paquete de habilidades de diseño y video.
            </li>
            <li>
              <strong>3. Perfiles de Cargo automáticos y Clonación de Voz:</strong>
              Actualiza perfiles de cargo desde tus carpetas hacia WAPPY y prepárate para crear videos e inducciones de 3–4 minutos con tu propia voz clonada en <em>Wappy Apps</em>.
            </li>
            <li>
              <strong>4. Preparación oficial para la Clase 4 (NotebookLM + Flow):</strong>
              Trae discriminados tus proyectos empresariales y tu lluvia de ideas para conectar en vivo <strong>NotebookLM</strong> y <strong>Google Flow</strong> junto con Tenshi.
            </li>
          </ul>
        </div>

      </div>

      <!-- CTA Final hacia Clase 4 en Vivo y Sala de Google Meet -->
      <div class="final-cta-card">
        <div style="max-width: 640px;">
          <span style="color:var(--lime); font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
            🔴 Próxima Sesión en Vivo · Martes 10 de Noviembre · 7:00 PM
          </span>
          <h3 style="font-family:var(--font-display); font-size:clamp(20px, 2.6vw, 30px); font-weight:900; margin:6px 0 8px;">
            ¡Prepárate para la Clase 4: NotebookLM, Google Flow &amp; Tenshi!
          </h3>
          <p style="font-size:14px; color:#cbd5e1;">
            Revisa las 13 tareas oficiales de esta Clase 3 en el popup de memorias, deja separados tus proyectos por empresa y entra a la página oficial de la Clase 4 o conéctate directo a Google Meet.
          </p>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="button" onclick="openNotesModal()" class="btn btn-glass">
            📋 Repasar Notas y 13 Tareas
          </button>
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener noreferrer" class="btn btn-glass">
            📹 Sala Google Meet ↗
          </a>
          <a href="/clase4" class="btn btn-lime">
            🔴 Ir a la Clase 4
            <span class="arrow-pip">↗</span>
          </a>
        </div>
      </div>

      <footer>
        <p><strong>WAPPY IA · SOMOS SST</strong> · Especialización Práctica en Agentes Autónomos para Seguridad y Salud en el Trabajo</p>
        <p style="margin-top:4px;">wappy.club/clase3 · Docente Líder: Ing. Félix Bedoya · Memorias Oficiales Clase 3 (Subagentes en Paralelo, Control Remoto Móvil, Fichas LOTO &amp; Puente WAPPY)</p>
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
