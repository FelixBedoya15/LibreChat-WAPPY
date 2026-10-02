import { TooltipAnchor, Button, Sidebar } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

export default function OpenSidebar({
  setNavVisible,
  className,
}: {
  setNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}) {
  const localize = useLocalize();
  return (
    <TooltipAnchor
      description={localize('com_nav_open_sidebar')}
      render={
        <button
          type="button"
          data-testid="open-sidebar-button"
          aria-label={localize('com_nav_open_sidebar')}
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-teal-400 active:scale-95 shadow-2xs transition-all cursor-pointer',
            className,
          )}
          onClick={() =>
            setNavVisible((prev) => {
              localStorage.setItem('navVisible', JSON.stringify(!prev));
              return !prev;
            })
          }
        >
          <Sidebar className="h-4.5 w-4.5" />
        </button>
      }
    />
  );
}
