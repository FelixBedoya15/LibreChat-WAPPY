import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import cn from '~/utils/cn';

interface CardItem {
  title: string;
  description: string;
  icon?: string;
  badge?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

interface CardLink {
  label: string;
  url: string;
  icon?: string;
}

interface WappyCardProps {
  content: string;
}

interface CardData {
  title: string;
  subtitle?: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
  description?: string;
  badge?: string;
  items?: CardItem[];
  links?: CardLink[];
  footer?: string;
}

// Convert kebab-case or custom naming to PascalCase Lucide Icon safely
const getIcon = (name?: string): React.ComponentType<any> => {
  if (!name) return Icons.HelpCircle;
  
  // Clean name and map common custom names if any
  const cleanName = name.trim();
  
  // Convert kebab-case (e.g., alert-triangle) to PascalCase (AlertTriangle)
  const pascalCase = cleanName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  const Icon = (Icons as any)[pascalCase] || (Icons as any)[cleanName];
  if (Icon) return Icon;

  // Search case-insensitively for a match
  const lowerName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const keys = Object.keys(Icons);
  for (const key of keys) {
    if (key.toLowerCase() === lowerName) {
      return (Icons as any)[key];
    }
  }

  // Common fallbacks for safety
  if (lowerName.includes('alert') || lowerName.includes('warning')) return Icons.AlertTriangle;
  if (lowerName.includes('check') || lowerName.includes('success')) return Icons.CheckCircle2;
  if (lowerName.includes('danger') || lowerName.includes('shield')) return Icons.ShieldAlert;
  if (lowerName.includes('info')) return Icons.Info;
  if (lowerName.includes('link') || lowerName.includes('url')) return Icons.ExternalLink;

  return Icons.HelpCircle;
};

// Safe and highly tolerant JSON parser for AI outputs
const parseTolerantJson = (text: string): CardData | null => {
  let cleaned = text.trim();
  
  // Remove markdown wrapping if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z-]*\n/, '').replace(/\n```$/, '');
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as CardData;
  } catch (e) {
    // Attempt standard cleanups for slightly malformed JSON (trailing commas, comments)
    try {
      let repair = cleaned
        // Remove single-line comments
        .replace(/\/\/.+$/gm, '')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove trailing commas before closing braces/brackets
        .replace(/,(\s*[}\]])/g, '$1');
      return JSON.parse(repair) as CardData;
    } catch (err) {
      console.error('Error parsing card JSON:', err);
      return null;
    }
  }
};

const THEMES = {
  primary: {
    bg: 'bg-indigo-50/40 dark:bg-indigo-950/15',
    border: 'border-indigo-100 dark:border-indigo-900/40',
    text: 'text-indigo-900 dark:text-indigo-100',
    iconBg: 'bg-indigo-100/80 dark:bg-indigo-900/60',
    iconText: 'text-indigo-600 dark:text-indigo-300',
    badge: 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50',
    glow: 'shadow-indigo-500/5',
    accent: 'bg-indigo-600 dark:bg-indigo-500'
  },
  success: {
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/15',
    border: 'border-emerald-100 dark:border-emerald-900/40',
    text: 'text-emerald-900 dark:text-emerald-100',
    iconBg: 'bg-emerald-100/80 dark:bg-emerald-900/60',
    iconText: 'text-emerald-600 dark:text-emerald-300',
    badge: 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
    glow: 'shadow-emerald-500/5',
    accent: 'bg-emerald-600 dark:bg-emerald-500'
  },
  warning: {
    bg: 'bg-amber-50/40 dark:bg-amber-950/15',
    border: 'border-amber-100 dark:border-amber-900/40',
    text: 'text-amber-900 dark:text-amber-100',
    iconBg: 'bg-amber-100/80 dark:bg-amber-900/60',
    iconText: 'text-amber-600 dark:text-amber-300',
    badge: 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50',
    glow: 'shadow-amber-500/5',
    accent: 'bg-amber-600 dark:bg-amber-500'
  },
  danger: {
    bg: 'bg-rose-50/40 dark:bg-rose-950/15',
    border: 'border-rose-100 dark:border-rose-900/40',
    text: 'text-rose-900 dark:text-rose-100',
    iconBg: 'bg-rose-100/80 dark:bg-rose-900/60',
    iconText: 'text-rose-600 dark:text-rose-300',
    badge: 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50',
    glow: 'shadow-rose-500/5',
    accent: 'bg-rose-600 dark:bg-rose-500'
  },
  info: {
    bg: 'bg-sky-50/40 dark:bg-sky-950/15',
    border: 'border-sky-100 dark:border-sky-900/40',
    text: 'text-sky-900 dark:text-sky-100',
    iconBg: 'bg-sky-100/80 dark:bg-sky-900/60',
    iconText: 'text-sky-600 dark:text-sky-300',
    badge: 'bg-sky-100/80 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50',
    glow: 'shadow-sky-500/5',
    accent: 'bg-sky-600 dark:bg-sky-500'
  }
};

