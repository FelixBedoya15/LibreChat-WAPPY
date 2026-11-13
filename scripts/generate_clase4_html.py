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
thumb_bg = get_base64_img('client/public/assets/thumb_bg_clase4.jpg')
lienzo_dag_img = get_base64_img('client/public/assets/lienzo_wappy_clase4_dag.jpg')

if not cat_logo:
    cat_logo = logo_wappy

html_content = f'''<!DOCTYPE html>
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
          Flujos DAG en <span class="highlight-lime">Lienzo WAPPY</span>, Condiciones Pre-IA &amp; Subagentes Masivos
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
        <img src="{tenshi_img}" alt="Tenshi IA" class="tenshi-avatar-floating">
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
              <img src="{lienzo_dag_img}" alt="Lienzo WAPPY DAG - Flujo EPP y Perfiles de Cargo" style="width:100%; max-height:300px; object-fit:contain; border-radius:12px;">
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
              <img src="{thumb_bg}" alt="" class="video-thumb-bg-img" aria-hidden="true">
              <div class="video-thumb-radial-overlay"></div>
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{felix_avatar}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Logos WAPPY + Antigravity + CLASE 4 + Píldoras + Botón Play -->
              <div class="thumb-center-col">
                <div class="thumb-logos-pill">
                  <img src="{wappy_horiz_logo}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{agy_logo}" alt="Google Antigravity" class="agy-i">
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
                <img src="{tenshi_img}" alt="Tenshi WAPPY IA">
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
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">FELIX BEDOYA</span>
            <div><strong>1. Optimizar procesos:</strong> Investigar y compartir con los alumnos guiones y métodos específicos para optimizar el rendimiento y consumo de procesos en Antigravity según recomendaciones de expertos.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">XIOMARA ARDILA</span>
            <div><strong>2. Obtener credenciales:</strong> Solicitar a la empresa los credenciales de API o token administrativo para permitir la conexión entre el software de nómina y la plataforma de automatización.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El grupo</span>
            <div><strong>3. Dibujar flujo automatización:</strong> Esbozar un diagrama del flujo de trabajo para la automatización deseada. Este esquema facilitará la asistencia de la inteligencia artificial durante el desarrollo técnico del proceso.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El grupo</span>
            <div><strong>4. Crear flujos automatización:</strong> Dibujar o redactar diversos borradores de flujos para procesos de automatización y presentar los diseños en la siguiente sesión.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">FELIX BEDOYA</span>
            <div><strong>5. Compartir página verificación:</strong> Enviar el enlace de la página web utilizada para verificar si un médico tratante se encuentra activo y habilitado.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">FELIX BEDOYA</span>
            <div><strong>6. Programar claves API:</strong> Asignar una clave única a cada proceso en Wappy. Facilitar el funcionamiento independiente y paralelo de los flujos de trabajo.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">El grupo</span>
            <div><strong>7. Preparar flujo trabajo:</strong> Documentar el paso a paso de una automatización necesaria para su actividad diaria. Presentar la maquetación detallada durante la siguiente sesión.</div>
          </div>
          <div class="n-task-item n-step-item">
            <span class="n-task-owner">XIOMARA ARDILA</span>
            <div><strong>8. Automatizar PDFs:</strong> Utilizar Antigravity para gestionar la renovación de contratos digitales. Ejecutar la tarea de forma optimizada mediante subagentes.</div>
          </div>
        </div>

        <!-- SECCIÓN 3: MINUTO A MINUTO (29 BLOQUES) -->
        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ⏱️ 3. Bitácora Minuto a Minuto de la Reunión (00:03:16 – 02:40:40)
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>1. Límites de uso y consumo de tokens en Antigravity</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:03:16</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:05:23</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:07:45</a>
              </span>
            </h4>
            <p><strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong> reporta que experimentó un agotamiento rápido de tokens y límites en Antigravity durante un proyecto de lavandería, recibiendo avisos de cobro a pesar de haber realizado un pago mensual de 20,000 pesos. <strong>FELIX BEDOYA</strong> explica que los límites de uso se reanudan cada cinco horas o por periodos diarios según el modelo utilizado (como Gemini 3.8 y Gemini 4 Argon) y que estas alertas indican que se agotó el límite de procesos y no un cobro adicional. <strong>FELIX BEDOYA</strong> recomienda alternar entre los modelos disponibles como Claude y ChatGPT o cambiar de correo electrónico cuando se agoten los créditos.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>2. Verificación de integraciones API para pagos de seguridad social</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:11:46</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:20:43</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:40:30</a>
              </span>
            </h4>
            <p><strong>Carolina Colorado Cano</strong> consulta sobre la posibilidad de automatizar el pago de seguridad social utilizando la plataforma Asopagos. <strong>FELIX BEDOYA</strong> revisa la plataforma y señala que Asopagos no cuenta con una API pública documentada y libre de acceso para desarrolladores externos, por lo que requeriría web scraping. <strong>FELIX BEDOYA</strong> demuestra que otras plataformas compatibles con API permiten obtener claves API y tokens de autenticación desde los ajustes de administrador para conectarlas directamente a los proyectos de Antigravity.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>3. Automatización de consultas de nómina y liquidación de aportes</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:14:43</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:17:25</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:17:25</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:20:43</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:19:44</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:21:58</a>
              </span>
            </h4>
            <p><strong>XIOMARA ARDILA</strong> expone las dificultades para resolver dudas de colaboradores sobre variaciones en pagos, detallando que las planillas se liquidan en Aportes en Línea mientras la nómina está a cargo de la coordinación. <strong>FELIX BEDOYA</strong> indica que Aportes en Línea dispone de una API para automatizar planillas y novedades, mientras que software de nómina electrónica como Sigo permite la conexión mediante claves API y tokens administrativos para responder inquietudes de manera automática. Como alternativa, se pueden cargar archivos de Excel con la información de nómina en un proyecto de Antigravity para que un agente responda consultas y automatice el envío de notificaciones por correo.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>4. Consideraciones de seguridad y respaldo de datos en inteligencia artificial</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:25:19</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:32:08</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:26:26</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:28:42</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:29:46</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:32:08</a>
              </span>
            </h4>
            <p><strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong> manifiesta inseguridad y desconfianza respecto a la privacidad al cargar información personal y empresarial en Antigravity. <strong>FELIX BEDOYA</strong> tranquiliza a les participantes argumentando que los datos personales ya circulan en redes sociales y que la información de seguridad y salud en el trabajo es comparable a las políticas corporativas públicas. Asimismo, se menciona que por normativas de Estados Unidos y la Unión Europea, las plataformas de inteligencia artificial almacenan los datos en respaldos por treinta días sin utilizarlos para entrenamiento de modelos. <strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong> aclara que el verdadero obstáculo radica en la adaptación personal y la navegación de la plataforma más que en la seguridad de los datos.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>5. Integraciones para ARL Sura y configuración de proyectos</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:36:27</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:41:31</a>
              </span>
            </h4>
            <p><strong>XIOMARA ARDILA</strong> pregunta sobre la posibilidad de enlazar la plataforma de ARL Sura. <strong>FELIX BEDOYA</strong> aclara que ARL Sura carece de API, por lo que el único método aplicable es el web scraping para verificar números de cédula y descargar certificados automáticamente. <strong>FELIX BEDOYA</strong> explica que las conexiones mediante API y protocolos de contexto de modelos (MCP) se configuran de manera específica dentro de los complementos de cada proyecto en Antigravity y no de forma global.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>6. Concepto y estructura de flujos de trabajo automatizados</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:43:49</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:46:25</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:56:58</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">00:59:22</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> explica el marco teórico de los flujos de trabajo y automatizaciones para lograr que el computador ejecute procesos de forma independiente y libere tiempo laboral. Utilizando la analogía de un mapa de procesos, <strong>FELIX BEDOYA</strong> detalla que una automatización parte de una necesidad o entrada a través de un disparador (como tareas programadas o cron, mensajes de chat, códigos QR, correos electrónicos o webhooks), atraviesa nodos de procesamiento interno y genera una solución final satisfactoria. <strong>Carolina Colorado Cano</strong> parafrasea el concepto usando un ejemplo de entrega de elementos de protección personal, y <strong>FELIX BEDOYA</strong> confirma que las automatizaciones deben cerrar el ciclo completo mediante auditoría, registro de bitácoras y envío directo a les encargades.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>7. Evolución de la inteligencia artificial hacia flujos automatizados</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:01:34</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> expuso que en el ámbito de la inteligencia artificial escribir textos básicos ha quedado en decadencia. El enfoque principal debe centrarse en utilizar comandos que actúen como disparadores para generar flujos automatizados de trabajo aplicados a la seguridad y salud en el trabajo y a otros campos.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>8. Ejemplo práctico de seguimiento médico ocupacional</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:02:35</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:03:48</a>
              </span>
            </h4>
            <p><strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong> planteó el caso de cien trabajadores evaluados mediante exámenes periódicos, consultando sobre la posibilidad de automatizar la trazabilidad de resultados favorables o desfavorables, el llenado de matrices y el envío de correos electrónicos. <strong>FELIX BEDOYA</strong> respondió que este tipo de flujos lineales son de los más sencillos de implementar mediante una carpeta centralizada, un agente automatizado y un subflujo para el seguimiento médico continuo desde el ingreso hasta el retiro.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>9. Estructura de flujos preestablecidos en Wapi</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:06:12</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:07:29</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> presentó la sección de tareas y flujos preestablecidos en Wapi, informando que existen cincuenta y cinco flujos diferentes disponibles para estudio y aplicación empresarial. Explicó los componentes modulares de estos flujos, los cuales incluyen disparadores de entrada, nodos de unión para fusionar tareas, nodos condicionales para validar elementos vencidos y memorias de bitácora para registrar automatizaciones previas.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>10. Mecanismos de salida y extracción de datos en Wapi</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:11:55</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> detalló que, tras la ejecución del agente, el sistema puede generar tarjetas de seguimiento en el centro de control de Wapi, recordatorios en Google Calendar, bitácoras en Gmail o correos dirigidos a la institución prestadora de servicios de salud o a los trabajadores. Asimismo, indicó que es posible extraer datos desde códigos, correos de Gmail, Google Drive, OneDrive, computadores locales, aplicaciones de seguridad y salud en el trabajo, y mediante web scraping.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>11. Aplicaciones avanzadas para la gestión en seguridad y salud en el trabajo</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:13:12</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> describió diversos flujos especializados disponibles, tales como la verificación diaria de normas en el Ministerio del Trabajo mediante web scraping, la supervisión de carpetas de talento humano en Google Drive, el registro de accidentes e incidentes laborales, y la auditoría de matrices de equipos de protección personal, parque automotor y sustancias químicas utilizando interfaces de programación de aplicaciones como Puchen y Mediplin.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>12. Requisitos técnicos para la ejecución de flujos</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:18:09</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:20:20</a>
              </span>
            </h4>
            <p><strong>Carolina Colorado Cano</strong> consultó si para aplicar estos flujos bastaba con seleccionarlos directamente en Wapi. <strong>FELIX BEDOYA</strong> aclaró que es necesario cumplir con características técnicas y conexiones previas, tales como tener integrado Antigravity para acceder a carpetas locales, autorizar las integraciones con Gmail y Google Calendar, y configurar las llaves de interfaces de programación de aplicaciones.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>13. Modificación y personalización de nodos</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:22:48</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:23:51</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> demostró la manera en que se pueden modificar, eliminar o añadir nodos y disparadores dentro de los flujos en Wapi según los requerimientos específicos de cada empresa. Señaló que algunas automatizaciones operan directamente en Wapi sin herramientas externas, mientras que la extracción de archivos locales requiere obligatoriamente la conexión con Antigravity.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>14. Personalización de avatares y asistencia interactiva</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:28:19</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:29:37</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:30:39</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> indicó que en Wapi se pueden configurar avatares (como el denominado Surri) definiendo nombre, sexo, voz, personalidad y vocablos específicos. Explicó que estos avatares ayudan a las personas usuarias a crear automatizaciones mediante conversación directa. <strong>Carolina Colorado Cano</strong> y <strong>XIOMARA ARDILA</strong> consultaron sobre la asistencia interactiva, recibiendo la recomendación de esquematizar previamente las necesidades del flujo antes de solicitar ayuda al asistente.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>15. Manejo de condiciones y bloqueos en los flujos</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:32:58</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> explicó la importancia de establecer condiciones estrictas en los flujos, tales como verificar si se cuenta con datos obligatorios (por ejemplo, la fecha de nacimiento requerida por la Administradora de Riesgos Laborales Colmena), para prevenir errores y evitar devoluciones innecesarias en el proceso automatizado.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>16. Configuración de herramientas personalizadas en Antigravity</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:34:04</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> mostró la sección de automatizaciones y herramientas personalizadas en Antigravity, recomendando activar los servicios de Google (como Drive, Calendar y Gmail) y otras aplicaciones como Dropbox y Notion para facilitar la construcción de flujos de trabajo.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>17. Creación de automatizaciones mediante instrucciones textuales</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:37:39</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> realizó una demostración sobre cómo estructurar una automatización en Antigravity a través de instrucciones detalladas que comprenden la revisión de carpetas de perfil sociodemográfico, la ejecución de web scraping en el Ministerio del Trabajo para verificar cursos de altura, la generación de informes en formato HyperText Markup Language con Portable Document Format y el envío por correo electrónico en un horario programado.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>18. Comparación entre Wapi y Antigravity en el consumo de recursos</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:40:51</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:42:01</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:44:38</a>
              </span>
            </h4>
            <p><strong>Carolina Colorado Cano</strong> expresó preocupación por el consumo de créditos o correos al utilizar Antigravity. <strong>FELIX BEDOYA</strong> y <strong><strong>Maria Elena Obando</strong> Colonia</strong> analizaron las diferencias, señalando que Wapi opera mediante tokens con clave de interfaz de programación de aplicaciones para tareas básicas, mientras que Antigravity procesa tareas complejas mediante procesos y web scraping. <strong>FELIX BEDOYA</strong> aclaró que, tras la primera ejecución, Antigravity genera un script o conocimiento paso a paso que permite ejecutar la tarea de forma automática y rápida sin sobrecargar el procesamiento de la inteligencia artificial.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>19. Diferencias entre ejecución local y en la nube</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:48:16</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> explicó que las automatizaciones ejecutadas en Antigravity desde el computador local exigen que el equipo permanezca encendido y pueden generar alta carga en la memoria de acceso aleatorio, en tanto que el uso de control remoto en la nube permite operar a través de los servidores de Google.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>20. Importancia de la precisión en las instrucciones y diseño de nodos</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:50:33</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">01:54:13</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> enfatizó que las instrucciones impartidas a Antigravity deben ser sumamente explícitas y detalladas, comparándolas con dar indicaciones a una persona de nuevo ingreso en la empresa, especificando con claridad el origen de la información y el lugar de verificación. Finalmente, repasó la estructura fundamental para construir flujos combinando un disparador, la extracción de datos, la revisión mediante un agente, herramientas externas como web scraping y una salida configurada hacia correo electrónico u otras aplicaciones.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>21. Automatización de flujos y comparación entre Wapi y Antigravity</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:01:31</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:03:57</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:05:18</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> explicó que los flujos de automatización permiten ejecutar tareas repetitivas como revisar carpetas, extraer perfiles sociodemográficos (nombres y cédulas) y verificar la vigencia de certificados en la página del Ministerio de Trabajo para generar informes en formato HTML. Durante la discusión, se señaló que las automatizaciones en Antigravity pueden configurarse con temporizadores (Chrome triggers) para operar en fechas y horas determinadas, y se destacó la importancia de evaluar qué plataforma resulta más práctica según los requerimientos operativos. Como conclusión, se enfatizó que el uso de estas herramientas simplifica la generación de reportes operativos, abriendo paso al diseño de nuevos flujos de trabajo.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>22. Propuesta de automatización de Maria Elena Obando Colonia y limitaciones técnicas</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:06:27</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:09:31</a>
              </span>
            </h4>
            <p><strong><strong>Maria Elena Obando</strong> Colonia</strong> propuso un flujo para automatizar el día 20 de cada mes la validación de seguridad social, fondos de pensiones, multas en el Simit, licencias de conducción, certificados de alturas, espacios confinados, ARL y antecedentes judiciales de los trabajadores, así como el control de evaluaciones médicas e inducciones, e incluir la actualización de la matriz legal los días 30 o primeros 5 días del mes. En respuesta, <strong>FELIX BEDOYA</strong> advirtió que existen barreras técnicas, ya que algunos fondos de pensiones poseen capas de seguridad impenetrables para la inteligencia artificial y la plataforma Adres se bloquea al realizar consultas masivas simultáneas.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>23. APIs disponibles y desarrollo de proyectos de software</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:09:31</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:11:53</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> detalló que el sistema soporta consultas al Simit, Runt, antecedentes de policía, Sijin y Fiscalía, ARL, certificados del Sena, cursos de alturas y web scraping, incluyendo un enlace para verificar médicos tratantes y detectar incapacidades falsas. Ante la consulta de <strong>Xiomara Ardila</strong> sobre cómo iniciar en una empresa sin sistema de gestión, <strong>FELIX BEDOYA</strong> aclaró que un proyecto enfocado en la generación de ingresos consiste en desarrollar aplicaciones pequeñas, como una herramienta de verificación de ARL y certificados de alturas destinada a obras de construcción para agilizar el ingreso de personal.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>24. Costos de despliegue web y gestión de flujos de vehículos</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:15:01</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:16:30</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:17:44</a>
              </span>
            </h4>
            <p><strong>Carolina Colorado Cano</strong> planteó la creación de un aplicativo web para gestionar hojas de vida, mantenimientos y preoperacionales de 180 vehículos. <strong>FELIX BEDOYA</strong> explicó que el lanzamiento de un aplicativo a la nube conlleva un costo de alojamiento aproximado de un millón de pesos anuales, el cual resulta viable frente a la rentabilidad del proyecto, o bien diseñar el flujo dentro de Wapi para notificar directamente a un responsable por correo electrónico tal como sugirió <strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>. Asimismo, se puntualizó que Antigravity cuenta con dos disparadores (Chrome y entrada de texto), mientras que Wapi ofrece una variedad más amplia de disparadores.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>25. Solicitud de clases personalizadas y preparación de flujos para la siguiente sesión</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:20:44</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:21:55</a>
              </span>
            </h4>
            <p><strong><strong>Maria Elena Obando</strong> Colonia</strong> consultó sobre la posibilidad de recibir asesorías personalizadas adicionales debido a las diferencias en habilidades tecnológicas entre los asistentes. <strong>FELIX BEDOYA</strong> respondió que realizar sesiones individuales es inviable por motivos de tiempo, pero acordó que la próxima clase se centrará enteramente en la creación y revisión de automatizaciones en Wapi, bajo la condición obligatoria de que cada participante lleve redactados sus propios flujos de trabajo.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>26. Ejecución simultánea de flujos y optimización de claves API</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:22:48</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:25:04</a>
              </span>
            </h4>
            <p><strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong> consultó si es viable ejecutar automatizaciones para múltiples empresas de manera simultánea. <strong>FELIX BEDOYA</strong> advirtió que correr entre 10 y 20 flujos al mismo tiempo sobre la misma conexión de Antigravity provoca lentitud o agotamiento de tokens, inconveniente reportado por <strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong> al utilizar herramientas como Gemini 3.8 y Claude. Como solución, <strong>FELIX BEDOYA</strong> propuso asignar una clave API independiente a cada flujo en Wapi para garantizar operaciones separadas y estables en paralelo.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>27. Automatización de documentos PDF mediante subagentes en Antigravity</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:26:01</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:27:18</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:29:18</a>
              </span>
            </h4>
            <p><strong>Xiomara Ardila</strong> consultó acerca de herramientas para automatizar la actualización de datos en formatos PDF correspondientes a cajas de compensación durante los periodos de renovación de contratos. <strong>FELIX BEDOYA</strong> recomendó emplear Antigravity configurado en un nivel de procesamiento bajo (low setting) para ejecutar esta tarea básica. Para optimizar el tiempo con volúmenes grandes de documentos, <strong>FELIX BEDOYA</strong> sugirió fragmentar la carga de trabajo en subagentes que operen en paralelo (por ejemplo, agrupar 30 archivos en cinco subagentes de seis elementos cada uno).</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>28. Herramientas complementarias como Notebook LM e Integraciones</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:32:26</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:34:44</a>
              </span>
            </h4>
            <p><strong>FELIX BEDOYA</strong> presentó herramientas adicionales como Notebook LM (destinada a la creación de infografías, podcasts, videos, exámenes y mapas mentales) y Flow (utilizada para proponer controles antes y después de auditorías mediante el análisis de imágenes y videos). <strong>FELIX BEDOYA</strong> indicó que estas aplicaciones se integran copiando los fragmentos de código provistos en las secciones de gestión de sesiones de Wapi y vinculándolos en Antigravity. Ante una consulta de <strong>Xiomara Ardila</strong> sobre inconvenientes en la instalación, <strong>FELIX BEDOYA</strong> demostró en pantalla el procedimiento de vinculación.</p>
          </div>
          <div class="n-detail-card n-section-card n-timeline-item">
            <h4>
              <span>29. Definición de la tarea y horario de las próximas clases</span>
              <span>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:31:29</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:36:55</a>
                <a class="ts-link" href="https://docs.google.com/document/d/1OJKeLzpnMMPNcBU8fFqHXP94lkPHktOKs-cmBj-pTog/edit?tab=t.lslevqv4ezz6" target="_blank" rel="noopener noreferrer">02:39:39</a>
              </span>
            </h4>
            <p><strong><strong>Maria Elena Obando</strong> Colonia</strong> preguntó si la tarea sobre los flujos debía presentarse mediante esquemas visuales o de forma escrita. <strong>FELIX BEDOYA</strong> aclaró que los flujos deben entregarse redactados y estructurados paso a paso (especificando entradas, procesos, herramientas y salidas), y que cada participante los configurará directamente en su propio usuario o instancia de Antigravity. Por último, tras una consulta de <strong><strong>Maria Elena Obando</strong> Colonia</strong> respecto al día de las sesiones y las intervenciones de <strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong> y <strong>Xiomara Ardila</strong>, el grupo acordó mantener las clases programadas para los días martes.




Revisa las notas de Gemini para asegurarte de que sean precisas. Obtén sugerencias y descubre cómo Gemini toma notas
Cómo es la calidad de estas notas específicas? Responde una breve encuesta para darnos tu opinión; por ejemplo, cuán útiles te resultaron las notas.
nov 11, 2026
Antigravity + Wappy IA - Transcripción
00:01:44


<strong>FELIX BEDOYA</strong>: Cuando se la pregunta, chicas, con el permiso de ustedes, voy a comenzar a grabar pantalla. Listo. Y respetando pues obviamente el tiempo de todos y la puntualidad vuestra, eh vamos a dar inicio el día de hoy. Esta ya es la cuarta clase. Creo que nos quedarían una o dos máximo más de antigravity ya para comenzar con notebook LM y un poquito de de flop, que es muy importante también como verlas para que ustedes también puedan sacarle como el mayor provecho a a estas plataformas. como es previsto, pues siempre me gusta como dar ese espaiecito, esos 10 minutos al inicio de de cada clase como para saber cómo les dio entre la semana, qué dudas tienen, cómo han trabajado con la plataforma, si pudieron conectar bien la plataforma con Wapi, pudieron utilizar a a Tenchi. Entonces, me gustaría como escucharlas y ahorita hablamos un poquito de los flujos. Si tienen algún flujo eh pensado, si no, yo les voy a montar mostrar un montón de flujos que tengo ya prediseñados como para que comiencen a abrir esa mente en ese espectro eh que es el tema de las automatizaciones a partir de de unos flujos que nosotros podamos construir.




00:03:16


<strong>FELIX BEDOYA</strong>: Entonces, nada, chicas, las escucho. Eh, tenemos estos 10, 15 minuticos como para que resolvamos dudas o inquietudes y comenzamos. Entonces, la clase en pleno o todas a la vez.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Félix, ¿no? Yo, buenas noches para todos. ¿Cómo están?
<strong>FELIX BEDOYA</strong>: Buenas noches.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Eh,
<strong>FELIX BEDOYA</strong>: Gloria.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: yo estuve pues trabajando en la plataforma, pero no conecté pues con Wapi, sino que yo ya organicé pues lo de los pagos mensuales allá ese que usted me orientó de 20,000 pesos, pero eso ahí mismo se me va.
<strong>FELIX BEDOYA</strong>: Sí.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: También intenté, estaba haciendo con un proyecto de una lavandería y solo le pedí unas cuantas cositas y ya otra vez pidiéndome pago. Entonces,
<strong>FELIX BEDOYA</strong>: En el 3.8.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: no, ahí me quedé. ¿Cómo?
<strong>FELIX BEDOYA</strong>: En el 3.8.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Sí, aquí está. Sí, Géminis 2.8 flash y en el otra parte está lo de que turbo como usted nos recomendó.




00:04:26


<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Y ahí me dejó otra vez. Entonces no no le pude sacar como el mayor provecho esta semana.
<strong>FELIX BEDOYA</strong>: Listo. Yo
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: No, ahí quede como op.
<strong>FELIX BEDOYA</strong>: sí lo voy a revisar porque son políticas de ellos que han cambiado. ya varias personas, pues compañeros que traen trabajan, no alumnos míos, sino compañeros que trabajan con antigravity y me comenzaron a a decir que se están acabando rápido las cuentas eh del uso los procesos. Entonces yo investigo de pronto qué podemos hacer como para que rinda un poquito más porque debería de render mucho más, pero eso pasó a partir de esta semana que hicieron unos cambios también el
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: El domingo,
<strong>FELIX BEDOYA</strong>: domingo.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: yo el domingo fue que trabajé en la tarde y sin mentirle, simplemente le dije que me ubicara uno una inspección que estaba haciendo allá en la lavandería y que me organizara como unos daticos, unas cositas. Pero fue superpquito y ya se me acabaron los tokens y ya cobrándome otra vez.
<strong>FELIX BEDOYA</strong>: No, él no te va a cobrar otra vez.




00:05:23


<strong>FELIX BEDOYA</strong>: Él no te va a cobrar otra vez. Yo les voy a explicar algo importante. Pues ahí que también me dijiste que van siendo como cositas que de pronto se me van pasando por alto, pero para que tengamos en cuenta. Mira, acá estoy en antigravity y yo voy a settings y por acá tenemos algo que se llama models, ¿listo? Que son modelos. Yo cuando bajo el acá por en este primer pedazo, estos dos nosotros a veces es bueno como como hacerle seguimiento. Acá me habla de los modelos de Gemini que tenemos nosotros y de los modelos de cloud. y chat GPT que tenemos nosotros eh para el uso. ¿Listo? ¿Qué es lo que me está diciendo él? Espa, yo cierro acá. Nosotros tenemos de Gémini, tenemos ustedes les va a aparecer el este 4 pun este Gemini 4 Argon el 3.8 y le aparece estos cloud y y char GPT. Esos esos de cloud chat GPT realmente sí son esos acaba muy rápido porque son como créditos que regalan esas mismas empresas.




00:06:25


<strong>FELIX BEDOYA</strong>: Pero lo importante acá que nosotros debemos de de tener en cuenta es que acá, por ejemplo, nos dice límite de 5 horas. Acá dice F limit, o sea, cada 5 horas cada cuánto se va a comenzar a a a parar para darnos otras 5 horas para comenzar. Y por ejemplo, miren que a mí me dice, "Yo tengo el 80% consumido de ese límite de de 5 horas. Cuando yo me lo consuma, obviamente esto a medida de que va pasando el tiempo, estas 5 horas se van como reanudando. Pero si yo en este momento hiciera muchos procesos, pusiera muchos procesos a la vez, yo me consumiría ese límite de 5 horas y ese es el que le aparece de por sí a uno. Y hay otro límite que es un límite de de la semana, pero que realmente es por días. Por ejemplo, acá me dice tu límite de un día y 23 horas. Mira que acá me dice 1: 23 horas, lo llevo al 6%. Entonces yo a veces, yo casi no le paro bola la verdad, pero yo a veces sí vengo y miro, ay, venga, he trabajado tanto en estas últimas 5 horas, ¿cuánto llevo de de trabajo en ese límite como para venir y ponerle ponerle cuidado, así como que nosotros podemos como llevarle como manejo a la alimentación de los de los procesos.




00:07:45


<strong>FELIX BEDOYA</strong>: Igual, como les dije, yo mañana me siento juicioso a a verificar cómo eh los otros compañeros, yo yo estoy en un grupo de Telegram con mucha gente que que son programadores, realmente no hacen tanto lo que hacemos nosotros, sino que son directamente programadores y ellos muestran muchas como pautas o claves de cómo poder hacer rendir más ese esos procesos. Entonces, yo mañana me pongo juicioso y les mando un guioncito de cómo hacen para que lo lo ingresen. Pero no es que te cobre otra vez doña Gloria, no, él no te está cobrando. Él simplemente te está diciendo, nos agostamos el límite o de 5 horas o de 2 días. Eso es lo que te está diciendo. Entonces, nos toca como esperar ese tiempo para volver a para volver a realizar otro proceso. Igual consumase consumase todos los modelos.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Ahí está.
<strong>FELIX BEDOYA</strong>: Tú ahí vas a ver más modelos. Tú puedes utilizar el CHPT, el Cloud, el Cloud Opus. Puede que te hayas gastado el cuatro y te aparezca el aviso, pero si no si sigues trabajando en el mismo, te va a seguir apareciendo el aviso.




00:08:45


<strong>FELIX BEDOYA</strong>: Lo aviso, lo aviso, lo aviso, el aviso. Y si te pasas al ocho, puedes seguir trabajando normal. O puede que te hayas gastado el del ocho y que el cuatro todavía lo tengas disponible y los otros también todavía los tengas disponible. Entonces es chévere que también estén pendientes de eso. No quiere decir que inmediatamente les aparezca el aviso, quiere decir que todos los modelos estén bloqueados, ¿no? De por sí hay otros modelos que todavía tienen crédito y los pueden seguir trabajando. ¿Listo? Entonces,
<strong>Carolina Colorado Cano</strong>: Ve,
<strong>FELIX BEDOYA</strong>: como importante esto
<strong>Carolina Colorado Cano</strong>: yo cambiaba de correo de de una vez, o sea, puedo cambiar los modelos y ahí sí después cambiar de correo.
<strong>FELIX BEDOYA</strong>: sí,
<strong>Carolina Colorado Cano</strong>: No.
<strong>FELIX BEDOYA</strong>: hasta que se los agote todos y vuelve y les digo, puede que le pasan. Ah, ustedes ponen el cuatro. El cuatro es el como el más poderoso, por así decirlo, en ese momento y ustedes lo trabajan y en cualquier momento están trabajando un túnel, le apareció la aviso. Entonces ustedes dicen, "Ah, se me se me acabó, entonces voy a cambiar de correo." Que eso también lo puedes hacer,




00:09:36


<strong>FELIX BEDOYA</strong>: doña Gloria. cambia de correo por por otro que tengas gratuito y les y le vas le vas trabajando, le vas dando como manejo y llegas y lo cambias y dices, "No, espere, mira el 3.8 porque lo más seguro si estás trabajando, de por sí la plataforma nos abre con el último modelo. Entonces, yo llego y me lo gasto." Es un modelo que como tiene procesamientos de pensamientos más amplios, se consume más rápido y además es un modelo más nuevo, entonces nos dan menos procesos para nosotros realizar. Entonces, lo que pasa es que con ese 3.8 cuando nosotros lo vamos a utilizar encontramos de que tiene mucho más procesos para para trabajar. Entonces, importante nosotros eh tener como pendiente eso. Siempre cambien, siempre vayan como cambiando. Los de Cloud son muy buenos los que aparezca ustedes de más que le aparecen. Sí, más que le aparecen estos. Eh, son muy buenos y y tienen la equivalencia a un 3.8, ¿cierto? Tiene la equivalencia un 3.8. Este OPUS equivale casi a un cu.




00:10:36


<strong>FELIX BEDOYA</strong>: Y el teach GPT sí es como muy regularcito, pero para todo lo que sea eh modificar archivos, eh buscar documentos, o sea, tareas simples. Créan que con ese chat GPT perfectamente lo pueden hacer sin problema. Ya cuando son procesos de pensamiento muy muy amplios o para hacer aplicativos o cosas en HTML, ¿sí? directamente el primero de cloud que les aparezca a ustedes, el primerito, el comienzan con el cuatro y si se le acabó el cu ahí si pasan al 3.8. ¿Listo? Pero eso es como como el orden de manejarlo. Entonces estar como en ese juego. Puede, doña Gloria, que en ese momento todavía tengas créditos en ese 3.8. ¿Listo?
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Listo. Muchas gracias. Yeah.
<strong>FELIX BEDOYA</strong>: como para que verifiquemos ahorita qué otras puedan pueden tener Caro o Xiomara.
<strong>Carolina Colorado Cano</strong>: No, pues yo ojalá hubiera podido practicar un poco más, pero en realidad como tengo tantas auditorías, bueno, termino el viernes, yo creo que después del viernes ya no voy a tener excusa para practicar.




00:11:46


<strong>Carolina Colorado Cano</strong>: Lo que yo traje fue un ejercicio, pues íbamos a ver ahorita del pago de una seguridad social, a ver si se puede automatizar.
<strong>FELIX BEDOYA</strong>: Pero un pago la seguridad social en qué?
<strong>Carolina Colorado Cano</strong>: en una de las plataformas. E qué plataforma es esa ahopacos.
<strong>FELIX BEDOYA</strong>: Ni siquiera la había escuchado. No.
<strong>Carolina Colorado Cano</strong>: Ah, ya.
<strong>FELIX BEDOYA</strong>: Y eso es lo que yo les decía la otra vez, que era muy importante buscar, pero veño, le pongo otra cosa. o MCP. Acordme que tenemos tenemos esos dos conectores nosotros que pueden tener las las
<strong>Carolina Colorado Cano</strong>: Mhm.
<strong>FELIX BEDOYA</strong>: herramientas.
<strong>Carolina Colorado Cano</strong>: Ok.
<strong>FELIX BEDOYA</strong>: Acá le dice la elección entre API tradicional, ¿no? Pero acá me ya me trajo otra consulta diferente, pero acá si me dice Asopago no cuenta con una API pública documentada libre de acceso para desarrolladores externos. Sus canales de integración y consultan están diseñados de forma oficial a través de plataformas institucionales. Eh, gestor de archivos API. No, no, no la no la tienen caro.
<strong>Carolina Colorado Cano</strong>: Ah, entonces hay que habría que entrar con cada una con enlace y mirar si enlace sí tiene.




00:13:35


<strong>Carolina Colorado Cano</strong>: Ok.
<strong>FELIX BEDOYA</strong>: El Lan sí lo tiene el AC sol. Eh, hay varias que yo ya había verificado porque nosotros ya trabajamos con varias, pero de hecho, de hecho, yo, por ejemplo, esta de asopagos en mi vida la había escuchado. Es que hay un montón, la verdad hay un montón,
<strong>Carolina Colorado Cano</strong>: Mhm.
<strong>FELIX BEDOYA</strong>: pero yo pensé que todas eran como uno me entra mucho a esas a esos y captados son como iguales. No, no tiene no tiene
<strong>Carolina Colorado Cano</strong>: Nico, dale. Cuando vos le pedís, él queda da con
<strong>FELIX BEDOYA</strong>: igual igual caro. Eso ahí se puede hacer con web scrapping. Yo te puedo enseñar, pero obviamente esto se sale como del curso, lo puedo enseñar como el proyecto. ¿Listo? Automatizaciones. De pronto ahorita te muestro de qué tipo de automatizaciones hablamos porque esto ya hace parte como un proyecto que tú desees hacer. Eh, si quieres hacer tema de seguridad social,
<strong>Carolina Colorado Cano</strong>: Mhm.
<strong>FELIX BEDOYA</strong>: me parece muy chévere eso. De hecho, mucha gente lo está haciendo en este momento, les va muy bien.




00:14:43


<strong>FELIX BEDOYA</strong>: Entonces, como podemos estar mirando eso, pero en el proyecto personal que que vayamos a sacar cada uno. Tomí,
<strong>Carolina Colorado Cano</strong>: L Yeah.
<strong>FELIX BEDOYA</strong>: dime.
<strong>XIOMARA ARDILA</strong>: Hola, buenas tard buenas noches. Eh, F una preguntica. Bueno, yo pues yo tengo muchas de pronto tengo dudas en muchas cosas, pero pero pues no me voy a enrear tanto porque me voy a poner a como dice Carolina juiciosa, a leer todos los videos que de las clases que hemos tenido, pero me interesa mucho el tema de las automatizaciones.
<strong>FELIX BEDOYA</strong>: Sí.
<strong>XIOMARA ARDILA</strong>: Quisiera saber eh lo que pasa es que me pasó esta
<strong>FELIX BEDOYA</strong>: Bien.
<strong>XIOMARA ARDILA</strong>: semana. Hm. Yo pues hago parte, yo soy la que me encargo de la liquidación, de liquidar las planillas, ¿sí? En aportes en línea y eh y el coordinador se encarga de la parte de la nómina.
<strong>FELIX BEDOYA</strong>: Ah.
<strong>XIOMARA ARDILA</strong>: Entonces, se me acercó una de las trabajadoras porque pues estábamos con el tema de las horas laborales del personal. Nosotros manejamos eh horarios por turnos, sobre todo en especial auxiliares de enfermería.




00:16:00


<strong>XIOMARA ARDILA</strong>: Entonces, unas estaban inconformes con con algunas variaciones que que yo trabajé más y me pagaron más poquito. Entonces quisiera saber si de pronto por medio de las automatizaciones me puedo orientar un poco, pues yo no soy la que saco las digamos digamos la las contabilidad pues de todo eso porque eso no me compete eso lo maneja la la contadora, pero quisiera de pronto como verificar de cierta manera de pronto ya como por cosa mía el tema de los valores, cuánto se le debe pagar dependiendo de los horarios, los turnos
<strong>FELIX BEDOYA</strong>: Eso es, eso es refacilísimo. Siomara,
<strong>XIOMARA ARDILA</strong>: y no sé si se pueda manejar
<strong>FELIX BEDOYA</strong>: eso es refacilísimo porque nosotros podemos crear un agente.
<strong>XIOMARA ARDILA</strong>: eso con automatizaciones.
<strong>FELIX BEDOYA</strong>: Podemos crear un agente. Claro. Ahí me escuchas. Sí. O bien me escuchas.
<strong>XIOMARA ARDILA</strong>: Se entrecorta como la comunicación.
<strong>FELIX BEDOYA</strong>: ¿Me escuchas bien?
<strong>XIOMARA ARDILA</strong>: entrar cortar la comunicación. Sí, ya ahora sí.
<strong>FELIX BEDOYA</strong>: Listo. Eh, si vemos aportes en línea, si tiene API, miren que una vez me aparece si tiene API, entonces nosotros podemos hacer una conexión a a ellos.




00:17:25


<strong>FELIX BEDOYA</strong>: ¿Qué nos permite a nosotros aportes en línea al conectarnos con ellos? Es poder automatizar las planillas, las novedades y a llegar hasta el parte de pago, no hacer el pago, sino llegar hasta dejarlo listo para hacer el pago. Eso es lo que nosotros nos permite, una API. ¿Listo? Otra cosa es muy diferente es darle respuesta a los empleados o a los colaboradores en las dudas que ellos tengan en temas de pago de nómina. Entonces, de por qué las deducciones se hicieron. Puede ser por incapacidades, sea por por faltas, puede ser porque no no corresponden a las horas extras que trabajo o porque o por x razón pueden tener diversas o variables dudas en su pago de nómina. Eso.
<strong>XIOMARA ARDILA</strong>: No es que no es que como le digo yo, lo que pasa es que pues la compañera fue y habló con el con la persona pues que hace todo el tema en la nómina y le dijo que pues que no entendía y él le lo que le respondió fue que vaya y mire el cuadro de turno, haga suma, resta y mire y verifique y ahí sí venga y me y me y me qué y me pide corrección o o sea, o sea, no le explicó tampoco, o sea, realmente fue como todo grosero.




00:18:42


<strong>XIOMARA ARDILA</strong>: Entonces ella se dirigió hacia mí y pues yo el tema de los cálculos y eso pues yo no sé y pues quisiera también como saber un poco más de este tema como
<strong>FELIX BEDOYA</strong>: Por eso es exactamente lo que yo te estoy diciendo.
<strong>XIOMARA ARDILA</strong>: What?
<strong>FELIX BEDOYA</strong>: Es es exactamente lo que yo te estoy diciendo. O sea, todas las novedades que pueda tener o variaciones que pueda tener el pago de una quincena a un trabajador, pues puede depender de mucho, de horas extras, de días no trabajados, o sea, puede tener muchas variables, ¿cierto? Incapacidades, permisos no remunerados, un montón de de cosas. Eso nosotros mediante una API no lo podemos hacer porque no hay una no hay una data en en un universo que tenga la información que tiene tu contador, ¿cierto? al menos de que él nos permita ingresar al software donde hace la nómina electrónica. Si él nos permite ingresar al software, si ah que lo hacen en Sigo. Ah, listo. Nosotros nos conectamos mediante API a SIGO, miramos la nómina electrónica y es muy fácil nosotros con un agente cualquier duda.




00:19:44


<strong>FELIX BEDOYA</strong>: Entonces yo llego, mi trabajadora tiene este duda, va y una vez me responde porque tiene la data. o simplemente ese contador o esa personita que paga la nómina te va a pasar todo en un Excel, me imagino que lo voy manejar toda esa nómina electrónica se puede descargar, tú la puedes poner en una carpetica, creas un proyecto, le das un rol a esa gente, le das un rol a esa gente como, no sé, eh, encargado de seguridad social, ese agente simplemente va a leer esa carpeta y lo que va a hacer al a partir de leerla y tú hac una consulta, le va a explicar por qué se hizo el pago de esa manera y ya. Pero entonces tienes dos formas, una es que nos digan desde qué operador hacen el pago de la nómina electrónica y si nosotros nos podemos conectar mediante API. Vuelvo y le digo,
<strong>XIOMARA ARDILA</strong>: Oh.
<strong>FELIX BEDOYA</strong>: Alegra, eh, no sé, sigo lo permite. Hay muchos de de nómina electrónica que lo permiten hoy en día. Entonces, si nos los permite, aleluya, hay un montón.




00:20:43


<strong>FELIX BEDOYA</strong>: Si nos permiten nosotros entrelazarnos con Antigravity, es facilísimo, facilísimo, porque no tenemos ni que pedir información. Simplemente el trabajador viene y me hace la duda. Yo le pregunto a mi agente y mi agente se conecta en la nómina electrónica y me va a responder de por qué le pagaron.
<strong>XIOMARA ARDILA</strong>: Ahí está.
<strong>FELIX BEDOYA</strong>: y ya.
<strong>XIOMARA ARDILA</strong>: Bueno, nosotros tenemos, yo sé que ellos manejan mucho el sigo, pero para para ese tema y de de conexión y eso tendría que tener algún exceso o permiso.
<strong>FELIX BEDOYA</strong>: Sí, claro. Tiene que ser el el con el usuario administrador, esos arrojan dos claves, perdón, una clave y un token. Y es superfácil. Ya con esa clave y ese token tú te tú te puedes conectar a la API de de S. Es superfácil eso, ¿eh? No te miiento en 5 minutos uno lo hace siendo mucho tiempo,
<strong>XIOMARA ARDILA</strong>: No,
<strong>FELIX BEDOYA</strong>: pero obviamente tiene que ser desde allá.
<strong>XIOMARA ARDILA</strong>: pues ahí sí me queda un poco difícil.
<strong>FELIX BEDOYA</strong>: Claro, porque como nosotros vamos a tener acceso a una información privada y una empresa, ellos eh de allí nos tienen que dar la autorización de esa de esa clave, o sea, la API, la clave API, o sea, la conexión API y la conexión MCP MCP se da a través de unos códigos.




00:21:58


<strong>FELIX BEDOYA</strong>: Ejemplo, cuando nosotros colocamos nuestra clave API de Gemini para inteligencia artificial, que es una clave API y es tu clave API, es mi clave API personal. Entonces, debemos de solicitar esa clave de API a la empresa. Usted la debe solicitar para poder hacerte una conexión y para poder darle respuestas a los colaboradores de forma oportuna. O sea, si son inteligentes se la darían a ti para que hagas ese trabajo que ellos no quieren hacer de una forma oportuna, pero no lo podemos hacer de una forma diferente si no nos conectamos a una clave app. ¿Listo? Que se puede automatizar. Claro, también yo puedo colocar una automatización que a mí me revise esa nómina electrónica. de, no sé, todas las quincenas los días de que se monta o se paga o al otro día y que a cada trabajador a su correo le llegue una explicación del por qué se le pagó con esas novedades.
<strong>XIOMARA ARDILA</strong>: Y y si por lo menos si a mí me comparten la el Excel de la nómina se puede cona, no sé.
<strong>FELIX BEDOYA</strong>: Si a ti te comparten el Excel de la nómina, simplemente es que hagas un proyecto en Antigravity y estés actualizando o creando, o sea, nómina primera quincena de enero, segunda quincena de enero.




00:23:11


<strong>FELIX BEDOYA</strong>: Entonces, tú le dices a la gente, tengo eh tal pregunta de tal trabajador por la segunda quincena de enero. Quiero saber por qué se tiene esas novedades. De la gente de una vez va a ir a investigar allá y te da la respuesta.
<strong>XIOMARA ARDILA</strong>: Pues entonces sí sería de pronto con ese como para ayudar un poquito.
<strong>FELIX BEDOYA</strong>: Más fácil tod más fácil todavía.
<strong>XIOMARA ARDILA</strong>: Sí, como para Ajá. Listo.
<strong>FELIX BEDOYA</strong>: Más fácil tod si lo quieres automatizar de la misma manera, simplemente le creamos una automatización que un día después de que te pasen el Excel y se pague la nómina, valga la aclaración, él vaya a esa carpeta, verifique lo que hay ahí y le mande correos a todos los trabajadores dándoles a conocer las novedades de por qué se le pagó diferente o si se le pagó eh igual a siempre. al IBS que se le di pag, entonces también se puede automatizar. Listo.
<strong>XIOMARA ARDILA</strong>: Okay, listo.
<strong>FELIX BEDOYA</strong>: Eh, Gloria, ¿tú te traías algún ejemplo de automatización para hoy?
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: No, no, la verdad no, no.




00:24:13


<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: He trabajado casi en el tema.
<strong>FELIX BEDOYA</strong>: ¿Listo? Es muy importante porque cuando ustedes me dicen a mí, "Yo no he trabajado en el tema, yo estoy seguro que no es porque no quieran, sino que porque el tiempo no les da." Listo. Y obviamente porque el tiempo no les da, es porque ustedes están haciendo unos trabajos, unas tareas en sus empresas que asesoran, en las actividades diarias de una empresa donde trabajan. Entonces, se supone que si nosotros estamos haciendo ese curso hoy, no es simplemente para yo entrar cuando pueda a chatear con Antigravity a que me dé respuestas o a que me genere informes o que me genere tareas, sino a yo dejar automatizaciones hechas para yo poder liberar espacio, tener un bienestar. Realmente es para eso yo tener bienestar o poder captar más empresas y tener una un más recursos financieros, ¿cierto? Y en últimas eso más bienestar también. puede ser el bien el bienestar para las personas es es diferente. Ejemplo, para mí el bienestar es tener tiempo libre. Puede que para otra persona su bienestar pueda tener unas finanzas mucho más altas, pero ahí ahí es donde cons bienestar.




00:25:19


<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Félix, pero yo no sé si de pronto a la resto de las compañeras les pasa lo que les pasa a mí. Es como una inseguridad que yo como que no es como pegada, como que no he podido arrancar con ese con ese programa. No sé si es porque ya estoy tan acostumbrada como a trabajar con cla o pero no sé, hay algo que como que no me no me deja arrancar, como que siento que desconfío, no tengo la seguridad, entonces es como cierto temor también al proceso aquí pues como sincerándome contigo. No.
<strong>FELIX BEDOYA</strong>: No, tranquila, Gloria. Primero, en temas de confianza es normal, mira, yo como, por ejemplo, lo voy a pasar una carpeta a antigravity y aunque yo sé que si pasara algo ellos en últimas eso se responde, pero yo cómo la voy a pasar una carpeta antigravity donde aparezca mi número de tarjeta de crédito y mi clave, ¿cierto? No, pues yo no haría eso. Mi cédula yo la pasaría. No hay problema. Es que mi cédula en últimas cuando uno nos va a ver, mi cédula la pueden tener más de 30 empresas a nivel nacional, facilito.




00:26:26


<strong>FELIX BEDOYA</strong>: Y por ahí pudieron haber pasado. Mi número de cédula, mi fecha de nacimiento, mi nombre completo, mi dirección, mi celular, eso me me desigual. Hay un montón de información que realmente a veces nosotros en la cabecita pensamos, ay no, es que esa información realmente es privada. Pero ya dejó de ser privada hace mucho tiempo. Ejemplo, Gloria, tú tienes Instagram, tú puedes que tengas Facebook, tú tienes redes sociales desde ahí, ¿ya?
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Sí, claro. Todo eso lo tengo. Sí.
<strong>FELIX BEDOYA</strong>: ¿Cierto? Entonces, desde ahí ya tu información, personal realmente ya está en el mundo cibernético, por así por así decirlo. En temas de responsabilidad de información de empresas, pues hay un hay informaciones muy sensibles. Te hago un ejemplo. Yo, por ejemplo, esta semana eh hice un contrato con una empresa y la empresa lo primero que me dijo, "Ah, es que necesito que me mandes estados financieros de tu empresa para poder hacer la contratación." Yo que les dije, "No, es que los estados financieros de mi empresa son totalmente privados. no hace parte del interés vuestro para hacer una contratación o lo que vamos a hacer.




00:27:33


<strong>FELIX BEDOYA</strong>: ¿Por qué te doy un ejemplo? Porque eso sí es una información privada. O sea, ¿para qué tú le vas a montar antigravity los estados financieros de una empresa? ¿Cierto? Yo no se lo haría. al menos de que sea el contador y le no tiene no tiene sentido.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: No tiene sentido. Aá.
<strong>FELIX BEDOYA</strong>: Pero si tú me dices que le vas a montar un pervil socioemográfico, unos examen, unos unos reportes, ¿no? Porque eh los conceptos de exámenes médicos, porque ni siquiera es historial médico, son conceptos de exámenes médicos. O sea, yo te voy a decir una cosa con sinceridad, Gloria, porque nosotros montamos a con somos SST con un montón de aplicativos, no creas que lo hicimos sin antes asesorarnos con un abogado. ¿Por qué? Porque nosotros necesitábamos saber que la data que estábamos solicitando que montaran dentro de WAPI, aunque es responsabilidad de cada usuario, manejarla de una forma responsable, no fuera a traernos problema. por meterla dentro de Wapi y la data que están montando dentro de WAPI no es más que la misma data que tú manejas de un sistema de gestión de seguridad en el trabajo.




00:28:42


<strong>FELIX BEDOYA</strong>: Entonces el abogado me decía, "Félix, pero ¿qué información privada pueden tener que no la muestr?" Ejemplo, yo te voy a decir una cosa. Cuando tú vas a empresas, miras páginas web de empresas muy grandes, muy grandes, vas a un Isagen, no sé, un EPM, empresas muy grandes y tú le comienzas a investigar, vas a ver que le aparece eh reglamento interno de trabajo, políticas de de seguridad y salud en el trabajo, políticas de acoso laboral, o sea, todas las políticas le aparecen, le va a aparecer perfectamente que han hecho programas de vigilancia epidemiológica. usted comienza a mirar y les aparece de todo y abierto y abierto. Obviamente que no le va a aparecer un perfil socioemográfico, pues porque cómo van a aparecer los nombres de los trabajadores, pero aparecen un montón de actividades del sistema de gestión que es al público, ¿cierto? Entonces, si es ante esa información que tú me dices que te da susto, ¿no ves que es lo mismo dárselo a Antigravity que dárselo a Cloud, que dárselo a Chag PT, a cualquiera, es exactamente lo es exactamente lo mismo.




00:29:46


<strong>FELIX BEDOYA</strong>: Obviamente cada empresa tiene unas políticas diferentes y ahí pues me le robo un poquito de de del tiempo de ustedes. por ejemplo, por ley, por ley eh la inteligencia artificial y Son leyes ni siquiera colombianas, son leyes de Estados Unidos y leyes de la Unión Europea. La inteligencia artificial, la información que nosotros le pasemos, esa información queda en un backup 30 días, ¿cierto? No quiere decir que ellos ni la utilicen, ni la miren, ni ni como antes que entrenaban la inteligencia artificial con esa información. Nada. Por ley tiene que quedar reposada por 30 días. De hecho, se los digo, yo no cerré un negocio muy grande con Sura por eso, porque la inteligencia artificial de por ti hay que tener ese backup y es y es y es mundial, o sea, ni siquiera ni siquiera es de nosotros y no quiere decir que es que se quedan con información, no tienen información de Rundo y todo el mundo, ¿cierto? Pero si es por eso, Gloria, yo te despejo la mente, facilito. O sea, es lo mismo que tú le des la información a CH GPT que Antigravity.




00:30:57


<strong>FELIX BEDOYA</strong>: De hecho, me parece una empresa mucho más segura, Google mundial que un CH GPT, un Open que se creó hace 6 años, ¿cierto? o un cloud que se creó hace como IA que se creó hace 3 años y que ahorita trabaja con Antropic, que es una empresa grandísima que tiene también muchos años al lado de Microsoft, pero pues también es muy nueva. Entonces si es ante ante temas de seguridad estamos trabajando con la más segura de todas, si es ante eso. Entonces ahí sí te doy como un parte de seguridad.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: No, supercaro,
<strong>FELIX BEDOYA</strong>: Por eso,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: no, no, no, Feliz,
<strong>FELIX BEDOYA</strong>: por eso no.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: en esa parte es supercaro y yo creo que desde el principio que empezamos con WAPI, usted dio mucha claridad frente al tema. Eh, más que esa seguridad es como la otra parte personal,
<strong>FELIX BEDOYA</strong>: Ok.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: como que el trabajo sí salga pues alineado como uno lo quiere hacer. O sea, la verdad es que uno tampoco le ha puesto todo el tiempo que realmente amerita esto porque esto requiere bastante tiempo para poder arrancar bien.




00:32:08


<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Es más como por esa parte, por el tema de la seguridad, lo que vos decís, total puede ser más inseguro Claudio GPT que este programa. Eso yo ya lo tengo supercaro, más bien es como la otra parte que no sé, hay algo que no he podido como arrancar en forma, como que yo me meto a la plataforma de antigravity y no las la información no me sale en las carpetas, o sea, yo sé que es falta de cacharrearle más, entonces como que no me he podido adaptar a ese proceso. Eso.
<strong>FELIX BEDOYA</strong>: Claro. Y el tema el tema es muy sencillo. Obviamente uno a veces tiene ese como ese ese bloqueo y de hecho yo no les he mostrado antigravity. De hecho son dos softwares diferentes. Miren que yo acá abajo tengo dos diferentes. donde yo les muestre este negrito, ahí si es que quedamos muertos, literal, porque es mucho de programación, entonces trae un montón de cosas que nos nublan a nosotros la mente y yo por eso les enseño uno que es más compacto.




00:33:12


<strong>FELIX BEDOYA</strong>: ¿Qué les quiero yo mostrar que les abrí esta página? Lo que pasa es que nosotros obviamente cuando comenzamos a utilizar, a ver, conectar todos a ver, yo lo ve acá, cuando comenzamos nosotros a utilizar la inteligencia artificial, nos acostumbramos a utilizar un chat como este, ¿listo? donde simplemente están por acá los chats que tenemos, donde si de pronto hacíamos unos proyectos, unos cuadernos, entonces por acá nos quedaban puestecitos. Pero si vamos a ver, este es el chat normal y podría abrir chat GPT, no es muy diferente, es muy parecido. Entonces es como abrirnos un poquito un poquito la mente en cuanto a dónde nos quedan los formatos. Es cierto. Es cierto porque a mí me pasa mucho, Gloria. Yo qué es lo que hago, yo creo que se los he dicho. Yo muchas veces le digo, "Ay, venga, por favor, créeme una copia a la vez en el escritorio." O yo inmediatamente antes de que me haga la tarea le digo, "Ese formato quiero que quede en tal carpeta." Yo desde el principio les decía,




00:34:19


<strong>FELIX BEDOYA</strong>: antigravity se creó para programar. Nosotros le estamos dando un uso que realmente no es un uso normal que le la comunidad ni que se creó para ese uso, pero nosotros lo estamos explotando de tal manera para seguridad de salud el trabajo que muy poquitas personas créan en Colombia y se los aseguro, lo van a explotar de esa manera. Y yo por eso les decía desde un principio, tenemos que hablar con antigravity como si fuera a veces un niño. Explicarle de una forma tan detallada que puede hacer la actividad de una forma muy muy muy bien. Y cuando yo una tan detallada es que si yo le digo, "Ay, bien, es que yo me quiero es que pongámonos en los pies de Antigravity. Hagamos de cuenta de que yo fuera antigravity y usted, Gloria, me dice a mí, "Créeme un informe de una auditoría de sistema de gestión de seguridad al trabajo de esta carpeta." Ah, yo se lo creo, pero tú en ningún momento me has dicho dónde lo guarde. Entonces, yo tomo la decisión más oportuna donde guardarlo.




00:35:22


<strong>FELIX BEDOYA</strong>: A diferencia de acá, porque si yo acá le digo, mira, te doy acceso a una carpeta en el Drive, créame, créame un informe, él te lo va a dejar acá mismo para descargarlo. En Antigravity, si yo no le digo, él va a buscar dónde la forma más óptima para él guardarlo. Entonces, si yo veo que para mí eso se vuelve como como un reto que para mí lo es, vuelvo y yo le digo yo, para mí lo es. No sé si ahorita vieron que un momento a otro que estábamos haciendo la capacitación se abrió una carpetica por acá y es porque yo estoy haciendo unos videos, pero yo ya leí la instrucción de él de que cada He. que me haga algo, me abra el documento. Entonces, cuando me abre el documento, me abre la carpeta. Eso a mí me ayudó a superar eso mismo que te está pasando a ti. Pero si yo fuera más organizado, yo simplemente siempre le diría, "Ese informe guárdalo en tal carpeta o guárdamelo en tal parte." Yo suelo decirle, "Hazme una copia en el escritorio para yo simplemente minimizar e ir a abrirlo de una vez allá y tenerlo la mano." Pero deberíamos de ser más organizaditos y decirle exactamente en qué parte de esa




00:36:27


<strong>FELIX BEDOYA</strong>: carpeta queremos de que lo guarde. Listo. Es como es como eso, pero créeme que si aprendemos a manejarlo, uf, es que es es de mucho mucho beneficio. A ver, yo por acá les doy acceso a compañeritos que estaban ahí pidiendo el acceso.
<strong>XIOMARA ARDILA</strong>: Eh, feliz, una preguntica. Uno puede eh enlazar a a eh, se me olvidó a Antigravity, pero por lo menos yo tengo acceso a la plataforma del aire sur no sé qué tan bueno será.
<strong>FELIX BEDOYA</strong>: No,
<strong>XIOMARA ARDILA</strong>: Ok.
<strong>FELIX BEDOYA</strong>: AR Sura no tiene no tiene API Lo único que podemos hacer con AD, con ARL y ellos no nos van a dar esa información, eh, lo único que podemos hacer con ARL es un web scrapping. ¿Qué es web scrapping? Es que Antigravity nos va a abrir una página y por ejemplo yo le digo,
<strong>XIOMARA ARDILA</strong>: Ok.
<strong>FELIX BEDOYA</strong>: "Ah, yo quiero verificar si x trabajadores tienen el certificado en de lesura." Entonces, él solito va, coloca la cédula, lo verifica, me baja el certificado y me lo pasa y ya.




00:37:44


<strong>Carolina Colorado Cano</strong>: Feliz
<strong>FELIX BEDOYA</strong>: En cuanto a es lo único que podemos hacer y es muy muy ganador eso.
<strong>Carolina Colorado Cano</strong>: feliz. Lo que yo hago es que en la carpeta o en el en sí, donde yo tengo esa revisión, le copio la app para poder que él sepa que ahí es donde debe revisar o ese ejemplo lo vamos a ver ahora.
<strong>FELIX BEDOYA</strong>: de de cualquier herramienta.
<strong>Carolina Colorado Cano</strong>: Por ejemplo, que quiero validar la seguridad social.
<strong>FELIX BEDOYA</strong>: Ejemplo, yo me vengo y él por acá me dice, me permite consultar la app, entonces yo tengo que buscar acceder en línea la información confiable, tengo que buscar la documentación de la API y si no se la da igual que me la busque. A ver, aquí no. Acá me está diciendo que ingrese directamente soluciones, ¿no? Ahí simplemente yo le diría que me busque cómo, cuál es la documentación de la API, porque las API uno lo saca directamente cuando ingresa a los portales. Hay una parte que dice desarrollador y inmediatamente la saca. Acá no sabría exactamente. tenía que cacharrarle un poquito más como para buscar la documentación.




00:39:00


<strong>FELIX BEDOYA</strong>: Él busca la documentación y le dice exactamente cómo se va a conectar y ya la documentación exactamente nos dice de dónde va a sacar la clave app internamente para conectarlo. Pero créeme, Carolina, que si hay una herramienta que le diga, "Ah, tiene clave app." Tú le dices a Antigravity, "Ven, quiero que este esta herramienta" y le puedes colocar el link. De hecho, yo le pondría este. A ver, busco por acá un proyecto este que es para jugar. Mira, es es simple. Mira que yo no le pregunté nada más. Ah, bueno, lo hubiera puesto en el cuatro. Él simplemente se va a ir a buscar dónde está las instrucciones para desarrolladores de cómo conectarnos a nosotros a la clave API, porque nosotros lo que hacemos realmente es cosas de desarrolladores. Esto no lo hace la gente del común, ¿no? Listo. Entonces es lo que se va a ir era a buscar la Yob. Así lo mismo con cualquiera. Es que mira, por yo les puedo colocar sigo app, sino que sigo si lo tiene más abierto.




00:40:30


<strong>FELIX BEDOYA</strong>: ¿Cómo funciona? Sigo. Entonces él de una vez acá me comienza la instrucción, es que sigo API, sigo API ta y me dice, "Mira, documentación." Ah, bueno, la tiene mal acá. Eh, conoce el software administrativo, pero es la AC me explica cómo lo debo sacar. Ubica el símbolo de engranaje la tuerca. Clic más configuraciones y app integraciones, clic autenticaciones, credenciales. Mira que él no da los pasecitos de sigo. Yo se lo paso antigravity, me va explicando. Yo entro a sigo, saco las las claves que el token y la appi, se lo paso a Antigravity y él solito conecta y ya. Yo no tengo que hacer nada más, ni ponerme a programar ni nada, absolutamente nada más tengo que hacer. Ahorita miramos.
<strong>Carolina Colorado Cano</strong>: Y ya luego solo lo instrucción que eh verifica en esa página la seguridad social del listado que tengo en la carpeta o en el Excel que se llame tal y ya él como Ya está conectado. Ya va y verifica en esta Sí,
<strong>FELIX BEDOYA</strong>: Ajá.




00:41:31


<strong>FELIX BEDOYA</strong>: Exactamente. En ese proyecto,
<strong>Carolina Colorado Cano</strong>: en ese proyecto. Sí,
<strong>FELIX BEDOYA</strong>: acordémonos que nosotros nos conectamos y se crean por acá.
<strong>Carolina Colorado Cano</strong>: sí, sí. Yeah.
<strong>FELIX BEDOYA</strong>: Yo voy a settings, por ejemplo, voy a hacer un ejemplo en este que es para jugar que se llama no lo a ver, yo comienzo a bajar y él por acá este no tiene ninguna conexión. Abramos este libre chat que este si tiene de tener conexiones. skill eh plugins. Acá donde dice plugins, esas son las conexiones que que son mediante API, eh, o MCP que pueda tener. Entonces, les va a comenzar a aparecer acá de cada proyecto, ¿cierto? De cada proyecto, eso es lo importante. De cada proyecto les va comenzar a aparecer acá. Entonces, ¿a qué va eso? No es que esa API se le conecte a todos los proyectos que tú tengas, sino a ese proyecto que tú le le estás dando la instrucción. Ahí es donde se pone la app. Mira, de hecho acá hay una vez cómo pusieron la conexión técnica y él acá ya comenzó a explicar.




00:42:39


<strong>FELIX BEDOYA</strong>: Listo. Entonces, mira que simplemente sí lo primero que yo haría es decirle, "Ven, hay tal herramienta, tal aplicativo que yo utilizo una empresa para tal tema, quiero que me busques en la web si tiene conexión API o conexión MCP o si tiene alguna forma de yo conectarme desde Antigravity para saber la data." Ya, él va a ir a buscar y te va a decir si nos podemos conectar. nos conectamos de esta forma, necesitamos esto y ya tú te vas a hacer la la conexión y después comienzas a a verificar lo que puedes hacer directamente según la plataforma que tú tienes. Realmente es que la gran mayoría tiene conexión, la gran mayoría tiene conexiones a a API para hacer información. Vuelvo y le digo, hasta por ejemplo, empresas como Bancolombia para yo hacer pagos, perfectamente me puedo conectar a la API de mi cuenta y comenzar a hacer los pagos desde antigravity, ¿cierto? Eso, por ejemplo, lo que decía Gloria ahorita, eh, temas de seguridad, pues ya a mí todavía me da eso como cosita hacerlo. Eso todavía no lo no lo he puesto como en práctica y creo que me demoraré un poquito en hacer unas claves de seguridad para poder ponerlo a hacer pagos de de mi empresa.




00:43:49


<strong>FELIX BEDOYA</strong>: De resto, créemen que yo de mi empresa casi que todo lo automatizo. Casi que todo lo automatizo. Entonces, como que tratar de de realizar eso en temas de automatizaciones vamos a hablar un poquito, un poquito, ¿no? Yo quiero que no importa si la clase de hoy no no me tomen a mal, no vaya a ser tan enfocada lo que debe ser la clase, pero yo necesito que ustedes comprendan qué son automatizaciones, porque si nosotros no comprendemos qué son automatizaciones y flujos, no vamos a llegar a lo que yo quiero que ustedes lleguen, ¿cierto? y vamos a seguir, si bien sí reduciendo mi carga laboral porque estoy poniendo un aplicativo como Antigravity hacer alguna herramienta, no estoy logrando lo que yo quiero, que es que el computador por sí solo se quede trabajando mientras ustedes puedan hacer uso de su tiempo en otras actividades o en más trabajo, si así lo deciden, ¿cierto? Entonces vamos a tratar como de abrir la mente hoy en esto y de hecho yo les voy a explicar muchos ejemplos que tengo en Wapi. que de hecho creé una herramienta en WAPI solamente pensando en ustedes la semana pasada, porque yo dije, tengo que crear crear algo para abrirles la mente y que desde Wapi podamos utilizar de una forma mucho más fácil de crear esos esos flujos de trabajo que se vuelvan




00:45:09


<strong>FELIX BEDOYA</strong>: automatizaciones. ¿Listo? Entonces, comprendamos esos dos conceptos. está el flujo de trabajo, que el flujo de trabajo, a ver, yo abro por acá un flujo de trabajo y esto sí lo vamos a ver muy detalladamente. Yo creo que toda la clase hoy no vamos a ir en esto y no importa si hay que hacer una clase de más, chicos, créame, o en una semana hacemos dos clases, a mí eso no me no me es de más, pero lo importante es que nos quede claro esto. Un flujo de trabajo es el no es más sino el paso a paso que debe seguir toda mi inteligencia artificial en un montón de herramientas y procesos para crearme una automatización. Venga, yo por acá subo este muñequito. A ver, que me está quedando como tapado. Ah, no me lo está dejando jalar. A ver, a ver. Acá, para acá, déjelo por acá. Epa. Listo. Entonces, un flujo de trabajo es eso, chicos. ¿Cuál es el proceso? Desde inicio a fin.




00:46:25


<strong>FELIX BEDOYA</strong>: Y acá me voy a ponerlo la cara para que me miren cuál es el cuál es el proceso de principio a fin para que esa automatización funcione. Quizás para que lo veamos mejor. Se me ocurrió mostrarles de esta manera. A ver, yo abro un mapa de procesos cualquiera. A ver si este me deja abrir. Miremos este mapa de procesos. Mire que el mapa de procesos desde a dónde parte. Siempre parte desde una necesidad, desde una entrada. y ese mapa de procesos que es lo mismo, cambiemos ese concepto procesos por automatización. ¿Listo? Entonces esa automatización parte desde una necesidad que se vuelve una entrada para que haya un montón de procesos para lo que lo último se pueda satisfacer esa necesidad. Eso es lo que nosotros hacemos en una automatización. recibir una necesidad, una petición. En este caso es el PROM que nosotros le demos y podemos darlo de muchas formas. Ahorita lo vamos a ver el PROM que nosotros le damos a la inteligencia artificial para que a nivel de un montón de procesos anclados, mira que por ejemplo acá me dice, hay un pedido, una planificación, una fabricación, hay un almacenamiento y entrega y una facturación.




00:48:15


<strong>FELIX BEDOYA</strong>: Mira los procesos que tuvo que haber para que una necesidad de un cliente tuviera una satisfacción. Y lo mismo pasa con la con nuestros procesos o perdón con nuestro mapa de procesos que lo llamamos flujos dentro de la inteligencia artificial. Entonces nosotros tenemos una entrada o una necesidad y en guapi, trat de decir hasta muy vistoso. Esto se llaman nodos. Todo esto se llaman nodos. Él no es nodos, pero para como ustedes aprendan a saber cuál es un nodo de inicio y cuáles son unos nodos de herramientas, dónde está una inteligencia artificial y cuáles son unos nodos de salida. Ejemplo, entonces cuando hay una entrada, ¿cierto? una necesidad es ese pro, o sea, es la petición que yo le hago a la inteligencia artificial puede ser cualquiera. Ahí, venga, por favor. Yo necesito que a mi trabajador que tiene un número de cédula 1037 58999, por favor le verifiques en la RL, no solamente en ARL, sino en el adres y en el Ministerio de Trabajo, si cumple con certificado RL activo, EPS activo y certificado de alturas.




00:49:42


<strong>FELIX BEDOYA</strong>: Esa es mi petición. Esa es mi petición, ¿cierto? Entonces, esa es la necesidad, mi petición que yo le estoy haciendo a la inteligencia artificial, a que puede entrar de varias maneras. Sí. Y eso nosotros lo definimos dentro de Wapi o dentro de la inteligencia artificial como un disparador. O sea, ¿quién me manda esa información? Mediante qué herramienta yo recibo esa información. ¿Listo? ¿Qué herramienta? Ejemplo, yo cuando mando un prom acá, no es que yo escribo, no. Yo estoy utilizando ¿qué? Un chat, ¿cierto? Esa es la herramienta que está utilizando Antigravity para recibirme, para recibir él mi necesidad que yo le estoy enviando a él. ¿Listo? Esos son unos disparadores. Nosotros tenemos unos disparadores para poder desencadenar todo ese proceso que en últimas me va a satisfacer la necesidad que yo tengo. Pued sonar lo más repetitivo que que sea y se los va a repetir mil veces de la misma manera para que nos queda que queda claro. va a haber una necesidad en un disparador, o sea, un prom, un prom que me va a permitir desencadenar un flujo en un montón de procesos internos para que luego me satisfaza esa necesidad de ese listo, ya les puse el ejemplo.




00:51:10


<strong>FELIX BEDOYA</strong>: Ejemplo, necesito, por favor, que me diga si mi trabajador con nombre X y número de cédula tal en el en la RL tal está activo o no. No crean que es que cuando yo le hago esa pregunta antigravity, HGPT, a CL, él pum, abrió los ojitos y una vez tuvo la respuesta, ¿no? Él tuvo que activar un montón de procesos y de flujos para poder llegar a esa respuesta. Y lo mismo lo que yo les les pido a ustedes, tenemos que abrir esa mente para poder nosotros saber cuáles son todas esas herramientas o procesos internos para cubrir esa necesidad y nosotros llegar a esa satisfacción. Entonces, para nosotros, para nosotros vamos a tener unos disparadores, que es que la entrada. Recuérdenme qué es un crono. ¿Quién me puede decir que es un crono?
<strong>Carolina Colorado Cano</strong>: Es como una actividad que se repite y se repite. Sí.
<strong>FELIX BEDOYA</strong>: Exactamente. Es una automatización que se repite, que se repite. Y cuando hace una repetición, cuando nosotros le damos a ese Chrome, por ejemplo, yo lo voy a abrir yo acá le voy a dar click, el AC acá me va a decir Chrome programado.




00:52:22


<strong>FELIX BEDOYA</strong>: Y mire que lo que me está pidiendo, con qué frecuencia debe dispararse automáticamente. Me dice todos los días, días de la semana, días del mes, cada hora. Cuando yo hace Chrome le doy esta información, se vuelven un Tiger. Listo. El Chrome simplemente la automatización que me permite darle una temporaridad de de que esa actividad se haga solita para yo colocárselos en términos del español, pero es Chrome y Tiger. Tiger es el tiempo, esto y Chrome como tal es lo grande, en lo que está adentro. El Chrome es la automatización y la temporalidad que yo lo dio la automatización en términos coloquiales para que no nos tengamos que que en realar. ¿Listo? Entonces, miren que eso puede ser una entrada porque además no es que el solito, acá lo quité, no es que el solito simplemente yo abra un Chrome y simplemente le ponga las fechas, no. Él me dispara una actividad, pero con un con un prom, ¿cierto? Yo pronto, yo ya lo tengo. Ah, ¿qué qué va a pasar si llega al día?




00:53:29


<strong>FELIX BEDOYA</strong>: Muchas veces le he puesto el ejemplo. ¿Qué va a pasar si llega el día lunes a las 7 de la mañana? Ah, me va a recibir me va a revisar las carpetas de la semana pasada donde mis compañeros hicieron inspecciones, hicieron eh capacitaciones, charlas, eh no sé, verificaron la seguridad social, no sé, cualquier actividad. Entonces, hay un PROM para esa automatización, para ese Chrome. ¿Listo? que hace el esperador. Tenemos disparadores diferentes en Wapi. Sí, Tenche, que ya hoy en día yo no tengo a Tenchi, ahorita les enseño si tenemos tiempito. Yo mi avatar ya lo cambié, lo cambié por por Suri. Ustedes todos pueden cambiar sus avatar. Ya tenemos un montón, pero tenemos sentencia. Entonces, ¿qué es lo que hace si yo le doy esa entrada a él y simplemente ya no es una automatización con temporalidad, sino que yo llego y le escribo atenche al chat o le hablo y le digo, "Ay, venga, por favor, es que necesito saber si el trabajador fulanito Pérez de mi perfilográfico con cédula tal tiene eh los exámenes médicos al día." Ese es el disparador.




00:54:40


<strong>FELIX BEDOYA</strong>: Mire que yo ya le di el PROM y él él es el disparador. ¿Qué es lo que hace? Desencadena todo un flujo. ¿Listo? a que tenemos otras entradas como disparadores. Claro, podemos hacerlo con Antigravity porque ya sabemos que Antigravity tiene un chat y manda un mensaje. Antigravity puede ser local como nosotros lo trabajamos o cloud en la nube como les enseñé hace 8 días que podíamos nosotros abrirlo. un correo también yo puedo mandar un correo a otro correo que tenga acá ya automatizado dentro de Wapi y que yo diga, "Vea, si me llega un correo a x parte desde al remitente, dispáreme este flujo." ¿Por qué? Porque es un mensaje de entrada. un agente de A. Cuando me dice agente de A es porque un agente de los que nosotros tenemos en WAPI, simplemente le pedimos esa solución y como él ya conoces un flujo de estos, viene y me lo descarga acá para que la actividad sea mucho más fácil. Un reporte de QR. Ya nosotros hemos visto que un QR si yo lo abro me puede sacar una unas preguntas, una lista o una información donde simplemente yo llenándola me tira me tira un disparador.




00:55:51


<strong>FELIX BEDOYA</strong>: Ejemplo, vea, yo he visto unos disparadores con increíble. Simplemente yo llego y puedo colocar en un cartel en una empresa y decir, "Ah, ¿quieres saber si tu quieres descargar tu certificado de afiliación a la RL?" Facilito, facilito. Se los voy a poner un QR. Entonces se abre el QR y en el QR le va a le va a pedir cédula, perdón, nombre completo, cédula y fecha de nacimiento. Con esas tres datos y darle enviar, él se me vuelve un disparador. Acá ya lo puso. Es me vuelve un disparador que hace que se desencadene eso. Entonces, en mis segundos nodos, ahorita les voy a explicar los otros, puede haber uno que simplemente vaya a la RL, ponga la cédula, la fecha de nacimiento, mire el certificado de afilación, lo descargue y se lo mande a algún lado, se lo mande al correo simplemente con saber cuál es el número del trabajador y ya. Y lo he visto en empresas y son disparadores muy chéveres que muchos trabajadores lo pueden utilizar de una forma muy oportuna.




00:56:58


<strong>FELIX BEDOYA</strong>: Ah. que el pago de la que si Omar ahorita me hablaba el pago de la nómina. Ah, listo. Entonces yo tengo una duda. Yo para qué me voy a ir a preguntarle directamente a Siomara si yo puedo hacer un disparador con un QR donde me coloque, mira, soy X persona con cédula tal y mi novedad a la nómina es tal. Pum, lo envía. Él va y busca la nómina, busca porque hay unas novedades, hace el proceso y saca una y saca una satisfacción. Ahorita les enseño a dónde puede llegar la satisfacción y en este caso a ese trabajador, como ya tenemos los datos de ese trabajador, perdón, de ese trabajador en mi perficio demográfico, yo se lo puedo mandar a un correo, a un WhatsApp, a un Telegram, no sé, o a un medio de comunicación que tenga acceso de trabajador o si tenemos intranet a una intranet. Listo, pueden haber un montón de entradas, pueden haber un montón de salidas. En wapi nosotros tenemos estas un webcop, un webcookup API simplemente es una conexión de una herramienta diferente a la que nosotros estamos hablando que me genere el desencadenamiento de de un flujo.




00:58:04


<strong>FELIX BEDOYA</strong>: Ejemplo, que yo llegué y hice, no sé, el pago de la seguridad social y en el momento que se haga el pago de la seguridad social quiere decir que ya esa seguridad, todos esos trabajadores tienen seguridad social paga. Entonces, ¿me puedes desencadenar? una actividad como la relación de nómina para que se haga toda la nómina de todos los trabajadores y a cada trabajador le llegue cosas así, por así decirlo. WhatsApp también puedo yo hacerlo como un disparador que simplemente yo al escribir a un a un número con la solicitud del PROM que tenga se me dispare todo este todo este flujo. ¿Listo? Quiero que quiero que me digan si les queda claro qué es una entrada, una necesidad en este caso que entra por un disparador o si tienen alguna duda para yo resolverla hasta acá. No, chicos, ¿les queda claro? Okay, respóndame con manita.
<strong>Carolina Colorado Cano</strong>: Voy a parafrasear un poquitico, Félix, a ver si de pronto, cierto, lo que tú dices del flujo es porque es importante saberlo porque ya no ahora solo le voy a dar la




00:59:22


<strong>FELIX BEDOYA</strong>: Sí.
<strong>Carolina Colorado Cano</strong>: instrucción como revísame o actualízame este archivo, sino que yo le voy a pedir que haga más actividades al tiempo que al final voy a obtener un producto. Sí. Y puede ser eso, ya no es solamente hágame un archivo, sino envíeme un correo, mándeme un mensaje, eh, sí, y de modo que yo no lo tenga que hacer. Entonces, por ejemplo, me no sé si este aplicaría entrega elementos de protección personal para no diligenciar uno a uno. Puede ser que ellos, no sé, lo hagan a través de un código QR. Eso que ellos diligencien, me va a ir a otro lado y luego me va a llevar a un correo de pronto donde yo pueda enviarle al final de mes a la persona que hace los inventarios, mire, estos son todos los EPPs que he entregado, entonces esto es lo que queda, pero yo ya no lo tengo que hacer, sino que él va a hacer la automatización hasta enviar el correo. No.
<strong>FELIX BEDOYA</strong>: Tal cual. La automatización es un montón de tareas que yo uno para que me llegue una satisfacción real.




01:00:20


<strong>FELIX BEDOYA</strong>: Yo por eso les ponía el ejemplo con el mapa de procesos, porque si yo ejemplo cuando tú y puede ser va a sonar como como simplicista, caro, pero cuando yo le pido antigravity o chat GPT o a Cloud o a Wapi ay, hágame un informe sobre x actividad, yo simplemente puedo estar haciendo de este mapa de procesos, simplemente puedo estar haciendo dos pasos. ¿Por qué? Porque y ¿qué va a pasar con ese informe? ¿A quién le tiene que llegar? ¿Cierto? Puede haber quedado totalmente cortado. Y la automatización es eso, que tenga una necesidad y que cierre esa necesidad, o sea, que no quede una brecha abierta en esa necesidad. Ejemplo, los lotos que tú creaste. Cuando yo creo una automatización, yo simplemente le mando la información que yo necesito para que mi agente sepa lo que va a hacer, pero él debió debe haber hacerlo auditado, verificado de que haya quedado bien, el mismo crearme una bitácora de que ya lo hizo bien y que qué fue lo que comprobó para saber que quedó bien y enviarlo directamente a la persona encargada y envíameo copia a mí.




01:01:34


<strong>FELIX BEDOYA</strong>: Eso es un flujo. Yo no di derecho en más y eso es lo que nosotros hacemos, no solamente seguridad salud el trabajo, porque yo sé que eh este curso está en un pocado seguridad en el trabajo, pero la intención es que hablamos el espectro a muchos más campos, ¿cierto? Pero eso es un eso es un flujo y lo que tú dijiste caro es eso. Exactamente. Dejar de pensar que simplemente eh la inteligencia artificial está creada para eso, porque es que esto ya murió. O sea, venir a escribir acá y se los vengo diciendo desde hace rato, eso ya murió. Ya en el mundo de la inteligencia artificial, escribir eso ya va en decadencia. Y lo que tenemos que ir es poder hablar para hacer un disparador que me cree esos flujos. Y no es más de lo que nos dijo con las mismas palabras Carolina. Listo. Les voy a hacer un ejemplo acá.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: una preguntica así loca antes de que continúes.
<strong>FELIX BEDOYA</strong>: No, no hay ninguna loca.




01:02:35


<strong>FELIX BEDOYA</strong>: Antes las preguntas más locas son las mejores.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Listo. Por decir algo, yo tengo 100 trabajadores que se le hicieron los exámenes periódicos y le doy la orden de que haga la trazabilidad, si es favorable, no favorable. él me los descarga en la matriz que yo tengo diseñada para esto y me levanta el informe y a través del correo electrónico se lo manda a la persona que yo le voy cierto, la persona indicada. Hasta allá también puedo ir.
<strong>FELIX BEDOYA</strong>: Claro, digo, yo, ¿qué haría? Yo llegaría y guardaría todos los conceptos médicos en una carpeta y creo el el flujo sería dar en prom, ¿cierto?, a un agente o crear un Chrome, ¿cierto? Que me comienza a revisar esa carpeta, puede ser cada 3 días, cada 8 días o en la periodosidad de que entre trabajadores a mi empresa y que salga los exámenes médicos y son todos los días. Entonces, que lo revise todos los días a finalizar la tarde y que me verifique el concepto médico, me llene el perfil sociodemográfico con las condiciones o o lo que me arroje el concepto México, que me cree la carta de recomendaciones médicas, además, y que esa carta de recomendaciones médicas se la mande al trabajador.




01:03:48


<strong>FELIX BEDOYA</strong>: Pero no solamente eso,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Mhm.
<strong>FELIX BEDOYA</strong>: yo a ese flujo le crearía un otro cronom, o sea, los flujos. Voy a volver a abrirlo acá y tranquilos que vuelvo y les digo, si nos tenemos que tirar hoy todo el día con toda la clase con esto, no importa, no la tiramos toda y hacemos otra clase, no importa. Los flujos, como lo ven acá. Esperen, yo trato acá me quedó muy pequeño. Yo lo pongo más pequeñito. Este flujo, como lo ven acá, podría tener un subflujo y el subflujo sería, en este caso, el ejemplo de Gloria, que a esa recomendación médica que se le hizo ese trabajador de seguimiento médico, ¿cierto?, o esa carta de de seguimiento médico, yo le creo una carpetica y me haga también el seguimiento a esa carpetica de esas recomendaciones médicas, yo podría crear un subflujo de este partiendo de esa otra indicación. ¿Y qué es lo que hace? pues me va a crear todo el seguimiento médico de ese trabajador desde que ingreso a la empresa con un examen médico de ingreso partiendo por recomendaciones médicas, seguimientos médicos, exámenes periódicos, hasta el retiro.




01:05:10


<strong>FELIX BEDOYA</strong>: Perfectamente. De hecho, Gloria, te voy a decir una cosa y vuelvo y le digo, puede que yo suene muy simplicista, pero la el ejemplo que me tú me estás dando es de los ejemplos más fáciles para hacer un flujo porque no tiene tanto enredo. Es un flujo que es lineal. Revíseme una carpeta. Si esa carpeta tiene esta información nueva, aliménteme el preficio demográfico. El prefio demográfico, por favor, cuando quede el alimentado, me crea, por favor, las cartas de de recomendación médica y se lo manda al trabajador un correo. Es lineal.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Listo. No, ya aquí la clave es cómo planteamos la necesidad.
<strong>FELIX BEDOYA</strong>: Y acá voy a eso. Esperen, acá voy a eso que este botoncito me está molestando. Yo salgo acá. M. Ustedes van a poder entrar a Wapi y van a ver algo que llama tareas, ¿cierto? En tareas, en la parte de arriba ustedes va a llegar de una vez acá donde me dice tareas. Ustedes no van a tener creo que ninguna.




01:06:12


<strong>FELIX BEDOYA</strong>: Puede que les tenga una ahí de ejemplos, pero van a haber unos que dicen flujos preestablecidos. Esos flujos son para estudio y si quieren pues utilizarlos para para sus empresas. Pero desde Guapia ahorita les voy a decir que se deben de cumplir unas características entre estas, pues tener conectado antigravity para algunos de los flujos, no para todos. ¿Listo? Ejemplo, de este flujo, hay un montón acá, hay 55 flujos diferentes. No, no voy a alcanzar a leerlos todos, pero voy a alcanzar a leer la gran mayoría para que comenzamos a hacer preguntas y comenzamos a a interactuar con el flujo y a mostrarles los otros nodos del proceso. Mira lo que me dice. Audita diariamente los expedientes del ITO 2 y 3 para detectar exámenes médicos ocupacionales, cursos de alturas, entregas de PP vencidos o próximos a vencer. de 30 días. Si hay vencimientos, escálalos a la ACPM, al calendario y mándeme un correo por Gmail. Si todo está vigente, registran la Vita Cora limpia en WAP. Listo, voy a volver a abrir.




01:07:29


<strong>FELIX BEDOYA</strong>: Eso es un flujo y ese flujo sí tiene muchos enredos porque no me está diciendo solamente una actividad, sino que me está diciendo que vea un montón de actividades en solamente un flujo. Entonces, teníamos un disparador, ¿cierto?, una entrada. ¿Y qué me dijo? Ah, revísenme el perceso demográfico para mirar qué trabajadores pueden tener exámenes médicos vencidos. Revísenme. Estos son nodos ya de mis aplicativos. Yo acá puedo tener otros nodos. Ahorita vamos a ver que hay un montón de nodos. Revíseme la entrega de EPP de mis trabajadores a ver si a ese trabajador ya se le va a vencer y le debo entregar un EPP. Recordemos que los EPPs nosotros también disponemos de temporalidades para renovarlos sin importar muchas veces que el desgaste sea el suficiente. Nosotros también debemos de de hacer un seguimiento. O revíseme los permisos de alturas si están vencidos. Mira que hubo una entrada y esa entrada me está diciendo de que me revise algo. Listo. Hay nodos. de unión.




01:08:40


<strong>FELIX BEDOYA</strong>: ¿Qué es un nodo de unión? Fácil, como la tarea al inicio me está dando el pron inicio me está dando tres tareas diferentes, mira, tres tareas diferentes, yo le pongo un nudo de unir y ese un nudo de unir es que al sacar la información de esas tres partes That's me. una en una nada más. ¿Listo? Para que cuando le llegue la inteligencia artificial no le lleguen tres mensajes, sino que le llegue un mensaje con la información de las tres tareas que me está pidiendo. De aquí pasa y yo sé que esto va a comenzar a sonar complicado, pero esto lo vamos a comenzar a hacer todos. Tranquilos, no se me asusten. Y aquí pasa a una condicional. ¿Por qué tiene una condicional de sí o no? Porque resulta que si esa pregunta que me dice de que si encuentre algo vencido no encuentra nada vencido, pues yo para qué voy a mandarle ese mensaje a mi agente si no hay nada que hacer, ¿cierto? Entonces, ¿qué es lo que hace el flujo?




01:09:41


<strong>FELIX BEDOYA</strong>: de una vez me manda la notificación de regreso, puedes yo puedo disponer esa notificación que me llegue directamente a WhatsApp, a un correo, a donde yo quiera y simplemente diciéndome revise todo. O sea, una confirmación, no simplemente de que se hizo el flujo y como no encontró nada, entonces no pasó nada y a mí no me llegó no nada, no. que me llegue y me diga, eh, reviseé todo y no hay nada vencido. Ah, okay, perfecto. Mi bitácora queda de que no hay nada vencido. Ah, que sí encontré de que hay algo vencido. Entonces, pase a mi agente. Mi agente ya tiene unas instrucciones. ¿Listo? Y esas instrucciones es simplemente lo que hablamos allá. Simplemente vamos a verificar de que si estén vencidos. Entonces él simplemente yo le digo, "¿Qué inteligencia artificial va a usar?" Yo pude usar 3.6, 3.5, 3.8. Antigravity en local desde mi computador, antigravity en la nube. Esa la inteligencia artificial que va a ser todo el proceso para generar el informe, verificar la memoria de la empresa, saber la empresa, entonces, cuál es la empresa, la información para que el informe me salga de una forma y una característica muy bien hecha.




01:10:58


<strong>FELIX BEDOYA</strong>: La bitácora, ¿qué quiere decir bitácora? memoria de bitácora es que cada vez que yo repita este flujo, ejemplo, yo hice este flujo hoy y resulta que ese trabajador, un trabajador del perficio demográfico, tiene los exámenes médicos vencidos y mañana volví y disparé ese flujo, pero el examen médico de ese trabajador no nos lo hizo. Cuando ese proceso se hace en la memoria de Vitácora, ya hay que ese trabajador desde ayer tenía ese examen vencido. Entonces, hoy, ¿qué me va a decir? Ojo, ya van dos veces que le he mandado la alerta. Entonces, me comienza a dar una alerta más alta para ese trabajador, ya que lo he revisado varias veces y el por qué yo a ese trabajador no lo he mandado el examen médico, porque ese trabajador no ha ido o por cuáles las razones de que no se ha hecho el examen médico. Eso es lo que me permite hacer la memoria de bitácora. O sea, la memoria de bitácora es que me revisa las automatizaciones anteriores que yo he hecho sobre sobre el mit.




01:11:55


<strong>FELIX BEDOYA</strong>: Cuando el el agente ya me hizo el proceso, verificó, me trajo la información, es lo único que ya hace es responderle a, en este caso yo lo tengo, que mi centro de control en WAPI, entonces me cree las tarjetas para yo hacerle seguimiento y de la misma manera que me lo ponga en Google Calendar para yo tener un recordatorio también, que me ponga una bitácora en Gmail o yo podría decirle que no me creo una bitácora, sino que le mande un correo a la IPS en este caso. o a los trabajadores o al área encargada. Eso ya lo configuro. ¿Cómo yo? Simplemente puedo abrir el nodo y el nodo tiene unas características que yo le puedo colocar. ¿Listo? Por el momento, simplemente fijémonos en esos flujos, cómo nosotros vamos a a constituirlos. ¿Listo? Eh, herramientas. A ver, no destraer texto. Entonces, yo puedo traer información. Yo puedo traer información de un código, de un correo de Gmail, de un Drive, de OneDrive, de mi computador, es extraer trabajadores, extraer de aplicativos de SST, web, scrapping, o sea, que vaya a la a la nube y me busque x eh página.




01:13:12


<strong>FELIX BEDOYA</strong>: Ejemplo, lo que pasa, de hecho, a mí el sistema de gestión de seguridad salud en el trabajo me obliga a tener bases, o sea, me pregunta yo, ¿de dónde me fijo para poder actualizar mi matriz legal? Yo puedo llegar y colocar un flujo de trabajo, una automatización con un flujo de trabajo donde le diga, "Ven, por favor, vaya a estas páginas del Ministerio del Trabajo y todos los días me verifique si salió una norma nueva en seguridad y salud del trabajo." con web scrapit, el va verifica, ah, sí sale una nueva norma, me la trae, no solamente me la trae, yo le puedo decir que aparte de que me la traiga, me haga un resumen y si me aplica mi empresa, me diga si me aplica toda la norma o si me aplica cuáles artículos de esa norma y que me como resultado qué artículos me aplica. De hecho, puedo llegar hasta decirle, si yo tuviera una matriz de legal, que me alimente la matriz legal con esa nueva norma, es esos artículos que a mí me apliquen con web scrap, eh tareas de alto riesgo, certificados de ARL, o sea, podemos tener información de un montón de aplicativos.




01:14:19


<strong>FELIX BEDOYA</strong>: Wappy tiene más de 50 aplicativos, ahí es donde cobra mucho más vida los flujos. tiene más de 50 aplicativos que nosotros podemos utilizar para eso. Vamos a hacer otro ejemplo de otro flujo y ahorita yo les doy yo les muestro algo. Este, vigila la carpeta de talento humano SST en Google Drive. Ya sabemos que un no donde nosotros podemos mirar data también es Google Drive. Detecta encuestas sociodemográficas o PDFs desde conceptos de de aptitud médica nuevos e inyecta la actualización en somos sin duplicar cédulas. Simplemente me está diciendo que actualice mi perficio ESO demográfico. Llévenlo ustedes a sus propias carpetas, a su propio mundo. Yo simplemente le estoy dando ejemplos de cómo lo haría en Wappy. Yo ahorita le voy le voy a mostrar algo. Ahorita vamos a hacer algo en Antigravity. Otro nodo, revisa reportes nuevos de accidentes, incidentes laborales. Purat. Pues yo le puedo decir que lo revise en mi aplicativo de Wappy, que lo revise en un correo de Gmail. Si si es que ahí me llegan los furat, que me revise una carpeta del drive, una carpeta de mi computador en local y ch le de inspecciones en Google Drive, Gmail o QR de trabajadores y regístralos en Latel.




01:15:40


<strong>FELIX BEDOYA</strong>: O yo le puedo decir que no simplemente lo registre, sino que me haga la investigación de accidente y que esa investigación de accidente me la mande un correo, quedó listo. O sea, yo no tengo que hacer nada más. Busca en vivo en la web nuevas leyes, decretos, resoluciones circulares del Ministerio de Trabajo, el que dije yo ahorita, aplicables al código y nivel de riesgo de tu empresa. Ahí está. Eh, audita la matriz PEPS, el parque automotor y consulta root SIMIT vía antigravity para detectar SOAT. Eh, me imagino que eso son votomultas, licencias vencidas o comparendos activos. Ahí está. cruza el inventario de sustancias químicas con Puchen. Entonces, el PEN es la API que nosotros manejamos en riesgo químico, el decreto 1496 de 2018 para detectar productos y hojas de vida, me imagino, sin etiquetas o incompatibilidad y almacenamiento. Consulta cada mañana el clima real, lluvia, tormenta eléctrica, ráfagas de viento, índice V y estrés térmico en la ciudad de la empresa y emite controles para el trabajo en altura e ises. Brutal. Revisa evaluaciones posturales o as estudios de puesto de trabajo, restricciones médicas ostomusculares, integrando guías clínicas de Mediplin para readaptación laboral.




01:17:02


<strong>FELIX BEDOYA</strong>: Esta API de Medipl es brutalísima porque es donde nos aparece toda la información de enfermedades laborales, pero a nivel mundial. Y no solamente eso, sino que le dice cómo se debe rehabilitar ese trabajador. Es brutalísimo. Entonces, miren, analiza indicadores agregados de la batería de riesgo psicosocial, analítica del clima laboral y gestión de comité de convivencia, protegiendo estrictamente la reserva legal. Entonces comienza a analizarlos y nos genera un informe y así tenemos un montón. ¿Alguien me está al usando la mano o entró? Ah, Mauricio entró. Vamos a ver por acá más abajo. Revisa mensualmente las carpetas de contratistas y proveedores críticos en TR Gmail verificando el pago de la seguridad social, ARL, PS, fondo de pensiones, certificados de altura inducción CST antes de autorizar el ingreso. Esto es muy chévere. Yo le decía la otra vez que eso eso lo manejan. Alguna. las constructoras ya para ingreso de trabajadores, sino que una personita ahí tenga que estar copiando cédula por cédula y comenzar a mirar todo eso yo creo que no tiene fin.




01:18:09


<strong>Carolina Colorado Cano</strong>: Feliz,
<strong>FELIX BEDOYA</strong>: Sí,
<strong>Carolina Colorado Cano</strong>: esto que tú nos estás mostrando está Wappy, y para uno aplicarlo simplemente tendría que seleccionar porque tú ya hiciste este flujo o cómo?
<strong>FELIX BEDOYA</strong>: simplemente le dan en acá abajo dice personalidad, ¿no? Acá usar en mi empresa.
<strong>Carolina Colorado Cano</strong>: Ah, ok.
<strong>FELIX BEDOYA</strong>: Pero ojo, yo por eso les decía tienen que cumplir unas características. ¿Cuáles son las características? Vamos a a cualquier flujo, al primer flujo que es el que hemos visto más. ¿Cuáles son las características de de este flujo? Ejemplo, me dice, vaya al perficio gráfico. Pues si yo mi perficio demográfico no lo tengo actualizado, pues él no tiene que revisar. Vaya mi entrega de PP, pues no tiene que revisar. Vaya a permisos de altura, pues yo no tengo permisos de altura, pues no tiene que que revisar. Pero ustedes esto lo pueden cambiar. Listo. Y eso yo se los voy a enseñar porque es que yo simplemente le puedo decir, no que vaya mi perfil demográfico, yo le puedo decir, voy a volver acá de extraer datos que vaya, ¿qué?




01:19:18


<strong>FELIX BEDOYA</strong>: Al drive y él por acá me va a decir que vaya al drive de X correo, que lo active. Ese es el único que tengo activado ahí. Y por acá me dice qué datos exactamente yo quiero sacar de los trabajadores que encuentre allá. Listo. De hecho, yo le puedo colocar hasta exactamente cuál carpeta de ese drive verificar. Entonces, pues ustedes me pueden decir, "Ay, Félix, pero es que yo en el flujo eh yo no tengo el perfilodemográfico actualizado. Mira que yo lo cambié. Eh, yo quiero más bien que no mire el perfilemográfico de Wappy, sino que me mire el perfilemográfico de mi empresa. Ah, yo lo tengo en el drive. Listo. Extraer de drive de esa carpeta donde usted lo tiene. Ah, pero es que no lo tengo en el Drive, lo tengo en el en mi en una carpeta en el computador. Ah, listo. Entonces, poner la carpeta por acá se me puso más abajo. Permiso de altura. Ver dónde me quedo. Míralo acá.




01:20:20


<strong>FELIX BEDOYA</strong>: Poner la carpeta de de mi PC. Entonces, yo, ¿cuál yo qué haría? Borraría entonces, ¿cuál es? Este, listo. Entonces, ya no es que solamente lo tengo en el de la carpeta de mi computador, tengo mi permiso gráfico, que vaya ya a sacar esa información, pero ya sabemos que qué necesitamos nosotros para que Wappy vaya a mi computador. ¿Quién me responde eso?
<strong>Carolina Colorado Cano</strong>: conectarlo con antigravity. M.
<strong>FELIX BEDOYA</strong>: Exactamente. Entonces, mire que hay unas condiciones. Claro. Le puedo decir al flujo, vaya a mi carpeta, de mi computador, a tal carpeta y mire tal archivo. Ah, sí, yo lo puedo automatizar acá y darle esas instrucciones. Pero si Antigravity no está conectado con Wappy con los tres pasos que yo le enseñé, él no se va él no va a poder entrar a esa carpeta. ¿Listo? Entonces hay unas condiciones para poder utilizar los flujos que nosotros tenemos acá. AG Gmail. Ah, Google Calendar. Ah, pero si yo no tengo en integraciones conectado, Wappy, a mi correo, no le di las autorizaciones.




01:21:33


<strong>FELIX BEDOYA</strong>: Él no puede hacer esas tareas. Ah, los modelos. Si yo no tengo mis claves API, pues yo no voy a poder utilizar estos modelos. Ah, si yo no tengo conexión eh mi computador con antigravity, no lo puedo utilizar. Ya tengo ahí también los pasos pasos para conectarlos a la antigravity en nube. Ah, si yo no lo tengo conectado a la nube, pues tampoco lo puedo utilizar. Entonces sí yo les doy acá un montón de flujos. Hay 55 flujos ahí. Hay 55 flujos. Yo dejé hecho el día de hoy. Sí, pero tiene que cumplir unas características esos fluos para poder que nosotros los pueda realizar. Ah, que yo en Wappy entré, pero no he creado una empresa. Pues no, realmente no va a tener memoria de empresa, entonces lo no cumple ese punto de memoria de empresa. Entonces eso es lo que nosotros debemos de verificar para hacer los flujos en Wappy. Igual espérenme un momento porque yo soy muy transparente en todo. Yo les muestro desde wapi visualmente y desde estos nodos, desde estos cuadritos, estas bolitas, estos rectángulos, cómo nosotros hacemos automatizaciones de una forma sencilla, organizada y a mi necesidad, porque la necesidad de todos puede ser diferente.




01:22:48


<strong>FELIX BEDOYA</strong>: Y esto es muy chévere porque es que es muy bacano cuando yo puedo cambiar esos flujos yo mismo. Yo llego y elimino este, entonces yo no resulta que yo lo único que quiero son permisos de altura. Entonces, créeme que permisos de altura. Ay, no. Lo que resulta es que yo no quiero un cronquy, sino que simplemente, perdón, que simplemente lo que yo quiero es que la entrada me haga cuando yo hable con Tenchi. Ay, no, es que yo no utilizo a Techi, qué pereza. Yo no sé hablar con ese muñequito, ¿ven? Yo lo único que sé hacer de pronto es mandar un correo. Ah, listo. Pues entonces mandé el correo. Mandé el correo para que active el flujo. Yo lo que les doy la opción es eso, de que de una forma muy práctica con estos nodos nosotros podamos hacer esos flujos esas automatizaciones. ¿Listo? ¿Qué pasa con las automatizaciones? Hay automatizaciones que si no necesitamos antigravity, él va a correr toda en Wappy. Ejemplo, aquí no necesitamos antigravity.




01:23:51


<strong>FELIX BEDOYA</strong>: ¿Por qué? Porque más en un correo llegó, Wappy le correos, le puede llegar correos. Revisa elito 5 en altura. alturas. En este caso no necesitaríamos unir ramas porque no hay nada que unir. Simplemente me dice, "Ah, hay hay certificados en alturas vencidos." No, no hay vencidos. Entonces, devuélvame la a X salida. Sí, si hay vencidos, pásemelo a mi agente para que me haga todo el proceso y me haga el informe y me llegue donde yo quiero que llegar. Entonces, yo acá no necesité ninguna otra herramienta por fuera de de Wappy. Bueno, conectar a a Google. Pero cuando yo en este nodo de acá de extracción de datos, tengo a mi carpeta mi computador, vuelvo y juega lo mismo. ¿Qué pasa ahí? Sí yo tengo que sí o sí tener conectado antigravio para poder que me ingrese al computador a esa carpeta y me saque la información. Si no, no. El nodo no va a correr, ahí muere. V. El flujo no va a correr, ahí muere.




01:24:56


<strong>FELIX BEDOYA</strong>: Listo. Nosotros podemos correr los flujos. Este ya lo dañé, pero les voy a el ejemplo. Yo cuando hago flujo le puedo dar click y lo que hace él es comenzar a correr en uno en uno. Mira qué va pasando. Ejecutando paso en cada nodito. Miren, él va diciendo. Él acá me llevó hasta antigravity, no sé por qué. Ah, porque en el otro tenía las indicaciones de que me debía llevar antigrado y me me saca la respuesta. Él acá no me va a sacar una respuesta muy buena porque Daniel cambié todo el nodo, pero la me saca el ejemplo de respuesta. Mire que de hecho yo le pregunté por unos trabajadores y una vez por acá me comenzó a sacar la información. Listo. No la sacó tamban bien porque cambié muchas cosas del no. Pero entonces esa es la manera de nosotros hacer esos flujos. Lo que yo quiero que ustedes entiendan es eso, que hay una necesidad que entra por un disparador, que hay unos procesos que el proceso sería desde acá hasta acá y que hay una salida que es la que me entrega a mí la satisfacción de esa necesidad.




01:26:08


<strong>FELIX BEDOYA</strong>: Eso es lo que yo quiero que ustedes comprendan, que lo podemos hacer desde Wappy. Sí. Sí. Y ya ven que si le cogemos la cañita, créame que en una dos clases, en una clase enseñándole nodos, acá están todos los nodos, todos los nodos están acá, ustedes solitos comienzan a hacerlo o no lo tienen que hacer, hay más de 55 y yo yo cada ratico les voy a comenzar a subir nodo. simplemente le dan utilizar en mi empresa, pero que ustedes sepan al menos de que si hay unos nodos, saber para qué sirve ese nudo y saber de que qué tengo que conectar para que ese no si funciona o no funciona. Igual si yo no tuviera conectado antigravity cuando yo le doy clic sobre el nodo por acá hay algo que me dice lo errores. Entonces, el de una vez me diría, "No está conectado antigravit, tengo que ir a conectarlo. Listo. Eso solito me da como las indicaciones. O acá abajo, en vez de tirar el informe me hubiera dicho, "No, le falta una conexión." Eso es lo que eso es lo que hace esto.




01:27:11


<strong>FELIX BEDOYA</strong>: Y a esto llegamos nosotros al unir un montón de herramientas. Yo creo que desde la primera clase les he dicho, eh, no hay un solo aplicativo que cumpla todo. Necesitamos un montón de herramientas para poder nosotros hacer realmente una automatización de comienzo a fin. Y esta es la demostración de esto. Cada un cada bloquecito de estos que yo les muestro acá, cada uno es una herramienta que puede estar en Wappy, sí, pero muchas ni siquiera están en Wappy. De hecho, acá hay una, dos, tres, cuatro, cinco. De esos hay cinco que no están en Wappy. Son herramientas fuera de Wapi, que las tenemos conectadas por API, así o por MCP. Así, pero no son de Wappy. ¿Listo? Wappy lo que va a hacer es eso, a ustedes, permitirles crear esos flujos de una forma más sencilla y cada vez nosotros vamos a tener más conexiones. Muy seguramente, ya que vimos que Sigo tiene la conexión, les voy a poner sigo ahí. Ya que vimos que Arus tiene conexión, les voy a poner Aru ahí.




01:28:19


<strong>FELIX BEDOYA</strong>: Y van a ser muy fácil porque simplemente es colocar las claves y listo. Entonces, cada vez le vamos colocando como más herramientas. Esto desde desde Wappy. Ah, bueno, les dije que antes de salir de guapi les dije que les iba a mostrar lo de lo de los avatars. Ustedes les dan en el en nombre, le dan en editar y acá primerito le aparece avatar y ya tienen todos estos avatar que ustedes pueden seleccionar. A ese avatar ustedes le pueden dar un hombre, un sexo, una voz, una personalidad y de hecho le pueden dar hasta un vocáblo. Si ustedes han visto Tenchi era como muy paisa. Ustedes le pueden dar un vocablo de esto. Si no le ponen, pues él queda español neutro y listo. Cada uno puede tener su avatar. De hecho, yo últimamente he trabajado muchos con este que se llama Surri y lo y lo dejé así cada uno como para que lo vaya cambiando. ¿Por qué se los digo? Porque cuando entren a Guapi, la próxima vez que ustedes entren a Guapi, ustedes a guapi, perdón, ustedes a guapi, ya lo van a ver siempre así.




01:29:37


<strong>FELIX BEDOYA</strong>: Listo, no se vayan a asustar. Yo los quiero llevar cada vez al mundo de la automatización, que no dependan mucho de un chat. Aunque ustedes acá van a poder abrir el chat, van a seguir hablando con Tenche y van a poder hacer todo lo que decían desde Wappy lo van a poder hacer, bueno, en este caso su lo van a poder hacer con su avatar. Ah, no, que yo ya estoy acostumbrado a trabar como antes. Entonces, le dan ir a Wappy, lo corren y trabajen como antes, no hay ningún problema. ¿Listo? Él también les va a ayudar a crear sus automatizaciones. Cuando ustedes hablen con él, le van a poder decir, "Ven, es que yo quiero que me ayudes a crear una automatización. Tengo esta y esta y esta necesidad." Entonces, él les va a comenzar a crear estos nodos, estos flujos, él se los va a ayudar a hacer. Entonces, es muy importante que se acostumbren a trabajar desde Wappy cuando lo abran. a trabajar directamente con él. Entonces, hasta acá quiero que me digan cómo estamos, qué dudas pueden tener hasta acá en tema de esos flujos y automatizaciones.




01:30:39


<strong>FELIX BEDOYA</strong>: Meor dicho, quiero saber si me comprendieron qué es una automatización y qué es un flujo de trabajo.
<strong>Carolina Colorado Cano</strong>: Yo creo, yo creo que entendí la generalidad. Creo que hacerlo de pronto es lo que ahí me va a generar dudas o voy a aprender cosas es cuando ya lo ejecute, ¿cierto? Ahí ahí puedes. Pero afortunadamente esa última parte que mencionaste, si yo tengo una en mente y no soy capaz de desarrollarla, pues de pronto Tensi eh le puede ayudar a uno con o a
<strong>XIOMARA ARDILA</strong>: No lo puede lograr.
<strong>Carolina Colorado Cano</strong>: finalizarla.
<strong>XIOMARA ARDILA</strong>: Papá.
<strong>Carolina Colorado Cano</strong>: No sé si uno también puede crear una parte y como que no fui capaz y entonces eh decirle a él que me ayude con la idea que yo tengo en mente. Ok.
<strong>FELIX BEDOYA</strong>: Sí, porque te te enchiva la pantalla del computador, entonces él sabe lo que usted está haciendo.
<strong>Carolina Colorado Cano</strong>: Mhm.
<strong>FELIX BEDOYA</strong>: Entonces él te él te va él te puede seguir guiando. Yo, ¿qué recomendación te doy? raya el flujo, raya el flujo de la automatización.




01:31:47


<strong>FELIX BEDOYA</strong>: Entonces tú dices, mira, yo qué voy a hacer. Yo necesito de que sea una automatización literal sola, o sea, que sea un Chrome, que se active con una temporalidad, un Tiger, o yo voy a hacer una automatización donde tengo un disparador que yo tenga que mandar un mensaje, un prom por algún canal. Ah, que puede ser un agente de Wappy, que puede ser antigravity, que puede ser un correo, que puede ser eh Tenchi. Parta desde ahí. ¿Cómo es la entrada? Si es una automatización con un Chrome o es una automatización con un disparador de los que nosotros tenemos disponibles o de los que tú puedas crear, porque ya les voy a mostrar algo. Y ahí ya tú me dices, "A, ¿qué es lo siguiente que yo quiero que haga? o qué condicional tiene, ¿cierto? Ejemplo, tú me puedes decir a mí, "Ah, es que yo tengo, a ver, a ver, a ver, a ver, les voy a dar un ejemplo muy muy característico. Yo puedo tener un trabajador que me aparezca con nombre y cédula.




01:32:58


<strong>FELIX BEDOYA</strong>: M. Pero resulta que para yo mirarles la RL hay una condicional y la condicional es, por ejemplo, en este caso, colmena. Colmena a mí me pide que tenga que tener nombre, cédula y fecha de nacimiento. Entonces, ¿cuál es la condicionar en el flujo? que yo llego y le digo al a mi disparador, sea el Chrome o sea, no sé, Tenchi. Entonces, yo le digo, Tenchi, por favor, a X trabajador eh revísale certificado RL que esté vigente. Entonces, Ten Chiv y cuando comienza a hacer el proceso, mira, ah, es que es colmena y no tiene fecha de nacimiento registrada. Tenchin no se va a ir a hacer la web scrapping, o sea, meterse al colmen, hacer todo el proceso para saber de que no, no funcionó, que le dieron un error, devolverse, no. Ve, perdón, el flujo no va a hacer eso. Lo que va a hacer el flujo es como la condicional me dice que necesitaba fecha de nacimiento y no la tengo registrada, inmediatamente me va a devolver el mensaje y me va a decir, "No, no puede hacer el flujo porque no tengo fecha de nacimiento." Entonces tú comienzas a pensar




01:34:04


<strong>FELIX BEDOYA</strong>: ese flujo desde qué son las necesidades y cuáles son los bloqueos que pueden haber en el proceso y tú lo comienzas a a dibujar, a rayar o a escribir y ya tú después lo puedes enmaquetar, le puedes decir a a Tenchiven, "Ayúdame." O otra cosa, vuelvo y les digo, yo soy muy transparente. Acá hay algo que se llama automatizaciones. ¿Listo? Mírenlo acá en primerito. Automatizaciones. En automatizaciones. Bueno, primero discúlpeme, vimos la otra clase de que habían unos customs que son no más que herramientas, estas mismas herramientas que nosotros tenemos acá, que acá hay un montón de herramientas. Ellos tienen un montón. son las mismas herramientas que nosotros no son las mismas, sino que son herramientas como las que nosotros tenemos en los flujos de de Wappy, solo que nosotros tenemos nuestras herramientas para seguridad del salud en el trabajo y Antigravity pues tiene un montón de herramientas realmente más ligadas a al tema de programación, pero hay muchas herramientas que nos pueden servir para muchas cosas diferentes, por ejemplo, como un Canvas, un Dropbox, un Figma que es para diseño, un Notion que es para hacer listas de chequeo y para hacer actividades muy chéveres.




01:35:19


<strong>FELIX BEDOYA</strong>: Les recomiendo mucho que lo investiguen y y lo estudien. Un base 44 que es para hacer bases de datos en la nube, eh un strip que es pasarelas de pago, eh un Gmail que ya sabemos que es un Gmail y así hay un montón de, a ver si veo más, un GPHub que es un repositorio y así hay un montón de herramientas acá. Créanme que nosotros también vamos a tener muchas de estas herramientas las vamos a tener también en Wappy más adelante para hacer plugos mucho más interesantes, por así decirlo. Entonces ellos también tienen sus herramientas que deben de activar. Entonces ustedes comienzan a activar algunas herramientas. Yo, ¿qué herramientas activas? ía yo activaría todas estas herramientas de Google, todas, todas. Estas la activo, esta la activo, esta la activo, esta la activo, Canaría, Drossb lo activaría, Gmail lo activaría, no, no activaría nada más. Listo. Para que después me sea mucho más fácil trabajar. Igual ya antigravity solito cuando yo le digo, "Ay, es que necesito enviar un correo." Si no hay una si no hay un Gmail activado,




01:36:26


<strong>FELIX BEDOYA</strong>: él de una vez me va a decir, "Ve a Customs y activa el Gmail." O le pide la autorización para que lo active. Entonces, tener activados las que necesitamos. Ya sabemos que simplemente para activarlo le damos en el más y por ejemplo en Google Calendar si no tengo los permisos él me los va a pedir. Miren que él de una vez me llevó, yo le doy los permisos y ya le di con el correo que no lo borro. Se le di los permisos y ya. Y de hecho yo le puedo crear hasta skill y otras cositas que ya la vamos a ir viendo más más adelante. Entonces, pero lo principal es tenerlas activadas, todas esas de Google. Y después yo me voy a automatizaciones. En automatizaciones me voy a crear una automatización. Él acá de una vez me dice que tiene una guía. Esto lo puedo borrar, no se preocupe. Simplemente que me quede automation acá. Y ahí sí yo le digo, "Deseo que me crees una automatición donde revises mi carpeta, no, mi perfil sociodemográfico." Entonces,




01:37:39


<strong>FELIX BEDOYA</strong>: yo que hago yo que les enseñé desde el principio, que hemos de ser muy organizaditos, estoy haciendo un ejemplo, ¿cierto? Digamos que esta esta carpetica se llama perfil socio demográfico. Revises nombre y cédula de los trabajadores y realices web scrapping. ¿Qué es web scrapping? que él solito como agente va y me abre una página web y hace todo el solito web scrapping. En la página, mire todo lo que tengo que hacer acá en la página va a buscar eh certificado de alturas Ministerio de Trabajo. Yo creo que es esta. Sí. verifiques que trabaja no tienen el curso de alturas vigente Yeah. me realices un informe en HTML com PDF y me lo envíes por Gmail. Gmail. Me lo envíes por Gmail. Esto deseo que lo hagas todos los lunes a las 8. A ver, listo. Ahí lo que hice una automatización. Y él, ¿qué va a pasar? Todos los lunes a las 8 a me va a crear esa automatización en mi computador cuando yo abro Antigravity.




01:39:49


<strong>FELIX BEDOYA</strong>: Que le puede dar otros disparadores diferentes. Sí, claro. Yo le puedo decir, "Ay, venga, hágame un favor. Eh, además yo quiero que mi computador se encienda. Entonces, como esto es a las 8 a, yo quiero que mi computador entonces encienda a las 7:50 de la mañana todos los días para poder que se sienta solito y que Antigravity se abra solito y me corra esa automatización, pues porque lo estamos haciendo desde el computador. Él lo que va a hacer es que va a crear la automatización. ¿Dónde le va a quedar guardada? Acá. y él solito ya le va a correr. Ojo, yo acá le puse la carpeta de somos SST, obviamente no va a encontrar no va a encontrar el permiso del homográfico. Ahí lo va a poner a a gastar toca. Pero mi intención es esa. Quiero que me digan si de pronto a mí me cogieron el hilo también desde Antigravity.
<strong>Carolina Colorado Cano</strong>: Lo único que yo veo es que de pronto tratar de utilizar esto como como último recurso, ¿no?




01:40:51


<strong>Carolina Colorado Cano</strong>: También, ¿cierto? Porque nos gastaría más toques mientras que en Wappy IA no podría ser así.
<strong>FELIX BEDOYA</strong>: No necesaria, no necesariamente,
<strong>Carolina Colorado Cano</strong>: Yo ya le tengo miedo que se me acaban los correos.
<strong>FELIX BEDOYA</strong>: no necesariamente,
<strong>Carolina Colorado Cano</strong>: M.
<strong>FELIX BEDOYA</strong>: Carolina, eh, es según es como darle un buen manejo a a todo. ¿Qué es lo que pasa con Wappy IA? yo les digo, pues yo soy Wappy IA y yo igual les abro de una forma muy transparente y desde que se lo he dicho desde el principio, o sea, es que no vamos a encontrar una herramienta que le haga todo, que nos permite hacer guapo y pues tener un montón de aplicativos que ya nos permiten hacer unos informes muy bien elaborados, nos permite tener una data muy bien organizada, entonces nos lo permite traer acá. ¿Qué nos permite hacer Wappy IA? también conectarnos a Antigravity. Y al conectar Wappy IA con antigravity, tenemos dos inteligencias artificiales diferentes. Y si ustedes me han prestado mucha atención en las clases, quiero que me digan por qué yo le hablo de dos inteligencias artificiales diferentes o más bien dos de inteligencias artificiales diferentes, ¿no?




01:42:01


<strong>FELIX BEDOYA</strong>: Dos formas de utilizar la inteligencia artificial diferente. Y quiero que ustedes me digan cuáles creen que son. En Wappy IA tenemos una y en Antigravity tenemos otra.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: en Antigravity, Antigravity es mucho más extenso, eh, y trabaja como a mayor profundidad, No.
<strong>FELIX BEDOYA</strong>: Eso, pero eso tiene un trasfondo doña Maria, doña María Elena. Y es que Guapi, ¿se acuerda que yo les explicaba que Guapi trabaja por tokens mediante una clave APK y Antigravity trabaja es por procesos, ¿cierto? Entonces yo en mis flujos que yo tengo acá automatizados, yo por ejemplo mis flujos cuando es una tarea de extracción de datos y es una tarea tan básica que simplemente eso, por ejemplo, verifícame e perficiosográfico si tengo trabajadores que tienen exámenes médicos vencidos y mándeles un mensaje. Eso es muy fácil. Yo por qué voy a poner a correr antigravity para una tarea tan fácil. Yo utilizo wapi con los modelos que ya tengo, que de hecho son gratuitos, no tenemos que pagar. Pongo uno de mis modelos, yo utilizaría 3.5 like, que es el más rápido y en cuestión de segundos me dar esa respuesta de una calidad muy muy excelente y pum, se fue.




01:43:28


<strong>FELIX BEDOYA</strong>: Listo. En ningún momento utilicte Gravity. Ah, pero es que si yo le digo, "Ven, es que yo a ese trabajador no solamente quiero que me revise si tiene vencidos los exámenes médicos, que es información que yo tengo mi perficio gráfico, sino que yo quiero que me verifique en el Ministerio de Trabajo si eh su curso de altura está vigente o no está vigente y esa información que yo puede que no la tenga mi perfilográfico. Ah, hay que hacer web scrapping. Web scrapping es un proceso que Wapi no tiene la capacidad de hacerlo, pero Antigravity si lo hace. Entonces ahí sí me toca mandarle ese mensaje Antigravity para que lo haga él. Y lo que hacemos nosotros en ese caso es que utilizamos las dos inteligencias artificiales. Claro, va a ser en ese caso de que me rinda un poquito más la inteligencia artificial de antigravity por esos procesos. Pero no quiere decir en ningún momento, Carolina, que Antigravity no puede hacer todo el proceso y que por ello se gaste mucho más, no se va a gastar un poquito, un poquito más, pero un poquito más, sí, va a gastar un poquito más, pero no tanto.




01:44:38


<strong>FELIX BEDOYA</strong>: La diferencia realmente es que acá ya tenemos un montón de nodos con un montón de aplicativos. Vuelvo y les digo, tenemos más de 50 aplicativos nosotros en WAP, que es responsabilidad, obviamente, obviamente nosotros de llenar la información. Entonces nos va a permitir tener esto mucho más organizado. Si no, perfectamente yo lo puedo hacer desde acá. ¿Qué es lo que pasa con estas automatizaciones? Y quiero que también les quede muy claro que puede que la primera vez ustedes vieron que comenzó a pensar y acá se me puede quedar 10 minutos porque haciendo esa automatización quizás, pero después de que se se haga esa automatización se crea algo que se llama script. En otros términos, porque no me gustan realos a ustedes con esto, en otros términos es un conocimiento, es como el paso a paso para hacer una tarea. Entonces, yo la primera vez que le digo a Antigravity, "Hágame una automatización y le digo, a usted tiene que ir a tal carpeta, después al Ministerio de Trabajo." En el Ministerio del Trabajo tiene que seleccionar un un estilo de alguno de estos puntos, si es cédula, si es pasaporte.




01:45:45


<strong>FELIX BEDOYA</strong>: Después colocar la cédula, darle consultar, entrar, darle click donde aparece el PDF para poder descargarlo, leer de qué fecha es. Entonces, claro, la primera vez que él hace eso para él poder aprender a hacer todo esos procesos es como cuando nosotros aprendemos a a escribir. Pues nosotros no aprendemos a escribir del día de un día para otro, ¿no? Un aprendizaje. Él hace ese aprendizaje. Pero después de que nosotros aprendimos a escribir, ¿cómo fue? Fácil, en automático. Ahí está la palabra, en automático. ¿Qué es lo que pasa? que la próxima vez que yo le diga esa automatización, realíceme esa tarea, él no se va te va a quedar pensando, o sea, realmente en 10 segundos te va a entregar esa respuesta siendo mucho. Siendo mucho. Entonces, cuando tú me hables de que esos ese esos procesos se te van a consumir la inteligencia artificial, eso con automatizaciones, pueden ser automatizaciones hasta muy extensas, no va a pasar porque el proceso de pensamiento ya no cabe o sea, no hay lugar un proceso de pensamiento porque se creó una script, se creó un paso a paso que él ya aprendió y que lo va a hacer en qué, en automático.




01:47:00


<strong>FELIX BEDOYA</strong>: Cuando yo aprendo a manejar, cuando yo aprendí a manejar, yo me demoré mucho para aprender a manejar bien, pero yo ahorita codo carretera y como a la media hora uno dice, "Uy, yo no sé ni cómo venía manejando en automático." Lo mismo pasa con estas automatizaciones. Entonces, los procesos de la inteligencia artificial realmente caro, hacia tu hacia tu pregunta y inquietud, eh, es que pasan de de 100 a uno, por así decirlo. Entonces, claro, por eso es tan importante nosotros aprender a automatizar, porque ejemplo a los lotos que hiciste, si tú vuelves a tu carpeta que creaste y vuelves y creas otro chat y vuelves y le das las indicaciones y le dices que te cree esos lotos, ¿qué va a pasar? Va a volver a generar un proceso de pensamiento para volver a hacer un loto que ya hizo una vez. ya sabe que lo que tiene que hacer paso a paso puede llegar a tener una resolución. final diferente, pero es un paso a paso. Igual si yo hago una automatización donde a él le pido que me cree los lotos cada vez que yo le entregue una información, la respuesta va a ser mucho más rápida, mucho más rápida, mucho.




01:48:16


<strong>FELIX BEDOYA</strong>: Obviamente la automatización, recordemos que no es una pregunta normal. La automatización es que él va a ir a una carpeta, va a haber un disparador, o sea, va a haber algo que genere, que comience, desencadene esa automatización. Eso es muy importante, muy muy importante. La automatización no me quedó guardada lo último porque no se creó, no la dejé disparando. Entonces, es muy muy importante eso. ¿Listo? Esa es la diferencia, que cuando nosotros creamos automatizaciones, la primera vez puede que demore, pero la segunda vez eso va a salir rapidito y él solito comienza a andar. ¿Qué es lo que pasa? Si yo creo automatizaciones en Antigravity en mi computador, yo qué tengo que tener prendido mi computador. Por eso yo la otra vez les decía que antigravity ya funciona la nube. Entonces si yo quiero hacer automatizaciones y no quiero estar pendiente de que mi computador esté prendido, pues yo lo que hago esto ya no se llaman automatizaciones como aparecen acá. Miren que acá hay automatizaciones. Yo nube, me apareces remote control.




01:49:30


<strong>FELIX BEDOYA</strong>: Listo. Y lo que me permite es crear una conexión, puede ser con Gmail, perdón, con Drive para yo hacer una automatización en la nube. Esa es como la diferencia. Pero ah que que yo prefiero utilizarlo desde mi computador porque me queda más práctico y así lo veo más fácil. Sí, la verdad sí. Entonces, a mí no, si a mí no me importa que el computador tenga que estar prendido, pues entonces que esté prendido y las las automatizaciones hablas desde el computador, no hay problema. ¿Qué sucede? También hay automatizaciones que pueden hacer que el computador tenga un proceso de pensamiento, o sea, que la memoria RAM, que la tarjeta gráfica comiencen a trabajar y pueden verse que computador sea lento, no la automatización como la que dice, no, pueden haber automatizaciones con unos procesos muy extensos de creación de aplicativos, de informes, de 10 informes, de leer 30 carpetas, de crearme un informe magistral. Entonces eso hace que mi computador comienza a tener una sobrecarga, comienza y ya por uno a escuchar los ventiladores. ¿Qué qué pasa cuando yo lo hago en la web?




01:50:33


<strong>FELIX BEDOYA</strong>: Cuando yo lo hago la web no está trabajando con mi computador, sino que está trabajando con los servidores de Google en otra parte. ¿Listo? Entonces, comenzar a diferenciar dónde queremos nosotros que se manejen esas automatizaciones. vuelvo y les digo, ir a automatizaciones, crearla y tal cual como yo les di el ejemplo, esta guía, yo pues la verdad yo no la no la utilizo, simplemente desde acá comenzar a la automatización Yeah. importante, muy importante, lo que comenzamos a hablar al principio que yo hablaba con Gloria, Antigravity hay que hablarle como un niño, entonces no dejar hilo sueltos. Entonces, si la automatización necesita de algo, o sea, yo acá no le voy a decir, verifícame que los trabajadores tengan el certificado de alturas eh eh vigente y envíame un informe al correo Félix. @gmail.com. ¿Qué faltó acá? ¿Quién me dice?
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: No le ha dicho dónde debe de verificar.
<strong>FELIX BEDOYA</strong>: ¿De dónde saco la información? Y peor aún, yo no le dicho, yo le dije, "Ah, verifíqueme en los certificados de alturas. ¿Y dónde?




01:52:09


<strong>FELIX BEDOYA</strong>: ¿Dónde voy a verificarlos?
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: que la clave está en cómo pido la información definitivamente.
<strong>FELIX BEDOYA</strong>: Hagamos de cuenta que yo le estoy pidiendo esa tarea a un niño. Yo a un niño, créame que yo un niño no le digo así. Yo un niño o a una personita que apenas esté entrando a mi empresa a trabajar, le digo, "Ay, haceme un favor. ¿Me vas a verificar que mis trabajadores tengan los certificados de alturas vigentes?" Para ello, allá hay una carpetica. donde está toda la lista de mis trabajadores. Entonces, yo le traigo la carpetica. Pongamos ese ejemplo. Yo le traigo mi carpetica. Ah, ¿y dónde los verifico? Ah, no, es que tú vas a la página del Ministerio del Trabajo, como ya tiene la carpetica, nombre y cédula, entonces simplemente tú vas al Ministerio del Trabajo y allá colocas el número de la cédula y él te dice si están o no están. Ya. Y ese es el ejemplo para todas las automatizaciones dentro de Antigravity. Hay que ser muy cuidadosos con ese paso a paso de hacer de de hacerlo.




01:53:14


<strong>FELIX BEDOYA</strong>: ¿Qué es lo que pasa? Pues que acá no hay que tener conexiones, por ejemplo, como en Guape de que si sí hay o no hay, porque si acá simplemente no cumple, él hizo toda la tarea. Eso es lo diferente también. O sea, yo acá le puedo colocar y decirle, "Verifícame los trabajadores. Puedo haber un trabajador él para decirme de que está vigente, ¿cierto? En este caso no. Pongamos otro ejemplo porque en este no me no me cumpliría de Wappy IA. Por ejemplo, el de exámenes médicos, si está vigente o no. Él para poder decirme que el examen médico está vigente tiene que hacer todo el proceso. En Guapi puede que no. En Wappy IAi simplemente puede verificar la data y decirme, "No, no, no está vigente." Y ya pu me manda la información. Entonces, Ahí hay ahí sí hay como unas características puede que diferentes que acá se gaste un poquito más de proceso para decirme no y en guap simplemente me diga no rápidamente. Listo. Pero porque ya tiene pues como una data.




01:54:13


<strong>FELIX BEDOYA</strong>: Y lo diferente en Guapi es que pues ya los flujos eh ya vienen casi que preestablecidos, ya tenemos un montón de flujos o si no pues simplemente con ir jalando los nodos, todo esto yo lo puedo copiar. A ver, a ver si me deja borrarlo todo. No me deja borrarlo todo a la vez. Aún no tengo que poner esa opción de borrarlo toda a la vez. A ver, a ver, a ver, a ver. por acá para que lo puedan ver. Él como mínimo siempre me va a pedir un agente, ¿cierto? Entonces, por eso nos deja ah borrar un modelo de inteligencia artificial. Yo le pongo la manito, que esto es lo que me está dando el error, que no puesto la manito, un modelo de inteligencia artificial y un disparador. ¿Listo? Para el ejemplo, por ejemplo, de, valga la redundancia, de los trabajadores, yo voy, hago una extracción, extraer trabajadores. Miren que él ya me lo puso acá. Listo, ahora sí me lo deja mover todos. Listo.




01:56:16


<strong>FELIX BEDOYA</strong>: Ahora sí me lo dejamos de parte. Tengo un disparador, tengo los trabajadores. Yo puedo entrar y decirle, "Ah, resulta que esos trabajadores yo solamente necesito nombre y cédula. No necesito nada más. Resulta que mi agente, yo acá le puedo colocar el modelo, el nombre no se lo no es necesario configurar, pero acá le puedo colocar la instrucción. ¿Qué quiero que haga? eh verificar los certificados e al de alturas que estén vigentes. Necesito un modelo, necesito memoria, no. Necesito una herramienta. Ah, sí, necesito una herramienta. ¿Qué herramienta necesitamos? Necesitamos web scrapping. Memoria, no necesitamos eh herramientas, sí necesitamos, pero yo creo que herramientas solamente web scrapping. A ver, subagentes scraping web loca e con con antigravity. Entonces la se me puso es lo que va a hacer
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: ¿Y cómo hago? Perdón, Félix, ¿y cómo hago yo para saber cuál de las herramientas es la que necesito?
<strong>FELIX BEDOYA</strong>: ya nosotros le damos una capacitación exacta para que busquen entre todas.




01:57:53


<strong>FELIX BEDOYA</strong>: Por ejemplo, yo el web scrapping yo se los expliqué hoy. Esto lo que hace es ir ir a la web para buscar extraer
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Mhm.
<strong>FELIX BEDOYA</strong>: trabajadores. Si yo necesito saber nombre y cédula es extraer trabajadores, ¿cierto?
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ok.
<strong>FELIX BEDOYA</strong>: Pero según la la necesidad que yo vaya necesitando. ¿Listo? Podemos ampliar una capacitación solamente para que aprendan estos nodos. Yo no tengo problema, pero eso sí cabe dentro de la dentro de que sea la decisión de de todos que quier quean aprender simplemente nodos de de Wappy IA o si quieren aprender todo
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Oh.
<strong>FELIX BEDOYA</strong>: full automatizaciones con con antigravity. Pero ya vieron que las automatizaciones con Antigravity es colocar de una forma textual muy textual acá. ¿Qué es lo que pasa? Pues vuelvo y les digo, hay data, hay cosas que tenemos en Antigravity. Ven, Wappy IA, que obviamente en Antigravity no hay, no hay. Entonces, miren que yo simplemente, ¿qué le dije? Tengo un desperador que estche. Entonces, yo le digo, "Ay, por favor, mándeme a revisar los trabajadores." Él va,




01:58:58


<strong>FELIX BEDOYA</strong>: el nodo ya sabe que solamente va a sacar nombre y cédula. se lo manda la inteligencia artificial. Buscan la web y yo le coloco una salida. Vitácoras y salidas. loer que me lo mandé el correo y listo. Así de sencillo. Acá sí me faltó algo en la instrucción que yo le dije, eh, certificados de alturas que estén vigentes. Realízame un informe en HTM y envíalo al correo féix.bed @gmail.com. Aunque esto no lo tengo que poner realmente porque en el en el nodo de salida me permite colocar el correo al que al que va a dirigir. Y listo. Ahí tal cual lo que va a hacer ir a verificar. Él solito me extrae nombre y cédula. El agente lo revisa, me lo manda antigravity para que él haga web scrapping y verifique en el Ministerio de Trabajo quiénes tienen certificados vigentes. Me manda la información de quiénes los tienen vigentes y quiénes los tiene vencidos y esto me manda un correo. Ya sabemos que la salida puede ser un correo, un WhatsApp.




02:00:26


<strong>FELIX BEDOYA</strong>: Hm. No sé. Eh, puede ser el mismo eh Antigravity, puede ser el mismo Antigravity que le responda antigravity. Pues ya hay un montón de salidas. Nosotros acá yo verifico qué salidas tenemos activas en este momento. Tenemos Gmail, tenemos Guapi antigravity en el PC, en la nube, guardar en Somos SST, centro de control. Entonces, es una tarjeta, extraer en un documento de docs, en cheats, eh hacer una en Google Calender pues una notificación o eh o crear un Google Slide con esa información. Entonces, también tenemos varias varias salidas acá. Pero a mí lo más importante, lo más importante es que ustedes comprendan qué es una automatización, que creo que eso ya lo comprendimos, y cómo se crean los flujos, o sea, que hay una entrada, una salida y que en la mitad de la entrada y la salida hay unos requerimientos que son los que nosotros tenemos que tener muy conscientes de que se van a desarrollar. A que ustedes me digan, "Listo, Félix, lo podemos hacer en Wapi." No, yo prefiero hacerlo en Antigravity.




02:01:31


<strong>FELIX BEDOYA</strong>: Háganlo donde ustedes se sientan más cómodos, la verdad. Vuelvo y les digo, ese mismo este mismo flujo que está acá, este mismo que está acá, sería lo mismo que yo colocar acá. Revisa la carpeta. Mira mi perfil sociodemográfico. Extrae los nombres. Perdón, nombres y cédulas y luego verifica verifica en la página del Ministerio de Trajo olvido. Yo lo si tengo que repetir 1 veces se lo repito. Ministerio de trabajo, si los certificades están vigentes o no. Luego de eso, créame un informe en HTML y envíalo a Felix. Ah. @simmail.com. Esto esto es lo mismo, esto no tiene nada diferente, es lo mismo a esto, teniendo en cuenta, obviamente, que cuando yo le digo extraer trabajadores, es que él me va a venir es extraer los trabajadores. En ese caso, ¿de dónde? de mi perfil socio demográfico en Guapi. Listo, que acá ya tenemos una información diferente, una información que nosotros le damos a esos trabajadores. Entonces, de para ahorrar entonces que que ah que también tiene acceso él, que también tiene acceso a los informes que tenemos en Wapi, ¿cierto?




02:03:57


<strong>FELIX BEDOYA</strong>: Pero acá yo, ¿qué le estoy diciendo? Pues que vaya a mi perfil codemográfica, yo que yo he hecho toda la vida y que ya lo tengo con una data y extraiga el nombre y cédulas y me haga este proceso. Ya sabemos si yo quiero que sea aparte una automatización, que es esto es lo mismo que Chrome. Automatización es lo mismo que Chrome, pero recordemos que un Chrome puede tener un Tiger, o sea, una temporalidad. Entonces, yo ya le digo todos los lunes a las 8 a y listo. Entonces ahí es muy importante que ustedes comiencen a verificar, ah listo, no, yo esa automatización la puedo dejar en antigravity, no tengo problema. O ven, sabes que en Guapia hay un montón de automatizaciones que definitivamente desde antigravity no la podemos hacer. miremos las automatizaciones más bien desde Guapi que pueden ser más prácticas también. Créame que las que nosotros tenemos acá hechas, yo sé que muchas nos funcionan desde Guapi, hay otras que no van a funcionar desde guapi, pero hay muchas que tenemos acá que si yo las leo o yo las interpreto, pues simplemente es venir acá y comenzar a darle el paso a paso, el prom bien realizado, esa automatización para poder que llegue a ese mismo resultado, ¿cierto?




02:05:18


<strong>FELIX BEDOYA</strong>: Entonces que podamos hacerlas acá. Sí. Ah, que el informe puede que no salga tan estéticamente y tan estructurado como nos guap. Ah, sí, pero igual pues me va a sacar un informe con la información tita que yo necesito. ¿Listo? Entonces eso sí es muy muy muy importante. Quiero que me digan si tienen alguna inquietud hasta el momento. Igual ya vamos a terminar la clase o si tienen alguna idea de automatización.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Yo creo que hay que iniciar con los ejercicios y en la medida que se vaya uno trabajando se van generando como las dudas. Mm.
<strong>FELIX BEDOYA</strong>: Listo,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ok.
<strong>FELIX BEDOYA</strong>: porque yo creo que ya con la clase de hoy, yo creo que ya abrimos un poquito más la mente, ¿cierto? Ya te doy la palabra, doña María Elena. Yo creo que ya abrimos un poquito más la mente sobre qué es una automatización y un flujo. Y creo que ya la tarea de que ustedes me traigan ya hechos rayaditos o escritos varios flujos sería muy chévere para nosotros ponerlos en práctica.




02:06:27


<strong>FELIX BEDOYA</strong>: De hecho, para eso tenemos la inteligencia artificial. Es que nos poocco nos tenemos que matar. Yo puedo llegar y abrir en mi carpetica, mi proyecto y puedo llegar y decirle,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Sí.
<strong>FELIX BEDOYA</strong>: "Ay, ven, es que mi pensado es hacer esto y esto y esto." Tú me podrías decir cuáles son los pasos,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ok.
<strong>FELIX BEDOYA</strong>: el paso a paso de mi flujo que yo veo elaborar y qué herramientas debo de tener en cuenta para que ese flujo se cumpla. Ya le puedes preguntar a Antigravity, le puedes preguntar a Tenchi, ¿cierto? y él te va a comenzar a decir o cualquiera de las dos partes te va a comenzar a decir cuál es el paso a paso que o qué herramientas debes de utilizar y ya luego tú lo puedes comenzar a a terminar de diseñar o cualquiera de los dos te lo va a diseñar. Ahora sí, doña María Elena, ¿qué pena?
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: No, pues yo había pensado en en su defecto
<strong>FELIX BEDOYA</strong>: Ok.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: de automatizar que con solamente dándole o que él buscara eh la herramienta, no sé, en el archivo, en la carpeta o algo, el nombre y la cédula de mis trabajadores, eh que de ahí me buscara si efectivamente estaban con la seguridad social al día, en qué, en qué fondo de pensiones, caja estaban eh afiliados también, que con ese número de cédula eh validara eh el tema en el simit, tema de multas, comparendos,




02:07:53


<strong><strong>Maria Elena Obando</strong> Colonia</strong>: que me validara también si la licencia de conducción de esa persona estaba vigente y hasta cuándo era la vigencia. adicionalmente que me validara los certificados o cursos de altura, reentrenamientos, vigencia, espacios confinados, eh la afiliación obviamente a la ARL, certificado judicial y que eso me lo hiciera los 20 de cada mes para yo en el mes siguiente estar preparada y saber quiénes no tenían o quiénes tenían que que como que validar o poner emigencia
<strong>FELIX BEDOYA</strong>: Ah.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: alguna cosa y algo muy similar para el tema de las evaluaciones médicas ocupacionales y lo de inducciones eh inducciones,
<strong>FELIX BEDOYA</strong>: Sí.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: ¿no? Reinducciones de seguridad, que quiénes me iban a completar el año y que me avisara como con 10 días de anticipación, eh, mejor dicho, que me validara el 20 de cada mes lo del mes siguiente para yo tenerlo allí y agendar y programar, etcétera, etcétera. Yeah. Y ya tú habías dicho algo de la matriz, que ya yo había pensado en ese y era que de acuerdo pues a las páginas o a las direcciones donde consulto en las ARLs, en la página del Ministerio, que me validara qué legislación había salido, eh pero que esto sí lo hiciera el 30 de cada mes o si no en los primeros 5co días de cada mes, que fuera de que me validara qué legislación, cuál de esa que había salido le aplicaba mi empresa de acuerdo a la actividad económica y




02:09:31


<strong><strong>Maria Elena Obando</strong> Colonia</strong>: que adicionalmente pues ella hiciera el filtro y que me actualizara mi matriz. Estoy pidiendo mucho.
<strong>FELIX BEDOYA</strong>: No, solamente hay una cosa que me he encontrado como una barrera.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ajá.
<strong>FELIX BEDOYA</strong>: Algunos fondos de pensiones eh tienen unas capas de seguridad que la inteligencia artificial no las pasa y el adres y el adres cuando mandamos a
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Okay.
<strong>FELIX BEDOYA</strong>: consultar varios trabajadores a a la vez nos bloquea.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: M.
<strong>FELIX BEDOYA</strong>: De resto,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Okay.
<strong>FELIX BEDOYA</strong>: todo.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Mhm.
<strong>FELIX BEDOYA</strong>: El resto todo lo he hecho, desde certificados de alturas, ARL, antecedentes disciplinarios en policía, SIGIN, Fiscalía. Eh, hay una página, se me olvidó, hay una página donde uno verifica, por ejemplo, y ahorita es muy bueno para diciembre, eh, que muchas partes, no todas, hay trabajadores muy mañosos que nos llegan con incapacidades falsas. Hay una página, yo por ahí se las debo,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Sí.
<strong>FELIX BEDOYA</strong>: yo se las paso, donde uno con el número de la cébula verifica si el si el si el médico si es un médico tratante, si es si es si si está activo.




02:10:45


<strong>FELIX BEDOYA</strong>: Entonces,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Mhm.
<strong>FELIX BEDOYA</strong>: eso también lo puede verificar uno. Eh, ¿cuál más APIs tenemos? Venga, yo reviso en wapi porque es que se me son muchas, son muchas y se me
<strong>XIOMARA ARDILA</strong>: Eh,
<strong>FELIX BEDOYA</strong>: pescen
<strong>XIOMARA ARDILA</strong>: feliz, feliz, una preguntita antes de que se me olvide. Qué pena,
<strong>FELIX BEDOYA</strong>: el similit,
<strong>XIOMARA ARDILA</strong>: eh,
<strong>FELIX BEDOYA</strong>: el run, antecedentes disciplinarios,
<strong>XIOMARA ARDILA</strong>: para el otro. Yeah.
<strong>FELIX BEDOYA</strong>: ARL, certificado CNA y curso de alturas y web scrapping. A lo que quieras hacer es web scrapping. Eh, pero hay unas páginas que sí tienen bloqueo.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ok.
<strong>FELIX BEDOYA</strong>: Siaras.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: M.
<strong>XIOMARA ARDILA</strong>: Es que bueno, yo tengo una duda que siempre la he tenido desde que empezamos con el curso y es que por lo menos cuando tú hablas de proyectos, por lo menos en en antigravity, que cuando tú hablas proyectos que de lo que usted ya se de lo que ya se ha realizado dentro del sistema de gestión de seguridad y salud en el trabajo.




02:11:53


<strong>XIOMARA ARDILA</strong>: cuando hay una empresa o por lo menos un ejemplo, me contrataron en una empresa y no tengo nada, nada, nada. Ahí uno como cómo empezaría porque pues cuando tú hablas de proyecto ahí es donde yo como que no sé
<strong>FELIX BEDOYA</strong>: Y yo cuando les hablo de proyectos es un un aplicativo final que ustedes puedan utilizar para para generar ingresos. Eh, temas de seguridad salón, el trabajo un sistema de gestión pues está guapi para que puedas hacer tu sistema de gestión desde cero o con Antigravity. Tú puedes comenzar con el resolución 032 y puedes comenzar a decirle que te comience a ayudar con los formatos o comenzar a hacer la el sistema según cumpliendo esos estándares mínimos. Pero cuando yo hablo de proyecto es, ¿cuál es lo que ustedes quieren llegar a hacer como un aplicativo pequeño? No me pueden decir, "Ey, queremos un wapi porque es imposible. Yo llevo muchos años haciendo un wapi eh un aplicativo pequeño para yo poder tener unos ingresos. Ejemplo, yo qué aplicativo haría y que estoy 100% seguro que generaría rentabilidad y es muy y es muy práctico hacerlo el de verificar ARL y certificado de alturas.




02:13:10


<strong>FELIX BEDOYA</strong>: Yo voy hago un aplicativo, lo monto la nube y se lo vendo a las obras para que cuando vaya cualquier persona vaya a ingresar una vaya a ingresar y esa personita sea el vigilante o sea el DCST solamente coloque el nombre y cédula y le bote todo, me lo compran. Porque hay veces que le llegan 15 trabajadores, 15 personas en fila y se puede demorar 45 minutos, una hora, una hora y media, 2 horas para poder que esas 15 personas pasen. ¿Cuánta plata se perdió ahí? Eso, eso, a lo, eso a lo que yo me refiero, un proyecto. Y ahí ya les di uno y así pueden haber
<strong>XIOMARA ARDILA</strong>: momento. Bueno, y tengo otra pregunta. Es que hoy hoy hablaste de muchas cosas, hay mucha mucha que pues como dijo la compañera Camelía que vayamos haciendo ejercicios pues si nos vinieran las dudas. Eh, el tema de las automatizaciones, o sea, todavía no has llegado a a por lo menos a crear una, ¿cierto? Para explicarnos cómo podemos nosotros ir creándolos. Padrino,




02:14:21


<strong>FELIX BEDOYA</strong>: Siomi,
<strong>XIOMARA ARDILA</strong>: porque esos 20 siguen en la lucha.
<strong>FELIX BEDOYA</strong>: pero es que yo toda la clase les he mostrado automatizaciones creadas y y les mostré en Antigravity cómo se podía crear
<strong>XIOMARA ARDILA</strong>: Seguimos en la búsqueda de lo que Dios mío. Pues nosotros continuaremos aquí.
<strong>FELIX BEDOYA</strong>: uno.
<strong>XIOMARA ARDILA</strong>: Ya queremos saber quién es el ganador y ya queremos ver cómo desempeñan los adultos,
<strong>FELIX BEDOYA</strong>: Te recomiendo si algo, repite la la capacitación, repítala,
<strong>XIOMARA ARDILA</strong>: porque lo que sí clarísimo es que los minis nos dejaron muchas veces.
<strong>FELIX BEDOYA</strong>: porque todo lo que yo les he mostrado, por ejemplo, en en Wapi son automatizaciones creadas que ya funcionan, que me funcionan, obviamente en mi usuario porque yo le tengo activado Antigravity, porque yo le tengo conectado eh Google, ¿cierto?
<strong>XIOMARA ARDILA</strong>: tan corta como lo que necesitas para una créditos morada.
<strong>FELIX BEDOYA</strong>: Pero son cosas que yo en muchas capacitaciones y he hecho en este curso les he enseñado cómo lo deben de hacer.
<strong>XIOMARA ARDILA</strong>: minutos.
<strong>FELIX BEDOYA</strong>: Entonces,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: M.
<strong>FELIX BEDOYA</strong>: En ese paso a paso,
<strong>XIOMARA ARDILA</strong>: Estamos presentando,
<strong>FELIX BEDOYA</strong>: si ustedes hacen todo lo que yo les he enseñado,




02:15:01


<strong>XIOMARA ARDILA</strong>: Yo me llamo ves caracol.
<strong>FELIX BEDOYA</strong>: van a llegar a ser este, ¿cierto? para poder copiar esas esas esas automatizaciones directamente para ustedes y ponerlas directo.
<strong>XIOMARA ARDILA</strong>: Okay, Bueno,
<strong>FELIX BEDOYA</strong>: Listo,
<strong>XIOMARA ARDILA</strong>: mantiene tres conectar o libre.
<strong>FELIX BEDOYA</strong>: caro.
<strong>Carolina Colorado Cano</strong>: Yo quería preguntarte precisamente eso porque se me ocurrió una idea para una empresa que hace solo es que si uno podía sacar esos aplicativos. Por ejemplo, yo tengo un contrato con una empresa solo que se vence en marzo, en la que yo le tenía que hacer el diseño, pues de varias cosas del PES y adicional el de 180 hojas de vida de
<strong>FELIX BEDOYA</strong>: Sí.
<strong>Carolina Colorado Cano</strong>: 180 vehículos, ¿cierto? Pero la condición era que yo se las entregaba incluido con la información de los mantenimientos, siempre y cuando los colaboradores lo enviaran. A la fecha ningún colaborador lo ha enviado, pues entonces las hojas están entregando solo con información básica. ¿Qué necesitarían ellos después? Precisamente eso, que cada vez que ingresa un nuevo colaborador con un nuevo vehículo, pues se le se cree una nueva hoja de vida a ese vehículo que se valide cada vez que ellos envíen los mantenimientos y que se actualice esa hoja de vida, que se revisen el preoperacional al final del día, quién lo hizo, quién no lo hizo y que en base en ese preoperacional, miren los kilometrajes, cada 2000 km lo tienen ellos, ellos deberían enviar mantenimiento.




02:16:30


<strong>Carolina Colorado Cano</strong>: Entonces, si hoy revisó el y ya, no sé, 100 km, ya debería mandar la alerta de que esa persona no ha enviado el mantenimiento de su vehículo. Sí, pero entonces obviamente eso sería si yo tuviera toda esa información, pero la va a oa ellos necesitarían el aplicativo ellos, ¿cierto? Eso se puede entonces sacar no solamente en nuestro sistema, sino que uno lo puede crear en una web. es lo que entiendo.
<strong>FELIX BEDOYA</strong>: Sí, claro.
<strong>Carolina Colorado Cano</strong>: H
<strong>FELIX BEDOYA</strong>: Sí, claro.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Otra pregun.
<strong>FELIX BEDOYA</strong>: Sí, claro. Pero obviamente, caro, una cosa es que podamos crear el aplicativo en tu computador para que tú lo manejes y otra cosa yo lanzar eso una web. Al yo lanzarlo a una web, pues tiene unos costos, ¿cierto? Lanzar simplemente que aparezca wapi punclub en la nube y que
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: H
<strong>FELIX BEDOYA</strong>: ustedes puedan escribir wapi punclub y me aparezca la página. Eso tiene unos costos, ¿cierto? que tan costosos no son para lo que tú quieres. Ejemplo, para lo que tú quieres te puede salir al año un millón de pesos, ¿cierto?




02:17:44


<strong>FELIX BEDOYA</strong>: Pero si tú le ves la rentabilidad que le puede sacar a ese proyecto que tú me estás diciendo, un billón de pesos es una abogada para lo que te pueden pagar por esto.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Pero Félix, si de pronto Carolina tiene en esa empresa un auxiliar de apoyo mediante correo, Puis ir trasladando esa información.
<strong>FELIX BEDOYA</strong>: Sí, claro. Yo haría,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Simplemente automatiza mediante correo un responsable y
<strong>FELIX BEDOYA</strong>: yo haría
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: hago bien la trazabilidad y hasta ahí llegaría. Pues muy respetuosamente, Carolina.
<strong>FELIX BEDOYA</strong>: yo haría el flujo, yo haría el flujo dentro, sea en Wapi o sea en Antigravity, más fácil en Guapi. Y ya les voy a decir por qué porque tenemos disparadores diferentes. O sea, Antigravity solo tiene un disparador. Ojo, que podíamos crearle otros, pero tocaría programar. Pero Antigravity en este momento, bueno, tiene dos dos disparadores, perdón. tiene el Chrome, que yo lo cuando lo dejo listo, que es la automatización, o mi segundo disparador es qué escribir. Acá no hay otro disparador diferente.




02:18:51


<strong>FELIX BEDOYA</strong>: En Guapi nosotros podemos tener un montón de disparadores y podemos crear más necesidad. Entonces,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Hai
<strong>FELIX BEDOYA</strong>: eso permite de que si yo tengo un flujo dentro de Wapi, en este caso lo que tú dices, Carolina, eh, pues no solamente lo puedo utilizar esa empresa, pues después de que haya la data y estén las empresas activas dentro de Wapi, pues cualquier empresa lo puede utilizar y le va a llegar simplemente que no van a entrar una web, sino que va a llegar una entrada y le va a llegar una salida como dice doña Gloria, le va a llegar un correo y ya.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: a un responsable.
<strong>Carolina Colorado Cano</strong>: Pero tendría yo que tener la tendría yo que tener el acceso a esa información,
<strong>FELIX BEDOYA</strong>: Ah, sí,
<strong>Carolina Colorado Cano</strong>: no esto se lo dije a ellos,
<strong>FELIX BEDOYA</strong>: claro.
<strong>Carolina Colorado Cano</strong>: sino que yo pues en teoría mientras yo estoy manejando el proyecto,
<strong>FELIX BEDOYA</strong>: Esto no realmente.
<strong>Carolina Colorado Cano</strong>: yo tengo acceso a toda la carpeta del PES de ellos.
<strong>FELIX BEDOYA</strong>: Ah, no, ellos le tienen que dar acceso a esa información.




02:19:41


<strong>Carolina Colorado Cano</strong>: Mientras yo contrato es
<strong>FELIX BEDOYA</strong>: Ahí, ahí es lo que yo siempre les decía, o sea, si no tenemos la data, es que si no tenemos la data no podemos hacer nada. Es lo más importante. Es lo más importante. Sí.
<strong>Carolina Colorado Cano</strong>: por eso había pensado que entonces si se pudiera sacar entonces están las dos alternativas sí se puede sacar y y entregárselo a ellos, pero tiene un pago esa página web que sería la única forma de sacar el aplicativo. ¿cierto? Y la otra es
<strong>FELIX BEDOYA</strong>: Ya nosotros podemos nosotros podemos crear un aplicativo donde ellos lo abran y ellos mismos monten la información y se cree todo el proceso.
<strong>Carolina Colorado Cano</strong>: y ese es en la web, ¿cierto? Es así, pero por eso hay que pagar lo que tú dices y depende
<strong>FELIX BEDOYA</strong>: Eso tiene unos costos. Sí, eso tiene unos costos inherentes, tiene una programa PC de hacer unas cositas diferentes, pero sí es es totalmente factible.
<strong>Carolina Colorado Cano</strong>: Okay, okay.
<strong>FELIX BEDOYA</strong>: De hecho,
<strong>Carolina Colorado Cano</strong>: La otra es decir ellos que si yo sigo manejando la información porque ya el flujo lo




02:20:44


<strong>FELIX BEDOYA</strong>: de hecho,
<strong>Carolina Colorado Cano</strong>: tendría Okay.
<strong>FELIX BEDOYA</strong>: claro, obvio.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Félix,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Venga.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: eh, revisando o teniendo en cuenta M. lo que lo que siara dijo ahora y la preocupación de ella. Eh, yo sé que pues tú has sido muy juicioso con el tema de las clases y explicar muy bien y todo el cuento, pero eh de pronto no todos somos así como de hábiles eh frente al tema de la tecnología o que o cogerla muy rápido.
<strong>FELIX BEDOYA</strong>: Sí.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: No sé si si sea posible que alguno de tu grupo
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Hm.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: o vos mismo y no sé, de forma particular e individual hacer el paso a paso eh uno con la plataforma de Wapi, es decir, que como unas clases adicionales extras, pero personalizadas, pero haciéndolo con uno para ver si uno de esa forma se suelta más fácil, seas tú o alguien de tu equipo, no Eso es viable o no o qué.
<strong>FELIX BEDOYA</strong>: Doña María Elena, es muy difícil, la verdad.




02:21:55


<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Sí.
<strong>FELIX BEDOYA</strong>: Es muy difícil por el tiempo. Es muy difícil. Yo lo que podría hacer es que la próxima clase toda sea en automatizaciones con con los flujos de Wapi, toda con ustedes mismos.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: hacer un ejercicio.
<strong>FELIX BEDOYA</strong>: Pero sí,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Hacer un ejercicio acá en clase próxima semana.
<strong>FELIX BEDOYA</strong>: pero ¿cuál es cuál es la cuál es cuál es la la responsabilidad que ustedes me traigan los flujos? Porque si no yo les voy a proponer flujos que en mi mundo estén,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Hm.
<strong>FELIX BEDOYA</strong>: pero puede que en sus necesidades, su día a día no estén. Ejemplo, el flujo que Carolina me acabo de decir, pues en mi mundo eh apenas existió,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Y el que yo le dije,
<strong>FELIX BEDOYA</strong>: ¿no? El que tú me dices, yo ya lo tengo, está hecho.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ah, okay.
<strong>FELIX BEDOYA</strong>: De por eso te lo te lo respondí con tanta propiedad en decirte.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Mm.
<strong>FELIX BEDOYA</strong>: Lo que pasa es que hay unas páginas que tienen un bloqueo de seguridad porque yo ya probé todo eso, ya está hecho.




02:22:48


<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ya.
<strong>FELIX BEDOYA</strong>: Guapi lo hace.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ok.
<strong>FELIX BEDOYA</strong>: En eso no hay ningún problema.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Feliz, feliz, otra pregunta.
<strong>FELIX BEDOYA</strong>: Sí.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Yo puedo automatizar simultáneamente varias empresas, obviamente siendo muy clara al solicitar la información, al sí, pues al plantear lo que necesito, lo que requiero, por decir algo, en la matriz legal, simultáneamente lo podría automatizar para varias empresas.
<strong>FELIX BEDOYA</strong>: Mira, nosotros acá puedes colocar las automatizaciones en wapi que quieras, solamente es activarlas o desactivarlas en antigravity las que quieras, simplemente es crearlas. ¿Listo? ¿De qué depende eso?
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: L
<strong>FELIX BEDOYA</strong>: Hay algo que es muy importante que ustedes tienen que tener también claro. Si yo pongo a correr 10 automatizaciones a la el mismo día, al mismo minuto, ¿ustedes que creen? ¿Y qué va a pasar?
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Se me acaban los Se me acaban los tokens.
<strong>FELIX BEDOYA</strong>: Y no solamente se le se le acaban, sino que muy seguramente como estamos trabajando bajo la misma API o el mismo antigravity.




02:24:13


<strong>FELIX BEDOYA</strong>: Yo antigravity puedo 20 20 chats a correr al mismo tiempo, pero se ponen lentos.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Pero mira que aquí mientras que estábamos en la clase, yo le había comentado que se me habían terminado los tokens por Gemini 3.8 y mientras que tú estabas dando la clase, yo le di la orden de que me generara una matriz de una lavandería de acuerdo a la GTC45 y le di cloud. Ya él arrancó otra vez. Entonces, hay que, como vos decís, sin gastar todos los esas alternativas que nos da en la Sí,
<strong>FELIX BEDOYA</strong>: Sí, gastar gastar las alternativas, pero en ese tema de los de los flujos sí tengan en cuenta eso. O sea,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: ¿no? Pero sí es buen dato.
<strong>FELIX BEDOYA</strong>: yo puedo puedo tener muchos simplemente como que eso que yo no
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Claro, sí, tienes toda la razón. Sí, sí.
<strong>FELIX BEDOYA</strong>: los vaya a activar todos al mismo tiempo. Eso es lo único. O sea, activen dos o tres y te van a correr bien.




02:25:04


<strong>FELIX BEDOYA</strong>: Pero si yo activo 10,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Hab
<strong>FELIX BEDOYA</strong>: 15, 20 flujos al mismo tiempo, sea Wappy, sea Antigravity, hombre, te van a comenzar a chocar porque estamos utilizando la misma conexión a la misma inteligencia artificial. diferente fuera. Si yo le y eso lo podemos hacer, lo voy a mañana lo voy lo voy a hacer diferente fuera que yo le pusiera a cada flujo una clave API diferente. Eso me permitiría de que trabajen separados. Entonces, en Wappy sí podría tener 20, 30 flujos, 40 flujos a la vez. Lo voy a programar, ya que tú me haces caer en cuenta. Eso sería como una solución para poder que corran diferente, siendo flujos eh sencillos. ¿Listo?
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Mm. Listo.
<strong>FELIX BEDOYA</strong>: Eso sí lo podríamos hacer,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Gracias.
<strong>XIOMARA ARDILA</strong>: Felix,
<strong>FELIX BEDOYA</strong>: ¿sí o?
<strong>XIOMARA ARDILA</strong>: tengo una pregunta loca, o sea, eh no sé qué tan loca era.
<strong>FELIX BEDOYA</strong>: Esas esas son las que me gustan.
<strong>XIOMARA ARDILA</strong>: Yo, bueno,
<strong>FELIX BEDOYA</strong>: Esas son las que me gustan.




02:26:01


<strong>XIOMARA ARDILA</strong>: lo que bueno, eh yo utilizo unos formatos de de las cajas de compensación familiar, ¿sí? Entonces, yo lo que hago es eh yo los formatos los utilizo mucho digital, entonces yo lo que hago es digitalizar, pero entonces cada vez, o sea, hay alguna herramienta que me pueda eh facilitar un poco el tema de por lo menos es que como nosotros eh en el año eh se nos bueno, nos se nos terminan los contratos, se renuevan contratos, o sea, renovamos contrato. en el año dos veces. Entonces, para mí es gastante tener que volver copiar y pegar toda la información del trabajador. Sí. Y pues solamente tendría que cambiar la fecha y el salario pues que es lo que varía. Pero el resto la misma información del trabajador. Para mí desgastante es copiar y pegar, copiar y pegar o entonces no sé si hay como alguna herramienta o algo que me pueda facilitar esa parte. M.
<strong>FELIX BEDOYA</strong>: Eh, Xomi, vuelvo y te doy la recomendación que creo que te di la clase pasada. Nos falta cachar Antigravity.




02:27:18


<strong>FELIX BEDOYA</strong>: Eso es una de las tareas.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Sí.
<strong>FELIX BEDOYA</strong>: Eso es una de las tareas más básicas que puede hacer Antigravity.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Ok.
<strong>FELIX BEDOYA</strong>: O sea, tú le puedes entregar un ese ese esa información de ese Excel, me imagino que es un Excel o no sé qué qué formato lo tendrán y decirle,
<strong>XIOMARA ARDILA</strong>: Es un PF.
<strong>FELIX BEDOYA</strong>: no es un PDF.
<strong>XIOMARA ARDILA</strong>: Es un PF.
<strong>FELIX BEDOYA</strong>: Tú le puedes decir, "Ven, yo quiero que me crees otro PDF con la misma información y le cambio la fecha.
<strong>XIOMARA ARDILA</strong>: Mm.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Y si lo tiene que pasar a Excel,
<strong>XIOMARA ARDILA</strong>: Okay.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: se lo pasa también el con Cloud.
<strong>FELIX BEDOYA</strong>: y se lo quiere pasar a Excel, la Word, PowerPoint, Text, el archivo que usted dese o sea esa es esa es la tarea más básica
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Sí.
<strong>FELIX BEDOYA</strong>: que hace que hace Antigravity.
<strong>XIOMARA ARDILA</strong>: Ah, okay. Listo. Vale. Bueno, listo.
<strong>FELIX BEDOYA</strong>: Mañana lo intenta.
<strong>XIOMARA ARDILA</strong>: Gracias.
<strong>FELIX BEDOYA</strong>: Mañana inténtalo con cualquier PF.




02:28:04


<strong>FELIX BEDOYA</strong>: Pásenme esta información y con este
<strong>XIOMARA ARDILA</strong>: Lo voy a hacer. Lo voy a hacer porque de hecho estoy trabajando con eso porque iniciamos contrato ahorita. Ahorita último, entonces estoy con eso y no, ya estoy cansada y son hartos trabajadores,
<strong>FELIX BEDOYA</strong>: Pero entonces cuando lo vayas a hacer,
<strong>XIOMARA ARDILA</strong>: No,
<strong>FELIX BEDOYA</strong>: escoges el modelo y le colocas low, por favor lo más lo más bajito posible que que sea,
<strong>XIOMARA ARDILA</strong>: no.
<strong>FELIX BEDOYA</strong>: porque eso es una tarea muy es que es demasiadamente básica para Antigravity. Entonces, no como para que no te gaste mucho proceso, pero él te lo va a hacer de una forma, ¿no? Mejor dicho,
<strong>XIOMARA ARDILA</strong>: Bueno,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Un segundo.
<strong>XIOMARA ARDILA</strong>: la pregunta aquí, o sea, yo puedo unir todos los PDFs en un solo, o sea, unir todo y y decirle a Antigravity que me cambie pues las fechas, ¿sí? O me tocaría uno por uno. Ok.
<strong>FELIX BEDOYA</strong>: yo lo haría. Yo lo que haría es hacer uno por uno, o sea, no es que yo le voy a mandar mensaje por mensaje, no, yo le voy a decir en esta carpeta hay tantos PDFs, quiero que me le cambies la fecha o me le hago una copia nueva a todos ellos y me le cambie la fecha por esto.




02:29:18


<strong>FELIX BEDOYA</strong>: No va a ser un PDF tan extenso porque el proceso te puede terminar mucho más largo, demasiadamente más largo. Es más fácil que él le cambie las fechas a uno por uno de los te hace una copia de todos y le cambia uno por uno, él va quedando carpetas. Igual yo les enseñé que podemos crear sub agentes. Entonces, ¿yo qué haría? Ah, que son 30 PDF. Yo qué haría. Ah, no, venga, si veamos ese trabajo de 30 PDFs en cinco subagentes, dele seis a cada uno.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: H
<strong>FELIX BEDOYA</strong>: Y lo que va a serer Antigravity es que va a crear cinco subagentes a la vez trabando en paralelo. haciéndose el trabajo, pum, pum, pum, lo que va a hacer que el tiempo sea mucho menor. Entonces, acuerden también de eso que yo les enseñé, que se pueden crear subvagentes, los subvagentes se le pueden dar tareas. En ese caso, yo yo haría eso.
<strong>XIOMARA ARDILA</strong>: Ah, okay. Listo. Vale, muchísimas gracias.
<strong>FELIX BEDOYA</strong>: Listo. Chicos, ¿alguna otra consulta?




02:30:28


<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Ha. Nada cacharirear ha trabajar el tema.
<strong>FELIX BEDOYA</strong>: cachar y entonces quedamos con la tarea y espero espero que todos la hagamos. Pueden repetir esta clase. Yo sé que fue un poquito técnica. Vamos a repetirla.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: H
<strong>FELIX BEDOYA</strong>: Y todos, pero todos sin falta, todos me van a traer un flujo. Todos sin falta me van a traer un flujo. Ah, que quieren saber más o menos qué flujos y cómo se pueden hacer, pues pueden ver volver a ver la clase o pueden ir a Wappy, pueden ir a tareas. en tareas le dan en brujos preestablecidos y comiencen a leer los ejemplos que aparecen para que les les desarrolle idea. O simplemente van Antigravity y abren un nuevo chat, ustedes le dicen, "Yo quiero hacer un flujo para una automatización, necesito hacer esto y esto y esto y esto y esto." ¿Que cuál sería el paso a paso que voy de seguir? O abren a Tenche y comienzan a hablar con él para que comiencen a crear el el flujo con él.




02:31:29


<strong>FELIX BEDOYA</strong>: Hágalo como como lo vean mejor. Yo la verdad por más practicidad lo haría con Antigravity escribiendo mientras le cojo
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Mhm.
<strong>FELIX BEDOYA</strong>: como ese tecnicismo y esa habilidad y después sí le digo a Ten necesito esto, esta la entrada, este es el proceso, estas son mis herramientas, esta mis salida. Venga, ayúdemelo a hacer. Listo. Haría como eso y que quede como de tareita. Entonces quedemos en eso. La próxima semana solamente va a ser una clase nuevamente. Ahí sí ya no vamos a repasar. sino que vamos a hacer sí o sí a tratar de hacer un flujo por cada uno. ¿Listo? Mejor dicho, tienen que traerme los flujos. Yo los evalúo, los miro, les digo, "Sí, esto sí se puede, esto sí está entre el orden. Compárteme pantalla que lo vamos a hacer con su Antigravity o lo vamos a hacer con tu usuario de Wappy listo. No los voy a hacer yo en mi Antigravity, no los voy a hacer yo en mi Wappy, no.




02:32:26


<strong>FELIX BEDOYA</strong>: Cada uno se lo va a llevar en su usuario o en su instancia de Antigravity entonces con esa tareita.
<strong>Carolina Colorado Cano</strong>: Feliz pregunta,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Bien.
<strong>Carolina Colorado Cano</strong>: eh, ese cómo es, flow y el otro que nos falta. Es que no me acuerdo. Esos también los vamos a ver.
<strong>FELIX BEDOYA</strong>: Sí.
<strong>Carolina Colorado Cano</strong>: Ok. Ok.
<strong>FELIX BEDOYA</strong>: Y es muy importante, tranquilos, sino que como tenemos que hacer este este pauso, van a ser herramientas que de hecho van a ser parte de los flujos.
<strong>Carolina Colorado Cano</strong>: Okay.
<strong>FELIX BEDOYA</strong>: Son herramientas que hacen parte de los de los flujos.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ok.
<strong>FELIX BEDOYA</strong>: ¿Para qué nos sirve notebook LM? Notebook LM nos sirve para hacer infografías, podcast, videos. nos sirve como un segundo cerebro para nuestros nuestros asistentes.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ok.
<strong>FELIX BEDOYA</strong>: Nos sirve para hacer exámenes, nos sirve para hacer mapas mentales, pero cuando hablamos de eso que yo te acabo de decir, o sea, son cosas muy bien elaboradas desde notebook LM y yo flow lo utilizo mucho para hacer un antes y un después de una actividad de un control propuesto.




02:33:34


<strong>FELIX BEDOYA</strong>: Entonces, ah, que yo tú que haces auditoría. Ah, yo hice una auditoría y y resulta que identifiqué que tienen, no sé, un riesgo muy alto, eh, que no se va contra x normatividad o y normatividad y te dicen, "Ay, ven, ¿y por qué no nos propones qué control podemos hacer?" Ah, listo, yo tomo las fotos. Tomo las fotos, comienzo a investigar qué control puedo hacer y en flow. Entonces, le monto la foto, le digo, "¿Qué es el control que yo tengo pensado que se debería hacer para que esa actividad quede mejor?" y Flow me va a traer esa misma imagen o un video con el control ya hecho. Para eso yo utilizo Flow. Listo. Entonces sí las vamos a ver. Y de hecho, esas dos herramientas pueden hacer parte de nuestros flujos de trabajo para que lo tengamos como como en cuenta. Sería chévere que en integraciones, ustedes saben que pueden hacer integraciones, entrar integraciones en Wappy, ahí les va a aparecer integraciones de flow, de notebook lm, simplemente es copiar un texto, venir de copiar Antigravity para que les comience a hacer las las integraciones, así como lo hicimos con con Antigravity.




02:34:44


<strong>FELIX BEDOYA</strong>: De la misma forma se integran Flow y Notebook LM para que los nuestros sistemas queden todos interconectados de la misma manera. ¿Listo? También hay una integración allá. Ven, yo miro para que la chequeen de pronto mañana.
<strong>XIOMARA ARDILA</strong>: Félix, ¿te acuerdas que yo te había comentado que a mí me llegó una notificación al correo y incluso en Antigravity donde no me quedó como instalado los esos eh lo último que nombraste lo y para hacer los
<strong>FELIX BEDOYA</strong>: Claro, porque no te cogí instalado porque no no los instalamos,
<strong>XIOMARA ARDILA</strong>: Ah,
<strong>FELIX BEDOYA</strong>: no es que no es que no hayan quedado mal instalados,
<strong>XIOMARA ARDILA</strong>: Ok.
<strong>FELIX BEDOYA</strong>: sino que nunca los instalamos. Entonces, acá está Notebook LM. Simplemente ustedes le dan gestionar sesión, Flow, le dan en gestionar sesión. Mire que si yo acá le doy, él de una vez me va a decir vincular directamente desde tu PC o antigravity. Y una vez me dice copiar para antigravity. Copio, voy allá, pego y ya. De hecho, acá me dice el paso a paso, facilito.




02:35:49


<strong>FELIX BEDOYA</strong>: Eso, eso es poquito, no hay mucho que hacer. Lo mismo, eh, plow. Por acá nos va a aparecer uno que es Guapi Studio. Wappy es para hacer videos también es lo mismo. Nos va a decir subagentes y skills. Entonces acá nos va a decir que hemos de copiar unos mensajes que le hemos pegar nosotros a Antigravity. Si quieren lo miran, si lo ven comprensi lo hacen, si no no lo hagan todavía, que entonces va a haber una clase donde nosotros lo vamos a poner. Si ustedes creen que hace parte de los flujos que van a proponer, si traten como de cacharrear la herramienta, venir y interconectarlos si creen que hace parte de los flujos que van a proponer. Si no, lo pueden dejar por el momento, así que vamos a tener una una clase para conectar todos estos estos módulos. ¿Listo?
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Félix, tengo pregunta. Eh, tú nos dices que dentro de 8 días de pues traer a la clase un flujo ya, un flujo ya por cada uno de acuerdo a la necesidad o lo que queremos hacer.




02:36:55


<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Eh,
<strong>FELIX BEDOYA</strong>: Sì.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: pero cuando tú dices traerlo es descrito, más no con los muñequitos que o mejor dicho los dibujos o la imagen que tú nos muestras, los flujos ya preestablecidos que tiene Wapi como Ah,
<strong>FELIX BEDOYA</strong>: Solamente escrito, solamente escrito,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: listo.
<strong>FELIX BEDOYA</strong>: o sea,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Perfecto.
<strong>FELIX BEDOYA</strong>: la idea bien maqueteada. Yo quiero,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ok.
<strong>FELIX BEDOYA</strong>: yo quiero que sea un cron, yo quiero que sea desde Tenchi un mensaje, yo quiero que sea desde un correo, yo quiero que sea desde Antigravity, que me haga la entrada y yo quiero que me saque información, que me revise x carpeta y quiero que me entregue tal informe. Quiero que me llegue a tal correo, quiero que le llegue a tal persona de tal manera, si me entiendes, como todo la todo maqueteado,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Sí.
<strong>FELIX BEDOYA</strong>: bien escrito, no importa que si si lo quieren hacer en dibujito, lo hacen en dibujitos, como un cuadrito, así como está Wappy, si no simplemente lo escriben bien y me lo traen ya.




02:37:51


<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Okay, perfecto. Listo. Gracias.
<strong>FELIX BEDOYA</strong>: Es es lo único y ya nosotros ya lo lo traemos a la realidad. Listo, chicos. Yo yo creo que que hasta acá. Eh, les deseo feliz noche, gracias por participar. Vuelvo y les digo lo que les recomendé la clase pasada y la que yo creo que les he recomendado mucho. Primero, no se limiten a la imaginación, casi que todo lo podemos hacer, casi que todo. Hay capas de seguridad que, por ejemplo, lo que hablamos con María Elena, pues hay páginas que nos bloquean y no lo podemos hacer, pero la gran mayoría de las cosas las vamos a poder realizar. Y segundo, tenemos que cacharrar Antigravity. O sea, tenemos dos horitas o dos horitas y media que tenemos de clase cada semana, pero si nosotros no le damos el tiempo de lo que nosotros comenzamos a hablar acá, e ir a cacharrealo, pues casi que nos quedamos con ese con ese mismo bloqueo. Entonces sí les recomiendo saquen así sea 15 minuticos, 20 minuticos, ir a cacharrearlo.




02:38:46


<strong>FELIX BEDOYA</strong>: Busquen videos en YouTube. En YouTube también hay unos videos donde yo puedo decir, "Ay, venga, un curso de Antigravity." y donde nos van de pronto nos den una pistica más allá o de pronto eh otra persona que te otro punto. punto de vista nos ayude como a ampliar esa visión, aunque yo creo que yo explico muy poquito, puedeer que otra persona te pueda llegar de una mejor manera y reforzar ese conocimiento que tenemos en Antigravity. Yo sé que tengo en YouTube hay cursos de 15, 20 minuticos o si no cacharrear. Yo creo que la forma más fácil de uno aprender a manejar Antigravity mediante texto es cacharrear sin taparme los ojos. O sea, sin decir, "Ay, es que esto no lo puede hacer." No, esto sí lo puede hacer. Esto sí lo hace. Entonces, simplemente es decirle, "Quiero esto." Ah, sí, sí, sí lo podemos hacer. Esto lo hacemos así, así, así. Listo. Hágale. Avancemos, avancemos, avancemos, avancemos, avancemos. Listo. Eso es lo importante, chicos.




02:39:39


<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Okay, Félix,
<strong>FELIX BEDOYA</strong>: Feliz
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: antes de que nos vayamos, eh, las últimas dos clases, pues nosotros todas las clases la teníamos programado para los martes, pero las últimas dos se han hecho los miércoles, creo. Entonces, ya que estamos aquí, ¿vamos a seguir en clase los miércoles o o qué? No, se los pregunto porque yo ya me había hecho una programación y y para inclusive si ustedes vieron hoy eh pues ingresé tarde porque ya yo los miércoles tenía otra cosa, pero pude organizar diferente y así. Pero entonces para saber cómo vamos a seguir haciendo y definir eso.
<strong>FELIX BEDOYA</strong>: No, realmente hace 15 días sí fui yo. Hace 8 días fui yo. Fui yo, no fue Antigravity que realmente están haciendo unas actualizaciones y yo les dije,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Ajá.
<strong>FELIX BEDOYA</strong>: "No vale la pena prenderlo porque no nos va a funcionar bien." Y si han visto han actualizado muchas cosas. Y esta semana hubieron, existieron varios compañeritos que me escribieron que por favor lo dejáramos miércoles y por eso pues lo puse a votación en el en el en el grupo.




02:40:40


<strong>FELIX BEDOYA</strong>: De la misma manera,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: H
<strong>FELIX BEDOYA</strong>: pues les les pongo la la pregunta a todos, eh, si quieren que lo sigamos haciendo los martes o los miércoles, porque realmente yo yo no tengo problema, yo simplemente me programo y y cualquiera de los dos días lo podemos realizar. Entonces, no sé, lo seguimos haciendo los martes o lo seguimos haciendo los
<strong>XIOMARA ARDILA</strong>: muchas difacciones.
<strong>FELIX BEDOYA</strong>: miércoles.
<strong>XIOMARA ARDILA</strong>: ¿Qué estás estudiando?
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Jóvenes,
<strong>XIOMARA ARDILA</strong>: No soy un estudiante.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: somos todos oídos para que concertemos aquí de una vez.
<strong>XIOMARA ARDILA</strong>: La necesidad de ir a la delito propagado para mantener a los jóvenes sus para ver lo que
<strong>FELIX BEDOYA</strong>: Si no, seguimos los martes. Si no hay si no hay consenso,
<strong>XIOMARA ARDILA</strong>: realmente pues yo nada.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Yo no tengo problema.
<strong>FELIX BEDOYA</strong>: pues
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: Yo yo no tengo problema en que sea los martes,
<strong>XIOMARA ARDILA</strong>: Yo algo sonrío.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: inclusive yo fui una de las que le solicité a Félix que si lo traslaba para hoy miércoles porque anoche
<strong>XIOMARA ARDILA</strong>: ¿Y cuál es el punto? Si vivimos en un vacío de la nada donde no hay nada,
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: tuve entrenamiento de alturas,
<strong>XIOMARA ARDILA</strong>: hay espacio solo para crecer.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: pero no hay problema los martes. Yes.
<strong>FELIX BEDOYA</strong>: entonces sigamos los martes.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Listo. Perfecto.
<strong>XIOMARA ARDILA</strong>: Listo,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Okay. Bueno, jóvenes,
<strong>FELIX BEDOYA</strong>: Listo.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: muchísimas gracias.
<strong>FELIX BEDOYA</strong>: Hasta luego. Dios los bendiga.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Amén.
<strong>FELIX BEDOYA</strong>: Muy bien.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: A todos,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Buenas noches.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: muchas gracias.
<strong>XIOMARA ARDILA</strong>: bendiciones,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Chao.
<strong>XIOMARA ARDILA</strong>: que descansen.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Feliz noche.
<strong><strong>Gloria Amparo Quintero</strong> Giraldo</strong>: descanse.
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Gracias.
<strong>XIOMARA ARDILA</strong>: Feliz noche,
<strong><strong>Maria Elena Obando</strong> Colonia</strong>: Lo mismo.




La transcripción finalizó después de 02:42:04


Esta transcripción editable se generó por computadora y puede contener errores. Los usuarios también pueden cambiar el texto después de que se cree.</p>
          </div>
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
