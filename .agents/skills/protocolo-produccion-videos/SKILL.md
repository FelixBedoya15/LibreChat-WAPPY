---
name: protocolo-produccion-videos
description: "Protocolo obligatorio de consulta, pre-producción, Ficha de Marca WAPPY IA y Sistema de las 7 Piezas para la creación de cualquier vídeo promocional, reel o animación en WAPPY IA. Debe ejecutarse SIEMPRE antes de escribir código o renderizar un MP4."
---

# Protocolo Obligatorio para Producción de Vídeos WAPPY IA (Sistema de las 7 Piezas + Brandbook Oficial)

Este protocolo establece el flujo de trabajo estándar e inquebrantable para cualquier producción audiovisual (Reels verticales `9:16` a `1080x1920` o vídeos horizontales `16:9` a `1920x1080` a `60 fps`) en el ecosistema **WAPPY IA (`wappy.club`)**.

---

## REGLA DE ORO: Nunca renderizar a ciegas sin las 7 Piezas y las 3 Vistas Previas
Está **ESTRICTAMENTE PROHIBIDO** lanzar renders completos en MP4 sin antes estructurar el pedido con las **7 Piezas Oficiales**, presentar la **Tabla Segundo a Segundo (incluyendo la Miniatura de 2.0s al inicio)** y validar **3 imágenes de vista previa (inicio, mitad y final)** para comprobar que ningún texto se corte.

---

## PARTE 1 · Ficha de Marca Oficial de WAPPY IA (1 Página · 7 Puntos)

1. **Nombre y promesa:** **WAPPY IA (`wappy.club`)** — *«Impulsamos la gestión de Seguridad y Salud en el Trabajo (SG-SST) con Inteligencia Artificial para transformar semanas de papeleo y hojas de Excel obsoletas en segundos de prevención real, 100% gratis.»*
2. **Colores Oficiales:**
   - **Modo Claro / Editorial (`wappy.club`):** Verde Lima Eléctrico (`#C7F303`, acento primario, botones CTA y badges activos), Negro Oliva Profundo (`#0E1300`, texto titular sobre claro/lima y tarjetas oscuras), Turquesa SST (`#0D9488`, acento secundario SST e iconos duotone), Crema Cálido Editorial (`#F6F5EF`, fondo limpio), Cielo WAPPY (`#5BB8F5` → `#EAF6FE`).
   - **Modo Dark Tech HUD (Reels `9:16`):** Azul Cósmico (`#0C192E` → `#1B2B4B`), Cyan Eléctrico (`#00D4FF`), Esmeralda Neón (`#00FF87`), Blanco (`#F8FAFC`).
   - **Semáforo GTC 45:** Rojo Nivel I (`#EF4444`), Naranja Nivel II (`#F97316`), Ámbar Nivel III (`#F59E0B`), Verde Nivel IV (`#10B981`).
3. **Letras (Tipografías):**
   - **Títulos y Cifras Gigantes:** `Plus Jakarta Sans` o `Outfit` (`800 ExtraBold` / `900 Black`), tracking `-0.03em`.
   - **Cuerpo de texto y UI:** `Inter` (`400 Regular`, `500 Medium`, `600 SemiBold`).
   - **Fórmulas (`NP = ND × NE`), NIT y Datos Técnicos:** `JetBrains Mono` (`600` / `700`).
4. **Cómo se siente y cómo se mueve:**
   - **En 3 palabras:** Innovadora, Preventiva y Cercana.
   - **Movimiento:** Con rebote elástico suave (`spring` / `cubic-bezier(0.16, 1, 0.3, 1)`), ágil, limpio y determinista cuadro a cuadro a `60 fps`.