export const WappyCard: React.FC<WappyCardProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(true);
  const data = parseTolerantJson(content);

  if (!data) {
    // Elegant fallback rendering if JSON parse fails completely
    return (
      <div className="my-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-950 dark:bg-red-950/20 dark:text-red-300">
        <div className="flex items-center gap-2 font-semibold">
          <Icons.AlertOctagon className="h-5 w-5 text-red-500" />
          <span>Error al procesar la tarjeta interactiva</span>
        </div>
        <p className="mt-1 text-xs opacity-90">El bloque de datos no tiene una estructura JSON válida.</p>
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-red-100/50 p-2 font-mono text-[10px] text-red-900 dark:bg-red-900/30 dark:text-red-200">
          {content}
        </pre>
      </div>
    );
  }

  const themeType = data.type || 'primary';
  const theme = THEMES[themeType] || THEMES.primary;
  const CardIcon = getIcon(data.icon || 'Shield');

  return (
    <div className={cn(
      "w-full my-3 rounded-2xl border transition-all duration-300",
      theme.bg,
      theme.border,
      theme.glow,
      "shadow-sm hover:shadow-md backdrop-blur-[2px]"
    )}>
      {/* CARD HEADER */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer select-none rounded-t-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("p-2 rounded-xl shrink-0 transition-transform duration-300 hover:scale-105", theme.iconBg, theme.iconText)}>
            <CardIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn("font-semibold text-sm leading-snug tracking-wide", theme.text)}>
                {data.title}
              </h3>
              {data.badge && (
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0", theme.badge)}>
                  {data.badge}
                </span>
              )}
            </div>
            {data.subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                {data.subtitle}
              </p>
            )}
          </div>
        </div>
        <button 
          type="button"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 ml-2"
        >
          {isOpen ? (
            <Icons.ChevronUp className="h-4 w-4" />
          ) : (
            <Icons.ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* CARD BODY CONTENT */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 animate-fadeIn duration-200">
          <div className="h-[1px] w-full bg-black/5 dark:bg-white/10 mb-3" />
          
          {data.description && (
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {data.description}
            </p>
          )}

          {/* RENDER ITEMS */}
          {data.items && data.items.length > 0 && (
            <div className="grid grid-cols-1 gap-2.5 mb-4">
              {data.items.map((item, idx) => {
                const ItemIcon = getIcon(item.icon);
                const itemTheme = item.color ? THEMES[item.color] : theme;
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "flex gap-3 p-3 rounded-xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0 h-fit transition-transform group-hover:scale-105", 
                      itemTheme.iconBg, 
                      itemTheme.iconText
                    )}>
                      <ItemIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                          {item.title}
                        </h4>
                        {item.badge && (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0", itemTheme.badge)}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-normal">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* RENDER LINKS / ACTIONS */}
          {data.links && data.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5 dark:border-white/10">
              {data.links.map((link, idx) => {
                const LinkIcon = getIcon(link.icon || 'ExternalLink');
                return (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all duration-200",
                      "bg-white/80 dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-700 dark:text-gray-200 shadow-sm",
                      "hover:-translate-y-0.5 active:translate-y-0"
                    )}
                  >
                    <LinkIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>
          )}

          {/* FOOTER */}
          {data.footer && (
            <div className="mt-3 text-[10px] text-gray-400 dark:text-gray-500 border-t border-black/5 dark:border-white/10 pt-2 text-right italic font-medium">
              {data.footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
