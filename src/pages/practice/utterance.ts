/** Clause-level interpretation. Questions and reported/old events are never
 * used as evidence of a new request. Every rule remains local and inspectable. */
export const QUESTION = /\b(?:what|when|where|why|how|which|do you|does|is (?:it|that|there|breakfast)|are (?:there|you)|can you tell|could you tell)\b/;
export const ACTION = /\b(?:i (?:am|would like|want|need|will|can|have|ordered)|(?:can|could|may) (?:i|we) (?:please )?(?:have|get|buy|order|book|reserve|move|reschedule|add|extend|meet|do|make it|change|stay)|(?:can|could|would) you (?:also |please )?(?:send|confirm|update|show|check|look up|help me|deliver|change|reschedule|move|book|reserve|add|extend)|please (?:send|confirm|book|order)|would \d.*work|would it be possible|is there an alternative)\b/;
export const NEGATED_DETAIL = /\b(?:cannot|not|unavailable|busy)\b/;
export const CORRECTION = /\b(?:actually|make (?:it|that)|i meant|instead|change (?:it|that|to)|keep it at|sorry)\b/;

export type Utterance = {
  readonly parts: readonly string[];
  readonly requests: readonly string[];
  readonly questions: readonly string[];
  readonly facts: readonly string[];
  readonly informationOnly: boolean;
  readonly pastPurchaseOnly: boolean;
};

export function isQuestion(text: string): boolean {
  return QUESTION.test(text) || /^(?:is|are|do|does|can|could|would|may|will|have|any)\b/.test(text)
    || /^(?:and )?(?:the )?(?:price|cost|delivery|shipping|breakfast|refund|sizes?|menu|availability|ingredients?)(?: please)?$/.test(text);
}

function affirmative(text: string): string {
  if (/\b(?:was|were) (?:wrong|incorrect)\b/.test(text)) return '';
  return text.replace(/\b(?:not|no) (?:the )?(?:chicken|coffee|red|green|black|small|large|blue|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+(?:\s*(?:am|pm))?)(?: notebooks?)?\b/g, '')
    .replace(/\b(?:i )?(?:do not|cannot|will not) (?:want|need|have|send|accept|confirm|update|order|buy|book)\b[^,;]*/g, '').trim();
}

export function analyzeUtterance(input: string, scenarioId: string, interpret: (part: string) => string): Utterance {
  const parts = englishSentences(input).flatMap(sentence => sentence
    .split(/[?!;,\n]+|\bbut\b|\bhowever\b|\s*(?=\b(?:actually|i meant|what|when|where|why|how)\b)|\band (?=(?:is|are|do|does|can|could|would|will|i |we )\b)/i))
    .map(interpret).filter(Boolean);
  const questions = parts.filter(isQuestion);
  let pastPurchase = false;
  const requests = parts.map(affirmative).filter(Boolean).filter(part => {
    if (/^(?:my|our|his|her|their) (?:friend|colleague|sister|brother|mother|father|manager|partner)\b.*\b(?:wants?|said|asked|ordered)\b/.test(part)) return false;
    if (scenarioId === 'place-an-order' && (/\b(?:used to|last (?:week|month|year)|yesterday|previously|earlier order)\b/.test(part) || isPastPurchase(part))) {
      pastPurchase = true;
      return false;
    }
    return !isQuestion(part) || ACTION.test(part) || /\b(?:do you have|do you sell|have you got)\b/.test(part);
  });
  return { parts, questions, requests, facts: questions.filter(part => !ACTION.test(part) || QUESTION.test(part)), informationOnly: questions.length > 0 && requests.length === 0, pastPurchaseOnly: pastPurchase && !questions.length && !requests.length };
}

/** Competing values are not silently collapsed to the first/last keyword.
 * A marked correction replaces earlier evidence only for the affected field. */
