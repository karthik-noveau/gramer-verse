import type { JSX } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { paths } from 'common/constants/routes';

/** Old bookmarks enter the same preposition workspace at the relevant lesson. */
export default function VisualLabPage(): JSX.Element {
  const [params] = useSearchParams();
  const lesson = params.get('lesson');
  const search = lesson === 'time' ? '?group=time&word=by'
    : lesson === 'meaning' ? '?group=roles&mode=compare' : '?group=place';
  return <Navigate to={`${paths.visualizer()}${search}`} replace />;
}
