import type { Scenario } from './data';
import { ACCEPT_OFFER, AVAILABILITY, inventoryIntent } from './availability';
import type { OfferId } from './availability';
import { DIALOGUE_MODELS } from './dialogueModel';
import type { DialogueMemory, DialogueModel, Pending, Values } from './dialogueModel';
import { canonicalPhrase, resolveReference, summarizeDetails, explainTerm, MEMORY_QUESTION, REFUSAL, UNCERTAIN, CONDITIONAL, OFF_TOPIC } from './language';
import { ACTION, NEGATED_DETAIL, analyzeUtterance, ambiguousDetails, validationText } from './utterance';
import type { Utterance } from './utterance';
import { answerQuestions, questionTopic, unsupportedRequirement, UNKNOWN_ANSWER } from './questionAnswers';
import { prepareEnglish } from './localNlp';

export type LocalResponse = {
  readonly kind: 'advance' | 'clarify' | 'social' | 'help' | 'answer' | 'correction' | 'fallback';
  readonly text: string;
  readonly tamil?: string;
  readonly tip?: string;
  readonly facts: readonly string[];
  readonly details: readonly string[];
  readonly advanceBy: number;
  /** Only an exact authored reply has an authored Tamil translation. */
  readonly choice: number | null;
  readonly offer?: OfferId;
  readonly dialogue?: DialogueMemory;
};
export type ResponseContext = {
  readonly facts: readonly string[];
  readonly details?: readonly string[];
  readonly lastResponse?: string;
  readonly fallbacks?: number;
  readonly offer?: OfferId;
  readonly dialogue?: DialogueMemory;
};

const SHORTCUTS: Readonly<Record<string, string>> = { pls: 'please', plz: 'please', thx: 'thanks', tmrw: 'tomorrow', veggie: 'vegetarian', veggies: 'vegetarian', wanna: 'want to', dont: 'do not', cant: 'cannot', im: 'i am' };

export function normalizeMessage(raw: string): string {
  return normalizePrepared(prepareEnglish(raw));
}

