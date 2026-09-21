import { SCENARIOS } from './data';
import { INITIAL_SESSION, reduceSession } from './session';
import type { Session } from './session';

function chat(id: string, messages: readonly string[], initial = INITIAL_SESSION): Session {
  const scenario = SCENARIOS.find(item => item.id === id)!;
  return messages.reduce((state, text) => reduceSession(scenario, reduceSession(scenario, state, { type: 'send', text }), { type: 'receive' }), initial);
}
const response = (state: Session): string => state.replies[state.replies.length - 1]!.response.text;

describe('natural language and conversational context', () => {
  it.each([
    ['place-an-order', ['I was hoping to purchase blue notebooks', 'a couple of those', 'Any idea when they will get here?'], { quantity: '2' }],
    ['meet-a-colleague', ['You can call me Sara', 'Tell me about your department', 'Could you point me to the conference room?'], { name: 'Sara' }],
    ['book-a-room', ['Looking to reserve a room for the two of us', 'This Saturday, for a couple of nights', 'Does that come with breakfast?'], { guests: '2', nights: '2', arrival: 'saturday' }],
    ['order-at-a-cafe', ['May I get a cuppa?', 'the smaller one', 'I will take it with me', 'What do I owe you?'], { size: 'small', takeaway: 'to take away' }],
    ['track-a-delivery', ['My parcel still has not turned up', 'The order number is 4821', 'the later slot', 'a text would be great'], { period: 'afternoon', confirmation: 'message' }],
    ['reschedule-a-meeting', ['Something came up. Can we push our meeting back?', 'the latter', 'I will resend the calendar invite'], { time: '4 p.m.' }],
    ['change-a-reservation', ['The reservation is in the name of Priya. Any chance I could stay one more night?', 'What would that come to?', 'Please mail me the updated confirmation'], { night: '1' }],
    ['correct-a-food-order', ['This is not what I asked for. I asked for pasta without meat', 'How soon can you have it ready?', 'That is okay with me'], { vegetarian: 'yes' }],
    ['resolve-a-damaged-delivery', ['The lamp arrived smashed. I took some pictures', 'I need it by Friday or I would like my money back', 'Please put both the drop off and pick up details in writing'], { deadline: 'friday' }],
    ['negotiate-a-deadline', ['The figures only get here on Wednesday. There is too little time for the review', 'I can send a preliminary version Thursday and the finished report Monday', 'I will call out the open issues and their consequences'], { impact: 'yes' }],
    ['handle-a-booking-mixup', ['The reference is H204, in the name of Kumar', 'Somewhere peaceful, without paying any more', 'Sounds good to me, please amend the booking and tell me when it is ready'], { quiet: 'yes' }],
    ['plan-a-group-dinner', ['A table for a dozen colleagues on Friday at seven in the evening. We want to sit together', 'Side by side is fine. Any meat free dishes?', 'Go ahead and email the confirmation along with the menu'], { guests: '12' }],
  ] as const)('understands indirect and colloquial wording in %s', (id, messages, values) => {
    const state = chat(id, messages);
    expect({ turn: state.turn, text: response(state), values: state.dialogue?.values }).toEqual({ turn: 3, text: expect.any(String), values: expect.objectContaining(values) });
  });

  it('resolves the second option after an unrelated information question', () => {
    const state = chat('reschedule-a-meeting', ['Can we move the meeting?', 'Why?', 'the second one']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.time).toBe('4 p.m.');
  });

  it.each(['maybe two or three', 'I am not sure yet', 'either two or four', 'around three I guess', 'Possibly three', 'I might buy four'])('clarifies uncertainty without silently choosing a quantity: %s', text => {
    const state = chat('place-an-order', ['Blue notebooks please', text]);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.quantity).toBeUndefined();
    expect(response(state)).toMatch(/choose|sure|decide|confirm|how many/i);
  });

  it('applies the new value in an instead-of correction, not the old one', () => {
    const state = chat('place-an-order', ['I want two blue notebooks', 'Could you change it to five instead of two?']);
    expect(state.dialogue?.values.quantity).toBe('5');
    expect(state.turn).toBe(2);
    expect(response(state)).toMatch(/5 blue notebooks/);
  });

  it('understands compound number words without confusing them with two numbers', () => {
    const state = chat('place-an-order', ['I want twenty three blue notebooks']);
    expect(state.dialogue?.values.quantity).toBe('23');
    expect(response(state)).toMatch(/23 blue notebooks/);
  });

  it('handles a correction after a refusal in the same message', () => {
    const state = chat('reschedule-a-meeting', ['Can we move the meeting?', 'Not two, the later one please']);
    expect(state.dialogue?.values.time).toBe('4 p.m.');
    expect(state.turn).toBe(2);
  });

  it('remembers what the user said when asked for a recap', () => {
    const state = chat('book-a-room', ['Book a room for 3 guests', 'Saturday for 4 nights', 'What dates did I give you?']);
    expect(response(state)).toMatch(/Saturday/);
    expect(response(state)).toMatch(/4 nights/);
    expect(state.turn).toBe(2);
  });

  it('does not use example defaults as remembered user details', () => {
    const state = chat('book-a-room', ['What dates did I give you?']);
    expect(response(state)).toMatch(/haven’t|not.*yet/);
    expect(response(state)).not.toMatch(/Friday|2 guests/);
  });

  it('answers a condition without treating it as an unconditional yes', () => {
    const state = chat('book-a-room', ['A room for two guests', 'Friday for two nights', 'Only if breakfast is included']);
    expect(state.turn).toBe(2);
    expect(response(state)).toMatch(/breakfast is included/);
    expect(response(state)).toMatch(/go ahead|work for you|confirm/i);
  });

  it.each(['I will pass', 'I am afraid that will not work', 'Not for me', 'Hold on, not yet'])('understands a conversational refusal: %s', text => {
    const state = chat('place-an-order', ['Do you have pens?', text, 'yes']);
    expect(state.turn).toBe(0);
    expect(state.dialogue?.values.product).toBeUndefined();
  });

  it('explains a word without losing the outstanding offer', () => {
    const state = chat('plan-a-group-dinner', ['12 people Friday 7 pm together', 'What does adjacent mean?', 'yes']);
    expect(state.replies[1]?.response.text).toMatch(/next to each other/);
    expect(state.dialogue?.values.adjacent).toBe('yes');
    expect(state.turn).toBe(1);
  });

  it('does not turn a hypothetical order into a commitment', () => {
    const state = chat('place-an-order', ['If I ordered three blue notebooks, how much would it cost?']);
    expect(state.turn).toBe(0);
    expect(state.dialogue?.values.quantity).toBeUndefined();
    expect(response(state)).toMatch(/price/);
  });

  it('does not interpret an unrelated why-question as a delivery question', () => {
    const state = chat('track-a-delivery', ['Why is the sky blue?']);
    expect(response(state)).not.toMatch(/courier was delayed/);
    expect(state.turn).toBe(0);
  });

  it('continues answering after completing the practice goals', () => {
    const state = chat('place-an-order', ['Two blue notebooks please', 'When will they arrive?', 'How much do they cost?', 'Thanks']);
    expect(state.turn).toBe(3);
    expect(state.replies).toHaveLength(4);
    expect(state.replies[2]?.response.text).toMatch(/don’t have a notebook price/);
    expect(response(state)).toMatch(/welcome/);
  });

  it('checks a proposed revision before changing completed details', () => {
    let state = chat('place-an-order', ['Two blue notebooks please', 'When will they arrive?', 'Actually make it five notebooks']);
    expect(state.dialogue?.values.quantity).toBe('2');
    expect(state.dialogue?.pendingChange?.quantity).toBe('5');
    expect(response(state)).toMatch(/confirm.*revised/i);
    state = chat('place-an-order', ['How much?', 'yes'], state);
    expect(state.dialogue?.values.quantity).toBe('5');
    expect(state.dialogue?.pendingChange).toBeUndefined();
  });

  it('keeps the original arrangement when the proposed revision is declined', () => {
    const state = chat('reschedule-a-meeting', ['Can we move the meeting?', '2 pm', 'yes', 'Actually the later one instead', 'no']);
    expect(state.turn).toBe(3);
    expect(state.dialogue?.values.time).toBe('2 p.m.');
    expect(state.dialogue?.pendingChange).toBeUndefined();
    expect(response(state)).toMatch(/kept the previous/);
  });

  it.each(['I will reply later', 'First let me think', 'I need to speak to the larger team'])('does not confuse an unrelated adjective with choosing an option: %s', text => {
    const state = chat('reschedule-a-meeting', ['Can we move the meeting?', text]);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.time).toBeUndefined();
  });

  it('adds and removes relative quantities using the remembered order', () => {
    const state = chat('place-an-order', ['Two blue notebooks', 'Could I add three more?', 'remove one notebook']);
    expect(state.dialogue?.values.quantity).toBe('4');
    expect(response(state)).toMatch(/4 blue notebooks/);
  });

  it.each(['-2 notebooks', 'minus two notebooks', '2.5 notebooks'])('asks for a valid count rather than silently changing it: %s', text => {
    const state = chat('place-an-order', ['Blue notebooks', text]);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.quantity).toBeUndefined();
  });

  it('understands changing from an old quantity to a new one', () => {
    const state = chat('place-an-order', ['Two blue notebooks', 'Change from two to five']);
    expect(state.dialogue?.values.quantity).toBe('5');
  });

  it('does not turn a conditional acceptance into confirmed delivery', () => {
    const state = chat('place-an-order', ['Two blue notebooks', 'Yes provided delivery is free']);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.arrival).toBeUndefined();
  });

  it('does not select a slot the user says they cannot attend', () => {
    const state = chat('reschedule-a-meeting', ['Can we move the meeting?', 'I cannot do the earlier slot']);
    expect(state.turn).toBe(1);
    expect(state.dialogue?.values.time).toBeUndefined();
  });

  it('does not overwrite a known name with an unrelated I-am statement', () => {
    const state = chat('meet-a-colleague', ['My name is Sara', 'I am in marketing']);
    expect(state.dialogue?.values.name).toBe('Sara');
  });

  it('adjusts a proposed revision without applying it before confirmation', () => {
    const state = chat('place-an-order', ['Two blue notebooks', 'When will they arrive?', 'Actually make it five notebooks', 'Add one more']);
    expect(state.dialogue?.values.quantity).toBe('2');
    expect(state.dialogue?.pendingChange?.quantity).toBe('6');
  });

  it.each(['Could I possibly get two blue notebooks?', 'Can I please buy two blue notebooks?', 'I was hoping to purchase two blue notebooks'])('understands polite request variations: %s', text => {
    const state = chat('place-an-order', [text]);
    expect(state.turn).toBe(2);
    expect(state.dialogue?.values.quantity).toBe('2');
  });

  it.each(['perfect', 'great thanks', 'that would work'])('accepts short conversational agreement: %s', text => {
    const state = chat('place-an-order', ['Do you have pens?', text]);
    expect(state.turn).toBe(1);
  });
});
