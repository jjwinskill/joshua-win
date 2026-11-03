// The cast registry: each cast member's name, role, drawing and walk. Josh drew them on the template sheet,
// and they were inked from his drawings by hand (G37). No framework APIs, so the phase 2 bake-off could
// reuse this in Next.
import type { ComponentType } from 'react';
import { hantaLines } from './hanta-lines';

function Hanta() {
  return (
    <>
      <g transform="translate(20 33) scale(.965) translate(-20 -33)">
        <path
          d="M.6 25.3 6.6 23.9 7.9 21.2 12 20.3 26.2 21.2 29.7 23.6 39.6 25.7Q39.8 30 38 34.6 20 35.3 2.2 34.6 .2 30 .6 25.3Z"
          fill="#8d8672"
          strokeWidth="1.3"
        />
        <path
          d="M11 22.6Q10.6 27 12.3 30 13 32 13 34 20 34.3 24 34 25.5 28 25.9 24.6 18 27 11 22.6Z"
          fill="#ece5d3"
          stroke="none"
        />
        <path d="M12.2 20 11 22.6Q18 27.6 25.9 24.6L26.2 19.5Z" fill="#d2ab82" stroke="none" />
        <path
          d="M10 9.6 7.2 9.6C6.2 12 6.6 15 7.4 16.6 8 17.6 9.2 17.6 10.4 16.8Z"
          fill="#e6c6a0"
          stroke="none"
        />
        <path
          d="M28 10.4 29.6 10.6C30 12 29.6 14 28.6 15.6 28 16 27.4 16.2 26.8 16.2Z"
          fill="#e6c6a0"
          stroke="none"
        />
        <path
          d="M10.4 4.8C10.4 12 10.8 17 12 20.3 14 22 15.5 23.3 17 24.6 20 25.2 22.8 23.8 24.4 22 25.5 19.6 26 17.4 26.6 16.4 27 13 27.4 11 27 4.8Z"
          fill="#e6c6a0"
          stroke="none"
        />
        <path
          d="M13.2 11.8 17 12.1 17.2 13.6 13.2 13.8ZM21.4 12.5 25.2 12 25.2 13.7 21.4 13.9Z"
          fill="#fffaf3"
          stroke="none"
        />
        <path
          d="M16.55 11.75a1 1 0 1 0 .01 0ZM24.3 11.95a1 1 0 1 0 .01 0Z"
          fill="#7a4a24"
          stroke="none"
        />
        <path
          d="M16.55 12.3a.45 .45 0 1 0 .01 0ZM24.3 12.5a.45 .45 0 1 0 .01 0Z"
          fill="#231f1a"
          stroke="none"
        />
        <path
          d="M33 2.1 31 1.7 29.2 .9 26.9 1 26.4 .1 25.1 .2 24.8-.6 22 1.2 21.3 .9 21.3 .1 20 1 18.8 0 17.9 .4 17-.1 16.5 .3 16.9 1.6 16.2 2.1 15.4 1.7 14.4 0 12.8 .5 12.1 .1 11.2 .9 9.5 0 9.7 .9 9.2 1.5 7.4 1.2 7.4 1.8 6.8 2.5 5.8 2.3 5.7 3.5 6.6 5.7 6.1 6.2 5.2 6.3 5.6 7.2 6 7 8 9.2 11 8.6 15.5 8.2 19 5.8 21.5 6.6 25.4 8.6 28 8.6 29.5 7.8 29.2 7 29.6 6.5 30.5 6.4 31 7 31.7 6.7 32 6 31.2 5.4 31.1 4.8 32.4 3.8 30.4 3.9 30 3.4 30.2 2.4 30.9 2 32.7 2.3Z"
          fill="#33261b"
          stroke="none"
        />
        <path d={hantaLines} fill="#231f1a" stroke="none" fillRule="evenodd" />
        <path
          d="M7.3 1Q6.4 .4 5.7 .3M6 2.3Q5.2 1.9 4.8 1.5M9.8 0Q9.1-.9 8.4-1.4M12.1 .1Q11.8-.8 11.9-1.4M14.8 .1Q14.1-1.2 13.9-2.5M17 .2Q17.2-.7 17.1-1.2M18.5 .2Q19.3-.3 19.6-.9M21.2 .3Q21.7-.9 22.5-1.7M23.5 1Q23.2 .1 22.8-.4M24.8-.5Q25.7-1.3 26.5-1.6M26.1 .2Q26.9-.4 27.6-.6M32.8 2Q33.7 2 34.1 1.6"
          strokeWidth="1"
        />
      </g>
    </>
  );
}

