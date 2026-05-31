        window.addEventListener('error', function(e) {
            console.error("CAPTURED ERROR:", e.message, e.filename, e.lineno);
            const errDiv = document.createElement('div');
            errDiv.style.position = 'fixed';
            errDiv.style.top = '0';
            errDiv.style.left = '0';
            errDiv.style.width = '100%';
            errDiv.style.backgroundColor = '#f87171';
            errDiv.style.color = '#7f1d1d';
            errDiv.style.padding = '16px';
            errDiv.style.zIndex = '99999';
            errDiv.style.fontWeight = 'bold';
            errDiv.style.borderBottom = '4px solid #b91c1c';
            errDiv.innerHTML = '⚠️ ERROR DE JAVASCRIPT DETECTADO:<br><span style="font-family: monospace; font-size: 11px;">' + e.message + ' en ' + e.filename + ':' + e.lineno + '</span>';
            document.body.appendChild(errDiv);
        });
        tailwind.config = {
            darkMode: 'class'
        }
        let masterSavedChanges = [];
        let appDocHeader = {
            companyName: "WAPPY SA",
            companyNit: "NIT: 901437310",
            companyArl: "Colmena",
            companyWorkers: "30",
            companyRisk: "Clase III",
            changeCode: "GC-SST-ALTURAS-01",
            lastUpdated: "2026-05-29",
            appTitle: "Permiso de Trabajo Seguro en Alturas",
            appSubtitle: "SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO",
            appDesc: "Documento Corporativo Oficial - Conforme a la Normatividad Vigente",
            appBadge: "PROCESO: SG-SST | V.02",
            logoBase64: ""
        };
        
        let currentTheme = 'dark';
        let currentWizard = {
            id: null,
            tasks: [],
            atsRows: [],
            witnesses: [],
            averiasNodes: [],
            arbolCausasNodes: []
        };

        let canvas, ctx;
        let isDrawing = false;

        let activeTab = 'tab-identification';
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('[id^="btn-tab-"]').forEach(b => b.classList.remove('tab-active'));

            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.classList.remove('hidden');
            const targetBtn = document.getElementById(`btn-${tabId}`);
            if (targetBtn) targetBtn.classList.add('tab-active');
            activeTab = tabId;

            // Lógica específica para resúmenes de evidencias (si existen los elementos en la página)
            if (tabId === 'tab-evidences') {
                const getEl = (id) => document.getElementById(id);
                if (getEl('summary-worker-version')) {
                    const workerVal = getEl('at-version-trabajador') ? getEl('at-version-trabajador').value.trim() : '';
                    const investigatorVal = getEl('at-evento-desc') ? getEl('at-evento-desc').value.trim() : '';
                    getEl('summary-worker-version').innerText = workerVal || 'Ninguna ingresada';
                    getEl('summary-investigator-desc').innerText = investigatorVal || 'Ninguna ingresada';
                }
                if (getEl('summary-alturas-desc')) {
                    const descVal = getEl('alturas-descripcion') ? getEl('alturas-descripcion').value.trim() : '';
                    const ubicacionVal = getEl('alturas-ubicacion') ? getEl('alturas-ubicacion').value.trim() : '';
                    const metrosVal = getEl('alturas-metros') ? getEl('alturas-metros').value.trim() : '';
                    const sistemaVal = getEl('alturas-sistema') ? getEl('alturas-sistema').value.trim() : '';

                    const coordVal = getEl('alturas-coordinador') ? getEl('alturas-coordinador').value.trim() : '';
                    const supVal = getEl('alturas-supervisor') ? getEl('alturas-supervisor').value.trim() : '';
                    const emergVal = getEl('alturas-emergencias') ? getEl('alturas-emergencias').value.trim() : '';

                    getEl('summary-alturas-desc').innerText = descVal || 'Ninguna ingresada';
                    getEl('summary-alturas-ubicacion').innerText = (ubicacionVal || 'Ninguna') + ' (Altura: ' + (metrosVal || '0') + 'm)';
                    getEl('summary-alturas-sistema').innerText = sistemaVal || 'Ninguno ingresado';

                    if (getEl('summary-alturas-coordinador')) getEl('summary-alturas-coordinador').innerText = coordVal || 'No asignado';
                    if (getEl('summary-alturas-supervisor')) getEl('summary-alturas-supervisor').innerText = supVal || 'No asignado';
                    if (getEl('summary-alturas-emergencias')) getEl('summary-alturas-emergencias').innerText = emergVal || 'No asignado';
                }
            }
        }

        window.onload = function() {
            try {
                if (typeof lucide !== 'undefined' && lucide.createIcons) {
                    lucide.createIcons();
                }
            } catch (e) { console.error("Error creating Lucide icons:", e); }
            
            try {
                initializeCanvas();
            } catch (e) { console.error("Error initializing signature canvas:", e); }
            
            try {
                loadState();
            } catch (e) { console.error("Error loading state:", e); }
            
            // Set footer date dynamically
            try {
                const today = new Date().toISOString().split('T')[0];
                const dateEl = document.getElementById('footer-current-date');
                if (dateEl) dateEl.innerText = today;
            } catch (e) { console.error("Error setting footer date:", e); }
        }

        function uploadLogoImage() {
            const input = document.getElementById('logo-upload-input');
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewImg = document.getElementById('logo-preview-img');
                    const placeholderIcon = document.getElementById('logo-placeholder-icon');
                    if (previewImg) {
                        previewImg.src = e.target.result;
                        previewImg.classList.remove('hidden');
                    }
                    if (placeholderIcon) {
                        placeholderIcon.classList.add('hidden');
                    }
                    appDocHeader.logoBase64 = e.target.result;
                    saveLocalData();
                };
                reader.readAsDataURL(file);
            }
        }

        function saveDocHeader() {
            const titleEl = document.getElementById('app-document-title');
            const subtitleEl = document.getElementById('app-document-subtitle');
            const descEl = document.getElementById('app-document-desc');
            const badgeEl = document.getElementById('app-document-badge');

            if (titleEl) appDocHeader.appTitle = titleEl.innerText;
            if (subtitleEl) appDocHeader.appSubtitle = subtitleEl.innerText;
            if (descEl) appDocHeader.appDesc = descEl.innerText;
            if (badgeEl) appDocHeader.appBadge = badgeEl.innerText;

            const cName = document.getElementById('company-name');
            const cNit = document.getElementById('company-nit');
            const cArl = document.getElementById('company-arl');
            const cWorkers = document.getElementById('company-workers');
            const cRisk = document.getElementById('company-risk');
            const cCode = document.getElementById('change-code');
            const cUpdated = document.getElementById('last-updated-text');

            if (cName) appDocHeader.companyName = cName.innerText;
            if (cNit) appDocHeader.companyNit = cNit.innerText;
            if (cArl) appDocHeader.companyArl = cArl.innerText;
            if (cWorkers) appDocHeader.companyWorkers = cWorkers.innerText;
            if (cRisk) appDocHeader.companyRisk = cRisk.innerText;
            if (cCode) appDocHeader.changeCode = cCode.innerText;
            if (cUpdated) appDocHeader.lastUpdated = cUpdated.innerText;
            
            saveLocalData();
        }

        function bindDocHeaderToUI() {
            document.getElementById('app-document-title').innerText = appDocHeader.appTitle || "Permiso de Trabajo Seguro en Alturas";
            document.getElementById('app-document-subtitle').innerText = appDocHeader.appSubtitle || "SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO";
            document.getElementById('app-document-desc').innerText = appDocHeader.appDesc || "Documento Corporativo Oficial - Conforme a la Normatividad Vigente";
            document.getElementById('app-document-badge').innerText = appDocHeader.appBadge || "PROCESO: SG-SST | V.02";

            document.getElementById('company-name').innerText = appDocHeader.companyName || "WAPPY SA";
            document.getElementById('company-nit').innerText = appDocHeader.companyNit || "NIT: 901437310";
            document.getElementById('company-arl').innerText = appDocHeader.companyArl || "Colmena";
            document.getElementById('company-workers').innerText = appDocHeader.companyWorkers || "30";
            document.getElementById('company-risk').innerText = appDocHeader.companyRisk || "Clase III";
            document.getElementById('change-code').innerText = appDocHeader.changeCode || "GC-SST-ALTURAS-01";
            document.getElementById('last-updated-text').innerText = appDocHeader.lastUpdated || "2026-05-29";

            if (appDocHeader.logoBase64) {
                document.getElementById('logo-preview-img').src = appDocHeader.logoBase64;
                document.getElementById('logo-preview-img').classList.remove('hidden');
                document.getElementById('logo-placeholder-icon').classList.add('hidden');
            }

            if (appDocHeader.signerName !== undefined) {
                const sName = document.getElementById('signer-name');
                if (sName) sName.value = appDocHeader.signerName;
            }
            if (appDocHeader.signerRole !== undefined) {
                const sRole = document.getElementById('signer-role');
                if (sRole) sRole.value = appDocHeader.signerRole;
            }
            if (appDocHeader.signerLicense !== undefined) {
                const sLicense = document.getElementById('signer-license');
                if (sLicense) sLicense.value = appDocHeader.signerLicense;
            }

            if (appDocHeader.customFields) {
                for (const [id, val] of Object.entries(appDocHeader.customFields)) {
                    const el = document.getElementById(id);
                    if (el) {
                        el.value = val;
                    }
                }
            }
        }

        function initializeCanvas() {
            canvas = document.getElementById('signature-canvas');
            ctx = canvas.getContext('2d');
            ctx.strokeStyle = currentTheme === 'dark' ? '#ffffff' : '#1e293b';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseleave', stopDrawing);
            
            canvas.addEventListener('touchstart', startDrawingTouch, { passive: false });
            canvas.addEventListener('touchmove', drawTouch, { passive: false });
            canvas.addEventListener('touchend', stopDrawing, { passive: false });
        }

        function startDrawing(e) {
            isDrawing = true;
            ctx.beginPath();
            const rect = canvas.getBoundingClientRect();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        }

        function draw(e) {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.stroke();
        }

        function stopDrawing() {
            isDrawing = false;
            ctx.closePath();
        }

        function startDrawingTouch(e) {
            isDrawing = true;
            ctx.beginPath();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
            e.preventDefault();
        }

        function drawTouch(e) {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
            ctx.stroke();
            e.preventDefault();
        }

        function clearSignatureCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
        }

        function showLegalRequirements() {
            document.getElementById('legal-modal').classList.remove('hidden');
        }

        function closeLegalModal() {
            document.getElementById('legal-modal').classList.add('hidden');
        }

        function addNewKanbanTask() {
            const title = prompt("Describa la acción correctiva / preventiva:");
            if (title) {
                currentWizard.tasks.push({
                    id: Date.now(),
                    title: title,
                    column: 'todo'
                });
                renderKanban();
            if (document.getElementById('ats-table-body')) {
                renderATSTable();
            }
            if (typeof renderWitnesses === 'function' && document.getElementById('witnesses-list')) {
                renderWitnesses();
            }
            if (typeof renderAverias === 'function' && document.getElementById('averias-list')) {
                renderAverias();
            }
            if (typeof renderCausesTree === 'function' && document.getElementById('causes-tree-container')) {
                renderCausesTree();
            }
                saveLocalData();
            }
        }

        function renderKanban() {
            const columns = ['todo', 'progress', 'done'];
            columns.forEach(col => {
                const listEl = document.getElementById(`kanban-${col}`);
                listEl.innerHTML = '';
                const colTasks = currentWizard.tasks.filter(t => t.column === col);
                colTasks.forEach(task => {
                    const el = document.createElement('div');
                    el.className = 'p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200';
                    el.innerHTML = `
                        <span>${task.title}</span>
                        <div class="flex gap-1.5">
                            ${col !== 'done' ? `<button onclick="moveTask(${task.id}, '${col}')" class="p-1 hover:text-blue-500">➔</button>` : ''}
                            <button onclick="deleteTask(${task.id})" class="p-1 hover:text-red-500">✕</button>
                        </div>
                    `;
                    listEl.appendChild(el);
                });
            });
        }

        function moveTask(id, col) {
            const nextCol = col === 'todo' ? 'progress' : 'done';
            currentWizard.tasks = currentWizard.tasks.map(t => t.id === id ? { ...t, column: nextCol } : t);
            renderKanban();
            if (document.getElementById('ats-table-body')) {
                renderATSTable();
            }
            if (typeof renderWitnesses === 'function' && document.getElementById('witnesses-list')) {
                renderWitnesses();
            }
            if (typeof renderAverias === 'function' && document.getElementById('averias-list')) {
                renderAverias();
            }
            if (typeof renderCausesTree === 'function' && document.getElementById('causes-tree-container')) {
                renderCausesTree();
            }
            saveLocalData();
        }

        function deleteTask(id) {
            currentWizard.tasks = currentWizard.tasks.filter(t => t.id !== id);
            renderKanban();
            if (document.getElementById('ats-table-body')) {
                renderATSTable();
            }
            if (typeof renderWitnesses === 'function' && document.getElementById('witnesses-list')) {
                renderWitnesses();
            }
            if (typeof renderAverias === 'function' && document.getElementById('averias-list')) {
                renderAverias();
            }
            if (typeof renderCausesTree === 'function' && document.getElementById('causes-tree-container')) {
                renderCausesTree();
            }
            saveLocalData();
        }

        async function triggerIAGeneration() {
            const apiKey = safeGetLocalStorage('wappy_gemini_key') || '';
            if (!apiKey) {
                alert("Por favor ingrese su API Key de Gemini en la barra de configuración lateral.");
                toggleAISidebar();
                return;
            }

            const inputs = document.querySelectorAll('input[id], textarea[id], select[id]');
            let currentValues = {};
            inputs.forEach(input => {
                const excluded = ['gemini-key', 'gemini-model', 'ai-chat-input', 'logo-upload-input', 'signature-canvas', 'signer-name', 'signer-role', 'signer-license'];
                if (!excluded.includes(input.id)) {
                    currentValues[input.id] = input.value;
                }
            });

            const model = document.getElementById('gemini-model').value;
            const loader = document.getElementById('ai-status-loader');
            loader.classList.remove('hidden');

            const id = "permiso_alturas";
            let jsonSchema = {};
            let sstInstructions = "";

            if (id === "matriz_peligros") {
                jsonSchema = {
                    "peligro-actividad": "Actividad o tarea específica evaluada en el puesto de trabajo (Ej: Troquelado de láminas)",
                    "peligro-rutinaria": "SI o NO indicando si la tarea es habitual/rutinaria",
                    "peligro-desc": "Exposición, fuente generadora y descripción técnica detallada del peligro físico, químico, biomecánico, etc.",
                    "peligro-clasificacion": "Uno de los siguientes valores exactos: Fisico, Quimico, Biologico, Biomecanico, Psicosocial, Seguridad, Naturales",
                    "controles-existentes": "Medidas de control sugeridas y documentadas en la fuente, medio y trabajador",
                    "newTasks": [
                        { "title": "Capacitar en peligro biomecánico a los operarios" },
                        { "title": "Comprar ayudas mecánicas para levantamiento de cargas" }
                    ]
                };
                sstInstructions = "Actúas como un experto consultor de SST de Colombia experto en la metodología GTC-45.";
            } else if (id === "matriz_requisitos_legales") {
                jsonSchema = {
                    "legal-clasificacion": "Uno de los siguientes valores exactos: Nacional, Departamental, Local, Sectorial",
                    "legal-estado": "Uno de los siguientes valores exactos: CUMPLE, EN_PROCESO, NO_CUMPLE",
                    "requisito-desc": "Artículo aplicable y descripción detallada del requisito legal",
                    "evidencia-cumplimiento": "Evidencia de cumplimiento del requisito y responsable",
                    "newTasks": [
                        { "title": "Auditar cumplimiento de requisitos de la Resolución 0312" },
                        { "title": "Actualizar firmas en matriz de requisitos legales" }
                    ]
                };
                sstInstructions = "Actúas como un experto asesor de SST experto en normatividad y requisitos legales en Colombia.";
            } else if (id === "matriz_acpm") {
                jsonSchema = {
                    "acpm-origen": "Uno de los siguientes valores exactos: Auditoria, Accidente, Inspeccion, Copasst, Reporte, Revision",
                    "acpm-contencion": "Acción rápida de mitigación de la no conformidad",
                    "analisis-causa": "Análisis técnico de causa raíz (usando 5 porqués o Ishikawa)",
                    "plan-accion": "Plan detallado de acciones correctivas o preventivas a implementar",
                    "newTasks": [
                        { "title": "Cerrar acción correctiva de auditoría interna" },
                        { "title": "Revisar efectividad de plan correctivo a los 3 meses" }
                    ]
                };
                sstInstructions = "Actúas como un experto auditor de SST experto en no conformidades y acciones correctivas (ACPM).";
            } else if (id === "analisis_vulnerabilidad") {
                jsonSchema = {
                    "vuln-calificacion": "Uno de los siguientes valores exactos: POSIBLE, PROBABLE, INMINENTE",
                    "vuln-analisis": "Análisis de vulnerabilidad en personas, recursos y sistemas",
                    "vuln-medidas": "Medidas concretas de prevención y mitigación sugeridas",
                    "newTasks": [
                        { "title": "Instalar anclajes mecánicos sismorresistentes en estantería" },
                        { "title": "Realizar simulacro nacional de evacuación con brigadistas" }
                    ]
                };
                sstInstructions = "Actúas como un experto consultor de SST experto en prevención y respuesta ante emergencias y análisis de vulnerabilidad.";
            } else if (id === "reporte_actos_inseguros") {
                jsonSchema = {
                    "acto-tipo": "Uno de los siguientes valores exactos: Acto_Subestandar, Condicion_Subestandar",
                    "acto-area": "Área o puesto de trabajo del reporte",
                    "acto-correccion": "Corrección inmediata recomendada",
                    "acto-condicion-desc": "Descripción detallada del acto o de la condición insegura reportada en terreno",
                    "newTasks": [
                        { "title": "Socializar lección aprendida sobre acto inseguro reportado" },
                        { "title": "Inspección semanal de orden y aseo en zona afectada" }
                    ]
                };
                sstInstructions = "Actúas como un inspector de SST experto en reportes de actos y condiciones inseguras.";
            } else if (id === "gestion_cambio") {
                jsonSchema = {
                    "cambio-tipo": "Uno de los siguientes valores exactos: Fisico_Tecnico, Organizacional, Normativo, Tecnologico",
                    "cambio-desc-resumen": "Resumen conciso y claro del cambio planteado",
                    "cambio-desc": "Descripción física, técnica y de procesos exhaustiva del cambio organizacional propuesto",
                    "cambio-peligros": "Identificación de nuevos peligros",
                    "cambio-controles": "Medidas de control y prevención del cambio",
                    "newTasks": [
                        { "title": "Actualizar matriz GTC-45 con peligros del nuevo cambio" },
                        { "title": "Capacitar a operadores en nueva maquinaria instalada" }
                    ]
                };
                sstInstructions = "Actúas como un experto consultor de SST en gestión del cambio bajo Decreto 1072.";
            } else if (id === "reglamento_interno_trabajo") {
                jsonSchema = {
                    "rit-comite": "Políticas del Comité de Convivencia y prevención de acoso",
                    "rit-bienestar": "Políticas de higiene, ergonomía y bienestar",
                    "newTasks": [
                        { "title": "Elegir nuevos representantes del Comité de Convivencia" },
                        { "title": "Publicar reglamento interno de trabajo en cartelera física" }
                    ]
                };
                sstInstructions = "Actúas como un asesor jurídico experto en derecho laboral y reglamento interno de trabajo en SST.";
            } else if (id === "plan_trabajo") {
                jsonSchema = {
                    "plan-responsables": "Responsables del plan",
                    "plan-presupuesto": "Presupuesto detallado estimado de inversión",
                    "newTasks": [
                        { "title": "Comité mensual de seguimiento al cronograma del plan anual" },
                        { "title": "Presentar informe de cumplimiento a gerencia general" }
                    ]
                };
                sstInstructions = "Actúas como un consultor en SST experto en diseño y planeación de planes de trabajo anuales.";
            } else if (id === "plan_capacitacion") {
                jsonSchema = {
                    "cap-dirigido": "Población objeto a capacitar",
                    "cap-facilitador": "Facilitador o entidad sugerida",
                    "newTasks": [
                        { "title": "Evaluar la eficacia de capacitación de riesgo químico" },
                        { "title": "Diseñar inducción de SST para contratistas nuevos" }
                    ]
                };
                sstInstructions = "Actúas como un consultor en SST experto en planes de capacitación y entrenamiento.";
            } else if (id === "analisis_trabajo_seguro") {
                jsonSchema = {
                    "ats-herramientas": "Herramientas o equipos seguros",
                    "ats-epp": "EPP recomendados y de protección colectiva",
                    "newTasks": [
                        { "title": "Divulgar el ATS al personal ejecutor antes de la tarea" },
                        { "title": "Asegurar que andamio multidireccional tenga tarjeta verde" }
                    ]
                };
                sstInstructions = "Actúas como un especialista en SST experto en análisis de trabajo seguro (ATS).";
            } else if (id === "permiso_alturas") {
                jsonSchema = {
                    "alturas-sistema": "Sistemas de acceso y protección anticaídas recomendados",
                    "newTasks": [
                        { "title": "Verificar curso de alturas vigente y aptitud médica" },
                        { "title": "Inspeccionar el 100% de arneses y eslingas de alturas" }
                    ]
                };
                sstInstructions = "Actúas como un coordinador e instructor experto en trabajo en alturas bajo Resolución 4272.";
            } else if (id === "investigacion_accidentes") {
                jsonSchema = {
                    "causas-inmediatas-actos": "Acciones y comportamientos inseguros (Actos Subestándar) que provocaron el accidente",
                    "causas-inmediatas-condiciones": "Defectos en herramientas, equipos o instalaciones (Condiciones Subestándar) que provocaron el accidente",
                    "causas-basicas-personales": "Limitaciones de capacidad, entrenamiento o fatiga del trabajador (Factores Personales)",
                    "causas-basicas-trabajo": "Fallas en supervisión, mantenimiento preventivo o diseño (Factores del Trabajo)",
                    "at-why-1": "Primer porqué: ¿Por qué se lesionó el trabajador?",
                    "at-why-2": "Segundo porqué: Causa directa de la lesión",
                    "at-why-3": "Tercer porqué: Causa inmediata indirecta",
                    "at-why-4": "Cuarto porqué: Causa básica de la falla",
                    "at-why-5": "Quinto porqué: Causa básica organizacional raíz",
                    "at-ishikawa-mano-obra": "Causa en Mano de Obra",
                    "at-ishikawa-maquinaria": "Causa en Maquinaria/Equipos",
                    "at-ishikawa-metodo": "Causa en Método/Procedimiento",
                    "at-ishikawa-materiales": "Causa en Materiales/Repuestos",
                    "at-ishikawa-medio-ambiente": "Causa en Medio Ambiente/Área",
                    "at-ishikawa-medida": "Causa en Medición/Inspección",
                    "arbolCausasNodes": [
                        { "id": 1, "text": "Trauma en muñeca y miembro superior izquierdo", "type": "hecho", "parentId": null },
                        { "id": 2, "text": "Caída a nivel por pérdida de sustentación (resbalón)", "type": "hecho", "parentId": 1 },
                        { "id": 3, "text": "Contaminación del pasillo peatonal con derrame de aceite", "type": "estado", "parentId": 2 },
                        { "id": 4, "text": "Calzado del trabajador con suela lisa y sin adherencia", "type": "estado", "parentId": 2 },
                        { "id": 5, "text": "Pérdida de estanqueidad y goteo constante de fluido en montacargas", "type": "hecho", "parentId": 3 },
                        { "id": 6, "text": "Falta de delimitación y aviso de advertencia del riesgo", "type": "estado", "parentId": 3 },
                        { "id": 7, "text": "Desgaste y rotura de sellos por superación de ciclo de vida", "type": "hecho", "parentId": 5 }
                    ],
                    "newTasks": [
                        { "title": "Implementar guarda física de seguridad en máquina troqueladora" },
                        { "title": "Rediseñar procedimiento de mantenimiento preventivo crítico" },
                        { "title": "Socializar la lección aprendida del accidente con todo el personal" }
                    ]
                };
                sstInstructions = `Actúas como un experto en investigación de accidentes laborales y Resolución 1401 de 2007.
Para el árbol de causas (arbolCausasNodes), es absolutamente CRÍTICO que generes una estructura ramificada y no lineal. Esto significa que un nodo padre puede tener dos o más nodos hijos concurrentes (por ejemplo, que el resbalón sea causado concurrentemente por el charco de aceite y por el calzado inapropiado del trabajador, teniendo ambos el mismo parentId).
Para el diagrama de Ishikawa (at-ishikawa-*), cada una de las 6 categorías (Mano de Obra, Maquinaria, Método, Materiales, Medio Ambiente, Medida) debe contener obligatoriamente de 2 a 3 causas independientes cortas separadas por un carácter de salto de línea (\n). No uses párrafos corridos.`;
            }

            const systemInstruction = `
 ${sstInstructions}
 Analizarás los datos actuales ingresados en el formato y completarás los campos técnicos sugeridos que correspondan al formato actual con información profesional de alto nivel y con base en el marco regulatorio colombiano de SST.
 Devolverás OBLIGATORIAMENTE un JSON estructurado con los campos que deben llenarse o enriquecerse y un listado de 3 o 4 tareas de acción para el plan de acción (Kanban).
 NO utilices bloques de código de markdown. Devuelve solo el JSON plano.
 
 Estructura de salida obligatoria:
 ${JSON.stringify(jsonSchema, null, 2)}
            `;

            const userPrompt = `
 Información actual ingresada en el formato "${appDocHeader.appTitle}":
 ${JSON.stringify(currentValues, null, 2)}
 
 Por favor, analiza esta información y genera el análisis técnico detallado completando los demás campos y proponiendo las tareas necesarias para el plan de acción en el formato JSON requerido.
            `;

            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        generationConfig: { responseMimeType: "application/json" },
                        contents: [{ role: "user", parts: [{ text: userPrompt }] }]
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Error en API: ${response.status}`);
                }

                const resData = await response.json();
                const textContent = resData.candidates[0].content.parts[0].text;
                const aiResult = JSON.parse(textContent);

                // Enriquecer los campos correspondientes
                let updatedFields = 0;
                for (const [key, val] of Object.entries(aiResult)) {
                    if (key !== 'newTasks' && key !== 'arbolCausasNodes' && val) {
                        const el = document.getElementById(key);
                        if (el) {
                            el.value = typeof val === 'string' ? val.replace(/<br\s*\/?>|&lt;br\s*\/?&gt;/gi, '\n') : val;
                            updatedFields++;
                        }
                    }
                }

                if (aiResult.arbolCausasNodes && Array.isArray(aiResult.arbolCausasNodes)) {
                    currentWizard.arbolCausasNodes = aiResult.arbolCausasNodes;
                    renderCausesTree();
                }

                if (id === 'investigacion_accidentes') {
                    updateFiveWhys();
                    updateIshikawa();
                }

                // Agregar las tareas de plan de acción
                if (aiResult.newTasks && Array.isArray(aiResult.newTasks)) {
                    aiResult.newTasks.forEach(t => {
                        const taskTitle = t.title || t.activity;
                        if (taskTitle) {
                            const exists = currentWizard.tasks.some(existing => existing.title.toLowerCase() === taskTitle.toLowerCase());
                            if (!exists) {
                                currentWizard.tasks.push({
                                    id: Date.now() + Math.random(),
                                    title: taskTitle,
                                    column: 'todo'
                                });
                            }
                        }
                    });
                    renderKanban();
                }

                saveLocalData();
                alert("¡Copiloto IA completó con éxito el análisis técnico y diseñó el plan de acción! Revise los campos enriquecidos y el tablero Kanban de planes de acción.");
                
                // Redirigir a pestaña de plan si todo salió bien
                if (id === 'investigacion_accidentes') {
                    switchTab('tab-analysis');
                } else {
                    switchTab('tab-plan');
                }
            } catch (err) {
                console.error("Error al consultar Gemini:", err);
                alert("Error al generar análisis con IA: " + err.message + ". Verifique su conexión y su API Key.");
            } finally {
                loader.classList.add('hidden');
            }
        }

        async function sendChatMessage() {
            const inputEl = document.getElementById('ai-chat-input');
            const messageText = inputEl.value.trim();
            if (!messageText) return;

            addChatMessage('user', messageText);
            inputEl.value = '';

            const apiKey = localStorage.getItem('wappy_gemini_key');
            if (!apiKey) {
                addChatMessage('assistant', "⚠️ Por favor, ingrese y guarde su API Key de Gemini arriba para poder ayudarle.");
                return;
            }

            const systemContext = `Estás ayudando a redactar y estructurar la información del formato: Investigación de Incidentes y Accidentes de Trabajo.
Normatividad aplicable: Debe cumplir strictly con la Resolución 4272 de 2021 de Colombia. Obliga a diligenciar y firmar el permiso de trabajo en alturas de forma presencial por parte del Coordinador de Trabajo en Alturas, garantizando la verificación física del 100% de la lista de chequeo de seguridad..
Responde de forma concisa y profesional en materia de SST.
Si sugieres textos para completar los campos, enciérralos en corchetes especificando el campo (Ej. [Área: ...] o [Peligro: ...] o [Controles: ...], o [Nombre Empresa: ...]).
Si recomiendas tareas o planes de acción concretos para el Kanban de planes de acción, enciérralos como [Acción: Realizar tal actividad...] para que la plataforma los agregue automáticamente al tablero Kanban (Ej: [Acción: Capacitar al personal en el uso correcto de EPP]). Evita agregar ejemplos genéricos del formato en corchetes.`;

            addChatMessage('assistant', "🤖 Pensando...");

            try {
                const model = document.getElementById('gemini-model') ? document.getElementById('gemini-model').value : 'gemini-3.5-flash';
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: `${systemContext}\n\nMensaje del usuario: ${messageText}` }] }
                        ]
                    })
                });
                const data = await response.json();
                const aiResponseText = data.candidates[0].content.parts[0].text;

                const messagesContainer = document.getElementById('ai-chat-messages');
                messagesContainer.removeChild(messagesContainer.lastChild);

                addChatMessage('assistant', aiResponseText);
            } catch (err) {
                const messagesContainer = document.getElementById('ai-chat-messages');
                messagesContainer.removeChild(messagesContainer.lastChild);
                addChatMessage('assistant', "⚠️ Error al conectar con la API de Gemini. Verifique su API Key.");
            }
        }

        function addChatMessage(sender, text) {
            const messagesContainer = document.getElementById('ai-chat-messages');
            const messageEl = document.createElement('div');
            messageEl.className = `p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                sender === 'user' 
                    ? 'bg-blue-500/10 text-blue-800 dark:text-blue-300 self-end ml-auto border border-blue-500/20' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300'
            }`;

            let actionBtnHtml = "";
            
            if (sender === 'assistant' && text !== "🤖 Pensando...") {
                if (text.includes('[') || text.includes('**') || text.includes('###') || text.includes('*')) {
                    const base64Text = btoa(unescape(encodeURIComponent(text)));
                    actionBtnHtml = '<button onclick="applyAITextSuggestions(decodeURIComponent(escape(atob(\x27' + base64Text + '\x27))))" class="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold uppercase tracking-wider text-[10px] shadow-md hover:scale-[1.02] transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">⚡ Aplicar en Formulario y Kanban</button>';
                }
            }

            messageEl.innerHTML = `<div>${text}</div>${actionBtnHtml}`;
            messagesContainer.appendChild(messageEl);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function isPlaceholderText(str) {
            if (!str) return true;
            const s = str.trim();
            if (s === '...' || s === '..]' || s === '...]' || s === ']' || s === '[]') return true;
            if (/^\[?\.+\s*\.?\]?$/.test(s)) return true;
            if (s.toLowerCase().includes('ej:') && s.length < 30) return true;
            if (s.toLowerCase().includes('nombre de') && s.length < 30) return true;
            if (s.toLowerCase().includes('ingrese aquí') && s.length < 30) return true;
            if (s.toLowerCase().includes('describa ') && s.length < 30) return true;
            return false;
        }

        function cleanTaskTitle(title) {
            if (!title) return "";
            let t = title.trim();
            t = t.replace(/^[-*+\s]+/, '');
            t = t.replace(/^\[?(?:Acción correctiva\/preventiva|Acción preventiva|Acción correctiva|Acción|Tarea|Medida):\s*/i, '');
            if (t.startsWith('[') && t.endsWith(']')) {
                t = t.substring(1, t.length - 1).trim();
            }
            if (t.endsWith(']')) {
                t = t.substring(0, t.length - 1).trim();
            }
            if (t.startsWith(']')) {
                t = t.substring(1).trim();
            }
            return t.trim();
        }

        function autoInjectSSTData(text) {
            const id = "permiso_alturas";
            let injectedAny = false;
            
            const extractedKVs = {};
            const lines = text.split('\n');
            for (let line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine) continue;
                
                const doubleBracketMatch = cleanLine.match(/^(?:\*|-|\d+\.)?\s*(?:\*\*)?\[([^\]]+?):?\](?:\*\*)?:?\s*\[([^\]]+?)\]/);
                if (doubleBracketMatch) {
                    const key = doubleBracketMatch[1].replace(/:$/, '').trim().toLowerCase();
                    const val = doubleBracketMatch[2].trim();
                    extractedKVs[key] = val;
                    continue;
                }
                
                const singleBracketMatch = cleanLine.match(/\[([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\/\-\(\):]{3,50}?):\s*([^\]]{3,})\]/);
                if (singleBracketMatch) {
                    const key = singleBracketMatch[1].replace(/:$/, '').trim().toLowerCase();
                    const val = singleBracketMatch[2].trim();
                    extractedKVs[key] = val;
                    continue;
                }
                
                const standardMatch = cleanLine.match(/^(?:\*|-|\d+\.)?\s*(?:\*\*)?\[?([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\/\-\(\):]{3,50}?)\]?(?:\*\*)?:\s*(.+)$/);
                if (standardMatch) {
                    const key = standardMatch[1].replace(/:$/, '').trim().toLowerCase();
                    const val = standardMatch[2].trim();
                    extractedKVs[key] = val;
                    continue;
                }
            }

            function findValueForKeywords(keywords) {
                for (const [key, val] of Object.entries(extractedKVs)) {
                    if (keywords.some(kw => key.includes(kw.toLowerCase()))) {
                        if (!isPlaceholderText(val)) {
                            return val;
                        }
                    }
                }
                return null;
            }
            
            function extractSection(keywords, text) {
                const lines = text.split('\n');
                let capturing = false;
                let resultLines = [];
                
                for (let line of lines) {
                    const cleanLine = line.trim();
                    if (!cleanLine) continue;
                    
                    const isMatch = keywords.some(kw => {
                        const cleanKw = kw.toLowerCase();
                        return cleanLine.toLowerCase().includes(cleanKw) && (cleanLine.includes(':') || cleanLine.startsWith('#') || cleanLine.startsWith('*'));
                    });
                    
                    if (isMatch) {
                        capturing = true;
                        const colonIdx = cleanLine.indexOf(':');
                        if (colonIdx !== -1 && colonIdx < cleanLine.length - 1) {
                            let content = cleanLine.substring(colonIdx + 1).trim();
                            if (content.startsWith(']')) content = content.substring(1).trim();
                            if (content.endsWith(']')) content = content.substring(0, content.length - 1).trim();
                            if (content.startsWith('[')) content = content.substring(1).trim();
                            
                            if (content && !isPlaceholderText(content)) {
                                resultLines.push(content);
                            }
                        }
                        continue;
                    }
                    
                    const isOtherSection = capturing && (
                        cleanLine.startsWith('#') || 
                        (cleanLine.startsWith('**') && cleanLine.endsWith('**')) ||
                        (cleanLine.includes(':') && (cleanLine.toLowerCase().includes('causa') || cleanLine.toLowerCase().includes('porqué') || cleanLine.toLowerCase().includes('conclusion') || cleanLine.toLowerCase().includes('medida') || cleanLine.toLowerCase().includes('control') || cleanLine.toLowerCase().includes('área') || cleanLine.toLowerCase().includes('proceso') || cleanLine.toLowerCase().includes('peligro') || cleanLine.toLowerCase().includes('norma') || cleanLine.toLowerCase().includes('requisito') || cleanLine.toLowerCase().includes('evidencia') || cleanLine.toLowerCase().includes('amenaza') || cleanLine.toLowerCase().includes('vulnerabilidad') || cleanLine.toLowerCase().includes('reporte') || cleanLine.toLowerCase().includes('corrección') || cleanLine.toLowerCase().includes('cambio') || cleanLine.toLowerCase().includes('horario') || cleanLine.toLowerCase().includes('comité') || cleanLine.toLowerCase().includes('bienestar') || cleanLine.toLowerCase().includes('objetivo') || cleanLine.toLowerCase().includes('responsable') || cleanLine.toLowerCase().includes('presupuesto') || cleanLine.toLowerCase().includes('tema') || cleanLine.toLowerCase().includes('dirigido') || cleanLine.toLowerCase().includes('facilitador') || cleanLine.toLowerCase().includes('tarea') || cleanLine.toLowerCase().includes('herramienta') || cleanLine.toLowerCase().includes('epp') || cleanLine.toLowerCase().includes('coordinador') || cleanLine.toLowerCase().includes('metro') || cleanLine.toLowerCase().includes('sistema')))
                    );
                    
                    if (isOtherSection) {
                        break;
                    }
                    
                    if (capturing) {
                        let content = cleanLine;
                        if (content.startsWith('*') || content.startsWith('-')) {
                            content = content.replace(/^[-*+\s]+/, '');
                        }
                        if (content.startsWith('[') && content.endsWith(']')) {
                            content = content.substring(1, content.length - 1).trim();
                        }
                        if (content.endsWith(']')) {
                            content = content.substring(0, content.length - 1).trim();
                        }
                        if (content.startsWith(']')) {
                            content = content.substring(1).trim();
                        }
                        
                        if (content && !isPlaceholderText(content)) {
                            resultLines.push(content);
                        }
                    }
                }
                
                return resultLines.join('\n').replace(/\*\*/g, '').trim();
            }

            if (id === "matriz_peligros") {
                const area = findValueForKeywords(['proceso', 'área', 'area']) || extractSection(['proceso', 'área', 'area'], text);
                const peligro = findValueForKeywords(['peligro', 'riesgo', 'identificado']) || extractSection(['peligro', 'riesgo', 'identificado'], text);
                const controles = findValueForKeywords(['controles', 'control', 'existentes', 'recomendados']) || extractSection(['controles', 'control', 'existentes', 'recomendados'], text);
                if (area && !isPlaceholderText(area)) { document.getElementById('area-proceso').value = area.trim(); injectedAny = true; }
                if (peligro && !isPlaceholderText(peligro)) { document.getElementById('peligro-desc').value = peligro.trim(); injectedAny = true; }
                if (controles && !isPlaceholderText(controles)) { document.getElementById('controles-existentes').value = controles.trim(); injectedAny = true; }
            } else if (id === "matriz_requisitos_legales") {
                const norma = findValueForKeywords(['norma', 'entidad', 'año', 'ano']) || extractSection(['norma', 'entidad', 'año', 'ano'], text);
                const requisito = findValueForKeywords(['requisito', 'artículo', 'articulo', 'descripcion', 'descripción']) || extractSection(['requisito', 'artículo', 'articulo', 'descripcion', 'descripción'], text);
                const evidencia = findValueForKeywords(['evidencia', 'responsable', 'cumplimiento']) || extractSection(['evidencia', 'responsable', 'cumplimiento'], text);
                if (norma && !isPlaceholderText(norma)) { document.getElementById('norma-ano').value = norma.trim(); injectedAny = true; }
                if (requisito && !isPlaceholderText(requisito)) { document.getElementById('requisito-desc').value = requisito.trim(); injectedAny = true; }
                if (evidencia && !isPlaceholderText(evidencia)) { document.getElementById('evidencia-cumplimiento').value = evidencia.trim(); injectedAny = true; }
            } else if (id === "matriz_acpm") {
                const ncf = findValueForKeywords(['no conformidad', 'hallazgo', 'descripción', 'descripcion']) || extractSection(['no conformidad', 'hallazgo', 'descripción', 'descripcion'], text);
                const causa = findValueForKeywords(['causa', 'raíz', 'raiz', 'análisis', 'analisis']) || extractSection(['causa', 'raíz', 'raiz', 'análisis', 'analisis'], text);
                const plan = findValueForKeywords(['plan', 'acción', 'accion', 'medida', 'correctivo']) || extractSection(['plan', 'acción', 'accion', 'medida', 'correctivo'], text);
                if (ncf && !isPlaceholderText(ncf)) { document.getElementById('no-conformidad').value = ncf.trim(); injectedAny = true; }
                if (causa && !isPlaceholderText(causa)) { document.getElementById('analisis-causa').value = causa.trim(); injectedAny = true; }
                if (plan && !isPlaceholderText(plan)) { document.getElementById('plan-accion').value = plan.trim(); injectedAny = true; }
            } else if (id === "analisis_vulnerabilidad") {
                const amenaza = findValueForKeywords(['amenaza', 'ubicación', 'ubicacion', 'identificada']) || extractSection(['amenaza', 'ubicación', 'ubicacion', 'identificada'], text);
                const analisis = findValueForKeywords(['análisis', 'analisis', 'personas', 'recursos', 'sistemas']) || extractSection(['análisis', 'analisis', 'personas', 'recursos', 'sistemas'], text);
                const medidas = findValueForKeywords(['medidas', 'prevención', 'prevencion', 'mitigación', 'mitigacion']) || extractSection(['medidas', 'prevención', 'prevencion', 'mitigación', 'mitigacion'], text);
                if (amenaza && !isPlaceholderText(amenaza)) { document.getElementById('amenaza-ident').value = amenaza.trim(); injectedAny = true; }
                if (analisis && !isPlaceholderText(analisis)) { document.getElementById('vuln-analisis').value = analisis.trim(); injectedAny = true; }
                if (medidas && !isPlaceholderText(medidas)) { document.getElementById('vuln-medidas').value = medidas.trim(); injectedAny = true; }
            } else if (id === "reporte_actos_inseguros") {
                const desc = findValueForKeywords(['reporte', 'hallazgo', 'acto', 'condición', 'condicion', 'descripción', 'descripcion']) || extractSection(['reporte', 'hallazgo', 'acto', 'condición', 'condicion', 'descripción', 'descripcion'], text);
                const area = findValueForKeywords(['área', 'area', 'puesto', 'trabajo']) || extractSection(['área', 'area', 'puesto', 'trabajo'], text);
                const corr = findValueForKeywords(['corrección', 'correccion', 'inmediata', 'aplicada']) || extractSection(['corrección', 'correccion', 'inmediata', 'aplicada'], text);
                if (desc && !isPlaceholderText(desc)) { document.getElementById('acto-condicion-desc').value = desc.trim(); injectedAny = true; }
                if (area && !isPlaceholderText(area)) { document.getElementById('acto-area').value = area.trim(); injectedAny = true; }
                if (corr && !isPlaceholderText(corr)) { document.getElementById('acto-correccion').value = corr.trim(); injectedAny = true; }
            } else if (id === "gestion_cambio") {
                const cambio = findValueForKeywords(['cambio', 'propuesto', 'descripción', 'descripcion']) || extractSection(['cambio', 'propuesto', 'descripción', 'descripcion'], text);
                const peligros = findValueForKeywords(['peligros', 'nuevos', 'identificación', 'identificacion']) || extractSection(['peligros', 'nuevos', 'identificación', 'identificacion'], text);
                const controles = findValueForKeywords(['controles', 'prevención', 'prevencion', 'medidas']) || extractSection(['controles', 'prevención', 'prevencion', 'medidas'], text);
                if (cambio && !isPlaceholderText(cambio)) { document.getElementById('cambio-desc').value = cambio.trim(); injectedAny = true; }
                if (peligros && !isPlaceholderText(peligros)) { document.getElementById('cambio-peligros').value = peligros.trim(); injectedAny = true; }
                if (controles && !isPlaceholderText(controles)) { document.getElementById('cambio-controles').value = controles.trim(); injectedAny = true; }
            } else if (id === "reglamento_interno_trabajo") {
                const horarios = findValueForKeywords(['horarios', 'jornada', 'desconexión', 'desconexion']) || extractSection(['horarios', 'jornada', 'desconexión', 'desconexion'], text);
                const comite = findValueForKeywords(['comité', 'comite', 'convivencia', 'acoso']) || extractSection(['comité', 'comite', 'convivencia', 'acoso'], text);
                const bienestar = findValueForKeywords(['bienestar', 'higiene', 'condiciones']) || extractSection(['bienestar', 'higiene', 'condiciones'], text);
                if (horarios && !isPlaceholderText(horarios)) { document.getElementById('rit-horarios').value = horarios.trim(); injectedAny = true; }
                if (comite && !isPlaceholderText(comite)) { document.getElementById('rit-comite').value = comite.trim(); injectedAny = true; }
                if (bienestar && !isPlaceholderText(bienestar)) { document.getElementById('rit-bienestar').value = bienestar.trim(); injectedAny = true; }
            } else if (id === "plan_trabajo") {
                const obj = findValueForKeywords(['objetivo', 'general', 'meta']) || extractSection(['objetivo', 'general', 'meta'], text);
                const resp = findValueForKeywords(['responsables', 'ejecución', 'ejecucion']) || extractSection(['responsables', 'ejecución', 'ejecucion'], text);
                const pres = findValueForKeywords(['presupuesto', 'estimado']) || extractSection(['presupuesto', 'estimado'], text);
                if (obj && !isPlaceholderText(obj)) { document.getElementById('plan-objetivo').value = obj.trim(); injectedAny = true; }
                if (resp && !isPlaceholderText(resp)) { document.getElementById('plan-responsables').value = resp.trim(); injectedAny = true; }
                if (pres && !isPlaceholderText(pres)) { document.getElementById('plan-presupuesto').value = pres.trim(); injectedAny = true; }
            } else if (id === "plan_capacitacion") {
                const tema = findValueForKeywords(['tema', 'principal', 'capacitación', 'capacitacion']) || extractSection(['tema', 'principal', 'capacitación', 'capacitacion'], text);
                const dir = findValueForKeywords(['dirigido', 'población', 'poblacion', 'objeto']) || extractSection(['dirigido', 'población', 'poblacion', 'objeto'], text);
                const fac = findValueForKeywords(['facilitador', 'docente', 'entidad']) || extractSection(['facilitador', 'docente', 'entidad'], text);
                if (tema && !isPlaceholderText(tema)) { document.getElementById('cap-tema').value = tema.trim(); injectedAny = true; }
                if (dir && !isPlaceholderText(dir)) { document.getElementById('cap-dirigido').value = dir.trim(); injectedAny = true; }
                if (fac && !isPlaceholderText(fac)) { document.getElementById('cap-facilitador').value = fac.trim(); injectedAny = true; }
            } else if (id === "analisis_trabajo_seguro") {
                const tarea = findValueForKeywords(['tarea', 'crítica', 'critica', 'analizar', 'descripción', 'descripcion']) || extractSection(['tarea', 'crítica', 'critica', 'analizar', 'descripción', 'descripcion'], text);
                const herr = findValueForKeywords(['herramientas', 'equipos']) || extractSection(['herramientas', 'equipos'], text);
                const epp = findValueForKeywords(['epp', 'protección', 'proteccion', 'elementos']) || extractSection(['epp', 'protección', 'proteccion', 'elementos'], text);
                if (tarea && !isPlaceholderText(tarea)) { document.getElementById('ats-tarea').value = tarea.trim(); injectedAny = true; }
                if (herr && !isPlaceholderText(herr)) { document.getElementById('ats-herramientas').value = herr.trim(); injectedAny = true; }
                if (epp && !isPlaceholderText(epp)) { document.getElementById('ats-epp').value = epp.trim(); injectedAny = true; }
            } else if (id === "permiso_alturas") {
                const coord = findValueForKeywords(['coordinador', 'responsable']) || extractSection(['coordinador', 'responsable'], text);
                const metros = findValueForKeywords(['altura', 'metros']) || extractSection(['altura', 'metros'], text);
                const sist = findValueForKeywords(['sistema', 'acceso', 'protección', 'proteccion']) || extractSection(['sistema', 'acceso', 'protección', 'proteccion'], text);
                if (coord && !isPlaceholderText(coord)) { document.getElementById('alturas-coordinador').value = coord.trim(); injectedAny = true; }
                if (metros && !isPlaceholderText(metros)) { document.getElementById('alturas-metros').value = metros.trim(); injectedAny = true; }
                if (sist && !isPlaceholderText(sist)) { document.getElementById('alturas-sistema').value = sist.trim(); injectedAny = true; }
            } else if (id === "investigacion_accidentes") {
                const evento = findValueForKeywords(['evento', 'lesión', 'lesion', 'descripción', 'descripcion', 'accidente', 'incidente']) || extractSection(['evento', 'lesión', 'lesion', 'descripción', 'descripcion', 'accidente', 'incidente'], text);
                const porques = findValueForKeywords(['porqué', 'porque', '5 porqués', 'análisis', 'analisis', 'causa', 'raíz', 'raiz']) || extractSection(['porqué', 'porque', '5 porqués', 'análisis', 'analisis', 'causa', 'raíz', 'raiz'], text);
                const conclusiones = findValueForKeywords(['conclusiones', 'conclusión', 'conclusion', 'medidas', 'recomendaciones']) || extractSection(['conclusiones', 'conclusión', 'conclusion', 'medidas', 'recomendaciones'], text);
                if (evento && !isPlaceholderText(evento)) { document.getElementById('at-evento-desc').value = evento.trim(); injectedAny = true; }
                if (porques && !isPlaceholderText(porques)) { document.getElementById('at-5-porques').value = porques.trim(); injectedAny = true; }
                if (conclusiones && !isPlaceholderText(conclusiones)) { document.getElementById('at-conclusiones').value = conclusiones.trim(); injectedAny = true; }
            }
            
            // Extract and inject Kanban tasks dynamically!
            const tasksList = [];
            
            // 1. Check for explicit bracketed actions like [Acción: ...] or [Acción correctiva/preventiva: ...]
            const actionRegex = /\[(?:Acción correctiva\/preventiva|Acción preventiva|Acción correctiva|Acción|Tarea|Medida):\s*([\s\S]*?)\]/gi;
            let actionMatch;
            while ((actionMatch = actionRegex.exec(text)) !== null) {
                const taskTitle = cleanTaskTitle(actionMatch[1]);
                if (taskTitle && !isPlaceholderText(taskTitle)) {
                    tasksList.push(taskTitle);
                }
            }

            // 2. Fallback: Parse bullet points under sections related to "Plan de Acción"
            const linesList = text.split('\n');
            let insideActionSection = false;
            for (let line of linesList) {
                const cleanLine = line.trim();
                if (!cleanLine) continue;
                
                const isActionHeader = cleanLine.startsWith('#') && (
                    cleanLine.toLowerCase().includes('plan de acci') || 
                    cleanLine.toLowerCase().includes('medidas de intervenci') || 
                    cleanLine.toLowerCase().includes('acciones correctivas') || 
                    cleanLine.toLowerCase().includes('kanban') || 
                    cleanLine.toLowerCase().includes('tareas')
                );
                
                if (isActionHeader) {
                    insideActionSection = true;
                    continue;
                }
                
                if (insideActionSection && cleanLine.startsWith('#')) {
                    insideActionSection = false;
                }
                
                if (insideActionSection) {
                    const bulletMatch = cleanLine.match(/^(?:\*|-|\d+\.)\s*(.*)$/);
                    if (bulletMatch) {
                        let bulletText = cleanTaskTitle(bulletMatch[1]);
                        
                        if (bulletText.endsWith(':') || bulletText.toLowerCase().startsWith('si ')) {
                            continue;
                        }
                        
                        const isMeta = bulletText.toLowerCase().includes('tipo de control') || 
                                       bulletText.toLowerCase().includes('descripción técnica') || 
                                       bulletText.toLowerCase().includes('descripci') || 
                                       bulletText.toLowerCase().includes('responsable') || 
                                       bulletText.toLowerCase().includes('recursos') || 
                                       bulletText.toLowerCase().includes('fecha') || 
                                       bulletText.toLowerCase().includes('indicador') ||
                                       isPlaceholderText(bulletText) ||
                                       bulletText.length < 5;
                                       
                        if (!isMeta) {
                            tasksList.push(bulletText);
                        }
                    }
                }
            }

            if (tasksList.length > 0) {
                tasksList.forEach(title => {
                    const exists = currentWizard.tasks.some(t => t.title.toLowerCase() === title.toLowerCase());
                    if (!exists) {
                        currentWizard.tasks.push({
                            id: Date.now() + Math.random(),
                            title: title,
                            column: 'todo'
                        });
                        injectedAny = true;
                    }
                });
                if (injectedAny) {
                    renderKanban();
            if (document.getElementById('ats-table-body')) {
                renderATSTable();
            }
            if (typeof renderWitnesses === 'function' && document.getElementById('witnesses-list')) {
                renderWitnesses();
            }
            if (typeof renderAverias === 'function' && document.getElementById('averias-list')) {
                renderAverias();
            }
            if (typeof renderCausesTree === 'function' && document.getElementById('causes-tree-container')) {
                renderCausesTree();
            }
                }
            }
            
            // Global metadata fields auto-injection
            const globalFields = [
                { keywords: ['título', 'title'], id: 'app-document-title', type: 'text', key: 'appTitle' },
                { keywords: ['subtítulo', 'subtitle'], id: 'app-document-subtitle', type: 'text', key: 'appSubtitle' },
                { keywords: ['descripción documento', 'descripcion documento', 'desc'], id: 'app-document-desc', type: 'text', key: 'appDesc' },
                { keywords: ['proceso', 'badge'], id: 'app-document-badge', type: 'text', key: 'appBadge' },
                { keywords: ['empresa', 'nombre empresa'], id: 'company-name', type: 'text', key: 'companyName' },
                { keywords: ['nit'], id: 'company-nit', type: 'text', key: 'companyNit' },
                { keywords: ['arl'], id: 'company-arl', type: 'text', key: 'companyArl' },
                { keywords: ['trabajadores'], id: 'company-workers', type: 'text', key: 'companyWorkers' },
                { keywords: ['riesgo'], id: 'company-risk', type: 'text', key: 'companyRisk' },
                { keywords: ['código', 'codigo', 'registro'], id: 'change-code', type: 'text', key: 'changeCode' },
                { keywords: ['vigencia', 'fecha'], id: 'last-updated-text', type: 'text', key: 'lastUpdated' },
                { keywords: ['validador', 'nombre validador', 'nombre de quien valida'], id: 'signer-name', type: 'val', key: 'signerName' },
                { keywords: ['cargo', 'rol'], id: 'signer-role', type: 'val', key: 'signerRole' },
                { keywords: ['licencia'], id: 'signer-license', type: 'val', key: 'signerLicense' }
            ];
            
            globalFields.forEach(field => {
                const val = findValueForKeywords(field.keywords);
                if (val && !isPlaceholderText(val)) {
                    const cleanVal = val.trim();
                    let maxLimit = 50;
                    if (field.id === 'company-name') maxLimit = 60;
                    else if (field.id === 'company-nit') maxLimit = 30;
                    else if (field.id === 'company-arl') maxLimit = 30;
                    else if (field.id === 'company-workers') maxLimit = 15;
                    else if (field.id === 'company-risk') maxLimit = 20;
                    else if (field.id === 'change-code') maxLimit = 30;
                    else if (field.id === 'last-updated-text') maxLimit = 20;

                    if (cleanVal.length <= maxLimit) {
                        const el = document.getElementById(field.id);
                        if (el) {
                            if (field.type === 'text') {
                                el.innerText = cleanVal;
                                appDocHeader[field.key] = cleanVal;
                            } else {
                                el.value = cleanVal;
                            }
                            injectedAny = true;
                        }
                    }
                }
            });
            
            if (injectedAny) {
                saveLocalData();
            }
            return injectedAny;
        }

        function applyAITextSuggestions(text) {
            const injected = autoInjectSSTData(text);
            if (injected) {
                alert("Sugerencias inyectadas con éxito en el formulario.");
            } else {
                alert("No se detectaron sugerencias estructuradas en el texto.");
            }
        }

        function capturePhoto() {
            const grid = document.getElementById('photos-grid');
            if (grid.children.length >= 3) return alert("Máximo 3 fotos.");
            const el = document.createElement('div');
            el.className = 'h-14 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 font-mono shadow-inner';
            el.innerText = `Evidencia Foto ${grid.children.length + 1}`;
            grid.appendChild(el);
        }

        let isAudioRec = false;
        function toggleAudioRecording() {
            isAudioRec = !isAudioRec;
            const btn = document.getElementById('btn-audio-record');
            const player = document.getElementById('audio-playback');
            if (isAudioRec) {
                btn.innerText = 'Grabando (Parar)';
                btn.className = 'py-2 px-3 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 transition active:scale-95';
            } else {
                btn.innerText = 'Iniciar Grabación';
                btn.className = 'py-2 px-3 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-450 border border-blue-500/20 dark:border-blue-500/30 transition active:scale-95';
                player.classList.remove('hidden');
            }
        }

        function startVideoRecording() {
            const btn = document.getElementById('btn-video-record');
            const player = document.getElementById('video-playback');
            const timer = document.getElementById('video-timer');
            
            btn.innerText = 'Grabando Video...';
            btn.disabled = true;
            timer.classList.remove('hidden');
            
            let seconds = 10;
            const interval = setInterval(() => {
                seconds--;
                timer.innerText = `00:0${seconds}`;
                if (seconds <= 0) {
                    clearInterval(interval);
                    btn.innerText = 'Grabar Video 10s';
                    btn.disabled = false;
                    timer.classList.add('hidden');
                    player.classList.remove('hidden');
                    alert("Video de 10s registrado y consolidado con éxito en el estado del registro.");
                }
            }, 1000);
        }

        function toggleTheme() {
            const body = document.body;
            const floatIcon = document.getElementById('theme-float-icon');
            const themeText = document.getElementById('theme-text');
            
            if (currentTheme === 'dark') {
                document.documentElement.classList.remove('dark');
                body.classList.remove('dark');
                body.classList.add('light');
                floatIcon.setAttribute('data-lucide', 'moon');
                floatIcon.classList.remove('text-amber-500', 'text-amber-450', 'text-amber-400');
                floatIcon.classList.add('text-slate-650');
                themeText.innerText = 'Modo Oscuro';
                currentTheme = 'light';
            } else {
                document.documentElement.classList.add('dark');
                body.classList.remove('light');
                body.classList.add('dark');
                floatIcon.setAttribute('data-lucide', 'sun');
                floatIcon.classList.remove('text-slate-650');
                floatIcon.classList.add('text-amber-400');
                themeText.innerText = 'Modo Claro';
                currentTheme = 'dark';
            }
            
            // Adjust canvas drawing stroke color on theme toggle
            if (ctx) {
                ctx.strokeStyle = currentTheme === 'dark' ? '#ffffff' : '#1e293b';
            }
            
            lucide.createIcons();
        }

        function toggleAISidebar() {
            const drawer = document.getElementById('ai-drawer');
            drawer.classList.toggle('translate-x-full');
        }

        
        function renderATSTable() {
            const tbody = getEl('ats-table-body');
            if (!tbody) return;
            
            // If empty, initialize with defaults
            if (!currentWizard.atsRows || currentWizard.atsRows.length === 0) {
                currentWizard.atsRows = [];
            }
            
            tbody.innerHTML = '';
            currentWizard.atsRows.forEach((row, index) => {
                row.paso = (index + 1).toString();
                const tr = document.createElement('tr');
                tr.className = 'border-b dark:border-slate-800 border-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-900/20';
                tr.innerHTML = `
                    <td class="p-3 text-center font-bold text-slate-500">${row.paso}</td>
                    <td class="p-3">
                        <textarea id="ats-row-${index}-desc" oninput="updateATSRow(${index}, 'descripcion', this.value)" class="w-full rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 focus:ring-0 p-2 text-xs text-slate-900 dark:text-white resize-y" rows="2">${row.descripcion || ''}</textarea>
                    </td>
                    <td class="p-3">
                        <textarea id="ats-row-${index}-peligros" oninput="updateATSRow(${index}, 'peligros', this.value)" class="w-full rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 focus:ring-0 p-2 text-xs text-slate-900 dark:text-white resize-y" rows="2">${row.peligros || ''}</textarea>
                    </td>
                    <td class="p-3">
                        <textarea id="ats-row-${index}-controles" oninput="updateATSRow(${index}, 'controles', this.value)" class="w-full rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 focus:ring-0 p-2 text-xs text-slate-900 dark:text-white resize-y" rows="2">${row.controles || ''}</textarea>
                    </td>
                    <td class="p-3 text-center no-print">
                        <button type="button" onclick="removeATSRow(${index})" class="text-red-500 hover:text-red-650 transition p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20" title="Eliminar paso">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }

        function addATSRow() {
            if (!currentWizard.atsRows) currentWizard.atsRows = [];
            currentWizard.atsRows.push({
                paso: (currentWizard.atsRows.length + 1).toString(),
                descripcion: '',
                peligros: '',
                controles: ''
            });
            renderATSTable();
            saveLocalData();
        }

        function removeATSRow(index) {
            if (!currentWizard.atsRows) return;
            currentWizard.atsRows.splice(index, 1);
            renderATSTable();
            saveLocalData();
        }

        function updateATSRow(index, field, value) {
            if (!currentWizard.atsRows || !currentWizard.atsRows[index]) return;
            currentWizard.atsRows[index][field] = value;
            saveLocalData();
        }

        function syncAlturasNames() {
            const coordEl = document.getElementById('alturas-coordinador');
            if (coordEl) {
                const val = coordEl.value.trim();
                const nameEl = document.getElementById('signer-coordinador-name');
                const senaEl = document.getElementById('signer-coordinador-sena');
                const cierreCoordEl = document.getElementById('signer-cierre-coordinador-name');
                
                if (val) {
                    const parts = val.split(' - ');
                    const name = parts[0] ? parts[0].trim() : '';
                    if (nameEl) nameEl.value = name;
                    if (cierreCoordEl) cierreCoordEl.value = name;
                    
                    // Try to extract SENA reg
                    let senaVal = '';
                    if (name) {
                        for (let part of parts) {
                            if (part.toLowerCase().includes('sena') || part.toLowerCase().includes('reg')) {
                                const match = part.match(/(?:Reg(?:\.|istro)?)?\s*SENA\s*#?\s*\d+/i);
                                if (match) {
                                    senaVal = match[0].trim();
                                } else {
                                    senaVal = part.trim();
                                }
                            }
                        }
                    }
                    if (senaEl) {
                        senaEl.value = senaVal;
                    }
                } else {
                    if (nameEl) nameEl.value = '';
                    if (cierreCoordEl) cierreCoordEl.value = '';
                    if (senaEl) senaEl.value = '';
                }
            }
            
            const supEl = document.getElementById('alturas-supervisor');
            if (supEl) {
                const val = supEl.value.trim();
                const nameEl = document.getElementById('signer-emisor-name');
                const cargoEl = document.getElementById('signer-emisor-cargo');
                const cierreEmisorEl = document.getElementById('signer-cierre-emisor-name');
                
                if (val) {
                    const parts = val.split(' - ');
                    const name = parts[0] ? parts[0].trim() : '';
                    if (nameEl) nameEl.value = name;
                    if (cierreEmisorEl) cierreEmisorEl.value = name;
                    
                    const cargoVal = parts[1] ? parts[1].trim() : '';
                    if (cargoEl) {
                        cargoEl.value = cargoVal;
                    }
                } else {
                    if (nameEl) nameEl.value = '';
                    if (cierreEmisorEl) cierreEmisorEl.value = '';
                    if (cargoEl) cargoEl.value = '';
                }
            }
        }

        function resetSSTForm() {
            if (confirm("¿Está seguro de que desea reiniciar este formulario? Se borrarán todos los cambios locales guardados.")) {
                localStorage.removeItem(storageKey);
                window.location.reload();
            }
        }

        const storageKey = 'wappy_sst_permiso_alturas';
        function saveLocalData() {
            if (typeof syncAlturasNames === 'function') syncAlturasNames();
            const sName = document.getElementById('signer-name');
            const sRole = document.getElementById('signer-role');
            const sLicense = document.getElementById('signer-license');
            if (sName) appDocHeader.signerName = sName.value;
            if (sRole) appDocHeader.signerRole = sRole.value;
            if (sLicense) appDocHeader.signerLicense = sLicense.value;

            appDocHeader.customFields = {};
            const inputs = document.querySelectorAll('input[id], textarea[id], select[id]');
            inputs.forEach(input => {
                const excluded = ['gemini-key', 'gemini-model', 'ai-chat-input', 'logo-upload-input', 'signature-canvas', 'signer-name', 'signer-role', 'signer-license'];
                if (input.id && (input.id.startsWith('ats-row-') || input.id.startsWith('witness-') || input.id.startsWith('averia-') || input.id.startsWith('causa-') || input.id.startsWith('signer-signature-custom-'))) {
                    return;
                }
                if (!excluded.includes(input.id)) {
                    if (input.type === 'checkbox') {
                        appDocHeader.customFields[input.id] = input.checked;
                    } else {
                        appDocHeader.customFields[input.id] = input.value;
                    }
                }
            });

            const data = {
                appDocHeader,
                currentWizard
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
        }

        function loadState() {
            try {
                const key = localStorage.getItem('wappy_gemini_key') || '';
                const keyEl = document.getElementById('gemini-key');
                if (keyEl) keyEl.value = key;

                const model = localStorage.getItem('wappy_gemini_model') || 'gemini-3.5-flash';
                const modelEl = document.getElementById('gemini-model');
                if (modelEl) modelEl.value = model;

                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const data = JSON.parse(saved);
                    if (data.appDocHeader) appDocHeader = data.appDocHeader;
                    if (data.currentWizard) {
                        currentWizard = data.currentWizard;
                        if (!currentWizard.tasks) currentWizard.tasks = [];
                        if (!currentWizard.atsRows) currentWizard.atsRows = [];
                        if (!currentWizard.witnesses) currentWizard.witnesses = [];
                        if (!currentWizard.averiasNodes) currentWizard.averiasNodes = [];
                        if (!currentWizard.arbolCausasNodes) currentWizard.arbolCausasNodes = [];
                    }
                }
            } catch(e) {
                console.error("Error loading local state", e);
            }
            bindDocHeaderToUI();
                if (typeof syncAlturasNames === 'function') syncAlturasNames();
            renderKanban();
            if (document.getElementById('ats-table-body')) {
                renderATSTable();
            }
            if (typeof renderWitnesses === 'function' && document.getElementById('witnesses-list')) {
                renderWitnesses();
            }
            if (typeof renderAverias === 'function' && document.getElementById('averias-list')) {
                renderAverias();
            }
            if (typeof renderCausesTree === 'function' && document.getElementById('causes-tree-container')) {
                renderCausesTree();
            }
        }

        function saveAPIKey() {
            const key = document.getElementById('gemini-key').value.trim();
            localStorage.setItem('wappy_gemini_key', key);
            alert("API Key guardada localmente.");
        }

        function saveSelectedModel() {
            const model = document.getElementById('gemini-model').value;
            localStorage.setItem('wappy_gemini_model', model);
        }

        async function exportUpdatedHTML() {
            let baseHTML = "";
            try {
                const response = await fetch(window.location.href);
                if (response.ok) { baseHTML = await response.text(); }
            } catch (e) {
                console.warn("Could not fetch raw source file, falling back to DOM outerHTML:", e);
            }

            if (!baseHTML) {
                baseHTML = "<!DOCTYPE html>\n<html>" + document.documentElement.innerHTML + "</html>";
            }

            const masterRegex = /let\s+masterSavedChanges\s*=\s*\[[\s\S]*?\]\s*;/;
            const headerRegex = /let\s+appDocHeader\s*=\s*\{[\s\S]*?\}\s*;/;

            const newMasterStr = `let masterSavedChanges = \${JSON.stringify(masterSavedChanges, null, 4)};`;
            const newHeaderStr = `let appDocHeader = \${JSON.stringify(appDocHeader, null, 4)};`;

            let updatedHTML = baseHTML;
            if (masterRegex.test(updatedHTML)) { updatedHTML = updatedHTML.replace(masterRegex, newMasterStr); }
            if (headerRegex.test(updatedHTML)) { updatedHTML = updatedHTML.replace(headerRegex, newHeaderStr); }

            const blob = new Blob([updatedHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = appDocHeader.companyName.replace(/[^a-zA-Z0-9]/g, "_") + "_" + appDocHeader.changeCode + ".html";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
