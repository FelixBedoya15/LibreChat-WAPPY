import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useToastContext } from '@librechat/client';
import store from '~/store';

const useLocationSystem = () => {
    const { showToast } = useToastContext();
    const enableLocation = useRecoilValue(store.enableLocation);
    const [userLocation, setUserLocation] = useRecoilState(store.userLocation);

    useEffect(() => {
        if (!enableLocation) {
            setUserLocation(null);
            return;
        }

        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by this browser.');
            showToast({ message: 'Geolocation is not supported by this browser', status: 'error' });
            return;
        }

        // Check if permission is already denied to avoid spamming or silent fails
        // Note: 'permissions' API is not supported in all browsers, so we keep it simple for now
        // but we will add a toast to let the user know we are trying.

        const success = async (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;

            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();

                if (data && data.address) {
                    const { country, city, town, village, state } = data.address;
                    const locationName = city || town || village || state || 'Unknown Location';
                    const locationString = `User Location: ${country}, ${locationName} (Lat: ${latitude}, Long: ${longitude})`;
                    setUserLocation(locationString);
                    console.log('Location acquired:', locationString);
                } else {
                    const locationString = `User Location: Latitude ${latitude}, Longitude ${longitude}`;
                    setUserLocation(locationString);
                }
            } catch (error) {
                console.error('Error fetching address:', error);
                const locationString = `User Location: Latitude ${latitude}, Longitude ${longitude}`;
                setUserLocation(locationString);
            }
        };

        const error = (err: GeolocationPositionError) => {
            console.warn(`Geolocation error: ${err.code} - ${err.message}`);
            // Only show toast for permission denied, as timeout/unavailable might be transient
            if (err.code === err.PERMISSION_DENIED) {
                showToast({ message: 'Location permission denied. Please enable it in your browser settings.', status: 'error' });
            }
        };

        const options = {
            enableHighAccuracy: false, // Use WiFi/Cell triangulation for speed and stability
            timeout: 15000, // 15 seconds
            maximumAge: 600000, // 10 minutes cache
        };

        navigator.geolocation.getCurrentPosition(success, error, options);

    }, [enableLocation, setUserLocation, showToast]);

    return userLocation;
};

export default useLocationSystem;
