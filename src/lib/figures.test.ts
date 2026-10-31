import { expect, it } from 'vitest';
import { splitAtFigures } from './figures';

it('leaves a piece with no figures whole', () => {
  expect(splitAtFigures('<p>A</p>')).toEqual([{ html: '<p>A</p>' }]);
});

it('fails on a marker it doesn’t recognise, rather than losing the figure', () => {
  expect(() => splitAtFigures('<div data-figure="sceen"></div>')).toThrow('Unknown figure marker');
});

it('splits the text around each figure, in order', () => {
  const html = '<p>A</p><div data-figure="scene"></div><p>B</p><div data-figure="chart"></div>';
  expect(splitAtFigures(html)).toEqual([
    { html: '<p>A</p>' },
    { figure: 'scene' },
    { html: '<p>B</p>' },
    { figure: 'chart' },
  ]);
});
