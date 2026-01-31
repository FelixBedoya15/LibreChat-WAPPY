import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { TooltipAnchor, Button } from '@librechat/client';

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
        <TooltipAnchor
            description="Gestor SG-SST"
            render={
                <Button
                    variant="outline"
                    data-testid="nav-sgsst-button"
                    aria-label="Gestor SG-SST"
                    className={`rounded-full border-none p-2 hover:bg-surface-hover md:rounded-xl ${isActive ? 'bg-surface-tertiary text-text-primary' : 'bg-transparent text-text-secondary'}`}
                    onClick={handleClick}
                >
                    <ShieldCheck className="icon-lg" />
                </Button>
            }
        />
    );
}
