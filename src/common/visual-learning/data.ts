export const LESSONS = [
  { id: 'space', title: 'Move & understand', topic: 'Prepositions', description: 'A little move. A different meaning.' },
  { id: 'time', title: 'Travel through time', topic: 'Tenses', description: 'One action, three moments.' },
  { id: 'meaning', title: 'Spot the difference', topic: 'Meaning', description: 'Similar words. Different stories.' },
] as const;

export type LessonId = (typeof LESSONS)[number]['id'];
export type Point = { x: number; y: number };
export const POSITIONS = [
  { id: 'in', x: 160, y: 273, ending: 'the box.', ta: 'பந்து பெட்டிக்குள் இருக்கிறது.', hint: 'Inside a space. The box surrounds the ball.', short: 'Inside the box' },
  { id: 'on', x: 390, y: 199, ending: 'the table.', ta: 'பந்து மேசையின் மேல் இருக்கிறது.', hint: 'Touching the top. The table supports the ball.', short: 'Touching the top' },
  { id: 'under', x: 390, y: 313, ending: 'the table.', ta: 'பந்து மேசைக்குக் கீழே இருக்கிறது.', hint: 'Lower than something. The table is above the ball.', short: 'Below the table' },
  { id: 'behind', x: 535, y: 309, ending: 'the box.', ta: 'பந்து பெட்டிக்குப் பின்னால் இருக்கிறது.', hint: 'At the back. The box hides most of the ball; a small edge peeks out.', short: 'At the back of the box' },
  { id: 'between', x: 251, y: 314, ending: 'the box and the table.', ta: 'பந்து பெட்டிக்கும் மேசைக்கும் இடையில் இருக்கிறது.', hint: 'In the gap separating two things: the box and the table.', short: 'In the gap between two things' },
] as const;
export type Position = (typeof POSITIONS)[number];

export function nearestPosition(point: Point): Position {
  return POSITIONS.reduce((closest, next) => Math.hypot(next.x - point.x, next.y - point.y) < Math.hypot(closest.x - point.x, closest.y - point.y) ? next : closest);
}

export const MOMENTS = [
  { id: 'past', label: 'Yesterday', verb: 'cooked', ta: 'அவள் நேற்று சமைத்தாள்.', sentence: 'She cooked yesterday.', name: 'Past simple', meaning: 'The cooking happened before now.', scene: 'The meal is ready. The cooking is finished.', cue: 'Finished', position: .16 },
  { id: 'present', label: 'Now', verb: 'is cooking', ta: 'அவள் இப்போது சமைத்துக்கொண்டிருக்கிறாள்.', sentence: 'She is cooking now.', name: 'Present continuous', meaning: 'The cooking is happening right now.', scene: 'Watch the spoon move and the steam rise.', cue: 'Happening', position: .5 },
  { id: 'future', label: 'Tomorrow', verb: 'will cook', ta: 'அவள் நாளை சமைப்பாள்.', sentence: 'She will cook tomorrow.', name: 'Future with will', meaning: 'The cooking will happen after now.', scene: 'The ingredients are ready. Cooking has not started.', cue: 'Not started', position: .84 },
] as const;

export const COMPARISONS = [
  { id: 'stop', label: 'Stopped / stopped to', question: 'Which scene shows someone stopping for a conversation?', answer: 1,
    left: { start: 'He ', focus: 'stopped walking', end: '.', ta: 'அவன் நடப்பதை நிறுத்தினான்.', meaning: 'The walking ends.', caption: 'He walks, then stands still.' },
    right: { start: 'He ', focus: 'stopped to talk', end: '.', ta: 'அவன் பேசுவதற்காக நின்றான்.', meaning: 'Talking is the reason he stops.', caption: 'He pauses his walk to talk to a friend.' },
    takeaway: '“Stopped + -ing” tells you what ended. “Stopped to + verb” tells you why someone stopped.' },
  { id: 'read', label: 'Is reading / has read', question: 'Which scene shows reading still in progress?', answer: 0,
    left: { start: 'She ', focus: 'is reading', end: ' the book.', ta: 'அவள் புத்தகத்தைப் படித்துக்கொண்டிருக்கிறாள்.', meaning: 'Reading is in progress.', caption: 'Her book is open. She is still reading.' },
    right: { start: 'She ', focus: 'has read', end: ' the book.', ta: 'அவள் புத்தகத்தைப் படித்து முடித்துவிட்டாள்.', meaning: 'Reading is complete now.', caption: 'She finishes the last page and closes the book.' },
    takeaway: '“Is reading” shows an action in progress. “Has read” shows that the action is complete now.' },
  { id: 'jump', label: 'Going to jump / jumping', question: 'Which scene shows the jump already happening?', answer: 1,
    left: { start: 'He ', focus: 'is going to jump', end: '.', ta: 'அவன் குதிக்கப் போகிறான்.', meaning: 'The jump has not started.', caption: 'He prepares to jump. His feet stay on the ground.' },
    right: { start: 'He ', focus: 'is jumping', end: '.', ta: 'அவன் குதித்துக்கொண்டிருக்கிறான்.', meaning: 'The jump is happening.', caption: 'His feet leave the ground as he jumps.' },
    takeaway: '“Going to jump” looks ahead to an intended action. “Is jumping” shows the action happening now.' },
] as const;
