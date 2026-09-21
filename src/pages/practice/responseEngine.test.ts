import { SCENARIOS } from './data';
import type { Scenario } from './data';
import { normalizeMessage, respondLocally } from './responseEngine';
import type { LocalResponse } from './responseEngine';
import { DIALOGUE_MODELS } from './dialogueModel';
import { INITIAL_SESSION, reduceSession } from './session';

const scenarioFor = (id: string): Scenario => SCENARIOS.find((scenario) => scenario.id === id)!;
const reply = (id: string, turn: number, text: string): LocalResponse => respondLocally(scenarioFor(id), turn, text);

export const NATURAL_CONVERSATIONS: readonly (readonly [string, readonly string[]])[] = [
  ['place-an-order', ['Could I buy a notebook in blue?', 'A pair please', 'Can you tell me the delivery date?']],
  ['meet-a-colleague', ['Hello, my name is Arun', 'What department are you in?', 'Where is the conference room?']],
  ['book-a-room', ['Can we reserve accommodation for 2 guests?', 'Friday for 2 nights please', 'Does the price cover breakfast?']],
  ['order-at-a-cafe', ['Tea please', 'Small and to go please', 'What does it cost?']],
  ['track-a-delivery', ['My parcel is late', 'The reference is 4821', 'Please text me confirmation for tomorrow afternoon']],
  ['reschedule-a-meeting', ['Could we move our meeting?', '2 pm works for me', 'I will update the invite, thanks']],
  ['change-a-reservation', ['Booking name Priya, can I extend by 1 night?', 'What is the revised price?', 'Send me confirmation by email please']],
  ['correct-a-food-order', ['This chicken is not what I ordered. I asked for vegetarian pasta', 'When will the replacement arrive?', 'No problem, thanks']],
  ['resolve-a-damaged-delivery', ['My lamp has a broken base and I have pictures', 'By Friday please, otherwise give me my money back', 'Please email details of both delivery and collection']],
  ['negotiate-a-deadline', ['Our data only comes on Wednesday so Thursday is too soon', 'Draft Thursday, final reviewed report Monday', 'I will list the risks and explain their impact']],
  ['handle-a-booking-mixup', ['Can you look up H204 under Kumar?', 'I need a peaceful room at the original rate', 'Keep the price unchanged and update the reservation']],
  ['plan-a-group-dinner', ['12 guests Friday 7 pm. We want to sit together', 'Tables next to each other are fine. Are vegetarian meals available?', 'Please confirm by email and include the menu']],
];

