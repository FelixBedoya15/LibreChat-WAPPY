import React, { useEffect, useState } from 'react';
import AdCarousel from './AdCarousel';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';

const AdPanel: React.FC = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await fetch('/api/ads');
                if (response.ok) {
                    const data = await response.json();
                    setAds(data);
                }
            } catch (error) {
                console.error('Failed to fetch ads:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    if (loading || ads.length === 0) {
        return null;
    }

    return (
        <div className="px-3 pb-4">
            <AdCarousel ads={ads} />
        </div>
    );
};

export default AdPanel;
