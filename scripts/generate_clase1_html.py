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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>Clase 1: Introducción a la IA, WAPPY & Antigravity | Ecosistema Autónomo SST</title>
  <meta name="description" content="Presentación interactiva y guía paso a paso de la Clase 1. Introducción a la IA (15 min), WAPPY y Antigravity, instalación, creación de proyectos, triggers, skills, NotebookLM, Drive y alimentación a WAPPY.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Fira+Code:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --lime: #c7f303;
      --lime-hover: #b5de02;
      --lime-glow: rgba(199, 243, 3, 0.35);
      --slate-950: #020617;
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

    /* Global reset preventing horizontal scroll */
    *, *::before, *::after {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      max-width: 100%;
      -webkit-font-smoothing: antialiased;
    }}

    html, body {{
      width: 100%;
      max-width: 100%;
      overflow-x: hidden !important;
      background-color: var(--bg);
      color: var(--slate-900);
      font-family: var(--font-ui);
      line-height: 1.5;
    }}

    body {{
      padding-bottom: 80px;
    }}

    a {{
      text-decoration: none;
      color: inherit;
    }}

    .wrap {{
      width: 100%;
      max-width: 1040px;
      margin: 0 auto;
      padding: 0 12px;
    }}

    @media (min-width: 640px) {{
      .wrap {{
        padding: 0 20px;
      }}
    }}

    /* ==========================================================================
       TOP LIVE BAR
       ========================================================================== */
    .top-live-bar {{
      background: linear-gradient(90deg, #042f2e 0%, #0f766e 50%, #042f2e 100%);
      color: #ffffff;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-align: center;
      flex-wrap: wrap;
      border-bottom: 1px solid rgba(94, 234, 212, 0.25);
    }}

    .live-pulse {{
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(239, 68, 68, 0.25);
      border: 1px solid #ef4444;
      color: #fecaca;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}

    .live-dot {{
      width: 6px;
      height: 6px;
      background-color: #ef4444;
      border-radius: 50%;
      box-shadow: 0 0 6px #ef4444;
      animation: pulse 1.5s infinite;
    }}

    @keyframes pulse {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.4; transform: scale(1.3); }}
    }}

    /* ==========================================================================
       FLOATING NAVBAR CAPSULE (RESPONSIVE)
       ========================================================================== */
    .nav-wrap {{
      position: sticky;
      top: 8px;
      z-index: 100;
      padding: 0 8px;
      margin-bottom: 12px;
    }}

    @media (min-width: 640px) {{
      .nav-wrap {{
        top: 12px;
        padding: 0 16px;
        margin-bottom: 16px;
      }}
    }}

    .nav-inner {{
      max-width: 1040px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
      border-radius: 16px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    @media (min-width: 640px) {{
      .nav-inner {{
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        border-radius: 20px;
      }}
    }}

    .nav-top-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }}

    @media (min-width: 640px) {{
      .nav-top-row {{
        width: auto;
        gap: 16px;
      }}
    }}

    .nav-logo {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .nav-logo img {{
      height: 24px;
      object-fit: contain;
    }}

    @media (min-width: 640px) {{
      .nav-logo img {{
        height: 28px;
      }}
    }}

    .nav-logo-text {{
      font-size: 13px;
      font-weight: 900;
      color: #042f2e;
      letter-spacing: -0.3px;
    }}

    .nav-view-toggles {{
      display: flex;
      width: 100%;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 12px;
      gap: 3px;
    }}

    @media (min-width: 640px) {{
      .nav-view-toggles {{
        width: auto;
      }}
    }}

    .toggle-btn {{
      flex: 1;
      border: none;
      background: transparent;
      padding: 7px 10px;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }}

    @media (min-width: 640px) {{
      .toggle-btn {{
        flex: initial;
        padding: 6px 14px;
      }}
    }}

    .toggle-btn.active {{
      background: #ffffff;
      color: #0f766e;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }}

    .nav-actions {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .btn-wappy-home {{
      font-size: 11px;
      font-weight: 700;
      color: #0f766e;
      padding: 5px 9px;
      border-radius: 8px;
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }}

    .btn-meet-nav {{
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff;
      font-size: 11.5px;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);
      white-space: nowrap;
    }}

    @media (min-width: 640px) {{
      .btn-meet-nav {{
        font-size: 12px;
        padding: 7px 14px;
      }}
    }}

    /* ==========================================================================
       SLIDE DECK PRESENTATION MODE (MOBILE OPTIMIZED)
       ========================================================================== */
    #presentation-mode {{
      display: block;
      margin-bottom: 24px;
      width: 100%;
    }}

    .deck-container {{
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
      color: #ffffff;
      width: 100%;
    }}

    @media (min-width: 640px) {{
      .deck-container {{
        border-radius: 24px;
      }}
    }}

    .deck-topbar {{
      background: #1e293b;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
    }}

    @media (min-width: 640px) {{
      .deck-topbar {{
        padding: 12px 20px;
      }}
    }}

    .deck-title {{
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .deck-counter {{
      background: #0d9488;
      color: #ffffff;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }}

    .deck-hint-kbd {{
      display: none;
    }}

    @media (min-width: 640px) {{
      .deck-hint-kbd {{
        display: block;
        font-size: 11px;
        color: #94a3b8;
      }}
    }}

    .deck-hint-touch {{
      display: block;
      font-size: 10.5px;
      color: #5eead4;
      font-weight: 600;
    }}

    @media (min-width: 640px) {{
      .deck-hint-touch {{
        display: none;
      }}
    }}

    .slide-viewport {{
      position: relative;
      min-height: 380px;
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      touch-action: pan-y;
      user-select: none;
    }}

    @media (min-width: 640px) {{
      .slide-viewport {{
        min-height: 480px;
        padding: 36px 32px;
      }}
    }}

    .slide {{
      display: none;
      animation: fadeInSlide 0.25s ease forwards;
    }}

    .slide.active {{
      display: block;
    }}

    @keyframes fadeInSlide {{
      from {{ opacity: 0; transform: translateY(6px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}

    .slide-badge {{
      display: inline-block;
      background: rgba(94, 234, 212, 0.15);
      border: 1px solid #5eead4;
      color: #5eead4;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 3px 9px;
      border-radius: 999px;
      margin-bottom: 10px;
      line-height: 1.2;
    }}

    .slide-badge.intro {{
      background: rgba(199, 243, 3, 0.15);
      border-color: #c7f303;
      color: #c7f303;
    }}

    .slide-badge.amber {{
      background: rgba(245, 158, 11, 0.15);
      border-color: #f59e0b;
      color: #fbbf24;
    }}

    .slide h2 {{
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 900;
      line-height: 1.3;
      color: #ffffff;
      margin-bottom: 8px;
      word-break: break-word;
    }}

    @media (min-width: 640px) {{
      .slide h2 {{
        font-size: 26px;
        margin-bottom: 12px;
      }}
    }}

    .slide-lead {{
      font-size: 12.5px;
      color: #cbd5e1;
      line-height: 1.45;
      margin-bottom: 14px;
    }}

    @media (min-width: 640px) {{
      .slide-lead {{
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 18px;
      }}
    }}

    .slide-content-grid {{
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }}

    @media (min-width: 640px) {{
      .slide-content-grid.two-cols {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }}
      .slide-content-grid.three-cols {{
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }}
      .slide-content-grid.four-cols {{
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }}
    }}

    @media (min-width: 1024px) {{
      .slide-content-grid.four-cols {{
        grid-template-columns: repeat(4, 1fr);
      }}
    }}

    .slide-card {{
      background: rgba(30, 41, 59, 0.75);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      padding: 12px 14px;
    }}

    .slide-card.highlight {{
      border-color: #5eead4;
      background: rgba(13, 148, 136, 0.18);
    }}

    .slide-card.lime-border {{
      border-color: #c7f303;
      background: rgba(199, 243, 3, 0.08);
    }}

    .slide-card h4 {{
      font-size: 13px;
      font-weight: 800;
      color: #5eead4;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      line-height: 1.3;
    }}

    .slide-card h4.lime {{
      color: #c7f303;
    }}

    .slide-card h4.amber {{
      color: #fbbf24;
    }}

    .slide-card p {{
      font-size: 11.5px;
      color: #cbd5e1;
      line-height: 1.4;
    }}

    @media (min-width: 640px) {{
      .slide-card p {{
        font-size: 12.5px;
      }}
    }}

    .slide-card code {{
      font-family: var(--font-code);
      background: rgba(0, 0, 0, 0.4);
      padding: 1px 4px;
      border-radius: 4px;
      color: #5eead4;
      font-size: 10.5px;
    }}

    /* Deck Controls (Touch-Friendly Responsive) */
    .deck-footer {{
      background: #1e293b;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-top: 1px solid #334155;
    }}

    @media (min-width: 640px) {{
      .deck-footer {{
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
      }}
    }}

    .deck-nav-btns {{
      display: flex;
      width: 100%;
      gap: 8px;
    }}

    @media (min-width: 640px) {{
      .deck-nav-btns {{
        width: auto;
      }}
    }}

    .btn-slide-nav {{
      flex: 1;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 700;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
      touch-action: manipulation;
    }}

    @media (min-width: 640px) {{
      .btn-slide-nav {{
        flex: initial;
        border-radius: 999px;
        padding: 8px 18px;
      }}
    }}

    .btn-slide-nav:hover:not(:disabled) {{
      background: #0d9488;
      border-color: #5eead4;
    }}

    .btn-slide-nav:disabled {{
      opacity: 0.3;
      cursor: not-allowed;
    }}

    .deck-meet-btn {{
      width: 100%;
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 800;
      padding: 10px 16px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
    }}

    @media (min-width: 640px) {{
      .deck-meet-btn {{
        width: auto;
        border-radius: 999px;
        padding: 8px 18px;
      }}
    }}

    .slide-progress-bar {{
      height: 4px;
      background: #334155;
      width: 100%;
    }}

    .slide-progress-fill {{
      height: 100%;
      background: linear-gradient(90deg, #0d9488 0%, #c7f303 100%);
      width: 8.33%;
      transition: width 0.3s ease;
    }}

    /* ==========================================================================
       HERO & GENERAL SECTIONS (GUIDE MODE)
       ========================================================================== */
    .hero {{
      background: linear-gradient(145deg, #042f2e 0%, #0f766e 60%, #115e59 100%);
      border-radius: 18px;
      padding: 22px 16px;
      color: #ffffff;
      margin-bottom: 20px;
      box-shadow: 0 10px 25px rgba(15, 118, 110, 0.15);
    }}

    @media (min-width: 640px) {{
      .hero {{
        border-radius: 24px;
        padding: 32px 24px;
      }}
    }}

    .hero-badge {{
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ccfbf1;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      padding: 3px 9px;
      border-radius: 999px;
      margin-bottom: 10px;
    }}

    .hero h1 {{
      font-family: var(--font-display);
      font-size: 21px;
      font-weight: 900;
      line-height: 1.25;
      color: #ffffff;
      margin-bottom: 8px;
      word-break: break-word;
    }}

    @media (min-width: 640px) {{
      .hero h1 {{
        font-size: 32px;
      }}
    }}

    .hero-sub {{
      font-size: 13px;
      color: #e6fffa;
      line-height: 1.45;
      margin-bottom: 16px;
    }}

    @media (min-width: 640px) {{
      .hero-sub {{
        font-size: 14.5px;
      }}
    }}

    .hero-meta-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }}

    @media (min-width: 640px) {{
      .hero-meta-grid {{
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }}
    }}

    .hero-meta-item {{
      background: rgba(0, 0, 0, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 8px 10px;
      border-radius: 10px;
    }}

    .hero-meta-label {{
      font-size: 10px;
      color: #a7f3d0;
      text-transform: uppercase;
      font-weight: 700;
    }}

    .hero-meta-val {{
      font-size: 12.5px;
      font-weight: 800;
      color: #ffffff;
      margin-top: 2px;
    }}

    .hero-cta-box {{
      background: rgba(255, 255, 255, 0.12);
      border: 1.5px solid #5eead4;
      border-radius: 14px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }}

    @media (min-width: 640px) {{
      .hero-cta-box {{
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }}
    }}

    .hero-cta-info h3 {{
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 2px;
    }}

    .hero-cta-info p {{
      font-size: 11.5px;
      color: #ccfbf1;
    }}

    .hero-cta-btn {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #ffffff;
      color: #042f2e;
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 900;
      padding: 10px 20px;
      border-radius: 999px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      white-space: nowrap;
    }}

    /* Synergistic Highlight */
    .synergy-card {{
      background: linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%);
      border: 2px solid #5eead4;
      border-radius: 16px;
      padding: 16px;
      margin: 16px 0;
    }}

    @media (min-width: 640px) {{
      .synergy-card {{
        border-radius: 20px;
        padding: 22px;
        margin: 20px 0;
      }}
    }}

    .synergy-grid {{
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 12px;
    }}

    @media (min-width: 640px) {{
      .synergy-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }}
    }}

    .synergy-box {{
      background: #ffffff;
      border-radius: 12px;
      padding: 14px;
      border: 1px solid #ccfbf1;
      box-shadow: 0 2px 6px rgba(15, 118, 110, 0.05);
    }}

    .synergy-box h4 {{
      font-size: 14px;
      font-weight: 800;
      color: var(--teal);
      margin-bottom: 4px;
    }}

    .synergy-box p {{
      font-size: 12px;
      color: var(--slate-700);
      line-height: 1.4;
    }}

    /* Section Headers */
    .sec-header {{
      margin-bottom: 12px;
      margin-top: 28px;
    }}

    .sec-tag {{
      display: inline-block;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      background: #ccfbf1;
      color: #0f766e;
      border: 1px solid #99f6e4;
      padding: 2px 7px;
      border-radius: 999px;
      margin-bottom: 4px;
    }}

    .sec-title {{
      font-family: var(--font-display);
      font-size: 19px;
      font-weight: 900;
      color: var(--slate-900);
      line-height: 1.25;
      word-break: break-word;
    }}

    @media (min-width: 640px) {{
      .sec-title {{
        font-size: 22px;
      }}
    }}

    /* Rules Grid */
    .rules-grid {{
      display: flex;
      flex-direction: column;
      gap: 10px;
    }}

    @media (min-width: 640px) {{
      .rules-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }}
    }}

    .rule-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-left: 4px solid var(--teal);
      border-radius: 14px;
      padding: 14px;
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
      margin-bottom: 4px;
      gap: 6px;
    }}

    .rule-title {{
      font-size: 13px;
      font-weight: 800;
      color: var(--slate-900);
    }}

    .rule-badge {{
      font-size: 8.5px;
      font-weight: 800;
      padding: 1.5px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      white-space: nowrap;
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
      font-size: 11.5px;
      color: var(--slate-700);
      line-height: 1.4;
    }}

    /* Step Cards */
    .step-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 16px;
      padding: 16px 14px;
      margin-bottom: 14px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }}

    @media (min-width: 640px) {{
      .step-card {{
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 16px;
      }}
    }}

    .step-header {{
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--slate-100);
      padding-bottom: 10px;
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
      gap: 6px;
    }}

    .step-pill {{
      background: #ccfbf1;
      color: #0f766e;
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 5px;
    }}

    .step-time {{
      font-size: 11.5px;
      color: var(--slate-600);
      font-weight: 600;
    }}

    .step-title {{
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 800;
      color: var(--slate-900);
      margin-bottom: 6px;
      word-break: break-word;
    }}

    @media (min-width: 640px) {{
      .step-title {{
        font-size: 17px;
      }}
    }}

    .step-desc {{
      font-size: 12.5px;
      color: var(--slate-700);
      line-height: 1.45;
      margin-bottom: 10px;
    }}

    .step-list {{
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-top: 8px;
    }}

    .step-list li {{
      font-size: 12px;
      color: var(--slate-700);
      padding-left: 16px;
      position: relative;
      line-height: 1.4;
    }}

    .step-list li::before {{
      content: "✓";
      position: absolute;
      left: 0;
      color: var(--teal);
      font-weight: 900;
      font-size: 11px;
    }}

    /* Copyable Code Box */
    .code-box {{
      background: #0f172a;
      color: #f8fafc;
      border-radius: 12px;
      overflow: hidden;
      margin: 10px 0;
      border: 1px solid #334155;
      width: 100%;
    }}

    .code-box-header {{
      background: #1e293b;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
    }}

    .code-box-title {{
      font-family: var(--font-code);
      font-size: 10.5px;
      font-weight: 600;
      color: #94a3b8;
    }}

    .btn-copy {{
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 5px;
      cursor: pointer;
    }}

    .code-content {{
      padding: 10px 12px;
      font-family: var(--font-code);
      font-size: 11px;
      line-height: 1.4;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      white-space: pre-wrap;
      word-break: break-all;
      color: #e2e8f0;
    }}

    /* Checklist */
    .check-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 16px;
      padding: 14px;
    }}

    .check-item {{
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--slate-100);
      cursor: pointer;
    }}

    .check-item:last-child {{
      border-bottom: none;
    }}

    .check-input {{
      width: 17px;
      height: 17px;
      accent-color: var(--teal);
      margin-top: 2px;
      flex-shrink: 0;
    }}

    .check-text h4 {{
      font-size: 12.5px;
      font-weight: 700;
      color: var(--slate-900);
    }}

    .check-text p {{
      font-size: 11px;
      color: var(--slate-600);
    }}

    /* Resources Box */
    .resources-box {{
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 16px;
      padding: 18px 14px;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 20px;
    }}

    @media (min-width: 640px) {{
      .resources-box {{
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 24px;
      }}
    }}

    .res-left h3 {{
      font-size: 15px;
      font-weight: 800;
      margin-bottom: 3px;
    }}

    .res-left p {{
      font-size: 11.5px;
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
      padding: 9px 16px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }}

    footer {{
      margin-top: 32px;
      text-align: center;
      font-size: 11px;
      color: var(--slate-500);
      padding: 16px 0;
      border-top: 1px solid var(--slate-200);
    }}
  </style>
