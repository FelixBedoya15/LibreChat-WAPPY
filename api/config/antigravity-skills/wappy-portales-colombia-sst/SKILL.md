---
name: wappy-portales-colombia-sst
description: "Consulta en tiempo real portales oficiales colombianos de Seguridad Social, SST y Seguridad Vial (ARL SURA, Positiva, Seguros Bolívar, Colmena, AXA Colpatria, Curso de Alturas y Espacios Confinados MinTrabajo, SENA, EPS ADRES BDUA/ReTHUS, Pensiones AFP Porvenir/Colpensiones, Antecedentes Rama Judicial y Contraloría General, y SIMIT/PESV) por cédula, NIT, nombre o placa, descargando certificados oficiales en PDF (%PDF) y PNG. Activa esta skill siempre que el usuario o una orden delegada de WAPPY pida verificar afiliaciones, certificados, cursos de alturas, comparendos o antecedentes en Colombia."
---

# Consultor Maestro de Portales Oficiales Colombianos SST & PESV (`wappy-portales-colombia-sst`)

## Overview

Esta skill dota a la instancia de Google Antigravity del usuario de un **Motor Determinista de Dos Niveles** para consultar portales gubernamentales y de Seguridad Social de Colombia desde la **IP local residencial/corporativa del usuario**, evitando bloqueos geográficos de centros de datos y garantizando evidencia verificable (`%PDF` + `.png` con firma SHA-256).

---

## When to Use

Activa esta skill inmediatamente cuando el usuario, Tenshi Voz/Chat o un Nodo de Flujo Autónomo (`/tareas`) solicite cualquiera de estas operaciones:
- Verificar afiliación activa o descargar el certificado oficial de **ARL** (SURA, Positiva, Seguros Bolívar, orientación para Colmena / AXA Colpatria).
- Consultar vigencia del **Curso de Trabajo Seguro en Alturas** o **Espacios Confinados** en el Registro del **Ministerio del Trabajo** (Res. 4272 de 2021).
- Consultar estado de afiliación a **EPS / Régimen de Salud** en **ADRES (BDUA)** o registro en **ReTHUS**.
- Consultar afiliación pensional en **AFP / Colpensiones** (Porvenir, Colpensiones, Protección, Colfondos, Skandia).
- Verificar procesos en **Rama Judicial API Nacional Unificada (`:448`)** y **Certificado de Responsabilidad Fiscal de la Contraloría General de la República**.
- Consultar comparendos, multas o Paz y Salvo ($0) por cédula o placa vehicular en **SIMIT (Federación Colombiana de Municipios)** para el **PESV** (Res. 20223040040595).
- Ejecutar investigación integral **360°** de un trabajador o contratista antes de autorizar ingreso a obra/planta o trabajo de alto riesgo.

---

## Protocolo Operativo de 2 Niveles (Orden Estricto de Ejecución)

### Nivel 1 — Motor Determinista Instantáneo CLI (3 a 6 segundos · Prioridad Absoluta)

Antes de abrir cualquier vista web o invocar un subagente de navegación, ejecuta **SIEMPRE primero** el script determinista incluido en esta skill mediante `run_command`:

```bash
node ~/.gemini/antigravity/skills/wappy-portales-colombia-sst/scripts/consultar-portal-colombia.js \
  --portal=arl \
  --tipo=CC \
  --documento=1146635472 \
  --json
```

*(Si la skill se cargó desde otra ruta como `~/.gemini/config/skills/wappy-portales-colombia-sst`, puedes usar esa ruta equivalente).*

#### ¿Qué resuelve automáticamente el Nivel 1?
1. **Auto-Sincronización del Motor (`wappy-osint-portals.js`):** Carga `~/.gemini/antigravity/wappy-osint-portals.js`. Si aún no existe en disco, lo descarga automáticamente desde `${WAPPY_URL}/api/mcp-bridge/antigravity/osint-portals.js` sin requerir `npm install` ni librerías externas.
2. **Consultas HTTP Directas de Ultra-Baja Latencia:**
   - **ARL SURA:** Consulta POST directa a `arlsura.com/index.php/com-es-afiliado`, extrae el formulario `#frm_cert`, descarga el `%PDF` oficial (~340 KB) y decodifica titular, empleador y estado en Node.js puro.
   - **ARL Positiva:** Consulta el servicio REST oficial `gal-back.linktic.com` y descarga el `%PDF` firmado por trabajador/empleador.
   - **MinTrabajo Alturas / Confinados:** Negocia tokens ASP.NET (`__VIEWSTATE`, `__VIEWSTATEGENERATOR`, `__EVENTVALIDATION`), evalúa vigencia legal (18 meses) y descarga la constancia `%PDF` mediante `__doPostBack`.
   - **Rama Judicial + Contraloría:** Consulta procesos en `:448/api/v2` y descarga el PDF oficial de Responsabilidad Fiscal de `cfiscal.contraloria.gov.co`.
   - **Porvenir AFP & Web Scraper:** Descarga certificados directos y convierte automáticamente `%PDF` a `.png` de previsualización.
3. **Validación Criptográfica de Evidencias:** Verifica bytes mágicos reales (`0x25504446` `%PDF` y `0x89504E47` `\x89PNG`), guarda los archivos en `--out-dir` (por defecto `<TMPDIR>/wappy-certificados`) y calcula el hash `SHA-256`.
4. **Envío Directo a Tenshi (`--enviar-tenshi`):** Si se incluye `--enviar-tenshi`, despacha automáticamente la copia binaria intacta del PDF oficial al chat activo de Tenshi invocando `~/.gemini/antigravity/wappy-push-daemon.js --send-file`.

#### Flags Soportados por `scripts/consultar-portal-colombia.js`

