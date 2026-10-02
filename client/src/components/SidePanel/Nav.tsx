import { motion } from 'framer-motion';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import {
  AccordionContent,
  AccordionItem,
  TooltipAnchor,
  Accordion,
  Button,
} from '@librechat/client';
import type { NavLink, NavProps } from '~/common';
import { ActivePanelProvider, useActivePanel } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

function NavContent({ links, isCollapsed, resize }: Omit<NavProps, 'defaultActive'>) {
  const localize = useLocalize();
  const { active, setActive } = useActivePanel();
  const getVariant = (link: NavLink) => (link.id === active ? 'default' : 'ghost');

  return (
    <div
      data-collapsed={isCollapsed}
      className="bg-token-sidebar-surface-primary hide-scrollbar group flex-shrink-0 overflow-x-hidden"
    >
      <div className="h-full">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-full min-h-0 flex-col opacity-100 transition-opacity">
            <div className="scrollbar-trigger relative h-full w-full flex-1 items-start border-white/20">
              <div className="flex h-full w-full flex-col gap-1 px-3 py-2.5 group-[[data-collapsed=true]]:items-center group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-0">
                {links.map((link, index) => {
                  const variant = getVariant(link);
                  return isCollapsed ? (
                    <TooltipAnchor
                      description={localize(link.title)}
                      side="left"
                      key={`nav-link-${index}`}
                      render={
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            if (link.onClick) {
                              link.onClick(e);
                              setActive('');
                              return;
                            }
                            setActive(link.id);
                            resize && resize(25);
                          }}
                          className={cn(
                            "w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 shadow-2xs mb-1.5 active:scale-95 cursor-pointer",
                            variant === 'default' 
                              ? "bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs" 
                              : "border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-teal-400"
                          )}
                        >
                          <link.icon className="h-4.5 w-4.5" />
                          <span className="sr-only">{localize(link.title)}</span>
                        </motion.button>
                      }
                    />
                  ) : (
                    <Accordion
                      key={index}
                      type="single"
                      value={active}
                      onValueChange={setActive}
                      collapsible
                      className="w-full"
                    >
                      <AccordionItem value={link.id} className="w-full border-none mb-1.5">
                        <AccordionPrimitive.Header asChild>
                          <AccordionPrimitive.Trigger asChild>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "group flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-all duration-200 shadow-2xs cursor-pointer",
                                active === link.id
                                  ? "bg-teal-50/90 dark:bg-teal-950/60 border-teal-500/40 text-teal-800 dark:text-teal-200 font-bold shadow-xs"
                                  : "bg-white dark:bg-zinc-800/80 border-slate-200/80 dark:border-zinc-700/80 hover:bg-slate-50 dark:hover:bg-zinc-700/80 hover:border-teal-400 text-slate-700 dark:text-zinc-300 hover:text-teal-600"
                              )}
                              onClick={(e) => {
                                if (link.onClick) {
                                  link.onClick(e);
                                  setActive('');
                                }
                              }}
                            >
                              <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                                active === link.id
                                  ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                                  : "bg-slate-100 dark:bg-zinc-700/50 border-slate-200/60 dark:border-zinc-600/60 group-hover:border-teal-300 text-slate-500 dark:text-zinc-400 group-hover:text-teal-600"
                              )}>
                                <link.icon className="h-4 w-4" />
                              </div>
                              <span className="font-bold tracking-tight text-slate-900 dark:text-zinc-100 text-xs">{localize(link.title)}</span>
                              {link.label != null && link.label && (
                                <span
                                  className={cn(
                                    'ml-auto text-[10px] font-bold uppercase tracking-widest opacity-90 transition-all duration-200 ease-in-out',
                                    active === link.id ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-zinc-500 group-hover:text-teal-500',
                                  )}
                                >
                                  {link.label}
                                </span>
                              )}
                            </motion.button>
                          </AccordionPrimitive.Trigger>
                        </AccordionPrimitive.Header>
                        <AccordionContent className="w-full text-text-primary">
                          {link.Component && <link.Component />}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Nav({ links, isCollapsed, resize, defaultActive }: NavProps) {
  return (
    <ActivePanelProvider defaultActive={defaultActive}>
      <NavContent links={links} isCollapsed={isCollapsed} resize={resize} />
    </ActivePanelProvider>
  );
}
