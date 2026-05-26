import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Setup Paths
base_dir = "/Users/venta/Documents/GitHub/LibreChat-WAPPY/Agentes/Miniaturas"
avatar_dir = os.path.join(base_dir, "Avatar ")
logo_dir = os.path.join(base_dir, "Logos ")
output_dir = base_dir

# Standard carousel dimensions (4:5 Portrait for LinkedIn/Instagram)
WIDTH = 1080
HEIGHT = 1350

# Fonts (macOS System Fonts)
FONT_BOLD_PATH = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_REGULAR_PATH = "/System/Library/Fonts/HelveticaNeue.ttc"

def get_font(path, size, index=0):
    try:
        # HelveticaNeue has different face indices, but usually index=0 is clean
        return ImageFont.truetype(path, size, index=index)
    except:
        return ImageFont.load_default()

font_title = get_font(FONT_BOLD_PATH, 56, index=1)      # Bold
font_subtitle = get_font(FONT_REGULAR_PATH, 32, index=0) # Regular
font_body = get_font(FONT_REGULAR_PATH, 28, index=0)     # Regular
font_cta = get_font(FONT_BOLD_PATH, 36, index=1)         # Bold
font_tag = get_font(FONT_BOLD_PATH, 22, index=1)         # Bold

# Colors
COLOR_BG = (8, 12, 20, 255) # `#080c14`
COLOR_CYAN = (6, 182, 212)
COLOR_EMERALD = (16, 185, 129)
COLOR_GREEN = (34, 197, 94)
COLOR_WHITE = (255, 255, 255)
COLOR_GRAY = (156, 163, 175)

# Load Avatars & Logos
avatar1 = Image.open(os.path.join(avatar_dir, "wmremove-transformed-3.png"))
avatar2 = Image.open(os.path.join(avatar_dir, "wmremove-transformed (6).png"))
avatar3 = Image.open(os.path.join(avatar_dir, "wmremove-transformed (7).png"))

logo_img = Image.open(os.path.join(logo_dir, "logo-bg-removebg-preview.png"))
favicon_img = Image.open(os.path.join(logo_dir, "favicon__4_-removebg-preview.png"))

def create_glow(width, height, color, size, x, y, opacity):
    # Create a transparent overlay
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    
    # Draw radial glow
    glow_color = color + (int(255 * opacity),)
    # Draw a circle
    draw.ellipse([x - size, y - size, x + size, y + size], fill=glow_color)
    # Blur it
    glow = glow.filter(ImageFilter.GaussianBlur(size / 2))
    return glow

def draw_grid(img, spacing=60, color=(255, 255, 255, 6)):
    draw = ImageDraw.Draw(img)
    for x in range(0, img.width, spacing):
        draw.line([(x, 0), (x, img.height)], fill=color, width=1)
    for y in range(0, img.height, spacing):
        draw.line([(0, y), (img.width, y)], fill=color, width=1)

def draw_glass_card(draw, x, y, w, h, radius=24, bg_color=(255, 255, 255, 10), border_color=(34, 197, 94, 40)):
    # Draw rounded rectangle for glassmorphism card
    draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=bg_color, outline=border_color, width=2)

def draw_text_wrapped(draw, text, font, color, max_width, start_x, start_y, line_spacing=1.3):
    paragraphs = text.split("\n")
    y = start_y
    for paragraph in paragraphs:
        words = paragraph.split(" ")
        current_line = []
        for word in words:
            current_line.append(word)
            w = draw.textlength(" ".join(current_line), font=font)
            if w > max_width:
                current_line.pop()
                draw.text((start_x, y), " ".join(current_line), font=font, fill=color)
                y += font.size * line_spacing
                current_line = [word]
        if current_line:
            draw.text((start_x, y), " ".join(current_line), font=font, fill=color)
            y += font.size * line_spacing
    return y

