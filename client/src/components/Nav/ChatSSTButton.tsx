import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { cn } from '~/utils';

export default function ChatSSTButton({
    toggleNav,
    isSmallScreen,
    isCollapsed,
}: {
    toggleNav: () => void;
    isSmallScreen?: boolean;
    isCollapsed?: boolean;
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname.startsWith('/chat-sst');

    const handleClick = () => {
        navigate('/chat-sst');
        if (isSmallScreen) {
            toggleNav();
        }
    };

    if (isCollapsed) {
        return (
            <TooltipAnchor
              description="Chat SST"
              side="right"
              render={
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClick}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 shadow-sm",
                    isActive
                      ? "bg-green-100/50 border-green-500 text-green-600"
                      : "bg-surface-primary border-border-medium/50 hover:bg-surface-hover hover:border-green-500 text-text-primary"
                  )}
                >
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </motion.button>
              }
            />
        );
    }

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={cn(
                "group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 shadow-sm",
                isActive
                    ? "bg-green-50/50 border-green-500/50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                    : "bg-white dark:bg-surface-primary border-border-medium/30 hover:bg-surface-hover hover:border-green-500 text-text-secondary hover:text-green-600"
            )}
        >
            <MessageCircle className="h-4 w-4 shrink-0 text-green-500" />
            <span className="font-semibold text-text-primary text-[13px]">Chat SST</span>
        </motion.button>
    );
}
