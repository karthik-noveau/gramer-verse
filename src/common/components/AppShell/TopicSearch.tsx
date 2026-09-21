import { useEffect, useMemo, useState } from 'react';
import type { FocusEvent, JSX, KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router';

import { Icon } from 'common/components/Icon/Icon';
import { paths } from 'common/constants/routes';

import type { SidebarTopic } from './Sidebar';
import styles from './styles.module.css';

type SearchMatch = {
  readonly key: string;
  readonly href: string;
  readonly en: string;
  readonly context?: string;
};

const clean = (value: string): string => value.replace(/\s*\n\s*/g, ' · ').trim();

export function TopicSearch({ topics }: { readonly topics: readonly SidebarTopic[] }): JSX.Element {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setQuery('');
    setFocused(false);
  }, [pathname]);

  const matches = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];

    return topics.flatMap<SearchMatch>((topic) => {
      const found: SearchMatch[] = [];
      if (topic.en.toLocaleLowerCase().includes(term) || topic.ta.includes(term)) {
        found.push({
          key: `topic-${topic.id}`,
          href: paths.topic(topic.id),
          en: topic.en,
        });
      }

      for (const table of topic.tables ?? []) {
        const titleMatches = table.en.toLocaleLowerCase().includes(term) || table.ta.includes(term);
        const matchingContent = table.terms.find((value) =>
          value.toLocaleLowerCase().includes(term),
        );
        if (!titleMatches && matchingContent === undefined) continue;

        found.push({
          key: `table-${topic.id}-${table.id}`,
          href: `${paths.topic(topic.id)}#${table.id}`,
          en: table.en,
          context: matchingContent === undefined ? topic.en : `${topic.en} · ${clean(matchingContent)}`,
        });
      }

      return found;
    }).slice(0, 8);
  }, [query, topics]);

  const open = focused && query.trim().length > 0;
  const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Escape') return;
    setQuery('');
    event.currentTarget.blur();
  };

  return (
    <div className={styles.topicSearch} role="search" onFocus={() => setFocused(true)} onBlur={onBlur}>
      <div className={styles.searchControl}>
        <Icon name="search" size="sm" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder="Search grammar"
          aria-label="Search topics and tables"
          aria-expanded={open}
          aria-controls="topic-search-results"
        />
      </div>

      {open ? (
        <div className={styles.searchResults} id="topic-search-results">
          {matches.length > 0 ? (
            matches.map((match) => (
              <Link key={match.key} className={styles.searchResult} to={match.href}>
                <span className={styles.searchResultBody}>
                  <span>{match.en}</span>
                  {match.context ? <small>{match.context}</small> : null}
                </span>
              </Link>
            ))
          ) : (
            <p className={styles.noSearchResults}>No matching content</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
