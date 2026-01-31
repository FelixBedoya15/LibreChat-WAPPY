import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useLocalize } from '~/hooks';
import NavLink from './NavLink';

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
        <NavLink
            className={isActive ? 'bg-surface-tertiary' : ''}
            clickHandler={handleClick}
            svg={() => <ShieldCheck className="icon-md" />}
            text="Gestor SG-SST"
        />
    );
}
