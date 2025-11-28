import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { EModelEndpoint } from 'librechat-data-provider';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Toolbar from './Toolbar';

interface LiveEditorProps {
    initialContent?: string;
    onUpdate?: (content: string) => void;
    onAIEdit?: (prompt: string) => Promise<void>;
    isGenerating?: boolean;
    model?: string;
    endpoint?: EModelEndpoint | string;
    onModelSelect?: (model: string, endpoint: string) => void;
}

const LiveEditor = ({ initialContent = '', onUpdate, onAIEdit, isGenerating, model, endpoint, onModelSelect }: LiveEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder: 'Start typing your risk assessment report here...',
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onUpdate?.(html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
            },
        },
    });

    // Update content if initialContent changes externally
    useEffect(() => {
        if (editor && initialContent && editor.getHTML() !== initialContent) {
            // Only update if content is significantly different to avoid cursor jumps
            // For now, we'll assume initialContent is only set once or we handle it carefully
            editor.commands.setContent(initialContent);
        }
    }, [initialContent, editor]);

    return (
        <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden bg-white dark:border-gray-700 dark:bg-gray-900 shadow-sm">
            <Toolbar
                editor={editor}
                onAIEdit={onAIEdit}
                isGenerating={isGenerating}
                model={model}
                endpoint={endpoint}
                onModelSelect={onModelSelect}
            />
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default LiveEditor;
