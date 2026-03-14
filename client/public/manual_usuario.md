# 📖 Manual Completo de Usuario - WAPPY IA

Bienvenido al manual oficial y exhaustivo de **WAPPY IA**. Esta guía contiene toda la información detallada sobre el funcionamiento de la plataforma, el Gestor del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST), sus herramientas, cómo utilizarlas y los planes de suscripción.

---

## 🚀 1. Exploración y Navegación Principal

La plataforma está diseñada para ser intuitiva. Desde la barra lateral izquierda tienes acceso rápido a:

*   **💬 Chat Principal** (`/c/new`): Aquí hablas con la Inteligencia Artificial de forma general. Puedes hacer consultas de SST, leyes, pedir redacción de correos o análisis de datos rápidos.
*   **🏢 Gestor SG-SST** (`/sgsst`): El módulo estrella. Automatiza todo el ciclo PHVA (Planear, Hacer, Verificar, Actuar) exigido por la normativa colombiana (Resolución 0312 y Decreto 1072).
*   **🎓 Aula de estudio** (`/training`): Zona de capacitación donde los usuarios pueden encontrar cursos y material de SST.
*   **📰 Blog** (`/blog`): Artículos y actualizaciones. La IA (Tenshi) lee automáticamente estos artículos para estar siempre al día.
*   **📁 Archivos** (`/search?type=files`): Tu nube privada donde gestionas todos los documentos y evidencias que has subido.
*   **💳 Planes** (`/planes`): Selecciona y gestiona tu suscripción a WAPPY IA de forma segura a través de Wompi.
*   **⚙️ Configuración**: Ajustes de tu cuenta, cambio de contraseña, y notificaciones (ícono de campana).

---

## 🏢 2. Gestor SG-SST: Funcionamiento Detallado (Ciclo PHVA)

Para que los documentos se generen correctamente, el primer paso SIEMPRE es hacer clic en el botón con el **icono de edificio (🏢 Información de la Empresa)** ubicado en la pantalla principal del Gestor SG-SST (`/sgsst`). Aquí debes llenar: NIT, Representante Legal, ARL, Actividad Económica, CIIU, Clase de Riesgo y Trabajadores. 

> **Nota General sobre Botones:** En casi todos los aplicativos encontrarás la siguiente botonera estándar dispuesta en la parte superior:
> *   **🪄 IA Dummy**: Botón verde aqua ubicado como primera opción. Sirve para autocompletar el formulario con datos simulados y realistas generados localmente o por IA. Es de extrema utilidad para entender y explorar cómo funciona un módulo sin tener que digitar datos reales manualmente.
> *   **💾 Guardar Datos**: Botón con el icono de base de datos. Salva el progreso del formulario localmente en la base de datos de la empresa para que no pierdas lo digitado. *(Aún no genera el informe)*.
> *   **⏱️ Historial**: Permite visualizar reportes o informes de IA que hayas generado con anterioridad para reutilizarlos o reimprimirlos.
> *   **✨ Generar Informe con IA**: El botón principal y más destacado. Recopila toda la información de pantalla y solicita a la IA especializada (Gemini) crear una redacción corporativa o un informe estructurado.
>
> **Edición HTML y Exportación:** Una vez la IA responde, su texto aparecerá en la parte final de la página dentro del **Editor de Texto enriquecido (LiveEditor)**. 
> *   Este editor es donde "visualizas" el resultado en formato HTML interactivo. Puedes borrar texto, añadir párrafos y manipular tablas libremente antes de finalizar el trabajo.
> *   Acompañando al editor y a la botonera superior (luego del flujo de generación) aparecerán nuevos botones: **"Guardar Informe"** (asegura el documento final), y el selector **"📤 Exportar"** el cual se despliega y permite descargar de inmediato tu informe directamente como **archivo PDF nativo**, o documento de texto compatible con **Microsoft Word (.docx)** para que lo archiven tus clientes.

El gestor está dividido por colores y fases metodológicas:

### 📝 A. FASE PLANEAR (Color Azul)
*Base documental y planificación del sistema.*

1.  **Política SST** (`/sgsst/politica`)
    *   **¿Para qué sirve?**: Genera automáticamente la política central de SST de tu empresa, garantizando que cumpla con los 3 compromisos de ley (protección, cumplimiento legal y mejora continua).
    *   **Cómo interactuar**: El sistema toma automáticamente la actividad económica y nivel de riesgo de la información de la empresa. Haz clic en "Generar con IA". Puedes editar el resultado en el editor integrado y luego exportarlo a PDF o Word.
