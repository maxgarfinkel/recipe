import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import api from '../api.ts';

export function AuthInterceptor() {
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const interceptorId = api.interceptors.request.use(async (config) => {
            const token = await getAccessTokenSilently();
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
        return () => api.interceptors.request.eject(interceptorId);
    }, [getAccessTokenSilently]);

    return null;
}
