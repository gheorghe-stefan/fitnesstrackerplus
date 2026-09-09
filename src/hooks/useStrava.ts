import { useState, useEffect, useCallback } from 'react';
import { StravaAuthentication } from '../strava/StravaModels';
import { StravaService } from '../strava/StravaService';
import { saveStravaAccounts, loadStravaAccounts, clearStravaAuth } from '../strava/CookieUtils';

export interface UseStravaResult {
    stravaAuth: StravaAuthentication | null;
    accounts: StravaAuthentication[];
    activeAthleteId: number | null;
    isConnecting: boolean;
    connect: () => Promise<void>;
    selectAccount: (athleteId: number) => Promise<void>;
    removeAccount: (athleteId: number) => void;
    disconnect: () => void;
}

export function useStrava(): UseStravaResult {
    const [accounts, setAccounts] = useState<StravaAuthentication[]>([]);
    const [activeAthleteId, setActiveAthleteId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Helper to refresh a specific authentication object if its token is expired
    const ensureFreshToken = async (auth: StravaAuthentication): Promise<StravaAuthentication | null> => {
        if (!auth.isTokenExpired()) {
            return auth;
        }
        try {
            const refreshed = await StravaService.RefreshAccessToken(auth.refresh_token, auth.athlete);
            return refreshed;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const restoreAuth = async () => {
            const stored = loadStravaAccounts();
            if (!stored.accounts || stored.accounts.length === 0) return;

            let parsedAccounts: StravaAuthentication[] = [];
            for (const item of stored.accounts) {
                try {
                    const auth = StravaAuthentication.fromJSON(item);
                    parsedAccounts.push(auth);
                } catch {
                    // Ignore corrupted account entry
                }
            }

            if (parsedAccounts.length === 0) {
                clearStravaAuth();
                return;
            }

            let activeId = stored.activeAthleteId ?? parsedAccounts[0].athlete.id;
            let activeAcc = parsedAccounts.find(a => a.athlete.id === activeId) ?? parsedAccounts[0];

            // Refresh active account token if expired
            const refreshedActive = await ensureFreshToken(activeAcc);
            if (refreshedActive) {
                parsedAccounts = parsedAccounts.map(a => a.athlete.id === refreshedActive.athlete.id ? refreshedActive : a);
                activeId = refreshedActive.athlete.id;
            }

            setAccounts(parsedAccounts);
            setActiveAthleteId(activeId);
            saveStravaAccounts(parsedAccounts, activeId);
        };

        restoreAuth();
    }, []);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        try {
            const newAuth = await StravaService.ConnectToStrava();
            if (newAuth) {
                setAccounts(prev => {
                    const filtered = prev.filter(a => a.athlete.id !== newAuth.athlete.id);
                    const updated = [...filtered, newAuth];
                    saveStravaAccounts(updated, newAuth.athlete.id);
                    return updated;
                });
                setActiveAthleteId(newAuth.athlete.id);
            }
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const selectAccount = useCallback(async (athleteId: number) => {
        const target = accounts.find(a => a.athlete.id === athleteId);
        if (!target) return;

        const refreshed = await ensureFreshToken(target);
        const finalTarget = refreshed ?? target;

        setAccounts(prev => {
            const updated = prev.map(a => a.athlete.id === finalTarget.athlete.id ? finalTarget : a);
            saveStravaAccounts(updated, finalTarget.athlete.id);
            return updated;
        });
        setActiveAthleteId(finalTarget.athlete.id);
    }, [accounts]);

    const removeAccount = useCallback((athleteId: number) => {
        setAccounts(prev => {
            const updated = prev.filter(a => a.athlete.id !== athleteId);
            let nextActiveId: number | null = activeAthleteId;

            if (activeAthleteId === athleteId) {
                nextActiveId = updated.length > 0 ? updated[0].athlete.id : null;
            }

            if (updated.length === 0) {
                clearStravaAuth();
                setActiveAthleteId(null);
            } else {
                saveStravaAccounts(updated, nextActiveId);
                setActiveAthleteId(nextActiveId);
            }

            return updated;
        });
    }, [activeAthleteId]);

    const disconnect = useCallback(() => {
        clearStravaAuth();
        setAccounts([]);
        setActiveAthleteId(null);
    }, []);

    const stravaAuth = accounts.find(a => a.athlete.id === activeAthleteId) ?? null;

    return {
        stravaAuth,
        accounts,
        activeAthleteId,
        isConnecting,
        connect,
        selectAccount,
        removeAccount,
        disconnect
    };
}
