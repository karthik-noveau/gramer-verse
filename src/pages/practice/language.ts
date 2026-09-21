import type { DialogueMemory, Values } from './dialogueModel';
import { politeRequest } from './localNlp';

type Alias = readonly [RegExp, string];
// Deliberately bounded, inspectable phrase equivalences. No model, network,
// stochastic classification, or fuzzy matching of names/reference numbers.
const SHARED: readonly Alias[] = [
  [/\b(?:i was hoping to|i am hoping to|i would love to|i am looking to|looking to)\b/g, 'i would like to'],
  [/\b(?:any chance|would it be possible that) (?:i|we) could\b/g, 'could i'],
  [/\bwould you mind\b/g, 'could you'],
  [/\b(could you) (?:please )?sending\b/g, '$1 send'],
  [/\b(could you) (?:please )?updating\b/g, '$1 update'],
  [/\b(could you) (?:please )?confirming\b/g, '$1 confirm'],
  [/\b(?:i was wondering|i am wondering|i would like to know|can you tell me|could you tell me) (?:if|whether)\b/g, 'is it true that'],
  [/\bi am (?:just )?asking about\b/g, 'what is'],
  [/\b(?:sorry )?i meant\b/g, 'actually make it'],
  [/\bkeep it at\b/g, 'make it'],
  [/\b(can|could|may|would) (i|we|you) possibly\b/g, '$1 $2'],
  [/\bkindly\b/g, 'please'],
  [/\bpurchas(?:e|ing)\b/g, 'buy'],
  [/\b(?:a couple|a pair) of\b/g, '2'],
  [/\b(?:a dozen)\b/g, '12'],
  [/\b(?:a text|an email) would be (?:great|good|fine)\b/g, 'please send confirmation by $&'],
  [/\b(?:what do i owe you|what would that come to|how much would that be|what will that set me back)\b/g, 'how much does it cost'],
  [/\bhow soon\b/g, 'how long'],
  [/\b(?:any idea|do you know|i was wondering)\s+(?=when|what|how|where)/g, ''],
  [/\b(?:get here|turn(?:ed)? up|show(?:ed)? up)\b/g, 'arrive'],
  [/\b(?:has not|have not|not) arrive\b/g, 'has not arrived'],
  [/\b(?:tell me about|i would like to know about|can you explain)\b/g, 'what is'],
  [/\b(?:that is okay with me|sounds good to me|that suits me|works for me)\b/g, 'that works'],
  [/\b(?:mail me|mail us)\b/g, 'email me'],
  [/\b(?:in the name of|in my name of)\b/g, 'under'],
  [/\b(\d+) (?:in the|this) (?:evening|afternoon)\b/g, '$1 pm'],
  [/\b(\d+) (?:in the|this) morning\b/g, '$1 am'],
];
const DOMAIN: Readonly<Record<string, readonly Alias[]>> = {
  'meet-a-colleague': [[/\bpoint me to\b/g, 'show me']],
  'book-a-room': [[/\bthe (\d+) of us\b/g, '$1 guests'], [/\bjust me\b/g, '1 guest'], [/\bboth of us\b/g, '2 guests']],
  'order-at-a-cafe': [[/\bcuppa\b/g, 'tea'], [/\b(?:take it with me|take mine with me|carry it out)\b/g, 'take away'], [/\b(?:drink it here|stay here)\b/g, 'for here']],
  'reschedule-a-meeting': [[/\bpush (?:our |the |this )?meeting back\b/g, 'reschedule our meeting'], [/\bsomething came up\b/g, 'i have a scheduling conflict']],
  'resolve-a-damaged-delivery': [[/\b(?:smashed|chipped|snapped)\b/g, 'broken'], [/\bdrop off\b/g, 'delivery'], [/\bpick up\b/g, 'collection']],
  'negotiate-a-deadline': [[/\btoo little time\b/g, 'not enough time'], [/\bpreliminary version\b/g, 'draft'], [/\bcall out\b/g, 'flag'], [/\bopen issues\b/g, 'unresolved issues'], [/\bconsequences\b/g, 'impact']],
  'handle-a-booking-mixup': [[/\bwithout paying (?:any )?more\b/g, 'at the same rate'], [/\bamend\b/g, 'update']],
};