function CrumpledPaper() {
  return (
    <>
      <g transform="translate(0 2.3)">
        <path
          d="M16.9 6.5 14 5.7 13.4 4.5 8.5 6.2 8.4 8.2 6.3 9.2 6.2 13 3.7 16.5 5.8 20.5 7.6 21.9 8 23 5.9 27 10 29 10 30.8 15.3 32.6 20 30.3 23.5 31 26.5 27.8 28.7 27.7 28.7 24 30.5 24 33 20 29.8 16 30 11.8 28.3 10.8 27.8 7.2 25 7.3 23 4.3Z"
          fill="#f7f2e6"
          strokeWidth="1.35"
        />
        <path
          d="M7.7 10.3 15.5 8.3 16.2 11 12.5 11.5ZM18.2 10 24 13.5 24.2 20 21 18 19 12ZM19.5 21.8 26.8 25.7 27.8 23.5 26 21ZM12.8 23.7 11.8 30 14 30.4 15 25Z"
          fill="#e2dac8"
          stroke="none"
        />
        <path
          d="M7.7 10.3 15.5 8.3 16.2 11 12.5 11.5M7.7 10.3 10 16 10 19 11.5 20.2M7.4 14.3 6.6 16.5 8.7 18.2M12.2 14.5 14.5 17.8 20 18.2M19.2 8.5 18.2 10 24 13.5 24.2 20M21.8 10 27.8 14.2 26.6 21M16.5 21.8 18.5 25 22.8 29.2 15 27M19.5 21.8 26.8 25.7 27.8 23.5M12.8 23.7 11.8 30 14 30.4M10.7 22.5 10.2 25.8"
          strokeWidth="1"
        />
      </g>
    </>
  );
}

function HydraulicPress() {
  return (
    <>
      <path d="M15 28 25 28 25 34.4 15 34.4Z" fill="#7c8a91" strokeWidth="1.4" />
      <path d="M11 6 29 6 29 23 11 23Z" fill="#dde1df" stroke="none" />
      <path d="M17.4 6.5V14M22.4 6.5V13.6" strokeWidth="1.2" />
      <path
        d="M11.2 6.4 14.6 6.4 14.6 22.6 11.2 22.6ZM25.8 6.4 28.8 6.4 28.8 22.6 25.8 22.6Z"
        fill="#9fadb3"
        strokeWidth="1.2"
      />
      <path d="M15.9 14.2 23.7 13.5 24.3 18.5 15.7 18.9Z" fill="#f4c430" strokeWidth="1.2" />
      <path d="M17 18.5 18.6 15M19.7 18.4 21.3 14.8M22.2 18.4 23.5 15.4" strokeWidth="1.1" />
      <path d="M9.7 2 30 1.6 30.1 5.9 9.8 6.5Z" fill="#9fadb3" strokeWidth="1.3" />
      <path d="M8.8 23.1 30.2 22.8 30.3 27.9 9.5 28.8Z" fill="#9fadb3" strokeWidth="1.3" />
      <path d="M7.8 29 13.5 28.8 13.5 31.2 7.9 32Z" fill="#7c8a91" strokeWidth="1.3" />
      <path d="M27 28.8 32.8 28.4 32.8 30.6 27 31.2Z" fill="#7c8a91" strokeWidth="1.3" />
    </>
  );
}

function GlassOfMilk() {
  return (
    <>
      <path d="M9.7 7.6 28.8 7C27 17 25 27 24.9 34.2L13.9 34.2Z" fill="#d9e8ea" stroke="none" />
      <path d="M10.9 15.4 26.9 13.8C26 20 25 27 24.9 34L13.9 34Z" fill="#fffdf6" stroke="none" />
      <path
        d="M10.8 14.8Q14 12.8 18 12.3 24 11.9 26.9 13.1 27 14 26.9 14.6 19 16.2 11 15.9Z"
        fill="#f1ecdd"
        strokeWidth="1.1"
      />
      <path d="M14.7 18 16.2 27.5M23.4 18 21.3 27.5" strokeWidth="0.9" />
      <path
        d="M9.7 7.5Q15 5.2 20 4.4 27 4.5 28.7 6.8Q29 7 28.8 7.4 18 8.6 9.8 8.3Z"
        fill="#d9e8ea"
        strokeWidth="1.25"
      />
      <path d="M9.7 7.8 13.9 34.2Q20 33.7 24.9 34.2C25 27 27 17 28.8 7.2" strokeWidth="1.35" />
    </>
  );
}

/** How a cast member walks, on the same legs. */
export interface Gait {
  /** One full stride, in milliseconds. */
  beat: number;
  /** How far the body lifts at each step, in the viewBox's units. */
  bob: number;
  /** How far the body leans into each step, in degrees. */
  lean: number;
}

export interface CastMember {
  name: string;
  role: string;
  Torso: ComponentType;
  gait: Gait;
}

export const castRegistry = {
  // Nearly weightless, so it skitters.
  paper: {
    name: 'A crumpled sheet of paper',
    role: 'Object',
    Torso: CrumpledPaper,
    gait: { beat: 480, bob: 1.5, lean: 3 },
  },
  // Thirty-five years in a cellar, and tired.
  hanta: { name: 'Haňťa', role: 'Character', Torso: Hanta, gait: { beat: 700, bob: 1, lean: 2 } },
  // Far too heavy to lift itself.
  press: {
    name: 'The giant new hydraulic press at Bubny',
    role: 'Object',
    Torso: HydraulicPress,
    gait: { beat: 880, bob: 0.5, lean: 0.5 },
  },
  // Trying not to spill.
  milk: {
    name: 'A glass of milk',
    role: 'Object',
    Torso: GlassOfMilk,
    gait: { beat: 620, bob: 0.6, lean: 0 },
  },
} satisfies Record<string, CastMember>;

export type CastKey = keyof typeof castRegistry;

export const castKeys = Object.keys(castRegistry) as [CastKey, ...CastKey[]];