2.  **Objetivos SST** (`/sgsst/objetivos`)
    *   **¿Para qué sirve?**: Traza metas claras y medibles alineadas a tu política.
    *   **Cómo interactuar**: Ingresa el año actual. Puedes añadir filas a la tabla, establecer indicadores y recursos (o simplemente darle al botón "IA Dummy" para llenar de ejemplos la tabla). El botón mágico "Generar Plan con IA" compilará todo en un acta formal.
3.  **Diagnóstico Inicial (Res. 0312)** (`/sgsst/diagnostico`)
    *   **¿Para qué sirve?**: Autoevaluación de los Estándares Mínimos.
    *   **Cómo interactuar**: Contiene un cuestionario oficial navegable por capítulos, expandible haciendo clic en los títulos. Para cada ítem debes marcar "Cumple", "No Cumple" o "No Aplica". Una barra de progreso circular en una esquina calcula tu puntaje sobre 100% en tiempo real. Al finalizar, generarás el informe de hallazgos.
4.  **Matriz Legal** (`/sgsst/matriz-legal`)
    *   **¿Para qué sirve?**: Identifica decretos y resoluciones aplicables a tu caso.
    *   **Cómo interactuar**: Añade normas especificando Año, Entidad, Artículos y evidencias (botón "+ Agregar Norma"). El botón "Analizar Cumplimiento con IA" tomará tu lista y redactará un informe gerencial detallando incumplimientos.
5.  **Reglamento de Higiene y Seguridad Industrial (RHS)** (`/sgsst/reglamento-higiene`)
    *   **¿Para qué sirve?**: Documento legal obligatorio (Art. 349 CST).
    *   **Cómo interactuar**: Selecciona los riesgos específicos marcando las cajas de riesgos (Físicos, Químicos, Biológicos, Psicosociales, Biomecánicos). La IA unirá esos factores y redactará el documento listo de forma instantánea.
6.  **Reglamento Interno de Trabajo (RIT)** (`/sgsst/reglamento-interno`)
    *   **¿Para qué sirve?**: Regula las normativas, sanciones y condiciones del trabajo corporativo.
    *   **Cómo interactuar**: Se llenan variables como la escala de faltas, los horarios de trabajo, etc. La IA consolida un documento magno y muy extenso (suele demorar un poco en cargar su redacción) con todo el texto de ley.
7.  **Responsable SG-SST** (`/sgsst/responsable`)
    *   **¿Para qué sirve?**: Documento o Acta de designación del responsable SST de la entidad.
    *   **Cómo interactuar**: Diligencia el nombre, cédula, cargo y licencia SST de la persona (o llénalo con IA Dummy). La IA cruzará esa información con la "Clase de Riesgo" de la empresa (llenada previamente en perfil empresa) para asignarle roles de acuerdo al estándar de la resolución 0312.

### 🛠️ B. FASE HACER (Color Amarillo)
*Ejecución y gestión del riesgo en la práctica.*

1.  **Perfil Sociodemográfico** (`/sgsst/perfiles-sociodemograficos`)
    *   **¿Para qué sirve?**: Recolectar datos paramétricos de salud y antecedentes del recurso humano.
    *   **Cómo interactuar**: Consta de pestañas. La pestaña "Recolección (QR)" permite a los administradores mostrar un QR para que los trabajadores lo escanéen e ingresen sus datos (o puedes copiar y enviar la URL manual). La pestaña "Análisis" pinta Gráficos circulares de forma automática a medida que entran respuestas. Y en la pestaña del "Informe", darás la orden a la IA de interpretar todas las estadísticas arrojadas.
2.  **Matriz de Peligros (GTC-45)** (`/sgsst/matriz-peligros`)
    *   **LA JOYA DE LA CORONA:** Es el aplicativo más robusto y potente. 
    *   **Cómo interactuar**: Añades filas a tu tabla. describes el cargo, la tarea, clasificas el Peligro, e indicas los controles de barrera (Fuente, Medio, Individuo).
    *   **Cálculo Automático**: Al seleccionar la escala del Nivel de Deficiencia (ND) (Ej. 10 - Muy grave) y la Exposición (NE) (Ej. 4 - Continua). El software y el navegador calcularán al instante la matemática de (ND x NE), pintando tu tabla con alertas rojas (No Aceptable) o Verdes automáticas. El botón secundario de Varita IA reacciona fila por fila si le pides evaluar un factor.
