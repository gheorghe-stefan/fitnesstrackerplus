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

/**
 * Stores the Strava authentication data as a JSON cookie.
 */
export function saveStravaAuth(auth: object): void {
    const json = JSON.stringify(auth);
    const expiry = new Date(Date.now() + STRAVA_AUTH_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    setCookie(STRAVA_AUTH_COOKIE, json, expiry);
}

/**
 * Retrieves stored Strava authentication JSON from the cookie.
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
 * Removes the stored Strava authentication cookie.
 */
export function clearStravaAuth(): void {
    deleteCookie(STRAVA_AUTH_COOKIE);
}
