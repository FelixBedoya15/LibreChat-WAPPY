import React from 'react';
import NavLink from './NavLink';
import { ClipboardCheck } from 'lucide-react';

export default function AuditoriaButton({
  toggleNav,
  isSmallScreen,
  isCollapsed,
}: {
  toggleNav: () => void;
  isSmallScreen: boolean;
  isCollapsed: boolean;
}) {
  const clickHandler = () => {
    if (isSmallScreen) {
      toggleNav();
    }
  };

  const Icon = () => <ClipboardCheck className="icon-md mr-1" />;

  return (
    <NavLink
      className="transition-colors duration-200"
      svg={Icon}
      text={
        <span className="font-semibold text-text-primary text-[13px]">Informe de Auditoría</span>
      }
      clickHandler={clickHandler}
      to="/auditoria"
      isCollapsed={isCollapsed}
      description="Informe de Auditoría"
    />
  );
}
