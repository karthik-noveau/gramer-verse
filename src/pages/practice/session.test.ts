import { CATEGORIES, LEVELS, SCENARIOS } from './data';
import { INITIAL_SESSION, reduceSession } from './session';

describe('authored conversation scenarios', () => {
  it('covers every level and category with distinct, complete scenarios', () => {
    expect(SCENARIOS).toHaveLength(12);
    expect(new Set(SCENARIOS.map((scenario) => scenario.id)).size).toBe(SCENARIOS.length);
    for (const level of LEVELS) {
      for (const category of CATEGORIES) {
        expect(SCENARIOS.filter((scenario) => scenario.level === level.id && scenario.category === category.id)).toHaveLength(1);
      }
    }
    const positions = new Set<number>();
    for (const scenario of SCENARIOS) {
      expect(scenario.turns).toHaveLength(3);
      expect(scenario.goal.length).toBeGreaterThan(20);
      expect(scenario.closingTamil).toMatch(/[\u0B80-\u0BFF]/);
      for (const turn of scenario.turns) {
        expect(turn.choices).toHaveLength(3);
        expect(new Set(turn.choices.map((choice) => choice.text)).size).toBe(3);
        expect(turn.choices[turn.answer]).toBeDefined();
        expect(turn.tamil).toMatch(/[\u0B80-\u0BFF]/);
        expect(turn.replyTamil).toMatch(/[\u0B80-\u0BFF]/);
        expect(turn.task).not.toBe('');
        for (const choice of turn.choices) expect(choice.feedback.length).toBeGreaterThan(20);
        positions.add(turn.answer);
      }
    }
    expect([...positions].sort()).toEqual([0, 1, 2]);
  });

  it.each(SCENARIOS.map((scenario) => [scenario.id, scenario] as const))('%s can be completed and restarted', (_id, scenario) => {
    let state = INITIAL_SESSION;
    for (const turn of scenario.turns) {
      state = reduceSession(scenario, state, { type: 'send', text: turn.choices[turn.answer]!.text });
      expect(state.pending).toBe(true);
      state = reduceSession(scenario, state, { type: 'receive' });
    }
    expect(state.turn).toBe(3);
    expect(state.replies).toHaveLength(3);
    expect(reduceSession(scenario, state, { type: 'receive' })).toBe(state);
    expect(reduceSession(scenario, state, { type: 'send', text: 'Hello' }).pending).toBe(true);
    expect(reduceSession(scenario, state, { type: 'restart' })).toEqual(INITIAL_SESSION);
  });

  it('guards empty, overlong, duplicate, and out-of-sequence messages', () => {
    const scenario = SCENARIOS[0]!;
    const turn = scenario.turns[0]!;
    for (const text of ['', '  \n ', 'a'.repeat(601)]) expect(reduceSession(scenario, INITIAL_SESSION, { type: 'send', text })).toBe(INITIAL_SESSION);
    expect(reduceSession(scenario, INITIAL_SESSION, { type: 'receive' })).toBe(INITIAL_SESSION);
    const pending = reduceSession(scenario, INITIAL_SESSION, { type: 'send', text: turn.choices[turn.answer]!.text });
    expect(reduceSession(scenario, pending, { type: 'send', text: 'Hello' })).toBe(pending);
    expect(reduceSession(scenario, pending, { type: 'restart' })).toBe(INITIAL_SESSION);
  });

  it('keeps wrong replies in the chat and allows another message without advancing', () => {
    const scenario = SCENARIOS[0]!;
    const turn = scenario.turns[0]!;
    const wrong = (turn.answer + 1) % 3;
    let state = reduceSession(scenario, INITIAL_SESSION, { type: 'send', text: turn.choices[wrong]!.text });
    state = reduceSession(scenario, state, { type: 'receive' });
    expect(state.turn).toBe(0);
    state = reduceSession(scenario, state, { type: 'send', text: turn.choices[turn.answer]!.text });
    state = reduceSession(scenario, state, { type: 'receive' });
    expect(state.turn).toBe(1);
    expect(state.replies.map((reply) => reply.choice)).toEqual([wrong, turn.answer]);
  });

  it('matches typed phrases with casing, whitespace, and punctuation variations', () => {
    const scenario = SCENARIOS[0]!;
    let state = reduceSession(scenario, INITIAL_SESSION, { type: 'send', text: '  DO you have blue NOTEBOOKS  ' });
    expect(state.replies[0]?.choice).toBe(scenario.turns[0]!.answer);
    state = reduceSession(scenario, state, { type: 'receive' });
    state = reduceSession(scenario, state, { type: 'send', text: 'I’d like two notebooks please!' });
    expect(state.replies[1]?.choice).toBe(scenario.turns[1]!.answer);
  });

  it('accepts an intent-matched free-text reply without assigning it a sample translation', () => {
    const scenario = SCENARIOS[0]!;
    let state = reduceSession(scenario, INITIAL_SESSION, { type: 'send', text: 'Could I have a blue notebook, please?' });
    expect(state.replies[0]?.choice).toBeNull();
    state = reduceSession(scenario, state, { type: 'receive' });
    expect(state.turn).toBe(1);
    expect(state.pending).toBe(false);
  });
});
