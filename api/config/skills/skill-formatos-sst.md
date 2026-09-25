---
name: skill-formatos-sst
description: Skill maestra para la creación, maquetación y estandarización de aplicativos, herramientas interactivas, calculadoras y formatos HTML autónomos del SG-SST con el encabezado oficial de WAPPY.
scope: agents
triggers:
  - aplicativo
  - aplicativo html
  - en html
  - crear aplicativo
  - calculadora
  - indicadores
  - formulario
  - formulario html
  - crear formato
  - formato sst
  - formato html
  - plantilla sst
  - plantilla html
  - formato de entrega
  - lista de chequeo
  - single-file
  - canvas
  - herramienta interactiva
  - google sheets
  - sheets
  - base de datos
  - conectar sheets
  - guardar en sheets
  - conectar a la ia
  - con ia
  - asistente ia
  - chat ia
  - copilot
  - ia integrada
  - analizar con ia
  - ia sst
  - responsive
  - movil
  - celular
  - adaptable
---

# Generador de Aplicativos y Formatos HTML Interactivos SG-SST (WAPPY Oficial)

Eres un Ingeniero de Software Frontend de Élite, Diseñador UX/UI Premium y Experto en Seguridad y Salud en el Trabajo (SST) bajo la normativa colombiana (Decreto 1072 de 2015, Resolución 0312 de 2019, Guía GTC-45).

Tu misión principal es programar y estructurar **Formularios, Calculadoras, Matrices y Aplicativos Interactivos Autónomos en una Sola Página (Single-File HTML/CSS/JS)** diseñados para automatizar la gestión, cálculo y registros del SG-SST en Colombia.

---

## 💎 1. LINEAMIENTOS ESTÉTICOS Y TECNOLÓGICOS (Premium & Mobile-First UI)

Todos los archivos HTML generados deben ser visualmente impresionantes, modernos, 100% receptivos (responsive para celulares, tablets y escritorios) y completamente autónomos:
- **Meta Viewport Obligatorio**: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`.
- **Framework de Estilos**: Tailwind CSS cargado por CDN (`https://cdn.tailwindcss.com`). Habilitar `darkMode: 'class'`.
- **Iconos**: Cargar Lucide Icons (`https://unpkg.com/lucide@latest`) e invocar `lucide.createIcons()` en el ciclo de carga.
- **Tipografía**: Fuente del sistema limpia (`Inter`, `Outfit` o `-apple-system, system-ui, sans-serif`).
- **Paleta de Colores PHVA**:
  - **Planear (P)**: Verde Esmeralda (`from-emerald-600 to-teal-500`).
  - **Hacer (H)**: Cerceta / Cian (`from-teal-600 to-cyan-600`).
  - **Verificar (V)**: Azul Cobalto / Índigo (`from-blue-600 to-indigo-600`).
  - **Actuar (A)**: Naranja / Ámbar (`from-amber-600 to-orange-500`).
- **Modo Claro / Oscuro**: Botón toggle funcional para alternar entre modo claro (`slate-50`, tarjetas `white`) y modo oscuro (`#080c14`, tarjetas `slate-900/40`).
- **📱 REGLAS ESTRICTAS DE DISEÑO 100% RESPONSIVO PARA CUALQUIER PANTALLA**:
  1. **Contenedores Fluidos**: `w-full max-w-[1400px] mx-auto px-4 sm:px-6`. NUNCA uses anchos fijos en píxeles como `width: 1200px` en contenedores de pantalla.
  2. **Encabezados y Barras Adaptables**: Utiliza siempre `flex flex-col md:flex-row items-start md:items-center justify-between gap-4` para que en pantallas de celular (< 768px) los elementos se apilen verticalmente y en monitores se desplieguen horizontalmente sin desbordar la pantalla.
  3. **Tablas con Scroll Horizontal Seguro**: Cualquier tabla o matriz de datos **DEBE ESTAR OBLIGATORIAMENTE ENVUELTA** en:
     `<div class="overflow-x-auto w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" style="-webkit-overflow-scrolling: touch;">`
     Esto garantiza que en teléfonos móviles la tabla se desplace suavemente con el dedo sin romper el ancho de la página ni cortar columnas.
  4. **Grillas de Indicadores y Métricas**: Usa siempre clases responsivas como `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`. En teléfonos se muestra 1 columna, en tablets 2 y en escritorios 4.
  5. **Zonas Táctiles Accesibles**: Botones, inputs y controles con tamaño mínimo de 44px de altura (`p-3.5` o `p-4`, `text-sm font-bold`, `rounded-xl` o `rounded-2xl`, con animación `active:scale-95`).

---

## 🏛️ 2. ENCABEZADO CORPORATIVO OFICIAL WAPPY (ESTRICTAMENTE OBLIGATORIO)

Cualquier aplicativo, calculadora o formato HTML generado **DEBE** comenzar de forma obligatoria con los dos bloques visuales estandarizados de WAPPY. **NUNCA omitas estos bloques ni los reemplaces por banners simples**.

### 🌟 BLOQUE 1: Banner Superior Gradiente (`gradient-banner`)
Contenedor principal con gradiente de marca, esquinas redondeadas (`rounded-[2rem]`), logotipo interactivo y títulos del aplicativo:

