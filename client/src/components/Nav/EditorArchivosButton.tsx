import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileEdit } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface Props {
  isSmallScreen?: boolean;
  isCollapsed?: boolean;
  toggleNav?: () => void;
}

const EditorArchivosButton = ({
  isSmallScreen = false,
  isCollapsed = false,
  toggleNav,
}: Props) => {
  const localize = useLocalize();

  const clickHandler = () => {
    if (isSmallScreen && toggleNav) {
      toggleNav();
    }
  };

  return (
    <NavLink
      to="/editor-archivos"
      onClick={clickHandler}
      className={({ isActive }) =>
        `group relative flex w-full items-center gap-2 rounded-xl border border-transparent p-2.5 text-sm transition-all duration-300 ease-in-out hover:bg-surface-hover ${
          isActive
            ? 'active-nav-link bg-surface-secondary shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-[#10b981]/30 before:absolute before:left-0 before:top-[10%] before:h-[80%] before:w-1 before:rounded-r-md before:bg-[#10b981]'
            : 'text-text-secondary hover:text-text-primary'
        } ${isCollapsed ? 'justify-center border-border-medium/50 hover:border-[#10b981]/50' : ''}`
      }
    >
      <div className={`relative flex items-center justify-center ${isCollapsed ? '' : 'p-1 rounded-lg group-hover:bg-[#10b981]/10 transition-colors'}`}>
        <FileEdit className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${!isCollapsed ? 'group-hover:text-[#10b981]' : ''}`} />
      </div>

      {!isCollapsed && (
        <div className="flex w-full min-w-0 flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-primary text-[13px]">Editor de Archivos</span>
          </div>
          <span className="truncate text-[11px] font-medium text-text-secondary/70">
            Convierte y Edita Documentos
          </span>
        </div>
      )}
    </NavLink>
  );
};

export default EditorArchivosButton;
