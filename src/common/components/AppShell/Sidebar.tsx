import type { JSX } from 'react';
import { Link, useLocation } from 'react-router';

import { paths } from 'common/constants/routes';

import styles from './styles.module.css';

export type SidebarTopic = {
  readonly id: string;
  readonly n: number;
  readonly en: string;
};

export type SidebarProps = {
  readonly topics: readonly SidebarTopic[];
  /* `| undefined` explicitly: exactOptionalPropertyTypes distinguishes an
     absent prop from one passed as undefined, and the shell passes it through
     whether or not a topic is open. */
  readonly activeTopicId?: string | undefined;
  readonly collapsed: boolean;
};

/* English only. The sidebar is chrome, and translating a topic name the
   learner is about to meet in English teaches nothing — the Tamil belongs on
   the topic itself, where it is part of the lesson. */
export function Sidebar({ topics, activeTopicId, collapsed }: SidebarProps): JSX.Element {
  const { pathname } = useLocation();

  /* Collapsed hides the label visually but keeps it in the accessibility tree,
     so every link still has its name. */
  const labelClass = collapsed ? 'sr-only' : undefined;

  /* A lesson marks the topic it belongs to, which no URL match can work out —
     so the page says which topic is open, and the path is the fallback. */
  const isActive = (topicId: string): boolean =>
    activeTopicId !== undefined ? activeTopicId === topicId : pathname === paths.topic(topicId);

  return (
    <aside className={styles.sidebar} id="sidebar" aria-label="Topics">
      {topics.length > 0 ? (
        <>
          <h4>Topics</h4>
          <ul>
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  to={paths.topic(topic.id)}
                  aria-current={isActive(topic.id) ? 'page' : undefined}
                >
                  <span className={styles.num} aria-hidden="true">
                    {topic.n}
                  </span>
                  <span className={labelClass}>{topic.en}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

    </aside>
  );
}
