import { useState, useEffect } from 'react';
import { StravaAuthentication } from '../strava/StravaModels';
import { StravaService } from '../strava/StravaService';
import { saveStravaAuth, loadStravaAuth, clearStravaAuth } from '../strava/CookieUtils';

export function useStrava() {
    const [stravaAuth, setStravaAuth] = useState<StravaAuthentication | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        const restoreAuth = async () => {
            const stored = loadStravaAuth();
            if (!stored) return;

            let auth: StravaAuthentication;
            try {
                auth = StravaAuthentication.fromJSON(stored);
            } catch {
                clearStravaAuth();
                return;
            }

            if (auth.isTokenExpired()) {
                const refreshed = await StravaService.RefreshAccessToken(auth.refresh_token, auth.athlete);
                if (refreshed) {
                    auth = refreshed;
                    saveStravaAuth(auth);
                } else {
                    clearStravaAuth();
                    return;
                }
            }
            setStravaAuth(auth);
        };

        restoreAuth();
    }, []);

    const connect = async () => {
        setIsConnecting(true);
        const auth = await StravaService.ConnectToStrava();
        setStravaAuth(auth);
        setIsConnecting(false);
        if (auth) {
            saveStravaAuth(auth);
        }
    };

    const disconnect = () => {
        clearStravaAuth();
        setStravaAuth(null);
    };

    return {
        stravaAuth,
        isConnecting,
        connect,
        disconnect
    };
}
