import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import { motion } from 'framer-motion';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { cn } from '~/utils';

export default function SGSSTButton({
    isSmallScreen,
    toggleNav,
}: {
    isSmallScreen: boolean;
    toggleNav: () => void;
}) {
    const localize = useLocalize();
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = () => {
        if (isSmallScreen) {
            toggleNav();
        }
        navigate('/sgsst');
    };

    const isActive = location.pathname === '/sgsst';

    return (
        <motion.button
            whileHover={{ scale: 1.05, rotate: -3, zIndex: 100 }}
            whileTap="tap"
            onClick={handleClick}
            className={cn(
                "group relative flex items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:scale-105",
                isActive 
                    ? "bg-teal-100/50 border-teal-400 text-teal-600 shadow-inner" 
                    : "bg-surface-primary border-border-medium hover:bg-surface-hover hover:border-teal-400 text-text-primary"
            )}
        >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                <AnimatedIcon name="shield" size={20} />
            </div>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap bg-surface-primary/95 backdrop-blur-md border border-teal-400/50 px-3 py-1.5 rounded-lg shadow-xl pointer-events-none z-[110]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Gestor SST</span>
            </div>
        </motion.button>
    );
}