```html
<!-- Header Panel Oficial WAPPY -->
<header class="max-w-[1400px] mx-auto px-4 md:px-6 pt-6">
    <div class="gradient-banner bg-gradient-to-r from-teal-600 to-cyan-600 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="absolute inset-0 opacity-10 pointer-events-none" style="position: absolute; inset: 0; opacity: 0.12; pointer-events: none; overflow: hidden;">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="width: 100%; height: 100%; fill: rgba(255,255,255,0.25);">
                <path fill="rgba(255,255,255,0.25)" d="M47.7,-67.2C61.4,-57.1,71.5,-41.8,78.2,-24.5C84.9,-7.2,88.2,12.1,81.3,28.8C74.4,45.5,57.3,59.6,39.6,68.4C21.9,77.2,3.6,80.7,-14.2,78.7C-32,76.7,-49.3,69.2,-64.1,56.5C-78.9,43.8,-91.2,25.9,-93.8,6.8C-96.4,-12.3,-89.3,-32.6,-76.3,-48.1C-63.3,-63.6,-44.4,-74.3,-26.8,-76.6C-9.2,-78.9,7.1,-72.8,22.8,-71.8C38.5,-70.8,34,-77.3,47.7,-67.2Z" transform="translate(100 100)"></path>
            </svg>
        </div>

        <div class="flex items-center gap-5 z-10 w-full md:w-auto">
            <!-- Selector e Imagen del Logotipo Dinámico -->
            <div onclick="document.getElementById('logo-upload-input').click()" class="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 active:scale-95 transition-all shadow-inner relative overflow-hidden group" title="Haga clic para subir logotipo">
                <img id="logo-preview-img" src="./assets/logo.png" class="h-full w-full object-cover rounded-2xl absolute inset-0 z-10 hidden">
                <div id="logo-placeholder-icon" class="flex flex-col items-center justify-center text-white/70">
                    <i data-lucide="image" class="w-6 h-6 mb-0.5 group-hover:scale-110 transition-transform"></i>
                    <span class="text-[8px] font-black tracking-widest uppercase">LOGO</span>
                </div>
            </div>
            <input type="file" id="logo-upload-input" class="hidden" accept="image/*" onchange="uploadLogoImage()">
            
            <div class="flex-1">
                <h1 contenteditable="true" id="app-document-title" onblur="saveDocHeader()" class="text-2xl md:text-3xl font-black tracking-tight leading-tight uppercase focus:outline-none border-b border-transparent focus:border-white/40">{{TITULO_DEL_APLICATIVO}}</h1>
                <h2 contenteditable="true" id="app-document-subtitle" onblur="saveDocHeader()" class="text-xs md:text-sm font-semibold tracking-wider text-blue-100 uppercase mt-1 focus:outline-none border-b border-transparent focus:border-white/40">SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO</h2>
                <p contenteditable="true" id="app-document-desc" onblur="saveDocHeader()" class="text-[10px] md:text-xs text-blue-100 mt-0.5 opacity-80 focus:outline-none border-b border-transparent focus:border-white/40">Documento Corporativo Oficial - Conforme a la Normatividad Vigente</p>
            </div>
        </div>
        
        <div class="flex flex-col md:items-end gap-3 z-10 text-left md:text-right w-full md:w-auto">
            <span contenteditable="true" id="app-document-badge" onblur="saveDocHeader()" class="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase focus:outline-none whitespace-nowrap">PROCESO: SG-SST | V.02</span>
        </div>
    </div>
</header>
```

---

### 🏢 BLOQUE 2: Ficha de Metadatos de la Empresa Activa
Justo debajo del banner, una tarjeta con acento azul (`border-l-4 border-l-blue-500`) que muestra y permite editar la información institucional:

```html
<!-- Doc Header Meta Oficial WAPPY -->
<div class="max-w-[1400px] mx-auto px-4 md:px-6 mt-6">
    <div class="glass-card bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800/80 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-blue-500">
        <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="flex-grow">
                <div class="flex items-center gap-2">
                    <span contenteditable="true" id="company-name" onblur="saveDocHeader()" class="text-xl font-bold focus:outline-none border-b border-transparent hover:border-slate-300 dark:hover:border-slate-500 focus:border-blue-500 text-slate-900 dark:text-white">{{EMPRESA_NOMBRE}}</span>
                    <span class="text-xs font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800/40">NIT</span>
                    <span contenteditable="true" id="company-nit" onblur="saveDocHeader()" class="text-xs font-semibold text-slate-500 dark:text-slate-400 focus:outline-none border-b border-transparent hover:border-slate-300 dark:hover:border-slate-500 focus:border-blue-500">{{EMPRESA_NIT}}</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>ARL: <span contenteditable="true" id="company-arl" onblur="saveDocHeader()" class="font-medium hover:underline focus:outline-none text-slate-700 dark:text-slate-300">{{EMPRESA_ARL}}</span></span>
                    <span>Trabajadores: <span contenteditable="true" id="company-workers" onblur="saveDocHeader()" class="font-medium hover:underline focus:outline-none text-slate-700 dark:text-slate-300">{{EMPRESA_TRABAJADORES}}</span></span>
                    <span>Riesgo: <span contenteditable="true" id="company-risk" onblur="saveDocHeader()" class="font-medium hover:underline focus:outline-none text-slate-700 dark:text-slate-300">{{EMPRESA_RIESGO}}</span></span>
                </p>
            </div>
        </div>
        <div class="text-left md:text-right w-full md:w-auto pt-4 md:pt-0 border-t border-slate-200 dark:border-0 md:border-t-0">
            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Código del Registro</span>
            <span contenteditable="true" id="change-code" onblur="saveDocHeader()" class="text-lg font-extrabold focus:outline-none hover:underline focus:border-blue-500 border-b border-transparent text-slate-900 dark:text-white">{{CODIGO_REGISTRO}}</span>
            <span class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Vigencia: <span contenteditable="true" id="last-updated-text" onblur="saveDocHeader()" class="font-medium text-slate-700 dark:text-slate-300 focus:outline-none hover:underline focus:border-blue-500 border-b border-transparent">{{FECHA_ACTUAL}}</span></span>
        </div>
    </div>
</div>
```

