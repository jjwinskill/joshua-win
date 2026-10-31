// An SVG chart of about 2,000 React-rendered points that updates as the reader scrubs. It draws nothing
// until it's near the viewport. Only the reader moves it, so reduced motion changes nothing. The visual
// is hidden from screen readers, with a list of sampled values beside it (S16).
import { useMemo, useState } from 'react';
import { chartPoints, chartSample, chartSize, chartSteps } from './chartData';
import { useNearViewport } from './useNearViewport';

export function HeavyChart() {
  const { ref: figure, near } = useNearViewport<HTMLElement>();
  const [step, setStep] = useState(30);
  const points = useMemo(() => (near ? chartPoints(step) : []), [near, step]);
  const sample = useMemo(() => chartSample(step), [step]);

  return (
    <figure className="heavy-figure" ref={figure}>
      <svg
        className="heavy-chart"
        viewBox={`0 0 ${chartSize.width} ${chartSize.height}`}
        aria-hidden="true"
      >
        {points.map(({ x, y }, i) => (
          <circle key={i} cx={x} cy={y} r="1.6" />
        ))}
      </svg>
      <ul className="visually-hidden">
        {sample.map(({ x, y }) => (
          <li key={x}>
            {Math.round(x)}: {Math.round(y)}
          </li>
        ))}
      </ul>
      <figcaption>
        <label className="heavy-scrub">
          Lorem ipsum dolor sit amet.
          <input
            type="range"
            min="0"
            max={chartSteps}
            value={step}
            aria-valuetext={`Step ${step} of ${chartSteps}`}
            onChange={(event) => setStep(Number(event.target.value))}
          />
        </label>
      </figcaption>
    </figure>
  );
}
