# 🎨 Reglas de Diseño de WAPPY IA (WAPPY_DESIGN_RULES)

Este documento contiene las normativas estrictas de diseño, paleta de colores y componentes visuales experimentadas en la plataforma de **WAPPY IA**. Su propósito es servir como la "Biblia visual" para cualquier Agente de Inteligencia Artificial o Desarrollador que vaya a crear o refactorizar páginas, modales o secciones completas.

> **Objetivo:** Mantener una consistencia absoluta, moderna y purista en toda la aplicación, enfocada en tonos Esmeralda, efectos de desenfoque (glassmorphism/blur) y micro-animaciones SVG en código nativo, libres de dependencias externas.

---

## 1. 🌈 Paletas de Colores (Theme Colors)

Toda la aplicación se basa fuertemente en el ecosistema **Tailwind CSS**. 
Los colores insignia son el **Verde y Esmeralda**, mezclados en ocasiones particulares con **Cyan** para lograr gradientes "premium" y tecnológicos.

*   **Principal:** `green-500` (#22c55e) y `green-600` (#16a34a)
*   **Secundario/Refuerzo:** `emerald-500` / `emerald-600`
*   **Acentos (Gradientes):** `cyan-500` / `cyan-600`
*   **Superficies:** Clases nativas de LibreChat como `bg-surface-primary` y `bg-surface-secondary` para mantener compatibilidad pura con el Dark Mode automático.
*   **Textos:** Alternar jerarquías usando `text-text-primary`, `text-text-secondary`, y `text-text-tertiary`.

---

## 2. ✒️ Tipografía y Efectos de Texto (Headings & Text)

Los Títulos grandes de las Landing Pages, Planes o Políticas, **nunca son sólidos**. Siempre utilizan un degradado que da el aspecto de una marca de vanguardia.

**Para Títulos Principales (H1 / H2 Grandes):**
```tsx
<h1 className="bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent font-extrabold tracking-tight">
    Título de la Página
</h1>
```

**Para la descripción textual:**
Evita negro absoluto. Utiliza siempre `text-text-secondary` con tamaño base o texto relajado (`leading-relaxed`).

---

## 3. 🖼️ Cajas y Tarjetas (Glassmorphism & Cards)

Todas las secciones informativas usan **Tarjetas con efecto Vidrio (Glassmorphism)**, animaciones sutiles al posicionar el mouse (Hover) y sombras sutiles verdes.

**Plantilla base para Tarjetas (`Section/Cards`):**
```tsx
<div className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5">
    {/* Contenido */}
</div>
```

**Bloques de Información de Pie de Página (Contact / Footer Modules):**
Tienen un gradiente ultra transparente y un borde coloreado tenue.
```tsx
<div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-cyan-500/5 p-8 text-center">
    {/* Contenido de contacto */}
</div>
```

---

## 4. ✨ Fondos y Luces Ambientales (Glow & Ambient)

WAPPY detesta los fondos vacíos. Por ende, los paneles de actualización, o el fondo de una vista importante, siempre debe tener "reflejos/brillos" borrosos como luces en las esquinas posteriores:

*   Siempre con la clase `pointer-events-none` (para no arruinar intereacciones de botones).
*   Se anclan con coordenadas del padre contenedor relative.

```tsx
{/* Brillo Verde Superior Derecho */}
<div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-green-500/20" />

{/* Brillo Esmeralda Inferior Izquierdo */}
<div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-emerald-500/20" />
```

---

## 5. 🎨 Íconos y Animaciones SVG (Micro-Animations)

**Regla de Oro:** NO usar íconos estáticos y aburridos cuando se trata de Hero Sections o Prompts Principales.

1.  **Dibuja con código en lugar de importar:** Construye SVGs directamente en React Componentes (e.j., `<ShieldSVG />`, `<HandshakeSVG />`).
2.  **Animaciones SMIL predeterminadas:** Dentro de la etiqueta SVG, inyecta micro-animaciones del tipo `<animate>` nativas que se comporten de manera cíclica:
    *   **Latidos (Pulses):** `<animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />`
    *   **Dibujar Bordes:** `<animate attributeName="stroke-dasharray" from="0 300" to="300 0" dur="1.5s" fill="freeze" />`
3.  Utiliza stroke `#22c55e` de grosor `1.5`, `2` o `2.5`. Emplea `<linearGradient>` de `green-500` a `cyan-500` si necesitas que el trazo tenga degradado.

---

## 6. 🖲️ Botones y Call-To-Actions (CTAs) Prominentes

Reemplaza los botones toscos (bloques sólidos pesados) por integraciones híbridas suaves de Ícono Animado + Texto con Subrayados interactivos.

**Ejemplo correcto de Action Button / Link:**
```tsx
<a href="/ruta" className="relative flex items-center justify-center gap-3 px-6 py-3 font-bold text-gray-800 dark:text-gray-200 transition-all duration-300 ease-in-out z-10 hover:scale-105 hover:text-green-600 dark:hover:text-green-400">
    <ComponenteDeIconoAnimadoSVG />
    <span className="text-xl tracking-wide border-b-2 border-transparent hover:border-green-500 transition-colors">
        Texto de Acción
    </span>
</a>
```

---

## 📌 Checklist al Diseñar o Alterar un Componente en WAPPY IA:
- [ ] ¿Los colores respetan la temática principal `green-500` / `emerald-600`?
- [ ] ¿Eliminé rastros previos de botones `blue-500`, `indigo-500`, o violetas en modales Premium?
- [ ] ¿Los títulos están formateados en `bg-clip-text text-transparent bg-gradient...`?
- [ ] ¿La nueva tarjeta utiliza la combinación `border border-border-medium/50` y el `backdrop-blur` clásico de las demás vistas de Auth?
- [ ] ¿Reemplazaste un icono importado genérico estático por un hermoso SVG animado con la etiqueta `<animate>` o `<animateTransform>` en su lugar?
- [ ] ¿Se adapta impecablemente al Dark Mode usando `dark:text-white` o las variables `surface-secondary / text-primary`?
