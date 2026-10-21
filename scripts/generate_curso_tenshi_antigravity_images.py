import os
import base64
import subprocess

BASE_DIR = '/Users/venta/Documents/GitHub/LibreChat-WAPPY'

def to_b64(path):
    with open(path, 'rb') as f:
        data = base64.b64encode(f.read()).decode('utf-8')
    ext = path.split('.')[-1].lower()
    mime = 'image/png' if ext == 'png' else 'image/jpeg'
    return f"data:{mime};base64,{data}"

tenshi_scene_b64 = to_b64(os.path.join(BASE_DIR, 'client/public/assets/promo_curso_tenshi.jpg'))
tenshi_portrait_b64 = to_b64(os.path.join(BASE_DIR, 'client/public/assets/tenshi_original.png'))
wappy_logo_b64 = to_b64(os.path.join(BASE_DIR, 'client/public/marketing/wappy-official-logo.png'))
wappy_cat_b64 = to_b64(os.path.join(BASE_DIR, 'client/public/marketing/wappy-cat-logo.png'))
agy_logo_b64 = to_b64('/tmp/antigravity_logo.png')
agy_ide_b64 = to_b64('/tmp/antigravity_ide_logo.png')

# ==============================================================================
# 1. IMAGEN HORIZONTAL (1920 x 1080) - 16:9 FULL HD
# ==============================================================================
html_horizontal = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Inter:wght@500;600;700;800;900&family=JetBrains+Mono:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #06181e;
    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    color: #ffffff;
  }}

  .canvas-stage {{
    position: relative;
    width: 1920px;
    height: 1080px;
    background: radial-gradient(circle at 24% 45%, #16444d 0%, #092229 48%, #041014 100%);
    overflow: hidden;
  }}

  /* Imagen base 3D de Tenshi con su aureola en el lado izquierdo */
  .tenshi-bg-layer {{
    position: absolute;
    top: -10px;
    left: -10px;
    width: 1100px;
    height: 1100px;
    background-image: url('{tenshi_scene_b64}');
    background-size: cover;
    background-position: left center;
    z-index: 1;
  }}

  /* Máscara suave que limpia los letreros antiguos de la derecha respetando la oreja (x<=495) y la mano de Tenshi (y>=495) */
  .clean-mask-top {{
    position: absolute;
    left: 482px;
    top: 0;
    width: 1438px;
    height: 495px;
    background: linear-gradient(90deg, rgba(14, 48, 56, 0) 0%, #103842 4%, #0b2830 14%, #07191f 50%, #051318 100%);
    z-index: 2;
  }}

  .clean-mask-right {{
    position: absolute;
    left: 640px;
    top: 485px;
    width: 1280px;
    height: 595px;
    background: linear-gradient(90deg, rgba(13, 45, 53, 0) 0%, #0c2b33 6%, #081d23 40%, #051318 100%);
    z-index: 2;
  }}

  .clean-mask-bottom {{
    position: absolute;
    left: 485px;
    top: 660px;
    width: 360px;
    height: 260px;
    background: radial-gradient(circle, #0d2f37 45%, rgba(14, 50, 58, 0) 80%);
    z-index: 2;
  }}

  /* Resplandor extra para la Aureola Dorada de Tenshi */
  .halo-boost {{
    position: absolute;
    left: 165px;
    top: 85px;
    width: 310px;
    height: 150px;
    background: radial-gradient(ellipse at center, rgba(255, 215, 64, 0.38) 0%, rgba(255, 180, 0, 0.12) 55%, transparent 75%);
    filter: blur(12px);
    z-index: 3;
    pointer-events: none;
  }}

  /* Grilla Cibernética y Luces Ambientales */
  .cyber-grid {{
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(45, 212, 191, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(45, 212, 191, 0.05) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: linear-gradient(90deg, transparent 28%, black 55%);
    -webkit-mask-image: linear-gradient(90deg, transparent 28%, black 55%);
    z-index: 3;
  }}

  .ambient-orb-1 {{
    position: absolute;
    right: -120px;
    top: -100px;
    width: 680px;
    height: 680px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(199, 243, 3, 0.12) 45%, transparent 70%);
    filter: blur(40px);
    z-index: 3;
  }}

  .ambient-orb-2 {{
    position: absolute;
    right: 140px;
    bottom: -140px;
    width: 640px;
    height: 640px;
    background: radial-gradient(circle, rgba(13, 148, 136, 0.28) 0%, rgba(199, 243, 3, 0.1) 50%, transparent 70%);
    filter: blur(40px);
    z-index: 3;
  }}

  /* Panel Holográfico Principal en la Derecha */
  .holo-panel {{
    position: absolute;
    left: 650px;
    top: 56px;
    right: 64px;
    bottom: 56px;
    z-index: 5;
    background: linear-gradient(145deg, rgba(11, 31, 38, 0.86) 0%, rgba(6, 17, 23, 0.92) 100%);
    border: 2px solid rgba(94, 234, 212, 0.38);
    border-radius: 38px;
    box-shadow:
      0 30px 90px rgba(0, 0, 0, 0.65),
      0 0 50px rgba(45, 212, 191, 0.18),
      inset 0 0 40px rgba(45, 212, 191, 0.08);
    backdrop-filter: blur(18px);
    padding: 44px 52px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}

  /* Esquinas HUD Luminosas */
  .hud-c {{
    position: absolute;
    width: 36px;
    height: 36px;
    border-color: #c7f303;
    border-style: solid;
    filter: drop-shadow(0 0 8px rgba(199, 243, 3, 0.6));
  }}
  .hud-c.tl {{ top: 18px; left: 18px; border-width: 3px 0 0 3px; border-top-left-radius: 14px; }}
  .hud-c.tr {{ top: 18px; right: 18px; border-width: 3px 3px 0 0; border-top-right-radius: 14px; }}
  .hud-c.bl {{ bottom: 18px; left: 18px; border-width: 0 0 3px 3px; border-bottom-left-radius: 14px; }}
  .hud-c.br {{ bottom: 18px; right: 18px; border-width: 0 3px 3px 0; border-bottom-right-radius: 14px; }}

  /* Fila Superior: Badge del Curso */
  .top-kicker-row {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }}

  .kicker-pill {{
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(199, 243, 3, 0.14);
    border: 1.5px solid rgba(199, 243, 3, 0.55);
    color: #c7f303;
    padding: 10px 22px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 0 24px rgba(199, 243, 3, 0.2);
  }}

  .kicker-dot {{
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #c7f303;
    box-shadow: 0 0 12px #c7f303;
  }}

  .vip-tag {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 700;
    color: #5eead4;
    background: rgba(13, 148, 136, 0.2);
    border: 1px solid rgba(94, 234, 212, 0.4);
    padding: 9px 18px;
    border-radius: 999px;
  }}

  /* Bloque Central de Logos Oficiales: WAPPY IA + GOOGLE ANTIGRAVITY */
  .logos-alliance-stage {{
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 24px;
    background: linear-gradient(90deg, rgba(13, 148, 136, 0.16) 0%, rgba(15, 23, 42, 0.65) 50%, rgba(59, 130, 246, 0.18) 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    border-radius: 28px;
    padding: 26px 34px;
    position: relative;
  }}

  .logo-box {{
    display: flex;
    align-items: center;
    gap: 20px;
  }}

  .logo-box.right {{
    justify-content: flex-end;
    text-align: right;
  }}

  .logo-icon-frame {{
    width: 112px;
    height: 112px;
    border-radius: 28px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45), 0 0 28px rgba(45, 212, 191, 0.35);
    border: 3px solid #2dd4bf;
    flex-shrink: 0;
  }}

  .logo-icon-frame.agy {{
    background: #ffffff;
    border-color: #60a5fa;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5), 0 0 32px rgba(96, 165, 250, 0.45);
    padding: 8px;
  }}

  .logo-icon-frame img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }}

  .logo-meta .brand-sup {{
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 3px;
  }}

  .logo-meta .brand-name {{
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #ffffff;
    line-height: 1.05;
  }}

  .logo-meta .brand-name span.teal {{ color: #2dd4bf; }}
  .logo-meta .brand-name span.lime {{ color: #c7f303; }}
  .logo-meta .brand-name span.g-blue {{ color: #60a5fa; }}

  .logo-meta .brand-role {{
    font-size: 14px;
    font-weight: 700;
    color: #cbd5e1;
    margin-top: 4px;
  }}

  /* Conector Central MCP */
  .mcp-bridge-badge {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
  }}

  .mcp-plus-circle {{
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #c7f303 0%, #2dd4bf 100%);
    color: #06181e;
    font-size: 34px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 30px rgba(199, 243, 3, 0.6);
  }}

  .mcp-label {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 800;
    color: #c7f303;
    letter-spacing: 0.08em;
    background: rgba(0, 0, 0, 0.55);
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px solid rgba(199, 243, 3, 0.4);
  }}

  /* Títulos del Curso */
  .course-headline-block {{
    margin: 4px 0;
  }}

  .course-headline-block h1 {{
    font-size: 56px;
    font-weight: 900;
    line-height: 1.04;
    letter-spacing: -0.035em;
    color: #ffffff;
    text-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
  }}

  .course-headline-block h1 .hl-lime {{
    color: #06181e;
    background: #c7f303;
    padding: 0 16px;
    border-radius: 14px;
    display: inline-block;
    box-shadow: 0 0 30px rgba(199, 243, 3, 0.4);
  }}

  .course-headline-block h1 .hl-grad {{
    background: linear-gradient(90deg, #5eead4 0%, #60a5fa 55%, #f472b6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .course-sub {{
    font-size: 21px;
    font-weight: 600;
    color: #cbd5e1;
    margin-top: 14px;
    line-height: 1.4;
  }}

  .course-sub strong {{
    color: #ffffff;
  }}

  /* Tarjetas de Módulos del Curso */
  .features-row {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }}

  .feat-pill-card {{
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 20px;
    padding: 16px 18px;
    border-top: 3px solid #2dd4bf;
  }}

  .feat-pill-card.lime {{ border-top-color: #c7f303; }}
  .feat-pill-card.blue {{ border-top-color: #60a5fa; }}
  .feat-pill-card.amber {{ border-top-color: #fbbf24; }}

  .feat-pill-card .f-top {{
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
    margin-bottom: 4px;
  }}

  .feat-pill-card .f-main {{
    font-size: 18px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
  }}

  /* Barra Inferior del Panel */
  .panel-footer-bar {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }}

  .tenshi-badge-left {{
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 700;
    color: #e2e8f0;
  }}

  .url-cta-pill {{
    background: #c7f303;
    color: #06181e;
    font-size: 20px;
    font-weight: 900;
    padding: 12px 28px;
    border-radius: 999px;
    letter-spacing: -0.02em;
    box-shadow: 0 0 28px rgba(199, 243, 3, 0.45);
  }}

  /* Etiqueta flotante bajo Tenshi */
  .tenshi-nameplate {{
    position: absolute;
    left: 115px;
    bottom: 42px;
    z-index: 6;
    background: rgba(6, 24, 30, 0.88);
    border: 1.5px solid #fbbf24;
    border-radius: 999px;
    padding: 10px 26px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(251, 191, 36, 0.3);
  }}

  .tenshi-nameplate span {{
    font-size: 16px;
    font-weight: 800;
    color: #fde68a;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }}
</style>
</head>
<body>
  <div class="canvas-stage">
    <div class="tenshi-bg-layer"></div>
    <div class="clean-mask-top"></div>
    <div class="clean-mask-right"></div>
    <div class="clean-mask-bottom"></div>
    <div class="halo-boost"></div>
    <div class="cyber-grid"></div>
    <div class="ambient-orb-1"></div>
    <div class="ambient-orb-2"></div>

    <div class="tenshi-nameplate">
      <span>✨ TENSHI IA · AGENTE LÍDER SST</span>
    </div>

    <div class="holo-panel">
      <div class="hud-c tl"></div>
      <div class="hud-c tr"></div>
      <div class="hud-c bl"></div>
      <div class="hud-c br"></div>

      <div class="top-kicker-row">
        <div class="kicker-pill">
          <span class="kicker-dot"></span>
          <span>ESPECIALIZACIÓN PRÁCTICA · IA AGÉNTICA APLICADA AL SG-SST</span>
        </div>
        <div class="vip-tag">CERO CÓDIGO · 100% PRÁCTICO</div>
      </div>

      <!-- BLOQUE CENTRAL DE LOGOS OFICIALES: WAPPY + ANTIGRAVITY -->
      <div class="logos-alliance-stage">
        <div class="logo-box">
          <div class="logo-icon-frame">
            <img src="{wappy_logo_b64}" alt="WAPPY Logo">
          </div>
          <div class="logo-meta">
            <div class="brand-sup">PLATAFORMA CENTRAL SST</div>
            <div class="brand-name">WAPPY <span class="teal">IA</span></div>
            <div class="brand-role">Cerebro SST &amp; 7 Especialistas</div>
          </div>
        </div>

        <div class="mcp-bridge-badge">
          <div class="mcp-plus-circle">+</div>
          <div class="mcp-label">PUENTE MCP</div>
        </div>

        <div class="logo-box right">
          <div class="logo-meta">
            <div class="brand-sup">GOOGLE DEEPMIND</div>
            <div class="brand-name"><span class="g-blue">Antigravity</span></div>
            <div class="brand-role">Agentes Locales, Skills &amp; Triggers</div>
          </div>
          <div class="logo-icon-frame agy">
            <img src="{agy_logo_b64}" alt="Google Antigravity Logo">
          </div>
        </div>
      </div>

      <!-- TÍTULO PRINCIPAL -->
      <div class="course-headline-block">
        <h1>
          Domina <span class="hl-lime">WAPPY + Antigravity</span><br>
          y Automatiza tu <span class="hl-grad">Gestión SST</span>
        </h1>
        <p class="course-sub">
          Conecta tus carpetas locales, <strong>Google NotebookLM</strong> y <strong>Google Drive</strong> con <strong>WAPPY Cloud</strong> para crear Agentes, Skills y Triggers automáticos hablándole en español al chat.
        </p>
      </div>

      <!-- 4 PILARES DEL CURSO -->
      <div class="features-row">
        <div class="feat-pill-card lime">
          <div class="f-top">01 · Fundamentos IA</div>
          <div class="f-main">LLMs, Tokens, API Keys y MCP</div>
        </div>
        <div class="feat-pill-card">
          <div class="f-top">02 · Conexión Total</div>
          <div class="f-main">WAPPY + Drive + NotebookLM</div>
        </div>
        <div class="feat-pill-card blue">
          <div class="f-top">03 · Automatización</div>
          <div class="f-main">Triggers, Cron &amp; Skills por Chat</div>
        </div>
        <div class="feat-pill-card amber">
          <div class="f-top">04 · Normativa Col</div>
          <div class="f-main">Decreto 1072, Res. 0312 y GTC 45</div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="panel-footer-bar">
        <div class="tenshi-badge-left">
          <span>👨‍🏫 Docente: <strong>Ing. Félix Bedoya</strong> · Cohorte Exclusiva VIP (12 Especialistas)</span>
        </div>
        <div class="url-cta-pill">
          wappy.club/clase1 ↗
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

# ==============================================================================
# 2. IMAGEN VERTICAL (1080 x 1920) - 9:16 REELS / STORIES / WHATSAPP
# ==============================================================================
html_vertical = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Inter:wght@500;600;700;800;900&family=JetBrains+Mono:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    background: #051419;
    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    color: #ffffff;
  }}

  .v-stage {{
    position: relative;
    width: 1080px;
    height: 1920px;
    background: radial-gradient(circle at 50% 22%, #133c46 0%, #071b21 52%, #030c0f 100%);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 52px 0;
  }}

  .cyber-grid {{
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(45, 212, 191, 0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(45, 212, 191, 0.055) 1px, transparent 1px);
    background-size: 56px 56px;
    z-index: 1;
    pointer-events: none;
  }}

  .v-top-content {{
    position: relative;
    z-index: 6;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }}

  .kicker-pill {{
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(199, 243, 3, 0.15);
    border: 1.5px solid rgba(199, 243, 3, 0.6);
    color: #c7f303;
    padding: 12px 26px;
    border-radius: 999px;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 0 28px rgba(199, 243, 3, 0.22);
    margin-bottom: 28px;
  }}

  .kicker-dot {{
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #c7f303;
    box-shadow: 0 0 12px #c7f303;
  }}

  /* Alianza de Logos Oficiales en la Parte Superior */
  .v-logos-card {{
    width: 100%;
    background: linear-gradient(135deg, rgba(13, 148, 136, 0.22) 0%, rgba(15, 23, 42, 0.88) 50%, rgba(59, 130, 246, 0.24) 100%);
    border: 2px solid rgba(94, 234, 212, 0.42);
    border-radius: 34px;
    padding: 28px 34px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 20px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 40px rgba(45, 212, 191, 0.16);
    margin-bottom: 32px;
  }}

  .v-logo-side {{
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }}

  .v-logo-frame {{
    width: 126px;
    height: 126px;
    border-radius: 32px;
    background: #ffffff;
    padding: 12px;
    border: 3px solid #2dd4bf;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45), 0 0 28px rgba(45, 212, 191, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
  }}

  .v-logo-frame.agy {{
    background: #ffffff;
    border-color: #60a5fa;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55), 0 0 32px rgba(96, 165, 250, 0.45);
    padding: 8px;
  }}

  .v-logo-frame img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }}

  .v-brand-title {{
    font-size: 30px;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #ffffff;
  }}

  .v-brand-sub {{
    font-size: 14px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }}

  .v-mcp-center {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }}

  .v-plus-orb {{
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: linear-gradient(135deg, #c7f303 0%, #2dd4bf 100%);
    color: #051419;
    font-size: 38px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 32px rgba(199, 243, 3, 0.65);
  }}

  .v-mcp-tag {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 800;
    color: #c7f303;
    background: rgba(0, 0, 0, 0.6);
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid rgba(199, 243, 3, 0.45);
  }}

  /* Título Principal Vertical */
  .v-headline {{
    font-size: 62px;
    font-weight: 900;
    line-height: 1.04;
    letter-spacing: -0.035em;
    margin-bottom: 18px;
    text-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  }}

  .v-headline .hl-lime {{
    background: #c7f303;
    color: #051419;
    padding: 0 18px;
    border-radius: 16px;
    display: inline-block;
    box-shadow: 0 0 32px rgba(199, 243, 3, 0.45);
  }}

  .v-headline .hl-grad {{
    background: linear-gradient(90deg, #5eead4 0%, #60a5fa 55%, #f472b6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .v-sub {{
    font-size: 23px;
    font-weight: 600;
    color: #cbd5e1;
    max-width: 900px;
    line-height: 1.38;
    margin-bottom: 26px;
  }}

  /* Grid 2x2 de Módulos */
  .v-modules-grid {{
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }}

  .v-mod-card {{
    background: rgba(15, 23, 42, 0.86);
    border: 1.5px solid rgba(255, 255, 255, 0.15);
    border-left: 5px solid #c7f303;
    border-radius: 22px;
    padding: 18px 22px;
    text-align: left;
    backdrop-filter: blur(12px);
  }}

  .v-mod-card.teal {{ border-left-color: #2dd4bf; }}
  .v-mod-card.blue {{ border-left-color: #60a5fa; }}
  .v-mod-card.amber {{ border-left-color: #fbbf24; }}

  .v-mod-card .m-kicker {{
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-bottom: 4px;
  }}

  .v-mod-card .m-title {{
    font-size: 21px;
    font-weight: 800;
    color: #ffffff;
  }}

  /* Escenario Inferior con Tenshi 3D y su Aureola Dorada */
  .v-bottom-stage {{
    position: relative;
    width: 1080px;
    height: 820px;
    margin-left: -52px;
    z-index: 3;
    overflow: hidden;
  }}

  .v-tenshi-scene {{
    position: absolute;
    left: 20px;
    bottom: -25px;
    width: 920px;
    height: 920px;
    background-image: url('{tenshi_scene_b64}');
    background-size: cover;
    background-position: left center;
    mask-image: linear-gradient(180deg, transparent 0%, black 14%, black 100%);
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, black 14%, black 100%);
  }}

  /* Limpiar los letreros antiguos a la derecha de Tenshi en el formato vertical */
  .v-clean-top {{
    position: absolute;
    left: 410px;
    top: 0;
    width: 670px;
    height: 430px;
    background: linear-gradient(90deg, rgba(8, 28, 34, 0) 0%, #092128 6%, #051419 35%);
  }}

  .v-clean-right {{
    position: absolute;
    left: 545px;
    top: 410px;
    width: 535px;
    height: 420px;
    background: linear-gradient(90deg, rgba(8, 28, 34, 0) 0%, #071b21 8%, #051419 35%);
  }}

  /* Tarjeta Holográfica junto a la mano de Tenshi en Vertical */
  .v-hand-holo-card {{
    position: absolute;
    right: 48px;
    top: 130px;
    width: 470px;
    background: linear-gradient(145deg, rgba(13, 42, 50, 0.92), rgba(5, 18, 24, 0.95));
    border: 2px solid #c7f303;
    border-radius: 30px;
    padding: 28px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(199, 243, 3, 0.25);
    z-index: 6;
  }}

  .v-hand-holo-card .h-tag {{
    display: inline-block;
    background: rgba(199, 243, 3, 0.18);
    color: #c7f303;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 800;
    padding: 5px 12px;
    border-radius: 8px;
    margin-bottom: 12px;
  }}

  .v-hand-holo-card h3 {{
    font-size: 28px;
    font-weight: 900;
    line-height: 1.15;
    color: #ffffff;
    margin-bottom: 14px;
  }}

  .v-check-list {{
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }}

  .v-check-list li {{
    font-size: 17px;
    font-weight: 700;
    color: #e2e8f0;
    display: flex;
    align-items: center;
    gap: 10px;
  }}

  .v-check-list li span {{
    color: #c7f303;
    font-weight: 900;
  }}

  .v-cta-pill {{
    background: #c7f303;
    color: #051419;
    font-size: 22px;
    font-weight: 900;
    text-align: center;
    padding: 14px 20px;
    border-radius: 999px;
    box-shadow: 0 0 25px rgba(199, 243, 3, 0.5);
  }}

  .v-footer-banner {{
    position: absolute;
    bottom: 28px;
    left: 48px;
    right: 48px;
    z-index: 8;
    background: rgba(5, 20, 25, 0.92);
    border: 1.5px solid rgba(94, 234, 212, 0.45);
    border-radius: 999px;
    padding: 14px 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(12px);
  }}
</style>
</head>
<body>
  <div class="v-stage">
    <div class="cyber-grid"></div>

    <div class="v-top-content">
      <div class="kicker-pill">
        <span class="kicker-dot"></span>
        <span>ESPECIALIZACIÓN PRÁCTICA · SOMOS SST</span>
      </div>

      <!-- LOGOS OFICIALES WAPPY IA + GOOGLE ANTIGRAVITY -->
      <div class="v-logos-card">
        <div class="v-logo-side">
          <div class="v-logo-frame">
            <img src="{wappy_logo_b64}" alt="WAPPY IA">
          </div>
          <div>
            <div class="v-brand-title">WAPPY <span style="color:#2dd4bf;">IA</span></div>
            <div class="v-brand-sub">Cerebro SST Cloud</div>
          </div>
        </div>

        <div class="v-mcp-center">
          <div class="v-plus-orb">+</div>
          <div class="v-mcp-tag">CONEXIÓN MCP</div>
        </div>

        <div class="v-logo-side">
          <div class="v-logo-frame agy">
            <img src="{agy_logo_b64}" alt="Google Antigravity">
          </div>
          <div>
            <div class="v-brand-title" style="color:#60a5fa;">Antigravity</div>
            <div class="v-brand-sub">Google DeepMind</div>
          </div>
        </div>
      </div>

      <h1 class="v-headline">
        Curso <span class="hl-lime">Ecosistema Autónomo</span><br>
        <span class="hl-grad">SST sin Programar</span>
      </h1>

      <p class="v-sub">
        Aprende desde cero a conectar tus carpetas locales, <strong>NotebookLM</strong> y <strong>Google Drive</strong> con <strong>WAPPY</strong> creando Skills y Triggers desde el chat.
      </p>

      <div class="v-modules-grid">
        <div class="v-mod-card">
          <div class="m-kicker">Bloque 01 · Base IA</div>
          <div class="m-title">LLMs, Tokens, API &amp; MCP</div>
        </div>
        <div class="v-mod-card teal">
          <div class="m-kicker">Bloque 02 · Puente SST</div>
          <div class="m-title">Alimentar Matrices WAPPY</div>
        </div>
        <div class="v-mod-card blue">
          <div class="m-kicker">Bloque 03 · Memoria Legal</div>
          <div class="m-title">NotebookLM &amp; Drive 20 Años</div>
        </div>
        <div class="v-mod-card amber">
          <div class="m-kicker">Bloque 04 · Automatización</div>
          <div class="m-title">Triggers, Cron &amp; Skills</div>
        </div>
      </div>
    </div>

    <!-- ESCENARIO INFERIOR CON TENSHI Y SU AUREOLA DORADA -->
    <div class="v-bottom-stage">
      <div class="v-tenshi-scene"></div>
      <div class="v-clean-top"></div>
      <div class="v-clean-right"></div>

      <div class="v-hand-holo-card">
        <span class="h-tag">✨ TENSHI IA + ANTIGRAVITY</span>
        <h3>Todo Pidiéndoselo al Chat en Español</h3>
        <ul class="v-check-list">
          <li><span>✓</span> Crea tu proyecto en carpetas del PC</li>
          <li><span>✓</span> Conecta WAPPY vía MCP (55+ Tools)</li>
          <li><span>✓</span> Rescata actas de Google Drive</li>
          <li><span>✓</span> Triggers automáticos en la oficina</li>
        </ul>
        <div class="v-cta-pill">wappy.club/clase1 ↗</div>
      </div>

      <div class="v-footer-banner">
        <span style="font-size:16px; font-weight:800; color:#fde68a;">✨ TENSHI IA · AGENTE LÍDER DEL ECOSISTEMA SST</span>
        <span style="font-size:16px; font-weight:700; color:#cbd5e1;">Docente: <strong>Ing. Félix Bedoya</strong> · Grupo VIP</span>
      </div>
    </div>
  </div>
</body>
</html>
"""

with open('/tmp/promo_h.html', 'w', encoding='utf-8') as f:
    f.write(html_horizontal)

with open('/tmp/promo_v.html', 'w', encoding='utf-8') as f:
    f.write(html_vertical)

chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

out_h_desktop = '/Users/venta/Desktop/Curso_WAPPY_Antigravity_Horizontal.png'
out_v_desktop = '/Users/venta/Desktop/Curso_WAPPY_Antigravity_Vertical.png'

out_h_assets = os.path.join(BASE_DIR, 'client/public/assets/Curso_WAPPY_Antigravity_Horizontal.png')
out_v_assets = os.path.join(BASE_DIR, 'client/public/assets/Curso_WAPPY_Antigravity_Vertical.png')

subprocess.run([
    chrome_bin, '--headless', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1920,1080', f'--screenshot={out_h_desktop}', 'file:///tmp/promo_h.html'
], check=True)

subprocess.run([
    chrome_bin, '--headless', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1080,1920', f'--screenshot={out_v_desktop}', 'file:///tmp/promo_v.html'
], check=True)

subprocess.run(['cp', out_h_desktop, out_h_assets], check=True)
subprocess.run(['cp', out_v_desktop, out_v_assets], check=True)
print("Successfully generated Horizontal and Vertical images!")
