import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useParams } from 'react-router';

import {
  explainTopic,
  formationFor,
  outlineOfTopic,
  tablesOfTopic,
} from 'common/api/content.api';
import { Button } from 'common/components/Button/Button';
import { EmptyState } from 'common/components/EmptyState/EmptyState';
import { ErrorState } from 'common/components/ErrorState/ErrorState';
import { SourceTable } from 'common/components/SourceTable/SourceTable';
import { Spinner } from 'common/components/Spinner/Spinner';
import { Tabs } from 'common/components/Tabs/Tabs';
import { paths } from 'common/constants/routes';
import { useContent } from 'common/hooks/useContent';
import type {
  Curriculum,
  Lesson,
  OutlineGroup,
  SourceTable as SourceTableData,
  Topic,
} from 'common/scene/types';
import { LessonRow } from 'pages/topic/components/LessonRow/LessonRow';

import styles from './styles.module.css';

/* ============================================================
   /topics/:topicId — one topic, whole.

   The source table first and the outline under it, because
   reading a topic at once is faster than stepping through it one
   word at a time. The rows the app can draw are links; the rest
   are still listed, because the notes are the curriculum and a
   page that hid what is not built yet would make the topic look
   shorter than it is.
   ============================================================ */

export default function TopicPage(): JSX.Element {
  const { topicId } = useParams();
  const content = useContent();

  if (content.status === 'loading') return <Spinner label="Loading the topic" centered />;

  if (content.status === 'error') {
    return (
      <ErrorState
        title="The curriculum could not be loaded"
        body="Nothing here can be shown until the content it is built from is valid."
        ta="உள்ளடக்கத்தை ஏற்ற முடியவில்லை."
        detail={content.error.message}
        action={
          <Button variant="primary" to={paths.topics()}>
            All topics
          </Button>
        }
      />
    );
  }

  const topic = content.topics.find((candidate) => String(candidate.id) === topicId);

  /* An unknown id renders the empty state and leaves the address alone. A
     redirect would hide the typo that caused it. */
  if (!topic) {
    return (
      <EmptyState
        title={`There is no topic called “${topicId ?? ''}”`}
        body="The address may have been mistyped, or the topic may have been renamed."
        ta="இந்தத் தலைப்பு இல்லை."
        action={
          <Button variant="primary" to={paths.topics()}>
            All topics
          </Button>
        }
      />
    );
  }

  return <Topic topic={topic} lessons={content.lessons} curriculum={content.curriculum} />;
}

type TopicProps = {
  readonly topic: Topic;
  readonly lessons: readonly Lesson[];
  readonly curriculum: Curriculum;
};

