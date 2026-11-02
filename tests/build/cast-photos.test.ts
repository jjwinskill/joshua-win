import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The repo is public, so a photo mustn't carry the phone's model, time or place (G37).
const folder = fileURLToPath(new URL('../../docs/cast/photos/', import.meta.url));

describe('cast photos', () => {
  for (const name of readdirSync(folder)) {
    it(`${name} is a JPEG with no metadata`, () => {
      const bytes = readFileSync(`${folder}${name}`);
      expect(name).toMatch(/\.jpg$/);
      for (const marker of ['Exif', 'xpacket', 'Apple', 'iPhone', 'GPS']) {
        expect(bytes.includes(marker), marker).toBe(false);
      }
    });
  }
});
