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
            whileTap="tap"
            onClick={handleClick}
            className={cn(
                "group relative flex items-center h-10 px-3 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl w-full gap-3",
                isActive 
                    ? "bg-teal-100/50 border-teal-400 text-teal-600 shadow-inner" 
                    : "bg-surface-secondary border-border-medium hover:bg-surface-hover hover:border-teal-400 text-text-primary"
            )}
        >
            <div className="relative flex-shrink-0 flex items-center justify-center">
                <AnimatedIcon name="shield" size={20} className={cn(isActive ? "text-teal-600" : "text-text-secondary group-hover:text-teal-500")} />
            </div>
            <span className="text-sm font-medium leading-tight">Gestor SG-SST</span>
        </motion.button>
    );
}
