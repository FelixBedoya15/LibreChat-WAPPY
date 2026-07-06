# De la Idea a tu Propia App
## Curso práctico de plataformas web para emprendedores (sin necesidad de programar)

---

## 1. Posicionamiento del curso

**Para quién es:** emprendedores, dueños de negocio o freelancers que NO saben programar pero quieren tener su propia aplicación web funcionando en internet, con dominio propio, hosting propio y funciones de IA.

**Promesa central:** al terminar, cada estudiante tiene su app real, en producción, con su propio dominio, corriendo en su propio servidor — construida con la ayuda de Antigravity (IA de Google) y potenciada con la API de Gemini.

**Diferenciador clave a comunicar siempre:** este NO es un curso de programación. Es un curso de "cómo dirigir a una IA para que te construya y despliegue tu plataforma", entendiendo lo mínimo necesario de cada pieza (dominio, servidor, Docker, GitHub) para no depender de nadie después.

---

## 2. Formato y duración

- **9 clases** de **2.5 horas** cada una = 22.5 horas totales
- **2 clases por semana** → dura **4.5 semanas** (o modalidad intensiva: 3 días de fin de semana largo)
- Modalidad: presencial u online en vivo (no grabado), con acompañamiento asíncrono (WhatsApp/Discord) entre clases para resolver errores de configuración

### Estructura de grupo: 16 personas, con división estratégica

| Bloque | Clases | Formato |
|---|---|---|
| **Fundamentos (teórico)** | Clases 1-4 (mentalidad, dominios, VPS, Docker/Dokploy) | **Grupo completo de 16** — contenido igual para todos, menos exigente en soporte 1:1 |
| **Construcción y deploy (práctico)** | Clases 5-9 (Antigravity, Gemini API, funciones de negocio, deploy final) | **Divididos en 2 subgrupos de 8** — mismo contenido, pero en sesiones separadas para dar soporte real en el deploy de cada quien |

Esto mantiene el acompañamiento personalizado donde más se necesita (cuando cada estudiante está construyendo y desplegando SU app), sin sacrificar el tamaño total del curso.

---

## 3. Temario detallado

### Clase 1 — Mentalidad y arranque del proyecto
- Qué es una "plataforma web" y qué puede hacer por un negocio (leads, ventas, automatización, atención con IA)
- Presentación de Antigravity: qué es, cómo funciona, qué puede y qué no puede hacer
- Cada estudiante define **su proyecto**: ¿qué app va a construir para su empresa? (ficha de producto simple: problema, usuario, funciones clave)
- Creación de cuentas: Google AI Studio (Gemini API key), GitHub, cuenta de correo de trabajo

### Clase 2 — Dominios
- Qué es un dominio, cómo elegir el nombre correcto para el negocio
- Compra de dominio (Namecheap / GoDaddy / .co)
- DNS explicado sin jerga: registros A, CNAME
- Tarea: cada quien compra su dominio

### Clase 3 — Servidores VPS
- Qué es un VPS y por qué es mejor que un hosting compartido para este tipo de apps
- Elegir proveedor (Hostinger, DigitalOcean, Contabo) según presupuesto
- Contratar el VPS, acceso por SSH (lo mínimo indispensable, con plantillas de comandos)
- Seguridad básica: usuario, firewall, actualización del sistema

### Clase 4 — Docker y Dokploy
- Qué es contenedorizar una app (analogía simple, sin tecnicismos)
- Instalar Docker en el VPS
- Instalar Dokploy y conectar el dominio
- Tour de la interfaz de Dokploy: apps, bases de datos, variables de entorno

### Clase 5 — GitHub como "caja fuerte" y primer Deploy
- Para qué sirve un repositorio (control de versiones explicado con ejemplos de negocio, no de código)
- Creación de un proyecto base "plantilla" o "Template Starter" simple para pruebas
- Crear repo en GitHub, subir la plantilla base del proyecto
- Conectar el repositorio a Dokploy → configuración de **deploy automático** (CI/CD) para ver la plantilla corriendo en vivo en su dominio

