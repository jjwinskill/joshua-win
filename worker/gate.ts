// The invite gate (G4): who gets past the placeholder before publishing. Like route.ts it's free of
// the Workers runtime; crypto.subtle exists in both workerd and Node, so it's unit-tested in Vitest.

export const INVITE_PARAM = 'invite';
export const COOKIE_NAME = 'invite';
const ONE_YEAR_IN_SECONDS = 31_536_000;

// What the cookie's token is derived from. Changing it would lock everyone out, like a rotation.
const TOKEN_LABEL = 'joshua-win invite v1';

export interface GateSettings {
  // Only the exact value 'off' opens the gate (previews, #7). Anything else, or nothing, keeps it on.
  mode?: string;
  secret?: string;
}

export type GateDecision =
  | { kind: 'open' } // the gate is off
  | { kind: 'member' } // a valid cookie
  | { kind: 'admit'; location: string; setCookie: string } // a matching invite link
  | { kind: 'placeholder' };

export async function decideGate(
  url: URL,
  cookieHeader: string | null,
  { mode, secret }: GateSettings,
): Promise<GateDecision> {
  if (mode === 'off') return { kind: 'open' };

  // Fails closed: with no usable secret, nothing can match, including an empty `?invite=`.
  if (!secret?.trim()) return { kind: 'placeholder' };

  const expected = await inviteToken(secret);

  const invite = url.searchParams.get(INVITE_PARAM);
  // Comparing the invite's token, not the invite itself, keeps this constant-time on any runtime.
  if (invite && sameToken(await inviteToken(invite), expected)) {
    const clean = new URL(url);
    clean.searchParams.delete(INVITE_PARAM);
    return { kind: 'admit', location: clean.href, setCookie: inviteCookie(expected) };
  }

  const cookie = readCookie(cookieHeader, COOKIE_NAME);
  if (cookie && sameToken(cookie, expected)) return { kind: 'member' };

  return { kind: 'placeholder' };
}

// The cookie holds this token, never the secret. It depends on the secret, so rotating the secret
// invalidates every cookie at once.
export async function inviteToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(TOKEN_LABEL));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function inviteCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Max-Age=${ONE_YEAR_IN_SECONDS}; Path=/skill/; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(header: string | null, name: string): string | undefined {
  for (const pair of header?.split(';') ?? []) {
    const separator = pair.indexOf('=');
    if (separator > 0 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return undefined;
}

// Doesn't stop at the first difference, so timing doesn't reveal how much of a token was right.
function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
