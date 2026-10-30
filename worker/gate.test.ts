import { describe, expect, it } from 'vitest';
import { decideGate, inviteToken } from './gate';

const SECRET = 'correct-horse';
const on = { gate: 'on', secret: SECRET };
const home = new URL('https://joshua.win/skill/');
const withInvite = (invite: string, path = '/skill/') =>
  new URL(`https://joshua.win${path}?invite=${encodeURIComponent(invite)}`);
const placeholder = { kind: 'placeholder' };

describe('decideGate', () => {
  describe('the invite link', () => {
    it('admits a matching invite and removes it from the URL', async () => {
      const decision = await decideGate(withInvite(SECRET, '/skill/essays/'), null, on);
      expect(decision).toMatchObject({
        kind: 'admit',
        location: 'https://joshua.win/skill/essays/',
      });
    });

    it('keeps the other query parameters', async () => {
      const url = new URL(`https://joshua.win/skill/?ref=card&invite=${SECRET}&page=2`);
      expect(await decideGate(url, null, on)).toMatchObject({
        location: 'https://joshua.win/skill/?ref=card&page=2',
      });
    });

    it('sets the cookie with the agreed attributes', async () => {
      const decision = await decideGate(withInvite(SECRET), null, on);
      if (decision.kind !== 'admit') throw new Error(`expected admit, got ${decision.kind}`);
      const [pair, ...attributes] = decision.setCookie.split('; ');
      expect(pair).toBe(`invite=${await inviteToken(SECRET)}`);
      expect(attributes.sort()).toEqual([
        'HttpOnly',
        'Max-Age=31536000',
        'Path=/skill/',
        'SameSite=Lax',
        'Secure',
      ]);
    });

    it('never puts the secret in the cookie', async () => {
      const decision = await decideGate(withInvite(SECRET), null, on);
      if (decision.kind !== 'admit') throw new Error(`expected admit, got ${decision.kind}`);
      expect(decision.setCookie).not.toContain(SECRET);
    });

    it('shows the placeholder for a wrong invite', async () => {
      expect(await decideGate(withInvite('wrong'), null, on)).toEqual(placeholder);
    });

    it('shows the placeholder for an empty invite', async () => {
      expect(await decideGate(withInvite(''), null, on)).toEqual(placeholder);
    });

    it("doesn't accept the token as an invite", async () => {
      const token = await inviteToken(SECRET);
      expect(await decideGate(withInvite(token), null, on)).toEqual(placeholder);
    });
  });

  describe('the cookie', () => {
    it('lets a valid cookie through', async () => {
      const cookie = `invite=${await inviteToken(SECRET)}`;
      expect(await decideGate(home, cookie, on)).toEqual({ kind: 'member' });
    });

    it('finds it among other cookies', async () => {
      const cookie = `theme=dark; invite=${await inviteToken(SECRET)}; x=1`;
      expect(await decideGate(home, cookie, on)).toEqual({ kind: 'member' });
    });

    it('shows the placeholder with no cookie', async () => {
      expect(await decideGate(home, null, on)).toEqual(placeholder);
    });

    it('shows the placeholder for a made-up cookie', async () => {
      expect(await decideGate(home, 'invite=abc123', on)).toEqual(placeholder);
    });

    it("doesn't accept the secret itself as the cookie", async () => {
      expect(await decideGate(home, `invite=${SECRET}`, on)).toEqual(placeholder);
    });

    it('ignores a cookie with a similar name, and one with no value', async () => {
      const token = await inviteToken(SECRET);
      expect(await decideGate(home, `not-invite=${token}`, on)).toEqual(placeholder);
      expect(await decideGate(home, 'invite', on)).toEqual(placeholder);
    });

    it('stays a member when a stale invite is still in the URL', async () => {
      const cookie = `invite=${await inviteToken(SECRET)}`;
      expect(await decideGate(withInvite('stale'), cookie, on)).toEqual({ kind: 'member' });
    });
  });

  describe('rotating the secret', () => {
    const rotated = { gate: 'on', secret: 'new-secret' };

    it('locks out every cookie made with the old secret', async () => {
      const cookie = `invite=${await inviteToken(SECRET)}`;
      expect(await decideGate(home, cookie, rotated)).toEqual(placeholder);
    });

    it('turns the old invite link into a stale one', async () => {
      expect(await decideGate(withInvite(SECRET), null, rotated)).toEqual(placeholder);
    });

    it('admits the new invite link', async () => {
      expect(await decideGate(withInvite('new-secret'), null, rotated)).toMatchObject({
        kind: 'admit',
      });
    });
  });

  describe('failing closed', () => {
    const noSecrets = [undefined, '', '   '];

    it.each(noSecrets)('shows everyone the placeholder when the secret is %j', async (secret) => {
      const settings = { gate: 'on', secret };
      expect(await decideGate(home, null, settings)).toEqual(placeholder);
      expect(await decideGate(withInvite(''), null, settings)).toEqual(placeholder);
      expect(await decideGate(withInvite('anything'), 'invite=abc', settings)).toEqual(placeholder);
    });

    it('stays on when the gate setting is missing', async () => {
      expect(await decideGate(home, null, { secret: SECRET })).toEqual(placeholder);
    });

    it.each(['OFF', 'Off', 'false', '0', ' off', ''])('stays on for gate %j', async (gate) => {
      expect(await decideGate(home, null, { gate, secret: SECRET })).toEqual(placeholder);
    });
  });

  describe('gate off', () => {
    it('opens for everyone, with or without a secret', async () => {
      const open = { kind: 'open' };
      expect(await decideGate(home, null, { gate: 'off' })).toEqual(open);
      expect(await decideGate(home, null, { gate: 'off', secret: SECRET })).toEqual(open);
    });

    it('ignores an invite in the URL', async () => {
      expect(await decideGate(withInvite(SECRET), null, { gate: 'off', secret: SECRET })).toEqual({
        kind: 'open',
      });
    });
  });
});
