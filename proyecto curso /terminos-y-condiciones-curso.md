# Términos, Condiciones y Alcance del Proyecto
## Curso: De la Idea a tu Propia App

> ⚠️ **Nota importante:** este es un documento base/plantilla, no es asesoría legal. Antes de usarlo con estudiantes reales, te recomiendo que un abogado en Colombia lo revise y lo adapte (especialmente las cláusulas de responsabilidad y reembolsos, que tienen reglas específicas bajo la ley del consumidor).

---

## 1. Naturaleza del curso

El curso enseña a **dirigir herramientas de inteligencia artificial (Antigravity, Gemini API)** para construir y desplegar una aplicación web funcional, dirigido a personas **sin conocimientos de programación**.

No es un curso de programación ni de ingeniería de software. El instructor no garantiza resultados idénticos a un desarrollo hecho por programadores profesionales, ni tiempos de desarrollo ilimitados.

---

## 2. Alcance del proyecto — Cláusula clave

### 2.1 Definición de "proyecto elegible"

Para garantizar que el proyecto se pueda completar dentro de las horas de clase, todo proyecto debe cumplir con **estos límites**:

✅ **Se acepta (alcance estándar, cabe en las 9 clases):**
- Un sitio/aplicación con **una sola función principal** (ej: agendar citas, catálogo con formulario de pedido, landing con chatbot de atención, formulario de captura de leads con IA, mini CRM de un solo módulo, modelo SaaS simple con membresía)
- Máximo **1 tipo de usuario** (no se construyen sistemas con roles múltiples: admin + cliente + repartidor, por ejemplo)
- **Hasta 1 integración externa** (WhatsApp, o Google Sheets, o pasarela de pago con Wompi — una de las tres)
- Diseño basado en plantillas/componentes generados por Antigravity, con personalización de marca (logo, colores, textos)

🟡 **Ruta avanzada (posible, pero sin garantía de completarse dentro de las 9 clases):**
- Modelos **SaaS con membresías recurrentes** (como WAPPY)
- Integración de **pasarela de pago (Wompi)** en producción
- Aplicaciones que manejan **datos sensibles** (salud, información financiera) bajo la Ley 1581 de 2012 (Habeas Data)
- **Combinación de 2 o más integraciones** (ej: WhatsApp + Google Sheets + Wompi)

Estos proyectos son bienvenidos y se pueden desarrollar durante el curso, **pero se le advierte al estudiante desde la Clase 1** que:
- Cada integración adicional o requisito normativo puede requerir **tiempo de trabajo fuera de clase**, además de las 9 sesiones.
- El cumplimiento de normativas de protección de datos (Ley 1581, tratamiento de datos sensibles) es **responsabilidad exclusiva del estudiante** como dueño del proyecto — el instructor enseña la arquitectura técnica, no asesora en cumplimiento legal.
- El instructor puede recomendar **simplificar el alcance para el periodo del curso** (ej: dejar la pasarela de pago en modo "sandbox/pruebas" en vez de producción) y completar la puesta en producción después, con acompañamiento adicional si aplica.

❌ **No se acepta dentro del curso** (por tiempo, no por dificultad conceptual):
- Marketplaces con múltiples vendedores
- Sistemas con lógica de negocio muy compleja (inventarios multi-bodega, nómina, contabilidad completa)
- Migraciones de sistemas ya existentes

### 2.2 Aprobación de alcance

- Cada estudiante presenta su idea de proyecto en la **Clase 1**.
- El instructor **aprueba, ajusta o simplifica** la idea antes de la Clase 2, dejando por escrito (formulario o chat) el alcance final acordado.
- Si un estudiante insiste en un proyecto que excede el alcance, el instructor tiene la potestad de **recortar funciones** para asegurar que se entregue algo funcional al final del curso.
- Cambios de alcance a mitad de curso (el estudiante decide agregar funciones nuevas) **no comprometen tiempo adicional de clase** — se pueden explorar en el acompañamiento asíncrono, sin garantía de completarse.

### 2.3 Qué se garantiza y qué no

**Se garantiza:**
- Que el estudiante aprenda a usar Antigravity, Dokploy, Docker, GitHub y Gemini API para construir y desplegar una app.
- Que, dentro del alcance aprobado, la app quede desplegada en producción con dominio propio.

**No se garantiza:**
- Que la app esté "lista para vender" o sea perfecta estéticamente sin trabajo adicional del estudiante.
- Resultados de negocio (ventas, leads, clientes) derivados del uso de la app.
- Corrección de errores de terceros (caídas de Hostinger, Google, GitHub, cambios en las APIs de Gemini).

---

## 3. Servidor, dominio y costos de terceros

