import type { JSX } from 'react';
import { act, render, screen } from '@testing-library/react';

import * as contentApi from 'common/api/content.api';
import { useContent } from 'common/hooks/useContent';
import { useContentStore } from 'store/content.store';

function Probe(): JSX.Element {
  const content = useContent();

  if (content.status === 'loading') return <p>loading</p>;
  if (content.status === 'error') return <p>error: {content.error.message}</p>;
  return (
    <p>
      ready: {content.topics.length} topics, {content.lessons.length} lessons,{' '}
      {content.isEmpty ? 'empty' : 'not empty'}
    </p>
  );
}

/* The hook starts the load in an effect, so the store settles in a promise
   callback that React knows nothing about. Awaiting the store's own promise
   inside act() is what makes the test deterministic — and keeps the run free
   of act() warnings, which are worth something only while they are rare. */
const settle = async (): Promise<void> => {
  await act(async () => {
    await useContentStore.getState().load();
  });
};

beforeEach(() => {
  useContentStore.getState().reset();
  jest.restoreAllMocks();
});

describe('useContent', () => {
  it('reports loading before anything has arrived', () => {
    render(<Probe />);

    expect(screen.getByText('loading')).toBeTruthy();
  });

  it('reports ready with the content once it has', async () => {
    render(<Probe />);
    await settle();

    expect(screen.getByText(/10 topics, 13 lessons, not empty/)).toBeTruthy();
  });

  it('starts the load itself, so a page does not have to remember to', async () => {
    const spy = jest.spyOn(contentApi, 'loadContent');
    render(<Probe />);
    await settle();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads once for two components mounted together', async () => {
    const spy = jest.spyOn(contentApi, 'loadContent');
    render(
      <div>
        <Probe />
        <Probe />
      </div>,
    );
    await settle();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/^ready:/)).toHaveLength(2);
  });

  it('reports the error, with the message the API gave it', async () => {
    jest
      .spyOn(contentApi, 'loadContent')
      .mockRejectedValueOnce(new Error('lessons/prepositions-place.json → lessons[0].why.ta'));
    render(<Probe />);
    await settle();

    expect(screen.getByText(/^error:/)).toBeTruthy();
    expect(screen.getByText(/lessons\[0\]\.why\.ta/)).toBeTruthy();
  });

  it('says empty rather than loading when there is genuinely nothing', async () => {
    jest.spyOn(contentApi, 'loadContent').mockResolvedValueOnce({
      topics: [],
      lessons: [],
      lexicon: { props: [], verbs: [], propIds: new Set(), verbIds: new Set() },
      curriculum: { outlines: [], tables: [], corrections: [], formation: { rows: {}, words: {} } },
    });
    render(<Probe />);
    await settle();

    expect(screen.getByText(/0 topics, 0 lessons, empty/)).toBeTruthy();
  });

  it('holds nothing to read until it is ready', () => {
    /* The union is the point: `topics` does not exist on the loading arm, so a
       page cannot read it early. This is the runtime half of that claim. */
    render(<Probe />);

    expect(screen.queryByText(/^ready:/)).toBeNull();
    expect(screen.getByText('loading')).toBeTruthy();
  });
});
