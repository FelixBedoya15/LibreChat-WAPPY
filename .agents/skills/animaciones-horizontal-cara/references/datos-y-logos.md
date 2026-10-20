# Datos verificados y logos reales

## Datos

Todo lo que aparece en pantalla como hecho (nombres de modelos, versiones, precios, fechas, cifras de
benchmarks, límites) tiene que ser correcto a fecha de hoy. Josema publica esto en YouTube: un dato mal
puesto le quita credibilidad.

1. Haz la lista de entidades de la voz: empresas, productos, modelos (con versión), cifras.
2. Verifica cada una en **fuentes oficiales** con WebSearch/WebFetch: documentación y páginas de precios del
   fabricante, anuncio oficial del lanzamiento, ficha del modelo en su API. Prensa y agregadores
   (OpenRouter, Artificial Analysis) solo como apoyo o para localizar la fuente oficial.
   **No te quedes con el resumen de WebSearch**: abre la página oficial con WebFetch y lee también las notas al
   pie. Ejemplo real: varios resúmenes daban Claude Sonnet 5 a $3 por millón de entrada (una subida anunciada que
   se canceló); la nota 3 de la página de precios de Anthropic confirma $2 como precio definitivo.
3. Escribe los nombres exactamente como los escribe el fabricante ("GPT-6 Astra", "Claude Opus 5.5",
   "n8n", "OpenAI").
4. **Si la voz redondea o simplifica**, muestra el dato real de forma que no contradiga lo que se oye.
   Ejemplo real: la voz dice "Opus cuesta la mitad que Astra" y los precios son $4/$20 frente a $10/$50
   (40 %). Se mostraron los precios reales en barras con una línea de "½ la mitad": la barra de Opus queda
   por debajo, así que la frase sigue siendo cierta y nada es falso. No se pintó "−50 %".
5. **Si la voz dice algo que es falso** (no un redondeo), no lo muestres como hecho; muéstralo de forma
   neutra y avísalo a Josema en el mensaje final para que decida si regraba.
6. Si una cifra no se puede verificar, no la pongas como dato: usa un recurso cualitativo (balanza, escala)
   sin números. Ejemplos reales (Muse): «casi con la misma inteligencia que los más potentes» → los índices cambian
   con cada versión (Muse Spark 1.3: 61 frente a 66 de Claude Fable 5.1 y 63 de Claude Opus 5 en el Artificial
   Analysis Intelligence Index), así que barras sin cifras con la etiqueta «casi»; «totalmente gratis» con planes de
   pago → en pantalla solo «GRATIS», nunca «100 %»; «su 3 % de uso» es un dato suyo: se muestra tal cual.
7. Apunta las fuentes (URL y fecha) en el README del proyecto y ponlas en el mensaje final.

Si hay que elegir cómo presentar precios: "entrada / salida por millón de tokens" es el formato estándar
de las API de modelos. Una sola métrica bien explicada es mejor que una tabla.

## Logos

```
python <skill>/scripts/anim.py logos "Claude" "OpenAI" "n8n" "Google Gemini"
```

Busca en este orden y se queda con el primero válido: Lobe Icons (marcas de IA, con variante a color),
SVGL (variante para fondo oscuro), Simple Icons (coloreado con su color de marca), el icono oficial de la
web de la herramienta y, por último, el favicon. Adapta cada logo al fondo oscuro (los negros pasan a blanco)
y lo apunta en `assets/logos/logos.json` con su `slug`. Es el mismo buscador que usa la skill editor-reels.

- En la animación: `logo('claude', 54)` (en tarjetas, `tarjeta({logo: 'claude', ...})`). El slug es el que
  imprime el comando; `--list` muestra el registro y `--resolve "GPT-6"` dice a qué logo lleva un alias.
- Un modelo usa el logo de su marca: GPT-6 Sol/Astra → OpenAI; Claude Opus/Fable/Sonnet → Claude;
  Gemini 3 → Gemini. El logo de la empresa (Anthropic, OpenAI) va en cabeceras de columna o de empresa.
- `NOT FOUND` o "calidad baja": busca el kit de prensa oficial con WebSearch, guarda el SVG/PNG en
  `assets/logos/` y añádelo a `logos.json` con el mismo formato; o pasa `--domain Nombre=dominio.com`.
- **Ya preparados en la skill** (`recursos/logos/`): `muse` (icono de la app, vectorizado del icono oficial) y
  `metalockup` (logotipo completo de Meta, de su web oficial): `anim.py recursos muse metalockup` los copia a
  `assets/logos/` y los apunta en `logos.json`. Para el logotipo de Meta con texto usa `metalockup`: el
  `meta-text.svg` de Lobe Icons es el de Llama.
- Logo que se escribe a mano en pantalla (la «m» de Muse, una firma): `anim.py logo-trazo icono.png` saca el contorno
  exacto y el eje del trazo (`assets/logos/<slug>_trazo.json`); se pinta con la máscara que recorre el eje
  (`museSVG`/`museDibujo` en `ejemplos/muse-intro.html`).
- Revísalos con `anim.py ver-logos` (hoja `trabajo/revision/logos.png`, a tamaño de tarjeta y grande sobre el fondo
  real): que sea el actual (muchas marcas han cambiado de logo), que se vea sobre el fondo y que no esté pixelado.
  Si no hay uno bueno, mejor solo el nombre.

## Colores de marca útiles

El color de cada bando sale de su marca. Comprobados:

| Marca | Color | Nota |
|---|---|---|
| Claude | `#D97757` | coral del logo |
| Anthropic | blanco sobre oscuro | marca monocroma |
| OpenAI / ChatGPT / Codex | blanco sobre oscuro | monocroma: en comparativas usa un azul frío `#7C9CFF` como color de bando |
| Hermes Agent (Nous) | `#3E6EF2` | azul de su marca |
| Google Gemini | `#8E75B2` | el logo real es un degradado azul-violeta |
| Meta | `#0467DF` | |
| Muse (Meta) | `#2F86FF` | azul de su icono, el de `ejemplos/muse-*.html` |
| DeepSeek | `#5786FE` | |
| Mistral AI | `#FA520F` | |
| Perplexity | `#1FB8CD` | |
| Telegram | `#26A5E4` | |
| WhatsApp | `#25D366` | |
| Discord | `#5865F2` | |
| n8n | `#EA4B71` | |
| Make | `#6D00CC` | |
| Zapier | `#FF4F00` | |
| Supabase | `#3FCF8E` | |
| Stripe | `#635BFF` | |
| Figma | `#F24E1E` | |
| Gmail | `#EA4335` | |
| YouTube | `#FF0000` | |
| GitHub, Cursor, Vercel, Notion, Ollama | blanco sobre oscuro | monocromas |

(Valores de Simple Icons, septiembre de 2026.) Para otras marcas usa el campo `color` de `logos.json` o el
color dominante del SVG, y compruébalo contra la web oficial. Si dos bandos salen con colores parecidos, cambia uno a un tono
claramente distinto y mantenlo en todo el vídeo.
