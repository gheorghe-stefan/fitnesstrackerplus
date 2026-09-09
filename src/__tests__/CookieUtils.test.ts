import {
  saveStravaAccounts,
  loadStravaAccounts,
  saveStravaAuth,
  loadStravaAuth,
  clearStravaAuth
} from '../strava/CookieUtils';

describe('CookieUtils multi-account storage and migration', () => {
  beforeEach(() => {
    clearStravaAuth();
  });

  afterEach(() => {
    clearStravaAuth();
  });

  const mockAthlete1 = {
    id: 11111,
    username: 'stefan',
    firstname: 'Stefan',
    lastname: 'Gheorghe',
    profile: 'https://example.com/avatar1.jpg',
    city: 'Berlin',
    state: 'Berlin',
    country: 'Germany'
  };

  const mockAuth1 = {
    access_token: 'acc_token_111',
    refresh_token: 'ref_token_111',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    athlete: mockAthlete1
  };

  const mockAthlete2 = {
    id: 22222,
    username: 'maria',
    firstname: 'Maria',
    lastname: 'Gheorghe',
    profile: 'https://example.com/avatar2.jpg',
    city: 'Munich',
    state: 'Bavaria',
    country: 'Germany'
  };

  const mockAuth2 = {
    access_token: 'acc_token_222',
    refresh_token: 'ref_token_222',
    expires_at: Math.floor(Date.now() / 1000) + 7200,
    athlete: mockAthlete2
  };

  it('should save and load multiple Strava accounts', () => {
    saveStravaAccounts([mockAuth1, mockAuth2], 22222);
    const loaded = loadStravaAccounts();

    expect(loaded.accounts).toHaveLength(2);
    expect(loaded.activeAthleteId).toBe(22222);
    expect(loaded.accounts[0].athlete.firstname).toBe('Stefan');
    expect(loaded.accounts[1].athlete.firstname).toBe('Maria');
  });

  it('should automatically migrate legacy single-account cookie', () => {
    // Save legacy single account
    saveStravaAuth(mockAuth1);

    // Load with multi-account loader
    const loaded = loadStravaAccounts();
    expect(loaded.accounts).toHaveLength(1);
    expect(loaded.activeAthleteId).toBe(11111);
    expect(loaded.accounts[0].athlete.firstname).toBe('Stefan');
  });

  it('should clear all accounts on clearStravaAuth', () => {
    saveStravaAccounts([mockAuth1, mockAuth2], 11111);
    clearStravaAuth();
    const loaded = loadStravaAccounts();
    expect(loaded.accounts).toHaveLength(0);
    expect(loaded.activeAthleteId).toBeNull();
  });
});
