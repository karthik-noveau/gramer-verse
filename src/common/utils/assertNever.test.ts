import { assertNever } from 'common/utils/assertNever';

describe('assertNever', () => {
  it('throws, naming the value that was not handled', () => {
    /* Cast, because reaching it is exactly what cannot happen in typed code —
       the case being tested is JSON carrying a kind TypeScript never saw. */
    expect(() => assertNever('sculpture' as never)).toThrow('Unhandled value: "sculpture"');
  });

  it('names what kind of thing it was', () => {
    expect(() => assertNever('sculpture' as never, 'scene kind')).toThrow(
      'Unhandled scene kind: "sculpture"',
    );
  });
});
