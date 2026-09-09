/**
 * Utility functions for browser cookie management.
 * Used to persist Strava authentication tokens across sessions.
 */

const STRAVA_AUTH_COOKIE = "strava_auth_ftp";
const STRAVA_AUTH_COOKIE_EXPIRY_DAYS = 180; // Strava refresh tokens are typically valid for several months.

/**
 * Sets a cookie with a given name, value, and expiration date.
 * Flags: Secure (HTTPS only), SameSite=Strict (CSRF protection).
 */
function setCookie(name: string, value: string, expiresAt: Date): void {
    const encodedValue = encodeURIComponent(value);
    let cookie = `${name}=${encodedValue}; expires=${expiresAt.toUTCString()}; path=/; SameSite=Strict`;

    // Only add Secure flag on HTTPS (won't work on localhost HTTP during dev)
    if (window.location.protocol === "https:") {
        cookie += "; Secure";
    }

    document.cookie = cookie;
}

/**
 * Retrieves a cookie value by name.
 * Returns null if the cookie does not exist.
 */
function getCookie(name: string): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [key, ...valueParts] = cookie.trim().split("=");
        if (key === name) {
            return decodeURIComponent(valueParts.join("="));
        }
    }
    return null;
}

/**
 * Deletes a cookie by setting its expiration to the past.
 */
function deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}

export interface StoredStravaRegistry {
    accounts: any[];
    activeAthleteId: number | null;
}

const STRAVA_MULTI_AUTH_COOKIE = "strava_multi_auth_ftp_v1";
const STRAVA_MULTI_AUTH_STORAGE_KEY = "ftmp_strava_multi_accounts_v1";

/**
 * Stores the multi-account Strava authentication registry.
 */
export function saveStravaAccounts(accounts: any[], activeAthleteId: number | null): void {
    const data: StoredStravaRegistry = { accounts, activeAthleteId };
    const json = JSON.stringify(data);
    const expiry = new Date(Date.now() + STRAVA_AUTH_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    setCookie(STRAVA_MULTI_AUTH_COOKIE, json, expiry);

    // Also persist to localStorage for extra resilience
    if (typeof window !== "undefined" && window.localStorage) {
        try {
            window.localStorage.setItem(STRAVA_MULTI_AUTH_STORAGE_KEY, json);
        } catch {
            // Ignore localStorage errors
        }
    }
}

/**
 * Retrieves stored multi-account Strava authentication registry.
 * Includes automatic migration from legacy single-account cookie.
 */
export function loadStravaAccounts(): StoredStravaRegistry {
    // 1. Try multi-account cookie
    let raw = getCookie(STRAVA_MULTI_AUTH_COOKIE);

    // 2. Try localStorage fallback
    if (!raw && typeof window !== "undefined" && window.localStorage) {
        try {
            raw = window.localStorage.getItem(STRAVA_MULTI_AUTH_STORAGE_KEY);
        } catch {
            // Ignore
        }
    }

    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.accounts)) {
                return {
                    accounts: parsed.accounts,
                    activeAthleteId: parsed.activeAthleteId ?? (parsed.accounts.length > 0 ? parsed.accounts[0].athlete?.id : null)
                };
            }
        } catch {
            // Ignore parse errors
        }
    }

    // 3. Fallback / Migration: Check legacy single-account cookie
    const legacy = loadStravaAuth();
    if (legacy && legacy.athlete?.id) {
        const migrated: StoredStravaRegistry = {
            accounts: [legacy],
            activeAthleteId: legacy.athlete.id
        };
        saveStravaAccounts(migrated.accounts, migrated.activeAthleteId);
        return migrated;
    }

    return { accounts: [], activeAthleteId: null };
}

/**
 * Stores the Strava authentication data as a JSON cookie (legacy single-account helper).
 */
export function saveStravaAuth(auth: object): void {
    const json = JSON.stringify(auth);
    const expiry = new Date(Date.now() + STRAVA_AUTH_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    setCookie(STRAVA_AUTH_COOKIE, json, expiry);
}

/**
 * Retrieves stored Strava authentication JSON from the cookie (legacy).
 */
export function loadStravaAuth(): any | null {
    const json = getCookie(STRAVA_AUTH_COOKIE);
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Removes all stored Strava authentication cookies and storage.
 */
export function clearStravaAuth(): void {
    deleteCookie(STRAVA_AUTH_COOKIE);
    deleteCookie(STRAVA_MULTI_AUTH_COOKIE);
    if (typeof window !== "undefined" && window.localStorage) {
        try {
            window.localStorage.removeItem(STRAVA_MULTI_AUTH_STORAGE_KEY);
        } catch {
            // Ignore
        }
    }
}