def create_base_slide(slide_num, total_slides):
    # Base background
    slide = Image.new("RGBA", (WIDTH, HEIGHT), COLOR_BG)
    
    # Add neon glows (emerald top-right, cyan bottom-left)
    glow_em = create_glow(WIDTH, HEIGHT, COLOR_EMERALD, 350, WIDTH - 100, 100, 0.20)
    glow_cy = create_glow(WIDTH, HEIGHT, COLOR_CYAN, 400, 100, HEIGHT - 100, 0.20)
    
    slide = Image.alpha_composite(slide, glow_em)
    slide = Image.alpha_composite(slide, glow_cy)
    
    # Subtle tech grid
    draw_grid(slide)
    
    # Draw progress bar
    draw = ImageDraw.Draw(slide)
    progress_w = int((WIDTH - 120) * (slide_num / total_slides))
    # Background bar
    draw.rounded_rectangle([60, HEIGHT - 60, WIDTH - 60, HEIGHT - 52], radius=4, fill=(255, 255, 255, 20))
    # Active bar
    if progress_w > 0:
        draw.rounded_rectangle([60, HEIGHT - 60, 60 + progress_w, HEIGHT - 52], radius=4, fill=COLOR_GREEN)
        
    # Draw slide number tag
    draw.text((WIDTH - 100, HEIGHT - 100), f"{slide_num}/{total_slides}", font=font_subtitle, fill=COLOR_GRAY)
    
    # Paste Wappy Logo at top left
    logo_resized = logo_img.copy()
    logo_resized.thumbnail((240, 70), Image.Resampling.LANCZOS)
    slide.paste(logo_resized, (60, 50), logo_resized)
    
    # Add top-right WAPPY IA badge
    draw_glass_card(draw, WIDTH - 260, 50, 200, 48, radius=12, bg_color=(16, 185, 129, 30), border_color=(34, 197, 94, 80))
    draw.text((WIDTH - 232, 60), "WAPPY IA", font=font_tag, fill=COLOR_GREEN)
    
    return slide

def generate_slide_1():
    slide = create_base_slide(1, 5)
    draw = ImageDraw.Draw(slide)
    
    # Title & Subtitle
    title_text = "Automatiza tus\nDocumentos de SST\ncon el Canvas de Wappy"
    draw_text_wrapped(draw, title_text, font_title, COLOR_WHITE, 650, 60, 220, line_spacing=1.2)
    
    # Subtitle
    sub_text = "Descubre la herramienta dividida inteligente que funciona como tu Canva para la seguridad y salud laboral."
    draw_text_wrapped(draw, sub_text, font_subtitle, COLOR_GRAY, 650, 60, 470, line_spacing=1.3)
    
    # Main Avatar placed beautifully on the right side
    av = avatar1.copy()
    # Scale avatar to fit the right portion
    av.thumbnail((650, 950), Image.Resampling.LANCZOS)
    slide.paste(av, (WIDTH - 550, HEIGHT - 920), av)
    
    # Interactive UI Card (Glassmorphic) on bottom left
    draw_glass_card(draw, 60, 780, 520, 320, radius=24, bg_color=(255, 255, 255, 12), border_color=(6, 182, 212, 80))
    
    # Card Header
    draw.text((90, 810), "⚡ HERRAMIENTA CANVAS", font=font_tag, fill=COLOR_CYAN)
    
    # Card Content
    card_body = "Crea matrices de peligros, actas de inspección y planes de capacitación de forma visual y con exportación directa a Word en segundos."
    draw_text_wrapped(draw, card_body, font_body, COLOR_WHITE, 460, 90, 855, line_spacing=1.3)
    
    # Swipe CTA
    draw.text((60, 1180), "Desliza para ver cómo funciona ➡️", font=font_subtitle, fill=COLOR_GREEN)
    
    slide.save(os.path.join(output_dir, "carrusel_canva_slide_1.png"), "PNG")
    print("Slide 1 generated.")

