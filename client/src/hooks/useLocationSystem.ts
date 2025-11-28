import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import store from '~/store';

const useLocationSystem = () => {
    const enableLocation = useRecoilValue(store.enableLocation);
    const [userLocation, setUserLocation] = useRecoilState(store.userLocation);

    useEffect(() => {
        if (!enableLocation) {
            setUserLocation(null);
            return;
        }

        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by this browser.');
            return;
        }

        const success = (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            setUserLocation(`User Location: Latitude ${latitude}, Longitude ${longitude}`);
        };

        const error = (err: GeolocationPositionError) => {
            console.warn(`Geolocation error: ${err.code} - ${err.message}`);
        };

        navigator.geolocation.getCurrentPosition(success, error);

        // Optional: Watch position for updates
        // const watchId = navigator.geolocation.watchPosition(success, error);
        // return () => navigator.geolocation.clearWatch(watchId);
    }, [enableLocation, setUserLocation]);

    return userLocation;
};

export default useLocationSystem;
