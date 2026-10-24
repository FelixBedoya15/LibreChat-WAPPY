# Modos y estilos: qué preguntar al empezar

Josema elige cómo quiere cada vídeo. Al empezar un proyecto nuevo se le hace **una sola tanda de preguntas**
(AskUserQuestion, máximo 4) y a partir de ahí se ejecuta sin volver a preguntar. Lo elegido se guarda en
`ESTILO` (index.html) con `anim.py nuevo ... --modo --tema --sonido ...` y se cambia con `anim.py estilo`.

**No preguntes** si ya lo ha dicho en su mensaje («como la de Muse», «sin música», «hazlo con capas»), si pide
retocar un proyecto que ya tiene estilo, o si dice «no me preguntes / solo ejecuta»: entonces aplica los valores
por defecto de la tabla y cuéntale al final lo que elegiste.

## Contenido

1. Los cuatro modos
2. Las preguntas
3. Valores por defecto
4. Qué cambia cada opción
5. Densidad: cuántos golpes visuales

## 1. Los cuatro modos

| Modo | Qué pasa | Entrada | Flujo |
|---|---|---|---|
| **audio** | Animación a pantalla completa que acompaña una voz en off | audio (o transcripción con marcas) | SKILL.md pasos 1–8 |
| **cara** | Su cara sin pausas alternando con animaciones a pantalla completa (intro de Muse) | vídeo a cámara | `references/intro-con-cara.md` |
| **capas** | Su cara siempre en pantalla con la animación integrada: detrás y delante de él, fondo sustituido, tarjetas de interfaz, subtítulos | vídeo a cámara | `references/capas-sobre-video.md` |
| **combinado** | Capas + planos de animación a pantalla completa, con transiciones sin corte (la grabación se convierte en una ficha que vuela, cuchilla) | vídeo a cámara | `references/capas-sobre-video.md` |

Si pasa un audio, el modo es **audio** (no se pregunta). Si pasa un vídeo a cámara, se pregunta entre cara, capas
y combinado.

## 2. Las preguntas

Una sola llamada a AskUserQuestion, **después de transcribir y de `anim.py lectura`** (las opciones dependen de este
vídeo). Opción recomendada primero, con «(Recomendado)». Si el modo es audio, no hay pregunta 1 (pregunta 2, 3 y 4).

1. **Modo** (solo con vídeo) — «¿Cómo monto las animaciones con tu cara?»
   - Combinado (Recomendado): tu cara con animaciones integradas y cortes a animación a pantalla completa.
   - Capas: tu cara siempre visible, con la animación detrás y delante de ti.
   - Cara ↔ animación: como la intro de Muse, alternando planos.
2. **Dirección visual** — «¿Qué idea visual le damos a este vídeo?». **No son opciones fijas**: 2–3 conceptos
   pensados para ESTE vídeo (`references/direccion.md` § 2–3), distintos entre sí y del último vídeo del historial.
   Cada opción: nombre de la idea en la etiqueta y, en la descripción, fondo + acabado + tipografía + acento + una
   frase de qué se verá. Ejemplo para un vídeo sobre un agente que automatiza el correo:
   - Centralita (Recomendado): constelación con cables y paquetes de luz, acabado contorno, grotesk, rojo de Gmail:
     cada correo entra como una llamada que el agente enruta.
   - Bandeja que se vacía: liso, sólido, editorial, azul: los correos caen en montones y se van resolviendo.
   - Consola: cortina diagonal, contorno, grotesk, ámbar: todo entra tecleado como un log.
   (El tema oscuro de siempre, con un color por protagonista, es una opción más cuando el vídeo es una comparativa.)
3. **Sonido** — «¿Qué lleva el audio además de tu voz?»
   - Voz + efectos + música (Recomendado en intros): golpes, whooshes y ticks en cada animación y música épica de
     fondo bajo la voz, con un golpe del tema cuadrado con el revelado (`anim.py golpe`); mezcla a −14 LUFS.
   - Voz + efectos: sin música (para partes que explican o si él pone la música en su edición).
   - Solo voz: como hasta ahora; él mezcla en su edición.
