import { useRef } from 'react';
import type { JSX, KeyboardEvent } from 'react';

import { Chip } from 'common/components/Chip/Chip';
import type { Knob, Lesson } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';
import type { KnobValues } from 'store/lesson.store';
import { knobAllows } from 'store/lesson.store';

import styles from './styles.module.css';

/* ============================================================
   KnobBar — the controls the learner actually touches.

   One group per knob, one chip per option. A group is a single
   tab stop with the arrow keys moving inside it, because six
   chips that are six tab stops is a control bar nobody reaches
   the end of.
   ============================================================ */

export type KnobBarProps = {
  readonly lesson: Lesson;
  readonly knobs: KnobValues;
  readonly onChange: (key: string, value: string) => void;
  /** Inert while the predict step is unanswered: visibly there, so the learner
   *  can see what is coming, and not yet usable. */
  readonly locked?: boolean;
  readonly className?: string | undefined;
};

const MOVE: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

export function KnobBar({
  lesson,
  knobs,
  onChange,
  locked = false,
  className,
}: KnobBarProps): JSX.Element | null {
  if (lesson.knobs.length === 0) return null;

  return (
    <div className={classNames(styles.bar, locked && styles.locked, className)}>
      {lesson.knobs.map((knob) => (
        <KnobGroup
          key={knob.key}
          knob={knob}
          lesson={lesson}
          knobs={knobs}
          onChange={onChange}
          locked={locked}
        />
      ))}
    </div>
  );
}

type KnobGroupProps = {
  readonly knob: Knob;
  readonly lesson: Lesson;
  readonly knobs: KnobValues;
  readonly onChange: (key: string, value: string) => void;
  readonly locked: boolean;
};

function KnobGroup({ knob, lesson, knobs, onChange, locked }: KnobGroupProps): JSX.Element {
  const list = useRef<HTMLDivElement | null>(null);
  const current = knobs[knob.key];
  const labelId = `knob-${knob.key}-label`;

  /* Which chip the group's one tab stop lands on: the chosen option, or the
     first one when nothing is chosen yet. */
  const active = Math.max(
    0,
    knob.options.findIndex((option) => option.value === current),
  );

  /**
   * Arrow keys move within the group, and moving selects.
   *
   * Read out of the DOM rather than from the option list, so the order the keys
   * follow is the order the chips are actually in — a long list wraps, and a
   * roving index computed from the array would jump across the wrap.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const step = MOVE[event.key];
    if (step === undefined || locked) return;

    const chips = [...(list.current?.querySelectorAll<HTMLButtonElement>('[data-chip]') ?? [])];
    const here = chips.findIndex((chip) => chip === document.activeElement);
    if (here === -1) return;

    const next = chips[(here + step + chips.length) % chips.length];
    if (!next) return;

    event.preventDefault();
    next.focus();
    const value = next.dataset.value;
    if (value !== undefined) onChange(knob.key, value);
  };

  /* One option is not a choice. Rendered as what it is — a fact about this
     lesson — rather than as a button that does nothing when pressed. */
  const single = knob.options.length === 1;

  return (
    <div
      className={styles.group}
      role={single ? undefined : 'group'}
      aria-labelledby={single ? undefined : labelId}
    >
      <span className={styles.label} id={labelId}>
        <span lang="en">{String(knob.label.en)}</span>
        <span className={styles.labelTa} lang="ta">
          {String(knob.label.ta)}
        </span>
      </span>

      {single ? (
        <span className={styles.only}>
          <span lang="en">{String(knob.options[0]?.label.en)}</span>
          <span className={styles.labelTa} lang="ta">
            {String(knob.options[0]?.label.ta)}
          </span>
        </span>
      ) : (
        <div className={styles.options} ref={list} onKeyDown={onKeyDown}>
          {knob.options.map((option, index) => {
            const pressed = option.value === current;
            /* An option that would draw nothing is disabled rather than
               refused after the fact: the learner is told before pressing it,
               not by a picture that fails to change. */
            const impossible = !pressed && !knobAllows(lesson, knobs, knob.key, option.value);

            return (
              <Chip
                key={option.value}
                label={String(option.label.en)}
                ta={String(option.label.ta)}
                pressed={pressed}
                disabled={impossible}
                aria-disabled={locked || undefined}
                /* One tab stop for the group: only the chosen chip is in the
                   tab order, and the arrows reach the rest. */
                tabIndex={index === active ? 0 : -1}
                data-chip=""
                data-value={option.value}
                onClick={() => {
                  if (!locked) onChange(knob.key, option.value);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
