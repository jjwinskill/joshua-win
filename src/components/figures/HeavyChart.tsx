// An SVG chart of about 2,000 React-rendered points that updates as the reader scrubs. It draws nothing
// until it's near the viewport. Under reduced motion it's the same, since only the reader moves it (S16).
import { useMemo, useState } from 'react';
import { chartPeak, chartPoints, chartSize, chartSteps } from './chartData';
import { useNearViewport } from './useNearViewport';

export function HeavyChart() {
  const { ref: figure, near } = useNearViewport<HTMLElement>();
  const [step, setStep] = useState(30);
  const points = useMemo(() => (near ? chartPoints(step) : []), [near, step]);
  const peak = chartPeak(points);

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
      <p className="visually-hidden" aria-live="polite">
        {peak && `Step ${step} of ${chartSteps}: the highest point is at ${Math.round(peak.x)}.`}
      </p>
      <figcaption>
        <label>
          Lorem ipsum dolor sit amet. Step {step}
          <input
            type="range"
            min="0"
            max={chartSteps}
            value={step}
            onChange={(event) => setStep(Number(event.target.value))}
          />
        </label>
      </figcaption>
    </figure>
  );
}
