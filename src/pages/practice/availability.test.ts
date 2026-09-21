import { SCENARIOS } from './data';
import type { Scenario } from './data';
import { respondLocally } from './responseEngine';
import { INITIAL_SESSION, reduceSession } from './session';
import type { Session } from './session';

const order = SCENARIOS.find((item) => item.id === 'place-an-order')!;
const cafe = SCENARIOS.find((item) => item.id === 'order-at-a-cafe')!;
const send = (state: Session, text: string, scenario: Scenario = order): Session => reduceSession(scenario, reduceSession(scenario, state, { type: 'send', text }), { type: 'receive' });

describe('in-character availability replies', () => {
  it.each(['Do you have pens?', 'I want a laptop', 'I need 3 bouquets', 'I want some stickers please', 'Can I order headphones?', 'pen', 'red notebooks please', 'Can I buy blue notebooks and pencils?'])('offers notebooks for an unavailable request: %s', (text) => {
    const response = respondLocally(order, 0, text);
    expect(response.text).toBe('Sorry, we don’t have that. We only have blue notebooks. Would you like to order some?');
    expect(response.offer).toBe('notebooks');
    expect(response.advanceBy).toBe(0);
    expect(response.details).toEqual([]);
  });

  it.each(['What do you sell?', 'What is available?', 'What have you got?'])('answers an inventory question without claiming an item is missing: %s', (text) => {
    const response = respondLocally(order, 0, text);
    expect(response.text).toBe('We have blue notebooks available. Would you like to order some?');
    expect(response.kind).toBe('answer');
  });

  it.each(['yes', 'yes please', 'sure', 'go ahead', 'I will take them', 'yes I want to order', 'I would like some please'])('understands an offer acceptance: %s', (text) => {
    const offered = send(INITIAL_SESSION, 'Do you have pens?');
    const accepted = send(offered, text);
    expect(accepted.turn).toBe(1);
    expect(accepted.replies[1]?.response.text).toBe(order.turns[1]!.prompt);
    expect(accepted.replies[1]?.response.offer).toBeUndefined();
  });

  it('uses a quantity in an accepted offer, not one from the unavailable product', () => {
    const offered = send(INITIAL_SESSION, 'I would like two pens');
    expect(send(offered, 'yes').turn).toBe(1);
    expect(send(offered, 'two please').turn).toBe(2);
  });

  it('preserves the offer through a repeat or price question', () => {
    for (const followUp of ['repeat', 'How much?', 'thanks', 'help']) {
      const offered = send(INITIAL_SESSION, 'Can I buy pens?');
      const follow = send(offered, followUp);
      expect(follow.turn).toBe(0);
      expect(follow.replies[1]?.response.offer).toBe('notebooks');
      expect(send(follow, 'yes').turn).toBe(1);
    }
  });

  it('honours a refusal and does not treat a later yes as an old acceptance', () => {
    const offered = send(INITIAL_SESSION, 'Do you have pens?');
    const declined = send(offered, 'no thanks');
    expect(declined.turn).toBe(0);
    expect(declined.replies[1]?.response.text).toBe('No problem! Let me know if you’d like any blue notebooks later.');
    expect(declined.replies[1]?.response.offer).toBeUndefined();
    expect(send(declined, 'yes').turn).toBe(0);
    expect(send(INITIAL_SESSION, 'yes').turn).toBe(0);
  });

  it('does not advance another goal just because a later product offer was accepted', () => {
    const started = send(INITIAL_SESSION, 'Do you have blue notebooks?');
    const offered = send(started, 'Do you also have pens?');
    const accepted = send(offered, 'yes');
    expect(accepted.turn).toBe(1);
    expect(accepted.replies[2]?.response.text).toContain('How many notebooks');
  });

  it('offers the appropriate alternative at a café', () => {
    const offered = send(INITIAL_SESSION, 'A coffee please', cafe);
    expect(offered.replies[0]?.response.text).toBe('Sorry, we don’t have that. We’re serving tea today. Would you like a cup?');
    const accepted = send(offered, 'yes please', cafe);
    expect(accepted.turn).toBe(1);
    expect(accepted.replies[1]?.response.text).toBe(cafe.turns[1]!.prompt);
  });

  it('does not mistake supported orders, help, or delivery questions for missing products', () => {
    expect(respondLocally(order, 0, 'Could I buy a blue notebook?').kind).toBe('advance');
    expect(respondLocally(order, 0, 'Can I get delivery on Friday?').text).not.toContain('we don’t have that');
    expect(respondLocally(order, 0, 'I need help').kind).toBe('help');
    expect(respondLocally(order, 0, 'asdfgh').text).not.toContain('we don’t have that');
    expect(respondLocally(order, 0, 'yes I still want pens').advanceBy).toBe(0);
  });

  it('uses natural clarification language rather than training instructions', () => {
    for (const scenario of SCENARIOS) {
      for (const index of [0, 1, 2]) {
        const response = respondLocally(scenario, index, 'something unclear');
        expect(response.text).not.toMatch(/practic|scenario|goal|I can follow common phrases/i);
      }
    }
  });
});
