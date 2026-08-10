import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from 'App';

const container = document.getElementById('root');

/* Never fail silently: a missing mount point is a broken index.html, and an app
   that renders nothing without saying why is the hardest kind of bug to read. */
if (!container) {
  throw new Error('Mount point #root is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