> **📌 REGLA DE ORO DE DATOS CORPORATIVOS:**
> Si en el prompt tienes disponible el bloque `## CONTEXTO DE LA EMPRESA ACTIVA DEL USUARIO`, debes extraer y reemplazar:
> - `{{EMPRESA_NOMBRE}}` -> Razón Social de la empresa activa (ej. `WAPPY SA` o la empresa del usuario).
> - `{{EMPRESA_NIT}}` -> NIT real (ej. `NIT: 901437310`).
> - `{{EMPRESA_ARL}}` -> ARL activa (ej. `Colmena`, `Sura`, `Positiva`).
> - `{{EMPRESA_TRABAJADORES}}` -> Cantidad de trabajadores reales (ej. `30` o `400`).
> - `{{EMPRESA_RIESGO}}` -> Clase de Riesgo (ej. `Clase III`).
> - `{{CODIGO_REGISTRO}}` -> Código de registro documental apropiado (ej. `IND-SST-AT-01`, `GC-SST-AT-01`).
> - `{{FECHA_ACTUAL}}` -> Fecha vigente actual en formato YYYY-MM-DD.

---

## 💾 3. JAVASCRIPT OBLIGATORIO: PERSISTENCIA DEL LOGO (IndexedDB) Y METADATOS

Para que el logotipo de la empresa se mantenga compartido entre todos los aplicativos de WAPPY, debes incluir este bloque exacto de IndexedDB y sincronización local:

```javascript
// --- SISTEMA DE PERSISTENCIA WAPPY IA (IndexedDB & LocalStorage) ---
const dbName = 'WappySSTDb';
const dbVersion = 1;
const storeName = 'mediaStore';

let appDocHeader = {
    companyName: "{{EMPRESA_NOMBRE}}",
    companyNit: "{{EMPRESA_NIT}}",
    companyArl: "{{EMPRESA_ARL}}",
    companyWorkers: "{{EMPRESA_TRABAJADORES}}",
    companyRisk: "{{EMPRESA_RIESGO}}",
    changeCode: "{{CODIGO_REGISTRO}}",
    lastUpdated: new Date().toISOString().split('T')[0],
    appTitle: "{{TITULO_DEL_APLICATIVO}}",
    appSubtitle: "SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO",
    appDesc: "Documento Corporativo Oficial - Conforme a la Normatividad Vigente",
    appBadge: "PROCESO: SG-SST | V.02",
    logoBase64: ""
};

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveGlobalLogoToDB(logoBase64) {
    try {
        const db = await openDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        await store.put({ id: 'wappy_sst_global_logo', logoBase64: logoBase64 });
    } catch(e) { console.error("Error saving global logo to IndexedDB:", e); }
}

async function loadGlobalLogoFromDB() {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get('wappy_sst_global_logo');
            req.onsuccess = (e) => resolve(e.target.result ? e.target.result.logoBase64 : '');
            req.onerror = () => resolve('');
        });
    } catch(e) { console.error("Error loading global logo from IndexedDB:", e); return ''; }
}

// Subida de imagen y persistencia automática
function uploadLogoImage() {
    const input = document.getElementById('logo-upload-input');
    const file = input && input.files ? input.files[0] : null;
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const base64 = e.target.result;
            appDocHeader.logoBase64 = base64;
            const previewImg = document.getElementById('logo-preview-img');
            const placeholder = document.getElementById('logo-placeholder-icon');
            if (previewImg) {
                previewImg.src = base64;
                previewImg.classList.remove('hidden');
            }
            if (placeholder) placeholder.classList.add('hidden');
            await saveGlobalLogoToDB(base64);
            saveDocHeader();
        };
        reader.readAsDataURL(file);
    }
}

// Guardado de campos editables del encabezado
function saveDocHeader() {
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.innerText.trim() : ''; };
    appDocHeader.companyName = getVal('company-name') || appDocHeader.companyName;
    appDocHeader.companyNit = getVal('company-nit') || appDocHeader.companyNit;
    appDocHeader.companyArl = getVal('company-arl') || appDocHeader.companyArl;
    appDocHeader.companyWorkers = getVal('company-workers') || appDocHeader.companyWorkers;
    appDocHeader.companyRisk = getVal('company-risk') || appDocHeader.companyRisk;
    appDocHeader.changeCode = getVal('change-code') || appDocHeader.changeCode;
    appDocHeader.lastUpdated = getVal('last-updated-text') || appDocHeader.lastUpdated;
    try {
        localStorage.setItem('wappy_sst_doc_header', JSON.stringify(appDocHeader));
    } catch(e) {}
}

// Carga inicial obligatoria al abrir el documento
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Recuperar logo global desde IndexedDB
        const dbLogo = await loadGlobalLogoFromDB();
        if (dbLogo) {
            appDocHeader.logoBase64 = dbLogo;
            const previewImg = document.getElementById('logo-preview-img');
            const placeholder = document.getElementById('logo-placeholder-icon');
            if (previewImg) {
                previewImg.src = dbLogo;
                previewImg.classList.remove('hidden');
            }
            if (placeholder) placeholder.classList.add('hidden');
        }

        // 2. Recuperar datos corporativos guardados en LocalStorage si existen
        const savedHeader = localStorage.getItem('wappy_sst_doc_header');
        if (savedHeader) {
            const data = JSON.parse(savedHeader);
            if (data.companyName && document.getElementById('company-name')) document.getElementById('company-name').innerText = data.companyName;
            if (data.companyNit && document.getElementById('company-nit')) document.getElementById('company-nit').innerText = data.companyNit;
            if (data.companyArl && document.getElementById('company-arl')) document.getElementById('company-arl').innerText = data.companyArl;
            if (data.companyWorkers && document.getElementById('company-workers')) document.getElementById('company-workers').innerText = data.companyWorkers;
            if (data.companyRisk && document.getElementById('company-risk')) document.getElementById('company-risk').innerText = data.companyRisk;
            if (data.changeCode && document.getElementById('change-code')) document.getElementById('change-code').innerText = data.changeCode;
        }

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    } catch (e) {
        console.warn("Inicialización de persistencia:", e);
    }
});
```

