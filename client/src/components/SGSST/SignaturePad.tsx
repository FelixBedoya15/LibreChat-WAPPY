import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (base64: string) => void;
    title?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ isOpen, onClose, onSave, title = "Dibujar Firma" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Prevent scrolling while drawing.
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Setup canvas size
    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            // Timeout to allow DOM measurement
            setTimeout(() => {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.scale(ratio, ratio);
                    ctx.lineCap = 'round';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 3;
                }
            }, 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        // e.preventDefault() helps prevent scrolling but might warn on iOS.
        // We use touch-action: none on the canvas which is usually enough for modern browsers.
        if (e.cancelable) e.preventDefault();
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const { x, y } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        if (e.cancelable) e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const { x, y } = getCoordinates(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const base64 = canvas.toDataURL('image/png');
        onSave(base64);
        onClose();
    };

    const targetNode = document.fullscreenElement || document.body;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 touch-none">
            <div className="bg-white dark:bg-surface-secondary w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-border-light flex justify-between items-center bg-surface-tertiary">
                    <h3 className="font-bold text-lg text-text-primary">{title}</h3>
                    <button onClick={onClose} className="p-1.5 text-text-tertiary hover:bg-surface-hover rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-black/20 flex-1 relative">
                    <div className="w-full h-64 bg-white dark:bg-surface-primary rounded-xl border-2 border-dashed border-border-medium relative overflow-hidden shadow-inner touch-none">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseOut={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            onTouchCancel={stopDrawing}
                            className="w-full h-full cursor-crosshair touch-none absolute inset-0 z-10"
                            style={{ touchAction: 'none' }}
                        />
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end px-8 pb-8 opacity-20 z-0">
                            <div className="border-b-2 border-slate-500 dark:border-slate-300 w-full mb-1"></div>
                            <span className="text-center font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300 text-xs">Firme aquí</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border-light bg-surface-tertiary flex gap-3 justify-end items-center">
                    <button onClick={clearCanvas} className="mr-auto px-4 py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors text-sm">
                        <Eraser size={16} /> Limpiar
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-lg font-medium transition-colors text-sm shadow-sm">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors text-sm focus:ring focus:ring-teal-500/50 shadow-sm">
                        <Check size={16} /> Guardar Firma
                    </button>
                </div>
            </div>
        </div>,
        targetNode
    );
};

export default SignaturePad;
