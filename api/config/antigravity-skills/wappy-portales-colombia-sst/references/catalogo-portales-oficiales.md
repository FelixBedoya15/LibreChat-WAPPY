# Catálogo Técnico de Portales Oficiales Colombianos (SST, Seguridad Social & PESV)

Este documento de referencia detalla la arquitectura técnica, URLs oficiales, parámetros requeridos, códigos de estado y procedimientos exactos para el **Nivel 1 (CLI Determinista)** y el **Nivel 2 (Subagente `browser` Nativo de Google Antigravity)**.

---

## 1. Administradoras de Riesgos Laborales (ARL)

### 1.1 ARL SURA (`arlsura.com`)
- **URL Pública de Consulta por Cédula:** `https://www.arlsura.com/index.php/com-es-afiliado`
- **Método Nivel 1:** `POST` directo `application/x-www-form-urlencoded` (`tipoDocumento`, `documento`) + segundo `POST` automático del formulario `#frm_cert` para descargar el `%PDF` oficial (~340 KB) firmado por Suramericana S.A.
- **Datos Requeridos:** `tipo` (`CC`, `CE`, `PPT`, `TI`, `PA`, `PEP`) + `documento`. **No exige fecha de nacimiento.**
- **Regla Anti-Falso Positivo:** Evaluar siempre `!/no\s+se\s+encuentra\s+afiliad/i` antes de `/se\s+encuentra\s+afiliad/i`.
- **Extracción desde PDF:** `extractArlHolderAndEmployerFromPdf` decodifica tanto con `pdf-parse` como con el motor puro Node (`zlib.inflateSync` + CMap ToUnicode) el nombre completo del trabajador, la razón social del empleador y el estado activo.

### 1.2 ARL Positiva Compañía de Seguros (`positiva.gov.co` / `gal-back.linktic.com`)
- **Endpoint REST Oficial Nivel 1:**
  - Consulta: `https://gal-back.linktic.com/afiliaciones/certificates/certificateWorkerByEmployer?tipoDoc=<TIPO>&idAfiliado=<CEDULA>`
  - Descarga PDF Base64: `https://gal-back.linktic.com/afiliaciones/certificates/<ID_CERTIFICADO>/base64`
- **Datos Requeridos:** `tipo` + `documento`. **No exige fecha de nacimiento.**
- **Estados:**
  - HTTP `200` con `%PDF` directo o JSON con `certificados[0].certificado`: **AFILIADO ACTIVO** (descarga inmediata del certificado `%PDF`).
  - `AFFILIATION_NOT_FOUND` o `"no se encuentra"`: Ciudadano sin afiliación activa en Positiva.

### 1.3 ARL Seguros Bolívar (`segurosbolivar.com/arl`)
- **URL Pública:** `https://www.segurosbolivar.com/arl`
- **Requisito Crítico Obligatorio:** Exige **tres datos simultáneos**:
  1. Tipo de documento (`CC`, `CE`, `PA`, `PPT`, `TI`)
  2. Número de documento (`#arl-numero-documento`)
  3. **Fecha de Nacimiento en formato `DD/MM/YYYY`** (`#calendarId`)
- **Comportamiento Nivel 1:** Si se pasa `--fecha-nacimiento=YYYY-MM-DD` y el entorno local cuenta con Chromium/Puppeteer, intercepta la respuesta JSON de `arl/lambda/v1/operaciones` (`result.data.empresas[].afiliaciones[]`) y genera el PDF de constancia.
- **Receta Nivel 2 (`browser` Subagent cuando no hay Puppeteer local):**
  1. Abrir `https://www.segurosbolivar.com/arl` en el navegador nativo de Antigravity.
  2. Seleccionar tipo de documento en `mat-select` si es distinto a `CC`.
  3. Escribir la cédula en `#arl-numero-documento` y la fecha de nacimiento `DD/MM/YYYY` en `#calendarId` + presionar `Tab`.
  4. Verificar que `mat-checkbox` de tratamiento de datos tenga la clase `mat-checkbox-checked` (¡no desmarcarlo si ya viene activo por defecto!).
  5. Hacer clic en el botón `Consultar` y leer la tabla de empresas/estados (`ACTIVO` vs `RETIRADO`).

### 1.4 ARL Colmena Seguros y ARL AXA Colpatria
- **URLs Corporativas:** `https://www.colmenaseguros.com` y `https://arl.axacolpatria.co/`
- **Restricción Técnica Oficial:** Ambas aseguradoras restringen la descarga de certificados individuales de trabajadores a su **Portal Transaccional del Empleador / Corredor** con usuario y contraseña empresarial.
- **Protocolo Correcto:** Nunca simular ni adivinar afiliación. Si un trabajador no registra activo en SURA, Positiva ni Bolívar (con fecha de nacimiento), reportar con exactitud que Colmena y AXA Colpatria exigen validación con credenciales empresariales o soporte PILA del mes en curso.

---

## 2. Ministerio del Trabajo — Trabajo Seguro en Alturas y Espacios Confinados