</head>
<body>

  <!-- TOP LIVE BAR -->
  <div class="top-live-bar">
    <span class="live-pulse"><span class="live-dot"></span> EN VIVO HOY</span>
    <span>Martes 20 Oct · 7:00 – 9:00 PM (Hora Col, GMT-5)</span>
  </div>

  <!-- FLOATING NAVBAR (RESPONSIVE CAPSULE) -->
  <div class="nav-wrap">
    <div class="nav-inner">
      <div class="nav-top-row">
        <div class="nav-logo">
          {"<img src='" + logo_wappy + "' alt='WAPPY'>" if logo_wappy else "<span class='nav-logo-text'>WAPPY IA</span>"}
        </div>
        <div class="nav-actions">
          <a href="https://wappy.club" class="btn-wappy-home" title="Ir a la plataforma WAPPY">
            <span>←</span> <span>WAPPY</span>
          </a>
          <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn-meet-nav">
            <span>📹</span> <span>Meet</span>
          </a>
        </div>
      </div>
      
      <div class="nav-view-toggles">
        <button class="toggle-btn active" id="btn-view-deck" onclick="setViewMode('deck')">
          <span>🖥️</span> <span>Presentación</span>
        </button>
        <button class="toggle-btn" id="btn-view-guide" onclick="setViewMode('guide')">
          <span>📖</span> <span>Guía Completa</span>
        </button>
      </div>
    </div>
  </div>

  <div class="wrap">

    <!-- ==========================================================================
         SECCIÓN DE PRESENTACIÓN INTERACTIVA (12 SLIDES RESPONSIVE)
         ========================================================================== -->
    <div id="presentation-mode">
      <div class="deck-container">
        <div class="deck-topbar">
          <div class="deck-title">
            <span class="deck-counter" id="deck-counter">1 / 12</span>
            <span>Diapositiva en Vivo</span>
          </div>
          <div class="deck-hint-kbd">
            Usa las flechas <strong>← / →</strong> de tu teclado
          </div>
          <div class="deck-hint-touch">
            👈 Desliza o toca botones 👉
          </div>
        </div>

        <div class="slide-progress-bar">
          <div class="slide-progress-fill" id="slide-progress"></div>
        </div>

        <div class="slide-viewport" id="slide-viewport">

          <!-- SLIDE 1: PORTADA -->
          <div class="slide active" id="slide-1">
            <span class="slide-badge">Curso Ecosistema Autónomo SST · Clase 1</span>
            <h2>Introducción a la IA, WAPPY & Google Antigravity</h2>
            <p class="slide-lead">
              De la operatividad documental a la prevención real: cómo estructurar proyectos, automatizar tareas con triggers y alimentar a WAPPY desde tu computador.
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card highlight">
                <h4>🧠 1. WAPPY (Cerebro)</h4>
                <p>Centro de mando: especialistas SST, matriz legal colombiana, químicos SGA y Tenshi Voice.</p>
              </div>
              <div class="slide-card highlight">
                <h4>⚡ 2. Antigravity (Brazo)</h4>
                <p>Plataforma agéntica local: ejecuta triggers, vigila carpetas locales y conecta tu PC con WAPPY.</p>
              </div>
              <div class="slide-card highlight">
                <h4>🚀 3. Sinergia Total</h4>
                <p>Automatizaciones sin programar: NotebookLM, Drive de 20 años y MCP en vivo.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 2: BIENVENIDA Y REGLAS DE ORO -->
          <div class="slide" id="slide-2">
            <span class="slide-badge amber">Acuerdos de Convivencia</span>
            <h2>Bienvenida y Reglas de Oro de Nuestra Clase</h2>
            <p class="slide-lead">
              Para garantizar que los 12 participantes dominen la herramienta y dejen hoy su entorno 100% operativo:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card">
                <h4>📷 1. Cámara Encendida (Primeros 10-15 Min)</h4>
                <p>Obligatoria al inicio para el saludo, llamado a lista y conexión humana del grupo selecto de 12.</p>
              </div>
              <div class="slide-card">
                <h4>💻 2. Entorno Dual (PC + Celular)</h4>
                <p>Computador para operar Antigravity y celular cargado para Tenshi Voice y WhatsApp.</p>
              </div>
              <div class="slide-card">
                <h4>🎙️ 3. Micrófono & Preguntas</h4>
                <p>Silenciado por defecto. Usa la mano virtual o el chat; abriremos rondas de Q&A en cada módulo.</p>
              </div>
              <div class="slide-card">
                <h4>🤝 4. Debugging Colaborativo</h4>
                <p>Todos programamos en vivo. Compartimos pantalla para resolver errores: <em>el error de uno es la lección de todos</em>.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 3: INTRODUCCIÓN A LA IA (15 MINUTOS MÁXIMO) -->
          <div class="slide" id="slide-3">
            <span class="slide-badge intro">Módulo 1 · 15 Minutos (7:00 – 7:15 PM)</span>
            <h2>Introducción a la IA: De la Charla Pasiva a la Acción Agéntica</h2>
            <p class="slide-lead">
              ¿Por qué los chatbots de texto plano (como ChatGPT genérico) fallan estrepitosamente ante la complejidad técnica del SG-SST?
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4 class="lime">1. IA Generativa (ChatGPT)</h4>
                <p>Solo redacta texto pasivo. No tiene acceso a tu disco duro, no ejecuta tareas, no vigila carpetas y suele alucinar normas.</p>
              </div>
              <div class="slide-card highlight">
                <h4>2. IA Agéntica (El Salto)</h4>
                <p>Razona, planifica, lee archivos locales, llama herramientas externas (MCP), toma decisiones seguras y trabaja en segundo plano.</p>
              </div>
              <div class="slide-card lime-border">
                <h4 class="lime">3. En SG-SST Colombiano</h4>
                <p>El Decreto 1072/15 y la Res. 0312/19 exigen rigor legal, evidencia verificable y trazabilidad. La IA debe ejecutar, no adivinar.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 4: WAPPY Y ANTIGRAVITY -->
          <div class="slide" id="slide-4">
            <span class="slide-badge">Módulo 2 · Sinergia Clave</span>
            <h2>WAPPY y Antigravity: Roles y Alianza Estratégica</h2>
            <p class="slide-lead">
              Antigravity <strong>NUNCA reemplaza a WAPPY</strong>. WAPPY es el cerebro SST insustituible y Antigravity es la fábrica que lo potencializa:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>🧠 WAPPY: El Núcleo de Gestión y Cumplimiento</h4>
                <p>• Agentes especialistas (Médico Ocupacional, Abogado Laboral, Higienista).<br>• Matrices centralizadas: GTC 45, PESV, Químicos SGA, Cronograma.<br>• Base de datos viva y Tenshi Voice para campo.</p>
              </div>
              <div class="slide-card lime-border">
                <h4 class="lime">⚡ Antigravity: El Brazo Local y Fábrica de Triggers</h4>
                <p>• Lee carpetas locales de tu computador sin subir gigabytes a la nube.<br>• Ejecuta automatizaciones por horario (cron) y por eventos en disco.<br>• Alimenta y consulta a WAPPY mediante el protocolo MCP.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 5: QUÉ ES ANTIGRAVITY Y CÓMO FUNCIONA -->
          <div class="slide" id="slide-5">
            <span class="slide-badge">Módulo 3 · Arquitectura</span>
            <h2>¿Qué es Google Antigravity y Cómo Funciona?</h2>
            <p class="slide-lead">
              Antigravity es el entorno de desarrollo y ejecución de agentes autónomos creado por Google:
            </p>
            <div class="slide-content-grid four-cols">
              <div class="slide-card">
                <h4>1. Rules (Reglas)</h4>
                <p>Archivos <code>AGENTS.md</code> con instrucciones legales inviolables que el agente nunca ignora.</p>
              </div>
              <div class="slide-card">
                <h4>2. Skills (Habilidades)</h4>
                <p>Carpetas con <code>SKILL.md</code> que enseñan al agente a ejecutar tareas específicas paso a paso.</p>
              </div>
              <div class="slide-card">
                <h4>3. Workflows</h4>
                <p>Comandos rápidos <code>/slash</code> para disparar flujos rutinarios complejos con una sola palabra.</p>
              </div>
              <div class="slide-card highlight">
                <h4>4. Protocolo MCP</h4>
                <p>El puerto USB-C universal que permite al agente invocar las 55+ herramientas de WAPPY Cloud.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 6: DESCARGAR E INSTALAR ANTIGRAVITY -->
          <div class="slide" id="slide-6">
            <span class="slide-badge">Módulo 4 · Instalación Práctica</span>
            <h2>Descargar e Instalar Antigravity en tu Computador</h2>
            <p class="slide-lead">
              Paso a paso para dejar tu entorno listo hoy mismo en Windows, macOS o Linux:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>Paso 1: Instalación de Antigravity</h4>
                <p>Descarga el ejecutable oficial o instálalo vía terminal CLI según tu sistema operativo.</p>
              </div>
              <div class="slide-card">
                <h4>Paso 2: Conexión de Cuenta Google</h4>
                <p>Inicia sesión con tu cuenta de Google para habilitar Gemini 2.5 / 1.5 Pro y los servicios cloud.</p>
              </div>
              <div class="slide-card highlight">
                <h4>Paso 3: Verificación de Terminal</h4>
                <p>Abre tu consola y ejecuta <code>agy --version</code> para verificar que el motor agéntico responde.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 7: CREAR UN PROYECTO EN ANTIGRAVITY -->
          <div class="slide" id="slide-7">
            <span class="slide-badge">Módulo 5 · Estructura</span>
            <h2>Crear tu Primer Proyecto de SST en Antigravity</h2>
            <p class="slide-lead">
              Cómo crear y organizar una carpeta de trabajo local que se convertirá en el centro de operaciones de tu agente:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>1. Crear Carpeta de Trabajo</h4>
                <p>Crea una carpeta local: <code>Mi_Empresa_SST/</code> en tu disco duro y ábrela en Antigravity.</p>
              </div>
              <div class="slide-card highlight">
                <h4>2. Estructura Recomendada</h4>
                <p>Subcarpetas: <code>/inspecciones</code>, <code>/normativa</code>, <code>/informes</code> y archivo <code>AGENTS.md</code>.</p>
              </div>
              <div class="slide-card">
                <h4>3. Workspace Activo</h4>
                <p>El agente reconoce automáticamente los archivos locales y respeta las directrices del proyecto.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 8: CÓMO AUTOMATIZAR TAREAS Y TRIGGERS -->
          <div class="slide" id="slide-8">
            <span class="slide-badge lime-border">Módulo 6 · Automatización & Triggers</span>
            <h2>¿Antigravity Puede Tener Triggers? ¡Absolutamente Sí!</h2>
            <p class="slide-lead">
              Los triggers son disparadores que despiertan al agente automáticamente sin que tengas que tocar el teclado:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>⏰ 1. Trigger Temporal (Cron Schedules)</h4>
                <p><strong>Ejemplo:</strong> Todos los lunes a las 6:00 AM, el agente revisa el cronograma de WAPPY, detecta actividades vencidas y redacta alertas a responsables.</p>
              </div>
              <div class="slide-card highlight">
                <h4>📂 2. Trigger por Carpeta (File Watchers)</h4>
                <p><strong>Ejemplo:</strong> Al guardar una foto de obra en <code>/inspecciones</code>, el agente la analiza con visión IA y radica el reporte de condición insegura en WAPPY.</p>
              </div>
              <div class="slide-card">
                <h4>🚨 3. Trigger por Umbral Reactivo</h4>
                <p><strong>Ejemplo:</strong> Si el ausentismo supera el 5% en WAPPY, el agente dispara un informe epidemiológico con el Médico Ocupacional.</p>
              </div>
              <div class="slide-card">
                <h4>⚡ 4. Trigger por Scripts Locales</h4>
                <p><strong>Ejemplo:</strong> Ejecución tras descargar nóminas o listados de personal para actualizar trabajadores en WAPPY.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 9: CREAR SKILLS PARA TAREAS RUTINARIAS -->
          <div class="slide" id="slide-9">
            <span class="slide-badge">Módulo 7 · Habilidades Modulares</span>
            <h2>Crear Skills e Instrucciones para Tareas Rutinarias</h2>
            <p class="slide-lead">
              Un Skill es una receta empaquetada (<code>SKILL.md</code>) para que el agente ejecute un proceso repetitivo a la perfección:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>Anatomía de un Skill</h4>
                <p>Encabezado YAML con <code>name</code> y <code>description</code>, seguido de pasos lógicos en Markdown.</p>
              </div>
              <div class="slide-card highlight">
                <h4>Ejemplo 1: Inspección de EPP</h4>
                <p>Paso 1: Leer remisión → Paso 2: Validar certificados → Paso 3: Radicar entrega en WAPPY.</p>
              </div>
              <div class="slide-card">
                <h4>Ejemplo 2: Matriz GTC 45</h4>
                <p>Revisa nuevos puestos de trabajo y calcula nivel de deficiencia y probabilidad automáticamente.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 10: CONEXIÓN NOTEBOOKLM Y GOOGLE DRIVE -->
          <div class="slide" id="slide-10">
            <span class="slide-badge">Módulo 8 · Ecosistema Google</span>
            <h2>Conectar con Google NotebookLM & Google Drive</h2>
            <p class="slide-lead">
              El puente que une la inteligencia agéntica con el almacenamiento legal y la memoria documental:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>📚 Google NotebookLM: Memoria Jurídica</h4>
                <p>• Indexa códigos de 500 páginas (Decreto 1072, Resoluciones 0312, 1401, 2400).<br>• Citas textuales exactas con página y artículo, eliminando alucinaciones.<br>• Genera podcasts explicativos en audio para capacitaciones del COPASST.</p>
              </div>
              <div class="slide-card highlight">
                <h4>☁️ Google Drive: Archivo de 20 Años</h4>
                <p>• Cumplimiento estricto del archivo digital obligatorio de 20 años (Dec. 1072/15 Art. 2.2.4.6.13).<br>• Antigravity organiza automáticamente carpetas por año, sede y trabajador.<br>• Sincronización transparente de actas, firmas y certificados médicos.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 11: ALIMENTAR A WAPPY DESDE ANTIGRAVITY -->
          <div class="slide" id="slide-11">
            <span class="slide-badge lime-border">Módulo 9 · Alimentación en Vivo</span>
            <h2>Alimentar a WAPPY desde Antigravity vía MCP</h2>
            <p class="slide-lead">
              Cómo el agente local envía los datos procesados en tu computador hacia las bases de datos de WAPPY Cloud:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>1. Lectura Local</h4>
                <p>Antigravity procesa un Excel de nómina, un PDF de examen ocupacional o una foto de inspección.</p>
              </div>
              <div class="slide-card highlight">
                <h4>2. Llamada MCP Segura</h4>
                <p>Invoca herramientas como <code>wappy_alimentar_matriz_gtc45</code> o <code>wappy_registrar_trabajador</code>.</p>
              </div>
              <div class="slide-card">
                <h4>3. Sincronización WAPPY</h4>
                <p>Tu panel de WAPPY se actualiza en tiempo real: reportes, matrices e indicadores listos para auditoría.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 12: TALLER EN VIVO Y RETO SEMANAL -->
          <div class="slide" id="slide-12">
            <span class="slide-badge amber">Módulo 10 · Práctica & Reto #1</span>
            <h2>Laboratorio en Vivo y Reto Semanal #1</h2>
            <p class="slide-lead">
              El aprendizaje se consolida ejecutando. Tu misión para la siguiente sesión:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>🎯 Reto de la Semana (Clase 1 → Clase 2)</h4>
                <p>1. Dejar instalado Antigravity en tu equipo.<br>2. Crear tu proyecto con <code>AGENTS.md</code> blindado con normativa colombiana.<br>3. Ejecutar tu primer skill o trigger que consulte o alimente un dato en WAPPY.</p>
              </div>
              <div class="slide-card">
                <h4>🤝 Soporte VIP en WhatsApp</h4>
                <p>Si surge algún error de terminal o variables de entorno, compártelo en el grupo privado de WhatsApp de los 12 alumnos y lo resolvemos juntos.</p>
              </div>
            </div>
          </div>

        </div>

        <div class="deck-footer">
          <div class="deck-nav-btns">
            <button class="btn-slide-nav" id="btn-prev" onclick="prevSlide()" disabled>← Anterior</button>
            <button class="btn-slide-nav" id="btn-next" onclick="nextSlide()">Siguiente →</button>
          </div>
          <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="deck-meet-btn">
            <span>📹</span> Entrar a Google Meet (7:00 PM)
          </a>
        </div>
      </div>
    </div>

    <!-- ==========================================================================
         SECCIÓN GUÍA COMPLETA (MODO GUÍA DE ESTUDIO CONTINUA RESPONSIVE)
         ========================================================================== -->
    <div id="guide-mode" style="display: none;">

      <!-- HERO BANNER -->
      <section class="hero">
        <span class="hero-badge">Especialización Práctica SST con IA Agéntica</span>
        <h1>Clase 1: Introducción a la IA, WAPPY & Google Antigravity</h1>
        <p class="hero-sub">
          Aprende a conectar el centro de mando y cumplimiento legal de WAPPY con la potencia de automatización local, carpetas vigiladas, triggers y herramientas de Google (NotebookLM y Drive).
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

        <div class="hero-cta-box">
          <div class="hero-cta-info">
            <h3>📹 Sala Virtual Oficial Google Meet</h3>
            <p>La sala se abre a las 6:50 PM para pruebas de audio y cámara. Código: <strong>xvz-jmvv-iym</strong></p>
          </div>
          <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="hero-cta-btn">
            <span>👉</span> Entrar a Google Meet
          </a>
        </div>
      </section>

      <!-- EL CONCEPTO CLAVE: WAPPY + ANTIGRAVITY -->
      <section class="synergy-card">
        <span class="sec-tag">El Concepto Maestro de la Clase</span>
        <h3 style="font-family: var(--font-display); font-size: 17px; font-weight: 900; color: #042f2e;">
          ¿Por qué Antigravity NO reemplaza a WAPPY, sino que lo multiplica?
        </h3>
        <p style="font-size: 12.5px; color: #0f766e; margin-top: 4px;">
          Antigravity no es un competidor ni una plataforma SST aislada. Es la herramienta de Google que le da brazos y piernas a WAPPY para operar en tu computador.
        </p>

        <div class="synergy-grid">
          <div class="synergy-box">
            <h4>🧠 WAPPY: El Cerebro y Centro de Mando</h4>
            <p>
              Alberga tus especialistas (Médico, Abogado, Higienista), la matriz legal colombiana, comités, productos químicos SGA, gestión de trabajadores y Tenshi Voice en campo.
            </p>
          </div>
          <div class="synergy-box">
            <h4>⚡ Antigravity: El Brazo Ejecutor & Triggers</h4>
            <p>
              Ejecuta tareas programadas (cron), vigila carpetas locales del disco duro, procesa miles de PDFs y conecta las herramientas del computador con la nube de WAPPY.
            </p>
          </div>
        </div>
      </section>

      <!-- SECCIÓN 1: REGLAS DE ORO -->
      <section>
        <div class="sec-header">
          <span class="sec-tag">Convivencia & Calidad</span>
          <h2 class="sec-title">Reglas de Oro y Acuerdos de Participación</h2>
        </div>

        <div class="rules-grid">
          <div class="rule-card urgent">
            <div class="rule-top">
              <span class="rule-title">📷 1. Cámara Encendida (Primeros 10-15 Min)</span>
              <span class="rule-badge badge-amber">Obligatorio</span>
            </div>
            <p class="rule-desc">
              Cámara encendida durante los <strong>primeros 10 a 15 minutos</strong> para el saludo inicial, llamado a lista y conexión humana del grupo selecto. Luego puedes apagarla si necesitas optimizar tu conexión.
            </p>
          </div>

          <div class="rule-card">
            <div class="rule-top">
              <span class="rule-title">💻 2. Entorno Dual: Computador + Celular</span>
              <span class="rule-badge badge-teal">Hardware</span>
            </div>
            <p class="rule-desc">
              <strong>Computador:</strong> Windows 10/11, Mac o Linux (8GB+ RAM) para operar Antigravity. <strong>Celular:</strong> a la mano para probar Tenshi Voice y recibir alertas en tiempo real.
            </p>
          </div>

          <div class="rule-card">
            <div class="rule-top">
              <span class="rule-title">🌐 3. Conexión Estable de Red</span>
              <span class="rule-badge badge-teal">Conectividad</span>
            </div>
            <p class="rule-desc">
              Internet de 30 a 50 Mbps mínimo (Wi-Fi 5GHz o cable). Los sockets de voz y los modelos de lenguaje exigen estabilidad para evitar caídas o latencia.
            </p>
          </div>

          <div class="rule-card">
            <div class="rule-top">
              <span class="rule-title">🎙️ 4. Micrófono & Preguntas</span>
              <span class="rule-badge badge-teal">Interacción</span>
            </div>
            <p class="rule-desc">
              Micrófono en silencio por defecto. Usa <strong>"Levantar la mano"</strong> o el chat para formular preguntas; abriremos rondas activas de Q&A en cada bloque.
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

      <!-- SECCIÓN 2: CHECKLIST PREVIO -->
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
          <span class="sec-tag">Programa Oficial Detallado</span>
          <h2 class="sec-title">Paso a Paso de la Clase de Hoy</h2>
        </div>

        <!-- TEMA 1: INTRO A LA IA -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;">Módulo 01</span>
              <span class="step-time">7:00 PM – 7:15 PM (15 Minutos Máx)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#b45309;">Apertura & Despegue</span>
          </div>
          <h3 class="step-title">1. Introducción a la Inteligencia Artificial (De ChatGPT a la IA Agéntica)</h3>
          <p class="step-desc">
            En los primeros 15 minutos desmitificamos la IA: qué es, qué no es, y por qué los chatbots de texto plano fallan ante el rigor del SG-SST (Decreto 1072/15 y Res. 0312/19).
          </p>
          <ul class="step-list">
            <li><strong>El colapso del prompt plano:</strong> Escribirle a un chat genérico no sirve para auditar 60 estándares mínimos ni para rastrear 200 exámenes médicos ocupacionales.</li>
            <li><strong>Los 3 niveles de madurez:</strong> Asistente de texto vs Copiloto interactivo vs Agente Autónomo con herramientas de sistema operativo.</li>
            <li><strong>Por qué no requieres ser programador:</strong> La IA Agéntica se parametriza en lenguaje natural, matrices de decisión y reglas de negocio SST.</li>
          </ul>
        </div>

        <!-- TEMA 2: WAPPY Y ANTIGRAVITY -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Módulo 02</span>
              <span class="step-time">7:15 PM – 7:30 PM (15 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#0f766e;">La Alianza Estratégica</span>
          </div>
          <h3 class="step-title">2. WAPPY y Antigravity: Roles y Sinergia Inquebrantable</h3>
          <p class="step-desc">
            Comprende la división exacta de funciones: WAPPY es el cerebro y repositorio normativo; Antigravity es el brazo ejecutor local que potencia a WAPPY.
          </p>
          <ul class="step-list">
            <li><strong>WAPPY como Cerebro Central:</strong> Aloja a los agentes especializados (Abogado Laboral, Higienista, Médico Ocupacional), las bases de datos legales y Tenshi Voice.</li>
            <li><strong>Antigravity como Brazo Multiplicador:</strong> Lee tu disco duro, ejecuta tareas por horario y vigila carpetas locales para alimentar a WAPPY sin esfuerzo manual.</li>
            <li><strong>Prevención 360°:</strong> Lo que una aplicación web no puede tocar por seguridad en tu PC, lo ejecuta Antigravity de forma autorizada.</li>
          </ul>
        </div>

        <!-- TEMA 3: QUÉ ES ANTIGRAVITY Y CÓMO FUNCIONA -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Módulo 03</span>
              <span class="step-time">7:30 PM – 7:45 PM (15 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#0f766e;">Arquitectura Técnica</span>
          </div>
          <h3 class="step-title">3. ¿Qué es Google Antigravity y Cómo Funciona?</h3>
          <p class="step-desc">
            Explicación didáctica de la arquitectura agéntica de Google: cómo piensa un agente, cómo navega los archivos y cómo ejecuta acciones.
          </p>
          <ul class="step-list">
            <li><strong>Entornos de Antigravity:</strong> Antigravity IDE (entorno visual de trabajo), Antigravity Desktop app y terminal CLI (<code>agy</code>).</li>
            <li><strong>Los 4 Pilares Maestros:</strong> Rules (reglas persistentes inviolables), Skills (habilidades bajo demanda), Workflows (flujos guiados) y MCP (Model Context Protocol).</li>
            <li><strong>Control Humano en el Bucle (Human-in-the-Loop):</strong> El agente solicita confirmación antes de ejecutar cambios críticos o eliminar datos.</li>
          </ul>
        </div>

        <!-- TEMA 4: DESCARGAR E INSTALAR ANTIGRAVITY -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Módulo 04</span>
              <span class="step-time">7:45 PM – 8:00 PM (15 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#0f766e;">Instalación en Vivo</span>
          </div>
          <h3 class="step-title">4. Descargar e Instalar Antigravity en tu Equipo</h3>
          <p class="step-desc">
            Instalación en tiempo real para todos los sistemas operativos (Windows, Mac y Linux) garantizando que ningún alumno se quede atrás.
          </p>
          <ul class="step-list">
            <li><strong>Requisitos de sistema:</strong> Computador con Windows 10/11, macOS o Linux con mínimo 8GB de memoria RAM.</li>
            <li><strong>Instalación y Login de Google:</strong> Vinculación segura de la cuenta de Google para habilitar las APIs y modelos agénticos.</li>
            <li><strong>Comprobación en Terminal:</strong> Verificación de dependencias y primer comando de prueba en vivo.</li>
          </ul>
          <div class="code-box">
            <div class="code-box-header">
              <span class="code-box-title">💻 Terminal · Verificación de Instalación</span>
              <button class="btn-copy" onclick="copyCode('cmd-install', this)">Copiar</button>
            </div>
            <pre class="code-content" id="cmd-install"># Comprobar la versión instalada de Antigravity
agy --version

# Iniciar el entorno interactivo
agy</pre>
          </div>
        </div>

        <!-- TEMA 5: CREAR UN PROYECTO EN ANTIGRAVITY -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Módulo 05</span>
              <span class="step-time">8:00 PM – 8:15 PM (15 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#0f766e;">Estructura de Carpetas</span>
          </div>
          <h3 class="step-title">5. Crear tu Primer Proyecto SST en Antigravity</h3>
          <p class="step-desc">
            Aprende a estructurar el espacio de trabajo local para que el agente entienda tu contexto empresarial y normativo desde el primer segundo.
          </p>
          <ul class="step-list">
            <li><strong>Creación de la carpeta del proyecto:</strong> Apertura de la carpeta en Antigravity y configuración del workspace.</li>
            <li><strong>El archivo <code>AGENTS.md</code>:</strong> La "constitución" inviolable del proyecto con leyes colombianas, responsabilidades y alcance del SG-SST.</li>
            <li><strong>Estructura recomendada:</strong> Carpetas para <code>/inspecciones</code>, <code>/epp</code>, <code>/ausentismo</code> y <code>/normativa</code>.</li>
          </ul>
        </div>

        <!-- TEMA 6: AUTOMATIZAR TAREAS Y TRIGGERS -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill" style="background:#ccfbf1; color:#047857; border:1px solid #99f6e4;">Módulo 06</span>
              <span class="step-time">8:15 PM – 8:30 PM (15 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#047857;">Superpoder Clave</span>
          </div>
          <h3 class="step-title">6. Cómo Automatizar Tareas y Triggers en Antigravity</h3>
          <p class="step-desc">
            ¿Antigravity puede tener triggers? ¡SÍ! Aprende a configurar disparadores automáticos que ejecuten acciones sin intervención manual.
          </p>
          <ul class="step-list">
            <li><strong>Trigger 1 · Temporizador Cron:</strong> Programación para que el agente se active cada lunes a las 6:00 AM y revise tareas vencidas en WAPPY.</li>
            <li><strong>Trigger 2 · Carpetas Vigiladas (File Watcher):</strong> Al guardar fotos de inspecciones en tu PC, el agente las analiza con visión computacional y radica el hallazgo.</li>
            <li><strong>Trigger 3 · Umbrales Reactivos:</strong> Disparos automáticos si un indicador de riesgo o ausentismo sobrepasa el límite permitido.</li>
          </ul>
        </div>

        <!-- TEMA 7: CREAR SKILLS RUTINARIAS -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Módulo 07</span>
              <span class="step-time">8:30 PM – 8:40 PM (10 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#0f766e;">Habilidades Modulares</span>
          </div>
          <h3 class="step-title">7. Crear Skills e Instrucciones para Tareas Rutinarias</h3>
          <p class="step-desc">
            Aprende a empaquetar procedimientos repetitivos de tu empresa en archivos <code>SKILL.md</code> para que el agente los ejecute de forma estandarizada.
          </p>
          <ul class="step-list">
            <li><strong>Estructura de un Skill:</strong> Nombre, descripción precisa y pasos de ejecución secuenciales.</li>
            <li><strong>Caso práctico:</strong> Skill para auditar entregas de EPP y contrastarlas con la matriz de elementos de protección personal.</li>
            <li><strong>Ahorro de tokens:</strong> Las habilidades solo se cargan en la memoria del agente cuando son invocadas, optimizando costos y velocidad.</li>
          </ul>
        </div>

        <!-- TEMA 8: NOTEBOOKLM Y DRIVE -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Módulo 08</span>
              <span class="step-time">8:40 PM – 8:50 PM (10 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#0f766e;">Ecosistema Google</span>
          </div>
          <h3 class="step-title">8. Conectar con Google NotebookLM & Google Drive</h3>
          <p class="step-desc">
            Integra la memoria jurídica oficial y el almacenamiento documental legal de 20 años en tu ecosistema agéntico.
          </p>
          <ul class="step-list">
            <li><strong>Google NotebookLM como memoria jurídica:</strong> Carga de códigos normativos (Decreto 1072, Res. 0312, 1401) para obtener citas exactas con página y artículo, sin inventar nada.</li>
            <li><strong>Generación de Podcasts en Audio:</strong> Creación de cápsulas de 5 minutos generadas por IA para divulgar lecciones aprendidas al COPASST.</li>
            <li><strong>Google Drive para Archivo de 20 Años:</strong> Cumplimiento legal del Artículo 2.2.4.6.13 del Decreto 1072/15 con carpetas estructuradas y respaldadas.</li>
          </ul>
        </div>

        <!-- TEMA 9: ALIMENTAR A WAPPY -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill" style="background:#ccfbf1; color:#047857; border:1px solid #99f6e4;">Módulo 09</span>
              <span class="step-time">8:50 PM – 9:00 PM (10 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#047857;">Alimentación en Vivo</span>
          </div>
          <h3 class="step-title">9. Alimentar a WAPPY desde Antigravity vía MCP</h3>
          <p class="step-desc">
            El cierre maestro: cómo Antigravity lee los archivos locales y actualiza automáticamente las bases de datos de WAPPY Cloud.
          </p>
          <ul class="step-list">
            <li><strong>El conector MCP de WAPPY:</strong> Conexión autenticada con las herramientas oficiales de WAPPY (matrices GTC 45, PESV, trabajadores, químicos).</li>
            <li><strong>Flujo bidireccional:</strong> Antigravity consulta el estado de la empresa en WAPPY, procesa la información y devuelve los registros consolidados.</li>
            <li><strong>Asignación del Reto Semanal #1:</strong> Dejar tu primer agente local configurado y sincronizado con WAPPY antes de la Clase 2.</li>
          </ul>
        </div>
      </section>

      <!-- SECCIÓN 4: PROMPTS LISTOS -->
      <section>
        <div class="sec-header">
          <span class="sec-tag">Caja de Herramientas</span>
          <h2 class="sec-title">Prompts y Plantillas Listas para Copiar en Clase</h2>
        </div>

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
> 3. WAPPY es tu cerebro y fuente central de verdad: consulta siempre los datos reales de la empresa.</pre>
        </div>

        <div class="code-box">
          <div class="code-box-header">
            <span class="code-box-title">⚙️ SKILL.md · Habilidad de Trigger de Inspección</span>
            <button class="btn-copy" onclick="copyCode('code2', this)">Copiar</button>
          </div>
          <pre class="code-content" id="code2">---
name: auditoria-condiciones-inseguras
description: Habilidad especializada para vigilar carpetas de fotos, clasificar actos inseguros y radicar en WAPPY.
---

# Procedimiento de Inspección Agéntica
1. Detecta la nueva fotografía o reporte en la carpeta vigilada /inspecciones.
2. Identifica el factor de riesgo según la GTC 45 (Físico, Químico, Biomecánico, Seguridad).
3. Evalúa el nivel de deficiencia y la medida correctiva sugerida.
4. Conéctate a WAPPY vía MCP y registra el reporte en el centro de control.</pre>
        </div>
      </section>

      <!-- SECCIÓN 5: RECURSOS -->
      <section class="resources-box">
        <div class="res-left">
          <h3>Descarga la Guía Oficial en PDF y Accede a la Clase</h3>
          <p>Ten a la mano el documento con las reglas y cronograma y conéctate puntual a las 6:50 PM.</p>
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

      <footer>
        <p><strong>WAPPY IA</strong> · Especialización Práctica en IA Agéntica para SG-SST</p>
        <p style="margin-top: 4px;">Docente: Félix Bedoya · Grupo Exclusivo de 12 Participantes · Clase 01</p>
      </footer>
    </div>

  </div>

  <script>
    // Slide Deck Controller
    let currentSlide = 1;
    const totalSlides = 12;

    function showSlide(index) {{
      if (index < 1 || index > totalSlides) return;
      document.querySelectorAll('.slide').forEach(el => el.classList.remove('active'));
      const activeEl = document.getElementById('slide-' + index);
      if (activeEl) {{
        activeEl.classList.add('active');
        currentSlide = index;
        document.getElementById('deck-counter').innerText = currentSlide + ' / ' + totalSlides;
        document.getElementById('slide-progress').style.width = ((currentSlide / totalSlides) * 100) + '%';
        
        document.getElementById('btn-prev').disabled = (currentSlide === 1);
        document.getElementById('btn-next').disabled = (currentSlide === totalSlides);
      }}
    }}

    function nextSlide() {{
      if (currentSlide < totalSlides) showSlide(currentSlide + 1);
    }}

    function prevSlide() {{
      if (currentSlide > 1) showSlide(currentSlide - 1);
    }}

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {{
      if (document.getElementById('presentation-mode').style.display !== 'none') {{
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {{
          e.preventDefault();
          nextSlide();
        }} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {{
          e.preventDefault();
          prevSlide();
        }}
      }}
    }});

    // Mobile Touch Swipe Navigation (Instagram Story style)
    let touchStartX = 0;
    let touchEndX = 0;
    const viewport = document.getElementById('slide-viewport');

    viewport.addEventListener('touchstart', (e) => {{
      touchStartX = e.changedTouches[0].screenX;
    }}, {{ passive: true }});

    viewport.addEventListener('touchend', (e) => {{
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }}, {{ passive: true }});

    function handleSwipe() {{
      const swipeDistance = touchEndX - touchStartX;
      if (Math.abs(swipeDistance) > 45) {{
        if (swipeDistance < 0) {{
          nextSlide(); // Swiped left -> next
        }} else {{
          prevSlide(); // Swiped right -> prev
        }}
      }}
    }}

    // Toggle between Presentation Mode and Guide Mode
    function setViewMode(mode) {{
      const deckEl = document.getElementById('presentation-mode');
      const guideEl = document.getElementById('guide-mode');
      const btnDeck = document.getElementById('btn-view-deck');
      const btnGuide = document.getElementById('btn-view-guide');

      if (mode === 'deck') {{
        deckEl.style.display = 'block';
        guideEl.style.display = 'none';
        btnDeck.classList.add('active');
        btnGuide.classList.remove('active');
        window.scrollTo({{ top: 0, behavior: 'smooth' }});
      }} else {{
        deckEl.style.display = 'none';
        guideEl.style.display = 'block';
        btnDeck.classList.remove('active');
        btnGuide.classList.add('active');
        window.scrollTo({{ top: 0, behavior: 'smooth' }});
      }}
    }}

    // Copy to clipboard
    function copyCode(id, btn) {{
      const el = document.getElementById(id);
      if (!el) return;
      navigator.clipboard.writeText(el.innerText).then(() => {{
        const originalText = btn.innerText;
        btn.innerText = '¡Copiado! ✓';
        setTimeout(() => {{
          btn.innerText = originalText;
        }}, 2000);
      }}).catch(err => {{
        alert('Copia el texto manualmente.');
      }});
    }}

    // Checklist persistence
    function saveCheck(id) {{
      const el = document.getElementById(id);
      if (el) {{
        localStorage.setItem('wappy_clase1_' + id, el.checked ? '1' : '0');
      }}
    }}

    document.addEventListener('DOMContentLoaded', () => {{
      ['chk1', 'chk2', 'chk3', 'chk4', 'chk5'].forEach(id => {{
        const val = localStorage.getItem('wappy_clase1_' + id);
        const el = document.getElementById(id);
        if (el && val === '1') {{
          el.checked = true;
        }}
      }});
      // Default show slide 1
      showSlide(1);
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