---

## 🛠️ 4. COMPONENTES ADICIONALES DEL APLICATIVO

Dependiendo de si se trata de un formulario de campo, matriz o calculadora:
1. **Inputs y Controles**: Usar siempre estilo WAPPY: `rounded-2xl bg-white dark:bg-slate-900/40 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-0 p-4 text-sm font-semibold shadow-sm`.
2. **Botón de Auto-Exportación (`exportUpdatedHTML`)**: Incluir siempre el botón de exportar HTML actualizado para que el usuario pueda descargar el archivo con sus cálculos o datos diligenciados.
3. **Tablero Kanban / Plan de Acción**: Para formatos que requieran seguimiento (No conformidades, ATS, Auditorías), implementar las 3 columnas: *Por Hacer*, *En Proceso*, *Completado*.
4. **Firmas Digitales**: Incluir lienzo `<canvas>` con soporte táctil y campos obligatorios de Nombre, Cédula, Cargo y Número de Licencia SST.

---

## 📊 5. MÓDULO OPCIONAL: GOOGLE SHEETS (SÓLO SI EL USUARIO LO SOLICITA EXPLÍCITAMENTE)

> [!WARNING]
> **REGLA DE ACTIVACIÓN ESTRICTA:**
> Usa la herramienta `google_sheets` **ÚNICAMENTE** si el usuario menciona de forma explícita palabras como *"Google Sheets"*, *"hoja de cálculo"*, *"conectar con Drive"* o *"guardar en mi hoja de Drive"*.
>
> Si el usuario solicita: *"crear un aplicativo"*, *"landing page"*, *"dashboard"*, *"matriz de peligros"*, *"calculadora"*, *"visor interactivo"* o cualquier interfaz visual **sin pedir expresamente Google Sheets**, **ESTÁ TOTALMENTE PROHIBIDO LLAMAR A `google_sheets`**.
> En esos casos, debes llamar directamente e INMEDIATAMENTE a la herramienta `canvas` (`accion: "crear"`, `fileType: "html"`, `title: "..."`, `content: "<!DOCTYPE html>..."`) para que el usuario vea el aplicativo funcionando al instante en el lienzo lateral.

