import { SCENARIOS } from './data';
import { INITIAL_SESSION, reduceSession } from './session';
import type { Session } from './session';

function chat(id: string, messages: readonly string[], initial = INITIAL_SESSION): Session {
  const scenario = SCENARIOS.find(item => item.id === id)!;
  return messages.reduce((state, text) => reduceSession(scenario, reduceSession(scenario, state, { type: 'send', text }), { type: 'receive' }), initial);
}
const response = (state: Session): string => state.replies[state.replies.length - 1]!.response.text;

describe('meaning, scope, and conversational repair', () => {
  it.each([
    'I cannot do 5 pm, 2 pm works for me',
    'Not 5 pm; I can do 2 pm',
    '5 pm was wrong, I meant 2 pm',
    'Make it 2 pm instead of 5 pm',
  ])('validates the selected time, not the rejected time: %s', message => {
    const state = chat('reschedule-a-meeting', ['Can we move our meeting?', message]);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.time).toBe('2 p.m.');
  });

  it.each(['2 pm or 4 pm', '2 pm and 4 pm', '2 pm, 4 pm'])('clarifies conflicting times without choosing: %s', message => {
    const state = chat('reschedule-a-meeting', ['Move our meeting please', message]);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.time).toBeUndefined();
    expect(response(state)).toMatch(/which|choose|one time/i);
  });

  it('keeps separate guest and night counts, with the duration mentioned first', () => {
    const state = chat('book-a-room', ['A room for 3 nights for 2 people, arriving Saturday']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values).toMatchObject({ guests: '2', nights: '3', arrival: 'saturday' });
  });

  it('understands a weekday range without mistaking checkout for arrival', () => {
    const state = chat('book-a-room', ['A room for two guests from Friday to Sunday']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values).toMatchObject({ guests: '2', arrival: 'friday', nights: '2' });
  });

  it('does not guess when two arrival dates are given', () => {
    const state = chat('book-a-room', ['Book for 2 people', 'Friday or Saturday for 3 nights']);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.arrival).toBeUndefined();
    expect(response(state)).toMatch(/which|choose/i);
  });

  it('keeps an explicit correction instead of the first number', () => {
    const state = chat('place-an-order', ['Two blue notebooks, sorry I meant five']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.quantity).toBe('5');
  });

  it.each([
    ['book-a-room', ['A room for 2 people', 'Friday for 2 nights'], 'What time is breakfast?', /breakfast.*(?:time|hours)|(?:time|hours).*breakfast/i, 'breakfast'],
    ['book-a-room', [], 'Where is breakfast served?', /(?:location|where).*breakfast|breakfast.*(?:location|where)/i, 'breakfast'],
    ['order-at-a-cafe', ['Tea please'], 'How much sugar is in the tea?', /ingredient|sugar/i, 'price'],
    ['resolve-a-damaged-delivery', [], 'When will I receive my refund?', /refund.*(?:processing|time)|(?:processing|time).*refund/i, 'deadline'],
    ['change-a-reservation', [], 'What time is breakfast?', /breakfast.*(?:time|hours)|(?:time|hours).*breakfast/i, 'cost'],
  ] as const)('answers the requested aspect, not just a matching noun in %s', (id, before, question, expected, absent) => {
    const state = chat(id, [...before, question]);
    expect(response(state)).toMatch(expected);
    expect(state.dialogue?.values[absent]).toBeUndefined();
    if (question.includes('refund')) expect(response(state)).not.toMatch(/replacement can arrive by Friday/);
    if (question.includes('sugar')) expect(response(state)).not.toMatch(/fifty rupees/);
  });

  it('handles an indirect information question without requiring exact wording', () => {
    const state = chat('book-a-room', ['I was wondering whether breakfast is included']);
    expect(response(state)).toMatch(/breakfast is included/);
    expect(state.dialogue?.values.guests).toBeUndefined();
  });

  it.each(['And the price?', 'Price?', 'Cost please'])('understands short context questions: %s', question => {
    const state = chat('place-an-order', ['2 blue notebooks please', question]);
    expect(response(state)).toMatch(/don’t have a notebook price/);
    expect(state.dialogue?.values.quantity).toBe('2');
    expect(state.turn).toBe(2);
  });

  it('answers both known questions in one message', () => {
    const state = chat('place-an-order', ['How much do notebooks cost and when will they arrive?']);
    expect(response(state)).toMatch(/price/);
    expect(response(state)).toMatch(/Friday/);
  });

  it('acknowledges an unanswered question instead of silently dropping it', () => {
    const state = chat('book-a-room', ['Is breakfast included and do you have a gym?']);
    expect(response(state)).toMatch(/breakfast is included/);
    expect(response(state)).toMatch(/(?:cannot|can’t|don’t|not).*gym|gym.*(?:cannot|can’t|don’t|not)/i);
  });

  it('does not treat a reported preference as a chosen order', () => {
    const state = chat('place-an-order', ['My friend wants 5 blue notebooks. I am just asking about the price']);
    expect(state.turn).toBe(0);
    expect(state.dialogue?.values.quantity).toBeUndefined();
    expect(response(state)).toMatch(/price/);
  });

  it.each(['I used to order 5 blue notebooks', 'I ordered 5 blue notebooks last week'])('does not turn an old order into a new purchase: %s', message => {
    const state = chat('place-an-order', [message]);
    expect(state.turn).toBe(0);
    expect(state.dialogue?.values.quantity).toBeUndefined();
  });

  it('understands a polite gerund request', () => {
    const state = chat('track-a-delivery', ['My order is late', '4821', 'Tomorrow afternoon', 'Would you mind sending me confirmation by email?']);
    expect(state.turn).toBe(3);
    expect(state.dialogue?.values.confirmation).toBe('email');
  });

  it('does not accept a confirmation with an unresolved condition', () => {
    const state = chat('place-an-order', ['2 blue notebooks', 'Yes, but only if delivery is free']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.arrival).toBeUndefined();
    expect(response(state)).toMatch(/(?:don’t|cannot|can’t|not).*delivery|delivery.*(?:don’t|cannot|can’t|not)/i);
  });

  it('does not silently choose among multiple quantities', () => {
    const state = chat('place-an-order', ['2 blue notebooks and 3 blue notebooks']);
    expect(state.dialogue?.values.quantity).toBeUndefined();
    expect(response(state)).toMatch(/how many|which|total/i);
  });

  it('does not invent a multi-room booking', () => {
    const state = chat('book-a-room', ['Book 2 rooms for 3 guests Friday for 2 nights']);
    expect(state.turn).toBeLessThan(2);
    expect(response(state)).toMatch(/(?:one|single|1) room|number of rooms/i);
  });

  it('clears a proposed revision when the user explicitly restores the original', () => {
    const state = chat('place-an-order', ['2 blue notebooks', 'yes', 'Actually make it 5', 'Actually keep it at 2']);
    expect(state.dialogue?.values.quantity).toBe('2');
    expect(state.dialogue?.pendingChange).toBeUndefined();
    expect(response(state)).toMatch(/original|previous|unchanged|kept/i);
  });

  it('handles correction and a question together after completion', () => {
    const state = chat('place-an-order', ['2 blue notebooks', 'yes', 'Actually 3 notebooks, sorry make it 4. When will they arrive?']);
    expect(state.dialogue?.values.quantity).toBe('2');
    expect(state.dialogue?.pendingChange?.quantity).toBe('4');
    expect(response(state)).toMatch(/Friday/);
    expect(response(state)).toMatch(/confirm/i);
  });

  it('never applies a quantity mentioned only in a follow-up question', () => {
    const state = chat('place-an-order', ['2 blue notebooks', 'yes', 'Can I change to 4 notebooks, and is there a discount for 10 notebooks?']);
    expect(state.dialogue?.values.quantity).toBe('2');
    expect(state.dialogue?.pendingChange?.quantity).toBe('4');
    expect(response(state)).toMatch(/discount/i);
  });

  it('does not reuse a stale proposed revision after a conflicting new request', () => {
    const state = chat('place-an-order', ['2 blue notebooks', 'yes', 'Make it 5', 'Actually 3 notebooks or 4 notebooks', 'yes']);
    expect(state.dialogue?.values.quantity).toBe('2');
    expect(state.dialogue?.pendingChange).toBeUndefined();
  });

  it('does not discard a pending change just because a different question starts with actually', () => {
    const state = chat('place-an-order', ['2 blue notebooks', 'yes', 'Make it 5', 'Actually how much is delivery?']);
    expect(state.dialogue?.pendingChange?.quantity).toBe('5');
    expect(response(state)).toMatch(/fee/);
  });

  it('accepts an explicit revision confirmation and answers a side question together', () => {
    const state = chat('place-an-order', ['2 blue notebooks', 'yes', 'Make it 5', 'Yes please. When will they arrive?']);
    expect(state.dialogue?.values.quantity).toBe('5');
    expect(state.dialogue?.pendingChange).toBeUndefined();
    expect(response(state)).toMatch(/Friday/);
  });

  it('does not interpret a time with and without pm as two choices', () => {
    const state = chat('reschedule-a-meeting', ['Move our meeting', '4, yes 4 pm please']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.time).toBe('4 p.m.');
  });

  it.each(['0', '-2', '2.5', '100', '1,000'])('validates a bare quantity in the context of the previous question: %s', message => {
    const state = chat('place-an-order', ['Blue notebooks please', message]);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.quantity).toBeUndefined();
    expect(response(state)).toMatch(/whole number|between 1 and 99/i);
  });

  it('does not overlook dietary requirements in a request instead of a question', () => {
    const state = chat('correct-a-food-order', ['I need the vegetarian pasta to be gluten free because I have an allergy']);
    expect(state.turn).toBe(0);
    expect(response(state)).toMatch(/can’t confirm.*cross-contact/);
  });

  it('does not claim an unverified hotel amenity is part of a booking', () => {
    const state = chat('book-a-room', ['Book a room for 2 people with a balcony Friday for 2 nights']);
    expect(state.turn).toBe(0);
    expect(response(state)).toMatch(/don’t have.*balcony/);
  });

  it('keeps distinct questions distinct when one is answered and one is unknown', () => {
    const state = chat('book-a-room', ['What time is breakfast, and is it included?']);
    expect(response(state)).toMatch(/breakfast serving times/);
    expect(response(state)).toMatch(/breakfast is included/);
  });

  it('does not turn a question about later availability into a chosen later slot', () => {
    const state = chat('reschedule-a-meeting', ['Move our meeting', 'Is the later one available?']);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.time).toBeUndefined();
    expect(response(state)).toMatch(/2 p.m. or 4 p.m./);
  });

  it('asks for a concrete choice when a request is conditional on an unknown fact', () => {
    const state = chat('book-a-room', ['Book a room for two people if there is a gym']);
    expect(state.turn).toBe(0);
    expect(state.dialogue?.values.guests).toBeUndefined();
    expect(response(state)).toMatch(/don’t have.*gym/);
  });

  it('retains the subject across a short follow-up question', () => {
    const state = chat('book-a-room', ['What time is breakfast?', 'Is it included?']);
    expect(response(state)).toMatch(/breakfast is included/);
    expect(state.dialogue?.values.guests).toBeUndefined();
  });

  it('does not bypass a group-size limit with an unrelated correction', () => {
    const state = chat('plan-a-group-dinner', ['8 guests Friday 7 pm together, actually send an email']);
    expect(state.turn).toBe(0);
    expect(state.dialogue?.values.guests).not.toBe('8');
    expect(response(state)).toMatch(/twelve people/);
  });

  it('validates an old constraint even when another field is corrected', () => {
    const state = chat('plan-a-group-dinner', ['8 guests Saturday 7 pm together, actually Friday']);
    expect(state.turn).toBe(0);
    expect(state.dialogue?.values.guests).not.toBe('8');
    expect(response(state)).toMatch(/twelve people/);
  });

  it('allows a correction to an unavailable slot in the same request', () => {
    const state = chat('reschedule-a-meeting', ['Move the meeting to 5 pm, actually 2 pm']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.time).toBe('2 p.m.');
  });

  it('retains a real question even when the same reply includes a greeting', () => {
    const state = chat('meet-a-colleague', ['Hi, my name is Leena, what department are you in?']);
    expect(state.dialogue?.values.name).toBe('Leena');
    expect(state.turn).toBe(2);
    expect(response(state)).toMatch(/design team/);
  });

  it('retains missing details when an advanced scenario is answered out of order', () => {
    const state = chat('negotiate-a-deadline', [
      'The data arrives Wednesday so there is not enough review time',
      'The final report Monday, and I can send a draft Thursday',
      'I will explain the impact, and I will flag unresolved issues',
    ]);
    expect(state.turn).toBe(3);
    expect(response(state)).toMatch(/draft on Thursday, final report on Monday/);
  });

  it('answers an amenity question without losing the room-change confirmation', () => {
    const state = chat('handle-a-booking-mixup', [
      'H204 under Kumar', 'Quiet room at the same rate', 'Does it have a balcony?', 'Yes',
    ]);
    expect(state.replies[2]?.response.text).toMatch(/don’t have.*balcony/);
    expect(state.turn).toBe(3);
  });
});
