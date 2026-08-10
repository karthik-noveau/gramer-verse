import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useParams } from 'react-router';

import { Breadcrumbs } from 'common/components/Breadcrumbs/Breadcrumbs';
import { Button } from 'common/components/Button/Button';
import { EmptyState } from 'common/components/EmptyState/EmptyState';
import { ErrorState } from 'common/components/ErrorState/ErrorState';
import { Spinner } from 'common/components/Spinner/Spinner';
import { paths } from 'common/constants/routes';
import { formationFor } from 'common/api/content.api';
import { useContent } from 'common/hooks/useContent';
import { PROPS } from 'common/scene/props/index';
import { ACTOR_VERBS } from 'common/scene/renderers/actor.renderer';
import type { Correction, Curriculum, NonEmptyString, SourceTable, TopicId } from 'common/scene/types';
import { ReferenceTable } from 'pages/reference/components/ReferenceTable/ReferenceTable';

import styles from './styles.module.css';

/* ============================================================
   /reference and /reference/:tableId — the source, browsable.

   Every table the notes contain, rendered from the same content
   the lessons are built from, so the two cannot drift. Where the
   app teaches something the notes got wrong, it says so here
   rather than quietly correcting the row: a learner whose own
   notes are wrong deserves to know which line it was.
   ============================================================ */

export default function ReferencePage(): JSX.Element {
  const { tableId } = useParams();
  const content = useContent();

  if (content.status === 'loading') return <Spinner label="Loading the reference" />;

  if (content.status === 'error') {
    return (
      <ErrorState
        title="The source tables could not be loaded"
        body="Nothing here can be shown until the content it is built from is valid."
        ta="மூல அட்டவணைகளை ஏற்ற முடியவில்லை."
        detail={content.error.message}
        action={
          <Button variant="primary" to={paths.topics()}>
            All topics
          </Button>
        }
      />
    );
  }

  return (
    <Reference
      curriculum={content.curriculum}
      drawable={drawableVerbs(content.lexicon.verbs)}
      linked={tableId}
    />
  );
}

/** The verbs this app can draw, by id. The lexicon is the authority; the scene
 *  engine's table is what actually draws them, and a test in `common/api`
 *  holds the two to each other. */
const drawableVerbs = (verbs: readonly { id: unknown; drawable: boolean }[]): ReadonlySet<string> =>
  new Set(verbs.filter((verb) => verb.drawable).map((verb) => String(verb.id)));

type ReferenceProps = {
  readonly curriculum: Curriculum;
  readonly drawable: ReadonlySet<string>;
  readonly linked: string | undefined;
};

