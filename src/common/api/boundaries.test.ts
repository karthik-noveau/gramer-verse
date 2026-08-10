import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/* The rule this whole engine exists for: `common/api` is the only module that
   reads the curriculum or touches Browser Storage. A component that imports
   from `content/` skips validation entirely, and one that calls localStorage
   directly is a crash waiting for a reader with cookies blocked.

   Both are invisible in review once the codebase is large, so they are checked
   here instead. */

const SRC = join(__dirname, '..', '..');

const sourceFiles = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test-d.ts') ? [full] : [];
  });

const files = sourceFiles(SRC).map((file) => ({
  path: relative(SRC, file),
  text: readFileSync(file, 'utf8'),
}));

const isContentApi = (path: string): boolean => path.startsWith('common/api/');

describe('module boundaries', () => {
  it('finds the source files it is meant to be checking', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it('lets nothing outside common/api read the curriculum', () => {
    const offenders = files
      .filter(({ path }) => !isContentApi(path))
      .filter(({ text }) => /from 'content\/|import\('content\//.test(text))
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });

  it('lets nothing outside common/api touch Browser Storage', () => {
    const offenders = files
      .filter(({ path }) => !isContentApi(path) && !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'))
      .filter(({ text }) => /localStorage|sessionStorage/.test(text))
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });

  it('keeps the scene engine free of React, the store and the API', () => {
    const offenders = files
      .filter(({ path }) => path.startsWith('common/scene/'))
      .filter(({ text }) => /from 'react'|from 'store\/|from 'common\/api\//.test(text))
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });

  it('lets no page import from another page', () => {
    const offenders = files
      .filter(({ path }) => path.startsWith('pages/'))
      .flatMap(({ path, text }) => {
        const own = path.split('/')[1];
        const imports = [...text.matchAll(/from 'pages\/([a-z-]+)/g)].map((m) => m[1]);
        return imports.filter((other) => other !== own).map((other) => `${path} → pages/${other}`);
      });

    expect(offenders).toEqual([]);
  });
});
