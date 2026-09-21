import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import VisualLabPage from './index';

function Destination(): React.JSX.Element {
  const location = useLocation();
  return <output>{location.pathname}{location.search}</output>;
}

describe('legacy visual lab bookmarks', () => {
  it.each([
    ['', '?group=place'],
    ['?lesson=space', '?group=place'],
    ['?lesson=time', '?group=time&word=by'],
    ['?lesson=meaning', '?group=roles&mode=compare'],
    ['?lesson=missing', '?group=place'],
  ])('redirects %s into the single preposition visualizer', (search, target) => {
    render(<MemoryRouter initialEntries={[`/visual-lab${search}`]}><Routes>
      <Route path="/visual-lab" element={<VisualLabPage />} />
      <Route path="/topics/prepositions/visualizer" element={<Destination />} />
    </Routes></MemoryRouter>);
    expect(screen.getByRole('status').textContent).toBe(`/topics/prepositions/visualizer${target}`);
  });
});
