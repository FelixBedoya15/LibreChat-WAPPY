# -*- coding: utf-8 -*-
"""
Generador Maestro de la Página de Clase 5:
Puesta en Marcha de Flujos DAG, Google NotebookLM & Google Flow Audiovisual
Sesión en Vivo: Martes 17 de Noviembre de 2026 · 7:00 – 9:00 PM (Hora Colombia)
"""
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
  <meta name="description" content="Clase 5 Oficial en Vivo: Antigravity + Wappy IA · Martes, 17 de noviembre · 7:00 – 9:00 PM (America/Bogota) vía Google Meet (meet.google.com/yxv-gyhv-ron). Puesta en marcha práctica de los flujos diseñados por alumnos, Google NotebookLM con cero alucinación, generación audiovisual con Google Flow y claves API independientes.">
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

  <!-- ===========================================================
       BARRA DE NAVEGACIÓN SUPERIOR FIJA
       =========================================================== -->
  <header class="app-nav" role="banner">
    <div class="nav-container">
      <a href="/cursowappy01" class="brand-link" aria-label="WAPPY IA - Inicio del Curso">
        <img src="{cat_logo}" alt="WAPPY IA" class="cat-logo">
        <span class="brand-name">WAPPY <span>IA</span></span>
        <span class="brand-pill" style="background:rgba(239,68,68,0.2); border-color:#ef4444; color:#fca5a5;">🔴 EN VIVO</span>
      </a>

      <nav class="nav-actions" aria-label="Navegación principal">
        <a href="#video-clase" class="nav-link active">🔴 Sala en Vivo</a>
        <a href="#presentacion" class="nav-link">📊 Diapositivas (10)</a>
        <a href="#prompts" class="nav-link">💬 Prompts Clase 5</a>
        <a href="#guia-pasos" class="nav-link">📘 Preparación Previa</a>
        <button type="button" class="nav-link" onclick="openNotesModal()" style="background:rgba(199,243,3,0.15); border:1px solid rgba(199,243,3,0.4); color:#c7f303; cursor:pointer;">
          📋 Checklist &amp; Temario
        </button>
        <a href="https://meet.google.com/yxv-gyhv-ron" class="btn btn-primary" target="_blank" rel="noopener" style="background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-color:rgba(255,255,255,0.4);">
          <span>🔴 Entrar a Meet</span>
        </a>
      </nav>
    </div>
  </header>

  <!-- ===========================================================
       ORGANIZADOR DE CLASES DEL CURSO (6 Píldoras)
       =========================================================== -->
  <div class="course-organizer-strip" id="inicio">
    <nav class="course-organizer-inner" aria-label="Navegación oficial del curso">
      <a href="/cursowappy01" class="course-org-pill">🎓 Temario Curso</a>
      <a href="/clase1" class="course-org-pill done">✅ Clase 1 · Grabada</a>
      <a href="/clase2" class="course-org-pill done">✅ Clase 2 · Grabada</a>
      <a href="/clase3" class="course-org-pill done">✅ Clase 3 · Grabada</a>
      <a href="/clase4" class="course-org-pill done">✅ Clase 4 · Grabada</a>
      <a href="/clase5" class="course-org-pill active live">🔴 Clase 5 · Mar 17 Nov 7PM</a>
    </nav>
  </div>

  <main>
    <!-- ===========================================================
         HERO & SALA DE EMISIÓN EN VIVO CLASE 5
         =========================================================== -->
    <section class="hero-section" id="video-clase" aria-labelledby="hero-title">
      <div class="hero-inner">
        <div class="hero-kicker-row">
          <span class="live-pill" style="background:rgba(239,68,68,0.22); border-color:#ef4444; color:#fca5a5;">
            🔴 PRÓXIMA SESIÓN EN VIVO · MARTES 17 DE NOVIEMBRE · 7:00 – 9:00 PM
          </span>
          <span class="hero-telemetry">WAPPY.CLUB // SALA_EN_VIVO // CLASE_05_NOTEBOOKLM_FLOW</span>
        </div>

        <h1 class="hero-title" id="hero-title">
          Puesta en Marcha de <span class="accent-lime">Flujos DAG</span>, Google <span class="accent-teal">NotebookLM</span> &amp; Flow Audiovisual
        </h1>

        <p class="hero-desc">
          Quinta sesión práctica en vivo con el <strong>Ing. Félix Bedoya</strong>. Tomaremos los diagramas de flujos diseñados por los alumnos y los implementaremos en tiempo real en <strong>WAPPY</strong> y <strong>Antigravity</strong>, conectando además <strong>Google NotebookLM</strong> para podcasts y resúmenes ejecutivos con 0% de alucinación y <strong>Google Flow</strong> para la generación de micro-cápsulas audiovisuales de capacitación.
        </p>

        <!-- Reproductor Embebido 16:9 con Miniatura Oficial En Vivo -->
        <div class="video-viewport-wrap">
          <div class="video-aspect-box">
            <!-- Miniatura Oficial Personalizada HD 16:9 (Conexión Google Meet) -->
            <div class="video-thumb-cover" id="video-thumb-cover" onclick="window.open('https://meet.google.com/yxv-gyhv-ron', '_blank')" role="button" tabindex="0" aria-label="Entrar a la videoconferencia de la Clase 5 en Google Meet">
              <img src="{thumb_bg}" alt="" class="video-thumb-bg-img" aria-hidden="true">
              <div class="video-thumb-radial-overlay"></div>
              <div class="video-thumb-grid-bg"></div>

              <!-- Columna Izquierda: Avatar 3D de Félix Bedoya -->
              <div class="thumb-char-col">
                <img src="{felix_avatar}" alt="Ing. Félix Bedoya">
                <span class="thumb-char-tag">👨‍🏫 Ing. Félix Bedoya</span>
              </div>

              <!-- Columna Central: Logos + CLASE 5 + Píldoras + Botón Meet -->
              <div class="thumb-center-col">
                <div style="display:inline-flex; align-items:center; gap:8px; padding:5px 14px; border-radius:999px; background:rgba(220,38,38,0.22); border:1px solid rgba(248,113,113,0.65); color:#fecaca; font-size:11.5px; font-weight:900; letter-spacing:0.06em; margin-bottom:8px;">
                  🔴 SESIÓN EN VIVO · MARTES 17 NOV · 7:00 – 9:00 PM
                </div>

                <div class="thumb-logos-pill">
                  <img src="{wappy_horiz_logo}" alt="WAPPY Logo" class="wappy-h">
                  <span class="plus-sep">+</span>
                  <img src="{agy_logo}" alt="Google Antigravity" class="agy-i">
                </div>

                <div class="thumb-clase-giant">CLASE 5</div>

                <div class="thumb-sub-title">
                  Flujos DAG Alumnos, <span>NotebookLM 0% Alucinación</span> &amp; <span>Google Flow</span>
                </div>

                <div class="thumb-topic-pills">
                  <span class="thumb-topic-pill">🔀 FLUJOS ALUMNOS EN VIVO</span>
                  <span class="thumb-topic-pill">🎙️ PODCASTS NOTEBOOKLM</span>
                  <span class="thumb-topic-pill">🎬 GOOGLE FLOW VÍDEO</span>
                  <span class="thumb-topic-pill highlight">⏱️ 7:00 – 9:00 PM</span>
                </div>

                <div class="thumb-play-cta" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow:0 14px 36px rgba(16,185,129,0.6);">
                  <span class="thumb-play-icon">▶</span>
                  <span>UNIRSE A LA SALA DE GOOGLE MEET</span>
                </div>
              </div>

              <!-- Columna Derecha: Avatar 3D de Tenshi con Aureola -->
              <div class="thumb-char-col">
                <svg class="thumb-halo-svg" viewBox="0 0 200 60">
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#fde047" stroke-width="10"/>
                  <ellipse cx="100" cy="30" rx="82" ry="18" fill="none" stroke="#ffffff" stroke-width="3.5" opacity="0.9"/>
                </svg>
                <img src="{tenshi_img}" alt="Tenshi WAPPY IA">
                <span class="thumb-char-tag" style="border-color:#2dd4bf; color:#2dd4bf;">✨ Tenshi IA · WAPPY</span>
              </div>
            </div>

            <!-- Iframe de Espera Informativo -->
            <iframe
              id="drive-video-iframe"
              src="https://meet.google.com/yxv-gyhv-ron"
              allow="camera; microphone; fullscreen; display-capture"
              loading="lazy"
              title="Sala de Google Meet Clase 5">
            </iframe>
          </div>
        </div>

        <!-- Telemetría & Botones de Acción Rápida -->
        <div class="video-meta-bar">
          <div class="meta-item">
            <span class="meta-label">HORARIO OFICIAL</span>
            <span class="meta-val">🔴 Martes 17 Nov · 7:00 – 9:00 PM</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">SALA GOOGLE MEET</span>
            <span class="meta-val">🌐 meet.google.com/yxv-gyhv-ron</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">MATERIAL REQUERIDO</span>
            <span class="meta-val">📝 Diagrama de Flujo por Empresa</span>
          </div>
          <div class="meta-cta-group">
            <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener" class="btn btn-primary" style="background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
              <span>🔴 Entrar a la Sala Google Meet</span>
            </a>
            <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener" class="btn btn-secondary" style="border-color:rgba(59,130,246,0.5); color:#93c5fd;">
              <span>📅 Agendar en Google Calendar</span>
            </a>
            <button type="button" class="btn btn-secondary" onclick="openNotesModal()">
              <span>📋 Checklist &amp; Temario</span>
            </button>
            <a href="/clase4" class="btn btn-secondary" style="border-color:rgba(199,243,3,0.5); color:#c7f303;">
              <span>⬅️ Ver Grabación Clase 4</span>
            </a>
          </div>
        </div>

        <!-- Cuadrícula de Contenido y Objetivos de la Clase 5 -->
        <div class="chapters-card">
          <h3 class="chapters-title">📑 Temario &amp; Bloques de Trabajo Planeados para la Clase 5</h3>
          <div class="chapters-grid">
            <div class="chapter-pill">
              <span class="chapter-time">07:00 PM</span>
              <span class="chapter-name">Apertura y Revisión de Flujos Diseñados por las Empresas Alumnas</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">07:20 PM</span>
              <span class="chapter-name">Parametrización en Vivo en el Lienzo WAPPY (/tareas) y Pruebas DAG</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">07:45 PM</span>
              <span class="chapter-name">Google NotebookLM: Cero Alucinación Normativa y Fuentes Confiables</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">08:10 PM</span>
              <span class="chapter-name">Generación de Podcasts a 2 Voces y Resúmenes Ejecutivos en Audio</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">08:30 PM</span>
              <span class="chapter-name">Google Flow: Micro-Cápsulas de 3.5 Minutos y Reels de Capacitación</span>
            </div>
            <div class="chapter-pill">
              <span class="chapter-time">08:45 PM</span>
              <span class="chapter-name">Asignación de Claves API Independientes y Paralelismo en Servidor</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===========================================================
         ESCENARIO DE DIAPOSITIVAS INTERACTIVAS (10 SLIDES)
         =========================================================== -->
    <section class="deck-section" id="presentacion" aria-labelledby="deck-title">
      <div class="deck-container">
        <div class="deck-header">
          <div>
            <span class="slide-badge lime">TEMARIO MAESTRO · CLASE 5</span>
            <h2 class="deck-title" id="deck-title">Puesta en Marcha de Flujos, NotebookLM &amp; Google Flow</h2>
          </div>
          <div class="deck-controls">
            <button type="button" class="ctrl-btn" onclick="prevSlide()" aria-label="Diapositiva anterior">◀ Anterior</button>
            <span class="slide-counter" id="slide-indicator">Slide 1 de 10</span>
            <button type="button" class="ctrl-btn" onclick="nextSlide()" aria-label="Siguiente diapositiva">Siguiente ▶</button>
          </div>
        </div>

        <div class="deck-stage" id="deck-stage">
          <canvas id="deck-canvas"></canvas>

          <!-- SLIDE 1: Portada y Convocatoria en Vivo -->
          <article class="deck-slide active" id="slide-1">
            <div class="slide-header-row">
              <span class="slide-badge coral s-kicker">🔴 SESIÓN EN VIVO · MARTES 17 NOV</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fca5a5;">7:00 – 9:00 PM (HORA COLOMBIA)</span>
            </div>
            <h2 class="s-title">De la Teoría a la Producción: <span class="accent-lime">Flujos Alumnos en Vivo</span></h2>
            <p class="slide-lead">
              Bienvenidos a la quinta sesión del programa oficial WAPPY IA + Antigravity. Hoy conectaremos las ideas y diagramas elaborados por cada empresa participante, construyendo automatizaciones vivas que integran <strong>Google NotebookLM</strong> para soporte normativo sin alucinaciones y <strong>Google Flow</strong> para la creación audiovisual.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">🔀 TALLER EN VIVO</div>
                <h4>Flujos de Alumnos</h4>
                <p>Parametrización paso a paso de los esquemas diseñados por Xiomara Ardila, Gloria Quintero, Carolina Colorado y Maria Elena Obando.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">🎙️ CERO ALUCINACIÓN</div>
                <h4>Google NotebookLM</h4>
                <p>Carga de matrices legales, decretos y políticas corporativas para generar respuestas fundamentadas y podcasts ejecutivos.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">🎬 GENERACIÓN MULTIMEDIA</div>
                <h4>Google Flow Audiovisual</h4>
                <p>Automatización de videos cortos y piezas gráficas para divulgar lecciones aprendidas y pausas activas en la empresa.</p>
              </div>
            </div>
          </article>

          <!-- SLIDE 2: Puesta en Producción de Flujos Alumnos -->
          <article class="deck-slide" id="slide-2">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">PUESTA EN MARCHA EN VIVO</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">CASOS POR EMPRESA</span>
            </div>
            <h2 class="s-title">Parametrización en el <span class="accent-teal">Lienzo WAPPY (/tareas)</span></h2>
            <p class="slide-lead">
              Tomaremos los bocetos presentados y los traduciremos a nodos concretos en WAPPY. Configuraremos disparadores, compuertas lógicas y salidas coordinadas para cada necesidad empresarial identificada.
            </p>
            <div class="s-grid-3">
              <div class="s-card">
                <div class="sc-badge">1. CONTRATOS (XIOMARA)</div>
                <h4>Renovación &amp; PDFs</h4>
                <p>Automatización de alertas de vencimiento de contratos y validación documental mediante subagentes paralelos.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">2. SALUD (GLORIA)</div>
                <h4>Exámenes Periódicos</h4>
                <p>Flujo lineal de recepción de conceptos médicos, clasificación de aptitud laboral y matriz sociodemográfica.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">3. FLOTA (CAROLINA)</div>
                <h4>Control de Vehículos</h4>
                <p>Seguimiento al Plan Estratégico de Seguridad Vial (PESV), SOAT, tecnomecánica y mantenimiento preventivo.</p>
              </div>
            </div>
          </article>

          <!-- SLIDE 3: Google NotebookLM: El Cerebro Normativo -->
          <article class="deck-slide" id="slide-3">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">INTELIGENCIA NORMATIVA SEGURA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">GROUNDING CONTEXTUAL</span>
            </div>
            <h2 class="s-title">Google NotebookLM: <span class="accent-lime">0% Alucinación Normativa</span></h2>
            <p class="slide-lead">
              En SG-SST una alucinación jurídica puede acarrear sanciones de cientos de salarios mínimos. <strong>Google NotebookLM</strong> opera exclusivamente sobre las fuentes suministradas (Decreto 1072, Resolución 0312, GTC 45), garantizando respuestas con citas textuales y verificables.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">📚 FUENTES ANCLADAS</div>
                <h4>Grounding Estricto</h4>
                <p>El modelo no inventa artículos ni números de decretos. Si una información no está presente en los documentos cargados, declara explícitamente su ausencia.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">🔗 CITAS AUDITABLES</div>
                <h4>Trazabilidad Total</h4>
                <p>Cada respuesta incluye números de página y fragmentos exactos de la norma, listos para adjuntar en descargos o auditorías del Ministerio de Trabajo.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">🏢 MULTI-EMPRESA</div>
                <h4>Carpetas Privadas</h4>
                <p>Aislamiento total de información entre empresas: las políticas y actas de una compañía nunca se mezclan con las de otra.</p>
              </div>
            </div>
          </article>

          <!-- SLIDE 4: Generación de Podcasts SST a 2 Voces -->
          <article class="deck-slide" id="slide-4">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">DIVULGACIÓN PEDAGÓGICA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">AUDIO DE ALTO IMPACTO</span>
            </div>
            <h2 class="s-title">Podcasts SST a 2 Voces &amp; <span class="accent-teal">Resúmenes Ejecutivos</span></h2>
            <p class="slide-lead">
              Nadie lee un manual de 80 páginas. Con NotebookLM convertimos extensas políticas de seguridad en <strong>conversaciones dinámicas de audio</strong> entre dos especialistas que explican los puntos críticos en lenguaje ameno para operarios y directivos.
            </p>
            <div class="s-grid-3">
              <div class="s-card">
                <div class="sc-badge">🎙️ FORMATO AUDIO</div>
                <h4>Cápsulas de 5 a 10 Min</h4>
                <p>Dos voces con entonación natural analizan un riesgo específico, debaten medidas de control y recomiendan buenas prácticas.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">📱 DIFUSIÓN DIRECTA</div>
                <h4>WhatsApp &amp; Intranet</h4>
                <p>Los audios se envían directamente a los grupos de trabajo para que los colaboradores los escuchen antes de iniciar su jornada laboral.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">📊 RESUMEN EJECUTIVO</div>
                <h4>Fichas para Gerencia</h4>
                <p>NotebookLM extrae simultáneamente un resumen de 1 página con indicadores clave para la Alta Dirección.</p>
              </div>
            </div>
          </article>

          <!-- SLIDE 5: Google Flow: Producción Audiovisual -->
          <article class="deck-slide" id="slide-5">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">MULTIMEDIA EN TIEMPO RÉCORD</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">GOOGLE FLOW &amp; ESTUDIO AUDIOVISUAL</span>
            </div>
            <h2 class="s-title">Google Flow: <span class="accent-lime">Micro-Cápsulas de 3.5 Minutos</span></h2>
            <p class="slide-lead">
              Conectamos WAPPY con herramientas audiovisuales de Google para producir videos de formación en seguridad vial, orden y aseo o ergonomía en cuestión de minutos, con avatares 3D y subtítulos sincronizados.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">🎬 GUIÓN AUTOMÁTICO</div>
                <h4>Estructura Pedagógica</h4>
                <p>El agente genera el guión en 3 actos: Gancho visual (15s), Desarrollo técnico normativo (2 min) y Llamado a la acción (45s).</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">🎨 ESTILO WAPPY</div>
                <h4>Identidad Gráfica</h4>
                <p>Animaciones con la paleta oficial (#c7f303 verde lima, #0d9488 turquesa), Tenshi 3D y tipografías legibles en dispositivos móviles.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">⏱️ RENDER DETERMINISTA</div>
                <h4>Exportación MP4</h4>
                <p>Generación de archivos de video listos para proyectar en pantallas corporativas o compartir en estados de redes sociales.</p>
              </div>
            </div>
          </article>

          <!-- SLIDE 6: Claves API Independientes y Paralelismo -->
          <article class="deck-slide" id="slide-6">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">INFRAESTRUCTURA &amp; ROBUSTEZ</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">COMPROMISO FÉLIX BEDOYA</span>
            </div>
            <h2 class="s-title">Claves API Independientes: <span class="accent-teal">Cero Bloqueos</span></h2>
            <p class="slide-lead">
              Cumpliendo el compromiso acordado en la Clase 4, WAPPY asigna claves API únicas a cada proceso automatizado. Esto garantiza que un flujo pesado (ej. auditoría masiva de PDFs) no bloquee los demás procesos de la empresa.
            </p>
            <div class="s-grid-3">
              <div class="s-card">
                <div class="sc-badge">🔑 AISLAMIENTO TOTAL</div>
                <h4>Claves por Proceso</h4>
                <p>Cada automatización cuenta con su propio token. Si una tarea alcanza temporalmente un límite, las demás continúan operando normalmente.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">⚡ EJECUCIÓN PARALELA</div>
                <h4>Flujos Concurrentes</h4>
                <p>Posibilidad de ejecutar inspecciones de EPP, matrices legales y seguimiento médico al mismo tiempo sin colisiones de memoria.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">📈 TELEMETRÍA DETALLADA</div>
                <h4>Consumo por Tarea</h4>
                <p>Monitoreo exacto de cuántos tokens y llamadas consume cada departamento de la organización para control presupuestal.</p>
              </div>
            </div>
          </article>

          <!-- SLIDE 7: Conectores Workspace: Drive, Gmail & Calendar -->
          <article class="deck-slide" id="slide-7">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">INTEGRACIÓN CON GOOGLE WORKSPACE</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">ECOSISTEMA NATIVO WAPPY</span>
            </div>
            <h2 class="s-title">Conectores Workspace: <span class="accent-lime">Drive, Gmail &amp; Calendar</span></h2>
            <p class="slide-lead">
              Tenshi actúa como el puente agéntico que sincroniza el trabajo de WAPPY con las herramientas cotidianas de tu equipo de trabajo, cerrando el ciclo administrativo de forma automática.
            </p>
            <div class="s-grid-3">
              <div class="s-card glow-lime">
                <div class="sc-badge">📁 GOOGLE DRIVE</div>
                <h4>Gestor Documental</h4>
                <p>Carpetas inteligentes que clasifican conceptos médicos, certificados de inspección y actas de comités automáticamente.</p>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">✉️ GMAIL CORPORATIVO</div>
                <h4>Alertas Formales</h4>
                <p>Envío de correos automáticos con copias ocultas, plantillas personalizadas y archivos adjuntos generados en el flujo.</p>
              </div>
              <div class="s-card glow-cyan">
                <div class="sc-badge">📅 GOOGLE CALENDAR</div>
                <h4>Agenda de Inspecciones</h4>
                <p>Programación automática de auditorías periódicas, vencimientos de licencias y reuniones de COPASST con recordatorios.</p>
              </div>
            </div>
          </article>

          <!-- SLIDE 8: Auditoría y Mitigación de Riesgos en Tiempo Real -->
          <article class="deck-slide" id="slide-8">
            <div class="slide-header-row">
              <span class="slide-badge teal s-kicker">CONTROL OPERATIVO RIGUROSO</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">ESTÁNDARES MÍNIMOS RESOLUCIÓN 0312</span>
            </div>
            <h2 class="s-title">Auditoría en Tiempo Real &amp; <span class="accent-teal">Centro de Control Kanban</span></h2>
            <p class="slide-lead">
              Las automatizaciones no operan a espaldas del responsable de SST. Todo hallazgo generado por un flujo DAG se registra en el <strong>Centro de Control Kanban</strong> para supervisión humana antes de su cierre definitivo.
            </p>
            <div class="s-grid-3">
              <div class="s-card">
                <div class="sc-badge">📋 ETAPAS KANBAN</div>
                <h4>Trazabilidad Visual</h4>
                <p>Estados claros: Pendiente por Revisión, En Ejecución, Requiere Soporte Técnico, y Cerrado con Evidencia Documental.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">🛡️ FIRMA DIGITAL</div>
                <h4>Responsabilidad Técnica</h4>
                <p>El profesional de SST valida las acciones correctoras con su firma digital y número de licencia antes de archivar el caso.</p>
              </div>
              <div class="s-card">
                <div class="sc-badge">📊 INDICADORES SG-SST</div>
                <h4>Métricas en Vivo</h4>
                <p>Cálculo automático de tasas de accidentalidad, porcentaje de cumplimiento de capacitaciones y cobertura de EPP.</p>
              </div>
            </div>
          </article>

          <!-- SLIDE 9: Checklist para la Sesión en Vivo -->
          <article class="deck-slide" id="slide-9">
            <div class="slide-header-row">
              <span class="slide-badge lime s-kicker">PREPARACIÓN OBLIGATORIA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#94a3b8;">REQUISITOS PARA APROVECHAR AL 100%</span>
            </div>
            <h2 class="s-title">Checklist Previo para la <span class="accent-lime">Clase 5 en Vivo</span></h2>
            <p class="slide-lead">
              Para garantizar que puedas implementar tu flujo durante las 2 horas de taller en vivo, asegúrate de tener listos estos 4 elementos antes de iniciar:
            </p>
            <div class="s-grid-2">
              <div class="s-card glow-lime">
                <div class="sc-badge">✅ REQUISITOS TÉCNICOS</div>
                <h4>Conectividad y Cuentas</h4>
                <ul style="margin:8px 0 0 16px; font-size:13px; line-height:1.7; color:#e2e8f0;">
                  <li>Sesión activa en <strong>WAPPY IA</strong> (<a href="https://app.wappy.club" target="_blank" style="color:#c7f303;">app.wappy.club</a>).</li>
                  <li>Google Antigravity abierto con proyecto de la empresa configurado.</li>
                  <li>Acceso a Google Meet: <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" style="color:#5eead4;">meet.google.com/yxv-gyhv-ron</a>.</li>
                </ul>
              </div>
              <div class="s-card glow-teal">
                <div class="sc-badge">📄 MATERIAL EMPRESARIAL</div>
                <h4>Documentos del Flujo</h4>
                <ul style="margin:8px 0 0 16px; font-size:13px; line-height:1.7; color:#e2e8f0;">
                  <li>Diagrama o borrador escrito con los 4 pasos de la automatización deseada.</li>
                  <li>Archivo de prueba en Excel o PDF representativo (sin datos ultrasensibles).</li>
                  <li>Token de API (si tu software lo permite) o credenciales de prueba.</li>
                </ul>
              </div>
            </div>
          </article>

          <!-- SLIDE 10: Espacio de Preguntas y Retroalimentación -->
          <article class="deck-slide" id="slide-10">
            <div class="slide-header-row">
              <span class="slide-badge coral s-kicker">🔴 EN VIVO AHORA</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fecaca;">SALA DE CONFERENCIA ABIERTA</span>
            </div>
            <h2 class="s-title">¡Nos Vemos en la Sala! <span class="accent-lime">Google Meet Listo</span></h2>
            <p class="slide-lead">
              Haz clic en el botón principal para ingresar a la sala en vivo. El Ing. Félix Bedoya y el equipo de soporte técnico estarán listos para resolver dudas puntuales de tu flujo empresarial.
            </p>
            <div style="margin-top:24px; text-align:center;">
              <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener" class="btn btn-primary" style="font-size:16px; padding:16px 36px; background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <span>🔴 Ingresar a Google Meet (meet.google.com/yxv-gyhv-ron) →</span>
              </a>
            </div>
            <div style="margin-top:20px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
              <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener" class="btn btn-secondary">
                <span>📅 Agendar en Google Calendar</span>
              </a>
              <a href="/clase4" class="btn btn-secondary" style="border-color:rgba(199,243,3,0.4); color:#c7f303;">
                <span>⬅️ Repasar Grabación Clase 4</span>
              </a>
            </div>
          </article>

        </div>
      </div>
    </section>

    <!-- ===========================================================
         SIMULADOR DE TOKENS EN TIEMPO REAL
         =========================================================== -->
    <section class="simulator-section" aria-labelledby="sim-title">
      <div class="sim-container">
        <span class="slide-badge lime">HERRAMIENTA DIDÁCTICA INTERACTIVA</span>
        <h2 class="sim-title" id="sim-title">Simulador de Tokens para NotebookLM &amp; Flujos DAG</h2>
        <p class="sim-desc">
          Calcula la longitud en tokens de los documentos normativos o prompts que planeas conectar a Google NotebookLM. Recuerda que NotebookLM admite fuentes extensas sin costo adicional de tokens por consulta.
        </p>

        <div class="sim-box">
          <textarea id="token-live-input" class="sim-textarea" rows="3" oninput="updateTokenSimulator()" placeholder="Escribe aquí tu prompt para NotebookLM o resumen de norma...">Actúa como Especialista en SG-SST en Google NotebookLM. Analiza el Decreto 1072 de 2015 y la Resolución 0312 de 2019. Extrae los estándares mínimos obligatorios para una empresa de 45 trabajadores con nivel de riesgo III.</textarea>

          <div class="sim-stats-row">
            <span class="sim-badge" id="token-stats-badge">Calculando tokens...</span>
            <span style="font-size:12px; color:#94a3b8; font-family:var(--font-mono);">MODELO: GOOGLE NOTEBOOKLM / GEMINI FLASH</span>
          </div>

          <div class="sim-output-wrap" id="token-pills-output">
            <!-- Chips de tokens generados dinámicamente -->
          </div>
        </div>
      </div>
    </section>

    <!-- ===========================================================
         PROMPTS COPIABLES DE LA CLASE 5
         =========================================================== -->
    <section class="prompts-section" id="prompts" aria-labelledby="prompts-title">
      <div class="prompts-container">
        <div class="prompts-header">
          <span class="slide-badge lime">PLANTILLAS CONVERSACIONALES DE ALTO IMPACTO</span>
          <h2 class="prompts-title" id="prompts-title">5 Prompts Maestros de la Clase 5 para NotebookLM &amp; Google Flow</h2>
          <p class="prompts-lead">
            Utiliza estas instrucciones para extraer citas normativas exactas, diseñar guiones de podcasts a 2 voces y parametrizar videos cortos de capacitación.
          </p>
        </div>

        <div class="prompt-cards-grid">
          <!-- Prompt 1 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag lime">NOTEBOOKLM / NORMAS</span>
              <h4>1. Generador de Fuentes Estructuradas para Google NotebookLM</h4>
            </div>
            <p class="p-desc">Organiza reglamentos, matrices y decretos en bloques temáticos para alimentar un cuaderno sin sobrecargar el contexto.</p>
            <div class="p-code-box" id="prompt-p1">Actúa como Curador Documental SG-SST para Google NotebookLM. Voy a entregarte la normativa y políticas de seguridad de mi empresa [Nombre de la Empresa].

Tu tarea es preparar las fuentes de información:
1. Divide el contenido en 3 cuadernos especializados: Marco Normativo Nacional (Decretos/Resoluciones), Procedimientos Operativos Específicos (Trabajo en Alturas, Químicos, LOTO), y Registros Históricos de la Empresa (Actas de COPASST, Informes de Accidentalidad).
2. Asegúrate de incluir encabezados claros con fecha de emisión, entidad emisora y ámbito de aplicación para facilitar las citas textuales de NotebookLM.
3. Formula 5 preguntas de prueba de alta complejidad técnica para verificar que el cuaderno responda con 0% de alucinación citando los números de página exactos.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p1', this)">📋 Copiar Prompt al Portapapeles</button>
          </article>

          <!-- Prompt 2 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag teal">PODCAST A 2 VOCES</span>
              <h4>2. Diseñador de Guiones para Podcasts SST (Estilo NotebookLM)</h4>
            </div>
            <p class="p-desc">Genera una conversación dinámica y formativa entre dos especialistas para divulgar lecciones aprendidas de seguridad.</p>
            <div class="p-code-box" id="prompt-p2">Actúa como Director Pedagógico Audiovisual en WAPPY IA. Necesito un guión de audio a dos voces (Locutor A: Especialista Técnico riguroso; Locutor B: Supervisor de Campo cercano y práctico) con duración de 6 minutos.

Tema del podcast: [Describe el tema, ej: Peligro biomecánico y levantamiento de cargas en bodega].

Estructura de la conversación:
- Minuto 0 a 1: Gancho de impacto relatando una situación cotidiana en el trabajo y su impacto en la salud lumbar.
- Minuto 1 a 4: Diálogo ágil donde el técnico explica los límites de carga permitidos en Colombia (Resolución 2400) y el supervisor comparte trucos prácticos para usar ayudas mecánicas.
- Minuto 4 a 6: Reflexión final con 3 reglas de oro inolvidables y llamado a reportar condiciones inseguras en WAPPY.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p2', this)">📋 Copiar Prompt al Portapapeles</button>
          </article>

          <!-- Prompt 3 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag cyan">GOOGLE FLOW / VÍDEO</span>
              <h4>3. Prompts Audiovisuales para Google Flow (Micro-Cápsulas 3.5 Min)</h4>
            </div>
            <p class="p-desc">Configura la narrativa visual, planos y efectos para crear un video animado con Tenshi y el avatar de Félix Bedoya.</p>
            <div class="p-code-box" id="prompt-p3">Actúa como Productor de Video en WAPPY IA utilizando Google Flow y el sistema de animación determinista a 60 FPS.

Necesito producir un micro-video de capacitación de 3.5 minutos en formato vertical 9:16 (1080x1920) sobre: [Indica el tema, ej: Protocolo de Bloqueo y Etiquetado LOTO].

Genera los prompts visuales para cada escena:
1. Escena 1 (0-20s): Plano con avatar de Félix Bedoya en zona superior y tarjeta de alerta roja con candado LOTO animado en el pecho.
2. Escena 2 (20s-2m): Cortina oscura a pantalla completa con esquema de 5 pasos numerados que se iluminan en verde lima (#c7f303) al nombrarse.
3. Escena 3 (2m-3.5m): Regreso de Tenshi 3D con aureola dorada, resumen de las 3 compuertas de seguridad y botón animado hacia wappy.club.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p3', this)">📋 Copiar Prompt al Portapapeles</button>
          </article>

          <!-- Prompt 4 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag amber">CONECTORES WORKSPACE</span>
              <h4>4. Enrutador de Alertas Gmail con Clasificación Automática</h4>
            </div>
            <p class="p-desc">Clasifica correos de incidentes o reportes de actos inseguros y envía alertas prioritarias según su nivel de severidad.</p>
            <div class="p-code-box" id="prompt-p4">Actúa como Agente de Triaje de Incidentes SG-SST conectado a Gmail en Google Antigravity. Cuando ingrese un correo a la cuenta de seguridad y salud en el trabajo:

1. Analiza el asunto y cuerpo del mensaje buscando palabras clave de riesgo: atrapamiento, caída de altura, quemadura química, fuga de gas, o amago de incendio.
2. Si la severidad es ALTA: Redacta un correo urgente con asunto "[URGENTE SG-SST] Incidente Crítico Reportado", marca con etiqueta roja y programa una reunión en Google Calendar para los brigadistas en los próximos 15 minutos.
3. Si la severidad es BAJA: Registra el caso en la matriz de actos y condiciones inseguras y responde al colaborador agradeciendo su reporte con un mensaje cordial de retroalimentación.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p4', this)">📋 Copiar Prompt al Portapapeles</button>
          </article>

          <!-- Prompt 5 -->
          <article class="p-card">
            <div class="p-header">
              <span class="p-tag purple">PARAMETRIZADOR DAG</span>
              <h4>5. Parametrizador de Flujos DAG con Claves API Independientes</h4>
            </div>
            <p class="p-desc">Estructura un flujo multi-proceso en WAPPY con llaves API dedicadas para evitar colisiones y cuellos de botella.</p>
            <div class="p-code-box" id="prompt-p5">Actúa como Arquitecto de Sistemas de WAPPY IA. Deseo configurar una automatización en /tareas con dos procesos concurrentes:
- Proceso A: Auditoría diaria de entrega de EPP (Lectura en H5 -> Condición Si/No -> Alerta).
- Proceso B: Verificación semanal de habilitación médica de proveedores de salud ocupacional.

Configura la arquitectura técnica:
1. Asigna identificadores y claves API independientes para cada flujo (wpy_proc_epp_... y wpy_proc_med_...).
2. Establece límites de concurrencia y políticas de reintento automático ante fallas de red.
3. Diseña el webhook de salida unificado para consolidar las métricas de ambos flujos en el panel de control de WAPPY.</div>
            <button type="button" class="btn btn-copy" onclick="copyPromptText('prompt-p5', this)">📋 Copiar Prompt al Portapapeles</button>
          </article>
        </div>
      </div>
    </section>

    <!-- ===========================================================
         GUÍA DE PREPARACIÓN PASO A PASO
         =========================================================== -->
    <section class="guide-section" id="guia-pasos" aria-labelledby="guide-title">
      <div class="guide-container">
        <span class="slide-badge lime">HOJA DE RUTA PARA LA CLASE 5</span>
        <h2 class="guide-title" id="guide-title">Guía de Preparación Previa para la Sesión en Vivo</h2>
        <p class="guide-desc">Sigue estos 4 pasos antes de las 7:00 PM para llegar con todo listo a la sala virtual y aprovechar al máximo el taller práctico.</p>

        <div class="guide-blocks-grid">
          <div class="g-block">
            <div class="g-num">1</div>
            <h4>Verifica tu Conexión a WAPPY</h4>
            <p>Ingresa a <a href="https://app.wappy.club" target="_blank" style="color:#c7f303;">app.wappy.club</a> y confirma que puedas acceder a la sección de Tareas (/tareas). Revisa el catálogo de flujos preestablecidos.</p>
          </div>
          <div class="g-block">
            <div class="g-num">2</div>
            <h4>Prepara tu Diagrama de Flujo</h4>
            <p>Ten a la mano el boceto en papel, diagrama de Lucidchart o descripción paso a paso de la automatización que tu empresa necesita resolver con urgencia.</p>
          </div>
          <div class="g-block">
            <div class="g-num">3</div>
            <h4>Reúne Archivos de Prueba</h4>
            <p>Guarda en una carpeta accesible 2 o 3 archivos representativos (un PDF de contrato, un Excel de nómina o un certificado médico) sin datos personales confidenciales.</p>
          </div>
          <div class="g-block">
            <div class="g-num">4</div>
            <h4>Entra Puntual a Google Meet</h4>
            <p>La sala virtual abre a las 6:50 PM. Conéctate a través de <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" style="color:#5eead4;">meet.google.com/yxv-gyhv-ron</a> para probar tu micrófono y cámara antes de arrancar.</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- ===========================================================
       POPUP / MODAL DE NOTAS Y CHECKLIST PREVIO (4 PESTAÑAS)
       =========================================================== -->
  <div class="notes-modal-backdrop" id="notes-modal" onclick="handleBackdropClick(event)">
    <div class="notes-modal-window" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
      <div class="notes-modal-header">
        <div class="notes-modal-title-wrap">
          <h3 id="notes-modal-title">📋 Checklist, Temario &amp; Requisitos · Clase V en Vivo</h3>
          <p>Fecha: Martes 17 de Noviembre de 2026 · 7:00 – 9:00 PM · Docente: Ing. Félix Bedoya · Google Meet</p>
        </div>
        <button type="button" class="btn-close-modal" onclick="closeNotesModal()">✕ Cerrar Ventana</button>
      </div>

      <div class="notes-tabs-bar">
        <div class="notes-tab-group">
          <button type="button" class="notes-tab-btn active" id="ntab-all" onclick="switchNotesTab('all')">🌟 Ver Todo</button>
          <button type="button" class="notes-tab-btn" id="ntab-resumen" onclick="switchNotesTab('resumen')">📌 Temario Oficial</button>
          <button type="button" class="notes-tab-btn" id="ntab-pasos" onclick="switchNotesTab('pasos')">✅ Tareas Previas Requeridas</button>
          <button type="button" class="notes-tab-btn" id="ntab-detalles" onclick="switchNotesTab('detalles')">🛠️ Herramientas &amp; Accesos</button>
        </div>
      </div>

      <div class="notes-modal-body">
        <!-- Tira de Enlaces Oficiales -->
        <div class="n-links-strip">
          <div style="font-size:12.5px; font-weight:800; color:#5eead4;">
            📎 Enlaces Oficiales de la Clase 5:
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener" class="n-doc-btn" style="border-color:#ef4444; color:#fca5a5; background:rgba(239,68,68,0.18);">
              🔴 Sala en Vivo Google Meet
            </a>
            <a href="https://calendar.app.google/HKPNhtmxygTfn7NBA" target="_blank" rel="noopener" class="n-doc-btn">
              📅 Agendar en Google Calendar
            </a>
            <a href="/clase4" class="n-doc-btn" style="border-color:#c7f303; color:#ecfccb;">
              ⬅️ Ver Grabación Clase 4
            </a>
          </div>
        </div>

        <!-- Pestaña 1: Temario Oficial -->
        <div class="notes-pane active" data-npane="resumen">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            📌 1. Temario Maestro de la Clase 5
          </div>
          <div class="s-grid-2">
            <div class="s-card glow-lime n-section-card">
              <h4>🔀 Puesta en Marcha de Flujos DAG de Alumnos</h4>
              <p>Revisión en vivo de los bocetos creados por las empresas participantes. Construcción paso a paso de los nodos en el Lienzo WAPPY (/tareas) con compuertas Pre-IA deterministas.</p>
            </div>
            <div class="s-card glow-teal n-section-card">
              <h4>🎙️ Google NotebookLM: Cero Alucinación</h4>
              <p>Conexión de matrices legales, decretos y políticas corporativas. Generación de podcasts a 2 voces y resúmenes ejecutivos verificables con número de página y cita normativa.</p>
            </div>
            <div class="s-card glow-cyan n-section-card">
              <h4>🎬 Google Flow Audiovisual &amp; Micro-Cápsulas</h4>
              <p>Producción de videos de capacitación en seguridad y salud de 3.5 minutos a 60 FPS con Tenshi 3D y el avatar del Ing. Félix Bedoya para divulgación masiva.</p>
            </div>
            <div class="s-card glow-purple n-section-card">
              <h4>🔑 Claves API Independientes &amp; Conectores</h4>
              <p>Asignación de credenciales únicas por proceso para evitar colisiones entre flujos concurrentes. Integración nativa con Google Drive, Gmail y Google Calendar.</p>
            </div>
          </div>
        </div>

        <!-- Pestaña 2: Tareas Previas Requeridas -->
        <div class="notes-pane active" data-npane="pasos">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            ✅ 2. Compromisos Acordados en Clase 4 para Traer Listos
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(199,243,3,0.18); color:#c7f303; border-color:rgba(199,243,3,0.5);">👤 FELIX BEDOYA</span>
            <div><strong>1. Optimizar Procesos:</strong> Compartir con los alumnos guiones y métodos específicos para optimizar el rendimiento y consumo de procesos en Antigravity.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(45,212,191,0.18); color:#2dd4bf; border-color:rgba(45,212,191,0.5);">👤 XIOMARA ARDILA</span>
            <div><strong>2. Credenciales de Nómina:</strong> Solicitar los credenciales de API o token administrativo para conectar el software de nómina (Sigo/Aportes) a la automatización.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(139,92,246,0.18); color:#c4b5fd; border-color:rgba(139,92,246,0.5);">👤 EL GRUPO</span>
            <div><strong>3. Diagrama de Flujo:</strong> Esbozar un diagrama o dibujo del flujo de trabajo requerido por su empresa para parametrizarlo en el Lienzo WAPPY.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(199,243,3,0.18); color:#c7f303; border-color:rgba(199,243,3,0.5);">👤 FELIX BEDOYA</span>
            <div><strong>4. Enlace ReTHUS:</strong> Compartir el enlace web oficial para verificar la habilitación de médicos tratantes en Colombia.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(199,243,3,0.18); color:#c7f303; border-color:rgba(199,243,3,0.5);">👤 FELIX BEDOYA</span>
            <div><strong>5. Claves API en WAPPY:</strong> Asignar una clave única a cada proceso en WAPPY para permitir ejecución paralela sin bloqueos de cuotas.</div>
          </div>

          <div class="n-task-item n-step-item">
            <span class="n-task-owner" style="background:rgba(45,212,191,0.18); color:#2dd4bf; border-color:rgba(45,212,191,0.5);">👤 XIOMARA ARDILA</span>
            <div><strong>6. Automatizar PDFs:</strong> Utilizar Antigravity con subagentes paralelos para gestionar la renovación de contratos digitales.</div>
          </div>
        </div>

        <!-- Pestaña 3: Herramientas & Accesos Necesarios -->
        <div class="notes-pane active" data-npane="detalles">
          <div style="font-size:14px; font-weight:900; color:var(--lime); text-transform:uppercase; letter-spacing:0.06em;">
            🛠️ 3. Herramientas &amp; Accesos Recomendados
          </div>

          <div class="n-detail-card n-section-card">
            <h4><span>1. WAPPY IA Cloud (/tareas)</span> <span class="n-ts-badge">app.wappy.club</span></h4>
            <p>Plataforma central donde operan los 55 flujos preestablecidos y el Lienzo DAG interactivo. Requiere cuenta activa para guardar y ejecutar flujos en servidor.</p>
          </div>

          <div class="n-detail-card n-section-card">
            <h4><span>2. Google Antigravity &amp; Gemini 3.8</span> <span class="n-ts-badge">Local / Cloud</span></h4>
            <p>Entorno de desarrollo agéntico para crear herramientas MCP, orquestar subagentes en paralelo y procesar lotes masivos de PDFs o bases de datos.</p>
          </div>

          <div class="n-detail-card n-section-card">
            <h4><span>3. Google NotebookLM</span> <span class="n-ts-badge">notebooklm.google.com</span></h4>
            <p>Herramienta gratuita de Google para análisis de documentos extensos con citas auditables y generación automática de podcasts a 2 voces.</p>
          </div>

          <div class="n-detail-card n-section-card">
            <h4><span>4. Conexión Google Meet</span> <span class="n-ts-badge">meet.google.com/yxv-gyhv-ron</span></h4>
            <p>Sala de videoconferencia de alta definición con soporte de audio, cámara y compartición de pantalla para recibir mentoría en directo.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ===========================================================
       PIE DE PÁGINA OFICIAL
       =========================================================== -->
  <footer class="app-footer" role="contentinfo">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="{cat_logo}" alt="WAPPY Logo" class="f-logo">
          <h3>WAPPY <span>IA</span> · SOMOS SST</h3>
          <p>Ecosistema agéntico de automatización, inteligencia normativa y seguridad en el trabajo para Colombia e Iberoamérica.</p>
        </div>
        <div class="footer-links">
          <h4>Navegación del Curso</h4>
          <a href="/cursowappy01">🎓 Temario General del Curso</a>
          <a href="/clase1">✅ Clase 1: Fundamentos &amp; Antigravity</a>
          <a href="/clase2">✅ Clase 2: Documentos Vivos &amp; MCP</a>
          <a href="/clase3">✅ Clase 3: Subagentes &amp; Control QR</a>
          <a href="/clase4">✅ Clase 4: Flujos DAG &amp; Lienzo WAPPY</a>
          <a href="/clase5">🔴 Clase 5: Próxima Sesión en Vivo</a>
        </div>
        <div class="footer-links">
          <h4>Plataforma &amp; Soporte</h4>
          <a href="https://wappy.club" target="_blank" rel="noopener">wappy.club</a>
          <a href="https://app.wappy.club" target="_blank" rel="noopener">Lienzo WAPPY (/tareas)</a>
          <a href="https://meet.google.com/yxv-gyhv-ron" target="_blank" rel="noopener">Sala Google Meet</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 WAPPY IA · SOMOS SST · Desarrollado por Ing. Félix Bedoya y Agencia WAPPY.</p>
        <p>Todos los derechos reservados. Material educativo y de entrenamiento profesional.</p>
      </div>
    </div>
  </footer>

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

# Write client/public/clase5.html
pub_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/public/clase5.html'
with open(pub_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {pub_path} ({len(html_content)} bytes)")

# Write Desktop/clase5.html
desktop_path = '/Users/venta/Desktop/clase5.html'
with open(desktop_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"Generated {desktop_path} ({len(html_content)} bytes)")
