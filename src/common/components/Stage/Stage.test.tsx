import { act, render, screen } from '@testing-library/react';

import { Stage } from 'common/components/Stage/Stage';
import * as registry from 'common/scene/renderers/registry';
import { STAGE } from 'common/scene/layout';
import type { ActorSpec, PlaceSpec, PropId, VerbId } from 'common/scene/types';

/* ============================================================
   Stage.test.tsx

   The one React component in the scene engine, so the questions
   are React ones: does the tree come out as SVG, is the picture
   available to a screen reader in both languages, and does an
   unrelated re-render rebuild it.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

const PLACE: PlaceSpec = {
  kind: 'place',
  figure: id('ball'),
  ground: id('box'),
  ground2: null,
  relation: 'in',
  determiner: 'the',
  count: 1,
  adjective: null,
};

const ACTOR: ActorSpec = {
  kind: 'actor',
  actor: id('man'),
  verb: 'eat' as VerbId,
  patient: id('apple'),
  cue: 'chomp',
  voice: 'active',
  mood: 'statement',
  negated: false,
};

const svgOf = (): SVGSVGElement => screen.getByRole('img') as unknown as SVGSVGElement;

describe('Stage', () => {
  it('draws the scene into one svg with the stage viewBox', () => {
    render(<Stage spec={PLACE} />);

    expect(svgOf().getAttribute('viewBox')).toBe(`0 0 ${STAGE.width} ${STAGE.height}`);
    expect(svgOf().querySelectorAll('g').length).toBeGreaterThan(0);
  });

  it('renders every node of the tree, nested as the tree is', () => {
    const { container } = render(<Stage spec={PLACE} />);
    const ground = container.querySelector('[data-node="ground"]');

    expect(ground?.tagName).toBe('g');
    /* A prop draws itself into its own group, so the ground's parts are its
       children rather than siblings on the stage. */
    expect((ground?.childElementCount ?? 0) > 0).toBe(true);
  });

  it('carries the node ids through, because they are what the diff matches on', () => {
    const { container } = render(<Stage spec={ACTOR} />);

    expect(container.querySelector('[data-node="actor"]')).not.toBeNull();
    expect(container.querySelector('[data-node="patient"]')).not.toBeNull();
  });

  it('writes the attributes out as SVG, and says nothing to the console', () => {
    /* The renderers speak SVG and React speaks DOM properties. Get that wrong
       and `stroke-width` is dropped with a warning nobody reads — the picture
       still appears, drawn with hairlines. */
    const warn = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    /* `a` rather than `the`: the indefinite determiner is the dashed ring, and
       the dash is the attribute React is most likely to swallow. */
    const { container } = render(<Stage spec={{ ...PLACE, determiner: 'a' }} />);

    expect(container.querySelector('[stroke-width]')).not.toBeNull();
    expect(container.querySelector('[stroke-dasharray]')).not.toBeNull();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('keeps grammar words outside the drawing', () => {
    render(<Stage spec={{ ...PLACE, determiner: 'a' }} />);

    expect(svgOf().querySelector('text')).toBeNull();
  });

  it('describes the picture in English on the image itself', () => {
    render(<Stage spec={PLACE} />);

    expect(svgOf().getAttribute('aria-label')).toBe('the ball in the box');
  });

  it('puts the Tamil in the figure, tagged as Tamil and not shown', () => {
    const { container } = render(<Stage spec={PLACE} />);
    const caption = container.querySelector('figcaption');

    expect(caption?.getAttribute('lang')).toBe('ta');
    expect(caption?.className).toContain('sr-only');
    expect(caption?.textContent).toBe('பெட்டியில் பந்து');
    /* Inside the figure, not floating in the page: a description that is not
       associated with its picture is read out as a stray line of Tamil. */
    expect(caption?.closest('figure')?.contains(svgOf())).toBe(true);
  });

  it('shows a bilingual grammar guide below a place picture when requested', () => {
    const { container } = render(<Stage spec={PLACE} guide />);
    const caption = container.querySelector('figcaption');

    expect(caption?.className).not.toContain('sr-only');
    expect(caption?.textContent).toContain('in');
    expect(caption?.textContent).toContain('உள்ளே');
    expect(caption?.textContent).toContain('the');
    expect(caption?.textContent).toContain('குறிப்பிட்ட ஒன்று');
    expect(svgOf().textContent).not.toContain('the');
  });

  it('keeps the svg out of the tab order — it is a picture, not a control', () => {
    render(<Stage spec={PLACE} />);

    expect(svgOf().getAttribute('focusable')).toBe('false');
  });

  it('renders the fallback, and no svg, for a scene that cannot be drawn', () => {
    const impossible: PlaceSpec = { ...PLACE, relation: 'in', ground: id('tree') };
    render(<Stage spec={impossible} fallback={<p>Nothing goes inside a tree.</p>} />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Nothing goes inside a tree.')).toBeTruthy();
  });

  it('renders nothing at all when a refused scene is given no fallback', () => {
    const { container } = render(<Stage spec={{ ...PLACE, ground: id('tree') }} />);

    expect(container.innerHTML).toBe('');
  });

  it('does not rebuild the picture when the parent re-renders with the same spec', () => {
    /* Counted rather than inferred from the DOM: React reuses elements whether
       or not the tree was rebuilt, so an unchanged picture proves nothing
       about the work done to produce it. */
    const drawn = jest.spyOn(registry, 'renderScene');
    const { rerender } = render(<Stage spec={PLACE} />);
    const first = drawn.mock.calls.length;

    rerender(<Stage spec={PLACE} />);
    expect(drawn.mock.calls.length).toBe(first);

    rerender(<Stage spec={{ ...PLACE }} />);
    expect(drawn.mock.calls.length).toBeGreaterThan(first);
    drawn.mockRestore();
  });

  it('redraws when the spec changes', () => {
    const { rerender } = render(<Stage spec={PLACE} />);

    rerender(<Stage spec={{ ...PLACE, relation: 'on', ground: id('table') }} />);

    expect(svgOf().getAttribute('aria-label')).toBe('the ball on the table');
  });
});

/* ============================================================
   The picture, mid-change.

   The claim is that a knob moves what is already on the stage
   rather than replacing the stage. What is checked here is the
   labelling — the stylesheet does the moving, and a class that
   never arrives is an animation nobody sees.
   ============================================================ */

describe('Stage — transitions', () => {
  const classesIn = (container: HTMLElement, id_: string): string =>
    container.querySelector(`[data-node="${id_}"]`)?.getAttribute('class') ?? '';

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('draws the first picture with nothing arriving', () => {
    /* Opening a lesson is not a change to it: everything fading in on arrival
       is a page that looks like it is still loading. */
    const { container } = render(<Stage spec={PLACE} />);

    expect(classesIn(container, 'figure-0')).toBe('');
  });

  it('marks what moved as moving, and leaves the rest alone', () => {
    const { container, rerender } = render(<Stage spec={PLACE} />);

    rerender(<Stage spec={{ ...PLACE, relation: 'above', ground: id('table') }} />);

    expect(classesIn(container, 'figure-0')).toContain('moving');
  });

  it('marks a new node as entering', () => {
    const { container, rerender } = render(<Stage spec={PLACE} />);

    rerender(<Stage spec={{ ...PLACE, count: 3 }} />);

    expect(classesIn(container, 'figure-2')).toContain('entering');
  });

  it('keeps a node that left on the stage until it has faded, then drops it', () => {
    const { container, rerender } = render(
      <Stage spec={{ ...PLACE, relation: 'near', ground: id('table') }} />,
    );
    rerender(<Stage spec={{ ...PLACE, relation: 'beside', ground: id('table') }} />);
    const leaving = [...container.querySelectorAll('[class*="leaving"]')];
    expect(leaving.length).toBeGreaterThan(0);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(container.querySelectorAll('[class*="leaving"]')).toHaveLength(0);
  });

  it('retargets rather than queues when a knob is turned mid-transition', () => {
    const { container, rerender } = render(<Stage spec={PLACE} />);

    rerender(<Stage spec={{ ...PLACE, relation: 'above', ground: id('table') }} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender(<Stage spec={{ ...PLACE, relation: 'under', ground: id('table') }} />);

    /* Still moving — the second turn restarted the transition rather than
       waiting for the first to finish. */
    expect(classesIn(container, 'figure-0')).toContain('moving');

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(classesIn(container, 'figure-0')).toBe('');
  });

  it('replaces rather than tweens when the whole lesson changes', () => {
    /* Two pictures with nothing in common: a pile of things sliding across
       each other to no purpose. */
    const { container, rerender } = render(<Stage spec={PLACE} />);

    rerender(
      <Stage spec={{ kind: 'timeline', tense: 'past-simple', marks: [], relation: null }} />,
    );

    expect(container.querySelectorAll('[class*="moving"]')).toHaveLength(0);
    expect(container.querySelectorAll('[class*="entering"]')).toHaveLength(0);
    expect(container.querySelectorAll('[class*="leaving"]')).toHaveLength(0);
  });

  it('applies the new picture with no transition at all under reduced motion', () => {
    /* Reduced motion means no motion, not fast motion. */
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;

    const { container, rerender } = render(<Stage spec={PLACE} />);
    rerender(<Stage spec={{ ...PLACE, relation: 'above', ground: id('table') }} />);

    expect(classesIn(container, 'figure-0')).toBe('');
    expect(container.querySelectorAll('[class*="entering"]')).toHaveLength(0);

    // @ts-expect-error putting jsdom back the way it was found
    delete window.matchMedia;
  });
});
