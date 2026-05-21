import React, { useState, useEffect, useRef } from 'react';
import { Eye, Code2, Download, Play, Split } from 'lucide-react';

interface CanvasHtmlEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
  title: string;
  isMaximized?: boolean;
  onRegisterDownload?: (fn: () => void) => void;
}

const CanvasHtmlEditor: React.FC<CanvasHtmlEditorProps> = ({ initialContent, onUpdate, title, isMaximized = false, onRegisterDownload }) => {
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'split' | 'code' | 'preview'>(isMaximized ? 'split' : 'code');

  // Safely fallback activeTab to "code" if not maximized and currently in "split"
  useEffect(() => {
    if (!isMaximized && activeTab === 'split') {
      setActiveTab('code');
    }
  }, [isMaximized, activeTab]);

  // Load content
  useEffect(() => {
    if (initialContent) {
      setCode(initialContent);
    } else {
      setCode(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plantilla Informativa SST</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 30px;
      background: #f4f7f6;
      color: #333;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      max-width: 600px;
      margin: auto;
    }
    h1 {
      color: #0f766e;
      margin-top: 0;
    }
    .btn {
      display: inline-block;
      background: #0f766e;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>¡Hola desde Wappy Canvas!</h1>
    <p>Este es un prototipo interactivo en HTML. Puedes editar el código de la izquierda y ver los cambios renderizados a la derecha en tiempo real.</p>
    <a href="#" class="btn">Empezar Inspección</a>
  </div>
</body>
</html>`);
    }
  }, [initialContent]);



  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);
    onUpdate(val);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'canvas-preview'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (onRegisterDownload) {
      onRegisterDownload(handleDownloadHtml);
    }
  }, [onRegisterDownload, code, title]);

  return (
    <div className="flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden">
      {/* Editor Menu & Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border-medium bg-surface-secondary">
        {/* Split/Code/Preview tabs switcher */}
        <div className="flex items-center gap-1 bg-surface-primary border border-border-medium rounded-xl p-1 shadow-sm">
          {isMaximized && (
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'split' ? 'bg-surface-secondary text-text-primary shadow-inner font-bold' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <Split className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dividido</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'code' ? 'bg-surface-secondary text-text-primary shadow-inner font-bold' : 'text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Código</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'preview' ? 'bg-surface-secondary text-text-primary shadow-inner font-bold' : 'text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Vista Previa</span>
          </button>
        </div>

        <button
          onClick={handleDownloadHtml}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Descargar HTML</span>
        </button>
      </div>

      {/* Main Splitscreen Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Code Editor */}
        {(activeTab === 'split' || activeTab === 'code') && (
          <div className="flex-1 h-full relative border-r border-border-medium">
            <textarea
              value={code}
              onChange={handleCodeChange}
              className="w-full h-full p-4 font-mono text-xs bg-slate-950 text-slate-200 resize-none outline-none leading-relaxed overflow-auto"
              spellCheck="false"
              placeholder="Introduce tu código HTML/CSS/JS aquí..."
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 rounded-lg shadow">
              <Play className="h-3 w-3 text-green-500" />
              <span>Auto-refreshing</span>
            </div>
          </div>
        )}

        {/* Right Side: Iframe Live Preview */}
        {(activeTab === 'split' || activeTab === 'preview') && (
          <div className="flex-1 h-full bg-white relative">
            <iframe
              title="Canvas Live View"
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts"
              srcDoc={code}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasHtmlEditor;