### Clase 6 — Construcción de la app con Antigravity (parte 1)
- Cómo escribir buenos prompts para pedirle a Antigravity que construya funciones (formularios, páginas, secciones)
- Construcción guiada de la estructura base real de la app de cada estudiante (reemplazando la plantilla de la Clase 5)
- Git commit y push para ver el despliegue automático en producción a través de Dokploy

### Clase 7 — Construcción con Antigravity + Gemini API (parte 2)
- Añadir inteligencia a la app: chatbot, generación de textos/imágenes, recomendaciones — usando la Gemini API key
- Conectar formularios a WhatsApp, correo o Google Sheets (automatizaciones simples)
- Iterar la app según feedback en clase

### Clase 8 — Funciones de negocio y pulido
- Autenticación simple (login), base de datos básica
- Ajustes de diseño y textos con ayuda de Antigravity
- Checklist de "app lista para producción": SSL, velocidad, textos legales mínimos (términos, privacidad)

### Clase 9 — Deploy final y Demo Day
- Deploy definitivo a producción con dominio propio + certificado SSL
- Cada estudiante presenta su app en vivo (demo de 5–7 min)
- Cierre: cómo mantener la app, próximos pasos, mantenimiento mensual, comunidad de egresados

---

## 4. Entregable final del estudiante
- App web propia, en producción
- Dominio propio funcionando
- Servidor VPS propio configurado
- Repositorio en GitHub con su proyecto
- Al menos una función con IA (Gemini) integrada
- Capacidad de seguir iterando la app solo, usando Antigravity

---

## 5. Precio y forma de pago

**Precio del curso: COP 1.700.000 por estudiante**, en **2 cuotas de $850.000**:

| Cuota | Monto | Momento del pago |
|---|---|---|
| 1ra cuota | $850.000 | Al inscribirse (asegura el cupo) |
| 2da cuota | $850.000 | **Antes de la Clase 5** (~2 semanas después de iniciado el curso, justo antes de empezar la construcción de la app con Antigravity) |

**Por qué ese momento para la 2da cuota:**
- Para la Clase 4, el estudiante ya tiene su dominio comprado, su VPS funcionando, y Docker/Dokploy corriendo — ya vio resultados tangibles antes de pagar el resto.
- Las Clases 5-9 son las que más esfuerzo de acompañamiento 1:1 demandan (construcción y deploy real de cada proyecto) — tiene sentido tener el pago completo antes de entrar ahí.
- Sirve como filtro natural de compromiso: quien no paga la 2da cuota a tiempo, difícilmente iba a sostener el resto del curso.

**Cupos: 16 estudiantes por cohorte**, con la estructura de grupo descrita en la sección 2 (teórico junto, práctico dividido en 2 grupos de 8) para no sacrificar la atención personalizada en la parte más exigente del curso.

**Argumento de valor (no solo precio):** el precio se presenta ancorado contra el costo real de la alternativa — contratar un freelancer para un MVP cuesta entre $3.000.000 y $8.000.000 y tarda 4-8 semanas, sin que el cliente aprenda nada del proceso. Ver el documento de copy de ventas para el fraseo completo.

---

## 6. Requisitos previos para el estudiante
- Computador (no requiere ser potente)
- Tarjeta para pagar dominio + VPS (aprox. USD 5-15/mes de VPS + USD 10-15/año de dominio)
- Ninguna experiencia previa en programación
- Tener una idea clara (aunque sea básica) del negocio/producto que quiere digitalizar

---

## 7. Notas para vos como instructor
- El mayor riesgo no es el contenido, es el **soporte técnico entre clases** cuando algo falla (SSH, DNS que no propaga, Docker que no levanta). Reservá tiempo/canal para esto.
- Conviene tener un proyecto "modelo" armado de antemano para mostrar en cada clase, y dejar que cada estudiante lo adapte a su caso.
- Aclarar desde la Clase 1 qué NO van a poder hacer sin programar (apps muy complejas, integraciones muy específicas) para manejar expectativas.
