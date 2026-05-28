import React, { useState, useEffect, useRef } from 'react';
import { 
    Blocks, Save, FilePlus, Zap, Settings, RefreshCw, MessageSquare, ArrowLeft, 
    Plus, X, Bot, Send, User, Trash2, Play, Edit, Sparkles, Check, CheckCircle, 
    ChevronLeft, ChevronRight, Code, FileText, Smartphone, Laptop, PlusCircle, Trash, Table, Download
} from 'lucide-react';
import { Button, useToastContext } from '@librechat/client';
import * as XLSX from 'xlsx';
import { cn } from '~/utils';
import { useAuthContext } from '~/hooks';

interface WappyBlock {
    uid: string;
    type: 'chat' | 'word' | 'excel' | 'slides' | 'html' | 'whatsapp';
    name: string;
    config: any;
}

interface WappyApp {
    id: string;
    title: string;
    description: string;
    systemPrompt: string;
    temperature: number;
    status: 'draft' | 'published';
    blocks: WappyBlock[];
    createdAt: string;
}

const AVAILABLE_BLOCKS = [
    { id: 'chat', type: 'chat', name: 'Mini Chat IA', desc: 'Incrusta toda la interfaz de un Agente WAPPY experto directo en tu aplicativo.', icon: MessageSquare, color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' },
    { id: 'word', type: 'word', name: 'Lienzo Word (Documentos)', desc: 'Genera y edita actas, manuales y políticas de SST maquetados por IA.', icon: FileText, color: 'text-green-500 border-green-500/20 bg-green-500/10' },
    { id: 'excel', type: 'excel', name: 'Lienzo Excel (Matrices)', desc: 'Tablas de evaluación ergonómica y matrices de riesgo rellenadas por IA.', icon: Blocks, color: 'text-teal-500 border-teal-500/20 bg-teal-500/10' },
    { id: 'slides', type: 'slides', name: 'Lienzo Slides (Presentaciones)', desc: 'Estructura e ilustra láminas y capacitaciones interactivas.', icon: Laptop, color: 'text-cyan-500 border-cyan-500/20 bg-cyan-500/10' },
    { id: 'html', type: 'html', name: 'Lienzo Web (HTML Prototipos)', desc: 'Prototipa vistas web, dashboards de indicadores e interfaces interactivas.', icon: Code, color: 'text-emerald-600 border-emerald-500/20 bg-emerald-500/5' },
    { id: 'whatsapp', type: 'whatsapp', name: 'Conexión WhatsApp', desc: 'Permite alertar a trabajadores o recibir reportes mediante WhatsApp empresarial.', icon: Smartphone, color: 'text-green-600 border-green-600/20 bg-green-600/10' },
];

export default function AppBuilder() {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();

    // ─── STATE MANAGEMENT ───
    const [apps, setApps] = useState<WappyApp[]>([]);
    const [activeApp, setActiveApp] = useState<WappyApp | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);
    const [playMode, setPlayMode] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef<HTMLDivElement>(null);

    // ─── PLAY MODE RUNNER STATE ───
    const [activeTab, setActiveTab] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatThinking, setIsChatThinking] = useState(false);

    // Document Module State
    const [docTitle, setDocTitle] = useState('Documento Técnico de SST');
    const [docHtml, setDocHtml] = useState('<p style="color: #666; font-style: italic;">Presiona "Generar Documento con IA" para redactar tu documento...</p>');
    const [isDocGenerating, setIsDocGenerating] = useState(false);

    // Excel Module State
    const [excelTitle, setExcelTitle] = useState('Matriz de Evaluación');
    const [excelCols, setExcelCols] = useState<string[]>(['Riesgo', 'Descripción', 'Nivel de Riesgo', 'Medida de Control', 'Responsable']);
    const [excelRows, setExcelRows] = useState<Record<string, string>[]>([
        { 'Riesgo': 'Biomecánico', 'Descripción': 'Postura prolongada en silla no ergonómica', 'Nivel de Riesgo': 'MEDIO', 'Medida de Control': 'Silla ergonómica certificada y pausas activas', 'Responsable': 'SST' }
    ]);
    const [isExcelGenerating, setIsExcelGenerating] = useState(false);

    // Slides Module State
    const [slidesTopic, setSlidesTopic] = useState('Capacitación en Higiene Postural');
    const [slidesList, setSlidesList] = useState<{ title: string; content: string }[]>([
        { title: 'Inducción de Higiene Postural', content: 'Bienvenidos al módulo ergonómico de WAPPY. Aquí aprenderás a salvaguardar tu columna vertebral durante tus horas laborales.' }
    ]);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [isSlidesGenerating, setIsSlidesGenerating] = useState(false);

    // HTML Module State
    const [htmlPrompt, setHtmlPrompt] = useState('Dashboard interactivo de salud en oficina');
    const [htmlContent, setHtmlContent] = useState('<div style="text-align:center; padding:50px; background:#f0fdf4; border-radius:20px; border:2px dashed #86efac; color:#166534;"><h3 style="margin:0;">Prototipo de Interfaz Web</h3><p>Presiona el botón superior para diseñar con IA</p></div>');
    const [isHtmlGenerating, setIsHtmlGenerating] = useState(false);

    // WhatsApp Module State
    const [isWhatsAppLinked, setIsWhatsAppLinked] = useState(false);
    const [whatsAppNumber, setWhatsAppNumber] = useState('+57 300 000 0000');
    const [whatsAppLogs, setWhatsAppLogs] = useState<{ time: string; event: string; type: 'in' | 'out' | 'sys' }[]>([
        { time: new Date().toLocaleTimeString(), event: 'Simulador WhatsApp WAPPY inicializado', type: 'sys' }
    ]);
    const [simulatedIncomingMsg, setSimulatedIncomingMsg] = useState('');
    const [isWhatsAppSimulating, setIsWhatsAppSimulating] = useState(false);

    // Load custom apps on mount
    useEffect(() => {
        const saved = localStorage.getItem('wappy_custom_apps');
        if (saved) {
            try {
                setApps(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse wappy_custom_apps', e);
            }
        }
    }, []);

    // Close export dropdown when clicking outside
    useEffect(() => {
        if (!isExportDropdownOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
                setIsExportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isExportDropdownOpen]);

    // Save apps utility
    const saveToLocalStorage = (updatedApps: WappyApp[]) => {
        setApps(updatedApps);
        localStorage.setItem('wappy_custom_apps', JSON.stringify(updatedApps));
    };

    // ─── ACTIONS ───
    const handleNewApp = () => {
        const newApp: WappyApp = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Aplicativo Personalizado ' + (apps.length + 1),
            description: 'Un aplicativo interactivo diseñado a la medida con módulos nativos de WAPPY Canvas y Alma de IA.',
            systemPrompt: 'Eres un consultor experto en Seguridad y Salud en el Trabajo (SST) para Colombia, con un enfoque compasivo en el bioindividuo. Tu meta es proteger el bienestar humano con rigurosidad técnica y empatía.',
            temperature: 0.7,
            status: 'draft',
            blocks: [
                { uid: 'block_chat', type: 'chat', name: 'Asesor IA Ergonómico', config: { greeting: '¡Hola! Bienvenido a tu asesor ergonómico inteligente. ¿Qué inquietud o malestar físico presentas hoy?' } }
            ],
            createdAt: new Date().toLocaleDateString('es-CO')
        };
        const updated = [newApp, ...apps];
        saveToLocalStorage(updated);
        setActiveApp(newApp);
        setIsBuilding(true);
        setTitleInput(newApp.title);
        setPlayMode(false);
    };

    const handleSelectApp = (app: WappyApp) => {
        setActiveApp(app);
        setIsBuilding(true);
        setTitleInput(app.title);
        setPlayMode(false);
        
        // Reset execution states
        setChatMessages([{ sender: 'bot', text: app.blocks.find(b => b.type === 'chat')?.config?.greeting || '¡Hola! ¿En qué puedo ayudarte hoy?' }]);
        
        const excelBlock = app.blocks.find(b => b.type === 'excel');
        if (excelBlock?.config?.cols) {
            setExcelCols(excelBlock.config.cols);
        }
        if (excelBlock?.config?.rows) {
            setExcelRows(excelBlock.config.rows);
        }
        const docBlock = app.blocks.find(b => b.type === 'word');
        if (docBlock?.config?.title) {
            setDocTitle(docBlock.config.title);
        }
    };

    const handleSaveApp = () => {
        if (!activeApp) return;
        
        // Sync active execution changes back to block config before saving if desired
        const updatedBlocks = activeApp.blocks.map(block => {
            if (block.type === 'chat') {
                return { ...block, config: { ...block.config, greeting: chatMessages[0]?.text || block.config.greeting } };
            }
            if (block.type === 'word') {
                return { ...block, config: { ...block.config, title: docTitle, content: docHtml } };
            }
            if (block.type === 'excel') {
                return { ...block, config: { ...block.config, cols: excelCols, rows: excelRows } };
            }
            return block;
        });

        const updatedApp = {
            ...activeApp,
            title: titleInput,
            blocks: updatedBlocks
        };

        const updatedList = apps.map(a => a.id === activeApp.id ? updatedApp : a);
        saveToLocalStorage(updatedList);
        setActiveApp(updatedApp);
        showToast({ message: '¡Aplicativo guardado y registrado exitosamente en tu Bóveda!', status: 'success', severity: 'success' });
    };

    const handleDeleteApp = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('¿Seguro que deseas eliminar este aplicativo de tu Bóveda?')) return;
        const updated = apps.filter(a => a.id !== id);
        saveToLocalStorage(updated);
        if (activeApp && activeApp.id === id) {
            setActiveApp(null);
            setIsBuilding(false);
        }
        showToast({ message: 'Aplicativo removido.', status: 'info' });
    };

    const addBlock = (blockDef: any) => {
        if (!activeApp) return;
        const newBlock: WappyBlock = {
            uid: Math.random().toString(36).substr(2, 9),
            type: blockDef.type,
            name: blockDef.name,
            config: blockDef.type === 'excel' ? { cols: ['Riesgo', 'Descripción', 'Nivel de Riesgo', 'Medida de Control', 'Responsable'], rows: [] } : {}
        };
        const updatedApp = {
            ...activeApp,
            blocks: [...activeApp.blocks, newBlock]
        };
        setActiveApp(updatedApp);
    };

    const removeBlock = (uid: string) => {
        if (!activeApp) return;
        const updatedApp = {
            ...activeApp,
            blocks: activeApp.blocks.filter(b => b.uid !== uid)
        };
        setActiveApp(updatedApp);
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if (!activeApp) return;
        const newBlocks = [...activeApp.blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
        
        // Swap
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[targetIndex];
        newBlocks[targetIndex] = temp;

        setActiveApp({
            ...activeApp,
            blocks: newBlocks
        });
    };

    // ─── AI CALLS BRIDGING TO BACKEND ROUTE ───
    const generateWithAI = async (taskType: string, userInput: string, extra = {}) => {
        if (!token) return '';
        try {
            const response = await fetch('/api/sgsst/canvas/app-builder/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    taskType,
                    systemPrompt: activeApp?.systemPrompt || '',
                    userInput,
                    ...extra
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data.result || '';
        } catch (err: any) {
            console.error('AI Generation Failed:', err);
            showToast({ message: 'Error con la IA: ' + err.message, status: 'error' });
            return '';
        }
    };

    // 💬 Custom Chat Message Submit
    const handleSendChatMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatThinking) return;

        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setIsChatThinking(true);

        const currentHistory = [...chatMessages, { sender: 'user', text: userMsg }];
        
        const aiReply = await generateWithAI('chat', userMsg, { history: currentHistory });
        
        if (aiReply) {
            setChatMessages(prev => [...prev, { sender: 'bot', text: aiReply }]);
        } else {
            setChatMessages(prev => [...prev, { sender: 'bot', text: 'Lo siento, he tenido un problema procesando tu mensaje. Revisa tu conexión.' }]);
        }
        setIsChatThinking(false);
    };

    // 📄 Custom Word Document Draft Generation
    const handleGenerateDoc = async () => {
        setIsDocGenerating(true);
        const result = await generateWithAI('word', docTitle);
        if (result) {
            setDocHtml(result);
            showToast({ message: '¡Documento redactado técnicamente al 100%!', status: 'success' });
        }
        setIsDocGenerating(false);
    };

    // 📊 Custom Excel Matrix Auto Fill
    const handleGenerateExcel = async () => {
        setIsExcelGenerating(true);
        const result = await generateWithAI('excel', excelTitle, { excelCols });
        if (result) {
            try {
                // Parse clean JSON output from IA
                let cleaned = result.trim();
                if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
                if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
                
                const rowsData = JSON.parse(cleaned.trim());
                if (Array.isArray(rowsData)) {
                    setExcelRows(rowsData);
                    showToast({ message: '¡Matriz ergonómica calculada y rellenada!', status: 'success' });
                } else {
                    throw new Error('Response is not a valid array');
                }
            } catch (e) {
                console.error('Failed to parse AI Excel output', e, result);
                showToast({ message: 'La IA no devolvió un JSON perfectamente estructurado. Reintenta.', status: 'error' });
            }
        }
        setIsExcelGenerating(false);
    };

    // 💻 Custom Slides Generation
    const handleGenerateSlides = async () => {
        setIsSlidesGenerating(true);
        const result = await generateWithAI('slides', slidesTopic);
        if (result) {
            try {
                let cleaned = result.trim();
                if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
                if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');

                const slidesData = JSON.parse(cleaned.trim());
                if (Array.isArray(slidesData) && slidesData.length > 0) {
                    setSlidesList(slidesData);
                    setActiveSlideIndex(0);
                    showToast({ message: '¡Capacitación estructurada en 5 diapositivas!', status: 'success' });
                }
            } catch (e) {
                showToast({ message: 'Error de análisis en diapositivas, por favor reintente.', status: 'error' });
            }
        }
        setIsSlidesGenerating(false);
    };

    // 🔌 Custom HTML UI Sandbox Generation
    const handleGenerateHtml = async () => {
        setIsHtmlGenerating(true);
        const result = await generateWithAI('html', htmlPrompt);
        if (result) {
            setHtmlContent(result);
            showToast({ message: '¡Prototipo Web interactivo renderizado!', status: 'success' });
        }
        setIsHtmlGenerating(false);
    };

    // 📱 WhatsApp Webhook Simulator
    const handleSendSimulatedWhatsApp = async () => {
        if (!simulatedIncomingMsg.trim() || isWhatsAppSimulating) return;
        const msg = simulatedIncomingMsg;
        setSimulatedIncomingMsg('');
        setIsWhatsAppSimulating(true);

        const newLogs = [
            ...whatsAppLogs,
            { time: new Date().toLocaleTimeString(), event: `Entrante: "${msg}" de Línea Directa Empleado`, type: 'in' as const }
        ];
        setWhatsAppLogs(newLogs);

        const aiReply = await generateWithAI('chat', `[MENSAJE WHATSAPP] ${msg}`, { history: [] });

        setWhatsAppLogs(prev => [
            ...prev,
            { time: new Date().toLocaleTimeString(), event: `IA Respuesta: "${aiReply}" enviada automáticamente a WhatsApp.`, type: 'out' as const }
        ]);
        setIsWhatsAppSimulating(false);
    };

    // ─── EXPORT UTILITIES ───
    const handleExportExcel = () => {
        if (!excelRows || excelRows.length === 0) {
            showToast({ message: 'No hay datos en la matriz para exportar.', status: 'warning' });
            return;
        }
        try {
            const worksheet = XLSX.utils.json_to_sheet(excelRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, excelTitle || 'Matriz');
            XLSX.writeFile(workbook, `${excelTitle}.xlsx`);
            showToast({ message: '¡Matriz exportada a Excel (.xlsx) con éxito!', status: 'success' });
        } catch (err: any) {
            console.error('Excel Export Failed:', err);
            showToast({ message: 'Error al exportar a Excel: ' + err.message, status: 'error' });
        }
    };

    const handleExportWord = () => {
        if (!docHtml || docHtml.includes('Presiona "Generar Documento con IA"')) {
            showToast({ message: 'No hay documento redactado para exportar.', status: 'warning' });
            return;
        }

        const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <title>\${docTitle}</title>
    <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #222; line-height: 1.6; }
        h2 { color: #059669; font-size: 16pt; font-weight: bold; border-bottom: 2px solid #059669; padding-bottom: 5px; margin-top: 20px; }
        h3 { color: #0d9488; font-size: 13pt; font-weight: bold; margin-top: 15px; }
        p { margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
        th { background-color: #059669; color: white; padding: 8px; font-weight: bold; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9fafb; }
    </style>
</head>
<body>
    <div style="max-width:100%; padding:0; margin:0;">
        <h1 style="color:#059669; text-align:center; font-size:22pt; font-weight:bold; margin-bottom:20px;">\${docTitle}</h1>
        \${docHtml}
    </div>
</body>
</html>`;

        const boundary = '----=_NextPart_000_0000_01D00000.00000000';
        const mhtml = [
            'MIME-Version: 1.0',
            `Content-Type: multipart/related; type="text/html"; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset="utf-8"',
            'Content-Transfer-Encoding: 8bit',
            'Content-Location: file:///document.htm',
            '',
            wordHtml,
            '',
            `--${boundary}--`,
        ].join('\r\n');

        const blob = new Blob([mhtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docTitle}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast({ message: '¡Documento exportado a Word (.doc) con éxito!', status: 'success' });
    };

    const handleExportHtmlFile = () => {
        if (!htmlContent || htmlContent.includes('Prototipo de Interfaz Web')) {
            showToast({ message: 'No hay prototipo web para exportar.', status: 'warning' });
            return;
        }
        const blob = new Blob([`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${htmlPrompt}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 min-h-screen p-8 flex items-center justify-center">
    <div class="w-full max-w-5xl bg-white shadow-xl rounded-3xl p-8 border border-slate-100">
        \${htmlContent}
    </div>
</body>
</html>`], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${htmlPrompt.replace(/\s+/g, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast({ message: '¡Prototipo Web (.html) descargado con éxito!', status: 'success' });
    };

    const handleExportAll = () => {
        let count = 0;
        if (activeApp?.blocks.some(b => b.type === 'word') && docHtml && !docHtml.includes('Presiona "Generar Documento con IA"')) {
            setTimeout(() => handleExportWord(), 100);
            count++;
        }
        if (activeApp?.blocks.some(b => b.type === 'excel') && excelRows && excelRows.length > 0) {
            setTimeout(() => handleExportExcel(), 300);
            count++;
        }
        if (activeApp?.blocks.some(b => b.type === 'html') && htmlContent && !htmlContent.includes('Prototipo de Interfaz Web')) {
            setTimeout(() => handleExportHtmlFile(), 500);
            count++;
        }
        if (count === 0) {
            showToast({ message: 'No hay contenidos generados en los módulos para exportar.', status: 'warning' });
        } else {
            showToast({ message: `¡Iniciando descarga consolidada de \${count} entregables!`, status: 'success' });
        }
    };

    // ─── INITIALIZE PLAY MODE PREVIEW ───
    const enterPlayMode = () => {
        if (!activeApp || activeApp.blocks.length === 0) {
            showToast({ message: 'Añade al menos un bloque para poder ejecutar el aplicativo.', status: 'warning' });
            return;
        }
        setPlayMode(true);
        // Default to first block's tab
        setActiveTab(activeApp.blocks[0].uid);
    };

    // ─── RENDERERS ───

    // SVG Gear Banner Animation Component
    const WappyEnginesSVG = () => (
        <svg className="w-40 h-40 text-green-500/80 dark:text-emerald-400/80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="wappyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
            </defs>
            {/* Ambient radiating rings */}
            <circle cx="100" cy="100" r="85" stroke="url(#wappyGrad)" strokeWidth="0.5" strokeDasharray="5 5" opacity="0.3">
                <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="40s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="100" r="70" stroke="url(#wappyGrad)" strokeWidth="1" strokeDasharray="10 5" opacity="0.4">
                <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="20s" repeatCount="indefinite" />
            </circle>

            {/* Gear 1: Central Large Gear */}
            <g transform="translate(100 100)">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="25s" repeatCount="indefinite" />
                <circle cx="0" cy="0" r="40" stroke="url(#wappyGrad)" strokeWidth="3" fill="none" />
                {[...Array(8)].map((_, i) => (
                    <rect key={i} x="-8" y="-48" width="16" height="16" rx="3" fill="url(#wappyGrad)" transform={`rotate(${i * 45})`} />
                ))}
                <circle cx="0" cy="0" r="20" stroke="url(#wappyGrad)" strokeWidth="1.5" fill="none" opacity="0.5" />
            </g>

            {/* Gear 2: Small Interlocking Gear (Top Right) */}
            <g transform="translate(145 60)">
                <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="12.5s" repeatCount="indefinite" />
                <circle cx="0" cy="0" r="20" stroke="url(#wappyGrad)" strokeWidth="2.5" fill="none" />
                {[...Array(6)].map((_, i) => (
                    <rect key={i} x="-5" y="-25" width="10" height="10" rx="2" fill="url(#wappyGrad)" transform={`rotate(${i * 60})`} />
                ))}
            </g>

            {/* Pulsing Central Node */}
            <circle cx="100" cy="100" r="6" fill="#06b6d4">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );

    // ─── VIEW 1: PORTFOLIO / LIST ───
    if (!isBuilding) {
        return (
            <div className="relative w-full flex flex-col gap-8 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500 bg-surface-primary rounded-[2.5rem] border border-border-medium/30 shadow-2xl overflow-hidden min-h-[80vh]">
                {/* Backlight ambient glows */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Hero Showcase Banner */}
                <div className="relative z-10 w-full rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-cyan-500/5 p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-inner overflow-hidden">
                    <div className="flex-1 flex flex-col gap-4 text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-black uppercase tracking-wider text-green-600 dark:text-green-400">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> WAPPY No-Code Engine
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent leading-none">
                            Creador de Aplicativos Inteligentes
                        </h2>
                        <p className="text-sm font-medium text-text-secondary leading-relaxed max-w-xl">
                            Diseña herramientas a la medida uniendo la potencia analítica de la Inteligencia Artificial con los cuatro lienzos interactivos de Canvas (documentos, matrices, diapositivas y código). ¡Ensambla y automatiza tus flujos de seguridad y salud en minutos!
                        </p>
                        <div className="mt-2">
                            <button 
                                onClick={handleNewApp} 
                                className="group relative flex items-center justify-center gap-3 px-6 py-3 font-extrabold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg hover:shadow-green-500/20 hover:scale-[1.03] outline-none active:scale-95"
                            >
                                <PlusCircle className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
                                <span className="tracking-wide">
                                    Nuevo Aplicativo Nativo
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-center">
                        <WappyEnginesSVG />
                    </div>
                </div>

                {/* Portfolio Section */}
                <div className="relative z-10 w-full flex flex-col gap-6">
                    <h3 className="text-xl font-black text-text-primary border-b border-border-medium/30 pb-3 flex items-center gap-2.5">
                        <Blocks className="w-6 h-6 text-green-500" />
                        Mis Aplicativos Creados
                    </h3>

                    {apps.length === 0 ? (
                        <div 
                            onClick={handleNewApp}
                            className="w-full min-h-[300px] border-2 border-dashed border-border-medium rounded-3xl bg-surface-secondary/20 flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:bg-surface-secondary/40 hover:border-green-500/50 transition-all duration-500"
                        >
                            <div className="bg-green-500/10 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-inner border border-green-500/20">
                                <Blocks className="w-10 h-10 text-green-600 dark:text-green-400 opacity-80" />
                            </div>
                            <h4 className="text-xl font-bold text-text-primary mb-2">Tu Bóveda de Aplicaciones está vacía</h4>
                            <p className="text-text-secondary text-sm max-w-md mb-6 leading-relaxed">
                                Aún no has ensamblado ninguna herramienta. Haz clic aquí para abrir el lienzo de diseño e inyectar el alma de IA en tu primer aplicativo.
                            </p>
                            <div className="px-6 py-2.5 bg-green-500/20 text-green-600 dark:text-green-400 font-extrabold text-xs uppercase tracking-widest rounded-full border border-green-500/30 group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm">
                                Iniciar Ensamblaje
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {apps.map(app => (
                                <div 
                                    key={app.id} 
                                    onClick={() => handleSelectApp(app)}
                                    className="group rounded-3xl border border-border-medium/40 bg-surface-primary/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1 cursor-pointer flex flex-col gap-4 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-green-500/5 rounded-full blur-xl group-hover:bg-green-500/10 transition-all pointer-events-none" />
                                    
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="p-3 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-2xl border border-green-500/15">
                                            <Blocks className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => handleDeleteApp(app.id, e)} 
                                                className="p-2 rounded-xl border border-red-500/10 hover:border-red-500 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-colors shadow-sm bg-surface-primary"
                                                title="Eliminar de la Bóveda"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 text-left">
                                        <h4 className="font-extrabold text-lg text-text-primary group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors truncate">
                                            {app.title}
                                        </h4>
                                        <p className="text-text-secondary text-xs mt-2 line-clamp-3 leading-relaxed font-medium">
                                            {app.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-border-medium/30 text-xs">
                                        <span className="font-black text-text-tertiary">
                                            Bloques: {app.blocks?.length || 0}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-extrabold uppercase tracking-wide text-[9px] border border-emerald-500/10">
                                            {app.status === 'published' ? 'Publicado' : 'Borrador'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── VIEW 2: RUNNER / PLAY MODE ───
    if (playMode && activeApp) {
        const activeBlock = activeApp.blocks.find(b => b.uid === activeTab);

        return (
            <div className="relative w-full flex flex-col gap-6 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500 bg-surface-primary rounded-[2.5rem] border border-border-medium/30 shadow-2xl overflow-hidden min-h-[85vh]">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Play Header */}
                <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-medium/30 pb-4">
                    <div className="text-left">
                        <button 
                            onClick={() => setPlayMode(false)}
                            className="flex items-center gap-2 text-xs font-extrabold text-green-600 hover:text-green-500 transition-colors uppercase tracking-wider mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver al Lienzo
                        </button>
                        <h2 className="text-2xl font-black text-text-primary flex items-center gap-2">
                            <Play className="w-6 h-6 text-green-500 fill-green-500" />
                            {activeApp.title} <span className="text-xs px-2.5 py-1 bg-green-500/20 text-green-600 rounded-full font-bold">Modo Ejecución</span>
                        </h2>
                        <p className="text-xs font-semibold text-text-secondary mt-1 max-w-xl">{activeApp.description}</p>
                    </div>

                    <div className="flex items-center gap-3 relative" ref={exportDropdownRef}>
                        <button
                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface-primary hover:bg-surface-hover text-green-600 border border-green-500/20 rounded-xl shadow-md hover:scale-[1.02] outline-none transition-all font-extrabold text-sm"
                        >
                            <Download className="w-4 h-4" /> Exportar Entregables
                        </button>
                        
                        {isExportDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-surface-primary border border-border-medium/40 rounded-2xl shadow-xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex flex-col gap-1">
                                    <h5 className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70 px-3 py-1.5 border-b border-border-medium/20 mb-1">Formatos de Descarga</h5>
                                    
                                    {activeApp.blocks.some(b => b.type === 'word') && (
                                        <button
                                            onClick={() => { handleExportWord(); setIsExportDropdownOpen(false); }}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-green-500/5 text-text-primary hover:text-green-600 rounded-xl text-left transition-colors font-bold text-xs"
                                        >
                                            <FileText className="w-4 h-4 text-green-500" />
                                            <span>Descargar Documento (.doc)</span>
                                        </button>
                                    )}

                                    {activeApp.blocks.some(b => b.type === 'excel') && (
                                        <button
                                            onClick={() => { handleExportExcel(); setIsExportDropdownOpen(false); }}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-green-500/5 text-text-primary hover:text-green-600 rounded-xl text-left transition-colors font-bold text-xs"
                                        >
                                            <Table className="w-4 h-4 text-teal-500" />
                                            <span>Descargar Matriz Excel (.xlsx)</span>
                                        </button>
                                    )}

                                    {activeApp.blocks.some(b => b.type === 'html') && (
                                        <button
                                            onClick={() => { handleExportHtmlFile(); setIsExportDropdownOpen(false); }}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-green-500/5 text-text-primary hover:text-green-600 rounded-xl text-left transition-colors font-bold text-xs"
                                        >
                                            <Code className="w-4 h-4 text-emerald-600" />
                                            <span>Descargar Prototipo Web (.html)</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => { handleExportAll(); setIsExportDropdownOpen(false); }}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-green-500/10 to-cyan-500/10 hover:from-green-500 hover:to-cyan-600 text-green-600 hover:text-white rounded-xl text-left transition-all font-black text-xs border border-green-500/10 mt-1"
                                    >
                                        <Sparkles className="w-4 h-4 animate-pulse" />
                                        <span>Exportación Consolidada (Todo)</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => setPlayMode(false)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-green-500/10 hover:scale-[1.02] outline-none transition-all"
                        >
                            <Edit className="w-4 h-4" /> Modificar Módulos
                        </button>
                    </div>
                </div>

                {/* Tabs Selector */}
                <div className="relative z-10 flex gap-2 overflow-x-auto pb-2 border-b border-border-medium/20">
                    {activeApp.blocks.map(block => {
                        const isTabActive = activeTab === block.uid;
                        const blockDef = AVAILABLE_BLOCKS.find(b => b.id === block.type);
                        const Icon = blockDef?.icon || MessageSquare;

                        return (
                            <button
                                key={block.uid}
                                onClick={() => setActiveTab(block.uid)}
                                className={cn(
                                    "flex items-center gap-2.5 px-5 py-3 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all duration-300 border",
                                    isTabActive 
                                        ? "bg-green-500 text-white border-green-500 shadow-md shadow-green-500/10" 
                                        : "bg-surface-secondary text-text-primary border-border-medium/30 hover:bg-surface-hover hover:border-green-500/20"
                                )}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {block.name}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Frame / Runner Canvas */}
                <div className="relative z-10 flex-1 bg-surface-secondary/20 border border-border-medium/30 rounded-3xl p-6 shadow-inner flex flex-col min-h-[500px]">
                    {activeBlock?.type === 'chat' && (
                        <div className="flex-1 flex flex-col bg-surface-primary border border-border-medium/40 rounded-2xl overflow-hidden h-[60vh] max-w-4xl mx-auto w-full shadow-lg relative">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border-medium/30 bg-surface-secondary/40 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-green-500/10 rounded-xl border border-green-500/20 flex items-center justify-center text-green-500">
                                        <Bot className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-text-primary">{activeBlock.name}</h4>
                                        <span className="text-[10px] text-green-500 font-extrabold tracking-wide uppercase">Asesor Activo</span>
                                    </div>
                                </div>
                                <div className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                                {chatMessages.map((msg, i) => (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "flex gap-3 max-w-[80%] rounded-2xl p-4 text-sm font-medium leading-relaxed text-left",
                                            msg.sender === 'user'
                                                ? "self-end bg-green-500 text-white rounded-tr-none shadow-sm"
                                                : "self-start bg-surface-secondary text-text-primary rounded-tl-none border border-border-medium/30 shadow-sm"
                                        )}
                                    >
                                        <div className="shrink-0 pt-0.5">
                                            {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                ))}

                                {isChatThinking && (
                                    <div className="self-start bg-surface-secondary text-text-primary rounded-2xl rounded-tl-none p-4 text-sm font-medium border border-border-medium/30 shadow-sm flex items-center gap-3">
                                        <RefreshCw className="w-4 h-4 animate-spin text-green-500" />
                                        <span className="text-text-secondary text-xs font-semibold">Generando respuesta con el Alma de tu IA...</span>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-border-medium/30 bg-surface-secondary/40 flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Envía una consulta a tu IA a medida..."
                                    className="flex-1 bg-surface-primary border border-border-medium/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors placeholder:font-medium placeholder:text-text-secondary/60 text-text-primary"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!chatInput.trim() || isChatThinking}
                                    className="p-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl shadow-md transition-colors flex items-center justify-center shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    )}

                    {activeBlock?.type === 'word' && (
                        <div className="flex-1 flex flex-col gap-4 max-w-5xl w-full mx-auto text-left">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-medium/20 pb-3">
                                <div>
                                    <h4 className="text-lg font-black text-text-primary">Lienzo Documento (Word)</h4>
                                    <p className="text-xs text-text-secondary mt-1">Escribe, edita e instruye a la IA para estructurar actas u directrices de seguridad.</p>
                                </div>
                                <button
                                    onClick={handleGenerateDoc}
                                    disabled={isDocGenerating}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:scale-[1.02] outline-none transition-all disabled:opacity-50"
                                >
                                    {isDocGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
                                    Generar Documento con IA
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-text-primary tracking-wide uppercase">Título del Documento</label>
                                <input
                                    type="text"
                                    value={docTitle}
                                    onChange={(e) => setDocTitle(e.target.value)}
                                    className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-green-500 text-text-primary"
                                />
                            </div>

                            {/* HTML editor body */}
                            <div className="flex-1 min-h-[400px] border border-border-medium/40 rounded-2xl bg-surface-primary p-6 shadow-sm overflow-y-auto">
                                {isDocGenerating ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-20">
                                        <WappyEnginesSVG />
                                        <h5 className="font-bold text-text-primary text-lg">Redactando documento técnico con IA...</h5>
                                        <p className="text-xs text-text-secondary max-w-sm">Cruza la información de tu empresa, los riesgos y el Alma de IA para dar forma al archivo.</p>
                                    </div>
                                ) : (
                                    <div 
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => setDocHtml(e.currentTarget.innerHTML)}
                                        dangerouslySetInnerHTML={{ __html: docHtml }}
                                        className="outline-none min-h-[350px] font-sans text-sm leading-relaxed text-text-primary"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {activeBlock?.type === 'excel' && (
                        <div className="flex-1 flex flex-col gap-4 max-w-6xl w-full mx-auto text-left overflow-x-auto">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-medium/20 pb-3">
                                <div>
                                    <h4 className="text-lg font-black text-text-primary">Lienzo Hoja de Cálculo (Excel)</h4>
                                    <p className="text-xs text-text-secondary mt-1">Una matriz ergonómica totalmente interactiva y maquetada con auto-rellenado de IA.</p>
                                </div>
                                <button
                                    onClick={handleGenerateExcel}
                                    disabled={isExcelGenerating}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:scale-[1.02] outline-none transition-all disabled:opacity-50"
                                >
                                    {isExcelGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
                                    Autorellenar Matriz con IA
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-text-primary tracking-wide uppercase">Título de la Matriz</label>
                                    <input
                                        type="text"
                                        value={excelTitle}
                                        onChange={(e) => setExcelTitle(e.target.value)}
                                        className="bg-surface-primary border border-border-medium/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500 text-text-primary"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-text-primary tracking-wide uppercase">Columnas (separadas por comas)</label>
                                    <input
                                        type="text"
                                        value={excelCols.join(', ')}
                                        onChange={(e) => setExcelCols(e.target.value.split(',').map(s => s.trim()))}
                                        className="bg-surface-primary border border-border-medium/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500 text-text-primary"
                                    />
                                </div>
                            </div>

                            {/* SpreadSheet table view */}
                            <div className="border border-border-medium/40 rounded-2xl bg-surface-primary shadow-sm overflow-hidden min-w-[700px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-secondary border-b border-border-medium/30">
                                            {excelCols.map((col, idx) => (
                                                <th key={idx} className="p-3 text-xs font-black text-text-primary uppercase tracking-wider">{col}</th>
                                            ))}
                                            <th className="p-3 text-xs font-black text-text-primary uppercase tracking-wider w-16">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {excelRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={excelCols.length + 1} className="p-8 text-center text-text-secondary text-sm font-semibold">
                                                    No hay filas añadidas en la hoja. Haz clic en "Añadir Fila" o "Autorellenar con IA".
                                                </td>
                                            </tr>
                                        ) : (
                                            excelRows.map((row, rowIdx) => (
                                                <tr key={rowIdx} className="border-b border-border-medium/20 hover:bg-surface-secondary/20 transition-colors">
                                                    {excelCols.map((col, colIdx) => (
                                                        <td key={colIdx} className="p-2.5">
                                                            <input
                                                                type="text"
                                                                value={row[col] || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...excelRows];
                                                                    updated[rowIdx][col] = e.target.value;
                                                                    setExcelRows(updated);
                                                                }}
                                                                className="w-full bg-transparent border-0 outline-none p-1 text-sm text-text-primary focus:bg-surface-secondary rounded"
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="p-2.5 text-center">
                                                        <button 
                                                            onClick={() => setExcelRows(excelRows.filter((_, i) => i !== rowIdx))}
                                                            className="p-1.5 rounded-lg border border-red-500/10 hover:border-red-500 hover:bg-red-500/10 text-red-500 transition-all"
                                                        >
                                                            <Trash className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const newRow: Record<string, string> = {};
                                        excelCols.forEach(col => newRow[col] = '');
                                        setExcelRows([...excelRows, newRow]);
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 border border-green-500/20 text-green-600 hover:bg-green-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Añadir Fila
                                </button>
                                <button
                                    onClick={() => setExcelRows([])}
                                    className="flex items-center gap-1.5 px-4 py-2 border border-red-500/20 text-red-600 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Vaciar Hoja
                                </button>
                            </div>
                        </div>
                    )}

                    {activeBlock?.type === 'slides' && (
                        <div className="flex-1 flex flex-col gap-4 max-w-4xl w-full mx-auto text-left">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-medium/20 pb-3">
                                <div>
                                    <h4 className="text-lg font-black text-text-primary">Lienzo Diapositivas (Slides)</h4>
                                    <p className="text-xs text-text-secondary mt-1 font-medium">Capacitación y educación interactiva para tu equipo con apoyo de IA.</p>
                                </div>
                                <button
                                    onClick={handleGenerateSlides}
                                    disabled={isSlidesGenerating}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:scale-[1.02] outline-none transition-all disabled:opacity-50"
                                >
                                    {isSlidesGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
                                    Diseñar Presentación con IA
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-text-primary tracking-wide uppercase">Tema de Capacitación</label>
                                <input
                                    type="text"
                                    value={slidesTopic}
                                    onChange={(e) => setSlidesTopic(e.target.value)}
                                    className="bg-surface-primary border border-border-medium/40 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-green-500 text-text-primary"
                                />
                            </div>

                            {/* Slide Carousel Layout */}
                            {isSlidesGenerating ? (
                                <div className="border border-border-medium/40 rounded-3xl bg-surface-primary p-12 text-center flex flex-col items-center justify-center gap-4 py-20 min-h-[300px]">
                                    <WappyEnginesSVG />
                                    <h5 className="font-bold text-text-primary">Estructurando 5 Láminas Ergonómicas con IA...</h5>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col gap-6">
                                    {/* Slide display card */}
                                    <div className="flex-1 min-h-[250px] border border-border-medium/40 bg-gradient-to-br from-green-500/5 to-cyan-500/5 rounded-3xl p-8 flex flex-col justify-center text-center shadow-sm relative overflow-hidden">
                                        <div className="absolute top-4 left-6 text-xs font-extrabold text-text-secondary/60 uppercase tracking-widest">
                                            Diapositiva {activeSlideIndex + 1} de {slidesList.length}
                                        </div>
                                        <h3 className="text-2xl font-black text-text-primary mb-4 bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent">
                                            {slidesList[activeSlideIndex]?.title || 'Diapositiva'}
                                        </h3>
                                        <p className="text-sm font-semibold text-text-secondary max-w-2xl mx-auto leading-relaxed">
                                            {slidesList[activeSlideIndex]?.content || 'Sin contenido en esta lámina.'}
                                        </p>
                                    </div>

                                    {/* Carousel navigation controls */}
                                    <div className="flex justify-between items-center bg-surface-primary border border-border-medium/40 px-6 py-3 rounded-2xl">
                                        <button
                                            onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                                            disabled={activeSlideIndex === 0}
                                            className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5" /> Anterior
                                        </button>
                                        <div className="flex gap-2.5">
                                            {slidesList.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveSlideIndex(idx)}
                                                    className={cn(
                                                        "w-3 h-3 rounded-full transition-all",
                                                        idx === activeSlideIndex ? "bg-green-500 scale-110" : "bg-border-medium/40"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setActiveSlideIndex(prev => Math.min(slidesList.length - 1, prev + 1))}
                                            disabled={activeSlideIndex === slidesList.length - 1}
                                            className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                        >
                                            Siguiente <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeBlock?.type === 'html' && (
                        <div className="flex-1 flex flex-col gap-4 max-w-5xl w-full mx-auto text-left">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-medium/20 pb-3">
                                <div>
                                    <h4 className="text-lg font-black text-text-primary">Lienzo Prototipo Web (HTML/Code)</h4>
                                    <p className="text-xs text-text-secondary mt-1 font-medium">Diseña dashboards interactivos e interfaces HTML completas con soporte IA en vivo.</p>
                                </div>
                                <button
                                    onClick={handleGenerateHtml}
                                    disabled={isHtmlGenerating}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:scale-[1.02] outline-none transition-all disabled:opacity-50"
                                >
                                    {isHtmlGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
                                    Prototipar con IA
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-text-primary tracking-wide uppercase">Instrucciones del Prototipo</label>
                                <input
                                    type="text"
                                    value={htmlPrompt}
                                    onChange={(e) => setHtmlPrompt(e.target.value)}
                                    className="bg-surface-primary border border-border-medium/40 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-green-500 text-text-primary"
                                />
                            </div>

                            {/* Rendered Sandbox Iframe */}
                            {isHtmlGenerating ? (
                                <div className="border border-border-medium/40 rounded-3xl bg-surface-primary p-12 text-center flex flex-col items-center justify-center gap-4 py-20 min-h-[300px]">
                                    <WappyEnginesSVG />
                                    <h5 className="font-bold text-text-primary">Escribiendo código HTML y maquetando interfaz...</h5>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="text-xs font-black text-text-primary tracking-wide uppercase">Código HTML Generado</label>
                                        <textarea
                                            value={htmlContent}
                                            onChange={(e) => setHtmlContent(e.target.value)}
                                            className="w-full flex-1 min-h-[250px] font-mono text-xs p-4 bg-[#1a1a1a] text-emerald-400 border border-border-medium/30 rounded-2xl focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="text-xs font-black text-text-primary tracking-wide uppercase">Vista Previa Interactiva</label>
                                        <iframe
                                            title="Canvas Live HTML Sandbox"
                                            srcDoc={`<html><head><script src="https://cdn.tailwindcss.com"></script></head><body style="margin:0; padding:15px; font-family:sans-serif; background:#fafafa;">${htmlContent}</body></html>`}
                                            className="w-full flex-1 min-h-[250px] bg-white border border-border-medium/40 rounded-2xl shadow-inner"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeBlock?.type === 'whatsapp' && (
                        <div className="flex-1 flex flex-col md:flex-row gap-8 max-w-5xl w-full mx-auto text-left">
                            {/* WhatsApp Linking Mock */}
                            <div className="flex-1 rounded-3xl border border-border-medium/40 bg-surface-primary p-6 shadow-sm flex flex-col gap-5 justify-between">
                                <div>
                                    <h4 className="text-lg font-black text-text-primary">Configuración de Línea WAPPY</h4>
                                    <p className="text-xs text-text-secondary mt-1 font-medium">Vincula tu número de WhatsApp para automatizar notificaciones.</p>
                                </div>

                                <div className="border border-border-medium/30 rounded-2xl bg-surface-secondary/40 p-4 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
                                    {isWhatsAppLinked ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <CheckCircle className="w-12 h-12 text-green-500 fill-green-500/10" />
                                            <h5 className="font-extrabold text-text-primary">Dispositivo Vinculado Exitosamente</h5>
                                            <span className="text-xs bg-green-500/15 border border-green-500/25 px-3 py-1 text-green-600 rounded-full font-bold">Línea Activa: {whatsAppNumber}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-white rounded-xl shadow-md border border-border-medium/20">
                                                {/* QR code mock in SVG */}
                                                <svg className="w-32 h-32 text-text-primary" viewBox="0 0 100 100" fill="currentColor">
                                                    <path d="M5 5h30v30H5V5zm3 3v24h24V8H8zm2 2h20v20H10V10zM5 65h30v30H5V65zm3 3v24h24V68H8zm2 2h20v20H10V70zM65 5h30v30H65V5zm3 3v24h24V8H68zm2 2h20v20H70V10z" />
                                                    <path d="M45 15h10v10H45v-10zm0 30h10v10H45v-10zm15 0h10v10H60v-10zm15 0h10v10H75v-10zm-30 15h10v10H45v-10zm15 0h10v10H60v-10zm15 0h10v10H75v-10z" />
                                                </svg>
                                            </div>
                                            <p className="text-xs text-text-secondary max-w-xs">Escanea este código QR con la cámara de tu teléfono móvil o el WhatsApp corporativo.</p>
                                            <button
                                                onClick={() => {
                                                    setIsWhatsAppLinked(true);
                                                    setWhatsAppLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), event: 'Línea telefónica vinculada con QR', type: 'sys' }]);
                                                }}
                                                className="px-4 py-2 bg-green-500 text-white font-extrabold text-xs rounded-xl shadow-md"
                                            >
                                                Simular Escaneo QR
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-text-primary tracking-wide uppercase">Número de Destinatario de Pruebas</label>
                                    <input
                                        type="text"
                                        value={whatsAppNumber}
                                        onChange={(e) => setWhatsAppNumber(e.target.value)}
                                        className="bg-surface-primary border border-border-medium/40 rounded-xl px-4 py-2 text-sm text-text-primary"
                                    />
                                </div>
                            </div>

                            {/* WhatsApp Log simulator */}
                            <div className="flex-1 rounded-3xl border border-border-medium/40 bg-surface-primary p-6 shadow-sm flex flex-col gap-4">
                                <h4 className="text-lg font-black text-text-primary">Consola de Webhooks WAPPY</h4>
                                
                                <div className="flex-1 bg-[#151515] text-[#22c55e] font-mono text-xs rounded-2xl p-4 min-h-[250px] overflow-y-auto space-y-2 text-left border border-border-medium/10">
                                    {whatsAppLogs.map((log, idx) => (
                                        <div key={idx} className={cn(
                                            "flex items-start gap-2",
                                            log.type === 'in' ? 'text-amber-500' : log.type === 'out' ? 'text-green-400' : 'text-blue-400'
                                        )}>
                                            <span className="text-opacity-50 text-text-tertiary">[{log.time}]</span>
                                            <span>{log.event}</span>
                                        </div>
                                    ))}
                                    {isWhatsAppSimulating && (
                                        <div className="text-xs text-text-secondary animate-pulse">Procesando respuesta con la IA del app...</div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={simulatedIncomingMsg}
                                        onChange={(e) => setSimulatedIncomingMsg(e.target.value)}
                                        placeholder="Simula un mensaje de un trabajador (ej: envíame mi rutina)..."
                                        className="flex-1 bg-surface-secondary border border-border-medium/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500 text-text-primary"
                                    />
                                    <button
                                        onClick={handleSendSimulatedWhatsApp}
                                        disabled={!simulatedIncomingMsg.trim() || isWhatsAppSimulating}
                                        className="px-4 py-2 bg-green-500 disabled:opacity-50 text-white rounded-xl shadow-md font-bold text-xs flex items-center justify-center shrink-0"
                                    >
                                        Enviar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── VIEW 3: CANVAS BUILD MODE ───
    return (
        <div className="relative w-full flex flex-col lg:flex-row gap-6 p-6 md:p-8 animate-in fade-in duration-500 bg-surface-primary rounded-[2.5rem] border border-border-medium/30 shadow-2xl min-h-[85vh]">
            {/* Ambient backlight glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Sidebar: Bloques Disponibles */}
            <div className="w-full lg:w-80 shrink-0 bg-surface-primary border border-border-medium/40 rounded-[2rem] shadow-xl flex flex-col overflow-hidden relative z-10">
                <div className="p-5 border-b border-border-medium/30 bg-surface-secondary/40 text-left">
                    <button 
                        onClick={() => setIsBuilding(false)} 
                        className="flex items-center gap-2 text-green-600 hover:text-green-500 transition-colors text-xs font-black uppercase tracking-wider mb-4"
                    >
                        <ArrowLeft className="w-4.5 h-4.5" /> Volver al Portafolio
                    </button>
                    <h3 className="text-xl font-black text-text-primary">Módulos WAPPY</h3>
                    <p className="text-xs text-text-secondary mt-1 font-semibold">Haz clic para añadir un bloque al lienzo de tu aplicativo.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-left">
                    {AVAILABLE_BLOCKS.map(block => (
                        <button
                            key={block.id}
                            onClick={() => addBlock(block)}
                            className="w-full flex items-start gap-3.5 p-4 rounded-2xl border border-border-medium/40 hover:border-green-500/40 hover:bg-surface-secondary/50 hover:shadow-sm transition-all group"
                        >
                            <div className={cn("p-2.5 rounded-xl transition-all group-hover:scale-105 shrink-0 border", block.color)}>
                                <block.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 flex flex-col gap-0.5">
                                <span className="font-extrabold text-sm text-text-primary group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors flex items-center justify-between">
                                    {block.name}
                                    <Plus className="w-4 h-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                                <span className="text-[11px] text-text-secondary leading-snug font-medium">{block.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 bg-surface-secondary/25 border border-border-medium/40 rounded-[2rem] shadow-inner flex flex-col overflow-hidden relative z-10">
                {/* Canvas Top Bar */}
                <div className="h-20 border-b border-border-medium/30 bg-surface-primary/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-3 text-left">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={titleInput}
                                    onChange={(e) => setTitleInput(e.target.value)}
                                    onBlur={() => setIsEditingTitle(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                                    className="bg-surface-secondary border border-green-500 rounded-xl px-3 py-1 font-bold text-text-primary outline-none"
                                    autoFocus
                                />
                                <button onClick={() => setIsEditingTitle(false)} className="p-1 text-green-500"><Check className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <h2 
                                onClick={() => setIsEditingTitle(true)}
                                className="font-extrabold text-text-primary text-xl hover:text-green-600 cursor-pointer flex items-center gap-2 group transition-colors"
                            >
                                {titleInput || 'Aplicativo Sin Título'}
                                <Edit className="w-4 h-4 opacity-0 group-hover:opacity-100 text-text-tertiary transition-opacity" />
                            </h2>
                        )}
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] uppercase font-black tracking-widest">
                            Borrador
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={enterPlayMode}
                            className="bg-surface-primary hover:bg-surface-hover text-green-600 border border-green-500/20 rounded-xl px-5 py-2.5 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-sm transition-all hover:scale-[1.02]"
                        >
                            <Play className="w-4 h-4 text-green-500 fill-green-500" />
                            Ejecutar Aplicación
                        </button>
                        <button
                            onClick={handleSaveApp}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl px-5 py-2.5 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-lg shadow-green-500/10 transition-all hover:scale-[1.02]"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* Canvas Configuration & Blocks List */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-left">
                    {/* IA Mind Block (System Prompt) */}
                    <div className="relative rounded-3xl border border-green-500/20 bg-surface-primary/80 p-6 shadow-sm backdrop-blur-md overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-2xl border border-green-500/15 text-green-600 shrink-0">
                                    <Bot className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-base text-text-primary">Alma de IA / System Instructions</h4>
                                    <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed font-semibold">Configura las directrices analíticas y la personalidad que heredarán los agentes y redactores de tu app.</p>
                                </div>
                            </div>
                            
                            {/* SVG animated thinking bulb icon */}
                            <div className="shrink-0">
                                <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
                                    <path d="M9 18h6M10 22h4" />
                                    <circle cx="12" cy="8" r="1.5" fill="currentColor">
                                        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
                                    </circle>
                                </svg>
                            </div>
                        </div>

                        <textarea
                            value={activeApp.systemPrompt}
                            onChange={(e) => {
                                if (activeApp) {
                                    setActiveApp({ ...activeApp, systemPrompt: e.target.value });
                                }
                            }}
                            placeholder="Introduce el rol, personalidad y reglas analíticas que debe seguir el motor de Inteligencia Artificial..."
                            rows={3}
                            className="w-full bg-surface-secondary/40 border border-border-medium/30 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-green-500 transition-colors resize-none leading-relaxed text-text-primary"
                        />
                    </div>

                    {/* Canvas Blocks stack */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-wider text-text-secondary/70 flex items-center gap-2">
                            <Blocks className="w-4 h-4 text-green-500" /> Lienzo de Módulos Activos
                        </h4>

                        {activeApp.blocks.length === 0 ? (
                            <div className="border-2 border-dashed border-border-medium/40 rounded-3xl p-12 text-center opacity-60">
                                <Blocks className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                                <h5 className="font-bold text-text-primary text-base">Tu lienzo de aplicativo está vacío</h5>
                                <p className="text-xs text-text-secondary mt-1">Selecciona módulos del catálogo del panel izquierdo para empezar a componer la herramienta.</p>
                            </div>
                        ) : (
                            activeApp.blocks.map((block, index) => {
                                const blockDef = AVAILABLE_BLOCKS.find(b => b.type === block.type);
                                const Icon = blockDef?.icon || Blocks;

                                return (
                                    <div key={block.uid} className="group rounded-3xl border border-border-medium/40 bg-surface-primary p-5 shadow-sm hover:shadow-md transition-all relative">
                                        {/* Block Toolbar */}
                                        <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <button 
                                                onClick={() => moveBlock(index, 'up')}
                                                disabled={index === 0}
                                                className="p-2 bg-surface-secondary border border-border-medium/30 rounded-xl hover:text-green-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                                title="Subir Bloque"
                                            >
                                                <ChevronLeft className="w-4 h-4 rotate-90" />
                                            </button>
                                            <button 
                                                onClick={() => moveBlock(index, 'down')}
                                                disabled={index === activeApp.blocks.length - 1}
                                                className="p-2 bg-surface-secondary border border-border-medium/30 rounded-xl hover:text-green-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                                title="Bajar Bloque"
                                            >
                                                <ChevronLeft className="w-4 h-4 -rotate-90" />
                                            </button>
                                            <button 
                                                onClick={() => removeBlock(block.uid)}
                                                className="p-2 bg-surface-secondary border border-red-500/10 hover:border-red-500 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                                                title="Remover Bloque"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Block Header Info */}
                                        <div className="flex items-start gap-3.5 text-left mb-4">
                                            <div className="p-3 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-2xl border border-green-500/15 text-green-600 shrink-0">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-extrabold text-sm text-text-primary">{block.name}</span>
                                                <span className="text-[10px] bg-green-500/10 text-green-600 font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full border border-green-500/10 self-start mt-1">MÓDULO {block.type.toUpperCase()}</span>
                                            </div>
                                        </div>

                                        {/* Block Config Forms */}
                                        <div className="pt-3 border-t border-border-medium/20 text-xs text-text-secondary">
                                            {block.type === 'chat' && (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-text-primary">Mensaje de Bienvenida del Asesor IA</label>
                                                    <input 
                                                        type="text" 
                                                        value={block.config?.greeting || '¡Hola! ¿En qué puedo colaborar en tus pausas activas o ergonómicas hoy?'}
                                                        onChange={(e) => {
                                                            const updated = activeApp.blocks.map(b => b.uid === block.uid ? { ...b, config: { ...b.config, greeting: e.target.value } } : b);
                                                            setActiveApp({ ...activeApp, blocks: updated });
                                                        }}
                                                        className="w-full bg-surface-secondary border border-border-medium/40 rounded-xl px-4 py-2.5 focus:outline-none text-text-primary text-xs"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'word' && (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-text-primary">Estructura del Documento Predefinido</label>
                                                    <input 
                                                        type="text" 
                                                        value={docTitle}
                                                        onChange={(e) => setDocTitle(e.target.value)}
                                                        className="w-full bg-surface-secondary border border-border-medium/40 rounded-xl px-4 py-2.5 focus:outline-none text-text-primary text-xs"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'excel' && (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-text-primary">Columnas de Matriz Excel (Personalizar)</label>
                                                    <input 
                                                        type="text" 
                                                        value={excelCols.join(', ')}
                                                        onChange={(e) => setExcelCols(e.target.value.split(',').map(s => s.trim()))}
                                                        className="w-full bg-surface-secondary border border-border-medium/40 rounded-xl px-4 py-2.5 focus:outline-none text-text-primary text-xs"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'slides' && (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-text-primary">Tema de la Capacitación de Diapositivas</label>
                                                    <input 
                                                        type="text" 
                                                        value={slidesTopic}
                                                        onChange={(e) => setSlidesTopic(e.target.value)}
                                                        className="w-full bg-surface-secondary border border-border-medium/40 rounded-xl px-4 py-2.5 focus:outline-none text-text-primary text-xs"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'html' && (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-text-primary">Objetivo del Prototipo HTML / Dashboard</label>
                                                    <input 
                                                        type="text" 
                                                        value={htmlPrompt}
                                                        onChange={(e) => setHtmlPrompt(e.target.value)}
                                                        className="w-full bg-surface-secondary border border-border-medium/40 rounded-xl px-4 py-2.5 focus:outline-none text-text-primary text-xs"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'whatsapp' && (
                                                <div className="p-3.5 bg-surface-secondary/40 border border-border-medium/20 rounded-2xl flex items-center justify-between gap-3 text-left">
                                                    <div>
                                                        <span className="font-extrabold text-text-primary text-xs">Simulador de Vinculación de Línea</span>
                                                        <p className="text-[10px] text-text-secondary leading-snug mt-0.5">En modo ejecución tendrás una consola para recibir alertas de pausas activas o reportar actos.</p>
                                                    </div>
                                                    <Smartphone className="w-5 h-5 text-green-500 shrink-0 animate-bounce" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
