import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Save } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface LiveEditorProps {
    initialContent: string;
    onUpdate: (content: string) => void;
    onSave?: () => void;
}

const LiveEditor: React.FC<LiveEditorProps> = ({ initialContent, onUpdate, onSave }) => {
    const localize = useLocalize();
    const editorRef = useRef<HTMLDivElement>(null);
    const [content, setContent] = useState(initialContent);

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
                    {onSave && (
                        <>
                            <div className="w-px h-6 bg-border-medium mx-1" />
                            <ToolbarButton icon={Save} label={localize('com_ui_save_report') || "Guardar Informe"} onClick={onSave} />
                        </>
                    )}
                </div>
            </div>
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
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 0.9em;
                }
                .live-editor-content table th {
                    background-color: #004d99;
                    color: white;
                    padding: 10px 8px;
                    text-align: left;
                    font-weight: 600;
                }
                .live-editor-content table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #ddd;
                    vertical-align: top;
                }
                .live-editor-content table tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                .live-editor-content table tr:hover {
                    background-color: #e8f0fe;
                }
                .live-editor-content table td,
                .live-editor-content table th {
                    border: 1px solid #ddd;
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

