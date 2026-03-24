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
            whileHover="hover"
            whileTap="tap"
            onClick={handleClick}
            className={cn(
                "group flex items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105",
                isActive 
                    ? "bg-teal-100/50 border-teal-400 text-teal-600 shadow-inner" 
                    : "bg-surface-primary border-border-medium hover:bg-surface-hover hover:border-teal-400 text-text-primary"
            )}
        >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                <AnimatedIcon name="shield" size={20} />
            </div>
            <div className={cn(
                "flex items-center max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-in-out whitespace-nowrap",
                "group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2"
            )}>
                <span className="text-[10px] font-bold uppercase tracking-wider">Gestor SST</span>
            </div>
        </motion.button>
    );
}
