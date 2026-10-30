import { describe, expect, it } from 'vitest';
import { route } from './route';

const at = (href: string) => route(new URL(href));
const redirectTo = (location: string) => ({ kind: 'redirect', location });
const asset = { kind: 'asset' };

describe('route', () => {
  describe('the site under /skill/', () => {
    it('serves the home page', () => {
      expect(at('https://joshua.win/skill/')).toEqual(asset);
    });

    it('serves pages and files under it', () => {
      expect(at('https://joshua.win/skill/essays/')).toEqual(asset);
      expect(at('https://joshua.win/skill/_astro/client.js')).toEqual(asset);
    });

    it('adds the slash to /skill, keeping the query', () => {
      expect(at('https://joshua.win/skill?ref=card')).toEqual(
        redirectTo('https://joshua.win/skill/?ref=card'),
      );
    });

    it("doesn't treat a lookalike prefix as the site", () => {
      expect(at('https://joshua.win/skills/')).toEqual(redirectTo('https://joshua.win/skill/'));
    });
  });

  describe('the bare domain', () => {
    it('sends the root to /skill/', () => {
      expect(at('https://joshua.win/')).toEqual(redirectTo('https://joshua.win/skill/'));
    });

    it('sends stray root paths to /skill/, dropping the query', () => {
      expect(at('https://joshua.win/favicon.ico')).toEqual(redirectTo('https://joshua.win/skill/'));
      expect(at('https://joshua.win/about?x=1')).toEqual(redirectTo('https://joshua.win/skill/'));
    });

    it('stays on the same origin, so local dev and previews redirect to themselves', () => {
      expect(at('http://127.0.0.1:8787/')).toEqual(redirectTo('http://127.0.0.1:8787/skill/'));
    });
  });

  describe('www', () => {
    it('sends the www root to the bare domain over https', () => {
      expect(at('http://www.joshua.win/')).toEqual(redirectTo('https://joshua.win/skill/'));
    });

    it('keeps a path and query under /skill/, so deep links survive', () => {
      expect(at('https://www.joshua.win/skill/essays/?ref=x')).toEqual(
        redirectTo('https://joshua.win/skill/essays/?ref=x'),
      );
    });

    it('keeps a missing page missing: one hop to the bare domain, which then 404s', () => {
      expect(at('https://www.joshua.win/skill/no-such-page/')).toEqual(
        redirectTo('https://joshua.win/skill/no-such-page/'),
      );
    });

    it('lands /skill on /skill/ in one hop, keeping the query', () => {
      expect(at('https://www.joshua.win/skill?ref=card')).toEqual(
        redirectTo('https://joshua.win/skill/?ref=card'),
      );
    });

    it('sends paths outside the site where the bare domain would: the home page', () => {
      expect(at('https://www.joshua.win/old-blog/post')).toEqual(
        redirectTo('https://joshua.win/skill/'),
      );
    });
  });

  describe('https', () => {
    it('upgrades http on a public host, keeping the path and query', () => {
      expect(at('http://joshua.win/skill/essays/?ref=x')).toEqual(
        redirectTo('https://joshua.win/skill/essays/?ref=x'),
      );
    });

    it('upgrades while redirecting the bare domain, in one hop', () => {
      expect(at('http://joshua.win/')).toEqual(redirectTo('https://joshua.win/skill/'));
    });

    it('leaves local hosts on http', () => {
      expect(at('http://localhost:8787/skill/')).toEqual(asset);
      expect(at('http://[::1]:8787/skill/')).toEqual(asset);
    });
  });
});
