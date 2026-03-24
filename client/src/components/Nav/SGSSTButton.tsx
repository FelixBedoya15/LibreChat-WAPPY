import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { cn } from '~/utils';

export default function SGSSTButton({
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
    const isActive = location.pathname.startsWith('/sgsst');

    const handleClick = () => {
        navigate('/sgsst');
        if (isSmallScreen) {
            toggleNav();
        }
    };

    return (
        <motion.button
            whileTap="tap"
            onClick={handleClick}
            className={cn(
                "group relative flex items-center h-11 px-3 w-full gap-3 transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl sm:hover:scale-[1.02] sm:hover:-rotate-1",
                isActive 
                    ? "bg-teal-50 border-teal-400 text-teal-600" 
                    : "bg-white dark:bg-gray-800 border-border-medium hover:bg-surface-hover text-text-primary",
                isCollapsed && "justify-center px-0"
            )}
        >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                <AnimatedIcon name="shield" size={18} className={cn(isActive ? "text-teal-600" : "text-text-secondary group-hover:text-teal-500")} />
            </div>
            {!isCollapsed && <span className="text-sm font-semibold leading-tight mt-0.5">Gestor SG-SST</span>}
            {isCollapsed && (
                <div className="hidden sm:flex absolute left-full ml-3 items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-teal-600 text-white px-3 py-2 rounded-lg shadow-2xl pointer-events-none z-[110]">
                    <span className="text-xs font-semibold">Gestor SG-SST</span>
                </div>
            )}
        </motion.button>
    );
}
