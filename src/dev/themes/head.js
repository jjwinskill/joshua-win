// Puts the chosen theme on html before the first paint, so no page shows in the wrong one first. The router
// doesn't run this again, so switcher.ts puts it on each page the router swaps in.
(() => {
  const defaults = { house: 'soft-optical', writeup: 'sorting-office', mode: 'auto' };
  const read = () => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem('dev-theme') ?? '{}') };
    } catch {
      return defaults;
    }
  };
  const apply = (root, choice = read()) => {
    const set = (name, value) =>
      value ? root.setAttribute(name, value) : root.removeAttribute(name);
    set('data-house', choice.house === 'off' ? null : choice.house);
    set('data-writeup', choice.writeup === 'same' ? null : choice.writeup);
    set('data-mode', choice.mode === 'auto' ? null : choice.mode);
  };
  window.devTheme = { read, apply };
  apply(document.documentElement);
})();
