import { SCENARIOS } from './data';
import { DIALOGUE_MODELS } from './dialogueModel';
import { INITIAL_SESSION, reduceSession } from './session';
import type { Session } from './session';
import { respondLocally } from './responseEngine';
import type { Scenario } from './data';
import type { LocalResponse } from './responseEngine';

const scenario = (id: string): Scenario => SCENARIOS.find(item => item.id === id)!;
function chat(id: string, messages: readonly string[], initial: Session = INITIAL_SESSION): Session {
  return messages.reduce((state, text) => reduceSession(scenario(id), reduceSession(scenario(id), state, { type: 'send', text }), { type: 'receive' }), initial);
}
const last = (state: Session): LocalResponse => state.replies[state.replies.length - 1]!.response;

describe('stateful, scenario-aware conversation', () => {
  it('has a complete conversation model for every scenario', () => {
    expect(Object.keys(DIALOGUE_MODELS).sort()).toEqual(SCENARIOS.map(item => item.id).sort());
    for (const model of Object.values(DIALOGUE_MODELS)) {
      expect(model.stages).toHaveLength(3);
      for (const key of model.stages.flat()) expect(model.fields.some(field => field.key === key)).toBe(true);
    }
  });

  it.each([
    ['place-an-order', ['Do you sell pencils?', 'yes please', 'How much?', '3 please', 'When will they arrive?'], { quantity: '3' }, /Friday/],
    ['meet-a-colleague', ['Hi, I am Karthik', 'What do you do?', 'yes please'], { name: 'Karthik' }, /down the hall/],
    ['book-a-room', ['A room please', 'three guests', 'Saturday', 'four nights', 'Is breakfast included?'], { guests: '3', arrival: 'saturday', nights: '4' }, /3 guests.*Saturday.*4 nights/],
    ['order-at-a-cafe', ['Can I get a coffee?', 'sure', 'large', 'for here', 'How much?'], { size: 'large', takeaway: 'for here' }, /don’t have a confirmed price/],
    ['track-a-delivery', ['My package has not arrived', '4821', 'morning please', 'yes'], { period: 'morning' }, /tomorrow morning/],
    ['reschedule-a-meeting', ['I am busy tomorrow morning', '4 pm please', 'yes'], { time: '4 p.m.' }, /4 p.m./],
    ['change-a-reservation', ['Can I add another night?', 'Priya', 'How much?', 'yes'], { night: '1' }, /extended by one night/],
    ['correct-a-food-order', ['I ordered vegetarian pasta, not chicken', 'yes', 'yes'], { vegetarian: 'yes' }, /vegetarian pasta/],
    ['resolve-a-damaged-delivery', ['My lamp is broken', 'yes', 'Friday', 'yes', 'yes'], { deadline: 'friday', photos: 'yes' }, /Friday.*collection/],
    ['negotiate-a-deadline', ['The data arrives Wednesday. Thursday is too soon', 'I can share a draft Thursday and the final Monday', 'yes', 'yes'], { impact: 'yes' }, /draft on Thursday.*Monday/],
    ['handle-a-booking-mixup', ['H204', 'Kumar', 'I need a quiet room', 'yes', 'yes'], { quiet: 'yes' }, /rate is unchanged/],
    ['plan-a-group-dinner', ['12 people', 'Friday', '7 pm', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'], { guests: '12', vegetarian: 'yes' }, /12 people.*Friday.*7 p.m./],
  ] as const)('completes a realistic branching conversation: %s', (id, messages, values, ending) => {
    const state = chat(id, messages);
    expect({ turn: state.turn, reply: last(state).text, values: state.dialogue?.values }).toEqual({ turn: 3, reply: expect.stringMatching(ending), values: expect.objectContaining(values) });
  });

  it.each([
    ['place-an-order', 'How much are blue notebooks?', /price/],
    ['meet-a-colleague', 'What is your name?', /Maya/],
    ['book-a-room', 'Is breakfast included?', /breakfast is included/],
    ['order-at-a-cafe', 'Do you have small or large sizes?', /small and large/],
    ['track-a-delivery', 'Why is my order late?', /courier was delayed/],
    ['reschedule-a-meeting', 'What time are you free?', /2 p.m. or 4 p.m./],
    ['change-a-reservation', 'What will the extra night cost?', /six thousand/],
    ['correct-a-food-order', 'How long does a replacement take?', /ten minutes/],
    ['resolve-a-damaged-delivery', 'When can a replacement arrive?', /Friday/],
    ['negotiate-a-deadline', 'Why does the client need it early?', /early update/],
    ['handle-a-booking-mixup', 'Will the alternative cost more?', /no extra charge/i],
    ['plan-a-group-dinner', 'Are there vegetarian options?', /vegetarian dishes/],
  ] as const)('answers side questions without treating them as commitments: %s', (id, question, answer) => {
    const state = chat(id, [question]);
    expect(state.turn).toBe(0);
    expect(last(state).text).toMatch(answer);
  });

  it('keeps changed details and does not resurrect the old quantity', () => {
    let state = chat('place-an-order', ['I want 2 blue notebooks', 'Actually make it 4 notebooks']);
    expect(state.dialogue?.values.quantity).toBe('4');
    expect(last(state).advanceBy).toBe(0);
    state = chat('place-an-order', ['repeat', 'thanks', 'When will they arrive?'], state);
    expect(state.turn).toBe(3);
    expect(state.dialogue?.values.quantity).toBe('4');
  });

  it('remembers multiple details and answers in a mixed request/question', () => {
    const state = chat('book-a-room', ['I need a room for 3 people on Saturday for 4 nights. Is breakfast included?']);
    expect(state.turn).toBe(3);
    expect(last(state).text).toMatch(/breakfast is included.*3 guests.*Saturday.*4 nights/);
  });

  it('answers more than one question in the same message', () => {
    const state = chat('book-a-room', ['Is breakfast included, and what is the room price?']);
    expect(last(state).text).toMatch(/breakfast is included/);
    expect(last(state).text).toMatch(/don’t have a room rate/);
    expect(state.turn).toBe(0);
  });

  it.each(['help', 'repeat', 'thanks', 'How much does it cost?', 'hello'])('preserves an offer through the detour: %s', (detour) => {
    const state = chat('place-an-order', ['Do you have pens?', detour, 'yes']);
    expect(state.turn).toBe(1);
    expect(last(state).text).toMatch(/How many/);
  });

  it('does not discard existing order details for an unavailable add-on', () => {
    const state = chat('place-an-order', ['I want 3 blue notebooks', 'Do you have pens too?', 'no thanks', 'When will the notebooks arrive?']);
    expect(state.dialogue?.values.quantity).toBe('3');
    expect(state.turn).toBe(3);
  });

  it.each([
    ['reschedule-a-meeting', ['Can we move the meeting?', '2 am'], /2 p.m. or 4 p.m./],
    ['track-a-delivery', ['My order is late', '1234'], /can’t find 1234/],
    ['handle-a-booking-mixup', ['H999 under Kumar'], /can’t find H999/],
  ] as const)('does not approve unsupported details: %s', (id, messages, clarification) => {
    const state = chat(id, messages);
    expect(last(state).advanceBy).toBe(0);
    expect(last(state).text).toMatch(clarification);
  });

  it('understands yes to a specific alternative, rather than looping on it', () => {
    const state = chat('change-a-reservation', ['I have a booking under Priya. Can I add 3 nights?', 'yes']);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.night).toBe('1');
  });

  it('does not interpret rejection as agreement', () => {
    const state = chat('place-an-order', ['Do you sell pens?', 'no thanks', 'yes']);
    expect(state.turn).toBe(0);
    expect(last(state).advanceBy).toBe(0);
  });

  it('does not continue a cancelled conversation on a stray yes', () => {
    const state = chat('book-a-room', ['Book a room for 2 guests', 'Cancel my booking', 'yes']);
    expect(state.turn).toBe(1);
    expect(last(state).advanceBy).toBe(0);
    expect(state.dialogue?.suspended).toBe(true);
  });

  it.each([
    ['place-an-order', 'I do not want blue notebooks'],
    ['place-an-order', 'No blue notebooks please'],
    ['order-at-a-cafe', 'I do not want tea'],
    ['meet-a-colleague', 'I am not Arun'],
    ['handle-a-booking-mixup', 'Do not update the reservation'],
    ['plan-a-group-dinner', 'Please do not confirm the booking'],
  ] as const)('does not turn negation into an order or identity: %s', (id, text) => {
    expect(last(chat(id, [text])).advanceBy).toBe(0);
  });

  it('accepts no for optional confirmation instead of demanding an email', () => {
    const state = chat('track-a-delivery', ['My parcel is late', '4821', 'tomorrow morning', 'no']);
    expect(state.turn).toBe(3);
    expect(last(state).text).toMatch(/No confirmation message/);
  });

  it('does not invent allergy safety or an unknown policy', () => {
    expect(last(chat('correct-a-food-order', ['Does the pasta contain nuts?'])).text).toMatch(/can’t confirm.*cross-contact/);
    expect(last(chat('book-a-room', ['What is the cancellation policy?'])).text).toMatch(/don’t have/);
    expect(last(chat('plan-a-group-dinner', ['Is the food safe for my nut allergy?'])).text).toMatch(/can’t confirm allergy-safe/);
  });

  it.each(SCENARIOS.map(item => item.id))('handles help, repetition, uncertainty and small talk in %s', id => {
    const state = chat(id, ['hello', 'help', 'repeat', 'What is the capital of France?', 'thanks']);
    expect(state.turn).toBe(0);
    expect(state.replies[1]!.response.text).toBe(state.replies[2]!.response.text);
    expect(state.replies[3]!.response.text).toMatch(/don’t have that information/);
    expect(last(state).text).toMatch(/welcome/);
  });

  it('never mutates the caller’s dialogue state', () => {
    const state = chat('place-an-order', ['I want 2 blue notebooks']);
    const before = JSON.stringify(state);
    respondLocally(scenario('place-an-order'), state.turn, 'Actually 4 notebooks', { facts: state.facts, dialogue: state.dialogue! });
    expect(JSON.stringify(state)).toBe(before);
  });

  it('handles a refund preference without promising a replacement or an approved refund', () => {
    const state = chat('resolve-a-damaged-delivery', ['The lamp is broken and I have photos', 'I want a refund instead', 'yes']);
    expect(state.turn).toBe(3);
    expect(last(state).text).toMatch(/request for a refund/);
    expect(last(state).text).not.toMatch(/replacement delivery|refund (?:approved|sent|processed)/);
  });

  it('accepts a normal end to a café order instead of pushing another question', () => {
    const state = chat('order-at-a-cafe', ['A small tea to take away please', 'no thanks']);
    expect(state.turn).toBe(3);
    expect(last(state).text).toMatch(/fifty rupees/);
  });

  it('does not accept an order reference as a substring of a different number', () => {
    const state = chat('track-a-delivery', ['My order is late', '14821']);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.reference).toBeUndefined();
  });

  it('handles a correction and question without relying on punctuation', () => {
    const state = chat('place-an-order', ['I want two blue notebooks', 'actually make it four how much does that cost']);
    expect(state.dialogue?.values.quantity).toBe('4');
    expect(last(state).text).toMatch(/don’t have a notebook price/);
  });

  it('does not pre-fill a promised final report from an inability to finish it', () => {
    const state = chat('negotiate-a-deadline', ['The data arrives Wednesday. I cannot complete the final report by Thursday']);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.final).toBeUndefined();
    expect(state.dialogue?.values.thursday).toBeUndefined();
  });

  it('does not push a replacement after the diner cannot wait', () => {
    const state = chat('correct-a-food-order', ['I ordered vegetarian pasta', 'How long will it take?', 'I cannot wait ten minutes']);
    expect(state.turn).toBe(2);
    expect(last(state).text).toMatch(/hold the replacement/);
  });

  it.each(['yes, three notebooks please', 'sure, I will take 3', 'okay, 3 please'])('accepts an offer and its quantity in one reply: %s', text => {
    const state = chat('place-an-order', ['Do you have pens?', text]);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.quantity).toBe('3');
  });

  it('uses the latest stated details in a correction', () => {
    const state = chat('book-a-room', ['Book a room for two guests', 'Friday. Actually Saturday for 3 nights']);
    expect(state.dialogue?.values.arrival).toBe('saturday');
    expect(last(state).text).toMatch(/Saturday/);
  });
});
