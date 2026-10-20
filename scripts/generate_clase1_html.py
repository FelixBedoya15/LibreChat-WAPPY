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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>Clase 1: Introducción a la IA & Google Antigravity como Potenciador de WAPPY | WAPPY IA</title>
  <meta name="description" content="Presentación oficial y guía de la Clase 1. Introducción a la IA (15 min), el rol de WAPPY como cerebro SST y Antigravity como fábrica de triggers y automatizaciones locales.">
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

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}

    html {{
      scroll-behavior: smooth;
      scroll-padding-top: 90px;
    }}

    body {{
      font-family: var(--font-ui);
      background-color: var(--bg);
      color: var(--slate-900);
      line-height: 1.55;
      overflow-x: hidden;
      padding-bottom: 90px;
    }}

    a {{
      text-decoration: none;
      color: inherit;
    }}

    .wrap {{
      max-width: 1040px;
      margin: 0 auto;
      padding: 0 16px;
    }}

    /* ==========================================================================
       TOP LIVE BAR
       ========================================================================== */
    .top-live-bar {{
      background: linear-gradient(90deg, #042f2e 0%, #0f766e 50%, #042f2e 100%);
      color: #ffffff;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      text-align: center;
      border-bottom: 1px solid rgba(94, 234, 212, 0.25);
    }}

    .live-pulse {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(239, 68, 68, 0.25);
      border: 1px solid #ef4444;
      color: #fecaca;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}

    .live-dot {{
      width: 7px;
      height: 7px;
      background-color: #ef4444;
      border-radius: 50%;
      box-shadow: 0 0 8px #ef4444;
      animation: pulse 1.5s infinite;
    }}

    @keyframes pulse {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.4; transform: scale(1.3); }}
    }}

    /* ==========================================================================
       FLOATING NAVBAR CAPSULE
       ========================================================================== */
    .nav-wrap {{
      position: sticky;
      top: 12px;
      z-index: 100;
      padding: 0 16px;
      margin-bottom: 16px;
    }}

    .nav-inner {{
      max-width: 1040px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
      border-radius: 999px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px 0 18px;
    }}

    .nav-logo {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .nav-logo img {{
      height: 32px;
      object-fit: contain;
    }}

    .nav-view-toggles {{
      display: inline-flex;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 3px;
      border-radius: 999px;
    }}

    .toggle-btn {{
      border: none;
      background: transparent;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 999px;
      cursor: pointer;
      color: var(--slate-600);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }}

    .toggle-btn.active {{
      background: #ffffff;
      color: var(--teal);
      font-weight: 800;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }}

    .nav-actions {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .btn-meet-nav {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 999px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
      transition: all 0.2s ease;
    }}

    .btn-meet-nav:hover {{
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.4);
    }}

    /* ==========================================================================
       SLIDE DECK / PRESENTATION VIEWER (MODO PRESENTACIÓN)
       ========================================================================== */
    #presentation-mode {{
      display: block;
      margin-bottom: 24px;
    }}

    .deck-container {{
      background: #0f172a;
      border-radius: 24px;
      color: #ffffff;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
      border: 1.5px solid #334155;
      overflow: hidden;
      position: relative;
    }}

    .deck-topbar {{
      background: #1e293b;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
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
      background: rgba(255, 255, 255, 0.1);
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      color: #5eead4;
    }}

    .slide-viewport {{
      min-height: 440px;
      padding: 32px 28px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      background: radial-gradient(circle at top right, rgba(13, 148, 136, 0.25) 0%, rgba(15, 23, 42, 1) 65%);
    }}

    @media (min-width: 640px) {{
      .slide-viewport {{
        min-height: 480px;
        padding: 44px 48px;
      }}
    }}

    .slide {{
      display: none;
      animation: fadeIn 0.3s ease-in-out;
    }}

    .slide.active {{
      display: block;
    }}

    @keyframes fadeIn {{
      from {{ opacity: 0; transform: translateY(6px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}

    .slide-badge {{
      display: inline-block;
      background: rgba(94, 234, 212, 0.15);
      border: 1px solid #5eead4;
      color: #5eead4;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
    }}

    .slide-badge.intro {{
      background: rgba(199, 243, 3, 0.15);
      border-color: #c7f303;
      color: #c7f303;
    }}

    .slide h2 {{
      font-family: var(--font-display);
      font-size: 24px;
      font-weight: 900;
      line-height: 1.25;
      color: #ffffff;
      margin-bottom: 14px;
    }}

    @media (min-width: 640px) {{
      .slide h2 {{ font-size: 32px; }}
    }}

    .slide-lead {{
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.5;
      margin-bottom: 20px;
    }}

    .slide-content-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 16px;
    }}

    @media (min-width: 640px) {{
      .slide-content-grid.two-cols {{
        grid-template-columns: 1fr 1fr;
      }}
      .slide-content-grid.three-cols {{
        grid-template-columns: repeat(3, 1fr);
      }}
    }}

    .slide-card {{
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 14px;
      padding: 16px;
    }}

    .slide-card.highlight {{
      border-color: #5eead4;
      background: rgba(13, 148, 136, 0.15);
    }}

    .slide-card h4 {{
      font-size: 14px;
      font-weight: 800;
      color: #5eead4;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .slide-card h4.lime {{
      color: #c7f303;
    }}

    .slide-card p {{
      font-size: 12.5px;
      color: #cbd5e1;
      line-height: 1.45;
    }}

    /* Deck Controls */
    .deck-footer {{
      background: #1e293b;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #334155;
    }}

    .deck-nav-btns {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .btn-slide-nav {{
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }}

    .btn-slide-nav:hover:not(:disabled) {{
      background: #0d9488;
      border-color: #5eead4;
    }}

    .btn-slide-nav:disabled {{
      opacity: 0.35;
      cursor: not-allowed;
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
       HERO & GENERAL SECTIONS
       ========================================================================== */
    .hero {{
      background: linear-gradient(145deg, #042f2e 0%, #0f766e 60%, #115e59 100%);
      border-radius: 24px;
      padding: 32px 24px;
      color: #ffffff;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(15, 118, 110, 0.18);
    }}

    .hero-badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.28);
      color: #ccfbf1;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
    }}

    .hero h1 {{
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 900;
      line-height: 1.2;
      color: #ffffff;
      margin-bottom: 10px;
    }}

    @media (min-width: 640px) {{
      .hero h1 {{ font-size: 32px; }}
    }}

    .hero-sub {{
      font-size: 14px;
      color: #a7f3d0;
      line-height: 1.5;
      max-width: 720px;
      margin-bottom: 20px;
    }}

    .hero-meta-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }}

    @media (min-width: 640px) {{
      .hero-meta-grid {{ grid-template-columns: repeat(4, 1fr); }}
    }}

    .hero-meta-item {{
      background: rgba(0, 0, 0, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 14px;
      padding: 10px 14px;
    }}

    .hero-meta-label {{
      font-size: 10px;
      font-weight: 700;
      color: #99f6e4;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }}

    .hero-meta-val {{
      font-size: 13px;
      font-weight: 800;
      color: #ffffff;
    }}

    .hero-cta-box {{
      background: rgba(255, 255, 255, 0.12);
      border: 1.5px solid #5eead4;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
      backdrop-filter: blur(8px);
    }}

    @media (min-width: 640px) {{
      .hero-cta-box {{
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }}
    }}

    .hero-cta-info h3 {{
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 2px;
    }}

    .hero-cta-info p {{
      font-size: 12px;
      color: #ccfbf1;
    }}

    .hero-cta-btn {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      color: #042f2e;
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 900;
      padding: 12px 24px;
      border-radius: 999px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
      white-space: nowrap;
    }}

    .hero-cta-btn:hover {{
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      background: #f0fdfa;
    }}

    /* ==========================================================================
       SECTION HEADERS & CARDS
       ========================================================================== */
    .sec-header {{
      margin-bottom: 16px;
      margin-top: 32px;
    }}

    .sec-tag {{
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      background: #ccfbf1;
      color: #0f766e;
      border: 1px solid #99f6e4;
      padding: 2px 8px;
      border-radius: 999px;
      margin-bottom: 6px;
    }}

    .sec-title {{
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 900;
      color: var(--slate-900);
      line-height: 1.25;
    }}

    .sec-sub {{
      font-size: 13px;
      color: var(--slate-600);
      margin-top: 4px;
    }}

    /* Synergistic Highlight: WAPPY vs Antigravity */
    .synergy-card {{
      background: linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%);
      border: 2px solid #5eead4;
      border-radius: 20px;
      padding: 22px;
      margin: 20px 0;
    }}

    .synergy-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-top: 14px;
    }}

    @media (min-width: 640px) {{
      .synergy-grid {{ grid-template-columns: 1fr 1fr; }}
    }}

    .synergy-box {{
      background: #ffffff;
      border-radius: 14px;
      padding: 16px;
      border: 1px solid #ccfbf1;
      box-shadow: 0 2px 8px rgba(15, 118, 110, 0.05);
    }}

    .synergy-box h4 {{
      font-size: 15px;
      font-weight: 800;
      color: var(--teal);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .synergy-box p {{
      font-size: 12.5px;
      color: var(--slate-700);
      line-height: 1.45;
    }}

    /* Rules Grid */
    .rules-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }}

    @media (min-width: 640px) {{
      .rules-grid {{ grid-template-columns: 1fr 1fr; }}
    }}

    .rule-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-left: 4px solid var(--teal);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
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
      margin-bottom: 6px;
    }}

    .rule-title {{
      font-size: 13.5px;
      font-weight: 800;
      color: var(--slate-900);
    }}

    .rule-badge {{
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      text-transform: uppercase;
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
      font-size: 12px;
      color: var(--slate-700);
      line-height: 1.45;
    }}

    /* Step Card */
    .step-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }}

    .step-header {{
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--slate-100);
      padding-bottom: 12px;
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
      gap: 8px;
    }}

    .step-pill {{
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 999px;
      background: #f1f5f9;
      color: var(--slate-700);
    }}

    .step-time {{
      font-size: 12px;
      font-weight: 800;
      color: var(--teal);
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      padding: 3px 10px;
      border-radius: 999px;
    }}

    .step-title {{
      font-family: var(--font-display);
      font-size: 17px;
      font-weight: 800;
      color: var(--slate-900);
      margin-bottom: 4px;
    }}

    .step-desc {{
      font-size: 13px;
      color: var(--slate-600);
      line-height: 1.45;
      margin-bottom: 12px;
    }}

    .step-list {{
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}

    .step-list li {{
      font-size: 12.5px;
      color: var(--slate-700);
      padding-left: 18px;
      position: relative;
      line-height: 1.4;
    }}

    .step-list li::before {{
      content: "✓";
      position: absolute;
      left: 0;
      color: var(--teal);
      font-weight: 900;
      font-size: 12px;
    }}

    /* Copyable code box */
    .code-box {{
      background: #0f172a;
      color: #f8fafc;
      border-radius: 14px;
      overflow: hidden;
      margin: 12px 0;
      border: 1px solid #334155;
    }}

    .code-box-header {{
      background: #1e293b;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
    }}

    .code-box-title {{
      font-family: var(--font-code);
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }}

    .btn-copy {{
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .btn-copy:hover {{
      background: #0d9488;
      border-color: #5eead4;
    }}

    .btn-copy.copied {{
      background: #10b981;
      border-color: #34d399;
    }}

    .code-content {{
      padding: 12px 14px;
      font-family: var(--font-code);
      font-size: 11.5px;
      line-height: 1.45;
      overflow-x: auto;
      white-space: pre-wrap;
      color: #e2e8f0;
    }}

    /* Checklist */
    .check-card {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 18px;
      padding: 18px;
    }}

    .check-item {{
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--slate-100);
      cursor: pointer;
      user-select: none;
    }}

    .check-item:last-child {{
      border-bottom: none;
    }}

    .check-input {{
      width: 18px;
      height: 18px;
      accent-color: var(--teal);
      margin-top: 2px;
      cursor: pointer;
    }}

    .check-text h4 {{
      font-size: 13px;
      font-weight: 700;
      color: var(--slate-900);
    }}

    .check-text p {{
      font-size: 11.5px;
      color: var(--slate-600);
    }}

    /* Resources Box */
    .resources-box {{
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 20px;
      padding: 24px;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 24px;
    }}

    @media (min-width: 640px) {{
      .resources-box {{
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }}
    }}

    .res-left h3 {{
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 4px;
    }}

    .res-left p {{
      font-size: 12px;
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
      padding: 10px 18px;
      border-radius: 999px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }}

    /* Mobile bar */
    .mobile-bar {{
      position: fixed;
      bottom: 12px;
      left: 12px;
      right: 12px;
      z-index: 999;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(94, 234, 212, 0.3);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      border-radius: 16px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}

    .mobile-bar-btn {{
      background: linear-gradient(135deg, #0d9488 0%, #10b981 100%);
      color: #ffffff;
      font-size: 13px;
      font-weight: 900;
      padding: 9px 18px;
      border-radius: 999px;
      box-shadow: 0 4px 10px rgba(13, 148, 136, 0.4);
      white-space: nowrap;
    }}

    footer {{
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: var(--slate-600);
      padding: 20px 0;
      border-top: 1px solid var(--slate-200);
    }}
  </style>
</head>
<body>

  <!-- TOP LIVE BAR -->
  <div class="top-live-bar">
    <span class="live-pulse"><span class="live-dot"></span> EN VIVO HOY</span>
    <span>Martes 20 de Octubre · 7:00 PM a 9:00 PM (Hora Colombia, GMT-5)</span>
  </div>

  <!-- FLOATING NAVBAR -->
  <div class="nav-wrap">
    <div class="nav-inner">
      <div class="nav-logo">
        {"<img src='" + logo_wappy + "' alt='WAPPY'>" if logo_wappy else "<strong>WAPPY</strong>"}
        <div class="nav-view-toggles">
          <button class="toggle-btn active" id="btn-view-deck" onclick="setViewMode('deck')">
            <span>🖥️</span> <span>Presentación</span>
          </button>
          <button class="toggle-btn" id="btn-view-guide" onclick="setViewMode('guide')">
            <span>📖</span> <span>Guía Completa</span>
          </button>
        </div>
      </div>
      <div class="nav-actions">
        <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn-meet-nav">
          <span>📹</span>
          <span>Google Meet</span>
        </a>
      </div>
    </div>
  </div>

  <div class="wrap">

    <!-- ==========================================================================
         SECCIÓN DE PRESENTACIÓN INTERACTIVA (SLIDE DECK EN VIVO)
         ========================================================================== -->
    <div id="presentation-mode">
      <div class="deck-container">
        <div class="deck-topbar">
          <div class="deck-title">
            <span>Diapositiva en Vivo</span>
            <span class="deck-counter" id="deck-counter">1 / 10</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8;">
            Usa las flechas <strong>← / →</strong> de tu teclado
          </div>
        </div>

        <div class="slide-progress-bar">
          <div class="slide-progress-fill" id="slide-progress"></div>
        </div>

        <div class="slide-viewport">

          <!-- SLIDE 1: PORTADA -->
          <div class="slide active" id="slide-1">
            <span class="slide-badge">Curso Ecosistema Autónomo SST · Clase 1</span>
            <h2>Google Antigravity como Potenciador de WAPPY</h2>
            <p class="slide-lead">
              De la operatividad documental a la prevención real: cómo conectar el cerebro normativo de WAPPY con la fábrica de triggers y automatizaciones de Antigravity en tu computador.
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card highlight">
                <h4>🧠 WAPPY</h4>
                <p>El Centro de Mando: Especialistas SST, matriz legal colombiana, comités, químicos y Tenshi Voice.</p>
              </div>
              <div class="slide-card highlight">
                <h4>⚡ Antigravity</h4>
                <p>El Brazo Ejecutor: Lee tus carpetas locales, ejecuta triggers programados y automatiza lo que la web no puede tocar.</p>
              </div>
              <div class="slide-card highlight">
                <h4>🤝 La Alianza</h4>
                <p>Prevención autónoma 24/7 sin que tengas que programar ni una sola línea de código compleja.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 2: BIENVENIDA Y ACUERDOS -->
          <div class="slide" id="slide-2">
            <span class="slide-badge">Acuerdos de Convivencia</span>
            <h2>Bienvenida y Reglas de Oro de Nuestra Clase</h2>
            <p class="slide-lead">
              Para garantizar que los 12 participantes dominen la herramienta y salgan hoy con su entorno operativo:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card">
                <h4>📷 Cámara Encendida (10 a 15 Min)</h4>
                <p>Obligatoria al inicio para saludarnos, verificar asistencia y calibrar expectativas humanas.</p>
              </div>
              <div class="slide-card">
                <h4>💻 Entorno Dual (PC + Celular)</h4>
                <p>Computador para Antigravity y celular a la mano para probar Tenshi Voice y WhatsApp.</p>
              </div>
              <div class="slide-card">
                <h4>🎙️ Micrófono & Preguntas</h4>
                <p>Silenciado por defecto. Usa la mano virtual o el chat; abriremos rondas de Q&A en cada bloque.</p>
              </div>
              <div class="slide-card">
                <h4>🤝 Debugging Colaborativo</h4>
                <p>Todos programamos en vivo. Si a uno le sale un error, compartimos pantalla: <em>el error de uno es la lección de todos</em>.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 3: INTRODUCCIÓN A LA IA (15 MINUTOS) -->
          <div class="slide" id="slide-3">
            <span class="slide-badge intro">Bloque 1 · Máximo 15 Minutos</span>
            <h2>Introducción a la IA: De la Charla Pasiva a la Acción Agéntica</h2>
            <p class="slide-lead">
              ¿Qué es la IA y por qué el modelo tradicional de "hacerle preguntas a un chat" ya quedó obsoleto en SST?
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4 class="lime">1. IA Predictiva</h4>
                <p>Calcula probabilidades y estadísticas. Útil para tendencias históricas de accidentalidad.</p>
              </div>
              <div class="slide-card">
                <h4 class="lime">2. IA Generativa (ChatGPT)</h4>
                <p>Redacta textos y responde preguntas. Pero es pasiva: <em>no tiene manos, no ejecuta ni lee tu disco duro</em>.</p>
              </div>
              <div class="slide-card highlight">
                <h4>3. IA Agéntica (Antigravity + WAPPY)</h4>
                <p>Planifica, razona, ejecuta herramientas, vigila carpetas, dispara triggers y trabaja sola en segundo plano.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 4: POR QUÉ CHATGPT FALLA EN SST -->
          <div class="slide" id="slide-4">
            <span class="slide-badge intro">Realidad del Sector</span>
            <h2>Por qué la IA Tradicional Falla en la Prevención de Riesgos</h2>
            <p class="slide-lead">
              El Sistema de Gestión de Seguridad y Salud en el Trabajo en Colombia no perdona la improvisación:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card">
                <h4>❌ Los Dolores del Chatbot Tradicional</h4>
                <p>• Alucinaciones normativas (inventa artículos del Decreto 1072 o Res. 0312).<br>• No recuerda el historial de tu empresa ni los hallazgos pasados.<br>• No puede abrir 50 PDFs de inspecciones en tu PC ni actualizar un Excel.</p>
              </div>
              <div class="slide-card highlight">
                <h4>✅ La Solución del Ecosistema WAPPY</h4>
                <p>• Agentes con contexto legal permanente e inviolable.<br>• Citas jurídicas textuales sin inventar datos.<br>• Conexión directa a tus archivos y carpetas locales mediante Antigravity.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 5: EL ROL DE WAPPY -->
          <div class="slide" id="slide-5">
            <span class="slide-badge">La Plataforma Madre</span>
            <h2>WAPPY: El Cerebro y Centro de Mando del SG-SST</h2>
            <p class="slide-lead">
              WAPPY nunca se reemplaza; es la base de datos viva y el equipo interdisciplinario que respalda tu gestión:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>👨‍⚕️ Agentes Especialistas</h4>
                <p>Abogado Laboral, Higienista, Médico Ocupacional, Experto en Riesgo Vial y Químico.</p>
              </div>
              <div class="slide-card">
                <h4>📊 Matrices Centralizadas</h4>
                <p>GTC 45, PESV (Res. 20223040040595), matriz legal, inventario SGA y ausentismo.</p>
              </div>
              <div class="slide-card">
                <h4>🎙️ Tenshi Voice</h4>
                <p>El asistente de voz en el celular para dictar hallazgos en campo manos libres.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 6: EL ROL DE ANTIGRAVITY -->
          <div class="slide" id="slide-6">
            <span class="slide-badge">El Super-Motor Local</span>
            <h2>Antigravity: El Brazo Ejecutor que Potencia a WAPPY</h2>
            <p class="slide-lead">
              ¿Por qué necesitas a Antigravity en tu computador? Para hacer todo lo que una web en la nube no puede tocar:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card highlight">
                <h4>📁 Lectura de Archivos Locales</h4>
                <p>Lee 500 contratos o certificados médicos en tu disco duro y genera el consolidado para WAPPY.</p>
              </div>
              <div class="slide-card highlight">
                <h4>⏰ Triggers & Automatizaciones</h4>
                <p>Se despierta solo por reloj (cron) o cuando entra un archivo nuevo a una carpeta.</p>
              </div>
              <div class="slide-card highlight">
                <h4>🔌 Conexión MCP Universal</h4>
                <p>Ejecuta las 55+ herramientas de WAPPY como si fuera un prevencionista operando el sistema 24/7.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 7: LOS TRIGGERS EN ANTIGRAVITY -->
          <div class="slide" id="slide-7">
            <span class="slide-badge">Superpoder Clave</span>
            <h2>¿Antigravity Puede Tener Triggers? ¡Absolutamente Sí!</h2>
            <p class="slide-lead">
              Los triggers son disparadores automáticos que ponen a trabajar a tus agentes sin que tú estés frente a la pantalla:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card">
                <h4>⏰ 1. Trigger Temporal (Cron Schedules)</h4>
                <p><strong>Ejemplo:</strong> Todos los lunes a las 6:00 AM, audita el cronograma de WAPPY y redacta recordatorios para los responsables de actividades vencidas.</p>
              </div>
              <div class="slide-card">
                <h4>📂 2. Trigger por Carpeta (File Watcher)</h4>
                <p><strong>Ejemplo:</strong> Al caer fotos tomadas en obra a la carpeta <code>/Fotos_Inspeccion</code>, las analiza con visión computacional y registra el acto inseguro en WAPPY.</p>
              </div>
              <div class="slide-card">
                <h4>🚨 3. Trigger por Umbral Reactivo</h4>
                <p><strong>Ejemplo:</strong> Si el ausentismo laboral supera el 5% en WAPPY, se activa de inmediato para pedirle al Médico Ocupacional un reporte epidemiológico.</p>
              </div>
              <div class="slide-card">
                <h4>⚡ 4. Trigger por Webhooks / Subagentes</h4>
                <p><strong>Ejemplo:</strong> Al diligenciar un formulario de Google o WhatsApp, se dispara un subagente en segundo plano sin congelar tu computador.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 8: CÓMO SE CONECTAN VIA MCP -->
          <div class="slide" id="slide-8">
            <span class="slide-badge">Arquitectura del Puente</span>
            <h2>El Conector MCP: El Puerto USB-C entre Antigravity y WAPPY</h2>
            <p class="slide-lead">
              El <strong>Model Context Protocol (MCP)</strong> permite a Antigravity controlar y consultar a WAPPY directamente:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>1. Antigravity Pregunta</h4>
                <p>El agente local necesita saber qué tareas de SST están pendientes en la empresa.</p>
              </div>
              <div class="slide-card">
                <h4>2. MCP Ejecuta la Herramienta</h4>
                <p>Llama a <code>wappy_consultar_cronograma_sst</code> en tiempo real con seguridad.</p>
              </div>
              <div class="slide-card highlight">
                <h4>3. WAPPY Responde y se Actualiza</h4>
                <p>WAPPY entrega la información y recibe los reportes generados por Antigravity de inmediato.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 9: PROYECTO 1 EN VIVO -->
          <div class="slide" id="slide-9">
            <span class="slide-badge">Laboratorio Práctico</span>
            <h2>Proyecto en Vivo: Creación de tu Primer Trigger de Seguridad</h2>
            <p class="slide-lead">
              Hoy configuramos en vivo una regla persistente (<code>AGENTS.md</code>) y una habilidad (<code>SKILL.md</code>) en tu máquina:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>Paso 1: Blindar la Regla Normativa</h4>
                <p>Definir que el agente solo aplique la GTC 45 y el Decreto 1072, citando artículo y sanción correspondiente.</p>
              </div>
              <div class="slide-card highlight">
                <h4>Paso 2: Conectar el Disparador a WAPPY</h4>
                <p>Hacer que el agente clasifique una condición insegura y la radique directamente en el panel de control de WAPPY.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 10: RETO SEMANAL -->
          <div class="slide" id="slide-10">
            <span class="slide-badge">Reto de la Semana</span>
            <h2>Tu Misión para la Clase 2 (Semana 1)</h2>
            <p class="slide-lead">
              El conocimiento se fija cuando lo aplicas al día siguiente en tus empresas clientes:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>🎯 El Reto Técnico</h4>
                <p>Dejar instalado Antigravity en tu computador y configurar tu primer trigger que consulte a WAPPY antes del próximo martes.</p>
              </div>
              <div class="slide-card">
                <h4>🤝 Soporte VIP en WhatsApp</h4>
                <p>Si te trabas con un comando o permiso, envías captura al grupo privado y te ayudamos paso a paso.</p>
              </div>
            </div>
          </div>

        </div>

        <div class="deck-footer">
          <div class="deck-nav-btns">
            <button class="btn-slide-nav" id="btn-prev" onclick="prevSlide()" disabled>← Anterior</button>
            <button class="btn-slide-nav" id="btn-next" onclick="nextSlide()">Siguiente →</button>
          </div>
          <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="btn-meet-nav">
            <span>📹</span> Entrar a Google Meet (7:00 PM)
          </a>
        </div>
      </div>
    </div>

    <!-- ==========================================================================
         SECCIÓN GUÍA COMPLETA (MODO GUÍA DE ESTUDIO CONTINUA)
         ========================================================================== -->
    <div id="guide-mode" style="display: block;">

      <!-- HERO BANNER -->
      <section class="hero">
        <span class="hero-badge">Especialización Práctica SST con IA Agéntica</span>
        <h1>Clase 1: Introducción a la IA & Google Antigravity como Potenciador de WAPPY</h1>
        <p class="hero-sub">
          Aprende a conectar el centro de mando y cumplimiento legal de WAPPY con la potencia de automatización local, carpetas y triggers de Google Antigravity.
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
        <h3 style="font-family: var(--font-display); font-size: 19px; font-weight: 900; color: #042f2e;">
          ¿Por qué Antigravity NO reemplaza a WAPPY, sino que lo multiplica?
        </h3>
        <p style="font-size: 13px; color: #0f766e; margin-top: 4px;">
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
          <span class="sec-tag">Cronograma 7:00 PM – 9:00 PM</span>
          <h2 class="sec-title">Paso a Paso de la Clase de Hoy</h2>
        </div>

        <!-- PASO 1 -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;">Apertura</span>
              <span class="step-time">7:00 PM – 7:15 PM (15 Minutos Máx)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#b45309;">Concepto Clave</span>
          </div>
          <h3 class="step-title">1. Introducción a la Inteligencia Artificial (Fundamentos Clave)</h3>
          <p class="step-desc">
            En 15 minutos desmitificamos la IA: qué es, qué no es, y por qué el modelo tradicional de "hacerle preguntas a un chatbot" ya quedó atrás para los prevencionistas de riesgos.
          </p>
          <ul class="step-list">
            <li><strong>De la IA Generativa (ChatGPT) a la IA Agéntica:</strong> Por qué responder texto no es suficiente cuando se gestiona una matriz de 300 peligros o 60 estándares mínimos.</li>
            <li><strong>Por qué no necesitas ser programador:</strong> La nueva era agéntica se programa en lenguaje natural, reglas de negocio y lógica de procesos.</li>
            <li><strong>El triángulo del prevencionista moderno:</strong> LLMs (modelos de lenguaje) + RAG (contexto normativo sin alucinaciones) + Agentes ejecutores de herramientas.</li>
          </ul>
        </div>

        <!-- PASO 2 -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Módulo 02</span>
              <span class="step-time">7:15 PM – 7:45 PM (30 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#0f766e;">La Alianza Estratégica</span>
          </div>
          <h3 class="step-title">2. WAPPY (Cerebro SST) + Antigravity (Fábrica de Triggers y Automatizaciones)</h3>
          <p class="step-desc">
            Comprende la división de roles: WAPPY es el cerebro normativo y Antigravity es el brazo ejecutor local que hace lo que una web en la nube no puede tocar.
          </p>
          <ul class="step-list">
            <li><strong>El rol inamovible de WAPPY:</strong> Donde residen tus agentes especialistas (Médico, Abogado, Higienista, Riesgo Vial), la matriz legal colombiana, químicos SGA y Tenshi Voice.</li>
            <li><strong>El rol multiplicador de Antigravity:</strong> Instalado en tu computador, lee tus carpetas locales, procesa PDFs masivos y ejecuta tareas en segundo plano.</li>
            <li><strong>Los 4 Pilares de Antigravity:</strong> Workflows (guías de procesos), Rules (reglas inviolables), Skills (habilidades modulares) y MCP (el conector universal).</li>
          </ul>
        </div>

        <!-- PASO 3 -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Módulo 03</span>
              <span class="step-time">7:45 PM – 8:25 PM (40 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#0f766e;">Superpoderes con Triggers</span>
          </div>
          <h3 class="step-title">3. Triggers en Antigravity para Potenciar a WAPPY</h3>
          <p class="step-desc">
            Aprende a crear disparadores automáticos para que el sistema trabaje solo mientras tú estás en campo o con clientes.
          </p>
          <ul class="step-list">
            <li><strong>Trigger 1 · Cron / Horario:</strong> El auditor semanal de WAPPY que despierta los lunes a las 6:00 AM para revisar el cronograma de actividades y alertar a la gerencia.</li>
            <li><strong>Trigger 2 · Carpetas Locales (File Watcher):</strong> Al guardar fotos de obra o inspecciones en el PC, Antigravity las analiza y registra el reporte de acto/condición en WAPPY.</li>
            <li><strong>Trigger 3 · Umbrales Reactivos:</strong> Activación automática de planes de acción cuando un indicador en WAPPY sobrepasa el límite permitido.</li>
            <li><strong>Conexión MCP:</strong> Cómo Antigravity ejecuta en tiempo real las 55+ herramientas nativas de WAPPY.</li>
          </ul>
        </div>

        <!-- PASO 4 -->
        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Módulo 04</span>
              <span class="step-time">8:25 PM – 9:00 PM (35 Minutos)</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#ef4444;">Laboratorio en Vivo</span>
          </div>
          <h3 class="step-title">4. Laboratorio Práctico en Vivo #1 & Reto Semanal</h3>
          <p class="step-desc">
            Construcción en vivo de tu primer trigger local en tu máquina y asignación del reto de la semana.
          </p>
          <ul class="step-list">
            <li><strong>Taller guiado:</strong> Redacción de tu archivo <code>AGENTS.md</code> y creación de tu primera habilidad conectada a WAPPY.</li>
            <li><strong>Ronda de preguntas y debugging colaborativo:</strong> Ajuste de variables y resolución de dudas técnicas en vivo.</li>
            <li><strong>Reto de la Semana (Laboratorio 1):</strong> Dejar configurado tu primer trigger que consulte a WAPPY antes del próximo martes.</li>
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
> 3. WAPPY es tu fuente central de verdad: consulta siempre los datos reales de la empresa.</pre>
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
1. Detecta la nueva fotografía o reporte en la carpeta vigilada.
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

  <!-- FLOATING BOTTOM BAR (MOBILE ONLY) -->
  <div class="mobile-bar">
    <div class="mobile-bar-info">
      <span class="live-dot"></span>
      <div>
        <div style="font-size:11px; font-weight:800; color:#ffffff;">CLASE EN VIVO HOY</div>
        <div style="font-size:10px; color:#99f6e4;">7:00 PM (Abre 6:50 PM)</div>
      </div>
    </div>
    <a href="https://meet.google.com/xvz-jmvv-iym" target="_blank" rel="noopener noreferrer" class="mobile-bar-btn">
      Entrar a Meet 👉
    </a>
  </div>

  <script>
    // Slide Deck Controller
    let currentSlide = 1;
    const totalSlides = 10;

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
        btn.classList.add('copied');
        setTimeout(() => {{
          btn.innerText = originalText;
          btn.classList.remove('copied');
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
