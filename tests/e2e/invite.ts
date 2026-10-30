import { inviteToken } from '../../worker/gate';

// The run's throwaway secret, generated in playwright.config.ts and given to `wrangler dev`.
export const testSecret = (): string => {
  const secret = process.env.TEST_INVITE_SECRET;
  if (!secret) throw new Error('TEST_INVITE_SECRET is set by playwright.config.ts');
  return secret;
};

// A valid cookie, for tests about what lies past the gate.
export const memberCookie = async (): Promise<string> =>
  `invite=${await inviteToken(testSecret())}`;
