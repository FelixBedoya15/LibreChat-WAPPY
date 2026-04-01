import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
    Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight, Save, Image as ImageIcon,
    PenTool, Trash2, Maximize, Minimize, Move, Layers, ArrowUp, ArrowDown, X,
    Plus, Minus, Table as TableIcon, Layout, ChevronRight, ChevronDown, Palette
} from 'lucide-react';
import { useLocalize } from '~/hooks';
import { useAuthContext } from '~/hooks/AuthContext';

interface LiveEditorProps {
    initialContent: string;
    onUpdate: (content: string) => void;
    onSave?: () => void;
    reportType?: 'checklist' | 'general';
    /** Determines if the editor forces a classic "white paper" look regardless of dark mode */
    paperMode?: boolean;
    /** Optional source data for AI context (passed to backend for AI inline editing) */
    reportSourceData?: any;
}


export interface LiveEditorHandle {
    setHTML: (html: string) => void;
}

const LiveEditor = forwardRef<LiveEditorHandle, LiveEditorProps>(({ initialContent, onUpdate, onSave, reportType = 'general', reportSourceData, paperMode = true }, ref) => {
    const localize = useLocalize();
    const { token } = useAuthContext();
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const [content, setContent] = useState(initialContent);
    const [namedSignatures, setNamedSignatures] = useState<Record<string, string>>({});
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
    const [imageToolbarPos, setImageToolbarPos] = useState({ top: 0, left: 0 });
    const [selectedTableCell, setSelectedTableCell] = useState<HTMLTableCellElement | null>(null);
    const [tableToolbarPos, setTableToolbarPos] = useState({ top: 0, left: 0 });
    const [selectedGraphic, setSelectedGraphic] = useState<HTMLDivElement | null>(null);
    const [graphicToolbarPos, setGraphicToolbarPos] = useState({ top: 0, left: 0 });
    const [selectedDiagramNode, setSelectedDiagramNode] = useState<HTMLElement | null>(null);
    const [diagramNodeToolbarPos, setDiagramNodeToolbarPos] = useState({ top: 0, left: 0 });
    const [activeSignaturePlaceholder, setActiveSignaturePlaceholder] = useState<HTMLElement | null>(null);
    const [activeSignatureName, setActiveSignatureName] = useState<string>('');

    // ── AI Inline Edit ──────────────────────────────────────────────────────
    const [aiEditBubble, setAiEditBubble] = useState<{ x: number; y: number } | null>(null);
    const [aiEditInstruction, setAiEditInstruction] = useState('');
    const [aiEditSelectedText, setAiEditSelectedText] = useState('');
    const [isAiEditing, setIsAiEditing] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showAiInput, setShowAiInput] = useState(false);
    const [bubbleDebug, setBubbleDebug] = useState<any>({}); // CRITICAL FIX: debug state
    const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const aiInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setPortalNode(document.getElementById('root') || document.body);
    }, []);

    useEffect(() => {
        const namedSigsStr = localStorage.getItem('wappy_signatures');
        let initialNamed: Record<string, string> = {};
        if (namedSigsStr) {
            try { initialNamed = JSON.parse(namedSigsStr); } catch (e) { }
        } else {
            const oldSigsStr = localStorage.getItem('sgsst_signatures');
            if (oldSigsStr) {
                try {
                    const parsed = JSON.parse(oldSigsStr);
                    if (parsed && typeof parsed === 'object') {
                        Object.keys(parsed).forEach((k) => {
                            if (parsed[k]?.url) initialNamed[k] = parsed[k].url;
                        });
                    }
                } catch (e) { }
            }
        }
        setNamedSignatures(initialNamed);
        // Also fetch from backend for mobile/cross-device syncing
        if (token) {
            fetch('/api/sgsst/signatures', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.signatures && Object.keys(data.signatures).length > 0) {
                        setNamedSignatures(prev => {
                            const merged = { ...prev, ...data.signatures };
                            localStorage.setItem('wappy_signatures', JSON.stringify(merged));
                            return merged;
                        });
                    }
                })
                .catch(err => console.error("Error fetching signatures for sync:", err));
        }

    }, [token]);

    // ────────────────────────────────────────────────────────────────────────
    // EVENT LISTENERS FOR SELECTION AND CLICKS
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            // Ignore if clicking inside the AI bubble itself
            const target = e.target as HTMLElement;
            if (target.closest('[data-ai-bubble]')) return;

            setTimeout(() => {
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                    if (!showAiInput) setAiEditBubble(null);
                    setBubbleDebug({ status: 'collapsed_or_empty' }); // debug
                    return;
                }

                const selectedText = sel.toString().trim();
                const range = sel.getRangeAt(0);

                try {
                    // Robust check to ensure selection is inside or around the editor
                    const editorNode = editorRef.current;
                    const commonAncestor = range.commonAncestorContainer;
                    
                    const inEditor = editorNode?.contains(sel.anchorNode) 
                                  || editorNode?.contains(sel.focusNode)
                                  || editorNode?.contains(commonAncestor)
                                  || (commonAncestor && commonAncestor.contains && commonAncestor.contains(editorNode));
                    
                    if (!inEditor) {
                        if (!showAiInput) setAiEditBubble(null);
                        setBubbleDebug({ status: 'not_in_editor', focusNode: sel.focusNode?.nodeName }); // debug
                        return;
                    }

                    // Save the selection range so we can edit it later
                    savedRangeRef.current = range.cloneRange();
                    setAiEditSelectedText(selectedText);
                    
                    // CRITICAL FIX: The wrapper context is clipping the bubble using CSS overflow when deep inside reports.
                    // We will use React Portal to render the bubble outside the DOM hierarchy. 
                    // So we must calculate coordinates relative to the VIEWPORT, not the wrapper.
                    const rect = range.getBoundingClientRect();
                    
                    let fixedX = rect.left + (rect.width / 2);
                    let fixedY = rect.bottom + 12; // place just below selection
                    
                    // Constrain to viewport safely
                    fixedX = Math.max(80, Math.min(fixedX, window.innerWidth - 80));
                    fixedY = Math.max(20, Math.min(fixedY, window.innerHeight - 80));

                    setBubbleDebug({ 
                        status: 'success', 
                        fixedX: Math.round(fixedX), fixedY: Math.round(fixedY),
                        textLen: selectedText.length
                    });

                    setAiEditBubble({
                        x: fixedX,
                        y: fixedY, 
                    });

                    setShowAiInput(false); // reset to initial bubble state
                    setAiEditInstruction('');
                } catch (err: any) {
                    setBubbleDebug({ status: 'error', msg: err?.message });
                    console.error("[LiveEditor] Selection error:", err);
                }
            }, 50); // slight debounce
        };

        const el = editorRef.current;
        el?.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            el?.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAiInput]);

    // Focus AI textarea when shown
    useEffect(() => {
        if (showAiInput) setTimeout(() => aiInputRef.current?.focus(), 50);
    }, [showAiInput]);

    const handleAiEdit = async () => {
        if (!aiEditInstruction.trim() || !savedRangeRef.current || !aiEditSelectedText) return;
        setIsAiEditing(true);
        try {
            // Send the full report text for richer AI context (no char limit)
            const fullReportText = editorRef.current?.innerText || '';
            const res = await fetch('/api/live/ai-edit-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    selectedText: aiEditSelectedText,
                    instruction: aiEditInstruction,
                    fullReportText,
                    reportSourceData: reportSourceData ?? null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al editar');

            // Restore the saved selection and replace it
            const sel = window.getSelection();
            if (sel && savedRangeRef.current) {
                sel.removeAllRanges();
                sel.addRange(savedRangeRef.current);
                document.execCommand('insertText', false, data.editedText);
            }

            // Cleanup
            setAiEditBubble(null);
            setShowAiInput(false);
            setAiEditInstruction('');
            savedRangeRef.current = null;
            onUpdate(editorRef.current?.innerHTML || '');
        } catch (err: any) {
            alert(`Error IA: ${err.message}`);
        } finally {
            setIsAiEditing(false);
        }
    };

    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

    // Handle Esc key and overflow
    useEffect(() => {
        if (isFullScreen) {
            document.body.style.overflow = 'hidden';
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') setIsFullScreen(false);
            };
            window.addEventListener('keydown', handleEsc);
            return () => {
                document.body.style.overflow = 'auto';
                window.removeEventListener('keydown', handleEsc);
            };
        }
        document.body.style.overflow = 'auto';
    }, [isFullScreen]);
    // ────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        try {
            if (Object.keys(namedSignatures).length > 0) {
                localStorage.setItem('wappy_signatures', JSON.stringify(namedSignatures));
            }
        } catch (e) {
            console.warn('Storage quota exceeded for signatures.');
            // Only keep the newest 10 if quota is hit
            const entries = Object.entries(namedSignatures);
            if (entries.length > 5) {
                const sliced = Object.fromEntries(entries.slice(entries.length - 5));
                setNamedSignatures(sliced);
            }
        }
    }, [namedSignatures]);

    // Auto-inject signatures automatically if they exist in state
    useEffect(() => {
        if (!editorRef.current || Object.keys(namedSignatures).length === 0) return;

        let changed = false;
        const placeholders = Array.from(editorRef.current.querySelectorAll('.signature-placeholder')) as HTMLElement[];

        // Helper to find a signature key that matches
        const findSignatureMatch = (name: string) => {
            if (!name) return null;
            name = name.toUpperCase().trim();
            // Direct match
            if (namedSignatures[name]) return namedSignatures[name];
            // Substring match
            for (const key of Object.keys(namedSignatures)) {
                if (name.includes(key) || key.includes(name)) {
                    return namedSignatures[key];
                }
            }
            return null;
        };

        if (placeholders.length > 0) {
            placeholders.forEach(placeholder => {
                const nextEl = placeholder.nextElementSibling;
                if (nextEl) {
                    const name = nextEl.textContent?.trim().toUpperCase() || '';
                    const matchedSignatureUrl = findSignatureMatch(name);

                    if (name && matchedSignatureUrl) {
                        const img = document.createElement('img');
                        img.src = matchedSignatureUrl;
                        img.className = 'wappy-auto-signature';
                        img.style.maxHeight = '100px';
                        img.style.display = 'block';
                        img.style.margin = '10px auto';
                        img.alt = `Firma de ${name}`;
                        placeholder.replaceWith(img);
                        changed = true;
                    }
                }
            });

            if (changed) {
                const newContent = editorRef.current.innerHTML;
                setContent(newContent);
                onUpdate(newContent);
            }
        }
    }, [namedSignatures, content]);

    // Expose setHTML() to parent via ref (imperative handle)
    useImperativeHandle(ref, () => ({
        setHTML: (html: string) => {
            if (editorRef.current) {
                const safeHtml = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
                editorRef.current.innerHTML = safeHtml;
                setContent(safeHtml);
            }
        }
    }));

    // Track if we already did the initial load so we never overwrite user edits
    const initializedRef = useRef(false);

    useEffect(() => {
        // Set content ONLY once when the component first mounts and has content
        // After that, all updates go through the imperative setHTML() handle
        if (!initializedRef.current && editorRef.current && initialContent) {
            const safeHtml = initialContent.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
            editorRef.current.innerHTML = safeHtml;
            initializedRef.current = true;
        } else if (!initializedRef.current && editorRef.current) {
            // Mark as initialized even if content is empty, so future setHTML calls work
            initializedRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ← Empty deps: run ONCE on mount only. Updates come via setHTML() imperatively.

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
                let nameToUse = activeSignatureName;
                if (!nameToUse || nameToUse === 'DESCONOCIDO') {
                    nameToUse = prompt("¿A qué nombre o rol pertenece esta firma?")?.trim().toUpperCase() || `Firma ${Object.keys(namedSignatures).length + 1}`;
                }

                setNamedSignatures(prev => ({
                    ...prev,
                    [nameToUse]: signatureUrl
                }));

                // Auto insert directly if it was called independent of a placeholder
                if (!activeSignaturePlaceholder) {
                    const img = `<img src="${signatureUrl}" style="max-height: 100px; display: block; margin: 10px auto;" alt="Firma ${nameToUse}" />`;
                    document.execCommand('insertHTML', false, img);
                }
                setIsSignatureModalOpen(false);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const insertSignature = (signatureUrl: string, existingName: string) => {
        if (activeSignaturePlaceholder) {
            if (activeSignatureName && activeSignatureName !== 'DESCONOCIDO' && activeSignatureName !== existingName) {
                setNamedSignatures(prev => ({
                    ...prev,
                    [activeSignatureName]: signatureUrl
                }));
            } else {
                const img = document.createElement('img');
                img.src = signatureUrl;
                img.style.maxHeight = '100px';
                img.style.display = 'block';
                img.style.margin = '10px auto';
                activeSignaturePlaceholder.replaceWith(img);
                onUpdate(editorRef.current?.innerHTML || '');
            }
            setActiveSignaturePlaceholder(null);
        } else {
            const img = `<img src="${signatureUrl}" style="max-height: 100px; display: block; margin: 10px auto;" alt="Firma" />`;
            document.execCommand('insertHTML', false, img);
            onUpdate(editorRef.current?.innerHTML || '');
        }
        setIsSignatureModalOpen(false);
    };

    const deleteSignature = (name: string) => {
        setNamedSignatures(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    // Image manipulation functions
    useEffect(() => {
        const handleDocClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.tagName === 'IMG' && editorRef.current?.contains(target)) {
                const img = target as HTMLImageElement;
                clearSelections();
                img.setAttribute('data-selected', 'true');
                setSelectedImage(img);
                const rect = img.getBoundingClientRect();
                const editorRect = editorRef.current.getBoundingClientRect();
                setImageToolbarPos({
                    top: rect.top - editorRect.top - 50 + editorRef.current.scrollTop,
                    left: rect.left - editorRect.left
                });
            } else if ((target.closest('.signature-placeholder') || target.innerText?.includes('FIRMADO DIGITALMENTE')) && editorRef.current?.contains(target)) {
                const placeholder = (target.closest('.signature-placeholder') || target.closest('div') || target.parentElement) as HTMLElement;
                if (placeholder) {
                    e.preventDefault();
                    // Check for signature placeholders
                    const sigPlaceholder = target.closest('.signature-placeholder') as HTMLElement;
                    if (sigPlaceholder && editorRef.current?.contains(sigPlaceholder)) {
                        let extractedName = 'DESCONOCIDO';
                        const nextEl = sigPlaceholder.nextElementSibling;
                        if (nextEl) {
                            extractedName = nextEl.textContent?.trim().toUpperCase() || 'DESCONOCIDO';
                        }
                        setActiveSignatureName(extractedName);
                        setActiveSignaturePlaceholder(sigPlaceholder);
                        setIsSignatureModalOpen(true);
                    }
                }
            } else if (target.closest('td, th') && editorRef.current?.contains(target)) {
                const cell = target.closest('td, th') as HTMLTableCellElement;
                clearSelections();
                cell.setAttribute('data-selected', 'true');
                setSelectedTableCell(cell);
                const rect = cell.getBoundingClientRect();
                const editorRect = editorRef.current!.getBoundingClientRect();
                setTableToolbarPos({
                    top: rect.top - editorRect.top - 50 + editorRef.current!.scrollTop,
                    left: rect.left - editorRect.left
                });
            } else if (target.closest('.progress-bar-container, [style*="width:"]') && editorRef.current?.contains(target)) {
                const graphic = target.closest('div') as HTMLDivElement;
                if (graphic.style.width || graphic.classList.contains('progress-bar')) {
                    clearSelections();
                    graphic.setAttribute('data-selected', 'true');
                    setSelectedGraphic(graphic);
                    const rect = graphic.getBoundingClientRect();
                    const editorRect = editorRef.current!.getBoundingClientRect();
                    setGraphicToolbarPos({
                        top: rect.top - editorRect.top - 60 + editorRef.current!.scrollTop,
                        left: rect.left - editorRect.left
                    });
                }
            } else if (target.closest('.diagram-node') && editorRef.current?.contains(target)) {
                const node = target.closest('.diagram-node') as HTMLElement;
                clearSelections();
                node.setAttribute('data-selected', 'true');
                setSelectedDiagramNode(node);
                const rect = node.getBoundingClientRect();
                const editorRect = editorRef.current.getBoundingClientRect();
                setDiagramNodeToolbarPos({
                    top: rect.top - editorRect.top - 50 + editorRef.current.scrollTop,
                    left: rect.left - editorRect.left
                });
            } else if (!target.closest('.image-toolbar') && !target.closest('.table-toolbar') && !target.closest('.graphic-toolbar') && !target.closest('.diagram-toolbar') && !target.closest('.signature-modal')) {
                clearSelections();
            }
        };

        const clearSelections = () => {
            editorRef.current?.querySelectorAll('img, td, th, div, span, .diagram-node').forEach(i => i.removeAttribute('data-selected'));
            setSelectedImage(null);
            setSelectedTableCell(null);
            setSelectedGraphic(null);
            setSelectedDiagramNode(null);
        };

        const editor = editorRef.current;
        if (editor) {
            editor.addEventListener('click', handleDocClick);
        }
        return () => {
            if (editor) {
                editor.removeEventListener('click', handleDocClick);
            }
        };
    }, []);

    const updateImageStyle = (styles: Partial<CSSStyleDeclaration>) => {
        if (!selectedImage) return;
        Object.assign(selectedImage.style, styles);
        onUpdate(editorRef.current?.innerHTML || '');
    };

    const setImageAlign = (align: 'left' | 'center' | 'right' | 'none') => {
        if (!selectedImage) return;
        if (align === 'center') {
            updateImageStyle({ display: 'block', margin: '10px auto', float: 'none' });
        } else if (align === 'left') {
            updateImageStyle({ display: 'inline-block', margin: '0 15px 10px 0', float: 'left' });
        } else if (align === 'right') {
            updateImageStyle({ display: 'inline-block', margin: '0 0 10px 15px', float: 'right' });
        } else {
            updateImageStyle({ display: 'inline-block', margin: '0', float: 'none', position: 'static' });
        }
    };

    const setImageLayer = (layer: 'front' | 'back' | 'normal') => {
        if (!selectedImage) return;
        if (layer === 'front') {
            updateImageStyle({ position: 'relative', zIndex: '10' });
        } else if (layer === 'back') {
            updateImageStyle({ position: 'relative', zIndex: '-1' });
        } else {
            updateImageStyle({ position: 'static', zIndex: '0' });
        }
    };

    const setImageSize = (size: 'sm' | 'md' | 'lg' | 'full') => {
        if (!selectedImage) return;
        const width = size === 'sm' ? '150px' : size === 'md' ? '300px' : size === 'lg' ? '500px' : '100%';
        updateImageStyle({ width, height: 'auto' });
    };

    const removeImage = () => {
        if (!selectedImage) return;
        selectedImage.remove();
        setSelectedImage(null);
        onUpdate(editorRef.current?.innerHTML || '');
    };

    // Table manipulation functions
    const addTableRow = (where: 'above' | 'below') => {
        if (!selectedTableCell) return;
        const row = selectedTableCell.parentElement as HTMLTableRowElement;
        const table = row.parentElement as HTMLTableSectionElement;
        const newRow = table.insertRow(where === 'above' ? row.rowIndex : row.rowIndex + 1);
        for (let i = 0; i < row.cells.length; i++) {
            const newCell = newRow.insertCell(i);
            newCell.innerHTML = '&nbsp;';
        }
        onUpdate(editorRef.current?.innerHTML || '');
    };

    const addTableCol = (where: 'left' | 'right') => {
        if (!selectedTableCell) return;
        const table = selectedTableCell.closest('table') as HTMLTableElement;
        const colIndex = selectedTableCell.cellIndex;
        const targetIndex = where === 'left' ? colIndex : colIndex + 1;

        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
            const newCell = row.insertCell(targetIndex);
            newCell.innerHTML = '&nbsp;';
        }
        onUpdate(editorRef.current?.innerHTML || '');
    };

    const deleteTableRow = () => {
        if (!selectedTableCell) return;
        const row = selectedTableCell.parentElement as HTMLTableRowElement;
        const table = row.closest('table') as HTMLTableElement;
        if (table.rows.length > 1) {
            table.deleteRow(row.rowIndex);
            setSelectedTableCell(null);
            onUpdate(editorRef.current?.innerHTML || '');
        }
    };

    const deleteTableCol = () => {
        if (!selectedTableCell) return;
        const table = selectedTableCell.closest('table') as HTMLTableElement;
        const colIndex = selectedTableCell.cellIndex;
        if (table.rows[0].cells.length > 1) {
            for (let i = 0; i < table.rows.length; i++) {
                table.rows[i].deleteCell(colIndex);
            }
            setSelectedTableCell(null);
            onUpdate(editorRef.current?.innerHTML || '');
        }
    };

    const deleteTable = () => {
        if (!selectedTableCell) return;
        const table = selectedTableCell.closest('table');
        table?.remove();
        setSelectedTableCell(null);
        onUpdate(editorRef.current?.innerHTML || '');
    };

    const resizeColumn = (direction: 'wider' | 'narrower') => {
        if (!selectedTableCell) return;
        const colIndex = selectedTableCell.cellIndex;
        const table = selectedTableCell.closest('table') as HTMLTableElement;
        // We only apply widths to the first row of cells (usually headers)
        const headerCell = table.rows[0].cells[colIndex];
        const currentWidth = headerCell.offsetWidth;
        const newWidth = direction === 'wider' ? currentWidth + 20 : Math.max(20, currentWidth - 20);
        headerCell.style.width = `${newWidth}px`;
        headerCell.style.minWidth = `${newWidth}px`;
        onUpdate(editorRef.current?.innerHTML || '');
    };

    // Graphic manipulation functions
    const updateGraphic = (percent: number, color?: string) => {
        if (!selectedGraphic) return;
        const innerBar = selectedGraphic.querySelector('div') || selectedGraphic;
        if (color) {
            innerBar.style.backgroundColor = color;
        }
        innerBar.style.width = `${percent}%`;
        innerBar.innerText = `${percent}%`;
        onUpdate(editorRef.current?.innerHTML || '');
    };

    const setDiagramNodeColor = (bgColor: string, textColor: string) => {
        if (!selectedDiagramNode) return;
        selectedDiagramNode.style.backgroundColor = bgColor;
        selectedDiagramNode.style.color = textColor;
        // Also force any direct text spans to inherit or match
        const spans = selectedDiagramNode.querySelectorAll('span');
        spans.forEach(span => {
            span.style.color = textColor;
        });
        onUpdate(editorRef.current?.innerHTML || '');
    };

    const deleteDiagramNode = () => {
        if (!selectedDiagramNode) return;
        selectedDiagramNode.remove();
        setSelectedDiagramNode(null);
        onUpdate(editorRef.current?.innerHTML || '');
    };

    const ToolbarButton = ({ icon: Icon, command, value, label, onClick }: { icon: any, command?: string, value?: string, label: string, onClick?: () => void }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick ? onClick : () => command && execCmd(command, value)}
            className="group relative flex items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border border-border-medium/50 rounded-xl sm:hover:bg-surface-hover sm:hover:border-teal-400 bg-surface-primary text-text-primary outline-none sm:hover:-rotate-3 sm:hover:scale-105"
            title={label}
            type="button"
        >
            <Icon size={20} />
            <div className="hidden sm:flex absolute top-full mt-2 left-1/2 -translate-x-1/2 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-teal-600 text-white px-2 py-1 rounded-md shadow-xl pointer-events-none z-[110] border border-teal-500/50">
                <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </div>
        </motion.button>
    );

    const editorGroups = [
        { id: 'format', buttons: [
            { icon: Bold, command: 'bold', label: localize('com_ui_bold') },
            { icon: Italic, command: 'italic', label: localize('com_ui_italic') },
            { icon: Underline, command: 'underline', label: localize('com_ui_underline') }
        ]},
        { id: 'headings', buttons: [
            { icon: Heading1, command: 'formatBlock', value: 'H1', label: localize('com_ui_heading_1') },
            { icon: Heading2, command: 'formatBlock', value: 'H2', label: localize('com_ui_heading_2') }
        ]},
        { id: 'lists', buttons: [
            { icon: List, command: 'insertUnorderedList', label: localize('com_ui_bullet_list') },
            { icon: ListOrdered, command: 'insertOrderedList', label: localize('com_ui_numbered_list') }
        ]},
        { id: 'align', buttons: [
            { icon: AlignLeft, command: 'justifyLeft', label: localize('com_ui_align_left') },
            { icon: AlignCenter, command: 'justifyCenter', label: localize('com_ui_align_center') },
            { icon: AlignRight, command: 'justifyRight', label: localize('com_ui_align_right') }
        ]},
        { id: 'media', buttons: [
            { icon: ImageIcon, label: "Imagen", onClick: () => fileInputRef.current?.click() },
            { icon: PenTool, label: "Firma", onClick: () => setIsSignatureModalOpen(true) }
        ]},
        { id: 'save', buttons: [
            ...(onSave ? [{ icon: Save, label: localize('com_ui_save_report') || "Guardar", onClick: onSave }] : []),
            { icon: isFullScreen ? Minimize : Maximize, label: isFullScreen ? "Salir Pantalla Completa" : "Pantalla Completa", onClick: toggleFullScreen }
        ]}
    ].filter(g => g.buttons.length > 0);

    const editorRows = React.useMemo(() => {
        const result: any[][] = [];
        let currentRow: any[] = [];
        let count = 0;
        editorGroups.forEach(g => {
            if (count + g.buttons.length > 5 && currentRow.length > 0) {
                result.push(currentRow);
                currentRow = [g];
                count = g.buttons.length;
            } else {
                currentRow.push(g);
                count += g.buttons.length;
            }
        });
        if (currentRow.length > 0) result.push(currentRow);
        return result;
    }, [editorGroups]);

    const ToolbarSeparator = () => <div className="w-px h-6 bg-border-medium/60 mx-1" />;

    return (
        <div className={`w-full h-full flex flex-col bg-white dark:bg-zinc-900 transition-all duration-300 ${isFullScreen ? 'live-editor-fullscreen' : ''}`}>
            {/* Toolbar */}
            <div className="bg-surface-secondary/50 backdrop-blur-sm p-2 border-b border-border-medium flex flex-col items-center sticky top-0 z-50 transition-all duration-300 group/toolbar">
                {/* Desktop View */}
                <div className="hidden sm:flex flex-wrap gap-2 items-center justify-center">
                    {editorGroups.map((group, idx) => (
                        <React.Fragment key={group.id}>
                            <div className="flex gap-1.5 items-center">
                                {group.buttons.map((btn, bIdx) => (
                                    <ToolbarButton key={bIdx} {...btn} />
                                ))}
                            </div>
                            {idx < editorGroups.length - 1 && <ToolbarSeparator />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Mobile View */}
                <div className="flex sm:hidden flex-col gap-2 items-center">
                    {editorRows.map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-1.5 items-center justify-center">
                            {row.map((group, gIdx) => (
                                <React.Fragment key={group.id}>
                                    <div className="flex gap-1.5 items-center">
                                        {group.buttons.map((btn, bIdx) => (
                                            <ToolbarButton key={bIdx} {...btn} />
                                        ))}
                                    </div>
                                    {gIdx < row.length - 1 && <ToolbarSeparator />}
                                </React.Fragment>
                            ))}
                        </div>
                    ))}
                </div>
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

            {/* Signature Management Modal */}
            {isSignatureModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-surface-primary rounded-2xl border border-border-medium shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-border-light flex justify-between items-center bg-surface-secondary">
                            <h3 className="font-bold text-text-primary text-sm uppercase">
                                {activeSignatureName && activeSignatureName !== 'DESCONOCIDO'
                                    ? `Insertar Firma: ${activeSignatureName}`
                                    : 'Firmas Digitales'
                                }
                            </h3>
                            <button onClick={() => setIsSignatureModalOpen(false)} className="text-text-tertiary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {Object.keys(namedSignatures).length === 0 ? (
                                <div className="text-center py-8 text-text-tertiary">
                                    <PenTool className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No hay firmas guardadas</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(namedSignatures).map(([name, url]) => (
                                        <div key={name} className="group flex flex-col items-center justify-between border border-border-light rounded-lg p-3 hover:border-blue-500 transition-all cursor-pointer bg-white relative">
                                            <img
                                                src={url}
                                                alt={name}
                                                className="max-h-16 w-auto object-contain mb-2 flex-grow"
                                                onClick={() => insertSignature(url, name)}
                                            />
                                            <div
                                                className="text-[10px] font-bold text-slate-700 text-center uppercase tracking-tight leading-none break-words w-full px-1"
                                                onClick={() => insertSignature(url, name)}
                                            >{name}</div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteSignature(name); }}
                                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
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

            <div className="relative flex-1 overflow-hidden flex flex-col">
                {/* Floating Image Toolbar */}
                {selectedImage && (
                    <div
                        className="image-toolbar absolute z-50 bg-surface-primary dark:bg-zinc-800 shadow-2xl border border-border-medium rounded-lg p-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
                        style={{
                            top: `${Math.max(10, imageToolbarPos.top)}px`,
                            left: `${Math.max(10, Math.min(imageToolbarPos.left, (editorRef.current?.clientWidth || 0) - 300))}px`
                        }}
                    >
                        <div className="flex gap-1 border-r border-border-light pr-1.5 mr-0.5">
                            <button onClick={() => setImageSize('sm')} className="px-2 py-1 hover:bg-surface-hover rounded text-xs font-medium border border-transparent hover:border-border-medium" title="Pequeño">S</button>
                            <button onClick={() => setImageSize('md')} className="px-2 py-1 hover:bg-surface-hover rounded text-xs font-bold border border-transparent hover:border-border-medium" title="Mediano">M</button>
                            <button onClick={() => setImageSize('lg')} className="px-2 py-1 hover:bg-surface-hover rounded text-xs font-medium border border-transparent hover:border-border-medium" title="Grande">L</button>
                            <button onClick={() => setImageSize('full')} className="px-2 py-1 hover:bg-surface-hover rounded text-xs font-medium border border-transparent hover:border-border-medium" title="Ancho Total">W</button>
                        </div>

                        <div className="flex gap-0.5 border-r border-border-light pr-1.5 mr-0.5">
                            <ToolbarButton icon={AlignLeft} onClick={() => setImageAlign('left')} label="Alinear Izquierda / Envolver" />
                            <ToolbarButton icon={AlignCenter} onClick={() => setImageAlign('center')} label="Centrar" />
                            <ToolbarButton icon={AlignRight} onClick={() => setImageAlign('right')} label="Alinear Derecha / Envolver" />
                            <ToolbarButton icon={Move} onClick={() => setImageAlign('none')} label="Restablecer (En línea)" />
                        </div>

                        <div className="flex gap-0.5 border-r border-border-light pr-1.5 mr-0.5">
                            <ToolbarButton icon={ArrowUp} onClick={() => setImageLayer('front')} label="Traer al frente" />
                            <ToolbarButton icon={ArrowDown} onClick={() => setImageLayer('back')} label="Enviar al fondo" />
                        </div>

                        <button
                            onClick={removeImage}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Eliminar imagen"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="p-1.5 text-text-tertiary hover:bg-surface-hover rounded transition-colors"
                            title="Cerrar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Floating Table Toolbar */}
                {selectedTableCell && (
                    <div
                        className="table-toolbar absolute z-50 bg-surface-primary dark:bg-zinc-800 shadow-2xl border border-border-medium rounded-lg p-1.5 flex flex-wrap items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200"
                        style={{
                            top: `${Math.max(10, tableToolbarPos.top)}px`,
                            left: `${Math.max(10, Math.min(tableToolbarPos.left, (editorRef.current?.clientWidth || 0) - 400))}px`
                        }}
                    >
                        <div className="flex gap-0.5 border-r border-border-light pr-1.5 mr-0.5">
                            <ToolbarButton icon={Plus} onClick={() => addTableRow('above')} label="Fila Arriba" />
                            <ToolbarButton icon={Plus} onClick={() => addTableRow('below')} label="Fila Abajo" />
                            <ToolbarButton icon={Trash2} onClick={deleteTableRow} label="Eliminar Fila" />
                        </div>
                        <div className="flex gap-0.5 border-r border-border-light pr-1.5 mr-0.5">
                            <ToolbarButton icon={ChevronRight} onClick={() => addTableCol('right')} label="Columna Derecha" />
                            <ToolbarButton icon={Trash2} onClick={deleteTableCol} label="Eliminar Columna" />
                        </div>
                        <div className="flex gap-0.5 border-r border-border-light pr-1.5 mr-0.5">
                            <ToolbarButton icon={Maximize} onClick={() => resizeColumn('wider')} label="Más Ancho" />
                            <ToolbarButton icon={Minimize} onClick={() => resizeColumn('narrower')} label="Menos Ancho" />
                        </div>
                        <button onClick={deleteTable} className="p-1 px-2 text-red-500 hover:bg-red-50 rounded text-xs font-bold" title="Eliminar Tabla">TABLA</button>
                        <button onClick={() => setSelectedTableCell(null)} className="p-1 text-text-tertiary hover:bg-surface-hover rounded"><X className="w-4 h-4" /></button>
                    </div>
                )}

                {/* Floating Graphic/Progress Toolbar */}
                {selectedGraphic && (
                    <div
                        className="graphic-toolbar absolute z-50 bg-surface-primary dark:bg-zinc-800 shadow-2xl border border-border-medium rounded-lg p-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
                        style={{
                            top: `${Math.max(10, graphicToolbarPos.top)}px`,
                            left: `${Math.max(10, Math.min(graphicToolbarPos.left, (editorRef.current?.clientWidth || 0) - 300))}px`
                        }}
                    >
                        <input
                            type="range"
                            min="0" max="100"
                            defaultValue={parseInt(selectedGraphic.style.width) || 0}
                            onChange={(e) => updateGraphic(parseInt(e.target.value))}
                            className="w-24 accent-blue-600"
                        />
                        <div className="flex gap-1">
                            <button onClick={() => updateGraphic(parseInt(selectedGraphic.style.width), '#22c55e')} className="w-5 h-5 rounded-full bg-green-500 border border-white/20" title="Verde" />
                            <button onClick={() => updateGraphic(parseInt(selectedGraphic.style.width), '#eab308')} className="w-5 h-5 rounded-full bg-yellow-500 border border-white/20" title="Amarillo" />
                            <button onClick={() => updateGraphic(parseInt(selectedGraphic.style.width), '#ef4444')} className="w-5 h-5 rounded-full bg-red-500 border border-white/20" title="Rojo" />
                        </div>
                        <button onClick={() => setSelectedGraphic(null)} className="p-1 text-text-tertiary hover:bg-surface-hover rounded"><X className="w-4 h-4" /></button>
                    </div>
                )}

                {/* Floating Diagram Node Toolbar */}
                {selectedDiagramNode && (
                    <div
                        className="diagram-toolbar absolute z-50 bg-surface-primary shadow-2xl border border-border-medium rounded-lg p-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
                        style={{
                            top: `${Math.max(10, diagramNodeToolbarPos.top)}px`,
                            left: `${Math.max(10, Math.min(diagramNodeToolbarPos.left, (editorRef.current?.clientWidth || 0) - 300))}px`
                        }}
                    >
                        <div className="flex gap-1 border-r border-border-light pr-1.5 mr-0.5">
                            <span className="text-[10px] font-bold text-text-tertiary mr-1 uppercase self-center">Fondo:</span>
                            <button onClick={() => setDiagramNodeColor('#f8fafc', '#111111')} className="w-5 h-5 rounded-full border border-gray-300 bg-[#f8fafc]" title="Gris Claro" />
                            <button onClick={() => setDiagramNodeColor('#fef08a', '#111111')} className="w-5 h-5 rounded-full border border-gray-300 bg-yellow-200" title="Amarillo" />
                            <button onClick={() => setDiagramNodeColor('#fed7aa', '#111111')} className="w-5 h-5 rounded-full border border-gray-300 bg-orange-200" title="Naranja" />
                            <button onClick={() => setDiagramNodeColor('#fca5a5', '#111111')} className="w-5 h-5 rounded-full border border-gray-300 bg-red-300" title="Rojo Claro" />
                            <button onClick={() => setDiagramNodeColor('#bbf7d0', '#111111')} className="w-5 h-5 rounded-full border border-gray-300 bg-green-200" title="Verde Claro" />
                            <button onClick={() => setDiagramNodeColor('#e2e8f0', '#111111')} className="w-5 h-5 rounded-full border border-gray-300 bg-slate-200" title="Gris" />
                        </div>
                        <button
                            onClick={deleteDiagramNode}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar figura"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setSelectedDiagramNode(null)}
                            className="p-1.5 text-text-tertiary hover:bg-surface-hover rounded transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div
                    ref={editorRef}
                    className={`flex-1 p-3 sm:p-8 outline-none overflow-y-auto prose ${!paperMode ? 'dark:prose-invert' : ''} max-w-none w-full live-editor-content ${reportType === 'checklist' ? 'checklist-mode' : ''} ${paperMode ? 'paper-mode' : ''}`}
                    contentEditable
                    onInput={handleInput}
                    suppressContentEditableWarning={true}
                    style={{ minHeight: '100%', maxWidth: '100%' }}
                />
            </div>
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
                    table-layout: auto;
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
                .checklist-mode table th:nth-child(1) { width: 38px; } /* # - Narrowest possible */
                .checklist-mode table th:nth-child(2) { width: 14%; } /* Requisito / Estándar */
                .checklist-mode table th:nth-child(3) { width: 44%; } /* Hallazgo (Evidencia) */
                .checklist-mode table th:nth-child(4) { width: 10%; } /* Tipo */
                .checklist-mode table th:nth-child(5) { width: 15%; } /* Responsable - Wider */

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
                    transition: all 0.2s ease;
                    cursor: pointer;
                    user-select: none;
                    -webkit-user-drag: none;
                }
                .live-editor-content img:hover {
                    outline: 2px solid #3b82f6;
                    outline-offset: 4px;
                }
                .live-editor-content img[data-selected="true"],
                .live-editor-content td[data-selected="true"],
                .live-editor-content th[data-selected="true"],
                .live-editor-content div[data-selected="true"] {
                    outline: 3px solid #3b82f6 !important;
                    outline-offset: -3px;
                    box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.2);
                }
                .live-editor-content td[data-selected="true"],
                .live-editor-content th[data-selected="true"],
                .live-editor-content div.diagram-node[data-selected="true"] {
                    background-color: rgba(59, 130, 246, 0.05) !important;
                }
                .image-toolbar, .table-toolbar, .graphic-toolbar, .diagram-toolbar {
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    backdrop-filter: blur(8px);
                }
                .signature-modal {
                    backdrop-filter: blur(4px);
                }
                .signature-placeholder {
                    transition: all 0.3s ease;
                    position: relative;
                    z-index: 5;
                    pointer-events: auto !important;
                    user-select: none;
                }
                .signature-placeholder * {
                    pointer-events: none; /* Make children non-blocking for click */
                }
                .signature-placeholder:hover {
                    background: rgba(0,77,153,0.1) !important;
                    border-color: #004d99 !important;
                    transform: scale(1.02);
                    box-shadow: 0 4px 12px rgba(0,77,153,0.15);
                }
                
                /* Paper Mode specific */
                .live-editor-content.paper-mode {
                    background-color: #ffffff !important;
                    color: #1e293b !important;
                    padding: 40px !important;
                    min-height: 800px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    border-radius: 8px;
                }
                .dark .live-editor-content.paper-mode {
                    background-color: #ffffff !important;
                    color: #1e293b !important;
                }
                
                /* AI Edit Bubble */
                .ai-edit-bubble {
                    position: fixed;
                    z-index: 9999999;
                }
                @keyframes aiBubblePop {
                    from { opacity: 0; transform: translateX(-50%) scale(0.9) translateY(4px); }
                    to   { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
                }

                .live-editor-fullscreen {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    bottom: 0 !important;
                    right: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    z-index: 999999 !important;
                    background: #fff !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .dark .live-editor-fullscreen {
                    background: #18181b !important;
                }
                .live-editor-fullscreen .live-editor-content {
                    flex: 1;
                    height: calc(100vh - 80px) !important;
                    padding: 8px 12px !important;
                }
                .live-editor-fullscreen .live-editor-content > * {
                    max-width: 100% !important;
                }
                @media (min-width: 640px) {
                    .live-editor-fullscreen .live-editor-content {
                        padding: 24px 40px !important;
                    }
                    .live-editor-fullscreen .live-editor-content > * {
                        max-width: 1000px !important;
                        margin-left: auto !important;
                        margin-right: auto !important;
                    }
                }
            `}</style>

            {/* ✨ AI Bubble (Portaled to avoid overflow clipping) */}
            {aiEditBubble && portalNode && createPortal(
                <div
                    data-ai-bubble="true"
                    className="ai-edit-bubble"
                    style={{ position: 'fixed', left: aiEditBubble.x, top: aiEditBubble.y, zIndex: 9999999 }}
                >
                    {!showAiInput ? (
                        /* Simple pill button */
                        <button
                            data-ai-bubble="true"
                            onClick={() => setShowAiInput(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                color: '#fff', border: 'none', borderRadius: '20px',
                                padding: '6px 14px', fontSize: '0.78em', fontWeight: 700,
                                cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.3px',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                            }}
                        >
                            ✨ Editar con IA
                        </button>
                    ) : (
                        /* Expanded input panel */
                        <div
                            data-ai-bubble="true"
                            style={{
                                background: '#ffffff', borderRadius: '12px', padding: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                                display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '260px',
                            }}
                        >
                            <textarea
                                ref={aiInputRef}
                                data-ai-bubble="true"
                                value={aiEditInstruction}
                                onChange={(e) => setAiEditInstruction(e.target.value)}
                                placeholder="¿Qué deseas cambiar o agregar?"
                                style={{
                                    width: '100%', minHeight: '60px', border: '1px solid #e2e8f0',
                                    borderRadius: '8px', padding: '8px', fontSize: '0.85em',
                                    resize: 'none', outline: 'none', color: '#1e293b'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiEdit(); }
                                    if (e.key === 'Escape') { setAiEditBubble(null); setShowAiInput(false); }
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                    data-ai-bubble="true"
                                    onClick={() => { setAiEditBubble(null); setShowAiInput(false); }}
                                    style={{ background: 'transparent', border: 'none', fontSize: '0.8em', color: '#64748b', cursor: 'pointer' }}
                                > Cancelar </button>
                                <button
                                    data-ai-bubble="true"
                                    onClick={handleAiEdit}
                                    disabled={isAiEditing || !aiEditInstruction.trim()}
                                    style={{
                                        background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px',
                                        padding: '4px 12px', fontSize: '0.8em', fontWeight: 600, cursor: 'pointer',
                                        opacity: (isAiEditing || !aiEditInstruction.trim()) ? 0.5 : 1
                                    }}
                                >
                                    {isAiEditing ? 'Procesando...' : '✨ Aplicar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>,
                portalNode
            )}

        </div>

    );
});

LiveEditor.displayName = 'LiveEditor';

export default LiveEditor;

