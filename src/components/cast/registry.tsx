// The cast registry: each cast member's name, role and drawing. These are the demo's code-drawn *Alice*
// placeholders (docs/demo/parade.html); hand-drawn casts replace them in phase 3. No framework APIs,
// so the phase 2 bake-off can reuse this in Next.
import type { ComponentType } from 'react';

function Eyes({
  cx,
  cy,
  gap = 3.2,
  r = 1.4,
}: {
  cx: number;
  cy: number;
  gap?: number;
  r?: number;
}) {
  return (
    <>
      <circle cx={cx - gap} cy={cy} r={r} fill="#231f1a" stroke="none" />
      <circle cx={cx + gap} cy={cy} r={r} fill="#231f1a" stroke="none" />
    </>
  );
}

function Rabbit() {
  return (
    <>
      <ellipse cx="16" cy="10" rx="2.8" ry="8.5" transform="rotate(-10 16 10)" fill="#f3f0ea" />
      <ellipse
        cx="16"
        cy="10.5"
        rx="1.1"
        ry="5.5"
        transform="rotate(-10 16 10.5)"
        fill="#f6b6c3"
        stroke="none"
      />
      <ellipse cx="24" cy="10" rx="2.8" ry="8.5" transform="rotate(10 24 10)" fill="#f3f0ea" />
      <ellipse
        cx="24"
        cy="10.5"
        rx="1.1"
        ry="5.5"
        transform="rotate(10 24 10.5)"
        fill="#f6b6c3"
        stroke="none"
      />
      <ellipse cx="20" cy="24" rx="10" ry="9" fill="#f3f0ea" />
      <Eyes cx={20} cy={22} />
      <path d="M18.6 26 h2.8 l-1.4 1.6z" fill="#f08aa0" stroke="none" />
      <circle cx="29" cy="28" r="3.2" fill="#f4c430" />
      <line x1="29" y1="28" x2="29" y2="26.2" strokeWidth="1.2" />
    </>
  );
}

function Bottle() {
  return (
    <>
      <rect x="16.5" y="1.5" width="7" height="3.5" rx="1" fill="#a47148" />
      <rect x="17" y="5" width="6" height="5.5" fill="#bfe3da" />
      <rect x="10" y="10" width="20" height="23" rx="6" fill="#9bd1c5" />
      <rect x="12.5" y="16" width="15" height="9.5" rx="1.2" fill="#fffaf3" />
      <Eyes cx={20} cy={19.6} gap={3} r={1.2} />
      <line x1="15" y1="23" x2="25" y2="23" strokeWidth="1" />
    </>
  );
}

function Cat() {
  return (
    <>
      <path d="M10 17 L11.5 7 L17 13 M30 17 L28.5 7 L23 13" fill="#c084fc" />
      <ellipse cx="20" cy="23" rx="11" ry="9.5" fill="#c084fc" />
      <path d="M12 19 l3 1.2 M28 19 l-3 1.2 M20 14 v3" stroke="#7e3fb8" strokeWidth="1.4" />
      <path d="M14 20.5 q1.6-1.6 3.2 0 M22.8 20.5 q1.6-1.6 3.2 0" strokeWidth="1.6" />
      <path d="M12.5 25 Q20 32.5 27.5 25 Z" fill="#fffaf3" />
      <path d="M16 26.4 v2.6 M20 27 v3.4 M24 26.4 v2.6" strokeWidth="1" />
    </>
  );
}

function Queen() {
  return (
    <>
      <path d="M12.5 8 L14.5 2.5 L17.5 6 L20 1.5 L22.5 6 L25.5 2.5 L27.5 8 Z" fill="#f4c430" />
      <rect x="9.5" y="8" width="21" height="25" rx="2.5" fill="#fffaf3" />
      <path
        d="M20 31 C 12 25.5, 11 21, 13 18 C 15 15.5, 18.5 16, 20 18.5 C 21.5 16, 25 15.5, 27 18 C 29 21, 28 25.5, 20 31 Z"
        fill="#e63946"
      />
      <Eyes cx={20} cy={22.5} gap={3} r={1.3} />
      <path d="M18 26.2 q2 1.2 4 0" strokeWidth="1.3" />
      <text x="11.5" y="14" fontSize="5" fontFamily="Georgia, serif" fill="#e63946" stroke="none">
        Q
      </text>
    </>
  );
}

export interface CastMember {
  name: string;
  role: string;
  Torso: ComponentType;
}

export const castRegistry = {
  rabbit: { name: 'The White Rabbit', role: 'Character', Torso: Rabbit },
  bottle: { name: 'The “Drink Me” bottle', role: 'Object', Torso: Bottle },
  cat: { name: 'The Cheshire Cat', role: 'Character', Torso: Cat },
  queen: { name: 'The Queen of Hearts', role: 'Character', Torso: Queen },
} satisfies Record<string, CastMember>;

export type CastKey = keyof typeof castRegistry;

export const castKeys = Object.keys(castRegistry) as [CastKey, ...CastKey[]];
