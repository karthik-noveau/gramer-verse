/* Every key this app writes, in one place, namespaced so it cannot collide
   with anything else served from the same origin.

   Display preferences only. There is no progress record: constraint 5 says the
   app stores nothing about the learner beyond how they like it to look, and a
   key here is the only way anything gets stored at all. */
export const STORAGE_KEYS = {
  theme: 'gv.theme',
  sidebarCollapsed: 'gv.sidebar.collapsed',
  reduceMotion: 'gv.motion.reduce',
  skipPredict: 'gv.predict.skip',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