function normalizePrepared(prepared: string): string {
  return prepared.toLowerCase()
    .replace(/\b(can't|can not|cannot)\b/g, 'cannot').replace(/\bwon't\b/g, 'will not')
    .replace(/n't\b/g, ' not').replace(/\b(i|you|we|they)'re\b/g, '$1 are')
    .replace(/\bi'm\b/g, 'i am').replace(/\b(i|you|we|they)'ve\b/g, '$1 have')
    .replace(/\b(i|you|we|they)'ll\b/g, '$1 will').replace(/\b(i|you|we|they)'d\b/g, '$1 would')
    .replace(/\b(it|that|there|what)'s\b/g, '$1 is')
    .replace(/\bp\.?\s*m\.?\b/g, 'pm').replace(/\ba\.?\s*m\.?\b/g, 'am').replace(/(\d):00\b/g, '$1')
    .replace(/[^a-z0-9:]+/g, ' ').trim().split(/\s+/)
    .map((word) => SHORTCUTS[word] ?? word).join(' ');
}

// Only longer scenario vocabulary is typo-corrected, and only at edit distance
// one with a unique match. Never fuzzy-match numbers, names, dates or negation.
const VOCABULARY = ['notebook', 'notebooks', 'breakfast', 'vegetarian', 'delivery', 'arrived', 'delayed', 'tomorrow', 'afternoon', 'meeting', 'reservation', 'confirmation', 'confirm', 'reference', 'colleague', 'colleagues', 'people', 'nights', 'small', 'takeaway', 'please', 'photos', 'cracked', 'replacement', 'refund', 'collection', 'invitation', 'update', 'draft', 'reviewed', 'report', 'impact', 'quiet', 'unchanged', 'adjacent', 'together', 'email'];
const oneEditAway = (left: string, right: string): boolean => {
  if (Math.abs(left.length - right.length) > 1) return false;
  if (left.length === right.length) {
    const differences = [...left].flatMap((letter, index) => letter === right[index] ? [] : [index]);
    if (differences.length === 1) return true;
    const [a, b] = differences;
    return differences.length === 2 && a !== undefined && b === a + 1 && left[a] === right[b] && left[b] === right[a];
  }
  const [short, long] = left.length < right.length ? [left, right] : [right, left];
  let index = 0;
  while (index < short.length && short[index] === long[index]) index++;
  return short.slice(index) === long.slice(index + 1);
};
const correctTypos = (text: string): string => text.split(' ').map((word) => {
  if (word.length < 5 || VOCABULARY.includes(word) || VOCABULARY.includes(`${word}s`)) return word;
  const matches = VOCABULARY.filter((candidate) => oneEditAway(word, candidate));
  return matches.length === 1 ? matches[0] : word;
}).join(' ');

const YES = /^(?:(?:yes|yeah|yep|sure|okay|ok|alright|fine|great|perfect|please|correct|absolutely|certainly|go ahead|sounds good|that works|that is fine|that would be fine|that would work|that will work)(?: (?:please|thanks|thank you|for me))?|i (?:agree|will|can))$/;
const NO = /^(?:no|nope|not really|no thanks|no thank you|i disagree)(?: please)?$/;
const CANCEL = /^(?:cancel|stop|never mind|nevermind|forget it)(?: (?:it|this|that|my|the|order|booking|reservation|please))*$|\b(?:i (?:do not|no longer) (?:want|need)(?: to)? (?:order|buy|book|stay|tea|notebooks?)|cancel (?:my|the) (?:order|booking|reservation))\b/;
const FUTURE_DETAILS = new Set(['product', 'colour', 'quantity', 'room', 'guests', 'arrival', 'nights', 'drink', 'size', 'takeaway', 'reference', 'name', 'day', 'time', 'period', 'together', 'vegetarian', 'deadline', 'refund', 'data', 'wednesday', 'constraint', 'draft', 'thursday', 'final', 'monday']);
const SOCIAL = /^(?:hi|hello|hey|good (?:morning|afternoon|evening)|how are you|how is it going)(?: there| again)?$/;
const THANKS = /^(?:thanks|thank you|thank you very much|many thanks|cheers)(?: so much)?$/;
const EXPLICIT_DETAILS = new Set(['time', 'size', 'guests', 'nights', 'quantity', 'arrival', 'period']);
function proposal(id: string): Pending | undefined {
  if (id === 'change-a-reservation') return { values: { extend: 'yes', night: '1' } };
  if (id === 'plan-a-group-dinner') return { values: { guests: '12', day: 'friday', time: '7 p.m.', together: 'yes' } };
  if (id === 'negotiate-a-deadline') return { values: { draft: 'yes', thursday: 'yes', final: 'yes', monday: 'yes' } };
  if (id === 'resolve-a-damaged-delivery') return { values: { deadline: 'friday' } };
  return undefined;
}
function questionFor(model: DialogueModel, step: number, values: Values, entered = false): { text: string; pending?: Pending } {
  if (step === 2 && values.resolution === 'refund') {
    const text = 'I understand—you’d prefer a refund, not a replacement. I can note the request, but I can’t confirm its processing time. Would you like a written summary of your request?';
    return { text, pending: { values: { written: 'yes' }, no: { written: 'none' }, question: text } };
  }
  const keys = model.stages[step] ?? [];
  const missing = keys.filter(key => !values[key]);
  const first = model.fields.find(field => field.key === missing[0]);
  if (entered && missing.length === keys.length) {
    const pending = model.confirmations?.[step];
    const text = model.prompts[step]!(values);
    return { text, ...(pending ? { pending: { ...pending, question: text } } : {}) };
  }
  const pending = first?.yes ? { values: { [first.key]: first.yes }, question: first.question, ...(first.no ? { no: { [first.key]: first.no } } : {}) } : undefined;
  return { text: first?.question ?? model.prompts[step]?.(values) ?? '', ...(pending ? { pending } : {}) };
}

function followUp(scenario: Scenario, model: DialogueModel, text: string, context: ResponseContext, utterance: Utterance): LocalResponse {
  const memory = context.dialogue ?? { values: {} };
  const topic = utterance.facts.map(questionTopic).filter(Boolean).pop() ?? memory.topic;
  const result = (kind: LocalResponse['kind'], message: string, dialogue = memory): LocalResponse => ({ kind, text: message, facts: [], details: [], advanceBy: 0, choice: null, dialogue: { ...dialogue, ...(topic ? { topic } : {}) } });
  const answers = answerQuestions(scenario.id, model, utterance.facts, true, memory.topic);
  const answerText = answers.map(answer => typeof answer.text === 'function' ? answer.text(memory.values) : answer.text).join(' ');
  const withAnswer = (message: string): string => answerText ? `${answerText} ${message}` : message;
  if (MEMORY_QUESTION.test(text)) return result('answer', `${summarizeDetails(scenario.id, memory.values)}${memory.pendingChange ? ` Proposed change: ${summarizeDetails(scenario.id, memory.pendingChange)} It is not confirmed yet.` : ''}`);
  const explanation = explainTerm(text);
  if (explanation) return result('answer', explanation);
  if (/\b(repeat|say (?:it|that) again)\b/.test(text)) return result('help', context.lastResponse ?? model.finish(memory.values));
  if (THANKS.test(text)) return result('social', 'You’re welcome! Is there anything else you’d like to check?');
  if (SOCIAL.test(text)) return result('social', 'Hi again! What would you like to check about our conversation?');
  if (CANCEL.test(text)) return result('clarify', 'I’ve put this practice arrangement on hold. Nothing has been ordered or booked outside this chat. You can restart whenever you’re ready.', { values: memory.values, suspended: true });
  if (memory.suspended) return result('clarify', 'That arrangement is on hold. Use Restart conversation to begin again.');
  const ambiguity = ambiguousDetails(scenario.id, utterance.requests);
  if (ambiguity) return result('clarify', `${ambiguity} Your previous details are unchanged.`, { values: memory.values, ...(memory.alternatives ? { alternatives: memory.alternatives } : {}) });
  const confirms = utterance.requests.some(part => YES.test(part)) && utterance.requests.every(part => YES.test(part));
  if (memory.pendingChange && (YES.test(text) || confirms) && !CONDITIONAL.test(text) && !UNCERTAIN.test(text)) {
    return result('answer', withAnswer(`The revised details are confirmed. ${summarizeDetails(scenario.id, memory.pendingChange)}`), { values: memory.pendingChange, ...(memory.alternatives ? { alternatives: memory.alternatives } : {}) });
  }
  if (memory.pendingChange && (NO.test(text) || REFUSAL.test(text))) return result('clarify', `No problem—I’ve kept the previous details. ${summarizeDetails(scenario.id, memory.values)}`, { values: memory.values, ...(memory.alternatives ? { alternatives: memory.alternatives } : {}) });
  if (OFF_TOPIC.test(text)) return result('fallback', 'I can help with follow-up questions about this conversation. What would you like to check?');
  if (UNCERTAIN.test(text) || CONDITIONAL.test(text)) return result('clarify', 'No rush. Tell me the change you’d like when you’ve decided; I’ll check it with you before updating anything.');

  const requirement = unsupportedRequirement(scenario.id, utterance.requests);
  if (requirement) return result('clarify', requirement);

  const revision = /\b(change|make (?:it|that)|actually|instead|rather|amend|correct|switch)\b/.test(text);
  if (revision) {
    const candidate: Record<string, string> = { ...(memory.pendingChange ?? memory.values) };
    let extracted = false;
    for (const field of model.fields) {
      if (!FUTURE_DETAILS.has(field.key)) continue;
      for (const part of utterance.requests) {
        if (EXPLICIT_DETAILS.has(field.key) && NEGATED_DETAIL.test(part)) continue;
        const found = field.read?.(part, false);
        if (found) { candidate[field.key] = found; extracted = true; }
      }
    }
    const issue = model.validate?.(validationText(utterance.requests, scenario.id), candidate);
    if (issue) return result('clarify', issue);
    const stock = AVAILABILITY[scenario.id];
    if (stock && inventoryIntent(stock, text) === 'unavailable') return result('answer', `${stock.unavailable.replace(/ Would you[^?]+\?$/, '')} Your earlier arrangement is unchanged.`);
    if (extracted && Object.keys(candidate).some(key => candidate[key] !== memory.values[key])) {
      return result('clarify', withAnswer(`${summarizeDetails(scenario.id, candidate)} Shall I confirm those revised details?`), { ...memory, pendingChange: candidate });
    }
    if (extracted && memory.pendingChange) return result('clarify', withAnswer(`I’ve kept the original details. ${summarizeDetails(scenario.id, memory.values)}`), { values: memory.values, ...(memory.alternatives ? { alternatives: memory.alternatives } : {}) });
    return result('clarify', withAnswer(memory.pendingChange ? 'Would you like to confirm the proposed change?' : 'Which detail would you like to change? For example, tell me the new quantity, date, size, or time.'));
  }
  if (answerText) return result('answer', answerText + (memory.pendingChange ? ' Would you like to confirm the proposed change?' : ''));
  if (/\b(help|hint|what can i)\b/.test(text)) return result('help', 'You can ask about the details we discussed, say “recap”, or request a change. Use Practice again to start over.');
  if (/\b(bye|goodbye|see you)\b/.test(text)) return result('social', 'Thanks for the conversation. Have a lovely day!');
  return result('fallback', 'What would you like to check about our conversation? You can ask for a recap or tell me which detail you’d like to change.');
}

/** A deterministic, stateful conversation partner. Facts are separated from
 * commitments: asking a question does not place an order or accept an offer. */
export function respondLocally(scenario: Scenario, turnIndex: number, input: string, context: ResponseContext = { facts: [] }): LocalResponse {
  const model = DIALOGUE_MODELS[scenario.id];
  const turn = scenario.turns[turnIndex];
  const prepared = prepareEnglish(input);
  const normalized = normalizePrepared(prepared);
  const interpret = (part: string): string => resolveReference(canonicalPhrase(correctTypos(part), scenario.id), context.dialogue);
  const text = interpret(normalized);
  const utterance = analyzeUtterance(prepared, scenario.id, part => interpret(normalizePrepared(part)));
  const stock = AVAILABILITY[scenario.id];
  const choice = turn?.choices.findIndex(item => normalizeMessage(item.text) === normalized) ?? -1;
  const values: Record<string, string> = { ...(context.dialogue?.values ?? {}) };
  // Standalone engine callers can start at a particular goal. Live sessions
  // always supply explicit memory; no details are inferred from bot prose.
  if (!context.dialogue && model) {
    for (const key of model.stages.slice(0, turnIndex).flat()) values[key] = model.defaults[key] ?? 'yes';
    for (const key of context.facts) values[key] = model.defaults[key] ?? 'yes';
  }
  let pending = context.dialogue?.pending;
  if (!context.dialogue && model) {
    const field = model.fields.find(item => context.lastResponse?.endsWith(item.question));
    if (field?.yes) pending = { values: { [field.key]: field.yes }, ...(field.no ? { no: { [field.key]: field.no } } : {}) };
    else if (!context.lastResponse || context.lastResponse === turn?.prompt) pending = model.confirmations?.[turnIndex];
  }
  const respond = (kind: LocalResponse['kind'], message: string, extra: Partial<LocalResponse> = {}, state: DialogueMemory = { values, ...(pending ? { pending } : {}) }): LocalResponse => {
    const step = turnIndex + (extra.advanceBy ?? 0);
    const options = model?.fields.find(field => model.stages[step]?.includes(field.key) && !state.values[field.key] && field.options);
    const alternatives = options?.options ? { key: options.key, options: options.options } : state.alternatives ?? context.dialogue?.alternatives;
    const topic = utterance.facts.map(questionTopic).filter(Boolean).pop() ?? state.topic ?? context.dialogue?.topic;
    const memory = { ...state, ...(!state.suspended && alternatives ? { alternatives } : {}), ...(!state.suspended && topic ? { topic } : {}) };
    return { kind, text: message, facts: (model?.stages[turnIndex] ?? []).filter(key => state.values[key]), details: [], advanceBy: 0, choice: choice < 0 ? null : choice, dialogue: memory, ...extra };
  };
  if (!model) return respond('fallback', 'Choose a scenario to start a practice conversation.');
  if (/(?:-\s*\d+|\b\d+\.\d+)\s*(?:blue )?(?:notebooks?|guests?|people|nights?)\b/i.test(prepared) || /\bminus \d+\s*(?:blue )?(?:notebooks?|guests?|people|nights?)\b/.test(normalized)) return respond('clarify', 'Could you give me a positive whole number for that quantity?', {}, context.dialogue ?? { values });
  if (!turn) return followUp(scenario, model, text, context, utterance);
  const currentKeys = model.stages[turnIndex]!;
  const awaiting = currentKeys.find(key => !values[key]);
  if (awaiting && ['quantity', 'guests', 'nights', 'night'].includes(awaiting) && /^(?:-\s*)?\d[\d.,]*(?:\s+please)?[.!]?\s*$/i.test(prepared.trim())) {
    const amount = Number(prepared.trim().replace(/\s+please[.!]?$/i, '').replace(/[.!]$/, ''));
    if (!Number.isInteger(amount) || amount < 1 || amount > 99) return respond('clarify', 'Please give me a whole number between 1 and 99.', {}, context.dialogue ?? { values });
  }
  const renderValues = (): Values => ({ ...model.defaults, ...values });
  const prompt = (): string => questionFor(model, turnIndex, values).text;
  const offerState = (offer: OfferId): DialogueMemory => ({ values, pending: { values: offer === 'notebooks' ? { product: 'yes', colour: 'yes' } : { drink: 'yes' }, question: stock?.offer ?? '' } });
  const preserve = (): Partial<LocalResponse> => context.offer ? { offer: context.offer } : {};

  if (/^(?:repeat|say (?:it|that) again|pardon|come again)(?: please)?$/.test(text)) return respond('help', context.lastResponse ?? turn.prompt, preserve(), context.dialogue ?? { values });
  if (/^(?:help|hint|help me|i need help|can you help me|what (?:do|should|can) i (?:say|type|reply)(?: next)?|i (?:do not|cannot) understand(?: the question)?|explain(?: this)?|example|give me (?:a hint|an example))(?: please)?$/.test(text)) {
    return respond('help', `${prompt()} You could say: “${turn.choices[turn.answer]?.text ?? ''}”`, { tamil: turn.replyTamil, ...preserve() }, context.dialogue ?? { values });
  }
  if (SOCIAL.test(text)) return respond('social', `Hi! ${pending?.question ?? (context.offer && stock ? stock.offer : prompt())}`, preserve(), context.dialogue ?? { values });
  if (THANKS.test(text)) return respond('social', 'You’re welcome! Happy to help.', preserve(), context.dialogue ?? { values });
  if (MEMORY_QUESTION.test(text)) return respond('answer', summarizeDetails(scenario.id, values), preserve(), context.dialogue ?? { values });
  const explanation = explainTerm(normalized);
  if (explanation) return respond('answer', explanation, preserve(), context.dialogue ?? { values });
  if (OFF_TOPIC.test(text)) {
    const lead = ['I don’t have that information.', 'I don’t have that information. Let’s return to your conversation.', 'I don’t have that information. I can help with the situation we’re discussing.'][(context.fallbacks ?? 0) % 3];
    return respond('fallback', `${lead} ${prompt()}`, preserve(), context.dialogue ?? { values });
  }
  if (REFUSAL.test(text)) return respond('clarify', 'No problem. Take your time—I won’t go ahead. Let me know what you’d prefer.', {}, { values });
  if (/^(?:bye|goodbye|see you|see you later)$/.test(text)) return respond('social', 'Thanks for stopping by. Have a lovely day!', {}, { values, suspended: true });
  if (/[\u0B80-\u0BFF]/.test(input)) return respond('help', 'Please try your reply in English. Tamil help and the suggested replies are here if you need a starting point.', { tamil: 'ஆங்கிலத்தில் பதில் எழுத முயற்சி செய்யுங்கள். உதவிக்கு மாதிரி பதில்களைப் பார்க்கலாம்.', ...preserve() }, context.dialogue ?? { values });
  if (/\b(are you (?:a bot|human|real)|is this (?:real|ai)|are you ai)\b/.test(text)) return respond('answer', 'I’m a local, rule-based practice partner, not a real member of staff. Nothing is ordered, booked, or sent outside this chat.', preserve(), context.dialogue ?? { values });
  if (/\b(frustrat\w*|annoy\w*|not helpful|not listening)\b/.test(text)) return respond('social', `I’m sorry this has been frustrating. ${prompt()}`, preserve(), context.dialogue ?? { values });
  if (CANCEL.test(text)) return respond('clarify', 'Of course. I won’t go ahead with that. You can restart this conversation whenever you’re ready.', {}, { values: {}, suspended: true });
  if (context.dialogue?.suspended && YES.test(text)) return respond('clarify', 'What would you like to do next? You can restart to begin again.', {}, context.dialogue);
  if (utterance.pastPurchaseOnly) return respond('clarify', 'Are you asking about an earlier purchase, or would you like to place a new order?', {}, context.dialogue ?? { values });
  if (scenario.id === 'correct-a-food-order' && /\b(cannot wait|do not want to wait|too long|keep the chicken)\b/.test(text)) return respond('clarify', 'I understand. I’ll hold the replacement. We can discuss another option, or you can restart to try a different reply.', {}, { values });

  // A refusal answers only the actual outstanding offer, never every detail.
  if (NO.test(text)) {
    if (scenario.id === 'order-at-a-cafe' && turnIndex === 2) values.price = 'yes';
    else if (scenario.id === 'book-a-room' && turnIndex === 2) values.breakfast = 'yes';
    else if (pending?.no) Object.assign(values, pending.no);
    else return respond('clarify', context.offer && stock ? stock.declined : scenario.id === 'correct-a-food-order' ? 'I understand. I won’t bring the replacement yet. Would you prefer to discuss another option?' : 'That’s okay. I won’t go ahead with that. What would you prefer instead?', {}, { values });
    pending = undefined;
  }

  const { parts, requests, informationOnly } = utterance;
  // Availability questions have their own precise, stock-aware replies.
  const inventoryText = [...requests, ...utterance.questions].join(' ');
  const applicableAnswers = answerQuestions(scenario.id, model, utterance.facts.filter(part => !(stock?.product.test(part) && /^(?:do you have|do you sell|have you got)\b/.test(part))), !stock || !inventoryIntent(stock, inventoryText), context.dialogue?.topic);
  const ambiguity = ambiguousDetails(scenario.id, requests);
  if (ambiguity) return respond('clarify', ambiguity, {}, { values });
  const conditionClause = parts.find(part => CONDITIONAL.test(part)) ?? text;
  const knownCondition = scenario.id === 'plan-a-group-dinner' && /as long as (?:the )?tables are adjacent$/.test(conditionClause)
    || scenario.id === 'handle-a-booking-mixup' && /provided (?:that )?(?:the )?(?:confirmed |original )?rate (?:remains|stays|is) (?:unchanged|the same)$/.test(conditionClause);
  if (UNCERTAIN.test(text) || CONDITIONAL.test(text) && !knownCondition) {
    const conditionalAnswers = answerQuestions(scenario.id, model, [text], false);
    const answer = conditionalAnswers.map(item => typeof item.text === 'function' ? item.text(renderValues()) : item.text).join(' ');
    const hypothetical = /\b(?:if i|suppose i|what if)\b/.test(text);
    const fills = Object.assign({}, ...conditionalAnswers.map(item => item.fills ?? {})) as Values;
    const canConfirm = !hypothetical && !UNCERTAIN.test(text) && Object.keys(fills).length > 0 && !/don’t|cannot|can’t/.test(answer);
    const question = canConfirm ? 'Would you like to go ahead?' : `Take your time to decide. ${prompt()}`;
    return respond('clarify', `${answer ? `${answer} ` : ''}${question}`, {}, { values, ...(canConfirm ? { pending: { values: fills, question } } : {}) });
  }
  const requirement = unsupportedRequirement(scenario.id, requests.filter(part => !utterance.facts.includes(part)));
  if (requirement) return respond('clarify', requirement, {}, { values });

  if (stock) {
    const inventory = inventoryIntent(stock, inventoryText);
    if (inventory) {
      const answer = applicableAnswers.map(item => typeof item.text === 'function' ? item.text(renderValues()) : item.text).join(' ');
      return respond('answer', `${answer ? `${answer} ` : ''}${inventory === 'unavailable' ? stock.unavailable : stock.offer}`, { offer: stock.id }, offerState(stock.id));
    }
    if (context.offer === stock.id && (ACCEPT_OFFER.test(text) || /^\d+(?: notebooks?)?(?: please)?$/.test(text))) {
      Object.assign(values, stock.id === 'notebooks' ? { product: 'yes', colour: 'yes' } : { drink: 'yes' });
    }
  }

  const bareYes = YES.test(text) || /^yes (?:please )?(?:i want to|i would like to|let us) (?:order|book|go ahead)$/.test(text);
  const acceptsPending = bareYes || /^(?:yes|yeah|sure|okay|ok|absolutely|certainly|go ahead|that works|sounds good)\b/.test(text) && !/\b(?:not|no|cannot|but|if|unless)\b/.test(text);
  if (acceptsPending && pending) Object.assign(values, pending.values);
  const shortNo = NO.test(text);
  const was = { ...values };
  const detailsText = requests.join(' ');
  for (const field of model.fields) {
    if (!currentKeys.includes(field.key) && !FUTURE_DETAILS.has(field.key)) continue;
    if (scenario.id === 'negotiate-a-deadline' && turnIndex === 0 && ['draft', 'thursday', 'final', 'monday'].includes(field.key) && !/\bdraft\b/.test(detailsText)) continue;
    // A changed detail supersedes the previous value. Old evidence is never
    // concatenated into a keyword bag that could revive rejected information.
    if (detailsText && !bareYes && !shortNo) {
      for (const part of requests) {
        if (EXPLICIT_DETAILS.has(field.key) && NEGATED_DETAIL.test(part)) continue;
        const found = field.read?.(part, field.key === awaiting || context.offer === 'notebooks' && field.key === 'quantity');
        if (found) values[field.key] = found;
      }
    }
  }
  // Name-only introductions are useful, but arbitrary fallback words are not names.
  if (scenario.id === 'meet-a-colleague' && !values.name && /^(?:arun|priya|kumar|maya)$/.test(text)) values.name = text[0]!.toUpperCase() + text.slice(1);
  // Infer only relations entailed by what was said, not fixed sample answers.
  if (scenario.id === 'track-a-delivery' && values.delay) values.order = 'yes';
  if (scenario.id === 'change-a-reservation' && values.night) values.extend = 'yes';
  if (scenario.id === 'correct-a-food-order' && values.vegetarian) values.dish = 'yes';
  if (scenario.id === 'plan-a-group-dinner' && values.email && /\b(send|confirm|please)\b/.test(detailsText)) values.confirm = 'yes';
  if (scenario.id === 'resolve-a-damaged-delivery' && /\b(?:no|do not have|cannot (?:send|share)) (?:any )?(?:photos?|pictures?)\b/.test(text)) values.photos = 'unavailable';
  if (scenario.id === 'resolve-a-damaged-delivery' && /\b(?:want|prefer|like|request) (?:a )?(?:refund|my money back)\b/.test(text) && !/\b(if|unless|otherwise|or)\b/.test(text) && !informationOnly) {
    Object.assign(values, { resolution: 'refund', deadline: 'not-needed', refund: 'yes', delivery: 'refund', collection: 'not-arranged' });
    delete values.written;
  }
  if (/\b(?:do not|no need to|not) (?:send|email|confirm|update|accept|book)\b/.test(text)) {
    return respond('clarify', 'Understood. I won’t confirm or send anything yet. What would you like to change?', {}, { values: context.dialogue?.values ?? was });
  }
  if (/\b(?:not|no) (?:blue|tea|notebooks?)\b|\b(?:do not|not) (?:want|buying|ordering)\b/.test(text) && !requests.some(part => ACTION.test(part) && !/\bnot\b/.test(part))) {
    return respond('clarify', stock?.declined ?? 'Understood. What would you prefer instead?', {}, { values: context.dialogue?.values ?? {} });
  }

  const issue = values.resolution === 'refund' || scenario.id === 'negotiate-a-deadline' && turnIndex === 0 && !/\bdraft\b/.test(detailsText) ? undefined : model.validate?.(validationText(requests, scenario.id), values);
  if (issue && !informationOnly) {
    const nextPending = /Would .*work|Would you like to add|Would that plan/.test(issue) ? proposal(scenario.id) : undefined;
    const invalid: Readonly<Record<string, readonly string[]>> = {
      'reschedule-a-meeting': ['time'], 'plan-a-group-dinner': ['guests', 'day', 'time'],
      'resolve-a-damaged-delivery': ['deadline'], 'negotiate-a-deadline': ['draft', 'thursday', 'final', 'monday'],
      'place-an-order': ['quantity'], 'book-a-room': ['guests', 'nights'],
    };
    for (const key of invalid[scenario.id] ?? []) {
      if (was[key]) values[key] = was[key]; else delete values[key];
    }
    return respond('clarify', issue, {}, { values, ...(nextPending ? { pending: { ...nextPending, question: issue } } : {}) });
  }

  // Only genuine grammar-error examples receive a teaching tip. A valid
  // alternate order or a refusal is handled as conversation, not marked wrong.
  const example = choice >= 0 ? turn.choices[choice] : undefined;
  const grammarError = example && choice !== turn.answer && /\b(use|after|plural|auxiliary|base form|base verb|word order|past participle|needs? “|with “you”|include “be”)\b/i.test(example.feedback)
    && !/valid order|your goal|instead of|does not provide|rather than/.test(example.feedback);
  if (grammarError) return respond('correction', prompt(), { tip: example.feedback }, context.dialogue ?? { values: was });
  // Keep specific guidance for non-requests that cannot be interpreted.
  if (example && choice !== turn.answer && !detailsText && !applicableAnswers.some(answer => answer !== UNKNOWN_ANSWER) && !shortNo) return respond('correction', prompt(), { tip: example.feedback }, context.dialogue ?? { values: was });

  for (const answer of applicableAnswers) Object.assign(values, answer.fills ?? {});
  if (scenario.id === 'order-at-a-cafe' && turnIndex === 2 && /^(?:no(?: thanks)?|that is all(?: thank you)?|nothing else)$/.test(text)) values.price = 'yes';
  // Refusing an optional item is a real answer, not an invitation to ask again.
  if (scenario.id === 'plan-a-group-dinner' && /\b(?:no|do not need|without) vegetarian\b/.test(text)) values.vegetarian = 'none';
  if (scenario.id === 'track-a-delivery' && /\b(?:no|do not need|do not want) (?:a )?(?:confirmation|message|email)\b/.test(text)) values.confirmation = 'none';

  let nextStep = turnIndex;
  while (nextStep < model.stages.length && model.stages[nextStep]!.every(key => values[key])) nextStep++;
  const advanced = nextStep - turnIndex;
  const changed = Object.keys(values).some(key => values[key] !== (context.dialogue?.values ?? was)[key]);
  const answerText = applicableAnswers.filter(answer => !advanced || !answer.fills || !Object.keys(answer.fills).some(key => model.stages.slice(turnIndex, nextStep).flat().includes(key)))
    .map(answer => typeof answer.text === 'function' ? answer.text(renderValues()) : answer.text).join(' ');
  if (advanced) {
    const next = nextStep < model.stages.length ? questionFor(model, nextStep, values, true) : undefined;
    const message = next?.text ?? model.finish(renderValues());
    const combined = answerText && !message.includes(answerText) ? `${answerText} ${message}` : message;
    const authored = [...scenario.turns.map(item => ({ text: item.prompt, tamil: item.tamil })), { text: scenario.closing, tamil: scenario.closingTamil }].find(item => item.text === combined);
    return respond('advance', combined, { advanceBy: advanced, facts: (model.stages[nextStep] ?? []).filter(key => values[key]), ...(authored ? { tamil: authored.tamil } : {}) }, { values, ...(next?.pending ? { pending: next.pending } : {}) });
  }

  if (answerText) {
    // Preserve a pending yes/no offer through informational detours.
    const follow = context.offer && stock ? stock.offer : pending?.question ?? questionFor(model, turnIndex, values).text;
    return respond('answer', `${answerText} ${follow}`, preserve(), { values, ...(pending ? { pending } : {}) });
  }
  if (changed || bareYes && pending || shortNo && pending?.no) {
    const next = questionFor(model, turnIndex, values);
    const changedOld = Object.keys(values).some(key => context.dialogue?.values[key] && context.dialogue.values[key] !== values[key]);
    return respond('clarify', `${changedOld ? `Got it — I’ve updated that. ${summarizeDetails(scenario.id, values)} ` : ''}${next.text}`, {}, { values, ...(next.pending ? { pending: next.pending } : {}) });
  }
  if (bareYes || shortNo) {
    const next = questionFor(model, turnIndex, values);
    return respond('clarify', `All right. ${next.text}`, {}, { values, ...(next.pending ? { pending: next.pending } : {}) });
  }
  if (stock && turnIndex === 0 && !informationOnly) return respond('fallback', stock.offer, { offer: stock.id }, offerState(stock.id));
  const next = questionFor(model, turnIndex, values);
  const fallback = (context.fallbacks ?? 0) % 3;
  const lead = informationOnly ? 'I don’t have that information. ' : fallback === 0 ? '' : fallback === 1 ? 'Could you tell me a little more? ' : 'Sorry, I’m not sure what you mean yet. ';
  return respond('fallback', lead + next.text, {}, { values, ...(next.pending ? { pending: next.pending } : {}) });
}
