import {bodies,flats} from './bodies.mjs';
import fs from 'fs';
const W=process.argv[2];
const b=bodies(flats);
const trace=fs.readFileSync('hanta-trace.txt','utf8');
const jsx=(parts)=>parts.join('\n').replaceAll('stroke-width','strokeWidth').replaceAll('fill-rule','fillRule').replace(trace,'@@').replace('d="@@"','d={hantaLines}');
const names={hanta:'Hanta',paper:'CrumpledPaper',press:'HydraulicPress',milk:'GlassOfMilk'};
const comps=Object.entries(names).map(([k,n])=>{let p=[...b[k]];
  // an open and closing <g> sit as separate parts
  return `function ${n}() {\n  return (\n    <>\n${jsx(p)}\n    </>\n  );\n}`;}).join('\n\n');
fs.writeFileSync(W+'/src/components/cast/hanta-lines.ts',`// Haňťa's lines, traced from Josh's marker drawing and cleaned by hand (G37): filled shapes, so that his\n// line keeps its weight. The drawing's photo is in docs/cast/photos/.\nexport const hantaLines =\n  '${trace}';\n`);
const reg=`// The cast registry: each cast member's name, role, drawing and walk. Josh drew them on the template sheet,
// and they were inked from his drawings by hand (G37). No framework APIs, so the phase 2 bake-off could
// reuse this in Next.
import type { ComponentType } from 'react';
import { hantaLines } from './hanta-lines';

${comps}

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
    gait: { beat: 480, bob: 2, lean: 3 },
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
`;
fs.writeFileSync(W+'/src/components/cast/registry.tsx',reg);
