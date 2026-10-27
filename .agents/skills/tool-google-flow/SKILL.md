---
name: tool-google-flow
description: >-
  Guía integral para conectar y utilizar Google Flow / Creative Studio (Google Veo para video y Google Imagen para imágenes) de forma 100% privada por usuario en LibreChat-WAPPY y con Tenshi. Permite generar fotos hiperrealistas y vídeos cinematográficos que llegan directamente al chat o al Canvas de Tenshi.
---

# Skill: Conexión y Uso de Google Flow & Studio (`tool-google-flow`)

Esta habilidad capacita a los agentes de WAPPY y a Tenshi para interactuar con **Google Flow & Studio** (los motores generativos **Google Veo** e **Imagen**) mediante la integración privada configurada por cada usuario en LibreChat-WAPPY.

---

## 1. ¿Por qué usar Google Flow en WAPPY?

1. **Generación Cinematográfica de Vídeo (Google Veo):** Permite crear tomas cinematográficas, clips de b-roll, recreaciones de accidentes, maniobras de trabajo seguro y simulacros para enriquecer capacitaciones y reels.
2. **Imágenes Fotorrealistas de Alta Resolución (Google Imagen):** Creación de afiches de seguridad y salud en el trabajo, señalética visual, portadas de lecciones del LMS e infografías.
3. **Entrega Directa en Chat y Tenshi:** Las imágenes y los vídeos generados se insertan automáticamente en el hilo de conversación del usuario (`<video controls>` y visores de imagen) o se proyectan en tiempo real en el **Canvas multimedia de Tenshi**.
4. **Privacidad Total por Usuario:** Cada usuario conecta su propia cuenta de Google Flow o su API Key de Google AI Studio, de manera aislada y sin compartir cuotas con otros usuarios.

---

## 2. Herramientas Clave de Google Flow

### A. Generación de Imágenes (`Google Imagen`)
* **`flow_generate_image`**:
  - `prompt`: Descripción detallada de la escena, estilo, iluminación y composición.
  - `aspect_ratio`: Relación de aspecto (`1:1`, `16:9`, `9:16`, `4:3`).
  - `style`: Estilo visual (`photorealistic`, `cinematic`, `3d_render`, `isometric`, `technical_diagram`).

### B. Generación de Vídeo (`Google Veo`)
* **`flow_generate_video`**:
  - `prompt`: Descripción del movimiento escénico y de cámara.
  - `input_image`: (Opcional) Imagen inicial para animación *image-to-video*.
  - `camera_movement`: Tipo de toma (`orbit`, `pan_left`, `pan_right`, `zoom_in`, `zoom_out`, `pedestal_up`).
  - `duration_seconds`: Duración del clip (5 a 10 segundos).

### C. Estado y Monitoreo
* **`flow_task_status`**:
  - `task_id`: Identificador de la tarea para consultar el progreso del renderizado de vídeo.

---

## 3. Protocolos de Uso por Escuadrón WAPPY

### Escuadrón Vídeos y Redes (Framework de Vídeos)
* Al producir un reel o lección multimedia:
  1. Genera clips de fondo cinematográficos en 9:16 o 16:9 con Veo.
  2. Los vídeos terminados se guardan localmente en `/media/generated/` para usarse en composiciones o descargarse directamente.

### Escuadrón Cursos & LMS
* **Instructional Designer:**
  1. Diseña carátulas de módulos temáticos (Alturas, Químico, Eléctrico) con `flow_generate_image`.
  2. Incorpora los clips generados directamente en las lecciones del curso interactivo.

### Tenshi (Voz y Canvas)
* Cuando el usuario pida por voz un vídeo o imagen:
  1. Tenshi confirma la solicitud de inmediato por voz.
  2. Dispara la generación en segundo plano.
  3. Al completarse, proyecta el reproductor en el Canvas lateral del usuario.

---

## 4. Vinculación Privada por Usuario

Cada usuario vincula su propia cuenta de Google Flow desde:
**Configuración → Integraciones → Google Flow & Studio (Veo & Imagen)**

* **Opción 1 (Automática 1-Clic):** Ejecutar el script autoejecutable en su Terminal / Antigravity (`curl -sL "https://app.wappy.club/api/googleflow/connect-script?token=..." | node`).
* **Opción 2 (API Key directa):** Pegar su clave de Google AI Studio (`AIzaSy...`).
* **Opción 3 (Manual):** Pegar las cookies JSON de su sesión de Google.
