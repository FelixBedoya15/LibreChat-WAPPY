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
  <title>Clase 1: Fundamentos de IA, WAPPY & Google Antigravity | Ecosistema Autónomo SST</title>
  <meta name="description" content="Guía pedagógica paso a paso desde cero. Conceptos básicos de IA (LLMs, Tokens, MCP, API Keys), instalación de Antigravity, proyectos locales, conexión a WAPPY, Drive, NotebookLM y creación de triggers y skills.">
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
      min-height: 400px;
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      touch-action: pan-y;
      user-select: none;
    }}

    @media (min-width: 640px) {{
      .slide-viewport {{
        min-height: 500px;
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
      width: 6.66%;
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
         SECCIÓN DE PRESENTACIÓN INTERACTIVA (15 SLIDES DIDÁCTICAS PASO A PASO)
         ========================================================================== -->
    <div id="presentation-mode">
      <div class="deck-container">
        <div class="deck-topbar">
          <div class="deck-title">
            <span class="deck-counter" id="deck-counter">1 / 15</span>
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
            <h2>Fundamentos de IA, WAPPY & Google Antigravity</h2>
            <p class="slide-lead">
              Aprende desde cero y paso a paso: qué es la IA, qué son LLMs, Tokens y MCP, cómo instalar Antigravity, crear tu primer proyecto en carpetas locales y alimentar a WAPPY con triggers.
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card highlight">
                <h4>🐣 1. Desde Cero Absoluto</h4>
                <p>Conceptos básicos explicados de forma clara y sin tecnicismos enredados.</p>
              </div>
              <div class="slide-card highlight">
                <h4>⚡ 2. Antigravity + Carpetas</h4>
                <p>Tu primer proyecto conectado a tus archivos locales y a Google Drive.</p>
              </div>
              <div class="slide-card highlight">
                <h4>🧠 3. Alimentar a WAPPY</h4>
                <p>Conexión vía MCP: WAPPY es el cerebro SST y Antigravity tu fábrica de tareas.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 2: BIENVENIDA Y REGLAS DE ORO -->
          <div class="slide" id="slide-2">
            <span class="slide-badge amber">Acuerdos de Convivencia</span>
            <h2>Bienvenida y Reglas de Oro de Nuestra Clase</h2>
            <p class="slide-lead">
              Para garantizar que los 12 participantes dominen la herramienta y salgan hoy con su entorno operativo:
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
                <p>Silenciado por defecto. Usa la mano virtual o el chat; abriremos rondas de Q&A en cada bloque.</p>
              </div>
              <div class="slide-card">
                <h4>🤝 4. Debugging Colaborativo</h4>
                <p>Todos programamos en vivo. Compartimos pantalla para resolver errores: <em>el error de uno es la lección de todos</em>.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 3: CONCEPTOS BÁSICOS DE IA (QUÉ ES IA, MODELOS Y LLM) -->
          <div class="slide" id="slide-3">
            <span class="slide-badge intro">Conceptos Básicos · Parte 1</span>
            <h2>¿Qué es la IA, los Modelos y los LLMs? (Explicado Sencillo)</h2>
            <p class="slide-lead">
              Hagamos de cuenta que le explicamos a un niño: las bases que todos debemos entender antes de programar agentes:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card highlight">
                <h4>🤖 1. ¿Qué es la IA?</h4>
                <p>En vez de que tú le digas a una computadora cada clic rígido, la computadora <em>aprende a razonar y entender</em> como un asistente humano ultra veloz.</p>
              </div>
              <div class="slide-card">
                <h4>🧠 2. ¿Qué es un Modelo?</h4>
                <p>Es el "cerebro matemático" ya entrenado. Ejemplo: Gemini (de Google), Claude (de Anthropic) o GPT (de OpenAI). Es el motor pensante.</p>
              </div>
              <div class="slide-card highlight">
                <h4>📖 3. ¿Qué es un LLM?</h4>
                <p><em>Large Language Model</em>: Un cerebro especializado en palabras humanas. Lee, redacta y comprende normas legales de SST en segundos.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 4: TOKENS Y CLAVES API -->
          <div class="slide" id="slide-4">
            <span class="slide-badge intro">Conceptos Básicos · Parte 2</span>
            <h2>¿Qué son los Tokens y qué son las Claves API?</h2>
            <p class="slide-lead">
              Dos conceptos técnicos que suenan difíciles pero que en realidad son muy simples:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>🪙 1. Los Tokens (Las "Moneditas" de la IA)</h4>
                <p>• Los LLM no leen letras sueltas; leen trocitos de palabras llamados <strong>tokens</strong> (aprox. 1 palabra = 1 o 2 tokens).<br>• La memoria del agente se mide en tokens: si un documento tiene 10.000 palabras, consume ~15.000 tokens.<br>• Aprenderemos a cuidar los tokens para que el agente responda rápido y sin saturarse.</p>
              </div>
              <div class="slide-card lime-border">
                <h4 class="lime">🔑 2. Las Claves API (API Keys)</h4>
                <p>• Es como la <strong>llave secreta o contraseña digital</strong> de tu empresa.<br>• Permite que un programa en tu computador (como Antigravity) toque la puerta de Google o WAPPY y le diga: <em>"Hola, soy Félix y tengo permiso para usar este cerebro"</em>.<br>• Nunca se comparte públicamente porque da acceso a tu cuenta.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 5: QUÉ ES MCP -->
          <div class="slide" id="slide-5">
            <span class="slide-badge intro">Conceptos Básicos · Parte 3</span>
            <h2>¿Qué es MCP? El Cable USB-C de la Inteligencia Artificial</h2>
            <p class="slide-lead">
              El invento más importante para la automatización moderna de procesos y prevención de riesgos:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>El Problema del Pasado</h4>
                <p>ChatGPT o Gemini normales solo hablaban texto en una cajita. <em>No tenían manos</em>: no podían abrir tu base de datos ni cambiar un registro.</p>
              </div>
              <div class="slide-card highlight">
                <h4>El Salto MCP</h4>
                <p><strong>Model Context Protocol:</strong> Es el puerto universal estándar. Le conecta brazos, ojos y herramientas a la IA para ejecutar acciones reales.</p>
              </div>
              <div class="slide-card lime-border">
                <h4 class="lime">MCP en WAPPY</h4>
                <p>WAPPY tiene su propio servidor MCP. Gracias a él, Antigravity puede leer trabajadores, alimentar la matriz GTC 45 y auditar el cronograma en vivo.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 6: QUÉ ES ANTIGRAVITY -->
          <div class="slide" id="slide-6">
            <span class="slide-badge">La Herramienta de Google</span>
            <h2>¿Qué es Google Antigravity y de Quién es?</h2>
            <p class="slide-lead">
              Conoce la plataforma donde construiremos todo nuestro ecosistema agéntico local:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card highlight">
                <h4>🏢 1. De Quién Es</h4>
                <p>Creado por <strong>Google DeepMind</strong>, los líderes mundiales en investigación de inteligencia artificial avanzada.</p>
              </div>
              <div class="slide-card">
                <h4>🤖 2. Modelos que Utiliza</h4>
                <p>Acceso directo a la familia <strong>Gemini 2.5 Flash / Pro</strong> y Gemini 1.5, además de poder orquestar modelos especializados.</p>
              </div>
              <div class="slide-card highlight">
                <h4>🛠️ 3. Para Qué Sirve</h4>
                <p>Es un entorno agéntico: lee tus carpetas, ejecuta código, usa herramientas MCP y automatiza tareas rutinarias en tu computador.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 7: DESCARGA E INSTALACIÓN PASO A PASO -->
          <div class="slide" id="slide-7">
            <span class="slide-badge">Instalación "Para Niños"</span>
            <h2>Cómo Descargar e Instalar Antigravity Paso a Paso</h2>
            <p class="slide-lead">
              Tres pasos sencillos y claros para que nadie se quede atrás durante la sesión de hoy:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>Paso 1: Descargar</h4>
                <p>Descargas el instalador oficial de Antigravity para tu sistema operativo (Windows, macOS o Linux) y lo ejecutas con siguiente-siguiente.</p>
              </div>
              <div class="slide-card highlight">
                <h4>Paso 2: Cuenta Google</h4>
                <p>Al abrirlo por primera vez, te pide iniciar sesión con tu cuenta de Google. Con eso queda autorizada la conexión con los modelos Gemini.</p>
              </div>
              <div class="slide-card lime-border">
                <h4 class="lime">Paso 3: Verificación</h4>
                <p>Abres tu terminal o la consola de Antigravity y escribes <code>agy --version</code> para confirmar que tu motor está 100% activo.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 8: CREAR UN PROYECTO Y UN CHAT -->
          <div class="slide" id="slide-8">
            <span class="slide-badge">Primeros Pasos</span>
            <h2>Crear tu Primer Proyecto y tu Primer Chat en Antigravity</h2>
            <p class="slide-lead">
              ¿Qué es un proyecto en Antigravity? Es simplemente <strong>UNA CARPETA en tu propio computador</strong>:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card highlight">
                <h4>1. Crear la Carpeta</h4>
                <p>Creas una carpeta en tu computador, por ejemplo: <code>C:/Mi_Empresa_SST/</code> y la abres en Antigravity (File → Open Folder).</p>
              </div>
              <div class="slide-card">
                <h4>2. Subcarpetas de Trabajo</h4>
                <p>Creamos adentro carpetas claras: <code>/inspecciones</code>, <code>/epp</code>, <code>/normativa</code> e <code>/informes</code>.</p>
              </div>
              <div class="slide-card highlight">
                <h4>3. Iniciar el Chat</h4>
                <p>Abres el panel de chat de Antigravity. ¡Listo! Todo lo que le pidas al agente lo hará mirando los archivos de esa carpeta.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 9: WAPPY Y ANTIGRAVITY (SINERGIA) -->
          <div class="slide" id="slide-9">
            <span class="slide-badge amber">Concepto Maestro</span>
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

          <!-- SLIDE 10: CONECTAR A WAPPY VÍA MCP -->
          <div class="slide" id="slide-10">
            <span class="slide-badge">El Puente Técnico</span>
            <h2>Cómo Conectar Antigravity con WAPPY vía MCP</h2>
            <p class="slide-lead">
              Como ya sabemos qué es un MCP (el cable universal), conectarlo es solo pegar la configuración:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>1. Entrar a WAPPY</h4>
                <p>En tu panel de WAPPY o perfil de usuario, copias las credenciales del servidor MCP (servidor seguro de herramientas).</p>
              </div>
              <div class="slide-card highlight">
                <h4>2. Pegar en Antigravity</h4>
                <p>En el archivo de configuración <code>mcp_config.json</code> de Antigravity pegas la URL de WAPPY Cloud.</p>
              </div>
              <div class="slide-card lime-border">
                <h4 class="lime">3. Magia Instantánea</h4>
                <p>Tu agente local ahora puede llamar funciones como <code>wappy_consultar_trabajadores</code> o <code>wappy_alimentar_matriz_gtc45</code>.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 11: ALIMENTAR A WAPPY DESDE ANTIGRAVITY -->
          <div class="slide" id="slide-11">
            <span class="slide-badge">Flujo de Datos Real</span>
            <h2>Cómo Alimentar a WAPPY desde Antigravity y sus Carpetas</h2>
            <p class="slide-lead">
              ¿De dónde sale la información y cómo viaja automáticamente hacia WAPPY?
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card">
                <h4>1. El Origen: Tu Carpeta</h4>
                <p>Guardas en tu carpeta local un archivo: el Excel de nómina con 50 empleados nuevos o las fotos de una inspección en obra.</p>
              </div>
              <div class="slide-card highlight">
                <h4>2. El Proceso: Antigravity</h4>
                <p>El agente lee el archivo en tu PC, limpia los datos, clasifica los riesgos según la GTC 45 y los estructura en JSON.</p>
              </div>
              <div class="slide-card lime-border">
                <h4 class="lime">3. El Destino: WAPPY</h4>
                <p>Antigravity dispara la herramienta MCP y guarda todo en WAPPY. Tu cliente o gerente entra a WAPPY y ya ve su matriz al día.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 12: CONECTAR NOTEBOOKLM Y GOOGLE DRIVE -->
          <div class="slide" id="slide-12">
            <span class="slide-badge">Ecosistema Google</span>
            <h2>Darle Acceso a Google Drive y a Google NotebookLM</h2>
            <p class="slide-lead">
              No solo carpetas locales: el agente también puede leer tu nube corporativa y consultar leyes sin inventar nada:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>📚 Google NotebookLM: Memoria Jurídica</h4>
                <p>• Subes el Decreto 1072 (300 págs), la Res. 0312, 1401 y el PESV.<br>• El agente extrae citas exactas con página y artículo sin alucinaciones.<br>• Genera podcasts explicativos en audio para capacitaciones del COPASST.</p>
              </div>
              <div class="slide-card highlight">
                <h4>☁️ Google Drive: Archivo Legal de 20 Años</h4>
                <p>• Cumplimiento del archivo digital obligatorio de 20 años (Dec. 1072 Art. 2.2.4.6.13).<br>• El agente busca contratos, certificados y exámenes médicos en tu Drive y los enlaza con WAPPY.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 13: CÓMO CREAR TRIGGERS -->
          <div class="slide" id="slide-13">
            <span class="slide-badge lime-border">Automatización Real</span>
            <h2>Cómo Crear Triggers (Disparadores Automáticos)</h2>
            <p class="slide-lead">
              El ejemplo que todos soñamos: llegas a la oficina, prendes el computador y la IA ya hizo el trabajo por ti:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>⏰ Trigger por Temporizador / Scroll</h4>
                <p><strong>Escenario:</strong> Configuras un trigger para que al prender tu equipo o interactuar con el chat, el agente lea automáticamente los archivos nuevos del Google Drive de la empresa.</p>
              </div>
              <div class="slide-card highlight">
                <h4>📊 Informes y Registro Automático</h4>
                <p>El agente procesa las novedades de Drive, redacta el informe de actividades pendientes, lo guarda en tu carpeta y registra el avance en WAPPY.</p>
              </div>
              <div class="slide-card">
                <h4>📂 Trigger por Carpeta Vigilada</h4>
                <p>Cualquier foto que caiga en <code>/inspecciones</code> se analiza de inmediato y se sube como acto/condición insegura.</p>
              </div>
              <div class="slide-card">
                <h4>🚨 Trigger por Umbral en WAPPY</h4>
                <p>Si el ausentismo en WAPPY supera el 5%, el agente te despierta una alerta con el plan epidemiológico listo.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 14: CREAR AGENTES, SKILLS Y WORKFLOWS -->
          <div class="slide" id="slide-14">
            <span class="slide-badge">Los 3 Pilares</span>
            <h2>Cómo Crear Agentes, Skills y Workflows</h2>
            <p class="slide-lead">
              Los tres bloques con los que construyes cualquier asistente autónomo en tu empresa:
            </p>
            <div class="slide-content-grid three-cols">
              <div class="slide-card highlight">
                <h4>1. Agentes (`AGENTS.md`)</h4>
                <p>Es la <strong>personalidad y constitución</strong> del asistente. Le dices: <em>"Eres un Auditor SST de Colombia, nunca inventes leyes y consulta WAPPY"</em>.</p>
              </div>
              <div class="slide-card">
                <h4>2. Skills (`SKILL.md`)</h4>
                <p>Es la <strong>receta paso a paso</strong> para una tarea rutinaria. Ejemplo: <em>"Cómo auditar la entrega de EPP en 4 pasos exactos"</em>.</p>
              </div>
              <div class="slide-card highlight">
                <h4>3. Workflows (`/comandos`)</h4>
                <p>Son <strong>atajos de teclado</strong> para secuencias repetitivas. Escribes <code>/auditar</code> y el agente ejecuta todo el proceso solo.</p>
              </div>
            </div>
          </div>

          <!-- SLIDE 15: TALLER EN VIVO Y RETO #1 -->
          <div class="slide" id="slide-15">
            <span class="slide-badge amber">Laboratorio & Reto</span>
            <h2>Laboratorio en Vivo y Reto Semanal #1</h2>
            <p class="slide-lead">
              Todo lo aprendido se consolida haciéndolo juntos en pantalla compartida:
            </p>
            <div class="slide-content-grid two-cols">
              <div class="slide-card highlight">
                <h4>🎯 Reto de la Semana (Clase 1 → Clase 2)</h4>
                <p>1. Instalar Antigravity en tu computador personal o corporativo.<br>2. Crear tu carpeta de proyecto SST con el archivo <code>AGENTS.md</code>.<br>3. Vincular tu WAPPY Cloud vía MCP y probar tu primer prompt de consulta.</p>
              </div>
              <div class="slide-card">
                <h4>🤝 Acompañamiento VIP en WhatsApp</h4>
                <p>Cualquier duda, pantallazo o traba con comandos, la envías al grupo exclusivo de WhatsApp de los 12 alumnos y te ayudamos paso a paso.</p>
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
         SECCIÓN GUÍA COMPLETA (MODO GUÍA DE ESTUDIO PASO A PASO)
         ========================================================================== -->
    <div id="guide-mode" style="display: none;">

      <!-- HERO BANNER -->
      <section class="hero">
        <span class="hero-badge">Especialización Práctica SST con IA Agéntica</span>
        <h1>Clase 1: Fundamentos de IA, WAPPY & Google Antigravity</h1>
        <p class="hero-sub">
          Aprende desde cero y con ejemplos sencillos: qué es la IA, LLMs, tokens y MCP, cómo instalar Antigravity, crear proyectos en tus carpetas, conectar Google Drive y NotebookLM, y alimentar a WAPPY con triggers y automatizaciones.
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

      <!-- SECCIÓN: CONCEPTOS BÁSICOS EXPLICADOS FÁCIL -->
      <section>
        <div class="sec-header">
          <span class="sec-tag">Para Aprender Desde Cero</span>
          <h2 class="sec-title">1. Los Conceptos Básicos que Debemos Conocer Todos</h2>
        </div>

        <div class="step-card">
          <h3 class="step-title">Glosario Amigable de Inteligencia Artificial ("Explicado para Niños")</h3>
          <p class="step-desc">
            Antes de entrar a configurar herramientas, entendamos con analogías muy sencillas las palabras que escuchamos a diario:
          </p>
          <ul class="step-list">
            <li><strong>¿Qué es la Inteligencia Artificial (IA)?:</strong> Es enseñarle a una computadora a aprender de ejemplos, razonar y entender el lenguaje humano en lugar de solo seguir botones duros y predecibles.</li>
            <li><strong>¿Qué es un Modelo de IA?:</strong> Es el "cerebro entrenado". Imagina un cerebro que leyó millones de libros y sabe responder preguntas complejas. Ejemplos de modelos: <em>Gemini</em> (de Google), <em>Claude</em> (de Anthropic) y <em>GPT</em> (de OpenAI).</li>
            <li><strong>¿Qué es un LLM (Large Language Model)?:</strong> Un modelo gigante especializado en entender y generar palabras y textos con lógica humana. Es capaz de leer el Decreto 1072 en segundos y redactar planes de mejora.</li>
            <li><strong>¿Qué son los Tokens?:</strong> Son las "moneditas o sílabas" con las que piensa la IA. Una palabra promedio equivale a 1 o 2 tokens. La memoria del agente (ventana de contexto) se mide en miles o millones de tokens.</li>
            <li><strong>¿Qué son las Claves API (API Keys)?:</strong> Es la contraseña secreta o llave digital que le das a un programa (como Antigravity) para conectarse de forma segura con el cerebro de Google o con WAPPY.</li>
            <li><strong>¿Qué es el MCP (Model Context Protocol)?:</strong> Es el **cable USB-C universal** de la inteligencia artificial. Antes, los modelos solo respondían texto plano; con MCP se les conectan "brazos y ojos" para que puedan leer bases de datos, carpetas y sistemas externos.</li>
          </ul>
        </div>
      </section>

      <!-- SECCIÓN: QUÉ ES ANTIGRAVITY Y CÓMO SE INSTALA -->
      <section>
        <div class="sec-header">
          <span class="sec-tag">La Plataforma de Trabajo</span>
          <h2 class="sec-title">2. Google Antigravity: Qué Es, Instalación y Primer Proyecto</h2>
        </div>

        <div class="step-card">
          <div class="step-header">
            <div class="step-tag-wrap">
              <span class="step-pill">Paso a Paso</span>
              <span class="step-time">Setup Completo en Vivo</span>
            </div>
          </div>
          <h3 class="step-title">Descarga, Instalación y Creación de tu Carpeta de Proyecto</h3>
          <p class="step-desc">
            Antigravity es el entorno de agentes autónomos creado por **Google DeepMind** que da acceso a los modelos **Gemini 2.5 y 1.5 Pro**:
          </p>
          <ul class="step-list">
            <li><strong>Paso 1 · Instalación:</strong> Descarga el instalador oficial para tu computador (Windows o Mac) e inicia sesión con tu cuenta de Google.</li>
            <li><strong>Paso 2 · ¿Qué es un Proyecto?:</strong> En Antigravity, un proyecto es simplemente <strong>UNA CARPETA en tu computador</strong> (ejemplo: <code>C:/Mi_Empresa_SST/</code>). No necesitas bases de datos complejas; el agente vigilará lo que pongas allí.</li>
            <li><strong>Paso 3 · Subcarpetas sugeridas:</strong> Crea dentro carpetas como <code>/inspecciones</code>, <code>/epp</code>, <code>/normativa</code> y <code>/informes</code>.</li>
            <li><strong>Paso 4 · Tu Primer Chat:</strong> Al abrir la carpeta en Antigravity y pulsar "Nuevo Chat", el agente ya tiene acceso directo a todos los archivos que estén dentro de esa carpeta.</li>
          </ul>
          <div class="code-box">
            <div class="code-box-header">
              <span class="code-box-title">💻 Terminal · Comprobar Antigravity</span>
              <button class="btn-copy" onclick="copyCode('cmd-install', this)">Copiar</button>
            </div>
            <pre class="code-content" id="cmd-install"># Verificar que Antigravity está instalado y listo
agy --version</pre>
          </div>
        </div>
      </section>

      <!-- SECCIÓN: CONEXIÓN A WAPPY VÍA MCP -->
      <section>
        <div class="sec-header">
          <span class="sec-tag">El Puente Inteligente</span>
          <h2 class="sec-title">3. Conectar Antigravity con WAPPY vía MCP y Alimentar Datos</h2>
        </div>

        <div class="step-card">
          <h3 class="step-title">Cómo se Comunican y Alimentan tus Carpetas con WAPPY Cloud</h3>
          <p class="step-desc">
            Aquí es donde se produce la verdadera magia del ecosistema:
          </p>
          <ul class="step-list">
            <li><strong>Obtener la conexión en WAPPY:</strong> En tu cuenta de WAPPY copias la URL del servidor MCP con tus credenciales seguras.</li>
            <li><strong>Pegar en Antigravity:</strong> Se añade la configuración MCP a tu espacio de trabajo para habilitar las 55+ herramientas nativas de WAPPY.</li>
            <li><strong>¿De dónde sale la información?:</strong> De los archivos de tus carpetas (un listado de trabajadores en Excel, fotos de condiciones inseguras tomadas en campo o certificados de entrega de EPP).</li>
            <li><strong>¿Cómo se alimenta WAPPY?:</strong> Antigravity procesa el archivo local en tu computador, valida que cumpla las normas colombianas y llama a la herramienta MCP (ej: <code>wappy_alimentar_matriz_gtc45</code> o <code>wappy_registrar_trabajador</code>) para guardar todo de forma automática en WAPPY.</li>
          </ul>
        </div>
      </section>

      <!-- SECCIÓN: GOOGLE DRIVE Y NOTEBOOKLM -->
      <section>
        <div class="sec-header">
          <span class="sec-tag">Almacenamiento y Memoria</span>
          <h2 class="sec-title">4. Conectar con Google Drive y Google NotebookLM</h2>
        </div>

        <div class="step-card">
          <h3 class="step-title">Archivo de 20 Años y Memoria Legal Libre de Alucinaciones</h3>
          <ul class="step-list">
            <li><strong>Google NotebookLM:</strong> Cargas los decretos y resoluciones oficiales completas (Decreto 1072/15, Res. 0312/19, Res. 1401/07). El agente consulta citas textuales exactas con página y artículo, garantizando que ninguna recomendación invente normas. Además, puede generar resúmenes en audio tipo podcast para capacitar trabajadores.</li>
            <li><strong>Google Drive Corporativo:</strong> Conectas Antigravity a tu Google Drive para cumplir con la obligación legal de conservar el archivo del SG-SST durante 20 años (Artículo 2.2.4.6.13 del Decreto 1072). El agente rescata evidencias, actas firmadas y carpetas compartidas para alimentar a WAPPY.</li>
          </ul>
        </div>
      </section>

      <!-- SECCIÓN: TRIGGERS, AGENTES, SKILLS Y WORKFLOWS -->
      <section>
        <div class="sec-header">
          <span class="sec-tag">Superpoderes Autónomos</span>
          <h2 class="sec-title">5. Triggers, Agentes, Skills y Workflows</h2>
        </div>

        <div class="step-card">
          <h3 class="step-title">Cómo Hacer que la IA Trabaje Sola Mientras Tú Haces Otra Cosa</h3>
          <p class="step-desc">
            El objetivo definitivo de la clase: aprender a programar disparadores automáticos:
          </p>
          <ul class="step-list">
            <li><strong>Triggers por Inicio / Interacción:</strong> Llegas a la oficina, prendes tu computador y abres tu chat; el agente se dispara automáticamente, revisa las novedades en tu Google Drive corporativo, genera el informe de pendientes y sube las actividades a WAPPY.</li>
            <li><strong>Triggers por Carpetas Vigiladas:</strong> Al guardar fotos de una visita en la carpeta <code>/inspecciones</code>, el agente las audita con visión computacional y radica el hallazgo en WAPPY sin que tengas que abrir la web.</li>
            <li><strong>Agentes (`AGENTS.md`):</strong> La "constitución" del asistente: quién es, qué normas colombianas respeta y cómo debe responder.</li>
            <li><strong>Skills (`SKILL.md`):</strong> Instrucciones paso a paso para tareas rutinarias (ej: cómo evaluar un químico según el SGA o cómo auditar EPPs).</li>
            <li><strong>Workflows:</strong> Atajos mediante comandos <code>/slash</code> para ejecutar procesos completos con una sola palabra.</li>
          </ul>
        </div>
      </section>

      <!-- SECCIÓN: PROMPTS LISTOS -->
      <section>
        <div class="sec-header">
          <span class="sec-tag">Caja de Herramientas</span>
          <h2 class="sec-title">Plantillas Listas para Copiar en tu Primer Proyecto</h2>
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

      <!-- SECCIÓN: RECURSOS -->
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
    const totalSlides = 15;

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

    // Mobile Touch Swipe Navigation
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
          nextSlide();
        }} else {{
          prevSlide();
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

    document.addEventListener('DOMContentLoaded', () => {{
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