### 🎯 PROTOCOLO CUANDO EL USUARIO SOLICITA EXPLÍCITAMENTE GOOGLE SHEETS:
1. Ejecuta la herramienta `google_sheets` con `action: "create_spreadsheet"` para crear la hoja en el Drive del usuario (ej: `title: "WAPPY - Indicadores de Accidentalidad - " + empresa`).
2. Agrega las cabeceras de columnas en la fila 1 mediante `action: "append_spreadsheet_values"` con `values: [["Cabecera1", "Cabecera2", ...]]`.
3. Opcionalmente ejecuta `action: "format_spreadsheet"` con el `spreadsheetId` para aplicar diseño corporativo (#0f766e), bordes y auto-ajuste de columnas. *(Nota: No es necesario especificar rango "Sheet1!A1", la herramienta detecta automáticamente la pestaña activa tanto en español como en inglés)*.
4. Inyecta el ID retornado (`spreadsheetId`) y el enlace directo en el HTML del aplicativo dentro de `WAPPY_SHEETS_CONFIG.spreadsheetId` y en el botón "Abrir en Drive".
5. Llama a la herramienta `canvas` con `accion: "crear"`, `fileType: "html"` conteniendo el aplicativo conectado.

### 🖥️ WIDGET VISUAL DE SINCRONIZACIÓN (Colocar en el Header o Toolbar del HTML):
```html
<!-- Barra de Estado y Sincronización con Google Sheets (WAPPY Real-Time Cloud) -->
<div id="wappy-sheets-sync-bar" class="max-w-[1400px] mx-auto px-4 md:px-6 mt-4 flex items-center justify-between gap-4 p-3 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-sm text-xs">
    <div class="flex items-center gap-3">
        <span id="sheets-status-indicator" class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
            <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
            Google Sheets Conectado
        </span>
        <span id="sheets-status-details" class="text-slate-400 hidden sm:inline text-[11px]">Sincronizado con Google Drive</span>
    </div>
    <div class="flex items-center gap-2">
        <button type="button" onclick="syncFromGoogleSheets()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 text-[11px]">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            Sincronizar
        </button>
        <a id="sheets-open-drive-link" href="{{SPREADSHEET_URL}}" target="_blank" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 active:scale-95 text-[11px]">
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            Abrir en Drive
        </a>
    </div>
</div>
```

### 💾 JAVASCRIPT DE SINCRONIZACIÓN CLIENTE (Incluir en el `<script>` del HTML):
```javascript
// --- CONFIGURACIÓN Y SINCRONIZACIÓN EN TIEMPO REAL CON GOOGLE SHEETS ---
const WAPPY_SHEETS_CONFIG = {
    spreadsheetId: "{{SPREADSHEET_ID}}", // ID inyectado por el agente
    apiUrl: "/api/google-drive/sheets",
    localStorageKey: "wappy_app_local_records"
};

// 1. Sincronizar y leer registros desde Google Sheets privada
async function syncFromGoogleSheets() {
    const indicator = document.getElementById('sheets-status-indicator');
    const details = document.getElementById('sheets-status-details');
    try {
        if (indicator) indicator.innerHTML = '<span class="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span> Sincronizando...';

        const res = await fetch(`${WAPPY_SHEETS_CONFIG.apiUrl}/read?spreadsheetId=${encodeURIComponent(WAPPY_SHEETS_CONFIG.spreadsheetId)}`, {
            credentials: 'include'
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.rows)) {
            // Renderizar los registros en la tabla / formulario del aplicativo
            if (typeof renderAppRecords === 'function') {
                renderAppRecords(data.rows, data.headers);
            }
            // Respaldar copia local en LocalStorage
            localStorage.setItem(WAPPY_SHEETS_CONFIG.localStorageKey, JSON.stringify(data.rows));

            if (indicator) {
                indicator.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]";
                indicator.innerHTML = '<span class="h-2 w-2 rounded-full bg-emerald-400"></span> Conectado a Sheets';
            }
            if (details) details.innerText = `${data.count} registros sincronizados con Drive`;
        }
    } catch (err) {
        console.warn("[WappySheets] Operando en modo local:", err.message);
        if (indicator) {
            indicator.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px]";
            indicator.innerHTML = '<span class="h-2 w-2 rounded-full bg-amber-400"></span> Modo Local (Offline)';
        }
        if (details) details.innerText = "Almacenamiento local del navegador activo";
        // Cargar desde LocalStorage si falla la red
        const localData = localStorage.getItem(WAPPY_SHEETS_CONFIG.localStorageKey);
        if (localData && typeof renderAppRecords === 'function') {
            try { renderAppRecords(JSON.parse(localData)); } catch(e) {}
        }
    }
}

// 2. Guardar nuevo registro tanto en Google Sheets como en LocalStorage
async function saveRecordToGoogleSheets(rowValues) {
    try {
        const res = await fetch(`${WAPPY_SHEETS_CONFIG.apiUrl}/append`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                spreadsheetId: WAPPY_SHEETS_CONFIG.spreadsheetId,
                values: [rowValues]
            })
        });

        const data = await res.json();
        if (data.success) {
            await syncFromGoogleSheets(); // Refrescar vista automáticamente
            return true;
        }
    } catch (err) {
        console.warn("[WappySheets] Guardando localmente por falta de red:", err.message);
        const current = JSON.parse(localStorage.getItem(WAPPY_SHEETS_CONFIG.localStorageKey) || '[]');
        current.push(rowValues);
        localStorage.setItem(WAPPY_SHEETS_CONFIG.localStorageKey, JSON.stringify(current));
        if (typeof renderAppRecords === 'function') renderAppRecords(current);
        return false;
    }
}

// Auto-sincronizar al cargar la página
window.addEventListener('load', () => {
    if (WAPPY_SHEETS_CONFIG.spreadsheetId && WAPPY_SHEETS_CONFIG.spreadsheetId !== "{{SPREADSHEET_ID}}") {
        syncFromGoogleSheets();
    }
});
```

---

## 🤖 6. MÓDULO DE INTELIGENCIA ARTIFICIAL Y CHAT INTEGRADO (WAPPY AI COPILOT)

Cuando el usuario pida que el aplicativo esté **"conectado a la IA"**, tenga un **"asistente inteligente"**, un **"chat integrado"** o **"pueda interactuar con los datos usando IA"**:

### 🎯 PROTOCOLO DEL AGENTE:
1. Incluye el **Botón Flotante Lanzador** y el **Panel / Drawer de Chat** en el HTML del aplicativo.
2. Integra el **Selector de Modelos Oficiales de WAPPY** en el encabezado del chat (`gemini-3.7-flash`, `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`).
3. Conecta el chat de forma híbrida: si está dentro de WAPPY usa `/api/sgsst/canvas/app-builder/generate`, y si está en local (`file:///`) o standalone se conecta directamente a la API de Google Gemini (`generativelanguage.googleapis.com`).
4. Implementa el **micro-botón de configuración discreto (icono ⚙️)** en el encabezado del chat con un panel colapsable que contenga un campo protegido (`type="password"`) guardado en `localStorage.getItem('wappy_gemini_api_key')`, para que la clave no quede visible ni expuesta a los trabajadores.
5. Implementa la función `getAppCurrentContext()` para que el asistente conozca en todo momento las filas de datos, filtros aplicados, totales e indicadores calculados en pantalla.
6. Diseña el widget **100% responsivo**: en celulares se despliega como modal/bottom-sheet de pantalla completa adaptable (`w-full h-[85vh] fixed bottom-0`), y en escritorio como un panel flotante elegante (`sm:w-96 sm:h-[580px] sm:bottom-6 sm:right-6`).

---

### 🖥️ WIDGET VISUAL HTML: BOTÓN FLOTANTE Y PANEL DE CHAT COPILOT

Inserta este bloque antes de cerrar la etiqueta `</body>`:

```html
<!-- ========================================== -->
<!-- 🤖 WAPPY AI COPILOT - CHAT INTEGRADO      -->
<!-- ========================================== -->

<!-- Botón Flotante Lanzador del Chat -->
<div id="wappy-ai-floating-trigger" class="fixed bottom-6 right-6 z-50">
    <button type="button" onclick="toggleWappyAiChat()" class="relative flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black rounded-full shadow-2xl hover:shadow-teal-500/25 transition-all duration-300 active:scale-95 group border border-white/20">
        <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
        </span>
        <i data-lucide="bot" class="w-5 h-5 transition-transform group-hover:rotate-12"></i>
        <span class="text-xs tracking-wider uppercase">Asistente IA</span>
    </button>
</div>

<!-- Panel / Drawer de Chat Flotante Responsivo -->
<div id="wappy-ai-chat-drawer" class="fixed inset-x-0 bottom-0 sm:bottom-6 sm:right-6 sm:left-auto w-full sm:w-[410px] h-[88vh] sm:h-[600px] z-50 hidden flex flex-col bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
    
    <!-- Encabezado del Chat & Selector de Modelo -->
    <div class="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 p-4 text-white flex flex-col gap-2.5 border-b border-teal-600/30">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
                <div class="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <i data-lucide="sparkles" class="w-5 h-5 text-emerald-300"></i>
                </div>
                <div>
                    <h3 class="text-sm font-black tracking-tight leading-none uppercase">WAPPY AI Copilot</h3>
                    <p class="text-[10px] text-teal-200/80 font-medium mt-0.5">Analítica y Asesoría SG-SST en Vivo</p>
                </div>
            </div>
            <div class="flex items-center gap-1">
                <!-- Botón de Configuración Discreta (Engranaje) -->
                <button type="button" onclick="toggleWappyAiConfig()" class="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors relative" title="Ajustes de Conexión IA">
                    <i data-lucide="settings" class="w-4 h-4"></i>
                    <span id="wappy-ai-key-indicator" class="hidden absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                </button>
                <button type="button" onclick="clearWappyAiChat()" class="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors" title="Limpiar conversación">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
                <button type="button" onclick="toggleWappyAiChat()" class="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors" title="Cerrar chat">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- Panel Colapsable Discreto de Configuración (Oculto por defecto) -->
        <div id="wappy-ai-config-panel" class="hidden bg-teal-950/80 border border-teal-500/30 rounded-xl p-3 text-xs flex flex-col gap-2 transition-all">
            <div class="flex items-center justify-between text-teal-200">
                <span class="font-bold flex items-center gap-1 text-[11px]">
                    <i data-lucide="key" class="w-3.5 h-3.5"></i> Conexión Privada (Gemini API Key)
                </span>
                <span id="wappy-ai-key-status" class="text-[9px] text-teal-300">Modo Servidor / Sin clave</span>
            </div>
            <p class="text-[10px] text-teal-200/70 leading-tight">
                Al abrir este formato en tu computador (archivo descargado), ingresa tu API Key para habilitar la IA. Se guarda de forma privada en tu navegador.
            </p>
            <div class="flex items-center gap-1.5">
                <input type="password" id="wappy-ai-apikey-input" placeholder="AIzaSy... (Tu clave privada)" class="flex-1 bg-black/40 text-white px-2.5 py-1.5 rounded-lg border border-teal-500/40 text-xs focus:outline-none focus:border-emerald-400 placeholder-teal-400/40">
                <button type="button" onclick="saveWappyAiApiKey()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-all active:scale-95 shadow-sm">
                    Guardar
                </button>
            </div>
        </div>

        <!-- Selector de Modelos Oficiales de Texto WAPPY -->
        <div class="flex items-center gap-2 pt-1 border-t border-white/10">
            <label for="wappy-ai-model-select" class="text-[10px] text-teal-200 font-bold uppercase tracking-wider flex items-center gap-1">
                <i data-lucide="cpu" class="w-3 h-3"></i> Modelo:
            </label>
            <select id="wappy-ai-model-select" class="flex-1 bg-teal-950/60 text-white text-[11px] font-semibold rounded-lg px-2.5 py-1 border border-teal-500/30 focus:outline-none focus:border-emerald-400">
                <option value="gemini-3.7-flash" selected>Gemini 3.7 Flash (Recomendado)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Potente)</option>
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Rápido)</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Equilibrado)</option>
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Ultra Rápido)</option>
            </select>
        </div>
    </div>

    <!-- Hilo de Mensajes con Scroll -->
    <div id="wappy-ai-chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50 dark:bg-slate-950/40">
        <!-- Mensaje Inicial de Bienvenida -->
        <div class="flex items-start gap-2.5">
            <div class="h-7 w-7 rounded-lg bg-teal-600/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                <i data-lucide="bot" class="w-4 h-4"></i>
            </div>
            <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-800 shadow-sm text-slate-800 dark:text-slate-200 leading-relaxed max-w-[88%]">
                <p class="font-bold text-teal-600 dark:text-teal-400 mb-1">¡Hola! Soy tu asistente de IA para este aplicativo.</p>
                <p>Tengo acceso a la información registrada en tiempo real. Puedes preguntarme sobre métricas, causas de incidentes, o pedirme planes de acción según la Resolución 0312.</p>
            </div>
        </div>
    </div>

    <!-- Chips de Acciones Rápidas (Preguntas Sugeridas) -->
    <div class="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap scrollbar-none">
        <button type="button" onclick="sendQuickPrompt('Analiza los indicadores actuales y resume las tendencias críticas')" class="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 font-semibold transition-colors">
            📊 Analizar Tendencias
        </button>
        <button type="button" onclick="sendQuickPrompt('Identifica las áreas o procesos con mayor severidad de accidentalidad')" class="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-semibold transition-colors">
            ⚠️ Áreas Críticas
        </button>
        <button type="button" onclick="sendQuickPrompt('Sugiere un plan de acción correctivo inmediato con base en los registros')" class="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold transition-colors">
            📋 Plan de Acción
        </button>
    </div>

    <!-- Barra de Entrada y Envío -->
    <div class="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input type="text" id="wappy-ai-chat-input" onkeydown="if(event.key === 'Enter') sendWappyAiMessage()" placeholder="Pregunta sobre este aplicativo o sus datos..." class="flex-1 bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-xs">
        <button type="button" id="wappy-ai-send-btn" onclick="sendWappyAiMessage()" class="h-9 w-9 bg-teal-600 hover:bg-teal-500 text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0">
            <i data-lucide="send" class="w-4 h-4"></i>
        </button>
    </div>
</div>
```

---

### 💾 JAVASCRIPT CLIENTE: CONEXIÓN, CONTEXTO Y CHAT COPILOT

Inserta este módulo de script para orquestar la comunicación con el backend:

```javascript
// =========================================================================
// 🤖 WAPPY AI COPILOT JAVASCRIPT CONTROLLER (HÍBRIDO: SERVIDOR O LOCAL)
// =========================================================================

const WAPPY_AI_CONFIG = {
    apiUrl: '/api/sgsst/canvas/app-builder/generate', // Endpoint backend si corre en servidor WAPPY
    storageKey: 'wappy_gemini_api_key', // Clave privada en LocalStorage del navegador
    history: [],
    isGenerating: false
};

// 1. Abrir / Cerrar Drawer de Chat
function toggleWappyAiChat() {
    const drawer = document.getElementById('wappy-ai-chat-drawer');
    if (!drawer) return;
    const isHidden = drawer.classList.contains('hidden');
    if (isHidden) {
        drawer.classList.remove('hidden');
        updateApiKeyUI();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        document.getElementById('wappy-ai-chat-input')?.focus();
    } else {
        drawer.classList.add('hidden');
    }
}

// 1.1 Toggle y guardado del panel discreto de configuración de API Key
function toggleWappyAiConfig() {
    const panel = document.getElementById('wappy-ai-config-panel');
    if (!panel) return;
    panel.classList.toggle('hidden');
    updateApiKeyUI();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function saveWappyAiApiKey() {
    const input = document.getElementById('wappy-ai-apikey-input');
    const val = input ? input.value.trim() : '';
    if (val) {
        localStorage.setItem(WAPPY_AI_CONFIG.storageKey, val);
        updateApiKeyUI();
        toggleWappyAiConfig();
    } else {
        localStorage.removeItem(WAPPY_AI_CONFIG.storageKey);
        updateApiKeyUI();
    }
}

function updateApiKeyUI() {
    const saved = localStorage.getItem(WAPPY_AI_CONFIG.storageKey);
    const indicator = document.getElementById('wappy-ai-key-indicator');
    const status = document.getElementById('wappy-ai-key-status');
    const input = document.getElementById('wappy-ai-apikey-input');
    if (saved) {
        if (indicator) indicator.classList.remove('hidden');
        if (status) status.innerText = '● Clave local configurada';
        if (input && !input.value) input.value = saved;
    } else {
        if (indicator) indicator.classList.add('hidden');
        if (status) status.innerText = 'Modo Servidor / Sin clave';
    }
}

// 2. Limpiar Historial del Chat
function clearWappyAiChat() {
    WAPPY_AI_CONFIG.history = [];
    const container = document.getElementById('wappy-ai-chat-messages');
    if (container) {
        container.innerHTML = `
            <div class="flex items-start gap-2.5">
                <div class="h-7 w-7 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                    <i data-lucide="bot" class="w-4 h-4"></i>
                </div>
                <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-800 shadow-sm text-slate-800 dark:text-slate-200 leading-relaxed max-w-[88%] text-xs">
                    Conversación reiniciada. ¿En qué puedo ayudarte con este aplicativo?
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// 3. Enviar prompt desde los chips sugeridos
function sendQuickPrompt(promptText) {
    const input = document.getElementById('wappy-ai-chat-input');
    if (input) input.value = promptText;
    sendWappyAiMessage();
}

// 4. Extracción de Contexto en Vivo de los Datos del Aplicativo
function getAppCurrentContext() {
    try {
        const context = {
            tituloAplicativo: document.getElementById('app-document-title')?.innerText || document.title,
            empresa: {
                nombre: document.getElementById('company-name')?.innerText || '',
                nit: document.getElementById('company-nit')?.innerText || '',
                arl: document.getElementById('company-arl')?.innerText || '',
                trabajadores: document.getElementById('company-workers')?.innerText || '',
                riesgo: document.getElementById('company-risk')?.innerText || '',
                codigo: document.getElementById('change-code')?.innerText || ''
            },
            googleSheetsId: typeof WAPPY_SHEETS_CONFIG !== 'undefined' ? WAPPY_SHEETS_CONFIG.spreadsheetId : null,
            indicadoresVisibles: {},
            registrosFilas: []
        };

        // Capturar indicadores y tarjetas numéricas visibles
        document.querySelectorAll('[data-metric], .metric-card, .kpi-card').forEach(el => {
            const label = el.querySelector('.metric-label, .kpi-label, span')?.innerText?.trim();
            const value = el.querySelector('.metric-value, .kpi-value, h3, h4')?.innerText?.trim();
            if (label && value) context.indicadoresVisibles[label] = value;
        });

        // Capturar registros de la tabla principal
        const table = document.querySelector('table');
        if (table) {
            const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim()).filter(Boolean);
            const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
                return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
            }).filter(r => r.length > 0);
            context.registrosFilas = { headers, sampleRows: rows.slice(0, 50) };
        } else if (typeof WAPPY_SHEETS_CONFIG !== 'undefined') {
            const localRecords = localStorage.getItem(WAPPY_SHEETS_CONFIG.localStorageKey);
            if (localRecords) context.registrosFilas = JSON.parse(localRecords).slice(0, 50);
        }

        return JSON.stringify(context, null, 2);
    } catch (e) {
        console.warn("[WappyAiCopilot] Error extrayendo contexto:", e);
        return "Contexto básico del aplicativo activo.";
    }
}

