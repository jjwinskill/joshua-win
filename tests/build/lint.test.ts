import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// Proof that the hook and leak rules (#29) fire as errors under this repo's real config, so lint can
// keep future agents honest. Each example is deliberately wrong.
const eslint = new ESLint();

const component = (body: string) => `
import { useEffect, useRef, useState } from 'react';
export function Example({ on }: { on: boolean }) {
  ${body}
}
void useEffect; void useRef; void useState;
`;

const examples: Record<string, string> = {
  'react-hooks/rules-of-hooks': component('if (on) { useState(0); } return <p />;'),
  'react-hooks/exhaustive-deps': component(
    'useEffect(() => { console.log(on); }, []); return <p />;',
  ),
  'react-hooks/set-state-in-effect': component(
    'const [n, setN] = useState(0); useEffect(() => { setN(1); }, []); return <p>{n}{on}</p>;',
  ),
  'react-hooks/refs': component('const r = useRef(0); return <p>{r.current}{on}</p>;'),
  'react-hooks/purity': component('return <p>{Math.random()}{on}</p>;'),
  'react-hooks/immutability': component(
    'const [n] = useState({ a: 1 }); n.a = 2; return <p>{n.a}{on}</p>;',
  ),
  'react-hooks/static-components': component(
    'const Inner = () => <p />; return <Inner key={String(on)} />;',
  ),
  'react-hooks/set-state-in-render': component(
    'const [n, setN] = useState(0); setN(1); return <p>{n}{on}</p>;',
  ),
  'react-hooks/error-boundaries': component('try { return <p>{on}</p>; } catch { return null; }'),
  '@eslint-react/web-api-no-leaked-fetch': component(
    "useEffect(() => { fetch('/x'); }, []); return <p>{on}</p>;",
  ),
  '@eslint-react/web-api-no-leaked-timeout': component(
    'useEffect(() => { setTimeout(() => {}, 1); }, []); return <p>{on}</p>;',
  ),
  '@eslint-react/web-api-no-leaked-interval': component(
    'useEffect(() => { setInterval(() => {}, 1); }, []); return <p>{on}</p>;',
  ),
  '@eslint-react/web-api-no-leaked-event-listener': component(
    "useEffect(() => { window.addEventListener('scroll', () => {}); }, []); return <p>{on}</p>;",
  ),
  '@eslint-react/web-api-no-leaked-resize-observer': component(
    'useEffect(() => { new ResizeObserver(() => {}).observe(document.body); }, []); return <p>{on}</p>;',
  ),
  '@eslint-react/web-api-no-leaked-intersection-observer': component(
    'useEffect(() => { new IntersectionObserver(() => {}).observe(document.body); }, []); return <p>{on}</p>;',
  ),
};

describe('the lint config', () => {
  // Some rules only fire on code that's hard to write on purpose, so this covers every one of them.
  it('makes every hook and leak rule an error, for every kind of source file', async () => {
    for (const file of ['A.tsx', 'a.ts', 'A.jsx', 'a.js']) {
      const { rules } = (await eslint.calculateConfigForFile(`src/components/${file}`)) as {
        rules: Record<string, [number]>;
      };
      const ours = Object.entries(rules).filter(([rule]) =>
        /^react-hooks\/|no-leaked-(?!dollar|semi)/.test(rule),
      );
      expect(ours.length, file).toBe(22);
      expect(ours.filter(([, [severity]]) => severity !== 2)).toEqual([]);
    }
  });
});

describe('lint on a deliberately bad component', () => {
  for (const [rule, code] of Object.entries(examples)) {
    it(`${rule} fails it`, async () => {
      const [result] = await eslint.lintText(code, { filePath: 'src/components/LintExample.tsx' });
      const severities = result?.messages
        .filter((message) => message.ruleId === rule)
        .map((message) => message.severity);
      expect(severities, JSON.stringify(result?.messages.map((m) => m.ruleId))).toContain(2);
    });
  }
});
