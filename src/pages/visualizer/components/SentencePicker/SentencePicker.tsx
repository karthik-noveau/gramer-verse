import { useEffect, useId, useRef, useState } from 'react';
import type { JSX, KeyboardEvent, ReactNode } from 'react';

import { Icon } from 'common/components/Icon/Icon';

import styles from './styles.module.css';

export type SentencePickerProps = {
  readonly value: string;
  readonly examples: readonly string[];
  readonly onChange: (value: string) => void;
  readonly onDraw: (value: string) => void;
  readonly preview?: ReactNode;
};

export function SentencePicker({ value, examples, onChange, onDraw, preview }: SentencePickerProps): JSX.Element {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Node && !wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const select = (example: string): void => {
    onChange(example);
    onDraw(example);
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.nativeEvent.isComposing) return;
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && examples.length > 0) {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActive(!open || active < 0
        ? (direction === 1 ? 0 : examples.length - 1)
        : (active + direction + examples.length) % examples.length);
      setOpen(true);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    } else if (event.key === 'Enter' && open && active >= 0) {
      const example = examples[active];
      if (example !== undefined) {
        event.preventDefault();
        select(example);
      }
    }
  };

  return (
    <div className={styles.form}>
      <div className={styles.picker} ref={wrapRef} onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}>
        <div className={styles.field} data-preview={Boolean(preview)}>
          <label className="sr-only" htmlFor={`${id}-input`}>Sentence to draw</label>
          <input
            ref={inputRef}
            id={`${id}-input`}
            className={styles.input}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-examples`}
            aria-haspopup="listbox"
            aria-autocomplete="none"
            aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
            type="text"
            value={value}
            readOnly
            placeholder="Choose an example sentence"
            autoComplete="off"
            onKeyDown={onKeyDown}
          />
          {preview && <div className={styles.preview}>{preview}</div>}
          <button
            className={styles.toggle}
            type="button"
            aria-label="Choose an example sentence"
            aria-expanded={open}
            aria-controls={`${id}-examples`}
            aria-haspopup="listbox"
            onClick={() => {
              setOpen(!open);
              setActive(-1);
              inputRef.current?.focus();
            }}
          >
            <span>Change</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {open && (
          <ul className={styles.options} id={`${id}-examples`} role="listbox" aria-label="Example sentences">
            {examples.map((example, index) => (
              <li
                key={example}
                id={`${id}-option-${index}`}
                className={styles.option}
                role="option"
                aria-selected={value === example}
                data-active={active === index || undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(example)}
              >
                <span>{example}</span>
                {value === example && <Icon name="check" size="sm" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
