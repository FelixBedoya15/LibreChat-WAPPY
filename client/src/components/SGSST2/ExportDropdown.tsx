import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Download, Globe, FileText, FileDown, ChevronDown, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks/AuthContext';

interface ExportDropdownProps {
    content: string;
    fileName: string;
    reportType?: 'checklist' | 'general';
    onExportExcel?: () => void;
}

/**
 * Shared Export Dropdown for SGSST modules.
 * Provides HTML, Word, and PDF export options in a single dropdown button.
 * Preserves full HTML styling (tables, colors, formatting) in all formats.
 */
const ExportDropdown: React.FC<ExportDropdownProps> = ({ content, fileName, reportType = 'general', onExportExcel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToastContext();
    const { token } = useAuthContext();

    const calcPos = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!buttonRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
                setIsOpen(false);
            }
        };
        const handleScroll = () => calcPos();
        const handleResize = () => calcPos();
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    /**
     * Build a full HTML document with inline styles for browser/HTML export.
     */
    const buildFullHtml = (): string => {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <style>
        @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .report-wrapper { padding: 0; width: 100%; border: none !important; box-shadow: none !important; }
            @page { margin: 1.5cm; size: A4; }
            table { page-break-inside: avoid; }
            h1, h2, h3 { page-break-after: avoid; }
        }
        html, body {
            margin: 0;
            padding: 0;
            background: #fff !important;
            color: #222;
        }
        body {
            font-family: 'Segoe UI', Arial, Roboto, sans-serif;
            line-height: 1.6;
            min-height: 100vh;
        }
        .report-wrapper {
            max-width: 950px;
            margin: 0 auto;
            padding: 40px 30px;
            background: #fff;
            box-sizing: border-box;
        }
        @media screen and (max-width: 600px) {
            .report-wrapper { padding: 15px 10px; }
        }
        h1 { color: #004d99; text-align: center; margin-bottom: 5px; font-size: 1.8em; }
        h2 { color: #004d99; border-bottom: 2px solid #004d99; padding-bottom: 5px; font-size: 1.4em; }
        h3 { color: #333; font-size: 1.2em; }
        table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            margin: 15px 0;
            font-size: 0.9em;
            table-layout: auto;
        }
        .table-responsive {
            width: 100%;
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #ddd;
            margin: 15px 0;
            -webkit-overflow-scrolling: touch;
        }
        @media screen and (max-width: 600px) {
            table { min-width: 600px; }
        }
        th {
            background-color: #004d99;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #003580;
        }
        .checklist-mode th:nth-child(1) { width: 38px; }
        .checklist-mode th:nth-child(2) { width: 14%; }
        .checklist-mode th:nth-child(3) { width: 44%; }
        .checklist-mode th:nth-child(4) { width: 10%; }
        .checklist-mode th:nth-child(5) { width: 15%; }
        td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        tr:nth-child(even) { background-color: #f8f9fa; }
    </style>
</head>
<body class="${reportType === 'checklist' ? 'checklist-mode' : ''}">
    <div class="report-wrapper">
        ${content.replace(/<table/g, '<div class="table-responsive"><table').replace(/<\/table>/g, '</table></div>')}
    </div>
</body>
</html>`;
    };

    /**
     * Builds a Word-optimized HTML document.
     *
     * KEY STRATEGY: PRESERVE all existing inline styles from the editor (colors, widths,
     * backgrounds) and MERGE Word-specific properties on top. Editor styles always win
     * for visual appearance. Only adds missing Word/mso-* properties.
     */
    const buildWordHtml = (): string => {
        const parseStyle = (style: string): Record<string, string> => {
            const result: Record<string, string> = {};
            style.split(';').forEach(part => {
                const idx = part.indexOf(':');
                if (idx === -1) return;
                const key = part.slice(0, idx).trim().toLowerCase();
                const val = part.slice(idx + 1).trim();
                if (key && val) result[key] = val;
            });
            return result;
        };
        const serializeStyle = (map: Record<string, string>): string =>
            Object.entries(map).map(([k, v]) => `${k}:${v}`).join(';');
        const mergeStyles = (base: Record<string, string>, override: Record<string, string>): Record<string, string> =>
            ({ ...base, ...override });

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
        const root = doc.body.firstElementChild!;

        root.querySelectorAll('h1').forEach(el => {
            const existing = parseStyle(el.getAttribute('style') || '');
            const merged = mergeStyles({ color: '#004d99', 'text-align': 'center', 'font-size': '22pt', 'font-weight': 'bold', 'margin': '12pt 0 6pt 0' }, existing);
            merged['font-family'] = 'Calibri,Arial,sans-serif';
            merged['mso-style-name'] = 'Heading1';
            el.setAttribute('style', serializeStyle(merged));
        });
        root.querySelectorAll('h2').forEach(el => {
            const existing = parseStyle(el.getAttribute('style') || '');
            const merged = mergeStyles({ color: '#004d99', 'font-size': '16pt', 'font-weight': 'bold', 'border-bottom': '2pt solid #004d99', 'padding-bottom': '4pt', 'margin': '10pt 0 4pt 0' }, existing);
            merged['font-family'] = 'Calibri,Arial,sans-serif';
            el.setAttribute('style', serializeStyle(merged));
        });
        root.querySelectorAll('h3').forEach(el => {
            const existing = parseStyle(el.getAttribute('style') || '');
            const merged = mergeStyles({ color: '#333333', 'font-size': '13pt', 'font-weight': 'bold', 'margin': '8pt 0 4pt 0' }, existing);
            merged['font-family'] = 'Calibri,Arial,sans-serif';
            el.setAttribute('style', serializeStyle(merged));
        });
        root.querySelectorAll('p').forEach(el => {
            const existing = parseStyle(el.getAttribute('style') || '');
            const merged = mergeStyles({ 'font-family': 'Calibri,Arial,sans-serif', 'font-size': '11pt', 'margin': '4pt 0', 'line-height': '1.5' }, existing);
            el.setAttribute('style', serializeStyle(merged));
        });

        root.querySelectorAll('table').forEach(table => {
            const existing = parseStyle(table.getAttribute('style') || '');
            const forced: Record<string, string> = {
                'width': '100%', 'border-collapse': 'collapse', 'border-spacing': '0',
                'font-family': 'Calibri,Arial,sans-serif', 'font-size': '10pt',
                'margin': '8pt 0', 'mso-border-alt': 'solid #CCCCCC .5pt',
            };
            const merged = mergeStyles(existing, forced);
            delete merged['border-radius']; delete merged['border-spacing'];
            delete merged['box-shadow']; delete merged['overflow'];
            table.setAttribute('style', serializeStyle(merged));
            table.setAttribute('border', '1');
            table.setAttribute('cellspacing', '0');
            table.setAttribute('cellpadding', '0');
        });

        // TH: preserve editor colors (teal, navy, etc.), only add Word-specific props
        root.querySelectorAll('th').forEach(th => {
            const existing = parseStyle(th.getAttribute('style') || '');
            const wordAdditions: Record<string, string> = {
                'font-family': 'Calibri,Arial,sans-serif', 'font-weight': 'bold',
                'padding': '6pt 8pt', 'border': '1pt solid #CCCCCC',
                'mso-background-source': 'auto', 'mso-pattern': 'auto',
                'vertical-align': 'middle', 'text-align': 'left',
            };
            const merged = mergeStyles(wordAdditions, existing); // editor wins
            if (!merged['font-family']) merged['font-family'] = 'Calibri,Arial,sans-serif';
            if (!merged['mso-background-source']) merged['mso-background-source'] = 'auto';
            if (!merged['mso-pattern']) merged['mso-pattern'] = 'auto';
            delete merged['border-radius']; delete merged['box-shadow'];
            th.setAttribute('style', serializeStyle(merged));
        });

        // TD: preserve editor colors, widths, backgrounds
        root.querySelectorAll('td').forEach(td => {
            const existing = parseStyle(td.getAttribute('style') || '');
            const wordAdditions: Record<string, string> = {
                'font-family': 'Calibri,Arial,sans-serif', 'font-size': '10pt',
                'padding': '5pt 8pt', 'border': '1pt solid #DDDDDD',
                'vertical-align': 'top', 'word-wrap': 'break-word',
            };
            const merged = mergeStyles(wordAdditions, existing); // editor wins
            delete merged['border-radius']; delete merged['box-shadow']; delete merged['transition'];
            td.setAttribute('style', serializeStyle(merged));
        });

        root.querySelectorAll('tr').forEach(tr => {
            const existing = parseStyle(tr.getAttribute('style') || '');
            delete existing['border-radius']; delete existing['box-shadow']; delete existing['transition'];
            if (Object.keys(existing).length > 0) tr.setAttribute('style', serializeStyle(existing));
        });

        root.querySelectorAll('li').forEach(el => {
            const existing = parseStyle(el.getAttribute('style') || '');
            const merged = mergeStyles({ 'font-family': 'Calibri,Arial,sans-serif', 'font-size': '11pt', 'margin': '2pt 0' }, existing);
            el.setAttribute('style', serializeStyle(merged));
        });
        root.querySelectorAll('strong, b').forEach(el => {
            const existing = parseStyle(el.getAttribute('style') || '');
            existing['font-weight'] = 'bold';
            el.setAttribute('style', serializeStyle(existing));
        });
        root.querySelectorAll('em, i').forEach(el => {
            const existing = parseStyle(el.getAttribute('style') || '');
            existing['font-style'] = 'italic';
            el.setAttribute('style', serializeStyle(existing));
        });
        root.querySelectorAll('div').forEach(div => {
            const existing = parseStyle(div.getAttribute('style') || '');
            delete existing['border-radius']; delete existing['box-shadow'];
            delete existing['overflow']; delete existing['transition'];
            delete existing['-webkit-overflow-scrolling'];
            if (!existing['font-family']) existing['font-family'] = 'Calibri,Arial,sans-serif';
            if (Object.keys(existing).length > 0) div.setAttribute('style', serializeStyle(existing));
        });

        const styledContent = root.innerHTML;

        return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="Microsoft Word 15">
    <meta name="Originator" content="Microsoft Word 15">
    <title>${fileName}</title>
    <!--[if gte mso 9]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page WordSection1 {
            size: 21cm 29.7cm;
            margin: 2cm 2.5cm 2cm 2.5cm;
            mso-header-margin: 1cm;
            mso-footer-margin: 1cm;
            mso-paper-source: 0;
        }
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #222222; line-height: 1.5; background: #ffffff; }
        div.WordSection1 { page: WordSection1; }
        table { border-collapse: collapse !important; width: 100% !important; }
    </style>
</head>
<body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#222222;background:#ffffff;">
    <div style="max-width:100%;padding:0;margin:0;" class="WordSection1">
        ${styledContent}
    </div>
</body>
</html>`;
    };


    /**
     * Export as HTML — opens in a new browser tab with full styling.
     */
    /**
     * Export as HTML — saves to backend and opens a shareable URL.
     */
    const handleExportHtml = async () => {
        setIsSharing(true);
        try {
            const fullHtml = buildFullHtml();
            const response = await axios.post('/api/public-report', {
                content: fullHtml,
                fileName,
                reportType
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            const { id } = response.data;
            const publicUrl = `${window.location.origin}/report/${id}`;
            
            window.open(publicUrl, '_blank');
            setIsOpen(false);
        } catch (error) {
            console.error('Error sharing report:', error);
            // Fallback to blob if backend fails
            const fullHtml = buildFullHtml();
            const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            showToast({
                status: 'error',
                message: 'No se pudo generar el link compartido, se abrió una vista temporal.',
            });
        } finally {
            setIsSharing(false);
        }
    };

    /**
     * Download as HTML file.
     */
    const handleDownloadHtml = () => {
        const fullHtml = buildFullHtml();
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    /**
     * Export as Word (.doc) — uses Word XML HTML with fully inlined styles.
     * Word requires xmlns:o and xmlns:w namespaces, inline styles, and mso-* properties.
     */
    const handleExportWord = () => {
        const wordHtml = buildWordHtml();

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
        a.download = `${fileName}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    /**
     * Export as PDF — opens a styled print window and triggers print dialog.
     * Waits for fonts/images to load before printing to ensure fidelity.
     */
    const handleExportPdf = () => {
        const fullHtml = buildFullHtml();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(fullHtml);
            printWindow.document.close();

            const triggerPrint = () => {
                setTimeout(() => {
                    try {
                        printWindow.focus();
                        printWindow.print();
                    } catch (e) {
                        console.warn('Print failed:', e);
                    }
                }, 600);
            };

            if (printWindow.document.readyState === 'complete') {
                triggerPrint();
            } else {
                printWindow.onload = triggerPrint;
                setTimeout(triggerPrint, 2000);
            }
        }
        setIsOpen(false);
    };

    const exportOptions = [
        {
            label: 'Abrir en Navegador (HTML)',
            icon: Globe,
            handler: handleExportHtml,
            description: 'Vista completa con estilos',
        },
        {
            label: 'Descargar HTML (.html)',
            icon: FileDown,
            handler: handleDownloadHtml,
            description: 'Archivo HTML independiente',
        },
        {
            label: 'Descargar Word (.doc)',
            icon: FileText,
            handler: handleExportWord,
            description: 'Editable con tablas y formato',
        },
        {
            label: 'Descargar PDF',
            icon: FileDown,
            handler: handleExportPdf,
            description: 'Imprimir / guardar como PDF',
        },
    ];

    if (onExportExcel) {
        exportOptions.unshift({
            label: 'Exportar Matriz a Excel (.xlsx)',
            icon: FileText,
            handler: () => {
                onExportExcel();
                setIsOpen(false);
            },
            description: 'Datos crudos de la tabla en Excel',
        });
    }

    const dropdown = isOpen ? (
        <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 99999 }}
            className="w-64 rounded-xl border border-border-medium bg-surface-primary shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <div className="p-1">
                {exportOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                        <button
                            key={option.label}
                            onClick={option.handler}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-left"
                        >
                            <div className="p-1.5 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                                <Icon className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-text-primary">{option.label}</div>
                                <div className="text-xs text-text-secondary">{option.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    ) : null;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => { calcPos(); setIsOpen(o => !o); }}
                className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
            >
                <div className="relative flex-shrink-0 flex items-center justify-center">
                    <Download className="h-5 w-5" />
                </div>
                <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide mr-1">
                        Exportar
                    </span>
                    <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {ReactDOM.createPortal(dropdown, document.body)}
        </>
    );
};

export default ExportDropdown;
