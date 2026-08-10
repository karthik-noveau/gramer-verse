import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/* The prototype is the approved design, so it is also the checklist: every
   custom property it declares must exist in the theme. Dropping one is silent
   otherwise — the component that wanted it just renders with nothing. */

const ROOT = join(__dirname, '..', '..');
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8');

const PROTOTYPE = read('spec/ui-prototypes/assets/css/tokens.css');
const COLOURS = read('src/theme/colours.css');
const FONTS = read('src/theme/fonts.css');
const OVERRIDES = read('src/theme/overrides.css');

const declaredIn = (css: string): ReadonlySet<string> => {
  const names = new Set<string>();
  for (const [, name] of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
    if (name !== undefined) names.add(name);
  }
  return names;
};

const THEME_TOKENS = new Set([...declaredIn(COLOURS), ...declaredIn(FONTS)]);

describe('theme tokens', () => {
  it('declares every token the prototype declares', () => {
    const missing = [...declaredIn(PROTOTYPE)].filter((n) => !THEME_TOKENS.has(n));

    expect(missing).toEqual([]);
  });

  it('splits the tokens the way the engine specifies', () => {
    expect(declaredIn(COLOURS).has('--accent')).toBe(true);
    expect(declaredIn(COLOURS).has('--r-figure')).toBe(true);
    expect(declaredIn(FONTS).has('--fs-base')).toBe(true);
    expect(declaredIn(FONTS).has('--s-4')).toBe(true);
    expect(declaredIn(FONTS).has('--tamil')).toBe(true);
  });

  it('keeps light as the default and dark behind data-theme', () => {
    expect(COLOURS).toContain(':root[data-theme="dark"]');
    /* Dark must never be reached by system preference alone. */
    expect(COLOURS).not.toMatch(/prefers-color-scheme/);
    expect(COLOURS).toContain('color-scheme: dark');
    expect(COLOURS).toContain('color-scheme: light');
  });

  it('zeroes the duration tokens under prefers-reduced-motion', () => {
    const block = COLOURS.slice(COLOURS.indexOf('prefers-reduced-motion'));

    for (const token of ['--t-fast', '--t-base', '--t-slow']) {
      expect(block).toContain(`${token}: 0ms`);
    }
  });

  it('ships the Tamil face and sizes Tamil text up', () => {
    expect(FONTS).toContain('noto-sans-tamil-subset.woff2');
    expect(FONTS).toContain('font-display: swap');
    /* A metric-matched fallback, or the sentence moves when the face swaps. */
    expect(FONTS).toContain('size-adjust');
    expect(OVERRIDES).toContain('font-size: 1.06em');
    expect(OVERRIDES).toContain('line-height: 1.75');
  });

  it('keeps [hidden] able to beat a component display rule', () => {
    expect(OVERRIDES).toMatch(/\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  });

  it('records the font licence', () => {
    const licence = read('src/assets/fonts/LICENCE.md');

    expect(licence).toContain('SIL Open Font License');
    expect(licence).toContain('PERMISSION & CONDITIONS');
  });
});
