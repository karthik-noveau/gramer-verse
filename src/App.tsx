import { Suspense, useMemo } from 'react';
import type { JSX } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useMatch } from 'react-router';

import { AppShell } from 'common/components/AppShell/AppShell';
import type { SidebarTopic } from 'common/components/AppShell/Sidebar';
import { ErrorBoundary } from 'common/components/ErrorBoundary/ErrorBoundary';
import { Spinner } from 'common/components/Spinner/Spinner';
import { REDIRECTS, ROUTES } from 'common/constants/routes';
import { useContent } from 'common/hooks/useContent';
import { useThemeAttribute } from 'common/hooks/useThemeAttribute';
import { getLesson, useContentStore } from 'store/content.store';

import styles from './App.module.css';

/* Colours, then fonts, then overrides — overrides.css consumes the tokens the
   first two declare, and the reset must land after them. */
import 'theme/colours.css';
import 'theme/fonts.css';
import 'theme/overrides.css';

/* The sidebar's ten topics, from the store rather than from a list kept beside
   it — a second copy of the curriculum is a second thing to go stale. Ordered
   by `order`, and English only: the sidebar is chrome. */
function useSidebarTopics(): readonly SidebarTopic[] {
  const content = useContent();

  return useMemo(() => {
    if (content.status !== 'ready') return [];
    return [...content.topics]
      .sort((a, b) => a.order - b.order)
      .map((topic) => ({
        id: String(topic.id),
        n: topic.order,
        en: String(topic.title.en),
        ta: String(topic.title.ta),
        tables: content.curriculum.tables
          .filter((table) => String(table.topicId) === String(topic.id))
          .map((table) => ({
            id: table.id,
            en: String(table.title.en),
            ta: String(table.title.ta),
            terms: [...table.columns, ...table.rows.flat()],
          })),
      }));
  }, [content]);
}

/* Which topic the sidebar should mark. A topic page says so in its URL; a
   lesson page does not, so the lesson is looked up and asked which topic it
   belongs to. */
function useActiveTopicId(): string | undefined {
  const topicMatch = useMatch('/topics/:topicId');
  const lessonMatch = useMatch('/lessons/:lessonId');
  const lesson = useContentStore((s) => getLesson(s, lessonMatch?.params.lessonId));

  if (topicMatch?.params.topicId) return topicMatch.params.topicId;
  return lesson ? String(lesson.topicId) : undefined;
}

/* The shell is the layout route: it renders once and the outlet changes under
   it, so the sidebar is not rebuilt on every navigation.

   The boundary sits inside the router rather than around it because it needs
   the pathname to reset on — otherwise one page that throws keeps its error
   state for the rest of the session. */
function Layout(): JSX.Element {
  const { pathname } = useLocation();
  const topics = useSidebarTopics();
  const activeTopicId = useActiveTopicId();

  return (
    <AppShell topics={topics} activeTopicId={activeTopicId}>
      <ErrorBoundary resetKey={pathname}>
        <Suspense fallback={<Spinner label="Loading the page" centered />}>
          <div key={pathname} className={styles.routeView}>
            <Outlet />
          </div>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}

/* The route tree without a router around it, so a test can mount it at any
   path in a MemoryRouter and the app can mount it in a BrowserRouter. */
export function AppRoutes(): JSX.Element {
  /* Above both branches of the tree, because the theme belongs to the document
     and one of the two branches is the page with the toggle on it. */
  useThemeAttribute();

  return (
    <Routes>
      {/* The front door, outside the shell: it has its own brand bar and its
          own footer, and a sidebar of ten topics beside it would be the app
          before the visitor has agreed to open the app. It still needs the
          boundary and the suspense fallback, because it is still a lazy
          chunk that can fail. */}
      {ROUTES.filter((route) => route.outsideShell).map(({ id, path, component: Page }) => (
        <Route
          key={id}
          path={path}
          element={
            <ErrorBoundary resetKey={path}>
              <Suspense fallback={<Spinner label="Loading the page" centered />}>
                <div className={styles.routeView}>
                  <Page />
                </div>
              </Suspense>
            </ErrorBoundary>
          }
        />
      ))}

      <Route element={<Layout />}>
        {ROUTES.filter((route) => !route.outsideShell).map(({ id, path, component: Page }) => (
          <Route key={id} path={path} element={<Page />} />
        ))}
        {REDIRECTS.map(({ from, to }) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}
      </Route>
    </Routes>
  );
}

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
