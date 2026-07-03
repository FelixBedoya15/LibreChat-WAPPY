    &lt;script&gt;
        // Variables globales del sistema
        let masterSavedChanges = [];
        let appDocHeader = {
            companyName: "WAPPY SA",
            companyNit: "NIT: 901437310",
            companyArl: "Colmena",
            companyWorkers: "30",
            companyRisk: "Clase III",
            changeCode: "GC-SST-AT-01",
            lastUpdated: new Date().toISOString().split('T')[0],
            appTitle: "{{Nombre del Aplicativo}}",
            appSubtitle: "SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO",
            appDesc: "Documento Corporativo Oficial - Conforme a la Normatividad Vigente",
            appBadge: "PROCESO: SG-SST | V.01",
            customFields: {
                "custom-form-descripcion": "",
                "custom-form-observaciones": "",
                "export-date": new Date().toISOString().split('T')[0]
            },
            logoBase64: ""
        };

        let currentTheme = 'light';
        let isLoadingState = false;
        const storageKey = 'wappy_sst___nombre_del_aplicativo__';
        let currentWizard = {
            tasks: [
                { id: "t1", title: "Socializar el aplicativo de {{Nombre del Aplicativo}}", resp: "SST", date: new Date().toISOString().split('T')[0], column: "todo" }
            ],
            photos: [],
            audioBase64: "",
            videoBase64: "",
            customSignatures: [],
            signatures: {}
        };

        // Helpers de Almacenamiento Seguro
        function safeGetLocalStorage(key) {
            try { return localStorage.getItem(key); } catch (e) { console.warn("localStorage.getItem blocked:", e); return null; }
        }
        function safeSetLocalStorage(key, value) {
            try { localStorage.setItem(key, value); } catch (e) { console.warn("localStorage.setItem blocked:", e); }
        }
        function safeRemoveLocalStorage(key) {
            try { localStorage.removeItem(key); } catch (e) { console.warn("localStorage.removeItem blocked:", e); }
        }

        // IndexedDB para firmas y archivos multimedia pesados (Evita colapso de LocalStorage)
        const dbName = 'WappySSTDb';
        const dbVersion = 1;
        const storeName = 'mediaStore';


        // Helper para reintentos con API de Gemini (maneja error 503/429)
        async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
            try {
                const response = await fetch(url, options);
                if (response.status === 503 || response.status === 429) {
                    if (retries &gt; 0) {
                        console.warn(`Gemini API respondió con ${response.status}. Reintentando en ${delay}ms... (${retries} intentos restantes)`);
                        await new Promise(resolve =&gt; setTimeout(resolve, delay));
                        return fetchWithRetry(url, options, retries - 1, delay * 2);
                    }
                }
                return response;
            } catch (error) {
                if (retries &gt; 0) {
                    console.warn(`Error de red: ${error.message}. Reintentando en ${delay}ms... (${retries} intentos restantes)`);
                    await new Promise(resolve =&gt; setTimeout(resolve, delay));
                    return fetchWithRetry(url, options, retries - 1, delay * 2);
                }
                throw error;
            }
        }

        function openDB() {
            return new Promise((resolve, reject) =&gt; {
                const request = indexedDB.open(dbName, dbVersion);
                request.onupgradeneeded = (e) =&gt; {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                };
                request.onsuccess = (e) =&gt; resolve(e.target.result);
                request.onerror = (e) =&gt; reject(e.target.error);
            });
        }

        async function saveCanvasToIndexedDB(id, base64Data) {
            try {
                const db = await openDB();
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                await store.put({ id: id, data: base64Data });
            } catch(e) { console.error("Error saving canvas to IndexedDB", e); }
        }

        async function loadCanvasFromIndexedDB(id) {
            try {
                const db = await openDB();
                return new Promise((resolve) =&gt; {
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const req = store.get(id);
                    req.onsuccess = () =&gt; resolve(req.result ? req.result.data : '');
                    req.onerror = () =&gt; resolve('');
                });
            } catch(e) { console.error("Error loading canvas from IndexedDB", e); return ''; }
        }

        async function saveMediaToDB(docId, photos, audio, video) {
            try {
                const db = await openDB();
                return new Promise((resolve, reject) =&gt; {
                    const tx = db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const request = store.put({
                        id: 'media_' + docId,
                        photos: photos || [],
                        audioBase64: audio || '',
                        videoBase64: video || ''
                    });
                    request.onsuccess = () =&gt; resolve();
                    request.onerror = () =&gt; reject(request.error);
                });
            } catch(e) { console.error("IndexedDB save media error:", e); }
        }

        async function loadMediaFromDB(docId) {
            try {
                const db = await openDB();
                return new Promise((resolve, reject) =&gt; {
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const request = store.get('media_' + docId);
                    request.onsuccess = (e) =&gt; {
                        resolve(e.target.result || { photos: [], audioBase64: '', videoBase64: '' });
                    };
                    request.onerror = () =&gt; reject(request.error);
                });
            } catch(e) {
                console.error("IndexedDB load media error:", e);
                return { photos: [], audioBase64: '', videoBase64: '' };
            }
        }

        async function deleteMediaFromDB(docId) {
            try {
                const db = await openDB();
                return new Promise((resolve, reject) =&gt; {
                    const tx = db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const request = store.delete('media_' + docId);
                    request.onsuccess = () =&gt; resolve();
                    request.onerror = () =&gt; reject(request.error);
                });
            } catch(e) { console.error("IndexedDB delete media error:", e); }
        }

        async function saveGlobalLogoToDB(logoBase64) {
            try {
                const db = await openDB();
                return new Promise((resolve, reject) =&gt; {
                    const tx = db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const request = store.put({
                        id: 'wappy_sst_global_logo',
                        logoBase64: logoBase64
                    });
                    request.onsuccess = () =&gt; resolve();
                    request.onerror = () =&gt; reject(request.error);
                });
            } catch(e) { console.error("Error saving global logo to IndexedDB:", e); }
        }

        async function loadGlobalLogoFromDB() {
            try {
                const db = await openDB();
                return new Promise((resolve, reject) =&gt; {
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const request = store.get('wappy_sst_global_logo');
                    request.onsuccess = (e) =&gt; {
                        resolve(e.target.result ? e.target.result.logoBase64 : '');
                    };
                    request.onerror = () =&gt; reject(request.error);
                });
            } catch(e) {
                console.error("Error loading global logo from IndexedDB:", e);
                return '';
            }
        }

        // Inicialización de Firmas con Fondo Blanco e Hilo Oscuro Fijos
        function initializeSingleCanvas(canvasId) {
            const cvs = document.getElementById(canvasId);
            if (!cvs) return;
            const context = cvs.getContext('2d');
            context.strokeStyle = '#1e293b'; // Trazo oscuro constante
            context.lineWidth = 2.5;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            
            cvs.isDrawing = false;
            cvs.hasDrawn = false;
            
            const getPos = (e) =&gt; {
                const rect = cvs.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return { x: clientX - rect.left, y: clientY - rect.top };
            };

            const startDraw = (e) =&gt; {
                cvs.isDrawing = true;
                const pos = getPos(e);
                context.beginPath();
                context.moveTo(pos.x, pos.y);
                e.preventDefault();
            };

            const draw = (e) =&gt; {
                if (!cvs.isDrawing) return;
                cvs.hasDrawn = true;
                const pos = getPos(e);
                context.lineTo(pos.x, pos.y);
                context.stroke();
                e.preventDefault();
            };

            const stopDraw = () =&gt; {
                if (!cvs.isDrawing) return;
                cvs.isDrawing = false;
                if (!isLoadingState) saveLocalData();
            };

            cvs.addEventListener('mousedown', startDraw);
            cvs.addEventListener('mousemove', draw);
            cvs.addEventListener('mouseup', stopDraw);
            cvs.addEventListener('mouseleave', stopDraw);

            cvs.addEventListener('touchstart', startDraw, { passive: false });
            cvs.addEventListener('touchmove', draw, { passive: false });
            cvs.addEventListener('touchend', stopDraw);
        }

        function clearSignatureCanvas(canvasId) {
            const cvs = document.getElementById(canvasId);
            if (!cvs) return;
            const context = cvs.getContext('2d');
            context.clearRect(0, 0, cvs.width, cvs.height);
            cvs.hasDrawn = false;
            if (!isLoadingState) {
                saveLocalData();
                saveCanvasToIndexedDB(canvasId, '');
            }
        }

        function uploadSignatureImage(canvasId) {
            const uploadEl = document.getElementById('upload-sig-' + (canvasId === 'signature-sgsst' ? 'sgsst' : 'trabajador'));
            if (!uploadEl) return;
            const file = uploadEl.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const cvs = document.getElementById(canvasId);
                    const ctx = cvs.getContext('2d');
                    const img = new Image();
                    img.onload = function() {
                        ctx.clearRect(0, 0, cvs.width, cvs.height);
                        ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
                        cvs.hasDrawn = true;
                        saveLocalData();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }

        // Subir y guardar logo
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
            appDocHeader.appTitle = document.getElementById('app-document-title').innerText.trim();
            appDocHeader.appSubtitle = document.getElementById('app-document-subtitle').innerText.trim();
            appDocHeader.appDesc = document.getElementById('app-document-desc').innerText.trim();
            appDocHeader.appBadge = document.getElementById('app-document-badge').innerText.trim();
            appDocHeader.companyName = document.getElementById('company-name').innerText.trim();
            appDocHeader.companyNit = document.getElementById('company-nit').innerText.trim();
            appDocHeader.companyArl = document.getElementById('company-arl').innerText.trim();
            appDocHeader.companyWorkers = document.getElementById('company-workers').innerText.trim();
            appDocHeader.companyRisk = document.getElementById('company-risk').innerText.trim();
            appDocHeader.changeCode = document.getElementById('change-code').innerText.trim();
            appDocHeader.lastUpdated = document.getElementById('last-updated-text').innerText.trim();
            saveLocalData();
        }

        // Guardado de Estado Local
        function saveLocalData() {
            if (isLoadingState) return;

            // Sincronizar campos principales en customFields
            appDocHeader.customFields = {};
            const inputs = document.querySelectorAll('input[id], textarea[id], select[id]');
            inputs.forEach(input =&gt; {
                const excluded = ['gemini-key', 'gemini-model', 'ai-chat-input', 'logo-upload-input', 'evidence-images-input', 'evidence-audio-input', 'evidence-video-input'];
                if (input.id && !excluded.includes(input.id) && !input.id.startsWith('upload-sig-') && !input.id.startsWith('signer-')) {
                    appDocHeader.customFields[input.id] = input.value;
                }
            });

            // Guardar firmas customizadas dinámicas
            if (currentWizard.customSignatures) {
                currentWizard.customSignatures.forEach(sig =&gt; {
                    const nameEl = document.getElementById(`signer-${sig.id}-name`);
                    const ccEl = document.getElementById(`signer-${sig.id}-cc`);
                    if (nameEl) sig.name = nameEl.value;
                    if (ccEl) sig.cc = ccEl.value;
                });
            }

            // Guardar nombres de firmantes por defecto
            const sgsstName = document.getElementById('signer-sgsst-name');
            const sgsstCc = document.getElementById('signer-sgsst-cc');
            const sgsstLicense = document.getElementById('signer-sgsst-license');
            if (sgsstName) appDocHeader.customFields['signer-sgsst-name'] = sgsstName.value;
            if (sgsstCc) appDocHeader.customFields['signer-sgsst-cc'] = sgsstCc.value;
            if (sgsstLicense) appDocHeader.customFields['signer-sgsst-license'] = sgsstLicense.value;

            const trabName = document.getElementById('signer-trabajador-name');
            const trabCc = document.getElementById('signer-trabajador-cc');
            if (trabName) appDocHeader.customFields['signer-trabajador-name'] = trabName.value;
            if (trabCc) appDocHeader.customFields['signer-trabajador-cc'] = trabCc.value;

            // Registrar si las firmas en canvas tienen dibujos
            currentWizard.signatures = {};
            document.querySelectorAll('canvas').forEach(canvas =&gt; {
                if (canvas.hasDrawn) {
                    currentWizard.signatures[canvas.id] = canvas.toDataURL();
                    saveCanvasToIndexedDB(canvas.id, canvas.toDataURL());
                }
            });

            // Remover binarios pesados antes de escribir en LocalStorage
            const strippedWizard = { ...currentWizard };
            delete strippedWizard.photos;
            delete strippedWizard.audioBase64;
            delete strippedWizard.videoBase65;
            
            const strippedDocHeader = { ...appDocHeader };
            delete strippedDocHeader.logoBase64;

            const data = {
                appDocHeader: strippedDocHeader,
                currentWizard: strippedWizard
            };
            safeSetLocalStorage(storageKey, JSON.stringify(data));

            // Escribir multimedia en DB
            saveMediaToDB('__nombre_del_aplicativo__', currentWizard.photos, currentWizard.audioBase64, currentWizard.videoBase64);
            
            if (appDocHeader.logoBase64) {
                saveGlobalLogoToDB(appDocHeader.logoBase64);
            }

            updateMediaSummary();
        }

        // Carga de Estado Local
        async function loadState() {
            isLoadingState = true;
            try {
                // Recuperar credenciales del copiloto
                const key = safeGetLocalStorage('wappy_gemini_key') || '';
                const keyEl = document.getElementById('gemini-key');
                if (keyEl) keyEl.value = key;

                const model = safeGetLocalStorage('wappy_gemini_model') || 'gemini-3.1-flash-lite';
                const modelEl = document.getElementById('gemini-model');
                if (modelEl) modelEl.value = model;

                const saved = safeGetLocalStorage(storageKey);
                if (saved) {
                    const data = JSON.parse(saved);
                    if (data.appDocHeader) appDocHeader = { ...appDocHeader, ...data.appDocHeader };
                    if (data.currentWizard) {
                        currentWizard = {
                            tasks: [],
                            photos: [],
                            audioBase64: "",
                            videoBase64: "",
                            customSignatures: [],
                            signatures: {},
                            ...data.currentWizard
                        };
                    }
                }

                // Cargar logo global desde DB
                const dbLogo = await loadGlobalLogoFromDB();
                if (dbLogo) {
                    appDocHeader.logoBase64 = dbLogo;
                    const previewImg = document.getElementById('logo-preview-img');
                    if (previewImg) {
                        previewImg.src = dbLogo;
                        previewImg.classList.remove('hidden');
                    }
                    const placeholderIcon = document.getElementById('logo-placeholder-icon');
                    if (placeholderIcon) placeholderIcon.classList.add('hidden');
                }

                // Cargar archivos multimedia de IndexedDB
                const dbMedia = await loadMediaFromDB('__nombre_del_aplicativo__');
                if (dbMedia) {
                    currentWizard.photos = dbMedia.photos || [];
                    currentWizard.audioBase64 = dbMedia.audioBase64 || '';
                    currentWizard.videoBase64 = dbMedia.videoBase64 || '';
                }

                // Rellenar inputs
                const inputs = document.querySelectorAll('input[id], textarea[id], select[id]');
                inputs.forEach(input =&gt; {
                    const excluded = ['gemini-key', 'gemini-model', 'ai-chat-input', 'logo-upload-input', 'evidence-images-input', 'evidence-audio-input', 'evidence-video-input'];
                    if (input.id && !excluded.includes(input.id) && appDocHeader.customFields && appDocHeader.customFields[input.id] !== undefined) {
                        input.value = appDocHeader.customFields[input.id];
                    }
                });

                // Cargar nombres de firmantes
                if (appDocHeader.customFields['signer-sgsst-name'] !== undefined) {
                    const el = document.getElementById('signer-sgsst-name');
                    if (el) el.value = appDocHeader.customFields['signer-sgsst-name'];
                }
                if (appDocHeader.customFields['signer-sgsst-cc'] !== undefined) {
                    const el = document.getElementById('signer-sgsst-cc');
                    if (el) el.value = appDocHeader.customFields['signer-sgsst-cc'];
                }
                if (appDocHeader.customFields['signer-sgsst-license'] !== undefined) {
                    const el = document.getElementById('signer-sgsst-license');
                    if (el) el.value = appDocHeader.customFields['signer-sgsst-license'];
                }
                if (appDocHeader.customFields['signer-trabajador-name'] !== undefined) {
                    const el = document.getElementById('signer-trabajador-name');
                    if (el) el.value = appDocHeader.customFields['signer-trabajador-name'];
                }
                if (appDocHeader.customFields['signer-trabajador-cc'] !== undefined) {
                    const el = document.getElementById('signer-trabajador-cc');
                    if (el) el.value = appDocHeader.customFields['signer-trabajador-cc'];
                }

                // Inyectar datos en el encabezado editable
                if (document.getElementById('app-document-title')) document.getElementById('app-document-title').innerText = appDocHeader.appTitle;
                if (document.getElementById('app-document-subtitle')) document.getElementById('app-document-subtitle').innerText = appDocHeader.appSubtitle;
                if (document.getElementById('app-document-desc')) document.getElementById('app-document-desc').innerText = appDocHeader.appDesc;
                if (document.getElementById('app-document-badge')) document.getElementById('app-document-badge').innerText = appDocHeader.appBadge;
                if (document.getElementById('company-name')) document.getElementById('company-name').innerText = appDocHeader.companyName;
                if (document.getElementById('company-nit')) document.getElementById('company-nit').innerText = appDocHeader.companyNit;
                if (document.getElementById('company-arl')) document.getElementById('company-arl').innerText = appDocHeader.companyArl;
                if (document.getElementById('company-workers')) document.getElementById('company-workers').innerText = appDocHeader.companyWorkers;
                if (document.getElementById('company-risk')) document.getElementById('company-risk').innerText = appDocHeader.companyRisk;
                if (document.getElementById('change-code')) document.getElementById('change-code').innerText = appDocHeader.changeCode;
                if (document.getElementById('last-updated-text')) document.getElementById('last-updated-text').innerText = appDocHeader.lastUpdated;

                // Cargar firmas dinámicas customizadas si hay registradas
                if (currentWizard.customSignatures && Array.isArray(currentWizard.customSignatures)) {
                    currentWizard.customSignatures.forEach(sig =&gt; {
                        createSignatureCardDOM(sig);
                    });
                }

                // Inicializar y renderizar las firmas canvas
                const canvases = document.querySelectorAll('canvas');
                for (let canvas of canvases) {
                    initializeSingleCanvas(canvas.id);
                    const sigData = await loadCanvasFromIndexedDB(canvas.id);
                    if (sigData) {
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        img.onload = () =&gt; {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                            canvas.hasDrawn = true;
                        };
                        img.src = sigData;
                    }
                }

                // Cargar audio y video cargados
                if (currentWizard.audioBase64) {
                    const player = document.getElementById('audio-playback');
                    const deleteBtn = document.getElementById('btn-delete-audio');
                    if (player) {
                        player.src = currentWizard.audioBase64;
                        player.classList.remove('hidden');
                    }
                    if (deleteBtn) deleteBtn.classList.remove('hidden');
                }
                
                if (currentWizard.videoBase64) {
                    const player = document.getElementById('video-playback');
                    const deleteBtn = document.getElementById('btn-delete-video');
                    if (player) {
                        player.src = currentWizard.videoBase64;
                        player.classList.remove('hidden');
                    }
                    if (deleteBtn) deleteBtn.classList.remove('hidden');
                }

                // Renderizar fotos
                renderPhotosGrid();

                // Renderizar Kanban
                renderKanban();

                // Ejecutar callbacks del formulario
                updateMediaSummary();
                if (typeof compileVisor === 'function') compileVisor();
                if (typeof calculatePriority === 'function') calculatePriority();

            } catch (e) {
                console.error("Error loading state:", e);
            } finally {
                isLoadingState = false;
            }
        }

        // Pestañas (Wizard Navigation)
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(c =&gt; c.classList.add('hidden'));
            document.querySelectorAll('[id^="btn-tab-"]').forEach(b =&gt; b.classList.remove('tab-active'));
            
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) selectedTab.classList.remove('hidden');
            
            const btn = document.getElementById('btn-' + tabId);
            if (btn) btn.classList.add('tab-active');

            // Auto-compilar reporte en Tab 3
            if (tabId === 'tab-analysis') {
                compileVisor();
            }
            if (tabId === 'tab-evidences') {
                const descVal = document.getElementById('custom-form-descripcion') ? document.getElementById('custom-form-descripcion').value : '';
                const obsVal = document.getElementById('custom-form-observaciones') ? document.getElementById('custom-form-observaciones').value : '';
                const summaryDesc = document.getElementById('summary-form-descripcion');
                const summaryObs = document.getElementById('summary-form-observaciones');
                if (summaryDesc) summaryDesc.innerText = descVal || '[Sin descripción de detalles registrado]';
                if (summaryObs) summaryObs.innerText = obsVal || '[Sin observaciones registradas]';
            }
        }

        // Compilar reporte a la vista del visor en tab-analysis
        function compileVisor() {
            // [AI: Personalizar esta compilación con los campos específicos de {{Nombre del Aplicativo}}]
            const descVal = document.getElementById('custom-form-descripcion') ? document.getElementById('custom-form-descripcion').value : '';
            const obsVal = document.getElementById('custom-form-observaciones') ? document.getElementById('custom-form-observaciones').value : '';
            
            const previewDesc = document.getElementById('preview-form-descripcion');
            const previewObs = document.getElementById('preview-form-observaciones');
            
            if (previewDesc && previewDesc !== document.activeElement) {
                previewDesc.innerText = descVal || '[Sin descripción de detalles registrado]';
            }
            if (previewObs && previewObs !== document.activeElement) {
                previewObs.innerText = obsVal || '[Sin observaciones registradas]';
            }
        }

        // Sincronizar cambios en campos editables de reporte hacia el formulario original
        function syncBackToForm(formFieldId, previewEl) {
            const formField = document.getElementById(formFieldId);
            if (formField) {
                formField.value = previewEl.innerText;
                saveLocalData();
            }
        }

        // Tablero Kanban de Plan de Acción
        function renderKanban() {
            const columns = { todo: [], progress: [], done: [] };
            currentWizard.tasks.forEach(t =&gt; {
                if (columns[t.column]) columns[t.column].push(t);
            });

            const renderCol = (colId, list) =&gt; {
                const container = document.getElementById('kanban-' + colId);
                if (!container) return;
                container.innerHTML = '';
                list.forEach(t =&gt; {
                    const card = document.createElement('div');
                    card.className = 'p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing text-xs flex flex-col gap-1.5';
                    card.draggable = true;
                    card.ondragstart = (e) =&gt; drag(e, t.id);
                    card.innerHTML = `
                        &lt;div class="flex justify-between items-start gap-1"&gt;
                            &lt;div class="font-bold text-slate-855 dark:text-slate-100 flex-1"&gt;${t.title}&lt;/div&gt;
                            &lt;button onclick="deleteKanbanTask('${t.id}')" class="text-[10px] text-red-500 font-bold hover:underline no-print"&gt;✕&lt;/button&gt;
                        &lt;/div&gt;
                        &lt;div class="flex justify-between items-center text-[10px] text-slate-455 dark:text-slate-400" style="font-size: 9px;"&gt;
                            &lt;span&gt;Resp: ${t.resp}&lt;/span&gt;
                            &lt;span&gt;${t.date}&lt;/span&gt;
                        &lt;/div&gt;
                    `;
                    container.appendChild(card);
                });
            };

            renderCol('todo', columns.todo);
            renderCol('progress', columns.progress);
            renderCol('done', columns.done);
        }

        function addNewKanbanTask() {
            const title = prompt("Describa la tarea del plan de acción:");
            if (!title) return;
            const resp = prompt("Responsable de la ejecución:", "SST");
            if (!resp) return;
            const date = prompt("Fecha límite (AAAA-MM-DD):", new Date().toISOString().split('T')[0]);
            if (!date) return;

            const newTask = {
                id: 'task_' + Date.now(),
                title: title,
                resp: resp,
                date: date,
                column: 'todo'
            };
            currentWizard.tasks.push(newTask);
            renderKanban();
            saveLocalData();
        }

        function deleteKanbanTask(id) {
            if (confirm("¿Desea eliminar esta tarea del plan de acción?")) {
                currentWizard.tasks = currentWizard.tasks.filter(t =&gt; t.id !== id);
                renderKanban();
                saveLocalData();
            }
        }

        function drag(ev, taskId) {
            ev.dataTransfer.setData("text", taskId);
        }

        // Eventos drag y drop nativos en las columnas HTML
        function allowDrop(ev) {
            ev.preventDefault();
        }

        function handleDrop(ev, columnName) {
            ev.preventDefault();
            const taskId = ev.dataTransfer.getData("text");
            const task = currentWizard.tasks.find(t =&gt; t.id === taskId);
            if (task) {
                task.column = columnName;
                renderKanban();
                saveLocalData();
            }
        }

        // Multimedia Handlers
        function handleImageUpload(ev) {
            const files = ev.target.files;
            if (!files) return;
            Array.from(files).forEach(file =&gt; {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentWizard.photos = currentWizard.photos || [];
                    currentWizard.photos.push(e.target.result);
                    renderPhotosGrid();
                    saveLocalData();
                };
                reader.readAsDataURL(file);
            });
        }

        function renderPhotosGrid() {
            const grid = document.getElementById('photos-grid');
            if (!grid) return;
            grid.innerHTML = '';
            currentWizard.photos = currentWizard.photos || [];
            currentWizard.photos.forEach((src, idx) =&gt; {
                const item = document.createElement('div');
                item.className = 'relative h-16 w-16 rounded-xl border overflow-hidden shadow-sm border-slate-200 dark:border-slate-800';
                item.innerHTML = `
                    &lt;img src="${src}" class="h-full w-full object-cover"&gt;
                    &lt;button onclick="removePhoto(${idx})" class="absolute top-1 right-1 h-4 w-4 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold no-print"&gt;✕&lt;/button&gt;
                `;
                grid.appendChild(item);
            });
        }

        // Remove Photo
        function removePhoto(idx) {
            currentWizard.photos.splice(idx, 1);
            renderPhotosGrid();
            saveLocalData();
        }

        function handleAudioUpload(ev) {
            const file = ev.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentWizard.audioBase64 = e.target.result;
                    const player = document.getElementById('audio-playback');
                    const deleteBtn = document.getElementById('btn-delete-audio');
                    if (player) {
                        player.src = e.target.result;
                        player.classList.remove('hidden');
                    }
                    if (deleteBtn) deleteBtn.classList.remove('hidden');
                    saveLocalData();
                };
                reader.readAsDataURL(file);
            }
        }

        function deleteAudio() {
            currentWizard.audioBase64 = '';
            const player = document.getElementById('audio-playback');
            const deleteBtn = document.getElementById('btn-delete-audio');
            if (player) {
                player.src = '';
                player.classList.add('hidden');
            }
            if (deleteBtn) deleteBtn.classList.add('hidden');
            saveLocalData();
        }

        // Video handlers
        function handleVideoUpload(ev) {
            const file = ev.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentWizard.videoBase64 = e.target.result;
                    const player = document.getElementById('video-playback');
                    const deleteBtn = document.getElementById('btn-delete-video');
                    if (player) {
                        player.src = e.target.result;
                        player.classList.remove('hidden');
                    }
                    if (deleteBtn) deleteBtn.classList.remove('hidden');
                    saveLocalData();
                };
                reader.readAsDataURL(file);
            }
        }

        function deleteVideo() {
            currentWizard.videoBase64 = '';
            const player = document.getElementById('video-playback');
            const deleteBtn = document.getElementById('btn-delete-video');
            if (player) {
                player.src = '';
                player.classList.add('hidden');
            }
            if (deleteBtn) deleteBtn.classList.add('hidden');
            saveLocalData();
        }

        function updateMediaSummary() {
            const summaryEl = document.getElementById('summary-audio-video');
            const summaryPhotos = document.getElementById('summary-photos');
            if (!summaryEl) return;
            
            // Fotos
            const photoCount = currentWizard.photos ? currentWizard.photos.length : 0;
            if (summaryPhotos) {
                summaryPhotos.innerHTML = photoCount &gt; 0 
                    ? `&lt;span class="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-350"&gt;&lt;i data-lucide="image" class="w-3.5 h-3.5 text-emerald-500"&gt;&lt;/i&gt; ${photoCount} foto(s) cargada(s)&lt;/span&gt;` 
                    : 'Ninguna cargada';
            }

            // Audio & Video
            let elements = [];
            if (currentWizard.audioBase64) {
                elements.push(`
                    &lt;div class="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-350"&gt;
                        &lt;i data-lucide="mic" class="w-3.5 h-3.5 text-emerald-500"&gt;&lt;/i&gt; Audio / Nota de voz registrada
                    &lt;/div&gt;
                `);
            }
            if (currentWizard.videoBase64) {
                elements.push(`
                    &lt;div class="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-350"&gt;
                        &lt;i data-lucide="video" class="w-3.5 h-3.5 text-emerald-500"&gt;&lt;/i&gt; Video cargado
                    &lt;/div&gt;
                `);
            }
            
            summaryEl.innerHTML = elements.length === 0 ? 'Ninguno registrado' : elements.join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // Firmas adicionales dinámicas
        function addAdditionalSignatureCard() {
            const id = 'sig_' + Date.now();
            const newSig = { id: id, name: "", cc: "", role: "" };
            currentWizard.customSignatures = currentWizard.customSignatures || [];
            currentWizard.customSignatures.push(newSig);
            
            createSignatureCardDOM(newSig);
            initializeSingleCanvas('signature-' + id);
            saveLocalData();
        }

        function createSignatureCardDOM(sig) {
            const grid = document.getElementById('signatures-grid');
            if (!grid) return;

            const card = document.createElement('div');
            card.id = 'signature-card-' + sig.id;
            card.className = 'p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex flex-col gap-4 shadow-sm relative';
            card.innerHTML = `
                &lt;button onclick="removeSignatureCard('${sig.id}')" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 font-bold no-print text-xs"&gt;✕ Eliminar&lt;/button&gt;
                &lt;span class="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-1.5 border-b dark:border-slate-800 pb-2"&gt;
                    &lt;svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="user-check" aria-hidden="true" class="lucide lucide-user-check w-4 h-4 text-emerald-500"&gt;&lt;path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"&gt;&lt;/path&gt;&lt;circle cx="9" cy="7" r="4"&gt;&lt;/circle&gt;&lt;polyline points="16 11 18 13 22 9"&gt;&lt;/polyline&gt;&lt;/svg&gt; Firma Adicional / Testigo
                &lt;/span&gt;
                &lt;div class="relative bg-slate-100 dark:bg-slate-955 rounded-2xl border border-slate-200 dark:border-slate-855 p-2 shadow-inner"&gt;
                    &lt;canvas id="signature-${sig.id}" width="300" height="120" class="w-full bg-white rounded-xl cursor-crosshair border border-slate-200 dark:border-slate-800"&gt;&lt;/canvas&gt;
                    &lt;input type="file" id="upload-sig-${sig.id}" class="hidden" accept="image/*" onchange="uploadSignatureImage('signature-${sig.id}')"&gt;
                    &lt;button onclick="document.getElementById('upload-sig-${sig.id}').click()" class="absolute bottom-4 left-4 py-1 px-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-355 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-[10px] transition cursor-pointer no-print"&gt;Cargar&lt;/button&gt;
                    &lt;button onclick="clearSignatureCanvas('signature-${sig.id}')" class="absolute bottom-4 right-4 py-1 px-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-355 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-[10px] transition cursor-pointer no-print"&gt;Limpiar&lt;/button&gt;
                &lt;/div&gt;
                &lt;div class="flex flex-col gap-2"&gt;
                    &lt;div&gt;
                        &lt;label class="block text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-0.5"&gt;NOMBRE COMPLETO&lt;/label&gt;
                        &lt;input type="text" id="signer-${sig.id}-name" oninput="saveLocalData()" class="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white font-medium shadow-sm" placeholder="Nombre completo" value="${sig.name || ""}"&gt;
                    &lt;/div&gt;
                    &lt;div&gt;
                        &lt;label class="block text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-0.5"&gt;CÉDULA / VÍNCULO&lt;/label&gt;
                        &lt;input type="text" id="signer-${sig.id}-cc" oninput="saveLocalData()" class="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white font-medium shadow-sm" placeholder="Identificación" value="${sig.cc || ""}"&gt;
                    &lt;/div&gt;
                &lt;/div&gt;
            `;
            grid.appendChild(card);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        function removeSignatureCard(id) {
            if (confirm("¿Desea eliminar este panel de firma adicional?")) {
                const card = document.getElementById('signature-card-' + id);
                if (card) card.remove();
                currentWizard.customSignatures = currentWizard.customSignatures.filter(s =&gt; s.id !== id);
                saveLocalData();
            }
        }

        // Modales
        function openLegalModal() {
            document.getElementById('legal-modal').classList.remove('hidden');
        }
        function closeLegalModal() {
            document.getElementById('legal-modal').classList.add('hidden');
        }
        function resetSSTForm() {
            if (confirm("¿Está seguro de que desea reiniciar este formulario? Se borrarán todos los cambios locales guardados.")) {
                safeRemoveLocalStorage(storageKey);
                deleteMediaFromDB('__nombre_del_aplicativo__').then(() =&gt; {
                    window.location.reload();
                });
            }
        }

        // Copiloto IA (API Gemini Directa)
        function toggleAISidebar() {
            const drawer = document.getElementById('ai-drawer');
            if (drawer) drawer.classList.toggle('translate-x-full');
        }

        function saveAPIKey() {
            const key = document.getElementById('gemini-key').value.trim();
            safeSetLocalStorage('wappy_gemini_key', key);
            alert("API Key de Gemini guardada localmente.");
        }
        
        // Save model
        function saveSelectedModel() {
            const model = document.getElementById('gemini-model').value;
            safeSetLocalStorage('wappy_gemini_model', model);
        }

        async function sendChatMessage() {
            const inputEl = document.getElementById('ai-chat-input');
            const messageText = inputEl.value.trim();
            if (!messageText) return;

            addChatMessage('user', messageText);
            inputEl.value = '';

            const apiKey = safeGetLocalStorage('wappy_gemini_key');
            if (!apiKey) {
                addChatMessage('assistant', "⚠️ Por favor, ingrese y guarde su API Key de Gemini abajo en el panel lateral para poder ayudarle.");
                return;
            }

            const model = document.getElementById('gemini-model') ? document.getElementById('gemini-model').value : 'gemini-3.1-flash-lite';
            addChatMessage('assistant', "🤖 Pensando...");

            // Construir contexto en vivo
            const inputs = document.querySelectorAll('input[id], textarea[id], select[id]');
            let currentValues = {};
            inputs.forEach(input =&gt; {
                const excluded = ['gemini-key', 'gemini-model', 'ai-chat-input', 'logo-upload-input', 'evidence-images-input', 'evidence-audio-input', 'evidence-video-input'];
                if (input.id && !excluded.includes(input.id) && !input.id.startsWith('signer-')) {
                    const labelEl = document.querySelector(`label[for="${input.id}"]`) || input.previousElementSibling;
                    const labelText = labelEl ? labelEl.textContent.trim() : input.id;
                    currentValues[labelText] = input.value;
                }
            });

            const headerInfo = {
                "Empresa": appDocHeader.companyName,
                "NIT": appDocHeader.companyNit,
                "ARL": appDocHeader.companyArl,
                "Código de Registro": appDocHeader.changeCode,
                "Última Actualización": appDocHeader.lastUpdated,
                "Título del Aplicativo": appDocHeader.appTitle
            };

            let documentContext = `DATOS ACTUALES DEL FORMULARIO Y CONTEXTO:\
`;
            documentContext += `Información de cabecera:\
${JSON.stringify(headerInfo, null, 2)}\
\
`;
            documentContext += `Campos del Formulario:\
`;
            for (const [key, val] of Object.entries(currentValues)) {
                if (val && val.trim() !== '') {
                    documentContext += `- ${key}: ${val}\
`;
                }
            }

            if (currentWizard.tasks && currentWizard.tasks.length &gt; 0) {
                documentContext += `\
Plan de Acción (Kanban):\
`;
                currentWizard.tasks.forEach(t =&gt; {
                    documentContext += `- Tarea: "\ .title}" | Responsable: \ .resp} | Fecha: \ .date} | Columna: \ .column}\
`;
                });
            }

            const systemContext = `Actúas como un experto consultor de Seguridad y Salud en el Trabajo (SST) de Colombia.
Tu especialidad específica para esta sesión es el aplicativo: ${appDocHeader.appTitle}.
Debes asegurar cumplimiento legal bajo la normatividad colombiana del SG-SST (Decreto 1072 de 2015, Resolución 0312 de 2019).
Responde siempre de forma profesional, técnica y detallada con terminología de SST.
Tu rol es puramente conversacional y de asesoría: responde dudas, explica metodologías, brinda recomendaciones y ayuda al usuario.
No incluyas códigos estructurados ni corchetes. Responde en un tono amigable, claro y constructivo.

${documentContext}`;

            try {
                const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: `${systemContext}\
\
Mensaje del usuario: ${messageText}` }] }
                        ]
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() =&gt; ({}));
                    const errMsg = errData.error?.message || `Error HTTP ${response.status}`;
                    throw new Error(errMsg);
                }

                const data = await response.json();
                const aiResponseText = data.candidates[0].content.parts[0].text;

                const messagesContainer = document.getElementById('ai-chat-messages');
                messagesContainer.removeChild(messagesContainer.lastChild); // Remover cargando

                addChatMessage('assistant', aiResponseText);
            } catch (err) {
                const messagesContainer = document.getElementById('ai-chat-messages');
                if (messagesContainer.lastChild.innerText.includes("Pensando")) {
                    messagesContainer.removeChild(messagesContainer.lastChild);
                }
                addChatMessage('assistant', "⚠️ Error de la API de Gemini: " + err.message);
            }
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
            inputs.forEach(input =&gt; {
                const excluded = ['gemini-key', 'gemini-model', 'ai-chat-input', 'logo-upload-input', 'evidence-images-input', 'evidence-audio-input', 'evidence-video-input'];
                if (!excluded.includes(input.id)) {
                    currentValues[input.id] = input.value;
                }
            });

            const model = document.getElementById('gemini-model').value;
            const loader = document.getElementById('ai-status-loader');
            if (loader) loader.classList.remove('hidden');

            // Definición de esquema de salida
            const jsonSchema = {
                "custom-form-descripcion": "Descripción o diagnóstico detallado del hallazgo (SOLO si no ha sido ingresada por el usuario)...",
                "custom-form-observaciones": "Acciones correctivas o preventivas detalladas a implementar...",
                "newTasks": [
                    { "title": "Acción preventiva 1 para ${formatName}" },
                    { "title": "Acción preventiva 2 para ${formatName}" }
                ]
            };

            const systemInstruction = `Actúas como un experto consultor de SST de Colombia. Analizarás los datos actuales ingresados en el formato y completarás los campos técnicos sugeridos que correspondan al aplicativo actual con información profesional de alto nivel y con base en el marco regulatorio colombiano de SST.
Devolverás OBLIGATORIAMENTE un JSON estructurado con los campos que deben llenarse o enriquecerse y un listado de tareas preventivas en "newTasks".
NO utilices bloques de código de markdown. Devuelve solo el JSON plano.

IMPORTANTE: Analizarás los datos ingresados en el aplicativo, pero bajo NINGUNA circunstancia debes sobrescribir o modificar los campos que el usuario ya haya diligenciado de forma manual con información de campo real. Solo debes proponer autocompletar aquellos campos que estén vacíos o que necesiten diagnóstico técnico complementario.

Estructura de salida obligatoria:
\${JSON.stringify(jsonSchema, null, 2)}`;

            const userPrompt = `Información actual ingresada en el formato "\$" + "\{appDocHeader.appTitle}":
\${JSON.stringify(currentValues, null, 2)}

Por favor, analiza esta información y genera el análisis técnico detallado completando los demás campos vacíos y proponiendo las tareas necesarias para el plan de acción en el formato JSON requerido.`;

            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                
                const response = await fetchWithRetry(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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

                // Enriquecer los campos correspondientes SIN sobrescribir datos manuales existentes
                for (const [key, val] of Object.entries(aiResult)) {
                    if (key !== 'newTasks' && val) {
                        const el = document.getElementById(key);
                        if (el) {
                            // Solo escribir si el campo está vacío o no contiene información del usuario
                            if (!el.value || el.value.trim() === '' || el.value.toLowerCase().includes('ingrese aquí') || el.value.toLowerCase().includes('describa en detalle')) {
                                el.value = typeof val === 'string' ? val.replace(/&lt;br\s*\/?&gt;|&lt;br\s*\/?&gt;/gi, '\n') : val;
                                el.dispatchEvent(new Event('input'));
                            }
                        }
                    }
                }

                // Autocompletar Kanban si hay tareas
                if (aiResult.newTasks && Array.isArray(aiResult.newTasks)) {
                    currentWizard.tasks = aiResult.newTasks.map((t, idx) =&gt; ({
                        id: 'task_' + Date.now() + '_' + idx,
                        title: t.title,
                        resp: 'SST',
                        date: new Date().toISOString().split('T')[0],
                        column: 'todo'
                    }));
                    renderKanban();
                }

                saveLocalData();
                alert("¡Campos autocompletados y plan de acción generado con éxito por la IA!");
            } catch (err) {
                console.error(err);
                alert("Error al generar análisis con IA: " + err.message);
            } finally {
                if (loader) loader.classList.add('hidden');
            }
        }

        function addChatMessage(role, text) {
            const container = document.getElementById('ai-chat-messages');
            if (!container) return;
            const msgDiv = document.createElement('div');
            if (role === 'user') {
                msgDiv.className = 'p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] bg-blue-500/10 text-blue-800 dark:text-blue-300 self-end ml-auto border border-blue-500/20';
                msgDiv.innerText = text;
            } else {
                msgDiv.className = 'p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-355';
                msgDiv.innerHTML = `&lt;div&gt;${markdownToHTML(text)}&lt;/div&gt;`;
            }
            container.appendChild(msgDiv);
            container.scrollTop = container.scrollHeight;
        }

        function markdownToHTML(text) {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;').replace(/&lt;/g, '&lt;').replace(/&gt;/g, '&gt;')
                .replace(/^### (.+)$/gm, '&lt;h3 class="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-3 mb-1"&gt;$1&lt;/h3&gt;')
                .replace(/^## (.+)$/gm, '&lt;h2 class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-3 mb-1"&gt;$1&lt;/h2&gt;')
                .replace(/^# (.+)$/gm, '&lt;h1 class="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-3 mb-1"&gt;$1&lt;/h1&gt;')
                .replace(/\*\*(.*?)\*\*/g, '&lt;strong&gt;$1&lt;/strong&gt;')
                .replace(/\*(.*?)\*/g, '&lt;em&gt;$1&lt;/em&gt;')
                .replace(/\n/g, '&lt;br&gt;');
        }

        // Exportador de HTML integrado (Reemplazo Inline de Variables)
        async function exportUpdatedHTML() {
            saveLocalData();
            let baseHTML = "";
            try {
                const response = await fetch(window.location.href);
                if (response.ok) baseHTML = await response.text();
            } catch (e) {}

            if (!baseHTML) {
                baseHTML = "&lt;!DOCTYPE html&gt;\
&lt;html&gt;" + document.documentElement.innerHTML + "&lt;/html&gt;";
            }

            const masterRegex = /let\s+masterSavedChanges\s*=s*\[[\s\S]*?\]\s*;/;
            const headerRegex = /let\s+appDocHeader\s*=s*\{[\s\S]*?\}\s*;/;
            const wizardRegex = /let\s+currentWizard\s*=s*\{[\s\S]*?\}\s*;/;

            const newMasterStr = `let masterSavedChanges = ${'\$JSON.stringify(masterSavedChanges, null, 4)}'};`.replace('\$JSON.stringify', 'JSON.stringify');
            const newHeaderStr = `let appDocHeader = ${'\$JSON.stringify(appDocHeader, null, 4)}'};`.replace('\$JSON.stringify', 'JSON.stringify');
            const newWizardStr = `let currentWizard = ${'\$JSON.stringify(currentWizard, null, 4)}'};`.replace('\$JSON.stringify', 'JSON.stringify');

            let updatedHTML = baseHTML;
            if (masterRegex.test(updatedHTML)) updatedHTML = updatedHTML.replace(masterRegex, newMasterStr);
            if (headerRegex.test(updatedHTML)) updatedHTML = updatedHTML.replace(headerRegex, newHeaderStr);
            if (wizardRegex.test(updatedHTML)) updatedHTML = updatedHTML.replace(wizardRegex, newWizardStr);

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

        // Alternancia de Temas
        function toggleTheme() {
            const body = document.body;
            const floatIcon = document.getElementById('theme-float-icon');
            const themeText = document.getElementById('theme-text');
            
            if (currentTheme === 'dark') {
                document.documentElement.classList.remove('dark');
                body.classList.remove('dark');
                body.classList.add('light');
                floatIcon.setAttribute('data-lucide', 'moon');
                floatIcon.className = "lucide lucide-moon w-4 h-4 text-slate-655";
                themeText.innerText = 'Modo Oscuro';
                currentTheme = 'light';
            } else {
                document.documentElement.classList.add('dark');
                body.classList.remove('light');
                body.classList.add('dark');
                floatIcon.setAttribute('data-lucide', 'sun');
                floatIcon.className = "lucide lucide-sun w-4 h-4 text-amber-400";
                themeText.innerText = 'Modo Claro';
                currentTheme = 'dark';
            }
            
            // Forzar firmas canvas a mantener hilo legible
            document.querySelectorAll('canvas').forEach(cvs =&gt; {
                const context = cvs.getContext('2d');
                if (context) {
                    context.strokeStyle = '#1e293b';
                }
            });
            
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // Evento de inicialización al cargar la página
        window.onload = async function() {
            try {
                if (typeof lucide !== 'undefined' && lucide.createIcons) {
                    lucide.createIcons();
                }
            } catch (e) { console.error("Error creating Lucide icons:", e); }
            
            try {
                await loadState();
            } catch (e) { console.error("Error loading state:", e); }
            
            // Set default export date
            try {
                const today = new Date().toISOString().split('T')[0];
                const exportDateEl = document.getElementById('export-date');
                if (exportDateEl && !exportDateEl.value) {
                    exportDateEl.value = today;
                }
                const footerDateEl = document.getElementById('footer-current-date');
                if (footerDateEl) {
                    footerDateEl.innerText = today;
                }
            } catch (e) { console.error("Error setting default export date:", e); }
        }

        window.addEventListener('beforeunload', saveLocalData);
    &lt;/script&gt;
