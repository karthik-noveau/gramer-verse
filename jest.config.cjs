/* Jest reads CommonJS, so this file stays .cjs while the package is a module.
   `moduleDirectories` is what makes `import App from 'App'` resolve here the
   same way `baseUrl: "src"` makes it resolve in TypeScript and the alias makes
   it resolve in Vite. */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  roots: ['<rootDir>/src'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  /* Order matters — the CSS Module rule has to be read before the plain-CSS
     one, which catches the theme files App.tsx imports for their side effect. */
  moduleNameMapper: {
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.css$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },
};
