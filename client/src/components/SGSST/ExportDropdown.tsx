import React, { useState, useRef, useEffect } from 'react';
import { Download, Globe, FileText, FileDown, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
    content: string;
    fileName: string;
}

/**
 * Shared Export Dropdown for SGSST modules.
 * Provides HTML, Word, and PDF export options in a single dropdown button.
 * Preserves full HTML styling (tables, colors, formatting) in all formats.
 */
const ExportDropdown: React.FC<ExportDropdownProps> = ({ content, fileName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * Build a full HTML document with inline styles for export.
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
            body { margin: 0; padding: 20px; }
            @page { margin: 1.5cm; size: A4; }
        }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #222;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 30px;
            background: #fff;
        }
        h1 { color: #004d99; text-align: center; margin-bottom: 5px; font-size: 1.8em; }
        h2 { color: #004d99; border-bottom: 2px solid #004d99; padding-bottom: 5px; font-size: 1.4em; }
        h3 { color: #333; font-size: 1.2em; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 0.9em;
        }
        th {
            background-color: #004d99;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
        }
        tr:nth-child(even) { background-color: #f8f9fa; }
        tr:hover { background-color: #e8f0fe; }
    </style>
</head>
<body>${content}</body>
</html>`;
    };

    /**
     * Export as HTML — opens in a new browser tab with full styling.
     */
    const handleExportHtml = () => {
        const fullHtml = buildFullHtml();
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setIsOpen(false);
    };

    /**
     * Export as Word (.doc) — uses MHTML format which Word can open with full styling.
     * This preserves tables, colors, fonts, and layout.
     */
    const handleExportWord = () => {
        const fullHtml = buildFullHtml();

        // Word-compatible MHTML wrapper
        const header = `MIME-Version: 1.0\r\nContent-Type: multipart/related; boundary="----=_NextBoundary"\r\n\r\n------=_NextBoundary\r\nContent-Type: text/html; charset="utf-8"\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n`;
        const footer = `\r\n------=_NextBoundary--`;

        const mhtmlContent = header + fullHtml + footer;

        const blob = new Blob(['\ufeff' + mhtmlContent], {
            type: 'application/msword'
        });
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
     * Export as PDF — opens HTML in a new window and triggers print dialog.
     */
    const handleExportPdf = () => {
        const fullHtml = buildFullHtml();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(fullHtml);
            printWindow.document.close();
            // Wait for content to render before printing
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };
            // Fallback if onload doesn't trigger (already loaded)
            setTimeout(() => {
                printWindow.print();
            }, 1500);
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

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
            >
                <Download className="h-5 w-5" />
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                    Exportar
                </span>
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border-medium bg-surface-primary shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                        {exportOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.label}
                                    onClick={option.handler}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left"
                                >
                                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
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
            )}
        </div>
    );
};

export default ExportDropdown;
