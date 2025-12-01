import React, { useState, useEffect, useRef } from 'react';

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
            <div className="bg-gray-100 dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
                <span className="text-xs text-gray-500 font-mono">HTML Editor (Restored)</span>
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
