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

  it('prints its hip line where the shared legs start and turn', () => {
    const { container: sheet } = render(<TemplateSheet />);
    const { container: figure } = render(<CastFigure castKey="rabbit" />);
    const thigh = figure.querySelector('.thigh line');
    const hipY = thigh?.getAttribute('y1');
    const hipLines = [...sheet.querySelectorAll('[data-hip-line]')];
    expect(hipY).toBeTruthy();
    expect(hipLines).toHaveLength(4);
    for (const line of hipLines) {
      expect(line.getAttribute('y1')).toBe(hipY);
      expect(line.getAttribute('y2')).toBe(hipY);
    }
    for (const part of figure.querySelectorAll<SVGElement>('.thigh, .torso')) {
      expect(part.style.transformOrigin).toContain(`${hipY}px`);
    }
    for (const line of sheet.querySelectorAll('.thigh > line')) {
      expect(line.getAttribute('y1')).toBe(hipY);
    }
    expect(sheet.querySelector('[transform]')).toBeNull();
  });
});