4. **Densidad** — «¿Cuánta animación?»
   - Espectáculo: algo nuevo cada 1,5–3 s (el vídeo de referencia).
   - Media (Recomendado en explicaciones): cada 3–5 s.
   - Sobria: solo en lo importante, cada 5–8 s.

Extras que no se preguntan (se deciden por el concepto y se cuentan al final; él puede pedirlos):
subtítulos (palabra a palabra, por frases o ninguno; `--subtitulos`), cámara en mano (`--camara-en-mano`, no por
defecto: con fichas de vídeo se nota el salto), tema de música (`--musica`, `references/sonido.md`), acento
(`--acento`), fondo (`--fondo`), acabado (`--acabado`) y tipografía (`--tipo`) si no salieron en la pregunta 2.

## 3. Valores por defecto (si no se pregunta)

Los de la tabla son el punto de arranque técnico, **no el diseño**: el concepto (fondo, acabado, tipografía, acento,
transiciones, piezas) se decide para cada vídeo con `references/direccion.md`, distinto del último del historial.

| | audio | cara | capas / combinado |
|---|---|---|---|
| tema | oscuro | oscuro | profundidad |
| fondo · acabado · tipo | — | — | los del concepto (arranque: cortina · cristal · outfit) |
| acento | — (colores por protagonista) | — | el de la marca protagonista o el del tono del vídeo; `#3E6EF2` solo si no hay otro con más sentido y no dos vídeos seguidos; amarillo `#FFD21F` si pide «como el vídeo de referencia» |
| sonido | voz | voz | musica (`intro-tambores` en intros, a −15 dB y con `anim.py golpe`; `explicacion-jazz` en partes que explican) |
| densidad | media | media | espectaculo en intros, media en explicaciones |
| subtítulos | no | no | sí |

## 4. Qué cambia cada opción

- **tema profundidad**: `new Cortina(FONDOK)` como fondo (lo crea la plantilla sola; `Espacio` solo si Josema lo
  pide), piezas de `motor/piezas.js` (panel de cristal, Rotulo, PanelTareas, Explorador, RevelarHaces, RutaPasos…),
  acento en `--acento`. Punto de partida para una intro con capas: `ejemplos/editado-por-ia.html`. Los protagonistas
  siguen teniendo su color de marca en logos y tarjetas; el acento es para rótulos, halos, subrayados y la palabra
  que suena en los subtítulos.
- **tema oscuro**: rejilla de puntos y halos por bando (`references/diseno.md` § 1–2). Se pueden usar las piezas
  nuevas igualmente (buscador, notificación, tarjetas…): toman el acento.
- **sonido efectos / musica**: cada entrada y salida de una pieza lleva su `sfx()` (las piezas nuevas lo ponen
  solas; en las de siempre, a mano con la tabla de `references/diseno.md` § 5). `anim.py render` y `montar` mezclan
  solos. Entrega además las pistas sueltas (trabajo/pistas/) por si quiere remezclar.
- **densidad**: marca el ritmo del guion visual (§ 5); la sugiere `anim.py lectura` por el ritmo de su voz.
- **fondo** (`cortina`, `aurora`, `malla`, `constelacion`, `liso`, `puntos`), **acabado** (`cristal`, `solido`,
  `contorno`) y **tipo** (`outfit`, `grotesk`, `editorial`): `references/direccion.md` § 3. `anim.py estilo --fondo …`
  los cambia en cualquier momento; todas las piezas los toman solas.
- **subtítulos**: `new Subtitulos({...})`; ocúltalos en las animaciones a pantalla completa y cuando otro texto
  ocupe la parte de abajo.

## 5. Densidad: cuántos golpes visuales

Un golpe = algo nuevo que entra (una pieza, un cambio de fondo, un corte a animación, una transición).

| Densidad | Golpes | Cara sola como mucho | Uso |
|---|---|---|---|
| espectaculo | 1 cada 1,5–3 s | 3 s | intros, ganchos, tráileres (el vídeo de referencia: 16 golpes en 36 s) |
| media | 1 cada 3–5 s | 6 s | partes que explican, comparativas |
| sobria | 1 cada 5–8 s | 10 s | tutoriales largos, disclaimers |

En cualquier densidad: nunca dos golpes grandes a la vez (un revelado y un rótulo gigante), y cada golpe sale con
su palabra (0,02–0,05 s antes).
