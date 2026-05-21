import React, { useRef, useEffect } from 'react';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';

interface CanvasTextEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
  reportSourceData?: any;
  isMaximized?: boolean;
}

const CanvasTextEditor: React.FC<CanvasTextEditorProps> = ({ initialContent, onUpdate, reportSourceData, isMaximized }) => {
  const liveEditorRef = useRef<LiveEditorHandle>(null);

  // Sync content updates imperatively if content changes from outside (e.g. backend polling)
  useEffect(() => {
    if (initialContent && liveEditorRef.current) {
      liveEditorRef.current.setHTML(initialContent);
    }
  }, [initialContent]);

  return (
    <div className="flex-1 h-full overflow-hidden bg-surface-primary border border-border-medium rounded-2xl shadow-sm">
      <LiveEditor
        ref={liveEditorRef}
        initialContent={initialContent}
        onUpdate={onUpdate}
        reportType="general"
        paperMode={true}
        hideFullscreen={true} // Fullscreen handled by the outer Canvas container
        reportSourceData={reportSourceData}
        hideToolbarWhenCollapsed={!isMaximized}
      />
    </div>
  );
};

export default CanvasTextEditor;