function Reference({ curriculum, drawable, linked }: ReferenceProps): JSX.Element {
  const { tables, corrections } = curriculum;
  const all = useMemo(() => [...tables, whatCanBeDrawn()], [tables]);
  const known = all.some((table) => table.id === linked);
  const active = useScrollSpy(all.map((table) => table.id), linked);

  /* A deep link scrolls to its table once, on arrival. After that the spy
     takes over — reading the page is what moves the mark, not the address. */
  useEffect(() => {
    if (linked === undefined || !known) return;

    /* Guarded: jsdom has no `scrollIntoView`, and neither does a static
       render. Not scrolling is a fine way to arrive at a page. */
    const node = document.getElementById(linked);
    if (typeof node?.scrollIntoView === 'function') node.scrollIntoView({ block: 'start' });
  }, [linked, known]);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Reference' }]} />

      <div className={styles.head}>
        <h1>Reference</h1>
        <p className={styles.sub}>
          The source tables, for looking things up.
          <span className={styles.ta} lang="ta">
            {' '}
            மூல அட்டவணைகள்.
          </span>
        </p>
      </div>

      {/* An address that is not a table says so and stays as it was typed. The
          tables are still below it: a wrong link is no reason to hide the
          thing that was being looked for. */}
      {linked !== undefined && !known ? (
        <EmptyState
          title={`There is no table called “${linked}”`}
          body="It may have been renamed. Every table there is follows."
          ta="இந்த அட்டவணை இல்லை."
          action={
            <Button variant="primary" to={paths.reference()}>
              All tables
            </Button>
          }
        />
      ) : null}

      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Reference tables">
          <ul>
            {all.map((table) => (
              <li key={table.id}>
                <a
                  href={`#${table.id}`}
                  aria-current={table.id === active ? 'true' : undefined}
                  className={table.id === active ? styles.here : undefined}
                >
                  {String(table.title.en)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.tables}>
          {all.map((table) => (
            <ReferenceTable
              key={table.id}
              table={table}
              linked={table.id === linked}
              annotate={table.id === 'main-verbs' ? verbNote(drawable) : undefined}
              /* Where the notes gave a sentence in both languages, the row can
                 be opened into a diagram of how the two are ordered. */
              formationOf={(row, index) => formationFor(curriculum, table.id, index, row)}
            />
          ))}

          <Corrections corrections={corrections} />
        </div>
      </div>
    </>
  );
}

/** Which rows of the verb table this app can draw. The vocabulary limit is
 *  visible here rather than discovered in practice. */
const verbNote = (
  drawable: ReadonlySet<string>,
): { header: string; of: (row: readonly string[]) => string | null } => ({
  header: 'In this app',
  of: (row) => {
    const root = (row[0] ?? '').split('\n')[0]?.trim().toLowerCase() ?? '';
    return drawable.has(root) ? 'Drawn' : null;
  },
});

/**
 * What this app can draw, as a table of its own.
 *
 * Not from the notes — this is the app describing itself, and it is built from
 * the libraries that do the drawing, so it cannot claim a prop that was
 * removed or miss a verb that was added.
 */
function whatCanBeDrawn(): SourceTable {
  const props = Object.keys(PROPS).sort();
  const verbs = Object.keys(ACTOR_VERBS).sort();

  return {
    id: 'what-can-be-drawn',
    topicId: '' as TopicId,
    title: {
      en: 'What can be drawn' as NonEmptyString,
      ta: 'வரையக்கூடியவை' as NonEmptyString,
    },
    columns: ['Kind', 'Words'],
    rows: [
      ['Things\nபொருள்கள்', props.join(', ')],
      ['Actions\nசெயல்கள்', verbs.join(', ')],
      [
        'Places\nஇடங்கள்',
        'in, on, at, under, above, below, behind, in front of, between, near, beside, here, there',
      ],
      ['Directions\nதிசைகள்', 'to, into, towards, along, across, over, past, from'],
      ['Times\nகாலங்கள்', 'in, on, at, before, after, by, since, during, until'],
      ['Roles\nபங்குகள்', 'and, but, or, because, so, about, for, with, as, like, per'],
    ],
  };
}

/**
 * Where the app departs from the notes.
 *
 * Never applied silently. The row stays as the source wrote it and the reason
 * is recorded here, because a learner working from those notes needs to know
 * which line of them was wrong.
 */
function Corrections({ corrections }: { readonly corrections: readonly Correction[] }): JSX.Element | null {
  if (corrections.length === 0) return null;

  return (
    <section className={styles.corrections} id="corrections" aria-labelledby="corrections-title">
      <h2 className={styles.title} id="corrections-title">
        Where these notes are wrong
        <span className={styles.ta} lang="ta">
          {' '}
          திருத்தங்கள்
        </span>
      </h2>
      <p className={styles.sub}>
        The tables above are the notes as they were written. These are the places this app
        teaches something else, and why.
      </p>

      <ol className={styles.list}>
        {corrections.map((correction, index) => (
          <li className={styles.correction} key={`${correction.where}-${index}`}>
            <span className={styles.where}>{correction.where}</span>
            <p className={styles.was}>
              <span className={styles.label}>The notes say</span> {correction.was}
            </p>
            <p className={styles.now}>
              <span className={styles.label}>This app teaches</span> {correction.now}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Which table the reader is looking at.
 *
 * Starts on whatever was linked to, so the mark is right on the first paint
 * rather than corrected after it — a spy that fights the deep-link scroll
 * flashes the wrong entry on arrival.
 */
function useScrollSpy(ids: readonly string[], linked: string | undefined): string | undefined {
  const [active, setActive] = useState<string | undefined>(linked ?? ids[0]);
  const key = ids.join(',');

  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return undefined;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }
        /* The first one still on screen, in the page's own order: reading down
           the page moves the mark down the list. */
        const first = key.split(',').find((id) => seen.has(id));
        if (first !== undefined) setActive(first);
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );

    for (const id of key.split(',')) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [key]);

  return active;
}
