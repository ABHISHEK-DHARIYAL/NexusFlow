import { describe, it, expect } from 'vitest';

// Regression test for a critical bug: getAuthorizationUrl() generated two
// different random OAuth state values - one was stored for later
// validation, a different one was returned/sent to GitHub as the `state`
// query param. Every real GitHub OAuth callback therefore failed state
// validation via validateState(), meaning login never worked in
// production (this app has no other login method). The fix makes both
// values the same, single stored state.

import { GithubOAuthService } from '../GithubOAuthService';
import { TokenService } from '../TokenService';

describe('GithubOAuthService - OAuth state consistency', () => {
  it('returns a state value that validateState() actually accepts', () => {
    const service = new GithubOAuthService({} as TokenService);

    const { state } = service.getAuthorizationUrl();

    expect(service.validateState(state)).toBe(true);
  });

  it('embeds the exact same state in the authorization URL that was returned', () => {
    const service = new GithubOAuthService({} as TokenService);

    const { url, state } = service.getAuthorizationUrl();

    expect(url).toContain(`state=${state}`);
  });

  it('rejects a state that was never issued (CSRF protection still works)', () => {
    const service = new GithubOAuthService({} as TokenService);
    expect(service.validateState('never-issued-random-state')).toBe(false);
  });

  it('rejects reuse of an already-consumed state (single-use protection preserved)', () => {
    const service = new GithubOAuthService({} as TokenService);
    const { state } = service.getAuthorizationUrl();

    expect(service.validateState(state)).toBe(true);
    expect(service.validateState(state)).toBe(false);
  });
});
