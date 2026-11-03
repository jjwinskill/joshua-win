// The theme switcher (#85), in a build with THEMES=yes only: the essays' theme, the write-ups' and the mode,
// kept in this browser. head.js holds the choice and puts it on html.
interface Choice {
  house: string;
  writeup: string;
  mode: string;
}

declare global {
  interface Window {
    devTheme: { read: () => Choice; apply: (root: Element, choice?: Choice) => void };
  }
}

const fields: { key: keyof Choice; label: string; options: [string, string][] }[] = [
  {
    key: 'house',
    label: 'Essays and home',
    options: [
      ['soft-optical', 'Soft Optical'],
      ['off', 'Today’s look'],
    ],
  },
  {
    key: 'writeup',
    label: 'Write-ups',
    options: [
      ['sorting-office', 'Sorting Office, Counter Green'],
      ['plum-hour', 'Plum Hour'],
      ['same', 'Same as essays'],
    ],
  },
  {
    key: 'mode',
    label: 'Mode (themes only)',
    options: [
      ['auto', 'Follow the device'],
      ['dark', 'Dark'],
      ['light', 'Light'],
    ],
  },
];

function mount() {
  if (document.querySelector('.dev-theme')) return;
  const choice = window.devTheme.read();
  const box = document.createElement('details');
  box.className = 'dev-theme';
  const summary = document.createElement('summary');
  summary.textContent = 'Theme';
  box.append(summary);
  for (const field of fields) {
    const select = document.createElement('select');
    for (const [value, text] of field.options) {
      select.append(new Option(text, value, false, choice[field.key] === value));
    }
    select.addEventListener('change', () => {
      const next = { ...window.devTheme.read(), [field.key]: select.value };
      try {
        localStorage.setItem('dev-theme', JSON.stringify(next));
      } catch {
        // Storage blocked: the choice lasts until the next page.
        window.devTheme.apply(document.documentElement, next);
        return;
      }
      // A reload, so what draws its colors once, such as the Swirl's canvas, draws them again.
      location.reload();
    });
    const label = document.createElement('label');
    label.append(field.label, select);
    box.append(label);
  }
  document.body.append(box);
}

// The router replaces html's attributes with the new page's, so the choice goes on the new page first.
document.addEventListener('astro:before-swap', (event) => {
  const choice = window.devTheme.read();
  const root = event.newDocument.documentElement;
  window.devTheme.apply(root, choice);
  // A card moving to or from a write-up is painted in the write-up's colors (themes.css).
  if (choice.house === 'off' || choice.writeup === 'same') return;
  const isWriteUp = (root: HTMLElement) => root.dataset.kind === 'write-up';
  if (!isWriteUp(root) && !isWriteUp(document.documentElement)) return;
  root.dataset.movingKind = 'write-up';
  event.viewTransition.finished
    .catch(() => undefined)
    .finally(() => delete document.documentElement.dataset.movingKind);
});

document.addEventListener('astro:page-load', mount);

export {};
