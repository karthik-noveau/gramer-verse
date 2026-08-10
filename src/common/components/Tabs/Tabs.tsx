import { useId, useRef, useState } from 'react';
import type { JSX, KeyboardEvent, ReactNode } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type TabItem = {
  readonly id: string;
  readonly label: ReactNode;
  readonly panel: ReactNode;
};

export type TabsProps = {
  readonly items: readonly TabItem[];
  readonly label: string;
  readonly initialId?: string;
  readonly className?: string;
};

const nextIndex = (key: string, index: number, count: number): number | null => {
  switch (key) {
    case 'ArrowRight':
      return (index + 1) % count;
    case 'ArrowLeft':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
};

/**
 * Roving tabindex: only the selected tab is in the Tab order, and the arrow
 * keys move between them. Tabbing into a tablist and then having to Tab through
 * every tab to reach the panel is the failure this avoids.
 */
export function Tabs({ items, label, initialId, className }: TabsProps): JSX.Element {
  const base = useId();
  const first = items[0];
  const [selected, setSelected] = useState<string>(initialId ?? first?.id ?? '');
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const index = items.findIndex((item) => item.id === selected);
    const target = nextIndex(event.key, index, items.length);
    if (target === null) return;

    const item = items[target];
    if (!item) return;

    event.preventDefault();
    setSelected(item.id);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[target]?.focus();
  };

  return (
    <div className={className}>
      <div className={styles.tablist} role="tablist" aria-label={label} ref={listRef} onKeyDown={onKeyDown}>
        {items.map((item) => {
          const isSelected = item.id === selected;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              className={styles.tab}
              aria-selected={isSelected}
              aria-controls={`${base}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-panel-${item.id}`}
          aria-labelledby={`${base}-tab-${item.id}`}
          className={classNames(styles.panel)}
          hidden={item.id !== selected}
          tabIndex={0}
        >
          {item.panel}
        </div>
      ))}
    </div>
  );
}