def generate_slide_2():
    slide = create_base_slide(2, 5)
    draw = ImageDraw.Draw(slide)
    
    # Title
    draw.text((60, 180), "1. Pantalla Dividida Inteligente", font=font_title, fill=COLOR_WHITE)
    
    # Avatar on left, visual cards on right
    av = avatar2.copy()
    av.thumbnail((500, 800), Image.Resampling.LANCZOS)
    slide.paste(av, (-80, HEIGHT - 760), av)
    
    # Concept Description
    desc_text = "Trabaja sin cambiar de pestaña. A la izquierda chateas con tu Agente Experto y a la derecha editas el documento final interactivo en tiempo real."
    draw_text_wrapped(draw, desc_text, font_subtitle, COLOR_GRAY, 800, 60, 270, line_spacing=1.3)
    
    # Glassmorphism Mockup of Split Screen on the right
    mx, my, mw, mh = 420, 420, 600, 680
    draw_glass_card(draw, mx, my, mw, mh, radius=24, bg_color=(15, 23, 42, 160), border_color=(34, 197, 94, 60))
    
    # Mockup interior details
    # Left Chat panel representation
    draw.rounded_rectangle([mx + 20, my + 80, mx + 280, my + 640], radius=12, fill=(255, 255, 255, 8))
    draw.text((mx + 40, my + 110), "Agente SST", font=font_tag, fill=COLOR_GREEN)
    draw.rounded_rectangle([mx + 40, my + 160, mx + 260, my + 280], radius=8, fill=(34, 197, 94, 20)) # Chat bubble
    draw.rounded_rectangle([mx + 40, my + 300, mx + 260, my + 420], radius=8, fill=(255, 255, 255, 10)) # Chat bubble 2
    
    # Right Canvas panel representation
    draw.rounded_rectangle([mx + 300, my + 80, mx + 580, my + 640], radius=12, fill=(6, 182, 212, 15))
    draw.text((mx + 320, my + 110), "📄 CANVAS / EDITOR", font=font_tag, fill=COLOR_CYAN)
    # Simulated document contents
    draw.rounded_rectangle([mx + 320, my + 160, mx + 560, my + 200], radius=4, fill=COLOR_WHITE)
    draw.rounded_rectangle([mx + 320, my + 220, mx + 560, my + 250], radius=4, fill=(255, 255, 255, 100))
    draw.rounded_rectangle([mx + 320, my + 270, mx + 500, my + 300], radius=4, fill=(255, 255, 255, 100))
    
    # Glowing divider bar
    draw.line([(mx + 290, my + 80), (mx + 290, my + 640)], fill=COLOR_GREEN, width=3)
    
    slide.save(os.path.join(output_dir, "carrusel_canva_slide_2.png"), "PNG")
    print("Slide 2 generated.")

