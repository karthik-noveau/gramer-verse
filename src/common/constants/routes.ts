import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

/* Every path in the product, once. Nothing else may write a path string: a
   route renamed in one file and not another is a link that 404s, and the 404
   is the only place it shows up. */

export type RouteId =
  | 'landing'
  | 'topics'
  | 'topic'
  | 'lesson'
  | 'visualizer'
  | 'visualLab'
  | 'practice'
  | 'practiceScenario'
  | 'notFound';

export type RouteEntry = {
  readonly id: RouteId;
  readonly path: string;
  readonly component: LazyExoticComponent<ComponentType>;
  /** Rendered without the app shell — no sidebar, no topic nav, no
   *  breadcrumbs. The front door carries its own chrome, and it is the only
   *  page that does, so it says so here rather than in the router. */
  readonly outsideShell?: boolean;
};

/* One dynamic import per page, so each becomes its own chunk. The specifiers
   have to be literal for the bundler to see them — a computed path would ship
   the whole app in one file. */
export const ROUTES: readonly RouteEntry[] = Object.freeze([
  { id: 'landing', path: '/', component: lazy(() => import('pages/landing')), outsideShell: true },
  { id: 'topics', path: '/topics', component: lazy(() => import('pages/topics')) },
  { id: 'visualLab', path: '/visual-lab', component: lazy(() => import('pages/visual-lab')) },
  { id: 'practice', path: '/practice', component: lazy(() => import('pages/practice')) },
  { id: 'practiceScenario', path: '/practice/:scenarioId', component: lazy(() => import('pages/practice')) },
  /* Before `/topics/:topicId`, or "prepositions" would be read as a topic id
     and the visualizer would never be reached. */
  {
    id: 'visualizer',
    path: '/topics/prepositions/visualizer',
    component: lazy(() => import('pages/visualizer')),
  },
  { id: 'topic', path: '/topics/:topicId', component: lazy(() => import('pages/topic')) },
  { id: 'lesson', path: '/lessons/:lessonId', component: lazy(() => import('pages/lesson')) },
  { id: 'notFound', path: '*', component: lazy(() => import('pages/not-found')) },
]);

/* The old dashboard was folded into /topics. Practice now has its own
   scenario catalogue. /visual-lab redirects into the preposition visualizer. */
export const REDIRECTS: readonly { readonly from: string; readonly to: string }[] = Object.freeze([
  { from: '/dashboard', to: '/topics' },
]);

const pathOf = (id: RouteId): string => {
  const entry = ROUTES.find((route) => route.id === id);
  if (!entry) throw new Error(`No route with id "${id}"`);
  return entry.path;
};

export const paths = {
  landing: (): string => pathOf('landing'),
  topics: (): string => pathOf('topics'),
  practice: (): string => pathOf('practice'),
  practiceScenario: (scenarioId: string): string => `/practice/${encodeURIComponent(scenarioId)}`,
  topic: (topicId: string): string => `/topics/${topicId}`,
  lesson: (lessonId: string): string => `/lessons/${lessonId}`,
  visualizer: (): string => pathOf('visualizer'),
  visualLab: (): string => pathOf('visualLab'),
} as const;