- **URLs Oficiales ASP.NET WebForms:**
  1. Formulario inicial: `https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx`
  2. Tabla de certificados y descarga: `https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_lista.aspx`
- **Marco Normativo:** **Resolución 4272 de 2021** (Trabajo en Alturas) y **Resolución 0491 de 2020** (Espacios Confinados).
- **Mecánica Nivel 1 (`--portal=alturas`):**
  1. `GET consulta_ext.aspx` capturando cookies de sesión y campos ocultos `__VIEWSTATE`, `__VIEWSTATEGENERATOR` y `__EVENTVALIDATION`.
  2. `POST` con `ctl00$contenido$tipo_documentoTextBox` y `ctl00$contenido$valor_consulta`.
  3. `GET consulta_lista.aspx`: extrae nombre completo del titular (`primer_nombreLabel_0` ... `segundo_apellidoLabel_0`) y el historial completo de cursos ordenados del más reciente al más antiguo.
  4. Ejecuta `__doPostBack` sobre el `eventTarget` del último certificado vigente para obtener el `%PDF` oficial emitido por MinTrabajo y el centro de entrenamiento autorizado.
- **Interpretación Normativa SST:**
  - El reentrenamiento en alturas debe realizarse cada **18 meses** (o antes si cambia de empleador/actividad según Art. 27 y siguientes de la Res. 4272 de 2021). Si `mesesTranscurridos > 18`, reportar como **REQUIERE REENTRENAMIENTO** antes de firmar cualquier Permiso de Trabajo en Alturas (`wappy_guardar_permiso_alturas`).

---

## 3. Salud (ADRES BDUA) y Talento Humano en Salud (ReTHUS)

- **ADRES BDUA:** `https://www.adres.gov.co/consulte-su-eps` (iframe `aplicaciones.adres.gov.co/bdua_internet/Pages/ConsultarAfiliadoWeb.aspx`).
- **ReTHUS (SISPRO):** `https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx` (obligatorio verificar licencia SST / médicos especialistas en SST según Res. 0312 de 2019).
- **Política Inquebrantable de CAPTCHA:**
  - Tanto ADRES como SISPRO activan frecuentemente CAPTCHA gráfico o reCAPTCHA.
  - **PROHIBIDO** intentar resolver, OCR-izar o saltar el CAPTCHA por código o subagente. Si el portal presenta CAPTCHA, reportar el estado transparentemente y entregar el enlace directo para validación visual del usuario.

---

## 4. Fondos de Pensiones (AFP — Porvenir, Colpensiones, Protección, Colfondos, Skandia)

- **Porvenir S.A.:** `https://www.porvenir.com.co` (`descargaCerAfi` — permite descarga rápida de constancia de afiliación / no afiliación para varias cédulas).
- **Colpensiones:** `https://sede.colpensiones.gov.co/` (trámite de certificación de afiliación / no pensión).
- **Receta Nivel 2 (`browser` Subagent):** Útil cuando se requiere consultar en la Sede Electrónica de Colpensiones sin CAPTCHA activo.

---

## 5. Rama Judicial API v2 (`:448`) y Contraloría General de la República

### 5.1 Consulta Nacional Unificada de Procesos Judiciales
- **Endpoint REST Público:**
  `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NombreRazonSocial?nombre=<NOMBRE>&tipoPersona=nat&SoloActivos=false&codificacionDespacho=&pagina=1`
- **Nota Jurídica de Homonimia (Habeas Data — Ley 1581 de 2012):**
  La API pública de Rama Judicial por nombre devuelve coincidencias nominales en todo el país. Siempre se debe advertir validación de homonimia verificando número de radicado (23 dígitos), departamento/ciudad y sujetos procesales.

### 5.2 Contraloría General — Certificado de Antecedentes Fiscales
- **URL Oficial:** `https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx`
- **Mecánica Nivel 1:** Negocia formulario ASP.NET por `tipoDoc` + `cedula`, recibe directamente el `%PDF` oficial (~42 KB) y verifica mediante `zlib.inflateSync` la leyenda `"NO SE ENCUENTRA REPORTADO COMO RESPONSABLE FISCAL"`.

---

## 6. SIMIT — Seguridad Vial y PESV (Resolución 20223040040595)

- **URL Oficial:** `https://fcm.org.co/simit/#/home-public`
- **Particularidad Técnica (`#whcModal`):**
  Al enviar una cédula o placa en `#txtBusqueda`, el portal SPA de la Federación Colombiana de Municipios despliega temporalmente el modal automático `"Espera un momento"` (`#whcModal.show`) antes de invocar `https://consultasimit.fcm.org.co/simit/microservices/estado-cuenta-simit/estadocuenta/consulta`.
- **Nota de Seguridad:** Ese cálculo propio de la página ocurre solo sin intervención humana (no es un CAPTCHA interactivo), pero si en algún momento el portal presenta un CAPTCHA o desafío "verifica que eres humano", se debe detener la consulta y reportarlo de inmediato.
- **Aplicación en SG-SST / PESV:** Insumo directo para control de conductores en `wappy_consultar_matriz_pesv` y expediente vial trimestral.