- El estudiante **compra y paga directamente** su propio VPS y dominio, en el proveedor de su elección (se le dan recomendaciones, no obligación de un proveedor único).
- Estos costos **no están incluidos** en el valor del curso, salvo que se especifique lo contrario por escrito.
- El instructor no es responsable de:
  - Renovaciones automáticas o cambios de precio de VPS/dominio/APIs después de finalizado el curso.
  - Uso indebido de las credenciales del estudiante (VPS, GitHub, Gemini API key).
  - Costos generados por el uso de la Gemini API fuera de la capa gratuita (el estudiante es responsable de monitorear su propio consumo).
- Se recomienda a cada estudiante activar alertas de gasto en Google AI Studio / Google Cloud antes de usar su API key.
- Si el proyecto incluye pasarela de pago (Wompi) u otras integraciones de terceros, las comisiones, cuentas comerciales y trámites de habilitación ante esos proveedores corren por cuenta y responsabilidad del estudiante.
- Si el proyecto maneja datos sensibles (salud, información financiera), el estudiante es responsable de cumplir con la normativa de protección de datos aplicable (Ley 1581 de 2012 y demás normas vigentes); el instructor no ofrece asesoría legal ni certifica el cumplimiento normativo del proyecto.

---

## 4. Propiedad del proyecto

- El código, dominio y servidor generados durante el curso son **propiedad exclusiva del estudiante**.
- El instructor puede solicitar permiso para usar capturas o el nombre del proyecto como caso de éxito/testimonio, pero requiere autorización expresa del estudiante.

---

## 5. Soporte y mantenimiento post-curso

- El acompañamiento del instructor cubre **hasta la fecha de finalización del curso** (Demo Day).
- Cualquier soporte, mantenimiento, corrección de errores o adición de funciones después de esa fecha se considera un **servicio adicional**, sujeto a cotización aparte.

---

## 6. Pagos y cancelaciones

- El valor del curso es de **COP 1.670.000**, cubierto exclusivamente la enseñanza y acompañamiento en clase; no incluye infraestructura (VPS/dominio) ni créditos de API.
- **Forma de pago: 2 cuotas de $835.000 cada una.**
  - 1ra cuota: al momento de la inscripción, para asegurar el cupo.
  - 2da cuota: antes de la Clase 5, momento en el que inicia la fase de construcción práctica de la app. **El acceso a las Clases 5-9 queda condicionado al pago completo de la 2da cuota.**
- El curso se dicta en cohortes de **16 estudiantes**, con las Clases 1-4 en grupo completo y las Clases 5-9 divididas en 2 subgrupos de 8 estudiantes cada uno, para garantizar acompañamiento personalizado en la fase de despliegue.
- **Política de reembolso y Derecho de Retracto:** De conformidad con el Estatuto del Consumidor en Colombia (Ley 1480 de 2011), para compras electrónicas y no presenciales, el estudiante cuenta con un término de cinco (5) días hábiles contados a partir del pago de la inscripción (1ra cuota) para ejercer su Derecho de Retracto y solicitar la devolución total del dinero, siempre y cuando no se haya dado inicio al curso (Clase 1). Una vez iniciado el curso o transcurrido este plazo de 5 días hábiles, no aplicarán reembolsos ni devoluciones de dinero bajo ninguna circunstancia, incluyendo retiros voluntarios, inasistencias o insatisfacción con el desarrollo del programa.
- **Política de inasistencias:**
  - Las clases en vivo no se recuperan individualmente (por el formato de acompañamiento grupal en despliegues).
  - Se entrega grabación o resumen escrito de cada clase para quien falte, dentro de las 24-48 horas siguientes.
  - Si un estudiante falta a una clase práctica (5-9) y eso afecta el ritmo de su subgrupo, puede ponerse al día en el canal de soporte asíncrono (WhatsApp/Discord), pero sin garantía de recuperar tiempo de acompañamiento en vivo.
  - Más de 2 inasistencias sin justificar a clases prácticas pueden significar que el instructor no pueda garantizar el deploy final de ese estudiante dentro del cronograma del curso.

---

## 7. Aceptación

Al inscribirse, el estudiante declara haber leído y aceptado:
- Los límites de alcance del proyecto descritos en la sección 2.
- Que los costos de VPS, dominio y API de terceros corren por su cuenta.
- Que el resultado final dependerá de que el proyecto se mantenga dentro del alcance aprobado por el instructor.
- **La política de reembolsos y los límites del Derecho de Retracto descritos en la sección 6 (5 días hábiles desde el pago de la primera cuota y antes del inicio del curso).**

Firma del estudiante: _______________________  Fecha: _______________
