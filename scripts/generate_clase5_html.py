# -*- coding: utf-8 -*-
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
thumb_bg = get_base64_img('client/public/assets/thumb_bg_clase5.jpg')

if not cat_logo:
    cat_logo = logo_wappy

html_content = f'''<!DOCTYPE html>
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
        <img src="{tenshi_img}" alt="Tenshi IA" class="tenshi-avatar-floating">
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
              <img src="{thumb_bg}" alt="" class="video-thumb-bg-img" aria-hidden="true">
              <div class="video-thumb-radial-overlay"></div>
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{felix_avatar}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Insignia En Vivo + Logos + CLASE 5 + Píldoras + Botón Meet -->
              <div class="thumb-center-col">
                <div style="display:inline-flex; align-items:center; gap:8px; padding:5px 14px; border-radius:999px; background:rgba(220,38,38,0.22); border:1px solid rgba(248,113,113,0.65); color:#fecaca; font-size:11.5px; font-weight:900; letter-spacing:0.06em; margin-bottom:8px;">
                  🔴 EN VIVO · MARTES 17 NOV · 7:00 – 9:00 PM
                </div>

                <div class="thumb-logos-pill">
                  <img src="{wappy_horiz_logo}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{agy_logo}" alt="Google Antigravity" class="agy-i">
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
                <img src="{tenshi_img}" alt="Tenshi WAPPY IA">
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
    const viewport = document.getElementById('slide-viewport') || document.getElementById('deck-stage');

    if (viewport) viewport.addEventListener('touchstart', (e) => {{
      touchStartX = e.changedTouches[0].screenX;
    }}, {{ passive: true }});

    if (viewport) viewport.addEventListener('touchend', (e) => {{
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

# Write to client/public/clase5.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase5.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {pub_path} ({len(html_content)} bytes)")

# Write to Desktop
desktop_path = '/Users/venta/Desktop/clase5.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {desktop_path} ({len(html_content)} bytes)")
