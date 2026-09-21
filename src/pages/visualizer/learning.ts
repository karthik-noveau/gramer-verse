import { placeAllows } from 'common/scene/renderers/place.renderer';
import type { PlaceRelation, PropId, SceneSpec } from 'common/scene/types';
import { selectScene } from 'store/visualizer.store';
import type { VisualizerState } from 'store/visualizer.store';

export const GROUPS = [
  { id: 'prep-place', slug: 'place', en: 'Place', ta: 'இடம்', question: 'Where is it?', icon: 'space' },
  { id: 'prep-dir', slug: 'direction', en: 'Direction', ta: 'திசை', question: 'Where is it going?', icon: 'arrow' },
  { id: 'prep-time', slug: 'time', en: 'Time', ta: 'காலம்', question: 'When does it happen?', icon: 'time' },
  { id: 'prep-other', slug: 'roles', en: 'Other roles', ta: 'மற்றவை', question: 'How are they connected?', icon: 'meaning' },
] as const;

export const INSIGHTS: Record<string, Record<string, string>> = {
  'prep-place': {
    in: 'Look for a boundary around the object. “In” puts it inside that space.',
    on: 'The object touches a surface that supports it. Being higher is not enough.',
    at: 'Think of a location as a point: at the shop, at the door, at the station.',
    under: 'Look directly beneath the reference object. The object above may cover it.',
    above: 'Higher than the reference object, with no need to touch it.',
    below: 'At a lower level. It does not have to be directly underneath.',
    behind: 'The object is closer to you, so it covers what is behind it.',
    'in front of': 'Closer to the viewer than the reference object in this scene.',
    between: 'Notice the two reference objects. The subject occupies the gap separating them.',
    near: 'A short distance away. “Near” does not require being immediately next to it.',
    beside: 'At the side of something. “Beside” is more specific than “near”.',
    here: 'Close to the speaker. “Here” is a place adverb, included to compare distance.',
    there: 'Away from the speaker. “There” is a place adverb, included to compare distance.',
  },
  'prep-dir': {
    to: 'The destination is the endpoint of this journey.', into: 'Watch the boundary: the movement begins outside and ends inside.',
    towards: 'The movement points in that direction. The word does not promise arrival.',
    along: 'The route follows the length of something, such as a river or road.',
    across: 'The route crosses from one side to the other.', over: 'The route passes above the landmark.',
    past: 'The mover passes the landmark and continues beyond it.', from: 'The landmark is the starting point, not the destination.',
  },
  'prep-time': {
    in: 'A larger time container: in a year, in a month, in the morning.',
    on: 'A particular day or date: on Monday, on 21 September.',
    at: 'A precise point on the clock: at 5 PM. Compare the scale with “on” and “in”.',
    before: 'The event happens earlier than the reference time. The boundary itself is excluded.',
    after: 'The event happens later than the reference event.',
    by: 'A deadline for completion. Finishing earlier is allowed; finishing later is too late.',
    since: 'A starting point connected to now. “Have lived” + “since 2010” describes a situation continuing now.',
    during: 'Something happens within another event. It does not have to last for the whole event.',
    until: 'An action or state continues up to the endpoint. Compare that duration with a “by” deadline.',
  },
  'prep-other': {
    about: 'Names the topic: what the conversation or story concerns.', for: 'Names the intended receiver or purpose.',
    with: 'Connects companions, things together, or an action and its tool.', as: 'Names an actual role or function.',
    like: 'Shows a resemblance. Being like someone does not mean having their role.', per: 'Means “for each”: one amount for every unit.',
  },
};

