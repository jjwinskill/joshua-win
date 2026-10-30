// The first shared component: a plain React component with no Astro or framework APIs,
// so the phase 2 bake-off can reuse it in Next unchanged.
import type { ReactNode } from 'react';

interface GreetingProps {
  heading: string;
  children?: ReactNode;
}

export function Greeting({ heading, children }: GreetingProps) {
  return (
    <section>
      <h1>{heading}</h1>
      {children}
    </section>
  );
}
