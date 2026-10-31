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
