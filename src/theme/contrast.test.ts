import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/* Contrast recorded in a comment is contrast nobody checked. This reads the
   real values out of colours.css and recomputes every ratio, in both schemes,
   for every ground a token is actually placed on. Two AA failures were found
   this way and fixed: --r-figure at 4.33 on the light page, and --muted at
   3.91 on the dark word-order panel, where the source line under the diagram
   sits. Neither was visible to the eye as a failure. */

const AA = 4.5;

const COLOURS = readFileSync(join(__dirname, 'colours.css'), 'utf8');

/* The two scheme blocks, split on the dark selector so a token defined in both
   is read from the right one. */
const DARK_AT = COLOURS.indexOf(':root[data-theme="dark"]');
const LIGHT_CSS = COLOURS.slice(0, DARK_AT);
const DARK_CSS = COLOURS.slice(DARK_AT);

type Scheme = Readonly<Record<string, string>>;

const parse = (css: string): Scheme => {
  const out: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi)) {
    if (name !== undefined && value !== undefined) out[name] = value.toLowerCase();
  }
  return out;
};

const LIGHT: Scheme = parse(LIGHT_CSS);
/* Dark redeclares only what changes, so it inherits the rest from light. */
const DARK: Scheme = { ...LIGHT, ...parse(DARK_CSS) };

const channel = (c: number): number =>
  c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const luminance = (hex: string): number => {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = channel(((n >> 16) & 0xff) / 255);
  const g = channel(((n >> 8) & 0xff) / 255);
  const b = channel((n & 0xff) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};

/* Where each text token is actually drawn. A token is only asked to clear AA
   against grounds it meets: --danger never appears inside the word-order
   panel, so demanding it would be inventing a requirement. */
const PLANES = ['--bg', '--surface', '--surface-sunk'] as const;
const ROLES = [
  '--r-figure', '--r-ground', '--r-rel', '--r-det',
  '--r-be', '--r-qual', '--r-ask', '--r-join',
] as const;

const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ...['--ink', '--soft', '--muted', '--accent', '--warn', '--danger', '--info', ...ROLES]
    .flatMap((ink) => PLANES.map((ground) => [ink, ground] as const)),
  /* The opened word-order panel: the note, its bold, the source line, and the
     diagram's own words. */
  ...['--ink', '--soft', '--muted', ...ROLES].map((ink) => [ink, '--fm-bg'] as const),
  /* Tinted fills carry their own status colour as text. */
  ['--accent', '--accent-soft'],
  ['--warn', '--warn-soft'],
  ['--danger', '--danger-soft'],
  ['--info', '--info-soft'],
  /* Reversed-out pairs. */
  ['--accent-ink', '--accent'],
  ['--th-ink', '--th-bg'],
];

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
])('%s scheme', (_name, scheme: Scheme) => {
  it.each(PAIRS)('%s on %s clears WCAG AA', (ink, ground) => {
    const a = scheme[ink];
    const b = scheme[ground];

    expect(typeof a).toBe('string');
    expect(typeof b).toBe('string');
    expect(ratio(a as string, b as string)).toBeGreaterThanOrEqual(AA);
  });

  it('keeps raised surfaces separable from the ground', () => {
    const bg = scheme['--bg'] as string;
    const surface = scheme['--surface'] as string;
    const sunk = scheme['--surface-sunk'] as string;

    /* 1.04 was tried and the page read as one flat sheet. */
    expect(ratio(bg, surface)).toBeGreaterThanOrEqual(1.1);
    /* Sunk sits strictly between the card and the page, never on top of it. */
    const between = (x: number, lo: number, hi: number): boolean => x > lo && x < hi;
    const [l1, l2, l3] = [luminance(bg), luminance(sunk), luminance(surface)];
    expect(between(l2 as number, Math.min(l1, l3), Math.max(l1, l3))).toBe(true);
  });
});

describe('the ground', () => {
  it('is neutral, not cream', () => {
    const bg = LIGHT['--bg'] as string;
    const n = Number.parseInt(bg.slice(1), 16);
    const red = (n >> 16) & 0xff;
    const blue = n & 0xff;

    /* The old #f7f5f0 carried red 7 points above blue and yellowed every
       scene behind it. Within 2 points either way is neutral. */
    expect(Math.abs(red - blue)).toBeLessThanOrEqual(2);
  });
});