def generate_slide_3():
    slide = create_base_slide(3, 5)
    draw = ImageDraw.Draw(slide)
    
    # Title
    draw.text((60, 180), "2. Edición y Exportación Directa", font=font_title, fill=COLOR_WHITE)
    
    # Description
    desc_text = "El Canvas te permite ajustar textos, tablas y formatos al instante. Una vez perfeccionado, expórtalo directamente a formato Word (.docx) o PDF sin perder el diseño corporativo."
    draw_text_wrapped(draw, desc_text, font_subtitle, COLOR_GRAY, 900, 60, 270, line_spacing=1.3)
    
    # Visual cards for features
    card_y = 420
    # Card 1: Edición Interactiva
    draw_glass_card(draw, 60, card_y, 450, 320, radius=24, bg_color=(255, 255, 255, 12), border_color=(34, 197, 94, 60))
    draw.text((90, card_y + 40), "✍️ Edición en Vivo", font=font_subtitle, fill=COLOR_GREEN)
    card1_body = "Modifica cualquier párrafo, agrega filas a las tablas o corrige información directamente dentro de la interfaz sin herramientas externas."
    draw_text_wrapped(draw, card1_body, font_body, COLOR_WHITE, 390, 90, card_y + 110, line_spacing=1.3)
    
    # Card 2: Exportación Profesional
    draw_glass_card(draw, 570, card_y, 450, 320, radius=24, bg_color=(255, 255, 255, 12), border_color=(6, 182, 212, 60))
    draw.text((600, card_y + 40), "📥 Exportar a Word / PDF", font=font_subtitle, fill=COLOR_CYAN)
    card2_body = "Olvídate del copiar y pegar. Tu documento se descarga formateado con tablas limpias, bordes perfectos y listo para entregar."
    draw_text_wrapped(draw, card2_body, font_body, COLOR_WHITE, 390, 600, card_y + 110, line_spacing=1.3)
    
    # Small avatar at the bottom guiding the user
    av = avatar3.copy()
    av.thumbnail((450, 700), Image.Resampling.LANCZOS)
    slide.paste(av, (WIDTH // 2 - 225, HEIGHT - 620), av)
    
    slide.save(os.path.join(output_dir, "carrusel_canva_slide_3.png"), "PNG")
    print("Slide 3 generated.")

def generate_slide_4():
    slide = create_base_slide(4, 5)
    draw = ImageDraw.Draw(slide)
    
    # Title
    draw.text((60, 180), "3. Matrices e Informes Profesionales", font=font_title, fill=COLOR_WHITE)
    
    # Description
    desc_text = "Genera estructuras complejas directamente en el Canvas con total apego a la normativa legal (como el Decreto 1072 o la GTC45)."
    draw_text_wrapped(draw, desc_text, font_subtitle, COLOR_GRAY, 900, 60, 270, line_spacing=1.3)
    
    # Visual grid of document types
    docs = [
        {"title": "📊 Matriz GTC45", "desc": "Cálculo de niveles de deficiencia y aceptabilidad del riesgo de forma visual."},
        {"title": "📋 Actas de Inspección", "desc": "Plantillas dinámicas con campos clave y firmas preestablecidas."},
        {"title": "🗓️ Planes de Trabajo / Cronogramas", "desc": "Gráficos de cumplimiento y calendarios de capacitación automatizados."},
        {"title": "📜 Políticas y Procedimientos", "desc": "Redacciones legales personalizadas según la actividad de tu empresa."}
    ]
    
    for i, doc in enumerate(docs):
        col = i % 2
        row = i // 2
        cx = 60 + col * 500
        cy = 400 + row * 340
        
        draw_glass_card(draw, cx, cy, 460, 300, radius=20, bg_color=(255, 255, 255, 12), border_color=(34, 197, 94, 50))
        draw.text((cx + 30, cy + 30), doc["title"], font=font_subtitle, fill=COLOR_GREEN)
        draw_text_wrapped(draw, doc["desc"], font_body, COLOR_WHITE, 400, cx + 30, cy + 90, line_spacing=1.3)
        
    slide.save(os.path.join(output_dir, "carrusel_canva_slide_4.png"), "PNG")
    print("Slide 4 generated.")

def generate_slide_5():
    slide = create_base_slide(5, 5)
    draw = ImageDraw.Draw(slide)
    
    # Main Title
    draw.text((60, 180), "Lleva tu Gestión de\nSST al Siguiente Nivel", font=font_title, fill=COLOR_WHITE)
    
    # Description
    desc_text = "Deja de redactar informes de forma manual. Convierte horas de trabajo administrativo en un par de clics asistidos por IA experta."
    draw_text_wrapped(draw, desc_text, font_subtitle, COLOR_GRAY, 900, 60, 330, line_spacing=1.3)
    
    # Avatar in center bottom
    av = avatar1.copy()
    av.thumbnail((650, 950), Image.Resampling.LANCZOS)
    slide.paste(av, (WIDTH // 2 - 325, HEIGHT - 840), av)
    
    # Giant glassmorphic CTA card
    draw_glass_card(draw, 140, 950, 800, 180, radius=24, bg_color=(16, 185, 129, 20), border_color=(34, 197, 94, 90))
    
    # CTA Text inside card
    draw.text((WIDTH // 2, 980), "PRUEBA EL CANVAS EN WAPPY IA", font=font_cta, fill=COLOR_WHITE, anchor="mm")
    draw.text((WIDTH // 2, 1030), "Regístrate gratis hoy y revoluciona tu SST", font=font_body, fill=COLOR_GRAY, anchor="mm")
    
    slide.save(os.path.join(output_dir, "carrusel_canva_slide_5.png"), "PNG")
    print("Slide 5 generated.")

if __name__ == "__main__":
    generate_slide_1()
    generate_slide_2()
    generate_slide_3()
    generate_slide_4()
    generate_slide_5()
    print("All slides successfully generated in the Miniaturas folder!")