5. **Contrastes permitidos vs. prohibidos:**
   - **SÍ USAR:** Texto `#0E1300` sobre `#C7F303` o `#F6F5EF`; Texto `#FFFFFF` o `#C7F303` sobre `#0E1300` o `#0C192E`; Texto `#FFFFFF` sobre `#0D9488` o `#EF4444`.
   - **PROHIBIDO USAR:** Texto blanco (`#FFFFFF`) sobre fondo Verde Lima (`#C7F303`); texto Verde Lima (`#C7F303`) o Cyan (`#00D4FF`) sobre fondo claro (`#F6F5EF` / `#FFFFFF`).
6. **Tono de voz y palabras clave:**
   - Experto en SST pero cero burocrático, empático, directo y energético (*«Matriz IPEVR con IA»*, *«GTC 45»*, *«Resolución 0312»*, *«Firma Digital»*, *«Informe Gerencial»*, *«100% GRATIS»*, *«Escribe SOMOS SST»*, *«wappy.club»*).
7. **Logos Oficiales, Avatares y Elementos Prohibidos:**
   - **Isotipo `W` Sonriente (Pestañas del navegador / Favicon / Bolsillo del Avatar):** `client/public/assets/icon-192x192.png` (`client/public/assets/brandbook/isotipo_w_favicon.png`).
   - **Logo del Gato Prevencionista SST (Pantalla de Login):** `client/public/assets/logo-bg.png` y `client/public/wappy-cat-logo.png` (`client/public/assets/brandbook/logo_gato_login_sst.png`).
   - **Imagotipo Oficial Completo (`Gato SST + WAPPY`):** Vertical Verde Esmeralda (`client/public/wappy-official-logo.png`) y Horizontal Negro (`client/public/assets/wappy_horizontal_black_logo.png`).
   - **Wordmark 3D Comic (`WAPPY`) y Mascota `Tenshi 3D`:** `client/public/marketing/wappy-wordmark.png` y `client/public/assets/tenshi.png`.
   - **Avatares Oficiales de Mauricio (Fundador):**
     * **`avatar2.png` (Chibi 3D con camisa de cuadros amarilla y logo `W` en el bolsillo):** `/Users/venta/Downloads/avatar2.png` y `client/public/assets/brandbook/avatar2_mauricio_camisa_cuadros_amarilla.png` (Protagonista obligatorio de las miniaturas/portadas de `0.00s a 2.00s`).
     * **2 Avatares Voxel Minecraft 3D (con camisa de cuadros amarilla y logo `W` en el bolsillo):** Cuerpo Completo (`client/public/assets/brandbook/avatar_mauricio_voxel_cuerpo_completo.png`) y Señalando (`client/public/assets/brandbook/avatar_mauricio_voxel_senalando.jpg` / `/Users/venta/Downloads/Mauricio_Avatar_Minecraft_Senalando.jpg`).
     * **Variantes adicionales Chibi 3D:** `Avatar1.png` (Deportivo azul con `W` naranja: `client/public/assets/brandbook/avatar1_mauricio_deportivo_azul.png`) y `avatar3.png` (Ejecutivo traje gris con corbata: `client/public/assets/brandbook/avatar3_mauricio_ejecutivo_traje.png`).
   - **Prohibido** incluir barras de navegación web falsas (`Inicio · Funciones · Precios · Entrar`) dentro de los vídeos.
   - **Prohibido** que el logo o el avatar 3D tapen textos, fórmulas o tarjetas.

---

## PARTE 2 · Las 7 Piezas Obligatorias en Cada Video

Siempre que el usuario pida un video, construye y verifica estas **7 piezas**:

### Pieza 1 · Quién Eres (Enfoque y Plantilla Base)
Seleccionar cuál de los **8 arquetipos del manual** se adapta mejor al pedido:
1. **Frase que detiene el dedo** (`12s` Vertical)
2. **Cinco ideas para guardar / Carrusel** (`20s` Vertical)
3. **Tutorial de chat con Tenshi / IA** (`15s` Horizontal o Vertical)
4. **Antes y Después: Excel vs. WAPPY IA** (`15s` Vertical)
5. **Intro Oficial de Marca WAPPY IA** (`5s` Horizontal)
6. **Anuncio de Lanzamiento de Herramienta SST (3 Tarjetas + ¡GRATIS!)** (`15s–72s` Vertical u Horizontal)
7. **Resultados que Crecen / Indicadores Res. 0312** (`14s` Horizontal)
8. **Frase de Marca Palabra por Palabra** (`8s` Horizontal)