function Topic({ topic, lessons, curriculum }: TopicProps): JSX.Element {
  const [showMore, setShowMore] = useState(false);
  const tables = useMemo(() => tablesOfTopic(curriculum, topic.id), [curriculum, topic]);
  const outline = useMemo(() => outlineOfTopic(curriculum, topic.id), [curriculum, topic]);
  const groups = outline?.groups ?? [];
  const isTenses = String(topic.id) === 'tenses';
  const displayedTables = useMemo(
    () => (isTenses ? tables.map(compactTenseTable) : tables),
    [isTenses, tables],
  );

  const mine = useMemo(
    () => lessons.filter((lesson) => String(lesson.topicId) === String(topic.id)),
    [lessons, topic],
  );
  const explain = explainTopic(topic);
  const explanationEn = splitExplanation(explain.en);
  const explanationTa = splitExplanation(explain.ta);
  const needsMore = !isTenses && groups.length > 0;

  return (
    <>
      <div className={styles.head}>
        <div>
          {/* Both scripts in the one heading, the Tamil beside the English
              rather than under it — the same shape the source tables use for
              their titles, so a heading reads the same wherever it is. */}
          <h1 className={styles.title}>
            <span lang="en">{String(topic.title.en)}</span>
            <span className={styles.titleTa} lang="ta">
              {String(topic.title.ta)}
            </span>
          </h1>
          <div className={styles.sub}>
            <p className={styles.topicAnswer}>
              <span lang="en">{explanationEn.answer}</span>
              <span className={styles.ta} lang="ta">{explanationTa.answer}</span>
            </p>
          </div>
          {groups.length > 1 ? (
            <div className={styles.topicKindsBlock}>
              <p>Types</p>
              <ul className={styles.topicKinds} aria-label="Types">
                {groups.map((group) => (
                  <li key={String(group.title.en)}>
                    <span className={styles.typeArrow} aria-hidden="true">
                      <svg viewBox="0 0 22 22">
                        <circle cx="11" cy="11" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <path d="m9 7.5 3.5 3.5L9 14.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span lang="en">{typeLabel(String(group.title.en))}</span>
                    <span lang="ta">{String(group.title.ta)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* The visualizer is offered on prepositions alone: the scene engine
            draws a figure against a ground, which is what a preposition of
            place is, and no other topic has anything for it to stage. */}
        <p className={styles.cta}>
          {String(topic.id) === 'prepositions' ? (
            <Button variant="primary" to={paths.visualizer()}>
              Try in visualizer
            </Button>
          ) : null}
        </p>
      </div>

      <section className={styles.tables}>
        {displayedTables.length > 0 ? (
          isTenses ? (
            <BeginnerTenseGuide tables={displayedTables} />
          ) : (
            displayedTables.map((table) => (
              <SourceTable
                key={table.id}
                table={table}
                heading={
                  String(table.title.en).trim().toLowerCase() !==
                  String(topic.title.en).trim().toLowerCase()
                }
                /* Where the notes gave a sentence in both languages, the row can
                   be opened into a diagram of how the two are ordered. */
                formationOf={(row, index) =>
                  formationFor(curriculum, table.id, index, row)
                }
              />
            ))
          )
        ) : (
          <p className={styles.none}>No source table for this topic yet.</p>
        )}
      </section>

      {needsMore ? (
        <div className={styles.pageMore}>
          <button
            type="button"
            className={styles.allTensesButton}
            aria-expanded={showMore}
            onClick={() => setShowMore((shown) => !shown)}
          >
            {showMore ? 'Show less' : 'Show more'}
            <span className={styles.allTensesCaret} aria-hidden="true">
              <svg viewBox="0 0 12 8">
                <path d="M1.5 1.5 6 6l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      ) : null}

      {isTenses || (needsMore && !showMore) ? null : (
        <>
          <h2 className={styles.listHead}>What is in it</h2>
          <Outline groups={groups} lessons={mine} />
        </>
      )}
    </>
  );
}

const typeLabel = (title: string): string => title.replace(/\s+tense$/i, '');

/** Keep the question and its explanation as two readable thoughts. */
export function splitExplanation(value: string): { readonly question: string; readonly answer: string } {
  const end = value.indexOf('?');
  return end < 0
    ? { question: '', answer: value.trim() }
    : { question: value.slice(0, end + 1).trim(), answer: value.slice(end + 1).trim() };
}

/**
 * Tenses are easiest to compare when the rule and its example stay together.
 * The source keeps English and Tamil examples in separate columns; on this
 * page they are one bilingual example, reducing the table from four columns
 * to three. Section rows are retained so present, past and future remain
 * separate four-row tables.
 */
export function compactTenseTable(table: SourceTableData): SourceTableData {
  return {
    ...table,
    columns: ['Tense', 'Structure', 'Example'],
    rows: table.rows.map((row) => {
      const heading = row[0]?.trim() !== '' && row.slice(1).every((cell) => cell.trim() === '');
      if (heading) return [row[0] ?? '', '', ''];

      const example = [row[2], row[3]].filter((cell) => cell?.trim()).join('\n');
      return [row[0] ?? '', row[1] ?? '', example];
    }),
  };
}

const BEGINNER_TENSES = [
  {
    row: 'Simple past',
    when: 'Yesterday / before\nநேற்று / முன்பு',
    tense: 'Past\nகடந்த காலம்',
  },
  {
    row: 'Simple present',
    when: 'Today / usually\nஇன்று / வழக்கமாக',
    tense: 'Present\nநிகழ்காலம்',
  },
  {
    row: 'Simple future',
    when: 'Tomorrow / later\nநாளை / பின்னர்',
    tense: 'Future\nஎதிர்காலம்',
  },
] as const;

/** A noun-page-shaped first view: three familiar times, not twelve labels. */
export function beginnerTenseTable(table: SourceTableData): SourceTableData {
  return {
    ...table,
    id: `${table.id}-start`,
    title: {
      en: 'Past, present and future',
      ta: 'கடந்த, நிகழ், எதிர் காலங்கள்',
    } as SourceTableData['title'],
    columns: ['Tense', 'When?', 'Example'],
    rows: BEGINNER_TENSES.flatMap((item) => {
      const row = table.rows.find((candidate) => candidate[0] === item.row);
      return row ? [[item.tense, item.when, row[2] ?? '']] : [];
    }),
  };
}

function BeginnerTenseGuide({ tables }: { readonly tables: readonly SourceTableData[] }): JSX.Element {
  const [showMore, setShowMore] = useState(false);
  const table = tables[0];
  const starter = table ? beginnerTenseTable(table) : null;
  const kinds = table ? actionKindTable(table) : null;

  return (
    <>
      {starter ? <SourceTable table={starter} heading={false} /> : null}

      <div className={styles.allTensesControl}>
        <button
          type="button"
          className={styles.allTensesButton}
          aria-expanded={showMore}
          onClick={() => setShowMore((shown) => !shown)}
        >
          {showMore ? 'Show less' : 'Show more'}
          <span className={styles.allTensesCaret} aria-hidden="true">
            <svg viewBox="0 0 12 8">
              <path d="M1.5 1.5 6 6l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>

      {showMore && kinds ? (
        <div className={styles.allTenses}>
          <SourceTable table={kinds} />
          <p className={styles.perfectNote}>
            <strong>Perfect</strong> does not mean “without mistakes.” It means the action is already
            complete before the time we are talking about.
            <span lang="ta">
              Perfect என்பது “தவறில்லாதது” அல்ல; பேசும் நேரத்திற்கு முன் செயல் நிறைவடைந்தது.
            </span>
          </p>
          <div className={styles.allTensesHead}>
            <h2>Time + action type</h2>
            <p>The three times and four action types combine to make the twelve tense forms.</p>
          </div>
          {tables.map((item) => <SourceTable key={item.id} table={item} heading={false} />)}
        </div>
      ) : null}
    </>
  );
}

const ACTION_KINDS = [
  {
    row: 'Simple present',
    name: 'Simple\nசாதாரணம்',
    meaning: 'A fact, habit or one whole action\nஉண்மை, வழக்கம் அல்லது ஒரு முழுச் செயல்',
  },
  {
    row: 'Present continuous',
    name: 'Continuous\nதொடர்நிலை',
    meaning: 'In progress at the time we mention\nநாம் குறிப்பிடும் நேரத்தில் நடந்துகொண்டிருக்கும் செயல்',
  },
  {
    row: 'Present perfect',
    name: 'Perfect\nநிறைவுநிலை',
    meaning: 'Completed before the time we mention\nநாம் குறிப்பிடும் நேரத்திற்கு முன் முடிந்த செயல்',
  },
  {
    row: 'Present perfect continuous',
    name: 'Perfect continuous\nநிறைவுத் தொடர்நிலை',
    meaning: 'Continued for a period up to that time\nஅந்த நேரம் வரை ஒரு கால அளவுக்குத் தொடர்ந்த செயல்',
  },
] as const;

/** Explain aspect by meaning before combining it with the three times. */
export function actionKindTable(table: SourceTableData): SourceTableData {
  return {
    ...table,
    id: `${table.id}-action-kinds`,
    title: {
      en: 'How is the action happening?',
      ta: 'செயல் எந்த நிலையில் நடக்கிறது?',
    } as SourceTableData['title'],
    columns: ['Action type', 'Easy meaning', 'Example'],
    rows: ACTION_KINDS.flatMap((item) => {
      const row = table.rows.find((candidate) => candidate[0] === item.row);
      return row ? [[item.name, item.meaning, row[2] ?? '']] : [];
    }),
  };
}

/**
 * The topic's own shape.
 *
 * Prepositions has four groups and most topics have one. A single group is not
 * a choice, so it renders as a plain list rather than as one tab nobody can
 * move away from.
 */
function Outline({
  groups,
  lessons,
}: {
  readonly groups: readonly OutlineGroup[];
  readonly lessons: readonly Lesson[];
}): JSX.Element {
  if (groups.length === 0) {
    return (
      <p className={styles.none}>
        The notes have no outline for this topic.
        <span className={styles.ta} lang="ta">
          {' '}
          இந்தத் தலைப்புக்கு வரிசை இல்லை.
        </span>
      </p>
    );
  }

  if (groups.length === 1) {
    const only = groups[0];
    return <Rows group={only as OutlineGroup} lessons={lessons} />;
  }

  return (
    <Tabs
      label="Groups"
      items={groups.map((group, index) => ({
        id: String(index),
        label: String(group.title.en),
        panel: <Rows group={group} lessons={lessons} />,
      }))}
    />
  );
}

function Rows({
  group,
  lessons,
}: {
  readonly group: OutlineGroup;
  readonly lessons: readonly Lesson[];
}): JSX.Element {
  return (
    <ul className={styles.rows}>
      {group.lessons.map((outline, index) => (
        <LessonRow
          key={`${String(outline.title)}-${index}`}
          n={index + 1}
          outline={outline}
          lesson={authoredFor(lessons, group, String(outline.title))}
        />
      ))}
    </ul>
  );
}

/**
 * The authored lesson a line of the outline corresponds to, if any.
 *
 * Matched on the title, within the topic. `in` appears in both the Place group
 * and the Time group of prepositions and only one of them is drawn, so where a
 * title is ambiguous the lesson's own id has to name the group — which is a
 * convention rather than a field, and the reason this returns nothing at all
 * rather than guessing when it cannot tell.
 */
export function authoredFor(
  lessons: readonly Lesson[],
  group: OutlineGroup,
  title: string,
): Lesson | undefined {
  const named = lessons.filter(
    (lesson) => String(lesson.title.en).toLowerCase() === title.toLowerCase(),
  );
  if (named.length === 0) return undefined;
  if (named.length === 1) return named[0];

  const slug = String(group.title.en).toLowerCase().replace(/\s+/g, '-');
  return named.find((lesson) => String(lesson.id).includes(slug));
}