describe('local response engine', () => {
  it('has three goal rules for each of the twelve scenarios', () => {
    expect(Object.keys(DIALOGUE_MODELS).sort()).toEqual(SCENARIOS.map((item) => item.id).sort());
    for (const scenario of SCENARIOS) expect(DIALOGUE_MODELS[scenario.id]?.stages).toHaveLength(scenario.turns.length);
  });

  it.each(NATURAL_CONVERSATIONS)('handles natural wording for all goals in %s', (id, texts) => {
    texts.forEach((text, index) => {
      const result = reply(id, index, text);
      expect({ text, kind: result.kind }).toEqual({ text, kind: 'advance' });
      expect(result.advanceBy).toBe(1);
      expect(result.text.length).toBeGreaterThan(15);
      expect(result.text).not.toMatch(/undefined|\[object Object\]/);
    });
  });

  it.each(SCENARIOS.map((item) => [item.id, item] as const))('supports authored replies and preserves exact feedback where a correction is appropriate in %s', (_id, scenario) => {
    scenario.turns.forEach((turn, index) => turn.choices.forEach((choice, choiceIndex) => {
      const result = respondLocally(scenario, index, choice.text);
      if (choiceIndex === turn.answer) expect(result.kind).toBe('advance');
      // Some old distractors are valid questions or alternate orders. Those
      // now receive a conversational response rather than a quiz rejection.
      if (result.kind === 'correction') expect(result.tip).toBe(choice.feedback);
      expect(result.text).not.toMatch(/undefined|\[object Object\]/);
    }));
  });

  it('normalizes contractions, numbers, common shortcuts, and punctuation', () => {
    expect(normalizeMessage('I’d like TWO notebooks, pls!')).toBe('i would like 2 notebooks please');
    expect(normalizeMessage("I can't arrive at 2:00 p.m.")).toBe('i cannot arrive at 2 pm');
    expect(reply('place-an-order', 0, 'Can I buy blue noteboks please?').kind).toBe('advance');
    expect(reply('book-a-room', 2, 'Is breakfst part of the price?').kind).toBe('advance');
  });

  it('remembers a partial reply and asks only for the missing detail', () => {
    const scenario = scenarioFor('book-a-room');
    let state = INITIAL_SESSION;
    for (const text of ['I want to book a room', 'hello', 'two people']) {
      state = reduceSession(scenario, state, { type: 'send', text });
      state = reduceSession(scenario, state, { type: 'receive' });
    }
    expect(state.turn).toBe(1);
    expect(state.replies[0]?.response.text).toContain('How many people');
    expect(state.replies[1]?.response.kind).toBe('social');
    state = reduceSession(scenario, state, { type: 'send', text: 'Friday' });
    state = reduceSession(scenario, state, { type: 'receive' });
    expect(state.replies[3]?.response.text).toContain('How long');
    state = reduceSession(scenario, state, { type: 'send', text: 'two nights' });
    state = reduceSession(scenario, state, { type: 'receive' });
    expect(state.turn).toBe(2);
  });

  it('uses details already supplied instead of asking the same question again', () => {
    const order = reply('place-an-order', 0, 'I need two blue notebooks please');
    expect(order.advanceBy).toBe(2);
    expect(order.text).toContain('Shall I arrange delivery');
    const cafe = reply('order-at-a-cafe', 0, 'A small tea to go please');
    expect(cafe.advanceBy).toBe(2);
    expect(cafe.text).toContain('Anything else');
    const hotel = reply('book-a-room', 0, 'Book a room for two people arriving Friday');
    expect(hotel.advanceBy).toBe(1);
    expect(hotel.facts).toEqual(['arrival']);
    expect(hotel.text).toContain('How long');
    expect(hotel.tamil).toBeUndefined();
  });

  it('does not confuse a number of guests with a number of nights', () => {
    const needsGuests = reply('book-a-room', 0, 'Book a room for 2 nights');
    expect(needsGuests.kind).toBe('clarify');
    expect(needsGuests.text).toContain('How many people');
    const scenario = scenarioFor('book-a-room');
    const first = respondLocally(scenario, 0, 'Book a room please');
    const guests = respondLocally(scenario, 0, '2', { facts: first.facts, details: first.details, lastResponse: first.text });
    expect(guests.kind).toBe('advance');
    expect(guests.facts).toEqual([]);
    const friday = respondLocally(scenario, 1, 'Friday');
    const nights = respondLocally(scenario, 1, '2', { facts: friday.facts, lastResponse: friday.text });
    expect(nights.kind).toBe('advance');
  });

  it('carries relevant early details across partial messages, but not a refusal', () => {
    const scenario = scenarioFor('place-an-order');
    let state = INITIAL_SESSION;
    for (const text of ['two notebooks', 'blue']) {
      state = reduceSession(scenario, state, { type: 'send', text });
      state = reduceSession(scenario, state, { type: 'receive' });
    }
    expect(state.turn).toBe(2);
    expect(state.facts).toEqual([]);
    expect(state.details).toEqual([]);
  });

  it('understands yes only when it answers a specific confirmation question', () => {
    const scenario = scenarioFor('track-a-delivery');
    const partial = respondLocally(scenario, 2, 'Tomorrow afternoon please');
    expect(partial.kind).toBe('clarify');
    const answer = respondLocally(scenario, 2, 'yes', { facts: partial.facts, details: partial.details, lastResponse: partial.text });
    expect(answer.kind).toBe('advance');
    expect(reply('book-a-room', 1, 'yes').kind).toBe('clarify');
    expect(reply('correct-a-food-order', 1, 'Yes please, how long will I need to wait?').advanceBy).toBe(1);
  });

  it.each([
    ['place-an-order', 0, 'I do not want blue notebooks'],
    ['place-an-order', 0, 'I dont want to buy blue notebooks'],
    ['place-an-order', 0, 'No blue notebooks please'],
    ['place-an-order', 0, 'I am not buying blue notebooks'],
    ['track-a-delivery', 1, 'Order 1234'],
    ['reschedule-a-meeting', 1, '2 am please'],
    ['reschedule-a-meeting', 1, '2:30 pm works for me'],
    ['meet-a-colleague', 0, 'I am not Arun'],
    ['negotiate-a-deadline', 1, 'Final on Thursday, draft Monday'],
    ['handle-a-booking-mixup', 0, 'Reference H999 under Kumar'],
    ['handle-a-booking-mixup', 2, 'Please do not update my reservation, even at the same rate'],
    ['plan-a-group-dinner', 0, 'Book for 8 people Friday 7 pm, together'],
    ['plan-a-group-dinner', 0, '12 people Friday 7:30 pm, all together'],
  ] as const)('does not advance a contradictory reply in %s: %s, %s', (id, turn, text) => {
    expect(reply(id, turn, text).advanceBy).toBe(0);
  });

  it('responds to small talk, help, repetition, and known side questions', () => {
    expect(reply('book-a-room', 0, 'hello').kind).toBe('social');
    expect(reply('book-a-room', 0, 'thanks').kind).toBe('social');
    expect(reply('book-a-room', 0, 'bye').kind).toBe('social');
    expect(reply('book-a-room', 0, 'help').text).toContain('You could say');
    expect(reply('book-a-room', 0, 'Can you help me book a room for two people?').kind).toBe('advance');
    expect(reply('book-a-room', 0, 'Is breakfast included?').text).toContain('Yes, breakfast is included');
    expect(reply('order-at-a-cafe', 0, 'How much does tea cost?').kind).toBe('answer');
    const repeated = respondLocally(scenarioFor('book-a-room'), 0, 'say that again', { facts: [], lastResponse: 'How many guests?' });
    expect(repeated.text).toBe('How many guests?');
  });

  it('does not invent prices or translate a free-form learner message as a sample reply', () => {
    const result = reply('book-a-room', 0, 'What is the room price?');
    expect(result.text).toContain('don’t have a room rate to quote');
    expect(result.advanceBy).toBe(0);
    expect(reply('place-an-order', 0, 'Could I get a blue notebook?').choice).toBeNull();
  });

  it('uses honest, varied fallbacks for unknown text and supports a Tamil-language hint', () => {
    expect(reply('book-a-room', 0, 'வணக்கம்').kind).toBe('help');
    const responses = [0, 1, 2].map((fallbacks) => respondLocally(scenarioFor('book-a-room'), 0, 'tell me about the moon', { facts: [], fallbacks }));
    expect(new Set(responses.map((item) => item.text)).size).toBe(3);
    expect(responses.every((item) => item.advanceBy === 0)).toBe(true);
    expect(reply('place-an-order', 0, '<script>alert(1)</script>').kind).toBe('fallback');
  });
});
