export class StravaAthlete {
    constructor(
        public id: number,
        public username: string,
        public firstname: string,
        public lastname: string,
        public profile: string,
        public city: string,
        public state: string,
        public country: string
    ) {}

    static fromJSON(json: any): StravaAthlete {
        return new StravaAthlete(
            json.id, json.username, json.firstname, json.lastname,
            json.profile, json.city, json.state, json.country
        );
    }
}

export class StravaAuthentication {
    constructor(
        public access_token: string,
        public refresh_token: string,
        public expires_at: number,
        public athlete: StravaAthlete
    ) {}

    isTokenExpired(): boolean {
        return Date.now() / 1000 > this.expires_at;
    }

    /**
     * Reconstructs a StravaAuthentication instance from a plain JSON object
     * (e.g. parsed from a cookie). This ensures class methods like
     * isTokenExpired() are available on the restored object.
     */
    static fromJSON(json: any): StravaAuthentication {
        return new StravaAuthentication(
            json.access_token,
            json.refresh_token,
            json.expires_at,
            StravaAthlete.fromJSON(json.athlete)
        );
    }
}

export class StravaUpload {
    constructor(
        public id: number,
        public id_str: string,
        public external_id: string,
        public error: string | null,
        public status: string,
        public activity_id: number | null
    ) {}
}