3.  **Análisis de Trabajo Seguro (ATS)** (`/sgsst/ats`)
    *   **¿Para qué sirve?**: Checklist antes de acometer trabajos no recurrentes / peligrosos.
    *   **Cómo interactuar**: Puedes autocompletar nombres ingresando letras en la barra de "Trabajadores involucrados" ya que la barra está linkeada a tu listado sociodemográfico. Estableces los "pasos", llenas los EPP obligatorios activando checkboxes (Ej. usar arnés y gafas) y generas el reporte corporativo de ATS preparado para que lo exportes a PDF e imprimas y la gente firme a mano en terreno.
4.  **Permiso en Alturas** (`/sgsst/permiso-alturas`)
    *   **¿Para qué sirve?**: Acta autorizante para ejecutar labores a desnivel +1.5 o 2.0 metros.
    *   **Cómo interactuar**: Llenas información de clima, coordenadas, rescatistas, coordinador de alturas con licencia. Luego tiene recuadros para pasar lista a la dotación, si un "EPP" está faltante en el listado, el reporte generado alertará de un nivel alto de criticidad de detención de operación.
5.  **Investigación ATEL (Accidente/Enfermedad)** (`/sgsst/investigacion-atel`)
    *   **¿Para qué sirve?**: Para emitir reportes formales a la ARL / MinTrabajo conforme Res. 1401 sobre siniestros y fallecimientos.
    *   **Cómo interactuar**: Formato masivo de descripción, donde el botón de "IA Dummy" puede crear un escenario simulado dramático. Describe nombre y datos exactos del afectado. Escribe textualmente cómo ocurrieron los hechos e involucra testigos. El motor RAG generará un documento tipo forense para ti con apartados de firma legalizados, el cual exportas en Word para firmar y remitir a entes.
6.  **Estadísticas ATEL (Indicadores)** (`/sgsst/estadisticas-atel`)
    *   **¿Para qué sirve?**: Calculadora tabuladora de Incidencia, Prevalencia y Severidad.
    *   **Cómo interactuar**: Sidebar mensual en celular. Por cada mes (ej. Agosto), informas "¿Cuántos empleados totales laboraron?". Luego de presionar "+ Añadir evento", escribes cada ausencia médica que ocurrió y "duración en Días". En tiempo real observas a la derecha los consolidadores numéricos, y cuentas con dos botones IA distintos para redactar informe del mes en curso o Informe Global Anual.
7.  **Análisis de Vulnerabilidad** (`/sgsst/vulnerabilidad`)
    *   **¿Para qué sirve?:** Eje de los planes de contingencia (Sismos, fuego).
    *   **Cómo interactuar**: Ingresa amenazas y presiona el panel "Cuestionarios de Calificación". Calificas sub-puntos. La interfaz web renderizará un Rombo o Diamante de Vulnerabilidad visual que toma colores entre Verde/Amarillo/Rojo dependiendo de tu puntaje en (Personas, Sistemas, Institucional).
8.  **Método OWAS (Ergonomía)** (`/sgsst/metodo-owas`)
    *   **¿Para qué sirve?**: Prevenir hernias, y lesiones músculoesqueléticas por carga física/posturas.
    *   **Cómo interactuar**: Añade filas registrando posiciones: si la espalda del empacador estaba doblada, los brazos encimas del hombro y la carga pesaba +10kgs, la tabla pintará de inmediato una Categoría de Acción. La IA leerá la tabla y diagnosticará una rotación de turnos sugerida.
9.  **Reporte de Actos y Condiciones Inseguras** (`/sgsst/reporte-actos`)
    *   **¿Para qué sirve?**: Tickets de seguridad generados por observadores u obreros.
    *   **Cómo interactuar**: Diligencias ubicación de riesgo inminente (ej. piso mojado constante sin cinta), adjuntas hasta 3 Fotografías y la IA elaborará una acción preventiva rápida estilo memo corporativo.

### 🔍 C. FASE VERIFICAR (Color Rojo)
*Auditoría y control de cumplimiento.*

1.  **Auditoría SG-SST** (`/sgsst/auditoria`)
    *   **¿Para qué sirve?**: Checklist anual de escrutinio interno del sistema por la gerencia.
    *   **Cómo interactuar**: Similar al Diagnóstico, es un gran cuestionario. Pero aquí el poder yace en escribir en la caja de texto "Hallazgo/Evidencia". Si marcas "No cumple", debes anexar un texto (Ej. Falta política publicada). La IA auditará de manera "dura" tu texto y creará planes estructurados.