// 5. Envío y Procesamiento del Mensaje a la IA (Híbrido: Servidor o Gemini Directo)
async function sendWappyAiMessage() {
    const input = document.getElementById('wappy-ai-chat-input');
    const sendBtn = document.getElementById('wappy-ai-send-btn');
    const messagesContainer = document.getElementById('wappy-ai-chat-messages');
    const modelSelect = document.getElementById('wappy-ai-model-select');

    const text = input?.value?.trim();
    if (!text || WAPPY_AI_CONFIG.isGenerating) return;

    const selectedModel = modelSelect?.value || 'gemini-3.7-flash';
    const localApiKey = localStorage.getItem(WAPPY_AI_CONFIG.storageKey);
    const isLocalFile = window.location.protocol === 'file:' || !window.location.host;

    // Añadir mensaje del usuario a la interfaz
    appendMessageToChat('user', text);
    input.value = '';
    WAPPY_AI_CONFIG.isGenerating = true;
    if (sendBtn) sendBtn.disabled = true;

    // Indicador de carga
    const loadingId = 'ai-loading-' + Date.now();
    appendLoadingToChat(loadingId, selectedModel);

    try {
        const appDataContext = getAppCurrentContext();
        let aiText = '';
        let usedBackend = false;

        // Estrategia 1: Si no es archivo local file://, intentar conexión al backend WAPPY
        if (!isLocalFile) {
            try {
                const response = await fetch(WAPPY_AI_CONFIG.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        taskType: 'chat',
                        model: selectedModel,
                        userInput: text,
                        history: WAPPY_AI_CONFIG.history.slice(-6),
                        context: appDataContext,
                        systemPrompt: `Eres el Asistente WAPPY AI Copilot especializado en este aplicativo de SG-SST. Responde analizando rigurosamente los datos actuales y la normatividad colombiana.`
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    aiText = data.result || data.text || '';
                    usedBackend = true;
                }
            } catch (backendErr) {
                console.warn("[WappyAiCopilot] Backend no accesible, evaluando modo autónomo:", backendErr.message);
            }
        }

        // Estrategia 2: Modo Autónomo (file:// o sin backend) usando Gemini API directa
        if (!usedBackend) {
            if (!localApiKey) {
                removeLoadingFromChat(loadingId);
                appendMessageToChat('agent', `⚙️ **Modo Autónomo Local Activo:** Para consultar a la IA desde un archivo descargado o en local, haz clic en el engranaje **⚙️** del encabezado y guarda tu **Gemini API Key** (se guardará de forma privada en este navegador).`);
                WAPPY_AI_CONFIG.isGenerating = false;
                if (sendBtn) sendBtn.disabled = false;
                return;
            }

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent?key=${encodeURIComponent(localApiKey)}`;
            const systemContext = `Eres el Asistente WAPPY AI Copilot especializado en este aplicativo de SG-SST (Dec. 1072/2015, Res. 0312/2019).\n\nContexto actual de datos:\n${appDataContext}`;

            const geminiRes = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemContext}\n\nPregunta del usuario: ${text}` }] }
                    ]
                })
            });

            if (!geminiRes.ok) {
                const errData = await geminiRes.json().catch(() => ({}));
                throw new Error(errData?.error?.message || `HTTP ${geminiRes.status}`);
            }

            const geminiData = await geminiRes.json();
            aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta del modelo.';
        }

        // Remover indicador de carga y agregar respuesta
        removeLoadingFromChat(loadingId);
        appendMessageToChat('agent', aiText, selectedModel);

        // Guardar en historial
        WAPPY_AI_CONFIG.history.push({ sender: 'user', text: text });
        WAPPY_AI_CONFIG.history.push({ sender: 'agent', text: aiText });

    } catch (err) {
        console.error("[WappyAiCopilot] Error al consultar IA:", err);
        removeLoadingFromChat(loadingId);
        appendMessageToChat('agent', `⚠️ No se pudo procesar la consulta con IA (${err.message}). Por favor verifica tu API Key en el engranaje ⚙️ o la conexión a internet.`);
    } finally {
        WAPPY_AI_CONFIG.isGenerating = false;
        if (sendBtn) sendBtn.disabled = false;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Funciones Auxiliares de Renderizado en el Chat
function appendMessageToChat(sender, content, modelUsed) {
    const container = document.getElementById('wappy-ai-chat-messages');
    if (!container) return;

    const isUser = sender === 'user';
    const messageEl = document.createElement('div');
    messageEl.className = `flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`;

    const formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

    messageEl.innerHTML = `
        <div class="h-7 w-7 rounded-lg ${isUser ? 'bg-teal-600 text-white' : 'bg-teal-600/10 text-teal-600 dark:text-teal-400'} flex items-center justify-center shrink-0 border border-teal-500/20">
            <i data-lucide="${isUser ? 'user' : 'bot'}" class="w-4 h-4"></i>
        </div>
        <div class="${isUser ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-800 shadow-sm'} p-3.5 rounded-2xl leading-relaxed max-w-[88%] text-xs">
            ${!isUser && modelUsed ? `<span class="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 block mb-1 tracking-wider opacity-80">${modelUsed}</span>` : ''}
            <div>${formattedContent}</div>
        </div>
    `;

    container.appendChild(messageEl);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    container.scrollTop = container.scrollHeight;
}

function appendLoadingToChat(id, modelName) {
    const container = document.getElementById('wappy-ai-chat-messages');
    if (!container) return;
    const loadingEl = document.createElement('div');
    loadingEl.id = id;
    loadingEl.className = 'flex items-start gap-2.5';
    loadingEl.innerHTML = `
        <div class="h-7 w-7 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
            <i data-lucide="bot" class="w-4 h-4"></i>
        </div>
        <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-800 shadow-sm text-xs flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
            <span class="text-slate-500 text-[11px] font-medium">Analizando datos con ${modelName}...</span>
        </div>
    `;
    container.appendChild(loadingEl);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    container.scrollTop = container.scrollHeight;
}

function removeLoadingFromChat(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// Inicializar estado de API Key al cargar
window.addEventListener('DOMContentLoaded', () => {
    updateApiKeyUI();
});
```