export function canonicalPhrase(text: string, scenarioId: string): string {
  let result = politeRequest(text);
  for (const [pattern, replacement] of [...SHARED, ...(DOMAIN[scenarioId] ?? [])]) result = result.replace(pattern, replacement);
  if (scenarioId === 'book-a-room') {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    result = result.replace(/\bfrom (monday|tuesday|wednesday|thursday|friday|saturday|sunday) (?:to|until) (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g, (original, start: string, end: string) => {
      const nights = (days.indexOf(end) - days.indexOf(start) + 7) % 7;
      return nights ? `arriving ${start} for ${nights} nights` : original;
    });
  }
  // Old values in a correction are not new assertions. This also prevents
  // validation from rejecting the newly supplied value because of the old one.
  result = result.replace(/\binstead of\s+(?:the )?(?:\d+(?:\s*(?:am|pm|notebooks?|nights?))?|small|large|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g, '');
  result = result.replace(/\bchange (?:it |that |the quantity )?from \d+ to (\d+)\b/g, 'make it $1');
  return result.replace(/\s+/g, ' ').trim();
}

export const MEMORY_QUESTION = /\b(?:recap|summari[sz]e|remind me|what have (?:we|i)|what did i|what (?:dates?|details|time|quantity|name|size|day|order) did i|what (?:did you|have you) (?:note|record)|what is my (?:order|booking|name)|how many did i)\b/;
export const REFUSAL = /^(?:(?:i (?:will|would rather) pass)|(?:i am afraid )?(?:that |it )?(?:will not|does not|would not) work(?: for me)?|not for me|hold on(?: not yet)?|not yet|let me think(?: about it)?|i need (?:a moment|some time))(?: please| thanks| thank you)?$/;
export const UNCERTAIN = /\b(?:maybe|perhaps|possibly|not sure|undecided|i guess|i might|approximately|around \d+|either \d+|\d+ or \d+|small or large|morning or afternoon)\b/;
export const CONDITIONAL = /\b(?:only if|provided(?: that)?|on condition|as long as|if (?:there|it|that|you|we)\b|if i (?:order|ordered|buy|bought|book|booked)|suppose i|what if)\b/;
export const OFF_TOPIC = /\b(?:sky|planets?|moon|capital of|weather|politics|president|write (?:a )?(?:poem|code)|football|cricket|horoscope)\b/;

/** Resolve an ordinal only against choices that were actually offered in this
 * conversation. An unrelated question does not erase that choice context. */
export function resolveReference(text: string, memory?: DialogueMemory): string {
  const current = memory?.pendingChange ?? memory?.values;
  if (current?.quantity && !/\b(?:if|maybe|not sure|do not|cannot|will not)\b/.test(text)) {
    const change = /\b(add|another|increase by|remove|reduce by) (\d+)(?: more| extra)?(?: notebooks?)?\b/.exec(text);
    if (change) {
      const sign = change[1] === 'remove' || change[1] === 'reduce by' ? -1 : 1;
      const quantity = Math.max(0, Number(current.quantity) + sign * Number(change[2]));
      return text.replace(change[0], `make it ${quantity} notebooks`);
    }
  }
  const alternatives = memory?.alternatives;
  if (!alternatives || /\b(?:what|which|why|how|if|maybe|not sure)\b/.test(text)) return text;
  const referring = /\b(?:the|choose|prefer|take|pick) (?:first|former|earlier|smaller|second|latter|later|larger|bigger|last)(?= (?:1|one|option|slot|time|size)\b|(?: please)?$| works| would work)|^(?:first|former|earlier|smaller|second|latter|later|larger|bigger|last)(?: 1| one| option| slot)?(?: please)?$/;
  const first = referring.test(text) && /\b(?:first|former|earlier|smaller)\b/.test(text);
  const last = referring.test(text) && /\b(?:second|latter|later|larger|bigger|last)\b/.test(text);
  const other = /\b(?:other 1|other one|other option|other slot)\b/.test(text);
  let selected: string | undefined;
  if (first !== last) selected = first ? alternatives.options[0] : alternatives.options[alternatives.options.length - 1];
  else if (other && alternatives.options.length === 2 && current?.[alternatives.key]) selected = alternatives.options.find(option => option !== current[alternatives.key]);
  if (!selected) return text;
  return text.replace(/\b(?:the )?(?:first|former|earlier|smaller|second|latter|later|larger|bigger|last)(?: (?:1|one|option|slot|time|size))?\b|\b(?:the )?other (?:1|one|option|slot)\b/g, selected);
}

export function summarizeDetails(scenarioId: string, v: Values): string {
  const details: string[] = [];
  if (scenarioId === 'place-an-order') {
    if (v.product) details.push(`${v.quantity ?? 'an undecided number of'} blue notebook${v.quantity === '1' ? '' : 's'}`);
  } else if (scenarioId === 'order-at-a-cafe') {
    if (v.drink) details.push(`${v.size ?? 'a'} tea${v.takeaway ? ` ${v.takeaway}` : ''}`);
  } else {
    if (v.name && v.name !== 'yes') details.push(`name: ${v.name}`);
    if (v.reference) details.push(`reference ${v.reference.toUpperCase()}`);
    if (v.guests) details.push(`${v.guests} guest${v.guests === '1' ? '' : 's'}`);
    const day = v.arrival && v.arrival !== 'yes' ? v.arrival : v.day;
    if (day) details.push(day[0]!.toUpperCase() + day.slice(1));
    if (v.nights) details.push(`${v.nights} night${v.nights === '1' ? '' : 's'}`);
    if (v.night) details.push(`${v.night} extra night`);
    if (v.time) details.push(v.time);
    if (v.period) details.push(v.period);
    if (v.quiet) details.push('a quiet room');
    if (v.resolution === 'refund') details.push('a refund request');
    else if (v.deadline) details.push(`needed by ${v.deadline}`);
    if (v.vegetarian) details.push(v.vegetarian === 'none' ? 'no vegetarian choices requested' : 'vegetarian food');
    if (v.draft && v.thursday) details.push('draft on Thursday');
    if (v.final && v.monday) details.push('reviewed final report on Monday');
  }
  return details.length ? `Here’s what I have so far: ${details.join(', ')}.` : 'You haven’t given me those details yet.';
}

const GLOSSARY: Readonly<Record<string, string>> = {
  adjacent: '“Adjacent” means next to each other. Adjacent tables let your group sit close together.',
  takeaway: '“Takeaway” means taking your food or drink with you instead of having it here.',
  reservation: 'A “reservation” is an arrangement to keep a room or table for you at an agreed time.',
  refund: 'A “refund” means getting your money back for something you paid for.',
  confirmation: 'A “confirmation” is a message or statement that records the agreed details.',
  surname: 'Your “surname” is your family name, also called your last name.',
  draft: 'A “draft” is an early version that may still need changes or review.',
  deadline: 'A “deadline” is the latest time or date by which something needs to be done.',
  collection: '“Collection” means someone comes to pick up the item.',
  included: '“Included” means something is already part of the stated price or service.',
};
export function explainTerm(text: string): string | undefined {
  const term = /\b(?:what does|meaning of|what is meant by|explain (?:the word )?)\s*([a-z]+)(?: mean)?\b/.exec(text)?.[1];
  return term ? GLOSSARY[term] : undefined;
}
