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
        <Button
          size="icon"
          variant="outline"
          data-testid="open-sidebar-button"
          aria-label={localize('com_nav_open_sidebar')}
          className={cn(
            'rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-teal-400 active:scale-95 transition-all cursor-pointer p-2',
            className,
          )}
          onClick={() =>
            setNavVisible((prev) => {
              localStorage.setItem('navVisible', JSON.stringify(!prev));
              return !prev;
            })
          }
        >
          <Sidebar />
        </Button>
      }
    />
  );
}
