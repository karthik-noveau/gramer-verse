/* Joining class names is the one thing every component in this folder does, and
   fifteen private copies of `[a, b].filter(Boolean).join(' ')` is fifteen places
   to get it subtly wrong. Falsy entries drop out so a conditional class can be
   written inline. */
export const classNames = (...parts: ReadonlyArray<string | false | null | undefined>): string =>
  parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