### Pieza 2 · Mi Marca (WAPPY IA)
Aplicar la Ficha Oficial de Marca de la Parte 1, los logos reales (`icon-192x192.png`, `logo-bg.png`, `wappy-official-logo.png`) y los avatares oficiales del usuario:
- **Miniatura / Portada (`0.00s - 2.00s`):** `avatar2.png` (Mauricio Chibi 3D con camisa de cuadros amarilla y logo `W` en el bolsillo: `client/public/assets/brandbook/avatar2_mauricio_camisa_cuadros_amarilla.png`).
- **Desarrollo del Video (`2.00s` en adelante):** Los 2 Avatares 3D Voxel Minecraft con camisa de cuadros amarilla (`client/public/assets/brandbook/avatar_mauricio_voxel_cuerpo_completo.png` y `avatar_mauricio_voxel_senalando.jpg`) en esquina segura (`265px`) sin tapar el contenido.

### Pieza 3 · Para Quién y Qué Mensaje
- Verificar que la norma técnica sea 100% exacta (ej. **Guía Técnica Colombiana GTC 45**, **Resolución 0312**, **Decreto 1072**).
- **Prohibido inventar datos o mezclar normas** (ej. no mezclar ISO 45001 cuando la herramienta es de la GTC 45).

### Pieza 4 · Qué Pasa Segundo a Segundo (LA CLAVE)
Presentar siempre una tabla cronológica segundo a segundo donde:
- **Tramo `0.00s – 2.00s` (Obligatorio en Reels):** **Miniatura / Portada Magnética de Marketing** de 2 segundos completos antes de que inicie la voz, con:
  - Título gancho gigante,
  - El avatar del usuario,
  - Las **3 insignias clave** (ej. `✨ Matriz IPEVR con IA`, `✍️ Firma Digital`, `📊 Informe Gerencial`), y
  - El badge gigante **`🔥 ¡GRATIS!`**.
- **Tramos siguientes (`2.00s` al final):** Sincronizados palabra a palabra con los archivos de audio del usuario.

### Pieza 5 · Cómo se Mueve (Transiciones y Ritmo)
- Animación determinista cuadro a cuadro (`60 fps`), combinando rebote elástico suave (`spring`) y al menos **4 efectos del catálogo `animaciones-17-efectos-reels`** (Zoom-through, Giro 3D, Spotlight, Barrido diagonal, Conteo dinámico, Check elástico).

### Pieza 6 · Sonido
- Locución oficial del usuario (concatenada y normalizada sin silencios rotos) + efectos sonoros sincronizados (`whoosh`, `pop`, `ding`).

### Pieza 7 · Tamaño, 3 Vistas Previas y Entrega Final
1. Mostrar **3 imágenes de vista previa (Inicio/Miniatura, Mitad y Cierre)** para confirmar que ningún texto se corta ni se solapa.
2. Exportar el video en **MP4 (`1080x1920` o `1920x1080`, `60 fps`, H.264 `crf 18`, AAC `192k`)** usando Remotion o el motor determinista HTML 60fps + FFmpeg.
3. Dejar copia lista en `/Users/venta/Downloads/` (o `/Users/venta/Desktop/` si el usuario lo solicita).

---

## PARTE 3 · Cómo Corregir sin Empezar de Cero
Cuando el usuario pida un ajuste sobre un video ya generado, aplicar siempre la fórmula:
> **`Qué cambia` + `En qué tramo de segundos` + `Qué queda igual`**
Reutilizando los frames ya renderizados que no cambian para entregar la corrección en segundos.
