import React from 'react';
import { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Heading1,
    Heading2,
} from 'lucide-react';
import { cn } from '~/utils';

interface ToolbarProps {
    editor: Editor | null;
}

const Toolbar = ({ editor }: ToolbarProps) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800 flex flex-wrap gap-2 items-center">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                    editor.isActive('bold') ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white" : "text-gray-600 dark:text-gray-400"
                )}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                    editor.isActive('italic') ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white" : "text-gray-600 dark:text-gray-400"
                )}
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                    editor.isActive('underline') ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white" : "text-gray-600 dark:text-gray-400"
                )}
                title="Underline"
            >
                <Underline className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(
                    "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                    editor.isActive('heading', { level: 1 }) ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white" : "text-gray-600 dark:text-gray-400"
                )}
                title="Heading 1"
            >
                <Heading1 className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                    "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                    editor.isActive('heading', { level: 2 }) ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white" : "text-gray-600 dark:text-gray-400"
                )}
                title="Heading 2"
            >
                <Heading2 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                    editor.isActive('bulletList') ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white" : "text-gray-600 dark:text-gray-400"
                )}
                title="Bullet List"
            >
                <List className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                    editor.isActive('orderedList') ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white" : "text-gray-600 dark:text-gray-400"
                )}
                title="Ordered List"
            >
                <ListOrdered className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toolbar;

