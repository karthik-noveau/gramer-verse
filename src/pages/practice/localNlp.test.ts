import { prepareEnglish, englishSentences, politeRequest, isPastPurchase } from './localNlp';
import { normalizeMessage } from './responseEngine';
import { SCENARIOS } from './data';
import { INITIAL_SESSION, reduceSession } from './session';
import type { Session } from './session';

function chat(id: string, messages: readonly string[]): Session {
  const scenario = SCENARIOS.find(item => item.id === id)!;
  return messages.reduce((state, text) => reduceSession(scenario, reduceSession(scenario, state, { type: 'send', text }), { type: 'receive' }), INITIAL_SESSION);
}

describe('Compromise language adapter (real library, no mocks)', () => {
  it.each([
    ['I’d like twenty-three blue notebooks', 'I would like 23 blue notebooks'],
    ['one hundred and five notebooks', '105 notebooks'],
    ['two and a half notebooks', '2.5 notebooks'],
    ['negative two notebooks', '-2 notebooks'],
  ])('normalizes words without throwing away number meaning: %s', (input, expected) => {
    expect(prepareEnglish(input)).toBe(expected);
  });

  it.each(['H204', '4821', '04821', '2:30 p.m.', 'the first one', 'the second option'])('keeps literal references, times, and ordinals intact: %s', input => {
    expect(prepareEnglish(input)).toBe(input);
  });

  it('preserves negation when the library expands contractions', () => {
    expect(normalizeMessage('I can’t wait')).toBe('i cannot wait');
    expect(normalizeMessage('I couldn’t attend')).toBe('i could not attend');
    expect(normalizeMessage('We shouldn’t book')).toBe('we should not book');
  });

  it('keeps abbreviations inside the correct sentence', () => {
    expect(englishSentences('Dr. Meera will arrive at 2 p.m. Could you send confirmation?')).toEqual([
      'Dr. Meera will arrive at 2 p.m.', 'Could you send confirmation?',
    ]);
  });

  it.each([
    ['would you mind rescheduling our meeting', 'could you reschedule our meeting'],
    ['would you mind extending my stay', 'could you extend my stay'],
    ['would you mind delivering it tomorrow', 'could you deliver it tomorrow'],
    ['would you mind not updating the invitation', 'could you not update the invitation'],
  ])('uses the library to interpret a polite verb form: %s', (input, expected) => {
    expect(politeRequest(input)).toBe(expected);
  });

  it.each(['i bought 2 notebooks', 'i have already purchased 2 notebooks', 'i was ordering 2 notebooks'])('recognizes a completed or past purchase: %s', input => {
    expect(isPastPurchase(input)).toBe(true);
  });

  it.each(['i want 2 notebooks', 'i would like to order', 'please order again', 'could i buy a notebook'])('does not classify a current request as a past purchase: %s', input => {
    expect(isPastPurchase(input)).toBe(false);
  });
});

describe('Compromise is used by the live conversation engine', () => {
  it.each(['one hundred and five blue notebooks', 'one hundred blue notebooks', 'two and a half blue notebooks', 'negative two blue notebooks'])('rejects unsupported counts instead of extracting a smaller number: %s', message => {
    const state = chat('place-an-order', [message]);
    expect(state.turn).toBeLessThan(2);
    expect(state.dialogue?.values.quantity).toBeUndefined();
    expect(state.replies.at(-1)?.response.text).toMatch(/whole number|between 1 and 99/);
  });

  it('validates a spelled fractional reply to the current quantity question', () => {
    const state = chat('place-an-order', ['Blue notebooks please', 'two and a half']);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.quantity).toBeUndefined();
    expect(state.replies.at(-1)?.response.text).toMatch(/whole number/);
  });

  it('understands polite rescheduling without a hand-written gerund alias', () => {
    const state = chat('reschedule-a-meeting', ['Would you mind rescheduling our meeting?', 'four p.m.', 'yes']);
    expect(state.turn).toBe(3);
    expect(state.dialogue?.values.time).toBe('4 p.m.');
  });

  it('understands polite booking extensions', () => {
    const state = chat('change-a-reservation', ['Under Priya. Would you mind extending my stay by one night?']);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.night).toBe('1');
  });

  it('does not erase a negative polite request', () => {
    const state = chat('reschedule-a-meeting', ['Move our meeting', '2 pm', 'Would you mind not updating the invitation?']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.invitation).toBeUndefined();
  });

  it.each(['I bought two blue notebooks', 'I have already purchased two blue notebooks'])('does not create a new order from a past-tense statement: %s', message => {
    const state = chat('place-an-order', [message]);
    expect(state.turn).toBe(0);
    expect(state.dialogue?.values.quantity).toBeUndefined();
  });

  it('does not block past events in a complaint scenario', () => {
    const state = chat('correct-a-food-order', ['I ordered vegetarian pasta, not chicken']);
    expect(state.turn).toBe(1);
  });

  it('handles the new request separately from the old purchase', () => {
    const state = chat('place-an-order', ['I bought two notebooks. I would like to order three blue notebooks now']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.quantity).toBe('3');
  });

  it('does not advance a partial invalid order on a past-purchase statement', () => {
    const state = chat('place-an-order', ['one hundred and five blue notebooks', 'I bought two blue notebooks']);
    expect(state.turn).toBe(0);
    expect(state.dialogue?.values.quantity).toBeUndefined();
    expect(state.replies.at(-1)?.response.text).toMatch(/earlier purchase/);
  });
});