| Flag | Valores / Formato | Descripción |
| :--- | :--- | :--- |
| `--portal` | `arl` \| `alturas` \| `eps` \| `pensiones` \| `antecedentes` \| `simit` \| `web` \| `all` | Portal oficial a consultar (`all` ejecuta barrido integral 360°). |
| `--tipo` | `CC` \| `CE` \| `PPT` \| `TI` \| `NIT` \| `PEP` \| `PA` | Tipo de documento de identidad (por defecto `CC`). |
| `--documento` | Número limpio (ej. `1146635472`) | Número de cédula o NIT (limpia puntos y espacios automáticamente). |
| `--fecha-nacimiento` | `YYYY-MM-DD` o `DD/MM/YYYY` | **Requerido por ARL Seguros Bolívar** cuando no registra en SURA/Positiva. |
| `--nombre` | `"NOMBRES APELLIDOS"` | Nombre completo para cruce en Rama Judicial y validación de homonimia. |
| `--placa` | `ABC123` | Placa vehicular opcional para consulta PESV en SIMIT. |
| `--arl` / `--eps` / `--afp` | Nombre de entidad | Pista opcional de entidad reportada en nómina o seguridad social. |
| `--url` | `https://...` | URL objetivo cuando se usa `--portal=web`. |
| `--out-dir` | Ruta de carpeta | Directorio donde se guardan los `.pdf` y `.png` verificados. |
| `--enviar-tenshi` | Booleano (sin valor) | Envía automáticamente el certificado `.pdf` generado al chat de Tenshi. |
| `--orden-id` | `<id>` | ID de orden delegada de Tenshi/WAPPY asociada al envío. |
| `--json` | Booleano (sin valor) | Imprime salida JSON pura en `stdout` (logs redirigidos a `stderr`). |
| `--help` | Booleano (sin valor) | Muestra manual rápido de uso y ejemplos. |

#### Códigos de Salida (Exit Codes)
- `0`: Ejecución exitosa (consulta realizada y respuesta estructurada disponible; revisa `afiliadoActivo` y `savedFiles` en el JSON).
- `1`: Error de validación de entrada (documento vacío/de prueba, fecha inválida o falta `--url` en modo `web`).
- `2`: Error no recuperable de red, motor local o portal gubernamental caído.

---

### Nivel 2 — Navegador Nativo Integrado de Antigravity (`browser` Subagent)

Escala al **Nivel 2** únicamente cuando el resultado del Nivel 1 indique que el portal requiere interacción visual en navegador (por ejemplo: **ARL Seguros Bolívar** con `--fecha-nacimiento` en equipos sin Puppeteer local, modal dinámico `#whcModal` de **SIMIT**, **Colpensiones**, o portales SPA gubernamentales):

1. Lee primero la receta exacta del portal en `references/catalogo-portales-oficiales.md`.
2. Delega en el subagente nativo integrado de Google Antigravity:
   ```json
   {
     "TypeName": "browser",
     "Model": "flash",
     "TaskPrompt": "Navega en el webview nativo a <URL_OFICIAL>, ingresa tipo de documento <TIPO>, número <DOCUMENTO> [y fecha de nacimiento <DD/MM/YYYY>], ejecuta la consulta y extrae textualmente el estado de afiliación, entidad, empleador y fecha de corte. Si aparece un CAPTCHA o reto anti-bot, detente de inmediato sin intentar resolverlo y repórtalo."
   }
   ```

---

## Guardrails Inquebrantables de Seguridad y Cumplimiento

1. **PROHIBIDO Abrir Navegadores Externos del Sistema Operativo:**
   - Jamás ejecutes `open`, `/usr/bin/open`, `open -a "Google Chrome"`, `open -a Safari`, `xdg-open`, `cmd /c start` ni abras ventanas emergentes externas en el escritorio del usuario. Toda navegación interactiva de Nivel 2 ocurre exclusivamente dentro del subagente nativo `browser` de Antigravity.
2. **Cero Evasión o Resolución de CAPTCHAs (Política Estricta):**
   - **NUNCA** resuelvas, hagas clic, esperes para burlar ni intentes evadir CAPTCHAs, reCAPTCHA, hCaptcha, Cloudflare Turnstile o verificaciones "No soy un robot" (frecuentes en ADRES BDUA y ReTHUS).
   - Cuando un portal presente un CAPTCHA o bloqueo anti-bot, detén ese paso de inmediato e informa con transparencia al usuario indicando el enlace directo oficial para validación asistida.
3. **Transparencia ante Requisitos Especiales de ARL en Colombia:**
   - **ARL Seguros Bolívar:** Exige obligatoriamente `tipoDocumento` + `documento` + **`fechaNacimiento`**. Si la consulta ARL arroja no afiliado en SURA y Positiva y no tienes la fecha de nacimiento del trabajador, solicítala explícitamente al usuario (o consúltala primero en `wappy_consultar_trabajadores`).
   - **ARL Colmena y ARL AXA Colpatria:** Sus portales de certificados para trabajadores están protegidos detrás de autenticación empresarial privada (usuario y clave del empleador/corredor). Nunca inventes estados de afiliación; informa claramente esta restricción técnica del operador.
4. **Cero Datos Inventados y Alerta de Homonimia:**
   - En consultas de **Rama Judicial por nombre**, advierte siempre verificar homonimia cruzando despacho, ciudad y sujetos procesales antes de emitir juicios disciplinarios o de contratación.

---

## Routing Table (Progressive Disclosure)

- Para consultar URLs oficiales exactas, selectores DOM para el subagente `browser`, estructura de respuestas JSON/ASP.NET, reglas de vigencia de Alturas (Res. 4272/2021) y manejo detallado por entidad, lee `references/catalogo-portales-oficiales.md`.
