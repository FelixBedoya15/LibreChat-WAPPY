import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface LiveEditorProps {
    initialContent: string;
    onUpdate: (content: string) => void;
}

const LiveEditor: React.FC<LiveEditorProps> = ({ initialContent, onUpdate }) => {
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

    return (
        <div className="w-full h-full flex flex-col">
    const execCmd = (command: string, value: string | undefined = undefined) => {
                document.execCommand(command, false, value);
            editorRef.current?.focus();
    };

            const ToolbarButton = ({icon: Icon, command, value, label }: {icon: any, command: string, value?: string, label: string }) => (
            <button
                onClick={() => execCmd(command, value)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
                title={label}
                type="button"
            >
                <Icon className="w-4 h-4" />
            </button>
            );

            return (
            <div className="w-full h-full flex flex-col">
                {/* Toolbar */}
                <div className="bg-gray-50 dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-1 items-center sticky top-0 z-10">
                    <ToolbarButton icon={Bold} command="bold" label="Bold" />
                    <ToolbarButton icon={Italic} command="italic" label="Italic" />
                    <ToolbarButton icon={Underline} command="underline" label="Underline" />
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <ToolbarButton icon={Heading1} command="formatBlock" value="H1" label="Heading 1" />
                    <ToolbarButton icon={Heading2} command="formatBlock" value="H2" label="Heading 2" />
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <ToolbarButton icon={List} command="insertUnorderedList" label="Bullet List" />
                    <ToolbarButton icon={ListOrdered} command="insertOrderedList" label="Numbered List" />
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <ToolbarButton icon={AlignLeft} command="justifyLeft" label="Align Left" />
                    <ToolbarButton icon={AlignCenter} command="justifyCenter" label="Align Center" />
                    <ToolbarButton icon={AlignRight} command="justifyRight" label="Align Right" />
                </div>
                <div
                    ref={editorRef}
                    className="flex-1 p-8 outline-none overflow-y-auto prose dark:prose-invert max-w-none"
                    contentEditable
                    onInput={handleInput}
                    suppressContentEditableWarning={true}
                    style={{ minHeight: '100%' }}
                />
            </div>
            );
};

            export default LiveEditor;