---

## 👼 3. Tenshi: El Asistente IA (Tu Guía Permanente)

**Tenshi** es el chatbot nativo incrustado como un "burbuja emergente" en la esquina de tu pantalla, que te acompaña sin salirte de lo que estás haciendo en base de datos.

*   **¿De qué se nutre Tenshi?** 
    1. Del manual que estás leyendo ahora mismo (conoce la ruta `/sgsst/matriz-peligros`, comandos, ubicación de todos los botones y exportaciones).
    2. De los recientes posteos del **Blog** WAPPY (conoce las leyes recién promulgadas).
    3. De los documentos internos inyectados por el sistema de base de datos vectorial (RAG).
    4. Del sistema de PQRS (revisa si un problema similar ya fue resuelto a un usuario).
*   **Casos y Consejos de Uso para Hablar con Tenshi**:
    - **Navegación**: *“Oye Tenshi, no veo donde colocar a mis empleados para autocompletar el ATS, ¿Por qué módulo paso?”* -> Ella responderá que debes agregarlos mediante el Perfil Sociodemográfico.
    - **Teoría SST**: *"Tenshi, en la Matriz GTC-45 me sale riesgo Rojo (No aceptable), ¿Si pongo EPPs lo rebajo a amarillo?"* -> Te dará una excelente retroalimentación legal explicando que el EPP está al nivel inferior de un control, y podrías necesitar sustitución.
    - **Errores**: *"No me sale el botón Exportar a PDF"* -> Te dirá que asegures darle clic primero al botón "✨ Generar con IA", porque la caja de edición solo aparece al terminarse texto allí.

---

## 💳 4. Planes y Facturación (Sistema Integrado Wompi)

WAPPY IA funciona bajo modelo SaaS. Puedes elegir pagar Mensual, Trimestral, Semestral o Anual. Pagar periodos largos suele aplicar un descuento automático. Tenemos 4 niveles ([ver /planes](https://ia.wappy-ia.com/planes)):

### 1. Plan Gratis ($0)
*   **Propósito:** Para explorar la IA.
*   **Incluye:** Chat básico de IA, Aula de estudio, máx 10 conversaciones, permite ingresar 1 clave API propia de Google Gemini.
*   **NO incluye:** Gestor SG-SST, Blog ni Agentes.

### 2. Plan Go ($29.500 COP)
*   **Propósito:** Para productividad personal aumentada.
*   **Incluye:** Todo lo del gratis + Acceso al Blog WAPPY, hasta 30 conversaciones abiertas, y permite 4 claves API de Gemini.
*   **NO incluye:** Gestor SG-SST ni Agentes.

### 3. Plan Plus ($34.700 COP) - ⭐ EL MÁS POPULAR
*   **Propósito:** Acceso completo para prevencionistas y empresas.
*   **Incluye:** **¡El Gestor SG-SST completo!** Todo el ciclo PHVA, conversaciones ilimitadas con la IA y 10 claves API de Gemini.
*   **¿Por qué elegirlo?:** Es el ecosistema total para automatizar la Resolución 0312 a un precio imbatible.

### 4. Plan Pro ($39.800 COP)
*   **Propósito:** El poder máximo de WAPPY IA.
*   **Incluye:** Todo lo de Plus + **Creación de Agentes con IA personalizados**. ¿Quieres crear un asistente IA que solo responda de contabilidad de tu empresa? En este plan puedes configurar tu propio Marketplace de agentes.

**Manejo de pagos y códigos Promocionales:**
La caja registradora de pagos conectada con **Bancolombia Wompi**. Soporta todo medio: Botón PSE, Tarjetas Débito/Crédito y Nequi. En la pasarela de compra siempre verás "Ingresar Cupón o Promo"; digítalo ahí antes de facturar.

---

## 🎫 5. Soporte, Problemas y Tickets (PQRS)

Si encuentras fallas o algo en pantalla produce error (Ej: un cartel rojo):
1. Dirígete en el menú a **⚙️ Tu Nombre / Cuenta** (esquina inferior izquierda).
2. Selecciona **Notificaciones** o ve a la pestaña **Cuenta > Zona de Peligro**.
3. Da clic en **Crear un nuevo Ticket PQRS**.
4. Detalla profundamente y relata la ruta (dónde estabas presionando cuando te salió). ¡El staff tecnológico WAPPY responderá y tu "Campanita 🔔" de notificaciones en el tope de pantalla brillará alertándote el cierre del asunto!
