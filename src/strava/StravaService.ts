import { StravaAuthentication, StravaAthlete, StravaUpload } from "./StravaModels";

const AZURE_FUNCTION_URL = "https://trackmaster-live-g9h2hkdcadbqgeap.westeurope-01.azurewebsites.net";

export class StravaService {
    static async ConnectToStrava(): Promise<StravaAuthentication | null> {
        const clientId = "2744"; // TrackMaster API app from GHST Strava
        
        const currentBaseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "");
        const proxyUrl = process.env.REACT_APP_STRAVA_REDIRECT_HOST || "https://stefangheorghe.net/strava-proxy.html";
        const isWhitelistedDomain = window.location.hostname === new URL(proxyUrl).hostname;

        // If we are not on the whitelisted domain, route initial OAuth callback through the proxy
        const stravaRedirectUri = isWhitelistedDomain
            ? `${currentBaseUrl}/`
            : proxyUrl;

        // The parent window polls the popup expecting it to land back on our current origin
        const expectedRedirectUri = `${currentBaseUrl}/`;

        const state = isWhitelistedDomain ? "" : encodeURIComponent(currentBaseUrl);
        const scope = "read_all,activity:read_all,activity:write";
        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${stravaRedirectUri}&approval_prompt=force&scope=${scope}&state=${state}`;

        const popup = window.open(authUrl, "StravaAuth", "width=600,height=700");

        if (!popup) {
            console.error("Failed to open popup window.");
            return null;
        }

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                let code = null;
                try {
                    if (popup.location.href.startsWith(expectedRedirectUri)) {
                        const urlParams = new URL(popup.location.href).searchParams;
                        code = urlParams.get("code");

                        if (code) {
                            popup.close();
                            clearInterval(interval);
                            const auth2Url = `${AZURE_FUNCTION_URL}/api/strava-exchange`;
                            fetch(auth2Url, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    code: code,
                                }),
                            })
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error(`HTTP error! status: ${response.status}`);
                                }
                                return response.json();
                            })
                            .then((data) => {
                                const stravaAuth = new StravaAuthentication(
                                    data.access_token,
                                    data.refresh_token,
                                    data.expires_at,
                                    data.athlete
                                );
                                resolve(stravaAuth);
                            })
                            .catch((error) => {
                                console.error("Error fetching access token:", error);
                                resolve(null);
                            });
                        } else {
                            console.error("Authorization code not found.");
                            popup.close();
                            clearInterval(interval);
                            resolve(null);
                        }
                    }
                } catch (error) {
                    // Ignore expected cross-origin errors until the popup redirects to the same origin
                }

                if (popup.closed && code === null) {
                    console.error("Popup closed by user.");
                    clearInterval(interval);
                    resolve(null);
                }
            }, 500); // Check every 500ms
        });
    }

    static async EnqueueActivityForUpload(accessToken: string, fileBuffer: ArrayBuffer, activityName: string, activityDescription?: string, dataType: 'gpx' | 'tcx' = 'tcx', sportType: string = 'VirtualRun'): Promise<StravaUpload | null> {
        const url = `https://www.strava.com/api/v3/uploads`;
        const formData = new FormData();
        const mimeType = dataType === 'tcx' ? 'application/vnd.garmin.tcx+xml' : 'application/gpx+xml';
        const fileBlob = new Blob([fileBuffer], { type: mimeType });
        formData.append('file', fileBlob, `${activityName}.${dataType}`);
        formData.append('name', activityName);
        if (activityDescription) {
            formData.append('description', activityDescription);
        }
        formData.append('data_type', dataType);
        formData.append('sport_type', sportType);
        formData.append('commute', 'false');
        formData.append('trainer', '0');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${accessToken}` },
                body: formData
            });

            if (response.status === 201) {
                const data = await response.json();
                return data as StravaUpload;
            }
            console.log(`Failed to upload activity: ${response.statusText}`);
        } catch (e) {
            console.error("Upload error", e);
        }
        return null;
    }

    /**
     * Uses the refresh_token to obtain a new access_token from Strava.
     * Returns a fully reconstructed StravaAuthentication or null on failure.
     */
    static async RefreshAccessToken(refreshToken: string, athlete: StravaAthlete): Promise<StravaAuthentication | null> {
        try {
            const response = await fetch(`${AZURE_FUNCTION_URL}/api/strava-refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    refresh_token: refreshToken,
                }),
            });

            if (!response.ok) {
                console.error(`Token refresh failed: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            // Strava's refresh response does not include the athlete object — reuse the existing one.
            return new StravaAuthentication(data.access_token, data.refresh_token, data.expires_at, athlete);
        } catch (error) {
            console.error("Error refreshing Strava token:", error);
            return null;
        }
    }

    static async CheckUploadStatus(accessToken: string, uploadId: string): Promise<StravaUpload | null> {
        const url = `https://www.strava.com/api/v3/uploads/${uploadId}`;
        try {
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${accessToken}` }
            });
            if (response.ok) {
                return await response.json() as StravaUpload;
            }
        } catch (e) {
            console.error("Check status error", e);
        }
        return null;
    }
}