export type Contrast = { words: readonly [string, string]; title: string; takeaway: string; ta: string };
export const CONTRASTS: Record<string, readonly Contrast[]> = {
  'prep-place': [
    { words: ['on', 'above'], title: 'Contact changes the meaning.', takeaway: 'On means touching a supporting surface. Above means higher than it, without requiring contact.', ta: '“On” என்பது மேற்பரப்பைத் தொடுவது. “Above” என்பது அதைவிட உயரத்தில் இருப்பது.' },
    { words: ['under', 'below'], title: 'Directly underneath, or simply lower?', takeaway: 'Under often means directly beneath. Below compares levels, even when the objects are not vertically aligned.', ta: '“Under” நேராகக் கீழே இருப்பதைக் குறிக்கும். “Below” தாழ்ந்த நிலையில் இருப்பதைக் குறிக்கும்.' },
    { words: ['near', 'beside'], title: 'Distance or position?', takeaway: 'Near says the distance is short. Beside tells you the object is at the side.', ta: '“Near” அருகில். “Beside” பக்கத்தில்.' },
  ],
  'prep-dir': [
    { words: ['to', 'towards'], title: 'A destination or a direction?', takeaway: 'To names the destination. Towards describes the direction of travel without saying that the mover arrives.', ta: '“To” செல்லும் இடத்தைக் குறிக்கும். “Towards” செல்லும் திசையைக் குறிக்கும்.' },
    { words: ['into', 'to'], title: 'Does the movement cross a boundary?', takeaway: 'Into means moving inside. To names a destination without necessarily entering it.', ta: '“Into” உள்ளே செல்வது. “To” ஒரு இடத்திற்குச் செல்வது.' },
    { words: ['along', 'across'], title: 'Follow the length or cross the width?', takeaway: 'Along follows a route. Across moves from one side to the other.', ta: '“Along” பாதையின் வழியே. “Across” ஒரு பக்கத்திலிருந்து மறுபக்கத்திற்கு.' },
  ],
  'prep-time': [
    { words: ['by', 'until'], title: 'A deadline is different from a duration.', takeaway: 'Finish the work by 6 PM: completion can happen earlier. Work until 6 PM: the activity continues up to 6 PM.', ta: '“By 6 PM” — ஆறு மணிக்குள் முடிக்க வேண்டும். “Until 6 PM” — ஆறு மணி வரை செயல் தொடரும்.' },
    { words: ['in', 'on'], title: 'Zoom from a period to a day.', takeaway: 'Use in for a year or month, and on for a day or date: in June, on Monday.', ta: 'ஆண்டு அல்லது மாதத்திற்கு “in”. நாள் அல்லது தேதிக்கு “on”.' },
    { words: ['on', 'at'], title: 'Zoom from a day to a moment.', takeaway: 'On Monday locates an event on a day. At 5 PM locates it at an exact clock time.', ta: '“On Monday” திங்கட்கிழமை. “At 5 PM” மாலை ஐந்து மணிக்கு.' },
    { words: ['since', 'during'], title: 'A starting point or an enclosing event?', takeaway: 'Since connects a starting point to now. During places an action within the duration of another event.', ta: '“Since” தொடங்கிய நேரத்திலிருந்து இப்போது வரை. “During” ஒரு நிகழ்வின் போது.' },
  ],
  'prep-other': [
    { words: ['as', 'like'], title: 'A real role or a resemblance?', takeaway: 'As names a role someone actually has. Like makes a comparison: she works as a teacher; she explains things like a teacher.', ta: '“As” உண்மையான பங்கு. “Like” ஒப்புமை.' },
    { words: ['for', 'with'], title: 'A receiver or a companion?', takeaway: 'For names who benefits or receives something. With names who or what accompanies someone.', ta: '“For” யாருக்காக. “With” யாருடன்.' },
  ],
};

export type Challenge = { prompt: string; options: readonly string[]; answer: string; explanation: string };
export const CHALLENGES: Record<string, readonly Challenge[]> = {
  'prep-place': [
    { prompt: 'The cup touches the table, which supports it. The cup is ___ the table.', options: ['above', 'on', 'under'], answer: 'on', explanation: 'Contact and support make “on” the right choice.' },
    { prompt: 'The ball is in the gap separating a box and a chair. It is ___ them.', options: ['between', 'behind', 'in'], answer: 'between', explanation: '“Between” relates the ball to two reference objects.' },
    { prompt: 'A lamp hangs higher than a table without touching it. It is ___ the table.', options: ['on', 'below', 'above'], answer: 'above', explanation: '“Above” describes a higher position without contact.' },
  ],
  'prep-dir': [
    { prompt: 'The dog crosses the doorway from outside to inside. It runs ___ the room.', options: ['towards', 'into', 'from'], answer: 'into', explanation: 'Crossing into the interior is the key difference.' },
    { prompt: 'She walks in the direction of the station. We do not know whether she arrives. She walks ___ it.', options: ['towards', 'from', 'past'], answer: 'towards', explanation: '“Towards” describes direction without promising arrival.' },
    { prompt: 'He goes from one side of the road to the other. He walks ___ the road.', options: ['along', 'to', 'across'], answer: 'across', explanation: '“Across” crosses the width; “along” follows the length.' },
  ],
  'prep-time': [
    { prompt: '6 PM is the deadline. Finishing at 4 PM is also fine. Finish the work ___ 6 PM.', options: ['until', 'by', 'since'], answer: 'by', explanation: '“By” permits completion at or before the deadline.' },
    { prompt: 'Keep working, then stop at 6 PM. Work ___ 6 PM.', options: ['by', 'during', 'until'], answer: 'until', explanation: '“Until” describes an activity continuing up to its endpoint.' },
    { prompt: 'I started living here in 2010 and still live here. I have lived here ___ 2010.', options: ['during', 'since', 'on'], answer: 'since', explanation: '“Since” connects the starting point to now.' },
  ],
  'prep-other': [
    { prompt: 'Teaching is her actual job. She works ___ a teacher.', options: ['like', 'as', 'about'], answer: 'as', explanation: '“As” names the role she actually has.' },
    { prompt: 'He is not a professional singer, but his voice resembles one. He sings ___ a professional.', options: ['as', 'per', 'like'], answer: 'like', explanation: '“Like” expresses a resemblance.' },
    { prompt: 'The price is ₹20 for each item: ₹20 ___ item.', options: ['with', 'per', 'about'], answer: 'per', explanation: '“Per” means for each unit.' },
  ],
};

/** Build a second picture without changing the learner’s scene or draft. */
export function comparisonScene(state: VisualizerState, group: string, word: string): SceneSpec | null {
  let place = state.place;
  if (group === 'prep-place') {
    const relation = word as PlaceRelation;
    const ground = (['table', 'box', 'chair', 'tree'] as PropId[]).find((item) => placeAllows(relation, item, place.ground2));
    place = { ...place, ground: ground ?? place.ground };
  }
  return selectScene({ ...state, group, word, place });
}
