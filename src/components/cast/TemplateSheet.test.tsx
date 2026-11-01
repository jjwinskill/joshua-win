import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CastFigure } from './CastFigure';
import { TemplateSheet } from './TemplateSheet';

describe('TemplateSheet', () => {
  it('has one box for each cast member', () => {
    const { container } = render(<TemplateSheet />);
    for (const name of [
      'Haňťa',
      'A crumpled sheet of paper',
      'The giant new hydraulic press at Bubny',
      'A glass of milk',
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(container.querySelectorAll('figure svg')).toHaveLength(4);
  });

  it('prints its hip line where the shared legs start', () => {
    const { container: sheet } = render(<TemplateSheet />);
    const { container: figure } = render(<CastFigure castKey="rabbit" />);
    const thigh = figure.querySelector('.thigh line');
    const hipLines = [...sheet.querySelectorAll('[data-hip-line]')];
    expect(thigh?.getAttribute('y1')).toBeTruthy();
    expect(hipLines).toHaveLength(4);
    for (const line of hipLines) {
      expect(line.getAttribute('y1')).toBe(thigh?.getAttribute('y1'));
    }
  });
});
