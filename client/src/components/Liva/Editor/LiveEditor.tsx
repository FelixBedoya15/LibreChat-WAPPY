import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Save, Image as ImageIcon, PenTool, Trash2 } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface LiveEditorProps {
    initialContent: string;
    onUpdate: (content: string) => void;
    onSave?: () => void;
}

const LiveEditor: React.FC<LiveEditorProps> = ({ initialContent, onUpdate, onSave }) => {
    const localize = useLocalize();
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const [content, setContent] = useState(initialContent);
    const [signatures, setSignatures] = useState<string[]>([]);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    useEffect(() => {
        // Load signatures from localStorage on mount
        const savedSignatures = localStorage.getItem('sgsst_signatures');
        if (savedSignatures) {
            try {
                setSignatures(JSON.parse(savedSignatures));
            } catch (e) {
                console.error('Error loading signatures:', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('sgsst_signatures', JSON.stringify(signatures));
    }, [signatures]);

    useEffect(() => {
        setContent(initialContent);
        if (editorRef.current && editorRef.current.innerHTML !== initialContent) {
            editorRef.current.innerHTML = initialContent;
        }
    }, [initialContent]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const newContent = e.currentTarget.innerHTML;
        setContent(newContent);
        onUpdate(newContent);
    };

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const imageUrl = readerEvent.target?.result as string;
                execCmd('insertImage', imageUrl);
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        e.target.value = '';
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const signatureUrl = readerEvent.target?.result as string;
                setSignatures(prev => [...prev, signatureUrl]);
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        e.target.value = '';
    };

    const insertSignature = (signatureUrl: string) => {
        const img = `<img src="${signatureUrl}" style="max-height: 100px; display: block; margin: 10px auto;" alt="Firma Digital" />`;
        document.execCommand('insertHTML', false, img);
        setIsSignatureModalOpen(false);
    };

    const deleteSignature = (index: number) => {
        setSignatures(prev => prev.filter((_, i) => i !== index));
    };

    const ToolbarButton = ({ icon: Icon, command, value, label, onClick }: { icon: any, command?: string, value?: string, label: string, onClick?: () => void }) => (
        <button
            onClick={onClick ? onClick : () => command && execCmd(command, value)}
            className="p-2 hover:bg-surface-hover rounded transition-colors text-primary"
            title={label}
            type="button"
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className="w-full h-full flex flex-col">
            {/* Toolbar */}
            <div className="bg-surface-secondary p-2 border-b border-light flex flex-wrap gap-2 items-center sticky top-0 z-10">
                {/* Group 1: Formatting Text */}
                <div className="flex gap-1 items-center">
                    <ToolbarButton icon={Bold} command="bold" label={localize('com_ui_bold')} />
                    <ToolbarButton icon={Italic} command="italic" label={localize('com_ui_italic')} />
                    <ToolbarButton icon={Underline} command="underline" label={localize('com_ui_underline')} />
                    <div className="w-px h-6 bg-border-medium mx-1" />
                    <ToolbarButton icon={Heading1} command="formatBlock" value="H1" label={localize('com_ui_heading_1')} />
                    <ToolbarButton icon={Heading2} command="formatBlock" value="H2" label={localize('com_ui_heading_2')} />
                    <div className="w-px h-6 bg-border-medium mx-1" />
                    <ToolbarButton icon={List} command="insertUnorderedList" label={localize('com_ui_bullet_list')} />
                    <ToolbarButton icon={ListOrdered} command="insertOrderedList" label={localize('com_ui_numbered_list')} />
                </div>

                {/* Group 2: Alignment & Save */}
                <div className="flex gap-1 items-center">
                    <div className="w-px h-6 bg-border-medium mx-1 hidden sm:block" />
                    <ToolbarButton icon={AlignLeft} command="justifyLeft" label={localize('com_ui_align_left')} />
                    <ToolbarButton icon={AlignCenter} command="justifyCenter" label={localize('com_ui_align_center')} />
                    <ToolbarButton icon={AlignRight} command="justifyRight" label={localize('com_ui_align_right')} />

                    <div className="w-px h-6 bg-border-medium mx-1" />
                    <ToolbarButton icon={ImageIcon} label="Insertar Imagen" onClick={() => fileInputRef.current?.click()} />
                    <ToolbarButton icon={PenTool} label="Firma Digital" onClick={() => setIsSignatureModalOpen(true)} />

                    {onSave && (
                        <>
                            <div className="w-px h-6 bg-border-medium mx-1" />
                            <ToolbarButton icon={Save} label={localize('com_ui_save_report') || "Guardar Informe"} onClick={onSave} />
                        </>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <input
                    type="file"
                    ref={signatureInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                />
            </div>

            {/* Signature Management Modal */}
            {isSignatureModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-surface-primary rounded-2xl border border-border-medium shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-border-light flex justify-between items-center bg-surface-secondary">
                            <h3 className="font-bold text-text-primary">Firmas Digitales</h3>
                            <button onClick={() => setIsSignatureModalOpen(false)} className="text-text-tertiary hover:text-text-primary">
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {signatures.length === 0 ? (
                                <div className="text-center py-8 text-text-tertiary">
                                    <PenTool className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No hay firmas guardadas</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {signatures.map((sig, idx) => (
                                        <div key={idx} className="group relative border border-border-light rounded-lg p-2 hover:border-blue-500 transition-all cursor-pointer bg-white">
                                            <img
                                                src={sig}
                                                alt={`Firma ${idx + 1}`}
                                                className="max-h-20 mx-auto object-contain"
                                                onClick={() => insertSignature(sig)}
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteSignature(idx); }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-surface-secondary border-t border-border-light flex gap-2">
                            <button
                                onClick={() => signatureInputRef.current?.click()}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                                Cargar nueva firma
                            </button>
                            <button
                                onClick={() => setIsSignatureModalOpen(false)}
                                className="px-4 py-2 bg-border-light hover:bg-border-medium text-text-primary rounded-lg transition-colors font-medium text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div
                ref={editorRef}
                className="flex-1 p-8 outline-none overflow-y-auto prose dark:prose-invert max-w-none w-full live-editor-content"
                contentEditable
                onInput={handleInput}
                suppressContentEditableWarning={true}
                style={{ minHeight: '100%', maxWidth: '100%' }}
            />
            {/* Standardized report styles matching Diagnóstico/Auditoría */}
            <style>{`
                .live-editor-content h1 {
                    color: #004d99;
                    text-align: center;
                    margin-bottom: 5px;
                    font-size: 1.8em;
                    border-bottom: 2px solid #004d99;
                    padding-bottom: 8px;
                }
                .live-editor-content h2 {
                    color: #004d99;
                    border-bottom: 2px solid #004d99;
                    padding-bottom: 5px;
                    font-size: 1.4em;
                }
                .live-editor-content h3 {
                    color: #333;
                    font-size: 1.2em;
                }
                .live-editor-content table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 15px 0;
                    font-size: 0.9em;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #ddd;
                    table-layout: fixed;
                }
                .live-editor-content table th {
                    background-color: #004d99;
                    color: white;
                    padding: 10px 8px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 1px solid #ddd;
                    border-right: 1px solid rgba(255,255,255,0.15);
                }
                /* Specific column widths for SGSST Reports */
                .live-editor-content table th:nth-child(1) { width: 50px; } /* # */
                .live-editor-content table th:nth-child(2) { width: 15%; } /* Requisito / Estándar */
                .live-editor-content table th:nth-child(3) { width: 45%; } /* Hallazgo (Evidencia) - Double width approx */
                .live-editor-content table th:nth-child(4) { width: 12%; } /* Tipo */
                .live-editor-content table th:nth-child(5) { width: auto; } /* Responsable */

                .live-editor-content table th:last-child {
                    border-right: none;
                }
                .live-editor-content table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #ddd;
                    border-right: 1px solid #eee;
                    vertical-align: top;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                .live-editor-content table td:last-child {
                    border-right: none;
                }
                .live-editor-content table tr:last-child td {
                    border-bottom: none;
                }
                .live-editor-content table tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                .live-editor-content table tr:hover {
                    background-color: #e8f0fe;
                }
                .live-editor-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>

    );
};

export default LiveEditor;

