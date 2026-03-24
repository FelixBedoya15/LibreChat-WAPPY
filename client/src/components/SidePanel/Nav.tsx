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
                            "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 shadow-sm mb-2 sm:hover:scale-105 sm:hover:-rotate-3",
                            variant === 'default' 
                              ? "bg-teal-100/50 border-teal-400 text-teal-600 shadow-inner" 
                              : "bg-surface-primary border-border-medium/50 hover:bg-surface-hover hover:border-teal-400 text-text-primary"
                          )}
                        >
                          <link.icon className="h-5 w-5" />
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
                      <AccordionItem value={link.id} className="w-full border-none mb-2">
                        <AccordionPrimitive.Header asChild>
                          <AccordionPrimitive.Trigger asChild>
                            <motion.button
                              whileHover={{ scale: 1.02, rotate: -1, zIndex: 10 }}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "group flex w-full items-center gap-3 rounded-xl border p-3 text-sm transition-all duration-300 shadow-sm",
                                active === link.id
                                  ? "bg-teal-50/50 border-teal-400/50 text-teal-700 shadow-inner"
                                  : "bg-white dark:bg-surface-primary border-border-medium/30 hover:bg-surface-hover hover:border-teal-400 text-text-secondary hover:text-teal-600"
                              )}
                              onClick={(e) => {
                                if (link.onClick) {
                                  link.onClick(e);
                                  setActive('');
                                }
                              }}
                            >
                              <div className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                                active === link.id
                                  ? "bg-white border-teal-200 text-teal-600 shadow-sm"
                                  : "bg-surface-secondary border-border-medium/50 group-hover:border-teal-200 text-text-tertiary group-hover:text-teal-500"
                              )}>
                                <link.icon className="h-5 w-5" />
                              </div>
                              <span className="font-bold tracking-tight text-text-primary text-[13px]">{localize(link.title)}</span>
                              {link.label != null && link.label && (
                                <span
                                  className={cn(
                                    'ml-auto text-[10px] font-bold uppercase tracking-widest opacity-80 transition-all duration-300 ease-in-out',
                                    active === link.id ? 'text-teal-600' : 'text-text-tertiary group-hover:text-teal-500',
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