export function ambiguousDetails(scenarioId: string, requests: readonly string[]): string | undefined {
  const day = /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b/g;
  const patterns: readonly (readonly [RegExp, string])[] = scenarioId === 'reschedule-a-meeting'
    ? [[/\b\d{1,2}(?:\s*(?:am|pm)|:\d{2})\b|\b(?:2|4|14|16)\b/g, 'Which one time would you like: 2 p.m. or 4 p.m.?']]
    : scenarioId === 'book-a-room'
      ? [[day, 'You mentioned more than one arrival day. Which day should I use?'], [/\b(\d+)\s*nights?\b/g, 'You mentioned different lengths of stay. How many nights should I use?'], [/\b(\d+)\s*(?:guests?|people|adults?|persons?)\b/g, 'How many guests should I use? Please choose one total.']]
      : scenarioId === 'place-an-order'
        ? [[/\b(\d+)(?: blue)? notebooks?\b|\b(?:make it|keep it at) (\d+)\b/g, 'You mentioned different quantities. How many notebooks would you like in total?']]
        : scenarioId === 'order-at-a-cafe'
          ? [[/\b(?:small|large)\b/g, 'Which size would you like: small or large?']]
          : scenarioId === 'track-a-delivery'
            ? [[/\b(?:morning|afternoon)\b/g, 'Which delivery slot would you prefer: morning or afternoon?']]
            : [];
  for (const [pattern, question] of patterns) {
    const found = new Set<string>();
    for (const part of requests) {
      if (NEGATED_DETAIL.test(part) || isQuestion(part) && !ACTION.test(part)) continue;
      const matches = [...part.matchAll(pattern)].map(match => {
        const raw = (match[1] ?? match[2] ?? match[0]).replace(/\s+/g, '');
        if (scenarioId !== 'reschedule-a-meeting') return raw;
        if (/^(?:2|2pm|14|14:00)$/.test(raw)) return '2pm';
        if (/^(?:4|4pm|16|16:00)$/.test(raw)) return '4pm';
        return raw;
      });
      if (matches.length && CORRECTION.test(part)) found.clear();
      for (const match of matches) found.add(match);
    }
    if (found.size > 1) return question;
  }
  if (scenarioId === 'book-a-room' && requests.some(part => /\b(?:[2-9]|\d{2,}) rooms?\b/.test(part))) return 'I can practise a booking for one room here. Would you like to discuss one room, or clarify the number of rooms you need?';
  return undefined;
}

export function validationText(requests: readonly string[], scenarioId: string): string {
  const relevant = requests.filter(part => !['reschedule-a-meeting', 'book-a-room', 'place-an-order'].includes(scenarioId) || !NEGATED_DETAIL.test(part));
  const dates = /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/g;
  const guests = /\b\d+\s*(?:guests?|people|persons?|colleagues|adults?)\b/g;
  const nights = /\b\d+\s*(?:extra |more |additional )?nights?\b/g;
  const times = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b(?:14|16|19)(?::00)?\b/g;
  const fields = scenarioId === 'reschedule-a-meeting' ? [times]
    : scenarioId === 'plan-a-group-dinner' ? [guests, dates, times]
      : scenarioId === 'book-a-room' ? [guests, dates, nights]
        : scenarioId === 'change-a-reservation' ? [nights]
          : scenarioId === 'place-an-order' ? [/\b\d+(?: blue)? notebooks?\b|\bmake it \d+\b/g]
            : scenarioId === 'resolve-a-damaged-delivery' ? [dates] : [];
  // Supersede only the corrected field. “Actually Friday” must not erase an
  // unsupported guest count elsewhere in the request.
  relevant.forEach((part, index) => {
    if (!CORRECTION.test(part)) return;
    for (const pattern of fields) {
      if (![...part.matchAll(pattern)].length) continue;
      for (let earlier = 0; earlier < index; earlier++) relevant[earlier] = relevant[earlier]!.replace(pattern, '');
    }
  });
  return relevant.join(' ');
}
import { englishSentences, isPastPurchase } from './localNlp';
